const API_ENDPOINT = "https://webservice.fanart.tv/v3/movies";
const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const REQUIRED_FIELDS = ["poster", "title", "genre", "releaseDate", "director"];
const REQUEST_DELAY_MS = 1100;

const MOVIES = [
  {
    title: "Inception",
    imdbId: "tt1375666"
  },
  {
    title: "The Matrix",
    imdbId: "tt0133093"
  },
  {
    title: "Parasite",
    imdbId: "tt6751668"
  },
  {
    title: "Spirited Away",
    imdbId: "tt0245429"
  },
  {
    title: "The Godfather",
    imdbId: "tt0068646"
  },
  {
    title: "Pulp Fiction",
    imdbId: "tt0110912"
  },
  {
    title: "The Dark Knight",
    imdbId: "tt0468569"
  },
  {
    title: "La La Land",
    imdbId: "tt3783958"
  },
  {
    title: "Mad Max: Fury Road",
    imdbId: "tt1392190"
  },
  {
    title: "Arrival",
    imdbId: "tt2543164"
  }
];

function requireApiKey() {
  const apiKey = process.env.FANART_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing FANART_API_KEY. Run with FANART_API_KEY='<key>' node scripts/test-fanart-api.mjs");
  }

  return apiKey;
}

function buildUrl(input) {
  const url = new URL(`${API_ENDPOINT}/${input.imdbId}`);
  url.searchParams.set("api_key", input.apiKey);

  return url;
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache"
    }
  });
  const text = await response.text();

  try {
    return {
      body: JSON.parse(text),
      contentType: response.headers.get("content-type") ?? "",
      httpStatus: response.status,
      rawSnippet: text.slice(0, 500)
    };
  } catch {
    return {
      body: null,
      contentType: response.headers.get("content-type") ?? "",
      httpStatus: response.status,
      rawSnippet: text.slice(0, 500)
    };
  }
}

function readField(source, candidates) {
  for (const key of candidates) {
    const value = source?.[key];

    if (Array.isArray(value)) {
      const normalized = value
        .map((entry) => {
          if (typeof entry === "string") {
            return entry;
          }

          if (entry && typeof entry === "object" && typeof entry.name === "string") {
            return entry.name;
          }

          return "";
        })
        .filter(Boolean)
        .join(" / ")
        .trim();

      if (normalized) {
        return normalized;
      }
    }

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function selectPoster(posters) {
  if (!Array.isArray(posters) || posters.length === 0) {
    return "";
  }

  const sorted = posters
    .filter((poster) => typeof poster?.url === "string" && poster.url.trim())
    .toSorted((left, right) => {
      const leftLangScore = left.lang === "en" ? 1 : 0;
      const rightLangScore = right.lang === "en" ? 1 : 0;
      const leftLikes = Number.parseInt(left.likes ?? "0", 10);
      const rightLikes = Number.parseInt(right.likes ?? "0", 10);

      return rightLangScore - leftLangScore || rightLikes - leftLikes;
    });

  return sorted[0]?.url ?? "";
}

function extractFanartFields(body) {
  if (!body || typeof body !== "object") {
    return {
      director: "",
      genre: "",
      poster: "",
      releaseDate: "",
      title: ""
    };
  }

  return {
    director: readField(body, ["director", "directors", "directorName", "director_name"]),
    genre: readField(body, ["genre", "genres", "category", "type"]),
    poster: selectPoster(body.movieposter),
    releaseDate: readField(body, ["releaseDate", "release_date", "pubdate", "pubdates", "playdate", "year"]),
    title: readField(body, ["name", "title", "movieName", "movie_name"])
  };
}

function formatDate(value) {
  const match = typeof value === "string" ? value.match(/\d{4}-\d{2}-\d{2}/) : null;

  return match?.[0] ?? "";
}

function formatList(values) {
  return [...new Set(values.filter(Boolean).map((value) => value.trim()).filter(Boolean))]
    .toSorted((left, right) => left.localeCompare(right, "en"))
    .join(" / ");
}

function buildWikidataQuery(imdbIds) {
  const values = imdbIds.map((imdbId) => `"${imdbId}"`).join(" ");

  return `
SELECT ?imdb ?filmLabel ?directorLabel ?genreLabel ?date WHERE {
  VALUES ?imdb { ${values} }
  ?film wdt:P345 ?imdb.
  OPTIONAL { ?film wdt:P57 ?director. }
  OPTIONAL { ?film wdt:P136 ?genre. }
  OPTIONAL { ?film wdt:P577 ?date. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;
}

async function fetchWikidataMetadata(imdbIds) {
  const url = new URL(WIKIDATA_ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("query", buildWikidataQuery(imdbIds));

  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "MoviePainter API validation/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Wikidata metadata lookup failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const grouped = new Map();

  for (const row of payload.results?.bindings ?? []) {
    const imdbId = row.imdb?.value;

    if (!imdbId) {
      continue;
    }

    const current = grouped.get(imdbId) ?? {
      dates: [],
      directors: [],
      genres: [],
      title: ""
    };

    if (row.filmLabel?.value) {
      current.title = row.filmLabel.value;
    }

    if (row.directorLabel?.value) {
      current.directors.push(row.directorLabel.value);
    }

    if (row.genreLabel?.value) {
      current.genres.push(row.genreLabel.value);
    }

    if (row.date?.value) {
      current.dates.push(formatDate(row.date.value));
    }

    grouped.set(imdbId, current);
  }

  return Object.fromEntries(
    [...grouped.entries()].map(([imdbId, metadata]) => [
      imdbId,
      {
        director: formatList(metadata.directors),
        genre: formatList(metadata.genres),
        releaseDate: formatList(metadata.dates).split(" / ")[0] ?? "",
        title: metadata.title
      }
    ])
  );
}

function mergeFields(fanartFields, metadataFields) {
  return {
    director: fanartFields.director || metadataFields?.director || "",
    genre: fanartFields.genre || metadataFields?.genre || "",
    poster: fanartFields.poster,
    releaseDate: fanartFields.releaseDate || metadataFields?.releaseDate || "",
    title: fanartFields.title || metadataFields?.title || ""
  };
}

function validateFields(fields) {
  return REQUIRED_FIELDS.filter((field) => !fields[field]);
}

function summarizeError(result) {
  if (!result.body) {
    return `HTTP ${result.httpStatus}; non-json ${result.contentType}; ${result.rawSnippet.replace(/\s+/g, " ").slice(0, 160)}`;
  }

  if (result.httpStatus >= 400) {
    return `HTTP ${result.httpStatus}; ${JSON.stringify(result.body).slice(0, 160)}`;
  }

  return "Missing required fields after fanart.tv + metadata lookup";
}

async function fetchFanartMovie(movie, apiKey) {
  const result = await requestJson(buildUrl({ apiKey, imdbId: movie.imdbId }));
  const fanartFields = extractFanartFields(result.body);

  return {
    ...movie,
    fanartFields,
    fanartResult: result
  };
}

function buildTestResult(input) {
  const fields = mergeFields(input.fanartFields, input.metadataFields);
  const missingFields = validateFields(fields);
  const ok = input.fanartResult.httpStatus === 200 && missingFields.length === 0;

  return {
    imdbId: input.imdbId,
    title: input.title,
    artworkCounts: {
      moviebackground: Number(input.fanartResult.body?.moviebackground_count ?? 0),
      movieposter: Number(input.fanartResult.body?.movieposter_count ?? 0),
      moviethumb: Number(input.fanartResult.body?.moviethumb_count ?? 0)
    },
    availableKeys: input.fanartResult.body && typeof input.fanartResult.body === "object" ? Object.keys(input.fanartResult.body).sort() : [],
    error: ok ? "" : summarizeError(input.fanartResult),
    fanartFields: input.fanartFields,
    fields,
    httpStatus: input.fanartResult.httpStatus,
    metadataFields: input.metadataFields,
    missingFields,
    ok,
    tmdbId: String(input.fanartResult.body?.tmdb_id ?? "")
  };
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toTableRow(result) {
  return {
    title: result.title,
    imdbId: result.imdbId,
    tmdbId: result.tmdbId || "-",
    ok: result.ok ? "PASS" : "FAIL",
    posterCount: result.artworkCounts.movieposter,
    captured: Object.entries(result.fields)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)
      .join(",") || "-",
    missing: result.missingFields.join(",") || "-"
  };
}

async function main() {
  const apiKey = requireApiKey();
  const results = [];

  console.log(`Testing ${API_ENDPOINT}/{imdbId}`);
  console.log(`Required fields: ${REQUIRED_FIELDS.join(", ")}`);

  const fanartMovies = [];

  for (const movie of MOVIES) {
    const fanartMovie = await fetchFanartMovie(movie, apiKey);
    fanartMovies.push(fanartMovie);

    console.log(
      `FANART ${movie.title} (${movie.imdbId})` +
        ` posters=${Number(fanartMovie.fanartResult.body?.movieposter_count ?? 0)}` +
        ` captured=${Object.entries(fanartMovie.fanartFields)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(",") || "-"}`
    );

    await delay(REQUEST_DELAY_MS);
  }

  const metadataByImdbId = await fetchWikidataMetadata(fanartMovies.map((movie) => movie.imdbId));

  for (const fanartMovie of fanartMovies) {
    const result = buildTestResult({
      ...fanartMovie,
      metadataFields: metadataByImdbId[fanartMovie.imdbId] ?? {}
    });
    results.push(result);

    console.log(
      `${result.ok ? "PASS" : "FAIL"} ${result.fields.title} (${result.imdbId})` +
        ` captured=${Object.entries(result.fields)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(",") || "-"}` +
        ` missing=${result.missingFields.join(",") || "-"}`
    );
  }

  console.table(results.map(toTableRow));

  const passed = results.filter((result) => result.ok).length;
  const summary = {
    apiEndpoint: `${API_ENDPOINT}/{imdbId} + ${WIKIDATA_ENDPOINT}`,
    checkedAt: new Date().toISOString(),
    failed: results.length - passed,
    passed,
    requiredFields: REQUIRED_FIELDS,
    total: results.length
  };

  console.log(JSON.stringify({ results, summary }, null, 2));

  if (passed !== results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
