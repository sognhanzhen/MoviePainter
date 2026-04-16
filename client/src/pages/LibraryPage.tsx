import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PosterDetailModal } from "../components/PosterDetailModal";
import { PosterMosaicCard } from "../components/PosterMosaicCard";
import type { PosterRecord, WorkspaceMode } from "../data/posters";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { appDataRequest } from "../lib/api";
import { recordWorkspaceAssetUse } from "../lib/workspace-assets";

const genreLabelMap: Record<string, string> = {
  公路: "Road",
  动作: "Action",
  剧情: "Drama",
  喜剧: "Comedy",
  奇幻: "Fantasy",
  悬疑: "Noir",
  爱情: "Romance"
};

const filterLabels = {
  composition: "构图",
  director: "导演",
  era: "年代",
  mood: "氛围",
  style: "风格",
  tone: "色调",
  type: "类型"
} as const;

type FilterKey = keyof typeof filterLabels;

type FilterOption = {
  description: string;
  label: string;
  value: string;
};

type FilterDefinition = {
  key: FilterKey;
  label: string;
  options: FilterOption[];
};

type ActiveFilters = Record<FilterKey, string>;

const defaultFilters: ActiveFilters = {
  composition: "all",
  director: "all",
  era: "all",
  mood: "all",
  style: "all",
  tone: "all",
  type: "all"
};

export function LibraryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(defaultFilters);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [selectedPoster, setSelectedPoster] = useState<PosterRecord | null>(null);
  const [selectingMode, setSelectingMode] = useState(false);
  const { error, loading, posters } = usePosterCatalog(token);
  const [visiblePage, setVisiblePage] = useState(1);
  const VISIBLE_PER_PAGE = 32;
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbPosters, setTmdbPosters] = useState<PosterRecord[]>(() => {
    try {
      const raw = localStorage.getItem("moviepainter-tmdb-catalog");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [syncingTmdb, setSyncingTmdb] = useState(false);
  const [hasMoreTmdb, setHasMoreTmdb] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);


  useEffect(() => {
    let cancelled = false;
    async function loadTmdbPage() {
      if (!token) return;
      setSyncingTmdb(true);
      try {
        const response = await appDataRequest.syncTmdbPosters(token, tmdbPage);
        if (cancelled) return;
        
        if (response.movies && response.movies.length > 0) {
          const mapped: PosterRecord[] = response.movies.map((m: any) => ({
             id: `tmdb-${m.tmdbId}`,
             title: m.title || "Unknown",
             summary: m.overview || "No description available.",
             genre: m.genre || "Drama",
             year: m.year || new Date().getFullYear().toString(),
             director: m.director || "Unknown",
             imageUrl: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
             region: "tmdb",
             layout: "tall",
             tags: m.fullGenre ? m.fullGenre.split(" / ") : [],
             attributes: {
               character: "未知",
               composition: "居中",
               mood: "未知",
               ratio: "2:3",
               style: "写实",
               tone: "未知"
             },
             description: "TMDB Sync Data"
          }));
          setTmdbPosters((prev) => {
             const existingIds = new Set(prev.map((p) => p.id));
             const newItems = mapped.filter((p) => !existingIds.has(p.id));
             const updated = [...prev, ...newItems];
             try {
               // Only cache the first page or max 40 posters so we don't blow localStorage
               localStorage.setItem("moviepainter-tmdb-catalog", JSON.stringify(updated.slice(0, 40)));
             } catch {}
             return updated;
          });
        } else {
          setHasMoreTmdb(false);
        }
      } catch (err) {
        setHasMoreTmdb(false);
      } finally {
        if (!cancelled) setSyncingTmdb(false);
      }
    }
    
    if (tmdbPage > 0) {
      void loadTmdbPage();
    }
    return () => { cancelled = true; };
  }, [tmdbPage, token]);

  const allPosters = useMemo(() => [...posters, ...tmdbPosters], [posters, tmdbPosters]);

  useEffect(() => {
    if (!openFilter) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenFilter(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openFilter]);

  const filterDefinitions = useMemo(() => {
    return buildFilterDefinitions(allPosters);
  }, [allPosters]);

  const visiblePosters = useMemo(() => {
    return allPosters.filter((poster) => {
      return matchesFilters(poster, activeFilters);
    });
  }, [activeFilters, allPosters]);
  const hasActiveFilter = Object.values(activeFilters).some((value) => value !== "all");
  const displayPosters = hasActiveFilter ? visiblePosters : padPosterRow(visiblePosters);
  const paginatedPosters = useMemo(() => displayPosters.slice(0, visiblePage * VISIBLE_PER_PAGE), [displayPosters, visiblePage]);
  const hasMoreLocal = paginatedPosters.length < displayPosters.length;

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) {
          setVisiblePage(p => p + 1);
        } else if (hasMoreTmdb && !syncingTmdb) {
          setTmdbPage((prev) => prev + 1);
        }
      }
    });
    return () => observerRef.current?.disconnect();
  }, [hasMoreLocal, hasMoreTmdb, syncingTmdb]);

  const lastElementRef = (node: HTMLElement | null) => {
    if (loading || syncingTmdb) return;
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current?.observe(node);
    }
  };


  function openPoster(poster: PosterRecord) {
    setSelectedPoster(poster);
    setSelectingMode(false);
  }

  async function handleUse(mode: WorkspaceMode) {
    if (!selectedPoster) {
      return;
    }

    if (!selectingMode) {
      setSelectingMode(true);
      return;
    }

    await recordWorkspaceAssetUse({
      action: "library_use",
      mode,
      poster: selectedPoster,
      sourceOrigin: "library",
      token
    });

    navigate(`/workspace?mode=${mode}&posterId=${selectedPoster.id}&source=library`);
  }

  return (
    <section className="relative space-y-10">
      {error ? (
        <p className="mx-auto max-w-2xl rounded-lg border border-[#ffb4aa]/28 bg-[#311615]/72 px-4 py-3 text-sm leading-6 text-[#ffdad5] shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          {error}
        </p>
      ) : null}

      <div ref={filtersRef} className="relative z-20 flex flex-wrap justify-start gap-3">
        {filterDefinitions.map((filter) => {
          const currentValue = activeFilters[filter.key];
          const currentOption = filter.options.find((option) => option.value === currentValue) ?? filter.options[0];

          return (
            <div key={filter.key} className="relative">
              <LibraryFilterButton
                active={currentValue !== "all"}
                isOpen={openFilter === filter.key}
                label={filter.label}
                value={currentOption.label}
                onToggle={() => setOpenFilter((current) => (current === filter.key ? null : filter.key))}
              />
              {openFilter === filter.key ? (
                <LibraryFilterPanel className={filter.key === "composition" ? "right-0" : "left-0"}>
                  {filter.options.map((option) => (
                    <LibraryFilterOption
                      key={option.value}
                      description={option.description}
                      label={option.label}
                      selected={currentValue === option.value}
                      onClick={() => {
                        setActiveFilters((current) => ({
                          ...current,
                          [filter.key]: option.value
                        }));
                        setOpenFilter(null);
                      }}
                    />
                  ))}
                </LibraryFilterPanel>
              ) : null}
            </div>
          );
        })}
      </div>

      {loading ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-white/8" />
          ))}
        </section>
      ) : visiblePosters.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {paginatedPosters.map((poster, index) => (
            <PosterMosaicCard
              key={`${poster.id}-${index}`}
              poster={poster}
              showMeta={false}
              onClick={() => openPoster(poster)}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-white/8 bg-white/5 px-6 py-12 text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#ffb4aa] uppercase">No posters found</p>
          <p className="mt-3 text-sm text-neutral-500">Try a different genre, year, or search term.</p>
        </section>
      )}

      <div className="mt-20 flex justify-center" ref={lastElementRef}>
        {(syncingTmdb || hasMoreLocal) ? (
          <div className="flex items-center gap-3 space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.4s]"></div>
          </div>
        ) : hasMoreTmdb && !hasMoreLocal ? (
          <button
            type="button"
            onClick={() => setTmdbPage(prev => prev + 1)}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 py-4 font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-[#410001] uppercase shadow-lg shadow-[#e50914]/20 transition hover:scale-105 active:scale-95"
          >
            Discover More Work
          </button>
        ) : (
          <p className="text-sm font-bold tracking-[0.1em] text-neutral-500 uppercase">You've reached the end</p>
        )}
      </div>

      <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-white/5 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-[var(--font-display)] text-lg font-black text-[#e5e2e1]">MoviePainter</p>
          <p className="mt-2 text-[10px] tracking-[0.24em] text-neutral-600 uppercase">
            © 2024 MoviePainter. The Digital Curator.
          </p>
        </div>
        <nav className="flex gap-10 text-[10px] tracking-[0.24em] uppercase">
          {["Privacy", "Terms", "Support"].map((item) => (
            <a key={item} href="#" className="text-neutral-600 transition hover:text-[#e5e2e1]">
              {item}
            </a>
          ))}
        </nav>
      </footer>

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

function LibraryFilterButton({
  active,
  isOpen,
  label,
  onToggle,
  value
}: {
  active: boolean;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
  value: string;
}) {
  const buttonClassName = active
    ? "bg-gradient-to-r from-[#ffb4aa] to-[#e50914] text-[#410001] shadow-lg shadow-[#e50914]/20"
    : isOpen
      ? "bg-white/12 text-white shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
      : "bg-white/7 text-neutral-300 hover:bg-white/12 hover:text-white";
  const textClassName = active ? "text-[#410001]" : "text-neutral-300";
  const arrowClassName = active ? "text-[#410001]/72" : "text-neutral-500";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-9 min-w-[8.75rem] max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-4 text-xs font-bold transition ${buttonClassName}`}
    >
      <span className={`text-xs font-bold tracking-[0.14em] uppercase ${textClassName}`}>{label}</span>
      <span className={`truncate text-right text-xs font-bold tracking-normal normal-case ${textClassName}`}>{value}</span>
      <span className={`text-xs transition ${isOpen ? "rotate-180" : ""} ${arrowClassName}`}>▾</span>
    </button>
  );
}

function LibraryFilterPanel({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute top-full z-30 mt-3 w-[min(22rem,calc(100vw-3rem))] origin-top-left overflow-hidden rounded-lg border border-white/10 bg-[#181918]/96 p-2 text-neutral-100 shadow-none backdrop-blur-xl ${className}`}
    >
      <div className="max-h-[18rem] overflow-y-auto">{children}</div>
    </div>
  );
}

function LibraryFilterOption({
  description,
  label,
  onClick,
  selected
}: {
  description: string;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
        selected ? "bg-white/8 text-white" : "text-neutral-300 hover:bg-white/8 hover:text-white"
      }`}
    >
      <div className="space-y-1">
        <p className="text-sm leading-5 font-semibold">{label}</p>
        <p className={`text-xs leading-5 ${selected ? "text-neutral-400" : "text-neutral-500"}`}>{description}</p>
      </div>
      <span className={`mt-0.5 text-sm font-semibold ${selected ? "text-[#ffb4aa]" : "text-transparent"}`}>✓</span>
    </button>
  );
}

function formatGenreLabel(genre: string) {
  return genreLabelMap[genre] ?? genre;
}

function buildFilterDefinitions(posters: PosterRecord[]): FilterDefinition[] {
  const genres = uniqueOptions(posters.map((poster) => formatGenreLabel(poster.genre)));
  const years = uniqueOptions(posters.map((poster) => poster.year).sort((a, b) => Number(b) - Number(a)));
  const directors = uniqueOptions(posters.map((poster) => poster.director ?? "").filter(Boolean));

  return [
    {
      key: "director",
      label: filterLabels.director,
      options: [
        { label: "全部导演", value: "all", description: "浏览完整导演视觉谱系。" },
        ...directors.map((director) => ({
          label: director,
          value: director,
          description: "按导演气质筛选海报。"
        }))
      ]
    },
    {
      key: "type",
      label: filterLabels.type,
      options: [
        { label: "全部类型", value: "all", description: "保留所有电影类型。" },
        ...genres.map((genre) => ({
          label: genre,
          value: genre,
          description: "按电影类型缩小图库。"
        }))
      ]
    },
    {
      key: "era",
      label: filterLabels.era,
      options: [
        { label: "全部年代", value: "all", description: "查看所有年份作品。" },
        ...years.map((year) => ({
          label: year,
          value: year,
          description: "只展示该年份的海报。"
        })),
        { label: "Archive", value: "archive", description: "查看更早期归档作品。" }
      ]
    },
    {
      key: "style",
      label: filterLabels.style,
      options: buildAttributeOptions(posters, "style", "全部风格", "从画面风格进入图库。")
    },
    {
      key: "mood",
      label: filterLabels.mood,
      options: buildAttributeOptions(posters, "mood", "全部氛围", "用情绪线索筛选海报。")
    },
    {
      key: "tone",
      label: filterLabels.tone,
      options: buildAttributeOptions(posters, "tone", "全部色调", "按综合色彩气质查找。")
    },
    {
      key: "composition",
      label: filterLabels.composition,
      options: buildAttributeOptions(posters, "composition", "全部构图", "按主体位置和画面结构筛选。")
    }
  ];
}

function buildAttributeOptions(
  posters: PosterRecord[],
  attribute: keyof PosterRecord["attributes"],
  allLabel: string,
  description: string
) {
  const values = uniqueOptions(posters.map((poster) => poster.attributes[attribute]));

  return [
    { label: allLabel, value: "all", description },
    ...values.map((value) => ({
      label: value,
      value,
      description
    }))
  ];
}

function matchesFilters(poster: PosterRecord, filters: ActiveFilters) {
  const director = poster.director ?? "";

  return (
    (filters.director === "all" || director === filters.director) &&
    (filters.type === "all" || formatGenreLabel(poster.genre) === filters.type) &&
    (filters.era === "all" ||
      (filters.era === "archive" ? Number(poster.year) < 2024 : poster.year === filters.era)) &&
    (filters.style === "all" || poster.attributes.style === filters.style) &&
    (filters.mood === "all" || poster.attributes.mood === filters.mood) &&
    (filters.tone === "all" || poster.attributes.tone === filters.tone) &&
    (filters.composition === "all" || poster.attributes.composition === filters.composition)
  );
}

function uniqueOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function padPosterRow(posters: PosterRecord[]) {
  if (posters.length === 0 || posters.length >= 8) {
    return posters;
  }

  return [...posters, ...posters.slice(0, 8 - posters.length)];
}
