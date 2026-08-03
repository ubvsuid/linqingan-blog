import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const overridePath = path.join(
  root,
  "src/lib/english-editorial-defense-mineral-power-20260803.ts",
);
const source = fs.readFileSync(overridePath, "utf8");
const published = fs.readFileSync(
  path.join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const defenseRegistry = fs.readFileSync(
  path.join(root, "src/lib/english-defense-operations-registry-17.ts"),
  "utf8",
);
const resourceRegistry = fs.readFileSync(
  path.join(root, "src/lib/english-mineral-storage-power-registry-12.ts"),
  "utf8",
);
const failures = [];

const slugs = [
  "screeps-wall-rampart-repair-limit",
  "screeps-mineral-extractor-harvest",
  "screeps-power-spawn-process-power",
];

for (const slug of slugs) {
  if (!defenseRegistry.includes(`/en/blog/${slug}`) && !resourceRegistry.includes(`/en/blog/${slug}`)) {
    failures.push(`登记缺少 ${slug}`);
  }
}
if (!published.includes("englishEditorialDefenseMineralPowerOverrides20260803")) {
  failures.push("发布聚合器未接入本批覆盖稿");
}

for (const required of [
  "EVENT_REPAIR",
  "event.objectId === pending.creepId",
  "event.data?.targetId === pending.targetId",
  "Memory.pendingFortificationRepairs",
  "EVENT_HARVEST",
  "event.data?.targetId === pending.mineralId",
  "Memory.pendingMineralHarvests",
  "does not currently create a Room event",
  "already-submitted-this-tick",
  "local-signature-matches",
  "transfer-confounded",
  "Memory.pendingPowerProcessing",
  "Screeps Console test",
  "Live multi-tick verification",
  "Genuine room or Console screenshots",
  "Pending",
  "updatedAt: \"2026-08-03\"",
]) {
  if (!source.includes(required)) failures.push(`覆盖稿缺少：${required}`);
}

if ((source.match(/finalScore:\s*98/g) ?? []).length !== 3) {
  failures.push("本批必须保持3篇98分内部门禁");
}
if ((source.match(/faq:\s*\[\]/g) ?? []).length !== 3) {
  failures.push("本批3篇必须移除FAQ输出");
}
for (const phrase of [
  "In today's fast-paced world",
  "In this comprehensive guide",
  "Let's dive in",
  "Unlock the power of",
  "Game-changing",
]) {
  if (source.includes(phrase)) failures.push(`发现AI模板短语：${phrase}`);
}

const blocks = [...source.matchAll(
  /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
)].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (blocks.length < 14) failures.push(`JavaScript代码块不足：${blocks.length}`);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "editorial-dmp-"));
try {
  blocks.forEach((code, index) => {
    const file = path.join(temp, `${index}.js`);
    fs.writeFileSync(file, code);
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`代码块${index + 1}语法失败：${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

function exactEvent(events, type, actorId, targetId) {
  const matches = events.filter((event) =>
    event.event === type
    && event.objectId === actorId
    && event.data?.targetId === targetId
  );
  if (matches.length === 0) return "missing";
  if (matches.length > 1) return "ambiguous";
  return "observed";
}
const events = [
  { event: "repair", objectId: "repairer-a", data: { targetId: "wall-a" } },
  { event: "harvest", objectId: "miner-a", data: { targetId: "mineral-a" } },
];
if (exactEvent(events, "repair", "repairer-a", "wall-a") !== "observed") {
  failures.push("Repair精确身份用例失败");
}
if (exactEvent(events, "repair", "repairer-b", "wall-a") !== "missing") {
  failures.push("Repair错误执行者用例失败");
}
if (exactEvent(events, "harvest", "miner-a", "mineral-a") !== "observed") {
  failures.push("Mineral精确身份用例失败");
}

function powerSignature(before, now, powerAmount, energyAmount) {
  return now.power === before.power - powerAmount
    && now.energy === before.energy - energyAmount;
}
if (!powerSignature(
  { power: 10, energy: 1000 },
  { power: 8, energy: 900 },
  2,
  100,
)) failures.push("Power本地签名成功用例失败");
if (powerSignature(
  { power: 10, energy: 1000 },
  { power: 9, energy: 950 },
  2,
  100,
)) failures.push("Power本地签名不匹配用例失败");

function transferConfounded(events, powerSpawnId) {
  return events.some((event) =>
    event.event === "transfer"
    && (event.objectId === powerSpawnId || event.data?.targetId === powerSpawnId)
    && ["energy", "power"].includes(event.data?.resourceType)
  );
}
if (!transferConfounded([
  {
    event: "transfer",
    objectId: "hauler-a",
    data: { targetId: "power-spawn-a", resourceType: "energy" },
  },
], "power-spawn-a")) failures.push("Power transfer干扰用例失败");
if (transferConfounded([], "power-spawn-a")) {
  failures.push("Power无干扰用例失败");
}

for (const registry of [defenseRegistry, resourceRegistry]) {
  if (!registry.includes('updatedAt: "2026-08-03"')) {
    failures.push("注册元数据缺少本批修改日期");
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(
  `Fortification, Mineral, and Power editorial gate passed: 3 existing routes, ${blocks.length} JavaScript blocks, exact Repair and Harvest identity, explicit processPower evidence limits, Pending live evidence, and 98-point internal scores.`,
);
