import path from "node:path";
import { serverRoot, workspaceRoot } from "./env";

function resolveDatabasePath(databasePath?: string) {
  const candidate = databasePath?.trim();

  if (!candidate) {
    return path.resolve(serverRoot, "./data/app.db");
  }

  if (path.isAbsolute(candidate)) {
    return candidate;
  }

  if (candidate.startsWith("./server/") || candidate.startsWith("server/")) {
    return path.resolve(workspaceRoot, candidate);
  }

  return path.resolve(serverRoot, candidate);
}

export const serverConfig = {
  aicanapiBaseUrl: process.env.AICANAPI_BASE_URL ?? "",
  aicanapiDoubaoApiKey: process.env.AICANAPI_DOUBAO_API_KEY ?? "",
  aicanapiDoubaoImageModel: process.env.AICANAPI_DOUBAO_IMAGE_MODEL ?? "",
  aicanapiGeminiApiKey: process.env.AICANAPI_GEMINI_API_KEY ?? "",
  aicanapiGeminiImageModel: process.env.AICANAPI_GEMINI_IMAGE_MODEL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databasePath: resolveDatabasePath(process.env.DATABASE_PATH),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? ""
};
