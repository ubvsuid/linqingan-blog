import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-room-energyavailable-stuck";
const chinesePath = "/blog/screeps-room-energyavailable-stuck";
const headline = "Why room.energyAvailable Stays Below Capacity in Screeps";
const description =
  "Diagnose room.energyAvailable below energyCapacityAvailable by reconciling active Spawn and Extension Stores, holding one stable fill target, preserving transfer() results, and matching the processed Energy transfer on the next tick.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const modifiedTime = "2026-08-18";
const articleTags = ["Spawn", "Energy", "Debugging", "Events"];
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps room.energyAvailable",
    "Screeps energyCapacityAvailable",
    "Screeps Extension not filling",
    "Screeps Spawn energy",
    "Creep.transfer Extension",
    "Screeps EVENT_TRANSFER",
    "Screeps room energy stuck",
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
    tags: articleTags,
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
  ["room-aggregate", "What the two Room values actually measure"],
  ["demand-vs-delivery", "Separate production demand from delivery failure"],
  ["reconcile-structures", "Reconcile the exact Spawn and Extension Stores"],
  ["stable-target", "Keep one fill target stable while moving"],
  ["complete-example", "Complete filler with exact next-tick evidence"],
  ["return-codes", "transfer() return-code checklist"],
  ["boundaries", "Evidence and engine boundaries"],
];

const articleHtml = String.raw`
<h2 id="room-aggregate">What the two Room values actually measure</h2>
<p><code>room.energyAvailable</code> is the current Energy available in your room's Spawn-and-Extension network. <code>room.energyCapacityAvailable</code> is the corresponding total capacity. Energy in Storage, Containers, Terminals, Links, Towers, Labs, or a Creep's Store does not directly increase either Room aggregate.</p>
<p>The official Room API describes these values in terms of Spawns and Extensions. The current checked engine goes one step deeper: while creating the runtime Room snapshot, it adds owned Spawn/Extension Energy and capacity only when the underlying object is not marked <code>off</code>. That is why an action-oriented diagnostic should inspect <strong>owned active</strong> Spawns and Extensions instead of blindly summing every visible structure.</p>
<p>This is a current-engine implementation boundary, not a promise that player code should depend on a private <code>off</code> field. Use the public <code>structure.isActive()</code> check in your script.</p>

<h2 id="demand-vs-delivery">Separate production demand from delivery failure</h2>
<p>A Room aggregate below capacity does not automatically mean the filler is broken. A valid delivery and a valid Spawn consumption can happen around the same period. The target Extension can gain Energy while <code>room.energyAvailable</code> stays flat or even falls because another Spawn/Extension simultaneously funds production.</p>
<p>That creates an important evidence hierarchy:</p>
<ol>
  <li><strong>Strongest for one submitted fill:</strong> the exact processed <code>EVENT_TRANSFER</code> for the sending Creep, target structure, resource type, and amount.</li>
  <li><strong>Useful fallback:</strong> matching target gain and Creep loss on the next snapshot.</li>
  <li><strong>Context only:</strong> the room-level Energy delta, because other Spawn-network activity can change it.</li>
</ol>
<p>Do not require <code>room.energyAvailable &gt; previousValue</code> as proof that one <code>transfer()</code> worked.</p>

<h2 id="reconcile-structures">Reconcile the exact Spawn and Extension Stores</h2>
<p>Start with a read-only same-tick snapshot. It tells you which active owned structure has free capacity and whether the structure-level totals agree with the Room aggregate you are trying to diagnose.</p>
<pre><code class="language-js">function isSpawnEnergyStructure(structure) {
  return structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION;
}

function getActiveSpawnEnergyStructures(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =&gt;
      isSpawnEnergyStructure(structure)
      &amp;&amp; structure.isActive()
      &amp;&amp; structure.store.getCapacity(RESOURCE_ENERGY) &gt; 0
  });
}

function describeRoomEnergy(room) {
  const structures = getActiveSpawnEnergyStructures(room)
    .map(structure =&gt; ({
      id: structure.id,
      type: structure.structureType,
      used: structure.store.getUsedCapacity(RESOURCE_ENERGY),
      capacity: structure.store.getCapacity(RESOURCE_ENERGY),
      free: structure.store.getFreeCapacity(RESOURCE_ENERGY)
    }))
    .sort((left, right) =&gt;
      left.type.localeCompare(right.type)
      || left.id.localeCompare(right.id)
    );

  const measuredUsed = structures.reduce(
    (sum, item) =&gt; sum + item.used,
    0
  );
  const measuredCapacity = structures.reduce(
    (sum, item) =&gt; sum + item.capacity,
    0
  );

  return {
    tick: Game.time,
    roomName: room.name,
    roomEnergyAvailable: room.energyAvailable,
    roomEnergyCapacityAvailable: room.energyCapacityAvailable,
    missingEnergy: Math.max(
      0,
      room.energyCapacityAvailable - room.energyAvailable
    ),
    measuredUsed,
    measuredCapacity,
    usedDifference: room.energyAvailable - measuredUsed,
    capacityDifference:
      room.energyCapacityAvailable - measuredCapacity,
    structures
  };
}</code></pre>
<p>On the checked engine, an unexplained difference is worth preserving as evidence, but do not jump straight to “engine bug.” First record the full snapshot, Controller level/ownership, every relevant structure's <code>isActive()</code> result, and the exact tick. A stale assumption about which Extensions are active is a much more ordinary diagnosis.</p>

<h2 id="stable-target">Keep one fill target stable while moving</h2>
<p>A common filler anti-pattern is to sort all empty Extensions every tick and immediately chase whichever one looks closest now. When several haulers are filling the same network, that can cause target churn: a Creep walks toward Extension A, another hauler changes the free-capacity ordering, and the first Creep turns toward B before it ever delivers.</p>
<p>Use a stable target ID while the target remains valid. Re-resolve the object each tick, require the same room, ownership, active state, supported structure type, and positive Energy capacity, then clear the ID when it becomes full or invalid.</p>
<pre><code class="language-js">function resolveFillTarget(creep, targetId) {
  if (!targetId) return null;

  const target = Game.getObjectById(targetId);
  if (
    !target
    || target.room?.name !== creep.room.name
    || target.my !== true
    || !isSpawnEnergyStructure(target)
    || !target.isActive()
    || target.store.getFreeCapacity(RESOURCE_ENERGY) &lt;= 0
  ) return null;

  return target;
}

function selectFillTarget(creep) {
  const candidates = getActiveSpawnEnergyStructures(creep.room)
    .filter(target =&gt;
      target.store.getFreeCapacity(RESOURCE_ENERGY) &gt; 0
    )
    .sort((left, right) =&gt; left.id.localeCompare(right.id));

  return creep.pos.findClosestByPath(candidates) ?? null;
}</code></pre>
<p><code>findClosestByPath()</code> is a project choice here because a straight range ranking can repeatedly prefer a structure that the current pathfinder cannot reach. A production traffic system may use a shared CostMatrix or reservation layer instead; the article does not claim this helper is a universal scheduler.</p>

<h2 id="complete-example">Complete filler with exact next-tick evidence</h2>
<p>The complete example accepts one Creep that already carries Energy. It does not choose a withdrawal source. It keeps one target stable while moving, records movement separately, recomputes the transferable amount at adjacent range, submits one <code>transfer()</code>, and verifies the previous tick on the next run.</p>
<pre><code class="language-js">const HISTORY_LIMIT = 20;

function getEnergyFillMemory() {
  Memory.energyFill ??= { pending: {}, history: [] };
  return Memory.energyFill;
}

function verifyPreviousEnergyFill(creep) {
  const memory = getEnergyFillMemory();
  const pending = memory.pending[creep.name];
  if (!pending || pending.tick &gt;= Game.time) return null;

  const target = Game.getObjectById(pending.targetId);
  const room = Game.rooms[pending.roomName];
  const targetNow = target?.store
    ? target.store.getUsedCapacity(RESOURCE_ENERGY)
    : null;
  const creepNow = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  const roomNow = room ? room.energyAvailable : null;

  // Room.getEventLog() exposes the previous tick's processed events.
  const exactEvent = creep.room.getEventLog().find(event =&gt;
    event.event === EVENT_TRANSFER
    &amp;&amp; event.objectId === pending.creepId
    &amp;&amp; event.data?.targetId === pending.targetId
    &amp;&amp; event.data?.resourceType === RESOURCE_ENERGY
  );

  const processedAmount = exactEvent?.data?.amount ?? null;
  const targetGain = targetNow === null
    ? null
    : targetNow - pending.targetBefore;
  const creepLoss = pending.creepBefore - creepNow;
  const roomDelta = roomNow === null
    ? null
    : roomNow - pending.roomBefore;

  let status = "transfer-not-observed";
  if (Number.isFinite(processedAmount) &amp;&amp; processedAmount &gt; 0) {
    status = "exact-transfer-event-observed";
  } else if (targetGain !== null &amp;&amp; targetGain &gt; 0 &amp;&amp; creepLoss &gt; 0) {
    status = "matching-target-and-creep-delta";
  } else if (targetGain !== null &amp;&amp; targetGain &gt; 0) {
    status = "target-gain-observed";
  } else if (creepLoss &gt; 0) {
    status = "creep-loss-observed";
  } else if (target === null) {
    status = "target-unavailable-after-submit";
  }

  const record = {
    verifiedAt: Game.time,
    ...pending,
    processedAmount,
    targetNow,
    creepNow,
    roomNow,
    targetGain,
    creepLoss,
    roomDelta,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-HISTORY_LIMIT);
  delete memory.pending[creep.name];
  return record;
}

function runSpawnEnergyFiller(creep) {
  const verification = verifyPreviousEnergyFill(creep);

  if (creep.spawning) {
    return { status: "creep-spawning", verification };
  }
  if (creep.getActiveBodyparts(CARRY) &lt;= 0) {
    return { status: "no-active-carry-part", verification };
  }

  const carried = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  if (carried &lt;= 0) {
    return { status: "no-carried-energy", verification };
  }

  const roomState = describeRoomEnergy(creep.room);
  if (roomState.missingEnergy &lt;= 0) {
    creep.memory.energyFillTargetId = null;
    return { status: "room-energy-full", roomState, verification };
  }

  let target = resolveFillTarget(
    creep,
    creep.memory.energyFillTargetId
  );

  if (!target) {
    target = selectFillTarget(creep);
    creep.memory.energyFillTargetId = target?.id ?? null;
  }

  if (!target) {
    return {
      status: "no-reachable-fill-target",
      roomState,
      verification
    };
  }

  if (!creep.pos.isNearTo(target)) {
    const moveResult = creep.moveTo(target, {
      range: 1,
      reusePath: 5
    });

    if (moveResult !== OK) {
      creep.memory.energyFillTargetId = null;
    }

    return {
      status: "moving-to-energy-target",
      targetId: target.id,
      moveResult,
      roomState,
      verification
    };
  }

  const targetBefore = target.store.getUsedCapacity(RESOURCE_ENERGY);
  const freeNow = target.store.getFreeCapacity(RESOURCE_ENERGY);
  const carriedNow = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  const requestedAmount = Math.min(carriedNow, freeNow);

  if (requestedAmount &lt;= 0) {
    creep.memory.energyFillTargetId = null;
    return {
      status: "target-changed-before-transfer",
      targetId: target.id,
      roomState,
      verification
    };
  }

  const result = creep.transfer(
    target,
    RESOURCE_ENERGY,
    requestedAmount
  );

  if (result === OK) {
    getEnergyFillMemory().pending[creep.name] = {
      tick: Game.time,
      roomName: creep.room.name,
      creepId: creep.id,
      targetId: target.id,
      requestedAmount,
      targetBefore,
      creepBefore: carriedNow,
      roomBefore: creep.room.energyAvailable
    };
  } else {
    creep.memory.energyFillTargetId = null;
  }

  return {
    status: result === OK ? "transfer-submitted" : "transfer-failed",
    result,
    targetId: target.id,
    requestedAmount,
    roomState,
    verification
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.EnergyFiller1;
  if (!creep) return;

  const outcome = runSpawnEnergyFiller(creep);
  if (
    outcome.status === "transfer-failed"
    || outcome.status === "no-reachable-fill-target"
  ) {
    console.log(JSON.stringify({
      type: "spawn-energy-fill-problem",
      tick: Game.time,
      creepName: creep.name,
      ...outcome
    }));
  }
};</code></pre>
<p>The checked engine's <code>transfer</code> processor re-reads the target's current capacity while processing the intent and can reduce the processed amount if the target filled in the meantime. The processor records the actual amount in <code>EVENT_TRANSFER</code>. For this reason, keep <code>requestedAmount</code> and <code>processedAmount</code> as different fields.</p>
<p>An <code>OK</code> return is submission evidence. The exact next-tick event is processed-result evidence. The room aggregate is operational context, not proof of that one transfer.</p>

<h2 id="return-codes">transfer() return-code checklist</h2>
<table>
  <thead><tr><th>Code</th><th>Meaning in this workflow</th><th>Response</th></tr></thead>
  <tbody>
    <tr><td><code>OK</code></td><td>The transfer was scheduled successfully.</td><td>Match the exact previous-tick event on the next tick.</td></tr>
    <tr><td><code>ERR_NOT_OWNER</code></td><td>The sending Creep is not yours.</td><td>Stop; do not retry ownership failures as logistics.</td></tr>
    <tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait.</td></tr>
    <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep lacks the requested Energy.</td><td>Re-read carried Energy and recompute the amount.</td></tr>
    <tr><td><code>ERR_INVALID_TARGET</code></td><td>The target cannot receive this transfer.</td><td>Clear the saved ID and rebuild the candidate set.</td></tr>
    <tr><td><code>ERR_FULL</code></td><td>The target has no free capacity in the current snapshot.</td><td>Clear the target and select again.</td></tr>
    <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is not adjacent.</td><td>Keep the movement result separate from the transfer result.</td></tr>
    <tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type or amount is invalid.</td><td>Recompute from current Stores.</td></tr>
  </tbody>
</table>

<h2 id="boundaries">Evidence and engine boundaries</h2>
<p>The official Room API, <code>Creep.transfer()</code>, <code>Room.getEventLog()</code>, and current <code>screeps/engine</code> 4.3.2 source were rechecked on August 18, 2026. The engine master checked for this revision is <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>.</p>
<p><strong>Engine-source boundary:</strong> the current runtime builds <code>room.energyAvailable</code> and <code>room.energyCapacityAvailable</code> from owned Spawn/Extension objects that are not <code>off</code>. The article uses public <code>isActive()</code> rather than relying on that internal field.</p>
<p><strong>Concurrency boundary:</strong> a transfer event proves that one transfer processed, but it does not prove the room total had to rise by the same amount. Spawn consumption or other transfers can change the same aggregate around the observation window.</p>
<p><strong>Live evidence:</strong> Screeps Console test: Pending. Live multi-hauler contention trace: Pending. Live transfer-plus-spawn-consumption trace: Pending. No live result is fabricated.</p>
<p>Continue with <a href="/en/blog/screeps-dynamic-creep-body">dynamic Creep bodies</a>, <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return codes</a>, <a href="/en/blog/screeps-room-event-log">Room event logs</a>, or <a href="/en/blog/screeps-storage-energy-usage">Storage Energy policy</a>.</p>
`;

export default function RoomEnergyAvailableStuckPage() {
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
      url: articleUrl,
      author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about`, sameAs: [siteConfig.links.github] },
      publisher: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: articleTags,
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
      breadcrumbLabel="Room Energy diagnostics"
      category="SPAWN SYSTEM · ENERGY DIAGNOSTICS"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="19 min read"
      tags={articleTags}
      verification={[
        { term: "Official documentation", value: "Checked August 18, 2026 — Room.energyAvailable, Room.energyCapacityAvailable, Structure.isActive(), Creep.transfer(), and Room.getEventLog()" },
        { term: "Engine source", value: "screeps/engine 4.3.2 · 80977824199a596d174d392fd0cf8c458c21fcbd" },
        { term: "Static code review", value: "Passed — active structure reconciliation, stable target identity, path-aware target selection, exact transfer-event matching, and requested-versus-processed amount separation" },
        { term: "Evidence model", value: "Exact EVENT_TRANSFER first; matching Store deltas second; room aggregate only as concurrent-demand context" },
        { term: "Screeps Console test", value: "Pending — no real-account Console transcript was collected for this revision" },
        { term: "Live multi-tick verification pending", value: "Pending — no live multi-hauler contention or transfer-plus-spawn-consumption trace was collected" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
