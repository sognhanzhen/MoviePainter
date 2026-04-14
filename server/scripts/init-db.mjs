import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

const currentFilePath = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFilePath), "..");
const workspaceRoot = process.env.INIT_CWD?.trim() ? path.resolve(process.env.INIT_CWD) : path.resolve(serverRoot, "..");

function resolveDatabasePath(databasePath) {
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

for (const envFilePath of [
  path.resolve(workspaceRoot, ".env.local"),
  path.resolve(workspaceRoot, ".env"),
  path.resolve(serverRoot, ".env.local"),
  path.resolve(serverRoot, ".env")
]) {
  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }
}

const databasePath = resolveDatabasePath(process.env.DATABASE_PATH);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`Database initialized at ${databasePath}`);
