const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-flags-configuration",
    chinesePath: "/blog/screeps-flags-config",
    headline: "How to Use Flags as Reviewed Configuration Instead of Hidden Automation",
    query: "Game.flags",
    signals: [
      "Game.flags[name]",
      "flag.memory",
      "Game.getObjectById(sourceId)",
      "nearest-visible-fallback",
      "Live Flag rename, removal, invisible-room and object replacement test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-require-modules",
    chinesePath: "/blog/screeps-modules-require",
    headline: "How to Split Screeps Code into Modules Without Caching Stale Game Objects",
    query: "require modules",
    signals: [
      "module.exports.loop",
      "module.exports = { run }",
      "cachedHarvesters",
      "getCurrentHarvesters",
      "Live module loading, syntax failure, global reset, role routing and stale-object test",
      "Pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: 预期 200，实际 ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [
    article.headline,
    "Verification status",
    "Chinese source article",
    "Reviewed in full",
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#quick-answer"`,
    `<h2 id="quick-answer">Quick answer</h2>`,
    `"@type":"BlogPosting"`,
    `"@type":"FAQPage"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: 缺少 “${expected}”`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.headline)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${article.headline}”`);
  }
}

const flagsBody = await (await fetch(`${baseUrl}/en/blog/screeps-flags-configuration`)).text();
if (
  !flagsBody.includes("Game.flags[name]")
  || !flagsBody.includes("Game.getObjectById(sourceId)")
  || !flagsBody.includes("nearest-visible-fallback")
) {
  failures.push("Flags 页面缺少精确名称、对象恢复或窄回退边界");
}

const modulesBody = await (await fetch(`${baseUrl}/en/blog/screeps-require-modules`)).text();
if (
  !modulesBody.includes("module.exports.loop")
  || !modulesBody.includes("module.exports = { run }")
  || !modulesBody.includes("cachedHarvesters")
  || !modulesBody.includes("getCurrentHarvesters")
) {
  failures.push("模块页面缺少单一 loop、角色契约或 tick 快照边界");
}

const duplicateResponse = await fetch(
  `${baseUrl}/en/blog/screeps-memory-write-safety`,
  { redirect: "manual" },
);
const redirectLocation = duplicateResponse.headers.get("location");
if (duplicateResponse.status !== 308) {
  failures.push(`/en/blog/screeps-memory-write-safety: 预期永久跳转 308，实际 ${duplicateResponse.status}`);
}
if (redirectLocation !== "/en/blog/screeps-memory-basics") {
  failures.push(`/en/blog/screeps-memory-write-safety: 跳转目标错误 ${redirectLocation}`);
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) failures.push(`/en/blog-index.json: 缺少 “${article.headline}”`);
  }
  if (blogBody.includes("How to Write Screeps Memory Without Losing Data or Saving Live Objects")) {
    failures.push("/en/blog: 仍展示重复 Memory 页面");
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) failures.push(`/sitemap.xml: 缺少 ${expected}`);
  }
  if (sitemapBody.includes("https://www.linqingan.com/en/blog/screeps-memory-write-safety")) {
    failures.push("/sitemap.xml: 仍包含重复 Memory 页面");
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n第十六批英文配置与模块生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十六批英文配置与模块生产冒烟测试通过：${articles.length} 篇唯一来源文章、Memory 旧 URL 永久跳转、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
