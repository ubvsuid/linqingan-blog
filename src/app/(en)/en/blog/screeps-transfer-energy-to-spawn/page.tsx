import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-transfer-energy-to-spawn";
const chinesePath = "/blog/screeps-creep-deliver-energy";
const title = "Screeps Energy Delivery: Creep to Spawn";
const headline = "How to Make a Screeps Creep Deliver Energy to a Spawn";
const description =
  "Make one Creep transfer Energy to a named Spawn, keep delivery mode until it is empty, and connect harvesting and delivery into a first repeatable round trip.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const modifiedAt = "2026-08-29";
const modifiedLabel = "August 29, 2026";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps transfer Energy to Spawn",
    "Creep.transfer()",
    "creep.memory.delivering",
    "Game.spawns",
    "RESOURCE_ENERGY",
    "Screeps Energy loop",
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
    title: `${title} | Linqingan`,
    description,
    publishedTime: publishedAt,
    modifiedTime: modifiedAt,
    tags: ["Creeps", "Energy", "Spawn"],
    images: [{ url: `${siteConfig.url}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Linqingan`,
    description,
    images: [`${siteConfig.url}/opengraph-image`],
  },
};

const articleHtml = `
<h2 id="lesson-goal">What you will complete in this lesson</h2>
<p>Start with one Creep that already carries Energy. You will make it walk to a named Spawn, transfer its Energy, and then connect that delivery step to the harvesting loop from the previous lesson.</p>
<p><strong>Finished loop:</strong> Source → Creep Store → Spawn → back to the Source.</p>
<p>This lesson controls one named Creep, the first active Source it can find, and one named Spawn. Extension priorities and multi-Creep logistics come later.</p>

<h2 id="before-you-run">Before you run the delivery code</h2>
<p>Complete the previous <a href="/en/blog/screeps-creep-harvest-energy">Energy harvesting lesson</a> first. For the one-way delivery test, the Creep needs <code>CARRY</code> and <code>MOVE</code>, must have finished spawning, and must already carry some Energy. The complete round trip also needs an active <code>WORK</code> part so the Creep can harvest again after delivery.</p>
<p>Find your real object names in the Console:</p>
<pre><code>Object.keys(Game.creeps);
Object.keys(Game.spawns);</code></pre>
<p>The examples below use <code>Harvester1</code> and <code>Spawn1</code>. Replace both names exactly; Screeps names are case-sensitive.</p>

<h2 id="minimal-transfer">Make one Creep deliver Energy</h2>
<p>This is the smallest useful delivery loop. It tries <code>transfer()</code> first and only moves when the Spawn is out of range:</p>
<pre><code>const CREEP_NAME = 'Harvester1';
const SPAWN_NAME = 'Spawn1';

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];
  const spawn = Game.spawns[SPAWN_NAME];

  if (!creep || !spawn || creep.spawning) return;

  const transferResult = creep.transfer(
    spawn,
    RESOURCE_ENERGY
  );

  if (transferResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
  }
};</code></pre>
<p><code>transfer()</code> moves resources from the Creep to the target. The Spawn must be adjacent to the Creep, so <code>ERR_NOT_IN_RANGE</code> means “move closer and retry on a later tick.”</p>
<p>If the call returns <code>OK</code>, the transfer was scheduled successfully. When you need to confirm the processed result, inspect the Creep and Spawn Stores on a later tick.</p>

<h2 id="delivery-state">Keep delivery mode until the Creep is empty</h2>
<p>A repeating worker needs to remember whether it is currently harvesting or delivering. If you switch direction whenever the Creep merely has some free capacity, a partial unload can make it leave the Spawn while it still carries Energy.</p>
<p>Use one boolean in Creep Memory:</p>
<pre><code>const usedEnergy =
  creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;

const freeEnergyCapacity =
  creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

if (usedEnergy === 0) {
  creep.memory.delivering = false;
} else if (freeEnergyCapacity === 0) {
  creep.memory.delivering = true;
}</code></pre>
<p>The rule is:</p>
<ul>
<li>empty Store → harvest;</li>
<li>full Store → deliver;</li>
<li>partially full Store → keep the previous mode.</li>
</ul>
<p>Once delivery starts, the Creep stays in delivery mode until its Energy reaches zero.</p>

<h2 id="complete-loop">Run the first complete Energy round trip</h2>
<p>The following beginner version combines the harvest and delivery phases. It waits when the Spawn has no free Energy capacity instead of abandoning delivery mode.</p>
<p><strong>State impact:</strong> it calls <code>harvest()</code>, <code>transfer()</code>, and <code>moveTo()</code>, and writes <code>creep.memory.delivering</code>.</p>
<pre><code>const CREEP_NAME = 'Harvester1';
const SPAWN_NAME = 'Spawn1';

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];
  const spawn = Game.spawns[SPAWN_NAME];

  if (!creep || !spawn || creep.spawning) return;

  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;
  const freeEnergy =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

  if (usedEnergy === 0) {
    creep.memory.delivering = false;
  } else if (freeEnergy === 0) {
    creep.memory.delivering = true;
  }

  if (creep.memory.delivering) {
    const spawnFreeEnergy =
      spawn.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

    if (spawnFreeEnergy === 0) return;

    const transferResult = creep.transfer(
      spawn,
      RESOURCE_ENERGY
    );

    if (transferResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn, { reusePath: 5 });
    }

    return;
  }

  const source =
    creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

  if (!source) return;

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(source, { reusePath: 5 });
  }
};</code></pre>
<p>This loop deliberately uses the simplest beginner phase boundary: harvest until the Energy Store is full, then deliver until it is empty. The previous harvesting lesson explains the optional larger-body capacity guard for workers whose next Source harvest batch may be larger than their remaining Store space.</p>

<h2 id="tick-cycle">What the round trip looks like across ticks</h2>
<div class="table-scroll"><table>
<thead><tr><th>Start-of-tick state</th><th>Mode</th><th>What the code does</th></tr></thead>
<tbody>
<tr><td>The Creep has free Energy capacity.</td><td>Harvest</td><td>Find an active Source, harvest when adjacent, or move toward it.</td></tr>
<tr><td>The Creep starts a tick with no free Energy capacity.</td><td>Deliver</td><td>Set <code>creep.memory.delivering = true</code>.</td></tr>
<tr><td>The Spawn is out of range.</td><td>Deliver</td><td><code>transfer()</code> returns <code>ERR_NOT_IN_RANGE</code>, then the Creep moves toward the Spawn.</td></tr>
<tr><td>The Creep is beside a Spawn with free Energy capacity.</td><td>Deliver</td><td><code>transfer()</code> can return <code>OK</code>; verify the Store change later if needed.</td></tr>
<tr><td>The Spawn is full.</td><td>Deliver</td><td>The Creep waits and keeps its delivery state.</td></tr>
<tr><td>The Creep starts a tick with zero Energy.</td><td>Harvest</td><td>Set <code>delivering = false</code> and return to a Source.</td></tr>
</tbody>
</table></div>

<h2 id="common-results">Four transfer results to understand first</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return code</th><th>What it means</th><th>What to do</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The transfer was scheduled successfully.</td><td>Continue the loop; inspect later Store state when you need proof of the processed result.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Spawn is too far away.</td><td>Move toward the Spawn and retry on a later tick.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The target cannot receive more of that resource.</td><td>Check <code>spawn.store.getFreeCapacity(RESOURCE_ENERGY)</code>.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep does not have the requested resource amount.</td><td>Re-read the Creep Store before retrying.</td></tr>
</tbody>
</table></div>
<p>If another code appears, use the <a href="/en/screeps-errors">English Screeps return-code reference</a> and keep the exact result instead of replacing it with a generic success/failure boolean.</p>

<h2 id="verification">Confirm that delivery actually happened</h2>
<p>The value returned by <code>transfer()</code> describes the current action request. <code>OK</code> means the operation was scheduled successfully; it is not a same-line receipt for the later processed Store values.</p>
<p>For this lesson, the practical check is simple: after a successful delivery tick, inspect a later tick and confirm that the Creep carries less Energy and the Spawn stores more Energy. Other Creeps can change the Spawn at the same time, so those Store values prove the observed state change, not unique causality.</p>

<h2 id="common-problems">Fix the common beginner problems</h2>
<h3>The Creep or Spawn is not found</h3>
<p>Run <code>Object.keys(Game.creeps)</code> and <code>Object.keys(Game.spawns)</code> again. Replace both example names exactly, including capitalization.</p>

<h3>The Creep waits beside the Spawn</h3>
<p>Check <code>spawn.store.getFreeCapacity(RESOURCE_ENERGY)</code>. If it is zero, the Spawn is full; the worker should stay in delivery mode and wait rather than treating this as a movement failure.</p>

<h3>The Creep turns back to the Source too early</h3>
<p>Do not set <code>delivering = false</code> merely because the Creep has free capacity after a partial unload. Switch back to harvesting only when <code>usedEnergy === 0</code>.</p>

<h3>A larger worker reaches the Source with only a little free capacity</h3>
<p>Keep this delivery lesson simple and apply the <a href="/en/blog/screeps-creep-harvest-energy">larger-body capacity hardening from the harvesting lesson</a>. That Source-specific boundary belongs to the acquisition phase rather than the delivery phase.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can:</p>
<ul>
<li>replace the example Creep and Spawn names with real objects;</li>
<li>explain that <code>transfer()</code> moves Energy from the Creep to the Spawn;</li>
<li>handle <code>ERR_NOT_IN_RANGE</code> by moving toward the Spawn;</li>
<li>recognize <code>OK</code> as a scheduled action rather than same-line proof of the processed amount;</li>
<li>keep <code>creep.memory.delivering</code> true while the Creep still carries Energy;</li>
<li>confirm a later decrease in Creep Energy and increase in Spawn Energy;</li>
<li>watch the worker return to harvesting only after it becomes empty.</li>
</ul>

<h2 id="next-lesson">Continue to Creep body parts</h2>
<p>Your first worker can now complete a basic Energy round trip. The next lesson explains why missing or damaged body parts can stop harvesting, carrying, or movement.</p>
<p><a href="/en/blog/screeps-creep-body-parts">Understand WORK, CARRY, and MOVE →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review the complete twelve-lesson sequence.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.spawns" rel="nofollow noopener noreferrer">Screeps API: Game.spawns</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.transfer" rel="nofollow noopener noreferrer">Screeps API: Creep.transfer()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getFreeCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getUsedCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getUsedCapacity()</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Screeps Documentation: Game and Memory across ticks</a></li>
</ul>
`;

const toc: Array<[string, string]> = [
  ["Lesson goal", "lesson-goal"],
  ["Before you run", "before-you-run"],
  ["Minimal transfer", "minimal-transfer"],
  ["Delivery state", "delivery-state"],
  ["Complete Energy loop", "complete-loop"],
  ["Expected tick cycle", "tick-cycle"],
  ["Common return codes", "common-results"],
  ["Verify delivery", "verification"],
  ["Common problems", "common-problems"],
  ["Completion check", "completion-check"],
  ["Next lesson", "next-lesson"],
  ["Official sources", "official-sources"],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    inLanguage: "en-US",
    mainEntityOfPage: articleUrl,
    author: { "@type": "Person", name: "Linqingan", url: `${siteConfig.url}/en/about` },
    publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
    isBasedOn: `${siteConfig.url}${chinesePath}`,
    about: ["Creeps", "Energy", "Spawn"],
    articleSection: "Getting Started",
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

export default function TransferEnergyPage() {
  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Deliver Energy"
      category="GETTING STARTED · BEGINNER LESSON 5 OF 12"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedAt}
      readingTime="9 min read"
      tags={["Creeps", "Energy", "Spawn"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked August 29, 2026 — Game.spawns, Creep.transfer(), Store capacity methods, and scheduled-action semantics" },
        { term: "Static code review", value: "Passed — minimal transfer and complete round-trip examples preserve delivery mode, wait on full Spawn capacity, and handle transfer range separately" },
        { term: "JavaScript syntax", value: "Passed — all executable JavaScript blocks checked offline" },
        { term: "Source-capacity boundary", value: "The larger-body Source-harvest hardening is intentionally delegated to the previous harvesting lesson instead of duplicated here" },
        { term: "Screeps Console test", value: "Pending — no live transfer transcript is claimed" },
        { term: "Live round-trip test", value: "Pending — no real-shard multi-tick delivery trace is claimed" },
        { term: "Last editorial review", value: modifiedLabel },
        { term: "Publication status", value: "Published" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
      previous={{
        href: "/en/blog/screeps-creep-harvest-energy",
        label: "Previous beginner lesson",
        title: "Harvest Energy with the First Creep",
      }}
      next={{
        href: "/en/blog/screeps-creep-body-parts",
        label: "Next beginner lesson",
        title: "Understand WORK, CARRY, and MOVE",
      }}
    />
  );
}
