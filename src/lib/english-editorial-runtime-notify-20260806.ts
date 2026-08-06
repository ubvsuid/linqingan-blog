import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishEditorialNotifyEvidenceFinalArticle20260805 } from "./english-editorial-notify-evidence-final-20260805";
import { englishEditorialRuntimeOverrides20260731 } from "./english-editorial-runtime-overrides-20260731";
import { englishCpuArticle } from "./english-runtime-cpu-8";

const UPDATED_AT = "2026-08-06";

function replaceSection(
  articleHtml: string,
  startId: string,
  endId: string,
  replacement: string,
): string {
  const startMarker = `<h2 id="${startId}">`;
  const endMarker = `<h2 id="${endId}">`;
  const start = articleHtml.indexOf(startMarker);
  const end = articleHtml.indexOf(endMarker, start + startMarker.length);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Cannot replace article section ${startId} -> ${endId}`);
  }

  return `${articleHtml.slice(0, start)}${replacement}\n${articleHtml.slice(end)}`;
}

function insertTocBefore(
  toc: Array<[string, string]>,
  beforeId: string,
  item: [string, string],
): Array<[string, string]> {
  const withoutDuplicate = toc.filter(([id]) => id !== item[0]);
  const index = withoutDuplicate.findIndex(([id]) => id === beforeId);

  if (index < 0) return [...withoutDuplicate, item];

  return [
    ...withoutDuplicate.slice(0, index),
    item,
    ...withoutDuplicate.slice(index),
  ];
}

const cpuSimulationSection = String.raw`<h2 id="simulation">Why two zero samples cannot identify the Simulation</h2>
<p>The official Simulation reports <code>0</code> from <code>Game.cpu.getUsed()</code>, so it cannot validate production CPU cost. The reverse inference is not valid: two zero readings do not prove that code is running in the Simulation. A tiny section can be below the useful resolution of one observation, and sampling the counter twice without representative work answers almost nothing.</p>
<pre><code class="language-javascript">function sampleCpuSection(label, work) {
  if (typeof work !== 'function') {
    return {
      status: 'function-required',
      label,
      value: null,
      start: null,
      end: null,
      delta: null
    };
  }

  const start = Game.cpu.getUsed();
  const value = work();
  const end = Game.cpu.getUsed();
  const delta = Math.max(0, end - start);

  return {
    status: start === 0 && end === 0
      ? 'zero-sample-inconclusive'
      : 'sample-recorded',
    label,
    value,
    start,
    end,
    delta
  };
}</code></pre>
<p>Use an environment you already know is a live server when measuring CPU. Record representative input size and collect several comparable ticks. Keep a zero sample as data; do not turn it into an environment detector or an optimization claim.</p>`;

const cpuIntentBoundary = String.raw`<h2 id="intent-boundary">Choose another guide when</h2>
<p>Use this page to measure a specific code path and protect hard-tick headroom. Use <a href="/en/blog/screeps-cpu-bucket-degradation">the bucket-degradation guide</a> when the problem is a colony-wide low-bucket state, optional-work shedding, or recovery policy. A bucket trend can explain scheduling pressure, but it does not identify which function consumed the CPU.</p>`;

let cpuHtml = replaceSection(
  englishCpuArticle.articleHtml,
  "simulation",
  "samples",
  cpuSimulationSection,
);
cpuHtml = replaceSection(
  cpuHtml,
  "faq",
  "official-docs",
  cpuIntentBoundary,
);

const cpuToc = insertTocBefore(
  englishCpuArticle.toc.filter(([id]) => id !== "faq"),
  "official-docs",
  ["intent-boundary", "Choose another guide when"],
);

const cpuArticle: EnglishBeginnerArticle = {
  ...englishCpuArticle,
  title: "Screeps CPU Profiling: Measure Code with Game.cpu.getUsed()",
  headline: "Measure Screeps CPU Without Treating Zero as an Environment Test",
  description:
    "Measure one code section with Game.cpu.getUsed() deltas, keep zero samples inconclusive, compare equivalent live-server ticks, and preserve hard-tick headroom before optional work.",
  category: "RUNTIME · CPU PROFILING AND TICK HEADROOM",
  readingTime: "13 min read",
  primaryKeyword: "Screeps Game.cpu.getUsed",
  searchIntent:
    "Measure a specific Screeps code path accurately without using zero samples or bucket thresholds as false performance evidence",
  finalScore: 98,
  verification: [
    ["Official documentation", "Checked — getUsed() is cumulative for the current tick and returns 0 in the Simulation"],
    ["Technical correction", "Two zero samples are now treated as inconclusive instead of an environment detector"],
    ["Static code review", "Passed — invalid callback, cumulative samples, non-negative delta and explicit zero-sample state"],
    ["Evidence level", "Official documentation review, repository review, JavaScript syntax review and offline boundary analysis"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Representative live-server CPU sample set", "Pending"],
    ["Last editorial review", "August 6, 2026"],
  ],
  toc: cpuToc,
  faq: [],
  articleHtml: cpuHtml,
};

const segmentsBase =
  englishEditorialRuntimeOverrides20260731["screeps-rawmemory-segments"];

const segmentManagerSection = String.raw`<h2 id="activation-manager">Collect requests and finalize exactly once</h2>
<pre><code class="language-javascript">function getSegmentCoordinator() {
  global.segmentCoordinator ??= {
    requested: new Map(),
    finalizedAt: null,
    plan: null
  };

  return global.segmentCoordinator;
}

function requestSegment(id, priority = 0) {
  const coordinator = getSegmentCoordinator();

  if (coordinator.finalizedAt === Game.time) {
    return {
      accepted: false,
      status: 'activation-already-finalized'
    };
  }

  if (
    !Number.isInteger(id)
    || id < 0
    || id > 99
    || !Number.isFinite(priority)
  ) {
    return {
      accepted: false,
      status: 'segment-request-invalid'
    };
  }

  const previous = coordinator.requested.get(id);
  coordinator.requested.set(
    id,
    previous === undefined
      ? priority
      : Math.max(previous, priority)
  );

  return {
    accepted: true,
    status: 'segment-requested'
  };
}

function finalizeSegmentRequests() {
  const coordinator = getSegmentCoordinator();

  if (coordinator.finalizedAt === Game.time) {
    return {
      status: 'activation-already-finalized',
      ...coordinator.plan
    };
  }

  const ranked = [...coordinator.requested.entries()]
    .sort(
      (a, b) => b[1] - a[1] || a[0] - b[0]
    );
  const activeNextTick = ranked
    .slice(0, 10)
    .map(([id]) => id);
  const deferred = ranked
    .slice(10)
    .map(([id]) => id);

  RawMemory.setActiveSegments(activeNextTick);

  coordinator.finalizedAt = Game.time;
  coordinator.plan = {
    activeNextTick,
    deferred
  };
  coordinator.requested.clear();

  return {
    status: 'activation-scheduled',
    ...coordinator.plan
  };
}</code></pre>
<p>The same-tick guard prevents an accidental second finalizer from replacing a valid activation plan with an empty or partial set. It also rejects requests that arrive after finalization, making module-order mistakes visible. This guard cannot protect calls that bypass the coordinator and invoke <code>RawMemory.setActiveSegments()</code> directly.</p>`;

const segmentWorkflowSection = String.raw`<h2 id="complete-workflow">Minimal read, merge, write workflow</h2>
<pre><code class="language-javascript">function updateIntelSegment() {
  const segmentId = 7;
  const version = 1;
  const request = requestSegment(segmentId, 100);

  if (!request.accepted) {
    return { status: request.status };
  }

  const current = readSegment(segmentId, version);

  if (
    current.status !== 'ready'
    && current.status !== 'empty'
  ) {
    return { status: current.status };
  }

  const nextData = {
    ...current.data,
    lastSeenTick: Game.time
  };

  return writeSegment(
    segmentId,
    version,
    nextData
  );
}

function runSegmentTick() {
  const update = updateIntelSegment();
  const activation = finalizeSegmentRequests();

  return { update, activation };
}</code></pre>
<p>On the first tick, <code>updateIntelSegment()</code> commonly returns <code>unavailable</code> while the finalizer schedules Segment 7. On a later tick it can read and replace the active string. In a larger loop, let every feature request its IDs first and call <code>finalizeSegmentRequests()</code> once at the end of the tick.</p>`;

let segmentsHtml = replaceSection(
  segmentsBase.articleHtml,
  "activation-manager",
  "read-payload",
  segmentManagerSection,
);
segmentsHtml = replaceSection(
  segmentsHtml,
  "complete-workflow",
  "production-notes",
  segmentWorkflowSection,
);

const segmentsArticle: EnglishBeginnerArticle = {
  ...segmentsBase,
  description:
    "Coordinate Segment requests, finalize activation once per tick, reject late requests, read data on a later tick, distinguish unavailable from empty, and write only after validation.",
  readingTime: "14 min read",
  finalScore: 98,
  verification: [
    ["Official documentation", "Checked — IDs 0–99, up to 10 active, later-tick activation and last-call replacement behavior"],
    ["Technical correction", "The coordinator now rejects late requests and makes repeated same-tick finalization idempotent"],
    ["Static code review", "Passed — invalid IDs, priority merge, 10-ID cap, deferred set, late request and repeated-finalize states"],
    ["Evidence level", "Official documentation review, repository review, JavaScript syntax review and offline lifecycle analysis"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Live Segment activation, persistence and competing-module test", "Pending"],
    ["Last editorial review", "August 6, 2026"],
  ],
  articleHtml: segmentsHtml,
};

const notifyBase = englishEditorialNotifyEvidenceFinalArticle20260805;

const notifyIdentitySection = String.raw`<h2 id="revision-identity">Bind one payload revision, but do not treat its digest as authorization</h2>
<p>The fingerprint below is useful for detecting accidental payload drift inside your own code. It is not cryptographic, collision-resistant, secret, or proof that a human approved the message. Any module that can write the request can also recompute the fingerprint. Use it as an integrity label, not a security boundary.</p>
<pre><code class="language-javascript">function hashNotificationPayload(value) {
  let hash = 2166136261;

  for (let index = 0; index &lt; value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash &gt;&gt;&gt; 0)
    .toString(16)
    .padStart(8, '0');
}

function buildNotificationPayloadDigest(request) {
  return hashNotificationPayload([
    request.requestId,
    request.revision,
    request.incidentKey,
    request.message,
    request.groupInterval
  ].join('\u001f'));
}

function buildNotificationConfirmation(request) {
  return [
    'SUBMIT_NOTIFICATION',
    request.requestId,
    request.revision,
    buildNotificationPayloadDigest(request)
  ].join('_');
}</code></pre>
<pre><code class="language-javascript">Memory.notificationRequests ??= {};

const request = {
  requestId: 'spawn-energy-low',
  revision: 3,
  incidentKey: 'W1N1:spawn-energy-low',
  enabled: true,
  priority: 80,
  message: '[W1N1] Spawn energy remains below 200.',
  groupInterval: 30,
  createdAt: Game.time,
  expiresAt: Game.time + 25
};

request.confirmation =
  buildNotificationConfirmation(request);
Memory.notificationRequests[request.requestId] = request;</code></pre>
<p>The executable example binds the stored confirmation to the exact fields used by the dispatcher. A changed message, incident, grouping interval, or revision invalidates the old fingerprint. For privileged or externally supplied alerts, add a real trust policy outside this checksum.</p>`;

const notifyHtml = replaceSection(
  notifyBase.articleHtml,
  "revision-identity",
  "queue-update",
  notifyIdentitySection,
);

const notifyArticle: EnglishBeginnerArticle = {
  ...notifyBase,
  description:
    "Bind each notification to one immutable request revision and integrity fingerprint, reserve shared call slots, record the Game.notify return code locally, and keep external delivery unverified.",
  readingTime: "21 min read",
  finalScore: 98,
  verification: [
    ...notifyBase.verification.slice(0, 3),
    ["Digest boundary", "Checked — the payload digest is an integrity fingerprint, not cryptographic authorization or human approval"],
    ...notifyBase.verification.slice(3).filter(([label]) => label !== "Last verified"),
    ["Last editorial review", "August 6, 2026"],
  ],
  articleHtml: notifyHtml,
};

export const englishEditorialRuntimeNotifyOverrides20260806: Record<
  string,
  EnglishBeginnerArticle
> = {
  [cpuArticle.slug]: cpuArticle,
  [segmentsArticle.slug]: segmentsArticle,
  [notifyArticle.slug]: notifyArticle,
};

export const englishEditorialRuntimeNotifyUpdatedAt20260806: Record<string, string> = {
  [cpuArticle.slug]: UPDATED_AT,
  [segmentsArticle.slug]: UPDATED_AT,
  [notifyArticle.slug]: UPDATED_AT,
};

export function getEnglishEditorialRuntimeNotifyArticle20260806(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishEditorialRuntimeNotifyOverrides20260806[slug];
}

export function getEnglishEditorialRuntimeNotifyUpdatedAt20260806(
  slug: string,
): string | undefined {
  return englishEditorialRuntimeNotifyUpdatedAt20260806[slug];
}
