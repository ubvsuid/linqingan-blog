import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { getEnglishFoundationBatchTwoArticle } from "./english-foundation-content-2";
import { getEnglishMovementBatchSixArticle } from "./english-movement-content-6-published";
import { getEnglishSpawnBatchThreeArticle } from "./english-spawn-content-3-published";

function requireArticle(
  article: EnglishBeginnerArticle | undefined,
  slug: string,
): EnglishBeginnerArticle {
  if (!article) {
    throw new Error(`Missing existing English article: ${slug}`);
  }

  return article;
}

const dynamicBodySource = requireArticle(
  getEnglishSpawnBatchThreeArticle("screeps-dynamic-creep-body"),
  "screeps-dynamic-creep-body",
);
const routeSource = requireArticle(
  getEnglishMovementBatchSixArticle("screeps-map-find-route"),
  "screeps-map-find-route",
);
const deadMemorySource = requireArticle(
  getEnglishFoundationBatchTwoArticle("screeps-clean-dead-creep-memory"),
  "screeps-clean-dead-creep-memory",
);

const dynamicBodyHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when one role needs a body that can scale with room Energy. The body planner should answer one question: <em>what legal body can this Spawn afford under the current policy?</em> It should not also decide role quotas, replacement timing, Spawn priority, or whether the room is in an emergency.</p>
<p>Use <a href="/en/blog/screeps-spawncreep-return-codes">the spawnCreep() return-code guide</a> when a finished body already exists but the Spawn rejects it.</p>

<h2 id="three-body-levels">Define minimum, target, and emergency plans</h2>
<div class="table-scroll"><table>
<thead><tr><th>Plan</th><th>Purpose</th><th>Energy rule</th></tr></thead>
<tbody>
<tr><td>Minimum</td><td>Smallest body that can perform the role</td><td>Never return a body below this capability</td></tr>
<tr><td>Target</td><td>Normal body for an established room</td><td>Wait when current workers make waiting safe</td></tr>
<tr><td>Emergency</td><td>Reduced body used to restore essential income</td><td>Scale from current <code>energyAvailable</code></td></tr>
</tbody></table></div>
<p>A dynamic body is not automatically an emergency body. Normal replacements may wait for the target budget, while a room with no income Creep may need the smallest useful body immediately.</p>

<h2 id="energy-boundary">Current Energy and capacity answer different questions</h2>
<p><code>room.energyAvailable</code> is the Energy currently loaded in Spawns and Extensions. <code>room.energyCapacityAvailable</code> is the maximum those structures can hold. Capacity does not prove that the target body is affordable now.</p>
<pre><code class="language-javascript">function chooseBodyBudget(room, policy) {
  if (!room || !policy) {
    return { status: 'input-missing', budget: 0 };
  }

  const targetBudget = Math.min(
    room.energyCapacityAvailable,
    policy.maximumEnergy
  );

  if (policy.emergency === true) {
    return {
      status: 'emergency-budget',
      budget: room.energyAvailable,
      targetBudget
    };
  }

  if (room.energyAvailable < policy.minimumEnergy) {
    return {
      status: 'minimum-not-affordable',
      budget: room.energyAvailable,
      targetBudget
    };
  }

  return {
    status: room.energyAvailable >= targetBudget
      ? 'target-affordable'
      : 'wait-or-scale',
    budget: Math.min(room.energyAvailable, targetBudget),
    targetBudget
  };
}</code></pre>
<p>The returned status leaves the wait-or-spawn decision visible. A body function should not silently treat every partial refill as an emergency.</p>

<h2 id="cost-and-inputs">Validate the body parts and derive cost</h2>
<pre><code class="language-javascript">const VALID_BODY_PARTS = new Set([
  MOVE,
  WORK,
  CARRY,
  ATTACK,
  RANGED_ATTACK,
  HEAL,
  TOUGH,
  CLAIM
]);

function getBodyCost(body) {
  if (
    !Array.isArray(body)
    || body.length < 1
    || body.some(part => !VALID_BODY_PARTS.has(part))
  ) {
    throw new TypeError('Invalid Creep body');
  }

  return body.reduce(
    (total, part) => total + BODYPART_COST[part],
    0
  );
}</code></pre>
<p>Derive costs from <code>BODYPART_COST</code>. Hard-coded totals become easy to break when templates change.</p>

<h2 id="scaled-builder">Scale from a minimum body with complete repeat units</h2>
<pre><code class="language-javascript">function buildScaledBody(input) {
  const {
    energyBudget,
    minimumBody,
    repeatUnit,
    maximumParts = 50,
    maximumEnergy = Infinity
  } = input;

  if (
    !Number.isFinite(energyBudget)
    || energyBudget < 0
    || !Array.isArray(minimumBody)
    || minimumBody.length < 1
    || !Array.isArray(repeatUnit)
    || repeatUnit.length < 1
    || !Number.isInteger(maximumParts)
    || maximumParts < 1
    || maximumParts > 50
    || (
      maximumEnergy !== Infinity
      && !Number.isFinite(maximumEnergy)
    )
    || maximumEnergy < 0
  ) {
    return {
      status: 'invalid-input',
      body: []
    };
  }

  const minimumCost = getBodyCost(minimumBody);
  const unitCost = getBodyCost(repeatUnit);
  const budget = Math.min(
    energyBudget,
    maximumEnergy
  );

  if (
    minimumBody.length > maximumParts
    || minimumCost > budget
  ) {
    return {
      status: 'minimum-not-affordable',
      body: [],
      minimumCost,
      budget
    };
  }

  const body = [...minimumBody];
  let bodyCost = minimumCost;
  let unitsAdded = 0;

  while (
    body.length + repeatUnit.length <= maximumParts
    && bodyCost + unitCost <= budget
  ) {
    body.push(...repeatUnit);
    bodyCost += unitCost;
    unitsAdded += 1;
  }

  return {
    status: bodyCost === budget
      ? 'budget-filled'
      : 'body-ready',
    body,
    bodyCost,
    budget,
    unitsAdded,
    unusedEnergy: budget - bodyCost,
    spawnTime: body.length * CREEP_SPAWN_TIME
  };
}</code></pre>
<p>Only complete repeat units are appended. Leftover Energy is normal; spending every last unit is less important than preserving the role's body ratio and part ordering.</p>

<h2 id="role-example">Keep the template specific to one role</h2>
<pre><code class="language-javascript">function planWorkerBody(room, emergency) {
  const budgetResult = chooseBodyBudget(room, {
    emergency,
    minimumEnergy: 200,
    maximumEnergy: 1200
  });

  if (budgetResult.status === 'minimum-not-affordable') {
    return {
      status: budgetResult.status,
      body: []
    };
  }

  const plan = buildScaledBody({
    energyBudget: budgetResult.budget,
    minimumBody: [WORK, CARRY, MOVE],
    repeatUnit: [WORK, CARRY, MOVE],
    maximumParts: 18,
    maximumEnergy: 1200
  });

  return {
    ...plan,
    budgetStatus: budgetResult.status,
    targetBudget: budgetResult.targetBudget
  };
}</code></pre>
<p>This is a general worker example, not a universal body. A fixed miner, road hauler, upgrader, reserver, healer, and attacker need different minimum capabilities, repeat units, movement ratios, caps, and part order.</p>

<h2 id="wait-or-spawn">Make the wait decision outside the builder</h2>
<p>Spawn a reduced body when losing more time is more dangerous than losing efficiency. Wait for the target body when the existing workforce can keep the room stable until the refill completes. Record the reason as policy data such as <code>income-collapse</code>, <code>replacement-safe-to-wait</code>, or <code>target-affordable</code>; do not infer emergency status merely from low Energy.</p>
<p>Use <a href="/en/blog/screeps-emergency-harvester-recovery">the emergency recovery guide</a> for room-collapse detection and duplicate Spawn prevention.</p>

<h2 id="spawn-boundary">Validate and submit spawning separately</h2>
<pre><code class="language-javascript">function submitBodyPlan(spawn, name, plan, memory) {
  if (!spawn || !plan || plan.body.length < 1) {
    return { status: 'plan-not-ready' };
  }

  const dryRunResult = spawn.spawnCreep(
    plan.body,
    name,
    { memory, dryRun: true }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      dryRunResult,
      bodyCost: plan.bodyCost
    };
  }

  const spawnResult = spawn.spawnCreep(
    plan.body,
    name,
    { memory }
  );

  return {
    status: spawnResult === OK
      ? 'spawn-submitted'
      : 'spawn-failed-after-dry-run',
    dryRunResult,
    spawnResult,
    bodyCost: plan.bodyCost,
    spawnTime: plan.spawnTime
  };
}</code></pre>
<p><code>OK</code> means the Spawn accepted the request. The Creep still requires <code>body.length × CREEP_SPAWN_TIME</code> ticks to finish, so replacement lead time belongs in the scheduler rather than the body builder.</p>

<h2 id="damage-and-movement">Body order and MOVE ratio remain policy</h2>
<p>Two bodies with the same parts and cost can lose abilities in a different order when damaged. Repeating a unit is easy to inspect, but it is not automatically optimal. Also check how loaded non-MOVE parts generate fatigue on roads, plains, and swamps. Use <a href="/en/blog/screeps-move-fatigue-body-ratio">the movement-ratio guide</a> for that calculation.</p>

<h2 id="verify-ticks">Verify the plan and the Spawn on different ticks</h2>
<p>Log the budget status, body array, cost, unused Energy, and expected spawn time before submission. On later ticks, inspect <code>spawn.spawning</code> and confirm the resulting Creep Memory. This revision contains static analysis and syntax checks only; live replacement and emergency-spawn observations remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">API Reference: Room.energyAvailable</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyCapacityAvailable" rel="nofollow">API Reference: Room.energyCapacityAvailable</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#BODYPART_COST" rel="nofollow">API Reference: BODYPART_COST</a></li>
</ul>`;

const routeHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when a Creep must travel to another room and you need to turn <code>Game.map.findRoute()</code> into one validated next-room step. The method plans rooms. It does not select every tile, move the Creep, prove the exit is reachable, or complete the task inside the destination room.</p>
<p>Use <a href="/en/blog/screeps-err-no-path">the ERR_NO_PATH guide</a> when the immediate problem is a failed route or path search.</p>

<h2 id="four-stages">Keep four stages separate</h2>
<div class="table-scroll"><table>
<thead><tr><th>Stage</th><th>Question</th><th>Evidence</th></tr></thead>
<tbody>
<tr><td>Room plan</td><td>Which room should be entered next?</td><td><code>findRoute()</code> result</td></tr>
<tr><td>Exit selection</td><td>Which exit tile is reachable now?</td><td>Current-room path search</td></tr>
<tr><td>Border transition</td><td>Did the Creep enter the next room?</td><td>Later-tick room name</td></tr>
<tr><td>Destination task</td><td>What position or object is the final target?</td><td>Role-specific logic</td></tr>
</tbody></table></div>
<p>A successful room route can still fail at the tile level. Reaching the target room can still leave the final task unfinished.</p>

<h2 id="route-policy">Use finite costs for preferences and Infinity for bans</h2>
<pre><code class="language-javascript">function getRouteCost(roomName, policy) {
  if (policy.blockedRooms.has(roomName)) {
    return Infinity;
  }

  const intel = Memory.roomIntel?.[roomName];
  const recentRisk = Boolean(
    intel
    && Number.isInteger(intel.seenAt)
    && Game.time - intel.seenAt <= policy.maxIntelAge
    && intel.risk === 'high'
  );

  if (recentRisk) {
    return 10;
  }

  return policy.preferredRooms.has(roomName)
    ? 1
    : 2.5;
}</code></pre>
<p>The values are relative policy weights, not travel ticks. A large finite cost keeps a room available as a last resort. <code>Infinity</code> removes it completely. Missing or stale intel is uncertainty, not proof of safety.</p>

<h2 id="calculate-route">Handle same-room completion and error codes first</h2>
<pre><code class="language-javascript">function calculateRoomRoute(
  fromRoom,
  targetRoom,
  policy
) {
  if (
    typeof fromRoom !== 'string'
    || typeof targetRoom !== 'string'
  ) {
    return {
      status: 'room-name-invalid',
      steps: []
    };
  }

  if (fromRoom === targetRoom) {
    return {
      status: 'target-room-reached',
      steps: []
    };
  }

  const route = Game.map.findRoute(
    fromRoom,
    targetRoom,
    {
      routeCallback(roomName) {
        return getRouteCost(roomName, policy);
      }
    }
  );

  if (!Array.isArray(route)) {
    return {
      status: 'route-failed',
      code: route,
      steps: []
    };
  }

  return {
    status: 'route-ready',
    code: OK,
    steps: route.map(step => ({
      exit: step.exit,
      room: step.room
    }))
  };
}</code></pre>
<p>Do not read <code>route[0]</code> until the result is confirmed to be an array. An empty array is correct when the current room already equals the target room.</p>

<h2 id="validate-first-step">Validate only the first step from the current room</h2>
<pre><code class="language-javascript">function validateFirstRouteStep(
  currentRoom,
  routeResult
) {
  if (routeResult.status !== 'route-ready') {
    return routeResult;
  }

  const step = routeResult.steps[0];

  if (!step) {
    return {
      status: 'first-step-missing'
    };
  }

  const exits = Game.map.describeExits(currentRoom);

  if (!exits || exits[step.exit] !== step.room) {
    return {
      status: 'first-step-invalid',
      step
    };
  }

  return {
    status: 'first-step-ready',
    step
  };
}</code></pre>
<p>The route was built from the current room, so the first step is the only room-level instruction needed now. Searching an old full route for a matching exit can select a stale step after an unexpected room transition.</p>

<h2 id="choose-exit-tile">Choose a reachable exit tile in the current room</h2>
<pre><code class="language-javascript">function chooseExitPosition(creep, step) {
  if (!creep || !step) {
    return {
      status: 'input-missing',
      position: null
    };
  }

  const position = creep.pos.findClosestByPath(
    step.exit,
    {
      maxOps: 4000,
      ignoreCreeps: false
    }
  );

  return position
    ? { status: 'exit-position-ready', position }
    : { status: 'exit-position-unreachable', position: null };
}</code></pre>
<p><code>findClosestByPath()</code> answers a tile-level question inside the current room. A valid room step does not guarantee that walls, structures, traffic, or custom costs allow access to an exit tile.</p>

<h2 id="execute-one-step">Execute one room step and rebuild after transition</h2>
<pre><code class="language-javascript">function moveTowardTargetRoom(
  creep,
  targetRoom,
  policy
) {
  if (!creep) {
    return { status: 'creep-missing' };
  }

  if (creep.room.name === targetRoom) {
    delete creep.memory.routeStep;
    return { status: 'target-room-reached' };
  }

  const routeResult = calculateRoomRoute(
    creep.room.name,
    targetRoom,
    policy
  );
  const firstStep = validateFirstRouteStep(
    creep.room.name,
    routeResult
  );

  if (firstStep.status !== 'first-step-ready') {
    return firstStep;
  }

  const exitResult = chooseExitPosition(
    creep,
    firstStep.step
  );

  if (exitResult.status !== 'exit-position-ready') {
    return exitResult;
  }

  creep.memory.routeStep = {
    fromRoom: creep.room.name,
    targetRoom,
    nextRoom: firstStep.step.room,
    exit: firstStep.step.exit,
    builtAt: Game.time
  };

  const moveResult = creep.moveTo(
    exitResult.position,
    {
      range: 0,
      reusePath: 5,
      maxRooms: 1
    }
  );

  return {
    status: moveResult === OK
      ? 'movement-submitted'
      : 'movement-rejected',
    moveResult,
    nextRoom: firstStep.step.room,
    exitPosition: {
      roomName: exitResult.position.roomName,
      x: exitResult.position.x,
      y: exitResult.position.y
    }
  };
}</code></pre>
<p>Recalculate after <code>creep.room.name</code> changes. This trades some route calculations for a small, recoverable state boundary. A shared route cache can be added later only with destination, policy-version, and invalidation rules.</p>

<h2 id="room-edge">Treat the room edge as a later-tick observation</h2>
<p><code>moveTo()</code> submits movement for the current tick. Record the current room, next room, exit direction, exit position, and movement result. On later ticks, compare the new <code>roomName:x:y</code>. An accepted order does not prove the Creep crossed the border during the same script execution.</p>

<h2 id="intel-boundary">Room-name patterns are not live safety evidence</h2>
<p>Highway or sector classification can influence preference, but it does not reveal current hostiles, Towers, ownership, Invader Cores, Nukes, or temporary combat conditions. Timestamp any stored intel and expose an <code>unknown</code> state rather than silently treating missing vision as safe.</p>

<h2 id="destination-task">Entering the target room is not final completion</h2>
<p>After the room transition, the role still needs a target position, Flag, Controller, Source, Structure, or object ID. Use <a href="/en/blog/screeps-roomposition-distance">the RoomPosition guide</a> for local range choices and <a href="/en/blog/screeps-pathfinder-costmatrix">the CostMatrix guide</a> for custom tile policy.</p>

<h2 id="verify-ticks">Verify route, exit, and transition separately</h2>
<p>Test same-room completion, a valid adjacent step, a hard-blocked corridor, a finite-risk corridor, an unreachable exit tile, and a successful room transition as separate cases. This revision contains static analysis and syntax checks only; live cross-room movement remains pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.map.findRoute" rel="nofollow">API Reference: Game.map.findRoute()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.map.describeExits" rel="nofollow">API Reference: Game.map.describeExits()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomPosition.findClosestByPath" rel="nofollow">API Reference: RoomPosition.findClosestByPath()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">API Reference: Creep.moveTo()</a></li>
</ul>`;

const deadMemoryHtml = String.raw`
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this page when names remain under <code>Memory.creeps</code> after the corresponding Creeps disappear from <code>Game.creeps</code>. The safe operation is narrow: identify names that are absent now, delete their Creep-owned Memory, then clean only the additional name-indexed structures whose schemas you explicitly own.</p>

<h2 id="three-boundaries">Separate existence, ownership, and cause</h2>
<div class="table-scroll"><table>
<thead><tr><th>Question</th><th>What the cleanup can know</th></tr></thead>
<tbody>
<tr><td>Does the Creep exist now?</td><td><code>Object.hasOwn(Game.creeps, name)</code></td></tr>
<tr><td>Which data belongs to that name?</td><td>Only documented project namespaces</td></tr>
<tr><td>Why did it disappear?</td><td>Not proven by the missing name alone</td></tr>
</tbody></table></div>
<p>Absence can confirm that the current Creep is gone. It does not distinguish natural expiry, combat, suicide, recycling, or another cause.</p>

<h2 id="collect-names">Collect confirmed missing names before mutating Memory</h2>
<pre><code class="language-javascript">function collectDeadCreepNames(
  gameCreeps,
  memoryCreeps
) {
  if (
    !gameCreeps
    || typeof gameCreeps !== 'object'
    || !memoryCreeps
    || typeof memoryCreeps !== 'object'
    || Array.isArray(memoryCreeps)
  ) {
    return [];
  }

  return Object.keys(memoryCreeps)
    .filter(name => !Object.hasOwn(gameCreeps, name))
    .sort();
}</code></pre>
<p>Starting from <code>Memory.creeps</code> is essential because dead names are already absent from <code>Game.creeps</code>. Collecting the list first also gives later cleanup steps one stable input.</p>

<h2 id="owned-indexes">Clean only explicitly owned name indexes</h2>
<pre><code class="language-javascript">function deleteNameKey(record, name) {
  if (
    !record
    || typeof record !== 'object'
    || Array.isArray(record)
  ) {
    return false;
  }

  return delete record[name];
}

function cleanOwnedCreepIndexes(name) {
  const results = {
    creepMemory: deleteNameKey(
      Memory.creeps,
      name
    ),
    task: deleteNameKey(
      Memory.creepTasks,
      name
    ),
    assignment: deleteNameKey(
      Memory.creepAssignments,
      name
    )
  };

  return results;
}</code></pre>
<p>Do not recursively search all Memory for matching text. A Creep name may appear in a historical event, room note, shared queue, combat report, or unrelated user-defined key. Each additional namespace needs its own ownership and retention rule.</p>

<h2 id="cleanup-function">Return a bounded cleanup report</h2>
<pre><code class="language-javascript">function cleanDeadCreepMemory(limit = 20) {
  Memory.creeps ??= {};

  const names = collectDeadCreepNames(
    Game.creeps,
    Memory.creeps
  );
  const removed = [];

  for (const name of names) {
    removed.push({
      name,
      indexes: cleanOwnedCreepIndexes(name)
    });
  }

  return {
    status: names.length > 0
      ? 'stale-names-removed'
      : 'nothing-to-remove',
    count: names.length,
    names: names.slice(0, limit),
    truncated: names.length > limit,
    removed
  };
}</code></pre>
<p>The full <code>removed</code> array is useful to in-process callers. Keep Console output bounded so a mass loss does not flood logs.</p>

<h2 id="loop-order">Run cleanup before counts, assignments, and spawning</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const cleanup = cleanDeadCreepMemory(20);

  if (cleanup.count > 0) {
    console.log(JSON.stringify({
      type: 'dead-creep-memory-cleanup',
      tick: Game.time,
      count: cleanup.count,
      names: cleanup.names,
      truncated: cleanup.truncated
    }));
  }

  runRoleCounts();
  runReplacementPlanning();
  runSpawnManager();
};</code></pre>
<p>Cleaning first prevents stale names from influencing role quotas or replacement decisions. The cleanup should not return early from the game loop and skip essential room work.</p>

<h2 id="shared-references">Shared queues and ID records need separate invalidation</h2>
<p>A task queue may store a Creep name inside an array of records rather than as an object key. Removing those records requires a queue-specific rule: is the record disposable, should it become unassigned, or should it remain as history? Likewise, object IDs and remote-room plans are not dead merely because one Creep name disappeared. Use <a href="/en/blog/screeps-get-object-by-id">the target-restoration guide</a> for object-ID validity.</p>

<h2 id="ttl-and-reason">Do not delete from ticksToLive or invent a death reason</h2>
<p>A Creep with <code>ticksToLive === 1</code> still exists in the current tick. Delete only after its name is absent from the current <code>Game.creeps</code> object. If the project needs a cause, record the relevant event before the Creep disappears; the cleanup pass cannot reconstruct it reliably afterward.</p>

<h2 id="name-reuse">Make name reuse start from a clean namespace</h2>
<p>Run cleanup before attempting to reuse a deterministic name. Pass fresh Memory in the new <code>spawnCreep()</code> request, and use an assignment generation or request ID when other systems must distinguish successive Creeps with the same name. Use <a href="/en/blog/screeps-spawncreep-return-codes">the Spawn diagnostic</a> for the final request.</p>

<h2 id="verify-cycle">Verify deletion and replacement as separate events</h2>
<p>Record the stale name list and the exact namespaces changed on the cleanup tick. On later ticks, verify that role counts no longer include the old Creep and that a replacement receives new Memory and assignments. This revision contains static analysis and offline cleanup checks only; a live death-and-replacement cycle remains pending.</p>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-memory-basics">the Memory guide</a> for persistent-state design. Use this page only for confirmed missing Creep names and the project-owned indexes attached to those names.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow">API Reference: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.memory" rel="nofollow">API Reference: Creep.memory</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow">Global Objects: Game and Memory</a></li>
</ul>`;

export const englishEditorialSpawnRouteMemoryOverrides20260731: Record<
  string,
  EnglishBeginnerArticle
> = {
  "screeps-dynamic-creep-body": {
    ...dynamicBodySource,
    title: "Screeps Dynamic Creep Body: Minimum, Target, and Emergency Plans",
    headline: "Build a Dynamic Creep Body Without Spending Energy Blindly",
    description:
      "Separate minimum, target, and emergency body policies; scale one role template within current Energy and the 50-part limit; then validate spawning separately.",
    category: "SPAWNING · BODY BUDGET POLICY",
    readingTime: "13 min read",
    keywords: [
      "Screeps dynamic Creep body",
      "Screeps minimum Creep body",
      "Screeps emergency body",
      "room.energyAvailable body",
      "Screeps 50 body part limit",
      "CREEP_SPAWN_TIME",
    ],
    primaryKeyword: "Screeps dynamic Creep body",
    searchIntent:
      "Build one legal role body from an explicit minimum, current Energy budget, role cap, and emergency policy",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official documentation", "Checked against Room Energy, body-cost, body-limit, and spawning documentation"],
      ["Technical correction", "Minimum capability, target budget, emergency scaling, and Spawn submission are separate decisions"],
      ["JavaScript syntax", "Passed by the editorial batch gate"],
      ["Evidence level", "Official documentation review, repository review, syntax checks, and static analysis only"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick verification", "Pending"],
      ["Live replacement and emergency-spawn test", "Pending"],
      ["Last editorial review", "July 31, 2026"],
    ],
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["three-body-levels", "Minimum, target, and emergency plans"],
      ["energy-boundary", "Current Energy versus capacity"],
      ["cost-and-inputs", "Validate parts and derive cost"],
      ["scaled-builder", "Scale complete repeat units"],
      ["role-example", "Keep the template role-specific"],
      ["wait-or-spawn", "Decide whether to wait"],
      ["spawn-boundary", "Validate and submit separately"],
      ["damage-and-movement", "Body order and MOVE ratio"],
      ["verify-ticks", "Verify across later ticks"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: dynamicBodyHtml,
  },
  "screeps-map-find-route": {
    ...routeSource,
    title: "Screeps Game.map.findRoute(): Plan and Execute One Room Step",
    headline: "Turn a Room Route into One Validated Exit Step",
    description:
      "Separate room planning from exit-tile pathfinding, validate the first route step, use finite risk costs versus hard bans, and verify the border transition on later ticks.",
    category: "MOVEMENT · CROSS-ROOM ROUTE EXECUTION",
    readingTime: "14 min read",
    keywords: [
      "Screeps Game.map.findRoute",
      "Screeps cross-room route",
      "Screeps routeCallback Infinity",
      "Screeps exit tile",
      "Game.map.describeExits",
      "Screeps room transition",
    ],
    primaryKeyword: "Screeps Game.map.findRoute",
    searchIntent:
      "Turn one room-level route result into a validated, reachable next-room movement step",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official documentation", "Checked against findRoute(), describeExits(), findClosestByPath(), and moveTo() documentation"],
      ["Technical correction", "Room planning, exit reachability, border transition, and destination behavior are separate stages"],
      ["JavaScript syntax", "Passed by the editorial batch gate"],
      ["Evidence level", "Official documentation review, repository review, syntax checks, and static analysis only"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick verification", "Pending"],
      ["Live cross-room route and border-transition test", "Pending"],
      ["Last editorial review", "July 31, 2026"],
    ],
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["four-stages", "Keep four stages separate"],
      ["route-policy", "Finite costs and hard bans"],
      ["calculate-route", "Calculate the room route"],
      ["validate-first-step", "Validate the first step"],
      ["choose-exit-tile", "Choose a reachable exit tile"],
      ["execute-one-step", "Execute one room step"],
      ["room-edge", "Observe the room transition later"],
      ["intel-boundary", "Keep safety claims bounded"],
      ["destination-task", "Continue inside the target room"],
      ["verify-ticks", "Verify route, exit, and transition"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: routeHtml,
  },
  "screeps-clean-dead-creep-memory": {
    ...deadMemorySource,
    title: "Screeps Dead Creep Memory: Clean Names and Owned Indexes",
    headline: "Clean Dead Creep Memory Without Deleting Unrelated State",
    description:
      "Collect names absent from Game.creeps, remove their Creep-owned Memory, clean only documented name indexes, bound logs, and keep death cause and shared queues separate.",
    category: "MEMORY · DEAD-CREEP CLEANUP",
    readingTime: "11 min read",
    keywords: [
      "Screeps clean dead Creep Memory",
      "Memory.creeps cleanup",
      "Game.creeps dead Creep",
      "Screeps stale Creep assignment",
      "Screeps Creep name reuse",
    ],
    primaryKeyword: "Screeps clean dead Creep Memory",
    searchIntent:
      "Remove confirmed stale Creep-name state without deleting unrelated Memory or inventing a death cause",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official documentation", "Checked against Game.creeps, Creep.memory, and Memory lifecycle documentation"],
      ["Technical correction", "Existence detection, owned-index cleanup, shared references, and death cause are separated"],
      ["JavaScript syntax", "Passed by the editorial batch gate"],
      ["Evidence level", "Official documentation review, repository review, syntax checks, and static analysis only"],
      ["Screeps Console test", "Pending"],
      ["Live multi-tick verification", "Pending"],
      ["Live death, cleanup, and name-reuse test", "Pending"],
      ["Last editorial review", "July 31, 2026"],
    ],
    toc: [
      ["use-this-guide", "Use this guide when"],
      ["three-boundaries", "Existence, ownership, and cause"],
      ["collect-names", "Collect confirmed missing names"],
      ["owned-indexes", "Clean owned name indexes"],
      ["cleanup-function", "Return a bounded report"],
      ["loop-order", "Run cleanup before planning"],
      ["shared-references", "Handle shared references separately"],
      ["ttl-and-reason", "Avoid TTL and cause guesses"],
      ["name-reuse", "Prepare safe name reuse"],
      ["verify-cycle", "Verify deletion and replacement"],
      ["choose-another-guide", "Choose another guide when"],
      ["official-docs", "Official documentation"],
    ],
    faq: [],
    articleHtml: deadMemoryHtml,
  },
};
