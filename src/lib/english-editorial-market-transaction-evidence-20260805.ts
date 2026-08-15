import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishMarketCreateOrderArticle } from "@/lib/english-market-create-order-10";
import { englishMarketDealArticle } from "@/lib/english-market-deal-10";
import { englishTerminalSendArticle } from "@/lib/english-terminal-send-10";

export const englishEditorialMarketCreateOrderArticle20260805: EnglishBeginnerArticle = {
  ...englishMarketCreateOrderArticle,
  title: "Screeps createOrder(): Bind One Request to the New Order ID",
  headline: "Create One Market Order Without Misattributing a Later Order",
  description:
    "Freeze one reviewed order revision, reserve the creation fee and account mutation slot, call createOrder once, and verify the exact new order ID in the next account snapshot.",
  category: "MARKET · ORDER CREATION IDENTITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  updatedAt: "2026-08-05",
  readingTime: "19 min read",
  primaryKeyword: "Screeps createOrder verification",
  searchIntent:
    "Create one reviewed Screeps market order and prove which exact order ID appeared without duplicate calls or stale-request attribution",
  finalScore: 98,
  keywords: [
    "Screeps createOrder verification",
    "Screeps market order ID",
    "Screeps market creation fee rounding",
    "Screeps createOrder request identity",
    "Screeps market order created tick",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked at 80977824199a596d174d392fd0cf8c458c21fcbd — ordinary-resource creation requires an owned Terminal in the room, queues a global createOrder intent, rounds the 5% fee upward in milli-Credit storage, and creates an initially inactive order with its created tick",
    ],
    [
      "Technical correction",
      "Removed the unsupported active-Terminal requirement; added immutable request confirmation, shared fee reservation, one attributable creation slot and a bounded next-tick ID-difference verifier",
    ],
    ["JavaScript syntax", "Passed by the dedicated editorial simulation"],
    ["Repository integration", "Passed by TypeScript, ESLint, build and production smoke checks"],
    ["Screeps Console test", "Pending"],
    ["Live fee, order-cap, simultaneous-create and next-tick order-ID test", "Pending"],
    ["Genuine Console or market screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Start with the creation boundary"],
    ["request-revision", "Freeze one reviewed revision"],
    ["terminal-boundary", "Check ownership, not cooldown"],
    ["fee-boundary", "Reserve the rounded fee"],
    ["coordinate", "Coordinate account mutations"],
    ["submit", "Submit once and save the old IDs"],
    ["verify", "Verify one exact new order"],
    ["failure-states", "Preserve ambiguous and missed states"],
    ["activation-boundary", "Separate creation from activation"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Start with the creation boundary</h2>
<p><code>Game.market.createOrder()</code> returns a status code, not the new order ID. In the official engine, an accepted ordinary-resource call queues a global intent. Tick processing later charges the rounded fee and inserts an order whose initial <code>active</code> value is false, <code>amount</code> is zero, and <code>created</code> is the submission tick.</p>
<p>Therefore three facts must remain separate: the reviewed request, the accepted API call, and the exact order object observed later. A matching order found several ticks afterward is not enough; another module or Console command may have created it.</p>

<h2 id="request-revision">Freeze one reviewed request revision</h2>
<pre><code class="language-javascript">function buildCreateOrderConfirmation(request) {
  return [
    'CREATE_MARKET_ORDER',
    request.requestId,
    request.revision,
    request.type,
    request.resourceType,
    request.roomName,
    request.price,
    request.totalAmount,
    request.creditReserve
  ].join('|');
}</code></pre>
<pre><code class="language-javascript">Memory.marketCreateRequests ??= {};
Memory.marketCreateRequests['sell-U-001'] = {
  requestId: 'sell-U-001',
  revision: 1,
  enabled: true,
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  roomName: 'W1N1',
  price: 1,
  totalAmount: 10000,
  creditReserve: 1000000,
  confirmation:
    'CREATE_MARKET_ORDER|sell-U-001|1|sell|U|' +
    'W1N1|1|10000|1000000'
};</code></pre>
<p>The values are examples, not trading recommendations. Any edit to type, resource, room, price, amount, reserve or revision invalidates the old confirmation. Do not approve a request ID and then let another module mutate its payload.</p>

<h2 id="terminal-boundary">For ordinary resources, verify Terminal ownership</h2>
<pre><code class="language-javascript">function evaluateCreateOrderRequest(request) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || !Number.isInteger(request.revision)
    || request.revision &lt; 1
    || (request.type !== ORDER_BUY
      &amp;&amp; request.type !== ORDER_SELL)
    || typeof request.resourceType !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isFinite(request.price)
    || request.price &lt;= 0
    || !Number.isInteger(request.totalAmount)
    || request.totalAmount &lt;= 0
    || !Number.isFinite(request.creditReserve)
    || request.creditReserve &lt; 0
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  if (
    request.confirmation
      !== buildCreateOrderConfirmation(request)
  ) {
    return {
      ready: false,
      status: 'confirmation-mismatch'
    };
  }

  const room = Game.rooms[request.roomName];
  const terminal = room?.terminal ?? null;

  if (!terminal || terminal.my !== true) {
    return {
      ready: false,
      status: 'owned-terminal-not-observed'
    };
  }

  return {
    ready: true,
    status: 'creation-ready',
    terminalId: terminal.id
  };
}</code></pre>
<p>Order creation is not a Terminal action. The engine checks that an owned Terminal exists in the requested room; it does not require that Terminal to have zero cooldown or pass <code>isActive()</code>. Adding those requirements can incorrectly block a valid creation request.</p>

<h2 id="fee-boundary">Reserve the fee at engine storage precision</h2>
<pre><code class="language-javascript">function calculateCreateOrderFeeCeiling(
  price,
  totalAmount
) {
  const raw = price * totalAmount * 0.05;
  return Math.ceil(raw * 1000) / 1000;
}</code></pre>
<p>The public formula is 5% of price multiplied by total amount. The engine stores Credits in thousandths and rounds the internal fee upward. Reserving the milli-Credit ceiling prevents a fractional estimate from leaving the account just below its required reserve.</p>

<h2 id="coordinate">Use one account-level creation coordinator</h2>
<pre><code class="language-javascript">function createMarketCreationCoordinator() {
  let creationReserved = false;
  let creditsReserved = 0;

  return {
    reserve(input) {
      if (creationReserved) {
        return {
          ready: false,
          status: 'creation-slot-reserved'
        };
      }

      if (
        input.credits
          - creditsReserved
          - input.fee
          &lt; input.creditReserve
      ) {
        return {
          ready: false,
          status: 'credit-reserve'
        };
      }

      creationReserved = true;
      creditsReserved += input.fee;
      return { ready: true, status: 'reserved' };
    }
  };
}</code></pre>
<p>The API can accept more than one creation intent in a tick, but one-at-a-time is a deliberate attribution policy. Without it, every accepted call sees the same old order-ID set, and several new matching orders can appear together. The same coordinator must also account for other same-tick market fees in production.</p>

<h2 id="submit">Disable first, preserve old IDs, then call once</h2>
<pre><code class="language-javascript">function submitCreateOrder(request, coordinator) {
  const decision = evaluateCreateOrderRequest(request);
  if (!decision.ready) return decision;

  const fee = calculateCreateOrderFeeCeiling(
    request.price,
    request.totalAmount
  );
  const reservation = coordinator.reserve({
    credits: Game.market.credits,
    fee,
    creditReserve: request.creditReserve
  });
  if (!reservation.ready) return reservation;

  const orderIdsBefore = Object.keys(Game.market.orders);

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  const pending = {
    requestId: request.requestId,
    revision: request.revision,
    confirmation: request.confirmation,
    submittedAt: Game.time,
    type: request.type,
    resourceType: request.resourceType,
    roomName: request.roomName,
    price: request.price,
    totalAmount: request.totalAmount,
    fee,
    orderIdsBefore
  };

  const result = Game.market.createOrder({
    type: pending.type,
    resourceType: pending.resourceType,
    roomName: pending.roomName,
    price: pending.price,
    totalAmount: pending.totalAmount
  });

  request.lastResult = result;
  request.status = result === OK
    ? 'accepted-pending-order-id'
    : 'creation-rejected';

  if (result === OK) {
    Memory.pendingMarketCreations ??= {};
    Memory.pendingMarketCreations[request.requestId] =
      pending;
  }

  return { status: request.status, result };
}</code></pre>
<p>Disabling before the call prevents automatic retry. A rejection requires a new reviewed revision. The pending record contains only frozen values; later edits to the request cannot change what the verifier expects.</p>

<h2 id="verify">Verify the ID difference in the next account snapshot</h2>
<pre><code class="language-javascript">function verifyCreatedOrder(pending) {
  if (Game.time &lt; pending.submittedAt + 1) {
    return { status: 'waiting-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'verification-window-missed' };
  }

  const before = new Set(pending.orderIdsBefore);
  const candidates = Object.values(Game.market.orders)
    .filter(order =&gt;
      !before.has(order.id)
      &amp;&amp; order.type === pending.type
      &amp;&amp; order.resourceType === pending.resourceType
      &amp;&amp; order.roomName === pending.roomName
      &amp;&amp; Math.abs(order.price - pending.price)
        &lt; 0.0005
      &amp;&amp; order.totalAmount === pending.totalAmount
      &amp;&amp; order.created === pending.submittedAt
    );

  if (candidates.length === 0) {
    return { status: 'accepted-order-not-observed' };
  }
  if (candidates.length &gt; 1) {
    return {
      status: 'new-order-identity-ambiguous',
      candidateIds: candidates.map(order =&gt; order.id)
    };
  }

  const order = candidates[0];
  return {
    status: 'created-order-observed',
    orderId: order.id,
    active: order.active,
    amount: order.amount,
    remainingAmount: order.remainingAmount
  };
}</code></pre>
<p>The <code>created</code> tick and old-ID difference exclude later lookalikes. The small price tolerance reflects the public milli-Credit representation; it is not permission to accept a materially different price.</p>

<h2 id="failure-states">Preserve ambiguous and missed evidence</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>creation-slot-reserved</code></td><td>Another attributable creation already owns this tick.</td></tr>
<tr><td><code>accepted-pending-order-id</code></td><td>The call returned <code>OK</code>; no new ID is proven yet.</td></tr>
<tr><td><code>accepted-order-not-observed</code></td><td>The next snapshot did not contain an exact new order.</td></tr>
<tr><td><code>new-order-identity-ambiguous</code></td><td>Several exact new IDs appeared; do not select one arbitrarily.</td></tr>
<tr><td><code>verification-window-missed</code></td><td>The bounded attribution window was skipped.</td></tr>
<tr><td><code>created-order-observed</code></td><td>One exact new ID and created tick matched.</td></tr>
</tbody></table></div>

<h2 id="activation-boundary">Creation is not activation or a completed trade</h2>
<p>The inserted order starts inactive in the engine. Later resource, Credit and Terminal conditions determine activation and executable <code>amount</code>. Observe those fields separately. An order ID proves creation, not activation, matching, profit or a future fill.</p>

<h2 id="integration">Production integration boundary</h2>
<p>Create the coordinator once per game tick and route every create-order producer through it. Include change-price and extend-order fees in the same Credit reservation ledger. Persist accepted operations by request ID and revision, verify them exactly once on the next tick, and archive ambiguous or missed evidence for human review.</p>

<h2 id="official-docs">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.market.createOrder" rel="nofollow">API Reference: Game.market.createOrder()</a></li>
<li><a href="https://docs.screeps.com/market.html" rel="nofollow">Screeps Documentation: Market system</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/market.js" rel="nofollow">Official engine: runtime market API</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/global-intents/market.js" rel="nofollow">Official engine: market intent processing</a></li>
</ul>`,
};

export const englishEditorialMarketDealArticle20260805: EnglishBeginnerArticle = {
  ...englishMarketDealArticle,
  title: "Screeps market.deal(): Reserve the Terminal and Verify Actual Amount",
  headline: "Execute One Market Deal Without Assuming the Requested Amount Settled",
  description:
    "Freeze one reviewed deal revision, reserve both an account deal slot and the exact Terminal, submit once, and verify the new transaction ID and actual partial or full amount next tick.",
  category: "MARKET · DEAL SETTLEMENT IDENTITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  updatedAt: "2026-08-05",
  readingTime: "21 min read",
  primaryKeyword: "Screeps market deal verification",
  searchIntent:
    "Execute one exact Screeps sell-order purchase without Terminal contention or false full-amount settlement claims",
  finalScore: 98,
  keywords: [
    "Screeps market deal verification",
    "Screeps partial market deal",
    "Screeps Terminal deal reservation",
    "Screeps incoming transaction ID",
    "Screeps deal actual amount",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked at 80977824199a596d174d392fd0cf8c458c21fcbd — deal queues up to ten global intents, Terminal sends are processed separately, and settlement may reduce amount for order balance, seller inventory, buyer capacity or buyer Credits",
    ],
    [
      "Technical correction",
      "Added immutable operation confirmation, one shared Terminal reservation across deal and send, exact next-tick transaction-time matching, and explicit full-versus-partial settlement states",
    ],
    ["JavaScript syntax", "Passed by the dedicated editorial simulation"],
    ["Repository integration", "Passed by TypeScript, ESLint, build and production smoke checks"],
    ["Screeps Console test", "Pending"],
    ["Live order race, partial fill, Terminal collision and transaction-ID test", "Pending"],
    ["Genuine Console or market screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Start with scheduled versus settled"],
    ["request-revision", "Freeze one reviewed deal"],
    ["refresh-order", "Refresh the exact order"],
    ["budget", "Plan current budgets"],
    ["coordinate", "Reserve slot and Terminal"],
    ["submit", "Submit one frozen operation"],
    ["partial-settlement", "Allow actual partial amount"],
    ["verify", "Verify the exact transaction next tick"],
    ["failure-states", "Preserve no-record and ambiguity states"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Start with scheduled versus settled</h2>
<p><code>Game.market.deal()</code> returning <code>OK</code> means the global deal intent was accepted. It does not guarantee that the requested amount will settle. During processing, the engine can reduce amount to the remaining order balance, seller inventory, buyer Terminal free capacity, or affordable Credit amount.</p>
<p>This guide buys an ordinary resource from one exact <code>ORDER_SELL</code> order. Selling into a buy order and account-bound resources need different transaction direction and resource checks.</p>

<h2 id="request-revision">Freeze one reviewed deal revision</h2>
<pre><code class="language-javascript">function buildDealConfirmation(request) {
  return [
    'BUY_FROM_SELL_ORDER',
    request.requestId,
    request.revision,
    request.orderId,
    request.terminalId,
    request.resourceType,
    request.amount,
    request.maximumPrice,
    request.creditReserve,
    request.energyReserve
  ].join('|');
}</code></pre>
<p>Require a matching confirmation immediately before submission. A change to amount, price ceiling, reserves, order ID or Terminal ID creates a new operation revision rather than silently reusing old approval.</p>

<h2 id="refresh-order">Refresh the exact sell order immediately before reserving</h2>
<pre><code class="language-javascript">function evaluateReviewedSellOrder(request) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }
  if (
    typeof request.requestId !== 'string'
    || !Number.isInteger(request.revision)
    || request.revision &lt; 1
    || typeof request.orderId !== 'string'
    || typeof request.terminalId !== 'string'
    || typeof request.resourceType !== 'string'
    || !Number.isInteger(request.amount)
    || request.amount &lt;= 0
    || !Number.isFinite(request.maximumPrice)
    || request.maximumPrice &lt;= 0
    || request.confirmation
      !== buildDealConfirmation(request)
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  const order = Game.market.getOrderById(request.orderId);
  if (!order) {
    return { ready: false, status: 'order-unavailable' };
  }
  if (
    order.id !== request.orderId
    || order.type !== ORDER_SELL
    || order.resourceType !== request.resourceType
    || typeof order.roomName !== 'string'
  ) {
    return { ready: false, status: 'order-identity-mismatch' };
  }
  if (order.price &gt; request.maximumPrice) {
    return { ready: false, status: 'price-above-limit' };
  }
  if (order.amount &lt;= 0) {
    return { ready: false, status: 'order-amount-empty' };
  }

  return { ready: true, status: 'order-ready', order };
}</code></pre>
<p>Do not require the current <code>order.amount</code> to equal or exceed the full requested amount if partial settlement is acceptable. Store the request ceiling and let later evidence report the actual amount. Projects that require all-or-nothing behavior should stop when <code>order.amount &lt; request.amount</code>.</p>

<h2 id="budget">Plan current Credit and Energy reserves</h2>
<pre><code class="language-javascript">function buildDealBudget(request, terminal, order) {
  const requestedAmount = Math.min(
    request.amount,
    order.amount
  );
  const energyEstimate =
    Game.market.calcTransactionCost(
      requestedAmount,
      terminal.room.name,
      order.roomName
    );
  const creditEstimate =
    requestedAmount * order.price;

  if (
    Game.market.credits - creditEstimate
      &lt; request.creditReserve
  ) {
    return { ready: false, status: 'credit-reserve' };
  }
  if (
    terminal.store.getUsedCapacity(RESOURCE_ENERGY)
      - energyEstimate
      &lt; request.energyReserve
  ) {
    return { ready: false, status: 'energy-reserve' };
  }

  return {
    ready: true,
    status: 'budget-ready',
    requestedAmount,
    energyEstimate,
    creditEstimate
  };
}</code></pre>
<p>These are preflight ceilings. Another accepted operation in the same tick can consume the same Credits, Terminal Energy or free capacity unless every producer shares the coordinator below.</p>

<h2 id="coordinate">Reserve both the deal slot and exact Terminal</h2>
<pre><code class="language-javascript">function createTerminalMarketDispatcher() {
  let dealSlots = 0;
  const terminalIds = new Set();
  const orderIds = new Set();

  return {
    reserveDeal(terminalId, orderId) {
      if (dealSlots &gt;= 10) {
        return { ready: false, status: 'deal-limit' };
      }
      if (terminalIds.has(terminalId)) {
        return {
          ready: false,
          status: 'terminal-already-reserved'
        };
      }
      if (orderIds.has(orderId)) {
        return {
          ready: false,
          status: 'order-already-reserved'
        };
      }

      dealSlots += 1;
      terminalIds.add(terminalId);
      orderIds.add(orderId);
      return { ready: true, status: 'deal-reserved' };
    },
    releaseTerminal(terminalId) {
      terminalIds.delete(terminalId);
    }
  };
}</code></pre>
<p>The Terminal reservation must be shared with direct <code>terminal.send()</code> producers. The engine stores send and deal through different intent channels, so a deal-only call counter cannot prevent the same Terminal from being scheduled twice.</p>

<h2 id="submit">Submit one frozen operation</h2>
<pre><code class="language-javascript">function submitReviewedBuyDeal(request, dispatcher) {
  const reviewed = evaluateReviewedSellOrder(request);
  if (!reviewed.ready) return reviewed;

  const terminal = Game.getObjectById(request.terminalId);
  if (
    !terminal
    || terminal.structureType !== STRUCTURE_TERMINAL
    || terminal.my !== true
    || terminal.isActive() !== true
    || terminal.cooldown &gt; 0
  ) {
    return { status: 'terminal-not-ready' };
  }

  const budget = buildDealBudget(
    request,
    terminal,
    reviewed.order
  );
  if (!budget.ready) return budget;

  const reservation = dispatcher.reserveDeal(
    terminal.id,
    reviewed.order.id
  );
  if (!reservation.ready) return reservation;

  const incomingIdsBefore =
    Game.market.incomingTransactions
      .map(transaction =&gt; transaction.transactionId)
      .filter(Boolean);

  request.enabled = false;
  const pending = {
    requestId: request.requestId,
    revision: request.revision,
    confirmation: request.confirmation,
    submittedAt: Game.time,
    orderId: reviewed.order.id,
    orderType: reviewed.order.type,
    orderRoom: reviewed.order.roomName,
    terminalId: terminal.id,
    targetRoom: terminal.room.name,
    resourceType: reviewed.order.resourceType,
    requestedAmount: budget.requestedAmount,
    price: reviewed.order.price,
    incomingIdsBefore
  };

  const result = Game.market.deal(
    pending.orderId,
    pending.requestedAmount,
    pending.targetRoom
  );

  request.lastResult = result;
  request.lastAttemptAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-settlement'
    : 'deal-rejected';

  if (result === OK) {
    Memory.pendingMarketDeals ??= {};
    Memory.pendingMarketDeals[request.requestId] = pending;
  } else {
    dispatcher.releaseTerminal(terminal.id);
  }

  return { status: request.status, result };
}</code></pre>
<p>The local deal slot remains consumed after a real call attempt as a conservative anti-loop policy. A rejected request stays disabled and requires a newly reviewed revision.</p>

<h2 id="partial-settlement">Treat the requested amount as a ceiling</h2>
<p>During tick processing, actual amount may be reduced by current order balance, seller inventory, receiving Terminal capacity or available Credits. A transaction with <code>0 &lt; amount &lt; requestedAmount</code> is not necessarily evidence of a wrong order. It is a partial settlement that must be reported explicitly.</p>
<p>Do not infer actual amount from the Terminal Store delta alone. Creeps, Labs, Factories, sends and other market operations can change the same Store in the same tick.</p>

<h2 id="verify">Verify the exact new transaction on the next tick</h2>
<pre><code class="language-javascript">function verifyBuyDealSettlement(pending) {
  if (Game.time &lt; pending.submittedAt + 1) {
    return { status: 'waiting-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'verification-window-missed' };
  }

  const before = new Set(pending.incomingIdsBefore);
  const candidates = Game.market.incomingTransactions
    .filter(transaction =&gt;
      transaction.transactionId
      &amp;&amp; !before.has(transaction.transactionId)
      &amp;&amp; transaction.time === pending.submittedAt
      &amp;&amp; transaction.order?.id === pending.orderId
      &amp;&amp; transaction.order?.type === pending.orderType
      &amp;&amp; Math.abs(
        transaction.order.price - pending.price
      ) &lt; 0.0005
      &amp;&amp; transaction.from === pending.orderRoom
      &amp;&amp; transaction.to === pending.targetRoom
      &amp;&amp; transaction.resourceType
        === pending.resourceType
      &amp;&amp; transaction.amount &gt; 0
      &amp;&amp; transaction.amount
        &lt;= pending.requestedAmount
    );

  if (candidates.length === 0) {
    return { status: 'accepted-no-transaction-observed' };
  }
  if (candidates.length &gt; 1) {
    return {
      status: 'transaction-identity-ambiguous',
      candidateIds: candidates.map(
        transaction =&gt; transaction.transactionId
      )
    };
  }

  const transaction = candidates[0];
  return {
    status: transaction.amount
      === pending.requestedAmount
      ? 'full-deal-settlement-observed'
      : 'partial-deal-settlement-observed',
    transactionId: transaction.transactionId,
    requestedAmount: pending.requestedAmount,
    actualAmount: transaction.amount
  };
}</code></pre>
<p>The exact transaction ID, processing tick, order identity, price, direction, resource and bounded amount form the settlement evidence. Credits and Store changes are supporting diagnostics, not unique identity.</p>

<h2 id="failure-states">Preserve no-record and ambiguity states</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>terminal-already-reserved</code></td><td>A deal or send already owns this Terminal for the tick.</td></tr>
<tr><td><code>accepted-pending-settlement</code></td><td>The deal intent was accepted; actual settlement is unknown.</td></tr>
<tr><td><code>accepted-no-transaction-observed</code></td><td>No exact record appeared in the next snapshot.</td></tr>
<tr><td><code>transaction-identity-ambiguous</code></td><td>Several exact new records matched.</td></tr>
<tr><td><code>partial-deal-settlement-observed</code></td><td>One exact record settled less than requested.</td></tr>
<tr><td><code>full-deal-settlement-observed</code></td><td>One exact record settled the complete request ceiling.</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Instantiate one dispatcher per tick and pass it to all market and logistics modules. Reserve the Terminal before the irreversible call, retain one pending record per request revision, verify it exactly on the next tick, and never retry an accepted-but-unverified operation automatically.</p>

<h2 id="official-docs">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.market.deal" rel="nofollow">API Reference: Game.market.deal()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.incomingTransactions" rel="nofollow">API Reference: incomingTransactions</a></li>
<li><a href="https://docs.screeps.com/market.html" rel="nofollow">Screeps Documentation: Market system</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/market.js" rel="nofollow">Official engine: runtime market API</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/global-intents/market.js" rel="nofollow">Official engine: deal settlement processing</a></li>
</ul>`,
};

export const englishEditorialTerminalSendArticle20260805: EnglishBeginnerArticle = {
  ...englishTerminalSendArticle,
  title: "Screeps Terminal.send(): Prevent Intent Overwrite and Verify Actual Amount",
  headline: "Send One Terminal Transfer Without Losing Its Exact Operation Identity",
  description:
    "Freeze one transfer revision, reserve the exact Terminal against send and market-deal conflicts, submit once, normalize ledger descriptions, and verify the actual full or partial outgoing transaction next tick.",
  category: "LOGISTICS · TERMINAL INTENT IDENTITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  updatedAt: "2026-08-05",
  readingTime: "21 min read",
  primaryKeyword: "Screeps Terminal send verification",
  searchIntent:
    "Send one exact Screeps Terminal transfer without same-tick intent overwrite, deal contention or false missing-transaction reports",
  finalScore: 98,
  keywords: [
    "Screeps Terminal send verification",
    "Screeps Terminal send intent overwrite",
    "Screeps partial Terminal transfer",
    "Screeps outgoing transaction description",
    "Screeps Terminal deal conflict",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked at 80977824199a596d174d392fd0cf8c458c21fcbd — send uses one set intent per Terminal, a later same-tick send replaces it, direct sends process before market deals, destination capacity may reduce amount, and stored descriptions omit empty strings and escape less-than signs",
    ],
    [
      "Technical correction",
      "Added immutable transfer confirmation, shared Terminal reservation, bounded next-tick evidence, partial-amount states and ledger-description normalization",
    ],
    ["JavaScript syntax", "Passed by the dedicated editorial simulation"],
    ["Repository integration", "Passed by TypeScript, ESLint, build and production smoke checks"],
    ["Screeps Console test", "Pending"],
    ["Live overwrite, deal collision, destination-capacity, description and receiver test", "Pending"],
    ["Genuine Console or room screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Start with the set-intent boundary"],
    ["request-revision", "Freeze one transfer revision"],
    ["description", "Normalize ledger descriptions"],
    ["budget", "Plan source resources"],
    ["coordinate", "Reserve the exact Terminal"],
    ["submit", "Submit one frozen transfer"],
    ["partial-settlement", "Allow destination-limited amount"],
    ["verify", "Verify the exact outgoing record"],
    ["failure-states", "Preserve overwritten and absent states"],
    ["receiver", "Separate sender evidence from receipt"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Start with the set-intent boundary</h2>
<p><code>StructureTerminal.send()</code> writes one <code>send</code> intent for the exact Terminal ID. The official runtime uses a set operation, so another <code>send()</code> on the same Terminal later in the same JavaScript tick replaces the earlier payload. Both callers can see <code>OK</code>, but only the final send intent remains.</p>
<p>Market deals use a separate global intent channel and may reserve the same Terminal unless your code coordinates them. The engine processes direct sends before terminal market deals. Use one shared Terminal dispatcher rather than independent logistics and market schedulers.</p>

<h2 id="request-revision">Freeze one transfer revision</h2>
<pre><code class="language-javascript">function buildTerminalSendConfirmation(request) {
  return [
    'TERMINAL_SEND',
    request.requestId,
    request.revision,
    request.terminalId,
    request.resourceType,
    request.amount,
    request.destination,
    request.description ?? '',
    request.energyReserve
  ].join('|');
}</code></pre>
<p>Validate the request ID, positive revision, exact Terminal ID, resource, integer amount at least <code>TERMINAL_MIN_SEND</code>, different destination room, description length and reserve. Any payload edit requires a new confirmation.</p>

<h2 id="description">Normalize the description that appears in the transaction ledger</h2>
<pre><code class="language-javascript">function normalizeSendDescription(value) {
  if (value == null || value === '') {
    return {
      apiDescription: undefined,
      ledgerDescription: ''
    };
  }

  const text = String(value);
  if (text.length &gt; 100) return null;

  return {
    apiDescription: text,
    ledgerDescription: text.replace(/&lt;/g, '&amp;lt;')
  };
}

function readLedgerDescription(transaction) {
  return transaction.description ?? '';
}</code></pre>
<p>Tick processing omits an empty description and escapes each literal less-than sign in a non-empty description. Comparing the raw request string directly with <code>transaction.description</code> incorrectly rejects both cases. The ledger normalization belongs in the frozen pending record.</p>

<h2 id="budget">Plan the source resource and Energy ceiling</h2>
<pre><code class="language-javascript">function buildTerminalSendBudget(
  request,
  terminal
) {
  const estimatedCost =
    Game.market.calcTransactionCost(
      request.amount,
      terminal.room.name,
      request.destination
    );
  const energy = terminal.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const resource = terminal.store.getUsedCapacity(
    request.resourceType
  );
  const requiredEnergy =
    request.resourceType === RESOURCE_ENERGY
      ? request.amount + estimatedCost
      : estimatedCost;

  if (
    request.resourceType !== RESOURCE_ENERGY
    &amp;&amp; resource &lt; request.amount
  ) {
    return { ready: false, status: 'resource-insufficient' };
  }
  if (
    energy - requiredEnergy
      &lt; request.energyReserve
  ) {
    return { ready: false, status: 'energy-reserve' };
  }

  return {
    ready: true,
    status: 'budget-ready',
    estimatedCost,
    requiredEnergy,
    energyBefore: energy,
    resourceBefore: resource
  };
}</code></pre>
<p><code>PWR_OPERATE_TERMINAL</code> can reduce actual transfer cost and cooldown. The ordinary calculation is a conservative preflight estimate, not exact post-processing evidence.</p>

<h2 id="coordinate">Reserve the exact Terminal across send and deal</h2>
<pre><code class="language-javascript">function createTerminalOperationDispatcher() {
  const terminalIds = new Set();

  return {
    reserve(terminalId, operationId) {
      if (terminalIds.has(terminalId)) {
        return {
          ready: false,
          status: 'terminal-already-reserved'
        };
      }
      terminalIds.add(terminalId);
      return {
        ready: true,
        status: 'terminal-reserved',
        operationId
      };
    },
    release(terminalId) {
      terminalIds.delete(terminalId);
    }
  };
}</code></pre>
<p>Every direct send and every ordinary-resource market deal must use the same dispatcher instance. A reservation hidden inside only the send module cannot stop a deal module from using the same Terminal later in the tick.</p>

<h2 id="submit">Submit one frozen transfer</h2>
<pre><code class="language-javascript">function submitTerminalTransfer(request, dispatcher) {
  const description = normalizeSendDescription(
    request.description
  );
  if (!description) {
    return { status: 'description-invalid' };
  }
  if (
    !request
    || request.enabled !== true
    || !Number.isInteger(request.revision)
    || request.revision &lt; 1
    || request.confirmation
      !== buildTerminalSendConfirmation(request)
    || !Number.isInteger(request.amount)
    || request.amount &lt; TERMINAL_MIN_SEND
  ) {
    return { status: 'request-invalid' };
  }

  const terminal = Game.getObjectById(request.terminalId);
  if (
    !terminal
    || terminal.structureType !== STRUCTURE_TERMINAL
    || terminal.my !== true
    || terminal.isActive() !== true
    || terminal.cooldown &gt; 0
    || terminal.room.name === request.destination
  ) {
    return { status: 'terminal-not-ready' };
  }

  const budget = buildTerminalSendBudget(request, terminal);
  if (!budget.ready) return budget;

  const reservation = dispatcher.reserve(
    terminal.id,
    request.requestId + ':' + request.revision
  );
  if (!reservation.ready) return reservation;

  const outgoingIdsBefore =
    Game.market.outgoingTransactions
      .map(transaction =&gt; transaction.transactionId)
      .filter(Boolean);

  request.enabled = false;
  const pending = {
    requestId: request.requestId,
    revision: request.revision,
    confirmation: request.confirmation,
    submittedAt: Game.time,
    terminalId: terminal.id,
    sourceRoom: terminal.room.name,
    destination: request.destination,
    resourceType: request.resourceType,
    requestedAmount: request.amount,
    apiDescription: description.apiDescription,
    ledgerDescription: description.ledgerDescription,
    estimatedCost: budget.estimatedCost,
    outgoingIdsBefore
  };

  const result = terminal.send(
    pending.resourceType,
    pending.requestedAmount,
    pending.destination,
    pending.apiDescription
  );

  request.lastResult = result;
  request.lastAttemptAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-outgoing-transaction'
    : 'send-rejected';

  if (result === OK) {
    Memory.pendingTerminalSends ??= {};
    Memory.pendingTerminalSends[request.requestId] = pending;
  } else {
    dispatcher.release(terminal.id);
  }

  return { status: request.status, result };
}</code></pre>
<p>Disabling before the call prevents automatic repetition. The pending record freezes both the API description and the normalized ledger form.</p>

<h2 id="partial-settlement">Treat destination capacity as an execution-time limit</h2>
<p>The runtime cannot prove that a destination Terminal exists or has enough free capacity. During processing, the engine can reduce the sent amount to the receiving Terminal's free space. Therefore an exact new transaction with a smaller positive amount is a partial transfer, not automatically a mismatch.</p>
<p>If no valid destination Terminal exists, the accepted intent can produce no outgoing transaction. The next-tick verifier must report that absence rather than remain pending forever.</p>

<h2 id="verify">Verify the exact outgoing record on the next tick</h2>
<pre><code class="language-javascript">function verifyTerminalTransfer(pending) {
  if (Game.time &lt; pending.submittedAt + 1) {
    return { status: 'waiting-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'verification-window-missed' };
  }

  const before = new Set(pending.outgoingIdsBefore);
  const candidates = Game.market.outgoingTransactions
    .filter(transaction =&gt;
      transaction.transactionId
      &amp;&amp; !before.has(transaction.transactionId)
      &amp;&amp; transaction.time === pending.submittedAt
      &amp;&amp; transaction.from === pending.sourceRoom
      &amp;&amp; transaction.to === pending.destination
      &amp;&amp; transaction.resourceType
        === pending.resourceType
      &amp;&amp; transaction.amount &gt; 0
      &amp;&amp; transaction.amount
        &lt;= pending.requestedAmount
      &amp;&amp; readLedgerDescription(transaction)
        === pending.ledgerDescription
      &amp;&amp; !transaction.order
    );

  if (candidates.length === 0) {
    return {
      status: 'accepted-no-outgoing-transaction-observed'
    };
  }
  if (candidates.length &gt; 1) {
    return {
      status: 'outgoing-transaction-ambiguous',
      candidateIds: candidates.map(
        transaction =&gt; transaction.transactionId
      )
    };
  }

  const transaction = candidates[0];
  return {
    status: transaction.amount
      === pending.requestedAmount
      ? 'full-transfer-observed'
      : 'partial-transfer-observed',
    transactionId: transaction.transactionId,
    requestedAmount: pending.requestedAmount,
    actualAmount: transaction.amount
  };
}</code></pre>
<p>Requiring <code>!transaction.order</code> distinguishes a direct send from a market transaction that happens to share the same rooms, resource and amount.</p>

<h2 id="failure-states">Preserve overwritten and absent states</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>terminal-already-reserved</code></td><td>Another send or deal owns this Terminal this tick.</td></tr>
<tr><td><code>accepted-pending-outgoing-transaction</code></td><td>The send intent was accepted but not processed yet.</td></tr>
<tr><td><code>accepted-no-outgoing-transaction-observed</code></td><td>No exact direct-send record appeared next tick.</td></tr>
<tr><td><code>outgoing-transaction-ambiguous</code></td><td>Several exact new records matched.</td></tr>
<tr><td><code>partial-transfer-observed</code></td><td>One exact record sent a destination-limited amount.</td></tr>
<tr><td><code>full-transfer-observed</code></td><td>One exact record sent the complete request.</td></tr>
</tbody></table></div>

<h2 id="receiver">Sender evidence is not receiver workflow completion</h2>
<p>An outgoing transaction proves server-side transfer settlement from the sender account. It does not prove that destination haulers moved the resource, Labs or a Factory consumed it, or another player's automation acknowledged receipt. Those are separate systems and may require destination-side evidence.</p>

<h2 id="integration">Production integration boundary</h2>
<p>Use one dispatcher per tick for direct sends and terminal-backed deals. Save one immutable pending operation per request revision, verify it exactly on the next tick, and never allow a later request to overwrite an unresolved operation record for the same request ID.</p>

<h2 id="official-docs">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureTerminal.send" rel="nofollow">API Reference: StructureTerminal.send()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.outgoingTransactions" rel="nofollow">API Reference: outgoingTransactions</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.calcTransactionCost" rel="nofollow">API Reference: calcTransactionCost()</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/structures.js" rel="nofollow">Official engine: Terminal.send runtime intent</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/global-intents/market.js" rel="nofollow">Official engine: send and market settlement processing</a></li>
</ul>`,
};

export const englishEditorialMarketTransactionEvidenceOverrides20260805: Record<
  string,
  EnglishBeginnerArticle
> = {
  [englishEditorialMarketCreateOrderArticle20260805.slug]:
    englishEditorialMarketCreateOrderArticle20260805,
  [englishEditorialMarketDealArticle20260805.slug]:
    englishEditorialMarketDealArticle20260805,
  [englishEditorialTerminalSendArticle20260805.slug]:
    englishEditorialTerminalSendArticle20260805,
};
