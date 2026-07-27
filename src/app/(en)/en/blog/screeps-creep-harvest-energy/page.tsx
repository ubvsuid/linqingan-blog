import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-creep-harvest-energy";
const chinesePath = "/blog/screeps-first-creep-harvest";
const title = "Screeps Harvest Energy: Your First Creep Script";
const headline = "How to Make Your First Screeps Creep Harvest Energy";
const description =
  "Make one named Screeps Creep find a Source, move into range, and harvest Energy with a small script you can verify across later ticks.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const modifiedAt = "2026-07-27";
const modifiedLabel = "July 27, 2026";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps harvest Energy",
    "Creep.harvest()",
    "FIND_SOURCES",
    "ERR_NOT_IN_RANGE",
    "Creep.moveTo()",
    "Screeps beginner code",
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
    tags: ["Creeps", "Energy", "Movement"],
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
<p>This lesson has one practical goal: after you save the code, one existing Creep should move toward a visible Source and begin collecting Energy.</p>
<p>You will use the tick model from the previous lesson: find the current Creep, choose one action, let the game advance, and read the new state on a later tick.</p>
<p><strong>Lesson boundary:</strong> the Creep stops when its Store is full. Returning Energy to a Spawn is the next lesson.</p>

<h2 id="requirements">What your Creep needs</h2>
<p>Use one existing Creep with a real name from your account. The basic worker pattern in this lesson uses three body parts:</p>
<div class="table-scroll"><table>
<thead><tr><th>Body part</th><th>Purpose here</th></tr></thead>
<tbody>
<tr><td><code>WORK</code></td><td>Required for <code>harvest()</code>.</td></tr>
<tr><td><code>MOVE</code></td><td>Lets the Creep travel toward the Source.</td></tr>
<tr><td><code>CARRY</code></td><td>Provides Store capacity so the harvested Energy can be retained and delivered later.</td></tr>
</tbody>
</table></div>
<p>The API requires <code>WORK</code> for harvesting. A specialized Creep can harvest without free carrying capacity, but the resource may be dropped on the ground instead of entering its Store. This first worker lesson deliberately uses <code>CARRY</code>.</p>
<p>The <a href="/en/blog/screeps-creep-body-parts">WORK, CARRY, and MOVE guide</a> explains these abilities in more detail.</p>

<h2 id="find-name">Copy the real Creep name</h2>
<p><strong>State impact:</strong> read-only. Run this in the Console:</p>
<pre><code>Object.keys(Game.creeps);</code></pre>
<p>Copy one exact name from the returned array. Names are case-sensitive. The examples below use <code>Harvester1</code>, but that value must be replaced when your Creep has another name.</p>
<p>You can also inspect the selected Creep before changing the main loop:</p>
<pre><code>const creep = Game.creeps['Harvester1'];

console.log(JSON.stringify({
  found: Boolean(creep),
  spawning: creep ? creep.spawning : null,
  activeWork: creep ? creep.getActiveBodyparts(WORK) : null,
  activeMove: creep ? creep.getActiveBodyparts(MOVE) : null,
  freeEnergyCapacity: creep
    ? creep.store.getFreeCapacity(RESOURCE_ENERGY)
    : null
}));</code></pre>
<p>Continue after confirming that the Creep exists, has finished spawning, and has at least one active <code>WORK</code> part. It also needs an active <code>MOVE</code> part when it is not already beside a Source.</p>

<h2 id="minimal-code">Start with the minimal working code</h2>
<p><strong>State impact:</strong> this script may move one Creep and harvest a Source. Replace the example name before saving it.</p>
<pre><code>const CREEP_NAME = 'Harvester1';

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];
  if (!creep || creep.spawning) return;

  const source = creep.room.find(FIND_SOURCES)[0];
  if (!source) return;

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  }
};</code></pre>
<p>The script follows one rule:</p>
<p><strong>try to harvest → move only when the Source is out of range → try again on the next tick.</strong></p>
<p><code>Room.find(FIND_SOURCES)</code> returns an array. This first lesson uses the first Source in that array; it does not claim that the Source is the nearest or most efficient choice.</p>

<h2 id="guarded-code">Use the guarded version while learning</h2>
<p>The minimal version is easy to read, but it hides useful evidence. The following version keeps the same behavior while checking the Creep, body parts, Source, action result, and movement result.</p>
<p><strong>State impact:</strong> it may move and harvest with one named Creep. The temporary status log runs once every five ticks and should be removed after verification.</p>
<pre><code>const CREEP_NAME = 'Harvester1';
const DEBUG_HARVEST = true;

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep) {
    console.log(
      CREEP_NAME +
      ' was not found. Check the name and capitalization.'
    );
    return;
  }

  if (creep.spawning) return;

  if (creep.getActiveBodyparts(WORK) === 0) {
    console.log(CREEP_NAME + ' has no active WORK part.');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];

  if (!source) {
    console.log(
      'No visible Source was found in ' +
      creep.room.name +
      '.'
    );
    return;
  }

  const harvestResult = creep.harvest(source);
  let moveResult = null;

  if (harvestResult === ERR_NOT_IN_RANGE) {
    if (creep.getActiveBodyparts(MOVE) === 0) {
      console.log(CREEP_NAME + ' has no active MOVE part.');
      return;
    }

    moveResult = creep.moveTo(source, { reusePath: 5 });
  }

  if (DEBUG_HARVEST && Game.time % 5 === 0) {
    console.log(JSON.stringify({
      tick: Game.time,
      creep: CREEP_NAME,
      range: creep.pos.getRangeTo(source),
      harvestResult: harvestResult,
      moveResult: moveResult,
      energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
      capacity: creep.store.getCapacity(RESOURCE_ENERGY)
    }));
  }

  if (
    harvestResult !== OK &&
    harvestResult !== ERR_NOT_IN_RANGE &&
    harvestResult !== ERR_FULL &&
    harvestResult !== ERR_NOT_ENOUGH_RESOURCES
  ) {
    console.log(
      CREEP_NAME +
      ' harvest() returned ' +
      harvestResult +
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
      ' moveTo(Source) returned ' +
      moveResult +
      '.'
    );
  }
};</code></pre>
<p>The script deliberately calls <code>harvest()</code> before movement. That preserves the real reason for the decision: movement happens only when the work action reports <code>ERR_NOT_IN_RANGE</code>.</p>

<h2 id="tick-results">What you should see across later ticks</h2>
<p>The exact tick numbers, route, and Energy values depend on your room. The expected state sequence is:</p>
<div class="table-scroll"><table>
<thead><tr><th>Observed state</th><th><code>harvestResult</code></th><th><code>moveResult</code></th><th>Meaning</th></tr></thead>
<tbody>
<tr><td>The Creep is several squares away.</td><td><code>ERR_NOT_IN_RANGE</code></td><td>Usually <code>OK</code></td><td>Movement was scheduled for this tick.</td></tr>
<tr><td>The Creep is approaching the Source.</td><td><code>ERR_NOT_IN_RANGE</code></td><td><code>OK</code> or a temporary movement result</td><td>The loop will try again after the game advances.</td></tr>
<tr><td>The Creep is adjacent to the Source.</td><td><code>OK</code></td><td><code>null</code></td><td>Harvesting was scheduled; the same-tick Store reading may still show the previous state.</td></tr>
<tr><td>A later tick begins.</td><td><code>OK</code> while capacity remains</td><td><code>null</code></td><td>The Creep's stored Energy should be higher than before.</td></tr>
<tr><td>The worker Store is full.</td><td><code>ERR_FULL</code></td><td><code>null</code></td><td>This lesson is complete and the delivery step is now required.</td></tr>
</tbody>
</table></div>
<p><code>OK</code> means the command was scheduled successfully. Verify the result by reading position and Store values on later ticks rather than expecting the same script execution to contain the future state.</p>

<h2 id="common-results">Four results to understand first</h2>
<div class="table-scroll"><table>
<thead><tr><th>Return code</th><th>Beginner meaning</th><th>Response in this lesson</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The harvest command was scheduled.</td><td>Inspect a later tick.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent to the Source.</td><td>Call <code>moveTo(source)</code>.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Source currently has no harvestable Energy.</td><td>Wait nearby for regeneration.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The worker cannot receive more Energy.</td><td>Continue to the delivery lesson.</td></tr>
</tbody>
</table></div>
<p>When another result appears, preserve the number and use the <a href="/en/screeps-errors">English return-code reference</a>. For example, <code>ERR_NO_BODYPART</code> means that no active <code>WORK</code> part is available for harvesting.</p>

<h2 id="common-problems">Fix the three most common problems</h2>
<h3>The script says the Creep was not found</h3>
<p>Run <code>Object.keys(Game.creeps)</code> again and copy the exact name. Do not assume that the tutorial name exists in your account.</p>

<h3>The Creep reaches the Source but Energy does not increase</h3>
<p>Inspect <code>harvestResult</code>, <code>creep.getActiveBodyparts(WORK)</code>, and the Source's current Energy. A missing active <code>WORK</code> part and an empty Source are different conditions.</p>

<h3>The Creep does not approach the Source</h3>
<p>Inspect <code>moveResult</code> and confirm that the Creep has an active <code>MOVE</code> part. Movement, fatigue, traffic, and pathfinding problems belong to the <a href="/en/blog/screeps-moveto-not-moving">Creep movement debugging guide</a>, not to the harvesting action itself.</p>

<h2 id="completion-check">Completion check</h2>
<p>You have completed this lesson when you can do all of the following:</p>
<ul>
<li>replace <code>Harvester1</code> with a real Creep name;</li>
<li>explain why the script checks the Creep and Source before using them;</li>
<li>explain why <code>harvest()</code> is called before <code>moveTo()</code>;</li>
<li>observe <code>ERR_NOT_IN_RANGE</code> while the Creep approaches;</li>
<li>observe <code>OK</code> when harvesting can be scheduled;</li>
<li>confirm that stored Energy increases on later ticks;</li>
<li>recognize a full Store as the boundary of this lesson.</li>
</ul>

<h2 id="next-lesson">Continue to Energy delivery</h2>
<p>Your Creep can now collect Energy, but the current script gives it no destination after the Store becomes full.</p>
<p><a href="/en/blog/screeps-transfer-energy-to-spawn">Make the Creep deliver Energy to a Spawn →</a></p>
<p>Return to the <a href="/en/beginner">English beginner roadmap</a> to review the complete twelve-lesson sequence.</p>

<h2 id="official-sources">Official sources</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow noopener noreferrer">Screeps API: Game.creeps</a></li>
<li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow noopener noreferrer">Screeps API: Room.find()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow noopener noreferrer">Screeps API: Creep.harvest()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow noopener noreferrer">Screeps API: Creep.moveTo()</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow noopener noreferrer">Screeps Documentation: game loop, time, and ticks</a></li>
</ul>
`;

const toc: Array<[string, string]> = [
  ["Lesson goal", "lesson-goal"],
  ["Creep requirements", "requirements"],
  ["Copy the Creep name", "find-name"],
  ["Minimal working code", "minimal-code"],
  ["Guarded code", "guarded-code"],
  ["Expected tick results", "tick-results"],
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
    about: ["Creeps", "Energy", "Movement"],
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

export default function HarvestEnergyPage() {
  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Harvest Energy"
      category="GETTING STARTED · BEGINNER LESSON 4 OF 12"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="9 min read"
      tags={["Creeps", "Energy", "Movement"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked" },
        { term: "API and constants", value: "Checked" },
        { term: "JavaScript syntax", value: "Checked" },
        { term: "Offline logic review", value: "Passed" },
        { term: "Screeps Console", value: "Pending — replace the example name with a live Creep" },
        { term: "Live multi-tick test", value: "Pending — no live Store increase is claimed" },
        { term: "Last verified", value: modifiedLabel },
        { term: "Publication status", value: "Ready" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
      previous={{
        href: "/en/blog/screeps-tick-game-loop",
        label: "Previous beginner lesson",
        title: "Understand Ticks and the Game Loop",
      }}
      next={{
        href: "/en/blog/screeps-transfer-energy-to-spawn",
        label: "Next beginner lesson",
        title: "Deliver Energy to a Spawn",
      }}
    />
  );
}
