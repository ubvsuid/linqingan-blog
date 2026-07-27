import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const contentPath = path.join(root, "src", "lib", "english-foundation-content-2.ts");
const registryPath = path.join(root, "src", "lib", "english-foundation-registry-2.ts");
const routePath = path.join(root, "src", "app", "(en)", "en", "blog", "[slug]", "page.tsx");
const componentPath = path.join(root, "src", "components", "english-article-page.tsx");

const source = fs.readFileSync(contentPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const routeSource = fs.readFileSync(routePath, "utf8");
const componentSource = fs.readFileSync(componentPath, "utf8");

const articles = [
  {
    slug: "screeps-working-state",
    href: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
  },
  {
    slug: "screeps-get-object-by-id",
    href: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
  },
  {
    slug: "screeps-clean-dead-creep-memory",
    href: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
  },
];

const requiredSections = [
  "Quick answer",
  "Debugging checklist",
  "Frequently asked questions",
  "Official documentation",
];

const allowedInternalLinks = new Set([
  "/en/blog/screeps-memory-basics",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-pickup-dropped-energy",
  "/en/blog/screeps-working-state",
  "/en/blog/screeps-get-object-by-id",
  "/en/blog/screeps-clean-dead-creep-memory",
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
    failures.push(`正文数据缺少中文映射：${article.chinesePath}`);
  }
  if (!registry.includes(`href: "${article.href}"`)) {
    failures.push(`客户端登记缺少英文路径：${article.href}`);
  }
  if (!registry.includes(`chinesePath: "${article.chinesePath}"`)) {
    failures.push(`客户端登记缺少中文路径：${article.chinesePath}`);
  }
}

for (const section of requiredSections) {
  const count = source.split(section).length - 1;
  if (count < articles.length) {
    failures.push(`必备章节“${section}”出现 ${count} 次，预期至少 ${articles.length} 次`);
  }
}

const contentScores = [...source.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
const registryScores = [...registry.matchAll(/finalScore:\s*(\d+)/g)].map((match) => Number(match[1]));
for (const [label, scores] of [
  ["正文", contentScores],
  ["登记表", registryScores],
]) {
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
  "Current harvest() docs do not list ERR_FULL",
]) {
  if (!source.includes(requiredText)) {
    failures.push(`Verification 或事实修正缺少：${requiredText}`);
  }
}

if (!routeSource.includes("englishFoundationBatchTwoArticles")) {
  failures.push("动态英文文章路由未载入第二批文章数组");
}
if (!routeSource.includes("getEnglishFoundationBatchTwoArticle")) {
  failures.push("动态英文文章路由未载入第二批 slug 查询函数");
}
if (!componentSource.includes("normalizeTocItem")) {
  failures.push("英文文章组件缺少目录元组规范化逻辑");
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

if (tocPairs.length < 35) {
  failures.push(`目录条目只有 ${tocPairs.length} 个，预期至少 35 个`);
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

if (codeBlocks.length < 12) {
  failures.push(`JavaScript 代码块只有 ${codeBlocks.length} 个，预期至少 12 个`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "english-foundation-2-"));
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

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第二批英文专题质量检查失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第二批英文专题质量检查通过：${articles.length} 篇文章，${tocPairs.length} 个目录锚点，${codeBlocks.length} 个 JavaScript 代码块。`,
);
