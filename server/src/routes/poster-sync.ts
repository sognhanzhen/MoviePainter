import { Router } from "express";
import type { Request, RequestHandler, Response } from "express";
import { getAuthUser } from "../middleware/auth";
import { TmdbPosterFetcher } from "../services/tmdb-poster-fetcher";
import { serverConfig } from "../config";

export function createPosterSyncRouter() {
  const router = Router();
  const fetcher = new TmdbPosterFetcher({
    apiKey: serverConfig.dashscopeApiKey ?? "", // Note: We actually need a TMDB key here
    baseUrl: "https://api.themoviedb.org/3"     // default TMDB v3 url
  });

  const syncTmdbHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuthUser(req);
      if (!auth) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Hardcode TMDB API base, reading API Key from env configs if available.
      const tmdbKey = process.env.TMDB_API_KEY || "";
      if (!tmdbKey) {
        res.status(400).json({ error: "Missing TMDB_API_KEY in environment variables." });
        return;
      }

      const tempFetcher = new TmdbPosterFetcher({
        apiKey: tmdbKey,
        baseUrl: "https://api.themoviedb.org/3"
      });

      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const movies = await tempFetcher.fetchPopularMovies(page);

      // Normally we would insert this into Supabase `curated_posters`.
      // For now, return it to the client.
      res.json({
        message: "Successfully fetched from TMDB",
        count: movies.length,
        movies
      });
    } catch (error) {
      console.error("[PosterSync] Error syncing TMDB:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to sync posters" });
    }
  };

  router.get("/sync-tmdb", syncTmdbHandler);

  return router;
}
