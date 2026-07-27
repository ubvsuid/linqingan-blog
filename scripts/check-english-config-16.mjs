import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePaths = [
  "src/lib/english-flags-configuration-16.ts",
  "src/lib/english-require-modules-16.ts",
];
const source = articlePaths
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const registry = fs.readFileSync(
  path.join(root, "src/lib/english-config-code-registry-16.ts"),
  "utf8",
);
const aggregate = fs.readFileSync(
  path.join(root, "src/lib/english-config-code-content-16.ts"),
  "utf8",
);
const route = fs.readFileSync(
  path.join(root, "src/app/(en)/en/blog/[slug]/page.tsx"),
  "utf8",
);
const failures = [];
const slugs = [
  "screeps-flags-configuration",
  "screeps-require-modules",
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
  "Game.flags[name]",
  "flag.memory",
  "Game.getObjectById(sourceId)",
  "nearest-visible-fallback",
  "module.exports.loop",
  "module.exports = { run }",
  "cachedHarvesters",
  "getCurrentHarvesters",
  "global reset",
]) {
  if (!source.includes(text)) failures.push(`缺少必备内容：${text}`);
}

for (const input of [source, registry]) {
  const scores = [...input.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
  if (scores.length !== 2 || scores.some((score) => score < 96)) {
    failures.push("评分数量或发布门槛不正确");
  }
}

if (source.includes("screeps-memory-write-safety")) failures.push("第十六批仍包含重复 Memory 页面");
if (registry.includes("screeps-memory-write-safety")) failures.push("第十六批 registry 仍包含重复 Memory 页面");
if (aggregate.includes("englishMemoryWriteSafetyArticle")) failures.push("第十六批聚合器仍导入重复 Memory 页面");
if (!aggregate.includes("englishConfigCodeBatchSixteenArticles")) failures.push("第十六批聚合器缺失");
if (!route.includes("englishConfigCodeBatchSixteenArticles")) failures.push("动态路由未载入第十六批数组");
if (!route.includes("getEnglishConfigCodeBatchSixteenArticle")) failures.push("动态路由未载入第十六批查询函数");
if ((source.match(/[\u3400-\u9fff]/g) ?? []).length > 0) failures.push("英文正文包含中文字符");

const toc = [...source.matchAll(/\["([a-z0-9-]+)", "([^"]+)"\],/g)];
if (toc.length < 24) failures.push(`目录条目不足：${toc.length}`);
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
if (blocks.length < 13) failures.push(`JavaScript 代码块不足：${blocks.length}`);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "en-config-16-"));
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

function readFlag(input) {
  if (!input.present) return "flag-missing";
  if (!["observe", "harvest", "pause"].includes(input.mode)) return "invalid-mode";
  if (input.sourceId !== undefined && typeof input.sourceId !== "string") return "invalid-source-id";
  if (input.mode === "pause") return "mission-paused";
  if (input.configuredTarget) return "configured-id";
  if (!input.roomVisible) return "flag-room-not-visible";
  if (input.fallbackCount <= 0) return "source-not-found";
  return "nearest-visible-fallback";
}
for (const [input, expected] of [
  [{ present: false }, "flag-missing"],
  [{ present: true, mode: "bad" }, "invalid-mode"],
  [{ present: true, mode: "observe", sourceId: 5 }, "invalid-source-id"],
  [{ present: true, mode: "pause" }, "mission-paused"],
  [{ present: true, mode: "harvest", configuredTarget: true }, "configured-id"],
  [{ present: true, mode: "harvest", configuredTarget: false, roomVisible: false }, "flag-room-not-visible"],
  [{ present: true, mode: "harvest", configuredTarget: false, roomVisible: true, fallbackCount: 0 }, "source-not-found"],
  [{ present: true, mode: "harvest", configuredTarget: false, roomVisible: true, fallbackCount: 2 }, "nearest-visible-fallback"],
]) {
  if (readFlag(input) !== expected) failures.push(`Flag 配置状态失败：${expected}`);
}

function chooseFallback(items) {
  return [...items]
    .sort((left, right) => left.range - right.range || left.id.localeCompare(right.id))[0]?.id || null;
}
if (chooseFallback([]) !== null) failures.push("Flag 空回退失败");
if (chooseFallback([{ id: "b", range: 2 }, { id: "a", range: 2 }]) !== "a") failures.push("Flag 稳定回退失败");
if (chooseFallback([{ id: "a", range: 3 }, { id: "b", range: 1 }]) !== "b") failures.push("Flag 距离回退失败");

function validateRoleModules(roleMap) {
  return Object.entries(roleMap)
    .filter(([, roleModule]) => !roleModule || typeof roleModule.run !== "function")
    .map(([roleName]) => roleName);
}
if (validateRoleModules({ harvester: { run() {} } }).length !== 0) failures.push("有效角色模块验证失败");
if (validateRoleModules({ harvester: {} }).join(",") !== "harvester") failures.push("缺少 run 模块验证失败");
if (validateRoleModules({ a: null, b: { run() {} } }).join(",") !== "a") failures.push("空模块验证失败");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}

console.log(`第十六批英文配置与模块检查通过：2 篇、${toc.length} 个目录锚点、${blocks.length} 个 JavaScript 代码块，以及 Flag 与模块边界用例。`);
