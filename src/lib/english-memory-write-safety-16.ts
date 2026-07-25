import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishMemoryWriteSafetyArticle = {
  slug: "screeps-memory-write-safety",
  path: "/en/blog/screeps-memory-write-safety",
  chinesePath: "/blog/screeps-memory-basics",
  title: "Screeps Memory Safety: JSON Data, Object IDs, and Schema Migrations",
  headline: "How to Write Screeps Memory Without Losing Data or Saving Live Objects",
  description:
    "Initialize Memory namespaces, store JSON-safe values and stable IDs, understand serialization edge cases, validate replacement objects before assignment, version schemas, migrate explicitly, and rate-limit RawMemory inspection.",
  category: "PERSISTENCE · MEMORY WRITE SAFETY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Memory Safety",
  tags: ["Screeps", "Memory", "RawMemory", "JSON", "Schema Migration"],
  keywords: [
    "Screeps Memory write safety",
    "Screeps Memory JSON serialization",
    "Screeps store object ID in Memory",
    "Screeps Memory schema migration",
    "Screeps RawMemory get size",
  ],
  primaryKeyword: "Screeps Memory write safety",
  searchIntent: "Persist validated JSON-safe Screeps state without saving live game objects or corrupting a schema",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Memory persistence, JSON serialization, RawMemory, object IDs and the Memory size limit"],
    ["Schema boundary", "Namespace names, versions, defaults, migration order and cleanup rules are project decisions"],
    ["Serialization boundary", "Only JSON-compatible data is treated as persistent; live game objects and in-process collections are reconstructed"],
    ["JavaScript syntax", "Passed"],
    ["Offline serialization review", "Passed — undefined, non-finite numbers, BigInt, Map, Set, Date, cycles, IDs, versions and migrations"],
    ["Screeps Console test", "Pending"],
    ["Live Memory serialization, global reset, size limit, migration and object-recovery test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["initialize", "Initialize namespaces before writing"],
    ["json-safe", "Store only JSON-safe values"],
    ["serialization-surprises", "Understand serialization surprises"],
    ["ids-not-objects", "Store IDs instead of live objects"],
    ["replace-once", "Validate before replacing state"],
    ["schema-version", "Version the Memory schema"],
    ["migration", "Migrate one version at a time"],
    ["raw-memory", "Use RawMemory sparingly"],
    ["size-limit", "Monitor size without false precision"],
    ["cleanup", "Separate cleanup from normal writes"],
    ["complete-example", "Complete safe task store example"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Can Memory store a Creep or Structure object?", "Store an ID, name, room or coordinates, then recover the current object through Game or Game.getObjectById() each tick."],
    ["What happens to undefined in Memory?", "JSON omits undefined object properties and converts undefined array elements to null."],
    ["Can Memory store BigInt?", "Normal JSON serialization throws on BigInt. Convert it to a reviewed string or bounded number first."],
    ["Should RawMemory.get() run every tick?", "Usually no. Full raw-string inspection belongs to on-demand or rate-limited diagnostics."],
  ],
  previous: {
    href: "/en/blog/screeps-require-modules",
    label: "Previous code organization guide",
    title: "Split Code into Modules",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Initialize every namespace before writing, keep persistent values limited to JSON-safe primitives, arrays and plain objects, store game-object IDs or names instead of live objects, validate a complete replacement object before assigning it, include a schema version, migrate sequentially, and recover current objects each tick. Treat <code>RawMemory.get()</code> and full-size checks as controlled diagnostics.</p>

<h2 id="initialize">Initialize namespaces before writing</h2>
<pre><code class="language-javascript">function ensureMemoryNamespaces() {
  Memory.config ??= {};
  Memory.tasks ??= {};
  Memory.meta ??= {};
  Memory.configurationStatus ??= {};
}</code></pre>
<p>Initialization should create expected containers without overwriting an existing namespace merely because an optional field is missing.</p>
<pre><code class="language-javascript">function isPlainRecord(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
  );
}</code></pre>

<h2 id="json-safe">Store only JSON-safe values</h2>
<pre><code class="language-javascript">function isJsonSafe(value, seen = new Set()) {
  if (value === null) {
    return true;
  }

  if (
    typeof value === 'string'
    || typeof value === 'boolean'
  ) {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (
    typeof value === 'undefined'
    || typeof value === 'function'
    || typeof value === 'symbol'
    || typeof value === 'bigint'
  ) {
    return false;
  }

  if (typeof value !== 'object' || seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.every(item =>
      isJsonSafe(item, seen)
    );
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return false;
  }

  return Object.values(value).every(item =>
    isJsonSafe(item, seen)
  );
}</code></pre>
<p>The validator deliberately rejects special class instances even when JSON could emit some representation, because that representation may not preserve semantics.</p>

<h2 id="serialization-surprises">Understand serialization surprises</h2>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>Typical JSON result</th><th>Safer choice</th></tr></thead>
<tbody>
<tr><td><code>undefined</code> in an object</td><td>Property omitted</td><td>Use <code>null</code> or remove deliberately</td></tr>
<tr><td><code>undefined</code> in an array</td><td><code>null</code></td><td>Use an explicit element</td></tr>
<tr><td><code>NaN</code> or Infinity</td><td><code>null</code></td><td>Reject non-finite numbers</td></tr>
<tr><td>BigInt</td><td>Serialization error</td><td>Convert to a reviewed string</td></tr>
<tr><td><code>Map</code> or <code>Set</code></td><td>Entries are not preserved normally</td><td>Convert explicitly</td></tr>
<tr><td><code>Date</code></td><td>String representation</td><td>Store a documented tick or ISO string</td></tr>
<tr><td>Circular object</td><td>Serialization error</td><td>Remove cycles</td></tr>
</tbody></table></div>
<pre><code class="language-javascript">function serializeSet(set) {
  return set instanceof Set
    ? [...set].sort()
    : [];
}

function restoreStringSet(values) {
  return new Set(
    Array.isArray(values)
      ? values.filter(value =>
          typeof value === 'string'
        )
      : []
  );
}</code></pre>

<h2 id="ids-not-objects">Store IDs instead of live objects</h2>
<pre><code class="language-javascript">function rememberTarget(creep, target) {
  creep.memory.target = target
    ? {
        id: target.id,
        roomName: target.pos.roomName,
        x: target.pos.x,
        y: target.pos.y,
        rememberedAt: Game.time
      }
    : null;
}</code></pre>
<pre><code class="language-javascript">function recoverRememberedTarget(creep) {
  const record = creep?.memory?.target;
  if (!record || typeof record.id !== 'string') {
    return null;
  }

  const object = Game.getObjectById(record.id);
  if (!object) {
    return null;
  }

  return object.pos.roomName === record.roomName
    ? object
    : null;
}</code></pre>
<p>IDs can become stale. Recovery failure is normal state, not proof that Memory is corrupted.</p>

<h2 id="replace-once">Validate before replacing state</h2>
<pre><code class="language-javascript">function buildTransferTask(input) {
  const candidate = {
    version: 1,
    id: String(input.id),
    roomName: String(input.roomName),
    targetId: String(input.targetId),
    resourceType: String(input.resourceType),
    amount: input.amount,
    status: 'pending',
    createdAt: Game.time
  };

  if (
    candidate.id.length === 0
    || candidate.roomName.length === 0
    || candidate.targetId.length === 0
    || candidate.resourceType.length === 0
    || !Number.isInteger(candidate.amount)
    || candidate.amount <= 0
    || !isJsonSafe(candidate)
  ) {
    return {
      valid: false,
      reason: 'invalid-transfer-task'
    };
  }

  return { valid: true, value: candidate };
}</code></pre>
<pre><code class="language-javascript">function saveTransferTask(input) {
  Memory.tasks ??= {};
  Memory.tasks.transfers ??= {};

  const result = buildTransferTask(input);
  if (!result.valid) {
    return result;
  }

  Memory.tasks.transfers[result.value.id] = result.value;
  return { valid: true, taskId: result.value.id };
}</code></pre>
<p>One replacement avoids exposing this function's own partial field sequence, but other code can still mutate the namespace in the same tick.</p>

<h2 id="schema-version">Version the Memory schema</h2>
<pre><code class="language-javascript">const CURRENT_MEMORY_SCHEMA = 3;

function getMemorySchemaVersion() {
  return Number.isInteger(Memory.meta?.schemaVersion)
    ? Memory.meta.schemaVersion
    : 0;
}</code></pre>
<p>A version makes incompatible changes detectable instead of guessing from whichever field happens to exist.</p>

<h2 id="migration">Migrate one version at a time</h2>
<pre><code class="language-javascript">function migrateMemoryV0ToV1() {
  Memory.config ??= {};
  Memory.meta.schemaVersion = 1;
}

function migrateMemoryV1ToV2() {
  Memory.tasks ??= {};
  Memory.tasks.transfers ??= {};
  Memory.meta.schemaVersion = 2;
}

function migrateMemoryV2ToV3() {
  const values = Array.isArray(
    Memory.config.allowedUsers
  )
    ? Memory.config.allowedUsers
    : [];

  Memory.config.allowedUsers = [
    ...new Set(
      values.filter(value =>
        typeof value === 'string'
      )
    )
  ].sort();
  Memory.meta.schemaVersion = 3;
}</code></pre>
<pre><code class="language-javascript">function migrateMemory() {
  Memory.meta ??= { schemaVersion: 0 };

  while (Memory.meta.schemaVersion < CURRENT_MEMORY_SCHEMA) {
    const version = Memory.meta.schemaVersion;

    if (version === 0) {
      migrateMemoryV0ToV1();
    } else if (version === 1) {
      migrateMemoryV1ToV2();
    } else if (version === 2) {
      migrateMemoryV2ToV3();
    } else {
      throw new Error(
        'Unsupported Memory schema version: '
        + String(version)
      );
    }

    Memory.meta.lastMigrationAt = Game.time;
  }
}</code></pre>
<p>Sequential migrations make each transformation reviewable and testable.</p>

<h2 id="raw-memory">Use RawMemory sparingly</h2>
<pre><code class="language-javascript">function inspectRawMemoryOnDemand(enabled) {
  if (enabled !== true) {
    return null;
  }

  const raw = RawMemory.get();

  return {
    characterLength: raw.length,
    beginsWithObject: raw.startsWith('{'),
    endsWithObject: raw.endsWith('}')
  };
}</code></pre>
<p>Full-string inspection is useful for diagnostics and migrations, but repeated full-Memory work can consume unnecessary CPU.</p>

<h2 id="size-limit">Monitor size without false precision</h2>
<pre><code class="language-javascript">function shouldInspectMemorySize(interval = 1000) {
  return Number.isInteger(interval)
    && interval > 0
    && Game.time % interval === 0;
}</code></pre>
<p>The platform Memory limit is 2 MB. A string character count is not guaranteed to equal encoded bytes for all characters, so label approximate diagnostics honestly and retain safety margin.</p>

<h2 id="cleanup">Separate cleanup from normal writes</h2>
<pre><code class="language-javascript">function listDeadCreepMemoryNames() {
  return Object.keys(Memory.creeps || {})
    .filter(name => !Game.creeps[name])
    .sort();
}</code></pre>
<pre><code class="language-javascript">function cleanupDeadCreepMemory(names) {
  if (!Array.isArray(names)) {
    return 0;
  }

  let removed = 0;
  for (const name of names) {
    if (
      typeof name === 'string'
      && !Game.creeps[name]
      && Memory.creeps?.[name]
    ) {
      delete Memory.creeps[name];
      removed += 1;
    }
  }

  return removed;
}</code></pre>
<p>Listing first allows review. A production cleanup may preserve task history or replacement state.</p>

<h2 id="complete-example">Complete safe task store example</h2>
<pre><code class="language-javascript">function initializePersistentState() {
  ensureMemoryNamespaces();
  migrateMemory();
  Memory.tasks.transfers ??= {};
}</code></pre>
<pre><code class="language-javascript">function readTransferTask(taskId) {
  const task = Memory.tasks?.transfers?.[taskId];

  if (!task || task.version !== 1) {
    return {
      valid: false,
      reason: 'task-missing-or-version-mismatch'
    };
  }

  if (
    typeof task.targetId !== 'string'
    || typeof task.roomName !== 'string'
    || typeof task.resourceType !== 'string'
    || !Number.isInteger(task.amount)
    || task.amount <= 0
  ) {
    return { valid: false, reason: 'task-invalid' };
  }

  return {
    valid: true,
    task,
    target: Game.getObjectById(task.targetId)
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  initializePersistentState();

  if (shouldInspectMemorySize(1000)) {
    const raw = RawMemory.get();

    Memory.configurationStatus.memory = {
      checkedAt: Game.time,
      rawCharacterLength: raw.length,
      schemaVersion: getMemorySchemaVersion()
    };
  }
};</code></pre>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Initialize expected namespaces.</li>
<li>Reject unexpected namespace types.</li>
<li>Allow only JSON-safe persistent values.</li>
<li>Reject non-finite numbers and BigInt.</li>
<li>Convert Set and Map explicitly.</li>
<li>Store IDs, names and coordinates instead of objects.</li>
<li>Build and validate before one replacement write.</li>
<li>Version and migrate schemas sequentially.</li>
<li>Rate-limit RawMemory diagnostics.</li>
<li>Review cleanup separately.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement Segments, compression, checksums, multi-shard synchronization, rollback or a full task framework. Return to the <a href="/en/blog">English article library</a> for runtime and persistence guides.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can a Date be stored?</h3>
<p>JSON can emit a string, but a Date object is not restored. Store a documented string or game tick deliberately.</p>
<h3>Why reject Map and Set?</h3>
<p>Default JSON output loses their entries. Explicit conversion preserves the intended data and restored type.</p>
<h3>Is one assignment truly atomic?</h3>
<p>It avoids this function's own partial update sequence, but another module can still mutate the same namespace in the tick.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html#Memory-object" rel="nofollow">Screeps Documentation: Memory object</a></li>
<li><a href="https://docs.screeps.com/api/#Memory" rel="nofollow">API Reference: Memory</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory" rel="nofollow">API Reference: RawMemory</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
