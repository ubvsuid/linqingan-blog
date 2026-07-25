import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishSegmentsArticle = {
  slug: "screeps-rawmemory-segments",
  path: "/en/blog/screeps-rawmemory-segments",
  chinesePath: "/blog/screeps-rawmemory-segments",
  title: "Screeps RawMemory Segments: Activation and Safe Storage",
  headline: "How to Use RawMemory Segments Safely in Screeps",
  description:
    "Validate segment IDs, activate one consolidated set for the next tick, distinguish unavailable from empty data, parse versioned string payloads safely, merge updates, and avoid multiple setActiveSegments calls overwriting each other.",
  category: "STORAGE · RAWMEMORY SEGMENT LIFECYCLE",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "20 min read",
  breadcrumbLabel: "RawMemory Segments",
  tags: ["Screeps", "RawMemory", "Segments", "Memory", "Persistence"],
  keywords: [
    "Screeps RawMemory segments",
    "setActiveSegments next tick",
    "Screeps segment 100 KB",
    "RawMemory.segments undefined",
    "Screeps segment manager",
  ],
  primaryKeyword: "Screeps RawMemory segments",
  searchIntent: "Build a correct next-tick activation, read, merge, and write workflow for Segments",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — segment IDs 0–99, 100 KB per segment, up to 10 active, next-tick activation and last-call override"],
    ["Timing boundary", "setActiveSegments() schedules availability for the next tick; same-tick reads are not promised"],
    ["Coordination boundary", "One manager makes the final activation call so later modules cannot silently replace the requested set"],
    ["JavaScript syntax", "Passed"],
    ["Offline lifecycle review", "Passed — invalid IDs, deduplication, 10-segment cap, waiting, unavailable, empty, corrupt, versioned and merged payload states"],
    ["Screeps Console test", "Pending"],
    ["Live segment activation, persistence and multi-module test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["official-limits", "Official segment limits"],
    ["timeline", "Activation and read timeline"],
    ["undefined-empty", "Unavailable is not empty"],
    ["single-manager", "Use one activation manager"],
    ["validate-ids", "Validate and deduplicate IDs"],
    ["parse-payload", "Parse a versioned payload safely"],
    ["write-payload", "Serialize and enforce the byte limit"],
    ["complete-manager", "Complete segment request manager"],
    ["read-merge-write", "Complete read, merge, and write workflow"],
    ["multiple-calls", "Why multiple activation calls are dangerous"],
    ["double-buffer", "Use double buffering for critical updates"],
    ["public-segments", "Keep public and foreign segments separate"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Can I read a segment immediately after setActiveSegments()?",
      "No. The activation request applies to the next tick. Read the segment after the requested set becomes active.",
    ],
    [
      "What does RawMemory.segments[id] === undefined mean?",
      "The segment is not currently available to your script. It is different from an active segment containing an empty string.",
    ],
    [
      "How many segments can be active at once?",
      "Up to 10 segment IDs can be active. Valid IDs are 0 through 99, and each segment can store up to 100 KB of string data.",
    ],
    [
      "What happens when two modules call setActiveSegments()?",
      "The later call replaces the earlier activation request for the next tick. Consolidate requests and call the API once.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-global-cache",
    label: "Previous runtime guide",
    title: "Build a Disposable Global Cache",
  },
  next: {
    href: "/en/blog/screeps-memory-basics",
    label: "Related Memory guide",
    title: "Understand Screeps Memory",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>RawMemory.setActiveSegments(ids)</code> schedules up to 10 valid segment IDs for the next tick. On the next tick, read active strings from <code>RawMemory.segments[id]</code>. An <code>undefined</code> value means unavailable, not empty. Store strings only, validate JSON and schema versions, and let one central manager make the final activation call because a later call in the same tick replaces the earlier request.</p>

<h2 id="official-limits">Official segment limits</h2>
<div class="table-scroll"><table>
<thead><tr><th>Rule</th><th>Official boundary</th><th>Application consequence</th></tr></thead>
<tbody>
<tr><td>Segment IDs</td><td>0 through 99</td><td>Reject negative, fractional, and greater-than-99 IDs</td></tr>
<tr><td>Active segments</td><td>Up to 10</td><td>Prioritize and deduplicate requests</td></tr>
<tr><td>Segment size</td><td>100 KB each</td><td>Measure encoded string bytes before writing</td></tr>
<tr><td>Activation timing</td><td>Available on the next tick</td><td>Use an explicit request/read lifecycle</td></tr>
<tr><td>Repeated activation calls</td><td>The last call defines the next set</td><td>Call once from a central manager</td></tr>
</tbody></table></div>
<p>Segments are persistent string storage. They do not behave like ordinary synchronous object properties that can be activated and read immediately in one function call.</p>

<h2 id="timeline">Activation and read timeline</h2>
<pre><code class="language-text">tick 500
modules request segments 2, 4, and 7
manager consolidates [2, 4, 7]
manager calls RawMemory.setActiveSegments([2, 4, 7])

tick 501
RawMemory.segments[2], [4], and [7] may be available
read and validate payloads
write updated strings if needed
collect the next activation request</code></pre>
<p>Writing <code>RawMemory.segments[id]</code> modifies the segment string. Activation controls which segments are available to read and write in the current tick.</p>

<h2 id="undefined-empty">Unavailable is not empty</h2>
<pre><code class="language-javascript">function describeSegmentAvailability(id) {
  const raw = RawMemory.segments[id];

  if (raw === undefined) {
    return {
      status: 'segment-unavailable',
      id,
      raw: null
    };
  }

  if (raw === '') {
    return {
      status: 'segment-empty',
      id,
      raw
    };
  }

  return {
    status: 'segment-readable',
    id,
    raw
  };
}</code></pre>
<p>Do not initialize an unavailable segment to an empty object. That can overwrite data after a scheduling mistake or when another module replaced the active set.</p>

<h2 id="single-manager">Use one activation manager</h2>
<p>Modules should request IDs from your manager rather than call <code>setActiveSegments()</code> directly.</p>
<pre><code class="language-javascript">function getSegmentRequestSet() {
  global.segmentRequests ??= new Set();
  return global.segmentRequests;
}

function requestSegment(id) {
  if (!Number.isInteger(id) || id < 0 || id > 99) {
    return false;
  }

  getSegmentRequestSet().add(id);
  return true;
}</code></pre>
<p>The request set is disposable global coordination for the current tick. Persistent job state belongs in Memory or a segment payload.</p>

<h2 id="validate-ids">Validate and deduplicate IDs</h2>
<pre><code class="language-javascript">function normalizeSegmentIds(ids, limit = 10) {
  if (!Array.isArray(ids)) {
    return [];
  }

  const normalized = [...new Set(
    ids.filter(
      id => Number.isInteger(id)
        && id >= 0
        && id <= 99
    )
  )].sort((a, b) => a - b);

  return normalized.slice(0, Math.min(10, limit));
}</code></pre>
<p>Silently slicing is acceptable only after your scheduler has assigned priorities. A production manager should report which requests were deferred rather than pretending every module received its segment.</p>

<h2 id="parse-payload">Parse a versioned payload safely</h2>
<pre><code class="language-javascript">function parseSegmentJson(raw, expectedVersion) {
  if (raw === undefined) {
    return {
      status: 'unavailable',
      value: null
    };
  }

  if (raw === '') {
    return {
      status: 'empty',
      value: null
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      status: 'invalid-json',
      value: null,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }

  if (
    !parsed
    || parsed.version !== expectedVersion
    || typeof parsed.data !== 'object'
  ) {
    return {
      status: 'schema-mismatch',
      value: null
    };
  }

  return {
    status: 'ready',
    value: parsed.data
  };
}</code></pre>
<p>A schema mismatch is not automatically corrupt data. It may require a migration. Preserve the old raw string until the migration or recovery policy succeeds.</p>

<h2 id="write-payload">Serialize and enforce the byte limit</h2>
<pre><code class="language-javascript">function encodeSegmentPayload(version, data) {
  const raw = JSON.stringify({
    version,
    writtenAt: Game.time,
    data
  });
  const bytes = new TextEncoder().encode(raw).length;

  if (bytes > 100 * 1024) {
    return {
      ok: false,
      status: 'segment-too-large',
      raw: null,
      bytes
    };
  }

  return {
    ok: true,
    status: 'encoded',
    raw,
    bytes
  };
}</code></pre>
<p>The official boundary is 100 KB. Byte length is safer than JavaScript character count because non-ASCII characters can use multiple encoded bytes.</p>

<h2 id="complete-manager">Complete segment request manager</h2>
<p><strong>State impact:</strong> the manager writes one activation request for the next tick and records a compact plan in Memory. It does not modify segment payloads.</p>
<pre><code class="language-javascript">function getSegmentManager() {
  global.segmentManager ??= {
    requested: new Map()
  };
  return global.segmentManager;
}

function requestActiveSegment(id, priority = 0) {
  if (
    !Number.isInteger(id)
    || id < 0
    || id > 99
    || !Number.isFinite(priority)
  ) {
    return false;
  }

  const manager = getSegmentManager();
  const previous = manager.requested.get(id);

  manager.requested.set(
    id,
    previous === undefined
      ? priority
      : Math.max(previous, priority)
  );
  return true;
}

function finalizeSegmentActivation() {
  const manager = getSegmentManager();
  const ranked = [...manager.requested.entries()]
    .sort(
      (a, b) => b[1] - a[1] || a[0] - b[0]
    );
  const active = ranked
    .slice(0, 10)
    .map(([id]) => id);
  const deferred = ranked
    .slice(10)
    .map(([id]) => id);

  RawMemory.setActiveSegments(active);
  Memory.segmentPlan = {
    requestedAt: Game.time,
    activeNextTick: active,
    deferred
  };

  manager.requested.clear();

  return Memory.segmentPlan;
}</code></pre>
<p>Call <code>finalizeSegmentActivation()</code> exactly once after every module has submitted requests. A priority policy prevents incidental module order from deciding which data disappears.</p>

<h2 id="read-merge-write">Complete read, merge, and write workflow</h2>
<p><strong>State impact:</strong> this workflow reads one active segment and may replace its string with a merged versioned payload.</p>
<pre><code class="language-javascript">function readVersionedSegment(id, version) {
  const raw = RawMemory.segments[id];

  if (raw === undefined) {
    return {
      status: 'unavailable',
      data: null
    };
  }

  if (raw === '') {
    return {
      status: 'empty',
      data: {}
    };
  }

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed?.version !== version
      || !parsed.data
      || typeof parsed.data !== 'object'
      || Array.isArray(parsed.data)
    ) {
      return {
        status: 'schema-mismatch',
        data: null
      };
    }

    return {
      status: 'ready',
      data: parsed.data
    };
  } catch (error) {
    return {
      status: 'invalid-json',
      data: null,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}

function mergeAndWriteSegment(
  id,
  version,
  patch
) {
  const current = readVersionedSegment(id, version);

  if (
    current.status !== 'ready'
    && current.status !== 'empty'
  ) {
    return {
      ok: false,
      status: current.status
    };
  }

  const data = {
    ...current.data,
    ...patch
  };
  const raw = JSON.stringify({
    version,
    writtenAt: Game.time,
    data
  });
  const bytes = new TextEncoder().encode(raw).length;

  if (bytes > 100 * 1024) {
    return {
      ok: false,
      status: 'segment-too-large',
      bytes
    };
  }

  RawMemory.segments[id] = raw;

  return {
    ok: true,
    status: 'segment-written',
    bytes,
    keys: Object.keys(data).length
  };
}</code></pre>
<p>The shallow merge suits flat namespaces. Nested records need an explicit merge contract to avoid replacing unrelated fields.</p>

<h2 id="multiple-calls">Why multiple activation calls are dangerous</h2>
<pre><code class="language-javascript">RawMemory.setActiveSegments([1, 2]);
RawMemory.setActiveSegments([7]);

// The second call defines the next active set.
// Segments 1 and 2 are not preserved automatically.</code></pre>
<p>This is why libraries should not call the API independently. Request IDs centrally, inspect deferred work, and perform one final call.</p>

<h2 id="double-buffer">Use double buffering for critical updates</h2>
<pre><code class="language-javascript">function chooseBuffer(activeIndex) {
  return activeIndex === 0
    ? { readId: 20, writeId: 21, nextIndex: 1 }
    : { readId: 21, writeId: 20, nextIndex: 0 };
}</code></pre>
<p>A double-buffer design writes a complete new payload to the inactive segment, validates it, then flips a small persistent pointer. It can reduce damage from partial application logic, but it doubles storage and activation demand. The actual atomicity and recovery protocol still need live verification.</p>

<h2 id="public-segments">Keep public and foreign segments separate</h2>
<p><code>setPublicSegments()</code>, <code>setDefaultPublicSegment()</code>, <code>setActiveForeignSegment()</code>, and <code>RawMemory.foreignSegment</code> support sharing. They add identity, trust, schema, availability, and size concerns. Do not mix untrusted foreign JSON directly into your private write path.</p>
<pre><code class="language-javascript">function parseForeignSegment(foreign) {
  if (
    !foreign
    || typeof foreign.username !== 'string'
    || !Number.isInteger(foreign.id)
    || typeof foreign.data !== 'string'
  ) {
    return null;
  }

  return {
    username: foreign.username,
    id: foreign.id,
    data: foreign.data
  };
}</code></pre>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Validate IDs 0–99.</li>
<li>Deduplicate requests and cap the active set at 10.</li>
<li>Make one final <code>setActiveSegments()</code> call.</li>
<li>Record which IDs are expected next tick.</li>
<li>Keep <code>undefined</code> distinct from an empty string.</li>
<li>Parse JSON inside <code>try/catch</code>.</li>
<li>Validate schema version before using data.</li>
<li>Measure encoded bytes before writing.</li>
<li>Do not overwrite unavailable or corrupt data automatically.</li>
<li>Define merge and migration contracts.</li>
<li>Keep public or foreign data outside trusted private state.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement compression, checksums, full migrations, a multi-shard storage service, public-segment discovery, foreign-segment retries, or a proven atomic commit protocol. Console and live multi-tick segment verification remain Pending.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Are Segments normal JavaScript objects?</h3>
<p>No. They are persistent strings exposed through an activation lifecycle.</p>
<h3>Can I activate all 100 segments?</h3>
<p>No. Up to 10 can be active at once.</p>
<h3>Should undefined create a new empty payload?</h3>
<p>No. First distinguish unavailable from an active empty string.</p>
<h3>Why record activeNextTick in Memory?</h3>
<p>It provides a durable expectation that survives a global reset and helps diagnose scheduling conflicts.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RawMemory" rel="nofollow">API Reference: RawMemory</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.setActiveSegments" rel="nofollow">API Reference: RawMemory.setActiveSegments()</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.segments" rel="nofollow">API Reference: RawMemory.segments</a></li>
<li><a href="https://docs.screeps.com/api/#RawMemory.setPublicSegments" rel="nofollow">API Reference: Public Segments</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
