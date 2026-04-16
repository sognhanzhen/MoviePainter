import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Isomorphic path resolution to avoid Vercel/Next.js bundle SyntaxErrors and path issues
let currentFileDir = "";
try {
  // If native ESM or Webpack transpiles this safely:
  currentFileDir = path.dirname(fileURLToPath(import.meta.url));
} catch (err) {
  // Fallback to CJS or process.cwd()
  currentFileDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), "server/src");
}

const serverRoot = path.resolve(currentFileDir, "..");
const workspaceRoot = process.env.INIT_CWD?.trim() ? path.resolve(process.env.INIT_CWD) : (process.env.VERCEL ? process.cwd() : path.resolve(serverRoot, ".."));

const envFiles = [
  path.resolve(workspaceRoot, ".env.local"),
  path.resolve(workspaceRoot, ".env"),
  path.resolve(serverRoot, ".env.local"),
  path.resolve(serverRoot, ".env")
];

for (const envFile of envFiles) {
  try {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    }
  } catch (err) {
    // Safely ignore missing permissions in Vercel
  }
}

export { serverRoot, workspaceRoot };
