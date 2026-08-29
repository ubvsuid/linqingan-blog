import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-18";
const FIRST_ROOM_UPDATED_AT = "2026-08-28";
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

function replaceSection(
  html: string,
  startId: string,
  endId: string,
  replacement: string,
): string {
  const start = `<h2 id="${startId}">`;
  const end = `<h2 id="${endId}">`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end, startIndex + start.length);

  if (startIndex < 0 || endIndex < 0) {
    throw new Error(
      `English editorial thirteenth pass could not replace ${startId} before ${endId}`,
    );
  }

  return `${html.slice(0, startIndex)}${replacement}\n\n${html.slice(endIndex)}`;
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
  const workAreas = String.raw`<h2 id="three-work-areas">Find and open the three work areas</h2>
<p>The Screeps client can rearrange navigation over time, so use the destination checks below instead of relying on one fixed button position.</p>
<ol>
<li><strong>Open the room view.</strong> From the game interface, open a Room you can currently see. You have reached the room view when the main game area shows the room grid, terrain, and game objects such as Sources, Creeps, structures, or a Controller.</li>
<li><strong>Open the code editor.</strong> Switch to the part of the Screeps client where your game script is shown. You have reached the editor when you can see JavaScript code and the modules or files that make up the script. Do not change code yet.</li>
<li><strong>Open the player Console.</strong> Open Screeps' in-game Console or log area, not the browser developer-tools console. You have reached the right Console when game log output and a command input are available. Run <code>Object.keys(Game.rooms)</code>; the expression evaluates to an array, and Room names appear when your script currently has vision.</li>
</ol>
<p><strong>Use each area for one job:</strong> observe the world in the room view, edit persistent game code in the editor, and run temporary inspection commands in the Console.</p>
<p>These are semantic arrival checks, not a claim about an exact 2026 button location or screenshot. If the client layout changes, the checks still tell you whether you opened the right area.</p>`;

  const visibilityBoundary = String.raw`<h2 id="visibility-ownership-boundary">Visibility is not ownership</h2>
<p><code>Game.rooms</code> contains Rooms available to your script in the current tick. That does not mean every visible Room is yours. <code>Game.spawns</code> and <code>Game.creeps</code> list your owned Spawns and Creeps by exact name, while <code>room.controller?.my</code> tells you whether the visible Room Controller is owned by you.</p>
<p>For this lesson, keep the rule simple: first confirm that a live <code>Room</code> exists before reading deeper Room state, then check ownership on the specific object before a later lesson tries to act on it. If a Room disappears from <code>Game.rooms</code>, use the <a href="/en/blog/screeps-room-visibility">Room visibility guide</a> for the deeper vision-loss and reacquisition cases.</p>`;

  let articleHtml = replaceSection(
    article.articleHtml,
    "three-work-areas",
    "objects-in-the-room",
    workAreas,
  );

  articleHtml = articleHtml.replace(
    "<p>The Screeps client can change over time, so this guide focuses on what each area does rather than promising that a button will always remain in one exact position.</p>",
    "<p>The Screeps client can change over time. This guide therefore uses visible arrival checks — what you can see or do after opening each area — instead of promising a fixed button position.</p>",
  );
  articleHtml = articleHtml.replace(
    "<p>Open a Room that you currently control or can see through your game objects. Look for these four object types.</p>",
    "<p>In the room view you just opened, look for these four object types. The Console checks below will tell you which Rooms and owned objects are available to your script in the current tick.</p>",
  );
  articleHtml = articleHtml.replace(
    "<li>Click each owned Spawn and compare its name with <code>spawnNames</code>.</li>",
    "<li>Select each owned Spawn and compare its name with <code>spawnNames</code>.</li>",
  );
  articleHtml = articleHtml.replace(
    "<li>Click the Controller and compare its level and coordinates with the <code>controller</code> object.</li>",
    "<li>Select the Controller and compare its level and coordinates with the <code>controller</code> object.</li>",
  );
  articleHtml = articleHtml.replace(
    "<li>explain the difference between the room view, code editor, and Console;</li>",
    "<li>open the room view, code editor, and player Console, and explain what each area is for;</li>",
  );
  articleHtml = articleHtml.replace(
    '<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: Scripting Basics</a></li>',
    '<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: Scripting Basics</a></li>\n<li><a href="https://docs.screeps.com/debugging.html" rel="nofollow noopener noreferrer">Screeps Documentation: Debugging</a></li>',
  );

  articleHtml = insertSection(
    articleHtml,
    visibilityBoundary,
    "visibility-ownership-boundary",
    [`<h2 id="completion-check">`, `<h2 id="next-lesson">`],
  );

  const toc = insertToc(
    article.toc
      .filter(([id]) => id !== "bounded-room-snapshot")
      .map(([id, label]) =>
        id === "three-work-areas"
          ? [id, "Find and open the three work areas"] as [string, string]
          : [id, label] as [string, string]
      ),
    [["visibility-ownership-boundary", "Visibility is not ownership"]],
    ["completion-check", "next-lesson", "official-sources"],
  );

  return {
    ...article,
    description:
      "Open a Screeps Room, switch to the code editor and player Console, then use read-only checks to match exact Room, Spawn, Creep, Source, and Controller data.",
    searchIntent:
      "Beginner interface orientation that opens the Room view, code editor, and player Console before using read-only current-tick checks for real account object names and visibility",
    readingTime: "7 min read",
    finalScore: 98,
    toc,
    verification: [
      ["Chinese source", "Read in full"],
      [
        "Official documentation",
        "Checked August 28, 2026 — Scripting Basics, Debugging, Game.rooms, Game.spawns, Game.creeps, Game.time, and Room.find()",
      ],
      ["JavaScript syntax", "Checked — both Console probes use valid JavaScript syntax"],
      [
        "Static code review",
        "Passed — the probes are read-only, use real account values instead of guessed names, and check Room existence before deeper reads",
      ],
      [
        "Client navigation",
        "Semantic navigation only — no fixed 2026 button position or current-client screenshot is claimed; each destination is identified by what is visible or executable after it opens",
      ],
      [
        "Evidence level",
        "Official-documentation, Chinese-source, and static code/content review; no real-account execution is claimed",
      ],
      [
        "Screeps Console test",
        "Pending — no real-account Console transcript was collected for this revision",
      ],
      [
        "Live multi-tick verification",
        "Not required for these read-only current-tick probes; no later-tick outcome is claimed",
      ],
      [
        "Current-client screenshot",
        "Pending — no screenshot is used as evidence for interface placement",
      ],
    ],
    articleHtml,
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
  if (slug === "screeps-first-room") return FIRST_ROOM_UPDATED_AT;
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
