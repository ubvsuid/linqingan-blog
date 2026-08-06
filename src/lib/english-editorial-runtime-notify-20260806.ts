import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { getEnglishEditorialCorePublished20260731 } from "./english-editorial-core-published-20260731";
import { englishEditorialNotifyEvidenceFinalArticle20260805 } from "./english-editorial-notify-evidence-final-20260805";
import { englishEditorialRuntimeOverrides20260731 } from "./english-editorial-runtime-overrides-20260731";

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

function preserveVerificationWithUpdates(
  verification: Array<[string, string]>,
  updates: Array<[string, string]>,
): Array<[string, string]> {
  const replacedLabels = new Set([
    "Evidence level",
    "Last verified",
    "Last editorial review",
    ...updates.map(([label]) => label),
  ]);

  return [
    ...verification.filter(([label]) => !replacedLabels.has(label)),
    ...updates,
    ["Last editorial review", "August 6, 2026"],
  ];
}

const cpuBase = getEnglishEditorialCorePublished20260731(
  "screeps-cpu-getused-bucket",
);
if (!cpuBase) {
  throw new Error("Published CPU editorial base is missing.");
}

const cpuMentalModelSection = String.raw`<h2 id="mental-model">getUsed() is cumulative within the current tick</h2>
<p><code>Game.cpu.getUsed()</code> reports CPU consumed from the beginning of the current tick. A section cost is the end reading minus the start reading. The Simulation always reports <code>0</code>, so it cannot validate production CPU cost. The reverse inference is not valid: two zero readings do not prove that the code is running in the Simulation. A very small section can also produce a zero sample at the useful resolution of one observation.</p>
<div class="table-scroll"><table>
<thead><tr><th>Field</th><th>Use it for</th><th>Do not treat it as</th></tr></thead>
<tbody>
<tr><td><code>Game.cpu.getUsed()</code></td><td>Current-tick cumulative usage</td><td>A cross-tick average or environment detector</td></tr>
<tr><td><code>Game.cpu.limit</code></td><td>Normal account allowance</td><td>The hard ceiling for every tick</td></tr>
<tr><td><code>Game.cpu.tickLimit</code></td><td>Current hard ceiling</td><td>A target to consume</td></tr>
<tr><td><code>Game.cpu.bucket</code></td><td>Stored rollover capacity</td><td>A profiler that identifies expensive code</td></tr>
</tbody></table></div>`;

const cpuMinimalProbeSection = String.raw`<h2 id="minimal-probe">Minimal function-level probe</h2>
<pre><code class="language-javascript">function measureCpu(label, fn) {
  if (typeof fn !== 'function') {
    return {
      status: 'function-required',
      label,
      tick: Game.time,
      value: null,
      start: null,
      end: null,
      cpu: null
    };
  }

  const start = Game.cpu.getUsed();
  const value = fn();
  const end = Game.cpu.getUsed();
  const cpu = Math.max(0, end - start);

  return {
    status: start === 0 && end === 0
      ? 'zero-sample-inconclusive'
      : 'sample-recorded',
    label,
    tick: Game.time,
    value,
    start,
    end,
    cpu
  };
}</code></pre>
<p>The result includes the callback and a small amount of wrapper overhead. Use the same harness before and after a change. Do not place verbose logging inside the measured callback because formatting and Console output become part of the measurement. Keep a zero result as data, but do not convert it into a Simulation claim or an optimization claim.</p>`;

const cpuChoiceSection = String.raw`<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-cpu-bucket-degradation">the bucket-degradation guide</a> when the problem is colony-wide low-bucket behavior, optional-work shedding, or recovery policy. Use <a href="/en/blog/screeps-global-cache">the global-cache guide</a> when repeated computation is the problem. Use <a href="/en/blog/screeps-rawmemory-segments">the Segments guide</a> when durable profiling data is too large for ordinary Memory. Use the current page only to establish a trustworthy section measurement and a bounded optional-work guard.</p>`;

let cpuHtml = replaceSection(
  cpuBase.articleHtml,
  "mental-model",
  "minimal-probe",
  cpuMentalModelSection,
);
cpuHtml = replaceSection(
  cpuHtml,
  "minimal-probe",
  "representative-input",
  cpuMinimalProbeSection,
);
cpuHtml = replaceSection(
  cpuHtml,
  "choose-another-guide",
  "official-docs",
  cpuChoiceSection,
);

const cpuArticle: EnglishBeginnerArticle = {
  ...cpuBase,
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
  verification: preserveVerificationWithUpdates(cpuBase.verification, [
    [
      "Technical correction",
      "Checked — two zero readings remain inconclusive instead of identifying the runtime environment",
    ],
    [
      "Static code review",
      "Passed — invalid callback, cumulative readings, non-negative delta, explicit zero-sample state, bounded heap samples and hard-tick guard",
    ],
    [
      "Evidence level",
      "Official documentation review, repository review, JavaScript syntax review and static analysis only",
    ],
  ]),
  articleHtml: cpuHtml,
};

const segmentsBase =
  englishEditorialRuntimeOverrides20260731["screeps-rawmemory-segments"];
if (!segmentsBase) {
  throw new Error("Published RawMemory Segments editorial base is missing.");
}

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
<p>On the first tick, <code>updateIntelSegment()</code> commonly returns <code>segment-unavailable</code> while the finalizer schedules Segment 7. On a later tick it can read and replace the active string. In a larger loop, let every feature request its IDs first and call <code>finalizeSegmentRequests()</code> once at the end of the tick.</p>`;

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
  verification: preserveVerificationWithUpdates(segmentsBase.verification, [
    [
      "Technical correction",
      "Checked — the coordinator rejects late requests and makes repeated same-tick finalization idempotent",
    ],
    [
      "Static code review",
      "Passed — invalid IDs, priority merge, 10-ID cap, deferred set, unavailable state, late request and repeated-finalize states",
    ],
    [
      "Evidence level",
      "Official documentation review, repository review, JavaScript syntax review and static lifecycle analysis only",
    ],
  ]),
  articleHtml: segmentsHtml,
};

const notifyBase = englishEditorialNotifyEvidenceFinalArticle20260805;

const notifyIdentitySection = String.raw`<h2 id="revision-identity">Bind one payload revision, but do not treat its digest as authorization</h2>
<p>The fingerprint below is useful for detecting accidental payload drift inside your own code. It is not cryptographic, collision-resistant, secret, or proof that a human approved the message. Any module that can write the request can also recompute the fingerprint. Use it as an integrity label, not a security boundary.</p>
<pre><code class="language-javascript">function hashNotificationPayload(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0)
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
    "Bind each notification to one immutable request revision and integrity fingerprint, reserve shared call slots, record local submission at the Game.notify call site, and keep external delivery unverified.",
  readingTime: "21 min read",
  finalScore: 98,
  verification: preserveVerificationWithUpdates(notifyBase.verification, [
    [
      "Digest boundary",
      "Checked — the payload digest is an integrity fingerprint, not cryptographic authorization or human approval",
    ],
    [
      "Evidence level",
      "Official API review, repository review, JavaScript syntax review and static analysis only",
    ],
  ]),
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
