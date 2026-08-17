import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const UPDATED_AT = "2026-08-17";
const REVIEWED_AT = "August 17, 2026";
const ENGINE_SHA = "80977824199a596d174d392fd0cf8c458c21fcbd";
const SELECTED_SLUGS = new Set([
  "screeps-creep-harvest-energy",
  "screeps-upgrade-controller",
  "screeps-first-extension",
]);

function replaceRequired(
  html: string,
  search: string,
  replacement: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(search)) {
    throw new Error(`English editorial seventh pass could not find ${label} in ${slug}`);
  }
  return html.replace(search, replacement);
}

function replaceVerification(
  verification: Array<[string, string]>,
  staticReview: string,
  liveBoundary: string,
): Array<[string, string]> {
  const replacedTerms = new Set([
    "Official engine source",
    "Source harvest capacity policy",
    "Static code review",
    "Offline state logic",
    "Screeps Console test",
    "Live Source-overflow test",
    "Last verified",
    "Last editorial review",
    "Publication status",
  ]);

  return [
    ...verification.filter(([term]) => !replacedTerms.has(term)),
    [
      "Official engine source",
      `Checked current screeps/engine master ${ENGINE_SHA}: Source harvest submission has no Store-capacity ERR_FULL preflight; the processor can drop overflow beyond Creep Store capacity`,
    ],
    [
      "Source harvest capacity policy",
      "Project policy — for the unboosted beginner bodies in these lessons, switch out of Source acquisition before another full active-WORK harvest batch would exceed remaining Store capacity",
    ],
    ["Offline state logic", staticReview],
    ["Screeps Console test", "Pending — no live near-full Source harvest trace is claimed"],
    ["Live Source-overflow test", liveBoundary],
    ["Last editorial review", REVIEWED_AT],
    ["Publication status", "Published"],
  ];
}

function improveHarvest(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p>Do not wait for <code>creep.harvest(source)</code> to return <code>ERR_FULL</code>. In the current official Screeps engine, Source harvesting does not have an <code>ERR_FULL</code> preflight. A beginner hauler should read Store capacity <em>before</em> submitting the harvest intent:</p>`,
    `<p>Do not wait for <code>creep.harvest(source)</code> to return <code>ERR_FULL</code>. In the current official Screeps engine, Source harvesting does not have an <code>ERR_FULL</code> preflight. For the unboosted beginner carrier in this lesson, treat Store capacity as application policy and stop before another full active-<code>WORK</code> Source batch would exceed the remaining capacity:</p>`,
    article.slug,
    "harvest quick-answer policy",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `const freeEnergy = creep.store.getFreeCapacity(RESOURCE_ENERGY);\n\nif (freeEnergy === 0) {\n  return { status: 'store-full' };\n}\n\nconst source`,
    `const activeWork = creep.getActiveBodyparts(WORK);\nconst usedEnergy =\n  creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;\nconst freeEnergy =\n  creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;\nconst energyCapacity =\n  creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;\nconst harvestBatch = activeWork * HARVEST_POWER;\n\nif (harvestBatch > energyCapacity) {\n  return { status: 'harvest-batch-exceeds-store' };\n}\n\nif (\n  freeEnergy === 0\n  || (usedEnergy > 0 && freeEnergy < harvestBatch)\n) {\n  return { status: 'ready-for-delivery' };\n}\n\nconst source`,
    article.slug,
    "harvest quick-answer code",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>That behavior is useful for specialized static miners, but it is usually a poor control signal for a first Source-to-Spawn worker. A beginner transport loop should stop harvesting when <code>getFreeCapacity()</code> reaches zero and switch to delivery deliberately.</p>`,
    `<p>That behavior is useful for specialized static miners, but it is usually a poor control signal for a first Source-to-Spawn worker. A full-only check is also insufficient when the Creep has several active <code>WORK</code> parts: the next Source harvest batch can be larger than the remaining Store capacity. This tutorial therefore uses a conservative <strong>project policy</strong> for its unboosted beginner body: switch to delivery when the Store is full, or when some Energy is already carried and the remaining capacity is smaller than <code>active WORK × HARVEST_POWER</code>. The policy can leave a small amount of capacity unused, but it avoids deliberately submitting a Source harvest that the checked processor can overflow.</p>`,
    article.slug,
    "harvest overflow policy explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>This example focuses only on acquisition. When the Store becomes full it returns a local <code>store-full</code> state instead of inventing a harvest return code.</p>`,
    `<p>This example focuses only on acquisition. It returns a local role state before a full Store or a too-large next Source batch; neither state is presented as a <code>harvest()</code> return code. The batch formula is deliberately scoped to the unboosted beginner Creep used here.</p>`,
    article.slug,
    "harvest safe-loop introduction",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY);\n\n  if (freeEnergy === null || freeEnergy === 0) {\n    return { status: 'store-full' };\n  }\n\n  const source =`,
    `  const activeWork = creep.getActiveBodyparts(WORK);\n  const usedEnergy =\n    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;\n  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;\n  const energyCapacity =\n    creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;\n  const harvestBatch = activeWork * HARVEST_POWER;\n\n  if (energyCapacity <= 0) {\n    return { status: 'no-energy-capacity' };\n  }\n\n  if (harvestBatch > energyCapacity) {\n    return { status: 'harvest-batch-exceeds-store' };\n  }\n\n  if (\n    freeEnergy === 0\n    || (usedEnergy > 0 && freeEnergy < harvestBatch)\n  ) {\n    return { status: 'ready-for-delivery' };\n  }\n\n  const source =`,
    article.slug,
    "harvest safe-loop capacity guard",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `    result.status !== 'harvest-accepted'\n    && result.status !== 'store-full'\n    && result.actionResult !== ERR_NOT_IN_RANGE`,
    `    result.status !== 'harvest-accepted'\n    && result.status !== 'ready-for-delivery'\n    && result.status !== 'harvest-batch-exceeds-store'\n    && result.actionResult !== ERR_NOT_IN_RANGE`,
    article.slug,
    "harvest status logging",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>When <code>store-full</code> appears, the next role step is delivery. Do not keep calling <code>harvest()</code> merely to rediscover capacity state.</p>`,
    `<p>When <code>ready-for-delivery</code> appears, the next role step is delivery. <code>harvest-batch-exceeds-store</code> means this unboosted beginner carrier's active-WORK Source batch is larger than its entire Energy capacity; use more carrying capacity, fewer active WORK parts for this role, or a deliberate drop-mining architecture instead of pretending the excess can fit.</p>`,
    article.slug,
    "harvest next-role explanation",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceVerification(
      article.verification,
      "Passed — Source ERR_FULL remains excluded, full and next-batch Store boundaries are separated from API return codes, and the unboosted tutorial code avoids intentionally submitting an overflowing Source batch",
      "Pending — no live partial-capacity, oversized-body, or dropped-overflow comparison was collected",
    ),
    articleHtml,
  };
}

function improveUpgrader(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<blockquote><p><strong>Empty → harvest. Full → upgrade. Partly full → continue the current trip.</strong></p></blockquote>`,
    `<blockquote><p><strong>Empty → harvest. Full, or too little room for the next unboosted Source batch → upgrade. Otherwise keep the current trip.</strong></p></blockquote>`,
    article.slug,
    "upgrader summary state",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<tr><td>No free Energy capacity</td><td><code>true</code></td><td>Move within range 3 and upgrade.</td></tr>\n<tr><td>Partly full</td><td>Keep the existing value</td><td>Finish the current harvest or upgrade trip.</td></tr>`,
    `<tr><td>No free Energy capacity</td><td><code>true</code></td><td>Move within range 3 and upgrade.</td></tr>\n<tr><td>Some Energy carried and remaining capacity is smaller than the next unboosted Source batch</td><td><code>true</code> by this tutorial policy</td><td>Upgrade instead of intentionally overflowing the next harvest.</td></tr>\n<tr><td>Other partly full states</td><td>Keep the existing value</td><td>Finish the current harvest or upgrade trip.</td></tr>`,
    article.slug,
    "upgrader state table",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>An undefined flag behaves like false in the branch below, so a new empty Upgrader begins by harvesting. Review <a href="/en/blog/screeps-memory-basics">Screeps Memory basics</a> when you want to inspect how the value persists.</p>`,
    `<p>An undefined flag behaves like false in the branch below, so a new empty Upgrader begins by harvesting. Review <a href="/en/blog/screeps-memory-basics">Screeps Memory basics</a> when you want to inspect how the value persists.</p>\n<p><strong>Project policy, not an API contract:</strong> the code below assumes the unboosted beginner body from this lesson and estimates one Source batch as <code>active WORK × HARVEST_POWER</code>. The current Source <code>harvest()</code> call has no Store-capacity <code>ERR_FULL</code> preflight; its processor can drop overflow. Switching a little early may leave a few capacity units unused, but it keeps this mobile Upgrader from deliberately submitting a batch that does not fit.</p>`,
    article.slug,
    "upgrader policy explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  const usedEnergy =\n    creep.store.getUsedCapacity(RESOURCE_ENERGY);\n  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY);\n\n  if (usedEnergy === 0) {\n    creep.memory.upgrading = false;\n  } else if (freeEnergy === 0) {\n    creep.memory.upgrading = true;\n  }`,
    `  const activeWork = creep.getActiveBodyparts(WORK);\n  const usedEnergy =\n    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;\n  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;\n  const energyCapacity =\n    creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;\n  const harvestBatch = activeWork * HARVEST_POWER;\n\n  if (usedEnergy === 0) {\n    creep.memory.upgrading = false;\n  } else if (\n    freeEnergy === 0\n    || (\n      !creep.memory.upgrading\n      && freeEnergy > 0\n      && freeEnergy < harvestBatch\n    )\n  ) {\n    creep.memory.upgrading = true;\n  }\n\n  if (\n    !creep.memory.upgrading\n    && usedEnergy === 0\n    && harvestBatch > energyCapacity\n  ) {\n    reportEveryTwentyTicks(\n      CREEP_NAME +\n      ' has a Source harvest batch larger than its Energy capacity.'\n    );\n    return;\n  }`,
    article.slug,
    "upgrader Source batch state",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>A full Store sets <code>upgrading</code> to true.</li>`,
    `<li>A full Store sets <code>upgrading</code> to true. Under this tutorial's unboosted no-overflow policy, a partly filled Store also switches when the next full Source batch would not fit.</li>`,
    article.slug,
    "upgrader tick flow",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li><code>memory.upgrading</code> becomes true only when the Store is full.</li>`,
    `<li><code>memory.upgrading</code> becomes true when the Store is full or when this tutorial's conservative unboosted Source-batch threshold is reached.</li>`,
    article.slug,
    "upgrader verification sequence",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>empty and full Store boundaries switch the state;</li>`,
    `<li>empty, full, and the tutorial's conservative next-Source-batch boundary switch the state without treating <code>ERR_FULL</code> as a Source-harvest signal;</li>`,
    article.slug,
    "upgrader completion boundary",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceVerification(
      article.verification,
      "Passed — empty/full hysteresis is preserved, the unboosted next-Source-batch guard is applied before harvest(), oversized Source batches stop instead of overflowing, and upgradeController() remains a separate range-3 action",
      "Pending — no live multi-WORK near-full Upgrader overflow comparison is claimed",
    ),
    articleHtml,
  };
}

function improveFirstExtension(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `  const usedEnergy =\n    creep.store.getUsedCapacity(RESOURCE_ENERGY) || 0;\n  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY) || 0;\n\n  if (usedEnergy === 0) {\n    creep.memory.building = false;\n  } else if (freeEnergy === 0) {\n    creep.memory.building = true;\n  }`,
    `  const activeWork = creep.getActiveBodyparts(WORK);\n  const usedEnergy =\n    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;\n  const freeEnergy =\n    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;\n  const energyCapacity =\n    creep.store.getCapacity(RESOURCE_ENERGY) ?? 0;\n  const harvestBatch = activeWork * HARVEST_POWER;\n\n  if (usedEnergy === 0) {\n    creep.memory.building = false;\n  } else if (\n    freeEnergy === 0\n    || (\n      !creep.memory.building\n      && freeEnergy > 0\n      && freeEnergy < harvestBatch\n    )\n  ) {\n    creep.memory.building = true;\n  }\n\n  if (\n    !creep.memory.building\n    && usedEnergy === 0\n    && harvestBatch > energyCapacity\n  ) {\n    return { status: 'harvest-batch-exceeds-store' };\n  }`,
    article.slug,
    "Extension Builder Source batch state",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The full/empty switch is hysteresis: partial Energy keeps the previous phase. It does not recalculate “building” from <code>usedEnergy &gt; 0</code> every tick.</p>`,
    `<p>The empty/full switch remains hysteresis: ordinary partial Energy keeps the previous phase. This tutorial adds one conservative <strong>project policy</strong> for its unboosted mobile Builder: while acquiring from a Source, switch to building when some Energy is already carried and the remaining capacity is smaller than <code>active WORK × HARVEST_POWER</code>. Current Source <code>harvest()</code> has no Store-capacity <code>ERR_FULL</code> preflight, and the checked processor can drop overflow. An unboosted body whose entire Energy capacity is smaller than one full Source batch is rejected by the example instead of silently wasting the excess.</p>`,
    article.slug,
    "Extension Builder policy explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<li>It uses active Source selection for a mobile beginner Builder; a fixed miner can use another policy.</li>`,
    `<li>It uses active Source selection and a conservative unboosted next-batch Store guard for a mobile beginner Builder; a fixed miner or boosted harvesting design can use another explicit policy.</li>`,
    article.slug,
    "Extension scope policy",
  );

  return {
    ...article,
    finalScore: 99,
    verification: replaceVerification(
      article.verification,
      "Passed — the Extension occupancy diagnostics remain intact, Builder hysteresis now prevents the unboosted next Source batch from intentionally overflowing, oversized Source batches stop, and build() progress evidence remains separate",
      "Pending — no live near-full multi-WORK Builder overflow or occupied-site comparison is claimed",
    ),
    articleHtml,
  };
}

export function applyEnglishEditorialSeventh20260817(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  if (article.slug === "screeps-creep-harvest-energy") {
    return improveHarvest(article);
  }
  if (article.slug === "screeps-upgrade-controller") {
    return improveUpgrader(article);
  }
  if (article.slug === "screeps-first-extension") {
    return improveFirstExtension(article);
  }
  return article;
}

export function getEnglishEditorialSeventhUpdatedAt20260817(
  slug: string,
): string | undefined {
  return SELECTED_SLUGS.has(slug) ? UPDATED_AT : undefined;
}
