import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PosterDetailModal } from "../components/PosterDetailModal";
import { PosterMosaicCard } from "../components/PosterMosaicCard";
import type { PosterRecord, WorkspaceMode } from "../data/posters";
import { usePosterCatalog } from "../hooks/usePosterCatalog";

export function LibraryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedPoster, setSelectedPoster] = useState<PosterRecord | null>(null);
  const [selectingMode, setSelectingMode] = useState(false);
  const { error, loading, posters, source } = usePosterCatalog(token);

  const filters = ["全部", ...new Set(posters.map((poster) => poster.genre))];

  const visiblePosters =
    activeFilter === "全部" ? posters : posters.filter((poster) => poster.genre === activeFilter);

  function openPoster(poster: PosterRecord) {
    setSelectedPoster(poster);
    setSelectingMode(false);
  }

  function handleUse(mode: WorkspaceMode) {
    if (!selectedPoster) {
      return;
    }

    if (!selectingMode) {
      setSelectingMode(true);
      return;
    }

    navigate(`/workspace?mode=${mode}&posterId=${selectedPoster.id}&source=library`);
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">Official Library</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">官方精选海报库</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          这里是当前阶段的官方精选海报入口。你可以先筛选、浏览详情，再决定把某张海报带入 AI Chat 还是 AI Draw。
        </p>
        <p className="mt-4 inline-flex rounded-full border border-slate-900/8 bg-slate-50 px-4 py-2 text-xs tracking-[0.22em] text-slate-500 uppercase">
          Data Source / {source}
        </p>
        {error ? (
          <p className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {error}
          </p>
        ) : null}
      </header>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-950/5 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Top Filters</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter
                  ? "bg-slate-950 text-white"
                  : "border border-slate-900/10 bg-slate-50 text-slate-600 hover:border-sky-300 hover:text-slate-950"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="grid auto-rows-[180px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`animate-pulse rounded-[1.9rem] border border-white/60 bg-white/70 ${
                index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            />
          ))}
        </section>
      ) : (
        <section className="grid auto-rows-[180px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visiblePosters.map((poster) => (
            <PosterMosaicCard key={poster.id} poster={poster} onClick={() => openPoster(poster)} />
          ))}
        </section>
      )}

      {selectedPoster ? (
        <PosterDetailModal
          poster={selectedPoster}
          selectingMode={selectingMode}
          onClose={() => {
            setSelectedPoster(null);
            setSelectingMode(false);
          }}
          onSelectMode={handleUse}
        />
      ) : null}
    </section>
  );
}
