import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { englishFortificationRepairArticle } from "./english-fortification-repair-17";
import { englishMineralExtractorArticle } from "./english-mineral-extractor-12";
import { englishPowerSpawnArticle } from "./english-power-spawn-12";

const fortificationRepairArticle: EnglishBeginnerArticle = {
  ...englishFortificationRepairArticle,
  title: "Screeps Fortification Repair: Stages, Reservations, and Event Proof",
  headline: "Repair Walls and Ramparts Without Hiding Duplicate Work",
  description:
    "Set room-specific Wall and Rampart stages, reserve targets across repairers, record only accepted repair calls, and verify the exact Repairer-to-structure EVENT_REPAIR on the next tick.",
  category: "DEFENSE · STAGED REPAIR AND EVENT IDENTITY",
  updatedAt: "2026-08-03",
  readingTime: "21 min read",
  primaryKeyword: "Screeps fortification repair limit",
  searchIntent:
    "Coordinate staged Wall and Rampart repair across multiple Creeps and verify the exact accepted repair action",
  finalScore: 98,
  keywords: [
    "Screeps fortification repair limit",
    "Screeps EVENT_REPAIR",
    "Screeps Wall Rampart stage",
    "Screeps repair target reservation",
    "Room.getEventLog repair",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — Creep repair emits EVENT_REPAIR with Repairer objectId, targetId, amount and energySpent"],
    ["Policy boundary", "Stage values and structure priority are room strategy, not official safety thresholds"],
    ["Static code review", "Passed — one room coordinator, duplicate-Creep guard, target reservation and exact next-tick identity"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["decision-model", "Separate the repair stage from target identity"],
    ["room-policy", "Define a room policy"],
    ["coordinator", "Reserve targets in one coordinator"],
    ["submit", "Record only accepted repair calls"],
    ["verify", "Verify the exact repair event"],
    ["event-meaning", "Use event amount without overclaiming"],
    ["failure-states", "Keep missing and ambiguous states visible"],
    ["production-boundary", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="decision-model">Separate the repair stage from target identity</h2>
<p>A fortification stage answers <em>how far</em> the room is willing to repair. It does not answer which Repairer acted, which structure received the action, or whether several Repairers selected the same weak target. Treat those as separate contracts:</p>
<ul>
<li>a reviewed room policy defines eligible structure types and current hits stages;</li>
<li>one coordinator assigns a target to each Repairer once per tick;</li>
<li>only an accepted <code>repair()</code> call creates a pending verification record;</li>
<li>the next tick matches the exact Repairer and structure in <code>EVENT_REPAIR</code>.</li>
</ul>
<p>Do not use <code>hitsMax</code> as the operating target. Walls and Ramparts can absorb room Energy indefinitely, while spawning, defense response, upgrading and logistics have shorter deadlines.</p>

<h2 id="room-policy">Define a room policy</h2>
<pre><code class="language-javascript">function readFortificationPolicy(roomName) {
  const value = Memory.fortificationPolicy?.[roomName];

  if (
    !value
    || value.enabled !== true
    || !Number.isFinite(value.wallStage)
    || !Number.isFinite(value.rampartStage)
    || value.wallStage &lt;= 0
    || value.rampartStage &lt;= 0
  ) {
    return { enabled: false };
  }

  return {
    enabled: true,
    stages: {
      [STRUCTURE_WALL]: value.wallStage,
      [STRUCTURE_RAMPART]: value.rampartStage
    }
  };
}</code></pre>
<p>Separate Wall and Rampart stages when their jobs differ. A Rampart protecting a Spawn may deserve a different policy from an outer Wall. The values remain player strategy; no official API constant declares a safe hits target.</p>

<h2 id="coordinator">Reserve targets in one coordinator</h2>
<pre><code class="language-javascript">function createRepairCoordinator(room, policy) {
  const assignedCreeps = new Set();
  const reservedTargets = new Set();

  function chooseTarget(creep) {
    const candidates = room.find(FIND_STRUCTURES, {
      filter: structure =&gt; {
        const stage = policy.stages[structure.structureType];
        return Number.isFinite(stage)
          &amp;&amp; structure.hits &lt; structure.hitsMax
          &amp;&amp; structure.hits &lt; stage
          &amp;&amp; !reservedTargets.has(structure.id);
      }
    });

    return candidates.sort((left, right) =&gt; {
      const leftStage = policy.stages[left.structureType];
      const rightStage = policy.stages[right.structureType];
      const leftDeficit = (leftStage - left.hits) / leftStage;
      const rightDeficit = (rightStage - right.hits) / rightStage;

      return rightDeficit - leftDeficit
        || left.hits - right.hits
        || creep.pos.getRangeTo(left) - creep.pos.getRangeTo(right)
        || left.id.localeCompare(right.id);
    })[0] || null;
  }

  return {
    assign(creep) {
      if (!creep || assignedCreeps.has(creep.id)) {
        return { status: 'creep-already-assigned' };
      }

      assignedCreeps.add(creep.id);
      const target = chooseTarget(creep);
      if (!target) return { status: 'stage-complete' };

      reservedTargets.add(target.id);
      return { status: 'assigned', target };
    },
    release(targetId) {
      reservedTargets.delete(targetId);
    }
  };
}</code></pre>
<p>A target reservation is a local scheduling rule, not a game lock. It prevents this coordinator from sending every Repairer to the same lowest-hits structure. A more advanced policy may permit several Repairers on a breach, but that should be explicit rather than accidental.</p>

<h2 id="submit">Record only accepted repair calls</h2>
<pre><code class="language-javascript">function submitFortificationRepair(coordinator, creep) {
  if (
    !creep
    || creep.my !== true
    || creep.spawning === true
    || creep.getActiveBodyparts(WORK) &lt;= 0
    || creep.store.getUsedCapacity(RESOURCE_ENERGY) &lt;= 0
  ) {
    return { status: 'repairer-unavailable' };
  }

  const assignment = coordinator.assign(creep);
  if (assignment.status !== 'assigned') return assignment;

  const target = assignment.target;
  if (!creep.pos.inRangeTo(target, 3)) {
    coordinator.release(target.id);
    return {
      status: 'moving',
      moveResult: creep.moveTo(target, { range: 3, reusePath: 5 }),
      targetId: target.id
    };
  }

  const result = creep.repair(target);
  if (result !== OK) {
    coordinator.release(target.id);
    return { status: 'repair-rejected', result, targetId: target.id };
  }

  Memory.pendingFortificationRepairs ??= {};
  Memory.pendingFortificationRepairs[creep.id] = {
    submittedAt: Game.time,
    roomName: creep.room.name,
    creepId: creep.id,
    creepName: creep.name,
    targetId: target.id,
    targetType: target.structureType,
    hitsBefore: target.hits,
    energyBefore: creep.store.getUsedCapacity(RESOURCE_ENERGY)
  };

  return { status: 'repair-accepted', result, targetId: target.id };
}</code></pre>
<p>Movement is not a repair reservation across ticks. Release the local target when the Creep still needs to travel, then select again from current room state on a later tick. Save a pending record only after the real action returns <code>OK</code>.</p>

<h2 id="verify">Verify the exact repair event</h2>
<pre><code class="language-javascript">function verifyFortificationRepair(pending) {
  if (!pending) return { status: 'no-pending-repair' };
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'repair-event-window-missed' };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) return { status: 'room-not-visible' };

  const matches = room.getEventLog().filter(event =&gt;
    event.event === EVENT_REPAIR
    &amp;&amp; event.objectId === pending.creepId
    &amp;&amp; event.data?.targetId === pending.targetId
  );

  if (matches.length === 0) {
    return { status: 'accepted-repair-event-missing' };
  }
  if (matches.length &gt; 1) {
    return { status: 'repair-event-ambiguous', count: matches.length };
  }

  const event = matches[0];
  const target = Game.getObjectById(pending.targetId);
  return {
    status: 'repair-event-observed',
    amount: event.data?.amount ?? null,
    energySpent: event.data?.energySpent ?? null,
    hitsBefore: pending.hitsBefore,
    hitsNow: target?.hits ?? null
  };
}</code></pre>
<p>The room event log is a one-tick evidence window. Run verification before submitting the next action for that Repairer, then clear or archive the pending record after producing a terminal result.</p>

<h2 id="event-meaning">Use event amount without overclaiming</h2>
<p>The official engine records the Repairer as <code>objectId</code>, the repaired structure as <code>targetId</code>, the repair output as <code>amount</code>, and consumed Energy as <code>energySpent</code>. That identity is stronger than a net hits delta. The structure may also receive Tower repair, another Creep repair, or damage during the same processed tick, so <code>hitsNow - hitsBefore</code> is not necessarily equal to this one event amount.</p>

<h2 id="failure-states">Keep missing and ambiguous states visible</h2>
<div class="table-scroll"><table>
<thead><tr><th>Status</th><th>Meaning</th><th>Next action</th></tr></thead>
<tbody>
<tr><td><code>stage-complete</code></td><td>No eligible structure is below its configured stage</td><td>Stop repairing; do not auto-raise the stage</td></tr>
<tr><td><code>moving</code></td><td>No repair call was accepted</td><td>Inspect movement and retry from current state</td></tr>
<tr><td><code>repair-rejected</code></td><td>The API rejected the current action</td><td>Use the saved return code</td></tr>
<tr><td><code>accepted-repair-event-missing</code></td><td>An accepted call lacks the expected next-tick event</td><td>Keep the discrepancy; do not replace it with a hits guess</td></tr>
<tr><td><code>repair-event-ambiguous</code></td><td>More than one exact match was found</td><td>Inspect duplicate dispatch or corrupted pending state</td></tr>
<tr><td><code>repair-event-window-missed</code></td><td>Verification ran too late</td><td>Record the missed window and sample a later action</td></tr>
</tbody></table></div>

<h2 id="production-boundary">Production integration boundary</h2>
<p>Call the coordinator once per owned room and route all fortification Repairers through it. Keep emergency Tower logic, hostile response, repairer Energy supply and stage promotion in separate policies. Console execution, live multi-tick results and genuine room screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>Creep.repair()</code>, <code>Room.getEventLog()</code>, <code>EVENT_REPAIR</code>, Walls, Ramparts, body boosts and action return codes before adapting the examples.</p>
`,
};

const mineralHarvestArticle: EnglishBeginnerArticle = {
  ...englishMineralExtractorArticle,
  title: "Screeps Mineral Harvesting: Exact Miner and Mineral Event Identity",
  headline: "Verify Mineral Harvesting Without Trusting Store Deltas Alone",
  description:
    "Validate the same-tile Extractor and Miner, record only accepted harvest calls, match the exact EVENT_HARVEST on the next tick, and separate event identity from Store overflow and depletion.",
  category: "RESOURCES · MINERAL HARVEST EVENT IDENTITY",
  updatedAt: "2026-08-03",
  readingTime: "20 min read",
  primaryKeyword: "Screeps mineral harvest event",
  searchIntent:
    "Run and verify one exact Mineral harvest action while handling Extractor cooldown, depletion, Store overflow and the one-tick event window",
  finalScore: 98,
  keywords: [
    "Screeps mineral harvest event",
    "Screeps EVENT_HARVEST mineral",
    "Screeps Extractor cooldown",
    "Screeps Mineral depletion",
    "Room.getEventLog harvest",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — Mineral harvest emits EVENT_HARVEST with Miner objectId and Mineral targetId"],
    ["Amount boundary", "The engine event can report body harvest power while remaining Mineral and Store overflow can limit retained resources"],
    ["Static code review", "Passed — exact Miner, Mineral and Extractor identity with one-tick verification"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["contract", "Define the Mineral harvest contract"],
    ["resolve", "Resolve the exact Mineral and Extractor"],
    ["preflight", "Check the Miner without inventing success"],
    ["submit", "Save only accepted harvest identity"],
    ["verify", "Match the exact harvest event"],
    ["amount-boundary", "Separate event amount from retained Store gain"],
    ["depletion", "Treat depletion as a state transition"],
    ["production-boundary", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="contract">Define the Mineral harvest contract</h2>
<p>A valid Mineral operation binds three objects: one Miner, the room's Mineral, and the active Extractor occupying that Mineral's tile. A room-level Extractor lookup is not enough, and a later Store increase does not identify which action produced it.</p>
<p>The workflow should therefore separate current-tick submission from next-tick verification:</p>
<ul>
<li>resolve the current objects and validate their relationship;</li>
<li>move when the Miner is outside range 1;</li>
<li>save IDs only after <code>harvest()</code> returns <code>OK</code>;</li>
<li>on the next tick, match <code>EVENT_HARVEST</code> by exact Miner and Mineral IDs.</li>
</ul>

<h2 id="resolve">Resolve the exact Mineral and Extractor</h2>
<pre><code class="language-javascript">function resolveMineralStation(room) {
  const mineral = room?.find(FIND_MINERALS)[0] || null;
  if (!mineral) {
    return { ready: false, status: 'mineral-missing' };
  }

  const extractor = mineral.pos
    .lookFor(LOOK_STRUCTURES)
    .find(structure =&gt;
      structure.structureType === STRUCTURE_EXTRACTOR
    ) || null;

  if (!extractor) {
    return { ready: false, status: 'extractor-missing', mineral };
  }
  if (extractor.my !== true || extractor.isActive() !== true) {
    return { ready: false, status: 'extractor-inactive', mineral, extractor };
  }

  return { ready: true, status: 'station-ready', mineral, extractor };
}</code></pre>
<p>When <code>mineralAmount</code> is zero, keep the Mineral object as the source of truth. Its regeneration state belongs to the object, not to a Memory countdown copied on an earlier tick.</p>

<h2 id="preflight">Check the Miner without inventing success</h2>
<pre><code class="language-javascript">function inspectMinerForStation(creep, station) {
  if (!creep || creep.my !== true || creep.spawning === true) {
    return { ready: false, status: 'miner-unavailable' };
  }
  if (creep.room.name !== station.mineral.pos.roomName) {
    return { ready: false, status: 'miner-in-wrong-room' };
  }
  if (station.mineral.mineralAmount &lt;= 0) {
    return {
      ready: false,
      status: 'mineral-regenerating',
      ticksToRegeneration:
        station.mineral.ticksToRegeneration ?? null
    };
  }
  if (station.extractor.cooldown &gt; 0) {
    return {
      ready: false,
      status: 'extractor-cooldown',
      cooldown: station.extractor.cooldown
    };
  }
  if (creep.getActiveBodyparts(WORK) &lt;= 0) {
    return { ready: false, status: 'no-active-work' };
  }
  if (
    creep.store.getFreeCapacity(
      station.mineral.mineralType
    ) &lt;= 0
  ) {
    return { ready: false, status: 'no-mineral-capacity' };
  }

  return { ready: true, status: 'miner-ready' };
}</code></pre>
<p>The capacity check is an efficiency policy. The engine can drop overflow after harvesting, so a careless call may still create an event without retaining the full output in the Creep Store.</p>

<h2 id="submit">Save only accepted harvest identity</h2>
<pre><code class="language-javascript">function submitMineralHarvest(creep) {
  const station = resolveMineralStation(creep?.room);
  if (!station.ready) return station;

  const state = inspectMinerForStation(creep, station);
  if (!state.ready) return state;

  const { mineral, extractor } = station;
  if (!creep.pos.isNearTo(mineral)) {
    return {
      status: 'moving-to-mineral',
      moveResult: creep.moveTo(mineral, {
        range: 1,
        reusePath: 10
      })
    };
  }

  const result = creep.harvest(mineral);
  if (result !== OK) {
    return {
      status: 'harvest-rejected',
      result,
      mineralId: mineral.id,
      extractorId: extractor.id
    };
  }

  Memory.pendingMineralHarvests ??= {};
  Memory.pendingMineralHarvests[creep.id] = {
    submittedAt: Game.time,
    roomName: creep.room.name,
    creepId: creep.id,
    creepName: creep.name,
    mineralId: mineral.id,
    mineralType: mineral.mineralType,
    extractorId: extractor.id,
    mineralBefore: mineral.mineralAmount,
    storeBefore:
      creep.store.getUsedCapacity(mineral.mineralType)
  };

  return {
    status: 'harvest-accepted',
    result,
    mineralId: mineral.id,
    extractorId: extractor.id
  };
}</code></pre>
<p><code>ERR_NOT_IN_RANGE</code> belongs to the attempted harvest action. This example checks range first so movement and harvesting remain separate intents with separate statuses.</p>

<h2 id="verify">Match the exact harvest event</h2>
<pre><code class="language-javascript">function verifyMineralHarvest(pending) {
  if (!pending) return { status: 'no-pending-harvest' };
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'harvest-event-window-missed' };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) return { status: 'room-not-visible' };

  const matches = room.getEventLog().filter(event =&gt;
    event.event === EVENT_HARVEST
    &amp;&amp; event.objectId === pending.creepId
    &amp;&amp; event.data?.targetId === pending.mineralId
  );

  if (matches.length === 0) {
    return { status: 'accepted-harvest-event-missing' };
  }
  if (matches.length &gt; 1) {
    return { status: 'harvest-event-ambiguous', count: matches.length };
  }

  const mineral = Game.getObjectById(pending.mineralId);
  const creep = Game.getObjectById(pending.creepId);
  return {
    status: 'harvest-event-observed',
    eventAmount: matches[0].data?.amount ?? null,
    mineralBefore: pending.mineralBefore,
    mineralNow: mineral?.mineralAmount ?? null,
    storeBefore: pending.storeBefore,
    storeNow: creep
      ? creep.store.getUsedCapacity(pending.mineralType)
      : null
  };
}</code></pre>
<p>Run this verifier before replacing the pending record with a new action. Room events are available for a narrow window; a later net comparison cannot reconstruct exact actor-target identity.</p>

<h2 id="amount-boundary">Separate event amount from retained Store gain</h2>
<p>The official engine records the Miner as <code>objectId</code> and the Mineral as <code>targetId</code>. In the Mineral branch, the event amount is based on harvest power, while remaining Mineral can cap the amount removed and Store overflow can be dropped. Therefore:</p>
<ul>
<li>use the event to prove actor-target identity;</li>
<li>use current <code>mineralAmount</code> to describe depletion;</li>
<li>use the Creep Store to describe retained resources;</li>
<li>do not require all three numeric deltas to equal the event amount at the final harvest.</li>
</ul>

<h2 id="depletion">Treat depletion as a state transition</h2>
<pre><code class="language-javascript">function describeMineralAvailability(mineral) {
  if (!mineral) return { status: 'mineral-missing' };

  if (mineral.mineralAmount &lt;= 0) {
    return {
      status: 'mineral-regenerating',
      ticksToRegeneration:
        mineral.ticksToRegeneration ?? null
    };
  }

  return {
    status: 'mineral-available',
    mineralAmount: mineral.mineralAmount,
    mineralType: mineral.mineralType
  };
}</code></pre>
<p>Stop generating harvest intents while the Mineral is depleted. Keep logistics and replacement decisions separate from the harvest verifier so a delivery action cannot overwrite pending harvest evidence.</p>

<h2 id="production-boundary">Production integration boundary</h2>
<p>Use one role runner for each fixed Mineral station, verify the prior accepted action before submitting the next one, and keep hauling in another state. Console execution, real cooldown timing, depletion, regeneration and screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for Minerals, Extractors, <code>Creep.harvest()</code>, Store capacity, <code>Room.getEventLog()</code>, <code>EVENT_HARVEST</code> and action return codes.</p>
`,
};

const powerProcessingArticle: EnglishBeginnerArticle = {
  ...englishPowerSpawnArticle,
  title: "Screeps processPower(): Single Dispatch and Local Resource Proof",
  headline: "Verify Power Processing Without Inventing an Event",
  description:
    "Dispatch processPower once per Power Spawn and tick, preserve a room Energy reserve, save the exact planned resource signature, and mark transfer-confounded or unverifiable results honestly.",
  category: "RESOURCES · POWER PROCESSING EVIDENCE",
  updatedAt: "2026-08-03",
  readingTime: "21 min read",
  primaryKeyword: "Screeps processPower verification",
  searchIntent:
    "Coordinate and verify processPower calls using exact Power Spawn identity and local resource signatures without claiming a nonexistent event",
  finalScore: 98,
  keywords: [
    "Screeps processPower verification",
    "Screeps Power Spawn coordinator",
    "POWER_SPAWN_ENERGY_RATIO",
    "PWR_OPERATE_POWER",
    "Screeps GPL attribution",
  ],
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official engine", "Checked — processPower consumes local Power and Energy but does not emit a Room event"],
    ["Attribution boundary", "Exact local resource signatures are supporting evidence; account GPL can be changed by another Power Spawn"],
    ["Static code review", "Passed — exact structure ID, same-tick guard, reserve check, pending signature and transfer-confound detection"],
    ["JavaScript syntax", "Passed"],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Genuine room or Console screenshots", "Pending"],
    ["Last verified", "August 3, 2026"],
  ],
  toc: [
    ["evidence-limit", "Start with the missing event"],
    ["plan", "Calculate the exact local plan"],
    ["budget", "Protect the room budget"],
    ["dispatcher", "Dispatch once per structure and tick"],
    ["verify", "Verify the next-tick resource signature"],
    ["confounds", "Detect transfer confounds"],
    ["gpl", "Use GPL only as corroboration"],
    ["production-boundary", "Production integration boundary"],
    ["official-docs", "Official documentation"],
  ],
  faq: [],
  articleHtml: String.raw`
<h2 id="evidence-limit">Start with the missing event</h2>
<p><code>StructurePowerSpawn.processPower()</code> does not currently create a Room event in the official engine. Do not invent an <code>EVENT_PROCESS_POWER</code>, and do not claim that an account-level GPL increase uniquely identifies one Power Spawn.</p>
<p>The strongest practical workflow available from normal game objects is:</p>
<ul>
<li>one dispatcher owns all Power Spawn processing calls;</li>
<li>each exact Power Spawn can be submitted at most once per tick;</li>
<li>the dispatcher stores the planned Power and Energy signature only after <code>OK</code>;</li>
<li>the next tick checks the same structure and labels conflicting transfers.</li>
</ul>

<h2 id="plan">Calculate the exact local plan</h2>
<pre><code class="language-javascript">function getProcessPowerPlan(powerSpawn) {
  const effect = (powerSpawn.effects || []).find(item =&gt;
    item.effect === PWR_OPERATE_POWER
  );

  let powerAmount = 1;
  if (effect &amp;&amp; Number.isInteger(effect.level)) {
    const values = POWER_INFO[PWR_OPERATE_POWER]?.effect;
    const extra = Array.isArray(values)
      ? values[effect.level - 1]
      : null;

    if (Number.isFinite(extra)) {
      powerAmount += extra;
    }
  }

  powerAmount = Math.min(
    powerAmount,
    powerSpawn.store.getUsedCapacity(RESOURCE_POWER)
  );

  return {
    powerAmount,
    energyAmount:
      powerAmount * POWER_SPAWN_ENERGY_RATIO,
    effectLevel: effect?.level ?? null
  };
}</code></pre>
<p>Snapshot the plan before submission. An effect may expire later, but the pending record must describe what the dispatcher expected for the submitted tick.</p>

<h2 id="budget">Protect the room budget</h2>
<pre><code class="language-javascript">function getBudgetedRoomEnergy(room, powerSpawn) {
  const storage = room.storage?.store.getUsedCapacity(
    RESOURCE_ENERGY
  ) || 0;
  const terminal = room.terminal?.store.getUsedCapacity(
    RESOURCE_ENERGY
  ) || 0;
  const local = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  return storage + terminal + local;
}

function canAffordPowerProcessing(
  room,
  powerSpawn,
  plan,
  reserve
) {
  if (
    !Number.isFinite(reserve)
    || reserve &lt; 0
    || plan.powerAmount &lt;= 0
  ) {
    return false;
  }

  return powerSpawn.store.getUsedCapacity(
    RESOURCE_POWER
  ) &gt;= plan.powerAmount
    &amp;&amp; powerSpawn.store.getUsedCapacity(
      RESOURCE_ENERGY
    ) &gt;= plan.energyAmount
    &amp;&amp; getBudgetedRoomEnergy(room, powerSpawn)
      - plan.energyAmount
      &gt;= reserve;
}</code></pre>
<p>The reserve is a room policy, not an official constant. Keep spawn recovery, active defense and Terminal obligations outside this simple stock total when your economy requires stricter commitments.</p>

<h2 id="dispatcher">Dispatch once per structure and tick</h2>
<pre><code class="language-javascript">function createPowerProcessingDispatcher() {
  const submittedIds = new Set();

  return function submit(config) {
    if (!config || config.enabled !== true) {
      return { status: 'disabled' };
    }

    const powerSpawn = Game.getObjectById(
      config.powerSpawnId
    );
    if (
      !powerSpawn
      || powerSpawn.structureType
        !== STRUCTURE_POWER_SPAWN
      || powerSpawn.my !== true
      || powerSpawn.isActive() !== true
    ) {
      return { status: 'power-spawn-unavailable' };
    }

    if (submittedIds.has(powerSpawn.id)) {
      return { status: 'already-submitted-this-tick' };
    }
    submittedIds.add(powerSpawn.id);

    const plan = getProcessPowerPlan(powerSpawn);
    if (
      !canAffordPowerProcessing(
        powerSpawn.room,
        powerSpawn,
        plan,
        config.energyReserve
      )
    ) {
      return { status: 'budget-or-resource-blocked', plan };
    }

    const before = {
      power: powerSpawn.store.getUsedCapacity(
        RESOURCE_POWER
      ),
      energy: powerSpawn.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
      gpl: Game.gpl.progress
    };
    const result = powerSpawn.processPower();

    if (result !== OK) {
      return {
        status: 'processing-rejected',
        result,
        powerSpawnId: powerSpawn.id,
        plan
      };
    }

    Memory.pendingPowerProcessing ??= {};
    Memory.pendingPowerProcessing[powerSpawn.id] = {
      submittedAt: Game.time,
      roomName: powerSpawn.room.name,
      powerSpawnId: powerSpawn.id,
      powerAmount: plan.powerAmount,
      energyAmount: plan.energyAmount,
      effectLevel: plan.effectLevel,
      before
    };

    return {
      status: 'processing-accepted',
      result,
      powerSpawnId: powerSpawn.id,
      plan
    };
  };
}</code></pre>
<p>The in-memory <code>Set</code> protects one script execution. A production empire should instantiate the dispatcher once near the top of the main loop and route every module through it.</p>

<h2 id="verify">Verify the next-tick resource signature</h2>
<pre><code class="language-javascript">function verifyPowerProcessing(pending) {
  if (!pending) return { status: 'no-pending-process' };
  if (Game.time &lt;= pending.submittedAt) {
    return { status: 'wait-for-next-tick' };
  }
  if (Game.time &gt; pending.submittedAt + 1) {
    return { status: 'process-window-missed' };
  }

  const powerSpawn = Game.getObjectById(
    pending.powerSpawnId
  );
  if (!powerSpawn) {
    return { status: 'power-spawn-missing' };
  }

  const powerNow = powerSpawn.store.getUsedCapacity(
    RESOURCE_POWER
  );
  const energyNow = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  return {
    status:
      powerNow === pending.before.power
        - pending.powerAmount
      &amp;&amp; energyNow === pending.before.energy
        - pending.energyAmount
        ? 'local-signature-matches'
        : 'local-signature-does-not-match',
    powerBefore: pending.before.power,
    powerNow,
    expectedPowerSpent: pending.powerAmount,
    energyBefore: pending.before.energy,
    energyNow,
    expectedEnergySpent: pending.energyAmount,
    gplBefore: pending.before.gpl,
    gplNow: Game.gpl.progress
  };
}</code></pre>
<p>A matching signature is supporting evidence for this exact structure. It is not the same as an event record, because other operations can change the Power Spawn Store during the same processed tick.</p>

<h2 id="confounds">Detect transfer confounds</h2>
<pre><code class="language-javascript">function findPowerSpawnTransferConfounds(pending) {
  const room = Game.rooms[pending.roomName];
  if (!room) return { status: 'room-not-visible' };

  const events = room.getEventLog().filter(event =&gt;
    event.event === EVENT_TRANSFER
    &amp;&amp; (
      event.objectId === pending.powerSpawnId
      || event.data?.targetId === pending.powerSpawnId
    )
    &amp;&amp; (
      event.data?.resourceType === RESOURCE_ENERGY
      || event.data?.resourceType === RESOURCE_POWER
    )
  );

  return events.length === 0
    ? { status: 'no-transfer-confound-observed' }
    : {
        status: 'transfer-confounded',
        count: events.length
      };
}</code></pre>
<p>Run this alongside the local signature check. A transfer-confounded result is not a failure of <code>processPower()</code>; it means the net Store deltas cannot isolate the process call. The cleanest production design prevents Power or Energy delivery to that structure during the sampled verification tick.</p>

<h2 id="gpl">Use GPL only as corroboration</h2>
<p><code>Game.gpl.progress</code> is account-wide. Another owned Power Spawn can increase it during the same tick, so GPL cannot identify this structure. Report GPL as corroborating context and use the exact Power Spawn Store signature as the local observation. When the signature does not match or transfers are present, keep the result inconclusive rather than manufacturing certainty.</p>

<h2 id="production-boundary">Production integration boundary</h2>
<p>Verify the previous pending sample before submitting another call for the same Power Spawn. Coordinate logistics so a deliberately sampled tick is not confounded, and keep Power delivery, effect scheduling and reserve policy in separate modules. Console execution, real multi-Power-Spawn behavior, CPU cost and screenshots remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<p>Review the official Screeps API for <code>StructurePowerSpawn.processPower()</code>, <code>POWER_SPAWN_ENERGY_RATIO</code>, <code>PWR_OPERATE_POWER</code>, <code>POWER_INFO</code>, <code>Game.gpl</code>, Store and Room events.</p>
`,
};

export const englishEditorialDefenseMineralPowerOverrides20260803: Record<
  string,
  EnglishBeginnerArticle
> = {
  [fortificationRepairArticle.slug]: fortificationRepairArticle,
  [mineralHarvestArticle.slug]: mineralHarvestArticle,
  [powerProcessingArticle.slug]: powerProcessingArticle,
};
