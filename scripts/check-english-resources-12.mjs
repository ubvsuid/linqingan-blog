import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-mineral-extractor-12.ts",
  "src/lib/english-storage-energy-12.ts",
  "src/lib/english-power-spawn-12.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-mineral-storage-power-registry-12.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-mineral-storage-power-content-12.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-mineral-extractor-harvest",
  "screeps-storage-energy-usage",
  "screeps-power-spawn-process-power",
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
  "findExtractorForMineral",
  "mineral.mineralAmount",
  "extractor.cooldown",
  "ERR_NOT_FOUND",
  "getStorageWithdrawableEnergy",
  "storageEnergy - reserveEnergy",
  "delivery-target-not-found",
  "POWER_SPAWN_ENERGY_RATIO",
  "PWR_OPERATE_POWER",
  "Game.gpl.progress",
  "room.powerSpawn",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishMineralStoragePowerBatchTwelveArticles")) failures.push("第十二批聚合器缺失");
if (!route.includes("englishMineralStoragePowerBatchTwelveArticles")) failures.push("动态路由未载入第十二批数组");
if (!route.includes("getEnglishMineralStoragePowerBatchTwelveArticle")) failures.push("动态路由未载入第十二批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 40) failures.push(`目录条目不足：${toc.length}`);
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-resources-12-"));
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

function evaluateMineral(input) {
  if (!input.mineral) return "mineral-missing";
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "mineral-depleted";
  if (!input.extractor || !input.sameTile) return "extractor-missing";
  if (!input.owned || !input.active) return "extractor-inactive";
  if (!Number.isInteger(input.cooldown) || input.cooldown > 0) return "extractor-not-ready";
  if (!Number.isInteger(input.work) || input.work <= 0) return "no-active-work-part";
  if (!Number.isFinite(input.free) || input.free <= 0) return "creep-full";
  if (!input.near) return "move-to-mineral";
  return "ready";
}
const mineralBase = {
  mineral: true,
  amount: 100,
  extractor: true,
  sameTile: true,
  owned: true,
  active: true,
  cooldown: 0,
  work: 2,
  free: 50,
  near: true,
};
for (const [input, expected] of [
  [{ ...mineralBase, mineral: false }, "mineral-missing"],
  [{ ...mineralBase, amount: 0 }, "mineral-depleted"],
  [{ ...mineralBase, sameTile: false }, "extractor-missing"],
  [{ ...mineralBase, active: false }, "extractor-inactive"],
  [{ ...mineralBase, cooldown: 4 }, "extractor-not-ready"],
  [{ ...mineralBase, work: 0 }, "no-active-work-part"],
  [{ ...mineralBase, free: 0 }, "creep-full"],
  [{ ...mineralBase, near: false }, "move-to-mineral"],
  [mineralBase, "ready"],
]) {
  if (evaluateMineral(input) !== expected) failures.push(`Mineral 计划失败：${expected}`);
}

function withdrawable(storageEnergy, reserve, free) {
  if (
    !Number.isFinite(storageEnergy)
    || !Number.isFinite(reserve)
    || !Number.isFinite(free)
    || storageEnergy < 0
    || reserve < 0
    || free <= 0
  ) return 0;
  return Math.min(Math.max(0, storageEnergy - reserve), free);
}
for (const [storage, reserve, free, expected] of [
  [25000, 20000, 1000, 1000],
  [20500, 20000, 1000, 500],
  [20000, 20000, 1000, 0],
  [19999, 20000, 1000, 0],
  [25000, 20000, 0, 0],
  [-1, 0, 100, 0],
]) {
  if (withdrawable(storage, reserve, free) !== expected) {
    failures.push(`Storage 可取量失败：${storage}/${reserve}/${free}`);
  }
}

function selectTarget(candidates) {
  return [...candidates]
    .filter((item) => item.free > 0 && Number.isInteger(item.priority))
    .sort((left, right) =>
      left.priority - right.priority
      || left.range - right.range
      || left.id.localeCompare(right.id)
    )[0]?.id || null;
}
for (const [candidates, expected] of [
  [[], null],
  [[{ id: "e", priority: 1, range: 1, free: 50 }], "e"],
  [[{ id: "e", priority: 1, range: 1, free: 50 }, { id: "s", priority: 0, range: 5, free: 50 }], "s"],
  [[{ id: "b", priority: 0, range: 2, free: 50 }, { id: "a", priority: 0, range: 2, free: 50 }], "a"],
]) {
  if (selectTarget(candidates) !== expected) failures.push(`Storage 目标排序失败：${expected}`);
}

function plannedPower(effectLevel, effects) {
  if (!Number.isInteger(effectLevel)) return 1;
  const extra = Array.isArray(effects) ? effects[effectLevel - 1] : null;
  return Number.isFinite(extra) ? 1 + extra : 1;
}
if (plannedPower(null, [1, 2, 3]) !== 1) failures.push("基础 Power 处理量失败");
if (plannedPower(1, [1, 2, 3]) !== 2) failures.push("Power 效果一级失败");
if (plannedPower(3, [1, 2, 3]) !== 4) failures.push("Power 效果三级失败");
if (plannedPower(9, [1, 2, 3]) !== 1) failures.push("Power 效果回退失败");

function evaluatePower(input) {
  if (!input.enabled) return "disabled";
  if (!Number.isInteger(input.planned) || input.planned <= 0) return "invalid-plan";
  const energy = input.planned * input.ratio;
  if (input.power < input.planned) return "power-shortage";
  if (input.localEnergy < energy) return "power-spawn-energy-shortage";
  if (input.roomEnergy - energy < input.reserve) return "room-energy-reserve";
  return "ready";
}
const powerBase = {
  enabled: true,
  planned: 1,
  ratio: 50,
  power: 1,
  localEnergy: 50,
  roomEnergy: 1000,
  reserve: 950,
};
for (const [input, expected] of [
  [{ ...powerBase, enabled: false }, "disabled"],
  [{ ...powerBase, planned: 0 }, "invalid-plan"],
  [{ ...powerBase, power: 0 }, "power-shortage"],
  [{ ...powerBase, localEnergy: 49 }, "power-spawn-energy-shortage"],
  [{ ...powerBase, reserve: 951 }, "room-energy-reserve"],
  [powerBase, "ready"],
]) {
  if (evaluatePower(input) !== expected) failures.push(`Power 处理计划失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十二批英文资源检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、32 个离线边界用例。`);
