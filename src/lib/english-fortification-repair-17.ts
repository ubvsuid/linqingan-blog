import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishFortificationRepairArticle = {
  slug: "screeps-wall-rampart-repair-limit",
  path: "/en/blog/screeps-wall-rampart-repair-limit",
  chinesePath: "/blog/screeps-wall-rampart-repair-limit",
  title: "Screeps Wall and Rampart Repair Limits: Staged Hits Targets",
  headline: "How to Repair Fortifications to a Room-Specific Stage Instead of hitsMax",
  description:
    "Configure a room-specific absolute hits limit, select the weakest Wall or Rampart below both the limit and hitsMax, require Creep Energy and active WORK, use range 3, save repair() and movement results, and raise stages only through a separate reviewed policy.",
  category: "DEFENSE · STAGED FORTIFICATION REPAIR",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Fortification Repair Limit",
  tags: ["Screeps", "Wall", "Rampart", "Repair", "Defense"],
  keywords: [
    "Screeps Wall Rampart repair limit",
    "Screeps fortification hits target",
    "Screeps Creep repair range 3",
    "Screeps weakest Rampart repair",
    "Screeps staged defense repair",
  ],
  primaryKeyword: "Screeps Wall Rampart repair limit",
  searchIntent: "Repair Walls and Ramparts to a reviewed room-specific absolute hits stage without monopolizing Energy forever",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureWall, StructureRampart, Creep.repair(), repair range, active WORK and return codes"],
    ["Policy boundary", "The hits limit, weakest-first order, Energy policy and stage changes are room strategies, not official safety values"],
    ["Execution boundary", "OK schedules repair; hits, Store and boosted repair output require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline repair review", "Passed — invalid limit, structure filtering, current hits, distance ties, Creep Energy, active WORK and range states"],
    ["Screeps Console test", "Pending"],
    ["Live repair, boosts, pathing, stage completion, RCL hitsMax and multi-repairer test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["why-limit", "Do not repair every fortification to hitsMax"],
    ["room-policy", "Make the hits limit room-specific"],
    ["target-order", "Select the weakest eligible target"],
    ["ready-creep", "Require Energy and active WORK"],
    ["complete-example", "Complete staged repair example"],
    ["range", "Move to repair range 3"],
    ["stop", "Stop at the current stage"],
    ["raise-stage", "Raise the stage separately"],
    ["after-ok", "Verify later state"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Is 100,000 hits an official recommended limit?", "No. It is only an example. Choose stages from room income, RCL, threats, protected Structures, reserves and repair capacity."],
    ["Why use absolute hits instead of hits ratio?", "Wall and Rampart maximum hits are very high and may differ by state. A staged absolute target makes the current defense budget explicit."],
    ["Why move to range 3?", "Creep.repair() works within range 3, so moving adjacent by default can waste travel and crowd the fortification."],
    ["Should the code increase the limit automatically every tick?", "No. Stage changes should be a separate reviewed decision based on Energy reserves, threats and competing room priorities."],
  ],
  previous: {
    href: "/en/blog/screeps-rampart-set-public",
    label: "Previous defense operation",
    title: "Change Rampart Access Safely",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Store an explicit positive <code>hitsLimit</code> for each room. Select only Walls and Ramparts whose current hits are below both that limit and their current <code>hitsMax</code>. Order candidates by lowest hits, then range and stable ID. Require a non-spawning owned Creep with Energy and at least one active <code>WORK</code> part, call <code>repair()</code>, move to range 3 only on <code>ERR_NOT_IN_RANGE</code>, save every result, and stop when no target remains below the current stage.</p>

<h2 id="why-limit">Do not repair every fortification to hitsMax</h2>
<pre><code class="language-javascript">const unsafeCandidates = room.find(FIND_STRUCTURES, {
  filter: structure =>
    structure.hits < structure.hitsMax
});</code></pre>
<p>Walls and Ramparts can remain below their maximum for a very long time. A generic damaged-structure filter can make them absorb most repair Energy and crowd out upgrading, construction, ordinary maintenance and reserves.</p>

<h2 id="room-policy">Make the hits limit room-specific</h2>
<pre><code class="language-javascript">Memory.defenseRepair ??= {};
Memory.defenseRepair.W1N1 = {
  enabled: true,
  hitsLimit: 100000
};</code></pre>
<p>The number is an example, not an official defense standard. Different rooms need different stages based on RCL, Energy income, Storage reserves, threat frequency, Tower coverage, repairer count and the value protected by each Rampart.</p>
<pre><code class="language-javascript">function readDefenseRepairConfig(roomName) {
  const config = Memory.defenseRepair?.[roomName];

  if (
    !config
    || config.enabled !== true
    || !Number.isFinite(config.hitsLimit)
    || config.hitsLimit <= 0
  ) {
    return {
      enabled: false,
      hitsLimit: null
    };
  }

  return {
    enabled: true,
    hitsLimit: config.hitsLimit
  };
}</code></pre>

<h2 id="target-order">Select the weakest eligible target</h2>
<pre><code class="language-javascript">function selectDefenseRepairTarget(
  creep,
  structures,
  hitsLimit
) {
  if (!Number.isFinite(hitsLimit) || hitsLimit <= 0) {
    return null;
  }

  const candidates = structures.filter(structure =>
    (
      structure.structureType === STRUCTURE_WALL
      || structure.structureType === STRUCTURE_RAMPART
    )
    && Number.isFinite(structure.hits)
    && Number.isFinite(structure.hitsMax)
    && structure.hits < structure.hitsMax
    && structure.hits < hitsLimit
  );

  return [...candidates].sort((left, right) => {
    if (left.hits !== right.hits) {
      return left.hits - right.hits;
    }

    const rangeDifference =
      creep.pos.getRangeTo(left)
      - creep.pos.getRangeTo(right);

    if (rangeDifference !== 0) {
      return rangeDifference;
    }

    return left.id.localeCompare(right.id);
  })[0] || null;
}</code></pre>
<p>Weakest-first evens out obvious thin points. It is not a complete fortification-value model: a Rampart over a Spawn and an outer Wall can have different strategic importance.</p>

<h2 id="ready-creep">Require Energy and active WORK</h2>
<pre><code class="language-javascript">function inspectRepairCreep(creep) {
  if (!creep || creep.my !== true) {
    return { ready: false, reason: 'creep-missing' };
  }

  if (creep.spawning === true) {
    return { ready: false, reason: 'creep-spawning' };
  }

  const energy = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const activeWork = creep.getActiveBodyparts(WORK);

  if (energy <= 0) {
    return { ready: false, reason: 'energy-empty' };
  }

  if (activeWork <= 0) {
    return { ready: false, reason: 'no-active-work' };
  }

  return {
    ready: true,
    reason: 'ready',
    energy,
    activeWork
  };
}</code></pre>
<p>A WORK part in the original body is not enough after damage. Use current active parts.</p>

<h2 id="complete-example">Complete staged repair example</h2>
<pre><code class="language-javascript">function runDefenseRepair(room, creep) {
  if (!room || !creep || creep.room.name !== room.name) {
    return { status: 'room-or-creep-unavailable' };
  }

  const config = readDefenseRepairConfig(room.name);
  if (!config.enabled) {
    return { status: 'repair-disabled' };
  }

  const creepState = inspectRepairCreep(creep);
  if (!creepState.ready) {
    return { status: creepState.reason };
  }

  const target = selectDefenseRepairTarget(
    creep,
    room.find(FIND_STRUCTURES),
    config.hitsLimit
  );

  if (!target) {
    return {
      status: 'stage-complete',
      hitsLimit: config.hitsLimit
    };
  }

  const before = {
    gameTick: Game.time,
    targetId: target.id,
    targetType: target.structureType,
    targetHits: target.hits,
    targetHitsMax: target.hitsMax,
    hitsLimit: config.hitsLimit,
    range: creep.pos.getRangeTo(target),
    creepEnergy: creepState.energy,
    activeWork: creepState.activeWork
  };
  const result = creep.repair(target);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(target, {
      reusePath: 5,
      range: 3
    });

    return {
      status: 'moving-to-target',
      result,
      moveResult,
      before
    };
  }

  return {
    status: result === OK
      ? 'repair-scheduled'
      : 'repair-rejected',
    result,
    before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  const creep = Game.creeps.Repairer1;
  const outcome = runDefenseRepair(room, creep);

  if (
    outcome.status === 'repair-rejected'
    || outcome.status === 'stage-complete'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'fortification-repair-status',
      roomName: room?.name || null,
      creepName: creep?.name || null,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="range">Move to repair range 3</h2>
<pre><code class="language-javascript">const moveResult = creep.moveTo(target, {
  range: 3,
  reusePath: 5
});</code></pre>
<p>Roads, traffic and obstacles can still make movement fail, so preserve the movement result instead of assuming the Creep arrived.</p>

<h2 id="stop">Stop at the current stage</h2>
<p>The selector requires both <code>structure.hits &lt; hitsLimit</code> and <code>structure.hits &lt; structure.hitsMax</code>. If the configured limit exceeds a current maximum, fully repaired Structures still leave the candidate list.</p>
<pre><code class="language-javascript">function isBelowDefenseStage(structure, hitsLimit) {
  return Number.isFinite(hitsLimit)
    && hitsLimit > 0
    && structure.hits < hitsLimit
    && structure.hits < structure.hitsMax;
}</code></pre>

<h2 id="raise-stage">Raise the stage separately</h2>
<p>Do not increment the limit merely because this tick has no target. A separate policy can require all current targets to meet the stage, Storage Energy above a reserve, no active battle, non-urgent Controller work, and explicit configuration approval.</p>
<pre><code class="language-javascript">function mayReviewNextDefenseStage(input) {
  return Boolean(
    input.currentStageComplete
    && input.storageEnergy >= input.storageReserve
    && input.hostileCount === 0
    && input.playerApproved
  );
}</code></pre>
<p>This returns permission to review a change, not a new automatic limit.</p>

<h2 id="after-ok">Verify later state</h2>
<pre><code class="language-javascript">function inspectRepairResult(before) {
  const target = Game.getObjectById(before.targetId);

  return target
    ? {
        targetFound: true,
        hitsBefore: before.targetHits,
        hitsNow: target.hits,
        hitsLimit: before.hitsLimit
      }
    : {
        targetFound: false,
        hitsBefore: before.targetHits,
        hitsLimit: before.hitsLimit
      };
}</code></pre>
<p>Other Creeps, Towers, damage and boosts can affect the observed hit delta, so do not attribute the entire change to one action without more evidence.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical cause</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Repair scheduled</td><td>Re-read hits later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Creep not yours</td><td>Current Creep ownership</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep spawning</td><td>Wait</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>No Energy</td><td>Supply chain and Store</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Target invalid or gone</td><td>Refresh current selection</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Beyond repair range</td><td>Move to range 3</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active WORK</td><td>Body damage and replacement</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Use a positive room-specific hits limit.</li>
<li>Filter only Walls and Ramparts.</li>
<li>Require hits below both stage and hitsMax.</li>
<li>Sort by hits, range and stable ID.</li>
<li>Require Creep Energy and active WORK.</li>
<li>Save repair and movement return codes.</li>
<li>Move to range 3.</li>
<li>Stop when the stage is complete.</li>
<li>Raise stages through a separate reviewed policy.</li>
<li>Verify current hits later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not value individual fortification positions, predict boosts, coordinate Towers, choose room-wide emergency priorities, supply the repairer, or automatically raise stages. Return to the <a href="/en/blog">English article library</a> for defense and logistics topics.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why select lowest hits instead of lowest ratio?</h3>
<p>For high-maximum fortifications, an absolute staged target is easier to budget and compare. A ratio can remain tiny for a very long time.</p>
<h3>Can Tower repair use this selector?</h3>
<p>The target policy can be adapted, but Tower repair has different range behavior, Energy ownership and action allocation. Do not copy the Creep return-code table unchanged.</p>
<h3>Should Ramparts and Walls share one limit?</h3>
<p>They can for a simple stage, but a mature defense may use separate targets based on protected Structures and wall placement.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureWall" rel="nofollow">API Reference: StructureWall</a></li>
<li><a href="https://docs.screeps.com/api/#StructureRampart" rel="nofollow">API Reference: StructureRampart</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.repair" rel="nofollow">API Reference: Creep.repair()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
