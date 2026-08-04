import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialEnergyLinkOverride20260803 = {
  title: "Screeps Link transferEnergy(): Coordinate Capacity and Verify Events",
  headline: "Coordinate Link Transfers and Verify the Exact Source-Target Event",
  description: "Plan multiple same-room Link sends with shared target-capacity reservations, submit each source once, and verify exact source and target IDs in the next tick's transfer events.",
  category: "LOGISTICS · LINK ENERGY COORDINATION",
  readingTime: "16 min read",
  breadcrumbLabel: "Link Coordination",
  tags: [
    "Screeps",
    "Link",
    "Energy",
    "Logistics",
    "Event Log"
  ],
  keywords: [
    "Screeps Link transferEnergy",
    "Screeps Link coordinator",
    "Link target capacity reservation",
    "EVENT_TRANSFER",
    "LINK_LOSS_RATIO",
    "Screeps controller Link"
  ],
  primaryKeyword: "Screeps Link transferEnergy",
  searchIntent: "Coordinate same-tick Link sends into shared target capacity and verify each accepted source-target transfer on the next tick",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved — no URL, slug, Canonical, or Chinese mapping change"
    ],
    [
      "Official Screeps API",
      "Reviewed — StructureLink.transferEnergy(), cooldown, same-room boundary, loss constant, event log, and return codes"
    ],
    [
      "Project-policy boundary",
      "Link roles, priorities, minimumSend, targetReserve, and dispatch cadence are room policy"
    ],
    [
      "Static validation",
      "Shared reservation arithmetic, one-source submission, event identity, missed-window handling, and JavaScript syntax reviewed"
    ],
    [
      "Validation level",
      "Official API review, JavaScript syntax review, static control-flow review, and repository checks"
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
      "Last editorial review",
      "August 3, 2026"
    ]
  ],
  toc: [
    [
      "use-this-guide",
      "Use this guide when"
    ],
    [
      "coordination-problem",
      "Why independent senders race"
    ],
    [
      "identity",
      "Resolve explicit Link identities"
    ],
    [
      "plan",
      "Reserve shared target capacity"
    ],
    [
      "submit",
      "Submit each source once"
    ],
    [
      "verify",
      "Verify exact transfer events"
    ],
    [
      "complete-loop",
      "Complete Link-network loop"
    ],
    [
      "return-codes",
      "Return-code boundaries"
    ],
    [
      "production-notes",
      "Production adaptation notes"
    ],
    [
      "choose-another-guide",
      "Choose another guide when"
    ],
    [
      "official-docs",
      "Official documentation"
    ]
  ],
  faq: [],
  articleHtml: `

<h2 id="use-this-guide">Use this guide when</h2>
<p>You have two or more owned Links in one room and need one dispatcher to decide which source sends, how much target capacity is still available, and whether the next tick contains the exact source-to-target transfer event.</p>
<p>This guide assumes Link roles are already configured by ID. It does not try to infer a Controller Link or Source Link from array order or position.</p>

<h2 id="coordination-problem">Why independent senders race</h2>
<p>Two modules can read the same target free capacity before either transfer settles. Both may decide that the full amount is available. A later call can then return <code>ERR_FULL</code>, or one module can overwrite the evidence record of another.</p>
<p>A local reservation is not a server lock. It is a same-tick planning rule used by one dispatcher so every source evaluates the target against capacity already promised by earlier plans.</p>

<h2 id="identity">Resolve explicit Link identities</h2>
<pre><code class="language-javascript">function getOwnedLink(id, roomName) {
  if (typeof id !== 'string') {
    return null;
  }

  const link = Game.getObjectById(id);
  if (
    !link
    || link.structureType !== STRUCTURE_LINK
    || link.my !== true
    || link.room.name !== roomName
  ) {
    return null;
  }

  return link;
}

function estimateLinkReceipt(requestedAmount) {
  if (!Number.isInteger(requestedAmount) || requestedAmount <= 0) {
    return {
      requestedAmount: 0,
      estimatedLoss: 0,
      estimatedReceived: 0
    };
  }

  const estimatedLoss = Math.ceil(
    requestedAmount * LINK_LOSS_RATIO
  );

  return {
    requestedAmount,
    estimatedLoss,
    estimatedReceived: Math.max(
      0,
      requestedAmount - estimatedLoss
    )
  };
}</code></pre>
<p>The loss calculation is useful for planning and logs. The next-tick event and current Stores remain the evidence. Do not rewrite a predicted target Store value into Memory.</p>

<h2 id="plan">Reserve shared target capacity</h2>
<p>The planner below sorts requests once, rejects inactive or cooling source Links, and reduces the target's remaining capacity after every accepted plan.</p>
<pre><code class="language-javascript">function planLinkTransfers(roomName, config) {
  const target = getOwnedLink(
    config.targetLinkId,
    roomName
  );

  if (!target || target.isActive() !== true) {
    return {
      status: 'target-unavailable',
      target: null,
      plans: []
    };
  }

  const targetReserve = Number.isInteger(config.targetReserve)
    ? Math.max(0, config.targetReserve)
    : 0;
  const minimumSend = Number.isInteger(config.minimumSend)
    ? Math.max(1, config.minimumSend)
    : 1;
  let remainingTargetCapacity = Math.max(
    0,
    target.store.getFreeCapacity(RESOURCE_ENERGY)
      - targetReserve
  );

  const requests = [...config.sources]
    .filter(request =>
      typeof request.sourceLinkId === 'string'
      && Number.isFinite(request.priority)
    )
    .sort((left, right) =>
      right.priority - left.priority
      || left.sourceLinkId.localeCompare(
        right.sourceLinkId
      )
    );

  const seenSources = new Set();
  const plans = [];

  for (const request of requests) {
    if (seenSources.has(request.sourceLinkId)) {
      continue;
    }
    seenSources.add(request.sourceLinkId);

    const source = getOwnedLink(
      request.sourceLinkId,
      roomName
    );
    if (
      !source
      || source.id === target.id
      || source.isActive() !== true
      || source.cooldown > 0
    ) {
      continue;
    }

    const sourceEnergy = source.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
    const requestedAmount = Math.min(
      sourceEnergy,
      remainingTargetCapacity
    );

    if (requestedAmount < minimumSend) {
      continue;
    }

    const estimate = estimateLinkReceipt(requestedAmount);
    plans.push({
      sourceId: source.id,
      targetId: target.id,
      requestedAmount,
      estimate
    });

    remainingTargetCapacity = Math.max(
      0,
      remainingTargetCapacity
        - estimate.estimatedReceived
    );
  }

  return {
    status: plans.length > 0
      ? 'plans-ready'
      : 'no-transfer-ready',
    target,
    plans,
    targetReserve,
    minimumSend,
    remainingTargetCapacity
  };
}</code></pre>
<p>The requested amount is deliberately conservative: it never exceeds visible source stock or unreserved target capacity. Because the target receives less than the requested amount after loss, the planner can leave capacity unused. That is safer than an unchecked inverse-loss calculation.</p>

<h2 id="submit">Submit each source once</h2>
<pre><code class="language-javascript">function submitLinkPlans(roomName, state, planned) {
  const submissions = [];

  for (const plan of planned.plans) {
    const source = getOwnedLink(plan.sourceId, roomName);
    const target = getOwnedLink(plan.targetId, roomName);

    if (!source || !target) {
      submissions.push({
        status: 'link-disappeared',
        sourceId: plan.sourceId,
        targetId: plan.targetId
      });
      continue;
    }

    const before = {
      sourceEnergy: source.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
      targetEnergy: target.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
      targetFree: target.store.getFreeCapacity(
        RESOURCE_ENERGY
      ),
      sourceCooldown: source.cooldown
    };
    const result = source.transferEnergy(
      target,
      plan.requestedAmount
    );

    const submission = {
      requestId: [
        roomName,
        Game.time,
        source.id,
        target.id
      ].join(':'),
      submittedAt: Game.time,
      sourceId: source.id,
      targetId: target.id,
      requestedAmount: plan.requestedAmount,
      estimate: plan.estimate,
      result,
      before
    };

    if (result === OK) {
      state.pending.push(submission);
    }

    submissions.push({
      ...submission,
      status: result === OK
        ? 'transfer-accepted'
        : 'transfer-rejected'
    });
  }

  return submissions;
}</code></pre>
<p>The planner deduplicates source IDs, and the dispatcher is the only module that calls <code>transferEnergy()</code>. A source Link that is accepted becomes unavailable through cooldown; same-tick coordination should not depend on discovering that after another caller has already acted.</p>

<h2 id="verify">Verify exact transfer events</h2>
<p>For every accepted call, match the next tick's <code>EVENT_TRANSFER</code> by source object ID, target ID, and Energy resource type. Event-reported amount and net Store changes are retained as separate fields.</p>
<pre><code class="language-javascript">function verifyLinkTransfers(room, state) {
  const events = room.getEventLog();
  const results = [];
  const keep = [];

  for (const pending of state.pending) {
    if (Game.time <= pending.submittedAt) {
      keep.push(pending);
      continue;
    }

    if (Game.time !== pending.submittedAt + 1) {
      results.push({
        status: 'verification-window-missed',
        requestId: pending.requestId
      });
      continue;
    }

    const matches = events.filter(event =>
      event.event === EVENT_TRANSFER
      && event.objectId === pending.sourceId
      && event.data?.targetId === pending.targetId
      && event.data?.resourceType === RESOURCE_ENERGY
    );
    const source = Game.getObjectById(pending.sourceId);
    const target = Game.getObjectById(pending.targetId);
    const netState = {
      sourceEnergyNow: source
        ? source.store.getUsedCapacity(RESOURCE_ENERGY)
        : null,
      targetEnergyNow: target
        ? target.store.getUsedCapacity(RESOURCE_ENERGY)
        : null,
      sourceCooldownNow: source?.cooldown ?? null
    };

    if (matches.length === 1) {
      results.push({
        status: 'transfer-event-verified',
        requestId: pending.requestId,
        requestedAmount: pending.requestedAmount,
        eventData: matches[0].data || null,
        before: pending.before,
        netState
      });
    } else {
      results.push({
        status: matches.length === 0
          ? 'accepted-event-not-found'
          : 'ambiguous-transfer-events',
        requestId: pending.requestId,
        matchCount: matches.length,
        netState
      });
    }
  }

  state.pending = keep;
  return results;
}</code></pre>
<p>Another Creep or Link may change either Store in the same tick. Exact event identity proves the actor-target pair; Store deltas remain operational context rather than exclusive attribution.</p>

<h2 id="complete-loop">Complete Link-network loop</h2>
<pre><code class="language-javascript">function runLinkNetwork(roomName) {
  Memory.linkNetworks ??= {};
  const state = Memory.linkNetworks[roomName] ??= {
    enabled: true,
    targetLinkId: 'replace-with-target-link-id',
    targetReserve: 0,
    minimumSend: 200,
    sources: [],
    pending: []
  };

  if (state.enabled !== true) {
    return { status: 'disabled' };
  }

  state.pending = Array.isArray(state.pending)
    ? state.pending
    : [];

  if (state.lastDispatchAt === Game.time) {
    return { status: 'already-dispatched-this-tick' };
  }
  state.lastDispatchAt = Game.time;

  const room = Game.rooms[roomName];
  if (!room) {
    return { status: 'room-not-visible' };
  }

  const verification = verifyLinkTransfers(room, state);
  const planned = planLinkTransfers(roomName, state);
  const submissions = planned.status === 'plans-ready'
    ? submitLinkPlans(roomName, state, planned)
    : [];

  state.lastRunAt = Game.time;
  state.lastPlanStatus = planned.status;
  state.lastVerification = verification;

  return {
    status: submissions.length > 0
      ? 'submissions-complete'
      : planned.status,
    verification,
    submissions,
    remainingTargetCapacity:
      planned.remainingTargetCapacity ?? null
  };
}

module.exports.loop = function () {
  const outcome = runLinkNetwork('W1N1');

  if (
    outcome.status === 'target-unavailable'
    || outcome.submissions?.some(
      item => item.status === 'transfer-rejected'
    )
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'link-network',
      gameTick: Game.time,
      outcome
    }));
  }
};</code></pre>
<p>Example source configuration:</p>
<pre><code class="language-javascript">Memory.linkNetworks.W1N1.sources = [
  {
    sourceLinkId: 'replace-with-first-source-link-id',
    priority: 100
  },
  {
    sourceLinkId: 'replace-with-second-source-link-id',
    priority: 80
  }
];</code></pre>

<h2 id="return-codes">Return-code boundaries</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Likely boundary</th><th>Review</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The transfer intent was accepted</td><td>Match the next-tick event</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The source Link is not yours</td><td>Source ID and ownership</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Source Energy changed before the call</td><td>Current source Store and competing code</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is not a valid Link</td><td>Current target object and type</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The target cannot accept the requested transfer</td><td>Shared reservations and other callers</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Links are not in the same room</td><td>Both room names</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The amount is invalid</td><td>Positive integer request</td></tr>
<tr><td><code>ERR_TIRED</code></td><td>The source Link is cooling down</td><td><code>source.cooldown</code></td></tr>
<tr><td><code>ERR_RCL_NOT_ENOUGH</code></td><td>A Link is inactive at the current RCL</td><td><code>isActive()</code> and room level</td></tr>
</tbody></table></div>

<h2 id="production-notes">Production adaptation notes</h2>
<ul>
<li>Use one dispatcher for every Link action in the room. A reservation map cannot coordinate code that bypasses it.</li>
<li>Priorities, reserve, and minimum send are policies. A Controller Link, Storage Link, and upgrade burst do not share one universal threshold.</li>
<li>Path and range do not determine Link cooldown in this article. Read the live cooldown after settlement rather than logging a guessed ready tick.</li>
<li>Keep accepted requests until exactly the next tick. Do not retain them indefinitely and later claim a matching net Store change.</li>
<li>Private servers may change constants. Treat the current environment's constants as the calculation source.</li>
</ul>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-controller-downgrade">the Controller recovery guide</a> when Energy reaches the Controller area but upgrade intents are still not verified. Use <a href="/en/blog/screeps-storage-energy-usage">the Storage Energy policy guide</a> when the unresolved decision is whether the room can afford the transfer. Use <a href="/en/blog/screeps-room-event-log">the event-log ingestion guide</a> when several systems need one shared, idempotent event reader.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureLink" rel="nofollow">Screeps API: StructureLink</a></li>
<li><a href="https://docs.screeps.com/api/#StructureLink.transferEnergy" rel="nofollow">Screeps API: StructureLink.transferEnergy()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">Screeps API: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Room-Event-Objects" rel="nofollow">Screeps API: Room event objects</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
