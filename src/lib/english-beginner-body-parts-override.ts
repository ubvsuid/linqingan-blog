export const englishBeginnerBodyPartsArticleOverrides = {
  "screeps-creep-body-parts": {
    title: "Screeps Creep Body Parts: WORK, CARRY, and MOVE",
    headline: "Why Your Screeps Creep Cannot Harvest, Carry, or Move",
    description:
      "Inspect one Creep's active WORK, CARRY, and MOVE parts, then use its action result, Store, fatigue, and damage to diagnose missing abilities.",
    category: "GETTING STARTED · BEGINNER LESSON 6 OF 12",
    readingTime: "8 min read",
    breadcrumbLabel: "WORK, CARRY, MOVE",
    tags: ["Creeps", "Movement", "Debugging"],
    keywords: [
      "Screeps Creep body parts",
      "Screeps WORK CARRY MOVE",
      "Creep.getActiveBodyparts()",
      "ERR_NO_BODYPART",
      "creep.body",
      "creep.fatigue",
    ],
    primaryKeyword: "Screeps Creep body parts",
    searchIntent:
      "Beginner diagnostic lesson for matching harvest, Store, and movement failures to active WORK, CARRY, and MOVE parts",
    finalScore: 98,
    verification: [
      ["Chinese source", "Read in full"],
      ["Official documentation", "Checked"],
      ["API and constants", "Checked"],
      ["JavaScript syntax", "Checked"],
      ["Offline calculation", "Passed"],
      ["Screeps Console", "Pending — replace the tutorial name with a live Creep"],
      ["Live room inspection", "Pending — no damaged-body observation is claimed"],
      ["Last verified", "July 27, 2026"],
      ["Publication status", "Ready"],
    ],
    toc: [
      ["lesson-goal", "Lesson goal"],
      ["three-parts", "Three beginner parts"],
      ["inspect-creep", "Inspect one Creep"],
      ["read-result", "Read the diagnostic"],
      ["cannot-harvest", "Cannot harvest"],
      ["cannot-carry", "Cannot carry Energy"],
      ["cannot-move", "Cannot move"],
      ["damaged-parts", "Damaged parts"],
      ["basic-body", "Basic worker body"],
      ["completion-check", "Completion check"],
      ["next-lesson", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: `
<h2 id="lesson-goal">What you will complete in this lesson</h2>
<p>Your first worker has already harvested Energy and delivered it to a Spawn. This lesson explains why those actions depend on different body parts and gives you one read-only diagnostic for checking the Creep you actually have.</p>
<p>By the end, you should be able to separate four different causes of a failed action:</p>
<ul>
<li>the required body part was never added;</li>
<li>the part exists but has been fully damaged;</li>
<li>the ability exists, but range, fatigue, Store, or target state prevents the action;</li>
<li>the tutorial name does not match a live Creep.</li>
</ul>
<p><strong>Lesson boundary:</strong> this lesson covers only <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code>. Boosts, combat parts, optimized ratios, body ordering, and advanced movement formulas belong in later guides.</p>

<h2 id="three-parts">Match each beginner part to one ability</h2>
<div class="table-scroll"><table>
<thead><tr><th>Body part</th><th>What it provides</th><th>First symptom when unavailable</th></tr></thead>
<tbody>
<tr><td><code>WORK</code></td><td>Harvesting, building, repairing, and Controller upgrading.</td><td>The related work action cannot run.</td></tr>
<tr><td><code>CARRY</code></td><td>Store capacity for carrying and delivering resources.</td><td>The worker cannot retain a normal Energy load for transport.</td></tr>
<tr><td><code>MOVE</code></td><td>Self-movement and fatigue reduction.</td><td>Movement methods cannot move the Creep under its own power.</td></tr>
</tbody>
</table></div>
<p>A body part written in the original spawn array is not automatically usable forever. The current question is how many parts remain active now.</p>

<h2 id="inspect-creep">Inspect one live Creep without changing the game</h2>
<p><strong>State impact:</strong> read-only. Replace <code>Harvester1</code> with an exact name returned by <code>Object.keys(Game.creeps)</code>.</p>
<pre><code>const CREEP_NAME = 'Harvester1';
const creep = Game.creeps[CREEP_NAME];

if (!creep) {
  console.log(
    CREEP_NAME +
    ' was not found. Check the name and capitalization.'
  );
} else {
  const parts = creep.body.map(function (part, index) {
    return {
      index: index,
      type: part.type,
      hits: part.hits,
      boost: part.boost || null,
      active: part.hits > 0
    };
  });

  console.log(JSON.stringify({
    tick: Game.time,
    name: creep.name,
    spawning: creep.spawning,
    activeWork: creep.getActiveBodyparts(WORK),
    activeCarry: creep.getActiveBodyparts(CARRY),
    activeMove: creep.getActiveBodyparts(MOVE),
    storeUsed: creep.store.getUsedCapacity(),
    storeCapacity: creep.store.getCapacity(),
    fatigue: creep.fatigue,
    parts: parts
  }, null, 2));
}</code></pre>
<p>This diagnostic does not submit an action or write to Memory. It compares the complete body description with the number of currently active parts.</p>

<h2 id="read-result">Read the diagnostic before changing code</h2>
<p>Use the result in this order:</p>
<ol>
<li>Confirm that the Creep was found and has finished spawning.</li>
<li>Read <code>activeWork</code>, <code>activeCarry</code>, and <code>activeMove</code>.</li>
<li>Inspect <code>parts</code> to see each part's type and remaining hits.</li>
<li>Read Store values before diagnosing harvesting or delivery.</li>
<li>Read <code>fatigue</code> before diagnosing movement.</li>
<li>Save the return value from the action that failed.</li>
</ol>
<p><code>creep.body</code> describes every part and its current hits. <code>getActiveBodyparts()</code> counts only live parts of the requested type, so a fully damaged part remains visible in the body array but no longer contributes its ability.</p>

<h2 id="cannot-harvest">The Creep cannot harvest</h2>
<p><code>harvest()</code> requires an active <code>WORK</code> part. Begin with the action result instead of assuming that every harvesting failure means the body is wrong.</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>Meaning</th><th>Next check</th></tr></thead>
<tbody>
<tr><td><code>activeWork === 0</code></td><td>No usable <code>WORK</code> remains.</td><td>Check whether the part is missing or has zero hits.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>The harvesting ability is unavailable.</td><td>Inspect active <code>WORK</code>.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The ability exists, but the Source is too far away.</td><td>Move toward the Source and retry on a later tick.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The selected Source has no harvestable Energy now.</td><td>Inspect the Source and its regeneration state.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The Creep cannot accept more of the harvested resource.</td><td>Inspect free Store capacity.</td></tr>
</tbody>
</table></div>
<p>Return to the <a href="/en/blog/screeps-creep-harvest-energy">first harvesting lesson</a> for the complete action → range check → movement pattern.</p>

<h2 id="cannot-carry">The Creep cannot carry or deliver Energy</h2>
<p><code>CARRY</code> provides the Store capacity used by the beginner worker. Diagnose the transport problem with three separate values:</p>
<ul>
<li><code>activeCarry</code> — whether usable <code>CARRY</code> parts remain;</li>
<li><code>storeUsed</code> — whether the Creep currently carries anything;</li>
<li><code>storeCapacity</code> — whether it has capacity for a normal transported load.</li>
</ul>
<p>A missing or fully damaged <code>CARRY</code> is a body problem. A Creep that has capacity but carries zero Energy has a resource-state problem. A Creep that carries Energy but cannot transfer it may instead be out of range or facing a full or invalid target.</p>
<p>Use the <a href="/en/blog/screeps-transfer-energy-to-spawn">Energy delivery lesson</a> to inspect the Creep's load, the Spawn's free capacity, and the <code>transfer()</code> result.</p>

<h2 id="cannot-move">The Creep cannot move</h2>
<p>An active <code>MOVE</code> part is required for self-movement. Even when <code>activeMove</code> is greater than zero, the Creep may still wait because movement has other conditions.</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>activeMove === 0</code> or <code>ERR_NO_BODYPART</code></td><td>No usable self-movement ability remains.</td></tr>
<tr><td><code>fatigue > 0</code> or <code>ERR_TIRED</code></td><td>The Creep must wait for fatigue to decrease.</td></tr>
<tr><td><code>ERR_NO_PATH</code></td><td>The movement request could not find a route to the target.</td></tr>
<tr><td><code>OK</code> but movement is intermittent</td><td>Inspect terrain, carried load, body weight, and the ratio of active <code>MOVE</code> parts.</td></tr>
</tbody>
</table></div>
<p>The focused <a href="/en/blog/screeps-moveto-not-moving"><code>moveTo()</code> troubleshooting guide</a> covers fatigue, spawning, paths, and repeated movement evidence in more detail.</p>

<h2 id="damaged-parts">A part can exist but no longer work</h2>
<p>Each entry in <code>creep.body</code> includes its remaining <code>hits</code>. When a part is fully damaged, it remains in the array but stops contributing its function.</p>
<p>This distinction explains why checking only the original body array can be misleading:</p>
<pre><code>const createdWithWork = creep.body.some(function (part) {
  return part.type === WORK;
});

const activeWork = creep.getActiveBodyparts(WORK);

console.log(JSON.stringify({
  createdWithWork: createdWithWork,
  activeWork: activeWork
}));</code></pre>
<p>The first value answers whether the body contains <code>WORK</code>. The second answers whether any usable <code>WORK</code> remains now.</p>

<h2 id="basic-body">Connect the three parts to the basic worker</h2>
<p>The worker used in the previous lessons can be represented by this body array:</p>
<pre><code>const body = [WORK, CARRY, MOVE];</code></pre>
<div class="table-scroll"><table>
<thead><tr><th>Part</th><th>Base cost</th><th>Role in the first round trip</th></tr></thead>
<tbody>
<tr><td><code>WORK</code></td><td>100 Energy</td><td>Harvests from the Source.</td></tr>
<tr><td><code>CARRY</code></td><td>50 Energy</td><td>Stores and transports Energy.</td></tr>
<tr><td><code>MOVE</code></td><td>50 Energy</td><td>Moves between the Source and Spawn.</td></tr>
</tbody>
</table></div>
<p>The total is 200 Energy under the current <code>BODYPART_COST</code> values. This is a learning body, not a universally optimal design. The next lesson will pass this array to a real Spawn.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can do all of the following:</p>
<ul>
<li>replace the example name with a live Creep;</li>
<li>explain the difference between a listed body part and an active body part;</li>
<li>match harvesting failure first to <code>WORK</code> and the action result;</li>
<li>match carrying failure first to <code>CARRY</code> and Store values;</li>
<li>match movement failure first to <code>MOVE</code>, fatigue, and the movement result;</li>
<li>explain why <code>[WORK, CARRY, MOVE]</code> supports the first Source-to-Spawn round trip.</li>
</ul>

<h2 id="next-lesson">Create the next Creep with spawnCreep()</h2>
<p>You can now read a body array and diagnose why one of its abilities is unavailable. The next lesson uses that body in a real spawn request:</p>
<p><a href="/en/blog/screeps-spawn-creep">Create a new Creep with <code>spawnCreep()</code> →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review all twelve lessons in order.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/creeps.html" rel="nofollow noopener noreferrer">Screeps Documentation: Creeps and body parts</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.body" rel="nofollow noopener noreferrer">Screeps API: Creep.body</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.getActiveBodyparts" rel="nofollow noopener noreferrer">Screeps API: Creep.getActiveBodyparts()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow noopener noreferrer">Screeps API: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow noopener noreferrer">Screeps API: Constants</a></li>
</ul>`,
  },
} as const;
