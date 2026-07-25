const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-link-transfer-energy",
    chinesePath: "/blog/screeps-link-transfer-energy",
    headline: "How to Transfer Link Energy Without Depending on Structure Array Order",
    query: "transferEnergy",
    signals: [
      "getOwnedLink",
      "LINK_LOSS_RATIO",
      "sourceLink.transferEnergy",
      "targetReserve",
      "minimumSend",
      "Live loss rounding, cooldown distance, concurrent send, Store and target-reserve test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-select-source-by-path",
    chinesePath: "/blog/screeps-select-source-by-path",
    headline: "How to Select an Active Source by Reachable Path Without Target Churn",
    query: "FIND_SOURCES_ACTIVE",
    signals: [
      "countAssignmentsBySource",
      "selectSourceCandidate",
      "findPathTo",
      "Game.getObjectById(sourceId)",
      "creep.getActiveBodyparts(WORK)",
      "Live multi-Source pathing, traffic, regeneration, assignment contention, remote visibility and CPU test",
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

const linkBody = await (await fetch(`${baseUrl}/en/blog/screeps-link-transfer-energy`)).text();
if (
  !linkBody.includes("sourceLink.room.name === targetLink.room.name")
  || !linkBody.includes("Math.max(0, input.targetFree - input.targetReserve)")
  || !linkBody.includes("sourceLink.transferEnergy")
  || !linkBody.includes("estimateLinkTransfer")
) {
  failures.push("Link 页面缺少同房间、保留容量、传输或损耗估算边界");
}

const sourceBody = await (await fetch(`${baseUrl}/en/blog/screeps-select-source-by-path`)).text();
if (
  !sourceBody.includes("FIND_SOURCES_ACTIVE")
  || !sourceBody.includes("left.pathLength - right.pathLength")
  || !sourceBody.includes("left.assignmentCount - right.assignmentCount")
  || !sourceBody.includes("delete creep.memory.sourceId")
) {
  failures.push("Source 页面缺少活跃查询、路径、分配或动态清除边界");
}

const blogResponse = await fetch(`${baseUrl}/en/blog`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) failures.push(`/en/blog: 缺少 “${article.headline}”`);
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
  console.error(`\n第十八批英文 Link 与 Source 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十八批英文 Link 与 Source 生产冒烟测试通过：${articles.length} 篇文章、Link transfer 与 Source selection 边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
