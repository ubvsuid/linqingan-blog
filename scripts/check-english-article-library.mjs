import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing English article-library file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function requireText(relativePath, expected, label) {
  const source = read(relativePath);
  if (source && !source.includes(expected)) {
    failures.push(`Missing ${label} in ${relativePath}`);
  }
}

function forbidText(relativePath, forbidden, label) {
  const source = read(relativePath);
  if (source.includes(forbidden)) {
    failures.push(`Unexpected ${label} in ${relativePath}`);
  }
}

const serverBrowser = "src/components/english-article-browser.tsx";
const queryInput = "src/components/english-article-query-input.tsx";
const browserLibrary = "src/lib/english-article-browser.ts";
const indexRoute = "src/app/(en)/en/blog-index.json/route.ts";
const blogPage = "src/app/(en)/en/blog/page.tsx";

for (const file of [
  serverBrowser,
  queryInput,
  browserLibrary,
  indexRoute,
  blogPage,
  "src/components/english-article-browser.module.css",
]) {
  read(file);
}

requireText(browserLibrary, "ENGLISH_ARTICLE_PAGE_SIZE = 12", "12-item server page size");
requireText(browserLibrary, "browseEnglishArticles", "server-side filtering and pagination");
requireText(browserLibrary, "normalizeEnglishArticleBrowseParams", "invalid filter normalization");
requireText(serverBrowser, "browseEnglishArticles(articles, effectiveParams)", "server-rendered result selection");
requireText(serverBrowser, 'method="get"', "URL-backed article filters");
requireText(serverBrowser, 'rel="next"', "crawlable article pagination");
requireText(serverBrowser, "prefetch={false}", "crawl-efficient dense result links");
requireText(queryInput, 'fetch("/en/blog-index.json")', "lazy article-index request");
requireText(indexRoute, 'dynamic = "force-static"', "static lightweight article index");
requireText(indexRoute, '"X-Robots-Tag": "noindex, nofollow"', "article-index noindex header");
requireText(blogPage, "Publication standard", "plain-language publication policy");
requireText(blogPage, "export async function generateMetadata", "dynamic pagination metadata");
requireText(blogPage, "isCleanPagination", "clean pagination canonical boundary");
requireText(blogPage, '`/en/blog?page=${parsed.page}`', "self-canonical English pagination path");
requireText(blogPage, "noindex: !isCleanPagination", "filtered-state noindex boundary");

forbidText(serverBrowser, '"use client"', "client rendering on the full article browser");
forbidText(serverBrowser, "<style", "component-local article-browser styles");
forbidText(queryInput, "EnglishDiscoveryArticle[]", "full article records in the query client");
forbidText(browserLibrary, "finalScore", "internal scores in the public article index");
forbidText(blogPage, "at least 96", "unexplained public numeric publication score");

const indexType = read(browserLibrary).match(
  /export interface EnglishArticleIndexItem \{([\s\S]*?)\n\}/,
);
if (!indexType) {
  failures.push("EnglishArticleIndexItem interface is missing.");
} else {
  for (const allowedField of ["href:", "title:", "searchText:"]) {
    if (!indexType[1].includes(allowedField)) {
      failures.push(`Lightweight article index is missing ${allowedField}`);
    }
  }
  for (const disallowedField of ["description:", "keywords:", "searchIntent:", "finalScore:"]) {
    if (indexType[1].includes(disallowedField)) {
      failures.push(`Lightweight article index exposes ${disallowedField}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nEnglish article-library check failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "English article-library check passed: server-rendered 12-item pages, crawl-efficient result links, self-canonical clean pagination, noindex filter states, lazy lightweight suggestions, external styles, and a plain-language publication policy are present.",
);
