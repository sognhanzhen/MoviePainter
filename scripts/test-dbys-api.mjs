const API_ENDPOINT = "https://api.iyuns.com/api/dbys";

const REQUIRED_FIELDS = ["poster", "title", "genre", "releaseDate", "director"];
const REQUEST_DELAY_MS = 1100;

const MOVIES = [
  {
    rank: 1,
    doubanId: "1292052",
    doubanTitle: "肖申克的救赎",
    imdbId: "tt0111161"
  },
  {
    rank: 2,
    doubanId: "1291546",
    doubanTitle: "霸王别姬",
    imdbId: "tt0106332"
  },
  {
    rank: 3,
    doubanId: "1292722",
    doubanTitle: "泰坦尼克号",
    imdbId: "tt0120338"
  },
  {
    rank: 4,
    doubanId: "1292720",
    doubanTitle: "阿甘正传",
    imdbId: "tt0109830"
  },
  {
    rank: 5,
    doubanId: "1291561",
    doubanTitle: "千与千寻",
    imdbId: "tt0245429"
  },
  {
    rank: 6,
    doubanId: "1292063",
    doubanTitle: "美丽人生",
    imdbId: "tt0118799"
  },
  {
    rank: 7,
    doubanId: "1889243",
    doubanTitle: "星际穿越",
    imdbId: "tt0816692"
  },
  {
    rank: 8,
    doubanId: "1295644",
    doubanTitle: "这个杀手不太冷",
    imdbId: "tt0110413"
  },
  {
    rank: 9,
    doubanId: "3541415",
    doubanTitle: "盗梦空间",
    imdbId: "tt1375666"
  },
  {
    rank: 10,
    doubanId: "1292064",
    doubanTitle: "楚门的世界",
    imdbId: "tt0120382"
  }
];

const REQUEST_STRATEGIES = [
  {
    label: "imdb-url",
    buildParams: (movie) => ({
      url: `https://www.imdb.com/title/${movie.imdbId}/`
    })
  },
  {
    label: "imdb-site-sid",
    buildParams: (movie) => ({
      sid: movie.imdbId,
      site: "imdb"
    })
  },
  {
    label: "douban-url",
    buildParams: (movie) => ({
      url: `https://movie.douban.com/subject/${movie.doubanId}/`
    })
  },
  {
    label: "douban-site-sid",
    buildParams: (movie) => ({
      sid: movie.doubanId,
      site: "douban"
    })
  }
];

function buildUrl(params) {
  const url = new URL(API_ENDPOINT);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

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
  } catch (error) {
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
      const normalized = value.filter(Boolean).join(" / ").trim();

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

function parseFormat(format) {
  if (typeof format !== "string" || !format.trim()) {
    return {};
  }

  const fieldPatterns = [
    ["poster", /(?:◎海报|海\s*报|poster)\s*[:：]\s*(.+)/i],
    ["title", /(?:◎片名|◎译名|片\s*名|译\s*名|title)\s*[:：]\s*(.+)/i],
    ["genre", /(?:◎类别|◎类型|类\s*型|genre)\s*[:：]\s*(.+)/i],
    ["releaseDate", /(?:◎上映日期|上映时间|上映日期|release(?: date)?)\s*[:：]\s*(.+)/i],
    ["director", /(?:◎导演|导\s*演|director)\s*[:：]\s*(.+)/i]
  ];

  return format.split(/\r?\n/).reduce((parsed, line) => {
    for (const [field, pattern] of fieldPatterns) {
      const match = line.match(pattern);

      if (match?.[1] && !parsed[field]) {
        parsed[field] = match[1].trim();
      }
    }

    return parsed;
  }, {});
}

function extractMovieFields(body) {
  const data = body?.data && !Array.isArray(body.data) ? body.data : {};
  const formatFields = parseFormat(body?.format);

  return {
    director: readField({ ...data, ...formatFields }, ["director", "directors", "directorName", "director_name"]),
    genre: readField({ ...data, ...formatFields }, ["genre", "genres", "category", "type"]),
    poster: readField({ ...data, ...formatFields }, ["poster", "posterUrl", "poster_url", "cover", "coverUrl", "cover_url", "image", "imageUrl"]),
    releaseDate: readField({ ...data, ...formatFields }, ["releaseDate", "release_date", "pubdate", "pubdates", "playdate", "year"]),
    title: readField({ ...data, ...formatFields }, ["title", "name", "chinese_title", "originTitle", "original_title"])
  };
}

function validateFields(fields) {
  return REQUIRED_FIELDS.filter((field) => !fields[field]);
}

function summarizeError(result) {
  if (!result.body) {
    return `HTTP ${result.httpStatus}; non-json ${result.contentType}; ${result.rawSnippet.replace(/\s+/g, " ").slice(0, 160)}`;
  }

  return result.body.error ? String(result.body.error) : `success=${String(result.body.success)}`;
}

async function testMovie(movie) {
  const attempts = [];

  for (const strategy of REQUEST_STRATEGIES) {
    const url = buildUrl(strategy.buildParams(movie));
    const result = await requestJson(url);
    const fields = extractMovieFields(result.body);
    const missingFields = validateFields(fields);
    const ok = result.httpStatus === 200 && result.body?.success === true && missingFields.length === 0;
    const attempt = {
      fields,
      label: strategy.label,
      missingFields,
      ok,
      requestId: result.body?.request_id ?? "",
      status: result.httpStatus,
      success: result.body?.success === true,
      error: ok ? "" : summarizeError(result)
    };

    attempts.push(attempt);

    if (ok) {
      return {
        ...movie,
        attempts,
        fields,
        ok: true,
        successfulStrategy: strategy.label
      };
    }

    await delay(REQUEST_DELAY_MS);
  }

  return {
    ...movie,
    attempts,
    fields: attempts.at(-1)?.fields ?? {},
    ok: false,
    successfulStrategy: ""
  };
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toTableRow(result) {
  const finalAttempt = result.attempts.at(-1);
  const firstError = result.attempts.find((attempt) => attempt.error)?.error ?? "";

  return {
    rank: result.rank,
    title: result.doubanTitle,
    imdbId: result.imdbId,
    ok: result.ok ? "PASS" : "FAIL",
    strategy: result.successfulStrategy || "none",
    missing: finalAttempt?.missingFields.join(",") || "-",
    error: firstError.slice(0, 90)
  };
}

async function main() {
  const results = [];

  console.log(`Testing ${API_ENDPOINT}`);
  console.log(`Required fields: ${REQUIRED_FIELDS.join(", ")}`);

  for (const movie of MOVIES) {
    const result = await testMovie(movie);
    results.push(result);

    const finalAttempt = result.attempts.at(-1);
    console.log(
      `${result.ok ? "PASS" : "FAIL"} #${movie.rank} ${movie.doubanTitle} (${movie.imdbId})` +
        ` strategy=${result.successfulStrategy || "none"}` +
        ` missing=${finalAttempt?.missingFields.join(",") || "-"}`
    );

    await delay(REQUEST_DELAY_MS);
  }

  console.table(results.map(toTableRow));

  const passed = results.filter((result) => result.ok).length;
  const summary = {
    apiEndpoint: API_ENDPOINT,
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
