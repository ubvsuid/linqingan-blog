import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-container-decay-repair-deadline";
const chinesePath = "/blog/screeps-container-decay-repair-deadline";
const headline = "Screeps Container Decay: Repair Before the Next Fatal Tick";
const description =
  "Treat ticksToDecay as the next decay pulse, estimate remaining Container decay events, include travel time, submit one repair action, and verify the exact repair event on the next tick.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Container decay",
    "StructureContainer ticksToDecay",
    "Screeps Container maintenance",
    "Creep repair Container",
    "CONTAINER_DECAY_TIME",
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
  ["estimate", "Estimate remaining decay events"],
  ["policy", "Normalize maintenance policy"],
  ["deadline", "Subtract travel and safety time"],
  ["priority", "Rank the most urgent Container"],
  ["action", "Submit one move or repair action"],
  ["evidence", "Verify the exact repair event"],
  ["cost", "Estimate WORK and Energy"],
  ["boundaries", "Evidence boundaries"],
];

const articleHtml = String.raw`
<h2 id="meaning">ticksToDecay is the next decay pulse</h2>
<p><code>StructureContainer.ticksToDecay</code> does not report the Container's entire remaining lifetime. It reports how long remains before the next decay pulse. A full Container with one tick left will lose one decay amount, not disappear immediately.</p>
<p>The current public constants are <code>CONTAINER_HITS = 250000</code>, <code>CONTAINER_DECAY = 5000</code>, <code>CONTAINER_DECAY_TIME = 100</code>, and <code>CONTAINER_DECAY_TIME_OWNED = 500</code>. Private servers may change them, so production code should read globals instead of scattering copied numbers.</p>

<h2 id="estimate">Estimate remaining decay events</h2>
<pre><code class="language-js">const decayEventsUntilLoss = Math.ceil(
  container.hits / CONTAINER_DECAY
);

const interval = room.controller?.level &gt; 0
  ? CONTAINER_DECAY_TIME_OWNED
  : CONTAINER_DECAY_TIME;

const estimatedTicksUntilLoss =
  container.ticksToDecay
  + (decayEventsUntilLoss - 1) * interval;

const nextDecayFatal =
  container.hits &lt;= CONTAINER_DECAY;</code></pre>
<p>This estimate is recalculated from visible state. A change in room control, visibility, server constants, or live damage invalidates an old prediction.</p>

<h2 id="policy">Normalize maintenance policy</h2>
<p>Do not let a malformed ratio, negative safety margin, or <code>NaN</code> history limit enter deadline arithmetic. The complete Chinese manager validates <code>minimumHitsRatio</code>, <code>bufferDecayEvents</code>, <code>safetyTicks</code>, and <code>historyLimit</code> before using them.</p>
<pre><code class="language-js">const policy = {
  minimumHitsRatio:
    Number.isFinite(input.minimumHitsRatio)
    &amp;&amp; input.minimumHitsRatio &gt; 0
    &amp;&amp; input.minimumHitsRatio &lt;= 1
      ? input.minimumHitsRatio
      : 0.8,
  historyLimit:
    Number.isInteger(input.historyLimit)
    &amp;&amp; input.historyLimit &gt;= 1
      ? input.historyLimit
      : 20
};</code></pre>
<p>These defaults are local policy, not official recommendations.</p>

<h2 id="deadline">Subtract travel and safety time</h2>
<p>A Creep repairs within range 3. The useful deadline is therefore the next decay pulse minus estimated travel and a local safety buffer.</p>
<pre><code class="language-js">const deadlineSlack =
  container.ticksToDecay
  - travelTicks
  - policy.safetyTicks;</code></pre>
<p>Path length is still only a scheduling estimate. Fatigue, terrain, traffic, hostile units, Ramparts, and stale paths can make arrival slower.</p>

<h2 id="priority">Rank the most urgent Container</h2>
<p>Do not sort only by current hits. Prefer a Container whose next pulse is fatal, then the smallest deadline slack, the shortest estimated lifetime, lower hits, shorter travel, and finally a stable ID. Every actionable plan keeps the Container ID, and the stable tie-breaker prevents target churn.</p>
<p>The Chinese implementation also uses a policy target instead of repairing every damaged Container to full health. The target combines a configurable hits ratio with enough hits to survive several decay pulses.</p>

<h2 id="action">Submit one move or repair action</h2>
<p>Validate the repairer before choosing a target: it must exist, belong to the player, be fully spawned, have active WORK, and carry Energy. An unknown or non-finite range must not be treated as range 3. If the Creep is outside range 3, submit <code>moveTo()</code> with <code>range: 3</code>. If it is in range, preserve the exact <code>repair()</code> return value.</p>
<p>An <code>OK</code> result means the repair intent was accepted for the current tick. It does not prove that the Container is now safe or that its final hits must increase.</p>

<h2 id="evidence">Verify the exact repair event</h2>
<p>On the next tick, match <code>EVENT_REPAIR</code> by both actor and target identity:</p>
<pre><code class="language-js">const repairEvent = room.getEventLog().find(event =&gt;
  event.event === EVENT_REPAIR
  &amp;&amp; event.objectId === pending.repairerId
  &amp;&amp; event.data?.targetId === pending.containerId
);</code></pre>
<p>Net hits are supporting context. Decay, another repairer, a Tower, or incoming damage can offset the final number. A matched repair event with flat or falling hits is recorded as a repair event with a net offset, not as a fabricated failure.</p>

<h2 id="cost">Estimate WORK and Energy</h2>
<p>Without WORK boosts, each active WORK repairs <code>REPAIR_POWER</code> hits and spends repaired hits multiplied by <code>REPAIR_COST</code>. With current public constants, one normal WORK repairs 100 hits for 1 Energy per action.</p>
<pre><code class="language-js">const repairPower =
  activeWorkParts * REPAIR_POWER;
const actionsNeeded =
  Math.ceil(missingHits / repairPower);
const energyNeeded =
  Math.ceil(
    actionsNeeded
    * repairPower
    * REPAIR_COST
  );</code></pre>
<p>Boosted WORK changes output and Energy consumption. The baseline formula must not be presented as a complete boosted-body model.</p>

<h2 id="boundaries">Evidence boundaries</h2>
<p>Thirty-one offline cases passed: owned and neutral decay intervals, fatal next pulses, lifetime estimates, invalid constants and policy input, WORK and Energy guards, finite range checks, path decisions, actionable Container identity, deterministic target ranking, exact event identity, missed observation windows, missing targets, net offsets, and bounded history.</p>
<p>Real Console execution, official-shard decay and repair in the same settlement window, traffic, boosted WORK, hostile pressure, and multi-Creep task locking remain pending.</p>
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
      readingTime="15 min read"
      tags={["Resources", "Construction", "Debugging"]}
      verification={[
        { term: "Documentation", value: "Official Container, repair, constants, game-loop, and engine sources checked" },
        { term: "Syntax", value: "Complete Chinese manager and article code blocks checked" },
        { term: "Offline cases", value: "31 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
