import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-creep-body-parts";
const chinesePath = "/blog/screeps-creep-body-parts";
const title = "Screeps Creep Body Parts: WORK, CARRY, and MOVE";
const headline = "Why Your Screeps Creep Cannot Harvest, Carry, or Move";
const description =
  "Connect WORK, CARRY, and MOVE to real Screeps actions, inspect active body parts, calculate a basic worker, and diagnose missing abilities.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps Creep body parts",
    "Screeps WORK CARRY MOVE",
    "Creep.getActiveBodyparts()",
    "BODYPART_COST",
    "CARRY_CAPACITY",
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
    tags: ["Screeps", "Creep Body", "WORK", "CARRY", "MOVE"],
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
  <p>A Screeps Creep can use only the abilities provided by its active body parts. <code>WORK</code> enables actions such as harvesting, building, repairing, and upgrading. <code>CARRY</code> provides Store capacity for resources. <code>MOVE</code> lets the Creep move and recover fatigue. If an expected action fails, inspect the active part count instead of checking only the body that was originally spawned.</p>

  <h2 id="three-parts">The three beginner body parts</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>Part</th><th>Beginner purpose</th><th>Example API</th><th>Base cost</th></tr></thead>
    <tbody>
      <tr><td><code>WORK</code></td><td>Performs work actions.</td><td><code>harvest()</code>, <code>build()</code>, <code>repair()</code>, <code>upgradeController()</code></td><td>100 Energy</td></tr>
      <tr><td><code>CARRY</code></td><td>Adds resource capacity to the Creep's Store.</td><td><code>transfer()</code>, <code>withdraw()</code>, harvesting into Store</td><td>50 Energy</td></tr>
      <tr><td><code>MOVE</code></td><td>Provides movement and fatigue recovery.</td><td><code>move()</code>, <code>moveTo()</code></td><td>50 Energy</td></tr>
    </tbody>
  </table></div>
  <p>The costs above come from the current Screeps constants. A basic <code>[WORK, CARRY, MOVE]</code> body costs 200 Energy.</p>

  <h2 id="read-only-diagnostic">Inspect the Creep without changing the game</h2>
  <p><strong>State impact:</strong> Read-only. This Console snippet inspects the body, Store, and fatigue. It does not move the Creep or write to Memory.</p>
  <p>Replace <code>Harvester1</code> with your exact Creep name.</p>
  <pre><code class="language-javascript">const creep = Game.creeps['Harvester1'];

if (!creep) {
  console.log('Harvester1 was not found.');
} else {
  const body = creep.body.map((part, index) =&gt; ({
    index,
    type: part.type,
    hits: part.hits,
    active: part.hits &gt; 0,
    boost: part.boost ?? null
  }));

  console.log(JSON.stringify({
    name: creep.name,
    activeWork: creep.getActiveBodyparts(WORK),
    activeCarry: creep.getActiveBodyparts(CARRY),
    activeMove: creep.getActiveBodyparts(MOVE),
    storeCapacity: creep.store.getCapacity(),
    usedCapacity: creep.store.getUsedCapacity(),
    fatigue: creep.fatigue,
    body
  }));
}</code></pre>
  <p><code>getActiveBodyparts()</code> counts body parts that still have hits. A body part reduced to zero hits remains visible in the body array, but it no longer provides its ability.</p>

  <h2 id="work">WORK: the part that performs work</h2>
  <p>One active <code>WORK</code> part enables the Creep to perform several economy actions:</p>
  <ul>
    <li>harvest Energy or minerals from a valid target;</li>
    <li>build a Construction Site;</li>
    <li>repair a Structure;</li>
    <li>upgrade a room Controller;</li>
    <li>dismantle a Structure.</li>
  </ul>
  <p>For a beginner harvester, the most important check is:</p>
  <pre><code class="language-javascript">const activeWork = creep.getActiveBodyparts(WORK);

if (activeWork === 0) {
  console.log(
    creep.name +
    ' has no active WORK part.'
  );
}</code></pre>
  <p><code>Creep.harvest()</code> returns <code>ERR_NO_BODYPART</code> when the Creep has no active <code>WORK</code> part. More <code>WORK</code> parts can increase work performed per action, subject to the target and API rules.</p>
  <p>Follow <a href="/en/blog/screeps-creep-harvest-energy">the first Creep harvesting tutorial</a> to see <code>WORK</code> used in a complete beginner action loop.</p>

  <h2 id="carry">CARRY: Store capacity for resources</h2>
  <p>Each normal <code>CARRY</code> part adds 50 units of capacity to the Creep's Store. A single <code>[WORK, CARRY, MOVE]</code> worker can therefore carry up to 50 total resource units.</p>
  <pre><code class="language-javascript">const totalCapacity = creep.store.getCapacity();
const energyUsed =
  creep.store.getUsedCapacity(RESOURCE_ENERGY);
const energyFree =
  creep.store.getFreeCapacity(RESOURCE_ENERGY);</code></pre>
  <p><code>CARRY</code> is what lets the standard beginner worker keep harvested Energy in its Store and transport it to a Spawn. The delivery action itself is performed with <code>transfer()</code>.</p>
  <p><strong>Important boundary:</strong> <code>WORK</code>, not <code>CARRY</code>, is the required part for calling <code>harvest()</code>. Official API behavior allows harvested resources to be dropped on the ground when the Creep has no empty carrying capacity. This guide focuses on a Creep that stores and transports the resource.</p>
  <p>See <a href="/en/blog/screeps-transfer-energy-to-spawn">the Spawn delivery tutorial</a> for the full harvesting-and-delivery loop.</p>

  <h2 id="move">MOVE: movement and fatigue recovery</h2>
  <p>An active <code>MOVE</code> part allows the Creep to use movement actions. Without one, movement APIs can return <code>ERR_NO_BODYPART</code>.</p>
  <pre><code class="language-javascript">const activeMove = creep.getActiveBodyparts(MOVE);

if (activeMove === 0) {
  console.log(
    creep.name +
    ' has no active MOVE part.'
  );
}</code></pre>
  <p>Movement speed is not determined by <code>MOVE</code> alone. Every body part contributes weight under the fatigue system, terrain changes fatigue generation, and empty <code>CARRY</code> parts do not add movement fatigue. A Creep can therefore have an active <code>MOVE</code> part and still move less than once per tick.</p>
  <p>This beginner article does not calculate optimal ratios for roads, plains, or swamps. Use the <a href="/en/tools/creep-body-calculator">Creep body calculator</a> to inspect loaded movement for a proposed body.</p>

  <h2 id="damage">Why a body part can exist but not work</h2>
  <p>Each Creep body part has 100 hits. Damage is applied to body parts in array order. A part with zero hits becomes inactive.</p>
  <div class="table-scroll"><table>
    <thead><tr><th>Check</th><th>What it tells you</th></tr></thead>
    <tbody>
      <tr><td><code>creep.body</code></td><td>The full ordered body, including damaged parts and their current hits.</td></tr>
      <tr><td><code>creep.getActiveBodyparts(WORK)</code></td><td>How many usable <code>WORK</code> parts remain.</td></tr>
      <tr><td><code>creep.getActiveBodyparts(CARRY)</code></td><td>How many usable <code>CARRY</code> parts remain.</td></tr>
      <tr><td><code>creep.getActiveBodyparts(MOVE)</code></td><td>How many usable <code>MOVE</code> parts remain.</td></tr>
    </tbody>
  </table></div>
  <p>Do not diagnose an ability by searching only for the part type in the original body. Check current hits or use <code>getActiveBodyparts()</code>.</p>

  <h2 id="basic-body">Calculate the basic worker body</h2>
  <p><strong>State impact:</strong> Read-only calculation. This snippet does not spawn a Creep or spend Energy.</p>
  <pre><code class="language-javascript">const body = [WORK, CARRY, MOVE];

const energyCost = body.reduce(
  (total, part) =&gt; total + BODYPART_COST[part],
  0
);

const carryParts = body.filter(
  (part) =&gt; part === CARRY
).length;

const carryCapacity =
  carryParts * CARRY_CAPACITY;

console.log(JSON.stringify({
  body,
  energyCost,
  carryCapacity,
  spawnTime: body.length * CREEP_SPAWN_TIME
}));</code></pre>
  <p>With the current constants, the result is:</p>
  <div class="table-scroll"><table>
    <thead><tr><th>Property</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>Body</td><td><code>[WORK, CARRY, MOVE]</code></td></tr>
      <tr><td>Energy cost</td><td>200</td></tr>
      <tr><td>Store capacity</td><td>50</td></tr>
      <tr><td>Spawn time</td><td>9 ticks</td></tr>
    </tbody>
  </table></div>
  <p>This is a learning body, not a universal optimal design. Room level, available Energy, distance, terrain, throughput, and role purpose can justify different bodies.</p>

  <h2 id="symptoms">Match common symptoms to body parts</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>Symptom</th><th>First body check</th><th>Other checks</th></tr></thead>
    <tbody>
      <tr><td>The Creep is adjacent to a Source but cannot harvest.</td><td>Active <code>WORK</code></td><td>Saved <code>harvest()</code> result and target validity</td></tr>
      <tr><td>The Creep cannot retain or deliver Energy.</td><td>Active <code>CARRY</code> and Store capacity</td><td>Resource type, target capacity, and <code>transfer()</code> result</td></tr>
      <tr><td>The Creep cannot move itself.</td><td>Active <code>MOVE</code></td><td>Fatigue, path result, room borders, and target accessibility</td></tr>
      <tr><td>The Creep moves slowly while loaded.</td><td><code>MOVE</code>-to-weight ratio</td><td>Terrain and whether <code>CARRY</code> parts are full</td></tr>
      <tr><td>An ability disappeared after combat.</td><td>Part hits and active count</td><td>Body order and damage received</td></tr>
    </tbody>
  </table></div>

  <h2 id="common-mistakes">Common mistakes</h2>
  <h3 id="part-present">Checking only whether a part was spawned</h3>
  <p>A part can remain in <code>creep.body</code> with zero hits. Use <code>getActiveBodyparts()</code> for the current usable count.</p>
  <h3 id="carry-harvest">Saying CARRY is required to perform harvest()</h3>
  <p><code>WORK</code> is the required harvesting part. <code>CARRY</code> provides Store capacity for the standard worker that keeps and transports the resource.</p>
  <h3 id="move-every-tick">Assuming one MOVE always means one tile per tick</h3>
  <p>Fatigue depends on body weight, terrain, and load. One active <code>MOVE</code> part does not guarantee movement every tick for every body.</p>
  <h3 id="best-body">Treating [WORK, CARRY, MOVE] as the best body</h3>
  <p>It is the smallest clear body for learning harvesting, carrying, and movement together. It is not an official recommendation for every room or role.</p>

  <h2 id="checklist">Debugging checklist</h2>
  <ul>
    <li>Confirm the exact Creep name.</li>
    <li>Inspect <code>creep.body</code> and each part's hits.</li>
    <li>Use <code>getActiveBodyparts(WORK)</code> before diagnosing work actions.</li>
    <li>Use <code>getActiveBodyparts(CARRY)</code> and Store methods before diagnosing transport.</li>
    <li>Use <code>getActiveBodyparts(MOVE)</code> before diagnosing movement.</li>
    <li>Inspect <code>creep.fatigue</code> when movement is delayed.</li>
    <li>Save the return value of the action that failed.</li>
    <li>Separate a missing ability from range, target, capacity, or path problems.</li>
    <li>Do not assume a damaged part is still active.</li>
    <li>Do not call a basic learning body universally optimal.</li>
  </ul>

  <h2 id="scope">Scope and next step</h2>
  <p>This article covers only <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code>. It does not explain combat parts, boosts, body ordering strategies, swamp optimization, role-specific ratios, or the 50-part body limit in depth.</p>
  <p>The next beginner task is to pass a body array to <code>StructureSpawn.spawnCreep()</code>. Until that article is published, use the <a href="/en/tools/creep-body-calculator">body calculator</a> to validate cost and movement, and the <a href="/en/screeps-errors">return-code reference</a> to interpret action failures.</p>
  <p>The <a href="/en/beginner">English beginner roadmap</a> and <a href="/en/glossary">glossary</a> provide the surrounding learning sequence and terminology.</p>

  <h2 id="faq">Frequently asked questions</h2>
  <h3 id="faq-harvest">Which body part does a Creep need to harvest?</h3>
  <p>It needs at least one active <code>WORK</code> part. Without one, <code>harvest()</code> can return <code>ERR_NO_BODYPART</code>.</p>
  <h3 id="faq-capacity">How much can one CARRY part hold?</h3>
  <p>One normal <code>CARRY</code> part provides 50 units of Store capacity under the current <code>CARRY_CAPACITY</code> constant.</p>
  <h3 id="faq-move">Why does a Creep with MOVE still move slowly?</h3>
  <p>The body can generate more fatigue than its active <code>MOVE</code> parts remove each tick. Terrain and carried load also affect the result.</p>
  <h3 id="faq-damage">Can a damaged body part stop working?</h3>
  <p>Yes. A body part becomes inactive when its hits reach zero. Use <code>getActiveBodyparts()</code> to count usable parts.</p>
  <h3 id="faq-cost">How much does [WORK, CARRY, MOVE] cost?</h3>
  <p>With current base costs, it costs 200 Energy: 100 for <code>WORK</code>, 50 for <code>CARRY</code>, and 50 for <code>MOVE</code>.</p>

  <h2 id="official-docs">Official documentation</h2>
  <ul>
    <li><a href="https://docs.screeps.com/creeps.html" rel="nofollow">Screeps Documentation: Creeps and body parts</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.getActiveBodyparts" rel="nofollow">Screeps API: Creep.getActiveBodyparts()</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.harvest" rel="nofollow">Screeps API: Creep.harvest()</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.moveTo" rel="nofollow">Screeps API: Creep.moveTo()</a></li>
    <li><a href="https://docs.screeps.com/api/#Constants" rel="nofollow">Screeps API: constants and body-part costs</a></li>
  </ul>
`;

const toc: Array<[string, string]> = [
  ["Quick answer", "quick-answer"],
  ["Three beginner parts", "three-parts"],
  ["Read-only diagnostic", "read-only-diagnostic"],
  ["WORK", "work"],
  ["CARRY", "carry"],
  ["MOVE", "move"],
  ["Damaged parts", "damage"],
  ["Basic body calculation", "basic-body"],
  ["Symptoms", "symptoms"],
  ["Common mistakes", "common-mistakes"],
  ["Debugging checklist", "checklist"],
  ["Scope and next step", "scope"],
  ["FAQ", "faq"],
  ["Official documentation", "official-docs"],
];

const faq = [
  {
    "@type": "Question",
    name: "Which body part does a Creep need to harvest?",
    acceptedAnswer: { "@type": "Answer", text: "It needs at least one active WORK part. Without one, harvest() can return ERR_NO_BODYPART." },
  },
  {
    "@type": "Question",
    name: "How much can one CARRY part hold?",
    acceptedAnswer: { "@type": "Answer", text: "One normal CARRY part provides 50 units of Store capacity under the current CARRY_CAPACITY constant." },
  },
  {
    "@type": "Question",
    name: "Why does a Creep with MOVE still move slowly?",
    acceptedAnswer: { "@type": "Answer", text: "The body can generate more fatigue than its active MOVE parts remove each tick. Terrain and carried load also affect the result." },
  },
  {
    "@type": "Question",
    name: "Can a damaged body part stop working?",
    acceptedAnswer: { "@type": "Answer", text: "Yes. A body part becomes inactive when its hits reach zero. Use getActiveBodyparts() to count usable parts." },
  },
  {
    "@type": "Question",
    name: "How much does [WORK, CARRY, MOVE] cost?",
    acceptedAnswer: { "@type": "Answer", text: "With current base costs, it costs 200 Energy: 100 for WORK, 50 for CARRY, and 50 for MOVE." },
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

export default function CreepBodyPartsPage() {
  return (
    <EnglishArticlePage
      headline={headline}
      description={description}
      breadcrumbLabel="WORK, CARRY, MOVE"
      category="SCREEPS BEGINNER · CREEP BODY"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="10 min read"
      tags={["Screeps", "Creep Body", "WORK", "CARRY", "MOVE"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked" },
        { term: "API and constants", value: "Checked" },
        { term: "JavaScript syntax", value: "Checked" },
        { term: "Offline calculation", value: "Passed" },
        { term: "Screeps Console", value: "Pending" },
        { term: "Live room inspection", value: "Pending" },
        { term: "Last verified", value: publishedLabel },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
      previous={{
        href: "/en/blog/screeps-transfer-energy-to-spawn",
        label: "Previous beginner lesson",
        title: "Deliver Energy to a Spawn",
      }}
    />
  );
}
