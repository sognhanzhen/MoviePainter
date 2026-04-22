import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthenticatedUser,
  HistoryDrawInputRecord,
  HistoryOutputRecord,
  HistoryRecord,
  HistoryRecordDetail,
  PosterCatalogCategory,
  PosterRecord,
  PosterShortDramaKind,
  ProviderResult,
  UserProfileRecord,
  UserSettingsInput,
  UserSettingsRecord,
  WorkspaceAssetRecordInput,
  WorkspaceAssetRecordResponse,
  WorkspaceGenerationInput,
  WorkspaceGenerationResponse
} from "../domain/app-data.js";
import {
  generateWorkspaceImages,
  type AicanapiImageGeneratorConfig,
  type WorkspaceGenerationProgressHandler
} from "../services/aicanapi-image-generator.js";
import { getPosterPromptPreset } from "../data/poster-prompt-presets.js";
import type { AppDataProvider } from "./app-data-provider.js";

type CreateSupabaseAppDataProviderInput = {
  fallback: AppDataProvider;
  imageGeneratorConfig: AicanapiImageGeneratorConfig;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

type SupabaseProfileRow = {
  avatar_url: string | null;
  created_at: string;
  display_name: string;
  id: string;
  role: "user" | "editor" | "admin";
  status: "active" | "invited" | "disabled";
  updated_at: string;
};

type SupabaseSettingsRow = {
  created_at: string;
  id: string;
  language: string;
  notification_enabled: boolean;
  preferred_default_mode: "chat" | "draw";
  updated_at: string;
  user_id: string;
};

type SupabaseGenerationRecordRow = {
  created_at: string;
  error_message: string | null;
  id: string;
  mode: "chat" | "draw";
  output_count: number;
  preview_image_url?: string | null;
  prompt_text: string;
  source_origin: string;
  source_poster_id: string | null;
  status: "draft" | "failed" | "queued" | "running" | "succeeded" | "waiting";
  updated_at: string;
  user_id: string;
};

type SupabaseGenerationDrawInputRow = {
  aspect_ratio_value: string | null;
  character_value: string | null;
  composition_value: string | null;
  created_at: string;
  generation_id: string;
  id: string;
  mood_value: string | null;
  selected_modules_json: unknown;
  style_value: string | null;
  tone_value: string | null;
  updated_at: string;
  weights_json: unknown;
};

type SupabaseGenerationOutputRow = {
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

export function createSupabaseAppDataProvider({
  fallback,
  imageGeneratorConfig,
  supabaseServiceRoleKey,
  supabaseUrl
}: CreateSupabaseAppDataProviderInput): AppDataProvider {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return {
    async generateWorkspace(input: {
      generation: WorkspaceGenerationInput;
      onProgress?: WorkspaceGenerationProgressHandler;
      user: AuthenticatedUser;
    }): Promise<ProviderResult<WorkspaceGenerationResponse>> {
      if (input.user.kind === "local") {
        return fallback.generateWorkspace(input);
      }

      const poster = await getPosterById(supabase, fallback, input.generation.posterId);

      if (!poster.data) {
        throw new Error("参考海报不存在");
      }

      const generated = await generateWorkspaceImages({
        config: imageGeneratorConfig,
        generation: input.generation,
        onProgress: input.onProgress,
        poster: poster.data
      });
      const results = generated.results;

      input.onProgress?.({
        imageCount: results.length,
        message: "正在保存生成记录与图片结果。",
        phase: "saving",
        timestamp: new Date().toISOString(),
        totalImages: results.length
      });

      const record = await insertGenerationRecord(supabase, {
        mode: input.generation.mode,
        outputCount: results.length,
        posterId: poster.data.id,
        prompt: input.generation.prompt,
        sourceOrigin: input.generation.sourceOrigin ?? "workspace",
        status: "succeeded",
        userId: input.user.id
      });

      if (input.generation.mode === "draw") {
        const selectedModules = new Set(input.generation.selectedModules);
        await supabase.from("generation_draw_inputs").upsert(
          {
            aspect_ratio_value: input.generation.ratioId ?? null,
            character_value: selectedModules.has("shotScale") || selectedModules.has("characterPosition") || selectedModules.has("character")
              ? input.generation.prompt
              : null,
            composition_value: selectedModules.has("composition") ? poster.data.attributes.composition : null,
            generation_id: record.id,
            mood_value: selectedModules.has("atmosphere") || selectedModules.has("mood") ? poster.data.attributes.mood : null,
            selected_modules_json: input.generation.selectedModules,
            style_value: selectedModules.has("style") ? poster.data.attributes.style : null,
            tone_value: selectedModules.has("tone") ? poster.data.attributes.tone : null,
            weights_json: input.generation.moduleWeights
          },
          { onConflict: "generation_id" }
        );
      }

      await Promise.all(
        results.map(async (result, index) => {
          const { error } = await supabase.from("generation_outputs").insert({
            generation_id: record.id,
            height: generated.height,
            image_url: result.imageUrl,
            output_order: index,
            summary: result.summary,
            thumbnail_url: resolvePreviewThumbnailUrl(result.imageUrl),
            title: result.title,
            width: generated.width
          });

          if (error) {
            throw error;
          }
        })
      );

      input.onProgress?.({
        imageCount: results.length,
        message: `已保存 ${results.length} 张生成图。`,
        phase: "succeeded",
        timestamp: new Date().toISOString(),
        totalImages: results.length
      });

      return {
        data: {
          insight: generated.insight,
          results,
          source: "supabase",
          task: {
            appliedModules: input.generation.selectedModules,
            id: record.id,
            modelId: input.generation.modelId,
            mode: input.generation.mode,
            moduleWeights: input.generation.moduleWeights,
            posterId: poster.data.id,
            posterTitle: poster.data.title,
            prompt: input.generation.prompt,
            ratioId: input.generation.ratioId,
            status: "succeeded",
            submittedAt: record.createdAt
          }
        },
        source: "supabase"
      };
    },
    async getHistoryRecord(input: { historyId: string; user: AuthenticatedUser }): Promise<ProviderResult<HistoryRecordDetail | null>> {
      if (input.user.kind === "local") {
        return fallback.getHistoryRecord(input);
      }

      const record = await getGenerationRecord(supabase, {
        generationId: input.historyId,
        userId: input.user.id
      });

      if (!record) {
        return {
          data: null,
          source: "supabase"
        };
      }

      const [drawInputs, outputs] = await Promise.all([
        getGenerationDrawInput(supabase, record.id),
        getGenerationOutputs(supabase, record.id)
      ]);

      return {
        data: {
          ...record,
          drawInputs,
          outputsDetail: outputs
        },
        source: "supabase"
      };
    },
    async getHistoryRecords(user: AuthenticatedUser): Promise<ProviderResult<HistoryRecord[]>> {
      if (user.kind === "local") {
        return fallback.getHistoryRecords(user);
      }

      const { data, error } = await supabase
        .from("generation_records")
        .select("id, user_id, mode, status, source_poster_id, source_origin, prompt_text, error_message, output_count, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const records = (data ?? []).map((row) => mapGenerationRecord(row as SupabaseGenerationRecordRow));
      const previews = await getGenerationPreviews(supabase, records.map((record) => record.id));

      return {
        data: records.map((record) => {
          const preview = previews.get(record.id);

          return {
            ...record,
            previewImageUrl: preview?.previewImageUrl ?? record.previewImageUrl ?? null,
            previewTitle: preview?.previewTitle ?? null
          };
        }),
        source: "supabase"
      };
    },
    async getPosterById(id: string): Promise<ProviderResult<PosterRecord | null>> {
      return getPosterById(supabase, fallback, id);
    },
    async getPosters(): Promise<ProviderResult<PosterRecord[]>> {
      try {
        const { data, error } = await supabase
          .from("curated_posters")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error || !data || data.length === 0) {
          return fallback.getPosters();
        }

        const posterIds = data.map((item) => String(item.id));
        const [{ data: attrs, error: attrsError }, { data: tagRelations, error: tagsError }] = await Promise.all([
          supabase.from("curated_poster_attributes").select("*").in("poster_id", posterIds),
          supabase.from("poster_tag_relations").select("poster_id, tags(name)").in("poster_id", posterIds)
        ]);

        if (attrsError || tagsError) {
          return fallback.getPosters();
        }

        const normalizedTagRelations = (tagRelations ?? []) as Array<{
          poster_id: string | number;
          tags?: { name?: string | null } | Array<{ name?: string | null }> | null;
        }>;

        const mapped = data.map((item) => {
          const posterId = String(item.id);
          const attribute = attrs?.find((entry) => String(entry.poster_id) === posterId);
          const tags = normalizedTagRelations
            .filter((relation) => String(relation.poster_id) === posterId)
            .flatMap((relation) => {
              const rawTagValue = relation.tags;

              if (!rawTagValue) {
                return [];
              }

              return Array.isArray(rawTagValue)
                ? rawTagValue.map((tag) => tag.name).filter((tag): tag is string => Boolean(tag))
                : [rawTagValue.name].filter((tag): tag is string => Boolean(tag));
            });

          return {
            attributes: {
              character: attribute?.character_value ?? "待补充",
              composition: attribute?.composition_value ?? "待补充",
              mood: attribute?.mood_value ?? "待补充",
              ratio: attribute?.aspect_ratio_value ?? "2:3 竖版",
              style: attribute?.style_value ?? "待补充",
              tone: attribute?.tone_value ?? "待补充"
            },
            catalogCategory: normalizeCatalogCategory(item.catalog_category),
            catalogSubcategory: normalizeShortDramaKind(item.catalog_subcategory),
            description: String(item.description ?? item.summary ?? ""),
            director: String(item.region ?? "未标注"),
            genre: String(item.genre ?? "未分类"),
            id: posterId,
            imageUrl: String(item.cover_image_url ?? ""),
            layout: normalizeLayout(item.layout),
            promptPresets: getPosterPromptPreset(posterId),
            region: String(item.region ?? "未标注"),
            summary: String(item.summary ?? ""),
            tags,
            title: String(item.title ?? "Untitled Poster"),
            year: String(item.release_year ?? item.year ?? "2026")
          } satisfies PosterRecord;
        });

        return {
          data: mapped,
          source: "supabase"
        };
      } catch {
        return fallback.getPosters();
      }
    },
    async getProfile(user: AuthenticatedUser): Promise<ProviderResult<UserProfileRecord>> {
      if (user.kind === "local") {
        return fallback.getProfile(user);
      }

      const row = await ensureUserProfile(supabase, user);

      return {
        data: mapProfile(row, user),
        source: "supabase"
      };
    },
    async getUserSettings(user: AuthenticatedUser): Promise<ProviderResult<UserSettingsRecord>> {
      if (user.kind === "local") {
        return fallback.getUserSettings(user);
      }

      const [profileRow, settingsRow] = await Promise.all([ensureUserProfile(supabase, user), ensureUserSettings(supabase, user)]);

      return {
        data: mapSettings({
          displayName: profileRow.display_name,
          settings: settingsRow
        }),
        source: "supabase"
      };
    },
    async recordWorkspaceAsset(input: { asset: WorkspaceAssetRecordInput; user: AuthenticatedUser }): Promise<ProviderResult<WorkspaceAssetRecordResponse>> {
      if (input.user.kind === "local") {
        return fallback.recordWorkspaceAsset(input);
      }

      await ensureUserProfile(supabase, input.user);

      const poster = await getPosterById(supabase, fallback, input.asset.posterId);

      if (!poster.data) {
        throw new Error("参考海报不存在");
      }

      const record = await insertGenerationRecord(supabase, {
        mode: input.asset.mode,
        outputCount: 0,
        posterId: poster.data.id,
        prompt: input.asset.prompt?.trim() || buildWorkspaceAssetPrompt(input.asset, poster.data),
        sourceOrigin: input.asset.sourceOrigin ?? input.asset.action,
        status: "waiting",
        userId: input.user.id
      });

      return {
        data: {
          record,
          source: "supabase"
        },
        source: "supabase"
      };
    },
    async updateUserSettings(input: {
      settings: UserSettingsInput;
      user: AuthenticatedUser;
    }): Promise<ProviderResult<UserSettingsRecord>> {
      if (input.user.kind === "local") {
        return fallback.updateUserSettings(input);
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .upsert(
          {
            language: input.settings.language,
            notification_enabled: input.settings.notificationEnabled,
            preferred_default_mode: input.settings.preferredDefaultMode,
            user_id: input.user.id
          },
          { onConflict: "user_id" }
        )
        .select("id, user_id, preferred_default_mode, language, notification_enabled, created_at, updated_at")
        .single();

      if (settingsError || !settingsData) {
        throw settingsError ?? new Error("更新用户设置失败");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .upsert(
          {
            avatar_url: input.user.avatarUrl ?? null,
            display_name: input.settings.displayName,
            id: input.user.id,
            role: input.user.role ?? "user",
            status: input.user.status ?? "active"
          },
          { onConflict: "id" }
        )
        .select("id, display_name, avatar_url, role, status, created_at, updated_at")
        .single();

      if (profileError || !profileData) {
        throw profileError ?? new Error("更新用户展示名称失败");
      }

      return {
        data: mapSettings({
          displayName: profileData.display_name,
          settings: settingsData as SupabaseSettingsRow
        }),
        source: "supabase"
      };
    }
  };
}

function buildWorkspaceAssetPrompt(input: WorkspaceAssetRecordInput, poster: PosterRecord) {
  if (input.mode === "chat" && poster.promptPresets?.aiChat) {
    return poster.promptPresets.aiChat;
  }

  if (input.mode === "draw" && poster.promptPresets?.aiDraw.prompt) {
    return poster.promptPresets.aiDraw.prompt;
  }

  const modeLabel = input.mode === "chat" ? "AI Chat" : "AI Draw";
  const originText = input.action === "library_use" ? "从海报库" : "从生成工作区";

  return `${originText}将《${poster.title}》作为 ${modeLabel} 参考资产加入工作区。`;
}

function resolvePreviewThumbnailUrl(imageUrl: string) {
  return imageUrl.startsWith("data:") ? null : imageUrl;
}

async function ensureUserProfile(supabase: SupabaseClient, user: Extract<AuthenticatedUser, { kind: "supabase" }>) {
  const { data: existing, error: selectError } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url, role, status, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return existing as SupabaseProfileRow;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        avatar_url: user.avatarUrl ?? null,
        display_name: user.name,
        id: user.id,
        role: user.role ?? "user",
        status: user.status ?? "active"
      },
      { onConflict: "id" }
    )
    .select("id, display_name, avatar_url, role, status, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("初始化用户资料失败");
  }

  return data as SupabaseProfileRow;
}

async function ensureUserSettings(supabase: SupabaseClient, user: Extract<AuthenticatedUser, { kind: "supabase" }>) {
  const { data: existing, error: selectError } = await supabase
    .from("user_settings")
    .select("id, user_id, preferred_default_mode, language, notification_enabled, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return existing as SupabaseSettingsRow;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        language: "en-US",
        notification_enabled: true,
        preferred_default_mode: "chat",
        user_id: user.id
      },
      { onConflict: "user_id" }
    )
    .select("id, user_id, preferred_default_mode, language, notification_enabled, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("初始化用户设置失败");
  }

  return data as SupabaseSettingsRow;
}

async function insertGenerationRecord(
  supabase: SupabaseClient,
  input: {
    errorMessage?: string | null;
    mode: "chat" | "draw";
    outputCount: number;
    posterId: string;
    prompt: string;
    sourceOrigin: string;
    status: HistoryRecord["status"];
    userId: string;
  }
) {
  const { data, error } = await supabase
    .from("generation_records")
    .insert({
      error_message: input.errorMessage ?? null,
      mode: input.mode,
      output_count: input.outputCount,
      prompt_text: input.prompt,
      source_origin: input.sourceOrigin,
      source_poster_id: input.posterId,
      status: input.status,
      user_id: input.userId
    })
    .select("id, user_id, mode, status, source_poster_id, source_origin, prompt_text, error_message, output_count, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("创建生成记录失败");
  }

  return mapGenerationRecord(data as SupabaseGenerationRecordRow);
}

async function getGenerationRecord(supabase: SupabaseClient, input: { generationId: string; userId: string }) {
  const { data, error } = await supabase
    .from("generation_records")
    .select("id, user_id, mode, status, source_poster_id, source_origin, prompt_text, error_message, output_count, created_at, updated_at")
    .eq("id", input.generationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapGenerationRecord(data as SupabaseGenerationRecordRow) : null;
}

async function getGenerationDrawInput(supabase: SupabaseClient, generationId: string): Promise<HistoryDrawInputRecord | null> {
  const { data, error } = await supabase
    .from("generation_draw_inputs")
    .select("id, generation_id, character_value, style_value, mood_value, tone_value, composition_value, aspect_ratio_value, selected_modules_json, weights_json, created_at, updated_at")
    .eq("generation_id", generationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapGenerationDrawInput(data as SupabaseGenerationDrawInputRow) : null;
}

async function getGenerationOutputs(supabase: SupabaseClient, generationId: string): Promise<HistoryOutputRecord[]> {
  const { data, error } = await supabase
    .from("generation_outputs")
    .select("id, generation_id, image_url, thumbnail_url, width, height, output_order, title, summary, created_at")
    .eq("generation_id", generationId)
    .order("output_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => mapGenerationOutput(row as SupabaseGenerationOutputRow));
}

async function getGenerationPreviews(supabase: SupabaseClient, generationIds: string[]) {
  const previews = new Map<string, { previewImageUrl: string | null; previewTitle: string | null }>();

  if (generationIds.length === 0) {
    return previews;
  }

  const { data, error } = await supabase
    .from("generation_outputs")
    .select("generation_id, thumbnail_url, image_url, title, output_order")
    .in("generation_id", generationIds)
    .order("output_order", { ascending: true });

  if (error || !data) {
    return previews;
  }

  for (const row of data as Array<{ generation_id: string; image_url: string | null; thumbnail_url: string | null; title: string | null }>) {
    if (previews.has(row.generation_id)) {
      continue;
    }

    const previewUrl = row.thumbnail_url ?? row.image_url;

    if (previewUrl || row.title) {
      previews.set(row.generation_id, {
        previewImageUrl: previewUrl,
        previewTitle: row.title
      });
    }
  }

  return previews;
}

async function getPosterById(supabase: SupabaseClient, fallback: AppDataProvider, id: string): Promise<ProviderResult<PosterRecord | null>> {
  try {
    const { data } = await supabase
      .from("curated_posters")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) {
      return fallback.getPosterById(id);
    }

    const { data: attr } = await supabase
      .from("curated_poster_attributes")
      .select("*")
      .eq("poster_id", id)
      .maybeSingle();

    const { data: relations } = await supabase
      .from("poster_tag_relations")
      .select("poster_id, tags(name)")
      .eq("poster_id", id);

    const normalizedTagRelations = (relations ?? []) as Array<{
      poster_id: string | number;
      tags?: { name?: string | null } | Array<{ name?: string | null }> | null;
    }>;

    const tags = normalizedTagRelations.flatMap((relation) => {
      const rawTagValue = relation.tags;

      if (!rawTagValue) {
        return [];
      }

      return Array.isArray(rawTagValue)
        ? rawTagValue.map((tag) => tag.name).filter((tag): tag is string => Boolean(tag))
        : [rawTagValue.name].filter((tag): tag is string => Boolean(tag));
    });

    return {
      data: {
        attributes: {
          character: attr?.character_value ?? "待补充",
          composition: attr?.composition_value ?? "待补充",
          mood: attr?.mood_value ?? "待补充",
          ratio: attr?.aspect_ratio_value ?? "2:3 竖版",
          style: attr?.style_value ?? "待补充",
          tone: attr?.tone_value ?? "待补充"
        },
        catalogCategory: normalizeCatalogCategory(data.catalog_category),
        catalogSubcategory: normalizeShortDramaKind(data.catalog_subcategory),
        description: String(data.description ?? data.summary ?? ""),
        director: String(data.region ?? "未标注"),
        genre: String(data.genre ?? "未分类"),
        id: String(data.id),
        imageUrl: String(data.cover_image_url ?? ""),
        layout: normalizeLayout(data.layout),
        promptPresets: getPosterPromptPreset(String(data.id)),
        region: String(data.region ?? "未标注"),
        summary: String(data.summary ?? ""),
        tags,
        title: String(data.title ?? "Untitled Poster"),
        year: String(data.release_year ?? "2026")
      },
      source: "supabase"
    };
  } catch {
    return fallback.getPosterById(id);
  }
}

function mapProfile(row: SupabaseProfileRow, user: Extract<AuthenticatedUser, { kind: "supabase" }>): UserProfileRecord {
  return {
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    displayName: row.display_name,
    email: user.email,
    id: row.id,
    name: row.display_name,
    role: row.role,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function mapSettings(input: { displayName: string; settings: SupabaseSettingsRow }): UserSettingsRecord {
  return {
    displayName: input.displayName,
    language: input.settings.language,
    notificationEnabled: input.settings.notification_enabled,
    preferredDefaultMode: input.settings.preferred_default_mode,
    updatedAt: input.settings.updated_at
  };
}

function mapGenerationRecord(row: SupabaseGenerationRecordRow): HistoryRecord {
  return {
    createdAt: row.created_at,
    errorMessage: row.error_message,
    id: row.id,
    mode: row.mode,
    outputs: row.output_count,
    posterId: row.source_poster_id ?? "",
    previewImageUrl: row.preview_image_url ?? null,
    prompt: row.prompt_text,
    sourceOrigin: row.source_origin,
    status: normalizeHistoryStatus(row.status)
  };
}

function mapGenerationDrawInput(row: SupabaseGenerationDrawInputRow): HistoryDrawInputRecord {
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

function mapGenerationOutput(row: SupabaseGenerationOutputRow): HistoryOutputRecord {
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

function buildWorkspaceResults(input: {
  generation: WorkspaceGenerationInput;
  poster: PosterRecord;
  posterPool: PosterRecord[];
  userId: string;
}) {
  const posterPool = input.posterPool;

  const appliedModulesText =
    input.generation.mode === "draw"
      ? input.generation.selectedModules.length > 0
        ? `已融合 ${input.generation.selectedModules.length} 个模块：${input.generation.selectedModules.join("、")}`
        : "当前以参考海报整体风格为主导"
      : `围绕《${input.poster.title}》的叙事气质生成新的创意方向`;

  return posterPool.map((poster, index) => ({
    id: `result-${input.generation.mode}-${input.poster.id}-${input.userId}-${index + 1}`,
    imageUrl: poster.imageUrl,
    summary:
      index === 0
        ? `${appliedModulesText}，优先输出一版更贴近参考海报气质的电影海报。`
        : index === 1
          ? `在保留原始世界观的前提下，增强 ${input.poster.genre} 题材的商业传播感。`
          : index === 2
            ? `作为第三版探索输出，尝试拉开角色和场景的戏剧张力，提高提案差异化。`
            : `第四版会进一步压缩无效元素，强化画面的传播性和主视觉记忆点。`,
    title: `${input.poster.title} - ${input.generation.mode === "chat" ? "对话提案" : "参数方案"} ${index + 1}`
  }));
}

function normalizeLayout(layout: unknown): PosterRecord["layout"] {
  return layout === "featured" || layout === "square" || layout === "tall" || layout === "wide"
    ? layout
    : "square";
}

function normalizeCatalogCategory(category: unknown): PosterCatalogCategory | undefined {
  return category === "movie" || category === "series" || category === "short-drama" ? category : undefined;
}

function normalizeShortDramaKind(kind: unknown): PosterShortDramaKind | undefined {
  return kind === "animation" || kind === "live-action" ? kind : undefined;
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(value: unknown) {
  const parse = (input: unknown) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).flatMap(([key, rawValue]) =>
        typeof rawValue === "number" ? [[key, rawValue]] : []
      )
    ) as Record<string, number>;
  };

  if (typeof value === "string") {
    try {
      return parse(JSON.parse(value));
    } catch {
      return {};
    }
  }

  return parse(value);
}

function normalizeHistoryStatus(status: SupabaseGenerationRecordRow["status"]): HistoryRecord["status"] {
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
