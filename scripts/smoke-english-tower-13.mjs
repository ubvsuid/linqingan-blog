const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-tower-auto-attack-hostiles",
    chinesePath: "/blog/screeps-tower-auto-attack-hostiles",
    headline: "How to Make Towers Attack Hostiles with Explainable Priorities",
    query: "Tower attack",
    signals: [
      "FIND_HOSTILE_CREEPS",
      "getTowerThreatScore",
      "TOWER_ENERGY_COST",
      "tower.attack(target)",
      "Live Tower damage, falloff, boost, diplomacy and multi-Tower focus test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-tower-heal-creeps",
    chinesePath: "/blog/screeps-tower-heal-creeps",
    headline: "How to Make Towers Heal the Creep That Needs It Most",
    query: "Tower heal",
    signals: [
      "left.hits / left.hitsMax",
      "tower.heal(target)",
      "chooseTowerMode",
      "Live Tower heal, falloff, boost, over-heal and multi-target allocation test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-tower-repair-threshold",
    chinesePath: "/blog/screeps-tower-repair-threshold",
    headline: "How to Repair Structures with Towers Without Spending Defense Energy",
    query: "Tower repair",
    signals: [
      "reserve + TOWER_ENERGY_COST",
      "STRUCTURE_WALL",
      "STRUCTURE_RAMPART",
      "tower.repair(target)",
      "Live Tower repair, falloff, power effect, over-repair and reserve test",
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

const attackBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-tower-auto-attack-hostiles`,
)).text();
if (
  !attackBody.includes("allowedUsers")
  || !attackBody.includes("getActiveBodyparts")
  || !attackBody.includes("tower.attack(target)")
) {
  failures.push("Tower attack 页面缺少外交、活跃部件或攻击调用边界");
}

const healBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-tower-heal-creeps`,
)).text();
if (
  !healBody.includes("left.hits / left.hitsMax")
  || !healBody.includes("right.hitsMax - right.hits")
  || !healBody.includes("tower.heal(target)")
) {
  failures.push("Tower heal 页面缺少受伤比例、缺失 hits 或治疗调用边界");
}

const repairBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-tower-repair-threshold`,
)).text();
if (
  !repairBody.includes("reserve + TOWER_ENERGY_COST")
  || !repairBody.includes("STRUCTURE_WALL")
  || !repairBody.includes("STRUCTURE_RAMPART")
  || !repairBody.includes("tower.repair(target)")
) {
  failures.push("Tower repair 页面缺少保留线、堡垒排除或维修调用边界");
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
  console.error(`\n第十三批英文 Tower 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十三批英文 Tower 生产冒烟测试通过：${articles.length} 篇文章、攻击、治疗与维修优先级、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
