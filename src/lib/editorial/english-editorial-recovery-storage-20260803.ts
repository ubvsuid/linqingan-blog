import type { EnglishEditorialArticleOverride } from "../english-editorial-article-override";

export const englishEditorialRecoveryStorageOverride20260803 = {
  title: "Screeps Storage Energy: Reserve Budgets and Verify Transfers",
  headline: "Use Storage Energy Without Crossing the Reserve or Misreading Transfers",
  description: "Coordinate one shared Storage withdrawal budget and target capacity map, record only accepted withdraw or transfer calls, and verify the exact source-target event on the next tick.",
  category: "LOGISTICS · STORAGE BUDGET AND EVENT IDENTITY",
  readingTime: "18 min read",
  breadcrumbLabel: "Storage Energy Budget",
  tags: [
    "Screeps",
    "Storage",
    "Energy",
    "Hauler",
    "Events"
  ],
  keywords: [
    "Screeps Storage Energy reserve",
    "Screeps withdraw event verification",
    "Screeps hauler capacity reservation",
    "Room.getEventLog EVENT_TRANSFER",
    "Screeps Storage logistics"
  ],
  primaryKeyword: "Screeps Storage Energy reserve",
  searchIntent: "Coordinate Storage Energy withdrawals and deliveries without crossing a shared reserve or misattributing another logistics action",
  finalScore: 98,
  verification: [
    [
      "Existing English route",
      "Preserved"
    ],
    [
      "Official docs",
      "Checked — Room.storage, Store, withdraw(), transfer(), and Room.getEventLog()"
    ],
    [
      "Static API review",
      "Passed — shared budgets, exact source-target identity, event window, and Store context"
    ],
    [
      "Offline coordinator review",
      "Passed — reserve, target capacity, release, duplicate Creep, event missing, ambiguous, and missed-window states"
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
      "budget-model",
      "Calculate one shared withdrawal budget"
    ],
    [
      "target-capacity",
      "Reserve target capacity in the same coordinator"
    ],
    [
      "target-selection",
      "Choose a target with an explicit policy"
    ],
    [
      "pending-records",
      "Record only accepted actions"
    ],
    [
      "execute",
      "Execute one coordinated hauler action"
    ],
    [
      "verify-event",
      "Verify the exact event on the next tick"
    ],
    [
      "verification-runner",
      "Process pending records once"
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
<p>Use this guide when owned Creeps withdraw Energy from an owned room Storage and deliver it to room consumers while preserving a deliberate reserve. It treats the reserve as a budget policy and the Creep action as a separate execution step.</p>
<p>Choose <a href="/en/blog/screeps-link-transfer-energy">the Link coordination guide</a> when multiple Links share a receiver. Choose the Controller downgrade guide when emergency upgrading should temporarily outrank the ordinary Storage budget.</p>

<h2 id="budget-model">Calculate one shared withdrawal budget</h2>
<p>If several haulers each read <code>storage.store</code> independently, each can believe the same Energy above reserve is available. Build one coordinator per room and tick, then reserve from that shared budget before an adjacent Creep calls <code>withdraw()</code>.</p>
<pre><code class="language-javascript">function createStorageEnergyCoordinator(
  room,
  reserveEnergy
) {
  const storage = room?.storage;
  const storageEnergy = storage
    ? storage.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;

  return {
    tick: Game.time,
    roomName: room?.name ?? null,
    storageId: storage?.id ?? null,
    reserveEnergy,
    withdrawalRemaining: Math.max(
      0,
      storageEnergy - reserveEnergy
    ),
    targetReservations: Object.create(null),
    actedCreepIds: new Set()
  };
}

function reserveWithdrawal(coordinator, requested) {
  const amount = Math.min(
    Math.max(0, requested),
    coordinator.withdrawalRemaining
  );

  coordinator.withdrawalRemaining -= amount;
  return amount;
}

function releaseWithdrawal(coordinator, amount) {
  coordinator.withdrawalRemaining += Math.max(0, amount);
}</code></pre>
<p>The reserve value is a room policy, not an official optimum. A controller emergency, defense reserve, Terminal hub, Factory, or Power Spawn may require a different budget.</p>

<h2 id="target-capacity">Reserve target capacity in the same coordinator</h2>
<pre><code class="language-javascript">function reserveTargetCapacity(
  coordinator,
  target,
  requested
) {
  const currentFree = target.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const alreadyReserved =
    coordinator.targetReservations[target.id] ?? 0;
  const available = Math.max(
    0,
    currentFree - alreadyReserved
  );
  const amount = Math.min(
    Math.max(0, requested),
    available
  );

  coordinator.targetReservations[target.id] =
    alreadyReserved + amount;

  return amount;
}

function releaseTargetCapacity(
  coordinator,
  targetId,
  amount
) {
  coordinator.targetReservations[targetId] =
    Math.max(
      0,
      (coordinator.targetReservations[targetId] ?? 0)
      - Math.max(0, amount)
    );
}</code></pre>
<p>This reservation is local planning state. It is not a server lock and does not protect against another independent module that bypasses the coordinator.</p>

<h2 id="target-selection">Choose a target with an explicit policy</h2>
<pre><code class="language-javascript">const ENERGY_TARGET_PRIORITY = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_EXTENSION]: 1
};

function selectStorageEnergyTarget(
  coordinator,
  creep
) {
  return creep.room.find(FIND_MY_STRUCTURES, {
    filter: structure => {
      const priority =
        ENERGY_TARGET_PRIORITY[structure.structureType];

      if (!Number.isInteger(priority)) {
        return false;
      }

      const currentFree =
        structure.store.getFreeCapacity(
          RESOURCE_ENERGY
        );
      const reserved =
        coordinator.targetReservations[
          structure.id
        ] ?? 0;

      return currentFree - reserved > 0;
    }
  }).sort((left, right) =>
    ENERGY_TARGET_PRIORITY[left.structureType]
      - ENERGY_TARGET_PRIORITY[right.structureType]
    || creep.pos.getRangeTo(left)
      - creep.pos.getRangeTo(right)
    || left.id.localeCompare(right.id)
  )[0] ?? null;
}</code></pre>
<p>Spawn-first is a transparent example policy, not a universal room strategy. Stable tie-breaking prevents the target from changing for no meaningful reason.</p>

<h2 id="pending-records">Record only accepted actions</h2>
<p>For an accepted withdrawal, the transfer event's logical source is the Storage and its target is the Creep. For an accepted delivery, the source is the Creep and the target is the structure. Save those exact IDs after the action returns <code>OK</code>.</p>
<pre><code class="language-javascript">function recordStorageEnergyAction(
  room,
  action
) {
  if (!Array.isArray(room.memory.storageEnergyPending)) {
    room.memory.storageEnergyPending = [];
  }

  room.memory.storageEnergyPending.push({
    requestId: [
      Game.time,
      action.kind,
      action.sourceId,
      action.targetId
    ].join(':'),
    submittedAt: Game.time,
    kind: action.kind,
    sourceId: action.sourceId,
    targetId: action.targetId,
    amount: action.amount,
    sourceEnergyBefore: action.sourceEnergyBefore,
    targetEnergyBefore: action.targetEnergyBefore
  });

  room.memory.storageEnergyPending =
    room.memory.storageEnergyPending.slice(-20);
}</code></pre>

<h2 id="execute">Execute one coordinated hauler action</h2>
<pre><code class="language-javascript">function runStorageEnergyHauler(
  coordinator,
  creep
) {
  if (
    !creep
    || creep.my !== true
    || creep.spawning === true
    || creep.room.name !== coordinator.roomName
  ) {
    return { status: 'creep-unavailable' };
  }

  if (coordinator.actedCreepIds.has(creep.id)) {
    return { status: 'creep-already-planned' };
  }

  coordinator.actedCreepIds.add(creep.id);

  const room = creep.room;
  const storage = room.storage;

  if (
    !storage
    || storage.id !== coordinator.storageId
  ) {
    return { status: 'storage-unavailable' };
  }

  const carried = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (carried === 0) {
    if (!creep.pos.isNearTo(storage)) {
      return {
        status: 'moving-to-storage',
        moveResult: creep.moveTo(storage, {
          range: 1,
          reusePath: 10
        })
      };
    }

    const requested = Math.min(
      creep.store.getFreeCapacity(RESOURCE_ENERGY),
      coordinator.withdrawalRemaining
    );
    const amount = reserveWithdrawal(
      coordinator,
      requested
    );

    if (amount <= 0) {
      return { status: 'storage-reserve-protected' };
    }

    const sourceEnergyBefore =
      storage.store.getUsedCapacity(
        RESOURCE_ENERGY
      );
    const targetEnergyBefore =
      creep.store.getUsedCapacity(
        RESOURCE_ENERGY
      );
    const result = creep.withdraw(
      storage,
      RESOURCE_ENERGY,
      amount
    );

    if (result !== OK) {
      releaseWithdrawal(coordinator, amount);
      return {
        status: 'withdraw-rejected',
        amount,
        result
      };
    }

    recordStorageEnergyAction(room, {
      kind: 'withdraw',
      sourceId: storage.id,
      targetId: creep.id,
      amount,
      sourceEnergyBefore,
      targetEnergyBefore
    });

    return {
      status: 'withdraw-accepted',
      amount,
      result
    };
  }

  const target = selectStorageEnergyTarget(
    coordinator,
    creep
  );

  if (!target) {
    return {
      status: 'delivery-target-not-found',
      carried
    };
  }

  if (!creep.pos.isNearTo(target)) {
    return {
      status: 'moving-to-target',
      targetId: target.id,
      moveResult: creep.moveTo(target, {
        range: 1,
        reusePath: 10
      })
    };
  }

  const amount = reserveTargetCapacity(
    coordinator,
    target,
    carried
  );

  if (amount <= 0) {
    return {
      status: 'target-capacity-reserved',
      targetId: target.id
    };
  }

  const sourceEnergyBefore =
    creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
  const targetEnergyBefore =
    target.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
  const result = creep.transfer(
    target,
    RESOURCE_ENERGY,
    amount
  );

  if (result !== OK) {
    releaseTargetCapacity(
      coordinator,
      target.id,
      amount
    );
    return {
      status: 'transfer-rejected',
      targetId: target.id,
      amount,
      result
    };
  }

  recordStorageEnergyAction(room, {
    kind: 'transfer',
    sourceId: creep.id,
    targetId: target.id,
    amount,
    sourceEnergyBefore,
    targetEnergyBefore
  });

  return {
    status: 'transfer-accepted',
    targetId: target.id,
    amount,
    result
  };
}</code></pre>
<p>Movement is handled before reserving Energy or capacity. If the action is rejected, the local reservation is released so later haulers in the same tick do not inherit a false commitment.</p>

<h2 id="verify-event">Verify the exact event on the next tick</h2>
<pre><code class="language-javascript">function verifyStorageEnergyAction(
  room,
  pending
) {
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
      event.event === EVENT_TRANSFER
      && event.objectId === pending.sourceId
      && event.data?.targetId === pending.targetId
      && event.data?.resourceType === RESOURCE_ENERGY
    );

  if (matches.length === 0) {
    return { status: 'matching-event-not-found' };
  }

  if (matches.length > 1) {
    return {
      status: 'matching-event-ambiguous',
      matchCount: matches.length
    };
  }

  const event = matches[0];
  const source = Game.getObjectById(
    pending.sourceId
  );
  const target = Game.getObjectById(
    pending.targetId
  );

  return {
    status: 'transfer-event-verified',
    kind: pending.kind,
    eventAmount: event.data?.amount ?? null,
    sourceEnergyNow: source?.store
      ? source.store.getUsedCapacity(
          RESOURCE_ENERGY
        )
      : null,
    targetEnergyNow: target?.store
      ? target.store.getUsedCapacity(
          RESOURCE_ENERGY
        )
      : null
  };
}</code></pre>
<p>The event identifies the accepted source-target pair. Current Stores are supporting context only: other haulers, Links, Spawns, Extensions, Towers, or consumers can change the same objects during the tick.</p>

<h2 id="verification-runner">Process pending records once</h2>
<pre><code class="language-javascript">function verifyPendingStorageActions(room) {
  const pending = Array.isArray(
    room.memory.storageEnergyPending
  )
    ? room.memory.storageEnergyPending
    : [];

  const results = [];
  const keep = [];

  for (const action of pending) {
    const result = verifyStorageEnergyAction(
      room,
      action
    );

    results.push({
      requestId: action.requestId,
      ...result
    });

    if (result.status === 'accepted-this-tick') {
      keep.push(action);
    }
  }

  room.memory.storageEnergyPending = keep;
  return results;
}</code></pre>
<p>Run verification before submitting new actions so the one-tick event window is not lost. Production code may retain failed results in a bounded diagnostic history instead of deleting them immediately.</p>

<h2 id="return-codes">Return-code boundaries</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Meaning</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>The action was accepted.</td><td>Record the exact IDs and inspect the next tick's event.</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>The Creep is not adjacent.</td><td>Move without reserving the budget.</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>The source amount changed.</td><td>Release the local reservation and refresh.</td></tr>
<tr><td><code>ERR_FULL</code></td><td>The receiving Store cannot accept the request.</td><td>Release target capacity and reselect.</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>The selected object cannot perform that side of the transfer.</td><td>Check source/target type and ownership.</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>The resource or amount is invalid.</td><td>Inspect the captured request.</td></tr>
</tbody></table></div>

<h2 id="production-adaptation">Production adaptation notes</h2>
<p>Build the coordinator once per room and tick, pass it to every eligible hauler, and keep final action calls in one logistics layer. Extend target priorities only after the room budget decides that the Energy may be spent. A Storage reserve protects stock; it does not by itself decide whether upgrading, defense, spawning, Labs, Factory, Power processing, or Terminal operations should win.</p>

<h2 id="verification">Verification status and evidence boundary</h2>
<p>The reserve math, same-tick reservation rules, exact event identity, and missed-window states were checked statically and offline. No live Storage race, multiple-hauler event log, room traffic, or Console output was available. Console and live multi-tick verification remain pending.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.storage" rel="nofollow">API Reference: Room.storage</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.withdraw" rel="nofollow">API Reference: Creep.withdraw()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.transfer" rel="nofollow">API Reference: Creep.transfer()</a></li>
<li><a href="https://docs.screeps.com/api/#Room.getEventLog" rel="nofollow">API Reference: Room.getEventLog()</a></li>
</ul>`,
} satisfies EnglishEditorialArticleOverride;
