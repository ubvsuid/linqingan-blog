import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishGlobalCacheArticle = {
  slug: "screeps-global-cache",
  path: "/en/blog/screeps-global-cache",
  chinesePath: "/blog/screeps-global-cache",
  title: "Screeps Global Cache Guide: Fast, Versioned, and Disposable",
  headline: "How to Build a Safe Global Cache in Screeps",
  description:
    "Use the global object as a disposable runtime cache, rebuild after global resets, version and expire entries, cache IDs and derived data instead of live game objects, and return cloned values to prevent accidental mutation.",
  category: "RUNTIME · GLOBAL CACHE AND RESET RECOVERY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Global Cache",
  tags: ["Screeps", "Global", "Cache", "Memory", "Performance"],
  keywords: [
    "Screeps global cache",
    "Screeps global reset",
    "Screeps cache invalidation",
    "Screeps cache object IDs",
    "Screeps global vs Memory",
  ],
  primaryKeyword: "Screeps global cache",
  searchIntent: "Design a fast cache that remains correct after global resets and state changes",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — global scope can persist across ticks but may reset; Memory remains the persistent application store"],
    ["Persistence boundary", "Global cache is disposable acceleration, never the only source of truth"],
    ["Object boundary", "Live Room, Creep, Structure and Source objects are not cached across ticks; IDs are resolved again"],
    ["JavaScript syntax", "Passed"],
    ["Offline cache review", "Passed — reset, hit, miss, version mismatch, TTL, clone isolation and bounded eviction states"],
    ["Screeps Console test", "Pending"],
    ["Live global reset, CPU and multi-tick invalidation test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["lifetime", "What global lifetime actually guarantees"],
    ["source-of-truth", "Cache is not the source of truth"],
    ["never-live-objects", "Do not cache live game objects"],
    ["versioned-entry", "Use versioned entries and TTL"],
    ["clone-values", "Return cloned values"],
    ["complete-cache", "Complete versioned global cache"],
    ["id-cache", "Cache IDs and resolve objects each tick"],
    ["invalidation", "Invalidate from explicit state versions"],
    ["bounded-size", "Keep the cache bounded"],
    ["warm-reset", "Measure warm and reset ticks separately"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does global persist forever in Screeps?",
      "No. It can remain available across ticks while the same runtime context is alive, but a global reset can remove every cached value.",
    ],
    [
      "Should important state be stored only in global?",
      "No. Store durable state in Memory, Segments, or another persistent mechanism and rebuild the global cache when it is missing.",
    ],
    [
      "Can I cache a Structure object in global?",
      "Do not reuse live game objects across ticks. Cache the ID or derived primitive data, then call Game.getObjectById() in the current tick.",
    ],
    [
      "Why clone cached arrays and objects?",
      "Without clone isolation, one caller can mutate the shared cache and change results for unrelated callers.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-cpu-getused-bucket",
    label: "Previous runtime guide",
    title: "Measure CPU and Bucket",
  },
  next: {
    href: "/en/blog/screeps-rawmemory-segments",
    label: "Next storage guide",
    title: "Use RawMemory Segments",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>The Screeps global scope can preserve JavaScript values across multiple ticks while the same runtime context remains alive, but it can reset without notice. Use <code>global</code> only as a disposable performance cache. Every entry must be rebuildable from persistent state or current game objects, and callers must remain correct when the cache is empty.</p>

<h2 id="lifetime">What global lifetime actually guarantees</h2>
<p>Top-level module code and properties assigned to <code>global</code> belong to the current global execution context. They can survive from one tick to the next, which makes them useful for parsed constants, lookup tables, route metadata, or static CostMatrix layers. The runtime may create a new global context, removing all of them.</p>
<pre><code class="language-javascript">global.runtimeBoot ??= {
  bootTick: Game.time,
  bootCount: 0
};

global.runtimeBoot.bootCount += 1;

console.log({
  bootTick: global.runtimeBoot.bootTick,
  currentTick: Game.time,
  loopExecutionsInThisGlobal:
    global.runtimeBoot.bootCount
});</code></pre>
<p>This detects the current global lifetime. It does not identify why the previous context ended and should not be used as durable history.</p>

<h2 id="source-of-truth">Cache is not the source of truth</h2>
<div class="table-scroll"><table>
<thead><tr><th>Data</th><th>Durable source</th><th>Possible global cache</th></tr></thead>
<tbody>
<tr><td>Role configuration</td><td>Code or Memory</td><td>Validated lookup map</td></tr>
<tr><td>Room route policy</td><td>Memory or code</td><td>Compiled room-cost table</td></tr>
<tr><td>Source assignments</td><td>Memory IDs</td><td>Derived assignment index</td></tr>
<tr><td>Static layout matrix</td><td>Current room state plus version</td><td>CostMatrix instance</td></tr>
<tr><td>Current Creep object</td><td><code>Game.creeps</code></td><td>Never reuse across ticks</td></tr>
</tbody></table></div>
<p>Correct code handles a cache miss by rebuilding, using a slower path, or returning an explicit unavailable status. It does not assume the cache must exist because it existed on the previous tick.</p>

<h2 id="never-live-objects">Do not cache live game objects</h2>
<pre><code class="language-javascript">function cacheTargetId(key, target) {
  global.targetIdCache ??= new Map();

  if (!target?.id) {
    global.targetIdCache.delete(key);
    return false;
  }

  global.targetIdCache.set(key, target.id);
  return true;
}

function resolveCachedTarget(key) {
  const id = global.targetIdCache?.get(key);

  if (typeof id !== 'string') {
    return null;
  }

  return Game.getObjectById(id);
}</code></pre>
<p>Room, Creep, Structure, Source, Mineral, Flag-position wrappers, and other live objects represent the current tick. Keep an ID or JSON-compatible description when you need a stable reference, then resolve the live object again.</p>

<h2 id="versioned-entry">Use versioned entries and TTL</h2>
<pre><code class="language-javascript">function isCacheEntryFresh(entry, options) {
  if (!entry || entry.version !== options.version) {
    return false;
  }

  if (!Number.isInteger(options.maxAge)) {
    return true;
  }

  return Game.time - entry.createdAt
    <= options.maxAge;
}</code></pre>
<p>A version handles schema or policy changes. A TTL handles time-based freshness. Neither automatically detects structure changes, ownership changes, destroyed objects, or modified Memory configuration; those need explicit invalidation inputs.</p>

<h2 id="clone-values">Return cloned values</h2>
<pre><code class="language-javascript">function cloneCacheValue(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return value === undefined
    ? undefined
    : JSON.parse(JSON.stringify(value));
}</code></pre>
<p>Clone isolation is appropriate for JSON-compatible data. It is not a way to persist live game objects, functions, CostMatrix instances, Maps, Sets, or class prototypes. Those need type-specific handling.</p>

<h2 id="complete-cache">Complete versioned global cache</h2>
<p><strong>State impact:</strong> this helper writes only to <code>global</code>. A reset removes the cache. The builder must be safe to run again.</p>
<pre><code class="language-javascript">function getRuntimeCache() {
  global.runtimeCache ??= new Map();
  return global.runtimeCache;
}

function cloneJsonValue(value) {
  return value === undefined
    ? undefined
    : JSON.parse(JSON.stringify(value));
}

function getCachedValue(key, options, builder) {
  if (
    typeof key !== 'string'
    || !Number.isInteger(options?.version)
    || options.version < 0
    || typeof builder !== 'function'
  ) {
    return {
      status: 'arguments-invalid',
      value: null,
      cacheHit: false
    };
  }

  const cache = getRuntimeCache();
  const entry = cache.get(key);
  const maxAgeValid =
    !Number.isInteger(options.maxAge)
    || (
      options.maxAge >= 0
      && Game.time - entry?.createdAt
        <= options.maxAge
    );
  const fresh = Boolean(
    entry
    && entry.version === options.version
    && maxAgeValid
  );

  if (fresh) {
    entry.lastAccessedAt = Game.time;
    entry.hits += 1;

    return {
      status: 'cache-hit',
      value: cloneJsonValue(entry.value),
      cacheHit: true
    };
  }

  let built;
  try {
    built = builder();
  } catch (error) {
    return {
      status: 'builder-failed',
      value: null,
      cacheHit: false,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }

  const stored = cloneJsonValue(built);
  cache.set(key, {
    version: options.version,
    createdAt: Game.time,
    lastAccessedAt: Game.time,
    hits: 0,
    value: stored
  });

  return {
    status: entry
      ? 'cache-rebuilt'
      : 'cache-created',
    value: cloneJsonValue(stored),
    cacheHit: false
  };
}</code></pre>
<p>The cache is correct only when the builder can reconstruct the value after a reset and the version or invalidation inputs change whenever the derived result becomes stale.</p>

<h2 id="id-cache">Cache IDs and resolve objects each tick</h2>
<p>A common safe pattern is to cache a sorted list of object IDs, then resolve and filter them in the current tick.</p>
<pre><code class="language-javascript">function getSourceIds(room) {
  const result = getCachedValue(
    'source-ids:' + room.name,
    {
      version: 1,
      maxAge: 1000
    },
    () => room.find(FIND_SOURCES)
      .map(source => source.id)
      .sort()
  );

  return Array.isArray(result.value)
    ? result.value
    : [];
}

function resolveSourceIds(ids) {
  return ids
    .map(id => Game.getObjectById(id))
    .filter(source => source !== null);
}</code></pre>
<p>If the room is not visible, the builder cannot perform <code>room.find()</code>. Callers should use an existing cached ID list only when that stale-data policy is acceptable, or return a visibility-required status.</p>

<h2 id="invalidation">Invalidate from explicit state versions</h2>
<pre><code class="language-javascript">function getLayoutVersion(roomName) {
  const value = Memory.layoutVersion?.[roomName];
  return Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function getStaticLayoutKey(roomName) {
  return [
    'static-layout',
    roomName,
    getLayoutVersion(roomName)
  ].join(':');
}</code></pre>
<p>Increment a persistent version when your code changes a layout contract or confirms a relevant state change. Do not increment every tick, or the cache will never hit. Do not omit it when structure layout affects the cached result.</p>

<h2 id="bounded-size">Keep the cache bounded</h2>
<pre><code class="language-javascript">function evictRuntimeCache(maxEntries = 200) {
  const cache = getRuntimeCache();

  if (
    !Number.isInteger(maxEntries)
    || maxEntries < 0
    || cache.size <= maxEntries
  ) {
    return 0;
  }

  const entries = [...cache.entries()].sort(
    (a, b) =>
      a[1].lastAccessedAt - b[1].lastAccessedAt
      || a[0].localeCompare(b[0])
  );
  const removeCount = cache.size - maxEntries;

  for (let index = 0; index < removeCount; index += 1) {
    cache.delete(entries[index][0]);
  }

  return removeCount;
}</code></pre>
<p>The limit of 200 is example policy. Measure heap pressure, rebuild cost, key count, and access patterns before choosing a production bound.</p>

<h2 id="warm-reset">Measure warm and reset ticks separately</h2>
<pre><code class="language-javascript">function describeCacheRuntime() {
  global.cacheBootTick ??= Game.time;
  global.runtimeCache ??= new Map();

  return {
    bootTick: global.cacheBootTick,
    globalAge: Game.time - global.cacheBootTick,
    entries: global.runtimeCache.size,
    cpuUsedSoFar: Game.cpu.getUsed()
  };
}</code></pre>
<p>A reset tick may rebuild several entries and consume more CPU than a warm tick. Profile both. A cache that is fast only after a very expensive uncontrolled rebuild can still cause bucket loss or hard-limit failures.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Verify every cached value has a rebuild path.</li>
<li>Keep durable state outside <code>global</code>.</li>
<li>Do not cache live game objects across ticks.</li>
<li>Use IDs or primitive derived data.</li>
<li>Version schema and policy changes.</li>
<li>Add TTL only when time-based freshness is meaningful.</li>
<li>Return cloned mutable values.</li>
<li>Bound entry count and key growth.</li>
<li>Measure cache hits, misses, rebuilds, and reset ticks separately.</li>
<li>Keep callers correct when the cache is empty.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement a heap profiler, cross-shard cache, automatic structure-event invalidation, shared module loader internals, WeakMap policies, or live reset benchmarks. Continue with <a href="/en/blog/screeps-rawmemory-segments">RawMemory Segments</a> when data must persist across global resets without occupying ordinary Memory.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is global faster than Memory?</h3>
<p>It can avoid repeated parsing or reconstruction during one global lifetime, but performance must be measured in your workload.</p>
<h3>Can a cache survive a code deployment?</h3>
<p>Do not rely on it. Treat deployments and runtime resets as cache-loss events.</p>
<h3>Should I cache every lookup?</h3>
<p>No. Cache work that is expensive enough, reused enough, and safe to invalidate.</p>
<h3>Can a global cache replace Segments?</h3>
<p>No. Global is disposable. Segments are persistent strings with next-tick activation semantics.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Screeps Documentation: Global Objects</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game Loop and Global Reset</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#Memory" rel="nofollow">API Reference: Memory</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
