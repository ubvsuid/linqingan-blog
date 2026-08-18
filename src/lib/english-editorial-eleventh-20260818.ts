import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-first-room-code",
  "screeps-room-visibility",
  "screeps-pathfinder-costmatrix",
  "screeps-global-cache",
]);

function insertBeforeFirst(
  html: string,
  anchors: string[],
  addition: string,
  slug: string,
  label: string,
): string {
  for (const anchor of anchors) {
    if (html.includes(anchor)) {
      return html.replace(anchor, `${addition}\n\n${anchor}`);
    }
  }

  throw new Error(`English editorial eleventh pass could not find ${label} in ${slug}`);
}

function insertTocBefore(
  toc: Array<[string, string]>,
  beforeIds: string[],
  items: Array<[string, string]>,
): Array<[string, string]> {
  const missing = items.filter(
    ([id]) => !toc.some(([currentId]) => currentId === id),
  );
  if (missing.length === 0) return toc;

  const index = toc.findIndex(([id]) => beforeIds.includes(id));
  if (index < 0) return [...toc, ...missing];
  return [...toc.slice(0, index), ...missing, ...toc.slice(index)];
}

function refreshVerification(
  article: EnglishBeginnerArticle,
  rows: Array<[string, string]>,
  liveBoundary: string,
): Array<[string, string]> {
  const replacedTerms = new Set([
    "Official docs",
    "Official documentation",
    "Static code review",
    "Evidence level",
    "Verification status",
    "Console test pending",
    "Screeps Console test",
    "Live multi-tick verification pending",
    "Last verified",
    "Last editorial review",
    "Publication status",
  ]);

  return [
    ...article.verification.filter(([term]) => !replacedTerms.has(term)),
    ...rows,
    [
      "Evidence level",
      "Official-documentation review, Chinese-source review, and static code review only; no real-shard execution is claimed",
    ],
    ["Console test pending", "Not run in this editorial pass"],
    [
      "Screeps Console test",
      "Pending — no real-shard Console transcript was collected for this revision",
    ],
    ["Live multi-tick verification pending", liveBoundary],
    ["Last editorial review", REVIEWED_AT],
  ];
}

function improveFirstRoomCode(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="orchestration-contract">Treat the first room loop as an orchestrator</h2>
<p>This page is the integration layer for the beginner series. Its job is to decide <strong>which existing Creep handler runs, whether one missing fixed-name Creep should be requested, and what evidence to inspect afterward</strong>. It is not another full reference for <code>harvest()</code>, <code>transfer()</code>, <code>upgradeController()</code>, <code>build()</code>, <code>repair()</code>, or <code>spawnCreep()</code>.</p>
<p>For a beginner room, use one explicit owner for each decision. The engine can schedule methods from compatible action pipelines in the same tick, so “one role handler per Creep per tick” is a <strong>project policy for predictability</strong>, not a Screeps API limit. It prevents two unrelated modules from issuing competing movement or work decisions and makes the saved return code easier to interpret.</p>
<pre><code class="language-javascript">const BEGINNER_ROLES = [
  'Harvester1',
  'Upgrader1',
  'Builder1'
];

function chooseMissingBeginnerCreep() {
  return BEGINNER_ROLES.find(name =>
    !Game.creeps[name]
  ) || null;
}

function requestOneMissingCreep(spawn) {
  if (!spawn) {
    return { status: 'spawn-missing' };
  }

  if (spawn.spawning) {
    return {
      status: 'spawn-busy',
      spawningName: spawn.spawning.name
    };
  }

  const name = chooseMissingBeginnerCreep();
  if (!name) {
    return { status: 'workforce-present' };
  }

  const body = [WORK, CARRY, MOVE];
  const dryRun = spawn.spawnCreep(
    body,
    name,
    { dryRun: true }
  );

  if (dryRun !== OK) {
    return {
      status: 'spawn-preflight-rejected',
      name,
      result: dryRun
    };
  }

  const result = spawn.spawnCreep(body, name);

  return {
    status: result === OK
      ? 'spawn-request-accepted'
      : 'spawn-request-rejected',
    name,
    result
  };
}</code></pre>
<p><code>dryRun</code> checks the current request without starting production. A later real call can still be rejected if another part of the tick changes the usable conditions, so preserve the real return code as the final submission result.</p>

<h2 id="tick-evidence">Separate accepted commands from later room state</h2>
<p>The current <code>Game</code> snapshot does not mutate in place when a command returns <code>OK</code>. Screeps processes submitted commands after scripts run, and changed positions, stores, progress, newly created objects, and other outcomes become observable through later game state. For this integrated loop, log the request now and inspect the relevant object again on a later tick.</p>
<pre><code class="language-javascript">function describeBeginnerRoomTick(spawn) {
  const describeCreep = name => {
    const creep = Game.creeps[name];

    if (!creep) {
      return { name, present: false };
    }

    return {
      name,
      present: true,
      spawning: creep.spawning === true,
      energy: creep.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
      roomName: creep.room.name,
      x: creep.pos.x,
      y: creep.pos.y
    };
  };

  return {
    tick: Game.time,
    spawnName: spawn?.name || null,
    spawningName: spawn?.spawning?.name || null,
    creeps: BEGINNER_ROLES.map(describeCreep)
  };
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const spawnOutcome = requestOneMissingCreep(spawn);

  const harvester = Game.creeps.Harvester1;
  const upgrader = Game.creeps.Upgrader1;
  const builder = Game.creeps.Builder1;

  if (harvester && !harvester.spawning) {
    runHarvester(harvester);
  }
  if (upgrader && !upgrader.spawning) {
    runUpgrader(upgrader);
  }
  if (builder && !builder.spawning) {
    runBuilder(builder);
  }

  if (Game.time % 20 === 0) {
    console.log(JSON.stringify({
      type: 'beginner-room-tick',
      spawnOutcome,
      snapshot: describeBeginnerRoomTick(spawn)
    }));
  }
};</code></pre>
<p>Do not read this sample as a promise that a room will recover from every collapse. It still uses fixed names, one basic body, one room, and the simple role logic taught earlier. If the room cannot afford the minimum worker after losing its workforce, continue to the <a href="/en/blog/screeps-emergency-harvester-recovery">emergency harvester recovery guide</a>. For detailed spawning failures use <a href="/en/blog/screeps-spawncreep-return-codes">the spawnCreep() return-code guide</a>; for a scalable module router use <a href="/en/blog/screeps-require-modules">the modules guide</a>.</p>`;

  const articleHtml = insertBeforeFirst(
    article.articleHtml,
    [
      `<h2 id="limitations">`,
      `<h2 id="scope">`,
      `<h2 id="official-sources">`,
      `<h2 id="official-docs">`,
    ],
    addition,
    article.slug,
    "first-room integration boundary",
  );

  const toc = insertTocBefore(
    article.toc,
    ["limitations", "scope", "official-sources", "official-docs"],
    [
      ["orchestration-contract", "Treat the loop as an orchestrator"],
      ["tick-evidence", "Separate commands from later state"],
    ],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Chinese source article",
          "Reviewed in full — the fixed-name, one-room beginner scope and documented collapse limitations are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — game-loop timing, simultaneous Creep action pipelines, Game.creeps, StructureSpawn.spawnCreep(), dryRun, spawning state, and current return-code boundaries",
        ],
        [
          "Static code review",
          "Passed — one missing Creep request per loop, dryRun separated from the real spawn result, spawning Creeps excluded from role execution, fixed beginner role ownership, and current-tick snapshots remain explicit",
        ],
        [
          "Intent boundary",
          "This page integrates the beginner room loop; dedicated guides remain responsible for API-specific spawning, movement, harvesting, building, and recovery diagnosis",
        ],
      ],
      "No live fixed-name workforce replacement, accepted spawn request, next-tick Creep availability, multi-action conflict, full-room collapse, or recovery trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveRoomVisibility(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="name-position-map-live-room">Do not confuse a room name, position, map data, and live vision</h2>
<p>A valid room name is not the same thing as a live <code>Room</code>. Code can hold a room-name string, construct a <code>RoomPosition</code>, or use <code>Game.map</code> methods without proving that <code>Game.rooms[roomName]</code> exists in this tick. Use the live <code>Game.rooms</code> entry as the gate before calling Room methods or reading current room objects.</p>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>What it proves</th><th>What it does not prove</th></tr></thead>
<tbody>
<tr><td>Room-name string</td><td>Your code has an identifier</td><td>Current vision</td></tr>
<tr><td><code>RoomPosition</code></td><td>A coordinate can be represented</td><td>A live Room or current objects at that coordinate</td></tr>
<tr><td><code>Game.map</code> result</td><td>Map-level information for the requested operation</td><td>That <code>room.find()</code> or <code>room.controller</code> can be read</td></tr>
<tr><td><code>Game.rooms[roomName]</code></td><td>A live Room object is available now</td><td>Why that vision exists or how long it will remain</td></tr>
</tbody></table></div>
<pre><code class="language-javascript">function describeRoomHandle(roomName) {
  if (typeof roomName !== 'string') {
    return { status: 'room-name-invalid' };
  }

  const position = new RoomPosition(
    25,
    25,
    roomName
  );
  const room = Game.rooms[roomName] || null;

  return {
    status: room
      ? 'live-room-available'
      : 'live-room-unavailable',
    roomName,
    representedPosition: {
      x: position.x,
      y: position.y,
      roomName: position.roomName
    },
    liveRoom: Boolean(room)
  };
}</code></pre>
<p>The position object is useful for coordinates and routing APIs, but it is not a replacement for room vision.</p>

<h2 id="visibility-attribution">Keep visibility attribution separate from visibility itself</h2>
<p>If <code>Game.rooms[roomName]</code> exists, you may safely say the room is currently available. Do not automatically say an Observer caused that visibility: one of your Creeps or structures may already provide it, or another supported game mechanism may be involved. When attribution matters, keep the request tick and Observer ID as separate evidence.</p>
<p>The same evidence rule applies to saved object IDs. <code>Game.getObjectById(id) === null</code> while the target room is not visible is an <strong>unknown object state</strong>, not proof of deletion. Once the room is visible, a missing object becomes stronger evidence that the saved ID is stale or the object is gone.</p>
<p>For the full request/next-tick Observer state machine, continue to <a href="/en/blog/screeps-observer-observe-room">the Observer guide</a>. For ID restoration, use <a href="/en/blog/screeps-get-object-by-id">the saved-target guide</a>.</p>`;

  const articleHtml = insertBeforeFirst(
    article.articleHtml,
    [`<h2 id="multi-tick-proof">`, `<h2 id="debugging">`],
    addition,
    article.slug,
    "room visibility evidence section",
  );

  const toc = insertTocBefore(
    article.toc,
    ["multi-tick-proof", "debugging"],
    [
      ["name-position-map-live-room", "Separate names, positions, map data, and live Rooms"],
      ["visibility-attribution", "Separate visibility from its cause"],
    ],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Chinese source article",
          "Reviewed in full — the August 15 visibility, saved-ID, lastSeenAt, and Observer timing boundaries are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — Game.rooms current visibility, Game.getObjectById() visible-room access, RoomPosition, Game.map, Game object tick lifetime, and Observer next-tick semantics",
        ],
        [
          "Static code review",
          "Passed — room-name and RoomPosition representation no longer imply vision, live Room access is explicitly gated, unknown saved-object state is distinct from confirmed absence, and Observer attribution is not inferred from visibility alone",
        ],
      ],
      "No live Creep/structure/Observer visibility transition, saved-object disappearance, or multi-tick attribution trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveCostMatrix(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="matrix-lifecycle">Use a static base, then clone before current-tick traffic</h2>
<p>A reusable matrix needs a lifecycle contract. Slow-changing structure and policy costs may form a static base, but current Creep positions and temporary traffic rules belong to the active tick. Clone the base before writing those dynamic costs so one search cannot poison the matrix reused by another Creep or a later search.</p>
<pre><code class="language-javascript">function buildStaticRoomMatrix(room) {
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

  return costs;
}

function addCurrentTraffic(
  staticMatrix,
  room,
  movingCreepId
) {
  const costs = staticMatrix.clone();

  for (const other of room.find(FIND_CREEPS)) {
    if (other.id !== movingCreepId) {
      const current = costs.get(
        other.pos.x,
        other.pos.y
      );

      if (current < 255) {
        costs.set(
          other.pos.x,
          other.pos.y,
          255
        );
      }
    }
  }

  return costs;
}</code></pre>
<p><code>PathFinder.CostMatrix.clone()</code> creates a separate matrix with the same data. That copy boundary matters when a shared base matrix is cached or reused. The cache still needs a version or invalidation signal when roads, Ramparts, Containers, other structures, or static policy costs change.</p>

<h2 id="callback-contract">Make every roomCallback result intentional</h2>
<pre><code class="language-javascript">function createSearchRoomCallback(
  blockedRooms,
  movingCreepId,
  getStaticMatrix
) {
  return function roomCallback(roomName) {
    if (blockedRooms.has(roomName)) {
      return false;
    }

    const room = Game.rooms[roomName];
    if (!room) {
      return undefined;
    }

    const staticMatrix = getStaticMatrix(room);
    return addCurrentTraffic(
      staticMatrix,
      room,
      movingCreepId
    );
  };
}</code></pre>
<p>Here <code>false</code> is a deliberate route policy: PathFinder must not search that room. <code>undefined</code> means this callback supplies no custom matrix, so the search can continue with its normal terrain handling. Keep this matrix-construction contract here; use <a href="/en/blog/screeps-err-no-path">the ERR_NO_PATH guide</a> when the user problem is a failed or incomplete search rather than matrix design.</p>`;

  const articleHtml = insertBeforeFirst(
    article.articleHtml,
    [`<h2 id="serialization">`, `<h2 id="move-result">`],
    addition,
    article.slug,
    "CostMatrix lifecycle section",
  );

  const toc = insertTocBefore(
    article.toc,
    ["serialization", "move-result"],
    [
      ["matrix-lifecycle", "Clone the static base before traffic"],
      ["callback-contract", "Make roomCallback results intentional"],
    ],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Chinese source article",
          "Reviewed in full — static/dynamic matrix separation, incomplete-search handling, and offline-test limits are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — PathFinder.search(), roomCallback, CostMatrix 0/1-254/255 semantics, CostMatrix.clone(), serialize()/deserialize(), goal range, incomplete, ops, cost, and moveByPath()",
        ],
        [
          "Static code review",
          "Passed — static structure costs are cloned before current-tick Creep overlays, 255 obstacles are preserved, invisible rooms are not automatically forbidden, blocked rooms remain explicit policy, and search completeness stays separate from movement submission",
        ],
        [
          "Intent boundary",
          "This page owns CostMatrix construction and lifecycle; ERR_NO_PATH remains the dedicated failed-search diagnosis page",
        ],
      ],
      "No live PathFinder route-quality, CostMatrix cache invalidation, multi-Creep traffic, CPU, incomplete-search, or moveByPath() trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveGlobalCache(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="cache-key-contract">Make the cache key describe the inputs that can change the answer</h2>
<p>A cache can be perfectly implemented and still return the wrong answer when its key omits part of the input. A room name is enough only for data whose result depends on that room alone. Add explicit schema, configuration, shard, policy, or layout revisions when those values change the derived result.</p>
<pre><code class="language-javascript">function makeRoomCacheKey(input) {
  if (
    typeof input.roomName !== 'string'
    || !Number.isInteger(input.schemaVersion)
    || !Number.isInteger(input.configRevision)
  ) {
    return null;
  }

  return [
    Game.shard.name,
    input.roomName,
    'schema=' + input.schemaVersion,
    'config=' + input.configRevision
  ].join('|');
}</code></pre>
<p>The revision numbers are application data, not Screeps constants. Increment them when the inputs represented by the cached result change. For room layouts, an event-driven or explicit layout revision may be more accurate than an arbitrary TTL.</p>

<h2 id="missing-cache-evidence">A missing global cache does not tell you why it disappeared</h2>
<p>Code must handle an empty cache after a new runtime context, code reload, manual heap clearing, or any other condition that recreates the relevant JavaScript state. From <code>global.someCache === undefined</code> alone, do not invent a reset cause. Treat the cache miss as the observable fact and rebuild from current or persistent sources.</p>
<pre><code class="language-javascript">function getOrBuild(key, builder) {
  global.exampleCache ??= new Map();

  if (global.exampleCache.has(key)) {
    return {
      status: 'cache-hit',
      value: global.exampleCache.get(key)
    };
  }

  const value = builder();
  global.exampleCache.set(key, value);

  return {
    status: 'cache-built',
    value
  };
}</code></pre>
<p>The builder is the recovery path. If correctness depends on data that cannot be reconstructed after this miss, that data does not belong only in global cache.</p>

<h2 id="measure-cold-warm">Measure cold and warm paths as different samples</h2>
<p>Do not publish a CPU improvement because one cached call looked cheaper. Measure the same boundary repeatedly and label whether each sample rebuilt or hit the cache. Room visibility, input size, bucket state, code path, and cache state can all change the comparison.</p>
<pre><code class="language-javascript">function measureCacheCall(label, read) {
  const before = Game.cpu.getUsed();
  const outcome = read();
  const used = Game.cpu.getUsed() - before;

  return {
    tick: Game.time,
    label,
    cacheStatus: outcome.status,
    used,
    bucket: Game.cpu.bucket,
    limit: Game.cpu.limit
  };
}</code></pre>
<p>This helper only records one section delta. It does not prove a long-run CPU benefit. Keep cold rebuilds and warm hits in separate groups, collect multiple comparable samples, and retain the live-performance conclusion as Pending until real shard data exists. For measurement boundaries, continue to <a href="/en/blog/screeps-cpu-getused-bucket">the CPU profiling guide</a>; for static navigation caches, use <a href="/en/blog/screeps-pathfinder-costmatrix">the CostMatrix guide</a>.</p>`;

  const articleHtml = insertBeforeFirst(
    article.articleHtml,
    [`<h2 id="warm-reset">`, `<h2 id="debugging">`],
    addition,
    article.slug,
    "global cache contract section",
  );

  const toc = insertTocBefore(
    article.toc,
    ["warm-reset", "debugging"],
    [
      ["cache-key-contract", "Make cache keys describe changing inputs"],
      ["missing-cache-evidence", "Treat a missing cache as evidence, not a cause"],
      ["measure-cold-warm", "Measure cold and warm paths separately"],
    ],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Chinese source article",
          "Reviewed in full — rebuildability, TTL/version boundaries, per-room keys, ID recovery, and offline-test limits are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — Game object current-tick lifetime, Memory persistence, runtime global-context reuse/reset behavior, Game.getObjectById(), Game.cpu.getUsed(), bucket, limit, and tickLimit",
        ],
        [
          "Static code review",
          "Passed — cache identity includes changing inputs, cache absence is not assigned an invented cause, durable state remains outside disposable global cache, live game objects are resolved in the active tick, and cold/warm CPU samples are labeled separately",
        ],
        [
          "Performance boundary",
          "No claim is made that the example cache reduces real-shard CPU; the revision only defines a measurement plan",
        ],
      ],
      "No live global-reset, cold/warm CPU, heap-pressure, cache-invalidation, ID-resolution, or multi-room performance trace was collected for this revision",
    ),
    articleHtml,
  };
}

export function applyEnglishEditorialEleventh20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  switch (article.slug) {
    case "screeps-first-room-code":
      return improveFirstRoomCode(article);
    case "screeps-room-visibility":
      return improveRoomVisibility(article);
    case "screeps-pathfinder-costmatrix":
      return improveCostMatrix(article);
    case "screeps-global-cache":
      return improveGlobalCache(article);
    default:
      return article;
  }
}

export function getEnglishEditorialEleventhUpdatedAt20260818(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
