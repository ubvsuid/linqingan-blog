import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import fixedTagSlugs from "../src/lib/tag-slugs.json" with { type: "json" };

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const errors = [];

function addError(message) {
  errors.push(message);
}

function tagToSlug(tag) {
  const normalizedTag = tag.normalize("NFKC").trim();
  const fixedSlug = fixedTagSlugs[normalizedTag];
  if (fixedSlug) return fixedSlug;

  return normalizedTag
    .toLocaleLowerCase("zh-CN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const requiredTagSlugs = {
  新手入门: "beginner",
  基础工程: "basic-engineering",
  常见问题: "common-questions",
  错误排查: "debugging",
  进阶开发: "advanced-development",
};

for (const [name, expectedSlug] of Object.entries(requiredTagSlugs)) {
  const actualSlug = tagToSlug(name);
  if (actualSlug !== expectedSlug) {
    addError(`标签 ${name} 应映射到 ${expectedSlug}，实际为 ${actualSlug || "空"}`);
  }
}

const files = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .sort();
const postSlugs = new Set();
const tagOwners = new Map();
const knownRoutes = new Set([
  "/",
  "/about",
  "/beginner",
  "/blog",
  "/feed.xml",
  "/glossary",
  "/knowledge",
  "/now",
  "/projects",
  "/resources",
  "/screeps-errors",
  "/search",
  "/sitemap.xml",
  "/tags",
]);

for (const fileName of files) {
  const slug = fileName.replace(/\.md$/, "");
  const { data } = matter(fs.readFileSync(path.join(postsDirectory, fileName), "utf8"));
  postSlugs.add(slug);
  knownRoutes.add(`/blog/${slug}`);

  for (const tag of data.tags ?? []) {
    const tagSlug = tagToSlug(tag);
    if (!tagSlug) {
      addError(`${fileName}: 标签“${tag}”无法生成 slug`);
      continue;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tagSlug)) {
      addError(`${fileName}: 标签“${tag}”生成了非 ASCII slug：${tagSlug}`);
    }
    const existing = tagOwners.get(tagSlug);
    if (existing && existing !== tag) {
      addError(`标签 slug 冲突：${existing} 与 ${tag} 都映射到 ${tagSlug}`);
    }
    tagOwners.set(tagSlug, tag);
    knownRoutes.add(`/tags/${tagSlug}`);
  }
}

const knowledgeSource = fs.readFileSync(
  path.join(root, "src", "lib", "knowledge-base.ts"),
  "utf8",
);
const knowledgeBlocks = [...knowledgeSource.matchAll(/slugs:\s*\[([\s\S]*?)\]/g)];
const knowledgeSlugs = knowledgeBlocks.flatMap((block) =>
  [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]),
);
const knowledgeSet = new Set(knowledgeSlugs);

for (const slug of knowledgeSlugs) {
  if (!postSlugs.has(slug)) addError(`知识库引用了不存在的文章：${slug}`);
}
for (const slug of postSlugs) {
  if (!knowledgeSet.has(slug)) addError(`文章未进入知识库：${slug}`);
}
if (knowledgeSet.size !== knowledgeSlugs.length) addError("知识库中存在重复文章 slug");

for (const fileName of files) {
  const { content } = matter(
    fs.readFileSync(path.join(postsDirectory, fileName), "utf8"),
  );
  const links = [
    ...content.matchAll(
      /\[[^\]]+\]\((?:(?:https:\/\/www\.linqingan\.com)?)(\/[^)#?\s]+)(?:[?#][^)]*)?\)/g,
    ),
  ];

  for (const match of links) {
    const href = match[1].replace(/\/$/, "") || "/";
    if (
      !knownRoutes.has(href) &&
      !href.startsWith("/projects/") &&
      !href.startsWith("/blog/page/") &&
      !href.startsWith("/beginner/page/") &&
      !href.startsWith("/now/page/") &&
      !href.startsWith("/projects/page/")
    ) {
      addError(`${fileName}: 内链目标不存在 ${href}`);
    }
  }
}

const routeFiles = new Map([
  ["/", "src/app/page.tsx"],
  ["/about", "src/app/about/page.tsx"],
  ["/beginner", "src/app/beginner/page.tsx"],
  ["/blog", "src/app/blog/page.tsx"],
  ["/glossary", "src/app/glossary/page.tsx"],
  ["/knowledge", "src/app/knowledge/page.tsx"],
  ["/now", "src/app/now/page.tsx"],
  ["/projects", "src/app/projects/page.tsx"],
  ["/resources", "src/app/resources/page.tsx"],
  ["/screeps-errors", "src/app/screeps-errors/page.tsx"],
  ["/search", "src/app/search/page.tsx"],
  ["/tags", "src/app/tags/page.tsx"],
]);
for (const [route, relativePath] of routeFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) addError(`${route} 缺少页面文件 ${relativePath}`);
}

for (const relativePath of [
  "src/app/blog/[slug]/page.tsx",
  "src/app/tags/[tag]/page.tsx",
  "src/app/blog/page/[page]/page.tsx",
  "src/app/beginner/page/[page]/page.tsx",
  "src/app/sitemap.ts",
]) {
  if (!fs.existsSync(path.join(root, relativePath))) addError(`缺少动态路由文件 ${relativePath}`);
}

const tagPageSource = fs.readFileSync(
  path.join(root, "src", "app", "tags", "[tag]", "page.tsx"),
  "utf8",
);
if (!tagPageSource.includes("getTagRecords().map")) {
  addError("标签页没有从 getTagRecords 生成静态参数");
}

const sitemapSource = fs.readFileSync(path.join(root, "src", "app", "sitemap.ts"), "utf8");
for (const marker of ["getAllPosts()", "getTagRecords().map", "/knowledge"]) {
  if (!sitemapSource.includes(marker)) addError(`Sitemap 缺少路由来源：${marker}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\n路由检查失败：${errors.length} 个错误。`);
  process.exit(1);
}

console.log(
  `路由检查通过：${files.length} 篇文章、${tagOwners.size} 个标签页、${knowledgeSet.size} 个知识库条目。`,
);

