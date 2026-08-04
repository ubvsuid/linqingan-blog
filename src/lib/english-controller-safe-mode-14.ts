import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishControllerSafeModeArticle = {
  slug: "screeps-controller-activate-safe-mode",
  path: "/en/blog/screeps-controller-activate-safe-mode",
  chinesePath: "/blog/screeps-controller-activate-safe-mode",
  title: "Screeps activateSafeMode(): Prevent Same-Tick Intent Overwrite",
  headline: "Activate Safe Mode Once Without Losing the Final Controller Intent",
  description:
    "Route every Safe Mode request through one final per-tick dispatcher, bind the exact Controller ID, disable the request before activateSafeMode(), and verify activation consumption on the next tick.",
  category: "CONTROLLER · SAFE MODE ACTIVATION",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Safe Mode",
  tags: ["Screeps", "Controller", "Safe Mode", "Defense", "Operational Safety"],
  keywords: [
    "Screeps activateSafeMode",
    "Screeps Safe Mode intent overwrite",
    "Screeps Safe Mode coordinator",
    "Screeps safeModeAvailable",
    "Screeps Controller ERR_BUSY",
  ],
  primaryKeyword: "Screeps activateSafeMode",
  searchIntent: "Coordinate and verify one exact Safe Mode activation without same-tick intent replacement",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — activateSafeMode(), Safe Mode duration, one-room-per-shard restriction, Controller fields and return codes"],
    ["Official engine", "Reviewed at screeps/engine commit 80977824199a596d174d392fd0cf8c458c21fcbd — a later same-tick activation removes the earlier Controller intent"],
    ["Identity boundary", "The workflow stores the exact request, room and Controller ID and permits one final activateSafeMode() call per tick"],
    ["Evidence boundary", "No Room event is claimed; next-tick Controller state is primary evidence and charge generation must be excluded from the verification window"],
    ["JavaScript syntax", "Passed"],
    ["Offline decision review", "Passed — request identity, Controller preflight, downgrade threshold, deterministic selection, one-final-call guard and next-tick result states"],
    ["Screeps Console test", "Pending"],
    ["Live same-tick overwrite, activation, charge consumption and next-tick Controller test", "Pending"],
    ["Last verified", "August 4, 2026"],
  ],
  toc: [
    ["failure-mode", "The failure mode: two OK results, one surviving intent"],
    ["engine-contract", "What the runtime actually guarantees"],
    ["request-identity", "Bind approval to one exact Controller"],
    ["read-only-state", "Inspect current Controller state"],
    ["evaluate-request", "Evaluate without submitting an intent"],
    ["one-dispatcher", "Use one per-tick dispatcher"],
    ["final-submission", "Disable first and save accepted identity"],
    ["next-tick-proof", "Verify the exact Controller next tick"],
    ["failure-states", "Keep failure and ambiguity visible"],
    ["return-codes", "Interpret activateSafeMode() return codes"],
    ["integration-contract", "Integration contract for a real codebase"],
    ["scope", "Scope and evidence still pending"],
    ["official-docs", "Official sources"],
  ],
  faq: [],
  previous: {
    href: "/en/blog/screeps-tower-repair-threshold",
    label: "Previous defense guide",
    title: "Repair with Tower Reserves",
  },
  next: {
    href: "/en/blog/screeps-controller-downgrade",
    label: "Next Controller guide",
    title: "Prevent Controller Downgrade",
  },
  articleHtml: String.raw`
<p><code>StructureController.activateSafeMode()</code> is rare, limited and irreversible for the current activation charge. The difficult bug is not only an accidental retry on a later tick. Independent modules can call it for different rooms during the same tick, receive <code>OK</code>, and still leave only the final Controller intent scheduled.</p>
<p>A reliable workflow therefore needs one global submission point, exact request and Controller identity, a disable-before-call rule, and next-tick verification that does not confuse an accepted command with an observed activation.</p>

<h2 id="failure-mode">The failure mode: two OK results, one surviving intent</h2>
<p>This code looks cautious because it targets two explicit Controllers, but it is not safe:</p>
<pre><code class="language-javascript">const first = Game.rooms.W1N1.controller.activateSafeMode();
const second = Game.rooms.W2N2.controller.activateSafeMode();

console.log(JSON.stringify({ first, second }));</code></pre>
<p>In the official runtime, <code>activateSafeMode()</code> keeps a per-tick reference to the last Controller used. When another Controller is called later in the same tick, the runtime removes the earlier activation intent before setting the new one. Both calls can return <code>OK</code> because current Controller state has not settled yet, but only the last intent survives.</p>
<p>This is different from <code>ERR_BUSY</code>. <code>ERR_BUSY</code> reports a Safe Mode that is already active in another owned room on the shard. It does not protect two accepted calls made during the same script tick.</p>

<h2 id="engine-contract">What the runtime actually guarantees</h2>
<p>The current official implementation establishes these boundaries:</p>
<ul>
<li>The Controller must be owned and have at least one available activation.</li>
<li>Cooldown, upgrade blocking and a low downgrade timer can return <code>ERR_TIRED</code>.</li>
<li>An already active Safe Mode in any owned room on the shard returns <code>ERR_BUSY</code>.</li>
<li>A later same-tick activation removes the earlier activation intent.</li>
<li><code>OK</code> means the current call placed an intent; it does not prove that a later caller will not replace it.</li>
<li>When the surviving intent is processed, the exact Controller loses one activation and receives Safe Mode state.</li>
<li>The engine does not create a Room event that uniquely proves this action.</li>
</ul>
<p>The practical conclusion is strict: every module that may request Safe Mode must submit through the same coordinator. A direct call elsewhere can still replace the coordinator's chosen intent.</p>

<h2 id="request-identity">Bind approval to one exact Controller</h2>
<p>A room name alone is not enough for a high-impact request. Save a unique request ID, the reviewed room and the exact Controller object ID:</p>
<pre><code class="language-javascript">Memory.safeModeRequests ??= {};

Memory.safeModeRequests['W1N1-siege-20260804'] = {
  enabled: true,
  confirmed: true,
  roomName: 'W1N1',
  controllerId: '0123456789abcdef01234567',
  priority: 100,
  reason: 'spawn-and-storage-under-attack',
  requestedAt: Game.time
};</code></pre>
<p>The request fields are project controls, not official API arguments. The exact Controller ID prevents a stale room-level request from silently acting on a different object after ownership or room state changes. The reason is an audit note, not an automated threat classifier.</p>
<p>Do not let a broad condition such as “one hostile is visible” create this record. Safe Mode is documented as a defense tactic of last resort. Threat classification, diplomacy, Tower behavior, defender spawning and fortification health belong upstream.</p>

<h2 id="read-only-state">Inspect current Controller state</h2>
<p>Resolve the current object every tick instead of storing a live reference:</p>
<pre><code class="language-javascript">function inspectSafeModeRequest(request) {
  const room = typeof request?.roomName === 'string'
    ? Game.rooms[request.roomName]
    : null;
  const controller = typeof request?.controllerId === 'string'
    ? Game.getObjectById(request.controllerId)
    : null;

  return {
    roomVisible: Boolean(room),
    controllerFound: Boolean(controller),
    roomControllerId: room?.controller?.id ?? null,
    controllerId: controller?.id ?? null,
    controllerRoomName: controller?.pos.roomName ?? null,
    owned: controller?.my === true,
    level: controller?.level ?? null,
    safeMode: controller?.safeMode ?? 0,
    safeModeAvailable: controller?.safeModeAvailable ?? null,
    safeModeCooldown: controller?.safeModeCooldown ?? 0,
    upgradeBlocked: controller?.upgradeBlocked ?? 0,
    ticksToDowngrade: controller?.ticksToDowngrade ?? null
  };
}</code></pre>
<p>This function is read-only. It distinguishes a missing room, a missing object and a room whose current Controller no longer matches the approved ID.</p>

<h2 id="evaluate-request">Evaluate without submitting an intent</h2>
<p>The runtime's downgrade restriction is easy to miss. A Controller can have an activation available, no cooldown and no upgrade block, yet still return <code>ERR_TIRED</code> when <code>ticksToDowngrade</code> is below the official Safe Mode threshold.</p>
<pre><code class="language-javascript">function evaluateSafeModeRequest(request, state) {
  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (request.confirmed !== true) {
    return { ready: false, reason: 'confirmation-missing' };
  }

  if (
    typeof request.roomName !== 'string'
    || typeof request.controllerId !== 'string'
    || !Number.isInteger(request.priority)
  ) {
    return { ready: false, reason: 'request-invalid' };
  }

  if (!state.roomVisible || !state.controllerFound) {
    return { ready: false, reason: 'controller-unavailable' };
  }

  if (
    state.roomControllerId !== request.controllerId
    || state.controllerId !== request.controllerId
    || state.controllerRoomName !== request.roomName
  ) {
    return { ready: false, reason: 'controller-identity-mismatch' };
  }

  if (!state.owned || !Number.isInteger(state.level) || state.level <= 0) {
    return { ready: false, reason: 'controller-not-owned' };
  }

  if (state.safeMode > 0) {
    return { ready: false, reason: 'already-active' };
  }

  if (
    !Number.isInteger(state.safeModeAvailable)
    || state.safeModeAvailable <= 0
  ) {
    return { ready: false, reason: 'no-activation' };
  }

  if (state.safeModeCooldown > 0) {
    return { ready: false, reason: 'activation-cooldown' };
  }

  if (state.upgradeBlocked > 0) {
    return { ready: false, reason: 'upgrade-blocked' };
  }

  const minimumDowngradeTicks =
    CONTROLLER_DOWNGRADE[state.level] / 2
    - CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD;

  if (
    !Number.isFinite(state.ticksToDowngrade)
    || state.ticksToDowngrade < minimumDowngradeTicks
  ) {
    return { ready: false, reason: 'downgrade-threshold' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>This preflight mirrors visible restrictions, but the return code remains authoritative. Another room may already be in Safe Mode, and another module may alter state before the final call.</p>

<h2 id="one-dispatcher">Use one per-tick dispatcher</h2>
<p>Producers should enqueue requests. Only the main loop should finalize them after all defense modules have run:</p>
<pre><code class="language-javascript">let coordinatorTick = -1;
let candidates = [];
let finalized = false;

function resetSafeModeCoordinator() {
  if (coordinatorTick === Game.time) return;

  coordinatorTick = Game.time;
  candidates = [];
  finalized = false;
}

function enqueueSafeModeRequest(requestId) {
  resetSafeModeCoordinator();

  if (finalized) {
    return { accepted: false, reason: 'coordinator-finalized' };
  }

  const request = Memory.safeModeRequests?.[requestId];
  if (!request || request.enabled !== true) {
    return { accepted: false, reason: 'request-disabled' };
  }

  if (candidates.some(item => item.requestId === requestId)) {
    return { accepted: true, reason: 'already-enqueued' };
  }

  candidates.push({
    requestId,
    priority: request.priority,
    requestedAt: request.requestedAt
  });

  return { accepted: true, reason: 'enqueued' };
}

function chooseSafeModeCandidate() {
  return [...candidates]
    .sort((left, right) =>
      right.priority - left.priority
      || left.requestedAt - right.requestedAt
      || left.requestId.localeCompare(right.requestId)
    )[0] ?? null;
}</code></pre>
<p>The priority is explicit project policy. Stable request ID ordering makes equal inputs deterministic. The coordinator does not decide whether a room deserves Safe Mode; it only ensures that reviewed candidates compete in one place.</p>
<p>Each producer imports the same module and enqueues instead of calling the Controller:</p>
<pre><code class="language-javascript">const safeMode = require('safe-mode-coordinator');

function runDefenseEscalation(room) {
  const requestId = room.memory.safeModeRequestId;
  if (typeof requestId !== 'string') return;

  safeMode.enqueueSafeModeRequest(requestId);
}</code></pre>

<h2 id="final-submission">Disable first and save accepted identity</h2>
<p>The finalizer executes at most once for the tick:</p>
<pre><code class="language-javascript">function finalizeSafeModeRequests() {
  resetSafeModeCoordinator();

  if (finalized) {
    return { status: 'already-finalized' };
  }
  finalized = true;

  const candidate = chooseSafeModeCandidate();
  if (!candidate) {
    return { status: 'no-candidate' };
  }

  return submitSafeModeRequest(candidate.requestId);
}</code></pre>
<p>The submission function resolves the exact object again, evaluates current state, disables before the API call and creates pending evidence only after <code>OK</code>:</p>
<pre><code class="language-javascript">function submitSafeModeRequest(requestId) {
  const request = Memory.safeModeRequests?.[requestId];
  const state = inspectSafeModeRequest(request);
  const plan = evaluateSafeModeRequest(request, state);

  if (!request) {
    return { status: 'request-missing', requestId };
  }

  request.checkedAt = Game.time;
  request.status = plan.reason;

  if (!plan.ready) {
    request.enabled = false;
    return { status: plan.reason, requestId, state };
  }

  const controller = Game.getObjectById(request.controllerId);
  request.enabled = false;
  request.status = 'submitting';

  const result = controller.activateSafeMode();
  request.result = result;
  request.resultAt = Game.time;

  if (result !== OK) {
    request.status = 'rejected-review-required';
    return {
      status: request.status,
      requestId,
      controllerId: controller.id,
      result
    };
  }

  request.status = 'accepted-pending';
  Memory.safeModePending = {
    requestId,
    roomName: request.roomName,
    controllerId: controller.id,
    submittedAt: Game.time,
    before: {
      safeMode: controller.safeMode ?? 0,
      safeModeAvailable: controller.safeModeAvailable,
      safeModeCooldown: controller.safeModeCooldown ?? 0
    }
  };

  return {
    status: 'accepted-pending',
    requestId,
    controllerId: controller.id,
    result
  };
}</code></pre>
<p>Do not re-enable automatically after a rejection. A failed high-impact request needs a new review. Do not report <code>accepted-pending</code> as an activated Safe Mode.</p>
<p>Call the finalizer once, after every producer:</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  runAllRoomDefensePlanning();

  const outcome = finalizeSafeModeRequests();
  if (!['no-candidate', 'already-finalized'].includes(outcome.status)) {
    console.log(JSON.stringify({
      type: 'safe-mode-submission',
      tick: Game.time,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="next-tick-proof">Verify the exact Controller next tick</h2>
<p><code>activateSafeMode()</code> does not emit a unique Room event. The primary evidence is the exact saved Controller on the next tick: Safe Mode is active and one activation has been consumed.</p>
<pre><code class="language-javascript">function verifySafeModePending() {
  const pending = Memory.safeModePending;
  if (!pending) return { status: 'no-pending-operation' };

  const expectedTick = pending.submittedAt + 1;
  if (Game.time < expectedTick) {
    return { status: 'waiting-for-next-tick' };
  }

  const room = Game.rooms[pending.roomName];
  const controller = Game.getObjectById(pending.controllerId);

  if (!room || !controller) {
    return { status: 'controller-unavailable' };
  }

  if (room.controller?.id !== pending.controllerId) {
    return { status: 'controller-identity-mismatch' };
  }

  const safeModeTicks = controller.safeMode ?? 0;
  const expectedAvailable =
    pending.before.safeModeAvailable - 1;
  const activationObserved = safeModeTicks > 0;
  const chargeObserved =
    controller.safeModeAvailable === expectedAvailable;

  if (Game.time !== expectedTick) {
    return {
      status: 'late-observation',
      activationObserved,
      chargeObserved,
      safeModeTicks,
      safeModeAvailable: controller.safeModeAvailable
    };
  }

  if (activationObserved && chargeObserved) {
    const verified = {
      status: 'verified',
      requestId: pending.requestId,
      controllerId: pending.controllerId,
      verifiedAt: Game.time,
      safeModeTicks,
      safeModeAvailable: controller.safeModeAvailable,
      safeModeCooldown: controller.safeModeCooldown ?? 0
    };

    Memory.safeModeRequests[pending.requestId].status = 'verified';
    Memory.safeModeRequests[pending.requestId].verifiedAt = Game.time;
    delete Memory.safeModePending;
    return verified;
  }

  if (activationObserved && !chargeObserved) {
    return {
      status: 'activation-observed-charge-confounded',
      safeModeTicks,
      safeModeAvailable: controller.safeModeAvailable
    };
  }

  const otherActiveRooms = Object.values(Game.rooms)
    .filter(visibleRoom =>
      visibleRoom.controller?.my === true
      && (visibleRoom.controller.safeMode ?? 0) > 0
    )
    .map(visibleRoom => visibleRoom.name)
    .sort();

  return {
    status: otherActiveRooms.length > 0
      ? 'overwritten-or-conflicted'
      : 'not-observed',
    otherActiveRooms
  };
}</code></pre>
<p>The exact charge comparison assumes that no Creep calls <code>generateSafeMode()</code> on this Controller during the submission and verification window. If charge generation is allowed concurrently, an active Safe Mode can still be observed, but the activation-count delta is confounded and must not be reported as exact proof.</p>
<p>A late observation can describe current state, but it is weaker evidence for one specific accepted call. Keep the missed one-tick window visible instead of rewriting history.</p>

<h2 id="failure-states">Keep failure and ambiguity visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>What it establishes</th><th>Next action</th></tr></thead>
<tbody>
<tr><td><code>accepted-pending</code></td><td>The final coordinator call returned OK</td><td>Verify the exact Controller next tick</td></tr>
<tr><td><code>verified</code></td><td>Safe Mode is active and one charge was consumed on the exact Controller</td><td>Close the operation record</td></tr>
<tr><td><code>activation-observed-charge-confounded</code></td><td>Activation is visible but the charge delta is not exclusive</td><td>Review generateSafeMode or other state changes</td></tr>
<tr><td><code>overwritten-or-conflicted</code></td><td>The approved Controller did not activate while another owned room is active</td><td>Find direct or later same-tick callers</td></tr>
<tr><td><code>not-observed</code></td><td>The accepted intent did not produce the expected next-tick state</td><td>Preserve evidence and inspect the integration contract</td></tr>
<tr><td><code>late-observation</code></td><td>The exact verification window was missed</td><td>Report current state without claiming exact attribution</td></tr>
</tbody></table></div>

<h2 id="return-codes">Interpret activateSafeMode() return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning for this call</th><th>What to inspect</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>This call placed the current Safe Mode intent</td><td>Later same-tick callers and next-tick Controller state</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The exact Controller is not owned</td><td>Controller ID, room identity and ownership</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Another owned room on the shard already has active Safe Mode</td><td>Current owned Controller Safe Mode fields</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>No activation charge is available</td><td><code>safeModeAvailable</code></td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Cooldown, upgrade block or downgrade threshold prevents activation</td><td><code>safeModeCooldown</code>, <code>upgradeBlocked</code> and <code>ticksToDowngrade</code></td></tr>
</tbody></table></div>
<p>The same-tick replacement problem is not represented by a separate error code. That is why one shared final dispatcher is required.</p>

<h2 id="integration-contract">Integration contract for a real codebase</h2>
<ul>
<li>Only the coordinator module may call <code>activateSafeMode()</code>.</li>
<li>Every producer enqueues a reviewed request and never submits directly.</li>
<li>The main loop calls the finalizer once after all defense planning.</li>
<li>Each request binds a unique request ID, room name and Controller ID.</li>
<li>The request is disabled before the API call.</li>
<li>Pending state is created only after the real return code is <code>OK</code>.</li>
<li>The verifier runs before new requests are finalized on the next tick.</li>
<li><code>generateSafeMode()</code> is excluded from the exact charge-verification window or labeled as a confound.</li>
<li>A rejected, missed or ambiguous operation is preserved for review and never auto-retried.</li>
<li>Tests and logs distinguish accepted intent from observed activation.</li>
</ul>
<p>This contract prevents accidental competition inside code that follows it. It cannot stop a Console command or another module that bypasses the coordinator. Code search for direct <code>activateSafeMode()</code> calls is part of deployment review.</p>

<h2 id="scope">Scope and evidence still pending</h2>
<p>This guide covers one final Safe Mode activation per tick across owned rooms. It does not classify threats, select a room strategically, operate Towers, spawn defenders, repair Ramparts, generate activation charges or coordinate different shards. Continue with <a href="/en/blog/screeps-controller-downgrade">Controller downgrade recovery</a> for emergency upgrading and <a href="/en/blog/screeps-tower-auto-attack-hostiles">Tower attack identity</a> for active defense.</p>
<p>The coordinator, decision branches and verifier can be reviewed offline, but real Screeps Console execution and a live same-tick overwrite test remain Pending. No production combat outcome, charge consumption or player result is claimed without those observations.</p>

<h2 id="official-docs">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureController.activateSafeMode" rel="nofollow">API Reference: StructureController.activateSafeMode()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureController" rel="nofollow">API Reference: StructureController fields</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/structures.js" rel="nofollow">Official engine: runtime Controller method</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/intents/controllers/activateSafeMode.js" rel="nofollow">Official engine: activation intent processor</a></li>
<li><a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/intents/controllers/tick.js" rel="nofollow">Official engine: Controller state settlement</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
