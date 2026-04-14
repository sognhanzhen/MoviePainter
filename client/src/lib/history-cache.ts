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

async function createThumbnail(base64DataUrl: string, maxSize = 256): Promise<string> {
  return new Promise((resolve) => {
    if (!base64DataUrl.startsWith("data:")) {
      return resolve(base64DataUrl);
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(base64DataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve(base64DataUrl);
    img.src = base64DataUrl;
  });
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

export async function saveGeneratedHistorySnapshot(response: WorkspaceGenerationResponse) {
  const cache = readCache();
  const record = normalizeHistoryRecord(response);
  
  if (response.results.length > 0) {
    record.previewTitle = response.results[0].title;
    record.previewImageUrl = await createThumbnail(response.results[0].imageUrl);
  }

  cache[record.id] = {
    insight: response.insight,
    record,
    results: response.results,
    savedAt: new Date().toISOString(),
    source: response.source,
    task: response.task
  };

  writeCache(cache);
  saveHistoryRecordsSnapshot([record]);
  return cache[record.id];
}

export function getCachedHistoryRecord(historyId: string) {
  return readCache()[historyId] ?? null;
}


export function mergeHistoryRecords(primary: HistoryRecord[], secondary: HistoryRecord[]) {
  const merged = new Map<string, HistoryRecord>();

  for (const record of secondary) {
    merged.set(record.id, record);
  }

  for (const record of primary) {
    const existing = merged.get(record.id);
    merged.set(record.id, {
      ...existing,
      ...record,
      previewImageUrl: record.previewImageUrl ?? existing?.previewImageUrl ?? null,
      previewTitle: record.previewTitle ?? existing?.previewTitle ?? null
    });
  }

  return Array.from(merged.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

const HISTORY_RECORDS_CACHE_KEY = "moviepainter-history-records";

function readRecordsCache(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_RECORDS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecordsCache(records: HistoryRecord[]) {
  try {
    localStorage.setItem(HISTORY_RECORDS_CACHE_KEY, JSON.stringify(records));
  } catch {
    // Ignore quota errors
  }
}

export function saveHistoryRecordsSnapshot(records: HistoryRecord[]) {
  const mergedRecords = mergeHistoryRecords(records, readRecordsCache());
  writeRecordsCache(mergedRecords);
  return mergedRecords;
}

export async function saveHistoryRecordSnapshot(
  record: HistoryRecord,
  input: {
    insight?: string;
    results?: WorkspaceGeneratedResult[];
    source?: AppDataSource | "workspace-cache";
  } = {}
) {
  const cache = readCache();
  
  if (input.results && input.results.length > 0) {
    record.previewTitle = input.results[0].title;
    record.previewImageUrl = await createThumbnail(input.results[0].imageUrl);
  }

  cache[record.id] = {
    insight: input.insight ?? "这条历史资产记录来自工作区参考海报操作。",
    record,
    results: input.results ?? [],
    savedAt: new Date().toISOString(),
    source: input.source ?? "workspace-cache",
    task: {
      id: record.id,
      mode: record.mode,
      posterId: record.posterId,
      prompt: record.prompt,
      status: "succeeded",
      submittedAt: record.createdAt,
      appliedModules: [],
      moduleWeights: {},
      posterTitle: record.previewTitle ?? "参考海报"
    }
  };

  writeCache(cache);
  saveHistoryRecordsSnapshot([record]);
  return cache[record.id];
}

export function getCachedHistoryRecords() {
  const cachedDetails = Object.values(readCache())
    .map((entry) => entry.record)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  
  return mergeHistoryRecords(cachedDetails, readRecordsCache());
}
