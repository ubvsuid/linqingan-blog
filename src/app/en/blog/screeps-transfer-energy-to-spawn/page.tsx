import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-transfer-energy-to-spawn";
const chinesePath = "/blog/screeps-creep-deliver-energy";
const title = "Screeps transfer(): Send Creep Energy to a Spawn";
const headline = "How to Make a Screeps Creep Deliver Energy to a Spawn";
const description =
  "Make a Screeps Creep switch from harvesting to delivery, move to Spawn1, handle transfer() return codes, and complete its first Energy loop.";
const publishedAt = "2026-07-24";
const publishedLabel = "July 24, 2026";
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${title} | Linqingan` },
  description,
  keywords: [
    "Screeps transfer energy to Spawn",
    "Creep.transfer()",
    "Game.spawns",
    "RESOURCE_ENERGY",
    "ERR_FULL",
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
    tags: ["Screeps", "Creep", "Spawn", "Energy", "JavaScript"],
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
  <p>Find your Spawn with <code>Game.spawns</code> and call <code>creep.transfer(spawn, RESOURCE_ENERGY)</code>. If the Creep is too far away, move it toward the Spawn. Use one small Memory flag so the Creep stays in delivery mode until it is empty, then switch it back to harvesting.</p>
  <p>This creates the first complete beginner loop: Source → Creep → Spawn.</p>

  <h2 id="prerequisites">What you need before starting</h2>
  <ul>
    <li>One Creep with active <code>WORK</code>, <code>CARRY</code>, and <code>MOVE</code> parts.</li>
    <li>At least one visible Source.</li>
    <li>One Spawn that belongs to you.</li>
    <li>The exact Creep and Spawn names.</li>
  </ul>
  <p>The examples use <code>Harvester1</code> and <code>Spawn1</code>. Replace both names with the names displayed in your game. Screeps names are case-sensitive.</p>
  <p>Review <a href="/en/blog/screeps-creep-harvest-energy">the first harvesting lesson</a> before adding delivery logic.</p>

  <h2 id="precheck">Run a read-only precheck</h2>
  <p><strong>State impact:</strong> Read-only. This Console snippet does not move the Creep, transfer Energy, or write to Memory.</p>
  <pre><code class="language-javascript">const creep = Game.creeps['Harvester1'];
const spawn = Game.spawns['Spawn1'];

console.log(JSON.stringify({
  creepFound: Boolean(creep),
  spawnFound: Boolean(spawn),
  creepRoom: creep ? creep.room.name : null,
  spawning: creep ? creep.spawning : null,
  carriedEnergy: creep
    ? creep.store.getUsedCapacity(RESOURCE_ENERGY)
    : null,
  creepFreeCapacity: creep
    ? creep.store.getFreeCapacity(RESOURCE_ENERGY)
    : null,
  spawnFreeCapacity: spawn
    ? spawn.store.getFreeCapacity(RESOURCE_ENERGY)
    : null
}));</code></pre>
  <p>Before continuing, confirm that both objects exist, the Creep has finished spawning, and the Creep has carrying capacity.</p>

  <h2 id="direction">Understand the direction of transfer()</h2>
  <pre><code class="language-javascript">const transferResult = creep.transfer(
  spawn,
  RESOURCE_ENERGY
);</code></pre>
  <p>The resource direction is <strong>Creep → Spawn</strong>. <code>transfer()</code> does not take Energy out of the Spawn. Taking a resource from a structure uses <code>withdraw()</code>, which is a different API and search intent.</p>

  <h2 id="find-spawn">Find the Spawn safely</h2>
  <pre><code class="language-javascript">const SPAWN_NAME = 'Spawn1';
const spawn = Game.spawns[SPAWN_NAME];

if (!spawn) {
  console.log(
    SPAWN_NAME +
    ' was not found. Check the name and capitalization.'
  );
  return;
}</code></pre>
  <p><code>Game.spawns</code> uses Spawn names as keys. Stop before reading <code>spawn.store</code> when the lookup returns no object.</p>

  <h2 id="simple-rule">The simplest harvesting and delivery rule</h2>
  <pre><code class="language-javascript">if (creep.store.getFreeCapacity(RESOURCE_ENERGY) &gt; 0) {
  // Harvest
} else {
  // Deliver
}</code></pre>
  <p>This rule explains the two tasks clearly: harvest while capacity remains, then deliver when the Store is full.</p>

  <h2 id="partial-transfer">Why the simplest rule can switch too early</h2>
  <p>Suppose the Creep carries 50 Energy, but the Spawn has room for only 20.</p>
  <ol>
    <li>The Creep transfers 20 Energy.</li>
    <li>It still carries 30 Energy.</li>
    <li>Its Store now has free capacity.</li>
    <li>The simple rule immediately selects harvesting.</li>
    <li>The Creep may return to the Source before unloading the remaining Energy.</li>
  </ol>
  <p>The transfer is valid, but the task switch is inefficient. A boolean state stored in Memory keeps the Creep delivering until it becomes empty.</p>

  <h2 id="delivery-state">Keep one delivery state across ticks</h2>
  <pre><code class="language-javascript">if (usedEnergy === 0) {
  creep.memory.delivering = false;
}

if (freeEnergyCapacity === 0) {
  creep.memory.delivering = true;
}</code></pre>
  <p>The resulting state rules are:</p>
  <ul>
    <li>empty Creep → harvesting mode;</li>
    <li>full Creep → delivery mode;</li>
    <li>partially unloaded Creep already delivering → remain in delivery mode.</li>
  </ul>
  <p><strong>State impact:</strong> The complete script writes <code>creep.memory.delivering</code>. Screeps preserves that value across ticks.</p>

  <h2 id="complete-code">Complete harvesting and delivery code</h2>
  <p><strong>State impact:</strong> This code calls <code>harvest()</code>, <code>transfer()</code>, and <code>moveTo()</code>. It writes one boolean field to the selected Creep's Memory. Put it in your main module and replace both example names.</p>
  <pre><code class="language-javascript">const CREEP_NAME = 'Harvester1';
const SPAWN_NAME = 'Spawn1';

function getNextDeliveryState(
  currentDelivering,
  usedEnergy,
  freeEnergyCapacity
) {
  if (usedEnergy === 0) {
    return false;
  }

  if (freeEnergyCapacity === 0) {
    return true;
  }

  return currentDelivering === true;
}

function moveToTarget(creep, target, label) {
  const moveResult = creep.moveTo(target, {
    reusePath: 5,
    visualizePathStyle: {
      stroke: '#ffffff'
    }
  });

  if (moveResult !== OK && moveResult !== ERR_TIRED) {
    console.log(
      creep.name +
      ' moveTo(' +
      label +
      ') returned ' +
      moveResult +
      '.'
    );
  }

  return moveResult;
}

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

  if (creep.spawning) {
    return;
  }

  const usedEnergy =
    creep.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0;

  const freeEnergyCapacity =
    creep.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

  creep.memory.delivering = getNextDeliveryState(
    creep.memory.delivering,
    usedEnergy,
    freeEnergyCapacity
  );

  if (creep.memory.delivering) {
    const spawnFreeCapacity =
      spawn.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

    if (spawnFreeCapacity &lt;= 0) {
      return;
    }

    const amount = Math.min(
      usedEnergy,
      spawnFreeCapacity
    );

    const transferResult = creep.transfer(
      spawn,
      RESOURCE_ENERGY,
      amount
    );

    if (transferResult === ERR_NOT_IN_RANGE) {
      moveToTarget(creep, spawn, SPAWN_NAME);
    } else if (transferResult !== OK) {
      console.log(
        CREEP_NAME +
        ' transfer() returned ' +
        transferResult +
        '.'
      );
    }

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
    moveToTarget(creep, source, 'Source');
  } else if (
    harvestResult !== OK &&
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

  <h2 id="code-flow">How the complete code decides what to do</h2>
  <ol>
    <li>Find the named Creep and Spawn.</li>
    <li>Stop safely if either object is missing.</li>
    <li>Read the Creep's used and free Energy capacity.</li>
    <li>Switch to harvesting when the Creep is empty.</li>
    <li>Switch to delivering when the Creep is full.</li>
    <li>Keep the current state while the Creep is partially full.</li>
    <li>In delivery mode, check whether the Spawn can receive Energy.</li>
    <li>Transfer only the amount that fits.</li>
    <li>In harvesting mode, find the first visible Source.</li>
    <li>Move only when the current action reports insufficient range.</li>
  </ol>

  <h2 id="tick-behavior">How the round trip works across ticks</h2>
  <h3 id="harvest-ticks">Harvesting ticks</h3>
  <p>The Creep approaches the Source, retries <code>harvest()</code>, and fills its Store over multiple ticks. When no free Energy capacity remains, delivery mode becomes active.</p>
  <h3 id="delivery-ticks">Delivery ticks</h3>
  <p>The Creep approaches the Spawn and retries <code>transfer()</code>. A partial transfer leaves delivery mode active. When the Creep becomes empty, the next loop switches back to harvesting.</p>
  <p>An <code>OK</code> result means the action was accepted for the current tick. Inspect later ticks to verify the changed Store values and position.</p>

  <h2 id="return-codes">transfer() results beginners should recognize</h2>
  <div class="table-scroll"><table>
    <thead><tr><th>Return code</th><th>Meaning</th><th>Recommended response</th></tr></thead>
    <tbody>
      <tr><td><code>OK</code></td><td>The transfer was scheduled.</td><td>Observe the next tick.</td></tr>
      <tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Spawn is too far away.</td><td>Call <code>moveTo(spawn)</code>.</td></tr>
      <tr><td><code>ERR_FULL</code></td><td>The target cannot receive more resources.</td><td>Check its free capacity.</td></tr>
      <tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep does not carry the requested amount.</td><td>Recheck the Store and amount.</td></tr>
      <tr><td><code>ERR_INVALID_TARGET</code></td><td>The selected target cannot receive the resource.</td><td>Recheck the Spawn object.</td></tr>
      <tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning.</td><td>Wait until spawning finishes.</td></tr>
      <tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep does not belong to you.</td><td>Stop and inspect the selected Creep.</td></tr>
      <tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource type or amount is invalid.</td><td>Inspect the arguments.</td></tr>
    </tbody>
  </table></div>
  <p>The <a href="/en/screeps-errors">English error-code reference</a> provides a wider lookup table.</p>

  <h2 id="spawn-full">What happens when the Spawn is full?</h2>
  <pre><code class="language-javascript">const spawnFreeCapacity =
  spawn.store.getFreeCapacity(RESOURCE_ENERGY) ?? 0;

if (spawnFreeCapacity &lt;= 0) {
  return;
}</code></pre>
  <p>When the Spawn is full, this beginner Creep remains in delivery mode and waits. It does not switch back to harvesting while it still carries Energy.</p>
  <p>The article intentionally does not select an Extension as an alternative target. Delivery priority belongs in a later room-economy lesson.</p>

  <h2 id="amount">Why specify the transfer amount?</h2>
  <pre><code class="language-javascript">const amount = Math.min(
  usedEnergy,
  spawnFreeCapacity
);</code></pre>
  <p>The amount cannot exceed the Energy carried by the Creep or the Energy capacity available in the Spawn. This makes partial-transfer behavior explicit and easier to inspect.</p>

  <h2 id="observe">What to observe after saving</h2>
  <ol>
    <li>The empty Creep moves toward the Source.</li>
    <li>Its Store fills with Energy.</li>
    <li>When full, it leaves the Source.</li>
    <li>It moves toward the named Spawn.</li>
    <li>It stops on a square adjacent to the Spawn.</li>
    <li>Its carried Energy decreases after transfer.</li>
    <li>If Energy remains, it continues delivering.</li>
    <li>When empty, it returns to the Source.</li>
  </ol>

  <h2 id="common-mistakes">Common mistakes</h2>
  <h3 id="names">The Creep or Spawn name is wrong</h3>
  <pre><code class="language-javascript">Object.keys(Game.creeps);
Object.keys(Game.spawns);</code></pre>
  <p>Copy the exact names, including capitalization.</p>
  <h3 id="no-return">The Creep becomes full but does not return</h3>
  <p>Check whether <code>creep.memory.delivering</code> becomes <code>true</code>, then inspect the movement result.</p>
  <h3 id="beside-spawn">The Creep stands beside the Spawn</h3>
  <p>Inspect the Spawn's free capacity and the saved <code>transferResult</code>. A full Spawn cannot receive more Energy.</p>
  <h3 id="partial-energy">The Creep still carries some Energy</h3>
  <p>The Spawn may have accepted only part of the load. The final code remains in delivery mode until the Creep becomes empty.</p>
  <h3 id="wrong-direction">The code is trying to take Energy from Spawn</h3>
  <p><code>transfer()</code> sends a resource from the Creep. Reading resources from a structure requires <code>withdraw()</code>.</p>

  <h2 id="checklist">Debugging checklist</h2>
  <ul>
    <li>Replace both example names.</li>
    <li>Confirm the Creep exists in <code>Game.creeps</code>.</li>
    <li>Confirm the Spawn exists in <code>Game.spawns</code>.</li>
    <li>Wait until the Creep finishes spawning.</li>
    <li>Confirm it has an active <code>CARRY</code> part.</li>
    <li>Confirm the room contains a visible Source.</li>
    <li>Inspect used and free Creep capacity.</li>
    <li>Inspect the Spawn's free Energy capacity.</li>
    <li>Inspect <code>creep.memory.delivering</code>.</li>
    <li>Save <code>harvestResult</code>, <code>transferResult</code>, and <code>moveResult</code>.</li>
    <li>Do not expect the full round trip to finish in one tick.</li>
    <li>Do not treat a full Spawn as a movement error.</li>
  </ul>

  <h2 id="scope">Scope and next step</h2>
  <p>This tutorial controls one fixed Creep, one Source, and one Spawn. It does not choose Extensions, use role modules, coordinate several Creeps, or design delivery priorities.</p>
  <p>Continue with <a href="/en/blog/screeps-creep-body-parts">the WORK, CARRY, and MOVE guide</a>. The <a href="/en/tools/creep-body-calculator">body calculator</a> can then show the cost and capacity of your basic worker.</p>
  <p>Use the <a href="/en/beginner">beginner roadmap</a>, <a href="/en/glossary">glossary</a>, and <a href="/en/verification">verification policy</a> for supporting context.</p>

  <h2 id="faq">Frequently asked questions</h2>
  <h3 id="faq-range">Why does creep.transfer() return ERR_NOT_IN_RANGE?</h3>
  <p>The Creep must stand adjacent to the Spawn. Call <code>moveTo(spawn)</code> and retry <code>transfer()</code> on later ticks.</p>
  <h3 id="faq-full">Why does creep.transfer() return ERR_FULL?</h3>
  <p>The Spawn cannot receive more Energy. Check <code>spawn.store.getFreeCapacity(RESOURCE_ENERGY)</code>.</p>
  <h3 id="faq-return">Why does the Creep not return to Spawn when full?</h3>
  <p>Confirm that the full Store changes <code>creep.memory.delivering</code> to <code>true</code>, then inspect the result of <code>moveTo()</code>.</p>
  <h3 id="faq-empty">Why does the Creep return to the Source before it is empty?</h3>
  <p>A rule based only on free capacity switches after a partial transfer. Keep delivery mode active until carried Energy reaches zero.</p>
  <h3 id="faq-withdraw">Should I use withdraw() to put Energy into Spawn?</h3>
  <p>No. Use <code>transfer()</code> to send a resource from a Creep to a Spawn. <code>withdraw()</code> moves a resource from a structure into a Creep.</p>

  <h2 id="official-docs">Official documentation</h2>
  <ul>
    <li><a href="https://docs.screeps.com/api/#Game.spawns" rel="nofollow">Screeps API: Game.spawns</a></li>
    <li><a href="https://docs.screeps.com/api/#Creep.transfer" rel="nofollow">Screeps API: Creep.transfer()</a></li>
    <li><a href="https://docs.screeps.com/api/#Store.getFreeCapacity" rel="nofollow">Screeps API: Store.getFreeCapacity()</a></li>
    <li><a href="https://docs.screeps.com/api/#Store.getUsedCapacity" rel="nofollow">Screeps API: Store.getUsedCapacity()</a></li>
    <li><a href="https://docs.screeps.com/api/#StructureSpawn" rel="nofollow">Screeps API: StructureSpawn</a></li>
    <li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: game loop and ticks</a></li>
  </ul>
`;

const toc: Array<[string, string]> = [
  ["Quick answer", "quick-answer"],
  ["Prerequisites", "prerequisites"],
  ["Read-only precheck", "precheck"],
  ["transfer() direction", "direction"],
  ["Find the Spawn", "find-spawn"],
  ["Simple rule", "simple-rule"],
  ["Partial transfer", "partial-transfer"],
  ["Delivery state", "delivery-state"],
  ["Complete code", "complete-code"],
  ["Code flow", "code-flow"],
  ["Tick behavior", "tick-behavior"],
  ["Return codes", "return-codes"],
  ["Spawn full", "spawn-full"],
  ["Transfer amount", "amount"],
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
    name: "Why does creep.transfer() return ERR_NOT_IN_RANGE?",
    acceptedAnswer: { "@type": "Answer", text: "The Creep must stand adjacent to the Spawn. Call moveTo(spawn) and retry transfer() on later ticks." },
  },
  {
    "@type": "Question",
    name: "Why does creep.transfer() return ERR_FULL?",
    acceptedAnswer: { "@type": "Answer", text: "The Spawn cannot receive more Energy. Check spawn.store.getFreeCapacity(RESOURCE_ENERGY)." },
  },
  {
    "@type": "Question",
    name: "Why does the Creep return to the Source before it is empty?",
    acceptedAnswer: { "@type": "Answer", text: "A rule based only on free capacity switches after a partial transfer. Keep delivery mode active until carried Energy reaches zero." },
  },
  {
    "@type": "Question",
    name: "Should I use withdraw() to put Energy into Spawn?",
    acceptedAnswer: { "@type": "Answer", text: "No. transfer() sends a resource from a Creep to a Spawn. withdraw() moves a resource from a structure into a Creep." },
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

export default function TransferEnergyPage() {
  return (
    <EnglishArticlePage
      headline={headline}
      description={description}
      breadcrumbLabel="Creep.transfer()"
      category="SCREEPS BEGINNER · ENERGY DELIVERY"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      readingTime="13 min read"
      tags={["Screeps", "Creep", "Spawn", "Energy", "JavaScript"]}
      verification={[
        { term: "Chinese source", value: "Read in full" },
        { term: "Official documentation", value: "Checked" },
        { term: "API and constants", value: "Checked" },
        { term: "JavaScript syntax", value: "Checked" },
        { term: "Offline state logic", value: "Passed · 9 assertions" },
        { term: "Screeps Console", value: "Pending" },
        { term: "Live multi-tick test", value: "Pending" },
        { term: "Last verified", value: publishedLabel },
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
