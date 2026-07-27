export const englishBeginnerCreepRolesArticleOverrides = {
  "screeps-creep-roles": {
    title: "Screeps Creep Roles: Harvester, Upgrader, and Builder",
    headline: "Why Multiple Screeps Creeps Need Simple Roles",
    description:
      "Learn why Harvester, Upgrader, and Builder are player-defined responsibilities, how roles differ from body parts, and why a Creep name does not create behavior.",
    category: "GETTING STARTED · BEGINNER LESSON 8 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "Creep Roles",
    tags: ["Creeps", "JavaScript"],
    keywords: [
      "Screeps Creep roles",
      "Screeps Harvester Upgrader Builder",
      "Screeps role vs body parts",
      "player-defined Creep roles",
      "Game.creeps names",
      "Screeps beginner roles",
    ],
    primaryKeyword: "Screeps Creep roles",
    searchIntent:
      "Beginner concept lesson explaining player-defined Creep responsibilities, fixed-name teaching roles, and the difference between body ability, role, and current action",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["Role terminology", "Player-defined"],
      ["API and action methods", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["State impact", "Read-only example"],
      ["Screeps Console", "Pending — no live output is claimed"],
      ["Live role behavior", "Pending — behavior is implemented in later lessons"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["core-distinction", "Ability, role, and action"],
      ["name-transition", "From Worker1 to role names"],
      ["three-roles", "Three beginner roles"],
      ["same-body", "Same body, different job"],
      ["role-view", "Read-only role view"],
      ["fixed-name-limits", "Limits of fixed names"],
      ["behavior", "Names do not create behavior"],
      ["completion-check", "Completion check"],
      ["next-lesson", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">What you will understand in this lesson</h2>
<p>This lesson has one goal: separate three ideas that beginners often mix together.</p>
<div class="table-scroll"><table>
<thead><tr><th>Idea</th><th>Question it answers</th></tr></thead>
<tbody>
<tr><td>Body parts</td><td>What abilities does this Creep have?</td></tr>
<tr><td>Role</td><td>What job do you want this Creep to focus on?</td></tr>
<tr><td>Current action</td><td>What command does your code submit this tick?</td></tr>
</tbody>
</table></div>
<p>Harvester, Upgrader, and Builder are useful player-defined responsibilities. They are not official regular-Creep classes, and the game does not automatically run a job because a Creep has a certain name.</p>
<p><strong>Lesson boundary:</strong> this article explains task separation. It does not add <code>creep.memory.role</code>, automatic population targets, replacement timing, or role modules.</p>

<h2 id="core-distinction">Body ability, player-defined role, and current action</h2>
<p>Use this rule:</p>
<blockquote><p><strong>Body parts decide what a Creep can do. A role describes what it should mainly do. Your code decides what it attempts on the current tick.</strong></p></blockquote>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Example</th><th>What it does not guarantee</th></tr></thead>
<tbody>
<tr><td>Body</td><td><code>[WORK, CARRY, MOVE]</code></td><td>It does not choose a Source, structure, Controller, or Construction Site.</td></tr>
<tr><td>Role</td><td>Upgrader</td><td>It does not call <code>upgradeController()</code> by itself.</td></tr>
<tr><td>Action</td><td><code>creep.upgradeController(controller)</code></td><td>It does not guarantee success; the return code still matters.</td></tr>
</tbody>
</table></div>
<p>Review <a href="/en/blog/screeps-creep-body-parts">WORK, CARRY, and MOVE</a> when the ability layer is still unclear.</p>

<h2 id="name-transition">Move from Worker1 to role-specific teaching names</h2>
<p>The previous lesson used <code>Worker1</code> to prove that <code>spawnCreep()</code> could create one Creep. From this lesson onward, the beginner path uses three names:</p>
<pre><code class="language-text">Harvester1  - harvest and deliver Energy
Upgrader1   - upgrade the Room Controller
Builder1    - build Construction Sites</code></pre>
<p>If your existing Creep is still named <code>Worker1</code>, you can temporarily use that name wherever the next code examples expect <code>Harvester1</code>. The important lesson is the responsibility, not the spelling of the label.</p>

<h2 id="three-roles">Three simple roles for the beginner room</h2>
<div class="table-scroll"><table>
<thead><tr><th>Teaching name</th><th>Primary responsibility</th><th>Main action methods</th></tr></thead>
<tbody>
<tr><td><code>Harvester1</code></td><td>Collect Energy and deliver it to a Spawn or Extension.</td><td><code>harvest()</code> and <code>transfer()</code></td></tr>
<tr><td><code>Upgrader1</code></td><td>Collect Energy and spend it on the owned Room Controller.</td><td><code>harvest()</code> and <code>upgradeController()</code></td></tr>
<tr><td><code>Builder1</code></td><td>Collect Energy and spend it on a Construction Site.</td><td><code>harvest()</code> and <code>build()</code></td></tr>
</tbody>
</table></div>
<p>An Upgrader does not transfer Energy into a Controller. It spends carried Energy by calling <code>upgradeController()</code>. A Builder likewise spends carried Energy through <code>build()</code>.</p>
<p>A later production design may separate mining from hauling or assign several Creeps to one role. Those optimizations are outside this lesson.</p>

<h2 id="same-body">The same body can support different jobs</h2>
<p>All three beginner roles can start with the same learning body:</p>
<pre><code class="language-javascript">[WORK, CARRY, MOVE]</code></pre>
<p>That body provides the abilities to work, carry resources, and move. The body does not select the destination.</p>
<ul>
<li>Harvester1 moves toward a Source or an Energy structure.</li>
<li>Upgrader1 moves toward a Source or the Room Controller.</li>
<li>Builder1 moves toward a Source or a Construction Site.</li>
</ul>
<p>The target-selection and action code create the behavioral difference.</p>

<h2 id="role-view">Inspect the three teaching roles without changing game state</h2>
<p><strong>State impact:</strong> read-only. This Console snippet checks which fixed-name Creeps currently exist. It does not move, spawn, or modify Memory.</p>
<pre><code class="language-javascript">const beginnerRoles = {
  Harvester1: 'harvest and deliver Energy',
  Upgrader1: 'upgrade the Room Controller',
  Builder1: 'build Construction Sites'
};

const roleView = Object.keys(beginnerRoles).map(function (name) {
  const creep = Game.creeps[name];

  return {
    name: name,
    expectedJob: beginnerRoles[name],
    exists: Boolean(creep),
    roomName: creep ? creep.room.name : null,
    spawning: creep ? creep.spawning : null,
    bodyParts: creep ? creep.body.map(function (part) {
      return part.type;
    }) : []
  };
});

console.log(JSON.stringify(roleView, null, 2));</code></pre>
<p><code>Game.creeps</code> uses Creep names as keys, so a fixed name is convenient for a small teaching example. The output still describes only what exists; it does not prove that the expected behavior code is running.</p>

<h2 id="fixed-name-limits">Understand the limits of fixed-name roles</h2>
<ul>
<li>One exact name identifies only one Creep.</li>
<li>A missing named Creep leaves that teaching job without a worker.</li>
<li>The name does not count several Creeps that share one responsibility.</li>
<li>The responsibility is not stored as structured role data.</li>
<li>The approach does not automatically replace old Creeps or balance room staffing.</li>
</ul>
<p>These are intentional teaching limits. The official documentation shows that persistent information can be stored through Creep Memory, and later architecture can use a field such as <code>creep.memory.role</code>. That belongs after the fixed-name concept is understood.</p>
<p>Use the <a href="/en/blog/screeps-memory-basics">Memory basics guide</a> when you are ready to replace names with structured role data.</p>

<h2 id="behavior">A role name does not run behavior</h2>
<p>A Creep named <code>Harvester1</code> can stand still forever. Its name is only a key and a teaching label.</p>
<p>Behavior appears only when the repeatedly executed game script:</p>
<ol>
<li>finds the Creep;</li>
<li>selects a relevant target;</li>
<li>calls an action method;</li>
<li>reads the return code;</li>
<li>responds again on later ticks.</li>
</ol>
<p>The next three lessons turn the labels into real loops one responsibility at a time.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can explain all of the following:</p>
<ul>
<li><code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code> provide abilities, not jobs;</li>
<li>Harvester, Upgrader, and Builder are player-defined responsibilities;</li>
<li>two Creeps with the same body can perform different jobs;</li>
<li>a name such as <code>Upgrader1</code> does not call <code>upgradeController()</code> automatically;</li>
<li>fixed names are a beginner simplification, not a scalable staffing system.</li>
</ul>

<h2 id="next-lesson">Turn Upgrader1 into the first role-specific loop</h2>
<p>The next lesson creates the first complete responsibility-specific behavior:</p>
<p><a href="/en/blog/screeps-upgrade-controller">Make Upgrader1 harvest Energy and upgrade the Room Controller →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review all twelve lessons in order.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow noopener noreferrer">Screeps Documentation: Creeps and configurable bodies</a></li>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow noopener noreferrer">Screeps API: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Screeps Documentation: Game and Memory objects</a></li>
<li><a href="https://docs.screeps.com/modules.html" rel="nofollow noopener noreferrer">Screeps Documentation: organizing role behavior with modules</a></li>
<li><a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">Screeps Documentation: scripting basics and repeated ticks</a></li>
</ul>`,
  },
} as const;
