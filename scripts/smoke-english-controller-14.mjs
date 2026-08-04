const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-controller-activate-safe-mode",
    chinesePath: "/blog/screeps-controller-activate-safe-mode",
    headline: "Activate Safe Mode Once Without Losing the Final Controller Intent",
    indexTitle: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite",
    query: "activateSafeMode",
    tocAnchor: "failure-mode",
    firstHeading: "The failure mode: two OK results, one surviving intent",
    expectsFaq: false,
    signals: [
      "only the last intent survives",
      "one final per-tick dispatcher",
      "request.enabled = false",
      "controller.activateSafeMode()",
      "accepted-pending",
      "overwritten-or-conflicted",
      "Live same-tick overwrite, activation, charge consumption and next-tick Controller test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-controller-downgrade",
    chinesePath: "/blog/screeps-controller-downgrade",
    headline: "How to Detect Controller Downgrade Risk and Recover Safely",
    indexTitle: "How to Detect Controller Downgrade Risk and Recover Safely",
    query: "ticksToDowngrade",
    tocAnchor: "quick-answer",
    firstHeading: "Quick answer",
    expectsFaq: true,
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
    indexTitle: "How to Choose Between Reserving and Claiming a Controller",
    query: "reserveController",
    tocAnchor: "quick-answer",
    firstHeading: "Quick answer",
    expectsFaq: true,
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
    `href="#${article.tocAnchor}"`,
    `<h2 id="${article.tocAnchor}">${article.firstHeading}</h2>`,
    `"@type":"BlogPosting"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: 缺少 “${expected}”`);
  }

  const hasFaqPage = body.includes(`"@type":"FAQPage"`);
  if (article.expectsFaq && !hasFaqPage) {
    failures.push(`${article.path}: 缺少 FAQPage`);
  }
  if (!article.expectsFaq && hasFaqPage) {
    failures.push(`${article.path}: 不应输出 FAQPage`);
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

const safeModeBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-controller-activate-safe-mode`,
)).text();
if (
  !safeModeBody.includes("request.enabled = false")
  || !safeModeBody.includes("controller.activateSafeMode()")
  || !safeModeBody.includes("ERR_BUSY")
  || !safeModeBody.includes("only the last intent survives")
  || !safeModeBody.includes("Memory.safeModePending")
  || !safeModeBody.includes("overwritten-or-conflicted")
) {
  failures.push("Safe Mode 页面缺少调用前关闭、单次最终提交、精确 pending 身份或同 tick 覆盖边界");
}
if (safeModeBody.includes(`"@type":"FAQPage"`)) {
  failures.push("Safe Mode 页面已移除重复 FAQ，不应继续输出 FAQPage");
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
  console.error(`\n第十四批英文 Controller 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十四批英文 Controller 生产冒烟测试通过：${articles.length} 篇文章、Safe Mode 最终意图身份、降级恢复与 Reserve/Claim 边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);