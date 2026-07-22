---
title: "Creep.pickup() 怎么安全捡取地上的 Energy"
description: "筛选FIND_DROPPED_RESOURCES中的Energy，根据可拾取数量和路径选择目标，处理Resource衰减、容量、目标消失、移动与pickup返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Creep API"
  - "Energy"
  - "资源采集"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Resource类型、amount、Creep容量、路径长度、可拾取量和目标排序，不是Screeps官方服务器）"
  testResult: "无候选、非Energy、容量已满、无效amount、路径不可达、可拾取量优先和同分ID稳定场景通过。"
featured: false
---

`creep.pickup(resource)` 只能拾取地面上的 `Resource` 对象。它不能从Container、Storage、Tombstone或Ruin取资源；这些目标需要 `withdraw()`。

本文只处理当前房间的掉落Energy，并把三个问题分开：

1. 哪些对象是有效候选；
2. 多堆Energy怎样选择；
3. `pickup()` 与 `moveTo()` 返回值怎样处理。

## 掉落资源会逐tick衰减

官方API说明，地面Resource每tick衰减：

```text
ceil(amount / 1000)
```

例如amount越大，每tick损失也越多。因此目标选择不能只看距离，也可以考虑可拾取数量与路径长度。

衰减发生在游戏结算中，当前tick读取的 `resource.amount` 不能保证下一tick仍然相同。

## Creep需要有效CARRY容量

```js
const free = creep.store.getFreeCapacity();
```

返回0时不应调用 `pickup()`。

`pickup()`要求Creep有可用CARRY部件。受伤后所有CARRY失效时，即使身体数组里仍有CARRY，也可能无法接收资源。

## 计算一堆资源当前最多能捡多少

```js
function getCollectibleAmount(input) {
  const {
    resourceAmount,
    freeCapacity
  } = input;

  if (
    !Number.isFinite(resourceAmount)
    || !Number.isFinite(freeCapacity)
    || resourceAmount <= 0
    || freeCapacity <= 0
  ) {
    return 0;
  }

  return Math.min(
    resourceAmount,
    freeCapacity
  );
}
```

Creep容量小于资源堆时，成功动作只会拾取它能装下的部分；剩余资源仍留在地面。

## 目标选择：可拾取量优先，再比较路径

```js
function selectDroppedEnergy(creep, resources) {
  const free = creep.store.getFreeCapacity();
  const candidates = [];

  if (!Number.isFinite(free) || free <= 0) {
    return null;
  }

  for (const resource of resources) {
    if (
      resource.resourceType !== RESOURCE_ENERGY
      || !Number.isFinite(resource.amount)
      || resource.amount <= 0
    ) {
      continue;
    }

    const path = creep.pos.findPathTo(resource, {
      range: 1,
      ignoreCreeps: true
    });

    if (
      path.length === 0
      && !creep.pos.inRangeTo(resource, 1)
    ) {
      continue;
    }

    candidates.push({
      resource,
      collectible: Math.min(resource.amount, free),
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (left.collectible !== right.collectible) {
      return right.collectible - left.collectible;
    }

    if (left.pathLength !== right.pathLength) {
      return left.pathLength - right.pathLength;
    }

    return left.resource.id.localeCompare(
      right.resource.id
    );
  })[0]?.resource ?? null;
}
```

这是一种“优先装满”的策略。角色处于紧急清场或危险区域时，也可以改成路径优先。

## 完整示例

```js
function selectDroppedEnergy(creep) {
  const free = creep.store.getFreeCapacity();

  if (!Number.isFinite(free) || free <= 0) {
    return null;
  }

  const resources = creep.room.find(
    FIND_DROPPED_RESOURCES,
    {
      filter: resource =>
        resource.resourceType === RESOURCE_ENERGY
        && resource.amount > 0
    }
  );
  const candidates = [];

  for (const resource of resources) {
    const path = creep.pos.findPathTo(resource, {
      range: 1,
      ignoreCreeps: true
    });

    if (
      path.length === 0
      && !creep.pos.inRangeTo(resource, 1)
    ) {
      continue;
    }

    candidates.push({
      resource,
      collectible: Math.min(resource.amount, free),
      pathLength: path.length
    });
  }

  return candidates.sort((left, right) => {
    if (left.collectible !== right.collectible) {
      return right.collectible - left.collectible;
    }

    if (left.pathLength !== right.pathLength) {
      return left.pathLength - right.pathLength;
    }

    return left.resource.id.localeCompare(
      right.resource.id
    );
  })[0]?.resource ?? null;
}

function runDroppedEnergyPickup(creep) {
  if (creep.spawning === true) {
    return {
      status: 'creep-spawning'
    };
  }

  if (creep.getActiveBodyparts(CARRY) <= 0) {
    return {
      status: 'no-active-carry-part'
    };
  }

  const free = creep.store.getFreeCapacity();

  if (!Number.isFinite(free) || free <= 0) {
    return {
      status: 'creep-full'
    };
  }

  const target = selectDroppedEnergy(creep);

  if (!target) {
    return {
      status: 'dropped-energy-not-found'
    };
  }

  const result = creep.pickup(target);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(target, {
      range: 1,
      reusePath: 5
    });

    return {
      status: 'moving-to-resource',
      resourceId: target.id,
      amountSeen: target.amount,
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'pickup-submitted'
      : 'pickup-failed',
    resourceId: target.id,
    amountSeen: target.amount,
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Collector1;

  if (!creep) {
    return;
  }

  const outcome = runDroppedEnergyPickup(creep);

  if (outcome.status === 'pickup-failed') {
    console.log({
      type: 'dropped-energy-pickup-failed',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

## 为什么目标每tick都可能失效

Resource可能在动作前后：

- 被其他Creep捡走；
- 因衰减减少或消失；
- 只剩下低于预期的amount；
- 当前路径被其他对象影响；
- 已经不在Creep的可见房间。

因此不能把当前 `resource.amount` 当成最终结算，也不能长期保存完整Resource对象。

需要跨tick保持目标时只保存ID，并在下一tick通过 `Game.getObjectById()` 恢复、判空和重新检查资源类型。

## `findClosestByPath()` 与自定义排序

最小版本可以写：

```js
const target = creep.pos.findClosestByPath(
  FIND_DROPPED_RESOURCES,
  {
    filter: resource =>
      resource.resourceType === RESOURCE_ENERGY
  }
);
```

它适合路径优先，但不考虑资源堆大小。

本文自定义排序优先可拾取量，再比较路径。不要同时声称两种策略都必然最优，应根据运输任务目标选择。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 拾取命令已安排 | 下一tick读取Store和Resource |
| `ERR_NOT_OWNER` | Creep不属于自己 | 检查对象来源 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_INVALID_TARGET` | 目标不是当前有效Resource | 重新查找 |
| `ERR_FULL` | Creep没有剩余容量 | 切换到配送动作 |
| `ERR_NOT_IN_RANGE` | 距离超过1格 | 移动接近 |

`pickup()`没有amount参数，资源类型和数量来自目标Resource本身。

## 常见错误

### 使用 `withdraw()` 处理地面资源

Resource不是Structure、Tombstone或Ruin，应使用 `pickup()`。

### 不筛选资源类型

`FIND_DROPPED_RESOURCES`可能包含矿物或其他资源。

### 忽略衰减

远距离小资源堆可能在Creep到达前大幅减少。

### 保存完整Resource对象到Memory

下一tick需要通过ID重新恢复。

### 只记录 `pickup()`，不记录移动结果

距离不足后仍可能遇到无路径、fatigue或MOVE部件失效。

### 多只Creep都选择最大资源堆

需要目标预订或集中分配，否则多个Creep会同时前往同一目标。

## 离线模拟结果

构建检查覆盖：

1. Creep容量已满；
2. 非Energy资源；
3. amount为0或非法；
4. 路径不可达；
5. 可拾取量计算；
6. 可拾取量更高者优先；
7. 同量路径更短者优先；
8. 完全同分时ID稳定排序。

离线测试不能模拟Resource衰减、同tick竞争、真实路径和 `pickup()` 结算。

## 适用边界

本文不覆盖：

- Tombstone和Ruin；
- Container或Storage；
- 多资源回收；
- 多Creep目标预订；
- 跨房间拾取；
- 危险区域撤离；
- 取能后的配送逻辑。

JavaScript语法和离线目标选择已检查，真实拾取与衰减仍待Screeps环境验证。

## 相关站内内容

- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [如何向Spawn配送Energy](/blog/screeps-creep-deliver-energy)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [多个Source怎么选目标](/blog/screeps-select-source-by-path)
- [Creep如何切换工作状态](/blog/screeps-creep-working-state)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [Creep.pickup API](https://docs.screeps.com/api/#Creep.pickup)
- [Resource API](https://docs.screeps.com/api/#Resource)
- [FIND_DROPPED_RESOURCES](https://docs.screeps.com/api/#Constants-Find-Constants)
- [Store API](https://docs.screeps.com/api/#Store)

资料核对日期：2026-07-22。离线资源目标选择已通过；真实衰减与拾取仍待Screeps环境验证。
