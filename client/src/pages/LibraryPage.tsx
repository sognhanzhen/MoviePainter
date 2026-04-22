import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PosterDetailModal } from "../components/PosterDetailModal";
import { PosterMosaicCard } from "../components/PosterMosaicCard";
import type { PosterCatalogCategory, PosterRecord, PosterShortDramaKind, WorkspaceMode } from "../data/posters";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import type { Language } from "../i18n/messages";
import { useI18n } from "../i18n/useI18n";
import { appDataRequest } from "../lib/api";
import {
  formatDirectorValue,
  formatPosterAttributeValue,
  getPosterAttributeFilterValues,
  getPosterGenreFilterValues
} from "../lib/poster-localization";
import { recordWorkspaceAssetUse } from "../lib/workspace-assets";

const filterLabels = {
  composition: { "en-US": "Composition", "zh-CN": "构图" },
  director: { "en-US": "Director", "zh-CN": "导演" },
  era: { "en-US": "Year", "zh-CN": "年代" },
  mood: { "en-US": "Mood", "zh-CN": "氛围" },
  style: { "en-US": "Style", "zh-CN": "风格" },
  tone: { "en-US": "Tone", "zh-CN": "色调" },
  type: { "en-US": "Genre", "zh-CN": "类型" }
} as const;

const catalogCategoryOptions = [
  {
    description: { "en-US": "Feature films and cinema references.", "zh-CN": "电影长片与影院级视觉参考。" },
    label: { "en-US": "Movie", "zh-CN": "电影" },
    value: "movie"
  },
  {
    description: { "en-US": "Serialized drama and television key art.", "zh-CN": "电视剧与长剧集主视觉。" },
    label: { "en-US": "Series", "zh-CN": "电视剧" },
    value: "series"
  },
  {
    description: { "en-US": "Short-form drama posters.", "zh-CN": "短剧海报与竖屏叙事视觉。" },
    label: { "en-US": "Short Drama", "zh-CN": "短剧" },
    value: "short-drama"
  }
] as const satisfies ReadonlyArray<{
  description: Record<Language, string>;
  label: Record<Language, string>;
  value: PosterCatalogCategory;
}>;

const shortDramaKindOptions = [
  { label: { "en-US": "All Shorts", "zh-CN": "全部短剧" }, value: "all" },
  { label: { "en-US": "Live Action", "zh-CN": "真人" }, value: "live-action" },
  { label: { "en-US": "Animation", "zh-CN": "动漫" }, value: "animation" }
] as const satisfies ReadonlyArray<{
  label: Record<Language, string>;
  value: PosterShortDramaKind | "all";
}>;

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

type FilterStateByCategory = Record<PosterCatalogCategory, ActiveFilters>;

const defaultFilters: ActiveFilters = {
  composition: "all",
  director: "all",
  era: "all",
  mood: "all",
  style: "all",
  tone: "all",
  type: "all"
};

const defaultFilterStateByCategory: FilterStateByCategory = {
  movie: defaultFilters,
  series: defaultFilters,
  "short-drama": defaultFilters
};

export function LibraryPage() {
  const { token } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<PosterCatalogCategory>("movie");
  const [activeShortDramaKind, setActiveShortDramaKind] = useState<PosterShortDramaKind | "all">("all");
  const [filterStateByCategory, setFilterStateByCategory] = useState<FilterStateByCategory>(defaultFilterStateByCategory);
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
  const activeFilters = filterStateByCategory[activeCategory];


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
             summary: m.overview || libraryCopy(language, "No description available.", "暂无简介。"),
             genre: m.genre || "Drama",
             year: m.year || new Date().getFullYear().toString(),
             director: m.director || libraryCopy(language, "Unknown", "未知"),
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
             catalogCategory: "movie",
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
  }, [language, tmdbPage, token]);

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

  const categoryPosters = useMemo(() => {
    return allPosters.filter((poster) => matchesCatalogSelection(poster, activeCategory, activeShortDramaKind));
  }, [activeCategory, activeShortDramaKind, allPosters]);

  const filterDefinitions = useMemo(() => {
    return buildFilterDefinitions(categoryPosters, language, activeCategory);
  }, [activeCategory, categoryPosters, language]);

  const visiblePosters = useMemo(() => {
    return categoryPosters.filter((poster) => {
      return matchesFilters(poster, activeFilters);
    });
  }, [activeFilters, categoryPosters]);
  const hasActiveFilter = Object.values(activeFilters).some((value) => value !== "all");
  const displayPosters = hasActiveFilter ? visiblePosters : padPosterRow(visiblePosters);
  const paginatedPosters = useMemo(() => displayPosters.slice(0, visiblePage * VISIBLE_PER_PAGE), [displayPosters, visiblePage]);
  const hasMoreLocal = paginatedPosters.length < displayPosters.length;

  useEffect(() => {
    setVisiblePage(1);
  }, [activeCategory, activeFilters, activeShortDramaKind]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) {
          setVisiblePage(p => p + 1);
        } else if (activeCategory === "movie" && hasMoreTmdb && !syncingTmdb) {
          setTmdbPage((prev) => prev + 1);
        }
      }
    });
    return () => observerRef.current?.disconnect();
  }, [activeCategory, hasMoreLocal, hasMoreTmdb, syncingTmdb]);

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

      <div ref={filtersRef} className="relative z-20 space-y-4">
        <div className="flex flex-wrap justify-start gap-3">
          {catalogCategoryOptions.map((category) => (
            <LibraryCategoryButton
              key={category.value}
              active={activeCategory === category.value}
              description={category.description[language]}
              label={category.label[language]}
              onClick={() => {
                setActiveCategory(category.value);
                setOpenFilter(null);
              }}
            />
          ))}
        </div>

        {activeCategory === "short-drama" ? (
          <div className="flex flex-wrap justify-start gap-2">
            {shortDramaKindOptions.map((option) => (
              <LibraryPillButton
                key={option.value}
                active={activeShortDramaKind === option.value}
                label={option.label[language]}
                onClick={() => {
                  setActiveShortDramaKind(option.value);
                  setOpenFilter(null);
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-start gap-3">
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
                          setFilterStateByCategory((current) => ({
                            ...current,
                            [activeCategory]: {
                              ...current[activeCategory],
                              [filter.key]: option.value
                            }
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
      </div>

      {loading ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-white/8" />
          ))}
        </section>
      ) : visiblePosters.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
          <p className="text-sm font-semibold tracking-[0.18em] text-[#ffb4aa] uppercase">
            {libraryCopy(language, "No posters found", "未找到海报")}
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            {libraryCopy(language, "Try a different genre, year, or search term.", "请尝试切换类型、年代或关键词。")}
          </p>
        </section>
      )}

      <div className="mt-20 flex justify-center" ref={lastElementRef}>
        {(syncingTmdb || hasMoreLocal) ? (
          <div className="flex items-center gap-3 space-x-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-[#ffb4aa] [animation-delay:0.4s]"></div>
          </div>
        ) : activeCategory === "movie" && hasMoreTmdb && !hasMoreLocal ? (
          <button
            type="button"
            onClick={() => setTmdbPage(prev => prev + 1)}
            className="cursor-pointer rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 py-4 font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-[#410001] uppercase shadow-lg shadow-[#e50914]/20 transition hover:scale-105 active:scale-95"
          >
            {libraryCopy(language, "Discover More Work", "发现更多作品")}
          </button>
        ) : (
          <p className="text-sm font-bold tracking-[0.1em] text-neutral-500 uppercase">
            {libraryCopy(language, "You've reached the end", "已经到底了")}
          </p>
        )}
      </div>

      <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-white/5 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-[var(--font-display)] text-lg font-black text-[#e5e2e1]">MoviePainter</p>
          <p className="mt-2 text-[10px] tracking-[0.24em] text-neutral-600 uppercase">
            {libraryCopy(language, "© 2024 MoviePainter. The Digital Curator.", "© 2024 MoviePainter. 数字策展工作室。")}
          </p>
        </div>
        <nav className="flex gap-10 text-[10px] tracking-[0.24em] uppercase">
          {[
            { label: libraryCopy(language, "Privacy", "隐私"), value: "privacy" },
            { label: libraryCopy(language, "Terms", "条款"), value: "terms" },
            { label: libraryCopy(language, "Support", "支持"), value: "support" }
          ].map((item) => (
            <a key={item.value} href="#" className="text-neutral-600 transition hover:text-[#e5e2e1]">
              {item.label}
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

function LibraryCategoryButton({
  active,
  description,
  label,
  onClick
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex min-h-14 cursor-pointer flex-col justify-center rounded-lg px-5 text-left transition ${
        active
          ? "bg-gradient-to-r from-[#ffb4aa] to-[#e50914] text-[#410001] shadow-lg shadow-[#e50914]/20"
          : "bg-white/7 text-neutral-300 hover:bg-white/12 hover:text-white"
      }`}
    >
      <span className="text-xs font-extrabold tracking-[0.18em] uppercase">{label}</span>
      <span className={`mt-1 max-w-[13rem] truncate text-[10px] font-semibold tracking-normal normal-case ${active ? "text-[#410001]/72" : "text-neutral-500 group-hover:text-neutral-400"}`}>
        {description}
      </span>
    </button>
  );
}

function LibraryPillButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 cursor-pointer rounded-lg px-4 text-[10px] font-extrabold tracking-[0.18em] uppercase transition ${
        active
          ? "bg-white text-slate-950"
          : "bg-white/7 text-neutral-400 hover:bg-white/12 hover:text-white"
      }`}
    >
      {label}
    </button>
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

export function buildFilterDefinitions(
  posters: PosterRecord[],
  language: Language,
  category: PosterCatalogCategory = "movie"
): FilterDefinition[] {
  const genres = uniqueOptions(posters.flatMap((poster) => getPosterGenreFilterValues(poster)));
  const years = uniqueOptions(posters.map((poster) => poster.year).sort((a, b) => Number(b) - Number(a)));
  const directors = uniqueOptions(posters.map((poster) => poster.director ?? "").filter(Boolean));

  return [
    {
      key: "director",
      label: formatFilterLabel("director", category, language),
      options: [
        {
          label: formatAllFilterValue("director", category, language),
          value: "all",
          description: formatFilterDescription("director", category, language)
        },
        ...directors.map((director) => ({
          label: formatDirectorValue(director, language),
          value: director,
          description: formatFilterOptionDescription("director", category, language)
        }))
      ]
    },
    {
      key: "type",
      label: formatFilterLabel("type", category, language),
      options: [
        {
          label: formatAllFilterValue("type", category, language),
          value: "all",
          description: formatFilterDescription("type", category, language)
        },
        ...genres.map((genre) => ({
          label: formatPosterAttributeValue("style", genre, language),
          value: genre,
          description: formatFilterOptionDescription("type", category, language)
        }))
      ]
    },
    {
      key: "era",
      label: formatFilterLabel("era", category, language),
      options: [
        {
          label: formatAllFilterValue("era", category, language),
          value: "all",
          description: formatFilterDescription("era", category, language)
        },
        ...years.map((year) => ({
          label: year,
          value: year,
          description: formatFilterOptionDescription("era", category, language)
        })),
        { label: libraryCopy(language, "Archive", "归档"), value: "archive", description: libraryCopy(language, "View earlier archived work.", "查看更早期归档作品。") }
      ]
    },
    {
      key: "style",
      label: formatFilterLabel("style", category, language),
      options: buildAttributeOptions(posters, "style", language, formatAllFilterValue("style", category, language), formatFilterDescription("style", category, language))
    },
    {
      key: "mood",
      label: formatFilterLabel("mood", category, language),
      options: buildAttributeOptions(posters, "mood", language, formatAllFilterValue("mood", category, language), formatFilterDescription("mood", category, language))
    },
    {
      key: "tone",
      label: formatFilterLabel("tone", category, language),
      options: buildAttributeOptions(posters, "tone", language, formatAllFilterValue("tone", category, language), formatFilterDescription("tone", category, language))
    },
    {
      key: "composition",
      label: formatFilterLabel("composition", category, language),
      options: buildAttributeOptions(posters, "composition", language, formatAllFilterValue("composition", category, language), formatFilterDescription("composition", category, language))
    }
  ];
}

function libraryCopy(language: Language, english: string, chinese: string) {
  return language === "zh-CN" ? chinese : english;
}

function formatFilterLabel(filterKey: FilterKey, category: PosterCatalogCategory, language: Language) {
  if (filterKey === "director") {
    if (category === "series") {
      return libraryCopy(language, "Creator", "主创");
    }

    if (category === "short-drama") {
      return libraryCopy(language, "Creator", "出品方");
    }
  }

  if (filterKey === "type") {
    if (category === "series") {
      return libraryCopy(language, "Series Type", "剧集类型");
    }

    if (category === "short-drama") {
      return libraryCopy(language, "Theme", "题材");
    }
  }

  return filterLabels[filterKey][language];
}

function formatAllFilterValue(filterKey: FilterKey, category: PosterCatalogCategory, language: Language) {
  const allCopy: Record<FilterKey, Record<PosterCatalogCategory, Record<Language, string>>> = {
    composition: {
      movie: { "en-US": "All Compositions", "zh-CN": "全部构图" },
      series: { "en-US": "All Compositions", "zh-CN": "全部构图" },
      "short-drama": { "en-US": "All Compositions", "zh-CN": "全部构图" }
    },
    director: {
      movie: { "en-US": "All Directors", "zh-CN": "全部导演" },
      series: { "en-US": "All Creators", "zh-CN": "全部主创" },
      "short-drama": { "en-US": "All Producers", "zh-CN": "全部出品方" }
    },
    era: {
      movie: { "en-US": "All Years", "zh-CN": "全部年代" },
      series: { "en-US": "All Years", "zh-CN": "全部年份" },
      "short-drama": { "en-US": "All Years", "zh-CN": "全部年份" }
    },
    mood: {
      movie: { "en-US": "All Moods", "zh-CN": "全部氛围" },
      series: { "en-US": "All Moods", "zh-CN": "全部情绪" },
      "short-drama": { "en-US": "All Hooks", "zh-CN": "全部情绪钩子" }
    },
    style: {
      movie: { "en-US": "All Styles", "zh-CN": "全部风格" },
      series: { "en-US": "All Styles", "zh-CN": "全部风格" },
      "short-drama": { "en-US": "All Styles", "zh-CN": "全部风格" }
    },
    tone: {
      movie: { "en-US": "All Tones", "zh-CN": "全部色调" },
      series: { "en-US": "All Tones", "zh-CN": "全部色调" },
      "short-drama": { "en-US": "All Tones", "zh-CN": "全部色调" }
    },
    type: {
      movie: { "en-US": "All Genres", "zh-CN": "全部类型" },
      series: { "en-US": "All Series Types", "zh-CN": "全部剧集类型" },
      "short-drama": { "en-US": "All Themes", "zh-CN": "全部题材" }
    }
  };

  return allCopy[filterKey][category][language];
}

function formatFilterDescription(filterKey: FilterKey, category: PosterCatalogCategory, language: Language) {
  if (filterKey === "director") {
    return category === "movie"
      ? libraryCopy(language, "Browse the full director visual spectrum.", "浏览完整导演视觉谱系。")
      : libraryCopy(language, "Keep every creator and production source visible.", "保留所有主创与出品来源。");
  }

  if (filterKey === "type") {
    return category === "short-drama"
      ? libraryCopy(language, "Keep every short-drama theme visible.", "保留所有短剧题材。")
      : libraryCopy(language, "Keep every genre visible.", "保留所有类型。");
  }

  if (filterKey === "mood" && category === "short-drama") {
    return libraryCopy(language, "Filter with emotional hooks.", "用情绪钩子筛选短剧。");
  }

  const descriptionMap: Record<Exclude<FilterKey, "director" | "type">, Record<Language, string>> = {
    composition: { "en-US": "Filter by subject placement and frame structure.", "zh-CN": "按主体位置和画面结构筛选。" },
    era: { "en-US": "View work across every year.", "zh-CN": "查看所有年份作品。" },
    mood: { "en-US": "Filter with emotional cues.", "zh-CN": "用情绪线索筛选海报。" },
    style: { "en-US": "Enter the gallery through visual style.", "zh-CN": "从画面风格进入图库。" },
    tone: { "en-US": "Search by overall color character.", "zh-CN": "按综合色彩气质查找。" }
  };

  return descriptionMap[filterKey][language];
}

function formatFilterOptionDescription(filterKey: "director" | "era" | "type", category: PosterCatalogCategory, language: Language) {
  if (filterKey === "director") {
    return category === "movie"
      ? libraryCopy(language, "Filter posters by director sensibility.", "按导演气质筛选海报。")
      : libraryCopy(language, "Filter posters by creator or production source.", "按主创或出品来源筛选海报。");
  }

  if (filterKey === "type") {
    return category === "short-drama"
      ? libraryCopy(language, "Narrow the gallery by short-drama theme.", "按短剧题材缩小图库。")
      : libraryCopy(language, "Narrow the gallery by genre.", "按类型缩小图库。");
  }

  return libraryCopy(language, "Show posters from this year only.", "只展示该年份的海报。");
}

function buildAttributeOptions(
  posters: PosterRecord[],
  attribute: keyof PosterRecord["attributes"],
  language: Language,
  allLabel: string,
  description: string
) {
  const values = uniqueOptions(posters.flatMap((poster) => getPosterAttributeFilterValues(poster, attribute)));

  return [
    { label: allLabel, value: "all", description },
    ...values.map((value) => ({
      label: formatPosterAttributeValue(attribute, value, language),
      value,
      description
    }))
  ];
}

export function matchesFilters(poster: PosterRecord, filters: ActiveFilters) {
  const director = poster.director ?? "";

  return (
    (filters.director === "all" || director === filters.director) &&
    (filters.type === "all" || getPosterGenreFilterValues(poster).includes(filters.type)) &&
    (filters.era === "all" ||
      (filters.era === "archive" ? Number(poster.year) < 2024 : poster.year === filters.era)) &&
    (filters.style === "all" || getPosterAttributeFilterValues(poster, "style").includes(filters.style)) &&
    (filters.mood === "all" || getPosterAttributeFilterValues(poster, "mood").includes(filters.mood)) &&
    (filters.tone === "all" || getPosterAttributeFilterValues(poster, "tone").includes(filters.tone)) &&
    (filters.composition === "all" || poster.attributes.composition === filters.composition)
  );
}

function matchesCatalogSelection(
  poster: PosterRecord,
  category: PosterCatalogCategory,
  shortDramaKind: PosterShortDramaKind | "all"
) {
  if (resolvePosterCatalogCategory(poster) !== category) {
    return false;
  }

  if (category !== "short-drama" || shortDramaKind === "all") {
    return true;
  }

  return resolvePosterShortDramaKind(poster) === shortDramaKind;
}

function resolvePosterCatalogCategory(poster: PosterRecord): PosterCatalogCategory {
  return poster.catalogCategory ?? "movie";
}

function resolvePosterShortDramaKind(poster: PosterRecord): PosterShortDramaKind {
  if (poster.catalogSubcategory) {
    return poster.catalogSubcategory;
  }

  const searchableText = [poster.genre, poster.region, poster.description, poster.attributes.style, ...poster.tags].join(" ").toLowerCase();

  return /animation|anime|animated|动漫|动画/.test(searchableText) ? "animation" : "live-action";
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
