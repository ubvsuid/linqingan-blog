const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    headline: "Do Not Mark an Alert Sent Until Game.notify() Is Called",
    listingTitle: "Screeps Game.notify(): Queue Alerts and Mark Them Submitted",
    query: "Game.notify",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    signals: [
      "valid.slice(0, 20)",
      "awaiting-first-submission",
      "lastSubmittedTick: Game.time",
      "Live queue-cap, notification submission, grouping, and external delivery test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    headline: "How to Read Room.getEventLog() Safely in Screeps",
    listingTitle: "How to Read Room.getEventLog() Safely in Screeps",
    query: "Room.getEventLog",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    signals: [
      "Game.time - 1",
      "room.getEventLog(true)",
      "previous-tick",
      "Live room event, combat and multi-tick history test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    headline: "Build a RoomVisual Debug Layer That Cannot Change Game Logic",
    listingTitle: "Screeps RoomVisual Debugging: Draw Current State Within a Budget",
    query: "RoomVisual",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    signals: [
      "visual.getSize()",
      "512,000 serialized bytes",
      "createCreepDebugSnapshot",
      "byte-budget-reached",
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
    "Chinese source article",
    "Reviewed in full",
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

  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(`/en/search?q=${article.query}: 实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.listingTitle)) {
    failures.push(`/en/search?q=${article.query}: 缺少 “${article.listingTitle}”`);
  }
}

const notifyBody = await (await fetch(`${baseUrl}/en/blog/screeps-game-notify`)).text();
for (const expected of [
  "Memory.notificationQueue ??= {}",
  "awaiting-first-submission",
  "valid.slice(0, 20)",
  "lastSubmittedTick: Game.time",
  "delete Memory.notificationQueue[item.key]",
]) {
  if (!notifyBody.includes(expected)) failures.push(`Game.notify 页面缺少 “${expected}”`);
}
if (notifyBody.includes("nextState: {\n      active: true,\n      lastSubmittedTick: input.currentTick")) {
  failures.push("Game.notify producer still advances the submission timestamp at queue time");
}
if (notifyBody.includes("delivery succeeded")) {
  failures.push("Game.notify 页面错误声称外部送达成功");
}

const eventBody = await (await fetch(`${baseUrl}/en/blog/screeps-room-event-log`)).text();
if (!eventBody.includes("tick: Game.time - 1") || !eventBody.includes("current action return codes separately")) {
  failures.push("事件日志页面缺少上一 tick 与当前动作结果边界");
}

const visualBody = await (await fetch(`${baseUrl}/en/blog/screeps-roomvisual-debug`)).text();
for (const expected of [
  "createCreepDebugSnapshot",
  "selectDebugSnapshots",
  "Math.min(\n    512000",
  "return {\n    status: 'complete'",
  "Game.cpu.getUsed()",
]) {
  if (!visualBody.includes(expected)) failures.push(`RoomVisual 页面缺少 “${expected}”`);
}
if (visualBody.includes("Memory.visualDebug[room.name].lastSummary")) {
  failures.push("RoomVisual 最小渲染流程仍默认写入每 tick 持久摘要");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.listingTitle)) failures.push(`/en/blog-index.json: 缺少 “${article.listingTitle}”`);
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
  console.error(`\n第九批英文可观测性生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第九批英文可观测性生产冒烟测试通过：${articles.length} 篇文章、通知提交与外部送达边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
