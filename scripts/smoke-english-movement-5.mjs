const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-err-not-in-range",
    chinesePath: "/blog/screeps-err-not-in-range",
    headline: "How to Fix ERR_NOT_IN_RANGE in Screeps",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Range boundary",
      "Range 1 and range 3 actions are handled separately",
      "Source correction",
      "Current moveTo() return table does not list ERR_NO_BODYPART",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
    headline: "Why moveTo() Returns OK but Your Screeps Creep Does Not Move",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Timing boundary",
      "OK schedules movement; position must be checked on a later tick",
      "Source correction",
      "Current moveTo() return table does not list ERR_NO_BODYPART",
      "Live traffic and path-cache test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-err-no-path",
    chinesePath: "/blog/screeps-err-no-path",
    headline: "How to Debug ERR_NO_PATH in Screeps",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Result distinction",
      "ERR_NO_PATH, cached-path ERR_NOT_FOUND and incomplete searches are separated",
      "Source correction",
      "Owned or public Ramparts remain walkable in the diagnostic CostMatrix",
      "Live terrain, callback and cross-room route test",
      "Pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, {
    redirect: "manual",
  });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: 预期 200，实际 ${response.status}`);
    continue;
  }

  for (const expected of [article.headline, ...article.verification]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少预期内容 “${expected}”`);
    }
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#quick-answer"`,
    `<h2 id="quick-answer">Quick answer</h2>`,
    `"@type":"BlogPosting"`,
    `"@type":"FAQPage"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }
}

const rangeResponse = await fetch(`${baseUrl}/en/blog/screeps-err-not-in-range`);
const rangeBody = await rangeResponse.text();
if (rangeBody.includes("<td><code>ERR_NO_BODYPART</code></td>")) {
  failures.push("ERR_NOT_IN_RANGE 页面错误地把 ERR_NO_BODYPART 放入 moveTo() 返回表");
}
for (const expected of [
  "Range 1 and range 3 actions are handled separately",
  "Retry the original action on a later tick",
  "harvestResult === ERR_NOT_IN_RANGE",
]) {
  if (!rangeBody.includes(expected)) {
    failures.push(`ERR_NOT_IN_RANGE 页面缺少关键模式 “${expected}”`);
  }
}

const moveResponse = await fetch(`${baseUrl}/en/blog/screeps-moveto-not-moving`);
const moveBody = await moveResponse.text();
if (moveBody.includes("<td><code>ERR_NO_BODYPART</code></td>")) {
  failures.push("moveTo no-progress 页面错误地列出 ERR_NO_BODYPART");
}
for (const expected of [
  "roomName",
  "unchangedTicks",
  "reusePath = unchangedTicks >= 2 ? 0 : 5",
  "later movement action takes precedence",
]) {
  if (!moveBody.includes(expected)) {
    failures.push(`moveTo no-progress 页面缺少诊断信号 “${expected}”`);
  }
}

const pathResponse = await fetch(`${baseUrl}/en/blog/screeps-err-no-path`);
const pathBody = await pathResponse.text();
for (const expected of [
  "structure.my === true",
  "structure.isPublic === true",
  "structure.my || structure.isPublic",
  "pathfinder-incomplete",
  "cached-path-missing",
  "return undefined",
]) {
  if (!pathBody.includes(expected)) {
    failures.push(`ERR_NO_PATH 页面缺少修正或分类 “${expected}”`);
  }
}
if (pathBody.includes("!structure.my\n      || !structure.isPublic")) {
  failures.push("ERR_NO_PATH 页面仍包含封锁己方私有 Rampart 的旧条件");
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) {
      failures.push(`/en/blog-index.json: 缺少新文章 “${article.headline}”`);
    }
  }
}

const searchResponse = await fetch(`${baseUrl}/en/search?q=move`, {
  redirect: "manual",
});
const searchBody = await searchResponse.text();
if (searchResponse.status !== 200) {
  failures.push(`/en/search: 预期 200，实际 ${searchResponse.status}`);
} else {
  for (const article of articles) {
    if (!searchBody.includes(article.headline)) {
      failures.push(`/en/search: 缺少新文章 “${article.headline}”`);
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\n第五批移动英文专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第五批移动英文专题生产冒烟测试通过：${articles.length} 篇文章、两项源文修正、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);
