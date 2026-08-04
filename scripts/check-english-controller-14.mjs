import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-controller-safe-mode-14.ts",
  "src/lib/english-controller-downgrade-14.ts",
  "src/lib/english-reserve-claim-controller-14.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-controller-registry-14.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-controller-content-14.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-controller-activate-safe-mode",
  "screeps-controller-downgrade",
  "screeps-reserve-vs-claim-controller",
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
  "request.confirmed !== true",
  "request.enabled = false",
  "controller.activateSafeMode()",
  "safeModeAvailable",
  "safeModeCooldown",
  "upgradeBlocked",
  "CONTROLLER_DOWNGRADE",
  "emergencyThreshold",
  "recoveryThreshold",
  "upgrader.upgradeController",
  "creep.reserveController(controller)",
  "creep.claimController(controller)",
  "claimConfirmed",
  "ownedRoomCount >= input.gclLevel",
  "mission.enabled = false",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishControllerBatchFourteenArticles")) failures.push("第十四批聚合器缺失");
if (!route.includes("englishControllerBatchFourteenArticles")) failures.push("动态路由未载入第十四批数组");
if (!route.includes("getEnglishControllerBatchFourteenArticle")) failures.push("动态路由未载入第十四批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 42) failures.push(`目录条目不足：${toc.length}`);
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-controller-14-"));
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

function safeModePlan(input) {
  if (!input.enabled) return "disabled";
  if (input.confirmation !== "ACTIVATE_SAFE_MODE") return "confirmation-missing";
  if (!input.roomVisible || !input.controller) return "controller-missing";
  if (!input.owned) return "not-owner";
  if (input.safeMode > 0) return "already-active";
  if (!Number.isInteger(input.available) || input.available <= 0) return "no-activation";
  if (input.cooldown > 0) return "activation-cooldown";
  if (input.upgradeBlocked > 0) return "upgrade-blocked";
  return "ready";
}
const safeBase = {
  enabled: true,
  confirmation: "ACTIVATE_SAFE_MODE",
  roomVisible: true,
  controller: true,
  owned: true,
  safeMode: 0,
  available: 1,
  cooldown: 0,
  upgradeBlocked: 0,
};
for (const [input, expected] of [
  [{ ...safeBase, enabled: false }, "disabled"],
  [{ ...safeBase, confirmation: "yes" }, "confirmation-missing"],
  [{ ...safeBase, roomVisible: false }, "controller-missing"],
  [{ ...safeBase, owned: false }, "not-owner"],
  [{ ...safeBase, safeMode: 100 }, "already-active"],
  [{ ...safeBase, available: 0 }, "no-activation"],
  [{ ...safeBase, cooldown: 10 }, "activation-cooldown"],
  [{ ...safeBase, upgradeBlocked: 10 }, "upgrade-blocked"],
  [safeBase, "ready"],
]) {
  if (safeModePlan(input) !== expected) failures.push(`Safe Mode 计划失败：${expected}`);
}

function downgradeState(input) {
  if (!input.owned || !Number.isFinite(input.ticks)) return "controller-unavailable";
  if (
    !Number.isFinite(input.enter)
    || !Number.isFinite(input.recover)
    || input.enter <= 0
    || input.recover <= input.enter
  ) return "invalid-thresholds";
  if (input.active) return input.ticks >= input.recover ? "recovered" : "risk-continues";
  return input.ticks < input.enter ? "risk-entered" : "normal";
}
for (const [input, expected] of [
  [{ owned: false }, "controller-unavailable"],
  [{ owned: true, ticks: 100, enter: 0, recover: 1000, active: false }, "invalid-thresholds"],
  [{ owned: true, ticks: 4999, enter: 5000, recover: 10000, active: false }, "risk-entered"],
  [{ owned: true, ticks: 5000, enter: 5000, recover: 10000, active: false }, "normal"],
  [{ owned: true, ticks: 9999, enter: 5000, recover: 10000, active: true }, "risk-continues"],
  [{ owned: true, ticks: 10000, enter: 5000, recover: 10000, active: true }, "recovered"],
]) {
  if (downgradeState(input) !== expected) failures.push(`Controller 降级状态失败：${expected}`);
}

function selectUpgrader(candidates) {
  return [...candidates]
    .filter((item) => item.role === "upgrader" && !item.spawning && item.energy > 0 && item.work > 0)
    .sort((left, right) =>
      right.energy - left.energy
      || left.range - right.range
      || left.name.localeCompare(right.name)
    )[0]?.name || null;
}
for (const [candidates, expected] of [
  [[], null],
  [[{ name: "a", role: "upgrader", spawning: false, energy: 0, work: 1, range: 1 }], null],
  [[{ name: "a", role: "upgrader", spawning: false, energy: 50, work: 1, range: 5 }, { name: "b", role: "upgrader", spawning: false, energy: 100, work: 1, range: 10 }], "b"],
  [[{ name: "b", role: "upgrader", spawning: false, energy: 50, work: 1, range: 2 }, { name: "a", role: "upgrader", spawning: false, energy: 50, work: 1, range: 2 }], "a"],
]) {
  if (selectUpgrader(candidates) !== expected) failures.push(`应急 Upgrader 选择失败：${expected}`);
}

function controllerMission(input) {
  if (!input.enabled) return "disabled";
  if (!["reserve", "claim"].includes(input.action)) return "invalid-action";
  if (!input.creepOwned || input.spawning) return "creep-unavailable";
  if (!Number.isInteger(input.claimParts) || input.claimParts <= 0) return "no-active-claim-part";
  if (!input.controller) return "controller-missing";
  if (input.controllerOwned) return "controller-owned";
  if (input.reservation && input.reservation !== input.username) return "hostile-reservation";
  if (input.action === "claim") {
    if (!input.confirmed) return "claim-not-confirmed";
    if (input.ownedRooms >= input.gcl) return "gcl-not-enough";
  }
  if (!Number.isInteger(input.range) || input.range > 1) return "move-to-controller";
  return "ready";
}
const missionBase = {
  enabled: true,
  action: "reserve",
  creepOwned: true,
  spawning: false,
  claimParts: 1,
  controller: true,
  controllerOwned: false,
  reservation: null,
  username: "me",
  confirmed: false,
  ownedRooms: 1,
  gcl: 2,
  range: 1,
};
for (const [input, expected] of [
  [{ ...missionBase, action: "bad" }, "invalid-action"],
  [{ ...missionBase, claimParts: 0 }, "no-active-claim-part"],
  [{ ...missionBase, controllerOwned: true }, "controller-owned"],
  [{ ...missionBase, reservation: "other" }, "hostile-reservation"],
  [{ ...missionBase, action: "claim" }, "claim-not-confirmed"],
  [{ ...missionBase, action: "claim", confirmed: true, ownedRooms: 2 }, "gcl-not-enough"],
  [{ ...missionBase, range: 2 }, "move-to-controller"],
  [missionBase, "ready"],
  [{ ...missionBase, action: "claim", confirmed: true }, "ready"],
]) {
  if (controllerMission(input) !== expected) failures.push(`Controller 任务失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十四批英文 Controller 检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、28 个离线边界用例。`);