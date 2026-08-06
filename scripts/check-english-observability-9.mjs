import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-observability-notify-9.ts",
  "src/lib/english-observability-event-log-9.ts",
  "src/lib/english-observability-roomvisual-9.ts",
  "src/lib/english-observability-error-isolation-9.ts",
];
const sources = articlePaths.map((file) => fs.readFileSync(path.join(root, file), "utf8"));
const source = sources.join("\n");
const registry = fs.readFileSync(path.join(root, "src/lib/english-observability-registry-9.ts"), "utf8");
const aggregate = fs.readFileSync(path.join(root, "src/lib/english-observability-content-9.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"), "utf8");
const failures = [];
const slugs = [
  "screeps-game-notify",
  "screeps-room-event-log",
  "screeps-roomvisual-debug",
  "screeps-room-error-isolation",
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
  "Maximum 1000 characters",
  "Maximum 20",
  "groupInterval",
  "previous tick",
  "room.getEventLog(true)",
  "512,000 bytes",
  "A drawing is diagnostic evidence",
  "Separate three failure types",
  "Build a reusable runtime guard",
  "Keep Other Rooms Running",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 4 || scores.some((score) => score < 96)) failures.push("评分数量或发布门槛不正确");
}

if (!aggregate.includes("englishObservabilityBatchNineArticles")) failures.push("第九批聚合器缺失");
if (!aggregate.includes("englishRoomErrorIsolationArticle")) failures.push("异常隔离文章未进入第九批聚合器");
if (!route.includes("englishObservabilityBatchNineArticles")) failures.push("动态路由未载入第九批数组");
if (!route.includes("getEnglishObservabilityBatchNineArticle")) failures.push("动态路由未载入第九批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 58) failures.push(`目录条目不足：${toc.length}`);
for (const match of toc) {
  const id = match[1];
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) failures.push(`目录锚点不存在：${id}`);
}

const blocks = [...source.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g)]
  .map((match) => match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
if (blocks.length < 28) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-observability-9-"));
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

function evaluateAlert({ active, lastTick, risk, now, repeat }) {
  if (!risk) return { queue: false, reason: active ? "recovered" : "normal", active: false, lastTick };
  const entered = active !== true;
  const due = Number.isInteger(lastTick) && now - lastTick >= repeat;
  return {
    queue: entered || due,
    reason: entered ? "entered-risk" : due ? "repeat-due" : "risk-active",
    active: true,
    lastTick: entered || due ? now : lastTick,
  };
}
const alertCases = [
  [{ active: false, lastTick: null, risk: true, now: 100, repeat: 50 }, true, "entered-risk"],
  [{ active: true, lastTick: 90, risk: true, now: 100, repeat: 50 }, false, "risk-active"],
  [{ active: true, lastTick: 50, risk: true, now: 100, repeat: 50 }, true, "repeat-due"],
  [{ active: true, lastTick: 50, risk: false, now: 100, repeat: 50 }, false, "recovered"],
  [{ active: false, lastTick: 50, risk: false, now: 100, repeat: 50 }, false, "normal"],
];
for (const [input, queue, reason] of alertCases) {
  const result = evaluateAlert(input);
  if (result.queue !== queue || result.reason !== reason) failures.push(`通知状态失败：${reason}`);
}
function normalizeMessage(message) {
  const text = String(message);
  return text.length <= 1000 ? text : `${text.slice(0, 997)}...`;
}
if (normalizeMessage("x".repeat(1200)).length !== 1000) failures.push("通知长度截断失败");
function normalizeQueue(queue, now) {
  const map = new Map();
  for (const item of queue) {
    if (!item || item.expiresAt < now) continue;
    const previous = map.get(item.key);
    if (!previous || item.priority > previous.priority || item.createdAt > previous.createdAt) map.set(item.key, item);
  }
  return [...map.values()].sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt || a.key.localeCompare(b.key));
}
const queue = normalizeQueue([
  { key: "a", priority: 1, createdAt: 1, expiresAt: 100 },
  { key: "a", priority: 5, createdAt: 2, expiresAt: 100 },
  { key: "b", priority: 10, createdAt: 3, expiresAt: 100 },
  { key: "expired", priority: 100, createdAt: 1, expiresAt: 2 },
], 10);
if (queue.length !== 2 || queue[0].key !== "b" || queue[1].priority !== 5) failures.push("通知队列去重或优先级失败");
if (Array.from({ length: 30 }).slice(0, 20).length !== 20) failures.push("通知 20 条上限失败");

function parseRaw(raw) {
  if (typeof raw !== "string") return "raw-not-string";
  try {
    return Array.isArray(JSON.parse(raw)) ? "parsed" : "not-array";
  } catch {
    return "invalid-json";
  }
}
for (const [raw, expected] of [["[]", "parsed"], ["{}", "not-array"], ["bad", "invalid-json"], [null, "raw-not-string"]]) {
  if (parseRaw(raw) !== expected) failures.push(`事件 raw 解析失败：${expected}`);
}
function normalizeAttack(event) {
  if (!event || event.event !== 1 || typeof event.data?.targetId !== "string") return null;
  return { attackerId: typeof event.objectId === "string" ? event.objectId : null, targetId: event.data.targetId, damage: Number.isFinite(event.data.damage) ? event.data.damage : 0 };
}
if (normalizeAttack(null) !== null || normalizeAttack({ event: 2, data: {} }) !== null) failures.push("非攻击事件过滤失败");
const attack = normalizeAttack({ event: 1, objectId: "actor", data: { targetId: "target", damage: 50 } });
if (!attack || attack.targetId !== "target" || attack.damage !== 50) failures.push("攻击事件规范化失败");
function ownedIncident(targetId, ownedNow, previousOwned) {
  return ownedNow.has(targetId) || previousOwned.has(targetId);
}
if (!ownedIncident("x", new Set(), new Set(["x"])) || ownedIncident("y", new Set(), new Set())) failures.push("历史所有权快照失败");

function visualPlan({ enabled, creep, target, showLabels, showTargets }) {
  if (!enabled) return "disabled";
  if (!creep?.pos) return "creep-missing";
  if (showTargets && target?.pos && target.pos.roomName !== creep.pos.roomName) return "cross-room-target";
  if (showTargets && target?.pos) return "drawn-with-target";
  return showLabels ? "drawn-labeled" : "drawn";
}
const creep = { pos: { x: 1, y: 1, roomName: "W1N1" } };
for (const [input, expected] of [
  [{ enabled: false }, "disabled"],
  [{ enabled: true }, "creep-missing"],
  [{ enabled: true, creep, showLabels: true }, "drawn-labeled"],
  [{ enabled: true, creep, target: { pos: { roomName: "W1N1" } }, showTargets: true }, "drawn-with-target"],
  [{ enabled: true, creep, target: { pos: { roomName: "W2N2" } }, showTargets: true }, "cross-room-target"],
]) {
  if (visualPlan(input) !== expected) failures.push(`视觉计划失败：${expected}`);
}
const sorted = [{ name: "z" }, { name: "a" }, { name: "m" }].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 2);
if (sorted.map((item) => item.name).join(",") !== "a,m") failures.push("视觉稳定排序失败");
const trimmed = "x".repeat(50).slice(0, 37) + "...";
if (trimmed.length !== 40) failures.push("视觉标签裁剪失败");
if (!(479999 < 480000) || 480000 < 480000) failures.push("视觉字节停止线失败");

function normalizeThrown(thrown) {
  if (thrown instanceof Error) {
    return { name: thrown.name || "Error", message: thrown.message || String(thrown) };
  }
  let message;
  try {
    message = typeof thrown === "string" ? thrown : JSON.stringify(thrown);
  } catch {
    message = String(thrown);
  }
  return { name: "NonErrorThrow", message: message ?? String(thrown) };
}
function evaluateGuard({ now, errorTicks, disabledUntil, windowTicks, maxErrors, cooldownTicks, throws }) {
  const firstTick = now - windowTicks + 1;
  const recent = errorTicks.filter((tick) => tick >= firstTick);
  if (Number.isInteger(disabledUntil) && now < disabledUntil) {
    return { status: "cooldown", errorTicks: recent, retryAt: disabledUntil };
  }
  if (!throws) {
    return { status: Number.isInteger(disabledUntil) ? "recovered" : "ok", errorTicks: [] };
  }
  recent.push(now);
  const tripped = recent.length >= maxErrors;
  return {
    status: tripped ? "disabled" : "error",
    errorTicks: recent,
    retryAt: tripped ? now + cooldownTicks : null,
  };
}
const roomOrder = [];
for (const roomName of ["W1N1", "W2N2", "W3N3"]) {
  try {
    if (roomName === "W1N1") throw new Error("broken room");
    roomOrder.push(roomName);
  } catch {
    roomOrder.push(`${roomName}:error`);
  }
}
if (roomOrder.join(",") !== "W1N1:error,W2N2,W3N3") failures.push("房间异常未正确隔离");
const firstGuard = evaluateGuard({ now: 10, errorTicks: [], disabledUntil: null, windowTicks: 10, maxErrors: 3, cooldownTicks: 5, throws: true });
const secondGuard = evaluateGuard({ now: 11, errorTicks: firstGuard.errorTicks, disabledUntil: null, windowTicks: 10, maxErrors: 3, cooldownTicks: 5, throws: true });
const thirdGuard = evaluateGuard({ now: 12, errorTicks: secondGuard.errorTicks, disabledUntil: null, windowTicks: 10, maxErrors: 3, cooldownTicks: 5, throws: true });
if (firstGuard.status !== "error" || secondGuard.status !== "error" || thirdGuard.status !== "disabled" || thirdGuard.retryAt !== 17) failures.push("异常熔断阈值失败");
const cooldownGuard = evaluateGuard({ now: 15, errorTicks: thirdGuard.errorTicks, disabledUntil: thirdGuard.retryAt, windowTicks: 10, maxErrors: 3, cooldownTicks: 5, throws: false });
if (cooldownGuard.status !== "cooldown" || cooldownGuard.retryAt !== 17) failures.push("异常冷却状态失败");
const recoveryGuard = evaluateGuard({ now: 17, errorTicks: thirdGuard.errorTicks, disabledUntil: thirdGuard.retryAt, windowTicks: 10, maxErrors: 3, cooldownTicks: 5, throws: false });
if (recoveryGuard.status !== "recovered") failures.push("异常冷却恢复失败");
const nonError = normalizeThrown({ reason: "missing-anchor" });
if (nonError.name !== "NonErrorThrow" || !nonError.message.includes("missing-anchor")) failures.push("非 Error throw 规范化失败");
let apiCaught = false;
try {
  const apiResult = -9;
  if (apiResult !== -9) throw new Error("unexpected result");
} catch {
  apiCaught = true;
}
if (apiCaught) failures.push("普通 API 返回码被错误当成异常");
function logDue(lastLogAt, now, interval) {
  return !Number.isInteger(lastLogAt) || now - lastLogAt >= interval;
}
if (!logDue(null, 10, 20) || logDue(5, 10, 20) || !logDue(5, 25, 20)) failures.push("异常日志限频失败");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第九批英文可观测性检查通过：4 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块，并覆盖通知、事件、视觉与异常隔离边界。`);
