import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-tower-attack-13.ts",
  "src/lib/english-tower-heal-13.ts",
  "src/lib/english-tower-repair-13.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-tower-registry-13.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-tower-content-13.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-tower-auto-attack-hostiles",
  "screeps-tower-heal-creeps",
  "screeps-tower-repair-threshold",
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
  "TOWER_ENERGY_COST",
  "FIND_HOSTILE_CREEPS",
  "getActiveBodyparts",
  "tower.attack(target)",
  "left.hits / left.hitsMax",
  "tower.heal(target)",
  "repairReserve + TOWER_ENERGY_COST",
  "STRUCTURE_WALL",
  "STRUCTURE_RAMPART",
  "tower.repair(target)",
  "chooseTowerAction",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishTowerBatchThirteenArticles")) failures.push("第十三批聚合器缺失");
if (!route.includes("englishTowerBatchThirteenArticles")) failures.push("动态路由未载入第十三批数组");
if (!route.includes("getEnglishTowerBatchThirteenArticle")) failures.push("动态路由未载入第十三批查询函数");
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
if (blocks.length < 18) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-tower-13-"));
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

function threatScore(parts) {
  return (parts.attack || 0) * 5
    + (parts.ranged || 0) * 5
    + (parts.heal || 0) * 4
    + (parts.claim || 0) * 3
    + (parts.work || 0) * 2;
}
if (threatScore({ attack: 1 }) !== 5) failures.push("Tower 威胁 ATTACK 计分失败");
if (threatScore({ heal: 1, work: 1 }) !== 6) failures.push("Tower 威胁组合计分失败");
if (threatScore({}) !== 0) failures.push("Tower 威胁空计分失败");

function selectAttack(candidates, allowed) {
  return [...candidates]
    .filter((item) => !allowed.has(item.owner))
    .sort((left, right) =>
      right.threat - left.threat
      || left.range - right.range
      || left.name.localeCompare(right.name)
    )[0]?.name || null;
}
for (const [candidates, allowed, expected] of [
  [[], new Set(), null],
  [[{ name: "a", owner: "ally", threat: 9, range: 1 }], new Set(["ally"]), null],
  [[{ name: "a", owner: "x", threat: 5, range: 5 }, { name: "b", owner: "y", threat: 9, range: 10 }], new Set(), "b"],
  [[{ name: "b", owner: "x", threat: 5, range: 2 }, { name: "a", owner: "y", threat: 5, range: 2 }], new Set(), "a"],
]) {
  if (selectAttack(candidates, allowed) !== expected) failures.push(`Tower 攻击排序失败：${expected}`);
}

function selectHeal(candidates) {
  return [...candidates]
    .filter((item) => item.hits > 0 && item.hits < item.hitsMax)
    .sort((left, right) =>
      left.hits / left.hitsMax - right.hits / right.hitsMax
      || (right.hitsMax - right.hits) - (left.hitsMax - left.hits)
      || left.range - right.range
      || left.name.localeCompare(right.name)
    )[0]?.name || null;
}
for (const [candidates, expected] of [
  [[], null],
  [[{ name: "full", hits: 100, hitsMax: 100, range: 1 }], null],
  [[{ name: "a", hits: 50, hitsMax: 100, range: 10 }, { name: "b", hits: 80, hitsMax: 100, range: 1 }], "a"],
  [[{ name: "a", hits: 50, hitsMax: 100, range: 3 }, { name: "b", hits: 100, hitsMax: 200, range: 5 }], "b"],
  [[{ name: "b", hits: 50, hitsMax: 100, range: 2 }, { name: "a", hits: 50, hitsMax: 100, range: 2 }], "a"],
]) {
  if (selectHeal(candidates) !== expected) failures.push(`Tower 治疗排序失败：${expected}`);
}

function canRepair({ hostile, injured, energy, reserve, cost }) {
  if (hostile) return "attack-priority";
  if (injured) return "heal-priority";
  if (energy < reserve + cost) return "reserve-protected";
  return "ready";
}
for (const [input, expected] of [
  [{ hostile: true, injured: false, energy: 1000, reserve: 500, cost: 10 }, "attack-priority"],
  [{ hostile: false, injured: true, energy: 1000, reserve: 500, cost: 10 }, "heal-priority"],
  [{ hostile: false, injured: false, energy: 509, reserve: 500, cost: 10 }, "reserve-protected"],
  [{ hostile: false, injured: false, energy: 510, reserve: 500, cost: 10 }, "ready"],
]) {
  if (canRepair(input) !== expected) failures.push(`Tower 维修门槛失败：${expected}`);
}

function selectRepair(candidates, limit) {
  return [...candidates]
    .filter((item) =>
      item.type !== "wall"
      && item.type !== "rampart"
      && item.hits > 0
      && item.hits < item.hitsMax
      && item.hits / item.hitsMax < limit
    )
    .sort((left, right) =>
      left.hits / left.hitsMax - right.hits / right.hitsMax
      || left.range - right.range
      || left.id.localeCompare(right.id)
    )[0]?.id || null;
}
for (const [candidates, limit, expected] of [
  [[], 0.8, null],
  [[{ id: "w", type: "wall", hits: 1, hitsMax: 100, range: 1 }], 0.8, null],
  [[{ id: "a", type: "road", hits: 70, hitsMax: 100, range: 5 }, { id: "b", type: "road", hits: 50, hitsMax: 100, range: 10 }], 0.8, "b"],
  [[{ id: "b", type: "road", hits: 50, hitsMax: 100, range: 2 }, { id: "a", type: "road", hits: 50, hitsMax: 100, range: 2 }], 0.8, "a"],
]) {
  if (selectRepair(candidates, limit) !== expected) failures.push(`Tower 维修排序失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十三批英文 Tower 检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、20 个离线边界用例。`);
