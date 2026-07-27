import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "src/lib/english-movement-content-6.ts"), "utf8");
const published = fs.readFileSync(path.join(root, "src/lib/english-movement-content-6-published.ts"), "utf8");
const registry = fs.readFileSync(path.join(root, "src/lib/english-movement-registry-6.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"), "utf8");
const failures = [];
const slugs = [
  "screeps-move-fatigue-body-ratio",
  "screeps-roomposition-distance",
  "screeps-map-find-route",
];

for (const slug of slugs) {
  const href = `/en/blog/${slug}`;
  if (!source.includes(`slug: "${slug}"`)) failures.push(`正文缺少 ${slug}`);
  if (!registry.includes(`href: "${href}"`)) failures.push(`登记缺少 ${href}`);
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
  "terrain being entered",
  "isNearTo() includes the same tile",
  "uses and validates its first step",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!route.includes("englishMovementBatchSixArticles")) failures.push("动态路由未载入第六批数组");
if (!route.includes("getEnglishMovementBatchSixArticle")) failures.push("动态路由未载入第六批查询函数");
if (!route.includes("english-movement-content-6-published")) failures.push("动态路由未使用第六批发布修正版");
if (!published.includes("const completeRouteOptions")) failures.push("发布修正版缺少完整 routeOptions 代码块");
if (!published.includes("article.articleHtml.replace(")) failures.push("发布修正版未执行代码块替换");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");
if (source.includes("currentPlan.steps.find(")) failures.push("路线仍遍历整条旧步骤数组");
if (!source.includes("const step = currentPlan.steps[0]")) failures.push("路线未使用首步");
if (!source.includes("exits[step.exit] !== step.room")) failures.push("首步缺少出口校验");
if (!source.includes("estimateCreepMovement(creep, terrain)")) failures.push("MOVE 估算缺少显式地形输入");

const incompleteRouteCallback = `routeCallback(roomName, fromRoomName) {\n  if (Memory.routeAvoid?.includes(roomName)) {\n    return Infinity;\n  }\n\n  if (isPreferredRoom(roomName)) {\n    return 1;\n  }\n\n  return 2.5;\n}`;
const completeRouteOptions = `const routeOptions = {\n  routeCallback(roomName, fromRoomName) {\n    if (Memory.routeAvoid?.includes(roomName)) {\n      return Infinity;\n    }\n\n    if (isPreferredRoom(roomName)) {\n      return 1;\n    }\n\n    return 2.5;\n  }\n};`;
const publishedSource = source.replace(incompleteRouteCallback, completeRouteOptions);
if (publishedSource === source) failures.push("无法生成发布修正版源码");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 40) failures.push(`目录条目不足：${toc.length}`);
for (const match of toc) {
  const id = match[1];
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`目录锚点不存在：${id}`);
  }
}

const blocks = [...publishedSource.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
if (blocks.length < 15) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-move-6-"));
try {
  blocks.forEach((code, index) => {
    const file = path.join(temp, `${index}.js`);
    fs.writeFileSync(file, code);
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`代码块 ${index + 1} 语法失败`);
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function ticks(move, weight, cost) {
  if (move <= 0 || weight < 0 || ![1, 2, 10].includes(cost)) return null;
  return Math.max(1, Math.ceil((weight * cost) / (move * 2)));
}
for (const [move, weight, cost, expected] of [
  [1, 2, 1, 1], [1, 2, 2, 2], [1, 2, 10, 10], [2, 2, 2, 1], [0, 2, 2, null],
]) {
  if (ticks(move, weight, cost) !== expected) failures.push("MOVE 离线公式失败");
}

function range(from, to) {
  if (from.room !== to.room) return null;
  return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
}
const origin = { room: "W1N1", x: 10, y: 10 };
if (range(origin, { room: "W1N1", x: 10, y: 10 }) !== 0) failures.push("同格 range 失败");
if (range(origin, { room: "W1N1", x: 11, y: 11 }) !== 1) failures.push("对角 range 失败");
if (range(origin, { room: "W1N1", x: 13, y: 12 }) !== 3) failures.push("range 3 失败");
if (range(origin, { room: "W2N1", x: 10, y: 10 }) !== null) failures.push("跨房间 range 失败");

function firstStepValid(steps, exits) {
  return Boolean(steps?.[0] && exits && exits[steps[0].exit] === steps[0].room);
}
if (!firstStepValid([{ exit: 3, room: "W7N3" }], { 3: "W7N3" })) failures.push("有效首步失败");
if (firstStepValid([{ exit: 3, room: "W7N3" }], { 3: "W9N3" })) failures.push("错误首步未拒绝");
if (firstStepValid([], { 3: "W7N3" })) failures.push("空首步未拒绝");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第六批英文移动专题检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、12 个离线边界用例。`);
