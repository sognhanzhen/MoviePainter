import type { PosterRecord } from "../data/posters";
import type { Language } from "../i18n/messages";

type LocalizedText = Record<Language, string>;

type LocalizedPosterMetadata = {
  director: string;
  title: string;
};

const genreLabels: Record<string, LocalizedText> = {
  Action: { "en-US": "Action", "zh-CN": "动作" },
  Adventure: { "en-US": "Adventure", "zh-CN": "冒险" },
  Animation: { "en-US": "Animation", "zh-CN": "动画" },
  Biographical: { "en-US": "Biographical", "zh-CN": "传记" },
  "Black Comedy": { "en-US": "Black Comedy", "zh-CN": "黑色喜剧" },
  Comedy: { "en-US": "Comedy", "zh-CN": "喜剧" },
  "Coming-of-Age": { "en-US": "Coming-of-Age", "zh-CN": "成长" },
  Crime: { "en-US": "Crime", "zh-CN": "犯罪" },
  Drama: { "en-US": "Drama", "zh-CN": "剧情" },
  Fantasy: { "en-US": "Fantasy", "zh-CN": "奇幻" },
  Horror: { "en-US": "Horror", "zh-CN": "恐怖" },
  Music: { "en-US": "Music", "zh-CN": "音乐" },
  Musical: { "en-US": "Musical", "zh-CN": "歌舞" },
  "Neo-Noir": { "en-US": "Neo-Noir", "zh-CN": "新黑色电影" },
  Romance: { "en-US": "Romance", "zh-CN": "爱情" },
  "Sci-Fi": { "en-US": "Sci-Fi", "zh-CN": "科幻" },
  Thriller: { "en-US": "Thriller", "zh-CN": "惊悚" },
  War: { "en-US": "War", "zh-CN": "战争" }
};

const moodLabels: Record<string, LocalizedText> = {
  atmospheric: { "en-US": "atmospheric", "zh-CN": "氛围感" },
  dreamlike: { "en-US": "dreamlike", "zh-CN": "梦幻" },
  epic: { "en-US": "epic", "zh-CN": "史诗" },
  immersive: { "en-US": "immersive", "zh-CN": "沉浸" },
  intimate: { "en-US": "intimate", "zh-CN": "亲密" },
  kinetic: { "en-US": "kinetic", "zh-CN": "动感" },
  melancholic: { "en-US": "melancholic", "zh-CN": "忧郁" },
  mysterious: { "en-US": "mysterious", "zh-CN": "神秘" },
  stylized: { "en-US": "stylized", "zh-CN": "风格化" },
  tense: { "en-US": "tense", "zh-CN": "紧张" }
};

const toneLabels: Record<string, LocalizedText> = {
  "amber contrast": { "en-US": "amber contrast", "zh-CN": "琥珀对比" },
  "cold blue": { "en-US": "cold blue", "zh-CN": "冷蓝" },
  "deep black": { "en-US": "deep black", "zh-CN": "深黑" },
  gold: { "en-US": "gold", "zh-CN": "金色" },
  "muted earth": { "en-US": "muted earth", "zh-CN": "柔和大地色" },
  "neon accent": { "en-US": "neon accent", "zh-CN": "霓虹点缀" },
  "rose red": { "en-US": "rose red", "zh-CN": "玫瑰红" },
  "shadow blue": { "en-US": "shadow blue", "zh-CN": "阴影蓝" },
  "silver grey": { "en-US": "silver grey", "zh-CN": "银灰" },
  "warm spotlight": { "en-US": "warm spotlight", "zh-CN": "暖色聚光" }
};

const directorLabels: Record<string, string> = {
  "Ang Lee": "李安",
  "Barry Jenkins": "巴里·杰金斯",
  "Bong Joon-ho": "奉俊昊",
  "Christopher Nolan": "克里斯托弗·诺兰",
  "Damien Chazelle": "达米恩·查泽雷",
  "Dan Kwan": "丹·关",
  "Daniel Scheinert": "丹尼尔·施纳特",
  "Darren Aronofsky": "达伦·阿伦诺夫斯基",
  "David Fincher": "大卫·芬奇",
  "Denis Villeneuve": "丹尼斯·维伦纽瓦",
  "Ethan Coen": "伊桑·科恩",
  "Francis Ford Coppola": "弗朗西斯·福特·科波拉",
  "George Miller": "乔治·米勒",
  "Guillermo del Toro": "吉尔莫·德尔·托罗",
  "Hayao Miyazaki": "宫崎骏",
  "Jean-Pierre Jeunet": "让-皮埃尔·热内",
  "Joel Coen": "乔尔·科恩",
  "Jonathan Demme": "乔纳森·戴米",
  "Jordan Peele": "乔丹·皮尔",
  "Lana Wachowski": "拉娜·沃卓斯基",
  "Lilly Wachowski": "莉莉·沃卓斯基",
  "Peter Jackson": "彼得·杰克逊",
  "Quentin Tarantino": "昆汀·塔伦蒂诺",
  "Spike Jonze": "斯派克·琼斯",
  "Wes Anderson": "韦斯·安德森"
};

const zhPosterMetadata: Record<string, LocalizedPosterMetadata> = {
  amelie: { title: "天使爱美丽", director: "让-皮埃尔·热内" },
  arrival: { title: "降临", director: "丹尼斯·维伦纽瓦" },
  "black-swan": { title: "黑天鹅", director: "达伦·阿伦诺夫斯基" },
  "blade-runner-2049": { title: "银翼杀手2049", director: "丹尼斯·维伦纽瓦" },
  "crouching-tiger-hidden-dragon": { title: "卧虎藏龙", director: "李安" },
  dune: { title: "沙丘", director: "丹尼斯·维伦纽瓦" },
  "dune-part-two": { title: "沙丘2", director: "丹尼斯·维伦纽瓦" },
  "everything-everywhere-all-at-once": { title: "瞬息全宇宙", director: "丹·关 / 丹尼尔·施纳特" },
  "fight-club": { title: "搏击俱乐部", director: "大卫·芬奇" },
  "get-out": { title: "逃出绝命镇", director: "乔丹·皮尔" },
  her: { title: "她", director: "斯派克·琼斯" },
  inception: { title: "盗梦空间", director: "克里斯托弗·诺兰" },
  interstellar: { title: "星际穿越", director: "克里斯托弗·诺兰" },
  "la-la-land": { title: "爱乐之城", director: "达米恩·查泽雷" },
  "mad-max-fury-road": { title: "疯狂的麦克斯4：狂暴之路", director: "乔治·米勒" },
  moonlight: { title: "月光男孩", director: "巴里·杰金斯" },
  "no-country-for-old-men": { title: "老无所依", director: "伊桑·科恩 / 乔尔·科恩" },
  "pans-labyrinth": { title: "潘神的迷宫", director: "吉尔莫·德尔·托罗" },
  parasite: { title: "寄生虫", director: "奉俊昊" },
  "pulp-fiction": { title: "低俗小说", director: "昆汀·塔伦蒂诺" },
  "spirited-away": { title: "千与千寻", director: "宫崎骏" },
  "the-dark-knight": { title: "蝙蝠侠：黑暗骑士", director: "克里斯托弗·诺兰" },
  "the-fellowship-of-the-ring": { title: "指环王：护戒使者", director: "彼得·杰克逊" },
  "the-godfather": { title: "教父", director: "弗朗西斯·福特·科波拉" },
  "the-grand-budapest-hotel": { title: "布达佩斯大饭店", director: "韦斯·安德森" },
  "the-matrix": { title: "黑客帝国", director: "拉娜·沃卓斯基 / 莉莉·沃卓斯基" },
  "the-shape-of-water": { title: "水形物语", director: "吉尔莫·德尔·托罗" },
  "the-silence-of-the-lambs": { title: "沉默的羔羊", director: "乔纳森·戴米" },
  "the-social-network": { title: "社交网络", director: "大卫·芬奇" },
  whiplash: { title: "爆裂鼓手", director: "达米恩·查泽雷" }
};

export function splitPosterTokens(value: string) {
  return value
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getPosterTitle(poster: PosterRecord, language: Language) {
  return language === "zh-CN" ? (zhPosterMetadata[poster.id]?.title ?? poster.title) : poster.title;
}

export function getPosterDirector(poster: PosterRecord, language: Language) {
  const director = poster.director ?? poster.region;
  return language === "zh-CN" ? (zhPosterMetadata[poster.id]?.director ?? formatDirectorValue(director, language)) : director;
}

export function getPosterGenreLabel(poster: PosterRecord, language: Language) {
  return formatGenreValue(poster.genre, language);
}

export function getPosterSummary(poster: PosterRecord, language: Language) {
  if (language !== "zh-CN") {
    return poster.summary;
  }

  const title = getPosterTitle(poster, language);
  const director = getPosterDirector(poster, language);
  const genre = getPosterGenreLabel(poster, language);

  return `《${title}》参考海报，导演 ${director}，类型为 ${genre}。用于分析海报的类型、构图、风格、氛围与色调。`;
}

export function getPosterDisplay(poster: PosterRecord, language: Language) {
  return {
    director: getPosterDirector(poster, language),
    genre: getPosterGenreLabel(poster, language),
    summary: getPosterSummary(poster, language),
    title: getPosterTitle(poster, language)
  };
}

export function getPosterGenreFilterValues(poster: PosterRecord) {
  return splitPosterTokens(poster.genre);
}

export function getPosterAttributeFilterValues(poster: PosterRecord, attribute: keyof PosterRecord["attributes"]) {
  const values = splitPosterTokens(poster.attributes[attribute]);

  if (attribute === "style") {
    return values.map((value) => value.replace(/\s+movie poster$/i, "").trim()).filter(Boolean);
  }

  return values;
}

export function formatGenreValue(value: string, language: Language) {
  return splitPosterTokens(value)
    .map((token) => formatGenreToken(token, language))
    .join(" / ");
}

export function formatGenreToken(token: string, language: Language) {
  return genreLabels[token]?.[language] ?? token;
}

export function formatDirectorValue(value: string, language: Language) {
  if (language !== "zh-CN") {
    return value;
  }

  return splitPosterTokens(value)
    .map((director) => directorLabels[director] ?? director)
    .join(" / ");
}

export function formatPosterAttributeValue(
  attribute: keyof PosterRecord["attributes"],
  value: string,
  language: Language
) {
  if (attribute === "style") {
    return formatGenreToken(value, language);
  }

  if (attribute === "mood") {
    return moodLabels[value]?.[language] ?? value;
  }

  if (attribute === "tone") {
    return toneLabels[value]?.[language] ?? value;
  }

  return value;
}
