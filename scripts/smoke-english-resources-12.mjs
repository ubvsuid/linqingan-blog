const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    headline: "How to Harvest Minerals with an Extractor Safely",
    indexTitle: "How to Harvest Minerals with an Extractor Safely",
    query: "Extractor",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    verificationSignals: ["Chinese source article", "Reviewed in full"],
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
    headline: "Use Storage Energy Without Crossing the Reserve or Misreading Transfers",
    indexTitle: "Screeps Storage Energy: Reserve Budgets and Verify Transfers",
    query: "Storage EVENT_TRANSFER",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    expectFaq: false,
    verificationSignals: ["Existing English route", "Preserved"],
    signals: [
      "createStorageEnergyCoordinator",
      "withdrawalRemaining",
      "targetReservations",
      "EVENT_TRANSFER",
      "verification-window-missed",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-power-spawn-process-power",
    chinesePath: "/blog/screeps-power-spawn-process-power",
    headline: "How to Process Power Without Breaking Your Energy Budget",
    indexTitle: "How to Process Power Without Breaking Your Energy Budget",
    query: "processPower",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    verificationSignals: ["Chinese source article", "Reviewed in full"],
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
  !storageBody.includes("storageEnergy - reserveEnergy")
  || !storageBody.includes("coordinator.withdrawalRemaining -= amount")
  || !storageBody.includes("coordinator.targetReservations[target.id]")
  || !storageBody.includes("event.objectId === pending.sourceId")
  || !storageBody.includes("event.data?.targetId === pending.targetId")
  || !storageBody.includes("event.data?.resourceType === RESOURCE_ENERGY")
  || !storageBody.includes("sourceId: storage.id")
  || !storageBody.includes("targetId: creep.id")
  || !storageBody.includes("sourceId: creep.id")
  || !storageBody.includes("targetId: target.id")
) {
  failures.push("Storage 页面缺少共享预算、容量预留或双向精确事件身份边界");
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
  console.error(`\n第十二批英文资源生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十二批英文资源生产冒烟测试通过：${articles.length} 篇文章、Mineral、Storage 精确事件、Power、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
