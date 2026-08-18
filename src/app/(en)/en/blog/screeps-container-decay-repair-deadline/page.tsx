import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-container-decay-repair-deadline";
const chinesePath = "/blog/screeps-container-decay-repair-deadline";
const headline = "Screeps Container Decay: Repair Before the Next Fatal Tick";
const description =
  "Treat ticksToDecay as the next decay pulse, reserve time to submit repair(), reject unsafe deadlines, and verify processed EVENT_REPAIR amount and Energy cost on the next tick.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const discovery = getEnglishDiscoveryArticle(path);
const modifiedTime = discovery?.updatedAt ?? publishedAt;
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Container decay",
    "StructureContainer ticksToDecay",
    "Screeps Container repair",
    "Screeps EVENT_REPAIR",
    "CONTAINER_DECAY_TIME",
    "Screeps repair energy cost",
  ],
  alternates: {
    canonical: path,
    languages: { en: path, "zh-CN": chinesePath, "x-default": path },
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
    tags: discovery?.tags ?? ["Resources", "Construction", "Debugging"],
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
  ["meaning", "ticksToDecay is the next decay pulse"],
  ["estimate", "Estimate the visible decay runway"],
  ["deadline", "Reserve a repair submission tick"],
  ["priority", "Rank the most urgent Container"],
  ["action", "Submit one repair decision"],
  ["same-tick-ordering", "Current-engine same-tick ordering"],
  ["evidence", "Verify processed repair evidence"],
  ["cost", "Estimate unboosted Energy without overcounting"],
  ["failure-modes", "Failure and evidence checklist"],
  ["boundaries", "Evidence and engine boundaries"],
];

const articleHtml = String.raw`
<h2 id="meaning"><code>ticksToDecay</code> is the next decay pulse, not the whole lifetime</h2>
<p><code>StructureContainer.ticksToDecay</code> tells you how many ticks remain before the Container's next decay pulse. It is not a countdown to guaranteed destruction. A Container with one tick left and plenty of hits can survive that pulse and receive another decay interval.</p>
<p>The current public constants are <code>CONTAINER_HITS = 250000</code>, <code>CONTAINER_DECAY = 5000</code>, <code>CONTAINER_DECAY_TIME = 100</code>, and <code>CONTAINER_DECAY_TIME_OWNED = 500</code>. The current engine chooses the owned interval when the room has a Controller with a level above zero. Private servers can change constants, so production code should read the globals instead of scattering copied numbers.</p>

<h2 id="estimate">Estimate the visible decay runway, then invalidate it when state changes</h2>
<p>If nothing else damages or repairs the Container and the room's decay interval stays the same, the visible state gives you a useful estimate of how many decay pulses remain:</p>
<pre><code class="language-js">function estimateContainerRunway(container, room) {
  const decayEventsUntilLoss = Math.ceil(
    container.hits / CONTAINER_DECAY
  );

  const interval = room.controller?.level &gt; 0
    ? CONTAINER_DECAY_TIME_OWNED
    : CONTAINER_DECAY_TIME;

  return {
    nextDecayFatal: container.hits &lt;= CONTAINER_DECAY,
    decayEventsUntilLoss,
    estimatedTicksUntilLoss:
      container.ticksToDecay
      + (decayEventsUntilLoss - 1) * interval
  };
}</code></pre>
<p>This is a state-derived forecast, not a timer reservation. Incoming damage, another repairer, a change in room control, a private-server constant, or losing visibility can invalidate an older estimate. Re-resolve the Container by ID and recalculate before making the next maintenance decision.</p>

<h2 id="deadline">Reserve a repair submission tick after the travel lower bound</h2>
<p><code>Creep.repair()</code> works at range 3. If a repairer is outside that range, movement consumes earlier tick opportunities; reaching range 3 does not let later JavaScript in the same tick observe the moved position. Your deadline therefore needs room for the movement lower bound <em>and</em> at least one tick window in which the repair intent can be submitted before the dangerous pulse.</p>
<pre><code class="language-js">function classifyRepairDeadline(container, pathResult, safetyTicks) {
  if (!pathResult || pathResult.incomplete) {
    return { actionable: false, reason: 'incomplete-path' };
  }

  const travelLowerBound = pathResult.path.length;
  const repairSubmissionTicks = 1;
  const normalizedSafetyTicks =
    Number.isInteger(safetyTicks) &amp;&amp; safetyTicks &gt;= 0
      ? safetyTicks
      : 1;

  const repairSubmissionSlack =
    container.ticksToDecay
    - travelLowerBound
    - repairSubmissionTicks
    - normalizedSafetyTicks;

  return {
    actionable: repairSubmissionSlack &gt;= 0,
    reason: repairSubmissionSlack &gt;= 0
      ? 'repair-window-fits'
      : 'repair-window-misses-deadline',
    travelLowerBound,
    repairSubmissionTicks,
    safetyTicks: normalizedSafetyTicks,
    repairSubmissionSlack
  };
}</code></pre>
<p>This catches a dangerous off-by-one case. With zero policy safety margin, <code>ticksToDecay = 1</code> and a one-step path is already too late: the current tick can submit movement, but the Creep cannot use its post-move position to submit an in-range repair before that pulse. A Creep already in range has a travel lower bound of zero, which is the separate same-tick edge case discussed below.</p>
<p>Do not turn an incomplete PathFinder result into a numeric ETA. Even a complete path length is only a lower bound unless your movement model also accounts for fatigue, terrain, traffic, hostile blockers, Ramparts, room edges, and route changes.</p>

<h2 id="priority">Rank the most urgent Container without target churn</h2>
<p>Current hits alone are a weak priority signal. Prefer a Container whose next pulse is fatal, then smaller repair-submission slack, shorter estimated lifetime, lower hits, shorter travel lower bound, and finally a stable ID. Persist the selected Container ID while the assignment remains valid instead of re-ranking every tick and making the repairer oscillate between similar targets.</p>
<p>A maintenance policy does not have to repair every Container to full health. You can target a local hit ratio plus a buffer of several decay pulses. That ratio and buffer are project policy, not official Screeps recommendations; name them as policy so readers do not confuse your risk tolerance with an engine rule.</p>

<h2 id="action">Submit one repair decision and preserve the raw result</h2>
<p>Before calling <code>repair()</code>, re-resolve the exact Container ID and validate the Creep. Fail closed if the supplied Creep is not yours or the stored ID no longer resolves to a Container. The repairer should be fully spawned, have active WORK parts, carry Energy, and be within range 3. If it is outside range, preserve the movement result separately and do not also label the repair as successful.</p>
<pre><code class="language-js">function submitContainerRepair(creep, containerId) {
  if (!creep?.my) return { status: 'not-owned-creep' };

  const container = Game.getObjectById(containerId);
  if (!container || container.structureType !== STRUCTURE_CONTAINER) {
    return { status: 'not-container' };
  }
  if (creep.spawning) return { status: 'creep-spawning' };
  if (creep.getActiveBodyparts(WORK) &lt;= 0) {
    return { status: 'no-active-work' };
  }
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) &lt;= 0) {
    return { status: 'no-energy' };
  }

  const range = creep.pos.getRangeTo(container);
  if (!Number.isFinite(range)) {
    return { status: 'invalid-range' };
  }

  if (range &gt; 3) {
    const moveResult = creep.moveTo(container, { range: 3 });
    return { status: 'move-submitted', moveResult };
  }

  const repairResult = creep.repair(container);
  return {
    status: repairResult === OK
      ? 'repair-scheduled'
      : 'repair-rejected',
    repairResult,
    pending: repairResult === OK
      ? {
          tick: Game.time,
          roomName: creep.room.name,
          repairerId: creep.id,
          containerId: container.id,
          hitsBefore: container.hits,
          energyBefore:
            creep.store.getUsedCapacity(RESOURCE_ENERGY)
        }
      : null
  };
}</code></pre>
<p><code>OK</code> is submission evidence. It does not by itself prove how many hits were repaired, how much Energy the processor spent, or whether a later decay pulse still destroyed the Container.</p>

<h2 id="same-tick-ordering">Current-engine same-tick ordering is useful context, not an API contract</h2>
<p>In the checked <code>screeps/engine</code> 4.3.2 room processor, Creep intents are processed before the later object-tick pass that applies Container decay. The checked repair processor can therefore add repair hits before that Container's decay handler runs in the same processor cycle.</p>
<p>This matters for the already-in-range edge case: if a Creep starts the tick within repair range and its repair is still valid, current-engine ordering can raise the Container above a fatal decay threshold before the decay pass. This does <em>not</em> rescue a Creep that still needs to move into range during that same tick, because action checks use the tick's starting position snapshot.</p>
<p>The ordering statement is an implementation observation from the checked engine revision, not a documented API guarantee for every future engine version or private server. Do not build normal maintenance around a zero-margin rescue; keep a positive safety buffer. Live official-shard evidence for the exact fatal-pulse ordering remains pending.</p>

<h2 id="evidence">Verify the processed repair on the exact next tick</h2>
<p><code>Room.getEventLog()</code> returns events from the previous tick. Use that exact window to separate a scheduled repair from the amount actually processed: match <code>EVENT_REPAIR</code> by both the Creep ID and Container ID, then retain <code>event.data.amount</code> and <code>event.data.energySpent</code>.</p>
<pre><code class="language-js">function verifyPreviousRepair(pending) {
  if (!pending) return { status: 'no-pending-repair' };

  if (pending.tick !== Game.time - 1) {
    return {
      status: 'event-window-missed',
      submittedTick: pending.tick,
      observedTick: Game.time
    };
  }

  const room = Game.rooms[pending.roomName];
  if (!room) {
    return { status: 'room-not-visible' };
  }

  const event = room.getEventLog().find(candidate =&gt;
    candidate.event === EVENT_REPAIR
    &amp;&amp; candidate.objectId === pending.repairerId
    &amp;&amp; candidate.data?.targetId === pending.containerId
  );

  const container = Game.getObjectById(pending.containerId);

  if (!event) {
    return {
      status: 'repair-event-not-found',
      containerExists: Boolean(container),
      hitsNow: container?.hits ?? null
    };
  }

  return {
    status: 'repair-event-observed',
    processedHits: event.data?.amount ?? null,
    energySpent: event.data?.energySpent ?? null,
    containerExists: Boolean(container),
    hitsBefore: pending.hitsBefore,
    hitsNow: container?.hits ?? null,
    energyBefore: pending.energyBefore
  };
}</code></pre>
<p>A matching event proves that the checked actor processed a repair against the checked target in that event window. It does not prove the Container survived the rest of the processor cycle. If the event exists but the Container is absent on the next tick, preserve both facts: the repair processed, and the target was no longer present when observed.</p>
<p>Net hit change is supporting context only. Container decay, hostile damage, another Creep, or a Tower can offset the final hits. Missing the exact event-log observation window is an evidence gap, not proof that the repair failed.</p>

<h2 id="cost">Estimate unboosted Energy without charging the final partial action as a full action</h2>
<p>For an unboosted Creep, each active WORK part contributes <code>REPAIR_POWER</code> base repair hits per action. The processor caps a repair by the target's missing hits and available Energy, then rounds the Energy spent for the repair effect. That means a final partial repair can cost less than another full repair action.</p>
<pre><code class="language-js">function estimateUnboostedRepairEnergy(
  missingHits,
  activeWorkParts
) {
  if (!Number.isFinite(missingHits) || missingHits &lt;= 0) {
    return 0;
  }
  if (!Number.isInteger(activeWorkParts) || activeWorkParts &lt;= 0) {
    return Infinity;
  }

  const perActionHits = activeWorkParts * REPAIR_POWER;
  const fullActions = Math.floor(missingHits / perActionHits);
  const finalPartialHits = missingHits % perActionHits;

  const fullActionEnergy = Math.ceil(
    perActionHits * REPAIR_COST
  );
  const finalPartialEnergy = finalPartialHits &gt; 0
    ? Math.ceil(finalPartialHits * REPAIR_COST)
    : 0;

  return fullActions * fullActionEnergy + finalPartialEnergy;
}</code></pre>
<p>For example, two unboosted WORK parts can repair up to 200 hits in one action. Repairing 201 missing hits takes one full 200-hit action and one 1-hit partial action; with the current public constants, that is 2 Energy plus 1 Energy, not two full 2-Energy actions.</p>
<p>Boosted WORK needs a separate model. In the checked 4.3.2 processor, boost repair output is added to the base repair effect while <code>energySpent</code> is calculated from the base repair effect. Do not simply multiply Energy cost by the repair boost. For a real processed action, the event's <code>amount</code> and <code>energySpent</code> fields are stronger evidence than a pre-action estimate.</p>

<h2 id="failure-modes">Failure and evidence checklist</h2>
<table>
  <thead><tr><th>Observation</th><th>What it supports</th><th>What it does not prove</th></tr></thead>
  <tbody>
    <tr><td>Path search is incomplete</td><td>This planner did not find a complete route under its current search limits and matrix.</td><td>The Container is globally unreachable under every possible planner.</td></tr>
    <tr><td><code>repair()</code> returns <code>OK</code></td><td>The repair intent passed the runtime submission checks.</td><td>A particular hit amount, Energy cost, or survival outcome.</td></tr>
    <tr><td>Matching <code>EVENT_REPAIR</code></td><td>The exact actor-target repair processed; <code>amount</code> and <code>energySpent</code> describe that processed event.</td><td>The target survived later decay or damage.</td></tr>
    <tr><td>Container hits increased</td><td>Net state moved upward between observations.</td><td>Which repairer caused the change when multiple writers exist.</td></tr>
    <tr><td>Container missing next tick</td><td>The object is unavailable in the current observation.</td><td>That the submitted repair never processed; check the previous event window.</td></tr>
  </tbody>
</table>

<h2 id="boundaries">Evidence and engine boundaries</h2>
<p>The current official Container decay constants, <code>Creep.repair()</code> range, scheduled-return semantics, and Room repair-event fields were rechecked on August 18, 2026. The implementation notes in this revision were checked against <code>screeps/engine</code> 4.3.2 at commit <code>80977824199a596d174d392fd0cf8c458c21fcbd</code>.</p>
<p><strong>Timing boundary:</strong> the “repair intent before Container decay tick” statement is current-engine source behavior, not a permanent API contract. The deadline planner still reserves an explicit repair-submission window and a configurable safety margin.</p>
<p><strong>Cost boundary:</strong> the unboosted helper estimates Energy for a fixed missing-hit amount with the current repair constants. Damage, decay, other repairers, changed constants, or boosts can change the real work remaining. The processed event remains the best per-action evidence.</p>
<p><strong>Observation boundary:</strong> Screeps Console execution, official-shard fatal-pulse repair ordering, boosted WORK traces, hostile pressure, traffic delays, and multi-repairer locking remain Pending. No live result is fabricated.</p>
`;

export default function ContainerDecayRepairDeadlinePage() {
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
      breadcrumbLabel="Container decay"
      category="ROOM ECONOMY · CONTAINER DECAY"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="19 min read"
      tags={["Resources", "Construction", "Debugging"]}
      verification={[
        { term: "Official documentation", value: "Checked August 18, 2026 — Container decay, Creep.repair(), range, scheduled return code, constants, and previous-tick EVENT_REPAIR fields" },
        { term: "Engine source", value: "screeps/engine 4.3.2 · 80977824199a596d174d392fd0cf8c458c21fcbd" },
        { term: "Static code review", value: "Passed — decay runway, repair-submission tick, identity checks, incomplete-path boundary, partial-action Energy estimate, exact event identity, and event-window handling" },
        { term: "Live same-tick verification", value: "Pending — no official-shard fatal-pulse repair trace or boosted WORK event transcript was collected" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
