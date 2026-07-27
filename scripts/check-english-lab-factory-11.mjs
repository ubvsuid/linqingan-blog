import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-lab-reaction-11.ts",
  "src/lib/english-lab-boost-11.ts",
  "src/lib/english-factory-produce-11.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-lab-factory-registry-11.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-lab-factory-content-11.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-lab-run-reaction",
  "screeps-lab-boost-creep",
  "screeps-factory-produce",
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
  "request.enabled = false",
  "LAB_REACTION_AMOUNT",
  "REACTIONS",
  "inRangeTo",
  "LAB_BOOST_MINERAL",
  "LAB_BOOST_ENERGY",
  "BOOSTS",
  "TOUGH",
  "COMMODITIES",
  "PWR_OPERATE_FACTORY",
  "factory.level",
  "factory.produce",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishLabFactoryBatchElevenArticles")) failures.push("第十一批聚合器缺失");
if (!route.includes("englishLabFactoryBatchElevenArticles")) failures.push("动态路由未载入第十一批数组");
if (!route.includes("getEnglishLabFactoryBatchElevenArticle")) failures.push("动态路由未载入第十一批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 39) failures.push(`目录条目不足：${toc.length}`);
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-lab-factory-11-"));
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

function evaluateReaction(input) {
  if (!input.inputA || !input.inputB || !input.output) return "lab-missing";
  if (!input.owned || !input.active) return "lab-unavailable";
  if (input.cooldown > 0) return "output-waiting";
  if (!input.product) return "invalid-recipe";
  if (input.amountA < input.reactionAmount || input.amountB < input.reactionAmount) return "reagent-shortage";
  if (input.outputMineral && input.outputMineral !== input.product) return "output-mineral-conflict";
  if (input.freeCapacity < input.reactionAmount) return "output-full";
  if (!input.inputAInRange || !input.inputBInRange) return "input-out-of-range";
  return "ready";
}
const reactionBase = {
  inputA: true,
  inputB: true,
  output: true,
  owned: true,
  active: true,
  cooldown: 0,
  product: "OH",
  amountA: 5,
  amountB: 5,
  reactionAmount: 5,
  outputMineral: null,
  freeCapacity: 5,
  inputAInRange: true,
  inputBInRange: true,
};
for (const [input, expected] of [
  [{ ...reactionBase, inputA: false }, "lab-missing"],
  [{ ...reactionBase, active: false }, "lab-unavailable"],
  [{ ...reactionBase, cooldown: 1 }, "output-waiting"],
  [{ ...reactionBase, product: null }, "invalid-recipe"],
  [{ ...reactionBase, amountA: 4 }, "reagent-shortage"],
  [{ ...reactionBase, outputMineral: "ZK" }, "output-mineral-conflict"],
  [{ ...reactionBase, freeCapacity: 4 }, "output-full"],
  [{ ...reactionBase, inputBInRange: false }, "input-out-of-range"],
  [reactionBase, "ready"],
]) {
  if (evaluateReaction(input) !== expected) failures.push(`Lab 反应计划失败：${expected}`);
}

function evaluateBoost(input) {
  if (!input.lab || !input.creep) return "target-missing";
  if (!input.owned || !input.active) return "lab-unavailable";
  if (!input.bodyType) return "invalid-mineral";
  if (input.eligibleParts <= 0) return "no-eligible-parts";
  const count = Number.isInteger(input.requestedCount) && input.requestedCount > 0
    ? Math.min(input.requestedCount, input.eligibleParts)
    : input.eligibleParts;
  if (input.mineralAvailable < count * input.mineralPerPart) return "mineral-shortage";
  if (input.energyAvailable < count * input.energyPerPart) return "energy-shortage";
  if (!input.near) return "not-adjacent";
  return `ready:${count}`;
}
const boostBase = {
  lab: true,
  creep: true,
  owned: true,
  active: true,
  bodyType: "work",
  eligibleParts: 5,
  requestedCount: 3,
  mineralAvailable: 90,
  energyAvailable: 60,
  mineralPerPart: 30,
  energyPerPart: 20,
  near: true,
};
for (const [input, expected] of [
  [{ ...boostBase, lab: false }, "target-missing"],
  [{ ...boostBase, owned: false }, "lab-unavailable"],
  [{ ...boostBase, bodyType: null }, "invalid-mineral"],
  [{ ...boostBase, eligibleParts: 0 }, "no-eligible-parts"],
  [{ ...boostBase, mineralAvailable: 89 }, "mineral-shortage"],
  [{ ...boostBase, energyAvailable: 59 }, "energy-shortage"],
  [{ ...boostBase, near: false }, "not-adjacent"],
  [{ ...boostBase, requestedCount: 9, mineralAvailable: 150, energyAvailable: 100 }, "ready:5"],
  [boostBase, "ready:3"],
]) {
  if (evaluateBoost(input) !== expected) failures.push(`Lab 强化计划失败：${expected}`);
}

function evaluateFactory(input) {
  if (!input.recipe || !input.recipe.components) return "recipe-missing";
  if (!input.owned || !input.active) return "factory-unavailable";
  if (input.cooldown > 0) return "factory-waiting";
  for (const [resourceType, amount] of Object.entries(input.recipe.components)) {
    if ((input.store[resourceType] || 0) < amount) return "component-shortage";
  }
  if (input.freeCapacity < input.recipe.amount) return "output-full";
  if (input.recipe.level !== undefined) {
    if (input.factoryLevel !== input.recipe.level) return "factory-level-mismatch";
    if (input.operateLevel !== input.recipe.level) return "operate-factory-missing";
  }
  return "ready";
}
const factoryBase = {
  recipe: { components: { energy: 50, X: 10 }, amount: 20 },
  owned: true,
  active: true,
  cooldown: 0,
  store: { energy: 50, X: 10 },
  freeCapacity: 20,
  factoryLevel: null,
  operateLevel: null,
};
for (const [input, expected] of [
  [{ ...factoryBase, recipe: null }, "recipe-missing"],
  [{ ...factoryBase, active: false }, "factory-unavailable"],
  [{ ...factoryBase, cooldown: 1 }, "factory-waiting"],
  [{ ...factoryBase, store: { energy: 49, X: 10 } }, "component-shortage"],
  [{ ...factoryBase, freeCapacity: 19 }, "output-full"],
  [{ ...factoryBase, recipe: { ...factoryBase.recipe, level: 2 }, factoryLevel: 1, operateLevel: 2 }, "factory-level-mismatch"],
  [{ ...factoryBase, recipe: { ...factoryBase.recipe, level: 2 }, factoryLevel: 2, operateLevel: null }, "operate-factory-missing"],
  [{ ...factoryBase, recipe: { ...factoryBase.recipe, level: 2 }, factoryLevel: 2, operateLevel: 2 }, "ready"],
  [factoryBase, "ready"],
]) {
  if (evaluateFactory(input) !== expected) failures.push(`Factory 生产计划失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十一批英文 Lab 与 Factory 检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、27 个离线边界用例。`);
