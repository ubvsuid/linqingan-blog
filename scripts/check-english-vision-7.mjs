import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-vision-room-visibility-7.ts",
  "src/lib/english-vision-observer-7.ts",
  "src/lib/english-vision-costmatrix-7.ts",
];
const sources = articlePaths.map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const source = sources.join("\n");
const registry = fs.readFileSync(path.join(root, "src/lib/english-vision-registry-7.ts"), "utf8");
const aggregate = fs.readFileSync(path.join(root, "src/lib/english-vision-content-7.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"), "utf8");
const failures = [];
const slugs = [
  "screeps-room-visibility",
  "screeps-observer-observe-room",
  "screeps-pathfinder-costmatrix",
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
  "Memory.rooms is not a live Room object",
  "requestedAt !== Game.time - 1",
  "Visibility does not prove exclusive Observer attribution",
  "return undefined",
  "return false",
  "current < 255",
  "search.incomplete || search.path.length === 0",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishVisionBatchSevenArticles")) failures.push("批次聚合器缺失");
if (!route.includes("englishVisionBatchSevenArticles")) failures.push("动态路由未载入第七批数组");
if (!route.includes("getEnglishVisionBatchSevenArticle")) failures.push("动态路由未载入第七批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");
if (source.includes("if (!room) {\n          return false;\n        }")) failures.push("不可见房间被错误地硬封锁");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 45) failures.push(`目录条目不足：${toc.length}`);
for (const match of toc) {
  const id = match[1];
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`目录锚点不存在：${id}`);
  }
}

const blocks = [...source.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
if (blocks.length < 22) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-vision-7-"));
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

function availability(visible, remembered) {
  return { visibleNow: Boolean(visible), hasRememberedData: Boolean(remembered) };
}
const availabilityCases = [
  [true, false, true, false],
  [false, true, false, true],
  [false, false, false, false],
];
for (const [visible, remembered, expectedVisible, expectedRemembered] of availabilityCases) {
  const result = availability(visible, remembered);
  if (result.visibleNow !== expectedVisible || result.hasRememberedData !== expectedRemembered) {
    failures.push("房间可见性与历史 Memory 状态失败");
  }
}

function observationStatus(state, now, visibleRooms) {
  if (!state || typeof state.requestedRoom !== "string" || !Number.isInteger(state.requestedAt)) return "none";
  if (state.requestedAt === now) return "waiting";
  if (state.requestedAt !== now - 1) return "expired";
  return visibleRooms.has(state.requestedRoom) ? "visible" : "missing";
}
const observerCases = [
  [null, 10, [], "none"],
  [{ requestedRoom: "W1N1", requestedAt: 10 }, 10, [], "waiting"],
  [{ requestedRoom: "W1N1", requestedAt: 9 }, 10, ["W1N1"], "visible"],
  [{ requestedRoom: "W1N1", requestedAt: 9 }, 10, [], "missing"],
  [{ requestedRoom: "W1N1", requestedAt: 7 }, 10, ["W1N1"], "expired"],
];
for (const [state, now, rooms, expected] of observerCases) {
  if (observationStatus(state, now, new Set(rooms)) !== expected) failures.push(`Observer 状态失败：${expected}`);
}

function structureCost(type, my) {
  if (type === "road") return 1;
  if (type === "container") return 0;
  if (type === "rampart" && my === true) return 0;
  return 255;
}
for (const [type, my, expected] of [
  ["road", false, 1],
  ["container", false, 0],
  ["rampart", true, 0],
  ["rampart", false, 255],
  ["spawn", true, 255],
]) {
  if (structureCost(type, my) !== expected) failures.push(`结构成本失败：${type}`);
}
function validCoordinate(value) {
  return Number.isInteger(value) && value >= 0 && value <= 49;
}
for (const [value, expected] of [[0, true], [49, true], [-1, false], [50, false], [1.5, false]]) {
  if (validCoordinate(value) !== expected) failures.push(`坐标边界失败：${value}`);
}
function applyAvoid(current) {
  return current < 255 ? Math.max(current, 20) : current;
}
if (applyAvoid(255) !== 255 || applyAvoid(1) !== 20 || applyAvoid(30) !== 30) failures.push("自定义成本覆盖顺序失败");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第七批英文视野与寻路检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、16 个离线边界用例。`);
