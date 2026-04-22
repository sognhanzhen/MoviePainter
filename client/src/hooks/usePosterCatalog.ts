import { useEffect, useState } from "react";
import { posterRecords, type AppDataSource, type PosterRecord } from "../data/posters";
import { getPosterPromptPreset } from "../data/poster-prompt-presets";
import { useI18n } from "../i18n/useI18n";
import { appDataRequest } from "../lib/api";

const POSTER_CACHE_KEY = "moviepainter-poster-catalog-prompts-v1";
const POSTER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type PosterCache = { posters: PosterRecord[]; savedAt: number; source: AppDataSource };

const localPosterById = new Map(posterRecords.map((poster) => [poster.id, poster]));

function readPosterCache(): PosterCache | null {
  try {
    const raw = localStorage.getItem(POSTER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosterCache;
    if (Date.now() - parsed.savedAt > POSTER_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePosterCache(posters: PosterRecord[], source: AppDataSource) {
  try {
    const cache: PosterCache = { posters, savedAt: Date.now(), source };
    localStorage.setItem(POSTER_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota errors ignored */ }
}

function withPromptPresets(posters: PosterRecord[]) {
  return posters.map((poster) => {
    const localPoster = localPosterById.get(poster.id);

    return {
      ...poster,
      catalogCategory: poster.catalogCategory ?? localPoster?.catalogCategory ?? "movie",
      catalogSubcategory: poster.catalogSubcategory ?? localPoster?.catalogSubcategory,
      promptPresets: poster.promptPresets ?? getPosterPromptPreset(poster.id)
    };
  });
}

type PosterCatalogState = {
  error: string;
  loading: boolean;
  posters: PosterRecord[];
  source: AppDataSource;
};

const initialState: PosterCatalogState = {
  error: "",
  loading: true,
  posters: [],
  source: "local-demo"
};

export function usePosterCatalog(token: string) {
  const { language } = useI18n();
  const cached = readPosterCache();
  const [state, setState] = useState<PosterCatalogState>(
    cached
      ? { error: "", loading: false, posters: withPromptPresets(cached.posters), source: cached.source }
      : initialState
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPosters() {
      setState((current) => ({
        ...current,
        error: "",
        loading: current.posters.length === 0
      }));

      try {
        const response = await appDataRequest.getPosters(token);

        if (cancelled) return;

        const postersWithPrompts = withPromptPresets(response.posters);
        writePosterCache(postersWithPrompts, response.source);
        setState({
          error: "",
          loading: false,
          posters: postersWithPrompts,
          source: response.source
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          error:
            error instanceof Error
              ? language === "zh-CN"
                ? `${error.message}，当前先展示本地演示海报。`
                : `${error.message}. Showing local demo posters for now.`
              : language === "zh-CN"
                ? "海报库加载失败，当前先展示本地演示海报。"
                : "Poster library failed to load. Showing local demo posters for now.",
          loading: false,
          posters: withPromptPresets(posterRecords),
          source: "local-demo"
        });
      }
    }

    if (!token) {
      setState({
        error: "",
        loading: false,
        posters: withPromptPresets(posterRecords),
        source: "local-demo"
      });
      return;
    }

    void loadPosters();

    return () => {
      cancelled = true;
    };
  }, [language, token]);

  return state;
}
