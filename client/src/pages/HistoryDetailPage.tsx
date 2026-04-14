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
  const [message, setMessage] = useState("正在加载这条生成记录详情...");

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      setLoading(true);
      setMessage("正在加载这条生成记录详情...");

      try {
        const response = await appDataRequest.getHistoryRecord(token, historyId);

        if (cancelled) {
          return;
        }

        setRecord(response.record);
        setMessage(`详情已从 ${response.source} 数据源加载。`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const fallbackRecord = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId));
        setRecord(fallbackRecord);
        setMessage(
          fallbackRecord
            ? error instanceof Error
              ? `${error.message}，当前先展示本地缓存或演示详情。`
              : "详情加载失败，当前先展示本地缓存或演示详情。"
            : "没有找到这条历史记录。"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!historyId) {
      setRecord(null);
      setLoading(false);
      setMessage("缺少历史记录编号。");
      return;
    }

    if (!token) {
      const fallbackRecord = buildFallbackRecordDetail(historyId, getCachedHistoryRecord(historyId));
      setRecord(fallbackRecord);
      setLoading(false);
      setMessage(
        fallbackRecord
          ? status === "authenticated"
            ? "当前登录态已恢复，但后端令牌暂不可用，先展示本地缓存或演示详情。"
            : "当前先展示本地缓存或演示详情。"
          : "没有找到这条历史记录。"
      );
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

    if (!cachedDetail) {
      return [];
    }

    return cachedDetail.results.map((result, index) => mapCachedResultToOutput(result, index));
  }, [cachedDetail, record]);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="h-28 animate-pulse rounded-[2rem] border border-white/60 bg-white/75" />
        <div className="h-[480px] animate-pulse rounded-[2rem] border border-white/60 bg-white/75" />
      </section>
    );
  }

  if (!record) {
    return (
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">History Detail</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">未找到历史记录</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/history"
            className="rounded-[1.2rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            返回历史记录
          </Link>
          <Link
            to="/workspace"
            className="rounded-[1.2rem] border border-slate-900/10 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
          >
            去生成工作区
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">History Detail</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">历史生成记录详情</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              查看本次生成的参考海报、提示词、模式和输出状态，并可以快速回到对应工作区继续创作。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <GenerationStatusPill status={record.status} />
            <Link
              to="/history"
              className="rounded-[1.15rem] border border-slate-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
            >
              返回列表
            </Link>
            <Link
              to={`/workspace?mode=${record.mode}&posterId=${record.posterId}`}
              className="rounded-[1.15rem] bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              在工作区继续
            </Link>
          </div>
        </div>

        <p className="mt-5 rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-lg shadow-slate-950/5 backdrop-blur">
          <div className="bg-slate-950">
            {poster ? (
              <img src={poster.imageUrl} alt={poster.title} className="h-[420px] w-full object-cover" />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-400">未找到参考海报</div>
            )}
          </div>

          <div className="space-y-5 p-6">
            <div>
              <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Reference Poster</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">{poster?.title ?? "未知海报"}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{poster?.summary ?? "当前记录没有找到对应海报摘要。"}</p>
            </div>

            {poster ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <MetaCard label="年份" value={poster.year} />
                <MetaCard label="类型" value={poster.genre} />
                <MetaCard label="地区" value={poster.region} />
                <MetaCard label="比例" value={poster.attributes.ratio} />
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
            <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Generation Snapshot</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetaCard label="记录编号" value={record.id} />
              <MetaCard label="生成模式" value={record.mode === "chat" ? "AI Chat" : "AI Draw"} />
              <MetaCard label="创建时间" value={record.createdAt} />
              <MetaCard label="输出数量" value={`${record.outputs} 张`} />
            </div>

            {record.sourceOrigin ? (
              <div className="mt-3">
                <MetaCard label="来源" value={record.sourceOrigin} />
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.5rem] border border-slate-900/8 bg-slate-50 p-5">
              <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">Prompt</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{record.prompt}</p>
            </div>

            {record.errorMessage ? (
              <div className="mt-5 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
                <p className="text-xs tracking-[0.24em] text-rose-700 uppercase">Error</p>
                <p className="mt-2 text-sm leading-6 text-rose-900">{record.errorMessage}</p>
              </div>
            ) : null}
          </article>

          <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
            <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Outputs</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">历史资产输出</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              这里展示这次生成沉淀下来的历史资产结果；如果后端结果还没返回，会优先用工作区刚生成的本地缓存做兜底展示。
            </p>

            {cachedDetail && record.outputsDetail.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-sky-700">{cachedDetail.insight}</p>
            ) : null}

            {outputs.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {outputs.map((output) => (
                  <article key={output.id} className="overflow-hidden rounded-[1.35rem] border border-slate-900/8 bg-slate-50">
                    <img src={output.imageUrl} alt={output.title ?? "历史资产输出"} className="h-44 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-sm font-semibold text-slate-950">{output.title ?? `输出 ${output.outputOrder + 1}`}</p>
                      {output.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{output.summary}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                当前还没有可展示的历史输出结果。
              </div>
            )}
          </article>

          {record.drawInputs ? (
            <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
              <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Draw Inputs</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">AI Draw 参数快照</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                这部分是当时落库的模块参数，方便用户回到工作区继续编辑。
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <AttributeCard label="角色" value={record.drawInputs.characterValue ?? "未记录"} />
                <AttributeCard label="风格" value={record.drawInputs.styleValue ?? "未记录"} />
                <AttributeCard label="氛围" value={record.drawInputs.moodValue ?? "未记录"} />
                <AttributeCard label="色调" value={record.drawInputs.toneValue ?? "未记录"} />
                <AttributeCard label="构图" value={record.drawInputs.compositionValue ?? "未记录"} />
                <AttributeCard label="比例" value={record.drawInputs.aspectRatioValue ?? "未记录"} />
              </div>

              {record.drawInputs.selectedModules.length > 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  已启用模块：{record.drawInputs.selectedModules.join("、")}
                </p>
              ) : null}
            </article>
          ) : null}

          <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
            <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">Poster Attributes</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">参考海报参数</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              这部分参数将用于帮助用户理解该条历史记录当时所依赖的视觉参考，也可以作为重新进入工作区时的复用依据。
            </p>

            {poster ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <AttributeCard label="角色" value={poster.attributes.character} />
                <AttributeCard label="风格" value={poster.attributes.style} />
                <AttributeCard label="氛围" value={poster.attributes.mood} />
                <AttributeCard label="色调" value={poster.attributes.tone} />
                <AttributeCard label="构图" value={poster.attributes.composition} />
                <AttributeCard label="比例" value={poster.attributes.ratio} />
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                当前记录没有对应的海报参数可以展示。
              </div>
            )}
          </article>
        </section>
      </div>
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

function AttributeCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.4rem] border border-slate-900/8 bg-slate-50 p-4">
      <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">{label}</p>
      <p className="mt-3 text-sm leading-6 text-slate-800">{value}</p>
    </article>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-900/8 bg-white p-4 shadow-sm">
      <p className="text-xs tracking-[0.22em] text-slate-400 uppercase">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
