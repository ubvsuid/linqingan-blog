const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-cpu-getused-bucket",
    chinesePath: "/blog/screeps-cpu-getused-bucket",
    headline: "How to Measure and Control CPU Usage in Screeps",
    query: "Game.cpu.getUsed",
    signals: [
      "The Simulation reports <code>0</code>",
      "bucketBand !== 'critical'",
      "Live shard CPU and multi-tick bucket test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-global-cache",
    chinesePath: "/blog/screeps-global-cache",
    headline: "How to Build a Safe Global Cache in Screeps",
    query: "global cache",
    signals: [
      "Global cache is disposable acceleration",
      "Do not cache live game objects",
      "Game.getObjectById(id)",
      "Live global reset, CPU and multi-tick invalidation test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-rawmemory-segments",
    chinesePath: "/blog/screeps-rawmemory-segments",
    headline: "How to Use RawMemory Segments Safely in Screeps",
    query: "RawMemory Segments",
    signals: [
      "setActiveSegments() schedules availability for the next tick",
      "raw === undefined",
      "RawMemory.setActiveSegments(active)",
      "100 * 1024",
      "Live segment activation, persistence and multi-module test",
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

const cpuBody = await (await fetch(`${baseUrl}/en/blog/screeps-cpu-getused-bucket`)).text();
if (!cpuBody.includes("typeof essential !== 'function'") || !cpuBody.includes("remainingToHardLimit > reserveCpu")) {
  failures.push("CPU 页面缺少必要任务与硬预算边界");
}

const cacheBody = await (await fetch(`${baseUrl}/en/blog/screeps-global-cache`)).text();
if (!cacheBody.includes("cloneJsonValue(entry.value)") || !cacheBody.includes("global.runtimeCache ??= new Map()")) {
  failures.push("Global cache 页面缺少克隆隔离或重建入口");
}

const segmentBody = await (await fetch(`${baseUrl}/en/blog/screeps-rawmemory-segments`)).text();
if (!segmentBody.includes("manager.requested.clear()") || !segmentBody.includes("slice(0, 10)")) {
  failures.push("Segments 页面缺少单次管理器或 10 个上限");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) failures.push(`/en/blog-index.json: 缺少 “${article.headline}”`);
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
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n第八批英文运行时与存储生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第八批英文运行时与存储生产冒烟测试通过：${articles.length} 篇文章、三项运行时边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
