const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-move-fatigue-body-ratio",
    chinesePath: "/blog/screeps-move-fatigue-body-ratio",
    headline: "How to Calculate Screeps Creep Movement Speed",
    listingTitle: "How to Calculate Screeps Creep Movement Speed",
    query: "fatigue",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    reviewedInFullExpected: false,
    modifiedAt: "2026-08-12",
    signals: [
      "terrain being entered",
      "estimateCreepMovement(creep, terrain)",
      "Empty CARRY capacity does not add movement weight",
      "destroyed ordinary non-MOVE/non-CARRY parts still count",
      "part => part.type !== MOVE && part.type !== CARRY",
      "Engine source review",
      "Live multi-tick verification pending",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-roomposition-distance",
    chinesePath: "/blog/screeps-roomposition-distance",
    headline: "Which Screeps RoomPosition Distance Method Should You Use?",
    listingTitle: "Which Screeps RoomPosition Distance Method Should You Use?",
    query: "RoomPosition",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    reviewedInFullExpected: true,
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
    headline: "Turn a Room Route into One Validated Exit Step",
    listingTitle: "Screeps Game.map.findRoute(): Plan and Execute One Room Step",
    query: "findRoute",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    reviewedInFullExpected: true,
    signals: [
      "Game.map.describeExits(currentRoom)",
      "findClosestByPath",
      "range: 0",
      "Room-name patterns are not live safety evidence",
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
    "Chinese source article",
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
    ...(article.modifiedAt ? [`"dateModified":"${article.modifiedAt}"`] : []),
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少 “${expected}”`);
    }
  }

  if (body.includes("Reviewed in full") !== article.reviewedInFullExpected) {
    failures.push(`${article.path}: Reviewed in full 证据边界 expectation mismatch`);
  }

  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.listingTitle)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${article.listingTitle}”`);
  }
}

const fatigueBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-move-fatigue-body-ratio`,
)).text();
if (fatigueBody.includes("getTerrainName(\n    creep.room,\n    creep.pos")) {
  failures.push("MOVE 页面仍把当前脚下地形当作下一步成本");
}
if (fatigueBody.includes("part.hits > 0\n    && part.type !== MOVE\n    && part.type !== CARRY")) {
  failures.push("MOVE 页面仍错误地把被摧毁的普通非 MOVE/CARRY 部件从移动重量中移除");
}
for (const expected of [
  "countMovementWeight(creep)",
  "part => part.type !== MOVE && part.type !== CARRY",
  "activeMoveParts = creep.getActiveBodyparts(MOVE)",
  "activeCarry = creep.getActiveBodyparts(CARRY)",
  "currentFatigue: creep.fatigue",
]) {
  if (!fatigueBody.includes(expected)) {
    failures.push(`MOVE 页面缺少修正后的移动重量边界 “${expected}”`);
  }
}

const routeBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-map-find-route`,
)).text();
if (!routeBody.includes("const step = routeResult.steps[0]")) {
  failures.push("跨房间页面缺少当前房间的首步验证");
}
if (!routeBody.includes("status: 'exit-position-unreachable'")) {
  failures.push("跨房间页面缺少出口 tile 不可达状态");
}
if (routeBody.includes("currentPlan.steps.find(")) {
  failures.push("跨房间页面仍在整条旧路线中搜索出口");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.listingTitle)) {
      failures.push(`/en/blog-index.json: 缺少 “${article.listingTitle}”`);
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
  `第六批英文移动专题生产冒烟测试通过：${articles.length} 篇文章、移动重量损伤边界、跨房间首步与出口可达性、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);