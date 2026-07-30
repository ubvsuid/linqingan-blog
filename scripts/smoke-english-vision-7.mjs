const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-room-visibility",
    chinesePath: "/blog/screeps-room-visibility",
    headline: "Why Is Game.rooms[roomName] Undefined in Screeps?",
    query: "Game.rooms",
    signals: [
      "Memory.rooms is not a live Room object",
      "status: 'room-not-visible'",
      "Live multi-tick visibility test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-observer-observe-room",
    chinesePath: "/blog/screeps-observer-observe-room",
    headline: "How to Use StructureObserver.observeRoom() Safely",
    query: "Observer",
    signals: [
      "requestedAt !== Game.time - 1",
      "Visibility does not prove exclusive Observer attribution",
      "result === OK",
      "Live Observer and multi-tick intel test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-pathfinder-costmatrix",
    chinesePath: "/blog/screeps-pathfinder-costmatrix",
    headline: "How to Build a Safe PathFinder CostMatrix in Screeps",
    query: "CostMatrix",
    signals: [
      "return undefined",
      "return false",
      "current < 255",
      "search.incomplete || search.path.length === 0",
      "Live PathFinder, CPU and multi-tick traffic test",
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

const observerBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-observer-observe-room`,
)).text();
if (observerBody.includes("Memory.observerState = {\n      requestedRoom") && !observerBody.includes("if (result === OK)")) {
  failures.push("Observer 页面可能在失败请求后写入成功状态");
}

const matrixBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-pathfinder-costmatrix`,
)).text();
if (matrixBody.includes("if (!room) {\n          return false;")) {
  failures.push("CostMatrix 页面仍把不可见房间一律设为禁区");
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
  console.error(`\n第七批英文视野与寻路生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第七批英文视野与寻路生产冒烟测试通过：${articles.length} 篇文章、三项状态边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
