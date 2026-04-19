import { Router } from "express";
import { z } from "zod";
import type { Request, RequestHandler, Response } from "express";
import { getAuthUser } from "../middleware/auth.js";
import type { AppDataProvider } from "../providers/app-data-provider.js";

const moduleKeys = [
  "shotScale",
  "characterPosition",
  "event",
  "era",
  "scene",
  "style",
  "atmosphere",
  "tone",
  "composition",
  "character",
  "mood",
  "proportion",
  "ratio"
] as const;

const ratioIds = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;

const generateSchema = z.object({
  mode: z.enum(["chat", "draw"]),
  modelId: z.enum(["doubao-seedance-5", "nano-banana-2", "wan2.7-image-pro"]).optional(),
  moduleWeights: z.record(z.string(), z.number().min(0).max(100)).default({}),
  posterId: z.string().min(1, "缺少参考海报"),
  prompt: z.string().min(2, "请输入生成描述"),
  ratioId: z.enum(ratioIds).optional(),
  selectedModules: z.array(z.enum(moduleKeys)).default([]),
  sourceOrigin: z.string().min(1).optional()
});

const assetRecordSchema = z.object({
  action: z.enum(["library_use", "workspace_use"]).default("workspace_use"),
  mode: z.enum(["chat", "draw"]),
  posterId: z.string().min(1, "缺少参考海报"),
  prompt: z.string().min(1).optional(),
  sourceOrigin: z.string().min(1).optional()
});

type CreateWorkspaceRouterInput = {
  authMiddleware: RequestHandler;
  dataProvider: AppDataProvider;
};

export function createWorkspaceRouter({ authMiddleware, dataProvider }: CreateWorkspaceRouterInput) {
  const router = Router();

  router.post("/workspace/generate", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const result = generateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    try {
      const generation = await dataProvider.generateWorkspace({
        generation: buildGenerationInput(result.data),
        user
      });

      res.json(generation.data);
    } catch (error) {
      res.status(502).json({ message: error instanceof Error ? error.message : "AI 图片生成失败" });
    }
  });

  router.post("/workspace/generate/stream", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const result = generateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    prepareEventStream(res);
    sendEvent(res, "progress", {
      message: "后端已接收生图请求，正在进入模型链路。",
      phase: "submitted",
      timestamp: new Date().toISOString()
    });

    try {
      const generation = await dataProvider.generateWorkspace({
        generation: buildGenerationInput(result.data),
        onProgress: (event) => sendEvent(res, "progress", event),
        user
      });

      sendEvent(res, "result", generation.data);
    } catch (error) {
      sendEvent(res, "error", {
        message: error instanceof Error ? error.message : "AI 图片生成失败"
      });
    } finally {
      res.end();
    }
  });

  router.post("/workspace/assets", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const result = assetRecordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    const assetRecord = await dataProvider.recordWorkspaceAsset({
      asset: result.data,
      user
    });

    res.json(assetRecord.data);
  });

  return router;
}

function buildGenerationInput(data: z.infer<typeof generateSchema>) {
  return {
    mode: data.mode,
    modelId: data.modelId,
    moduleWeights: data.moduleWeights,
    posterId: data.posterId,
    prompt: data.prompt,
    ratioId: data.ratioId,
    selectedModules: data.selectedModules,
    sourceOrigin: data.sourceOrigin ?? "workspace"
  };
}

function prepareEventStream(res: Response) {
  res.status(200);
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("X-Accel-Buffering", "no");
  (res as Response & { flushHeaders?: () => void }).flushHeaders?.();
}

function sendEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function requireUser(req: Request, res: Response) {
  const user = getAuthUser(req);

  if (!user) {
    res.status(401).json({ message: "缺少有效登录信息" });
    return null;
  }

  return user;
}
