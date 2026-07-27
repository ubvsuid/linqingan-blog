import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentPath = path.join(root, "src", "lib", "english-movement-content-5.ts");
const registryPath = path.join(root, "src", "lib", "english-movement-registry-5.ts");
const routePath = path.join(root, "src", "app", "(en)", "en", "blog", "[slug]", "page.tsx");

const source = fs.readFileSync(contentPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const routeSource = fs.readFileSync(routePath, "utf8");

const articles = [
  {
    slug: "screeps-err-not-in-range",
    href: "/en/blog/screeps-err-not-in-range",
    chinesePath: "/blog/screeps-err-not-in-range",
  },
  {
    slug: "screeps-moveto-not-moving",
    href: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
  },
  {
    slug: "screeps-err-no-path",
    href: "/en/blog/screeps-err-no-path",
    chinesePath: "/blog/screeps-err-no-path",
  },
];

const allowedInternalLinks = new Set([
  "/en/blog/screeps-recycle-creep",
  "/en/blog/screeps-err-not-in-range",
  "/en/blog/screeps-moveto-not-moving",
  "/en/blog/screeps-err-no-path",
  "/en/blog/screeps-get-object-by-id",
  "/en/screeps-errors",
]);

const failures = [];

for (const article of articles) {
  if (!source.includes(`slug: "${article.slug}"`)) {
    failures.push(`正文数据缺少 slug：${article.slug}`);
  }
  if (!source.includes(`path: "${article.href}"`)) {
    failures.push(`正文数据缺少英文路径：${article.href}`);
  }
  if (!source.includes(`chinesePath: "${article.chinesePath}"`)) {
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
  "Current moveTo() return table does not list ERR_NO_BODYPART",
  "Owned or public Ramparts remain walkable in the diagnostic CostMatrix",
  "ERR_NO_PATH, cached-path ERR_NOT_FOUND and incomplete searches are separated",
]) {
  if (!source.includes(requiredText)) {
    failures.push(`Verification 或源文修正缺少：${requiredText}`);
  }
}

if (!routeSource.includes("englishMovementBatchFiveArticles")) {
  failures.push("动态路由未载入第五批移动文章数组");
}
if (!routeSource.includes("getEnglishMovementBatchFiveArticle")) {
  failures.push("动态路由未载入第五批移动 slug 查询函数");
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

if (source.includes("<td><code>ERR_NO_BODYPART</code></td>")) {
  failures.push("移动返回值表不应把 ERR_NO_BODYPART 列为 moveTo() 返回值");
}
if (!source.includes("structure.my === true") || !source.includes("structure.isPublic === true")) {
  failures.push("CostMatrix 示例缺少 owned OR public Rampart 通行条件");
}
if (!source.includes("structure.my || structure.isPublic")) {
  failures.push("完整 PathFinder 示例缺少简化的 owned OR public Rampart 条件");
}
if (source.includes("!structure.my\n      || !structure.isPublic")) {
  failures.push("仍存在会封锁己方私有 Rampart 的旧条件");
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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-movement-5-"));
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

function classifyActionRange(input) {
  if (!input.creepExists) return "creep-missing";
  if (!input.targetExists) return "target-missing";
  if (input.actionResult !== -9) return "do-not-move";
  if (input.activeMoveParts <= 0) return "no-active-move-part";
  return input.desiredRange === 1 || input.desiredRange === 3
    ? "move"
    : "range-invalid";
}

const actionCases = [
  [{ creepExists: false, targetExists: true, actionResult: -9, activeMoveParts: 1, desiredRange: 1 }, "creep-missing"],
  [{ creepExists: true, targetExists: false, actionResult: -9, activeMoveParts: 1, desiredRange: 1 }, "target-missing"],
  [{ creepExists: true, targetExists: true, actionResult: -6, activeMoveParts: 1, desiredRange: 1 }, "do-not-move"],
  [{ creepExists: true, targetExists: true, actionResult: -9, activeMoveParts: 0, desiredRange: 1 }, "no-active-move-part"],
  [{ creepExists: true, targetExists: true, actionResult: -9, activeMoveParts: 1, desiredRange: 2 }, "range-invalid"],
  [{ creepExists: true, targetExists: true, actionResult: -9, activeMoveParts: 1, desiredRange: 1 }, "move"],
  [{ creepExists: true, targetExists: true, actionResult: -9, activeMoveParts: 1, desiredRange: 3 }, "move"],
];
for (const [input, expected] of actionCases) {
  if (classifyActionRange(input) !== expected) {
    failures.push(`动作距离离线用例失败：${expected}`);
  }
}

function evaluateMoveProgress(input) {
  if (!input.creepExists) return "creep-missing";
  if (!input.targetValid) return "target-invalid";
  if (input.creepSpawning) return "creep-spawning";
  if (input.activeMoveParts <= 0) return "no-active-move-part";
  if (input.fatigue > 0) return "creep-tired";
  if (input.currentRange !== null && input.currentRange <= input.desiredRange) {
    return "already-in-range";
  }
  if (input.moveResult !== 0) return "move-call-failed";
  if (input.unchangedTicks >= 3) return "accepted-no-progress";
  return "move-submitted";
}

const progressCases = [
  [{ creepExists: false, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 0 }, "creep-missing"],
  [{ creepExists: true, targetValid: false, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 0 }, "target-invalid"],
  [{ creepExists: true, targetValid: true, creepSpawning: true, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 0 }, "creep-spawning"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 0, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 0 }, "no-active-move-part"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 3, currentRange: 4, desiredRange: 1, moveResult: -11, unchangedTicks: 0 }, "creep-tired"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 1, desiredRange: 1, moveResult: 0, unchangedTicks: 0 }, "already-in-range"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: -2, unchangedTicks: 0 }, "move-call-failed"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 3 }, "accepted-no-progress"],
  [{ creepExists: true, targetValid: true, creepSpawning: false, activeMoveParts: 1, fatigue: 0, currentRange: 4, desiredRange: 1, moveResult: 0, unchangedTicks: 1 }, "move-submitted"],
];
for (const [input, expected] of progressCases) {
  if (evaluateMoveProgress(input) !== expected) {
    failures.push(`移动进度离线用例失败：${expected}`);
  }
}

function classifyPath(input) {
  if (!input.targetExists || !input.targetHasPosition) return "target-invalid";
  if (!Number.isInteger(input.desiredRange) || input.desiredRange < 0) return "range-invalid";
  if (input.alreadyInRange) return "already-in-range";
  if (input.callbackRejectedRoom) return "callback-rejected-room";
  if (input.moveResult === -5) return "cached-path-missing";
  if (input.moveResult === -2) return "move-no-path";
  if (input.pathIncomplete) return "pathfinder-incomplete";
  if (!Number.isInteger(input.pathLength) || input.pathLength <= 0) {
    return "path-empty-out-of-range";
  }
  return "path-available";
}

const pathBase = {
  targetExists: true,
  targetHasPosition: true,
  desiredRange: 1,
  alreadyInRange: false,
  callbackRejectedRoom: false,
  moveResult: 0,
  pathIncomplete: false,
  pathLength: 5,
};
const pathCases = [
  [{ ...pathBase, targetExists: false }, "target-invalid"],
  [{ ...pathBase, desiredRange: -1 }, "range-invalid"],
  [{ ...pathBase, alreadyInRange: true, pathLength: 0 }, "already-in-range"],
  [{ ...pathBase, callbackRejectedRoom: true }, "callback-rejected-room"],
  [{ ...pathBase, moveResult: -5 }, "cached-path-missing"],
  [{ ...pathBase, moveResult: -2 }, "move-no-path"],
  [{ ...pathBase, pathIncomplete: true }, "pathfinder-incomplete"],
  [{ ...pathBase, pathLength: 0 }, "path-empty-out-of-range"],
  [pathBase, "path-available"],
];
for (const [input, expected] of pathCases) {
  if (classifyPath(input) !== expected) {
    failures.push(`寻路分类离线用例失败：${expected}`);
  }
}

function isWalkableStructure(structure) {
  return structure.type === "container"
    || (
      structure.type === "rampart"
      && (structure.my === true || structure.isPublic === true)
    )
    || structure.type === "road";
}
const walkabilityCases = [
  [{ type: "road", my: false, isPublic: false }, true],
  [{ type: "container", my: false, isPublic: false }, true],
  [{ type: "rampart", my: true, isPublic: false }, true],
  [{ type: "rampart", my: false, isPublic: true }, true],
  [{ type: "rampart", my: false, isPublic: false }, false],
  [{ type: "spawn", my: true, isPublic: false }, false],
];
for (const [structure, expected] of walkabilityCases) {
  if (isWalkableStructure(structure) !== expected) {
    failures.push(`CostMatrix 通行性用例失败：${JSON.stringify(structure)}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第五批移动英文专题质量检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第五批移动英文专题质量检查通过：${articles.length} 篇文章，${tocPairs.length} 个目录锚点，${codeBlocks.length} 个 JavaScript 代码块，${actionCases.length + progressCases.length + pathCases.length + walkabilityCases.length} 个离线边界用例。`,
);
