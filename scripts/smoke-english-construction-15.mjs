const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-room-create-construction-site",
    chinesePath: "/blog/screeps-room-create-construction-site",
    headline: "How to Create One Road Construction Site Safely",
    query: "createConstructionSite",
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
    headline: "How to Measure Construction Site Progress Without Guessing Completion Time",
    query: "progressTotal",
    signals: [
      "site.progress",
      "site.progressTotal",
      "site.pos.roomName",
      "unsupported ETA",
      "Live progress, completion replacement, deletion, invisible-room and multi-Builder test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-structure-destroy",
    chinesePath: "/blog/screeps-structure-destroy",
    headline: "How to Destroy a Misplaced Extension Without Hitting the Wrong Structure",
    query: "Structure.destroy",
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
  || !progressBody.includes("not enough to promise a tick count")
) {
  failures.push("工地进度页面缺少剩余量、房间标识或禁止 ETA 边界");
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
  console.error(`\n第十五批英文建造安全生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十五批英文建造安全生产冒烟测试通过：${articles.length} 篇文章、工地创建、进度与销毁边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
