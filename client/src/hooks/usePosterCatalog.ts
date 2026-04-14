import { useEffect, useState } from "react";
import { posterRecords, type AppDataSource, type PosterRecord } from "../data/posters";
import { appDataRequest } from "../lib/api";

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
  const [state, setState] = useState<PosterCatalogState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadPosters() {
      setState((current) => ({
        ...current,
        error: "",
        loading: true
      }));

      try {
        const response = await appDataRequest.getPosters(token);

        if (cancelled) {
          return;
        }

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
