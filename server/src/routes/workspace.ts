import { Router } from "express";
import { z } from "zod";
import type { Request, RequestHandler, Response } from "express";
import { getAuthUser } from "../middleware/auth";
import type { AppDataProvider } from "../providers/app-data-provider";

const moduleKeys = ["character", "style", "mood", "tone", "composition", "ratio"] as const;

const generateSchema = z.object({
  mode: z.enum(["chat", "draw"]),
  modelId: z.enum(["doubao-seedance-5", "nano-banana-2", "wan2.7-image-pro"]).optional(),
  moduleWeights: z.record(z.string(), z.number().min(0).max(100)).default({}),
  posterId: z.string().min(1, "缺少参考海报"),
  prompt: z.string().min(2, "请输入生成描述"),
  ratioId: z.string().min(1).optional(),
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
        generation: {
          mode: result.data.mode,
          modelId: result.data.modelId,
          moduleWeights: result.data.moduleWeights,
          posterId: result.data.posterId,
          prompt: result.data.prompt,
          ratioId: result.data.ratioId,
          selectedModules: result.data.selectedModules,
          sourceOrigin: result.data.sourceOrigin ?? "workspace"
        },
        user
      });

      res.json(generation.data);
    } catch (error) {
      res.status(502).json({ message: error instanceof Error ? error.message : "AI 图片生成失败" });
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

function requireUser(req: Request, res: Response) {
  const user = getAuthUser(req);

  if (!user) {
    res.status(401).json({ message: "缺少有效登录信息" });
    return null;
  }

  return user;
}
