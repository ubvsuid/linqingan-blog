export const englishBeginnerSpawnCreepArticleOverrides = {
  "screeps-spawn-creep": {
    title: "Screeps spawnCreep(): Create Your First Creep",
    headline: "How to Create Your First Screeps Creep with spawnCreep()",
    description:
      "Use dryRun to validate a WORK-CARRY-MOVE body, submit one safe spawnCreep() request, read its return code, and verify the new Creep across later ticks.",
    category: "GETTING STARTED · BEGINNER LESSON 7 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "Create a Creep",
    tags: ["Spawn", "Creeps", "JavaScript"],
    keywords: [
      "Screeps spawnCreep",
      "create Creep Screeps",
      "StructureSpawn.spawnCreep()",
      "spawnCreep dryRun",
      "ERR_NOT_ENOUGH_ENERGY",
      "Screeps first Creep",
    ],
    primaryKeyword: "Screeps spawnCreep",
    searchIntent:
      "Beginner action tutorial for validating and submitting one fixed-name spawnCreep request, then verifying the result across later ticks",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["API and return codes", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["Offline branch review", "Passed"],
      ["Screeps Console", "Pending — replace Spawn1 before running"],
      ["Live spawn cycle", "Pending — no live Worker1 completion is claimed"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["request-parts", "The spawn request"],
      ["preflight", "Validate with dryRun"],
      ["spawn-code", "Start spawning"],
      ["return-code", "Read the return code"],
      ["later-ticks", "Watch later ticks"],
      ["common-failures", "Common failures"],
      ["completion-check", "Completion check"],
      ["next-lesson", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">What you will complete in this lesson</h2>
<p>This lesson has one goal: make one owned Spawn begin creating a new Creep named <code>Worker1</code>.</p>
<p>You will use the three-part learning body from the previous lesson:</p>
<pre><code class="language-javascript">[WORK, CARRY, MOVE]</code></pre>
<p>The request costs 200 Energy. You will first validate it with <code>dryRun</code>, then submit the real request only when the validation result is <code>OK</code>.</p>
<p><strong>Lesson boundary:</strong> this lesson creates one fixed-name Creep. Dynamic names, population targets, role Memory, replacement timing, and spawn queues belong in later guides.</p>

<h2 id="request-parts">A spawnCreep() request needs three decisions</h2>
<div class="table-scroll"><table>
<thead><tr><th>Decision</th><th>Tutorial value</th><th>What it controls</th></tr></thead>
<tbody>
<tr><td>Which Spawn?</td><td><code>Game.spawns['Spawn1']</code></td><td>The owned structure that starts the process.</td></tr>
<tr><td>Which body?</td><td><code>[WORK, CARRY, MOVE]</code></td><td>The ordered list of body parts for the new Creep.</td></tr>
<tr><td>Which name?</td><td><code>'Worker1'</code></td><td>The unique key later used in <code>Game.creeps</code>.</td></tr>
</tbody>
</table></div>
<p>Before copying the code, run <code>Object.keys(Game.spawns)</code> in the Console. Replace <code>Spawn1</code> with the exact case-sensitive name returned by your game.</p>
<p>Review <a href="/en/blog/screeps-creep-body-parts">WORK, CARRY, and MOVE</a> before changing the body array.</p>

<h2 id="preflight">Validate the request with dryRun</h2>
<p><strong>State impact:</strong> validation only. A <code>dryRun</code> request checks whether spawning is currently possible without starting the process or spending Energy.</p>
<pre><code class="language-javascript">const SPAWN_NAME = 'Spawn1';
const CREEP_NAME = 'Worker1';
const BODY = [WORK, CARRY, MOVE];

const spawn = Game.spawns[SPAWN_NAME];

if (!spawn) {
  console.log(
    SPAWN_NAME +
    ' was not found. Check the name and capitalization.'
  );
} else {
  const bodyCost = BODY.reduce(function (total, part) {
    return total + BODYPART_COST[part];
  }, 0);

  const dryRunResult = spawn.spawnCreep(
    BODY,
    CREEP_NAME,
    { dryRun: true }
  );

  console.log(JSON.stringify({
    spawnName: spawn.name,
    spawnBusy: Boolean(spawn.spawning),
    nameAlreadyExists: Boolean(Game.creeps[CREEP_NAME]),
    roomEnergyAvailable: spawn.room.energyAvailable,
    bodyCost: bodyCost,
    dryRunResult: dryRunResult
  }, null, 2));
}</code></pre>
<p>Do not continue to the real call until the Spawn name is correct and <code>dryRunResult</code> is <code>OK</code>.</p>

<h2 id="spawn-code">Start one real spawning process</h2>
<p><strong>State impact:</strong> this code can consume room Energy and start a real spawn process. Replace <code>Spawn1</code> before saving it.</p>
<pre><code class="language-javascript">const SPAWN_NAME = 'Spawn1';
const CREEP_NAME = 'Worker1';
const BODY = [WORK, CARRY, MOVE];

module.exports.loop = function () {
  const spawn = Game.spawns[SPAWN_NAME];

  if (!spawn) {
    console.log(
      SPAWN_NAME +
      ' was not found. Check the name and capitalization.'
    );
    return;
  }

  if (Game.creeps[CREEP_NAME] || spawn.spawning) {
    return;
  }

  const dryRunResult = spawn.spawnCreep(
    BODY,
    CREEP_NAME,
    { dryRun: true }
  );

  if (dryRunResult !== OK) {
    console.log(
      'Cannot start ' +
      CREEP_NAME +
      ': spawnCreep() returned ' +
      dryRunResult +
      '.'
    );
    return;
  }

  const spawnResult = spawn.spawnCreep(
    BODY,
    CREEP_NAME
  );

  console.log(
    spawnResult === OK
      ? CREEP_NAME + ' started spawning.'
      : 'Real spawn request returned ' + spawnResult + '.'
  );
};</code></pre>
<p>The two guards matter because <code>module.exports.loop</code> runs again on later ticks:</p>
<ul>
<li><code>Game.creeps[CREEP_NAME]</code> prevents another request after the Creep exists.</li>
<li><code>spawn.spawning</code> prevents another request while the Spawn is already working.</li>
</ul>

<h2 id="return-code">Read the return code before changing the body</h2>
<p><code>OK</code> means the spawn operation was scheduled successfully. It does not mean the completed Creep already exists.</p>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning</th><th>First response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The process was scheduled.</td><td>Watch <code>spawn.spawning</code> on later ticks.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>A Creep already uses that name.</td><td>Check <code>Game.creeps[CREEP_NAME]</code> and the requested name.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Spawn is already creating another Creep.</td><td>Wait until the current process finishes.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>The Spawn and usable Extensions do not currently contain enough Energy.</td><td>Wait for Energy delivery; the tutorial body needs 200 Energy.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body or name is invalid.</td><td>Inspect every body constant and confirm that a name was provided.</td></tr>
</tbody>
</table></div>
<p>Use the focused <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return-code guide</a> when a different result needs deeper diagnosis.</p>

<h2 id="later-ticks">Watch the Spawn and the finished Creep on later ticks</h2>
<p>The official constant <code>CREEP_SPAWN_TIME</code> is 3 ticks per body part. The three-part tutorial body therefore needs 9 ticks to finish under the current constant.</p>
<p>During the process, inspect:</p>
<pre><code class="language-javascript">const spawn = Game.spawns['Spawn1'];

console.log(JSON.stringify({
  tick: Game.time,
  spawning: spawn ? spawn.spawning : null,
  workerExists: Boolean(Game.creeps['Worker1'])
}, null, 2));</code></pre>
<p>Expected sequence:</p>
<ol>
<li>The real call returns <code>OK</code>.</li>
<li><code>spawn.spawning</code> describes the active process.</li>
<li>The remaining time decreases across later ticks.</li>
<li>After completion, <code>Game.creeps['Worker1']</code> exists.</li>
<li>The finished Creep contains <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code>.</li>
</ol>

<h2 id="common-failures">Fix the request, not an unrelated system</h2>
<h3>The Spawn object is undefined</h3>
<p>The name is wrong or belongs to a different shard. Run <code>Object.keys(Game.spawns)</code> and copy the exact value.</p>
<h3>The room never reaches 200 Energy</h3>
<p>The body is valid, but the room economy is not refilling the Spawn or Extensions. Return to the <a href="/en/blog/screeps-transfer-energy-to-spawn">Energy delivery lesson</a>.</p>
<h3>The Console prints the same failure every tick</h3>
<p>This is temporary tutorial code. Use the return code to fix the request, then remove repeated diagnostic logging after the first successful spawn.</p>
<h3>The real call returned OK, but Worker1 is still missing</h3>
<p>Check <code>spawn.spawning</code>. A scheduled process still needs later ticks before the new Creep appears.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when all of the following are true:</p>
<ul>
<li>the code uses your real Spawn name;</li>
<li><code>dryRun</code> returns <code>OK</code> before the real request;</li>
<li>the real request returns <code>OK</code> once;</li>
<li><code>spawn.spawning</code> becomes active;</li>
<li><code>Game.creeps['Worker1']</code> appears after completion;</li>
<li>you can explain why <code>OK</code> means scheduled, not finished.</li>
</ul>

<h2 id="next-lesson">Give multiple Creeps simple responsibilities</h2>
<p>You have created one fixed-name worker. The next lesson separates body abilities from player-defined jobs:</p>
<p><a href="/en/blog/screeps-creep-roles">Understand Harvester, Upgrader, and Builder roles →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review all twelve lessons in order.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.spawns" rel="nofollow noopener noreferrer">Screeps API: Game.spawns</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow noopener noreferrer">Screeps API: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawning" rel="nofollow noopener noreferrer">Screeps API: StructureSpawn.spawning</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow noopener noreferrer">Screeps API: constants and body-part costs</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow noopener noreferrer">Screeps Documentation: Creeps and body parts</a></li>
</ul>`,
  },
} as const;
