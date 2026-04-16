import { useEffect, useState } from "react";
import { posterRecords, type AppDataSource, type PosterRecord } from "../data/posters";
import { appDataRequest } from "../lib/api";

const POSTER_CACHE_KEY = "moviepainter-poster-catalog-104";
const POSTER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type PosterCache = { posters: PosterRecord[]; savedAt: number; source: AppDataSource };

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
  const cached = readPosterCache();
  const [state, setState] = useState<PosterCatalogState>(
    cached
      ? { error: "", loading: false, posters: cached.posters, source: cached.source }
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

        writePosterCache(response.posters, response.source);
        setState({
          error: "",
          loading: false,
          posters: response.posters,
          source: response.source
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          error: error instanceof Error ? `${error.message}，当前先展示本地演示海报。` : "海报库加载失败，当前先展示本地演示海报。",
          loading: false,
          posters: posterRecords,
          source: "local-demo"
        });
      }
    }

    if (!token) {
      setState({
        error: "",
        loading: false,
        posters: posterRecords,
        source: "local-demo"
      });
      return;
    }

    void loadPosters();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
