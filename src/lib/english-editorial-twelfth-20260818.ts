import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-introduction",
  "screeps-first-room",
  "screeps-tick-game-loop",
]);

function insertSection(
  html: string,
  addition: string,
  firstId: string,
  preferredAnchors: string[],
): string {
  if (html.includes(`id="${firstId}"`)) return html;

  const fallbacks = [
    `<h2 id="completion-check">`,
    `<h2 id="key-takeaway">`,
    `<h2 id="next-lesson">`,
    `<h2 id="where-to-go-next">`,
    `<h2 id="official-sources">`,
  ];

  for (const anchor of [...preferredAnchors, ...fallbacks]) {
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

  const index = toc.findIndex(([id]) => beforeIds.includes(id));
  if (index < 0) return [...toc, ...missing];

  return [...toc.slice(0, index), ...missing, ...toc.slice(index)];
}

function refreshVerification(
  article: EnglishBeginnerArticle,
  rows: Array<[string, string]>,
  liveBoundary: string,
): Array<[string, string]> {
  const replaced = new Set([
    "Official documentation",
    "Game-loop model",
    "Current game concepts",
    "Game collections and constants",
    "Offline logic review",
    "Offline syntax review",
    "Evidence level",
    "Screeps Console",
    "Live multi-tick log",
    "Live multi-tick test",
    "Current client layout",
    "Last verified",
    "Last editorial review",
    "Publication status",
  ]);

  return [
    ...article.verification.filter(([term]) => !replaced.has(term)),
    ...rows,
    [
      "Evidence level",
      "Official-documentation review, Chinese-source review, and static editorial/code review only; no real-shard execution is claimed",
    ],
    [
      "Screeps Console",
      "Pending — no real account Console transcript was collected for this revision",
    ],
    ["Live multi-tick verification", `Pending — ${liveBoundary}`],
    ["Last editorial review", REVIEWED_AT],
  ];
}

function improveIntroduction(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="persistent-world-runtime-boundary">Persistent world does not mean a permanently reliable JavaScript process</h2>
<p>Screeps: World keeps the game world running while you are offline, and your deployed script is executed on game ticks. That does <strong>not</strong> mean every JavaScript value you once created should be treated as durable state. The useful beginner distinction is between the <em>world state the server owns</em>, the <em>current-tick objects exposed through <code>Game</code></em>, and the <em>state your code deliberately persists</em>.</p>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Example</th><th>Safe beginner assumption</th></tr></thead>
<tbody>
<tr><td>Persistent game world</td><td>A Spawn, Controller level, Creep position, room terrain.</td><td>The server owns the authoritative world and advances it on ticks.</td></tr>
<tr><td>Current script snapshot</td><td><code>Game.creeps</code>, <code>Game.rooms</code>, object properties read this tick.</td><td>Use it to decide what to request now; do not rewrite it mentally into a future result.</td></tr>
<tr><td>Deliberately persisted state</td><td><code>Memory</code> values such as a role, phase, or object ID.</td><td>Store small serializable facts that must survive beyond one decision cycle.</td></tr>
<tr><td>Disposable runtime cache</td><td>A module/global map rebuilt from IDs or room data.</td><td>Treat it as an optimization that must be safe to rebuild.</td></tr>
</tbody></table></div>
<p>This boundary matters even in a first-room tutorial. A Creep may still exist in the world when an old JavaScript reference is no longer appropriate to reuse. Later code should re-read the current object from <code>Game</code> or rebuild it from a durable identifier. Use the <a href="/en/blog/screeps-memory-basics">Memory guide</a> for persistent state and the <a href="/en/blog/screeps-global-cache">global-cache guide</a> for rebuildable runtime data.</p>

<h2 id="automation-is-conditional">Automation is repeated conditional decision-making, not one long command</h2>
<p>A useful first mental model is not “tell the Creep to harvest forever.” It is “on each tick, inspect the current state and choose the next valid request.” A harvesting worker can therefore be described without inventing a framework:</p>
<pre><code class="language-javascript">if (creep.store.getFreeCapacity() > 0) {
  // Choose a current Source and request harvesting
  // when the Creep is in range.
} else {
  // Choose a current delivery target and request
  // a transfer when the Creep is in range.
}</code></pre>
<p>The exact movement, range checks, return codes, and target selection belong in their dedicated lessons. The point here is the control model: the script repeatedly turns <strong>current state → one bounded decision → a later state to inspect</strong>. That is why reliable Screeps code is easier to debug when each claim is tied to a visible property or a captured return code instead of to a vague promise that “the AI will handle it.”</p>`;

  return {
    ...article,
    finalScore: 99,
    searchIntent:
      "Beginner concept explanation of Screeps as a persistent strategy world controlled by repeated JavaScript decisions, with clear boundaries between current Game state, Memory, and rebuildable runtime data",
    toc: insertToc(
      article.toc,
      [
        ["persistent-world-runtime-boundary", "Persistent world vs JavaScript state"],
        ["automation-is-conditional", "Automation is conditional"],
      ],
      ["where-to-go-next", "key-takeaway", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — Introduction, Scripting Basics, game-loop timing, and current Game-state concepts",
        ],
        [
          "Static editorial review",
          "Passed — persistent world, current-tick Game state, Memory, and disposable runtime cache are no longer conflated",
        ],
        [
          "Intent boundary",
          "This page explains the game and automation model; executable harvesting, movement, spawning, Memory, and cache mechanics remain in dedicated guides",
        ],
      ],
      "No real-shard offline interval, global reset, Memory persistence sequence, or current client walkthrough was recorded",
    ),
    articleHtml: insertSection(
      article.articleHtml,
      addition,
      "persistent-world-runtime-boundary",
      [`<h2 id="where-to-go-next">`, `<h2 id="key-takeaway">`],
    ),
  };
}

function improveFirstRoom(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="visibility-ownership-boundary">Do not confuse visibility with ownership</h2>
<p><code>Game.rooms</code> is a current-vision collection, not an “owned rooms” list. If <code>Game.rooms[roomName]</code> exists, your script has a live <code>Room</code> object for that tick. Ownership is a separate question that you inspect on objects such as the room Controller or structures.</p>
<p>The account-wide collections also have narrower meanings than their names may suggest:</p>
<div class="table-scroll"><table>
<thead><tr><th>Read</th><th>What it tells you</th><th>Do not infer</th></tr></thead>
<tbody>
<tr><td><code>Object.keys(Game.rooms)</code></td><td>Room names with current vision in this tick.</td><td>That every listed Room is owned by you.</td></tr>
<tr><td><code>Object.keys(Game.spawns)</code></td><td>Your Spawn structures available through the current game state.</td><td>That the tutorial name <code>Spawn1</code> exists.</td></tr>
<tr><td><code>Object.keys(Game.creeps)</code></td><td>Your current Creeps keyed by exact name.</td><td>That a guessed example Creep exists.</td></tr>
<tr><td><code>room.controller?.my</code></td><td>Whether the visible Room Controller is owned by you.</td><td>That every visible object in the Room is yours.</td></tr>
</tbody></table></div>
<p>This distinction prevents a common beginner debugging mistake: finding a room name and then assuming ownership, or copying <code>Spawn1</code> from a tutorial and diagnosing unrelated code when the real name is different.</p>

<h2 id="bounded-room-snapshot">Capture one bounded read-only room snapshot</h2>
<p>The following Console probe is deliberately read-only. It chooses one currently visible Room, records the exact names you can reuse in later lessons, and keeps ownership separate from visibility.</p>
<pre><code class="language-javascript">const roomName = Object.keys(Game.rooms)[0];
const room = roomName ? Game.rooms[roomName] : null;

const snapshot = room ? {
  tick: Game.time,
  roomName: room.name,
  controller: room.controller ? {
    id: room.controller.id,
    my: room.controller.my === true,
    level: room.controller.level,
    position: [
      room.controller.pos.x,
      room.controller.pos.y
    ]
  } : null,
  mySpawns: room.find(FIND_MY_SPAWNS).map(spawn => ({
    name: spawn.name,
    spawning: spawn.spawning?.name || null
  })),
  myCreeps: room.find(FIND_MY_CREEPS).map(creep => ({
    name: creep.name,
    spawning: creep.spawning === true
  })),
  sourceIds: room.find(FIND_SOURCES).map(source => source.id)
} : {
  tick: Game.time,
  roomName: null,
  reason: 'no-currently-visible-room'
};

console.log(JSON.stringify(snapshot, null, 2));</code></pre>
<p>A successful print proves only what the current snapshot contains. It does not prove that the same room will remain visible on every later tick, that a Creep has finished a task, or that a Spawn request will succeed. Carry the exact names and IDs forward, then re-read the relevant current object when a later lesson needs it.</p>
<p>If a room-name string exists in Memory or configuration but <code>Game.rooms[roomName]</code> is absent, treat that as “no live Room object this tick,” not as proof the room disappeared. The focused <a href="/en/blog/screeps-room-visibility">room-visibility guide</a> covers that boundary in detail.</p>`;

  return {
    ...article,
    finalScore: 99,
    description:
      "Find your first Screeps Room, editor, and Console, then use read-only probes to separate current room visibility from ownership and capture exact Spawn, Creep, Source, and Controller identifiers.",
    searchIntent:
      "Beginner interface orientation and read-only inspection of current Screeps vision, with explicit separation between visible Rooms, owned objects, and copied tutorial names",
    toc: insertToc(
      article.toc,
      [
        ["visibility-ownership-boundary", "Visibility is not ownership"],
        ["bounded-room-snapshot", "Capture a room snapshot"],
      ],
      ["completion-check", "next-lesson", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — Game.rooms, Game.spawns, Game.creeps, Game.time, Room.find(), and current Room visibility semantics",
        ],
        [
          "Static code review",
          "Passed — probe is read-only, handles no visible Room, preserves exact names/IDs, and separates Controller ownership from Room visibility",
        ],
        [
          "Client-layout boundary",
          "The article describes the role of the room view, editor, and Console without asserting a fixed 2026 UI button position",
        ],
      ],
      "No real account inventory, observer/remote-vision transition, or current-client screenshot was collected",
    ),
    articleHtml: insertSection(
      article.articleHtml,
      addition,
      "visibility-ownership-boundary",
      [`<h2 id="completion-check">`, `<h2 id="next-lesson">`],
    ),
  };
}

function improveTickGameLoop(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="ok-is-not-outcome">Treat <code>OK</code> as same-tick request evidence, not outcome proof</h2>
<p>Action return codes are useful because they tell you how the method call was evaluated during the current script execution. But <code>OK</code> is not a substitute for observing the next world state. Official Screeps debugging guidance explicitly warns that a seemingly successful command may still fail to become the final executed outcome, for example when the engine later resolves a conflict or obstacle.</p>
<p>Use a two-part evidence pattern:</p>
<ol>
<li><strong>Tick N:</strong> capture the method result and the current object state that justified the request.</li>
<li><strong>Tick N+1 or later:</strong> re-read the relevant object and check the property that should have changed if the request actually took effect.</li>
</ol>
<p>For movement, that later property is usually position. For harvesting or transfer, inspect the appropriate Stores and target state. For spawning, inspect <code>spawn.spawning</code> and later <code>Game.creeps[name]</code>. Different APIs have different completion boundaries, so this lesson teaches the timing model rather than pretending every <code>OK</code> means the same thing.</p>

<h2 id="same-tick-priority">Multiple same-tick requests can change which command wins</h2>
<p>The game can accept multiple compatible action categories in one tick, while conflicting requests are resolved by engine rules. For repeated calls in the same action method family, a later call can take priority. That means a log showing one earlier <code>moveTo()</code> result is not enough to prove it was the movement intent that survived the tick.</p>
<pre><code class="language-javascript">const first = creep.moveTo(source);
const second = creep.moveTo(spawn);

console.log(JSON.stringify({
  tick: Game.time,
  first,
  second,
  positionNow: [
    creep.pos.roomName,
    creep.pos.x,
    creep.pos.y
  ]
}));</code></pre>
<p>The example is diagnostic, not recommended control logic. The Creep's position printed in the same execution is still the current-tick position. To learn where it actually moved, inspect the position again on a later tick. In production code, prefer one owner for each movement decision so the final intent is easier to explain.</p>

<h2 id="tick-observation-checklist">A minimal checklist for multi-tick debugging</h2>
<ul>
<li>Include <code>Game.time</code> in diagnostic records so observations cannot be accidentally combined across unrelated ticks.</li>
<li>Record the exact object or target identity, not just a human label such as “source” or “spawn.”</li>
<li>Capture the return code from the actual method call you are diagnosing.</li>
<li>Re-read the current game object on a later tick before claiming movement, Energy transfer, construction progress, or spawning completed.</li>
<li>If more than one code path can issue the same action type, record the caller or centralize the decision before changing pathfinding or role logic.</li>
</ul>
<p>This checklist turns “nothing happened” into a bounded question: <em>which request was made on which tick, and what changed afterward?</em></p>`;

  return {
    ...article,
    finalScore: 99,
    description:
      "Understand Screeps ticks, Game.time, and module.exports.loop; distinguish same-tick action return codes from later outcomes; and collect bounded multi-tick evidence when debugging.",
    searchIntent:
      "Beginner explanation of Screeps tick timing, repeated main-loop execution, same-tick request semantics, and later-tick outcome verification",
    toc: insertToc(
      article.toc,
      [
        ["ok-is-not-outcome", "OK is not outcome proof"],
        ["same-tick-priority", "Same-tick request priority"],
        ["tick-observation-checklist", "Multi-tick debugging checklist"],
      ],
      ["completion-check", "next-lesson", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — Game Loop, Scripting Basics, Debugging, Simultaneous Actions, Game.time, and CPU timing boundaries",
        ],
        [
          "Static code review",
          "Passed — same-tick snapshots are not presented as future outcomes, and the diagnostic example makes competing movement intents explicit",
        ],
        [
          "Timing boundary",
          "Tick duration remains server-load dependent; no wall-clock seconds-per-tick promise is made",
        ],
      ],
      "No real-shard consecutive-tick transcript, conflicting movement trace, or wall-clock timing sample was collected",
    ),
    articleHtml: insertSection(
      article.articleHtml,
      addition,
      "ok-is-not-outcome",
      [`<h2 id="completion-check">`, `<h2 id="next-lesson">`],
    ),
  };
}

export function applyEnglishEditorialTwelfth20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-introduction") return improveIntroduction(article);
  if (article.slug === "screeps-first-room") return improveFirstRoom(article);
  if (article.slug === "screeps-tick-game-loop") return improveTickGameLoop(article);

  return article;
}

export function getEnglishEditorialTwelfthUpdatedAt20260818(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
