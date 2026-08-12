import type { EnglishBeginnerArticle } from "./english-beginner-content";

const UPDATED_AT = "2026-08-12";

const selectedSlugs = new Set([
  "screeps-err-not-in-range",
  "screeps-moveto-not-moving",
  "screeps-cpu-getused-bucket",
  "screeps-memory-basics",
  "screeps-spawn-creep",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`Editorial source changed before ${slug} patch: ${search.slice(0, 80)}`);
  }

  return html.replace(search, replacement);
}

function verification(
  docs: string,
  staticReview: string,
  liveBoundary: string,
): Array<[string, string]> {
  return [
    ["Official documentation", docs],
    ["Static code review", staticReview],
    ["Console test pending", "Not run in this editorial pass"],
    ["Live multi-tick verification pending", liveBoundary],
    ["Last verified", "August 12, 2026"],
  ];
}

function patchErrNotInRange(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let html = article.articleHtml;

  html = replaceRequired(
    html,
    '<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep is not yours.</td><td>Validate the selected object.</td></tr>',
    '<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep is not yours.</td><td>Validate the selected object.</td></tr>\n<tr><td><code>ERR_NO_BODYPART</code></td><td>The Creep has no active <code>MOVE</code> body part.</td><td>Do not keep retrying movement; inspect the body and damage state.</td></tr>',
    slug,
  );

  html = replaceRequired(
    html,
    '<h2 id="source-correction">Current moveTo() return-code correction</h2>\n<p>The Chinese source listed <code>ERR_NO_BODYPART</code> as a possible <code>moveTo()</code> result. The current official <code>Creep.moveTo()</code> return table does not list that code. This English article still checks <code>creep.getActiveBodyparts(MOVE)</code> because a Creep without an active MOVE part cannot make normal movement progress, but it does not attribute an undocumented return value to <code>moveTo()</code>.</p>',
    '<h2 id="source-correction">Current moveTo() API boundary</h2>\n<p>The current official <code>Creep.moveTo()</code> return table includes <code>ERR_NO_BODYPART</code> (<code>-12</code>) when the Creep has no active <code>MOVE</code> body part. The precheck in this guide is still useful because it fails before path work, but it is a diagnostic convenience, not a replacement for reading the actual return value from <code>moveTo()</code>.</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<li>Precheck active MOVE parts without inventing a moveTo() return code.</li>',
    '<li>Precheck active MOVE parts, and still record the real <code>moveTo()</code> return code.</li>',
    slug,
  );

  html = replaceRequired(
    html,
    '<h3>Does moveTo() return ERR_NO_BODYPART?</h3>\n<p>The current official return table does not list it. Check active MOVE parts separately.</p>',
    '<h3>Does moveTo() return ERR_NO_BODYPART?</h3>\n<p>Yes. The current official return table includes <code>ERR_NO_BODYPART</code> (<code>-12</code>) when the Creep has no active <code>MOVE</code> body part. A body-part precheck can make that failure easier to explain, but log the method result as the source of truth.</p>',
    slug,
  );

  return {
    ...article,
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Creep action ranges, moveTo(), ERR_NO_BODYPART, and game-loop timing",
      "Passed — action and movement results stay separate; range-1/range-3 examples and no-MOVE boundary reviewed",
      "Movement followed by later action retry has not been observed on a live shard for this revision",
    ),
    articleHtml: html,
  };
}

function patchMoveToNotMoving(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let html = article.articleHtml;

  html = replaceRequired(
    html,
    '<p>Do not collapse both cases into “the Creep is stuck.” Save the current return value and compare positions from later ticks.</p>',
    '<p>Do not collapse both cases into “the Creep is stuck.” This guide applies after the current call returns <code>OK</code> and a later tick still shows no position progress. If the call returns <code>ERR_NO_PATH</code>, <code>ERR_TIRED</code>, <code>ERR_BUSY</code>, or <code>ERR_NO_BODYPART</code>, diagnose that return code first instead of treating it as an accepted-movement stall.</p>',
    slug,
  );

  const validatorOld = `function hasValidPosition(target) {\n  return Boolean(\n    target\n    && target.pos\n    && Number.isInteger(target.pos.x)\n    && Number.isInteger(target.pos.y)\n    && typeof target.pos.roomName === 'string'\n  );\n}`;
  const validatorNew = `function hasValidPosition(target) {\n  return Boolean(\n    target\n    && target.pos\n    && Number.isInteger(target.pos.x)\n    && target.pos.x >= 0\n    && target.pos.x <= 49\n    && Number.isInteger(target.pos.y)\n    && target.pos.y >= 0\n    && target.pos.y <= 49\n    && typeof target.pos.roomName === 'string'\n    && target.pos.roomName.length > 0\n  );\n}`;
  html = replaceRequired(html, validatorOld, validatorNew, slug);
  html = replaceRequired(html, validatorOld, validatorNew, slug);

  html = replaceRequired(
    html,
    '<h2 id="source-correction">Current moveTo() return-code correction</h2>\n<p>The Chinese source listed <code>ERR_NO_BODYPART</code> as a <code>moveTo()</code> return. The current official return table does not list it. This English version checks active MOVE parts as a movement capability prerequisite and logs the server\'s actual <code>moveTo()</code> result without attributing an undocumented code to the method.</p>',
    '<h2 id="source-correction">Current moveTo() API boundary</h2>\n<p>The current official <code>Creep.moveTo()</code> return table includes <code>ERR_NO_BODYPART</code> (<code>-12</code>) when no active <code>MOVE</code> body part remains. This guide checks active MOVE parts before the call so that failure is explicit. If your own code does call <code>moveTo()</code> in that state, treat the returned <code>-12</code> as a call failure, not as an <code>OK</code>-but-stalled case.</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<p>When the same Creep receives multiple movement calls in one tick, the later movement action takes precedence. Use one movement decision point rather than letting role, traffic, combat, and border modules all submit movement independently.</p>',
    '<p>For movement methods submitted by the same Creep in one tick, Screeps gives the later movement call priority. Log or centralize the final movement decision; otherwise an earlier <code>moveTo()</code> can return <code>OK</code> even though a later <code>move()</code>, <code>moveTo()</code>, or other movement method becomes the intent that is actually resolved.</p>',
    slug,
  );

  return {
    ...article,
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — moveTo(), ERR_NO_BODYPART, fatigue, and simultaneous movement-action priority",
      "Passed — target coordinates are bounded to room tiles; accepted-call and call-failure branches are separated",
      "Traffic, path-cache behavior, and later-tick position changes have not been reproduced on a live shard for this revision",
    ),
    articleHtml: html,
  };
}

function patchCpu(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let html = article.articleHtml;

  html = replaceRequired(
    html,
    '<tr><td><code>Game.cpu.limit</code></td><td>Normal CPU allowance associated with your account</td><td>The maximum CPU available on every tick</td></tr>',
    '<tr><td><code>Game.cpu.limit</code></td><td>The normal CPU limit currently assigned to this shard</td><td>The maximum CPU available on every tick</td></tr>',
    slug,
  );

  const unsafeDetector = `<pre><code class="language-javascript">function canMeasureCpuHere() {\n  const first = Game.cpu.getUsed();\n  const second = Game.cpu.getUsed();\n\n  return {\n    first,\n    second,\n    measurementAvailable:\n      Number.isFinite(first)\n      && Number.isFinite(second)\n      && (first !== 0 || second !== 0)\n  };\n}</code></pre>\n<p>A real server tick can also produce a very small or zero-looking delta for a tiny section. The environment warning should be explicit rather than inferred from one call.</p>`;
  const safeContext = `<pre><code class="language-javascript">function readCpuContext(label) {\n  return {\n    label,\n    tick: Game.time,\n    used: Game.cpu.getUsed(),\n    limit: Game.cpu.limit,\n    tickLimit: Game.cpu.tickLimit,\n    bucket: Game.cpu.bucket\n  };\n}</code></pre>\n<p>Do not use a zero reading to detect the environment. The documentation gives a one-way rule: Simulation always reports <code>0</code>. A zero or tiny delta outside Simulation is still possible for a small section. Know which environment you are running in, then compare start and end samples around a concrete workload. Keep the raw context with the measurement so a later review can distinguish the section delta from the tick budget that surrounded it.</p>`;
  html = replaceRequired(html, unsafeDetector, safeContext, slug);

  html = replaceRequired(
    html,
    '<p>The official API states that <code>Game.cpu.getUsed()</code> always returns <code>0</code> in the Simulation. A zero delta there does not prove that pathfinding, sorting, JSON parsing, or room scans are free.</p>',
    '<p>The official API states that <code>Game.cpu.getUsed()</code> always returns <code>0</code> in the Simulation. That makes Simulation unsuitable for measuring CPU cost. The inverse is not documented: seeing <code>0</code> does not by itself prove that you are in Simulation.</p>',
    slug,
  );

  return {
    ...article,
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Game.cpu.getUsed(), limit, tickLimit, bucket, bucket ceiling, and Simulation behavior",
      "Passed — removed value-based environment detection; section deltas, sampling bounds, and optional-work policy reviewed",
      "No real-shard CPU samples or multi-tick bucket observations were collected for this revision",
    ),
    faq: article.faq.map(([question, answer]) => question === "Why does getUsed() return zero in the Simulation?"
      ? [question, "The official Simulation always reports 0. That fact does not make every zero reading an environment detector; identify the environment independently before interpreting CPU samples."]
      : [question, answer]),
    articleHtml: html,
  };
}

function patchMemory(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let html = article.articleHtml;

  const oldSection = `<h2 id="why-variables-reset">Why ordinary variables are not persistent state</h2>\n<p>The main loop runs again on every tick. A variable created inside that loop is created again when the loop runs again:</p>\n<pre><code class="language-javascript">module.exports.loop = function () {\n  let working = false;\n\n  if (working) {\n    console.log('The Creep is working.');\n  }\n};</code></pre>\n<p>This example always starts with <code>working</code> set to <code>false</code>. It is useful as current-execution data, but it does not represent a durable decision. Review <a href="/en/blog/screeps-tick-game-loop">how ticks and module.exports.loop work</a> before using cross-tick state.</p>`;
  const newSection = `<h2 id="why-variables-reset">Memory, Game, and heap data have different lifetimes</h2>\n<p>A variable declared inside <code>module.exports.loop</code> is created again on the next call, but that does not mean every JavaScript value outside Memory disappears every tick. Screeps can reuse the same runtime context across ticks, so module-scope or <code>global</code> values may remain available for a while. They are a cache, not durable state: a global reset can remove them without notice.</p>\n<div class="table-scroll"><table>\n<thead><tr><th>Place</th><th>Lifetime to design for</th><th>Use it for</th></tr></thead>\n<tbody>\n<tr><td><code>Game</code></td><td>Current tick only; rebuilt for each tick</td><td>Current visible objects and runtime state</td></tr>\n<tr><td><code>Memory</code></td><td>Serialized and passed to later ticks</td><td>Decisions that must survive runtime resets</td></tr>\n<tr><td>Module scope / <code>global</code></td><td>May survive while the runtime context is reused; can disappear on reset</td><td>Rebuildable derived caches</td></tr>\n<tr><td>Local loop variables</td><td>Current loop invocation</td><td>Temporary calculations</td></tr>\n</tbody></table></div>\n<pre><code class="language-javascript">module.exports.loop = function () {\n  let working = false;\n  // This local value starts false on every loop call.\n};</code></pre>\n<p>The production rule is simple: if losing a value after a global reset would make your colony incorrect, do not rely on heap lifetime. Persist the decision in <code>Memory</code> or make it deterministically rebuildable. Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> when the value is expensive but safe to lose.</p>`;
  html = replaceRequired(html, oldSection, newSection, slug);

  html = replaceRequired(
    html,
    '<p>This guide does not cover RawMemory, segments, parse-cost optimization, global caching, automatic role counts, replacement spawning, or modular role files. Continue with <a href="/en/blog/screeps-withdraw-container-energy">withdrawing Energy from a Container</a>, where Memory can later connect acquisition and delivery states.</p>',
    '<p>This guide stops at the state-lifetime decision and small JSON-backed values. Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> for rebuildable heap caches and <a href="/en/blog/screeps-rawmemory-segments">the Segments guide</a> for larger persistent strings. Continue with <a href="/en/blog/screeps-withdraw-container-energy">withdrawing Energy from a Container</a> when you want to apply Memory to a Creep state machine.</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<h3>Does a normal JavaScript variable survive every Screeps tick?</h3>\n<p>Do not use a local loop variable as durable game state. Use Memory for information that must be available later.</p>',
    '<h3>Does a normal JavaScript variable survive every Screeps tick?</h3>\n<p>A local variable created inside the loop does not persist as durable state. Module-scope or <code>global</code> values may survive while the same runtime context is reused, but they can vanish on a global reset. Use <code>Memory</code> when correctness requires the value after that reset.</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>',
    '<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>\n<li><a href="https://docs.screeps.com/architecture.html" rel="nofollow">Server-side architecture: runtime context reuse</a></li>',
    slug,
  );

  return {
    ...article,
    title: "Screeps Memory: Persistent State vs Heap Cache",
    headline: "What Screeps Memory Keeps Across Ticks and Global Resets",
    description: "Separate current-tick Game data, disposable module/global heap cache, and persistent Memory; initialize Creep state safely and store IDs instead of live game objects.",
    searchIntent: "Understand which Screeps state survives later ticks and global resets, then choose Memory or rebuildable heap cache correctly",
    finalScore: 99,
    verification: verification(
      "Checked August 12, 2026 — Global Objects, Memory serialization, Game.getObjectById(), and server runtime-context reuse",
      "Passed — local, current-tick, persistent, and resettable heap lifetimes are separated; ID recovery and Creep memory examples reviewed",
      "No live global-reset observation or multi-tick room transcript was collected for this revision",
    ),
    toc: article.toc.map(([id, label]) => id === "why-variables-reset"
      ? [id, "Memory, Game, and heap lifetimes"]
      : [id, label]),
    faq: article.faq.map(([question, answer]) => question === "Does a normal JavaScript variable survive every Screeps tick?"
      ? [question, "A local loop variable is recreated, while module/global heap values may survive runtime reuse but can disappear on a global reset. Use Memory for state that must survive that reset."]
      : [question, answer]),
    articleHtml: html,
  };
}

function patchSpawn(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let html = article.articleHtml;

  html = replaceRequired(
    html,
    '<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body or name is invalid.</td><td>Inspect every body constant and confirm that a name was provided.</td></tr>',
    '<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body or name is invalid.</td><td>Inspect every body constant and confirm that a name was provided.</td></tr>\n<tr><td><code>ERR_NOT_OWNER</code></td><td>The Spawn is not owned by you.</td><td>Confirm that the selected Spawn is yours.</td></tr>\n<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The room cannot use another Spawn at its current Controller level.</td><td>Check the room Controller level and Spawn availability before changing the Creep body.</td></tr>',
    slug,
  );

  html = replaceRequired(
    html,
    '<p>Expected sequence:</p>',
    '<p>What to verify after an accepted request:</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<h2 id="completion-check">Completion check</h2>\n<p>You have completed this lesson when all of the following are true:</p>',
    '<h2 id="completion-check">Completion check</h2>\n<p>After you run the example in a room you control, verify all of the following. This article does not claim that those live observations were performed during the editorial pass:</p>',
    slug,
  );

  html = replaceRequired(
    html,
    '<h2 id="next-lesson">Give multiple Creeps simple responsibilities</h2>',
    '<h2 id="production-adaptation">Production adaptation</h2>\n<p>The fixed name <code>Worker1</code> and the every-tick guard pattern are teaching choices. A production spawn manager usually derives unique replacement names, separates population targets from the Spawn API call, and records why a request was skipped or rejected. Keep those concerns out of this first-request lesson; use the dedicated return-code and spawn-queue guides when you add them.</p>\n\n<h2 id="next-lesson">Give multiple Creeps simple responsibilities</h2>',
    slug,
  );

  return {
    ...article,
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — StructureSpawn.spawnCreep(), dryRun, complete documented return-code set, Spawn.spawning, and CREEP_SPAWN_TIME",
      "Passed — fixed-name teaching request, 200 Energy body cost, guards, and scheduled-vs-completed tick boundary reviewed",
      "No live Worker1 spawn cycle was observed for this revision",
    ),
    toc: article.toc.some(([id]) => id === "production-adaptation")
      ? article.toc
      : article.toc.flatMap((item) => item[0] === "next-lesson"
        ? [["production-adaptation", "Production adaptation"], item] as Array<[string, string]>
        : [item]),
    articleHtml: html,
  };
}

export function applyEnglishEditorialCore20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !selectedSlugs.has(article.slug)) return article;

  switch (article.slug) {
    case "screeps-err-not-in-range":
      return patchErrNotInRange(article);
    case "screeps-moveto-not-moving":
      return patchMoveToNotMoving(article);
    case "screeps-cpu-getused-bucket":
      return patchCpu(article);
    case "screeps-memory-basics":
      return patchMemory(article);
    case "screeps-spawn-creep":
      return patchSpawn(article);
    default:
      return article;
  }
}

export function getEnglishEditorialCoreUpdatedAt20260812(
  slug: string,
): string | undefined {
  return selectedSlugs.has(slug) ? UPDATED_AT : undefined;
}
