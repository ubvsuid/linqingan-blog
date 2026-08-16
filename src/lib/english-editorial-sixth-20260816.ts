import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-16";
const SELECTED_SLUGS = new Set([
  "screeps-withdraw-container-energy",
  "screeps-pickup-dropped-energy",
  "screeps-transfer-energy-to-spawn",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`English editorial sixth pass could not find ${label} in ${slug}`);
  }
  return html.replace(search, replacement);
}

function replaceLastVerified(
  verification: Array<[string, string]>,
  additions: Array<[string, string]>,
): Array<[string, string]> {
  const filtered = verification.filter(([term]) =>
    term !== "Last verified"
    && term !== "Last editorial review"
    && !additions.some(([newTerm]) => newTerm === term)
  );
  return [
    ...filtered,
    ...additions,
    ["Last editorial review", "August 16, 2026"],
  ];
}

function insertTocAfter(
  toc: Array<[string, string]>,
  afterId: string,
  item: [string, string],
): Array<[string, string]> {
  if (toc.some(([id]) => id === item[0])) return toc;
  const index = toc.findIndex(([id]) => id === afterId);
  if (index < 0) return [...toc, item];
  return [...toc.slice(0, index + 1), item, ...toc.slice(index + 1)];
}

function improveWithdraw(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="return-codes">Return-code troubleshooting</h2>`,
    `<h2 id="amount-boundary">Omitted, zero, and explicit withdraw amounts are different policy choices</h2>
<p>For the current official engine, omitting <code>amount</code> makes <code>withdraw()</code> choose the smaller of the Creep's current free Store capacity and the target's current amount of that resource. A subtle implementation boundary is that an explicit numeric <code>0</code> is also falsy in this submission path, so it is treated like an omitted amount rather than as a request to withdraw nothing. Do not use <code>amount: 0</code> as a validation probe.</p>
<div class="table-scroll"><table>
<thead><tr><th>Amount argument</th><th>Current submission behavior</th><th>Recommended project policy</th></tr></thead>
<tbody>
<tr><td>Omitted</td><td>Auto-select <code>min(free capacity, target amount)</code>.</td><td>Good for this focused Container example.</td></tr>
<tr><td><code>0</code></td><td>Handled as falsy/omitted by the checked engine.</td><td>Reject or normalize it in your own API wrapper if zero must mean “do nothing.”</td></tr>
<tr><td>Negative</td><td><code>ERR_INVALID_ARGS</code>.</td><td>Reject before submission.</td></tr>
<tr><td>Positive explicit amount</td><td>Must fit the Creep and be available in the target at submission time.</td><td>Use when the task owns an exact requested quantity.</td></tr>
</tbody></table></div>
<p><strong>Submission amount is not final transfer proof.</strong> The processor rechecks current free capacity and current target Store state. If same-tick activity changes either value after the API call, the amount actually moved can be lower than the earlier request. Verify later Store deltas or the exact transfer event before claiming an exact amount.</p>

<h2 id="return-codes">Return-code troubleshooting</h2>`,
    article.slug,
    "withdraw amount section insertion",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>OK</code></td><td>The command was accepted for this tick.</td><td>Inspect both Stores on a later tick.</td></tr>`,
    `<tr><td><code>OK</code></td><td>The withdraw intent was accepted for this tick.</td><td>Verify the later Store delta; same-tick changes can reduce the amount actually moved.</td></tr>`,
    article.slug,
    "withdraw OK row",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type or amount is invalid.</td><td>Inspect the arguments.</td></tr>`,
    `<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type is invalid, or the checked engine received a negative amount.</td><td>Validate the resource and require a positive explicit amount when your wrapper uses one; zero is a separate falsy/default boundary.</td></tr>`,
    article.slug,
    "withdraw ERR_INVALID_ARGS row",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — Creep.withdraw() amount validation, target checks, Store capacity, range, and intent submission"],
      ["Amount boundary", "Verified in source — omitted and falsy zero amount use the automatic min(free capacity, target amount) path; negative amount returns ERR_INVALID_ARGS"],
      ["Processor boundary", "Checked — actual withdraw amount can be truncated by current Creep free capacity or current target Store before the transfer event is recorded"],
      ["Screeps Console test", "Pending — no live zero-amount or competing-withdraw transcript is claimed"],
      ["Live exact-amount verification", "Pending — no real-shard Store delta or EVENT_TRANSFER trace is claimed"],
    ]),
    toc: insertTocAfter(article.toc, "complete-code", [
      "amount-boundary",
      "Omitted, zero, and explicit amounts",
    ]),
    articleHtml,
  };
}

function improvePickup(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p><code>creep.pickup(resource)</code> works only on a dropped <code>Resource</code> object. Filter <code>FIND_DROPPED_RESOURCES</code> for <code>RESOURCE_ENERGY</code>, reject zero or invalid amounts, confirm the Creep has active CARRY capacity, and choose a reachable target. If <code>pickup()</code> returns <code>ERR_NOT_IN_RANGE</code>, move within range 1 and retry on a later tick.</p>`,
    `<p><code>creep.pickup(resource)</code> works only on a dropped <code>Resource</code> object. Filter <code>FIND_DROPPED_RESOURCES</code> for <code>RESOURCE_ENERGY</code>, reject zero or invalid target amounts, confirm that the Creep's Store has free capacity, and choose a reachable target. Active <code>CARRY</code> count can be useful diagnostic context, but the current <code>pickup()</code> submission path does not use <code>getActiveBodyparts(CARRY)</code> as an API preflight. If <code>pickup()</code> returns <code>ERR_NOT_IN_RANGE</code>, move within range 1 and retry on a later tick.</p>`,
    article.slug,
    "pickup quick answer",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p><code>pickup()</code> has no amount argument. If the pile contains more than the Creep can carry, a successful action collects only what fits and leaves the rest on the ground.</p>`,
    `<p><code>pickup()</code> has no amount argument. The current processor calculates the collected amount as the smaller of the Creep's current free Store capacity and the Resource object's current amount. If the pile contains more than the Creep can carry, only what fits is collected and the rest remains on the ground.</p>

<h2 id="processor-boundary">Store capacity is the pickup boundary; active CARRY is diagnostic context</h2>
<p>The checked <code>Creep.pickup()</code> submission implementation rejects a Creep whose Store is already full, but it does not separately reject the call because <code>getActiveBodyparts(CARRY)</code> is zero. That distinction matters when documenting the API: body damage can explain why a Creep's current Store capacity looks the way it does, but the pickup contract itself is expressed through the Creep's Store and the action result.</p>
<p>An accepted <code>OK</code> still does not freeze the earlier Resource amount. At processing time, the engine rechecks the target and current Store usage, then applies <code>min(free capacity, current resource amount)</code>. Competition or changing state can therefore make the actual collected amount smaller than the snapshot used for target ranking.</p>`,
    article.slug,
    "pickup processor boundary insertion",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  if (creep.getActiveBodyparts(CARRY) <= 0) {
    console.log(
      'Collector1 has no active CARRY part.'
    );
    return;
  }

  const target = selectDroppedEnergy(creep);`,
    `  const target = selectDroppedEnergy(creep);`,
    article.slug,
    "pickup active CARRY hard gate",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>Confirm active CARRY capacity.</li>`,
    `<li>Gate pickup work by current Store free capacity; use active <code>CARRY</code> count only as additional body-damage diagnostic context.</li>`,
    article.slug,
    "pickup debugging CARRY item",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — Creep.pickup() validates ownership, spawning, dropped-Resource identity, Store fullness, and range without an active-CARRY preflight"],
      ["Processor boundary", "Checked — pickup applies min(current free Store capacity, current dropped amount), so partial collection is automatic"],
      ["Body-part boundary", "Corrected — active CARRY is retained only as diagnostic context, not presented as an official pickup return-code requirement"],
      ["Screeps Console test", "Pending — no zero-active-CARRY pickup transcript is claimed"],
      ["Live competition test", "Pending — no real-shard competing pickup or decay trace is claimed"],
    ]),
    toc: insertTocAfter(article.toc, "capacity", [
      "processor-boundary",
      "Store capacity and processor behavior",
    ]),
    articleHtml,
  };
}

function improveTransfer(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="delivery-state">Keep delivery mode until the Creep is empty</h2>`,
    `<h2 id="transfer-amount-boundary">Omitted transfer amount is convenient, but it is still a snapshot</h2>
<p>In the checked engine, omitting <code>amount</code> makes <code>transfer()</code> choose the smaller of the Creep's currently carried resource and the target's current free capacity. An explicit numeric <code>0</code> follows the same falsy/default path rather than meaning “transfer nothing”; a negative amount returns <code>ERR_INVALID_ARGS</code>. Treat zero semantics as an implementation boundary and validate your own wrapper explicitly when zero must be a no-op.</p>
<p>Even an explicit positive amount is a requested amount, not final proof. The transfer processor rechecks the Creep's Store and target capacity. If another same-tick action fills the Spawn before this intent is processed, the actual transfer can be truncated to the remaining capacity. Verify the later Stores or the exact transfer event before reporting an exact delivered amount.</p>

<h2 id="delivery-state">Keep delivery mode until the Creep is empty</h2>`,
    article.slug,
    "transfer amount section insertion",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>That final rule is the important one. A worker that has started delivering remains in delivery mode until its Store reaches zero.</p>`,
    `<p>That final rule is the important one. A worker that has started delivering remains in delivery mode until its Store reaches zero.</p>

<h2 id="source-overflow">A full-only phase switch can waste the last Source harvest</h2>
<p>The generic empty/full hysteresis above is useful for stable task state, but Source harvesting has an additional capacity boundary. The current Source <code>harvest()</code> submission path does not return <code>ERR_FULL</code> when the Store lacks enough room for the next harvest batch. During processing, harvested overflow beyond Store capacity is dropped on the ground.</p>
<p>For this beginner Source-to-Spawn loop, the following is a conservative <strong>project policy</strong>, not an extra Screeps API requirement: begin delivery before harvesting when the remaining Energy capacity is smaller than one full active-WORK harvest batch.</p>
<pre><code>const harvestBatch =
  creep.getActiveBodyparts(WORK) * HARVEST_POWER;

if (
  !creep.memory.delivering
  && usedEnergy > 0
  && freeEnergyCapacity > 0
  && freeEnergyCapacity &lt; harvestBatch
) {
  creep.memory.delivering = true;
}</code></pre>
<p>This may leave a small amount of unused Creep capacity, but it prevents this simple loop from deliberately submitting a Source harvest that can overflow under the checked engine. More advanced logistics can use a different policy when dropped overflow is intentional.</p>`,
    article.slug,
    "transfer Source overflow section insertion",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  if (usedEnergy === 0) {
    creep.memory.delivering = false;
  } else if (freeEnergyCapacity === 0) {
    creep.memory.delivering = true;
  }

  let action = 'harvest';`,
    `  if (usedEnergy === 0) {
    creep.memory.delivering = false;
  } else if (freeEnergyCapacity === 0) {
    creep.memory.delivering = true;
  }

  const harvestBatch =
    creep.getActiveBodyparts(WORK) * HARVEST_POWER;

  if (
    !creep.memory.delivering
    && usedEnergy > 0
    && freeEnergyCapacity > 0
    && freeEnergyCapacity &lt; harvestBatch
  ) {
    creep.memory.delivering = true;
  }

  let action = 'harvest';`,
    article.slug,
    "transfer no-overflow phase guard",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The explicit <code>amount</code> is the smaller of the Creep's carried Energy and the Spawn's free Energy capacity. This makes a partial unload visible instead of hiding it inside the action call.</p>`,
    `<p>The explicit <code>amount</code> is the smaller of the start-of-tick carried Energy and the Spawn's observed free Energy capacity. That makes the requested partial unload visible, but it is still a snapshot. The processor can move less if the Spawn's remaining capacity changes before this transfer intent is resolved, so later Store or event evidence is required for the actual delivered amount.</p>`,
    article.slug,
    "transfer explicit amount paragraph",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  if (
    actionResult !== null &&
    actionResult !== OK &&
    actionResult !== ERR_NOT_IN_RANGE &&
    actionResult !== ERR_FULL &&
    actionResult !== ERR_NOT_ENOUGH_RESOURCES
  ) {`,
    `  const expectedActionResult =
    actionResult === OK
    || actionResult === ERR_NOT_IN_RANGE
    || actionResult === ERR_NOT_ENOUGH_RESOURCES
    || (
      action === 'transfer'
      && actionResult === ERR_FULL
    );

  if (
    actionResult !== null
    && !expectedActionResult
  ) {`,
    article.slug,
    "transfer action-specific ERR_FULL handling",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceLastVerified(article.verification, [
      ["Official engine source", "Checked August 16, 2026 — Creep.transfer() default amount, zero/negative amount handling, target capacity checks, and processor truncation"],
      ["Transfer processor", "Checked — actual amount can be reduced to the target's remaining capacity after submission"],
      ["Source overflow boundary", "Checked — Source harvest has no Store-capacity ERR_FULL preflight and processing drops overflow beyond Creep Store capacity"],
      ["Project policy", "The early-delivery threshold is a conservative no-overflow policy for this tutorial, not an official Screeps requirement"],
      ["Screeps Console test", "Pending — no live zero-amount transfer or near-full Source harvest trace is claimed"],
      ["Live round-trip test", "Pending — no real-shard partial-transfer or overflow comparison is claimed"],
    ]),
    toc: insertTocAfter(
      insertTocAfter(article.toc, "minimal-transfer", [
        "transfer-amount-boundary",
        "Transfer amount boundary",
      ]),
      "delivery-state",
      ["source-overflow", "Avoid near-full Source overflow"],
    ),
    articleHtml,
  };
}

export function applyEnglishEditorialSixth20260816(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-withdraw-container-energy") {
    return improveWithdraw(article);
  }
  if (article.slug === "screeps-pickup-dropped-energy") {
    return improvePickup(article);
  }
  if (article.slug === "screeps-transfer-energy-to-spawn") {
    return improveTransfer(article);
  }
  return article;
}

export function getEnglishEditorialSixthUpdatedAt20260816(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
