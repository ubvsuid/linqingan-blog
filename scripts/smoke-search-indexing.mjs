const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const failures = [];

for (const pathname of ["/search?q=creep", "/en/search?q=creep%20not%20moving"]) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    continue;
  }
  if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(body)) {
    failures.push(`${pathname}: missing intentional noindex metadata`);
  }
}

const sitemapResponses = await Promise.all([
  fetch(`${baseUrl}/sitemap-zh.xml`).then((response) => response.text()),
  fetch(`${baseUrl}/sitemap-en.xml`).then((response) => response.text()),
]);

if (sitemapResponses[0].includes("https://www.linqingan.com/search")) {
  failures.push("/search: intentionally noindexed search page must not appear in the Chinese Sitemap");
}
if (sitemapResponses[1].includes("https://www.linqingan.com/en/search")) {
  failures.push("/en/search: intentionally noindexed search page must not appear in the English Sitemap");
}

function readCount(response, name, pathname) {
  const value = response.headers.get(name);
  const parsed = Number(value);
  if (!value || !Number.isInteger(parsed) || parsed < 0) {
    failures.push(`${pathname}: missing or invalid ${name} header`);
    return null;
  }
  return parsed;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

async function readIndex(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    return null;
  }

  let documents;
  try {
    documents = await response.json();
  } catch {
    failures.push(`${pathname}: response is not valid JSON`);
    return null;
  }

  if (!Array.isArray(documents)) {
    failures.push(`${pathname}: search index payload must be an array`);
    return null;
  }

  const total = readCount(response, "x-search-index-total", pathname);
  if (total !== null && total !== documents.length) {
    failures.push(`${pathname}: total header ${total} does not match ${documents.length} documents`);
  }

  for (const field of ["id", "title", "href", "type"]) {
    if (documents.some((document) => typeof document?.[field] !== "string" || document[field].trim() === "")) {
      failures.push(`${pathname}: every document must have a non-empty ${field}`);
    }
  }

  for (const duplicate of findDuplicates(documents.map((document) => document.id))) {
    failures.push(`${pathname}: duplicate document id ${duplicate}`);
  }
  for (const duplicate of findDuplicates(documents.map((document) => document.href))) {
    failures.push(`${pathname}: duplicate document href ${duplicate}`);
  }

  return { response, documents };
}

const chineseIndex = await readIndex("/api/search-index");
const englishIndex = await readIndex("/en/search-index.json");

let chinesePublicTools = null;
let englishPublicTools = null;

if (chineseIndex) {
  const articleCount = chineseIndex.documents.filter((document) => document.type === "文章").length;
  const toolDocuments = chineseIndex.documents.filter((document) => document.type === "工具");
  const detailTools = toolDocuments.filter((document) => document.href.startsWith("/tools/"));
  const headerArticles = readCount(chineseIndex.response, "x-search-index-articles", "/api/search-index");
  const headerToolDocuments = readCount(chineseIndex.response, "x-search-index-tool-documents", "/api/search-index");
  chinesePublicTools = readCount(chineseIndex.response, "x-search-index-public-tools", "/api/search-index");

  if (articleCount === 0) failures.push("/api/search-index: no public articles were indexed");
  if (headerArticles !== null && headerArticles !== articleCount) {
    failures.push(`/api/search-index: article header ${headerArticles} does not match ${articleCount} article documents`);
  }
  if (headerToolDocuments !== null && headerToolDocuments !== toolDocuments.length) {
    failures.push(`/api/search-index: tool-document header ${headerToolDocuments} does not match ${toolDocuments.length}`);
  }
  if (chinesePublicTools !== null && chinesePublicTools !== detailTools.length) {
    failures.push(`/api/search-index: public-tool header ${chinesePublicTools} does not match ${detailTools.length} public /tools/ pages`);
  }
  if (!toolDocuments.some((document) => document.id === "tool:hub" && document.href === "/tools")) {
    failures.push("/api/search-index: missing the Chinese tools hub document");
  }
  if (!toolDocuments.some((document) => document.id === "reference:screeps-api" && document.href === "/screeps-api")) {
    failures.push("/api/search-index: missing the Chinese Screeps API quick-reference document");
  }
}

if (englishIndex) {
  const articleCount = englishIndex.documents.filter((document) => document.type === "Article").length;
  const toolDocuments = englishIndex.documents.filter((document) => document.type === "Tool");
  const headerArticles = readCount(englishIndex.response, "x-search-index-articles", "/en/search-index.json");
  const headerToolDocuments = readCount(englishIndex.response, "x-search-index-tool-documents", "/en/search-index.json");
  englishPublicTools = readCount(englishIndex.response, "x-search-index-public-tools", "/en/search-index.json");

  if (articleCount === 0) failures.push("/en/search-index.json: no public English articles were indexed");
  if (headerArticles !== null && headerArticles !== articleCount) {
    failures.push(`/en/search-index.json: article header ${headerArticles} does not match ${articleCount} article documents`);
  }
  if (headerToolDocuments !== null && headerToolDocuments !== toolDocuments.length) {
    failures.push(`/en/search-index.json: tool-document header ${headerToolDocuments} does not match ${toolDocuments.length}`);
  }
  if (englishPublicTools !== null && englishPublicTools !== toolDocuments.length) {
    failures.push(`/en/search-index.json: public-tool header ${englishPublicTools} does not match ${toolDocuments.length} tool documents`);
  }
}

if (
  chinesePublicTools !== null &&
  englishPublicTools !== null &&
  chinesePublicTools !== englishPublicTools
) {
  failures.push(`Search indexes disagree on public tool count: zh=${chinesePublicTools}, en=${englishPublicTools}`);
}

if (chineseIndex && englishIndex) {
  const chineseToolSlugs = new Set(
    chineseIndex.documents
      .filter((document) => document.type === "工具" && document.href.startsWith("/tools/"))
      .map((document) => document.href.replace("/tools/", "")),
  );
  const englishToolSlugs = new Set(
    englishIndex.documents
      .filter((document) => document.type === "Tool" && document.href.startsWith("/en/tools/"))
      .map((document) => document.href.replace("/en/tools/", "")),
  );

  for (const slug of new Set([...chineseToolSlugs, ...englishToolSlugs])) {
    if (!chineseToolSlugs.has(slug)) failures.push(`Chinese search index is missing tool ${slug}`);
    if (!englishToolSlugs.has(slug)) failures.push(`English search index is missing tool ${slug}`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Search indexing smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Search indexing smoke test passed: noindex rules, payload counts, unique records, public tool coverage, API reference coverage, and Chinese/English parity are consistent.");
