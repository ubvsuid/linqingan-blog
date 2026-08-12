const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-err-not-in-range",
    chinesePath: "/blog/screeps-err-not-in-range",
    title: "Screeps ERR_NOT_IN_RANGE: Use the Correct Action Range",
    searchQuery: "ERR_NOT_IN_RANGE",
    modifiedAt: "2026-08-12",
    requiredBody: [
      "Use this guide when",
      "Choose another guide when",
      "Screeps Console test",
      "Live multi-tick verification",
      "Evidence level",
      "Pending",
      "harvestResult === ERR_NOT_IN_RANGE",
      "getRangeTo",
      "href=\"#intent-boundary\"",
      "<h2 id=\"intent-boundary\">Choose another guide when</h2>",
    ],
  },
  {
    path: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
    title: "Screeps moveTo() Returns OK but the Creep Stays Put",
    searchQuery: "moveTo",
    modifiedAt: "2026-08-12",
    requiredBody: [
      "Use this guide when",
      "Screeps Console test",
      "Live multi-tick verification",
      "Evidence level",
      "Pending",
      "roomName",
      "unchangedTicks",
      "fatigue",
    ],
  },
  {
    path: "/en/blog/screeps-err-no-path",
    chinesePath: "/blog/screeps-err-no-path",
    title: "Screeps ERR_NO_PATH: Diagnose Range, Matrices, and Routes",
    searchQuery: "ERR_NO_PATH",
    modifiedAt: "2026-07-31",
    requiredBody: [
      "Use this guide when",
      "Current tick and later ticks",
      "Screeps Console test",
      "Live multi-tick verification",
      "Evidence level",
      "Pending",
      "PathFinder.search",
      "incomplete",
      "structure.my === true",
      "structure.isPublic === true",
      "return undefined",
      "href=\"#tick-boundary\"",
      "<h2 id=\"tick-boundary\">Current tick and later ticks</h2>",
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

  for (const expected of [article.title, ...article.requiredBody]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少预期内容 “${expected}”`);
    }
  }

  if (!body.toLowerCase().includes("static")) {
    failures.push(`${article.path}: Evidence level 未显示静态验证边界`);
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"${article.modifiedAt}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少页面信号 “${expected}”`);
    }
  }

  if (body.includes('"@type":"FAQPage"')) {
    failures.push(`${article.path}: 已删除重复FAQ，但页面仍输出FAQPage结构化数据`);
  }
}

const rangeResponse = await fetch(`${baseUrl}/en/blog/screeps-err-not-in-range`);
const rangeBody = await rangeResponse.text();
if (!rangeBody.includes("<td><code>ERR_NO_BODYPART</code></td>")) {
  failures.push("ERR_NOT_IN_RANGE 页面缺少当前 Creep.moveTo() 官方返回码 ERR_NO_BODYPART");
}
for (const expected of [
  "ERR_NOT_IN_RANGE",
  "later tick",
  "harvestResult === ERR_NOT_IN_RANGE",
]) {
  if (!rangeBody.includes(expected)) {
    failures.push(`ERR_NOT_IN_RANGE 页面缺少关键模式 “${expected}”`);
  }
}

const moveResponse = await fetch(`${baseUrl}/en/blog/screeps-moveto-not-moving`);
const moveBody = await moveResponse.text();
if (!moveBody.includes("<td><code>ERR_NO_BODYPART</code></td>")) {
  failures.push("moveTo no-progress 页面缺少当前 Creep.moveTo() 官方返回码 ERR_NO_BODYPART");
}
for (const expected of [
  "roomName",
  "unchangedTicks",
  "reusePath",
  "movement intent",
]) {
  if (!moveBody.toLowerCase().includes(expected.toLowerCase())) {
    failures.push(`moveTo no-progress 页面缺少诊断信号 “${expected}”`);
  }
}

const pathResponse = await fetch(`${baseUrl}/en/blog/screeps-err-no-path`);
const pathBody = await pathResponse.text();
for (const expected of [
  "ERR_NO_PATH",
  "ERR_NOT_FOUND",
  "PathFinder.search",
  "incomplete",
  "CostMatrix",
  "structure.my === true",
  "structure.isPublic === true",
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
    if (!blogBody.includes(article.title)) {
      failures.push(`/en/blog-index.json: 缺少已优化文章 “${article.title}”`);
    }
  }
}

for (const article of articles) {
  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.searchQuery)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();

  if (searchResponse.status !== 200) {
    failures.push(`${article.path} 搜索页: 预期 200，实际 ${searchResponse.status}`);
  } else if (!searchBody.includes(article.title)) {
    failures.push(`${article.path} 搜索页缺少已优化文章 “${article.title}”`);
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
  `第五批移动英文专题生产冒烟测试通过：${articles.length} 篇现有文章、独立搜索意图、Pending证据、Canonical、hreflang、BlogPosting、目录、搜索与 Sitemap。`,
);