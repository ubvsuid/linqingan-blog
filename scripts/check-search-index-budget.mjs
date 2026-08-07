import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const root = process.cwd();
const postsDirectory = path.join(root, "content", "posts");
const searchSourcePath = path.join(root, "src", "lib", "search.ts");
const routePath = path.join(root, "src", "app", "(zh)", "api", "search-index", "route.ts");

const MAX_ARTICLE_SEARCH_TOKENS = 120;
const MAX_ARTICLE_SEARCH_TEXT_LENGTH = 1200;
const MAX_ESTIMATED_RAW_BYTES = 400_000;
const NON_ARTICLE_ALLOWANCE_BYTES = 100_000;

const failures = [];

function compactArticleSearchText(value) {
  const normalized = String(value)
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = normalized.match(/[A-Za-z_][A-Za-z0-9_.:-]*|[\u3400-\u9fff]{1,8}|\d+(?:\.\d+)?/g) ?? [];
  const seen = new Set();
  const uniqueTokens = [];

  for (const token of tokens) {
    const key = token.toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTokens.push(token);
    if (uniqueTokens.length >= MAX_ARTICLE_SEARCH_TOKENS) break;
  }

  return uniqueTokens.join(" ").slice(0, MAX_ARTICLE_SEARCH_TEXT_LENGTH);
}

const articleDocuments = fs
  .readdirSync(postsDirectory)
  .filter((fileName) => fileName.endsWith(".md"))
  .map((fileName) => {
    const source = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
    const { data, content } = matter(source);
    if (data.draft === true) return null;

    return {
      id: `post:${fileName.replace(/\.md$/, "")}`,
      type: "文章",
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      meta: String(data.category ?? ""),
      keywords: [
        ...(Array.isArray(data.tags) ? data.tags.map(String) : []),
        String(data.category ?? ""),
      ],
      text: compactArticleSearchText(content),
    };
  })
  .filter(Boolean);

const articleBytes = Buffer.byteLength(JSON.stringify(articleDocuments), "utf8");
const estimatedTotalBytes = articleBytes + NON_ARTICLE_ALLOWANCE_BYTES;

const searchSource = fs.readFileSync(searchSourcePath, "utf8");
for (const requiredText of [
  `ARTICLE_SEARCH_TOKEN_LIMIT = ${MAX_ARTICLE_SEARCH_TOKENS}`,
  `ARTICLE_SEARCH_TEXT_LIMIT = ${MAX_ARTICLE_SEARCH_TEXT_LENGTH}`,
]) {
  if (!searchSource.includes(requiredText)) {
    failures.push(`Search source budget drifted: missing ${requiredText}.`);
  }
}

const routeSource = fs.readFileSync(routePath, "utf8");
for (const requiredText of [
  "X-Search-Index-Raw-Bytes",
  "X-Search-Index-Article-Token-Limit",
  "X-Search-Index-Article-Text-Limit",
  "s-maxage=900",
  "stale-while-revalidate=3600",
]) {
  if (!routeSource.includes(requiredText)) {
    failures.push(`Search index route is missing budget instrumentation: ${requiredText}.`);
  }
}

if (estimatedTotalBytes > MAX_ESTIMATED_RAW_BYTES) {
  failures.push(
    `Estimated raw search index exceeds budget: ${estimatedTotalBytes} > ${MAX_ESTIMATED_RAW_BYTES} bytes.`,
  );
}

const oversizedArticles = articleDocuments.filter(
  (document) => document.text.length > MAX_ARTICLE_SEARCH_TEXT_LENGTH,
);
if (oversizedArticles.length > 0) {
  failures.push(`Article search text exceeds per-document limit for ${oversizedArticles.length} documents.`);
}

if (failures.length > 0) {
  console.error(`Search index budget check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Search index budget check passed: ${articleDocuments.length} articles, ${articleBytes} article bytes, ` +
    `${estimatedTotalBytes}/${MAX_ESTIMATED_RAW_BYTES} estimated total raw bytes.`,
);
