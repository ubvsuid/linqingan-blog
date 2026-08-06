import assert from 'node:assert/strict';

const DEFAULT_POLICY = Object.freeze({
  minimumHitsRatio: 0.8,
  bufferDecayEvents: 2,
  safetyTicks: 5,
  historyLimit: 20
});

const CONSTANTS = Object.freeze({
  CONTAINER_DECAY: 5000,
  CONTAINER_DECAY_TIME: 100,
  CONTAINER_DECAY_TIME_OWNED: 500,
  REPAIR_POWER: 100,
  REPAIR_COST: 0.01
});

function finiteNonNegative(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function normalizePolicy(value = {}) {
  return {
    minimumHitsRatio:
      Number.isFinite(value.minimumHitsRatio)
      && value.minimumHitsRatio > 0
      && value.minimumHitsRatio <= 1
        ? value.minimumHitsRatio
        : DEFAULT_POLICY.minimumHitsRatio,
    bufferDecayEvents:
      Number.isInteger(value.bufferDecayEvents)
      && value.bufferDecayEvents >= 1
        ? value.bufferDecayEvents
        : DEFAULT_POLICY.bufferDecayEvents,
    safetyTicks:
      Number.isInteger(value.safetyTicks)
      && value.safetyTicks >= 0
        ? value.safetyTicks
        : DEFAULT_POLICY.safetyTicks,
    historyLimit:
      Number.isInteger(value.historyLimit)
      && value.historyLimit >= 1
        ? value.historyLimit
        : DEFAULT_POLICY.historyLimit
  };
}

function getContainerDecayInterval(roomOwned, constants) {
  return roomOwned
    ? constants.CONTAINER_DECAY_TIME_OWNED
    : constants.CONTAINER_DECAY_TIME;
}

function estimateContainerLoss(
  container,
  roomOwned,
  constants
) {
  const hits = finiteNonNegative(container?.hits);
  const hitsMax = finiteNonNegative(container?.hitsMax);
  const ticksToDecay = finiteNonNegative(
    container?.ticksToDecay
  );
  const decayAmount = finiteNonNegative(
    constants?.CONTAINER_DECAY
  );
  const interval = finiteNonNegative(
    getContainerDecayInterval(
      roomOwned,
      constants ?? {}
    )
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

  const decayEventsUntilLoss = Math.ceil(
    hits / decayAmount
  );

  return {
    valid: true,
    hits,
    hitsMax,
    ticksToDecay,
    decayAmount,
    interval,
    decayEventsUntilLoss,
    estimatedTicksUntilLoss:
      ticksToDecay
      + (decayEventsUntilLoss - 1) * interval,
    nextDecayFatal: hits <= decayAmount,
    nextDecayHits: Math.max(
      0,
      hits - decayAmount
    )
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
  const containerId =
    typeof container?.id === 'string'
      ? container.id
      : null;
  const estimate = estimateContainerLoss(
    container,
    roomOwned,
    constants
  );

  if (!estimate.valid) {
    return {
      containerId,
      action: 'wait',
      reason: estimate.reason,
      estimate
    };
  }
  if (!repairer || repairer.my !== true) {
    return {
      containerId,
      action: 'wait',
      reason: 'repairer-missing',
      estimate
    };
  }
  if (repairer.spawning === true) {
    return {
      containerId,
      action: 'wait',
      reason: 'repairer-spawning',
      estimate
    };
  }
  if (
    !Number.isInteger(repairer.activeWork)
    || repairer.activeWork <= 0
  ) {
    return {
      containerId,
      action: 'wait',
      reason: 'repairer-no-active-work',
      estimate
    };
  }
  if (
    !Number.isFinite(repairer.energy)
    || repairer.energy <= 0
  ) {
    return {
      containerId,
      action: 'wait',
      reason: 'repairer-needs-energy',
      estimate
    };
  }

  const targetHits = Math.min(
    estimate.hitsMax,
    Math.max(
      Math.ceil(
        estimate.hitsMax
        * normalizedPolicy.minimumHitsRatio
      ),
      estimate.decayAmount
        * (normalizedPolicy.bufferDecayEvents + 1)
    )
  );

  if (estimate.hits >= targetHits) {
    return {
      containerId,
      action: 'wait',
      reason: 'container-above-policy-target',
      targetHits,
      estimate
    };
  }

  if (!Number.isInteger(pathLength) || pathLength < 0) {
    return {
      containerId,
      action: 'wait',
      reason: 'container-unreachable',
      targetHits,
      estimate
    };
  }

  const repairPower =
    repairer.activeWork
    * finiteNonNegative(constants?.REPAIR_POWER);
  const energyPerAction =
    repairPower
    * finiteNonNegative(constants?.REPAIR_COST);

  if (repairPower <= 0 || energyPerAction <= 0) {
    return {
      containerId,
      action: 'wait',
      reason: 'invalid-repair-constants',
      targetHits,
      estimate
    };
  }

  const travelTicks = pathLength;
  const deadlineSlack =
    estimate.ticksToDecay
    - travelTicks
    - normalizedPolicy.safetyTicks;
  const missingHits = Math.max(
    0,
    targetHits - estimate.hits
  );
  const actionsNeeded = Math.ceil(
    missingHits / repairPower
  );
  const energyNeeded = Math.ceil(
    actionsNeeded * energyPerAction
  );
  const inRange =
    Number.isFinite(repairer.rangeToContainer)
    && repairer.rangeToContainer <= 3;

  return {
    containerId,
    action: inRange ? 'repair' : 'move',
    reason: inRange
      ? 'repair-container'
      : 'move-to-container',
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
  return [...plans]
    .filter(plan =>
      plan
      && typeof plan.containerId === 'string'
      && (
        plan.action === 'repair'
        || plan.action === 'move'
      )
    )
    .sort((left, right) => {
      if (left.urgent !== right.urgent) {
        return left.urgent ? -1 : 1;
      }
      if (left.deadlineSlack !== right.deadlineSlack) {
        return left.deadlineSlack
          - right.deadlineSlack;
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
        return left.estimate.hits
          - right.estimate.hits;
      }
      if (left.travelTicks !== right.travelTicks) {
        return left.travelTicks
          - right.travelTicks;
      }
      return left.containerId.localeCompare(
        right.containerId
      );
    });
}

function verifyContainerRepair(
  previous,
  current,
  gameTime,
  events = []
) {
  if (!previous) {
    return { state: 'no-pending-observation' };
  }

  const expectedTick = previous.submittedAt + 1;
  if (gameTime !== expectedTick) {
    return {
      state: 'missed-observation-window',
      expectedTick,
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
      state: hitsDelta > 0
        ? 'repair-event-and-hits-increased'
        : 'repair-event-with-net-offset',
      eventMatched: true,
      energySpent:
        Number.isFinite(repairEvent.data?.energySpent)
          ? repairEvent.data.energySpent
          : null,
      hitsDelta
    };
  }

  return {
    state: hitsDelta > 0
      ? 'hits-increased-without-matched-event'
      : hitsDelta === 0
        ? 'no-net-hits-change'
        : 'hits-decreased',
    eventMatched: false,
    hitsDelta
  };
}

function pushBoundedHistory(
  history,
  entry,
  requestedLimit
) {
  const values = Array.isArray(history)
    ? history
    : [];
  const limit =
    Number.isInteger(requestedLimit)
    && requestedLimit >= 1
      ? requestedLimit
      : DEFAULT_POLICY.historyLimit;

  return [...values, entry].slice(-limit);
}

let passed = 0;
function test(name, callback) {
  callback();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

const baseContainer = {
  id: 'c1',
  hits: 5000,
  hitsMax: 250000,
  ticksToDecay: 20
};
const baseRepairer = {
  my: true,
  spawning: false,
  activeWork: 2,
  energy: 100,
  rangeToContainer: 4
};

function build(overrides = {}) {
  return buildContainerRepairPlan({
    container: baseContainer,
    roomOwned: false,
    repairer: baseRepairer,
    pathLength: 5,
    constants: CONSTANTS,
    policy: { minimumHitsRatio: 0.2 },
    ...overrides
  });
}

test('one decay pulse is fatal at 5000 hits', () => {
  const value = estimateContainerLoss(
    baseContainer,
    false,
    CONSTANTS
  );
  assert.equal(value.nextDecayFatal, true);
  assert.equal(value.estimatedTicksUntilLoss, 20);
});

test('5001 hits survives one pulse', () => {
  const value = estimateContainerLoss(
    { ...baseContainer, hits: 5001 },
    false,
    CONSTANTS
  );
  assert.equal(value.decayEventsUntilLoss, 2);
  assert.equal(value.estimatedTicksUntilLoss, 120);
});

test('owned-room interval is used', () => {
  assert.equal(
    estimateContainerLoss(
      { ...baseContainer, hits: 10001 },
      true,
      CONSTANTS
    ).estimatedTicksUntilLoss,
    1020
  );
});

test('neutral-room interval is used', () => {
  assert.equal(
    getContainerDecayInterval(false, CONSTANTS),
    100
  );
});

test('invalid hits fail closed', () => {
  assert.equal(
    estimateContainerLoss(
      { ...baseContainer, hits: 0 },
      false,
      CONSTANTS
    ).valid,
    false
  );
});

test('invalid decay constants fail closed', () => {
  assert.equal(
    estimateContainerLoss(
      baseContainer,
      false,
      { ...CONSTANTS, CONTAINER_DECAY: 0 }
    ).valid,
    false
  );
});

test('missing repairer waits', () => {
  assert.equal(build({ repairer: null }).reason, 'repairer-missing');
});

test('spawning repairer waits', () => {
  assert.equal(
    build({ repairer: { ...baseRepairer, spawning: true } }).reason,
    'repairer-spawning'
  );
});

test('repairer without WORK waits', () => {
  assert.equal(
    build({ repairer: { ...baseRepairer, activeWork: 0 } }).reason,
    'repairer-no-active-work'
  );
});

test('repairer without Energy waits', () => {
  assert.equal(
    build({ repairer: { ...baseRepairer, energy: 0 } }).reason,
    'repairer-needs-energy'
  );
});

test('Container above policy target waits', () => {
  assert.equal(
    build({
      container: { ...baseContainer, hits: 250000 }
    }).reason,
    'container-above-policy-target'
  );
});

test('finite range 3 selects repair', () => {
  assert.equal(
    build({
      pathLength: 0,
      repairer: { ...baseRepairer, rangeToContainer: 3 }
    }).action,
    'repair'
  );
});

test('range above 3 selects movement', () => {
  assert.equal(build().action, 'move');
});

test('unknown null range cannot select repair', () => {
  assert.equal(
    build({
      repairer: { ...baseRepairer, rangeToContainer: null }
    }).action,
    'move'
  );
});

test('missing path waits', () => {
  assert.equal(
    build({ pathLength: null }).reason,
    'container-unreachable'
  );
});

test('fatal next pulse marks urgency', () => {
  assert.equal(build().urgent, true);
});

test('travel can exhaust deadline slack', () => {
  const plan = build({
    container: {
      ...baseContainer,
      hits: 10000,
      ticksToDecay: 8
    },
    pathLength: 5
  });
  assert.equal(plan.deadlineSlack <= 0, true);
});

test('actionable plan keeps Container identity', () => {
  assert.equal(build().containerId, 'c1');
});

test('urgent plan ranks before normal plan', () => {
  const plans = rankContainerRepairPlans([
    {
      containerId: 'normal',
      action: 'move',
      urgent: false,
      deadlineSlack: 1,
      travelTicks: 1,
      estimate: { estimatedTicksUntilLoss: 10, hits: 1000 }
    },
    {
      containerId: 'urgent',
      action: 'repair',
      urgent: true,
      deadlineSlack: 10,
      travelTicks: 0,
      estimate: { estimatedTicksUntilLoss: 20, hits: 2000 }
    }
  ]);
  assert.equal(plans[0].containerId, 'urgent');
});

test('smaller deadline slack ranks first', () => {
  const common = {
    action: 'move',
    urgent: false,
    travelTicks: 1,
    estimate: { estimatedTicksUntilLoss: 100, hits: 10000 }
  };
  assert.equal(
    rankContainerRepairPlans([
      { ...common, containerId: 'b', deadlineSlack: 9 },
      { ...common, containerId: 'a', deadlineSlack: 2 }
    ])[0].containerId,
    'a'
  );
});

test('shorter estimated lifetime ranks first', () => {
  const common = {
    action: 'move',
    urgent: false,
    deadlineSlack: 5,
    travelTicks: 1,
    estimate: { hits: 10000 }
  };
  assert.equal(
    rankContainerRepairPlans([
      { ...common, containerId: 'b', estimate: { ...common.estimate, estimatedTicksUntilLoss: 200 } },
      { ...common, containerId: 'a', estimate: { ...common.estimate, estimatedTicksUntilLoss: 100 } }
    ])[0].containerId,
    'a'
  );
});

test('stable ID breaks a complete tie', () => {
  const common = {
    action: 'move',
    urgent: false,
    deadlineSlack: 5,
    travelTicks: 1,
    estimate: { estimatedTicksUntilLoss: 100, hits: 10000 }
  };
  assert.equal(
    rankContainerRepairPlans([
      { ...common, containerId: 'b' },
      { ...common, containerId: 'a' }
    ])[0].containerId,
    'a'
  );
});

test('no pending observation is explicit', () => {
  assert.equal(
    verifyContainerRepair(null, null, 1).state,
    'no-pending-observation'
  );
});

const previous = {
  submittedAt: 1,
  hitsBefore: 100,
  repairerId: 'r1',
  containerId: 'c1'
};

test('missed observation window is explicit', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: true, hits: 200 },
      3
    ).state,
    'missed-observation-window'
  );
});

test('missing Container is explicit', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: false },
      2
    ).state,
    'container-missing'
  );
});

test('matched event survives missing target state', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: false },
      2,
      [{
        event: 'repair',
        objectId: 'r1',
        data: { targetId: 'c1', energySpent: 1 }
      }]
    ).state,
    'repair-event-target-missing'
  );
});

test('missing hits evidence is explicit', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: true, hits: null },
      2
    ).state,
    'repair-evidence-unavailable'
  );
});

test('matched event and positive delta are recorded', () => {
  const result = verifyContainerRepair(
    previous,
    { containerExists: true, hits: 200 },
    2,
    [{
      event: 'repair',
      objectId: 'r1',
      data: { targetId: 'c1', energySpent: 1 }
    }]
  );
  assert.equal(result.state, 'repair-event-and-hits-increased');
  assert.equal(result.energySpent, 1);
});

test('matched event can have a negative net delta', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: true, hits: 50 },
      2,
      [{
        event: 'repair',
        objectId: 'r1',
        data: { targetId: 'c1' }
      }]
    ).state,
    'repair-event-with-net-offset'
  );
});

test('positive hits without actor event stay unverified', () => {
  assert.equal(
    verifyContainerRepair(
      previous,
      { containerExists: true, hits: 200 },
      2
    ).state,
    'hits-increased-without-matched-event'
  );
});

test('invalid policy and history limit use safe defaults', () => {
  const policy = normalizePolicy({
    minimumHitsRatio: Number.NaN,
    bufferDecayEvents: 0,
    safetyTicks: -1,
    historyLimit: Number.NaN
  });
  assert.deepEqual(policy, DEFAULT_POLICY);
  const history = pushBoundedHistory(
    Array.from({ length: 25 }, (_, index) => index),
    25,
    Number.NaN
  );
  assert.equal(history.length, 20);
  assert.equal(history.at(-1), 25);
});

assert.equal(passed, 31);
console.log('Container decay repair simulations passed: 31 cases.');
