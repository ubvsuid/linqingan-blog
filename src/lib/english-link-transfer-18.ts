import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishLinkTransferArticle = {
  slug: "screeps-link-transfer-energy",
  path: "/en/blog/screeps-link-transfer-energy",
  chinesePath: "/blog/screeps-link-transfer-energy",
  title: "Screeps Link transferEnergy(): IDs, Cooldown, Loss, and Capacity",
  headline: "How to Transfer Link Energy Without Depending on Structure Array Order",
  description:
    "Recover source and target Links by fixed IDs, require ownership, different objects, the same room, active structures and zero source cooldown, calculate a conservative amount from source stock and target free capacity, estimate LINK_LOSS_RATIO only for logs, and verify Store changes later.",
  category: "LOGISTICS · LINK ENERGY NETWORK",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Link Transfer",
  tags: ["Screeps", "Link", "Energy", "Logistics", "Cooldown"],
  keywords: [
    "Screeps Link transferEnergy",
    "Screeps Link cooldown",
    "Screeps LINK_LOSS_RATIO",
    "Screeps controller Link",
    "Screeps Link Energy amount",
  ],
  primaryKeyword: "Screeps Link transferEnergy",
  searchIntent: "Transfer Energy between two explicitly identified owned Links with conservative capacity and cooldown checks",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureLink.transferEnergy(), same-room restriction, cooldown, Store, LINK_LOSS_RATIO and return codes"],
    ["Policy boundary", "Link identities, minimumSend and targetReserve are room logistics policies, not official StructureLink fields"],
    ["Execution boundary", "OK schedules a transfer; both Link Stores and source cooldown must be observed later"],
    ["JavaScript syntax", "Passed"],
    ["Offline transfer review", "Passed — missing Link, same object, cross-room, inactive, cooldown, stock, capacity, threshold and ready states"],
    ["Screeps Console test", "Pending"],
    ["Live loss rounding, cooldown distance, concurrent send, Store and target-reserve test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["ids", "Use fixed Link IDs"],
    ["same-room", "Keep both Links in one room"],
    ["amount", "Calculate a conservative amount"],
    ["loss", "Estimate loss only for diagnostics"],
    ["preflight", "Build a testable transfer plan"],
    ["complete-example", "Complete Link transfer example"],
    ["reserve", "Leave target capacity through a policy reserve"],
    ["coordination", "Use one dispatcher for multiple source Links"],
    ["after-ok", "Verify later Store and cooldown state"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Can a Link send Energy to another room?", "No. Link transfer is remote within the same room; a cross-room target is outside the method's valid range."],
    ["Why not identify Links with room.find()[0] and [1]?", "Array position is not a stable logistics identity after construction, destruction, or layout changes. Store and validate IDs instead."],
    ["Why use Math.min(sourceEnergy, targetFree)?", "It is a conservative request that cannot exceed visible source stock or visible target capacity, though same-tick competition can still change the result."],
    ["Does an estimated loss equal the final server result?", "Treat it as a diagnostic only. Re-read both Stores and cooldown on a later tick."],
  ],
  previous: {
    href: "/en/blog/screeps-wall-rampart-repair-limit",
    label: "Previous defense guide",
    title: "Use Staged Fortification Limits",
  },
  next: {
    href: "/en/blog/screeps-select-source-by-path",
    label: "Next logistics guide",
    title: "Select a Source by Reachable Path",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Store explicit source and target Link IDs in room configuration. Recover both with <code>Game.getObjectById()</code>, require owned <code>STRUCTURE_LINK</code> objects, different IDs, the same room, active structures, and source cooldown zero. Calculate the send amount from current source Energy and target free capacity, optionally subtract a configured target-capacity reserve, require a documented minimum send, call <code>transferEnergy()</code>, save the result, and re-read both Links later.</p>

<h2 id="ids">Use fixed Link IDs</h2>
<pre><code class="language-javascript">Memory.linkNetwork ??= {};
Memory.linkNetwork.W1N1 = {
  enabled: true,
  sourceLinkId: 'replace-with-source-link-id',
  controllerLinkId: 'replace-with-target-link-id',
  minimumSend: 200,
  targetReserve: 0
};</code></pre>
<pre><code class="language-javascript">function getOwnedLink(id) {
  if (typeof id !== 'string') {
    return null;
  }

  const structure = Game.getObjectById(id);

  if (
    !structure
    || structure.structureType !== STRUCTURE_LINK
    || structure.my !== true
  ) {
    return null;
  }

  return structure;
}</code></pre>
<p>Do not assign meaning to <code>room.find(...)[0]</code>. Link order is not a stable Source-Link or Controller-Link contract.</p>

<h2 id="same-room">Keep both Links in one room</h2>
<pre><code class="language-javascript">function linksShareRoom(sourceLink, targetLink) {
  return Boolean(
    sourceLink
    && targetLink
    && sourceLink.room.name === targetLink.room.name
  );
}</code></pre>
<p>Remote does not mean cross-room. Preserve <code>ERR_NOT_IN_RANGE</code> as evidence that the configured Links do not satisfy the same-room rule.</p>

<h2 id="amount">Calculate a conservative amount</h2>
<pre><code class="language-javascript">function calculateLinkSendAmount(input) {
  if (
    !Number.isFinite(input.sourceEnergy)
    || !Number.isFinite(input.targetFree)
    || !Number.isFinite(input.targetReserve)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      input.sourceEnergy,
      Math.max(0, input.targetFree - input.targetReserve)
    )
  );
}</code></pre>
<p>The conservative amount may leave the target short of full after transfer loss, but it avoids exceeding visible capacity through a fragile inverse-loss calculation.</p>

<h2 id="loss">Estimate loss only for diagnostics</h2>
<pre><code class="language-javascript">function estimateLinkTransfer(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return {
      valid: false,
      sent: 0,
      estimatedLoss: 0,
      estimatedReceived: 0
    };
  }

  const estimatedLoss = Math.ceil(
    amount * LINK_LOSS_RATIO
  );

  return {
    valid: true,
    sent: amount,
    estimatedLoss,
    estimatedReceived: Math.max(
      0,
      amount - estimatedLoss
    )
  };
}</code></pre>
<p>This uses the official loss constant for a local estimate. It does not replace later Store observation or claim exact attribution when other transfers occur.</p>

<h2 id="preflight">Build a testable transfer plan</h2>
<pre><code class="language-javascript">function evaluateLinkTransfer(input) {
  if (!input.sourceExists || !input.targetExists) {
    return { ready: false, reason: 'link-missing' };
  }

  if (input.sameObject) {
    return { ready: false, reason: 'same-link' };
  }

  if (!input.sameRoom) {
    return { ready: false, reason: 'different-room' };
  }

  if (!input.sourceActive || !input.targetActive) {
    return { ready: false, reason: 'link-inactive' };
  }

  if (
    !Number.isInteger(input.sourceCooldown)
    || input.sourceCooldown > 0
  ) {
    return { ready: false, reason: 'source-not-ready' };
  }

  const amount = calculateLinkSendAmount({
    sourceEnergy: input.sourceEnergy,
    targetFree: input.targetFree,
    targetReserve: input.targetReserve
  });
  const minimumSend = Number.isFinite(input.minimumSend)
    ? Math.max(1, input.minimumSend)
    : 1;

  if (amount < minimumSend) {
    return {
      ready: false,
      reason: 'amount-below-threshold',
      amount,
      minimumSend
    };
  }

  return {
    ready: true,
    reason: 'ready',
    amount,
    minimumSend
  };
}</code></pre>
<p><code>minimumSend</code> is a scheduling policy used to avoid frequent tiny transfers. It is not an official Link minimum.</p>

<h2 id="complete-example">Complete Link transfer example</h2>
<pre><code class="language-javascript">function runLinkTransfer(roomName) {
  const config = Memory.linkNetwork?.[roomName];

  if (!config || config.enabled !== true) {
    return { status: 'config-disabled' };
  }

  const sourceLink = getOwnedLink(config.sourceLinkId);
  const targetLink = getOwnedLink(config.controllerLinkId);

  if (!sourceLink || !targetLink) {
    return { status: 'link-missing' };
  }

  const sourceEnergy = sourceLink.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const targetEnergy = targetLink.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const targetFree = targetLink.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const plan = evaluateLinkTransfer({
    sourceExists: true,
    targetExists: true,
    sameObject: sourceLink.id === targetLink.id,
    sameRoom:
      sourceLink.room.name === targetLink.room.name
      && sourceLink.room.name === roomName,
    sourceActive: sourceLink.isActive(),
    targetActive: targetLink.isActive(),
    sourceCooldown: sourceLink.cooldown,
    sourceEnergy,
    targetFree,
    targetReserve: Number.isFinite(config.targetReserve)
      ? Math.max(0, config.targetReserve)
      : 0,
    minimumSend: config.minimumSend
  });

  if (!plan.ready) {
    return {
      status: plan.reason,
      ...plan
    };
  }

  const before = {
    gameTick: Game.time,
    sourceLinkId: sourceLink.id,
    targetLinkId: targetLink.id,
    sourceEnergy,
    targetEnergy,
    targetFree,
    sourceCooldown: sourceLink.cooldown,
    estimate: estimateLinkTransfer(plan.amount)
  };
  const result = sourceLink.transferEnergy(
    targetLink,
    plan.amount
  );

  return {
    status: result === OK
      ? 'link-transfer-scheduled'
      : 'link-transfer-rejected',
    result,
    amount: plan.amount,
    before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const outcome = runLinkTransfer('W1N1');

  if (
    outcome.status === 'link-transfer-rejected'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'link-transfer-status',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="reserve">Leave target capacity through a policy reserve</h2>
<pre><code class="language-javascript">const targetReserve = 100;</code></pre>
<p>A target-capacity reserve can leave space for another source Link or a temporary delivery. It is room configuration, not a StructureLink property or universal recommendation.</p>

<h2 id="coordination">Use one dispatcher for multiple source Links</h2>
<p>Several modules can read the same target free capacity before actions settle. Use one Link-network dispatcher, stable source priority, and at most the intended number of target assignments per tick. A local reservation map is coordination, not a Store lock.</p>

<h2 id="after-ok">Verify later Store and cooldown state</h2>
<pre><code class="language-javascript">function inspectLinkTransfer(before) {
  const source = getOwnedLink(before.sourceLinkId);
  const target = getOwnedLink(before.targetLinkId);

  return {
    sourceFound: Boolean(source),
    targetFound: Boolean(target),
    sourceEnergyBefore: before.sourceEnergy,
    sourceEnergyNow: source
      ? source.store.getUsedCapacity(RESOURCE_ENERGY)
      : null,
    targetEnergyBefore: before.targetEnergy,
    targetEnergyNow: target
      ? target.store.getUsedCapacity(RESOURCE_ENERGY)
      : null,
    sourceCooldownNow: source?.cooldown ?? null
  };
}</code></pre>
<p>Other same-tick logistics can change both Stores, so report net state rather than claiming one perfect transfer delta.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical cause</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Transfer scheduled</td><td>Both Stores and cooldown later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Source Link not yours</td><td>ID and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Source stock changed</td><td>Current source Store</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Target is not a valid Link</td><td>Type and current object</td></tr>
<tr><td><code>ERR_FULL</code></td><td>Target cannot receive amount</td><td>Capacity and concurrent actions</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Links are not in one room</td><td>Room identities</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid amount</td><td>Positive finite amount</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Source cooldown active</td><td><code>sourceLink.cooldown</code></td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Link inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Store explicit source and target IDs.</li>
<li>Validate owned Link types every tick.</li>
<li>Reject the same object and different rooms.</li>
<li>Check both active states.</li>
<li>Check source cooldown.</li>
<li>Read current source stock and target capacity.</li>
<li>Apply target reserve and minimum send as labeled policies.</li>
<li>Use loss estimates only for logs.</li>
<li>Coordinate multiple source Links centrally.</li>
<li>Save the return code and verify later state.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not discover Link roles automatically, optimize cooldown distance, fill a Controller Link from multiple rooms, coordinate Creep hauling, or guarantee exact received Energy. Continue with <a href="/en/blog/screeps-select-source-by-path">reachable Source selection</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why can the target remain partly empty?</h3>
<p>The conservative send amount does not reverse-calculate loss. A later transfer can use current Store state.</p>
<h3>Should minimumSend always be 200?</h3>
<p>No. It is an example scheduling threshold. Set it from your room's traffic and urgency.</p>
<h3>Can two source Links send in one tick?</h3>
<p>The API and current target capacity determine accepted actions. A dispatcher should coordinate visible capacity and preserve every return code.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLink" rel="nofollow">API Reference: StructureLink</a></li>
<li><a href="https://docs.screeps.com/api/#StructureLink.transferEnergy" rel="nofollow">API Reference: transferEnergy()</a></li>
<li><a href="https://docs.screeps.com/api/#Store" rel="nofollow">API Reference: Store</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">API Reference: LINK_LOSS_RATIO</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
