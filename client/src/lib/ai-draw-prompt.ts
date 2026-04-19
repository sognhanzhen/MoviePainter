import { resolveAiDrawOptionPrompt } from "../data/ai-draw-option-prompts";

export type AiDrawPromptModule = {
  importedValue: string;
  key: string;
  label: string;
  selectedValue: string;
  weight: number;
};

export type BuildAiDrawPromptInput = {
  modules: AiDrawPromptModule[];
  posterTitle: string;
};

function resolveModulePrompt(module: AiDrawPromptModule) {
  const optionLabel = module.importedValue.trim();

  if (module.key === "event") {
    return optionLabel;
  }

  return (
    resolveAiDrawOptionPrompt({
      dimensionKey: module.key,
      optionLabel,
      optionValue: module.selectedValue
    })?.prompt ?? optionLabel
  );
}

export function buildAiDrawPrompt({ modules, posterTitle }: BuildAiDrawPromptInput) {
  const selectedModules = modules.map((module) => {
    const optionLabel = module.importedValue.trim();
    const modelPrompt = resolveModulePrompt(module);

    return `- ${module.label}: ${optionLabel}（权重 ${module.weight}%）\n  选项提示词：${modelPrompt}`;
  });

  return [
    `请基于参考海报《${posterTitle}》生成一张新的电影海报。`,
    "AI Draw 只应用用户明确选择的维度；未列出的维度不要从参考海报迁移。",
    "事件为用户自定义维度，如果未列出事件，不要自行补写事件。",
    "已选择维度：",
    selectedModules.join("\n")
  ].join("\n");
}
