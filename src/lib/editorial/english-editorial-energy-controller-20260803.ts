import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialEnergyControllerOverride20260803 = {
  title: "Screeps Controller Downgrade Recovery: Verify Emergency Upgrades",
  headline: "Recover a Downgrading Controller Without Hiding Failed Upgrade Ticks",
  description: "Enter Controller recovery with hysteresis, reject blocked or unready attempts, submit one upgrader action, and verify the exact Creep in the next tick's room event log.",
  category: "CONTROLLER · DOWNGRADE RECOVERY",
  readingTime: "15 min read",
  breadcrumbLabel: "Downgrade Recovery",
  tags: [
    "Screeps",
    "Controller",
    "Downgrade",
    "Upgrader",
    "Debugging"
  ],
  keywords: [
    "Screeps Controller downgrade recovery",
    "ticksToDowngrade",
    "upgradeBlocked",
    "EVENT_UPGRADE_CONTROLLER",
    "Screeps emergency upgrader",
    "upgradeController return codes"
  ],
  primaryKeyword: "Screeps Controller downgrade recovery",
  searchIntent: "Diagnose and verify one emergency Controller upgrade workflow without confusing accepted intents with later timer recovery",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved — no URL, slug, Canonical, or Chinese mapping change"
    ],
    [
      "Official Screeps API",
      "Reviewed — StructureController, upgradeController(), Room.getEventLog(), event identity, ranges, and return codes"
    ],
    [
      "Project-policy boundary",
      "Entry threshold, recovery threshold, role selection, and logging cadence are examples, not official safe values"
    ],
    [
      "Static validation",
      "One-action control flow, pending-record lifecycle, missed-window handling, and JavaScript syntax reviewed"
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
      "recovery-contract",
      "What recovery must prove"
    ],
    [
      "hysteresis",
      "Enter and leave recovery deliberately"
    ],
    [
      "preflight",
      "Reject blocked or unready attempts"
    ],
    [
      "submit",
      "Submit one identifiable upgrade"
    ],
    [
      "verify",
      "Verify the prior tick by event identity"
    ],
    [
      "complete-loop",
      "Complete recovery loop"
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
<p>Your owned Controller is approaching downgrade and you need code that can answer three separate questions: should the room enter recovery mode, did one specific Upgrader call reach the API, and did that exact Creep produce an upgrade event on the next tick?</p>
<p>This is not a general Upgrader role tutorial. It is a recovery controller for rooms that already have an Energy path and at least one candidate Creep.</p>

<h2 id="recovery-contract">What recovery must prove</h2>
<p><code>upgradeController()</code> returning <code>OK</code> means the intent was accepted in the current tick. It does not prove that <code>ticksToDowngrade</code> already increased in the same script execution, and a later net timer change cannot identify one Creep when several Upgraders are active.</p>
<p>Keep three evidence layers separate:</p>
<ul>
<li><strong>Decision:</strong> the live Controller timer crossed a project-defined threshold.</li>
<li><strong>Submission:</strong> one Creep, Controller, tick, and return code were recorded.</li>
<li><strong>Settlement:</strong> the next tick's <code>Room.getEventLog()</code> contains <code>EVENT_UPGRADE_CONTROLLER</code> for that Creep.</li>
</ul>

<h2 id="hysteresis">Enter and leave recovery deliberately</h2>
<p>Use a lower entry threshold and a higher exit threshold. The values below are examples. They must be chosen from the room's travel time, Energy availability, replacement time, and acceptable risk.</p>
<pre><code class="language-javascript">function decideControllerRecovery(input) {
  if (
    input.owned !== true
    || !Number.isInteger(input.ticksToDowngrade)
    || input.ticksToDowngrade < 0
  ) {
    return { active: false, reason: 'controller-unavailable' };
  }

  if (
    !Number.isInteger(input.enterAt)
    || !Number.isInteger(input.leaveAt)
    || input.enterAt <= 0
    || input.leaveAt <= input.enterAt
  ) {
    return { active: false, reason: 'invalid-thresholds' };
  }

  if (input.wasActive === true) {
    return input.ticksToDowngrade >= input.leaveAt
      ? { active: false, reason: 'recovered' }
      : { active: true, reason: 'recovery-continues' };
  }

  return input.ticksToDowngrade <= input.enterAt
    ? { active: true, reason: 'recovery-entered' }
    : { active: false, reason: 'normal' };
}</code></pre>
<p>Do not calculate recovery from <code>CONTROLLER_DOWNGRADE[level]</code> alone. That constant is the level-specific maximum timer context; <code>controller.ticksToDowngrade</code> is the live state used by this decision.</p>

<h2 id="preflight">Reject blocked or unready attempts</h2>
<p>A recovery loop should not issue an API call merely because the timer is low. Check the Controller and the selected Creep first.</p>
<pre><code class="language-javascript">function selectRecoveryUpgrader(room, controller) {
  const candidates = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.spawning !== true
      && creep.getActiveBodyparts(WORK) > 0
      && creep.getActiveBodyparts(CARRY) > 0
      && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  });

  return candidates.sort((left, right) =>
    left.pos.getRangeTo(controller)
      - right.pos.getRangeTo(controller)
    || right.getActiveBodyparts(WORK)
      - left.getActiveBodyparts(WORK)
    || right.store.getUsedCapacity(RESOURCE_ENERGY)
      - left.store.getUsedCapacity(RESOURCE_ENERGY)
    || left.name.localeCompare(right.name)
  )[0] || null;
}

function inspectRecoveryPreflight(room) {
  const controller = room?.controller || null;

  if (!controller || controller.my !== true) {
    return { ready: false, status: 'owned-controller-not-found' };
  }

  if (
    Number.isInteger(controller.upgradeBlocked)
    && controller.upgradeBlocked > 0
  ) {
    return {
      ready: false,
      status: 'controller-upgrade-blocked',
      upgradeBlocked: controller.upgradeBlocked
    };
  }

  const creep = selectRecoveryUpgrader(room, controller);
  if (!creep) {
    return { ready: false, status: 'ready-upgrader-not-found' };
  }

  return { ready: true, status: 'ready', controller, creep };
}</code></pre>
<p><code>upgradeBlocked</code> is a live API boundary. Waiting for it to reach zero is different from fixing an empty Upgrader, a damaged body, or an unavailable Creep.</p>

<h2 id="submit">Submit one identifiable upgrade</h2>
<p>Store object IDs rather than live objects. A pending record belongs to one accepted call and one expected event window.</p>
<pre><code class="language-javascript">function submitRecoveryUpgrade(room, state) {
  const preflight = inspectRecoveryPreflight(room);
  if (!preflight.ready) {
    return preflight;
  }

  const { controller, creep } = preflight;
  const before = {
    ticksToDowngrade: controller.ticksToDowngrade,
    progress: Number.isFinite(controller.progress)
      ? controller.progress
      : null,
    creepEnergy: creep.store.getUsedCapacity(RESOURCE_ENERGY)
  };
  const result = creep.upgradeController(controller);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 3,
      reusePath: 5
    });

    return {
      status: moveResult === OK
        ? 'movement-submitted'
        : moveResult === ERR_TIRED
          ? 'movement-deferred-fatigue'
          : 'movement-rejected',
      result,
      moveResult,
      creepId: creep.id,
      controllerId: controller.id
    };
  }

  if (result !== OK) {
    return {
      status: 'upgrade-rejected',
      result,
      creepId: creep.id,
      controllerId: controller.id
    };
  }

  const pending = {
    requestId: [
      room.name,
      Game.time,
      creep.id,
      controller.id
    ].join(':'),
    submittedAt: Game.time,
    roomName: room.name,
    creepId: creep.id,
    controllerId: controller.id,
    before
  };

  state.pending = pending;

  return {
    status: 'upgrade-accepted',
    result,
    pending
  };
}</code></pre>
<p>A movement result is not an upgrade result. When the Creep is outside range 3, this function records movement and waits for a later tick before trying the work action again.</p>

<h2 id="verify">Verify the prior tick by event identity</h2>
<p>Read the pending record exactly one tick later. The room event log identifies the acting object through <code>objectId</code>. For this event, the room itself supplies the Controller context; when a <code>targetId</code> is present, the verifier also checks it.</p>
<pre><code class="language-javascript">function verifyRecoveryUpgrade(room, state) {
  const pending = state.pending;
  if (!pending) {
    return { status: 'nothing-pending' };
  }

  if (Game.time <= pending.submittedAt) {
    return { status: 'waiting-for-next-tick' };
  }

  if (Game.time !== pending.submittedAt + 1) {
    delete state.pending;
    return {
      status: 'verification-window-missed',
      requestId: pending.requestId
    };
  }

  const events = room.getEventLog();
  const matches = events.filter(event =>
    event.event === EVENT_UPGRADE_CONTROLLER
    && event.objectId === pending.creepId
    && (
      typeof event.data?.targetId !== 'string'
      || event.data.targetId === pending.controllerId
    )
  );

  const controller = Game.getObjectById(pending.controllerId);
  const netState = controller
    ? {
        ticksToDowngradeNow: controller.ticksToDowngrade,
        progressNow: Number.isFinite(controller.progress)
          ? controller.progress
          : null
      }
    : null;

  delete state.pending;

  if (matches.length === 0) {
    return {
      status: 'accepted-event-not-found',
      requestId: pending.requestId,
      netState
    };
  }

  if (matches.length > 1) {
    return {
      status: 'ambiguous-upgrade-events',
      requestId: pending.requestId,
      matchCount: matches.length,
      netState
    };
  }

  return {
    status: 'upgrade-event-verified',
    requestId: pending.requestId,
    eventData: matches[0].data || null,
    before: pending.before,
    netState
  };
}</code></pre>
<p>The event is the primary evidence for that actor. <code>ticksToDowngradeNow</code> and <code>progressNow</code> are net room state: other Upgraders or Controller effects can change them during the same tick.</p>

<h2 id="complete-loop">Complete recovery loop</h2>
<pre><code class="language-javascript">function runControllerRecovery(roomName) {
  Memory.controllerRecovery ??= {};
  const state = Memory.controllerRecovery[roomName] ??= {
    enabled: true,
    enterAt: 5000,
    leaveAt: 10000,
    active: false,
    pending: null
  };

  if (state.enabled !== true) {
    return { status: 'disabled' };
  }

  if (state.lastRunAt === Game.time) {
    return { status: 'already-run-this-tick' };
  }
  state.lastRunAt = Game.time;

  const room = Game.rooms[roomName];
  const controller = room?.controller || null;
  if (!room || !controller || controller.my !== true) {
    return { status: 'owned-room-not-visible' };
  }

  const verification = verifyRecoveryUpgrade(room, state);
  if (
    verification.status !== 'nothing-pending'
    && verification.status !== 'waiting-for-next-tick'
  ) {
    state.lastVerification = verification;
    state.lastVerifiedAt = Game.time;
  }

  const decision = decideControllerRecovery({
    owned: controller.my,
    ticksToDowngrade: controller.ticksToDowngrade,
    enterAt: state.enterAt,
    leaveAt: state.leaveAt,
    wasActive: state.active
  });

  state.active = decision.active;
  state.lastDecision = decision.reason;
  state.lastTicksToDowngrade = controller.ticksToDowngrade;

  if (!decision.active) {
    return { status: decision.reason, verification };
  }

  if (state.pending) {
    return { status: 'upgrade-already-pending', verification };
  }

  const submission = submitRecoveryUpgrade(room, state);
  state.lastSubmission = submission.status;
  state.lastSubmissionAt = Game.time;

  return { status: submission.status, submission, verification };
}

module.exports.loop = function () {
  const outcome = runControllerRecovery('W1N1');

  if (
    outcome.status.includes('rejected')
    || outcome.status.includes('not-found')
    || outcome.status.includes('missed')
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'controller-recovery',
      gameTick: Game.time,
      outcome
    }));
  }
};</code></pre>
<p>The verifier runs before a new submission. That ordering prevents the next action from overwriting the evidence record for the previous one.</p>

<h2 id="return-codes">Return-code boundaries</h2>
<div class="table-scroll"><table>
<thead><tr><th>Result</th><th>Meaning in this workflow</th><th>Next check</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>One upgrade intent was accepted</td><td>Match the next-tick event</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>The Creep or Controller ownership is wrong</td><td>Resolve current objects again</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>The Creep is still spawning</td><td>Wait; do not treat it as a range failure</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The Creep has no usable Energy</td><td>Repair the Energy supply path</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The target is invalid or Controller upgrading is blocked</td><td>Inspect type, ownership, and <code>upgradeBlocked</code></td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is beyond range 3</td><td>Record movement separately</td></tr>
<tr><td><code>ERR_NO_BODYPART</code></td><td>Required active body capability is missing</td><td>Inspect active <code>WORK</code> and <code>CARRY</code></td></tr>
</tbody></table></div>

<h2 id="production-notes">Production adaptation notes</h2>
<ul>
<li>Replace the example thresholds with room-specific policy. Do not copy them as universal safety values.</li>
<li>Give recovery a clear priority against building, fortification, and market spending; this article does not define the full room scheduler.</li>
<li>A Controller Link can solve Energy delivery, but it does not prove that an Upgrader is alive, in range, or carrying Energy.</li>
<li>Keep pending records bounded. A missed one-tick event window should fail closed instead of being guessed from later net state.</li>
<li>At RCL 8, Controller upgrading has additional limits. Do not infer one Creep's contribution from progress or timer changes alone.</li>
</ul>

<h2 id="choose-another-guide">Choose another guide when</h2>
<p>Use <a href="/en/blog/screeps-upgrade-controller">the beginner Upgrader loop</a> when the room does not yet have a working harvest-and-upgrade cycle. Use <a href="/en/blog/screeps-link-transfer-energy">the coordinated Link guide</a> when the Upgrader is ready but the Controller-side Link is not being supplied. Use <a href="/en/blog/screeps-controller-activate-safe-mode">the Safe Mode guide</a> for a confirmed defensive activation request; Safe Mode and downgrade recovery solve different risks.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#StructureController" rel="nofollow">Screeps API: StructureController</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.upgradeController" rel="nofollow">Screeps API: Creep.upgradeController()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">Screeps API: Room.getEventLog()</a></li>
<li><a href="https://docs.screeps.com/api/#Room-Event-Objects" rel="nofollow">Screeps API: Room event objects</a></li>
<li><a href="https://docs.screeps.com/control.html" rel="nofollow">Screeps documentation: room control</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
