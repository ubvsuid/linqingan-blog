---
title: "Creep.withdraw() 怎么从 Container 安全取出 Energy"
description: "筛选有Energy的Container，按路径和库存选择目标，计算本次amount，并处理容量、敌对Rampart、多Creep竞争、移动与withdraw返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Creep"
  - "withdraw"
  - "Container"
  - "Energy"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Container类型、库存、Creep容量、路径距离和取用amount，不是Screeps官方服务器）"
  testResult: "目标缺失、空Container、容量已满、非法库存、多个候选排序、amount上限和同分ID稳定场景通过。"
featured: false
---

`creep.withdraw(target, RESOURCE_ENERGY, amount)` 用来从Structure、Tombstone或Ruin取出资源。本文只处理当前房间里的Container，并把目标选择、取用数量、移动和返回值分开。

基础条件：

- Creep属于自己并且已经生成；
- Creep有剩余Store容量；
- 目标是当前仍存在的Container；
- Container中有Energy；
- Creep与目标相邻；
- 目标没有被敌对Rampart阻挡。

## `withdraw()` 与其他资源动作的方向

```js
creep.withdraw(container, RESOURCE_ENERGY)
```

资源从Container进入Creep。

```js
creep.transfer(spawn, RESOURCE_ENERGY)
```

资源从Creep进入目标。

```js
creep.pickup(resource)
```

目标是地面Resource，不是Container。

Creep之间传资源应由原持有者调用 `transfer()`，不能用 `withdraw()` 从另一只Creep取资源。

## 先计算本次可取数量

```js
function getWithdrawAmount(input) {
  const {
    targetEnergy,
    creepFreeCapacity,
    requestedAmount
  } = input;

  if (
    !Number.isFinite(targetEnergy)
    || !Number.isFinite(creepFreeCapacity)
    || targetEnergy <= 0
    || creepFreeCapacity <= 0
  ) {
    return 0;
  }

  const maximum = Math.min(
    targetEnergy,
    creepFreeCapacity
  );

  if (requestedAmount === undefined) {
    return maximum;
  }

  if (
    !Number.isFinite(requestedAmount)
    || requestedAmount <= 0
  ) {
    return 0;
  }

  return Math.min(maximum, requestedAmount);
}
```

显式传入amount可以控制单次取用量，但不能消除同tick竞争。其他Creep仍可能在动作结算阶段从同一Container取资源。

## 怎样选择Container

只取数组第一项会依赖 `Room.find()` 的返回顺序。下面先过滤，再按路径长度、库存和ID稳定排序。

```js
function selectContainer(creep, containers) {
  const candidates = [];

  for (const container of containers) {
    const energy = container.store.getUsedCapacity(
      RESOURCE_ENERGY
    );

    if (!Number.isFinite(energy) || energy <= 0) {
      continue;
    }

    const path = creep.pos.findPathTo(container, {
      range: 1,
      ignoreCreeps: true
    });

    if (!Array.isArray(path) || path.length === 0) {
      if (!creep.pos.isNearTo(container)) {
        continue;
      }
    }

    candidates.push({
      container,
      energy,
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (left.pathLength !== right.pathLength) {
      return left.pathLength - right.pathLength;
    }

    if (left.energy !== right.energy) {
      return right.energy - left.energy;
    }

    return left.container.id.localeCompare(
      right.container.id
    );
  })[0]?.container ?? null;
}
```

`ignoreCreeps: true`让目标选择不因临时交通每tick剧烈变化。实际移动仍可能被其他Creep阻挡。

## 完整示例

```js
function getWithdrawAmount(input) {
  const {
    targetEnergy,
    creepFreeCapacity,
    requestedAmount
  } = input;

  if (
    !Number.isFinite(targetEnergy)
    || !Number.isFinite(creepFreeCapacity)
    || targetEnergy <= 0
    || creepFreeCapacity <= 0
  ) {
    return 0;
  }

  const maximum = Math.min(
    targetEnergy,
    creepFreeCapacity
  );

  if (requestedAmount === undefined) {
    return maximum;
  }

  if (
    !Number.isFinite(requestedAmount)
    || requestedAmount <= 0
  ) {
    return 0;
  }

  return Math.min(maximum, requestedAmount);
}

function selectContainer(creep) {
  const containers = creep.room.find(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_CONTAINER
      && structure.store.getUsedCapacity(
        RESOURCE_ENERGY
      ) > 0
  });

  return creep.pos.findClosestByPath(containers, {
    ignoreCreeps: true,
    range: 1
  });
}

function runContainerWithdraw(creep) {
  if (creep.spawning === true) {
    return {
      status: 'creep-spawning'
    };
  }

  const free = creep.store.getFreeCapacity(
    RESOURCE_ENERGY
  );

  if (!Number.isFinite(free) || free <= 0) {
    return {
      status: 'creep-full'
    };
  }

  const container = selectContainer(creep);

  if (!container) {
    return {
      status: 'container-not-found'
    };
  }

  const available = container.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const amount = getWithdrawAmount({
    targetEnergy: available,
    creepFreeCapacity: free
  });

  if (amount <= 0) {
    return {
      status: 'nothing-to-withdraw',
      containerId: container.id
    };
  }

  const result = creep.withdraw(
    container,
    RESOURCE_ENERGY,
    amount
  );

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(container, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-container',
      containerId: container.id,
      amount,
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'withdraw-submitted'
      : 'withdraw-failed',
    containerId: container.id,
    amount,
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;

  if (!creep) {
    return;
  }

  const outcome = runContainerWithdraw(creep);

  if (outcome.status === 'withdraw-failed') {
    console.log({
      type: 'container-withdraw-failed',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

## 多只Creep从同一Container取能

官方API允许多个Creep在同一tick对同一对象调用 `withdraw()`。这不代表每个Creep都能获得它检查时看到的完整数量。

完整物流系统可以增加：

- Container目标预订；
- 预计取用量；
- 每个目标最大运输者数量；
- 下一tick根据真实Store重新分配。

本文只保存API结果，不把预检库存当成最终结算。

## 敌对Container与Rampart

官方API允许从敌对Structure、Tombstone或Ruin取资源，前提是目标上没有敌对Rampart。

本文搜索 `FIND_STRUCTURES`，可能找到非己方Container。只处理己方设施时，应增加：

```js
structure.my === true
```

Container本身通常没有 `my` 属性时，项目应根据房间控制、位置或任务白名单判断，不要把“可调用”与“应该调用”混为一谈。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 取资源命令已安排 | 下一tick读取双方Store |
| `ERR_NOT_OWNER` | Creep不属于自己，或敌对Rampart阻挡目标 | 检查对象与位置 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_NOT_ENOUGH_RESOURCES` | 目标没有指定数量 | 检查同tick竞争与amount |
| `ERR_INVALID_TARGET` | 目标不能保存该资源 | 检查对象类型 |
| `ERR_FULL` | Creep没有剩余容量 | 切换到配送动作 |
| `ERR_NOT_IN_RANGE` | 不相邻 | 移动到范围1 |
| `ERR_INVALID_ARGS` | 资源常量或amount无效 | 检查参数 |

`OK`只表示命令已安排，不能在同一tick手动把Creep Store当作已经增加。

## 常见错误

### 直接使用 `containers[0]`

返回顺序不是业务优先级，也可能没有任何候选。

### 忽略Creep剩余容量

会持续得到 `ERR_FULL`。

### amount大于目标库存

同tick其他Creep也可能先取走资源，正式结果仍需处理。

### 把 `withdraw()` 用于Creep之间

应由持有资源的Creep调用 `transfer()`。

### 保存完整Container对象到Memory

保存ID，后续tick通过 `Game.getObjectById()` 恢复并判空。

### 每tick打印“没有Container”

正常等待不需要持续刷屏。只在状态变化或诊断模式下记录。

## 离线模拟结果

构建检查覆盖：

1. Creep容量为0；
2. Container库存为0；
3. requestedAmount无效；
4. amount不超过库存和容量；
5. 多个Container按路径、库存和ID排序；
6. 无可达目标；
7. 同分选择稳定；
8. 输入异常。

离线测试不能模拟敌对Rampart、同tick结算、真实路径或Store变化。

## 适用边界

本文不覆盖：

- Storage、Terminal、Tombstone与Ruin；
- 多运输者预订；
- 跨房间物流；
- Container建设位置；
- 取能后的配送优先级；
- 道路与拥堵；
- 多资源运输。

JavaScript语法和离线目标决策已检查，真实 `withdraw()` 与多Creep结算仍待Screeps环境验证。

## 相关站内内容

- [如何捡取掉落Energy](/blog/screeps-creep-pickup-dropped-energy)
- [Room.storage怎么使用](/blog/screeps-storage-energy-usage)
- [如何向Spawn配送Energy](/blog/screeps-creep-deliver-energy)
- [Creep如何切换工作状态](/blog/screeps-creep-working-state)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [Creep.withdraw API](https://docs.screeps.com/api/#Creep.withdraw)
- [StructureContainer API](https://docs.screeps.com/api/#StructureContainer)
- [Store API](https://docs.screeps.com/api/#Store)
- [RoomPosition.findClosestByPath API](https://docs.screeps.com/api/#RoomPosition.findClosestByPath)

资料核对日期：2026-07-22。离线目标与amount计算已通过；真实资源结算仍待环境验证。
