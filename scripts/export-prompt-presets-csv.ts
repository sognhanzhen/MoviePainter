import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { curatedMoviePosterRecords } from "../client/src/data/curated-movie-posters";
import { posterPromptPresets } from "../client/src/data/poster-prompt-presets";

const dimensionColumns = [
  ["人物景别", "shotScale"],
  ["人物位置", "characterPosition"],
  ["事件", "event"],
  ["年代", "era"],
  ["场景", "scene"],
  ["风格", "style"],
  ["氛围", "atmosphere"],
  ["色调", "tone"],
  ["构图", "composition"]
] as const;

const headers = [
  "序号",
  "海报ID",
  "电影标题",
  "年份",
  "导演",
  "类型",
  "海报URL",
  "AI Chat Prompt",
  "AI Draw Prompt",
  ...dimensionColumns.map(([label]) => label)
];

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

async function main() {
  const rows = curatedMoviePosterRecords.map((poster, index) => {
    if (!poster.promptPresets) {
      throw new Error(`Missing prompt preset for poster ${poster.id}`);
    }

    return [
      index + 1,
      poster.id,
      poster.title,
      poster.year,
      poster.director ?? "",
      poster.genre,
      poster.imageUrl,
      poster.promptPresets.aiChat,
      poster.promptPresets.aiDraw.prompt,
      ...dimensionColumns.map(([, key]) => poster.promptPresets?.aiDraw.dimensions[key] ?? "")
    ];
  });

  const presetCount = Object.keys(posterPromptPresets).length;

  if (presetCount !== 30 || rows.length !== 30) {
    throw new Error(`Expected 30 prompt presets and 30 poster rows, got ${presetCount} presets and ${rows.length} rows`);
  }

  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outputPath = path.join(projectRoot, "POSTER_PROMPT_PRESETS.csv");

  await fs.writeFile(outputPath, csv, "utf8");
  console.log(`Exported ${rows.length} poster prompt rows to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
