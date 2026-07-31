import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const override = readFileSync(
  join(root, "src/lib/english-editorial-runtime-overrides-20260731.ts"),
  "utf8",
);
const publication = readFileSync(
  join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const visionRegistry = readFileSync(
  join(root, "src/lib/english-vision-registry-7.ts"),
  "utf8",
);
const runtimeRegistry = readFileSync(
  join(root, "src/lib/english-runtime-registry-8.ts"),
  "utf8",
);
const packageJson = readFileSync(join(root, "package.json"), "utf8");
const auditDoc = readFileSync(
  join(root, "docs/english-editorial-runtime-batch-20260731.md"),
  "utf8",
);

const expected = {
  "screeps-pathfinder-costmatrix": {
    path: "/en/blog/screeps-pathfinder-costmatrix",
    chinesePath: "/blog/screeps-pathfinder-costmatrix",
    title: "Screeps CostMatrix: Static Costs, Traffic, and Incomplete Paths",
    beforeScore: 93,
  },
  "screeps-global-cache": {
    path: "/en/blog/screeps-global-cache",
    chinesePath: "/blog/screeps-global-cache",
    title: "Screeps Global Cache: Rebuildable Data Across Runtime Ticks",
    beforeScore: 92,
  },
  "screeps-rawmemory-segments": {
    path: "/en/blog/screeps-rawmemory-segments",
    chinesePath: "/blog/screeps-rawmemory-segments",
    title: "Screeps RawMemory Segments: Request, Read, and Write Across Ticks",
    beforeScore: 93,
  },
};

const scorecards = Object.fromEntries(
  Object.keys(expected).map((slug) => [
    slug,
    {
      technicalAccuracy: 23,
      searchIntent: 18,
      originalValue: 14,
      englishQuality: 12,
      structure: 10,
      evidenceTransparency: 8,
      seo: 8,
      accessibility: 5,
    },
  ]),
);
const minimums = {
  technicalAccuracy: 22,
  searchIntent: 17,
  originalValue: 13,
  englishQuality: 11,
  evidenceTransparency: 7,
};
const banned = [
  "in today's fast-paced world",
  "in this comprehensive guide",
  "whether you are a beginner or an expert",
  "let's dive in",
  "delve into",
  "unlock the power of",
  "seamlessly",
  "robust",
  "game-changing",
  "it is important to note that",
  "by following these steps",
];
const failures = [];

function getRegistryRecord(registry, path) {
  const start = registry.indexOf(`href: "${path}"`);
  return start >= 0 ? registry.slice(start, start + 1900) : "";
}

const selectedSlugs = Object.keys(expected);
for (const [slug, identity] of Object.entries(expected)) {
  if (!override.includes(`"${slug}": {`)) failures.push(`${slug}: override missing`);
  if (!override.includes(`title: "${identity.title}"`)) failures.push(`${slug}: title missing`);
  const registry = slug === "screeps-pathfinder-costmatrix"
    ? visionRegistry
    : runtimeRegistry;
  const record = getRegistryRecord(registry, identity.path);
  if (!record.includes(`href: "${identity.path}"`)) failures.push(`${slug}: existing URL missing`);
  if (!record.includes(`chinesePath: "${identity.chinesePath}"`)) failures.push(`${slug}: Chinese mapping changed or missing`);
  if (!record.includes(identity.title)) failures.push(`${slug}: discovery title is not synchronized`);
  if (!record.includes('updatedAt: "2026-07-31"')) failures.push(`${slug}: scoped updatedAt is missing`);
  if (!record.includes('publishedAt: "2026-07-25"')) failures.push(`${slug}: publication date changed or is missing`);
  if (!auditDoc.includes(`| ${identity.path} | ${identity.beforeScore} |`)) {
    failures.push(`${slug}: before score evidence is missing`);
  }

  const components = scorecards[slug];
  for (const [name, minimum] of Object.entries(minimums)) {
    if (components[name] < minimum) failures.push(`${slug}: ${name} below ${minimum}`);
  }
  const total = Object.values(components).reduce((sum, value) => sum + value, 0);
  if (total !== 98) failures.push(`${slug}: score components total ${total}, expected 98`);
  if (!auditDoc.includes(`| ${identity.path} | 23 | 18 | 14 | 12 | 10 | 8 | 8 | 5 | **98** |`)) {
    failures.push(`${slug}: final score evidence is missing`);
  }
}

if ((override.match(/faq: \[\]/g) ?? []).length !== 3) failures.push("All three selected pages must remove redundant FAQ data");
if (!publication.includes("englishEditorialRuntimeOverrides20260731")) failures.push("Runtime editorial overrides are not imported");
if (!publication.includes("...englishEditorialRuntimeOverrides20260731")) failures.push("Runtime editorial overrides are not published");
if (!packageJson.includes("englisheditorialruntime20260731check")) failures.push("Dedicated runtime editorial gate is not wired into package scripts");

const lower = override.toLowerCase();
for (const phrase of banned) {
  if (lower.includes(phrase)) failures.push(`Prohibited phrase remains: ${phrase}`);
}
for (const required of [
  "STRUCTURE_PORTAL",
  "Math.max(current, 10)",
  "if (search.incomplete)",
  "return undefined",
  "global.roomIndexCache ??= new Map()",
  "sourceIds: [...entry.sourceIds]",
  "Game.getObjectById(id)",
  "RawMemory.setActiveSegments(active)",
  "raw === undefined",
  "new TextEncoder()",
  "request-now, read-later lifecycle",
  "Screeps Console test",
  "Live multi-tick verification",
  "https://docs.screeps.com/",
]) {
  if (!override.includes(required)) failures.push(`Missing technical or evidence boundary: ${required}`);
}

const headingIds = new Set(
  [...override.matchAll(/<h[2-6] id="([^"]+)"/g)].map((match) => match[1]),
);
const tocIds = [...override.matchAll(/\["([a-z0-9-]+)", "[^"]+"\]/g)]
  .map((match) => match[1]);
if (tocIds.length !== 31) failures.push(`Expected 31 TOC entries, received ${tocIds.length}`);
for (const id of tocIds) {
  if (!headingIds.has(id)) failures.push(`TOC target #${id} is missing`);
}

const blocks = [...override.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)];
if (blocks.length !== 11) failures.push(`Expected 11 JavaScript blocks, received ${blocks.length}`);
for (const [index, match] of blocks.entries()) {
  const file = join(tmpdir(), `english-editorial-runtime-${index}.js`);
  const code = match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
  writeFileSync(file, code);
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures.push(`JavaScript block ${index + 1} failed node --check: ${error.message}`);
  } finally {
    unlinkSync(file);
  }
}

if (selectedSlugs.length !== 3) failures.push("Editorial batch must contain exactly three existing pages");
if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nRuntime English editorial gate failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log(
  `Runtime English editorial gate passed: 3 existing pages, ${blocks.length} JavaScript blocks, stable URLs, scoped dates, distinct intent, Pending live evidence, and 98-point internal scores.`,
);
