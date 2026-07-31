const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    headline: "How to Switch a Screeps Creep Between Getting Energy and Working",
    listingTitle: "How to Switch a Screeps Creep Between Getting Energy and Working",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Source correction",
      "Current harvest() docs do not list ERR_FULL",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
    headline: "Resolve a Saved Screeps Target Without Guessing Why It Is Missing",
    listingTitle: "Screeps Game.getObjectById(): Resolve Saved Targets Safely",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Technical correction",
      "Object lookup, visibility interpretation, type validation, invalidation, reselection, and actions are separated",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    headline: "Clean Dead Creep Memory Without Deleting Unrelated State",
    listingTitle: "Screeps Dead Creep Memory: Clean Names and Owned Indexes",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Technical correction",
      "Existence detection, owned-index cleanup, shared references, and death cause are separated",
      "Live multi-tick verification",
      "Pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: 预期 200，实际 ${response.status}`);
    continue;
  }

  for (const expected of [article.headline, ...article.verification]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少预期内容 “${expected}”`);
    }
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
  }
}

const targetBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-get-object-by-id`,
)).text();
for (const expected of [
  "Game.getObjectById(record.id)",
  "vision-unavailable",
  "missing-visible-room",
  "wrong-type",
]) {
  if (!targetBody.includes(expected)) {
    failures.push(`Saved target page is missing “${expected}”`);
  }
}

const cleanupBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-clean-dead-creep-memory`,
)).text();
for (const expected of [
  "Object.hasOwn(gameCreeps, name)",
  "cleanOwnedCreepIndexes(name)",
  "runRoleCounts()",
  "ticksToLive === 1",
]) {
  if (!cleanupBody.includes(expected)) {
    failures.push(`Dead Creep Memory page is missing “${expected}”`);
  }
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.listingTitle)) {
      failures.push(`/en/blog-index.json: 缺少文章 “${article.listingTitle}”`);
    }
  }
}

const searchResponse = await fetch(`${baseUrl}/en/search?q=Memory`, {
  redirect: "manual",
});
const searchBody = await searchResponse.text();
if (searchResponse.status !== 200) {
  failures.push(`/en/search: 预期 200，实际 ${searchResponse.status}`);
} else {
  for (const article of articles) {
    if (!searchBody.includes(article.listingTitle)) {
      failures.push(`/en/search: 缺少服务端相关结果 “${article.listingTitle}”`);
    }
  }
  if (searchBody.includes("How to Launch a Nuke Without Reusing a Stale Target Request")) {
    failures.push("/en/search: 首屏仍嵌入与 Memory 查询无关的完整文章索引");
  }
}

const searchIndexResponse = await fetch(`${baseUrl}/en/search-index.json`, {
  redirect: "manual",
});
const searchIndexBody = await searchIndexResponse.text();
if (searchIndexResponse.status !== 200) {
  failures.push(`/en/search-index.json: 预期 200，实际 ${searchIndexResponse.status}`);
} else {
  const contentType = searchIndexResponse.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    failures.push(`/en/search-index.json: Content-Type 不是 application/json`);
  }
  for (const article of articles) {
    if (!searchIndexBody.includes(article.listingTitle)) {
      failures.push(`/en/search-index.json: 缺少文章 “${article.listingTitle}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第二批英文专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第二批英文专题生产冒烟测试通过：${articles.length} 篇文章、Saved target与Dead Creep Memory边界、Verification、目录锚点、Canonical、hreflang、JSON-LD、英文目录、渐进式搜索与 Sitemap。`,
);
