import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishSpawnEgressBatchNineteenArticles = [
  {
    slug: "screeps-spawn-exit-blocked",
    path: "/en/blog/screeps-spawn-exit-blocked",
    chinesePath: "/blog/screeps-spawn-exit-blocked",
    title: "Screeps Spawn Exit Blocked: directions and Egress Recovery",
    headline: "How to Diagnose a Creep That Finishes Spawning but Cannot Exit",
    description:
      "Distinguish normal spawn time from blocked egress, inspect all eight adjacent tiles, use spawnCreep directions and Spawning.setDirections safely, move owned blockers, and verify release on a later tick without cancelling the Creep.",
    category: "SPAWNING · EXIT BLOCKAGE DIAGNOSIS",
    publishedAt: "2026-08-06",
    publishedLabel: "August 6, 2026",
    readingTime: "20 min read",
    breadcrumbLabel: "Spawn Exit Blocked",
    tags: ["Screeps", "Spawn", "Creeps", "Movement", "Debugging"],
    keywords: [
      "Screeps Spawn exit blocked",
      "Screeps Creep stuck spawning",
      "Screeps spawnCreep directions",
      "StructureSpawn Spawning setDirections",
      "Screeps Spawn egress",
    ],
    primaryKeyword: "Screeps Spawn exit blocked",
    searchIntent:
      "Diagnose a Spawn whose Creep has completed its timer but cannot leave an allowed adjacent tile",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official API", "Checked — StructureSpawn.spawning, spawnCreep() directions, Spawning.setDirections(), Spawning.cancel(), and Creep.spawning"],
      ["Public engine source", "Checked — allowed-direction order, terrain and obstacle checks, movement tile occupancy, later-tick retry, and Spawn release"],
      ["Evidence boundary", "An open current snapshot is not a guarantee because final movement contention is not fully exposed through the public API"],
      ["JavaScript syntax", "Passed by repository code-block checks"],
      ["Offline egress review", "Passed — direction order, static blockers, current occupants, redirection, throttled logging, and later-tick verification states"],
      ["Screeps Console test", "Pending"],
      ["Live multi-Creep traffic, hostile occupancy, Power effects, and CPU-cost test", "Pending"],
      ["Last verified", "August 6, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["identify-state", "Identify the exact Spawn state"],
      ["four-similar-cases", "Separate four similar cases"],
      ["spawning-fields", "Read the Spawning fields"],
      ["engine-behavior", "Why blocked egress extends spawning"],
      ["scan-eight-directions", "Scan all eight directions"],
      ["snapshot-boundary", "Treat an open snapshot as provisional"],
      ["directions-contract", "Use directions as an ordered allowed set"],
      ["redirect-current-spawn", "Redirect the current spawning Creep"],
      ["clear-owned-blockers", "Move owned blockers to staging tiles"],
      ["do-not-cancel", "Do not cancel a valid Creep for traffic"],
      ["rate-limited-state", "Record sustained blockage without log spam"],
      ["complete-guard", "Build a complete egress guard"],
      ["layout-prevention", "Prevent the blockage in room layout"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and limitations"],
      ["faq", "Frequently asked questions"],
      ["official-docs", "Official documentation and source"],
    ],
    faq: [
      [
        "Does remainingTime equal to zero prove that the Creep has left the Spawn?",
        "No. Also verify that spawn.spawning is null and that the exact Creep has spawning equal to false on a later tick.",
      ],
      [
        "Can I call moveTo() on the Creep while creep.spawning is true?",
        "Most Creep actions return ERR_BUSY while the Creep is still spawning. Control egress through the Spawn directions instead.",
      ],
      [
        "Does setDirections() returning OK prove that the Creep exited?",
        "No. It proves only that the direction update was accepted. Observe the Spawn and exact Creep on a later tick.",
      ],
      [
        "Should I call spawning.cancel() when every exit is occupied?",
        "Usually no. Cancellation does not refund the Energy already spent. Redirect or clear traffic first.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-spawncreep-return-codes",
      label: "Previous spawning guide",
      title: "Diagnose spawnCreep() Return Codes",
    },
    next: {
      href: "/en/blog/screeps-creep-prespawn-replacement",
      label: "Next lifecycle guide",
      title: "Schedule a Replacement Before Death",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>When a Spawn still has a <code>spawning</code> object after <code>remainingTime</code> reaches zero, stop debugging body cost and room Energy. Inspect the Spawn's allowed directions and all eight adjacent tiles. A wall, blocking structure, blocking construction site, current Creep, Power Creep, or unresolved movement contention can prevent the new Creep from leaving.</p>
<p>Use <code>spawn.spawning.setDirections()</code> to submit currently usable directions, move owned blockers to explicit staging tiles, and verify the exact Spawn and Creep on a later tick. Do not cancel a valid Creep merely to clear traffic because cancelled spawning does not refund the Energy already spent.</p>

<h2 id="identify-state">Identify the exact Spawn state</h2>
<pre><code class="language-javascript">function getSpawnEgressState(spawn) {
  if (!spawn) {
    return {
      status: 'spawn-missing'
    };
  }

  if (!spawn.spawning) {
    return {
      status: 'idle'
    };
  }

  return {
    status: spawn.spawning.remainingTime &lt;= 0
      ? 'egress-pending'
      : 'spawning',
    spawnName: spawn.name,
    creepName: spawn.spawning.name,
    needTime: spawn.spawning.needTime,
    remainingTime: spawn.spawning.remainingTime,
    directions: [...spawn.spawning.directions]
  };
}</code></pre>
<p>The relevant state is <code>egress-pending</code>: the timer has completed, but the Spawn has not released the exact Creep. If <code>remainingTime</code> is still positive, the Spawn is normally building body parts.</p>

<h2 id="four-similar-cases">Separate four similar cases</h2>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>Meaning</th><th>Next guide or action</th></tr></thead>
<tbody>
<tr><td><code>spawnCreep()</code> returned an error</td><td>The request did not start correctly</td><td>Handle the documented return code</td></tr>
<tr><td><code>remainingTime &gt; 0</code></td><td>Normal spawning progress</td><td>Wait and observe later ticks</td></tr>
<tr><td><code>remainingTime &lt;= 0</code> and <code>spawn.spawning</code> remains</td><td>Egress is still pending</td><td>Inspect directions and adjacent tiles</td></tr>
<tr><td><code>spawn.spawning === null</code> and <code>creep.spawning === false</code></td><td>The Creep has been released</td><td>Debug its role or movement code</td></tr>
</tbody></table></div>
<p>This guide begins after a valid Spawn request. Use the <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return-code guide</a> when the request itself returned <code>ERR_BUSY</code>, <code>ERR_NOT_ENOUGH_ENERGY</code>, <code>ERR_NAME_EXISTS</code>, or <code>ERR_INVALID_ARGS</code>.</p>

<h2 id="spawning-fields">Read the Spawning fields</h2>
<p><code>StructureSpawn.spawning</code> is either a Spawning object or <code>null</code>. The useful fields are the exact Creep name, total time, remaining time, current direction list, and the linked Spawn. The Creep object can already be addressable by name while its own <code>spawning</code> property remains true.</p>
<pre><code class="language-javascript">function inspectSpawningPair(spawn) {
  if (!spawn?.spawning) {
    return {
      status: 'spawn-idle'
    };
  }

  const creepName = spawn.spawning.name;
  const creep = Game.creeps[creepName] ?? null;

  return {
    status: 'spawn-active',
    spawnName: spawn.name,
    creepName,
    spawnRemainingTime:
      spawn.spawning.remainingTime,
    creepExists: creep !== null,
    creepSpawning: creep?.spawning ?? null,
    position: creep
      ? {
          x: creep.pos.x,
          y: creep.pos.y,
          roomName: creep.pos.roomName
        }
      : null
  };
}</code></pre>
<p>Most Creep actions return <code>ERR_BUSY</code> while <code>creep.spawning</code> is true. Do not attempt to solve Spawn egress by calling <code>move()</code> or <code>moveTo()</code> on the unfinished Creep.</p>

<h2 id="engine-behavior">Why blocked egress extends spawning</h2>
<p>The public API documents <code>directions</code> as the directions where the Creep should move when spawned. The public Screeps engine source shows the completion boundary in more detail: the processor checks the allowed directions in order, tests terrain, blocking structures, blocking construction sites, and movement occupancy, and releases the Creep only when one direction succeeds.</p>
<p>If no allowed tile succeeds, the Spawn is not cleared. The processor advances the completion time and retries on a later tick. That is why the same Creep name can remain in <code>spawn.spawning</code> after its nominal body-part timer has finished.</p>

<h2 id="scan-eight-directions">Scan all eight directions</h2>
<pre><code class="language-javascript">const DIRECTION_OFFSETS = Object.freeze({
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [RIGHT]: [1, 0],
  [BOTTOM_RIGHT]: [1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_LEFT]: [-1, 1],
  [LEFT]: [-1, 0],
  [TOP_LEFT]: [-1, -1]
});

const ALL_DIRECTIONS = Object.freeze([
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT
]);

function getAdjacentPosition(spawn, direction) {
  const offset = DIRECTION_OFFSETS[direction];

  if (!offset) {
    return null;
  }

  const [dx, dy] = offset;
  const x = spawn.pos.x + dx;
  const y = spawn.pos.y + dy;

  if (x &lt; 0 || x &gt; 49 || y &lt; 0 || y &gt; 49) {
    return null;
  }

  return new RoomPosition(
    x,
    y,
    spawn.room.name
  );
}</code></pre>
<p>Classify structures carefully. Roads and Containers are normally passable. Rampart access depends on ownership and public state. The global obstacle list covers ordinary unwalkable structure types.</p>
<pre><code class="language-javascript">function structureBlocksMovement(structure) {
  if (
    structure.structureType === STRUCTURE_ROAD
    || structure.structureType === STRUCTURE_CONTAINER
  ) {
    return false;
  }

  if (structure.structureType === STRUCTURE_RAMPART) {
    return !structure.my &amp;&amp; !structure.isPublic;
  }

  return OBSTACLE_OBJECT_TYPES.includes(
    structure.structureType
  );
}

function siteBlocksMovement(site) {
  return OBSTACLE_OBJECT_TYPES.includes(
    site.structureType
  );
}

function inspectSpawnDirection(spawn, direction) {
  const pos = getAdjacentPosition(
    spawn,
    direction
  );

  if (!pos) {
    return {
      direction,
      status: 'outside-room',
      blockers: ['outside-room']
    };
  }

  const blockers = [];
  const terrain = spawn.room
    .getTerrain()
    .get(pos.x, pos.y);
  const structures = spawn.room.lookForAt(
    LOOK_STRUCTURES,
    pos.x,
    pos.y
  );
  const sites = spawn.room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    pos.x,
    pos.y
  );
  const creeps = spawn.room.lookForAt(
    LOOK_CREEPS,
    pos.x,
    pos.y
  );
  const powerCreeps = spawn.room.lookForAt(
    LOOK_POWER_CREEPS,
    pos.x,
    pos.y
  );

  if (terrain === TERRAIN_MASK_WALL) {
    blockers.push('terrain-wall');
  }

  for (const structure of structures) {
    if (structureBlocksMovement(structure)) {
      blockers.push(
        'structure:' + structure.structureType
      );
    }
  }

  for (const site of sites) {
    if (siteBlocksMovement(site)) {
      blockers.push(
        'site:' + site.structureType
      );
    }
  }

  for (const creep of creeps) {
    blockers.push('creep:' + creep.name);
  }

  for (const powerCreep of powerCreeps) {
    blockers.push(
      'power-creep:' + powerCreep.name
    );
  }

  return {
    direction,
    x: pos.x,
    y: pos.y,
    status: blockers.length === 0
      ? 'open-in-current-snapshot'
      : 'blocked-in-current-snapshot',
    blockers
  };
}

function inspectSpawnExits(spawn) {
  return ALL_DIRECTIONS.map(direction =&gt;
    inspectSpawnDirection(spawn, direction)
  );
}</code></pre>

<h2 id="snapshot-boundary">Treat an open snapshot as provisional</h2>
<p>The public object snapshot can show that a tile is currently empty, but it does not expose every final movement-resolution decision. Another Creep may submit movement into that tile in the same tick. The engine can therefore treat a tile as busy even when a simple <code>lookForAt()</code> report appeared open earlier in the tick.</p>
<p>Name the state <code>open-in-current-snapshot</code>, not <code>guaranteed-free</code>. The successful evidence appears later:</p>
<pre><code class="language-javascript">function verifySpawnRelease(
  spawn,
  expectedCreepName
) {
  const creep = Game.creeps[expectedCreepName]
    ?? null;

  if (
    spawn.spawning?.name === expectedCreepName
  ) {
    return {
      status: 'still-spawning',
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  if (!creep) {
    return {
      status: 'creep-not-observed'
    };
  }

  return {
    status: creep.spawning
      ? 'creep-still-spawning'
      : 'released',
    position: {
      x: creep.pos.x,
      y: creep.pos.y,
      roomName: creep.pos.roomName
    }
  };
}</code></pre>

<h2 id="directions-contract">Use directions as an ordered allowed set</h2>
<p>You can submit directions with the original Spawn request:</p>
<pre><code class="language-javascript">const result = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    memory: {
      role: 'worker'
    },
    directions: [
      RIGHT,
      TOP_RIGHT,
      BOTTOM_RIGHT
    ]
  }
);</code></pre>
<p>The public engine implementation checks the provided directions in order during normal release. A narrow list is therefore not merely a visual hint. If the list contains only <code>RIGHT</code>, an open tile on the left does not automatically become the normal fallback.</p>
<p>Use a narrow list only when the layout guarantees that lane. Otherwise provide an ordered fallback set.</p>

<h2 id="redirect-current-spawn">Redirect the current spawning Creep</h2>
<p>A current Spawning object can accept a new direction list through <code>setDirections()</code>.</p>
<pre><code class="language-javascript">function redirectBlockedSpawn(spawn) {
  if (!spawn?.spawning) {
    return {
      status: 'spawn-idle'
    };
  }

  if (spawn.spawning.remainingTime &gt; 0) {
    return {
      status: 'still-spawning',
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  const report = inspectSpawnExits(spawn);
  const openDirections = report
    .filter(item =&gt;
      item.status === 'open-in-current-snapshot'
    )
    .map(item =&gt; item.direction);

  if (openDirections.length === 0) {
    return {
      status: 'no-open-direction',
      creepName: spawn.spawning.name,
      report
    };
  }

  const result = spawn.spawning.setDirections(
    openDirections
  );

  return {
    status: result === OK
      ? 'redirect-submitted'
      : 'redirect-rejected',
    result,
    creepName: spawn.spawning.name,
    openDirections,
    report
  };
}</code></pre>
<p><code>OK</code> proves only that the update was accepted. It does not prove which direction won or that release completed in the same tick.</p>

<h2 id="clear-owned-blockers">Move owned blockers to staging tiles</h2>
<p>Do not push every adjacent Creep blindly. Spawn-adjacent units may be delivering Energy, waiting for <code>renewCreep()</code>, preparing for <code>recycleCreep()</code>, defending the room, or passing through a traffic intersection. Assign deliberate staging positions at range two or greater.</p>
<pre><code class="language-javascript">function requestOwnedClearance(
  spawn,
  stagingPositions
) {
  const adjacent = spawn.pos.findInRange(
    FIND_MY_CREEPS,
    1
  );
  const outcomes = [];

  for (const creep of adjacent) {
    if (creep.spawning) {
      continue;
    }

    const target = stagingPositions.find(pos =&gt;
      pos.roomName === creep.room.name
      &amp;&amp; pos.getRangeTo(spawn.pos) &gt;= 2
    );

    if (!target) {
      outcomes.push({
        creepName: creep.name,
        status: 'no-staging-position'
      });
      continue;
    }

    const result = creep.moveTo(target, {
      range: 0,
      reusePath: 0,
      maxRooms: 1
    });

    outcomes.push({
      creepName: creep.name,
      status: result === OK
        ? 'clearance-submitted'
        : 'clearance-rejected',
      result,
      target: {
        x: target.x,
        y: target.y,
        roomName: target.roomName
      }
    });
  }

  return outcomes;
}</code></pre>
<p>Again, accepted movement is not completed movement. Re-scan the Spawn exits and exact Creep state on a later tick.</p>

<h2 id="do-not-cancel">Do not cancel a valid Creep for traffic</h2>
<pre><code class="language-javascript">const result = spawn.spawning.cancel();</code></pre>
<p>The official API states that cancellation is immediate and that the Energy already spent is not returned. A temporary traffic jam should normally follow this sequence:</p>
<ol>
<li>Expand or reorder the allowed directions.</li>
<li>Move owned blockers to explicit staging positions.</li>
<li>Remove a mistaken blocking construction site or redesign permanent structures.</li>
<li>Allow the Spawn processor to retry on later ticks.</li>
</ol>
<p>Cancel only when the Creep request itself is wrong and the Energy loss is an intentional decision.</p>

<h2 id="rate-limited-state">Record sustained blockage without log spam</h2>
<pre><code class="language-javascript">function recordSpawnBlockage(
  spawn,
  outcome
) {
  Memory.spawnEgress ??= {};
  const state = Memory.spawnEgress[spawn.name]
    ?? {
      firstBlockedAt: null,
      lastLogAt: null,
      blockedTicks: 0
    };

  if (outcome.status !== 'no-open-direction') {
    state.firstBlockedAt = null;
    state.blockedTicks = 0;
    Memory.spawnEgress[spawn.name] = state;

    return {
      status: 'not-blocked'
    };
  }

  state.firstBlockedAt ??= Game.time;
  state.blockedTicks += 1;

  const logDue =
    !Number.isInteger(state.lastLogAt)
    || Game.time - state.lastLogAt &gt;= 20;

  if (logDue) {
    console.log(JSON.stringify({
      type: 'spawn-egress-blocked',
      tick: Game.time,
      spawnName: spawn.name,
      creepName: outcome.creepName,
      firstBlockedAt: state.firstBlockedAt,
      blockedTicks: state.blockedTicks,
      report: outcome.report
    }));
    state.lastLogAt = Game.time;
  }

  Memory.spawnEgress[spawn.name] = state;

  return {
    status: logDue
      ? 'blocked-logged'
      : 'blocked-log-throttled',
    blockedTicks: state.blockedTicks
  };
}</code></pre>
<p>Store only the bounded evidence required for diagnosis. Do not serialize complete Room, Spawn, or Creep objects into Memory.</p>

<h2 id="complete-guard">Build a complete egress guard</h2>
<pre><code class="language-javascript">function runSpawnEgressGuard(
  spawn,
  stagingPositions
) {
  if (!spawn?.spawning) {
    return {
      status: 'spawn-idle'
    };
  }

  if (spawn.spawning.remainingTime &gt; 0) {
    return {
      status: 'spawning',
      creepName: spawn.spawning.name,
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  const redirect = redirectBlockedSpawn(spawn);

  if (redirect.status === 'redirect-submitted') {
    return redirect;
  }

  if (redirect.status !== 'no-open-direction') {
    return redirect;
  }

  const clearance = requestOwnedClearance(
    spawn,
    stagingPositions
  );
  const logResult = recordSpawnBlockage(
    spawn,
    redirect
  );

  return {
    status: 'clearance-requested',
    creepName: redirect.creepName,
    clearance,
    logResult,
    report: redirect.report
  };
}</code></pre>
<p>Call this after essential Spawn request coordination, not from multiple independent modules. A single owner should decide Spawn requests, renewal, recycling, egress direction, and adjacent staging policy.</p>

<h2 id="layout-prevention">Prevent the blockage in room layout</h2>
<ul>
<li>Keep at least one permanently walkable adjacent tile and one practical fallback.</li>
<li>Do not place stationary Miner, Upgrader, hauler, or defense positions on every allowed direction.</li>
<li>Do not use a Spawn exit tile as an idle parking position.</li>
<li>Coordinate <code>renewCreep()</code> and <code>recycleCreep()</code> because both depend on adjacent positions.</li>
<li>Store direction policy per Spawn, not once for the whole room.</li>
<li>Validate configured staging positions against terrain, room bounds, and permanent structures.</li>
</ul>

<h2 id="debugging">Debugging checklist</h2>
<ol>
<li>Record <code>Game.time</code>, Spawn name, and exact spawning Creep name.</li>
<li>Confirm that <code>remainingTime &lt;= 0</code>.</li>
<li>Record the current <code>directions</code> array.</li>
<li>Scan terrain, structures, construction sites, Creeps, and Power Creeps on all eight tiles.</li>
<li>Check whether the allowed set is narrower than the available layout.</li>
<li>Submit a new ordered direction list when a current-snapshot opening exists.</li>
<li>Move owned blockers to explicit staging positions.</li>
<li>Do not call <code>cancel()</code> as an automatic traffic response.</li>
<li>Verify <code>spawn.spawning === null</code> and <code>creep.spawning === false</code> later.</li>
<li>Rate-limit repeated evidence and redesign the layout if blockage persists.</li>
</ol>

<h2 id="scope">Scope and limitations</h2>
<p>Repository checks validate JavaScript syntax and offline direction, blocker, redirection, logging, and verification states. They do not simulate official-server movement resolution, hostile occupancy edge behavior, Power effects, multiple Spawn contention, global resets, or live CPU cost.</p>
<p>This guide applies after a valid Spawn request reaches its completion boundary. It does not replace body-cost planning, room Energy diagnosis, Spawn queue arbitration, ordinary Creep movement debugging, or live multi-tick observation.</p>

<h2 id="faq">Frequently asked questions</h2>
<p>The FAQ separates timer completion, accepted direction changes, Creep action availability, and cancellation cost.</p>

<h2 id="official-docs">Official documentation and source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep">StructureSpawn.spawnCreep() API</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.Spawning">StructureSpawn.Spawning API</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.spawning">Creep.spawning API</a></li>
<li><a href="https://docs.screeps.com/debugging.html">Screeps debugging guide</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/spawns/_born-creep.js">Public engine Spawn exit resolution</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/spawns/tick.js">Public engine Spawn tick processing</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishSpawnEgressBatchNineteenBySlug = Object.fromEntries(
  englishSpawnEgressBatchNineteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishSpawnEgressBatchNineteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishSpawnEgressBatchNineteenBySlug[slug];
}
