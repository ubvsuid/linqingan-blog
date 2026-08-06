import type { Metadata } from "next";

import { EnglishArticlePage } from "@/components/english-article-page";
import { getEnglishDiscoveryArticle } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

const path = "/en/blog/screeps-multiple-spawn-queue-coordinator";
const chinesePath = "/blog/screeps-multiple-spawn-queue-coordinator";
const headline =
  "Screeps Multiple Spawn Queue: Coordinate Priority, Names, and Energy";
const description =
  "Coordinate several owned Spawns through one room queue, reserve global names, budget shared room Energy once, submit deterministically, and verify exact requests later.";
const publishedAt = "2026-08-06";
const publishedLabel = "August 6, 2026";
const modifiedTime = "2026-08-06";
const discovery = getEnglishDiscoveryArticle(path);
const articleUrl = `${siteConfig.url}${path}`;

export const metadata: Metadata = {
  title: { absolute: `${headline} | Linqingan` },
  description,
  keywords: [
    "Screeps multiple Spawn queue",
    "Screeps Spawn coordinator",
    "Screeps spawnCreep priority queue",
    "Screeps shared room Energy budget",
    "Screeps multiple Spawns",
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
    tags: discovery?.tags ?? ["Spawn", "Creeps", "Debugging"],
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
  ["intent-boundary", "Use this guide when several Spawns compete"],
  ["api-boundary", "What the API does not reserve"],
  ["request-state", "Freeze requests and reserve names"],
  ["enqueue", "Let business modules enqueue"],
  ["plan", "Sort once and budget shared Energy"],
  ["finalize", "Finalize once after all producers"],
  ["observe", "Observe and cancel exact requests"],
  ["loop-order", "Keep one main-loop order"],
  ["failure-modes", "Common failure modes"],
  ["evidence", "Evidence and production boundary"],
];

const articleHtml = String.raw`
<h2 id="intent-boundary">Use this guide when several Spawns compete for one room</h2>
<p>Use this page when a room owns two or more Spawns and several role or recovery modules can request Creeps during the same tick. The room must decide which requests exist, which names are globally reserved, which idle Spawn owns each request, and how much shared Spawn-and-Extension Energy remains after every planned assignment.</p>
<p>Use <a href="/en/blog/screeps-spawncreep-return-codes">the return-code guide</a> for one rejected call. Use <a href="/en/blog/screeps-creep-prespawn-replacement">the prespawn replacement guide</a> to decide when a role needs a successor. Use <a href="/en/blog/screeps-spawn-exit-blocked-directions">the exit guide</a> after a request was scheduled but cannot complete birth. This article owns the room-level coordination step before final submission.</p>

<h2 id="api-boundary">What the API guarantees—and what it does not reserve</h2>
<p>The official API validates a body of 1–50 parts, requires a nonempty name no longer than 100 characters, returns <code>ERR_BUSY</code> for a busy Spawn, and returns <code>ERR_NOT_ENOUGH_ENERGY</code> when the room Spawn-and-Extension network cannot pay the body cost. A successful final call schedules the Creep. A <code>dryRun</code> only evaluates that call; it does not reserve a Spawn, name, or room Energy for another module.</p>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>Supported conclusion</th><th>Unsupported conclusion</th></tr></thead>
<tbody>
<tr><td><code>dryRun === OK</code></td><td>The exact request was possible then</td><td>The inputs are locked</td></tr>
<tr><td><code>spawnCreep() === OK</code></td><td>That Spawn scheduled that name</td><td>The Creep completed birth</td></tr>
<tr><td><code>room.energyAvailable</code></td><td>Current shared spawn-network Energy</td><td>A separate budget per Spawn</td></tr>
<tr><td>Two idle Spawns</td><td>At most two assignments are possible</td><td>Both can spend the full room total</td></tr>
</tbody></table></div>

<h2 id="request-state">Freeze requests and reserve names globally</h2>
<p>Business modules should enqueue immutable JSON-compatible data, not game objects or callbacks. The request key identifies one business need. Repeating the same need must produce the same key; changing the body, Memory, name, or priority requires a new key or an explicit cancellation.</p>
<pre><code class="language-javascript">function getCreepBodyCost(body) {
  if (!Array.isArray(body) || body.length &lt; 1 || body.length &gt; 50) {
    return null;
  }
  let total = 0;
  for (const part of body) {
    const cost = BODYPART_COST[part];
    if (!Number.isFinite(cost)) return null;
    total += cost;
  }
  return total;
}

function cloneSpawnMemory(memory) {
  try {
    const serialized = JSON.stringify(memory ?? {});
    return serialized === undefined ? null : JSON.parse(serialized);
  } catch {
    return null;
  }
}

function normalizeSpawnRequest(input) {
  const body = Array.isArray(input?.body) ? [...input.body] : null;
  const bodyCost = getCreepBodyCost(body);
  const memory = cloneSpawnMemory(input?.memory);
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const requestKey = typeof input?.requestKey === 'string'
    ? input.requestKey.trim()
    : '';
  const priority = Number.isInteger(input?.priority) ? input.priority : 100;

  if (bodyCost === null) return { status: 'body-invalid' };
  if (name.length &lt; 1 || name.length &gt; 100) return { status: 'name-invalid' };
  if (requestKey.length &lt; 1) return { status: 'request-key-required' };
  if (memory === null) return { status: 'memory-not-json-compatible' };

  return {
    status: 'request-valid',
    request: { requestKey, name, body, bodyCost, memory, priority }
  };
}

function getSpawnCoordinatorMemory() {
  Memory.spawnCoordinator ??= { rooms: {} };
  return Memory.spawnCoordinator;
}

function getRoomSpawnQueue(roomName) {
  const coordinator = getSpawnCoordinatorMemory();
  coordinator.rooms[roomName] ??= {
    nextSequence: 1,
    finalizedTick: null,
    jobs: [],
    submissions: [],
    history: []
  };
  return coordinator.rooms[roomName];
}

function sameSpawnRequest(left, right) {
  return left.requestKey === right.requestKey
    &amp;&amp; left.name === right.name
    &amp;&amp; left.priority === right.priority
    &amp;&amp; JSON.stringify(left.body) === JSON.stringify(right.body)
    &amp;&amp; JSON.stringify(left.memory) === JSON.stringify(right.memory);
}

function isNameReserved(name) {
  if (Game.creeps[name]) return true;
  const coordinator = getSpawnCoordinatorMemory();
  return Object.values(coordinator.rooms).some(roomState =&gt;
    roomState.jobs.some(job =&gt;
      job.name === name &amp;&amp; job.status === 'queued'
    ) || roomState.submissions.some(submission =&gt;
      submission.name === name
      &amp;&amp; submission.status !== 'born'
      &amp;&amp; submission.status !== 'failed'
    )
  );
}</code></pre>
<p>Name protection is global because Creep names are keys in <code>Game.creeps</code>, not room-local identifiers.</p>

<h2 id="enqueue">Let business modules enqueue, never submit directly</h2>
<pre><code class="language-javascript">function enqueueSpawnRequest(roomName, input) {
  const room = Game.rooms[roomName];
  if (!room) return { status: 'room-not-visible', jobId: null };

  const normalized = normalizeSpawnRequest(input);
  if (normalized.status !== 'request-valid') {
    return { status: normalized.status, jobId: null };
  }

  const request = normalized.request;
  const roomState = getRoomSpawnQueue(roomName);
  const existing = roomState.jobs.find(job =&gt;
    job.requestKey === request.requestKey &amp;&amp; job.status === 'queued'
  );

  if (existing) {
    return sameSpawnRequest(existing, request)
      ? { status: 'already-queued', jobId: existing.id }
      : { status: 'request-key-conflict', jobId: existing.id };
  }

  if (request.bodyCost &gt; room.energyCapacityAvailable) {
    return { status: 'body-exceeds-room-capacity', jobId: null };
  }
  if (isNameReserved(request.name)) {
    return { status: 'creep-name-reserved', jobId: null };
  }

  const sequence = roomState.nextSequence++;
  const job = {
    id: roomName + ':' + Game.time + ':' + sequence,
    roomName,
    sequence,
    createdAt: Game.time,
    status: 'queued',
    ...request
  };
  roomState.jobs.push(job);
  return { status: 'queued', jobId: job.id };
}</code></pre>
<p>Idempotent enqueueing prevents repeated role checks from creating duplicate work. A request-key conflict stays visible instead of silently replacing the earlier request.</p>

<h2 id="plan">Sort once and budget shared Energy once</h2>
<p>This policy treats larger numeric priorities as more important. Equal priorities use creation tick, sequence, and ID. Idle active owned Spawns use name and ID so object-array order cannot change the result.</p>
<pre><code class="language-javascript">function getIdleOwnedSpawns(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =&gt;
      structure.structureType === STRUCTURE_SPAWN
      &amp;&amp; structure.my
      &amp;&amp; structure.isActive()
      &amp;&amp; structure.spawning === null
  }).sort((left, right) =&gt;
    left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
  );
}

function compareSpawnJobs(left, right) {
  return right.priority - left.priority
    || left.createdAt - right.createdAt
    || left.sequence - right.sequence
    || left.id.localeCompare(right.id);
}

function buildRoomSpawnPlan(roomName) {
  const room = Game.rooms[roomName];
  if (!room) return { status: 'room-not-visible', assignments: [] };

  const roomState = getRoomSpawnQueue(roomName);
  const spawns = getIdleOwnedSpawns(room);
  const jobs = roomState.jobs
    .filter(job =&gt; job.status === 'queued')
    .sort(compareSpawnJobs);
  const assignments = [];
  const blocked = [];
  let remainingEnergy = room.energyAvailable;

  for (const spawn of spawns) {
    const job = jobs[assignments.length];
    if (!job) break;
    if (Game.creeps[job.name]) {
      blocked.push({ jobId: job.id, status: 'name-now-exists' });
      break;
    }
    if (job.bodyCost &gt; remainingEnergy) {
      blocked.push({
        jobId: job.id,
        status: 'waiting-for-room-energy',
        required: job.bodyCost,
        available: remainingEnergy
      });
      break;
    }
    assignments.push({
      spawnId: spawn.id,
      spawnName: spawn.name,
      jobId: job.id,
      name: job.name,
      bodyCost: job.bodyCost
    });
    remainingEnergy -= job.bodyCost;
  }

  return {
    status: assignments.length &gt; 0
      ? 'plan-ready'
      : blocked.length &gt; 0
        ? blocked[0].status
        : spawns.length === 0
          ? 'no-idle-spawn'
          : 'queue-empty',
    observedEnergy: room.energyAvailable,
    remainingPlannedEnergy: remainingEnergy,
    assignments,
    blocked
  };
}</code></pre>
<p>This is a strict head-of-line policy. If the highest-priority body cannot be paid, a cheaper lower-priority job does not bypass it. A bypass policy may be valid, but it must be explicit and record every skipped request.</p>

<h2 id="finalize">Finalize once after all producers have run</h2>
<pre><code class="language-javascript">function finalizeRoomSpawnQueue(roomName) {
  const roomState = getRoomSpawnQueue(roomName);
  if (roomState.finalizedTick === Game.time) {
    return { status: 'already-finalized-this-tick', attempts: [] };
  }
  roomState.finalizedTick = Game.time;

  const plan = buildRoomSpawnPlan(roomName);
  const attempts = [];

  for (const assignment of plan.assignments) {
    const spawn = Game.getObjectById(assignment.spawnId);
    const job = roomState.jobs.find(candidate =&gt;
      candidate.id === assignment.jobId &amp;&amp; candidate.status === 'queued'
    );

    if (!spawn || !job) {
      attempts.push({ ...assignment, status: 'assignment-stale' });
      break;
    }
    if (spawn.spawning !== null) {
      attempts.push({ ...assignment, status: 'spawn-became-busy' });
      break;
    }

    const options = { memory: job.memory };
    const dryRunResult = spawn.spawnCreep(job.body, job.name, {
      ...options,
      dryRun: true
    });
    if (dryRunResult !== OK) {
      attempts.push({
        ...assignment,
        status: 'dry-run-rejected',
        dryRunResult
      });
      break;
    }

    const result = spawn.spawnCreep(job.body, job.name, options);
    attempts.push({
      ...assignment,
      status: result === OK ? 'spawn-scheduled' : 'spawn-submit-rejected',
      dryRunResult,
      result
    });
    if (result !== OK) break;

    roomState.submissions.push({
      jobId: job.id,
      requestKey: job.requestKey,
      spawnId: spawn.id,
      spawnName: spawn.name,
      name: job.name,
      bodyCost: job.bodyCost,
      submittedAt: Game.time,
      needTime: spawn.spawning?.name === job.name
        ? spawn.spawning.needTime
        : null,
      status: 'submitted',
      result
    });
    roomState.jobs = roomState.jobs.filter(candidate =&gt; candidate.id !== job.id);
  }

  roomState.lastPlan = { tick: Game.time, ...plan, attempts };
  return {
    status: attempts.some(attempt =&gt; attempt.status === 'spawn-scheduled')
      ? 'batch-submitted'
      : plan.status,
    plan,
    attempts
  };
}</code></pre>
<p><code>dryRun</code> still does not lock the inputs. Under this strict policy, a stale assignment, newly busy Spawn, rejected dry run, or rejected final call stops the rest of the tick's batch, preventing lower-priority work from slipping past a failed head request.</p>

<h2 id="observe">Observe and cancel exact requests</h2>
<pre><code class="language-javascript">function observeRoomSpawnSubmissions(roomName) {
  const roomState = getRoomSpawnQueue(roomName);
  const observations = [];

  for (const submission of roomState.submissions) {
    const spawn = Game.getObjectById(submission.spawnId);
    const creep = Game.creeps[submission.name];

    if (creep?.spawning === true &amp;&amp; spawn?.spawning?.name === submission.name) {
      submission.status = 'confirmed-spawning';
    } else if (creep &amp;&amp; creep.spawning === false) {
      submission.status = 'born';
    } else if (spawn?.spawning?.name === submission.name) {
      submission.status = 'spawn-reports-requested-name';
    } else if (
      Number.isInteger(submission.needTime)
      &amp;&amp; Game.time &gt; submission.submittedAt + submission.needTime + 2
    ) {
      submission.status = 'completion-unverified';
    } else {
      submission.status = 'pending-observation';
    }

    observations.push({
      jobId: submission.jobId,
      name: submission.name,
      spawnId: submission.spawnId,
      status: submission.status
    });
  }

  const terminal = new Set(['born', 'completion-unverified']);
  roomState.history.push(
    ...roomState.submissions.filter(item =&gt; terminal.has(item.status))
  );
  roomState.history = roomState.history.slice(-30);
  roomState.submissions = roomState.submissions.filter(
    item =&gt; !terminal.has(item.status)
  );
  return observations;
}

function cancelQueuedSpawnJob(roomName, requestKey, reason = 'cancelled-by-policy') {
  const roomState = getRoomSpawnQueue(roomName);
  const job = roomState.jobs.find(candidate =&gt;
    candidate.requestKey === requestKey &amp;&amp; candidate.status === 'queued'
  );
  if (!job) return { status: 'queued-job-not-found' };

  roomState.jobs = roomState.jobs.filter(candidate =&gt; candidate.id !== job.id);
  roomState.history.push({
    ...job,
    status: 'cancelled',
    reason,
    finishedAt: Game.time
  });
  roomState.history = roomState.history.slice(-30);
  return { status: 'queued-job-cancelled', jobId: job.id };
}</code></pre>
<p>Submission, active spawning, and completed birth are distinct evidence states. <code>completion-unverified</code> means the intended observation window did not confirm the result; it is not proof that the engine lost the request. Cancellation should also become a terminal history record rather than a silent deletion.</p>

<h2 id="loop-order">Keep one main-loop order</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  for (const roomName of Object.keys(getSpawnCoordinatorMemory().rooms)) {
    observeRoomSpawnSubmissions(roomName);
  }

  runRoomBusinessLogic();

  for (const roomName of Object.keys(getSpawnCoordinatorMemory().rooms).sort()) {
    finalizeRoomSpawnQueue(roomName);
  }
};</code></pre>
<p>Observe the prior tick first, let business modules enqueue, then finalize each room once. Producers describe demand; the coordinator owns scheduling and final submission.</p>

<h2 id="failure-modes">Common failure modes</h2>
<ul>
<li><strong>Every role searches for its own idle Spawn:</strong> selection depends on module order and one Spawn may be targeted repeatedly.</li>
<li><strong>Every Spawn reads the full room Energy:</strong> two requests overcommit one shared resource pool.</li>
<li><strong><code>dryRun</code> is treated as a lock:</strong> later direct callers can still consume the name, Spawn, or Energy.</li>
<li><strong>A cheap job silently bypasses the head:</strong> routine work can starve emergency recovery.</li>
<li><strong>Accepted work disappears immediately:</strong> no job, Spawn, or name identity remains for later verification.</li>
<li><strong>A request key is overwritten:</strong> one business identity refers to incompatible bodies or policies.</li>
</ul>

<h2 id="evidence">Evidence and production boundary</h2>
<p>This article syntax-checks all 6 JavaScript blocks and runs 48 offline assertions covering body validation, JSON Memory cloning, request-key conflicts, global name reservations, deterministic ordering, idle Spawn filtering, shared Energy planning, strict head blocking, same-tick idempotency, failed-finalization stopping, and later spawning or birth observations.</p>
<p>Genuine Screeps Console output, a real multi-Spawn room, same-tick interference from legacy direct callers, official-shard Energy deduction order, completed births, screenshots, and long-running queue fairness evidence remain pending.</p>
<p>Official references: <a href="https://docs.screeps.com/api/#StructureSpawn.spawnCreep" rel="nofollow">StructureSpawn.spawnCreep()</a>, <a href="https://docs.screeps.com/api/#Room.energyAvailable" rel="nofollow">Room.energyAvailable</a>, <a href="https://docs.screeps.com/api/#Room.energyCapacityAvailable" rel="nofollow">Room.energyCapacityAvailable</a>, and <a href="https://docs.screeps.com/creeps.html" rel="nofollow">Creep creation and shared Extension Energy</a>.</p>
`;

export default function MultipleSpawnQueueCoordinatorPage() {
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
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/en` },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${siteConfig.url}/en/blog` },
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
      breadcrumbLabel="Multiple Spawn queue"
      category="SPAWNING · MULTI-SPAWN QUEUE COORDINATION"
      publishedAt={publishedAt}
      publishedLabel={publishedLabel}
      modifiedAt={modifiedTime}
      readingTime="19 min read"
      tags={["Spawn", "Creeps", "Debugging"]}
      verification={[
        {
          term: "Official API",
          value:
            "Checked — spawnCreep body, name, dryRun, busy, Energy, and scheduling boundaries",
        },
        {
          term: "Shared room Energy",
          value:
            "Checked — room.energyAvailable covers the room Spawn and Extension network",
        },
        {
          term: "JavaScript syntax",
          value: "6 article blocks passed Node.js 22 syntax checks",
        },
        {
          term: "Offline cases",
          value: "48 queue planning, finalization, and observation assertions passed",
        },
        { term: "Screeps Console test", value: "Pending" },
        { term: "Official-shard multi-Spawn verification", value: "Pending" },
        {
          term: "Evidence level",
          value:
            "Official documentation review, repository integration, syntax checks, and offline simulation only",
        },
      ]}
      toc={toc}
      articleHtml={articleHtml}
      jsonLd={jsonLd}
    />
  );
}
