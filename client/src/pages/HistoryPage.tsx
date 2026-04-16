import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { GenerationStatusPill } from "../components/GenerationStatusPill";
import type { HistoryRecord } from "../data/posters";
import { appDataRequest } from "../lib/api";
import { getCachedHistoryRecords, saveHistoryRecordsSnapshot } from "../lib/history-cache";

export function HistoryPage() {
  const { status, token } = useAuth();
  const navigate = useNavigate();
  // Instantly seed from localStorage — zero loading delay
  const [records, setRecords] = useState<HistoryRecord[]>(() => getCachedHistoryRecords());
  const [loading, setLoading] = useState(records.length === 0); // only show loading skeleton when truly empty
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(24);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
          setRecords(merged);
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

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-[#181918] p-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#ffb4aa] uppercase">My Workspace</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">生成历史库</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">管理并查看您在 MoviePainter 创作的所有资产。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/workspace?mode=chat"
              className="rounded-[1.15rem] bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-neutral-200"
            >
              新建 AI Chat
            </Link>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
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
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {records.slice(0, limit).map((record, index) => {
            const isLast = index === Math.min(records.length, limit) - 1;
            return (
              <div key={record.id} ref={isLast ? lastElementRef : null}>
                <HistoryCard
                  record={record}
                  onClick={() => navigate(`/history/${record.id}`)}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HistoryCard({ record, onClick }: { record: HistoryRecord; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="group relative flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111211] shadow-sm transition hover:-translate-y-1 hover:border-[#ffb4aa]/60 hover:shadow-md"
    >
      <div className="relative flex-1 bg-[#181918]">
        {record.previewImageUrl ? (
          <img
            src={record.previewImageUrl}
            alt={record.previewTitle ?? "Thumbnail"}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-500">
            {record.status === "running" || record.status === "waiting" ? "生成中..." : "暂无预览"}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-end bg-[#111211] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] tracking-[0.1em] text-neutral-500 uppercase">
            {record.mode === "chat" ? "AI Chat" : "AI Draw"}
          </p>
          <GenerationStatusPill status={record.status} />
        </div>
        <h3 className="mt-2 line-clamp-1 text-sm font-semibold text-white">
          {record.previewTitle || (record.prompt ? record.prompt.substring(0, 20) + "..." : "未知主题任务")}
        </h3>
        <p className="mt-1 flex items-center justify-between text-xs text-neutral-500">
          <span>{record.outputs} 张输出</span>
          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
    </article>
  );
}
