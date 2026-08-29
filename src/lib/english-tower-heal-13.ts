import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishTowerHealArticle = {
  slug: "screeps-tower-heal-creeps",
  path: "/en/blog/screeps-tower-heal-creeps",
  chinesePath: "/blog/screeps-tower-heal-creeps",
  title: "Screeps Tower Healing: Injury Ratio, Missing Hits, and Range",
  headline: "How to Make Towers Heal the Creep That Needs It Most",
  description:
    "Find injured owned Creeps, rank lower hit ratios before missing hits and nearest-Tower range, require active owned Towers with TOWER_ENERGY_COST, save heal() results, avoid caching stale targets, and leave over-heal optimization to a later dispatcher.",
  category: "DEFENSE · TOWER HEAL PRIORITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Tower Healing",
  tags: ["Screeps", "Tower", "Healing", "Defense", "Creep Hits"],
  keywords: [
    "Screeps Tower heal Creeps",
    "Screeps StructureTower heal",
    "Screeps injured Creep priority",
    "Screeps Tower heal range falloff",
    "Screeps TOWER_ENERGY_COST",
  ],
  primaryKeyword: "Screeps Tower heal Creeps",
  searchIntent: "Heal the most urgent owned injured Creep with deterministic Tower priorities",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureTower.heal(), whole-room range, falloff, TOWER_ENERGY_COST and return codes"],
    ["Priority boundary", "Hit ratio, missing hits and range are a project ordering policy, not an official medical or combat priority"],
    ["Execution boundary", "OK schedules healing; target hits and actual range-adjusted effect require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline healing review", "Passed — valid injuries, hit ratio, missing hits, nearest-Tower range, stable ties, Energy and activity states"],
    ["Screeps Console test", "Pending"],
    ["Live Tower heal, falloff, Tower power effects, over-heal and multi-target allocation test", "Pending"],
    ["Last verified", "August 28, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["valid-injuries", "Filter valid injured Creeps"],
    ["priority", "Rank urgency before distance"],
    ["available-towers", "Require active Towers with Energy"],
    ["complete-example", "Complete Tower healing example"],
    ["overheal", "Understand multi-Tower over-heal"],
    ["dispatcher", "Keep one Tower action dispatcher"],
    ["refresh", "Refresh targets every tick"],
    ["after-ok", "Verify healing later"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Can a Tower heal anywhere in its room?",
      "It can target valid Creeps across the room, but healing effectiveness weakens with distance. Distance does not produce ERR_NOT_IN_RANGE for Tower healing.",
    ],
    [
      "Why rank hit ratio before missing hits?",
      "A low hit ratio identifies a Creep closer to death relative to its maximum. Missing hits then distinguishes targets with the same ratio.",
    ],
    [
      "Does FIND_MY_CREEPS include Power Creeps?",
      "No. This guide intentionally handles owned regular Creeps only. Power Creeps need a separate query or explicit integration.",
    ],
    [
      "Does OK prove the Creep is now healthy?",
      "No. It schedules the healing action. Compare hits later and account for incoming damage, other Towers and range falloff.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-tower-auto-attack-hostiles",
    label: "Previous Tower guide",
    title: "Attack Hostile Creeps",
  },
  next: {
    href: "/en/blog/screeps-tower-repair-threshold",
    label: "Next Tower guide",
    title: "Repair Structures with a Reserve",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Find owned regular Creeps with <code>0 &lt; hits &lt; hitsMax</code>, select the lowest hit ratio first, then the largest missing-hit count, nearest available Tower range and name as a stable tie-breaker. Let only owned active Towers with at least <code>TOWER_ENERGY_COST</code> Energy call <code>tower.heal(target)</code>, keep each raw result, and verify target hits on a later tick.</p>
<pre><code class="language-javascript">const result = tower.heal(target);

if (result === OK) {
  // The heal action was scheduled.
}
</code></pre>
<p>Keep the returned code even when it is <code>OK</code>. <code>OK</code> means the action was accepted and scheduled; it does not prove how many hits the target will have after tick resolution.</p>
<p>The current Tower-heal baseline costs <code>TOWER_ENERGY_COST = 10</code> Energy per action. Healing is 400 at range 5 or less, falls linearly through range 20, and is 100 at range 20 or farther. A Tower can target valid Creeps across its room, so distance does not produce <code>ERR_NOT_IN_RANGE</code>.</p>

<h2 id="valid-injuries">Filter valid injured Creeps</h2>
<pre><code class="language-javascript">function getInjuredOwnedCreeps(room) {
  return room.find(FIND_MY_CREEPS, {
    filter: creep =>
      Number.isFinite(creep.hits)
      && Number.isFinite(creep.hitsMax)
      && creep.hits > 0
      && creep.hitsMax > 0
      && creep.hits < creep.hitsMax
  });
}</code></pre>
<p><code>StructureTower.heal()</code> itself accepts a Creep or PowerCreep in the same room. This controller intentionally queries owned regular Creeps only with <code>FIND_MY_CREEPS</code>; it also ignores dead or malformed objects and avoids spending actions on full-health targets.</p>

<h2 id="priority">Rank urgency before distance</h2>
<pre><code class="language-javascript">function selectTowerHealTarget(towers, creeps) {
  const injured = creeps.filter(creep =>
    Number.isFinite(creep.hits)
    && Number.isFinite(creep.hitsMax)
    && creep.hits > 0
    && creep.hitsMax > 0
    && creep.hits < creep.hitsMax
  );

  if (towers.length === 0 || injured.length === 0) {
    return null;
  }

  return [...injured].sort((left, right) => {
    const ratioDifference =
      left.hits / left.hitsMax
      - right.hits / right.hitsMax;

    if (ratioDifference !== 0) {
      return ratioDifference;
    }

    const missingDifference =
      (right.hitsMax - right.hits)
      - (left.hitsMax - left.hits);

    if (missingDifference !== 0) {
      return missingDifference;
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

    return left.name.localeCompare(right.name);
  })[0] || null;
}</code></pre>
<p>These priorities are explainable but not universal. A combat system may consider incoming damage, role, boosts, retreat state, Rampart position or defender importance.</p>

<h2 id="available-towers">Require active Towers with Energy</h2>
<pre><code class="language-javascript">function getAvailableHealingTowers(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive() === true
      && structure.store.getUsedCapacity(
        RESOURCE_ENERGY
      ) >= TOWER_ENERGY_COST
  });
}</code></pre>
<p>A Tower action uses Energy and one Tower should have one dispatcher per tick. Preflight cannot stop a separate module from assigning attack or repair afterward.</p>

<h2 id="complete-example">Complete Tower healing example</h2>
<pre><code class="language-javascript">function runTowerHealing(room) {
  if (!room) {
    return { status: 'room-not-visible' };
  }

  const towers = getAvailableHealingTowers(room);
  if (towers.length === 0) {
    return { status: 'no-available-tower' };
  }

  const target = selectTowerHealTarget(
    towers,
    getInjuredOwnedCreeps(room)
  );
  if (!target) {
    return { status: 'no-injured-creep' };
  }

  const snapshot = {
    gameTick: Game.time,
    targetId: target.id,
    targetName: target.name,
    hits: target.hits,
    hitsMax: target.hitsMax,
    hitRatio: target.hits / target.hitsMax,
    missingHits: target.hitsMax - target.hits
  };
  const results = towers.map(tower => ({
    towerId: tower.id,
    range: tower.pos.getRangeTo(target),
    energyBefore: tower.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    result: tower.heal(target)
  }));
  const acceptedCount = results.filter(
    item => item.result === OK
  ).length;

  return {
    status: acceptedCount === results.length
      ? 'heal-scheduled'
      : acceptedCount > 0
        ? 'heal-partial'
        : 'heal-rejected',
    snapshot,
    results
  };
}</code></pre>
<p>The aggregate status never replaces the raw Tower results: <code>heal-partial</code> means at least one Tower returned <code>OK</code> and at least one did not.</p>
<pre><code class="language-javascript">function getTowerHealingState() {
  if (!Memory.towerHealing) {
    Memory.towerHealing = {};
  }

  return Memory.towerHealing;
}

function saveTowerHealingAttempt(state, room, outcome) {
  if (!outcome.snapshot || !outcome.results) {
    return;
  }

  state.pendingObservation = {
    tick: outcome.snapshot.gameTick,
    roomName: room.name,
    targetId: outcome.snapshot.targetId,
    targetName: outcome.snapshot.targetName,
    hitsBefore: outcome.snapshot.hits,
    results: outcome.results.map(item => ({
      towerId: item.towerId,
      range: item.range,
      result: item.result
    }))
  };
}

function reviewPreviousTowerHealing(state) {
  const pending = state.pendingObservation;
  if (!pending || pending.tick >= Game.time) {
    return null;
  }

  const target = Game.getObjectById(pending.targetId);
  const observation = {
    scheduledTick: pending.tick,
    observedTick: Game.time,
    roomName: pending.roomName,
    targetId: pending.targetId,
    targetName: pending.targetName,
    hitsBefore: pending.hitsBefore,
    hitsNow: target ? target.hits : null,
    targetVisible: Boolean(target),
    results: pending.results
  };

  state.lastObservation = observation;
  delete state.pendingObservation;
  return observation;
}

module.exports.loop = function () {
  const state = getTowerHealingState();
  reviewPreviousTowerHealing(state);

  const roomName = state.roomName;
  if (typeof roomName !== 'string' || roomName.length === 0) {
    console.log(
      'Tower healing is not configured. Set '
      + 'Memory.towerHealing.roomName to a visible owned room name.'
    );
    return;
  }

  const room = Game.rooms[roomName];
  if (!room) {
    console.log(
      'Tower healing room is not visible: ' + roomName
    );
    return;
  }

  const outcome = runTowerHealing(room);
  saveTowerHealingAttempt(state, room, outcome);

  if (
    outcome.status === 'heal-partial'
    || outcome.status === 'heal-rejected'
  ) {
    console.log(JSON.stringify({
      type: 'tower-heal-action',
      roomName,
      ...outcome
    }));
  }
};</code></pre>
<p>Set <code>Memory.towerHealing.roomName</code> to your own visible owned room name before enabling this loop; the example does not assume any specific room. The tracker keeps only one pending heal attempt and one latest later-tick observation. It stores IDs, hit snapshots and raw return codes rather than caching a Creep object across ticks.</p>

<h2 id="overheal">Understand multi-Tower over-heal</h2>
<p>This baseline focuses every available Tower on the same injured Creep. That is easy to inspect but can spend more Energy than necessary when one Tower would fill the missing hits.</p>
<pre><code class="language-javascript">function getMissingHits(creep) {
  return Math.max(0, creep.hitsMax - creep.hits);
}</code></pre>
<p>A more advanced allocator can use range-adjusted healing, active Tower power effects and already assigned healing. If it is trying to predict combat outcomes rather than only current missing hits, expected incoming damage is another useful input. This article does not claim focus healing is optimal.</p>

<h2 id="dispatcher">Keep one Tower action dispatcher</h2>
<p>A common room policy is attack before heal before repair. That order is not enforced by the Tower API; your code must select one action for each Tower.</p>
<pre><code class="language-javascript">function chooseTowerMode(input) {
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

<h2 id="refresh">Refresh targets every tick</h2>
<p>The target may heal to full, die, leave the room, move closer to another Tower or receive new damage. Save only IDs and snapshots for diagnostics; run the selection again from current visible objects.</p>

<h2 id="after-ok">Verify healing later</h2>
<p>The complete example moves the previous attempt into <code>Memory.towerHealing.lastObservation</code> on a later tick. Compare <code>hitsBefore</code> with <code>hitsNow</code> only when <code>targetVisible</code> is true; a missing target does not prove the heal failed. Healing may also be partly or fully offset by damage in the same resolution window, so a final hit difference is evidence of net state rather than a perfect measurement of one Tower's contribution.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Healing scheduled</td><td>Target hits later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Tower not yours</td><td>Selection and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Insufficient Energy</td><td>Tower Store / Energy</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Creep invalid</td><td>Refresh current target</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Tower inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Use <code>FIND_MY_CREEPS</code> for this controller scope.</li>
<li>Require valid positive hits and hitsMax.</li>
<li>Exclude full-health Creeps.</li>
<li>Document the hit-ratio policy.</li>
<li>Use stable tie-breakers.</li>
<li>Require active owned Towers.</li>
<li>Check <code>TOWER_ENERGY_COST</code>.</li>
<li>Use one action dispatcher.</li>
<li>Inspect every raw heal return code, including partial failure.</li>
<li>Compare later net hits only when the target is observable.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not integrate Power Creeps into the controller, build a full range-adjusted healing allocator, calculate Tower power effects, predict incoming damage, split healing or prevent over-heal. Continue with <a href="/en/blog/screeps-tower-repair-threshold">Tower repair thresholds and reserves</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why not always heal the nearest Creep?</h3>
<p>The nearest Creep may have only minor damage while a farther defender is close to death. This policy ranks urgency before distance.</p>
<h3>Why use the name as the final tie-breaker?</h3>
<p>It makes otherwise equal target selection stable without pretending the name has combat value.</p>
<h3>Can attack and heal functions both run?</h3>
<p>Separate functions can both be called, but a controlled system should choose one intended action per Tower and preserve the final return code.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureTower" rel="nofollow">API Reference: StructureTower</a></li>
<li><a href="https://docs.screeps.com/api/#StructureTower.heal" rel="nofollow">API Reference: StructureTower.heal()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: Tower power effects</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
