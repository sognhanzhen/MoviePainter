import fs from "node:fs";

const clientPath = "client/src/data/poster-prompt-presets.ts";
const serverPath = "server/src/data/poster-prompt-presets.ts";
const dimensions = ["shotScale", "characterPosition", "era", "scene", "style", "atmosphere", "tone", "composition"];
const requiredAiChatTerms = ["一张电影级海报", "场景", "人物", "风格", "氛围", "构图", "色调", "事件"];

function readPresetSource(path) {
  return fs.readFileSync(path, "utf8");
}

function normalizePresetSource(source) {
  return source.replace(/^import type \{[^}]+\} from ".+";\n\n/, "");
}

function readPresetIds(source) {
  return [...source.matchAll(/(?:^|\n)  "?([a-z0-9-]+)"?: createPreset\(/g)].map((match) => match[1]);
}

function readCuratedIds() {
  const curatedSource = fs.readFileSync("client/src/data/curated-movie-posters.ts", "utf8");
  return [...curatedSource.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
}

const clientSource = readPresetSource(clientPath);
const serverSource = readPresetSource(serverPath);
const clientIds = readPresetIds(clientSource);
const serverIds = readPresetIds(serverSource);
const curatedIds = readCuratedIds();
const missingClientIds = curatedIds.filter((id) => !clientIds.includes(id));
const missingServerIds = curatedIds.filter((id) => !serverIds.includes(id));
const clientBlocks = clientSource.split(/\n  "?[a-z0-9-]+"?: createPreset\(/).slice(1);
const aiChatPromptMatches = [
  ...clientSource.matchAll(/^\s+"([^"]+)":\n\s+"([^"]+)"/gm),
  ...clientSource.matchAll(/^\s+([A-Za-z][A-Za-z0-9 ]*):\n\s+"([^"]+)"/gm)
];
const missingAiChatTerms = aiChatPromptMatches
  .map((match) => ({
    title: match[1],
    missing: requiredAiChatTerms.filter((term) => !match[2].includes(term))
  }))
  .filter((entry) => entry.missing.length > 0);
const missingDimensions = clientBlocks
  .map((block, index) => ({
    id: clientIds[index],
    missing: dimensions.filter((dimension) => !block.includes(`${dimension}:`))
  }))
  .filter((entry) => entry.missing.length > 0);

const failures = [];

if (clientIds.length !== 30) {
  failures.push(`Expected 30 client presets, found ${clientIds.length}.`);
}

if (serverIds.length !== 30) {
  failures.push(`Expected 30 server presets, found ${serverIds.length}.`);
}

if (missingClientIds.length > 0) {
  failures.push(`Missing client presets: ${missingClientIds.join(", ")}`);
}

if (missingServerIds.length > 0) {
  failures.push(`Missing server presets: ${missingServerIds.join(", ")}`);
}

if (normalizePresetSource(clientSource) !== normalizePresetSource(serverSource)) {
  failures.push("Client and server preset sources have drifted.");
}

if (missingDimensions.length > 0) {
  failures.push(
    `Missing dimensions: ${missingDimensions
      .map((entry) => `${entry.id} [${entry.missing.join(", ")}]`)
      .join("; ")}`
  );
}

if (aiChatPromptMatches.length !== 30) {
  failures.push(`Expected 30 AI Chat prompt bodies, found ${aiChatPromptMatches.length}.`);
}

if (missingAiChatTerms.length > 0) {
  failures.push(
    `Missing AI Chat prompt terms: ${missingAiChatTerms
      .map((entry) => `${entry.title} [${entry.missing.join(", ")}]`)
      .join("; ")}`
  );
}

if (/event:\s*"[^"]+"/.test(clientSource) || /event:\s*"[^"]+"/.test(serverSource)) {
  failures.push("Event dimension must stay empty because it is user-defined.");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Prompt presets verified: 30 posters, 2 modes, AI Chat body prompts, 9 AI Draw dimensions with user-defined event.");
