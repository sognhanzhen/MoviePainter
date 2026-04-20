import assert from "node:assert/strict";

import { buildAiDrawPrompt } from "../client/src/lib/ai-draw-prompt.ts";

const prompt = buildAiDrawPrompt({
  modules: [
    {
      importedValue: "城市",
      key: "scene",
      label: "场景",
      selectedValue: "city",
      weight: 66
    },
    {
      importedValue: "超现实",
      key: "style",
      label: "风格",
      selectedValue: "poster-style",
      weight: 84
    },
    {
      importedValue: "城市空间开始折叠崩塌",
      key: "event",
      label: "事件",
      selectedValue: "custom",
      weight: 74
    }
  ]
});

assert.equal(
  prompt,
  [
    "场景设定为城市，加入高楼、街道、车流、玻璃幕墙、霓虹或天际线，让空间具有现代电影的都市张力。",
    "整体采用超现实风格，将真实元素错置、放大、悬浮或重组，制造梦境、寓言和不可能空间。",
    "城市空间开始折叠崩塌"
  ].join("\n")
);
assert.doesNotMatch(prompt, /Inception|参考海报|权重|选项提示词/);

console.log("AI Draw prompt builder verified: model prompt only includes selected option prompts and custom event content.");
