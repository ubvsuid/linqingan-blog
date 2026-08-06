import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-spawn-exit-blocked-directions";
const chinesePath = "/blog/screeps-spawn-exit-blocked-directions";
const headline =
  "Screeps Spawn Exit Blocked: Diagnose Directions and Occupied Tiles";
const description =
  "Inspect all eight Spawn-adjacent tiles, separate stable obstacles from temporary occupancy, submit one ordered directions list, refresh it near completion, and verify the Creep's later birth state.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
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
  ["intent-boundary", "Use this guide after spawnCreep() succeeds"],
  ["engine-boundary", "What the completion step actually checks"],
  ["direction-order", "Normalize preferred and fallback directions"],
  ["tile-snapshot", "Separate stable blockers from temporary occupancy"],
  ["plan", "Build one deterministic exit plan"],
  ["submit", "Reuse the same plan for dryRun and submission"],
  ["refresh", "Refresh directions near completion"],
  ["observe", "Verify retries and the first visible birth state"],
  ["failure-modes", "Common failure modes"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`
<h2 id="intent-boundary">Use this guide after spawnCreep() succeeds</h2>
<p>Use this page when the final <code>spawnCreep()</code> call returned <code>OK</code>, the named Creep exists in the spawning lifecycle, but completion appears delayed or the Creep does not become available on an adjacent tile. Use <a href="/en/blog/screeps-spawncreep-return-codes">the return-code guide</a> when the request itself was rejected. Use <a href="/en/blog/screeps-moveto-not-moving">the movement guide</a> only after the Creep has finished spawning and ordinary movement code is running.</p>
<p>The useful model is not “the Spawn is done, therefore the Creep must already be outside.” The completion step still needs one allowed adjacent tile that is usable during settlement.</p>

<h2 id="engine-boundary">What the completion step actually checks</h2>
<p>The public API accepts an ordered <code>directions</code> array containing direction constants from <code>TOP</code> through <code>TOP_LEFT</code>. The pinned public engine source checks those directions in order, rejects stable obstacle objects and blocking construction sites, consults movement occupancy, and retries completion on a later tick when no permitted tile succeeds. A direction list changes the search order and allowed set; it does not remove an obstacle or reserve a tile.</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>What it supports</th><th>What it does not prove</th></tr></thead>
<tbody>
<tr><td><code>spawnCreep() === OK</code></td><td>The spawn request was scheduled</td><td>The Creep already exited</td></tr>
<tr><td><code>setDirections() === OK</code></td><td>The update intent was accepted</td><td>Any listed tile is now free</td></tr>
<tr><td>One empty-looking tile</td><td>A current script-visible candidate</td><td>No same-tick movement contention</td></tr>
<tr><td>Repeated near-complete observations</td><td>The process did not finish immediately</td><td>The exact blocking object without a tile snapshot</td></tr>
</tbody></table></div>

<h2 id="direction-order">Normalize preferred and fallback directions</h2>
<p>Do not let an invalid or single-direction configuration silently remove every fallback. Preserve the player's preferred order, discard invalid values and duplicates, then append the remaining directions.</p>
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

function normalizeSpawnDirections(input) {
  const preferred = Array.isArray(input)
    ? input
    : [];
  const valid = [];
  const seen = new Set();

  for (const direction of preferred) {
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

  for (const direction of ALL_SPAWN_DIRECTIONS) {
    if (!seen.has(direction)) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  return valid;
}</code></pre>
<p>A true one-exit layout can still pass one direction deliberately. That is a policy choice with an explicit waiting risk, not a safe default for every room.</p>

<h2 id="tile-snapshot">Separate stable blockers from temporary occupancy</h2>
<p>A terrain wall or obstacle structure is a stable layout problem. A Creep or Power Creep on an otherwise passable tile is usually temporary. Keep those states separate so a unit standing beside the Spawn now does not permanently remove a direction needed many spawning ticks later.</p>
<pre><code class="language-javascript">function structureBlocksSpawnExit(structure) {
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
    structure =&gt;
      structure.structureType === STRUCTURE_ROAD
  );
  const terrain = spawn.room.getTerrain().get(x, y);
  const terrainBlocked =
    (terrain &amp; TERRAIN_MASK_WALL) !== 0
    &amp;&amp; !hasRoad;
  const stableBlocked =
    terrainBlocked
    || structures.some(structureBlocksSpawnExit)
    || sites.some(site =&gt;
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
    currentlyOpen: !stableBlocked &amp;&amp; !occupied
  };
}</code></pre>
<p>This is a script-visible snapshot, not the engine's internal movement reservation table. Same-tick movement can change the result before settlement, so keep uncertainty visible.</p>

<h2 id="plan">Build one deterministic exit plan</h2>
<p>Exclude stable blockers, place currently open tiles before temporarily occupied tiles, and preserve normalized preference order inside each group.</p>
<pre><code class="language-javascript">function planSpawnExitDirections(
  spawn,
  preferredDirections
) {
  const snapshots = normalizeSpawnDirections(
    preferredDirections
  ).map(direction =&gt;
    inspectSpawnExitTile(spawn, direction)
  );

  const stable = snapshots.filter(
    item =&gt; item.stablePassable
  );
  const open = stable.filter(
    item =&gt; item.currentlyOpen
  );
  const occupied = stable.filter(
    item =&gt; !item.currentlyOpen
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
    ].map(item =&gt; item.direction),
    snapshots
  };
}</code></pre>
<p>Keeping temporarily occupied but structurally valid tiles at the end matters because the request may complete much later. Removing every currently occupied direction can turn a short traffic conflict into a self-imposed permanent restriction.</p>

<h2 id="submit">Reuse the same plan for dryRun and submission</h2>
<p>Use one immutable plan for the preflight and final request. Recomputing between calls makes the recorded preflight evidence describe a different request.</p>
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

  const result = spawn.spawnCreep(
    body,
    name,
    options
  );

  Memory.spawnExitChecks ??= {};
  Memory.spawnExitChecks[name] = {
    spawnId: spawn.id,
    name,
    submittedAt: Game.time,
    directions: [...plan.directions],
    result,
    lastObservedAt: Game.time,
    nearCompleteTicks: 0
  };

  return {
    status: result === OK
      ? 'spawn-scheduled'
      : 'spawn-submit-rejected',
    result,
    plan
  };
}</code></pre>
<p>The final call can still differ from <code>dryRun</code> because another same-tick module may consume the Spawn, name, or Energy first. Preserve the final return code.</p>

<h2 id="refresh">Refresh directions near completion</h2>
<p>For a long body, the tile that was open at submission may be occupied at completion. One Spawn coordinator may refresh the ordered list shortly before completion:</p>
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
<p>Do not let role modules compete to call <code>setDirections()</code>. The final direction state should come from one coordinator with one observable result.</p>

<h2 id="observe">Verify retries and the first visible birth state</h2>
<p>Observe the same Spawn and Creep name across ticks. A repeated near-complete process supports a local “completion retry observed” diagnosis. It does not identify the blocker without the corresponding tile snapshots.</p>
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
    ).find(([, offset]) =&gt;
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
<p>The Creep may receive a movement intent immediately after birth. If it has already left range 1 before observation, record that the birth direction was missed instead of inferring it from a later position.</p>

<h2 id="failure-modes">Common failure modes</h2>
<ul>
<li><strong>Only one direction is allowed:</strong> a temporary occupant can force the process to wait even while another adjacent tile is free.</li>
<li><strong>Current occupancy is treated as permanent:</strong> a Hauler present at submission may leave long before completion.</li>
<li><strong>Every module refreshes directions:</strong> the final order depends on module execution order rather than one policy.</li>
<li><strong><code>OK</code> is renamed “born”:</strong> accepted requests and observed birth are different evidence states.</li>
<li><strong>Spawn diagnostics continue after birth:</strong> once <code>creep.spawning === false</code>, ordinary movement and pathfinding guides own the next problem.</li>
</ul>

<h2 id="evidence">Evidence and production boundary</h2>
<p>This revision checks the public API and pinned engine source, syntax-checks every JavaScript block, and runs 53 offline assertions covering direction normalization, fallback order, stable blockers, temporary occupancy, deterministic planning, no-exit states, completion retries, observable adjacent birth, missed direction windows, and invalid observations.</p>
<p>Genuine Screeps Console output, official-shard completion retries, same-tick traffic, Power Creeps, hostile occupancy and spawnstomp, screenshots, and long-running production evidence remain pending.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">StructureSpawn.spawnCreep()</a>, <a href="https://docs.screeps.com/api/#StructureSpawn.Spawning" rel="nofollow">StructureSpawn.Spawning</a>, <a href="https://docs.screeps.com/api/#StructureSpawn.Spawning.setDirections" rel="nofollow">setDirections()</a>, and <a href="https://docs.screeps.com/scripting-basics.html" rel="nofollow">the game-loop model</a>.</p>
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
      readingTime="17 min read"
      tags={["Spawn", "Movement", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — spawnCreep directions and Spawning.setDirections boundaries",
        },
        {
          term: "Public engine source",
          value:
            "Checked — ordered exit search, obstacle checks and later-tick completion retry",
        },
        {
          term: "JavaScript syntax",
          value: "Passed by the article simulation gate",
        },
        {
          term: "Offline cases",
          value: "53 direction-planning and observation assertions passed",
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
          term: "Evidence level",
          value:
            "Official source review, repository integration, syntax checks and offline simulation only",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
