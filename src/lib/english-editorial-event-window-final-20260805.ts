import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEventLogArticle } from "./english-observability-event-log-9";

export const englishEditorialEventWindowFinalArticle20260805: EnglishBeginnerArticle = {
  ...englishEventLogArticle,
  title: "Screeps Room.getEventLog(): Read Previous-Tick Events",
  headline: "How to Read Room.getEventLog() Without Mixing Up Ticks",
  description:
    "Read the previous tick's Room events, distinguish parsed and raw mode, filter event-specific data safely, match actor and target IDs when attribution matters, and keep optional history bounded.",
  category: "OBSERVABILITY · ROOM EVENT LOG",
  readingTime: "11 min read",
  primaryKeyword: "Screeps Room.getEventLog",
  searchIntent:
    "Read and filter the previous tick's Room events without confusing them with current-tick action results",
  finalScore: 98,
  keywords: [
    "Screeps Room.getEventLog",
    "Screeps previous tick events",
    "Screeps EVENT_REPAIR",
    "Room.getEventLog raw",
    "Screeps event log debugging",
  ],
  verification: [
    [
      "Official API",
      "Checked — previous-tick timing, parsed and raw modes, event structure, and event-specific data",
    ],
    [
      "Timing boundary",
      "Current action return codes remain separate from the next tick's event log",
    ],
    [
      "JavaScript syntax",
      "Checked for the focused examples in this guide",
    ],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick event verification", "Pending"],
    ["Last verified", "August 30, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["previous-tick", "The log belongs to the previous tick"],
    ["minimal-reader", "Read the parsed event array"],
    ["event-shapes", "Event data depends on the event type"],
    ["match-event", "Match one actor and target"],
    ["raw-mode", "Use raw mode only when you need the string"],
    ["missing-objects", "Keep historical IDs when objects disappear"],
    ["missed-window", "A missed event window cannot be replayed later"],
    ["bounded-history", "Keep optional history bounded"],
    ["action-result", "Keep action results and event evidence separate"],
    ["debugging", "Debugging checklist"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does getEventLog() include actions submitted in the current tick?",
      "No. It returns events from the previous tick in that Room. Keep current action return codes separately, then inspect the next tick's event log when you need processed-event evidence.",
    ],
    [
      "What does getEventLog(true) return?",
      "A raw JSON string. The default call returns the parsed event array and caches that parsed result for later calls in the same tick.",
    ],
    [
      "Does every event have a targetId?",
      "No. Event data differs by event type, so check the event constant before reading type-specific fields.",
    ],
  ],
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>room.getEventLog()</code> returns events that happened in that Room during the <strong>previous tick</strong>. The default call gives you the parsed event array; <code>room.getEventLog(true)</code> gives you the raw JSON string.</p>
<p>Start simple: read the array, filter the event type you care about, then compare <code>objectId</code> and event-specific <code>data</code> fields when attribution matters. Do not use the current tick's event array as proof for an action you just submitted.</p>

<h2 id="previous-tick">The log belongs to the previous tick</h2>
<p>If your code is running at tick <code>T</code>, the events returned by <code>getEventLog()</code> belong to tick <code>T - 1</code>.</p>
<pre><code class="language-text">tick 100: your Creep repairs a Road

tick 101: room.getEventLog() can contain that repair event
          a repair submitted during tick 101 is not in that same array</code></pre>
<p>This timing rule is the most important debugging boundary on the page. An immediate API return code answers whether the current command was accepted. The next tick's event log can tell you what event the engine recorded for the prior tick.</p>

<h2 id="minimal-reader">Read the parsed event array first</h2>
<p>For normal debugging, use parsed mode. The first parsed access has JSON parsing cost; later parsed calls in the same tick reuse the cached result.</p>
<pre><code class="language-javascript">const ROOM_NAME = 'W1N1';
const room = Game.rooms[ROOM_NAME];

if (!room) {
  console.log(ROOM_NAME + ' is not visible this tick.');
} else {
  const events = room.getEventLog();

  console.log(JSON.stringify({
    eventTick: Game.time - 1,
    roomName: room.name,
    eventCount: events.length,
    eventTypes: events.map(event =&gt; event.event)
  }, null, 2));
}</code></pre>
<p>Replace <code>W1N1</code> with a Room that is visible now. An empty array means no events were returned for that previous-tick Room window; it does not describe older missed ticks.</p>

<h2 id="event-shapes">Event data depends on the event type</h2>
<p>Every event has an <code>event</code> constant, an <code>objectId</code>, and a <code>data</code> object, but the fields inside <code>data</code> depend on the event type.</p>
<div class="table-scroll"><table>
<thead><tr><th>Event</th><th>Useful fields from the official API</th></tr></thead>
<tbody>
<tr><td><code>EVENT_ATTACK</code></td><td><code>targetId</code>, <code>damage</code>, <code>attackType</code></td></tr>
<tr><td><code>EVENT_BUILD</code></td><td><code>targetId</code>, <code>amount</code>, <code>structureType</code>, coordinates</td></tr>
<tr><td><code>EVENT_REPAIR</code></td><td><code>targetId</code>, <code>amount</code>, <code>energySpent</code></td></tr>
<tr><td><code>EVENT_UPGRADE_CONTROLLER</code></td><td><code>amount</code>, <code>energySpent</code></td></tr>
<tr><td><code>EVENT_EXIT</code></td><td>destination <code>room</code> and coordinates</td></tr>
</tbody>
</table></div>
<p>Do not assume every event has a <code>targetId</code>. Check <code>event.event</code> before reading type-specific fields.</p>

<h2 id="match-event">Match one actor and target when attribution matters</h2>
<p>Suppose you want to verify that one specific Creep repaired one specific structure during the previous tick. Match the repair event, actor ID, and target ID together:</p>
<pre><code class="language-javascript">function findRepairEvent(room, repairerId, targetId) {
  return room.getEventLog().find(event =&gt;
    event.event === EVENT_REPAIR
    &amp;&amp; event.objectId === repairerId
    &amp;&amp; event.data?.targetId === targetId
  ) ?? null;
}

const room = Game.rooms.W1N1;
const event = room
  ? findRepairEvent(
      room,
      'REPAIRER_OBJECT_ID',
      'TARGET_OBJECT_ID'
    )
  : null;

console.log(event);</code></pre>
<p>When a match exists, <code>event.data.amount</code> and <code>event.data.energySpent</code> describe the recorded repair event. Keep the IDs you submitted or logged during the action tick so you are not guessing which actor or target produced a later event.</p>

<h2 id="raw-mode">Use raw mode only when you need the string</h2>
<p>Passing a truthy argument returns raw JSON instead of the parsed array. That is useful when your own code deliberately controls parsing or forwards the serialized payload.</p>
<pre><code class="language-javascript">const room = Game.rooms.W1N1;

if (room) {
  const raw = room.getEventLog(true);
  const parsed = JSON.parse(raw);

  console.log({
    rawType: typeof raw,
    parsedIsArray: Array.isArray(parsed),
    eventCount: Array.isArray(parsed)
      ? parsed.length
      : 0
  });
}</code></pre>
<p>Do not mix the raw string and the parsed array in the same variable. For ordinary inspection, the default parsed mode is simpler.</p>

<h2 id="missing-objects">Keep historical IDs when objects disappear</h2>
<p>A valid previous-tick event can reference an object that is unavailable now. A Creep may have died, a structure may have been destroyed, or the object may no longer be visible. <code>Game.getObjectById()</code> returning <code>null</code> now does not erase the historical event.</p>
<p>Use current object lookup only as enrichment. Preserve the event's recorded IDs and fields even when current lookup is unavailable, and do not treat current <code>my</code> state as proof of historical ownership.</p>

<h2 id="missed-window">A missed event window cannot be replayed later</h2>
<p><code>getEventLog()</code> exposes the previous tick, not an arbitrary historical range. If your code did not read a visible Room's event window when it was available, a later call does not reconstruct all skipped ticks.</p>
<p>If continuity matters, store the last event tick you successfully processed and mark a gap when the next observed tick is not consecutive. You usually do not need a full ingestion ledger just to debug one action.</p>

<h2 id="bounded-history">Keep optional history bounded</h2>
<p>If you need trends, store small summaries rather than every raw event forever. For example, keep the latest observed tick and a bounded count by event type:</p>
<pre><code class="language-javascript">function summarizePreviousTick(room) {
  const events = room.getEventLog();
  const counts = {};

  for (const event of events) {
    const key = String(event.event);
    counts[key] = (counts[key] || 0) + 1;
  }

  Memory.roomEventStats ??= {};
  Memory.roomEventStats[room.name] = {
    eventTick: Game.time - 1,
    counts
  };

  return counts;
}</code></pre>
<p>This replaces the previous summary for that Room instead of growing an unbounded array. Add a bounded incident list only when your own debugging workflow actually needs one.</p>

<h2 id="action-result">Keep current action results and previous-tick events separate</h2>
<p>When causality matters, record the current call's return code with the actor and target IDs. On the next tick, use the event log as a second observation.</p>
<div class="table-scroll"><table>
<thead><tr><th>Evidence</th><th>When it exists</th><th>What it tells you</th></tr></thead>
<tbody>
<tr><td>Action return code</td><td>Current tick</td><td>Whether the submitted command was accepted or rejected immediately</td></tr>
<tr><td><code>Room.getEventLog()</code></td><td>Next script tick</td><td>Which events the engine recorded for the previous Room tick</td></tr>
<tr><td>Current object state</td><td>Current tick</td><td>What is visible now, not necessarily historical ownership or exclusive causality</td></tr>
</tbody>
</table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the Room is visible now.</li>
<li>Label the returned array with <code>Game.time - 1</code>.</li>
<li>Use parsed mode unless you specifically need raw JSON.</li>
<li>Filter by <code>event.event</code> before reading event-specific <code>data</code>.</li>
<li>Match <code>objectId</code> and <code>targetId</code> when the event type actually provides a target ID.</li>
<li>Keep current action return codes separate from previous-tick event evidence.</li>
<li>Preserve historical IDs when current objects are unavailable.</li>
<li>Mark missed windows honestly instead of inventing backfill.</li>
<li>Keep long-term summaries bounded.</li>
</ul>
<p>Use <a href="/en/blog/screeps-roomvisual-debug">the RoomVisual debugging guide</a> when you need to display current targets and state in the Room. Visuals show what your code draws now; they do not replace event evidence.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow noopener noreferrer">Screeps API: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow noopener noreferrer">Screeps API: Game.getObjectById()</a></li>
</ul>`,
};
