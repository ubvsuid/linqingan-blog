import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import os from "node:os";

const sourcePath = path.join(
  process.cwd(),
  "src",
  "lib",
  "english-foundation-content.ts",
);
const componentPath = path.join(
  process.cwd(),
  "src",
  "components",
  "english-article-page.tsx",
);
const source = fs.readFileSync(sourcePath, "utf8");
const componentSource = fs.readFileSync(componentPath, "utf8");

const requiredSlugs = [
  "screeps-memory-basics",
  "screeps-withdraw-container-energy",
  "screeps-pickup-dropped-energy",
];

const requiredSections = [
  "Quick answer",
  "Debugging checklist",
  "Frequently asked questions",
  "Official documentation",
];

const allowedInternalLinks = new Set([
  "/en/blog/screeps-remove-construction-site",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-memory-basics",
  "/en/blog/screeps-withdraw-container-energy",
  "/en/blog/screeps-pickup-dropped-energy",
  "/en/screeps-errors",
]);

const failures = [];

for (const slug of requiredSlugs) {
  if (!source.includes(`slug: "${slug}"`)) {
    failures.push(`缺少英文专题文章 slug：${slug}`);
  }
}

for (const section of requiredSections) {
  const count = source.split(section).length - 1;
  if (count < requiredSlugs.length) {
    failures.push(`必备章节“${section}”出现 ${count} 次，预期至少 ${requiredSlugs.length} 次`);
  }
}

const scores = [...source.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
if (scores.length !== requiredSlugs.length) {
  failures.push(`文章评分数量为 ${scores.length}，预期 ${requiredSlugs.length}`);
}
for (const score of scores) {
  if (score < 96) failures.push(`发现低于发布门槛的评分：${score}`);
}

for (const requiredText of [
  "Chinese source article",
  "Official docs",
  "JavaScript syntax",
  "Screeps Console test",
  "Pending",
  "Last verified",
]) {
  if (!source.includes(requiredText)) {
    failures.push(`Verification 缺少字段或状态：${requiredText}`);
  }
}

const chineseBodyMatches = source.match(/[\u3400-\u9fff]/g) ?? [];
if (chineseBodyMatches.length > 0) {
  failures.push(`英文专题源码仍包含 ${chineseBodyMatches.length} 个中文字符`);
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

if (tocPairs.length < 30) {
  failures.push(`目录条目只有 ${tocPairs.length} 个，预期至少 30 个`);
}

for (const { id, label } of tocPairs) {
  if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
    failures.push(`目录“${label}”找不到正文锚点：${id}`);
  }
}

if (
  !componentSource.includes("normalizeTocItem")
  || !componentSource.includes("headingIdPattern")
) {
  failures.push("英文文章组件缺少目录元组规范化逻辑");
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

if (codeBlocks.length < 10) {
  failures.push(`JavaScript 代码块只有 ${codeBlocks.length} 个，预期至少 10 个`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-foundation-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `JavaScript 代码块 ${index + 1} 语法失败：${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n英文专题质量检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `英文专题质量检查通过：${requiredSlugs.length} 篇文章，${tocPairs.length} 个目录锚点，${codeBlocks.length} 个 JavaScript 代码块。`,
);
