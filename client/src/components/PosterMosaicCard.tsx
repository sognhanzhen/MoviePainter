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
      className={`group relative overflow-hidden rounded-[1.8rem] text-left transition ${
        selected
          ? "ring-2 ring-sky-300/70 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]"
          : "shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
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
            <p className="text-[11px] tracking-[0.28em] text-sky-200 uppercase">
              {poster.genre} / {poster.year}
            </p>
            <h3 className="mt-2 text-xl leading-tight font-semibold">{poster.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-100/88">{poster.summary}</p>
          </div>
        </>
      ) : null}

      {actionLabel && onActionClick ? (
        <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-30 translate-y-5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={onActionClick}
            className="pointer-events-auto w-full cursor-pointer rounded-[1.1rem] border border-white/18 bg-white/92 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(5,10,18,0.22)] transition hover:bg-white"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}
