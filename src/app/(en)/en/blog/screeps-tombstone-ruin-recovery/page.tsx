import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-tombstone-ruin-recovery";
const chinesePath = "/blog/screeps-tombstone-ruin-recovery";
const headline = "How to Recover Resources from Tombstones and Ruins in Screeps";
const description =
  "Scan visible Tombstones and Ruins, rank candidates by expiry, resource priority, amount, and range, submit withdraw() safely, and verify bounded Store changes on a later tick.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;
const modifiedTime = discovery?.updatedAt ?? publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Tombstone resource recovery",
    "Screeps Ruin withdraw",
    "FIND_TOMBSTONES",
    "FIND_RUINS",
    "Creep.withdraw Tombstone",
  ],
  alternates: {
    canonical: path,
    languages: {
      en: path,
      "zh-CN": chinesePath,
      "x-default": path,
    },
    types: { "application/rss+xml": "/en/feed.xml" },
  },
  openGraph: {
    type: "article",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: articleUrl,
    siteName: "Linqingan",
    title: `${headline} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime,
    tags: discovery?.tags ?? ["Creeps", "Resources", "Energy"],
    images: [{ url: `${siteConfig.url}${path}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["tombstone-vs-ruin", "Tombstone and Ruin are Store targets"],
  ["selection-policy", "Build an explicit selection policy"],
  ["complete-example", "Complete recovery example"],
  ["verification", "Why OK is not final proof"],
  ["return-codes", "Return-code checklist"],
  ["boundaries", "Verification boundaries"],
];

const articleHtml = String.raw`
<h2 id="tombstone-vs-ruin">Tombstone and Ruin are Store targets</h2>
<p>A dropped <code>Resource</code> is collected with <code>creep.pickup(resource)</code>. A <code>Tombstone</code> or <code>Ruin</code> exposes a <code>store</code>, so the matching action is <code>creep.withdraw(target, resourceType, amount)</code>.</p>
<p>A Tombstone represents a dead Creep. A Ruin represents a destroyed Structure. Both are walkable, both may hold several resource types, and both expose <code>ticksToDecay</code>. Read that live value instead of hard-coding an assumed lifetime.</p>
<p>This guide covers visible targets in the Creep's current room. It does not combine recovery with delivery, combat threat scoring, or cross-room routing.</p>

<h2 id="selection-policy">Build an explicit selection policy</h2>
<p>The nearest target is not always the right target. A useful emergency policy can compare:</p>
<ul>
  <li>whether the Store still contains a valid resource;</li>
  <li>how soon the object expires;</li>
  <li>your business priority for Power, Ops, Ghodium, minerals, commodities, and Energy;</li>
  <li>the amount that fits in the Creep's free capacity;</li>
  <li>range, followed by a stable ID tie-breaker.</li>
</ul>
<p>The example below ranks <code>ticksToDecay</code> first because it is designed for salvage that may disappear. Move resource rank ahead of expiry when high-value material matters more than rescuing every object.</p>

<pre><code class="language-js">const RESOURCE_PRIORITY = [
  RESOURCE_POWER,
  RESOURCE_OPS,
  RESOURCE_GHODIUM,
  RESOURCE_CATALYST,
  RESOURCE_ZYNTHIUM,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_OXYGEN,
  RESOURCE_HYDROGEN,
  RESOURCE_ENERGY
];

function getResourceRank(resourceType) {
  const index = RESOURCE_PRIORITY.indexOf(resourceType);
  return index === -1
    ? RESOURCE_PRIORITY.length - 1
    : index;
}</code></pre>

<h2 id="complete-example">Complete recovery example</h2>
<p>This version scans both find constants, rejects empty or expiring targets, avoids a target covered by a non-public hostile Rampart, saves only an ID and resource type across ticks, keeps movement and withdrawal results separate, and records a bounded later observation.</p>

<pre><code class="language-js">function isBlockedByHostileRampart(target) {
  return target.pos.lookFor(LOOK_STRUCTURES).some(structure =&gt;
    structure.structureType === STRUCTURE_RAMPART
    &amp;&amp; structure.my !== true
    &amp;&amp; structure.isPublic !== true
  );
}

function selectResourceType(target, freeCapacity) {
  if (!target?.store || freeCapacity &lt;= 0) return null;

  return Object.keys(target.store)
    .filter(type =&gt; target.store.getUsedCapacity(type) &gt; 0)
    .sort((left, right) =&gt; {
      const rank = getResourceRank(left) - getResourceRank(right);
      if (rank !== 0) return rank;

      const amount =
        target.store.getUsedCapacity(right)
        - target.store.getUsedCapacity(left);
      return amount !== 0 ? amount : left.localeCompare(right);
    })[0] ?? null;
}

function describeCandidate(creep, target) {
  const free = creep.store.getFreeCapacity();

  if (
    free &lt;= 0
    || !target?.id
    || !target.store
    || !Number.isFinite(target.ticksToDecay)
    || target.ticksToDecay &lt;= 0
    || isBlockedByHostileRampart(target)
  ) {
    return null;
  }

  const resourceType = selectResourceType(target, free);
  if (!resourceType) return null;

  const available = target.store.getUsedCapacity(resourceType);
  const amount = Math.min(available, free);
  if (!Number.isFinite(amount) || amount &lt;= 0) return null;

  return {
    target,
    targetId: target.id,
    resourceType,
    amount,
    ticksToDecay: target.ticksToDecay,
    rank: getResourceRank(resourceType),
    range: creep.pos.getRangeTo(target)
  };
}

function selectCandidate(creep) {
  return [
    ...creep.room.find(FIND_TOMBSTONES),
    ...creep.room.find(FIND_RUINS)
  ]
    .map(target =&gt; describeCandidate(creep, target))
    .filter(Boolean)
    .sort((left, right) =&gt;
      left.ticksToDecay - right.ticksToDecay
      || left.rank - right.rank
      || right.amount - left.amount
      || left.range - right.range
      || left.targetId.localeCompare(right.targetId)
    )[0] ?? null;
}

function getRecoveryMemory() {
  Memory.recovery ??= { pending: {}, history: [] };
  return Memory.recovery;
}

function verifyPreviousRecovery(creep) {
  const memory = getRecoveryMemory();
  const pending = memory.pending[creep.name];
  if (!pending || pending.tick &gt;= Game.time) return null;

  const creepNow = creep.store.getUsedCapacity(pending.resourceType);
  const target = Game.getObjectById(pending.targetId);
  const targetNow = target?.store
    ? target.store.getUsedCapacity(pending.resourceType)
    : null;

  const creepGain = creepNow - pending.creepBefore;
  const targetLoss = targetNow === null
    ? null
    : pending.targetBefore - targetNow;

  const status = creepGain &gt; 0 &amp;&amp; targetLoss !== null &amp;&amp; targetLoss &gt; 0
    ? 'matching-delta-observed'
    : creepGain &gt; 0
      ? 'creep-gain-observed'
      : target === null
        ? 'target-unavailable'
        : Game.time &gt; pending.tick + 1
          ? 'late-observation'
          : 'not-observed';

  const record = {
    verifiedAt: Game.time,
    creepName: creep.name,
    ...pending,
    creepNow,
    targetNow,
    creepGain,
    targetLoss,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  delete memory.pending[creep.name];
  return record;
}

function runRecoveryCreep(creep) {
  const verification = verifyPreviousRecovery(creep);

  if (creep.spawning) return { status: 'creep-spawning', verification };
  if (creep.getActiveBodyparts(CARRY) &lt;= 0) {
    return { status: 'no-active-carry-part', verification };
  }
  if (creep.store.getFreeCapacity() &lt;= 0) {
    return { status: 'creep-full', verification };
  }

  let target = creep.memory.recoveryTargetId
    ? Game.getObjectById(creep.memory.recoveryTargetId)
    : null;
  let candidate = target ? describeCandidate(creep, target) : null;

  if (!candidate) {
    candidate = selectCandidate(creep);
    creep.memory.recoveryTargetId = candidate?.targetId ?? null;
  }

  if (!candidate) {
    return { status: 'recovery-target-not-found', verification };
  }

  if (!creep.pos.isNearTo(candidate.target)) {
    return {
      status: 'moving-to-recovery-target',
      targetId: candidate.targetId,
      moveResult: creep.moveTo(candidate.target, { range: 1, reusePath: 5 }),
      verification
    };
  }

  const creepBefore = creep.store.getUsedCapacity(candidate.resourceType);
  const targetBefore = candidate.target.store.getUsedCapacity(candidate.resourceType);
  const result = creep.withdraw(
    candidate.target,
    candidate.resourceType,
    candidate.amount
  );

  if (result === OK) {
    getRecoveryMemory().pending[creep.name] = {
      tick: Game.time,
      targetId: candidate.targetId,
      resourceType: candidate.resourceType,
      requestedAmount: candidate.amount,
      creepBefore,
      targetBefore
    };
  } else {
    creep.memory.recoveryTargetId = null;
  }

  return {
    status: result === OK ? 'withdraw-submitted' : 'withdraw-failed',
    result,
    targetId: candidate.targetId,
    resourceType: candidate.resourceType,
    requestedAmount: candidate.amount,
    verification
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Recovery1;
  if (!creep) return;

  const outcome = runRecoveryCreep(creep);
  if (outcome.status === 'withdraw-failed') {
    console.log(JSON.stringify({
      type: 'resource-recovery-problem',
      tick: Game.time,
      creepName: creep.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="verification">Why OK is not final proof</h2>
<p><code>withdraw()</code> returning <code>OK</code> means the command was accepted for processing. It does not prove that a same-line Store read already reflects the final result. Save the before-state, inspect both Stores on a later tick, and keep outcomes such as target unavailable, late observation, or no observed change.</p>
<p>A matching Creep gain and target loss is still bounded evidence. Another Creep or another action may change either Store during the same tick, so do not describe the delta as perfect causal proof.</p>

<h2 id="return-codes">Return-code checklist</h2>
<table>
  <thead><tr><th>Code</th><th>Likely cause</th><th>Response</th></tr></thead>
  <tbody>
    <tr><td><code>OK</code></td><td>Command accepted</td><td>Verify later Store state</td></tr>
    <tr><td><code>ERR_BUSY</code></td><td>Creep is still spawning</td><td>Wait for spawning to finish</td></tr>
    <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Target was depleted or contested</td><td>Clear and reselect the target</td></tr>
    <tr><td><code>ERR_INVALID_TARGET</code></td><td>Object disappeared or is not withdrawable</td><td>Recover by ID and validate again</td></tr>
    <tr><td><code>ERR_FULL</code></td><td>No free CARRY capacity</td><td>Switch to delivery</td></tr>
    <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Range is greater than one</td><td>Move and log the move result separately</td></tr>
    <tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid resource type or amount</td><td>Recompute the request</td></tr>
  </tbody>
</table>

<h2 id="boundaries">Verification boundaries</h2>
<p>The selection logic and complete example were checked offline for JavaScript syntax and nine candidate-selection boundaries: zero capacity, empty Store, expired target, hostile Rampart coverage, resource ordering, capacity capping, expiry ordering, amount ordering, and stable ID ties.</p>
<p>Offline checks cannot prove live movement, decay, multiplayer contention, real shard settlement, full CostMatrix interaction, or minimum CPU cost. Console and live-shard verification therefore remain explicitly pending.</p>
<p>Continue with <a href="/en/blog/screeps-pickup-dropped-energy">pickup() for dropped resources</a>, <a href="/en/blog/screeps-withdraw-container-energy">withdraw() from Containers</a>, or the <a href="/en/blog/screeps-get-object-by-id">cross-tick object ID guide</a>.</p>
`;

export default function TombstoneRuinRecoveryPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline,
      description,
      datePublished: publishedAt,
      dateModified: modifiedTime,
      inLanguage: "en-US",
      mainEntityOfPage: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${siteConfig.url}/en/blog` },
        { "@type": "ListItem", position: 3, name: headline, item: articleUrl },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Tombstone and Ruin recovery"
      category="ROOM ECONOMY · RESOURCE RECOVERY"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="17 min read"
      tags={["Creeps", "Resources", "Energy"]}
      verification={[
        { term: "Documentation", value: "Official API references checked" },
        { term: "Syntax", value: "Complete JavaScript example checked offline" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
