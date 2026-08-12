import type { EnglishBeginnerArticle } from "./english-beginner-content";

const MEMORY_SLUG = "screeps-memory-basics";

export function applyEnglishMemoryEditorial20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== MEMORY_SLUG) return article;

  return {
    ...article,
    title: "Screeps Memory: Persistent State, Heap Cache, and Creep Data",
    headline: "How Screeps Memory Survives Ticks and Global Resets",
    description:
      "Distinguish current-tick Game data, disposable module/global heap cache, and persistent Memory; initialize Creep state safely, store JSON-compatible values, and recover current game objects from IDs.",
    category: "FOUNDATION · MEMORY AND STATE LIFETIMES",
    readingTime: "14 min read",
    breadcrumbLabel: "Screeps Memory Basics",
    tags: ["Screeps", "Memory", "Creep", "JavaScript", "Foundation"],
    keywords: [
      "Screeps Memory tutorial",
      "Screeps persistent state",
      "Screeps global cache",
      "creep.memory",
      "Memory.creeps",
    ],
    primaryKeyword: "Screeps Memory tutorial",
    searchIntent:
      "Understand which Screeps state survives later ticks and global resets, then choose Memory or rebuildable heap cache correctly",
    finalScore: 99,
    verification: [
      [
        "Official documentation",
        "Checked August 12, 2026 — Global Objects, Memory serialization, Creep.memory, Game.getObjectById(), and runtime-context reuse",
      ],
      [
        "Static code review",
        "Passed — current-tick, persistent, and resettable heap lifetimes are separated; Creep Memory and ID recovery examples reviewed",
      ],
      ["Console test pending", "Not run in this editorial pass"],
      [
        "Live multi-tick verification pending",
        "No live global-reset observation or multi-tick room transcript was collected for this revision",
      ],
      ["Last verified", "August 12, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["state-lifetimes", "Memory, Game, and heap lifetimes"],
      ["memory-object", "What Memory actually preserves"],
      ["creep-memory", "How creep.memory relates to Memory.creeps"],
      ["spawn-memory", "Initialize Memory when spawning"],
      ["working-state", "Persist a working-state decision"],
      ["safe-data", "Choose data that belongs in Memory"],
      ["object-ids", "Store object IDs, not live objects"],
      ["dead-creeps", "Handle Memory after a Creep dies"],
      ["complete-example", "Minimal reset-safe example"],
      ["production-notes", "Production adaptation notes"],
      ["debugging", "Debugging checklist"],
      ["scope", "Choose the next guide"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does a normal JavaScript variable survive every Screeps tick?",
        "A local variable created inside the loop is recreated on the next call. Module-scope or global heap values may survive while the runtime context is reused, but they can disappear on a global reset. Use Memory for state that must survive that reset.",
      ],
      [
        "Is creep.memory different from Memory.creeps?",
        "creep.memory is the Creep-specific persistent Memory entry associated with that Creep name. Use it for small Creep state such as role, phase, home room, or target IDs.",
      ],
      [
        "Can I store a Source or Structure object in Memory?",
        "Do not store a live game object as durable state. Store its id, then call Game.getObjectById() on a later tick and handle a null result.",
      ],
      [
        "When should I use a global cache instead of Memory?",
        "Use module-scope or global heap data for derived information that is safe to rebuild after a global reset. Keep correctness-critical state in Memory or another persistent store.",
      ],
    ],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Game</code>, JavaScript heap data, and <code>Memory</code> have different lifetimes. <code>Game</code> describes the current tick. Module-scope and <code>global</code> values can be reused across ticks while the same runtime context stays alive, but a global reset can remove them. <code>Memory</code> is the JSON-backed store for state that must still be available after that reset.</p>
<p><strong>Use this guide when:</strong> you need a Creep to remember a role, phase, home room, target ID, or another small decision across ticks. <strong>Choose another guide when:</strong> the value is only a rebuildable performance cache or you need large persistent payloads; those belong in the <a href="/en/blog/screeps-global-cache">global-cache</a> or <a href="/en/blog/screeps-rawmemory-segments">RawMemory Segments</a> guides.</p>

<h2 id="state-lifetimes">Memory, Game, and heap data have different lifetimes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Place</th><th>Lifetime to design for</th><th>Good use</th><th>Failure boundary</th></tr></thead>
<tbody>
<tr><td><code>Game</code></td><td>Current tick</td><td>Visible Creeps, Structures, Sources, rooms, and current runtime values</td><td>Rebuilt for the next tick</td></tr>
<tr><td>Local variable inside <code>loop</code></td><td>Current loop call</td><td>Temporary calculations</td><td>Created again on the next call</td></tr>
<tr><td>Module scope / <code>global</code></td><td>May survive while the runtime context is reused</td><td>Derived caches that are cheap enough to rebuild</td><td>Can disappear on a global reset</td></tr>
<tr><td><code>Memory</code></td><td>Persistent JSON-backed state</td><td>Decisions that must survive later ticks and runtime resets</td><td>Must remain serializable and intentionally bounded</td></tr>
</tbody></table></div>
<p>This distinction prevents two opposite bugs. Putting every cache into <code>Memory</code> adds unnecessary persistent data and parse/serialization work. Treating heap data as durable state can break the colony after a global reset.</p>
<pre><code class="language-javascript">let sourceCache = null;

module.exports.loop = function () {
  let temporaryCount = 0;

  sourceCache ??= {};
  temporaryCount += 1;

  // Memory is the durable choice for a decision
  // that must survive a global reset.
  Memory.colony ??= {};
  Memory.colony.mode ??= 'normal';
};</code></pre>
<p><code>sourceCache</code> may be reused on later ticks, but production code must be able to reconstruct it when the runtime context is recreated. <code>Memory.colony.mode</code> is appropriate only if that mode is genuinely persistent state.</p>

<h2 id="memory-object">What Memory actually preserves</h2>
<p>The official Global Objects documentation separates <code>Game</code> from <code>Memory</code>: the game object is recreated for each tick, while JSON data written through <code>Memory</code> is serialized and made available on later ticks.</p>
<pre><code class="language-javascript">Memory.exampleValue = 1;

console.log(JSON.stringify({
  tick: Game.time,
  value: Memory.exampleValue
}));</code></pre>
<p>That example proves only a write in the current execution. To verify persistence in your own account, inspect the same field on later ticks. This article has not recorded a live multi-tick transcript, so that verification remains pending rather than being presented as observed evidence.</p>

<h2 id="creep-memory">How creep.memory relates to Memory.creeps</h2>
<p>A Creep exposes its own persistent memory through <code>creep.memory</code>. For ordinary Creep state, this corresponds to the name-indexed entry under <code>Memory.creeps</code>.</p>
<pre><code class="language-javascript">const creep = Game.creeps.Worker1;

if (creep) {
  creep.memory.role = 'harvester';

  console.log(JSON.stringify({
    fromCreep: creep.memory.role,
    fromMemory: Memory.creeps?.[creep.name]?.role
  }));
}</code></pre>
<p><code>role</code> is not an official Screeps class. It is your own string, and it has no effect until your code reads it and chooses behavior. Keep spelling and schema rules consistent across the modules that consume it.</p>

<h2 id="spawn-memory">Initialize Memory when spawning</h2>
<p><code>StructureSpawn.spawnCreep()</code> accepts an options object with a <code>memory</code> field. This is a clean place to initialize Creep state instead of relying on a later tick to guess the intended role.</p>
<pre><code class="language-javascript">const result = Game.spawns.Spawn1.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    memory: {
      role: 'harvester',
      working: false,
      homeRoom: 'E51S44'
    }
  }
);

console.log('spawnCreep() returned ' + result);</code></pre>
<p>The Memory option does not bypass normal spawn requirements. The Spawn must be yours, the name and body must be valid, the room must have enough available Energy, and the return code must be checked. Use the <a href="/en/blog/screeps-spawn-creep">first spawnCreep() lesson</a> for that action boundary.</p>

<h2 id="working-state">Persist a working-state decision</h2>
<p>A boolean such as <code>working</code> is useful when the next action depends on a phase that should not reset every tick. Switch at resource boundaries, not on every loop call:</p>
<pre><code class="language-javascript">const usedEnergy = creep.store.getUsedCapacity(
  RESOURCE_ENERGY
);
const freeEnergy = creep.store.getFreeCapacity(
  RESOURCE_ENERGY
);

if (usedEnergy === 0) {
  creep.memory.working = false;
} else if (freeEnergy === 0) {
  creep.memory.working = true;
}</code></pre>
<p>At partial Energy, the previous state is preserved. Writing the boolean does not make the Creep harvest, transfer, build, or upgrade automatically; your action logic must read it. The <a href="/en/blog/screeps-working-state">working-state guide</a> covers that state machine in detail.</p>

<h2 id="safe-data">Choose data that belongs in Memory</h2>
<div class="table-scroll"><table>
<thead><tr><th>Candidate</th><th>Store in Memory?</th><th>Reason</th></tr></thead>
<tbody>
<tr><td><code>'harvester'</code></td><td>Usually yes</td><td>Small persistent role decision</td></tr>
<tr><td><code>true</code> / <code>false</code></td><td>Usually yes</td><td>Small phase or policy state</td></tr>
<tr><td><code>'E51S44'</code></td><td>Yes when needed later</td><td>Stable room identifier</td></tr>
<tr><td>Game object ID string</td><td>Yes when the target must be remembered</td><td>Lets later code recover the current visible object</td></tr>
<tr><td>Pathfinding result that can be rebuilt</td><td>Usually heap cache first</td><td>Derived data should tolerate reset and avoid unnecessary persistent writes</td></tr>
<tr><td>Unbounded event history</td><td>No</td><td>It grows indefinitely and turns diagnostics into persistent overhead</td></tr>
<tr><td>Live <code>Source</code>, <code>Creep</code>, or <code>Structure</code> object</td><td>No</td><td>The object belongs to current game state, not durable JSON state</td></tr>
</tbody></table></div>
<p>If you store arrays or objects, give them a clear schema and a bound. Persistence is not a reason to retain data forever.</p>

<h2 id="object-ids">Store object IDs, not live objects</h2>
<p>When a Creep needs to remember a Source, store the ID:</p>
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
<p>A saved ID is durable data. The object returned by <code>Game.getObjectById()</code> is still a current game object. A <code>null</code> result is a branch to handle, not evidence that the saved JSON itself was malformed.</p>

<h2 id="dead-creeps">Handle Memory after a Creep dies</h2>
<p><code>Game.creeps</code> describes current Creeps. Name-indexed Creep Memory can outlive the Creep, so stale entries may remain after the name disappears from <code>Game.creeps</code>.</p>
<pre><code class="language-javascript">for (const name in Memory.creeps) {
  if (!Game.creeps[name]) {
    console.log(name + ' exists in Memory but not Game.creeps');
  }
}</code></pre>
<p>This diagnostic does not delete anything. Use the <a href="/en/blog/screeps-clean-dead-creep-memory">dead Creep Memory cleanup guide</a> before adding deletion, especially when other name-indexed task structures depend on the same Creep.</p>

<h2 id="complete-example">Minimal reset-safe example</h2>
<p><strong>State impact:</strong> this loop initializes two small fields on <code>Worker1</code>. It does not move the Creep or submit a game action.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Worker1;

  if (!creep) {
    console.log('Worker1 was not found.');
    return;
  }

  if (typeof creep.memory.role !== 'string') {
    creep.memory.role = 'harvester';
  }

  if (typeof creep.memory.working !== 'boolean') {
    creep.memory.working = false;
  }

  console.log(JSON.stringify({
    tick: Game.time,
    name: creep.name,
    role: creep.memory.role,
    working: creep.memory.working
  }));
};</code></pre>
<p>To verify it yourself, observe the same Memory fields on later ticks. Then trigger or wait for a real global reset only if you already have a safe way to identify one; the persistent fields should not depend on heap-cache survival. No such live reset trace is claimed by this article.</p>

<h2 id="production-notes">Production adaptation notes</h2>
<p>Keep correctness state small and explicit. A useful production split is:</p>
<ul>
<li><strong>Memory:</strong> role, phase, durable task identity, home room, schema version, and other decisions whose loss would change behavior incorrectly.</li>
<li><strong>Heap cache:</strong> derived lookup tables, parsed configuration, path helpers, or indexes that can be rebuilt after a reset.</li>
<li><strong>RawMemory Segments:</strong> larger persistent string payloads that need their own activation and validation lifecycle.</li>
</ul>
<p>Do not duplicate the same truth in several places unless you define which copy is authoritative. If a heap cache is derived from Memory, rebuild from Memory after reset rather than attempting to make both independently persistent.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Check that the Creep exists before reading <code>creep.memory</code>.</li>
<li>Use one spelling and schema for role or phase values.</li>
<li>Do not expect a custom Memory field to perform an action by itself.</li>
<li>Persist correctness-critical decisions; keep rebuildable derived data in heap cache.</li>
<li>Assume module/global cache can vanish after a global reset.</li>
<li>Store object IDs instead of live game objects.</li>
<li>Handle <code>Game.getObjectById()</code> returning <code>null</code>.</li>
<li>Bound arrays, histories, and diagnostic data.</li>
<li>Do not infer a death cause merely because a name remains in <code>Memory.creeps</code>.</li>
</ul>

<h2 id="scope">Choose the next guide</h2>
<p>Use <a href="/en/blog/screeps-global-cache">Disposable Global Cache</a> when the problem is repeated calculation that is safe to rebuild. Use <a href="/en/blog/screeps-rawmemory-segments">RawMemory Segments</a> when you need larger persistent string storage. Use <a href="/en/blog/screeps-working-state">Working State</a> when you want a Creep to act on a persistent acquire/spend phase.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does a normal JavaScript variable survive every Screeps tick?</h3>
<p>A local variable created inside <code>module.exports.loop</code> is recreated on the next call. Module-scope or <code>global</code> values may survive runtime-context reuse, but they can disappear on a global reset. Use <code>Memory</code> when correctness requires the value after that reset.</p>
<h3>Is creep.memory different from Memory.creeps?</h3>
<p><code>creep.memory</code> exposes the Creep-specific persistent Memory associated with that Creep name. It is the convenient place for small per-Creep state.</p>
<h3>Can I save a Source or Structure object directly?</h3>
<p>Do not treat a live object as durable state. Save its <code>id</code>, resolve it with <code>Game.getObjectById()</code> later, and handle <code>null</code>.</p>
<h3>When should I use global cache instead?</h3>
<p>Use heap cache for derived data that is safe to lose and deterministic to rebuild. Use Memory when loss after a global reset would make behavior incorrect.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Global Objects: Game and Memory</a></li>
<li><a href="https://docs.screeps.com/architecture.html" rel="nofollow noopener noreferrer">Server-side architecture: runtime context reuse</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow noopener noreferrer">API Reference: Creep.memory</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow noopener noreferrer">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow noopener noreferrer">API Reference: StructureSpawn.spawnCreep()</a></li>
</ul>`,
  };
}
