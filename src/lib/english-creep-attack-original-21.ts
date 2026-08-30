import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

type EnglishCreepAttackOriginalArticle = Omit<EnglishBeginnerArticle, "chinesePath"> & {
  chinesePath?: undefined;
};

export const englishCreepAttackArticle = {
  slug: "screeps-creep-attack",
  path: "/en/blog/screeps-creep-attack",
  title: "Screeps Creep.attack(): Melee Range, ATTACK Parts, and Return Codes",
  headline: "How to Use Creep.attack() for a Melee Creep",
  description:
    "Use Creep.attack() with the correct range-1 boundary, active ATTACK parts, documented return codes, Rampart behavior, and later-tick verification.",
  category: "COMBAT · CREEP ATTACK",
  publishedAt: "2026-08-30",
  publishedLabel: "August 30, 2026",
  readingTime: "10 min read",
  breadcrumbLabel: "Creep.attack()",
  tags: ["Screeps", "Creep", "Combat", "ATTACK", "Debugging"],
  keywords: [
    "Screeps Creep.attack",
    "Screeps melee attack",
    "Screeps ATTACK body part",
    "Screeps ERR_NOT_IN_RANGE attack",
    "Screeps creep combat return codes",
  ],
  primaryKeyword: "Screeps Creep.attack",
  searchIntent:
    "Use one owned melee Creep to select a valid hostile target, move to range 1, submit attack(), interpret documented return codes, and distinguish accepted intent from later observed damage",
  finalScore: 98,
  verification: [
    ["Article origin", "Original English guide — no translated source article"],
    ["Official API docs", "Checked — Creep.attack() target types, range 1, Rampart behavior, automatic hit-back, ATTACK requirement, and documented return codes"],
    ["Body-part reference", "Checked — one unboosted active ATTACK part has 30 melee attack power; boosts can modify that value"],
    ["Code review", "Passed — 4 JavaScript blocks syntax checked and the bounded melee helper reviewed"],
    ["Deterministic helper cases", "Passed — validation, movement, attack-failure, and scheduled branches exercised with mocks"],
    ["Screeps Console test", "Pending — no Console execution is claimed"],
    ["Live shard combat test", "Pending — no live combat execution is claimed"],
    ["Last verified", "August 30, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["minimal-loop", "Start with the minimal move-and-attack loop"],
    ["range-one", "Treat melee range as exactly one square"],
    ["return-codes", "Read every documented return code"],
    ["attack-parts", "Check active ATTACK parts before combat"],
    ["ramparts-hit-back", "Remember Ramparts and automatic hit-back"],
    ["helper", "Use a bounded helper without building a combat framework"],
    ["verification", "Separate scheduled intent from observed damage"],
    ["debugging", "Debug a melee attacker in the right order"],
    ["scope", "Know what this guide does not own"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "What range does Creep.attack() use?",
      "The target must be adjacent to the attacker, so the melee action range is 1. If the target is farther away, attack() returns ERR_NOT_IN_RANGE.",
    ],
    [
      "Does OK mean the target already lost hits?",
      "No. OK means the attack operation was scheduled successfully for the current tick. Inspect later processed state, and use event evidence when exact attribution matters.",
    ],
    [
      "Can Creep.attack() hit a target through a Rampart?",
      "If the target is inside a Rampart, the official API says the Rampart is attacked instead. Do not read damage to the Rampart as direct damage to the protected target.",
    ],
    [
      "Why can my attacker take damage when I call attack()?",
      "The official API says an attacked Creep with ATTACK body parts automatically hits back when it is not inside a Rampart. Melee contact can therefore damage both Creeps.",
    ],
    [
      "Should ranged combat be handled by the same helper?",
      "No. Creep.rangedAttack() has a different body-part requirement and a range of up to 3. Keep melee and ranged action selection separate.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-err-not-in-range",
    label: "If an action is too far away",
    title: "Use the Correct Action Range",
  },
  next: {
    href: "/en/blog/screeps-tower-auto-attack-hostiles",
    label: "For room defense with Towers",
    title: "Verify One Multi-Tower Volley",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Creep.attack(target)</code> schedules a short-range melee attack from one of your Creeps. The target must be adjacent, and the attacker needs at least one active <code>ATTACK</code> body part.</p>
<p>The safest beginner pattern is small: choose one hostile, move toward it until range 1, call <code>attack()</code>, preserve the return code, then inspect later state only after the tick has been processed. An <code>OK</code> return means the operation was scheduled successfully; it is not itself proof that the target already lost hits.</p>

<h2 id="minimal-loop">Start with the minimal move-and-attack loop</h2>
<p>This loop is enough to teach the API boundary without hiding it behind a combat system:</p>
<pre><code class="language-javascript">const attacker = Game.creeps.Guard1;

if (attacker) {
  const target = attacker.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

  if (target) {
    const attackResult = attacker.attack(target);

    if (attackResult === ERR_NOT_IN_RANGE) {
      const moveResult = attacker.moveTo(target);

      if (moveResult !== OK) {
        console.log(JSON.stringify({ stage: 'move', moveResult }));
      }
    } else if (attackResult !== OK) {
      console.log(JSON.stringify({ stage: 'attack', attackResult }));
    }
  }
}</code></pre>
<p>The first <code>attack()</code> call is useful because its return value tells you whether range is the current blocker. When it returns <code>ERR_NOT_IN_RANGE</code>, <code>moveTo()</code> schedules movement instead; the loop tries the attack again on a later tick.</p>
<p>If movement itself is accepted but the Creep still does not make progress, keep that as a separate movement problem and use the <a href="/en/blog/screeps-moveto-not-moving">moveTo() debugging guide</a>.</p>

<h2 id="range-one">Treat melee range as exactly one square</h2>
<p>The current official API requires the target to be on an adjacent square. In Screeps terms, that is range 1. You can inspect the distance before submitting the attack:</p>
<pre><code class="language-javascript">const range = attacker.pos.getRangeTo(target);

if (range > 1) {
  const moveResult = attacker.moveTo(target);
  console.log(JSON.stringify({ range, moveResult }));
} else {
  const attackResult = attacker.attack(target);
  console.log(JSON.stringify({ range, attackResult }));
}</code></pre>
<p>This version does not intentionally generate <code>ERR_NOT_IN_RANGE</code>; it uses the position check to choose between movement and attack. Both styles are valid. The important part is that you do not treat melee as a range-3 action or repeatedly call <code>attack()</code> from across the room.</p>
<p>For a broader explanation of action distance and <code>ERR_NOT_IN_RANGE</code>, see <a href="/en/blog/screeps-err-not-in-range">Use the Correct Action Range</a>.</p>

<h2 id="return-codes">Read every documented return code</h2>
<p>The current official <code>Creep.attack()</code> table documents six outcomes:</p>
<div class="table-scroll"><table>
<thead><tr><th>Return</th><th>Meaning</th><th>What to inspect next</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The attack operation was scheduled successfully.</td><td>Wait for processed state before making a damage claim.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>You do not own the attacking Creep.</td><td>Check which object your code resolved as the attacker.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The attacker is still being spawned.</td><td>Do not run active combat logic until spawning is complete.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The object is not a valid attackable target.</td><td>Check the resolved object type and whether your target reference is still current.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is farther than the adjacent melee range.</td><td>Move toward the target and retry on a later tick.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>The attacker has no usable <code>ATTACK</code> body part.</td><td>Inspect the current body, including destroyed parts.</td></tr>
</tbody></table></div>
<p>Do not collapse these into a single falsey result. The return code tells you which boundary failed now, while later game state tells you what was actually processed.</p>

<h2 id="attack-parts">Check active ATTACK parts before combat</h2>
<p>The body reference lists an unboosted <code>ATTACK</code> part at 30 melee attack power. Boosts can modify that value, and destroyed body parts no longer contribute. For a simple readiness check, use <code>getActiveBodyparts(ATTACK)</code>:</p>
<pre><code class="language-javascript">const activeAttackParts = attacker.getActiveBodyparts(ATTACK);

if (activeAttackParts === 0) {
  console.log(JSON.stringify({
    name: attacker.name,
    reason: 'no-active-attack-parts'
  }));
}</code></pre>
<p>This check is useful before target selection because it separates “this Creep cannot currently perform melee attacks” from range and target problems. It is not a full damage calculator; boosted parts, target mitigation, Ramparts, healing, and other combat effects belong to a larger combat model.</p>

<h2 id="ramparts-hit-back">Remember Ramparts and automatic hit-back</h2>
<p>Two official mechanics can make a simple melee exchange look surprising:</p>
<ul>
<li><strong>Rampart protection changes what is hit.</strong> If the target is inside a Rampart, the API says the Rampart is attacked instead.</li>
<li><strong>An attacked melee Creep can hit back automatically.</strong> If the target is a Creep with <code>ATTACK</code> parts and is not inside a Rampart, it automatically hits back at the attacker.</li>
</ul>
<p>That means “my call returned <code>OK</code>” does not imply “only the enemy lost hits.” Inspect both sides of a melee contact when survival matters.</p>

<h2 id="helper">Use a bounded helper without building a combat framework</h2>
<p>A small helper can keep the decision order explicit: validate the attacker, select one hostile Creep, move when outside range 1, and attack only when adjacent.</p>
<pre><code class="language-javascript">function scheduleMeleeAttack(attacker) {
  if (!attacker || !attacker.my) {
    return { ok: false, stage: 'validate', reason: 'invalid-attacker' };
  }

  if (attacker.spawning) {
    return { ok: false, stage: 'validate', reason: 'spawning' };
  }

  if (attacker.getActiveBodyparts(ATTACK) === 0) {
    return { ok: false, stage: 'validate', reason: 'no-attack-part' };
  }

  const target = attacker.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (!target) {
    return { ok: false, stage: 'select', reason: 'no-hostile-creep' };
  }

  const range = attacker.pos.getRangeTo(target);

  if (range > 1) {
    const moveResult = attacker.moveTo(target);
    return {
      ok: moveResult === OK,
      stage: 'move',
      code: moveResult,
      targetId: target.id,
      range
    };
  }

  const attackResult = attacker.attack(target);

  return {
    ok: attackResult === OK,
    stage: 'attack',
    code: attackResult,
    targetId: target.id,
    range
  };
}</code></pre>
<p>This helper deliberately owns only one melee decision. It does not choose military objectives, path through multiple rooms, coordinate healers, estimate boosted damage, or decide whether a fight is strategically good.</p>

<h2 id="verification">Separate scheduled intent from observed damage</h2>
<p><code>OK</code> is current-tick command evidence. Damage is processed game state. If you need to know whether an exact attack was processed, keep the attacker and target identity plus the tick, then inspect the next available state rather than treating the return code as a completed outcome.</p>
<p>A lower <code>target.hits</code> value on a later tick proves that the target lost hits, but it may not prove that your one melee attack was the only cause. Towers, ranged Creeps, other melee Creeps, and other damage can share the same interval. When exact action attribution matters, use the room event log and match the relevant attack event rather than inferring causality from net hits alone. The dedicated <a href="/en/blog/screeps-room-event-log">Room.getEventLog() guide</a> covers that evidence boundary.</p>

<h2 id="debugging">Debug a melee attacker in the right order</h2>
<ol>
<li><strong>Resolve the attacker.</strong> Confirm the Creep exists, is yours, and is no longer spawning.</li>
<li><strong>Check active <code>ATTACK</code> parts.</strong> Zero means the Creep cannot currently perform this melee action.</li>
<li><strong>Resolve one valid target.</strong> Start with <code>FIND_HOSTILE_CREEPS</code> when learning the API instead of mixing hostile structures and Creeps into one selector.</li>
<li><strong>Check range.</strong> If it is greater than 1, solve movement first.</li>
<li><strong>Preserve the exact <code>attack()</code> return code.</strong> Do not replace six distinct outcomes with a boolean.</li>
<li><strong>Inspect Rampart and hit-back behavior.</strong> The object losing hits may not be the object you first expected.</li>
<li><strong>Verify processed state later.</strong> Use event evidence when exact attribution matters.</li>
</ol>

<h2 id="scope">Know what this guide does not own</h2>
<p>This page is specifically about one Creep's melee <code>attack()</code> action. It does not replace:</p>
<ul>
<li><a href="/en/blog/screeps-tower-auto-attack-hostiles">Tower.attack() room-defense automation</a>;</li>
<li>ranged Creep combat with <code>rangedAttack()</code> or <code>rangedMassAttack()</code>;</li>
<li>boost planning, damage simulation, healer coordination, or squad pathing;</li>
<li>room-level target priorities and military strategy.</li>
</ul>
<p>Keeping those concerns separate makes a failed melee call much easier to diagnose.</p>

<h2 id="faq">FAQ</h2>
<h3>Can Creep.attack() target structures?</h3>
<p>Yes. The documented target types are <code>Creep</code>, <code>PowerCreep</code>, and <code>Structure</code>. This guide uses hostile Creeps in its minimal selector so the first example stays focused.</p>

<h3>Can I call attack() before moveTo()?</h3>
<p>Yes. The official example calls <code>attack()</code> first and reacts to <code>ERR_NOT_IN_RANGE</code> by calling <code>moveTo()</code>. A pre-range-check pattern is also valid when you want to avoid intentionally generating that return code.</p>

<h3>Does one ATTACK part always deal 30 damage?</h3>
<p>An unboosted active <code>ATTACK</code> part has 30 melee attack power in the current body-part reference. Boosts can increase attack power, and the target's protection or other combat mechanics can affect the observed result.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.attack">Screeps API — Creep.attack()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.getActiveBodyparts">Screeps API — Creep.getActiveBodyparts()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog">Screeps API — Room.getEventLog()</a></li>
</ul>
`,
} satisfies EnglishCreepAttackOriginalArticle;
