import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishCpuArticle = {
  slug: "screeps-cpu-getused-bucket",
  path: "/en/blog/screeps-cpu-getused-bucket",
  chinesePath: "/blog/screeps-cpu-getused-bucket",
  title: "Screeps CPU Guide: getUsed(), Bucket, and Tick Budgets",
  headline: "How to Measure and Control CPU Usage in Screeps",
  description:
    "Measure CPU with Game.cpu.getUsed() deltas, understand limit, tickLimit, and bucket, avoid Simulation-only conclusions, collect bounded samples, and gate optional work without hiding essential room logic.",
  category: "RUNTIME · CPU MEASUREMENT AND BUDGETING",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "CPU Measurement",
  tags: ["Screeps", "CPU", "Bucket", "Performance", "Profiling"],
  keywords: [
    "Screeps Game.cpu.getUsed",
    "Screeps CPU bucket",
    "Screeps tickLimit",
    "Screeps CPU profiling",
    "Screeps Simulation getUsed zero",
  ],
  primaryKeyword: "Screeps Game.cpu.getUsed",
  searchIntent: "Measure real Screeps CPU and design safe bucket-aware work budgets",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — getUsed(), limit, tickLimit, bucket, bucket ceiling and Simulation behavior"],
    ["Measurement boundary", "CPU deltas are runtime observations; the Simulation returns 0 and cannot prove production cost"],
    ["Control boundary", "Bucket thresholds gate optional work only; essential colony actions remain separate"],
    ["JavaScript syntax", "Passed"],
    ["Offline budget review", "Passed — deltas, invalid samples, percentiles, bucket bands and hard budget guards"],
    ["Screeps Console test", "Pending"],
    ["Live shard CPU and multi-tick bucket test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["cpu-fields", "Understand limit, tickLimit, bucket, and getUsed"],
    ["measure-delta", "Measure one code section"],
    ["simulation", "Why the Simulation cannot validate CPU cost"],
    ["samples", "Collect bounded samples"],
    ["percentiles", "Use averages and percentiles"],
    ["bucket-policy", "Use bucket bands as policy"],
    ["complete-budget", "Complete CPU budget controller"],
    ["essential-optional", "Separate essential and optional work"],
    ["early-stop", "Stop before optional work exhausts the tick"],
    ["measurement-noise", "Reduce measurement noise"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "What does Game.cpu.getUsed() return?",
      "It returns cumulative CPU used in the current tick. Subtract a start sample from an end sample to estimate the cost of a section.",
    ],
    [
      "Why does getUsed() return zero in the Simulation?",
      "The official Simulation environment does not provide meaningful CPU usage through getUsed(). Test on the real server or another environment that reports CPU.",
    ],
    [
      "Should low bucket stop spawning and defense?",
      "Not by default. Keep essential survival and state-maintenance work separate, then defer optional scans, analytics, or cache rebuilds.",
    ],
    [
      "Is one low CPU sample enough to prove an optimization?",
      "No. Inputs, global resets, path cache state, room count, hostiles, and garbage collection can change the result. Compare bounded samples across representative ticks.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-pathfinder-costmatrix",
    label: "Previous pathfinding guide",
    title: "Build a CostMatrix",
  },
  next: {
    href: "/en/blog/screeps-global-cache",
    label: "Next runtime guide",
    title: "Build a Disposable Global Cache",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Game.cpu.getUsed()</code> is cumulative within the current tick. Measure a section by recording a start value, running the section, and subtracting the start from the end. Treat <code>Game.cpu.limit</code> as the normal per-tick allowance, <code>Game.cpu.tickLimit</code> as the current hard ceiling, and <code>Game.cpu.bucket</code> as stored CPU capacity. The Simulation reports <code>0</code> for <code>getUsed()</code>, so it cannot prove real CPU cost.</p>

<h2 id="cpu-fields">Understand limit, tickLimit, bucket, and getUsed</h2>
<div class="table-scroll"><table>
<thead><tr><th>Field</th><th>Meaning</th><th>Do not confuse it with</th></tr></thead>
<tbody>
<tr><td><code>Game.cpu.getUsed()</code></td><td>Cumulative CPU consumed so far this tick</td><td>A section delta or a cross-tick average</td></tr>
<tr><td><code>Game.cpu.limit</code></td><td>Normal CPU allowance associated with your account</td><td>The maximum CPU available on every tick</td></tr>
<tr><td><code>Game.cpu.tickLimit</code></td><td>Current hard CPU ceiling for the tick</td><td>A target that should always be consumed</td></tr>
<tr><td><code>Game.cpu.bucket</code></td><td>Stored CPU reserve, capped at 10,000 in the official environment</td><td>Free CPU with no future cost</td></tr>
</tbody></table></div>
<p>When the bucket is full, the official environment can allow a <code>tickLimit</code> as high as 500. These values describe the runtime budget. They do not identify which function is expensive.</p>

<h2 id="measure-delta">Measure one code section</h2>
<pre><code class="language-javascript">function measureCpu(label, fn) {
  if (typeof fn !== 'function') {
    return {
      label,
      ok: false,
      cpu: null,
      value: null,
      error: 'function-required'
    };
  }

  const start = Game.cpu.getUsed();

  try {
    const value = fn();
    const end = Game.cpu.getUsed();

    return {
      label,
      ok: true,
      cpu: Math.max(0, end - start),
      value,
      error: null
    };
  } catch (error) {
    const end = Game.cpu.getUsed();

    return {
      label,
      ok: false,
      cpu: Math.max(0, end - start),
      value: null,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}</code></pre>
<p>The wrapper measures the function body plus wrapper overhead. Use the same harness before and after a change so the comparison remains consistent.</p>

<h2 id="simulation">Why the Simulation cannot validate CPU cost</h2>
<p>The official API states that <code>Game.cpu.getUsed()</code> always returns <code>0</code> in the Simulation. A zero delta there does not prove that pathfinding, sorting, JSON parsing, or room scans are free.</p>
<pre><code class="language-javascript">function canMeasureCpuHere() {
  const first = Game.cpu.getUsed();
  const second = Game.cpu.getUsed();

  return {
    first,
    second,
    measurementAvailable:
      Number.isFinite(first)
      && Number.isFinite(second)
      && (first !== 0 || second !== 0)
  };
}</code></pre>
<p>A real server tick can also produce a very small or zero-looking delta for a tiny section. The environment warning should be explicit rather than inferred from one call.</p>

<h2 id="samples">Collect bounded samples</h2>
<p><strong>State impact:</strong> this helper writes a bounded numeric history to Memory. It does not change game objects.</p>
<pre><code class="language-javascript">function recordCpuSample(name, value, limit = 100) {
  if (
    typeof name !== 'string'
    || !Number.isFinite(value)
    || !Number.isInteger(limit)
    || limit <= 0
  ) {
    return false;
  }

  Memory.cpuSamples ??= {};
  const samples = Array.isArray(
    Memory.cpuSamples[name]
  )
    ? Memory.cpuSamples[name]
    : [];

  samples.push({
    tick: Game.time,
    value
  });

  Memory.cpuSamples[name] = samples.slice(-limit);
  return true;
}</code></pre>
<p>Memory writes and serialization have their own cost. For frequent profiling, sample only selected ticks, use a short history, or aggregate statistics instead of storing every raw event.</p>

<h2 id="percentiles">Use averages and percentiles</h2>
<pre><code class="language-javascript">function summarizeNumbers(values) {
  const clean = values
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (clean.length === 0) {
    return null;
  }

  const percentile = ratio => {
    const index = Math.min(
      clean.length - 1,
      Math.max(
        0,
        Math.ceil(clean.length * ratio) - 1
      )
    );
    return clean[index];
  };

  const total = clean.reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    count: clean.length,
    average: total / clean.length,
    median: percentile(0.5),
    p95: percentile(0.95),
    maximum: clean[clean.length - 1]
  };
}</code></pre>
<p>An average hides rare expensive ticks. A p95 or maximum can reveal hostile scans, route rebuilds, cache misses, market refreshes, or global-reset reconstruction.</p>

<h2 id="bucket-policy">Use bucket bands as policy</h2>
<pre><code class="language-javascript">function classifyCpuBucket(bucket) {
  if (!Number.isFinite(bucket)) {
    return 'unknown';
  }

  if (bucket < 1000) {
    return 'critical';
  }

  if (bucket < 4000) {
    return 'conserve';
  }

  if (bucket > 9000) {
    return 'surplus';
  }

  return 'normal';
}</code></pre>
<p>The thresholds are example policy, not official recommendations. Choose them from your shard behavior and workload. Bucket bands decide whether optional work should run; they do not replace section-level measurements.</p>

<h2 id="complete-budget">Complete CPU budget controller</h2>
<p><strong>State impact:</strong> this controller reads CPU fields and writes a compact runtime summary. It may skip optional callbacks, but it does not skip the essential callback.</p>
<pre><code class="language-javascript">function classifyCpuBucket(bucket) {
  if (!Number.isFinite(bucket)) {
    return 'unknown';
  }

  if (bucket < 1000) return 'critical';
  if (bucket < 4000) return 'conserve';
  if (bucket > 9000) return 'surplus';
  return 'normal';
}

function runCpuBudgetedTick({
  essential,
  optional,
  reserveCpu = 2
}) {
  if (typeof essential !== 'function') {
    throw new TypeError('essential callback required');
  }

  const startedAt = Game.cpu.getUsed();
  const essentialResult = essential();
  const afterEssential = Game.cpu.getUsed();
  const bucketBand = classifyCpuBucket(
    Game.cpu.bucket
  );
  const remainingToHardLimit = Math.max(
    0,
    Game.cpu.tickLimit - afterEssential
  );
  const optionalAllowed =
    typeof optional === 'function'
    && bucketBand !== 'critical'
    && remainingToHardLimit > reserveCpu;

  let optionalResult = null;
  let optionalCpu = 0;

  if (optionalAllowed) {
    const optionalStart = Game.cpu.getUsed();
    optionalResult = optional();
    optionalCpu = Math.max(
      0,
      Game.cpu.getUsed() - optionalStart
    );
  }

  const finishedAt = Game.cpu.getUsed();
  const summary = {
    tick: Game.time,
    bucket: Game.cpu.bucket,
    bucketBand,
    limit: Game.cpu.limit,
    tickLimit: Game.cpu.tickLimit,
    essentialCpu: Math.max(
      0,
      afterEssential - startedAt
    ),
    optionalAllowed,
    optionalCpu,
    totalCpu: Math.max(0, finishedAt - startedAt)
  };

  Memory.cpuRuntime = summary;

  return {
    summary,
    essentialResult,
    optionalResult
  };
}</code></pre>
<p>A production controller should define which operations are essential before enabling a low-bucket mode. Defense, spawn recovery, source logistics, Controller safety, and required Memory cleanup usually need stronger guarantees than analytics or broad scans.</p>

<h2 id="essential-optional">Separate essential and optional work</h2>
<div class="table-scroll"><table>
<thead><tr><th>Class</th><th>Examples</th><th>Low-bucket behavior</th></tr></thead>
<tbody>
<tr><td>Essential</td><td>Defense, spawn recovery, core harvesting, Controller protection</td><td>Run with bounded algorithms</td></tr>
<tr><td>Deferred maintenance</td><td>Cache rebuild, route refresh, market scan</td><td>Run less often or in slices</td></tr>
<tr><td>Optional diagnostics</td><td>Detailed logs, visuals, analytics</td><td>Disable first</td></tr>
</tbody></table></div>
<p>The categories depend on the colony. A market deal can become essential during an energy emergency, while an ordinary market scan remains optional.</p>

<h2 id="early-stop">Stop before optional work exhausts the tick</h2>
<pre><code class="language-javascript">function hasCpuHeadroom(reserveCpu = 2) {
  if (!Number.isFinite(reserveCpu) || reserveCpu < 0) {
    return false;
  }

  return Game.cpu.getUsed()
    < Game.cpu.tickLimit - reserveCpu;
}

function runUntilBudget(items, worker, reserveCpu = 2) {
  let completed = 0;

  for (const item of items) {
    if (!hasCpuHeadroom(reserveCpu)) {
      break;
    }

    worker(item);
    completed += 1;
  }

  return completed;
}</code></pre>
<p>This guard reduces the chance that optional loops consume the hard ceiling. It does not make an individual worker safe; each iteration still needs bounded complexity and error isolation.</p>

<h2 id="measurement-noise">Reduce measurement noise</h2>
<ul>
<li>Compare the same room count and similar input size.</li>
<li>Separate global-reset ticks from warm-cache ticks.</li>
<li>Measure cache hits and misses independently.</li>
<li>Record pathfinding operations and result shape alongside CPU.</li>
<li>Limit logging during the measured section.</li>
<li>Use several samples and report p95 or maximum.</li>
<li>Measure the caller when optimization changes work distribution.</li>
</ul>
<p>Moving work to another tick or hiding it behind a cache can lower one function's delta while leaving total colony CPU unchanged. Track both section and whole-tick measurements.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the environment reports meaningful <code>getUsed()</code> values.</li>
<li>Subtract start from end; do not treat the cumulative end value as section cost.</li>
<li>Keep sample histories bounded.</li>
<li>Record representative input size.</li>
<li>Separate global-reset and warm-cache samples.</li>
<li>Check average, p95, and maximum.</li>
<li>Use bucket only as a scheduling signal.</li>
<li>Keep essential work outside optional low-bucket gates.</li>
<li>Reserve CPU before running optional loops.</li>
<li>Verify the complete tick, not only one optimized function.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not provide shard-specific benchmark numbers, a production profiler library, heap statistics, account CPU allocation advice, pixel generation policy, or a live bucket recovery experiment. Continue with <a href="/en/blog/screeps-global-cache">global cache design</a> to understand warm and reset CPU behavior.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is getUsed() a timer in milliseconds?</h3>
<p>Treat it as Screeps CPU usage reported by the runtime, not wall-clock duration.</p>
<h3>Can I optimize in the Simulation?</h3>
<p>You can test logic, but the Simulation's zero <code>getUsed()</code> result cannot validate real CPU cost.</p>
<h3>Should I always spend CPU when the bucket is high?</h3>
<p>No. A high bucket permits optional work, but the work should still have value and a bounded budget.</p>
<h3>What should be disabled first?</h3>
<p>Diagnostics, visuals, broad refreshes, and non-urgent analysis are safer candidates than survival logic.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.cpu" rel="nofollow">API Reference: Game.cpu</a></li>
<li><a href="https://docs.screeps.com/api/#Game.cpu.getUsed" rel="nofollow">API Reference: Game.cpu.getUsed()</a></li>
<li><a href="https://docs.screeps.com/cpu-limit.html" rel="nofollow">Screeps Documentation: CPU Limit</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game Loop</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
