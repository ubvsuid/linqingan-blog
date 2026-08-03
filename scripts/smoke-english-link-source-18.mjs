const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-link-transfer-energy",
    chinesePath: "/blog/screeps-link-transfer-energy",
    headline: "Coordinate Link Transfers and Verify the Exact Source-Target Event",
    indexTitle: "Screeps Link transferEnergy(): Coordinate Capacity and Verify Events",
    query: "EVENT_TRANSFER",
    signals: [
      "planLinkTransfers",
      "remainingTargetCapacity",
      "lastDispatchAt",
      "EVENT_TRANSFER",
      "verifyLinkTransfers",
      "verification-window-missed",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-select-source-by-path",
    chinesePath: "/blog/screeps-select-source-by-path",
    headline: "Select a Reachable Source Without Treating a Partial Path as Success",
    indexTitle: "Screeps Source Selection: Complete Paths and Stable Assignments",
    query: "PathFinder incomplete",
    signals: [
      "PathFinder.search",
      "result.incomplete",
      "OBSTACLE_OBJECT_TYPES",
      "countOtherSourceAssignments",
      "EVENT_HARVEST",
      "complete-active-source-not-found",
      "Live multi-tick verification",
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
    "Existing English route",
    "Preserved",
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#use-this-guide"`,
    `<h2 id="use-this-guide">Use this guide when</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: 缺少 “${expected}”`);
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: 空 FAQ 不应输出 FAQPage`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.indexTitle)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${article.indexTitle}”`);
  }
}

const linkBody = await (await fetch(`${baseUrl}/en/blog/screeps-link-transfer-energy`)).text();
if (
  !linkBody.includes("link.room.name !== roomName")
  || !linkBody.includes("remainingTargetCapacity")
  || !linkBody.includes("estimate.estimatedReceived")
  || !linkBody.includes("source.transferEnergy")
  || !linkBody.includes("event.objectId === pending.sourceId")
  || !linkBody.includes("event.data?.targetId === pending.targetId")
  || !linkBody.includes("state.lastDispatchAt === Game.time")
) {
  failures.push("Link 页面缺少显式房间身份、共享容量预留、传输、源目标事件身份或单 Tick 调度边界");
}

const sourceBody = await (await fetch(`${baseUrl}/en/blog/screeps-select-source-by-path`)).text();
if (
  !sourceBody.includes("FIND_SOURCES_ACTIVE")
  || !sourceBody.includes("PathFinder.search")
  || !sourceBody.includes("result.incomplete !== true")
  || !sourceBody.includes("OBSTACLE_OBJECT_TYPES.includes")
  || !sourceBody.includes("left.pathLength - right.pathLength")
  || !sourceBody.includes("left.assignmentCount - right.assignmentCount")
  || !sourceBody.includes("event.event === EVENT_HARVEST")
  || !sourceBody.includes("event.objectId === pending.creepId")
  || !sourceBody.includes("event.data?.targetId === pending.sourceId")
) {
  failures.push("Source 页面缺少活跃查询、完整路径、静态障碍、稳定排序或 Creep-Source 采集事件身份边界");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.indexTitle)) failures.push(`/en/blog-index.json: 缺少 “${article.indexTitle}”`);
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

console.log(`第十八批英文 Link 与 Source 生产冒烟测试通过：${articles.length} 篇文章、Link 协调、完整 Source 路径、精确事件验证、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
