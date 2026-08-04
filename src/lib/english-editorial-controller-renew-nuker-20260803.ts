import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishReserveClaimControllerArticle } from "./english-reserve-claim-controller-14";
import { englishLifecycleBatchFourArticles } from "./english-lifecycle-content-4-published";
import { englishNukerLaunchArticle } from "./english-nuker-launch-17";

const renewSource = englishLifecycleBatchFourArticles.find(
  (article) => article.slug === "screeps-renew-creep",
);

if (!renewSource) {
  throw new Error("Published renewCreep article is missing");
}

const reserveClaimArticle: EnglishBeginnerArticle = {
  ...englishReserveClaimControllerArticle,
  title: "Screeps reserveController() vs claimController(): Verify the Exact Mission",
  headline: "Reserve or Claim a Controller Without Losing Mission Identity",
  description:
    "Bind the Claimer and Controller IDs, record only accepted reserve or claim calls, verify reserve events without inventing a targetId, and verify claims through exact next-tick ownership.",
  category: "CONTROLLER · RESERVE AND CLAIM IDENTITY",
  updatedAt: "2026-08-03",
  readingTime: "22 min read",
  primaryKeyword: "Screeps reserveController vs claimController verification",
  searchIntent:
    "Choose, submit, and verify one exact reserve or claim Controller mission without confusing an accepted call with completed state",
  finalScore: 98,
  keywords: [
    "Screeps reserveController vs claimController verification",
    "Screeps EVENT_RESERVE_CONTROLLER",
    "Screeps claimController next tick",
    "Screeps Controller mission identity",
    "Screeps remote reservation evidence",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — reserveController emits EVENT_RESERVE_CONTROLLER for the acting Creep and amount, without a Controller targetId"],
    ["Claim boundary", "Checked — claimController changes the exact Controller owner and room ownership but does not emit a Room event"],
    ["Static code review", "Passed — exact Claimer, Controller, room, action, confirmation, accepted-call and next-tick verification states"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live reserve event, claim ownership, hostile reservation and missed-window verification", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["operation-contract", "Separate mission choice from operation proof"],
    ["resolve-identity", "Resolve the exact Claimer and Controller"],
    ["decision", "Evaluate reserve and claim rules"],
    ["submit", "Record only an accepted Controller action"],
    ["verify-reserve", "Verify reservation through the exact event"],
    ["verify-claim", "Verify claiming through exact ownership"],
    ["failure-states", "Keep incomplete evidence visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="operation-contract">Separate mission choice from operation proof</h2>
<p><code>reserveController()</code> and <code>claimController()</code> solve different strategic goals, but both need the same operational discipline. The mission must identify one Creep, one Controller and one action before submission. An <code>OK</code> return value means the current intent was accepted; it does not by itself prove the next processed state.</p>
<div class="table-scroll"><table>
<thead><tr><th>Action</th><th>Game-state result</th><th>Strongest next-tick evidence</th></tr></thead>
<tbody>
<tr><td><code>reserveController()</code></td><td>The Controller remains neutral and its reservation time increases</td><td>The exact Claimer's <code>EVENT_RESERVE_CONTROLLER</code> plus the exact room Controller's reservation state</td></tr>
<tr><td><code>claimController()</code></td><td>The exact neutral Controller becomes owned at level 1</td><td>The exact Controller ID reports your username and <code>my === true</code></td></tr>
</tbody></table></div>
<p>The official engine records a reserve event with the acting Creep as <code>objectId</code> and the added reservation amount. That event does not include a Controller <code>targetId</code>. A claim produces no Room event, so do not invent one.</p>

<h2 id="resolve-identity">Resolve the exact Claimer and Controller</h2>
<pre><code class="language-javascript">function resolveControllerMission(creep, mission) {
  if (!creep || creep.my !== true || creep.spawning === true) {
    return { ready: false, status: 'claimer-unavailable' };
  }

  if (creep.getActiveBodyparts(CLAIM) &lt;= 0) {
    return { ready: false, status: 'no-active-claim-part' };
  }

  const controller = creep.room.controller || null;
  if (!controller) {
    return { ready: false, status: 'controller-missing' };
  }

  if (
    mission.roomName !== creep.room.name
    || mission.controllerId !== controller.id
  ) {
    return {
      ready: false,
      status: 'mission-identity-mismatch',
      observedControllerId: controller.id
    };
  }

  return { ready: true, status: 'identity-ready', controller };
}</code></pre>
<p>Store the Controller ID after the room is scouted and reviewed. Do not accept whichever Controller happens to be visible when a mission runs. The room name is useful for routing, while the ID prevents a stale or corrupted mission from silently targeting another object.</p>

<h2 id="decision">Evaluate reserve and claim rules</h2>
<pre><code class="language-javascript">function countOwnedRooms() {
  return Object.values(Game.rooms)
    .filter(room =&gt; room.controller?.my === true)
    .length;
}

function evaluateControllerAction(creep, controller, mission) {
  if (!['reserve', 'claim'].includes(mission.action)) {
    return { ready: false, status: 'invalid-action' };
  }

  if (controller.owner) {
    return { ready: false, status: 'controller-already-owned' };
  }

  const username = creep.owner.username;
  const reservationUsername =
    controller.reservation?.username ?? null;

  if (
    reservationUsername
    &amp;&amp; reservationUsername !== username
  ) {
    return { ready: false, status: 'hostile-reservation' };
  }

  if (mission.action === 'claim') {
    const expectedConfirmation =
      'CLAIM_' + controller.pos.roomName + '_' + controller.id;

    if (mission.confirmation !== expectedConfirmation) {
      return { ready: false, status: 'claim-confirmation-mismatch' };
    }

    if (countOwnedRooms() &gt;= Game.gcl.level) {
      return { ready: false, status: 'gcl-capacity-unavailable' };
    }
  }

  if (!creep.pos.inRangeTo(controller, 1)) {
    return { ready: false, status: 'move-to-controller' };
  }

  return { ready: true, status: 'action-ready' };
}</code></pre>
<p>The confirmation string is a project safeguard, not an API requirement. It binds a permanent claim to the reviewed room and Controller ID. Reservation remains renewable; claiming is a one-time ownership transition.</p>

<h2 id="submit">Record only an accepted Controller action</h2>
<pre><code class="language-javascript">function submitControllerMission(creep) {
  const mission = Memory.controllerMissions?.[creep?.name];
  if (!mission || mission.enabled !== true) {
    return { status: 'mission-disabled' };
  }

  const resolved = resolveControllerMission(creep, mission);
  if (!resolved.ready) return resolved;

  const controller = resolved.controller;
  const decision = evaluateControllerAction(
    creep,
    controller,
    mission
  );

  if (decision.status === 'move-to-controller') {
    return {
      status: 'moving',
      moveResult: creep.moveTo(controller, {
        range: 1,
        reusePath: 10
      })
    };
  }
  if (!decision.ready) return decision;

  Memory.pendingControllerOperations ??= {};
  const existing =
    Memory.pendingControllerOperations[creep.name];

  if (existing &amp;&amp; existing.submittedAt &gt;= Game.time - 1) {
    return { status: 'pending-verification' };
  }

  const before = {
    ownerUsername: controller.owner?.username ?? null,
    reservationUsername:
      controller.reservation?.username ?? null,
    reservationTicks:
      controller.reservation?.ticksToEnd ?? 0,
    ownedRoomCount: countOwnedRooms()
  };

  const result = mission.action === 'reserve'
    ? creep.reserveController(controller)
    : creep.claimController(controller);

  mission.lastResult = result;
  mission.lastResultAt = Game.time;

  if (result !== OK) {
    return {
      status: 'controller-action-rejected',
      action: mission.action,
      result
    };
  }

  Memory.pendingControllerOperations[creep.name] = {
    submittedAt: Game.time,
    action: mission.action,
    creepId: creep.id,
    creepName: creep.name,
    username: creep.owner.username,
    roomName: creep.room.name,
    controllerId: controller.id,
    before
  };

  mission.lastStatus = 'accepted-awaiting-verification';

  if (mission.action === 'claim') {
    mission.enabled = false;
    mission.completion = 'pending-owner-verification';
  }

  return {
    status: 'controller-action-accepted',
    action: mission.action,
    result,
    controllerId: controller.id
  };
}</code></pre>
<p>Disabling an accepted claim prevents another call, but it must not be labeled completed until ownership is observed. A reserve mission can remain enabled, although the pending record blocks another submission until the one-tick evidence window is consumed.</p>

<h2 id="verify-reserve">Verify reservation through the exact event</h2>
<pre><code class="language-javascript">function verifyReserveOperation(pending) {
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'reserve-event-window-missed' };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) return { status: 'room-not-visible' };

  const controller = room.controller;
  if (!controller || controller.id !== pending.controllerId) {
    return { status: 'controller-identity-mismatch' };
  }

  const matches = room.getEventLog().filter(event =&gt;
    event.event === EVENT_RESERVE_CONTROLLER
    &amp;&amp; event.objectId === pending.creepId
  );

  if (matches.length === 0) {
    return { status: 'accepted-reserve-event-missing' };
  }
  if (matches.length &gt; 1) {
    return {
      status: 'reserve-event-ambiguous',
      count: matches.length
    };
  }

  const reservation = controller.reservation;
  const usernameMatches =
    reservation?.username === pending.username;

  return {
    status: usernameMatches
      ? 'reserve-event-and-state-observed'
      : 'reserve-event-state-mismatch',
    amount: matches[0].data?.amount ?? null,
    controllerId: controller.id,
    reservationUsername:
      reservation?.username ?? null,
    reservationTicks:
      reservation?.ticksToEnd ?? 0,
    beforeTicks: pending.before.reservationTicks
  };
}</code></pre>
<p>The event identifies the Claimer, not the Controller target. The verifier therefore combines three facts: it reads the event from the pending room, confirms that room's Controller ID, and checks the reservation username. The event amount is operation output; a current <code>ticksToEnd</code> value is processed state and should not be forced to equal a simple before-plus-amount calculation.</p>

<h2 id="verify-claim">Verify claiming through exact ownership</h2>
<pre><code class="language-javascript">function verifyClaimOperation(pending) {
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) return { status: 'claimed-room-not-visible' };

  const controller = room.controller;
  if (!controller || controller.id !== pending.controllerId) {
    return { status: 'controller-identity-mismatch' };
  }

  const ownerMatches =
    controller.owner?.username === pending.username;

  return {
    status: ownerMatches &amp;&amp; controller.my === true
      ? 'claim-owner-observed'
      : 'accepted-claim-owner-not-observed',
    controllerId: controller.id,
    ownerUsername: controller.owner?.username ?? null,
    controllerMy: controller.my === true,
    controllerLevel: controller.level,
    ownedRoomCountNow: countOwnedRooms(),
    ownedRoomCountBefore:
      pending.before.ownedRoomCount
  };
}

function verifyPendingControllerOperation(pending) {
  if (!pending) return { status: 'no-pending-operation' };

  return pending.action === 'reserve'
    ? verifyReserveOperation(pending)
    : verifyClaimOperation(pending);
}</code></pre>
<p><code>claimController()</code> has no Room event in the official engine. Exact ownership on the saved Controller is therefore the primary evidence. The account's owned-room count is corroboration only; another room could be claimed or lost during the same period.</p>

<h2 id="failure-states">Keep incomplete evidence visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>mission-identity-mismatch</code></td><td>The visible Controller is not the reviewed object</td><td>Stop and repair mission data</td></tr>
<tr><td><code>hostile-reservation</code></td><td>Another username owns the reservation</td><td>Do not auto-attack or auto-claim</td></tr>
<tr><td><code>accepted-reserve-event-missing</code></td><td>An accepted reserve lacks the exact Claimer event</td><td>Preserve the discrepancy</td></tr>
<tr><td><code>reserve-event-window-missed</code></td><td>The one-tick Room event window was not read</td><td>Record the missed sample</td></tr>
<tr><td><code>accepted-claim-owner-not-observed</code></td><td>The accepted claim did not produce exact ownership evidence</td><td>Keep the mission disabled for review</td></tr>
<tr><td><code>claimed-room-not-visible</code></td><td>The expected owned room is not currently visible</td><td>Do not infer completion from GCL alone</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Run one Controller mission dispatcher before role code can submit another Controller action. Consume pending verification before allowing a new reserve call, and keep accepted claims disabled until exact ownership is observed. Console execution, live hostile-reservation behavior, shard-specific timing and genuine screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>Creep.reserveController()</code>, <code>Creep.claimController()</code>, <code>Room.getEventLog()</code>, <code>EVENT_RESERVE_CONTROLLER</code>, Controller ownership and reservation fields, GCL, range and return codes before adapting the examples.</p>
`,
};

const renewArticle: EnglishBeginnerArticle = {
  ...renewSource,
  title: "Screeps renewCreep(): Coordinate Spawn Time and Verify TTL Gain",
  headline: "Renew a Creep Without Hiding Spawn Contention or Boost Loss",
  description:
    "Reserve one Spawn and Creep per tick, record only accepted renewCreep calls, verify the exact TTL and Boost signature on the next tick, and label Energy-transfer confounds.",
  category: "CREEP LIFECYCLE · RENEWAL IDENTITY",
  updatedAt: "2026-08-03",
  readingTime: "22 min read",
  primaryKeyword: "Screeps renewCreep verification",
  searchIntent:
    "Coordinate one exact Creep renewal and distinguish accepted intent, observed TTL gain, Spawn Energy changes, Boost removal, and contention",
  finalScore: 98,
  keywords: [
    "Screeps renewCreep verification",
    "Screeps renewCreep TTL formula",
    "Screeps Spawn renewal coordinator",
    "Screeps renewCreep removes boosts",
    "Screeps Spawn Energy confound",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — renewCreep updates the exact Creep lifetime, charges the exact Spawn, removes every Boost, rejects any CLAIM body part and emits no Room event"],
    ["Formula boundary", "Checked — planned TTL floor(600 / body size) and Energy ceil(body cost / 2.5 / body size)"],
    ["Static code review", "Passed — one dispatcher, exact Spawn and Creep identity, accepted-call pending state, next-tick TTL signature and transfer-confound labels"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live renewal, Boost removal, dual-Spawn contention and Energy-transfer verification", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["evidence-contract", "Start with the missing event"],
    ["plan-step", "Calculate one renewal step"],
    ["preflight", "Reject unsafe or ineligible renewals"],
    ["coordinate", "Reserve both the Spawn and Creep"],
    ["submit", "Record only an accepted renewal"],
    ["verify", "Verify the next-tick local signature"],
    ["state-machine", "Keep renewal state until verified"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Start with the missing event</h2>
<p><code>renewCreep()</code> does not create a Room event in the official engine. A reliable diagnostic must therefore save the exact Spawn ID, Creep ID, pre-action TTL, expected renewal step, Spawn Energy and Boost signature only after the method returns <code>OK</code>. The next tick can then compare the same objects.</p>
<p>Do not treat a rising TTL as sufficient identity by itself. Two adjacent Spawns, duplicate schedulers or a stale renewal flag can submit competing actions unless both the Spawn and the Creep are reserved by one dispatcher.</p>

<h2 id="plan-step">Calculate one renewal step</h2>
<pre><code class="language-javascript">function calculateRenewStep(creep) {
  if (!creep || !Array.isArray(creep.body)) {
    return null;
  }

  const bodySize = creep.body.length;
  if (bodySize &lt;= 0) return null;

  const bodyCost = creep.body.reduce(
    (total, part) =&gt;
      total + (BODYPART_COST[part.type] || 0),
    0
  );

  return {
    bodySize,
    bodyCost,
    addedTicks: Math.floor(600 / bodySize),
    energyCost: Math.ceil(
      bodyCost / 2.5 / bodySize
    )
  };
}</code></pre>
<p>The formulas are planning inputs. The actual call may still be rejected because the Spawn is busy, the Creep is ineligible, the Creep is not adjacent, Energy is unavailable, or the maximum lifetime boundary would be exceeded.</p>

<h2 id="preflight">Reject unsafe or ineligible renewals</h2>
<pre><code class="language-javascript">function evaluateRenewal(spawn, creep, policy) {
  if (!spawn || !creep) {
    return { ready: false, status: 'object-missing' };
  }
  if (spawn.my !== true || creep.my !== true) {
    return { ready: false, status: 'ownership-invalid' };
  }
  if (
    spawn.isActive() !== true
    || spawn.spawning
    || creep.spawning === true
  ) {
    return { ready: false, status: 'spawn-or-creep-busy' };
  }

  const step = calculateRenewStep(creep);
  if (!step) {
    return { ready: false, status: 'renew-step-invalid' };
  }

  if (creep.body.some(part =&gt; part.type === CLAIM)) {
    return { ready: false, status: 'claim-part-present' };
  }

  const boosts = creep.body
    .map((part, index) =&gt; ({
      index,
      boost: part.boost || null
    }))
    .filter(item =&gt; item.boost);

  if (
    boosts.length &gt; 0
    &amp;&amp; policy.allowBoostRemoval !== true
  ) {
    return {
      ready: false,
      status: 'boost-removal-not-confirmed',
      boosts
    };
  }

  if (!spawn.pos.isNearTo(creep)) {
    return { ready: false, status: 'move-to-spawn' };
  }

  if (
    spawn.store.getUsedCapacity(RESOURCE_ENERGY)
    &lt; step.energyCost
  ) {
    return {
      ready: false,
      status: 'spawn-energy-not-enough',
      required: step.energyCost
    };
  }

  if (
    creep.ticksToLive + step.addedTicks
    &gt; CREEP_LIFE_TIME
  ) {
    return { ready: false, status: 'lifetime-ceiling' };
  }

  return { ready: true, status: 'renew-ready', step, boosts };
}</code></pre>
<p>The engine rejects a Creep containing any <code>CLAIM</code> body part, not only an active one. Renewal also removes every Boost and recalculates body capacity, which can force resources out of the Creep. Approval for Boost removal must be explicit.</p>

<h2 id="coordinate">Reserve both the Spawn and Creep</h2>
<pre><code class="language-javascript">function createRenewalDispatcher() {
  const usedSpawnIds = new Set();
  const usedCreepIds = new Set();

  return {
    reserve(spawn, creep) {
      if (usedSpawnIds.has(spawn.id)) {
        return { ready: false, status: 'spawn-already-used' };
      }
      if (usedCreepIds.has(creep.id)) {
        return { ready: false, status: 'creep-already-used' };
      }

      usedSpawnIds.add(spawn.id);
      usedCreepIds.add(creep.id);
      return { ready: true, status: 'renewal-reserved' };
    },
    release(spawn, creep) {
      usedSpawnIds.delete(spawn.id);
      usedCreepIds.delete(creep.id);
    }
  };
}</code></pre>
<p>A Spawn can receive several apparently valid method calls during one JavaScript tick because intents are processed later. Route spawning and renewal through the same higher-level scheduler, or this local reservation cannot protect against another module.</p>

<h2 id="submit">Record only an accepted renewal</h2>
<pre><code class="language-javascript">function submitRenewal(
  dispatcher,
  spawn,
  creep,
  policy
) {
  const decision = evaluateRenewal(
    spawn,
    creep,
    policy
  );
  if (!decision.ready) return decision;

  const reservation = dispatcher.reserve(spawn, creep);
  if (!reservation.ready) return reservation;

  Memory.pendingRenewals ??= {};
  if (Memory.pendingRenewals[creep.id]) {
    dispatcher.release(spawn, creep);
    return { status: 'pending-renewal-exists' };
  }

  const before = {
    ticksToLive: creep.ticksToLive,
    spawnEnergy:
      spawn.store.getUsedCapacity(RESOURCE_ENERGY),
    boosts: decision.boosts
  };

  const result = spawn.renewCreep(creep);
  if (result !== OK) {
    dispatcher.release(spawn, creep);
    return {
      status: 'renewal-rejected',
      result
    };
  }

  Memory.pendingRenewals[creep.id] = {
    submittedAt: Game.time,
    spawnId: spawn.id,
    spawnRoomName: spawn.room.name,
    creepId: creep.id,
    creepName: creep.name,
    expectedAddedTicks:
      decision.step.addedTicks,
    expectedEnergyCost:
      decision.step.energyCost,
    before
  };

  creep.memory.renewing = true;

  return {
    status: 'renewal-accepted',
    result,
    spawnId: spawn.id,
    creepId: creep.id
  };
}</code></pre>
<p>A pending record is created only after <code>OK</code>. Movement, failed preflight and rejected actions are not renewal evidence. The persistent <code>renewing</code> flag describes mission state; it does not prove a particular call succeeded.</p>

<h2 id="verify">Verify the next-tick local signature</h2>
<pre><code class="language-javascript">function verifyRenewal(pending) {
  if (!pending) return { status: 'no-pending-renewal' };
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'renewal-window-missed' };
  }

  const spawn = Game.getObjectById(pending.spawnId);
  const creep = Game.getObjectById(pending.creepId);

  if (!spawn) return { status: 'spawn-not-visible' };
  if (!creep) return { status: 'creep-not-observed' };

  const expectedTtl =
    pending.before.ticksToLive
    - 1
    + pending.expectedAddedTicks;

  const ttlMatches =
    creep.ticksToLive === expectedTtl;

  const boostsRemaining = creep.body
    .map((part, index) =&gt; ({
      index,
      boost: part.boost || null
    }))
    .filter(item =&gt; item.boost);

  const room = Game.rooms[pending.spawnRoomName];
  const energyTransfers = room
    ? room.getEventLog().filter(event =&gt;
        event.event === EVENT_TRANSFER
        &amp;&amp; event.data?.resourceType === RESOURCE_ENERGY
        &amp;&amp; (
          event.objectId === pending.spawnId
          || event.data?.targetId === pending.spawnId
        )
      )
    : [];

  const observedEnergy =
    spawn.store.getUsedCapacity(RESOURCE_ENERGY);
  const observedSpent =
    pending.before.spawnEnergy - observedEnergy;

  if (!ttlMatches) {
    return {
      status: 'renewal-ttl-signature-mismatch',
      expectedTtl,
      observedTtl: creep.ticksToLive,
      observedSpent,
      energyTransferCount: energyTransfers.length
    };
  }

  if (
    pending.before.boosts.length &gt; 0
    &amp;&amp; boostsRemaining.length &gt; 0
  ) {
    return {
      status: 'renewal-boost-removal-mismatch',
      boostsRemaining
    };
  }

  return {
    status: energyTransfers.length &gt; 0
      ? 'renewal-observed-energy-confounded'
      : 'renewal-local-signature-observed',
    expectedTtl,
    observedTtl: creep.ticksToLive,
    expectedEnergyCost:
      pending.expectedEnergyCost,
    observedSpent,
    boostsRemaining,
    energyTransferCount: energyTransfers.length
  };
}</code></pre>
<p>Under the one-dispatch contract, the next-tick TTL is the previous TTL minus normal decay plus the planned renewal step. Spawn Energy is secondary evidence because transfers can change the same Store. The verifier labels those events instead of forcing the net Energy delta to equal the renewal cost.</p>

<h2 id="state-machine">Keep renewal state until verified</h2>
<pre><code class="language-javascript">function finishRenewalSample(creep, outcome, targetTtl) {
  if (!creep || !outcome) return;

  if (
    outcome.status === 'renewal-local-signature-observed'
    || outcome.status === 'renewal-observed-energy-confounded'
  ) {
    if (creep.ticksToLive &gt;= targetTtl) {
      creep.memory.renewing = false;
    }
  }
}</code></pre>
<p>Clear the mission flag only after a verified sample reaches the reviewed target TTL. A missing or mismatched sample should remain visible and should not trigger unlimited retries through another Spawn.</p>

<h2 id="integration">Production integration boundary</h2>
<p>Use one empire or room scheduler for both <code>spawnCreep()</code> and <code>renewCreep()</code>. Verify pending renewals before planning new ones, reserve Creep identity across all adjacent Spawns, and budget renewal against replacement throughput. Console execution, live Boost-loss behavior, exact CPU cost and genuine screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructureSpawn.renewCreep()</code>, <code>Creep.ticksToLive</code>, body-part costs, <code>CREEP_LIFE_TIME</code>, Spawn Energy, Boost removal, <code>EVENT_TRANSFER</code> and return codes before adapting the examples.</p>
`,
};

const nukerArticle: EnglishBeginnerArticle = {
  ...englishNukerLaunchArticle,
  title: "Screeps launchNuke(): Exact Target Records and Post-Launch Proof",
  headline: "Launch a Nuke Once and Preserve the Exact Operation Record",
  description:
    "Bind confirmation to the exact Nuker and target, record only an accepted launch, verify the launcher's zeroed resources and cooldown, and match the exact Nuke object when target vision exists.",
  category: "DEFENSE · NUKER OPERATION IDENTITY",
  updatedAt: "2026-08-03",
  readingTime: "22 min read",
  primaryKeyword: "Screeps launchNuke verification",
  searchIntent:
    "Submit one irreversible Nuker launch and preserve exact launcher, target, resource, cooldown, and optional target-room Nuke evidence",
  finalScore: 98,
  keywords: [
    "Screeps launchNuke verification",
    "Screeps Nuker cooldown proof",
    "Screeps FIND_NUKES launchRoomName",
    "Screeps Nuker target confirmation",
    "Screeps irreversible operation record",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — launchNuke zeroes the exact Nuker's Energy and Ghodium, sets cooldown, creates a target Nuke object and emits no Room event"],
    ["Target boundary", "The article does not select a player, target room, coordinates, timing or strategic outcome"],
    ["Static code review", "Passed — target-bound confirmation, exact Nuker identity, accepted-call pending record, local signature and optional target-object verification"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live protected-area rejection, launch, cooldown, resource consumption and target Nuke observation", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["evidence-contract", "Use two evidence layers"],
    ["confirmation", "Bind approval to Nuker and target"],
    ["preflight", "Validate the exact launch request"],
    ["submit", "Record only an accepted launch"],
    ["verify-launcher", "Verify the launcher signature"],
    ["verify-target", "Match the target Nuke when visible"],
    ["failure-states", "Keep incomplete evidence visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Use two evidence layers</h2>
<p><code>launchNuke()</code> is irreversible and does not emit a Room event in the official engine. Preserve two evidence layers:</p>
<ul>
<li>local launcher evidence from the exact Nuker ID, its post-launch cooldown, and its Energy and Ghodium Stores;</li>
<li>target evidence from an exact <code>Nuke</code> object at the reviewed room and coordinates when that room is visible.</li>
</ul>
<p>Target vision is not required to submit the API call. It is required only for direct observation of the created Nuke object.</p>

<h2 id="confirmation">Bind approval to Nuker and target</h2>
<pre><code class="language-javascript">function buildNukeConfirmation(request) {
  return [
    'LAUNCH_NUKE',
    request.nukerId,
    request.targetRoomName,
    request.x,
    request.y
  ].join('_');
}

function isValidTarget(request) {
  return (
    typeof request.targetRoomName === 'string'
    &amp;&amp; /^[WE]\d+[NS]\d+$/.test(
      request.targetRoomName
    )
    &amp;&amp; Number.isInteger(request.x)
    &amp;&amp; request.x &gt;= 0
    &amp;&amp; request.x &lt;= 49
    &amp;&amp; Number.isInteger(request.y)
    &amp;&amp; request.y &gt;= 0
    &amp;&amp; request.y &lt;= 49
  );
}</code></pre>
<p>Including the Nuker ID prevents approval for one launcher from being reused by another structure. Any change to room name or coordinates invalidates the old confirmation.</p>

<h2 id="preflight">Validate the exact launch request</h2>
<pre><code class="language-javascript">function evaluateNukeLaunch(request) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }
  if (!isValidTarget(request)) {
    return { ready: false, status: 'invalid-target' };
  }
  if (
    request.confirmation
    !== buildNukeConfirmation(request)
  ) {
    return {
      ready: false,
      status: 'confirmation-mismatch'
    };
  }

  const nuker = Game.getObjectById(request.nukerId);
  if (
    !nuker
    || nuker.my !== true
    || nuker.structureType !== STRUCTURE_NUKER
  ) {
    return { ready: false, status: 'nuker-invalid' };
  }
  if (nuker.isActive() !== true) {
    return { ready: false, status: 'nuker-inactive' };
  }
  if (nuker.cooldown &gt; 0) {
    return { ready: false, status: 'nuker-cooldown' };
  }

  const distance = Game.map.getRoomLinearDistance(
    nuker.room.name,
    request.targetRoomName,
    false
  );
  if (distance &gt; NUKE_RANGE) {
    return { ready: false, status: 'target-out-of-range' };
  }

  if (
    nuker.store.getUsedCapacity(RESOURCE_ENERGY)
    &lt; NUKER_ENERGY_CAPACITY
  ) {
    return { ready: false, status: 'energy-shortage' };
  }
  if (
    nuker.store.getUsedCapacity(RESOURCE_GHODIUM)
    &lt; NUKER_GHODIUM_CAPACITY
  ) {
    return { ready: false, status: 'ghodium-shortage' };
  }

  return { ready: true, status: 'launch-ready', nuker };
}</code></pre>
<p>Current state can still change before intent processing. The method return code is the submission boundary. Protected or unavailable target-room rules must be handled through the documented return code rather than guessed from stale Memory.</p>

<h2 id="submit">Record only an accepted launch</h2>
<pre><code class="language-javascript">function submitNukeLaunch(request) {
  const decision = evaluateNukeLaunch(request);
  if (!decision.ready) {
    if (request) request.enabled = false;
    return decision;
  }

  const nuker = decision.nuker;
  const target = new RoomPosition(
    request.x,
    request.y,
    request.targetRoomName
  );

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  const result = nuker.launchNuke(target);
  request.lastResult = result;

  if (result !== OK) {
    request.status = 'launch-rejected';
    return {
      status: request.status,
      result
    };
  }

  Memory.pendingNukeLaunches ??= {};
  Memory.pendingNukeLaunches[nuker.id] = {
    submittedAt: Game.time,
    nukerId: nuker.id,
    launchRoomName: nuker.room.name,
    targetRoomName: request.targetRoomName,
    x: request.x,
    y: request.y,
    expectedCooldown: NUKER_COOLDOWN,
    expectedLandTime:
      Game.time + NUKE_LAND_TIME,
    before: {
      energy: nuker.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
      ghodium: nuker.store.getUsedCapacity(
        RESOURCE_GHODIUM
      ),
      cooldown: nuker.cooldown
    }
  };

  request.status = 'accepted-awaiting-verification';

  return {
    status: request.status,
    result,
    nukerId: nuker.id,
    targetRoomName: request.targetRoomName,
    x: request.x,
    y: request.y
  };
}</code></pre>
<p>The request is disabled before the call so a thrown exception or later module cannot repeat an irreversible action. A rejected request stays disabled for human review. Only <code>OK</code> creates the pending operation record.</p>

<h2 id="verify-launcher">Verify the launcher signature</h2>
<pre><code class="language-javascript">function verifyNukerState(pending) {
  if (!pending) return { status: 'no-pending-launch' };
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }

  const nuker = Game.getObjectById(pending.nukerId);
  if (!nuker) return { status: 'nuker-not-visible' };

  const energy =
    nuker.store.getUsedCapacity(RESOURCE_ENERGY);
  const ghodium =
    nuker.store.getUsedCapacity(RESOURCE_GHODIUM);

  const localSignature =
    nuker.cooldown &gt; 0
    &amp;&amp; energy === 0
    &amp;&amp; ghodium === 0;

  return {
    status: localSignature
      ? 'launcher-signature-observed'
      : 'accepted-launch-signature-mismatch',
    nukerId: nuker.id,
    cooldown: nuker.cooldown,
    energy,
    ghodium,
    expectedCooldown:
      pending.expectedCooldown
  };
}</code></pre>
<p>The official engine sets an absolute cooldown time internally; the API exposes remaining cooldown. Check for a positive cooldown rather than requiring a copied value at every observation tick. The zero-resource signature is local proof for this Nuker, but it does not replace optional target evidence.</p>

<h2 id="verify-target">Match the target Nuke when visible</h2>
<pre><code class="language-javascript">function verifyTargetNuke(pending) {
  const room = Game.rooms[pending.targetRoomName];
  if (!room) {
    return { status: 'target-evidence-unavailable' };
  }

  const matches = room.find(FIND_NUKES).filter(nuke =&gt;
    nuke.pos.x === pending.x
    &amp;&amp; nuke.pos.y === pending.y
    &amp;&amp; nuke.launchRoomName
      === pending.launchRoomName
  );

  if (matches.length === 0) {
    return { status: 'target-nuke-not-observed' };
  }
  if (matches.length &gt; 1) {
    return {
      status: 'target-nuke-ambiguous',
      count: matches.length
    };
  }

  return {
    status: 'target-nuke-observed',
    nukeId: matches[0].id,
    launchRoomName:
      matches[0].launchRoomName,
    timeToLand: matches[0].timeToLand,
    expectedLandTime:
      pending.expectedLandTime
  };
}</code></pre>
<p>Coordinates alone are not enough because several players can launch at the same tile. Match the saved launching room as well. <code>timeToLand</code> is current remaining time; <code>expectedLandTime</code> is the submitted absolute planning value and should be reported separately.</p>

<h2 id="failure-states">Keep incomplete evidence visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>confirmation-mismatch</code></td><td>The approved launcher or target changed</td><td>Require a new review</td></tr>
<tr><td><code>launch-rejected</code></td><td>The API did not accept the irreversible action</td><td>Keep the request disabled and retain the return code</td></tr>
<tr><td><code>accepted-launch-signature-mismatch</code></td><td>The saved Nuker lacks the expected local state</td><td>Preserve the discrepancy</td></tr>
<tr><td><code>target-evidence-unavailable</code></td><td>The target room is not visible</td><td>Report local evidence only</td></tr>
<tr><td><code>target-nuke-not-observed</code></td><td>Vision exists but no exact Nuke matches</td><td>Do not substitute another Nuke at the tile</td></tr>
<tr><td><code>target-nuke-ambiguous</code></td><td>More than one exact launcher-and-position match exists</td><td>Inspect the room objects directly</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Keep one irreversible-operations queue, disable each request before the API call, and archive accepted records without mutating their target fields. Do not automate target selection, diplomacy, damage prediction or launch timing from this guide. Console execution, protected-area behavior, live Nuke observation and genuine screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructureNuker.launchNuke()</code>, <code>RoomPosition</code>, <code>FIND_NUKES</code>, <code>Nuke.launchRoomName</code>, <code>Nuke.timeToLand</code>, <code>NUKE_RANGE</code>, capacities, cooldown, landing time and return codes before adapting the examples.</p>
`,
};

export const englishEditorialControllerRenewNukerOverrides20260803 = {
  [reserveClaimArticle.slug]: reserveClaimArticle,
  [renewArticle.slug]: renewArticle,
  [nukerArticle.slug]: nukerArticle,
};
