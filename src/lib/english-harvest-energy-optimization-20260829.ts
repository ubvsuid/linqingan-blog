import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const SLUG = "screeps-creep-harvest-energy";
const UPDATED_AT = "2026-08-29";

export function getEnglishHarvestEnergyOptimizationUpdatedAt20260829(
  slug: string,
): string | undefined {
  return slug === SLUG ? UPDATED_AT : undefined;
}

export function applyEnglishHarvestEnergyOptimization20260829(
  article: EnglishBeginnerArticle,
): EnglishBeginnerArticle | undefined {
  if (article.slug !== SLUG) {
    return undefined;
  }

  return {
    ...article,
    title: "Screeps Harvest Energy: Build Your First Creep.harvest() Loop",
    headline: "How to Harvest Energy With Your First Creep",
    description:
      "Use Creep.harvest() to find an active Source, move into range, keep harvesting until your Creep is ready to deliver, and read Source-specific return codes without treating ERR_FULL as a harvest result.",
    category: "GETTING STARTED · HARVESTING",
    readingTime: "10 min read",
    breadcrumbLabel: "Harvest Energy",
    tags: ["Screeps", "Creeps", "Energy", "Creep.harvest", "JavaScript"],
    keywords: [
      "Screeps harvest energy",
      "Creep.harvest",
      "Screeps active Source",
      "Creep.harvest return codes",
      "Screeps ERR_NOT_IN_RANGE",
    ],
    primaryKeyword: "Screeps harvest energy",
    searchIntent:
      "Learn the simplest reliable Source-harvesting loop for a first Creep, then understand the return-code and Store-capacity boundaries needed before delivery",
    finalScore: 98,
    verification: [
      ["Chinese source article", "Reviewed in full"],
      [
        "Official documentation",
        "Checked August 29, 2026 — Creep.harvest(), Creep Store capacity, FIND_SOURCES_ACTIVE, and current-tick action return semantics",
      ],
      [
        "Official engine source",
        "Checked current screeps/engine master — Source harvest submission has no Store-capacity ERR_FULL preflight; the processor drops overflow beyond Creep Store capacity",
      ],
      [
        "Static code review",
        "Passed — the minimal loop preserves harvest and movement results separately, and the larger-body capacity guard is scoped to an unboosted Source-harvesting policy",
      ],
      ["Screeps Console test", "Pending — no live Source-harvest trace is claimed"],
      ["Live multi-tick verification", "Pending"],
      [
        "Live Source-overflow test",
        "Pending — no live near-full, full-Store, or dropped-overflow comparison is claimed",
      ],
      [
        "Evidence level",
        "Official documentation, official engine source, repository review and offline code checks; no Console or live-shard evidence claimed",
      ],
      ["Last editorial review", "August 29, 2026"],
      ["Publication status", "Published"],
    ],
    toc: [
      ["quick-answer", "Quick answer"],
      ["minimal-loop", "Minimal harvesting loop"],
      ["what-happens", "What happens each tick"],
      ["stop-harvesting", "When to stop harvesting"],
      ["return-codes", "Source harvest return codes"],
      ["source-selection", "Why use FIND_SOURCES_ACTIVE"],
      ["capacity-hardening", "Larger-body capacity hardening"],
      ["debug", "Debug state, action, and movement"],
      ["verify", "How to verify the loop"],
      ["next", "Next lesson"],
      ["official-sources", "Official sources"],
    ],
    faq: [],
    articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>To harvest Energy, pick an active <code>Source</code>, call <code>creep.harvest(source)</code>, and move toward it when the result is <code>ERR_NOT_IN_RANGE</code>. When the Creep has no free Energy capacity left, stop the harvesting phase and move on to delivery.</p>
<p>The important beginner distinction is simple: <strong>Store capacity is Creep state; the value returned by <code>harvest()</code> is an action result.</strong> Do not wait for <code>ERR_FULL</code> to tell you the Store is full. Source harvesting does not return <code>ERR_FULL</code>.</p>

<h2 id="minimal-loop">Start with this minimal harvesting loop</h2>
<p>Pass one of your Creeps into this function. It does not assume a particular Creep name, room name, or Source ID:</p>
<pre><code class="language-javascript">function harvestEnergy(creep) {
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY);

  if (freeEnergy === null || freeEnergy === 0) {
    return { status: 'ready-for-delivery' };
  }

  const source =
    creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) {
    return { status: 'no-active-source' };
  }

  const harvestResult = creep.harvest(source);
  let moveResult = null;

  if (harvestResult === ERR_NOT_IN_RANGE) {
    moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 5
    });
  }

  return {
    status: harvestResult === OK
      ? 'harvest-accepted'
      : 'harvest-not-accepted',
    sourceId: source.id,
    harvestResult,
    moveResult
  };
}</code></pre>
<p>A normal first trip is easy to read: while the Store has room, find an active Source; if the Source is too far away, move; once adjacent, <code>harvest()</code> can return <code>OK</code>; when the Store is full, leave this acquisition function and run the delivery step.</p>

<h2 id="what-happens">What happens each tick</h2>
<ol>
<li><strong>Read Store state.</strong> <code>getFreeCapacity(RESOURCE_ENERGY)</code> decides whether this role still needs to acquire Energy.</li>
<li><strong>Choose a usable Source.</strong> <code>FIND_SOURCES_ACTIVE</code> avoids choosing a currently empty Source in this beginner loop.</li>
<li><strong>Submit the harvest action.</strong> If the Creep is adjacent and the other API conditions are satisfied, <code>harvest()</code> returns <code>OK</code>.</li>
<li><strong>Handle range separately.</strong> If harvesting returns <code>ERR_NOT_IN_RANGE</code>, submit movement and keep the movement result separate from the harvest result.</li>
<li><strong>Run the loop again next tick.</strong> Screeps processes intents after your player code, so <code>OK</code> is not the same thing as a later observed Store increase.</li>
</ol>
<p>This separation makes debugging much easier. You can tell whether the problem is current state, the harvest call, or movement instead of collapsing all three into one boolean.</p>

<h2 id="stop-harvesting">When should the Creep stop harvesting?</h2>
<p>For a first Creep that harvests and then carries Energy to another object, the simplest phase boundary is:</p>
<blockquote><p><strong>Free Energy capacity available → harvest. No free Energy capacity → deliver.</strong></p></blockquote>
<p>That rule is enough to understand the basic loop. Once <code>ready-for-delivery</code> is returned, hand the Creep to your delivery logic instead of continuing to call <code>harvest()</code>.</p>
<p>This is application state, not a special harvest return code. In particular, do not write role logic that waits for <code>creep.harvest(source) === ERR_FULL</code>. The current Source-harvest API path has no Store-capacity <code>ERR_FULL</code> preflight.</p>

<h2 id="return-codes">Source-specific Creep.harvest() return codes</h2>
<p>This lesson is scoped to <code>Source</code> Energy. Minerals and Deposits have additional conditions, so keep their branches out of a first Source-harvesting loop.</p>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>What it means here</th><th>Next step</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The harvest intent was accepted for this tick.</td><td>Check the later visible Source and Store state if you need proof of the processed result.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent to the Source.</td><td>Move to range 1, then retry on a later tick.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Source currently has no Energy.</td><td>Wait for regeneration or choose another active Source.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>WORK</code> part is available.</td><td>Inspect the Creep body and damage.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning is complete.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The object passed to this call is not a valid harvest target.</td><td>Resolve the Source again.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The actor or room ownership/reservation boundary does not allow this Source harvest.</td><td>Check Creep ownership and the room Controller state.</td></tr>
</tbody></table></div>
<p><code>ERR_FULL</code> is deliberately absent. Some other Creep APIs use <code>ERR_FULL</code>, but it is not a universal Store-capacity result and is not returned by Source <code>harvest()</code>.</p>

<h2 id="source-selection">Why use FIND_SOURCES_ACTIVE?</h2>
<p><code>FIND_SOURCES_ACTIVE</code> gives this beginner loop Sources that currently contain Energy. That reduces one avoidable failure branch while you are learning the action flow.</p>
<p>This is a target-selection policy, not a requirement of <code>harvest()</code>. A dedicated miner can stay assigned to one Source and wait for regeneration; a general-purpose first worker usually benefits from selecting an active Source.</p>

<h2 id="capacity-hardening">Harden the capacity boundary after the basic loop works</h2>
<p>The full-Store rule above is intentionally minimal. A larger unboosted Creep can have several active <code>WORK</code> parts, so one Source harvest batch can be larger than the remaining Store capacity.</p>
<p>The current public engine processor adds the harvested amount and drops overflow when total carried resources exceed Store capacity. For a mobile beginner worker, deliberately overflowing the Store is usually unnecessary. Linqingan therefore uses this conservative <strong>project policy</strong> for an unboosted Source-harvesting carrier: if the Creep already carries Energy and the remaining capacity is smaller than the next full Source batch, switch to delivery a little early.</p>
<pre><code class="language-javascript">function getHarvestCapacityState(creep) {
  const activeWork = creep.getActiveBodyparts(WORK);
  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;
  const energyCapacity =
    creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;
  const nextBatch = activeWork * HARVEST_POWER;

  if (energyCapacity &lt;= 0) {
    return 'no-energy-capacity';
  }

  if (nextBatch &gt; energyCapacity) {
    return 'body-store-mismatch';
  }

  if (
    freeEnergy === 0
    || (usedEnergy &gt; 0 &amp;&amp; freeEnergy &lt; nextBatch)
  ) {
    return 'ready-for-delivery';
  }

  return 'can-harvest';
}</code></pre>
<p><code>body-store-mismatch</code> means one unboosted Source batch is larger than the Creep's entire Energy capacity. Change the body or use a deliberate drop-mining design instead of pretending all of that batch can fit.</p>
<p>This formula is not an official Screeps recommendation. It is a local policy for the unboosted beginner body in this lesson. Boosted WORK parts need a different batch calculation.</p>

<h2 id="debug">Debug state, action, and movement separately</h2>
<div class="table-scroll"><table>
<thead><tr><th>Layer</th><th>Question</th><th>Evidence to inspect</th></tr></thead>
<tbody>
<tr><td>State</td><td>Should this Creep still be acquiring Energy?</td><td><code>store.getUsedCapacity()</code> and <code>store.getFreeCapacity()</code>.</td></tr>
<tr><td>Action</td><td>Was the Source harvest accepted?</td><td>The exact value returned by <code>harvest()</code>.</td></tr>
<tr><td>Movement</td><td>If range failed, was movement accepted?</td><td>The separate <code>moveTo()</code> result and the later Creep position.</td></tr>
</tbody></table></div>
<p>If you overwrite the harvest result with the movement result, you lose the evidence that tells you which layer failed.</p>

<h2 id="verify">How to verify the loop in your room</h2>
<p>Start with read-only observations. Pick your actual Creep rather than copying a placeholder name, then inspect its Store, active WORK parts, position, and the active Sources visible in its room.</p>
<p>When testing the loop, preserve the <code>harvestResult</code>. If it is <code>OK</code>, inspect a later tick when you need to confirm the processed Source/Store change. If it is <code>ERR_NOT_IN_RANGE</code>, preserve the separate movement result and verify that the Creep's later position changed as expected.</p>
<p><strong>Evidence boundary:</strong> the API and public engine paths above were reviewed, but this article does not claim a captured live full-Store or near-full overflow trace. Those runtime cases remain Pending.</p>

<h2 id="next">Next lesson</h2>
<p>Once the Creep is ready to deliver, continue with <a href="/en/blog/screeps-transfer-energy-to-spawn">Creep-to-Spawn Energy delivery</a>. If the harvest action keeps returning <code>ERR_NOT_IN_RANGE</code>, use the <a href="/en/blog/screeps-err-not-in-range">range debugging guide</a> to separate pathing and movement failures from the harvest call.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getFreeCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow noopener noreferrer">Screeps API: Room.find() and FIND_SOURCES_ACTIVE</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/game/creeps.js" rel="nofollow noopener noreferrer">Official screeps/engine: Creep.harvest() submission path</a></li>
<li><a href="https://github.com/screeps/engine/blob/master/src/processor/intents/creeps/harvest.js" rel="nofollow noopener noreferrer">Official screeps/engine: harvest processor</a></li>
</ul>`,
  };
}
