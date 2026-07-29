import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const prioritiesPath = path.join(root, "src/data/english-evidence-priorities.json");
const sourceRoot = path.join(root, "src/lib");

const priorities = JSON.parse(fs.readFileSync(prioritiesPath, "utf8"));

if (!Array.isArray(priorities) || priorities.length !== 12) {
  throw new Error(`Expected exactly 12 English evidence priorities, received ${Array.isArray(priorities) ? priorities.length : "non-array data"}.`);
}

const hrefs = new Set();
for (const item of priorities) {
  if (!item || typeof item !== "object") throw new Error("Each evidence priority must be an object.");
  if (typeof item.href !== "string" || !item.href.startsWith("/en/blog/")) throw new Error(`Invalid evidence href: ${item.href}`);
  if (hrefs.has(item.href)) throw new Error(`Duplicate evidence priority: ${item.href}`);
  hrefs.add(item.href);
  if (item.status !== "needs-live-evidence") throw new Error(`Evidence status must remain explicit for ${item.href}.`);
  if (!Array.isArray(item.requestedEvidence) || item.requestedEvidence.length < 2) throw new Error(`At least two evidence requirements are needed for ${item.href}.`);
}

function collectTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(fullPath);
    return entry.isFile() && /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

const sourceText = collectTypeScriptFiles(sourceRoot)
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

for (const href of hrefs) {
  const slug = href.split("/").at(-1);
  if (!sourceText.includes(slug)) throw new Error(`Evidence priority does not map to a published English source: ${href}`);
}

console.log(`English evidence priority check passed: ${priorities.length} core guides tracked.`);
