const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-move-fatigue-body-ratio",
    chinesePath: "/blog/screeps-move-fatigue-body-ratio",
    headline: "How to Calculate Screeps Creep Movement Speed",
    query: "fatigue",
    signals: [
      "terrain being entered",
      "estimateCreepMovement(creep, terrain)",
      "Empty CARRY parts do not add weight",
      "Live multi-tick movement test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-roomposition-distance",
    chinesePath: "/blog/screeps-roomposition-distance",
    headline: "Which Screeps RoomPosition Distance Method Should You Use?",
    query: "RoomPosition",
    signals: [
      "isNearTo() includes the same tile",
      "const strictlyAdjacent = withinOne",
      "!sameTile",
      "Do not compare local coordinates across rooms",
      "Live path and target-selection test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-map-find-route",
    chinesePath: "/blog/screeps-map-find-route",
    headline: "How to Plan and Execute a Cross-Room Route in Screeps",
    query: "findRoute",
    signals: [
      "const step = currentPlan.steps[0]",
      "exits[step.exit] !== step.room",
      "No vision does not mean safe",
      "Live cross-room movement test",
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
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少 “${expected}”`);
    }
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

const fatigueBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-move-fatigue-body-ratio`,
)).text();
if (fatigueBody.includes("getTerrainName(\n    creep.room,\n    creep.pos")) {
  failures.push("MOVE 页面仍把当前脚下地形当作下一步成本");
}

const routeBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-map-find-route`,
)).text();
if (routeBody.includes("currentPlan.steps.find(")) {
  failures.push("跨房间页面仍在整条旧路线中搜索出口");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) {
      failures.push(`/en/blog-index.json: 缺少 “${article.headline}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, { redirect: "manual" });
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
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\n第六批英文移动专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第六批英文移动专题生产冒烟测试通过：${articles.length} 篇文章、三项语义修正、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);
