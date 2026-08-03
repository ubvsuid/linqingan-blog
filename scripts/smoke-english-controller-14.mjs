const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-controller-activate-safe-mode",
    chinesePath: "/blog/screeps-controller-activate-safe-mode",
    headline: "How to Activate Safe Mode Without Accidental Repeated Use",
    query: "activateSafeMode",
    expectFaq: true,
    verificationSignals: ["Chinese source article", "Reviewed in full"],
    sectionSignals: [
      `href="#quick-answer"`,
      `<h2 id="quick-answer">Quick answer</h2>`,
    ],
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
    headline: "Recover a Downgrading Controller Without Hiding Failed Upgrade Ticks",
    indexTitle: "Screeps Controller Downgrade Recovery: Verify Emergency Upgrades",
    query: "upgradeBlocked",
    expectFaq: false,
    verificationSignals: ["Existing English route", "Preserved"],
    sectionSignals: [
      `href="#use-this-guide"`,
      `<h2 id="use-this-guide">Use this guide when</h2>`,
    ],
    signals: [
      "decideControllerRecovery",
      "controller.upgradeBlocked",
      "EVENT_UPGRADE_CONTROLLER",
      "verifyRecoveryUpgrade",
      "verification-window-missed",
      "Live multi-tick verification",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-reserve-vs-claim-controller",
    chinesePath: "/blog/screeps-reserve-vs-claim-controller",
    headline: "Reserve or Claim a Controller Without Losing Mission Identity",
    indexTitle: "Screeps reserveController() vs claimController(): Verify the Exact Mission",
    query: "EVENT_RESERVE_CONTROLLER",
    expectFaq: false,
    verificationSignals: ["Official engine", "Claim boundary"],
    sectionSignals: [
      `href="#operation-contract"`,
      `<h2 id="operation-contract">Separate mission choice from operation proof</h2>`,
    ],
    signals: [
      "resolveControllerMission",
      "Memory.pendingControllerOperations",
      "EVENT_RESERVE_CONTROLLER",
      "event.objectId === pending.creepId",
      "claim-owner-observed",
      "reserve-event-window-missed",
      "Live reserve event, claim ownership, hostile reservation and missed-window verification",
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
    ...article.sectionSignals,
    `"@type":"BlogPosting"`,
    ...(article.expectFaq ? [`"@type":"FAQPage"`] : []),
  ]) {
    if (!body.includes(expected)) failures.push(`${article.path}: 缺少 “${expected}”`);
  }

  if (!article.expectFaq && body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: 空 FAQ 不应输出 FAQPage`);
  }

  const indexedTitle = article.indexTitle ?? article.headline;
  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(indexedTitle)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${indexedTitle}”`);
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
  !downgradeBody.includes("enterAt")
  || !downgradeBody.includes("leaveAt")
  || !downgradeBody.includes("getActiveBodyparts(CARRY)")
  || !downgradeBody.includes("controller.upgradeBlocked")
  || !downgradeBody.includes("EVENT_UPGRADE_CONTROLLER")
  || !downgradeBody.includes("range: 3")
) {
  failures.push("Controller downgrade 页面缺少滞回、CARRY、upgradeBlocked、事件验证或范围 3 边界");
}

const missionBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-reserve-vs-claim-controller`,
)).text();
if (
  !missionBody.includes("mission.controllerId !== controller.id")
  || !missionBody.includes("Memory.pendingControllerOperations")
  || !missionBody.includes("event.event === EVENT_RESERVE_CONTROLLER")
  || !missionBody.includes("event.objectId === pending.creepId")
  || !missionBody.includes("does not include a Controller")
  || !missionBody.includes("claimController() has no Room event")
  || !missionBody.includes("controller.owner?.username === pending.username")
) {
  failures.push("Reserve/Claim 页面缺少任务身份、Reserve事件边界或Claim所有权验证");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    const indexedTitle = article.indexTitle ?? article.headline;
    if (!blogBody.includes(indexedTitle)) failures.push(`/en/blog-index.json: 缺少 “${indexedTitle}”`);
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

console.log(`第十四批英文 Controller 生产冒烟测试通过：${articles.length} 篇文章、Safe Mode、降级恢复、精确 Reserve 事件与 Claim 所有权验证、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
