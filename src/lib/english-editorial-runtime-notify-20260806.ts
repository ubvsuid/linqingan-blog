import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { getEnglishEditorialCorePublished20260731 } from "./english-editorial-core-published-20260731";
import { englishEditorialNotifyEvidenceFinalArticle20260805 } from "./english-editorial-notify-evidence-final-20260805";
import { englishEditorialRuntimeOverrides20260731 } from "./english-editorial-runtime-overrides-20260731";

const UPDATED_AT = "2026-08-06";
const NOTIFY_UPDATED_AT = "2026-08-30";

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

const notifyHtml = String.raw`
<h2 id="quick-answer">Send one notification first</h2>
<p><code>Game.notify(message, groupInterval)</code> sends a custom notification to the email channel configured for your Screeps profile. Start with one small call, then add rate limiting only when the condition can stay true across many ticks.</p>
<pre><code class="language-javascript">const result = Game.notify(
  'A Screeps condition needs attention.',
  30
);

console.log(result);</code></pre>
<p>The official API documents a maximum message length of 1,000 characters, up to 20 notification calls in one game tick, and no availability in the Simulation Room. A <code>groupInterval</code> of <code>0</code> schedules immediately; a positive value groups notifications using that many minutes.</p>
<p>The public API page does not currently document a return-code table for <code>Game.notify()</code>. In the checked <code>screeps/engine</code> snapshot <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>, the method returns <code>OK</code> when the notification intent enters the per-tick queue and <code>ERR_FULL</code> when that 20-intent queue is full. Treat that return-code detail as an engine implementation boundary, not as a stronger API promise than the documentation makes.</p>

<h2 id="limits">Know the two different rate controls</h2>
<div class="table-scroll"><table>
<thead><tr><th>Control</th><th>What it does</th><th>What it does not do</th></tr></thead>
<tbody>
<tr><td>20 calls per tick</td><td>Official per-tick scheduling limit.</td><td>It does not stop one persistent condition from calling again on every later tick.</td></tr>
<tr><td><code>groupInterval</code></td><td>Groups email notifications over a number of minutes.</td><td>It is not a replacement for deciding when your script should call <code>Game.notify()</code>.</td></tr>
<tr><td>Memory incident state</td><td>Project policy that suppresses repeated calls for the same unresolved condition.</td><td>It is not an official Screeps notification limit.</td></tr>
</tbody></table></div>
<p>For most alerts, the useful pattern is: call once when the condition becomes active, stay quiet while it remains active, and allow a new notification after the condition clears. Add a repeat interval only when repeated reminders are genuinely useful.</p>

<h2 id="minimal-wrapper">Preserve the call result</h2>
<pre><code class="language-javascript">function sendNotification(message, groupInterval = 0) {
  if (
    typeof message !== 'string'
    || message.length === 0
    || message.length &gt; 1000
  ) {
    return { status: 'invalid-message' };
  }
  if (!Number.isFinite(groupInterval) || groupInterval &lt; 0) {
    return { status: 'invalid-group-interval' };
  }

  const result = Game.notify(message, groupInterval);
  return {
    status: result === OK
      ? 'notification-scheduled'
      : 'notification-not-scheduled',
    result
  };
}</code></pre>
<p>The length and non-negative interval checks are local guardrails around the documented parameters. The <code>result === OK</code> branch follows the checked engine behavior above. Preserve the raw result instead of turning every normal return into “delivered.”</p>

<h2 id="incident-state">Notify once per incident instead of once per tick</h2>
<p>The helper below stores only the state needed for a recurring condition. <code>active</code> comes from your own alert rule. When the condition clears, the incident resets. A positive <code>repeatAfterTicks</code> is an optional project policy for reminders; it is measured in game ticks and is separate from the email-oriented <code>groupInterval</code> minutes.</p>
<pre><code class="language-javascript">function notifyIncident({
  key,
  active,
  message,
  groupInterval = 0,
  repeatAfterTicks = null
}) {
  if (typeof key !== 'string' || key.length === 0) {
    return { status: 'invalid-incident-key' };
  }

  Memory.notificationIncidents ??= {};
  const state = Memory.notificationIncidents[key] ??= {
    active: false,
    lastScheduledAt: null,
    lastResult: null
  };

  if (!active) {
    state.active = false;
    return { status: 'incident-clear' };
  }

  const repeatDue = Number.isInteger(repeatAfterTicks)
    &amp;&amp; repeatAfterTicks &gt; 0
    &amp;&amp; Number.isInteger(state.lastScheduledAt)
    &amp;&amp; Game.time - state.lastScheduledAt &gt;= repeatAfterTicks;

  if (state.active &amp;&amp; !repeatDue) {
    return { status: 'already-reported' };
  }

  const submission = sendNotification(message, groupInterval);
  state.lastResult = submission.result ?? null;

  if (submission.status === 'notification-scheduled') {
    state.active = true;
    state.lastScheduledAt = Game.time;
  }

  return submission;
}</code></pre>
<p>Do not copy a made-up room name or threshold into production. Pass a stable incident key, the condition you already calculated, and a message built from the real object or room you are monitoring. If the checked engine returns <code>ERR_FULL</code>, this helper leaves the incident eligible for a later retry instead of marking it as reported.</p>

<h2 id="result-boundary">Scheduled is not externally delivered</h2>
<p>Keep the evidence levels separate:</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>What it supports</th><th>What it does not prove</th></tr></thead>
<tbody>
<tr><td>Your condition became true</td><td>The local alert rule fired.</td><td>That <code>Game.notify()</code> was called.</td></tr>
<tr><td>Checked engine returns <code>OK</code></td><td>The notify intent entered the engine's per-tick queue.</td><td>That an external email arrived.</td></tr>
<tr><td>Checked engine returns <code>ERR_FULL</code></td><td>The checked per-tick notify queue was full.</td><td>That the message will be retried automatically.</td></tr>
<tr><td>Email or external inbox observation</td><td>External delivery evidence for that environment.</td><td>A general timing guarantee for every future notification.</td></tr>
</tbody></table></div>
<p><code>groupInterval</code> can intentionally delay grouped mail. Game code has no documented inbox receipt, so do not name a Memory state <code>delivered</code> merely because the local call was accepted.</p>

<h2 id="shared-budget">Optional hardening for many notification producers</h2>
<p>If several modules can notify in the same tick, give them one shared local budget instead of letting every module assume it owns all 20 official slots. A production bot can choose a smaller local limit to reserve headroom.</p>
<pre><code class="language-javascript">function createNotificationBudget(maximumCalls = 20) {
  const limit = Math.min(
    20,
    Math.max(0, Number.isInteger(maximumCalls)
      ? maximumCalls
      : 20)
  );
  let scheduled = 0;

  return {
    send(message, groupInterval = 0) {
      if (scheduled &gt;= limit) {
        return { status: 'local-budget-exhausted' };
      }

      const submission = sendNotification(message, groupInterval);
      if (submission.status === 'notification-scheduled') {
        scheduled += 1;
      }
      return submission;
    },
    getScheduledCount() {
      return scheduled;
    }
  };
}</code></pre>
<p>Create one budget object for the tick and route notification-producing modules through it. This is a project coordinator, not an extra Screeps API rule. Payload signing, approval workflows, revision ledgers, and external alert-service guarantees belong in a separate operations system when your threat model actually requires them.</p>

<h2 id="common-mistakes">Common mistakes</h2>
<ul>
<li><strong>Calling every tick while a condition stays true:</strong> use incident state so one unresolved condition does not keep scheduling calls.</li>
<li><strong>Treating <code>groupInterval</code> as a script-side cooldown:</strong> it controls email grouping in minutes; your own Memory state controls whether you call again.</li>
<li><strong>Claiming delivery from a local result:</strong> accepted scheduling and external email observation are different evidence levels.</li>
<li><strong>Testing in the Simulation Room:</strong> the official API says <code>Game.notify()</code> is not available there.</li>
<li><strong>Scattered per-module call counting:</strong> use one shared coordinator when many producers can notify in the same tick.</li>
<li><strong>Overengineering a single alert:</strong> start with one call and one incident flag; add queues or richer identity only when the system actually needs them.</li>
</ul>

<h2 id="evidence">Evidence and production boundary</h2>
<p>The current article was checked against the official <code>Game.notify()</code> API and the public <code>screeps/engine</code> snapshot <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>. The three JavaScript examples were syntax-checked offline. No real Screeps Console notification, 20-call saturation run, grouped-email timing trace, or inbox-delivery observation is claimed.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.notify" rel="nofollow noopener noreferrer">Screeps API: Game.notify()</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Screeps Documentation: Global Objects and Memory</a></li>
</ul>
`;

const notifyArticle: EnglishBeginnerArticle = {
  ...notifyBase,
  title: "Screeps Game.notify(): Send Rate-Limited Alerts Safely",
  headline: "Send Screeps Notifications Without Spamming Every Tick",
  description:
    "Call Game.notify(), use groupInterval and simple Memory incident state to avoid repeated alerts, preserve the checked engine result, and keep scheduling separate from external email delivery.",
  category: "OBSERVABILITY · RATE-LIMITED NOTIFICATIONS",
  readingTime: "11 min read",
  primaryKeyword: "Screeps Game.notify",
  searchIntent:
    "Send a Screeps notification for a recurring game condition without calling every tick or claiming that local scheduling proves external email delivery",
  finalScore: 98,
  keywords: [
    "Screeps Game.notify",
    "Screeps email notification",
    "Game.notify groupInterval",
    "Screeps notification rate limit",
    "Screeps 20 notifications per tick",
  ],
  toc: [
    ["quick-answer", "Send one notification first"],
    ["limits", "Know the two rate controls"],
    ["minimal-wrapper", "Preserve the call result"],
    ["incident-state", "Notify once per incident"],
    ["result-boundary", "Scheduled is not externally delivered"],
    ["shared-budget", "Optional shared call budget"],
    ["common-mistakes", "Common mistakes"],
    ["evidence", "Evidence and production boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official API",
      "Checked August 30, 2026 — Game.notify message limit, 20 calls per tick, Simulation boundary, and groupInterval minutes",
    ],
    [
      "Public engine source",
      "Checked screeps/engine 80977824199a596d174d392fd0cf8c458c21fcbd — notify intent queue cap 20 with current OK / ERR_FULL results",
    ],
    ["JavaScript syntax", "Passed — 3/3 article examples"],
    [
      "Evidence boundary",
      "Checked — local scheduling is not described as external email delivery",
    ],
    ["Screeps Console test", "Pending"],
    ["Live grouped-email and 20-call saturation test", "Pending"],
    ["External inbox delivery observation", "Pending"],
    [
      "Evidence level",
      "Official documentation review, public engine-source review, repository review, and offline JavaScript syntax only",
    ],
    ["Last editorial review", "August 30, 2026"],
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
  [notifyArticle.slug]: NOTIFY_UPDATED_AT,
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
