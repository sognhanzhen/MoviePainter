import { useEffect, useState } from "react";
import type { PosterRecord, WorkspaceMode } from "../data/posters";
import { useI18n } from "../i18n/useI18n";
import { getPosterDisplay } from "../lib/poster-localization";

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
  const { language } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);
  const display = getPosterDisplay(poster, language);

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
    <div className="fixed inset-0 z-[90] flex touch-pan-y items-start justify-center overflow-y-auto bg-[#0b0c0c]/78 px-3 py-3 overscroll-contain backdrop-blur-[18px] [-webkit-overflow-scrolling:touch] sm:px-4 sm:py-6 md:items-center md:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,31,31,0.88)_0%,rgba(10,10,10,0.96)_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,180,170,0.08),transparent_28%,rgba(229,9,20,0.08)_70%,transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />

      <div className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-y-auto rounded-xl bg-[#1c1b1b]/82 shadow-[0_24px_70px_rgba(0,0,0,0.56)] overscroll-contain backdrop-blur-2xl [-webkit-overflow-scrolling:touch] md:max-h-[calc(100dvh-6rem)] md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition hover:bg-white/14 hover:text-white"
          aria-label={language === "zh-CN" ? "关闭海报详情" : "Close poster detail"}
        >
          ×
        </button>

        <div className="flex w-full items-center justify-center p-4 pt-14 sm:p-5 sm:pt-14 md:w-5/12 md:p-7 lg:w-1/2">
          <div className="group relative aspect-[3/4] w-full max-w-[min(19rem,72vw)] cursor-pointer overflow-hidden rounded-lg bg-[#0e0e0e] shadow-[0_22px_64px_rgba(0,0,0,0.68)] transition duration-500 hover:scale-[1.015] sm:max-w-sm">
            {imgFailed ? (
              <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,180,170,0.12),transparent_54%),#0e0e0e] p-8 text-center">
                <p className="font-[var(--font-ui)] text-2xl font-extrabold text-white/86">{display.title}</p>
                <p className="mt-3 text-xs tracking-[0.24em] text-[#ffb4aa]/70 uppercase">{display.genre} / {poster.year}</p>
              </div>
            ) : (
              <img
                src={poster.imageUrl}
                alt={display.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                onError={() => setImgFailed(true)}
              />
            )}
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/28" />
          </div>
        </div>

        <div className="relative flex w-full flex-col justify-start p-5 sm:p-7 md:w-7/12 md:justify-center md:p-10 lg:w-1/2 lg:p-12">
          <div className="pointer-events-none absolute top-1/2 right-0 h-56 w-56 -translate-y-1/2 rounded-full bg-[#ffb4aa]/10 blur-[88px]" />

          <div className="relative z-10 space-y-7">
            <div className="space-y-6">
              <div>
                <h2 className="font-[var(--font-ui)] text-3xl leading-tight font-extrabold tracking-normal text-white md:text-4xl">
                  {display.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-neutral-300">{display.summary}</p>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-5 py-1 sm:grid-cols-2">
                <MetaCard label={language === "zh-CN" ? "类型" : "Genre"} value={display.genre} />
                <MetaCard label={language === "zh-CN" ? "上映年份" : "Release Year"} value={poster.year} />
                <MetaCard label={language === "zh-CN" ? "导演" : "Director"} value={display.director} />
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
                    {language === "zh-CN" ? "使用模板" : "Use Template"}
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
