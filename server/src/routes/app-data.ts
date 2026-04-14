import type { Request, RequestHandler, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import type { AppDataProvider } from "../providers/app-data-provider";
import { getAuthUser } from "../middleware/auth";

const settingsSchema = z.object({
  displayName: z.string().min(2, "展示名称至少 2 个字符"),
  language: z.string().min(2, "语言字段不合法"),
  notificationEnabled: z.boolean(),
  preferredDefaultMode: z.enum(["chat", "draw"])
});

type CreateAppDataRouterInput = {
  authMiddleware: RequestHandler;
  dataProvider: AppDataProvider;
};

export function createAppDataRouter({ authMiddleware, dataProvider }: CreateAppDataRouterInput) {
  const router = Router();

  router.get("/health", async (_req, res) => {
    const posters = await dataProvider.getPosters();
    res.json({
      ok: true,
      providerSource: posters.source
    });
  });

  router.get("/library/posters", authMiddleware, async (_req, res) => {
    const posters = await dataProvider.getPosters();
    res.json({
      posters: posters.data,
      source: posters.source
    });
  });

  router.get("/library/posters/:posterId", authMiddleware, async (req, res) => {
    const posterId = getSingleParam(req.params.posterId);
    const poster = await dataProvider.getPosterById(posterId);

    if (!poster.data) {
      res.status(404).json({ message: "海报不存在" });
      return;
    }

    res.json({
      poster: poster.data,
      source: poster.source
    });
  });

  router.get("/history", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const history = await dataProvider.getHistoryRecords(user);
    res.json({
      records: history.data,
      source: history.source
    });
  });

  router.get("/history/:historyId", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const historyId = getSingleParam(req.params.historyId);
    const history = await dataProvider.getHistoryRecord({ historyId, user });

    if (!history.data) {
      res.status(404).json({ message: "历史记录不存在" });
      return;
    }

    res.json({
      record: history.data,
      source: history.source
    });
  });

  router.get("/profile", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const profile = await dataProvider.getProfile(user);

    res.json({
      source: profile.source,
      user: profile.data
    });
  });

  router.get("/settings", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const settings = await dataProvider.getUserSettings(user);

    res.json({
      settings: settings.data,
      source: settings.source
    });
  });

  router.patch("/settings", authMiddleware, async (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    const result = settingsSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "请求参数不合法" });
      return;
    }

    const settings = await dataProvider.updateUserSettings({
      settings: result.data,
      user
    });

    res.json({
      settings: settings.data,
      source: settings.source
    });
  });

  return router;
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function requireUser(req: Request, res: Response) {
  const user = getAuthUser(req);

  if (!user) {
    res.status(401).json({ message: "缺少有效登录信息" });
    return null;
  }

  return user;
}
