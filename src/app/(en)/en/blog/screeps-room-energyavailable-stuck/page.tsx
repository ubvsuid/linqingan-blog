import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-room-energyavailable-stuck";
const chinesePath = "/blog/screeps-room-energyavailable-stuck";
const headline = "Why room.energyAvailable Stays Below Capacity in Screeps";
const description =
  "Diagnose room.energyAvailable below energyCapacityAvailable by inspecting Spawn and Extension Stores, selecting one fill target, recording transfer() results, and verifying later deltas.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;
const modifiedTime = discovery?.updatedAt ?? publishedAt;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps room.energyAvailable",
    "energyCapacityAvailable",
    "Screeps Extension not filling",
    "Screeps Spawn energy",
    "Creep.transfer Extension",
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
    tags: discovery?.tags ?? ["Spawn", "Energy", "Debugging"],
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
  ["two-room-values", "What the two Room values measure"],
  ["real-gap-or-demand", "Separate a fill failure from normal demand"],
  ["inspect-structures", "Inspect every active Spawn and Extension"],
  ["complete-example", "Complete filler and later verification"],
  ["return-codes", "transfer() return-code checklist"],
  ["boundaries", "Verification boundaries"],
];

const articleHtml = String.raw`
<h2 id="two-room-values">What the two Room values measure</h2>
<p><code>room.energyAvailable</code> is the Energy currently stored in the room's Spawns and Extensions. <code>room.energyCapacityAvailable</code> is their total Energy capacity. The difference tells you how much spawn-network capacity is empty, but not which structure is empty or why delivery failed.</p>
<p>Energy in Storage, Containers, Terminals, or Links does not directly raise <code>room.energyAvailable</code>. A normal <code>spawnCreep()</code> request spends Energy that is already inside same-room Spawns and Extensions.</p>

<h2 id="real-gap-or-demand">Separate a fill failure from normal demand</h2>
<p>A low value can indicate a broken filler, but it can also be normal production demand. A hauler may add 50 Energy to one Extension while a Spawn request consumes 50 Energy elsewhere. The target Store increased and the Creep Store decreased, yet the room total stayed flat.</p>
<p>Do not use only <code>room.energyAvailable &gt; previousValue</code> as proof. Prefer a bounded later observation of the exact target Store, the Creep Store, the room total, and concurrent spawning activity.</p>

<h2 id="inspect-structures">Inspect every active Spawn and Extension</h2>
<pre><code class="language-js">function isSpawnEnergyStructure(structure) {
  return (
    structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION
  );
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
  const details = getActiveSpawnEnergyStructures(room)
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

  return {
    roomName: room.name,
    roomEnergyAvailable: room.energyAvailable,
    roomEnergyCapacityAvailable: room.energyCapacityAvailable,
    missingEnergy: Math.max(
      0,
      room.energyCapacityAvailable - room.energyAvailable
    ),
    measuredUsed: details.reduce((sum, item) =&gt; sum + item.used, 0),
    measuredCapacity: details.reduce((sum, item) =&gt; sum + item.capacity, 0),
    structures: details
  };
}</code></pre>
<p>This snapshot identifies whether the gap is in a Spawn or Extension and whether one remote structure remains empty. If your measured active Store totals disagree with the Room values, preserve the full same-tick snapshot and Controller state before claiming an engine defect.</p>

<h2 id="complete-example">Complete filler and later verification</h2>
<p>The example below accepts one Creep that already carries Energy. It does not choose a withdrawal source. It filters active owned Spawns and Extensions, ranks by range, free capacity, and stable ID, submits one final transfer decision, and records a later observation.</p>
<pre><code class="language-js">function getFillCandidates(creep) {
  return getActiveSpawnEnergyStructures(creep.room)
    .map(target =&gt; ({
      target,
      free: target.store.getFreeCapacity(RESOURCE_ENERGY),
      range: creep.pos.getRangeTo(target)
    }))
    .filter(candidate =&gt;
      Number.isFinite(candidate.free) &amp;&amp; candidate.free &gt; 0
    )
    .sort((left, right) =&gt;
      left.range - right.range
      || right.free - left.free
      || left.target.id.localeCompare(right.target.id)
    );
}

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

  const targetGain = targetNow === null
    ? null
    : targetNow - pending.targetBefore;
  const creepLoss = pending.creepBefore - creepNow;
  const roomDelta = roomNow === null
    ? null
    : roomNow - pending.roomBefore;

  let status = "not-observed";
  if (targetGain !== null &amp;&amp; targetGain &gt; 0 &amp;&amp; creepLoss &gt; 0) {
    status = "matching-target-and-creep-delta";
  } else if (targetGain !== null &amp;&amp; targetGain &gt; 0) {
    status = "target-gain-observed";
  } else if (creepLoss &gt; 0) {
    status = "creep-loss-observed";
  } else if (roomDelta !== null &amp;&amp; roomDelta &gt; 0) {
    status = "room-increase-observed";
  } else if (target === null) {
    status = "target-unavailable";
  } else if (Game.time &gt; pending.tick + 1) {
    status = "late-observation";
  }

  const record = {
    verifiedAt: Game.time,
    creepName: creep.name,
    ...pending,
    targetNow,
    creepNow,
    roomNow,
    targetGain,
    creepLoss,
    roomDelta,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  delete memory.pending[creep.name];
  return record;
}

function runSpawnEnergyFiller(creep) {
  const verification = verifyPreviousEnergyFill(creep);

  if (creep.spawning) return { status: "creep-spawning", verification };
  if (creep.getActiveBodyparts(CARRY) &lt;= 0) {
    return { status: "no-active-carry-part", verification };
  }

  const carried = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  if (carried &lt;= 0) return { status: "no-carried-energy", verification };

  const roomState = describeRoomEnergy(creep.room);
  if (roomState.missingEnergy &lt;= 0) {
    return { status: "room-energy-full", roomState, verification };
  }

  if (creep.memory.energyFillDecisionTick === Game.time) {
    return { status: "already-decided-this-tick", roomState, verification };
  }
  creep.memory.energyFillDecisionTick = Game.time;

  const candidate = getFillCandidates(creep)[0];
  if (!candidate) {
    return {
      status: "no-fillable-active-structure",
      roomState,
      verification
    };
  }

  if (!creep.pos.isNearTo(candidate.target)) {
    return {
      status: "moving-to-energy-target",
      targetId: candidate.target.id,
      moveResult: creep.moveTo(candidate.target, { range: 1, reusePath: 5 }),
      roomState,
      verification
    };
  }

  const amount = Math.min(carried, candidate.free);
  const targetBefore =
    candidate.target.store.getUsedCapacity(RESOURCE_ENERGY);
  const result = creep.transfer(
    candidate.target,
    RESOURCE_ENERGY,
    amount
  );

  if (result === OK) {
    getEnergyFillMemory().pending[creep.name] = {
      tick: Game.time,
      roomName: creep.room.name,
      targetId: candidate.target.id,
      requestedAmount: amount,
      targetBefore,
      creepBefore: carried,
      roomBefore: creep.room.energyAvailable
    };
  }

  return {
    status: result === OK ? "transfer-submitted" : "transfer-failed",
    result,
    targetId: candidate.target.id,
    requestedAmount: amount,
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
    || outcome.status === "no-fillable-active-structure"
  ) {
    console.log(JSON.stringify({
      type: "spawn-energy-fill-problem",
      tick: Game.time,
      creepName: creep.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="return-codes">transfer() return-code checklist</h2>
<table>
  <thead><tr><th>Code</th><th>Likely cause</th><th>Response</th></tr></thead>
  <tbody>
    <tr><td><code>OK</code></td><td>Transfer accepted</td><td>Observe target and Creep Stores later</td></tr>
    <tr><td><code>ERR_BUSY</code></td><td>Creep still spawning</td><td>Wait</td></tr>
    <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Creep lacks the requested Energy</td><td>Re-read carried amount</td></tr>
    <tr><td><code>ERR_INVALID_TARGET</code></td><td>Target cannot receive Energy</td><td>Rebuild the Spawn/Extension candidate list</td></tr>
    <tr><td><code>ERR_FULL</code></td><td>Another action filled the target</td><td>Reselect next tick</td></tr>
    <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Range exceeds one</td><td>Record movement separately</td></tr>
    <tr><td><code>ERR_INVALID_ARGS</code></td><td>Invalid resource or amount</td><td>Validate Energy and amount</td></tr>
  </tbody>
</table>

<h2 id="boundaries">Verification boundaries</h2>
<p>Offline tests covered a full room, Spawn and Extension gaps, exclusion of hostile and inactive structures, range ordering, larger-gap tie breaking, stable ID ordering, amount caps, and a successful target delta while the room total stayed flat. The complete JavaScript example passed a syntax check.</p>
<p>These checks do not prove live traffic, multi-hauler contention, the exact settlement interaction with spawning, Power Creep effects, complex CostMatrix reachability, or minimum CPU cost. Console and live-shard evidence remain pending.</p>
<p>Continue with <a href="/en/blog/screeps-dynamic-creep-body">dynamic Creep bodies</a>, <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return codes</a>, or <a href="/en/blog/screeps-storage-energy-usage">Storage Energy policy</a>.</p>
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
      breadcrumbLabel="Room Energy diagnostics"
      category="SPAWN SYSTEM · ENERGY DIAGNOSTICS"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="15 min read"
      tags={["Spawn", "Energy", "Debugging"]}
      verification={[
        { term: "Documentation", value: "Official API references checked" },
        { term: "Syntax", value: "Complete JavaScript example checked offline" },
        { term: "Offline cases", value: "10 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
