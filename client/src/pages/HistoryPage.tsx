import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { GenerationStatusPill } from "../components/GenerationStatusPill";
import { historyRecords, posterRecords, type HistoryRecord, type PosterRecord } from "../data/posters";
import { getCachedHistoryRecord, getCachedHistoryRecords, mergeHistoryRecords, saveHistoryRecordsSnapshot } from "../lib/history-cache";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { appDataRequest } from "../lib/api";

export function HistoryPage() {
  const { status, token } = useAuth();
  const { posters } = usePosterCatalog(token);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("加载中");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const cachedRecords = getCachedHistoryRecords();

      if (cachedRecords.length > 0) {
        setRecords(cachedRecords);
        setLoading(false);
        setMessage("本地缓存，同步中");
      } else {
        setLoading(true);
        setMessage("加载中");
      }

      try {
        const response = await appDataRequest.getHistory(token);

        if (cancelled) {
          return;
        }

        const mergedRecords = mergeHistoryRecords(response.records, getCachedHistoryRecords());
        saveHistoryRecordsSnapshot(mergedRecords);
        setRecords(mergedRecords.length > 0 ? mergedRecords : historyRecords);
        setMessage(`已同步 ${response.source}`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const cachedRecords = getCachedHistoryRecords();
        setRecords(cachedRecords.length > 0 ? cachedRecords : historyRecords);
        setMessage(error instanceof Error ? error.message : "历史记录加载失败");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!token) {
      if (status === "authenticated") {
        setRecords(mergeHistoryRecords(getCachedHistoryRecords(), historyRecords));
        setLoading(false);
        setMessage("本地缓存");
      } else {
        setRecords(historyRecords);
        setLoading(false);
        setMessage("演示数据");
      }
      return;
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">History</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">历史生成记录</h2>
        <p className="mt-4 rounded-[1.2rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message} / {records.length} 条
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[220px] animate-pulse rounded-[2rem] border border-white/60 bg-white/75" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const poster = findPoster(posters, record.posterId) ?? findPoster(posterRecords, record.posterId);
            const cachedDetail = getCachedHistoryRecord(record.id);
            const thumbnail = cachedDetail?.results[0] ?? null;
            
            // If the record succeeded but we don't have the generated image yet (loading from Supabase), don't fallback to poster image.
            const imageUrl = thumbnail?.imageUrl ?? record.previewImageUrl ?? (record.status === "succeeded" ? "" : poster?.imageUrl) ?? "";
            const imageAlt = thumbnail?.title ?? record.previewTitle ?? (record.status === "succeeded" ? "AI生成图加载中" : poster?.title) ?? "历史生成图";
            const displayTitle = thumbnail?.title ?? record.previewTitle ?? (record.status === "succeeded" ? "生成图同步中..." : poster?.title) ?? "未找到参考海报";
            const displayOutputs = cachedDetail ? cachedDetail.results.length || record.outputs : record.outputs;

            return (
              <article
                key={record.id}
                className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-950/5 backdrop-blur md:grid-cols-[220px_1fr]"
              >
                <div className="relative overflow-hidden rounded-[1.6rem] bg-slate-950">
                  {imageUrl ? (
                    <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
                  ) : record.status === "succeeded" ? (
                    <div className="flex h-full min-h-[220px] items-center justify-center bg-slate-100">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                        <span className="text-xs font-medium tracking-[0.2em] text-slate-400">SYNCING</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-400">暂无图片</div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-4 p-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Generation Record</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{displayTitle}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{record.prompt}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <GenerationStatusPill status={record.status} />
                      <Link
                        to={`/history/${record.id}`}
                        className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <MetaItem label="模式" value={record.mode === "chat" ? "AI Chat" : "AI Draw"} />
                    <MetaItem label="时间" value={record.createdAt} />
                    <MetaItem label="输出数" value={`${displayOutputs} 张`} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function findPoster(posters: PosterRecord[], posterId: string) {
  return posters.find((poster) => poster.id === posterId) ?? null;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-900/8 bg-slate-50 px-4 py-3">
      <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
