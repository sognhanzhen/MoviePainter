import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { serverConfig } from "./config";
import { createLocalDatabase } from "./lib/local-database";
import { createAuthMiddleware } from "./middleware/auth";
import { createAppDataProvider } from "./providers/app-data-provider";
import { createAdminRouter } from "./routes/admin";
import { createAppDataRouter } from "./routes/app-data";
import { createAuthRouter } from "./routes/auth";
import { createWorkspaceRouter } from "./routes/workspace";
import { createPosterSyncRouter } from "./routes/poster-sync";

export function createApp() {
  const app = express();
  const database = createLocalDatabase(serverConfig.databasePath);
  const dataProvider = createAppDataProvider({
    database,
    imageGeneratorConfig: {
      baseUrl: serverConfig.aicanapiBaseUrl,
      doubaoApiKey: serverConfig.aicanapiDoubaoApiKey,
      doubaoImageModel: serverConfig.aicanapiDoubaoImageModel,
      geminiApiKey: serverConfig.aicanapiGeminiApiKey,
      geminiImageModel: serverConfig.aicanapiGeminiImageModel,
      imageApiStyle: serverConfig.aicanapiImageApiStyle,
      dashscopeApiKey: serverConfig.dashscopeApiKey,
      dashscopeBaseUrl: serverConfig.dashscopeBaseUrl,
      dashscopeWanImageModel: serverConfig.dashscopeWanImageModel
    },
    supabaseServiceRoleKey: serverConfig.supabaseServiceRoleKey,
    supabaseUrl: serverConfig.supabaseUrl
  });
  const authMiddleware = createAuthMiddleware({
    jwtSecret: serverConfig.jwtSecret,
    supabaseServiceRoleKey: serverConfig.supabaseServiceRoleKey,
    supabaseUrl: serverConfig.supabaseUrl
  });

  app.use(
    cors({
      origin: serverConfig.corsOrigin
    })
  );
  app.use(express.json());

  app.use("/api", createAuthRouter({ database, jwtSecret: serverConfig.jwtSecret }));
  app.use("/api", createAppDataRouter({ authMiddleware, dataProvider }));
  app.use("/api", createWorkspaceRouter({ authMiddleware, dataProvider }));
  app.use("/api", createAdminRouter({ authMiddleware }));
  app.use("/api/posters", createPosterSyncRouter());

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[ServerError]:", error);
    const message = error instanceof Error ? error.message : "服务器内部错误";
    const status = message.includes("Unauthorized") || message.includes("未授权") ? 401 : 500;
    res.status(status).json({ message });
  });

  return app;
}
