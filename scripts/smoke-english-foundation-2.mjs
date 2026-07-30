const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    headline: "How to Switch a Screeps Creep Between Getting Energy and Working",
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
    headline: "How to Restore a Screeps Target from Memory with Game.getObjectById()",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Visibility rule",
      "Only objects in currently visible rooms are accessible",
      "Live remote-vision test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    headline: "How to Clean Dead Creep Memory Safely in Screeps",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Deletion boundary",
      "Only name-indexed structures explicitly managed by the script",
      "Live death-and-replacement cycle",
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
    `href="#quick-answer"`,
    `<h2 id="quick-answer">Quick answer</h2>`,
    `"@type":"BlogPosting"`,
    `"@type":"FAQPage"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) {
      failures.push(`/en/blog-index.json: 缺少新文章 “${article.headline}”`);
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
    if (!searchBody.includes(article.headline)) {
      failures.push(`/en/search: 缺少服务端相关结果 “${article.headline}”`);
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
    if (!searchIndexBody.includes(article.headline)) {
      failures.push(`/en/search-index.json: 缺少新文章 “${article.headline}”`);
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
  `第二批英文专题生产冒烟测试通过：${articles.length} 篇文章、Verification、目录锚点、Canonical、hreflang、JSON-LD、英文目录、渐进式搜索与 Sitemap。`,
);
