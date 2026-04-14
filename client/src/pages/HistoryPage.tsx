import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { GenerationStatusPill } from "../components/GenerationStatusPill";
import { historyRecords, posterRecords, type HistoryRecord, type PosterRecord } from "../data/posters";
import { getCachedHistoryRecords, mergeHistoryRecords } from "../lib/history-cache";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { appDataRequest } from "../lib/api";

export function HistoryPage() {
  const { status, token } = useAuth();
  const { posters } = usePosterCatalog(token);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在加载你的历史生成记录...");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setMessage("正在加载你的历史生成记录...");

      try {
        const response = await appDataRequest.getHistory(token);

        if (cancelled) {
          return;
        }

        const mergedRecords = mergeHistoryRecords(response.records, getCachedHistoryRecords());
        setRecords(mergedRecords.length > 0 ? mergedRecords : historyRecords);
        setMessage(`已接入 ${response.source} 数据源。`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const cachedRecords = getCachedHistoryRecords();
        setRecords(cachedRecords.length > 0 ? cachedRecords : historyRecords);
        setMessage(
          error instanceof Error
            ? `${error.message}，当前先展示本地缓存或演示记录。`
            : "历史记录加载失败，当前先展示本地缓存或演示记录。"
        );
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
        setMessage("当前登录态已恢复，但后端令牌暂不可用，先展示本地缓存的历史资产。");
      } else {
        setRecords(historyRecords);
        setLoading(false);
        setMessage("当前没有登录令牌，先展示本地演示历史资产。");
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
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          这里按时间查看你的历史生成任务、参考海报和当前状态，已经接入后端历史记录接口。
        </p>
        <p className="mt-4 rounded-[1.2rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
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

            return (
              <article
                key={record.id}
                className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-950/5 backdrop-blur md:grid-cols-[220px_1fr]"
              >
                <div className="overflow-hidden rounded-[1.6rem] bg-slate-950">
                  <img src={poster?.imageUrl} alt={poster?.title} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-col justify-between gap-4 p-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Generation Record</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{poster?.title ?? "未找到参考海报"}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{record.prompt}</p>
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

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-4">
                    <MetaItem label="模式" value={record.mode === "chat" ? "AI Chat" : "AI Draw"} />
                    <MetaItem label="时间" value={record.createdAt} />
                    <MetaItem label="输出数" value={`${record.outputs} 张`} />
                    <MetaItem label="记录编号" value={record.id} />
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
