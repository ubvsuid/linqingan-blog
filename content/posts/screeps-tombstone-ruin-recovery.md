---
title: "Screeps Tombstone 和 Ruin 怎么回收资源：withdraw()、过期时间与抢救优先级"
description: "扫描 Screeps 房间中的 Tombstone 与 Ruin，按 ticksToDecay、资源类型和距离选择目标，使用 Creep.withdraw() 回收资源，并处理返回码、目标失效和下一 tick 验证。"
publishedAt: "2026-08-04"
updatedAt: "2026-08-04"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Creep API"
  - "Tombstone"
  - "Ruin"
  - "资源回收"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-04"
  testedAt: "2026-08-04"
  testEnvironment: "Node.js 离线模拟（候选过滤、资源优先级、ticksToDecay、容量、距离和稳定排序；不是 Screeps 官方服务器）"
  testResult: "9 个候选选择边界场景通过；完整示例通过 JavaScript 语法检查。真实 shard 中的同 tick 竞争、移动、衰减和 withdraw 结算仍待验证。"
featured: false
---

Creep 死亡后留下的资源不一定需要放弃，建筑被摧毁后留在 Ruin 中的资源也可以回收。但这两类对象都不是地面 `Resource`：

- 地面资源使用 `creep.pickup(resource)`；
- Tombstone 和 Ruin 使用 `creep.withdraw(target, resourceType, amount)`；
- Container、Storage 等建筑中的资源同样使用 `withdraw()`，但它们的生命周期和目标选择逻辑不同。

本文只解决一个具体问题：**怎样让回收 Creep 在当前可见房间中发现 Tombstone 与 Ruin，按过期风险和资源价值选择目标，并对 `withdraw()` 的提交结果进行可追踪验证。**

## Tombstone 与 Ruin 有什么区别

### Tombstone 是死亡 Creep 的遗留对象

Tombstone 代表已经死亡的 Creep。它可以被穿过，并带有：

- `store`：死亡时遗留的资源；
- `ticksToDecay`：距离消失还有多少 tick；
- `deathTime`：Creep 死亡的游戏时间；
- `creep`：死亡 Creep 的只读信息。

普通 Tombstone 的存在时间与原 Creep 的身体部件数量相关。实际回收逻辑不需要自己重新计算，直接读取当前对象的 `ticksToDecay` 更可靠。

### Ruin 是被摧毁建筑的遗留对象

Ruin 代表已经被摧毁的 Structure。它同样可以被穿过，并带有：

- `store`：建筑被摧毁时遗留的资源；
- `ticksToDecay`：距离消失还有多少 tick；
- `destroyTime`：建筑被摧毁的游戏时间；
- `structure`：原建筑的只读信息。

普通 Ruin 通常会保留一段固定时间，但特殊对象可能不同。因此不要在业务代码里把过期时间写死为某个常量，应始终以对象当前的 `ticksToDecay` 为准。

## 为什么不能只选择最近的目标

最近的 Tombstone 不一定最值得回收。例如：

- 近处只有少量 Energy，远处有 Power 或 Ghodium；
- 一个目标将在 8 tick 后消失，另一个还有 300 tick；
- Creep 只剩 50 容量，目标中有多种资源；
- 多只回收 Creep 同时选择了同一个目标；
- 目标被 hostile Rampart 覆盖，虽然看得到却无法正常接近或取用。

因此候选排序至少应该考虑：

1. 是否仍有可取资源；
2. 是否即将过期；
3. 资源类型的业务优先级；
4. 当前最多能取多少；
5. 距离或路径成本；
6. 完全同分时的稳定排序。

## 第一步：定义资源优先级

下面只是一个示例策略，不是 Screeps 的固定规则。你应根据自己的房间经济修改。

```js
const RESOURCE_PRIORITY = [
  RESOURCE_POWER,
  RESOURCE_OPS,
  RESOURCE_GHODIUM,
  RESOURCE_CATALYST,
  RESOURCE_ZYNTHIUM,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_OXYGEN,
  RESOURCE_HYDROGEN,
  RESOURCE_ENERGY
];

function getResourceRank(resourceType) {
  const index = RESOURCE_PRIORITY.indexOf(resourceType);

  // 未列出的矿物、化合物或商品排在 Energy 前面。
  return index === -1
    ? RESOURCE_PRIORITY.length - 1
    : index;
}
```

这里把 Energy 放在较低优先级，是因为 Energy 通常更容易补充。战争现场、远程房间或低 RCL 房间可能需要把 Energy 提高。

## 第二步：检查目标是否被敌对 Rampart 覆盖

可见目标并不代表一定适合回收。一个简单过滤方法是检查目标位置上的 Rampart：

```js
function isBlockedByHostileRampart(target) {
  const structures = target.pos.lookFor(LOOK_STRUCTURES);

  return structures.some(structure =>
    structure.structureType === STRUCTURE_RAMPART
    && structure.my !== true
    && structure.isPublic !== true
  );
}
```

这个过滤只能判断目标所在格。真实移动路径上仍可能有墙体、关闭的 Rampart、敌对 Creep 或 CostMatrix 限制，移动结果仍需单独记录。

## 第三步：从 Store 中选择一种资源

`target.store` 可能包含 Energy、矿物、化合物、Power 或商品。先排除数量无效的资源，再按优先级选择：

```js
function selectResourceType(target, freeCapacity) {
  if (!target?.store || freeCapacity <= 0) {
    return null;
  }

  const resourceTypes = Object.keys(target.store)
    .filter(resourceType => {
      const amount = target.store.getUsedCapacity(resourceType);
      return Number.isFinite(amount) && amount > 0;
    })
    .sort((left, right) => {
      const rankDifference =
        getResourceRank(left) - getResourceRank(right);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      const leftAmount = target.store.getUsedCapacity(left);
      const rightAmount = target.store.getUsedCapacity(right);

      if (leftAmount !== rightAmount) {
        return rightAmount - leftAmount;
      }

      return left.localeCompare(right);
    });

  return resourceTypes[0] ?? null;
}
```

不要直接假设目标只有 Energy，也不要把 `Object.keys(target.store)[0]` 当成稳定业务优先级。

## 第四步：建立候选对象并排序

下面的实现同时扫描 Tombstone 和 Ruin，并使用 `ticksToDecay`、资源优先级、可取数量、距离和 ID 排序。

```js
function getRecoveryKind(target) {
  if (typeof Tombstone !== 'undefined' && target instanceof Tombstone) {
    return 'tombstone';
  }

  if (typeof Ruin !== 'undefined' && target instanceof Ruin) {
    return 'ruin';
  }

  // 离线测试或不使用 instanceof 时的安全回退。
  if ('deathTime' in target) return 'tombstone';
  if ('destroyTime' in target) return 'ruin';

  return 'unknown';
}

function describeRecoveryCandidate(creep, target) {
  const freeCapacity = creep.store.getFreeCapacity();

  if (
    !Number.isFinite(freeCapacity)
    || freeCapacity <= 0
    || !target?.id
    || !target.store
    || !Number.isFinite(target.ticksToDecay)
    || target.ticksToDecay <= 0
    || isBlockedByHostileRampart(target)
  ) {
    return null;
  }

  const resourceType = selectResourceType(
    target,
    freeCapacity
  );

  if (!resourceType) {
    return null;
  }

  const available = target.store.getUsedCapacity(resourceType);
  const amount = Math.min(available, freeCapacity);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    target,
    targetId: target.id,
    kind: getRecoveryKind(target),
    resourceType,
    amount,
    ticksToDecay: target.ticksToDecay,
    resourceRank: getResourceRank(resourceType),
    range: creep.pos.getRangeTo(target)
  };
}

function compareRecoveryCandidates(left, right) {
  if (left.ticksToDecay !== right.ticksToDecay) {
    return left.ticksToDecay - right.ticksToDecay;
  }

  if (left.resourceRank !== right.resourceRank) {
    return left.resourceRank - right.resourceRank;
  }

  if (left.amount !== right.amount) {
    return right.amount - left.amount;
  }

  if (left.range !== right.range) {
    return left.range - right.range;
  }

  return left.targetId.localeCompare(right.targetId);
}

function selectRecoveryCandidate(creep) {
  const targets = [
    ...creep.room.find(FIND_TOMBSTONES),
    ...creep.room.find(FIND_RUINS)
  ];

  return targets
    .map(target => describeRecoveryCandidate(creep, target))
    .filter(candidate => candidate !== null)
    .sort(compareRecoveryCandidates)[0] ?? null;
}
```

这套排序把“即将消失”放在第一位。它适合抢救型回收。若你的房间更关注高价值资源，可以把 `resourceRank` 放到 `ticksToDecay` 前面。

## 完整可运行示例

下面的版本包含：

- Tombstone 与 Ruin 扫描；
- 目标 ID 持久化；
- 每 tick 重新恢复并校验目标；
- `withdraw()` 与 `moveTo()` 返回值分开记录；
- 同一 Creep 每 tick 只提交一次回收动作；
- 下一 tick 使用 Store 差值进行有限验证；
- Memory 历史记录限制为最近 20 条。

```js
const RESOURCE_PRIORITY = [
  RESOURCE_POWER,
  RESOURCE_OPS,
  RESOURCE_GHODIUM,
  RESOURCE_CATALYST,
  RESOURCE_ZYNTHIUM,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_OXYGEN,
  RESOURCE_HYDROGEN,
  RESOURCE_ENERGY
];

function getResourceRank(resourceType) {
  const index = RESOURCE_PRIORITY.indexOf(resourceType);
  return index === -1
    ? RESOURCE_PRIORITY.length - 1
    : index;
}

function getRecoveryKind(target) {
  if ('deathTime' in target) return 'tombstone';
  if ('destroyTime' in target) return 'ruin';
  return 'unknown';
}

function isBlockedByHostileRampart(target) {
  return target.pos.lookFor(LOOK_STRUCTURES)
    .some(structure =>
      structure.structureType === STRUCTURE_RAMPART
      && structure.my !== true
      && structure.isPublic !== true
    );
}

function selectResourceType(target, freeCapacity) {
  if (!target?.store || freeCapacity <= 0) {
    return null;
  }

  return Object.keys(target.store)
    .filter(resourceType =>
      target.store.getUsedCapacity(resourceType) > 0
    )
    .sort((left, right) => {
      const rankDifference =
        getResourceRank(left) - getResourceRank(right);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      const amountDifference =
        target.store.getUsedCapacity(right)
        - target.store.getUsedCapacity(left);

      return amountDifference !== 0
        ? amountDifference
        : left.localeCompare(right);
    })[0] ?? null;
}

function describeRecoveryCandidate(creep, target) {
  const freeCapacity = creep.store.getFreeCapacity();

  if (
    freeCapacity <= 0
    || !target?.id
    || !target.store
    || target.ticksToDecay <= 0
    || isBlockedByHostileRampart(target)
  ) {
    return null;
  }

  const resourceType = selectResourceType(
    target,
    freeCapacity
  );

  if (!resourceType) {
    return null;
  }

  const available = target.store.getUsedCapacity(resourceType);
  const amount = Math.min(available, freeCapacity);

  if (amount <= 0) {
    return null;
  }

  return {
    target,
    targetId: target.id,
    kind: getRecoveryKind(target),
    resourceType,
    amount,
    ticksToDecay: target.ticksToDecay,
    resourceRank: getResourceRank(resourceType),
    range: creep.pos.getRangeTo(target)
  };
}

function compareRecoveryCandidates(left, right) {
  return (
    left.ticksToDecay - right.ticksToDecay
    || left.resourceRank - right.resourceRank
    || right.amount - left.amount
    || left.range - right.range
    || left.targetId.localeCompare(right.targetId)
  );
}

function selectRecoveryCandidate(creep) {
  return [
    ...creep.room.find(FIND_TOMBSTONES),
    ...creep.room.find(FIND_RUINS)
  ]
    .map(target => describeRecoveryCandidate(creep, target))
    .filter(Boolean)
    .sort(compareRecoveryCandidates)[0] ?? null;
}

function saveRecoveryTarget(creep, candidate) {
  creep.memory.recoveryTarget = candidate
    ? {
        id: candidate.targetId,
        kind: candidate.kind,
        resourceType: candidate.resourceType
      }
    : null;
}

function restoreRecoveryCandidate(creep) {
  const saved = creep.memory.recoveryTarget;

  if (!saved?.id || !saved.resourceType) {
    return null;
  }

  const target = Game.getObjectById(saved.id);

  if (!target) {
    saveRecoveryTarget(creep, null);
    return null;
  }

  const candidate = describeRecoveryCandidate(creep, target);

  if (
    !candidate
    || candidate.resourceType !== saved.resourceType
  ) {
    saveRecoveryTarget(creep, null);
    return null;
  }

  return candidate;
}

function getRecoveryMemory() {
  Memory.recovery ??= {
    pending: {},
    history: []
  };

  return Memory.recovery;
}

function verifyPreviousRecovery(creep) {
  const memory = getRecoveryMemory();
  const pending = memory.pending[creep.name];

  if (!pending || pending.tick >= Game.time) {
    return null;
  }

  const currentCreepAmount =
    creep.store.getUsedCapacity(pending.resourceType);
  const target = Game.getObjectById(pending.targetId);
  const currentTargetAmount = target?.store
    ? target.store.getUsedCapacity(pending.resourceType)
    : null;

  const creepGain =
    currentCreepAmount - pending.creepAmountBefore;
  const targetLoss = currentTargetAmount === null
    ? null
    : pending.targetAmountBefore - currentTargetAmount;

  let status = 'not-observed';

  if (
    creepGain > 0
    && targetLoss !== null
    && targetLoss > 0
  ) {
    status = 'matching-delta-observed';
  } else if (creepGain > 0) {
    status = 'creep-gain-observed';
  } else if (target === null) {
    status = 'target-unavailable';
  } else if (Game.time > pending.tick + 1) {
    status = 'late-observation';
  }

  const record = {
    verifiedAt: Game.time,
    creepName: creep.name,
    ...pending,
    currentCreepAmount,
    currentTargetAmount,
    creepGain,
    targetLoss,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  delete memory.pending[creep.name];

  return record;
}

function submitRecovery(creep, candidate) {
  creep.memory.recoverySubmittedAt ??= 0;

  if (creep.memory.recoverySubmittedAt === Game.time) {
    return {
      status: 'already-submitted-this-tick'
    };
  }

  if (!creep.pos.isNearTo(candidate.target)) {
    const moveResult = creep.moveTo(candidate.target, {
      range: 1,
      reusePath: 5,
      visualizePathStyle: {
        stroke: '#ffffff'
      }
    });

    return {
      status: 'moving-to-recovery-target',
      targetId: candidate.targetId,
      kind: candidate.kind,
      resourceType: candidate.resourceType,
      moveResult
    };
  }

  const creepAmountBefore =
    creep.store.getUsedCapacity(candidate.resourceType);
  const targetAmountBefore =
    candidate.target.store.getUsedCapacity(
      candidate.resourceType
    );

  const result = creep.withdraw(
    candidate.target,
    candidate.resourceType,
    candidate.amount
  );

  creep.memory.recoverySubmittedAt = Game.time;

  if (result === OK) {
    const memory = getRecoveryMemory();

    memory.pending[creep.name] = {
      tick: Game.time,
      targetId: candidate.targetId,
      kind: candidate.kind,
      resourceType: candidate.resourceType,
      requestedAmount: candidate.amount,
      creepAmountBefore,
      targetAmountBefore
    };
  }

  return {
    status: result === OK
      ? 'withdraw-submitted'
      : 'withdraw-failed',
    targetId: candidate.targetId,
    kind: candidate.kind,
    resourceType: candidate.resourceType,
    requestedAmount: candidate.amount,
    result
  };
}

function runRecoveryCreep(creep) {
  const verification = verifyPreviousRecovery(creep);

  if (creep.spawning === true) {
    return {
      status: 'creep-spawning',
      verification
    };
  }

  if (creep.getActiveBodyparts(CARRY) <= 0) {
    return {
      status: 'no-active-carry-part',
      verification
    };
  }

  if (creep.store.getFreeCapacity() <= 0) {
    return {
      status: 'creep-full',
      verification
    };
  }

  let candidate = restoreRecoveryCandidate(creep);

  if (!candidate) {
    candidate = selectRecoveryCandidate(creep);
    saveRecoveryTarget(creep, candidate);
  }

  if (!candidate) {
    return {
      status: 'recovery-target-not-found',
      verification
    };
  }

  return {
    ...submitRecovery(creep, candidate),
    verification
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Recovery1;

  if (!creep) {
    return;
  }

  const outcome = runRecoveryCreep(creep);

  if (
    outcome.status === 'withdraw-failed'
    || outcome.status === 'no-active-carry-part'
  ) {
    console.log(JSON.stringify({
      type: 'resource-recovery-problem',
      tick: Game.time,
      creepName: creep.name,
      ...outcome
    }));
  }
};
```

## 为什么 `OK` 不能直接等同于资源已经到账

Screeps 在 tick 中收集玩家提交的动作，并在后续阶段处理。`withdraw()` 返回 `OK` 表示命令已被接受安排，不应把同一行代码后读取到的 Store 变化当成最终结算证明。

更稳妥的方法是：

1. 当前 tick 保存 Creep 与目标的资源数量；
2. 下一 tick 再读取两边 Store；
3. 记录 Creep 增量与目标减量；
4. 同时保留“目标已消失”“观察过晚”“未观察到变化”等状态。

即使下一 tick 观察到差值，也只能说明状态变化与该动作一致。若同 tick 有其他 Creep、transfer、drop 或脚本动作参与，差值可能被并发行为干扰。因此本文使用的是**有限验证**，不是绝对因果证明。

## `withdraw()` 常见返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 动作已经提交 | 下一 tick 验证 Store 变化 |
| `ERR_NOT_OWNER` | 调用者不是自己的 Creep | 检查对象来源 |
| `ERR_BUSY` | Creep 仍在生成 | 等待生成结束 |
| `ERR_NOT_ENOUGH_RESOURCES` | 目标资源已不足或被其他 Creep 先取走 | 清除目标并重新选择 |
| `ERR_INVALID_TARGET` | 目标已失效，或不是可 withdraw 的对象 | 重新通过 ID 恢复和判空 |
| `ERR_FULL` | Creep 没有剩余容量 | 先配送或卸载资源 |
| `ERR_NOT_IN_RANGE` | 距离超过 1 格 | 调用 `moveTo()` 并单独检查结果 |
| `ERR_INVALID_ARGS` | 资源类型或 amount 无效 | 重新计算资源类型与数量 |

多只 Creep 可以在同一 tick 对同一个对象提交 `withdraw()`。这也是为什么候选选择、目标预订和下一 tick 验证不能省略。

## 常见错误

### 用 `pickup()` 处理 Tombstone 或 Ruin

`pickup()` 只接受地面 `Resource`。Tombstone 与 Ruin 有 `store`，应使用 `withdraw()`。

### 只找 Tombstone，漏掉 Ruin

战斗后被摧毁的 Storage、Terminal、Lab、Factory 或其他建筑可能留下更高价值资源。应根据任务范围同时扫描 `FIND_TOMBSTONES` 与 `FIND_RUINS`。

### 把过期时间写死

不同对象的生命周期可能不同。排序时直接读取 `ticksToDecay`，不要根据对象类型自行猜测剩余时间。

### 长期把完整对象写入 Memory

跨 tick 只保存 ID、资源类型和必要业务字段。下一 tick 使用 `Game.getObjectById()` 恢复对象，并再次检查是否为空、是否还有资源以及是否仍可访问。

### 只记录 `withdraw()`，不记录 `moveTo()`

距离不足时，真正失败的可能是移动：无路径、fatigue、MOVE 部件失效或路径被阻挡。两个动作的结果应分开记录。

### 多只回收 Creep 同时冲向同一目标

本文只提供单 Creep 示例。多 Creep 系统应增加目标预订表，并在候选过滤中排除已被其他 Creep 预订的对象或资源份额。

### 回收后没有配送状态

当 Creep 满载时，回收任务应切换到 Storage、Terminal、Spawn 或指定容器。本文故意不混入配送逻辑，以免一个示例同时承担过多职责。

## 离线验证覆盖

候选选择测试覆盖了以下边界：

1. Creep 容量为 0；
2. 目标 Store 为空；
3. `ticksToDecay` 为 0；
4. 目标被不可通行的敌对 Rampart 覆盖；
5. 多资源目标按业务优先级选择；
6. 可取数量不超过 Creep 剩余容量；
7. 更早过期的目标优先；
8. 同过期时间下按资源和数量排序；
9. 完全同分时使用 ID 稳定排序。

完整示例已通过 JavaScript 语法检查。离线测试不能证明：

- 官方 shard 中的实际移动结果；
- Tombstone 与 Ruin 的真实衰减过程；
- 多玩家或多 Creep 同 tick 竞争；
- hostile Rampart 与复杂 CostMatrix 的完整交互；
- `withdraw()` 在真实服务器上的最终结算；
- 该策略在你的房间中具有最低 CPU 成本。

这些项目在没有真实 Console 或 shard 记录前保持未验证状态。

## 适用边界

本文不覆盖：

- 地面 Resource 的 `pickup()`；
- Container、Storage 的常规运输循环；
- 跨房间回收；
- 多 Creep 目标预订实现；
- 战斗区域威胁评分；
- 回收完成后的配送与仓储策略；
- 自动出售或加工回收资源。

## 相关站内内容

- [Creep.pickup() 怎么安全捡取地上的 Energy](/blog/screeps-creep-pickup-dropped-energy)
- [Creep.withdraw() 如何从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [Game.getObjectById() 怎么恢复跨 tick 目标](/blog/screeps-game-get-object-by-id)
- [多个 Source 怎样按路径选择目标](/blog/screeps-select-source-by-path)
- [Creep 如何切换采集与工作状态](/blog/screeps-creep-working-state)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [Tombstone API](https://docs.screeps.com/api/#Tombstone)
- [Ruin API](https://docs.screeps.com/api/#Ruin)
- [Creep.withdraw API](https://docs.screeps.com/api/#Creep.withdraw)
- [Find Constants](https://docs.screeps.com/api/#Constants-Find-Constants)
- [Store API](https://docs.screeps.com/api/#Store)
- [Game.getObjectById API](https://docs.screeps.com/api/#Game.getObjectById)

资料核对日期：2026-08-04。候选选择与完整示例语法已离线检查；真实 Console、官方 shard 和多 Creep 竞争仍待验证。
