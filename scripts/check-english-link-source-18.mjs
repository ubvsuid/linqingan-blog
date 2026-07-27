import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-link-transfer-18.ts",
  "src/lib/english-source-selection-18.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-link-source-registry-18.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-link-source-content-18.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-link-transfer-energy",
  "screeps-select-source-by-path",
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
  "getOwnedLink",
  "LINK_LOSS_RATIO",
  "sourceLink.transferEnergy",
  "different-room",
  "targetReserve",
  "minimumSend",
  "FIND_SOURCES_ACTIVE",
  "countAssignmentsBySource",
  "selectSourceCandidate",
  "findPathTo",
  "Game.getObjectById(sourceId)",
  "creep.getActiveBodyparts(WORK)",
  "ERR_NOT_ENOUGH_RESOURCES",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 2 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishLinkSourceBatchEighteenArticles")) failures.push("第十八批聚合器缺失");
if (!route.includes("englishLinkSourceBatchEighteenArticles")) failures.push("动态路由未载入第十八批数组");
if (!route.includes("getEnglishLinkSourceBatchEighteenArticle")) failures.push("动态路由未载入第十八批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 30) failures.push(`目录条目不足：${toc.length}`);
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-link-source-18-"));
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

function linkPlan(input) {
  if (!input.source || !input.target) return "link-missing";
  if (input.same) return "same-link";
  if (!input.sameRoom) return "different-room";
  if (!input.sourceActive || !input.targetActive) return "link-inactive";
  if (!Number.isInteger(input.cooldown) || input.cooldown > 0) return "source-not-ready";
  const amount = Math.max(0, Math.min(input.sourceEnergy, Math.max(0, input.targetFree - input.targetReserve)));
  return amount < input.minimumSend ? "amount-below-threshold" : "ready";
}
const linkBase = {
  source: true,
  target: true,
  same: false,
  sameRoom: true,
  sourceActive: true,
  targetActive: true,
  cooldown: 0,
  sourceEnergy: 800,
  targetFree: 600,
  targetReserve: 100,
  minimumSend: 200,
};
for (const [input, expected] of [
  [{ ...linkBase, source: false }, "link-missing"],
  [{ ...linkBase, same: true }, "same-link"],
  [{ ...linkBase, sameRoom: false }, "different-room"],
  [{ ...linkBase, sourceActive: false }, "link-inactive"],
  [{ ...linkBase, cooldown: 1 }, "source-not-ready"],
  [{ ...linkBase, sourceEnergy: 100 }, "amount-below-threshold"],
  [{ ...linkBase, targetFree: 100 }, "amount-below-threshold"],
  [linkBase, "ready"],
]) {
  if (linkPlan(input) !== expected) failures.push(`Link 计划失败：${expected}`);
}

function estimate(amount, lossRatio) {
  if (!Number.isInteger(amount) || amount <= 0) return { loss: 0, received: 0 };
  const loss = Math.ceil(amount * lossRatio);
  return { loss, received: Math.max(0, amount - loss) };
}
const estimateResult = estimate(200, 0.03);
if (estimateResult.loss !== 6 || estimateResult.received !== 194) failures.push("Link 损耗估算失败");
if (estimate(0, 0.03).received !== 0) failures.push("Link 零值估算失败");

function selectSource(candidates) {
  return [...candidates]
    .filter((candidate) =>
      candidate.energy > 0
      && candidate.reachable
      && Number.isFinite(candidate.pathLength)
      && candidate.pathLength >= 0
      && Number.isInteger(candidate.assignments)
      && candidate.assignments >= 0
    )
    .sort((left, right) =>
      left.pathLength - right.pathLength
      || left.assignments - right.assignments
      || left.id.localeCompare(right.id)
    )[0]?.id || null;
}
for (const [candidates, expected] of [
  [[], null],
  [[{ id: "a", energy: 0, reachable: true, pathLength: 1, assignments: 0 }], null],
  [[{ id: "a", energy: 100, reachable: false, pathLength: 1, assignments: 0 }], null],
  [[{ id: "a", energy: 100, reachable: true, pathLength: 5, assignments: 0 }, { id: "b", energy: 100, reachable: true, pathLength: 2, assignments: 5 }], "b"],
  [[{ id: "a", energy: 100, reachable: true, pathLength: 2, assignments: 3 }, { id: "b", energy: 100, reachable: true, pathLength: 2, assignments: 1 }], "b"],
  [[{ id: "b", energy: 100, reachable: true, pathLength: 2, assignments: 1 }, { id: "a", energy: 100, reachable: true, pathLength: 2, assignments: 1 }], "a"],
]) {
  if (selectSource(candidates) !== expected) failures.push(`Source 选择失败：${expected}`);
}

function emptyPolicy(mode) {
  return mode === "dynamic" ? "target-cleared" : "target-preserved";
}
if (emptyPolicy("dynamic") !== "target-cleared") failures.push("动态 Source 空矿策略失败");
if (emptyPolicy("fixed") !== "target-preserved") failures.push("固定 Source 空矿策略失败");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十八批英文 Link 与 Source 检查通过：2 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块，以及 Link 与 Source 选择边界用例。`);
