import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishTowerRepairArticle = {
  slug: "screeps-tower-repair-threshold",
  path: "/en/blog/screeps-tower-repair-threshold",
  chinesePath: "/blog/screeps-tower-repair-threshold",
  title: "Screeps Tower Repair: Hit Ratios, Energy Reserves, and Priority",
  headline: "How to Repair Structures with Towers Without Spending Defense Energy",
  description:
    "Run Tower repair only after attack and healing are clear, preserve a configurable Energy reserve plus TOWER_ENERGY_COST, exclude Walls and Ramparts, rank ordinary structures by hit ratio and range, save repair() results, and verify later hits.",
  category: "DEFENSE · TOWER REPAIR RESERVE",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Tower Repair",
  tags: ["Screeps", "Tower", "Repair", "Defense", "Energy Reserve"],
  keywords: [
    "Screeps Tower repair threshold",
    "Screeps Tower Energy reserve",
    "Screeps StructureTower repair",
    "Screeps structure hits ratio",
    "Screeps Tower repair priority",
  ],
  primaryKeyword: "Screeps Tower repair threshold",
  searchIntent: "Repair ordinary room structures only when combat and Energy reserves allow it",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureTower.repair(), whole-room range, falloff, TOWER_ENERGY_COST and return codes"],
    ["Policy boundary", "The hit-ratio threshold, Energy reserve, action order and excluded structure classes are project policies"],
    ["Execution boundary", "OK schedules repair; structure hits and actual range-adjusted effect require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline repair review", "Passed — combat gate, injury gate, reserve plus action cost, Wall and Rampart exclusion, ratio, range and stable ties"],
    ["Screeps Console test", "Pending"],
    ["Live Tower repair, falloff, power effect, over-repair and reserve test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["action-order", "Run repair after attack and healing"],
    ["ratio", "Use hit ratio for ordinary structures"],
    ["reserve", "Protect reserve plus action cost"],
    ["target-order", "Select a deterministic repair target"],
    ["complete-example", "Complete Tower repair example"],
    ["walls", "Keep Walls and Ramparts separate"],
    ["overrepair", "Understand multi-Tower over-repair"],
    ["after-ok", "Verify repair later"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Why should Tower repair run after attack and heal?",
      "A Tower should have one intended action each tick. Spending Energy on repair before urgent combat or healing can weaken room defense and make module order ambiguous.",
    ],
    [
      "Why use hits divided by hitsMax?",
      "Ordinary structures have different maximum hits. A ratio compares relative damage more consistently than one fixed hit count.",
    ],
    [
      "Why add TOWER_ENERGY_COST to the reserve check?",
      "Checking only current Energy against the reserve allows the repair itself to push the Tower below that reserve.",
    ],
    [
      "Should Walls and Ramparts use the same ratio threshold?",
      "Usually no. Fortifications need separate hit targets and budgets because their desired hits can be far above ordinary structures.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-tower-heal-creeps",
    label: "Previous Tower guide",
    title: "Heal Injured Creeps",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Do not repair while an attack target or injured owned Creep needs the Tower. Require an owned active Tower with at least <code>repairReserve + TOWER_ENERGY_COST</code> Energy, filter ordinary damaged structures below a documented hit-ratio threshold, exclude Walls and Ramparts, select the lowest ratio then nearest range and stable ID, call <code>tower.repair(target)</code>, and verify structure hits later.</p>

<h2 id="action-order">Run repair after attack and healing</h2>
<p>The Tower API does not build a defense priority for you. Use one dispatcher that makes the order explicit:</p>
<pre><code class="language-javascript">function chooseTowerAction(input) {
  if (input.attackTarget) {
    return 'attack';
  }

  if (input.healTarget) {
    return 'heal';
  }

  if (input.repairTarget) {
    return 'repair';
  }

  return 'idle';
}</code></pre>
<p>This guide treats attack before heal before repair as a project policy. A room may choose a different emergency order, but multiple independent modules should not silently compete for the same Tower.</p>

<h2 id="ratio">Use hit ratio for ordinary structures</h2>
<p>A fixed hit number has different meaning for Roads, Extensions, Spawns and Storage. A ratio makes the baseline comparable:</p>
<pre><code class="language-javascript">function getStructureHitRatio(structure) {
  if (
    !structure
    || !Number.isFinite(structure.hits)
    || !Number.isFinite(structure.hitsMax)
    || structure.hitsMax <= 0
  ) {
    return null;
  }

  return structure.hits / structure.hitsMax;
}</code></pre>
<pre><code class="language-javascript">const TOWER_REPAIR_RATIO_LIMIT = 0.8;</code></pre>
<p>The value <code>0.8</code> is an example room policy, not an official recommendation. Repairs may be postponed or raised depending on defense risk and Energy income.</p>

<h2 id="reserve">Protect reserve plus action cost</h2>
<pre><code class="language-javascript">const TOWER_REPAIR_ENERGY_RESERVE = 500;

function towerCanSpendOnRepair(tower, reserve) {
  const energy = tower.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  return tower.isActive() === true
    && energy >= reserve + TOWER_ENERGY_COST;
}</code></pre>
<p>Checking only <code>energy >= reserve</code> permits one repair action to cross the intended floor. The reserve itself is a policy and should reflect expected attacks and refill time.</p>

<h2 id="target-order">Select a deterministic repair target</h2>
<pre><code class="language-javascript">function selectTowerRepairTarget(
  towers,
  structures,
  ratioLimit
) {
  const candidates = structures.filter(structure => {
    const ratio = getStructureHitRatio(structure);

    return Number.isFinite(ratio)
      && structure.hits < structure.hitsMax
      && ratio < ratioLimit
      && structure.structureType !== STRUCTURE_WALL
      && structure.structureType !== STRUCTURE_RAMPART;
  });

  if (towers.length === 0 || candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const ratioDifference =
      getStructureHitRatio(left)
      - getStructureHitRatio(right);

    if (ratioDifference !== 0) {
      return ratioDifference;
    }

    const leftRange = Math.min(
      ...towers.map(tower =>
        tower.pos.getRangeTo(left)
      )
    );
    const rightRange = Math.min(
      ...towers.map(tower =>
        tower.pos.getRangeTo(right)
      )
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.id.localeCompare(right.id);
  })[0] || null;
}</code></pre>
<p>This version prioritizes damage ratio before range and does not assign extra business value to a Spawn over a Road. Add structure importance only as a documented room policy.</p>

<h2 id="complete-example">Complete Tower repair example</h2>
<pre><code class="language-javascript">function runTowerRepair(room, options = {}) {
  if (!room) {
    return { status: 'room-not-visible' };
  }

  const attackTarget = room.find(
    FIND_HOSTILE_CREEPS
  )[0] || null;
  if (attackTarget) {
    return { status: 'attack-priority' };
  }

  const healTarget = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.hits > 0
      && creep.hits < creep.hitsMax
  })[0] || null;
  if (healTarget) {
    return { status: 'heal-priority' };
  }

  const reserve = Number.isFinite(options.reserve)
    ? Math.max(0, options.reserve)
    : TOWER_REPAIR_ENERGY_RESERVE;
  const ratioLimit = Number.isFinite(options.ratioLimit)
    ? Math.max(0, Math.min(1, options.ratioLimit))
    : TOWER_REPAIR_RATIO_LIMIT;
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && towerCanSpendOnRepair(structure, reserve)
  });

  if (towers.length === 0) {
    return { status: 'repair-energy-protected' };
  }

  const target = selectTowerRepairTarget(
    towers,
    room.find(FIND_STRUCTURES),
    ratioLimit
  );
  if (!target) {
    return { status: 'no-repair-target' };
  }

  const snapshot = {
    gameTick: Game.time,
    targetId: target.id,
    structureType: target.structureType,
    hits: target.hits,
    hitsMax: target.hitsMax,
    hitRatio: getStructureHitRatio(target),
    ratioLimit,
    reserve
  };
  const results = towers.map(tower => ({
    towerId: tower.id,
    range: tower.pos.getRangeTo(target),
    energyBefore: tower.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    result: tower.repair(target)
  }));

  return {
    status: results.some(item => item.result === OK)
      ? 'repair-scheduled'
      : 'repair-rejected',
    snapshot,
    results
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const outcome = runTowerRepair(room, {
    ratioLimit: TOWER_REPAIR_RATIO_LIMIT,
    reserve: TOWER_REPAIR_ENERGY_RESERVE
  });

  if (
    outcome.status === 'repair-rejected'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'tower-repair-status',
      roomName: room.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="walls">Keep Walls and Ramparts separate</h2>
<p>Walls and Ramparts often use absolute target bands, emergency minimums and escalating budgets rather than an ordinary structure ratio. They are excluded here so an almost empty fortification does not permanently consume every idle Tower action.</p>
<pre><code class="language-javascript">function isOrdinaryRepairTarget(structure) {
  return structure.structureType !== STRUCTURE_WALL
    && structure.structureType !== STRUCTURE_RAMPART;
}</code></pre>

<h2 id="overrepair">Understand multi-Tower over-repair</h2>
<p>All Towers in this baseline target one structure. That can exceed its missing hits. A production allocator should estimate range-adjusted repair, active Tower power effects, assigned repair and remaining need before allocating another Tower.</p>

<h2 id="after-ok">Verify repair later</h2>
<p>Recover the structure by ID and compare hits with the saved snapshot. Other Creeps or Towers can also repair it, and damage can occur in the same period, so the net hit delta is not perfect attribution.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Repair scheduled</td><td>Structure hits later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Tower not yours</td><td>Selection and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Insufficient Energy</td><td>Reserve, cost and competing actions</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Structure invalid</td><td>Refresh current target</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Tower inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Exit when an attack target exists.</li>
<li>Exit when an injured owned Creep exists.</li>
<li>Use one Tower action dispatcher.</li>
<li>Require reserve plus <code>TOWER_ENERGY_COST</code>.</li>
<li>Document the ratio threshold.</li>
<li>Exclude Walls and Ramparts.</li>
<li>Use stable ratio, range and ID ordering.</li>
<li>Save every repair return code.</li>
<li>Watch for over-repair.</li>
<li>Verify net hits later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not maintain Walls or Ramparts, predict exact repair output, model Tower power effects, assign structure business values, coordinate haulers or prevent over-repair. Return to the <a href="/en/blog">English article library</a> for construction and defense topics.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why not use one fixed hit threshold?</h3>
<p>Ordinary structures have different maximum hits, so one number can represent minor Road damage but severe Spawn damage.</p>
<h3>Can Tower repair return ERR_NOT_IN_RANGE?</h3>
<p>No. Towers act across their room; distance changes effect rather than producing that range error.</p>
<h3>Should every idle Tower repair?</h3>
<p>Only according to your room budget. A defense reserve can be more valuable than repairing minor damage immediately.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureTower" rel="nofollow">API Reference: StructureTower</a></li>
<li><a href="https://docs.screeps.com/api/#StructureTower.repair" rel="nofollow">API Reference: StructureTower.repair()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: Tower power effects</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
