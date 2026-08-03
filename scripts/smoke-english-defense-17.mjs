const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-nuker-launch",
    chinesePath: "/blog/screeps-nuker-launch-checklist",
    headline: "Launch a Nuke Once and Preserve the Exact Operation Record",
    indexTitle: "Screeps launchNuke(): Exact Target Records and Post-Launch Proof",
    query: "launchNuke verification",
    tocId: "evidence-contract",
    tocHeading: "Use two evidence layers",
    expectFaq: false,
    signals: [
      "buildNukeConfirmation",
      "Memory.pendingNukeLaunches",
      "accepted-awaiting-verification",
      "launcher-signature-observed",
      "FIND_NUKES",
      "nuke.launchRoomName",
      "target-evidence-unavailable",
      "Live protected-area rejection, launch, cooldown, resource consumption and target Nuke observation",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-rampart-set-public",
    chinesePath: "/blog/screeps-rampart-set-public",
    headline: "How to Change Rampart Access Without Treating Public as an Ally List",
    indexTitle: "How to Change Rampart Access Without Treating Public as an Ally List",
    query: "setPublic",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    expectFaq: true,
    signals: ["buildRampartConfirmation", "rampart.setPublic(request.public)", "state-already-matches", "Pending"],
  },
  {
    path: "/en/blog/screeps-wall-rampart-repair-limit",
    chinesePath: "/blog/screeps-wall-rampart-repair-limit",
    headline: "Repair Walls and Ramparts Without Hiding Duplicate Work",
    indexTitle: "Screeps Fortification Repair: Stages, Reservations, and Event Proof",
    query: "EVENT_REPAIR",
    tocId: "decision-model",
    tocHeading: "Separate the repair stage from target identity",
    expectFaq: false,
    signals: [
      "createRepairCoordinator",
      "reservedTargets",
      "Memory.pendingFortificationRepairs",
      "EVENT_REPAIR",
      "event.objectId === pending.creepId",
      "event.data?.targetId === pending.targetId",
      "repair-event-window-missed",
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

const nukerBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-nuker-launch`,
)).text();
if (
  !nukerBody.includes("request.nukerId")
  || !nukerBody.includes("request.enabled = false")
  || !nukerBody.includes("Memory.pendingNukeLaunches[nuker.id]")
  || !nukerBody.includes("nuker.cooldown > 0")
  || !nukerBody.includes("energy === 0")
  || !nukerBody.includes("ghodium === 0")
  || !nukerBody.includes("room.find(FIND_NUKES)")
  || !nukerBody.includes("nuke.launchRoomName")
  || !nukerBody.includes("does not emit a Room event")
) {
  failures.push("Nuker页面缺少精确目标确认、本地发射签名、目标Nuke身份或无事件边界");
}

const repairBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-wall-rampart-repair-limit`,
)).text();
if (
  !repairBody.includes("policy.stages[structure.structureType]")
  || !repairBody.includes("reservedTargets.has(structure.id)")
  || !repairBody.includes("creep.getActiveBodyparts(WORK)")
  || !repairBody.includes("event.event === EVENT_REPAIR")
  || !repairBody.includes("event.objectId === pending.creepId")
  || !repairBody.includes("event.data?.targetId === pending.targetId")
  || !repairBody.includes("energySpent")
) {
  failures.push("防御维修页面缺少阶段、目标预留或精确 Repairer-to-target 事件边界");
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
  console.error(`\n第十七批英文防御操作生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十七批英文防御操作生产冒烟测试通过：${articles.length} 篇文章、精确Nuker本地与目标证据、精确Repairer事件、Canonical、hreflang、JSON-LD、搜索与 Sitemap。`);
