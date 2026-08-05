import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`缺少必需文件 ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const sitemapSource = read("src/lib/sitemaps.ts");
const catalogSource = read("src/lib/tool-catalog.ts");
const routePairsSource = read("src/lib/i18n.ts");
const chineseSearchSource = read("src/lib/search.ts");
const englishSearchSource = read("src/lib/english-search.ts");
const chineseToolsPageSource = read("src/app/(zh)/tools/page.tsx");
const englishToolsPageSource = read("src/app/(en)/en/tools/page.tsx");
const chineseSearchRouteSource = read("src/app/(zh)/api/search-index/route.ts");
const englishSearchRouteSource = read("src/app/(en)/en/search-index.json/route.ts");
const siteStatusSource = read("src/lib/site-status.ts");
const nowArchiveSource = read("src/components/now-archive.tsx");

const toolSlugs = [...catalogSource.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]);
const uniqueToolSlugs = [...new Set(toolSlugs)];

if (toolSlugs.length === 0) {
  failures.push("src/lib/tool-catalog.ts 未登记任何公开工具");
}
if (uniqueToolSlugs.length !== toolSlugs.length) {
  failures.push("src/lib/tool-catalog.ts 存在重复工具 slug");
}

const publicTools = [
  { route: "/tools", page: "src/app/(zh)/tools/page.tsx" },
  { route: "/en/tools", page: "src/app/(en)/en/tools/page.tsx" },
  ...uniqueToolSlugs.flatMap((slug) => [
    { route: `/tools/${slug}`, page: `src/app/(zh)/tools/${slug}/page.tsx` },
    { route: `/en/tools/${slug}`, page: `src/app/(en)/en/tools/${slug}/page.tsx` },
  ]),
];

for (const tool of publicTools) {
  const absolutePage = path.join(root, tool.page);
  if (!fs.existsSync(absolutePage)) {
    failures.push(`${tool.route}: 缺少公开工具页面 ${tool.page}`);
    continue;
  }

  const pageSource = fs.readFileSync(absolutePage, "utf8");
  if (!pageSource.includes("SoftwareApplication") && !pageSource.includes("CollectionPage")) {
    failures.push(`${tool.route}: 缺少 SoftwareApplication 或 CollectionPage 结构化数据`);
  }

  if (!sitemapSource.includes(tool.route)) {
    failures.push(`${tool.route}: 公开工具未加入 src/lib/sitemaps.ts`);
  }
}

for (const slug of uniqueToolSlugs) {
  const chineseRoute = `/tools/${slug}`;
  if (!routePairsSource.includes(`\"${chineseRoute}\"`)) {
    failures.push(`${chineseRoute}: 缺少中英文 route pair`);
  }
}

const sharedCatalogConsumers = [
  ["src/lib/search.ts", chineseSearchSource],
  ["src/lib/english-search.ts", englishSearchSource],
  ["src/app/(zh)/tools/page.tsx", chineseToolsPageSource],
  ["src/app/(en)/en/tools/page.tsx", englishToolsPageSource],
];
for (const [relativePath, source] of sharedCatalogConsumers) {
  if (!source.includes("toolCatalog")) {
    failures.push(`${relativePath}: 必须从共享 toolCatalog 生成工具数据`);
  }
}

if (!chineseSearchSource.includes("getSearchablePosts().map")) {
  failures.push("src/lib/search.ts: 中文文章索引必须直接遍历全部公开搜索文章");
}
if (!chineseSearchSource.includes("getSearchIndexSummary")) {
  failures.push("src/lib/search.ts: 缺少搜索索引统计摘要");
}
if (!englishSearchSource.includes("toolCatalog.map")) {
  failures.push("src/lib/english-search.ts: 英文工具索引未从共享目录生成");
}

for (const [relativePath, source] of [
  ["src/app/(zh)/api/search-index/route.ts", chineseSearchRouteSource],
  ["src/app/(en)/en/search-index.json/route.ts", englishSearchRouteSource],
]) {
  for (const header of [
    "X-Search-Index-Total",
    "X-Search-Index-Articles",
    "X-Search-Index-Public-Tools",
    "X-Search-Index-Tool-Documents",
  ]) {
    if (!source.includes(header)) {
      failures.push(`${relativePath}: 缺少 ${header} 一致性响应头`);
    }
  }
}

for (const expected of ["getAllPosts", "toolCount", "latestContentDate", "latestActivityDate"]) {
  if (!siteStatusSource.includes(expected)) {
    failures.push(`src/lib/site-status.ts: 缺少动态状态来源 ${expected}`);
  }
}
if (!nowArchiveSource.includes("getSiteStatus") || !nowArchiveSource.includes("getRecentSiteActivity")) {
  failures.push("src/components/now-archive.tsx: 近况页未接入动态内容状态");
}

if (failures.length > 0) {
  console.error(`公开工具与搜索一致性检查失败：\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`公开工具与搜索一致性检查通过：${uniqueToolSlugs.length} 个工具由单一目录驱动，${publicTools.length} 个中英文页面已进入 Sitemap、语言映射、搜索与动态状态门禁。`);
