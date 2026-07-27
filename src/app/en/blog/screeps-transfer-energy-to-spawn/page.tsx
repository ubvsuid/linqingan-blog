import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-transfer-energy-to-spawn";
const chinesePath = "/blog/screeps-creep-deliver-energy";
const title = "Screeps Energy Delivery: Creep to Spawn";
const headline = "How to Make a Screeps Creep Deliver Energy to a Spawn";
const description =
  "Make one Creep transfer Energy to a named Spawn, preserve delivery mode across ticks, and complete its first Source-to-Spawn round trip.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const modifiedAt = "2026-07-27";
const modifiedLabel = "July 27, 2026";
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
<p>This lesson has two connected results. First, a Creep that already carries Energy will move to a named Spawn and transfer its load. Then you will add one Memory state so the same worker can repeat the complete route:</p>
<p><strong>Source → Creep Store → Spawn → back to the Source.</strong></p>
<p><strong>Lesson boundary:</strong> this code controls one named Creep, the first visible Source, and one named Spawn. When the Spawn is full, the Creep waits. Extension priorities and multi-Creep room logistics belong in later lessons.</p>

<h2 id="requirements">What the worker needs</h2>
<p>Complete the previous <a href="/en/blog/screeps-creep-harvest-energy">Energy harvesting lesson</a> before adding delivery. The full round-trip worker uses:</p>
<div class="table-scroll"><table>
<thead><tr><th>Body part</th><th>Purpose in the round trip</th></tr></thead>
<tbody>
<tr><td><code>WORK</code></td><td>Harvests Energy from the Source.</td></tr>
<tr><td><code>CARRY</code></td><td>Creates Store capacity and allows the Creep to carry and transfer Energy.</td></tr>
<tr><td><code>MOVE</code></td><td>Moves between the Source and Spawn.</td></tr>
</tbody>
</table></div>
<p>The one-way transfer example itself does not use <code>WORK</code>, but the complete harvesting-and-delivery loop does.</p>

<h2 id="copy-names">Copy the real Creep and Spawn names</h2>
<p><strong>State impact:</strong> read-only. Run these commands in the Console:</p>
<pre><code>Object.keys(Game.creeps);
Object.keys(Game.spawns);</code></pre>
<p>The examples use <code>Harvester1</code> and <code>Spawn1</code>. Replace both values with exact names from your account. Names are case-sensitive.</p>
<p>Use this read-only inspection before changing the main loop:</p>
<pre><code>const creep = Game.creeps['Harvester1'];
const spawn = Game.spawns['Spawn1'];

console.log(JSON.stringify({
  creepFound: Boolean(creep),
  spawnFound: Boolean(spawn),
  spawning: creep ? creep.spawning : null,
  activeWork: creep ? creep.getActiveBodyparts(WORK) : null,
  activeCarry: creep ? creep.getActiveBodyparts(CARRY) : null,
  activeMove: creep ? creep.getActiveBodyparts(MOVE) : null,
  carriedEnergy: creep
    ? creep.store.getUsedCapacity(RESOURCE_ENERGY)
    : null,
  spawnFreeEnergy: spawn
    ? spawn.store.getFreeCapacity(RESOURCE_ENERGY)
    : null,
  range: creep && spawn
    ? creep.pos.getRangeTo(spawn)
    : null
}));</code></pre>
<p>Continue after confirming that both objects exist, the Creep has finished spawning, and the required body parts are active.</p>

<h2 id="minimal-transfer">Verify one delivery with minimal code</h2>
<p><strong>State impact:</strong> this script may move one Creep and transfer its carried Energy into the named Spawn. Start with a Creep that already carries Energy.</p>
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
<p>The direction is <strong>Creep → Spawn</strong>. <code>transfer()</code> does not take Energy out of the Spawn. That opposite direction uses <code>withdraw()</code>.</p>
<p>The action rule matches the harvesting lesson:</p>
<p><strong>try the work action → move only when it returns <code>ERR_NOT_IN_RANGE</code> → retry on a later tick.</strong></p>

<h2 id="delivery-state">Keep delivery mode until the Creep is empty</h2>
<p>A rule based only on free capacity is not enough. After a partial unload, the Creep has free capacity again and could turn back toward the Source while still carrying Energy.</p>
<p>Store one boolean decision in <code>creep.memory.delivering</code>:</p>
<pre><code>const usedEnergy =
  creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;

const freeEnergyCapacity =
  creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

if (usedEnergy === 0) {
  creep.memory.delivering = false;
} else if (freeEnergyCapacity === 0) {
  creep.memory.delivering = true;
}</code></pre>
<p>These boundaries produce three useful states:</p>
<ul>
<li>empty Store → harvest;</li>
<li>full Store → deliver;</li>
<li>partially full Store → preserve the previous mode.</li>
</ul>
<p>That final rule is the important one. A worker that has started delivering remains in delivery mode until its Store reaches zero.</p>

<h2 id="complete-loop">Run the complete harvesting-and-delivery loop</h2>
<p>The following version checks both named objects, preserves the delivery state, waits when the Spawn has no free Energy capacity, and records temporary evidence every five ticks.</p>
<p><strong>State impact:</strong> it calls <code>harvest()</code>, <code>transfer()</code>, and <code>moveTo()</code>, and writes <code>creep.memory.delivering</code>. Replace both example names before saving it.</p>
<pre><code>const CREEP_NAME = 'Harvester1';
const SPAWN_NAME = 'Spawn1';
const DEBUG_ENERGY_LOOP = true;

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];
  const spawn = Game.spawns[SPAWN_NAME];

  if (!creep) {
    console.log(
      CREEP_NAME +
      ' was not found. Check the name and capitalization.'
    );
    return;
  }

  if (!spawn) {
    console.log(
      SPAWN_NAME +
      ' was not found. Check the name and capitalization.'
    );
    return;
  }

  if (creep.spawning) return;

  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;

  const freeEnergyCapacity =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

  if (usedEnergy === 0) {
    creep.memory.delivering = false;
  } else if (freeEnergyCapacity === 0) {
    creep.memory.delivering = true;
  }

  let action = 'harvest';
  let actionResult = null;
  let moveResult = null;
  let target = null;
  let status = 'running';

  if (creep.memory.delivering) {
    action = 'transfer';
    target = spawn;

    const spawnFreeEnergy =
      spawn.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

    if (spawnFreeEnergy &lt;= 0) {
      status = 'waiting-for-spawn-capacity';
    } else {
      const amount = Math.min(usedEnergy, spawnFreeEnergy);

      actionResult = creep.transfer(
        spawn,
        RESOURCE_ENERGY,
        amount
      );

      if (actionResult === ERR_NOT_IN_RANGE) {
        moveResult = creep.moveTo(spawn, { reusePath: 5 });
      }
    }
  } else {
    const source = creep.room.find(FIND_SOURCES)[0];

    if (!source) {
      console.log(
        'No visible Source was found in ' +
        creep.room.name +
        '.'
      );
      return;
    }

    target = source;
    actionResult = creep.harvest(source);

    if (actionResult === ERR_NOT_IN_RANGE) {
      moveResult = creep.moveTo(source, { reusePath: 5 });
    }
  }

  if (DEBUG_ENERGY_LOOP && Game.time % 5 === 0) {
    console.log(JSON.stringify({
      tick: Game.time,
      creep: CREEP_NAME,
      mode: creep.memory.delivering
        ? 'deliver'
        : 'harvest',
      action: action,
      status: status,
      actionResult: actionResult,
      moveResult: moveResult,
      range: target
        ? creep.pos.getRangeTo(target)
        : null,
      carriedEnergy: usedEnergy,
      spawnFreeEnergy:
        spawn.store.getFreeCapacity(RESOURCE_ENERGY)
    }));
  }

  if (
    actionResult !== null &&
    actionResult !== OK &&
    actionResult !== ERR_NOT_IN_RANGE &&
    actionResult !== ERR_FULL &&
    actionResult !== ERR_NOT_ENOUGH_RESOURCES
  ) {
    console.log(
      CREEP_NAME +
      ' ' +
      action +
      ' returned ' +
      actionResult +
      '.'
    );
  }

  if (
    moveResult !== null &&
    moveResult !== OK &&
    moveResult !== ERR_TIRED
  ) {
    console.log(
      CREEP_NAME +
      ' moveTo() returned ' +
      moveResult +
      '.'
    );
  }
};</code></pre>
<p>The explicit <code>amount</code> is the smaller of the Creep's carried Energy and the Spawn's free Energy capacity. This makes a partial unload visible instead of hiding it inside the action call.</p>

<h2 id="tick-cycle">What the round trip looks like across ticks</h2>
<p>The exact route and tick numbers depend on the room. The expected state sequence is:</p>
<div class="table-scroll"><table>
<thead><tr><th>Start-of-tick state</th><th>Mode</th><th>Expected result</th></tr></thead>
<tbody>
<tr><td>The Creep is not full.</td><td>Harvest</td><td>It approaches the Source and collects Energy.</td></tr>
<tr><td>The Store becomes full.</td><td>Deliver</td><td><code>creep.memory.delivering</code> becomes <code>true</code>.</td></tr>
<tr><td>The Spawn is out of range.</td><td>Deliver</td><td><code>transfer()</code> returns <code>ERR_NOT_IN_RANGE</code> and movement is scheduled.</td></tr>
<tr><td>The Creep is beside the Spawn.</td><td>Deliver</td><td><code>transfer()</code> returns <code>OK</code>; verify the Store on a later tick.</td></tr>
<tr><td>Some Energy remains after unloading.</td><td>Deliver</td><td>The previous delivery state is preserved.</td></tr>
<tr><td>The Creep begins a tick with zero Energy.</td><td>Harvest</td><td>The state switches to <code>false</code> and the Creep returns to the Source.</td></tr>
</tbody>
</table></div>
<p>The values read near the start of the loop describe the current tick's state. An action returning <code>OK</code> is scheduled successfully, but the resulting Store change should be verified on a later tick.</p>

<h2 id="common-results">Four transfer results to understand first</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return code</th><th>Beginner meaning</th><th>Response in this lesson</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The transfer was scheduled.</td><td>Inspect both Stores on a later tick.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent to the Spawn.</td><td>Call <code>moveTo(spawn)</code>.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The target cannot receive more of the resource.</td><td>Check the Spawn's free Energy capacity.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep does not carry the requested amount.</td><td>Re-read its Store and transfer amount.</td></tr>
</tbody>
</table></div>
<p>Use the <a href="/en/screeps-errors">English return-code reference</a> when another result appears. For example, <code>ERR_INVALID_TARGET</code> means the selected object cannot receive that resource.</p>

<h2 id="common-problems">Fix the three most common problems</h2>
<h3>The Creep or Spawn is not found</h3>
<p>Run <code>Object.keys(Game.creeps)</code> and <code>Object.keys(Game.spawns)</code> again. Replace both tutorial names exactly, including capitalization.</p>

<h3>The full Creep never leaves the Source</h3>
<p>Log <code>usedEnergy</code>, <code>freeEnergyCapacity</code>, and <code>creep.memory.delivering</code>. The state should become <code>true</code> only when free Energy capacity reaches zero.</p>

<h3>The Creep waits near the Spawn or returns too early</h3>
<p>First inspect the Spawn's free capacity and <code>actionResult</code>. A full Spawn is a capacity condition, not necessarily a movement failure. When the Spawn accepts only part of the load, do not overwrite delivery mode merely because the Creep has free capacity again.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can do all of the following:</p>
<ul>
<li>replace both example names with real objects;</li>
<li>explain why <code>transfer()</code> moves Energy from the Creep to the Spawn;</li>
<li>observe <code>ERR_NOT_IN_RANGE</code> while the Creep approaches the Spawn;</li>
<li>observe <code>OK</code> when the transfer can be scheduled;</li>
<li>explain why the delivery state is preserved while the Store is partially full;</li>
<li>confirm that carried Energy falls and Spawn Energy rises on later ticks;</li>
<li>observe the worker return to harvesting only after it becomes empty.</li>
</ul>

<h2 id="next-lesson">Continue to Creep body parts</h2>
<p>Your first worker can now complete a basic Energy round trip. The next lesson explains why missing or damaged body parts can stop harvesting, carrying, or movement.</p>
<p><a href="/en/blog/screeps-creep-body-parts">Understand WORK, CARRY, and MOVE →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review the complete twelve-lesson sequence.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.spawns" rel="nofollow noopener noreferrer">Screeps API: Game.spawns</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.transfer" rel="nofollow noopener noreferrer">Screeps API: Creep.transfer()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getFreeCapacity()</a></li>
<li><a href="https://docs.screeps.com/api/#Store.getUsedCapacity" rel="nofollow noopener noreferrer">Screeps API: Store.getUsedCapacity()</a></li>
<li><a href="https://docs.screeps.com/global-objects.html" rel="nofollow noopener noreferrer">Screeps Documentation: Game and Memory across ticks</a></li>
</ul>
`;

const toc: Array<[string, string]> = [
  ["Lesson goal", "lesson-goal"],
  ["Worker requirements", "requirements"],
  ["Copy real names", "copy-names"],
  ["Minimal transfer code", "minimal-transfer"],
  ["Delivery state", "delivery-state"],
  ["Complete Energy loop", "complete-loop"],
  ["Expected tick cycle", "tick-cycle"],
  ["Common return codes", "common-results"],
  ["Three common problems", "common-problems"],
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
      readingTime="10 min read"
      tags={["Creeps", "Energy", "Spawn"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked" },
        { term: "API and constants", value: "Checked" },
        { term: "JavaScript syntax", value: "Checked" },
        { term: "Offline state logic", value: "Passed" },
        { term: "Screeps Console", value: "Pending — replace both example names with live objects" },
        { term: "Live multi-tick test", value: "Pending — no live round-trip result is claimed" },
        { term: "Last verified", value: modifiedLabel },
        { term: "Publication status", value: "Ready" },
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
