const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    headline: "How to Create a Market Order Safely in Screeps",
    query: "createOrder",
    signals: [
      "price * totalAmount * 0.05",
      "request.enabled = false",
      "300 in the method description",
      "Live order creation, activation and market fill test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    headline: "How to Execute a Reviewed Market Deal Safely",
    query: "market.deal",
    signals: [
      "request.amount > order.amount",
      "order.remainingAmount",
      "Memory.market.dealSlotsUsed >= 10",
      "Live order race, settlement and transaction-record test",
      "Pending",
    ],
  },
  {
    path: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    headline: "How to Send Resources Between Terminals Safely",
    query: "Terminal.send",
    signals: [
      "request.amount < TERMINAL_MIN_SEND",
      "description.length > 100",
      "input.amount + input.transactionEnergy",
      "Live Terminal transfer, power-effect and receiving-room test",
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

const createBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-market-create-order`,
)).text();
if (
  !createBody.includes("request.enabled = false")
  || !createBody.includes("failed-review-required")
  || createBody.includes("currentOrderCount >= 50")
  || createBody.includes("currentOrderCount >= 300")
) {
  failures.push("createOrder 页面缺少一次性关闭或错误硬编码订单上限");
}

const dealBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-market-deal`,
)).text();
if (
  !dealBody.includes("request.amount > order.amount")
  || !dealBody.includes("request.enabled = false")
  || !dealBody.includes("Game.market.incomingTransactions.find")
) {
  failures.push("market.deal 页面缺少当前 amount、一次性关闭或结算核对");
}

const sendBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-terminal-send-resources`,
)).text();
if (
  !sendBody.includes("input.amount + input.transactionEnergy")
  || !sendBody.includes("request.enabled = false")
  || !sendBody.includes("Game.market.outgoingTransactions.find")
) {
  failures.push("Terminal.send 页面缺少 Energy 公式、一次性关闭或交易核对");
}

const blogResponse = await fetch(`${baseUrl}/en/blog`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(`/en/blog: 预期 200，实际 ${blogResponse.status}`);
} else {
  for (const article of articles) {
    if (!blogBody.includes(article.headline)) failures.push(`/en/blog: 缺少 “${article.headline}”`);
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
  console.error(`\n第十批英文市场与 Terminal 生产冒烟测试失败：${failures.length} 项。`);
  process.exit(1);
}

console.log(`第十批英文市场与 Terminal 生产冒烟测试通过：${articles.length} 篇文章、三项不可逆操作边界、Verification、Canonical、hreflang、JSON-LD、目录、搜索与 Sitemap。`);
