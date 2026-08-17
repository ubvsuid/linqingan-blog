const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-mineral-extractor-harvest",
    chinesePath: "/blog/screeps-mineral-extractor-harvest",
    headline: "Verify Mineral Harvesting Without Trusting Store Deltas Alone",
    indexTitle: "Screeps Mineral Harvesting: Exact Miner and Mineral Event Identity",
    query: "EVENT_HARVEST mineral",
    tocId: "contract",
    tocHeading: "Define the Mineral harvest contract",
    expectFaq: false,
    signals: [
      "resolveMineralStation",
      "Memory.pendingMineralHarvests",
      "EVENT_HARVEST",
      "event.objectId === pending.creepId",
      "event.data?.targetId === pending.mineralId",
      "harvest-event-window-missed",
      "Live multi-tick verification",
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
    headline: "Verify Power Processing Without Inventing an Event",
    indexTitle: "Screeps processPower(): Single Dispatch and Local Resource Proof",
    query: "processPower verification",
    tocId: "evidence-limit",
    tocHeading: "Start with the missing event",
    expectFaq: false,
    signals: [
      "createPowerProcessingDispatcher",
      "Memory.pendingPowerProcessing",
      "POWER_SPAWN_ENERGY_RATIO",
      "local-signature-matches",
      "transfer-confounded",
      "does not currently create a Room event",
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
const hasMineralAmountBoundary =
  mineralBody.includes("event amount is based on harvest power")
  || (
    mineralBody.includes("event amount is based on body harvest power")
    && mineralBody.includes("actual Mineral removal")
    && mineralBody.includes("mineralAmount")
  );
if (
  !mineralBody.includes(".lookFor(LOOK_STRUCTURES)")
  || !mineralBody.includes("creep.harvest(mineral)")
  || !mineralBody.includes("event.event === EVENT_HARVEST")
  || !mineralBody.includes("event.objectId === pending.creepId")
  || !mineralBody.includes("event.data?.targetId === pending.mineralId")
  || !hasMineralAmountBoundary
) {
  failures.push("Mineral 页面缺少同格 Extractor、精确 Miner-to-Mineral 事件或金额边界");
}

const storageBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-storage-energy-usage`,
)).text();
if (
  !storageBody.includes("coordinator.withdrawalRemaining -= amount")
  || !storageBody.includes("coordinator.targetReservations[target.id]")
  || !storageBody.includes("event.objectId === pending.sourceId")
  || !storageBody.includes("event.data?.targetId === pending.targetId")
) {
  failures.push("Storage 页面缺少共享预算、容量预留或双向精确事件身份边界");
}

const powerBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-power-spawn-process-power`,
)).text();
if (
  !powerBody.includes("powerSpawn.processPower()")
  || !powerBody.includes("submittedIds.has(powerSpawn.id)")
  || !powerBody.includes("pending.before.power")
  || !powerBody.includes("EVENT_TRANSFER")
  || !powerBody.includes("event.data?.targetId === pending.powerSpawnId")
  || !powerBody.includes("Game.gpl.progress")
  || !powerBody.includes("Do not invent an")
) {
  failures.push("Power Spawn 页面缺少单次调度、本地资源签名、transfer confound 或无事件边界");
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

console.log(`第十二批英文资源生产冒烟测试通过：${articles.length} 篇文章、Mineral 精确事件、Storage 精确事件、Power 证据边界、Canonical、hreflang、JSON-LD、搜索与 Sitemap。`);
