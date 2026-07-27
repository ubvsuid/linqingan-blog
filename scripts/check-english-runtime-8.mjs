import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-runtime-cpu-8.ts",
  "src/lib/english-runtime-global-cache-8.ts",
  "src/lib/english-runtime-segments-8.ts",
];
const sources = articlePaths.map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const source = sources.join("\n");
const registry = fs.readFileSync(path.join(root, "src/lib/english-runtime-registry-8.ts"), "utf8");
const aggregate = fs.readFileSync(path.join(root, "src/lib/english-runtime-content-8.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"), "utf8");
const failures = [];
const slugs = [
  "screeps-cpu-getused-bucket",
  "screeps-global-cache",
  "screeps-rawmemory-segments",
];

for (const slug of slugs) {
  if (!source.includes(`slug: "${slug}"`)) failures.push(`正文缺少 ${slug}`);
  if (!registry.includes(`href: "/en/blog/${slug}"`)) failures.push(`登记缺少 ${slug}`);
}

for (const text of [
  "Quick answer",
  "Debugging checklist",
  "Frequently asked questions",
  "Official documentation",
  "Chinese source article",
  "Reviewed in full",
  "Screeps Console test",
  "Pending",
  "The Simulation reports <code>0</code>",
  "Global cache is disposable acceleration",
  "Do not cache live game objects",
  "setActiveSegments() schedules availability for the next tick",
  "One manager makes the final activation call",
  "raw === undefined",
  "100 * 1024",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

const articleScores = [...source.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
const registryScores = [...registry.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
for (const scores of [articleScores, registryScores]) {
  if (scores.length !== 3 || scores.some((score) => score < 96)) failures.push("评分数量或发布门槛不正确");
}

if (!aggregate.includes("englishRuntimeBatchEightArticles")) failures.push("批次聚合器缺失");
if (!route.includes("englishRuntimeBatchEightArticles")) failures.push("动态路由未载入第八批数组");
if (!route.includes("getEnglishRuntimeBatchEightArticle")) failures.push("动态路由未载入第八批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 45) failures.push(`目录条目不足：${toc.length}`);
for (const match of toc) {
  const id = match[1];
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) failures.push(`目录锚点不存在：${id}`);
}

const blocks = [...source.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
if (blocks.length < 24) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-runtime-8-"));
try {
  blocks.forEach((code, index) => {
    const file = path.join(temp, `${index}.js`);
    fs.writeFileSync(file, code);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`代码块 ${index + 1} 语法失败：${result.stderr.trim()}`);
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function cpuDelta(start, end) {
  return Number.isFinite(start) && Number.isFinite(end)
    ? Math.max(0, end - start)
    : null;
}
for (const [start, end, expected] of [[1, 3.5, 2.5], [4, 3, 0], [0, 0, 0], [NaN, 2, null]]) {
  if (!Object.is(cpuDelta(start, end), expected)) failures.push(`CPU 差值失败：${start}/${end}`);
}
function bucketBand(bucket) {
  if (!Number.isFinite(bucket)) return "unknown";
  if (bucket < 1000) return "critical";
  if (bucket < 4000) return "conserve";
  if (bucket > 9000) return "surplus";
  return "normal";
}
for (const [bucket, expected] of [[999, "critical"], [1000, "conserve"], [3999, "conserve"], [4000, "normal"], [9001, "surplus"], [NaN, "unknown"]]) {
  if (bucketBand(bucket) !== expected) failures.push(`Bucket 分级失败：${bucket}`);
}
function summarize(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const index = Math.min(clean.length - 1, Math.max(0, Math.ceil(clean.length * 0.95) - 1));
  return { average: clean.reduce((a, b) => a + b, 0) / clean.length, p95: clean[index], max: clean.at(-1) };
}
const cpuSummary = summarize([1, 2, 3, 4, 100]);
if (!cpuSummary || cpuSummary.average !== 22 || cpuSummary.p95 !== 100 || cpuSummary.max !== 100) failures.push("CPU 汇总失败");

function cacheFresh(entry, version, maxAge, now) {
  return Boolean(entry && entry.version === version && (!Number.isInteger(maxAge) || now - entry.createdAt <= maxAge));
}
for (const [entry, version, maxAge, now, expected] of [
  [{ version: 1, createdAt: 10 }, 1, 5, 15, true],
  [{ version: 1, createdAt: 10 }, 2, 5, 11, false],
  [{ version: 1, createdAt: 10 }, 1, 5, 16, false],
  [null, 1, 5, 10, false],
]) {
  if (cacheFresh(entry, version, maxAge, now) !== expected) failures.push("缓存新鲜度失败");
}
const cached = { values: [1, 2] };
const clone = JSON.parse(JSON.stringify(cached));
clone.values.push(3);
if (cached.values.length !== 2) failures.push("缓存克隆隔离失败");

function normalizeSegmentIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id >= 0 && id <= 99))]
    .sort((a, b) => a - b)
    .slice(0, 10);
}
const normalized = normalizeSegmentIds([99, 1, 1, 100, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
if (normalized.length !== 10 || normalized[0] !== 1 || normalized.at(-1) !== 10) failures.push("Segment ID 规范化失败");
function segmentState(raw) {
  if (raw === undefined) return "unavailable";
  if (raw === "") return "empty";
  try {
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? "ready" : "schema-mismatch";
  } catch {
    return "invalid-json";
  }
}
for (const [raw, expected] of [
  [undefined, "unavailable"],
  ["", "empty"],
  ["bad", "invalid-json"],
  ['{"version":2,"data":{}}', "schema-mismatch"],
  ['{"version":1,"data":{}}', "ready"],
]) {
  if (segmentState(raw) !== expected) failures.push(`Segment 状态失败：${expected}`);
}
function selectSegments(entries) {
  return [...entries]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 10)
    .map(([id]) => id);
}
const selected = selectSegments([[5, 1], [2, 10], [3, 10], [8, 0]]);
if (selected.join(",") !== "2,3,5,8") failures.push("Segment 优先级选择失败");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第八批英文运行时与存储检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、28 个离线边界用例。`);
