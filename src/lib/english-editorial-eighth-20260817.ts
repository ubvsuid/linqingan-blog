import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const EDITORIAL_EIGHTH_SLUGS = new Set([
  "screeps-mineral-extractor-harvest",
  "screeps-storage-energy-usage",
  "screeps-link-transfer-energy",
]);

const ENGINE_SNAPSHOT = "80977824199a596d174d392fd0cf8c458c21fcbd";

function replaceRequired(
  html: string,
  from: string,
  to: string,
  slug: string,
  label: string,
): string {
  if (!html.includes(from)) {
    throw new Error(`${slug}: missing eighth-editorial replacement anchor: ${label}`);
  }
  return html.replace(from, to);
}

function addVerification(
  article: EnglishBeginnerArticle,
  rows: Array<[string, string]>,
): Array<[string, string]> {
  const blocked = new Set([
    "Last verified",
    "Last editorial review",
    "Publication status",
  ]);
  return [
    ...article.verification.filter(([term]) => !blocked.has(term)),
    ...rows,
    ["Last editorial review", "August 17, 2026"],
    ["Publication status", "Published"],
  ];
}

function patchMineral(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The capacity check is an efficiency policy. The engine can drop overflow after harvesting, so a careless call may still create an event without retaining the full output in the Creep Store.</p>`,
    `<p>The free-capacity check above is only a coarse gate. The current Mineral <code>harvest()</code> submission path does not return <code>ERR_FULL</code> because the Creep has too little Store space. The checked processor can harvest a full WORK batch and drop the overflow. The submission function below therefore adds a conservative <strong>project policy</strong> for an unboosted Miner: do not submit the next harvest when the visible remaining Mineral output for that batch is larger than the current free Store capacity.</p>`,
    slug,
    "mineral capacity explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `  const { mineral, extractor } = station;\n  if (!creep.pos.isNearTo(mineral)) {`,
    `  const { mineral, extractor } = station;\n  const hasBoostedWork = creep.body.some(part =>\n    part.type === WORK\n    && part.hits > 0\n    && Boolean(part.boost)\n  );\n\n  if (hasBoostedWork) {\n    return {\n      status: 'boosted-work-batch-out-of-scope',\n      mineralId: mineral.id\n    };\n  }\n\n  const activeWork = creep.getActiveBodyparts(WORK);\n  const harvestBatch =\n    activeWork * HARVEST_MINERAL_POWER;\n  const plannedOutput = Math.min(\n    mineral.mineralAmount,\n    harvestBatch\n  );\n  const freeCapacity =\n    creep.store.getFreeCapacity(mineral.mineralType) ?? 0;\n\n  if (freeCapacity &lt; plannedOutput) {\n    return {\n      status: 'deliver-before-next-harvest',\n      mineralId: mineral.id,\n      plannedOutput,\n      freeCapacity\n    };\n  }\n\n  if (!creep.pos.isNearTo(mineral)) {`,
    slug,
    "mineral unboosted next-batch guard",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `    storeBefore:\n      creep.store.getUsedCapacity(mineral.mineralType)\n  };`,
    `    storeBefore:\n      creep.store.getUsedCapacity(mineral.mineralType),\n    plannedOutput\n  };`,
    slug,
    "mineral pending planned output",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The official engine records the Miner as <code>objectId</code> and the Mineral as <code>targetId</code>. In the Mineral branch, the event amount is based on harvest power, while remaining Mineral can cap the amount removed and Store overflow can be dropped. Therefore:</p>`,
    `<p>The official engine records the Miner as <code>objectId</code> and the Mineral as <code>targetId</code>. In the checked engine snapshot <code>${ENGINE_SNAPSHOT}</code>, the Mineral event amount is based on body harvest power, while the actual Mineral removal is capped by remaining <code>mineralAmount</code> and Store overflow can be dropped. On the final depletion harvest, <code>event.data.amount</code> can therefore be larger than the Mineral actually removed even when Store capacity is not the limiting factor. Therefore:</p>`,
    slug,
    "mineral event amount boundary",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>Use one role runner for each fixed Mineral station, verify the prior accepted action before submitting the next one, and keep hauling in another state. Console execution, real cooldown timing, depletion, regeneration and screenshots remain pending.</p>`,
    `<p>Use one role runner for each fixed Mineral station, verify the prior accepted action before submitting the next one, and keep hauling in another state. The next-batch guard above is intentionally scoped to unboosted WORK parts; a boosted Miner needs an explicit boost-aware batch calculation or a deliberate drop-mining policy. Console execution, near-full Store overflow, final-depletion event amount, real cooldown timing, regeneration and screenshots remain pending.</p>`,
    slug,
    "mineral production scope",
  );

  return {
    ...article,
    description:
      "Validate the same-tile Extractor and Miner, prevent intentional unboosted next-batch Store overflow, match the exact EVENT_HARVEST, and separate event amount from actual Mineral removal.",
    finalScore: 99,
    updatedAt: "2026-08-17",
    verification: addVerification(article, [
      [
        "Official engine source",
        `Checked screeps/engine ${ENGINE_SNAPSHOT}: Mineral harvest has no Store-capacity ERR_FULL preflight; the processor can drop overflow after applying the WORK harvest batch`,
      ],
      [
        "Mineral batch policy",
        "Project policy — the example rejects boosted WORK and, for unboosted WORK, requires current free Store capacity to fit min(mineralAmount, active WORK × HARVEST_MINERAL_POWER)",
      ],
      [
        "Final-depletion event boundary",
        "Checked — the current Mineral processor records EVENT_HARVEST amount from harvest power while actual Mineral removal is capped by remaining mineralAmount",
      ],
      [
        "Screeps Console test",
        "Pending — no live near-full or final-depletion Mineral trace is claimed",
      ],
      [
        "Live Mineral overflow/event comparison",
        "Pending — no live multi-WORK near-full Store or final-depletion event comparison was collected",
      ],
    ]),
    articleHtml,
  };
}

function patchStorage(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="verify-event">Verify the exact event on the next tick</h2>`,
    `<h2 id="processed-amount">Treat the coordinator amount as a request ceiling</h2>\n<p>The <code>amount</code> saved by this coordinator is the amount requested at submission time, not a promise that the processor will move exactly that much. In the checked engine snapshot, <code>withdraw()</code> starts from the requested amount but caps processing to the Creep's current empty space and the source's current stock. For <code>transfer()</code>, the source must still cover the requested amount, while the processed amount can be truncated to the target's current free capacity.</p>\n<p>This distinction matters when another same-tick action changes a Store after your call returned <code>OK</code>. Keep the coordinator reservation conservative for the rest of that tick; do not recycle an assumed difference before processing. On the next tick, a matched <code>EVENT_TRANSFER</code> reports the processed amount for that exact source-target pair. Missing events and Store deltas remain separate evidence states.</p>\n\n<h2 id="verify-event">Verify the exact event on the next tick</h2>`,
    slug,
    "storage processed amount section",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `    kind: pending.kind,\n    eventAmount: event.data?.amount ?? null,`,
    `    kind: pending.kind,\n    requestedAmount: pending.amount,\n    processedAmount: event.data?.amount ?? null,`,
    slug,
    "storage requested versus processed fields",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The event identifies the accepted source-target pair. Current Stores are supporting context only: other haulers, Links, Spawns, Extensions, Towers, or consumers can change the same objects during the tick.</p>`,
    `<p>The event identifies the accepted source-target pair, and its <code>amount</code> is the processor-observed transfer amount for that event. It does not have to equal the coordinator's saved request when same-tick state changed. Current Stores are supporting context only: other haulers, Links, Spawns, Extensions, Towers, or consumers can change the same objects during the tick.</p>`,
    slug,
    "storage event amount explanation",
  );

  const toc = article.toc.some(([id]) => id === "processed-amount")
    ? article.toc
    : article.toc.flatMap((entry) =>
        entry[0] === "verify-event"
          ? [["processed-amount", "Requested amount versus processed amount"] as [string, string], entry]
          : [entry],
      );

  return {
    ...article,
    description:
      "Coordinate a shared Storage Energy budget, distinguish requested from processor-applied withdraw and transfer amounts, and verify the exact source-target EVENT_TRANSFER on the next tick.",
    finalScore: 99,
    updatedAt: "2026-08-17",
    toc,
    verification: addVerification(article, [
      [
        "Official engine source",
        `Checked screeps/engine ${ENGINE_SNAPSHOT}: withdraw processing re-reads empty space and source stock; transfer processing re-reads source stock and target capacity`,
      ],
      [
        "Amount boundary",
        "The coordinator reserves the requested amount; a matched EVENT_TRANSFER is used to report the processor-applied amount instead of assuming requested equals processed",
      ],
      [
        "Screeps Console test",
        "Pending — no live same-tick Storage contention trace is claimed",
      ],
      [
        "Live requested-versus-processed comparison",
        "Pending — no controlled competing withdraw/transfer run was collected",
      ],
    ]),
    articleHtml,
  };
}

function patchLink(article: EnglishBeginnerArticle): EnglishBeginnerArticle {
  const slug = article.slug;
  let articleHtml = article.articleHtml;

  articleHtml = replaceRequired(
    articleHtml,
    `    remainingTargetCapacity = Math.max(\n      0,\n      remainingTargetCapacity\n        - estimate.estimatedReceived\n    );`,
    `    remainingTargetCapacity = Math.max(\n      0,\n      remainingTargetCapacity\n        - requestedAmount\n    );`,
    slug,
    "link target-capacity reservation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<p>The requested amount is deliberately conservative: it never exceeds visible source stock or unreserved target capacity. Because the target receives less than the requested amount after loss, the planner can leave capacity unused. That is safer than an unchecked inverse-loss calculation.</p>`,
    `<p>The requested amount is deliberately conservative: it never exceeds visible source stock or unreserved target capacity. The reservation subtracts the <strong>requested amount</strong>, not the predicted post-loss receipt. That means this planner does not recycle loss-created capacity inside the same planning pass or depend on Link intent-processing order to make later requests fit. It can leave target capacity unused after loss, which is an intentional safety tradeoff.</p>`,
    slug,
    "link conservative request reservation explanation",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `<h2 id="verify">Verify exact transfer events</h2>`,
    `<h2 id="processed-amount">Separate requested Link Energy from processed Energy</h2>\n<p><code>transferEnergy()</code> returning <code>OK</code> proves that the request passed the call-time checks. It does not freeze the target Store for processing. In the checked engine snapshot, the Link processor re-reads the target's current Energy and capacity and can truncate the processed amount to the free capacity that remains at processing time.</p>\n<p>The processor applies <code>Math.ceil(processedAmount × LINK_LOSS_RATIO)</code> after that truncation, so loss should be reconciled from the processed event amount, not blindly from the original request. The source cooldown is based on Link distance, not on how much Energy ultimately fits. A matched <code>EVENT_TRANSFER</code> therefore carries the stronger amount evidence for the processed source-target action.</p>\n\n<h2 id="verify">Verify exact transfer events</h2>`,
    slug,
    "link processed amount section",
  );

  articleHtml = replaceRequired(
    articleHtml,
    `        requestedAmount: pending.requestedAmount,\n        eventData: matches[0].data || null,`,
    `        requestedAmount: pending.requestedAmount,\n        processedAmount: matches[0].data?.amount ?? null,\n        processedEstimate: estimateLinkReceipt(\n          matches[0].data?.amount ?? 0\n        ),\n        eventData: matches[0].data || null,`,
    slug,
    "link processed amount verification",
  );

  const toc = article.toc.some(([id]) => id === "processed-amount")
    ? article.toc
    : article.toc.flatMap((entry) =>
        entry[0] === "verify"
          ? [["processed-amount", "Requested amount versus processed amount"] as [string, string], entry]
          : [entry],
      );

  return {
    ...article,
    description:
      "Coordinate same-room Link sends by reserving requested target capacity, keep predicted loss separate from processor-applied amount, and verify exact source-target EVENT_TRANSFER data.",
    finalScore: 99,
    updatedAt: "2026-08-17",
    toc,
    verification: addVerification(article, [
      [
        "Official engine source",
        `Checked screeps/engine ${ENGINE_SNAPSHOT}: Link processing re-reads target capacity, truncates to current free space when needed, then applies loss to the processed amount`,
      ],
      [
        "Capacity reservation policy",
        "Project policy — reserve requested Energy, not predicted post-loss receipt, so same-tick planning does not rely on processor order to reuse loss-created capacity",
      ],
      [
        "Amount and loss boundary",
        "A matched EVENT_TRANSFER amount is treated as processed Energy; loss is reconciled from that processed amount rather than assumed from the request",
      ],
      [
        "Screeps Console test",
        "Pending — no live same-tick multi-Link truncation trace is claimed",
      ],
      [
        "Live requested-versus-processed comparison",
        "Pending — no controlled target-capacity contention run was collected",
      ],
    ]),
    articleHtml,
  };
}

export function applyEnglishEditorialEighth20260817(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !EDITORIAL_EIGHTH_SLUGS.has(article.slug)) {
    return article;
  }

  if (article.slug === "screeps-mineral-extractor-harvest") {
    return patchMineral(article);
  }
  if (article.slug === "screeps-storage-energy-usage") {
    return patchStorage(article);
  }
  if (article.slug === "screeps-link-transfer-energy") {
    return patchLink(article);
  }

  return article;
}

export function getEnglishEditorialEighthUpdatedAt20260817(
  slug: string,
): string | undefined {
  return EDITORIAL_EIGHTH_SLUGS.has(slug)
    ? "2026-08-17"
    : undefined;
}
