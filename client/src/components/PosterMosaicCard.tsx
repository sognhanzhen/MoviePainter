import type { PosterRecord } from "../data/posters";

const layoutClassMap: Record<PosterRecord["layout"], string> = {
  featured: "aspect-[3/4]",
  tall: "aspect-[3/4]",
  wide: "aspect-[3/4]",
  square: "aspect-[3/4]"
};

type PosterMosaicCardProps = {
  actionLabel?: string;
  onActionClick?: () => void;
  onClick: () => void;
  poster: PosterRecord;
  selected?: boolean;
  showMeta?: boolean;
};

export function PosterMosaicCard({
  actionLabel,
  onActionClick,
  onClick,
  poster,
  selected = false,
  showMeta = true
}: PosterMosaicCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-lg bg-[#181918] text-left transition duration-500 ${
        selected
          ? "ring-2 ring-[#ffb4aa]/80 shadow-[0_0_0_4px_rgba(255,180,170,0.12)]"
          : "shadow-[0_16px_34px_rgba(0,0,0,0.22)] hover:scale-[1.02] hover:shadow-[0_22px_46px_rgba(0,0,0,0.34)]"
      } ${layoutClassMap[poster.layout]}`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="absolute inset-0 z-10 cursor-pointer"
      >
        <span className="sr-only">选择海报 {poster.title}</span>
      </button>
      <img
        src={poster.imageUrl}
        alt={poster.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      {showMeta ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/88 via-slate-950/18 to-transparent" />
          <div className="relative z-20 flex h-full flex-col justify-end p-5 text-white">
            <p className="text-[11px] tracking-[0.28em] text-[#ffb4aa] uppercase">
              {poster.genre} / {poster.year}
            </p>
            <h3 className="mt-2 text-xl leading-tight font-semibold">{poster.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-100/88">{poster.summary}</p>
          </div>
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 z-20 flex translate-y-2 flex-col justify-end bg-gradient-to-t from-black/84 via-black/8 to-transparent p-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-[10px] font-bold tracking-[0.24em] text-[#ffb4aa] uppercase">{poster.genre}</p>
          <h3 className="mt-1 font-[var(--font-display)] text-base leading-tight font-semibold text-white">{poster.title}</h3>
        </div>
      )}

      {actionLabel && onActionClick ? (
        <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-30 translate-y-5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={onActionClick}
            className="pointer-events-auto w-full cursor-pointer rounded-lg border border-white/18 bg-white/92 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(5,10,18,0.22)] transition hover:bg-white"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}
