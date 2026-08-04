import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialRecoveryEmergencyOverride20260803 = {
  title: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
  headline: "Recover a Room with No Harvesters Without Spawning Duplicates",
  description: "Detect whether a capable harvester exists or is already spawning, submit one minimum recovery request, save the exact Spawn and Creep name, and verify that request across later ticks.",
  category: "SPAWNING · COLLAPSE RECOVERY STATE",
  readingTime: "17 min read",
  breadcrumbLabel: "Emergency Harvester Recovery",
  tags: [
    "Screeps",
    "Spawn",
    "Harvester",
    "Recovery",
    "Debugging"
  ],
  keywords: [
    "Screeps emergency harvester recovery",
    "Screeps no harvester",
    "Screeps recovery Creep spawning",
    "spawnCreep duplicate prevention",
    "Screeps room collapse recovery"
  ],
  primaryKeyword: "Screeps emergency harvester recovery",
  searchIntent: "Restore one owned room after the capable harvesting workforce disappears without submitting duplicate Spawn requests",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved"
    ],
    [
      "Official docs",
      "Checked — spawnCreep(), Spawning state, room Energy, body parts, and respawn boundary"
    ],
    [
      "Static API review",
      "Passed — current-tick acceptance, exact Spawn/name identity, later-tick creation states"
    ],
    [
      "Offline decision review",
      "Passed — capable, spawning, accepted, below-minimum, rejected, missing, and overdue states"
    ],
    [
      "Human editorial pass",
      "Passed"
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
      "Last verified",
      "August 3, 2026"
    ]
  ],
  toc: [
    [
      "use-this-guide",
      "Use this guide when"
    ],
    [
      "recovery-contract",
      "Define what counts as recovered"
    ],
    [
      "state-model",
      "Use four recovery states"
    ],
    [
      "verify-pending",
      "Verify an accepted request before planning another"
    ],
    [
      "submit-once",
      "Submit one minimum recovery request"
    ],
    [
      "loop-order",
      "Put recovery ahead of normal Spawn policy"
    ],
    [
      "below-minimum",
      "When the room is below the minimum cost"
    ],
    [
      "return-codes",
      "Interpret the current-tick result correctly"
    ],
    [
      "production-adaptation",
      "Production adaptation notes"
    ],
    [
      "verification",
      "Verification status and evidence boundary"
    ],
    [
      "official-docs",
      "Official documentation"
    ]
  ],
  faq: [],
  articleHtml: `
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use this recovery branch when an owned visible room has no live general harvester and no matching recovery Creep is already being spawned. The example assumes a general harvester needs active <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code>. A fixed miner-and-hauler economy should define a different minimum contract instead of copying that assumption.</p>
<p>Choose <a href="/en/blog/screeps-dynamic-creep-body">the dynamic body guide</a> when the room still has working Energy income and can wait for a normal target body. Choose <a href="/en/blog/screeps-spawncreep-return-codes">the spawn return-code guide</a> when one specific request is already failing.</p>

<h2 id="recovery-contract">Define what counts as recovered</h2>
<p>A role label alone is not enough. A Creep whose active harvesting or delivery parts have been destroyed may still be present in <code>Game.creeps</code> but unable to restore the room's Energy loop.</p>
<pre><code class="language-javascript">const RECOVERY_ROLE = 'harvester';
const EMERGENCY_BODY = [WORK, CARRY, MOVE];

function isCapableGeneralHarvester(creep, roomName) {
  return Boolean(
    creep
    && creep.my === true
    && creep.spawning !== true
    && creep.memory?.role === RECOVERY_ROLE
    && creep.memory?.homeRoom === roomName
    && creep.getActiveBodyparts(WORK) > 0
    && creep.getActiveBodyparts(CARRY) > 0
    && creep.getActiveBodyparts(MOVE) > 0
  );
}</code></pre>
<p>This contract is project policy. It is intentionally explicit so that a damaged or differently assigned Creep does not silently block emergency recovery.</p>

<h2 id="state-model">Use four recovery states</h2>
<div class="table-scroll"><table>
<thead><tr><th>State</th><th>Meaning</th><th>Next action</th></tr></thead>
<tbody>
<tr><td><code>capable-harvester-exists</code></td><td>The room already has a live Creep that satisfies the recovery contract.</td><td>Run normal spawning.</td></tr>
<tr><td><code>recovery-spawning</code></td><td>The exact accepted recovery name is still present in <code>spawn.spawning</code>.</td><td>Do not submit another recovery request.</td></tr>
<tr><td><code>recovery-creep-ready</code></td><td>The accepted name now exists in <code>Game.creeps</code> and satisfies the contract.</td><td>Clear the pending record and resume normal policy.</td></tr>
<tr><td><code>recovery-needed</code></td><td>No capable live or in-production recovery Creep exists.</td><td>Choose one Spawn and submit one minimum request.</td></tr>
</tbody></table></div>

<h2 id="verify-pending">Verify an accepted request before planning another</h2>
<p>Save the exact Spawn ID and requested Creep name only after the real <code>spawnCreep()</code> call returns <code>OK</code>. On later ticks, recover current objects rather than retaining live references.</p>
<pre><code class="language-javascript">function verifyEmergencyRecovery(room) {
  const pending = room?.memory?.emergencyRecovery;

  if (!pending) {
    return { status: 'no-pending-recovery' };
  }

  if (Game.time <= pending.submittedAt) {
    return {
      status: 'accepted-this-tick',
      creepName: pending.creepName
    };
  }

  const creep = Game.creeps[pending.creepName];

  if (isCapableGeneralHarvester(creep, room.name)) {
    delete room.memory.emergencyRecovery;
    return {
      status: 'recovery-creep-ready',
      creepName: creep.name,
      creepId: creep.id
    };
  }

  const spawn = Game.getObjectById(pending.spawnId);

  if (spawn?.spawning?.name === pending.creepName) {
    return {
      status: 'recovery-spawning',
      creepName: pending.creepName,
      remainingTime: spawn.spawning.remainingTime,
      needTime: spawn.spawning.needTime
    };
  }

  const latestExpectedTick =
    pending.submittedAt
    + pending.bodyLength * CREEP_SPAWN_TIME
    + 1;

  return {
    status: Game.time > latestExpectedTick
      ? 'recovery-overdue'
      : 'accepted-request-not-observed',
    creepName: pending.creepName,
    submittedAt: pending.submittedAt,
    latestExpectedTick
  };
}</code></pre>
<p><code>bodyLength * CREEP_SPAWN_TIME</code> is a base planning boundary. The current <code>spawn.spawning.needTime</code> and <code>remainingTime</code> are better live observations once the Spawn exposes them. A missing match must remain a failure state; do not erase it by submitting a second request immediately.</p>

<h2 id="submit-once">Submit one minimum recovery request</h2>
<pre><code class="language-javascript">function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part)
      );
    }

    return total + cost;
  }, 0);
}

function selectEmergencySpawn(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )[0] ?? null;
}

function createEmergencyName(room, spawn) {
  return [
    'EmergencyHarvester',
    room.name,
    spawn.name,
    Game.time
  ].join('-');
}

function submitEmergencyRecovery(room) {
  if (!room?.controller?.my) {
    return { status: 'owned-room-unavailable' };
  }

  const capable = Object.values(Game.creeps)
    .filter(creep =>
      isCapableGeneralHarvester(creep, room.name)
    );

  if (capable.length > 0) {
    return {
      status: 'capable-harvester-exists',
      count: capable.length
    };
  }

  const pendingState = verifyEmergencyRecovery(room);

  if (
    pendingState.status !== 'no-pending-recovery'
    && pendingState.status !== 'recovery-overdue'
  ) {
    return pendingState;
  }

  const spawn = selectEmergencySpawn(room);

  if (!spawn) {
    return { status: 'spawn-unavailable' };
  }

  const minimumCost = getBodyCost(EMERGENCY_BODY);

  if (room.energyAvailable < minimumCost) {
    return {
      status: 'energy-below-minimum',
      energyAvailable: room.energyAvailable,
      minimumCost
    };
  }

  const creepName = createEmergencyName(room, spawn);
  const memory = {
    role: RECOVERY_ROLE,
    homeRoom: room.name,
    emergencyRecovery: true,
    memoryVersion: 1
  };

  const dryRunResult = spawn.spawnCreep(
    EMERGENCY_BODY,
    creepName,
    {
      memory,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      spawnId: spawn.id,
      creepName,
      dryRunResult
    };
  }

  const result = spawn.spawnCreep(
    EMERGENCY_BODY,
    creepName,
    { memory }
  );

  if (result !== OK) {
    return {
      status: 'spawn-rejected-after-dry-run',
      spawnId: spawn.id,
      creepName,
      dryRunResult,
      result
    };
  }

  room.memory.emergencyRecovery = {
    spawnId: spawn.id,
    creepName,
    submittedAt: Game.time,
    bodyLength: EMERGENCY_BODY.length
  };

  return {
    status: 'emergency-spawn-accepted',
    spawnId: spawn.id,
    creepName,
    submittedAt: Game.time,
    minimumCost,
    dryRunResult,
    result
  };
}</code></pre>
<p>The pending record is written after the final return code, not after the dry run. A dry run checks current conditions but does not reserve the Spawn, the name, or the room's Energy.</p>

<h2 id="loop-order">Put recovery ahead of normal Spawn policy</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  const outcome = submitEmergencyRecovery(room);

  if (
    outcome.status === 'emergency-spawn-accepted'
    || outcome.status === 'recovery-spawning'
    || outcome.status === 'accepted-this-tick'
    || outcome.status === 'accepted-request-not-observed'
  ) {
    return;
  }

  if (
    outcome.status === 'dry-run-rejected'
    || outcome.status === 'spawn-rejected-after-dry-run'
    || outcome.status === 'recovery-overdue'
  ) {
    console.log(JSON.stringify({
      type: 'emergency-recovery',
      roomName: room.name,
      ...outcome
    }));
    return;
  }

  // Continue ordinary quotas only when recovery
  // neither used nor owns a Spawn request.
};</code></pre>
<p>Normal role quotas should not overwrite the diagnostic state of an accepted emergency request. Centralize Spawn submission if more than one module can reach this branch.</p>

<h2 id="below-minimum">When the room is below the minimum cost</h2>
<p>The current standard constants make <code>[WORK, CARRY, MOVE]</code> cost 200 Energy. An established room with no capable workforce and less than the configured minimum cannot create that body from nothing. Recovery may require a surviving hauler, a different valid role contract, Energy support from another room, manual reassignment, or a respawn decision.</p>
<p>The initial-Spawn safety refill is a special respawn protection. Do not generalize it to every established or rebuilt Spawn.</p>

<h2 id="return-codes">Interpret the current-tick result correctly</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning here</th><th>What to inspect next</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The Spawn accepted this request.</td><td>The exact name in <code>spawn.spawning</code> and later <code>Game.creeps</code>.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Another request owns the Spawn.</td><td>Your centralized Spawn coordinator.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>The requested name already exists.</td><td>The pending record and naming policy.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Current Spawn-and-Extension Energy changed or was insufficient.</td><td><code>room.energyAvailable</code> and competing calls.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body, name, or options are malformed.</td><td>The captured request snapshot.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The selected Spawn is inactive at this Controller level.</td><td><code>spawn.isActive()</code> and ownership.</td></tr>
</tbody></table></div>

<h2 id="production-adaptation">Production adaptation notes</h2>
<p>A mature colony should count capability groups rather than one role string, include remote miners and haulers only when they can actually restore this room, and let one Spawn scheduler own all final calls. Keep pending records bounded, retain a terminal failure long enough to diagnose it, and do not report recovery complete until the new Creep exists and satisfies the declared contract.</p>

<h2 id="verification">Verification status and evidence boundary</h2>
<p>The code and API boundaries were checked statically and the pure decision branches were reviewed offline. No real room collapse, Spawn contention, powered spawning, Console output, or live multi-tick recovery sequence was available. Those checks remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.Spawning" rel="nofollow">API Reference: StructureSpawn.Spawning</a></li>
<li><a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">API Reference: Room.energyAvailable</a></li>
<li><a href="https://docs.screeps.com/respawn.html" rel="nofollow">Screeps Documentation: respawning and the initial Spawn</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
