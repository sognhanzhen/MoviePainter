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

function readEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

export const serverConfig = {
  aicanapiBaseUrl: readEnv("AICANAPI_BASE_URL", "MODELGATE_BASE_URL", "MODEL_GATE_BASE_URL", "OPENAI_BASE_URL"),
  aicanapiDoubaoApiKey: readEnv(
    "AICANAPI_DOUBAO_API_KEY",
    "AICANAPI_API_KEY",
    "MODELGATE_API_KEY",
    "MODEL_GATE_API_KEY",
    "OPENAI_API_KEY"
  ),
  aicanapiDoubaoImageModel: readEnv("AICANAPI_DOUBAO_IMAGE_MODEL", "AICANAPI_IMAGE_MODEL", "MODELGATE_DOUBAO_IMAGE_MODEL"),
  aicanapiGeminiApiKey: readEnv(
    "AICANAPI_GEMINI_API_KEY",
    "AICANAPI_API_KEY",
    "MODELGATE_API_KEY",
    "MODEL_GATE_API_KEY",
    "OPENAI_API_KEY"
  ),
  aicanapiGeminiImageModel: readEnv("AICANAPI_GEMINI_IMAGE_MODEL", "AICANAPI_IMAGE_MODEL", "MODELGATE_GEMINI_IMAGE_MODEL"),
  aicanapiImageApiStyle: readEnv("AICANAPI_IMAGE_API_STYLE", "MODELGATE_IMAGE_API_STYLE"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databasePath: resolveDatabasePath(process.env.DATABASE_PATH),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? ""
};
