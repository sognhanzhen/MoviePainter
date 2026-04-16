import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { GenerationStatusPill } from "../components/GenerationStatusPill";
import {
  historyRecords,
  posterRecords,
  type HistoryOutputRecord,
  type HistoryRecordDetail,
  type PosterRecord
} from "../data/posters";
import { getCachedHistoryRecord } from "../lib/history-cache";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { appDataRequest } from "../lib/api";

export function HistoryDetailPage() {
  const { historyId = "" } = useParams();
  const { status, token } = useAuth();
  const { posters } = usePosterCatalog(token);
  const [record, setRecord] = useState<HistoryRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("加载中");
  const [activeOutput, setActiveOutput] = useState<HistoryOutputRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      const initialCache = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId));
      if (initialCache) {
        setRecord(initialCache);
        setLoading(false);
        setMessage("同步最新状态...");
      } else {
        setLoading(true);
        setMessage("加载中");
      }

      try {
        const response = await appDataRequest.getHistoryRecord(token, historyId);

        if (cancelled) {
          return;
        }

        setRecord(response.record);
        setMessage(`已同步 ${response.source}`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (!initialCache) {
          const fallbackRecord = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId));
          setRecord(fallbackRecord);
          setMessage(fallbackRecord ? "显示缓存" : error instanceof Error ? error.message : "未找到记录");
        } else {
          setMessage(error instanceof Error ? error.message : "后台同步失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!historyId) {
      setRecord(null);
      setLoading(false);
      setMessage("缺少记录编号");
      return;
    }

    if (!token) {
      const fallbackRecord = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId));
      setRecord(fallbackRecord);
      setLoading(false);
      setMessage(fallbackRecord ? (status === "authenticated" ? "显示缓存" : "演示数据") : "未找到记录");
      return;
    }

    void loadRecord();

    return () => {
      cancelled = true;
    };
  }, [historyId, status, token]);

  const cachedDetail = useMemo(() => (record ? getCachedHistoryRecord(record.id) : null), [record?.id]);
  const poster = record ? findPoster(posters, record.posterId) ?? findPoster(posterRecords, record.posterId) : null;
  const outputs = useMemo(() => {
    if (!record) {
      return [];
    }

    if (record.outputsDetail.length > 0) {
      return record.outputsDetail;
    }

    return cachedDetail ? cachedDetail.results.map((result, index) => mapCachedResultToOutput(result, index)) : [];
  }, [cachedDetail, record]);
  const primaryOutput = outputs[0] ?? null;
  const heroImageUrl = primaryOutput?.imageUrl ?? poster?.imageUrl ?? "";
  const heroTitle = primaryOutput?.title ?? poster?.title ?? "生成结果";

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        <div className="h-[480px] animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      </section>
    );
  }

  if (!record) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#181918] p-8 shadow-lg backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase">History Detail</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">未找到历史记录</h2>
        <p className="mt-4 text-sm leading-6 text-neutral-400">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/history"
            className="rounded-[1.2rem] bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-neutral-200"
          >
            返回历史记录
          </Link>
          <Link
            to="/workspace"
            className="rounded-[1.2rem] border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            去生成工作区
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[#181918] p-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#ffb4aa] uppercase">History Detail</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">历史记录详情</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">{message}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GenerationStatusPill status={record.status} />
            <Link
              to="/history"
              className="rounded-[1.15rem] border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              返回列表
            </Link>
            <Link
              to={`/workspace?mode=${record.mode}&posterId=${record.posterId}`}
              className="rounded-[1.15rem] bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-neutral-200"
            >
              在工作区继续
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#181918] shadow-lg backdrop-blur">
          <button
            className="block w-full bg-[#111211] text-left"
            disabled={!primaryOutput}
            onClick={() => primaryOutput && setActiveOutput(primaryOutput)}
            type="button"
          >
            {heroImageUrl ? (
              <img src={heroImageUrl} alt={heroTitle} className="h-[520px] w-full object-cover" />
            ) : (
              <div className="flex h-[520px] items-center justify-center text-sm text-neutral-500">暂无图片</div>
            )}
          </button>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs tracking-[0.28em] text-neutral-500 uppercase">
                {primaryOutput ? "Generated Output" : "Reference Poster"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{heroTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">{poster?.title ? `参考：${poster.title}` : "暂无参考海报"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetaCard label="模式" value={record.mode === "chat" ? "AI Chat" : "AI Draw"} />
              <MetaCard label="输出" value={`${outputs.length || record.outputs} 张`} />
              <MetaCard label="时间" value={record.createdAt} />
              <MetaCard label="来源" value={record.sourceOrigin ?? "workspace"} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-[#181918] p-6 shadow-lg backdrop-blur">
            <p className="text-xs tracking-[0.28em] text-neutral-500 uppercase">Prompt</p>
            <p className="mt-3 text-sm leading-7 text-neutral-300">{record.prompt}</p>

            {record.errorMessage ? (
              <div className="mt-5 rounded-2xl border border-[#ffb4aa]/30 bg-[#ffb4aa]/10 p-5">
                <p className="text-xs tracking-[0.24em] text-[#ffdad5] uppercase">Error</p>
                <p className="mt-2 text-sm leading-6 text-[#ffb4aa]">{record.errorMessage}</p>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#181918] p-6 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.28em] text-neutral-500 uppercase">Outputs</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">生成结果</h3>
              </div>
              <p className="text-sm text-neutral-500">点击图片查看大图</p>
            </div>

            {outputs.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {outputs.map((output, index) => (
                  <button
                    key={output.id}
                    className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#111211] text-left transition hover:-translate-y-0.5 hover:border-white/30"
                    onClick={() => setActiveOutput(output)}
                    type="button"
                  >
                    <img src={output.imageUrl} alt={output.title ?? "历史资产输出"} className="h-56 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white">{output.title ?? `生成图 ${index + 1}`}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/5 p-5 text-sm leading-7 text-neutral-400">
                当前还没有可展示的输出结果。
              </div>
            )}
          </article>
        </section>
      </div>

      {activeOutput ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setActiveOutput(null)}
          role="presentation"
        >
          <div className="w-full max-w-6xl" onClick={(event) => event.stopPropagation()} role="presentation">
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <p className="text-sm font-semibold">{activeOutput.title ?? "生成图"}</p>
              <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950" onClick={() => setActiveOutput(null)} type="button">
                关闭
              </button>
            </div>
            <img src={activeOutput.imageUrl} alt={activeOutput.title ?? "生成大图"} className="max-h-[82vh] w-full rounded-[1rem] object-contain" />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function findPoster(posters: PosterRecord[], posterId: string) {
  return posters.find((poster) => poster.id === posterId) ?? null;
}

function buildFallbackRecordDetail(
  historyId: string,
  cachedDetail: ReturnType<typeof getCachedHistoryRecord>
): HistoryRecordDetail | null {
  if (cachedDetail) {
    return {
      ...cachedDetail.record,
      drawInputs: null,
      outputsDetail: cachedDetail.results.map((result, index) => mapCachedResultToOutput(result, index))
    };
  }

  const fallbackRecord = historyRecords.find((item) => item.id === historyId) ?? null;

  return fallbackRecord
    ? {
        ...fallbackRecord,
        drawInputs: null,
        outputsDetail: []
      }
    : null;
}

function mapCachedResultToOutput(result: { id: string; imageUrl: string; summary: string; title: string }, index: number): HistoryOutputRecord {
  return {
    createdAt: new Date().toISOString(),
    id: result.id,
    imageUrl: result.imageUrl,
    outputOrder: index,
    summary: result.summary,
    title: result.title
  };
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/6 bg-white/5 p-4 shadow-sm">
      <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
