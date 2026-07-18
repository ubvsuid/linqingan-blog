---
title: "Screeps renewCreep() 怎么用：让 Creep 靠近 Spawn 续命"
description: "用最小 JavaScript 示例检查 ticksToLive，让普通 Creep 靠近 Spawn 调用 renewCreep()，并排查 ERR_BUSY、ERR_FULL 等返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "renewCreep"
  - "ticksToLive"
draft: false
featured: false
---

一只 Creep 的 `ticksToLive` 不断下降时，`StructureSpawn.renewCreep()` 可以增加普通 Creep 的剩余寿命。调用前先确认 Spawn 和 Creep 都存在，再保存返回值。距离、Spawn 忙碌、Energy、`CLAIM` 身体部件和当前 TTL 都可能让续命失败。

本文只处理固定名称普通 Creep 的最小续命流程。它不证明续命一定比提前生产替代 Creep 更划算，也不设计生产队列。

## renewCreep() 与 spawnCreep() 的区别

`spawnCreep()` 创建一只新 Creep，`renewCreep()` 操作已经存在的 Creep。还没有完成第一次创建流程时，先阅读[如何使用 spawnCreep() 创建 Creep](/blog/screeps-spawn-create-creep)。

当前官方 API 规定，每次成功续命增加 `floor(600 / body_size)` ticks；每次所需 Energy 为 `ceil(creep_cost / 2.5 / body_size)`。身体越大，单次增加的 TTL 越少。实际结算由游戏 API 完成，不需要在主循环重新实现公式。

如果不熟悉身体数组，可以先看[WORK、CARRY 和 MOVE 的基础作用](/blog/screeps-creep-body-parts)。

## 先读取 ticksToLive

下面代码只读取状态，不会调用续命：

```javascript
const creep = Game.creeps['Worker1'];

if (!creep) {
  console.log('没有找到 Worker1');
} else if (creep.spawning) {
  console.log('Worker1 仍在生成中');
} else {
  console.log('Worker1 剩余 TTL：' + creep.ticksToLive);
}
```

`ticksToLive` 的单位是游戏 tick，不是现实时间。主循环为何持续执行，可以回看[Screeps 中的 tick 与游戏循环](/blog/screeps-tick-and-game-loop)。

## 调用前先排除 CLAIM 与 boosts

官方 API 明确列出两个限制：

- 带 `CLAIM` 身体部件的 Creep 不能使用 `renewCreep()`；
- 续命会移除目标 Creep 的全部 boosts。

下面示例面向没有 `CLAIM`、没有需要保留 boosts 的普通 Worker。不要把它直接套用到 Claimer 或强化单位。

## 最小调用：先续命，再处理距离

```javascript
const spawn = Game.spawns['Spawn1'];
const creep = Game.creeps['Worker1'];

if (spawn && creep && !creep.spawning) {
  const renewResult = spawn.renewCreep(creep);

  if (renewResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(spawn);

    if (moveResult !== OK) {
      console.log('Worker1 moveTo 返回值：' + moveResult);
    }
  } else if (renewResult !== OK) {
    console.log('renewCreep 返回值：' + renewResult);
  }
}
```

目标 Creep 必须站在 Spawn 相邻格。分别保存 `renewCreep()` 与 `moveTo()` 的返回值，才能区分续命失败和移动失败。

## 带 TTL 阈值的完整示例

下面示例只在 `Worker1` 的 TTL 不高于 300 时进入续命流程。`300` 是便于说明的配置，不是官方推荐值，应根据路程、替代生产与 Spawn 任务自行调整。

```javascript
module.exports.loop = function () {
  const spawn = Game.spawns['Spawn1'];
  const creep = Game.creeps['Worker1'];
  const renewThreshold = 300;

  if (!spawn) {
    console.log('没有找到 Spawn1');
    return;
  }

  if (!creep) {
    console.log('没有找到 Worker1');
    return;
  }

  if (creep.spawning || creep.ticksToLive > renewThreshold) {
    return;
  }

  if (spawn.spawning) {
    if (!creep.pos.isNearTo(spawn)) {
      const moveResult = creep.moveTo(spawn);

      if (moveResult !== OK) {
        console.log('Worker1 等待续命时 moveTo 返回值：' + moveResult);
      }
    }
    return;
  }

  const renewResult = spawn.renewCreep(creep);

  if (renewResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(spawn);

    if (moveResult !== OK) {
      console.log('Worker1 moveTo 返回值：' + moveResult);
    }
    return;
  }

  if (renewResult !== OK) {
    console.log('Worker1 renewCreep 返回值：' + renewResult);
  }
};
```

Spawn 忙碌时，示例不会调用续命，但会让尚未相邻的 Creep 继续靠近。Spawn 空闲后，只要 TTL 仍不高于阈值，代码可能在多个 tick 连续请求续命。

## 失败时按返回值检查

### ERR_BUSY

Spawn 正在生产另一只 Creep。续命与生产会争用 Spawn，不能把两者当成同时完成的动作。

### ERR_NOT_ENOUGH_ENERGY

当前 Spawn 的 Store 没有本次续命需要的 Energy。可读取：

```javascript
const spawn = Game.spawns['Spawn1'];

if (spawn) {
  const energy = spawn.store.getUsedCapacity(RESOURCE_ENERGY);
  console.log('Spawn1 当前 Energy：' + energy);
}
```

不要把房间其他建筑里的 Energy 直接当成这次续命已经可用。

### ERR_INVALID_TARGET

目标不是有效 Creep，或者带有 `CLAIM` 身体部件。检查固定名称取得的对象与身体数组。

### ERR_FULL

目标 Creep 的 TTL 已经足够高，当前调用无法再增加。阈值设置过高时，可能过早进入续命流程。

### ERR_NOT_IN_RANGE

Creep 没有站在 Spawn 相邻格。检查 `moveTo()` 返回值、路径，以及 Spawn 周围是否有可达位置。

### ERR_RCL_NOT_ENOUGH

当前 Controller 等级不足以使用这个 Spawn。确认 Spawn 是否处于可用状态。

### ERR_NOT_OWNER

Spawn 或目标 Creep 不属于自己。也要确认名称与大小写没有写错。

这些常量可以在站内的[Screeps 错误码查询页](/screeps-errors)继续查询。

## 适用范围

示例没有解决：

- 续命与提前生产替代 Creep 的选择；
- 多只 Creep 的续命排队；
- Spawn 周围交通拥堵；
- Boost 回收与重新强化；
- 多 Spawn 的任务分配。

先验证一个普通固定名称 Creep 的 TTL、距离和返回值，再决定是否把续命加入长期房间系统。

## 官方参考资料

- [Screeps API Reference：StructureSpawn.renewCreep](https://docs.screeps.com/api/#StructureSpawn.renewCreep)
- [Screeps API Reference：RoomPosition.isNearTo](https://docs.screeps.com/api/#RoomPosition.isNearTo)
- [Screeps Documentation：Creeps](https://docs.screeps.com/creeps.html)

资料核对日期：2026-07-18。代码仍需在 Screeps 环境验证。

