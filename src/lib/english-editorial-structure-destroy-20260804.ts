import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishStructureDestroyArticle } from "./english-structure-destroy-15";

export const englishEditorialStructureDestroyArticle20260804: EnglishBeginnerArticle = {
  ...englishStructureDestroyArticle,
  title: "Screeps Structure.destroy(): Verify One Exact Extension Removal",
  headline: "Destroy One Extension Without Losing Object or Room Identity",
  description:
    "Bind confirmation to the exact Extension and owned room, block hostile Creeps and Power Creeps, submit one queued destroy call, then distinguish original-ID removal from a later replacement at the tile.",
  category: "CONSTRUCTION · DESTRUCTION IDENTITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  updatedAt: "2026-08-04",
  readingTime: "22 min read",
  primaryKeyword: "Screeps Structure destroy verification",
  searchIntent:
    "Submit and verify one exact Extension destruction without static confirmation, incomplete hostile checks, generic ownership assumptions, or replacement confusion",
  finalScore: 98,
  keywords: [
    "Screeps Structure destroy verification",
    "Screeps destroy Extension exact ID",
    "Screeps FIND_HOSTILE_POWER_CREEPS destroy",
    "Screeps room Controller destroy ownership",
    "Screeps Extension replacement verification",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official engine",
      "Checked — destroy uses owned-room Controller authority, rejects hostile Creeps and hostile Power Creeps, queues a room destroyStructure intent and emits no Room event",
    ],
    [
      "Destructive scope",
      "Restricted to one exact STRUCTURE_EXTENSION; original-ID disappearance and replacement-at-tile are reported separately",
    ],
    [
      "Static code review",
      "Passed — target-bound confirmation, room Controller ownership, complete hostile checks, one operation queue and next-tick identity verification",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live Extension removal, hostile Creep and Power Creep rejection, capacity impact and replacement verification",
      "Pending",
    ],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 4, 2026"],
  ],
  toc: [
    ["evidence-contract", "Separate accepted destruction from removal proof"],
    ["request-identity", "Bind confirmation to the exact Extension"],
    ["preflight", "Validate room authority and hostiles"],
    ["coordinate", "Queue only one destructive operation"],
    ["submit", "Record only an accepted destroy call"],
    ["verify", "Distinguish removal from replacement"],
    ["failure-states", "Preserve destructive-operation states"],
    ["impact", "Review capacity and layout impact"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Separate accepted destruction from removal proof</h2>
<p><code>Structure.destroy()</code> returns <code>OK</code> after queuing a room-level destruction intent. The official engine checks that the room has your Controller and that no hostile regular Creep or hostile Power Creep is present. It does not create a Room event for the removal.</p>
<p>The next-tick verifier must answer two different questions: did the original Structure ID disappear, and what now occupies the reviewed tile? A replacement Extension at the same coordinate does not mean the original destruction failed.</p>

<h2 id="request-identity">Bind confirmation to the exact Extension</h2>
<pre><code class="language-javascript">function buildDestroyConfirmation(request) {
  return [
    'DESTROY_STRUCTURE',
    request.requestId,
    request.structureId,
    request.roomName,
    request.x,
    request.y,
    request.expectedType
  ].join('_');
}</code></pre>
<pre><code class="language-javascript">Memory.destroyRequests ??= {};

Memory.destroyRequests['remove-extension-7'] = {
  requestId: 'remove-extension-7',
  enabled: true,
  structureId: 'replace-with-extension-id',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_EXTENSION,
  requestedAt: Game.time,
  confirmation:
    'DESTROY_STRUCTURE_remove-extension-7_' +
    'replace-with-extension-id_W1N1_20_20_extension'
};</code></pre>
<p>A static phrase such as <code>DESTROY_EXTENSION</code> proves only that someone typed a phrase. It does not prove which Extension was reviewed. Bind the exact ID, room, coordinate and allowed type.</p>

<h2 id="preflight">Validate room authority and hostiles</h2>
<pre><code class="language-javascript">function evaluateDestroyOperation(
  request,
  structure
) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || typeof request.structureId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x &lt; 0
    || request.x &gt; 49
    || request.y &lt; 0
    || request.y &gt; 49
    || request.expectedType !== STRUCTURE_EXTENSION
    || !Number.isInteger(request.requestedAt)
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  if (request.confirmation !== buildDestroyConfirmation(request)) {
    return { ready: false, status: 'confirmation-mismatch' };
  }

  if (!structure) {
    return { ready: false, status: 'structure-unavailable' };
  }

  if (
    structure.id !== request.structureId
    || structure.structureType !== request.expectedType
    || structure.pos.roomName !== request.roomName
    || structure.pos.x !== request.x
    || structure.pos.y !== request.y
  ) {
    return { ready: false, status: 'structure-identity-mismatch' };
  }

  const room = structure.room;
  const controller = room?.controller || null;

  if (!room || !controller || controller.my !== true) {
    return { ready: false, status: 'room-controller-not-owned' };
  }

  const hostileCreepCount =
    room.find(FIND_HOSTILE_CREEPS).length;
  const hostilePowerCreepCount =
    room.find(FIND_HOSTILE_POWER_CREEPS).length;

  if (
    hostileCreepCount &gt; 0
    || hostilePowerCreepCount &gt; 0
  ) {
    return {
      ready: false,
      status: 'hostiles-present',
      hostileCreepCount,
      hostilePowerCreepCount
    };
  }

  return {
    ready: true,
    status: 'destroy-ready',
    room,
    hostileCreepCount,
    hostilePowerCreepCount
  };
}</code></pre>
<p>The method's ownership boundary is the room Controller, not a generic assumption that every destroyable Structure must appear in <code>Game.structures</code>. This guide still restricts the operation to one reviewed Extension in one owned room.</p>

<h2 id="coordinate">Queue only one destructive operation</h2>
<pre><code class="language-javascript">function createDestructionDispatcher() {
  let operationReserved = false;
  const reservedStructureIds = new Set();

  return {
    reserve(structureId) {
      if (operationReserved) {
        return {
          ready: false,
          status: 'destruction-slot-already-used'
        };
      }
      if (reservedStructureIds.has(structureId)) {
        return {
          ready: false,
          status: 'structure-already-reserved'
        };
      }

      operationReserved = true;
      reservedStructureIds.add(structureId);
      return {
        ready: true,
        status: 'destruction-reserved'
      };
    },
    release(structureId) {
      operationReserved = false;
      reservedStructureIds.delete(structureId);
    }
  };
}</code></pre>
<p>The engine can queue more than one room destruction intent in a tick. This guide intentionally permits one reviewed destructive operation per dispatcher run. Expand that policy only with a batch-level dependency review.</p>

<h2 id="submit">Record only an accepted destroy call</h2>
<pre><code class="language-javascript">function submitDestroyOperation(
  dispatcher,
  requestId
) {
  const request =
    Memory.destroyRequests?.[requestId];

  if (!request || request.requestId !== requestId) {
    return { status: 'request-identity-mismatch' };
  }

  const structure =
    typeof request.structureId === 'string'
      ? Game.getObjectById(request.structureId)
      : null;

  const decision = evaluateDestroyOperation(
    request,
    structure
  );
  if (!decision.ready) {
    return decision;
  }

  const reservation =
    dispatcher.reserve(structure.id);
  if (!reservation.ready) {
    return reservation;
  }

  Memory.pendingStructureDestructions ??= {};
  if (
    Memory.pendingStructureDestructions[
      structure.id
    ]
  ) {
    dispatcher.release(structure.id);
    return { status: 'pending-operation-exists' };
  }

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  const before = {
    structureType: structure.structureType,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    energyCapacityAvailable:
      decision.room.energyCapacityAvailable,
    hostileCreepCount:
      decision.hostileCreepCount,
    hostilePowerCreepCount:
      decision.hostilePowerCreepCount
  };

  const result = structure.destroy();
  request.lastResult = result;

  if (result !== OK) {
    dispatcher.release(structure.id);
    request.status =
      'destroy-rejected-review-required';
    return {
      status: request.status,
      result
    };
  }

  Memory.pendingStructureDestructions[
    structure.id
  ] = {
    submittedAt: Game.time,
    requestId: request.requestId,
    structureId: structure.id,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    expectedType: structure.structureType,
    before
  };

  request.status =
    'accepted-awaiting-verification';

  return {
    status: request.status,
    result,
    structureId: structure.id
  };
}</code></pre>
<p>A pending record exists only after <code>OK</code>. A rejected request remains disabled for review instead of firing automatically after hostiles leave.</p>

<h2 id="verify">Distinguish removal from replacement</h2>
<pre><code class="language-javascript">function verifyDestroyedStructure(pending) {
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

  const original =
    Game.getObjectById(pending.structureId);

  if (original) {
    return {
      status: 'accepted-original-still-observed',
      structureId: original.id
    };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) {
    return {
      status: 'original-gone-tile-evidence-unavailable'
    };
  }

  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    pending.x,
    pending.y
  );
  const replacement = structures.find(structure =&gt;
    structure.structureType
      === pending.expectedType
  ) || null;

  return replacement
    ? {
        status: 'original-destroyed-replacement-present',
        replacementId: replacement.id
      }
    : {
        status: 'original-destroyed-tile-empty'
      };
}</code></pre>
<p>Both terminal states prove that the original ID is gone. The replacement state is operationally important, but it must not retroactively invalidate the original removal.</p>

<h2 id="failure-states">Preserve destructive-operation states</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>room-controller-not-owned</code></td><td>The room does not provide current destroy authority</td><td>Stop without guessing from Structure properties</td></tr>
<tr><td><code>hostiles-present</code></td><td>A hostile regular Creep or Power Creep is visible</td><td>Keep the request unsubmitted</td></tr>
<tr><td><code>destruction-slot-already-used</code></td><td>Another destructive operation was selected this tick</td><td>Defer without submitting</td></tr>
<tr><td><code>accepted-original-still-observed</code></td><td>The saved ID still resolves next tick</td><td>Preserve the discrepancy</td></tr>
<tr><td><code>original-destroyed-replacement-present</code></td><td>The original ID is gone and the tile contains another Extension</td><td>Review the replacement separately</td></tr>
</tbody></table></div>

<h2 id="impact">Review capacity and layout impact</h2>
<p>An Extension contributes to room Energy capacity and may be referenced by logistics, Rampart coverage, path matrices and blueprints. Record the pre-action capacity for impact review, but do not treat a later capacity change as exact destruction proof. This guide makes no refund claim and does not rebuild automatically.</p>

<h2 id="integration">Production integration boundary</h2>
<p>Route all destructive requests through one final queue, verify accepted operations before opening another slot, and require a new target-bound confirmation after any blueprint or object change. Console execution, hostile Power Creep behavior, capacity impact, replacement timing, genuine screenshots and CPU measurements remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>Structure.destroy()</code>, room Controllers, hostile Creeps, hostile Power Creeps, object IDs, room look methods and return codes. The official engine implementation clarifies the room-authority and queued-intent boundaries.</p>
`,
};
