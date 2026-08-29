import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export type EnglishOriginalArticle = Omit<EnglishBeginnerArticle, "chinesePath"> & {
  chinesePath?: undefined;
};

export const englishPathfinderSearchArticle = {
  slug: "screeps-pathfinder-search",
  path: "/en/blog/screeps-pathfinder-search",
  title: "Screeps PathFinder.search(): Goal Range, Complete Paths, and the incomplete Flag",
  headline: "How to Use PathFinder.search() Without Accepting Partial Paths",
  description:
    "Call PathFinder.search() with the goal range your action actually needs, interpret path, ops, cost, and incomplete correctly, and reject partial paths before handing movement to a Creep.",
  category: "MOVEMENT · PATHFINDER SEARCH",
  publishedAt: "2026-08-29",
  publishedLabel: "August 29, 2026",
  readingTime: "15 min read",
  breadcrumbLabel: "PathFinder.search()",
  tags: ["Screeps", "PathFinder", "Pathfinding", "Movement", "Debugging"],
  keywords: [
    "Screeps PathFinder.search",
    "Screeps PathFinder incomplete",
    "Screeps PathFinder goal range",
    "Screeps PathFinder path cost",
    "Screeps partial path",
  ],
  primaryKeyword: "Screeps PathFinder.search",
  searchIntent:
    "Run and interpret one PathFinder.search() call with the correct goal range, then reject incomplete partial paths before downstream movement or task assignment",
  finalScore: 97,
  verification: [
    ["Article origin", "Original English guide — no translated source article"],
    ["Official API docs", "Checked — PathFinder.search() goal, range, options, and result contract"],
    ["Completion gate", "Checked — incomplete=true is treated as failure even when path is non-empty"],
    ["Result semantics", "Checked — path, ops, and cost are kept distinct"],
    ["Code review", "Passed — examples guard missing objects, complete searches, and empty completed paths"],
    ["Screeps Console test", "Pending — no Console execution is claimed"],
    ["Live shard movement test", "Pending — no live path execution is claimed"],
    ["Last verified", "August 29, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["minimal-pattern", "Use the smallest safe search pattern"],
    ["goal-range", "Make goal range match the task"],
    ["result-contract", "Read path, ops, cost, and incomplete separately"],
    ["partial-path", "Why a non-empty path can still be failure"],
    ["empty-complete-path", "Why an empty complete path can be success"],
    ["search-limits", "Know which limits can stop the search"],
    ["multiple-goals", "Use multiple goals without confusing selection with distance"],
    ["movement-handoff", "Hand a complete path to movement"],
    ["debugging", "Debug an incomplete search in the right order"],
    ["scope", "Know what this guide does not own"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does path.length > 0 mean PathFinder.search() succeeded?",
      "No. The official result contract says an incomplete search can still return a populated partial path. Check incomplete before treating the path as usable.",
    ],
    [
      "What range should I use when pathing to a Source?",
      "Use at least range 1 because a Creep cannot stand on the Source tile. More generally, choose the stop range from the downstream action rather than from the target object's coordinates alone.",
    ],
    [
      "Is result.cost the number of steps?",
      "No. cost is the accumulated configured search cost from terrain costs and CostMatrix values. A path with the same number of RoomPositions can have a different cost.",
    ],
    [
      "Is result.ops the path length?",
      "No. ops reports search operations. It is useful when investigating pathfinding work, but it is not a distance metric.",
    ],
    [
      "Should I call Creep.moveByPath() when the completed path is empty?",
      "Usually no. First check whether the Creep already satisfies the goal range. An empty path with incomplete=false can mean no movement is required.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-pathfinder-costmatrix",
    label: "Related pathfinding guide",
    title: "Build and Debug a CostMatrix",
  },
  next: {
    href: "/en/blog/screeps-err-no-path",
    label: "If the search still fails",
    title: "Diagnose ERR_NO_PATH",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>PathFinder.search()</code> is a search API, not a movement command. Give it an origin and a goal whose <code>range</code> matches the position your next action actually needs. Then treat <code>result.incomplete</code> as the completion gate. A non-empty <code>result.path</code> is not proof of success because an incomplete search may still return the closest partial path it found.</p>
<p>The safe order is: define the goal contract, run the search, reject <code>incomplete</code>, handle the valid empty-path case, and only then hand a complete non-empty path to movement.</p>

<h2 id="minimal-pattern">Use the smallest safe search pattern</h2>
<p>This example searches from one Creep to one visible Source. The Source tile is not walkable, so the goal stops at range 1:</p>
<pre><code class="language-javascript">const creep = Object.values(Game.creeps)[0];
const source = creep?.room.find(FIND_SOURCES)[0];

if (!creep || !source) {
  console.log('missing creep or source');
  return;
}

const result = PathFinder.search(
  creep.pos,
  { pos: source.pos, range: 1 }
);

console.log(JSON.stringify({
  incomplete: result.incomplete,
  steps: result.path.length,
  ops: result.ops,
  cost: result.cost
}));

if (result.incomplete) {
  console.log('search stopped before reaching the goal range');
  return;
}

if (result.path.length === 0) {
  console.log('goal range already satisfied; no movement path needed');
  return;
}

const moveResult = creep.moveByPath(result.path);
console.log({ moveResult });</code></pre>
<p>There are two separate decisions here. <code>incomplete</code> answers whether the search reached a valid goal state. <code>path.length</code> answers how many positions the returned route contains. Do not reverse those responsibilities.</p>

<h2 id="goal-range">Make goal range match the task</h2>
<p>A PathFinder goal can be a <code>RoomPosition</code> or an object containing <code>pos</code> and <code>range</code>. The documented default range is 0, which means the search tries to reach the target position itself.</p>
<p>That default is wrong for targets that cannot be occupied. The official documentation uses a Source as the example: a Creep cannot stand on the Source tile, so the goal should stop at least one square away.</p>
<pre><code class="language-javascript">const sourceGoal = {
  pos: source.pos,
  range: 1
};

const result = PathFinder.search(creep.pos, sourceGoal);</code></pre>
<p>Use the downstream task to choose the range. If the next operation requires adjacency, range 1 is the natural search contract. If another action can operate farther away, use the range that action actually permits instead of automatically forcing every search to range 1.</p>
<div class="callout"><strong>Important:</strong> the goal range changes where the search is allowed to finish. It does not change the range rules of <code>harvest()</code>, <code>transfer()</code>, <code>upgradeController()</code>, or any other action.</div>

<h2 id="result-contract">Read path, ops, cost, and incomplete separately</h2>
<p><code>PathFinder.search()</code> returns one object with four fields that answer different questions:</p>
<div class="table-scroll"><table>
<thead><tr><th>Field</th><th>What it means</th><th>Do not treat it as</th></tr></thead>
<tbody>
<tr><td><code>path</code></td><td>An array of <code>RoomPosition</code> objects for the returned route</td><td>A success flag</td></tr>
<tr><td><code>ops</code></td><td>Search operations performed before the result was calculated</td><td>Path length or travel ticks</td></tr>
<tr><td><code>cost</code></td><td>Accumulated search cost from terrain costs and any CostMatrix values</td><td>Geometric distance</td></tr>
<tr><td><code>incomplete</code></td><td>Whether the pathfinder failed to find a complete path</td><td>A hint you can ignore when <code>path</code> is non-empty</td></tr>
</tbody></table></div>
<p>The separation matters when you compare candidates. A route can contain fewer positions but have a higher configured cost. A search can perform many operations and still return a short route. And an incomplete search can return positions that look plausible without ever reaching the required goal range.</p>

<h2 id="partial-path">Why a non-empty path can still be failure</h2>
<p>The easiest PathFinder bug is this:</p>
<pre><code class="language-javascript">const result = PathFinder.search(origin, goal);

if (result.path.length > 0) {
  assignTask(result.path); // unsafe success test
}</code></pre>
<p>The official API explicitly says that when the pathfinder fails to find a complete path, <code>incomplete</code> becomes <code>true</code> and <code>path</code> can still contain the closest partial path found under the search parameters.</p>
<p>If that partial route is accepted as a valid assignment, the failure moves downstream. A Creep may walk partway toward a target and stop at a room boundary, a blocked area, or a search-limit frontier. The movement layer then looks broken even though the original error was accepting an incomplete search.</p>
<p>Gate the assignment where the evidence exists:</p>
<pre><code class="language-javascript">function findCompletePath(origin, goal, opts = {}) {
  const result = PathFinder.search(origin, goal, opts);

  if (result.incomplete) {
    return {
      ok: false,
      reason: 'incomplete-search',
      path: [],
      ops: result.ops,
      cost: result.cost
    };
  }

  return {
    ok: true,
    path: result.path,
    ops: result.ops,
    cost: result.cost
  };
}</code></pre>
<p>Keeping the partial path out of the success payload prevents a later caller from accidentally treating it as movement-ready.</p>

<h2 id="empty-complete-path">Why an empty complete path can be success</h2>
<p>The opposite shortcut is also unsafe: <code>path.length === 0</code> does not automatically mean failure. If the origin already satisfies the goal range, there may be no movement step to return.</p>
<pre><code class="language-javascript">const goal = { pos: source.pos, range: 1 };
const result = PathFinder.search(creep.pos, goal);

if (!result.incomplete && result.path.length === 0) {
  const alreadyReady = creep.pos.inRangeTo(source.pos, 1);
  console.log({ alreadyReady });
}</code></pre>
<p>This gives you a useful invariant: first ask whether the search completed, then ask whether movement is necessary. Do not force both questions into one path-length check.</p>

<h2 id="search-limits">Know which limits can stop the search</h2>
<p>The default search has bounded work. Current official documentation lists <code>maxOps</code> with a default of 2000, <code>maxRooms</code> with a default of 16 and maximum of 64, and <code>maxCost</code> with a default of <code>Infinity</code>. A <code>roomCallback</code> can also return <code>false</code> to exclude a room from the search.</p>
<p>Those controls are useful, but they can also make an otherwise reachable destination incomplete under your chosen search contract. If you deliberately override them, log the exact values rather than treating the following diagnostic example as recommended defaults:</p>
<pre><code class="language-javascript">const opts = {
  maxOps: 4000,
  maxRooms: 8,
  maxCost: 250
};

const result = PathFinder.search(creep.pos, goal, opts);

console.log(JSON.stringify({
  goalRoom: goal.pos.roomName,
  goalRange: goal.range,
  maxOps: opts.maxOps,
  maxRooms: opts.maxRooms,
  maxCost: opts.maxCost,
  incomplete: result.incomplete,
  steps: result.path.length,
  ops: result.ops,
  cost: result.cost
}));</code></pre>
<p>Do not respond to every incomplete result by blindly increasing limits. First confirm that the goal range is achievable and that your room or CostMatrix policy did not deliberately block the route.</p>
<p>If you need to build walkability and terrain costs, use the dedicated <a href="/en/blog/screeps-pathfinder-costmatrix">CostMatrix guide</a>. This article only owns the search-result contract.</p>

<h2 id="multiple-goals">Use multiple goals without confusing selection with distance</h2>
<p><code>PathFinder.search()</code> can accept an array of goals. The API returns the cheapest path it finds among them under the configured search costs.</p>
<pre><code class="language-javascript">const goals = creep.room.find(FIND_SOURCES).map((source) => ({
  pos: source.pos,
  range: 1
}));

if (goals.length === 0) {
  console.log('no visible sources');
  return;
}

const result = PathFinder.search(creep.pos, goals);

if (result.incomplete) {
  console.log('no complete goal reached under this search contract');
  return;
}</code></pre>
<p>“Cheapest” here follows PathFinder costs; it does not necessarily mean the fewest RoomPositions. If your task also needs load balancing, stable identity, assignment counts, or resource availability, path search is only one input to that policy. The <a href="/en/blog/screeps-select-source-by-path">Source selection guide</a> owns that higher-level assignment problem.</p>

<h2 id="movement-handoff">Hand a complete path to movement</h2>
<p>Path search and movement execution should stay separate. A complete search result says the route reached the requested goal contract. It does not say the Creep has already moved.</p>
<pre><code class="language-javascript">const result = PathFinder.search(creep.pos, goal);

if (result.incomplete) {
  return;
}

if (result.path.length > 0) {
  const moveResult = creep.moveByPath(result.path);
  console.log(JSON.stringify({
    moveResult,
    firstStep: result.path[0],
    remainingSteps: result.path.length
  }));
}</code></pre>
<p><code>moveByPath()</code> is a movement call with its own return value. Keep that return value separate from <code>result.incomplete</code>. If movement is accepted but later position does not change, continue with the <a href="/en/blog/screeps-moveto-not-moving">movement progress diagnostic</a> rather than rewriting the search result.</p>

<h2 id="debugging">Debug an incomplete search in the right order</h2>
<ol>
<li><strong>Confirm origin and goal identity.</strong> Log room names and coordinates so you know what was actually searched.</li>
<li><strong>Confirm goal range.</strong> Do not search for an occupied or non-walkable target tile with the default range 0.</li>
<li><strong>Check <code>incomplete</code> directly.</strong> Never infer completion from a populated path.</li>
<li><strong>Inspect search limits.</strong> Record <code>maxOps</code>, <code>maxRooms</code>, and <code>maxCost</code> when you override them.</li>
<li><strong>Inspect room exclusion.</strong> A <code>roomCallback</code> returning <code>false</code> makes that room unavailable to the search.</li>
<li><strong>Inspect custom costs.</strong> A CostMatrix can make tiles effectively unwalkable or make a route exceed your cost budget.</li>
<li><strong>Only then debug movement.</strong> A complete search and an accepted movement command are different stages.</li>
</ol>
<p>If the failure is specifically <code>ERR_NO_PATH</code> from a movement or routing API, the <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH guide</a> compares the relevant failure surfaces.</p>

<h2 id="scope">Know what this guide does not own</h2>
<p>This article owns one question: how to form a correct <code>PathFinder.search()</code> request and interpret its result before downstream code accepts it.</p>
<ul>
<li>For custom tile costs and walkability, use <a href="/en/blog/screeps-pathfinder-costmatrix">PathFinder CostMatrix</a>.</li>
<li>For room-level route selection, use <a href="/en/blog/screeps-map-find-route">Game.map.findRoute()</a>.</li>
<li>For failed path diagnostics across APIs, use <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH</a>.</li>
<li>For a Creep that received movement but does not progress, use <a href="/en/blog/screeps-moveto-not-moving">moveTo() not moving</a>.</li>
<li>For stable Source assignment policy, use <a href="/en/blog/screeps-select-source-by-path">Source selection by path</a>.</li>
</ul>
<p>This boundary keeps search correctness from turning into a second CostMatrix guide, a second movement diagnostic, or a second target-selection system.</p>

<h2 id="faq">FAQ</h2>
<h3>Does path.length &gt; 0 mean PathFinder.search() succeeded?</h3>
<p>No. An incomplete result may still include a partial path. Check <code>incomplete</code>.</p>
<h3>What range should I use for a Source?</h3>
<p>At least 1. A Source tile is not walkable, and the official documentation uses range 1 in its example.</p>
<h3>Is cost the number of steps?</h3>
<p>No. It is the accumulated configured search cost.</p>
<h3>Is ops the number of movement ticks?</h3>
<p>No. It is the number of search operations performed before the path was calculated.</p>
<h3>Can a completed search return an empty path?</h3>
<p>Yes when no movement is needed to satisfy the goal contract. Confirm the origin already meets the requested range before deciding what to do next.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#PathFinder-search" rel="noopener noreferrer">Screeps API — PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveByPath" rel="noopener noreferrer">Screeps API — Creep.moveByPath()</a></li>
</ul>
<p><code>PathFinder.use()</code> is deprecated in the current API documentation and is not part of this guide.</p>
`,
} satisfies EnglishOriginalArticle;

export const englishPathfinderBatchNineteenArticles: EnglishOriginalArticle[] = [
  englishPathfinderSearchArticle,
];

export function getEnglishPathfinderBatchNineteenArticle(
  slug: string,
): EnglishOriginalArticle | undefined {
  return englishPathfinderBatchNineteenArticles.find((article) => article.slug === slug);
}
