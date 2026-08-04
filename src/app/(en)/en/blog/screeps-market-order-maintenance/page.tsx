import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-market-order-maintenance";
const chinesePath = "/blog/screeps-market-order-maintenance";
const headline = "How to Maintain Screeps Market Orders Safely";
const description =
  "Safely change, extend, or cancel your own Screeps market order with identity checks, 5% fee estimates, a Credits reserve, one-shot requests, and next-tick verification.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;
const modifiedTime = discovery?.updatedAt ?? publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps changeOrderPrice",
    "Screeps extendOrder",
    "Screeps cancelOrder",
    "Screeps market order fee",
    "Screeps market order maintenance",
  ],
  alternates: {
    canonical: path,
    languages: {
      en: path,
      "zh-CN": chinesePath,
      "x-default": path,
    },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${headline} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: discovery?.tags ?? ["Market", "Resources"],
    images: [{ url: `${siteConfig.url}${path}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["order-fields", "Read the current order before changing it"],
  ["fees", "Calculate each maintenance fee"],
  ["fingerprint", "Require an order fingerprint and Credits reserve"],
  ["complete-example", "Complete one-shot maintenance example"],
  ["verification", "Verify the result on a later tick"],
  ["return-codes", "Return-code checklist"],
  ["boundaries", "Verification boundaries"],
];

const articleHtml = String.raw`
<h2 id="order-fields">Read the current order before changing it</h2>
<p><code>Game.market.orders</code> contains your active and inactive buy and sell orders. A maintenance request should resolve the current order from this object, not reuse a stale object saved in Memory.</p>
<pre><code class="language-js">const order = Game.market.orders[orderId];

console.log({
  id: order.id,
  active: order.active,
  type: order.type,
  resourceType: order.resourceType,
  roomName: order.roomName,
  amount: order.amount,
  remainingAmount: order.remainingAmount,
  totalAmount: order.totalAmount,
  price: order.price
});</code></pre>
<p><code>remainingAmount</code> is the unfilled order capacity. <code>totalAmount</code> is the order's total capacity after creation and extensions. <code>amount</code> is the currently tradable amount and may be affected by resources, Credits, and Terminal state.</p>

<h2 id="fees">Calculate each maintenance fee</h2>
<p>Raising a price charges <code>(newPrice - oldPrice) * remainingAmount * 0.05</code>. Lowering a price does not add that fee. Extending an order charges <code>price * addAmount * 0.05</code>. Cancelling an order does not refund the original 5% placement fee.</p>
<pre><code class="language-js">function calculatePriceChangeFee(order, newPrice) {
  return Math.max(0, newPrice - order.price)
    * order.remainingAmount
    * 0.05;
}

function calculateExtendOrderFee(order, addAmount) {
  return order.price * addAmount * 0.05;
}</code></pre>
<p>Do not calculate a price-increase fee from <code>totalAmount</code>. Units already traded are not part of the current remaining order capacity.</p>

<h2 id="fingerprint">Require an order fingerprint and Credits reserve</h2>
<p>An order ID alone is easy to paste incorrectly. The request below also records the expected type, resource, room, current price, and total amount. Any mismatch stops the action.</p>
<pre><code class="language-js">expected: {
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  roomName: "W1N1",
  price: 1,
  totalAmount: 10000
}</code></pre>
<p>The example also enforces <code>Game.market.credits - estimatedFee &gt;= reserveCredits</code>. This reserve is a local safety policy, not an official Screeps requirement.</p>

<h2 id="complete-example">Complete one-shot maintenance example</h2>
<p>The complete example processes one explicit request at a time. It disables the request before calling the API, checks the current owned order and fingerprint, estimates the fee, protects the Credits reserve, stores the API result, and records one later observation.</p>
<pre><code class="language-js">const MARKET_ACTIONS = new Set([
  'change-price',
  'extend-order',
  'cancel-order'
]);

const NUMBER_EPSILON = 1e-9;

function sameNumber(left, right) {
  return (
    Number.isFinite(left)
    &amp;&amp; Number.isFinite(right)
    &amp;&amp; Math.abs(left - right) &lt;= NUMBER_EPSILON
  );
}

function getMarketMaintenanceMemory() {
  Memory.market ??= {};
  Memory.market.orderMaintenance ??= {
    request: null,
    pending: null,
    history: []
  };

  return Memory.market.orderMaintenance;
}

function copyOrderSnapshot(order) {
  if (!order) return null;

  return {
    id: order.id,
    active: order.active,
    type: order.type,
    resourceType: order.resourceType,
    roomName: order.roomName ?? null,
    amount: order.amount,
    remainingAmount: order.remainingAmount,
    totalAmount: order.totalAmount,
    price: order.price
  };
}

function calculatePriceChangeFee(order, newPrice) {
  return Math.max(0, newPrice - order.price)
    * order.remainingAmount
    * 0.05;
}

function calculateExtendOrderFee(order, addAmount) {
  return order.price * addAmount * 0.05;
}

function validateRequest(request) {
  if (!request || request.enabled !== true) {
    return { ok: false, reason: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
  ) {
    return { ok: false, reason: 'invalid-request-id' };
  }

  if (!MARKET_ACTIONS.has(request.action)) {
    return { ok: false, reason: 'invalid-action' };
  }

  if (
    typeof request.orderId !== 'string'
    || request.orderId.length === 0
  ) {
    return { ok: false, reason: 'invalid-order-id' };
  }

  if (
    !request.expected
    || typeof request.expected !== 'object'
    || typeof request.expected.type !== 'string'
    || typeof request.expected.resourceType !== 'string'
    || typeof request.expected.roomName !== 'string'
  ) {
    return { ok: false, reason: 'invalid-order-fingerprint' };
  }

  if (
    !Number.isFinite(request.reserveCredits)
    || request.reserveCredits &lt; 0
  ) {
    return { ok: false, reason: 'invalid-credit-reserve' };
  }

  if (
    request.action === 'change-price'
    &amp;&amp; (!Number.isFinite(request.newPrice) || request.newPrice &lt;= 0)
  ) {
    return { ok: false, reason: 'invalid-new-price' };
  }

  if (
    request.action === 'extend-order'
    &amp;&amp; (!Number.isInteger(request.addAmount) || request.addAmount &lt;= 0)
  ) {
    return { ok: false, reason: 'invalid-add-amount' };
  }

  if (
    request.action === 'cancel-order'
    &amp;&amp; request.confirmCancel !== true
  ) {
    return { ok: false, reason: 'cancel-not-confirmed' };
  }

  return { ok: true, reason: null };
}

function matchesExpectedOrder(order, expected) {
  if (
    order.type !== expected.type
    || order.resourceType !== expected.resourceType
    || (order.roomName ?? null) !== expected.roomName
  ) return false;

  if (
    Number.isFinite(expected.price)
    &amp;&amp; !sameNumber(order.price, expected.price)
  ) return false;

  if (
    Number.isInteger(expected.totalAmount)
    &amp;&amp; order.totalAmount !== expected.totalAmount
  ) return false;

  return true;
}

function finishRequest(request, status, detail = {}) {
  request.enabled = false;
  request.status = status;
  request.finishedAt = Game.time;
  Object.assign(request, detail);
}

function verifyPendingMarketMaintenance() {
  const memory = getMarketMaintenanceMemory();
  const pending = memory.pending;
  if (!pending || pending.tick &gt;= Game.time) return null;

  const order = Game.market.orders[pending.orderId] || null;
  const after = copyOrderSnapshot(order);
  let status = 'change-not-observed';

  if (pending.action === 'change-price') {
    if (order &amp;&amp; sameNumber(order.price, pending.newPrice)) {
      status = 'price-observed';
    } else if (!order) {
      status = 'order-unavailable';
    }
  }

  if (pending.action === 'extend-order') {
    const expectedTotal = pending.before.totalAmount + pending.addAmount;
    if (order &amp;&amp; order.totalAmount &gt;= expectedTotal) {
      status = 'total-amount-increase-observed';
    } else if (!order) {
      status = 'order-unavailable';
    }
  }

  if (pending.action === 'cancel-order') {
    status = order ? 'cancel-not-observed' : 'order-absent-observed';
  }

  if (
    status === 'change-not-observed'
    &amp;&amp; Game.time &gt; pending.tick + 1
  ) {
    status = 'late-observation';
  }

  const record = {
    verifiedAt: Game.time,
    ...pending,
    after,
    status,
    priceDelta: after ? after.price - pending.before.price : null,
    remainingAmountDelta: after
      ? after.remainingAmount - pending.before.remainingAmount
      : null,
    totalAmountDelta: after
      ? after.totalAmount - pending.before.totalAmount
      : null
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  memory.pending = null;
  return record;
}

function processMarketOrderMaintenance() {
  const memory = getMarketMaintenanceMemory();
  const verification = verifyPendingMarketMaintenance();
  const request = memory.request;

  if (!request || request.enabled !== true) {
    return { status: 'no-enabled-request', verification };
  }

  const validation = validateRequest(request);
  request.attemptedAt = Game.time;

  if (!validation.ok) {
    finishRequest(request, validation.reason);
    return { status: validation.reason, verification };
  }

  const order = Game.market.orders[request.orderId];
  if (!order) {
    finishRequest(request, 'owned-order-not-found');
    return { status: 'owned-order-not-found', verification };
  }

  if (!matchesExpectedOrder(order, request.expected)) {
    finishRequest(request, 'order-fingerprint-mismatch', {
      observedOrder: copyOrderSnapshot(order)
    });
    return { status: 'order-fingerprint-mismatch', verification };
  }

  let estimatedFee = 0;

  if (request.action === 'change-price') {
    if (sameNumber(order.price, request.newPrice)) {
      finishRequest(request, 'price-already-matches', {
        observedOrder: copyOrderSnapshot(order)
      });
      return { status: 'price-already-matches', verification };
    }
    estimatedFee = calculatePriceChangeFee(order, request.newPrice);
  }

  if (request.action === 'extend-order') {
    estimatedFee = calculateExtendOrderFee(order, request.addAmount);
  }

  if (
    Game.market.credits - estimatedFee
    &lt; request.reserveCredits
  ) {
    finishRequest(request, 'credit-reserve-would-be-crossed', {
      estimatedFee,
      creditsAtAttempt: Game.market.credits
    });
    return {
      status: 'credit-reserve-would-be-crossed',
      estimatedFee,
      verification
    };
  }

  const before = copyOrderSnapshot(order);
  request.enabled = false;
  request.estimatedFee = estimatedFee;
  request.creditsAtAttempt = Game.market.credits;
  request.before = before;

  let result = ERR_INVALID_ARGS;
  if (request.action === 'change-price') {
    result = Game.market.changeOrderPrice(request.orderId, request.newPrice);
  }
  if (request.action === 'extend-order') {
    result = Game.market.extendOrder(request.orderId, request.addAmount);
  }
  if (request.action === 'cancel-order') {
    result = Game.market.cancelOrder(request.orderId);
  }

  request.result = result;
  request.finishedAt = Game.time;
  request.status = result === OK ? 'request-accepted' : 'api-rejected';

  if (result === OK) {
    memory.pending = {
      tick: Game.time,
      requestId: request.requestId,
      action: request.action,
      orderId: request.orderId,
      before,
      estimatedFee,
      newPrice: request.action === 'change-price' ? request.newPrice : null,
      addAmount: request.action === 'extend-order' ? request.addAmount : null
    };
  }

  return {
    status: request.status,
    action: request.action,
    orderId: request.orderId,
    result,
    estimatedFee,
    before,
    verification
  };
}

module.exports.loop = function () {
  const outcome = processMarketOrderMaintenance();
  if (outcome.status !== 'no-enabled-request' || outcome.verification) {
    console.log(JSON.stringify({
      type: 'market-order-maintenance',
      tick: Game.time,
      ...outcome
    }));
  }
};</code></pre>
<p>To change a price, set <code>action: "change-price"</code> and <code>newPrice</code>. To extend capacity, set <code>action: "extend-order"</code> and a positive integer <code>addAmount</code>. To cancel, set <code>action: "cancel-order"</code> and require <code>confirmCancel: true</code>.</p>

<h2 id="verification">Verify the result on a later tick</h2>
<p>A successful API return schedules the operation. The example stores the before snapshot and checks the next available tick.</p>
<ul>
  <li>Price change: the order's <code>price</code> matches <code>newPrice</code>.</li>
  <li>Extension: <code>totalAmount</code> is at least the previous total plus <code>addAmount</code>.</li>
  <li>Cancellation: the order is absent from <code>Game.market.orders</code>.</li>
</ul>
<p>For an extension, do not require an exact <code>remainingAmount</code> delta. Real market deals may reduce remaining capacity between observations while the total-capacity increase is still visible.</p>

<h2 id="return-codes">Return-code checklist</h2>
<table>
  <thead><tr><th>Method</th><th>Codes to preserve</th><th>Primary check</th></tr></thead>
  <tbody>
    <tr><td><code>changeOrderPrice()</code></td><td><code>OK</code>, <code>ERR_NOT_OWNER</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_ARGS</code></td><td>Order identity, new price, fee, Credits</td></tr>
    <tr><td><code>extendOrder()</code></td><td><code>OK</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_ARGS</code></td><td>Order ID, positive add amount, fee</td></tr>
    <tr><td><code>cancelOrder()</code></td><td><code>OK</code>, <code>ERR_INVALID_ARGS</code></td><td>Exact order ID and explicit confirmation</td></tr>
  </tbody>
</table>
<p>These methods are account-level market operations. They do not use Creep range and therefore do not return <code>ERR_NOT_IN_RANGE</code>.</p>

<h2 id="boundaries">Verification boundaries</h2>
<p>Offline tests covered zero fees for lower or unchanged prices, a remaining-capacity price increase fee, an extension fee, exact and mismatched fingerprints, price observation, total-capacity observation despite a concurrent remaining-amount change, cancellation observation, cancellation not observed, and late observation. Twelve cases passed, and the complete example passed a JavaScript syntax check.</p>
<p>These tests do not prove live shard settlement, market competition, simultaneous maintenance from another script, price quality, profitability, or that a pasted production order ID is correct. Console and official-shard evidence remain pending.</p>
<p>Continue with <a href="/en/blog/screeps-market-create-order">creating a market order</a>, <a href="/en/blog/screeps-market-deal">executing a deal</a>, or <a href="/en/blog/screeps-terminal-send-resources">sending Terminal resources</a>.</p>
`;

export default function MarketOrderMaintenancePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
        { "@type": "ListItem", position: 3, name: headline, item: articleUrl },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Market order maintenance"
      category="MARKET · ORDER LIFECYCLE"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="18 min read"
      tags={["Market", "Resources"]}
      verification={[
        { term: "Documentation", value: "Official API and market references checked" },
        { term: "Syntax", value: "Complete JavaScript example checked offline" },
        { term: "Offline cases", value: "12 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
