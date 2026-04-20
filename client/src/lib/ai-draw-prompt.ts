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

export function buildAiDrawPrompt({ modules }: BuildAiDrawPromptInput) {
  return modules
    .map((module) => resolveModulePrompt(module).trim())
    .filter(Boolean)
    .join("\n");
}
