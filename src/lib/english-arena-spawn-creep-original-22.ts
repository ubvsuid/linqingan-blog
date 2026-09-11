import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

type EnglishArenaSpawnCreepOriginalArticle = Omit<EnglishBeginnerArticle, "chinesePath"> & {
  chinesePath?: undefined;
};

export const englishArenaSpawnCreepArticle = {
  slug: "screeps-arena-spawn-creep",
  path: "/en/blog/screeps-arena-spawn-creep",
  title: "Screeps Arena spawnCreep(): Find Your Spawn",
  headline: "How to Use StructureSpawn.spawnCreep() in Screeps Arena",
  description:
    "Find your Screeps Arena Spawn with getObjectsByPrototype(), call spawnCreep(body), read object or error results, and avoid mixing Arena with MMO syntax.",
  category: "ARENA · SPAWNING API",
  publishedAt: "2026-09-11",
  publishedLabel: "September 11, 2026",
  readingTime: "8 min read",
  breadcrumbLabel: "Arena spawnCreep()",
  tags: ["Screeps", "Arena", "Spawn", "spawnCreep", "JavaScript"],
  keywords: [
    "Screeps Arena spawnCreep",
    "Screeps Arena getObjectsByPrototype StructureSpawn",
    "Screeps Arena StructureSpawn",
    "Screeps Arena spawnCreep docs",
  ],
  primaryKeyword: "Screeps Arena spawnCreep",
  searchIntent:
    "Find the player's owned StructureSpawn in Screeps Arena with getObjectsByPrototype(), call spawnCreep(body), and interpret the Arena-specific object-or-error result without applying Screeps MMO syntax",
  finalScore: 98,
  verification: [
    ["Article origin", "Original English guide — no translated source article"],
    ["Official Arena docs", "Checked — StructureSpawn.spawnCreep(body), getObjectsByPrototype(), body limits, result shape, and documented errors"],
    ["API boundary", "Checked — Arena syntax and result shape kept separate from Screeps MMO spawnCreep()"],
    ["Code review", "Passed — examples use Arena game/utils and game/prototypes imports"],
    ["Screeps Arena runtime test", "Pending — no Arena runtime execution is claimed"],
    ["Last verified", "September 11, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["minimal-example", "Minimal Arena example"],
    ["find-spawn", "Find your owned Spawn"],
    ["result", "Read object or error"],
    ["errors", "Documented spawn errors"],
    ["arena-vs-mmo", "Do not mix Arena and MMO syntax"],
    ["debugging", "Debug in the right order"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How do I find my Spawn in Screeps Arena?",
      "Import getObjectsByPrototype from game/utils and StructureSpawn from game/prototypes, then find the StructureSpawn whose my property is true.",
    ],
    [
      "What does Arena spawnCreep() return?",
      "The Arena API returns an object that contains either object for the newly spawning Creep or error for a numeric error code. Check which field exists instead of comparing the whole return value with an MMO-style status code.",
    ],
    [
      "Can I use the MMO spawnCreep(body, name, opts) example in Arena?",
      "No. Screeps Arena documents StructureSpawn.spawnCreep(body). The MMO API has a different call shape and return contract, so keep examples for the two products separate.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-spawn-creep",
    label: "Using Screeps MMO instead?",
    title: "Create Your First MMO Creep",
  },
  next: null,
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>In Screeps Arena, first find your owned <code>StructureSpawn</code> with <code>getObjectsByPrototype(StructureSpawn)</code>. Then call <code>spawn.spawnCreep(body)</code>. Arena documents a result object with either an <code>object</code> field for the newly spawning Creep or an <code>error</code> field for a numeric error code.</p>
<p>Do not copy the Screeps MMO signature into Arena: the Arena method is <code>spawnCreep(body)</code>, not the MMO-style <code>spawnCreep(body, name, opts)</code>.</p>
<pre><code class="language-javascript">import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn } from 'game/prototypes';
import { WORK, CARRY, MOVE } from 'game/constants';

const spawn = getObjectsByPrototype(StructureSpawn).find(s => s.my);

if (spawn) {
  const result = spawn.spawnCreep([WORK, CARRY, MOVE]);

  if (result.object) {
    console.log('Spawning creep:', result.object.id);
  } else {
    console.log('spawnCreep error:', result.error);
  }
}</code></pre>

<h2 id="minimal-example">Start with the minimal Arena example</h2>
<p>The important Arena pieces are the imports, the owned-Spawn lookup, a body array, and the returned result object. Keep those visible before adding role logic or combat strategy.</p>
<p>The official Arena API documents a body array with 1 to 50 body-part constants. For a simple worker-shaped example, <code>[WORK, CARRY, MOVE]</code> keeps the spawning call easy to inspect.</p>

<h2 id="find-spawn">Find your owned Spawn with getObjectsByPrototype()</h2>
<p>Arena code does not start from the MMO <code>Game.spawns</code> pattern. Import <code>getObjectsByPrototype</code> from <code>game/utils</code>, import <code>StructureSpawn</code> from <code>game/prototypes</code>, then select the Spawn whose <code>my</code> property is true:</p>
<pre><code class="language-javascript">import { getObjectsByPrototype } from 'game/utils';
import { StructureSpawn } from 'game/prototypes';

const mySpawn = getObjectsByPrototype(StructureSpawn).find(spawn => spawn.my);

if (!mySpawn) {
  console.log('No owned StructureSpawn found');
}</code></pre>
<p>Keeping the ownership check explicit prevents your spawning logic from silently operating on the wrong object when a prototype query returns more than one result.</p>

<h2 id="result">Read the object-or-error result</h2>
<p>The Arena contract is easiest to handle as two branches. A successful result exposes the newly spawning Creep through <code>result.object</code>. A failed call exposes a numeric code through <code>result.error</code>.</p>
<pre><code class="language-javascript">const result = mySpawn.spawnCreep([WORK, CARRY, MOVE]);

if (result.error !== undefined) {
  console.log('spawn failed:', result.error);
} else if (result.object) {
  console.log('spawn accepted for creep:', result.object.id);
}</code></pre>
<p>This page does not claim a live Arena runtime test. The example follows the current documented API shape; verify behavior in your own Arena match when exact runtime state matters.</p>

<h2 id="errors">Read the documented Arena spawn errors</h2>
<p>The current Arena documentation lists these <code>StructureSpawn.spawnCreep()</code> errors:</p>
<div class="table-scroll"><table>
<thead><tr><th>Error</th><th>Meaning to check</th></tr></thead>
<tbody>
<tr><td><code>ERR_NOT_OWNER (-1)</code></td><td>The Spawn is not yours.</td></tr>
<tr><td><code>ERR_BUSY (-4)</code></td><td>The Spawn is already spawning another Creep.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY (-6)</code></td><td>The Spawn and eligible nearby extensions cannot supply enough Energy for the body.</td></tr>
<tr><td><code>ERR_INVALID_ARGS (-10)</code></td><td>The submitted body arguments are invalid.</td></tr>
</tbody></table></div>
<p>Preserve the exact error code while debugging. Four distinct failures should not be collapsed into one generic “spawn failed” state.</p>

<h2 id="arena-vs-mmo">Do not mix Arena and MMO spawnCreep() syntax</h2>
<p>Screeps Arena and Screeps MMO both expose a <code>StructureSpawn.spawnCreep()</code> name, but the documented interfaces are not interchangeable.</p>
<div class="table-scroll"><table>
<thead><tr><th>Product</th><th>Call shape used by this site</th><th>Result handling</th></tr></thead>
<tbody>
<tr><td>Screeps Arena</td><td><code>spawn.spawnCreep(body)</code></td><td>Read <code>result.object</code> or <code>result.error</code>.</td></tr>
<tr><td>Screeps MMO</td><td><code>spawn.spawnCreep(body, name, opts)</code></td><td>Use the MMO return-code contract and later spawning state.</td></tr>
</tbody></table></div>
<p>If you are writing persistent-world MMO code, use the dedicated <a href="/en/blog/screeps-spawn-creep">Screeps MMO spawnCreep() guide</a> instead. Keeping the product name in your search and in your own notes prevents examples from the two APIs from being mixed accidentally.</p>

<h2 id="debugging">Debug an Arena spawn call in the right order</h2>
<ol>
<li><strong>Confirm the product.</strong> Make sure the example is for Screeps Arena, not MMO.</li>
<li><strong>Confirm the imports.</strong> Resolve <code>getObjectsByPrototype</code>, <code>StructureSpawn</code>, and the body constants from Arena modules.</li>
<li><strong>Confirm ownership.</strong> Ensure the selected Spawn has <code>my === true</code>.</li>
<li><strong>Inspect whether the Spawn is busy.</strong> A busy Spawn can return <code>ERR_BUSY</code>.</li>
<li><strong>Validate the body.</strong> Keep the body within the documented part-count boundary and use valid body-part constants.</li>
<li><strong>Check available Energy.</strong> An otherwise valid body can still return <code>ERR_NOT_ENOUGH_ENERGY</code>.</li>
<li><strong>Log the exact result branch.</strong> Record <code>result.error</code> or the identity from <code>result.object</code>.</li>
</ol>

<h2 id="faq">FAQ</h2>
<h3>Why does an MMO spawnCreep() example fail in Arena?</h3>
<p>The products document different method signatures and different result shapes. In Arena, start from the Arena modules and <code>spawnCreep(body)</code> rather than adding an MMO Creep name or options object.</p>

<h3>Should I hard-code the first StructureSpawn returned?</h3>
<p>Prefer an explicit ownership predicate such as <code>.find(spawn =&gt; spawn.my)</code>. It makes the intent clear and avoids assuming the first prototype result is yours.</p>

<h3>Does result.object prove the Creep has finished spawning?</h3>
<p>No claim of completed spawning is needed here. Treat the returned object as the newly spawning Creep reference described by the Arena API and inspect current match state when later behavior matters.</p>

<h2 id="official-docs">Official documentation</h2>
<p>This guide was checked against the <a href="https://arena.screeps.com/docs/" rel="noopener noreferrer">official Screeps Arena API documentation</a>, specifically <code>StructureSpawn.spawnCreep()</code>, <code>getObjectsByPrototype()</code>, Arena prototypes, and body constants.</p>
`,
} satisfies EnglishArenaSpawnCreepOriginalArticle;
