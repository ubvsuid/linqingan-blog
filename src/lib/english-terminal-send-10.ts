import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishTerminalSendArticle = {
  slug: "screeps-terminal-send-resources",
  path: "/en/blog/screeps-terminal-send-resources",
  chinesePath: "/blog/screeps-terminal-send-resources",
  title: "Screeps Terminal.send(): Energy Cost and Safe Transfers",
  headline: "How to Send Resources Between Terminals Safely",
  description:
    "Plan one direct Terminal transfer with a one-time request, validate TERMINAL_MIN_SEND and the 100-character description, separate ordinary-resource and Energy budgets, preserve reserves, disable before send(), and verify outgoing transactions and Store changes afterward.",
  category: "LOGISTICS · DIRECT TERMINAL TRANSFER",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Terminal Resource Send",
  tags: ["Screeps", "Terminal", "send", "Logistics", "Energy"],
  keywords: [
    "Screeps StructureTerminal.send",
    "Screeps Terminal transaction cost",
    "TERMINAL_MIN_SEND Screeps",
    "Screeps send Energy amount cost",
    "Screeps outgoingTransactions",
  ],
  primaryKeyword: "Screeps StructureTerminal.send",
  searchIntent: "Send one resource transfer with correct inventory, Energy, cooldown, and verification checks",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — send(), destination vision, 100-character description, cooldown, return codes and calcTransactionCost()"],
    ["Budget boundary", "Sending Energy requires amount plus transaction Energy; sending another resource requires that resource plus transaction Energy"],
    ["Execution boundary", "OK means the transfer was scheduled; receipt and settlement require outgoing transaction and Store verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline transfer review", "Passed — disabled, invalid arguments, minimum amount, description, inventory, Energy reserve, cooldown and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live Terminal transfer, power-effect and receiving-room test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["no-vision", "The destination does not require vision"],
    ["minimum-description", "Validate minimum amount and description"],
    ["two-energy-formulas", "Use the correct Energy formula"],
    ["pure-plan", "Build a testable transfer plan"],
    ["complete-example", "Complete one-time send example"],
    ["disable-before-call", "Disable before calling send"],
    ["power-effects", "Treat the calculated cost as an estimate"],
    ["after-ok", "Verify the outgoing transaction later"],
    ["receiver", "The receiving room still needs logistics"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does Terminal.send() require vision in the destination room?",
      "No. The official API says destination visibility is not required. The destination still needs a valid Terminal for the operation to be accepted.",
    ],
    [
      "How much Energy is required when sending Energy itself?",
      "The source Terminal needs the amount being sent plus the transaction Energy cost, while also preserving any configured Energy reserve.",
    ],
    [
      "Can the transaction description exceed 100 characters?",
      "No. The official API caps the recipient-visible description at 100 characters.",
    ],
    [
      "Does send() returning OK mean the receiver processed the resource?",
      "No. It means the transfer was scheduled. Receiving-room storage, task queues, and allocation are separate application responsibilities.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-market-deal",
    label: "Previous market guide",
    title: "Execute a Reviewed Market Deal",
  },
  next: {
    href: "/en/blog/screeps-withdraw-container-energy",
    label: "Related logistics guide",
    title: "Withdraw Energy from a Container",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>terminal.send()</code> only from one explicit request. Validate the resource, integer amount, <code>TERMINAL_MIN_SEND</code>, destination room name, description length, source Terminal ownership and cooldown, resource inventory, transaction Energy, and post-send Energy reserve. Disable the request before the API call, save the snapshot and return code, then verify <code>Game.market.outgoingTransactions</code> and Store changes on a later tick.</p>

<h2 id="no-vision">The destination does not require vision</h2>
<p>The official API does not require <code>Game.rooms[destination]</code> to exist. Requiring destination vision would incorrectly block valid transfers.</p>
<pre><code class="language-javascript">function validateDestinationRoom(roomName) {
  return typeof roomName === 'string'
    && /^[WE]\d+[NS]\d+$/.test(roomName);
}</code></pre>
<p>A syntactically valid name does not prove the room has a Terminal. The API return code remains the final same-tick check.</p>

<h2 id="minimum-description">Validate minimum amount and description</h2>
<pre><code class="language-javascript">function validateSendRequest(request) {
  if (!request || request.enabled !== true) {
    return { valid: false, reason: 'disabled' };
  }

  if (
    typeof request.resourceType !== 'string'
    || !Number.isInteger(request.amount)
    || request.amount < TERMINAL_MIN_SEND
    || !validateDestinationRoom(request.destination)
  ) {
    return { valid: false, reason: 'arguments-invalid' };
  }

  const description = request.description == null
    ? ''
    : String(request.description);

  if (description.length > 100) {
    return {
      valid: false,
      reason: 'description-too-long'
    };
  }

  return {
    valid: true,
    reason: 'valid',
    description
  };
}</code></pre>
<p><code>TERMINAL_MIN_SEND</code> is the official minimum amount constant. Do not duplicate its numeric value in application code.</p>

<h2 id="two-energy-formulas">Use the correct Energy formula</h2>
<pre><code class="language-text">sending a non-Energy resource
required resource = amount
required Energy = transaction cost

sending Energy
required Energy = amount + transaction cost</code></pre>
<pre><code class="language-javascript">function calculateSendBudget(input) {
  const sendingEnergy =
    input.resourceType === RESOURCE_ENERGY;
  const requiredResource = sendingEnergy
    ? 0
    : input.amount;
  const requiredEnergy = sendingEnergy
    ? input.amount + input.transactionEnergy
    : input.transactionEnergy;

  return {
    sendingEnergy,
    requiredResource,
    requiredEnergy
  };
}</code></pre>
<p>Checking only transaction Energy while sending Energy can under-budget the source Terminal by the full transfer amount.</p>

<h2 id="pure-plan">Build a testable transfer plan</h2>
<pre><code class="language-javascript">function evaluateTerminalSend(input) {
  const validation = validateSendRequest(input.request);

  if (!validation.valid) {
    return { ready: false, reason: validation.reason };
  }

  if (!input.terminalReady) {
    return { ready: false, reason: 'terminal-not-ready' };
  }

  if (!Number.isFinite(input.transactionEnergy)) {
    return { ready: false, reason: 'energy-cost-invalid' };
  }

  const budget = calculateSendBudget({
    resourceType: input.request.resourceType,
    amount: input.request.amount,
    transactionEnergy: input.transactionEnergy
  });
  const resourceAvailable = Number.isFinite(
    input.resourceAvailable
  )
    ? input.resourceAvailable
    : 0;
  const energyAvailable = Number.isFinite(
    input.energyAvailable
  )
    ? input.energyAvailable
    : 0;
  const reserve = Number.isFinite(
    input.request.energyReserve
  )
    ? input.request.energyReserve
    : 0;

  if (resourceAvailable < budget.requiredResource) {
    return {
      ready: false,
      reason: 'resource-insufficient',
      ...budget
    };
  }

  if (
    energyAvailable - budget.requiredEnergy
    < reserve
  ) {
    return {
      ready: false,
      reason: 'energy-reserve',
      ...budget
    };
  }

  return {
    ready: true,
    reason: 'ready',
    description: validation.description,
    ...budget,
    energyAfter:
      energyAvailable - budget.requiredEnergy
  };
}</code></pre>

<h2 id="complete-example">Complete one-time send example</h2>
<p><strong>State impact:</strong> this code may schedule one real Terminal transfer. It writes a request snapshot and never retries automatically.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const request = Memory.terminalSendRequest;
  const validation = validateSendRequest(request);

  if (!validation.valid) {
    return;
  }

  const terminal = typeof request.terminalId === 'string'
    ? Game.getObjectById(request.terminalId)
    : null;
  const terminalReady = Boolean(
    terminal
    && terminal.structureType === STRUCTURE_TERMINAL
    && terminal.my === true
    && terminal.isActive() === true
    && terminal.cooldown === 0
  );

  if (!terminalReady) {
    request.lastStatus = 'terminal-not-ready';
    request.lastCheckedAt = Game.time;
    return;
  }

  const transactionEnergy =
    Game.market.calcTransactionCost(
      request.amount,
      terminal.room.name,
      request.destination
    );
  const resourceAvailable =
    request.resourceType === RESOURCE_ENERGY
      ? 0
      : terminal.store.getUsedCapacity(
          request.resourceType
        );
  const energyAvailable =
    terminal.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
  const plan = evaluateTerminalSend({
    request,
    terminalReady,
    transactionEnergy,
    resourceAvailable,
    energyAvailable
  });

  request.lastStatus = plan.reason;
  request.lastCheckedAt = Game.time;

  if (!plan.ready) {
    request.preview = {
      resourceAvailable,
      energyAvailable,
      transactionEnergy,
      requiredResource:
        plan.requiredResource ?? null,
      requiredEnergy:
        plan.requiredEnergy ?? null
    };
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    terminalId: terminal.id,
    sourceRoom: terminal.room.name,
    destination: request.destination,
    resourceType: request.resourceType,
    amount: request.amount,
    description: plan.description,
    transactionEnergy,
    requiredEnergy: plan.requiredEnergy,
    energyBefore: energyAvailable,
    resourceBefore:
      request.resourceType === RESOURCE_ENERGY
        ? energyAvailable
        : resourceAvailable
  };

  const result = terminal.send(
    request.resourceType,
    request.amount,
    request.destination,
    plan.description
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-settlement'
    : 'failed-review-required';

  console.log(JSON.stringify({
    type: 'terminal-send-result',
    terminalId: terminal.id,
    sourceRoom: terminal.room.name,
    destination: request.destination,
    resourceType: request.resourceType,
    amount: request.amount,
    transactionEnergy,
    requiredEnergy: plan.requiredEnergy,
    result
  }));
};</code></pre>

<h2 id="disable-before-call">Disable before calling send</h2>
<p>A failed send can result from inventory, cooldown, target Terminal, or configuration changes. Automatic retry can repeatedly export resources after a request is no longer intended. Re-enable only after reviewing the snapshot and current state.</p>

<h2 id="power-effects">Treat the calculated cost as an estimate</h2>
<p><code>Game.market.calcTransactionCost()</code> provides the ordinary transfer estimate. <code>PWR_OPERATE_TERMINAL</code> can reduce transfer Energy and cooldown. This guide uses the estimate as a conservative preflight and verifies actual Store and transaction records later instead of claiming an effect-adjusted exact cost before execution.</p>

<h2 id="after-ok">Verify the outgoing transaction later</h2>
<pre><code class="language-javascript">function findMatchingOutgoingTransaction(snapshot) {
  return Game.market.outgoingTransactions.find(tx =>
    tx.time >= snapshot.submittedAt
    && tx.from === snapshot.sourceRoom
    && tx.to === snapshot.destination
    && tx.resourceType === snapshot.resourceType
    && tx.amount === snapshot.amount
    && tx.description === snapshot.description
  ) || null;
}</code></pre>
<p>Compare the transaction record, source Terminal Store, Energy, destination, description, amount, and saved snapshot. <code>OK</code> alone means “scheduled,” not “received and allocated.”</p>

<h2 id="receiver">The receiving room still needs logistics</h2>
<p>Arrival in the target Terminal does not automatically:</p>
<ul>
<li>move resources to Storage;</li>
<li>feed Labs or a Factory;</li>
<li>update your task queue;</li>
<li>send an acknowledgement;</li>
<li>maintain a target inventory;</li>
<li>return excess stock.</li>
</ul>
<p>Source transfer and destination inventory management are separate workflows.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Interpretation</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Transfer scheduled</td><td>Outgoing transaction and Store later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Terminal is not yours</td><td>ID and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Resource or Energy insufficient</td><td>Direction-specific formula</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Resource, amount, destination, description, or target Terminal invalid</td><td>Request snapshot</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Terminal cooling down</td><td><code>terminal.cooldown</code></td></tr>
</tbody></table></div>
<p>The current <code>send()</code> API table does not list <code>ERR_FULL</code>. Do not copy return codes from unrelated Store methods.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require one explicit request.</li>
<li>Validate resource, integer amount, and destination.</li>
<li>Use <code>TERMINAL_MIN_SEND</code>.</li>
<li>Limit description to 100 characters.</li>
<li>Do not require destination vision.</li>
<li>Check source Terminal ownership, activity, and cooldown.</li>
<li>Calculate transaction Energy.</li>
<li>For Energy, require amount plus transaction Energy.</li>
<li>Preserve an Energy reserve.</li>
<li>Disable before calling.</li>
<li>Save the snapshot and return code.</li>
<li>Verify outgoing transactions and Store later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement multi-room replenishment queues, destination storage logic, exact power-effect prediction, retries, acknowledgements, target inventory control, market orders, or cross-shard resources.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can I send to an invisible room?</h3>
<p>Yes. Destination vision is not required.</p>
<h3>Why is Energy special?</h3>
<p>The Terminal pays both the Energy being sent and the Energy transaction cost.</p>
<h3>Does OK mean resources are already allocated?</h3>
<p>No. The transfer was scheduled; destination logistics remain separate.</p>
<h3>Should a failed request retry every tick?</h3>
<p>No. Require a new explicit review.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureTerminal.send" rel="nofollow">API Reference: StructureTerminal.send()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.calcTransactionCost" rel="nofollow">API Reference: calcTransactionCost()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.market.outgoingTransactions" rel="nofollow">API Reference: outgoingTransactions</a></li>
<li><a href="https://docs.screeps.com/market.html" rel="nofollow">Screeps Documentation: Market System</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: PWR_OPERATE_TERMINAL</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
