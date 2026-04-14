import type { Request, RequestHandler, Response } from "express";
import { Router } from "express";
import { createAdminDashboardResponse } from "../data/placeholder-content";
import { getAuthUser } from "../middleware/auth";

type CreateAdminRouterInput = {
  authMiddleware: RequestHandler;
};

export function createAdminRouter({ authMiddleware }: CreateAdminRouterInput) {
  const router = Router();

  router.get("/admin/dashboard", authMiddleware, (req, res) => {
    const user = requireUser(req, res);

    if (user === null) {
      return;
    }

    void user;
    res.json(createAdminDashboardResponse());
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
