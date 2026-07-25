const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
    headline: "How to Debug spawnCreep() Return Codes in Screeps",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "API boundary",
      "dryRun checks current conditions but does not start spawning",
      "Screeps Console test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-dynamic-creep-body",
    chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    headline: "How to Build a Screeps Creep Body from Available Energy",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Policy boundary",
      "Body builder chooses a valid body; spawn timing remains a separate decision",
      "Live replacement-cycle test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
    headline: "How to Recover a Screeps Room with No Harvesters",
    verification: [
      "Chinese source article",
      "Reviewed in full",
      "Safety boundary",
      "Initial Spawn 1-Energy refill is special and not assumed for ordinary rooms",
      "Live colony-collapse recovery",
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

const dynamicBodyResponse = await fetch(
  `${baseUrl}/en/blog/screeps-dynamic-creep-body`,
  { redirect: "manual" },
);
const dynamicBody = await dynamicBodyResponse.text();
if (!dynamicBody.includes("maximumUnits !== Infinity")) {
  failures.push("动态身体页面未呈现修正后的 Infinity 边界");
}
if (dynamicBody.includes("|| !Number.isFinite(maximumUnits)")) {
  failures.push("动态身体页面仍呈现旧的 Infinity 误判条件");
}

const blogResponse = await fetch(`${baseUrl}/en/blog`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) {
      failures.push(`/en/blog: 缺少新文章 “${article.headline}”`);
    }
  }
}

const searchResponse = await fetch(`${baseUrl}/en/search?q=spawn`, {
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
  console.error(`\n第三批 Spawn 英文专题生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(
  `第三批 Spawn 英文专题生产冒烟测试通过：${articles.length} 篇文章、Verification、修正后代码、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`,
);
