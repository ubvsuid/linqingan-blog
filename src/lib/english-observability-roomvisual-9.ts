import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishRoomVisualArticle = {
  slug: "screeps-roomvisual-debug",
  path: "/en/blog/screeps-roomvisual-debug",
  chinesePath: "/blog/screeps-roomvisual-debug",
  title: "Screeps RoomVisual Debugging: State, Targets, and Budgets",
  headline: "How to Build a Safe RoomVisual Debug Layer in Screeps",
  description:
    "Draw current Creep state, target relationships, and task labels with RoomVisual while enforcing per-room switches, stable ordering, item limits, the 512,000-byte ceiling, cross-room boundaries, and a strict separation between visuals and action results.",
  category: "OBSERVABILITY · ROOMVISUAL DEBUG LAYER",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "RoomVisual Debugging",
  tags: ["Screeps", "RoomVisual", "Debugging", "Visualization", "CPU"],
  keywords: [
    "Screeps RoomVisual debugging",
    "RoomVisual getSize 512000",
    "Screeps draw creep target",
    "RoomVisual export import",
    "Screeps visual CPU",
  ],
  primaryKeyword: "Screeps RoomVisual debugging",
  searchIntent: "Build bounded current-tick visual diagnostics without confusing drawings with game outcomes",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — current-tick lifecycle, drawing methods, getSize(), 512,000-byte limit, export() and import()"],
    ["Visibility boundary", "A RoomVisual can draw known coordinates without granting live Room visibility"],
    ["Evidence boundary", "A label or line shows the debug plan, not a successful movement or action outcome"],
    ["JavaScript syntax", "Passed"],
    ["Offline visual-plan review", "Passed — disabled, missing object, labels, target availability, cross-room target, stable order, item cap and byte stop states"],
    ["Screeps Console test", "Pending"],
    ["Live RoomVisual, byte-size and CPU test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["lifecycle", "RoomVisual belongs to the current tick"],
    ["visibility", "Drawing does not grant visibility"],
    ["size-cpu", "Visual bytes and CPU are different budgets"],
    ["config", "Use a per-room debug configuration"],
    ["pure-plan", "Build a pure visual plan"],
    ["stable-order", "Sort before applying item limits"],
    ["complete-layer", "Complete bounded RoomVisual layer"],
    ["target-boundary", "Handle missing and cross-room targets"],
    ["action-results", "Visuals do not prove action success"],
    ["export-import", "Export and import deliberately"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Do RoomVisual drawings persist automatically?",
      "No. They belong to the current tick. Draw them again each tick or import a previously exported string when you need the visual to reappear.",
    ],
    [
      "Can RoomVisual reveal an invisible room?",
      "No. You can draw at known coordinates, but Game.rooms will not become available and current objects cannot be inspected without vision.",
    ],
    [
      "Does getSize() measure CPU?",
      "No. It returns the stored visual size in bytes. Measure CPU separately with Game.cpu.getUsed().",
    ],
    [
      "Does a target line prove moveTo() succeeded?",
      "No. The line only shows what the debug layer believes the target is. Record action return codes and position changes separately.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-room-event-log",
    label: "Previous observability guide",
    title: "Read the Previous Tick Event Log",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>RoomVisual</code> to display what your code currently believes: Creep roles, tasks, target IDs, paths, ranges, and selected positions. Redraw each tick, limit the number of items, stop before 512,000 bytes per room, and measure CPU separately. A drawing is diagnostic evidence about your plan, not proof that an action succeeded.</p>

<h2 id="lifecycle">RoomVisual belongs to the current tick</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const visual = new RoomVisual('W1N1');
  visual.text('running', 25, 25);
};</code></pre>
<p>If the code does not draw or import the visual on the next tick, the previous drawing does not remain automatically.</p>

<h2 id="visibility">Drawing does not grant visibility</h2>
<pre><code class="language-javascript">const visual = new RoomVisual('W10N10');
visual.circle(25, 25, {
  radius: 0.5,
  stroke: '#ffffff',
  fill: 'transparent'
});

console.log({
  roomVisible: Boolean(Game.rooms.W10N10)
});</code></pre>
<p>The circle can be drawn from known coordinates without creating a live <code>Room</code>. Current Creeps, structures, Controller state, and other objects still require visibility.</p>

<h2 id="size-cpu">Visual bytes and CPU are different budgets</h2>
<div class="table-scroll"><table>
<thead><tr><th>Measurement</th><th>What it means</th></tr></thead>
<tbody>
<tr><td><code>visual.getSize()</code></td><td>Serialized visual bytes in that room during the current tick</td></tr>
<tr><td>512,000 bytes</td><td>Official per-room visual limit for the current tick</td></tr>
<tr><td><code>Game.cpu.getUsed()</code></td><td>CPU consumed so far in the current tick</td></tr>
</tbody></table></div>
<pre><code class="language-javascript">function measureVisualCpu(draw) {
  const start = Game.cpu.getUsed();
  const result = draw();
  const end = Game.cpu.getUsed();

  return {
    result,
    cpu: Math.max(0, end - start)
  };
}</code></pre>
<p>A visual can be below the byte limit and still cost too much CPU when thousands of objects, paths, labels, or lookups are generated.</p>

<h2 id="config">Use a per-room debug configuration</h2>
<pre><code class="language-javascript">function getVisualConfig(roomName) {
  const raw = Memory.visualDebug?.[roomName];

  if (!raw || raw.enabled !== true) {
    return null;
  }

  return {
    showLabels: raw.showLabels !== false,
    showTargets: raw.showTargets !== false,
    showEnergy: raw.showEnergy !== false,
    maximumItems:
      Number.isInteger(raw.maximumItems)
      && raw.maximumItems > 0
        ? raw.maximumItems
        : 30,
    maximumBytes:
      Number.isInteger(raw.maximumBytes)
      && raw.maximumBytes > 0
      && raw.maximumBytes <= 512000
        ? raw.maximumBytes
        : 480000
  };
}</code></pre>
<p>The 480,000-byte fallback is a site policy that leaves margin below the official ceiling.</p>

<h2 id="pure-plan">Build a pure visual plan</h2>
<pre><code class="language-javascript">function buildCreepVisualPlan(input) {
  if (input.enabled !== true) {
    return {
      ready: false,
      reason: 'disabled',
      items: []
    };
  }

  if (!input.creep?.pos) {
    return {
      ready: false,
      reason: 'creep-missing',
      items: []
    };
  }

  const items = [{
    type: 'circle',
    x: input.creep.pos.x,
    y: input.creep.pos.y
  }];

  if (input.showLabels === true) {
    items.push({
      type: 'text',
      text: input.label,
      x: input.creep.pos.x,
      y: input.creep.pos.y - 0.75
    });
  }

  if (
    input.showTargets === true
    && input.target?.pos
    && input.target.pos.roomName
      === input.creep.pos.roomName
  ) {
    items.push({
      type: 'line',
      x1: input.creep.pos.x,
      y1: input.creep.pos.y,
      x2: input.target.pos.x,
      y2: input.target.pos.y
    });
  }

  return {
    ready: true,
    reason: 'ready',
    items
  };
}</code></pre>
<p>A pure plan can be tested without the visual API. Rendering remains a separate step.</p>

<h2 id="stable-order">Sort before applying item limits</h2>
<pre><code class="language-javascript">function selectVisualCreeps(creeps, maximumItems) {
  return [...creeps]
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )
    .slice(0, maximumItems);
}</code></pre>
<p>Room find order is not a business priority. Stable sorting makes repeated diagnostic output easier to compare.</p>

<h2 id="complete-layer">Complete bounded RoomVisual layer</h2>
<p><strong>State impact:</strong> this layer draws current-tick visuals and writes a compact summary to Memory. It does not change Creep tasks or target IDs.</p>
<pre><code class="language-javascript">function trimVisualLabel(value, maximumLength = 40) {
  const text = String(value);

  if (text.length <= maximumLength) {
    return text;
  }

  return text.slice(0, maximumLength - 3) + '...';
}

function drawCreepDebug(visual, creep, config) {
  if (visual.getSize() >= config.maximumBytes) {
    return 'byte-limit';
  }

  const energy = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (config.showLabels) {
    const task = creep.memory?.task || 'no-task';
    const label = trimVisualLabel(
      creep.name + ' ' + task + ' ' + energy + 'E'
    );

    visual.text(
      label,
      creep.pos.x,
      creep.pos.y - 0.75,
      {
        color: '#ffffff',
        font: 0.45,
        opacity: 0.9,
        backgroundColor: '#111111',
        backgroundPadding: 0.15
      }
    );
  }

  visual.circle(creep.pos, {
    radius: 0.43,
    stroke: '#00ff88',
    strokeWidth: 0.08,
    fill: 'transparent',
    opacity: 0.75
  });

  if (!config.showTargets) {
    return 'drawn';
  }

  const targetId = creep.memory?.targetId;
  const target = targetId
    ? Game.getObjectById(targetId)
    : null;

  if (!target?.pos) {
    return targetId
      ? 'target-unavailable'
      : 'drawn';
  }

  if (target.pos.roomName !== creep.pos.roomName) {
    visual.text(
      trimVisualLabel('to ' + target.pos.roomName),
      creep.pos.x,
      creep.pos.y + 0.8,
      {
        color: '#ffaa00',
        font: 0.4
      }
    );
    return 'cross-room-target';
  }

  visual.line(creep.pos, target.pos, {
    color: '#ffaa00',
    width: 0.08,
    opacity: 0.55,
    lineStyle: 'dashed'
  });
  visual.circle(target.pos, {
    radius: 0.32,
    stroke: '#ffaa00',
    fill: 'transparent',
    opacity: 0.7
  });

  return 'drawn-with-target';
}

function drawRoomDebug(room) {
  const config = getVisualConfig(room.name);
  if (!config) {
    return {
      status: 'disabled',
      drawn: 0
    };
  }

  const visual = room.visual;
  const creeps = selectVisualCreeps(
    room.find(FIND_MY_CREEPS),
    config.maximumItems
  );
  const summary = {
    status: 'complete',
    drawn: 0,
    stoppedByBytes: false,
    statuses: {}
  };

  for (const creep of creeps) {
    if (visual.getSize() >= config.maximumBytes) {
      summary.stoppedByBytes = true;
      summary.status = 'byte-limit';
      break;
    }

    const status = drawCreepDebug(
      visual,
      creep,
      config
    );
    summary.drawn += 1;
    summary.statuses[status] =
      (summary.statuses[status] || 0) + 1;
  }

  Memory.visualDebug[room.name].lastSummary = {
    ...summary,
    bytes: visual.getSize(),
    tick: Game.time
  };

  return summary;
}</code></pre>

<h2 id="target-boundary">Handle missing and cross-room targets</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>drawn</code></td><td>Creep drawn without a target relationship</td></tr>
<tr><td><code>drawn-with-target</code></td><td>Same-room target line drawn</td></tr>
<tr><td><code>target-unavailable</code></td><td>An ID exists but no current object can be resolved</td></tr>
<tr><td><code>cross-room-target</code></td><td>The target is in another room; a label replaces an impossible cross-room line</td></tr>
<tr><td><code>byte-limit</code></td><td>Rendering stopped before adding more data</td></tr>
</tbody></table></div>
<p>The debug layer must not delete a task merely because its target is currently unavailable. Target lifecycle belongs to role or task management.</p>

<h2 id="action-results">Visuals do not prove action success</h2>
<pre><code class="language-javascript">const moveResult = creep.moveTo(target);

creep.room.visual.text(
  'move=' + moveResult,
  creep.pos.x,
  creep.pos.y + 0.75,
  {
    color: moveResult === OK
      ? '#88ff88'
      : '#ff8888',
    font: 0.4
  }
);</code></pre>
<p>Even this label proves only the returned code was displayed. Multi-tick position changes are needed to prove movement progress.</p>

<h2 id="export-import">Export and import deliberately</h2>
<pre><code class="language-javascript">function saveRoomVisual(room) {
  Memory.savedVisuals ??= {};
  Memory.savedVisuals[room.name] = {
    savedAt: Game.time,
    data: room.visual.export()
  };
}

function importRoomVisual(room, maxAge = 100) {
  const saved = Memory.savedVisuals?.[room.name];

  if (
    !saved
    || !Number.isInteger(saved.savedAt)
    || typeof saved.data !== 'string'
    || Game.time - saved.savedAt > maxAge
  ) {
    return false;
  }

  room.visual.import(saved.data);
  return true;
}</code></pre>
<p>Exported strings consume persistent storage and can become misleading when the room changes. Store timestamps and expire old diagrams.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require an explicit per-room enable switch.</li>
<li>Redraw or import each tick.</li>
<li>Do not treat drawing as visibility.</li>
<li>Measure bytes with <code>getSize()</code>.</li>
<li>Measure CPU separately.</li>
<li>Sort objects before applying item limits.</li>
<li>Trim labels.</li>
<li>Stop below the 512,000-byte ceiling.</li>
<li>Do not draw one line across room boundaries.</li>
<li>Keep target lifecycle outside the visual layer.</li>
<li>Record action results and multi-tick outcomes separately.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement path heatmaps, terrain overlays, battle replays, Segment-backed visual archives, browser screenshots, or live CPU benchmarks. The visual layer remains a current-tick diagnostic tool.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can a RoomVisual be drawn in an invisible room?</h3>
<p>Known coordinates can be drawn, but no live room data is granted.</p>
<h3>Why use 480,000 instead of 512,000?</h3>
<p>It is an example safety margin below the official ceiling.</p>
<h3>Should visuals run every tick?</h3>
<p>Only when the diagnostic value justifies their CPU and byte cost. Use switches and sampling.</p>
<h3>Can export create permanent history automatically?</h3>
<p>No. Your code must store, timestamp, expire, and re-import the string.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#RoomVisual" rel="nofollow">API Reference: RoomVisual</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.getSize" rel="nofollow">API Reference: RoomVisual.getSize()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.export" rel="nofollow">API Reference: RoomVisual.export()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomVisual.import" rel="nofollow">API Reference: RoomVisual.import()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.cpu.getUsed" rel="nofollow">API Reference: Game.cpu.getUsed()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
