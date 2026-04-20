import assert from "node:assert/strict";
import { curatedMoviePosterRecords } from "../client/src/data/curated-movie-posters";
import { buildFilterDefinitions, matchesFilters } from "../client/src/pages/LibraryPage";

const definitions = buildFilterDefinitions(curatedMoviePosterRecords, "en-US");
const zhDefinitions = buildFilterDefinitions(curatedMoviePosterRecords, "zh-CN");

function labelsFor(key: "director" | "mood" | "style" | "tone" | "type", language: "en-US" | "zh-CN" = "en-US") {
  const definition = (language === "zh-CN" ? zhDefinitions : definitions).find((filter) => filter.key === key);
  assert.ok(definition, `Missing ${key} filter definition`);
  return definition.options.slice(1).map((option) => option.label);
}

function valuesFor(key: "director" | "mood" | "style" | "tone" | "type", language: "en-US" | "zh-CN" = "en-US") {
  const definition = (language === "zh-CN" ? zhDefinitions : definitions).find((filter) => filter.key === key);
  assert.ok(definition, `Missing ${key} filter definition`);
  return definition.options.slice(1).map((option) => option.value);
}

for (const key of ["type", "style", "mood", "tone"] as const) {
  const labels = labelsFor(key);
  assert.ok(labels.length > 0, `${key} should have filter labels`);
  assert.equal(
    labels.some((label) => label.includes(" / ")),
    false,
    `${key} labels should be single values, not slash-separated pairs`
  );
}

assert.ok(labelsFor("type").includes("Sci-Fi"), "Type filter should expose Sci-Fi as its own option");
assert.ok(labelsFor("style").includes("Sci-Fi"), "Style filter should expose Sci-Fi as its own option");
assert.ok(labelsFor("mood").includes("immersive"), "Mood filter should expose immersive as its own option");
assert.ok(labelsFor("tone").includes("amber contrast"), "Tone filter should expose amber contrast as its own option");
assert.ok(labelsFor("type", "zh-CN").includes("科幻"), "Chinese type filter should expose 科幻 as its own option");
assert.ok(labelsFor("style", "zh-CN").includes("科幻"), "Chinese style filter should expose 科幻 as its own option");
assert.ok(labelsFor("mood", "zh-CN").includes("沉浸"), "Chinese mood filter should expose 沉浸 as its own option");
assert.ok(labelsFor("tone", "zh-CN").includes("琥珀对比"), "Chinese tone filter should expose 琥珀对比 as its own option");
assert.ok(labelsFor("director", "zh-CN").includes("克里斯托弗·诺兰"), "Chinese director filter should align with poster panel director");
assert.ok(valuesFor("type", "zh-CN").includes("Sci-Fi"), "Chinese type filter values should keep canonical matching tokens");

const inception = curatedMoviePosterRecords[0];

assert.equal(
  matchesFilters(inception, {
    composition: "all",
    director: "all",
    era: "all",
    mood: "all",
    style: "all",
    tone: "all",
    type: "Sci-Fi"
  }),
  true,
  "Type token should match a poster with a slash-separated genre"
);

assert.equal(
  matchesFilters(inception, {
    composition: "all",
    director: "all",
    era: "all",
    mood: "immersive",
    style: "Sci-Fi",
    tone: "amber contrast",
    type: "all"
  }),
  true,
  "Attribute tokens should match posters with slash-separated style, mood, and tone"
);
