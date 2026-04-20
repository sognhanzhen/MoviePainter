import type {
  PosterRecord,
  WorkspaceGeneratedResult,
  WorkspaceGenerationInput
} from "../domain/app-data.js";

export type AicanapiImageGeneratorConfig = {
  baseUrl: string;
  doubaoApiKey: string;
  doubaoImageModel: string;
  geminiApiKey: string;
  geminiImageModel: string;
  imageApiStyle: string;
  dashscopeApiKey: string;
  dashscopeBaseUrl: string;
  dashscopeWanImageModel: string;
};

type GenerateWorkspaceImagesInput = {
  config: AicanapiImageGeneratorConfig;
  generation: WorkspaceGenerationInput;
  onProgress?: WorkspaceGenerationProgressHandler;
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
  provider: "doubao" | "gemini" | "dashscope";
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_IMAGE_MIME_TYPE = "image/png";
const IMAGE_OUTPUT_COUNT = 1;

export type WorkspaceGenerationProgressEvent = {
  attempt?: number;
  elapsedMs?: number;
  imageCount?: number;
  message: string;
  modelLabel?: string;
  phase:
    | "failed"
    | "fallback"
    | "polling"
    | "preparing"
    | "receiving"
    | "saving"
    | "submitted"
    | "submitting"
    | "succeeded";
  provider?: ResolvedModel["provider"];
  taskId?: string;
  taskStatus?: string;
  timestamp: string;
  totalImages?: number;
};

export type WorkspaceGenerationProgressHandler = (event: WorkspaceGenerationProgressEvent) => void;
type WorkspaceGenerationProgressDraft = Omit<WorkspaceGenerationProgressEvent, "timestamp">;
type InternalProgressEmitter = (event: WorkspaceGenerationProgressDraft) => void;

export async function generateWorkspaceImages({
  config,
  generation,
  onProgress,
  poster
}: GenerateWorkspaceImagesInput): Promise<{
  height: number;
  insight: string;
  results: WorkspaceGeneratedResult[];
  width: number;
}> {
  const initialModel = resolveModel(config, generation);
  const aspectRatio = resolveAspectRatio(generation.ratioId ?? poster.attributes.ratio);
  const emitProgress = createProgressEmitter(onProgress);

  async function performGeneration(model: ResolvedModel) {
    const apiStyle = resolveImageApiStyle(config);
    const size =
      model.provider === "dashscope"
        ? resolveDashScopeSize(aspectRatio, model.externalModel)
        : apiStyle === "modelgate"
        ? resolveModelGateImageSize(aspectRatio, model.provider)
        : resolveOpenAiImageSize(aspectRatio);
    const prompt = buildImagePrompt({ aspectRatio, generation, model, poster });
    emitProgress({
      imageCount: 0,
      message: `${model.label} 正在准备生成 ${IMAGE_OUTPUT_COUNT} 张图。`,
      modelLabel: model.label,
      phase: "preparing",
      provider: model.provider,
      totalImages: IMAGE_OUTPUT_COUNT
    });

    if (model.provider === "dashscope") {
      return {
        outputs: await generateWithDashScope({
          count: IMAGE_OUTPUT_COUNT,
          model,
          onProgress: emitProgress,
          prompt,
          size,
          url: config.dashscopeBaseUrl
        }),
        size
      };
    }

    const outputs =
      apiStyle === "modelgate"
        ? await generateWithModelGate({
            count: IMAGE_OUTPUT_COUNT,
            model,
            onProgress: emitProgress,
            prompt,
            size,
            url: resolveImageGenerationUrl(config.baseUrl, apiStyle)
          })
        : model.provider === "gemini"
        ? await generateWithGemini({
            aspectRatio,
            count: IMAGE_OUTPUT_COUNT,
            model,
            onProgress: emitProgress,
            prompt,
            size,
            url: resolveBaseUrl(config.baseUrl)
          })
        : await generateWithOpenAiImages({
            count: IMAGE_OUTPUT_COUNT,
            model,
            onProgress: emitProgress,
            prompt,
            size,
            url: resolveImageGenerationUrl(config.baseUrl, apiStyle)
          });
    return { outputs, size };
  }

  let finalOutputs: ImageGenerationOutput[];
  let finalSize: ResolvedSize;
  let finalModelLabel = initialModel.label;

  try {
    const res = await performGeneration(initialModel);
    finalOutputs = res.outputs;
    finalSize = res.size;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isSensitive = errorMsg.includes("415") || errorMsg.includes("sensitive content");

    if (initialModel.provider !== "dashscope" && !isSensitive) {
      console.log(`[ImageGen] ${initialModel.provider} 失败，尝试 fallback 到万相。原因: ${errorMsg}`);
      emitProgress({
        imageCount: 0,
        message: `${initialModel.label} 调用失败，正在切换到 Qwen 万相备用链路。`,
        modelLabel: initialModel.label,
        phase: "fallback",
        provider: initialModel.provider,
        totalImages: IMAGE_OUTPUT_COUNT
      });
      const fallbackModel = resolveModel(config, { ...generation, modelId: "wan2.7-image-pro" } as unknown as WorkspaceGenerationInput);
      try {
        const res = await performGeneration(fallbackModel);
        finalOutputs = res.outputs;
        finalSize = res.size;
        finalModelLabel = fallbackModel.label;
      } catch (fallbackError) {
        throw new Error(
          `模型调用失败。首选模型出错: ${toErrorMessage(error)}；备用万相模型也出错: ${toErrorMessage(fallbackError)}`
        );
      }
    } else {
      if (isSensitive) {
        emitProgress({
          imageCount: 0,
          message: "输入提示可能包含敏感内容，模型拒绝生成。",
          modelLabel: initialModel.label,
          phase: "failed",
          provider: initialModel.provider,
          totalImages: IMAGE_OUTPUT_COUNT
        });
        throw new Error(`输入提示可能包含敏感内容被拒 (415)，请修改提示词或更换参考海报再试。错误详细: ${errorMsg}`);
      }
      if (errorMsg.includes("503") || errorMsg.includes("逆向分组")) {
        emitProgress({
          imageCount: 0,
          message: "当前提供商负载过高，请稍后重试或更换模型。",
          modelLabel: initialModel.label,
          phase: "failed",
          provider: initialModel.provider,
          totalImages: IMAGE_OUTPUT_COUNT
        });
        throw new Error(`当前提供商负载过高 (503)，请稍后重试或更换为其他生图模型。详细: ${errorMsg}`);
      }
      emitProgress({
        imageCount: 0,
        message: `${initialModel.label} 调用失败：${errorMsg}`,
        modelLabel: initialModel.label,
        phase: "failed",
        provider: initialModel.provider,
        totalImages: IMAGE_OUTPUT_COUNT
      });
      throw error;
    }
  }

  const results = finalOutputs.map((output, index) => ({
    id: `result-${generation.mode}-${poster.id}-${Date.now()}-${index + 1}`,
    imageUrl: output.imageUrl,
    summary: output.summary,
    title: output.title
  }));

  return {
    height: finalSize.height,
    insight:
      generation.mode === "chat"
        ? `${finalModelLabel} 已生成 ${results.length} 张图。生图过程会自动保存。`
        : `${finalModelLabel} 已生成 ${results.length} 张图。`,
    results,
    width: finalSize.width
  };
}

function resolveModel(config: AicanapiImageGeneratorConfig, generation: WorkspaceGenerationInput): ResolvedModel {
  const requestedModel = generation.modelId;

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

  if (requestedModel === "wan2.7-image-pro") {
    assertConfigured(config.dashscopeBaseUrl, "DASHSCOPE_BASE_URL");
    assertConfigured(config.dashscopeApiKey, "DASHSCOPE_API_KEY");
    assertConfigured(config.dashscopeWanImageModel, "DASHSCOPE_WAN_IMAGE_MODEL");

    return {
      apiKey: config.dashscopeApiKey,
      externalModel: config.dashscopeWanImageModel,
      label: "Qwen 万相 2.7 Pro",
      provider: "dashscope"
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
  onProgress: InternalProgressEmitter;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  const imageUrls: string[] = [];

  for (let index = 0; index < input.count; index += 1) {
    input.onProgress({
      attempt: index + 1,
      imageCount: imageUrls.length,
      message: `${input.model.label} 正在向图片接口提交第 ${index + 1} 张图。`,
      modelLabel: input.model.label,
      phase: "submitting",
      provider: input.model.provider,
      totalImages: input.count
    });
    const payload = {
      model: input.model.externalModel,
      n: 1,
      prompt: appendVariantPrompt(input.prompt, index, input.count),
      response_format: "b64_json",
      size: input.size.value
    };
    const json = await postJson(input.url, input.model.apiKey, payload);
    const nextImageUrls = extractImageUrls(json);

    if (nextImageUrls.length === 0) {
      throw new Error(`${input.model.label} 第 ${index + 1} 张没有返回可展示图片`);
    }

    imageUrls.push(nextImageUrls[0]);
    input.onProgress({
      attempt: index + 1,
      imageCount: imageUrls.length,
      message: `${input.model.label} 已返回 ${imageUrls.length} 张可展示图片。`,
      modelLabel: input.model.label,
      phase: "receiving",
      provider: input.model.provider,
      totalImages: input.count
    });
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

async function generateWithModelGate(input: {
  count: number;
  model: ResolvedModel;
  onProgress: InternalProgressEmitter;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  if (input.model.provider === "doubao") {
    input.onProgress({
      imageCount: 0,
      message: `${input.model.label} 正在向 ModelGate 提交图片请求。`,
      modelLabel: input.model.label,
      phase: "submitting",
      provider: input.model.provider,
      totalImages: input.count
    });
    const payload = {
      output_type: "base64",
      number_results: input.count,
      model: input.model.externalModel,
      prompt: input.prompt,
      size: input.size.value,
      output_format: "png"
    };
    const json = await postJson(input.url, input.model.apiKey, payload);
    const imageUrls = extractImageUrls(json);

    if (imageUrls.length === 0) {
      throw new Error(`${input.model.label} 没有返回可展示图片`);
    }

    input.onProgress({
      imageCount: Math.min(imageUrls.length, input.count),
      message: `${input.model.label} 已返回 ${Math.min(imageUrls.length, input.count)} 张可展示图片。`,
      modelLabel: input.model.label,
      phase: "receiving",
      provider: input.model.provider,
      totalImages: input.count
    });

    return imageUrls.slice(0, input.count).map((imageUrl, index) => ({
      height: input.size.height,
      imageUrl,
      summary: `${input.model.label} 输出 ${index + 1}`,
      title: `生成图 ${index + 1}`,
      width: input.size.width
    }));
  }

  const outputs: ImageGenerationOutput[] = [];

  for (let index = 0; index < input.count; index += 1) {
    input.onProgress({
      attempt: index + 1,
      imageCount: outputs.length,
      message: `${input.model.label} 正在提交第 ${index + 1} 张图。`,
      modelLabel: input.model.label,
      phase: "submitting",
      provider: input.model.provider,
      totalImages: input.count
    });
    const payload = {
      model: input.model.externalModel,
      prompt: appendVariantPrompt(input.prompt, index, input.count),
      size: input.size.value,
      output_type: "base64",
      output_format: "png"
    };
    const json = await postJson(input.url, input.model.apiKey, payload);
    const imageUrls = extractImageUrls(json);

    if (imageUrls.length === 0) {
      throw new Error(`${input.model.label} 第 ${index + 1} 张没有返回可展示图片`);
    }

    outputs.push({
      height: input.size.height,
      imageUrl: imageUrls[0],
      summary: `${input.model.label} 输出 ${index + 1}`,
      title: `生成图 ${index + 1}`,
      width: input.size.width
    });
    input.onProgress({
      attempt: index + 1,
      imageCount: outputs.length,
      message: `${input.model.label} 已返回 ${outputs.length} 张可展示图片。`,
      modelLabel: input.model.label,
      phase: "receiving",
      provider: input.model.provider,
      totalImages: input.count
    });
  }

  return outputs;
}

async function generateWithDashScope(input: {
  count: number;
  model: ResolvedModel;
  onProgress: InternalProgressEmitter;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  const usesWan27Api = isDashScopeWan27Model(input.model.externalModel);
  const apiUrl = `${input.url}${
    usesWan27Api ? "/services/aigc/image-generation/generation" : "/services/aigc/text2image/image-synthesis"
  }`;
  const headers = {
    Authorization: `Bearer ${input.model.apiKey}`,
    "Content-Type": "application/json",
    "X-DashScope-Async": "enable"
  };
  const payload = usesWan27Api ? buildWan27DashScopePayload(input) : buildLegacyDashScopePayload(input);
  const startedAt = Date.now();

  input.onProgress({
    elapsedMs: 0,
    imageCount: 0,
    message: `${input.model.label} 正在向 DashScope 提交异步任务。`,
    modelLabel: input.model.label,
    phase: "submitting",
    provider: input.model.provider,
    totalImages: input.count
  });

  const initialResponse = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const initialData = await initialResponse.json();

  if (!initialResponse.ok || !initialData.output || !initialData.output.task_id) {
    throw new Error(`DashScope 提交任务失败 (${initialResponse.status}): ${JSON.stringify(initialData)}`);
  }

  const taskId = initialData.output.task_id;
  const taskUrl = `${input.url}/tasks/${taskId}`;
  input.onProgress({
    elapsedMs: Date.now() - startedAt,
    imageCount: 0,
    message: `${input.model.label} 已提交任务，等待 DashScope 调度。`,
    modelLabel: input.model.label,
    phase: "submitted",
    provider: input.model.provider,
    taskId,
    totalImages: input.count
  });

  let attempts = 0;
  const maxAttempts = 30; // Max 60 seconds (2s per delay)

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts += 1;

    const pollResponse = await fetch(taskUrl, { headers });
    const pollData = await pollResponse.json();

    if (!pollResponse.ok) {
      throw new Error(`DashScope 轮询任务失败: ${JSON.stringify(pollData)}`);
    }

    const output = pollData.output;
    if (!output) continue;

    const taskStatus = typeof output.task_status === "string" ? output.task_status : "UNKNOWN";
    const metrics = readDashScopeMetrics(output, pollData);
    input.onProgress({
      attempt: attempts,
      elapsedMs: Date.now() - startedAt,
      imageCount: metrics.succeeded,
      message: formatDashScopeProgressMessage(input.model.label, taskStatus, metrics.succeeded, metrics.total, attempts),
      modelLabel: input.model.label,
      phase: taskStatus === "SUCCEEDED" ? "receiving" : "polling",
      provider: input.model.provider,
      taskId,
      taskStatus,
      totalImages: metrics.total ?? input.count
    });

    if (output.task_status === "SUCCEEDED") {
      const imageUrls = extractDashScopeImageUrls(output);
      if (imageUrls.length === 0) {
        throw new Error("DashScope 任务成功，但未返回结果");
      }

      const imageCount = Math.min(imageUrls.length, input.count);
      input.onProgress({
        attempt: attempts,
        elapsedMs: Date.now() - startedAt,
        imageCount,
        message: `${input.model.label} 已返回 ${imageCount} 张可展示图片。`,
        modelLabel: input.model.label,
        phase: "receiving",
        provider: input.model.provider,
        taskId,
        taskStatus,
        totalImages: input.count
      });

      return imageUrls.slice(0, input.count).map((imageUrl, index) => ({
        height: input.size.height,
        imageUrl,
        summary: `${input.model.label} 输出 ${index + 1}`,
        title: `生成图 ${index + 1}`,
        width: input.size.width
      }));
    }

    if (output.task_status === "FAILED" || output.task_status === "UNKNOWN") {
      throw new Error(`DashScope 任务失败: ${output.code} - ${output.message}`);
    }
  }

  throw new Error("DashScope 生成任务超时");
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
  onProgress: InternalProgressEmitter;
  prompt: string;
  size: ResolvedSize;
  url: string;
}): Promise<ImageGenerationOutput[]> {
  try {
    const outputs: ImageGenerationOutput[] = [];

    for (let index = 0; index < input.count; index += 1) {
      input.onProgress({
        attempt: index + 1,
        imageCount: outputs.length,
        message: `${input.model.label} 正在向 Gemini 原生接口提交第 ${index + 1} 张图。`,
        modelLabel: input.model.label,
        phase: "submitting",
        provider: input.model.provider,
        totalImages: input.count
      });
      const output = await generateWithGeminiNative({
        ...input,
        prompt: appendVariantPrompt(input.prompt, index, input.count)
      });

      outputs.push({
        ...output,
        summary: `${input.model.label} 输出 ${index + 1}`,
        title: `生成图 ${index + 1}`
      });
      input.onProgress({
        attempt: index + 1,
        imageCount: outputs.length,
        message: `${input.model.label} 已返回 ${outputs.length} 张可展示图片。`,
        modelLabel: input.model.label,
        phase: "receiving",
        provider: input.model.provider,
        totalImages: input.count
      });
    }

    return outputs;
  } catch (nativeError) {
    try {
      input.onProgress({
        imageCount: 0,
        message: `${input.model.label} 原生接口失败，正在尝试 OpenAI 图片兼容接口。`,
        modelLabel: input.model.label,
        phase: "fallback",
        provider: input.model.provider,
        totalImages: input.count
      });
      return await generateWithOpenAiImages({
        count: input.count,
        model: input.model,
        onProgress: input.onProgress,
        prompt: input.prompt,
        size: input.size,
        url: resolveImageGenerationUrl(input.url, "openai")
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
  const apiErrorMessage = extractApiErrorMessage(json);

  if (!response.ok || isFailedApiPayload(json)) {
    const message = (apiErrorMessage ?? text.trim()) || response.statusText;
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
  const message = json.message;

  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  if (isRecord(message)) {
    const nestedError = message.error;

    if (isRecord(nestedError) && typeof nestedError.message === "string") {
      return nestedError.message;
    }

    if (typeof message.message === "string") {
      return message.message;
    }
  }

  return typeof message === "string" ? message : null;
}

function isFailedApiPayload(json: unknown) {
  if (!isRecord(json)) {
    return false;
  }

  if (json.status === "error" || json.status === "failed") {
    return true;
  }

  const message = json.message;

  return isRecord(message) && (message.status === "error" || message.status === "failed");
}

function extractImageUrls(json: unknown) {
  if (!isRecord(json) || !Array.isArray(json.data)) {
    return [];
  }

  const imageUrls: string[] = [];

  for (const item of json.data) {
    if (!isRecord(item)) {
      continue;
    }

    const b64Json = item.b64_json;
    const base64 = item.base64;
    const content = item.content;
    const url = item.url;

    if (typeof b64Json === "string" && b64Json.trim()) {
      imageUrls.push(toDataUrl(b64Json, DEFAULT_IMAGE_MIME_TYPE));
      continue;
    }

    if (typeof content === "string" && content.trim()) {
      imageUrls.push(toDataUrl(content, DEFAULT_IMAGE_MIME_TYPE));
      continue;
    }

    if (typeof base64 === "string" && base64.trim()) {
      imageUrls.push(toDataUrl(base64, DEFAULT_IMAGE_MIME_TYPE));
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
  void input.aspectRatio;
  void input.model;
  void input.poster;

  return input.generation.prompt;
}

function resolveBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function resolveImageApiStyle(config: AicanapiImageGeneratorConfig): "modelgate" | "openai" {
  const explicit = config.imageApiStyle.trim().toLowerCase();

  if (["modelgate", "aicanapi"].includes(explicit)) {
    return "modelgate";
  }

  if (["openai", "openai-images"].includes(explicit)) {
    return "openai";
  }

  const baseUrl = resolveBaseUrl(config.baseUrl).toLowerCase();

  return baseUrl.includes("mg.aid.pub") || baseUrl.includes("localhost:13148") || baseUrl.includes("127.0.0.1:13148")
    ? "modelgate"
    : "openai";
}

function resolveImageGenerationUrl(baseUrl: string, apiStyle: "modelgate" | "openai") {
  const url = resolveBaseUrl(baseUrl);

  if (url.endsWith("/images/generations")) {
    return url;
  }

  if (url.endsWith("/v1") || url.endsWith("/api/v1")) {
    return `${url}/images/generations`;
  }

  if (apiStyle === "modelgate") {
    return url.endsWith("/api") ? `${url}/v1/images/generations` : `${url}/api/v1/images/generations`;
  }

  return `${url}/v1/images/generations`;
}

type ResolvedSize = {
  height: number;
  value: string;
  width: number;
};

function resolveOpenAiImageSize(aspectRatio: string): ResolvedSize {
  if (["16:9", "4:3", "3:2", "21:9"].includes(aspectRatio)) {
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

function resolveModelGateImageSize(aspectRatio: string, provider: ResolvedModel["provider"]): ResolvedSize {
  if (provider === "doubao") {
    const sizeByRatio: Record<string, ResolvedSize> = {
      "1:1": { height: 2048, value: "2048x2048", width: 2048 },
      "2:3": { height: 2496, value: "1664x2496", width: 1664 },
      "3:2": { height: 1664, value: "2496x1664", width: 2496 },
      "3:4": { height: 2304, value: "1728x2304", width: 1728 },
      "4:3": { height: 1728, value: "2304x1728", width: 2304 },
      "4:5": { height: 2496, value: "1664x2496", width: 1664 },
      "5:4": { height: 1728, value: "2304x1728", width: 2304 },
      "9:16": { height: 2560, value: "1440x2560", width: 1440 },
      "16:9": { height: 1440, value: "2560x1440", width: 2560 },
      "21:9": { height: 1296, value: "3024x1296", width: 3024 }
    };

    return sizeByRatio[aspectRatio] ?? sizeByRatio["1:1"];
  }

  const sizeByRatio: Record<string, ResolvedSize> = {
    "1:1": { height: 1024, value: "1024x1024", width: 1024 },
    "2:3": { height: 1264, value: "848x1264", width: 848 },
    "3:2": { height: 848, value: "1264x848", width: 1264 },
    "3:4": { height: 1200, value: "896x1200", width: 896 },
    "4:3": { height: 896, value: "1200x896", width: 1200 },
    "4:5": { height: 1152, value: "928x1152", width: 928 },
    "5:4": { height: 928, value: "1152x928", width: 1152 },
    "9:16": { height: 1376, value: "768x1376", width: 768 },
    "16:9": { height: 768, value: "1376x768", width: 1376 },
    "21:9": { height: 672, value: "1584x672", width: 1584 }
  };

  return sizeByRatio[aspectRatio] ?? sizeByRatio["1:1"];
}

function resolveDashScopeSize(aspectRatio: string, model: string): ResolvedSize {
  if (isDashScopeWan27Model(model)) {
    const sizeByRatio: Record<string, ResolvedSize> = {
      "1:1": { height: 2048, value: "2048*2048", width: 2048 },
      "2:3": { height: 2048, value: "1365*2048", width: 1365 },
      "3:2": { height: 1365, value: "2048*1365", width: 2048 },
      "3:4": { height: 2048, value: "1536*2048", width: 1536 },
      "4:3": { height: 1536, value: "2048*1536", width: 2048 },
      "4:5": { height: 2048, value: "1638*2048", width: 1638 },
      "5:4": { height: 1638, value: "2048*1638", width: 2048 },
      "9:16": { height: 2048, value: "1152*2048", width: 1152 },
      "16:9": { height: 1152, value: "2048*1152", width: 2048 },
      "21:9": { height: 878, value: "2048*878", width: 2048 }
    };

    return sizeByRatio[aspectRatio] ?? sizeByRatio["1:1"];
  }

  const sizeByRatio: Record<string, ResolvedSize> = {
    "1:1": { height: 1024, value: "1024*1024", width: 1024 },
    "3:4": { height: 1296, value: "768*1024", width: 768 },
    "4:3": { height: 768, value: "1024*768", width: 1024 },
    "9:16": { height: 1296, value: "720*1280", width: 720 },
    "16:9": { height: 720, value: "1280*720", width: 1280 }
  };
  return sizeByRatio[aspectRatio] ?? { height: 1024, value: "1024*1024", width: 1024 };
}

function resolveAspectRatio(value: string | undefined) {
  const ratio = value?.match(/(21:9|16:9|9:16|4:5|5:4|4:3|3:4|3:2|2:3|1:1)/)?.[1];

  return ratio ?? "1:1";
}

function appendVariantPrompt(prompt: string, index: number, count: number) {
  if (count <= 1) {
    return prompt;
  }

  return `${prompt}\nGenerate variant ${index + 1} of ${count}; keep the same brief but change composition, lighting, or camera distance.`;
}

function readPosterAttribute(poster: PosterRecord, key: string) {
  const drawAttributeMap: Record<string, string> = {
    atmosphere: poster.attributes.mood,
    character: poster.attributes.character,
    characterPosition: poster.attributes.composition,
    composition: poster.attributes.composition,
    era: `${poster.year}${poster.region ? ` / ${poster.region}` : ""}`,
    event: "",
    mood: poster.attributes.mood,
    proportion: poster.attributes.ratio,
    ratio: poster.attributes.ratio,
    scene: poster.description,
    shotScale: poster.attributes.character,
    style: poster.attributes.style,
    tone: poster.attributes.tone
  };

  return drawAttributeMap[key] ?? "";
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

function isDashScopeWan27Model(model: string) {
  return model.startsWith("wan2.7-image");
}

function buildWan27DashScopePayload(input: {
  count: number;
  model: ResolvedModel;
  prompt: string;
  size: ResolvedSize;
}) {
  return {
    input: {
      messages: [
        {
          content: [
            {
              text: input.prompt
            }
          ],
          role: "user"
        }
      ]
    },
    model: input.model.externalModel,
    parameters: {
      n: input.count,
      size: input.size.value,
      thinking_mode: true,
      watermark: false
    }
  };
}

function buildLegacyDashScopePayload(input: {
  count: number;
  model: ResolvedModel;
  prompt: string;
  size: ResolvedSize;
}) {
  return {
    input: { prompt: input.prompt },
    model: input.model.externalModel,
    parameters: {
      n: input.count,
      size: input.size.value
    }
  };
}

function extractDashScopeImageUrls(output: JsonRecord) {
  const urls: string[] = [];

  if (Array.isArray(output.results)) {
    for (const result of output.results) {
      if (!isRecord(result)) {
        continue;
      }

      const url = result.url;

      if (typeof url === "string" && url.trim()) {
        urls.push(url);
      }
    }
  }

  if (Array.isArray(output.choices)) {
    for (const choice of output.choices) {
      if (!isRecord(choice)) {
        continue;
      }

      const message = readRecord(choice.message);
      const content = message?.content;

      if (!Array.isArray(content)) {
        continue;
      }

      for (const item of content) {
        if (!isRecord(item)) {
          continue;
        }

        const image = item.image;

        if (typeof image === "string" && image.trim()) {
          urls.push(image);
        }
      }
    }
  }

  return urls;
}

function createProgressEmitter(onProgress: WorkspaceGenerationProgressHandler | undefined) {
  return (event: WorkspaceGenerationProgressDraft) => {
    onProgress?.({
      ...event,
      timestamp: new Date().toISOString()
    });
  };
}

function readDashScopeMetrics(output: JsonRecord, response: JsonRecord) {
  const metrics = readRecord(output.task_metrics);
  const usage = readRecord(response.usage);
  const usageImageCount = readMetric(usage, "image_count");
  const total = readMetric(metrics, "TOTAL", "total") ?? usageImageCount;
  const succeeded = readMetric(metrics, "SUCCEEDED", "succeeded") ?? (output.task_status === "SUCCEEDED" ? usageImageCount : undefined);

  return {
    succeeded,
    total
  };
}

function readMetric(record: JsonRecord | null, ...keys: string[]) {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function formatDashScopeProgressMessage(
  label: string,
  taskStatus: string,
  succeeded: number | undefined,
  total: number | undefined,
  attempt: number
) {
  const countText = typeof succeeded === "number" && typeof total === "number" ? `，已完成 ${succeeded}/${total}` : "";
  return `${label} 任务状态：${taskStatus}${countText}，第 ${attempt} 次轮询。`;
}
