const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    headline: "How to Harvest Minerals with an Extractor Safely",
    query: "Extractor",
    signals: [
      "findExtractorForMineral",
      "mineral.mineralAmount",
      "extractor.cooldown",
      "ERR_NOT_FOUND",
      "Live Mineral depletion, regeneration, Store and cooldown test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-storage-energy-usage",
    chinesePath: "/blog/screeps-storage-energy-usage",
    headline: "How to Use Storage Energy Without Draining Your Reserve",
    query: "Storage reserve",
    signals: [
      "getStorageWithdrawableEnergy",
      "storageEnergy - reserveEnergy",
      "delivery-target-not-found",
      "Live Storage reserve, pathing, same-tick capacity and delivery test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-power-spawn-process-power",
    chinesePath: "/blog/screeps-power-spawn-process-power",
    headline: "How to Process Power Without Breaking Your Energy Budget",
    query: "processPower",
    signals: [
      "POWER_SPAWN_ENERGY_RATIO",
      "PWR_OPERATE_POWER",
      "Game.gpl.progress",
      "room.powerSpawn",
      "Live GPL, Store, effect level and continuous processing test",
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

const mineralBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-mineral-extractor-harvest`,
)).text();
if (
  !mineralBody.includes("room.lookForAt")
  || !mineralBody.includes("extractor.pos.isEqualTo(mineral.pos)")
  || !mineralBody.includes("creep.harvest(mineral)")
) {
  failures.push("Mineral 页面缺少同格 Extractor 或采集调用边界");
}

const storageBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-storage-energy-usage`,
)).text();
if (
  !storageBody.includes("Math.max(0, storageEnergy - reserveEnergy)")
  || !storageBody.includes("creep.withdraw")
  || !storageBody.includes("creep.transfer")
) {
  failures.push("Storage 页面缺少保留线、取能或配送边界");
}

const powerBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-power-spawn-process-power`,
)).text();
if (
  !powerBody.includes("plannedPower * POWER_SPAWN_ENERGY_RATIO")
  || !powerBody.includes("powerSpawn.processPower")
  || !powerBody.includes("config.enabled !== true")
) {
  failures.push("Power Spawn 页面缺少资源比例、处理调用或显式开关");
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
  console.error(`\n第十二批英文资源生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十二批英文资源生产冒烟测试通过：${articles.length} 篇文章、Mineral、Storage 与 Power 边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
