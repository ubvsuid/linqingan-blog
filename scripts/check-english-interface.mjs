import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required English interface file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(relativePath, expected, label) {
  const source = read(relativePath);
  if (source && !source.includes(expected)) failures.push(`Missing ${label} in ${relativePath}`);
}

function forbidText(relativePath, forbidden, label) {
  const source = read(relativePath);
  if (source.includes(forbidden)) failures.push(`Unexpected ${label} in ${relativePath}`);
}

const requiredFiles = [
  "src/app/(en)/en/layout.tsx",
  "src/app/(en)/en/not-found.tsx",
  "src/app/(en)/en/error.tsx",
  "src/app/(en)/en/changelog/page.tsx",
  "src/app/(en)/en/roadmap/page.tsx",
  "src/app/(en)/en/license/page.tsx",
  "src/app/(en)/en/search-index.json/route.ts",
  "src/app/(en)/en/blog/screeps-memory-write-safety/page.tsx",
  "src/app/(zh)/sitemap.xml/route.ts",
  "src/app/(zh)/sitemap-en.xml/route.ts",
];
for (const relativePath of requiredFiles) read(relativePath);

requireText("next.config.ts", 'key: "Content-Language", value: "en"', "English Content-Language header");
requireText("src/app/(en)/layout.tsx", '<html lang="en" data-site-language="en"', "server-rendered English document language");
requireText("src/app/(zh)/layout.tsx", '<html lang="zh-CN" data-site-language="zh-CN"', "server-rendered Chinese document language");
forbidText("src/app/(en)/layout.tsx", "document.documentElement.lang", "client-side document language mutation");
requireText("src/app/(en)/en/layout.tsx", 'className="english-root" lang="en"', "English content language wrapper");
requireText("src/components/site-header.tsx", 'lang={english ? "en" : "zh-CN"}', "localized header language");
requireText("src/components/site-header.tsx", 'english ? "Switch to Chinese"', "English language-switch label");
requireText("src/components/site-footer.tsx", 'lang={english ? "en" : "zh-CN"}', "localized footer language");
requireText("src/app/(en)/en/layout.tsx", "/en/search?q={search_term_string}", "English SearchAction");
requireText("src/lib/english-metadata.ts", 'applicationName: "Linqingan Screeps Guides & Tools"', "English application metadata");
requireText("src/components/theme-toggle.tsx", "Switch to ${nextTheme} mode", "English theme-toggle label");
requireText("src/app/(en)/en/page.tsx", "published English guides", "accurate English publication wording");
forbidText("src/app/(en)/en/page.tsx", "verified articles", "ambiguous verified-article wording");
requireText("src/app/(en)/en/tools/page.tsx", "SAMPLE OUTPUT", "tool sample-output label");
forbidText("src/app/(en)/en/knowledge/page.tsx", "Score {", "public internal article score");
forbidText("src/components/english-article-browser.tsx", "Score {article.finalScore}", "public article score in the library");
forbidText("src/app/(en)/en/beginner/page.tsx", "Score {article.finalScore}", "public article score in the beginner roadmap");
forbidText("src/components/english-article-browser.tsx", 'value="recommended"', "score-based public recommendation sort");
requireText("src/app/(en)/en/knowledge/page.tsx", "discovery.difficulty", "knowledge difficulty metadata");
requireText("src/lib/english-knowledge.ts", "articleModuleOverrides", "curated knowledge-module mapping");
requireText("src/lib/english-discovery.ts", "articleTagSlugOverrides", "curated article topic mapping");
requireText("src/lib/english-discovery.ts", "moduleDefaultTagSlugs", "safe module topic fallback");
requireText("src/components/english-site-search.tsx", "featuredResources", "curated default English search resources");
requireText("src/components/english-site-search.tsx", "popularQueries", "popular English searches");
requireText("src/components/english-site-search.tsx", 'event.key !== "/"', "English search keyboard shortcut");
requireText("src/components/english-site-search.tsx", "/en/search-index.json", "lazy English search-index request");
requireText("src/app/(en)/en/search-index.json/route.ts", 'dynamic = "force-static"', "static English search-index route");
forbidText("src/app/(en)/en/search/page.tsx", "englishSearchDocuments", "full search index in initial page payload");
requireText("src/lib/search.ts", "compactArticleSearchText", "compact Chinese article search text");
requireText("src/lib/search.ts", "MAX_ARTICLE_SEARCH_TEXT_LENGTH = 2400", "Chinese search payload limit");
requireText("src/lib/english-search.ts", "compactKeywords", "compact English search keywords");
requireText("src/app/(zh)/api/search-index/route.ts", '"X-Robots-Tag": "noindex, nofollow"', "Chinese search-index robots header");
forbidText("src/components/english-article-browser.tsx", "article.finalScore", "public internal score usage");
requireText("src/components/site-footer.tsx", "/en/changelog", "English changelog footer link");
requireText("src/components/site-footer.tsx", "/en/roadmap", "English roadmap footer link");
requireText("src/components/site-footer.tsx", "/en/license", "English content-use footer link");
requireText("src/lib/sitemaps.ts", "/en/changelog", "English changelog Sitemap entry");
requireText("src/lib/sitemaps.ts", "/en/roadmap", "English roadmap Sitemap entry");
requireText("src/lib/sitemaps.ts", "/en/license", "English content-use Sitemap entry");
requireText("src/lib/sitemaps.ts", ".filter((tag) => tag.count >= 3)", "thin English topic Sitemap threshold");
requireText("src/app/(en)/en/tags/[tag]/page.tsx", "index: tag.count >= 3", "thin English topic noindex threshold");
requireText("src/app/(en)/en/blog/screeps-memory-write-safety/page.tsx", "permanentRedirect", "legacy English permanent redirect");
if (fs.existsSync(path.join(root, "src/app/(en)/en/loading.tsx"))) failures.push("Global English loading.tsx must remain absent because it turns permanent 308 redirects into streamed 200 responses.");

const navigation = read("src/lib/i18n.ts");
if (navigation.includes('{ label: "Home", href: "/en" }')) failures.push("English navigation still duplicates the home logo link.");
if (navigation.includes('{ label: "Topics", href: "/en/tags" }')) failures.push("English navigation still exposes the secondary Topics page as a primary desktop item.");

const home = read("src/app/(en)/en/page.tsx");
const taskIndex = home.indexOf('className="english-task-hub"');
const diagramIndex = home.indexOf('className="english-system-visual"');
if (taskIndex < 0 || diagramIndex < 0 || taskIndex > diagramIndex) failures.push("English task navigation must appear before the system diagram.");

const libraryDirectory = path.join(root, "src/lib");
const registryFileNames = fs.readdirSync(libraryDirectory).filter((fileName) =>
  fileName === "english-articles.ts" || /^english-.*-registry(?:-\d+)?\.ts$/.test(fileName),
);
const articleRegistrySource = registryFileNames
  .map((fileName) => fs.readFileSync(path.join(libraryDirectory, fileName), "utf8"))
  .join("\n");
const knowledgeMapping = read("src/lib/english-knowledge.ts");
const articleHrefs = new Set([...articleRegistrySource.matchAll(/"?href"?\s*:\s*"(\/en\/blog\/[^"]+)"/g)].map((match) => match[1]));
const mappedHrefs = new Set([...knowledgeMapping.matchAll(/"(\/en\/blog\/[^"]+)":\s*[1-8]/g)].map((match) => match[1]));
for (const href of articleHrefs) {
  if (!mappedHrefs.has(href)) failures.push(`English knowledge mapping is missing ${href}`);
}
for (const href of mappedHrefs) {
  if (!articleHrefs.has(href)) failures.push(`English knowledge mapping contains an unpublished route ${href}`);
}
if (mappedHrefs.size !== articleHrefs.size) {
  failures.push(`English knowledge mapping count ${mappedHrefs.size} does not match published article count ${articleHrefs.size}`);
}

for (const relativePath of [
  "src/app/(en)/en/layout.tsx",
  "src/app/(en)/en/not-found.tsx",
  "src/app/(en)/en/error.tsx",
  "src/app/(en)/en/changelog/page.tsx",
  "src/app/(en)/en/roadmap/page.tsx",
  "src/app/(en)/en/license/page.tsx",
]) {
  const source = read(relativePath);
  if (/[一-鿿]/u.test(source)) failures.push(`Chinese interface text found in ${relativePath}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish interface check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("English interface check passed: language fallbacks, metadata, error states, hierarchy, navigation, lazy search, tool previews, curated knowledge mapping, trust pages, permanent redirects, and bilingual Sitemap entries are present.");
