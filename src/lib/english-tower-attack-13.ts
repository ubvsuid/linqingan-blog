import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishTowerAttackArticle = {
  slug: "screeps-tower-auto-attack-hostiles",
  path: "/en/blog/screeps-tower-auto-attack-hostiles",
  chinesePath: "/blog/screeps-tower-auto-attack-hostiles",
  title: "Screeps Tower Attack: Filtering, Threat Scores, and Energy",
  headline: "How to Make Towers Attack Hostiles with Explainable Priorities",
  description:
    "Filter FIND_HOSTILE_CREEPS through an explicit allowed-user policy, score active combat parts, use range and name as deterministic tie-breakers, require active owned Towers with TOWER_ENERGY_COST, save attack() results, and re-evaluate targets every tick.",
  category: "DEFENSE · TOWER ATTACK PRIORITY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Tower Attack",
  tags: ["Screeps", "Tower", "Defense", "Hostile Creeps", "Targeting"],
  keywords: [
    "Screeps Tower attack hostiles",
    "Screeps FIND_HOSTILE_CREEPS filter",
    "Screeps Tower threat score",
    "Screeps TOWER_ENERGY_COST",
    "Screeps Tower attack return codes",
  ],
  primaryKeyword: "Screeps Tower attack hostiles",
  searchIntent: "Attack non-allowed hostile Creeps with deterministic and reviewable Tower priorities",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — StructureTower.attack(), FIND_HOSTILE_CREEPS, TOWER_ENERGY_COST, whole-room range, falloff and return codes"],
    ["Diplomacy boundary", "The allowed-user list and combat-part weights are project policies, not official hostility or diplomacy rules"],
    ["Execution boundary", "OK schedules an attack; target hits, movement, healing and survival require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline target review", "Passed — allowed users, active combat parts, threat order, nearest-Tower range, stable ties, Energy and activity states"],
    ["Screeps Console test", "Pending"],
    ["Live Tower damage, falloff, boost, diplomacy and multi-Tower focus test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["hostile-not-policy", "FIND_HOSTILE_CREEPS is not a diplomacy policy"],
    ["threat-score", "Build an explainable threat score"],
    ["target-order", "Select one deterministic target"],
    ["available-towers", "Require active Towers with Energy"],
    ["complete-example", "Complete Tower attack example"],
    ["refresh", "Refresh targets every tick"],
    ["distance", "Understand distance and effect"],
    ["after-ok", "Verify the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does FIND_HOSTILE_CREEPS mean every returned Creep should be attacked?",
      "No. It returns non-owned Creeps according to the game query. Your diplomacy, visitor and task policies must be applied separately.",
    ],
    [
      "Why score active body parts instead of body length?",
      "Destroyed parts no longer provide their normal ability. getActiveBodyparts() represents current combat capability more closely than the original body array length.",
    ],
    [
      "Can a Tower attack anywhere in the room?",
      "Yes, but the effect weakens with distance. Distance is not an ERR_NOT_IN_RANGE condition for Tower attack.",
    ],
    [
      "Does OK mean the target was destroyed?",
      "No. It means the attack was scheduled. Inspect target hits and later room state while accounting for healing, movement and other Towers.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-power-spawn-process-power",
    label: "Previous resource guide",
    title: "Process Power Safely",
  },
  next: {
    href: "/en/blog/screeps-tower-heal-creeps",
    label: "Next Tower guide",
    title: "Heal Injured Creeps",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Find current non-owned Creeps, remove users allowed by your own reviewed policy, score active combat and Controller-threatening parts, select a deterministic target by threat, nearest-Tower range and name, then let only owned active Towers with at least <code>TOWER_ENERGY_COST</code> Energy call <code>tower.attack(target)</code>. Save every return code and refresh the target on every tick.</p>

<h2 id="hostile-not-policy">FIND_HOSTILE_CREEPS is not a diplomacy policy</h2>
<p><code>FIND_HOSTILE_CREEPS</code> is a game query, not an alliance database. It cannot know whether another player is an ally, temporary visitor, scout or permitted task participant.</p>
<pre><code class="language-javascript">Memory.defense ??= {};
Memory.defense.allowedUsers ??= [];</code></pre>
<pre><code class="language-javascript">function getAttackableHostiles(room) {
  const allowedUsers = new Set(
    Array.isArray(Memory.defense?.allowedUsers)
      ? Memory.defense.allowedUsers
      : []
  );

  return room.find(FIND_HOSTILE_CREEPS, {
    filter: creep =>
      typeof creep.owner?.username === 'string'
      && !allowedUsers.has(creep.owner.username)
  });
}</code></pre>
<p>An allowed-user list is operationally dangerous when stale or entered incorrectly. Production diplomacy may need expiration, room scope, incident overrides and event-log review.</p>

<h2 id="threat-score">Build an explainable threat score</h2>
<p>This baseline scores current active parts rather than original body length:</p>
<pre><code class="language-javascript">function getTowerThreatScore(creep) {
  if (!creep) {
    return 0;
  }

  return (
    creep.getActiveBodyparts(ATTACK) * 5
    + creep.getActiveBodyparts(RANGED_ATTACK) * 5
    + creep.getActiveBodyparts(HEAL) * 4
    + creep.getActiveBodyparts(CLAIM) * 3
    + creep.getActiveBodyparts(WORK) * 2
  );
}</code></pre>
<p>The weights are a project policy. <code>WORK</code> can dismantle structures and <code>CLAIM</code> can threaten Controller state, so a filter that checks only <code>ATTACK</code> can miss meaningful threats.</p>

<h2 id="target-order">Select one deterministic target</h2>
<pre><code class="language-javascript">function selectTowerAttackTarget(towers, hostiles) {
  if (towers.length === 0 || hostiles.length === 0) {
    return null;
  }

  return [...hostiles].sort((left, right) => {
    const threatDifference =
      getTowerThreatScore(right)
      - getTowerThreatScore(left);

    if (threatDifference !== 0) {
      return threatDifference;
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
<p>The name tie-breaker has no combat meaning. It prevents an otherwise equal sort from changing unpredictably. This version focuses all available Towers on one target and does not estimate overkill.</p>

<h2 id="available-towers">Require active Towers with Energy</h2>
<pre><code class="language-javascript">function getAvailableDefenseTowers(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive() === true
      && structure.store.getUsedCapacity(
        RESOURCE_ENERGY
      ) >= TOWER_ENERGY_COST
  });
}</code></pre>
<p>The preflight removes obviously unavailable Towers, but another module can still try to assign a different action in the same tick. A complete room defense should have one Tower dispatcher.</p>

<h2 id="complete-example">Complete Tower attack example</h2>
<pre><code class="language-javascript">function runTowerAttack(room) {
  if (!room) {
    return { status: 'room-not-visible' };
  }

  const towers = getAvailableDefenseTowers(room);
  if (towers.length === 0) {
    return { status: 'no-available-tower' };
  }

  const hostiles = getAttackableHostiles(room);
  const target = selectTowerAttackTarget(
    towers,
    hostiles
  );

  if (!target) {
    return { status: 'no-attack-target' };
  }

  const snapshot = {
    gameTick: Game.time,
    targetId: target.id,
    targetName: target.name,
    owner: target.owner?.username || null,
    hits: target.hits,
    hitsMax: target.hitsMax,
    threatScore: getTowerThreatScore(target)
  };
  const results = towers.map(tower => ({
    towerId: tower.id,
    range: tower.pos.getRangeTo(target),
    energyBefore: tower.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    result: tower.attack(target)
  }));

  return {
    status: results.some(item => item.result === OK)
      ? 'attack-scheduled'
      : 'attack-rejected',
    snapshot,
    results
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const outcome = runTowerAttack(room);
  if (
    outcome.status === 'attack-rejected'
    || Game.time % 50 === 0
  ) {
    console.log(JSON.stringify({
      type: 'tower-attack-status',
      roomName: room.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="refresh">Refresh targets every tick</h2>
<p>A target can die, leave, move, enter protection, lose active parts, receive a boost or change diplomatic status. Do not store the full object in Memory. Store an ID and diagnostic snapshot only when needed, then recover and re-score current objects.</p>
<pre><code class="language-javascript">function recoverPreviousTowerTarget(targetId) {
  return typeof targetId === 'string'
    ? Game.getObjectById(targetId)
    : null;
}</code></pre>

<h2 id="distance">Understand distance and effect</h2>
<p>Tower range covers the room, so attack does not use <code>ERR_NOT_IN_RANGE</code>. Actual damage falls with distance, and active Tower power effects may modify it. This guide uses range only as a tie-breaker and does not promise a kill in one volley.</p>

<h2 id="after-ok">Verify the next tick</h2>
<p>Compare the stored target ID, hits and Tower Energy with current visible state. A missing target may mean death or loss of visibility; a smaller hits delta than expected may reflect healing, damage reduction, range or other simultaneous actions.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Attack scheduled</td><td>Target hits later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Tower not yours</td><td>Selection and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Insufficient Tower Energy</td><td>Store and competing actions</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Target invalid</td><td>Refresh target this tick</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Tower inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Refresh the visible room.</li>
<li>Review allowed usernames.</li>
<li>Use active body parts.</li>
<li>Keep threat weights documented.</li>
<li>Use deterministic target ties.</li>
<li>Require active owned Towers.</li>
<li>Check <code>TOWER_ENERGY_COST</code>.</li>
<li>Use one Tower dispatcher per tick.</li>
<li>Save every attack return code.</li>
<li>Verify damage without claiming guaranteed kills.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not model boosts, exact falloff damage, overkill, split fire, Power Creeps, Rampart protection, event-driven diplomacy or Safe Mode. Continue with <a href="/en/blog/screeps-tower-heal-creeps">Tower healing priorities</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why focus all Towers on one target?</h3>
<p>It is deterministic and easy to verify. Advanced defense should estimate assigned damage and split Towers when focus fire would waste Energy.</p>
<h3>Why include WORK and CLAIM?</h3>
<p>They can threaten structures and Controller control even when the Creep has no direct ATTACK part.</p>
<h3>Should an allowed user always be ignored?</h3>
<p>Not necessarily. A stronger system can revoke permission after hostile actions or limit access to specific rooms and tasks.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureTower" rel="nofollow">API Reference: StructureTower</a></li>
<li><a href="https://docs.screeps.com/api/#StructureTower.attack" rel="nofollow">API Reference: StructureTower.attack()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">API Reference: Room.find()</a></li>
<li><a href="https://docs.screeps.com/defense.html" rel="nofollow">Screeps Documentation: Defending your room</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: Power effects</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
