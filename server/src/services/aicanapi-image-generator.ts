import type {
  PosterRecord,
  WorkspaceGeneratedResult,
  WorkspaceGenerationInput,
  WorkspaceMode
} from "../domain/app-data";

export type AicanapiImageGeneratorConfig = {
  baseUrl: string;
  doubaoApiKey: string;
  doubaoImageModel: string;
  geminiApiKey: string;
  geminiImageModel: string;
};

type GenerateWorkspaceImagesInput = {
  config: AicanapiImageGeneratorConfig;
  generation: WorkspaceGenerationInput;
  poster: PosterRecord;
};

type ImageGenerationOutput = {
  height: number;
  imageUrl: string;
  summary: string;
  title: string;
  width: number;
};

type ResolvedModel = {
  apiKey: string;
  externalModel: string;
  label: string;
  provider: "doubao" | "gemini";
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_IMAGE_MIME_TYPE = "image/png";
const IMAGE_OUTPUT_COUNT = 4;

export async function generateWorkspaceImages({
  config,
  generation,
  poster
}: GenerateWorkspaceImagesInput): Promise<{
  height: number;
  insight: string;
  results: WorkspaceGeneratedResult[];
  width: number;
}> {
  const model = resolveModel(config, generation);
  const aspectRatio = resolveAspectRatio(generation.ratioId ?? poster.attributes.ratio);
  const size = resolveOpenAiImageSize(aspectRatio);
  const prompt = buildImagePrompt({ aspectRatio, generation, model, poster });
  const outputs =
    model.provider === "gemini"
      ? await generateWithGemini({ aspectRatio, count: IMAGE_OUTPUT_COUNT, model, prompt, size, url: resolveBaseUrl(config.baseUrl) })
      : await generateWithOpenAiImages({
          count: IMAGE_OUTPUT_COUNT,
          model,
          prompt,
          size,
          url: `${resolveBaseUrl(config.baseUrl)}/v1/images/generations`
        });
  const results = outputs.map((output, index) => ({
    id: `result-${generation.mode}-${poster.id}-${Date.now()}-${index + 1}`,
    imageUrl: output.imageUrl,
    summary: output.summary,
    title: output.title
  }));

  return {
    height: size.height,
    insight:
      generation.mode === "chat"
        ? `${model.label} 已生成 ${results.length} 张图。`
        : `${model.label} 已生成 ${results.length} 张图。`,
    results,
    width: size.width
  };
}

function resolveModel(config: AicanapiImageGeneratorConfig, generation: WorkspaceGenerationInput): ResolvedModel {
  const requestedModel = generation.modelId === "nano-banana-2" ? "nano-banana-2" : "doubao-seedance-5";

  if (requestedModel === "nano-banana-2") {
    assertConfigured(config.baseUrl, "AICANAPI_BASE_URL");
    assertConfigured(config.geminiApiKey, "AICANAPI_GEMINI_API_KEY");
    assertConfigured(config.geminiImageModel, "AICANAPI_GEMINI_IMAGE_MODEL");

    return {
      apiKey: config.geminiApiKey,
      externalModel: config.geminiImageModel,
      label: "nano banana 2",
      provider: "gemini"
    };
  }

  assertConfigured(config.baseUrl, "AICANAPI_BASE_URL");
  assertConfigured(config.doubaoApiKey, "AICANAPI_DOUBAO_API_KEY");
  assertConfigured(config.doubaoImageModel, "AICANAPI_DOUBAO_IMAGE_MODEL");

  return {
    apiKey: config.doubaoApiKey,
    externalModel: config.doubaoImageModel,
    label: "豆包 seedance 5.0",
    provider: "doubao"
  };
}

function assertConfigured(value: string, name: string) {
  if (!value.trim()) {
    throw new Error(`缺少 ${name}，无法调用真实图片模型`);
  }
}

async function generateWithOpenAiImages(input: {
  count: number;
  model: ResolvedModel;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  const imageUrls: string[] = [];

  for (let index = 0; index < input.count; index += 1) {
    const payload = {
      model: input.model.externalModel,
      n: 1,
      prompt: appendVariantPrompt(input.prompt, index, input.count),
      response_format: "b64_json",
      size: input.size.value
    };
    const json = await postJson(input.url, input.model.apiKey, payload);
    const nextImageUrls = extractOpenAiImageUrls(json);

    if (nextImageUrls.length === 0) {
      throw new Error(`${input.model.label} 第 ${index + 1} 张没有返回可展示图片`);
    }

    imageUrls.push(nextImageUrls[0]);
  }

  if (imageUrls.length === 0) {
    throw new Error(`${input.model.label} 没有返回可展示图片`);
  }

  return imageUrls.slice(0, input.count).map((imageUrl, index) => ({
    height: input.size.height,
    imageUrl,
    summary: `${input.model.label} 输出 ${index + 1}`,
    title: `生成图 ${index + 1}`,
    width: input.size.width
  }));
}

async function generateWithGeminiNative(input: {
  aspectRatio: string;
  model: ResolvedModel;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput> {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: input.prompt
          }
        ],
        role: "user"
      }
    ],
    generationConfig: {
      imageConfig: {
        aspectRatio: input.aspectRatio,
        imageSize: "1K"
      },
      responseModalities: ["TEXT", "IMAGE"]
    }
  };
  const json = await postJson(
    `${input.url}/v1beta/models/${encodeURIComponent(input.model.externalModel)}:generateContent`,
    input.model.apiKey,
    payload
  );
  const imageUrl = extractGeminiImageUrl(json);

  if (!imageUrl) {
    throw new Error(`${input.model.label} 没有返回可展示图片`);
  }

  return {
    height: input.size.height,
    imageUrl,
    summary: `${input.model.label} 真实生成结果，已转换成前端可直接展示的图片地址。`,
    title: `${input.model.label} 生成图`,
    width: input.size.width
  };
}

async function generateWithGemini(input: {
  aspectRatio: string;
  count: number;
  model: ResolvedModel;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  try {
    const outputs: ImageGenerationOutput[] = [];

    for (let index = 0; index < input.count; index += 1) {
      const output = await generateWithGeminiNative({
        ...input,
        prompt: appendVariantPrompt(input.prompt, index, input.count)
      });

      outputs.push({
        ...output,
        summary: `${input.model.label} 输出 ${index + 1}`,
        title: `生成图 ${index + 1}`
      });
    }

    return outputs;
  } catch (nativeError) {
    try {
      return await generateWithOpenAiImages({
        count: input.count,
        model: input.model,
        prompt: input.prompt,
        size: input.size,
        url: `${input.url}/v1/images/generations`
      });
    } catch (openAiError) {
      throw new Error(
        `${input.model.label} 调用失败。Gemini 原生接口：${toErrorMessage(nativeError)}；OpenAI 图片接口：${toErrorMessage(openAiError)}`
      );
    }
  }
}

async function postJson(url: string, apiKey: string, body: unknown) {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    const message = (extractApiErrorMessage(json) ?? text.trim()) || response.statusText;
    throw new Error(`AICANAPI 调用失败 (${response.status}): ${message}`);
  }

  return json;
}

function parseJson(text: string): unknown {
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function extractApiErrorMessage(json: unknown) {
  if (!isRecord(json)) {
    return null;
  }

  const error = json.error;

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return typeof json.message === "string" ? json.message : null;
}

function extractOpenAiImageUrls(json: unknown) {
  if (!isRecord(json) || !Array.isArray(json.data)) {
    return [];
  }

  const imageUrls: string[] = [];

  for (const item of json.data) {
    if (!isRecord(item)) {
      continue;
    }

    const b64Json = item.b64_json;
    const url = item.url;

    if (typeof b64Json === "string" && b64Json.trim()) {
      imageUrls.push(toDataUrl(b64Json, DEFAULT_IMAGE_MIME_TYPE));
      continue;
    }

    if (typeof url === "string" && url.trim()) {
      imageUrls.push(url);
    }
  }

  return imageUrls;
}

function extractGeminiImageUrl(json: unknown) {
  if (!isRecord(json) || !Array.isArray(json.candidates)) {
    return null;
  }

  for (const candidate of json.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      continue;
    }

    for (const part of candidate.content.parts) {
      if (!isRecord(part)) {
        continue;
      }

      const inlineData = readRecord(part.inlineData) ?? readRecord(part.inline_data);
      const fileData = readRecord(part.fileData) ?? readRecord(part.file_data);
      const fileUri = fileData?.fileUri ?? fileData?.file_uri;

      if (inlineData && typeof inlineData.data === "string" && inlineData.data.trim()) {
        const mimeType = readMimeType(inlineData);
        return toDataUrl(inlineData.data, mimeType);
      }

      if (typeof fileUri === "string" && fileUri.trim()) {
        return fileUri;
      }
    }
  }

  return null;
}

function readMimeType(record: JsonRecord) {
  const mimeType = record.mimeType ?? record.mime_type;

  return typeof mimeType === "string" && mimeType.trim() ? mimeType : DEFAULT_IMAGE_MIME_TYPE;
}

function toDataUrl(base64: string, mimeType: string) {
  if (base64.startsWith("data:")) {
    return base64;
  }

  return `data:${mimeType};base64,${base64}`;
}

function buildImagePrompt(input: {
  aspectRatio: string;
  generation: WorkspaceGenerationInput;
  model: ResolvedModel;
  poster: PosterRecord;
}) {
  const selectedModules = input.generation.selectedModules
    .map((moduleKey) => `${moduleKey}: ${readPosterAttribute(input.poster, moduleKey)}`)
    .join("\n");
  const moduleWeights = Object.entries(input.generation.moduleWeights)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ");

  return [
    "Create one finished cinematic movie poster image for direct display in a web application.",
    "Do not return explanations. The image should be polished, poster-like, and visually readable.",
    "Avoid random unreadable typography; if text appears, keep it subtle and poster-appropriate.",
    `Model route: ${input.model.label}`,
    `Mode: ${formatMode(input.generation.mode)}`,
    `Aspect ratio: ${input.aspectRatio}`,
    `User prompt: ${input.generation.prompt}`,
    `Reference title: ${input.poster.title}`,
    `Reference genre: ${input.poster.genre}`,
    `Reference summary: ${input.poster.summary}`,
    `Character: ${input.poster.attributes.character}`,
    `Style: ${input.poster.attributes.style}`,
    `Mood: ${input.poster.attributes.mood}`,
    `Tone: ${input.poster.attributes.tone}`,
    `Composition: ${input.poster.attributes.composition}`,
    selectedModules ? `Selected draw modules:\n${selectedModules}` : "",
    moduleWeights ? `Module weights: ${moduleWeights}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function formatMode(mode: WorkspaceMode) {
  return mode === "chat" ? "AI Chat" : "AI Draw";
}

function resolveBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

type ResolvedSize = {
  height: number;
  value: "1024x1024" | "1024x1536" | "1536x1024";
  width: number;
};

function resolveOpenAiImageSize(aspectRatio: string): ResolvedSize {
  if (["16:9", "3:2", "21:9"].includes(aspectRatio)) {
    return {
      height: 1024,
      value: "1536x1024",
      width: 1536
    };
  }

  if (["9:16", "2:3", "3:4", "4:5"].includes(aspectRatio)) {
    return {
      height: 1536,
      value: "1024x1536",
      width: 1024
    };
  }

  return {
    height: 1024,
    value: "1024x1024",
    width: 1024
  };
}

function resolveAspectRatio(value: string | undefined) {
  const ratio = value?.match(/(21:9|16:9|9:16|4:5|5:4|4:3|3:4|3:2|2:3|1:1)/)?.[1];

  return ratio ?? "1:1";
}

function appendVariantPrompt(prompt: string, index: number, count: number) {
  return `${prompt}\nGenerate variant ${index + 1} of ${count}; keep the same brief but change composition, lighting, or camera distance.`;
}

function readPosterAttribute(poster: PosterRecord, key: string) {
  return isPosterAttributeKey(key) ? poster.attributes[key] : "";
}

function isPosterAttributeKey(key: string): key is keyof PosterRecord["attributes"] {
  return ["character", "composition", "mood", "ratio", "style", "tone"].includes(key);
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
