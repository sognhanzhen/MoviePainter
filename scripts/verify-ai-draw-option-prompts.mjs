import assert from "node:assert/strict";

import {
  aiDrawOptionPromptCounts,
  aiDrawOptionPrompts,
  getAiDrawOptionPrompt,
  resolveAiDrawOptionPrompt
} from "../client/src/data/ai-draw-option-prompts.ts";

const expectedCounts = {
  atmosphere: 20,
  characterPosition: 5,
  composition: 15,
  era: 19,
  scene: 21,
  shotScale: 8,
  style: 11,
  tone: 16
};

assert.equal(aiDrawOptionPrompts.length, 115, "AI Draw should expose 115 runtime option prompts.");
assert.deepEqual(aiDrawOptionPromptCounts, expectedCounts, "Runtime option prompt counts should match the UI option set.");

assert.match(
  getAiDrawOptionPrompt("scene", "city")?.prompt ?? "",
  /场景设定为城市/,
  "Option value lookup should resolve the city scene prompt."
);

assert.match(
  resolveAiDrawOptionPrompt({
    dimensionKey: "style",
    optionLabel: "超现实",
    optionValue: "poster-style"
  })?.prompt ?? "",
  /超现实风格/,
  "Poster-imported Chinese labels should resolve to their option prompt."
);

assert.equal(
  resolveAiDrawOptionPrompt({
    dimensionKey: "event",
    optionLabel: "用户自定义事件",
    optionValue: "custom"
  }),
  null,
  "The event dimension is user-defined and should not use predefined option prompts."
);

console.log("AI Draw option prompts verified: 115 runtime prompts with value and label resolution.");
