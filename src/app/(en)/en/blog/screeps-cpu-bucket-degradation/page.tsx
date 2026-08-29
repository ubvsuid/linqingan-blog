import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-cpu-bucket-degradation";
const chinesePath = "/blog/screeps-cpu-bucket-degradation";
const headline = "Screeps CPU Bucket Degradation: Protect Critical Tasks and Recover Gradually";
const description =
  "Build a four-mode Screeps CPU degradation scheduler with hysteresis, consecutive-tick confirmation, critical-first task tiers, stable staggering, CPU headroom guards, and gradual recovery.";
const publishedAt = "2026-08-05";
const publishedLabel = "August 5, 2026";
const modifiedTime = "2026-08-29";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps CPU bucket falling",
    "Screeps CPU degradation",
    "Screeps CPU scheduler",
    "Game.cpu.bucket recovery",
    "Screeps optional task throttling",
  ],
  alternates: {
    canonical: path,
    languages: { en: path, "zh-CN": chinesePath, "x-default": path },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${headline} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: discovery?.tags ?? ["CPU", "Debugging", "JavaScript"],
    images: [{ url: `${siteConfig.url}${path}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["problem", "Treat a falling bucket as a control problem"],
  ["contract", "Define the scheduler contract"],
  ["policy", "Separate official CPU facts from policy"],
  ["state-machine", "Implement the four-mode state machine"],
  ["scheduler", "Schedule task tiers with headroom"],
  ["integration", "Wire the scheduler into your loop"],
  ["failures", "Understand the failure modes"],
  ["evidence", "Verify the English implementation"],
  ["boundaries", "Know the operating boundaries"],
];

const articleHtml = String.raw`
<h2 id="problem">Treat a falling bucket as a control problem</h2>
<p>If <code>Game.cpu.bucket</code> keeps falling across many ticks, your script is drawing down accumulated CPU faster than it is replenishing it. One expensive tick is not enough to justify disabling work, but a sustained decline means the loop needs a load-shedding policy before optional work consumes CPU that critical room logic may need.</p>
<p>A single rule such as <code>bucket &lt; 5000</code> is too weak. It does not distinguish survival work from optional work, and it can repeatedly disable and re-enable subsystems near the threshold. A useful degradation scheduler needs hysteresis, confirmation across consecutive ticks, a minimum recovery hold, task tiers, and a deliberate recovery stage.</p>
<pre><code class="language-text">healthy
  NORMAL
    ↓ sustained pressure
  CONSERVE
    ↓ stronger pressure
  EMERGENCY
    ↓ sustained recovery
  RECOVERY
    ↓ sustained healthy metrics
  NORMAL

RECOVERY can regress to CONSERVE or EMERGENCY.</code></pre>

<h2 id="contract">Define the scheduler contract</h2>
<p>The scheduler in this guide follows six rules:</p>
<ol>
<li>Critical tasks are sorted first. Their configured interval remains in force, but mode degradation and the noncritical headroom guard never throttle them.</li>
<li>Ordinary degradation needs three consecutive qualifying ticks; hard CPU risk can enter <code>EMERGENCY</code> immediately.</li>
<li>Recovery is intentionally slower: twenty consecutive healthy ticks are required, and recovery-direction transitions also respect a minimum mode hold.</li>
<li>Important and optional tasks use per-mode intervals. Optional work is disabled in <code>EMERGENCY</code> and during the first part of <code>RECOVERY</code>.</li>
<li>Periodic tasks receive a stable offset derived from their name, so expensive jobs do not all restart on the same modulo tick.</li>
<li>Before starting each noncritical task, the scheduler checks remaining tick CPU and stops launching noncritical work when headroom is below the local safety margin.</li>
</ol>
<p>This is a control policy, not an official Screeps recommendation. It also cannot guarantee that every critical task finishes: if your critical workload alone exceeds the available tick CPU, Screeps can still terminate execution. Put the scheduler early enough in the loop that critical work has a realistic chance to run.</p>

<h2 id="policy">Separate official CPU facts from policy</h2>
<p>The <a href="https://docs.screeps.com/api/#Game.cpu">official <code>Game.cpu</code> API</a> defines <code>bucket</code> as accumulated unused CPU, <code>tickLimit</code> as CPU available for the current tick, and <code>getUsed()</code> as CPU consumed since the beginning of the current tick. The <a href="https://docs.screeps.com/cpu-limit.html">official CPU limit guide</a> explains how unused baseline CPU accumulates in the bucket.</p>
<p>The thresholds below are local example values. They are not official recommendations and should be tuned for your CPU allocation, room count, combat state, and workload.</p>
<table>
<thead><tr><th>Policy</th><th>Example</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td>Enter conserve</td><td><code>bucket &lt; 7000</code> or used ratio ≥ 0.70</td><td>Start reducing noncritical work</td></tr>
<tr><td>Enter emergency</td><td><code>bucket ≤ 2000</code></td><td>Protect survival work aggressively</td></tr>
<tr><td>Hard emergency</td><td><code>bucket ≤ 500</code> or used ratio ≥ 0.90</td><td>Skip confirmation and enter immediately</td></tr>
<tr><td>Begin recovery</td><td><code>bucket ≥ 4500</code> and used ratio ≤ 0.55</td><td>Require sustained improvement before leaving emergency</td></tr>
<tr><td>Return to normal</td><td><code>bucket ≥ 8500</code> and used ratio ≤ 0.45</td><td>Require a larger recovery margin</td></tr>
<tr><td>Noncritical headroom</td><td>15% of <code>tickLimit</code></td><td>Do not start another noncritical task below this margin</td></tr>
</tbody>
</table>
<p>Here, <code>usedRatio</code> means <code>Game.cpu.getUsed() / Game.cpu.tickLimit</code> when the scheduler reads its initial metrics. It is not the final cost of the tick and it does not predict the cost of the next task. If you need to find which subsystem is expensive, use the separate <a href="/en/blog/screeps-cpu-getused-bucket">CPU measurement guide</a>.</p>

<h2 id="state-machine">Implement the four-mode state machine</h2>
<p>The state machine stores both the current mode and a candidate transition. A candidate only accumulates while the same desired mode remains valid. If metrics recover before confirmation completes, the candidate resets. Safety degradation is allowed immediately after its confirmation requirement; the minimum hold applies only to recovery-direction transitions so it never delays a necessary downgrade.</p>
<pre><code class="language-js">const CPU_MODE = Object.freeze({
  NORMAL: 'NORMAL',
  CONSERVE: 'CONSERVE',
  EMERGENCY: 'EMERGENCY',
  RECOVERY: 'RECOVERY'
});

const CPU_POLICY = Object.freeze({
  hardEmergencyBucket: 500,
  conserveBelow: 7000,
  emergencyBelow: 2000,
  recoveryAbove: 4500,
  normalAbove: 8500,
  conserveUsedRatio: 0.70,
  hardUsedRatio: 0.90,
  recoveryUsedRatio: 0.55,
  normalUsedRatio: 0.45,
  degradeConfirmTicks: 3,
  recoverConfirmTicks: 20,
  minimumModeTicks: 25,
  recoveryWarmupTicks: 50,
  nonCriticalHeadroom: 0.15,
  historyLimit: 20,
  failureLimit: 20
});

const MODE_SEVERITY = Object.freeze({
  [CPU_MODE.NORMAL]: 0,
  [CPU_MODE.RECOVERY]: 1,
  [CPU_MODE.CONSERVE]: 2,
  [CPU_MODE.EMERGENCY]: 3
});

function validMode(mode) {
  return Object.prototype.hasOwnProperty.call(MODE_SEVERITY, mode);
}

function normalizeCpuState(value, gameTime) {
  const source = value &amp;&amp; typeof value === 'object' ? value : {};
  const mode = validMode(source.mode) ? source.mode : CPU_MODE.NORMAL;

  return {
    mode,
    modeSince: Number.isInteger(source.modeSince)
      ? source.modeSince
      : gameTime,
    candidateMode: validMode(source.candidateMode)
      ? source.candidateMode
      : null,
    candidateTicks:
      Number.isInteger(source.candidateTicks) &amp;&amp; source.candidateTicks &gt;= 0
        ? source.candidateTicks
        : 0
  };
}

function selectDesiredCpuMode(state, metrics, policy = CPU_POLICY) {
  const { bucket, usedRatio } = metrics;

  if (
    !Number.isFinite(bucket)
    || !Number.isFinite(usedRatio)
    || usedRatio &lt; 0
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'invalid-cpu-metrics',
      immediate: true
    };
  }

  if (
    bucket &lt;= policy.hardEmergencyBucket
    || usedRatio &gt;= policy.hardUsedRatio
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'hard-cpu-risk',
      immediate: true
    };
  }

  if (bucket &lt;= policy.emergencyBelow) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'bucket-emergency',
      immediate: false
    };
  }

  switch (state.mode) {
    case CPU_MODE.NORMAL:
      return (
        bucket &lt; policy.conserveBelow
        || usedRatio &gt;= policy.conserveUsedRatio
      )
        ? {
            mode: CPU_MODE.CONSERVE,
            reason: 'conserve-threshold',
            immediate: false
          }
        : {
            mode: CPU_MODE.NORMAL,
            reason: 'healthy',
            immediate: false
          };

    case CPU_MODE.CONSERVE:
      return (
        bucket &gt;= policy.normalAbove
        &amp;&amp; usedRatio &lt;= policy.normalUsedRatio
      )
        ? {
            mode: CPU_MODE.NORMAL,
            reason: 'normal-threshold',
            immediate: false
          }
        : {
            mode: CPU_MODE.CONSERVE,
            reason: 'conserve-hold',
            immediate: false
          };

    case CPU_MODE.EMERGENCY:
      return (
        bucket &gt;= policy.recoveryAbove
        &amp;&amp; usedRatio &lt;= policy.recoveryUsedRatio
      )
        ? {
            mode: CPU_MODE.RECOVERY,
            reason: 'recovery-threshold',
            immediate: false
          }
        : {
            mode: CPU_MODE.EMERGENCY,
            reason: 'emergency-hold',
            immediate: false
          };

    case CPU_MODE.RECOVERY:
      if (
        bucket &lt; policy.conserveBelow
        || usedRatio &gt;= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: 'recovery-regressed',
          immediate: false
        };
      }

      return (
        bucket &gt;= policy.normalAbove
        &amp;&amp; usedRatio &lt;= policy.normalUsedRatio
      )
        ? {
            mode: CPU_MODE.NORMAL,
            reason: 'recovery-complete',
            immediate: false
          }
        : {
            mode: CPU_MODE.RECOVERY,
            reason: 'recovery-hold',
            immediate: false
          };

    default:
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: 'invalid-state-mode',
        immediate: true
      };
  }
}

function updateCpuMode(previous, metrics, gameTime, policy = CPU_POLICY) {
  const state = normalizeCpuState(previous, gameTime);
  const desired = selectDesiredCpuMode(state, metrics, policy);

  if (desired.mode === state.mode) {
    return {
      ...state,
      candidateMode: null,
      candidateTicks: 0,
      changed: false,
      reason: desired.reason
    };
  }

  if (desired.immediate) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  const candidateTicks =
    state.candidateMode === desired.mode
      ? state.candidateTicks + 1
      : 1;
  const degrading =
    MODE_SEVERITY[desired.mode] &gt; MODE_SEVERITY[state.mode];
  const requiredTicks = degrading
    ? policy.degradeConfirmTicks
    : policy.recoverConfirmTicks;
  const heldLongEnough =
    degrading
    || gameTime - state.modeSince &gt;= policy.minimumModeTicks;

  if (
    candidateTicks &gt;= requiredTicks
    &amp;&amp; heldLongEnough
  ) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  return {
    ...state,
    candidateMode: desired.mode,
    candidateTicks,
    changed: false,
    reason: 'confirm-' + desired.reason
  };
}</code></pre>
<p>This produces asymmetric behavior on purpose: a hard risk can move directly to <code>EMERGENCY</code>; ordinary degradation confirms quickly; recovery confirms slowly and cannot leave a mode before the recovery hold is satisfied. That makes flapping less likely without making safety degradation wait for a recovery timer.</p>

<h2 id="scheduler">Schedule task tiers with headroom</h2>
<p>The state machine decides the operating mode. The scheduler below turns that mode into actual task behavior. It validates tasks before sorting, sorts critical work first, applies per-mode intervals, calculates stable offsets, checks live remaining CPU before each noncritical task, and isolates one task's exception from the rest of the queue.</p>
<pre><code class="language-js">const TASK_TIER = Object.freeze({
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  OPTIONAL: 'optional'
});

const TIER_ORDER = Object.freeze({
  [TASK_TIER.CRITICAL]: 0,
  [TASK_TIER.IMPORTANT]: 1,
  [TASK_TIER.OPTIONAL]: 2
});

function readCpuMetrics() {
  const used = Game.cpu.getUsed();
  const tickLimit = Game.cpu.tickLimit;

  return {
    bucket: Game.cpu.bucket,
    used,
    tickLimit,
    usedRatio:
      Number.isFinite(tickLimit) &amp;&amp; tickLimit &gt; 0
        ? used / tickLimit
        : Number.POSITIVE_INFINITY
  };
}

function pushBounded(list, value, limit) {
  list.push(value);
  while (list.length &gt; limit) list.shift();
}

function getSchedulerState() {
  if (
    !Memory.cpuScheduler
    || typeof Memory.cpuScheduler !== 'object'
  ) {
    Memory.cpuScheduler = {};
  }

  const state = Memory.cpuScheduler;
  const normalized = normalizeCpuState(state, Game.time);

  state.mode = normalized.mode;
  state.modeSince = normalized.modeSince;
  state.candidateMode = normalized.candidateMode;
  state.candidateTicks = normalized.candidateTicks;

  if (!Array.isArray(state.transitions)) state.transitions = [];
  if (!Array.isArray(state.failures)) state.failures = [];

  return state;
}

function taskIntervalFor(
  mode,
  tier,
  baseInterval,
  recoveryAge,
  policy = CPU_POLICY
) {
  if (!Number.isInteger(baseInterval) || baseInterval &lt; 1) {
    return null;
  }

  if (tier === TASK_TIER.CRITICAL) {
    return baseInterval;
  }

  if (tier === TASK_TIER.IMPORTANT) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) {
      return Math.max(baseInterval, 2);
    }
    if (mode === CPU_MODE.EMERGENCY) {
      return Math.max(baseInterval, 10);
    }
    if (mode === CPU_MODE.RECOVERY) {
      return Math.max(baseInterval, 2);
    }
    return null;
  }

  if (tier === TASK_TIER.OPTIONAL) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) {
      return Math.max(baseInterval, 20);
    }
    if (mode === CPU_MODE.EMERGENCY) return null;
    if (mode === CPU_MODE.RECOVERY) {
      if (recoveryAge &lt; policy.recoveryWarmupTicks) {
        return null;
      }
      return Math.max(baseInterval, 10);
    }
  }

  return null;
}

function hashTaskName(name) {
  let value = 0;
  for (let index = 0; index &lt; name.length; index += 1) {
    value = (value * 31 + name.charCodeAt(index)) &gt;&gt;&gt; 0;
  }
  return value;
}

function taskOffsetFor(name, interval) {
  if (
    typeof name !== 'string'
    || !Number.isInteger(interval)
    || interval &lt; 1
  ) {
    return null;
  }
  return hashTaskName(name) % interval;
}

function isCadenceTick(name, interval, gameTime = Game.time) {
  if (interval === 1) return true;
  const offset = taskOffsetFor(name, interval);
  return offset !== null &amp;&amp; gameTime % interval === offset;
}

function remainingCpuRatio() {
  const tickLimit = Game.cpu.tickLimit;
  if (!Number.isFinite(tickLimit) || tickLimit &lt;= 0) {
    return 0;
  }

  return Math.max(
    0,
    (tickLimit - Game.cpu.getUsed()) / tickLimit
  );
}

function hasNonCriticalHeadroom(policy = CPU_POLICY) {
  return remainingCpuRatio() &gt;= policy.nonCriticalHeadroom;
}

function isValidTask(task) {
  return Boolean(task)
    &amp;&amp; typeof task.name === 'string'
    &amp;&amp; task.name.length &gt; 0
    &amp;&amp; typeof task.run === 'function'
    &amp;&amp; Object.prototype.hasOwnProperty.call(
      TIER_ORDER,
      task.tier
    );
}

function partitionTasks(tasks) {
  const results = [];
  const validTasks = [];
  const rawTasks = Array.isArray(tasks) ? tasks : [];

  if (!Array.isArray(tasks)) {
    results.push({
      name: null,
      status: 'invalid-task-list'
    });
  }

  for (const task of rawTasks) {
    if (!isValidTask(task)) {
      results.push({
        name:
          task &amp;&amp; typeof task.name === 'string'
            ? task.name
            : null,
        status: 'invalid-task'
      });
      continue;
    }
    validTasks.push(task);
  }

  validTasks.sort(
    (left, right) =&gt;
      TIER_ORDER[left.tier] - TIER_ORDER[right.tier]
      || left.name.localeCompare(right.name)
  );

  return { results, validTasks };
}

function runOneTask(task, context, state) {
  const start = Game.cpu.getUsed();

  try {
    const value = task.run(context);
    return {
      name: task.name,
      tier: task.tier,
      status: 'ran',
      used: Game.cpu.getUsed() - start,
      value
    };
  } catch (error) {
    const failure = {
      tick: Game.time,
      name: task.name,
      tier: task.tier,
      message:
        error instanceof Error
          ? error.message.slice(0, 300)
          : String(error).slice(0, 300)
    };

    pushBounded(
      state.failures,
      failure,
      CPU_POLICY.failureLimit
    );

    return {
      name: task.name,
      tier: task.tier,
      status: 'failed',
      used: Game.cpu.getUsed() - start,
      failure
    };
  }
}

function runCpuScheduler(tasks) {
  const state = getSchedulerState();
  const previousMode = state.mode;
  const metrics = readCpuMetrics();
  const next = updateCpuMode(
    state,
    metrics,
    Game.time
  );

  state.mode = next.mode;
  state.modeSince = next.modeSince;
  state.candidateMode = next.candidateMode;
  state.candidateTicks = next.candidateTicks;

  if (next.changed) {
    const transition = {
      tick: Game.time,
      from: previousMode,
      to: next.mode,
      reason: next.reason,
      bucket: metrics.bucket,
      usedRatio: metrics.usedRatio
    };

    pushBounded(
      state.transitions,
      transition,
      CPU_POLICY.historyLimit
    );
    state.lastTransition = transition;
    state.pendingNotification = transition;
  }

  const recoveryAge =
    state.mode === CPU_MODE.RECOVERY
      ? Game.time - state.modeSince
      : 0;
  const partitioned = partitionTasks(tasks);
  const results = [...partitioned.results];

  for (const task of partitioned.validTasks) {
    const interval = taskIntervalFor(
      state.mode,
      task.tier,
      task.interval ?? 1,
      recoveryAge
    );

    if (interval === null) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'disabled-by-mode'
      });
      continue;
    }

    if (!isCadenceTick(task.name, interval)) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'waiting-for-cadence',
        interval,
        offset: taskOffsetFor(task.name, interval)
      });
      continue;
    }

    if (
      task.tier !== TASK_TIER.CRITICAL
      &amp;&amp; !hasNonCriticalHeadroom()
    ) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'insufficient-headroom'
      });
      continue;
    }

    results.push(
      runOneTask(
        task,
        {
          mode: state.mode,
          metrics,
          recoveryAge
        },
        state
      )
    );
  }

  state.lastTick = {
    tick: Game.time,
    mode: state.mode,
    bucketBefore: metrics.bucket,
    usedBefore: metrics.used,
    usedAfter: Game.cpu.getUsed(),
    resultCount: results.length
  };

  return {
    mode: state.mode,
    changed: next.changed,
    reason: next.reason,
    metrics,
    results
  };
}

module.exports = {
  CPU_MODE,
  CPU_POLICY,
  TASK_TIER,
  runCpuScheduler,
  selectDesiredCpuMode,
  updateCpuMode,
  taskIntervalFor,
  taskOffsetFor,
  isCadenceTick,
  remainingCpuRatio,
  hasNonCriticalHeadroom,
  isValidTask,
  partitionTasks
};</code></pre>
<p>The mode intervals are intentionally easy to audit: critical tasks keep their configured interval; important work is at least every 2 ticks in <code>CONSERVE</code>, every 10 ticks in <code>EMERGENCY</code>, and every 2 ticks in <code>RECOVERY</code>; optional work is at least every 20 ticks in <code>CONSERVE</code>, disabled in <code>EMERGENCY</code>, disabled during the recovery warm-up, and then restored at no faster than every 10 ticks.</p>
<p>Stable staggering is deterministic rather than random. The same task name and interval always produce the same offset. That makes load distribution repeatable and debuggable while avoiding the common <code>Game.time % 100 === 0</code> pile-up.</p>
<p>The headroom guard is also deliberately narrow. It only decides whether to <em>start</em> the next noncritical task. It cannot predict that task's final cost, reserve CPU, or undo CPU already spent. This is why critical work is sorted first and why expensive critical modules still need their own cost controls.</p>

<h2 id="integration">Wire the scheduler into your loop</h2>
<p>Put real business modules behind task callbacks. The names below are interfaces, not built-in Screeps modules; replace them with your own files. The important boundary is ownership: the CPU scheduler decides <em>whether now is an allowed time to start a task</em>, while Spawn, defense, harvesting, economy, and market modules keep their own game logic.</p>
<pre><code class="language-js">const cpuScheduler = require('cpu.scheduler');
const spawnEmergency = require('spawn.emergency');
const spawnManager = require('spawn.manager');
const defenseManager = require('defense.manager');
const creepManager = require('creep.manager');
const roomEconomy = require('room.economy');
const marketScanner = require('market.scanner');
const pathPlanner = require('path.planner');
const roomVisuals = require('room.visuals');

module.exports.loop = function () {
  const summary = cpuScheduler.runCpuScheduler([
    {
      name: 'spawn-emergency',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () =&gt; spawnEmergency.run()
    },
    {
      name: 'spawn-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () =&gt; spawnManager.run()
    },
    {
      name: 'defense-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () =&gt; defenseManager.run()
    },
    {
      name: 'creep-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () =&gt; creepManager.run()
    },
    {
      name: 'room-economy',
      tier: cpuScheduler.TASK_TIER.IMPORTANT,
      interval: 1,
      run: () =&gt; roomEconomy.run()
    },
    {
      name: 'market-scan',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 50,
      run: () =&gt; marketScanner.run()
    },
    {
      name: 'path-planner',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 100,
      run: () =&gt; pathPlanner.run()
    },
    {
      name: 'room-visuals',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 1,
      run: () =&gt; roomVisuals.run()
    }
  ]);

  if (summary.changed || Game.time % 100 === 0) {
    console.log(JSON.stringify({
      type: 'cpu-scheduler',
      tick: Game.time,
      mode: summary.mode,
      reason: summary.reason,
      bucket: summary.metrics.bucket,
      usedRatio: summary.metrics.usedRatio,
      results: summary.results
    }));
  }
};</code></pre>
<p>A transition such as <code>NORMAL → CONSERVE</code> is worth recording once. Do not send a notification every tick just because the bucket remains low. If you want external alerts, route the saved transition through the <a href="/en/blog/screeps-game-notify">Game.notify() guide</a> and apply its rate-limiting pattern.</p>

<h2 id="failures">Understand the failure modes</h2>
<ul>
<li><strong>The scheduler runs too late.</strong> A headroom check cannot protect CPU already spent before the scheduler starts. Run critical orchestration early.</li>
<li><strong>A task is misclassified.</strong> A remote-intelligence job that is optional in peace may become critical during combat. Tiers are local policy and can change with game state.</li>
<li><strong>Critical work is itself too expensive.</strong> Degradation only sheds lower-tier load. If critical modules exceed <code>tickLimit</code>, profile and redesign those modules.</li>
<li><strong>A malformed task reaches the queue.</strong> The implementation partitions invalid entries before sorting, so <code>null</code>, missing names, missing callbacks, and unknown tiers cannot crash the comparator before critical work runs.</li>
<li><strong>A valid task throws.</strong> The scheduler records a bounded failure and continues. That isolates the queue; it does not fix the task. Repeated critical failures still need diagnosis.</li>
<li><strong>Recovery keeps regressing.</strong> If <code>RECOVERY</code> repeatedly returns to <code>CONSERVE</code>, the restored workload is still too expensive or the thresholds are too aggressive for the current account state.</li>
</ul>

<h2 id="evidence">Verify the English implementation</h2>
<p>The deterministic harness now extracts the JavaScript directly from this English page before running it. Thirty-eight offline cases cover degradation confirmation, recovery confirmation, minimum recovery hold, candidate reset, hard emergency, recovery regression, all four mode transitions, task intervals, stable offsets and cadence, malformed-task isolation, critical-first ordering, headroom cutoff, critical execution below the noncritical headroom threshold, and task-exception isolation. The same harness syntax-checks every English JavaScript block before executing the scheduler core.</p>
<p>Offline execution proves control-flow behavior under mocked <code>Game.cpu</code>, <code>Game.time</code>, and <code>Memory</code>. It does not reproduce Screeps CPU units or prove that a real shard's bucket will recover.</p>
<p>After deploying a policy like this in your own code, measure both CPU and room behavior. Track bucket direction, rolling CPU average and peaks, mode-transition frequency, critical-task failures, and whether Spawn, harvesting, Controller safety, and defense continue to work. A rising bucket is CPU evidence; it is not proof that room behavior is correct.</p>

<h2 id="boundaries">Know the operating boundaries</h2>
<p>This guide provides a single-shard, account-level load-shedding pattern. It does not cover multi-shard CPU allocation, exact next-task cost prediction, private-server CPU settings, V8 heap analysis, dynamic combat tier promotion, or the internal optimization of every business module.</p>
<p>Console testing and live official-shard observation are still pending. No live bucket recovery, multi-room cost, combat-load result, or room-behavior result is claimed here. If <code>EMERGENCY</code> persists, continue profiling the expensive modules instead of weakening more survival logic.</p>
`;

export default function CpuBucketDegradationPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
        { "@type": "ListItem", position: 3, name: headline, item: articleUrl },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="CPU degradation"
      category="OPERATIONS · CPU DEGRADATION"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="22 min read"
      tags={["CPU", "Debugging", "JavaScript"]}
      verification={[
        { term: "Documentation", value: "Official Game.cpu and CPU limit references checked" },
        { term: "Syntax", value: "English-visible JavaScript blocks checked offline" },
        { term: "Offline cases", value: "38 deterministic English scheduler cases passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
