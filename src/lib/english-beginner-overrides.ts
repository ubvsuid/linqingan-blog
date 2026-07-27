export const englishBeginnerArticleOverrides = {
  "screeps-introduction": {
    title: "What Is Screeps? A Programming Strategy Game",
    headline: "What Is Screeps? How the Programming Strategy Game Works",
    description:
      "Learn what Screeps is, how JavaScript controls its persistent world, and how Rooms, Creeps, Sources, Spawns, and Controllers work together for new players.",
    category: "GETTING STARTED · BEGINNER LESSON 1 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "What is Screeps?",
    tags: ["Screeps", "JavaScript", "Creeps", "Energy"],
    keywords: [
      "what is Screeps",
      "Screeps programming game",
      "how Screeps works",
      "Screeps beginner guide",
      "Screeps World",
      "JavaScript strategy game",
    ],
    primaryKeyword: "what is Screeps",
    searchIntent:
      "Beginner concept explanation of what Screeps is and how its persistent JavaScript-controlled world works",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["Current game concepts", "Checked"],
      ["JavaScript syntax", "Not applicable — no executable code"],
      ["Screeps Console", "Pending — not required for this concept article"],
      ["Live multi-tick test", "Pending — no runtime result is claimed"],
      ["Last verified", "July 26, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["what-is-screeps", "What is Screeps?"],
      ["how-code-changes-the-game", "How code changes the game"],
      ["five-core-objects", "Five core objects"],
      ["first-energy-loop", "The first Energy loop"],
      ["what-the-player-does", "What the player does"],
      ["what-not-to-learn-yet", "What not to learn yet"],
      ["where-to-go-next", "Where to go next"],
      ["key-takeaway", "Key takeaway"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="what-is-screeps">What is Screeps?</h2>
<p>Screeps: World is a persistent multiplayer real-time strategy game controlled primarily through JavaScript. Instead of directing every unit with repeated clicks, you write rules that inspect the current game state and decide what your colony should do next.</p>
<p>This introduction explains the game’s basic control model, the five objects a new player should recognize, and the first Energy loop that keeps a room developing. You do not need to write code or memorize any API methods yet.</p>
<p>Screeps combines a shared strategy world with programmable automation. Players establish colonies, gather resources, create units, develop rooms, claim territory, and interact with other players. The defining difference is how those colonies are controlled: your units and structures follow JavaScript decisions that you write.</p>
<p>In a conventional strategy game, you normally select a unit and issue its next command yourself. In Screeps, you describe the conditions under which a unit should act. A worker might harvest when it has free capacity, deliver Energy when full, and choose another task when its original target disappears.</p>
<p>Your script is evaluated once during each game tick. It reads the current world state and submits actions for your Creeps and structures. Those commands are not completed instantly while the script is running; the game processes them after player scripts have finished for that tick.</p>

<h2 id="how-code-changes-the-game">How code changes the way you play</h2>
<p>Programming does not replace strategy. It moves strategic decisions into a system that can keep making them without constant manual input.</p>
<p>You decide where Energy should go, which jobs matter most, when a new Creep is worth its cost, and how the room should respond when conditions change. A successful colony therefore depends on more than valid JavaScript syntax. It also needs sensible priorities, observable state, and recovery behavior.</p>
<p>In Screeps: World, deployed scripts continue to run while you are offline. The Simulation Room is an exception. Persistent execution also does not guarantee that a colony will remain healthy: code can still fail to replace a dead Creep, lose a target, send units into traffic, or spend Energy on the wrong task.</p>

<h2 id="five-core-objects">Five objects to recognize first</h2>
<p>Screeps contains many objects and systems, but a new player can understand the first room by starting with five.</p>
<div class="table-scroll"><table>
<thead><tr><th>Object</th><th>Plain-English meaning</th><th>Why it matters at the beginning</th></tr></thead>
<tbody>
<tr><td><code>Room</code></td><td>A 50×50 area of the game world.</td><td>It contains terrain, resources, Creeps, structures, and the space in which your first colony operates.</td></tr>
<tr><td><code>Source</code></td><td>A basic deposit of Energy.</td><td>A Creep with an active <code>WORK</code> body part can harvest it to begin the room’s resource flow.</td></tr>
<tr><td><code>Creep</code></td><td>A programmable unit built from body parts.</td><td>Its body determines what it can do, while your code determines which action it attempts.</td></tr>
<tr><td><code>Spawn</code></td><td>A player-owned structure that creates Creeps.</td><td>It uses the room’s available Energy to produce new units for the colony.</td></tr>
<tr><td><code>Controller</code></td><td>The object associated with room ownership and Room Controller Level.</td><td>Upgrading it develops the room and unlocks additional structure capacity and capabilities.</td></tr>
</tbody></table></div>
<p>Names such as Harvester, Builder, and Upgrader are conventions created by players. They are not automatic classes assigned by the game. A Creep called <code>Builder</code> will build only when your code gives it a suitable body, target, and <code>build()</code> action.</p>

<h2 id="first-energy-loop">How the first room Energy loop works</h2>
<p>The earliest room economy can be understood as a repeating flow:</p>
<p><strong>Source → Creep → room tasks → more Creeps and room progress.</strong></p>
<ol>
<li>A Creep reaches a Source and harvests Energy.</li>
<li>The Creep transfers that Energy to a Spawn or Extension, or spends the Energy it carries on actions such as building and upgrading.</li>
<li>The Spawn uses available room Energy to create additional Creeps.</li>
<li>Other Creeps can upgrade the Controller, build structures, repair damage, or support the room’s resource flow.</li>
<li>As the Room Controller Level increases, the room gains access to more structure capacity and more advanced systems.</li>
</ol>
<p>None of this happens simply because the objects exist. Your code must choose a Creep, inspect its state, select a target, submit an action, and make another decision on a later tick.</p>

<h2 id="what-the-player-does">What do you actually do as the player?</h2>
<p>At the beginning, your job is to turn a few visible objects into a small system that can repeat useful work.</p>
<ul>
<li>Observe what exists in the current room.</li>
<li>Write one small rule for one Creep.</li>
<li>Watch what happens over several ticks.</li>
<li>Read return values, logs, and changing object state.</li>
<li>Adjust priorities when the room needs Energy, workers, construction, or Controller progress.</li>
<li>Add recovery behavior when a Creep dies, a target disappears, or the room lacks enough resources.</li>
</ul>
<p>You are not expected to design a complete artificial intelligence on the first day. A readable room that can harvest, deliver Energy, replace a basic worker, and continue across ticks is already a meaningful first system.</p>

<h2 id="what-not-to-learn-yet">What you do not need to learn yet</h2>
<p>This first lesson deliberately stops before the code editor, Console commands, body design, movement, return codes, Memory, markets, combat, and multi-room architecture. Each of those topics becomes easier after the basic game model is clear.</p>
<p><strong>Beginner boundary:</strong> start with one visible room and one observable task. An elaborate role framework or multi-room architecture may look impressive, but it makes early mistakes harder to understand.</p>

<h2 id="where-to-go-next">Where to go next</h2>
<ol>
<li>Open <a href="/en/blog/screeps-first-room">the first-room guide</a> to find the room view, code editor, Console, Spawn, Source, Controller, and owned Creeps.</li>
<li>Read <a href="/en/blog/screeps-tick-game-loop">the tick and game-loop guide</a> to understand why your script runs again and why actions often require several ticks.</li>
<li>Continue to <a href="/en/blog/screeps-creep-harvest-energy">the first harvesting tutorial</a> when you are ready to control a Creep with working JavaScript.</li>
</ol>
<p>The <a href="/en/beginner">English beginner roadmap</a> keeps all twelve lessons in order. Use the <a href="/en/glossary">Screeps glossary</a> when you need a short definition of Creep, Spawn, Controller, tick, Store, or another core term.</p>

<h2 id="key-takeaway">The key idea to remember</h2>
<p>Screeps is a persistent strategy game in which JavaScript replaces repeated manual commands. Rooms provide the space, Sources provide Energy, Creeps perform work, Spawns create new Creeps, and Controllers drive room development.</p>
<p>Once your code can connect those objects into a loop that survives changing conditions, you are no longer controlling a single unit. You are operating an automated colony.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/introduction.html" rel="nofollow noopener noreferrer">Screeps Documentation: Introduction</a></li>
<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: Scripting Basics</a></li>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow noopener noreferrer">Screeps Documentation: Control</a></li>
</ul>`,
  },
  "screeps-first-room": {
    title: "Screeps First Room: Find the Editor and Console",
    headline: "How to Find Your First Screeps Room, Editor, and Console",
    description:
      "Find your first Screeps Room, code editor, and Console, then use read-only commands to identify visible Rooms, Spawns, Creeps, Sources, and the Controller.",
    category: "GETTING STARTED · BEGINNER LESSON 2 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "First room and tools",
    tags: ["Screeps", "Rooms", "Console", "JavaScript"],
    keywords: [
      "Screeps first room",
      "Screeps code editor",
      "Screeps Console",
      "Game.rooms",
      "Game.spawns",
      "Game.creeps",
      "Screeps beginner interface",
    ],
    primaryKeyword: "Screeps first room",
    searchIntent:
      "Beginner interface orientation and read-only inspection of the first visible Screeps room and owned game objects",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["Game collections and constants", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["Offline logic review", "Passed"],
      ["Screeps Console", "Pending — replace names with your live account values"],
      ["Current client layout", "Pending — interface placement may change"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["three-work-areas", "Three work areas"],
      ["objects-in-the-room", "Objects in the room"],
      ["read-only-inventory", "Read-only account inventory"],
      ["inspect-one-room", "Inspect one visible Room"],
      ["read-the-result", "Read the result"],
      ["common-results", "Common results"],
      ["completion-check", "Completion check"],
      ["next-lesson", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">What you will complete in this lesson</h2>
<p>This lesson has one practical goal: locate the room view, code editor, and Console, then connect the objects you see on screen with the names your JavaScript can read.</p>
<p>You will not move a Creep, change Memory, create a unit, or submit any other game action. Every Console example below is read-only.</p>
<p>The Screeps client can change over time, so this guide focuses on what each area does rather than promising that a button will always remain in one exact position.</p>

<h2 id="three-work-areas">Find the three work areas</h2>
<h3>The room view</h3>
<p>The room view shows terrain, resources, Creeps, structures, Construction Sites, and the Room Controller. Use it to observe what is happening: whether a Creep is moving, whether a Spawn is producing a unit, and which objects are present in the current Room.</p>
<p>The room view displays results. It does not replace the script that decides what your units and structures should attempt.</p>

<h3>The code editor</h3>
<p>The in-game code editor is where you write and save JavaScript. Screeps executes the active script during each game tick. Later lessons will use <code>module.exports.loop</code> here, but this lesson does not require you to replace or edit existing code.</p>
<p>For now, confirm that you can open the editor and identify the active code branch or module.</p>

<h3>The Console</h3>
<p>The Console is the fastest place to inspect live game objects, read <code>console.log()</code> output, and see runtime errors. It is useful for temporary checks that do not belong in your permanent main loop.</p>
<p><strong>Simple distinction:</strong> the room view shows what the colony looks like, while the Console helps you inspect what the current JavaScript state contains.</p>

<h2 id="objects-in-the-room">Find the core objects in your first Room</h2>
<p>Open a Room that you currently control or can see through your game objects. Look for these four object types.</p>
<div class="table-scroll"><table>
<thead><tr><th>Object</th><th>What to check in the room view</th><th>How code usually finds it</th></tr></thead>
<tbody>
<tr><td><code>Spawn</code></td><td>Its real name and whether it is idle or spawning.</td><td><code>Game.spawns</code> or <code>FIND_MY_SPAWNS</code>.</td></tr>
<tr><td><code>Source</code></td><td>Where the Energy deposit is located.</td><td><code>room.find(FIND_SOURCES)</code>.</td></tr>
<tr><td><code>Controller</code></td><td>Its ownership, level, and position.</td><td><code>room.controller</code>.</td></tr>
<tr><td><code>Creep</code></td><td>Its exact name, body, Store, and remaining life.</td><td><code>Game.creeps</code> or <code>FIND_MY_CREEPS</code>.</td></tr>
</tbody></table></div>
<p>Do not assume that your Spawn is named <code>Spawn1</code> or that a Creep has a name used by an example article. Names are case-sensitive and must match the values in your own account.</p>
<p>If you do not currently own a Creep, do not invent a name and continue. This lesson can still identify the Room, Spawn, Sources, and Controller.</p>

<h2 id="read-only-inventory">Run one read-only account inventory</h2>
<p><strong>State impact:</strong> read-only. This Console snippet reads the current tick and lists object names. It does not move a Creep, create a Creep, submit a structure action, or write to Memory.</p>
<pre><code>const inventory = {
  tick: Game.time,
  visibleRooms: Object.keys(Game.rooms),
  ownedSpawns: Object.keys(Game.spawns),
  ownedCreeps: Object.keys(Game.creeps)
};

console.log(JSON.stringify(inventory, null, 2));</code></pre>
<p><code>Game.spawns</code> is keyed by the names of your Spawns, and <code>Game.creeps</code> is keyed by the names of your Creeps. <code>Game.rooms</code> contains Room objects that are visible to your script during the current tick.</p>
<p>Copy one real Room name from <code>visibleRooms</code>. Do not continue with a placeholder such as <code>W1N1</code> unless that is actually your Room.</p>

<h2 id="inspect-one-room">Inspect one visible Room safely</h2>
<p>Replace the example value with a Room name returned by the first check.</p>
<pre><code>const ROOM_NAME = 'W1N1';
const room = Game.rooms[ROOM_NAME];

if (!room) {
  console.log(
    ROOM_NAME +
    ' is not visible to your script on tick ' +
    Game.time +
    '.'
  );
} else {
  const sources = room.find(FIND_SOURCES);
  const ownedSpawns = room.find(FIND_MY_SPAWNS);
  const ownedCreeps = room.find(FIND_MY_CREEPS);
  const controller = room.controller;

  console.log(JSON.stringify({
    tick: Game.time,
    roomName: room.name,
    sourceCount: sources.length,
    spawnNames: ownedSpawns.map(function (spawn) {
      return spawn.name;
    }),
    creepNames: ownedCreeps.map(function (creep) {
      return creep.name;
    }),
    controller: controller ? {
      id: controller.id,
      my: Boolean(controller.my),
      level: controller.level,
      x: controller.pos.x,
      y: controller.pos.y
    } : null
  }, null, 2));
}</code></pre>
<p>This snippet checks that the Room exists before reading <code>room.controller</code> or calling <code>room.find()</code>. It uses arrays returned by <code>Room.find()</code> and converts owned object references into simple names that are easier to compare with the room view.</p>
<p>The example does not claim a particular Source count, Spawn name, Creep name, Controller level, or Console output. Those values must come from your own current game state.</p>

<h2 id="read-the-result">Connect the Console result to the room view</h2>
<ol>
<li>Match <code>roomName</code> with the Room displayed in the client.</li>
<li>Click each owned Spawn and compare its name with <code>spawnNames</code>.</li>
<li>Count the visible Sources and compare the result with <code>sourceCount</code>.</li>
<li>Compare the owned Creep names with <code>creepNames</code>.</li>
<li>Click the Controller and compare its level and coordinates with the <code>controller</code> object.</li>
</ol>
<p>The purpose is not to memorize property names. It is to understand that the picture in the client and the objects available to JavaScript describe the same current game state.</p>

<h2 id="common-results">How to interpret common results</h2>
<h3>The Room is missing from <code>Game.rooms</code></h3>
<p><code>Game.rooms</code> only contains Rooms currently visible to your script. A Room name stored in Memory or remembered from an earlier visit is not proof that a live <code>Room</code> object exists now. Use the dedicated <a href="/en/blog/screeps-room-visibility">Room visibility guide</a> when this becomes a recurring problem.</p>

<h3><code>Object.keys(Game.spawns)</code> is empty</h3>
<p>The current shard and tick contain no Spawn owned by your account. Confirm that you are viewing the intended shard and account state before running code that assumes a Spawn name.</p>

<h3><code>Object.keys(Game.creeps)</code> is empty</h3>
<p>This is a valid empty result, not a JavaScript error. It means the current tick contains no Creep owned by you. Continue only with checks that do not depend on a named Creep.</p>

<h3>The Console shows <code>undefined</code></h3>
<p>Some Console statements do not return a value. For example, <code>console.log()</code> can print the requested data while the overall expression still evaluates to <code>undefined</code>. Check the printed log and any error message before deciding that the inspection failed.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can do all of the following:</p>
<ul>
<li>explain the difference between the room view, code editor, and Console;</li>
<li>identify a Spawn, Source, Controller, and owned Creep in the room view;</li>
<li>list current visible Rooms, owned Spawns, and owned Creeps;</li>
<li>replace example names with real values from your account;</li>
<li>explain why a missing Room or empty object list must be handled before reading deeper properties.</li>
</ul>

<h2 id="next-lesson">Continue to ticks and the game loop</h2>
<p>The next lesson explains <code>Game.time</code>, <code>module.exports.loop</code>, and why Screeps actions and movement should be observed across later ticks:</p>
<p><a href="/en/blog/screeps-tick-game-loop">Understand Screeps ticks and the game loop →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to see all twelve lessons, or use the <a href="/en/glossary">glossary</a> for short definitions of Room, Spawn, Source, Controller, Creep, and tick.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/introduction.html" rel="nofollow noopener noreferrer">Screeps Documentation: Introduction</a></li>
<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: Scripting Basics</a></li>
<li><a href="https://docs.screeps.com/api/#Game.rooms" rel="nofollow noopener noreferrer">Screeps API: Game.rooms</a></li>
<li><a href="https://docs.screeps.com/api/#Game.spawns" rel="nofollow noopener noreferrer">Screeps API: Game.spawns</a></li>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow noopener noreferrer">Screeps API: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow noopener noreferrer">Screeps API: Room.find()</a></li>
</ul>`,
  },
} as const;
