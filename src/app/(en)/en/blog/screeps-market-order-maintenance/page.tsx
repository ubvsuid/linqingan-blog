import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-market-order-maintenance";
const chinesePath = "/blog/screeps-market-order-maintenance";
const headline = "How to Maintain Screeps Market Orders Safely";
const description =
  "Change, extend, or cancel one owned Screeps market order with nullable room fingerprints, conservative fee budgeting, one-writer request IDs, raw return codes, and next-tick state verification.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const modifiedTime = "2026-08-18";
const articleTags = ["Market", "Resources", "Debugging"];
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps changeOrderPrice",
    "Screeps extendOrder",
    "Screeps cancelOrder",
    "Screeps market order fee",
    "Screeps market order maintenance",
    "Screeps Game.market.orders",
    "Screeps market credits reserve",
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
    tags: articleTags,
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
  ["current-order", "Re-read the current owned order"],
  ["nullable-room", "Do not require roomName for every order"],
  ["fee-boundary", "Separate fee formula, reserve estimate, and settlement"],
  ["single-writer", "Use one writer and one request ID"],
  ["complete-example", "Complete one-shot maintenance controller"],
  ["next-tick-proof", "What next-tick verification can prove"],
  ["return-codes", "Return-code and source mismatch checklist"],
  ["boundaries", "Evidence and engine boundaries"],
];

const articleHtml = String.raw`
<h2 id="current-order">Re-read the current owned order before changing it</h2>
<p><code>Game.market.orders</code> contains your current active and inactive buy and sell orders. Do not save an order object in Memory and treat it as authoritative on a later tick. Save the order ID, then read the current order again immediately before any maintenance request.</p>
<pre><code class="language-js">function copyOrderSnapshot(order) {
  if (!order) return null;

  return {
    id: order.id,
    created: order.created ?? null,
    active: order.active,
    type: order.type,
    resourceType: order.resourceType,
    roomName: order.roomName ?? null,
    amount: order.amount,
    remainingAmount: order.remainingAmount,
    totalAmount: order.totalAmount,
    price: order.price
  };
}</code></pre>
<p>The three amount fields answer different questions. <code>totalAmount</code> is the order's total capacity after creation and extensions. <code>remainingAmount</code> is capacity that has not yet been traded. <code>amount</code> is the amount currently available to trade and can differ from <code>remainingAmount</code> when resources, Credits, or Terminal state limit activity.</p>
<p>Use stable identity fields for operator safety, but do not fingerprint volatile fields such as <code>active</code>, <code>amount</code>, or <code>remainingAmount</code>. A legitimate market change can alter them between planning and execution.</p>

<h2 id="nullable-room">Do not require <code>roomName</code> for every order</h2>
<p>The current official market documentation makes <code>roomName</code> optional for account-bound resources in <code>INTERSHARD_RESOURCES</code>; that argument is not used for those orders. A validation rule that requires every expected room to be a string will therefore reject valid account-bound orders.</p>
<p>Normalize missing room identity to <code>null</code>. For a normal Terminal-backed order, configure the exact room name. For an account-bound order with no room, configure <code>null</code>.</p>
<pre><code class="language-js">expected: {
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  roomName: 'W1N1',
  price: 1,
  totalAmount: 10000
}

// Account-bound example shape:
expected: {
  type: ORDER_SELL,
  resourceType: 'pixel',
  roomName: null,
  price: 2500,
  totalAmount: 10
}</code></pre>
<p>The literal resource and prices above are configuration examples, not claims about your current shard or market.</p>

<h2 id="fee-boundary">Separate the official fee formula, your reserve estimate, and actual settlement</h2>
<p>The current official API documents these maintenance fees:</p>
<ul>
  <li>Raise an order price: <code>(newPrice - oldPrice) * remainingAmount * 0.05</code>.</li>
  <li>Lower an order price: no additional price-change fee.</li>
  <li>Extend an order: <code>price * addAmount * 0.05</code>.</li>
  <li>Cancel an order: the original 5% order fee is not refunded.</li>
</ul>
<p>The checked 4.3.2 processor calculates a fee in its internal money representation with <code>Math.ceil(...)</code> and checks the user's money again while processing the global intent. Public <code>Game.market.credits</code> is exposed in Credits, while the current engine stores money in thousandths internally. For reserve planning, this article deliberately rounds a positive formula estimate up to the next 0.001 Credit.</p>
<pre><code class="language-js">const MARKET_FEE_RATE = 0.05;

function ceilToMilliCredit(value) {
  if (!Number.isFinite(value) || value &lt;= 0) return 0;
  return Math.ceil(value * 1000 - 1e-9) / 1000;
}

function estimatePriceChangeFee(order, newPrice) {
  const formula = Math.max(0, newPrice - order.price)
    * order.remainingAmount
    * MARKET_FEE_RATE;
  return ceilToMilliCredit(formula);
}

function estimateExtensionFee(order, addAmount) {
  return ceilToMilliCredit(
    order.price * addAmount * MARKET_FEE_RATE
  );
}</code></pre>
<p><strong>Important:</strong> this is a conservative project-side reserve estimate, not a billing receipt. The runtime API does an initial Credits check when you call it, but the global processor checks money again. Another fee-bearing market intent submitted in the same tick can consume Credits before a later intent is processed. That means <code>OK</code> is still only “scheduled successfully,” not proof that the mutation settled.</p>
<p>To make your own automation predictable, serialize fee-bearing market maintenance through one writer. A Credits reserve protects your policy only against requests that this writer knows about; it cannot reserve Credits against unrelated code that also submits market intents.</p>

<h2 id="single-writer">Use one writer and one request ID</h2>
<p>A safe maintenance module should fail closed when a request is ambiguous or duplicated:</p>
<ul>
  <li>one explicit action: change price, extend, or cancel;</li>
  <li>one exact owned order ID;</li>
  <li>one expected fingerprint with nullable room identity;</li>
  <li>one unique <code>requestId</code> that cannot be executed twice;</li>
  <li>one pending accepted request at a time;</li>
  <li>one Credits reserve check using a conservative fee estimate.</li>
</ul>
<p>Do not automatically retry an accepted request because its effect was not observed immediately. A retry can duplicate an extension or race another writer. Resolve the evidence gap first, then create a new request ID only if you intentionally want another mutation.</p>

<h2 id="complete-example">Complete one-shot maintenance controller</h2>
<p>The example below accepts a preconfigured request in Memory. It verifies any previous accepted request first, refuses duplicate request IDs, re-reads the owned order, checks the fingerprint, calculates a conservative reserve estimate, disables the request before the API call, preserves the raw return code, and records the next-tick order state.</p>
<pre><code class="language-js">const MARKET_ACTIONS = new Set([
  'change-price',
  'extend-order',
  'cancel-order'
]);
const HISTORY_LIMIT = 30;
const REQUEST_ID_LIMIT = 50;
const NUMBER_EPSILON = 1e-9;
const MARKET_FEE_RATE = 0.05;

function sameNumber(left, right) {
  return Number.isFinite(left)
    &amp;&amp; Number.isFinite(right)
    &amp;&amp; Math.abs(left - right) &lt;= NUMBER_EPSILON;
}

function ceilToMilliCredit(value) {
  if (!Number.isFinite(value) || value &lt;= 0) return 0;
  return Math.ceil(value * 1000 - 1e-9) / 1000;
}

function getMaintenanceMemory() {
  Memory.market ??= {};
  Memory.market.orderMaintenance ??= {
    request: null,
    pending: null,
    history: [],
    attemptedRequestIds: []
  };
  return Memory.market.orderMaintenance;
}

function copyOrderSnapshot(order) {
  if (!order) return null;
  return {
    id: order.id,
    created: order.created ?? null,
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

function rememberAttemptedRequestId(memory, requestId) {
  memory.attemptedRequestIds.push(requestId);
  memory.attemptedRequestIds = memory.attemptedRequestIds
    .slice(-REQUEST_ID_LIMIT);
}

function wasAttempted(memory, requestId) {
  return memory.attemptedRequestIds.includes(requestId);
}

function validateRequest(request) {
  if (!request || request.enabled !== true) {
    return { ok: false, reason: 'request-disabled' };
  }
  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
  ) return { ok: false, reason: 'invalid-request-id' };

  if (!MARKET_ACTIONS.has(request.action)) {
    return { ok: false, reason: 'invalid-action' };
  }
  if (
    typeof request.orderId !== 'string'
    || request.orderId.length === 0
  ) return { ok: false, reason: 'invalid-order-id' };

  const expected = request.expected;
  if (
    !expected
    || typeof expected !== 'object'
    || typeof expected.type !== 'string'
    || typeof expected.resourceType !== 'string'
    || !(
      expected.roomName === null
      || typeof expected.roomName === 'string'
    )
    || !Number.isFinite(expected.price)
    || expected.price &lt;= 0
    || !Number.isFinite(expected.totalAmount)
    || expected.totalAmount &lt;= 0
  ) return { ok: false, reason: 'invalid-order-fingerprint' };

  if (
    !Number.isFinite(request.reserveCredits)
    || request.reserveCredits &lt; 0
  ) return { ok: false, reason: 'invalid-credit-reserve' };

  if (
    request.action === 'change-price'
    &amp;&amp; (!Number.isFinite(request.newPrice) || request.newPrice &lt;= 0)
  ) return { ok: false, reason: 'invalid-new-price' };

  if (
    request.action === 'extend-order'
    &amp;&amp; (!Number.isInteger(request.addAmount) || request.addAmount &lt;= 0)
  ) return { ok: false, reason: 'invalid-add-amount' };

  if (
    request.action === 'cancel-order'
    &amp;&amp; request.confirmCancel !== true
  ) return { ok: false, reason: 'cancel-not-confirmed' };

  return { ok: true, reason: null };
}

function matchesExpectedOrder(order, expected) {
  return order.type === expected.type
    &amp;&amp; order.resourceType === expected.resourceType
    &amp;&amp; (order.roomName ?? null) === expected.roomName
    &amp;&amp; sameNumber(order.price, expected.price)
    &amp;&amp; order.totalAmount === expected.totalAmount;
}

function estimateFee(order, request) {
  if (request.action === 'change-price') {
    return ceilToMilliCredit(
      Math.max(0, request.newPrice - order.price)
      * order.remainingAmount
      * MARKET_FEE_RATE
    );
  }
  if (request.action === 'extend-order') {
    return ceilToMilliCredit(
      order.price * request.addAmount * MARKET_FEE_RATE
    );
  }
  return 0;
}

function finishRequest(request, status, detail = {}) {
  request.enabled = false;
  request.status = status;
  request.finishedAt = Game.time;
  Object.assign(request, detail);
}

function verifyPending() {
  const memory = getMaintenanceMemory();
  const pending = memory.pending;
  if (!pending || pending.tick &gt;= Game.time) return null;

  const order = Game.market.orders[pending.orderId] ?? null;
  const after = copyOrderSnapshot(order);
  let status = 'mutation-not-observed';

  if (pending.action === 'change-price') {
    status = order &amp;&amp; sameNumber(order.price, pending.newPrice)
      ? 'requested-price-observed'
      : order
        ? 'requested-price-not-observed'
        : 'order-unavailable-after-price-request';
  }

  if (pending.action === 'extend-order') {
    const expectedTotal = pending.before.totalAmount
      + pending.addAmount;
    status = order &amp;&amp; order.totalAmount &gt;= expectedTotal
      ? 'total-capacity-increase-observed'
      : order
        ? 'extension-not-observed'
        : 'order-unavailable-after-extension';
  }

  if (pending.action === 'cancel-order') {
    status = order
      ? 'cancel-not-observed'
      : 'order-absence-observed';
  }

  const record = {
    verifiedAt: Game.time,
    ...pending,
    after,
    status,
    creditsObservedAfter: Game.market.credits,
    creditsDelta: Game.market.credits - pending.creditsBefore,
    priceDelta: after
      ? after.price - pending.before.price
      : null,
    remainingAmountDelta: after
      ? after.remainingAmount - pending.before.remainingAmount
      : null,
    totalAmountDelta: after
      ? after.totalAmount - pending.before.totalAmount
      : null
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-HISTORY_LIMIT);
  memory.pending = null;
  return record;
}

function processMarketOrderMaintenance() {
  const memory = getMaintenanceMemory();
  const verification = verifyPending();

  // One accepted mutation is verified before another is submitted.
  if (memory.pending) {
    return { status: 'awaiting-next-tick-verification' };
  }

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

  if (wasAttempted(memory, request.requestId)) {
    finishRequest(request, 'duplicate-request-id');
    return { status: 'duplicate-request-id', verification };
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

  if (
    request.action === 'change-price'
    &amp;&amp; sameNumber(order.price, request.newPrice)
  ) {
    finishRequest(request, 'price-already-matches');
    return { status: 'price-already-matches', verification };
  }

  const estimatedFee = estimateFee(order, request);
  const creditsBefore = Game.market.credits;
  if (creditsBefore - estimatedFee &lt; request.reserveCredits) {
    finishRequest(request, 'credit-reserve-would-be-crossed', {
      estimatedFee,
      creditsBefore
    });
    return {
      status: 'credit-reserve-would-be-crossed',
      estimatedFee,
      verification
    };
  }

  const before = copyOrderSnapshot(order);

  // Idempotency boundary: once we reach an API attempt, this ID is spent.
  rememberAttemptedRequestId(memory, request.requestId);
  request.enabled = false;
  request.estimatedFee = estimatedFee;
  request.creditsBefore = creditsBefore;
  request.before = before;

  let result = ERR_INVALID_ARGS;
  if (request.action === 'change-price') {
    result = Game.market.changeOrderPrice(
      request.orderId,
      request.newPrice
    );
  } else if (request.action === 'extend-order') {
    result = Game.market.extendOrder(
      request.orderId,
      request.addAmount
    );
  } else if (request.action === 'cancel-order') {
    result = Game.market.cancelOrder(request.orderId);
  }

  request.result = result;
  request.finishedAt = Game.time;
  request.status = result === OK
    ? 'request-scheduled'
    : 'api-rejected';

  if (result === OK) {
    memory.pending = {
      tick: Game.time,
      requestId: request.requestId,
      action: request.action,
      orderId: request.orderId,
      before,
      estimatedFee,
      creditsBefore,
      newPrice: request.action === 'change-price'
        ? request.newPrice
        : null,
      addAmount: request.action === 'extend-order'
        ? request.addAmount
        : null
    };
  }

  return {
    status: request.status,
    action: request.action,
    orderId: request.orderId,
    result,
    estimatedFee,
    creditsBefore,
    before,
    verification
  };
}

module.exports.loop = function () {
  const outcome = processMarketOrderMaintenance();
  if (
    outcome.status !== 'no-enabled-request'
    || outcome.verification
  ) {
    console.log(JSON.stringify({
      type: 'market-order-maintenance',
      tick: Game.time,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="next-tick-proof">What next-tick verification can—and cannot—prove</h2>
<p>The official API describes <code>OK</code> as “scheduled successfully.” The checked engine also revalidates ownership/arguments and, for fee-bearing operations, available money while processing global intents. Therefore the accepted return code and the later order state are two distinct pieces of evidence.</p>
<table>
  <thead><tr><th>Action</th><th>Next-tick observation</th><th>Evidence limit</th></tr></thead>
  <tbody>
    <tr><td>Change price</td><td>Current order exists and its price matches the requested price.</td><td>Strong state evidence; unique causality still assumes this module is the only writer changing that order.</td></tr>
    <tr><td>Extend order</td><td><code>totalAmount</code> is at least the previous total plus <code>addAmount</code>.</td><td>Do not require an exact <code>remainingAmount</code> delta because deals can reduce remaining capacity.</td></tr>
    <tr><td>Cancel order</td><td>The order is absent from <code>Game.market.orders</code>.</td><td>Strong state evidence under a single-writer policy; absence alone does not identify which writer caused it.</td></tr>
  </tbody>
</table>
<p>Current market-maintenance methods do not produce a Room event-log record equivalent to a Creep <code>transfer()</code>. The public script therefore cannot use <code>Room.getEventLog()</code> as an exact maintenance receipt.</p>
<p><code>creditsDelta</code> is also not an exact fee receipt when other deals, sales, purchases, order fees, or market maintenance can change Credits during the same observation window. Preserve it as context. Do not claim that <code>-creditsDelta === estimatedFee</code> unless you control and document the whole market-write window.</p>
<p>One current-engine detail explains why an extension check should focus on <code>totalAmount</code>: the global market processor applies order extensions before processing deals, and a later deal can still reduce <code>remainingAmount</code>. A price change that actually changes the price is marked to skip deals on that order in the same processor pass. These are checked engine behaviors, not generic promises for every future engine version.</p>

<h2 id="return-codes">Return-code and source mismatch checklist</h2>
<table>
  <thead><tr><th>Method</th><th>Current official documentation</th><th>Checked 4.3.2 runtime wrapper</th></tr></thead>
  <tbody>
    <tr><td><code>changeOrderPrice()</code></td><td><code>OK</code>, <code>ERR_NOT_OWNER</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_ARGS</code></td><td>The checked wrapper directly returns <code>OK</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, or <code>ERR_INVALID_ARGS</code> for this call path; it resolves the order from your own <code>Game.market.orders</code>.</td></tr>
    <tr><td><code>extendOrder()</code></td><td><code>OK</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_ARGS</code></td><td>Matches those direct wrapper checks.</td></tr>
    <tr><td><code>cancelOrder()</code></td><td><code>OK</code>, <code>ERR_INVALID_ARGS</code></td><td>Matches those direct wrapper checks.</td></tr>
  </tbody>
</table>
<p>The documentation/engine difference for <code>changeOrderPrice()</code> is recorded rather than silently “fixed” in favor of one source. Preserve the raw code your account actually returns. If you observe <code>ERR_NOT_OWNER</code> on the official shard, that live observation is stronger operational evidence than this static source comparison and should be recorded with the exact tick and order type.</p>
<p>None of these methods uses Creep range, so <code>ERR_NOT_IN_RANGE</code> does not belong in this maintenance workflow.</p>

<h2 id="boundaries">Evidence and engine boundaries</h2>
<p>The current official <code>Game.market.orders</code>, <code>changeOrderPrice()</code>, <code>extendOrder()</code>, <code>cancelOrder()</code>, and order-room rules were rechecked on August 18, 2026. Current <code>screeps/engine</code> master was also checked at 4.3.2, commit <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>.</p>
<p><strong>Fee boundary:</strong> 5% formulas are documented API rules. Rounding to the next 0.001 Credit in this article is a conservative project reserve policy motivated by the current processor's internal <code>Math.ceil</code>; it is not presented as a universal billing API.</p>
<p><strong>Concurrency boundary:</strong> the runtime wrapper can return <code>OK</code> before the global processor applies the mutation. Multiple same-tick fee-bearing market intents can compete for the same Credits balance, and unrelated market activity can make Credits deltas ambiguous.</p>
<p><strong>Writer boundary:</strong> next-tick state proves the observed order state. Attribution to this request is strongest only when one module owns writes to that order and request IDs are not reused.</p>
<p><strong>Live evidence:</strong> Screeps Console test: Pending. Live account-bound order maintenance: Pending. Same-tick multi-fee contention: Pending. Live official-shard return-code mismatch check: Pending. No live result is fabricated.</p>
<p>Continue with <a href="/en/blog/screeps-market-create-order">creating market orders</a>, <a href="/en/blog/screeps-market-deal">executing deals</a>, or <a href="/en/blog/screeps-terminal-send-resources">Terminal transfers</a>.</p>
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
      url: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about`, sameAs: [siteConfig.links.github] },
      publisher: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: articleTags,
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
      modifiedAt={modifiedTime}
      readingTime="21 min read"
      tags={articleTags}
      verification={[
        { term: "Official documentation", value: "Checked August 18, 2026 — Game.market.orders, changeOrderPrice(), extendOrder(), cancelOrder(), 5% fee formulas, and optional roomName for account-bound resources" },
        { term: "Engine source", value: "screeps/engine 4.3.2 · 80977824199a596d174d392fd0cf8c458c21fcbd" },
        { term: "Static code review", value: "Passed — nullable room fingerprint, duplicate request protection, conservative fee reserve, single pending mutation, and next-tick state verification" },
        { term: "Source discrepancy", value: "Current docs list ERR_NOT_OWNER for changeOrderPrice(); checked 4.3.2 runtime wrapper does not directly emit it on this path" },
        { term: "Screeps Console test", value: "Pending — no real-account Console transcript was collected for this revision" },
        { term: "Live multi-tick verification pending", value: "Pending — no account-bound maintenance, same-tick multi-fee contention, or live return-code mismatch trace was collected" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
