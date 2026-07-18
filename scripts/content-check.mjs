import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const beginnerSeriesPath = path.join(root, "src", "lib", "beginner-series.ts");
const sitePath = path.join(root, "src", "lib", "site.ts");
const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

const files = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();

const slugs = new Set();
const titles = new Map();
const knownRoutes = new Set([
  "/",
  "/about",
  "/beginner",
  "/blog",
  "/knowledge",
  "/resources",
  "/search",
  "/glossary",
  "/screeps-errors",
  "/tags",
  "/projects",
  "/now",
  "/feed.xml",
]);

for (const fileName of files) {
  const slug = fileName.replace(/\.md$/, "");
  const filePath = path.join(postsDirectory, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);

  if (source.includes("tokens truncated")) {
    addError(`${fileName}: 正文包含工具截断残留`);
  }

  for (const residue of [
    "这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。",
    "返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。",
  ]) {
    if (content.includes(residue)) addError(`${fileName}: 正文包含跨主题模板残留`);
  }

  const levelTwoHeadings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) =>
    match[1].trim(),
  );
  const duplicateHeadings = levelTwoHeadings.filter(
    (heading, index) => levelTwoHeadings.indexOf(heading) !== index,
  );
  if (duplicateHeadings.length > 0) {
    addError(`${fileName}: 二级标题重复 ${[...new Set(duplicateHeadings)].join(", ")}`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    addError(`${fileName}: slug 只能使用小写字母、数字和连字符`);
  }

  if (slugs.has(slug)) addError(`${fileName}: slug 重复`);
  slugs.add(slug);
  knownRoutes.add(`/blog/${slug}`);

  for (const field of ["title", "description", "publishedAt", "category"]) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      addError(`${fileName}: 缺少 ${field}`);
    }
  }

  if (typeof data.title === "string") {
    const normalizedTitle = data.title.trim();
    const existing = titles.get(normalizedTitle);
    if (existing) addError(`${fileName}: 标题与 ${existing} 重复`);
    titles.set(normalizedTitle, fileName);
    if (normalizedTitle.length > 80) addWarning(`${fileName}: 标题超过 80 个字符`);
  }

  if (typeof data.description === "string") {
    const length = data.description.trim().length;
    if (length < 24) addWarning(`${fileName}: description 少于 24 个字符`);
    if (length > 180) addWarning(`${fileName}: description 超过 180 个字符`);
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    addError(`${fileName}: 至少需要一个标签`);
  } else if (data.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    addError(`${fileName}: 标签必须是非空字符串`);
  }

  if (
    typeof data.updatedAt === "string" &&
    typeof data.publishedAt === "string" &&
    new Date(data.updatedAt).getTime() < new Date(data.publishedAt).getTime()
  ) {
    addError(`${fileName}: updatedAt 不能早于 publishedAt`);
  }

  const markdownImages = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  for (const image of markdownImages) {
    if (!image[1].trim()) addError(`${fileName}: 图片缺少 ALT 文本`);
  }
}

for (const fileName of files) {
  const filePath = path.join(postsDirectory, fileName);
  const { content } = matter(fs.readFileSync(filePath, "utf8"));
  const internalLinks = [...content.matchAll(/\[[^\]]+\]\((\/[^)#?\s]+)(?:[?#][^)]*)?\)/g)];

  for (const match of internalLinks) {
    const href = match[1].replace(/\/$/, "") || "/";
    if (
      !knownRoutes.has(href) &&
      !href.startsWith("/tags/") &&
      !href.startsWith("/projects/") &&
      !href.startsWith("/beginner/page/") &&
      !href.startsWith("/blog/page/")
    ) {
      addError(`${fileName}: 内链可能不存在 ${href}`);
    }
  }
}

const beginnerSource = fs.readFileSync(beginnerSeriesPath, "utf8");
const stageSlugBlocks = [...beginnerSource.matchAll(/slugs:\s*\[([\s\S]*?)\]/g)];
if (stageSlugBlocks.length === 0) {
  addError("无法读取 beginnerStages 中的 slugs");
} else {
  const beginnerSlugs = stageSlugBlocks.flatMap((block) =>
    [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]),
  );
  const duplicates = beginnerSlugs.filter(
    (slug, index) => beginnerSlugs.indexOf(slug) !== index,
  );
  if (duplicates.length > 0) addError(`入门系列存在重复 slug：${duplicates.join(", ")}`);
  for (const slug of beginnerSlugs) {
    if (!slugs.has(slug)) addError(`入门系列文章不存在：${slug}`);
  }
}

const siteSource = fs.readFileSync(sitePath, "utf8");
if (siteSource.includes("林清安")) {
  addError("站点配置仍然包含旧姓名“林清安”");
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\n内容检查失败：${errors.length} 个错误，${warnings.length} 个提醒。`);
  process.exit(1);
}

console.log(`内容检查通过：${files.length} 篇文章，${warnings.length} 个提醒。`);

