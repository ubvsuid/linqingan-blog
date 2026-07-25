import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishMarketCreateOrderArticle = {
  slug: "screeps-market-create-order",
  path: "/en/blog/screeps-market-create-order",
  chinesePath: "/blog/screeps-market-create-order",
  title: "Screeps createOrder(): Fees, Checks, and Safe Requests",
  headline: "How to Create a Market Order Safely in Screeps",
  description:
    "Create one reviewed market order with a one-time Memory request, validate Terminal ownership, calculate the 5% fee and Credit reserve, reject duplicates, snapshot the request, handle ERR_FULL without hard-coding a disputed order limit, and verify the order afterward.",
  category: "MARKET · SAFE ORDER CREATION",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Market Order Creation",
  tags: ["Screeps", "Market", "createOrder", "Credits", "Terminal"],
  keywords: [
    "Screeps Game.market.createOrder",
    "Screeps market order fee",
    "Screeps ERR_FULL order limit",
    "Screeps duplicate market order",
    "Screeps market order Memory request",
  ],
  primaryKeyword: "Screeps Game.market.createOrder",
  searchIntent: "Create one market order with explicit fee, duplicate, and retry safeguards",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — createOrder(), 5% fee, order activation, return codes, cancelOrder(), changeOrderPrice() and extendOrder()"],
    ["Documentation conflict", "The current API page says 300 maximum orders but its ERR_FULL text still says 50; no numeric limit is hard-coded"],
    ["Execution boundary", "OK means the operation was scheduled; it does not prove the order is active or filled"],
    ["JavaScript syntax", "Passed"],
    ["Offline order review", "Passed — invalid values, missing Terminal, fee reserve, duplicate request, disabled request and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live order creation, activation and market fill test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["fee", "Calculate the 5% creation fee"],
    ["one-time-request", "Use a one-time request"],
    ["validate", "Validate values and Terminal state"],
    ["duplicates", "Reject equivalent duplicate orders"],
    ["pure-plan", "Build a testable order plan"],
    ["complete-example", "Complete one-time createOrder example"],
    ["disable-before-call", "Disable before the irreversible call"],
    ["order-limit", "Do not hard-code the disputed order limit"],
    ["after-ok", "Verify the order after OK"],
    ["maintenance", "Change, extend, or cancel the existing order"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How much does creating a market order cost?",
      "The official market charges 5% of price multiplied by total amount when the order is placed. Keep an additional Credit reserve if your account must not fall below a business floor.",
    ],
    [
      "Does createOrder() returning OK mean the order is active?",
      "No. OK means the operation was scheduled. The order can be active or inactive depending on resource, Credit, Terminal, and order state.",
    ],
    [
      "What is the maximum number of market orders?",
      "The current official API page is internally inconsistent: the method text says 300 while the ERR_FULL description still says 50. Do not hard-code either number; inspect your orders and handle ERR_FULL.",
    ],
    [
      "Should a failed createOrder request retry every tick?",
      "No. Disable the one-time request before calling the API and require a new explicit review after any failure.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-roomvisual-debug",
    label: "Previous observability guide",
    title: "Draw RoomVisual Diagnostics",
  },
  next: {
    href: "/en/blog/screeps-market-deal",
    label: "Next market guide",
    title: "Execute a Reviewed Market Deal",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>Game.market.createOrder()</code> only from an explicit one-time request. Validate the order type, resource, positive price, positive integer amount, owned active Terminal, 5% fee, Credit reserve, and equivalent existing orders. Disable the request before the API call, save the exact snapshot and return code, then confirm the order in <code>Game.market.orders</code> on a later tick.</p>

<h2 id="fee">Calculate the 5% creation fee</h2>
<p>The official market charges a fee when an order is placed:</p>
<pre><code class="language-text">creation fee = price × totalAmount × 0.05</code></pre>
<pre><code class="language-javascript">function calculateOrderFee(price, totalAmount) {
  if (
    !Number.isFinite(price)
    || price <= 0
    || !Number.isInteger(totalAmount)
    || totalAmount <= 0
  ) {
    return null;
  }

  return price * totalAmount * 0.05;
}</code></pre>
<p>A sell order does not prepay the full resource value. A buy order also does not spend the full future purchase value at creation. Both pay the 5% placement fee, while later activation and deals depend on available resources or Credits.</p>

<h2 id="one-time-request">Use a one-time request</h2>
<pre><code class="language-javascript">Memory.market ??= {};
Memory.market.createOrderRequest = {
  enabled: true,
  requestId: 'manual-order-2026-07-26-01',
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  price: 1,
  totalAmount: 10000,
  roomName: 'W1N1',
  creditReserve: 1000000
};</code></pre>
<p>Every number is an example, not a market recommendation. Review the current market, inventory, Terminal, fee, account budget, and intended order direction before enabling the request.</p>

<h2 id="validate">Validate values and Terminal state</h2>
<pre><code class="language-javascript">function validateOrderRequest(request) {
  if (!request || request.enabled !== true) {
    return { valid: false, reason: 'disabled' };
  }

  if (
    request.type !== ORDER_BUY
    && request.type !== ORDER_SELL
  ) {
    return { valid: false, reason: 'order-type-invalid' };
  }

  if (
    typeof request.resourceType !== 'string'
    || typeof request.roomName !== 'string'
    || request.roomName.length === 0
    || !Number.isFinite(request.price)
    || request.price <= 0
    || !Number.isInteger(request.totalAmount)
    || request.totalAmount <= 0
  ) {
    return { valid: false, reason: 'arguments-invalid' };
  }

  return { valid: true, reason: 'valid' };
}</code></pre>
<p>For ordinary Terminal resources, verify that the requested room is currently visible and contains your active Terminal. Account-bound resources use different room rules and are outside this guide.</p>

<h2 id="duplicates">Reject equivalent duplicate orders</h2>
<pre><code class="language-javascript">function findEquivalentOrder(request) {
  return Object.values(Game.market.orders).find(order =>
    order.type === request.type
    && order.resourceType === request.resourceType
    && order.roomName === request.roomName
  ) || null;
}</code></pre>
<p>Equivalent does not necessarily mean identical price or remaining amount. The safer default is to stop and review the existing order, then use the dedicated maintenance APIs rather than creating another order every tick.</p>

<h2 id="pure-plan">Build a testable order plan</h2>
<pre><code class="language-javascript">function evaluateOrderPlan(input) {
  const validation = validateOrderRequest(input.request);

  if (!validation.valid) {
    return { ready: false, reason: validation.reason };
  }

  if (!input.terminalReady) {
    return { ready: false, reason: 'terminal-not-ready' };
  }

  if (input.duplicateFound) {
    return { ready: false, reason: 'equivalent-order-exists' };
  }

  const fee = calculateOrderFee(
    input.request.price,
    input.request.totalAmount
  );

  if (!Number.isFinite(fee)) {
    return { ready: false, reason: 'fee-invalid' };
  }

  const reserve = Number.isFinite(
    input.request.creditReserve
  )
    ? input.request.creditReserve
    : 0;

  if (input.credits - fee < reserve) {
    return {
      ready: false,
      reason: 'credit-reserve',
      fee
    };
  }

  return {
    ready: true,
    reason: 'ready',
    fee,
    creditsAfterFee: input.credits - fee
  };
}</code></pre>
<p>This function does not call the market. It can be tested with snapshots before any irreversible operation.</p>

<h2 id="complete-example">Complete one-time createOrder example</h2>
<p><strong>State impact:</strong> this code writes request status and may schedule one real market order. It intentionally does not auto-retry.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const request = Memory.market?.createOrderRequest;
  const validation = validateOrderRequest(request);

  if (!validation.valid) {
    return;
  }

  const room = Game.rooms[request.roomName];
  const terminal = room?.terminal ?? null;
  const terminalReady = Boolean(
    room
    && terminal
    && terminal.my === true
    && terminal.isActive() === true
  );
  const duplicate = findEquivalentOrder(request);
  const plan = evaluateOrderPlan({
    request,
    credits: Game.market.credits,
    terminalReady,
    duplicateFound: Boolean(duplicate)
  });

  request.lastCheckedAt = Game.time;
  request.lastStatus = plan.reason;

  if (!plan.ready) {
    request.preview = {
      fee: plan.fee ?? null,
      duplicateOrderId: duplicate?.id ?? null,
      currentOrderCount:
        Object.keys(Game.market.orders).length
    };
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    requestId: request.requestId ?? null,
    type: request.type,
    resourceType: request.resourceType,
    price: request.price,
    totalAmount: request.totalAmount,
    roomName: request.roomName,
    fee: plan.fee,
    creditsBefore: Game.market.credits,
    currentOrderCount:
      Object.keys(Game.market.orders).length
  };

  const result = Game.market.createOrder({
    type: request.type,
    resourceType: request.resourceType,
    price: request.price,
    totalAmount: request.totalAmount,
    roomName: request.roomName
  });

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-verification'
    : 'failed-review-required';

  console.log(JSON.stringify({
    type: 'market-create-order-result',
    requestId: request.requestId ?? null,
    roomName: request.roomName,
    resourceType: request.resourceType,
    orderType: request.type,
    price: request.price,
    totalAmount: request.totalAmount,
    fee: plan.fee,
    result
  }));
};</code></pre>

<h2 id="disable-before-call">Disable before the irreversible call</h2>
<p>The request is disabled before <code>createOrder()</code>. A transient error, changed Terminal, invalid arguments, or order-cap failure must not cause another automatic order on the next tick. Review the snapshot and return code, then create a new request ID if another attempt is justified.</p>

<h2 id="order-limit">Do not hard-code the disputed order limit</h2>
<p>As of the verification date, the official API page says the maximum order count is 300 in the method description, while the <code>ERR_FULL</code> table still says more than 50 cannot be created. Because those statements conflict, this guide logs:</p>
<pre><code class="language-javascript">const currentOrderCount = Object.keys(
  Game.market.orders
).length;</code></pre>
<p>It does not reject at 50 or 300. The actual API result remains authoritative, and <code>ERR_FULL</code> requires manual review rather than an automatic loop.</p>

<h2 id="after-ok">Verify the order after OK</h2>
<pre><code class="language-javascript">function findOrderAfterRequest(snapshot) {
  return Object.values(Game.market.orders).find(order =>
    order.type === snapshot.type
    && order.resourceType === snapshot.resourceType
    && order.roomName === snapshot.roomName
    && order.price === snapshot.price
    && order.totalAmount === snapshot.totalAmount
  ) || null;
}</code></pre>
<p>A matching order confirms that the order now exists in your account snapshot. Check its <code>active</code>, <code>amount</code>, <code>remainingAmount</code>, and <code>totalAmount</code> separately. Existence does not prove a trade has occurred.</p>

<h2 id="maintenance">Change, extend, or cancel the existing order</h2>
<ul>
<li><code>changeOrderPrice()</code> changes price; raising it charges 5% on the price difference multiplied by remaining amount.</li>
<li><code>extendOrder()</code> adds capacity and charges 5% on the added value.</li>
<li><code>cancelOrder()</code> removes the order; the original 5% fee is not returned.</li>
</ul>
<p>Frequent cancel-and-recreate cycles can lose Credits unnecessarily.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Interpretation</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Operation scheduled</td><td>Find the order afterward</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Terminal or room ownership condition failed</td><td>Room and Terminal</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Insufficient Credits for the fee</td><td>Fee and reserve</td></tr>
<tr><td><code>ERR_FULL</code></td><td>No more orders accepted</td><td>Current orders and current API behavior</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid request arguments</td><td>Type, resource, price, amount, room</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require an explicit one-time request ID.</li>
<li>Validate type, resource, room, price, and integer amount.</li>
<li>Check an owned active Terminal for ordinary resources.</li>
<li>Calculate the 5% fee.</li>
<li>Preserve a Credit reserve.</li>
<li>Reject an equivalent existing order.</li>
<li>Disable before calling the API.</li>
<li>Save the exact snapshot and return code.</li>
<li>Handle <code>ERR_FULL</code> without hard-coded 50 or 300 checks.</li>
<li>Verify order existence and activity later.</li>
<li>Never describe order creation as a completed trade.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement automatic pricing, market forecasting, profit calculations, account-bound resources, multi-shard strategy, automatic retries, or fill prediction. Continue with <a href="/en/blog/screeps-market-deal">a reviewed one-time deal</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is price 1 a recommended Utrium price?</h3>
<p>No. It is an example input.</p>
<h3>Why check duplicates before calling?</h3>
<p>Repeated main-loop calls can create several equivalent orders and pay several fees.</p>
<h3>Does cancellation refund the fee?</h3>
<p>No. The official documentation says the 5% fee is not returned.</p>
<h3>Can I trust one documented order-limit number?</h3>
<p>Not while the current API page contains conflicting 300 and 50 statements. Handle the return code.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/market.html" rel="nofollow">Screeps Documentation: Market System</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.createOrder" rel="nofollow">API Reference: Game.market.createOrder()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.orders" rel="nofollow">API Reference: Game.market.orders</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.changeOrderPrice" rel="nofollow">API Reference: changeOrderPrice()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.extendOrder" rel="nofollow">API Reference: extendOrder()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.cancelOrder" rel="nofollow">API Reference: cancelOrder()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
