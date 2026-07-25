import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const rawPath = path.join(root, "src", "lib", "english-lifecycle-content-4.ts");
const publishedPath = path.join(root, "src", "lib", "english-lifecycle-content-4-published.ts");
const registryPath = path.join(root, "src", "lib", "english-lifecycle-registry-4.ts");
const routePath = path.join(root, "src", "app", "en", "blog", "[slug]", "page.tsx");

const rawSource = fs.readFileSync(rawPath, "utf8");
const publishedSource = fs.readFileSync(publishedPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const routeSource = fs.readFileSync(routePath, "utf8");

const articles = [
  {
    slug: "screeps-renew-creep",
    href: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
  },
  {
    slug: "screeps-recycle-creep",
    href: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
  },
];

const allowedInternalLinks = new Set([
  "/en/blog/screeps-emergency-harvester-recovery",
  "/en/blog/screeps-renew-creep",
  "/en/blog/screeps-recycle-creep",
  "/en/blog/screeps-clean-dead-creep-memory",
  "/en/screeps-errors",
]);

const failures = [];

for (const article of articles) {
  if (!rawSource.includes(`slug: "${article.slug}"`)) {
    failures.push(`正文数据缺少 slug：${article.slug}`);
  }
  if (!rawSource.includes(`path: "${article.href}"`)) {
    failures.push(`正文数据缺少英文路径：${article.href}`);
  }
  if (!rawSource.includes(`chinesePath: "${article.chinesePath}"`)) {
    failures.push(`正文数据缺少中文路径：${article.chinesePath}`);
  }
  if (!registry.includes(`href: "${article.href}"`)) {
    failures.push(`客户端登记缺少：${article.href}`);
  }
  if (!registry.includes(`chinesePath: "${article.chinesePath}"`)) {
    failures.push(`客户端登记缺少中文映射：${article.chinesePath}`);
  }
}

for (const section of [
  "Quick answer",
  "Debugging checklist",
  "Frequently asked questions",
  "Official documentation",
]) {
  const count = rawSource.split(section).length - 1;
  if (count < articles.length) {
    failures.push(`必备章节“${section}”出现 ${count} 次，预期至少 ${articles.length} 次`);
  }
}

for (const [label, input] of [
  ["正文", rawSource],
  ["登记表", registry],
]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== articles.length) {
    failures.push(`${label}评分数量为 ${scores.length}，预期 ${articles.length}`);
  }
  for (const score of scores) {
    if (score < 96) failures.push(`${label}发现低于发布门槛的评分：${score}`);
  }
}

for (const requiredText of [
  "Chinese source article",
  "Reviewed in full",
  "Official docs",
  "JavaScript syntax",
  "Passed",
  "Screeps Console test",
  "Pending",
  "Last verified",
  "TTL floor(600 / body size); Energy ceil(creep cost / 2.5 / body size)",
  "Renewal removes all Boosts and rejects Creeps with CLAIM parts",
  "Up to 100% by remaining life; Energy capped at 125 per body part",
  "Current recycleCreep() docs do not require an idle Spawn or list ERR_BUSY",
]) {
  if (!rawSource.includes(requiredText)) {
    failures.push(`Verification 或官方边界缺少：${requiredText}`);
  }
}

for (const requiredText of [
  "Persistent renewing state keeps the mission active until targetTtl",
  "creep.memory.renewing = true",
  "creep.memory.renewing = false",
  "renewMissionActive !== true",
  "Source correction:",
]) {
  if (!publishedSource.includes(requiredText)) {
    failures.push(`续命发布修正缺少：${requiredText}`);
  }
}

if (!routeSource.includes("englishLifecycleBatchFourArticles")) {
  failures.push("动态路由未载入第四批生命周期文章数组");
}
if (!routeSource.includes("getEnglishLifecycleBatchFourArticle")) {
  failures.push("动态路由未载入第四批生命周期 slug 查询函数");
}

const chineseCharacters = rawSource.match(/[\u3400-\u9fff]/g) ?? [];
if (chineseCharacters.length > 0) {
  failures.push(`英文正文源码仍包含 ${chineseCharacters.length} 个中文字符`);
}

for (const match of rawSource.matchAll(/href="(\/en\/[^"#?]+)"/g)) {
  const href = match[1];
  if (!allowedInternalLinks.has(href)) {
    failures.push(`发现未登记的英文内链：${href}`);
  }
}

const tocPairs = [
  ...rawSource.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length < 30) {
  failures.push(`目录条目只有 ${tocPairs.length} 个，预期至少 30 个`);
}
for (const { id, label } of tocPairs) {
  if (!rawSource.includes(`<h2 id="${id}">`) && !rawSource.includes(`<h3 id="${id}">`)) {
    failures.push(`目录“${label}”找不到正文锚点：${id}`);
  }
}

const codeBlocks = [
  ...rawSource.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (codeBlocks.length < 12) {
  failures.push(`JavaScript 代码块只有 ${codeBlocks.length} 个，预期至少 12 个`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-lifecycle-4-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`JavaScript 代码块 ${index + 1} 语法失败：${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const bodyCosts = {
  move: 50,
  work: 100,
  carry: 50,
  attack: 80,
  ranged_attack: 150,
  heal: 250,
  tough: 10,
  claim: 600,
};

function getRenewStep(body) {
  if (!Array.isArray(body) || body.length === 0) return null;
  const bodyCost = body.reduce((total, part) => total + bodyCosts[part], 0);
  return {
    bodySize: body.length,
    bodyCost,
    addedTicks: Math.floor(600 / body.length),
    energyCost: Math.ceil(bodyCost / 2.5 / body.length),
  };
}

const renewStepCases = [
  [["work", "carry", "move"], { addedTicks: 200, energyCost: 27, bodyCost: 200 }],
  [["work", "work", "carry", "move", "move"], { addedTicks: 120, energyCost: 28, bodyCost: 350 }],
  [["claim", "move"], { addedTicks: 300, energyCost: 130, bodyCost: 650 }],
];
for (const [body, expected] of renewStepCases) {
  const actual = getRenewStep(body);
  for (const key of Object.keys(expected)) {
    if (actual?.[key] !== expected[key]) {
      failures.push(`续命公式离线用例失败：${body.join(",")} ${key}`);
    }
  }
}

function evaluateRenew(input) {
  if (!input.creepExists || !input.spawnExists) return "object-missing";
  if (!input.creepOwned || !input.spawnOwned) return "ownership-invalid";
  if (!input.spawnActive) return "spawn-inactive";
  if (input.creepSpawning) return "creep-spawning";
  if (
    !Number.isFinite(input.ticksToLive)
    || !Number.isFinite(input.renewThreshold)
    || !Number.isFinite(input.targetTtl)
    || input.renewThreshold < 0
    || input.targetTtl <= input.renewThreshold
  ) return "ttl-policy-invalid";
  if (input.ticksToLive >= input.targetTtl) return "target-ttl-reached";
  if (input.renewMissionActive !== true && input.ticksToLive > input.renewThreshold) {
    return "ttl-sufficient";
  }
  if (input.hasClaimPart) return "claim-part-present";
  if (input.boostedPartCount > 0 && input.allowBoostRemoval !== true) {
    return "boost-removal-not-confirmed";
  }
  if (!input.isNearSpawn) return "move-to-spawn";
  if (input.spawnBusy) return "spawn-busy";
  if (!Number.isFinite(input.spawnEnergy) || input.spawnEnergy < input.energyCost) {
    return "spawn-energy-not-enough";
  }
  return "ready";
}

const readyRenew = {
  creepExists: true,
  spawnExists: true,
  creepOwned: true,
  spawnOwned: true,
  spawnActive: true,
  creepSpawning: false,
  ticksToLive: 300,
  renewThreshold: 300,
  targetTtl: 1200,
  renewMissionActive: false,
  hasClaimPart: false,
  boostedPartCount: 0,
  allowBoostRemoval: false,
  isNearSpawn: true,
  spawnBusy: false,
  spawnEnergy: 300,
  energyCost: 27,
};
const renewCases = [
  [{ ...readyRenew, creepExists: false }, "object-missing"],
  [{ ...readyRenew, creepOwned: false }, "ownership-invalid"],
  [{ ...readyRenew, spawnActive: false }, "spawn-inactive"],
  [{ ...readyRenew, creepSpawning: true }, "creep-spawning"],
  [{ ...readyRenew, targetTtl: 200 }, "ttl-policy-invalid"],
  [{ ...readyRenew, ticksToLive: 500, renewMissionActive: false }, "ttl-sufficient"],
  [{ ...readyRenew, ticksToLive: 500, renewMissionActive: true }, "ready"],
  [{ ...readyRenew, ticksToLive: 1200, renewMissionActive: true }, "target-ttl-reached"],
  [{ ...readyRenew, hasClaimPart: true }, "claim-part-present"],
  [{ ...readyRenew, boostedPartCount: 1 }, "boost-removal-not-confirmed"],
  [{ ...readyRenew, isNearSpawn: false }, "move-to-spawn"],
  [{ ...readyRenew, spawnBusy: true }, "spawn-busy"],
  [{ ...readyRenew, spawnEnergy: 26 }, "spawn-energy-not-enough"],
  [readyRenew, "ready"],
];
for (const [input, expected] of renewCases) {
  if (evaluateRenew(input) !== expected) {
    failures.push(`续命决策离线用例失败：${expected}`);
  }
}

function evaluateRecycle(input) {
  if (!input.requestExists || input.enabled !== true) return "request-disabled";
  if (input.confirmed !== true) return "confirmation-required";
  if (!input.spawnExists) return "spawn-missing";
  if (!input.creepExists) return "creep-missing-close";
  if (input.creepSpawning) return "creep-spawning";
  if (!input.spawnOwned || !input.creepOwned) return "ownership-invalid-close";
  if (!input.spawnActive) return "spawn-inactive";
  if (!input.isNearSpawn) return "move-to-spawn";
  return "ready";
}

const readyRecycle = {
  requestExists: true,
  enabled: true,
  confirmed: true,
  spawnExists: true,
  creepExists: true,
  creepSpawning: false,
  spawnOwned: true,
  creepOwned: true,
  spawnActive: true,
  isNearSpawn: true,
};
const recycleCases = [
  [{ ...readyRecycle, requestExists: false }, "request-disabled"],
  [{ ...readyRecycle, confirmed: false }, "confirmation-required"],
  [{ ...readyRecycle, spawnExists: false }, "spawn-missing"],
  [{ ...readyRecycle, creepExists: false }, "creep-missing-close"],
  [{ ...readyRecycle, creepSpawning: true }, "creep-spawning"],
  [{ ...readyRecycle, spawnOwned: false }, "ownership-invalid-close"],
  [{ ...readyRecycle, spawnActive: false }, "spawn-inactive"],
  [{ ...readyRecycle, isNearSpawn: false }, "move-to-spawn"],
  [readyRecycle, "ready"],
];
for (const [input, expected] of recycleCases) {
  if (evaluateRecycle(input) !== expected) {
    failures.push(`回收决策离线用例失败：${expected}`);
  }
}

const recycleArticleStart = rawSource.indexOf('slug: "screeps-recycle-creep"');
const recycleSource = recycleArticleStart >= 0
  ? rawSource.slice(recycleArticleStart)
  : "";
if (recycleSource.includes("if (spawn.spawning)")) {
  failures.push("回收文章不应套用 renewCreep() 的 Spawn 忙碌前置条件");
}
if (recycleSource.includes("creep.suicide();")) {
  failures.push("回收文章不应自动调用 creep.suicide()" );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第四批生命周期英文专题质量检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第四批生命周期英文专题质量检查通过：${articles.length} 篇文章，${tocPairs.length} 个目录锚点，${codeBlocks.length} 个 JavaScript 代码块，${renewStepCases.length + renewCases.length + recycleCases.length} 个离线边界用例。`,
);
