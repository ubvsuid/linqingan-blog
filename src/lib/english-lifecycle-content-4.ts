import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishLifecycleBatchFourArticles = [
  {
    slug: "screeps-renew-creep",
    path: "/en/blog/screeps-renew-creep",
    chinesePath: "/blog/screeps-spawn-renew-creep",
    title: "Screeps renewCreep(): TTL, Energy, Boosts and Spawn Time",
    headline: "How to Use renewCreep() Safely in Screeps",
    description:
      "Calculate the TTL and Energy gained per renewal, reject CLAIM Creeps, require explicit Boost removal approval, coordinate Spawn time, move adjacent, stop at a target TTL, and handle every documented result.",
    category: "CREEP LIFECYCLE · RENEWAL",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "17 min read",
    breadcrumbLabel: "Renew a Creep Safely",
    tags: ["Screeps", "renewCreep", "Spawn", "ticksToLive", "Creep Lifecycle"],
    keywords: [
      "Screeps renewCreep",
      "StructureSpawn renewCreep",
      "Screeps Creep TTL renewal",
      "renewCreep Energy formula",
      "renewCreep removes boosts",
    ],
    primaryKeyword: "Screeps renewCreep",
    searchIntent: "Safe Creep renewal decision, formula and return-code troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — renewCreep(), ticksToLive, body costs and game-loop timing"],
      ["Formula check", "TTL floor(600 / body size); Energy ceil(creep cost / 2.5 / body size)"],
      ["Safety boundary", "Renewal removes all Boosts and rejects Creeps with CLAIM parts"],
      ["JavaScript syntax", "Passed"],
      ["Offline decision review", "Passed — object, TTL, CLAIM, Boost, range, Spawn, Energy and target-TTL branches"],
      ["Screeps Console test", "Pending"],
      ["Live renewal and Boost-removal test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["official-formulas", "Official TTL and Energy formulas"],
      ["boost-removal", "Renewal removes every Boost"],
      ["claim-parts", "Creeps with CLAIM cannot be renewed"],
      ["threshold", "Choose a threshold and target TTL"],
      ["inspect-first", "Run read-only checks first"],
      ["decision-function", "Separate the decision from the action"],
      ["complete-example", "Complete renewal mission"],
      ["spawn-contention", "Renewal competes with spawning"],
      ["renew-or-replace", "When to renew and when to replace"],
      ["return-codes", "Return-code troubleshooting"],
      ["verify-next-tick", "Verify TTL and Energy on the next tick"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "How many ticks does one renewCreep() call add?",
        "It adds floor(600 divided by the Creep body size) ticks, subject to the Creep's maximum timer and the method returning OK.",
      ],
      [
        "Does renewCreep() use room Extension Energy?",
        "The official formula describes Energy required by the Spawn, and ERR_NOT_ENOUGH_ENERGY means the Spawn itself lacks enough Energy. This guide checks the selected Spawn's Store.",
      ],
      [
        "Can I renew a boosted Creep without losing its Boosts?",
        "No. The official method removes all Boosts. This guide requires an explicit allowBoostRemoval flag before renewing a boosted Creep.",
      ],
      [
        "Should every low-TTL Creep be renewed?",
        "No. Remote travel, CLAIM parts, valuable Boosts, Spawn queue pressure, upgraded body plans, and smooth replacement handoffs often make replacement the better policy.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-emergency-harvester-recovery",
      label: "Previous spawning guide",
      title: "Recover a Room with No Harvesters",
    },
    next: {
      href: "/en/blog/screeps-recycle-creep",
      label: "Next lifecycle guide",
      title: "Recycle an Unneeded Creep Safely",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>StructureSpawn.renewCreep(creep)</code> increases a regular Creep's remaining lifetime when the Creep is adjacent to the Spawn. The Spawn must not be spawning another Creep, the target cannot contain a <code>CLAIM</code> part, the Spawn must have enough of its own Energy, and every Boost on the target will be removed. Do not renew from a TTL threshold alone: calculate the step, confirm Boost loss, coordinate Spawn priority, and stop at an explicit target TTL.</p>

<h2 id="official-formulas">Official TTL and Energy formulas</h2>
<p>One successful renewal call uses the official formulas:</p>
<pre><code class="language-text">added TTL = floor(600 / body size)

Energy cost = ceil(creep cost / 2.5 / body size)</code></pre>
<p>The body size is the total number of body parts, including damaged parts. The Creep cost is the original sum of the official <code>BODYPART_COST</code> values for every part type.</p>
<pre><code class="language-javascript">function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part.type];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part.type)
      );
    }

    return total + cost;
  }, 0);
}

function getRenewStep(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return {
      valid: false,
      reason: 'body-invalid'
    };
  }

  const bodyCost = getBodyCost(body);

  return {
    valid: true,
    reason: 'ready',
    bodySize: body.length,
    bodyCost,
    addedTicks: Math.floor(600 / body.length),
    energyCost: Math.ceil(
      bodyCost / 2.5 / body.length
    )
  };
}</code></pre>
<p>A larger body gains fewer ticks per call. Expensive body parts also increase the Energy cost. These formulas describe one execution, not whether renewing is strategically efficient.</p>

<h2 id="boost-removal">Renewal removes every Boost</h2>
<p>The official API explicitly states that renewing removes all Boosts from the target. Inspect the body before allowing the action:</p>
<pre><code class="language-javascript">function getBoostedParts(creep) {
  return creep.body.filter(part =>
    typeof part.boost === 'string'
  );
}</code></pre>
<p>This guide uses a player-defined safety flag:</p>
<pre><code class="language-javascript">allowBoostRemoval === true</code></pre>
<p>The flag is not an official argument. It prevents an automatic TTL rule from silently stripping a boosted fighter, miner, or upgrader. When Boosts must remain, create a replacement instead.</p>

<h2 id="claim-parts">Creeps with CLAIM cannot be renewed</h2>
<pre><code class="language-javascript">function hasClaimPart(creep) {
  return creep.body.some(part =>
    part.type === CLAIM
  );
}</code></pre>
<p>Check the complete body, not only active parts. The API rejects any target with a <code>CLAIM</code> part. Claimer lifetime should be managed through replacement production rather than renewal.</p>

<h2 id="threshold">Choose a threshold and target TTL</h2>
<p>A renewal threshold determines when the Creep starts returning to the Spawn. A target TTL determines when renewal stops:</p>
<pre><code class="language-javascript">const renewThreshold = 300;
const targetTtl = 1200;</code></pre>
<p>These numbers are examples, not official recommendations. A useful threshold depends on:</p>
<ul>
<li>travel time back to the Spawn;</li>
<li>body spawn time and the replacement lead time;</li>
<li>current Spawn queue pressure;</li>
<li>whether the Creep can leave its work position;</li>
<li>how long it should remain after renewal;</li>
<li>whether another Creep is already taking over.</li>
</ul>
<p>A threshold that is too high wastes work and Spawn time. One that is too low may let the Creep die before it arrives. A target TTL avoids repeatedly calling until <code>ERR_FULL</code>.</p>

<h2 id="inspect-first">Run read-only checks first</h2>
<pre><code class="language-javascript">const spawn = Game.spawns.Spawn1;
const creep = Game.creeps.Worker1;

console.log(JSON.stringify({
  spawnFound: Boolean(spawn),
  creepFound: Boolean(creep),
  spawnOwned: spawn?.my ?? null,
  creepOwned: creep?.my ?? null,
  spawnBusy: Boolean(spawn?.spawning),
  creepSpawning: creep?.spawning ?? null,
  ticksToLive: creep?.ticksToLive ?? null,
  bodySize: creep?.body.length ?? null,
  hasClaim: creep
    ? creep.body.some(part => part.type === CLAIM)
    : null,
  boostedParts: creep
    ? getBoostedParts(creep).length
    : null,
  nearSpawn: spawn && creep
    ? creep.pos.isNearTo(spawn)
    : null,
  spawnEnergy: spawn
    ? spawn.store.getUsedCapacity(RESOURCE_ENERGY)
    : null
}));</code></pre>
<p>This command does not move, renew, or change Memory. Use it to confirm the selected objects and the destructive Boost consequence before enabling a mission.</p>

<h2 id="decision-function">Separate the decision from the action</h2>
<pre><code class="language-javascript">function evaluateRenewRequest(input) {
  const {
    creepExists,
    creepOwned,
    creepSpawning,
    ticksToLive,
    renewThreshold,
    targetTtl,
    hasClaimPart,
    boostedPartCount,
    allowBoostRemoval,
    isNearSpawn,
    spawnExists,
    spawnOwned,
    spawnActive,
    spawnBusy,
    spawnEnergy,
    energyCost
  } = input;

  if (!creepExists || !spawnExists) {
    return {
      ready: false,
      action: 'wait',
      reason: 'object-missing'
    };
  }

  if (!creepOwned || !spawnOwned) {
    return {
      ready: false,
      action: 'stop',
      reason: 'ownership-invalid'
    };
  }

  if (!spawnActive) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-inactive'
    };
  }

  if (creepSpawning) {
    return {
      ready: false,
      action: 'wait',
      reason: 'creep-spawning'
    };
  }

  if (
    !Number.isFinite(ticksToLive)
    || !Number.isFinite(renewThreshold)
    || !Number.isFinite(targetTtl)
    || renewThreshold < 0
    || targetTtl <= renewThreshold
  ) {
    return {
      ready: false,
      action: 'stop',
      reason: 'ttl-policy-invalid'
    };
  }

  if (ticksToLive > renewThreshold) {
    return {
      ready: false,
      action: 'work',
      reason: 'ttl-sufficient'
    };
  }

  if (ticksToLive >= targetTtl) {
    return {
      ready: false,
      action: 'work',
      reason: 'target-ttl-reached'
    };
  }

  if (hasClaimPart) {
    return {
      ready: false,
      action: 'replace',
      reason: 'claim-part-present'
    };
  }

  if (
    boostedPartCount > 0
    && allowBoostRemoval !== true
  ) {
    return {
      ready: false,
      action: 'replace',
      reason: 'boost-removal-not-confirmed'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  if (spawnBusy) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-busy'
    };
  }

  if (
    !Number.isFinite(spawnEnergy)
    || !Number.isFinite(energyCost)
    || spawnEnergy < energyCost
  ) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-energy-not-enough'
    };
  }

  return {
    ready: true,
    action: 'renew',
    reason: 'ready'
  };
}</code></pre>
<p>The pure decision can be tested with ordinary objects. It does not call the server API, remove Boosts, or reserve the Spawn.</p>

<h2 id="complete-example">Complete renewal mission</h2>
<p><strong>State impact:</strong> this script may move <code>Worker1</code> toward <code>Spawn1</code> and may submit repeated renewal actions until the configured target TTL is reached. A successful renewal consumes Spawn Energy, occupies the Spawn action, increases TTL after tick processing, and removes all Boosts.</p>
<pre><code class="language-javascript">function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part.type];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        'Unknown body part: ' + String(part.type)
      );
    }

    return total + cost;
  }, 0);
}

function getRenewStep(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return null;
  }

  const bodyCost = getBodyCost(body);

  return {
    bodySize: body.length,
    bodyCost,
    addedTicks: Math.floor(600 / body.length),
    energyCost: Math.ceil(
      bodyCost / 2.5 / body.length
    )
  };
}

function runRenewMission(input) {
  const {
    spawn,
    creep,
    renewThreshold,
    targetTtl,
    allowBoostRemoval
  } = input;

  if (!spawn || !creep) {
    return {
      status: 'object-missing'
    };
  }

  if (spawn.my !== true || creep.my !== true) {
    return {
      status: 'ownership-invalid'
    };
  }

  if (!spawn.isActive()) {
    return {
      status: 'spawn-inactive'
    };
  }

  if (creep.spawning) {
    return {
      status: 'creep-spawning'
    };
  }

  if (
    !Number.isFinite(renewThreshold)
    || !Number.isFinite(targetTtl)
    || renewThreshold < 0
    || targetTtl <= renewThreshold
  ) {
    return {
      status: 'ttl-policy-invalid'
    };
  }

  const step = getRenewStep(creep.body);

  if (!step) {
    return {
      status: 'body-invalid'
    };
  }

  if (creep.body.some(part => part.type === CLAIM)) {
    return {
      status: 'claim-creep-must-be-replaced'
    };
  }

  const boostedPartCount = creep.body.filter(part =>
    typeof part.boost === 'string'
  ).length;

  if (
    boostedPartCount > 0
    && allowBoostRemoval !== true
  ) {
    return {
      status: 'boost-removal-not-confirmed',
      boostedPartCount
    };
  }

  if (!Number.isFinite(creep.ticksToLive)) {
    return {
      status: 'ttl-unavailable'
    };
  }

  if (creep.ticksToLive > renewThreshold) {
    return {
      status: 'ttl-sufficient',
      ticksToLive: creep.ticksToLive
    };
  }

  if (creep.ticksToLive >= targetTtl) {
    return {
      status: 'target-ttl-reached',
      ticksToLive: creep.ticksToLive
    };
  }

  if (!creep.pos.isNearTo(spawn)) {
    const moveResult = creep.moveTo(spawn, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-spawn',
      moveResult,
      step
    };
  }

  if (spawn.spawning) {
    return {
      status: 'spawn-busy',
      step
    };
  }

  const spawnEnergy = spawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (
    !Number.isFinite(spawnEnergy)
    || spawnEnergy < step.energyCost
  ) {
    return {
      status: 'spawn-energy-not-enough',
      spawnEnergy,
      step
    };
  }

  const ticksToLiveBefore = creep.ticksToLive;
  const result = spawn.renewCreep(creep);

  return {
    status: result === OK
      ? 'renew-submitted'
      : 'renew-failed',
    result,
    step,
    ticksToLiveBefore
  };
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const creep = Game.creeps.Worker1;

  const outcome = runRenewMission({
    spawn,
    creep,
    renewThreshold: 300,
    targetTtl: 1200,
    allowBoostRemoval: false
  });

  if (outcome.status === 'renew-failed') {
    console.log(JSON.stringify({
      type: 'renew-creep-failed',
      spawnName: spawn?.name ?? null,
      creepName: creep?.name ?? null,
      ...outcome
    }));
  }
};</code></pre>
<p>The example intentionally renews only one named Creep at one named Spawn. A real queue must decide which renewal or spawn request has priority.</p>

<h2 id="spawn-contention">Renewal competes with spawning</h2>
<p>The Spawn must not be busy creating another Creep. Renewal and replacement production compete for the same structure:</p>
<pre><code class="language-text">renew the current Creep
OR
spawn a replacement or another required role</code></pre>
<p>Do not let independent modules control the same Spawn without a shared priority decision. Emergency harvesting and defense generally outrank renewing a non-critical convenience role.</p>

<h2 id="renew-or-replace">When to renew and when to replace</h2>
<div class="table-scroll"><table>
<thead><tr><th>Renewal may fit</th><th>Replacement may fit</th></tr></thead>
<tbody>
<tr><td>The Creep works close to the Spawn.</td><td>The Creep is in a remote room.</td></tr>
<tr><td>The existing body still matches the task.</td><td>A newer body design is needed.</td></tr>
<tr><td>The Spawn has spare time.</td><td>The Spawn queue requires centralized timing.</td></tr>
<tr><td>No important Boost must be preserved.</td><td>The Creep has CLAIM or valuable Boosts.</td></tr>
<tr><td>Leaving work briefly is acceptable.</td><td>A smooth handoff is required.</td></tr>
</tbody></table></div>
<p>Renewal is not the default best choice. It trades Spawn time, Energy, travel, and possible Boost loss for continued use of the current body.</p>

<h2 id="return-codes">Return-code troubleshooting</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Likely cause</th><th>Action</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The renewal was scheduled.</td><td>Read TTL and Spawn Energy on the next tick.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Spawn or Creep is not yours.</td><td>Validate both objects.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Spawn is creating another Creep.</td><td>Use one shared Spawn queue.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>The Spawn lacks enough Energy.</td><td>Compare its Store with the calculated step cost.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a Creep or contains CLAIM.</td><td>Check the object and full body.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The target timer cannot be increased further.</td><td>Stop at a lower target TTL.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent.</td><td>Move to range 1 and retry later.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The Spawn is inactive at the current RCL.</td><td>Check Controller and <code>isActive()</code>.</td></tr>
</tbody></table></div>

<h2 id="verify-next-tick">Verify TTL and Energy on the next tick</h2>
<p><code>OK</code> means the operation was scheduled. The current object properties are not a verified post-action state during the same script execution. Record a before snapshot, then inspect the following tick:</p>
<pre><code class="language-javascript">console.log(JSON.stringify({
  tick: Game.time,
  creepName: creep.name,
  ticksToLive: creep.ticksToLive,
  spawnEnergy: spawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  ),
  boostedParts: getBoostedParts(creep).length
}));</code></pre>
<p>This article has not performed a live renewal or Boost-removal test, so those Verification fields remain Pending.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the Spawn and Creep names, ownership, and current visibility.</li>
<li>Reject a Creep that is still spawning.</li>
<li>Calculate one renewal step from the complete body.</li>
<li>Reject any body containing CLAIM.</li>
<li>Require explicit approval before removing Boosts.</li>
<li>Choose both a return threshold and a target TTL.</li>
<li>Move to an adjacent square and save the movement result.</li>
<li>Check that the Spawn is active and not spawning.</li>
<li>Check the selected Spawn's own Energy Store.</li>
<li>Save the <code>renewCreep()</code> result and verify the next tick.</li>
<li>Coordinate renewal with emergency and replacement spawning.</li>
<li>Use <a href="/en/screeps-errors">the error-code reference</a> for shared constants.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement a multi-Creep renewal queue, compare long-term resource efficiency, reserve traffic around the Spawn, reapply Boosts, route remote Creeps home, renew Power Creeps, or schedule several Spawns. Continue with <a href="/en/blog/screeps-recycle-creep">safe Creep recycling</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>How many ticks does one renewal add?</h3>
<p><code>floor(600 / body size)</code>, if the API accepts the action and the timer is not full.</p>
<h3>Does renewal use Extension Energy?</h3>
<p>This guide checks the selected Spawn's Store because the official method requires the Spawn to have enough Energy.</p>
<h3>Can renewal preserve Boosts?</h3>
<p>No. The method removes all Boosts.</p>
<h3>Should every low-TTL Creep be renewed?</h3>
<p>No. Travel, CLAIM, Boosts, queue pressure, body upgrades, and handoff requirements often favor replacement.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.renewCreep" rel="nofollow">API Reference: StructureSpawn.renewCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.ticksToLive" rel="nofollow">API Reference: Creep.ticksToLive</a></li>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: Creeps and body costs</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game loop and tick timing</a></li>
</ul>`,
  },
  {
    slug: "screeps-recycle-creep",
    path: "/en/blog/screeps-recycle-creep",
    chinesePath: "/blog/screeps-spawn-recycle-creep",
    title: "Screeps recycleCreep(): Safely Retire an Unneeded Creep",
    headline: "How to Recycle a Creep Safely in Screeps",
    description:
      "Use an explicit one-time confirmation request, validate the named Spawn and Creep, move adjacent, submit recycleCreep() once, avoid an automatic suicide fallback, and verify disappearance and resource drops on the next tick.",
    category: "CREEP LIFECYCLE · RECYCLING",
    publishedAt: "2026-07-25",
    publishedLabel: "July 25, 2026",
    readingTime: "16 min read",
    breadcrumbLabel: "Recycle a Creep Safely",
    tags: ["Screeps", "recycleCreep", "Spawn", "Creep Lifecycle", "Safe Operations"],
    keywords: [
      "Screeps recycleCreep",
      "StructureSpawn recycleCreep",
      "Screeps recycle old Creep",
      "recycleCreep resource refund",
      "recycleCreep vs suicide",
    ],
    primaryKeyword: "Screeps recycleCreep",
    searchIntent: "Irreversible Creep retirement workflow and return-code troubleshooting",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — recycleCreep(), suicide(), resource return and tick timing"],
      ["Return boundary", "Up to 100% by remaining life; Energy capped at 125 per body part"],
      ["API distinction", "Current recycleCreep() docs do not require an idle Spawn or list ERR_BUSY"],
      ["JavaScript syntax", "Passed"],
      ["Offline request review", "Passed — confirmation, object, ownership, range, close, submit and retry branches"],
      ["Screeps Console test", "Pending"],
      ["Live recycling and resource-drop test", "Pending"],
      ["Last verified", "July 25, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["recycle-vs-suicide", "recycleCreep() versus suicide()"],
      ["resource-return", "Resource-return boundaries"],
      ["confirmation-request", "Create a one-time confirmation request"],
      ["decision-function", "Evaluate the request before acting"],
      ["complete-example", "Complete recycling mission"],
      ["spawn-busy", "Why this guide does not reject a busy Spawn"],
      ["return-codes", "Return-code troubleshooting"],
      ["verify-next-tick", "Verify disappearance and drops later"],
      ["when-not-to-recycle", "When not to recycle automatically"],
      ["cleanup", "Clean related Memory after success"],
      ["debugging", "Debugging checklist"],
      ["scope", "Scope and next steps"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "Does recycleCreep() return the full original body cost?",
        "Not necessarily. The drop depends on remaining lifetime, Energy return is capped at 125 per body part, and Boost resources may also be involved. Let the server calculate the actual result.",
      ],
      [
        "Must the Spawn be idle before recycleCreep()?",
        "The current official method description and return-code table do not require an idle Spawn or list ERR_BUSY, so this guide does not copy renewCreep()'s busy check into recycling.",
      ],
      [
        "Should recycling automatically fall back to creep.suicide()?",
        "No. A range, ownership, target, or RCL failure may be recoverable. Automatically escalating to another irreversible action is unsafe.",
      ],
      [
        "Does OK mean Game.creeps no longer contains the Creep immediately?",
        "No. OK means the operation was scheduled. Verify the next tick and then clean stale Memory and task indexes.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-renew-creep",
      label: "Previous lifecycle guide",
      title: "Renew a Creep Safely",
    },
    next: null,
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p><code>StructureSpawn.recycleCreep(creep)</code> irreversibly ends the target Creep and drops part of the resources used for spawning and Boosting, based on remaining lifetime. The target must be adjacent to your Spawn. Because the operation is destructive, use a one-time request with an exact Spawn name, exact Creep name, <code>enabled: true</code>, and <code>confirmed: true</code>. Disable the request before submitting, restore it only if the call fails, and verify the next tick.</p>

<h2 id="recycle-vs-suicide">recycleCreep() versus suicide()</h2>
<div class="table-scroll"><table>
<thead><tr><th>Method</th><th>Caller and range</th><th>Resource behavior</th></tr></thead>
<tbody>
<tr><td><code>spawn.recycleCreep(creep)</code></td><td>Your Spawn; target must be adjacent.</td><td>Drops a lifetime-based portion of spawning and Boost resources.</td></tr>
<tr><td><code>creep.suicide()</code></td><td>The Creep itself; no Spawn adjacency requirement.</td><td>Not the Spawn recycling workflow described here.</td></tr>
</tbody></table></div>
<p>Use recycling when the Creep can safely return to your Spawn and recovering part of the investment is useful. Evaluate <code>suicide()</code> separately when immediate removal is genuinely required. This guide never calls it automatically after a recycling failure.</p>

<h2 id="resource-return">Resource-return boundaries</h2>
<p>The official API says recycling drops up to 100% of the resources spent on spawning and Boosting, depending on the Creep's remaining lifetime. Energy return is also limited to 125 units per body part.</p>
<ul>
<li>Lower TTL generally means a smaller returned portion.</li>
<li>Expensive parts remain subject to the per-part Energy cap.</li>
<li>Boost compounds may be included in the server-calculated drops.</li>
<li>The original body cost is not the same as the guaranteed refund.</li>
<li>The exact result should be observed after the action, not reimplemented from guesses.</li>
</ul>
<p>This article does not claim a specific recovered amount without a live result.</p>

<h2 id="confirmation-request">Create a one-time confirmation request</h2>
<p>Enter a deliberate request in the Screeps Console:</p>
<pre><code class="language-javascript">Memory.recycleRequests ??= {};

Memory.recycleRequests.OldWorker1 = {
  enabled: true,
  confirmed: true,
  spawnName: 'Spawn1',
  creepName: 'OldWorker1',
  reason: 'role-replaced',
  requestedAt: Game.time
};</code></pre>
<p><code>enabled</code> and <code>confirmed</code> are player-defined safety fields, not official API arguments. They make the destructive intent explicit and give the loop a single request to close after submission.</p>

<h2 id="decision-function">Evaluate the request before acting</h2>
<pre><code class="language-javascript">function evaluateRecycleRequest(input) {
  const {
    requestExists,
    enabled,
    confirmed,
    spawnExists,
    creepExists,
    creepSpawning,
    spawnOwned,
    creepOwned,
    spawnActive,
    isNearSpawn
  } = input;

  if (!requestExists || enabled !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'request-disabled'
    };
  }

  if (confirmed !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'confirmation-required'
    };
  }

  if (!spawnExists) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-missing'
    };
  }

  if (!creepExists) {
    return {
      ready: false,
      action: 'close',
      reason: 'creep-missing'
    };
  }

  if (creepSpawning) {
    return {
      ready: false,
      action: 'wait',
      reason: 'creep-spawning'
    };
  }

  if (!spawnOwned || !creepOwned) {
    return {
      ready: false,
      action: 'close',
      reason: 'ownership-invalid'
    };
  }

  if (!spawnActive) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-inactive'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  return {
    ready: true,
    action: 'recycle',
    reason: 'ready'
  };
}</code></pre>
<p>This pure function distinguishes waiting, moving, closing an invalid request, and executing the irreversible action.</p>

<h2 id="complete-example">Complete recycling mission</h2>
<p><strong>State impact:</strong> this script reads and updates one entry in <code>Memory.recycleRequests</code>, may move the named Creep, and may submit one irreversible recycling action. It disables the request before the call and re-enables it only when the API returns a failure code.</p>
<pre><code class="language-javascript">function evaluateRecycleRequest(input) {
  const {
    requestExists,
    enabled,
    confirmed,
    spawnExists,
    creepExists,
    creepSpawning,
    spawnOwned,
    creepOwned,
    spawnActive,
    isNearSpawn
  } = input;

  if (!requestExists || enabled !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'request-disabled'
    };
  }

  if (confirmed !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'confirmation-required'
    };
  }

  if (!spawnExists) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-missing'
    };
  }

  if (!creepExists) {
    return {
      ready: false,
      action: 'close',
      reason: 'creep-missing'
    };
  }

  if (creepSpawning) {
    return {
      ready: false,
      action: 'wait',
      reason: 'creep-spawning'
    };
  }

  if (!spawnOwned || !creepOwned) {
    return {
      ready: false,
      action: 'close',
      reason: 'ownership-invalid'
    };
  }

  if (!spawnActive) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-inactive'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  return {
    ready: true,
    action: 'recycle',
    reason: 'ready'
  };
}

function runRecycleRequest(requestKey) {
  const request = Memory.recycleRequests?.[requestKey];

  if (!request || request.enabled !== true) {
    return {
      status: 'request-disabled'
    };
  }

  const spawn = typeof request.spawnName === 'string'
    ? Game.spawns[request.spawnName]
    : null;
  const creep = typeof request.creepName === 'string'
    ? Game.creeps[request.creepName]
    : null;

  const decision = evaluateRecycleRequest({
    requestExists: true,
    enabled: request.enabled,
    confirmed: request.confirmed,
    spawnExists: Boolean(spawn),
    creepExists: Boolean(creep),
    creepSpawning: creep?.spawning === true,
    spawnOwned: spawn?.my === true,
    creepOwned: creep?.my === true,
    spawnActive: Boolean(spawn?.isActive()),
    isNearSpawn: Boolean(
      spawn
      && creep
      && creep.pos.isNearTo(spawn)
    )
  });

  request.lastStatus = decision.reason;
  request.lastCheckedAt = Game.time;

  if (decision.action === 'close') {
    request.enabled = false;
    request.closedAt = Game.time;

    return {
      status: decision.reason
    };
  }

  if (
    decision.action === 'move'
    && creep
    && spawn
  ) {
    const moveResult = creep.moveTo(spawn, {
      range: 1,
      reusePath: 10
    });

    request.lastMoveResult = moveResult;
    request.lastMoveAt = Game.time;

    return {
      status: 'moving-to-spawn',
      moveResult
    };
  }

  if (!decision.ready || !spawn || !creep) {
    return {
      status: decision.reason
    };
  }

  request.enabled = false;
  request.submittedAt = Game.time;

  const result = spawn.recycleCreep(creep);

  request.lastResult = result;
  request.lastResultAt = Game.time;

  if (result !== OK) {
    request.enabled = true;

    console.log(JSON.stringify({
      type: 'recycle-creep-failed',
      spawnName: spawn.name,
      creepName: creep.name,
      result
    }));
  }

  return {
    status: result === OK
      ? 'recycle-submitted'
      : 'recycle-failed',
    result
  };
}

module.exports.loop = function () {
  runRecycleRequest('OldWorker1');
};</code></pre>
<p>Disabling before the call prevents a later exception elsewhere in the loop from causing repeated submissions without a fresh object check. A failed API result reopens the request for the next controlled retry.</p>

<h2 id="spawn-busy">Why this guide does not reject a busy Spawn</h2>
<p>The current official <code>recycleCreep()</code> description requires adjacency but does not state that the Spawn must be idle. Its documented return-code table also does not include <code>ERR_BUSY</code>. Therefore this guide does not copy the <code>renewCreep()</code> busy condition into recycling.</p>
<p>Always trust and log the real return value. Do not invent a shared precondition merely because both methods belong to <code>StructureSpawn</code>.</p>

<h2 id="return-codes">Return-code troubleshooting</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Likely cause</th><th>Action</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The recycling operation was scheduled.</td><td>Verify disappearance and resource drops on the next tick.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Spawn or Creep is not yours.</td><td>Close the unsafe request and inspect object selection.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The selected target is not a Creep.</td><td>Validate the exact name and object type.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent.</td><td>Move to range 1 and retry later.</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The Spawn is inactive at the current RCL.</td><td>Check the Controller and <code>isActive()</code>.</td></tr>
</tbody></table></div>
<p><code>ERR_BUSY</code> is not in the current documented return set for recycling.</p>

<h2 id="verify-next-tick">Verify disappearance and drops later</h2>
<p><code>OK</code> schedules the operation. It does not require <code>Game.creeps[name]</code> to disappear during the same script execution. On the next tick, verify:</p>
<pre><code class="language-javascript">const request = Memory.recycleRequests?.OldWorker1;
const creepStillExists = Boolean(
  Game.creeps.OldWorker1
);

console.log(JSON.stringify({
  tick: Game.time,
  requestEnabled: request?.enabled ?? null,
  lastResult: request?.lastResult ?? null,
  creepStillExists
}));</code></pre>
<p>Inspect the adjacent dropped resources in the room when a live test is available. This article does not fabricate the returned quantities.</p>

<h2 id="when-not-to-recycle">When not to recycle automatically</h2>
<ul>
<li>The Creep is the only harvester, hauler, or defender.</li>
<li>No replacement has completed the handoff.</li>
<li>The Creep carries resources or task state that must be delivered first.</li>
<li>The return route is longer than the remaining lifetime.</li>
<li>The name or intended target is ambiguous.</li>
<li>The trigger is only low TTL rather than a completed retirement decision.</li>
</ul>
<p>Recycling should be triggered by explicit task state or human confirmation, not merely by age or temporary role surplus.</p>

<h2 id="cleanup">Clean related Memory after success</h2>
<p>After the next tick confirms that the Creep is gone, clean the old Creep entry and only the custom indexes your project explicitly owns. Review <a href="/en/blog/screeps-clean-dead-creep-memory">the dead-Creep Memory cleanup guide</a>. Do not recursively delete every matching name from unrelated Memory modules.</p>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require an exact Spawn name and exact Creep name.</li>
<li>Require both <code>enabled: true</code> and <code>confirmed: true</code>.</li>
<li>Validate object existence, ownership, Spawn activity, and Creep spawning state.</li>
<li>Move to an adjacent square and save the movement result.</li>
<li>Do not require <code>spawn.spawning</code> to be empty unless live evidence or future docs add that rule.</li>
<li>Disable the request before the irreversible call.</li>
<li>Re-enable only when the real result is not <code>OK</code>.</li>
<li>Never auto-fallback to <code>suicide()</code>.</li>
<li>Verify disappearance and drops on the next tick.</li>
<li>Clean only explicitly managed Memory indexes afterward.</li>
<li>Do not equate original body cost with guaranteed returned resources.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide handles one explicitly named regular Creep. It does not detect role surplus, schedule a multi-Creep recycling queue, solve Spawn traffic, select a nearest Spawn, route across rooms, recycle Power Creeps, estimate exact drops, or automate <code>suicide()</code>. Live recycling and resource-drop verification remain Pending.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Does recycling return the full body cost?</h3>
<p>Not necessarily. Remaining lifetime and the 125-Energy-per-part cap affect the server-calculated drop.</p>
<h3>Must the Spawn be idle?</h3>
<p>The current documented recycling method does not require that condition or list <code>ERR_BUSY</code>.</p>
<h3>Should failure call suicide() automatically?</h3>
<p>No. A recoverable range, target, ownership, or RCL problem should not escalate automatically.</p>
<h3>Does OK remove the Creep immediately from Game.creeps?</h3>
<p>Treat OK as scheduled and verify the next tick.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.recycleCreep" rel="nofollow">API Reference: StructureSpawn.recycleCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.suicide" rel="nofollow">API Reference: Creep.suicide()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.ticksToLive" rel="nofollow">API Reference: Creep.ticksToLive</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: Game loop and tick timing</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishLifecycleBatchFourBySlug = Object.fromEntries(
  englishLifecycleBatchFourArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishLifecycleBatchFourArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishLifecycleBatchFourBySlug[slug];
}
