import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishSourceSelectionArticle = {
  slug: "screeps-select-source-by-path",
  path: "/en/blog/screeps-select-source-by-path",
  chinesePath: "/blog/screeps-select-source-by-path",
  title: "Screeps Source Selection: Reachable Paths, Assignments, and Stable IDs",
  headline: "How to Select an Active Source by Reachable Path Without Target Churn",
  description:
    "Recover a stored Source ID first, distinguish FIND_SOURCES from FIND_SOURCES_ACTIVE, build reachable path candidates, rank path length before assignment count and stable ID, store the selected identity, handle empty Sources according to a documented dynamic policy, and preserve harvest and movement results.",
  category: "HARVESTING · SOURCE TARGET SELECTION",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "19 min read",
  breadcrumbLabel: "Source Selection",
  tags: ["Screeps", "Source", "Pathfinding", "Harvesting", "Target Selection"],
  keywords: [
    "Screeps select Source by path",
    "Screeps FIND_SOURCES_ACTIVE",
    "Screeps Source assignment count",
    "Screeps store Source ID",
    "Screeps findClosestByPath Source",
  ],
  primaryKeyword: "Screeps select Source by path",
  searchIntent: "Keep or select a reachable active Source with deterministic path and load ordering",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Source, FIND_SOURCES, FIND_SOURCES_ACTIVE, RoomPosition path methods, Game.getObjectById(), harvest() and return codes"],
    ["Policy boundary", "Dynamic empty-Source replacement, assignment counts, ignoreCreeps and path options are project choices"],
    ["Visibility boundary", "A null ID recovery can mean no visibility for a remote room; local and remote target records must not use the same deletion rule blindly"],
    ["JavaScript syntax", "Passed"],
    ["Offline selection review", "Passed — active state, reachability, path length, assignment count, stable ID, stored target and no-candidate states"],
    ["Screeps Console test", "Pending"],
    ["Live multi-Source pathing, traffic, regeneration, assignment contention, remote visibility and CPU test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["range-vs-path", "Range-nearest is not path-nearest"],
    ["active-vs-all", "Choose active or all Sources intentionally"],
    ["assignments", "Count declared Source assignments"],
    ["candidate-order", "Rank reachable candidates deterministically"],
    ["stored-target", "Recover a stored Source first"],
    ["complete-example", "Complete dynamic Source selector"],
    ["empty-source", "Choose an empty-Source policy explicitly"],
    ["visibility", "Preserve remote-room visibility context"],
    ["cpu", "Measure pathfinding CPU instead of guessing"],
    ["after-action", "Preserve harvest and movement results"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    ["Why not use room.find(FIND_SOURCES)[0]?", "Array order does not represent distance, reachability, load, or a stable mining identity."],
    ["What is the difference between FIND_SOURCES and FIND_SOURCES_ACTIVE?", "The first includes all Sources; the second includes Sources that currently have Energy. Which one fits depends on whether the job is fixed or dynamically reassignable."],
    ["Does an assignment count prove a Creep is harvesting there?", "No. It only summarizes declared Memory targets. Creeps may be moving, dead, blocked, full, or assigned by stale data."],
    ["Should an empty Source ID be deleted?", "Only under a documented dynamic policy. Fixed mining positions normally keep the identity and wait for regeneration."],
  ],
  previous: {
    href: "/en/blog/screeps-link-transfer-energy",
    label: "Previous logistics guide",
    title: "Transfer Link Energy Safely",
  },
  next: {
    href: "/en/blog",
    label: "Continue reading",
    title: "Return to English Articles",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Recover the Creep's stored Source ID first. If the current visible Source still matches the task and has Energy, keep it. Otherwise find <code>FIND_SOURCES_ACTIVE</code>, build only reachable candidates, rank shorter path before lower declared assignment count and stable Source ID, store the chosen ID plus room context, call <code>harvest()</code>, move to range 1 only on <code>ERR_NOT_IN_RANGE</code>, and apply a documented policy when the Source becomes empty.</p>

<h2 id="range-vs-path">Range-nearest is not path-nearest</h2>
<pre><code class="language-javascript">const nearestByRange = creep.pos.findClosestByRange(
  FIND_SOURCES
);

const nearestByPath = creep.pos.findClosestByPath(
  FIND_SOURCES
);</code></pre>
<p>Range compares RoomPosition distance. Path selection considers terrain and obstacles and can return <code>null</code> when no route is available. Path-aware selection is usually more relevant when a Creep must walk to the Source, but it also costs more CPU.</p>

<h2 id="active-vs-all">Choose active or all Sources intentionally</h2>
<pre><code class="language-javascript">const allSources = creep.room.find(FIND_SOURCES);
const activeSources = creep.room.find(
  FIND_SOURCES_ACTIVE
);</code></pre>
<p>A fixed miner normally keeps its assigned Source through regeneration. A flexible early-room harvester may select only Sources with Energy. The query constant expresses task policy, not a universal best practice.</p>

<h2 id="assignments">Count declared Source assignments</h2>
<pre><code class="language-javascript">function countAssignmentsBySource() {
  const counts = {};

  for (const creep of Object.values(Game.creeps)) {
    const sourceId = creep.memory?.sourceId;

    if (typeof sourceId !== 'string') {
      continue;
    }

    counts[sourceId] = (counts[sourceId] || 0) + 1;
  }

  return counts;
}</code></pre>
<p>The count represents Memory declarations only. It does not prove the Creep arrived, has free capacity, has active WORK, or is still following that task.</p>

<h2 id="candidate-order">Rank reachable candidates deterministically</h2>
<pre><code class="language-javascript">function selectSourceCandidate(candidates) {
  return [...candidates]
    .filter(candidate =>
      typeof candidate.id === 'string'
      && Number.isFinite(candidate.energy)
      && candidate.energy > 0
      && Number.isFinite(candidate.pathLength)
      && candidate.pathLength >= 0
      && candidate.reachable === true
      && Number.isInteger(candidate.assignmentCount)
      && candidate.assignmentCount >= 0
    )
    .sort((left, right) =>
      left.pathLength - right.pathLength
      || left.assignmentCount - right.assignmentCount
      || left.id.localeCompare(right.id)
    )[0] || null;
}</code></pre>
<p>Path length has priority here; assignment count breaks equal-path ties. This is not a full mining-slot scheduler and does not count walkable tiles around the Source.</p>
<pre><code class="language-javascript">function buildSourceCandidates(creep, sources) {
  const assignments = countAssignmentsBySource();
  const candidates = [];

  for (const source of sources) {
    const path = creep.pos.findPathTo(source, {
      range: 1,
      ignoreCreeps: true,
      maxOps: 4000
    });
    const alreadyNear = creep.pos.isNearTo(source);

    if (path.length === 0 && !alreadyNear) {
      continue;
    }

    candidates.push({
      source,
      id: source.id,
      energy: source.energy,
      reachable: true,
      pathLength: path.length,
      assignmentCount: assignments[source.id] || 0
    });
  }

  return candidates;
}</code></pre>
<p><code>ignoreCreeps: true</code> reduces temporary traffic influence on long-lived assignment, but actual movement can still be blocked.</p>

<h2 id="stored-target">Recover a stored Source first</h2>
<pre><code class="language-javascript">function getStoredActiveSource(creep) {
  const sourceId = creep.memory?.sourceId;

  if (typeof sourceId !== 'string') {
    return null;
  }

  const source = Game.getObjectById(sourceId);
  if (!source) {
    return null;
  }

  if (
    !Number.isFinite(source.energy)
    || source.energy <= 0
  ) {
    return null;
  }

  return source;
}</code></pre>
<p>Keeping a valid ID avoids repeated selection and target churn. Do not automatically delete a remote ID merely because the object is not visible.</p>

<h2 id="complete-example">Complete dynamic Source selector</h2>
<pre><code class="language-javascript">function chooseActiveSource(creep) {
  const stored = getStoredActiveSource(creep);
  if (stored) {
    return {
      source: stored,
      selection: 'stored-active-id'
    };
  }

  const candidates = buildSourceCandidates(
    creep,
    creep.room.find(FIND_SOURCES_ACTIVE)
  );
  const selected = selectSourceCandidate(candidates);

  if (!selected) {
    return {
      source: null,
      selection: 'active-source-not-found'
    };
  }

  creep.memory.sourceId = selected.source.id;
  creep.memory.sourceRoom = selected.source.pos.roomName;
  creep.memory.sourceSelectedAt = Game.time;

  return {
    source: selected.source,
    selection: 'reachable-candidate',
    pathLength: selected.pathLength,
    assignmentCount: selected.assignmentCount
  };
}</code></pre>
<pre><code class="language-javascript">function runDynamicHarvester(creep) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  if (creep.getActiveBodyparts(WORK) <= 0) {
    return { status: 'no-active-work' };
  }

  if (
    creep.store.getFreeCapacity(RESOURCE_ENERGY)
    <= 0
  ) {
    return { status: 'creep-full' };
  }

  const choice = chooseActiveSource(creep);
  if (!choice.source) {
    return { status: choice.selection };
  }

  const result = creep.harvest(choice.source);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(choice.source, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-source',
      sourceId: choice.source.id,
      selection: choice.selection,
      result,
      moveResult
    };
  }

  if (result === ERR_NOT_ENOUGH_RESOURCES) {
    delete creep.memory.sourceId;
  }

  return {
    status: result === OK
      ? 'harvest-scheduled'
      : 'harvest-rejected',
    sourceId: choice.source.id,
    selection: choice.selection,
    result
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;
  const outcome = runDynamicHarvester(creep);

  if (
    outcome.status === 'harvest-rejected'
    || outcome.status === 'active-source-not-found'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'source-selection-status',
      creepName: creep?.name || null,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="empty-source">Choose an empty-Source policy explicitly</h2>
<p>This example is dynamic and deletes the stored ID after <code>ERR_NOT_ENOUGH_RESOURCES</code>. A fixed miner should normally preserve the ID and wait for regeneration. Do not mix those policies accidentally.</p>
<pre><code class="language-javascript">function handleEmptySource(creep, mode) {
  if (mode === 'dynamic') {
    delete creep.memory.sourceId;
    return 'target-cleared';
  }

  return 'target-preserved';
}</code></pre>

<h2 id="visibility">Preserve remote-room visibility context</h2>
<pre><code class="language-javascript">function inspectStoredSourceRecord(creep) {
  const sourceId = creep.memory?.sourceId;
  const roomName = creep.memory?.sourceRoom;
  const roomVisible = typeof roomName === 'string'
    ? Boolean(Game.rooms[roomName])
    : null;
  const source = typeof sourceId === 'string'
    ? Game.getObjectById(sourceId)
    : null;

  return {
    sourceId: sourceId || null,
    roomName: roomName || null,
    roomVisible,
    sourceFound: Boolean(source)
  };
}</code></pre>
<p>For a remote assignment, <code>null</code> can mean no current visibility. Keep room context so missing evidence is not mistaken for confirmed object deletion.</p>

<h2 id="cpu">Measure pathfinding CPU instead of guessing</h2>
<pre><code class="language-javascript">function measureSourceSelection(creep) {
  const before = Game.cpu.getUsed();
  const choice = chooseActiveSource(creep);
  const after = Game.cpu.getUsed();

  return {
    choice,
    cpuUsed: after - before
  };
}</code></pre>
<p>Pathfinding cost depends on room terrain, options, caches, candidate count and runtime state. Measure representative ticks before optimizing.</p>

<h2 id="after-action">Preserve harvest and movement results</h2>
<p>Saving only the selected Source ID is not enough. Keep the <code>harvest()</code> result and, when movement is requested, the <code>moveTo()</code> result as separate evidence.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Harvest scheduled</td><td>Observe Store and Source later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Creep not yours</td><td>Current Creep</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep spawning</td><td>Wait</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Source currently empty</td><td>Apply fixed or dynamic policy</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Object is not harvestable</td><td>Refresh current target</td></tr>
<tr><td><code>ERR_FULL</code></td><td>Creep Store full</td><td>Switch task state</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Not adjacent</td><td>Move to range 1</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active WORK</td><td>Body damage or replacement</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Recover a stored Source ID first.</li>
<li>Keep room context for remote targets.</li>
<li>Choose all or active Sources intentionally.</li>
<li>Build only reachable path candidates.</li>
<li>Count assignments as declarations, not proof.</li>
<li>Sort by path, assignment count and ID.</li>
<li>Require free capacity and active WORK.</li>
<li>Document empty-Source behavior.</li>
<li>Save harvest and movement results.</li>
<li>Measure real CPU before optimizing.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not allocate walkable mining slots, reserve containers, coordinate remote rooms without vision, prevent all traffic jams, cache paths across resets, or balance lifetime Energy throughput. Return to the <a href="/en/blog">English article library</a> for harvesting, movement and runtime foundations.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why rank path before assignment count?</h3>
<p>It preserves reachability and shorter travel as the primary rule. A room scheduler may weight load more heavily when mining slots are scarce.</p>
<h3>Can findClosestByPath replace the candidate builder?</h3>
<p>It can select a reachable target simply, but a custom candidate list is needed when assignment count and deterministic extra tie-breakers matter.</p>
<h3>Why ignore Creeps while building long-lived candidates?</h3>
<p>Temporary traffic should not necessarily rewrite a persistent mining assignment, but actual movement must still handle occupied tiles.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Source" rel="nofollow">API Reference: Source</a></li>
<li><a href="https://docs.screeps.com/api/#RoomPosition.findClosestByPath" rel="nofollow">API Reference: findClosestByPath()</a></li>
<li><a href="https://docs.screeps.com/api/#RoomPosition.findPathTo" rel="nofollow">API Reference: findPathTo()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">API Reference: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Game.getObjectById" rel="nofollow">API Reference: Game.getObjectById()</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
