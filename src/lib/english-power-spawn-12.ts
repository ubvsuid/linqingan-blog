import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishPowerSpawnArticle = {
  slug: "screeps-power-spawn-process-power",
  path: "/en/blog/screeps-power-spawn-process-power",
  chinesePath: "/blog/screeps-power-spawn-process-power",
  title: "Screeps processPower(): Energy Ratio, GPL, and Reserves",
  headline: "How to Process Power Without Breaking Your Energy Budget",
  description:
    "Recover an owned active Power Spawn, calculate base and PWR_OPERATE_POWER processing amounts, require Power and POWER_SPAWN_ENERGY_RATIO Energy, preserve a configurable room reserve, store GPL and resource snapshots, handle return codes, and verify later deltas.",
  category: "RESOURCES · POWER PROCESSING",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Power Processing",
  tags: ["Screeps", "Power Spawn", "Power", "GPL", "Energy"],
  keywords: [
    "Screeps StructurePowerSpawn processPower",
    "Screeps POWER_SPAWN_ENERGY_RATIO",
    "Screeps PWR_OPERATE_POWER",
    "Screeps Game.gpl progress",
    "Screeps Power Spawn energy reserve",
  ],
  primaryKeyword: "Screeps StructurePowerSpawn processPower",
  searchIntent: "Process Power continuously with explicit resource and room Energy safeguards",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — processPower(), POWER_SPAWN_ENERGY_RATIO, PWR_OPERATE_POWER, POWER_INFO, Game.gpl and return codes"],
    ["Policy boundary", "The room Energy reserve is a configurable site strategy, not an official threshold"],
    ["Execution boundary", "OK schedules processing; GPL, Power and Energy deltas require later verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline power review", "Passed — enabled state, effect amount, Power stock, local Energy, room reserve and before/after snapshot states"],
    ["Screeps Console test", "Pending"],
    ["Live GPL, Store, effect level and continuous processing test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["base-ratio", "Calculate the base processing ratio"],
    ["operate-power", "Read PWR_OPERATE_POWER safely"],
    ["enabled-state", "Use an explicit long-running switch"],
    ["room-budget", "Protect a room Energy reserve"],
    ["pure-plan", "Build a testable processing plan"],
    ["complete-example", "Complete controlled processing example"],
    ["after-ok", "Verify GPL and Store deltas"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How much Energy does base Power processing use?",
      "Calculate it with plannedPower multiplied by POWER_SPAWN_ENERGY_RATIO. The current official ratio is available through the game constant rather than a copied business value.",
    ],
    [
      "Should processPower() use a one-time request?",
      "Not necessarily. It is normally continuous production, so this guide uses an explicit enabled switch and repeats preflight checks every tick.",
    ],
    [
      "What does PWR_OPERATE_POWER change?",
      "It increases the amount of Power that the Power Spawn can process per tick. Read the active effect and current POWER_INFO rather than hard-coding a level table.",
    ],
    [
      "Does OK prove GPL progress already changed?",
      "No. Save Game.gpl.progress and Store snapshots, then compare later state while accounting for other processing operations.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-storage-energy-usage",
    label: "Previous logistics guide",
    title: "Use Storage Energy Safely",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Recover the configured owned active Power Spawn, keep processing behind an explicit <code>enabled</code> switch, determine the planned Power amount from the base rate and active <code>PWR_OPERATE_POWER</code> effect, require enough <code>RESOURCE_POWER</code> and <code>plannedPower * POWER_SPAWN_ENERGY_RATIO</code> Energy, protect a configurable room Energy reserve, save <code>Game.gpl.progress</code> and Store snapshots, call <code>processPower()</code>, and verify later deltas instead of treating <code>OK</code> as completed processing.</p>

<h2 id="base-ratio">Calculate the base processing ratio</h2>
<p>Without an active speed effect, one normal call processes the base amount. Use the official Energy ratio constant for the resource budget:</p>
<pre><code class="language-javascript">function getPowerProcessingEnergy(plannedPower) {
  if (
    !Number.isInteger(plannedPower)
    || plannedPower &lt;= 0
  ) {
    return null;
  }

  return plannedPower * POWER_SPAWN_ENERGY_RATIO;
}</code></pre>
<p>Keeping the ratio in one constant-backed calculation prevents an old copied number from drifting away from the game data.</p>

<h2 id="operate-power">Read PWR_OPERATE_POWER safely</h2>
<pre><code class="language-javascript">function getOperatePowerEffect(powerSpawn) {
  const effects = Array.isArray(powerSpawn?.effects)
    ? powerSpawn.effects
    : [];

  return effects.find(effect =>
    effect.effect === PWR_OPERATE_POWER
  ) || null;
}</code></pre>
<pre><code class="language-javascript">function getPlannedPowerAmount(powerSpawn) {
  const effect = getOperatePowerEffect(powerSpawn);

  if (!effect || !Number.isInteger(effect.level)) {
    return 1;
  }

  const values = POWER_INFO[PWR_OPERATE_POWER]?.effect;
  const extra = Array.isArray(values)
    ? values[effect.level - 1]
    : null;

  return Number.isFinite(extra)
    ? 1 + extra
    : 1;
}</code></pre>
<p>The base amount remains one, and the current effect contributes additional processing capacity. If the effect or current <code>POWER_INFO</code> shape is unavailable, the function falls back to the base plan and still trusts the official return code.</p>

<h2 id="enabled-state">Use an explicit long-running switch</h2>
<p>Power processing is different from an irreversible market purchase. It is usually a repeated production task, so an explicit persistent switch is appropriate:</p>
<pre><code class="language-javascript">Memory.powerProcessing = {
  enabled: true,
  powerSpawnId: 'replace-with-power-spawn-id',
  energyReserve: 100000
};</code></pre>
<p>The switch does not bypass checks. Every tick still refreshes the structure, effect, Power, local Energy, room stock and reserve. Set <code>enabled</code> to false to stop further calls.</p>

<h2 id="room-budget">Protect a room Energy reserve</h2>
<p>Checking only the Power Spawn's local Energy answers whether the next call can execute, but not whether the room should spend that Energy. This simple budget counts Storage, Terminal and Power Spawn Energy:</p>
<pre><code class="language-javascript">function getRoomEnergyStock(room, powerSpawn) {
  const storageEnergy = room.storage
    ? room.storage.store.getUsedCapacity(
        RESOURCE_ENERGY
      )
    : 0;
  const terminalEnergy = room.terminal
    ? room.terminal.store.getUsedCapacity(
        RESOURCE_ENERGY
      )
    : 0;
  const localEnergy = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  return storageEnergy + terminalEnergy + localEnergy;
}</code></pre>
<p><code>room.powerSpawn</code> is not a standard Room property. Recover the structure by ID and pass it explicitly. The reserve protects other room needs such as spawning, defense, upgrading, Terminal transfers, Labs and Factory production.</p>

<h2 id="pure-plan">Build a testable processing plan</h2>
<pre><code class="language-javascript">function evaluatePowerProcessing(input) {
  if (input.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    !Number.isInteger(input.plannedPower)
    || input.plannedPower &lt;= 0
  ) {
    return { ready: false, reason: 'invalid-plan' };
  }

  const energyRequired = getPowerProcessingEnergy(
    input.plannedPower
  );
  if (!Number.isFinite(energyRequired)) {
    return { ready: false, reason: 'invalid-energy-plan' };
  }

  if (input.powerAvailable &lt; input.plannedPower) {
    return {
      ready: false,
      reason: 'power-shortage',
      powerRequired: input.plannedPower
    };
  }

  if (input.localEnergy &lt; energyRequired) {
    return {
      ready: false,
      reason: 'power-spawn-energy-shortage',
      energyRequired
    };
  }

  const reserve = Number.isFinite(input.energyReserve)
    ? Math.max(0, input.energyReserve)
    : 0;
  if (input.roomEnergyStock - energyRequired &lt; reserve) {
    return {
      ready: false,
      reason: 'room-energy-reserve',
      energyRequired,
      reserve
    };
  }

  return {
    ready: true,
    reason: 'ready',
    plannedPower: input.plannedPower,
    energyRequired,
    roomEnergyAfter:
      input.roomEnergyStock - energyRequired
  };
}</code></pre>
<p>The reserve is a site strategy. The official API does not choose whether the room can economically afford the processing.</p>

<h2 id="complete-example">Complete controlled processing example</h2>
<pre><code class="language-javascript">function getOwnedActivePowerSpawn(id) {
  const structure = typeof id === 'string'
    ? Game.getObjectById(id)
    : null;

  if (
    !structure
    || structure.structureType !== STRUCTURE_POWER_SPAWN
    || structure.my !== true
    || structure.isActive() !== true
  ) {
    return null;
  }

  return structure;
}</code></pre>
<pre><code class="language-javascript">function runPowerProcessing(config) {
  if (!config || config.enabled !== true) {
    return { status: 'disabled' };
  }

  const powerSpawn = getOwnedActivePowerSpawn(
    config.powerSpawnId
  );
  if (!powerSpawn) {
    return { status: 'power-spawn-unavailable' };
  }

  const plannedPower = getPlannedPowerAmount(
    powerSpawn
  );
  const powerAvailable = powerSpawn.store.getUsedCapacity(
    RESOURCE_POWER
  );
  const localEnergy = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const roomEnergyStock = getRoomEnergyStock(
    powerSpawn.room,
    powerSpawn
  );
  const plan = evaluatePowerProcessing({
    enabled: config.enabled,
    plannedPower,
    powerAvailable,
    localEnergy,
    roomEnergyStock,
    energyReserve: config.energyReserve
  });

  config.lastCheckedAt = Game.time;
  config.lastStatus = plan.reason;

  if (!plan.ready) {
    config.lastPlan = plan;
    return { status: plan.reason, plan };
  }

  config.lastBefore = {
    gameTick: Game.time,
    gplProgress: Game.gpl.progress,
    power: powerAvailable,
    energy: localEnergy,
    roomEnergyStock,
    plannedPower: plan.plannedPower,
    plannedEnergy: plan.energyRequired
  };

  const result = powerSpawn.processPower();
  config.lastResult = result;
  config.lastResultAt = Game.time;
  config.lastStatus = result === OK
    ? 'processing-scheduled'
    : 'processing-rejected';

  return {
    status: config.lastStatus,
    result,
    plan,
    powerSpawnId: powerSpawn.id
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  Memory.powerProcessing ??= {
    enabled: false,
    powerSpawnId: null,
    energyReserve: 100000
  };

  const outcome = runPowerProcessing(
    Memory.powerProcessing
  );

  if (
    outcome.status === 'processing-rejected'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'power-processing-status',
      ...outcome
    }));
  }
};</code></pre>
<p>The default is disabled. Configure the real Power Spawn ID and reserve, review the plan, and enable it explicitly.</p>

<h2 id="after-ok">Verify GPL and Store deltas</h2>
<p>On a later tick, compare the stored before snapshot with current <code>Game.gpl.progress</code>, Power Spawn Power, Power Spawn Energy and active effect. Other Power Spawns can also change account GPL, so a GPL delta alone does not identify which structure caused it.</p>
<pre><code class="language-javascript">function inspectPowerProcessing(config) {
  const before = config?.lastBefore;
  const powerSpawn = getOwnedActivePowerSpawn(
    config?.powerSpawnId
  );

  if (!before || !powerSpawn) {
    return null;
  }

  return {
    submittedAt: before.gameTick,
    gplProgressBefore: before.gplProgress,
    gplProgressNow: Game.gpl.progress,
    powerBefore: before.power,
    powerNow: powerSpawn.store.getUsedCapacity(
      RESOURCE_POWER
    ),
    energyBefore: before.energy,
    energyNow: powerSpawn.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    currentEffect: getOperatePowerEffect(powerSpawn)
  };
}</code></pre>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Processing scheduled</td><td>GPL and Store later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Power Spawn not yours</td><td>ID and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Power or Energy missing</td><td>Planned amount and ratio</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid processing state</td><td>Current structure and constants</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Structure inactive</td><td>RCL and <code>isActive()</code></td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Require an explicit enabled switch.</li>
<li>Recover the Power Spawn by ID.</li>
<li>Check ownership and activity.</li>
<li>Read the active <code>PWR_OPERATE_POWER</code> effect.</li>
<li>Resolve the effect through current <code>POWER_INFO</code>.</li>
<li>Calculate Energy with <code>POWER_SPAWN_ENERGY_RATIO</code>.</li>
<li>Check local Power and Energy.</li>
<li>Protect the configured room reserve.</li>
<li>Save GPL and Store before the call.</li>
<li>Keep the official return code.</li>
<li>Verify later deltas without overclaiming causality.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not transport Power, schedule a Power Creep, decide GPL strategy, forecast room Energy income, coordinate multiple Power Spawns, or optimize the reserve. Return to the <a href="/en/blog">English article library</a> for related resource and logistics guides.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why is the default switch disabled?</h3>
<p>Continuous processing consumes real room Energy. A real structure ID and reviewed reserve must be configured before enabling it.</p>
<h3>Why count Storage, Terminal and local Energy?</h3>
<p>It provides a simple room-level affordability check instead of testing only whether the Power Spawn can execute one more call.</p>
<h3>Can POWER_INFO be hard-coded?</h3>
<p>Reading the current constant keeps effect levels coupled to current game data and makes fallback behavior explicit.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructurePowerSpawn" rel="nofollow">API Reference: StructurePowerSpawn</a></li>
<li><a href="https://docs.screeps.com/api/#StructurePowerSpawn.processPower" rel="nofollow">API Reference: processPower()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.gpl" rel="nofollow">API Reference: Game.gpl</a></li>
<li><a href="https://docs.screeps.com/power.html" rel="nofollow">Screeps Documentation: Power</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">API Reference: Constants and POWER_INFO</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
