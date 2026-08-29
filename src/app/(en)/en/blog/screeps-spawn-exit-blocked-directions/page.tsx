import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-spawn-exit-blocked-directions";
const chinesePath = "/blog/screeps-spawn-exit-blocked-directions";
const headline =
  "Screeps Spawn Exit Blocked: Diagnose Directions and Occupied Tiles";
const description =
  "Confirm a blocked Screeps Spawn exit from current spawning state and all eight adjacent tiles, then fix direction policy without confusing accepted intents with observed birth.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-28";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps Spawn exit blocked",
    "spawnCreep directions",
    "StructureSpawn.Spawning.setDirections",
    "Screeps Creep stuck in Spawn",
    "Screeps Spawn adjacent tiles",
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
    tags: discovery?.tags ?? ["Spawn", "Movement", "Debugging"],
    images: [
      {
        url: `${siteConfig.url}${path}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${headline} | Linqingan`,
    description,
    images: [`${siteConfig.url}${path}/opengraph-image`],
  },
};

const toc: Array<[string, string]> = [
  ["fast-path", "Debugging fast path"],
  ["likely-causes", "Likely causes: symptom to fix"],
  ["engine-boundary", "What Spawn completion actually does"],
  ["direction-order", "Keep the directions contract explicit"],
  ["plan", "Build one deterministic exit plan"],
  ["submit", "Keep dryRun and real submission separate"],
  ["refresh", "Refresh directions near completion"],
  ["observe", "Observe completion across ticks"],
  ["retest", "Retest after the fix"],
  ["evidence", "Evidence boundary and official sources"],
];

const articleHtml = String.raw`
<h2 id="fast-path">Debugging fast path: confirm the symptom first</h2>
<p>Start here before changing a production planner. Read the active Spawn lifecycle, the named Creep, and all eight adjacent tiles in the same tick. This is read-only diagnostic evidence.</p>
<pre><code class="language-javascript">const ALL_SPAWN_DIRECTIONS = [
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT
];

const SPAWN_DIRECTION_OFFSETS = {
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [RIGHT]: [1, 0],
  [BOTTOM_RIGHT]: [1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_LEFT]: [-1, 1],
  [LEFT]: [-1, 0],
  [TOP_LEFT]: [-1, -1]
};

function structureBlocksSpawnExit(structure) {
  if (structure.structureType === STRUCTURE_RAMPART) {
    return !structure.my &amp;&amp; !structure.isPublic;
  }

  return OBSTACLE_OBJECT_TYPES.includes(
    structure.structureType
  );
}

function inspectSpawnExitTile(spawn, direction) {
  const offset = SPAWN_DIRECTION_OFFSETS[direction];

  if (!offset) {
    return {
      direction,
      status: 'direction-invalid',
      stablePassable: false,
      currentlyOpen: false
    };
  }

  const x = spawn.pos.x + offset[0];
  const y = spawn.pos.y + offset[1];

  if (x &lt; 0 || x &gt; 49 || y &lt; 0 || y &gt; 49) {
    return {
      direction,
      x,
      y,
      status: 'outside-room',
      stablePassable: false,
      currentlyOpen: false
    };
  }

  const structures = spawn.room.lookForAt(
    LOOK_STRUCTURES,
    x,
    y
  );
  const sites = spawn.room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    x,
    y
  );
  const creeps = spawn.room.lookForAt(
    LOOK_CREEPS,
    x,
    y
  );
  const powerCreeps = spawn.room.lookForAt(
    LOOK_POWER_CREEPS,
    x,
    y
  );
  const hasRoad = structures.some(
    structure =>
      structure.structureType === STRUCTURE_ROAD
  );
  const terrain = spawn.room.getTerrain().get(x, y);
  const terrainBlocked =
    (terrain &amp; TERRAIN_MASK_WALL) !== 0
    &amp;&amp; !hasRoad;
  const stableBlocked =
    terrainBlocked
    || structures.some(structureBlocksSpawnExit)
    || sites.some(site =>
      OBSTACLE_OBJECT_TYPES.includes(
        site.structureType
      )
    );
  const occupied =
    creeps.length &gt; 0
    || powerCreeps.length &gt; 0;

  return {
    direction,
    x,
    y,
    status: stableBlocked
      ? 'stable-obstacle'
      : occupied
        ? 'temporarily-occupied'
        : 'open-now',
    stablePassable: !stableBlocked,
    currentlyOpen: !stableBlocked &amp;&amp; !occupied,
    creepNames: creeps.map(creep => creep.name),
    powerCreepNames: powerCreeps.map(creep => creep.name)
  };
}

const spawn = Object.values(Game.spawns)[0];

if (!spawn) {
  console.log('No owned Spawn is visible.');
} else {
  const name = spawn.spawning?.name ?? null;

  console.log(JSON.stringify({
    tick: Game.time,
    spawn: spawn.name,
    name,
    remainingTime:
      spawn.spawning?.remainingTime ?? null,
    directions:
      spawn.spawning?.directions ?? null,
    creepVisible:
      name ? Boolean(Game.creeps[name]) : false,
    tiles: ALL_SPAWN_DIRECTIONS.map(direction =>
      inspectSpawnExitTile(spawn, direction)
    )
  }, null, 2));
}</code></pre>
<p>If there is no active <code>spawn.spawning</code>, this is not an active Spawn-completion wait. If there is an active name, compare <code>remainingTime</code>, <code>directions</code>, <code>Game.creeps[name]</code>, and the eight tile states before deciding what to change.</p>
<p>The tile scan is a <strong>script-visible diagnostic approximation</strong>, not the engine's private movement-reservation state. Same-tick movement can change occupancy before completion is processed.</p>

<h2 id="likely-causes">Likely causes: symptom → evidence → cause → fix</h2>
<div class="table-scroll"><table>
<thead><tr><th>Symptom</th><th>Evidence to read</th><th>Likely cause</th><th>Fix</th></tr></thead>
<tbody>
<tr><td>Allowed tiles stay <code>stable-obstacle</code></td><td>Terrain, structures, construction sites</td><td>Layout blocks the configured exits</td><td>Change the layout or permit a structurally usable direction.</td></tr>
<tr><td>Allowed tiles are structurally valid but occupied</td><td>Creep/Power Creep names on the eight tiles</td><td>Temporary traffic</td><td>Move traffic away or keep additional valid directions available.</td></tr>
<tr><td>Only one allowed direction waits while another adjacent tile is open</td><td><code>spawn.spawning.directions</code> plus tile scan</td><td>Deliberately strict direction policy</td><td>Add fallback directions if strict one-exit behavior is not intentional.</td></tr>
<tr><td>The final real <code>spawnCreep()</code> returned an error</td><td>Exact final return code</td><td>The request never entered this lifecycle</td><td>Fix the rejection with <a href="/en/blog/screeps-spawncreep-return-codes">the return-code guide</a>; do not start a birth observer.</td></tr>
<tr><td>The Creep is already born but later does not move</td><td><code>Game.creeps[name]</code>, <code>creep.spawning</code>, later position</td><td>Ordinary movement/pathing problem</td><td>Switch to <a href="/en/blog/screeps-moveto-not-moving">the movement guide</a>.</td></tr>
</tbody></table></div>

<h2 id="engine-boundary">What Spawn completion actually does</h2>
<p><code>spawnCreep() === OK</code> means the request was scheduled. It does not prove that the Creep has completed spawning or appeared on an adjacent tile. Likewise, <code>setDirections() === OK</code> means the direction update intent was accepted, not that a listed tile is free at settlement time.</p>
<p>In the pinned public engine source, completion checks the configured directions in order against stable obstacles, blocking construction sites, terrain, and movement occupancy. When an allowed tile succeeds, the Creep is moved there and <code>spawning</code> becomes false. If no allowed tile succeeds, the ordinary path can remain incomplete for a later tick.</p>
<p><strong>Hostile occupancy is a verified engine-source exception.</strong> While checking the allowed directions, the engine remembers the first hostile Creep it finds. If all allowed directions fail and there is no usable opening among the directions that were excluded by policy, the engine can spawn-stomp that hostile Creep and complete the new Creep on that tile. If an excluded direction is actually open, the engine does not use the stomp shortcut and leaves completion unfinished. This behavior is verified from the pinned engine source; a controlled real-shard hostile-occupancy/spawn-stomp reproduction has <strong>not</strong> been collected for this article.</p>

<h2 id="direction-order">Keep the directions contract explicit</h2>
<p>The helper below has one simple contract: when you pass an array, it keeps only the valid unique directions from that array and preserves their order. When you omit the array, it defaults to all eight directions. It does not silently add fallbacks to an explicit policy.</p>
<pre><code class="language-javascript">function normalizeSpawnDirections(input) {
  const source = Array.isArray(input)
    ? input
    : ALL_SPAWN_DIRECTIONS;
  const valid = [];
  const seen = new Set();

  for (const direction of source) {
    if (
      Number.isInteger(direction)
      &amp;&amp; direction &gt;= TOP
      &amp;&amp; direction &lt;= TOP_LEFT
      &amp;&amp; !seen.has(direction)
    ) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  return valid;
}</code></pre>
<p>Therefore <code>[RIGHT]</code> is a deliberate strict one-exit policy, while omitted input means “consider all eight.” An explicit empty or all-invalid array produces no allowed direction, which the planner rejects instead of silently widening the policy.</p>

<h2 id="plan">Build one deterministic exit plan</h2>
<p>After the fast diagnostic confirms an exit problem, reuse the same tile inspection for a small deterministic plan. Stable blockers are excluded. Currently open tiles come before temporarily occupied but structurally valid tiles, while the explicit direction order remains stable inside each group.</p>
<pre><code class="language-javascript">function planSpawnExitDirections(
  spawn,
  preferredDirections
) {
  const snapshots = normalizeSpawnDirections(
    preferredDirections
  ).map(direction =>
    inspectSpawnExitTile(spawn, direction)
  );

  const stable = snapshots.filter(
    item => item.stablePassable
  );
  const open = stable.filter(
    item => item.currentlyOpen
  );
  const occupied = stable.filter(
    item => !item.currentlyOpen
  );

  return {
    status: stable.length === 0
      ? 'no-stable-exit'
      : open.length === 0
        ? 'temporary-occupancy-only'
        : 'exit-plan-ready',
    directions: [
      ...open,
      ...occupied
    ].map(item => item.direction),
    snapshots
  };
}</code></pre>
<p>Keeping temporarily occupied but structurally valid directions at the end is useful for non-strict policies because current traffic may move before a long spawn finishes. The planner still respects a deliberately narrow explicit array.</p>

<h2 id="submit">Keep dryRun and real submission separate</h2>
<p>Use one plan for both calls. <code>dryRun</code> checks the request without scheduling it; only the final real call can create an active lifecycle record. The final return code can still differ because same-tick code may consume the Spawn, Energy, or name between calls.</p>
<pre><code class="language-javascript">function submitSpawnWithExitPlan({
  spawn,
  body,
  name,
  memory,
  preferredDirections
}) {
  if (!spawn?.my) {
    return {
      status: 'owned-spawn-required',
      result: null
    };
  }

  const plan = planSpawnExitDirections(
    spawn,
    preferredDirections
  );

  if (plan.directions.length === 0) {
    return {
      status: plan.status,
      result: null,
      plan
    };
  }

  const options = {
    memory,
    directions: plan.directions
  };
  const dryRunResult = spawn.spawnCreep(
    body,
    name,
    {
      ...options,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      result: dryRunResult,
      plan
    };
  }

  Memory.spawnExitChecks ??= {};
  delete Memory.spawnExitChecks[name];

  const result = spawn.spawnCreep(
    body,
    name,
    options
  );

  if (result !== OK) {
    return {
      status: 'spawn-submit-rejected',
      result,
      plan
    };
  }

  Memory.spawnExitChecks[name] = {
    spawnId: spawn.id,
    name,
    submittedAt: Game.time,
    directions: [...plan.directions],
    acceptedResult: result,
    lastObservedAt: Game.time,
    nearCompleteTicks: 0
  };

  return {
    status: 'spawn-scheduled',
    result,
    plan
  };
}</code></pre>
<p>A rejected final submission preserves the real return code in the returned result but does not enter the “waiting for birth” observer state.</p>

<h2 id="refresh">Refresh directions near completion</h2>
<p>If room traffic changes during a long spawn, one Spawn coordinator can refresh the same policy near completion. Do not let unrelated role modules compete to overwrite the list.</p>
<pre><code class="language-javascript">function refreshSpawnExitDirections(
  spawn,
  preferredDirections,
  refreshAtRemainingTime = 3
) {
  if (!spawn?.spawning) {
    return {
      status: 'no-active-spawn',
      result: null
    };
  }

  if (
    !Number.isInteger(refreshAtRemainingTime)
    || refreshAtRemainingTime &lt; 0
  ) {
    return {
      status: 'refresh-threshold-invalid',
      result: null
    };
  }

  if (
    spawn.spawning.remainingTime
    &gt; refreshAtRemainingTime
  ) {
    return {
      status: 'refresh-not-due',
      result: null
    };
  }

  const plan = planSpawnExitDirections(
    spawn,
    preferredDirections
  );

  if (plan.directions.length === 0) {
    return {
      status: plan.status,
      result: null,
      plan
    };
  }

  const result = spawn.spawning.setDirections(
    plan.directions
  );

  return {
    status: result === OK
      ? 'directions-refresh-accepted'
      : 'directions-refresh-rejected',
    result,
    plan
  };
}</code></pre>
<p>The same evidence rule applies here: an accepted <code>setDirections()</code> call records an accepted intent, not a completed exit.</p>

<h2 id="observe">Observe completion across ticks</h2>
<p>Only observe names that have an active record created after a real <code>spawnCreep() === OK</code>. Repeated near-complete observations can support the local label <code>completion-retry-observed</code>; they do not identify the blocker without the corresponding tile state.</p>
<pre><code class="language-javascript">function observeSpawnExit(name) {
  Memory.spawnExitChecks ??= {};
  const record = Memory.spawnExitChecks[name];

  if (!record) {
    return {
      status: 'spawn-exit-record-missing'
    };
  }

  const spawn = Game.getObjectById(record.spawnId);
  const creep = Game.creeps[name];

  if (
    spawn?.spawning
    &amp;&amp; spawn.spawning.name === name
  ) {
    const nearComplete =
      spawn.spawning.remainingTime &lt;= 1;

    record.nearCompleteTicks = nearComplete
      ? (record.nearCompleteTicks ?? 0) + 1
      : 0;
    record.lastObservedAt = Game.time;
    record.lastRemainingTime =
      spawn.spawning.remainingTime;

    return {
      status: record.nearCompleteTicks &gt;= 2
        ? 'completion-retry-observed'
        : 'still-spawning',
      remainingTime:
        spawn.spawning.remainingTime,
      directions:
        spawn.spawning.directions ?? null,
      nearCompleteTicks:
        record.nearCompleteTicks
    };
  }

  if (creep?.spawning) {
    return {
      status: 'creep-still-inside-spawn'
    };
  }

  if (creep &amp;&amp; spawn) {
    const dx = creep.pos.x - spawn.pos.x;
    const dy = creep.pos.y - spawn.pos.y;
    const direction = Object.entries(
      SPAWN_DIRECTION_OFFSETS
    ).find(([, offset]) =>
      offset[0] === dx
      &amp;&amp; offset[1] === dy
    )?.[0];

    return {
      status: direction
        ? 'born-on-observable-adjacent-tile'
        : 'born-but-exit-direction-missed',
      direction: direction
        ? Number(direction)
        : null,
      wasPlanned: direction
        ? record.directions.includes(
            Number(direction)
          )
        : null
    };
  }

  return {
    status: 'completion-unverified',
    lastObservedAt: record.lastObservedAt
  };
}</code></pre>
<p>The Creep may receive a movement intent immediately after birth. If it has already left range 1 before your later observation, record that the birth direction was missed instead of inventing one from a later position.</p>

<h2 id="retest">Retest after the fix</h2>
<ol>
<li><strong>Same tick:</strong> record the exact <code>dryRun</code>, real <code>spawnCreep()</code>, or <code>setDirections()</code> return code. That is call evidence only.</li>
<li><strong>Later tick:</strong> re-read <code>spawn.spawning?.name</code>, <code>spawn.spawning?.remainingTime</code>, <code>spawn.spawning?.directions</code>, <code>Game.creeps[name]</code>, and any adjacent tile state needed to explain the result.</li>
<li>Do not rename an accepted request or direction update as “Creep born.” The observed later world state is separate evidence.</li>
</ol>

<h2 id="evidence">Evidence boundary and official sources</h2>
<p>The public API contract and the pinned Screeps engine source were checked for direction ordering, completion occupancy, and the hostile-Creep spawn-stomp branch. JavaScript blocks and deterministic planner/lifecycle cases are checked statically. Genuine Screeps Console output, controlled official-shard completion retries, same-tick traffic races, Power Creep occupancy, and a live hostile-occupancy/spawn-stomp reproduction remain <strong>Pending</strong>.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow noopener noreferrer">StructureSpawn.spawnCreep()</a>, <a href="https://docs.screeps.com/api/#StructureSpawn.Spawning" rel="nofollow noopener noreferrer">StructureSpawn.Spawning</a>, <a href="https://docs.screeps.com/api/#StructureSpawn.Spawning.setDirections" rel="nofollow noopener noreferrer">setDirections()</a>, <a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow noopener noreferrer">the game-loop model</a>, and <a href="https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/intents/spawns/_born-creep.js" rel="nofollow noopener noreferrer">the pinned Spawn completion source</a>.</p>
`;

export default function SpawnExitBlockedDirectionsPage() {
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
      author: {
        "@type": "Person",
        name: "Linqingan",
        url: `${siteConfig.url}/en/about`,
        sameAs: ["https://github.com/ubvsuid"],
      },
      publisher: {
        "@type": "Person",
        name: "Linqingan",
        url: `${siteConfig.url}/en/about`,
      },
      isBasedOn: `${siteConfig.url}${chinesePath}`,
      about: discovery?.tags,
      articleSection: discovery?.moduleTitle,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteConfig.url}/en`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guides",
          item: `${siteConfig.url}/en/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: headline,
          item: articleUrl,
        },
      ],
    },
  ];

  return (
    <EnglishArticlePage
      articleHref={path}
      chinesePath={chinesePath}
      headline={headline}
      description={description}
      breadcrumbLabel="Spawn exit diagnosis"
      category="SPAWNING · EXIT DIRECTION DIAGNOSIS"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="14 min read"
      tags={["Spawn", "Movement", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — spawnCreep directions and Spawning.setDirections boundaries",
        },
        {
          term: "Pinned engine source",
          value:
            "Checked — ordered completion search plus hostile-Creep spawn-stomp exception",
        },
        {
          term: "JavaScript syntax",
          value: "Checked by deterministic article simulation",
        },
        {
          term: "Offline deterministic cases",
          value:
            "Checked — explicit direction contract, planning, submission tracking, and later-tick observation",
        },
        {
          term: "Screeps Console test",
          value: "Pending",
        },
        {
          term: "Official-shard multi-tick verification",
          value: "Pending",
        },
        {
          term: "Live hostile occupancy / spawn-stomp",
          value: "Pending — engine-source behavior is not presented as a live reproduction",
        },
        {
          term: "Evidence level",
          value:
            "Official API and pinned engine source, static source review, syntax checks, and offline deterministic simulation",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
