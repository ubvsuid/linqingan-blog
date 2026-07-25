import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishLabReactionArticle = {
  slug: "screeps-lab-run-reaction",
  path: "/en/blog/screeps-lab-run-reaction",
  chinesePath: "/blog/screeps-lab-run-reaction",
  title: "Screeps runReaction(): Inputs, Range, and Cooldown",
  headline: "How to Run Lab Reactions Safely in Screeps",
  description:
    "Validate three owned active Labs, resolve the REACTIONS recipe, check reagent stores, output mineral compatibility, free capacity, range 2, cooldown, and a one-time production request before calling runReaction() and verifying the next tick.",
  category: "RESOURCES · LAB REACTION WORKFLOW",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Lab Reactions",
  tags: ["Screeps", "Lab", "Reaction", "Minerals", "Automation"],
  keywords: [
    "Screeps StructureLab runReaction",
    "Screeps lab reaction range",
    "Screeps REACTIONS constant",
    "Screeps lab cooldown",
    "Screeps reaction output capacity",
  ],
  primaryKeyword: "Screeps StructureLab runReaction",
  searchIntent: "Run one validated Lab reaction and verify the output afterward",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — runReaction(), REACTIONS, LAB_REACTION_AMOUNT, REACTION_TIME, range and return codes"],
    ["Recipe boundary", "The product is derived from current input mineral types; no recipe name is trusted from Memory alone"],
    ["Execution boundary", "OK means the reaction was scheduled; output Store and cooldown require next-tick verification"],
    ["JavaScript syntax", "Passed"],
    ["Offline reaction review", "Passed — missing Lab, ownership, activity, recipe, reagent amount, output compatibility, capacity, range and cooldown states"],
    ["Screeps Console test", "Pending"],
    ["Live reaction, Store delta and cooldown test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["three-labs", "Use two input Labs and one output Lab"],
    ["recipe", "Resolve the recipe from REACTIONS"],
    ["resources", "Check reagent amount and output capacity"],
    ["range-cooldown", "Check range and cooldown"],
    ["pure-plan", "Build a testable reaction plan"],
    ["complete-example", "Complete one-time reaction example"],
    ["verify", "Verify output on the next tick"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "How many Labs are needed for runReaction()?",
      "One output Lab calls runReaction() with two input Labs. Multiple output Labs may share the same two input Labs when range and resources allow it.",
    ],
    [
      "How close must the input Labs be?",
      "Both input Labs must be within range 2 of the output Lab. Check the current RoomPosition relationship before calling.",
    ],
    [
      "Can an output Lab contain another mineral?",
      "No. It must be empty or already contain the exact product, and it needs enough free capacity for LAB_REACTION_AMOUNT.",
    ],
    [
      "Does OK prove the product is already in the Lab?",
      "No. OK means the operation was scheduled. Compare output Store and cooldown on the next tick.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-terminal-send-resources",
    label: "Previous logistics guide",
    title: "Send Resources Between Terminals",
  },
  next: {
    href: "/en/blog/screeps-lab-boost-creep",
    label: "Next Lab guide",
    title: "Boost Creep Body Parts",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Recover three Lab objects from IDs, require ownership and activity, read the two input mineral types, resolve the product through <code>REACTIONS</code>, check at least <code>LAB_REACTION_AMOUNT</code> of both reagents, compatible output mineral, free capacity, range 2, and zero cooldown. Disable the one-time request before <code>outputLab.runReaction(inputA, inputB)</code>, then verify the output Store and cooldown on the next tick.</p>

<h2 id="three-labs">Use two input Labs and one output Lab</h2>
<pre><code class="language-javascript">function getOwnedActiveLab(id) {
  const lab = typeof id === 'string'
    ? Game.getObjectById(id)
    : null;

  if (
    !lab
    || lab.structureType !== STRUCTURE_LAB
    || lab.my !== true
    || lab.isActive() !== true
  ) {
    return null;
  }

  return lab;
}</code></pre>
<p>The three IDs must resolve to three distinct Labs in the same room. The output Lab is the object that calls <code>runReaction()</code>.</p>

<h2 id="recipe">Resolve the recipe from REACTIONS</h2>
<pre><code class="language-javascript">function getReactionProduct(inputA, inputB) {
  if (
    typeof inputA !== 'string'
    || typeof inputB !== 'string'
  ) {
    return null;
  }

  return REACTIONS[inputA]?.[inputB] ?? null;
}</code></pre>
<p>Do not trust a product string stored in Memory without comparing it to the current reagent mineral types.</p>

<h2 id="resources">Check reagent amount and output capacity</h2>
<pre><code class="language-javascript">function getLabMineral(lab) {
  const mineralType = lab.mineralType;

  return mineralType
    ? {
        type: mineralType,
        amount: lab.store.getUsedCapacity(mineralType)
      }
    : null;
}

function canReceiveReaction(outputLab, product) {
  if (
    outputLab.mineralType
    && outputLab.mineralType !== product
  ) {
    return false;
  }

  return outputLab.store.getFreeCapacity(product)
    >= LAB_REACTION_AMOUNT;
}</code></pre>
<p>Each input needs at least <code>LAB_REACTION_AMOUNT</code> of its reagent. The output Lab needs enough capacity for that same reaction amount.</p>

<h2 id="range-cooldown">Check range and cooldown</h2>
<pre><code class="language-javascript">function labsInReactionRange(outputLab, inputA, inputB) {
  return outputLab.pos.inRangeTo(inputA, 2)
    && outputLab.pos.inRangeTo(inputB, 2);
}</code></pre>
<p>The output Lab must have <code>cooldown === 0</code>. The cooldown after a successful reaction is determined by <code>REACTION_TIME[product]</code>.</p>

<h2 id="pure-plan">Build a testable reaction plan</h2>
<pre><code class="language-javascript">function evaluateReaction(input) {
  const { outputLab, inputA, inputB } = input;

  if (!outputLab || !inputA || !inputB) {
    return { ready: false, reason: 'lab-missing' };
  }

  if (
    outputLab.id === inputA.id
    || outputLab.id === inputB.id
    || inputA.id === inputB.id
  ) {
    return { ready: false, reason: 'lab-ids-not-distinct' };
  }

  if (
    outputLab.room.name !== inputA.room.name
    || outputLab.room.name !== inputB.room.name
  ) {
    return { ready: false, reason: 'different-rooms' };
  }

  const reagentA = getLabMineral(inputA);
  const reagentB = getLabMineral(inputB);

  if (!reagentA || !reagentB) {
    return { ready: false, reason: 'reagent-missing' };
  }

  const product = getReactionProduct(
    reagentA.type,
    reagentB.type
  );

  if (!product) {
    return { ready: false, reason: 'recipe-invalid' };
  }

  if (
    reagentA.amount < LAB_REACTION_AMOUNT
    || reagentB.amount < LAB_REACTION_AMOUNT
  ) {
    return { ready: false, reason: 'reagent-insufficient', product };
  }

  if (!canReceiveReaction(outputLab, product)) {
    return { ready: false, reason: 'output-unavailable', product };
  }

  if (!labsInReactionRange(outputLab, inputA, inputB)) {
    return { ready: false, reason: 'input-out-of-range', product };
  }

  if (outputLab.cooldown > 0) {
    return { ready: false, reason: 'output-cooling-down', product };
  }

  return { ready: true, reason: 'ready', product };
}</code></pre>

<h2 id="complete-example">Complete one-time reaction example</h2>
<p><strong>State impact:</strong> this code may schedule one real Lab reaction and writes a request snapshot. It never retries automatically.</p>
<pre><code class="language-javascript">module.exports.loop = function () {
  const request = Memory.labReactionRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const outputLab = getOwnedActiveLab(request.outputLabId);
  const inputA = getOwnedActiveLab(request.inputLabAId);
  const inputB = getOwnedActiveLab(request.inputLabBId);
  const plan = evaluateReaction({ outputLab, inputA, inputB });

  request.lastCheckedAt = Game.time;
  request.lastStatus = plan.reason;

  if (!plan.ready) {
    request.preview = { product: plan.product ?? null };
    return;
  }

  request.enabled = false;
  request.submittedAt = Game.time;
  request.snapshot = {
    outputLabId: outputLab.id,
    inputLabAId: inputA.id,
    inputLabBId: inputB.id,
    product: plan.product,
    outputBefore:
      outputLab.store.getUsedCapacity(plan.product),
    inputABefore:
      inputA.store.getUsedCapacity(inputA.mineralType),
    inputBBefore:
      inputB.store.getUsedCapacity(inputB.mineralType),
    cooldownBefore: outputLab.cooldown
  };

  const result = outputLab.runReaction(inputA, inputB);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted-pending-verification'
    : 'failed-review-required';
};</code></pre>

<h2 id="verify">Verify output on the next tick</h2>
<pre><code class="language-javascript">function verifyReaction(request) {
  const snapshot = request?.snapshot;
  const outputLab = getOwnedActiveLab(
    snapshot?.outputLabId
  );

  if (!snapshot || !outputLab) {
    return { verified: false, reason: 'snapshot-or-lab-missing' };
  }

  const outputNow = outputLab.store.getUsedCapacity(
    snapshot.product
  );

  return {
    verified:
      request.result === OK
      && outputNow >= snapshot.outputBefore
        + LAB_REACTION_AMOUNT,
    outputDelta: outputNow - snapshot.outputBefore,
    cooldownNow: outputLab.cooldown
  };
}</code></pre>
<p>Traffic, hauling, another reaction module, or resource withdrawal can change the Store before verification. A production system should coordinate Lab ownership across modules.</p>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Reaction scheduled</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Input reagent unavailable</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Input target is not a valid Lab</td></tr>
<tr><td><code>ERR_FULL</code></td><td>Output cannot receive product</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>An input Lab is outside range 2</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Reagents do not form a valid product</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>Output Lab is cooling down</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Recover three distinct owned active Labs.</li>
<li>Require one room.</li>
<li>Read current input mineral types.</li>
<li>Resolve the product from <code>REACTIONS</code>.</li>
<li>Check both reagent amounts.</li>
<li>Check output mineral compatibility and capacity.</li>
<li>Check range 2 and cooldown.</li>
<li>Disable before the call.</li>
<li>Save Store snapshots and the return code.</li>
<li>Verify output and cooldown on the next tick.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This guide does not implement reaction chains, Lab assignment, hauling, reverse reactions, demand forecasting, or multi-output scheduling. Continue with <a href="/en/blog/screeps-lab-boost-creep">boosting eligible Creep parts</a>.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Can input Lab order be reversed?</h3>
<p>Use the current <code>REACTIONS</code> lookup instead of assuming a recipe order.</p>
<h3>Can several output Labs share inputs?</h3>
<p>Yes when each output is in range and resources are sufficient.</p>
<h3>Should a failed reaction retry every tick?</h3>
<p>No. Require a new reviewed request.</p>
<h3>Is cooldown a proof of success?</h3>
<p>It is supporting evidence; compare Store deltas and coordinate other Lab users.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLab.runReaction" rel="nofollow">API Reference: StructureLab.runReaction()</a></li>
<li><a href="https://docs.screeps.com/resources.html#Reactions" rel="nofollow">Screeps Documentation: Reactions</a></li>
<li><a href="https://docs.screeps.com/api/#REACTIONS" rel="nofollow">API Reference: REACTIONS</a></li>
<li><a href="https://docs.screeps.com/api/#REACTION_TIME" rel="nofollow">API Reference: REACTION_TIME</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
