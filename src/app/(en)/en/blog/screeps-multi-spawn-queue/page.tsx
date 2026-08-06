import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-multi-spawn-queue";
const chinesePath = "/blog/screeps-multi-spawn-queue";
const headline =
  "Screeps Multi-Spawn Queue: Priority, Deduplication, and Shared Energy";
const description =
  "Centralize Creep demand, deduplicate stable request keys, rank emergency and replacement work, reserve shared room Energy locally, assign each idle Spawn once, and verify accepted names on later ticks.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps multi Spawn queue",
    "Screeps Spawn scheduler",
    "Screeps spawn priority",
    "Screeps spawnCreep dryRun shared Energy",
    "Screeps Creep request deduplication",
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
    tags: discovery?.tags ?? ["Spawn", "Creeps", "Automation"],
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
  ["quick-answer", "Quick answer"],
  ["centralize-demand", "Centralize demand before touching a Spawn"],
  ["request-contract", "Define one stable request contract"],
  ["deduplicate", "Deduplicate by business identity"],
  ["priority", "Use stable priority and bounded aging"],
  ["shared-energy", "Reserve one shared room Energy budget"],
  ["dry-run", "Use dryRun as validation, not a reservation"],
  ["assign", "Assign every idle Spawn at most once"],
  ["pending", "Track accepted names as pending evidence"],
  ["verify", "Verify spawning or release on later ticks"],
  ["complete-scheduler", "Build the complete room scheduler"],
  ["policy", "Choose blocking and fallback policy explicitly"],
  ["failure-modes", "Common failure modes"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Do not let Harvester, Upgrader, remote, replacement, and defense modules call <code>spawnCreep()</code> independently. Let them emit demand records. One room scheduler validates those records, deduplicates a stable <code>requestKey</code>, sorts priority, assigns each idle Spawn once, maintains one local Energy budget for the shared Spawn and Extension pool, submits the command, and records the exact accepted name for later observation.</p>
<p><code>dryRun: true</code> validates one request against the current script-visible state. It does not reserve Energy for another Spawn in the same room. The game loop reads a tick-start snapshot and resolves accumulated intents later, while multiple Spawns may draw from the same room Extensions. A scheduler therefore needs its own same-tick budget before it submits multiple requests.</p>

<h2 id="centralize-demand">Centralize demand before touching a Spawn</h2>
<p>A role module should describe what is missing, not select a Spawn. Two independent modules can otherwise select the same Spawn, create duplicate role demand, invert emergency priority, or produce logs that cannot explain which request actually became a Creep.</p>
<pre><code class="language-javascript">function collectRoomDemand(room) {
  const requests = [];

  if (countWorkingRole(room, 'harvester') &lt; 2) {
    requests.push({
      requestKey:
        room.name + ':local:harvester:source-0',
      roomName: room.name,
      role: 'harvester',
      body: [WORK, CARRY, MOVE],
      priority: 700,
      createdAt: Game.time,
      expiresAt: Game.time + 10,
      memory: {
        role: 'harvester',
        sourceIndex: 0
      }
    });
  }

  return requests;
}</code></pre>
<p>The stable key represents one business obligation. A generated Creep name represents one attempted game object. Keep those identities separate.</p>

<h2 id="request-contract">Define one stable request contract</h2>
<pre><code class="language-javascript">function calculateBodyCost(body) {
  if (!Array.isArray(body)) {
    return null;
  }

  let cost = 0;

  for (const part of body) {
    const partCost = BODYPART_COST[part];

    if (!Number.isFinite(partCost)) {
      return null;
    }

    cost += partCost;
  }

  return cost;
}

function validateSpawnRequest(request) {
  if (
    !request
    || typeof request.requestKey !== 'string'
    || request.requestKey.trim() === ''
  ) {
    return {
      ok: false,
      reason: 'invalid-request-key'
    };
  }

  if (
    typeof request.roomName !== 'string'
    || !Game.rooms[request.roomName]
  ) {
    return {
      ok: false,
      reason: 'room-not-visible'
    };
  }

  if (
    !Array.isArray(request.body)
    || request.body.length === 0
    || request.body.length &gt; MAX_CREEP_SIZE
  ) {
    return {
      ok: false,
      reason: 'invalid-body-length'
    };
  }

  const cost = calculateBodyCost(request.body);

  if (!Number.isInteger(cost) || cost &lt;= 0) {
    return {
      ok: false,
      reason: 'invalid-body-parts'
    };
  }

  if (
    !Number.isFinite(request.priority)
    || !Number.isInteger(request.createdAt)
    || !Number.isInteger(request.expiresAt)
    || request.expiresAt &lt; request.createdAt
  ) {
    return {
      ok: false,
      reason: 'invalid-scheduling-fields'
    };
  }

  return {
    ok: true,
    cost
  };
}</code></pre>
<p>Useful request fields include <code>requestKey</code>, room, role, body, priority, creation and expiry ticks, initial Memory, optional directions, and optional preferred Spawn names. Reject malformed records at the queue boundary so one bad module does not stop the whole scheduler.</p>

<h2 id="deduplicate">Deduplicate by business identity</h2>
<pre><code class="language-javascript">function requestFingerprint(request) {
  return JSON.stringify({
    roomName: request.roomName,
    role: request.role,
    body: request.body,
    memory: request.memory,
    directions: request.directions ?? null
  });
}

function deduplicateRequests(requests) {
  const byKey = new Map();
  const conflicts = [];

  for (const request of requests) {
    const previous = byKey.get(request.requestKey);

    if (!previous) {
      byKey.set(request.requestKey, request);
      continue;
    }

    if (
      requestFingerprint(previous)
        !== requestFingerprint(request)
    ) {
      conflicts.push({
        requestKey: request.requestKey,
        status: 'request-definition-conflict'
      });
      continue;
    }

    if (
      request.priority &gt; previous.priority
      || (
        request.priority === previous.priority
        &amp;&amp; request.createdAt &lt; previous.createdAt
      )
    ) {
      byKey.set(request.requestKey, request);
    }
  }

  return {
    requests: [...byKey.values()],
    conflicts
  };
}</code></pre>
<p>A new random key every tick disables deduplication. A Creep name also makes a poor demand key because replacements create new names while satisfying the same business slot.</p>

<h2 id="priority">Use stable priority and bounded aging</h2>
<pre><code class="language-javascript">const SPAWN_PRIORITY = Object.freeze({
  EMERGENCY_RECOVERY: 1000,
  ACTIVE_DEFENSE: 900,
  CONTROLLER_SAFETY: 800,
  ESSENTIAL_ECONOMY: 700,
  REPLACEMENT: 600,
  NORMAL_ECONOMY: 400,
  REMOTE_EXPANSION: 200,
  OPTIONAL: 100
});

function effectivePriority(
  request,
  now,
  options = {}
) {
  const waitStep = options.waitStep ?? 50;
  const maxBonus = options.maxBonus ?? 100;
  const waited = Math.max(
    0,
    now - request.createdAt
  );

  return request.priority + Math.min(
    maxBonus,
    Math.floor(waited / waitStep)
  );
}

function sortSpawnRequests(requests, now) {
  return [...requests].sort((left, right) =&gt;
    effectivePriority(right, now)
      - effectivePriority(left, now)
    || left.createdAt - right.createdAt
    || left.requestKey.localeCompare(
      right.requestKey
    )
  );
}</code></pre>
<p>A bounded waiting bonus prevents ordinary work from starving forever without allowing an optional Builder to overtake emergency recovery or active defense.</p>

<h2 id="shared-energy">Reserve one shared room Energy budget</h2>
<p>Extensions in one room may be used by multiple Spawns. The script sees the beginning-of-tick room state, and commands are resolved later. The local budget below prevents this scheduler from promising the same observed Energy twice.</p>
<pre><code class="language-javascript">function createRoomEnergyBudget(room) {
  return {
    roomName: room.name,
    observedAt: Game.time,
    observedEnergy: room.energyAvailable,
    reservedEnergy: 0
  };
}

function remainingBudget(budget) {
  return Math.max(
    0,
    budget.observedEnergy
      - budget.reservedEnergy
  );
}

function reserveEnergy(budget, amount) {
  if (
    !Number.isInteger(amount)
    || amount &lt;= 0
    || amount &gt; remainingBudget(budget)
  ) {
    return false;
  }

  budget.reservedEnergy += amount;
  return true;
}</code></pre>
<p>This is a scheduling invariant, not an official server lock. Other code outside the scheduler can still create conflicts. Keep all Spawn creation ownership in one place.</p>

<h2 id="dry-run">Use dryRun as validation, not a reservation</h2>
<pre><code class="language-javascript">function submitSpawnRequest(
  spawn,
  request,
  creepName,
  budget
) {
  const validation = validateSpawnRequest(
    request
  );

  if (!validation.ok) {
    return {
      status: 'invalid-request',
      reason: validation.reason
    };
  }

  if (validation.cost &gt; remainingBudget(budget)) {
    return {
      status: 'local-budget-insufficient',
      cost: validation.cost,
      remaining: remainingBudget(budget)
    };
  }

  const options = {
    memory: request.memory,
    directions: request.directions
  };
  const dryRunResult = spawn.spawnCreep(
    request.body,
    creepName,
    {
      ...options,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      result: dryRunResult
    };
  }

  const result = spawn.spawnCreep(
    request.body,
    creepName,
    options
  );

  if (result !== OK) {
    return {
      status: 'submission-rejected',
      result
    };
  }

  if (!reserveEnergy(budget, validation.cost)) {
    return {
      status: 'budget-invariant-failed',
      result,
      cost: validation.cost
    };
  }

  return {
    status: 'submitted-locally',
    result,
    requestKey: request.requestKey,
    spawnName: spawn.name,
    creepName,
    cost: validation.cost,
    submittedAt: Game.time
  };
}</code></pre>
<p><code>OK</code> is an accepted local command state. It is not evidence that the next world state already contains an active Creep.</p>

<h2 id="assign">Assign every idle Spawn at most once</h2>
<pre><code class="language-javascript">function getIdleSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =&gt;
      spawn.my
      &amp;&amp; spawn.isActive()
      &amp;&amp; !spawn.spawning
    )
    .sort((left, right) =&gt;
      left.name.localeCompare(right.name)
    );
}

function rankSpawns(request, spawns) {
  const preferred = new Set(
    request.preferredSpawnNames ?? []
  );

  return [...spawns].sort((left, right) =&gt;
    Number(!preferred.has(left.name))
      - Number(!preferred.has(right.name))
    || left.name.localeCompare(right.name)
  );
}</code></pre>
<p>Preference changes order; it should not normally turn an available emergency request into a no-Spawn state merely because its first choice is busy.</p>

<h2 id="pending">Track accepted names as pending evidence</h2>
<pre><code class="language-javascript">function savePendingSpawn(outcome, request) {
  if (outcome.status !== 'submitted-locally') {
    return false;
  }

  Memory.spawnScheduler ??= {
    version: 1,
    pending: {},
    completed: {}
  };
  Memory.spawnScheduler.pending[
    outcome.requestKey
  ] = {
    requestKey: outcome.requestKey,
    roomName: request.roomName,
    role: request.role,
    spawnName: outcome.spawnName,
    creepName: outcome.creepName,
    cost: outcome.cost,
    submittedAt: outcome.submittedAt,
    lastCheckedAt: null
  };

  return true;
}</code></pre>
<p>Pending records stop the demand collector from creating the same slot again while the accepted name has not yet appeared in the later observed state.</p>

<h2 id="verify">Verify spawning or release on later ticks</h2>
<pre><code class="language-javascript">function verifyPendingSpawn(pending) {
  const spawn = Game.spawns[
    pending.spawnName
  ] ?? null;
  const creep = Game.creeps[
    pending.creepName
  ] ?? null;

  if (
    spawn?.spawning?.name
      === pending.creepName
  ) {
    return {
      status: 'spawning-observed',
      requestKey: pending.requestKey,
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  if (creep) {
    return {
      status: creep.spawning
        ? 'spawning-creep-observed'
        : 'creep-released',
      requestKey: pending.requestKey,
      creepName: pending.creepName
    };
  }

  return {
    status: 'not-observed-yet',
    requestKey: pending.requestKey,
    creepName: pending.creepName
  };
}

function pendingTimedOut(
  pending,
  now,
  timeoutTicks = 2
) {
  return now - pending.submittedAt
    &gt;= timeoutTicks;
}</code></pre>
<p>Do not immediately retry <code>not-observed-yet</code> in the same tick. Give the accepted intent a later observation boundary, then record timeout evidence before requeueing.</p>

<h2 id="complete-scheduler">Build the complete room scheduler</h2>
<pre><code class="language-javascript">function buildCreepName(request, sequence) {
  const role = String(request.role)
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .slice(0, 24);

  return [
    role,
    request.roomName,
    Game.time,
    sequence
  ].join('-').slice(0, 100);
}

function scheduleRoomSpawns(
  room,
  rawRequests
) {
  const deduplicated = deduplicateRequests(
    rawRequests
  );
  const requests = sortSpawnRequests(
    deduplicated.requests.filter(request =&gt;
      request.roomName === room.name
      &amp;&amp; request.expiresAt &gt;= Game.time
    ),
    Game.time
  );
  const idleSpawns = getIdleSpawns(room);
  const assigned = new Set();
  const budget = createRoomEnergyBudget(room);
  const outcomes = [
    ...deduplicated.conflicts
  ];
  let sequence = 0;

  for (const request of requests) {
    const candidates = rankSpawns(
      request,
      idleSpawns.filter(spawn =&gt;
        !assigned.has(spawn.name)
      )
    );
    const spawn = candidates[0];

    if (!spawn) {
      outcomes.push({
        status: 'no-idle-spawn',
        requestKey: request.requestKey
      });
      continue;
    }

    sequence += 1;
    const outcome = submitSpawnRequest(
      spawn,
      request,
      buildCreepName(request, sequence),
      budget
    );
    outcomes.push(outcome);

    if (outcome.status === 'submitted-locally') {
      assigned.add(spawn.name);
      savePendingSpawn(outcome, request);
    }
  }

  return {
    roomName: room.name,
    observedEnergy: budget.observedEnergy,
    reservedEnergy: budget.reservedEnergy,
    remainingEnergy: remainingBudget(budget),
    outcomes
  };
}</code></pre>
<p>The loop continues after one malformed or rejected request. Whether an unaffordable high-priority request blocks smaller lower-priority work is a separate policy decision.</p>

<h2 id="policy">Choose blocking and fallback policy explicitly</h2>
<p>Strict priority preserves Energy for a critical large body but may leave idle Spawn capacity. A skip policy improves utilization but may starve the large request. Add a request field such as <code>blocking: true</code> when an unaffordable critical request should stop lower-priority scheduling.</p>
<p>Emergency recovery should normally provide a minimum viable fallback body rather than waiting indefinitely for the full design. Combine this scheduler with <a href="/en/blog/screeps-emergency-harvester-recovery">the emergency recovery guide</a>, <a href="/en/blog/screeps-dynamic-creep-body">dynamic body selection</a>, and <a href="/en/blog/screeps-creep-prespawn-replacement">prespawn replacement</a>.</p>

<h2 id="failure-modes">Common failure modes</h2>
<ul>
<li><strong>Every role manager calls spawnCreep():</strong> no global priority or deduplication exists.</li>
<li><strong>The key contains Game.time or randomness:</strong> the same demand becomes a new request every tick.</li>
<li><strong>Only dryRun is trusted:</strong> multiple Spawns can validate against the same observed room Energy.</li>
<li><strong>OK is renamed completed:</strong> accepted local submission and later world evidence are conflated.</li>
<li><strong>Spawning and pending coverage is ignored:</strong> duplicate replacements enter the queue.</li>
<li><strong>One Spawn is assigned twice:</strong> the scheduler does not track same-tick assignment.</li>
<li><strong>Requests never expire:</strong> cancelled remote plans can execute much later.</li>
<li><strong>Priority never ages or always skips:</strong> either small work starves or critical large bodies never accumulate Energy.</li>
</ul>

<h2 id="evidence">Evidence and production boundary</h2>
<p>This revision checks the current official API, the documented tick-start snapshot and later intent resolution model, shared room Extension behavior, and the public engine's Spawn validation and Energy charging path. Repository tests syntax-check the examples and run deterministic cases for deduplication, fingerprint conflicts, stable sorting, bounded aging, room Energy reservation, one-assignment-per-Spawn, pending records, and later observation states.</p>
<p>Screeps Console evidence, official-shard same-tick multi-Spawn Energy contention, exact intent processing order, Power effects, and long-running CPU cost remain pending. The article therefore reports <code>submitted-locally</code>, <code>spawning-observed</code>, and <code>creep-released</code> as separate states.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">StructureSpawn.spawnCreep()</a>, <a href="https://docs.screeps.com/api/Game.html#spawns" rel="nofollow">Game.spawns</a>, <a href="https://docs.screeps.com/game-loop.html" rel="nofollow">the game-loop model</a>, <a href="https://docs.screeps.com/creeps.html" rel="nofollow">shared Spawn and Extension Energy</a>, and <a href="https://docs.screeps.com/debugging.html" rel="nofollow">return-code debugging</a>.</p>
`;

export default function MultiSpawnQueuePage() {
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
        sameAs: [siteConfig.links.github],
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
      breadcrumbLabel="Multi-Spawn queue"
      category="SPAWNING · QUEUE SCHEDULING"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="20 min read"
      tags={["Spawn", "Creeps", "Automation", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — Game.spawns, spawnCreep(), dryRun, return codes and Spawn busy state",
        },
        {
          term: "Tick and Energy model",
          value:
            "Checked — tick-start snapshot, later intent resolution and shared room Extensions",
        },
        {
          term: "Public engine source",
          value:
            "Checked — runtime validation and create-creep Energy charging path",
        },
        {
          term: "JavaScript syntax",
          value: "Passed by the article simulation gate",
        },
        {
          term: "Offline scheduler cases",
          value:
            "Passed — deduplication, stable priority, bounded aging, shared budget, single assignment and pending verification",
        },
        {
          term: "Screeps Console test",
          value: "Pending",
        },
        {
          term: "Official-shard multi-Spawn test",
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
