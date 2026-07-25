import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishMarketDealArticle = {
  slug: "screeps-market-deal",
  path: "/en/blog/screeps-market-deal",
  chinesePath: "/blog/screeps-market-deal",
  title: "Screeps market.deal(): Price, Energy, and Reserves",
  headline: "How to Execute a Reviewed Market Deal Safely",
  description:
    "Execute one specified sell order with a one-time request, refresh the current order snapshot, use amount rather than remainingAmount, enforce a price ceiling, Credit and Terminal Energy reserves, estimate transaction cost, disable before deal(), and verify the transaction afterward.",
  category: "MARKET · REVIEWED ONE-TIME DEAL",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Market Deal",
  tags: ["Screeps", "Market", "deal", "Terminal", "Credits"],
  keywords: [
    "Screeps Game.market.deal",
    "Screeps market transaction energy",
    "Screeps order amount remainingAmount",
    "Screeps market price ceiling",
    "Screeps market deal ERR_FULL",
  ],
  primaryKeyword: "Screeps Game.market.deal",
  searchIntent: "Execute one reviewed market order with current price, amount, Credit, and Energy safeguards",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — deal(), getOrderById(), calcTransactionCost(), amount, remainingAmount, 10-deal limit and transaction priority"],
    ["Market boundary", "The complete example buys a normal resource from one specified sell order; account-bound resources and selling to buy orders are excluded"],
    ["Execution boundary", "OK means the operation was scheduled; Credits, Store and transaction records require later verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline deal review", "Passed — stale order, direction, resource, price, current amount, Credit reserve, Energy reserve, cooldown and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live order race, settlement and transaction-record test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["executor-pays", "The deal executor pays transfer Energy"],
    ["amount-fields", "Use amount, not remainingAmount"],
    ["refresh-order", "Refresh the exact order before execution"],
    ["budget", "Calculate Credit and Energy budgets"],
    ["pure-plan", "Build a testable deal plan"],
    ["complete-example", "Complete one-time buy example"],
    ["disable-before-call", "Disable before calling deal"],
    ["race", "The market can change after preflight"],
    ["ten-deals", "Centralize the 10-deal account limit"],
    ["after-ok", "Verify settlement on a later tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Who pays the Energy cost in Game.market.deal()?",
      "The player who executes the deal pays the transfer Energy from the selected Terminal, regardless of whether the order is a buy or sell order.",
    ],
    [
      "Should a deal use order.amount or order.remainingAmount?",
      "Use order.amount for the amount currently available to execute. remainingAmount describes the order's remaining planned capacity and may exceed current availability.",
    ],
    [
      "Does OK mean the purchased resource has arrived?",
      "No. It means the operation was scheduled. Verify incoming or outgoing transactions, Credits, Terminal Store, and the stored request snapshot afterward.",
    ],
    [
      "Can a preflight guarantee the order is still available?",
      "No. Other players and your own modules can change the order or Terminal state before execution. The API return code is the final same-tick result.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-market-create-order",
    label: "Previous market guide",
    title: "Create a Market Order",
  },
  next: {
    href: "/en/blog/screeps-terminal-send-resources",
    label: "Next logistics guide",
    title: "Send Resources Between Terminals",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>Game.market.deal()</code> only for one explicitly reviewed order ID. Fetch the current order again, verify it is the expected sell order and resource, cap the current price, limit the amount to <code>order.amount</code>, estimate transfer Energy, preserve Credit and Terminal Energy reserves, disable the request before calling the API, and verify the later transaction record instead of printing “bought” after <code>OK</code>.</p>

<h2 id="executor-pays">The deal executor pays transfer Energy</h2>
<p>The official market assigns transfer Energy and Terminal cooldown to the player who calls <code>deal()</code>. This remains true when buying from another player's sell order.</p>
<pre><code class="language-javascript">function estimateDealEnergy(
  amount,
  yourRoomName,
  orderRoomName
) {
  if (
    !Number.isInteger(amount)
    || amount <= 0
    || typeof yourRoomName !== 'string'
    || typeof orderRoomName !== 'string'
  ) {
    return null;
  }

  return Game.market.calcTransactionCost(
    amount,
    yourRoomName,
    orderRoomName
  );
}</code></pre>
<p>The estimate uses amount and room names. Applied Terminal power effects can change actual transfer cost, so later Store and transaction records remain the settlement evidence.</p>

<h2 id="amount-fields">Use amount, not remainingAmount</h2>
<div class="table-scroll"><table>
<thead><tr><th>Order field</th><th>Meaning</th><th>Deal use</th></tr></thead>
<tbody>
<tr><td><code>amount</code></td><td>Current amount available to deal</td><td>Hard execution ceiling</td></tr>
<tr><td><code>remainingAmount</code></td><td>Remaining planned order capacity</td><td>Order lifecycle information</td></tr>
<tr><td><code>totalAmount</code></td><td>Original or extended total capacity</td><td>Order history and maintenance</td></tr>
</tbody></table></div>
<p>An inactive order can have remaining capacity while its current <code>amount</code> is zero.</p>

<h2 id="refresh-order">Refresh the exact order before execution</h2>
<pre><code class="language-javascript">function getReviewedSellOrder(request) {
  if (
    !request
    || typeof request.orderId !== 'string'
  ) {
    return {
      ready: false,
      reason: 'order-id-invalid',
      order: null
    };
  }

  const order = Game.market.getOrderById(
    request.orderId
  );

  if (!order) {
    return {
      ready: false,
      reason: 'order-unavailable',
      order: null
    };
  }

  if (order.type !== ORDER_SELL) {
    return {
      ready: false,
      reason: 'order-not-sell',
      order
    };
  }

  if (order.resourceType !== request.resourceType) {
    return {
      ready: false,
      reason: 'resource-mismatch',
      order
    };
  }

  return {
    ready: true,
    reason: 'order-reviewed',
    order
  };
}</code></pre>
<p>Never execute a copied ID without rechecking its current direction, resource, price, room, and available amount.</p>

<h2 id="budget">Calculate Credit and Energy budgets</h2>
<pre><code class="language-text">credit cost = order.price × amount
credits after = current credits - credit cost
terminal Energy after = current Energy - transaction Energy</code></pre>
<p>For a normal resource purchase, the incoming resource is not included in the preflight Energy reserve. If the resource being purchased is Energy, this is deliberately conservative because the Terminal still needs enough Energy to execute the transaction before incoming Energy is settled.</p>

<h2 id="pure-plan">Build a testable deal plan</h2>
<pre><code class="language-javascript">function evaluateBuyDeal(input) {
  const { request, order } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (!order) {
    return { ready: false, reason: 'order-unavailable' };
  }

  if (
    order.type !== ORDER_SELL
    || order.resourceType !== request.resourceType
  ) {
    return { ready: false, reason: 'order-mismatch' };
  }

  if (
    !Number.isInteger(request.amount)
    || request.amount <= 0
    || request.amount > order.amount
  ) {
    return { ready: false, reason: 'amount-unavailable' };
  }

  if (
    !Number.isFinite(request.maximumPrice)
    || order.price > request.maximumPrice
  ) {
    return { ready: false, reason: 'price-above-limit' };
  }

  if (!Number.isFinite(input.transactionEnergy)) {
    return { ready: false, reason: 'energy-cost-invalid' };
  }

  const creditCost = order.price * request.amount;
  const creditReserve = Number.isFinite(
    request.creditReserve
  )
    ? request.creditReserve
    : 0;
  const energyReserve = Number.isFinite(
    request.energyReserve
  )
    ? request.energyReserve
    : 0;

  if (input.credits - creditCost < creditReserve) {
    return {
      ready: false,
      reason: 'credit-reserve',
      creditCost
    };
  }

  if (
    input.terminalEnergy - input.transactionEnergy
    < energyReserve
  ) {
    return {
      ready: false,
      reason: 'energy-reserve',
      creditCost,
      transactionEnergy: input.transactionEnergy
    };
  }

  return {
    ready: true,
    reason: 'ready',
    creditCost,
    transactionEnergy: input.transactionEnergy,
    creditsAfter: input.credits - creditCost,
    terminalEnergyAfter:
      input.terminalEnergy - input.transactionEnergy
  };
}</code></pre>

<h2 id="complete-example">Complete one-time buy example</h2>
<p><strong>State impact:</strong> this code may execute one real market deal. It writes a request snapshot and never retries automatically.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const request = Memory.market?.dealRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const terminal = typeof request.terminalId === 'string'
    ? Game.getObjectById(request.terminalId)
    : null;

  if (
    !terminal
    || terminal.structureType !== STRUCTURE_TERMINAL
    || terminal.my !== true
    || terminal.isActive() !== true
    || terminal.cooldown > 0
  ) {
    request.lastStatus = 'terminal-not-ready';
    request.lastCheckedAt = Game.time;
    return;
  }

  const reviewed = getReviewedSellOrder(request);
  if (!reviewed.ready) {
    request.lastStatus = reviewed.reason;
    request.lastCheckedAt = Game.time;
    return;
  }

  const order = reviewed.order;
  const transactionEnergy =
    Game.market.calcTransactionCost(
      request.amount,
      terminal.room.name,
      order.roomName
    );
  const plan = evaluateBuyDeal({
    request,
    order,
    credits: Game.market.credits,
    terminalEnergy:
      terminal.store.getUsedCapacity(RESOURCE_ENERGY),
    transactionEnergy
  });

  request.lastStatus = plan.reason;
  request.lastCheckedAt = Game.time;

  if (!plan.ready) {
    request.preview = {
      currentPrice: order.price,
      currentAmount: order.amount,
      remainingAmount: order.remainingAmount,
      creditCost: plan.creditCost ?? null,
      transactionEnergy:
        plan.transactionEnergy ?? transactionEnergy
    };
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    orderId: order.id,
    orderType: order.type,
    resourceType: order.resourceType,
    orderRoomName: order.roomName,
    yourRoomName: terminal.room.name,
    amount: request.amount,
    price: order.price,
    orderAmountBefore: order.amount,
    remainingAmountBefore: order.remainingAmount,
    creditsBefore: Game.market.credits,
    terminalEnergyBefore:
      terminal.store.getUsedCapacity(RESOURCE_ENERGY),
    creditCost: plan.creditCost,
    transactionEnergy: plan.transactionEnergy
  };

  const result = Game.market.deal(
    order.id,
    request.amount,
    terminal.room.name
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-settlement'
    : 'failed-review-required';

  console.log(JSON.stringify({
    type: 'market-deal-result',
    orderId: order.id,
    roomName: terminal.room.name,
    resourceType: order.resourceType,
    amount: request.amount,
    price: order.price,
    creditCost: plan.creditCost,
    transactionEnergy: plan.transactionEnergy,
    result
  }));
};</code></pre>

<h2 id="disable-before-call">Disable before calling deal</h2>
<p>Market conditions can change between ticks. A failed call must not repeat automatically with an old order snapshot, old price ceiling, or old budget. Re-enable only after reviewing the current order and request.</p>

<h2 id="race">The market can change after preflight</h2>
<p>Another player may consume the order, and the official documentation says the closer player takes precedence when multiple players try the same deal. Your Terminal or Credits can also change because of another module. Preflight reduces mistakes but cannot reserve the order. The API return code remains authoritative.</p>

<h2 id="ten-deals">Centralize the 10-deal account limit</h2>
<pre><code class="language-javascript">function reserveMarketDealSlot() {
  Memory.market ??= {};

  if (Memory.market.dealSlotTick !== Game.time) {
    Memory.market.dealSlotTick = Game.time;
    Memory.market.dealSlotsUsed = 0;
  }

  if (Memory.market.dealSlotsUsed >= 10) {
    return false;
  }

  Memory.market.dealSlotsUsed += 1;
  return true;
}</code></pre>
<p>This local counter coordinates your modules, but only the actual API result proves whether the account-wide limit is available. Reserve the slot immediately before the call and do not run independent deal loops.</p>

<h2 id="after-ok">Verify settlement on a later tick</h2>
<pre><code class="language-javascript">function findMatchingIncomingTransaction(snapshot) {
  return Game.market.incomingTransactions.find(tx =>
    tx.time >= snapshot.submittedAt
    && tx.order?.id === snapshot.orderId
    && tx.resourceType === snapshot.resourceType
    && tx.amount === snapshot.amount
    && tx.to === snapshot.yourRoomName
  ) || null;
}</code></pre>
<p>Also compare Credits, Terminal Store, Energy, order amount, and the saved snapshot. Transaction arrays are finite recent records, so verify promptly and avoid treating a missing old record as definitive proof of failure.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Interpretation</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Deal scheduled</td><td>Transactions, Credits and Store later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>No usable Terminal in the selected room</td><td>Room and Terminal ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Credits, resource, or transaction Energy insufficient</td><td>Direction-specific budgets</td></tr>
<tr><td><code>ERR_FULL</code></td><td>More than 10 deals attempted this tick</td><td>Global market scheduler</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Order, amount, or room invalid</td><td>Fresh order snapshot</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Terminal cooling down</td><td><code>terminal.cooldown</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Use one reviewed order ID.</li>
<li>Fetch the order again immediately before execution.</li>
<li>Verify direction and resource type.</li>
<li>Use <code>order.amount</code> as the current ceiling.</li>
<li>Enforce a maximum price.</li>
<li>Calculate Credit cost and reserve.</li>
<li>Calculate Terminal Energy cost and reserve.</li>
<li>Check Terminal ownership, activity, and cooldown.</li>
<li>Coordinate the 10-deal account limit.</li>
<li>Disable before calling.</li>
<li>Save snapshot and return code.</li>
<li>Verify transactions and balances later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not automatically select orders, predict prices, split deals, sell to buy orders, support account-bound resources, optimize multiple Terminals, or retry after market races. Continue with <a href="/en/blog/screeps-terminal-send-resources">direct Terminal transfers</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is the cheapest order always best?</h3>
<p>No. Transfer Energy, distance, amount, urgency, reserves, and current availability also matter.</p>
<h3>Why not use remainingAmount?</h3>
<p>It can include capacity that is not currently active or available.</p>
<h3>Can OK still require later verification?</h3>
<p>Yes. OK schedules the operation; settlement evidence appears in later state.</p>
<h3>Should an error retry automatically?</h3>
<p>No. Refresh the order and require a new review.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/market.html" rel="nofollow">Screeps Documentation: Market System</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.deal" rel="nofollow">API Reference: Game.market.deal()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.getOrderById" rel="nofollow">API Reference: Game.market.getOrderById()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.calcTransactionCost" rel="nofollow">API Reference: calcTransactionCost()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.incomingTransactions" rel="nofollow">API Reference: incomingTransactions</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
