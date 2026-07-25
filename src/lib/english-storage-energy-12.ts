import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

export const englishStorageEnergyArticle = {
  slug: "screeps-storage-energy-usage",
  path: "/en/blog/screeps-storage-energy-usage",
  chinesePath: "/blog/screeps-storage-energy-usage",
  title: "Screeps Storage Energy: Reserves, Withdrawals, and Delivery",
  headline: "How to Use Storage Energy Without Draining Your Reserve",
  description:
    "Guard room.storage access, calculate withdrawable Energy above a configurable reserve, switch a hauler between withdrawal and delivery, select Spawn and Extension targets deterministically, handle action return codes, and verify same-tick capacity races.",
  category: "LOGISTICS · STORAGE ENERGY RESERVE",
  publishedAt: "2026-07-26",
  publishedLabel: "July 26, 2026",
  readingTime: "18 min read",
  breadcrumbLabel: "Storage Energy",
  tags: ["Screeps", "Storage", "Energy", "Hauler", "Logistics"],
  keywords: [
    "Screeps room.storage energy",
    "Screeps Storage reserve",
    "Screeps withdraw Storage Energy",
    "Screeps Spawn Extension hauler",
    "Screeps Storage logistics",
  ],
  primaryKeyword: "Screeps room.storage energy",
  searchIntent: "Withdraw and deliver Storage Energy while preserving a room-specific reserve",
  finalScore: 98,
  verification: [
    ["Chinese source article", "Reviewed in full"],
    ["Official docs", "Checked — Room.storage, StructureStorage, Store, withdraw(), transfer() and return codes"],
    ["Policy boundary", "The Energy reserve and Spawn-first delivery order are explicit site strategies, not official optimal values"],
    ["Execution boundary", "OK schedules one action; Store and target capacity can still change through other same-tick operations"],
    ["JavaScript syntax", "Passed"],
    ["Offline logistics review", "Passed — missing Storage, reserve protection, Creep state, target capacity, amount and stable priority states"],
    ["Screeps Console test", "Pending"],
    ["Live Storage reserve, pathing, same-tick capacity and delivery test", "Pending"],
    ["Last verified", "July 26, 2026"],
  ],
  toc: [
    ["quick-answer", "Quick answer"],
    ["storage-access", "Guard room.storage access"],
    ["reserve", "Calculate Energy above the reserve"],
    ["state-machine", "Use a simple hauler state machine"],
    ["targets", "Choose delivery targets deterministically"],
    ["complete-example", "Complete Storage hauler example"],
    ["same-tick", "Handle same-tick capacity changes"],
    ["after-ok", "Verify Store changes later"],
    ["return-codes", "Handle return codes"],
    ["debugging", "Debugging checklist"],
    ["scope", "Scope and next steps"],
    ["faq", "FAQ"],
    ["official-docs", "Official documentation"],
  ],
  faq: [
    [
      "What does room.storage return when no Storage exists?",
      "It is undefined, so check the room and Storage before accessing storage.store.",
    ],
    [
      "Is a 20,000 Energy reserve an official recommendation?",
      "No. A reserve is a room policy. Choose it from your spawning, defense, upgrading, Terminal and production needs.",
    ],
    [
      "Why calculate a specific withdrawal amount?",
      "It prevents the Creep from crossing the configured reserve and avoids requesting more than its current free capacity.",
    ],
    [
      "Does OK guarantee the target still had capacity?",
      "It confirms the action was scheduled. Other actions in the same tick can compete for Store capacity, so save the result and inspect later state.",
    ],
  ],
  previous: {
    href: "/en/blog/screeps-mineral-extractor-harvest",
    label: "Previous resource guide",
    title: "Harvest Room Minerals",
  },
  next: {
    href: "/en/blog/screeps-power-spawn-process-power",
    label: "Next advanced resource guide",
    title: "Process Power Safely",
  },
  articleHtml: String.raw`
<h2 id="quick-answer">Quick answer</h2>
<p>Check that the room is visible and <code>room.storage</code> exists. When the hauler is empty, calculate only the Energy above a configurable reserve and cap the amount by Creep free capacity. When the hauler carries Energy, select a valid Spawn or Extension with free capacity using a stable priority rule, call <code>transfer()</code>, and preserve the carried Energy when no target exists. Treat every reserve and priority value as your own policy.</p>

<h2 id="storage-access">Guard room.storage access</h2>
<pre><code class="language-javascript">function getVisibleStorage(roomName) {
  if (typeof roomName !== 'string') {
    return null;
  }

  const room = Game.rooms[roomName];
  if (!room || !room.storage) {
    return null;
  }

  return room.storage;
}</code></pre>
<p><code>room.storage</code> is a convenient property only for a currently visible room. A room can be valid while having no completed Storage, so do not chain directly into <code>room.storage.store</code> without a guard.</p>

<h2 id="reserve">Calculate Energy above the reserve</h2>
<p>A reserve prevents a general-purpose hauler from consuming the room's entire long-term stock.</p>
<pre><code class="language-javascript">function getStorageWithdrawableEnergy(input) {
  const {
    storageEnergy,
    reserveEnergy,
    creepFreeCapacity
  } = input;

  if (
    !Number.isFinite(storageEnergy)
    || !Number.isFinite(reserveEnergy)
    || !Number.isFinite(creepFreeCapacity)
    || storageEnergy &lt; 0
    || reserveEnergy &lt; 0
    || creepFreeCapacity &lt;= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(0, storageEnergy - reserveEnergy),
    creepFreeCapacity
  );
}</code></pre>
<p>For example, Storage with 25,000 Energy and a 20,000 reserve exposes at most 5,000 Energy to this task. The Creep's capacity may reduce the requested amount further.</p>
<pre><code class="language-javascript">const STORAGE_ENERGY_RESERVE = 20000;</code></pre>
<p>This number is an example, not an official threshold. A defensive room, an upgrader rush, or a Terminal hub may need a different reserve.</p>

<h2 id="state-machine">Use a simple hauler state machine</h2>
<p>The smallest useful state can come directly from the Creep Store:</p>
<pre><code class="language-javascript">function getStorageHaulerMode(creep) {
  if (!creep) {
    return 'missing';
  }

  return creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  ) === 0
    ? 'withdraw'
    : 'deliver';
}</code></pre>
<p>As long as the Creep still carries Energy, it remains in delivery mode. This avoids turning around after a partial transfer. A multi-resource hauler needs an explicit task resource rather than relying on Energy alone.</p>

<h2 id="targets">Choose delivery targets deterministically</h2>
<p>This guide uses Spawn before Extension, then range, then structure ID. The order is a transparent baseline, not a universal room strategy.</p>
<pre><code class="language-javascript">const ENERGY_TARGET_PRIORITY = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_EXTENSION]: 1
};

function selectStorageEnergyTarget(creep) {
  const candidates = creep.room.find(
    FIND_MY_STRUCTURES,
    {
      filter: structure => {
        const priority = ENERGY_TARGET_PRIORITY[
          structure.structureType
        ];
        const free = structure.store
          ? structure.store.getFreeCapacity(
              RESOURCE_ENERGY
            )
          : 0;

        return Number.isInteger(priority)
          && Number.isFinite(free)
          && free > 0;
      }
    }
  );

  return candidates.sort((left, right) => {
    const priorityDifference =
      ENERGY_TARGET_PRIORITY[left.structureType]
      - ENERGY_TARGET_PRIORITY[right.structureType];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const rangeDifference =
      creep.pos.getRangeTo(left)
      - creep.pos.getRangeTo(right);

    if (rangeDifference !== 0) {
      return rangeDifference;
    }

    return left.id.localeCompare(right.id);
  })[0] || null;
}</code></pre>
<p>Stable tie-breaking matters because a different target every tick can produce unnecessary path churn. A production room may add Towers, Labs, Power Spawn or Controller logistics through a higher-level dispatcher.</p>

<h2 id="complete-example">Complete Storage hauler example</h2>
<pre><code class="language-javascript">function runStorageEnergyHauler(creep, reserveEnergy) {
  if (!creep || creep.spawning === true) {
    return { status: 'creep-unavailable' };
  }

  const storage = creep.room.storage;
  if (!storage) {
    return { status: 'storage-missing' };
  }

  const carriedEnergy = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (carriedEnergy === 0) {
    const storageEnergy = storage.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
    const amount = getStorageWithdrawableEnergy({
      storageEnergy,
      reserveEnergy,
      creepFreeCapacity: creep.store.getFreeCapacity(
        RESOURCE_ENERGY
      )
    });

    if (amount <= 0) {
      return {
        status: 'storage-reserve-protected',
        storageEnergy,
        reserveEnergy
      };
    }

    const result = creep.withdraw(
      storage,
      RESOURCE_ENERGY,
      amount
    );

    if (result === ERR_NOT_IN_RANGE) {
      return {
        status: 'moving-to-storage',
        amount,
        result,
        moveResult: creep.moveTo(storage, {
          range: 1,
          reusePath: 10
        })
      };
    }

    return {
      status: result === OK
        ? 'withdraw-scheduled'
        : 'withdraw-rejected',
      amount,
      result,
      storageEnergyBefore: storageEnergy
    };
  }

  const target = selectStorageEnergyTarget(creep);
  if (!target) {
    return {
      status: 'delivery-target-not-found',
      carriedEnergy
    };
  }

  const targetFree = target.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const amount = Math.min(carriedEnergy, targetFree);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      status: 'target-full',
      targetId: target.id
    };
  }

  const result = creep.transfer(
    target,
    RESOURCE_ENERGY,
    amount
  );

  if (result === ERR_NOT_IN_RANGE) {
    return {
      status: 'moving-to-target',
      targetId: target.id,
      amount,
      result,
      moveResult: creep.moveTo(target, {
        range: 1,
        reusePath: 10
      })
    };
  }

  return {
    status: result === OK
      ? 'transfer-scheduled'
      : 'transfer-rejected',
    targetId: target.id,
    targetType: target.structureType,
    targetFreeBefore: targetFree,
    carriedEnergyBefore: carriedEnergy,
    amount,
    result
  };
}</code></pre>
<pre><code class="language-javascript">module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;
  if (!creep) {
    return;
  }

  const outcome = runStorageEnergyHauler(
    creep,
    STORAGE_ENERGY_RESERVE
  );

  if (
    outcome.status === 'withdraw-rejected'
    || outcome.status === 'transfer-rejected'
    || Game.time % 100 === 0
  ) {
    console.log(JSON.stringify({
      type: 'storage-energy-hauler',
      creepName: creep.name,
      roomName: creep.room.name,
      ...outcome
    }));
  }
};</code></pre>

<h2 id="same-tick">Handle same-tick capacity changes</h2>
<p>Multiple haulers can inspect the same free capacity before any action settles. Their preflight amounts may therefore add up to more than the target can accept. Keep every return code, avoid printing success from preflight alone, and consider a room-level reservation map when multiple workers share targets.</p>
<pre><code class="language-javascript">function reserveEnergyCapacity(
  reservations,
  targetId,
  requested,
  currentFree
) {
  const alreadyReserved = reservations[targetId] || 0;
  const available = Math.max(
    0,
    currentFree - alreadyReserved
  );
  const amount = Math.min(requested, available);

  reservations[targetId] = alreadyReserved + amount;
  return amount;
}</code></pre>
<p>A reservation is local coordination. It does not lock the official Store and must be rebuilt from current tick state.</p>

<h2 id="after-ok">Verify Store changes later</h2>
<p>For withdrawal, save the Storage Energy and Creep Energy before the call. For delivery, save the target ID, target free capacity, Creep Energy and requested amount. On the next tick compare the recovered objects, while accounting for other room logistics.</p>
<pre><code class="language-javascript">function snapshotEnergyTransfer(creep, target) {
  return {
    gameTick: Game.time,
    creepName: creep.name,
    creepEnergy: creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    targetId: target.id,
    targetEnergy: target.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    targetFree: target.store.getFreeCapacity(
      RESOURCE_ENERGY
    )
  };
}</code></pre>

<h2 id="return-codes">Handle return codes</h2>
<div class="table-scroll"><table>
<thead><tr><th>Code</th><th>Typical cause</th><th>Response</th></tr></thead>
<tbody>
<tr><td><code>OK</code></td><td>Action scheduled</td><td>Verify Store later</td></tr>
<tr><td><code>ERR_NOT_OWNER</code></td><td>Creep not yours</td><td>Check selected Creep</td></tr>
<tr><td><code>ERR_BUSY</code></td><td>Creep spawning</td><td>Wait</td></tr>
<tr><td><code>ERR_NOT_ENOUGH_RESOURCES</code></td><td>Storage amount changed</td><td>Refresh stock and reserve</td></tr>
<tr><td><code>ERR_INVALID_TARGET</code></td><td>Wrong object</td><td>Check Storage or target type</td></tr>
<tr><td><code>ERR_FULL</code></td><td>Creep or target Store full</td><td>Refresh capacity</td></tr>
<tr><td><code>ERR_NOT_IN_RANGE</code></td><td>Not adjacent</td><td>Move to range 1</td></tr>
<tr><td><code>ERR_INVALID_ARGS</code></td><td>Bad resource or amount</td><td>Validate amount</td></tr>
</tbody></table></div>

<h2 id="debugging">Debugging checklist</h2>
<ul>
<li>Confirm the room is visible.</li>
<li>Guard <code>room.storage</code>.</li>
<li>Read current Storage Energy.</li>
<li>Calculate Energy above the configured reserve.</li>
<li>Cap the amount by Creep free capacity.</li>
<li>Use a stable target priority.</li>
<li>Check target Energy free capacity.</li>
<li>Keep the action return code.</li>
<li>Coordinate same-tick reservations when needed.</li>
<li>Verify Store changes on the next tick.</li>
</ul>

<h2 id="scope">Scope and next steps</h2>
<p>This example fills Spawn and Extension only. It does not optimize roads, Towers, Links, Labs, Factory, Terminal, multi-room hauling, emergency priorities or multiple resource types. Continue with <a href="/en/blog/screeps-power-spawn-process-power">Power Spawn processing</a> for a controlled long-running Energy consumer.</p>

<h2 id="faq">Frequently asked questions</h2>
<h3>Why keep carried Energy when no target exists?</h3>
<p>Silently dropping or returning it would add an unstated policy. The caller can decide whether to wait, fill another structure, or return to Storage.</p>
<h3>Why prioritize Spawn before Extension?</h3>
<p>It is a simple documented baseline. Your room scheduler may choose different priorities based on defense, spawning queues or distance.</p>
<h3>Can two haulers both pass the capacity check?</h3>
<p>Yes. They read current state before actions settle. Use return codes and optional local reservations to coordinate them.</p>

<h2 id="official-docs">Official documentation</h2>
<ul>
<li><a href="https://docs.screeps.com/api/#Room.storage" rel="nofollow">API Reference: Room.storage</a></li>
<li><a href="https://docs.screeps.com/api/#StructureStorage" rel="nofollow">API Reference: StructureStorage</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.withdraw" rel="nofollow">API Reference: Creep.withdraw()</a></li>
<li><a href="https://docs.screeps.com/api/#Creep.transfer" rel="nofollow">API Reference: Creep.transfer()</a></li>
<li><a href="https://docs.screeps.com/api/#Store" rel="nofollow">API Reference: Store</a></li>
</ul>`,
} satisfies EnglishBeginnerArticle;
