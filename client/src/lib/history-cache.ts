import type {
  AppDataSource,
  HistoryRecord,
  WorkspaceGenerationResponse,
  WorkspaceGenerationTask,
  WorkspaceGeneratedResult
} from "../data/posters";

const HISTORY_CACHE_KEY = "moviepainter-generated-history";

type CachedHistoryDetail = {
  insight: string;
  record: HistoryRecord;
  results: WorkspaceGeneratedResult[];
  savedAt: string;
  source: AppDataSource | "workspace-cache";
  task: WorkspaceGenerationTask;
};

type CachedHistoryMap = Record<string, CachedHistoryDetail>;

function readCache(): CachedHistoryMap {
  try {
    const raw = localStorage.getItem(HISTORY_CACHE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as CachedHistoryMap;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CachedHistoryMap) {
  try {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota or privacy mode failures.
  }
}

function normalizeHistoryRecord(response: WorkspaceGenerationResponse): HistoryRecord {
  return {
    createdAt: response.task.submittedAt,
    id: response.task.id,
    mode: response.task.mode,
    outputs: response.results.length,
    posterId: response.task.posterId,
    prompt: response.task.prompt,
    status: response.task.status === "succeeded" ? "succeeded" : "waiting"
  };
}

export function saveGeneratedHistorySnapshot(response: WorkspaceGenerationResponse) {
  const cache = readCache();
  const record = normalizeHistoryRecord(response);

  cache[record.id] = {
    insight: response.insight,
    record,
    results: response.results,
    savedAt: new Date().toISOString(),
    source: response.source,
    task: response.task
  };

  writeCache(cache);
  return cache[record.id];
}

export function getCachedHistoryRecord(historyId: string) {
  return readCache()[historyId] ?? null;
}

export function getCachedHistoryRecords() {
  return Object.values(readCache())
    .map((entry) => entry.record)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function mergeHistoryRecords(primary: HistoryRecord[], secondary: HistoryRecord[]) {
  const merged = new Map<string, HistoryRecord>();

  for (const record of secondary) {
    merged.set(record.id, record);
  }

  for (const record of primary) {
    merged.set(record.id, record);
  }

  return Array.from(merged.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
