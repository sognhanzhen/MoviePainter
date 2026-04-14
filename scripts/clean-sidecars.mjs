import { readdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);

async function removeSidecars(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const targetPath = path.join(directory, entry.name);

    if (entry.name.startsWith("._") || entry.name.startsWith(".__")) {
      await rm(targetPath, { force: true, recursive: true });
      continue;
    }

    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      await removeSidecars(targetPath);
    }
  }
}

await removeSidecars(rootDir);
