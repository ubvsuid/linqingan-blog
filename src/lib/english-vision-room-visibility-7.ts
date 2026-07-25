import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishRoomVisibilityArticle = {
  slug: "screeps-room-visibility",
  path: "/en/blog/screeps-room-visibility",
  chinesePath: "/blog/screeps-room-visibility",
  title: "Screeps Game.rooms Visibility: Why a Room Is Undefined",
  headline: "Why Is Game.rooms[roomName] Undefined in Screeps?",
  description:
    "Understand when a Room exists in Game.rooms, separate current-tick visibility from historical Memory, guard Controller and structure reads, and build a safe visibility-first inspection helper.",
  category: "VISION · GAME.ROOMS AND LIVE OBJECTS",
  publishedAt: "2026-07-25",
  publishedLabel: "July 25, 2026",
  readingTime: "13 min read",
  breadcrumbLabel: "Game.rooms Visibility",
  tags: ["Screeps", "Game.rooms", "Visibility", "Room", "Memory"],
  keywords: [
    "Screeps Game.rooms undefined",
    "Screeps room visibility",
    "Game.rooms roomName",
    "Screeps Memory rooms vs Game rooms",
    "Screeps visible room object",
  ],
  primaryKeyword: "Screeps Game.rooms undefined",
  searchIntent: "Explain why a Room object is missing and inspect visible rooms safely",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Game.rooms contains rooms currently available through visibility"],
    ["Tick boundary", "Game objects are current-tick objects; historical Memory is not live room visibility"],
    ["Object boundary", "Controller, owner, structures, Sources and other Room data are read only after the Room guard"],
    ["JavaScript syntax", "Passed"],
    ["Offline state review", "Passed — visible, invisible, remembered, controllerless, owned and reserved room states"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick visibility test", "Pending"],
    ["Last verified", "July 25, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["what-game-rooms-means", "What Game.rooms actually contains"],
    ["visibility-sources", "What can make a room visible"],
    ["memory-is-not-visibility", "Memory.rooms is not a live Room object"],
    ["safe-read", "Read a room with an explicit guard"],
    ["inspection-helper", "Complete visibility-first inspection helper"],
    ["controller-states", "Handle Controller states separately"],
    ["object-ids", "Object IDs also depend on visibility"],
    ["multi-tick-proof", "Prove visibility across multiple ticks"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Why is Game.rooms[roomName] undefined?",
      "The room is not available to your script in the current tick. A remembered room name or old Memory entry does not create a live Room object.",
    ],
    [
      "Does Memory.rooms[roomName] prove the room is visible?",
      "No. Memory can persist after visibility is lost. Treat it as historical or application-owned data and keep a timestamp when freshness matters.",
    ],
    [
      "Can Game.getObjectById() recover an object in an invisible room?",
      "Not as a live object when the object cannot currently be accessed through visibility. Keep the ID, reacquire vision, and resolve it again.",
    ],
    [
      "Should missing visibility be treated as an empty safe room?",
      "No. Unknown is not empty or safe. Keep missing vision as a distinct state until current data is available.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-map-find-route",
    label: "Previous routing guide",
    title: "Plan a Cross-Room Route",
  },
  next: {
    href: "/en/blog/screeps-observer-observe-room",
    label: "Next vision guide",
    title: "Schedule Observer Vision",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Game.rooms[roomName]</code> is <code>undefined</code> when that room is not available to your script in the current tick. Check the Room before reading its Controller, structures, Sources, hostiles, or terrain-dependent live objects. A value in <code>Memory.rooms[roomName]</code> is historical application data, not proof of current vision.</p>

<h2 id="what-game-rooms-means">What Game.rooms actually contains</h2>
<p><code>Game.rooms</code> is a hash of live <code>Room</code> objects available during the current tick. The global <code>Game</code> object is rebuilt each tick, so a Room reference is not a permanent handle that should be kept in Memory.</p>
<pre><code class="language-javascript">const roomName = 'W2N2';
const room = Game.rooms[roomName];

if (!room) {
  console.log({
    type: 'room-not-visible',
    roomName,
    tick: Game.time
  });
  return;
}

console.log({
  type: 'room-visible',
  roomName: room.name,
  tick: Game.time
});</code></pre>
<p>The guard is not optional defensive style. It is the boundary between “a live Room exists now” and “your code only knows a room name.”</p>

<h2 id="visibility-sources">What can make a room visible</h2>
<p>The official API describes rooms as visible when you have a Creep or an owned structure in them. Other game mechanisms can also make a room available, including an Observer request completed for the current tick. The important application rule is simpler: use the presence of <code>Game.rooms[roomName]</code> as the current-tick fact.</p>
<div class="table-scroll"><table>
<thead><tr><th>State</th><th>What your code may conclude</th></tr></thead>
<tbody>
<tr><td><code>Game.rooms[name]</code> exists</td><td>The Room object is available now</td></tr>
<tr><td>The key is missing</td><td>Current room data is unavailable</td></tr>
<tr><td>A Creep was there previously</td><td>Historical fact only</td></tr>
<tr><td>An Observer request returned <code>OK</code> this tick</td><td>The request was scheduled; read the target next tick</td></tr>
<tr><td>Memory contains room intel</td><td>Saved data exists, with unknown freshness unless timestamped</td></tr>
</tbody></table></div>

<h2 id="memory-is-not-visibility">Memory.rooms is not a live Room object</h2>
<p><code>Memory.rooms</code> may contain data after a room disappears from <code>Game.rooms</code>. That is useful for intel, route policy, source IDs, or your own configuration, but it must not be treated as a current Room snapshot.</p>
<pre><code class="language-javascript">function describeRoomAvailability(roomName) {
  const room = Game.rooms[roomName];
  const remembered = Memory.rooms?.[roomName];

  return {
    roomName,
    visibleNow: Boolean(room),
    hasRememberedData: Boolean(remembered),
    rememberedAt: Number.isInteger(remembered?.observedAt)
      ? remembered.observedAt
      : null
  };
}</code></pre>
<p>Without a timestamp and an explicit data contract, an old entry cannot answer whether the Controller is still owned, whether hostiles are present, or whether a Structure still exists.</p>

<h2 id="safe-read">Read a room with an explicit guard</h2>
<p><strong>State impact:</strong> this example reads live state and logs a bounded summary. It does not write Memory or submit game actions.</p>
<pre><code class="language-javascript">function inspectVisibleRoom(roomName) {
  if (typeof roomName !== 'string' || roomName.length === 0) {
    return {
      status: 'room-name-invalid',
      roomName: null
    };
  }

  const room = Game.rooms[roomName];

  if (!room) {
    return {
      status: 'room-not-visible',
      roomName,
      hasRememberedData: Boolean(
        Memory.rooms?.[roomName]
      )
    };
  }

  const controller = room.controller;

  return {
    status: 'room-visible',
    roomName: room.name,
    controllerPresent: Boolean(controller),
    controllerOwner: controller?.owner?.username ?? null,
    controllerReservation:
      controller?.reservation?.username ?? null,
    controllerLevel: controller?.level ?? 0,
    sourceCount: room.find(FIND_SOURCES).length,
    hostileCount: room.find(FIND_HOSTILE_CREEPS).length
  };
}

module.exports.loop = function () {
  const result = inspectVisibleRoom('W2N2');

  if (Game.time % 50 === 0) {
    console.log(JSON.stringify({
      type: 'room-visibility-check',
      tick: Game.time,
      ...result
    }));
  }
};</code></pre>
<p>The function returns a distinct status instead of replacing missing vision with an empty object. That prevents “unknown” from silently becoming “no hostiles,” “no Controller,” or “no structures.”</p>

<h2 id="inspection-helper">Complete visibility-first inspection helper</h2>
<p>For reusable code, separate the live Room requirement from the business operation. Callers then choose whether to skip, request vision, use stale intel, or retry later.</p>
<pre><code class="language-javascript">function withVisibleRoom(roomName, reader) {
  if (
    typeof roomName !== 'string'
    || typeof reader !== 'function'
  ) {
    return {
      ok: false,
      status: 'arguments-invalid',
      value: null
    };
  }

  const room = Game.rooms[roomName];

  if (!room) {
    return {
      ok: false,
      status: 'room-not-visible',
      value: null
    };
  }

  try {
    return {
      ok: true,
      status: 'read-complete',
      value: reader(room)
    };
  } catch (error) {
    return {
      ok: false,
      status: 'reader-failed',
      value: null,
      message: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}

const result = withVisibleRoom(
  'W2N2',
  room => ({
    roomName: room.name,
    structures: room.find(FIND_STRUCTURES).length
  })
);</code></pre>
<p>The <code>try/catch</code> does not replace correct property checks. It only isolates an application reader so one inspection failure does not crash unrelated role logic.</p>

<h2 id="controller-states">Handle Controller states separately</h2>
<p>A visible room can still have no Controller. Highways and some special rooms are examples where <code>room.controller</code> may be absent. A Controller can also be neutral, reserved, owned by you, or owned by another player.</p>
<div class="table-scroll"><table>
<thead><tr><th>Condition</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>!room</code></td><td>No current Room object</td></tr>
<tr><td><code>room && !room.controller</code></td><td>Visible room without a Controller</td></tr>
<tr><td><code>controller.my</code></td><td>Your owned Controller</td></tr>
<tr><td><code>controller.owner</code></td><td>An owned Controller</td></tr>
<tr><td><code>controller.reservation</code></td><td>A reservation exists</td></tr>
</tbody></table></div>
<p>Do not combine these states into one truthy test when ownership, reservation, or room type changes behavior.</p>

<h2 id="object-ids">Object IDs also depend on visibility</h2>
<p>An ID stored in Memory remains a string, but resolving it with <code>Game.getObjectById()</code> can return <code>null</code> when the object is unavailable. Keep the ID, distinguish missing vision from confirmed deletion when possible, and resolve it again after vision returns.</p>
<pre><code class="language-javascript">function resolveRememberedTarget(roomName, targetId) {
  const visible = Boolean(Game.rooms[roomName]);
  const target = targetId
    ? Game.getObjectById(targetId)
    : null;

  if (!visible) {
    return {
      status: 'room-not-visible',
      target: null
    };
  }

  return target
    ? { status: 'target-visible', target }
    : { status: 'target-missing-in-visible-room', target: null };
}</code></pre>
<p>When the room is visible and the expected object is still missing, your code has stronger evidence that the target was destroyed, expired, moved out of scope, or the stored ID is wrong.</p>

<h2 id="multi-tick-proof">Prove visibility across multiple ticks</h2>
<p>A single log line proves only one tick. To debug intermittent visibility, record a compact transition history rather than writing entire Room objects.</p>
<pre><code class="language-javascript">function recordVisibility(roomName) {
  Memory.visibilityHistory ??= {};
  const history = Memory.visibilityHistory[roomName]
    ?? [];

  history.push({
    tick: Game.time,
    visible: Boolean(Game.rooms[roomName])
  });

  Memory.visibilityHistory[roomName] =
    history.slice(-20);
}</code></pre>
<p><strong>State impact:</strong> this writes a bounded Memory history. Twenty entries is an example limit, not an official recommendation.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Verify the exact room-name string.</li>
<li>Check <code>Game.rooms[roomName]</code> before every Room property chain.</li>
<li>Keep missing vision distinct from an empty room.</li>
<li>Do not use <code>Memory.rooms</code> as current visibility.</li>
<li>Timestamp saved intel.</li>
<li>Check <code>room.controller</code> before owner or reservation fields.</li>
<li>Resolve stored object IDs only after considering room visibility.</li>
<li>Log state transitions across ticks for intermittent cases.</li>
<li>Use an Observer or another vision source when current data is required.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement Observer scheduling, room-intel expiration policy, portals, shard travel, map status, or hostile-risk scoring. Continue with <a href="/en/blog/screeps-observer-observe-room">StructureObserver.observeRoom() timing and request state</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is an undefined Room a JavaScript error?</h3>
<p>No. It is a normal state when the room is not available in the current tick. The error occurs only when code dereferences it without a guard.</p>
<h3>Can old Memory fill in the live Room object?</h3>
<p>No. Memory can provide your saved summary, not current game objects.</p>
<h3>Should invisible mean safe?</h3>
<p>No. Treat it as unknown.</p>
<h3>What should request fresh visibility?</h3>
<p>A Creep, owned vision-providing object, Observer workflow, or another applicable game mechanism must make the room available.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game-rooms" rel="nofollow">API Reference: Game.rooms</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Screeps Documentation: Global Objects</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game Loop and Ticks</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
