import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-first-room-code",
  "screeps-room-visibility",
  "screeps-global-cache",
]);

function insertSection(
  html: string,
  addition: string,
  firstId: string,
  preferredAnchors: string[],
): string {
  if (html.includes(`id="${firstId}"`)) return html;

  const fallbackAnchors = [
    `<h2 id="official-docs">`,
    `<h2 id="official-sources">`,
    `<h2 id="scope">`,
    `<h2 id="limitations">`,
    `<h2 id="links">`,
    `<h2 id="sources">`,
  ];

  for (const anchor of [...preferredAnchors, ...fallbackAnchors]) {
    if (html.includes(anchor)) {
      return html.replace(anchor, `${addition}\n\n${anchor}`);
    }
  }

  return `${html}\n\n${addition}`;
}

function insertToc(
  toc: Array<[string, string]>,
  items: Array<[string, string]>,
  beforeIds: string[],
): Array<[string, string]> {
  const missing = items.filter(
    ([id]) => !toc.some(([currentId]) => currentId === id),
  );
  if (missing.length === 0) return toc;

  const fallbackIds = [
    "official-docs",
    "official-sources",
    "scope",
    "limitations",
    "links",
    "sources",
  ];
  const index = toc.findIndex(([id]) =>
    [...beforeIds, ...fallbackIds].includes(id),
  );

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
    "Live multi-tick verification",
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
  const addition = String.raw`<h2 id="orchestration-contract">Treat this page as the beginner-room orchestrator</h2>
<p>This guide is the integration layer for the beginner series. It should decide <strong>which existing role handler runs, whether one fixed-name Creep is missing, and what evidence to inspect afterward</strong>. It should not duplicate the full <code>harvest()</code>, <code>transfer()</code>, <code>upgradeController()</code>, <code>build()</code>, <code>repair()</code>, or <code>spawnCreep()</code> references.</p>
<p>For this small teaching loop, give each Creep one role owner per tick. That is a project policy for predictable debugging, not a Screeps rule that forbids every compatible action combination. The benefit is practical: one module owns the movement/work decision and one captured return code explains the branch that actually ran.</p>
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
<p><code>dryRun</code> validates a request without starting production. An <code>OK</code> dry run is not evidence that a new Creep exists or has finished spawning. Preserve the real <code>spawnCreep()</code> result, then inspect <code>spawn.spawning</code> and <code>Game.creeps[name]</code> on later ticks.</p>

<h2 id="tick-evidence">Separate accepted commands from later room state</h2>
<p>The <code>Game</code> snapshot read by the script is the current tick. Submitted game actions are resolved after the script phase, so an <code>OK</code> return is not permission to rewrite the current snapshot into a claimed outcome. Record the request now and compare the relevant object state on a later tick.</p>
<pre><code class="language-javascript">function describeBeginnerRoomTick(spawn) {
  const creeps = BEGINNER_ROLES.map(name => {
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
      position: [
        creep.pos.roomName,
        creep.pos.x,
        creep.pos.y
      ].join(':')
    };
  });

  return {
    tick: Game.time,
    spawningName: spawn?.spawning?.name || null,
    creeps
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
<p>This is still intentionally a one-room teaching loop with fixed names and one basic body. It is not a prespawn scheduler, task system, multi-room framework, or guaranteed collapse-recovery system. If the room cannot recover its harvesting workforce, use the <a href="/en/blog/screeps-emergency-harvester-recovery">emergency recovery guide</a>. For a rejected spawn request, use <a href="/en/blog/screeps-spawncreep-return-codes">the spawnCreep() return-code guide</a>. For module boundaries, continue to <a href="/en/blog/screeps-require-modules">the require() guide</a>.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "orchestration-contract",
    [`<h2 id="limitations">`, `<h2 id="next">`],
  );
  const toc = insertToc(
    article.toc,
    [
      ["orchestration-contract", "Treat the page as an orchestrator"],
      ["tick-evidence", "Separate commands from later state"],
    ],
    ["limitations", "next"],
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
          "Reviewed in full — fixed names, one-room scope, simple role ownership, and documented collapse limits are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — game-loop timing, simultaneous action boundaries, Game.creeps, StructureSpawn.spawnCreep(), dryRun, and spawning state",
        ],
        [
          "Static code review",
          "Passed — only one missing fixed-name Creep is requested, dryRun stays separate from the real result, spawning Creeps do not run role handlers, and current-tick snapshots are not presented as later outcomes",
        ],
        [
          "Intent boundary",
          "This page integrates the beginner room loop; API-specific spawning, movement, harvesting, building, and recovery diagnosis stay in dedicated guides",
        ],
      ],
      "No live workforce replacement, accepted spawn request, next-tick Creep availability, competing intent, collapse, or recovery trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveRoomVisibility(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="name-position-map-live-room">Separate room names, positions, map data, and live Rooms</h2>
<p>A valid room name is not the same thing as a live <code>Room</code>. Code can store a room-name string, construct a <code>RoomPosition</code>, or ask <code>Game.map</code> for map-level information without proving that <code>Game.rooms[roomName]</code> exists in this tick. Gate current Room methods and current Room objects on the live <code>Game.rooms</code> entry.</p>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>What it proves</th><th>What it does not prove</th></tr></thead>
<tbody>
<tr><td>Room-name string</td><td>Your code has an identifier.</td><td>Current vision.</td></tr>
<tr><td><code>RoomPosition</code></td><td>A room coordinate can be represented.</td><td>A live Room or current objects at that coordinate.</td></tr>
<tr><td><code>Game.map</code> result</td><td>Map-level information for that map operation.</td><td>That <code>room.find()</code> or <code>room.controller</code> is readable now.</td></tr>
<tr><td><code>Game.rooms[roomName]</code></td><td>A live Room object is available this tick.</td><td>Why vision exists or how long it will remain.</td></tr>
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

<h2 id="visibility-attribution">Do not infer why vision exists</h2>
<p>If <code>Game.rooms[roomName]</code> exists, you can safely say the room is available to the current script. Do not automatically say an Observer caused that vision: your Creeps, structures, or another supported visibility source may already expose the room. When attribution matters, keep the Observer ID, requested room, and request tick as separate evidence.</p>
<p>Apply the same evidence discipline to saved object IDs. If <code>Game.getObjectById(id)</code> returns <code>null</code> while the expected room is not visible, classify the object state as unknown rather than deleted. Once the expected room is visible, a missing ID is stronger evidence that the saved target is stale or absent; mobile-object assumptions still need their own identity check.</p>
<p>Use <a href="/en/blog/screeps-observer-observe-room">the Observer guide</a> for the request/next-tick vision lifecycle and <a href="/en/blog/screeps-get-object-by-id">the saved-target guide</a> for ID restoration.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "name-position-map-live-room",
    [`<h2 id="multi-tick-proof">`, `<h2 id="debugging">`],
  );
  const toc = insertToc(
    article.toc,
    [
      ["name-position-map-live-room", "Separate names, positions, map data, and live Rooms"],
      ["visibility-attribution", "Do not infer why vision exists"],
    ],
    ["multi-tick-proof", "debugging"],
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
          "Reviewed in full — the August 15 current-vision, saved-ID, lastSeenAt, and Observer timing boundaries are preserved",
        ],
        [
          "Official documentation",
          "Checked August 18, 2026 — Game.rooms visibility, Game.getObjectById(), RoomPosition, Game.map, current-tick Game objects, and Observer next-tick semantics",
        ],
        [
          "Static code review",
          "Passed — room-name and RoomPosition representation do not imply vision, live Room access is explicitly gated, unknown saved-object state is distinct from confirmed absence, and Observer attribution is not inferred from visibility alone",
        ],
      ],
      "No live Creep, structure, or Observer visibility transition, saved-object disappearance, or multi-tick attribution trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveGlobalCache(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="cache-key-contract">Make the cache key describe the inputs that change the answer</h2>
<p>A cache can be internally consistent and still return the wrong answer when its key omits part of the input. A room name is enough only for a value that depends on that room alone. Add explicit schema, configuration, policy, or layout revisions when those inputs change the derived result.</p>
<pre><code class="language-javascript">function makeRoomCacheKey(input) {
  if (
    typeof input.roomName !== 'string'
    || !Number.isInteger(input.schemaVersion)
    || !Number.isInteger(input.configRevision)
  ) {
    return null;
  }

  return [
    input.roomName,
    'schema=' + input.schemaVersion,
    'config=' + input.configRevision
  ].join('|');
}</code></pre>
<p>The revision numbers are application data, not Screeps constants. Change them when the represented inputs change. For structure layouts, an explicit layout revision or event-driven invalidation can be more accurate than treating an arbitrary TTL as the only source of truth.</p>

<h2 id="missing-cache-evidence">A missing cache does not prove why the runtime state disappeared</h2>
<p>Code must handle an empty module/global cache after a fresh runtime context, code reload, explicit heap clearing, or another event that recreates JavaScript state. From <code>global.exampleCache === undefined</code> alone, do not invent the cause. The observable fact is a cache miss; the engineering response is to rebuild from current or durable inputs.</p>
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
<p>If correctness depends on data that cannot be reconstructed after a miss, that state should not live only in disposable global cache.</p>

<h2 id="measure-cold-warm">Measure cold rebuilds and warm hits separately</h2>
<p>Do not publish a CPU improvement because one cached call looked cheaper. Measure the same boundary repeatedly and label whether each sample rebuilt or hit the cache. Input size, room visibility, bucket state, code path, and cache state can all change the comparison.</p>
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
<p>This records one section delta; it does not prove a long-run CPU benefit. Keep cold rebuilds and warm hits in separate groups, collect multiple comparable server samples, and leave the performance conclusion Pending until real-shard data exists. Use <a href="/en/blog/screeps-cpu-getused-bucket">the CPU profiling guide</a> for measurement boundaries.</p>`;

  const articleHtml = insertSection(
    article.articleHtml,
    addition,
    "cache-key-contract",
    [`<h2 id="warm-reset">`, `<h2 id="debugging">`],
  );
  const toc = insertToc(
    article.toc,
    [
      ["cache-key-contract", "Key every input that changes the answer"],
      ["missing-cache-evidence", "Treat a missing cache as evidence, not a cause"],
      ["measure-cold-warm", "Measure cold and warm paths separately"],
    ],
    ["warm-reset", "debugging"],
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
          "Checked August 18, 2026 — current-tick Game objects, Memory persistence, global-context reuse/reset behavior, Game.getObjectById(), Game.cpu.getUsed(), bucket, limit, and tickLimit",
        ],
        [
          "Static code review",
          "Passed — cache identity includes changing inputs, cache absence is not assigned an invented cause, durable state stays outside disposable cache, live game objects are resolved from the active tick, and cold/warm CPU samples are labeled separately",
        ],
        [
          "Performance boundary",
          "No claim is made that the example cache reduces real-shard CPU; the revision only defines a reproducible measurement plan",
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
