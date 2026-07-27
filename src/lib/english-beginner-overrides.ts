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
} as const;
