---
title: "Screeps 房间 Energy 为什么一直充不满：energyAvailable、Extension 缺口与运输诊断"
description: "诊断 Screeps 房间的 room.energyAvailable 为什么长期低于 energyCapacityAvailable，逐个检查 Spawn、Extension、运输者、transfer() 返回值与下一 tick 的真实变化。"
publishedAt: "2026-08-04"
updatedAt: "2026-08-04"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Spawn"
  - "Energy"
  - "调试"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-04"
  testedAt: "2026-08-04"
  testEnvironment: "Node.js 离线模拟（Spawn/Extension 过滤、缺口统计、目标排序、转移数量与下一 tick 验证分类；不是 Screeps 官方服务器）"
  testResult: "10 个边界场景通过；完整示例通过 JavaScript 语法检查。真实 shard 中的道路拥堵、同 tick 生成消耗和多运输者竞争仍待验证。"
featured: false
---

`room.energyAvailable` 长时间低于 `room.energyCapacityAvailable`，不一定说明游戏数据出错。更常见的原因是：

- 运输者只给 Spawn 送 Energy，没有给 Extension 送；
- 目标筛选包含已满、失效或无法使用的建筑；
- Creep 没有携带 Energy，却仍在执行配送分支；
- `transfer()` 返回了错误码，但日志只记录了 `moveTo()`；
- 运输者刚补进 Energy，同一个 tick 或随后 tick 又有 Spawn 消耗；
- 代码只看房间总数，没有逐个检查缺口到底在哪座建筑。

本文只解决一个问题：**怎样把房间生成 Energy 拆成可检查的 Spawn 与 Extension 明细，并让一个运输者稳定选择未满目标、提交 `transfer()`、记录结果，再在下一 tick 做有限验证。**

## `energyAvailable` 与 `energyCapacityAvailable` 分别是什么

```js
room.energyAvailable
```

表示当前房间内所有 Spawn 和 Extension 已经装入、可供生成 Creep 使用的 Energy 总量。

```js
room.energyCapacityAvailable
```

表示这些 Spawn 和 Extension 的总 Energy 容量。

因此：

```js
const missingEnergy =
  room.energyCapacityAvailable - room.energyAvailable;
```

只说明“生成网络还有多少容量没有填满”，并不说明缺口在哪座建筑，也不说明运输为什么失败。

Storage、Container、Terminal 或 Link 中即使存有大量 Energy，也不会直接增加 `room.energyAvailable`。Energy 必须进入 Spawn 或 Extension，才能成为普通 `spawnCreep()` 可使用的房间生成 Energy。

## 先区分真实缺口与正常消耗

房间总量长期不满，可能是两种完全不同的情况。

### 真实供能问题

- 运输者没有选到未满 Extension；
- 运输者卡路或 fatigue；
- 运输者携带的不是 Energy；
- `transfer()` 返回 `ERR_FULL` 或 `ERR_NOT_IN_RANGE`；
- 代码同 tick 多次覆盖了 `transfer()`；
- 运输角色被其他任务提前返回。

### 正常生产消耗

Spawn 正在持续生成 Creep 时，Energy 网络本来就会被反复消耗。运输者可能成功补充了一座 Extension，但随后生成请求又消耗了房间 Energy。

所以不能只用：

```js
room.energyAvailable > previousEnergy
```

来证明一次配送成功。更直接的观察是：

1. 目标建筑的 Energy 是否增加；
2. 运输者携带的 Energy 是否减少；
3. 房间总 Energy 如何变化；
4. 同期是否存在新的 Spawn 请求或正在生成的 Creep。

## 不要再使用废弃的 `energy` 与 `energyCapacity`

Spawn 和 Extension 仍可能暴露旧属性别名，但新的代码应使用 Store API：

```js
const used =
  structure.store.getUsedCapacity(RESOURCE_ENERGY);

const capacity =
  structure.store.getCapacity(RESOURCE_ENERGY);

const free =
  structure.store.getFreeCapacity(RESOURCE_ENERGY);
```

这样可以直接表达当前量、总容量与剩余容量，也能与其他带 Store 的对象保持一致。

## 第一步：生成房间 Energy 明细

```js
function isSpawnEnergyStructure(structure) {
  return (
    structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION
  );
}

function getActiveSpawnEnergyStructures(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      isSpawnEnergyStructure(structure)
      && structure.isActive()
      && structure.store.getCapacity(RESOURCE_ENERGY) > 0
  });
}

function describeRoomEnergy(room) {
  const structures = getActiveSpawnEnergyStructures(room);

  const details = structures
    .map(structure => {
      const used =
        structure.store.getUsedCapacity(RESOURCE_ENERGY);
      const capacity =
        structure.store.getCapacity(RESOURCE_ENERGY);
      const free =
        structure.store.getFreeCapacity(RESOURCE_ENERGY);

      return {
        id: structure.id,
        type: structure.structureType,
        x: structure.pos.x,
        y: structure.pos.y,
        used,
        capacity,
        free
      };
    })
    .sort((left, right) =>
      left.type.localeCompare(right.type)
      || left.id.localeCompare(right.id)
    );

  return {
    roomName: room.name,
    roomEnergyAvailable: room.energyAvailable,
    roomEnergyCapacityAvailable:
      room.energyCapacityAvailable,
    missingEnergy: Math.max(
      0,
      room.energyCapacityAvailable
        - room.energyAvailable
    ),
    measuredUsed: details.reduce(
      (total, detail) => total + detail.used,
      0
    ),
    measuredCapacity: details.reduce(
      (total, detail) => total + detail.capacity,
      0
    ),
    structures: details
  };
}
```

在 Console 中查看：

```js
console.log(JSON.stringify(
  describeRoomEnergy(Game.rooms.W1N1),
  null,
  2
));
```

这份明细能快速回答：

- 缺口是在 Spawn 还是 Extension；
- 是否只有一座远端 Extension 没填满；
- 当前活动建筑的 Store 合计是否与房间指标一致；
- 是否存在结构状态或筛选逻辑需要继续调查。

不要在没有真实记录时直接断言“房间指标错误”。如果 `measuredUsed` 与 `room.energyAvailable` 不一致，应先保存当 tick 的完整结构明细、Controller 状态和相关日志，再做进一步验证。

## 第二步：只选择真正可接收 Energy 的目标

```js
function getFillCandidates(creep) {
  return getActiveSpawnEnergyStructures(creep.room)
    .map(target => ({
      target,
      free: target.store.getFreeCapacity(
        RESOURCE_ENERGY
      ),
      range: creep.pos.getRangeTo(target)
    }))
    .filter(candidate =>
      Number.isFinite(candidate.free)
      && candidate.free > 0
    )
    .sort((left, right) =>
      left.range - right.range
      || right.free - left.free
      || left.target.id.localeCompare(
        right.target.id
      )
    );
}
```

这个排序规则是：

1. 先选范围更近的目标；
2. 同距离时优先填更大的缺口；
3. 完全同分时按 ID 稳定排序。

它没有声称“直线距离等于真实路径成本”。如果房间布局复杂，应把目标排序升级为完整路径检查；本文保留 `moveTo()` 返回值，用来暴露无路径或移动失败。

## 完整示例：选择、配送与下一 tick 验证

```js
function isSpawnEnergyStructure(structure) {
  return (
    structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION
  );
}

function getActiveSpawnEnergyStructures(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      isSpawnEnergyStructure(structure)
      && structure.isActive()
      && structure.store.getCapacity(
        RESOURCE_ENERGY
      ) > 0
  });
}

function describeRoomEnergy(room) {
  const structures = getActiveSpawnEnergyStructures(
    room
  );

  const details = structures.map(structure => ({
    id: structure.id,
    type: structure.structureType,
    used: structure.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    capacity: structure.store.getCapacity(
      RESOURCE_ENERGY
    ),
    free: structure.store.getFreeCapacity(
      RESOURCE_ENERGY
    )
  }));

  return {
    roomName: room.name,
    roomEnergyAvailable: room.energyAvailable,
    roomEnergyCapacityAvailable:
      room.energyCapacityAvailable,
    missingEnergy: Math.max(
      0,
      room.energyCapacityAvailable
        - room.energyAvailable
    ),
    measuredUsed: details.reduce(
      (total, detail) => total + detail.used,
      0
    ),
    measuredCapacity: details.reduce(
      (total, detail) => total + detail.capacity,
      0
    ),
    structures: details
  };
}

function getFillCandidates(creep) {
  return getActiveSpawnEnergyStructures(creep.room)
    .map(target => ({
      target,
      free: target.store.getFreeCapacity(
        RESOURCE_ENERGY
      ),
      range: creep.pos.getRangeTo(target)
    }))
    .filter(candidate =>
      Number.isFinite(candidate.free)
      && candidate.free > 0
    )
    .sort((left, right) =>
      left.range - right.range
      || right.free - left.free
      || left.target.id.localeCompare(
        right.target.id
      )
    );
}

function getEnergyFillMemory() {
  Memory.energyFill ??= {
    pending: {},
    history: []
  };

  return Memory.energyFill;
}

function verifyPreviousEnergyFill(creep) {
  const memory = getEnergyFillMemory();
  const pending = memory.pending[creep.name];

  if (!pending || pending.tick >= Game.time) {
    return null;
  }

  const target = Game.getObjectById(
    pending.targetId
  );
  const room = Game.rooms[pending.roomName];

  const targetNow = target?.store
    ? target.store.getUsedCapacity(
        RESOURCE_ENERGY
      )
    : null;

  const creepNow =
    creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    );

  const roomNow = room
    ? room.energyAvailable
    : null;

  const targetGain = targetNow === null
    ? null
    : targetNow - pending.targetBefore;

  const creepLoss =
    pending.creepBefore - creepNow;

  const roomDelta = roomNow === null
    ? null
    : roomNow - pending.roomBefore;

  let status = 'not-observed';

  if (
    targetGain !== null
    && targetGain > 0
    && creepLoss > 0
  ) {
    status = 'matching-target-and-creep-delta';
  } else if (
    targetGain !== null
    && targetGain > 0
  ) {
    status = 'target-gain-observed';
  } else if (creepLoss > 0) {
    status = 'creep-loss-observed';
  } else if (
    roomDelta !== null
    && roomDelta > 0
  ) {
    status = 'room-increase-observed';
  } else if (target === null) {
    status = 'target-unavailable';
  } else if (Game.time > pending.tick + 1) {
    status = 'late-observation';
  }

  const record = {
    verifiedAt: Game.time,
    creepName: creep.name,
    ...pending,
    targetNow,
    creepNow,
    roomNow,
    targetGain,
    creepLoss,
    roomDelta,
    status
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  delete memory.pending[creep.name];

  return record;
}

function runSpawnEnergyFiller(creep) {
  const verification =
    verifyPreviousEnergyFill(creep);

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

  const carriedEnergy =
    creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    );

  if (carriedEnergy <= 0) {
    return {
      status: 'no-carried-energy',
      verification
    };
  }

  const roomState =
    describeRoomEnergy(creep.room);

  if (roomState.missingEnergy <= 0) {
    return {
      status: 'room-energy-full',
      roomState,
      verification
    };
  }

  if (
    creep.memory.energyFillDecisionTick
      === Game.time
  ) {
    return {
      status: 'already-decided-this-tick',
      roomState,
      verification
    };
  }

  creep.memory.energyFillDecisionTick =
    Game.time;

  const candidate =
    getFillCandidates(creep)[0];

  if (!candidate) {
    return {
      status:
        'no-fillable-active-structure',
      roomState,
      verification
    };
  }

  if (!creep.pos.isNearTo(candidate.target)) {
    const moveResult = creep.moveTo(
      candidate.target,
      {
        range: 1,
        reusePath: 5
      }
    );

    return {
      status: 'moving-to-energy-target',
      targetId: candidate.target.id,
      targetType:
        candidate.target.structureType,
      moveResult,
      roomState,
      verification
    };
  }

  const amount = Math.min(
    carriedEnergy,
    candidate.target.store.getFreeCapacity(
      RESOURCE_ENERGY
    )
  );

  if (
    !Number.isFinite(amount)
    || amount <= 0
  ) {
    return {
      status: 'invalid-transfer-amount',
      targetId: candidate.target.id,
      roomState,
      verification
    };
  }

  const targetBefore =
    candidate.target.store.getUsedCapacity(
      RESOURCE_ENERGY
    );

  const result = creep.transfer(
    candidate.target,
    RESOURCE_ENERGY,
    amount
  );

  if (result === OK) {
    getEnergyFillMemory()
      .pending[creep.name] = {
        tick: Game.time,
        roomName: creep.room.name,
        targetId: candidate.target.id,
        targetType:
          candidate.target.structureType,
        requestedAmount: amount,
        targetBefore,
        creepBefore: carriedEnergy,
        roomBefore:
          creep.room.energyAvailable
      };
  }

  return {
    status: result === OK
      ? 'transfer-submitted'
      : 'transfer-failed',
    result,
    targetId: candidate.target.id,
    targetType:
      candidate.target.structureType,
    requestedAmount: amount,
    roomState,
    verification
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.EnergyFiller1;

  if (!creep) {
    return;
  }

  const outcome =
    runSpawnEnergyFiller(creep);

  if (
    outcome.status === 'transfer-failed'
    || outcome.status
      === 'no-fillable-active-structure'
    || outcome.status
      === 'no-active-carry-part'
  ) {
    console.log(JSON.stringify({
      type: 'spawn-energy-fill-problem',
      tick: Game.time,
      creepName: creep.name,
      ...outcome
    }));
  }
};
```

这个示例故意不包含“从哪里取 Energy”。运输者的取能策略应独立处理，例如从 Storage、Container 或 Link 取能。把取能和配送拆开，可以避免“Creep 没有 Energy”与“找不到未满 Extension”混成同一个问题。

## `transfer()` 返回值怎么处理

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 配送动作已提交 | 下一 tick 查看目标与 Creep Store |
| `ERR_NOT_OWNER` | 调用者不是自己的 Creep | 检查对象来源 |
| `ERR_BUSY` | Creep 仍在生成 | 等待生成完成 |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep 没有请求数量的 Energy | 重新读取携带量 |
| `ERR_INVALID_TARGET` | 目标不能接收该资源 | 重新筛选 Spawn/Extension |
| `ERR_FULL` | 目标已满，可能被其他 Creep 先填充 | 清除目标并重新选择 |
| `ERR_NOT_IN_RANGE` | 距离超过 1 格 | 单独记录 `moveTo()` 结果 |
| `ERR_INVALID_ARGS` | 资源类型或数量无效 | 检查 `RESOURCE_ENERGY` 与 amount |

不要只写：

```js
creep.transfer(target, RESOURCE_ENERGY);
creep.moveTo(target);
```

而不保存两个调用的返回值。这样无法区分动作距离不足、目标已满、Creep 没 Energy，还是移动本身失败。

## 为什么目标增加了，房间总量仍可能没变

假设运输者给 Extension 增加了 50 Energy，同时 Spawn 系统消费了 50 Energy：

```text
目标 Extension：+50
房间生成 Energy：0
运输者 Energy：-50
```

此时配送可能成功，但 `room.energyAvailable` 的净变化为 0。

所以验证优先级应是：

1. 目标 Store 增量；
2. Creep Store 减量；
3. 房间总量变化；
4. 同期 Spawn 行为。

即使目标增量与 Creep 减量匹配，也只是与该动作一致的证据。多运输者、Power Creep 的 `OPERATE_EXTENSION`、其他配送动作或生成消耗都可能影响观察结果。

## 常见错误

### 只给 Spawn 送 Energy

RCL 2 以后，房间的大部分生成容量来自 Extension。只筛选 `STRUCTURE_SPAWN` 会让 `energyAvailable` 长期停在 Spawn 自身容量附近。

### 把 Storage Energy 当成生成 Energy

Storage 有 Energy 不代表 `spawnCreep()` 可以直接使用。普通生成消耗来自同房间 Spawn 与 Extension。

### 目标筛选没有检查剩余容量

如果目标已经满了，`transfer()` 会返回 `ERR_FULL`。候选必须检查：

```js
target.store.getFreeCapacity(
  RESOURCE_ENERGY
) > 0
```

### 运输者没有携带 Energy

配送函数应在最前面检查 Creep Store。没有 Energy 时继续找目标，只会产生无意义移动。

### 同 tick 多次调用 `transfer()`

相同动作管线中的多次调用可能互相覆盖。每只 Creep 每 tick 应只做一次最终配送决定。

### 只看直线距离，不记录移动结果

近目标可能被墙体、Rampart、其他 Creep 或 CostMatrix 规则阻挡。即使目标选择使用范围排序，也必须保留 `moveTo()` 返回值。

### 看到 `OK` 就立即读取 Store

`OK` 表示动作已被接受安排，不等于同一行代码后的对象已经反映最终结算。保存前值并在下一 tick 观察。

### 忽略建筑是否可用

当 Controller 等级不足时，建筑可能无法使用。候选筛选中使用 `structure.isActive()`，并把异常建筑明细保留到日志中。

## 离线验证覆盖

本文章的纯逻辑测试覆盖：

1. 房间已经满 Energy；
2. Spawn 有缺口；
3. Extension 有缺口；
4. 非己方结构被排除；
5. 非活动结构被排除；
6. 同距离优先更大缺口；
7. 完全同分按 ID 稳定排序；
8. 转移数量不超过 Creep 携带量；
9. 转移数量不超过目标剩余容量；
10. 目标增加但房间净变化为 0 时，仍识别为目标配送证据。

完整示例已通过 JavaScript 语法检查。

离线测试不能证明：

- 真实 shard 中的移动与交通拥堵；
- 多运输者同 tick 竞争；
- Spawn 生成消耗与配送动作的实际结算顺序；
- Power Creep 操作对房间 Energy 的真实影响；
- 复杂 CostMatrix 下的可达性；
- 该方案在你的房间中具有最低 CPU 成本。

这些项目在没有真实 Console 与主循环记录前保持未验证。

## 适用边界

本文不覆盖：

- 运输者从 Storage、Container 或 Link 取能；
- 多运输者目标预订；
- Spawn 队列；
- 动态 Creep Body 设计；
- `spawnCreep()` 全部返回码；
- Power Creep 的自动化操作；
- 跨房间 Energy 运输。

## 相关站内内容

- [Screeps 如何按房间 Energy 动态生成 Creep 身体](/blog/screeps-dynamic-creep-body-energy)
- [StructureSpawn.spawnCreep() 返回码怎么排查](/blog/screeps-spawncreep-return-codes)
- [Screeps 房间断代后如何自动恢复最小采集者](/blog/screeps-spawn-emergency-recovery)
- [Creep 如何把 Energy 送进 Spawn](/blog/screeps-creep-deliver-energy)
- [Screeps Storage 的 Energy 应该怎么分配](/blog/screeps-storage-energy-usage)
- [ERR_NOT_IN_RANGE 应该怎么处理](/blog/screeps-err-not-in-range)
- [进入 Spawn 与 Creep 生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [Room API：energyAvailable 与 energyCapacityAvailable](https://docs.screeps.com/api/#Room)
- [StructureExtension API](https://docs.screeps.com/api/#StructureExtension)
- [StructureSpawn API](https://docs.screeps.com/api/#StructureSpawn)
- [Store API](https://docs.screeps.com/api/#Store)
- [Creep.transfer API](https://docs.screeps.com/api/#Creep.transfer)
- [Simultaneous Actions](https://docs.screeps.com/simultaneous-actions.html)

资料核对日期：2026-08-04。文档与完整示例语法已核对；真实 Console、官方 shard 与多运输者竞争仍待验证。
