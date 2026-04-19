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
  ],
  posterTitle: "Inception"
});

assert.match(prompt, /请基于参考海报《Inception》生成一张新的电影海报。/);
assert.match(prompt, /- 场景: 城市（权重 66%）\n  选项提示词：场景设定为城市/);
assert.match(prompt, /- 风格: 超现实（权重 84%）\n  选项提示词：整体采用超现实风格/);
assert.match(prompt, /- 事件: 城市空间开始折叠崩塌（权重 74%）\n  选项提示词：城市空间开始折叠崩塌/);

console.log("AI Draw prompt builder verified: selected labels resolve to model-ready option prompts.");
