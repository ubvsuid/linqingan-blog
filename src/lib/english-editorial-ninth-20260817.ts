import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-17";
const REVIEWED_AT = "August 17, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-cpu-getused-bucket",
  "screeps-memory-basics",
  "screeps-spawncreep-return-codes",
  "screeps-moveto-not-moving",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`English editorial ninth pass could not find ${label} in ${slug}`);
  }
  return html.replace(search, replacement);
}

function insertTocBefore(
  toc: Array<[string, string]>,
  beforeId: string,
  item: [string, string],
): Array<[string, string]> {
  if (toc.some(([id]) => id === item[0])) return toc;
  const index = toc.findIndex(([id]) => id === beforeId);
  if (index < 0) return [...toc, item];
  return [...toc.slice(0, index), item, ...toc.slice(index)];
}

function refreshVerification(
  article: EnglishBeginnerArticle,
  rows: Array<[string, string]>,
  liveBoundary: string,
): Array<[string, string]> {
  const replacedTerms = new Set([
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
      "Official-documentation review and static code review only; no real-shard execution is claimed",
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

function improveCpu(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="bounded-history">Keep diagnostics bounded</h2>`,
    `<h2 id="comparison-contract">Turn a CPU delta into a comparable measurement</h2>
<p>A section delta answers one narrow question: how much cumulative CPU increased between two samples in this tick. It does not explain why the work cost that amount, and one low value does not prove an optimization. Compare the same boundary under similar input size, room visibility, cache state, and feature flags before changing architecture.</p>
<pre><code class="language-javascript">function describeCpuSample(label, used, context = {}) {
  return {
    tick: Game.time,
    label,
    used,
    bucket: Game.cpu.bucket,
    limit: Game.cpu.limit,
    tickLimit: Game.cpu.tickLimit,
    roomsVisible: Object.keys(Game.rooms).length,
    ...context
  };
}</code></pre>
<p>Keep context fields small and chosen in advance. For a path search, useful context might be route length or whether a CostMatrix cache was warm. For a room scan, it might be the number of visible rooms or candidate objects. Do not add so much instrumentation that the profiler becomes the workload you are measuring.</p>
<p>Use section deltas to locate work. Use whole-tick CPU and bucket trend to decide whether moving or caching that work actually improved the colony's runtime budget.</p>

<h2 id="bounded-history">Keep diagnostics bounded</h2>`,
    article.slug,
    "CPU comparison contract",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="scope">What this guide does not prove</h2>`,
    `<h2 id="choose-another-guide">Choose another guide when</h2>
<p>If the problem is not measurement but deciding which optional systems to suspend as the bucket falls, use the <a href="/en/blog/screeps-cpu-bucket-degradation">CPU bucket degradation guide</a>. If repeated parsing or lookup work should disappear from the hot path and can be rebuilt after a reset, use the <a href="/en/blog/screeps-global-cache">global-cache guide</a>. This page stays focused on measuring a concrete boundary and interpreting that evidence without turning a project threshold into an API rule.</p>

<h2 id="scope">What this guide does not prove</h2>`,
    article.slug,
    "CPU intent boundary",
  );

  let toc = insertTocBefore(
    article.toc,
    "bounded-history",
    ["comparison-contract", "Make CPU samples comparable"],
  );
  toc = insertTocBefore(
    toc,
    "scope",
    ["choose-another-guide", "Choose another guide when"],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 17, 2026 — Game.cpu.getUsed(), limit, tickLimit, bucket, the 10,000 bucket ceiling, and the current 500-CPU full-bucket tickLimit boundary",
        ],
        [
          "Static code review",
          "Passed — section deltas remain cumulative start/end measurements; zero is not used as an environment detector; project bucket thresholds stay labeled as policy; sample context is bounded",
        ],
      ],
      "No real-shard CPU sample set, controlled before/after benchmark, or multi-tick bucket trend was collected for this revision",
    ),
    articleHtml,
  };
}

function improveMovement(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<pre><code class="language-javascript">function getPositionKey(pos) {
  if (!pos) return null;
  return pos.roomName + ':' + pos.x + ':' + pos.y;
}

function recordMovementObservation(creep, moveResult) {
  Memory.moveDebug ??= {};

  const previous = Memory.moveDebug[creep.name] ?? null;
  const currentKey = getPositionKey(creep.pos);

  Memory.moveDebug[creep.name] = {
    tick: Game.time,
    position: currentKey,
    previousPosition: previous?.position ?? null,
    moveResult
  };

  return {
    currentKey,
    previousKey: previous?.position ?? null,
    previousTick: previous?.tick ?? null
  };
}</code></pre>
<p>A same-position comparison is useful only when the observations are from different ticks. Across room borders, include <code>roomName</code> as shown; comparing only <code>x</code> and <code>y</code> can misread a room transition.</p>`,
    `<pre><code class="language-javascript">function getPositionKey(pos) {
  if (!pos) return null;
  return pos.roomName + ':' + pos.x + ':' + pos.y;
}

function getTargetKey(target) {
  if (!target?.pos) return null;
  return getPositionKey(target.pos);
}

function recordMovementObservation(
  creep,
  target,
  desiredRange,
  moveResult,
  caller
) {
  Memory.moveDebug ??= {};

  const previous = Memory.moveDebug[creep.name] ?? null;
  const position = getPositionKey(creep.pos);
  const targetKey = getTargetKey(target);
  const sameSeries = Boolean(
    previous
    && previous.tick === Game.time - 1
    && previous.targetKey === targetKey
    && previous.desiredRange === desiredRange
    && previous.moveResult === OK
  );
  const previousAcceptedWithoutProgress = Boolean(
    sameSeries
    && previous.position === position
  );
  const consecutiveAcceptedStalls =
    previousAcceptedWithoutProgress
      ? (previous.consecutiveAcceptedStalls ?? 0) + 1
      : 0;

  Memory.moveDebug[creep.name] = {
    tick: Game.time,
    position,
    targetKey,
    desiredRange,
    moveResult,
    caller,
    consecutiveAcceptedStalls
  };

  return {
    previousAcceptedWithoutProgress,
    consecutiveAcceptedStalls,
    previousTick: previous?.tick ?? null,
    previousPosition: previous?.position ?? null,
    currentPosition: position
  };
}</code></pre>
<p>The counter advances only when the previous observation is from the immediately preceding tick, targets the same position with the same requested range, and records <code>moveTo() === OK</code>. That makes it evidence for a repeated accepted-movement series instead of accidentally comparing unrelated observations several ticks apart. It still does <strong>not</strong> prove traffic, a stale cached path, or another cause; combine it with the final same-tick movement caller and local occupancy before changing policy.</p>`,
    article.slug,
    "movement cross-tick diagnostic",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="not-this-guide">When this guide does not apply</h2>`,
    `<h2 id="decision-order">Checks in order before changing path policy</h2>
<ol>
<li>Keep the current <code>moveTo()</code> return code. Leave this guide immediately for <code>ERR_NO_PATH</code>, <code>ERR_TIRED</code>, <code>ERR_BUSY</code>, <code>ERR_INVALID_TARGET</code>, or <code>ERR_NO_BODYPART</code>.</li>
<li>Confirm the Creep is still outside the requested range. No tile change is required when the goal range is already satisfied.</li>
<li>Compare a consecutive later-tick position for the same target and range.</li>
<li>Identify the final movement call submitted for that Creep in the tick. A later movement call can replace the earlier intent.</li>
<li>Only then inspect traffic, changing obstacles, and path reuse. One unchanged tick is diagnostic evidence, not a root-cause label.</li>
</ol>
<p>This order prevents a common debugging loop where <code>reusePath: 0</code> is applied globally before the code has proved that path reuse is the failing boundary.</p>

<h2 id="not-this-guide">When this guide does not apply</h2>`,
    article.slug,
    "movement ordered checks",
  );

  const toc = insertTocBefore(
    article.toc,
    "not-this-guide",
    ["decision-order", "Checks in order"],
  );

  return {
    ...article,
    finalScore: 99,
    toc,
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 17, 2026 — Creep.moveTo() return codes, reusePath/noPathFinding, game-loop timing, and same-Creep movement-call priority",
        ],
        [
          "Static code review",
          "Passed — no-progress evidence now requires consecutive ticks, the same target/range, and a previous OK result; range satisfaction and final same-tick movement caller stay separate from traffic hypotheses",
        ],
      ],
      "No live traffic collision, same-tick movement override, or consecutive real-shard position-stall trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveSpawnReturnCodes(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<pre><code class="language-javascript">function bodyCost(body) {
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
<p>The body cost is a local calculation. The method return code remains the source of truth for whether that specific request was accepted.</p>`,
    `<pre><code class="language-javascript">function bodyCost(body) {
  if (!Array.isArray(body)) return null;

  let total = 0;
  for (const part of body) {
    const cost = BODYPART_COST[part];
    if (!Number.isFinite(cost)) return null;
    total += cost;
  }
  return total;
}

function describeSpawnEnergy(spawn, opts = {}) {
  const explicit = Array.isArray(opts.energyStructures);
  const selected = explicit ? opts.energyStructures : [];
  const selectedEnergyAvailable = explicit
    ? selected.reduce(
        (sum, structure) =>
          sum + (
            structure?.store?.getUsedCapacity(
              RESOURCE_ENERGY
            ) ?? 0
          ),
        0
      )
    : null;

  return {
    mode: explicit ? 'explicit' : 'room-default',
    roomEnergyAvailable: spawn.room.energyAvailable,
    selectedEnergyAvailable,
    selectedStructureIds: explicit
      ? selected.map(structure => structure?.id ?? null)
      : null
  };
}

console.log(JSON.stringify({
  bodyCost: bodyCost(body),
  energy: describeSpawnEnergy(spawn, opts)
}));</code></pre>
<p>When <code>energyStructures</code> is explicit, <code>selectedEnergyAvailable</code> is a useful snapshot of those supplied Stores; it is not a replacement implementation of <code>spawnCreep()</code> validation. Invalid structures, ownership/RCL state, busy state, name collisions, and changes between checks still belong to the API result. Without an explicit list, <code>room.energyAvailable</code> remains useful context for the default room-wide Spawn/Extension pool.</p>`,
    article.slug,
    "spawn energy diagnostic",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>If your own bot requires an object schema, label that as a project contract and validate it at that boundary. Do not present it as a <code>spawnCreep()</code> restriction.</p>`,
    `<p>If your own bot requires an object schema, label that as a project contract and validate it at that boundary. Do not present it as a <code>spawnCreep()</code> restriction.</p>
<p>The API also documents supplied Creep memory as being stored immediately in <code>Memory.creeps[name]</code>. That makes a Memory entry useful state, but <strong>not evidence that the Creep has finished spawning</strong>. Use the real <code>spawnCreep()</code> result and <code>spawn.spawning</code> for the operation boundary; use the <a href="/en/blog/screeps-spawn-creep">beginner spawn lesson</a> for the full multi-tick spawn lifecycle.</p>`,
    article.slug,
    "spawn memory timing boundary",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `    roomEnergyAvailable: spawn.room.energyAvailable,
    bodyCost: bodyCost(body)
  };
}</code></pre>`,
    `    bodyCost: bodyCost(body),
    energy: describeSpawnEnergy(spawn, opts)
  };
}</code></pre>`,
    article.slug,
    "spawn wrapper accepted energy context",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `      roomEnergyAvailable: spawn.room.energyAvailable,
      bodyCost: bodyCost(body)
    };
  }`,
    `      bodyCost: bodyCost(body),
      energy: describeSpawnEnergy(spawn, opts)
    };
  }`,
    article.slug,
    "spawn wrapper dry-run energy context",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>ERR_NAME_EXISTS</code></td><td>Generate/choose a different name or recognize the already-existing Creep.</td></tr>`,
    `<tr><td><code>ERR_NAME_EXISTS</code></td><td>First decide whether that name already represents the unit your scheduler wanted. Reuse the existing assignment when appropriate; generate another name only when you truly need another Creep.</td></tr>`,
    article.slug,
    "spawn name retry policy",
  );

  return {
    ...article,
    finalScore: 99,
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 17, 2026 — StructureSpawn.spawnCreep() body/name bounds, memory timing, energyStructures ordering, dryRun, all documented return codes, and Structure.isActive()",
        ],
        [
          "Static code review",
          "Passed — explicit Energy-source context no longer relies on room.energyAvailable alone; body-cost diagnostics fail closed on unknown parts; Memory presence is not treated as spawn completion; retry classes remain return-code specific",
        ],
      ],
      "No live Spawn request sequence, explicit-energyStructures failure, or accepted-to-complete spawning trace was collected for this revision",
    ),
    articleHtml,
  };
}

function improveMemory(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p>When a Creep needs to remember a Source, store the ID:</p>
<pre><code class="language-javascript">const source = creep.pos.findClosestByRange(
  FIND_SOURCES_ACTIVE
);

if (source) {
  creep.memory.sourceId = source.id;
}</code></pre>
<p>On a later tick, resolve the ID against the current game state and handle a missing object:</p>
<pre><code class="language-javascript">const source = creep.memory.sourceId
  ? Game.getObjectById(creep.memory.sourceId)
  : null;

if (!source) {
  delete creep.memory.sourceId;
  // Re-select only when your room/visibility policy says it is safe.
}</code></pre>
<p>A saved ID is durable data. The object returned by <code>Game.getObjectById()</code> is still a current game object. A <code>null</code> result is a branch to handle, not evidence that the saved JSON itself was malformed.</p>`,
    `<p>When a Creep needs to remember a Source, store both the stable ID and enough location context to distinguish “not visible” from “visible but unavailable” later:</p>
<pre><code class="language-javascript">const source = creep.pos.findClosestByRange(
  FIND_SOURCES_ACTIVE
);

if (source) {
  creep.memory.sourceId = source.id;
  creep.memory.sourceRoom = source.pos.roomName;
}</code></pre>
<p><code>Game.getObjectById()</code> can access room objects only when their room is visible. A <code>null</code> result therefore does not, by itself, prove that a remembered remote object was destroyed or that its ID is invalid.</p>
<pre><code class="language-javascript">function resolveRememberedSource(creep) {
  const sourceId = creep.memory.sourceId;
  const sourceRoom = creep.memory.sourceRoom;

  if (
    typeof sourceId !== 'string'
    || typeof sourceRoom !== 'string'
  ) {
    return { status: 'source-not-assigned', source: null };
  }

  if (!Game.rooms[sourceRoom]) {
    return {
      status: 'source-room-not-visible',
      source: null
    };
  }

  const source = Game.getObjectById(sourceId);
  if (!source) {
    return {
      status: 'source-missing-in-visible-room',
      source: null
    };
  }

  return { status: 'source-visible', source };
}</code></pre>
<p>Keep the assignment when the room is merely out of vision. If the room is visible and a target that your design expects to be persistent is genuinely missing, then clear or repair the assignment according to that target type. Transient targets such as dropped Resources need a different invalidation policy from persistent room objects such as Sources.</p>`,
    article.slug,
    "Memory visibility-aware ID recovery",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>Handle <code>Game.getObjectById()</code> returning <code>null</code>.</li>`,
    `<li>Handle <code>Game.getObjectById()</code> returning <code>null</code> without deleting a remote assignment until visibility makes that conclusion safe.</li>`,
    article.slug,
    "Memory debugging null boundary",
  );

  return {
    ...article,
    finalScore: 99,
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 17, 2026 — Game is rebuilt each tick, Memory JSON persistence, Creep.memory, StructureSpawn memory initialization, and Game.getObjectById() visibility/null behavior",
        ],
        [
          "Static code review",
          "Passed — current-tick, persistent, and disposable heap lifetimes stay distinct; remembered object IDs now preserve remote assignments when the room is not visible instead of treating null as destruction proof",
        ],
      ],
      "No live global-reset trace, remote-vision-loss trace, or multi-tick Memory persistence transcript was collected for this revision",
    ),
    articleHtml,
  };
}

export function applyEnglishEditorialNinth20260817(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-cpu-getused-bucket") return improveCpu(article);
  if (article.slug === "screeps-memory-basics") return improveMemory(article);
  if (article.slug === "screeps-spawncreep-return-codes") return improveSpawnReturnCodes(article);
  if (article.slug === "screeps-moveto-not-moving") return improveMovement(article);

  return article;
}

export function getEnglishEditorialNinthUpdatedAt20260817(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
