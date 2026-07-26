const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-nuker-launch",
    chinesePath: "/blog/screeps-nuker-launch-checklist",
    headline: "How to Launch a Nuke Without Reusing a Stale Target Request",
    query: "launchNuke",
    signals: [
      "buildNukeConfirmation",
      "NUKE_RANGE",
      "NUKER_ENERGY_CAPACITY",
      "NUKER_GHODIUM_CAPACITY",
      "nuker.launchNuke(target)",
      "Live protected-area, launch, cooldown, target Nuke object and resource-consumption test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-rampart-set-public",
    chinesePath: "/blog/screeps-rampart-set-public",
    headline: "How to Change Rampart Access Without Treating Public as an Ally List",
    query: "setPublic",
    signals: [
      "buildRampartConfirmation",
      "Game.structures[rampart.id]",
      "rampart.setPublic(request.public)",
      "state-already-matches",
      "Live public/private passage, object replacement, ownership and next-tick state test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-wall-rampart-repair-limit",
    chinesePath: "/blog/screeps-wall-rampart-repair-limit",
    headline: "How to Repair Fortifications to a Room-Specific Stage Instead of hitsMax",
    query: "Rampart repair limit",
    signals: [
      "selectDefenseRepairTarget",
      "STRUCTURE_WALL",
      "STRUCTURE_RAMPART",
      "creep.getActiveBodyparts(WORK)",
      "range: 3",
      "Live repair, boosts, pathing, stage completion, RCL hitsMax and multi-repairer test",
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

const nukeBody = await (await fetch(`${baseUrl}/en/blog/screeps-nuker-launch`)).text();
if (
  !nukeBody.includes("request.enabled = false")
  || !nukeBody.includes("Game.map.getRoomLinearDistance")
  || !nukeBody.includes("nuker.launchNuke(target)")
  || !nukeBody.includes("targetVisible")
) {
  failures.push("Nuker 页面缺少一次性关闭、距离、发射或可见性边界");
}

const rampartBody = await (await fetch(`${baseUrl}/en/blog/screeps-rampart-set-public`)).text();
if (
  !rampartBody.includes("'SET_RAMPART_' + state + '_' + roomName + '_' + x + '_' + y")
  || !rampartBody.includes("Game.structures[rampart.id]")
  || !rampartBody.includes("request.enabled = false")
  || !rampartBody.includes("rampart.setPublic(request.public)")
) {
  failures.push("Rampart 页面缺少状态绑定、所有权、一次性关闭或 setPublic 边界");
}

const repairBody = await (await fetch(`${baseUrl}/en/blog/screeps-wall-rampart-repair-limit`)).text();
if (
  !repairBody.includes("structure.hits < hitsLimit")
  || !repairBody.includes("structure.hits < structure.hitsMax")
  || !repairBody.includes("creep.getActiveBodyparts(WORK)")
  || !repairBody.includes("range: 3")
) {
  failures.push("防御维修页面缺少阶段、hitsMax、有效 WORK 或范围 3 边界");
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
  console.error(`\n第十七批英文防御操作生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十七批英文防御操作生产冒烟测试通过：${articles.length} 篇文章、Nuker、Rampart access 与 staged repair 边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
