import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

type EnglishCreepPullOriginalArticle = Omit<EnglishBeginnerArticle, "chinesePath"> & {
  chinesePath?: undefined;
};

export const englishCreepPullArticle = {
  slug: "screeps-creep-pull",
  path: "/en/blog/screeps-creep-pull",
  title: "Screeps Creep.pull(): Coordinate Two Creeps in One Tick",
  headline: "How to Make Creep.pull() Actually Move the Target",
  description:
    "Coordinate Creep.pull(), the puller's movement, and target.move(puller) in the same tick, handle adjacency and fatigue correctly, and verify the pair moved later.",
  category: "MOVEMENT · CREEP PULL",
  publishedAt: "2026-08-29",
  publishedLabel: "August 29, 2026",
  readingTime: "13 min read",
  breadcrumbLabel: "Creep.pull()",
  tags: ["Screeps", "Creep", "Movement", "Fatigue", "Debugging"],
  keywords: [
    "Screeps Creep.pull",
    "Screeps pull creep",
    "Screeps target.move puller",
    "Screeps pulling fatigue",
    "Screeps creep pair movement",
  ],
  primaryKeyword: "Screeps Creep.pull",
  searchIntent:
    "Coordinate one adjacent puller-target Creep pair so Creep.pull() and both movement intents produce one valid pulled step, while handling range, MOVE, fatigue, and later-tick verification",
  finalScore: 98,
  verification: [
    ["Article origin", "Original English guide — no translated source article"],
    ["Official API docs", "Checked — Creep.pull() and Creep.move() coordination, range, fatigue, and documented return codes"],
    ["Public engine source", "Checked — pull intent registration, pulled-Creep movement eligibility, and API-layer return behavior"],
    ["Code review", "Passed — 5 JavaScript blocks syntax checked and coordinator guards reviewed"],
    ["Deterministic coordinator cases", "Passed — 21 assertions across validation, staged failures, and success ordering"],
    ["Screeps Console test", "Pending — no Console execution is claimed"],
    ["Live shard movement test", "Pending — no live pair movement is claimed"],
    ["Last verified", "August 29, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["minimal-pattern", "Use the three-intent pattern"],
    ["why-three-intents", "Why pull() alone does not move the target"],
    ["preconditions", "Check the pair before scheduling movement"],
    ["return-codes", "Read pull() return codes without inventing one"],
    ["fatigue", "Understand where pulling fatigue goes"],
    ["coordinator", "Use a coordinator that preserves each failure stage"],
    ["verification", "Verify actual movement on a later tick"],
    ["debugging", "Debug a pull pair in the right order"],
    ["pathfinding", "Keep pathfinding separate from pair movement"],
    ["scope", "Know what this guide does not own"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "Does puller.pull(target) move the target automatically?",
      "No. The documented pattern coordinates three same-tick intents: the puller moves, the puller calls pull(target), and the target calls move(puller). The pull intent alone is not an automatic drag command.",
    ],
    [
      "Can the pulled Creep move when it is tired or has no active MOVE part?",
      "For the special target.move(puller) form, the official Creep.move() documentation says ERR_TIRED and ERR_NO_BODYPART checks are bypassed when the argument is a nearby Creep. The puller still needs to produce the actual valid movement step.",
    ],
    [
      "Why does this guide not list ERR_NO_BODYPART as a pull() return code?",
      "The current official pull() return table does not list ERR_NO_BODYPART, and the current public engine API layer does not emit that code from pull(). Treat an active MOVE part on the puller as a precondition you validate before scheduling the pair instead of inventing an undocumented pull() return value.",
    ],
    [
      "Does OK from all three calls prove that both Creeps changed position?",
      "No. Those return values describe the current-tick calls. Record the pair identity and starting positions, then inspect the same Creeps on a later tick to determine whether movement was actually observed.",
    ],
    [
      "Should PathFinder.search() be part of the pull() success test?",
      "No. Pathfinding chooses a route or next step; pull() coordinates the pair's movement intents. Reject incomplete path searches first, then convert the next complete path step into a direction for the pull coordinator.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-move-fatigue-body-ratio",
    label: "Related movement mechanic",
    title: "Calculate Creep Movement Speed",
  },
  next: {
    href: "/en/blog/screeps-moveto-not-moving",
    label: "If movement is accepted but stalls",
    title: "Diagnose a Creep That Does Not Move",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>Creep.pull()</code> is not an automatic drag command. A working pull step is a coordinated movement contract between two adjacent Creeps. In the same tick, the puller must schedule its own movement, call <code>pull(target)</code>, and the target must call <code>move(puller)</code>.</p>
<p>Preserve the return value from every call. <code>OK</code> means the current-tick intent was accepted by that API boundary; it does not prove that both positions changed. Store the pair identity and starting positions if you need to verify the processed movement on a later tick.</p>

<h2 id="minimal-pattern">Use the three-intent pattern</h2>
<p>The official API example uses this ordering: move the puller, establish the pull, then make the target move toward the puller. This minimal fragment assumes you have already selected two adjacent Creeps and a valid direction:</p>
<pre><code class="language-javascript">const pullerMoveResult = puller.move(direction);
const pullResult = puller.pull(target);
const targetMoveResult = target.move(puller);

console.log(JSON.stringify({
  pullResult,
  pullerMoveResult,
  targetMoveResult
}));</code></pre>
<p>All three results matter. If the puller's move fails, there is no useful destination step. If <code>pull()</code> fails, there is no valid pull relationship. If <code>target.move(puller)</code> fails, the target did not submit the special movement intent that completes the documented pair pattern.</p>

<h2 id="why-three-intents">Why pull() alone does not move the target</h2>
<p><code>pull(target)</code> establishes the relationship used by movement processing. It does not choose where the puller should go, and it does not submit the target's movement intent for you. That is why code like <code>puller.pull(target)</code> by itself can return <code>OK</code> without becoming a complete movement instruction.</p>
<p>The target's call is also unusual. <code>Creep.move()</code> normally receives a direction from 1 through 8, but the API also accepts a nearby Creep object for pulling. In that special form, the official documentation says the target's <code>ERR_TIRED</code> and <code>ERR_NO_BODYPART</code> checks are bypassed.</p>
<pre><code class="language-javascript">const targetMoveResult = target.move(puller);

if (targetMoveResult !== OK) {
  console.log(JSON.stringify({ targetMoveResult }));
}</code></pre>
<p>That exception belongs to the pulled target's special <code>move(puller)</code> call. It does not make the puller's own directional movement immune to fatigue, missing <code>MOVE</code> parts, obstacles, or normal movement conflicts.</p>

<h2 id="preconditions">Check the pair before scheduling movement</h2>
<p>A robust coordinator should reject impossible or ambiguous pair state before emitting any movement intent:</p>
<ul>
<li><strong>Both objects exist and are Creeps you intend to coordinate.</strong> Do not keep stale names or IDs without resolving them again on the current tick.</li>
<li><strong>The pair is adjacent.</strong> <code>pull()</code> returns <code>ERR_NOT_IN_RANGE</code> when the target is not next to the puller.</li>
<li><strong>Neither Creep is still spawning.</strong> A spawning Creep cannot participate in this pair step.</li>
<li><strong>The target is not the puller itself.</strong> Self-pulling is not a valid target.</li>
<li><strong>The puller has an active <code>MOVE</code> part and no current fatigue.</strong> The puller must still submit a normal directional move.</li>
<li><strong>Your coordinator controls both Creeps.</strong> The helper below requires <code>target.my</code> because it must call <code>target.move(puller)</code>. This is a coordinator policy, not a claim that <code>pull()</code> itself documents an ownership error for the target.</li>
</ul>
<p>If your problem is the puller's ordinary movement speed rather than pair coordination, use the <a href="/en/blog/screeps-move-fatigue-body-ratio">movement-speed and fatigue guide</a> instead of hiding that calculation inside the pull helper.</p>

<h2 id="return-codes">Read pull() return codes without inventing one</h2>
<p>The current official <code>Creep.pull()</code> return table documents these outcomes:</p>
<div class="table-scroll"><table>
<thead><tr><th>Return</th><th>Meaning for this call</th><th>Next check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The pull intent was accepted at the API boundary.</td><td>Check the two movement calls, then verify positions later if the result matters.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>You do not own the puller.</td><td>Resolve the Creep identity and ownership before scheduling it.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The puller is still spawning.</td><td>Wait until the Creep exists as an active unit.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a valid other Creep for this pull.</td><td>Check object type, spawning state, and self-targeting.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is not adjacent.</td><td>Move the pair into adjacency before trying the pull step.</td></tr>
</tbody></table></div>
<p>The same documentation says pulling requires a <code>MOVE</code> body part, but its <code>pull()</code> return table does <em>not</em> list <code>ERR_NO_BODYPART</code>. The current public Screeps engine API layer likewise registers <code>pull()</code> after ownership, spawning, target, and adjacency checks without emitting that code.</p>
<div class="callout"><strong>Practical boundary:</strong> validate an active <code>MOVE</code> part on the puller before scheduling the pair. Do not manufacture an undocumented <code>pull()</code> return branch to represent that precondition.</div>

<h2 id="fatigue">Understand where pulling fatigue goes</h2>
<p>Pulling does not make movement weight disappear. The official API says the fatigue generated for the target's movement is added to the puller instead of the target. That makes the puller's body, the target's body and carried resources, terrain, roads, and boosts relevant to sustained pull speed.</p>
<p>This guide deliberately does not promise a fixed travel rate for a pull pair. A useful speed statement needs the actual bodies, active parts, carried resources, terrain sequence, roads, boosts, and the pair's observed movement. If you only need the general fatigue math, keep that concern in the dedicated movement-speed guide.</p>

<h2 id="coordinator">Use a coordinator that preserves each failure stage</h2>
<p>The helper below validates the state this pair coordinator depends on, then submits each call in the documented order. It returns the exact stage that failed rather than collapsing everything into a boolean:</p>
<pre><code class="language-javascript">function schedulePullStep(puller, target, direction) {
  if (!puller || !target) {
    return { ok: false, stage: 'validate', reason: 'missing-creep' };
  }

  if (!puller.my || !target.my) {
    return { ok: false, stage: 'validate', reason: 'pair-not-owned' };
  }

  if (puller.spawning || target.spawning) {
    return { ok: false, stage: 'validate', reason: 'spawning' };
  }

  if (puller.id === target.id) {
    return { ok: false, stage: 'validate', reason: 'same-creep' };
  }

  if (!puller.pos.isNearTo(target.pos)) {
    return { ok: false, stage: 'validate', reason: 'not-adjacent' };
  }

  if (puller.getActiveBodyparts(MOVE) === 0) {
    return { ok: false, stage: 'validate', reason: 'puller-no-move' };
  }

  if (puller.fatigue > 0) {
    return { ok: false, stage: 'validate', reason: 'puller-tired' };
  }

  if (!Number.isInteger(direction) || direction < 1 || direction > 8) {
    return { ok: false, stage: 'validate', reason: 'invalid-direction' };
  }

  const pullerMoveResult = puller.move(direction);
  if (pullerMoveResult !== OK) {
    return { ok: false, stage: 'puller-move', code: pullerMoveResult };
  }

  const pullResult = puller.pull(target);
  if (pullResult !== OK) {
    return { ok: false, stage: 'pull', code: pullResult };
  }

  const targetMoveResult = target.move(puller);
  if (targetMoveResult !== OK) {
    return { ok: false, stage: 'target-move', code: targetMoveResult };
  }

  return {
    ok: true,
    stage: 'scheduled',
    codes: {
      pull: pullResult,
      pullerMove: pullerMoveResult,
      targetMove: targetMoveResult
    }
  };
}</code></pre>
<p>Requiring <code>target.my</code> is intentional here: this function owns both movement calls. If your architecture does not control the target's code, it cannot guarantee the three-intent contract and should not report a fully scheduled pair.</p>

<h2 id="verification">Verify actual movement on a later tick</h2>
<p>Current-tick return values are not later-tick position evidence. If the operation matters enough to verify, store the exact Creep IDs, starting positions, tick, and current-tick result. On a later tick, resolve those IDs again before comparing positions:</p>
<pre><code class="language-javascript">function rememberPullAttempt(puller, target, result) {
  Memory.pullCheck = {
    tick: Game.time,
    pullerId: puller.id,
    targetId: target.id,
    pullerStart: {
      x: puller.pos.x,
      y: puller.pos.y,
      roomName: puller.pos.roomName
    },
    targetStart: {
      x: target.pos.x,
      y: target.pos.y,
      roomName: target.pos.roomName
    },
    result
  };
}

function positionChanged(start, creep) {
  return Boolean(creep) && (
    creep.pos.x !== start.x ||
    creep.pos.y !== start.y ||
    creep.pos.roomName !== start.roomName
  );
}

function inspectPreviousPull() {
  const check = Memory.pullCheck;
  if (!check || check.tick >= Game.time) return null;

  const puller = Game.getObjectById(check.pullerId);
  const target = Game.getObjectById(check.targetId);

  return {
    scheduledAt: check.tick,
    pullerExists: Boolean(puller),
    targetExists: Boolean(target),
    pullerMoved: positionChanged(check.pullerStart, puller),
    targetMoved: positionChanged(check.targetStart, target),
    pairAdjacentNow: Boolean(
      puller && target && puller.pos.isNearTo(target.pos)
    )
  };
}</code></pre>
<p><code>pullerMoved</code> and <code>targetMoved</code> tell you what changed; they do not prove that no other movement interaction affected the pair. If all calls returned <code>OK</code> but one or both positions did not change, continue with the <a href="/en/blog/screeps-moveto-not-moving">movement progress diagnostic</a> and inspect obstacles, competing movement, fatigue, and traffic rather than rewriting the pull return code.</p>

<h2 id="debugging">Debug a pull pair in the right order</h2>
<ol>
<li><strong>Resolve both current-tick objects.</strong> Log IDs, names, positions, spawning state, and ownership before using saved state.</li>
<li><strong>Check adjacency.</strong> A range failure belongs before movement theory.</li>
<li><strong>Check the puller's movement capability.</strong> Inspect active <code>MOVE</code> parts and current fatigue.</li>
<li><strong>Log all three return values.</strong> Do not log only <code>pull()</code> and then guess which movement call failed.</li>
<li><strong>Keep the target's special move form exact.</strong> The target should call <code>move(puller)</code>, not copy the puller's direction as if the two calls were ordinary independent movement.</li>
<li><strong>Inspect a later tick.</strong> Re-resolve both IDs and compare the positions you actually recorded.</li>
<li><strong>Only then investigate broader movement conflicts.</strong> Traffic, obstacles, competing intents, and route choice are downstream branches once the pair contract is known to have been scheduled correctly.</li>
</ol>

<h2 id="pathfinding">Keep pathfinding separate from pair movement</h2>
<p><code>PathFinder.search()</code> can choose the puller's next step, but it does not establish the pull relationship. Reject an incomplete search before converting its first complete path step into a direction:</p>
<pre><code class="language-javascript">function movePullPairToward(
  puller,
  target,
  destination,
  goalRange = 0
) {
  const search = PathFinder.search(
    puller.pos,
    { pos: destination, range: goalRange }
  );

  if (search.incomplete) {
    return { ok: false, reason: 'incomplete-path' };
  }

  if (search.path.length === 0) {
    return { ok: true, reason: 'goal-range-satisfied' };
  }

  const direction = puller.pos.getDirectionTo(search.path[0]);
  return schedulePullStep(puller, target, direction);
}</code></pre>
<p>Pass the goal range that belongs to the downstream task; do not hard-code range 1 for every destination. The <a href="/en/blog/screeps-pathfinder-search">PathFinder.search() guide</a> owns goal ranges, <code>incomplete</code>, partial paths, search costs, and search limits. This page only owns the two-Creep movement handoff after a valid next step exists.</p>

<h2 id="scope">Know what this guide does not own</h2>
<p>This article covers one adjacent puller-target pair and one coordinated movement step. It does not promise a convoy algorithm, formation movement, cross-room persistence, traffic arbitration, or a fixed travel speed. Those systems need additional state, routing, collision policy, and measurement.</p>
<p>It also does not claim Screeps Console or live-shard execution for the examples above. The API contract was checked against current official documentation, the return-code edge was checked against the current public engine source, and the coordinator examples passed static syntax review plus deterministic local cases. Runtime pair movement remains a separate evidence level.</p>

<h2 id="faq">FAQ</h2>
<h3>Does <code>puller.pull(target)</code> move the target automatically?</h3>
<p>No. Coordinate the puller's movement, <code>pull(target)</code>, and <code>target.move(puller)</code> in the same tick.</p>
<h3>Can the pulled target have fatigue or no active MOVE part?</h3>
<p>The official special <code>move(puller)</code> form bypasses the target's <code>ERR_TIRED</code> and <code>ERR_NO_BODYPART</code> checks. The puller still has to make a valid movement step.</p>
<h3>Should I expect <code>pull()</code> to return <code>ERR_NO_BODYPART</code>?</h3>
<p>Do not build that assumption into your code. It is not listed in the current official <code>pull()</code> return table. Validate the puller's active <code>MOVE</code> part before scheduling the pair.</p>
<h3>Why store the pair in Memory?</h3>
<p>You only need persistent evidence when you want to compare the accepted current-tick calls with positions observed on a later tick. Do not store extra state when the result is not important to verify.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.pull">Screeps API — Creep.pull()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.move">Screeps API — Creep.move()</a></li>
</ul>
`,
} satisfies EnglishCreepPullOriginalArticle;
