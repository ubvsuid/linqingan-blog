import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishRequireModulesArticle = {
  slug: "screeps-require-modules",
  path: "/en/blog/screeps-require-modules",
  chinesePath: "/blog/screeps-modules-require",
  title: "Screeps require() Modules: One Loop, Role Files, and Tick-Safe State",
  headline: "How to Split Screeps Code into Modules Without Caching Stale Game Objects",
  description:
    "Keep one module.exports.loop, export small role functions, validate module shapes, read current Game objects inside each tick, avoid module-scope world snapshots, and preserve diagnostics for missing roles and load failures.",
  category: "CODE ORGANIZATION · COMMONJS MODULES",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Screeps Modules",
  tags: ["Screeps", "JavaScript", "require", "Modules", "Game Loop"],
  keywords: [
    "Screeps require modules",
    "Screeps module.exports loop",
    "Screeps role modules",
    "Screeps CommonJS",
    "Screeps stale game objects",
  ],
  primaryKeyword: "Screeps require modules",
  searchIntent: "Organize one Screeps game loop into reusable role modules without preserving tick-bound objects",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Screeps modules, require(), module.exports, the main loop and global reset behavior"],
    ["Architecture boundary", "Role names, file names, router behavior and logging intervals are project conventions"],
    ["Tick boundary", "Stable module definitions may be cached, but current Game, Room, Creep and Structure objects must be read during the active tick"],
    ["JavaScript syntax", "Passed"],
    ["Offline module review", "Passed — valid exports, missing run(), unknown roles, missing Creeps and stale snapshot states"],
    ["Screeps Console test", "Pending"],
    ["Live module loading, syntax failure, global reset, role routing and stale-object test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["one-loop", "Keep one exported game loop"],
    ["role-contract", "Give each role one contract"],
    ["router", "Route Creeps from main"],
    ["validate-modules", "Validate module shape"],
    ["tick-state", "Read current state inside the tick"],
    ["global-reset", "Understand module cache and global resets"],
    ["complete-example", "Complete modular example"],
    ["unknown-role", "Handle unknown roles explicitly"],
    ["load-failures", "Diagnose module load failures"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Should every role file export module.exports.loop?", "No. Keep module.exports.loop in the main entry module and export focused functions such as run(creep) from role files."],
    ["Can require() run at module scope?", "Yes. Loading stable function definitions at module scope is normal. Do not capture current Game objects or query results there."],
    ["Why can module-scope state disappear?", "A global reset reruns module initialization, so permanent business state belongs in Memory or RawMemory."],
    ["What happens when a required module has a syntax error?", "The main module may fail to load. Fix the first parser or resolution error before debugging role behavior."],
  ],
  previous: {
    href: "/en/blog/screeps-flags-configuration",
    label: "Previous configuration guide",
    title: "Use Flags as Configuration",
  },
  next: {
    href: "/en/blog/screeps-nuker-launch",
    label: "Next operations guide",
    title: "Launch a Nuke Safely",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Keep exactly one <code>module.exports.loop</code> in the main module. Let each role file export a small function such as <code>run(creep)</code>, require modules through explicit names, validate their public shape, and read <code>Game</code>, Room, Creep and Structure objects inside the current tick. Module-scope constants and functions are appropriate; module-scope snapshots of current world objects are not.</p>

<h2 id="one-loop">Keep one exported game loop</h2>
<pre><code class="language-javascript">const roleHarvester = require('role.harvester');
const roleUpgrader = require('role.upgrader');

module.exports.loop = function () {
  for (const creep of Object.values(Game.creeps)) {
    if (creep.memory.role === 'harvester') {
      roleHarvester.run(creep);
    } else if (creep.memory.role === 'upgrader') {
      roleUpgrader.run(creep);
    }
  }
};</code></pre>
<p>Do not export a second loop from a role file and expect both loops to run. Main must call role functions explicitly.</p>

<h2 id="role-contract">Give each role one contract</h2>
<pre><code class="language-javascript">function run(creep) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );
  if (!source) {
    return { status: 'source-not-found' };
  }

  const result = creep.harvest(source);
  if (result === ERR_NOT_IN_RANGE) {
    return {
      status: 'moving-to-source',
      result,
      moveResult: creep.moveTo(source, {
        range: 1,
        reusePath: 10
      })
    };
  }

  return {
    status: result === OK
      ? 'harvest-scheduled'
      : 'harvest-rejected',
    result,
    sourceId: source.id
  };
}

module.exports = { run };</code></pre>
<p>A role receives the current Creep, performs one bounded decision and returns diagnostics. It does not search all Creeps again or own the global loop.</p>

<h2 id="router">Route Creeps from main</h2>
<pre><code class="language-javascript">const roles = {
  harvester: require('role.harvester'),
  upgrader: require('role.upgrader')
};

function runCreepRole(creep) {
  const roleName = creep?.memory?.role;
  const role = roles[roleName];

  if (!role) {
    return {
      status: 'unknown-role',
      roleName: roleName || null
    };
  }

  return role.run(creep);
}</code></pre>
<p>The role map makes supported names explicit. A typo should produce a diagnosis instead of silently selecting another behavior.</p>

<h2 id="validate-modules">Validate module shape</h2>
<pre><code class="language-javascript">function validateRoleModules(roleMap) {
  const errors = [];

  for (const [roleName, roleModule] of Object.entries(roleMap)) {
    if (!roleModule || typeof roleModule.run !== 'function') {
      errors.push({
        roleName,
        reason: 'missing-run-function'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}</code></pre>
<p>This catches export mismatches before the router tries to call an absent function.</p>

<h2 id="tick-state">Read current state inside the tick</h2>
<p>This captures one old collection:</p>
<pre><code class="language-javascript">const cachedHarvesters = Object.values(Game.creeps)
  .filter(creep => creep.memory.role === 'harvester');

function getHarvesters() {
  return cachedHarvesters;
}</code></pre>
<p>Read current objects when the function runs:</p>
<pre><code class="language-javascript">function getCurrentHarvesters() {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory.role === 'harvester'
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    );
}</code></pre>
<p>The same rule applies to <code>Game.rooms</code>, <code>Game.structures</code>, <code>room.find()</code> results and objects recovered by ID.</p>

<h2 id="global-reset">Understand module cache and global resets</h2>
<pre><code class="language-javascript">const ROLE_NAMES = Object.freeze([
  'harvester',
  'upgrader'
]);
const roleNameSet = new Set(ROLE_NAMES);

function isKnownRole(roleName) {
  return roleNameSet.has(roleName);
}</code></pre>
<p>Stable definitions can live at module scope. A global reset reruns initialization, so counters, queues and caches there are disposable unless rebuilt safely.</p>
<pre><code class="language-javascript">global.runtimeCache ??= {
  initializedAt: Game.time,
  roleNames: new Set()
};</code></pre>
<p>This cache is acceleration, not durable state.</p>

<h2 id="complete-example">Complete modular example</h2>
<pre><code class="language-javascript">const roles = {
  harvester: require('role.harvester'),
  upgrader: require('role.upgrader')
};
const validation = validateRoleModules(roles);

module.exports.loop = function () {
  if (!validation.valid) {
    if (Game.time % 100 === 0) {
      console.log(JSON.stringify({
        type: 'role-module-validation',
        errors: validation.errors
      }));
    }
    return;
  }

  for (const creepName of Object.keys(Game.creeps).sort()) {
    const creep = Game.creeps[creepName];
    const outcome = runCreepRole(creep);

    if (
      outcome.status === 'unknown-role'
      || outcome.status.endsWith('-rejected')
    ) {
      console.log(JSON.stringify({
        type: 'creep-role-result',
        creepName,
        ...outcome
      }));
    }
  }
};</code></pre>

<h2 id="unknown-role">Handle unknown roles explicitly</h2>
<pre><code class="language-javascript">function describeUnknownRole(creep) {
  return {
    gameTick: Game.time,
    creepName: creep?.name || null,
    roleName: creep?.memory?.role || null,
    status: 'unknown-role'
  };
}</code></pre>
<p>Do not rewrite an unknown role unless a separate migration defines the intended mapping.</p>

<h2 id="load-failures">Diagnose module load failures</h2>
<ul>
<li>Fix the first syntax error in the required file.</li>
<li>Check the exact module and file names.</li>
<li>Check whether the export is an object or function.</li>
<li>Check for circular dependencies.</li>
<li>Keep the exported game loop in main.</li>
<li>Avoid reading unavailable tick objects during module initialization.</li>
</ul>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Keep one <code>module.exports.loop</code>.</li>
<li>Give each role one <code>run(creep)</code> contract.</li>
<li>Validate loaded module shapes.</li>
<li>Use an explicit role map.</li>
<li>Report unknown roles.</li>
<li>Read current game objects inside the tick.</li>
<li>Keep only stable definitions at module scope.</li>
<li>Treat global caches as disposable.</li>
<li>Store persistent state in serializable Memory.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not provide a bundler, process manager, dependency injection framework or complete role AI. Continue with <a href="/en/blog/screeps-nuker-launch">the next reviewed operations guide</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can one module export several functions?</h3>
<p>Yes. Keep the public contract small and explicit, such as <code>{ run, plan, validate }</code>.</p>
<h3>Should main catch every role exception?</h3>
<p>A guarded boundary can keep other Creeps running, but it must preserve the error instead of turning every failure into silent success.</p>
<h3>Can module-scope constants reference Screeps constants?</h3>
<p>Stable constants are appropriate. Avoid capturing current world objects and query results.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/modules.html" rel="nofollow">Screeps Documentation: Modules</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game loop and ticks</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Screeps Documentation: Global objects</a></li>
<li><a href="https://docs.screeps.com/api/#Game" rel="nofollow">API Reference: Game</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
