import { useEffect, useState } from "react";
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
  const director = poster.director ?? poster.region;
  const genreLabel = poster.tags[0] ? `${poster.genre} / ${poster.tags[0]}` : poster.genre;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#0b0c0c]/78 px-4 py-20 backdrop-blur-[18px]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,31,31,0.88)_0%,rgba(10,10,10,0.96)_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,180,170,0.08),transparent_28%,rgba(229,9,20,0.08)_70%,transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />

      <div className="relative z-10 flex max-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-[#1c1b1b]/82 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition hover:bg-white/14 hover:text-white"
          aria-label="Close poster detail"
        >
          ×
        </button>

        <div className="flex w-full items-center justify-center p-5 md:w-5/12 md:p-7 lg:w-1/2">
          <div className="group relative aspect-[3/4] w-full max-w-sm cursor-pointer overflow-hidden rounded-lg bg-[#0e0e0e] shadow-[0_22px_64px_rgba(0,0,0,0.68)] transition duration-500 hover:scale-[1.015]">
            {imgFailed ? (
              <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,180,170,0.12),transparent_54%),#0e0e0e] p-8 text-center">
                <p className="font-[var(--font-ui)] text-2xl font-extrabold text-white/86">{poster.title}</p>
                <p className="mt-3 text-xs tracking-[0.24em] text-[#ffb4aa]/70 uppercase">{poster.genre} / {poster.year}</p>
              </div>
            ) : (
              <img
                src={poster.imageUrl}
                alt={poster.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                onError={() => setImgFailed(true)}
              />
            )}
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/28" />
          </div>
        </div>

        <div className="relative flex w-full flex-col justify-center p-7 md:w-7/12 md:p-10 lg:w-1/2 lg:p-12">
          <div className="pointer-events-none absolute top-1/2 right-0 h-56 w-56 -translate-y-1/2 rounded-full bg-[#ffb4aa]/10 blur-[88px]" />

          <div className="relative z-10 space-y-7">
            <div className="space-y-6">
              <div>
                <h2 className="font-[var(--font-ui)] text-3xl leading-tight font-extrabold tracking-normal text-white md:text-4xl">
                  {poster.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-neutral-300">{poster.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-5 py-1">
                <MetaCard label="Genre" value={genreLabel} />
                <MetaCard label="Release Year" value={poster.year} />
                <MetaCard label="Director" value={director} />
              </div>

              {selectingMode ? (
                <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onSelectMode("chat")}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/12 bg-transparent px-7 py-3.5 text-base font-semibold text-neutral-100 transition hover:border-white/24 hover:bg-white/8 sm:w-auto"
                  >
                    AI Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMode("draw")}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/12 bg-transparent px-7 py-3.5 text-base font-semibold text-neutral-100 transition hover:border-white/24 hover:bg-white/8 sm:w-auto"
                  >
                    AI Draw
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onSelectMode("chat")}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-9 py-3.5 font-[var(--font-ui)] text-base font-extrabold text-white shadow-[0_10px_30px_rgba(229,9,20,0.28)] transition hover:scale-[1.02] active:scale-95 sm:w-auto"
                  >
                    Use Template
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs tracking-[0.2em] text-neutral-500 uppercase">{label}</p>
      <p className="text-base font-semibold text-neutral-100">{value}</p>
    </div>
  );
}
