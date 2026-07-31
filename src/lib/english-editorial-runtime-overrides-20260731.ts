import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishCostMatrixArticle } from "./english-vision-costmatrix-7";
import { englishGlobalCacheArticle } from "./english-runtime-global-cache-8";
import { englishSegmentsArticle } from "./english-runtime-segments-8";

const costMatrixHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when a custom <code>PathFinder.CostMatrix</code> is part of the problem: a route avoids roads, walks through structures, rejects an invisible room, or returns an incomplete path after you added custom costs. Start with one visible room and one goal range. Traffic policy and cross-room routing come later.</p>
<p>Use <a href="/en/blog/screeps-err-no-path">the ERR_NO_PATH diagnostic</a> when the immediate question is why a movement search failed. This page owns the matrix design itself.</p>

<h2 id="mental-model">A matrix overrides terrain; it does not describe the whole room</h2>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>Meaning</th><th>Use</th></tr></thead>
<tbody>
<tr><td><code>0</code></td><td>Keep the configured plain or swamp cost</td><td>No custom override</td></tr>
<tr><td><code>1–254</code></td><td>Use this custom movement cost</td><td>Road preference, traffic, or risk</td></tr>
<tr><td><code>255</code></td><td>Unwalkable</td><td>Solid structures or an explicit hard block</td></tr>
</tbody></table></div>
<p>A new matrix contains zeros. Zero is not free movement. Terrain still applies through <code>plainCost</code> and <code>swampCost</code>.</p>

<h2 id="static-matrix">Build the static structure layer first</h2>
<pre><code class="language-javascript">function isWalkableStructure(structure) {
  if (
    structure.structureType === STRUCTURE_ROAD
    || structure.structureType === STRUCTURE_CONTAINER
    || structure.structureType === STRUCTURE_PORTAL
  ) {
    return true;
  }

  return structure.structureType === STRUCTURE_RAMPART
    && (structure.my === true || structure.isPublic === true);
}

function buildStaticMatrix(room) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (structure.structureType === STRUCTURE_ROAD) {
      costs.set(structure.pos.x, structure.pos.y, 1);
      continue;
    }

    if (!isWalkableStructure(structure)) {
      costs.set(structure.pos.x, structure.pos.y, 255);
    }
  }

  return costs;
}</code></pre>
<p>This policy keeps Roads cheap, allows Containers, Portals, and owned or public Ramparts, and blocks other structures. It is deliberately narrower than a full colony policy. Add special cases only when you can explain why a Creep should cross that tile.</p>

<h2 id="traffic-layer">Clone the static layer before adding current traffic</h2>
<pre><code class="language-javascript">function addTrafficCosts(
  staticCosts,
  room,
  movingCreepId
) {
  const costs = staticCosts.clone();

  for (const other of room.find(FIND_CREEPS)) {
    if (other.id === movingCreepId) {
      continue;
    }

    const current = costs.get(
      other.pos.x,
      other.pos.y
    );

    if (current < 255) {
      costs.set(
        other.pos.x,
        other.pos.y,
        Math.max(current, 10)
      );
    }
  }

  return costs;
}</code></pre>
<p>A soft cost keeps occupied tiles possible when traffic must unwind. Marking every other Creep as <code>255</code> can turn temporary congestion into an artificial no-path result. The value <code>10</code> is an example policy and must be read relative to your Road, plain, and swamp costs.</p>

<h2 id="search-workflow">Search, inspect, then submit movement</h2>
<pre><code class="language-javascript">function moveWithMatrix(creep, target, range) {
  if (!creep || !target) {
    return { status: 'input-missing' };
  }

  if (creep.pos.inRangeTo(target, range)) {
    return { status: 'already-in-range' };
  }

  const search = PathFinder.search(
    creep.pos,
    { pos: target.pos, range },
    {
      plainCost: 2,
      swampCost: 10,
      maxOps: 4000,
      maxRooms: 8,
      roomCallback(roomName) {
        const room = Game.rooms[roomName];

        if (!room) {
          return undefined;
        }

        return addTrafficCosts(
          buildStaticMatrix(room),
          room,
          creep.id
        );
      }
    }
  );

  if (search.incomplete) {
    return {
      status: 'search-incomplete',
      pathLength: search.path.length,
      ops: search.ops,
      cost: search.cost
    };
  }

  if (search.path.length === 0) {
    return {
      status: 'no-steps-returned',
      pathLength: 0,
      ops: search.ops,
      cost: search.cost
    };
  }

  return {
    status: 'movement-submitted',
    moveResult: creep.moveByPath(search.path),
    pathLength: search.path.length,
    ops: search.ops,
    cost: search.cost
  };
}</code></pre>
<p>Returning <code>undefined</code> from <code>roomCallback</code> leaves the room on terrain-only costs when it is not visible. Return <code>false</code> only for an explicit room ban. A completed search and an accepted movement intent still do not prove that the Creep changed position during the same script execution.</p>

<h2 id="empty-and-incomplete">Do not collapse every empty path into one error</h2>
<p>An empty path has different meanings depending on the starting state. The Creep may already satisfy the requested range, or the search may have produced no step. Check range before the search and check <code>search.incomplete</code> afterward. A non-empty partial path can still be incomplete.</p>
<p>Low <code>maxOps</code>, low <code>maxRooms</code>, blocked callbacks, an impossible goal range, and an over-restrictive matrix are separate causes. Record the actual goal, range, <code>ops</code>, <code>cost</code>, path length, and incomplete flag before changing several settings at once.</p>

<h2 id="cache-boundary">Cache only the static layer</h2>
<p>Structures change less often than Creep positions. A production cache may keep a versioned static matrix in <code>global</code>, but it must rebuild after a global reset and clone before adding current traffic. Do not cache a matrix that already contains yesterday's Creep positions.</p>
<p>Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> for the reset and invalidation contract. Use the current page for the matrix contents.</p>

<h2 id="verify-ticks">Current tick and later ticks</h2>
<p><code>PathFinder.search()</code> describes the search performed now. <code>moveByPath()</code> submits one movement intent for the current tick. To verify progress, record <code>roomName:x:y</code> and compare a later tick. This revision contains official-document review, syntax checks, and static analysis only; live traffic and multi-room observations remain pending.</p>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-err-no-path">the path-search diagnostic</a> for <code>ERR_NO_PATH</code>, callback rejection, or an incomplete search. Use <a href="/en/blog/screeps-moveto-not-moving">the accepted-movement diagnostic</a> when movement returns <code>OK</code> but position does not change across later ticks.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#PathFinder.search" rel="nofollow">API Reference: PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.CostMatrix" rel="nofollow">API Reference: PathFinder.CostMatrix</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveByPath" rel="nofollow">API Reference: Creep.moveByPath()</a></li>
</ul>`;

const globalCacheHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when a value is expensive to rebuild but safe to lose: a sorted ID list, compiled configuration, static room index, or other derived data. Durable decisions still belong in Memory or Segments. A global cache is useful only when every caller remains correct after the cache disappears.</p>

<h2 id="lifetime">The runtime may keep global data, but it owes you no lifetime</h2>
<pre><code class="language-javascript">global.runtimeInfo ??= {
  startedAt: Game.time,
  loopCalls: 0
};

global.runtimeInfo.loopCalls += 1;

const runtimeSnapshot = {
  startedAt: global.runtimeInfo.startedAt,
  currentTick: Game.time,
  loopCalls: global.runtimeInfo.loopCalls
};</code></pre>
<p>This can show that the current runtime survived several ticks. It cannot identify why an earlier runtime ended, and it is not durable history. Code deployment, server behavior, or another global reset can remove the object before the next tick.</p>

<h2 id="cache-contract">Define the rebuild and invalidation contract first</h2>
<div class="table-scroll"><table>
<thead><tr><th>Question</th><th>Required answer</th></tr></thead>
<tbody>
<tr><td>What is the source of truth?</td><td>Current game state, code, Memory, or an active Segment</td></tr>
<tr><td>How is the value rebuilt?</td><td>A deterministic builder or a safe slower path</td></tr>
<tr><td>When is it stale?</td><td>Explicit version change, age limit, or confirmed state change</td></tr>
<tr><td>What happens after reset?</td><td>The next caller rebuilds or returns a clear unavailable status</td></tr>
</tbody></table></div>
<p>“It was present last tick” is not an invalidation policy.</p>

<h2 id="minimal-cache">Cache one concrete derived value</h2>
<pre><code class="language-javascript">function getRoomIndexCache() {
  global.roomIndexCache ??= new Map();
  return global.roomIndexCache;
}

function getVisibleRoomIndex(
  room,
  version,
  maxAge = 100
) {
  if (
    !room
    || !Number.isInteger(version)
    || !Number.isInteger(maxAge)
    || maxAge < 0
  ) {
    return {
      status: 'arguments-invalid',
      sourceIds: [],
      structureIds: []
    };
  }

  const cache = getRoomIndexCache();
  const entry = cache.get(room.name);
  const fresh = Boolean(
    entry
    && entry.version === version
    && Game.time - entry.builtAt <= maxAge
  );

  if (fresh) {
    return {
      status: 'cache-hit',
      sourceIds: [...entry.sourceIds],
      structureIds: [...entry.structureIds]
    };
  }

  const next = {
    version,
    builtAt: Game.time,
    sourceIds: room.find(FIND_SOURCES)
      .map(source => source.id)
      .sort(),
    structureIds: room.find(FIND_STRUCTURES)
      .map(structure => structure.id)
      .sort()
  };

  cache.set(room.name, next);

  return {
    status: entry
      ? 'cache-rebuilt'
      : 'cache-created',
    sourceIds: [...next.sourceIds],
    structureIds: [...next.structureIds]
  };
}</code></pre>
<p>The builder requires current room visibility. The returned arrays are copies, so a caller cannot reorder or delete the cached arrays accidentally. The example version must change when your cache contract changes; the age limit is a fallback, not proof that the room layout stayed unchanged.</p>

<h2 id="resolve-current-objects">Cache IDs, then resolve current objects</h2>
<pre><code class="language-javascript">function resolveCurrentObjects(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids
    .map(id => Game.getObjectById(id))
    .filter(object => object !== null);
}</code></pre>
<p>Do not keep a Creep, Room, Structure, Source, or other live game object for reuse on later ticks. Cache its ID or derived primitive data and recover the current object when needed. A <code>null</code> result can mean the object is gone or currently outside vision; do not erase remote plans until your visibility policy can distinguish those cases.</p>

<h2 id="explicit-version">Invalidate from an explicit state version</h2>
<pre><code class="language-javascript">function getRoomLayoutVersion(roomName) {
  const value = Memory.roomLayoutVersion?.[roomName];

  return Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function bumpRoomLayoutVersion(roomName) {
  Memory.roomLayoutVersion ??= {};
  Memory.roomLayoutVersion[roomName] =
    getRoomLayoutVersion(roomName) + 1;

  return Memory.roomLayoutVersion[roomName];
}</code></pre>
<p>Increment the version after your code confirms a layout change that affects the derived value. Do not increment it every tick. A reset removes the cache but not the persistent version, so the next visible-room read can rebuild under the same contract.</p>

<h2 id="failure-boundaries">Failure boundaries</h2>
<ul>
<li>If the room is not visible and no safe stale result exists, return <code>visibility-required</code> instead of fabricating current data.</li>
<li>If the builder throws, keep the old entry untouched or return a clear build failure.</li>
<li>If keys can grow without bound, add deterministic eviction.</li>
<li>If callers need mutable data, return a copy or a type-specific clone.</li>
<li>If rebuilding several entries can exceed the current CPU budget, stagger warm-up work.</li>
</ul>

<h2 id="verify-ticks">How to verify across ticks</h2>
<p>Record the runtime start tick, cache status, cache version, and builder inputs. Compare at least one cache hit with one rebuild. A separate real global-reset observation is required before claiming reset recovery. This revision does not contain measured CPU savings or a fabricated reset transcript.</p>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-memory-basics">the Memory guide</a> when the value must survive a reset. Use <a href="/en/blog/screeps-rawmemory-segments">the Segments guide</a> for larger persistent strings. Use <a href="/en/blog/screeps-pathfinder-costmatrix">the CostMatrix guide</a> when the cached value is specifically a static navigation layer.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Understanding the game loop, time, and ticks</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
</ul>`;

const segmentsHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when data must persist outside ordinary Memory and your code can follow a request-now, read-later lifecycle. The central problem is activation coordination. A Segment is not a synchronous object that becomes readable immediately after <code>setActiveSegments()</code>.</p>

<h2 id="official-boundaries">The boundaries that shape the design</h2>
<div class="table-scroll"><table>
<thead><tr><th>Boundary</th><th>Consequence</th></tr></thead>
<tbody>
<tr><td>IDs are <code>0–99</code></td><td>Reject fractional, negative, and greater-than-99 IDs</td></tr>
<tr><td>Up to 10 active Segments</td><td>Prioritize and report deferred requests</td></tr>
<tr><td>100 KB per Segment</td><td>Measure encoded bytes before writing</td></tr>
<tr><td>Activation applies on a later tick</td><td>Separate request and read stages</td></tr>
<tr><td>The last activation call wins</td><td>Make one final call from one manager</td></tr>
</tbody></table></div>

<h2 id="timeline">Request on one tick, read on a later tick</h2>
<pre><code class="language-text">tick N
modules request Segment 7
one manager calls setActiveSegments([7])

tick N + 1
RawMemory.segments[7] may be available
read and validate the existing string
write a replacement string only after a valid read
request the next active set</code></pre>
<p><code>undefined</code> means the Segment is not available to the current script. An empty string means the active Segment currently contains no data. Treating both states as empty can overwrite persistent data after an activation mistake.</p>

<h2 id="activation-manager">Collect requests and call the API once</h2>
<pre><code class="language-javascript">function getSegmentRequests() {
  global.segmentRequests ??= new Map();
  return global.segmentRequests;
}

function requestSegment(id, priority = 0) {
  if (
    !Number.isInteger(id)
    || id < 0
    || id > 99
    || !Number.isFinite(priority)
  ) {
    return false;
  }

  const requests = getSegmentRequests();
  const previous = requests.get(id);

  requests.set(
    id,
    previous === undefined
      ? priority
      : Math.max(previous, priority)
  );

  return true;
}

function finalizeSegmentRequests() {
  const requests = getSegmentRequests();
  const ranked = [...requests.entries()]
    .sort(
      (a, b) => b[1] - a[1] || a[0] - b[0]
    );
  const active = ranked
    .slice(0, 10)
    .map(([id]) => id);
  const deferred = ranked
    .slice(10)
    .map(([id]) => id);

  RawMemory.setActiveSegments(active);
  requests.clear();

  return { activeNextTick: active, deferred };
}</code></pre>
<p>Call <code>finalizeSegmentRequests()</code> once, after every module has requested its IDs. Store a compact plan in Memory only when another tick needs to know which request was scheduled.</p>

<h2 id="read-payload">Distinguish unavailable, empty, corrupt, and ready</h2>
<pre><code class="language-javascript">function readSegment(id, expectedVersion) {
  const raw = RawMemory.segments[id];

  if (raw === undefined) {
    return {
      status: 'unavailable',
      data: null
    };
  }

  if (raw === '') {
    return {
      status: 'empty',
      data: {}
    };
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed?.version !== expectedVersion
      || !parsed.data
      || typeof parsed.data !== 'object'
      || Array.isArray(parsed.data)
    ) {
      return {
        status: 'schema-mismatch',
        data: null
      };
    }

    return {
      status: 'ready',
      data: parsed.data
    };
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
<p>Do not replace an invalid or mismatched payload automatically. Preserve the original string until a migration, rollback, or recovery policy succeeds.</p>

<h2 id="write-payload">Write only to an active Segment after validation</h2>
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
  const bytes = new TextEncoder()
    .encode(raw).length;

  if (bytes > 100 * 1024) {
    return {
      ok: false,
      status: 'segment-too-large',
      bytes
    };
  }

  RawMemory.segments[id] = raw;

  return {
    ok: true,
    status: 'segment-written',
    bytes
  };
}</code></pre>
<p>JavaScript character count is not a reliable UTF-8 byte count for non-ASCII content. Keep production payloads below the hard boundary and test the byte counter in the target runtime.</p>

<h2 id="complete-workflow">Minimal read, merge, write workflow</h2>
<pre><code class="language-javascript">function updateIntelSegment() {
  const segmentId = 7;
  const version = 1;

  requestSegment(segmentId, 100);

  const current = readSegment(
    segmentId,
    version
  );

  if (
    current.status !== 'ready'
    && current.status !== 'empty'
  ) {
    return {
      status: current.status,
      activation: finalizeSegmentRequests()
    };
  }

  const nextData = {
    ...current.data,
    lastSeenTick: Game.time
  };
  const writeResult = writeSegment(
    segmentId,
    version,
    nextData
  );

  return {
    status: writeResult.status,
    writeResult,
    activation: finalizeSegmentRequests()
  };
}</code></pre>
<p>On the first tick this commonly returns <code>unavailable</code> while scheduling Segment 7. On a later tick it can read the active string and write a replacement. A larger application should finalize activation outside the feature function so all modules share one final call.</p>

<h2 id="production-notes">Production adaptation notes</h2>
<ul>
<li>Keep persistent job state in Memory or a Segment payload, not in the disposable request map.</li>
<li>Report deferred IDs instead of silently pretending more than 10 requests were accepted.</li>
<li>Use explicit schema migrations; a version mismatch is not automatically corrupt data.</li>
<li>Define merge behavior for nested records instead of relying on a shallow object spread.</li>
<li>Use double buffering only after documenting the pointer, recovery, and activation protocol.</li>
<li>Keep public and foreign Segment APIs outside the private active-Segment manager unless the application truly needs them.</li>
</ul>

<h2 id="verify-ticks">How to verify across ticks</h2>
<p>Record the requested IDs and <code>Game.time</code>, then inspect availability on a later tick. Test unavailable, empty, valid, invalid-JSON, schema-mismatch, deferred, and too-large states separately. This revision contains no fabricated Segment contents or live activation transcript.</p>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-memory-basics">the Memory guide</a> for small durable application state. Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> when the value is disposable and cheap enough to rebuild after a reset.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RawMemory.setActiveSegments" rel="nofollow">API Reference: RawMemory.setActiveSegments()</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.segments" rel="nofollow">API Reference: RawMemory.segments</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.setPublicSegments" rel="nofollow">API Reference: RawMemory.setPublicSegments()</a></li>
</ul>`;

const pendingVerification = (
  technicalCorrection: string,
  specificPending: string,
): Array<[string, string]> => [
  ["Chinese source article", "Reviewed in full"],
  ["Official documentation", "Checked against the linked Screeps API and game-loop documentation"],
  ["Technical correction", technicalCorrection],
  ["JavaScript syntax", "Passed by the editorial batch gate"],
  ["Evidence level", "Official documentation review, repository review, syntax checks, and static analysis only"],
  ["Screeps Console test", "Pending"],
  ["Live multi-tick verification", "Pending"],
  [specificPending, "Pending"],
  ["Last editorial review", "July 31, 2026"],
];

export const englishEditorialRuntimeOverrides20260731 = {
  "screeps-pathfinder-costmatrix": {
    ...englishCostMatrixArticle,
    title: "Screeps CostMatrix: Static Costs, Traffic, and Incomplete Paths",
    headline: "Build a CostMatrix Without Hiding the Real Path Failure",
    description:
      "Build a static structure matrix, layer current traffic per search, preserve invisible-room routing, and diagnose empty or incomplete paths before submitting movement.",
    category: "PATHFINDING · COSTMATRIX DIAGNOSTICS",
    readingTime: "13 min read",
    tags: ["PathFinder", "CostMatrix", "Movement", "Debugging"],
    keywords: [
      "Screeps CostMatrix",
      "PathFinder roomCallback",
      "Screeps incomplete path",
      "Screeps traffic costs",
      "Screeps structure walkability",
    ],
    primaryKeyword: "Screeps CostMatrix",
    searchIntent:
      "Build and debug one CostMatrix without confusing structure costs, traffic, visibility, or incomplete path search",
    finalScore: 98,
    verification: pendingVerification(
      "Static structure costs, per-search traffic overlays, invisible-room fallback, and incomplete-path handling are separated",
      "Live CostMatrix traffic and cross-room test",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["mental-model", "A matrix overrides terrain"],
      ["static-matrix", "Build the static structure layer"],
      ["traffic-layer", "Layer current traffic"],
      ["search-workflow", "Search, inspect, then move"],
      ["empty-and-incomplete", "Empty and incomplete paths"],
      ["cache-boundary", "Cache only the static layer"],
      ["verify-ticks", "Current tick and later ticks"],
      ["choose-another-guide", "Choose another guide when"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: costMatrixHtml,
  },
  "screeps-global-cache": {
    ...englishGlobalCacheArticle,
    title: "Screeps Global Cache: Rebuildable Data Across Runtime Ticks",
    headline: "Build a Global Cache That Can Disappear Safely",
    description:
      "Cache derived IDs and plain data in global, rebuild after resets, invalidate with explicit versions, and keep callers correct when the cache is missing or stale.",
    category: "RUNTIME · REBUILDABLE GLOBAL CACHE",
    readingTime: "12 min read",
    tags: ["Global", "Cache", "Memory", "Performance"],
    keywords: [
      "Screeps global cache",
      "Screeps global reset",
      "Screeps cache invalidation",
      "cache object IDs Screeps",
      "Screeps global vs Memory",
    ],
    primaryKeyword: "Screeps global cache",
    searchIntent:
      "Implement one rebuildable global cache without treating disposable runtime data as persistent state",
    finalScore: 98,
    verification: pendingVerification(
      "The cache contract now leads with rebuildability, explicit invalidation, copied values, and current-tick object resolution",
      "Live global-reset and cache-invalidation test",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["lifetime", "What global lifetime guarantees"],
      ["cache-contract", "Define the cache contract"],
      ["minimal-cache", "Cache one derived value"],
      ["resolve-current-objects", "Resolve current objects from IDs"],
      ["explicit-version", "Invalidate with a version"],
      ["failure-boundaries", "Failure boundaries"],
      ["verify-ticks", "How to verify across ticks"],
      ["choose-another-guide", "Choose another guide when"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: globalCacheHtml,
  },
  "screeps-rawmemory-segments": {
    ...englishSegmentsArticle,
    title: "Screeps RawMemory Segments: Request, Read, and Write Across Ticks",
    headline: "Use RawMemory Segments Without Same-Tick Assumptions",
    description:
      "Request active Segment IDs once, read them on a later tick, distinguish unavailable from empty, validate versioned JSON, and write only after a successful read.",
    category: "STORAGE · SEGMENT ACTIVATION LIFECYCLE",
    readingTime: "13 min read",
    tags: ["RawMemory", "Segments", "Memory", "Persistence"],
    keywords: [
      "Screeps RawMemory Segments",
      "setActiveSegments next tick",
      "RawMemory.segments undefined",
      "Screeps Segment manager",
      "Screeps Segment 100 KB",
    ],
    primaryKeyword: "Screeps RawMemory Segments",
    searchIntent:
      "Implement one coordinated request-read-write Segment lifecycle without same-tick activation assumptions",
    finalScore: 98,
    verification: pendingVerification(
      "Activation requests, later-tick availability, payload validation, and writes are separated into explicit states",
      "Live Segment activation and persistence test",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["official-boundaries", "Official Segment boundaries"],
      ["timeline", "Request now, read later"],
      ["activation-manager", "Call activation once"],
      ["read-payload", "Read each payload state"],
      ["write-payload", "Write after validation"],
      ["complete-workflow", "Minimal read-merge-write workflow"],
      ["production-notes", "Production adaptation notes"],
      ["verify-ticks", "How to verify across ticks"],
      ["choose-another-guide", "Choose another guide when"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: segmentsHtml,
  },
} satisfies Record<string, EnglishBeginnerArticle>;
