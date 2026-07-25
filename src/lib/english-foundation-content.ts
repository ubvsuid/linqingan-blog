import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishFoundationArticles = [
  {
    slug: "screeps-memory-basics",
    path: "/en/blog/screeps-memory-basics",
    chinesePath: "/blog/screeps-memory-basics",
    title: "Screeps Memory Explained: Save Creep Roles Across Ticks",
    headline: "How Screeps Memory Saves Creep Roles and Working State",
    description:
      "Learn why ordinary variables do not preserve Screeps state, how creep.memory maps to Memory.creeps, what data belongs in Memory, and why object IDs are safer than live game objects.",
    category: "FOUNDATION · MEMORY",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "12 min read",
    breadcrumbLabel: "Screeps Memory Basics",
    tags: ["Screeps", "Memory", "Creep", "JavaScript", "Foundation"],
    keywords: [
      "Screeps Memory tutorial",
      "Screeps creep.memory",
      "Screeps save role",
      "Memory.creeps",
      "Screeps state across ticks",
    ],
    primaryKeyword: "Screeps Memory tutorial",
    searchIntent: "Beginner explanation of persistent state and creep memory",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Global Objects, Game.getObjectById(), spawnCreep()"],
      ["API and constants", "Checked"],
      ["JavaScript syntax", "Passed"],
      ["Offline logic review", "Passed — missing Creep, first write, later read, ID recovery"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick room test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["why-variables-reset", "Why ordinary variables are not persistent state"],
      ["memory-object", "What Memory is"],
      ["creep-memory", "How creep.memory maps to Memory.creeps"],
      ["spawn-memory", "Write role Memory when spawning"],
      ["working-state", "Use a boolean working state"],
      ["safe-data", "What belongs in Memory"],
      ["object-ids", "Save object IDs, not live objects"],
      ["dead-creeps", "Why dead Creep Memory can remain"],
      ["complete-example", "Complete beginner example"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does a normal JavaScript variable survive every Screeps tick?",
        "Do not use a local variable as durable game state. Memory is the supported JSON-backed store for information that must be available on later ticks.",
      ],
      [
        "Is creep.memory different from Memory.creeps?",
        "creep.memory is a convenient alias for the entry stored under Memory.creeps[creep.name].",
      ],
      [
        "Can I save a Source or Structure object directly in Memory?",
        "No. Save its id and call Game.getObjectById() on a later tick to recover the current visible object.",
      ],
      [
        "Is working an official Screeps Memory field?",
        "No. working, delivering, and role are player-defined fields. They only affect behavior when your code reads them and chooses actions.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-remove-construction-site",
      label: "Previous English guide",
      title: "Remove a Construction Site Safely",
    },
    next: {
      href: "/en/blog/screeps-withdraw-container-energy",
      label: "Next foundation guide",
      title: "Withdraw Energy from a Container",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Game</code> describes the current tick, while <code>Memory</code> stores JSON-compatible data for later ticks. A Creep's <code>memory</code> property is a convenient view of <code>Memory.creeps[creep.name]</code>. Use it for small facts such as a role, a working-state flag, a target ID, or a home-room name. Do not save a live Source, Creep, or Structure object in Memory.</p>

<h2 id="why-variables-reset">Why ordinary variables are not persistent state</h2>
<p>The main loop runs again on every tick. A variable created inside that loop is created again when the loop runs again:</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  let working = false;

  if (working) {
    console.log('The Creep is working.');
  }
};</code></pre>
<p>This example always starts with <code>working</code> set to <code>false</code>. It is useful as current-execution data, but it does not represent a durable decision. Review <a href="/en/blog/screeps-tick-game-loop">how ticks and module.exports.loop work</a> before using cross-tick state.</p>

<h2 id="memory-object">What the Memory object is</h2>
<p>Screeps provides the global <code>Memory</code> object for JSON-compatible information that must be available later:</p>
<pre><code class="language-javascript">Memory.exampleValue = 1;
console.log(Memory.exampleValue);</code></pre>
<p>Official documentation explains that <code>Game</code> is rebuilt for the current tick, whereas changes written through <code>Memory</code> are serialized and passed forward. Memory is limited, and reading it has a parsing cost, so this beginner guide stores only small values.</p>

<h2 id="creep-memory">How creep.memory maps to Memory.creeps</h2>
<pre><code class="language-javascript">const creep = Game.creeps.Harvester1;

if (creep) {
  creep.memory.role = 'harvester';

  console.log(creep.memory.role);
  console.log(Memory.creeps[creep.name].role);
}</code></pre>
<p>Both reads point to the same Creep Memory entry. The role string does not create an official class. It is a label that your own code can use while iterating over <code>Game.creeps</code>:</p>
<pre><code class="language-javascript">for (const name in Game.creeps) {
  const creep = Game.creeps[name];

  if (creep.memory.role === 'harvester') {
    console.log(creep.name + ' is assigned to harvesting.');
  }
}</code></pre>
<p>See <a href="/en/blog/screeps-creep-roles">the beginner role guide</a> for the difference between body abilities and player-defined jobs.</p>

<h2 id="spawn-memory">Write role Memory when spawning</h2>
<p><code>StructureSpawn.spawnCreep()</code> accepts an options object that can include initial Memory:</p>
<pre><code class="language-javascript">const result = Game.spawns.Spawn1.spawnCreep(
  [WORK, CARRY, MOVE],
  'Harvester1',
  {
    memory: {
      role: 'harvester',
      working: false
    }
  }
);

console.log('spawnCreep() returned ' + result);</code></pre>
<p>This creates the Memory entry as part of the spawn request. The method still needs its normal name, body, energy, and return-code checks. Review <a href="/en/blog/screeps-spawn-creep">the spawnCreep() tutorial</a> before adding role-based replacement logic.</p>

<h2 id="working-state">Use a boolean working state</h2>
<p><code>working</code> is a player-defined field that commonly separates an Energy-acquisition phase from an Energy-spending phase:</p>
<pre><code class="language-javascript">const usedEnergy =
  creep.store.getUsedCapacity(RESOURCE_ENERGY);

const freeEnergy =
  creep.store.getFreeCapacity(RESOURCE_ENERGY);

if (usedEnergy === 0) {
  creep.memory.working = false;
}

if (freeEnergy === 0) {
  creep.memory.working = true;
}</code></pre>
<p>Your script must then read the flag and call the appropriate API. Writing <code>creep.memory.working = true</code> does not automatically call <code>build()</code>, <code>transfer()</code>, or <code>upgradeController()</code>. The same pattern appears in <a href="/en/blog/screeps-transfer-energy-to-spawn">the Energy-delivery tutorial</a>.</p>

<h2 id="safe-data">What belongs in Memory</h2>
<div class="table-scroll"><table>
<thead><tr><th>Good beginner values</th><th>Why</th></tr></thead>
<tbody>
<tr><td><code>'harvester'</code></td><td>Small role string.</td></tr>
<tr><td><code>true</code> or <code>false</code></td><td>Simple working-state decision.</td></tr>
<tr><td><code>'E51S44'</code></td><td>Room name that can be checked later.</td></tr>
<tr><td>A game object ID string</td><td>Lets later code recover the current object.</td></tr>
<tr><td>Small arrays or plain objects</td><td>Remain JSON-compatible when deliberately bounded.</td></tr>
</tbody></table></div>
<p>Functions, circular values, and live game objects do not belong in Memory. Large caches and RawMemory performance work are outside this beginner article.</p>

<h2 id="object-ids">Save object IDs, not live game objects</h2>
<p>A Source object belongs to the current visible game state. Save its ID instead:</p>
<pre><code class="language-javascript">const source = creep.pos.findClosestByRange(FIND_SOURCES);

if (source) {
  creep.memory.sourceId = source.id;
}</code></pre>
<p>On a later tick, recover the current object and handle <code>null</code>:</p>
<pre><code class="language-javascript">const source = creep.memory.sourceId
  ? Game.getObjectById(creep.memory.sourceId)
  : null;

if (!source) {
  delete creep.memory.sourceId;
}</code></pre>
<p><code>Game.getObjectById()</code> can return <code>null</code> when the object no longer exists or is not currently visible. The ID is durable data; the returned game object is still current-tick data.</p>

<h2 id="dead-creeps">Why dead Creep Memory can remain</h2>
<p><code>Game.creeps</code> and <code>Memory.creeps</code> are related but separate. After a Creep dies, its name disappears from <code>Game.creeps</code>, while the old Memory entry may remain until your code removes it. Do not add automatic deletion before understanding the comparison:</p>
<pre><code class="language-javascript">for (const name in Memory.creeps) {
  if (!Game.creeps[name]) {
    console.log(name + ' exists only in Memory.');
  }
}</code></pre>

<h2 id="complete-example">Complete beginner example</h2>
<p><strong>State impact:</strong> this script writes one role string and one boolean to the selected Creep's Memory. It does not move the Creep or submit a game action.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep) {
    console.log('Harvester1 was not found.');
    return;
  }

  if (creep.memory.role === undefined) {
    creep.memory.role = 'harvester';
  }

  if (creep.memory.working === undefined) {
    creep.memory.working = false;
  }

  console.log(JSON.stringify({
    name: creep.name,
    role: creep.memory.role,
    working: creep.memory.working
  }));
};</code></pre>
<p>Observe the Memory inspector and several later ticks. A real multi-tick room test has not been performed for this article, so the verification panel remains explicit about that boundary.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the Creep exists before reading <code>creep.memory</code>.</li>
<li>Use one spelling and capitalization for every role value.</li>
<li>Remember that custom fields do nothing until your code reads them.</li>
<li>Store JSON-compatible values only.</li>
<li>Store a game object's ID, not the object itself.</li>
<li>Handle <code>Game.getObjectById()</code> returning <code>null</code>.</li>
<li>Expect dead Creep entries to remain until cleanup code removes them.</li>
<li>Use the <a href="/en/screeps-errors">English error-code reference</a> when a later action fails.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not cover RawMemory, segments, parse-cost optimization, global caching, automatic role counts, replacement spawning, or modular role files. Continue with <a href="/en/blog/screeps-withdraw-container-energy">withdrawing Energy from a Container</a>, where Memory can later connect acquisition and delivery states.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does a normal JavaScript variable survive every Screeps tick?</h3>
<p>Do not use a local loop variable as durable game state. Use Memory for information that must be available later.</p>
<h3>Is creep.memory different from Memory.creeps?</h3>
<p><code>creep.memory</code> is a convenient alias for the matching <code>Memory.creeps</code> entry.</p>
<h3>Can I save a Source object directly?</h3>
<p>No. Save <code>source.id</code>, then call <code>Game.getObjectById()</code> on a later tick.</p>
<h3>Is working an official field?</h3>
<p>No. It is a player-defined boolean whose meaning comes entirely from your own branching logic.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow">API Reference: Creep.memory</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
</ul>`,
  },
  {
    slug: "screeps-withdraw-container-energy",
    path: "/en/blog/screeps-withdraw-container-energy",
    chinesePath: "/blog/screeps-creep-withdraw-container-energy",
    title: "Screeps withdraw(): Take Energy from a Container Safely",
    headline: "How to Make a Screeps Creep Withdraw Energy from a Container",
    description:
      "Find a Container that currently holds Energy, check the Creep's free capacity, call withdraw(), handle range and return codes, and keep the delivery task outside this focused guide.",
    category: "FOUNDATION · CONTAINER WITHDRAWAL",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "11 min read",
    breadcrumbLabel: "Withdraw Container Energy",
    tags: ["Screeps", "Creep", "Container", "Energy", "Foundation"],
    keywords: [
      "Screeps withdraw Energy Container",
      "Creep.withdraw tutorial",
      "Screeps Hauler code",
      "ERR_NOT_IN_RANGE withdraw",
      "STRUCTURE_CONTAINER",
    ],
    primaryKeyword: "Screeps withdraw Energy Container",
    searchIntent: "Focused API tutorial and withdrawal troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Creep.withdraw(), Room.find(), StructureContainer"],
      ["API and constants", "Checked"],
      ["JavaScript syntax", "Passed"],
      ["Offline logic review", "Passed — missing Creep, full Store, no Container, range, error logging"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick room test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["direction", "withdraw() and transfer() use opposite directions"],
      ["prerequisites", "Prerequisites and read-only checks"],
      ["find-container", "Find a Container with Energy"],
      ["complete-code", "Complete focused example"],
      ["return-codes", "Return-code troubleshooting"],
      ["next-tick", "Verify Store changes on a later tick"],
      ["why-no-working", "Why this guide does not use working state"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What is the direction of creep.withdraw(container, RESOURCE_ENERGY)?",
        "Energy moves from the Container into the Creep. transfer() moves a resource in the opposite direction.",
      ],
      [
        "Why does withdraw() return ERR_NOT_IN_RANGE?",
        "The Creep must be adjacent to the target. Move toward the Container and retry withdraw() on a later tick.",
      ],
      [
        "Why does withdraw() return ERR_FULL?",
        "The Creep has no free Store capacity for the requested resource.",
      ],
      [
        "Does OK prove the Creep received Energy?",
        "OK means the command was accepted for the tick. Check the Creep and Container Stores on a later tick to verify the state change.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-memory-basics",
      label: "Previous foundation guide",
      title: "Save Creep State with Memory",
    },
    next: {
      href: "/en/blog/screeps-pickup-dropped-energy",
      label: "Next resource guide",
      title: "Pick Up Dropped Energy",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>creep.withdraw(container, RESOURCE_ENERGY)</code> to move Energy from a Container into a Creep. First confirm that the Creep has free Store capacity and that the Container currently holds Energy. If the method returns <code>ERR_NOT_IN_RANGE</code>, move toward the Container and retry on a later tick. Save every return value so withdrawal and movement failures remain distinguishable.</p>

<h2 id="direction">withdraw() and transfer() use opposite directions</h2>
<div class="table-scroll"><table>
<thead><tr><th>Call</th><th>Resource direction</th></tr></thead>
<tbody>
<tr><td><code>creep.withdraw(container, RESOURCE_ENERGY)</code></td><td>Container → Creep</td></tr>
<tr><td><code>creep.transfer(spawn, RESOURCE_ENERGY)</code></td><td>Creep → Spawn</td></tr>
</tbody></table></div>
<p>Use <a href="/en/blog/screeps-transfer-energy-to-spawn">the delivery tutorial</a> when the Creep already carries Energy. This article only handles acquisition from one Container.</p>

<h2 id="prerequisites">Prerequisites and read-only checks</h2>
<p>The example expects a Creep named <code>Hauler1</code> with active <code>CARRY</code> and <code>MOVE</code> parts. Run this read-only Console check before changing the main loop:</p>
<pre><code class="language-javascript">const creep = Game.creeps.Hauler1;

console.log(JSON.stringify({
  creepFound: Boolean(creep),
  spawning: creep ? creep.spawning : null,
  activeCarry: creep ? creep.getActiveBodyparts(CARRY) : null,
  activeMove: creep ? creep.getActiveBodyparts(MOVE) : null,
  freeEnergyCapacity: creep
    ? creep.store.getFreeCapacity(RESOURCE_ENERGY)
    : null
}));</code></pre>
<p>A body may contain a <code>CARRY</code> part while having no active CARRY ability after damage. The complete script checks active parts and Store capacity separately. Review <a href="/en/blog/screeps-creep-body-parts">WORK, CARRY, and MOVE</a> when either value is unexpected.</p>

<h2 id="find-container">Find a Container that currently has Energy</h2>
<pre><code class="language-javascript">function findContainerWithEnergy(creep) {
  return creep.pos.findClosestByPath(
    FIND_STRUCTURES,
    {
      filter: structure =>
        structure.structureType === STRUCTURE_CONTAINER
        && structure.store.getUsedCapacity(
          RESOURCE_ENERGY
        ) > 0
    }
  );
}</code></pre>
<p>The result can be <code>null</code>. A room may contain no Container, every Container may be empty, or no valid path may be available. Do not pass a missing result into <code>withdraw()</code>.</p>

<h2 id="complete-code">Complete focused example</h2>
<p><strong>State impact:</strong> this script may move <code>Hauler1</code> and withdraw Energy from one Container. It does not deliver the Energy afterward and does not write Memory.</p>
<pre><code class="language-javascript">function findContainerWithEnergy(creep) {
  return creep.pos.findClosestByPath(
    FIND_STRUCTURES,
    {
      filter: structure =>
        structure.structureType === STRUCTURE_CONTAINER
        && structure.store.getUsedCapacity(
          RESOURCE_ENERGY
        ) > 0
    }
  );
}

module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;

  if (!creep) {
    console.log('Hauler1 was not found.');
    return;
  }

  if (creep.spawning) {
    return;
  }

  if (creep.getActiveBodyparts(CARRY) <= 0) {
    console.log('Hauler1 has no active CARRY part.');
    return;
  }

  const freeCapacity =
    creep.store.getFreeCapacity(RESOURCE_ENERGY);

  if (freeCapacity === null || freeCapacity <= 0) {
    return;
  }

  const container = findContainerWithEnergy(creep);

  if (!container) {
    console.log(
      'No reachable Container with Energy was found.'
    );
    return;
  }

  const withdrawResult = creep.withdraw(
    container,
    RESOURCE_ENERGY
  );

  if (withdrawResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(container, {
      range: 1,
      reusePath: 5
    });

    if (
      moveResult !== OK
      && moveResult !== ERR_TIRED
    ) {
      console.log(
        'Hauler1 moveTo() returned '
        + moveResult
      );
    }

    return;
  }

  if (withdrawResult !== OK) {
    console.log(
      'Hauler1 withdraw() returned '
      + withdrawResult
    );
  }
};</code></pre>
<p>The target is selected again on later ticks. Its Store can change because another Creep withdraws first, so the filter does not remove the need to inspect the actual API result.</p>

<h2 id="return-codes">Return-code troubleshooting</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning</th><th>Action</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The command was accepted for this tick.</td><td>Inspect both Stores on a later tick.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is not adjacent.</td><td>Move toward it and retry later.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The target lacks the requested resource amount.</td><td>Refresh target and Store data.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The Creep has no free capacity.</td><td>Switch to a delivery task.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The object cannot be used as a withdrawal target.</td><td>Check existence and target type.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning finishes.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type or amount is invalid.</td><td>Inspect the arguments.</td></tr>
</tbody></table></div>
<p>Use the <a href="/en/screeps-errors">English Screeps error-code reference</a> when movement or a less common result needs separate diagnosis.</p>

<h2 id="next-tick">Verify Store changes on a later tick</h2>
<p>Official debugging guidance notes that an accepted command is not the same as a verified final state. Record a before snapshot, submit the action, then inspect the next tick:</p>
<pre><code class="language-javascript">console.log(JSON.stringify({
  tick: Game.time,
  creepEnergy:
    creep.store.getUsedCapacity(RESOURCE_ENERGY),
  containerEnergy:
    container.store.getUsedCapacity(RESOURCE_ENERGY)
}));</code></pre>
<p>Do not assume that the filtered amount remains unchanged. Another Creep may compete for the same Container during the tick.</p>

<h2 id="why-no-working">Why this guide does not use working state</h2>
<p>A <code>working</code> flag is useful when one Creep alternates between acquisition and delivery, but it is not an argument to <code>withdraw()</code>. This guide isolates target selection, capacity checks, action submission, range handling, and return-code logging. Add cross-tick task switching only after the single withdrawal works. See <a href="/en/blog/screeps-memory-basics">Screeps Memory basics</a>.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the Creep name and capitalization.</li>
<li>Wait until the Creep finishes spawning.</li>
<li>Check for at least one active CARRY part.</li>
<li>Check free Store capacity before calling <code>withdraw()</code>.</li>
<li>Filter for <code>STRUCTURE_CONTAINER</code> and positive Energy.</li>
<li>Handle a missing or unreachable target.</li>
<li>Save <code>withdrawResult</code> and <code>moveResult</code> separately.</li>
<li>Retry the action on later ticks instead of expecting one call to finish the trip.</li>
<li>Verify Creep and Container Store changes after the command.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This example does not choose among Containers by logistics priority, reserve targets for multiple haulers, withdraw from Storage, Tombstones, or Ruins, construct Containers, or decide where the Energy should be delivered. Continue with <a href="/en/blog/screeps-pickup-dropped-energy">picking up dropped Energy</a> to learn the separate API for ground resources.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What direction does withdraw() move Energy?</h3>
<p>It moves Energy from the target Container into the calling Creep.</p>
<h3>Why does withdraw() return ERR_NOT_IN_RANGE?</h3>
<p>The Creep must be adjacent. Move toward the target and retry on a later tick.</p>
<h3>Why does withdraw() return ERR_FULL?</h3>
<p>The Creep has no free Store capacity for the selected resource.</p>
<h3>Does OK prove that Energy arrived?</h3>
<p>No. It proves that the API accepted the command. Confirm the Store values after tick processing.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.withdraw" rel="nofollow">API Reference: Creep.withdraw()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">API Reference: Room.find()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureContainer" rel="nofollow">API Reference: StructureContainer</a></li>
<li><a href="https://docs.screeps.com/debugging.html" rel="nofollow">Screeps Documentation: Debugging</a></li>
</ul>`,
  },
  {
    slug: "screeps-pickup-dropped-energy",
    path: "/en/blog/screeps-pickup-dropped-energy",
    chinesePath: "/blog/screeps-creep-pickup-dropped-energy",
    title: "Screeps pickup(): Collect Dropped Energy Safely",
    headline: "How to Make a Screeps Creep Pick Up Dropped Energy",
    description:
      "Filter FIND_DROPPED_RESOURCES for Energy, rank valid piles by collectible amount and path length, handle decay and changing targets, and inspect pickup() and movement results.",
    category: "RESOURCE RECOVERY · DROPPED ENERGY",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "14 min read",
    breadcrumbLabel: "Pick Up Dropped Energy",
    tags: ["Screeps", "Creep", "Energy", "Resource", "Debugging"],
    keywords: [
      "Screeps pickup dropped Energy",
      "Creep.pickup tutorial",
      "FIND_DROPPED_RESOURCES",
      "Screeps Resource decay",
      "ERR_INVALID_TARGET pickup",
    ],
    primaryKeyword: "Screeps pickup dropped Energy",
    searchIntent: "Resource-recovery tutorial and pickup troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Creep.pickup(), Resource, FIND_DROPPED_RESOURCES"],
      ["API and constants", "Checked"],
      ["JavaScript syntax", "Passed"],
      ["Offline logic review", "Passed — capacity, resource type, amount, path, stable sorting"],
      ["Screeps Console test", "Pending"],
      ["Live decay and competition test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["pickup-vs-withdraw", "pickup() is only for ground Resource objects"],
      ["decay", "Dropped resources decay"],
      ["capacity", "Calculate collectible amount"],
      ["selection", "Choose a useful reachable pile"],
      ["complete-code", "Complete focused example"],
      ["changing-targets", "Why the target can change every tick"],
      ["return-codes", "Return-code troubleshooting"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Should a Creep use withdraw() for Energy lying on the ground?",
        "No. Ground resources are Resource objects and require pickup(). withdraw() is for compatible structures, Tombstones, and Ruins.",
      ],
      [
        "Does pickup() accept an amount argument?",
        "No. The target Resource supplies the resource type and available amount; the Creep receives only what can fit.",
      ],
      [
        "Why can a saved dropped-resource target disappear?",
        "Another Creep may collect it, decay may reduce or remove it, or the object may no longer be visible. Recover by ID, validate it, and reselect when necessary.",
      ],
      [
        "Why rank by collectible amount before path length?",
        "That strategy favors filling the Creep. A path-first strategy can be better for urgent cleanup; neither is universally optimal.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-withdraw-container-energy",
      label: "Previous resource guide",
      title: "Withdraw Energy from a Container",
    },
    next: null,
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>creep.pickup(resource)</code> works only on a dropped <code>Resource</code> object. Filter <code>FIND_DROPPED_RESOURCES</code> for <code>RESOURCE_ENERGY</code>, reject zero or invalid amounts, confirm the Creep has active CARRY capacity, and choose a reachable target. If <code>pickup()</code> returns <code>ERR_NOT_IN_RANGE</code>, move within range 1 and retry on a later tick.</p>

<h2 id="pickup-vs-withdraw">pickup() is only for ground Resource objects</h2>
<div class="table-scroll"><table>
<thead><tr><th>Resource location</th><th>API</th></tr></thead>
<tbody>
<tr><td>Ground <code>Resource</code></td><td><code>creep.pickup(resource)</code></td></tr>
<tr><td>Container or Storage</td><td><code>creep.withdraw(target, resourceType)</code></td></tr>
<tr><td>Tombstone or Ruin Store</td><td><code>creep.withdraw(target, resourceType)</code></td></tr>
<tr><td>Source</td><td><code>creep.harvest(source)</code></td></tr>
</tbody></table></div>
<p>Use <a href="/en/blog/screeps-withdraw-container-energy">the Container-withdrawal guide</a> for stored Energy. Passing a ground Resource to <code>withdraw()</code> uses the wrong object type.</p>

<h2 id="decay">Dropped resources decay</h2>
<p>The Chinese source article records the official ground-resource decay rule as:</p>
<pre><code class="language-text">ceil(amount / 1000) per tick</code></pre>
<p>A pile's current <code>amount</code> is a snapshot, not a promise about the amount that will remain when the Creep arrives. Other Creeps can also collect the pile first. Target selection should therefore be repeated or revalidated on later ticks.</p>

<h2 id="capacity">Calculate collectible amount</h2>
<pre><code class="language-javascript">function getCollectibleAmount(
  resourceAmount,
  freeCapacity
) {
  if (
    !Number.isFinite(resourceAmount)
    || !Number.isFinite(freeCapacity)
    || resourceAmount <= 0
    || freeCapacity <= 0
  ) {
    return 0;
  }

  return Math.min(
    resourceAmount,
    freeCapacity
  );
}</code></pre>
<p><code>pickup()</code> has no amount argument. If the pile contains more than the Creep can carry, a successful action collects only what fits and leaves the rest on the ground.</p>

<h2 id="selection">Choose a useful reachable pile</h2>
<p>The source article uses a deliberate strategy: prioritize the amount the Creep can actually collect, then prefer the shorter path, then use the Resource ID as a stable tie-breaker.</p>
<pre><code class="language-javascript">function selectDroppedEnergy(creep) {
  const free =
    creep.store.getFreeCapacity();

  if (!Number.isFinite(free) || free <= 0) {
    return null;
  }

  const resources = creep.room.find(
    FIND_DROPPED_RESOURCES,
    {
      filter: resource =>
        resource.resourceType ===
          RESOURCE_ENERGY
        && Number.isFinite(resource.amount)
        && resource.amount > 0
    }
  );

  const candidates = [];

  for (const resource of resources) {
    const path = creep.pos.findPathTo(
      resource,
      {
        range: 1,
        ignoreCreeps: true
      }
    );

    if (
      path.length === 0
      && !creep.pos.inRangeTo(resource, 1)
    ) {
      continue;
    }

    candidates.push({
      resource,
      collectible: Math.min(
        resource.amount,
        free
      ),
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (
      left.collectible !== right.collectible
    ) {
      return (
        right.collectible
        - left.collectible
      );
    }

    if (
      left.pathLength !== right.pathLength
    ) {
      return (
        left.pathLength
        - right.pathLength
      );
    }

    return left.resource.id.localeCompare(
      right.resource.id
    );
  })[0]?.resource ?? null;
}</code></pre>
<p>This is a “fill the Creep” strategy. A path-first strategy may be more appropriate for urgent cleanup or danger avoidance. Do not claim that one ranking is always optimal.</p>

<h2 id="complete-code">Complete focused example</h2>
<p><strong>State impact:</strong> this script may move <code>Collector1</code> and collect Energy from one ground Resource. It does not reserve targets for other Creeps and does not deliver the collected Energy.</p>
<pre><code class="language-javascript">function selectDroppedEnergy(creep) {
  const free =
    creep.store.getFreeCapacity();

  if (!Number.isFinite(free) || free <= 0) {
    return null;
  }

  const resources = creep.room.find(
    FIND_DROPPED_RESOURCES,
    {
      filter: resource =>
        resource.resourceType ===
          RESOURCE_ENERGY
        && Number.isFinite(resource.amount)
        && resource.amount > 0
    }
  );

  const candidates = [];

  for (const resource of resources) {
    const path = creep.pos.findPathTo(
      resource,
      {
        range: 1,
        ignoreCreeps: true
      }
    );

    if (
      path.length === 0
      && !creep.pos.inRangeTo(resource, 1)
    ) {
      continue;
    }

    candidates.push({
      resource,
      collectible: Math.min(
        resource.amount,
        free
      ),
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (
      left.collectible !== right.collectible
    ) {
      return (
        right.collectible
        - left.collectible
      );
    }

    if (
      left.pathLength !== right.pathLength
    ) {
      return (
        left.pathLength
        - right.pathLength
      );
    }

    return left.resource.id.localeCompare(
      right.resource.id
    );
  })[0]?.resource ?? null;
}

module.exports.loop = function () {
  const creep = Game.creeps.Collector1;

  if (!creep || creep.spawning) {
    return;
  }

  if (creep.getActiveBodyparts(CARRY) <= 0) {
    console.log(
      'Collector1 has no active CARRY part.'
    );
    return;
  }

  const target = selectDroppedEnergy(creep);

  if (!target) {
    return;
  }

  const pickupResult = creep.pickup(target);

  if (pickupResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(target, {
      range: 1,
      reusePath: 5
    });

    if (
      moveResult !== OK
      && moveResult !== ERR_TIRED
    ) {
      console.log(
        'Collector1 moveTo() returned '
        + moveResult
      );
    }

    return;
  }

  if (pickupResult !== OK) {
    console.log(JSON.stringify({
      type: 'dropped-energy-pickup-failed',
      creepName: creep.name,
      resourceId: target.id,
      amountSeen: target.amount,
      pickupResult
    }));
  }
};</code></pre>

<h2 id="changing-targets">Why the target can change every tick</h2>
<ul>
<li>Another Creep may collect it first.</li>
<li>Decay may reduce or remove the pile.</li>
<li>The remaining amount may be lower than the earlier snapshot.</li>
<li>A path that looked open may change.</li>
<li>The object may no longer be in a visible room.</li>
</ul>
<p>When a task must remember the target, save only <code>resource.id</code>. On a later tick, call <code>Game.getObjectById()</code>, handle <code>null</code>, verify <code>resourceType</code> and <code>amount</code>, and select a replacement when needed. Review <a href="/en/blog/screeps-memory-basics">the Memory guide</a> before adding that state.</p>

<h2 id="return-codes">Return-code troubleshooting</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Likely meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The pickup command was accepted.</td><td>Inspect Store and Resource on the next tick.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep is not yours.</td><td>Check the selected Creep.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is spawning.</td><td>Wait.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a current valid Resource.</td><td>Refresh or reselect it.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The Creep has no free capacity.</td><td>Switch to delivery.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is farther than range 1.</td><td>Move closer and retry later.</td></tr>
</tbody></table></div>
<p>Use the <a href="/en/screeps-errors">English error-code reference</a> to separate movement failures from pickup failures.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Use <code>FIND_DROPPED_RESOURCES</code>.</li>
<li>Filter specifically for <code>RESOURCE_ENERGY</code>.</li>
<li>Reject non-finite or non-positive amounts.</li>
<li>Confirm active CARRY capacity.</li>
<li>Do not expect <code>pickup()</code> to accept an amount argument.</li>
<li>Reject unreachable candidates.</li>
<li>Save <code>pickupResult</code> and <code>moveResult</code> separately.</li>
<li>Expect decay and same-tick competition.</li>
<li>Save only the target ID when using Memory.</li>
<li>Add target reservation before assigning many collectors to the same pile.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This article does not cover Tombstones, Ruins, Containers, Storage, multi-resource scavenging, multi-Creep reservations, cross-room recovery, danger avoidance, or delivery after collection. Use <a href="/en/blog/screeps-transfer-energy-to-spawn">the delivery guide</a> when the Collector must unload Energy.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Should I use withdraw() for a ground Resource?</h3>
<p>No. Use <code>pickup()</code> for a dropped Resource and <code>withdraw()</code> for a compatible Store target.</p>
<h3>Does pickup() accept an amount?</h3>
<p>No. The target holds the resource type and amount; the Creep takes only what fits.</p>
<h3>Why can the target disappear?</h3>
<p>It may be collected, decay away, or leave visibility. Revalidate it every tick.</p>
<h3>Why prioritize collectible amount before path length?</h3>
<p>That ranking tries to fill the Creep. Path-first ranking can be better for urgent cleanup, so the strategy should match the task.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.pickup" rel="nofollow">API Reference: Creep.pickup()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">API Reference: Room.find()</a></li>
<li><a href="https://docs.screeps.com/api/#Resource" rel="nofollow">API Reference: Resource</a></li>
<li><a href="https://docs.screeps.com/simultaneous-actions.html" rel="nofollow">Screeps Documentation: Simultaneous Actions</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishFoundationArticleBySlug = Object.fromEntries(
  englishFoundationArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishFoundationArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishFoundationArticleBySlug[slug];
}
