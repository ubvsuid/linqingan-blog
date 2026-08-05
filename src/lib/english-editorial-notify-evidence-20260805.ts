import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishNotifyArticle } from "./english-observability-notify-9";

export const englishEditorialNotifyEvidenceArticle20260805: EnglishBeginnerArticle = {
  ...englishNotifyArticle,
  title: "Screeps Game.notify(): Bind Alert Payload Identity Before Submission",
  headline: "Submit One Immutable Alert Revision Without Claiming Email Delivery",
  description:
    "Bind each notification to an exact request revision and payload digest, reserve one incident per tick, record local submission only at the Game.notify call site, and keep external delivery unverified.",
  category: "OBSERVABILITY · NOTIFICATION REVISION IDENTITY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  updatedAt: "2026-08-05",
  readingTime: "20 min read",
  primaryKeyword: "Screeps Game.notify payload identity",
  searchIntent:
    "Queue and submit one exact Screeps notification revision without stale payload approval, duplicate incident submission, or false delivery claims",
  finalScore: 98,
  keywords: [
    "Screeps Game.notify payload identity",
    "Screeps notification revision",
    "Game.notify 20 per tick",
    "Game.notify groupInterval minutes",
    "Screeps notification submitted vs delivered",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official API",
      "Checked — Game.notify accepts a message up to 1000 characters, an optional grouping interval in minutes, and schedules at most 20 notifications in one game tick",
    ],
    [
      "Evidence boundary",
      "Checked — the API documents scheduling but provides no external email-delivery receipt to game code",
    ],
    [
      "Static code review",
      "Passed — immutable request revision, payload digest, target-bound confirmation, incident reservation, call-site submission record, expiry and supersession states",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live 20-call cap, grouping, supersession, expiry and external delivery observation",
      "Pending",
    ],
    ["Genuine Console or inbox screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Separate scheduling from delivery"],
    ["revision-identity", "Bind one immutable payload revision"],
    ["queue-update", "Supersede instead of mutating approval"],
    ["preflight", "Validate the exact current revision"],
    ["coordinate", "Reserve incidents and call slots"],
    ["submit", "Record only local submission"],
    ["cooldown", "Start cooldowns at the call site"],
    ["failure-states", "Keep stale and deferred states visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Separate scheduling from delivery</h2>
<p><code>Game.notify(message, groupInterval)</code> schedules a notification for the account email channel. The official API limits the message to 1,000 characters and allows at most 20 notification calls in one game tick. A positive <code>groupInterval</code> is measured in minutes and may delay grouping.</p>
<p>The method does not give game code an external inbox receipt. Your script can prove that it reached one exact call site with one exact payload. It cannot prove that an email provider accepted, displayed, or delivered the message. Keep those states separate:</p>
<div class="table-scroll"><table>
<thead><tr><th>State</th><th>What it proves</th></tr></thead>
<tbody>
<tr><td><code>detected</code></td><td>A local condition matched.</td></tr>
<tr><td><code>queued</code></td><td>An exact alert revision is waiting for a call slot.</td></tr>
<tr><td><code>submitted-locally</code></td><td>The dispatcher invoked <code>Game.notify()</code> with that revision.</td></tr>
<tr><td><code>delivered-externally</code></td><td>Requires evidence outside game code and remains unverified here.</td></tr>
</tbody></table></div>

<h2 id="revision-identity">Bind one immutable payload revision</h2>
<pre><code class="language-javascript">function hashNotificationPayload(value) {
  let hash = 2166136261;

  for (let index = 0; index &lt; value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash &gt;&gt;&gt; 0).toString(16).padStart(8, '0');
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

Memory.notificationRequests['spawn-energy-low'] = {
  requestId: 'spawn-energy-low',
  revision: 3,
  incidentKey: 'W1N1:spawn-energy-low',
  enabled: true,
  priority: 80,
  message: '[W1N1] Spawn energy remains below 200.',
  groupInterval: 30,
  createdAt: Game.time,
  expiresAt: Game.time + 25,
  confirmation:
    'SUBMIT_NOTIFICATION_spawn-energy-low_3_' +
    'replace-with-current-payload-digest'
};</code></pre>
<p>The revision and digest make the approved payload explicit. Reusing the same key while silently changing the message, incident, grouping interval, or revision invalidates the old confirmation.</p>

<h2 id="queue-update">Supersede instead of mutating approval</h2>
<pre><code class="language-javascript">function supersedeNotificationRequest(
  requestId,
  nextPayload
) {
  Memory.notificationRequests ??= {};
  const current = Memory.notificationRequests[requestId];

  const revision = Number.isInteger(current?.revision)
    ? current.revision + 1
    : 1;

  const next = {
    requestId,
    revision,
    incidentKey: nextPayload.incidentKey,
    enabled: true,
    priority: nextPayload.priority,
    message: nextPayload.message,
    groupInterval: nextPayload.groupInterval,
    createdAt: Game.time,
    expiresAt: nextPayload.expiresAt
  };

  next.confirmation = buildNotificationConfirmation(next);
  Memory.notificationRequests[requestId] = next;

  return {
    status: current
      ? 'previous-revision-superseded'
      : 'first-revision-created',
    requestId,
    revision,
    payloadDigest: buildNotificationPayloadDigest(next)
  };
}</code></pre>
<p>A new observation may justify a new message, but it should create a new revision. Do not preserve an old <code>createdAt</code>, expiry, or confirmation while replacing the payload underneath it.</p>

<h2 id="preflight">Validate the exact current revision</h2>
<pre><code class="language-javascript">function evaluateNotificationRequest(request) {
  if (!request || request.enabled !== true) {
    return { ready: false, status: 'request-disabled' };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
    || !Number.isInteger(request.revision)
    || request.revision &lt; 1
    || typeof request.incidentKey !== 'string'
    || request.incidentKey.length === 0
    || typeof request.message !== 'string'
    || request.message.length === 0
    || request.message.length &gt; 1000
    || !Number.isFinite(request.groupInterval)
    || request.groupInterval &lt; 0
    || !Number.isInteger(request.createdAt)
    || !Number.isInteger(request.expiresAt)
  ) {
    return { ready: false, status: 'request-invalid' };
  }

  if (request.confirmation !== buildNotificationConfirmation(request)) {
    return { ready: false, status: 'payload-confirmation-mismatch' };
  }

  if (Game.time &gt; request.expiresAt) {
    return { ready: false, status: 'request-expired' };
  }

  return {
    ready: true,
    status: 'notification-ready',
    payloadDigest: buildNotificationPayloadDigest(request)
  };
}</code></pre>
<p>Expiry is checked against the exact revision. An expired high-priority message must not consume a call slot merely because its request key still exists.</p>

<h2 id="coordinate">Reserve incidents and call slots</h2>
<pre><code class="language-javascript">function createNotificationDispatcher(maximumCalls = 20) {
  const callLimit = Math.min(
    20,
    Math.max(0, Number.isInteger(maximumCalls)
      ? maximumCalls
      : 20)
  );
  const reservedIncidents = new Set();
  const reservedRevisions = new Set();
  let callsUsed = 0;

  return {
    reserve(request) {
      const revisionKey = [
        request.requestId,
        request.revision
      ].join(':');

      if (callsUsed &gt;= callLimit) {
        return { ready: false, status: 'call-limit-reached' };
      }
      if (reservedIncidents.has(request.incidentKey)) {
        return { ready: false, status: 'incident-already-reserved' };
      }
      if (reservedRevisions.has(revisionKey)) {
        return { ready: false, status: 'revision-already-reserved' };
      }

      reservedIncidents.add(request.incidentKey);
      reservedRevisions.add(revisionKey);
      callsUsed += 1;

      return {
        ready: true,
        status: 'notification-slot-reserved',
        callNumber: callsUsed
      };
    },
    release(request) {
      reservedIncidents.delete(request.incidentKey);
      reservedRevisions.delete([
        request.requestId,
        request.revision
      ].join(':'));
      callsUsed = Math.max(0, callsUsed - 1);
    },
    getCallsUsed() {
      return callsUsed;
    }
  };
}</code></pre>
<p>Use one shared dispatcher for the tick. Twenty independent modules that each think they are making their first call do not provide a global call cap.</p>

<h2 id="submit">Record only local submission</h2>
<pre><code class="language-javascript">function submitNotificationRevision(
  dispatcher,
  requestId
) {
  const request =
    Memory.notificationRequests?.[requestId];

  if (!request || request.requestId !== requestId) {
    return { status: 'request-identity-mismatch' };
  }

  const decision = evaluateNotificationRequest(request);
  if (!decision.ready) return decision;

  const reservation = dispatcher.reserve(request);
  if (!reservation.ready) return reservation;

  request.enabled = false;
  request.lastAttemptAt = Game.time;

  try {
    Game.notify(
      request.message,
      request.groupInterval
    );
  } catch (error) {
    dispatcher.release(request);
    request.status = 'notification-call-threw-review-required';
    request.lastError = error instanceof Error
      ? error.message
      : String(error);
    return { status: request.status };
  }

  Memory.notificationSubmissions ??= {};
  const submissionId = [
    request.requestId,
    request.revision,
    Game.time
  ].join(':');

  Memory.notificationSubmissions[submissionId] = {
    submissionId,
    submittedAt: Game.time,
    requestId: request.requestId,
    revision: request.revision,
    incidentKey: request.incidentKey,
    payloadDigest: decision.payloadDigest,
    messageLength: request.message.length,
    groupInterval: request.groupInterval,
    evidence: 'local-call-site-only'
  };

  request.status = 'submitted-locally';
  request.lastSubmittedAt = Game.time;
  request.lastSubmissionId = submissionId;

  return {
    status: request.status,
    submissionId,
    callNumber: reservation.callNumber,
    payloadDigest: decision.payloadDigest
  };
}</code></pre>
<p>The submission record is created after the call returns to the script. It is deliberately labelled local evidence. It does not claim an email timestamp, inbox appearance, or external delivery.</p>

<h2 id="cooldown">Start cooldowns at the call site</h2>
<pre><code class="language-javascript">function maySubmitIncident(
  incidentKey,
  cooldownTicks
) {
  const history = Object.values(
    Memory.notificationSubmissions ?? {}
  );
  const last = history
    .filter(item =&gt; item.incidentKey === incidentKey)
    .sort((left, right) =&gt;
      right.submittedAt - left.submittedAt
    )[0];

  if (!last) return true;

  return Game.time - last.submittedAt
    &gt;= cooldownTicks;
}</code></pre>
<p>Queue time is not submission time. Deferred, expired, cancelled, superseded, or invalid revisions must not start a notification cooldown.</p>

<h2 id="failure-states">Keep stale and deferred states visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>payload-confirmation-mismatch</code></td><td>The current payload no longer matches the approved revision.</td><td>Create and review a new revision.</td></tr>
<tr><td><code>request-expired</code></td><td>The exact alert revision is stale.</td><td>Archive it without consuming a call slot.</td></tr>
<tr><td><code>incident-already-reserved</code></td><td>Another revision for this incident owns the tick.</td><td>Keep the later request queued.</td></tr>
<tr><td><code>call-limit-reached</code></td><td>The shared dispatcher has used its configured call slots.</td><td>Preserve the exact revision for a later tick.</td></tr>
<tr><td><code>notification-call-threw-review-required</code></td><td>The call site did not complete normally.</td><td>Keep the request disabled and inspect the error.</td></tr>
<tr><td><code>submitted-locally</code></td><td>The exact payload reached <code>Game.notify()</code>.</td><td>Do not rename this state to delivered.</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Build alert revisions after incident classification, route all candidates through one final dispatcher, preserve deferred revisions unchanged, and retain only bounded submission history. External email delivery, grouping latency, provider behavior, genuine inbox screenshots, live CPU cost, and multi-tick Console traces remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.notify" rel="nofollow">API Reference: Game.notify()</a></li>
<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow">Scripting Basics: current-tick execution and queued commands</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: current Game state and persistent Memory</a></li>
</ul>
`,
};
