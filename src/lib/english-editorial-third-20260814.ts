import type { EnglishBeginnerArticle } from "./english-beginner-content";

const UPDATED_AT = "2026-08-14";
const THIRD_BATCH_SLUGS = new Set([
  "screeps-rawmemory-segments",
  "screeps-lab-run-reaction",
  "screeps-lab-boost-creep",
]);

function sharedVerification(
  docs: string,
  source: string,
  staticReview: string,
  liveBoundary: string,
): Array<[string, string]> {
  return [
    ["Chinese source article", "Reviewed in full"],
    ["Official documentation", docs],
    ["Official implementation source", source],
    ["Static code review", staticReview],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Live boundary test", liveBoundary],
    ["Evidence level", "Official documentation, official implementation source, repository review, JavaScript review and static lifecycle analysis only"],
    ["Last editorial review", "August 14, 2026"],
  ];
}

function patchSegments(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps RawMemory Segments: Request, Read, and Write Across Ticks",
    headline: "Use RawMemory Segments Without Same-Tick Assumptions",
    description:
      "Coordinate RawMemory Segment activation across ticks, distinguish unavailable from empty, respect the current driver string-length limit, and avoid overwriting data after activation mistakes.",
    readingTime: "15 min read",
    keywords: [
      "Screeps RawMemory Segments",
      "RawMemory setActiveSegments next tick",
      "RawMemory segments undefined",
      "Screeps Segment 100 KB",
      "Screeps Segment string length",
    ],
    primaryKeyword: "Screeps RawMemory Segments",
    searchIntent:
      "Use RawMemory Segments safely across ticks without same-tick activation or incorrect size-limit assumptions",
    finalScore: 99,
    verification: sharedVerification(
      "Checked August 14, 2026 — RawMemory.segments, setActiveSegments(), Segment IDs 0–99, up to 10 active Segments, and the documented 100 KB boundary",
      "Checked current screeps/driver runtime — saved Segment values must be strings, no more than 10 Segment keys may be saved in one tick, and the current size guard compares JavaScript string .length with 100 * 1024",
      "Passed — next-tick activation, last-call-wins coordination, late-request rejection, unavailable/empty separation, schema validation, and current-driver length preflight reviewed",
      "Pending — no live Segment activation, non-ASCII payload, persistence, or oversize write trace was collected",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["official-boundaries", "Official Segment boundaries"],
      ["timeline", "Request now, read later"],
      ["activation-manager", "Finalize activation once"],
      ["read-payload", "Read unavailable and empty separately"],
      ["write-payload", "Match the current driver length boundary"],
      ["complete-workflow", "Minimal read-merge-write workflow"],
      ["failure-modes", "Failure modes worth logging"],
      ["verify-ticks", "How to verify across ticks"],
      ["choose-another-guide", "Choose another guide when"],
      ["official-docs", "Official documentation and source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when data must persist outside ordinary <code>Memory</code> and your code can follow a request-now, read-later lifecycle. The important boundary is not serialization syntax; it is activation timing. Calling <code>RawMemory.setActiveSegments()</code> does not make those Segments readable in the same tick.</p>
<p>A safe manager therefore separates three concerns: which IDs should be active next tick, what data is actually available this tick, and whether a replacement string is safe to write.</p>

<h2 id="official-boundaries">The boundaries that shape the design</h2>
<div class="table-scroll"><table>
<thead><tr><th>Boundary</th><th>Engineering consequence</th></tr></thead>
<tbody>
<tr><td>Segment IDs are <code>0–99</code></td><td>Reject negative, fractional, and greater-than-99 IDs before scheduling.</td></tr>
<tr><td>Up to 10 Segments may be active</td><td>Rank requests and report deferred IDs instead of silently dropping them.</td></tr>
<tr><td>Activation applies on the next tick</td><td>Do not treat a same-tick request as proof that <code>RawMemory.segments[id]</code> is available.</td></tr>
<tr><td>Later <code>setActiveSegments()</code> calls replace earlier plans</td><td>Use one coordinator and one final activation call.</td></tr>
<tr><td>Docs describe a 100 KB Segment limit</td><td>The current official driver enforces <code>string.length &lt;= 100 * 1024</code>; do not substitute a UTF-8 byte counter and call it the server rule.</td></tr>
</tbody></table></div>
<p>The last row is deliberately precise. The API documentation uses “100 KB,” while the current official <code>screeps/driver</code> implementation checks JavaScript string <code>.length</code>. A custom or future driver can differ, so code that targets a private server should verify that server's implementation instead of assuming this implementation detail is universal.</p>

<h2 id="timeline">Request on one tick, read on a later tick</h2>
<pre><code class="language-text">tick N
feature modules request Segment 7
one manager calls RawMemory.setActiveSegments([7])

tick N + 1
RawMemory.segments[7] may be available
read and validate the current string
write a replacement only from a state you understand
schedule the next active set</code></pre>
<p><code>undefined</code> and <code>''</code> are not equivalent. <code>undefined</code> means the Segment is not available to the current script. An empty string means the active Segment currently contains no data. Collapsing both into “empty” can turn an activation bug into destructive overwrite.</p>

<h2 id="activation-manager">Collect requests and finalize activation exactly once</h2>
<pre><code class="language-javascript">function getSegmentCoordinator() {
  global.segmentCoordinator ??= {
    requested: new Map(),
    finalizedAt: null,
    plan: null
  };

  return global.segmentCoordinator;
}

function requestSegment(id, priority = 0) {
  const coordinator = getSegmentCoordinator();

  if (coordinator.finalizedAt === Game.time) {
    return {
      accepted: false,
      status: 'activation-already-finalized'
    };
  }

  if (
    !Number.isInteger(id)
    || id < 0
    || id > 99
    || !Number.isFinite(priority)
  ) {
    return {
      accepted: false,
      status: 'segment-request-invalid'
    };
  }

  const previous = coordinator.requested.get(id);
  coordinator.requested.set(
    id,
    previous === undefined
      ? priority
      : Math.max(previous, priority)
  );

  return { accepted: true, status: 'segment-requested' };
}

function finalizeSegmentRequests() {
  const coordinator = getSegmentCoordinator();

  if (coordinator.finalizedAt === Game.time) {
    return {
      status: 'activation-already-finalized',
      ...coordinator.plan
    };
  }

  const ranked = [...coordinator.requested.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const activeNextTick = ranked
    .slice(0, 10)
    .map(([id]) => id);
  const deferred = ranked
    .slice(10)
    .map(([id]) => id);

  RawMemory.setActiveSegments(activeNextTick);

  coordinator.finalizedAt = Game.time;
  coordinator.plan = { activeNextTick, deferred };
  coordinator.requested.clear();

  return {
    status: 'activation-scheduled',
    activeNextTick,
    deferred
  };
}</code></pre>
<p>This guard makes repeated same-tick finalization idempotent and exposes requests that arrive too late. It cannot protect code that bypasses the coordinator and calls <code>RawMemory.setActiveSegments()</code> directly, so keep the raw API behind one module boundary.</p>

<h2 id="read-payload">Distinguish unavailable, empty, corrupt, and ready</h2>
<pre><code class="language-javascript">function readSegment(id, expectedVersion) {
  const raw = RawMemory.segments[id];

  if (raw === undefined) {
    return { status: 'segment-unavailable', data: null };
  }

  if (raw === '') {
    return { status: 'empty', data: {} };
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed?.version !== expectedVersion
      || !parsed.data
      || typeof parsed.data !== 'object'
      || Array.isArray(parsed.data)
    ) {
      return { status: 'schema-mismatch', data: null };
    }

    return { status: 'ready', data: parsed.data };
  } catch (error) {
    return {
      status: 'invalid-json',
      data: null,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}</code></pre>
<p>A schema mismatch is not automatically corrupt data. Preserve the original string until a migration, rollback, or recovery policy succeeds.</p>

<h2 id="write-payload">Preflight writes against the current official driver</h2>
<pre><code class="language-javascript">function writeSegment(id, version, data) {
  if (RawMemory.segments[id] === undefined) {
    return {
      ok: false,
      status: 'segment-unavailable'
    };
  }

  const raw = JSON.stringify({
    version,
    writtenAt: Game.time,
    data
  });

  // Current official screeps/driver boundary.
  // This is JavaScript string length, not UTF-8 encoded bytes.
  const length = raw.length;

  if (length > 100 * 1024) {
    return {
      ok: false,
      status: 'segment-too-large-for-current-driver',
      length
    };
  }

  RawMemory.segments[id] = raw;

  return {
    ok: true,
    status: 'segment-written',
    length
  };
}</code></pre>
<p>Do not use <code>new TextEncoder().encode(raw).length</code> and describe that result as the current Screeps server's enforcement rule. UTF-8 byte length and JavaScript string length diverge for some non-ASCII text. A byte-based application budget can still be useful as your own portability policy, but label it as project policy rather than official driver behavior.</p>
<p>The current driver also validates saved Segment values as strings and rejects saving more than 10 Segment keys in one tick. The safest public-API workflow remains simple: write only Segments that are actually available to this tick and keep the active set coordinated.</p>

<h2 id="complete-workflow">A minimal read, merge, write workflow</h2>
<pre><code class="language-javascript">function updateIntelSegment() {
  const segmentId = 7;
  const version = 1;
  const request = requestSegment(segmentId, 100);

  if (!request.accepted) {
    return { status: request.status };
  }

  const current = readSegment(segmentId, version);
  if (
    current.status !== 'ready'
    && current.status !== 'empty'
  ) {
    return { status: current.status };
  }

  return writeSegment(segmentId, version, {
    ...current.data,
    lastSeenTick: Game.time
  });
}

function runSegmentTick() {
  const update = updateIntelSegment();
  const activation = finalizeSegmentRequests();
  return { update, activation };
}</code></pre>
<p>On a first request, <code>updateIntelSegment()</code> commonly reports <code>segment-unavailable</code> while the finalizer schedules the ID for the next tick. That is an expected lifecycle state, not a reason to initialize or overwrite the Segment.</p>

<h2 id="failure-modes">Failure modes worth logging separately</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>What it actually tells you</th></tr></thead>
<tbody>
<tr><td><code>segment-request-invalid</code></td><td>The ID or priority failed local validation.</td></tr>
<tr><td><code>activation-already-finalized</code></td><td>A module requested data after the one activation plan for this tick was already committed.</td></tr>
<tr><td><code>segment-unavailable</code></td><td>The Segment is not exposed to this tick; do not infer that its persistent contents are empty.</td></tr>
<tr><td><code>schema-mismatch</code></td><td>The payload is readable JSON but not the version your consumer understands.</td></tr>
<tr><td><code>segment-too-large-for-current-driver</code></td><td>The serialized JavaScript string exceeds the current official driver's length guard.</td></tr>
</tbody></table></div>

<h2 id="verify-ticks">How to verify across ticks</h2>
<p>Record the requested IDs and <code>Game.time</code>, then inspect availability on the next tick. Test unavailable, empty, valid, invalid-JSON, schema-mismatch, deferred, repeated-finalize, ASCII boundary, and non-ASCII boundary cases separately. This revision contains no fabricated Segment contents, Console transcript, or live persistence trace.</p>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-memory-basics">the Memory guide</a> for small durable application state. Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> when data is disposable and rebuildable after a global reset.</p>

<h2 id="official-docs">Official documentation and source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RawMemory.setActiveSegments" rel="nofollow">API Reference: RawMemory.setActiveSegments()</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.segments" rel="nofollow">API Reference: RawMemory.segments</a></li>
<li><a href="https://github.com/screeps/driver/blob/master/lib/runtime/runtime.js" rel="nofollow">Official screeps/driver runtime implementation</a></li>
</ul>`,
  };
}

function patchReaction(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps runReaction(): Verify One Owned Lab Reaction",
    headline: "Run One Lab Reaction Without Guessing Which Store Change Was Yours",
    description:
      "Verify one Screeps Lab reaction with the real reaction amount, including PWR_OPERATE_LAB, correct output-vs-input Lab ownership boundaries, and exact three-Store reconciliation.",
    readingTime: "17 min read",
    keywords: [
      "Screeps runReaction",
      "Screeps PWR_OPERATE_LAB",
      "Screeps LAB_REACTION_AMOUNT",
      "Screeps Lab reaction amount",
      "Screeps Lab reaction verification",
    ],
    primaryKeyword: "Screeps runReaction",
    searchIntent:
      "Run and verify one Lab reaction without assuming LAB_REACTION_AMOUNT stays fixed under PWR_OPERATE_LAB",
    finalScore: 99,
    verification: sharedVerification(
      "Checked August 14, 2026 — StructureLab.runReaction(), REACTIONS, LAB_REACTION_AMOUNT, PWR_OPERATE_LAB, POWER_INFO, range, cooldown and return codes",
      "Checked current screeps/engine runReaction validation and processor — an active PWR_OPERATE_LAB effect increases reactionAmount; the calling output Lab must be owned/active, while input Lab ownership/activity is not an API precondition",
      "Passed — dynamic reaction amount, reagent and capacity preflight, exact input/output deltas, shared-input risk, exclusive window, and output-vs-input API boundaries reviewed",
      "Pending — Live shared-input, exclusive-window and exact three-Store delta test; no live PWR_OPERATE_LAB trace was collected",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["api-boundary", "Separate output and input Lab requirements"],
      ["reaction-amount", "Calculate the real reaction amount"],
      ["plan", "Build one reaction plan"],
      ["exclusive-window", "Reserve an exclusive Store window"],
      ["submit", "Snapshot and submit once"],
      ["verify", "Verify all three Store deltas"],
      ["states", "Keep accepted, exact, and ambiguous states separate"],
      ["return-codes", "Preserve return codes"],
      ["scope", "Scope and adjacent systems"],
      ["official-docs", "Official documentation and source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this workflow when one scheduler must submit one <code>runReaction()</code> call and later prove which Store changes came from that reaction. The important 2026 boundary is that the produced amount is not always the base <code>LAB_REACTION_AMOUNT</code>: an active <code>PWR_OPERATE_LAB</code> effect on the output Lab increases the amount processed by the engine.</p>
<p>If preflight, snapshots, and verification all hard-code the base amount, the code becomes internally inconsistent exactly when an operated Lab is most valuable.</p>

<h2 id="api-boundary">Separate output Lab requirements from input Lab requirements</h2>
<pre><code class="language-javascript">function getVisibleLab(id) {
  const lab = typeof id === 'string'
    ? Game.getObjectById(id)
    : null;

  return lab && lab.structureType === STRUCTURE_LAB
    ? lab
    : null;
}

function getOwnedActiveOutputLab(id) {
  const lab = getVisibleLab(id);

  return lab
    && lab.my === true
    && lab.isActive() === true
      ? lab
      : null;
}</code></pre>
<p>The Lab that calls <code>runReaction()</code> is the output Lab and must satisfy the ownership/activity checks enforced by the API. The current engine does not impose the same ownership or <code>isActive()</code> precondition on the two input Lab objects. Requiring owned active input Labs can still be a sensible project policy for a closed production room, but label it as your policy rather than the API contract.</p>
<p>All three Labs must still be valid, distinct Lab objects, and each input must be within range 2 of the output Lab.</p>

<h2 id="reaction-amount">Calculate the reaction amount from the output Lab</h2>
<pre><code class="language-javascript">function getReactionAmount(outputLab) {
  let reactionAmount = LAB_REACTION_AMOUNT;
  const effect = outputLab.effects?.find(item =>
    item.effect === PWR_OPERATE_LAB
    && item.ticksRemaining > 0
  );

  if (effect) {
    reactionAmount +=
      POWER_INFO[PWR_OPERATE_LAB].effect[effect.level - 1];
  }

  return reactionAmount;
}</code></pre>
<p>This mirrors the current official engine boundary: start with <code>LAB_REACTION_AMOUNT</code>, then add the active <code>PWR_OPERATE_LAB</code> effect for the output Lab. Snapshot that value once for the request. Do not calculate one amount for preflight and a different amount for settlement.</p>

<h2 id="plan">Build a plan from current reagents, amount, range, and capacity</h2>
<pre><code class="language-javascript">function getReactionProduct(inputA, inputB) {
  const reagentA = inputA.mineralType;
  const reagentB = inputB.mineralType;

  if (!reagentA || !reagentB) return null;

  return {
    reagentA,
    reagentB,
    product: REACTIONS[reagentA]?.[reagentB] ?? null
  };
}

function buildReactionPlan(request) {
  const outputLab = getOwnedActiveOutputLab(request.outputLabId);
  const inputA = getVisibleLab(request.inputLabAId);
  const inputB = getVisibleLab(request.inputLabBId);

  if (!outputLab || !inputA || !inputB) {
    return { ready: false, reason: 'lab-unavailable' };
  }

  if (
    outputLab.id === inputA.id
    || outputLab.id === inputB.id
    || inputA.id === inputB.id
  ) {
    return { ready: false, reason: 'lab-ids-not-distinct' };
  }

  if (
    !outputLab.pos.inRangeTo(inputA, 2)
    || !outputLab.pos.inRangeTo(inputB, 2)
  ) {
    return { ready: false, reason: 'input-out-of-range' };
  }

  if (outputLab.cooldown > 0) {
    return { ready: false, reason: 'output-cooling-down' };
  }

  const recipe = getReactionProduct(inputA, inputB);
  if (!recipe?.product) {
    return { ready: false, reason: 'recipe-invalid' };
  }

  const reactionAmount = getReactionAmount(outputLab);

  if (
    inputA.store.getUsedCapacity(recipe.reagentA) < reactionAmount
    || inputB.store.getUsedCapacity(recipe.reagentB) < reactionAmount
  ) {
    return {
      ready: false,
      reason: 'reagent-insufficient',
      product: recipe.product,
      reactionAmount
    };
  }

  if (
    outputLab.mineralType
    && outputLab.mineralType !== recipe.product
  ) {
    return { ready: false, reason: 'output-mineral-conflict' };
  }

  if (
    outputLab.store.getFreeCapacity(recipe.product) < reactionAmount
  ) {
    return { ready: false, reason: 'output-capacity-insufficient' };
  }

  return {
    ready: true,
    reason: 'ready',
    outputLab,
    inputA,
    inputB,
    ...recipe,
    reactionAmount
  };
}</code></pre>
<p>Using <code>LAB_REACTION_AMOUNT</code> directly in the reagent or output-capacity checks is only correct when no active operation effect increases the batch. The plan carries <code>reactionAmount</code> forward so every later check uses the same request identity.</p>

<h2 id="exclusive-window">Reserve one exclusive three-Store window</h2>
<p>Between snapshot and verification, prevent haulers, another reaction scheduler, and any other code from changing the product or reagent amounts in these three Labs. Shared input Labs are legal, but simultaneous consumers make exact attribution impossible unless the scheduler serializes them.</p>
<p>Record <code>exclusiveWindow: true</code> only when the production coordinator actually enforces that promise.</p>

<h2 id="submit">Snapshot the exact amount and submit once</h2>
<pre><code class="language-javascript">function submitReactionRequest(request) {
  const plan = buildReactionPlan(request);

  request.lastCheckedAt = Game.time;
  request.lastStatus = plan.reason;

  if (!plan.ready) {
    return { status: 'not-submitted', reason: plan.reason };
  }

  request.enabled = false;
  request.snapshot = {
    exclusiveWindow: request.exclusiveWindow === true,
    outputLabId: plan.outputLab.id,
    inputLabAId: plan.inputA.id,
    inputLabBId: plan.inputB.id,
    reagentA: plan.reagentA,
    reagentB: plan.reagentB,
    product: plan.product,
    reactionAmount: plan.reactionAmount,
    outputBefore:
      plan.outputLab.store.getUsedCapacity(plan.product),
    inputABefore:
      plan.inputA.store.getUsedCapacity(plan.reagentA),
    inputBBefore:
      plan.inputB.store.getUsedCapacity(plan.reagentB)
  };

  const result = plan.outputLab.runReaction(
    plan.inputA,
    plan.inputB
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-reaction'
    : 'failed-review-required';

  return { status: request.status, result };
}</code></pre>
<p><code>OK</code> means the reaction intent was accepted. It is not a license to infer later Store contents without checking them.</p>

<h2 id="verify">Verify one output increase and both reagent decreases</h2>
<pre><code class="language-javascript">function verifyReaction(request) {
  const snapshot = request?.snapshot;

  if (!snapshot || request.result !== OK) {
    return { status: 'submission-not-accepted' };
  }

  if (snapshot.exclusiveWindow !== true) {
    return { status: 'not-exclusive' };
  }

  const outputLab = getVisibleLab(snapshot.outputLabId);
  const inputA = getVisibleLab(snapshot.inputLabAId);
  const inputB = getVisibleLab(snapshot.inputLabBId);

  if (!outputLab || !inputA || !inputB) {
    return { status: 'lab-unavailable' };
  }

  const outputDelta =
    outputLab.store.getUsedCapacity(snapshot.product)
      - snapshot.outputBefore;
  const inputADelta =
    inputA.store.getUsedCapacity(snapshot.reagentA)
      - snapshot.inputABefore;
  const inputBDelta =
    inputB.store.getUsedCapacity(snapshot.reagentB)
      - snapshot.inputBBefore;

  const exact =
    outputDelta === snapshot.reactionAmount
    && inputADelta === -snapshot.reactionAmount
    && inputBDelta === -snapshot.reactionAmount;

  if (exact) {
    return {
      status: 'verified-exact-reaction',
      outputDelta,
      inputADelta,
      inputBDelta
    };
  }

  const unchanged =
    outputDelta === 0
    && inputADelta === 0
    && inputBDelta === 0;

  return {
    status: unchanged
      ? 'pending-no-store-delta'
      : 'state-changed-ambiguous',
    outputDelta,
    inputADelta,
    inputBDelta
  };
}</code></pre>
<p>The exact signature is <code>+reactionAmount</code> product and <code>-reactionAmount</code> from each input. Cooldown is supporting evidence, not a unique reaction identifier.</p>

<h2 id="states">Keep acceptance and settlement states separate</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>accepted-pending-reaction</code></td><td><code>runReaction()</code> returned <code>OK</code>; exact Store evidence is still pending.</td></tr>
<tr><td><code>pending-no-store-delta</code></td><td>The later snapshot is unchanged; keep investigating timing and visibility instead of inventing success.</td></tr>
<tr><td><code>state-changed-ambiguous</code></td><td>At least one Store changed but the three deltas do not match one isolated reaction.</td></tr>
<tr><td><code>verified-exact-reaction</code></td><td>Product and both reagents match the one snapshotted reaction amount.</td></tr>
</tbody></table></div>

<h2 id="return-codes">Preserve the documented return codes</h2>
<p>Documented <code>runReaction()</code> results include <code>ERR_NOT_OWNER</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_TARGET</code>, <code>ERR_FULL</code>, <code>ERR_NOT_IN_RANGE</code>, <code>ERR_INVALID_ARGS</code>, <code>ERR_TIRED</code>, and <code>ERR_RCL_NOT_ENOUGH</code>. Log the actual return code instead of collapsing every failure into “reaction failed.”</p>

<h2 id="scope">Keep hauling, boosting, and reaction scheduling separate</h2>
<p>This page owns one reaction request and its evidence. Lab assignment, reagent hauling, reaction chains, reverse reactions, boost queues, and multi-output scheduling need separate state machines. Continue with <a href="/en/blog/screeps-lab-boost-creep">the boost verification guide</a> when the product is intended for a Creep.</p>

<h2 id="official-docs">Official documentation and source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLab.runReaction" rel="nofollow">API Reference: StructureLab.runReaction()</a></li>
<li><a href="https://docs.screeps.com/api/#LAB_REACTION_AMOUNT" rel="nofollow">API Reference: LAB_REACTION_AMOUNT</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps power documentation: PWR_OPERATE_LAB</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/structures.js" rel="nofollow">Official engine API validation</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/labs/run-reaction.js" rel="nofollow">Official reaction processor</a></li>
</ul>`,
  };
}

function patchBoost(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps boostCreep(): Verify Exact Body Part Changes",
    headline: "Boost One Creep and Prove Which Body Parts Changed",
    description:
      "Verify Screeps boostCreep() against the current engine: count eligible body entries without a hits check, separate API acceptance from strict all-or-nothing budgets, and prove exact part and Lab Store changes.",
    readingTime: "18 min read",
    keywords: [
      "Screeps boostCreep",
      "Screeps boost eligible parts",
      "Screeps LAB_BOOST_MINERAL",
      "Screeps LAB_BOOST_ENERGY",
      "Screeps boostCreep bodyPartsCount",
    ],
    primaryKeyword: "Screeps boostCreep",
    searchIntent:
      "Boost a controlled set of Creep body parts without miscounting destroyed parts or assuming OK guarantees every requested part changed",
    finalScore: 99,
    verification: sharedVerification(
      "Checked August 14, 2026 — StructureLab.boostCreep(), BOOSTS, LAB_BOOST_MINERAL, LAB_BOOST_ENERGY, bodyPartsCount, part order and return codes",
      "Checked current screeps/engine boostCreep validation and processor — engine eligibility does not require part.hits > 0; the Lab is ownership-gated, target ownership is not an API precondition, and processing continues only while per-part Lab resources remain",
      "Passed — destroyed-part eligibility, TOUGH/other part order, strict project budgets, partial-resource outcome, exact indexes, body identity and Lab Store deltas reviewed",
      "Pending — Live Creep replacement, part-order, exclusive-window and Lab Store delta test; no live destroyed-part or partial-resource boost trace was collected",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["api-boundary", "Separate API rules from project policy"],
      ["eligible", "Count engine-eligible body entries"],
      ["order", "Predict the engine part order"],
      ["budget", "Choose acceptance or all-or-nothing budgets"],
      ["plan", "Build a strict boost plan"],
      ["submit", "Snapshot identity and submit once"],
      ["verify", "Verify exact body and Store changes"],
      ["states", "Treat partial changes as evidence"],
      ["return-codes", "Preserve return codes"],
      ["scope", "Scope and adjacent systems"],
      ["official-docs", "Official documentation and source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this workflow when a Lab should boost a known Creep and you need to prove which body entries changed. Two boundaries matter more than the usual “mineral + Energy + range” checklist: the current engine does not require an eligible body entry to have <code>hits > 0</code>, and an accepted request does not by itself prove every requested part was actually boosted.</p>

<h2 id="api-boundary">Separate the API contract from stricter project policy</h2>
<div class="table-scroll"><table>
<thead><tr><th>Boundary</th><th>What the current engine does</th></tr></thead>
<tbody>
<tr><td>Lab ownership</td><td>The Lab that calls <code>boostCreep()</code> must be yours.</td></tr>
<tr><td>Target ownership</td><td>The API validates a Creep target, range, spawning state and eligibility; target ownership is not the engine's ownership precondition.</td></tr>
<tr><td>Eligible part damage</td><td>Eligibility is based on body type, boost mapping and whether the entry is already boosted. It does not filter on <code>part.hits > 0</code>.</td></tr>
<tr><td>Requested part count</td><td>If <code>bodyPartsCount</code> exceeds eligible entries, the call can return <code>ERR_NOT_FOUND</code>.</td></tr>
<tr><td>Resource precheck</td><td>The API requires enough mineral and Energy to process at least one eligible part; the processor then continues while resources remain.</td></tr>
</tbody></table></div>
<p>For your own empire, requiring <code>creep.my === true</code> is usually a good safety policy. It is still project policy, not the same thing as the method's ownership check.</p>

<h2 id="eligible">Count engine-eligible entries without a hits filter</h2>
<pre><code class="language-javascript">function getBoostBodyType(mineralType) {
  if (typeof mineralType !== 'string') return null;

  for (const bodyType of BODYPARTS_ALL) {
    if (BOOSTS[bodyType]?.[mineralType]) {
      return bodyType;
    }
  }

  return null;
}

function getEligibleBoostParts(creep, bodyType, mineralType) {
  return creep.body
    .map((part, index) => ({ part, index }))
    .filter(({ part }) =>
      part.type === bodyType
      && !part.boost
      && BOOSTS[part.type]?.[mineralType]
    );
}</code></pre>
<p>Do not add <code>part.hits > 0</code> to this engine-eligibility count. A destroyed WORK, MOVE, TOUGH, or other matching body entry can still be selected by the current boost processor. “Active body part” is a different concept used by APIs such as <code>getActiveBodyparts()</code>; it is not the boost eligibility rule.</p>

<h2 id="order">Predict the body indexes the processor will visit</h2>
<pre><code class="language-javascript">function getExpectedBoostIndexes(
  eligible,
  bodyType,
  count
) {
  const ordered = bodyType === TOUGH
    ? [...eligible]
    : [...eligible].reverse();

  return ordered
    .slice(0, count)
    .map(item => item.index);
}</code></pre>
<p>The current processor handles <code>TOUGH</code> from left to right and other body types from right to left. This matters when <code>bodyPartsCount</code> is smaller than the eligible set or when damaged body entries are mixed with intact ones.</p>

<h2 id="budget">Choose between API acceptance and an all-or-nothing project budget</h2>
<p>The method's acceptance check and a production scheduler's desired guarantee are not identical. If your scheduler wants exactly <code>N</code> parts or nothing, preflight the full budget yourself:</p>
<pre><code class="language-javascript">function getStrictBoostBudget(bodyPartsCount) {
  if (
    !Number.isInteger(bodyPartsCount)
    || bodyPartsCount <= 0
  ) {
    return null;
  }

  return {
    mineral: LAB_BOOST_MINERAL * bodyPartsCount,
    energy: LAB_BOOST_ENERGY * bodyPartsCount
  };
}</code></pre>
<p>This full-<code>N</code> requirement is a <strong>project safeguard</strong>. The current API validation only needs enough mineral and Energy for at least one part before accepting the intent. During processing, each boosted entry consumes one <code>LAB_BOOST_MINERAL</code> and one <code>LAB_BOOST_ENERGY</code> unit bundle until the requested count, eligible set, or available resources stop the loop.</p>

<h2 id="plan">Build a strict boost plan before changing state</h2>
<pre><code class="language-javascript">function buildStrictBoostPlan(lab, creep, bodyPartsCount) {
  if (!lab || !creep || creep.spawning === true) {
    return { ready: false, reason: 'object-unavailable' };
  }

  const mineralType = lab.mineralType;
  const bodyType = getBoostBodyType(mineralType);

  if (!mineralType || !bodyType) {
    return { ready: false, reason: 'boost-mineral-invalid' };
  }

  const eligible = getEligibleBoostParts(
    creep,
    bodyType,
    mineralType
  );
  const count = bodyPartsCount == null
    ? eligible.length
    : bodyPartsCount;

  if (
    !Number.isInteger(count)
    || count <= 0
    || count > eligible.length
  ) {
    return {
      ready: false,
      reason: 'part-count-invalid',
      eligibleCount: eligible.length
    };
  }

  const budget = getStrictBoostBudget(count);

  if (
    lab.store.getUsedCapacity(mineralType) < budget.mineral
    || lab.store.getUsedCapacity(RESOURCE_ENERGY) < budget.energy
  ) {
    return {
      ready: false,
      reason: 'strict-budget-insufficient',
      mineralType,
      bodyType,
      ...budget
    };
  }

  if (!lab.pos.isNearTo(creep)) {
    return { ready: false, reason: 'creep-out-of-range' };
  }

  return {
    ready: true,
    reason: 'ready',
    mineralType,
    bodyType,
    partCount: count,
    expectedIndexes: getExpectedBoostIndexes(
      eligible,
      bodyType,
      count
    ),
    ...budget
  };
}</code></pre>
<p>If you intentionally allow partial boosting, do not use this strict budget gate. Instead, model “accepted but fewer parts changed” as an explicit outcome.</p>

<h2 id="submit">Snapshot Creep identity, body state, and Lab resources before one call</h2>
<pre><code class="language-javascript">function submitBoostRequest(request) {
  const lab = Game.getObjectById(request.labId);
  const creep = Game.getObjectById(request.creepId);

  if (
    !lab
    || lab.structureType !== STRUCTURE_LAB
    || lab.my !== true
    || lab.isActive() !== true
    || !creep
    || creep.spawning === true
  ) {
    return { status: 'object-unavailable' };
  }

  // Owning the target Creep is a project safety policy here.
  if (creep.my !== true) {
    return { status: 'target-not-owned-by-policy' };
  }

  const plan = buildStrictBoostPlan(
    lab,
    creep,
    request.bodyPartsCount
  );

  if (!plan.ready) {
    return { status: plan.reason };
  }

  request.enabled = false;
  request.snapshot = {
    labId: lab.id,
    creepId: creep.id,
    creepName: creep.name,
    bodyLength: creep.body.length,
    mineralType: plan.mineralType,
    bodyType: plan.bodyType,
    partCount: plan.partCount,
    expectedIndexes: plan.expectedIndexes,
    boostsBefore: creep.body.map(part => part.boost ?? null),
    mineralBefore:
      lab.store.getUsedCapacity(plan.mineralType),
    energyBefore:
      lab.store.getUsedCapacity(RESOURCE_ENERGY),
    exclusiveWindow: request.exclusiveWindow === true
  };

  const result = lab.boostCreep(creep, plan.partCount);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-boost'
    : 'failed-review-required';

  return { status: request.status, result };
}</code></pre>
<p>Using the Creep ID as well as the name avoids silently verifying a replacement Creep that reused the same name after the original died.</p>

<h2 id="verify">Verify exact body indexes and Lab Store deltas</h2>
<pre><code class="language-javascript">function verifyBoost(request) {
  const snapshot = request?.snapshot;

  if (!snapshot || request.result !== OK) {
    return { status: 'submission-not-accepted' };
  }

  if (snapshot.exclusiveWindow !== true) {
    return { status: 'not-exclusive' };
  }

  const lab = Game.getObjectById(snapshot.labId);
  const creep = Game.getObjectById(snapshot.creepId);

  if (!lab || !creep) {
    return { status: 'object-unavailable' };
  }

  if (
    creep.name !== snapshot.creepName
    || creep.body.length !== snapshot.bodyLength
  ) {
    return { status: 'body-identity-mismatch' };
  }

  const changedIndexes = creep.body
    .map((part, index) => ({
      index,
      before: snapshot.boostsBefore[index],
      after: part.boost ?? null
    }))
    .filter(item => item.before !== item.after)
    .map(item => item.index);

  const mineralDelta =
    lab.store.getUsedCapacity(snapshot.mineralType)
      - snapshot.mineralBefore;
  const energyDelta =
    lab.store.getUsedCapacity(RESOURCE_ENERGY)
      - snapshot.energyBefore;
  const expectedMineralDelta =
    -LAB_BOOST_MINERAL * snapshot.partCount;
  const expectedEnergyDelta =
    -LAB_BOOST_ENERGY * snapshot.partCount;

  const exactIndexes =
    changedIndexes.length === snapshot.expectedIndexes.length
    && changedIndexes.every((index, position) =>
      index === snapshot.expectedIndexes[position]
    );

  if (
    exactIndexes
    && mineralDelta === expectedMineralDelta
    && energyDelta === expectedEnergyDelta
  ) {
    return {
      status: 'verified-exact-boost',
      changedIndexes,
      expectedIndexes: snapshot.expectedIndexes,
      mineralDelta,
      energyDelta
    };
  }

  return {
    status: changedIndexes.length > 0
      ? 'partial-or-ambiguous-boost'
      : 'pending-no-body-delta',
    changedIndexes,
    expectedIndexes: snapshot.expectedIndexes,
    mineralDelta,
    energyDelta
  };
}</code></pre>
<p>In the strict workflow, <code>OK</code> plus a later partial body change is evidence that the all-or-nothing assumptions were violated by another actor, resource change, or unsupported timing assumption. In a deliberately permissive workflow, partial change can simply be the expected processor outcome when the Lab lacked full resources for the requested count.</p>

<h2 id="states">Do not collapse partial change into success</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>accepted-pending-boost</code></td><td>The method returned <code>OK</code>; body and Store evidence is still pending.</td></tr>
<tr><td><code>body-identity-mismatch</code></td><td>The observed Creep is not the same body snapshot the request targeted.</td></tr>
<tr><td><code>partial-or-ambiguous-boost</code></td><td>Some body entries changed, but not the exact indexes and resource signature expected by the strict plan.</td></tr>
<tr><td><code>verified-exact-boost</code></td><td>Exact targeted indexes changed and the Lab lost exactly the matching mineral and Energy budget.</td></tr>
</tbody></table></div>

<h2 id="return-codes">Preserve the current return-code boundary</h2>
<p>Documented results include <code>ERR_NOT_OWNER</code>, <code>ERR_NOT_FOUND</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_TARGET</code>, <code>ERR_NOT_IN_RANGE</code>, and <code>ERR_RCL_NOT_ENOUGH</code>. In particular, <code>ERR_NOT_FOUND</code> covers a Lab mineral that cannot boost any eligible part on the target, including an excessive <code>bodyPartsCount</code> request against the eligible set.</p>

<h2 id="scope">Keep Lab loading, queues, and combat policy separate</h2>
<p>This page owns one boost request and its evidence. Lab mineral loading, boost queues, boost selection strategy, body design, combat deployment, and unboosting should be separate systems. The verification layer should remain useful even when those policies change.</p>

<h2 id="official-docs">Official documentation and source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLab.boostCreep" rel="nofollow">API Reference: StructureLab.boostCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#BOOSTS" rel="nofollow">API Reference: BOOSTS</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/structures.js" rel="nofollow">Official engine API validation</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/labs/boost-creep.js" rel="nofollow">Official boost processor</a></li>
</ul>`,
  };
}

export function applyEnglishEditorialThird20260814(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  switch (article.slug) {
    case "screeps-rawmemory-segments":
      return patchSegments(article);
    case "screeps-lab-run-reaction":
      return patchReaction(article);
    case "screeps-lab-boost-creep":
      return patchBoost(article);
    default:
      return article;
  }
}

export function getEnglishEditorialThirdUpdatedAt20260814(
  slug: string,
): string | undefined {
  return THIRD_BATCH_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
