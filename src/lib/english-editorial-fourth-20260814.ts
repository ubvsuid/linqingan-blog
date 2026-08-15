import type { EnglishBeginnerArticle } from "./english-beginner-content";

const REVIEWED_AT = "August 14, 2026";

function verification(
  docs: string,
  engine: string,
  staticReview: string,
  liveBoundary: string,
): Array<[string, string]> {
  return [
    ["Chinese source article", "Reviewed in full"],
    ["Official documentation", docs],
    ["Official engine source", engine],
    ["Static code review", staticReview],
    ["Screeps Console test", "Pending"],
    ["Live multi-tick verification", "Pending"],
    ["Live boundary test", liveBoundary],
    ["Evidence level", "Official documentation, official engine source, repository review and offline reasoning only"],
    ["Last editorial review", REVIEWED_AT],
  ];
}

export const englishEditorialFourthArticleOverrides20260814: Record<
  string,
  Partial<EnglishBeginnerArticle>
> = {
  "screeps-creep-harvest-energy": {
    title: "Screeps Creep.harvest(): Full Stores, Return Codes, and Safe Energy Loops",
    headline: "Screeps Harvest Energy Without the ERR_FULL Mistake",
    description:
      "Build a first Screeps harvesting loop with the current Creep.harvest() boundary: preflight Store capacity, use active Sources, read Source-specific return codes, and understand why a full Store does not return ERR_FULL.",
    category: "GETTING STARTED · HARVEST API CORRECTION",
    readingTime: "13 min read",
    breadcrumbLabel: "Harvest Energy",
    tags: ["Screeps", "Creeps", "Energy", "Return Codes", "JavaScript"],
    keywords: [
      "Screeps harvest energy",
      "Creep.harvest return codes",
      "Screeps harvest ERR_FULL",
      "Screeps full Creep Store",
      "FIND_SOURCES_ACTIVE",
    ],
    primaryKeyword: "Screeps harvest energy",
    searchIntent:
      "Learn the current Creep.harvest() Source boundary and prevent a beginner harvesting loop from using ERR_FULL as a Store-state signal",
    finalScore: 99,
    verification: verification(
      "Checked August 14, 2026 — Creep.harvest(), Creep Store capacity, Source harvesting, FIND_SOURCES_ACTIVE, and action timing",
      "Checked current screeps/engine Creep.harvest() submission and harvest processor: Source harvesting has no ERR_FULL preflight, and overflow beyond Creep Store capacity is dropped by the processor",
      "Passed — full-Store state is checked before harvest(), Source-specific return codes are separated from Mineral/Deposit codes, and OK is not treated as later-tick settlement evidence",
      "Pending — no live full-Store harvest, dropped-overflow, Source-depletion, or later-tick Store-delta trace was collected",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["hard-correction", "The ERR_FULL correction"],
      ["source-codes", "Source-specific harvest return codes"],
      ["full-store", "What happens when the Store is full"],
      ["precheck", "Read-only precheck"],
      ["safe-loop", "A safer first harvest loop"],
      ["source-selection", "Why FIND_SOURCES_ACTIVE helps"],
      ["ok-boundary", "What OK proves"],
      ["debug", "Debug by state, action, and movement"],
      ["specialized-miners", "When dropped Energy is intentional"],
      ["verify", "How to verify in a live room"],
      ["next", "Next lesson"],
      ["official-sources", "Official documentation and engine source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Do not wait for <code>creep.harvest(source)</code> to return <code>ERR_FULL</code>. In the current official Screeps engine, Source harvesting does not have an <code>ERR_FULL</code> preflight. A beginner hauler should read Store capacity <em>before</em> submitting the harvest intent:</p>
<pre><code class="language-javascript">const freeEnergy = creep.store.getFreeCapacity(RESOURCE_ENERGY);

if (freeEnergy === 0) {
  return { status: 'store-full' };
}

const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

if (!source) {
  return { status: 'no-active-source' };
}

const harvestResult = creep.harvest(source);</code></pre>
<p>That keeps application state and API return codes separate. “My Store is full” is a state observation. It is not a current <code>Creep.harvest()</code> return code for a Source.</p>

<h2 id="hard-correction">The important correction: harvest() does not return ERR_FULL for a Source</h2>
<p>The previous version of this lesson treated <code>ERR_FULL</code> as the signal that the worker could not receive more Energy. That does not match the current official engine implementation.</p>
<p>The Source-harvest submission path checks Creep ownership, spawning state, an active <code>WORK</code> part, target validity, Source Energy, range, and room ownership or reservation. It does <strong>not</strong> check Creep Store capacity and does not return <code>ERR_FULL</code>.</p>
<p>This matters because return-code-driven role code can otherwise wait for a result that will never describe the full-Store state you are trying to detect.</p>

<h2 id="source-codes">Source-specific Creep.harvest() results</h2>
<p>This page is about harvesting a <code>Source</code>. Minerals and Deposits add different prerequisites and return states, so do not merge all three resource types into one beginner table.</p>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Source-harvest meaning</th><th>What to do</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The harvest intent was accepted for the current tick.</td><td>Verify Source and Store state after the tick is processed.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep is not yours, or the Source is in a room owned/reserved by another player under the current rule.</td><td>Check actor ownership and room Controller state.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until <code>creep.spawning</code> is false.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>WORK</code> part remains.</td><td>Inspect the body and damage.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a harvestable object for this call.</td><td>Resolve the Source again.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Source currently has zero Energy.</td><td>Choose an active Source or wait for regeneration.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent to the Source.</td><td>Move to range 1 and retry on a later tick.</td></tr>
</tbody></table></div>
<p><code>ERR_FULL</code> is intentionally absent. Other Creep methods, such as <code>pickup()</code>, do use <code>ERR_FULL</code>; that does not make it a universal Store-capacity return code.</p>

<h2 id="full-store">What the current engine does when the Store is already full</h2>
<p>The current harvest processor calculates the harvested amount, removes that amount from the Source, and adds it to the Creep. If the resulting carried resources exceed the Creep's Store capacity, the overflow is dropped on the ground.</p>
<p>That behavior is useful for specialized static miners, but it is usually a poor control signal for a first Source-to-Spawn worker. A beginner transport loop should stop harvesting when <code>getFreeCapacity()</code> reaches zero and switch to delivery deliberately.</p>
<p><strong>Evidence boundary:</strong> this revision is based on the current official engine source. No live full-Store harvest trace was collected in this editorial pass.</p>

<h2 id="precheck">Read-only precheck before running a loop</h2>
<p><strong>State impact:</strong> read-only.</p>
<pre><code class="language-javascript">const creep = Game.creeps['Harvester1'];

if (!creep) {
  console.log('Harvester1 was not found.');
} else {
  const activeSources = creep.room.find(FIND_SOURCES_ACTIVE);

  console.log(JSON.stringify({
    tick: Game.time,
    spawning: creep.spawning,
    activeWork: creep.getActiveBodyparts(WORK),
    energyUsed: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    energyFree: creep.store.getFreeCapacity(RESOURCE_ENERGY),
    activeSourceCount: activeSources.length,
    closestRange: activeSources.length
      ? creep.pos.getRangeTo(activeSources[0])
      : null
  }));
}</code></pre>
<p>This tells you whether the role is blocked by missing <code>WORK</code>, no free Store capacity, no currently active Source, or range before you submit an action.</p>

<h2 id="safe-loop">A safer first harvesting loop</h2>
<p>This example focuses only on acquisition. When the Store becomes full it returns a local <code>store-full</code> state instead of inventing a harvest return code.</p>
<pre><code class="language-javascript">const CREEP_NAME = 'Harvester1';

function runHarvest(creep) {
  if (creep.spawning) {
    return { status: 'creep-spawning' };
  }

  if (creep.getActiveBodyparts(WORK) === 0) {
    return { status: 'no-active-work' };
  }

  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY);

  if (freeEnergy === null || freeEnergy === 0) {
    return { status: 'store-full' };
  }

  const source =
    creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) {
    return { status: 'no-active-source' };
  }

  const actionResult = creep.harvest(source);
  let moveResult = null;

  if (actionResult === ERR_NOT_IN_RANGE) {
    moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 5
    });
  }

  return {
    status: actionResult === OK
      ? 'harvest-accepted'
      : 'harvest-not-accepted',
    sourceId: source.id,
    actionResult,
    moveResult,
    freeEnergyBefore: freeEnergy
  };
}

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep) {
    console.log(CREEP_NAME + ' was not found.');
    return;
  }

  const result = runHarvest(creep);

  if (
    result.status !== 'harvest-accepted'
    && result.status !== 'store-full'
    && result.actionResult !== ERR_NOT_IN_RANGE
  ) {
    console.log(JSON.stringify({
      tick: Game.time,
      creep: creep.name,
      ...result
    }));
  }
};</code></pre>
<p>When <code>store-full</code> appears, the next role step is delivery. Do not keep calling <code>harvest()</code> merely to rediscover capacity state.</p>

<h2 id="source-selection">Why FIND_SOURCES_ACTIVE is useful here</h2>
<p><code>FIND_SOURCES</code> answers “which Sources are visible?” A first-element strategy can repeatedly select a depleted Source and receive <code>ERR_NOT_ENOUGH_RESOURCES</code> even while another Source is usable.</p>
<p><code>FIND_SOURCES_ACTIVE</code> narrows the beginner acquisition branch to Sources that currently contain Energy. That is a target-selection policy, not a new <code>harvest()</code> rule. A production miner may intentionally stay assigned to one Source and wait for regeneration instead.</p>

<h2 id="ok-boundary">What OK proves — and what it does not</h2>
<p><code>OK</code> means the harvest intent was accepted by the API call. Your script should not rewrite that as “the Creep definitely gained N Energy.” Screeps resolves intents after player code for the tick.</p>
<p>For evidence, save a compact before-state and inspect the next visible state: Source Energy, Creep Store, position, and any dropped Energy near the Creep if you are specifically testing the full-Store boundary.</p>

<h2 id="debug">Debug state, action, and movement as three separate layers</h2>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Question</th><th>Useful evidence</th></tr></thead>
<tbody>
<tr><td>State</td><td>Can this Creep accept more Energy?</td><td><code>store.getFreeCapacity(RESOURCE_ENERGY)</code></td></tr>
<tr><td>Action</td><td>Was <code>harvest()</code> accepted?</td><td>The exact harvest return code.</td></tr>
<tr><td>Movement</td><td>If range failed, was movement accepted?</td><td>The separate <code>moveTo()</code> return code and later position.</td></tr>
</tbody></table></div>
<p>Do not overwrite <code>actionResult</code> with <code>moveResult</code>. The two calls diagnose different problems.</p>

<h2 id="specialized-miners">When dropped Energy is intentional</h2>
<p>A dedicated miner can be designed to harvest continuously while another Creep or structure collects the output. In that architecture, little or no carrying capacity may be intentional and dropped Energy can be part of the transport design.</p>
<p>This lesson is not that architecture. It teaches a first Creep that both harvests and later carries Energy, so capacity should be a deliberate phase boundary.</p>

<h2 id="verify">How to verify the boundary in a live room</h2>
<ol>
<li>Record <code>Game.time</code>, Source Energy, Creep Store used/free capacity, and range.</li>
<li>Run the normal harvest path while free capacity is positive.</li>
<li>Observe the later Store/Source state; do not substitute a fabricated Console transcript.</li>
<li>For a separate controlled test, call <code>harvest()</code> while the Store is already full and record its return code plus any later dropped resource.</li>
<li>Keep that experiment separate from production role logic.</li>
</ol>
<p>Those live observations remain <strong>Pending</strong> in this article until they are actually captured.</p>

<h2 id="next">Next lesson</h2>
<p>Once capacity reaches zero, continue with <a href="/en/blog/screeps-transfer-energy-to-spawn">Creep-to-Spawn Energy delivery</a>. If the action returns <code>ERR_NOT_IN_RANGE</code>, use the <a href="/en/blog/screeps-err-not-in-range">range debugging guide</a> rather than treating movement and harvesting as one result.</p>

<h2 id="official-sources">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getFreeCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow noopener noreferrer">Screeps API: Room.find() and FIND_SOURCES_ACTIVE</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/creeps.js" rel="nofollow noopener noreferrer">Official screeps/engine: Creep.harvest() submission boundary</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/creeps/harvest.js" rel="nofollow noopener noreferrer">Official screeps/engine: harvest processor</a></li>
</ul>`,
  },

  "screeps-first-extension": {
    title: "Screeps First Extension: Build It and Diagnose ERR_INVALID_TARGET",
    headline: "Build Your First Screeps Extension Without Missing a Blocked Site",
    description:
      "Build an RCL 2 Extension with a guarded Builder loop, then diagnose the current Creep.build() boundary where a blocking object or Creep on an obstacle-structure site can return ERR_INVALID_TARGET.",
    category: "CONSTRUCTION · FIRST EXTENSION DEBUGGING",
    readingTime: "15 min read",
    breadcrumbLabel: "First Extension",
    tags: ["Construction", "Energy", "Creeps", "Debugging", "Return Codes"],
    keywords: [
      "Screeps first Extension",
      "Screeps Extension ERR_INVALID_TARGET",
      "Creep.build blocked construction site",
      "Screeps RCL 2 Extension",
      "FIND_MY_CONSTRUCTION_SITES",
    ],
    primaryKeyword: "Screeps first Extension",
    searchIntent:
      "Build the first RCL 2 Extension and diagnose Creep.build() when an obstacle-structure Construction Site is occupied or otherwise invalid",
    finalScore: 99,
    verification: verification(
      "Checked August 14, 2026 — StructureExtension, RCL structure limits, ConstructionSite, Creep.build(), Store and range behavior",
      "Checked current screeps/engine Creep.build() submission: Extension sites are obstacle-structure targets, and blocking obstacle objects or Creeps on the site tile can make build() return ERR_INVALID_TARGET",
      "Passed — the example keeps Store phase, build action, movement, occupied-site diagnostics, and post-tick progress verification separate",
      "Pending — no live occupied Extension-site, Safe Mode blocker, progress-completion, or empty-finished-Extension trace was collected",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["facts", "RCL 2 Extension facts"],
      ["build-boundary", "The blocked-site build boundary"],
      ["inspect-site", "Inspect the site tile"],
      ["safe-loop", "A safer one-Extension Builder"],
      ["return-codes", "Current build return boundary"],
      ["invalid-target", "Diagnose ERR_INVALID_TARGET"],
      ["progress", "Verify progress and completion"],
      ["placement", "Placement versus build-time validity"],
      ["limits", "Scope and known limits"],
      ["next", "Next lesson"],
      ["official-sources", "Official documentation and engine source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>At RCL 2, place an owned Extension Construction Site, give a Builder Energy, and call <code>build(site)</code> from range 3. But if an Extension site visibly exists and <code>build()</code> returns <code>ERR_INVALID_TARGET</code>, do more than “find it again next tick.” The current official engine also rejects an obstacle-structure site when a blocking object or Creep occupies the target tile.</p>
<p>That distinction matters because the site can still be a real <code>ConstructionSite</code> while the current build request is invalid.</p>

<h2 id="facts">RCL 2 Extension facts</h2>
<div class="table-scroll"><table>
<thead><tr><th>Property</th><th>RCL 2 value</th><th>Engineering consequence</th></tr></thead>
<tbody>
<tr><td>Allowed Extensions</td><td>5</td><td>Start with one site while learning the build lifecycle.</td></tr>
<tr><td>Energy capacity</td><td>50 each</td><td>A completed Extension must be filled by delivery logic.</td></tr>
<tr><td>Construction progress required</td><td>3000</td><td>Completion takes repeated accepted build intents and Energy.</td></tr>
<tr><td><code>build()</code> range</td><td>3</td><td>Do not force the Builder to range 1 just to build.</td></tr>
</tbody></table></div>
<p>The Construction Site and the finished <code>StructureExtension</code> are different objects. When construction finishes, code that saved the site object or ID must expect that site to disappear.</p>

<h2 id="build-boundary">Why an occupied Extension site can return ERR_INVALID_TARGET</h2>
<p>The current <code>Creep.build()</code> submission code validates the Construction Site and range, then checks the target tile when the planned structure type is listed as an obstacle.</p>
<p>An Extension is an obstacle structure. If another blocking obstacle object is on that tile, the call returns <code>ERR_INVALID_TARGET</code>. Blocking Creeps can also cause the same result. Under owned-room Safe Mode, the current engine narrows that Creep blocker check to your own Creeps; outside that case it checks Creeps on the tile generally.</p>
<p>This is a build-time boundary, not merely a site-placement boundary. A generic message such as “target is stale” loses useful evidence.</p>

<h2 id="inspect-site">Read the site and its tile before guessing</h2>
<p><strong>State impact:</strong> read-only.</p>
<pre><code class="language-javascript">const creep = Game.creeps['Builder1'];

if (!creep) {
  console.log('Builder1 was not found.');
} else {
  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
    filter: value =>
      value.structureType === STRUCTURE_EXTENSION
  })[0];

  if (!site) {
    console.log('No owned Extension site in this room.');
  } else {
    console.log(JSON.stringify({
      tick: Game.time,
      siteId: site.id,
      progress: site.progress,
      progressTotal: site.progressTotal,
      range: creep.pos.getRangeTo(site),
      carriedEnergy:
        creep.store.getUsedCapacity(RESOURCE_ENERGY),
      activeWork: creep.getActiveBodyparts(WORK),
      creepsOnTile: site.pos
        .lookFor(LOOK_CREEPS)
        .map(value => value.name),
      structuresOnTile: site.pos
        .lookFor(LOOK_STRUCTURES)
        .map(value => value.structureType)
    }));
  }
}</code></pre>
<p>The diagnostic deliberately reports occupants instead of pretending every structure on the tile is a blocker. The engine's obstacle rules determine whether an occupant invalidates the build request.</p>

<h2 id="safe-loop">A safer one-Extension Builder loop</h2>
<pre><code class="language-javascript">const CREEP_NAME = 'Builder1';

function moveIfNeeded(creep, target, range) {
  return creep.moveTo(target, {
    range,
    reusePath: 5
  });
}

function runBuilder(creep) {
  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) || 0;
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) || 0;

  if (usedEnergy === 0) {
    creep.memory.building = false;
  } else if (freeEnergy === 0) {
    creep.memory.building = true;
  }

  if (creep.memory.building) {
    const site = creep.room.find(
      FIND_MY_CONSTRUCTION_SITES,
      {
        filter: value =>
          value.structureType === STRUCTURE_EXTENSION
      }
    )[0];

    if (!site) {
      return { status: 'no-extension-site' };
    }

    const actionResult = creep.build(site);
    let moveResult = null;

    if (actionResult === ERR_NOT_IN_RANGE) {
      moveResult = moveIfNeeded(creep, site, 3);
    }

    return {
      status: actionResult === OK
        ? 'build-accepted'
        : 'build-not-accepted',
      siteId: site.id,
      progressBefore: site.progress,
      actionResult,
      moveResult
    };
  }

  const source =
    creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) {
    return { status: 'no-active-source' };
  }

  const actionResult = creep.harvest(source);
  let moveResult = null;

  if (actionResult === ERR_NOT_IN_RANGE) {
    moveResult = moveIfNeeded(creep, source, 1);
  }

  return {
    status: actionResult === OK
      ? 'harvest-accepted'
      : 'harvest-not-accepted',
    sourceId: source.id,
    actionResult,
    moveResult
  };
}

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep || creep.spawning) {
    return;
  }

  const result = runBuilder(creep);

  if (
    result.actionResult !== undefined
    && result.actionResult !== OK
    && result.actionResult !== ERR_NOT_IN_RANGE
  ) {
    console.log(JSON.stringify({
      tick: Game.time,
      creep: creep.name,
      ...result
    }));
  }
};</code></pre>
<p>The full/empty switch is hysteresis: partial Energy keeps the previous phase. It does not recalculate “building” from <code>usedEnergy &gt; 0</code> every tick.</p>

<h2 id="return-codes">Current Creep.build() return boundary</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning for this lesson</th><th>Next check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The build intent was accepted.</td><td>Verify later progress.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The acting Creep is not yours.</td><td>Resolve the correct Builder.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>WORK</code> remains.</td><td>Inspect body damage.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep has no carried Energy.</td><td>Return to acquisition.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The site is farther than range 3.</td><td>Move toward range 3.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The site is invalid, stale, or fails the current obstacle-site occupancy boundary.</td><td>Re-resolve the site and inspect the target tile.</td></tr>
</tbody></table></div>

<h2 id="invalid-target">Diagnose ERR_INVALID_TARGET without destroying the evidence</h2>
<p>When the result is <code>ERR_INVALID_TARGET</code>, capture these facts before choosing another task:</p>
<ul>
<li>the exact site ID and <code>structureType</code>;</li>
<li>whether that ID still resolves as a Construction Site;</li>
<li>the Builder's range and active <code>WORK</code>;</li>
<li>Creeps and structures currently on the site tile;</li>
<li>whether the room currently has owned Safe Mode, because that changes the engine's Creep blocker subset;</li>
<li>whether the site finished or disappeared between observations.</li>
</ul>
<p>Do not immediately fall through to repair or Controller upgrading in the same branch. A hard build error is useful diagnostic state, not a reason to hide the selected task.</p>

<h2 id="progress">Verify progress and completion on later ticks</h2>
<p>Record <code>site.progress</code> before an accepted build intent and inspect the site again on a later tick. If the site no longer exists, check the target tile for the finished <code>STRUCTURE_EXTENSION</code>.</p>
<p><code>OK</code> alone does not prove the exact progress delta. Other builders can contribute, the site can complete, and the current object can disappear after intent processing.</p>
<p>A finished Extension starts as a structure that still needs Energy delivery. Construction completion and filling the Extension are separate workflows.</p>

<h2 id="placement">Valid placement does not eliminate every later build failure</h2>
<p>Placing a site successfully proves that the placement request passed its own rules at that time. It does not guarantee that every future <code>build()</code> call will remain valid. Room occupancy can change between ticks.</p>
<p>This is why the article separates site creation, current target validity, build intent acceptance, and later construction progress.</p>

<h2 id="limits">Scope and known limits</h2>
<ul>
<li>This is one Builder and one Extension target, not a layout planner.</li>
<li>It does not assign multiple Builders or reserve site work.</li>
<li>It does not claim a live occupied-site trace; that boundary remains Pending.</li>
<li>It uses active Source selection for a mobile beginner Builder; a fixed miner can use another policy.</li>
</ul>

<h2 id="next">Next lesson</h2>
<p>After the Extension is complete, continue with <a href="/en/blog/screeps-build-repair">the Builder priority guide</a>. For exact long-running construction evidence, use <a href="/en/blog/screeps-construction-site-progress">the ConstructionSite progress guide</a>.</p>

<h2 id="official-sources">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow noopener noreferrer">Screeps Documentation: Room Controller Level structure limits</a></li>
<li><a href="https://docs.screeps.com/api/#StructureExtension" rel="nofollow noopener noreferrer">Screeps API: StructureExtension</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.build" rel="nofollow noopener noreferrer">Screeps API: Creep.build()</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/creeps.js" rel="nofollow noopener noreferrer">Official screeps/engine: Creep.build() submission boundary</a></li>
</ul>`,
  },

  "screeps-build-repair": {
    title: "Screeps Builder Priority: Build, Repair, Then Upgrade Safely",
    headline: "Run a Screeps Builder Without Hiding Build, Repair, or Controller Errors",
    description:
      "Give a Screeps Builder one task per tick while preserving exact build(), repair(), and upgradeController() boundaries, including owned-Controller checks, upgradeBlocked, and occupied Construction Sites.",
    category: "CONSTRUCTION · BUILDER ACTION ARBITRATION",
    readingTime: "17 min read",
    breadcrumbLabel: "Build and Repair",
    tags: ["Construction", "Creeps", "Energy", "Controllers", "Debugging"],
    keywords: [
      "Screeps Builder code",
      "Screeps build repair upgrade priority",
      "Creep.upgradeController ERR_NOT_OWNER",
      "Screeps upgradeBlocked",
      "Creep.build ERR_INVALID_TARGET",
    ],
    primaryKeyword: "Screeps Builder code",
    searchIntent:
      "Design a beginner Builder priority that submits one main work action while preserving exact build, repair, and Controller fallback failure states",
    finalScore: 99,
    verification: verification(
      "Checked August 14, 2026 — Creep.build(), Creep.repair(), Creep.upgradeController(), Store, FIND_MY_CONSTRUCTION_SITES and Controller ownership",
      "Checked current screeps/engine: repair() does not require target-structure ownership, build() can reject occupied obstacle sites, and upgradeController() requires an owned valid Controller and rejects upgradeBlocked",
      "Passed — task selection, action submission, movement, ownership, upgradeBlocked, target policy, and later evidence are separated; lower priorities do not hide a selected task's hard error",
      "Pending — no live blocked-site, neutral-Controller, upgradeBlocked, repair-delta, or multi-tick task-priority trace was collected",
    ),
    toc: [
      ["quick-answer", "Quick answer"],
      ["priority", "One selected task per tick"],
      ["repair-policy", "Repair target policy versus API rule"],
      ["controller-fallback", "Guard the Controller fallback"],
      ["builder-code", "A safer Builder loop"],
      ["action-results", "Keep action results method-specific"],
      ["build-invalid", "Build ERR_INVALID_TARGET"],
      ["repair-boundary", "Repair boundary"],
      ["upgrade-boundary", "Upgrade Controller boundary"],
      ["verification", "Verify the selected task later"],
      ["failure-policy", "Do not hide hard errors with fallback"],
      ["limits", "Scope and known limits"],
      ["official-sources", "Official documentation and engine source"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>A beginner Builder can use the priority <strong>build → repair → upgrade</strong>, but target existence is not enough. Select one task, submit that method, preserve its exact return code, and only use Controller upgrading when the room has a Controller that is actually yours and is not currently <code>upgradeBlocked</code>.</p>
<p>Do not let a failed high-priority build silently fall through to repair or upgrading in the same control branch. That makes a visible failure disappear from your diagnostics.</p>

<h2 id="priority">One selected task per tick</h2>
<div class="table-scroll"><table>
<thead><tr><th>Priority</th><th>Selection rule</th><th>Submitted action</th></tr></thead>
<tbody>
<tr><td>1</td><td>An owned Construction Site is selected.</td><td><code>build(site)</code></td></tr>
<tr><td>2</td><td>No site; a structure passes this project's repair policy.</td><td><code>repair(structure)</code></td></tr>
<tr><td>3</td><td>No higher target; current room Controller is owned and upgradeable.</td><td><code>upgradeController(controller)</code></td></tr>
</tbody></table></div>
<p>“One selected task” is an application policy. Screeps still has its own intent rules. The point of returning after a selected branch is to keep this lesson deterministic and preserve the first failure you actually need to debug.</p>

<h2 id="repair-policy">Repair target policy is not the same as a repair() ownership rule</h2>
<p>This article intentionally repairs:</p>
<ul>
<li>structures where <code>my === true</code>;</li>
<li>Roads;</li>
<li>Containers;</li>
</ul>
<p>and excludes Walls/Ramparts so a beginner maintenance worker does not spend its entire budget on defensive hit pools.</p>
<p>That filter is <strong>project policy</strong>. The current official <code>Creep.repair()</code> submission and processor do not require the target structure itself to be yours. Roads and Containers therefore do not need to be mislabeled as owned just to explain why this policy includes them.</p>

<h2 id="controller-fallback">Guard the Controller fallback before calling upgradeController()</h2>
<p>The previous lesson only checked whether <code>creep.room.controller</code> existed. A visible neutral or hostile Controller is still a Controller object, but the current <code>upgradeController()</code> boundary requires the target to be yours. The method also rejects a Controller whose <code>upgradeBlocked</code> value is active.</p>
<pre><code class="language-javascript">function getUpgradeTarget(creep) {
  const controller = creep.room.controller;

  if (!controller) {
    return {
      status: 'controller-missing',
      controller: null
    };
  }

  if (controller.my !== true) {
    return {
      status: 'controller-not-owned',
      controller: null
    };
  }

  if (controller.upgradeBlocked > 0) {
    return {
      status: 'controller-upgrade-blocked',
      controller: null,
      upgradeBlocked: controller.upgradeBlocked
    };
  }

  return {
    status: 'controller-ready',
    controller
  };
}</code></pre>
<p>This preflight improves diagnostics. The real method return code must still be checked because state can change and the API remains the authority on the submitted action.</p>

<h2 id="builder-code">A safer Builder loop</h2>
<pre><code class="language-javascript">const CREEP_NAME = 'Builder1';

function moveToRange(creep, target, range) {
  return creep.moveTo(target, {
    range,
    reusePath: 5
  });
}

function selectRepairTarget(creep) {
  return creep.room.find(FIND_STRUCTURES, {
    filter: structure => {
      const allowed =
        structure.my === true
        || structure.structureType === STRUCTURE_ROAD
        || structure.structureType === STRUCTURE_CONTAINER;

      const defense =
        structure.structureType === STRUCTURE_WALL
        || structure.structureType === STRUCTURE_RAMPART;

      return allowed
        && !defense
        && structure.hits < structure.hitsMax;
    }
  })[0] || null;
}

function runWork(creep) {
  const site =
    creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (site) {
    const actionResult = creep.build(site);
    let moveResult = null;

    if (actionResult === ERR_NOT_IN_RANGE) {
      moveResult = moveToRange(creep, site, 3);
    }

    return {
      task: 'build',
      targetId: site.id,
      actionResult,
      moveResult
    };
  }

  const damaged = selectRepairTarget(creep);

  if (damaged) {
    const actionResult = creep.repair(damaged);
    let moveResult = null;

    if (actionResult === ERR_NOT_IN_RANGE) {
      moveResult = moveToRange(creep, damaged, 3);
    }

    return {
      task: 'repair',
      targetId: damaged.id,
      actionResult,
      moveResult
    };
  }

  const upgradeTarget = getUpgradeTarget(creep);

  if (!upgradeTarget.controller) {
    return {
      task: 'upgrade',
      actionResult: null,
      moveResult: null,
      status: upgradeTarget.status,
      upgradeBlocked:
        upgradeTarget.upgradeBlocked ?? null
    };
  }

  const controller = upgradeTarget.controller;
  const actionResult =
    creep.upgradeController(controller);
  let moveResult = null;

  if (actionResult === ERR_NOT_IN_RANGE) {
    moveResult = moveToRange(creep, controller, 3);
  }

  return {
    task: 'upgrade',
    targetId: controller.id,
    actionResult,
    moveResult,
    status: 'upgrade-submitted'
  };
}

function runBuilder(creep) {
  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) || 0;
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) || 0;

  if (usedEnergy === 0) {
    creep.memory.working = false;
  } else if (freeEnergy === 0) {
    creep.memory.working = true;
  }

  if (creep.memory.working) {
    return runWork(creep);
  }

  const source =
    creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) {
    return { task: 'harvest', status: 'no-active-source' };
  }

  const actionResult = creep.harvest(source);
  let moveResult = null;

  if (actionResult === ERR_NOT_IN_RANGE) {
    moveResult = moveToRange(creep, source, 1);
  }

  return {
    task: 'harvest',
    targetId: source.id,
    actionResult,
    moveResult
  };
}

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep || creep.spawning) {
    return;
  }

  const result = runBuilder(creep);

  if (
    result.actionResult !== undefined
    && result.actionResult !== null
    && result.actionResult !== OK
    && result.actionResult !== ERR_NOT_IN_RANGE
  ) {
    console.log(JSON.stringify({
      tick: Game.time,
      creep: creep.name,
      ...result
    }));
  }
};</code></pre>
<p>The code does not submit repair or upgrade after a selected build fails. It reports that build result and re-evaluates current state on the next tick.</p>

<h2 id="action-results">Keep each action result method-specific</h2>
<p>A generic “workResult” message loses context because the same integer can mean different operational problems depending on which method produced it. Record the method or task with the result.</p>
<div class="table-scroll"><table>
<thead><tr><th>Method</th><th>Important hard states in this workflow</th></tr></thead>
<tbody>
<tr><td><code>build()</code></td><td>No Energy, no active WORK, range failure, invalid/stale/blocked site.</td></tr>
<tr><td><code>repair()</code></td><td>No Energy, no active WORK, invalid structure, range failure.</td></tr>
<tr><td><code>upgradeController()</code></td><td>Not owned, upgrade blocked/invalid target, no Energy, no active WORK, range failure.</td></tr>
</tbody></table></div>
<p><code>OK</code> means that method's intent was accepted. It is not the later proof that construction progress, structure hits, or Controller progress changed by the amount you expected.</p>

<h2 id="build-invalid">Build ERR_INVALID_TARGET needs its own diagnostic branch</h2>
<p>For obstacle-structure Construction Sites, including an Extension site, the current engine can return <code>ERR_INVALID_TARGET</code> when blocking objects or Creeps occupy the target tile. A disappeared or replaced site can produce the same broad return family.</p>
<p>When this happens, re-resolve the site and inspect occupants before falling back to another task. The <a href="/en/blog/screeps-first-extension">first Extension guide</a> covers that boundary in detail.</p>

<h2 id="repair-boundary">Repair can target selected non-owned infrastructure</h2>
<p>The current <code>repair()</code> API checks whether the acting Creep is yours, whether it has active <code>WORK</code>, Energy, a valid structure target, and range. It does not require the target structure itself to have <code>my === true</code>.</p>
<p>That is why a project can deliberately include Roads and Containers in a repair policy. It should still avoid “repair everything damaged” as a default: target selection, Energy reserve policy, and defensive hit targets are application decisions.</p>

<h2 id="upgrade-boundary">Controller fallback must be owned and currently upgradeable</h2>
<p>The current engine checks <code>upgradeBlocked</code> and returns <code>ERR_INVALID_TARGET</code> while the block is active. It also returns <code>ERR_NOT_OWNER</code> for a Controller that is not yours.</p>
<p>Keep those states different in your own telemetry:</p>
<ul>
<li><code>controller-missing</code> — no Controller object in the current room;</li>
<li><code>controller-not-owned</code> — a Controller exists but is not a valid upgrade target for this Builder;</li>
<li><code>controller-upgrade-blocked</code> — yours, but temporarily blocked;</li>
<li><code>upgrade-submitted</code> — the API was actually called; inspect its return code.</li>
</ul>

<h2 id="verification">Verify the selected task after intent processing</h2>
<p>For a controlled test, snapshot only the evidence needed by the selected task:</p>
<ul>
<li>build: site ID, <code>progress</code>, <code>progressTotal</code> and target-tile occupants;</li>
<li>repair: structure ID, <code>hits</code> and <code>hitsMax</code>;</li>
<li>upgrade: Controller ID, ownership, <code>upgradeBlocked</code> and progress fields;</li>
<li>all tasks: Creep Energy, active <code>WORK</code>, range and exact action/movement return codes.</li>
</ul>
<p>Then inspect the later game state. Do not infer a precise state delta solely from <code>OK</code>, especially when another Creep could act on the same target.</p>

<h2 id="failure-policy">Why a hard high-priority error should not trigger lower-priority work immediately</h2>
<p>If a Construction Site exists but <code>build()</code> returns a hard error, immediately repairing something else can make the room look “busy” while the construction bug remains hidden. This lesson returns the selected task result and lets the next tick re-evaluate.</p>
<p>Production AI can choose a different failover policy, but it should make that policy explicit and preserve the original failure evidence.</p>

<h2 id="limits">Scope and known limits</h2>
<ul>
<li>No nearest-target or path-cost sorting.</li>
<li>No multi-Builder reservation or assignment.</li>
<li>No Wall/Rampart hit policy.</li>
<li>No per-structure repair reserve budget.</li>
<li>No claim/reserve Controller logic; the fallback is owned-room upgrading only.</li>
<li>No live multi-tick trace was collected in this editorial pass.</li>
</ul>

<h2 id="official-sources">Official documentation and engine source</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.build" rel="nofollow noopener noreferrer">Screeps API: Creep.build()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.repair" rel="nofollow noopener noreferrer">Screeps API: Creep.repair()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow noopener noreferrer">Screeps API: Creep.upgradeController()</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/creeps.js" rel="nofollow noopener noreferrer">Official screeps/engine: Creep action submission boundaries</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/creeps/repair.js" rel="nofollow noopener noreferrer">Official screeps/engine: repair processor</a></li>
</ul>`,
  },
};
