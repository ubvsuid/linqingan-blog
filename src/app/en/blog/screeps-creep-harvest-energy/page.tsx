import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-creep-harvest-energy";
const chinesePath = "/blog/screeps-first-creep-harvest";
const title = "Screeps harvest(): Make Your First Creep Mine Energy";
const headline = "How to Make Your First Screeps Creep Harvest Energy";
const description =
  "Find a named Screeps Creep and Source, call harvest(), move only when range is insufficient, and inspect action results across ticks.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps Creep harvest Energy",
    "Creep.harvest()",
    "FIND_SOURCES",
    "ERR_NOT_IN_RANGE",
    "Creep.moveTo()",
  ],
  alternates: {
    canonical: path,
    languages: { en: path, "zh-CN": chinesePath, "x-default": path },
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
    modifiedTime: publishedAt,
    tags: ["Screeps", "Creep", "Harvesting", "JavaScript", "Beginner"],
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
  <h2 id="quick-answer">Quick answer</h2>
  <p>Find your Creep in <code>Game.creeps</code>, find a visible Source with <code>creep.room.find(FIND_SOURCES)</code>, and call <code>creep.harvest(source)</code>. When the result is <code>ERR_NOT_IN_RANGE</code>, call <code>creep.moveTo(source)</code>. The loop repeats on later ticks until the Creep reaches the Source and starts collecting Energy.</p>
  <p>This tutorial deliberately stops after harvesting. Returning the Energy to a Spawn is the next lesson.</p>

  <h2 id="prerequisites">What you need before starting</h2>
  <p>Use one existing Creep with these active body parts:</p>
  <div class="table-scroll"><table>
    <thead><tr><th>Part</th><th>Purpose in this tutorial</th></tr></thead>
    <tbody>
      <tr><td><code>WORK</code></td><td>Required for <code>harvest()</code>.</td></tr>
      <tr><td><code>CARRY</code></td><td>Provides Store capacity so the Creep can retain and transport the Energy.</td></tr>
      <tr><td><code>MOVE</code></td><td>Lets the Creep move toward the Source.</td></tr>
    </tbody>
  </table></div>
  <p>Officially, a Creep can still call <code>harvest()</code> without empty carrying capacity, but the harvested resource can be dropped on the ground instead of entering its Store. That specialized pattern is outside this first worker exercise.</p>
  <p>You can inspect or calculate a basic body with the <a href="/en/tools/creep-body-calculator">Creep body calculator</a>.</p>

  <h2 id="read-only-check">Run a read-only Creep check</h2>
  <p><strong>State impact:</strong> Read-only. This Console snippet does not move the Creep, harvest a Source, or write to Memory.</p>
  <p>Replace <code>Harvester1</code> with the exact name shown in your room.</p>
  <pre><code class="language-javascript">const creep = Game.creeps['Harvester1'];

console.log(JSON.stringify({
  found: Boolean(creep),
  roomName: creep ? creep.room.name : null,
  spawning: creep ? creep.spawning : null,
  activeWork: creep
    ? creep.getActiveBodyparts(WORK)
    : null,
  activeCarry: creep
    ? creep.getActiveBodyparts(CARRY)
    : null,
  activeMove: creep
    ? creep.getActiveBodyparts(MOVE)
    : null,
  freeEnergyCapacity: creep
    ? creep.store.getFreeCapacity(RESOURCE_ENERGY)
    : null
}));</code></pre>
  <p>Continue only after confirming that the Creep exists, has finished spawning, and has at least one active <code>WORK</code> and <code>MOVE</code> part. An active part is a body part that has not been reduced to zero hits.</p>

  <h2 id="find-creep">Find the Creep safely</h2>
  <pre><code class="language-javascript">const CREEP_NAME = 'Harvester1';
const creep = Game.creeps[CREEP_NAME];

if (!creep) {
  console.log(
    CREEP_NAME +
    ' was not found. Check the name and capitalization.'
  );
  return;
}</code></pre>
  <p>Creep names are case-sensitive. The existence check must run before code reads <code>creep.room</code>, <code>creep.store</code>, or any body-part information.</p>

  <h2 id="find-source">Find a visible Source</h2>
  <pre><code class="language-javascript">const sources = creep.room.find(FIND_SOURCES);
const source = sources[0];

if (!source) {
  console.log(
    CREEP_NAME +
    ' cannot find a visible Source in ' +
    creep.room.name +
    '.'
  );
  return;
}</code></pre>
  <p><code>Room.find(FIND_SOURCES)</code> returns an array. This beginner version uses the first result. It does not promise that the Source is the nearest or most efficient choice.</p>

  <h2 id="harvest-and-move">Call harvest() first, then move when needed</h2>
  <pre><code class="language-javascript">const harvestResult = creep.harvest(source);

if (harvestResult === ERR_NOT_IN_RANGE) {
  const moveResult = creep.moveTo(source);

  if (moveResult !== OK && moveResult !== ERR_TIRED) {
    console.log(
      CREEP_NAME +
      ' moveTo(Source) returned ' +
      moveResult +
      '.'
    );
  }
}</code></pre>
  <p>The order matters for debugging. The script tries the intended action first. It moves only when <code>harvest()</code> confirms that range is the current problem.</p>

  <h2 id="complete-code">Complete beginner harvesting code</h2>
  <p><strong>State impact:</strong> This code calls <code>harvest()</code> and may call <code>moveTo()</code>. It does not write to Memory. Put it in your main module and replace the example Creep name.</p>
  <pre><code class="language-javascript">const CREEP_NAME = 'Harvester1';

function moveToSource(creep, source) {
  const moveResult = creep.moveTo(source, {
    reusePath: 5,
    visualizePathStyle: {
      stroke: '#ffffff'
    }
  });

  if (moveResult !== OK && moveResult !== ERR_TIRED) {
    console.log(
      creep.name +
      ' moveTo(Source) returned ' +
      moveResult +
      '.'
    );
  }

  return moveResult;
}

module.exports.loop = function () {
  const creep = Game.creeps[CREEP_NAME];

  if (!creep) {
    console.log(
      CREEP_NAME +
      ' was not found. Check the name and capitalization.'
    );
    return;
  }

  if (creep.spawning) {
    return;
  }

  if (creep.getActiveBodyparts(WORK) === 0) {
    console.log(
      CREEP_NAME +
      ' has no active WORK part and cannot harvest.'
    );
    return;
  }

  const sources = creep.room.find(FIND_SOURCES);
  const source = sources[0];

  if (!source) {
    console.log(
      CREEP_NAME +
      ' cannot find a visible Source in ' +
      creep.room.name +
      '.'
    );
    return;
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    if (creep.getActiveBodyparts(MOVE) === 0) {
      console.log(
        CREEP_NAME +
        ' is out of range and has no active MOVE part.'
      );
      return;
    }

    moveToSource(creep, source);
  } else if (
    harvestResult !== OK &&
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
};</code></pre>

  <h2 id="tick-behavior">How the code works across ticks</h2>
  <ol>
    <li>The loop finds the named Creep and a Source.</li>
    <li><code>harvest()</code> reports <code>ERR_NOT_IN_RANGE</code> while the Source is too far away.</li>
    <li><code>moveTo()</code> schedules movement toward the Source.</li>
    <li>The next tick receives a newly created <code>Game</code> state, and the loop tries again.</li>
    <li>When the Creep becomes adjacent, <code>harvest()</code> can return <code>OK</code>.</li>
    <li>Energy enters the Creep's Store until no free capacity remains.</li>
  </ol>
  <p><code>OK</code> means the action was accepted for the current tick. Inspect the following ticks to confirm that the Creep moved and its stored Energy increased.</p>

  <h2 id="return-codes">harvest() results beginners should recognize</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>Return code</th><th>Meaning</th><th>Response</th></tr></thead>
    <tbody>
      <tr><td><code>OK</code></td><td>The harvest action was scheduled.</td><td>Observe the next tick.</td></tr>
      <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent to the Source.</td><td>Call <code>moveTo(source)</code>.</td></tr>
      <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Source currently has no available Energy.</td><td>Wait nearby for regeneration.</td></tr>
      <tr><td><code>ERR_FULL</code></td><td>The Creep cannot receive more of the harvested resource.</td><td>Add a delivery or resource-use step.</td></tr>
      <tr><td><code>ERR_NO_BODYPART</code></td><td>The Creep has no active <code>WORK</code> part.</td><td>Inspect the body and damage.</td></tr>
      <tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning finishes.</td></tr>
      <tr><td><code>ERR_INVALID_TARGET</code></td><td>The selected object is not a valid harvest target.</td><td>Recheck the target.</td></tr>
      <tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep does not belong to you.</td><td>Recheck the selected Creep.</td></tr>
    </tbody>
  </table></div>
  <p>Use the <a href="/en/screeps-errors">English return-code reference</a> when another action result appears.</p>

  <h2 id="observe">What to observe after saving</h2>
  <ol>
    <li>The Console does not repeatedly report a missing Creep.</li>
    <li>The Creep begins moving toward a visible Source.</li>
    <li>The Creep eventually stands on a square adjacent to the Source.</li>
    <li>The harvesting animation begins.</li>
    <li>The Creep's stored Energy increases across ticks.</li>
    <li>When its Store becomes full, harvesting stops with <code>ERR_FULL</code>.</li>
  </ol>

  <h2 id="common-mistakes">Common mistakes</h2>
  <h3 id="wrong-name">The Creep name is wrong</h3>
  <p>Run <code>Object.keys(Game.creeps)</code> in the Console and copy the exact name.</p>
  <h3 id="no-work">The Creep reaches the Source but cannot harvest</h3>
  <p>Check <code>creep.getActiveBodyparts(WORK)</code>. A body can contain a <code>WORK</code> part that is no longer active because it has been fully damaged.</p>
  <h3 id="no-move">The Creep never approaches the Source</h3>
  <p>Check for an active <code>MOVE</code> part and inspect the saved <code>moveResult</code>. A path or fatigue problem is different from a harvest-range problem.</p>
  <h3 id="source-empty">The Creep waits beside the Source</h3>
  <p>The Source may temporarily have no available Energy. <code>ERR_NOT_ENOUGH_RESOURCES</code> is a waiting condition in this simple exercise.</p>
  <h3 id="store-full">The Creep stops after filling its Store</h3>
  <p>The script has reached its intended boundary. It does not yet include a destination or <code>transfer()</code> call.</p>

  <h2 id="checklist">Debugging checklist</h2>
  <ul>
    <li>Replace <code>Harvester1</code> with the exact Creep name.</li>
    <li>Confirm the Creep exists in <code>Game.creeps</code>.</li>
    <li>Wait until <code>creep.spawning</code> is false.</li>
    <li>Confirm at least one active <code>WORK</code> part.</li>
    <li>Confirm at least one active <code>MOVE</code> part if movement is required.</li>
    <li>Confirm <code>Room.find(FIND_SOURCES)</code> returns a visible Source.</li>
    <li>Save <code>harvestResult</code>.</li>
    <li>Save <code>moveResult</code>.</li>
    <li>Do not expect movement and harvesting to finish in one tick.</li>
    <li>Treat a full Store as the signal for the next delivery lesson.</li>
  </ul>

  <h2 id="scope">Scope and next step</h2>
  <p>This article controls one named Creep and uses the first Source found in its current room. It does not choose the nearest Source, coordinate multiple Creeps, create role modules, optimize paths, or return Energy to a structure.</p>
  <p>Continue with <a href="/en/blog/screeps-transfer-energy-to-spawn">the Spawn delivery tutorial</a>, then use <a href="/en/blog/screeps-creep-body-parts">the WORK, CARRY, and MOVE guide</a> to understand why each ability exists.</p>
  <p>The <a href="/en/beginner">English beginner roadmap</a> keeps these lessons in a stable order, while the <a href="/en/glossary">Screeps glossary</a> explains terms such as Creep, Source, Store, tick, and Spawn.</p>

  <h2 id="faq">Frequently asked questions</h2>
  <h3 id="faq-range">Why does creep.harvest() return ERR_NOT_IN_RANGE?</h3>
  <p>The Creep must be adjacent to the Source. Call <code>moveTo(source)</code> and retry <code>harvest()</code> on later ticks.</p>
  <h3 id="faq-full">Why does harvest() return ERR_FULL?</h3>
  <p>The Creep cannot receive more of the resource. In this worker tutorial, that usually means its Energy Store is full and it needs a delivery step.</p>
  <h3 id="faq-work">Does a Creep need WORK to harvest?</h3>
  <p>Yes. <code>harvest()</code> returns <code>ERR_NO_BODYPART</code> when the Creep has no active <code>WORK</code> part.</p>
  <h3 id="faq-carry">Does a Creep need CARRY to call harvest()?</h3>
  <p><code>WORK</code> is the required harvesting part. Empty <code>CARRY</code> capacity lets the Creep store and transport the harvested resource; otherwise the resource can be dropped on the ground.</p>
  <h3 id="faq-spawn">Why does the full Creep not return to the Spawn?</h3>
  <p>This script contains no delivery state, Spawn target, or <code>transfer()</code> call. Add those in the next lesson.</p>

  <h2 id="official-docs">Official documentation</h2>
  <ul>
    <li><a href="https://docs.screeps.com/api/#Game.creeps" rel="nofollow">Screeps API: Game.creeps</a></li>
    <li><a href="https://docs.screeps.com/api/#Room.find" rel="nofollow">Screeps API: Room.find()</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">Screeps API: Creep.harvest()</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">Screeps API: Creep.moveTo()</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.getActiveBodyparts" rel="nofollow">Screeps API: Creep.getActiveBodyparts()</a></li>
    <li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: game loop and ticks</a></li>
  </ul>
`;

const toc: Array<[string, string]> = [
  ["Quick answer", "quick-answer"],
  ["Prerequisites", "prerequisites"],
  ["Read-only check", "read-only-check"],
  ["Find the Creep", "find-creep"],
  ["Find a Source", "find-source"],
  ["Harvest and move", "harvest-and-move"],
  ["Complete code", "complete-code"],
  ["Tick behavior", "tick-behavior"],
  ["Return codes", "return-codes"],
  ["What to observe", "observe"],
  ["Common mistakes", "common-mistakes"],
  ["Debugging checklist", "checklist"],
  ["Scope and next step", "scope"],
  ["FAQ", "faq"],
  ["Official documentation", "official-docs"],
];

const faq = [
  {
    "@type": "Question",
    name: "Why does creep.harvest() return ERR_NOT_IN_RANGE?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "The Creep must be adjacent to the Source. Call moveTo(source) and retry harvest() on later ticks.",
    },
  },
  {
    "@type": "Question",
    name: "Why does harvest() return ERR_FULL?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "The Creep cannot receive more of the resource. In this worker tutorial, that usually means its Energy Store is full and it needs a delivery step.",
    },
  },
  {
    "@type": "Question",
    name: "Does a Creep need WORK to harvest?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Yes. harvest() returns ERR_NO_BODYPART when the Creep has no active WORK part.",
    },
  },
  {
    "@type": "Question",
    name: "Does a Creep need CARRY to call harvest()?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "WORK is required to harvest. Empty CARRY capacity lets the Creep store and transport the harvested resource; otherwise it can be dropped on the ground.",
    },
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    inLanguage: "en-US",
    mainEntityOfPage: articleUrl,
    author: { "@type": "Person", name: "Linqingan" },
    publisher: { "@type": "Organization", name: "Linqingan", url: siteConfig.url },
    isBasedOn: `${siteConfig.url}${chinesePath}`,
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
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq },
];

export default function HarvestEnergyPage() {
  return (
    <EnglishArticlePage
      headline={headline}
      description={description}
      breadcrumbLabel="Creep.harvest()"
      category="SCREEPS BEGINNER · ENERGY HARVESTING"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="11 min read"
      tags={["Screeps", "Creep", "Harvesting", "JavaScript", "Beginner"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked" },
        { term: "API and constants", value: "Checked" },
        { term: "JavaScript syntax", value: "Checked" },
        { term: "Offline logic review", value: "Passed" },
        { term: "Screeps Console", value: "Pending" },
        { term: "Live multi-tick test", value: "Pending" },
        { term: "Last verified", value: publishedLabel },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
      next={{
        href: "/en/blog/screeps-transfer-energy-to-spawn",
        label: "Next beginner lesson",
        title: "Deliver Energy to a Spawn",
      }}
    />
  );
}
