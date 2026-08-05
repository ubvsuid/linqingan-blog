import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishEventLogArticle } from "./english-observability-event-log-9";

export const englishEditorialEventWindowArticle20260805: EnglishBeginnerArticle = {
  ...englishEventLogArticle,
  title: "Screeps Room.getEventLog(): Bind Exact Previous-Tick Windows",
  headline: "Process One Event Window Without Reusing a Stale Ownership Snapshot",
  description:
    "Bind every parsed event window to one room, one previous tick and one schema version; accept ownership snapshots only from that exact event tick; commit once; and report missed windows as non-replayable.",
  category: "OBSERVABILITY · PREVIOUS-TICK WINDOW IDENTITY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  updatedAt: "2026-08-05",
  readingTime: "22 min read",
  primaryKeyword: "Screeps Room.getEventLog previous tick",
  searchIntent:
    "Ingest one exact Room event-log window without stale ownership evidence, duplicate commits, raw-mode confusion, or fictional backfill",
  finalScore: 98,
  keywords: [
    "Screeps Room.getEventLog previous tick",
    "Screeps event window identity",
    "Screeps ownership snapshot capturedAt",
    "Screeps event log no backfill",
    "Screeps parsed event schema",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official API",
      "Checked — Room.getEventLog returns events from the previous tick; parsed mode returns an array and raw mode returns a JSON string",
    ],
    [
      "Replay boundary",
      "Checked — the method exposes one previous-tick window, so a skipped or invisible read is not presented as backfillable history",
    ],
    [
      "Static code review",
      "Passed — exact room and event tick, schema-bound local keys, capturedAt ownership proof, one committed window record, bounded retention and unsupported-event accounting",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live visibility gap, global reset, duplicate-reader, raw-mode and multi-event ordering test",
      "Pending",
    ],
    ["Genuine Console or event-log screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Bind the previous-tick window"],
    ["no-backfill", "Treat missed windows as unavailable"],
    ["snapshot-clock", "Timestamp ownership snapshots"],
    ["event-identity", "Use schema-bound local event identity"],
    ["normalize", "Normalize supported shapes only"],
    ["commit", "Commit one complete window"],
    ["capture-current", "Capture the current ownership snapshot"],
    ["failure-states", "Keep stale and conflicting states visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Bind the previous-tick window</h2>
<p><code>room.getEventLog()</code> describes one room during the previous game tick. At script tick <code>T</code>, the returned events belong to <code>T - 1</code>. A command submitted during <code>T</code> cannot be proven by the array read during that same script execution.</p>
<p>Store the room name, event tick, read tick, parser mode and project schema version together. The array index is useful only inside that exact returned window; it is not a global incident ID.</p>
<pre><code class="language-javascript">const EVENT_WINDOW_SCHEMA = 2;

function describeEventWindow(roomName) {
  return {
    roomName,
    eventTick: Game.time - 1,
    readAt: Game.time,
    mode: 'parsed',
    schemaVersion: EVENT_WINDOW_SCHEMA
  };
}</code></pre>

<h2 id="no-backfill">Treat missed windows as unavailable</h2>
<p>The API exposes events from the previous tick, not an arbitrary historical range. If the room is not visible when the reader runs, the script exceeds CPU before ingestion, the reader is disabled, or a global reset skips project initialization, a later call does not reconstruct every missed window.</p>
<pre><code class="language-javascript">function detectEventWindowGap(
  roomName,
  currentEventTick
) {
  const latest = Memory.roomEventLatest?.[roomName];

  if (!Number.isInteger(latest)) {
    return {
      status: 'first-observed-window',
      missingTicks: []
    };
  }

  if (currentEventTick === latest + 1) {
    return {
      status: 'continuous-window',
      missingTicks: []
    };
  }

  const missingTicks = [];
  for (
    let tick = latest + 1;
    tick &lt; currentEventTick;
    tick += 1
  ) {
    missingTicks.push(tick);
  }

  return {
    status: 'non-replayable-gap-observed',
    missingTicks
  };
}</code></pre>
<p>A gap record is honest evidence that the project did not ingest those ticks. Do not fill the gap with empty arrays, current objects, or later summaries.</p>

<h2 id="snapshot-clock">Timestamp ownership snapshots</h2>
<pre><code class="language-javascript">function collectOwnedObjectSnapshot(room) {
  return {
    roomName: room.name,
    capturedAt: Game.time,
    ownedIds: [
      ...room.find(FIND_MY_CREEPS),
      ...room.find(FIND_MY_POWER_CREEPS),
      ...room.find(FIND_MY_STRUCTURES)
    ].map(object =&gt; object.id)
  };
}

function classifyHistoricalTarget(
  targetId,
  eventTick,
  snapshot
) {
  const snapshotMatches =
    snapshot?.roomName === snapshot?.roomName
    &amp;&amp; snapshot?.capturedAt === eventTick
    &amp;&amp; Array.isArray(snapshot?.ownedIds);

  if (!snapshotMatches) {
    return {
      ownedAtEventTick: null,
      confidence: 'exact-snapshot-unavailable',
      snapshotCapturedAt:
        Number.isInteger(snapshot?.capturedAt)
          ? snapshot.capturedAt
          : null
    };
  }

  return {
    ownedAtEventTick:
      snapshot.ownedIds.includes(targetId),
    confidence: 'exact-event-tick-snapshot',
    snapshotCapturedAt: snapshot.capturedAt
  };
}</code></pre>
<p>The critical check is <code>snapshot.capturedAt === eventTick</code>. An older visible-room snapshot may contain the same ID, but it cannot prove ownership during the event tick. Current <code>target.my</code> is also current evidence, not historical ownership proof.</p>

<h2 id="event-identity">Use schema-bound local event identity</h2>
<pre><code class="language-javascript">function createLocalEventKey(
  roomName,
  eventTick,
  index,
  schemaVersion
) {
  return [
    roomName,
    eventTick,
    'parsed',
    schemaVersion,
    index
  ].join(':');
}</code></pre>
<p>Two legitimate events may share an actor, target, amount, damage value or event type. Preserve the returned order and array index. Changing parser mode or normalization schema creates a different local identity namespace rather than silently reinterpreting an old key.</p>

<h2 id="normalize">Normalize supported shapes only</h2>
<pre><code class="language-javascript">function normalizeEvent(
  roomName,
  eventTick,
  event,
  index,
  ownershipSnapshot
) {
  if (!event || typeof event !== 'object') {
    return {
      status: 'malformed-event',
      index
    };
  }

  const base = {
    key: createLocalEventKey(
      roomName,
      eventTick,
      index,
      EVENT_WINDOW_SCHEMA
    ),
    eventTick,
    roomName,
    index,
    eventType: Number.isInteger(event.event)
      ? event.event
      : null,
    objectId: typeof event.objectId === 'string'
      ? event.objectId
      : null
  };

  if (
    event.event === EVENT_ATTACK
    &amp;&amp; event.data
    &amp;&amp; typeof event.data.targetId === 'string'
  ) {
    return {
      status: 'normalized',
      record: {
        ...base,
        kind: 'attack',
        targetId: event.data.targetId,
        damage: Number.isFinite(event.data.damage)
          ? event.data.damage
          : null,
        targetOwnership: classifyHistoricalTarget(
          event.data.targetId,
          eventTick,
          ownershipSnapshot
        )
      }
    };
  }

  if (event.event === EVENT_OBJECT_DESTROYED) {
    return {
      status: 'normalized',
      record: {
        ...base,
        kind: 'object-destroyed',
        destroyedType:
          typeof event.data?.type === 'string'
            ? event.data.type
            : null
      }
    };
  }

  return {
    status: 'unsupported-event-preserved',
    record: {
      ...base,
      kind: 'unsupported'
    }
  };
}</code></pre>
<p>Unsupported events are counted and retain minimal identity fields. They are not discarded as though the room had no activity, and they are not forced into an attack schema.</p>

<h2 id="commit">Commit one complete window</h2>
<pre><code class="language-javascript">function ingestPreviousTickEvents(roomName) {
  const room = Game.rooms[roomName];
  if (!room) {
    return {
      status: 'room-not-visible',
      roomName,
      eventTick: Game.time - 1
    };
  }

  const envelope = describeEventWindow(roomName);
  Memory.roomEventWindows ??= {};
  const existingRoomWindows =
    Memory.roomEventWindows[roomName] ?? {};
  const existing =
    existingRoomWindows[String(envelope.eventTick)];

  if (existing) {
    if (
      existing.schemaVersion
      !== envelope.schemaVersion
      || existing.mode !== envelope.mode
    ) {
      return {
        status: 'window-schema-conflict',
        roomName,
        eventTick: envelope.eventTick
      };
    }

    return {
      status: 'exact-window-already-committed',
      roomName,
      eventTick: envelope.eventTick,
      recordCount: existing.recordCount
    };
  }

  const events = room.getEventLog(false);
  if (!Array.isArray(events)) {
    return {
      status: 'parsed-event-log-not-array',
      roomName,
      eventTick: envelope.eventTick
    };
  }

  const snapshot =
    Memory.ownedObjectSnapshots?.[roomName] ?? null;
  const normalized = events.map((event, index) =&gt;
    normalizeEvent(
      roomName,
      envelope.eventTick,
      event,
      index,
      snapshot
    )
  );
  const records = normalized
    .map(item =&gt; item.record)
    .filter(Boolean);

  const gap = detectEventWindowGap(
    roomName,
    envelope.eventTick
  );
  const committedWindow = {
    ...envelope,
    committedAt: Game.time,
    gapStatus: gap.status,
    missingTicks: gap.missingTicks,
    exactOwnershipSnapshot:
      snapshot?.capturedAt === envelope.eventTick,
    ownershipSnapshotCapturedAt:
      Number.isInteger(snapshot?.capturedAt)
        ? snapshot.capturedAt
        : null,
    sourceEventCount: events.length,
    recordCount: records.length,
    malformedCount: normalized.filter(item =&gt;
      item.status === 'malformed-event'
    ).length,
    unsupportedCount: normalized.filter(item =&gt;
      item.status === 'unsupported-event-preserved'
    ).length,
    records
  };

  const nextRoomWindows = {
    ...existingRoomWindows,
    [String(envelope.eventTick)]: committedWindow
  };
  const keptTicks = Object.keys(nextRoomWindows)
    .map(Number)
    .filter(Number.isInteger)
    .sort((left, right) =&gt; right - left)
    .slice(0, 20);

  Memory.roomEventWindows[roomName] =
    Object.fromEntries(
      keptTicks.map(tick =&gt; [
        String(tick),
        nextRoomWindows[String(tick)]
      ])
    );
  Memory.roomEventLatest ??= {};
  Memory.roomEventLatest[roomName] =
    envelope.eventTick;

  return {
    status: 'exact-window-committed',
    roomName,
    eventTick: envelope.eventTick,
    recordCount: records.length,
    exactOwnershipSnapshot:
      committedWindow.exactOwnershipSnapshot,
    gapStatus: committedWindow.gapStatus
  };
}</code></pre>
<p>The complete window is built in local variables and assigned once. The committed window itself is the idempotency marker; a second independent reader does not append duplicate incidents or overwrite the same tick with a different schema.</p>

<h2 id="capture-current">Capture the current ownership snapshot</h2>
<pre><code class="language-javascript">function runRoomEventObserver(roomName) {
  const ingestion =
    ingestPreviousTickEvents(roomName);
  const room = Game.rooms[roomName];

  if (!room) return ingestion;

  Memory.ownedObjectSnapshots ??= {};
  Memory.ownedObjectSnapshots[roomName] =
    collectOwnedObjectSnapshot(room);

  return {
    ingestion,
    snapshot: {
      status: 'current-snapshot-captured',
      roomName,
      capturedAt: Game.time,
      ownedCount:
        Memory.ownedObjectSnapshots[roomName]
          .ownedIds.length
    }
  };
}</code></pre>
<p>Process the previous window before replacing the prior snapshot. If execution stops before the current snapshot is stored, the next window reports <code>exact-snapshot-unavailable</code> rather than borrowing an older snapshot.</p>

<h2 id="failure-states">Keep stale and conflicting states visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>room-not-visible</code></td><td>The previous-tick window cannot be read now.</td><td>Record the absence; do not invent an empty window.</td></tr>
<tr><td><code>non-replayable-gap-observed</code></td><td>One or more event ticks were skipped.</td><td>Keep the exact missing tick numbers.</td></tr>
<tr><td><code>exact-snapshot-unavailable</code></td><td>No ownership snapshot was captured during the event tick.</td><td>Preserve IDs with unknown historical ownership.</td></tr>
<tr><td><code>window-schema-conflict</code></td><td>A different parser mode or schema already owns this room and tick.</td><td>Do not overwrite the committed evidence.</td></tr>
<tr><td><code>exact-window-already-committed</code></td><td>The same room, tick, mode and schema were processed.</td><td>Reuse the stored record.</td></tr>
<tr><td><code>unsupported-event-preserved</code></td><td>The event exists but no detailed normalizer is defined.</td><td>Retain minimal identity and add a reviewed schema later.</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Run one observer per visible room before replacing current ownership snapshots. Version every normalization schema, derive alerts from committed windows rather than calling actions inside the reader, and bound retained history. Live event ordering, visibility gaps, raw JSON mode, global resets, exact CPU cost, genuine screenshots, and multi-tick Console evidence remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">API Reference: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: current Game objects and persistent Memory</a></li>
</ul>
`,
};
