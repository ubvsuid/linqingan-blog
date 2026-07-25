import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-nuker-launch-17.ts",
  "src/lib/english-rampart-public-17.ts",
  "src/lib/english-fortification-repair-17.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-defense-operations-registry-17.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-defense-operations-content-17.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-nuker-launch",
  "screeps-rampart-set-public",
  "screeps-wall-rampart-repair-limit",
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
  "buildNukeConfirmation",
  "NUKE_RANGE",
  "NUKER_ENERGY_CAPACITY",
  "NUKER_GHODIUM_CAPACITY",
  "nuker.launchNuke(target)",
  "request.enabled = false",
  "buildRampartConfirmation",
  "Game.structures[rampart.id]",
  "rampart.setPublic(request.public)",
  "state-already-matches",
  "selectDefenseRepairTarget",
  "STRUCTURE_WALL",
  "STRUCTURE_RAMPART",
  "creep.getActiveBodyparts(WORK)",
  "range: 3",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishDefenseOperationsBatchSeventeenArticles")) failures.push("第十七批聚合器缺失");
if (!route.includes("englishDefenseOperationsBatchSeventeenArticles")) failures.push("动态路由未载入第十七批数组");
if (!route.includes("getEnglishDefenseOperationsBatchSeventeenArticle")) failures.push("动态路由未载入第十七批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 43) failures.push(`目录条目不足：${toc.length}`);
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
if (blocks.length < 24) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-defense-17-"));
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

function nukePlan(input) {
  if (!input.enabled) return "disabled";
  if (!input.validTarget) return "invalid-target";
  if (input.confirmation !== `LAUNCH_NUKE_${input.room}_${input.x}_${input.y}`) return "confirmation-mismatch";
  if (!input.owned) return "not-owner";
  if (!input.active) return "structure-inactive";
  if (input.cooldown > 0) return "nuker-waiting";
  if (!Number.isFinite(input.distance) || input.distance > input.range) return "target-out-of-range";
  if (input.energy < input.energyCapacity) return "energy-shortage";
  if (input.ghodium < input.ghodiumCapacity) return "ghodium-shortage";
  return "ready";
}
const nukeBase = {
  enabled: true,
  validTarget: true,
  room: "W2N2",
  x: 25,
  y: 25,
  confirmation: "LAUNCH_NUKE_W2N2_25_25",
  owned: true,
  active: true,
  cooldown: 0,
  distance: 10,
  range: 10,
  energy: 300000,
  energyCapacity: 300000,
  ghodium: 5000,
  ghodiumCapacity: 5000,
};
for (const [input, expected] of [
  [{ ...nukeBase, enabled: false }, "disabled"],
  [{ ...nukeBase, validTarget: false }, "invalid-target"],
  [{ ...nukeBase, confirmation: "LAUNCH" }, "confirmation-mismatch"],
  [{ ...nukeBase, owned: false }, "not-owner"],
  [{ ...nukeBase, active: false }, "structure-inactive"],
  [{ ...nukeBase, cooldown: 1 }, "nuker-waiting"],
  [{ ...nukeBase, distance: 11 }, "target-out-of-range"],
  [{ ...nukeBase, energy: 299999 }, "energy-shortage"],
  [{ ...nukeBase, ghodium: 4999 }, "ghodium-shortage"],
  [nukeBase, "ready"],
]) {
  if (nukePlan(input) !== expected) failures.push(`Nuker 计划失败：${expected}`);
}

function rampartPlan(input) {
  if (!input.enabled) return "disabled";
  const state = input.public ? "PUBLIC" : "PRIVATE";
  if (input.confirmation !== `SET_RAMPART_${state}_${input.room}_${input.x}_${input.y}`) return "confirmation-mismatch";
  if (!input.present) return "rampart-missing";
  if (!input.owned) return "not-owner";
  if (input.type !== "rampart") return "type-mismatch";
  if (input.actualRoom !== input.room) return "room-mismatch";
  if (input.actualX !== input.x || input.actualY !== input.y) return "position-mismatch";
  if (input.currentPublic === input.public) return "state-already-matches";
  return "ready";
}
const rampartBase = {
  enabled: true,
  public: true,
  confirmation: "SET_RAMPART_PUBLIC_W1N1_20_20",
  room: "W1N1",
  x: 20,
  y: 20,
  present: true,
  owned: true,
  type: "rampart",
  actualRoom: "W1N1",
  actualX: 20,
  actualY: 20,
  currentPublic: false,
};
for (const [input, expected] of [
  [{ ...rampartBase, confirmation: "yes" }, "confirmation-mismatch"],
  [{ ...rampartBase, present: false }, "rampart-missing"],
  [{ ...rampartBase, owned: false }, "not-owner"],
  [{ ...rampartBase, type: "road" }, "type-mismatch"],
  [{ ...rampartBase, actualRoom: "W2N2" }, "room-mismatch"],
  [{ ...rampartBase, actualX: 21 }, "position-mismatch"],
  [{ ...rampartBase, currentPublic: true }, "state-already-matches"],
  [rampartBase, "ready"],
]) {
  if (rampartPlan(input) !== expected) failures.push(`Rampart 计划失败：${expected}`);
}

function selectRepair(items, limit) {
  return [...items]
    .filter((item) =>
      ["wall", "rampart"].includes(item.type)
      && item.hits < item.hitsMax
      && item.hits < limit
    )
    .sort((left, right) =>
      left.hits - right.hits
      || left.range - right.range
      || left.id.localeCompare(right.id)
    )[0]?.id || null;
}
for (const [items, limit, expected] of [
  [[], 100000, null],
  [[{ id: "a", type: "road", hits: 1, hitsMax: 100, range: 1 }], 100000, null],
  [[{ id: "a", type: "wall", hits: 100000, hitsMax: 300000000, range: 1 }], 100000, null],
  [[{ id: "a", type: "wall", hits: 10, hitsMax: 10, range: 1 }], 100000, null],
  [[{ id: "a", type: "wall", hits: 500, hitsMax: 1000, range: 5 }, { id: "b", type: "rampart", hits: 100, hitsMax: 1000, range: 10 }], 100000, "b"],
  [[{ id: "b", type: "wall", hits: 100, hitsMax: 1000, range: 2 }, { id: "a", type: "rampart", hits: 100, hitsMax: 1000, range: 2 }], 100000, "a"],
]) {
  if (selectRepair(items, limit) !== expected) failures.push(`防御维修排序失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十七批英文防御操作检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块，以及 Nuker、Rampart 与阶段维修边界用例。`);
