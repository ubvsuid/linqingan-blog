import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialEnergySourceOverride20260803 = {
  title: "Screeps Source Selection: Complete Paths and Stable Assignments",
  headline: "Select a Reachable Source Without Treating a Partial Path as Success",
  description: "Keep a valid Source identity, search only when reassignment is needed, reject incomplete PathFinder results, rank complete paths deterministically, and verify the selected harvest event.",
  category: "HARVESTING · SOURCE ASSIGNMENT",
  readingTime: "17 min read",
  breadcrumbLabel: "Source Assignment",
  tags: [
    "Screeps",
    "Source",
    "Pathfinding",
    "Harvesting",
    "Assignments"
  ],
  keywords: [
    "Screeps Source selection",
    "PathFinder incomplete",
    "FIND_SOURCES_ACTIVE",
    "stable Source ID",
    "Source assignment count",
    "EVENT_HARVEST"
  ],
  primaryKeyword: "Screeps Source selection",
  searchIntent: "Select and preserve one reachable Source assignment without accepting incomplete paths or repeatedly changing targets",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved — no URL, slug, Canonical, or Chinese mapping change"
    ],
    [
      "Official Screeps API",
      "Reviewed — Source queries, PathFinder result boundaries, harvest(), movement, event log, and object IDs"
    ],
    [
      "Project-policy boundary",
      "Dynamic versus fixed mode, assignment counts, matrix costs, maxOps, and tie-break order are examples"
    ],
    [
      "Static validation",
      "Complete-path filter, current-Creep count exclusion, visible-room invalidation, event identity, and JavaScript syntax reviewed"
    ],
    [
      "Validation level",
      "Official API review, JavaScript syntax review, static control-flow review, and repository checks"
    ],
    [
      "Screeps Console test",
      "Pending"
    ],
    [
      "Live multi-tick verification",
      "Pending"
    ],
    [
      "Genuine room or Console screenshots",
      "Pending"
    ],
    [
      "Last editorial review",
      "August 3, 2026"
    ]
  ],
  toc: [
    [
      "use-this-guide",
      "Use this guide when"
    ],
    [
      "task-contract",
      "Choose fixed or dynamic assignment"
    ],
    [
      "stored-target",
      "Interpret a stored ID before clearing it"
    ],
    [
      "path-search",
      "Reject incomplete path results"
    ],
    [
      "candidate-order",
      "Rank complete candidates"
    ],
    [
      "submit",
      "Act without reselecting every tick"
    ],
    [
      "verify",
      "Verify the selected harvest event"
    ],
    [
      "complete-loop",
      "Complete dynamic-harvester loop"
    ],
    [
      "failure-states",
      "Failure states and boundaries"
    ],
    [
      "production-notes",
      "Production adaptation notes"
    ],
    [
      "choose-another-guide",
      "Choose another guide when"
    ],
    [
      "official-docs",
      "Official documentation"
    ]
  ],
  faq: [],
  articleHtml: `

<h2 id="use-this-guide">Use this guide when</h2>
<p>A flexible harvester has several visible Sources and should keep a valid assignment, switch only under a documented rule, and reject candidate searches that stop before reaching range 1.</p>
<p>This page answers a target-selection question. It does not diagnose every CostMatrix or cross-room routing failure.</p>

<h2 id="task-contract">Choose fixed or dynamic assignment</h2>
<p>A fixed miner and a dynamic early-room harvester should not share one invalidation rule.</p>
<ul>
<li><strong>Fixed:</strong> preserve the assigned Source through regeneration. Empty Energy is temporary state, not a new identity.</li>
<li><strong>Dynamic:</strong> keep the stored Source while it remains visible, active, and valid; otherwise select another complete-path candidate.</li>
</ul>
<pre><code class="language-javascript">function getSourceAssignmentMode(creep) {
  return creep.memory?.sourceMode === 'fixed'
    ? 'fixed'
    : 'dynamic';
}</code></pre>
<p>The example below intentionally requires Energy capacity because it models a dynamic harvester that carries Energy. A stationary drop-mining design has a different body and delivery contract.</p>

<h2 id="stored-target">Interpret a stored ID before clearing it</h2>
<pre><code class="language-javascript">function inspectStoredSource(creep) {
  const sourceId = creep.memory?.sourceId;
  const roomName = creep.memory?.sourceRoom;

  if (typeof sourceId !== 'string') {
    return { status: 'source-id-not-set', source: null };
  }

  const source = Game.getObjectById(sourceId);
  if (source) {
    if (
      source.pos.roomName !== creep.room.name
      || (
        typeof roomName === 'string'
        && source.pos.roomName !== roomName
      )
    ) {
      return { status: 'stored-source-wrong-room', source: null };
    }

    return { status: 'stored-source-visible', source };
  }

  if (
    typeof roomName === 'string'
    && !Game.rooms[roomName]
  ) {
    return {
      status: 'stored-source-vision-unavailable',
      source: null
    };
  }

  return {
    status: 'stored-source-missing-visible-room',
    source: null
  };
}</code></pre>
<p>A null object lookup is not enough to prove deletion when the saved room is not visible. For this same-room selector, a remote record is not immediately reused, but the status remains explicit so another subsystem can decide whether to wait, scout, or cancel.</p>
<pre><code class="language-javascript">function keepStoredSource(creep, inspected) {
  if (!inspected.source) {
    return false;
  }

  const mode = getSourceAssignmentMode(creep);
  if (mode === 'fixed') {
    return true;
  }

  return inspected.source.energy > 0;
}</code></pre>

<h2 id="path-search">Reject incomplete path results</h2>
<p><code>PathFinder.search()</code> can return a partial path with <code>incomplete: true</code>. Path length alone is therefore not proof that the Creep can reach range 1.</p>
<pre><code class="language-javascript">function buildStaticSourceMatrix(room) {
  const matrix = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (structure.structureType === STRUCTURE_ROAD) {
      matrix.set(structure.pos.x, structure.pos.y, 1);
      continue;
    }

    if (structure.structureType === STRUCTURE_CONTAINER) {
      continue;
    }

    if (structure.structureType === STRUCTURE_RAMPART) {
      if (structure.my === true || structure.isPublic === true) {
        continue;
      }

      matrix.set(structure.pos.x, structure.pos.y, 255);
      continue;
    }

    if (OBSTACLE_OBJECT_TYPES.includes(
      structure.structureType
    )) {
      matrix.set(structure.pos.x, structure.pos.y, 255);
    }
  }

  return matrix;
}

function searchCompleteSourcePath(creep, source) {
  const matrix = buildStaticSourceMatrix(creep.room);
  const result = PathFinder.search(
    creep.pos,
    { pos: source.pos, range: 1 },
    {
      maxRooms: 1,
      maxOps: 4000,
      plainCost: 2,
      swampCost: 10,
      roomCallback(roomName) {
        return roomName === creep.room.name
          ? matrix
          : false;
      }
    }
  );

  return {
    complete: result.incomplete !== true,
    pathLength: result.path.length,
    ops: result.ops,
    cost: result.cost
  };
}</code></pre>
<p>The matrix ignores Creeps on purpose so temporary traffic does not redefine a long-lived Source assignment. Actual movement can still be delayed by traffic and must be observed separately.</p>

<h2 id="candidate-order">Rank complete candidates</h2>
<p>Count declared assignments as planning input, not proof that a Creep is currently harvesting. Exclude the Creep being reassigned so its stale target does not penalize one candidate.</p>
<pre><code class="language-javascript">function countOtherSourceAssignments(currentCreepName) {
  const counts = {};

  for (const creep of Object.values(Game.creeps)) {
    if (creep.name === currentCreepName) {
      continue;
    }

    const sourceId = creep.memory?.sourceId;
    if (typeof sourceId !== 'string') {
      continue;
    }

    counts[sourceId] = (counts[sourceId] || 0) + 1;
  }

  return counts;
}

function buildCompleteSourceCandidates(creep) {
  const assignments = countOtherSourceAssignments(
    creep.name
  );
  const candidates = [];

  for (const source of creep.room.find(
    FIND_SOURCES_ACTIVE
  )) {
    const path = searchCompleteSourcePath(creep, source);
    if (!path.complete) {
      continue;
    }

    candidates.push({
      source,
      sourceId: source.id,
      pathLength: path.pathLength,
      pathOps: path.ops,
      pathCost: path.cost,
      assignmentCount: assignments[source.id] || 0
    });
  }

  return candidates;
}

function selectSourceCandidate(candidates) {
  return [...candidates].sort((left, right) =>
    left.pathLength - right.pathLength
    || left.assignmentCount - right.assignmentCount
    || left.pathCost - right.pathCost
    || left.sourceId.localeCompare(right.sourceId)
  )[0] || null;
}</code></pre>
<p>Path length is the primary rule here. Assignment count and stable ID make ties deterministic. This is not a mining-slot allocator; it does not prove that enough walkable harvesting positions exist around a Source.</p>

<h2 id="submit">Act without reselecting every tick</h2>
<pre><code class="language-javascript">function chooseSource(creep) {
  const inspected = inspectStoredSource(creep);

  if (keepStoredSource(creep, inspected)) {
    return {
      status: 'stored-source-kept',
      source: inspected.source
    };
  }

  if (
    inspected.status === 'stored-source-vision-unavailable'
  ) {
    return { status: inspected.status, source: null };
  }

  const selected = selectSourceCandidate(
    buildCompleteSourceCandidates(creep)
  );
  if (!selected) {
    return {
      status: 'complete-active-source-not-found',
      source: null
    };
  }

  creep.memory.sourceId = selected.sourceId;
  creep.memory.sourceRoom = selected.source.pos.roomName;
  creep.memory.sourceSelectedAt = Game.time;

  return {
    status: 'complete-source-selected',
    source: selected.source,
    pathLength: selected.pathLength,
    assignmentCount: selected.assignmentCount
  };
}

function submitSelectedHarvest(creep, state) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  if (creep.getActiveBodyparts(WORK) <= 0) {
    return { status: 'no-active-work' };
  }

  const capacity = creep.store.getCapacity(
    RESOURCE_ENERGY
  );
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { status: 'no-energy-capacity-for-this-role' };
  }

  if (
    creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0
  ) {
    return { status: 'creep-full' };
  }

  const choice = chooseSource(creep);
  if (!choice.source) {
    return { status: choice.status };
  }

  const result = creep.harvest(choice.source);

  if (result === ERR_NOT_IN_RANGE) {
    const beforePosition = [
      creep.pos.roomName,
      creep.pos.x,
      creep.pos.y
    ].join(':');
    const moveResult = creep.moveTo(choice.source, {
      range: 1,
      reusePath: 10
    });

    state.lastMovement = {
      submittedAt: Game.time,
      creepId: creep.id,
      sourceId: choice.source.id,
      beforePosition,
      moveResult
    };

    return {
      status: moveResult === OK
        ? 'movement-submitted'
        : moveResult === ERR_TIRED
          ? 'movement-deferred-fatigue'
          : 'movement-rejected',
      sourceId: choice.source.id,
      harvestResult: result,
      moveResult
    };
  }

  if (result !== OK) {
    if (
      result === ERR_NOT_ENOUGH_RESOURCES
      && getSourceAssignmentMode(creep) === 'dynamic'
    ) {
      delete creep.memory.sourceId;
      delete creep.memory.sourceRoom;
    }

    return {
      status: 'harvest-rejected',
      sourceId: choice.source.id,
      result
    };
  }

  state.pendingHarvest = {
    requestId: [
      creep.name,
      Game.time,
      choice.source.id
    ].join(':'),
    submittedAt: Game.time,
    creepId: creep.id,
    sourceId: choice.source.id,
    beforeEnergy: creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    )
  };

  return {
    status: 'harvest-accepted',
    sourceId: choice.source.id,
    result
  };
}</code></pre>
<p>The selected ID is reused until the chosen policy invalidates it. Pathfinding runs during assignment, not on every successful harvest tick.</p>

<h2 id="verify">Verify the selected harvest event</h2>
<pre><code class="language-javascript">function verifySelectedHarvest(room, state) {
  const pending = state.pendingHarvest;
  if (!pending) {
    return { status: 'nothing-pending' };
  }

  if (Game.time <= pending.submittedAt) {
    return { status: 'waiting-for-next-tick' };
  }

  if (Game.time !== pending.submittedAt + 1) {
    delete state.pendingHarvest;
    return {
      status: 'verification-window-missed',
      requestId: pending.requestId
    };
  }

  const matches = room.getEventLog().filter(event =>
    event.event === EVENT_HARVEST
    && event.objectId === pending.creepId
    && event.data?.targetId === pending.sourceId
  );
  const creep = Game.getObjectById(pending.creepId);
  const source = Game.getObjectById(pending.sourceId);
  const netState = {
    creepEnergyNow: creep
      ? creep.store.getUsedCapacity(RESOURCE_ENERGY)
      : null,
    sourceEnergyNow: source?.energy ?? null
  };

  delete state.pendingHarvest;

  if (matches.length !== 1) {
    return {
      status: matches.length === 0
        ? 'accepted-event-not-found'
        : 'ambiguous-harvest-events',
      requestId: pending.requestId,
      matchCount: matches.length,
      netState
    };
  }

  return {
    status: 'harvest-event-verified',
    requestId: pending.requestId,
    eventData: matches[0].data || null,
    beforeEnergy: pending.beforeEnergy,
    netState
  };
}</code></pre>
<p>The event binds the acting Creep to the selected Source. Net Energy can also be changed by transfer, drop, withdrawal, or another harvest, so it remains supporting context.</p>

<h2 id="complete-loop">Complete dynamic-harvester loop</h2>
<pre><code class="language-javascript">function runDynamicHarvester(creepName) {
  Memory.sourceSelection ??= {};
  const state = Memory.sourceSelection[creepName] ??= {
    pendingHarvest: null,
    lastMovement: null
  };

  if (state.lastRunAt === Game.time) {
    return { status: 'already-run-this-tick' };
  }
  state.lastRunAt = Game.time;

  const creep = Game.creeps[creepName];

  if (!creep) {
    return { status: 'creep-not-found' };
  }

  const verification = verifySelectedHarvest(
    creep.room,
    state
  );

  if (state.pendingHarvest) {
    return {
      status: 'harvest-already-pending',
      verification
    };
  }

  const submission = submitSelectedHarvest(
    creep,
    state
  );

  state.lastStatus = submission.status;
  state.lastRunAt = Game.time;
  state.lastVerification = verification;

  return {
    status: submission.status,
    verification,
    submission
  };
}

module.exports.loop = function () {
  const outcome = runDynamicHarvester('Harvester1');

  if (
    outcome.status.includes('rejected')
    || outcome.status.includes('not-found')
    || outcome.status.includes('missed')
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'source-selection',
      gameTick: Game.time,
      outcome
    }));
  }
};</code></pre>

<h2 id="failure-states">Failure states and boundaries</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status or result</th><th>Meaning</th><th>Next action</th></tr></thead>
<tbody>
<tr><td><code>complete-active-source-not-found</code></td><td>No active candidate produced a complete same-room path</td><td>Inspect candidate count, matrix, limits, or wait for regeneration</td></tr>
<tr><td><code>stored-source-vision-unavailable</code></td><td>The saved room is not visible</td><td>Wait or use a scouting policy; do not claim deletion</td></tr>
<tr><td><code>no-energy-capacity-for-this-role</code></td><td>The Creep does not fit this carrying-harvester contract</td><td>Use a fixed-miner design or change the body</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The selected Source is empty now</td><td>Preserve in fixed mode or clear in dynamic mode</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The Creep cannot accept more Energy</td><td>Switch to delivery</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not at range 1</td><td>Record movement and observe later position</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active harvesting capability remains</td><td>Inspect body damage or replacement</td></tr>
</tbody></table></div>

<h2 id="production-notes">Production adaptation notes</h2>
<ul>
<li>Build or cache the static matrix once per room and runtime when many Creeps reassign in the same tick. The cache must be disposable and invalidated after layout changes.</li>
<li>Do not run a full path search every tick. Persist the Source ID and search only when the task policy requires reassignment.</li>
<li>Assignment count does not reserve a harvesting tile. A production miner scheduler should count usable positions and its own occupancy contract.</li>
<li>Temporary Creep traffic is excluded from the assignment matrix. Use later-tick movement diagnostics for congestion.</li>
<li>For remote mining, separate route planning, room visibility, reservation, replacement timing, and hostile policy from this same-room selector.</li>
</ul>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-err-no-path">the path-search diagnostic</a> when one known target fails because of CostMatrix, callback, or search limits. Use <a href="/en/blog/screeps-moveto-not-moving">the accepted-movement diagnostic</a> when <code>moveTo()</code> returns <code>OK</code> but positions do not change across later ticks. Use <a href="/en/blog/screeps-get-object-by-id">the saved-object guide</a> when the main problem is interpreting a null object lookup rather than choosing among Sources.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Source" rel="nofollow">Screeps API: Source</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.search" rel="nofollow">Screeps API: PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">Screeps API: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Room-Event-Objects" rel="nofollow">Screeps API: Room event objects</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
