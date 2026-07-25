import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-create-construction-site-15.ts",
  "src/lib/english-construction-progress-15.ts",
  "src/lib/english-structure-destroy-15.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-construction-safety-registry-15.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-construction-safety-content-15.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-room-create-construction-site",
  "screeps-construction-site-progress",
  "screeps-structure-destroy",
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
  "MAX_CONSTRUCTION_SITES",
  "room.createConstructionSite",
  "request.enabled = false",
  "TERRAIN_MASK_WALL",
  "site.progress",
  "site.progressTotal",
  "site.pos.roomName",
  "unsupported ETA",
  "DESTROY_EXTENSION",
  "Game.structures",
  "structure.destroy()",
  "FIND_HOSTILE_CREEPS",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishConstructionSafetyBatchFifteenArticles")) failures.push("第十五批聚合器缺失");
if (!route.includes("englishConstructionSafetyBatchFifteenArticles")) failures.push("动态路由未载入第十五批数组");
if (!route.includes("getEnglishConstructionSafetyBatchFifteenArticle")) failures.push("动态路由未载入第十五批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 44) failures.push(`目录条目不足：${toc.length}`);
for (const match of toc) {
  const id = match[1];
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`目录锚点不存在：${id}`);
  }
}

const blocks = [...source.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"));
if (blocks.length < 20) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-construction-15-"));
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

function roadPlan(input) {
  const request = input.request;
  if (!request?.enabled) return "disabled";
  if (
    typeof request.roomName !== "string"
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.type !== "road"
  ) return "invalid-request";
  if (!input.visible) return "room-not-visible";
  if (input.hasRoad) return "road-exists";
  if (input.hasSite) return "site-exists";
  if (input.siteCount >= input.limit) return "site-limit";
  return "ready";
}
const roadBase = {
  request: { enabled: true, roomName: "W1N1", x: 20, y: 20, type: "road" },
  visible: true,
  hasRoad: false,
  hasSite: false,
  siteCount: 99,
  limit: 100,
};
for (const [input, expected] of [
  [{ ...roadBase, request: { ...roadBase.request, enabled: false } }, "disabled"],
  [{ ...roadBase, request: { ...roadBase.request, x: 50 } }, "invalid-request"],
  [{ ...roadBase, visible: false }, "room-not-visible"],
  [{ ...roadBase, hasRoad: true }, "road-exists"],
  [{ ...roadBase, hasSite: true }, "site-exists"],
  [{ ...roadBase, siteCount: 100 }, "site-limit"],
  [roadBase, "ready"],
]) {
  if (roadPlan(input) !== expected) failures.push(`Road 工地计划失败：${expected}`);
}

function summarize(progress, total) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const safeTotal = Number.isFinite(total) ? total : 0;
  return {
    remaining: Math.max(0, safeTotal - safeProgress),
    percent: safeTotal > 0
      ? Math.min(100, Math.max(0, Math.floor((safeProgress / safeTotal) * 100)))
      : 0,
  };
}
for (const [progress, total, expectedRemaining, expectedPercent] of [
  [0, 100, 100, 0],
  [50, 100, 50, 50],
  [99, 100, 1, 99],
  [100, 100, 0, 100],
  [120, 100, 0, 100],
  [10, 0, 0, 0],
  [Number.NaN, 100, 100, 0],
]) {
  const result = summarize(progress, total);
  if (result.remaining !== expectedRemaining || result.percent !== expectedPercent) {
    failures.push(`进度计算失败：${progress}/${total}`);
  }
}

function sortSites(items) {
  return [...items].sort((left, right) =>
    left.remaining - right.remaining
    || left.room.localeCompare(right.room)
    || left.type.localeCompare(right.type)
    || left.id.localeCompare(right.id)
  ).map((item) => item.id);
}
const sorted = sortSites([
  { id: "b", remaining: 10, room: "W1N1", type: "road" },
  { id: "a", remaining: 10, room: "W1N1", type: "road" },
  { id: "c", remaining: 1, room: "W2N2", type: "extension" },
]);
if (sorted.join(",") !== "c,a,b") failures.push("Construction Site 稳定排序失败");

function destroyPlan(input) {
  const request = input.request;
  if (!request?.enabled) return "disabled";
  if (
    typeof request.id !== "string"
    || typeof request.room !== "string"
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.type !== "extension"
    || request.confirmation !== "DESTROY_EXTENSION"
  ) return "invalid-request";
  if (!input.structure) return "structure-missing";
  if (!input.owned) return "not-owner";
  if (input.structure.type !== request.type) return "type-mismatch";
  if (input.structure.room !== request.room) return "room-mismatch";
  if (input.structure.x !== request.x || input.structure.y !== request.y) return "position-mismatch";
  if (input.hostiles > 0) return "hostiles-present";
  return "ready";
}
const destroyBase = {
  request: {
    enabled: true,
    id: "id1",
    room: "W1N1",
    x: 20,
    y: 20,
    type: "extension",
    confirmation: "DESTROY_EXTENSION",
  },
  structure: { type: "extension", room: "W1N1", x: 20, y: 20 },
  owned: true,
  hostiles: 0,
};
for (const [input, expected] of [
  [{ ...destroyBase, request: { ...destroyBase.request, confirmation: "yes" } }, "invalid-request"],
  [{ ...destroyBase, structure: null }, "structure-missing"],
  [{ ...destroyBase, owned: false }, "not-owner"],
  [{ ...destroyBase, structure: { ...destroyBase.structure, type: "spawn" } }, "type-mismatch"],
  [{ ...destroyBase, structure: { ...destroyBase.structure, room: "W2N2" } }, "room-mismatch"],
  [{ ...destroyBase, structure: { ...destroyBase.structure, x: 21 } }, "position-mismatch"],
  [{ ...destroyBase, hostiles: 1 }, "hostiles-present"],
  [destroyBase, "ready"],
]) {
  if (destroyPlan(input) !== expected) failures.push(`结构销毁计划失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十五批英文建造安全检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、23 个离线边界用例。`);
