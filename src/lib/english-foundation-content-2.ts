import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishFoundationBatchTwoArticles = [
  {
    slug: "screeps-working-state",
    path: "/en/blog/screeps-working-state",
    chinesePath: "/blog/screeps-creep-working-state",
    title: "Screeps Working State: Stop Creeps Switching Jobs Every Tick",
    headline: "How to Switch a Screeps Creep Between Getting Energy and Working",
    description:
      "Build a stable two-phase working state from Store boundaries, keep the previous state at partial Energy, handle initialization and invalid capacity, and separate harvesting from Controller upgrading.",
    category: "FOUNDATION · WORKING STATE",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "15 min read",
    breadcrumbLabel: "Stable Working State",
    tags: ["Screeps", "Memory", "Creep", "State Machine", "Foundation"],
    keywords: [
      "Screeps working state",
      "creep.memory.working",
      "Screeps switch harvesting and working",
      "Screeps Creep state machine",
      "Store getUsedCapacity getFreeCapacity",
    ],
    primaryKeyword: "Screeps working state",
    searchIntent: "State-switching tutorial and task-flapping troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Memory, Store, harvest(), upgradeController(), game loop"],
      ["Source correction", "Current harvest() docs do not list ERR_FULL"],
      ["JavaScript syntax", "Passed"],
      ["Offline state review", "Passed — empty, full, partial, first run, invalid capacity"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick room test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["two-phases", "The two phases"],
      ["do-not-toggle", "Why you should not toggle every tick"],
      ["store-boundaries", "Read the Store boundaries"],
      ["pure-decision", "Calculate the next state with a pure function"],
      ["initial-state", "Choose a first-run rule"],
      ["complete-example", "Complete harvest-and-upgrade example"],
      ["one-branch", "Run only one action branch per tick"],
      ["partial-energy", "Why partial Energy keeps the previous state"],
      ["return-codes", "Important action results"],
      ["not-universal", "Roles that should not use this pattern"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Why does my Creep switch between the Source and Controller every tick?",
        "The state is probably being toggled by time or by a broad has-Energy check. Switch only at the empty and full Store boundaries, and preserve the previous state in between.",
      ],
      [
        "What should working mean when a Creep starts with partial Energy?",
        "That is a project decision, not an official rule. This guide defaults an uninitialized partial Creep to acquisition mode so it fills before working.",
      ],
      [
        "Does creep.memory.working automatically make the Creep work?",
        "No. It is a player-defined boolean. Your code must read it and call harvest(), build(), repair(), transfer(), or upgradeController() as appropriate.",
      ],
      [
        "Should a fixed upgrader that withdraws from a nearby Link wait until full?",
        "Not necessarily. A fixed-position upgrader may work continuously and refill locally, so forcing the same two-boundary cycle can reduce throughput.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-pickup-dropped-energy",
      label: "Previous foundation guide",
      title: "Pick Up Dropped Energy",
    },
    next: {
      href: "/en/blog/screeps-get-object-by-id",
      label: "Next Memory guide",
      title: "Restore a Target by ID",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use two Store boundaries to control a Creep's task. When carried Energy reaches zero, set <code>creep.memory.working</code> to <code>false</code> and acquire Energy. When free Energy capacity reaches zero, set it to <code>true</code> and spend Energy. At every partial value between empty and full, keep the previous state. This prevents the Creep from changing direction after every small harvest or every partial spend.</p>

<h2 id="two-phases">The two phases</h2>
<pre><code class="language-text">working = false
→ acquire Energy

working = true
→ spend Energy on the assigned task</code></pre>
<p>The word <code>working</code> is not an official Screeps state. It is a player-defined Memory field whose meaning comes from your own branches. Review <a href="/en/blog/screeps-memory-basics">Screeps Memory basics</a> before using it across ticks.</p>

<h2 id="do-not-toggle">Why you should not toggle every tick</h2>
<p>This code creates task flapping:</p>
<pre><code class="language-javascript">creep.memory.working = !creep.memory.working;</code></pre>
<p>The Creep may start moving toward a Source, reverse toward the Controller on the next tick, and reverse again before reaching either target. State should be driven by resource boundaries, not by the number of times the loop has run.</p>

<h2 id="store-boundaries">Read the Store boundaries</h2>
<pre><code class="language-javascript">const usedEnergy = creep.store.getUsedCapacity(
  RESOURCE_ENERGY
);

const freeEnergyCapacity =
  creep.store.getFreeCapacity(RESOURCE_ENERGY);

const totalEnergyCapacity = creep.store.getCapacity(
  RESOURCE_ENERGY
);</code></pre>
<p>The three values answer different questions:</p>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>Question</th><th>Boundary</th></tr></thead>
<tbody>
<tr><td><code>usedEnergy</code></td><td>How much Energy is carried?</td><td><code>0</code> means empty.</td></tr>
<tr><td><code>freeEnergyCapacity</code></td><td>How much more Energy fits?</td><td><code>0</code> means full for Energy.</td></tr>
<tr><td><code>totalEnergyCapacity</code></td><td>Can this Store carry Energy at all?</td><td><code>0</code> is invalid for this cycle.</td></tr>
</tbody></table></div>
<p>A Creep with no usable carrying capacity is not a valid acquisition-and-work worker. Check body design with <a href="/en/blog/screeps-creep-body-parts">the WORK, CARRY, and MOVE guide</a>.</p>

<h2 id="pure-decision">Calculate the next state with a pure function</h2>
<pre><code class="language-javascript">function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    totalEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || !Number.isFinite(totalEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
    || totalEnergyCapacity <= 0
  ) {
    return {
      valid: false,
      working: false,
      reason: 'invalid-store-values'
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      working: false,
      reason: 'energy-empty'
    };
  }

  if (freeEnergyCapacity === 0) {
    return {
      valid: true,
      working: true,
      reason: 'energy-full'
    };
  }

  return {
    valid: true,
    working: previousWorking === true,
    reason: 'keep-previous-state'
  };
}</code></pre>
<p>The function does not depend on Screeps globals and does not modify Memory. That makes the state decision easy to test with ordinary numbers before connecting it to a live Creep.</p>

<h2 id="initial-state">Choose a first-run rule</h2>
<p>Suppose a Creep has 20 Energy out of 50, but <code>creep.memory.working</code> has never been initialized. The official API does not define what your custom state should mean. This guide uses:</p>
<pre><code class="language-javascript">previousWorking === true</code></pre>
<p>An undefined value therefore becomes <code>false</code>, so a partially loaded first-run Creep continues acquiring Energy. A repair emergency might choose the opposite policy. The important point is to make the initialization rule explicit rather than letting partial Energy produce inconsistent behavior.</p>

<h2 id="complete-example">Complete harvest-and-upgrade example</h2>
<p><strong>State impact:</strong> this script writes <code>working</code>, <code>lastStateReason</code>, and <code>lastStateCheckedAt</code> to <code>Worker1</code> Memory. It may move the Creep, harvest from an active Source, or upgrade the owned room Controller.</p>
<pre><code class="language-javascript">function getNextWorkingState(input) {
  const {
    usedEnergy,
    freeEnergyCapacity,
    totalEnergyCapacity,
    previousWorking
  } = input;

  if (
    !Number.isFinite(usedEnergy)
    || !Number.isFinite(freeEnergyCapacity)
    || !Number.isFinite(totalEnergyCapacity)
    || usedEnergy < 0
    || freeEnergyCapacity < 0
    || totalEnergyCapacity <= 0
  ) {
    return {
      valid: false,
      working: false,
      reason: 'invalid-store-values'
    };
  }

  if (usedEnergy === 0) {
    return {
      valid: true,
      working: false,
      reason: 'energy-empty'
    };
  }

  if (freeEnergyCapacity === 0) {
    return {
      valid: true,
      working: true,
      reason: 'energy-full'
    };
  }

  return {
    valid: true,
    working: previousWorking === true,
    reason: 'keep-previous-state'
  };
}

function updateWorkingState(creep) {
  const decision = getNextWorkingState({
    usedEnergy: creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    freeEnergyCapacity:
      creep.store.getFreeCapacity(
        RESOURCE_ENERGY
      ),
    totalEnergyCapacity: creep.store.getCapacity(
      RESOURCE_ENERGY
    ),
    previousWorking: creep.memory.working
  });

  creep.memory.working = decision.working;
  creep.memory.lastStateReason = decision.reason;
  creep.memory.lastStateCheckedAt = Game.time;

  return decision;
}

function moveToTarget(creep, target, range, label) {
  const moveResult = creep.moveTo(target, {
    range,
    reusePath: 10
  });

  if (
    moveResult !== OK
    && moveResult !== ERR_TIRED
  ) {
    console.log(JSON.stringify({
      type: 'worker-move-failed',
      creepName: creep.name,
      label,
      moveResult
    }));
  }

  return moveResult;
}

function runWorker(creep) {
  const state = updateWorkingState(creep);

  if (!state.valid) {
    return {
      status: 'invalid-working-state',
      reason: state.reason
    };
  }

  if (creep.memory.working !== true) {
    const source = creep.pos.findClosestByPath(
      FIND_SOURCES_ACTIVE
    );

    if (!source) {
      return {
        status: 'active-source-not-found'
      };
    }

    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      const moveResult = moveToTarget(
        creep,
        source,
        1,
        'Source'
      );

      return {
        status: 'moving-to-source',
        harvestResult,
        moveResult
      };
    }

    return {
      status: harvestResult === OK
        ? 'harvest-submitted'
        : 'harvest-failed',
      harvestResult
    };
  }

  const controller = creep.room.controller;

  if (!controller || controller.my !== true) {
    return {
      status: 'owned-controller-not-found'
    };
  }

  const upgradeResult =
    creep.upgradeController(controller);

  if (upgradeResult === ERR_NOT_IN_RANGE) {
    const moveResult = moveToTarget(
      creep,
      controller,
      3,
      'Controller'
    );

    return {
      status: 'moving-to-controller',
      upgradeResult,
      moveResult
    };
  }

  return {
    status: upgradeResult === OK
      ? 'upgrade-submitted'
      : 'upgrade-failed',
    upgradeResult
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;

  if (!creep || creep.spawning === true) {
    return;
  }

  const outcome = runWorker(creep);

  if (
    outcome.status.endsWith('-failed')
    || outcome.status === 'invalid-working-state'
  ) {
    console.log(JSON.stringify({
      type: 'worker-state-action-failed',
      creepName: creep.name,
      working: creep.memory.working,
      ...outcome
    }));
  }
};</code></pre>
<p>Replace <code>Worker1</code> with the real Creep name. The example deliberately uses one acquisition target and one work target so the state rule remains visible.</p>

<h2 id="one-branch">Run only one action branch per tick</h2>
<p>The acquisition branch returns before the work branch. This prevents the same loop from trying to harvest and upgrade after one state decision. Screeps processes actions after scripts run, and action pipelines can block one another even when multiple calls return <code>OK</code>. One chosen branch produces clearer movement and debugging.</p>

<h2 id="partial-energy">Why partial Energy keeps the previous state</h2>
<pre><code class="language-text">0 / 50 Energy
→ working = false

50 / 50 Energy
→ working = true

30 / 50 Energy
→ keep the previous state</code></pre>
<p>A Creep already working with 30 Energy continues working until empty. A Creep already acquiring with 30 Energy continues filling until full. Switching merely because <code>usedEnergy &gt; 0</code> would make it leave the Source after the first successful harvest.</p>

<h2 id="return-codes">Important action results</h2>
<div class="table-scroll"><table>
<thead><tr><th>Action</th><th>Results to handle first</th><th>Meaning in this example</th></tr></thead>
<tbody>
<tr><td><code>harvest()</code></td><td><code>OK</code>, <code>ERR_NOT_IN_RANGE</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_NO_BODYPART</code></td><td>Accepted, move closer, wait or reselect, or inspect WORK parts.</td></tr>
<tr><td><code>upgradeController()</code></td><td><code>OK</code>, <code>ERR_NOT_IN_RANGE</code>, <code>ERR_NOT_ENOUGH_RESOURCES</code>, <code>ERR_INVALID_TARGET</code></td><td>Accepted, move within range 3, return to acquisition, or inspect Controller state.</td></tr>
<tr><td><code>moveTo()</code></td><td><code>OK</code>, <code>ERR_TIRED</code>, <code>ERR_NO_PATH</code>, <code>ERR_NO_BODYPART</code></td><td>Movement accepted, temporary fatigue, no route, or no active MOVE ability.</td></tr>
</tbody></table></div>
<p><strong>Source correction:</strong> the Chinese source included <code>ERR_FULL</code> in its harvesting table. The current official <code>Creep.harvest()</code> reference does not list that result. This English version prevents the full-Store case through the state boundary and does not claim that <code>harvest()</code> returns <code>ERR_FULL</code>.</p>

<h2 id="not-universal">Roles that should not use this pattern</h2>
<ul>
<li>A fixed upgrader that refills from a nearby Link while upgrading.</li>
<li>A dedicated hauler driven by a task queue.</li>
<li>A combat Creep.</li>
<li>A one-time temporary task.</li>
<li>A Creep whose actions are assigned by a centralized scheduler.</li>
</ul>
<p>A state pattern is useful only when its two phases match the real job. Forcing a fixed upgrader to wait until completely full may reduce Controller throughput.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Do not invert <code>working</code> every tick.</li>
<li>Read used, free, and total Energy capacity separately.</li>
<li>Reject a total capacity of zero.</li>
<li>Choose an explicit first-run rule for partial Energy.</li>
<li>Keep the previous state between the empty and full boundaries.</li>
<li>Run only one action branch per tick.</li>
<li>Save the action result and movement result separately.</li>
<li>Confirm the work target belongs to the intended room and player.</li>
<li>Inspect <code>lastStateReason</code> when behavior looks wrong.</li>
<li>Use the <a href="/en/screeps-errors">error-code reference</a> for less common results.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This article does not build a generic finite-state-machine framework, role dispatcher, task queue, target reservation system, fixed Link upgrader, or multi-room worker. Continue with <a href="/en/blog/screeps-get-object-by-id">restoring a saved target with Game.getObjectById()</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why does my Creep reverse direction every tick?</h3>
<p>The state is probably being toggled by tick or by a broad has-Energy test. Change state only at the empty and full boundaries.</p>
<h3>What should happen on the first tick with partial Energy?</h3>
<p>Choose a project rule. This guide defaults to acquisition mode until the Store is full.</p>
<h3>Does working automatically perform an action?</h3>
<p>No. It is only a custom boolean. Your branches must call the actual Screeps methods.</p>
<h3>Should every upgrader use this pattern?</h3>
<p>No. A fixed upgrader with local Link Energy may refill and upgrade continuously instead.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Memory</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getUsedCapacity" rel="nofollow">API Reference: Store methods</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">API Reference: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow">API Reference: Creep.upgradeController()</a></li>
<li><a href="https://docs.screeps.com/simultaneous-actions.html" rel="nofollow">Screeps Documentation: Simultaneous actions</a></li>
</ul>`,
  },
  {
    slug: "screeps-get-object-by-id",
    path: "/en/blog/screeps-get-object-by-id",
    chinesePath: "/blog/screeps-game-get-object-by-id",
    title: "Screeps Game.getObjectById(): Restore Memory Targets Safely",
    headline: "How to Restore a Screeps Target from Memory with Game.getObjectById()",
    description:
      "Store an object ID and room name, recover the current object every tick, distinguish missing vision from a destroyed target, validate the restored type, and define an explicit invalidation policy.",
    category: "FOUNDATION · TARGET RESTORATION",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    breadcrumbLabel: "Restore Targets by ID",
    tags: ["Screeps", "Memory", "Game API", "Targeting", "Foundation"],
    keywords: [
      "Screeps Game.getObjectById",
      "Screeps save target ID Memory",
      "Game.getObjectById null",
      "Screeps restore Source target",
      "Screeps room vision target",
    ],
    primaryKeyword: "Screeps Game.getObjectById",
    searchIntent: "Target-restoration tutorial and null-result troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Game.getObjectById(), Game.rooms, Memory"],
      ["Visibility rule", "Only objects in currently visible rooms are accessible"],
      ["JavaScript syntax", "Passed"],
      ["Offline branch review", "Passed — invalid ID, no vision, missing object, type guard, reselection"],
      ["Screeps Console test", "Pending"],
      ["Live remote-vision test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["data-model", "Save stable data, restore current objects"],
      ["do-not-store-object", "Why a full game object does not belong in Memory"],
      ["return-value", "What Game.getObjectById() returns"],
      ["vision-first", "Check room vision before invalidating a remote target"],
      ["type-validation", "Validate the restored object type"],
      ["complete-example", "Complete saved-Source example"],
      ["empty-source", "An empty Source is not necessarily an invalid Source"],
      ["invalidation", "Define target invalidation rules"],
      ["identifiers", "Use the right identifier for each object type"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does Game.getObjectById() return Screeps error codes?",
        "No. It returns the current object instance or null. Action methods called on the object return OK or ERR_* codes separately.",
      ],
      [
        "Does null always mean the target was destroyed?",
        "No. Objects can be accessed by ID only in rooms currently visible to you. For a remote target, check room vision before deleting the stored ID.",
      ],
      [
        "Should I save only the target ID?",
        "For local tasks that may be enough. Remote or long-lived tasks benefit from also storing roomName, a project-defined target kind, and selection metadata for validation and diagnostics.",
      ],
      [
        "Should an empty Source ID be deleted?",
        "That depends on assignment policy. A fixed miner can keep the ID and wait; a dynamic harvester can clear it and choose another active Source.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-working-state",
      label: "Previous Memory guide",
      title: "Build a Stable Working State",
    },
    next: {
      href: "/en/blog/screeps-clean-dead-creep-memory",
      label: "Next Memory guide",
      title: "Clean Dead Creep Memory",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Store a game object's stable <code>id</code> in Memory, then call <code>Game.getObjectById(id)</code> on each later tick to recover the current object. The method returns an object or <code>null</code>, not an action result code. For remote targets, also store <code>roomName</code>: <code>null</code> can mean that the room is not currently visible, so do not delete the ID until you distinguish missing vision from a visible-room target that has actually disappeared.</p>

<h2 id="data-model">Save stable data, restore current objects</h2>
<pre><code class="language-text">Memory
→ stable ID, room name, target kind, selection metadata

Game.getObjectById(id)
→ current object from the current tick and current vision</code></pre>
<p>A useful saved record is:</p>
<pre><code class="language-javascript">creep.memory.target = {
  id: source.id,
  roomName: source.pos.roomName,
  kind: 'source',
  selectedAt: Game.time
};</code></pre>
<p><code>roomName</code> and <code>kind</code> are project-defined diagnostic fields. They are not required arguments to <code>Game.getObjectById()</code>.</p>

<h2 id="do-not-store-object">Why a full game object does not belong in Memory</h2>
<p>This is incorrect:</p>
<pre><code class="language-javascript">creep.memory.source = source;</code></pre>
<p>Memory stores JSON data. A serialized Source snapshot is not the live Source on the next tick, does not provide current methods or properties, and wastes limited Memory space. Store the ID instead:</p>
<pre><code class="language-javascript">creep.memory.sourceId = source.id;</code></pre>
<p>Then restore the current object:</p>
<pre><code class="language-javascript">const source = Game.getObjectById(
  creep.memory.sourceId
);</code></pre>

<h2 id="return-value">What Game.getObjectById() returns</h2>
<p>The API returns:</p>
<ul>
<li>a current game object instance that is accessible in your present vision; or</li>
<li><code>null</code> when the object cannot be found or accessed.</li>
</ul>
<p>It does not return <code>OK</code>, <code>ERR_NOT_IN_RANGE</code>, or another action code. Those codes come later when the Creep calls a method such as <code>harvest()</code>.</p>

<h2 id="vision-first">Check room vision before invalidating a remote target</h2>
<pre><code class="language-javascript">function hasRoomVision(roomName) {
  return typeof roomName === 'string'
    && roomName.length > 0
    && Boolean(Game.rooms[roomName]);
}</code></pre>
<p>Use this interpretation order:</p>
<pre><code class="language-text">No valid ID
→ select a target

Valid ID, target room not visible
→ keep the ID and wait for vision

Valid ID, room visible, object is still null
→ clear or replace the target</code></pre>
<p>Without the stored room name, a remote task cannot reliably distinguish “temporarily invisible” from “gone while visible.” The official API states that only objects in rooms currently visible to you can be accessed by ID.</p>

<h2 id="type-validation">Validate the restored object type</h2>
<p>Memory can be corrupted, migrated from an older schema, or reused by another task. A Source-specific branch should validate Source-like features:</p>
<pre><code class="language-javascript">function isSourceObject(target) {
  return Boolean(
    target
    && typeof target.id === 'string'
    && target.pos
    && Number.isFinite(target.energy)
    && Number.isFinite(target.energyCapacity)
  );
}</code></pre>
<p>This is a runtime guard, not a complete JavaScript type system. A TypeScript project can add stronger external declarations, but live validation is still useful when reading persisted data.</p>

<h2 id="complete-example">Complete saved-Source example</h2>
<p><strong>State impact:</strong> this script stores a Source target record in <code>Harvester1</code> Memory, updates diagnostic status fields, may clear an invalid record, and may move or harvest. It uses a dynamic-source policy when the selected Source is empty.</p>
<pre><code class="language-javascript">function isSourceObject(target) {
  return Boolean(
    target
    && typeof target.id === 'string'
    && target.pos
    && Number.isFinite(target.energy)
    && Number.isFinite(target.energyCapacity)
  );
}

function clearStoredTarget(creep, reason) {
  delete creep.memory.target;
  creep.memory.lastTargetStatus = reason;
  creep.memory.lastTargetChangedAt = Game.time;
}

function storeSourceTarget(creep, source) {
  creep.memory.target = {
    id: source.id,
    roomName: source.pos.roomName,
    kind: 'source',
    selectedAt: Game.time
  };
  creep.memory.lastTargetStatus =
    'source-selected';
  creep.memory.lastTargetChangedAt = Game.time;
}

function selectVisibleSource(creep) {
  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );

  if (!source) {
    return null;
  }

  storeSourceTarget(creep, source);
  return source;
}

function getStoredSource(creep) {
  const stored = creep.memory.target;

  if (!stored || typeof stored !== 'object') {
    return selectVisibleSource(creep);
  }

  if (
    typeof stored.id !== 'string'
    || stored.id.length === 0
  ) {
    clearStoredTarget(creep, 'invalid-id');
    return selectVisibleSource(creep);
  }

  if (
    typeof stored.roomName === 'string'
    && stored.roomName.length > 0
    && !Game.rooms[stored.roomName]
  ) {
    creep.memory.lastTargetStatus =
      'waiting-room-vision';
    return null;
  }

  const target = Game.getObjectById(stored.id);

  if (!isSourceObject(target)) {
    clearStoredTarget(creep, 'source-not-found');
    return selectVisibleSource(creep);
  }

  creep.memory.lastTargetStatus =
    'source-restored';
  return target;
}

function runHarvester(creep) {
  const source = getStoredSource(creep);

  if (!source) {
    return {
      status: creep.memory.lastTargetStatus
        || 'source-unavailable'
    };
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-source',
      harvestResult,
      moveResult
    };
  }

  if (
    harvestResult === ERR_NOT_ENOUGH_RESOURCES
  ) {
    clearStoredTarget(creep, 'source-empty');
  }

  return {
    status: harvestResult === OK
      ? 'harvest-submitted'
      : 'harvest-failed',
    harvestResult
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep || creep.spawning === true) {
    return;
  }

  const outcome = runHarvester(creep);

  if (outcome.status === 'harvest-failed') {
    console.log(JSON.stringify({
      type: 'stored-source-action-failed',
      creepName: creep.name,
      storedTarget: creep.memory.target ?? null,
      ...outcome
    }));
  }
};</code></pre>
<p>For a Creep in its own room, room vision normally exists because the Creep is present. The explicit visibility branch keeps the same pattern usable for remote target records.</p>

<h2 id="empty-source">An empty Source is not necessarily an invalid Source</h2>
<p>A Source can temporarily have no Energy and later regenerate. The correct policy depends on assignment:</p>
<ul>
<li><strong>Fixed miner:</strong> keep the ID and wait at the assigned Source.</li>
<li><strong>Dynamic harvester:</strong> clear the ID and choose another active Source.</li>
<li><strong>Managed multi-Creep system:</strong> let the room scheduler decide rather than allowing every Creep to compete independently.</li>
</ul>
<p>The complete example clears the ID after <code>ERR_NOT_ENOUGH_RESOURCES</code>. That is an explicit dynamic-selection policy, not an official requirement.</p>

<h2 id="invalidation">Define target invalidation rules</h2>
<p>A saved target should not live forever merely because its ID is a string. Clear or replace it when:</p>
<ul>
<li>the stored ID is invalid;</li>
<li>the room is visible and the object cannot be restored;</li>
<li>the object fails the expected type guard;</li>
<li>the target no longer satisfies the job's business rule;</li>
<li>the route repeatedly fails;</li>
<li>the task version or room assignment changes;</li>
<li>a scheduler reassigns the Creep.</li>
</ul>
<p>Keep the ID when the only known problem is missing remote vision.</p>

<h2 id="identifiers">Use the right identifier for each object type</h2>
<div class="table-scroll"><table>
<thead><tr><th>Object</th><th>Common durable identifier</th></tr></thead>
<tbody>
<tr><td>Source, Structure, ConstructionSite</td><td><code>id</code></td></tr>
<tr><td>Creep</td><td>Usually <code>name</code>; current objects also have an ID.</td></tr>
<tr><td>Flag</td><td><code>name</code></td></tr>
<tr><td>Room</td><td><code>roomName</code></td></tr>
<tr><td>RoomPosition</td><td><code>roomName</code>, <code>x</code>, and <code>y</code></td></tr>
</tbody></table></div>
<p>Do not force every kind of target into an ID-only schema when another stable identifier better matches the API.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Never save the complete game object in Memory.</li>
<li>Validate that the stored ID is a non-empty string.</li>
<li>Store the target room for remote or long-lived tasks.</li>
<li>Check room vision before deleting a remote ID after <code>null</code>.</li>
<li>Validate the restored object type or expected features.</li>
<li>Separate object restoration from action return codes.</li>
<li>Define whether an empty Source is fixed or replaceable.</li>
<li>Clear targets after repeated path or business-rule failure.</li>
<li>Record why and when the target changed.</li>
<li>Use <a href="/en/blog/screeps-memory-basics">the Memory guide</a> for JSON-safe storage rules.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement Observer vision, Scout scheduling, room intel databases, cross-shard target data, TypeScript object unions, multi-Creep reservations, or path caching. Continue with <a href="/en/blog/screeps-clean-dead-creep-memory">cleaning dead Creep Memory</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does Game.getObjectById() return an error code?</h3>
<p>No. It returns an object or <code>null</code>.</p>
<h3>Does null prove that the target was destroyed?</h3>
<p>No. A remote room without current vision can also make the object inaccessible by ID.</p>
<h3>Should I store only the ID?</h3>
<p>Local tasks may need only the ID. Remote tasks benefit from room name, target kind, and selection metadata.</p>
<h3>Should I delete an empty Source ID?</h3>
<p>Only when that matches the assignment policy. Fixed miners often keep it; dynamic harvesters may replace it.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: storing IDs instead of objects</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.rooms" rel="nofollow">API Reference: Game.rooms</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">API Reference: Creep.harvest()</a></li>
</ul>`,
  },
  {
    slug: "screeps-clean-dead-creep-memory",
    path: "/en/blog/screeps-clean-dead-creep-memory",
    chinesePath: "/blog/screeps-clean-dead-creep-memory",
    title: "Screeps Memory Cleanup: Remove Dead Creep Entries Safely",
    headline: "How to Clean Dead Creep Memory Safely in Screeps",
    description:
      "Compare Memory.creeps with Game.creeps, remove only confirmed dead-name entries, synchronize explicitly managed task indexes, summarize logs, and avoid TTL-based or global deletion mistakes.",
    category: "FOUNDATION · MEMORY CLEANUP",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "14 min read",
    breadcrumbLabel: "Clean Dead Creep Memory",
    tags: ["Screeps", "Memory", "Creep", "Cleanup", "Debugging"],
    keywords: [
      "Screeps clean dead Creep Memory",
      "delete Memory.creeps dead Creep",
      "Game.creeps Memory.creeps cleanup",
      "Screeps stale Creep memory",
      "Screeps memory cleanup code",
    ],
    primaryKeyword: "Screeps clean dead Creep Memory",
    searchIntent: "Safe cleanup tutorial and stale-Memory troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Game.creeps, Creep.memory, Memory"],
      ["Deletion boundary", "Only name-indexed structures explicitly managed by the script"],
      ["JavaScript syntax", "Passed"],
      ["Offline cleanup review", "Passed — live names, dead names, missing objects, managed indexes, log truncation"],
      ["Screeps Console test", "Pending"],
      ["Live death-and-replacement cycle", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["why-memory-remains", "Why dead Creep Memory can remain"],
      ["correct-direction", "Iterate Memory.creeps, not Game.creeps"],
      ["minimal-function", "Minimal safe cleanup function"],
      ["managed-indexes", "Synchronize only explicitly managed indexes"],
      ["complete-example", "Complete cleanup example"],
      ["frequency", "Every tick or periodically"],
      ["ttl", "Why ticksToLive is not the deletion test"],
      ["name-reuse", "Prepare for Creep name reuse"],
      ["offline-test", "Pure-function offline test"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Why can Memory.creeps contain a name that is not in Game.creeps?",
        "The current Creep is gone, but its persisted name entry can remain until your code deletes it.",
      ],
      [
        "Should I iterate Game.creeps to find dead Creeps?",
        "No. Dead names are already absent from Game.creeps. Iterate Memory.creeps and test whether Game.creeps[name] exists.",
      ],
      [
        "Can I delete the Memory entry when ticksToLive reaches 1?",
        "No. The Creep still exists during that tick. This guide deletes only when the name is absent from the current Game.creeps object.",
      ],
      [
        "Does deleting Memory.creeps[name] clean every task reference?",
        "No. Synchronize only the custom name-indexed structures that your project explicitly owns. ID caches and shared queues need separate invalidation rules.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-get-object-by-id",
      label: "Previous Memory guide",
      title: "Restore a Target by ID",
    },
    next: null,
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>A dead Creep is absent from the current <code>Game.creeps</code> object, while its name-indexed data may remain in <code>Memory.creeps</code>. Iterate <code>Memory.creeps</code>, keep every name that still exists in <code>Game.creeps</code>, and delete only the missing names. Synchronize only custom indexes that your project explicitly manages; never clear the entire Memory tree or delete every matching key by name.</p>

<h2 id="why-memory-remains">Why dead Creep Memory can remain</h2>
<pre><code class="language-text">Name exists in Memory.creeps
AND
no current Creep exists at Game.creeps[name]
→ the Creep-specific Memory entry is stale</code></pre>
<p><code>Game.creeps</code> describes your current Creeps. <code>Memory.creeps</code> is persisted data. The two collections do not automatically express the same lifecycle after a Creep dies.</p>

<h2 id="correct-direction">Iterate Memory.creeps, not Game.creeps</h2>
<p>This cannot discover dead names:</p>
<pre><code class="language-javascript">for (const name in Game.creeps) {
  // Every name here belongs to a current Creep.
}</code></pre>
<p>Start from the persistent keys instead:</p>
<pre><code class="language-javascript">for (const name in Memory.creeps) {
  if (!Game.creeps[name]) {
    delete Memory.creeps[name];
  }
}</code></pre>
<p>The current object is the evidence. A name is eligible for this cleanup only when it remains in the Creep Memory index but no current Creep has that name.</p>

<h2 id="minimal-function">Minimal safe cleanup function</h2>
<pre><code class="language-javascript">function cleanDeadCreepMemory() {
  if (
    !Memory.creeps
    || typeof Memory.creeps !== 'object'
  ) {
    return [];
  }

  const removedNames = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (Game.creeps[name]) {
      continue;
    }

    delete Memory.creeps[name];
    removedNames.push(name);
  }

  return removedNames;
}</code></pre>
<p>Returning the removed names makes summary logging and explicit secondary cleanup easier than returning only a count.</p>

<h2 id="managed-indexes">Synchronize only explicitly managed indexes</h2>
<p>A project may store additional name-indexed data:</p>
<pre><code class="language-javascript">Memory.creepTasks = {
  Worker1: {
    targetId: 'example-id'
  }
};</code></pre>
<p>Deleting <code>Memory.creeps.Worker1</code> does not automatically delete <code>Memory.creepTasks.Worker1</code>. Add rules only for structures whose schema you own:</p>
<pre><code class="language-javascript">function removeCreepFromManagedIndexes(name) {
  if (
    Memory.creepTasks
    && typeof Memory.creepTasks === 'object'
  ) {
    delete Memory.creepTasks[name];
  }

  if (
    Memory.creepAssignments
    && typeof Memory.creepAssignments === 'object'
  ) {
    delete Memory.creepAssignments[name];
  }
}</code></pre>
<p>Do not recursively scan all Memory and delete every key whose text matches the Creep name. Another module may use the same string with unrelated meaning.</p>

<h2 id="complete-example">Complete cleanup example</h2>
<p><strong>State impact:</strong> this script deletes stale entries from <code>Memory.creeps</code> and from the two custom name-indexed structures shown below. It logs one bounded summary and then continues to later room logic.</p>
<pre><code class="language-javascript">function removeCreepFromManagedIndexes(name) {
  if (
    Memory.creepTasks
    && typeof Memory.creepTasks === 'object'
  ) {
    delete Memory.creepTasks[name];
  }

  if (
    Memory.creepAssignments
    && typeof Memory.creepAssignments === 'object'
  ) {
    delete Memory.creepAssignments[name];
  }
}

function cleanDeadCreepMemory() {
  if (
    !Memory.creeps
    || typeof Memory.creeps !== 'object'
  ) {
    return [];
  }

  const removedNames = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (Game.creeps[name]) {
      continue;
    }

    delete Memory.creeps[name];
    removeCreepFromManagedIndexes(name);
    removedNames.push(name);
  }

  return removedNames.sort();
}

module.exports.loop = function () {
  const removedNames = cleanDeadCreepMemory();

  if (removedNames.length > 0) {
    console.log(JSON.stringify({
      type: 'dead-creep-memory-cleanup',
      tick: Game.time,
      count: removedNames.length,
      names: removedNames.slice(0, 20),
      truncated: removedNames.length > 20
    }));
  }

  // Run role counts, replacement spawning,
  // and task assignment after cleanup.
};</code></pre>
<p>Running cleanup before role counts and replacement decisions prevents later logic from counting stale names as current workers. The log proves only that the name is absent now; it does not reveal whether the Creep expired, died in combat, was recycled, or disappeared for another reason.</p>

<h2 id="frequency">Every tick or periodically</h2>
<p>Every-tick cleanup is simple and keeps replacement logic consistent. Larger systems may choose a lower frequency:</p>
<pre><code class="language-javascript">if (Game.time % 10 === 0) {
  cleanDeadCreepMemory();
}</code></pre>
<p>The number <code>10</code> is an example policy, not an official recommendation. Periodic cleanup means stale data can remain for several ticks, so role counts and spawn logic must tolerate that delay.</p>

<h2 id="ttl">Why ticksToLive is not the deletion test</h2>
<p>A Creep whose <code>ticksToLive</code> is near zero still exists in the current tick. Do not delete its Memory based on an earlier prediction:</p>
<pre><code class="language-javascript">if (creep.memory.lastTicksToLive === 1) {
  delete Memory.creeps[creep.name];
}</code></pre>
<p>The safe test used here is current existence:</p>
<pre><code class="language-javascript">if (!Game.creeps[name]) {
  delete Memory.creeps[name];
}</code></pre>

<h2 id="name-reuse">Prepare for Creep name reuse</h2>
<p>Both <code>Game.creeps</code> and <code>Memory.creeps</code> use the Creep name as a key. Before reusing an old name, make sure:</p>
<ul>
<li>the old Creep no longer exists;</li>
<li>old Memory was cleaned or intentionally migrated;</li>
<li>the new <code>spawnCreep()</code> request supplies the current schema;</li>
<li>old task assignments cannot be inherited accidentally.</li>
</ul>
<p>Cleanup reduces stale-state risk but does not replace a deliberate naming and spawning policy.</p>

<h2 id="offline-test">Pure-function offline test</h2>
<p>Separate the deletion decision from the mutation:</p>
<pre><code class="language-javascript">function findDeadCreepNames(
  memoryCreeps,
  gameCreeps
) {
  if (
    !memoryCreeps
    || typeof memoryCreeps !== 'object'
  ) {
    return [];
  }

  const live = gameCreeps
    && typeof gameCreeps === 'object'
    ? gameCreeps
    : {};

  return Object.keys(memoryCreeps)
    .filter(name => !live[name])
    .sort();
}</code></pre>
<p>This pure function supports ordinary-object tests for live names, multiple dead names, missing collections, and stable order. Such tests do not simulate an actual Screeps death, Memory serialization, name recreation, or the following replacement cycle.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Iterate <code>Memory.creeps</code> to find stale names.</li>
<li>Keep every name that exists in <code>Game.creeps</code>.</li>
<li>Do not delete based only on predicted TTL.</li>
<li>Never delete the complete <code>Memory.creeps</code> object.</li>
<li>Clean only custom indexes whose schema your code owns.</li>
<li>Run cleanup before role counting and replacement spawning.</li>
<li>Use one bounded summary instead of one permanent log per deletion.</li>
<li>Do not treat the cleanup event as a death-cause report.</li>
<li>Give ID-based targets and shared queues their own invalidation rules.</li>
<li>Review <a href="/en/blog/screeps-get-object-by-id">target restoration by ID</a> for non-name caches.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This article covers Creep-name-indexed data only. It does not diagnose death causes, spawn replacements, transfer assignments, clean Power Creep data, invalidate arbitrary object IDs, synchronize shards, or migrate Memory schemas. The real death-and-replacement cycle remains pending live verification.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why is a name in Memory.creeps but not Game.creeps?</h3>
<p>The current Creep is gone, but the persisted entry has not been deleted yet.</p>
<h3>Should I iterate Game.creeps to find dead names?</h3>
<p>No. Dead names are missing there. Iterate Memory.creeps and compare each name.</p>
<h3>Can I delete Memory at ticksToLive 1?</h3>
<p>No. The Creep still exists on that tick. Delete only after the name is absent from the current Game.creeps object.</p>
<h3>Does one deletion clean all task data?</h3>
<p>No. Clean only the additional name-indexed structures that your project explicitly manages.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow">API Reference: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow">API Reference: Creep.memory</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishFoundationBatchTwoBySlug = Object.fromEntries(
  englishFoundationBatchTwoArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishFoundationBatchTwoArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishFoundationBatchTwoBySlug[slug];
}
