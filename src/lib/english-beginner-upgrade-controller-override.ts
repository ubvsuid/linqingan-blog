export const englishBeginnerUpgradeControllerArticleOverrides = {
  "screeps-upgrade-controller": {
    title: "Screeps upgradeController(): Build Your First Upgrader Loop",
    headline: "How to Make a Screeps Creep Upgrade the Room Controller",
    description:
      "Build one Upgrader1 loop that harvests from an active Source, moves within Controller range 3, spends Energy with upgradeController(), and switches state across ticks.",
    category: "GETTING STARTED · BEGINNER LESSON 9 OF 12",
    readingTime: "10 min read",
    breadcrumbLabel: "upgradeController()",
    tags: ["Controllers", "Creeps", "Energy"],
    keywords: [
      "Screeps upgradeController",
      "Creep.upgradeController()",
      "Screeps Upgrader code",
      "creep.memory.upgrading",
      "FIND_SOURCES_ACTIVE",
      "Room Controller range 3",
    ],
    primaryKeyword: "Screeps upgradeController",
    searchIntent:
      "Beginner action tutorial for running one fixed-name Upgrader between an active Source and an owned Room Controller across repeated ticks",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["upgradeController() range and codes", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["State transitions", "Reviewed"],
      ["State impact", "Writes one Memory flag and submits Creep actions"],
      ["Screeps Console", "Pending — no live output is claimed"],
      ["Live multi-tick round trip", "Pending"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["requirements", "Requirements"],
      ["controller-action", "How upgrading works"],
      ["state", "Two-state Memory rule"],
      ["complete-code", "Complete Upgrader loop"],
      ["tick-flow", "Tick-by-tick flow"],
      ["return-codes", "Return codes"],
      ["verify-cycle", "Verify one round trip"],
      ["common-failures", "Common failures"],
      ["completion-check", "Completion check"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">Build one complete Upgrader round trip</h2>
<p>This lesson has one observable goal: make <code>Upgrader1</code> harvest Energy, travel to the owned Room Controller, spend that Energy with <code>upgradeController()</code>, and return to harvesting when empty.</p>
<blockquote><p><strong>Empty → harvest. Full → upgrade. Partly full → continue the current trip.</strong></p></blockquote>
<p>The previous lesson explained that Upgrader is a player-defined responsibility. This lesson supplies the repeated behavior that makes the label useful.</p>
<p><strong>Lesson boundary:</strong> the example uses one fixed Creep name and the first currently active Source. It does not optimize Source assignment, Controller throughput, Containers, Links, or automatic replacement.</p>

<h2 id="requirements">Confirm the Creep and room can run the lesson</h2>
<ul>
<li><code>Upgrader1</code> exists and has finished spawning.</li>
<li>The Creep has active <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code> parts.</li>
<li>The current room has a Controller that belongs to you.</li>
<li>At least one Source is active when the Creep needs Energy.</li>
</ul>
<p>Create the Creep with the previous <a href="/en/blog/screeps-spawn-creep">spawnCreep() lesson</a> when it does not exist. Keep the name in that spawn request and this main loop identical.</p>
<p>The learning body <code>[WORK, CARRY, MOVE]</code> is enough for this first cycle: WORK harvests and upgrades, CARRY provides the Energy Store, and MOVE allows travel.</p>

<h2 id="controller-action">Understand what upgradeController() actually does</h2>
<p><code>creep.room.controller</code> returns the Controller in the Creep's current room. Calling <code>creep.upgradeController(controller)</code> spends carried Energy through active WORK parts and adds upgrade progress when the target is valid.</p>
<p>The action works within range 3. That is different from <code>harvest()</code>, which requires the Creep to be adjacent to the Source.</p>
<div class="table-scroll"><table>
<thead><tr><th>Action</th><th>Required range</th><th>Resource effect</th></tr></thead>
<tbody>
<tr><td><code>harvest(source)</code></td><td>1</td><td>Adds Energy to available CARRY capacity.</td></tr>
<tr><td><code>upgradeController(controller)</code></td><td>3</td><td>Spends carried Energy on Controller progress.</td></tr>
</tbody>
</table></div>
<p>This is why the movement code below requests range 1 for the Source but range 3 for the Controller.</p>

<h2 id="state">Keep one two-state rule in Creep Memory</h2>
<p><code>creep.memory.upgrading</code> is a small persistent flag. It prevents the Creep from reversing direction after every individual unit of Energy changes.</p>
<div class="table-scroll"><table>
<thead><tr><th>Store condition</th><th>Saved state</th><th>Next responsibility</th></tr></thead>
<tbody>
<tr><td>No carried Energy</td><td><code>false</code></td><td>Find an active Source and harvest.</td></tr>
<tr><td>No free Energy capacity</td><td><code>true</code></td><td>Move within range 3 and upgrade.</td></tr>
<tr><td>Partly full</td><td>Keep the existing value</td><td>Finish the current harvest or upgrade trip.</td></tr>
</tbody>
</table></div>
<p>An undefined flag behaves like false in the branch below, so a new empty Upgrader begins by harvesting. Review <a href="/en/blog/screeps-memory-basics">Screeps Memory basics</a> when you want to inspect how the value persists.</p>

<h2 id="complete-code">Run the complete Upgrader1 loop</h2>
<p><strong>State impact:</strong> this main loop writes <code>creep.memory.upgrading</code>, moves the Creep, harvests Energy, and submits Controller upgrade actions.</p>
<pre><code class="language-javascript">const CREEP_NAME = 'Upgrader1';

function reportEveryTwentyTicks(message) {
  if (Game.time % 20 === 0) {
    console.log(message);
  }
}

function moveWithinRange(creep, target, range, label) {
  const moveResult = creep.moveTo(target, {
    range: range,
    reusePath: 5
  });

  if (moveResult !== OK && moveResult !== ERR_TIRED) {
    reportEveryTwentyTicks(
      creep.name + ' moveTo(' + label + ') returned ' + moveResult + '.'
    );
  }
}

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep) {
    reportEveryTwentyTicks(
      CREEP_NAME + ' was not found. Create it or check the exact name.'
    );
    return;
  }

  if (creep.spawning) {
    return;
  }

  if (creep.getActiveBodyparts(WORK) === 0 ||
      creep.getActiveBodyparts(CARRY) === 0 ||
      creep.getActiveBodyparts(MOVE) === 0) {
    reportEveryTwentyTicks(
      CREEP_NAME + ' needs active WORK, CARRY, and MOVE parts.'
    );
    return;
  }

  const controller = creep.room.controller;

  if (!controller || !controller.my) {
    reportEveryTwentyTicks(
      CREEP_NAME + ' cannot find an owned Controller in ' +
      creep.room.name + '.'
    );
    return;
  }

  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY);
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY);

  if (usedEnergy === 0) {
    creep.memory.upgrading = false;
  } else if (freeEnergy === 0) {
    creep.memory.upgrading = true;
  }

  if (creep.memory.upgrading) {
    const upgradeResult =
      creep.upgradeController(controller);

    if (upgradeResult === ERR_NOT_IN_RANGE) {
      moveWithinRange(creep, controller, 3, 'Controller');
    } else if (upgradeResult === ERR_NOT_ENOUGH_RESOURCES) {
      creep.memory.upgrading = false;
    } else if (upgradeResult !== OK) {
      reportEveryTwentyTicks(
        CREEP_NAME + ' upgradeController() returned ' +
        upgradeResult + '.'
      );
    }

    return;
  }

  const activeSources =
    creep.room.find(FIND_SOURCES_ACTIVE);
  const source = activeSources[0];

  if (!source) {
    reportEveryTwentyTicks(
      CREEP_NAME + ' is waiting for an active Source.'
    );
    return;
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    moveWithinRange(creep, source, 1, 'Source');
  } else if (harvestResult !== OK &&
             harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
    reportEveryTwentyTicks(
      CREEP_NAME + ' harvest() returned ' +
      harvestResult + '.'
    );
  }
};</code></pre>

<h2 id="tick-flow">Follow the loop across repeated ticks</h2>
<ol>
<li>The main loop finds <code>Upgrader1</code> and validates its body and owned Controller.</li>
<li>An empty Store sets <code>upgrading</code> to false.</li>
<li>The Creep selects a currently active Source.</li>
<li><code>harvest()</code> returns <code>ERR_NOT_IN_RANGE</code> until the Creep reaches range 1, so <code>moveTo()</code> advances it across later ticks.</li>
<li>A full Store sets <code>upgrading</code> to true.</li>
<li><code>upgradeController()</code> returns <code>ERR_NOT_IN_RANGE</code> until the Creep is within range 3.</li>
<li>Successful upgrade actions consume Energy across later ticks.</li>
<li>When the Store reaches zero, the next tick switches back to harvesting.</li>
</ol>
<p>The code does not attempt to harvest and upgrade in the same branch. Each tick reads current state and submits the action appropriate for that state.</p>

<h2 id="return-codes">Read the important action results</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning in this lesson</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The action was scheduled.</td><td>Inspect the Creep and Controller on later ticks.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is outside the action range.</td><td>Move to range 1 for Source or range 3 for Controller.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep has no Energy for upgrading, or the Source has no available Energy for harvesting.</td><td>Change state or wait for an active Source.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active WORK part can perform the action.</td><td>Inspect body damage or the original body design.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target cannot currently accept that action.</td><td>Inspect the target and Controller state.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Controller is not owned by you.</td><td>Stop this beginner loop in that room.</td></tr>
</tbody>
</table></div>
<p>Use the <a href="/en/blog/screeps-err-not-in-range">ERR_NOT_IN_RANGE guide</a> when movement succeeds but the action never becomes valid.</p>

<h2 id="verify-cycle">Verify one full Source-to-Controller cycle</h2>
<p>Do not treat a single <code>OK</code> return value as proof of the whole loop. Watch several later ticks and confirm this sequence:</p>
<ol>
<li><code>Upgrader1</code> approaches an active Source while empty.</li>
<li>Its Energy Store increases.</li>
<li><code>memory.upgrading</code> becomes true only when the Store is full.</li>
<li>The Creep stops within range 3 of the owned Controller.</li>
<li>Its carried Energy decreases while Controller progress increases.</li>
<li>The flag becomes false after the Store reaches zero.</li>
<li>The Creep returns to an active Source.</li>
</ol>
<p>Completing this full round trip is the acceptance test for the lesson. The page does not claim that this sequence has been run in a live Screeps room.</p>

<h2 id="common-failures">Diagnose the first failures without adding more systems</h2>
<div class="table-scroll"><table>
<thead><tr><th>Symptom</th><th>First evidence to inspect</th></tr></thead>
<tbody>
<tr><td>The Creep never leaves the Source.</td><td>Check Store capacity and whether <code>memory.upgrading</code> becomes true when full.</td></tr>
<tr><td>The Creep reaches the Controller but does not upgrade.</td><td>Check carried Energy, active WORK, ownership, range, and <code>upgradeResult</code>.</td></tr>
<tr><td>The Creep changes direction too early.</td><td>Confirm the partially full state preserves the previous flag.</td></tr>
<tr><td>The Creep waits beside an empty Source.</td><td>Confirm the code uses <code>FIND_SOURCES_ACTIVE</code>, not a permanently fixed depleted Source.</td></tr>
<tr><td>The Console repeats the same message every tick.</td><td>Keep throttled diagnostics while fixing the underlying missing object or body part.</td></tr>
</tbody>
</table></div>
<p>Do not add Builder, repair, population control, or Link logic until this one cycle is observable.</p>

<h2 id="completion-check">Finish the lesson, then build the first Extension</h2>
<p>You have completed Lesson 9 when you can explain and observe all of the following:</p>
<ul>
<li><code>upgradeController()</code> spends carried Energy and works within range 3;</li>
<li><code>harvest()</code> requires range 1;</li>
<li><code>creep.memory.upgrading</code> preserves one responsibility across ticks;</li>
<li>empty and full Store boundaries switch the state;</li>
<li>the code validates the Creep, active body parts, active Source, and owned Controller;</li>
<li>one full harvest-upgrade-harvest round trip is visible across later ticks.</li>
</ul>
<p>Continue to <a href="/en/blog/screeps-first-extension">build the first Extension after reaching RCL 2 →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review all twelve lessons.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow noopener noreferrer">Screeps Documentation: Room Controller Level</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow noopener noreferrer">Screeps API: Creep.upgradeController()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow noopener noreferrer">Screeps API: Creep.memory</a></li>
</ul>`,
  },
} as const;
