const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3210";
const failures = [];

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  if (!response.ok) failures.push(`${path}: expected 2xx, received ${response.status}`);
  return { response, text };
}

function requireMatch(path, text, pattern, label) {
  if (!pattern.test(text)) failures.push(`${path}: missing ${label}`);
}

function forbidMatch(path, text, pattern, label) {
  if (pattern.test(text)) failures.push(`${path}: unexpected ${label}`);
}

const chineseHome = await get("/");
requireMatch("/", chineseHome.text, /<html[^>]*\blang=["']zh-CN["']/i, 'server-rendered html lang="zh-CN"');

const englishHome = await get("/en");
requireMatch("/en", englishHome.text, /<html[^>]*\blang=["']en["']/i, 'server-rendered html lang="en"');
forbidMatch("/en", englishHome.text, /document\.documentElement\.lang/, "client-side document language mutation");

for (const path of ["/en/blog", "/en/beginner"]) {
  const page = await get(path);
  forbidMatch(path, page.text, /\bScore\s+\d+/i, "public internal article score");
  forbidMatch(path, page.text, /value=["']recommended["']/i, "score-based recommendation sort");
}

const marketTopic = await get("/en/tags/market");
for (const href of [
  "/en/blog/screeps-moveto-not-moving",
  "/en/blog/screeps-link-transfer-energy",
  "/en/blog/screeps-global-cache",
  "/en/blog/screeps-game-notify",
]) {
  forbidMatch("/en/tags/market", marketTopic.text, new RegExp(`href=["']${href}["']`), `misclassified article ${href}`);
}
requireMatch("/en/tags/market", marketTopic.text, /href=["']\/en\/blog\/screeps-market-create-order["']/, "a genuine Market guide");

const movementTopic = await get("/en/tags/movement");
requireMatch("/en/tags/movement", movementTopic.text, /href=["']\/en\/blog\/screeps-moveto-not-moving["']/, "moveTo troubleshooting guide");

const chineseIndex = await get("/api/search-index");
if (chineseIndex.response.headers.get("x-robots-tag") !== "noindex, nofollow") {
  failures.push('/api/search-index: missing X-Robots-Tag "noindex, nofollow"');
}
if (chineseIndex.response.headers.get("content-language") !== "zh-CN") {
  failures.push('/api/search-index: missing Content-Language "zh-CN"');
}
try {
  const documents = JSON.parse(chineseIndex.text);
  for (const document of documents) {
    if (document.type === "\u6587\u7ae0" && document.text.length > 2400) {
      failures.push(`${document.href}: compact Chinese search text exceeds 2400 characters`);
    }
  }
} catch (error) {
  failures.push(`/api/search-index: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
}

const englishIndex = await get("/en/search-index.json");
try {
  const documents = JSON.parse(englishIndex.text);
  for (const document of documents) {
    if (Object.prototype.hasOwnProperty.call(document, "searchIntent")) {
      failures.push(`${document.href}: English search payload exposes searchIntent`);
    }
    if (!Array.isArray(document.keywords) || document.keywords.length > 24) {
      failures.push(`${document.href}: English search keywords exceed the 24-item limit`);
      continue;
    }
    if (document.keywords.some((keyword) => typeof keyword !== "string" || keyword.length > 120)) {
      failures.push(`${document.href}: English search keyword exceeds 120 characters`);
    }
  }
} catch (error) {
  failures.push(`/en/search-index.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
}

if (failures.length > 0) {
  console.error("Priority audit smoke checks failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Priority audit smoke checks passed: SSR languages, public scores, curated topics, and compact search indexes are verified against the production server output.");
