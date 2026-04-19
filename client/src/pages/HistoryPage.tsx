import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type { HistoryOutputRecord, HistoryRecord, HistoryRecordDetail, WorkspaceGeneratedResult } from "../data/posters";
import { appDataRequest } from "../lib/api";
import { getCachedHistoryRecord, getCachedHistoryRecords, saveHistoryRecordsSnapshot } from "../lib/history-cache";

export function HistoryPage() {
  const { status, token } = useAuth();
  // Instantly seed from localStorage — zero loading delay
  const [records, setRecords] = useState<HistoryRecord[]>(() => filterGeneratedHistoryRecords(getCachedHistoryRecords()));
  const [loading, setLoading] = useState(records.length === 0); // only show loading skeleton when truly empty
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(24);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeHistoryDetail, setActiveHistoryDetail] = useState<HistoryRecordDetail | null>(null);
  const [activeHistoryLoading, setActiveHistoryLoading] = useState(false);
  const [activeHistoryMessage, setActiveHistoryMessage] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const detailRequestRef = useRef(0);
  const activeHistoryIndex = activeHistoryId ? records.findIndex((record) => record.id === activeHistoryId) : -1;
  const activeHistorySummary = activeHistoryId ? records.find((record) => record.id === activeHistoryId) ?? null : null;
  const activePanelRecord = activeHistoryDetail ?? buildSummaryRecordDetail(activeHistorySummary);
  const canViewNewerHistory = activeHistoryIndex > 0;
  const canViewOlderHistory = activeHistoryIndex >= 0 && activeHistoryIndex < records.length - 1;

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLimit((prev) => prev + 24);
      }
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const lastElementRef = (node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    if (node && records.length > limit) {
      observerRef.current?.observe(node);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      // Don't show skeleton if we already have cached data
      if (records.length === 0) setLoading(true);
      setError(null);

      try {
        const response = await appDataRequest.getHistory(token);

        if (!cancelled) {
          // Merge server records with local cache, update cache
          const merged = saveHistoryRecordsSnapshot(response.records);
          setRecords(filterGeneratedHistoryRecords(merged));
        }
      } catch (err) {
        if (!cancelled) {
          // On network error, keep showing cached data silently
          if (records.length === 0) {
            setError(err instanceof Error ? err.message : "获取历史记录失败");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (status !== "loading") {
      void loadHistory();
    }

    return () => {
      cancelled = true;
    };
  }, [token, status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openHistoryPanel(record: HistoryRecord) {
    setActiveHistoryId(record.id);
    await loadHistoryDetail(record.id);
  }

  async function loadHistoryDetail(historyId: string) {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    const cachedDetail = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId), records);

    if (cachedDetail) {
      setActiveHistoryDetail(cachedDetail);
      setActiveHistoryLoading(false);
      setActiveHistoryMessage("显示缓存");
    } else {
      setActiveHistoryDetail(null);
      setActiveHistoryLoading(true);
      setActiveHistoryMessage("加载中");
    }

    if (!token) {
      setActiveHistoryLoading(false);
      setActiveHistoryMessage(cachedDetail ? (status === "authenticated" ? "显示缓存" : "演示数据") : "未找到记录");
      return;
    }

    try {
      const response = await appDataRequest.getHistoryRecord(token, historyId);

      if (detailRequestRef.current !== requestId) {
        return;
      }

      setActiveHistoryDetail(response.record);
      setActiveHistoryMessage(`已同步 ${response.source}`);
    } catch (err) {
      const fallbackDetail = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId), records);

      if (detailRequestRef.current !== requestId) {
        return;
      }

      if (!cachedDetail) {
        setActiveHistoryDetail(fallbackDetail);
      }

      setActiveHistoryMessage(fallbackDetail ? "显示缓存" : err instanceof Error ? err.message : "未找到记录");
    } finally {
      if (detailRequestRef.current === requestId) {
        setActiveHistoryLoading(false);
      }
    }
  }

  function browseHistoryPanel(direction: "newer" | "older") {
    const nextIndex = direction === "newer" ? activeHistoryIndex - 1 : activeHistoryIndex + 1;
    const nextRecord = records[nextIndex];

    if (!nextRecord) {
      return;
    }

    void openHistoryPanel(nextRecord);
  }

  return (
    <section>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-[#111211]">
              <div className="aspect-[3/4] animate-pulse rounded-t-lg bg-white/5" />
              <div className="space-y-2 p-3">
                <div className="h-3 animate-pulse rounded bg-white/6" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/6" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-8 shadow-sm">
          <p className="text-sm font-semibold text-rose-200">历史记录加载失败</p>
          <p className="mt-2 text-sm text-rose-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-rose-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
          >
            重试
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/5 p-12 text-center text-neutral-400">
          <p className="text-sm">暂无生成记录，去工作区开始创作吧。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {records.slice(0, limit).map((record, index) => {
            const isLast = index === Math.min(records.length, limit) - 1;
            return (
              <div key={record.id} ref={isLast ? lastElementRef : null}>
                <HistoryCard
                  record={record}
                  onClick={() => {
                    void openHistoryPanel(record);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {activeHistoryId ? (
        <HistoryInspectPanel
          canViewNewer={canViewNewerHistory}
          canViewOlder={canViewOlderHistory}
          historyCount={records.length}
          loading={activeHistoryLoading}
          message={activeHistoryMessage}
          onBrowseHistory={browseHistoryPanel}
          onClose={() => {
            setActiveHistoryId(null);
            setActiveHistoryDetail(null);
            setActiveHistoryLoading(false);
            setActiveHistoryMessage("");
          }}
          record={activePanelRecord}
        />
      ) : null}
    </section>
  );
}

function HistoryInspectPanel({
  canViewNewer,
  canViewOlder,
  historyCount,
  loading,
  message,
  onBrowseHistory,
  onClose,
  record
}: {
  canViewNewer: boolean;
  canViewOlder: boolean;
  historyCount: number;
  loading: boolean;
  message: string;
  onBrowseHistory: (direction: "newer" | "older") => void;
  onClose: () => void;
  record: HistoryRecordDetail | null;
}) {
  const displayResults = buildHistoryDisplayResults(record);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [record?.id, displayResults.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#0b0c0c]/78 px-4 py-20 backdrop-blur-[18px]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,31,31,0.88)_0%,rgba(10,10,10,0.96)_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,180,170,0.08),transparent_28%,rgba(229,9,20,0.08)_70%,transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />

      <div className="relative z-10 flex h-full max-h-[calc(100vh-10rem)] w-full max-w-6xl items-center justify-center">
        <div className="relative flex h-[min(78vh,760px)] w-full flex-col overflow-visible">
          <div className="absolute top-0 left-[calc(100%+0.75rem)] z-[110] flex shrink-0 flex-col items-center gap-2 rounded-xl bg-[#1c1b1b]/82 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
            <HistoryPanelIconButton label="关闭历史查看面板" onClick={onClose}>
              ×
            </HistoryPanelIconButton>

            {historyCount > 1 ? (
              <>
                <HistoryTaskButton
                  disabled={!canViewOlder}
                  label="上一条历史记录"
                  symbol="↑"
                  onClick={() => onBrowseHistory("older")}
                />
                <HistoryTaskButton
                  disabled={!canViewNewer}
                  label="下一条历史记录"
                  symbol="↓"
                  onClick={() => onBrowseHistory("newer")}
                />
              </>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#1c1b1b]/82 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
            <div className="relative flex min-h-0 flex-1 flex-col p-4 md:p-6">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pt-12 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)] xl:pt-0">
                <div className="grid min-h-0 grid-cols-1 gap-1.5 xl:grid-cols-[minmax(16rem,1fr)_10.75rem]">
                  <HistoryPreviewSurface
                    activeImageIndex={activeImageIndex}
                    displayResults={displayResults}
                    loading={loading}
                    record={record}
                  />

                  <HistorySecondaryStack
                    activeImageIndex={activeImageIndex}
                    displayResults={displayResults}
                    loading={loading}
                    onSelectImage={setActiveImageIndex}
                  />
                </div>

                <div className="flex min-h-0 flex-col">
                  <HistoryTaskSidebar loading={loading} message={message} record={record} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryPreviewSurface({
  activeImageIndex,
  displayResults,
  loading,
  record
}: {
  activeImageIndex: number;
  displayResults: WorkspaceGeneratedResult[];
  loading: boolean;
  record: HistoryRecordDetail | null;
}) {
  const mainResult = displayResults[activeImageIndex] ?? displayResults[0] ?? null;

  return (
    <div className="flex min-h-0 items-center justify-center">
      {mainResult ? (
        <HistoryVariationTile active index={activeImageIndex} result={mainResult} variant="main" />
      ) : (
        <HistoryThumbnailPlaceholder
          index={activeImageIndex}
          message={loading ? "加载历史记录" : record ? "暂无图片" : "未找到历史记录"}
          variant="main"
        />
      )}
    </div>
  );
}

function HistorySecondaryStack({
  activeImageIndex,
  displayResults,
  loading,
  onSelectImage
}: {
  activeImageIndex: number;
  displayResults: WorkspaceGeneratedResult[];
  loading: boolean;
  onSelectImage: (imageIndex: number) => void;
}) {
  const secondarySlots = Array.from({ length: 4 }, (_, imageIndex) => ({
    imageIndex,
    result: displayResults[imageIndex] ?? null
  }))
    .filter((slot) => slot.imageIndex !== activeImageIndex)
    .slice(0, 3);

  return (
    <div className="grid min-h-0 grid-cols-3 gap-1.5 xl:grid-cols-1 xl:grid-rows-3">
      {secondarySlots.map(({ imageIndex, result }) =>
        result ? (
          <HistoryVariationTile
            active={activeImageIndex === imageIndex}
            index={imageIndex}
            key={result.id}
            result={result}
            onSelect={() => onSelectImage(imageIndex)}
            variant="secondary"
          />
        ) : (
          <HistoryThumbnailPlaceholder
            index={imageIndex}
            key={`empty-${imageIndex}`}
            message={loading ? "加载中" : "暂无图片"}
            variant="secondary"
          />
        )
      )}
    </div>
  );
}

function HistoryVariationTile({
  active,
  index,
  onSelect,
  result,
  variant = "secondary"
}: {
  active: boolean;
  index: number;
  onSelect?: () => void;
  result: WorkspaceGeneratedResult;
  variant?: "main" | "secondary";
}) {
  const sizeClassName =
    variant === "main"
      ? "mx-auto h-full max-h-full w-auto max-w-full max-xl:h-auto max-xl:w-full"
      : "w-full xl:mx-auto xl:h-full xl:w-auto xl:max-w-full";
  const interactiveClassName = onSelect ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e50914]/50" : "";

  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onSelect();
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `切换到第 ${index + 1} 张生成图` : undefined}
      className={`group relative aspect-[3/4] min-h-0 overflow-hidden rounded-[0.95rem] border border-white/6 bg-white/5 text-left ${sizeClassName} ${interactiveClassName} ${
        active ? "" : "opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
      }`}
    >
      <img src={result.imageUrl} alt={result.title || "生成图"} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      <div className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
        {formatGenerationImageIndex(index)}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/70 via-black/28 to-transparent px-3 pt-10 pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <a
          href={result.imageUrl}
          target="_blank"
          rel="noreferrer"
          download
          onClick={(event) => event.stopPropagation()}
          className="pointer-events-auto rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-9 py-3.5 font-[var(--font-ui)] text-base font-extrabold text-white shadow-[0_10px_30px_rgba(229,9,20,0.28)] transition hover:scale-[1.02] active:scale-95"
        >
          Download
        </a>
      </div>
    </article>
  );
}

function HistoryThumbnailPlaceholder({
  index,
  message,
  variant = "secondary"
}: {
  index: number;
  message: string;
  variant?: "main" | "secondary";
}) {
  const sizeClassName =
    variant === "main"
      ? "mx-auto h-full max-h-full w-auto max-w-full max-xl:h-auto max-xl:w-full"
      : "w-full xl:mx-auto xl:h-full xl:w-auto xl:max-w-full";

  return (
    <div className={`relative aspect-[3/4] min-h-0 overflow-hidden rounded-[0.95rem] border border-white/6 bg-white/[0.025] ${sizeClassName}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_55%)]" />
      <span className="absolute top-2 left-2 rounded-full bg-black/42 px-2 py-0.5 text-[10px] font-bold text-white/42">
        {formatGenerationImageIndex(index)}
      </span>
      <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-xs font-semibold tracking-[0.18em] text-white/32 uppercase">
        {message}
      </span>
    </div>
  );
}

function HistoryTaskSidebar({
  loading,
  message,
  record
}: {
  loading: boolean;
  message: string;
  record: HistoryRecordDetail | null;
}) {
  return (
    <aside className="px-1 py-2 text-neutral-100">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.24em] text-white/38 uppercase">Prompt</p>
          <p className="mt-2 max-h-28 overflow-y-auto pr-1 text-sm leading-6 text-white/80 italic">
            {record?.prompt.trim() || (loading ? "Loading history detail." : "Describe the movie poster you want to create.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm leading-6 font-semibold text-white/82">
          <span>{record ? formatGenerationMode(record.mode) : "AI Chat"}</span>
          <span>{record ? `${record.outputs} Output` : "0 Output"}</span>
          <span>{record ? formatGeneratedAt(record.createdAt) : "History"}</span>
        </div>

        {message ? (
          <p className="text-[11px] leading-5 font-semibold tracking-[0.12em] text-white/36 uppercase">{message}</p>
        ) : null}
      </div>
    </aside>
  );
}

function HistoryPanelIconButton({
  children,
  label,
  onClick
}: {
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition hover:bg-white/14 hover:text-white"
    >
      {children}
    </button>
  );
}

function HistoryTaskButton({
  disabled,
  label,
  onClick,
  symbol
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  symbol: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-disabled={disabled}
        aria-label={label}
        onClick={(event) => {
          event.currentTarget.blur();

          if (!disabled) {
            onClick();
          }
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition ${
          disabled
            ? "cursor-not-allowed opacity-30"
            : "cursor-pointer hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/45"
        }`}
      >
        {symbol}
      </button>
      <div className="pointer-events-none absolute top-1/2 right-full z-50 mr-3 -translate-y-1/2 rounded-lg bg-[#181918]/98 px-3 py-2 text-xs font-semibold whitespace-nowrap text-neutral-100 opacity-0 shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}

function HistoryCard({ record, onClick }: { record: HistoryRecord; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${formatGenerationMode(record.mode)} 生成记录，${record.outputs} Output，${formatGeneratedAt(record.createdAt)}`}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-white/10 bg-[#111211] shadow-sm outline-none transition hover:-translate-y-1 hover:border-[#ffb4aa] hover:shadow-[0_0_0_1px_rgba(229,9,20,0.42),0_18px_42px_rgba(0,0,0,0.32)] focus-visible:border-[#ffb4aa] focus-visible:ring-2 focus-visible:ring-[#ffb4aa]/45"
    >
      <div className="relative aspect-[3/4] bg-[#181918]">
        {record.previewImageUrl ? (
          <img
            src={record.previewImageUrl}
            alt={record.previewTitle ?? "Thumbnail"}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-500">
            暂无图片
          </div>
        )}
      </div>

      <div className="space-y-2 bg-[#111211] px-4 py-3">
        <p className="truncate text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
          {formatGenerationMode(record.mode)}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
          <span className="min-w-0 truncate">{record.outputs} Output</span>
          <time className="shrink-0 text-right" dateTime={record.createdAt}>
            {formatGeneratedAt(record.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

function formatGenerationMode(mode: HistoryRecord["mode"]) {
  return mode === "chat" ? "AI Chat" : "AI Draw";
}

function filterGeneratedHistoryRecords(records: HistoryRecord[]) {
  return records.filter((record) => record.outputs > 0 && record.status === "succeeded");
}

function buildSummaryRecordDetail(record: HistoryRecord | null): HistoryRecordDetail | null {
  return record
    ? {
        ...record,
        drawInputs: null,
        outputsDetail: []
      }
    : null;
}

function buildFallbackRecordDetail(
  historyId: string,
  cachedDetail: ReturnType<typeof getCachedHistoryRecord>,
  records: HistoryRecord[]
): HistoryRecordDetail | null {
  if (cachedDetail) {
    return {
      ...cachedDetail.record,
      drawInputs: null,
      outputsDetail: cachedDetail.results.map((result, index) => mapCachedResultToOutput(result, index))
    };
  }

  return buildSummaryRecordDetail(records.find((record) => record.id === historyId) ?? null);
}

function buildHistoryDisplayResults(record: HistoryRecordDetail | null): WorkspaceGeneratedResult[] {
  if (!record) {
    return [];
  }

  if (record.outputsDetail.length > 0) {
    return record.outputsDetail.slice(0, 4).map((output, index) => ({
      id: output.id,
      imageUrl: output.thumbnailUrl ?? output.imageUrl,
      summary: output.summary ?? "",
      title: output.title ?? `生成图 ${index + 1}`
    }));
  }

  if (record.previewImageUrl) {
    return [
      {
        id: `${record.id}-preview`,
        imageUrl: record.previewImageUrl,
        summary: record.prompt,
        title: record.previewTitle ?? "生成图"
      }
    ];
  }

  return [];
}

function mapCachedResultToOutput(result: WorkspaceGeneratedResult, index: number): HistoryOutputRecord {
  return {
    createdAt: new Date().toISOString(),
    id: result.id,
    imageUrl: result.imageUrl,
    outputOrder: index,
    summary: result.summary,
    title: result.title
  };
}

function formatGenerationImageIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}
