const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const timeoutMs = 15000;

async function request(path) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

const articles = [
  {
    path: "/en/blog/screeps-market-create-order",
    chinesePath: "/blog/screeps-market-create-order",
    headline:
      "Create One Market Order Without Misattributing a Later Order",
    title:
      "Screeps createOrder(): Bind One Request to the New Order ID",
    query: "createOrder",
    modifiedDate: "2026-08-05",
    signals: [
      "buildCreateOrderConfirmation",
      "calculateCreateOrderFeeCeiling",
      "creation-slot-reserved",
      "new-order-identity-ambiguous",
      "created-order-observed",
    ],
  },
  {
    path: "/en/blog/screeps-market-deal",
    chinesePath: "/blog/screeps-market-deal",
    headline:
      "Execute One Market Deal Without Assuming the Requested Amount Settled",
    title:
      "Screeps market.deal(): Reserve the Terminal and Verify Actual Amount",
    query: "market.deal",
    modifiedDate: "2026-08-05",
    signals: [
      "createTerminalMarketDispatcher",
      "terminal-already-reserved",
      "partial-deal-settlement-observed",
      "full-deal-settlement-observed",
      "transaction-identity-ambiguous",
    ],
  },
  {
    path: "/en/blog/screeps-terminal-send-resources",
    chinesePath: "/blog/screeps-terminal-send-resources",
    headline:
      "Send One Terminal Transfer Without Losing Its Exact Operation Identity",
    title:
      "Screeps Terminal.send(): Prevent Intent Overwrite and Verify Actual Amount",
    query: "Terminal.send",
    modifiedDate: "2026-08-30",
    signals: [
      "normalizeSendDescription",
      "createTerminalOperationDispatcher",
      "request?.description",
      "partial-transfer-observed",
      "accepted-no-outgoing-transaction-observed",
    ],
  },
];

const failures = [];
const bodies = new Map();

for (const article of articles) {
  let response;
  try {
    response = await request(article.path);
  } catch (error) {
    failures.push(`${article.path}: 请求失败 ${error.message}`);
    continue;
  }
  const body = await response.text();
  bodies.set(article.path, body);

  if (response.status !== 200) {
    failures.push(`${article.path}: 预期 200，实际 ${response.status}`);
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
    "Official engine",
    "Screeps Console test",
    "Pending",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#evidence-contract"`,
    `<h2 id="evidence-contract">`,
    `"@type":"BlogPosting"`,
    `"datePublished":"2026-07-26"`,
    `"dateModified":"${article.modifiedDate}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: 缺少 “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: 不应输出 FAQPage`);
  }

  let searchResponse;
  try {
    searchResponse = await request(
      `/en/search?q=${encodeURIComponent(article.query)}`,
    );
  } catch (error) {
    failures.push(`/en/search?q=${article.query}: 请求失败 ${error.message}`);
    continue;
  }
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
      `/en/search?q=${article.query}: 缺少当前标题或 H1`,
    );
  }
}

const createBody = bodies.get(
  "/en/blog/screeps-market-create-order",
) || "";
for (const signal of [
  "order.created === pending.submittedAt",
  "verification-window-missed",
  "created-order-observed",
]) {
  if (!createBody.includes(signal)) {
    failures.push(`createOrder 页面缺少 ${signal}`);
  }
}
if (createBody.includes("terminal.isActive() === true")) {
  failures.push("createOrder 页面不应继续要求 Terminal active");
}

const dealBody = bodies.get("/en/blog/screeps-market-deal") || "";
for (const signal of [
  "transaction.time === pending.submittedAt",
  "transaction.amount",
  "&lt;= pending.requestedAmount",
  "partial-deal-settlement-observed",
]) {
  if (!dealBody.includes(signal)) {
    failures.push(`market.deal 页面缺少 ${signal}`);
  }
}

const sendBody = bodies.get(
  "/en/blog/screeps-terminal-send-resources",
) || "";
for (const signal of [
  "request?.description",
  "ledgerDescription",
  "readLedgerDescription(transaction)",
  "!transaction.order",
  "partial-transfer-observed",
]) {
  if (!sendBody.includes(signal)) {
    failures.push(`Terminal.send 页面缺少 ${signal}`);
  }
}

for (const [path, label] of [
  ["/en/blog-index.json", "Blog index"],
  ["/sitemap.xml", "Sitemap"],
]) {
  let response;
  try {
    response = await request(path);
  } catch (error) {
    failures.push(`${path}: 请求失败 ${error.message}`);
    continue;
  }
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${path}: 预期 200，实际 ${response.status}`);
    continue;
  }
  for (const article of articles) {
    const expected = path.endsWith(".xml")
      ? `https://www.linqingan.com${article.path}`
      : article.title;
    if (!body.includes(expected)) {
      failures.push(`${label}: 缺少 ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `\n第十批英文市场与 Terminal 生产冒烟测试失败：${failures.length} 项。`,
  );
  process.exit(1);
}

console.log(
  "第十批英文市场与 Terminal 生产冒烟测试通过：3 篇现有文章、"
    + "创建订单 ID、共享 Terminal 调度、部分成交与发送、描述规范化、"
    + "有限超时、Pending 证据、Canonical、hreflang、搜索和 Sitemap。",
);
