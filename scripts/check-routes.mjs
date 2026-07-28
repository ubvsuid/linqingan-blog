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

function extractConfiguredSlugs(source) {
  const blocks = [...source.matchAll(/slugs:\s*\[([\s\S]*?)\]/g)];

  return blocks.flatMap((block) =>
    [...block[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]),
  );
}

function extractKnowledgeSectionIds(source) {
  return [...source.matchAll(/\bid:\s*["']([a-z0-9-]+)["']/g)].map(
    (match) => match[1],
  );
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
  "/changelog",
  "/feed.xml",
  "/glossary",
  "/knowledge",
  "/now",
  "/screeps-errors",
  "/search",
  "/sitemap.xml",
  "/sitemap-zh.xml",
  "/sitemap-en.xml",
  "/tags",
  "/tools/creep-body-calculator",
  "/tools/room-diagnostics",
  "/verification",
]);

function isExistingPublicDiagram(href) {
  return /^\/diagrams\/[a-z0-9-]+\.svg$/.test(href)
    && fs.existsSync(path.join(root, "public", href.slice(1)));
}

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
const beginnerSource = fs.readFileSync(
  path.join(root, "src", "lib", "beginner-series.ts"),
  "utf8",
);
const knowledgeSlugs = extractConfiguredSlugs(knowledgeSource);
const beginnerSlugs = extractConfiguredSlugs(beginnerSource);
const knowledgeSectionIds = extractKnowledgeSectionIds(knowledgeSource);
const knowledgeSet = new Set(knowledgeSlugs);
const beginnerSet = new Set(beginnerSlugs);
const classifiedSet = new Set([...knowledgeSlugs, ...beginnerSlugs]);

for (const id of knowledgeSectionIds) knownRoutes.add(`/knowledge/${id}`);

for (const slug of knowledgeSlugs) {
  if (!postSlugs.has(slug)) addError(`知识库引用了不存在的文章：${slug}`);
}
for (const slug of beginnerSlugs) {
  if (!postSlugs.has(slug)) addError(`新手路线引用了不存在的文章：${slug}`);
}
for (const slug of postSlugs) {
  if (!classifiedSet.has(slug)) addError(`文章未进入新手路线或知识模块：${slug}`);
}
for (const slug of beginnerSet) {
  if (knowledgeSet.has(slug)) addError(`文章同时进入新手路线和知识模块：${slug}`);
}
if (knowledgeSet.size !== knowledgeSlugs.length) addError("知识模块中存在重复文章 slug");
if (beginnerSet.size !== beginnerSlugs.length) addError("新手路线中存在重复文章 slug");
if (new Set(knowledgeSectionIds).size !== knowledgeSectionIds.length) {
  addError("知识模块中存在重复 id");
}

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
      !isExistingPublicDiagram(href) &&
      !href.startsWith("/blog/page/") &&
      !href.startsWith("/beginner/page/") &&
      !href.startsWith("/now/page/") &&
      !href.startsWith("/changelog/page/")
    ) {
      addError(`${fileName}: 内链目标不存在 ${href}`);
    }
  }
}

const routeFiles = new Map([
  ["/", "src/app/(zh)/page.tsx"],
  ["/about", "src/app/(zh)/about/page.tsx"],
  ["/beginner", "src/app/(zh)/beginner/page.tsx"],
  ["/blog", "src/app/(zh)/blog/page.tsx"],
  ["/changelog", "src/app/(zh)/changelog/page.tsx"],
  ["/glossary", "src/app/(zh)/glossary/page.tsx"],
  ["/knowledge", "src/app/(zh)/knowledge/page.tsx"],
  ["/now", "src/app/(zh)/now/page.tsx"],
  ["/screeps-errors", "src/app/(zh)/screeps-errors/page.tsx"],
  ["/search", "src/app/(zh)/search/page.tsx"],
  ["/tags", "src/app/(zh)/tags/page.tsx"],
  ["/tools/creep-body-calculator", "src/app/(zh)/tools/creep-body-calculator/page.tsx"],
  ["/tools/room-diagnostics", "src/app/(zh)/tools/room-diagnostics/page.tsx"],
  ["/verification", "src/app/(zh)/verification/page.tsx"],
]);
for (const [route, relativePath] of routeFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) addError(`${route} 缺少页面文件 ${relativePath}`);
}

for (const relativePath of [
  "src/app/(zh)/blog/[slug]/page.tsx",
  "src/app/(zh)/blog/[slug]/layout.tsx",
  "src/app/(zh)/knowledge/[section]/page.tsx",
  "src/app/(zh)/tags/[tag]/page.tsx",
  "src/app/(zh)/blog/page/[page]/page.tsx",
  "src/app/(zh)/beginner/page/[page]/page.tsx",
  "src/app/(zh)/changelog/page/[page]/page.tsx",
  "src/app/(zh)/sitemap.xml/route.ts",
  "src/app/(zh)/sitemap-zh.xml/route.ts",
  "src/app/(zh)/sitemap-en.xml/route.ts",
  "src/lib/sitemaps.ts",
]) {
  if (!fs.existsSync(path.join(root, relativePath))) addError(`缺少动态路由文件 ${relativePath}`);
}

if (fs.existsSync(path.join(root, "src/app/(zh)/sitemap.ts"))) {
  addError("旧的单一 Sitemap 元数据路由仍然存在，会与 Sitemap 索引冲突");
}

for (const retiredPath of [
  "src/app/resources/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/projects/[slug]/page.tsx",
  "src/app/projects/page/[page]/page.tsx",
]) {
  if (fs.existsSync(path.join(root, retiredPath))) addError(`已合并页面仍然存在：${retiredPath}`);
}

const knowledgePageSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "knowledge", "page.tsx"),
  "utf8",
);
if (!knowledgePageSource.includes('id="reference-tools"')) {
  addError("知识库没有承接资料中心的查询与工具区域");
}
if (!knowledgePageSource.includes("CollectionPage") || !knowledgePageSource.includes("ItemList")) {
  addError("知识库缺少集合型结构化数据");
}
if (!knowledgePageSource.includes("/tools/creep-body-calculator")) {
  addError("知识库没有加入 Creep 身体计算器");
}

const knowledgeModulePageSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "knowledge", "[section]", "page.tsx"),
  "utf8",
);
if (!knowledgeModulePageSource.includes("knowledgeBaseSections.map")) {
  addError("知识模块页没有从 knowledgeBaseSections 生成静态参数");
}

const aboutPageSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "about", "page.tsx"),
  "utf8",
);
if (!aboutPageSource.includes('id="public-projects"') || !aboutPageSource.includes("projects.map")) {
  addError("关于页没有承接公开项目内容");
}
if (aboutPageSource.includes("profile-project-columns")) {
  addError("关于页仍然展示过长的项目详情列");
}

const tagPageSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "tags", "[tag]", "page.tsx"),
  "utf8",
);
if (!tagPageSource.includes("getTagRecords().map")) {
  addError("标签页没有从 getTagRecords 生成静态参数");
}
if (!tagPageSource.includes("noindex: record.count < 3")) {
  addError("薄标签页没有按文章数量设置 noindex");
}

const englishTagPageSource = fs.readFileSync(
  path.join(root, "src", "app", "(en)", "en", "tags", "[tag]", "page.tsx"),
  "utf8",
);
if (!englishTagPageSource.includes("index: tag.count >= 3")) {
  addError("英文薄标签页没有按文章数量设置 noindex");
}

const searchPageSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "search", "page.tsx"),
  "utf8",
);
if (!searchPageSource.includes("noindex: true")) {
  addError("站内搜索页没有设置 noindex");
}

const changelogPageSource = fs.readFileSync(
  path.join(root, "src", "components", "changelog-archive.tsx"),
  "utf8",
);
if (!changelogPageSource.includes("changelogEntries")) {
  addError("更新日志页没有从 changelogEntries 读取数据");
}

const nowPageSource = fs.readFileSync(
  path.join(root, "src", "components", "now-archive.tsx"),
  "utf8",
);
if (!nowPageSource.includes("changelogEntries.slice(0, 3)")) {
  addError("近况页没有自动读取最近三条更新日志");
}

const nextConfigSource = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
for (const marker of [
  'source: "/changelog/page/2"',
  'destination: "/changelog"',
  'source: "/resources"',
  'destination: "/knowledge#reference-tools"',
  'source: "/projects/:path*"',
  'destination: "/about#public-projects"',
]) {
  if (!nextConfigSource.includes(marker)) addError(`缺少旧页面重定向：${marker}`);
}

const sitemapSource = fs.readFileSync(path.join(root, "src", "lib", "sitemaps.ts"), "utf8");
for (const marker of [
  "getAllPosts()",
  "getTagRecords()",
  ".filter((tag) => tag.count >= 3)",
  "knowledgeBaseSections.map",
  "changelogEntries",
  "/knowledge",
  "/verification",
  "/changelog",
  "/tools/creep-body-calculator",
  "/en/blog",
]) {
  if (!sitemapSource.includes(marker)) addError(`Sitemap 缺少路由来源：${marker}`);
}
if (sitemapSource.includes("`${siteConfig.url}/search`")) {
  addError("站内搜索页不应出现在 Sitemap");
}
if (sitemapSource.includes("`${siteConfig.url}/resources`") || sitemapSource.includes("`${siteConfig.url}/projects`")) {
  addError("已合并的资料或项目页面不应出现在 Sitemap");
}
if (sitemapSource.includes("/blog/page/") || sitemapSource.includes("createArchivePages")) {
  addError("文章深层分页不应进入 Sitemap");
}

const sitemapIndexSource = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "sitemap.xml", "route.ts"),
  "utf8",
);
for (const marker of ["/sitemap-zh.xml", "/sitemap-en.xml", "renderSitemapIndexXml"]) {
  if (!sitemapIndexSource.includes(marker)) addError(`Sitemap 索引缺少：${marker}`);
}

const chineseSitemapRoute = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "sitemap-zh.xml", "route.ts"),
  "utf8",
);
if (!chineseSitemapRoute.includes("getChineseSitemapEntries")) {
  addError("中文 Sitemap 路由没有使用中文 URL 构建器");
}

const englishSitemapRoute = fs.readFileSync(
  path.join(root, "src", "app", "(zh)", "sitemap-en.xml", "route.ts"),
  "utf8",
);
if (!englishSitemapRoute.includes("getEnglishSitemapEntries")) {
  addError("英文 Sitemap 路由没有使用英文 URL 构建器");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\n路由检查失败：${errors.length} 个错误。`);
  process.exit(1);
}

console.log(
  `路由检查通过：${files.length} 篇文章、${tagOwners.size} 个标签页、${beginnerSet.size} 篇新手路线、${knowledgeSet.size} 篇知识模块文章、${knowledgeSectionIds.length} 个专题页，并已启用双语 Sitemap 索引。`,
);
