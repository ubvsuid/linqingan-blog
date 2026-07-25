const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-controller-activate-safe-mode",
    chinesePath: "/blog/screeps-controller-activate-safe-mode",
    headline: "How to Activate Safe Mode Without Accidental Repeated Use",
    query: "activateSafeMode",
    signals: [
      "ACTIVATE_SAFE_MODE",
      "request.enabled = false",
      "controller.activateSafeMode()",
      "safeModeAvailable",
      "Live activation, same-shard busy state, charge consumption and next-tick Controller test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-controller-downgrade",
    chinesePath: "/blog/screeps-controller-downgrade",
    headline: "How to Detect Controller Downgrade Risk and Recover Safely",
    query: "ticksToDowngrade",
    signals: [
      "CONTROLLER_DOWNGRADE",
      "emergencyThreshold",
      "recoveryThreshold",
      "upgrader.upgradeController",
      "Live downgrade timer, recovery hysteresis, upgrader supply and Controller progress test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-reserve-vs-claim-controller",
    chinesePath: "/blog/screeps-reserve-vs-claim-controller",
    headline: "How to Choose Between Reserving and Claiming a Controller",
    query: "reserveController",
    signals: [
      "creep.reserveController(controller)",
      "creep.claimController(controller)",
      "claimConfirmed",
      "mission.enabled = false",
      "Live reservation renewal, 5,000-tick cap, GCL claim, hostile reservation and next-tick state test",
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

const safeModeBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-controller-activate-safe-mode`,
)).text();
if (
  !safeModeBody.includes("request.enabled = false")
  || !safeModeBody.includes("controller.activateSafeMode()")
  || !safeModeBody.includes("ERR_BUSY")
) {
  failures.push("Safe Mode 页面缺少调用前关闭、激活调用或 same-shard busy 边界");
}

const downgradeBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-controller-downgrade`,
)).text();
if (
  !downgradeBody.includes("recoveryThreshold")
  || !downgradeBody.includes("getActiveBodyparts(WORK)")
  || !downgradeBody.includes("range: 3")
) {
  failures.push("Controller downgrade 页面缺少恢复阈值、有效 WORK 或范围 3 边界");
}

const missionBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-reserve-vs-claim-controller`,
)).text();
if (
  !missionBody.includes("claimConfirmed")
  || !missionBody.includes("ownedRoomCount >= input.gclLevel")
  || !missionBody.includes("mission.enabled = false")
) {
  failures.push("Reserve/Claim 页面缺少人工确认、GCL 或 claim 一次性完成边界");
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
  console.error(`\n第十四批英文 Controller 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十四批英文 Controller 生产冒烟测试通过：${articles.length} 篇文章、Safe Mode、降级恢复与 Reserve/Claim 边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
