import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { aiDrawOptionPrompts, validateAiDrawOptionPromptCounts } from "../client/src/data/ai-draw-option-prompts";

const headers = ["序号", "维度Key", "维度", "选项Key", "选项", "当前按钮说明", "大模型Prompt"];

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

async function main() {
  const countFailures = validateAiDrawOptionPromptCounts();

  if (countFailures.length > 0) {
    throw new Error(
      `AI Draw option prompt count mismatch:\n${countFailures
        .map((failure) => `${failure.dimensionKey}: expected ${failure.expected}, got ${failure.actual}`)
        .join("\n")}`
    );
  }

  const duplicateKeys = aiDrawOptionPrompts
    .map((row) => `${row.dimensionKey}:${row.optionValue}`)
    .filter((key, index, keys) => keys.indexOf(key) !== index);

  if (duplicateKeys.length > 0) {
    throw new Error(`Duplicate AI Draw option prompt keys: ${duplicateKeys.join(", ")}`);
  }

  const rows = aiDrawOptionPrompts.map((row, index) => [
    index + 1,
    row.dimensionKey,
    row.dimensionLabel,
    row.optionValue,
    row.optionLabel,
    row.optionDescription,
    row.prompt
  ]);

  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outputPath = path.join(projectRoot, "AI_DRAW_OPTION_PROMPTS.csv");

  await fs.writeFile(outputPath, csv, "utf8");
  console.log(`Exported ${aiDrawOptionPrompts.length} AI Draw option prompt rows to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
