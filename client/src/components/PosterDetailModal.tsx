import { useState } from "react";
import type { PosterRecord, WorkspaceMode } from "../data/posters";

type PosterDetailModalProps = {
  onClose: () => void;
  onSelectMode: (mode: WorkspaceMode) => void;
  poster: PosterRecord;
  selectingMode: boolean;
};

export function PosterDetailModal({
  onClose,
  onSelectMode,
  poster,
  selectingMode
}: PosterDetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-2xl shadow-slate-950/25">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase"
        >
          Close
        </button>

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-h-[420px] bg-slate-950">
            {imgFailed ? (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#2a1a2e] via-[#1a1a2e] to-[#0d1117] p-8 text-center">
                <span className="text-5xl">🎬</span>
                <p className="mt-4 font-[var(--font-display)] text-xl font-bold text-white/80">{poster.title}</p>
                <p className="mt-2 text-sm tracking-widest text-[#ffb4aa]/70 uppercase">{poster.genre} / {poster.year}</p>
              </div>
            ) : (
              <img
                src={poster.imageUrl}
                alt={poster.title}
                className="h-full w-full object-cover"
                onError={() => setImgFailed(true)}
              />
            )}
          </div>

          <div className="flex flex-col justify-between gap-8 p-8 sm:p-10">
            <div className="space-y-6">
              <div>
                <p className="text-xs tracking-[0.28em] text-sky-700 uppercase">Poster Detail</p>
                <h2 className="mt-3 text-3xl leading-tight font-semibold text-slate-950">{poster.title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{poster.summary}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaCard label="年份" value={poster.year} />
                <MetaCard label="类型" value={poster.genre} />
                <MetaCard label="导演" value={poster.director ?? poster.region} />
                <MetaCard label="上映" value={poster.releaseDate ?? poster.year} />
                <MetaCard label="构图" value={poster.attributes.composition} />
                <MetaCard label="来源" value={poster.imdbId ?? poster.region} />
              </div>

              <div className="rounded-[1.5rem] border border-slate-900/8 bg-slate-50 p-5">
                <p className="text-sm leading-7 text-slate-600">{poster.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {poster.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-900/10 bg-slate-950 px-3 py-1 text-xs font-medium text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-900/8 bg-slate-950 p-5 text-white">
              <p className="text-xs tracking-[0.26em] text-sky-200 uppercase">Use This Poster</p>

              {selectingMode ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onSelectMode("chat")}
                    className="rounded-[1.25rem] bg-white px-4 py-4 text-left text-slate-950 transition hover:bg-slate-100"
                  >
                    <p className="text-sm font-semibold">AI Chat</p>
                    <p className="mt-1 text-sm text-slate-600">把海报带进对话框上下文，继续通过聊天完成创作。</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode("draw")}
                    className="rounded-[1.25rem] border border-white/20 bg-white/10 px-4 py-4 text-left transition hover:bg-white/16"
                  >
                    <p className="text-sm font-semibold text-white">AI Draw</p>
                    <p className="mt-1 text-sm text-slate-200">把海报带进 Draw 工作区，作为参数参考对象。</p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectMode("chat")}
                  className="mt-4 rounded-[1.25rem] bg-sky-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                >
                  Use
                </button>
              )}

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {selectingMode
                  ? "请选择进入 AI Chat 或 AI Draw。"
                  : "点击后先选择创作模式，再跳转到对应工作区。"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
