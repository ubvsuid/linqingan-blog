const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    headline: "How to Send Reliable Alerts with Game.notify()",
    query: "Game.notify",
    signals: [
      "slice(0, 20)",
      "groupInterval",
      "normalizeNotificationMessage",
      "Live notification queue and external delivery test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    headline: "How to Read Room.getEventLog() Safely in Screeps",
    query: "Room.getEventLog",
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
    headline: "How to Build a Safe RoomVisual Debug Layer in Screeps",
    query: "RoomVisual",
    signals: [
      "visual.getSize()",
      "512,000-byte",
      "target.pos.roomName !== creep.pos.roomName",
      "Live RoomVisual, byte-size and CPU test",
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

const notifyBody = await (await fetch(`${baseUrl}/en/blog/screeps-game-notify`)).text();
if (!notifyBody.includes("Memory.notificationQueue = deferred") || !notifyBody.includes("submitted = queue.slice(0, 20)")) {
  failures.push("Game.notify 页面缺少中央队列与 20 条提交上限");
}
if (notifyBody.includes("delivery succeeded")) {
  failures.push("Game.notify 页面错误声称外部送达成功");
}

const eventBody = await (await fetch(`${baseUrl}/en/blog/screeps-room-event-log`)).text();
if (!eventBody.includes("tick: Game.time - 1") || !eventBody.includes("current action return codes separately")) {
  failures.push("事件日志页面缺少上一 tick 与当前动作结果边界");
}

const visualBody = await (await fetch(`${baseUrl}/en/blog/screeps-roomvisual-debug`)).text();
if (!visualBody.includes("visual.getSize() >= config.maximumBytes") || !visualBody.includes("target.pos.roomName !== creep.pos.roomName")) {
  failures.push("RoomVisual 页面缺少字节停止线或跨房间目标边界");
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
  console.error(`\n第九批英文可观测性生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第九批英文可观测性生产冒烟测试通过：${articles.length} 篇文章、三项证据边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
