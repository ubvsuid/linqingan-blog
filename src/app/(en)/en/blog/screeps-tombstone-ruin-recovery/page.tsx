import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-tombstone-ruin-recovery";
const chinesePath = "/blog/screeps-tombstone-ruin-recovery";
const headline = "Screeps Tombstone and Ruin Recovery: Reach the Loot Before It Decays";
const description =
  "Recover Tombstone and Ruin resources without chasing doomed targets: reject incomplete structure-aware paths, compare an optimistic arrival bound with ticksToDecay, preserve target identity, and verify withdraw results later.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const modifiedTime = "2026-08-17";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Tombstone resource recovery",
    "Screeps Ruin withdraw",
    "Screeps ticksToDecay path",
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
  ["why-decay-ranking-fails", "Why expiry-first ranking can still fail"],
  ["api-boundary", "Tombstone, Ruin, and withdraw() boundaries"],
  ["reachability-policy", "Use a conservative reachability policy"],
  ["complete-example", "Complete recovery example"],
  ["verification", "Verify the processed result later"],
  ["return-codes", "withdraw() return-code checklist"],
  ["boundaries", "Evidence and policy boundaries"],
];

const articleHtml = String.raw`
<h2 id="why-decay-ranking-fails">Why expiry-first ranking can still fail</h2>
<p><code>ticksToDecay</code> is useful urgency data, but urgency is not reachability. A recovery Creep can repeatedly prefer the object with the smallest timer even when terrain, blocking Structures, closed hostile Ramparts, or a long detour make that target a bad rescue attempt.</p>
<p>The useful distinction is:</p>
<ul>
  <li><strong>API fact:</strong> visible Tombstones and Ruins expose <code>ticksToDecay</code> and a <code>Store</code>.</li>
  <li><strong>Path fact:</strong> a search can be incomplete, and a useful salvage search must model stable blocking Structures rather than treating terrain-only distance as reachability.</li>
  <li><strong>Project policy:</strong> do not assign a target when even an optimistic complete-path lower bound reaches withdrawal range too late.</li>
</ul>
<p>This policy prevents obvious doomed assignments. It does not promise that a Creep will actually travel one path tile every tick.</p>

<h2 id="api-boundary">Tombstone, Ruin, and withdraw() boundaries</h2>
<p>A dropped <code>Resource</code> uses <code>creep.pickup(resource)</code>. A <code>Tombstone</code> or <code>Ruin</code> exposes a <code>store</code>, so use <code>creep.withdraw(target, resourceType, amount)</code> from range 1.</p>
<p>Do not persist the JavaScript object itself across ticks. Save the target ID and resource type, recover the object with <code>Game.getObjectById()</code>, and validate it again. The object can decay or its Store can change while the Creep is travelling.</p>
<p>An accepted <code>withdraw()</code> request is not a resource reservation. In the current engine processor, Creep free capacity and target stock are read again while applying the intent, and the processed transfer event records the applied amount. Under contention, the request amount and processed amount therefore need not be identical.</p>

<h2 id="reachability-policy">Use a conservative reachability policy</h2>
<p>The example builds a one-room <code>CostMatrix</code> for stable Structure obstacles, then calls <code>PathFinder.search()</code> only when selecting or replacing an assignment. Roads are cheap, normal walkable tiles keep the default cost, obstacle Structure types are set to 255, and owned or public Ramparts remain traversable.</p>
<p>A complete path gives an optimistic tile-count lower bound to range 1. An incomplete search is rejected. Then compare that lower bound with <code>ticksToDecay</code>:</p>
<pre><code class="language-text">optimistic travel ticks = completePath.length
minimum safe lifetime = optimistic travel ticks + 1 withdrawal tick + margin</code></pre>
<p>The extra withdrawal tick avoids treating “reach range 1 at the last possible moment” as safe. The margin is a local engineering choice. Fatigue, swamp movement, traffic, Creeps used as temporary blockers, hostile movement, pulls, and custom path policy can all make real travel slower, so this is a <strong>lower-bound filter</strong>, not an ETA guarantee.</p>

<h2 id="complete-example">Complete recovery example</h2>
<p>This example scans visible Tombstones and Ruins in one room, rejects protected or unreachable candidates, refuses targets that cannot survive an optimistic arrival bound, ranks the remaining choices deterministically, stores only stable identity across ticks, and keeps movement, withdrawal, and later verification separate.</p>

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

const RECOVERY_MARGIN = 2;
const HISTORY_LIMIT = 20;

function resourceRank(resourceType) {
  const index = RESOURCE_PRIORITY.indexOf(resourceType);
  return index === -1 ? RESOURCE_PRIORITY.length : index;
}

function isClosedHostileRampart(structure) {
  return structure.structureType === STRUCTURE_RAMPART
    &amp;&amp; structure.my !== true
    &amp;&amp; structure.isPublic !== true;
}

function isProtectedTarget(target) {
  return target.pos.lookFor(LOOK_STRUCTURES).some(isClosedHostileRampart);
}

function buildRecoveryMatrix(room) {
  const costs = new PathFinder.CostMatrix();

  for (const structure of room.find(FIND_STRUCTURES)) {
    if (structure.structureType === STRUCTURE_ROAD) {
      costs.set(structure.pos.x, structure.pos.y, 1);
      continue;
    }

    if (
      structure.structureType === STRUCTURE_RAMPART
      &amp;&amp; (structure.my === true || structure.isPublic === true)
    ) {
      continue;
    }

    if (OBSTACLE_OBJECT_TYPES.includes(structure.structureType)) {
      costs.set(structure.pos.x, structure.pos.y, 255);
    }
  }

  return costs;
}

function chooseResourceType(target) {
  return Object.keys(target.store)
    .filter(type =&gt; target.store.getUsedCapacity(type) &gt; 0)
    .sort((left, right) =&gt;
      resourceRank(left) - resourceRank(right)
      || target.store.getUsedCapacity(right)
        - target.store.getUsedCapacity(left)
      || left.localeCompare(right)
    )[0] ?? null;
}

function searchToWithdrawRange(creep, target, matrix) {
  const search = PathFinder.search(
    creep.pos,
    { pos: target.pos, range: 1 },
    {
      maxRooms: 1,
      roomCallback(roomName) {
        return roomName === creep.room.name ? matrix : false;
      }
    }
  );

  return search.incomplete ? null : search.path;
}

function describeCandidate(creep, target, matrix) {
  const free = creep.store.getFreeCapacity();
  if (
    free &lt;= 0
    || !target?.id
    || !target.store
    || !Number.isFinite(target.ticksToDecay)
    || target.ticksToDecay &lt;= 0
    || isProtectedTarget(target)
  ) return null;

  const resourceType = chooseResourceType(target);
  if (!resourceType) return null;

  const available = target.store.getUsedCapacity(resourceType);
  const requestedAmount = Math.min(available, free);
  if (!Number.isFinite(requestedAmount) || requestedAmount &lt;= 0) {
    return null;
  }

  const path = creep.pos.isNearTo(target)
    ? []
    : searchToWithdrawRange(creep, target, matrix);
  if (path === null) return null;

  const optimisticTravelTicks = path.length;
  const minimumSafeLifetime = optimisticTravelTicks + 1 + RECOVERY_MARGIN;
  if (target.ticksToDecay &lt; minimumSafeLifetime) return null;

  return {
    target,
    targetId: target.id,
    resourceType,
    requestedAmount,
    ticksToDecay: target.ticksToDecay,
    optimisticTravelTicks,
    slack: target.ticksToDecay - minimumSafeLifetime,
    rank: resourceRank(resourceType)
  };
}

function selectCandidate(creep) {
  const matrix = buildRecoveryMatrix(creep.room);

  return [
    ...creep.room.find(FIND_TOMBSTONES),
    ...creep.room.find(FIND_RUINS)
  ]
    .map(target =&gt; describeCandidate(creep, target, matrix))
    .filter(Boolean)
    .sort((left, right) =&gt;
      left.slack - right.slack
      || left.rank - right.rank
      || right.requestedAmount - left.requestedAmount
      || left.optimisticTravelTicks - right.optimisticTravelTicks
      || left.targetId.localeCompare(right.targetId)
    )[0] ?? null;
}

function recoveryMemory() {
  Memory.recovery ??= { pending: {}, history: [] };
  return Memory.recovery;
}

function verifyPrevious(creep) {
  const memory = recoveryMemory();
  const pending = memory.pending[creep.name];
  if (!pending || pending.tick &gt;= Game.time) return null;

  const target = Game.getObjectById(pending.targetId);
  const creepNow = creep.store.getUsedCapacity(pending.resourceType);
  const targetNow = target?.store
    ? target.store.getUsedCapacity(pending.resourceType)
    : null;

  const exactEvent = creep.room.getEventLog().find(event =&gt;
    event.event === EVENT_TRANSFER
    &amp;&amp; event.objectId === pending.targetId
    &amp;&amp; event.data?.targetId === pending.creepId
    &amp;&amp; event.data?.resourceType === pending.resourceType
  );

  const creepGain = creepNow - pending.creepBefore;
  const targetLoss = targetNow === null
    ? null
    : pending.targetBefore - targetNow;
  const processedAmount = exactEvent?.data?.amount ?? null;

  const status = Number.isFinite(processedAmount) &amp;&amp; processedAmount &gt; 0
    ? 'exact-transfer-event-observed'
    : creepGain &gt; 0 &amp;&amp; targetLoss !== null &amp;&amp; targetLoss &gt; 0
      ? 'matching-store-deltas-observed'
      : creepGain &gt; 0
        ? 'creep-gain-observed'
        : target === null
          ? 'target-unavailable-after-submit'
          : 'withdraw-not-observed';

  const record = {
    verifiedAt: Game.time,
    ...pending,
    creepNow,
    targetNow,
    creepGain,
    targetLoss,
    processedAmount,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-HISTORY_LIMIT);
  delete memory.pending[creep.name];
  return record;
}

function runRecoveryCreep(creep) {
  const verification = verifyPrevious(creep);

  if (creep.spawning) return { status: 'creep-spawning', verification };
  if (creep.getActiveBodyparts(CARRY) &lt;= 0) {
    return { status: 'no-active-carry-part', verification };
  }
  if (creep.store.getFreeCapacity() &lt;= 0) {
    return { status: 'creep-full', verification };
  }

  let candidate = null;
  if (creep.memory.recoveryTargetId) {
    const saved = Game.getObjectById(creep.memory.recoveryTargetId);
    if (saved) {
      const matrix = buildRecoveryMatrix(creep.room);
      candidate = describeCandidate(creep, saved, matrix);
    }
  }

  if (!candidate) {
    candidate = selectCandidate(creep);
    creep.memory.recoveryTargetId = candidate?.targetId ?? null;
  }

  if (!candidate) {
    return { status: 'no-recoverable-target', verification };
  }

  if (!creep.pos.isNearTo(candidate.target)) {
    const moveResult = creep.moveTo(candidate.target, {
      range: 1,
      reusePath: 3
    });

    if (moveResult !== OK) creep.memory.recoveryTargetId = null;

    return {
      status: 'moving-to-recovery-target',
      targetId: candidate.targetId,
      moveResult,
      optimisticTravelTicks: candidate.optimisticTravelTicks,
      slack: candidate.slack,
      verification
    };
  }

  const creepBefore = creep.store.getUsedCapacity(candidate.resourceType);
  const targetBefore = candidate.target.store.getUsedCapacity(
    candidate.resourceType
  );
  const requestedAmount = Math.min(
    targetBefore,
    creep.store.getFreeCapacity()
  );

  if (requestedAmount &lt;= 0) {
    creep.memory.recoveryTargetId = null;
    return { status: 'target-changed-before-withdraw', verification };
  }

  const result = creep.withdraw(
    candidate.target,
    candidate.resourceType,
    requestedAmount
  );

  if (result === OK) {
    recoveryMemory().pending[creep.name] = {
      tick: Game.time,
      creepId: creep.id,
      targetId: candidate.targetId,
      resourceType: candidate.resourceType,
      requestedAmount,
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
    requestedAmount,
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

<h2 id="verification">Verify the processed result later</h2>
<p><code>withdraw()</code> returning <code>OK</code> means the request passed submission checks. It does not prove that a same-line Store read contains the processed result.</p>
<p>The checked engine emits <code>EVENT_TRANSFER</code> for a processed withdrawal with the Tombstone/Ruin ID as <code>objectId</code>, the Creep ID as <code>targetId</code>, the resource type, and the processed amount. When that exact next-tick event is available, it is stronger evidence than inferring the operation only from aggregate Store deltas.</p>
<p>The example therefore records <code>requestedAmount</code> separately from <code>processedAmount</code>. Store deltas remain fallback evidence because other same-tick activity can change either Store.</p>

<h2 id="return-codes">withdraw() return-code checklist</h2>
<table>
  <thead><tr><th>Code</th><th>Meaning in this workflow</th><th>Response</th></tr></thead>
  <tbody>
    <tr><td><code>OK</code></td><td>Request accepted</td><td>Verify the exact later event or bounded Store evidence</td></tr>
    <tr><td><code>ERR_BUSY</code></td><td>Creep is still spawning</td><td>Wait</td></tr>
    <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Requested resource/amount is no longer available</td><td>Re-read target Store and reselect</td></tr>
    <tr><td><code>ERR_INVALID_TARGET</code></td><td>Object is gone or is not withdrawable</td><td>Clear the saved ID</td></tr>
    <tr><td><code>ERR_FULL</code></td><td>Creep has no usable free Store capacity</td><td>Deliver before recovering more</td></tr>
    <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Target is outside range 1</td><td>Keep movement and withdrawal diagnostics separate</td></tr>
    <tr><td><code>ERR_INVALID_ARGS</code></td><td>Resource type or amount is invalid</td><td>Recompute from the current Stores</td></tr>
  </tbody>
</table>

<h2 id="boundaries">Evidence and policy boundaries</h2>
<p>The current official Screeps engine source was checked at commit <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>, including the current withdrawal processor. The article deliberately separates API/processor behavior from the local salvage policy.</p>
<p><strong>Policy boundary:</strong> <code>path.length + 1 + margin</code> is only an optimistic lower-bound filter. The matrix models stable Structure obstacles, but it does not convert terrain or fatigue into exact travel ticks, reserve traffic lanes, predict moving Creeps, or reproduce every custom movement system. For high-value recovery, replace the simple policy with your own movement-time model.</p>
<p><strong>Live evidence:</strong> Screeps Console test: Pending. Live decay-race test: Pending. Multiplayer contention test: Pending. No live result is fabricated here.</p>
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
      readingTime="18 min read"
      tags={["Creeps", "Resources", "Energy", "Pathfinding"]}
      verification={[
        { term: "Engine source", value: "80977824199a596d174d392fd0cf8c458c21fcbd" },
        { term: "Policy", value: "Structure-aware optimistic reachability bound" },
        { term: "Screeps Console test", value: "Pending" },
        { term: "Live decay race", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
