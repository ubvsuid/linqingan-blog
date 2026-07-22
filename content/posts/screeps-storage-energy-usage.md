---
title: "Room.storage 怎么安全读写 Energy：取能、配送与保留线"
description: "检查room.storage、Store库存和Creep状态，在Storage与Spawn或Extension之间搬运Energy，并处理目标排序、保留量和动作返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Storage"
  - "Energy"
  - "物流"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Storage存在性、保留量、Creep容量、配送目标容量和状态切换，不是Screeps官方服务器）"
  testResult: "房间或Storage缺失、库存低于保留线、Creep空载与满载、目标已满、可取amount和配送优先级场景通过。"
featured: false
---

`room.storage` 是当前可见房间中Storage的快捷入口。房间没有Storage时会得到 `undefined`，因此任何 `storage.store` 访问都必须放在判空之后。

本文用一只运输Creep完成基础闭环：

```text
Creep没有Energy
→ 从Storage取能

Creep携带Energy
→ 送到缺能的Spawn或Extension
```

同时增加Storage保留线，避免运输者把长期储备全部搬空。

## `room.storage` 的前置条件

```js
const room = Game.rooms.W1N1;

if (!room) {
  return;
}

const storage = room.storage;

if (!storage) {
  return;
}
```

需要分别检查：

- 房间当前是否可见；
- 房间是否已经建成Storage；
- Storage是否属于当前任务允许使用的对象；
- Store中是否有目标资源。

同一房间最多一座Storage，因此不需要像Container一样从多个对象中选择。

## Storage与Container的职责差异

两者都使用Store，也都能作为 `withdraw()` 和 `transfer()` 目标，但常见用途不同：

- Container可以有多座，常放在Source、Controller或运输路径附近；
- Storage每个房间最多一座，适合长期集中保存多种资源；
- `room.storage` 可直接访问，Container通常通过搜索、位置或ID取得；
- Storage容量更大，但本文不把它当成无限库存。

## 为什么需要Energy保留线

若运输逻辑只检查：

```js
storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0
```

它可能在长期低能量状态下继续搬空Storage。

可以设置：

```js
const STORAGE_ENERGY_RESERVE = 20000;
```

计算当前可取量：

```js
function getStorageWithdrawableEnergy(input) {
  const {
    storageEnergy,
    reserveEnergy,
    creepFreeCapacity
  } = input;

  if (
    !Number.isFinite(storageEnergy)
    || !Number.isFinite(reserveEnergy)
    || !Number.isFinite(creepFreeCapacity)
    || storageEnergy < 0
    || reserveEnergy < 0
    || creepFreeCapacity <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(0, storageEnergy - reserveEnergy),
    creepFreeCapacity
  );
}
```

保留线属于房间策略，不是官方建议数值。不同房间阶段应使用不同配置。

## 怎样选择配送目标

Spawn与Extension都使用Energy，但优先级可能不同。

基础方案可以先按结构类型，再按路径：

```js
const STRUCTURE_PRIORITY = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_EXTENSION]: 1
};

function selectEnergyTarget(creep, structures) {
  const candidates = [];

  for (const structure of structures) {
    const priority = STRUCTURE_PRIORITY[
      structure.structureType
    ];

    if (!Number.isInteger(priority)) {
      continue;
    }

    const free = structure.store.getFreeCapacity(
      RESOURCE_ENERGY
    );

    if (!Number.isFinite(free) || free <= 0) {
      continue;
    }

    const path = creep.pos.findPathTo(structure, {
      range: 1,
      ignoreCreeps: true
    });

    if (
      path.length === 0
      && !creep.pos.isNearTo(structure)
    ) {
      continue;
    }

    candidates.push({
      structure,
      priority,
      free,
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    if (left.pathLength !== right.pathLength) {
      return left.pathLength - right.pathLength;
    }

    if (left.free !== right.free) {
      return right.free - left.free;
    }

    return left.structure.id.localeCompare(
      right.structure.id
    );
  })[0]?.structure ?? null;
}
```

这是一种Spawn优先策略。防御期间Tower可能需要更高优先级，本文不把这份顺序描述为通用最优。

## 完整示例

```js
const STORAGE_ENERGY_RESERVE = 20000;
const STRUCTURE_PRIORITY = {
  [STRUCTURE_SPAWN]: 0,
  [STRUCTURE_EXTENSION]: 1
};

function getStorageWithdrawableEnergy(input) {
  const {
    storageEnergy,
    reserveEnergy,
    creepFreeCapacity
  } = input;

  if (
    !Number.isFinite(storageEnergy)
    || !Number.isFinite(reserveEnergy)
    || !Number.isFinite(creepFreeCapacity)
    || storageEnergy < 0
    || reserveEnergy < 0
    || creepFreeCapacity <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(0, storageEnergy - reserveEnergy),
    creepFreeCapacity
  );
}

function selectEnergyTarget(creep) {
  const structures = creep.room.find(
    FIND_MY_STRUCTURES,
    {
      filter: structure =>
        (
          structure.structureType === STRUCTURE_SPAWN
          || structure.structureType === STRUCTURE_EXTENSION
        )
        && structure.store.getFreeCapacity(
          RESOURCE_ENERGY
        ) > 0
    }
  );

  return structures.sort((left, right) => {
    const leftPriority = STRUCTURE_PRIORITY[
      left.structureType
    ];
    const rightPriority = STRUCTURE_PRIORITY[
      right.structureType
    ];

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftRange = creep.pos.getRangeTo(left);
    const rightRange = creep.pos.getRangeTo(right);

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.id.localeCompare(right.id);
  })[0] ?? null;
}

function runStorageHauler(creep, reserveEnergy) {
  if (creep.spawning === true) {
    return {
      status: 'creep-spawning'
    };
  }

  const storage = creep.room.storage;

  if (!storage) {
    return {
      status: 'storage-missing'
    };
  }

  const carriedEnergy = creep.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (carriedEnergy === 0) {
    const storageEnergy = storage.store.getUsedCapacity(
      RESOURCE_ENERGY
    );
    const free = creep.store.getFreeCapacity(
      RESOURCE_ENERGY
    );
    const amount = getStorageWithdrawableEnergy({
      storageEnergy,
      reserveEnergy,
      creepFreeCapacity: free
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
      const moveResult = creep.moveTo(storage, {
        range: 1,
        reusePath: 10
      });

      return {
        status: 'moving-to-storage',
        amount,
        result,
        moveResult
      };
    }

    return {
      status: result === OK
        ? 'withdraw-submitted'
        : 'withdraw-failed',
      amount,
      result
    };
  }

  const target = selectEnergyTarget(creep);

  if (!target) {
    return {
      status: 'delivery-target-not-found',
      carriedEnergy
    };
  }

  const free = target.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const amount = Math.min(carriedEnergy, free);

  if (amount <= 0) {
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
    const moveResult = creep.moveTo(target, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-delivery-target',
      targetId: target.id,
      amount,
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'transfer-submitted'
      : 'transfer-failed',
    targetId: target.id,
    amount,
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;

  if (!creep) {
    return;
  }

  const outcome = runStorageHauler(
    creep,
    STORAGE_ENERGY_RESERVE
  );

  if (
    outcome.status === 'withdraw-failed'
    || outcome.status === 'transfer-failed'
  ) {
    console.log({
      type: 'storage-hauler-action-failed',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

## 为什么空载才回Storage

示例用：

```js
carriedEnergy === 0
```

切换到取能；只要仍携带Energy就继续配送。

这避免Creep送出一部分后立即折返Storage。多资源运输者不能只看Energy，需要检查整个Store和当前任务资源类型。

## 所有Spawn和Extension都满了怎么办

示例返回：

```text
delivery-target-not-found
```

Creep保留现有Energy，不会自动丢弃。

后备动作可能包括：

- 填充Tower；
- 给Controller Container或Link补充；
- 送回Storage；
- 等待下一次生成消耗；
- 执行其他房间任务。

这些属于房间物流调度，不应在基础示例里隐式选择。

## 同tick目标容量竞争

多个Hauler可能同时看到同一Extension有50空位，并各自提交50 Energy。

前置检查不能保证最终每个动作都成功。仍要处理：

- `ERR_FULL`；
- `ERR_NOT_ENOUGH_RESOURCES`；
- 下一tick目标Store；
- 多Creep目标预订。

## 返回值排查

### `withdraw()`

- `OK`：命令已安排；
- `ERR_NOT_ENOUGH_RESOURCES`：Storage没有指定数量；
- `ERR_FULL`：Creep容量已满；
- `ERR_NOT_IN_RANGE`：需要靠近Storage；
- `ERR_INVALID_TARGET`、`ERR_INVALID_ARGS`：对象或参数错误；
- `ERR_BUSY`、`ERR_NOT_OWNER`：Creep状态或所有权问题。

### `transfer()`

- `OK`：命令已安排；
- `ERR_NOT_ENOUGH_RESOURCES`：Creep没有指定数量；
- `ERR_FULL`：目标没有剩余容量；
- `ERR_NOT_IN_RANGE`：需要靠近目标；
- `ERR_INVALID_TARGET`、`ERR_INVALID_ARGS`：对象或参数错误；
- `ERR_BUSY`、`ERR_NOT_OWNER`：Creep状态或所有权问题。

双方Store变化应在下一tick重新读取。

## 常见错误

### 不检查 `room.storage`

没有Storage或房间不可见时会读取 `undefined.store`。

### 没有保留线

运输逻辑可能把长期储备持续搬空。

### 用 `energyCapacityAvailable` 判断Storage库存

它只描述Spawn与Extension的房间生成容量，不是Storage Store。

### Creep还有Energy时又回Storage

会产生频繁往返。明确空载与配送边界。

### 目标已满仍持续前往

每tick重新检查目标容量，并处理同tick竞争。

### 把固定优先级当成所有阶段的答案

防御、冲级和恢复阶段需要不同配置。

## 离线模拟结果

构建检查覆盖：

1. 房间或Storage缺失；
2. Storage库存低于或等于保留线；
3. 可取量不超过库存减保留线；
4. 可取量不超过Creep容量；
5. 空载进入取能；
6. 携带Energy进入配送；
7. Spawn优先于Extension；
8. 同类型按距离、容量和ID稳定选择。

离线测试不能模拟真实Store结算、多Hauler竞争、道路与房间阶段变化。

## 适用边界

本文不覆盖：

- Tower、Lab、Terminal等完整优先级；
- 多资源运输；
- 多Creep目标预订；
- 跨房间物流；
- 动态保留线；
- Storage容量规划；
- 中央运输调度器。

JavaScript语法和离线物流决策已检查，真实运输与多tick库存仍待Screeps环境验证。

## 相关站内内容

- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [如何向Spawn配送Energy](/blog/screeps-creep-deliver-energy)
- [Creep如何切换工作状态](/blog/screeps-creep-working-state)
- [Link怎么传输Energy](/blog/screeps-link-transfer-energy)
- [Game.cpu.getUsed()怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [Room.storage API](https://docs.screeps.com/api/#Room-storage)
- [StructureStorage API](https://docs.screeps.com/api/#StructureStorage)
- [Store API](https://docs.screeps.com/api/#Store)
- [Creep.withdraw API](https://docs.screeps.com/api/#Creep.withdraw)
- [Creep.transfer API](https://docs.screeps.com/api/#Creep.transfer)

资料核对日期：2026-07-22。离线物流决策已通过；真实Storage运输仍待Screeps环境验证。
