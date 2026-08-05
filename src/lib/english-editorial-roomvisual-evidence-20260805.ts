import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishRoomVisualArticle } from "./english-observability-roomvisual-9";

export const englishEditorialRoomVisualEvidenceArticle20260805: EnglishBeginnerArticle = {
  ...englishRoomVisualArticle,
  title: "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
  headline: "Draw Only Same-Room, Same-Tick Snapshots Through One Final Dispatcher",
  description:
    "Bind every debug layer to one room and capture tick, reject cross-room snapshots, detect earlier visual writers, reserve unique layer IDs, and keep drawing output separate from game-state evidence.",
  category: "OBSERVABILITY · ROOM-BOUND VISUAL IDENTITY",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  updatedAt: "2026-08-05",
  readingTime: "21 min read",
  primaryKeyword: "Screeps RoomVisual room identity",
  searchIntent:
    "Render bounded Screeps RoomVisual diagnostics without cross-room coordinates, competing clear or import calls, duplicate layers, or false outcome claims",
  finalScore: 98,
  keywords: [
    "Screeps RoomVisual room identity",
    "Screeps RoomVisual dispatcher",
    "RoomVisual getSize 512000",
    "Screeps cross-room visual snapshot",
    "Screeps RoomVisual clear import coordination",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    [
      "Official API",
      "Checked — RoomVisual data is room-scoped, current-tick browser output; drawings last one tick; getSize reports all current-tick visual bytes in that room; clear removes all room visuals; import appends exported data",
    ],
    [
      "Identity boundary",
      "Checked — every layer and mark is bound to one room and one capture tick before rendering",
    ],
    [
      "Static code review",
      "Passed — shared dispatcher, pre-existing writer detection, unique layer reservation, same-room validation, label and item limits, conservative byte margin and local render summary",
    ],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    [
      "Live cross-room rejection, competing writer, clear/import, byte-margin and browser rendering test",
      "Pending",
    ],
    ["Genuine room screenshots", "Pending"],
    ["Last verified", "August 5, 2026"],
  ],
  toc: [
    ["evidence-contract", "Treat drawings as browser output"],
    ["snapshot-identity", "Bind room and capture tick"],
    ["layer-contract", "Register immutable debug layers"],
    ["coordinate", "Use one final dispatcher"],
    ["render", "Render bounded same-room marks"],
    ["clear-import", "Coordinate clear and import ownership"],
    ["action-evidence", "Separate action results from outcomes"],
    ["failure-states", "Keep visual conflicts visible"],
    ["integration", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-contract">Treat drawings as browser output</h2>
<p>RoomVisual data is current-tick browser output visible only to the player. It is not stored as game state, lasts one tick unless redrawn, and does not create room visibility. Drawing a circle at known coordinates in an unseen room proves only that visual data was added for those coordinates.</p>
<p>Every drawing method returns the <code>RoomVisual</code> object for chaining. That return value is not a success receipt for movement, harvesting, combat, construction, or any other game action.</p>

<h2 id="snapshot-identity">Bind room and capture tick</h2>
<pre><code class="language-javascript">function createCreepVisualSnapshot(
  creep,
  actionRecord,
  target
) {
  if (!creep?.pos) return null;

  return {
    snapshotId: [
      creep.id,
      Game.time,
      actionRecord?.action ?? 'no-action'
    ].join(':'),
    capturedAt: Game.time,
    objectId: creep.id,
    objectName: creep.name,
    roomName: creep.pos.roomName,
    x: creep.pos.x,
    y: creep.pos.y,
    role: creep.memory.role ?? 'unassigned',
    task: creep.memory.task ?? 'no-task',
    action: actionRecord
      ? {
          submittedAt: actionRecord.submittedAt,
          result: actionRecord.result,
          action: actionRecord.action,
          targetId: actionRecord.targetId
        }
      : null,
    target: target?.pos
      ? {
          id: target.id,
          roomName: target.pos.roomName,
          x: target.pos.x,
          y: target.pos.y
        }
      : null
  };
}</code></pre>
<p>The snapshot contains plain values and an exact capture tick. A renderer for <code>W1N1</code> must reject a snapshot whose <code>roomName</code> is <code>W1N2</code>; identical numeric coordinates do not make the rooms interchangeable.</p>

<h2 id="layer-contract">Register immutable debug layers</h2>
<pre><code class="language-javascript">function buildVisualLayerRequest(
  layerId,
  roomName,
  snapshots,
  priority
) {
  return {
    layerId,
    roomName,
    capturedAt: Game.time,
    priority,
    marks: snapshots.filter(Boolean).map(snapshot =&gt; ({
      snapshotId: snapshot.snapshotId,
      capturedAt: snapshot.capturedAt,
      roomName: snapshot.roomName,
      x: snapshot.x,
      y: snapshot.y,
      label: [
        snapshot.objectName,
        snapshot.role,
        snapshot.task,
        snapshot.action?.result ?? 'no-result'
      ].join(' ').slice(0, 80),
      failed: Number.isInteger(snapshot.action?.result)
        &amp;&amp; snapshot.action.result &lt; 0,
      target: snapshot.target
    }))
  };
}</code></pre>
<p>Build a new layer request after task logic finishes. Do not let the renderer read live Creep Memory, select targets, or rewrite the request after registration.</p>

<h2 id="coordinate">Use one final dispatcher</h2>
<pre><code class="language-javascript">function createRoomVisualDispatcher(
  roomName,
  options = {}
) {
  const visual = new RoomVisual(roomName);
  const existingBytes = visual.getSize();
  const maximumItems = Number.isInteger(
    options.maximumItems
  )
    ? Math.min(200, Math.max(0, options.maximumItems))
    : 60;
  const maximumBytes = Number.isInteger(
    options.maximumBytes
  )
    ? Math.min(480000, Math.max(0, options.maximumBytes))
    : 460000;
  const layers = new Map();

  return {
    register(layer) {
      if (
        !layer
        || typeof layer.layerId !== 'string'
        || layer.layerId.length === 0
        || layer.roomName !== roomName
        || layer.capturedAt !== Game.time
        || !Number.isFinite(layer.priority)
        || !Array.isArray(layer.marks)
      ) {
        return {
          ready: false,
          status: 'layer-identity-invalid'
        };
      }

      if (layers.has(layer.layerId)) {
        return {
          ready: false,
          status: 'layer-id-already-reserved'
        };
      }

      const invalidMark = layer.marks.find(mark =&gt;
        !mark
        || typeof mark.snapshotId !== 'string'
        || mark.roomName !== roomName
        || mark.capturedAt !== Game.time
        || !Number.isFinite(mark.x)
        || !Number.isFinite(mark.y)
        || mark.x &lt; 0
        || mark.x &gt; 49
        || mark.y &lt; 0
        || mark.y &gt; 49
        || typeof mark.label !== 'string'
        || mark.label.length &gt; 80
      );

      if (invalidMark) {
        return {
          ready: false,
          status: 'cross-room-or-stale-mark-rejected',
          snapshotId: invalidMark.snapshotId ?? null
        };
      }

      layers.set(layer.layerId, structuredClone(layer));
      return {
        ready: true,
        status: 'layer-registered',
        layerId: layer.layerId
      };
    },
    render() {
      return renderRegisteredVisualLayers({
        roomName,
        visual,
        existingBytes,
        maximumItems,
        maximumBytes,
        layers: [...layers.values()]
      });
    }
  };
}</code></pre>
<p>Every module must register with the same dispatcher instance. A private dispatcher in each role file cannot detect duplicate layer IDs, cross-room marks, earlier visual writers, or combined byte usage.</p>

<h2 id="render">Render bounded same-room marks</h2>
<pre><code class="language-javascript">function renderRegisteredVisualLayers(input) {
  if (input.existingBytes !== 0) {
    return {
      status: 'preexisting-visual-writer-detected',
      existingBytes: input.existingBytes,
      drawn: 0
    };
  }

  const marks = input.layers
    .sort((left, right) =&gt;
      right.priority - left.priority
      || left.layerId.localeCompare(right.layerId)
    )
    .flatMap(layer =&gt;
      layer.marks.map(mark =&gt; ({
        ...mark,
        layerId: layer.layerId,
        layerPriority: layer.priority
      }))
    )
    .sort((left, right) =&gt;
      Number(right.failed) - Number(left.failed)
      || right.layerPriority - left.layerPriority
      || left.snapshotId.localeCompare(right.snapshotId)
    )
    .slice(0, input.maximumItems);

  let drawn = 0;
  for (const mark of marks) {
    if (input.visual.getSize() &gt;= input.maximumBytes) {
      return {
        status: 'soft-byte-budget-reached',
        drawn,
        bytes: input.visual.getSize()
      };
    }

    input.visual.circle(mark.x, mark.y, {
      radius: 0.42,
      fill: 'transparent',
      stroke: mark.failed ? '#ff8888' : '#88ff88'
    });
    input.visual.text(
      mark.label,
      mark.x,
      mark.y - 0.7,
      { font: 0.4, align: 'center' }
    );

    if (
      mark.target
      &amp;&amp; mark.target.roomName === input.roomName
      &amp;&amp; Number.isFinite(mark.target.x)
      &amp;&amp; Number.isFinite(mark.target.y)
    ) {
      input.visual.line(
        mark.x,
        mark.y,
        mark.target.x,
        mark.target.y,
        { lineStyle: 'dashed', opacity: 0.45 }
      );
    }

    drawn += 1;

    if (input.visual.getSize() &gt; input.maximumBytes) {
      return {
        status: 'soft-budget-crossed-by-final-mark',
        drawn,
        bytes: input.visual.getSize()
      };
    }
  }

  return {
    status: 'room-visual-rendered-locally',
    drawn,
    bytes: input.visual.getSize(),
    roomName: input.roomName,
    renderedAt: Game.time
  };
}</code></pre>
<p>The soft ceiling remains below the official 512,000-byte hard limit because the exact next drawing size is not known before serialization. Labels and item counts are also bounded. The final summary proves local drawing calls and serialized size, not that a human browser displayed every mark.</p>

<h2 id="clear-import">Coordinate clear and import ownership</h2>
<p><code>clear()</code> removes all current visual data for the room, including layers written by other modules. <code>import()</code> appends previously exported data to the current tick and contributes to the same room byte total. Do not call either method from an independent feature after final rendering.</p>
<pre><code class="language-javascript">function evaluateVisualReplayArtifact(
  artifact,
  roomName
) {
  if (
    !artifact
    || artifact.roomName !== roomName
    || !Number.isInteger(artifact.capturedAt)
    || !Number.isInteger(artifact.expiresAt)
    || Game.time &gt; artifact.expiresAt
    || typeof artifact.data !== 'string'
    || artifact.data.length === 0
    || artifact.data.length &gt; 200000
  ) {
    return {
      ready: false,
      status: 'replay-artifact-invalid-or-expired'
    };
  }

  return {
    ready: true,
    status: 'replay-artifact-reviewed',
    capturedAt: artifact.capturedAt
  };
}</code></pre>
<p>Import is an explicit replay feature with room, age, retention and size rules. It is not a hidden shortcut for preserving every tick in Memory.</p>

<h2 id="action-evidence">Separate action results from outcomes</h2>
<pre><code class="language-javascript">function submitAndDescribeMove(creep, target) {
  const submittedAt = Game.time;
  const result = creep.moveTo(target, {
    range: 1,
    reusePath: 10
  });

  return {
    submittedAt,
    action: 'moveTo',
    actorId: creep.id,
    targetId: target.id,
    result
  };
}</code></pre>
<p>A label containing <code>OK</code> means that the current action call returned <code>OK</code>. It does not prove that the Creep moved during the same script execution. Later-tick position identity belongs in a separate verifier, not in the RoomVisual renderer.</p>

<h2 id="failure-states">Keep visual conflicts visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>layer-identity-invalid</code></td><td>The layer is not bound to this room and tick.</td><td>Reject it before registration.</td></tr>
<tr><td><code>cross-room-or-stale-mark-rejected</code></td><td>A mark belongs to another room or capture tick.</td><td>Do not draw its numeric coordinates here.</td></tr>
<tr><td><code>layer-id-already-reserved</code></td><td>Another producer owns the layer ID this tick.</td><td>Resolve the producer conflict.</td></tr>
<tr><td><code>preexisting-visual-writer-detected</code></td><td>Another module wrote room visuals before the dispatcher.</td><td>Route that writer through the shared dispatcher.</td></tr>
<tr><td><code>soft-byte-budget-reached</code></td><td>The conservative room budget is full.</td><td>Stop without calling <code>clear()</code>.</td></tr>
<tr><td><code>room-visual-rendered-locally</code></td><td>The dispatcher added bounded current-tick visual data.</td><td>Do not rename this browser-displayed or game-action-complete.</td></tr>
</tbody></table></div>

<h2 id="integration">Production integration boundary</h2>
<p>Create one dispatcher per room after task decisions, register immutable plain-data layers, render once at the end of the tick, and keep clear/import behind the same owner. Live browser display, byte-margin behavior near the hard limit, multi-module ordering, CPU measurements, genuine screenshots, and later-tick action verification remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RoomVisual" rel="nofollow">API Reference: RoomVisual</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.getSize" rel="nofollow">API Reference: RoomVisual.getSize()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.clear" rel="nofollow">API Reference: RoomVisual.clear()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.export" rel="nofollow">API Reference: RoomVisual.export() and import()</a></li>
</ul>
`,
};
