import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishReserveClaimControllerArticle = {
  slug: "screeps-reserve-vs-claim-controller",
  path: "/en/blog/screeps-reserve-vs-claim-controller",
  chinesePath: "/blog/screeps-reserve-vs-claim-controller",
  title: "Screeps reserveController() vs claimController(): Safe Mission Rules",
  headline: "How to Choose Between Reserving and Claiming a Controller",
  description:
    "Separate renewable remote-room reservations from one-time room ownership, require an active CLAIM part and range 1, block owned Controllers and hostile reservations, require explicit claim confirmation and GCL capacity, save return codes, and stop a claim mission after OK.",
  category: "CONTROLLER · RESERVE OR CLAIM",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Reserve vs Claim",
  tags: ["Screeps", "Controller", "CLAIM", "Reservation", "Expansion"],
  keywords: [
    "Screeps reserveController vs claimController",
    "Screeps remote room reservation",
    "Screeps claim Controller GCL",
    "Screeps CLAIM body part",
    "Screeps Controller reservation ticksToEnd",
  ],
  primaryKeyword: "Screeps reserveController vs claimController",
  searchIntent: "Choose a renewable reservation or explicitly confirmed permanent room claim from current Controller and GCL evidence",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — reserveController(), claimController(), Controller owner and reservation fields, CLAIM parts, range, GCL and return codes"],
    ["Mission boundary", "Mission purpose, claim confirmation and hostile-reservation policy are project controls, not official strategic recommendations"],
    ["Execution boundary", "OK schedules the Controller action; owner, reservation, GCL and mission completion require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline mission review", "Passed — action, active CLAIM, Controller ownership, friendly or hostile reservation, GCL capacity, confirmation, range and completion states"],
    ["Screeps Console test", "Pending"],
    ["Live reservation renewal, 5,000-tick cap, GCL claim, hostile reservation and next-tick state test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["different-goals", "Reserve and claim solve different goals"],
    ["shared-requirements", "Check shared Controller mission requirements"],
    ["reservation", "Understand renewable reservation state"],
    ["claim-capacity", "Calculate room claim capacity"],
    ["hostile-reservation", "Stop on another player's reservation"],
    ["pure-plan", "Build a testable mission decision"],
    ["complete-example", "Complete Controller mission example"],
    ["completion", "Keep reserve renewable and claim one-time"],
    ["after-ok", "Verify the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does reserving a Controller use a GCL room slot?",
      "No. Reservation keeps the Controller neutral and temporary. A successful claim makes the room owned and counts toward your controllable-room capacity.",
    ],
    [
      "Why can a reserve mission remain enabled after OK?",
      "Reservation time decreases and normally needs renewal. The mission can keep evaluating current state and submitting reviewed reserve actions while the Creep remains assigned.",
    ],
    [
      "Why must a claim mission disable after OK?",
      "Claiming is a one-time ownership transition. Continuing to call claimController() after the Controller becomes yours is invalid and hides whether the mission actually completed.",
    ],
    [
      "Can this guide remove another player's reservation?",
      "No. It deliberately stops and records hostile-reservation evidence. Attack, waiting, diplomacy or abandoning the mission belong to a separate policy.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-controller-downgrade",
    label: "Previous Controller guide",
    title: "Prevent Controller Downgrade",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>reserveController()</code> when the mission is temporary remote-room access and ongoing renewal. Use <code>claimController()</code> only for reviewed permanent expansion. Both paths require a currently valid neutral Controller, an owned non-spawning Creep with an active <code>CLAIM</code> part, and range 1. Block another player's reservation. For claims, require an explicit confirmation and available GCL room capacity. Keep reserve missions renewable, but disable a claim mission after <code>OK</code> and verify ownership later.</p>

<h2 id="different-goals">Reserve and claim solve different goals</h2>
<div class="table-scroll"><table>
<thead><tr><th>Decision</th><th><code>reserveController()</code></th><th><code>claimController()</code></th></tr></thead>
<tbody>
<tr><td>Purpose</td><td>Temporary remote-room control benefits</td><td>Permanent owned-room expansion</td></tr>
<tr><td>Controller owner</td><td>Remains neutral</td><td>Becomes yours after success</td></tr>
<tr><td>GCL room capacity</td><td>Does not consume an owned-room slot</td><td>Requires available claim capacity</td></tr>
<tr><td>Lifecycle</td><td>Usually renewed over time</td><td>One-time ownership transition</td></tr>
<tr><td>Typical mission</td><td>Remote harvesting or temporary access</td><td>Build and operate a new owned room</td></tr>
</tbody></table></div>
<p>The API does not choose the strategic goal. Store the intended action explicitly instead of inferring it from a neutral Controller.</p>

<h2 id="shared-requirements">Check shared Controller mission requirements</h2>
<pre><code class="language-javascript">function inspectControllerMissionObjects(creep) {
  const controller = creep?.room?.controller || null;

  return {
    creepExists: Boolean(creep),
    creepOwned: creep?.my === true,
    creepSpawning: creep?.spawning === true,
    activeClaimParts: creep
      ? creep.getActiveBodyparts(CLAIM)
      : 0,
    controllerFound: Boolean(controller),
    controllerOwned: Boolean(controller?.owner),
    reservationUsername:
      controller?.reservation?.username ?? null,
    reservationTicks:
      controller?.reservation?.ticksToEnd ?? null,
    range: controller && creep
      ? creep.pos.getRangeTo(controller)
      : null
  };
}</code></pre>
<p>A CLAIM part present in the original body is not enough. Use <code>getActiveBodyparts(CLAIM)</code> because a destroyed part no longer provides the action.</p>

<h2 id="reservation">Understand renewable reservation state</h2>
<p>A successful reserve action adds reservation time according to active CLAIM capability, up to the official reservation limit. The current state is visible through the optional reservation object:</p>
<pre><code class="language-javascript">function readControllerReservation(controller) {
  const reservation = controller?.reservation;

  if (!reservation) {
    return {
      username: null,
      ticksToEnd: 0
    };
  }

  return {
    username: reservation.username,
    ticksToEnd: reservation.ticksToEnd
  };
}</code></pre>
<p>Do not copy <code>ticksToEnd</code> into Memory and decrement it as the source of truth. Re-read the Controller whenever the room is visible.</p>

<h2 id="claim-capacity">Calculate room claim capacity</h2>
<pre><code class="language-javascript">function getClaimCapacity() {
  const ownedRoomCount = Object.values(Game.rooms)
    .filter(room => room.controller?.my === true)
    .length;
  const gclLevel = Game.gcl.level;

  return {
    ownedRoomCount,
    gclLevel,
    available: Number.isInteger(gclLevel)
      ? Math.max(0, gclLevel - ownedRoomCount)
      : 0
  };
}</code></pre>
<p>Owned rooms provide normal visibility, so this is a practical account-level check. The method return code still decides whether the current claim is accepted.</p>

<h2 id="hostile-reservation">Stop on another player's reservation</h2>
<pre><code class="language-javascript">function hasHostileReservation(
  controller,
  creepUsername
) {
  const username =
    controller?.reservation?.username ?? null;

  return Boolean(
    username
    && username !== creepUsername
  );
}</code></pre>
<p>This guide does not automatically call <code>attackController()</code>, attack the player or wait indefinitely. It records the conflict and leaves the next decision to a separate mission policy.</p>

<h2 id="pure-plan">Build a testable mission decision</h2>
<pre><code class="language-javascript">function evaluateControllerMission(input) {
  if (input.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (!['reserve', 'claim'].includes(input.action)) {
    return { ready: false, reason: 'invalid-action' };
  }

  if (!input.creepOwned || input.creepSpawning) {
    return { ready: false, reason: 'creep-unavailable' };
  }

  if (
    !Number.isInteger(input.activeClaimParts)
    || input.activeClaimParts <= 0
  ) {
    return { ready: false, reason: 'no-active-claim-part' };
  }

  if (!input.controllerFound) {
    return { ready: false, reason: 'controller-missing' };
  }

  if (input.controllerOwned) {
    return { ready: false, reason: 'controller-owned' };
  }

  if (
    input.reservationUsername
    && input.reservationUsername !== input.creepUsername
  ) {
    return { ready: false, reason: 'hostile-reservation' };
  }

  if (input.action === 'claim') {
    if (input.claimConfirmed !== true) {
      return { ready: false, reason: 'claim-not-confirmed' };
    }

    if (
      !Number.isInteger(input.ownedRoomCount)
      || !Number.isInteger(input.gclLevel)
      || input.ownedRoomCount >= input.gclLevel
    ) {
      return { ready: false, reason: 'gcl-not-enough' };
    }
  }

  if (!Number.isInteger(input.range) || input.range > 1) {
    return { ready: false, reason: 'move-to-controller' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p><code>claimConfirmed</code> is a project safeguard. It prevents changing a remote reservation task into permanent expansion through one mistyped action value.</p>

<h2 id="complete-example">Complete Controller mission example</h2>
<p>Configure a renewable reservation:</p>
<pre><code class="language-javascript">Memory.controllerMissions ??= {};
Memory.controllerMissions.Claimer1 = {
  enabled: true,
  action: 'reserve',
  claimConfirmed: false
};</code></pre>
<p>Configure a reviewed permanent claim:</p>
<pre><code class="language-javascript">Memory.controllerMissions.Claimer1 = {
  enabled: true,
  action: 'claim',
  claimConfirmed: true
};</code></pre>
<pre><code class="language-javascript">function runControllerMission(creep) {
  const mission = Memory.controllerMissions?.[
    creep?.name
  ];

  if (!creep || !mission || mission.enabled !== true) {
    return { status: 'disabled-or-missing' };
  }

  const controller = creep.room.controller;
  const objects = inspectControllerMissionObjects(
    creep
  );
  const capacity = getClaimCapacity();
  const decision = evaluateControllerMission({
    enabled: mission.enabled,
    action: mission.action,
    claimConfirmed: mission.claimConfirmed,
    creepOwned: objects.creepOwned,
    creepSpawning: objects.creepSpawning,
    activeClaimParts: objects.activeClaimParts,
    controllerFound: objects.controllerFound,
    controllerOwned: objects.controllerOwned,
    reservationUsername:
      objects.reservationUsername,
    creepUsername: creep.owner.username,
    ownedRoomCount: capacity.ownedRoomCount,
    gclLevel: capacity.gclLevel,
    range: objects.range
  });

  mission.lastCheckedAt = Game.time;
  mission.lastStatus = decision.reason;
  mission.lastObserved = {
    roomName: creep.room.name,
    activeClaimParts: objects.activeClaimParts,
    controllerOwned: objects.controllerOwned,
    reservationUsername:
      objects.reservationUsername,
    reservationTicks: objects.reservationTicks,
    range: objects.range,
    ownedRoomCount: capacity.ownedRoomCount,
    gclLevel: capacity.gclLevel
  };

  if (decision.reason === 'move-to-controller') {
    const moveResult = creep.moveTo(controller, {
      range: 1,
      reusePath: 10
    });
    mission.lastMoveResult = moveResult;
    return {
      status: 'moving-to-controller',
      moveResult
    };
  }

  if (!decision.ready) {
    if (
      mission.action === 'claim'
      && [
        'controller-owned',
        'hostile-reservation',
        'claim-not-confirmed',
        'gcl-not-enough'
      ].includes(decision.reason)
    ) {
      mission.enabled = false;
    }

    return { status: decision.reason };
  }

  const before = {
    gameTick: Game.time,
    action: mission.action,
    roomName: creep.room.name,
    reservation: readControllerReservation(
      controller
    ),
    controllerOwner:
      controller.owner?.username ?? null,
    ownedRoomCount: capacity.ownedRoomCount,
    gclLevel: capacity.gclLevel
  };

  const result = mission.action === 'reserve'
    ? creep.reserveController(controller)
    : creep.claimController(controller);

  mission.lastBefore = before;
  mission.lastResult = result;
  mission.lastResultAt = Game.time;
  mission.lastStatus = result === OK
    ? 'action-scheduled'
    : 'action-rejected';

  if (result === OK && mission.action === 'claim') {
    mission.enabled = false;
    mission.completedAt = Game.time;
  }

  return {
    status: mission.lastStatus,
    action: mission.action,
    result,
    before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Claimer1;
  if (!creep) {
    return;
  }

  const outcome = runControllerMission(creep);
  if (
    outcome.status === 'action-rejected'
    || outcome.status === 'action-scheduled'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'controller-mission-status',
      creepName: creep.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="completion">Keep reserve renewable and claim one-time</h2>
<p>A reserve mission normally remains enabled after <code>OK</code> because reservation time continues to decrease. A claim mission disables immediately after <code>OK</code> so the next tick becomes verification rather than another ownership call.</p>
<pre><code class="language-javascript">if (result === OK && mission.action === 'claim') {
  mission.enabled = false;
  mission.completedAt = Game.time;
}</code></pre>

<h2 id="after-ok">Verify the next tick</h2>
<p>For a reserve mission, re-read <code>controller.reservation.username</code> and <code>ticksToEnd</code>. For a claim mission, verify <code>controller.my</code>, the owner username and the new owned-room count. Do not write predicted ownership into Memory.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Controller action scheduled</td><td>Verify reservation or owner later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Creep not yours</td><td>Current Creep object</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep still spawning</td><td>Wait</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Controller state is invalid</td><td>Owner and reservation</td></tr>
<tr><td><code>ERR_FULL</code></td><td>No claim capacity</td><td>GCL and owned rooms</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Not adjacent</td><td>Move to range 1</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active CLAIM part</td><td>Current body damage</td></tr>
<tr><td><code>ERR_GCL_NOT_ENOUGH</code></td><td>Claim exceeds account capacity</td><td>Current GCL and owned rooms</td></tr>
</tbody></table></div>
<p>Method-specific return lists may differ. Keep the actual result rather than forcing every Controller method into one generic table.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Store an explicit reserve or claim action.</li>
<li>Require a visible Controller.</li>
<li>Count active CLAIM parts.</li>
<li>Check current owner.</li>
<li>Check reservation username and time.</li>
<li>Stop on another player's reservation.</li>
<li>Require explicit claim confirmation.</li>
<li>Calculate current GCL capacity.</li>
<li>Move to range 1 only when needed.</li>
<li>Save the official return code.</li>
<li>Keep reserve renewable.</li>
<li>Disable claim after OK and verify later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not attack a hostile reservation, spawn a Claimer, route across rooms, score expansion locations, build a new Spawn, sign the Controller or coordinate multiple claims. Return to the <a href="/en/blog">English article library</a> for movement and room-control foundations.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why not choose claim automatically when GCL is available?</h3>
<p>Capacity does not prove strategic intent. Permanent expansion needs explicit confirmation, economy readiness and room selection outside this execution guide.</p>
<h3>Can my own reservation block my claim?</h3>
<p>The planner accepts a reservation owned by the current Creep's username. The official claim result still decides whether the current Controller state is valid.</p>
<h3>Why disable some rejected claim states?</h3>
<p>Ownership, hostile reservation, missing confirmation and insufficient GCL require review. Repeating them each tick does not improve the state and can hide the actual blocker.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.reserveController" rel="nofollow">API Reference: reserveController()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.claimController" rel="nofollow">API Reference: claimController()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureController" rel="nofollow">API Reference: StructureController</a></li>
<li><a href="https://docs.screeps.com/api/#Game.gcl" rel="nofollow">API Reference: Game.gcl</a></li>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow">Screeps Documentation: Control</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
