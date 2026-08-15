import type { EnglishBeginnerArticle } from "./english-beginner-content";

const UPDATED_SLUGS = new Set([
  "screeps-err-no-path",
  "screeps-move-fatigue-body-ratio",
  "screeps-spawncreep-return-codes",
  "screeps-working-state",
]);

function verification(
  docs: string,
  staticReview: string,
  liveBoundary: string,
  extra?: [string, string],
): Array<[string, string]> {
  return [
    ["Official documentation", docs],
    ...(extra ? [extra] : []),
    ["Static code review", staticReview],
    [
      "Chinese source article",
      "Existing bilingual mapping retained; this English-only pass did not use the Chinese page as live-game evidence",
    ],
    ["Console test pending", "Not run in this editorial pass"],
    ["Screeps Console test", "Pending — no real-shard Console transcript was collected for this revision"],
    ["Live multi-tick verification pending", liveBoundary],
    ["Last verified", "August 12, 2026"],
  ];
}

function patchErrNoPath(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps ERR_NO_PATH: Diagnose Range, Matrices, and Routes",
    headline: "How to Debug ERR_NO_PATH Without Confusing Search Cost with Movement Cost",
    description:
      "Diagnose Screeps ERR_NO_PATH by separating target range, PathFinder completion, CostMatrix blockers, search weights, cached-path ERR_NOT_FOUND, room callbacks, and cross-room route failures.",
    category: "MOVEMENT · PATHFINDING DEBUGGING",
    readingTime: "16 min read",
    breadcrumbLabel: "ERR_NO_PATH",
    tags: ["Screeps", "Movement", "PathFinder", "Debugging", "CostMatrix"],
    keywords: [
      "Screeps ERR_NO_PATH",
      "Screeps PathFinder incomplete",
      "Screeps CostMatrix",
      "PathFinder plainCost swampCost",
      "Screeps roomCallback false",
    ],
    primaryKeyword: "Screeps ERR_NO_PATH",
    searchIntent: "Diagnose a failed Screeps path search without confusing search weights, movement fatigue, cached paths, or traffic",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Creep.moveTo(), PathFinder.search(), CostMatrix, Game.map.findRoute(), range, maxOps, maxRooms, roomCallback, and incomplete",
      "Passed — search failure surfaces, PathFinder default weights, movement-fatigue boundary, walkable Ramparts, callbacks, and cross-room route checks reviewed",
      "No real-shard terrain, callback, or cross-room route trace was collected for this revision",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["three-results", "Separate three failure surfaces"],
      ["range", "Validate the goal range first"],
      ["two-cost-systems", "Do not confuse search cost with movement fatigue"],
      ["result", "Read the complete PathFinder result"],
      ["matrix", "Build a diagnostic CostMatrix"],
      ["callbacks", "Check callbacks and search limits"],
      ["cross-room", "Check the room-level route"],
      ["cached-path", "Handle noPathFinding separately"],
      ["traffic", "Separate traffic from search failure"],
      ["diagnostic", "Minimal diagnostic workflow"],
      ["scope", "What this guide does not prove"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide when <code>creep.moveTo()</code> returns <code>ERR_NO_PATH</code>, or when a direct <code>PathFinder.search()</code> returns <code>incomplete: true</code>. Do not use it for a movement call that returned <code>OK</code> and then failed to make position progress; that belongs in the <a href="/en/blog/screeps-moveto-not-moving">accepted-movement diagnostic</a>.</p>
<p>The first question is not “How do I increase <code>maxOps</code>?” It is “Which path boundary actually failed?” A wrong target range, a room rejected by a callback, a CostMatrix blocker, a deliberately disabled path search, and a genuinely exhausted search need different fixes.</p>

<h2 id="three-results">Separate three failure surfaces</h2>
<div class="table-scroll"><table>
<thead><tr><th>Signal</th><th>What it means</th><th>First place to look</th></tr></thead>
<tbody>
<tr><td><code>moveTo() === ERR_NO_PATH</code></td><td>The movement helper could not find a path for the current request.</td><td>Target, range, path options, obstacles, callbacks.</td></tr>
<tr><td><code>moveTo({ noPathFinding: true }) === ERR_NOT_FOUND</code></td><td>No reusable cached path was available while new pathfinding was disabled.</td><td>Cache/reuse policy, not CostMatrix tuning first.</td></tr>
<tr><td><code>PathFinder.search(...).incomplete === true</code></td><td>The search did not complete the requested goal; the returned path can still be partial.</td><td>Goal range, limits, callbacks, matrix, room route.</td></tr>
</tbody></table></div>
<pre><code class="language-javascript">const moveResult = creep.moveTo(target, {
  range: desiredRange,
  reusePath: 0
});

const search = PathFinder.search(
  creep.pos,
  { pos: target.pos, range: desiredRange }
);

console.log(JSON.stringify({
  moveResult,
  pathLength: search.path.length,
  ops: search.ops,
  cost: search.cost,
  incomplete: search.incomplete
}));</code></pre>
<p>A non-empty <code>search.path</code> is not proof of success. Check <code>incomplete</code> before treating the path as a completed route.</p>

<h2 id="range">Validate the goal range first</h2>
<p>Many Screeps targets occupy tiles a Creep cannot stand on. The official PathFinder documentation specifically warns that an unwalkable goal such as a Source should use a range of at least 1. Requesting <code>range: 0</code> can make an otherwise reachable task impossible.</p>
<pre><code class="language-javascript">function validGoal(target, range) {
  return Boolean(
    target?.pos
    && Number.isInteger(range)
    && range >= 0
  );
}

const goal = {
  pos: source.pos,
  range: 1
};</code></pre>
<p>Use the action's actual range: adjacent actions commonly need range 1, while build, repair, and Controller upgrading use range 3. If the Creep already satisfies the requested range, an empty path can be correct because no movement is needed.</p>

<h2 id="two-cost-systems">Do not confuse search cost with movement fatigue</h2>
<p><strong>PathFinder cost is a route-selection weight. Movement fatigue is a Creep movement mechanic.</strong> They can use similar numbers, but they answer different questions.</p>
<div class="table-scroll"><table>
<thead><tr><th>System</th><th>Plain</th><th>Swamp</th><th>Road</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td>Standalone <code>PathFinder.search()</code> defaults</td><td>1</td><td>5</td><td>Only preferred if your matrix gives the road a lower cost</td><td>Choose a route</td></tr>
<tr><td>Actual Creep movement fatigue rate</td><td>2</td><td>10</td><td>1</td><td>Determine fatigue generated by a move</td></tr>
</tbody></table></div>
<p>If you deliberately run PathFinder with <code>plainCost: 2</code>, <code>swampCost: 10</code>, and road tiles set to 1, you are choosing search weights that make roads cheaper than plains. Those values are <em>not</em> the standalone PathFinder defaults, and the resulting <code>search.cost</code> is not a live measurement of Creep fatigue.</p>
<pre><code class="language-javascript">const search = PathFinder.search(
  creep.pos,
  { pos: target.pos, range: desiredRange },
  {
    // Chosen search weights so road cost 1 is preferred.
    // PathFinder defaults are plain 1 / swamp 5.
    plainCost: 2,
    swampCost: 10,
    roomCallback(roomName) {
      const room = Game.rooms[roomName];
      if (!room) return undefined;
      return buildDiagnosticMatrix(room);
    }
  }
);</code></pre>
<p>For body weight and fatigue calculations, use the <a href="/en/blog/screeps-move-fatigue-body-ratio">movement-speed guide</a> instead of reading PathFinder cost as a speed metric.</p>

<h2 id="result">Read the complete PathFinder result</h2>
<p>Record the result before changing search limits:</p>
<pre><code class="language-javascript">const result = PathFinder.search(
  creep.pos,
  { pos: target.pos, range: desiredRange },
  {
    maxOps: 2000,
    maxRooms: 16
  }
);

console.log(JSON.stringify({
  pathLength: result.path.length,
  ops: result.ops,
  cost: result.cost,
  incomplete: result.incomplete
}));</code></pre>
<p><code>2000</code> operations and <code>16</code> rooms are the documented PathFinder defaults. They are not recommended production values for every bot. If a constrained diagnostic uses lower values, an incomplete path may be caused by your constraint rather than by an impossible world route.</p>

<h2 id="matrix">Build a diagnostic CostMatrix</h2>
<pre><code class="language-javascript">function buildDiagnosticMatrix(room) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (structure.structureType === STRUCTURE_ROAD) {
      costs.set(structure.pos.x, structure.pos.y, 1);
      continue;
    }

    const walkableRampart =
      structure.structureType === STRUCTURE_RAMPART
      && (
        structure.my === true
        || structure.isPublic === true
      );

    const walkable =
      structure.structureType === STRUCTURE_CONTAINER
      || walkableRampart;

    if (!walkable) {
      costs.set(structure.pos.x, structure.pos.y, 255);
    }
  }

  return costs;
}</code></pre>
<p>A CostMatrix value of 255 is unwalkable. Do not mark your own private Ramparts as blocked: your Creeps can pass them. Public Ramparts are also walkable. For a diagnostic matrix, keep this walkability rule visible so a Boolean mistake cannot silently remove the only route.</p>

<h2 id="callbacks">Check callbacks and search limits</h2>
<p>A <code>roomCallback</code> is a routing decision, not just a performance hook. Returning <code>false</code> rejects that room from the PathFinder search. Returning <code>undefined</code> leaves that room to default terrain handling when you have no custom matrix.</p>
<ul>
<li>Log which room names your callback rejects.</li>
<li>Check whether <code>maxRooms</code> excludes the destination or an unavoidable corridor.</li>
<li>Record <code>ops</code> before increasing <code>maxOps</code>.</li>
<li>Do not replace a broken matrix with an unlimited search budget.</li>
</ul>

<h2 id="cross-room">Check the room-level route</h2>
<pre><code class="language-javascript">const route = Game.map.findRoute(
  creep.pos.roomName,
  target.pos.roomName
);

if (route === ERR_NO_PATH) {
  console.log('No room-level route was found.');
}</code></pre>
<p>If your route callback returns <code>Infinity</code> for a required room, a room-level route can fail before local tile costs matter. Keep strategic room routing separate from local CostMatrix debugging.</p>

<h2 id="cached-path">Handle noPathFinding separately</h2>
<pre><code class="language-javascript">const cachedResult = creep.moveTo(target, {
  range: desiredRange,
  noPathFinding: true
});

if (cachedResult === ERR_NOT_FOUND) {
  const freshResult = creep.moveTo(target, {
    range: desiredRange,
    noPathFinding: false
  });

  console.log(JSON.stringify({
    cachedResult,
    freshResult
  }));
}</code></pre>
<p><code>ERR_NOT_FOUND</code> in this branch means the cache-only request had no usable path. It is not interchangeable with <code>ERR_NO_PATH</code>.</p>

<h2 id="traffic">Separate traffic from search failure</h2>
<p>A valid path can exist and <code>moveTo()</code> can return <code>OK</code> while the Creep later remains on the same tile because movement resolution, another movement call, fatigue, or traffic changed the outcome. That is not evidence that PathFinder failed. Track room-aware positions across later ticks and inspect the final movement intent instead.</p>

<h2 id="diagnostic">Minimal diagnostic workflow</h2>
<ol>
<li>Confirm the target exists and the requested range is reachable.</li>
<li>Separate <code>ERR_NO_PATH</code>, cache-only <code>ERR_NOT_FOUND</code>, and <code>PathFinder.incomplete</code>.</li>
<li>Inspect <code>path.length</code>, <code>ops</code>, <code>cost</code>, and <code>incomplete</code>.</li>
<li>Review CostMatrix blockers and owned/public Ramparts.</li>
<li>Log <code>roomCallback</code> rejections and search limits.</li>
<li>For cross-room work, check <code>Game.map.findRoute()</code>.</li>
<li>Only after the search succeeds, move on to traffic/fatigue diagnostics.</li>
</ol>

<h2 id="scope">What this guide does not prove</h2>
<p>This revision has current official-documentation review and offline code review. It does not include a real-shard path trace showing a particular room, CostMatrix, or cross-room route failing and then succeeding. Console and live multi-tick verification remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow noopener noreferrer">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.search" rel="nofollow noopener noreferrer">API Reference: PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder-CostMatrix" rel="nofollow noopener noreferrer">API Reference: PathFinder.CostMatrix</a></li>
<li><a href="https://docs.screeps.com/api/#Game.map.findRoute" rel="nofollow noopener noreferrer">API Reference: Game.map.findRoute()</a></li>
</ul>`,
  };
}

function patchFatigue(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "How to Calculate Screeps Creep Movement Speed",
    headline: "How to Calculate Screeps Creep Movement Speed",
    description:
      "Calculate unboosted Screeps Creep movement from terrain fatigue, active MOVE recovery, loaded CARRY weight, and damaged body parts without incorrectly removing destroyed non-CARRY parts from movement weight.",
    category: "MOVEMENT · FATIGUE AND BODY DESIGN",
    readingTime: "15 min read",
    breadcrumbLabel: "Movement Speed",
    tags: ["Screeps", "Movement", "Creeps", "MOVE", "Fatigue"],
    keywords: [
      "Screeps movement speed",
      "Screeps MOVE fatigue",
      "Screeps body MOVE ratio",
      "Screeps damaged body movement",
      "Screeps CARRY movement weight",
    ],
    primaryKeyword: "Screeps movement speed",
    searchIntent: "Calculate Creep movement interval from body weight, load, damage, MOVE recovery, and terrain",
    finalScore: 99,
    verification: verification(
      "Checked August 12, 2026 — Movement, Creep.fatigue, Creep.getActiveBodyparts(), MOVE, CARRY, terrain movement costs, and Store capacity",
      "Passed — unboosted body-weight calculator corrected so destroyed ordinary non-MOVE/non-CARRY parts still count as movement weight while active MOVE recovery and active loaded CARRY capacity remain separate",
      "No real-shard damaged-Creep or multi-terrain movement trace was collected for this revision",
      [
        "Engine source review",
        "Checked August 12, 2026 — screeps/engine movement implementation counts all non-MOVE/non-CARRY body entries as movement weight; loaded CARRY weight is calculated from active CARRY capacity",
      ],
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["four-rules", "The four movement rules"],
      ["damage-correction", "Destroyed ordinary parts still count as weight"],
      ["carry", "Count loaded CARRY separately"],
      ["formula", "Calculate the steady-state interval"],
      ["examples", "Road, plain, and swamp examples"],
      ["calculator", "Corrected unboosted calculator"],
      ["current-fatigue", "Separate body design from current fatigue"],
      ["ratios", "Use ratios as design constraints"],
      ["scope", "Boosts, pulling, and live proof"],
      ["official-docs", "Official documentation and source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide when a Creep moves more slowly than expected and you want to distinguish a body-design problem from current fatigue or terrain. The calculator below is deliberately limited to <strong>unboosted ordinary Creeps moving under their own power</strong>. Pulling and MOVE/CARRY boosts change the calculation and are outside this formula.</p>

<h2 id="four-rules">The four movement rules</h2>
<ul>
<li>Road, plain, and swamp movement generate fatigue at rates 1, 2, and 10 per movement-weight part.</li>
<li>Each active unboosted <code>MOVE</code> part removes 2 fatigue per tick.</li>
<li>Empty <code>CARRY</code> capacity does not add movement weight; carried resources make active CARRY capacity contribute weight.</li>
<li>Ordinary non-<code>MOVE</code>, non-<code>CARRY</code> body parts are movement weight even when those parts have been destroyed.</li>
</ul>
<p>The last rule is easy to miss. “Active body parts” matters for MOVE effectiveness and usable CARRY capacity, but it is not a general rule that destroyed WORK, ATTACK, HEAL, CLAIM, RANGED_ATTACK, or TOUGH parts stop contributing movement weight.</p>

<h2 id="damage-correction">Destroyed ordinary parts still count as weight</h2>
<p>The Screeps engine movement implementation calculates ordinary weight by counting body entries whose type is neither <code>MOVE</code> nor <code>CARRY</code>. It does not apply a <code>hits &gt; 0</code> filter to those ordinary weight parts. In contrast, movement ability depends on an active MOVE part.</p>
<pre><code class="language-javascript">function countOrdinaryWeightParts(creep) {
  return creep.body.filter(
    part => part.type !== MOVE && part.type !== CARRY
  ).length;
}</code></pre>
<p>That means this tempting implementation is wrong:</p>
<pre><code class="language-javascript">// Wrong for movement weight.
const ordinaryWeight = creep.body.filter(
  part =>
    part.hits > 0
    && part.type !== MOVE
    && part.type !== CARRY
).length;</code></pre>
<p>If a damaged Creep loses active MOVE parts while its ordinary body entries still contribute weight, its movement interval can become much worse than a calculator based only on surviving ordinary parts predicts.</p>

<h2 id="carry">Count loaded CARRY separately</h2>
<p>For an unboosted Creep, each active <code>CARRY</code> part provides 50 capacity. Empty CARRY does not weigh the Creep down. Use total resources in the Store, not only Energy:</p>
<pre><code class="language-javascript">function countLoadedCarryParts(creep) {
  const used = creep.store.getUsedCapacity() ?? 0;
  const activeCarry = creep.getActiveBodyparts(CARRY);

  if (used <= 0 || activeCarry <= 0) {
    return 0;
  }

  return Math.min(
    activeCarry,
    Math.ceil(used / CARRY_CAPACITY)
  );
}</code></pre>
<div class="table-scroll"><table>
<thead><tr><th>Active unboosted CARRY</th><th>Store used</th><th>Loaded CARRY weight</th></tr></thead>
<tbody>
<tr><td>3</td><td>0</td><td>0</td></tr>
<tr><td>3</td><td>1–50</td><td>1</td></tr>
<tr><td>3</td><td>51–100</td><td>2</td></tr>
<tr><td>3</td><td>101–150</td><td>3</td></tr>
</tbody></table></div>
<p>This helper is intentionally unboosted. CARRY boosts change capacity per active CARRY part, so a simple 50-capacity segmentation is no longer sufficient.</p>

<h2 id="formula">Calculate the steady-state interval</h2>
<pre><code class="language-text">weight = ordinary non-MOVE/non-CARRY body entries
       + loaded active CARRY weight

fatigue generated by a step = weight × terrain rate
MOVE recovery per tick       = active MOVE × 2

steady-state interval estimate = max(
  1,
  ceil(generated / recovery)
)</code></pre>
<p>This is a body-and-terrain estimate for repeated movement. It does not erase <code>creep.fatigue</code> that already exists at the moment you inspect the Creep.</p>

<h2 id="examples">Road, plain, and swamp examples</h2>
<p>A fully loaded <code>[WORK, CARRY, MOVE]</code> Creep has two weight parts and one active MOVE part:</p>
<div class="table-scroll"><table>
<thead><tr><th>Terrain entered</th><th>Fatigue generated</th><th>Recovery/tick</th><th>Estimated interval</th></tr></thead>
<tbody>
<tr><td>Road</td><td>2 × 1 = 2</td><td>2</td><td>1 tick/step</td></tr>
<tr><td>Plain</td><td>2 × 2 = 4</td><td>2</td><td>2 ticks/step</td></tr>
<tr><td>Swamp</td><td>2 × 10 = 20</td><td>2</td><td>10 ticks/step</td></tr>
</tbody></table></div>
<p>The relevant terrain is the tile being entered. Do not sample only the Creep's current tile and assume it proves the next step cost.</p>

<h2 id="calculator">Corrected unboosted calculator</h2>
<p><strong>State impact:</strong> this diagnostic reads body, Store, active MOVE/CARRY counts, and current fatigue. It does not move the Creep or write Memory.</p>
<pre><code class="language-javascript">const TERRAIN_FATIGUE = {
  road: 1,
  plain: 2,
  swamp: 10
};

function countLoadedCarryParts(creep) {
  const used = creep.store.getUsedCapacity() ?? 0;
  const activeCarry = creep.getActiveBodyparts(CARRY);

  if (used <= 0 || activeCarry <= 0) return 0;

  return Math.min(
    activeCarry,
    Math.ceil(used / CARRY_CAPACITY)
  );
}

function countMovementWeight(creep) {
  const ordinaryWeight = creep.body.filter(
    part => part.type !== MOVE && part.type !== CARRY
  ).length;

  return ordinaryWeight + countLoadedCarryParts(creep);
}

function estimateCreepMovement(creep, terrain) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  const terrainRate = TERRAIN_FATIGUE[terrain];
  if (!Number.isInteger(terrainRate)) {
    return { status: 'terrain-invalid' };
  }

  const activeMoveParts = creep.getActiveBodyparts(MOVE);
  const weightParts = countMovementWeight(creep);

  if (activeMoveParts <= 0) {
    return {
      status: 'no-active-move-part',
      activeMoveParts,
      weightParts,
      currentFatigue: creep.fatigue
    };
  }

  const fatigueGenerated = weightParts * terrainRate;
  const fatigueRemovedPerTick = activeMoveParts * 2;

  return {
    status: 'estimated-unboosted',
    activeMoveParts,
    weightParts,
    currentFatigue: creep.fatigue,
    fatigueGenerated,
    fatigueRemovedPerTick,
    ticksPerStep: Math.max(
      1,
      Math.ceil(fatigueGenerated / fatigueRemovedPerTick)
    )
  };
}</code></pre>
<p>The important correction is in <code>countMovementWeight()</code>: ordinary body entries are not filtered by <code>part.hits</code>.</p>

<h2 id="current-fatigue">Separate body design from current fatigue</h2>
<p>A good body ratio does not guarantee that a Creep can move this tick. Read <code>creep.fatigue</code> separately. Positive fatigue blocks normal self-movement until enough MOVE recovery removes it.</p>
<pre><code class="language-javascript">console.log(JSON.stringify({
  tick: Game.time,
  fatigue: creep.fatigue,
  activeMove: creep.getActiveBodyparts(MOVE),
  movement: estimateCreepMovement(creep, 'plain')
}));</code></pre>
<p>If the Creep is stationary, also check the actual movement return code. <code>ERR_TIRED</code> is a current-fatigue signal; <code>ERR_NO_BODYPART</code> is a no-active-MOVE signal. A static ratio estimate is not a substitute for those API results.</p>

<h2 id="ratios">Use ratios as design constraints</h2>
<p>For an unboosted, fully weighted Creep on plains, one active MOVE can recover the fatigue generated by roughly one weight part each tick. On roads, one MOVE can support more weight at one-tile-per-tick speed; on swamps, the same body needs far more MOVE recovery. Treat those as design math, not universal role templates.</p>
<p>Haulers deserve special attention because outbound empty CARRY may weigh nothing while the return trip is loaded. A body that is fast while empty can be deliberately slower when carrying resources.</p>

<h2 id="scope">Boosts, pulling, and live proof</h2>
<p>This calculator excludes MOVE boosts, CARRY capacity boosts, pulling, Power Creeps, and traffic. It also does not claim a live damaged-Creep trace. The damaged-body correction is grounded in the current Screeps engine movement implementation and static code review; live multi-tick verification remains pending.</p>

<h2 id="official-docs">Official documentation and source</h2>
<ul>
<li><a href="https://docs.screeps.com/creeps.html#Movement" rel="nofollow noopener noreferrer">Screeps movement and fatigue documentation</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.fatigue" rel="nofollow noopener noreferrer">API Reference: Creep.fatigue</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.getActiveBodyparts" rel="nofollow noopener noreferrer">API Reference: Creep.getActiveBodyparts()</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/movement.js" rel="nofollow noopener noreferrer">Official Screeps engine movement implementation</a></li>
</ul>`,
  };
}

function patchSpawnReturnCodes(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps spawnCreep() Errors: Diagnose Every Return Code",
    headline: "How to Diagnose spawnCreep() Return Codes",
    description:
      "Diagnose every current StructureSpawn.spawnCreep() return code, keep dryRun separate from the real request, interpret ERR_RCL_NOT_ENOUGH precisely, and account for explicit energyStructures and memory:any.",
    category: "SPAWN · RETURN-CODE DEBUGGING",
    readingTime: "15 min read",
    breadcrumbLabel: "spawnCreep() Return Codes",
    tags: ["Screeps", "Spawn", "Return Codes", "Debugging", "JavaScript"],
    keywords: [
      "Screeps spawnCreep return codes",
      "Screeps ERR_RCL_NOT_ENOUGH spawn",
      "Screeps ERR_NOT_ENOUGH_ENERGY spawnCreep",
      "Screeps spawnCreep dryRun",
      "Screeps energyStructures",
    ],
    primaryKeyword: "Screeps spawnCreep return codes",
    searchIntent: "Diagnose a failed spawnCreep request by return code and request state without blind retries",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — StructureSpawn.spawnCreep(), Structure.isActive(), body/name limits, opts.memory, energyStructures, dryRun, directions, and all documented return codes",
      "Passed — dry-run and real-call outcomes separated; ERR_RCL_NOT_ENOUGH narrowed to Spawn usability at current RCL; memory:any and explicit energyStructures boundaries retained",
      "No live Spawn request sequence or multi-tick spawning trace was collected for this revision",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["return-table", "Current return-code boundary"],
      ["rcl", "Interpret ERR_RCL_NOT_ENOUGH precisely"],
      ["energy", "Diagnose ERR_NOT_ENOUGH_ENERGY with request context"],
      ["args", "Validate body and name without inventing API rules"],
      ["memory", "Do not over-restrict opts.memory"],
      ["dry-run", "Keep dryRun and the real call separate"],
      ["diagnostic", "A useful diagnostic wrapper"],
      ["retry", "Do not retry every error the same way"],
      ["scope", "What static review does not prove"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this guide after <code>StructureSpawn.spawnCreep()</code> returns a non-<code>OK</code> code and you need to decide whether the request should wait, change, or fail closed. If you are making your first simple Creep, use the <a href="/en/blog/screeps-spawn-creep">beginner spawn lesson</a>; this page is the return-code troubleshooting layer.</p>

<h2 id="return-table">Current return-code boundary</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return</th><th>Documented boundary</th><th>Useful first check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The spawn operation was scheduled successfully.</td><td>Observe <code>spawn.spawning</code>; do not call the Creep “finished” yet.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>You do not own this Spawn.</td><td><code>spawn.my</code>.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>A Creep already has that name.</td><td><code>Game.creeps[name]</code> and your naming policy.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Spawn is already spawning another Creep.</td><td><code>spawn.spawning</code>.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>The energy sources available to this request do not contain enough Energy for the body.</td><td>Body cost plus default or explicit <code>energyStructures</code>.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body is invalid or the required name was not provided.</td><td>Body length/constants and name.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The current Room Controller level is insufficient to use this Spawn.</td><td><code>spawn.isActive()</code> and current RCL.</td></tr>
</tbody></table></div>
<p>Do not add undocumented meanings to a code just because two failures happen near the same subsystem. In particular, <code>ERR_RCL_NOT_ENOUGH</code> from <code>spawnCreep()</code> is a Spawn-usage/RCL boundary, not a generic “too many Spawns” response.</p>

<h2 id="rcl">Interpret ERR_RCL_NOT_ENOUGH precisely</h2>
<pre><code class="language-javascript">if (spawn.isActive() !== true) {
  console.log(JSON.stringify({
    type: 'spawn-inactive',
    roomName: spawn.room.name,
    rcl: spawn.room.controller?.level ?? null
  }));
}</code></pre>
<p>The base Structure API says <code>isActive()</code> is false when the Room Controller level is insufficient to use the structure. That makes it a useful diagnostic companion to <code>ERR_RCL_NOT_ENOUGH</code>. Do not rewrite the return code as a construction-limit error.</p>

<h2 id="energy">Diagnose ERR_NOT_ENOUGH_ENERGY with request context</h2>
<p>Without <code>energyStructures</code>, the spawn request can draw the required Energy from Spawns and Extensions in the room. If you provide an explicit <code>energyStructures</code> array, those structures define the request's Energy sources and are used in the supplied order.</p>
<p>This matters because <code>room.energyAvailable</code> can look sufficient while an intentionally restricted request still returns <code>ERR_NOT_ENOUGH_ENERGY</code>.</p>
<pre><code class="language-javascript">function bodyCost(body) {
  return body.reduce(
    (sum, part) => sum + BODYPART_COST[part],
    0
  );
}

console.log(JSON.stringify({
  roomEnergyAvailable: spawn.room.energyAvailable,
  bodyCost: bodyCost(body),
  explicitEnergyStructureCount:
    Array.isArray(opts.energyStructures)
      ? opts.energyStructures.length
      : null
}));</code></pre>
<p>The body cost is a local calculation. The method return code remains the source of truth for whether that specific request was accepted.</p>

<h2 id="args">Validate body and name without inventing API rules</h2>
<p>The current API documents a body of 1–50 valid body-part constants and a name with a maximum length of 100 characters. Keep local validation narrow enough that it does not reject API-valid requests for reasons you invented.</p>
<pre><code class="language-javascript">function validateSpawnShape(body, name) {
  const validParts = new Set([
    WORK, MOVE, CARRY, ATTACK,
    RANGED_ATTACK, HEAL, TOUGH, CLAIM
  ]);

  if (
    !Array.isArray(body)
    || body.length < 1
    || body.length > 50
    || body.some(part => !validParts.has(part))
  ) {
    return { valid: false, reason: 'body-invalid' };
  }

  if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
    return { valid: false, reason: 'name-invalid' };
  }

  return { valid: true, reason: 'shape-valid' };
}</code></pre>
<p>Do not try to reproduce every runtime condition in the validator. Ownership, busy state, RCL, name collision, and Energy can change independently and should still be handled from the actual API result.</p>

<h2 id="memory">Do not over-restrict opts.memory</h2>
<p>The optional <code>memory</code> field is documented as <code>any</code>. A role object such as <code>{ role: 'harvester' }</code> is a common and readable project convention, but it is not an API rule that Memory must be a non-null plain object.</p>
<pre><code class="language-javascript">const opts = {
  memory: {
    role: 'harvester',
    homeRoom: spawn.room.name
  }
};</code></pre>
<p>If your own bot requires an object schema, label that as a project contract and validate it at that boundary. Do not present it as a <code>spawnCreep()</code> restriction.</p>

<h2 id="dry-run">Keep dryRun and the real call separate</h2>
<p><code>dryRun: true</code> checks whether the operation is possible at that moment without starting spawning. It does not reserve the name, Spawn, or Energy for a later call.</p>
<pre><code class="language-javascript">const dryRunResult = spawn.spawnCreep(
  body,
  name,
  { ...opts, dryRun: true }
);

let spawnResult = null;

if (dryRunResult === OK) {
  spawnResult = spawn.spawnCreep(
    body,
    name,
    opts
  );
}

console.log(JSON.stringify({
  tick: Game.time,
  dryRunResult,
  spawnResult
}));</code></pre>
<p>Keep both values. If the dry run succeeds and the real call does not, the correct conclusion is not “Screeps contradicted itself.” It means the two calls are separate checks/submissions and your diagnostic should preserve the exact state and results rather than overwrite one with the other.</p>

<h2 id="diagnostic">A useful diagnostic wrapper</h2>
<pre><code class="language-javascript">function requestCreep(spawn, body, name, opts = {}) {
  if (!spawn) {
    return { status: 'spawn-missing' };
  }

  const shape = validateSpawnShape(body, name);
  if (!shape.valid) {
    return { status: shape.reason };
  }

  const dryRunResult = spawn.spawnCreep(
    body,
    name,
    { ...opts, dryRun: true }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      dryRunResult,
      spawnActive: spawn.isActive(),
      busy: Boolean(spawn.spawning),
      roomEnergyAvailable: spawn.room.energyAvailable,
      bodyCost: bodyCost(body)
    };
  }

  const spawnResult = spawn.spawnCreep(
    body,
    name,
    opts
  );

  return {
    status: spawnResult === OK
      ? 'spawn-request-accepted'
      : 'spawn-request-rejected',
    dryRunResult,
    spawnResult,
    spawnActive: spawn.isActive(),
    busy: Boolean(spawn.spawning),
    roomEnergyAvailable: spawn.room.energyAvailable,
    bodyCost: bodyCost(body)
  };
}</code></pre>
<p>This wrapper is diagnostic, not a full spawn queue. A production scheduler still needs demand, body policy, replacement timing, unique names, and retry rules.</p>

<h2 id="retry">Do not retry every error the same way</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical policy class</th></tr></thead>
<tbody>
<tr><td><code>ERR_BUSY</code></td><td>Wait for the Spawn to become free.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Wait, reduce the body, or change the explicit Energy-source policy.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>Generate/choose a different name or recognize the already-existing Creep.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Fix the request; blind retry will repeat the same invalid input.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Fix Spawn selection.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Fix/await the RCL and structure-usability condition; do not treat it as an Energy retry.</td></tr>
</tbody></table></div>

<h2 id="scope">What static review does not prove</h2>
<p>This revision verifies the current documented return boundary and code branches offline. It does not contain a live Spawn transcript showing dry-run acceptance, a real submission, and later completion. Console and live multi-tick verification remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow noopener noreferrer">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#Structure.isActive" rel="nofollow noopener noreferrer">API Reference: Structure.isActive()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawning" rel="nofollow noopener noreferrer">API Reference: StructureSpawn.spawning</a></li>
</ul>`,
  };
}

function patchWorkingState(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps Working State: Switch Only at Empty and Full",
    headline: "Use Store Boundaries as Hysteresis, Not a Tick Toggle",
    description:
      "Build a stable Screeps working state from empty/full Store boundaries, preserve the previous phase at partial Energy, initialize partial state explicitly, and write Memory only when the phase changes.",
    category: "FOUNDATION · WORKING STATE",
    readingTime: "13 min read",
    breadcrumbLabel: "Working State",
    tags: ["Screeps", "Memory", "Creep", "State Machine", "Store"],
    keywords: [
      "Screeps working state",
      "creep.memory.working",
      "Screeps Creep state machine",
      "Screeps Store boundaries",
      "Screeps Memory state change",
    ],
    primaryKeyword: "Screeps working state",
    searchIntent: "Stop a Creep from task-flapping by using persistent empty/full resource boundaries and explicit partial-state policy",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Memory, Creep.memory, Store.getUsedCapacity(), getFreeCapacity(), getCapacity(), and game-loop timing",
      "Passed — empty/full hysteresis, partial-state preservation, first-run policy, invalid Store handling, change-only Memory writes, and action/state boundaries reviewed",
      "No live multi-tick worker trace was collected showing Store boundaries and phase transitions in a real room",
    ),
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["contract", "Define the phase contract"],
      ["hysteresis", "Use empty and full as hysteresis"],
      ["decision", "Make the decision pure"],
      ["partial", "Handle uninitialized partial Energy explicitly"],
      ["write", "Write Memory only when the phase changes"],
      ["action-boundary", "Keep state transition and action result separate"],
      ["not-universal", "Do not force this cycle onto every role"],
      ["diagnostic", "Minimal diagnostic loop"],
      ["scope", "What static review does not prove"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this pattern when one Creep alternates between acquiring Energy and spending Energy, and you want the phase to persist across ticks without reversing after every small resource change. The <code>working</code> field is your own Memory contract; Screeps does not provide a built-in “working state.”</p>
<p>If the role is a fixed upgrader that refills from a nearby Link or Container while continuing to work, a full-to-empty cycle may be the wrong policy. This page is about a two-phase worker, not every possible role.</p>

<h2 id="contract">Define the phase contract</h2>
<pre><code class="language-text">working = false
  acquire Energy

working = true
  spend Energy on the assigned task</code></pre>
<p>Keep that meaning stable. Do not let one module interpret <code>working: true</code> as “has any Energy” while another interprets it as “currently executing a work action.” The field is a decision state, not proof that an action succeeded.</p>

<h2 id="hysteresis">Use empty and full as hysteresis</h2>
<p>Two boundaries create a stable cycle:</p>
<ul>
<li>When carried Energy reaches <strong>0</strong>, switch to acquisition.</li>
<li>When free Energy capacity reaches <strong>0</strong>, switch to working.</li>
<li>At partial Energy, keep the previous initialized phase.</li>
</ul>
<pre><code class="language-text">0 / 50   -> acquire
50 / 50  -> work
30 / 50  -> keep previous phase</code></pre>
<p>This is hysteresis: the transition into each phase happens at a different boundary. It avoids the task-flapping produced by <code>creep.memory.working = !creep.memory.working</code> or by switching to work as soon as <code>usedEnergy &gt; 0</code>.</p>

<h2 id="decision">Make the decision pure</h2>
<pre><code class="language-javascript">function decideWorkingState(input) {
  const {
    usedEnergy,
    freeEnergy,
    totalCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergy)
    || !Number.isFinite(totalCapacity)
    || usedEnergy < 0
    || freeEnergy < 0
    || totalCapacity <= 0
  ) {
    return {
      valid: false,
      changed: false,
      working: previousWorking === true,
      reason: 'invalid-store-values'
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      changed: previousWorking !== false,
      working: false,
      reason: 'energy-empty'
    };
  }

  if (freeEnergy === 0) {
    return {
      valid: true,
      changed: previousWorking !== true,
      working: true,
      reason: 'energy-full'
    };
  }

  if (typeof previousWorking === 'boolean') {
    return {
      valid: true,
      changed: false,
      working: previousWorking,
      reason: 'partial-keep-previous'
    };
  }

  return {
    valid: true,
    changed: true,
    working: false,
    reason: 'partial-initialized'
  };
}</code></pre>
<p>The function has no Screeps side effects. You can test empty, full, partial, invalid, and first-run inputs without a live room.</p>

<h2 id="partial">Handle uninitialized partial Energy explicitly</h2>
<p>A Creep can enter this code with partial Energy while <code>creep.memory.working</code> is undefined—for example after a schema change or after another system initialized the Creep differently. The API does not define what your custom boolean should become.</p>
<p>This guide chooses acquisition mode for an uninitialized partial Creep:</p>
<pre><code class="language-text">partial Energy + no previous boolean
-> working = false
-> reason = partial-initialized</code></pre>
<p>That is a project policy, not an official Screeps rule. An emergency repair role could choose the opposite. The quality requirement is that the first-run rule is explicit and deterministic.</p>

<h2 id="write">Write Memory only when the phase changes</h2>
<p>Do not teach a persistent-state machine by rewriting the same boolean and “last checked tick” on every tick. Calculate first, then write the durable phase only when needed.</p>
<pre><code class="language-javascript">function updateWorkingState(creep) {
  const decision = decideWorkingState({
    usedEnergy:
      creep.store.getUsedCapacity(RESOURCE_ENERGY),
    freeEnergy:
      creep.store.getFreeCapacity(RESOURCE_ENERGY),
    totalCapacity:
      creep.store.getCapacity(RESOURCE_ENERGY),
    previousWorking: creep.memory.working
  });

  if (!decision.valid) {
    return decision;
  }

  if (decision.changed) {
    creep.memory.working = decision.working;
  }

  return decision;
}</code></pre>
<p><code>decision.changed</code> is useful for debugging and for limiting persistent writes. If you need transition history, keep it bounded and only append on real transitions rather than on every loop call.</p>

<h2 id="action-boundary">Keep state transition and action result separate</h2>
<p>The state decision chooses which branch should run. It does not prove that the branch's game action succeeded.</p>
<pre><code class="language-javascript">const decision = updateWorkingState(creep);

if (!decision.valid) {
  console.log(JSON.stringify({
    type: 'working-state-invalid',
    creepName: creep.name,
    reason: decision.reason
  }));
  return;
}

if (decision.working) {
  const result = creep.upgradeController(controller);
  // Handle result separately.
} else {
  const result = creep.harvest(source);
  // Handle result separately.
}</code></pre>
<p>Submitting <code>harvest()</code> does not mean Store is already fuller in the current JavaScript execution, and submitting <code>upgradeController()</code> does not mean Store is already empty. Read the next tick's Store state and let the resource boundary drive the later transition.</p>
<p>Likewise, if the action returns <code>ERR_NOT_IN_RANGE</code>, movement is a separate operation. Keep the action result and movement result in different variables rather than changing the working phase because a movement call returned <code>OK</code>.</p>

<h2 id="not-universal">Do not force this cycle onto every role</h2>
<ul>
<li><strong>Fixed upgrader:</strong> may withdraw locally and continue upgrading without waiting to fill completely.</li>
<li><strong>Dedicated hauler:</strong> may use source/destination assignment rather than a generic “working” boolean.</li>
<li><strong>Emergency repairer:</strong> may deliberately begin spending partial Energy before reaching full capacity.</li>
<li><strong>Miner:</strong> often has a fixed position and a different resource-flow contract.</li>
</ul>
<p>The empty/full pattern is a reusable state machine, not a universal role architecture.</p>

<h2 id="diagnostic">Minimal diagnostic loop</h2>
<p><strong>State impact:</strong> this example may update only <code>creep.memory.working</code> when the phase changes. It does not submit a movement or work action.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  if (!creep || creep.spawning === true) return;

  const decision = updateWorkingState(creep);

  if (!decision.valid || decision.changed) {
    console.log(JSON.stringify({
      tick: Game.time,
      creepName: creep.name,
      working: decision.working,
      changed: decision.changed,
      reason: decision.reason,
      usedEnergy:
        creep.store.getUsedCapacity(RESOURCE_ENERGY),
      freeEnergy:
        creep.store.getFreeCapacity(RESOURCE_ENERGY)
    }));
  }
};</code></pre>
<p>This produces a smaller, more meaningful log: invalid state and actual phase transitions, not one line every tick.</p>

<h2 id="scope">What static review does not prove</h2>
<p>The boundary cases and Memory-write policy are reviewable offline. This revision does not contain a live multi-tick transcript of a Creep filling, switching, draining, and switching back. Console and live verification remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Global Objects: Memory</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow noopener noreferrer">API Reference: Creep.memory</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getUsedCapacity" rel="nofollow noopener noreferrer">API Reference: Store.getUsedCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow noopener noreferrer">API Reference: Store.getFreeCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getCapacity" rel="nofollow noopener noreferrer">API Reference: Store.getCapacity()</a></li>
</ul>`,
  };
}

function patchBeginnerSpawnRcl(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const oldMeaning = "The room Controller level does not allow another Spawn operation under the relevant structure limit.";
  const newMeaning = "The current Room Controller level is insufficient to use this Spawn.";
  const oldCheck = "Check room ownership/RCL and Spawn availability.";
  const newCheck = "Check the room Controller level and whether spawn.isActive() is true.";

  return {
    ...article,
    articleHtml: article.articleHtml
      .replace(oldMeaning, newMeaning)
      .replace(oldCheck, newCheck),
  };
}

export function applyEnglishEditorialSecond20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  switch (article.slug) {
    case "screeps-err-no-path":
      return patchErrNoPath(article);
    case "screeps-move-fatigue-body-ratio":
      return patchFatigue(article);
    case "screeps-spawncreep-return-codes":
      return patchSpawnReturnCodes(article);
    case "screeps-working-state":
      return patchWorkingState(article);
    case "screeps-spawn-creep":
      return patchBeginnerSpawnRcl(article);
    default:
      return article;
  }
}

export function getEnglishEditorialSecondUpdatedAt20260812(
  slug: string,
): string | undefined {
  return UPDATED_SLUGS.has(slug) ? "2026-08-12" : undefined;
}
