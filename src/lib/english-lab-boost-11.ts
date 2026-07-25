import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishLabBoostArticle = {
  slug: "screeps-lab-boost-creep",
  path: "/en/blog/screeps-lab-boost-creep",
  chinesePath: "/blog/screeps-lab-boost-creep",
  title: "Screeps boostCreep(): Mineral, Energy, and Part Checks",
  headline: "How to Boost Creep Body Parts Safely in Screeps",
  description:
    "Match a Lab mineral to BOOSTS, count eligible unboosted body parts, calculate LAB_BOOST_MINERAL and LAB_BOOST_ENERGY budgets, enforce range 1, ownership and activity, submit one reviewed boost request, and verify exact body-part changes afterward.",
  category: "RESOURCES · LAB BOOST WORKFLOW",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Lab Boosting",
  tags: ["Screeps", "Lab", "Boost", "Creep Body", "Minerals"],
  keywords: [
    "Screeps StructureLab boostCreep",
    "Screeps LAB_BOOST_MINERAL",
    "Screeps LAB_BOOST_ENERGY",
    "Screeps BOOSTS constant",
    "Screeps boost eligible parts",
  ],
  primaryKeyword: "Screeps StructureLab boostCreep",
  searchIntent: "Boost a controlled number of eligible Creep parts with exact resource safeguards",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — boostCreep(), BOOSTS, per-part mineral and Energy, range, bodyPartsCount, part order and return codes"],
    ["Eligibility boundary", "Only unboosted parts of the body type supported by the Lab mineral are counted"],
    ["Execution boundary", "OK means the boost was scheduled; body-part boost fields require later verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline boost review", "Passed — Lab, Creep, mineral mapping, eligible parts, requested count, Store budgets and range states"],
    ["Screeps Console test", "Pending"],
    ["Live boost, body-part order and Store delta test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["mapping", "Map the Lab mineral through BOOSTS"],
    ["eligible", "Count eligible unboosted parts"],
    ["order", "Understand body-part application order"],
    ["budget", "Calculate mineral and Energy budgets"],
    ["pure-plan", "Build a testable boost plan"],
    ["complete-example", "Complete one-time boost example"],
    ["verify", "Verify body and Store changes"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How much mineral and Energy does each boosted part consume?",
      "Use the official LAB_BOOST_MINERAL and LAB_BOOST_ENERGY constants per part. Multiply them by the number of parts you intend to boost.",
    ],
    [
      "Can a Lab boost any body part?",
      "No. The Lab mineral must exist in BOOSTS for a specific body type, and only unboosted parts of that type are eligible.",
    ],
    [
      "Which body parts are boosted first?",
      "The official API applies TOUGH boosts from left to right and other body types from right to left when bodyPartsCount limits the operation.",
    ],
    [
      "Does OK prove the requested number of parts changed?",
      "No. Save an eligible-part snapshot and compare the Creep body and Lab Store afterward.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-lab-run-reaction",
    label: "Previous Lab guide",
    title: "Run Lab Reactions",
  },
  next: {
    href: "/en/blog/screeps-factory-produce",
    label: "Next production guide",
    title: "Produce Factory Commodities",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Recover one owned active Lab and one owned Creep in the same room, read the Lab mineral, find the supported body type through <code>BOOSTS</code>, count unboosted eligible parts, limit the requested count, require <code>LAB_BOOST_MINERAL</code> and <code>LAB_BOOST_ENERGY</code> per part, enforce range 1, disable the one-time request before <code>lab.boostCreep()</code>, then compare body-part boost fields and Lab Store afterward.</p>

<h2 id="mapping">Map the Lab mineral through BOOSTS</h2>
<pre><code class="language-javascript">function getBoostBodyType(mineralType) {
  if (typeof mineralType !== 'string') {
    return null;
  }

  for (const bodyType of BODYPARTS_ALL) {
    if (BOOSTS[bodyType]?.[mineralType]) {
      return bodyType;
    }
  }

  return null;
}</code></pre>
<p>Do not infer the body type from the mineral name. Use the current official <code>BOOSTS</code> mapping.</p>

<h2 id="eligible">Count eligible unboosted parts</h2>
<pre><code class="language-javascript">function getEligibleBoostParts(creep, bodyType) {
  return creep.body
    .map((part, index) => ({ part, index }))
    .filter(({ part }) =>
      part.type === bodyType
      && part.hits > 0
      && !part.boost
    );
}</code></pre>
<p>Damaged but active parts remain eligible when <code>hits > 0</code>. Already boosted parts must not be counted again.</p>

<h2 id="order">Understand body-part application order</h2>
<pre><code class="language-javascript">function getExpectedBoostIndexes(
  eligible,
  bodyType,
  count
) {
  const ordered = bodyType === TOUGH
    ? [...eligible]
    : [...eligible].reverse();

  return ordered
    .slice(0, count)
    .map(item => item.index);
}</code></pre>
<p>This prediction helps verification when <code>bodyPartsCount</code> is lower than the total eligible count. The API's part-order rule matters for carefully ordered combat bodies.</p>

<h2 id="budget">Calculate mineral and Energy budgets</h2>
<pre><code class="language-javascript">function calculateBoostBudget(partCount) {
  if (!Number.isInteger(partCount) || partCount <= 0) {
    return null;
  }

  return {
    mineral: partCount * LAB_BOOST_MINERAL,
    energy: partCount * LAB_BOOST_ENERGY
  };
}</code></pre>
<p>The Lab must already contain the boost mineral and enough Energy. Resource hauling is a separate workflow.</p>

<h2 id="pure-plan">Build a testable boost plan</h2>
<pre><code class="language-javascript">function evaluateBoost(input) {
  const { lab, creep, requestedParts } = input;

  if (!lab || !creep) {
    return { ready: false, reason: 'object-missing' };
  }

  if (lab.room.name !== creep.room.name) {
    return { ready: false, reason: 'different-rooms' };
  }

  const mineralType = lab.mineralType;
  const bodyType = getBoostBodyType(mineralType);

  if (!mineralType || !bodyType) {
    return { ready: false, reason: 'boost-mineral-invalid' };
  }

  const eligible = getEligibleBoostParts(creep, bodyType);
  const count = requestedParts == null
    ? eligible.length
    : requestedParts;

  if (
    !Number.isInteger(count)
    || count <= 0
    || count > eligible.length
  ) {
    return {
      ready: false,
      reason: 'part-count-invalid',
      eligibleCount: eligible.length
    };
  }

  const budget = calculateBoostBudget(count);

  if (
    lab.store.getUsedCapacity(mineralType)
      < budget.mineral
    || lab.store.getUsedCapacity(RESOURCE_ENERGY)
      < budget.energy
  ) {
    return {
      ready: false,
      reason: 'resources-insufficient',
      mineralType,
      bodyType,
      ...budget
    };
  }

  if (!lab.pos.isNearTo(creep)) {
    return { ready: false, reason: 'creep-out-of-range' };
  }

  return {
    ready: true,
    reason: 'ready',
    mineralType,
    bodyType,
    partCount: count,
    expectedIndexes:
      getExpectedBoostIndexes(eligible, bodyType, count),
    ...budget
  };
}</code></pre>

<h2 id="complete-example">Complete one-time boost example</h2>
<p><strong>State impact:</strong> this code may schedule one real boost and writes a request snapshot. It never retries automatically.</p>
<pre><code class="language-javascript">function getOwnedActiveLab(id) {
  const lab = typeof id === 'string'
    ? Game.getObjectById(id)
    : null;

  return lab
    && lab.structureType === STRUCTURE_LAB
    && lab.my === true
    && lab.isActive() === true
      ? lab
      : null;
}

module.exports.loop = function () {
  const request = Memory.labBoostRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const lab = getOwnedActiveLab(request.labId);
  const creep = typeof request.creepName === 'string'
    ? Game.creeps[request.creepName]
    : null;
  const ownedCreep = creep?.my === true
    && creep.spawning !== true
      ? creep
      : null;
  const plan = evaluateBoost({
    lab,
    creep: ownedCreep,
    requestedParts: request.bodyPartsCount
  });

  request.lastCheckedAt = Game.time;
  request.lastStatus = plan.reason;

  if (!plan.ready) {
    request.preview = {
      eligibleCount: plan.eligibleCount ?? null,
      mineral: plan.mineral ?? null,
      energy: plan.energy ?? null
    };
    return;
  }

  request.enabled = false;
  request.submittedAt = Game.time;
  request.snapshot = {
    labId: lab.id,
    creepName: ownedCreep.name,
    mineralType: plan.mineralType,
    bodyType: plan.bodyType,
    partCount: plan.partCount,
    expectedIndexes: plan.expectedIndexes,
    mineralBefore:
      lab.store.getUsedCapacity(plan.mineralType),
    energyBefore:
      lab.store.getUsedCapacity(RESOURCE_ENERGY),
    boostsBefore: ownedCreep.body.map(part =>
      part.boost ?? null
    )
  };

  const result = lab.boostCreep(
    ownedCreep,
    plan.partCount
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-verification'
    : 'failed-review-required';
};</code></pre>

<h2 id="verify">Verify body and Store changes</h2>
<pre><code class="language-javascript">function verifyBoost(request) {
  const snapshot = request?.snapshot;
  const creep = snapshot
    ? Game.creeps[snapshot.creepName]
    : null;

  if (!snapshot || !creep) {
    return { verified: false, reason: 'snapshot-or-creep-missing' };
  }

  const changedIndexes = creep.body
    .map((part, index) => ({
      index,
      before: snapshot.boostsBefore[index],
      after: part.boost ?? null
    }))
    .filter(item => item.before !== item.after)
    .map(item => item.index);

  return {
    verified:
      request.result === OK
      && changedIndexes.length === snapshot.partCount,
    changedIndexes,
    expectedIndexes: snapshot.expectedIndexes
  };
}</code></pre>
<p>The Creep may die or leave visibility before verification. Keep the request snapshot and treat that as an unavailable outcome, not automatic success.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Boost scheduled</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Mineral or Energy insufficient</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Creep cannot be boosted by this Lab mineral</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Creep is not adjacent</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Requested body-part count is invalid</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Lab is inactive at the current RCL</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Recover one owned active Lab and one owned Creep.</li>
<li>Require the same room and range 1.</li>
<li>Map the mineral through <code>BOOSTS</code>.</li>
<li>Count only active unboosted eligible parts.</li>
<li>Validate the requested count.</li>
<li>Calculate per-part mineral and Energy.</li>
<li>Predict part order for limited boosts.</li>
<li>Disable before the call.</li>
<li>Save body and Store snapshots.</li>
<li>Verify exact changed indexes later.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement boost queues, Lab mineral loading, body design, combat deployment, unboosting, or multi-Lab assignment. Continue with <a href="/en/blog/screeps-factory-produce">Factory commodity production</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can already boosted parts be boosted again?</h3>
<p>No. Count only unboosted eligible parts.</p>
<h3>Can bodyPartsCount exceed eligible parts?</h3>
<p>No. Reject that request before calling.</p>
<h3>Why predict indexes?</h3>
<p>Limited boosts follow a documented body-order rule and can affect combat body behavior.</p>
<h3>Should a failed boost retry every tick?</h3>
<p>No. Require a new reviewed request.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLab.boostCreep" rel="nofollow">API Reference: StructureLab.boostCreep()</a></li>
<li><a href="https://docs.screeps.com/resources.html#Boosts" rel="nofollow">Screeps Documentation: Boosts</a></li>
<li><a href="https://docs.screeps.com/api/#BOOSTS" rel="nofollow">API Reference: BOOSTS</a></li>
<li><a href="https://docs.screeps.com/api/#LAB_BOOST_MINERAL" rel="nofollow">API Reference: LAB_BOOST_MINERAL</a></li>
<li><a href="https://docs.screeps.com/api/#LAB_BOOST_ENERGY" rel="nofollow">API Reference: LAB_BOOST_ENERGY</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
