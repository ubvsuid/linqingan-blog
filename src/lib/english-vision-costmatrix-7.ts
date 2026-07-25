import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishCostMatrixArticle = {
  slug: "screeps-pathfinder-costmatrix",
  path: "/en/blog/screeps-pathfinder-costmatrix",
  chinesePath: "/blog/screeps-pathfinder-costmatrix",
  title: "Screeps CostMatrix Guide: Roads, Obstacles, and Costs",
  headline: "How to Build a Safe PathFinder CostMatrix in Screeps",
  description:
    "Use CostMatrix values 0–255 correctly, classify roads and structures, separate invisible rooms from blocked rooms, layer dynamic Creep costs, validate coordinates, and reject incomplete PathFinder results.",
  category: "PATHFINDING · COSTMATRIX AND ROOM CALLBACKS",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "PathFinder CostMatrix",
  tags: ["Screeps", "PathFinder", "CostMatrix", "Routing", "Traffic"],
  keywords: [
    "Screeps PathFinder CostMatrix",
    "Screeps roomCallback false undefined",
    "CostMatrix road cost 255",
    "Screeps PathFinder incomplete",
    "Screeps obstacle pathfinding",
  ],
  primaryKeyword: "Screeps PathFinder CostMatrix",
  searchIntent: "Build and debug a room CostMatrix for structures, traffic, and custom avoidance",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — CostMatrix values, roomCallback, search results, serialize(), deserialize() and moveByPath()"],
    ["Visibility boundary", "undefined keeps terrain-only search; false deliberately prevents searching the room"],
    ["Override boundary", "Custom medium costs never replace an existing 255 obstacle"],
    ["JavaScript syntax", "Passed"],
    ["Offline matrix review", "Passed — roads, Containers, owned Ramparts, obstacles, Creep overlays, custom costs and coordinate bounds"],
    ["Screeps Console test", "Pending"],
    ["Live PathFinder, CPU and multi-tick traffic test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["cost-levels", "Understand values 0 through 255"],
    ["default-terrain", "CostMatrix does not replace terrain by default"],
    ["structures", "Classify roads and structures"],
    ["visibility", "Return undefined for an invisible room"],
    ["custom-costs", "Protect obstacles from later custom costs"],
    ["complete-builder", "Complete visible-room matrix builder"],
    ["search-example", "Complete PathFinder search and movement example"],
    ["goal-range", "Choose a reachable goal range"],
    ["incomplete", "A non-empty path can still be incomplete"],
    ["static-dynamic", "Separate static and dynamic matrix layers"],
    ["serialization", "Serialize only versioned static data"],
    ["move-result", "Path search and movement are separate stages"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does CostMatrix value 0 mean free movement?",
      "No. Zero means the tile keeps its terrain cost. A non-zero matrix value overrides the terrain cost.",
    ],
    [
      "What does CostMatrix value 255 mean?",
      "It is treated as unwalkable. Use a lower finite value when a tile should remain possible but less desirable.",
    ],
    [
      "Should roomCallback return false when a room is not visible?",
      "Not automatically. Returning false forbids the room. Return undefined when you want terrain-only search through an invisible room, and false only for an explicit block policy.",
    ],
    [
      "Does search.path.length greater than zero prove a complete path?",
      "No. PathFinder can return a partial path with incomplete true. Check both fields and log ops and cost for diagnosis.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-observer-observe-room",
    label: "Previous vision guide",
    title: "Schedule Observer Vision",
  },
  next: {
    href: "/en/blog/screeps-err-no-path",
    label: "Related debugging guide",
    title: "Debug ERR_NO_PATH",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>A <code>PathFinder.CostMatrix</code> overlays custom navigation costs on one room. Leave a tile at <code>0</code> to use terrain cost, write a value from <code>1</code> to <code>254</code> to override it, and use <code>255</code> only when the tile must be unwalkable. In <code>roomCallback</code>, return <code>undefined</code> for terrain-only search and <code>false</code> only to ban the room.</p>

<h2 id="cost-levels">Understand values 0 through 255</h2>
<div class="table-scroll"><table>
<thead><tr><th>Matrix value</th><th>PathFinder meaning</th><th>Typical use</th></tr></thead>
<tbody>
<tr><td><code>0</code></td><td>Use the tile's terrain cost</td><td>No custom override</td></tr>
<tr><td><code>1–254</code></td><td>Use the custom cost</td><td>Road preference, congestion, risk</td></tr>
<tr><td><code>255</code></td><td>Unwalkable</td><td>Solid structure or hard block</td></tr>
</tbody></table></div>
<p>Zero is not a free tile. It is the default value in a new matrix and means that PathFinder should continue using terrain.</p>

<h2 id="default-terrain">CostMatrix does not replace terrain by default</h2>
<p>PathFinder understands plain, swamp, and wall terrain without a matrix. It does not automatically add your buildings, Creeps, temporary traffic rules, or custom danger zones. A matrix supplements terrain rather than replacing the entire map.</p>
<pre><code class="language-javascript">const costs = new PathFinder.CostMatrix();

console.log({
  untouchedTileCost: costs.get(10, 10),
  meaning: 'use-terrain-cost'
});</code></pre>
<p>The example search below uses <code>plainCost: 2</code> and <code>swampCost: 10</code> so a Road can use cost <code>1</code>. The API defaults are lower; choose values as one coherent scale and avoid inflating every cost without a reason.</p>

<h2 id="structures">Classify roads and structures</h2>
<p>The source article uses a deliberately simple policy:</p>
<ul>
<li>Road: cost 1.</li>
<li>Container: leave at 0 so terrain decides.</li>
<li>Owned Rampart: leave at 0.</li>
<li>Other structures in this simplified policy: 255.</li>
</ul>
<pre><code class="language-javascript">function getStructureCost(structure) {
  if (structure.structureType === STRUCTURE_ROAD) {
    return 1;
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0;
  }

  if (
    structure.structureType === STRUCTURE_RAMPART
    && structure.my === true
  ) {
    return 0;
  }

  return 255;
}</code></pre>
<p>This is an implementation policy, not an exhaustive classification of every special structure or portal case. Extend it only after defining which objects are walkable for the Creep and server context you support.</p>

<h2 id="visibility">Return undefined for an invisible room</h2>
<pre><code class="language-javascript">function createRoomCallback(blockedRooms, creepId) {
  return function roomCallback(roomName) {
    if (blockedRooms.has(roomName)) {
      return false;
    }

    const room = Game.rooms[roomName];

    if (!room) {
      return undefined;
    }

    return buildCostMatrix(room, creepId);
  };
}</code></pre>
<p>Returning <code>false</code> means PathFinder will not search that room. If every invisible room returns <code>false</code>, a cross-room search can fail merely because your script lacks vision. Use <code>false</code> for an explicit deny list, not as a generic substitute for missing data.</p>

<h2 id="custom-costs">Protect obstacles from later custom costs</h2>
<p>A later write can overwrite an earlier matrix value. Read the current value before applying a medium-cost avoidance rule.</p>
<pre><code class="language-javascript">function isValidRoomCoordinate(value) {
  return Number.isInteger(value)
    && value >= 0
    && value <= 49;
}

function applyCustomAvoidance(costs, entries) {
  if (!Array.isArray(entries)) {
    return;
  }

  for (const item of entries) {
    if (
      !item
      || !isValidRoomCoordinate(item.x)
      || !isValidRoomCoordinate(item.y)
    ) {
      continue;
    }

    const current = costs.get(item.x, item.y);

    if (current < 255) {
      costs.set(
        item.x,
        item.y,
        Math.max(current, 20)
      );
    }
  }
}</code></pre>
<p>This preserves a hard obstacle. The cost <code>20</code> is an example policy and should be evaluated relative to your plain, swamp, road, and route costs.</p>

<h2 id="complete-builder">Complete visible-room matrix builder</h2>
<p><strong>State impact:</strong> the builder reads the visible Room and its Memory. It creates a transient matrix and does not submit movement or write Memory.</p>
<pre><code class="language-javascript">function isValidRoomCoordinate(value) {
  return Number.isInteger(value)
    && value >= 0
    && value <= 49;
}

function getStructureCost(structure) {
  if (structure.structureType === STRUCTURE_ROAD) {
    return 1;
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0;
  }

  if (
    structure.structureType === STRUCTURE_RAMPART
    && structure.my === true
  ) {
    return 0;
  }

  return 255;
}

function buildCostMatrix(room, movingCreepId) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    const cost = getStructureCost(structure);

    if (cost > 0) {
      costs.set(
        structure.pos.x,
        structure.pos.y,
        cost
      );
    }
  }

  for (const other of room.find(FIND_CREEPS)) {
    if (other.id !== movingCreepId) {
      costs.set(
        other.pos.x,
        other.pos.y,
        255
      );
    }
  }

  const customAvoid = Array.isArray(
    room.memory.trafficAvoid
  )
    ? room.memory.trafficAvoid
    : [];

  for (const item of customAvoid) {
    if (
      !item
      || !isValidRoomCoordinate(item.x)
      || !isValidRoomCoordinate(item.y)
    ) {
      continue;
    }

    const current = costs.get(item.x, item.y);

    if (current < 255) {
      costs.set(
        item.x,
        item.y,
        Math.max(current, 20)
      );
    }
  }

  return costs;
}</code></pre>
<p>Marking every other Creep as <code>255</code> is conservative. It can create traffic deadlocks or unnecessary detours, so live multi-Creep behavior remains a separate verification requirement.</p>

<h2 id="search-example">Complete PathFinder search and movement example</h2>
<p><strong>State impact:</strong> this code runs PathFinder and may submit one movement order through <code>moveByPath()</code>. It does not cache the matrix.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.PathTarget;

  if (!creep || !target || creep.spawning) {
    return;
  }

  const blockedRooms = new Set(
    Array.isArray(Memory.blockedRooms)
      ? Memory.blockedRooms
      : []
  );

  const search = PathFinder.search(
    creep.pos,
    { pos: target.pos, range: 1 },
    {
      plainCost: 2,
      swampCost: 10,
      maxOps: 4000,
      maxRooms: 8,
      roomCallback(roomName) {
        if (blockedRooms.has(roomName)) {
          return false;
        }

        const room = Game.rooms[roomName];
        if (!room) {
          return undefined;
        }

        return buildCostMatrix(room, creep.id);
      }
    }
  );

  if (search.incomplete || search.path.length === 0) {
    if (Game.time % 100 === 0) {
      console.log(JSON.stringify({
        type: 'path-search-incomplete',
        creepName: creep.name,
        targetRoom: target.pos.roomName,
        pathLength: search.path.length,
        operations: search.ops,
        cost: search.cost,
        incomplete: search.incomplete
      }));
    }
    return;
  }

  const result = creep.moveByPath(search.path);

  if (
    result !== OK
    && result !== ERR_TIRED
    && Game.time % 20 === 0
  ) {
    console.log(JSON.stringify({
      type: 'move-by-path-failed',
      creepName: creep.name,
      roomName: creep.room.name,
      result
    }));
  }
};</code></pre>

<h2 id="goal-range">Choose a reachable goal range</h2>
<p>A Source, Mineral, Controller, and most solid Structures cannot be occupied by a Creep. Searching to <code>range: 0</code> for an unwalkable target wastes work and may finish incomplete. Use the action's real required range.</p>
<div class="table-scroll"><table>
<thead><tr><th>Goal</th><th>Typical range decision</th></tr></thead>
<tbody>
<tr><td>Source or Mineral</td><td>1 for harvest</td></tr>
<tr><td>Container or selected walkable tile</td><td>0 when the tile itself is the goal</td></tr>
<tr><td>Construction Site</td><td>3 for build</td></tr>
<tr><td>Damaged Structure</td><td>3 for repair</td></tr>
<tr><td>Controller</td><td>3 for upgrade</td></tr>
</tbody></table></div>
<p>Confirm the target API instead of applying one range to every task.</p>

<h2 id="incomplete">A non-empty path can still be incomplete</h2>
<pre><code class="language-javascript">function describeSearch(search) {
  return {
    complete:
      search.incomplete === false
      && search.path.length > 0,
    incomplete: search.incomplete,
    pathLength: search.path.length,
    operations: search.ops,
    cost: search.cost
  };
}</code></pre>
<p>PathFinder can return a partial path toward the best position it reached. Low <code>maxOps</code>, low <code>maxRooms</code>, low <code>maxCost</code>, blocked rooms, an unreachable range, or an over-restrictive matrix can all produce an incomplete result.</p>

<h2 id="static-dynamic">Separate static and dynamic matrix layers</h2>
<pre><code class="language-text">static layer
roads + structures + fixed danger policy

per-search dynamic layer
current Creeps + temporary blocks + task-specific costs</code></pre>
<p>Structures change less often than Creep positions. Caching a matrix containing dynamic Creeps can preserve stale obstacles after they move. Restore or clone a versioned static matrix, then overlay current traffic for the search that needs it.</p>
<pre><code class="language-javascript">function addDynamicCreeps(staticCosts, room, movingId) {
  const costs = staticCosts.clone();

  for (const other of room.find(FIND_CREEPS)) {
    if (other.id !== movingId) {
      costs.set(other.pos.x, other.pos.y, 255);
    }
  }

  return costs;
}</code></pre>

<h2 id="serialization">Serialize only versioned static data</h2>
<pre><code class="language-javascript">function saveStaticMatrix(roomName, version, costs) {
  Memory.matrixCache ??= {};
  Memory.matrixCache[roomName] = {
    version,
    builtAt: Game.time,
    serialized: costs.serialize()
  };
}

function loadStaticMatrix(roomName, version) {
  const entry = Memory.matrixCache?.[roomName];

  if (!entry || entry.version !== version) {
    return null;
  }

  return PathFinder.CostMatrix.deserialize(
    entry.serialized
  );
}</code></pre>
<p>A production invalidation contract may include layout version, room ownership, structure changes, fixed-danger version, and whether dynamic objects were included. Serialization saves reconstruction work only when invalidation and Memory cost are measured.</p>

<h2 id="move-result">Path search and movement are separate stages</h2>
<div class="table-scroll"><table>
<thead><tr><th>Stage</th><th>Representative result</th><th>What it proves</th></tr></thead>
<tbody>
<tr><td>PathFinder</td><td><code>incomplete: false</code></td><td>A complete path was found under the supplied model</td></tr>
<tr><td>Movement</td><td><code>moveByPath() === OK</code></td><td>The movement command was accepted this tick</td></tr>
<tr><td>Live outcome</td><td>Position changes over ticks</td><td>The Creep actually progresses under traffic and fatigue</td></tr>
</tbody></table></div>
<p><code>moveByPath()</code> may still return <code>ERR_NOT_FOUND</code>, <code>ERR_INVALID_ARGS</code>, <code>ERR_TIRED</code>, <code>ERR_NO_BODYPART</code>, or <code>ERR_BUSY</code>. One accepted command does not prove the remaining route will stay clear.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm origin, target, and required range.</li>
<li>Keep matrix value 0 distinct from cost 1.</li>
<li>Use 255 only for hard obstacles.</li>
<li>Return <code>false</code> only for explicitly blocked rooms.</li>
<li>Return <code>undefined</code> when an invisible room may use terrain-only search.</li>
<li>Validate custom coordinates from Memory.</li>
<li>Never overwrite a 255 obstacle with a medium cost.</li>
<li>Exclude the moving Creep from its own dynamic obstacle layer.</li>
<li>Check <code>incomplete</code>, path length, ops, and cost together.</li>
<li>Record <code>moveByPath()</code> separately from the search result.</li>
<li>Measure CPU before adding a broad cache.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement traffic reservations, push logic, portals, shard paths, combat damage fields, special-room policies, automatic matrix invalidation, or live CPU benchmarks. Use <a href="/en/blog/screeps-err-no-path">the ERR_NO_PATH debugging guide</a> when the search still cannot complete.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is zero cheaper than a Road cost of one?</h3>
<p>No. Zero delegates to terrain, while one explicitly overrides the tile cost.</p>
<h3>Why not use 255 for every risky tile?</h3>
<p>Because 255 removes the tile from consideration. Use a finite cost when the route should remain available.</p>
<h3>Can an invisible room still be searched?</h3>
<p>Yes with terrain-only data when the callback returns <code>undefined</code>. Returning <code>false</code> bans it.</p>
<h3>Should dynamic Creeps be stored in a long-term matrix cache?</h3>
<p>Usually not without strict invalidation. Their positions change every tick.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#PathFinder" rel="nofollow">API Reference: PathFinder</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.CostMatrix" rel="nofollow">API Reference: PathFinder.CostMatrix</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.search" rel="nofollow">API Reference: PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveByPath" rel="nofollow">API Reference: Creep.moveByPath()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
