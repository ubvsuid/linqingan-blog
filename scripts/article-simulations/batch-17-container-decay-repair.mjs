import assert from 'node:assert/strict';

const DEFAULT_POLICY = Object.freeze({
  minimumHitsRatio: 0.8,
  bufferDecayEvents: 2,
  safetyTicks: 5,
  historyLimit: 20
});

function finiteNonNegative(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizePolicy(policy = {}) {
  const minimumHitsRatio =
    Number.isFinite(policy.minimumHitsRatio)
    && policy.minimumHitsRatio > 0
    && policy.minimumHitsRatio <= 1
      ? policy.minimumHitsRatio
      : DEFAULT_POLICY.minimumHitsRatio;
  const bufferDecayEvents =
    Number.isInteger(policy.bufferDecayEvents)
    && policy.bufferDecayEvents >= 1
      ? policy.bufferDecayEvents
      : DEFAULT_POLICY.bufferDecayEvents;
  const safetyTicks =
    Number.isInteger(policy.safetyTicks)
    && policy.safetyTicks >= 0
      ? policy.safetyTicks
      : DEFAULT_POLICY.safetyTicks;
  const historyLimit =
    Number.isInteger(policy.historyLimit)
    && policy.historyLimit >= 1
      ? policy.historyLimit
      : DEFAULT_POLICY.historyLimit;

  return {
    minimumHitsRatio,
    bufferDecayEvents,
    safetyTicks,
    historyLimit
  };
}

function getContainerDecayInterval(roomOwned, constants) {
  return roomOwned
    ? constants.CONTAINER_DECAY_TIME_OWNED
    : constants.CONTAINER_DECAY_TIME;
}

function estimateContainerLoss(container, roomOwned, constants) {
  const hits = finiteNonNegative(container?.hits, 0);
  const hitsMax = finiteNonNegative(container?.hitsMax, 0);
  const ticksToDecay = finiteNonNegative(container?.ticksToDecay, 0);
  const decayAmount = finiteNonNegative(constants?.CONTAINER_DECAY, 0);
  const interval = finiteNonNegative(
    getContainerDecayInterval(roomOwned, constants ?? {}),
    0
  );

  if (
    hits <= 0
    || hitsMax <= 0
    || decayAmount <= 0
    || interval <= 0
  ) {
    return {
      valid: false,
      reason: 'invalid-container-decay-input'
    };
  }

  const decayEventsUntilLoss = Math.ceil(hits / decayAmount);
  const estimatedTicksUntilLoss =
    ticksToDecay + (decayEventsUntilLoss - 1) * interval;

  return {
    valid: true,
    hits,
    hitsMax,
    ticksToDecay,
    decayAmount,
    interval,
    decayEventsUntilLoss,
    estimatedTicksUntilLoss,
    nextDecayFatal: hits <= decayAmount,
    nextDecayHits: Math.max(0, hits - decayAmount)
  };
}

function buildContainerRepairPlan({
  container,
  roomOwned,
  repairer,
  pathLength,
  constants,
  policy
}) {
  const normalizedPolicy = normalizePolicy(policy);
  const estimate = estimateContainerLoss(container, roomOwned, constants);

  if (!estimate.valid) {
    return {
      action: 'wait',
      reason: estimate.reason,
      estimate
    };
  }

  if (!repairer || repairer.my !== true) {
    return {
      action: 'wait',
      reason: 'repairer-missing',
      estimate
    };
  }
  if (repairer.spawning === true) {
    return {
      action: 'wait',
      reason: 'repairer-spawning',
      estimate
    };
  }
  if (!Number.isInteger(repairer.activeWork) || repairer.activeWork <= 0) {
    return {
      action: 'wait',
      reason: 'repairer-no-active-work',
      estimate
    };
  }
  if (!Number.isFinite(repairer.energy) || repairer.energy <= 0) {
    return {
      action: 'wait',
      reason: 'repairer-needs-energy',
      estimate
    };
  }

  const targetHits = Math.min(
    estimate.hitsMax,
    Math.max(
      Math.ceil(estimate.hitsMax * normalizedPolicy.minimumHitsRatio),
      estimate.decayAmount * (normalizedPolicy.bufferDecayEvents + 1)
    )
  );

  if (estimate.hits >= targetHits) {
    return {
      action: 'wait',
      reason: 'container-above-policy-target',
      targetHits,
      estimate
    };
  }

  if (!Number.isInteger(pathLength) || pathLength < 0) {
    return {
      action: 'wait',
      reason: 'container-unreachable',
      targetHits,
      estimate
    };
  }

  const travelTicks = Math.max(0, pathLength);
  const deadlineSlack =
    estimate.ticksToDecay
    - travelTicks
    - normalizedPolicy.safetyTicks;

  const repairPower =
    repairer.activeWork
    * finiteNonNegative(constants?.REPAIR_POWER, 0);
  const energyPerAction =
    repairPower
    * finiteNonNegative(constants?.REPAIR_COST, 0);

  if (repairPower <= 0 || energyPerAction <= 0) {
    return {
      action: 'wait',
      reason: 'invalid-repair-constants',
      targetHits,
      estimate
    };
  }

  const missingHits = Math.max(0, targetHits - estimate.hits);
  const actionsNeeded = Math.ceil(missingHits / repairPower);
  const energyNeeded = Math.ceil(actionsNeeded * energyPerAction);
  const inRange = repairer.rangeToContainer <= 3;

  return {
    action: inRange ? 'repair' : 'move',
    reason: inRange ? 'repair-container' : 'move-to-container',
    targetHits,
    missingHits,
    actionsNeeded,
    energyNeeded,
    travelTicks,
    deadlineSlack,
    urgent:
      estimate.nextDecayFatal
      || deadlineSlack <= 0,
    estimate
  };
}

function rankContainerRepairPlans(plans) {
  return plans
    .filter(plan =>
      plan
      && (plan.action === 'repair' || plan.action === 'move')
      && plan.containerId
    )
    .sort((left, right) => {
      if (left.urgent !== right.urgent) {
        return left.urgent ? -1 : 1;
      }
      if (left.deadlineSlack !== right.deadlineSlack) {
        return left.deadlineSlack - right.deadlineSlack;
      }
      if (
        left.estimate.estimatedTicksUntilLoss
        !== right.estimate.estimatedTicksUntilLoss
      ) {
        return (
          left.estimate.estimatedTicksUntilLoss
          - right.estimate.estimatedTicksUntilLoss
        );
      }
      if (left.estimate.hits !== right.estimate.hits) {
        return left.estimate.hits - right.estimate.hits;
      }
      if (left.travelTicks !== right.travelTicks) {
        return left.travelTicks - right.travelTicks;
      }
      return left.containerId.localeCompare(right.containerId);
    });
}

function verifyContainerRepair(
  previous,
  current,
  gameTime,
  events = []
) {
  if (!previous) {
    return {
      state: 'no-pending-observation'
    };
  }
  if (gameTime !== previous.submittedAt + 1) {
    return {
      state: 'missed-observation-window',
      expectedTick: previous.submittedAt + 1,
      observedTick: gameTime
    };
  }

  const repairEvent = Array.isArray(events)
    ? events.find(event =>
        event?.event === 'repair'
        && event.objectId === previous.repairerId
        && event.data?.targetId === previous.containerId
      )
    : null;

  if (!current?.containerExists) {
    return {
      state: repairEvent
        ? 'repair-event-target-missing'
        : 'container-missing',
      eventMatched: Boolean(repairEvent)
    };
  }
  if (!Number.isFinite(current.hits)) {
    return {
      state: repairEvent
        ? 'repair-event-hits-unavailable'
        : 'repair-evidence-unavailable',
      eventMatched: Boolean(repairEvent)
    };
  }

  const hitsDelta = current.hits - previous.hitsBefore;
  if (repairEvent) {
    return {
      state:
        hitsDelta > 0
          ? 'repair-event-and-hits-increased'
          : 'repair-event-with-net-offset',
      eventMatched: true,
      energySpent: Number.isFinite(repairEvent.data?.energySpent)
        ? repairEvent.data.energySpent
        : null,
      hitsDelta
    };
  }

  return {
    state:
      hitsDelta > 0
        ? 'hits-increased-without-matched-event'
        : hitsDelta === 0
          ? 'no-net-hits-change'
          : 'hits-decreased',
    eventMatched: false,
    hitsDelta
  };
}

function pushBoundedHistory(history, entry, limit) {
  const values = Array.isArray(history) ? history : [];
  const next = [...values, entry];
  return next.slice(-Math.max(1, limit));
}

const C = {
  CONTAINER_DECAY: 5000,
  CONTAINER_DECAY_TIME: 100,
  CONTAINER_DECAY_TIME_OWNED: 500,
  REPAIR_POWER: 100,
  REPAIR_COST: 0.01
};

let estimate = estimateContainerLoss(
  { hits: 5000, hitsMax: 250000, ticksToDecay: 20 },
  false,
  C
);
assert.equal(estimate.nextDecayFatal, true);
assert.equal(estimate.estimatedTicksUntilLoss, 20);

estimate = estimateContainerLoss(
  { hits: 5001, hitsMax: 250000, ticksToDecay: 20 },
  false,
  C
);
assert.equal(estimate.decayEventsUntilLoss, 2);
assert.equal(estimate.estimatedTicksUntilLoss, 120);

estimate = estimateContainerLoss(
  { hits: 10001, hitsMax: 250000, ticksToDecay: 20 },
  true,
  C
);
assert.equal(estimate.estimatedTicksUntilLoss, 1020);

assert.equal(
  estimateContainerLoss(
    { hits: 0, hitsMax: 250000, ticksToDecay: 1 },
    true,
    C
  ).valid,
  false
);

const repairer = {
  my: true,
  spawning: false,
  activeWork: 2,
  energy: 100,
  rangeToContainer: 4
};

let plan = buildContainerRepairPlan({
  container: {
    hits: 10000,
    hitsMax: 250000,
    ticksToDecay: 10
  },
  roomOwned: false,
  repairer,
  pathLength: 5,
  constants: C,
  policy: {
    minimumHitsRatio: 0.2,
    bufferDecayEvents: 2,
    safetyTicks: 5
  }
});
assert.equal(plan.action, 'move');
assert.equal(plan.urgent, true);
assert.equal(plan.targetHits, 50000);
assert.equal(plan.actionsNeeded, 200);
assert.equal(plan.energyNeeded, 400);

plan = buildContainerRepairPlan({
  container: {
    hits: 250000,
    hitsMax: 250000,
    ticksToDecay: 100
  },
  roomOwned: true,
  repairer: {
    ...repairer,
    rangeToContainer: 2
  },
  pathLength: 0,
  constants: C
});
assert.equal(plan.action, 'wait');

const criticalContainer = {
  hits: 5000,
  hitsMax: 250000,
  ticksToDecay: 20
};

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer: null,
    pathLength: 0,
    constants: C
  }).reason,
  'repairer-missing'
);

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer: {
      ...repairer,
      spawning: true
    },
    pathLength: 0,
    constants: C
  }).reason,
  'repairer-spawning'
);

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer: {
      ...repairer,
      activeWork: 0
    },
    pathLength: 0,
    constants: C
  }).reason,
  'repairer-no-active-work'
);

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer: {
      ...repairer,
      energy: 0
    },
    pathLength: 0,
    constants: C
  }).reason,
  'repairer-needs-energy'
);

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer: {
      ...repairer,
      rangeToContainer: 2
    },
    pathLength: 0,
    constants: C,
    policy: {
      minimumHitsRatio: 0.2
    }
  }).action,
  'repair'
);

assert.equal(
  buildContainerRepairPlan({
    container: criticalContainer,
    roomOwned: false,
    repairer,
    pathLength: null,
    constants: C
  }).reason,
  'container-unreachable'
);

const ranked = rankContainerRepairPlans([
  {
    containerId: 'b',
    action: 'move',
    urgent: false,
    deadlineSlack: 10,
    travelTicks: 1,
    estimate: {
      estimatedTicksUntilLoss: 100,
      hits: 10000
    }
  },
  {
    containerId: 'a',
    action: 'repair',
    urgent: true,
    deadlineSlack: 20,
    travelTicks: 0,
    estimate: {
      estimatedTicksUntilLoss: 200,
      hits: 20000
    }
  }
]);
assert.equal(ranked[0].containerId, 'a');

assert.equal(
  verifyContainerRepair(null, null, 1).state,
  'no-pending-observation'
);

const previous = {
  submittedAt: 1,
  hitsBefore: 100,
  repairerId: 'r1',
  containerId: 'c1'
};

assert.equal(
  verifyContainerRepair(
    previous,
    { containerExists: true, hits: 200 },
    3
  ).state,
  'missed-observation-window'
);

assert.equal(
  verifyContainerRepair(
    previous,
    { containerExists: false },
    2
  ).state,
  'container-missing'
);

assert.equal(
  verifyContainerRepair(
    previous,
    { containerExists: false },
    2,
    [{ event: 'repair', objectId: 'r1', data: { targetId: 'c1', energySpent: 1 } }]
  ).state,
  'repair-event-target-missing'
);

assert.equal(
  verifyContainerRepair(
    previous,
    { containerExists: true, hits: null },
    2
  ).state,
  'repair-evidence-unavailable'
);

assert.equal(
  verifyContainerRepair(
    previous,
    { containerExists: true, hits: null },
    2,
    [{ event: 'repair', objectId: 'r1', data: { targetId: 'c1' } }]
  ).state,
  'repair-event-hits-unavailable'
);

assert.equal(
  verifyContainerRepair(previous, { containerExists: true, hits: 200 }, 2).state,
  'hits-increased-without-matched-event'
);
assert.equal(
  verifyContainerRepair(previous, { containerExists: true, hits: 100 }, 2).state,
  'no-net-hits-change'
);
assert.equal(
  verifyContainerRepair(previous, { containerExists: true, hits: 50 }, 2).state,
  'hits-decreased'
);

let verification = verifyContainerRepair(
  previous,
  { containerExists: true, hits: 200 },
  2,
  [{ event: 'repair', objectId: 'r1', data: { targetId: 'c1', energySpent: 1 } }]
);
assert.equal(verification.state, 'repair-event-and-hits-increased');
assert.equal(verification.energySpent, 1);

verification = verifyContainerRepair(
  previous,
  { containerExists: true, hits: 50 },
  2,
  [{ event: 'repair', objectId: 'r1', data: { targetId: 'c1' } }]
);
assert.equal(verification.state, 'repair-event-with-net-offset');

assert.deepEqual(pushBoundedHistory([1, 2], 3, 2), [2, 3]);
assert.equal(normalizePolicy({ minimumHitsRatio: 2 }).minimumHitsRatio, 0.8);
assert.equal(getContainerDecayInterval(true, C), 500);
assert.equal(getContainerDecayInterval(false, C), 100);
assert.equal(normalizePolicy({ bufferDecayEvents: 0 }).bufferDecayEvents, 2);

console.log('Container decay repair simulations passed: 28 cases.');
