import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishObserverArticle = {
  slug: "screeps-observer-observe-room",
  path: "/en/blog/screeps-observer-observe-room",
  chinesePath: "/blog/screeps-observer-observe-room",
  title: "Screeps Observer Guide: observeRoom() Timing and Intel",
  headline: "How to Use StructureObserver.observeRoom() Safely",
  description:
    "Schedule Observer vision, store the accepted request, read the target Room on the next tick, preserve bounded intel, handle return codes, and avoid claiming that current visibility proves the new request completed.",
  category: "VISION · OBSERVER REQUEST LIFECYCLE",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Observer Vision",
  tags: ["Screeps", "Observer", "Visibility", "Intel", "Memory"],
  keywords: [
    "Screeps StructureObserver observeRoom",
    "Screeps Observer next tick",
    "Screeps room intel Observer",
    "OBSERVER_RANGE Screeps",
    "observeRoom return codes",
  ],
  primaryKeyword: "Screeps StructureObserver observeRoom",
  searchIntent: "Build a correct next-tick Observer request and room-intel workflow",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — observeRoom(), OBSERVER_RANGE, return codes, Game.rooms and getRoomLinearDistance()"],
    ["Timing boundary", "OK schedules observation; the requested Room is evaluated on the next tick"],
    ["Attribution boundary", "A visible target is not claimed to be visible exclusively because of the Observer"],
    ["JavaScript syntax", "Passed"],
    ["Offline request-state review", "Passed — none, waiting, visible, missing, expired, accepted and rejected requests"],
    ["Screeps Console test", "Pending"],
    ["Live Observer and multi-tick intel test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["official-rules", "Observer rules that affect the workflow"],
    ["timeline", "Request and result timeline"],
    ["request-state", "Store only an accepted request"],
    ["result-reader", "Read the previous request safely"],
    ["intel-summary", "Save a bounded room-intel summary"],
    ["complete-loop", "Complete single-target Observer loop"],
    ["attribution", "Visibility does not prove exclusive Observer attribution"],
    ["range", "Use range checks as diagnostics"],
    ["queue", "Schedule multiple rooms with one request per tick"],
    ["return-codes", "Handle Observer return codes"],
    ["stale-intel", "Expire old intel deliberately"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does observeRoom() make the room visible immediately?",
      "No. OK means the observation was scheduled. The target Room is expected on the next tick, not as proof from the same tick call.",
    ],
    [
      "Why save requestedAt in Memory?",
      "It distinguishes a same-tick request, the previous tick's result window, and an expired old request.",
    ],
    [
      "Does Game.rooms[targetRoom] prove the Observer caused visibility?",
      "No. Another Creep, structure, or vision source may already make the room visible. You can prove that the room was requested last tick and is visible now, not exclusive causation.",
    ],
    [
      "Should an Observer save the whole Room object?",
      "No. Save JSON-compatible summaries and timestamps. Live Room objects are rebuilt each tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-room-visibility",
    label: "Previous vision guide",
    title: "Understand Game.rooms Visibility",
  },
  next: {
    href: "/en/blog/screeps-pathfinder-costmatrix",
    label: "Next pathfinding guide",
    title: "Build a CostMatrix",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Call <code>observer.observeRoom(targetRoom)</code>, save the target and current <code>Game.time</code> only when the result is <code>OK</code>, and inspect <code>Game.rooms[targetRoom]</code> on the next tick. Process the previous request before writing the new request. Save a small timestamped summary, not the live Room object.</p>

<h2 id="official-rules">Observer rules that affect the workflow</h2>
<ul>
<li>An Observer becomes available at RCL 8.</li>
<li>The base <code>OBSERVER_RANGE</code> constant is 10 rooms.</li>
<li><code>OK</code> means the operation was scheduled successfully.</li>
<li>The observed Room is available on the next tick.</li>
<li>Invalid names, range, ownership, or inactive-structure conditions return error codes.</li>
<li>Power effects can change Observer capability, so the method return value remains the final request result.</li>
</ul>
<p>The scheduling result and the visibility result are separate states. Do not compress them into one boolean.</p>

<h2 id="timeline">Request and result timeline</h2>
<pre><code class="language-text">tick 200
read any request saved at tick 199
process Game.rooms[requestedRoom]
call observeRoom(nextRoom)
if result === OK, save requestedAt: 200

tick 201
read the request saved at tick 200
inspect Game.rooms[nextRoom]
then schedule another request</code></pre>
<p>If the target is already visible on tick 200 for another reason, that same-tick Room object still does not prove the new observation completed immediately.</p>

<h2 id="request-state">Store only an accepted request</h2>
<pre><code class="language-javascript">function createAcceptedObservationState(
  observer,
  targetRoom,
  result
) {
  if (result !== OK) {
    return null;
  }

  return {
    observerId: observer.id,
    observerRoom: observer.room.name,
    requestedRoom: targetRoom,
    requestedAt: Game.time
  };
}</code></pre>
<p>Writing request state after an error creates a false expectation on the next tick. The reader would report a missing result even though no observation was scheduled.</p>

<h2 id="result-reader">Read the previous request safely</h2>
<pre><code class="language-javascript">function getObservationResult(state) {
  if (
    !state
    || typeof state.requestedRoom !== 'string'
    || !Number.isInteger(state.requestedAt)
  ) {
    return {
      status: 'none',
      room: null
    };
  }

  if (state.requestedAt === Game.time) {
    return {
      status: 'waiting',
      room: null
    };
  }

  if (state.requestedAt !== Game.time - 1) {
    return {
      status: 'expired',
      room: null
    };
  }

  const room = Game.rooms[state.requestedRoom];

  return {
    status: room ? 'visible' : 'missing',
    room: room ?? null
  };
}</code></pre>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>none</code></td><td>No usable historical request</td></tr>
<tr><td><code>waiting</code></td><td>The request belongs to the current tick</td></tr>
<tr><td><code>visible</code></td><td>Requested last tick and the Room is available now</td></tr>
<tr><td><code>missing</code></td><td>Requested last tick but no Room is available now</td></tr>
<tr><td><code>expired</code></td><td>The state is older than the expected result window</td></tr>
</tbody></table></div>

<h2 id="intel-summary">Save a bounded room-intel summary</h2>
<p>Room objects, Creeps, Controllers, and Structures are live game objects. Save primitive fields and timestamps instead.</p>
<pre><code class="language-javascript">function summarizeObservedRoom(room) {
  const controller = room.controller;
  const mineral = room.find(FIND_MINERALS)[0] ?? null;

  return {
    roomName: room.name,
    observedAt: Game.time,
    controller: controller
      ? {
          owner: controller.owner?.username ?? null,
          reservation:
            controller.reservation?.username ?? null,
          level: controller.level
        }
      : null,
    sourceCount: room.find(FIND_SOURCES).length,
    mineralType: mineral?.mineralType ?? null,
    hostileCount:
      room.find(FIND_HOSTILE_CREEPS).length
  };
}

function saveRoomIntel(summary) {
  Memory.roomIntel ??= {};
  Memory.roomIntel[summary.roomName] = summary;
}</code></pre>
<p>This summary is intentionally small. Real combat or expansion planning may need Towers, Invader Cores, Nukes, deposits, room status, hostile combat parts, and confidence metadata.</p>

<h2 id="complete-loop">Complete single-target Observer loop</h2>
<p><strong>State impact:</strong> this loop writes Observer request state and room intel. It may submit one observation request per tick. It does not move Creeps or modify the observed room.</p>
<pre><code class="language-javascript">function getObservationResult(state) {
  if (
    !state
    || typeof state.requestedRoom !== 'string'
    || !Number.isInteger(state.requestedAt)
  ) {
    return { status: 'none', room: null };
  }

  if (state.requestedAt === Game.time) {
    return { status: 'waiting', room: null };
  }

  if (state.requestedAt !== Game.time - 1) {
    return { status: 'expired', room: null };
  }

  const room = Game.rooms[state.requestedRoom];
  return {
    status: room ? 'visible' : 'missing',
    room: room ?? null
  };
}

function summarizeObservedRoom(room) {
  const controller = room.controller;
  const mineral = room.find(FIND_MINERALS)[0] ?? null;

  return {
    roomName: room.name,
    observedAt: Game.time,
    controllerOwner:
      controller?.owner?.username ?? null,
    controllerReservation:
      controller?.reservation?.username ?? null,
    controllerLevel: controller?.level ?? 0,
    sourceCount: room.find(FIND_SOURCES).length,
    mineralType: mineral?.mineralType ?? null,
    hostileCount:
      room.find(FIND_HOSTILE_CREEPS).length
  };
}

function processPreviousObservation() {
  const result = getObservationResult(
    Memory.observerState
  );

  if (result.status === 'visible') {
    Memory.roomIntel ??= {};
    const summary = summarizeObservedRoom(
      result.room
    );
    Memory.roomIntel[summary.roomName] = summary;
  }

  if (
    result.status === 'missing'
    && Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'observer-result-missing',
      requestedRoom:
        Memory.observerState?.requestedRoom,
      requestedAt:
        Memory.observerState?.requestedAt
    }));
  }

  return result.status;
}

function requestObservation(observer, targetRoom) {
  const result = observer.observeRoom(targetRoom);

  if (result === OK) {
    Memory.observerState = {
      observerId: observer.id,
      observerRoom: observer.room.name,
      requestedRoom: targetRoom,
      requestedAt: Game.time
    };
  }

  return result;
}

module.exports.loop = function () {
  processPreviousObservation();

  const config = Memory.observerConfig;
  if (
    !config
    || typeof config.observerId !== 'string'
    || typeof config.targetRoom !== 'string'
  ) {
    return;
  }

  const observer = Game.getObjectById(
    config.observerId
  );

  if (
    !observer
    || observer.structureType !== STRUCTURE_OBSERVER
    || observer.my !== true
    || observer.isActive() !== true
  ) {
    return;
  }

  const result = requestObservation(
    observer,
    config.targetRoom
  );

  if (result !== OK && Game.time % 100 === 0) {
    console.log(JSON.stringify({
      type: 'observer-request-failed',
      observerId: observer.id,
      observerRoom: observer.room.name,
      targetRoom: config.targetRoom,
      result
    }));
  }
};</code></pre>
<p>The previous state is consumed before a new successful request can replace it. A production scheduler may also mark processed requests, preserve failure history, and avoid repeating an unchanged target every tick.</p>

<h2 id="attribution">Visibility does not prove exclusive Observer attribution</h2>
<p>The strongest statement this workflow supports is:</p>
<blockquote><p>The room was requested on the previous tick and is available now.</p></blockquote>
<p>A Creep, owned structure, another Observer, or another applicable vision source may also make the room visible. Do not write “Observer succeeded” merely because <code>Game.rooms[targetRoom]</code> exists without checking the stored request tick and the accepted return code.</p>

<h2 id="range">Use range checks as diagnostics</h2>
<pre><code class="language-javascript">function describeObserverDistance(
  observer,
  targetRoom
) {
  const linearDistance =
    Game.map.getRoomLinearDistance(
      observer.room.name,
      targetRoom
    );

  return {
    observerRoom: observer.room.name,
    targetRoom,
    linearDistance,
    baseRange: OBSERVER_RANGE,
    insideBaseRange:
      linearDistance <= OBSERVER_RANGE
  };
}</code></pre>
<p>This is a diagnostic, not permission to skip the method result. Power effects and invalid configuration still require the actual <code>observeRoom()</code> return code.</p>

<h2 id="queue">Schedule multiple rooms with one request per tick</h2>
<pre><code class="language-javascript">function getNextQueueItem(queue, index) {
  if (!Array.isArray(queue) || queue.length === 0) {
    return null;
  }

  const safeIndex = Number.isInteger(index)
    ? Math.abs(index) % queue.length
    : 0;

  return {
    roomName: queue[safeIndex],
    index: safeIndex
  };
}

function advanceQueueIndex(index, length) {
  if (!Number.isInteger(length) || length <= 0) {
    return 0;
  }

  return (index + 1) % length;
}</code></pre>
<p>Advance the index only after an accepted request. A complete scheduler also needs priorities, retry delays, Observer-to-target assignment, stale-intel deadlines, and explicit behavior for rooms outside base range.</p>

<h2 id="return-codes">Handle Observer return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return code</th><th>Interpretation</th><th>Next action</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Request scheduled</td><td>Save target and current tick</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Observer is not yours</td><td>Check ID and ownership</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Target is outside current capability</td><td>Check room names, distance, and effects</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Target room name is invalid</td><td>Validate configuration</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Structure is not active at the current RCL</td><td>Check Controller level and <code>isActive()</code></td></tr>
</tbody></table></div>
<p>Do not record a successful request state for any error code.</p>

<h2 id="stale-intel">Expire old intel deliberately</h2>
<pre><code class="language-javascript">function readFreshIntel(roomName, maxAge) {
  const intel = Memory.roomIntel?.[roomName];

  if (
    !intel
    || !Number.isInteger(intel.observedAt)
    || !Number.isInteger(maxAge)
    || maxAge < 0
  ) {
    return null;
  }

  return Game.time - intel.observedAt <= maxAge
    ? intel
    : null;
}</code></pre>
<p>The expiration threshold is a business policy. Combat routing may require much fresher data than mineral cataloging.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Validate the Observer ID and target room string.</li>
<li>Recover the structure with <code>Game.getObjectById()</code>.</li>
<li>Check structure type, ownership, and <code>isActive()</code>.</li>
<li>Save the exact <code>observeRoom()</code> return code.</li>
<li>Write request state only after <code>OK</code>.</li>
<li>Process the previous request before scheduling the next one.</li>
<li>Require <code>requestedAt === Game.time - 1</code> for the normal result window.</li>
<li>Save summaries and timestamps, not live Room objects.</li>
<li>Do not equate missing vision with a safe room.</li>
<li>Do not claim exclusive Observer attribution without additional evidence.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement multi-Observer assignment, <code>OPERATE_OBSERVER</code> scheduling, portals, shard reconnaissance, hostile-player reputation, confidence scoring, or compressed long-term intel. Continue with <a href="/en/blog/screeps-pathfinder-costmatrix">PathFinder CostMatrix construction</a> to use visible room structures in tile-level routing.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does OK mean the Room exists now?</h3>
<p>No. It means the request was scheduled.</p>
<h3>Why read before scheduling?</h3>
<p>Otherwise a new request can overwrite the target and tick needed to process the previous result.</p>
<h3>Can already-visible rooms be skipped?</h3>
<p>Yes as a scheduler policy, but the API does not require that policy.</p>
<h3>How long is intel valid?</h3>
<p>The game does not choose that for your application. Store <code>observedAt</code> and define a use-specific age limit.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureObserver.observeRoom" rel="nofollow">API Reference: StructureObserver.observeRoom()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureObserver" rel="nofollow">API Reference: StructureObserver</a></li>
<li><a href="https://docs.screeps.com/api/#Game-rooms" rel="nofollow">API Reference: Game.rooms</a></li>
<li><a href="https://docs.screeps.com/api/#Game-map.getRoomLinearDistance" rel="nofollow">API Reference: Game.map.getRoomLinearDistance()</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: Power Effects</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
