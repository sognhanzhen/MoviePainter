
export type TmdbMovieRecord = {
  director: string;
  genre: string;
  fullGenre: string;
  imdbId: string;
  overview: string;
  posterPath: string;
  posterUrl: string;
  releaseDate: string;
  title: string;
  tmdbId: string;
  year: string;
};

export class TmdbPosterFetcher {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  async fetchPopularMovies(page: number = 1): Promise<TmdbMovieRecord[]> {
    if (!this.apiKey) {
      throw new Error("Missing TMDB_API_KEY. Please set it in your environment variables.");
    }

    const url = `${this.baseUrl}/movie/popular?language=en-US&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch popular movies: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const details = await Promise.all(
      results.map(async (movie: any) => {
        try {
          return await this.fetchMovieDetails(String(movie.id));
        } catch {
          return null; // Ignore failed partial fetches
        }
      })
    );

    return details.filter(Boolean) as TmdbMovieRecord[];
  }

  async fetchMovieDetails(tmdbId: string): Promise<TmdbMovieRecord> {
    if (!this.apiKey) {
      throw new Error("Missing TMDB_API_KEY.");
    }

    // append_to_response=credits helps get director info
    const url = `${this.baseUrl}/movie/${tmdbId}?append_to_response=credits&language=en-US`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details for ${tmdbId}: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const releaseDate = data.release_date || "";
    const year = releaseDate.split("-")[0] || "";
    
    const crew = data.credits?.crew || [];
    const directorEntry = crew.find((c: any) => c.job === "Director");
    const director = directorEntry?.name || "Unknown";

    const genres = data.genres || [];
    const fullGenre = genres.map((g: any) => g.name.toLowerCase()).join(" / ");
    const genre = genres.slice(0, 2).map((g: any) => g.name).join(" / ") || "Drama";

    const posterPath = data.poster_path;
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "";

    return {
      director,
      genre,
      fullGenre,
      imdbId: data.imdb_id || "",
      overview: data.overview || "",
      posterPath,
      posterUrl,
      releaseDate,
      title: data.title || "",
      tmdbId: String(data.id),
      year
    };
  }
}
