const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-lab-run-reaction",
    chinesePath: "/blog/screeps-lab-run-reaction",
    headline: "How to Run Lab Reactions Safely in Screeps",
    query: "runReaction",
    signals: [
      "LAB_REACTION_AMOUNT",
      "REACTIONS",
      "request.enabled = false",
      "Live reaction, Store delta and cooldown test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-lab-boost-creep",
    chinesePath: "/blog/screeps-lab-boost-creep",
    headline: "How to Boost Creep Body Parts Safely in Screeps",
    query: "boostCreep",
    signals: [
      "LAB_BOOST_MINERAL",
      "LAB_BOOST_ENERGY",
      "TOUGH",
      "request.enabled = false",
      "Live boost, body-part order and Store delta test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-factory-produce",
    chinesePath: "/blog/screeps-factory-produce",
    headline: "How to Produce Factory Commodities Safely in Screeps",
    query: "Factory.produce",
    signals: [
      "COMMODITIES",
      "PWR_OPERATE_FACTORY",
      "factory.level",
      "request.enabled = false",
      "Live Factory, Power effect, Store delta and cooldown test",
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

const reactionBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-lab-run-reaction`,
)).text();
if (
  !reactionBody.includes("outputLab.runReaction")
  || !reactionBody.includes("LAB_REACTION_AMOUNT")
  || !reactionBody.includes("request.enabled = false")
) {
  failures.push("Lab reaction 页面缺少输出 Lab 调用、基础反应量或一次性关闭");
}

const boostBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-lab-boost-creep`,
)).text();
if (
  !boostBody.includes("lab.boostCreep")
  || !boostBody.includes("LAB_BOOST_MINERAL")
  || !boostBody.includes("LAB_BOOST_ENERGY")
  || !boostBody.includes("request.enabled = false")
) {
  failures.push("Lab boost 页面缺少强化调用、资源公式或一次性关闭");
}

const factoryBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-factory-produce`,
)).text();
if (
  !factoryBody.includes("factory.produce")
  || !factoryBody.includes("COMMODITIES")
  || !factoryBody.includes("PWR_OPERATE_FACTORY")
  || !factoryBody.includes("request.enabled = false")
) {
  failures.push("Factory produce 页面缺少生产调用、配方、Power 或一次性关闭");
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
  console.error(`\n第十一批英文 Lab 与 Factory 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十一批英文 Lab 与 Factory 生产冒烟测试通过：${articles.length} 篇文章、三项资源操作边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
