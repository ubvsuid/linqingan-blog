import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialRecoveryConstructionOverride20260803 = {
  title: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
  headline: "Measure Construction Progress and Verify the Exact Builder Event",
  description: "Report progress and remaining work, submit one tracked build intent, match the exact Builder and Site in the next tick's EVENT_BUILD record, and separate completion from removal.",
  category: "CONSTRUCTION · PROGRESS AND EVENT IDENTITY",
  readingTime: "17 min read",
  breadcrumbLabel: "Construction Progress",
  tags: [
    "Screeps",
    "Construction Site",
    "Builder",
    "Events",
    "Debugging"
  ],
  keywords: [
    "Screeps ConstructionSite progress",
    "Screeps EVENT_BUILD",
    "Screeps Builder verification",
    "Construction Site completion vs removal",
    "Room.getEventLog build"
  ],
  primaryKeyword: "Screeps ConstructionSite progress",
  searchIntent: "Measure current Construction Site state and attribute one accepted build intent to the exact Builder and Site across ticks",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved"
    ],
    [
      "Official docs",
      "Checked — ConstructionSite, Creep.build(), Room.getEventLog(), object identity, and tick timing"
    ],
    [
      "Static API review",
      "Passed — progress reporting, exact Builder/Site event identity, completion, removal, and missed window"
    ],
    [
      "Offline state review",
      "Passed — progress clamps, preflight, accepted, active, completed, missing, ambiguous, and missed-window states"
    ],
    [
      "Human editorial pass",
      "Passed"
    ],
    [
      "Screeps Console test",
      "Pending"
    ],
    [
      "Live multi-tick verification",
      "Pending"
    ],
    [
      "Genuine room or Console screenshots",
      "Pending"
    ],
    [
      "Last verified",
      "August 3, 2026"
    ]
  ],
  toc: [
    [
      "use-this-guide",
      "Use this guide when"
    ],
    [
      "progress-fields",
      "Read the official progress fields"
    ],
    [
      "report",
      "Build a stable current-state report"
    ],
    [
      "preflight",
      "Preflight one tracked Builder action"
    ],
    [
      "submit",
      "Submit and save the exact identities"
    ],
    [
      "verify-event",
      "Match the next tick's exact build event"
    ],
    [
      "verification-order",
      "Verify before submitting the next sample"
    ],
    [
      "completion-states",
      "Interpret disappearance carefully"
    ],
    [
      "no-eta",
      "Do not invent an ETA from remaining work"
    ],
    [
      "return-codes",
      "Return-code boundaries"
    ],
    [
      "production-adaptation",
      "Production adaptation notes"
    ],
    [
      "verification",
      "Verification status and evidence boundary"
    ],
    [
      "official-docs",
      "Official documentation"
    ]
  ],
  faq: [],
  articleHtml: `
<h2 id="use-this-guide">Use this guide when</h2>
<p>Use the first half of this guide to report current Construction Site progress. Use the tracked-build workflow when you need to prove that one specific Builder's accepted <code>build()</code> intent produced the next tick's build event.</p>
<p>Choose <a href="/en/blog/screeps-room-create-construction-site">the site-creation guide</a> when the site does not exist yet. This page does not create, remove, or prioritize sites for an entire room.</p>

<h2 id="progress-fields">Read the official progress fields</h2>
<pre><code class="language-javascript">function summarizeConstructionProgress(site) {
  const progress = Number.isFinite(site?.progress)
    ? site.progress
    : 0;
  const total = Number.isFinite(site?.progressTotal)
    ? site.progressTotal
    : 0;

  return {
    progress,
    total,
    remaining: Math.max(0, total - progress),
    percent: total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.floor((progress / total) * 100)
          )
        )
      : 0
  };
}</code></pre>
<p><code>remaining</code> and <code>percent</code> are display calculations. They are not fields on the official object and they do not provide a completion time.</p>

<h2 id="report">Build a stable current-state report</h2>
<pre><code class="language-javascript">function getOwnedConstructionReport() {
  return Object.values(Game.constructionSites)
    .map(site => ({
      id: site.id,
      structureType: site.structureType,
      roomName: site.pos.roomName,
      roomVisible: Boolean(site.room),
      x: site.pos.x,
      y: site.pos.y,
      ...summarizeConstructionProgress(site)
    }))
    .sort((left, right) =>
      left.remaining - right.remaining
      || left.roomName.localeCompare(
        right.roomName
      )
      || left.structureType.localeCompare(
        right.structureType
      )
      || left.id.localeCompare(right.id)
    );
}</code></pre>
<p>Use <code>site.pos.roomName</code> for identity. The optional room object may be unavailable when the room is not visible.</p>

<h2 id="preflight">Preflight one tracked Builder action</h2>
<p>The diagnostic below tracks one accepted build at a time. It is not a room-wide Builder scheduler.</p>
<pre><code class="language-javascript">function inspectTrackedBuildRequest(
  creep,
  site
) {
  if (
    !creep
    || creep.my !== true
    || creep.spawning === true
  ) {
    return { ready: false, reason: 'builder-unavailable' };
  }

  if (!site || site.my !== true) {
    return { ready: false, reason: 'site-unavailable' };
  }

  if (creep.room.name !== site.pos.roomName) {
    return { ready: false, reason: 'different-room' };
  }

  if (creep.getActiveBodyparts(WORK) <= 0) {
    return { ready: false, reason: 'no-active-work' };
  }

  if (
    creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ) <= 0
  ) {
    return { ready: false, reason: 'no-energy' };
  }

  if (!creep.pos.inRangeTo(site, 3)) {
    return { ready: false, reason: 'not-in-range' };
  }

  return { ready: true, reason: 'ready' };
}</code></pre>
<p>Range, active parts, Energy, ownership, and current object identity are preconditions. They do not prove the intent settled.</p>

<h2 id="submit">Submit and save the exact identities</h2>
<pre><code class="language-javascript">function submitTrackedBuild(
  creep,
  site
) {
  const room = creep?.room;
  const existing = room?.memory?.trackedBuild;

  if (existing) {
    return {
      status: 'tracked-build-already-pending',
      submittedAt: existing.submittedAt,
      builderId: existing.builderId,
      siteId: existing.siteId
    };
  }

  const check = inspectTrackedBuildRequest(
    creep,
    site
  );

  if (!check.ready) {
    if (
      check.reason === 'not-in-range'
      && creep
      && site
    ) {
      return {
        status: 'moving-to-site',
        moveResult: creep.moveTo(site, {
          range: 3,
          reusePath: 10
        })
      };
    }

    return {
      status: 'build-preflight-failed',
      reason: check.reason
    };
  }

  const progressBefore = site.progress;
  const result = creep.build(site);

  if (result !== OK) {
    return {
      status: 'build-rejected',
      builderId: creep.id,
      siteId: site.id,
      result
    };
  }

  room.memory.trackedBuild = {
    submittedAt: Game.time,
    builderId: creep.id,
    builderName: creep.name,
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    progressBefore,
    progressTotal: site.progressTotal
  };

  return {
    status: 'build-accepted',
    builderId: creep.id,
    siteId: site.id,
    submittedAt: Game.time,
    result
  };
}</code></pre>
<p><code>OK</code> means the intent was accepted in the current tick. The pending record is created only after that result.</p>

<h2 id="verify-event">Match the next tick's exact build event</h2>
<pre><code class="language-javascript">function findCompletedStructure(
  room,
  pending
) {
  return room.lookForAt(
    LOOK_STRUCTURES,
    pending.x,
    pending.y
  ).find(structure =>
    structure.structureType
      === pending.structureType
  ) ?? null;
}

function verifyTrackedBuild(room) {
  const pending = room?.memory?.trackedBuild;

  if (!pending) {
    return { status: 'no-tracked-build' };
  }

  if (Game.time <= pending.submittedAt) {
    return { status: 'accepted-this-tick' };
  }

  if (Game.time !== pending.submittedAt + 1) {
    return {
      status: 'verification-window-missed',
      submittedAt: pending.submittedAt,
      checkedAt: Game.time
    };
  }

  const matches = room.getEventLog()
    .filter(event =>
      event.event === EVENT_BUILD
      && event.objectId === pending.builderId
      && event.data?.targetId === pending.siteId
    );

  const site = Game.getObjectById(
    pending.siteId
  );
  const structure = site
    ? null
    : findCompletedStructure(room, pending);

  if (matches.length === 0) {
    return {
      status: structure
        ? 'structure-observed-without-matching-event'
        : site
          ? 'site-active-without-matching-event'
          : 'site-missing-without-matching-event',
      progressNow: site?.progress ?? null,
      structureId: structure?.id ?? null
    };
  }

  if (matches.length > 1) {
    return {
      status: 'matching-build-event-ambiguous',
      matchCount: matches.length
    };
  }

  const event = matches[0];
  delete room.memory.trackedBuild;

  return {
    status: structure
      ? 'build-event-verified-site-completed'
      : site
        ? 'build-event-verified-site-active'
        : 'build-event-verified-site-missing',
    eventAmount: event.data?.amount ?? null,
    progressBefore: pending.progressBefore,
    progressNow: site?.progress ?? null,
    structureId: structure?.id ?? null
  };
}</code></pre>
<p>The event binds one Builder ID to one Site ID. The Site's net progress is supporting context: other Builders can add progress in the same tick. If the Site disappeared, the exact coordinate and structure type separate observed completion from a missing or removed Site.</p>

<h2 id="verification-order">Verify before submitting the next sample</h2>
<pre><code class="language-javascript">module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  const verification = verifyTrackedBuild(room);

  if (
    verification.status === 'accepted-this-tick'
    || verification.status === 'verification-window-missed'
  ) {
    return;
  }

  const builder = Game.creeps.Builder1;
  const site = room.find(
    FIND_MY_CONSTRUCTION_SITES
  )[0];

  if (!builder || !site) {
    return;
  }

  const submission = submitTrackedBuild(
    builder,
    site
  );

  if (submission.status === 'build-rejected') {
    console.log(JSON.stringify({
      type: 'tracked-build',
      roomName: room.name,
      ...submission
    }));
  }
};</code></pre>
<p>A real production loop should choose the Site deterministically and should not use array position zero as its permanent priority rule. The abbreviated selection keeps this section focused on event identity.</p>

<h2 id="completion-states">Interpret disappearance carefully</h2>
<div class="table-scroll"><table>
<thead><tr><th>Observation</th><th>What it proves</th></tr></thead>
<tbody>
<tr><td>Matching <code>EVENT_BUILD</code> and Site still present</td><td>The exact Builder contributed to that Site; current progress is net room state.</td></tr>
<tr><td>Matching event and completed structure at the same coordinate</td><td>The exact Builder contributed in the completion tick and the structure replacement is visible.</td></tr>
<tr><td>Structure observed but no matching event</td><td>Completion is visible, but it cannot be attributed to this tracked Builder.</td></tr>
<tr><td>Site and structure both absent</td><td>The Site is missing or was removed; completion is not proven.</td></tr>
<tr><td>Room not visible during the next-tick window</td><td>The exact event cannot be recovered later from this one-tick log window.</td></tr>
</tbody></table></div>

<h2 id="no-eta">Do not invent an ETA from remaining work</h2>
<p>Completion time depends on active <code>WORK</code>, carried Energy, range, movement, fatigue, traffic, task allocation, interruptions, Builder replacement, competing Sites, and the number of accepted build intents. A remaining-progress value is useful state, not a tick or wall-clock promise.</p>

<h2 id="return-codes">Return-code boundaries</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning here</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The build intent was accepted.</td><td>Save Builder and Site IDs and inspect the next tick.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Builder is farther than range 3.</td><td>Move, then retry on a later tick.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Builder lacks Energy.</td><td>Return to its Energy phase.</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>No active <code>WORK</code> part remains.</td><td>Replace or reassign the Creep.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a valid owned Construction Site.</td><td>Refresh the Site object and ownership.</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is spawning.</td><td>Wait for the Creep to finish.</td></tr>
</tbody></table></div>

<h2 id="production-adaptation">Production adaptation notes</h2>
<p>Use the current-state report continuously, but sample exact Builder events only when diagnostics require attribution. Keep one pending sample per room or use unique request IDs for multiple samples. Preserve missed-window and ambiguous states instead of rewriting them as successful progress.</p>

<h2 id="verification">Verification status and evidence boundary</h2>
<p>The progress calculations, event identity, completion/removal branches, and missed-window behavior were checked statically and offline. No real Builder, Site replacement, room-visibility loss, Console output, or live multi-tick event sequence was available. Those checks remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#ConstructionSite" rel="nofollow">API Reference: ConstructionSite</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.build" rel="nofollow">API Reference: Creep.build()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">API Reference: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/game-loop.html" rel="nofollow">Screeps Documentation: game loop and ticks</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
