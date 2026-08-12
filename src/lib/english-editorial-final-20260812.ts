import type { EnglishBeginnerArticle } from "./english-beginner-content";

const FINAL_SLUGS = new Set([
  "screeps-err-not-in-range",
  "screeps-moveto-not-moving",
  "screeps-cpu-getused-bucket",
  "screeps-spawn-creep",
]);

function verification(
  docs: string,
  staticReview: string,
  liveBoundary: string,
): Array<[string, string]> {
  return [
    ["Official documentation", docs],
    ["Static code review", staticReview],
    ["Console test pending", "Not run in this editorial pass"],
    ["Live multi-tick verification pending", liveBoundary],
    ["Last verified", "August 12, 2026"],
  ];
}

function patchErrNotInRange(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps ERR_NOT_IN_RANGE: Diagnose Action Range Safely",
    headline: "How to Fix ERR_NOT_IN_RANGE in Screeps Without Hiding the Real Failure",
    description:
      "Diagnose Screeps ERR_NOT_IN_RANGE by checking the original action, its required range, moveTo() separately, return codes, body prerequisites, and the next-tick retry boundary.",
    category: "MOVEMENT · ACTION RANGE DEBUGGING",
    readingTime: "13 min read",
    breadcrumbLabel: "ERR_NOT_IN_RANGE",
    tags: ["Screeps", "Movement", "Debugging", "Return Codes", "JavaScript"],
    keywords: [
      "Screeps ERR_NOT_IN_RANGE",
      "Screeps moveTo range",
      "Screeps action range",
      "Screeps return codes",
    ],
    primaryKeyword: "Screeps ERR_NOT_IN_RANGE",
    searchIntent:
      "Fix an action that returns ERR_NOT_IN_RANGE without confusing action range with movement success",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Creep action ranges, Creep.moveTo(), ERR_NOT_IN_RANGE, ERR_NO_BODYPART, and game-loop timing",
      "Passed — original action and movement results are kept separate; range-1/range-3 and no-MOVE boundaries reviewed",
      "No live shard trace was collected showing movement followed by a successful later-tick action retry",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["when-to-use", "Use this guide when"],
      ["two-results", "Separate the action result from movement"],
      ["ranges", "Check the action's real range"],
      ["minimal-fix", "Minimal safe fix"],
      ["tick-boundary", "Why the action retries on a later tick"],
      ["move-results", "Read moveTo() return codes separately"],
      ["prerequisites", "Check body, resource, and ownership prerequisites"],
      ["diagnostic", "Safer diagnostic version"],
      ["common-mistakes", "Common mistakes"],
      ["scope", "When this guide does not apply"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What does ERR_NOT_IN_RANGE mean in Screeps?",
        "The method you called requires the acting object to be closer to its target. It describes that action call; it does not say whether a later moveTo() call will succeed.",
      ],
      [
        "Should I call the action again immediately after moveTo()?",
        "Usually no. Movement is an intent for the current tick, while the Creep position used by your script is still the current-tick position. Retry the action when a later tick shows the Creep in the required range.",
      ],
      [
        "Does moveTo() return ERR_NO_BODYPART?",
        "Yes. The current official return table includes ERR_NO_BODYPART (-12) when the Creep has no active MOVE body part.",
      ],
      [
        "Is ERR_NOT_IN_RANGE always a movement bug?",
        "No. The target can be valid and reachable while simply being outside the action's allowed range. Diagnose movement only after the action result tells you range is the problem.",
      ],
    ],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>ERR_NOT_IN_RANGE</code> (<code>-9</code>) belongs to the <em>action you called</em>. If <code>creep.harvest(source)</code> returns it, the Creep is not close enough to harvest. Call <code>moveTo()</code> as a separate operation, check that return code separately, and retry <code>harvest()</code> on a later tick when the Creep is actually within range 1.</p>
<pre><code class="language-javascript">const result = creep.harvest(source);

if (result === ERR_NOT_IN_RANGE) {
  const moveResult = creep.moveTo(source, {
    range: 1,
    reusePath: 5
  });

  if (moveResult !== OK && moveResult !== ERR_TIRED) {
    console.log('moveTo() returned ' + moveResult);
  }
}</code></pre>
<p>This pattern keeps two questions separate: “Why did the action fail now?” and “Was a movement request accepted?”</p>

<h2 id="when-to-use">Use this guide when</h2>
<p>Use it when a Creep action such as <code>harvest()</code>, <code>transfer()</code>, <code>withdraw()</code>, <code>build()</code>, <code>repair()</code>, or <code>upgradeController()</code> returns <code>ERR_NOT_IN_RANGE</code>. If <code>moveTo()</code> itself returns <code>ERR_NO_PATH</code>, use the <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH guide</a>. If <code>moveTo()</code> returns <code>OK</code> but the position does not progress on later ticks, use <a href="/en/blog/screeps-moveto-not-moving">the accepted-movement debugging guide</a>.</p>

<h2 id="two-results">Separate the action result from movement</h2>
<p>A common debugging mistake is to overwrite the original action result:</p>
<pre><code class="language-javascript">let result = creep.harvest(source);

if (result === ERR_NOT_IN_RANGE) {
  result = creep.moveTo(source);
}

console.log(result);</code></pre>
<p>Now the log no longer tells you whether <code>harvest()</code> returned <code>-9</code>; it only shows the later movement call. Keep both values:</p>
<pre><code class="language-javascript">const actionResult = creep.harvest(source);
let moveResult = null;

if (actionResult === ERR_NOT_IN_RANGE) {
  moveResult = creep.moveTo(source, { range: 1 });
}

console.log(JSON.stringify({
  tick: Game.time,
  actionResult,
  moveResult
}));</code></pre>
<p>An <code>OK</code> movement result is not proof that the original action happened. The action already returned for the current call.</p>

<h2 id="ranges">Check the action's real range</h2>
<p>Do not copy one movement range into every role. Different actions have different range requirements.</p>
<div class="table-scroll"><table>
<thead><tr><th>Action</th><th>Required range</th><th>Typical movement target</th></tr></thead>
<tbody>
<tr><td><code>harvest(source)</code></td><td>1</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>transfer(target, resource)</code></td><td>1</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>withdraw(target, resource)</code></td><td>1</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>build(site)</code></td><td>3</td><td><code>{ range: 3 }</code></td></tr>
<tr><td><code>repair(structure)</code></td><td>3</td><td><code>{ range: 3 }</code></td></tr>
<tr><td><code>upgradeController(controller)</code></td><td>3</td><td><code>{ range: 3 }</code></td></tr>
</tbody></table></div>
<p>Use <code>creep.pos.getRangeTo(target)</code> when you need a read-only check. The <a href="/en/blog/screeps-roomposition-distance">RoomPosition distance guide</a> covers range semantics and cross-room boundaries.</p>

<h2 id="minimal-fix">Minimal safe fix</h2>
<p>For a Harvester, keep the action branch small:</p>
<pre><code class="language-javascript">function harvestOrMove(creep, source) {
  if (!creep || !source) {
    return { status: 'missing-object' };
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult !== ERR_NOT_IN_RANGE) {
    return {
      status: 'harvest-result',
      harvestResult
    };
  }

  const moveResult = creep.moveTo(source, {
    range: 1,
    reusePath: 5
  });

  return {
    status: 'moving-into-range',
    harvestResult,
    moveResult
  };
}</code></pre>
<p>The function does not convert movement acceptance into harvest success. That distinction makes logs and later decisions trustworthy.</p>

<h2 id="tick-boundary">Why the action retries on a later tick</h2>
<p>Your loop reads the current game state, then submits actions and movement intents. If <code>harvest()</code> returns <code>ERR_NOT_IN_RANGE</code>, calling <code>moveTo()</code> does not rewrite <code>creep.pos</code> for the remainder of that JavaScript execution. The movement is resolved as part of the tick.</p>
<pre><code class="language-text">tick 1200
harvest() -> ERR_NOT_IN_RANGE
moveTo()  -> OK

later tick
read the new Creep position
harvest() is attempted again</code></pre>
<p>This is a timing model, not a recorded live trace from this editorial pass. Live multi-tick verification remains pending.</p>

<h2 id="move-results">Read moveTo() return codes separately</h2>
<div class="table-scroll"><table>
<thead><tr><th>moveTo() result</th><th>Meaning for this branch</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The movement request was accepted; verify position progress on later ticks.</td></tr>
<tr><td><code>ERR_NO_PATH</code></td><td>No path was found under the current movement options.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep cannot perform the movement request in its current state, such as while spawning.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a valid movement target.</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Fatigue prevents movement this tick.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>MOVE</code> body part remains.</td></tr>
</tbody></table></div>
<p>Do not retry pathfinding indefinitely after a hard call failure. Branch on the result that actually occurred.</p>

<h2 id="prerequisites">Check body, resource, and ownership prerequisites</h2>
<p>Getting into range does not guarantee the original action will succeed. A Harvester needs an active <code>WORK</code> part and free capacity for harvested Energy. A transfer needs the resource being transferred. Controller upgrading needs carried Energy and an active <code>WORK</code> part. Ownership and target validity also differ by method.</p>
<p>The sequence is therefore:</p>
<ol>
<li>Call the intended action and keep its return code.</li>
<li>If and only if it returns <code>ERR_NOT_IN_RANGE</code>, request movement with the action's real range.</li>
<li>On later ticks, call the action again and diagnose the new return code rather than assuming movement solved every prerequisite.</li>
</ol>

<h2 id="diagnostic">Safer diagnostic version</h2>
<pre><code class="language-javascript">function describeRangeFailure(creep, target, actionName, actionResult) {
  const range = creep && target
    ? creep.pos.getRangeTo(target)
    : null;

  return {
    tick: Game.time,
    creep: creep?.name ?? null,
    action: actionName,
    actionResult,
    targetId: target?.id ?? null,
    range,
    fatigue: creep?.fatigue ?? null,
    activeMove: creep
      ? creep.getActiveBodyparts(MOVE)
      : null
  };
}</code></pre>
<p>Log this only when a failure changes state or at a bounded interval. Permanent per-tick logging can make a simple range problem harder to read.</p>

<h2 id="common-mistakes">Common mistakes</h2>
<ul>
<li>Replacing the action return code with the later <code>moveTo()</code> result.</li>
<li>Using range 1 for actions that work at range 3, causing unnecessary traffic.</li>
<li>Calling the action again in the same execution and expecting <code>creep.pos</code> to have changed.</li>
<li>Treating <code>moveTo() === OK</code> as proof that the action succeeded.</li>
<li>Ignoring <code>ERR_NO_BODYPART</code> after all active <code>MOVE</code> parts are gone.</li>
<li>Diagnosing range before checking whether the target object exists.</li>
</ul>

<h2 id="scope">When this guide does not apply</h2>
<p>This guide does not solve path search failure, traffic deadlocks, fatigue body design, invisible-room targets, or a Creep whose accepted movement does not produce later-tick progress. Follow the return code or observable symptom into the specific Movement guide instead of adding more retries here.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What does ERR_NOT_IN_RANGE mean?</h3>
<p>The original method requires the acting object to be closer to its target. It is not a generic “movement failed” code.</p>
<h3>Should I retry the action immediately after moveTo()?</h3>
<p>Do not assume the Creep moved during the same JavaScript execution. Retry on a later tick after reading the new position.</p>
<h3>Does moveTo() return ERR_NO_BODYPART?</h3>
<p>Yes. The current official return table includes <code>ERR_NO_BODYPART</code> (<code>-12</code>) when there is no active <code>MOVE</code> body part.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow noopener noreferrer">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">API Reference: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow noopener noreferrer">API Reference: Creep.upgradeController()</a></li>
<li><a href="https://docs.screeps.com/simultaneous-actions.html" rel="nofollow noopener noreferrer">Simultaneous actions and movement priority</a></li>
</ul>`,
  };
}

function patchMoveToNotMoving(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps moveTo() Returns OK but the Creep Does Not Move",
    headline: "How to Debug moveTo() Returning OK Without Position Progress",
    description:
      "Debug a Screeps Creep when moveTo() returns OK but later ticks show no position progress: separate call failures, same-tick intent overrides, traffic, range, and multi-tick evidence.",
    category: "MOVEMENT · ACCEPTED INTENT DEBUGGING",
    readingTime: "14 min read",
    breadcrumbLabel: "moveTo() OK but Not Moving",
    tags: ["Screeps", "Movement", "Debugging", "moveTo", "JavaScript"],
    keywords: [
      "Screeps moveTo not moving",
      "Screeps moveTo returns OK",
      "Screeps creep stuck",
      "Screeps movement debugging",
    ],
    primaryKeyword: "Screeps moveTo not moving",
    searchIntent:
      "Diagnose a moveTo() call that is accepted but produces no observable position progress on later ticks",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Creep.moveTo(), fatigue, ERR_NO_BODYPART, and same-tick movement priority",
      "Passed — call failures and accepted-intent stalls are separated; target coordinates, later-tick position keys, and final movement intent are explicit",
      "No live traffic collision, path-cache stall, or multi-tick position trace was reproduced for this revision",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["scope", "First confirm this is an OK-but-no-progress case"],
      ["tick-evidence", "Compare positions across ticks"],
      ["already-in-range", "Check whether movement is still needed"],
      ["last-movement", "Find the last movement call in the tick"],
      ["traffic", "Check traffic and occupied tiles"],
      ["path-options", "Review path options without blaming the cache"],
      ["target-validation", "Validate the target position"],
      ["diagnostic", "Use one bounded diagnostic record"],
      ["production", "Production adaptation"],
      ["not-this-guide", "When this guide does not apply"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What does moveTo() returning OK prove?",
        "It proves that the method accepted the movement request for that call. It does not prove that the Creep will occupy a different tile on the next tick.",
      ],
      [
        "Can another movement call override an earlier moveTo()?",
        "Yes. For movement methods submitted by the same Creep in one tick, the later movement call has priority. Log or centralize the final movement decision.",
      ],
      [
        "Is fatigue an OK-but-not-moving case?",
        "Normally no. If fatigue prevents movement, diagnose ERR_TIRED rather than putting the call into the accepted-OK branch.",
      ],
      [
        "Does a Creep without MOVE belong in this guide?",
        "No. The current moveTo() API can return ERR_NO_BODYPART (-12). Fix that call failure first.",
      ],
    ],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>moveTo() === OK</code> means the movement request was accepted by that method call. It is not a promise that the Creep will occupy a different tile on the next tick. To debug an apparent stall, first prove that the call really returned <code>OK</code>, then compare the Creep position on later ticks and inspect the <em>last</em> movement call issued for that Creep in the current tick.</p>

<h2 id="scope">First confirm this is an OK-but-no-progress case</h2>
<p>This page is deliberately narrower than a general movement guide. Do not use it when the current call already tells you why movement was rejected.</p>
<div class="table-scroll"><table>
<thead><tr><th>Current result</th><th>Next diagnostic</th></tr></thead>
<tbody>
<tr><td><code>ERR_NO_PATH</code></td><td>Path search failed. Use the <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH guide</a>.</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Inspect fatigue and body movement ratio.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Check the Creep state, including whether it is still spawning.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>MOVE</code> part remains.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Fix the target before investigating traffic.</td></tr>
<tr><td><code>OK</code></td><td>Now compare later-tick position progress and final movement intent.</td></tr>
</tbody></table></div>

<h2 id="tick-evidence">Compare positions across ticks</h2>
<p>Do not decide that a Creep is stuck from one line of code. Save a compact position key and compare it on a later tick:</p>
<pre><code class="language-javascript">function getPositionKey(pos) {
  if (!pos) return null;
  return pos.roomName + ':' + pos.x + ':' + pos.y;
}

function recordMovementObservation(creep, moveResult) {
  Memory.moveDebug ??= {};

  const previous = Memory.moveDebug[creep.name] ?? null;
  const currentKey = getPositionKey(creep.pos);

  Memory.moveDebug[creep.name] = {
    tick: Game.time,
    position: currentKey,
    previousPosition: previous?.position ?? null,
    moveResult
  };

  return {
    currentKey,
    previousKey: previous?.position ?? null,
    previousTick: previous?.tick ?? null
  };
}</code></pre>
<p>A same-position comparison is useful only when the observations are from different ticks. Across room borders, include <code>roomName</code> as shown; comparing only <code>x</code> and <code>y</code> can misread a room transition.</p>

<h2 id="already-in-range">Check whether movement is still needed</h2>
<p>If you call <code>moveTo(target, { range: 3 })</code> and the Creep is already within range 3, a lack of tile movement can be the correct outcome. Compare the current range with the range your role actually requires:</p>
<pre><code class="language-javascript">const desiredRange = 3;
const currentRange = creep.pos.getRangeTo(target);

if (currentRange <= desiredRange) {
  // Do the range-3 action instead of demanding another tile step.
}</code></pre>
<p>This matters for builders, repairers, and upgraders. “Position unchanged” and “movement failure” are not the same observation.</p>

<h2 id="last-movement">Find the last movement call in the tick</h2>
<p>Screeps resolves simultaneous movement actions by giving the later movement method call priority for the same Creep. An early <code>moveTo()</code> can therefore return <code>OK</code> even though a later module submits a different movement intent.</p>
<pre><code class="language-javascript">function submitMove(creep, target, reason) {
  const result = creep.moveTo(target, {
    reusePath: 5
  });

  creep.memory.lastMoveDecision = {
    tick: Game.time,
    reason,
    targetId: target.id ?? null,
    result
  };

  return result;
}</code></pre>
<p>In production, centralize movement or at least overwrite one diagnostic record every time a movement method is submitted. The final record should identify the last caller, not the first one that happened to log.</p>

<h2 id="traffic">Check traffic and occupied tiles</h2>
<p>Accepted movement still competes with other movement intents and occupied positions. A path can be valid while the immediate step is not obtained on that tick. The caller does not receive a separate post-resolution collision return code.</p>
<p>Use a later-tick position comparison together with a small local snapshot:</p>
<pre><code class="language-javascript">const nearbyCreeps = creep.pos.findInRange(
  FIND_CREEPS,
  1
).map(other => ({
  name: other.name,
  x: other.pos.x,
  y: other.pos.y,
  my: other.my
}));</code></pre>
<p>This is diagnostic input, not proof that any particular nearby Creep caused the stall. Repeated observations are needed before changing traffic policy.</p>

<h2 id="path-options">Review path options without blaming the cache</h2>
<p><code>reusePath</code> can reduce repeated path work, but an accepted call plus no movement is not automatically a “bad cache” diagnosis. First rule out range, final same-tick intent, traffic, and call failures. If the route itself becomes invalid, inspect the path search branch and current obstacles instead of setting <code>reusePath: 0</code> everywhere.</p>
<p>For persistent path-search failure, continue with <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH</a>. For movement speed caused by fatigue and body design, use <a href="/en/blog/screeps-move-fatigue-body-ratio">the fatigue/body-ratio guide</a>.</p>

<h2 id="target-validation">Validate the target position</h2>
<pre><code class="language-javascript">function hasValidRoomPosition(target) {
  return Boolean(
    target
    && target.pos
    && Number.isInteger(target.pos.x)
    && target.pos.x >= 0
    && target.pos.x <= 49
    && Number.isInteger(target.pos.y)
    && target.pos.y >= 0
    && target.pos.y <= 49
    && typeof target.pos.roomName === 'string'
    && target.pos.roomName.length > 0
  );
}</code></pre>
<p>For a normal Screeps game object, <code>target.pos</code> already follows RoomPosition rules. This guard is useful when your own task system can pass stale, partial, or deserialized target descriptors.</p>

<h2 id="diagnostic">Use one bounded diagnostic record</h2>
<pre><code class="language-javascript">function debugMoveTo(creep, target, range = 1) {
  if (!creep || !hasValidRoomPosition(target)) {
    return { status: 'invalid-input' };
  }

  const before = getPositionKey(creep.pos);
  const result = creep.moveTo(target, {
    range,
    reusePath: 5
  });

  const observation = recordMovementObservation(
    creep,
    result
  );

  return {
    status: result === OK ? 'accepted' : 'call-failed',
    tick: Game.time,
    before,
    target: getPositionKey(target.pos),
    range: creep.pos.getRangeTo(target),
    requestedRange: range,
    fatigue: creep.fatigue,
    activeMove: creep.getActiveBodyparts(MOVE),
    result,
    previousPosition: observation.previousKey,
    previousTick: observation.previousTick
  };
}</code></pre>
<p>This record distinguishes current call failure from later-tick progress. It still does not prove why traffic resolution chose a particular outcome.</p>

<h2 id="production">Production adaptation</h2>
<p>A production movement manager should have one final owner for movement intent per Creep. Keep task selection separate from movement submission, record only bounded diagnostics, and define when a stationary Creep is expected because it already satisfies the role's range. Escalate to traffic/path replanning only after repeated later-tick evidence.</p>

<h2 id="not-this-guide">When this guide does not apply</h2>
<p>If the current result is not <code>OK</code>, follow that return code. If the original problem is an action returning <code>ERR_NOT_IN_RANGE</code>, use the <a href="/en/blog/screeps-err-not-in-range">action-range guide</a>. This page does not claim a live traffic reproduction, a path-cache benchmark, or a measured number of stalled ticks.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What does moveTo() returning OK prove?</h3>
<p>It proves that this call accepted a movement request. Verify later-tick position progress separately.</p>
<h3>Can a later movement call override it?</h3>
<p>Yes. The later movement method submitted by the same Creep in the tick has priority.</p>
<h3>Is ERR_TIRED part of an OK-but-not-moving case?</h3>
<p>No. If the method returns <code>ERR_TIRED</code>, diagnose fatigue as a call failure instead.</p>
<h3>What if the Creep has no MOVE part?</h3>
<p>The current API includes <code>ERR_NO_BODYPART</code> (<code>-12</code>) for that state. It is not an accepted-OK stall.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow noopener noreferrer">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/simultaneous-actions.html" rel="nofollow noopener noreferrer">Simultaneous actions and movement priority</a></li>
<li><a href="https://docs.screeps.com/api/#RoomPosition" rel="nofollow noopener noreferrer">API Reference: RoomPosition</a></li>
</ul>`,
  };
}

function patchCpu(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps CPU: getUsed(), limit, tickLimit, and bucket",
    headline: "How to Measure Screeps CPU Without Misreading getUsed() or the Bucket",
    description:
      "Measure Screeps CPU with bounded getUsed() deltas, distinguish limit from tickLimit and bucket, avoid Simulation zero-value inference, and make optional-work policy explicit.",
    category: "RUNTIME · CPU MEASUREMENT",
    readingTime: "15 min read",
    breadcrumbLabel: "Screeps CPU Measurement",
    tags: ["Screeps", "CPU", "Performance", "Debugging", "JavaScript"],
    keywords: [
      "Screeps CPU getUsed",
      "Screeps CPU bucket",
      "Game.cpu.limit",
      "Game.cpu.tickLimit",
    ],
    primaryKeyword: "Screeps CPU getUsed",
    searchIntent:
      "Measure a concrete Screeps code section and understand how getUsed, limit, tickLimit, and bucket differ",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — Game.cpu.getUsed(), limit, tickLimit, bucket, bucket ceiling, and Simulation behavior",
      "Passed — removed value-based environment detection; bounded section deltas and policy-vs-API boundaries reviewed",
      "No real-shard CPU sample set or multi-tick bucket trend was collected for this revision",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["four-values", "Keep the four CPU values separate"],
      ["getused", "Measure one section with getUsed()"],
      ["simulation", "Do not infer the environment from a zero reading"],
      ["sampling", "Sample at useful boundaries"],
      ["bucket", "Treat bucket thresholds as your policy"],
      ["bounded-history", "Keep diagnostics bounded"],
      ["production", "Production adaptation"],
      ["mistakes", "Common measurement mistakes"],
      ["scope", "What this guide does not prove"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What does Game.cpu.getUsed() return?",
        "It returns the CPU used by your code so far in the current tick. Subtract a before sample from an after sample to estimate the cost of a specific section.",
      ],
      [
        "Why does getUsed() return zero in Simulation?",
        "The official Simulation always reports 0. That is a one-way rule; a zero reading is not a reliable detector that proves you are in Simulation.",
      ],
      [
        "Is Game.cpu.limit the same as tickLimit?",
        "No. limit is the normal CPU limit assigned to the shard, while tickLimit is the maximum CPU currently available for that tick under the bucket system.",
      ],
      [
        "What bucket threshold should I use for optional work?",
        "There is no universal threshold in this guide. Choose a project policy from your own workload and measured trend, then document it as your policy rather than an official Screeps constant.",
      ],
    ],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Use <code>Game.cpu.getUsed()</code> as a cumulative current-tick meter. Sample immediately before and after the code you want to inspect, subtract the two values, and keep the surrounding <code>limit</code>, <code>tickLimit</code>, and <code>bucket</code> context. Do not use a zero <code>getUsed()</code> reading to guess which environment you are running in.</p>

<h2 id="four-values">Keep the four CPU values separate</h2>
<div class="table-scroll"><table>
<thead><tr><th>Value</th><th>What it tells you</th><th>What it does not tell you</th></tr></thead>
<tbody>
<tr><td><code>Game.cpu.getUsed()</code></td><td>Cumulative CPU used so far in the current tick</td><td>The cost of one section unless you subtract two samples</td></tr>
<tr><td><code>Game.cpu.limit</code></td><td>The normal CPU limit currently assigned to this shard</td><td>The exact amount every tick may consume before termination</td></tr>
<tr><td><code>Game.cpu.tickLimit</code></td><td>The maximum CPU currently available for this tick</td><td>A performance target you should try to consume</td></tr>
<tr><td><code>Game.cpu.bucket</code></td><td>Stored CPU credit used by the runtime's burst system</td><td>A direct measurement of one function's cost</td></tr>
</tbody></table></div>
<p>The bucket has an official upper bound of 10,000. That fact does not make a specific “run optional work below/above X” threshold official; any such threshold in your bot is policy.</p>

<h2 id="getused">Measure one section with getUsed()</h2>
<pre><code class="language-javascript">function measureCpu(label, fn) {
  const before = Game.cpu.getUsed();
  const value = fn();
  const after = Game.cpu.getUsed();

  return {
    label,
    value,
    before,
    after,
    used: Math.max(0, after - before)
  };
}</code></pre>
<p>Use it around a concrete unit of work:</p>
<pre><code class="language-javascript">const sample = measureCpu(
  'find-hostiles',
  () => room.find(FIND_HOSTILE_CREEPS)
);

if (Game.time % 50 === 0) {
  console.log(JSON.stringify({
    tick: Game.time,
    label: sample.label,
    used: sample.used,
    limit: Game.cpu.limit,
    tickLimit: Game.cpu.tickLimit,
    bucket: Game.cpu.bucket
  }));
}</code></pre>
<p>The measurement itself has overhead, and very small sections can be noisy. Compare repeated samples of the same boundary before changing architecture.</p>

<h2 id="simulation">Do not infer the environment from a zero reading</h2>
<p>The official API states that <code>Game.cpu.getUsed()</code> always returns <code>0</code> in Simulation. That rule only goes one direction:</p>
<pre><code class="language-text">Simulation -> getUsed() is 0

getUsed() is 0 -/-> therefore Simulation</code></pre>
<p>A tiny section outside Simulation can produce a zero-looking delta or values too small to support a useful conclusion. Know which environment you launched, then interpret the measurement. Do not write environment detection like this:</p>
<pre><code class="language-javascript">// Do not use this as an environment detector.
const inSimulation = Game.cpu.getUsed() === 0;</code></pre>

<h2 id="sampling">Sample at useful boundaries</h2>
<p>Instrument decisions, not every expression. Useful boundaries include path search, room scans, market processing, spawn planning, cache rebuilds, and optional visual/debug work.</p>
<pre><code class="language-javascript">function readCpuContext(label) {
  return {
    label,
    tick: Game.time,
    used: Game.cpu.getUsed(),
    limit: Game.cpu.limit,
    tickLimit: Game.cpu.tickLimit,
    bucket: Game.cpu.bucket
  };
}</code></pre>
<p>A start/end pair explains a section delta. A context snapshot explains the budget surrounding that sample. Neither proves that a different tick, room count, shard, or cache state will cost the same.</p>

<h2 id="bucket">Treat bucket thresholds as your policy</h2>
<p>The bucket exists so low-usage periods can support bursts. Your bot still needs a workload policy. For example:</p>
<pre><code class="language-javascript">const CPU_POLICY = {
  optionalWorkBucketFloor: 7000
};

function canRunOptionalWork() {
  return Game.cpu.bucket
    >= CPU_POLICY.optionalWorkBucketFloor;
}</code></pre>
<p><code>7000</code> is an example project threshold, not an official recommendation. A colony with different room count, market work, pathfinding, or visual output may need a different policy. Measure the trend before adopting a value.</p>
<p>For a full degraded-mode scheduler with hysteresis, use <a href="/en/blog/screeps-cpu-bucket-degradation">the CPU bucket degradation guide</a>.</p>

<h2 id="bounded-history">Keep diagnostics bounded</h2>
<p>If you persist samples, enforce a fixed window so diagnostics do not become an unbounded Memory cost:</p>
<pre><code class="language-javascript">function pushCpuSample(sample, limit = 20) {
  Memory.cpuSamples ??= [];
  Memory.cpuSamples.push(sample);

  if (Memory.cpuSamples.length > limit) {
    Memory.cpuSamples.splice(
      0,
      Memory.cpuSamples.length - limit
    );
  }
}</code></pre>
<p>Persist only what you need for later comparison. For high-frequency temporary profiling, a disposable global cache may be better because it avoids turning every sample into durable state.</p>

<h2 id="production">Production adaptation</h2>
<p>Measure with a purpose: identify an expensive decision, compare it under similar conditions, then remove or reduce instrumentation after the problem is understood. Keep critical colony work separate from optional reports, visuals, market scans, or background planning. A bucket policy should degrade optional work before correctness-critical tasks.</p>

<h2 id="mistakes">Common measurement mistakes</h2>
<ul>
<li>Reading <code>getUsed()</code> once and calling that number “the function cost.”</li>
<li>Using a zero sample as proof of the environment.</li>
<li>Comparing different workloads without recording room/tick context.</li>
<li>Treating <code>tickLimit</code> as a target instead of an upper runtime boundary.</li>
<li>Calling an arbitrary bucket threshold an official best practice.</li>
<li>Persisting an unlimited CPU history in Memory.</li>
<li>Claiming an optimization from static review without real before/after measurements.</li>
</ul>

<h2 id="scope">What this guide does not prove</h2>
<p>This revision has official-documentation review, syntax/build checks, and offline logic coverage. It does not contain a real shard CPU sample set, an observed bucket trend, or a benchmark showing that one implementation is faster than another. Those measurements remain environment work.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What does getUsed() measure?</h3>
<p>CPU consumed so far in the current tick. Use two samples to estimate a section delta.</p>
<h3>Does zero mean Simulation?</h3>
<p>No. Simulation always reports zero, but the inverse is not a documented environment test.</p>
<h3>Are limit and tickLimit the same?</h3>
<p>No. <code>limit</code> is the normal shard limit; <code>tickLimit</code> is the maximum currently available for that tick under bucket rules.</p>
<h3>What bucket floor should I use?</h3>
<p>Choose it from your own measured workload. A threshold in application code is project policy unless the official API explicitly defines it.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.cpu" rel="nofollow noopener noreferrer">API Reference: Game.cpu</a></li>
<li><a href="https://docs.screeps.com/api/#Game.cpu.getUsed" rel="nofollow noopener noreferrer">API Reference: Game.cpu.getUsed()</a></li>
<li><a href="https://docs.screeps.com/cpu-limit.html" rel="nofollow noopener noreferrer">CPU limit and bucket documentation</a></li>
</ul>`,
  };
}

function patchSpawn(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  return {
    ...article,
    title: "Screeps spawnCreep(): Spawn Your First Creep Safely",
    headline: "How to Spawn Your First Screeps Creep and Verify the Request Across Ticks",
    description:
      "Use StructureSpawn.spawnCreep() with a 200-Energy beginner body, check the complete return-code boundary, distinguish request acceptance from completed spawning, and adapt safely for production.",
    category: "BEGINNER · SPAWNING",
    readingTime: "13 min read",
    breadcrumbLabel: "spawnCreep() Beginner Guide",
    tags: ["Screeps", "Spawn", "Creep", "Beginner", "JavaScript"],
    keywords: [
      "Screeps spawnCreep",
      "Screeps spawn first creep",
      "StructureSpawn spawnCreep",
      "Screeps spawn return codes",
    ],
    primaryKeyword: "Screeps spawnCreep",
    searchIntent:
      "Submit and verify a first safe spawnCreep request without confusing OK with a fully spawned Creep",
    finalScore: 98,
    verification: verification(
      "Checked August 12, 2026 — StructureSpawn.spawnCreep(), dryRun, documented return codes, Spawn.spawning, Creep.spawning, and CREEP_SPAWN_TIME",
      "Passed — 200-Energy body cost, fixed-name beginner guard, request acceptance, and later completion boundary reviewed",
      "No live Worker1 spawn cycle or multi-tick spawning trace was observed for this revision",
    ),
    toc: [
      ["build", "What you will build"],
      ["before", "Before you start"],
      ["body-cost", "Use a body your room can afford"],
      ["minimal", "Minimal working example"],
      ["return-codes", "Read the return code"],
      ["tick-behavior", "OK is not the same as finished"],
      ["dry-run", "Use dryRun for diagnostics"],
      ["verify", "What to verify next"],
      ["production", "Production adaptation"],
      ["failures", "Common failures"],
      ["next", "Next lesson"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "What does spawnCreep() returning OK mean?",
        "The spawn request was accepted and the spawning process can begin. It does not mean the Creep has already completed all of its spawn time and can perform normal actions.",
      ],
      [
        "How much Energy does [WORK, CARRY, MOVE] cost?",
        "200 Energy: WORK costs 100, CARRY costs 50, and MOVE costs 50.",
      ],
      [
        "How long does a three-part Creep take to spawn?",
        "The official CREEP_SPAWN_TIME is 3 ticks per body part, so a three-part unmodified body requires 9 spawn ticks. Verify the live process through spawning state rather than fabricating a transcript.",
      ],
      [
        "Should a beginner use dryRun?",
        "It is useful for diagnostics because it checks the request without starting spawning. Production code still has to handle the real call result because conditions can change.",
      ],
    ],
    articleHtml: String.raw`
<h2 id="build">What you will build</h2>
<p>This lesson submits one <code>spawnCreep()</code> request for a fixed beginner Creep named <code>Worker1</code>. The body is <code>[WORK, CARRY, MOVE]</code>, which costs 200 Energy. You will check the method return code, then distinguish “request accepted” from “Creep finished spawning.”</p>

<h2 id="before">Before you start</h2>
<p>You need a Spawn you own and a room with enough currently available Energy for the selected body. This example expects <code>Game.spawns.Spawn1</code>; change the name if your Spawn has another name.</p>
<pre><code class="language-javascript">const spawn = Game.spawns.Spawn1;

if (!spawn) {
  console.log('Spawn1 was not found.');
}</code></pre>
<p>Do not call methods on an undefined Spawn. A missing object is a JavaScript problem before it is a Screeps API problem.</p>

<h2 id="body-cost">Use a body your room can afford</h2>
<p>The beginner body has three parts:</p>
<div class="table-scroll"><table>
<thead><tr><th>Part</th><th>Energy cost</th><th>Purpose here</th></tr></thead>
<tbody>
<tr><td><code>WORK</code></td><td>100</td><td>Harvest or perform WORK-based tasks later</td></tr>
<tr><td><code>CARRY</code></td><td>50</td><td>Carry Energy</td></tr>
<tr><td><code>MOVE</code></td><td>50</td><td>Move the Creep</td></tr>
</tbody></table></div>
<p>Total: <strong>200 Energy</strong>. This is a learning body, not a universal production design.</p>

<h2 id="minimal">Minimal working example</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;

  if (!spawn) {
    return;
  }

  if (Game.creeps.Worker1 || spawn.spawning) {
    return;
  }

  const result = spawn.spawnCreep(
    [WORK, CARRY, MOVE],
    'Worker1',
    {
      memory: {
        role: 'worker'
      }
    }
  );

  if (result !== OK) {
    console.log('spawnCreep() returned ' + result);
  }
};</code></pre>
<p>The fixed name makes the first request easy to understand. The guard prevents the loop from intentionally submitting the same fixed-name request while <code>Worker1</code> already exists or this Spawn is busy.</p>

<h2 id="return-codes">Read the return code</h2>
<p>The current official <code>spawnCreep()</code> return boundary includes:</p>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning</th><th>What to check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The request was accepted.</td><td>Observe spawning state on later ticks.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Spawn is not yours.</td><td>Select a player-owned Spawn.</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>The Creep name is already in use.</td><td>Use a unique name or recognize the existing Creep.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Spawn is already spawning.</td><td>Wait for <code>spawn.spawning</code> to clear.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>The room does not currently have enough available spawn Energy.</td><td>Reduce the body or wait for available Energy.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body, name, or request arguments are invalid.</td><td>Validate body constants and the name.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The room Controller level does not allow another Spawn operation under the relevant structure limit.</td><td>Check room ownership/RCL and Spawn availability.</td></tr>
</tbody></table></div>
<p>For a diagnostic page centered on the full return-code workflow, continue with <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return codes</a>. This beginner page stays focused on the first safe request.</p>

<h2 id="tick-behavior">OK is not the same as finished</h2>
<p>A successful call starts a process. Screeps uses <code>CREEP_SPAWN_TIME = 3</code> ticks per body part. A three-part body therefore has 9 ticks of spawn time.</p>
<pre><code class="language-javascript">if (spawn.spawning) {
  console.log(JSON.stringify({
    tick: Game.time,
    name: spawn.spawning.name,
    remainingTime: spawn.spawning.remainingTime,
    needTime: spawn.spawning.needTime
  }));
}</code></pre>
<p>Do not invent a completion tick from an article example. Read the current spawning state. When the Creep object is available, check its own <code>spawning</code> state before expecting normal actions.</p>

<h2 id="dry-run">Use dryRun for diagnostics</h2>
<p><code>dryRun: true</code> checks the request without starting the spawn process:</p>
<pre><code class="language-javascript">const check = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    dryRun: true,
    memory: { role: 'worker' }
  }
);

console.log('dryRun returned ' + check);</code></pre>
<p>A dry run is useful before a complex request, but it is not a reservation. State can change before the real call, so production code must still check the actual return code.</p>

<h2 id="verify">What to verify next</h2>
<p>After you run the example in a room you control, verify these observations yourself:</p>
<ul>
<li>The initial real request returns <code>OK</code>.</li>
<li><code>spawn.spawning</code> reports the active Creep name while the Spawn is busy.</li>
<li>The spawn process lasts according to the body-part timing shown by the live spawning object.</li>
<li>After spawning completes, <code>Worker1</code> is available for normal role logic and its initialized <code>memory.role</code> is readable.</li>
</ul>
<p>This editorial pass did not run that live sequence, so both Console and live multi-tick verification remain pending.</p>

<h2 id="production">Production adaptation</h2>
<p>The fixed name and fixed body are teaching constraints. A production spawn manager normally separates four decisions:</p>
<ol>
<li>How many Creeps of each role should exist?</li>
<li>Which body fits current Energy and the role's job?</li>
<li>Which unique name and initial Memory should be assigned?</li>
<li>Which Spawn should receive the request, and what should happen after each return code?</li>
</ol>
<p>Use <a href="/en/blog/screeps-dynamic-creep-body-energy">dynamic body sizing</a> when the body should scale with Energy, and keep queue/replacement logic out of this first-request example.</p>

<h2 id="failures">Common failures</h2>
<ul>
<li>Calling <code>spawnCreep()</code> on an undefined Spawn.</li>
<li>Ignoring <code>ERR_BUSY</code> and resubmitting while the Spawn is occupied.</li>
<li>Using the same fixed name without checking whether that Creep already exists.</li>
<li>Designing a body that costs more than current available spawn Energy.</li>
<li>Treating <code>OK</code> as “the Creep is already finished.”</li>
<li>Calling a dry run and assuming the later real request cannot fail.</li>
<li>Adding production queue complexity before the first API boundary is understood.</li>
</ul>

<h2 id="next">Next lesson</h2>
<p>Once one Creep can be spawned and identified safely, continue with <a href="/en/blog/screeps-memory-basics">Screeps Memory</a> to understand persistent role/state data, then use the dedicated return-code guide when you add production retry policy.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What does spawnCreep() returning OK mean?</h3>
<p>The request was accepted. Spawning still takes time; inspect <code>spawn.spawning</code> and later Creep state.</p>
<h3>How much does [WORK, CARRY, MOVE] cost?</h3>
<p>200 Energy: 100 + 50 + 50.</p>
<h3>How long does a three-part Creep take?</h3>
<p>With the official 3 ticks per body part constant, the body requires 9 spawn ticks. Use the live spawning object to observe the actual process.</p>
<h3>Is dryRun enough for production?</h3>
<p>No. It validates a request at that moment without spawning; the real call still needs its own return-code handling.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow noopener noreferrer">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawning" rel="nofollow noopener noreferrer">API Reference: StructureSpawn.spawning</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.spawning" rel="nofollow noopener noreferrer">API Reference: Creep.spawning</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow noopener noreferrer">API constants, including CREEP_SPAWN_TIME</a></li>
</ul>`,
  };
}

export function applyEnglishEditorialFinal20260812(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !FINAL_SLUGS.has(article.slug)) return article;

  switch (article.slug) {
    case "screeps-err-not-in-range":
      return patchErrNotInRange(article);
    case "screeps-moveto-not-moving":
      return patchMoveToNotMoving(article);
    case "screeps-cpu-getused-bucket":
      return patchCpu(article);
    case "screeps-spawn-creep":
      return patchSpawn(article);
    default:
      return article;
  }
}
