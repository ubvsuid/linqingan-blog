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
    "Bind one retirement request to exact Spawn and Creep IDs, reserve both objects for the tick, record pending evidence only after OK, verify the exact Creep disappears, and label drop evidence as confounded.",
  category: "CREEP LIFECYCLE · RECYCLING IDENTITY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  updatedAt: "2026-08-04",
  readingTime: "22 min read",
  primaryKeyword: "Screeps recycleCreep verification",
  searchIntent:
    "Submit and verify one exact Creep recycling operation without automatic retry, name-only identity, Spawn-busy assumptions, or invented refund proof",
  finalScore: 98,
  keywords: [
    "Screeps recycleCreep verification",
    "Screeps recycle exact Creep ID",
    "Screeps recycling resource drops",
    "Screeps recycleCreep no ERR_BUSY",
    "Screeps recycleCreep vs suicide",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked — recycling requires an owned non-spawning Creep adjacent to the Spawn, then removes that exact Creep; the processor does not require an idle Spawn",
    ],
    [
      "Resource boundary",
      "Checked — docs describe lifetime-based spawning and Boost resource drops with an Energy cap; exact observed piles remain confounded by pickup, merging and visibility",
    ],
    [
      "Static code review",
      "Passed — exact Spawn and Creep IDs, one dispatcher reservation, accepted-call pending state, next-tick disappearance and drop-observation labels",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live recycling, simultaneous request contention, exact Creep disappearance and resource-drop observation",
      "Pending",
    ],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 4, 2026"],
  ],
  toc: [
    ["evidence-contract", "Separate retirement from refund evidence"],
    ["request-identity", "Bind exact Spawn and Creep identity"],
    ["preflight", "Evaluate the current objects"],
    ["coordinate", "Reserve both objects for the tick"],
    ["submit", "Submit once without automatic retry"],
    ["verify-creep", "Verify the exact Creep disappears"],
    ["verify-drops", "Treat resource drops as confounded evidence"],
    ["failure-states", "Keep incomplete evidence visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Separate retirement from refund evidence</h2>
<p><code>StructureSpawn.recycleCreep()</code> is an irreversible retirement request. The strongest next-tick evidence is that the exact saved Creep ID no longer resolves. Resource piles near the Spawn are secondary evidence: another Creep may pick them up, compatible piles may merge, visibility may be lost and unrelated drops may already occupy the tile.</p>
<p>The official processor validates the exact target Creep, ownership, spawning state and adjacency before removing it. It does not require the Spawn to be idle. Do not copy <code>renewCreep()</code>'s <code>ERR_BUSY</code> model into recycling, and do not use Spawn Energy changes as refund proof.</p>
<p>Recycling creates no Room event. Preserve exact object identity before submission.</p>

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
<p>The Creep name remains useful for operators and Memory cleanup, but the operation binds to IDs. A later Creep that reuses the same name is not the reviewed target.</p>

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
<p>There is intentionally no <code>spawn.spawning</code> rejection. The current docs and processor do not make an idle Spawn a recycling precondition.</p>

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
<p>Reserve the Creep so two nearby Spawns cannot race for the same target, and reserve the Spawn so one final operations dispatcher owns its retirement call for the tick. The Spawn reservation is a project coordination rule, not an engine busy requirement.</p>

<h2 id="submit">Submit once without automatic retry</h2>
<pre><code class="language-javascript">function submitRecycleOperation(
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
  if (!decision.ready) {
    return decision;
  }

  const reservation = dispatcher.reserve(
    spawn.id,
    creep.id
  );
  if (!reservation.ready) {
    return reservation;
  }

  Memory.pendingRecycleOperations ??= {};
  if (Memory.pendingRecycleOperations[creep.id]) {
    dispatcher.release(spawn.id, creep.id);
    return { status: 'pending-operation-exists' };
  }

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
    spawnRoomName: spawn.pos.roomName,
    spawnX: spawn.pos.x,
    spawnY: spawn.pos.y
  };

  const result = spawn.recycleCreep(creep);
  request.lastResult = result;

  if (result !== OK) {
    dispatcher.release(spawn.id, creep.id);
    request.status = 'recycle-rejected-review-required';
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
<p>A rejected destructive request remains disabled. Movement can continue while the request is enabled, but after the API call the operator must review any rejection before creating a fresh request. The code never falls back to <code>creep.suicide()</code>.</p>

<h2 id="verify-creep">Verify the exact Creep disappears</h2>
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

  const creep =
    Game.getObjectById(pending.creepId);
  const namedCreep =
    Game.creeps[pending.creepName] || null;
  const spawn =
    Game.getObjectById(pending.spawnId);

  if (creep) {
    return {
      status: 'accepted-creep-still-observed',
      creepId: creep.id,
      creepName: creep.name
    };
  }

  return {
    status: namedCreep
      ? 'exact-creep-gone-name-reused'
      : 'exact-creep-retirement-observed',
    creepId: pending.creepId,
    creepName: pending.creepName,
    replacementId: namedCreep?.id ?? null,
    spawnAvailable: Boolean(spawn)
  };
}</code></pre>
<p>The exact ID is primary. Name absence alone is weaker because later code may reuse a role name after the original Creep disappears.</p>

<h2 id="verify-drops">Treat resource drops as confounded evidence</h2>
<pre><code class="language-javascript">function observeRecycleDrops(pending) {
  const room =
    Game.rooms[pending.before.spawnRoomName];

  if (!room) {
    return { status: 'drop-evidence-unavailable' };
  }

  const drops = room.lookForAt(
    LOOK_RESOURCES,
    pending.before.spawnX,
    pending.before.spawnY
  ).map(resource =&gt; ({
    id: resource.id,
    resourceType: resource.resourceType,
    amount: resource.amount
  }));

  return {
    status: drops.length &gt; 0
      ? 'drop-piles-observed-confounded'
      : 'no-drop-pile-observed',
    drops
  };
}</code></pre>
<p>The documented lifetime and Energy-cap rules explain possible output, but this snapshot cannot attribute every pile to the saved operation. Pickup, merging, prior piles and timing remain confounds. Report the observed objects without converting them into guaranteed refund proof.</p>

<h2 id="failure-states">Keep incomplete evidence visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>creep-already-reserved</code></td><td>Another retirement request owns this Creep for the tick</td><td>Do not submit a second call</td></tr>
<tr><td><code>recycle-rejected-review-required</code></td><td>The API rejected the irreversible request</td><td>Keep it disabled and inspect the return code</td></tr>
<tr><td><code>accepted-creep-still-observed</code></td><td>The saved ID still exists next tick</td><td>Preserve the discrepancy</td></tr>
<tr><td><code>exact-creep-gone-name-reused</code></td><td>The reviewed ID vanished but another Creep uses the name</td><td>Do not delete the replacement's Memory</td></tr>
<tr><td><code>drop-piles-observed-confounded</code></td><td>Resources are visible at the Spawn tile</td><td>Record them as secondary evidence only</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Run retirement after replacement handoff and resource-delivery checks. Use one dispatcher for all Spawns, verify accepted operations before cleaning custom indexes, and delete only Memory records that still identify the retired Creep ID. Live Console execution, exact returned amounts, simultaneous Spawn contention, genuine screenshots and CPU measurements remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructureSpawn.recycleCreep()</code>, <code>Creep.suicide()</code>, <code>Creep.ticksToLive</code>, dropped resources, range and return codes. The engine processor clarifies the exact target, ownership, spawning and adjacency checks.</p>
`,
};
