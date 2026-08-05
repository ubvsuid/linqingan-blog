import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-creep-prespawn-replacement";
const chinesePath = "/blog/screeps-creep-prespawn-replacement";
const headline = "Screeps Prespawn Replacement: Start the Next Creep Before the Current One Dies";
const description =
  "Calculate a Screeps Creep replacement deadline from ticksToLive, Spawn wait, body time, travel, and safety margin, then prevent duplicate replacements and verify the accepted request later.";
const publishedAt = "2026-08-03";
const publishedLabel = "August 3, 2026";
const modifiedTime = "2026-08-05";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps prespawn replacement",
    "Screeps ticksToLive replacement",
    "Screeps Spawn queue",
    "Creep replacement timing",
    "prevent Screeps role downtime",
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
    tags: discovery?.tags ?? ["Spawn", "Creeps", "Debugging"],
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
  ["deadline", "Calculate the replacement deadline"],
  ["difference", "Keep the search intent separate"],
  ["duplicates", "Prevent duplicate replacements"],
  ["decision", "Use a testable decision function"],
  ["manager", "Submit through one room manager"],
  ["results", "Preserve and verify Spawn results"],
  ["planner", "Use the planner as an estimate"],
  ["boundaries", "Evidence boundaries"],
];

const articleHtml = String.raw`
<h2 id="deadline">Calculate the replacement deadline</h2>
<p>Waiting until a Harvester, Hauler, or Upgrader disappears before calling <code>spawnCreep()</code> starts the replacement too late. A successor may wait for current Spawn work, consume time for every body part, and travel to its work position while the old Creep's <code>ticksToLive</code> keeps falling.</p>
<pre><code class="language-text">replacement lead = earliest Spawn wait
                   + body spawn time
                   + travel time
                   + safety buffer</code></pre>
<p>The base body time is <code>body.length × CREEP_SPAWN_TIME</code>. This guide keeps the documented base time as a conservative default instead of assuming <code>PWR_OPERATE_SPAWN</code> will remain available.</p>
<p>Travel is not linear range. Roads, swamps, MOVE-to-load ratio, traffic, exits, and a blocked work tile can all delay arrival. Begin with a conservative role value, then record the tick when spawning finishes and the tick when the Creep first satisfies its role-specific arrival condition.</p>

<h2 id="difference">Keep the search intent separate</h2>
<p>The <a href="/en/blog/screeps-spawncreep-return-codes">spawnCreep return-code guide</a> diagnoses one failed request. The <a href="/en/blog/screeps-dynamic-creep-body">dynamic body guide</a> decides which body is affordable. The <a href="/en/blog/screeps-emergency-harvester-recovery">emergency recovery guide</a> starts after a critical role has already disappeared.</p>
<p>This route owns one narrower intent: begin normal replacement before the old Creep leaves its work position. Restoring the original prespawn slug avoids creating a second competing Spawn-queue page.</p>

<h2 id="duplicates">Prevent duplicate replacements</h2>
<p>A role target of two can temporarily become three after the successor finishes while the low-TTL Creep remains alive. Treat that surplus as coverage:</p>
<pre><code class="language-text">uncovered expiring count
= active Creeps inside the lead threshold
- temporary surplus above the role target</code></pre>
<p>Submit another request only when the uncovered value is positive. Count currently spawning Creeps separately so one pending successor is not requested again.</p>

<h2 id="decision">Use a testable decision function</h2>
<pre><code class="language-js">function evaluateRoleReplacement(input) {
  const {
    targetCount,
    activeTtls,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  } = input;

  const integers = [
    targetCount,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  ];

  if (
    !integers.every(Number.isInteger)
    || targetCount &lt; 1
    || spawningCount &lt; 0
    || spawnTicks &lt; 1
    || spawnWaitTicks &lt; 0
    || travelTicks &lt; 0
    || safetyBuffer &lt; 0
    || !Array.isArray(activeTtls)
    || !activeTtls.every(ttl =&gt;
      Number.isInteger(ttl) &amp;&amp; ttl &gt;= 0
    )
  ) {
    return { valid: false, shouldSpawn: false, reason: 'invalid-input' };
  }

  const leadTicks = spawnWaitTicks + spawnTicks + travelTicks + safetyBuffer;
  const totalCount = activeTtls.length + spawningCount;
  const missingCount = Math.max(0, targetCount - totalCount);
  const surplusCount = Math.max(0, totalCount - targetCount);
  const dueCount = activeTtls.filter(ttl =&gt; ttl &lt;= leadTicks).length;
  const uncoveredDueCount = Math.max(0, dueCount - surplusCount);
  const minimumSlack = activeTtls.length &gt; 0
    ? Math.min(...activeTtls.map(ttl =&gt; ttl - leadTicks))
    : Number.NEGATIVE_INFINITY;

  if (missingCount &gt; 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'count-below-target',
      leadTicks,
      missingCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  if (uncoveredDueCount &gt; 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'prespawn-due',
      leadTicks,
      missingCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  return {
    valid: true,
    shouldSpawn: false,
    reason: 'covered',
    leadTicks,
    missingCount,
    uncoveredDueCount,
    minimumSlack
  };
}</code></pre>
<p><code>minimumSlack</code> is positive before the deadline, zero at the threshold, and negative after the ideal submission time. It is a local scheduling metric, not a Screeps return code.</p>

<h2 id="manager">Submit through one room manager</h2>
<p>All role requests should converge on one room-level owner. The following bounded manager prevents repeated execution in the same tick, ranks actual shortages before normal replacements, performs <code>dryRun</code>, and preserves the formal result.</p>
<pre><code class="language-js">const HISTORY_LIMIT = 20;

const ROLE_CONFIG = {
  harvester: {
    priority: 10,
    targetCount: 2,
    body: [WORK, WORK, CARRY, MOVE],
    travelTicks: 25,
    safetyBuffer: 15
  },
  hauler: {
    priority: 20,
    targetCount: 2,
    body: [CARRY, CARRY, MOVE],
    travelTicks: 18,
    safetyBuffer: 15
  },
  upgrader: {
    priority: 30,
    targetCount: 1,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    travelTicks: 12,
    safetyBuffer: 15
  }
};

function getRoomState(roomName) {
  Memory.prespawnReplacement ??= {};
  Memory.prespawnReplacement[roomName] ??= {
    lastRunTick: null,
    pending: null,
    history: []
  };
  return Memory.prespawnReplacement[roomName];
}

function verifyPendingReplacement(state) {
  const pending = state.pending;
  if (!pending || pending.tick &gt;= Game.time) return null;

  const creep = Game.creeps[pending.name] ?? null;
  const spawn = Game.spawns[pending.spawnName] ?? null;
  const observedInSpawn = spawn?.spawning?.name === pending.name;
  const observedAsCreep = Boolean(creep);
  const record = {
    ...pending,
    verifiedAt: Game.time,
    observedInSpawn,
    observedAsCreep,
    status: observedInSpawn || observedAsCreep
      ? 'replacement-observed'
      : 'replacement-not-observed'
  };

  state.history ??= [];
  state.history.push(record);
  state.history = state.history.slice(-HISTORY_LIMIT);
  state.lastVerification = record;
  state.pending = null;
  return record;
}

function getUsableSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =&gt; spawn.my === true &amp;&amp; spawn.isActive())
    .sort((left, right) =&gt; left.name.localeCompare(right.name));
}

function belongsToRoom(creep, roomName) {
  const homeRoom = creep.memory?.homeRoom ?? creep.memory?.home;
  return typeof homeRoom === 'string'
    ? homeRoom === roomName
    : creep.room.name === roomName;
}

function createRoleRequest(room, role, config, spawnWaitTicks) {
  const creeps = Object.values(Game.creeps).filter(creep =&gt;
    creep.memory?.role === role &amp;&amp; belongsToRoom(creep, room.name)
  );
  const activeCreeps = creeps
    .filter(creep =&gt; !creep.spawning &amp;&amp; Number.isInteger(creep.ticksToLive))
    .sort((left, right) =&gt;
      left.ticksToLive - right.ticksToLive
      || left.name.localeCompare(right.name)
    );
  const spawningCount = creeps.filter(creep =&gt; creep.spawning).length;
  const decision = evaluateRoleReplacement({
    targetCount: config.targetCount,
    activeTtls: activeCreeps.map(creep =&gt; creep.ticksToLive),
    spawningCount,
    spawnTicks: config.body.length * CREEP_SPAWN_TIME,
    spawnWaitTicks,
    travelTicks: config.travelTicks,
    safetyBuffer: config.safetyBuffer
  });

  if (!decision.valid || !decision.shouldSpawn) return null;
  return {
    role,
    config,
    replacementFor: activeCreeps[0]?.name ?? null,
    ...decision
  };
}

function compareRequests(left, right) {
  const leftTier = left.reason === 'count-below-target' ? 0 : 1;
  const rightTier = right.reason === 'count-below-target' ? 0 : 1;
  if (leftTier !== rightTier) return leftTier - rightTier;
  if (leftTier === 0) {
    return right.missingCount - left.missingCount
      || left.config.priority - right.config.priority
      || left.role.localeCompare(right.role);
  }
  return left.minimumSlack - right.minimumSlack
    || left.config.priority - right.config.priority
    || left.role.localeCompare(right.role);
}

function runRoomPrespawnManager(room) {
  const state = getRoomState(room.name);
  const verification = verifyPendingReplacement(state);

  if (state.lastRunTick === Game.time) {
    return { status: 'already-ran-this-tick', verification };
  }
  state.lastRunTick = Game.time;

  const spawns = getUsableSpawns(room);
  if (spawns.length === 0) return { status: 'no-usable-spawn', verification };

  const spawnWaitTicks = Math.min(
    ...spawns.map(spawn =&gt; spawn.spawning?.remainingTime ?? 0)
  );
  const requests = Object.entries(ROLE_CONFIG)
    .map(([role, config]) =&gt;
      createRoleRequest(room, role, config, spawnWaitTicks)
    )
    .filter(Boolean)
    .sort(compareRequests);

  if (requests.length === 0) return { status: 'no-request', verification };

  const request = requests[0];
  const spawn = spawns.find(item =&gt; !item.spawning);
  if (!spawn) return { status: 'all-spawns-busy', request, verification };

  const name = [request.role, room.name, spawn.name, Game.time].join('-');
  const memory = {
    role: request.role,
    homeRoom: room.name,
    replacementReason: request.reason,
    replacementFor: request.replacementFor
  };
  const dryRunResult = spawn.spawnCreep(request.config.body, name, {
    memory,
    dryRun: true
  });
  if (dryRunResult !== OK) {
    return { status: 'dry-run-failed', dryRunResult, request, verification };
  }

  const result = spawn.spawnCreep(request.config.body, name, { memory });
  if (result === OK) {
    state.pending = {
      tick: Game.time,
      name,
      spawnName: spawn.name,
      role: request.role,
      reason: request.reason,
      replacementFor: request.replacementFor
    };
  }

  return {
    status: result === OK ? 'spawn-submitted' : 'spawn-failed',
    result,
    dryRunResult,
    name,
    spawnName: spawn.name,
    request,
    verification
  };
}</code></pre>
<p>Run emergency recovery before this manager when a critical role is already absent. Run ordinary expansion requests only when neither emergency recovery nor prespawn replacement has used the room's final Spawn submission.</p>

<h2 id="results">Preserve and verify Spawn results</h2>
<table>
<thead><tr><th>Result</th><th>Meaning for the queue</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Save the accepted name and observe it later</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Find another module that bypassed the manager</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_ENERGY</code></td><td>Use a smaller body or emergency policy where appropriate</td></tr>
<tr><td><code>ERR_NAME_EXISTS</code></td><td>Fix naming or duplicate same-tick ownership</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Stop blind retries and repair configuration</td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>Check RCL and structure activity</td></tr>
</tbody>
</table>
<p><code>replacement-observed</code> only proves that the accepted name appeared in <code>Game.creeps</code> or <code>spawn.spawning</code>. It does not prove the new unit reached work before the old unit left.</p>

<h2 id="planner">Use the planner as an estimate</h2>
<p>The <a href="/en/tools/spawn-queue-replacement-planner">Spawn Queue and Replacement Planner</a> estimates body production time, normal versus CLAIM lifetime, average Spawn utilization, travel allowance, safety margin, and optional <code>OPERATE_SPAWN</code> planning.</p>
<p>It is not an exact runtime scheduler. It does not simulate simultaneous expirations, Energy starvation, blocked spawn directions, <code>DISRUPT_SPAWN</code>, competing modules, or the formal <code>spawnCreep()</code> result.</p>

<h2 id="boundaries">Evidence boundaries</h2>
<p>Twenty offline cases passed, including healthy TTLs, threshold equality, shortages, no active Creep, spawning coverage, completed temporary surplus, multiple expirations, Spawn waiting, zero travel and buffer, invalid TTL and configuration inputs, and large finite values. The complete Chinese manager passed a JavaScript syntax check.</p>
<p>Live Console, official-shard Spawn competition, work-position arrival, <code>PWR_OPERATE_SPAWN</code> changes, hostile disruption, and true zero-downtime handoffs remain pending. A real no-gap claim requires the replacement's first work-position tick to occur before the old Creep's last work tick.</p>
`;

export default function PrespawnReplacementPage() {
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
      breadcrumbLabel="Prespawn replacement"
      category="SPAWN LIFECYCLE · PRESPAWN REPLACEMENT"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="17 min read"
      tags={["Spawn", "Creeps", "Debugging"]}
      verification={[
        { term: "Documentation", value: "Official Creep, Spawn, constants, and game-loop references checked" },
        { term: "Syntax", value: "Complete Chinese room manager checked offline" },
        { term: "Offline cases", value: "20 passed" },
        { term: "Live shard", value: "Pending" },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
