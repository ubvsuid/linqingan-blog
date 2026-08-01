const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    headline: "Create One Market Order and Prove Which Order Appeared",
    title: "Screeps createOrder(): Verify the New Order by ID Difference",
    query: "createOrder",
    signals: [
      "snapshotOrderIds",
      "orderIdsBefore",
      "ambiguous-new-orders",
      "verified-new-order",
      "Live order creation, ID-difference, activation and fill test",
    ],
  },
  {
    path: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    headline: "Execute a Market Deal Without Losing Track of the Actual Call",
    title: "Screeps market.deal(): One Coordinator, One Accepted Request",
    query: "market.deal",
    signals: [
      "createDealCoordinator",
      "coordinator.reserveCall",
      "deferred-deal-limit",
      "transactionIdsBefore",
      "Live order race, 10-call coordination, settlement and transaction-ID test",
    ],
  },
  {
    path: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    headline: "Send One Terminal Transfer Without Misidentifying Another Transfer",
    title: "Screeps Terminal.send(): Verify the Exact Outgoing Transaction",
    query: "Terminal.send",
    signals: [
      "destination-is-source-room",
      "transactionIdsBefore",
      "ambiguous-transactions",
      "verified-transaction",
      "Live transfer, power-effect, concurrent-identical-send and receiving-room test",
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
    failures.push(
      `${article.path}: 预期 200，实际 ${response.status}`,
    );
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [
    article.headline,
    article.title,
    "Verification status",
    "Chinese source article",
    "Reviewed in full",
    "Screeps Console test",
    "Live multi-tick verification",
    "Pending",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#use-this-guide"`,
    `<h2 id="use-this-guide">Use this guide when</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-01"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少 “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: 不应继续输出 FAQPage`);
  }

  const searchResponse = await fetch(
    `${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`,
    { redirect: "manual" },
  );
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) {
    failures.push(
      `/en/search?q=${article.query}: 实际 ${searchResponse.status}`,
    );
  } else if (
    !searchBody.includes(article.headline)
    && !searchBody.includes(article.title)
  ) {
    failures.push(
      `/en/search?q=${article.query}: 缺少新标题或 H1`,
    );
  }
}

const createBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-market-create-order`,
)).text();
if (
  !createBody.includes("snapshotOrderIds")
  || !createBody.includes("orderIdsBefore")
  || !createBody.includes("ambiguous-new-orders")
  || !createBody.includes("verified-new-order")
  || createBody.includes("findOrderAfterRequest")
) {
  failures.push(
    "createOrder 页面缺少新 ID 差集验证或仍使用旧的全量字段匹配",
  );
}

const dealBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-market-deal`,
)).text();
if (
  !dealBody.includes("createDealCoordinator")
  || !dealBody.includes("coordinator.reserveCall")
  || !dealBody.includes("deferred-deal-limit")
  || !dealBody.includes("transactionIdsBefore")
) {
  failures.push(
    "market.deal 页面缺少共享调用协调器或交易 ID 差集验证",
  );
}

const sendBody = await (await fetch(
  `${baseUrl}/en/blog/screeps-terminal-send-resources`,
)).text();
if (
  !sendBody.includes("destination-is-source-room")
  || !sendBody.includes("transactionIdsBefore")
  || !sendBody.includes("ambiguous-transactions")
  || !sendBody.includes("verified-transaction")
) {
  failures.push(
    "Terminal.send 页面缺少同房间保护或精确交易身份验证",
  );
}

const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, {
  redirect: "manual",
});
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) {
  failures.push(
    `/en/blog-index.json: 预期 200，实际 ${blogResponse.status}`,
  );
} else {
  for (const article of articles) {
    if (
      !blogBody.includes(article.headline)
      && !blogBody.includes(article.title)
    ) {
      failures.push(
        `/en/blog-index.json: 缺少 ${article.path} 新标题`,
      );
    }
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  redirect: "manual",
});
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(
    `/sitemap.xml: 预期 200，实际 ${sitemapResponse.status}`,
  );
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemapBody.includes(expected)) {
      failures.push(`/sitemap.xml: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) =>
    console.error(`ERROR: ${failure}`),
  );
  console.error(
    `\n第十批英文市场与 Terminal 生产冒烟测试失败：`
      + `${failures.length} 项。`,
  );
  process.exit(1);
}

console.log(
  "第十批英文市场与 Terminal 生产冒烟测试通过："
    + `${articles.length} 篇文章、订单与交易 ID 差集、`
    + "共享 deal 协调器、Pending 证据、Canonical、hreflang、"
    + "BlogPosting、目录、搜索与 Sitemap。",
);
