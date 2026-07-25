import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentPath = path.join(root, "src", "lib", "english-spawn-content-3.ts");
const publishedPath = path.join(root, "src", "lib", "english-spawn-content-3-published.ts");
const registryPath = path.join(root, "src", "lib", "english-spawn-registry-3.ts");
const routePath = path.join(root, "src", "app", "en", "blog", "[slug]", "page.tsx");

const rawSource = fs.readFileSync(contentPath, "utf8");
const publishedSource = fs.readFileSync(publishedPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const routeSource = fs.readFileSync(routePath, "utf8");

const invalidInfinityCheck = `    || !Number.isFinite(maximumUnits)\n    || maximumUnits < 0`;
const validInfinityCheck = `    || (\n      maximumUnits !== Infinity\n      && !Number.isFinite(maximumUnits)\n    )\n    || maximumUnits < 0`;
const source = rawSource.replace(invalidInfinityCheck, validInfinityCheck);

const articles = [
  {
    slug: "screeps-spawncreep-return-codes",
    href: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
  },
  {
    slug: "screeps-dynamic-creep-body",
    href: "/en/blog/screeps-dynamic-creep-body",
    chinesePath: "/blog/screeps-dynamic-creep-body-energy",
  },
  {
    slug: "screeps-emergency-harvester-recovery",
    href: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
  },
];

const allowedInternalLinks = new Set([
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-clean-dead-creep-memory",
  "/en/blog/screeps-spawncreep-return-codes",
  "/en/blog/screeps-dynamic-creep-body",
  "/en/blog/screeps-emergency-harvester-recovery",
  "/en/screeps-errors",
]);

const failures = [];

for (const article of articles) {
  for (const [label, text] of [
    ["slug", `slug: "${article.slug}"`],
    ["英文路径", `path: "${article.href}"`],
    ["中文映射", `chinesePath: "${article.chinesePath}"`],
  ]) {
    if (!source.includes(text)) {
      failures.push(`${article.slug}: 正文数据缺少${label}`);
    }
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
  const count = source.split(section).length - 1;
  if (count < articles.length) {
    failures.push(`必备章节“${section}”出现 ${count} 次，预期至少 ${articles.length} 次`);
  }
}

for (const [label, input] of [
  ["正文", source],
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
  "dryRun checks current conditions but does not start spawning",
  "Body builder chooses a valid body; spawn timing remains a separate decision",
  "Initial Spawn 1-Energy refill is special and not assumed for ordinary rooms",
]) {
  if (!source.includes(requiredText)) {
    failures.push(`Verification 或边界说明缺少：${requiredText}`);
  }
}

if (!publishedSource.includes("validInfinityCheck")) {
  failures.push("发布模块缺少 Infinity 边界修正");
}
if (!publishedSource.includes("articleHtml.replace")) {
  failures.push("发布模块未把修正应用到正文 HTML");
}
if (!routeSource.includes("englishSpawnBatchThreeArticles")) {
  failures.push("动态路由未载入第三批文章数组");
}
if (!routeSource.includes("getEnglishSpawnBatchThreeArticle")) {
  failures.push("动态路由未载入第三批 slug 查询函数");
}

const chineseCharacters = source.match(/[\u3400-\u9fff]/g) ?? [];
if (chineseCharacters.length > 0) {
  failures.push(`英文正文源码仍包含 ${chineseCharacters.length} 个中文字符`);
}

for (const match of source.matchAll(/href="(\/en\/[^"#?]+)"/g)) {
  const href = match[1];
  if (!allowedInternalLinks.has(href)) {
    failures.push(`发现未登记的英文内链：${href}`);
  }
}

const tocPairs = [
  ...source.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length < 40) {
  failures.push(`目录条目只有 ${tocPairs.length} 个，预期至少 40 个`);
}
for (const { id, label } of tocPairs) {
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`目录“${label}”找不到正文锚点：${id}`);
  }
}

const codeBlocks = [
  ...source.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (codeBlocks.length < 15) {
  failures.push(`JavaScript 代码块只有 ${codeBlocks.length} 个，预期至少 15 个`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-spawn-3-"));
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

const costs = {
  move: 50,
  work: 100,
  carry: 50,
};
function getBodyCost(body) {
  return body.reduce((total, part) => total + costs[part], 0);
}
function buildRepeatedBody({
  energyAvailable,
  unit,
  maximumParts = 50,
  maximumUnits = Infinity,
}) {
  if (
    !Number.isFinite(energyAvailable)
    || energyAvailable < 0
    || !Array.isArray(unit)
    || unit.length === 0
    || !Number.isInteger(maximumParts)
    || maximumParts < 1
    || (
      maximumUnits !== Infinity
      && !Number.isFinite(maximumUnits)
    )
    || maximumUnits < 0
  ) {
    return { valid: false, body: [] };
  }
  const unitCost = getBodyCost(unit);
  const units = Math.max(
    0,
    Math.min(
      Math.floor(energyAvailable / unitCost),
      Math.floor(maximumParts / unit.length),
      Math.floor(maximumUnits),
    ),
  );
  return {
    valid: true,
    units,
    body: Array.from({ length: units }, () => unit).flat(),
    bodyCost: units * unitCost,
    spawnTime: units * unit.length * 3,
  };
}

const unit = ["work", "carry", "move"];
const bodyCases = [
  [0, 0, 0],
  [199, 0, 0],
  [200, 1, 200],
  [550, 2, 400],
  [3200, 16, 3200],
  [10000, 16, 3200],
];
for (const [energy, expectedUnits, expectedCost] of bodyCases) {
  const plan = buildRepeatedBody({ energyAvailable: energy, unit });
  if (!plan.valid || plan.units !== expectedUnits || plan.bodyCost !== expectedCost) {
    failures.push(`动态身体离线用例失败：Energy=${energy}`);
  }
  if (plan.body.length > 50) {
    failures.push(`动态身体超过 50 部件：Energy=${energy}`);
  }
}
const cappedPlan = buildRepeatedBody({
  energyAvailable: 3200,
  unit,
  maximumUnits: 5,
});
if (cappedPlan.units !== 5 || cappedPlan.body.length !== 15) {
  failures.push("角色最大组数离线用例失败");
}

function evaluateEmergencyRecovery(input) {
  if (!input.roomExists) return "room-missing";
  if (input.harvesterCount > 0) return "harvester-exists";
  if (input.availableSpawnCount < 1) return "spawn-unavailable";
  if (input.energyAvailable < input.minimumCost) return "energy-not-enough";
  if (input.dryRunResult !== 0) return "dry-run-failed";
  return "ready";
}
const emergencyCases = [
  [{ roomExists: false, harvesterCount: 0, availableSpawnCount: 1, energyAvailable: 300, minimumCost: 200, dryRunResult: 0 }, "room-missing"],
  [{ roomExists: true, harvesterCount: 1, availableSpawnCount: 1, energyAvailable: 300, minimumCost: 200, dryRunResult: 0 }, "harvester-exists"],
  [{ roomExists: true, harvesterCount: 0, availableSpawnCount: 0, energyAvailable: 300, minimumCost: 200, dryRunResult: 0 }, "spawn-unavailable"],
  [{ roomExists: true, harvesterCount: 0, availableSpawnCount: 2, energyAvailable: 199, minimumCost: 200, dryRunResult: 0 }, "energy-not-enough"],
  [{ roomExists: true, harvesterCount: 0, availableSpawnCount: 2, energyAvailable: 200, minimumCost: 200, dryRunResult: -4 }, "dry-run-failed"],
  [{ roomExists: true, harvesterCount: 0, availableSpawnCount: 2, energyAvailable: 200, minimumCost: 200, dryRunResult: 0 }, "ready"],
];
for (const [input, expected] of emergencyCases) {
  if (evaluateEmergencyRecovery(input) !== expected) {
    failures.push(`应急恢复离线用例失败：${expected}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第三批 Spawn 英文专题质量检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第三批 Spawn 英文专题质量检查通过：${articles.length} 篇文章，${tocPairs.length} 个目录锚点，${codeBlocks.length} 个 JavaScript 代码块，${bodyCases.length + emergencyCases.length + 1} 个离线边界用例。`,
);
