import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishPrespawnBatchNineteenArticles = [
  {
    slug: "screeps-creep-prespawn-replacement",
    path: "/en/blog/screeps-creep-prespawn-replacement",
    chinesePath: "/blog/screeps-creep-prespawn-replacement",
    title: "Screeps Prespawn Replacement: TTL, Spawn Time, and Travel",
    headline: "Screeps Prespawn Replacement: Start the Next Creep Before the Current One Dies",
    description:
      "Calculate when a replacement Creep must start spawning from ticksToLive, current Spawn work, body spawn time, travel time, and a safety buffer, while preventing duplicate replacements.",
    category: "CREEP LIFECYCLE · PRESPAWN REPLACEMENT",
    publishedAt: "2026-08-03",
    publishedLabel: "August 3, 2026",
    readingTime: "15 min read",
    breadcrumbLabel: "Prespawn Replacement",
    tags: ["Screeps", "Spawn", "Creep Lifecycle", "ticksToLive", "Replacement Planning"],
    keywords: [
      "Screeps prespawn replacement",
      "Screeps ticksToLive spawn time",
      "Screeps Creep replacement",
      "Screeps Spawn queue",
      "prevent Creep role downtime",
    ],
    primaryKeyword: "Screeps prespawn replacement",
    searchIntent: "Prevent role downtime by scheduling a replacement before the current Creep dies",
    finalScore: 97,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      ["Official docs", "Checked — ticksToLive, spawning, remainingTime, CREEP_SPAWN_TIME and spawnCreep() results"],
      ["JavaScript syntax", "Passed"],
      ["Offline simulation", "Passed — eight TTL, count, active-spawn, body-length and duplicate-replacement branches"],
      ["Screeps Console test", "Pending"],
      ["Live replacement handoff", "Pending"],
      ["Last verified", "August 3, 2026"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["why-late", "Why count-after-death is late"],
      ["lead-time", "The replacement lead-time formula"],
      ["travel", "Estimate travel separately"],
      ["duplicate-protection", "Prevent duplicate replacements"],
      ["decision-function", "Pure decision function"],
      ["room-manager", "Room-level Spawn manager"],
      ["return-codes", "Handle real Spawn results"],
      ["renew-or-replace", "Renew or replace"],
      ["verification", "Verification plan"],
      ["scope", "Scope and limits"],
      ["faq", "FAQ"],
      ["official-docs", "Official documentation"],
    ],
    faq: [
      [
        "At what ticksToLive value should a Creep be replaced?",
        "There is no universal TTL threshold. Add the earliest Spawn wait, body spawn time, measured or conservative travel time, and a safety buffer for that role.",
      ],
      [
        "Why does my code spawn two replacements for one old Creep?",
        "A completed replacement may temporarily raise the role count above its target while the old low-TTL Creep is still alive. Treat that surplus as coverage before submitting another request.",
      ],
      [
        "Should I use renewCreep() instead?",
        "Usually not for ordinary economy roles. Renewal consumes Spawn time and requires the Creep to return adjacent to the Spawn. Replacement allows the old unit to keep working while the next one spawns and travels.",
      ],
      [
        "Does spawnCreep() returning OK mean the replacement is ready?",
        "No. OK means the spawning operation was scheduled. Observe spawn.spawning, the new Creep's spawning flag, and the first tick when the unit reaches its work position.",
      ],
    ],
    previous: {
      href: "/en/blog/screeps-dynamic-creep-body",
      label: "Previous spawning guide",
      title: "Build a Dynamic Creep Body",
    },
    next: {
      href: "/en/blog/screeps-renew-creep",
      label: "Next lifecycle guide",
      title: "Use renewCreep() Safely",
    },
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Do not wait until a Harvester, Hauler, or Upgrader disappears before creating its successor. Calculate the complete handoff time:</p>
<pre><code class="language-text">replacement lead time = earliest Spawn wait
                      + body spawn time
                      + travel time
                      + safety buffer</code></pre>
<p>When an existing Creep's <code>ticksToLive</code> reaches that lead time, submit one replacement request only if the role does not already have a spawning or temporary surplus unit covering that expiration.</p>
<p>The related <a href="/en/tools/spawn-queue-replacement-planner">Spawn Queue and Replacement Planner</a> can help compare body time, queue pressure, travel, and the remaining margin before a role gap.</p>

<h2 id="why-late">Why count-after-death is late</h2>
<p>A common role manager waits for the live count to fall below its target:</p>
<pre><code class="language-javascript">if (harvesters.length &lt; 2) {
  spawn.spawnCreep(body, name, options);
}</code></pre>
<p>The request starts too late because a new Creep does not appear immediately. It may wait behind the Spawn's current job, consume spawn time for every body part, and then travel to the Source, Controller, or logistics position.</p>
<p>For example, a Harvester with 30 ticks left cannot cover a replacement that needs 12 ticks of Spawn waiting, 18 ticks of body production, 25 ticks of travel, and a 10-tick buffer. The complete requirement is 65 ticks, so the work position will be empty even though the role count looked healthy shortly before death.</p>

<h2 id="lead-time">The replacement lead-time formula</h2>
<p>Use the earliest active owned Spawn, not a fixed Spawn name, when estimating queue time:</p>
<pre><code class="language-javascript">function getEarliestSpawnWait(spawns) {
  if (spawns.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...spawns.map(spawn =&gt;
      spawn.spawning?.remainingTime ?? 0
    )
  );
}</code></pre>
<p>The base body time is:</p>
<pre><code class="language-text">body spawn time = body.length × CREEP_SPAWN_TIME</code></pre>
<p>This guide intentionally uses the documented base value. A stable <code>PWR_OPERATE_SPAWN</code> effect may reduce actual production time, but the base estimate remains conservative. Long-term Energy starvation, hostile disruption, destroyed Spawns, or another module bypassing the queue can still invalidate the plan.</p>

<h2 id="travel">Estimate travel separately</h2>
<p>Do not replace travel time with linear range. Roads, plains, swamps, MOVE-to-load ratio, fatigue, traffic, exits, and path changes all affect arrival.</p>
<p>Start with a conservative per-role value, such as 25 ticks for a Source Harvester and 12 ticks for a Controller-side Upgrader. Then record the tick when the new Creep finishes spawning and the tick when it first reaches its work position. Use measured data after several normal handoffs.</p>
<p>If arrival is consistently late, diagnose movement before adding an unlimited buffer. Review <a href="/en/blog/screeps-move-fatigue-body-ratio">MOVE, fatigue, terrain, and load</a> and <a href="/en/blog/screeps-moveto-not-moving">accepted moveTo() calls with no progress</a>.</p>

<h2 id="duplicate-protection">Prevent duplicate replacements</h2>
<p>Suppose a role target is two. Old Creep A enters the threshold, and replacement C starts spawning. After C finishes, A may remain alive for several ticks, so the role temporarily contains three units. If the manager only sees A's low TTL, it may create a second unnecessary replacement.</p>
<p>Separate these quantities:</p>
<ul>
<li>target role count;</li>
<li>currently active count;</li>
<li>currently spawning count;</li>
<li>temporary surplus above the target;</li>
<li>active Creeps already inside the replacement threshold.</li>
</ul>
<pre><code class="language-text">uncovered expiring count = expiring active count - temporary surplus</code></pre>
<p>Submit another replacement only when the uncovered value is greater than zero.</p>

<h2 id="decision-function">Pure decision function</h2>
<pre><code class="language-javascript">function evaluateRoleReplacement(input) {
  const {
    targetCount,
    activeTtls,
    spawningCount,
    bodyLength,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  } = input;

  const integers = [
    targetCount,
    spawningCount,
    bodyLength,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  ];

  if (
    !integers.every(Number.isInteger)
    || targetCount &lt; 1
    || spawningCount &lt; 0
    || bodyLength &lt; 1
    || bodyLength &gt; 50
    || spawnWaitTicks &lt; 0
    || travelTicks &lt; 0
    || safetyBuffer &lt; 0
    || !Array.isArray(activeTtls)
    || !activeTtls.every(ttl =&gt;
      Number.isInteger(ttl) &amp;&amp; ttl &gt;= 0
    )
  ) {
    return {
      valid: false,
      shouldSpawn: false,
      reason: 'invalid-input'
    };
  }

  const leadTicks =
    spawnWaitTicks
    + bodyLength * CREEP_SPAWN_TIME
    + travelTicks
    + safetyBuffer;
  const totalCount = activeTtls.length + spawningCount;
  const missingCount = Math.max(
    0,
    targetCount - totalCount
  );
  const surplusCount = Math.max(
    0,
    totalCount - targetCount
  );
  const dueCount = activeTtls.filter(
    ttl =&gt; ttl &lt;= leadTicks
  ).length;
  const uncoveredDueCount = Math.max(
    0,
    dueCount - surplusCount
  );
  const minimumSlack = activeTtls.length &gt; 0
    ? Math.min(
        ...activeTtls.map(ttl =&gt; ttl - leadTicks)
      )
    : Number.NEGATIVE_INFINITY;

  if (missingCount &gt; 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'count-below-target',
      missingCount,
      uncoveredDueCount,
      leadTicks,
      minimumSlack
    };
  }

  if (uncoveredDueCount &gt; 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'prespawn-due',
      missingCount,
      uncoveredDueCount,
      leadTicks,
      minimumSlack
    };
  }

  return {
    valid: true,
    shouldSpawn: false,
    reason: 'covered',
    missingCount,
    uncoveredDueCount,
    leadTicks,
    minimumSlack
  };
}</code></pre>
<p><code>minimumSlack</code> is positive while the most urgent Creep still has margin, zero at the threshold, and negative after the ideal submission time. It is a player-defined scheduling metric, not an official Spawn result.</p>

<h2 id="room-manager">Room-level Spawn manager</h2>
<p>Run all role requests through one room-level entry point. The following bounded example counts active and spawning Creeps, ranks true shortages before normal replacement requests, performs <code>dryRun</code>, and submits at most one request per room per tick.</p>
<pre><code class="language-javascript">const ROLE_CONFIG = {
  harvester: {
    priority: 10,
    targetCount: 2,
    body: [WORK, WORK, CARRY, MOVE],
    travelTicks: 25,
    safetyBuffer: 15
  },
  hauler: {
    priority: 20,
    targetCount: 2,
    body: [CARRY, CARRY, MOVE],
    travelTicks: 18,
    safetyBuffer: 15
  },
  upgrader: {
    priority: 30,
    targetCount: 1,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    travelTicks: 12,
    safetyBuffer: 15
  }
};

function getUsableSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =&gt;
      spawn.my === true
      &amp;&amp; spawn.isActive()
    )
    .sort((left, right) =&gt;
      left.name.localeCompare(right.name)
    );
}

function belongsToRoom(creep, roomName) {
  return creep.memory?.home
    ? creep.memory.home === roomName
    : creep.room.name === roomName;
}

function createRoleRequest(room, role, config, spawnWaitTicks) {
  const creeps = Object.values(Game.creeps)
    .filter(creep =&gt;
      creep.memory?.role === role
      &amp;&amp; belongsToRoom(creep, room.name)
    );
  const activeTtls = creeps
    .filter(creep =&gt; !creep.spawning)
    .map(creep =&gt; creep.ticksToLive)
    .filter(Number.isInteger);
  const spawningCount = creeps
    .filter(creep =&gt; creep.spawning)
    .length;
  const decision = evaluateRoleReplacement({
    targetCount: config.targetCount,
    activeTtls,
    spawningCount,
    bodyLength: config.body.length,
    spawnWaitTicks,
    travelTicks: config.travelTicks,
    safetyBuffer: config.safetyBuffer
  });

  return decision.valid &amp;&amp; decision.shouldSpawn
    ? { role, config, ...decision }
    : null;
}

function compareRequests(left, right) {
  const leftTier = left.reason === 'count-below-target' ? 0 : 1;
  const rightTier = right.reason === 'count-below-target' ? 0 : 1;

  if (leftTier !== rightTier) {
    return leftTier - rightTier;
  }

  return leftTier === 0
    ? right.missingCount - left.missingCount
      || left.config.priority - right.config.priority
    : left.minimumSlack - right.minimumSlack
      || left.config.priority - right.config.priority;
}

function runRoomSpawnManager(room) {
  const spawns = getUsableSpawns(room);
  if (spawns.length === 0) {
    return { submitted: false, reason: 'no-usable-spawn' };
  }

  const spawnWaitTicks = getEarliestSpawnWait(spawns);
  const requests = Object.entries(ROLE_CONFIG)
    .map(([role, config]) =&gt;
      createRoleRequest(room, role, config, spawnWaitTicks)
    )
    .filter(Boolean)
    .sort(compareRequests);

  if (requests.length === 0) {
    return { submitted: false, reason: 'no-request' };
  }

  const request = requests[0];
  const spawn = spawns.find(item =&gt; !item.spawning);
  if (!spawn) {
    return { submitted: false, reason: 'all-spawns-busy', request };
  }

  const name = [request.role, room.name, spawn.name, Game.time].join('-');
  const memory = {
    role: request.role,
    home: room.name,
    replacementReason: request.reason
  };
  const dryRunResult = spawn.spawnCreep(
    request.config.body,
    name,
    { memory, dryRun: true }
  );

  if (dryRunResult !== OK) {
    return {
      submitted: false,
      reason: 'dry-run-failed',
      result: dryRunResult,
      request
    };
  }

  const result = spawn.spawnCreep(
    request.config.body,
    name,
    { memory }
  );

  return {
    submitted: result === OK,
    reason: result === OK ? 'submitted' : 'spawn-failed',
    result,
    name,
    spawnName: spawn.name,
    request
  };
}</code></pre>
<p>The numeric priority is player policy: smaller values win after the shortage or deadline comparison. It is not an official Screeps constant.</p>

<h2 id="return-codes">Handle real Spawn results</h2>
<table>
<thead><tr><th>Result</th><th>Meaning for the queue</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The spawn operation was scheduled</td><td>Store the name, role, reason, and tick</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The queue and actual Spawn state disagree</td><td>Find another module calling the Spawn</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>The deadline arrived but the body is unaffordable</td><td>Use an allowed fallback body or emergency policy</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>Name or submission ownership conflicts</td><td>Fix naming and the single queue entry point</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The body, name, or options are invalid</td><td>Stop retries and repair configuration</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>The selected Spawn is not active</td><td>Check RCL, ownership, and <code>isActive()</code></td></tr>
</tbody>
</table>
<p><code>OK</code> does not mean the Creep is ready in the same tick. Observe <code>spawn.spawning</code>, the new Creep's <code>spawning</code> flag, and its first work-position arrival.</p>

<h2 id="renew-or-replace">Renew or replace</h2>
<p><code>renewCreep()</code> consumes Spawn time, requires adjacency, rejects CLAIM Creeps, and removes Boosts. Ordinary economy roles are usually easier to replace: the old unit keeps working while the next unit spawns and travels.</p>
<p>Use renewal only after evaluating its specific boundaries in <a href="/en/blog/screeps-renew-creep">the renewCreep() guide</a>. If prevention has already failed and the room has no Harvester, switch to <a href="/en/blog/screeps-emergency-harvester-recovery">the minimum emergency recovery path</a>.</p>

<h2 id="verification">Verification plan</h2>
<p>Offline tests should cover high TTL, threshold TTL, real shortage, one spawning replacement, a completed temporary surplus, two same-age expirations, Spawn waiting, and invalid body configuration.</p>
<p>Before live execution, inspect role, home room, spawning state, and TTL:</p>
<pre><code class="language-javascript">Object.values(Game.creeps).map(creep =&gt; ({
  name: creep.name,
  role: creep.memory.role,
  home: creep.memory.home,
  spawning: creep.spawning,
  ticksToLive: creep.ticksToLive
}));</code></pre>
<p>For one real handoff, record the threshold tick, the successful Spawn submission tick, the production-complete tick, the first work-position tick, and the old Creep's death tick. A role gap is prevented only when the replacement arrives before the previous unit leaves.</p>

<h2 id="scope">Scope and limits</h2>
<ul>
<li>The example submits at most one request per room per tick.</li>
<li>Multiple Spawns share one decision, but the example does not fill every idle Spawn in one tick.</li>
<li>Travel time must be configured or measured.</li>
<li>Direct Spawn calls from another module bypass the queue.</li>
<li>Destroyed Spawns, hostile blocking, and prolonged Energy starvation can break the schedule.</li>
<li>Remote miners, Claimers, and combat formations need separate role parameters.</li>
</ul>
<p>At larger scale, extend each request with a deadline, reserved Spawn, replacement target, and expiration time rather than duplicating the role-count check across modules.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>What TTL threshold should I use?</h3>
<p>Add Spawn waiting, body time, travel, and a buffer. The correct number differs by role and room.</p>
<h3>Why did a third role unit appear?</h3>
<p>A short surplus is normal during a handoff. Count it as coverage for the expiring unit before submitting again.</p>
<h3>Can dryRun reserve the Spawn?</h3>
<p>No. It validates the request at that moment. Another module can still change the final state, so preserve and handle the real result.</p>
<h3>Should I wait for full room Energy?</h3>
<p>That is a separate body policy. Critical roles may use a legal fallback body, while ordinary replacements may wait for the target body if the remaining margin allows it.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep" rel="nofollow">API Reference: Creep, spawning, and ticksToLive</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">API Reference: StructureSpawn.spawnCreep()</a></li>
<li><a href="https://docs.screeps.com/api/#StructureSpawn-Spawning" rel="nofollow">API Reference: StructureSpawn.Spawning</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">API Reference: constants including CREEP_SPAWN_TIME</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: game loop and tick timing</a></li>
</ul>`,
  },
] satisfies EnglishBeginnerArticle[];

export const englishPrespawnBatchNineteenBySlug = Object.fromEntries(
  englishPrespawnBatchNineteenArticles.map((article) => [article.slug, article]),
) as Record<string, EnglishBeginnerArticle>;

export function getEnglishPrespawnBatchNineteenArticle(
  slug: string,
): EnglishBeginnerArticle | undefined {
  return englishPrespawnBatchNineteenBySlug[slug];
}
