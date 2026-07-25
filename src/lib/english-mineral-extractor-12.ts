import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishMineralExtractorArticle = {
  slug: "screeps-mineral-extractor-harvest",
  path: "/en/blog/screeps-mineral-extractor-harvest",
  chinesePath: "/blog/screeps-mineral-extractor-harvest",
  title: "Screeps Mineral Harvesting: Extractor, Cooldown, and Regeneration",
  headline: "How to Harvest Minerals with an Extractor Safely",
  description:
    "Find the room Mineral, require a same-tile owned active Extractor, check mineralAmount, Extractor cooldown, active WORK parts, Creep capacity and range, handle harvest() return codes, and verify Store and regeneration state on later ticks.",
  category: "RESOURCES · MINERAL HARVESTING",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "17 min read",
  breadcrumbLabel: "Mineral Harvesting",
  tags: ["Screeps", "Mineral", "Extractor", "Harvest", "Resources"],
  keywords: [
    "Screeps mineral harvesting",
    "Screeps StructureExtractor cooldown",
    "Screeps mineralAmount ticksToRegeneration",
    "Screeps creep harvest mineral",
    "Screeps Extractor ERR_NOT_FOUND",
  ],
  primaryKeyword: "Screeps mineral harvesting",
  searchIntent: "Harvest a room Mineral only when the Extractor, Creep, capacity, range, and regeneration state are valid",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Mineral fields, StructureExtractor, harvest(), cooldown, regeneration and return codes"],
    ["Structure boundary", "The Extractor must be found on the Mineral tile; an arbitrary room Extractor is not accepted"],
    ["Execution boundary", "OK means the harvest action was scheduled; Creep Store, mineralAmount and cooldown require later observation"],
    ["JavaScript syntax", "Passed"],
    ["Offline harvest review", "Passed — Mineral, amount, same-tile Extractor, ownership, activity, cooldown, WORK, capacity and range states"],
    ["Screeps Console test", "Pending"],
    ["Live Mineral depletion, regeneration, Store and cooldown test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["requirements", "Mineral harvesting requirements"],
    ["mineral-state", "Read the current Mineral state"],
    ["same-tile", "Find the Extractor on the Mineral tile"],
    ["pure-plan", "Build a testable harvest plan"],
    ["complete-example", "Complete Mineral harvester example"],
    ["cooldown", "Respect Extractor cooldown"],
    ["regeneration", "Handle depletion and regeneration"],
    ["after-ok", "Verify the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "When can a room start harvesting its Mineral?",
      "The room needs an Extractor built on the Mineral tile, which becomes available at RCL 6, plus a Creep with an active WORK part and enough Store capacity.",
    ],
    [
      "Does any Extractor in the room work?",
      "No. The Extractor must occupy the exact Mineral position. Look up structures at the Mineral coordinates instead of trusting room search order.",
    ],
    [
      "What does ERR_NOT_FOUND mean when harvesting a Mineral?",
      "In this context it indicates that an Extractor is not present on the Mineral tile. It is different from failing to obtain the Mineral object in your code.",
    ],
    [
      "Does OK prove the mineral entered the Creep Store?",
      "No. OK schedules the action. Compare the Creep Store, mineralAmount and Extractor cooldown on a later tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-factory-produce",
    label: "Previous production guide",
    title: "Produce Factory Commodities",
  },
  next: {
    href: "/en/blog/screeps-storage-energy-usage",
    label: "Next logistics guide",
    title: "Use Storage Energy Safely",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Get the current room Mineral, require <code>mineralAmount &gt; 0</code>, find an owned active Extractor on the exact Mineral tile, wait for <code>extractor.cooldown === 0</code>, require an active <code>WORK</code> part and free Creep Store capacity, then call <code>creep.harvest(mineral)</code>. Move only on <code>ERR_NOT_IN_RANGE</code>, and treat <code>OK</code> as a scheduled action that still needs later Store and cooldown verification.</p>

<h2 id="requirements">Mineral harvesting requirements</h2>
<ul>
<li>The room Mineral object must currently be visible.</li>
<li><code>mineral.mineralAmount</code> must be greater than zero.</li>
<li>An Extractor must be built on the Mineral coordinate.</li>
<li>The Extractor must be yours and active.</li>
<li>The Extractor cooldown must be zero.</li>
<li>The Creep needs at least one active <code>WORK</code> part.</li>
<li>The Creep needs free capacity for the Mineral type.</li>
<li>The Creep must be adjacent before the harvest can execute.</li>
</ul>
<p>Mineral harvesting is not the same as early Source harvesting. The Extractor is an additional structure gate and becomes available at RCL 6.</p>

<h2 id="mineral-state">Read the current Mineral state</h2>
<pre><code class="language-javascript">function getRoomMineral(room) {
  if (!room) {
    return null;
  }

  return room.find(FIND_MINERALS)[0] || null;
}</code></pre>
<p>Use the live object fields instead of maintaining a separate countdown:</p>
<pre><code class="language-javascript">function describeMineral(mineral) {
  if (!mineral) {
    return null;
  }

  return {
    id: mineral.id,
    mineralType: mineral.mineralType,
    mineralAmount: mineral.mineralAmount,
    ticksToRegeneration:
      mineral.ticksToRegeneration ?? null,
    x: mineral.pos.x,
    y: mineral.pos.y,
    roomName: mineral.pos.roomName
  };
}</code></pre>
<p><code>ticksToRegeneration</code> is meaningful during the depleted regeneration state. Do not decrement a copied Memory value and assume it remains synchronized with the object.</p>

<h2 id="same-tile">Find the Extractor on the Mineral tile</h2>
<pre><code class="language-javascript">function findExtractorForMineral(room, mineral) {
  if (!room || !mineral) {
    return null;
  }

  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    mineral.pos.x,
    mineral.pos.y
  );

  return structures.find(structure =>
    structure.structureType === STRUCTURE_EXTRACTOR
  ) || null;
}</code></pre>
<p>A room-level <code>find()</code> result does not prove that the selected Extractor belongs to this Mineral. The coordinate lookup preserves the actual structure relationship.</p>

<h2 id="pure-plan">Build a testable harvest plan</h2>
<pre><code class="language-javascript">function evaluateMineralHarvest(input) {
  if (!input.mineralExists) {
    return { ready: false, reason: 'mineral-missing' };
  }

  if (
    !Number.isFinite(input.mineralAmount)
    || input.mineralAmount &lt;= 0
  ) {
    return { ready: false, reason: 'mineral-depleted' };
  }

  if (!input.extractorExists || !input.extractorOnMineral) {
    return { ready: false, reason: 'extractor-missing' };
  }

  if (!input.extractorOwned || !input.extractorActive) {
    return { ready: false, reason: 'extractor-inactive' };
  }

  if (
    !Number.isInteger(input.extractorCooldown)
    || input.extractorCooldown &gt; 0
  ) {
    return { ready: false, reason: 'extractor-not-ready' };
  }

  if (
    !Number.isInteger(input.activeWorkParts)
    || input.activeWorkParts &lt;= 0
  ) {
    return { ready: false, reason: 'no-active-work-part' };
  }

  if (
    !Number.isFinite(input.freeCapacity)
    || input.freeCapacity &lt;= 0
  ) {
    return { ready: false, reason: 'creep-full' };
  }

  if (!input.isNearMineral) {
    return { ready: false, reason: 'move-to-mineral' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>This pure plan makes local branches testable, but the official action return code remains the same-tick authority.</p>

<h2 id="complete-example">Complete Mineral harvester example</h2>
<pre><code class="language-javascript">function runMineralHarvester(creep) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  const mineral = getRoomMineral(creep.room);
  if (!mineral) {
    return { status: 'mineral-missing' };
  }

  if (mineral.mineralAmount &lt;= 0) {
    return {
      status: 'mineral-depleted',
      ticksToRegeneration:
        mineral.ticksToRegeneration ?? null
    };
  }

  const extractor = findExtractorForMineral(
    creep.room,
    mineral
  );
  if (!extractor) {
    return { status: 'extractor-missing' };
  }

  const plan = evaluateMineralHarvest({
    mineralExists: true,
    mineralAmount: mineral.mineralAmount,
    extractorExists: true,
    extractorOnMineral:
      extractor.pos.isEqualTo(mineral.pos),
    extractorOwned: extractor.my === true,
    extractorActive: extractor.isActive() === true,
    extractorCooldown: extractor.cooldown,
    activeWorkParts:
      creep.getActiveBodyparts(WORK),
    freeCapacity: creep.store.getFreeCapacity(
      mineral.mineralType
    ),
    isNearMineral: creep.pos.isNearTo(mineral.pos)
  });

  if (plan.reason === 'move-to-mineral') {
    return {
      status: 'moving-to-mineral',
      result: creep.moveTo(mineral, {
        range: 1,
        reusePath: 10
      })
    };
  }

  if (!plan.ready) {
    return {
      status: plan.reason,
      mineralId: mineral.id,
      extractorId: extractor.id
    };
  }

  const before = {
    gameTick: Game.time,
    mineralAmount: mineral.mineralAmount,
    creepAmount: creep.store.getUsedCapacity(
      mineral.mineralType
    ),
    extractorCooldown: extractor.cooldown
  };
  const result = creep.harvest(mineral);

  return {
    status: result === OK
      ? 'harvest-scheduled'
      : 'harvest-rejected',
    result,
    mineralId: mineral.id,
    mineralType: mineral.mineralType,
    extractorId: extractor.id,
    before
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Miner1;
  if (!creep) {
    return;
  }

  const outcome = runMineralHarvester(creep);
  if (
    outcome.status === 'harvest-rejected'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'mineral-harvester-status',
      creepName: creep.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="cooldown">Respect Extractor cooldown</h2>
<p>A successful Mineral harvest places the Extractor into cooldown. Reissuing <code>harvest()</code> while the cooldown is positive only produces repeated <code>ERR_TIRED</code> results. Read the structure field each tick and let the worker wait, deliver, or perform another explicit task.</p>
<pre><code class="language-javascript">function extractorReady(extractor) {
  return Boolean(
    extractor
    &amp;&amp; extractor.my === true
    &amp;&amp; extractor.isActive() === true
    &amp;&amp; extractor.cooldown === 0
  );
}</code></pre>

<h2 id="regeneration">Handle depletion and regeneration</h2>
<p>When <code>mineralAmount</code> reaches zero, stop assigning harvest actions. Store the current observation for diagnostics, but use the live <code>ticksToRegeneration</code> field rather than treating an old Memory countdown as truth.</p>
<pre><code class="language-javascript">function mineralAvailability(mineral) {
  if (!mineral) {
    return { available: false, reason: 'missing' };
  }

  if (mineral.mineralAmount &lt;= 0) {
    return {
      available: false,
      reason: 'regenerating',
      ticksToRegeneration:
        mineral.ticksToRegeneration ?? null
    };
  }

  return {
    available: true,
    reason: 'available',
    mineralAmount: mineral.mineralAmount
  };
}</code></pre>

<h2 id="after-ok">Verify the next tick</h2>
<p>Save the Mineral ID, Extractor ID, Creep name, mineral type, Store amount and game tick. On a later tick, recover the objects and compare:</p>
<ul>
<li>Creep Store for the Mineral type;</li>
<li><code>mineral.mineralAmount</code>;</li>
<li><code>extractor.cooldown</code>;</li>
<li>the original action return code.</li>
</ul>
<p>Other Creep actions or dropped resources can affect totals, so describe the observed deltas rather than claiming causality from one number alone.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning here</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Harvest scheduled</td><td>Store, amount and cooldown later</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep still spawning</td><td><code>creep.spawning</code></td></tr>
<tr><td><code>ERR_NOT_FOUND</code></td><td>No Extractor on the Mineral tile</td><td>Same-tile lookup</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Mineral depleted</td><td><code>mineralAmount</code> and regeneration</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Target is not harvestable</td><td>Object type and visibility</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Creep not adjacent</td><td>Move to range 1</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Extractor cooling down</td><td><code>extractor.cooldown</code></td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active WORK part</td><td>Current body damage</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the room and Mineral are visible.</li>
<li>Read current <code>mineralAmount</code>.</li>
<li>Find structures at the Mineral coordinates.</li>
<li>Confirm Extractor ownership and activity.</li>
<li>Wait for cooldown zero.</li>
<li>Count active WORK parts.</li>
<li>Check capacity for the exact Mineral type.</li>
<li>Move only when out of range.</li>
<li>Save the action result and before snapshot.</li>
<li>Verify Store, amount and cooldown later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not design the Miner body, haul minerals, schedule regeneration, operate Labs, value minerals, or sell them. Continue with <a href="/en/blog/screeps-storage-energy-usage">Storage Energy logistics</a> and the existing Lab guides.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can a Creep harvest without CARRY?</h3>
<p>The action may still produce resources, but without available Store capacity they can drop on the ground. This example requires capacity to keep the logistics explicit.</p>
<h3>Why not hard-code the regeneration time?</h3>
<p>The live object exposes the current remaining regeneration state. Reading it avoids drift between Memory and the game object.</p>
<h3>Should multiple WORK parts ignore cooldown?</h3>
<p>No. More active WORK parts can increase one harvest amount, but the Extractor still controls how often Mineral harvesting can occur.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Mineral" rel="nofollow">API Reference: Mineral</a></li>
<li><a href="https://docs.screeps.com/api/#StructureExtractor" rel="nofollow">API Reference: StructureExtractor</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">API Reference: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/resources.html" rel="nofollow">Screeps Documentation: Resources</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
