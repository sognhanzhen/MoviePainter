import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type {
  AuthenticatedUser,
  HistoryDrawInputRecord,
  HistoryOutputRecord,
  HistoryRecord,
  HistoryRecordDetail,
  UserSettingsInput,
  UserSettingsRecord
} from "../domain/app-data.js";

const require = createRequire(import.meta.url);

type UserRow = {
  created_at: string;
  email: string;
  id: number;
  name: string;
  password: string;
};

type UserSettingsRow = {
  created_at: string;
  display_name: string;
  language: string;
  notification_enabled: number;
  preferred_default_mode: "chat" | "draw";
  updated_at: string;
  user_id: number;
};

type GenerationRecordRow = {
  created_at: string;
  error_message: string | null;
  id: string;
  mode: "chat" | "draw";
  output_count: number;
  preview_image_url?: string | null;
  preview_title?: string | null;
  prompt_text: string;
  source_origin: string;
  source_poster_id: string | null;
  status: "draft" | "failed" | "queued" | "running" | "succeeded" | "waiting";
  updated_at: string;
  user_id: number;
};

type GenerationDrawInputRow = {
  aspect_ratio_value: string | null;
  character_value: string | null;
  composition_value: string | null;
  created_at: string;
  generation_id: string;
  id: string;
  mood_value: string | null;
  selected_modules_json: string;
  style_value: string | null;
  tone_value: string | null;
  updated_at: string;
  weights_json: string;
};

type GenerationOutputRow = {
  created_at: string;
  generation_id: string;
  height: number | null;
  id: string;
  image_url: string;
  output_order: number;
  summary: string | null;
  thumbnail_url: string | null;
  title: string | null;
  width: number | null;
};

type CreateGenerationRecordInput = {
  errorMessage?: string | null;
  mode: "chat" | "draw";
  outputCount: number;
  posterId: string;
  prompt: string;
  sourceOrigin: string;
  status: "failed" | "running" | "succeeded" | "waiting";
  userId: number;
};

type CreateGenerationDrawInput = {
  aspectRatioValue?: string | null;
  characterValue?: string | null;
  compositionValue?: string | null;
  generationId: string;
  moodValue?: string | null;
  selectedModules: string[];
  styleValue?: string | null;
  toneValue?: string | null;
  weights: Record<string, number>;
};

type CreateGenerationOutputInput = {
  generationId: string;
  height?: number | null;
  imageUrl: string;
  outputOrder: number;
  summary?: string | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  width?: number | null;
};

export type LocalDatabase = {
  createGenerationDrawInput: (input: CreateGenerationDrawInput) => HistoryDrawInputRecord;
  createGenerationOutput: (input: CreateGenerationOutputInput) => HistoryOutputRecord;
  createGenerationRecord: (input: CreateGenerationRecordInput) => HistoryRecord;
  createUser: (input: { email: string; hashedPassword: string; name: string }) => LocalUserRecord;
  database: DatabaseSync;
  ensureUserSettings: (user: LocalUserRecord) => UserSettingsRecord;
  findUserByEmail: (email: string) => UserRow | undefined;
  getGenerationRecord: (input: { generationId: string; userId: number }) => HistoryRecordDetail | null;
  getHistoryRecords: (userId: number) => HistoryRecord[];
  getUserById: (id: number) => LocalUserRecord | undefined;
  getUserSettings: (userId: number) => UserSettingsRecord | null;
  updateUserSettings: (userId: number, input: UserSettingsInput) => UserSettingsRecord;
};

export type LocalUserRecord = {
  createdAt: string;
  email: string;
  id: number;
  name: string;
};

export function createLocalDatabase(databasePath: string): LocalDatabase {
  try {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  } catch (err) {
    console.warn("Failed to create database directory, ignoring (may be Vercel /tmp or read-only volume):", err);
  }

  let database: DatabaseSync;
  try {
    const sqlite = require("node:sqlite");
    database = new sqlite.DatabaseSync(databasePath);
  } catch (err) {
    console.error("[Server] Fallback: node:sqlite not available on this platform, creating dummy database instance", err);
    // Create a dummy mock database to avoid crashing Vercel Demo
    database = {
      prepare: () => ({ get: () => undefined, run: () => ({ lastInsertRowid: 1 }), all: () => [] }),
      exec: () => {}
    } as unknown as DatabaseSync;
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      display_name TEXT NOT NULL,
      preferred_default_mode TEXT NOT NULL DEFAULT 'chat',
      language TEXT NOT NULL DEFAULT 'zh-CN',
      notification_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS generation_records (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('chat', 'draw')),
      status TEXT NOT NULL CHECK (status IN ('draft', 'queued', 'waiting', 'running', 'succeeded', 'failed')),
      source_poster_id TEXT,
      source_origin TEXT NOT NULL DEFAULT 'workspace',
      prompt_text TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      output_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS generation_draw_inputs (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL UNIQUE,
      character_value TEXT,
      style_value TEXT,
      mood_value TEXT,
      tone_value TEXT,
      composition_value TEXT,
      aspect_ratio_value TEXT,
      selected_modules_json TEXT NOT NULL DEFAULT '[]',
      weights_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (generation_id) REFERENCES generation_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS generation_outputs (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      width INTEGER,
      height INTEGER,
      output_order INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (generation_id) REFERENCES generation_records(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_generation_records_user_id ON generation_records(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_generation_records_source_poster_id ON generation_records(source_poster_id);
    CREATE INDEX IF NOT EXISTS idx_generation_outputs_generation_id ON generation_outputs(generation_id, output_order);
  `);

  function getUserById(id: number) {
    const row = database
      .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
      .get(id) as Omit<UserRow, "password"> | undefined;

    return row ? mapUser(row) : undefined;
  }

  function ensureUserSettings(user: LocalUserRecord) {
    const existing = getUserSettings(user.id);

    if (existing) {
      return existing;
    }

    database
      .prepare(
        "INSERT INTO user_settings (user_id, display_name, preferred_default_mode, language, notification_enabled) VALUES (?, ?, 'chat', 'zh-CN', 1)"
      )
      .run(user.id, user.name);

    const created = getUserSettings(user.id);

    if (!created) {
      throw new Error("无法初始化用户设置");
    }

    return created;
  }

  function getUserSettings(userId: number) {
    const row = database
      .prepare(
        "SELECT user_id, display_name, preferred_default_mode, language, notification_enabled, created_at, updated_at FROM user_settings WHERE user_id = ?"
      )
      .get(userId) as UserSettingsRow | undefined;

    return row ? mapSettings(row) : null;
  }

  function listGenerationOutputs(generationId: string) {
    const rows = database
      .prepare(
        `
          SELECT id, generation_id, image_url, thumbnail_url, width, height, output_order, title, summary, created_at
          FROM generation_outputs
          WHERE generation_id = ?
          ORDER BY output_order ASC, created_at ASC
        `
      )
      .all(generationId) as GenerationOutputRow[];

    return rows.map(mapGenerationOutput);
  }

  function getGenerationDrawInput(generationId: string) {
    const row = database
      .prepare(
        `
          SELECT id, generation_id, character_value, style_value, mood_value, tone_value, composition_value,
                 aspect_ratio_value, selected_modules_json, weights_json, created_at, updated_at
          FROM generation_draw_inputs
          WHERE generation_id = ?
        `
      )
      .get(generationId) as GenerationDrawInputRow | undefined;

    return row ? mapGenerationDrawInput(row) : null;
  }

  function getGenerationRecordRow(input: { generationId: string; userId: number }) {
    return database
      .prepare(
        `
          SELECT id, user_id, mode, status, source_poster_id, source_origin, prompt_text, error_message, output_count, created_at, updated_at
          FROM generation_records
          WHERE id = ? AND user_id = ?
        `
      )
      .get(input.generationId, input.userId) as GenerationRecordRow | undefined;
  }

  function getHistoryRecords(userId: number) {
    const rows = database
      .prepare(
        `
          SELECT
            records.id, records.user_id, records.mode, records.status, records.source_poster_id, records.source_origin,
            records.prompt_text, records.error_message, records.output_count, records.created_at, records.updated_at,
            (
              SELECT title
              FROM generation_outputs
              WHERE generation_id = records.id
              ORDER BY output_order ASC
              LIMIT 1
            ) AS preview_title,
            (
              SELECT COALESCE(thumbnail_url, image_url)
              FROM generation_outputs
              WHERE generation_id = records.id
              ORDER BY output_order ASC
              LIMIT 1
            ) AS preview_image_url
          FROM generation_records AS records
          WHERE records.user_id = ?
          ORDER BY records.created_at DESC
        `
      )
      .all(userId) as GenerationRecordRow[];

    return rows.map(mapGenerationRecord);
  }

  function getGenerationRecord(input: { generationId: string; userId: number }) {
    const row = getGenerationRecordRow(input);

    if (!row) {
      return null;
    }

    return {
      ...mapGenerationRecord(row),
      drawInputs: getGenerationDrawInput(row.id),
      outputsDetail: listGenerationOutputs(row.id)
    };
  }

  function createGenerationRecord(input: CreateGenerationRecordInput) {
    const id = randomUUID();
    const now = new Date().toISOString();

    database
      .prepare(
        `
          INSERT INTO generation_records (
            id, user_id, mode, status, source_poster_id, source_origin, prompt_text, error_message, output_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        input.userId,
        input.mode,
        input.status,
        input.posterId,
        input.sourceOrigin,
        input.prompt,
        input.errorMessage ?? null,
        input.outputCount,
        now,
        now
      );

    return mapGenerationRecord({
      created_at: now,
      error_message: input.errorMessage ?? null,
      id,
      mode: input.mode,
      output_count: input.outputCount,
      prompt_text: input.prompt,
      source_origin: input.sourceOrigin,
      source_poster_id: input.posterId,
      status: input.status,
      updated_at: now,
      user_id: input.userId
    });
  }

  function createGenerationDrawInput(input: CreateGenerationDrawInput) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const selectedModulesJson = JSON.stringify(input.selectedModules);
    const weightsJson = JSON.stringify(input.weights);

    database
      .prepare(
        `
          INSERT INTO generation_draw_inputs (
            id, generation_id, character_value, style_value, mood_value, tone_value, composition_value,
            aspect_ratio_value, selected_modules_json, weights_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        input.generationId,
        input.characterValue ?? null,
        input.styleValue ?? null,
        input.moodValue ?? null,
        input.toneValue ?? null,
        input.compositionValue ?? null,
        input.aspectRatioValue ?? null,
        selectedModulesJson,
        weightsJson,
        now,
        now
      );

    return mapGenerationDrawInput({
      aspect_ratio_value: input.aspectRatioValue ?? null,
      character_value: input.characterValue ?? null,
      composition_value: input.compositionValue ?? null,
      created_at: now,
      generation_id: input.generationId,
      id,
      mood_value: input.moodValue ?? null,
      selected_modules_json: selectedModulesJson,
      style_value: input.styleValue ?? null,
      tone_value: input.toneValue ?? null,
      updated_at: now,
      weights_json: weightsJson
    });
  }

  function createGenerationOutput(input: CreateGenerationOutputInput) {
    const now = new Date().toISOString();
    const id = randomUUID();

    database
      .prepare(
        `
          INSERT INTO generation_outputs (
            id, generation_id, image_url, thumbnail_url, width, height, output_order, title, summary, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        input.generationId,
        input.imageUrl,
        input.thumbnailUrl ?? null,
        input.width ?? null,
        input.height ?? null,
        input.outputOrder,
        input.title ?? null,
        input.summary ?? null,
        now
      );

    return mapGenerationOutput({
      created_at: now,
      generation_id: input.generationId,
      height: input.height ?? null,
      id,
      image_url: input.imageUrl,
      output_order: input.outputOrder,
      summary: input.summary ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      title: input.title ?? null,
      width: input.width ?? null
    });
  }

  return {
    createGenerationDrawInput,
    createGenerationOutput,
    createGenerationRecord,
    createUser(input) {
      const result = database
        .prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
        .run(input.name, input.email, input.hashedPassword);

      const created = database
        .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
        .get(result.lastInsertRowid) as Omit<UserRow, "password">;

      return mapUser(created);
    },
    database,
    ensureUserSettings,
    findUserByEmail(email) {
      return database
        .prepare("SELECT id, email, name, password, created_at FROM users WHERE email = ?")
        .get(email) as UserRow | undefined;
    },
    getGenerationRecord,
    getHistoryRecords,
    getUserById,
    getUserSettings,
    updateUserSettings(userId, input) {
      const user = getUserById(userId);

      if (!user) {
        throw new Error("用户不存在");
      }

      const now = new Date().toISOString();

      database
        .prepare(
          `
            INSERT INTO user_settings (
              user_id, display_name, preferred_default_mode, language, notification_enabled, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM user_settings WHERE user_id = ?), ?), ?)
            ON CONFLICT(user_id) DO UPDATE SET
              display_name = excluded.display_name,
              preferred_default_mode = excluded.preferred_default_mode,
              language = excluded.language,
              notification_enabled = excluded.notification_enabled,
              updated_at = excluded.updated_at
          `
        )
        .run(
          userId,
          input.displayName,
          input.preferredDefaultMode,
          input.language,
          input.notificationEnabled ? 1 : 0,
          userId,
          now,
          now
        );

      const updated = getUserSettings(userId);

      if (!updated) {
        throw new Error("无法更新用户设置");
      }

      return updated;
    }
  };
}

  function mapGenerationRecord(row: GenerationRecordRow): HistoryRecord {
    return {
      createdAt: row.created_at,
      errorMessage: row.error_message,
      id: row.id,
      mode: row.mode,
      outputs: row.output_count,
      posterId: row.source_poster_id ?? "",
      previewImageUrl: row.preview_image_url ?? null,
      previewTitle: row.preview_title ?? null,
      prompt: row.prompt_text,
      sourceOrigin: row.source_origin,
      status: normalizeHistoryStatus(row.status)
    };
  }

function mapGenerationDrawInput(row: GenerationDrawInputRow): HistoryDrawInputRecord {
  return {
    aspectRatioValue: row.aspect_ratio_value,
    characterValue: row.character_value,
    compositionValue: row.composition_value,
    createdAt: row.created_at,
    generationId: row.generation_id,
    id: row.id,
    moodValue: row.mood_value,
    selectedModules: parseJsonArray(row.selected_modules_json),
    styleValue: row.style_value,
    toneValue: row.tone_value,
    updatedAt: row.updated_at,
    weights: parseJsonRecord(row.weights_json)
  };
}

function mapGenerationOutput(row: GenerationOutputRow): HistoryOutputRecord {
  return {
    createdAt: row.created_at,
    height: row.height,
    id: row.id,
    imageUrl: row.image_url,
    outputOrder: row.output_order,
    summary: row.summary,
    thumbnailUrl: row.thumbnail_url,
    title: row.title,
    width: row.width
  };
}

function mapSettings(row: UserSettingsRow): UserSettingsRecord {
  return {
    displayName: row.display_name,
    language: row.language,
    notificationEnabled: row.notification_enabled === 1,
    preferredDefaultMode: row.preferred_default_mode,
    updatedAt: row.updated_at
  };
}

function mapUser(row: Omit<UserRow, "password">): LocalUserRecord {
  return {
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    name: row.name
  };
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, rawValue]) =>
        typeof rawValue === "number" ? [[key, rawValue]] : []
      )
    );
  } catch {
    return {};
  }
}

function normalizeHistoryStatus(status: GenerationRecordRow["status"]): HistoryRecord["status"] {
  if (status === "failed") {
    return "failed";
  }

  if (status === "running") {
    return "running";
  }

  if (status === "succeeded") {
    return "succeeded";
  }

  return "waiting";
}
