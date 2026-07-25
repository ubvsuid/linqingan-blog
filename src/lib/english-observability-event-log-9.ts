import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishEventLogArticle = {
  slug: "screeps-room-event-log",
  path: "/en/blog/screeps-room-event-log",
  chinesePath: "/blog/screeps-room-event-log",
  title: "Screeps Room.getEventLog(): Previous-Tick Events",
  headline: "How to Read Room.getEventLog() Safely in Screeps",
  description:
    "Read previous-tick room events, distinguish parsed arrays from raw JSON strings, validate event-specific data, preserve IDs when objects disappear, filter attacks on owned targets, and store bounded aggregates instead of unlimited history.",
  category: "OBSERVABILITY · PREVIOUS-TICK EVENT LOGS",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Room Event Log",
  tags: ["Screeps", "Room API", "Event Log", "Combat", "Diagnostics"],
  keywords: [
    "Screeps Room.getEventLog",
    "Screeps previous tick events",
    "Screeps EVENT_ATTACK",
    "Room.getEventLog raw",
    "Screeps event history",
  ],
  primaryKeyword: "Screeps Room.getEventLog",
  searchIntent: "Read and normalize previous-tick events without misattributing current commands",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — previous-tick timing, parsed and raw modes, event fields and attack types"],
    ["Timing boundary", "The log describes the previous tick; current action return codes remain separate"],
    ["Object boundary", "Missing current objects do not invalidate their historical event IDs"],
    ["JavaScript syntax", "Passed"],
    ["Offline event review", "Passed — attack filtering, malformed data, vanished targets, ownership snapshots, raw parsing and bounded aggregation"],
    ["Screeps Console test", "Pending"],
    ["Live room event, combat and multi-tick history test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["timeline", "The event log belongs to the previous tick"],
    ["parsed-raw", "Parsed mode and raw mode"],
    ["event-shapes", "Different events have different data"],
    ["normalize-attack", "Normalize attack events defensively"],
    ["owned-target", "Identify attacks on owned targets"],
    ["vanished-objects", "Preserve events when objects disappear"],
    ["complete-reader", "Complete previous-tick attack reader"],
    ["destroyed-snapshot", "Track ownership before destruction"],
    ["aggregate", "Store bounded aggregates"],
    ["action-result", "Event logs do not replace action results"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does getEventLog() include actions submitted in the current tick?",
      "No. The official API returns events that happened in the previous tick. Current commands need their own immediate return-code logging.",
    ],
    [
      "What does getEventLog(true) return?",
      "It returns raw JSON in string form. The default call returns a parsed array and caches that parsed result for later calls in the same tick.",
    ],
    [
      "Why can Game.getObjectById(targetId) return null for a valid event?",
      "The target may have died, been destroyed, left visibility, or become unavailable between the event tick and the current tick.",
    ],
    [
      "Should I store every raw event forever?",
      "Usually not. Keep bounded incident records or aggregate counts and timestamps to control Memory size and parsing cost.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-game-notify",
    label: "Previous observability guide",
    title: "Send Reliable Alerts",
  },
  next: {
    href: "/en/blog/screeps-roomvisual-debug",
    label: "Next debugging guide",
    title: "Draw RoomVisual Diagnostics",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>room.getEventLog()</code> returns events that happened in that room during the previous tick. The default mode returns a parsed array. Passing a truthy raw argument returns a JSON string. Validate <code>event.event</code> before reading event-specific <code>data</code>, preserve IDs even when current objects are missing, and store bounded summaries when you need history.</p>

<h2 id="timeline">The event log belongs to the previous tick</h2>
<pre><code class="language-text">tick 99
combat, build, repair, harvest, transfer, and other outcomes occur

tick 100 begins
object state reflects those outcomes
room.getEventLog() returns tick 99 events
commands submitted during tick 100 are not those returned events</code></pre>
<p>This code does not prove that the current attack created an event:</p>
<pre><code class="language-javascript">const actionResult = creep.attack(target);
const previousTickEvents = creep.room.getEventLog();

console.log({
  actionResult,
  eventTick: Game.time - 1,
  eventCount: previousTickEvents.length
});</code></pre>
<p>The immediate return code and the previous-tick event array answer different questions.</p>

<h2 id="parsed-raw">Parsed mode and raw mode</h2>
<pre><code class="language-javascript">const parsedEvents = room.getEventLog();
const rawJson = room.getEventLog(true);

console.log({
  parsedIsArray: Array.isArray(parsedEvents),
  rawIsString: typeof rawJson === 'string'
});</code></pre>
<p>The official API notes that the first parsed access has JSON parsing cost and later parsed calls in the same tick reuse a cached result. Raw mode is useful only when your code deliberately controls parsing or forwards the string.</p>
<pre><code class="language-javascript">function parseRawEventLog(raw) {
  if (typeof raw !== 'string') {
    return {
      status: 'raw-not-string',
      events: []
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? { status: 'parsed', events: parsed }
      : { status: 'not-array', events: [] };
  } catch (error) {
    return {
      status: 'invalid-json',
      events: [],
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}</code></pre>

<h2 id="event-shapes">Different events have different data</h2>
<div class="table-scroll"><table>
<thead><tr><th>Event</th><th>Representative data</th></tr></thead>
<tbody>
<tr><td><code>EVENT_ATTACK</code></td><td><code>targetId</code>, <code>damage</code>, <code>attackType</code></td></tr>
<tr><td><code>EVENT_BUILD</code></td><td><code>targetId</code>, <code>amount</code>, coordinates, structure type</td></tr>
<tr><td><code>EVENT_HEAL</code></td><td><code>targetId</code>, <code>amount</code>, <code>healType</code></td></tr>
<tr><td><code>EVENT_REPAIR</code></td><td><code>targetId</code>, <code>amount</code>, <code>energySpent</code></td></tr>
<tr><td><code>EVENT_UPGRADE_CONTROLLER</code></td><td><code>amount</code>, <code>energySpent</code></td></tr>
<tr><td><code>EVENT_EXIT</code></td><td>destination room and coordinates</td></tr>
</tbody></table></div>
<p>Do not assume every event has a <code>targetId</code>. Normalize each supported event type separately.</p>

<h2 id="normalize-attack">Normalize attack events defensively</h2>
<pre><code class="language-javascript">function getAttackTypeName(value) {
  switch (value) {
    case EVENT_ATTACK_TYPE_MELEE:
      return 'melee';
    case EVENT_ATTACK_TYPE_RANGED:
      return 'ranged-or-tower';
    case EVENT_ATTACK_TYPE_RANGED_MASS:
      return 'ranged-mass';
    case EVENT_ATTACK_TYPE_DISMANTLE:
      return 'dismantle';
    case EVENT_ATTACK_TYPE_HIT_BACK:
      return 'hit-back';
    case EVENT_ATTACK_TYPE_NUKE:
      return 'nuke';
    default:
      return 'unknown';
  }
}

function normalizeAttackEvent(event) {
  if (!event || event.event !== EVENT_ATTACK) {
    return null;
  }

  const data = event.data
    && typeof event.data === 'object'
    ? event.data
    : {};

  if (typeof data.targetId !== 'string') {
    return null;
  }

  return {
    attackerId: typeof event.objectId === 'string'
      ? event.objectId
      : null,
    targetId: data.targetId,
    damage: Number.isFinite(data.damage)
      ? data.damage
      : 0,
    attackType: data.attackType ?? null,
    attackTypeName:
      getAttackTypeName(data.attackType)
  };
}</code></pre>
<p>An unknown attack type is safer than incorrectly labeling a future or unsupported constant.</p>

<h2 id="owned-target">Identify attacks on owned targets</h2>
<pre><code class="language-javascript">function classifyCurrentTarget(targetId) {
  const target = Game.getObjectById(targetId);

  if (!target) {
    return {
      status: 'target-unavailable',
      ownedNow: null,
      target: null
    };
  }

  return {
    status: target.my === true
      ? 'target-owned-now'
      : 'target-not-owned-now',
    ownedNow: target.my === true,
    target
  };
}</code></pre>
<p>This checks current ownership and availability. It cannot prove ownership at the previous tick when the object no longer exists.</p>

<h2 id="vanished-objects">Preserve events when objects disappear</h2>
<p>A valid historical event can reference a target or actor that is now dead, destroyed, outside vision, or otherwise unavailable. Keep the IDs and event fields in the incident record.</p>
<pre><code class="language-javascript">function enrichAttack(attack) {
  const target = Game.getObjectById(attack.targetId);
  const attacker = attack.attackerId
    ? Game.getObjectById(attack.attackerId)
    : null;

  return {
    ...attack,
    targetAvailableNow: Boolean(target),
    targetOwnedNow: target?.my ?? null,
    attackerAvailableNow: Boolean(attacker)
  };
}</code></pre>
<p>Do not discard the event merely because enrichment fails.</p>

<h2 id="complete-reader">Complete previous-tick attack reader</h2>
<p><strong>State impact:</strong> this reader reads the current visible Room and previous-tick events. It writes a bounded incident list and aggregate counters.</p>
<pre><code class="language-javascript">function getOwnedTargetIds(room) {
  return new Set([
    ...room.find(FIND_MY_CREEPS),
    ...room.find(FIND_MY_STRUCTURES)
  ].map(object => object.id));
}

function readPreviousTickAttacks(room) {
  const knownOwnedNow = getOwnedTargetIds(room);
  const previousOwned = new Set(
    Array.isArray(Memory.ownedObjectIds?.[room.name])
      ? Memory.ownedObjectIds[room.name]
      : []
  );
  const attacks = [];

  for (const event of room.getEventLog()) {
    const attack = normalizeAttackEvent(event);
    if (!attack) {
      continue;
    }

    const ownedBySnapshot =
      previousOwned.has(attack.targetId);
    const ownedNow = knownOwnedNow.has(attack.targetId);

    if (!ownedBySnapshot && !ownedNow) {
      continue;
    }

    attacks.push({
      tick: Game.time - 1,
      roomName: room.name,
      ownedBySnapshot,
      ownedNow,
      ...enrichAttack(attack)
    });
  }

  Memory.eventIncidents ??= {};
  const history = Array.isArray(
    Memory.eventIncidents[room.name]
  )
    ? Memory.eventIncidents[room.name]
    : [];
  Memory.eventIncidents[room.name] = [
    ...history,
    ...attacks
  ].slice(-100);

  Memory.eventStats ??= {};
  const stats = Memory.eventStats[room.name] || {
    attacksOnMine: 0,
    lastAttackTick: null
  };
  stats.attacksOnMine += attacks.length;
  if (attacks.length > 0) {
    stats.lastAttackTick = Game.time - 1;
  }
  Memory.eventStats[room.name] = stats;

  Memory.ownedObjectIds ??= {};
  Memory.ownedObjectIds[room.name] = [
    ...knownOwnedNow
  ];

  return attacks;
}</code></pre>
<p>The previous ownership snapshot improves destroyed-target classification. It is still an application snapshot, so missed ticks or lost vision reduce confidence.</p>

<h2 id="destroyed-snapshot">Track ownership before destruction</h2>
<p><code>EVENT_OBJECT_DESTROYED</code> can report that an object was destroyed, but current <code>Game.getObjectById()</code> cannot recover its old <code>my</code> property. Preserve a bounded previous-tick ID set or another ownership snapshot before the next event-read cycle.</p>
<pre><code class="language-javascript">function snapshotOwnedObjects(room) {
  Memory.ownedObjectIds ??= {};
  Memory.ownedObjectIds[room.name] = [
    ...room.find(FIND_MY_CREEPS),
    ...room.find(FIND_MY_STRUCTURES)
  ].map(object => object.id);
}</code></pre>

<h2 id="aggregate">Store bounded aggregates</h2>
<pre><code class="language-javascript">function summarizeEvents(events) {
  const counts = {};

  for (const event of events) {
    const key = String(event?.event);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}</code></pre>
<p>Aggregate counts, last-seen ticks, and a short incident list are usually cheaper than storing every raw event permanently. Define retention, reset, and missing-room policies.</p>

<h2 id="action-result">Event logs do not replace action results</h2>
<pre><code class="language-javascript">const result = tower.attack(target);

Memory.actionResults ??= [];
Memory.actionResults.push({
  tick: Game.time,
  actorId: tower.id,
  targetId: target.id,
  action: 'tower-attack',
  result
});
Memory.actionResults =
  Memory.actionResults.slice(-100);</code></pre>
<p>The action result tells whether the command was accepted now. The next tick event log describes what happened in the prior tick. Record both when causality matters.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require current room visibility before reading the log.</li>
<li>Label records with <code>Game.time - 1</code>.</li>
<li>Keep raw strings separate from parsed arrays.</li>
<li>Normalize each event type independently.</li>
<li>Validate <code>event.data</code> before reading fields.</li>
<li>Keep actor and target IDs when objects disappear.</li>
<li>Use a previous ownership snapshot for destroyed targets.</li>
<li>Record current action return codes separately.</li>
<li>Bound incident history.</li>
<li>Aggregate long-term statistics.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement complete schemas for every event type, durable Segment archives, cross-room incident correlation, combat attribution confidence, or live server validation. Continue with <a href="/en/blog/screeps-roomvisual-debug">RoomVisual debugging</a> to display current targets and state without confusing visuals with outcomes.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is the event log current-tick telemetry?</h3>
<p>No. It describes the previous tick.</p>
<h3>Is raw mode faster?</h3>
<p>It avoids the built-in parsed object when you do not need it, but custom parsing still costs CPU and should be measured.</p>
<h3>Does a missing target make the event invalid?</h3>
<p>No. Preserve its historical ID and mark current availability separately.</p>
<h3>Can getEventLog provide long-term history?</h3>
<p>No. Your code must store bounded incidents or aggregates.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">API Reference: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game Loop and Ticks</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
