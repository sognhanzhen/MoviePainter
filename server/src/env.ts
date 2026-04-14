import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentFilePath = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFilePath), "..");
const workspaceRoot = process.env.INIT_CWD?.trim() ? path.resolve(process.env.INIT_CWD) : path.resolve(serverRoot, "..");

const envFiles = [
  path.resolve(workspaceRoot, ".env.local"),
  path.resolve(workspaceRoot, ".env"),
  path.resolve(serverRoot, ".env.local"),
  path.resolve(serverRoot, ".env")
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

export { serverRoot, workspaceRoot };
