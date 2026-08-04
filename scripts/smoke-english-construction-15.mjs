const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-room-create-construction-site",
    chinesePath: "/blog/screeps-room-create-construction-site",
    headline: "How to Create One Road Construction Site Safely",
    indexTitle: "How to Create One Road Construction Site Safely",
    query: "createConstructionSite",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    verificationSignals: ["Chinese source article", "Reviewed in full"],
    signals: [
      "MAX_CONSTRUCTION_SITES",
      "TERRAIN_MASK_WALL",
      "request.enabled = false",
      "room.createConstructionSite",
      "Live Road placement, wall terrain, RCL, special-tile and site-limit test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-construction-site-progress",
    chinesePath: "/blog/screeps-construction-site-progress",
    headline: "Measure Construction Progress and Verify the Exact Builder Event",
    indexTitle: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
    query: "EVENT_BUILD progress",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    expectFaq: false,
    verificationSignals: ["Existing English route", "Preserved"],
    signals: [
      "summarizeConstructionProgress",
      "submitTrackedBuild",
      "EVENT_BUILD",
      "verification-window-missed",
      "build-event-verified-site-completed",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-structure-destroy",
    chinesePath: "/blog/screeps-structure-destroy",
    headline: "How to Destroy a Misplaced Extension Without Hitting the Wrong Structure",
    indexTitle: "How to Destroy a Misplaced Extension Without Hitting the Wrong Structure",
    query: "Structure.destroy",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    verificationSignals: ["Chinese source article", "Reviewed in full"],
    signals: [
      "DESTROY_EXTENSION",
      "Game.structures",
      "structure.destroy()",
      "FIND_HOSTILE_CREEPS",
      "Live Extension removal, hostile-room busy state, capacity impact and coordinate verification test",
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
    ...article.verificationSignals,
    "Screeps Console test",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: 缺少 “${expected}”`);
  }

  if (body.includes(`"@type":"FAQPage"`) !== article.expectFaq) {
    failures.push(`${article.path}: FAQPage 预期不一致`);
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

const createBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-room-create-construction-site`,
)).text();
if (
  !createBody.includes("request.enabled = false")
  || !createBody.includes("MAX_CONSTRUCTION_SITES")
  || !createBody.includes("room.createConstructionSite")
) {
  failures.push("工地创建页面缺少一次性关闭、站点上限或创建调用边界");
}

const progressBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-construction-site-progress`,
)).text();
if (
  !progressBody.includes("Math.max(0, total - progress)")
  || !progressBody.includes("site.pos.roomName")
  || !progressBody.includes("creep.pos.inRangeTo(site, 3)")
  || !progressBody.includes("event.objectId === pending.builderId")
  || !progressBody.includes("event.data?.targetId === pending.siteId")
  || !progressBody.includes("findCompletedStructure(room, pending)")
  || !progressBody.includes("structure-observed-without-matching-event")
  || !progressBody.includes("not a tick or wall-clock promise")
) {
  failures.push("工地进度页面缺少进度、Builder/Site 事件身份、完成/删除或禁止 ETA 边界");
}

const destroyBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-structure-destroy`,
)).text();
if (
  !destroyBody.includes("DESTROY_EXTENSION")
  || !destroyBody.includes("Game.structures[structure.id]")
  || !destroyBody.includes("request.enabled = false")
  || !destroyBody.includes("structure.destroy()")
) {
  failures.push("结构销毁页面缺少确认、所有权、一次性关闭或销毁调用边界");
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
  console.error(`\n第十五批英文建造安全生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十五批英文建造安全生产冒烟测试通过：${articles.length} 篇文章、工地创建、精确 Builder 事件、销毁、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
