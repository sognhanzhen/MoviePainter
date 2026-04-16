import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { serverConfig } from "./config.js";
import { createLocalDatabase } from "./lib/local-database.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createAppDataProvider } from "./providers/app-data-provider.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAppDataRouter } from "./routes/app-data.js";
import { createAuthRouter } from "./routes/auth.js";
import { createWorkspaceRouter } from "./routes/workspace.js";
import { createPosterSyncRouter } from "./routes/poster-sync.js";

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
