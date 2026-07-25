import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishControllerSafeModeArticle = {
  slug: "screeps-controller-activate-safe-mode",
  path: "/en/blog/screeps-controller-activate-safe-mode",
  chinesePath: "/blog/screeps-controller-activate-safe-mode",
  title: "Screeps Safe Mode: One-Time Activation with Controller Checks",
  headline: "How to Activate Safe Mode Without Accidental Repeated Use",
  description:
    "Use an explicit one-time Memory request, confirmation phrase, owned Controller checks, safeMode, safeModeAvailable, safeModeCooldown and upgradeBlocked preflight, disable before activateSafeMode(), save the return code, and verify later state.",
  category: "CONTROLLER · SAFE MODE ACTIVATION",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Safe Mode",
  tags: ["Screeps", "Controller", "Safe Mode", "Defense", "Operational Safety"],
  keywords: [
    "Screeps activateSafeMode",
    "Screeps safeModeAvailable",
    "Screeps safeModeCooldown",
    "Screeps Controller ERR_BUSY",
    "Screeps Safe Mode request",
  ],
  primaryKeyword: "Screeps activateSafeMode",
  searchIntent: "Activate Safe Mode once with explicit confirmation and current Controller evidence",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — activateSafeMode(), safeMode, safeModeAvailable, safeModeCooldown, upgradeBlocked and return codes"],
    ["Trigger boundary", "Threat detection and the confirmation phrase are project controls; they do not prove activation is strategically correct"],
    ["Execution boundary", "OK schedules activation; Safe Mode duration and available activation changes require later Controller observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline state review", "Passed — visibility, ownership, active state, activation count, cooldown, upgrade block, confirmation and one-time request states"],
    ["Screeps Console test", "Pending"],
    ["Live activation, same-shard busy state, charge consumption and next-tick Controller test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["last-resort", "Treat Safe Mode as a reviewed defense action"],
    ["read-state", "Read Controller state without changing it"],
    ["request", "Create an explicit one-time request"],
    ["pure-plan", "Build a testable activation plan"],
    ["complete-example", "Complete Safe Mode request handler"],
    ["disable-first", "Disable the request before the API call"],
    ["other-rooms", "Understand the same-shard busy state"],
    ["after-ok", "Verify the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Should Safe Mode activate whenever a hostile Creep appears?",
      "No. A scout, visitor and structure-threatening attack are different events. Threat classification belongs to a separate reviewed defense policy.",
    ],
    [
      "Why disable the request before activateSafeMode()?",
      "Safe Mode consumes a limited activation. Disabling first prevents an exception or failed review path from turning into an automatic later retry.",
    ],
    [
      "What does ERR_BUSY mean here?",
      "For this method it indicates that another room on the same shard is already in Safe Mode, not that this Controller is performing a normal task.",
    ],
    [
      "Does OK mean Safe Mode can be read immediately?",
      "It means the operation was scheduled. Re-read the Controller on a later tick before reporting the new state as observed.",
    ],
  ],
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
<h2 id="quick-answer">Quick answer</h2>
<p>Do not call <code>activateSafeMode()</code> directly from a broad hostile check. Create a one-time request containing the exact room and confirmation phrase, require a visible owned Controller, no active Safe Mode, at least one available activation, no cooldown and no upgrade block, save the before state, set <code>request.enabled = false</code>, call the API once, store the return code, and verify the Controller on a later tick.</p>

<h2 id="last-resort">Treat Safe Mode as a reviewed defense action</h2>
<p>Safe Mode is an important protection mechanism, but it does not select Tower targets, repair defenses, remove hostiles or fix room layout. It also consumes a limited activation. The trigger must therefore be separated from simple visibility of a non-owned Creep.</p>
<pre><code class="language-javascript">function shouldRequestSafeMode(input) {
  return Boolean(
    input.criticalStructureThreatened
    && input.defenseResponseUnavailable
    && input.playerApproved
  );
}</code></pre>
<p>These inputs are project policy, not official API facts. This article begins only after the decision to request activation has already been reviewed.</p>

<h2 id="read-state">Read Controller state without changing it</h2>
<pre><code class="language-javascript">function inspectSafeModeState(roomName) {
  const room = typeof roomName === 'string'
    ? Game.rooms[roomName]
    : null;
  const controller = room?.controller || null;

  if (!controller) {
    return {
      roomVisible: Boolean(room),
      controllerFound: false
    };
  }

  return {
    roomVisible: true,
    controllerFound: true,
    roomName: room.name,
    owned: controller.my === true,
    safeMode: controller.safeMode ?? null,
    safeModeAvailable:
      controller.safeModeAvailable ?? null,
    safeModeCooldown:
      controller.safeModeCooldown ?? null,
    upgradeBlocked:
      controller.upgradeBlocked ?? null,
    ticksToDowngrade:
      controller.ticksToDowngrade ?? null
  };
}</code></pre>
<p>This is a read-only Console-safe inspection. It reduces obvious mistakes but cannot replace the method's official return code.</p>

<h2 id="request">Create an explicit one-time request</h2>
<pre><code class="language-javascript">Memory.safeModeRequest = {
  enabled: true,
  roomName: 'W1N1',
  confirmation: 'ACTIVATE_SAFE_MODE'
};</code></pre>
<p>The Memory field and phrase are project controls. The phrase prevents an accidental boolean toggle from becoming a real activation, but it does not prove the room strategy is correct.</p>

<h2 id="pure-plan">Build a testable activation plan</h2>
<pre><code class="language-javascript">function evaluateSafeModeActivation(input) {
  if (input.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (input.confirmation !== 'ACTIVATE_SAFE_MODE') {
    return { ready: false, reason: 'confirmation-missing' };
  }

  if (!input.roomVisible || !input.controllerFound) {
    return { ready: false, reason: 'controller-missing' };
  }

  if (!input.owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (Number.isFinite(input.safeMode) && input.safeMode > 0) {
    return { ready: false, reason: 'already-active' };
  }

  if (
    !Number.isInteger(input.safeModeAvailable)
    || input.safeModeAvailable <= 0
  ) {
    return { ready: false, reason: 'no-activation' };
  }

  if (
    Number.isFinite(input.safeModeCooldown)
    && input.safeModeCooldown > 0
  ) {
    return { ready: false, reason: 'activation-cooldown' };
  }

  if (
    Number.isFinite(input.upgradeBlocked)
    && input.upgradeBlocked > 0
  ) {
    return { ready: false, reason: 'upgrade-blocked' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>Other official restrictions can still reject the operation. In particular, same-shard room state is finalized by <code>ERR_BUSY</code>.</p>

<h2 id="complete-example">Complete Safe Mode request handler</h2>
<pre><code class="language-javascript">function handleSafeModeRequest() {
  const request = Memory.safeModeRequest;
  if (!request || request.enabled !== true) {
    return { status: 'disabled' };
  }

  const state = inspectSafeModeState(request.roomName);
  const plan = evaluateSafeModeActivation({
    enabled: request.enabled,
    confirmation: request.confirmation,
    ...state
  });

  request.checkedAt = Game.time;
  request.before = state;
  request.status = plan.reason;

  if (!plan.ready) {
    request.enabled = false;
    return { status: plan.reason, state };
  }

  const room = Game.rooms[request.roomName];
  const controller = room.controller;

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;

  const result = controller.activateSafeMode();
  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  return {
    status: request.status,
    roomName: room.name,
    result,
    before: state
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const outcome = handleSafeModeRequest();

  if (
    outcome.status === 'failed-review-required'
    || outcome.status === 'accepted'
  ) {
    console.log(JSON.stringify({
      type: 'safe-mode-request-result',
      ...outcome
    }));
  }
};</code></pre>

<h2 id="disable-first">Disable the request before the API call</h2>
<pre><code class="language-javascript">request.enabled = false;
const result = controller.activateSafeMode();</code></pre>
<p>If the API rejects the call or later code throws, the next tick will not automatically consume an activation after conditions change. Preserve the request object as evidence and require a new reviewed enable action.</p>

<h2 id="other-rooms">Understand the same-shard busy state</h2>
<pre><code class="language-javascript">function getVisibleActiveSafeModeRooms() {
  return Object.values(Game.rooms)
    .filter(room =>
      room.controller?.my === true
      && Number.isFinite(room.controller.safeMode)
      && room.controller.safeMode > 0
    )
    .map(room => room.name)
    .sort();
}</code></pre>
<p>This diagnostic lists currently visible owned rooms. The API return code remains authoritative for the shard-wide activation restriction.</p>

<h2 id="after-ok">Verify the next tick</h2>
<p>Re-read <code>controller.safeMode</code> and <code>controller.safeModeAvailable</code>, and compare them with the saved before snapshot. Do not replace the observed fields with predicted values in Memory.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning here</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Activation scheduled</td><td>Controller state later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Controller not yours</td><td>Room and ownership</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Another same-shard room is active</td><td>Owned room Safe Mode state</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>No activation available</td><td><code>safeModeAvailable</code></td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Cooldown, block or Controller restriction</td><td>Current Controller fields and docs</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Separate threat classification from activation.</li>
<li>Require exact room and confirmation.</li>
<li>Inspect the visible owned Controller.</li>
<li>Check current Safe Mode.</li>
<li>Check available activations.</li>
<li>Check cooldown and upgrade block.</li>
<li>Save the before snapshot.</li>
<li>Disable before calling.</li>
<li>Store the official return code.</li>
<li>Verify Controller state later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not decide threat severity, run Towers, repair Ramparts, spawn defenders, generate Safe Mode charges or coordinate rooms across shards. Continue with <a href="/en/blog/screeps-controller-downgrade">Controller downgrade recovery</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why keep a failed request instead of deleting it?</h3>
<p>It preserves the room, tick, before state and return code for review before a human explicitly retries.</p>
<h3>Can a precheck guarantee activation?</h3>
<p>No. It removes obvious invalid states; the current official return code is the final same-tick result.</p>
<h3>Is the confirmation phrase secure authorization?</h3>
<p>No. It is only an operational guard inside your Memory workflow.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureController" rel="nofollow">API Reference: StructureController</a></li>
<li><a href="https://docs.screeps.com/api/#StructureController.activateSafeMode" rel="nofollow">API Reference: activateSafeMode()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
