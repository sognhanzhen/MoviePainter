import assert from "node:assert/strict";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  translate
} from "../client/src/i18n/messages";
import { curatedMoviePosterRecords } from "../client/src/data/curated-movie-posters";
import {
  formatDirectorValue,
  formatPosterAttributeValue,
  getPosterDisplay,
  getPosterGenreFilterValues
} from "../client/src/lib/poster-localization";

assert.equal(DEFAULT_LANGUAGE, "en-US", "English should be the default application language.");
assert.deepEqual(SUPPORTED_LANGUAGES, ["en-US", "zh-CN"], "Only English and Simplified Chinese are supported.");

assert.equal(translate("en-US", "brand.name"), "MoviePainter");
assert.equal(translate("zh-CN", "brand.name"), "MoviePainter");
assert.equal(translate("en-US", "nav.workspace"), "Workspace");
assert.equal(translate("zh-CN", "nav.workspace"), "生成工作区");
assert.equal(translate("en-US", "avatar.language"), "Language");
assert.equal(translate("zh-CN", "avatar.language"), "语言");

assert.equal(normalizeLanguage("zh-CN"), "zh-CN");
assert.equal(normalizeLanguage("en-US"), "en-US");
assert.equal(normalizeLanguage("zh"), "zh-CN");
assert.equal(normalizeLanguage("en"), "en-US");
assert.equal(normalizeLanguage("fr-FR"), DEFAULT_LANGUAGE);
assert.equal(normalizeLanguage(null), DEFAULT_LANGUAGE);

const inception = curatedMoviePosterRecords.find((poster) => poster.id === "inception");
assert.ok(inception, "Inception fixture should exist");
const zhInception = getPosterDisplay(inception, "zh-CN");
assert.equal(zhInception.title, "盗梦空间");
assert.equal(zhInception.director, "克里斯托弗·诺兰");
assert.equal(zhInception.genre, "动作 / 科幻");
assert.equal(getPosterGenreFilterValues(inception).includes("Sci-Fi"), true);
assert.equal(formatPosterAttributeValue("style", "Sci-Fi", "zh-CN"), "科幻");
assert.equal(formatDirectorValue("Christopher Nolan", "zh-CN"), zhInception.director);

assert.equal(translate("en-US", "brand.name"), "MoviePainter");
assert.equal(translate("zh-CN", "brand.name"), "MoviePainter");

process.stdout.write("i18n verification passed\n");
