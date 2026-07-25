import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishNotifyArticle = {
  slug: "screeps-game-notify",
  path: "/en/blog/screeps-game-notify",
  chinesePath: "/blog/screeps-game-notify",
  title: "Screeps Game.notify(): Reliable Rate-Limited Alerts",
  headline: "How to Send Reliable Alerts with Game.notify()",
  description:
    "Use state transitions, per-room Memory, repeat intervals, message truncation, priorities, and a 20-notification queue without confusing groupInterval minutes with game ticks or claiming external delivery success.",
  category: "OBSERVABILITY · RATE-LIMITED ALERTS",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Game.notify Alerts",
  tags: ["Screeps", "Game.notify", "Alerts", "Memory", "Diagnostics"],
  keywords: [
    "Screeps Game.notify",
    "Screeps notification rate limit",
    "Game.notify groupInterval minutes",
    "Screeps controller downgrade alert",
    "Screeps alert queue",
  ],
  primaryKeyword: "Screeps Game.notify",
  searchIntent: "Build stateful, rate-limited alerts without notification spam",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — 1000-character message, 20 scheduled notifications per tick, groupInterval minutes, Simulation unavailable"],
    ["Delivery boundary", "The API call condition can be verified; external email or profile delivery is not proven by a return code"],
    ["Rate boundary", "Per-alert state and a central queue are separate from notification grouping"],
    ["JavaScript syntax", "Passed"],
    ["Offline alert review", "Passed — entry, active, repeat, recovery, re-entry, truncation, priority and expiration states"],
    ["Screeps Console test", "Pending"],
    ["Live notification queue and external delivery test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["official-limits", "Official notification limits"],
    ["three-layers", "Use three independent rate controls"],
    ["state-machine", "Evaluate alert state with a pure function"],
    ["message-length", "Enforce the 1000-character limit"],
    ["per-room-state", "Keep state per alert key"],
    ["complete-controller-alert", "Complete Controller risk alert"],
    ["queue", "Build a central priority queue"],
    ["submit-cap", "Submit at most 20 notifications"],
    ["delivery-proof", "Do not claim delivery success"],
    ["recovery", "Recovery should re-arm the alert"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Is groupInterval measured in ticks?",
      "No. The official API defines groupInterval in minutes. Keep your in-game repeat interval as a separate tick-based Memory rule.",
    ],
    [
      "How many notifications can be scheduled in one tick?",
      "Up to 20. A central queue should prioritize and defer additional alerts instead of letting every module call Game.notify independently.",
    ],
    [
      "Does Game.notify() prove the email arrived?",
      "No documented delivery return code confirms external arrival. You can verify that your code decided to call the API, then test the actual notification channel live.",
    ],
    [
      "Why store alert state by room?",
      "A shared timestamp lets one room suppress another. Use a stable key for each room, resource, or failure condition.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-rawmemory-segments",
    label: "Previous storage guide",
    title: "Use RawMemory Segments",
  },
  next: {
    href: "/en/blog/screeps-room-event-log",
    label: "Next observability guide",
    title: "Read the Previous Tick Event Log",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Send a notification when a condition enters risk, optionally repeat it after a tick-based interval, and re-arm it after recovery. Store state per alert key, normalize every message to 1000 characters or fewer, and submit at most 20 queued notifications per tick. <code>groupInterval</code> is measured in minutes, not ticks.</p>

<h2 id="official-limits">Official notification limits</h2>
<div class="table-scroll"><table>
<thead><tr><th>Rule</th><th>Official boundary</th><th>Application requirement</th></tr></thead>
<tbody>
<tr><td>Message length</td><td>Maximum 1000 characters</td><td>Truncate before submission</td></tr>
<tr><td>Scheduled per tick</td><td>Maximum 20</td><td>Use one priority queue</td></tr>
<tr><td><code>groupInterval</code></td><td>Minutes</td><td>Do not reuse a tick count</td></tr>
<tr><td>Default grouping</td><td>0</td><td>Scheduled immediately</td></tr>
<tr><td>Simulation Room</td><td>Unavailable</td><td>Live delivery requires another environment</td></tr>
</tbody></table></div>
<p>The API reference does not document a delivery receipt that proves an email or profile notification arrived.</p>

<h2 id="three-layers">Use three independent rate controls</h2>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Unit</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td>State transition</td><td>Business state</td><td>Notify immediately when normal becomes risky</td></tr>
<tr><td>Repeat interval</td><td>Game ticks</td><td>Allow a long-running risk to remind again</td></tr>
<tr><td><code>groupInterval</code></td><td>Real minutes</td><td>Let the notification system group messages</td></tr>
</tbody></table></div>
<p>Grouping does not prevent your code from calling the API every tick. The state machine must control when a call is allowed.</p>

<h2 id="state-machine">Evaluate alert state with a pure function</h2>
<pre><code class="language-javascript">function evaluateAlert(input) {
  const previous = input.previousState || {
    active: false,
    lastSubmittedTick: null
  };
  const isRisk = input.isRisk === true;

  if (!isRisk) {
    return {
      shouldQueue: false,
      reason: previous.active ? 'recovered' : 'normal',
      nextState: {
        active: false,
        lastSubmittedTick: previous.lastSubmittedTick
      }
    };
  }

  const enteredRisk = previous.active !== true;
  const lastTick = Number.isInteger(
    previous.lastSubmittedTick
  )
    ? previous.lastSubmittedTick
    : null;
  const repeatDue =
    lastTick !== null
    && Number.isInteger(input.repeatAfterTicks)
    && input.repeatAfterTicks >= 0
    && input.currentTick - lastTick
      >= input.repeatAfterTicks;
  const shouldQueue = enteredRisk || repeatDue;

  return {
    shouldQueue,
    reason: enteredRisk
      ? 'entered-risk'
      : repeatDue
        ? 'repeat-due'
        : 'risk-active',
    nextState: {
      active: true,
      lastSubmittedTick: shouldQueue
        ? input.currentTick
        : lastTick
    }
  };
}</code></pre>
<p>This pure function supports offline tests without calling <code>Game.notify()</code>.</p>

<h2 id="message-length">Enforce the 1000-character limit</h2>
<pre><code class="language-javascript">function normalizeNotificationMessage(message) {
  const text = String(message);

  if (text.length <= 1000) {
    return text;
  }

  return text.slice(0, 997) + '...';
}</code></pre>
<p>Do not append arbitrary serialized objects or full stack traces without a size budget.</p>

<h2 id="per-room-state">Keep state per alert key</h2>
<pre><code class="language-javascript">function getAlertState(key) {
  Memory.alertStates ??= {};
  return Memory.alertStates[key] || null;
}

function setAlertState(key, state) {
  Memory.alertStates ??= {};
  Memory.alertStates[key] = state;
}</code></pre>
<p>A key such as <code>controller-risk:W1N1</code> isolates rooms. Similar keys can isolate Spawns, Terminals, remote operations, or CPU conditions.</p>

<h2 id="complete-controller-alert">Complete Controller risk alert</h2>
<p><strong>State impact:</strong> this code writes alert state and queues an alert in Memory. It does not submit the external notification until the queue processor runs.</p>
<pre><code class="language-javascript">const CONTROLLER_ALERT_THRESHOLD = 5000;
const CONTROLLER_REPEAT_TICKS = 5000;

function evaluateAlert(input) {
  const previous = input.previousState || {
    active: false,
    lastSubmittedTick: null
  };

  if (input.isRisk !== true) {
    return {
      shouldQueue: false,
      reason: previous.active ? 'recovered' : 'normal',
      nextState: {
        active: false,
        lastSubmittedTick: previous.lastSubmittedTick
      }
    };
  }

  const enteredRisk = previous.active !== true;
  const lastTick = Number.isInteger(
    previous.lastSubmittedTick
  )
    ? previous.lastSubmittedTick
    : null;
  const repeatDue =
    lastTick !== null
    && input.currentTick - lastTick
      >= input.repeatAfterTicks;
  const shouldQueue = enteredRisk || repeatDue;

  return {
    shouldQueue,
    reason: enteredRisk
      ? 'entered-risk'
      : repeatDue
        ? 'repeat-due'
        : 'risk-active',
    nextState: {
      active: true,
      lastSubmittedTick: shouldQueue
        ? input.currentTick
        : lastTick
    }
  };
}

function enqueueNotification(alert) {
  Memory.notificationQueue ??= [];
  Memory.notificationQueue.push(alert);
}

function checkControllerRisk(room) {
  const controller = room.controller;

  if (
    !controller
    || controller.my !== true
    || !Number.isFinite(controller.ticksToDowngrade)
  ) {
    return 'controller-unavailable';
  }

  const key = 'controller-risk:' + room.name;
  const previous = getAlertState(key);
  const decision = evaluateAlert({
    isRisk:
      controller.ticksToDowngrade
      < CONTROLLER_ALERT_THRESHOLD,
    currentTick: Game.time,
    previousState: previous,
    repeatAfterTicks: CONTROLLER_REPEAT_TICKS
  });

  setAlertState(key, decision.nextState);

  if (!decision.shouldQueue) {
    return decision.reason;
  }

  enqueueNotification({
    key,
    createdAt: Game.time,
    expiresAt: Game.time + 1000,
    priority: 100,
    groupMinutes: 60,
    message: normalizeNotificationMessage(
      [
        '[controller-risk]',
        'room=' + room.name,
        'ticksToDowngrade=' +
          controller.ticksToDowngrade,
        'threshold=' + CONTROLLER_ALERT_THRESHOLD,
        'reason=' + decision.reason,
        'gameTick=' + Game.time
      ].join(' ')
    )
  });

  return 'queued';
}</code></pre>
<p>The thresholds are example policy, not official recommendations.</p>

<h2 id="queue">Build a central priority queue</h2>
<pre><code class="language-javascript">function normalizeNotificationQueue(queue) {
  if (!Array.isArray(queue)) {
    return [];
  }

  const byKey = new Map();

  for (const item of queue) {
    if (
      !item
      || typeof item.key !== 'string'
      || typeof item.message !== 'string'
      || !Number.isFinite(item.priority)
      || !Number.isInteger(item.createdAt)
      || !Number.isInteger(item.expiresAt)
    ) {
      continue;
    }

    if (item.expiresAt < Game.time) {
      continue;
    }

    const previous = byKey.get(item.key);
    if (
      !previous
      || item.priority > previous.priority
      || item.createdAt > previous.createdAt
    ) {
      byKey.set(item.key, item);
    }
  }

  return [...byKey.values()].sort(
    (a, b) =>
      b.priority - a.priority
      || a.createdAt - b.createdAt
      || a.key.localeCompare(b.key)
  );
}</code></pre>
<p>Deduplication prevents multiple modules from submitting the same condition in one tick.</p>

<h2 id="submit-cap">Submit at most 20 notifications</h2>
<p><strong>State impact:</strong> this function calls <code>Game.notify()</code> up to 20 times and keeps remaining valid items in Memory.</p>
<pre><code class="language-javascript">function submitNotificationQueue() {
  const queue = normalizeNotificationQueue(
    Memory.notificationQueue
  );
  const submitted = queue.slice(0, 20);
  const deferred = queue.slice(20);

  for (const item of submitted) {
    Game.notify(
      normalizeNotificationMessage(item.message),
      Number.isFinite(item.groupMinutes)
        ? Math.max(0, item.groupMinutes)
        : 0
    );
  }

  Memory.notificationQueue = deferred;

  return {
    submitted: submitted.length,
    deferred: deferred.length
  };
}</code></pre>
<p>Call this once after every producer has queued alerts. Submission count does not prove external delivery.</p>

<h2 id="delivery-proof">Do not claim delivery success</h2>
<p>The reliable local evidence is:</p>
<ul>
<li>the condition entered a notification state;</li>
<li>the queue accepted a normalized item;</li>
<li>the queue processor selected it within the 20-call limit;</li>
<li>your code called <code>Game.notify()</code>.</li>
</ul>
<p>Email, profile, client, or account-delivery behavior requires live verification outside the offline state machine.</p>

<h2 id="recovery">Recovery should re-arm the alert</h2>
<p>When risk ends, set <code>active</code> to false but retain the previous submission tick for history. A later transition into risk becomes a new <code>entered-risk</code> event and can notify immediately.</p>
<pre><code class="language-javascript">const recovered = evaluateAlert({
  isRisk: false,
  currentTick: 2000,
  previousState: {
    active: true,
    lastSubmittedTick: 1500
  },
  repeatAfterTicks: 5000
});</code></pre>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Keep tick intervals separate from grouping minutes.</li>
<li>Normalize every message to 1000 characters or fewer.</li>
<li>Store state per stable alert key.</li>
<li>Notify on entry, due repeats, and re-entry after recovery.</li>
<li>Use one central queue.</li>
<li>Deduplicate by key.</li>
<li>Expire stale queue items.</li>
<li>Sort by explicit priority.</li>
<li>Submit no more than 20 per tick.</li>
<li>Do not claim external delivery without a live test.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement account-channel monitoring, webhook delivery, retry receipts, cross-shard queues, Segment-backed alert history, or live email verification. Continue with <a href="/en/blog/screeps-room-event-log">Room.getEventLog()</a> to create alerts from previous-tick combat events.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can groupInterval replace Memory cooldowns?</h3>
<p>No. It groups notifications in minutes; your business state still needs tick-based control.</p>
<h3>Should every module call Game.notify directly?</h3>
<p>No. A central queue enforces the account-wide per-tick limit.</p>
<h3>Should recovery send a notification?</h3>
<p>That is a product decision. The example records recovery only so the next risk entry can alert again.</p>
<h3>Can the Simulation validate delivery?</h3>
<p>No. The official API says notifications are unavailable there.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.notify" rel="nofollow">API Reference: Game.notify()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.time" rel="nofollow">API Reference: Game.time</a></li>
<li><a href="https://docs.screeps.com/api/#Memory" rel="nofollow">API Reference: Memory</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
