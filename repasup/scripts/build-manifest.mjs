import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
const files = (await readdir(dataDir))
  .filter(name => name.endsWith(".json") && name !== "manifest.json")
  .sort((a,b) => a.localeCompare(b, "es"));

const manifest = { version: 2, decks: files };
await writeFile(path.join(dataDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Manifest actualizado con ${files.length} decks.`);
