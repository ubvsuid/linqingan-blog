import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-room-energyavailable-stuck";
const chinesePath = "/blog/screeps-room-energyavailable-stuck";
const headline = "Why room.energyAvailable Stays Below Capacity in Screeps";
const description =
  "Diagnose room.energyAvailable below energyCapacityAvailable by locating the active Spawn or Extension still missing Energy, preserving transfer() and movement results, and verifying the processed fill on the next tick.";
const publishedAt = "2026-08-04";
const publishedLabel = "August 4, 2026";
const modifiedTime = "2026-08-29";
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
  ["quick-diagnosis", "Quick diagnosis"],
  ["likely-causes", "Likely causes"],
  ["minimal-diagnostic", "Run one read-only diagnostic"],
  ["fix-retest", "Fix the branch you actually found"],
  ["room-aggregate", "What the Room values measure"],
  ["stable-target", "Keep one fill target stable"],
  ["next-tick-verification", "Verify the processed transfer next tick"],
  ["return-codes", "transfer() return-code checklist"],
  ["boundaries", "Less common and evidence boundaries"],
];

const articleHtml = String.raw`
<h2 id="quick-diagnosis">Quick diagnosis</h2>
<p>If <code>room.energyAvailable</code> stays below <code>room.energyCapacityAvailable</code>, do not begin by debugging Storage, Containers, Towers, or your total room Energy. These Room values describe the Energy currently available in your owned Spawn-and-Extension network.</p>
<p>Start with four questions:</p>
<ol>
  <li>Which active owned Spawn or Extension still has free Energy capacity?</li>
  <li>Does your filler Creep actually carry Energy?</li>
  <li>What exact value did <code>creep.transfer()</code> return?</li>
  <li>If it returned <code>OK</code>, did the target fill on the next processed tick even if the room aggregate stayed flat?</li>
</ol>
<blockquote><p><strong>Below capacity is a symptom. Find the missing structure first, preserve the action result second, and use next-tick evidence before blaming the room aggregate.</strong></p></blockquote>

<h2 id="likely-causes">The most likely causes</h2>
<div class="table-scroll"><table>
<thead><tr><th>What you observe</th><th>Likely cause</th><th>What to inspect next</th></tr></thead>
<tbody>
<tr><td>One Spawn or Extension still has free capacity</td><td>The fill route has not reached that structure yet.</td><td>Filler Store, saved target, movement result, then <code>transfer()</code> result.</td></tr>
<tr><td>The filler keeps walking but rarely transfers</td><td>The target changes while the Creep is moving, or the path keeps failing.</td><td>Keep one target ID stable and preserve <code>moveTo()</code> separately.</td></tr>
<tr><td><code>transfer()</code> returns <code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent.</td><td>Move to range 1, then retry on a later tick.</td></tr>
<tr><td><code>transfer()</code> returns <code>ERR_FULL</code></td><td>The target is full now, or the requested amount no longer fits its remaining capacity.</td><td>Re-read target free capacity, clear stale target state, and recompute the amount.</td></tr>
<tr><td><code>transfer()</code> returns <code>OK</code> but the Room value does not rise</td><td>The transfer may have processed while spawning or another fill changed the same network.</td><td>Check the target and the previous-tick <code>EVENT_TRANSFER</code>; do not use room delta alone as proof.</td></tr>
<tr><td>No active Spawn/Extension appears to have free capacity, but the Room values still disagree</td><td>Your assumption about active structures or the captured tick may be stale.</td><td>Reconcile the exact active owned structures and preserve the snapshot before escalating.</td></tr>
</tbody>
</table></div>

<h2 id="minimal-diagnostic">Run one read-only diagnostic first</h2>
<p><strong>State impact:</strong> read-only. Pass the visible Room you are debugging into this helper. It does not move a Creep or submit a transfer.</p>
<pre><code class="language-js">function diagnoseRoomEnergy(room) {
  const structures = room.find(FIND_MY_STRUCTURES, {
    filter: structure =&gt;
      (
        structure.structureType === STRUCTURE_SPAWN
        || structure.structureType === STRUCTURE_EXTENSION
      )
      &amp;&amp; structure.isActive()
      &amp;&amp; structure.store.getCapacity(RESOURCE_ENERGY) &gt; 0
  });

  const fillTargets = structures
    .map(structure =&gt; ({
      id: structure.id,
      type: structure.structureType,
      used: structure.store.getUsedCapacity(RESOURCE_ENERGY),
      free: structure.store.getFreeCapacity(RESOURCE_ENERGY),
      capacity: structure.store.getCapacity(RESOURCE_ENERGY)
    }))
    .filter(structure =&gt; structure.free &gt; 0)
    .sort((left, right) =&gt;
      left.type.localeCompare(right.type)
      || left.id.localeCompare(right.id)
    );

  return {
    tick: Game.time,
    roomName: room.name,
    energyAvailable: room.energyAvailable,
    energyCapacityAvailable: room.energyCapacityAvailable,
    missingEnergy: Math.max(
      0,
      room.energyCapacityAvailable - room.energyAvailable
    ),
    fillTargets
  };
}</code></pre>
<p>Interpret the result before changing code. If <code>fillTargets</code> contains a structure, you have a concrete destination to trace. If it is empty while the Room aggregate is still below capacity, move to the deeper structure reconciliation later in this guide instead of repeatedly changing filler logic.</p>

<h2 id="fix-retest">Fix the branch you actually found, then retest</h2>
<p>Use the diagnostic result to choose one branch rather than changing several systems at once:</p>
<ul>
<li><strong>Filler has no Energy:</strong> fix the acquisition/withdrawal side first. A delivery loop cannot repair a missing supply.</li>
<li><strong>Target exists but is out of range:</strong> keep that target stable, preserve the movement result, and retry after movement has actually changed position.</li>
<li><strong>Target filled before your transfer:</strong> clear the stale target and select again from current free capacity.</li>
<li><strong>Transfer returns <code>OK</code>:</strong> do not immediately rewrite the route because the room aggregate stayed flat. Verify the processed target/event on the next tick.</li>
<li><strong>No active target explains the gap:</strong> reconcile the exact active Spawn/Extension Stores and Controller context before treating the discrepancy as unusual.</li>
</ul>
<p>Retest one controlled fill with the same target ID and the exact action result preserved. This turns “room Energy looks stuck” into a specific state, movement, action, or concurrency problem.</p>

<h2 id="room-aggregate">What the two Room values actually measure</h2>
<p><code>room.energyAvailable</code> is the current Energy available in the room's Spawn-and-Extension network. <code>room.energyCapacityAvailable</code> is that network's corresponding total capacity. Energy in Storage, Containers, Terminals, Links, Towers, Labs, or a Creep's Store does not directly increase either Room aggregate.</p>
<p>The official Room API defines the values in terms of Spawns and Extensions. In the current checked engine, the runtime Room snapshot accumulates owned Spawn/Extension Energy and capacity only for structures that are not internally marked <code>off</code>. Player code should not depend on that private field; use the public <code>structure.isActive()</code> check.</p>
<p>A Room aggregate below capacity also does not prove that a previous fill failed. Spawn consumption and other fillers can change the same network around the same observation window. A target can gain Energy while <code>room.energyAvailable</code> stays flat or falls.</p>

<h3>Deeper structure reconciliation</h3>
<p>If the minimal diagnostic reports no free active target but the aggregates still disagree, preserve a full same-tick snapshot:</p>
<pre><code class="language-js">function reconcileRoomEnergy(room) {
  const structures = room.find(FIND_MY_STRUCTURES, {
    filter: structure =&gt;
      (
        structure.structureType === STRUCTURE_SPAWN
        || structure.structureType === STRUCTURE_EXTENSION
      )
      &amp;&amp; structure.isActive()
      &amp;&amp; structure.store.getCapacity(RESOURCE_ENERGY) &gt; 0
  }).map(structure =&gt; ({
    id: structure.id,
    type: structure.structureType,
    used: structure.store.getUsedCapacity(RESOURCE_ENERGY),
    capacity: structure.store.getCapacity(RESOURCE_ENERGY),
    free: structure.store.getFreeCapacity(RESOURCE_ENERGY)
  }));

  const measuredUsed = structures.reduce(
    (sum, structure) =&gt; sum + structure.used,
    0
  );
  const measuredCapacity = structures.reduce(
    (sum, structure) =&gt; sum + structure.capacity,
    0
  );

  return {
    tick: Game.time,
    roomName: room.name,
    roomEnergyAvailable: room.energyAvailable,
    roomEnergyCapacityAvailable: room.energyCapacityAvailable,
    measuredUsed,
    measuredCapacity,
    usedDifference: room.energyAvailable - measuredUsed,
    capacityDifference:
      room.energyCapacityAvailable - measuredCapacity,
    controllerLevel: room.controller?.level ?? null,
    controllerMy: room.controller?.my ?? null,
    structures
  };
}</code></pre>
<p>An unexplained difference is worth recording, but it is not enough by itself to call an engine bug. Keep the exact tick, Controller state, and per-structure values so the observation can be reproduced.</p>

<h2 id="stable-target">Keep one fill target stable while moving</h2>
<p>A common logistics failure is target churn: a filler chooses Extension A, another Creep changes the free-capacity ordering, and the first filler switches to B before reaching A. Save one target ID while it remains valid, and only select again when it becomes invalid or full.</p>
<pre><code class="language-js">function isSpawnEnergyStructure(structure) {
  return structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION;
}

function resolveFillTarget(creep, targetId) {
  if (!targetId) return null;

  const target = Game.getObjectById(targetId);
  if (
    !target
    || target.room?.name !== creep.room.name
    || target.my !== true
    || !isSpawnEnergyStructure(target)
    || !target.isActive()
    || target.store.getFreeCapacity(RESOURCE_ENERGY) &lt;= 0
  ) {
    return null;
  }

  return target;
}

function selectFillTarget(creep) {
  const candidates = creep.room.find(FIND_MY_STRUCTURES, {
    filter: target =&gt;
      isSpawnEnergyStructure(target)
      &amp;&amp; target.isActive()
      &amp;&amp; target.store.getFreeCapacity(RESOURCE_ENERGY) &gt; 0
  });

  return creep.pos.findClosestByPath(candidates) ?? null;
}</code></pre>
<p><code>findClosestByPath()</code> is a project choice, not a universal logistics scheduler. It is useful here because a pure range sort can prefer a structure the current pathfinder cannot reach.</p>

<h2 id="next-tick-verification">Verify the processed transfer on the next tick</h2>
<p>Keep submission evidence and processed-result evidence separate. <code>creep.transfer()</code> returning <code>OK</code> means the transfer intent was accepted for that tick. The checked processor re-reads target capacity later and can reduce the processed amount if the target filled before processing. Its <code>EVENT_TRANSFER</code> records the amount that actually moved.</p>
<p>Save the target and before-state when <code>transfer()</code> returns <code>OK</code>, then check the previous tick from the same Room on the next run:</p>
<pre><code class="language-js">function rememberSubmittedFill(creep, target, requestedAmount) {
  Memory.energyFillPending ??= {};

  Memory.energyFillPending[creep.name] = {
    tick: Game.time,
    roomName: creep.room.name,
    creepId: creep.id,
    targetId: target.id,
    requestedAmount,
    targetBefore:
      target.store.getUsedCapacity(RESOURCE_ENERGY),
    creepBefore:
      creep.store.getUsedCapacity(RESOURCE_ENERGY),
    roomBefore: creep.room.energyAvailable
  };
}

function verifyPreviousFill(creep) {
  const pending = Memory.energyFillPending?.[creep.name];
  if (!pending || pending.tick &gt;= Game.time) return null;

  const room = Game.rooms[pending.roomName];
  const target = Game.getObjectById(pending.targetId);

  const event = room?.getEventLog().find(item =&gt;
    item.event === EVENT_TRANSFER
    &amp;&amp; item.objectId === pending.creepId
    &amp;&amp; item.data?.targetId === pending.targetId
    &amp;&amp; item.data?.resourceType === RESOURCE_ENERGY
  );

  const result = {
    verifiedAt: Game.time,
    submittedAt: pending.tick,
    targetId: pending.targetId,
    requestedAmount: pending.requestedAmount,
    processedAmount: event?.data?.amount ?? null,
    targetNow: target?.store
      ? target.store.getUsedCapacity(RESOURCE_ENERGY)
      : null,
    creepNow:
      creep.store.getUsedCapacity(RESOURCE_ENERGY),
    roomNow: room?.energyAvailable ?? null
  };

  delete Memory.energyFillPending[creep.name];
  return result;
}</code></pre>
<p><code>Room.getEventLog()</code> exposes events from the previous tick, so this verification belongs on the later run. Using the saved Room name also avoids accidentally asking a different Room for the event if the Creep moved after submission.</p>
<p>For one submitted fill, the evidence order is: exact matching <code>EVENT_TRANSFER</code> first; matching target/Creep Store changes second; room-level delta only as context. Do not require <code>room.energyAvailable &gt; previousValue</code> as proof that one transfer worked.</p>

<h2 id="return-codes">transfer() return-code checklist</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning in this workflow</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The transfer intent was accepted for the current tick.</td><td>Verify the processed event or later Store state next tick.</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The sending Creep is not yours.</td><td>Stop; do not retry an ownership error as logistics.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning is complete.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep does not carry the requested resource amount.</td><td>Re-read carried Energy and recompute the request.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target cannot receive this transfer/resource.</td><td>Clear the target and rebuild the candidate set.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The target is full, or the explicit requested amount exceeds its current remaining capacity.</td><td>Re-read free capacity and recompute before retrying.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The target is not adjacent.</td><td>Move to range 1 and preserve the movement result separately.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type or amount is invalid.</td><td>Rebuild the call from current Store values.</td></tr>
</tbody>
</table></div>

<h2 id="boundaries">Less common and evidence boundaries</h2>
<p>The official Room API, <code>Creep.transfer()</code>, <code>Structure.isActive()</code>, <code>Room.getEventLog()</code>, and current <code>screeps/engine</code> 4.3.2 source were rechecked on August 29, 2026. The checked engine master remains <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>.</p>
<p><strong>Engine-source boundary:</strong> the current runtime builds the two Room Energy aggregates from owned Spawn/Extension objects that are not internally <code>off</code>. This article uses the public <code>isActive()</code> API rather than relying on that internal field.</p>
<p><strong>Concurrency boundary:</strong> an exact transfer event proves that one transfer processed, not that the room total had to rise by the same amount. Spawn consumption and other transfers can overlap the same observation window.</p>
<p><strong>Live evidence:</strong> Screeps Console test: Pending. Live multi-hauler contention trace: Pending. Live transfer-plus-spawn-consumption trace: Pending. No live result is fabricated.</p>
<p>If your next problem is production cost rather than filling, continue with <a href="/en/blog/screeps-dynamic-creep-body">dynamic Creep bodies</a> or <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep() return codes</a>. For processed event inspection, use the <a href="/en/blog/screeps-room-event-log">Room event log guide</a>. For Energy outside the Spawn/Extension network, use the <a href="/en/blog/screeps-storage-energy-usage">Storage Energy policy guide</a>.</p>
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
      readingTime="15 min read"
      tags={articleTags}
      verification={[
        { term: "Official documentation", value: "Checked August 29, 2026 — Room.energyAvailable, Room.energyCapacityAvailable, Structure.isActive(), Creep.transfer(), and Room.getEventLog()" },
        { term: "Engine source", value: "screeps/engine 4.3.2 · 80977824199a596d174d392fd0cf8c458c21fcbd" },
        { term: "Static code review", value: "Passed — symptom-first diagnostic, active Spawn/Extension reconciliation, stable target identity, separate movement/transfer results, saved-room event verification, and requested-versus-processed amount separation" },
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
