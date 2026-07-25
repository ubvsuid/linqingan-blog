import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishControllerDowngradeArticle = {
  slug: "screeps-controller-downgrade",
  path: "/en/blog/screeps-controller-downgrade",
  chinesePath: "/blog/screeps-controller-downgrade",
  title: "Screeps Controller Downgrade: Monitoring and Emergency Upgrading",
  headline: "How to Detect Controller Downgrade Risk and Recover Safely",
  description:
    "Compare ticksToDowngrade with configurable enter and recovery thresholds, use CONTROLLER_DOWNGRADE for context, select an owned ready Upgrader with Energy and active WORK, move to range 3, save upgradeController() results, and exit emergency mode only after recovery.",
  category: "CONTROLLER · DOWNGRADE RECOVERY",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Controller Downgrade",
  tags: ["Screeps", "Controller", "Downgrade", "Upgrader", "Recovery"],
  keywords: [
    "Screeps Controller downgrade",
    "Screeps ticksToDowngrade",
    "Screeps CONTROLLER_DOWNGRADE",
    "Screeps emergency upgrader",
    "Screeps upgradeController range 3",
  ],
  primaryKeyword: "Screeps Controller downgrade",
  searchIntent: "Enter and leave an emergency Controller upgrading state without threshold flapping",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — ticksToDowngrade, CONTROLLER_DOWNGRADE, upgradeController(), range and return codes"],
    ["Threshold boundary", "Emergency and recovery thresholds plus the upgrader role name are project policies, not official safety values"],
    ["Execution boundary", "OK schedules upgrading; progress and downgrade timer recovery require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline recovery review", "Passed — ownership, timer, threshold validity, hysteresis, Upgrader Energy, active WORK and range states"],
    ["Screeps Console test", "Pending"],
    ["Live downgrade timer, recovery hysteresis, upgrader supply and Controller progress test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["three-values", "Separate level, current timer, and maximum timer"],
    ["thresholds", "Use enter and recovery thresholds"],
    ["risk-plan", "Build a testable risk state"],
    ["upgrader", "Select a ready emergency Upgrader"],
    ["complete-example", "Complete Controller safety example"],
    ["hysteresis", "Avoid threshold flapping"],
    ["no-upgrader", "Record missing recovery capacity"],
    ["after-ok", "Verify timer recovery later"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "What does ticksToDowngrade represent?",
      "It is the current remaining tick count before the owned Controller loses a level if it is not refreshed through upgrading.",
    ],
    [
      "Why use two thresholds?",
      "A lower entry threshold and higher recovery threshold keep emergency mode active until the Controller reaches a safer state instead of toggling around one boundary.",
    ],
    [
      "Is 5,000 ticks an official emergency line?",
      "No. The threshold must reflect room income, Upgrader capacity, distance and recovery time.",
    ],
    [
      "Does OK immediately change ticksToDowngrade?",
      "It schedules the upgrade action. Read the Controller again later rather than writing a predicted timer value.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-controller-activate-safe-mode",
    label: "Previous Controller guide",
    title: "Activate Safe Mode Safely",
  },
  next: {
    href: "/en/blog/screeps-reserve-vs-claim-controller",
    label: "Next Controller guide",
    title: "Choose Reserve or Claim",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Read the owned Controller's current <code>ticksToDowngrade</code>, enter emergency mode only below a configured threshold, remain in that mode until a higher recovery threshold is reached, select a non-spawning Upgrader with Energy and active <code>WORK</code>, call <code>upgradeController()</code> or move to range 3, save every result, and re-read the Controller timer later.</p>

<h2 id="three-values">Separate level, current timer, and maximum timer</h2>
<ul>
<li><code>controller.level</code> is current RCL.</li>
<li><code>controller.ticksToDowngrade</code> is current remaining time.</li>
<li><code>CONTROLLER_DOWNGRADE[controller.level]</code> is the level's maximum timer context.</li>
</ul>
<pre><code class="language-javascript">function getControllerDowngradeRatio(controller) {
  const maximum = controller
    ? CONTROLLER_DOWNGRADE[controller.level]
    : null;

  if (
    !Number.isFinite(maximum)
    || maximum <= 0
    || !Number.isFinite(controller.ticksToDowngrade)
  ) {
    return null;
  }

  return controller.ticksToDowngrade / maximum;
}</code></pre>
<p>The constant table is not current state. Use the live timer for the decision and the table only for context or a ratio.</p>

<h2 id="thresholds">Use enter and recovery thresholds</h2>
<pre><code class="language-javascript">Memory.controllerSafety ??= {};
Memory.controllerSafety.W1N1 = {
  enabled: true,
  emergencyThreshold: 5000,
  recoveryThreshold: 10000,
  emergencyActive: false
};</code></pre>
<p>Both values are examples. The recovery value must be greater than the entry value so the system does not repeatedly enter and leave emergency mode near one number.</p>

<h2 id="risk-plan">Build a testable risk state</h2>
<pre><code class="language-javascript">function evaluateDowngradeRisk(input) {
  if (
    input.owned !== true
    || !Number.isFinite(input.ticksToDowngrade)
  ) {
    return {
      active: false,
      reason: 'controller-unavailable'
    };
  }

  if (
    !Number.isFinite(input.emergencyThreshold)
    || !Number.isFinite(input.recoveryThreshold)
    || input.emergencyThreshold <= 0
    || input.recoveryThreshold
      <= input.emergencyThreshold
  ) {
    return {
      active: false,
      reason: 'invalid-thresholds'
    };
  }

  if (input.emergencyActive === true) {
    return input.ticksToDowngrade
      >= input.recoveryThreshold
      ? { active: false, reason: 'recovered' }
      : { active: true, reason: 'risk-continues' };
  }

  return input.ticksToDowngrade
    < input.emergencyThreshold
    ? { active: true, reason: 'risk-entered' }
    : { active: false, reason: 'normal' };
}</code></pre>

<h2 id="upgrader">Select a ready emergency Upgrader</h2>
<pre><code class="language-javascript">function selectEmergencyUpgrader(room, controller) {
  const candidates = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.memory?.role === 'upgrader'
      && creep.spawning !== true
      && creep.store.getUsedCapacity(
        RESOURCE_ENERGY
      ) > 0
      && creep.getActiveBodyparts(WORK) > 0
  });

  return candidates.sort((left, right) => {
    const energyDifference =
      right.store.getUsedCapacity(RESOURCE_ENERGY)
      - left.store.getUsedCapacity(RESOURCE_ENERGY);

    if (energyDifference !== 0) {
      return energyDifference;
    }

    const rangeDifference =
      left.pos.getRangeTo(controller)
      - right.pos.getRangeTo(controller);

    if (rangeDifference !== 0) {
      return rangeDifference;
    }

    return left.name.localeCompare(right.name);
  })[0] || null;
}</code></pre>
<p>The role name is custom Memory. A room using different role identifiers must replace it or select from an explicit task queue.</p>

<h2 id="complete-example">Complete Controller safety example</h2>
<pre><code class="language-javascript">function runControllerSafety(room) {
  const controller = room?.controller || null;
  const config = room
    ? Memory.controllerSafety?.[room.name]
    : null;

  if (
    !controller
    || controller.my !== true
    || !config
    || config.enabled !== true
  ) {
    return { status: 'disabled-or-unavailable' };
  }

  config.emergencyActive ??= false;
  const decision = evaluateDowngradeRisk({
    owned: controller.my,
    ticksToDowngrade: controller.ticksToDowngrade,
    emergencyThreshold: config.emergencyThreshold,
    recoveryThreshold: config.recoveryThreshold,
    emergencyActive: config.emergencyActive
  });

  config.emergencyActive = decision.active;
  config.lastReason = decision.reason;
  config.lastCheckedAt = Game.time;
  config.lastTicksToDowngrade =
    controller.ticksToDowngrade;
  config.lastRatio = getControllerDowngradeRatio(
    controller
  );

  if (!decision.active) {
    return { status: decision.reason };
  }

  const upgrader = selectEmergencyUpgrader(
    room,
    controller
  );
  if (!upgrader) {
    config.lastAction = 'no-ready-upgrader';
    return { status: 'no-ready-upgrader' };
  }

  const before = {
    gameTick: Game.time,
    creepName: upgrader.name,
    energy: upgrader.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    activeWork: upgrader.getActiveBodyparts(WORK),
    range: upgrader.pos.getRangeTo(controller),
    ticksToDowngrade: controller.ticksToDowngrade,
    progress: controller.progress
  };
  const result = upgrader.upgradeController(
    controller
  );

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = upgrader.moveTo(controller, {
      range: 3,
      reusePath: 5
    });
    config.lastAction = 'moving-to-controller';
    config.lastMoveResult = moveResult;
    config.lastBefore = before;
    return {
      status: 'moving-to-controller',
      result,
      moveResult,
      before
    };
  }

  config.lastBefore = before;
  config.lastResult = result;
  config.lastResultAt = Game.time;
  config.lastAction = result === OK
    ? 'upgrade-scheduled'
    : 'upgrade-rejected';

  return {
    status: config.lastAction,
    result,
    before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const outcome = runControllerSafety(room);
  if (
    outcome.status === 'upgrade-rejected'
    || outcome.status === 'no-ready-upgrader'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'controller-downgrade-safety',
      roomName: room.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="hysteresis">Avoid threshold flapping</h2>
<p>With one threshold, a small upgrade can end emergency mode and the next timer decrease can immediately restart it. A higher recovery threshold keeps the priority active until more safety margin is restored.</p>
<pre><code class="language-javascript">function thresholdsAreValid(enter, recover) {
  return Number.isFinite(enter)
    && Number.isFinite(recover)
    && enter > 0
    && recover > enter;
}</code></pre>

<h2 id="no-upgrader">Record missing recovery capacity</h2>
<p><code>no-ready-upgrader</code> is a diagnosis, not a fix. The room may need spawning, Energy delivery, body recovery, Controller Link supply or task reassignment. This guide does not silently spawn a new Creep because that requires a separate room survival policy.</p>

<h2 id="after-ok">Verify timer recovery later</h2>
<p>Read <code>controller.ticksToDowngrade</code> and <code>controller.progress</code> again. Do not write a predicted timer into Memory. Other Upgraders or power effects can also change the observed state.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical cause</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Upgrade scheduled</td><td>Timer and progress later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Creep or Controller ownership</td><td>Current objects</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep spawning</td><td>Wait</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>No Creep Energy</td><td>Supply chain</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Invalid Controller</td><td>Current room state</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Beyond range 3</td><td>Move to range 3</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active WORK</td><td>Body damage</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require a visible owned Controller.</li>
<li>Read current timer and level.</li>
<li>Validate enter and recovery thresholds.</li>
<li>Keep emergency state in Memory.</li>
<li>Select a ready Upgrader with Energy.</li>
<li>Count active WORK parts.</li>
<li>Move to range 3 only on the range error.</li>
<li>Save before state and return code.</li>
<li>Record missing Upgrader capacity.</li>
<li>Verify timer and progress later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not spawn emergency workers, repair an Energy economy, prioritize multiple rooms, operate Controller powers or predict exact timer restoration. Continue with <a href="/en/blog/screeps-reserve-vs-claim-controller">Reserve versus Claim missions</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why select more Energy before shorter range?</h3>
<p>It favors the Creep able to sustain more emergency upgrades. Your room can reverse those priorities if travel time is more important.</p>
<h3>Why use an enabled switch?</h3>
<p>It lets rooms opt into the policy explicitly and preserves diagnostics without forcing every owned Controller into the same thresholds.</p>
<h3>Can RCL 8 still need upgrading?</h3>
<p>Yes. Upgrading continues to maintain the Controller timer and contributes to GCL even after room level progress is complete.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureController" rel="nofollow">API Reference: StructureController</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow">API Reference: upgradeController()</a></li>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow">Screeps Documentation: Control</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">API Reference: CONTROLLER_DOWNGRADE</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
