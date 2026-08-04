import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishLifecycleBatchFourArticles } from "./english-lifecycle-content-4-published";

const recycleSource = englishLifecycleBatchFourArticles.find(
  (article) => article.slug === "screeps-recycle-creep",
);

if (!recycleSource) {
  throw new Error("Published recycleCreep article is missing");
}

export const englishEditorialRecycleArticle20260804: EnglishBeginnerArticle = {
  ...recycleSource,
  title: "Screeps recycleCreep(): Verify the Exact Creep Retirement",
  headline: "Recycle One Creep Without Retrying an Irreversible Request",
  description:
    "Bind one retirement request to exact Spawn and Creep IDs, reserve both objects, record pending evidence only after OK, then match the exact destruction event and Creep-tile Tombstone.",
  category: "CREEP LIFECYCLE · RECYCLING IDENTITY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  updatedAt: "2026-08-04",
  readingTime: "23 min read",
  primaryKeyword: "Screeps recycleCreep verification",
  searchIntent:
    "Submit and verify one exact Creep recycling operation without automatic retry, name-only identity, Spawn-busy assumptions, or incorrect resource-drop evidence",
  finalScore: 98,
  keywords: [
    "Screeps recycleCreep verification",
    "Screeps recycle EVENT_OBJECT_DESTROYED",
    "Screeps recycling Tombstone store",
    "Screeps recycleCreep no ERR_BUSY",
    "Screeps recycleCreep exact Creep ID",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked — recycling validates an owned non-spawning adjacent Creep, removes that exact ID, creates a Tombstone at the Creep position and emits EVENT_OBJECT_DESTROYED",
    ],
    [
      "Resource boundary",
      "Checked — recoverable resources first enter a Container on the Creep tile when capacity exists; the remainder enters the exact Tombstone Store",
    ],
    [
      "Static code review",
      "Passed — exact Spawn and Creep IDs, one dispatcher, accepted-call pending state, previous-tick destruction event and exact Tombstone identity",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live recycling, simultaneous request contention, destruction-event matching, Tombstone Store and Container-delta observation",
      "Pending",
    ],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 4, 2026"],
  ],
  toc: [
    ["evidence-contract", "Use the event and artifact contract"],
    ["request-identity", "Bind exact Spawn and Creep identity"],
    ["preflight", "Evaluate the current objects"],
    ["coordinate", "Reserve both objects for the tick"],
    ["submit", "Submit once without automatic retry"],
    ["verify-event", "Match the exact destruction event"],
    ["verify-artifacts", "Inspect the Creep-tile Tombstone and Container"],
    ["failure-states", "Keep incomplete evidence visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Use the event and artifact contract</h2>
<p><code>StructureSpawn.recycleCreep()</code> is an irreversible retirement request. The call returning <code>OK</code> proves that the current script submitted an acceptable intent; it does not prove that the target disappeared until the server processes the tick.</p>
<p>The official engine then removes the exact Creep ID, creates a Tombstone at the Creep's position and appends an <code>EVENT_OBJECT_DESTROYED</code> record whose <code>objectId</code> is that Creep ID and whose type is <code>creep</code>. Because <code>Room.getEventLog()</code> reports the previous tick, the next script tick can match that exact event.</p>
<p>Resource recovery also follows the Creep position, not the Spawn position. The engine first fills a Container on the Creep tile when one exists and has capacity, then writes the remainder into the new Tombstone Store. Do not search for loose resource objects on the Spawn tile or infer a refund from Spawn Energy.</p>

<h2 id="request-identity">Bind exact Spawn and Creep identity</h2>
<pre><code class="language-javascript">function buildRecycleConfirmation(request) {
  return [
    'RECYCLE_CREEP',
    request.requestId,
    request.spawnId,
    request.creepId,
    request.creepName
  ].join('_');
}</code></pre>
<pre><code class="language-javascript">Memory.recycleRequests ??= {};

Memory.recycleRequests['retire-worker-17'] = {
  requestId: 'retire-worker-17',
  enabled: true,
  spawnId: 'replace-with-spawn-id',
  creepId: 'replace-with-creep-id',
  creepName: 'OldWorker1',
  homeRoomName: 'W1N1',
  requestedAt: Game.time,
  confirmation:
    'RECYCLE_CREEP_retire-worker-17_' +
    'replace-with-spawn-id_' +
    'replace-with-creep-id_OldWorker1'
};</code></pre>
<p>The name helps an operator identify the mission, but the retirement binds to IDs. A later Creep that reuses the same name is not the reviewed target.</p>

<h2 id="preflight">Evaluate the current objects</h2>
<pre><code class="language-javascript">function evaluateRecycleOperation(
  request,
  spawn,
  creep
) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || typeof request.spawnId !== 'string'
    || typeof request.creepId !== 'string'
    || typeof request.creepName !== 'string'
    || typeof request.homeRoomName !== 'string'
    || !Number.isInteger(request.requestedAt)
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  if (request.confirmation !== buildRecycleConfirmation(request)) {
    return { ready: false, status: 'confirmation-mismatch' };
  }

  if (!spawn || !creep) {
    return { ready: false, status: 'object-unavailable' };
  }

  if (
    spawn.id !== request.spawnId
    || creep.id !== request.creepId
    || creep.name !== request.creepName
  ) {
    return { ready: false, status: 'operation-identity-mismatch' };
  }

  if (spawn.my !== true || creep.my !== true) {
    return { ready: false, status: 'ownership-invalid' };
  }

  if (spawn.isActive() !== true) {
    return { ready: false, status: 'spawn-inactive' };
  }

  if (creep.spawning === true) {
    return { ready: false, status: 'creep-still-spawning' };
  }

  if (!spawn.pos.isNearTo(creep)) {
    return { ready: false, status: 'move-to-spawn' };
  }

  return { ready: true, status: 'recycle-ready' };
}</code></pre>
<p>There is intentionally no <code>spawn.spawning</code> rejection. The current API and processor do not require an idle Spawn for recycling.</p>

<h2 id="coordinate">Reserve both objects for the tick</h2>
<pre><code class="language-javascript">function createRecycleDispatcher() {
  const reservedSpawnIds = new Set();
  const reservedCreepIds = new Set();

  return {
    reserve(spawnId, creepId) {
      if (reservedSpawnIds.has(spawnId)) {
        return {
          ready: false,
          status: 'spawn-already-reserved'
        };
      }
      if (reservedCreepIds.has(creepId)) {
        return {
          ready: false,
          status: 'creep-already-reserved'
        };
      }

      reservedSpawnIds.add(spawnId);
      reservedCreepIds.add(creepId);
      return {
        ready: true,
        status: 'recycle-reserved'
      };
    },
    release(spawnId, creepId) {
      reservedSpawnIds.delete(spawnId);
      reservedCreepIds.delete(creepId);
    }
  };
}</code></pre>
<p>The Spawn reservation is a project coordination rule, not an engine busy rule. The Creep reservation prevents two adjacent Spawns or two retirement modules from targeting the same exact Creep during one script tick.</p>

<h2 id="submit">Submit once without automatic retry</h2>
<pre><code class="language-javascript">function snapshotStore(store) {
  return Object.fromEntries(
    Object.keys(store).map(resourceType =&gt; [
      resourceType,
      store.getUsedCapacity(resourceType)
    ])
  );
}

function submitRecycleOperation(
  dispatcher,
  requestId
) {
  const request =
    Memory.recycleRequests?.[requestId];

  if (!request || request.requestId !== requestId) {
    return { status: 'request-identity-mismatch' };
  }

  const spawn = typeof request.spawnId === 'string'
    ? Game.getObjectById(request.spawnId)
    : null;
  const creep = typeof request.creepId === 'string'
    ? Game.getObjectById(request.creepId)
    : null;

  const decision = evaluateRecycleOperation(
    request,
    spawn,
    creep
  );

  if (decision.status === 'move-to-spawn' && creep && spawn) {
    return {
      status: 'moving-to-reviewed-spawn',
      moveResult: creep.moveTo(spawn, {
        range: 1,
        reusePath: 10
      })
    };
  }
  if (!decision.ready) return decision;

  const reservation = dispatcher.reserve(
    spawn.id,
    creep.id
  );
  if (!reservation.ready) return reservation;

  Memory.pendingRecycleOperations ??= {};
  if (Memory.pendingRecycleOperations[creep.id]) {
    dispatcher.release(spawn.id, creep.id);
    return { status: 'pending-operation-exists' };
  }

  const container = creep.room.lookForAt(
    LOOK_STRUCTURES,
    creep.pos.x,
    creep.pos.y
  ).find(structure =&gt;
    structure.structureType === STRUCTURE_CONTAINER
  ) || null;

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  const before = {
    ticksToLive: creep.ticksToLive,
    body: creep.body.map(part =&gt; ({
      type: part.type,
      boost: part.boost || null
    })),
    creepRoomName: creep.pos.roomName,
    creepX: creep.pos.x,
    creepY: creep.pos.y,
    containerId: container?.id ?? null,
    containerStore: container
      ? snapshotStore(container.store)
      : null
  };

  const result = spawn.recycleCreep(creep);
  request.lastResult = result;

  if (result !== OK) {
    dispatcher.release(spawn.id, creep.id);
    request.status =
      'recycle-rejected-review-required';
    return {
      status: request.status,
      result
    };
  }

  Memory.pendingRecycleOperations[creep.id] = {
    submittedAt: Game.time,
    requestId: request.requestId,
    spawnId: spawn.id,
    creepId: creep.id,
    creepName: creep.name,
    before
  };

  request.status = 'accepted-awaiting-verification';

  return {
    status: request.status,
    result,
    spawnId: spawn.id,
    creepId: creep.id
  };
}</code></pre>
<p>A rejected irreversible request remains disabled for human review. Movement may continue before submission, but the code never silently retries a rejected call and never falls back to <code>creep.suicide()</code>.</p>

<h2 id="verify-event">Match the exact destruction event</h2>
<pre><code class="language-javascript">function verifyRecycledCreep(pending) {
  if (!pending) {
    return { status: 'no-pending-operation' };
  }

  const expectedTick = pending.submittedAt + 1;
  if (Game.time &lt; expectedTick) {
    return { status: 'waiting-for-next-tick' };
  }
  if (Game.time &gt; expectedTick) {
    return { status: 'verification-window-missed' };
  }

  const creep = Game.getObjectById(pending.creepId);
  if (creep) {
    return {
      status: 'accepted-creep-still-observed',
      creepId: creep.id
    };
  }

  const room =
    Game.rooms[pending.before.creepRoomName];
  if (!room) {
    return {
      status: 'exact-creep-gone-room-evidence-unavailable'
    };
  }

  const events = room.getEventLog().filter(event =&gt;
    event.event === EVENT_OBJECT_DESTROYED
    &amp;&amp; event.objectId === pending.creepId
    &amp;&amp; event.data?.type === 'creep'
  );

  const tombstones = room.find(FIND_TOMBSTONES).filter(
    tombstone =&gt;
      tombstone.creep?.id === pending.creepId
      &amp;&amp; tombstone.pos.x === pending.before.creepX
      &amp;&amp; tombstone.pos.y === pending.before.creepY
  );

  if (events.length !== 1) {
    return {
      status: events.length === 0
        ? 'exact-creep-gone-destruction-event-not-observed'
        : 'destruction-event-ambiguous',
      eventCount: events.length,
      tombstoneCount: tombstones.length
    };
  }

  return {
    status: tombstones.length === 1
      ? 'recycle-event-and-tombstone-observed'
      : 'recycle-event-observed-artifact-mismatch',
    eventCount: events.length,
    tombstoneCount: tombstones.length,
    tombstoneId: tombstones[0]?.id ?? null
  };
}</code></pre>
<p>The exact destruction event and exact Tombstone identity are stronger than name absence. A new Creep may reuse the old name, but it cannot reuse the destroyed object's ID.</p>

<h2 id="verify-artifacts">Inspect the Creep-tile Tombstone and Container</h2>
<pre><code class="language-javascript">function observeRecycleArtifacts(pending) {
  const room =
    Game.rooms[pending.before.creepRoomName];

  if (!room) {
    return { status: 'artifact-evidence-unavailable' };
  }

  const tombstone = room.find(FIND_TOMBSTONES).find(
    item =&gt;
      item.creep?.id === pending.creepId
      &amp;&amp; item.pos.x === pending.before.creepX
      &amp;&amp; item.pos.y === pending.before.creepY
  ) || null;

  const container = pending.before.containerId
    ? Game.getObjectById(pending.before.containerId)
    : null;

  const containerAfter = container
    ? snapshotStore(container.store)
    : null;

  return {
    status: tombstone
      ? container
        ? 'recycle-artifacts-observed-container-confounded'
        : 'recycle-tombstone-observed'
      : 'recycle-tombstone-not-observed',
    tombstoneId: tombstone?.id ?? null,
    tombstoneStore: tombstone
      ? snapshotStore(tombstone.store)
      : null,
    containerId: container?.id ?? null,
    containerBefore: pending.before.containerStore,
    containerAfter
  };
}</code></pre>
<p>The Tombstone is matched by deceased Creep ID and Creep coordinates. A Container Store change is intentionally labelled confounded because transfers, withdrawals and other writes may affect the same Store. Report observed values instead of claiming a guaranteed refund from a net delta.</p>

<h2 id="failure-states">Keep incomplete evidence visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>creep-already-reserved</code></td><td>Another retirement request owns this Creep for the tick</td><td>Do not submit a second call</td></tr>
<tr><td><code>recycle-rejected-review-required</code></td><td>The API rejected the irreversible request</td><td>Keep it disabled and inspect the return code</td></tr>
<tr><td><code>accepted-creep-still-observed</code></td><td>The saved ID still exists next tick</td><td>Preserve the discrepancy</td></tr>
<tr><td><code>exact-creep-gone-destruction-event-not-observed</code></td><td>The exact ID vanished but the expected previous-tick event is absent</td><td>Keep the retirement unverified</td></tr>
<tr><td><code>recycle-event-observed-artifact-mismatch</code></td><td>The exact event exists but no single matching Tombstone is visible</td><td>Inspect visibility and artifact identity</td></tr>
<tr><td><code>recycle-artifacts-observed-container-confounded</code></td><td>The exact Tombstone and reviewed Container are visible</td><td>Report both Stores without forcing a refund delta</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Run retirement after replacement handoff and cargo-delivery checks. Verify accepted operations before cleaning custom indexes, and delete only Memory records that still identify the retired Creep ID. Live Console execution, exact recovered amounts, Container contention, simultaneous Spawn requests, genuine screenshots and CPU measurements remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructureSpawn.recycleCreep()</code>, <code>Room.getEventLog()</code>, <code>EVENT_OBJECT_DESTROYED</code>, <code>FIND_TOMBSTONES</code>, <code>Tombstone.creep</code>, <code>Tombstone.store</code>, Containers, range and return codes. The engine processor clarifies the exact Creep-tile artifact flow.</p>
`,
};
