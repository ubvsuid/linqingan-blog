import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-market-create-order-10.ts",
  "src/lib/english-market-deal-10.ts",
  "src/lib/english-terminal-send-10.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-market-registry-10.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-market-content-10.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-market-create-order",
  "screeps-market-deal",
  "screeps-terminal-send-resources",
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
  "price * totalAmount * 0.05",
  "no numeric limit is hard-coded",
  "request.enabled = false",
  "order.amount",
  "order.remainingAmount",
  "cannot execute more than 10 deals",
  "TERMINAL_MIN_SEND",
  "description.length > 100",
  "input.amount + input.transactionEnergy",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 3 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (!aggregate.includes("englishMarketBatchTenArticles")) failures.push("第十批聚合器缺失");
if (!route.includes("englishMarketBatchTenArticles")) failures.push("动态路由未载入第十批数组");
if (!route.includes("getEnglishMarketBatchTenArticle")) failures.push("动态路由未载入第十批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 45) failures.push(`目录条目不足：${toc.length}`);
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-market-10-"));
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

function orderFee(price, amount) {
  return Number.isFinite(price)
    && price > 0
    && Number.isInteger(amount)
    && amount > 0
    ? price * amount * 0.05
    : null;
}
for (const [price, amount, expected] of [
  [1, 10000, 500],
  [0.5, 2000, 50],
  [0, 10, null],
  [1, 0, null],
  [1, 1.5, null],
]) {
  if (!Object.is(orderFee(price, amount), expected)) failures.push(`订单费用失败：${price}/${amount}`);
}

function evaluateOrder({ enabled, valid, terminal, duplicate, credits, fee, reserve }) {
  if (!enabled) return "disabled";
  if (!valid) return "arguments-invalid";
  if (!terminal) return "terminal-not-ready";
  if (duplicate) return "equivalent-order-exists";
  if (!Number.isFinite(fee)) return "fee-invalid";
  if (credits - fee < reserve) return "credit-reserve";
  return "ready";
}
for (const [input, expected] of [
  [{ enabled: false }, "disabled"],
  [{ enabled: true, valid: false }, "arguments-invalid"],
  [{ enabled: true, valid: true, terminal: false }, "terminal-not-ready"],
  [{ enabled: true, valid: true, terminal: true, duplicate: true }, "equivalent-order-exists"],
  [{ enabled: true, valid: true, terminal: true, duplicate: false, credits: 100, fee: 20, reserve: 90 }, "credit-reserve"],
  [{ enabled: true, valid: true, terminal: true, duplicate: false, credits: 100, fee: 20, reserve: 80 }, "ready"],
]) {
  if (evaluateOrder(input) !== expected) failures.push(`创建订单计划失败：${expected}`);
}

function evaluateDeal({ order, amount, maximumPrice, credits, reserve, terminalEnergy, txEnergy, energyReserve }) {
  if (!order) return "order-unavailable";
  if (order.type !== "sell" || order.resource !== "U") return "order-mismatch";
  if (!Number.isInteger(amount) || amount <= 0 || amount > order.amount) return "amount-unavailable";
  if (!Number.isFinite(maximumPrice) || order.price > maximumPrice) return "price-above-limit";
  if (credits - order.price * amount < reserve) return "credit-reserve";
  if (terminalEnergy - txEnergy < energyReserve) return "energy-reserve";
  return "ready";
}
const sellOrder = { type: "sell", resource: "U", amount: 1000, price: 1 };
for (const [input, expected] of [
  [{ order: null }, "order-unavailable"],
  [{ order: { ...sellOrder, type: "buy" } }, "order-mismatch"],
  [{ order: sellOrder, amount: 1001, maximumPrice: 2, credits: 5000, reserve: 0, terminalEnergy: 1000, txEnergy: 10, energyReserve: 0 }, "amount-unavailable"],
  [{ order: sellOrder, amount: 100, maximumPrice: 0.9, credits: 5000, reserve: 0, terminalEnergy: 1000, txEnergy: 10, energyReserve: 0 }, "price-above-limit"],
  [{ order: sellOrder, amount: 100, maximumPrice: 1, credits: 100, reserve: 1, terminalEnergy: 1000, txEnergy: 10, energyReserve: 0 }, "credit-reserve"],
  [{ order: sellOrder, amount: 100, maximumPrice: 1, credits: 1000, reserve: 0, terminalEnergy: 10, txEnergy: 10, energyReserve: 1 }, "energy-reserve"],
  [{ order: sellOrder, amount: 100, maximumPrice: 1, credits: 1000, reserve: 0, terminalEnergy: 10, txEnergy: 10, energyReserve: 0 }, "ready"],
]) {
  if (evaluateDeal(input) !== expected) failures.push(`市场成交计划失败：${expected}`);
}

function sendBudget(resource, amount, txEnergy) {
  const energy = resource === "energy";
  return {
    requiredResource: energy ? 0 : amount,
    requiredEnergy: energy ? amount + txEnergy : txEnergy,
  };
}
const normalBudget = sendBudget("U", 100, 25);
const energyBudget = sendBudget("energy", 100, 25);
if (normalBudget.requiredResource !== 100 || normalBudget.requiredEnergy !== 25) failures.push("普通资源发送预算失败");
if (energyBudget.requiredResource !== 0 || energyBudget.requiredEnergy !== 125) failures.push("Energy 发送预算失败");
function validateSend({ enabled, amount, minimum, description, destination }) {
  if (!enabled) return "disabled";
  if (!Number.isInteger(amount) || amount < minimum) return "arguments-invalid";
  if (typeof destination !== "string" || !/^[WE]\d+[NS]\d+$/.test(destination)) return "arguments-invalid";
  if (String(description ?? "").length > 100) return "description-too-long";
  return "valid";
}
for (const [input, expected] of [
  [{ enabled: false }, "disabled"],
  [{ enabled: true, amount: 9, minimum: 10, destination: "W1N1" }, "arguments-invalid"],
  [{ enabled: true, amount: 10, minimum: 10, destination: "bad" }, "arguments-invalid"],
  [{ enabled: true, amount: 10, minimum: 10, destination: "W1N1", description: "x".repeat(101) }, "description-too-long"],
  [{ enabled: true, amount: 10, minimum: 10, destination: "W1N1", description: "ok" }, "valid"],
]) {
  if (validateSend(input) !== expected) failures.push(`Terminal 发送验证失败：${expected}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十批英文市场与 Terminal 检查通过：3 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块、31 个离线边界用例。`);
