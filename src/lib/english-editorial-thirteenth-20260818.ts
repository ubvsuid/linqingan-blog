import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const REVIEWED_AT = "August 18, 2026";

const SELECTED_SLUGS = new Set([
  "screeps-introduction",
  "screeps-first-room",
]);

function insertSection(
  html: string,
  addition: string,
  firstId: string,
  preferredAnchors: string[],
): string {
  if (html.includes(`id="${firstId}"`)) return html;

  const fallbackAnchors = [
    `<h2 id="completion-check">`,
    `<h2 id="key-takeaway">`,
    `<h2 id="next-lesson">`,
    `<h2 id="where-to-go-next">`,
    `<h2 id="official-sources">`,
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
    "Official docs",
    "Official documentation",
    "Game-loop model",
    "Current game concepts",
    "Game collections and constants",
    "Offline logic review",
    "Offline syntax review",
    "Static code review",
    "Static editorial review",
    "Intent boundary",
    "Client-layout boundary",
    "Evidence level",
    "Screeps Console",
    "Screeps Console test",
    "Live multi-tick log",
    "Live multi-tick test",
    "Live multi-tick verification",
    "Live multi-tick verification pending",
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
      "Current official-documentation review plus Chinese-source and static editorial/code review; no real-shard execution is claimed",
    ],
    [
      "Screeps Console test",
      "Pending — no real-account Console transcript was collected for this revision",
    ],
    ["Live multi-tick verification pending", `Pending — ${liveBoundary}`],
    ["Last editorial review", REVIEWED_AT],
    ["Publication status", "Ready after repository and production gates pass"],
  ];
}

function improveIntroduction(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="runtime-state-boundary">Persistent world does not make <code>Game</code> persistent state</h2>
<p>Screeps keeps the game world running while you are offline, and your deployed script is executed on game ticks. The official scripting model also says that the global <code>Game</code> object is created from scratch and filled with current data on every tick. Those are two different kinds of persistence.</p>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Example</th><th>Safe beginner assumption</th></tr></thead>
<tbody>
<tr><td>Persistent game world</td><td>Rooms, Structures, Creeps, Controller state, and other server-owned game state.</td><td>The server owns the authoritative world and advances it according to game rules.</td></tr>
<tr><td>Current <code>Game</code> snapshot</td><td><code>Game.creeps</code>, <code>Game.rooms</code>, object properties read this tick.</td><td>Use it to decide what to request now; do not use it as cross-tick storage.</td></tr>
<tr><td>Persistent JSON state</td><td><code>Memory</code> values such as a role, phase, room name, or object ID.</td><td>Store JSON-compatible facts that your script deliberately needs on later ticks.</td></tr>
<tr><td>Rebuildable runtime cache</td><td>A module/global map derived from durable IDs or current room data.</td><td>Treat it as a project optimization, not the only authoritative copy of durable state.</td></tr>
</tbody></table></div>
<p>The official Memory guidance is especially useful here: do not put live game objects into <code>Memory</code>. Store a stable identifier when you need one, then resolve a fresh current object with <code>Game.getObjectById()</code> or another current <code>Game</code> lookup. The <a href="/en/blog/screeps-memory-basics">Memory guide</a> covers durable state; the <a href="/en/blog/screeps-global-cache">global-cache guide</a> covers rebuildable runtime data.</p>

<h2 id="automation-decision-cycle">Automation is a repeated decision cycle, not one long command</h2>
<p>A useful first mental model is not “tell the Creep to harvest forever.” It is “on each tick, inspect current state and choose the next valid request.” For a simple worker, the control idea can be written before you learn the exact action APIs:</p>
<pre><code class="language-javascript">if (creep.store.getFreeCapacity() > 0) {
  // Choose a current Source and request the next
  // valid harvest or movement step.
} else {
  // Choose a current delivery target and request
  // the next valid transfer or movement step.
}</code></pre>
<p>The exact movement ranges, return codes, target policies, and Energy mechanics belong in their dedicated lessons. The important architecture is:</p>
<pre><code class="language-text">current Game snapshot
→ read durable Memory only when needed
→ choose one bounded decision
→ submit a game-object method
→ later tick: inspect the new snapshot
→ persist only the durable state you actually need</code></pre>
<p>Commands are processed after player scripts for the tick, so a same-tick method result is not the same thing as later world-state evidence. The <a href="/en/blog/screeps-tick-game-loop">tick and game-loop guide</a> develops that boundary in detail.</p>`;

  return {
    ...article,
    description:
      "Understand Screeps as a persistent programming strategy world, then separate the current Game snapshot, persisted Memory, and rebuildable runtime state before writing automation.",
    searchIntent:
      "Beginner concept explanation of Screeps as a persistent strategy world controlled by repeated JavaScript decisions, with clear boundaries between current Game state, persisted Memory, and rebuildable runtime data",
    finalScore: 99,
    toc: insertToc(
      article.toc,
      [
        ["runtime-state-boundary", "Persistent world vs runtime state"],
        ["automation-decision-cycle", "Repeated decision cycle"],
      ],
      ["where-to-go-next", "key-takeaway", "official-sources"],
    ),
    verification: refreshVerification(
      article,
      [
        [
          "Official documentation",
          "Checked August 18, 2026 — Introduction, Scripting Basics, Global Objects, and Game Loop for persistent-world, per-tick Game, Memory, and delayed command-processing boundaries",
        ],
        [
          "State boundary",
          "Game is treated as the current tick snapshot, Memory as persisted JSON, and runtime cache only as rebuildable project state rather than durable authority",
        ],
        [
          "Static editorial review",
          "Passed — the article no longer conflates a persistent game world with persistent JavaScript object references or guaranteed runtime-cache lifetime",
        ],
      ],
      "No real-shard offline interval, runtime restart/reset, Memory persistence sequence, or current-client walkthrough was recorded",
    ),
    articleHtml: insertSection(
      article.articleHtml,
      addition,
      "runtime-state-boundary",
      [`<h2 id="where-to-go-next">`, `<h2 id="key-takeaway">`],
    ),
  };
}

function improveFirstRoom(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle {
  const addition = String.raw`<h2 id="visibility-ownership-boundary">Do not confuse visibility with ownership</h2>
<p><code>Game.rooms</code> contains Rooms currently available to your script. The API defines room visibility through current vision, not ownership. A visible Room can therefore be neutral, hostile, reserved, observed, or otherwise not owned by you; ownership must be checked separately on the relevant game object.</p>
<div class="table-scroll"><table>
<thead><tr><th>Read</th><th>What it tells you</th><th>Do not infer</th></tr></thead>
<tbody>
<tr><td><code>Object.keys(Game.rooms)</code></td><td>Room names with a live Room object in the current tick.</td><td>That every listed Room is owned by you.</td></tr>
<tr><td><code>Object.keys(Game.spawns)</code></td><td>Your current Spawn structures keyed by exact Spawn name.</td><td>That the tutorial name <code>Spawn1</code> exists.</td></tr>
<tr><td><code>Object.keys(Game.creeps)</code></td><td>Your current Creeps keyed by exact Creep name.</td><td>That a guessed example name exists.</td></tr>
<tr><td><code>room.controller?.my</code></td><td>Whether the visible Room Controller is owned by you.</td><td>That every visible object in the Room is yours.</td></tr>
</tbody></table></div>
<p>This keeps two beginner questions separate: “can my script currently inspect this Room?” and “do I own the Controller or object I am about to act on?” It also prevents copied tutorial names from becoming fake evidence about your account.</p>

<h2 id="bounded-room-snapshot">Capture one bounded read-only room snapshot</h2>
<p>The following Console probe does not issue movement, harvesting, spawning, or Controller commands. It chooses one currently visible Room and records exact names and IDs that later lessons can reuse.</p>
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
<p>A successful print proves only what the current tick exposes. It does not prove future visibility, task completion, or that a later Spawn or Creep action will succeed. Carry exact names and IDs forward, then re-read the current object when a later lesson needs it.</p>
<p>If a room-name string exists in Memory or configuration but <code>Game.rooms[roomName]</code> is absent, the safe conclusion is only that no live <code>Room</code> object is available through <code>Game.rooms</code> for that name in the current snapshot. Do not turn that absence into proof that the room disappeared. The focused <a href="/en/blog/screeps-room-visibility">room-visibility guide</a> covers vision loss and reacquisition in detail.</p>`;

  return {
    ...article,
    description:
      "Find your first Screeps Room, editor, and Console, then separate current room visibility from ownership and capture exact Spawn, Creep, Source, and Controller identifiers with a read-only probe.",
    searchIntent:
      "Beginner interface orientation and read-only inspection of current Screeps vision, with explicit separation between visible Rooms, owned objects, and copied tutorial names",
    finalScore: 99,
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
          "Checked August 18, 2026 — Game.rooms visibility, Game.spawns, Game.creeps, Game.time, Room.find(), and current-object access boundaries",
        ],
        [
          "Static code review",
          "Passed — the probe is read-only, handles no visible Room, preserves exact names and IDs, and keeps Controller ownership separate from Room visibility",
        ],
        [
          "Client-layout boundary",
          "The guide describes the roles of room view, editor, and Console without asserting a fixed 2026 button position or unverified current-client screenshot",
        ],
      ],
      "No real-account room inventory, remote-vision transition, current-client screenshot, or multi-tick Console trace was collected",
    ),
    articleHtml: insertSection(
      article.articleHtml,
      addition,
      "visibility-ownership-boundary",
      [`<h2 id="completion-check">`, `<h2 id="next-lesson">`],
    ),
  };
}

export function applyEnglishEditorialThirteenth20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-introduction") return improveIntroduction(article);
  if (article.slug === "screeps-first-room") return improveFirstRoom(article);
  return article;
}

export function getEnglishEditorialThirteenthUpdatedAt20260818(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
