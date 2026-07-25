import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishMovementBatchFiveArticles = [
  {
    slug: "screeps-err-not-in-range",
    path: "/en/blog/screeps-err-not-in-range",
    chinesePath: "/blog/screeps-err-not-in-range",
    title: "Screeps ERR_NOT_IN_RANGE: Action Ranges and moveTo()",
    headline: "How to Fix ERR_NOT_IN_RANGE in Screeps",
    description:
      "Identify which action returned ERR_NOT_IN_RANGE, use its real range, save the moveTo() result separately, and retry the original action on a later tick instead of assuming movement is immediate.",
    category: "MOVEMENT · ACTION RANGE DEBUGGING",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "15 min read",
    breadcrumbLabel: "Fix ERR_NOT_IN_RANGE",
    tags: ["Screeps", "ERR_NOT_IN_RANGE", "moveTo", "Creep API", "Debugging"],
    keywords: [
      "Screeps ERR_NOT_IN_RANGE",
      "Screeps action range",
      "Creep moveTo after ERR_NOT_IN_RANGE",
      "upgradeController range 3",
      "Screeps move result debugging",
    ],
    primaryKeyword: "Screeps ERR_NOT_IN_RANGE",
    searchIntent: "Action-range diagnosis and correct move-then-retry pattern",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — Creep action ranges, moveTo(), game-loop timing"],
      ["Range boundary", "Range 1 and range 3 actions are handled separately"],
      ["Source correction", "Current moveTo() return table does not list ERR_NO_BODYPART"],
      ["JavaScript syntax", "Passed"],
      ["Offline branch review", "Passed — missing objects, range 1, range 3, movement and non-range errors"],
      ["Screeps Console test", "Pending"],
      ["Live movement and action retry", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["identify-method", "Identify which method returned -9"],
      ["range-table", "Common Creep action ranges"],
      ["move-then-retry", "Move now and retry on the next tick"],
      ["range-one-example", "Complete range-1 example"],
      ["range-three-example", "Complete range-3 example"],
      ["move-results", "Read the movement result separately"],
      ["already-in-range", "If the Creep is already in range"],
      ["source-correction", "Current moveTo() return-code correction"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does ERR_NOT_IN_RANGE mean the target is invalid?",
        "No. It means the target exists but the Creep is outside the distance required by that action. Other return codes describe target, resource, ownership, or body problems.",
      ],
      [
        "Should every action use moveTo(target, { range: 1 })?",
        "No. build(), repair(), upgradeController(), rangedAttack(), and rangedHeal() work at range 3. Moving closer than necessary can increase traffic pressure.",
      ],
      [
        "Can I call moveTo() and then repeat the action in the same tick?",
        "The second action still sees the position from the current tick. Submit movement, return, and let the next loop retry the original action.",
      ],
      [
        "Does moveTo() return ERR_NO_BODYPART when MOVE is unavailable?",
        "The current official moveTo() return table does not list that code. Precheck getActiveBodyparts(MOVE), and log the actual result returned by the server.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-recycle-creep",
      label: "Previous lifecycle guide",
      title: "Recycle a Creep Safely",
    },
    next: {
      href: "/en/blog/screeps-moveto-not-moving",
      label: "Next movement guide",
      title: "Diagnose moveTo() OK Without Movement",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>ERR_NOT_IN_RANGE</code> is <code>-9</code>. For a Creep action, it means the target exists but the Creep is outside that method's required distance. Save the action result, call <code>moveTo()</code> only when the result is exactly <code>ERR_NOT_IN_RANGE</code>, use the action's real range, save the movement result separately, return from the branch, and retry the original action on a later tick.</p>

<h2 id="identify-method">Identify which method returned -9</h2>
<p>Do not log only a bare number:</p>
<pre><code class="language-javascript">const harvestResult = creep.harvest(source);

console.log(JSON.stringify({
  method: 'harvest',
  creepName: creep.name,
  targetId: source.id,
  harvestResult
}));</code></pre>
<p>The same constant can be returned by many Creep actions, but the valid distance and other prerequisites differ. A structure method that returns a range-related error cannot solve it by calling <code>moveTo()</code> on the structure.</p>

<h2 id="range-table">Common Creep action ranges</h2>
<div class="table-scroll"><table>
<thead><tr><th>Action</th><th>Usable distance</th><th>Suggested movement range</th></tr></thead>
<tbody>
<tr><td><code>harvest()</code></td><td>Adjacent</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>withdraw()</code></td><td>Adjacent</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>transfer()</code></td><td>Adjacent</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>pickup()</code></td><td>Same tile or adjacent</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>attack()</code> and <code>heal()</code></td><td>Range 1</td><td><code>{ range: 1 }</code></td></tr>
<tr><td><code>build()</code>, <code>repair()</code>, and <code>upgradeController()</code></td><td>Range 3</td><td><code>{ range: 3 }</code></td></tr>
<tr><td><code>rangedAttack()</code> and <code>rangedHeal()</code></td><td>Range 3</td><td><code>{ range: 3 }</code></td></tr>
</tbody></table></div>
<p>The <code>range</code> option tells pathfinding where it may stop. It does not change the original action's rules. Using range 1 for an upgrader can work, but it sends the Creep closer than necessary and may crowd the Controller area.</p>

<h2 id="move-then-retry">Move now and retry on the next tick</h2>
<pre><code class="language-text">Current tick:
call action
→ ERR_NOT_IN_RANGE
→ submit moveTo()
→ return

Later tick:
read the new position
→ call the action again</code></pre>
<p>Screeps scripts read the game state for the current tick. Calling <code>moveTo()</code> does not change <code>creep.pos</code> during the same JavaScript execution:</p>
<pre><code class="language-javascript">creep.moveTo(source);
creep.harvest(source);</code></pre>
<p>The second line still checks the old position. A clear loop attempts the action first, submits movement only for <code>ERR_NOT_IN_RANGE</code>, and lets the next tick retry.</p>

<h2 id="range-one-example">Complete range-1 example</h2>
<p><strong>State impact:</strong> this script may submit one harvest action or one movement order for <code>Harvester1</code>. It does not write Memory.</p>
<pre><code class="language-javascript">function moveForAction(
  creep,
  target,
  desiredRange,
  label
) {
  if (creep.getActiveBodyparts(MOVE) <= 0) {
    return {
      status: 'no-active-move-part'
    };
  }

  const moveResult = creep.moveTo(target, {
    range: desiredRange,
    reusePath: 10
  });

  if (
    moveResult !== OK
    && moveResult !== ERR_TIRED
  ) {
    console.log(JSON.stringify({
      type: 'movement-failed',
      creepName: creep.name,
      label,
      moveResult
    }));
  }

  return {
    status: moveResult === OK
      ? 'move-submitted'
      : 'move-not-submitted',
    moveResult
  };
}

function runHarvester(creep) {
  if (!creep || creep.spawning) {
    return {
      status: 'creep-unavailable'
    };
  }

  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );

  if (!source) {
    return {
      status: 'active-source-not-found'
    };
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    return {
      harvestResult,
      ...moveForAction(
        creep,
        source,
        1,
        'Source'
      )
    };
  }

  if (harvestResult !== OK) {
    console.log(JSON.stringify({
      type: 'harvest-failed',
      creepName: creep.name,
      sourceId: source.id,
      harvestResult
    }));
  }

  return {
    status: harvestResult === OK
      ? 'harvest-submitted'
      : 'harvest-failed',
    harvestResult
  };
}

module.exports.loop = function () {
  runHarvester(Game.creeps.Harvester1);
};</code></pre>
<p>The action and movement results remain separate. A pathfinding problem is not misreported as a harvesting problem.</p>

<h2 id="range-three-example">Complete range-3 example</h2>
<pre><code class="language-javascript">function runUpgrader(creep) {
  if (!creep || creep.spawning) {
    return {
      status: 'creep-unavailable'
    };
  }

  const controller = creep.room.controller;

  if (!controller || controller.my !== true) {
    return {
      status: 'owned-controller-not-found'
    };
  }

  const upgradeResult =
    creep.upgradeController(controller);

  if (upgradeResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 3,
      reusePath: 10
    });

    return {
      status: moveResult === OK
        ? 'move-submitted'
        : 'move-not-submitted',
      upgradeResult,
      moveResult
    };
  }

  return {
    status: upgradeResult === OK
      ? 'upgrade-submitted'
      : 'upgrade-failed',
    upgradeResult
  };
}</code></pre>
<p>The same movement range applies to normal building and repair actions. Keep their resource, ownership, and body checks separate.</p>

<h2 id="move-results">Read the movement result separately</h2>
<div class="table-scroll"><table>
<thead><tr><th><code>moveTo()</code> result</th><th>Meaning</th><th>Next step</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The movement order was scheduled.</td><td>Read position on a later tick.</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>The Creep has fatigue.</td><td>Wait and inspect load, terrain, and MOVE ratio.</td></tr>
<tr><td><code>ERR_NO_PATH</code></td><td>No route to the requested range was found.</td><td>Inspect range, obstacles, callbacks, and route limits.</td></tr>
<tr><td><code>ERR_NOT_FOUND</code></td><td><code>noPathFinding</code> was used without a reusable cached path.</td><td>Allow a fresh path search.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The movement target is invalid.</td><td>Validate the target and its position.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning finishes.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep is not yours.</td><td>Validate the selected object.</td></tr>
</tbody></table></div>
<p><code>OK</code> does not prove that the Creep arrived or even changed position after tick processing. Continue with <a href="/en/blog/screeps-moveto-not-moving">the moveTo() OK diagnostic guide</a> when several later ticks show no progress.</p>

<h2 id="already-in-range">If the Creep is already in range</h2>
<pre><code class="language-javascript">const currentRange = creep.pos.getRangeTo(target);
const adjacent = creep.pos.isNearTo(target);
const withinRangeThree = creep.pos.inRangeTo(
  target,
  3
);</code></pre>
<p>When the required range is already satisfied but the action still fails, more movement is not the solution. Inspect active body parts, carried resources, target capacity, target type, ownership, spawning state, or the method's other documented return codes.</p>

<h2 id="source-correction">Current moveTo() return-code correction</h2>
<p>The Chinese source listed <code>ERR_NO_BODYPART</code> as a possible <code>moveTo()</code> result. The current official <code>Creep.moveTo()</code> return table does not list that code. This English article still checks <code>creep.getActiveBodyparts(MOVE)</code> because a Creep without an active MOVE part cannot make normal movement progress, but it does not attribute an undocumented return value to <code>moveTo()</code>.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Record the exact action method and its return value.</li>
<li>Validate the Creep and target before calling either method.</li>
<li>Use range 1 or range 3 according to the real action.</li>
<li>Enter the movement branch only for <code>ERR_NOT_IN_RANGE</code>.</li>
<li>Save <code>actionResult</code> and <code>moveResult</code> separately.</li>
<li>Return after scheduling movement.</li>
<li>Retry the original action on a later tick.</li>
<li>Precheck active MOVE parts without inventing a moveTo() return code.</li>
<li>Do not keep moving when another prerequisite is failing.</li>
<li>Use <a href="/en/screeps-errors">the English error-code reference</a> for shared constants.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not design CostMatrix rules, cross-room routing, traffic coordination, path caches, or a global movement scheduler. Continue with <a href="/en/blog/screeps-moveto-not-moving">diagnosing a movement order that returns OK but shows no progress</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does -9 mean the target is invalid?</h3>
<p>No. It means the Creep is outside the action's required distance.</p>
<h3>Should every action stop at range 1?</h3>
<p>No. Building, repair, Controller upgrading, ranged attacks, and ranged healing work at range 3.</p>
<h3>Can movement and the action finish in one script execution?</h3>
<p>The later action still reads the current tick's old position. Retry on a later tick.</p>
<h3>Does moveTo() return ERR_NO_BODYPART?</h3>
<p>The current official return table does not list it. Check active MOVE parts separately.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">API Reference: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow">API Reference: Creep.upgradeController()</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game loop</a></li>
<li><a href="https://docs.screeps.com/debugging.html" rel="nofollow">Screeps Documentation: Debugging</a></li>
</ul>`,
  },
  {
    slug: "screeps-moveto-not-moving",
    path: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
    title: "Screeps moveTo() Returns OK but the Creep Does Not Move",
    headline: "Why moveTo() Returns OK but Your Screeps Creep Does Not Move",
    description:
      "Distinguish an accepted movement order from later position change, validate the target and active MOVE parts, inspect fatigue and range, track roomName:x:y across ticks, and diagnose traffic, cached paths, and overwritten movement orders.",
    category: "MOVEMENT · NO-PROGRESS DEBUGGING",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    breadcrumbLabel: "moveTo OK but No Movement",
    tags: ["Screeps", "moveTo", "Fatigue", "Path Cache", "Traffic"],
    keywords: [
      "Screeps moveTo OK not moving",
      "Screeps Creep stuck",
      "Creep fatigue movement",
      "moveTo reusePath debugging",
      "Screeps movement overwritten",
    ],
    primaryKeyword: "Screeps moveTo OK not moving",
    searchIntent: "Multi-tick movement progress diagnosis after moveTo returned OK",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — moveTo(), fatigue, active body parts and simultaneous actions"],
      ["Timing boundary", "OK schedules movement; position must be checked on a later tick"],
      ["Source correction", "Current moveTo() return table does not list ERR_NO_BODYPART"],
      ["JavaScript syntax", "Passed"],
      ["Offline progress review", "Passed — target, spawning, MOVE, fatigue, range, result and unchanged-position states"],
      ["Screeps Console test", "Pending"],
      ["Live traffic and path-cache test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["two-problems", "Separate call failure from later no progress"],
      ["target", "Validate the target position"],
      ["movement-ability", "Check spawning, active MOVE parts and fatigue"],
      ["desired-range", "Stop when the desired range is already reached"],
      ["track-position", "Track roomName:x:y across ticks"],
      ["complete-example", "Complete multi-tick movement diagnostic"],
      ["why-ok-stalls", "Why an OK order can still show no progress"],
      ["no-path-distinction", "ERR_NO_PATH is a different problem"],
      ["source-correction", "Current moveTo() return-code correction"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does moveTo() returning OK mean creep.pos has changed?",
        "No. It means the movement order was accepted. Read the position on a later tick to verify progress.",
      ],
      [
        "Why can a Creep remain still after an OK movement order?",
        "Temporary traffic, a later movement call in the same tick, fatigue timing, a stale cached path, room-edge behavior, or another action conflict can prevent visible progress.",
      ],
      [
        "Should I set reusePath: 0 for every Creep?",
        "No. That can increase CPU use. This guide uses it temporarily after repeated unchanged positions to test whether a cached path is involved.",
      ],
      [
        "Is temporary traffic the same as ERR_NO_PATH?",
        "No. Pathfinding can find a route and return OK, but the intended next tile may be occupied during resolution. ERR_NO_PATH means the path search itself did not find a route.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-err-not-in-range",
      label: "Previous movement guide",
      title: "Fix ERR_NOT_IN_RANGE",
    },
    next: {
      href: "/en/blog/screeps-err-no-path",
      label: "Next movement guide",
      title: "Debug ERR_NO_PATH",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>creep.moveTo(target)</code> returning <code>OK</code> means the movement order was scheduled. It does not mean <code>creep.pos</code> changed during the current script or that the Creep will definitely enter the intended tile after resolution. Validate the target, spawning state, active MOVE parts, fatigue, and desired range; then record <code>roomName:x:y</code> over several ticks to distinguish a call error from accepted movement with no progress.</p>

<h2 id="two-problems">Separate call failure from later no progress</h2>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>Primary investigation</th></tr></thead>
<tbody>
<tr><td><code>moveTo()</code> returns an error</td><td>Target, ownership, spawning, fatigue, cached path, or pathfinding result.</td></tr>
<tr><td><code>moveTo()</code> returns <code>OK</code>, but later positions are unchanged</td><td>Traffic, later movement calls, cached-route suitability, room edges, or movement timing.</td></tr>
</tbody></table></div>
<p>Do not collapse both cases into “the Creep is stuck.” Save the current return value and compare positions from later ticks.</p>

<h2 id="target">Validate the target position</h2>
<pre><code class="language-javascript">function hasValidPosition(target) {
  return Boolean(
    target
    && target.pos
    && Number.isInteger(target.pos.x)
    && Number.isInteger(target.pos.y)
    && typeof target.pos.roomName === 'string'
    && target.pos.roomName.length > 0
  );
}</code></pre>
<p>A deleted Flag, stale Memory ID, <code>Game.getObjectById()</code> returning <code>null</code>, or malformed coordinate object can make the target invalid. Review <a href="/en/blog/screeps-get-object-by-id">safe target restoration</a> for saved IDs.</p>

<h2 id="movement-ability">Check spawning, active MOVE parts and fatigue</h2>
<pre><code class="language-javascript">if (creep.spawning) {
  return {
    status: 'creep-spawning'
  };
}

const activeMoveParts =
  creep.getActiveBodyparts(MOVE);

if (activeMoveParts <= 0) {
  return {
    status: 'no-active-move-part'
  };
}

if (creep.fatigue > 0) {
  return {
    status: 'creep-tired',
    fatigue: creep.fatigue
  };
}</code></pre>
<p>A MOVE part in the original body does not prove that an active MOVE part remains after damage. Fatigue is reduced on later ticks by active MOVE parts, and ordinary movement cannot proceed while fatigue is positive.</p>

<h2 id="desired-range">Stop when the desired range is already reached</h2>
<pre><code class="language-javascript">if (
  creep.pos.roomName === target.pos.roomName
  && creep.pos.inRangeTo(target, desiredRange)
) {
  return {
    status: 'already-in-range'
  };
}</code></pre>
<p>A Creep that is already within range 3 of a Controller should stop moving and perform the work action. Using range 0 for an occupied Source, Controller, Construction Site, or most Structures asks for an impossible destination tile.</p>

<h2 id="track-position">Track roomName:x:y across ticks</h2>
<pre><code class="language-javascript">function getPositionKey(pos) {
  return [
    pos.roomName,
    pos.x,
    pos.y
  ].join(':');
}</code></pre>
<p>Saving only <code>x</code> and <code>y</code> can misclassify movement across a room border. Store the room name as part of the position key. Compare the current key with the previous tick's key, not with a position read later in the same execution.</p>

<h2 id="complete-example">Complete multi-tick movement diagnostic</h2>
<p><strong>State impact:</strong> this script writes a bounded diagnostic record to <code>creep.memory.moveDiagnostic</code>, may submit one movement order, and temporarily disables path reuse after repeated unchanged positions.</p>
<pre><code class="language-javascript">function hasValidPosition(target) {
  return Boolean(
    target
    && target.pos
    && Number.isInteger(target.pos.x)
    && Number.isInteger(target.pos.y)
    && typeof target.pos.roomName === 'string'
  );
}

function getPositionKey(pos) {
  return [
    pos.roomName,
    pos.x,
    pos.y
  ].join(':');
}

function runMoveDiagnostic(
  creep,
  target,
  desiredRange
) {
  if (!creep) {
    return {
      status: 'creep-missing'
    };
  }

  if (!hasValidPosition(target)) {
    return {
      status: 'target-invalid'
    };
  }

  if (creep.spawning) {
    return {
      status: 'creep-spawning'
    };
  }

  const activeMoveParts =
    creep.getActiveBodyparts(MOVE);

  if (activeMoveParts <= 0) {
    return {
      status: 'no-active-move-part'
    };
  }

  if (
    !Number.isInteger(desiredRange)
    || desiredRange < 0
  ) {
    return {
      status: 'range-invalid'
    };
  }

  const sameRoom =
    creep.pos.roomName === target.pos.roomName;
  const currentRange = sameRoom
    ? creep.pos.getRangeTo(target)
    : null;

  if (
    currentRange !== null
    && currentRange <= desiredRange
  ) {
    return {
      status: 'already-in-range',
      currentRange
    };
  }

  const positionBefore = getPositionKey(creep.pos);
  const previous = creep.memory.moveDiagnostic;
  const unchangedTicks =
    previous?.position === positionBefore
      ? (previous.unchangedTicks ?? 0) + 1
      : 0;
  const reusePath = unchangedTicks >= 2 ? 0 : 5;

  const moveResult = creep.moveTo(target, {
    range: desiredRange,
    reusePath,
    visualizePathStyle: {
      stroke: '#ffcc00',
      opacity: 0.55
    }
  });

  creep.memory.moveDiagnostic = {
    targetRoom: target.pos.roomName,
    targetX: target.pos.x,
    targetY: target.pos.y,
    desiredRange,
    position: positionBefore,
    unchangedTicks,
    fatigue: creep.fatigue,
    activeMoveParts,
    moveResult,
    reusePath,
    checkedAt: Game.time
  };

  return {
    status: moveResult === OK
      ? 'move-submitted'
      : 'move-failed',
    moveResult,
    positionBefore,
    unchangedTicks,
    fatigue: creep.fatigue,
    activeMoveParts,
    reusePath
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.WorkTarget;
  const outcome = runMoveDiagnostic(
    creep,
    target,
    1
  );

  if (
    outcome.status === 'move-failed'
    || outcome.unchangedTicks >= 3
  ) {
    console.log(JSON.stringify({
      type: 'move-diagnostic',
      creepName: creep?.name ?? null,
      ...outcome
    }));
  }
};</code></pre>
<p><code>reusePath: 0</code> is used only after repeated no-progress observations. Setting it for every Creep on every tick can increase CPU use.</p>

<h2 id="why-ok-stalls">Why an OK order can still show no progress</h2>
<h3>A later movement call overwrote the first one</h3>
<p>When the same Creep receives multiple movement calls in one tick, the later movement action takes precedence. Use one movement decision point rather than letting role, traffic, combat, and border modules all submit movement independently.</p>
<h3>Another Creep occupied the intended tile</h3>
<p>Pathfinding can produce a route, but temporary traffic can prevent entry during action resolution. This is a coordination problem, not proof that no route exists.</p>
<h3>The cached path no longer fits</h3>
<p>The default path reuse can lag behind changing traffic, construction, or target positions. Temporarily forcing a new search helps test that hypothesis.</p>
<h3>The Creep is crossing a room edge</h3>
<p>Track the room name with the coordinates. Edge transitions can look stationary when diagnostics compare only local <code>x</code> and <code>y</code>.</p>
<h3>The body and terrain create slow movement</h3>
<p>Load, swamp terrain, roads, and MOVE ratio affect fatigue generation and recovery. A Creep may move only on some ticks even though the logic submits movement repeatedly.</p>

<h2 id="no-path-distinction">ERR_NO_PATH is a different problem</h2>
<p><code>ERR_NO_PATH</code> means the movement call could not find a route to the requested range. An <code>OK</code> order followed by temporary blockage is different. <code>ERR_NOT_FOUND</code> with <code>noPathFinding: true</code> means there was no reusable cached path. Continue with <a href="/en/blog/screeps-err-no-path">the dedicated pathfinding guide</a>.</p>

<h2 id="source-correction">Current moveTo() return-code correction</h2>
<p>The Chinese source listed <code>ERR_NO_BODYPART</code> as a <code>moveTo()</code> return. The current official return table does not list it. This English version checks active MOVE parts as a movement capability prerequisite and logs the server's actual <code>moveTo()</code> result without attributing an undocumented code to the method.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Validate the Creep and target position.</li>
<li>Wait until spawning finishes.</li>
<li>Check <code>getActiveBodyparts(MOVE)</code>, not only the original body array.</li>
<li>Record fatigue.</li>
<li>Stop when the desired range is already reached.</li>
<li>Record <code>roomName:x:y</code> over several ticks.</li>
<li>Save the real <code>moveTo()</code> result.</li>
<li>Temporarily disable path reuse only after repeated unchanged positions.</li>
<li>Ensure one module makes the final movement decision.</li>
<li>Separate traffic blockage from <code>ERR_NO_PATH</code>.</li>
<li>Do not claim that <code>OK</code> proves position change.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This diagnostic does not implement traffic reservations, swapping, pull trains, cross-room route caches, combat kiting, or a colony-wide movement scheduler. Continue with <a href="/en/blog/screeps-err-no-path">ERR_NO_PATH diagnosis</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does OK mean the Creep already moved?</h3>
<p>No. It means the order was scheduled. Verify a later tick.</p>
<h3>Why can position remain unchanged?</h3>
<p>Traffic, later movement calls, fatigue timing, stale paths, borders, or slow terrain movement can prevent visible progress.</p>
<h3>Should reusePath always be zero?</h3>
<p>No. Use that setting temporarily for diagnosis because repeated path searches can cost more CPU.</p>
<h3>Is traffic blockage ERR_NO_PATH?</h3>
<p>Not necessarily. A route can exist and the order can return OK while another unit temporarily blocks the next tile.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.fatigue" rel="nofollow">API Reference: Creep.fatigue</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: movement and fatigue</a></li>
<li><a href="https://docs.screeps.com/simultaneous-actions.html" rel="nofollow">Screeps Documentation: simultaneous actions</a></li>
<li><a href="https://docs.screeps.com/debugging.html" rel="nofollow">Screeps Documentation: debugging movement</a></li>
</ul>`,
  },
  {
    slug: "screeps-err-no-path",
    path: "/en/blog/screeps-err-no-path",
    chinesePath: "/blog/screeps-err-no-path",
    title: "Screeps ERR_NO_PATH: Range, CostMatrix and Room Routes",
    headline: "How to Debug ERR_NO_PATH in Screeps",
    description:
      "Distinguish ERR_NO_PATH, ERR_NOT_FOUND and PathFinder incomplete results; validate target range; correct CostMatrix walkability; inspect callbacks, maxOps, maxRooms and cross-room routes; and separate temporary traffic from a failed search.",
    category: "MOVEMENT · PATHFINDING DEBUGGING",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "18 min read",
    breadcrumbLabel: "Debug ERR_NO_PATH",
    tags: ["Screeps", "ERR_NO_PATH", "PathFinder", "CostMatrix", "Room Routes"],
    keywords: [
      "Screeps ERR_NO_PATH",
      "Screeps PathFinder incomplete",
      "CostMatrix 255 Screeps",
      "roomCallback false Screeps",
      "Game.map.findRoute ERR_NO_PATH",
    ],
    primaryKeyword: "Screeps ERR_NO_PATH",
    searchIntent: "Path search, callback and cross-room route diagnosis",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — moveTo(), PathFinder, CostMatrix and map routes"],
      ["Result distinction", "ERR_NO_PATH, cached-path ERR_NOT_FOUND and incomplete searches are separated"],
      ["Source correction", "Owned or public Ramparts remain walkable in the diagnostic CostMatrix"],
      ["JavaScript syntax", "Passed"],
      ["Offline path classification", "Passed — target, range, reached, callback, cached path, no path and incomplete states"],
      ["Screeps Console test", "Pending"],
      ["Live terrain, callback and cross-room route test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["three-results", "Separate three similar path results"],
      ["target-range", "Validate the target and desired range"],
      ["empty-path", "An empty path is not always an error"],
      ["pathfinder-result", "Read the complete PathFinder result"],
      ["classification", "Classify the path result"],
      ["cost-matrix", "Build a correct diagnostic CostMatrix"],
      ["complete-example", "Complete same-room diagnostic"],
      ["callbacks", "Check room callbacks and search limits"],
      ["cross-room", "Check the room-level route"],
      ["cached-path", "Handle noPathFinding correctly"],
      ["traffic", "Temporary traffic is usually not ERR_NO_PATH"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Is an empty findPathTo() array always ERR_NO_PATH?",
        "No. The Creep may already be within the requested range. Check inRangeTo() before treating an empty path as a failure.",
      ],
      [
        "Does a non-empty PathFinder path prove the target is reachable?",
        "No. When incomplete is true, the returned path may be only a partial route.",
      ],
      [
        "What does returning false from roomCallback mean?",
        "It rejects that room from the search. Returning undefined allows default terrain handling for a room without a custom matrix.",
      ],
      [
        "Should my own private Ramparts be marked 255?",
        "No. Your Creeps can pass your own Ramparts. A diagnostic matrix should allow owned Ramparts and public Ramparts unless the task intentionally applies a stricter rule.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-moveto-not-moving",
      label: "Previous movement guide",
      title: "Diagnose moveTo() OK Without Movement",
    },
    next: null,
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>ERR_NO_PATH</code> is <code>-2</code>. For <code>creep.moveTo()</code>, it means the current path search did not find a route to the requested target range. First validate the target and range, then distinguish it from <code>ERR_NOT_FOUND</code> caused by <code>noPathFinding: true</code> without a cached path and from <code>PathFinder.search().incomplete === true</code>. Inspect CostMatrix blockers, room callbacks, search limits, and the room-level route before increasing CPU limits blindly.</p>

<h2 id="three-results">Separate three similar path results</h2>
<pre><code class="language-text">moveTo() → ERR_NO_PATH
The current path search did not find a route.

moveTo({ noPathFinding: true }) → ERR_NOT_FOUND
No reusable cached path was available.

PathFinder.search() → incomplete: true
The search ended without completely reaching the goal range.</code></pre>
<p>These states need different logs and recovery policies. “Try pathfinding again” is not enough when a callback has rejected the only room or the requested range is impossible.</p>

<h2 id="target-range">Validate the target and desired range</h2>
<pre><code class="language-javascript">function validatePathRequest(
  target,
  desiredRange
) {
  if (!target?.pos) {
    return {
      valid: false,
      reason: 'target-invalid'
    };
  }

  if (
    !Number.isInteger(desiredRange)
    || desiredRange < 0
  ) {
    return {
      valid: false,
      reason: 'range-invalid'
    };
  }

  return {
    valid: true,
    reason: 'ready'
  };
}</code></pre>
<p>A Source, Controller, Construction Site, and most Structures occupy a tile that a Creep cannot enter. Asking for <code>range: 0</code> can make the goal impossible. Use range 1 for adjacent actions and range 3 for build, repair, or Controller upgrading.</p>

<h2 id="empty-path">An empty path is not always an error</h2>
<pre><code class="language-javascript">const alreadyInRange = creep.pos.inRangeTo(
  target,
  desiredRange
);
const path = creep.pos.findPathTo(target, {
  range: desiredRange
});

if (path.length === 0 && !alreadyInRange) {
  console.log('No path while outside range.');
}</code></pre>
<p>An empty array can mean no movement is needed because the Creep already satisfies the range. Always pair path length with the current range.</p>

<h2 id="pathfinder-result">Read the complete PathFinder result</h2>
<pre><code class="language-javascript">const search = PathFinder.search(
  creep.pos,
  {
    pos: target.pos,
    range: desiredRange
  }
);

console.log(JSON.stringify({
  pathLength: search.path.length,
  ops: search.ops,
  cost: search.cost,
  incomplete: search.incomplete
}));</code></pre>
<p>A non-empty <code>search.path</code> does not prove the target range was reached. When <code>incomplete</code> is true, the path can be only the best partial route found before the search stopped.</p>

<h2 id="classification">Classify the path result</h2>
<pre><code class="language-javascript">function classifyPathResult(input) {
  const {
    targetExists,
    targetHasPosition,
    desiredRange,
    alreadyInRange,
    moveResult,
    pathLength,
    pathIncomplete,
    callbackRejectedRoom
  } = input;

  if (!targetExists || !targetHasPosition) {
    return {
      usable: false,
      reason: 'target-invalid'
    };
  }

  if (
    !Number.isInteger(desiredRange)
    || desiredRange < 0
  ) {
    return {
      usable: false,
      reason: 'range-invalid'
    };
  }

  if (alreadyInRange) {
    return {
      usable: true,
      reason: 'already-in-range'
    };
  }

  if (callbackRejectedRoom) {
    return {
      usable: false,
      reason: 'callback-rejected-room'
    };
  }

  if (moveResult === ERR_NOT_FOUND) {
    return {
      usable: false,
      reason: 'cached-path-missing'
    };
  }

  if (moveResult === ERR_NO_PATH) {
    return {
      usable: false,
      reason: 'move-no-path'
    };
  }

  if (pathIncomplete === true) {
    return {
      usable: false,
      reason: 'pathfinder-incomplete'
    };
  }

  if (
    !Number.isInteger(pathLength)
    || pathLength <= 0
  ) {
    return {
      usable: false,
      reason: 'path-empty-out-of-range'
    };
  }

  return {
    usable: true,
    reason: 'path-available'
  };
}</code></pre>

<h2 id="cost-matrix">Build a correct diagnostic CostMatrix</h2>
<pre><code class="language-javascript">function buildDiagnosticMatrix(room) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (
      structure.structureType === STRUCTURE_ROAD
    ) {
      costs.set(
        structure.pos.x,
        structure.pos.y,
        1
      );
      continue;
    }

    const isWalkableRampart =
      structure.structureType === STRUCTURE_RAMPART
      && (
        structure.my === true
        || structure.isPublic === true
      );
    const isWalkableStructure =
      structure.structureType === STRUCTURE_CONTAINER
      || isWalkableRampart;

    if (!isWalkableStructure) {
      costs.set(
        structure.pos.x,
        structure.pos.y,
        255
      );
    }
  }

  return costs;
}</code></pre>
<p>Low values are preferred, and 255 is unwalkable. The Chinese source's condition blocked owned private Ramparts because it required both ownership and public status. Your Creeps can move through your own Ramparts, so this corrected diagnostic allows a Rampart when it is owned or public.</p>

<h2 id="complete-example">Complete same-room diagnostic</h2>
<p><strong>State impact:</strong> this example performs a PathFinder search and may submit one movement order. It uses <code>reusePath: 0</code> and a visual path only for diagnosis.</p>
<pre><code class="language-javascript">function buildDiagnosticMatrix(room) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (structure.structureType === STRUCTURE_ROAD) {
      costs.set(
        structure.pos.x,
        structure.pos.y,
        1
      );
      continue;
    }

    const walkableRampart =
      structure.structureType === STRUCTURE_RAMPART
      && (structure.my || structure.isPublic);

    if (
      structure.structureType !== STRUCTURE_CONTAINER
      && !walkableRampart
    ) {
      costs.set(
        structure.pos.x,
        structure.pos.y,
        255
      );
    }
  }

  return costs;
}

function diagnosePath(
  creep,
  target,
  desiredRange
) {
  if (!creep || !target?.pos) {
    return {
      status: 'object-invalid'
    };
  }

  if (
    !Number.isInteger(desiredRange)
    || desiredRange < 0
  ) {
    return {
      status: 'range-invalid'
    };
  }

  if (
    creep.pos.roomName === target.pos.roomName
    && creep.pos.inRangeTo(target, desiredRange)
  ) {
    return {
      status: 'already-in-range'
    };
  }

  const search = PathFinder.search(
    creep.pos,
    {
      pos: target.pos,
      range: desiredRange
    },
    {
      maxOps: 4000,
      maxRooms: 1,
      plainCost: 2,
      swampCost: 10,
      roomCallback(roomName) {
        const room = Game.rooms[roomName];

        if (!room) {
          return undefined;
        }

        return buildDiagnosticMatrix(room);
      }
    }
  );

  const moveResult = creep.moveTo(target, {
    range: desiredRange,
    reusePath: 0,
    maxOps: 4000,
    visualizePathStyle: {
      stroke: search.incomplete
        ? '#ff4444'
        : '#00ff88',
      opacity: 0.65
    }
  });

  return {
    status: search.incomplete
      ? 'pathfinder-incomplete'
      : moveResult === OK
        ? 'move-submitted'
        : 'move-failed',
    moveResult,
    pathLength: search.path.length,
    incomplete: search.incomplete,
    ops: search.ops,
    cost: search.cost
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.WorkTarget;
  const outcome = diagnosePath(
    creep,
    target,
    1
  );

  if (outcome.status !== 'move-submitted') {
    console.log(JSON.stringify({
      type: 'path-diagnostic',
      creepName: creep?.name ?? null,
      from: creep
        ? {
            roomName: creep.pos.roomName,
            x: creep.pos.x,
            y: creep.pos.y
          }
        : null,
      to: target?.pos
        ? {
            roomName: target.pos.roomName,
            x: target.pos.x,
            y: target.pos.y
          }
        : null,
      ...outcome
    }));
  }
};</code></pre>
<p>This is diagnostic code, not a permanent movement architecture. Recalculating and visualizing every path can consume unnecessary CPU.</p>

<h2 id="callbacks">Check room callbacks and search limits</h2>
<ul>
<li>Returning <code>false</code> from a PathFinder <code>roomCallback</code> rejects that room.</li>
<li>Returning <code>undefined</code> allows the default terrain matrix when no custom room data is available.</li>
<li>A low <code>maxOps</code> can stop a difficult search early.</li>
<li>A low <code>maxRooms</code> can prevent the search from reaching the target room.</li>
<li>Do not permanently set unlimited search budgets; first identify why the route is expensive.</li>
</ul>
<p>Record <code>ops</code>, <code>cost</code>, and <code>incomplete</code> before changing limits.</p>

<h2 id="cross-room">Check the room-level route</h2>
<pre><code class="language-javascript">const route = Game.map.findRoute(
  creep.pos.roomName,
  target.pos.roomName
);

if (route === ERR_NO_PATH) {
  console.log('No room-level route was found.');
}</code></pre>
<p>A route callback that returns <code>Infinity</code> rejects a room. Accidentally excluding the destination or its only corridor prevents the Creep-level path from succeeding.</p>

<h2 id="cached-path">Handle noPathFinding correctly</h2>
<pre><code class="language-javascript">const cachedResult = creep.moveTo(target, {
  range: desiredRange,
  noPathFinding: true
});

if (cachedResult === ERR_NOT_FOUND) {
  const freshResult = creep.moveTo(target, {
    range: desiredRange,
    noPathFinding: false
  });

  console.log(JSON.stringify({
    cachedResult,
    freshResult
  }));
}</code></pre>
<p><code>noPathFinding: true</code> is useful only after a reusable path exists. Using it on the first call commonly produces <code>ERR_NOT_FOUND</code>, not <code>ERR_NO_PATH</code>.</p>

<h2 id="traffic">Temporary traffic is usually not ERR_NO_PATH</h2>
<p>A route may be found and <code>moveTo()</code> may return <code>OK</code>, yet another Creep occupies the next tile during resolution. That is a traffic or action-order problem. Track unchanged positions and inspect competing movement calls instead of changing CostMatrix rules immediately. Review <a href="/en/blog/screeps-moveto-not-moving">the no-progress diagnostic</a>.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Validate the target position and desired range.</li>
<li>Do not request range 0 for an occupied target tile.</li>
<li>Check whether an empty path means already in range.</li>
<li>Read PathFinder <code>path</code>, <code>ops</code>, <code>cost</code>, and <code>incomplete</code>.</li>
<li>Separate <code>ERR_NO_PATH</code> from cached-path <code>ERR_NOT_FOUND</code>.</li>
<li>Use 255 only for intentionally unwalkable tiles.</li>
<li>Allow owned or public Ramparts unless the task has a stricter policy.</li>
<li>Return <code>undefined</code>, not <code>false</code>, when default handling is desired.</li>
<li>Inspect <code>maxOps</code> and <code>maxRooms</code>.</li>
<li>Check <code>Game.map.findRoute()</code> for cross-room tasks.</li>
<li>Separate temporary traffic from a failed search.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not build a production road matrix, traffic reservation system, hostile-room policy, remote intel database, portal route, highway optimizer, or persistent path cache. Live terrain and cross-room testing remain Pending.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Is an empty path always an error?</h3>
<p>No. The Creep may already satisfy the requested range.</p>
<h3>Does a non-empty PathFinder path prove success?</h3>
<p>No. Check <code>incomplete</code>; the path may be partial.</p>
<h3>What does roomCallback returning false do?</h3>
<p>It rejects the room from the search.</p>
<h3>Should owned Ramparts be unwalkable?</h3>
<p>No. Your Creeps can pass your own Ramparts, so the diagnostic matrix allows owned or public Ramparts.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">API Reference: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.search" rel="nofollow">API Reference: PathFinder.search()</a></li>
<li><a href="https://docs.screeps.com/api/#PathFinder.CostMatrix" rel="nofollow">API Reference: PathFinder.CostMatrix</a></li>
<li><a href="https://docs.screeps.com/api/#Game.map.findRoute" rel="nofollow">API Reference: Game.map.findRoute()</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: movement and Ramparts</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishMovementBatchFiveBySlug = Object.fromEntries(
  englishMovementBatchFiveArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishMovementBatchFiveArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishMovementBatchFiveBySlug[slug];
}
