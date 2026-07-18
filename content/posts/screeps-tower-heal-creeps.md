---
title: "Screeps Tower 如何自动治疗己方 Creep"
description: "让有 Energy 的 Tower 自动选择受伤的己方 Creep，并说明距离如何影响实际治疗量。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "治疗"
  - "防御"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


己方 Creep 受伤后，Tower 不会自动治疗。下面从 `FIND_MY_CREEPS` 中筛出 `hits < hitsMax` 的目标，选择离 Tower 最近的一名，再由有 Energy 的 Tower 调用 `heal()`。

## 距离影响治疗量，不影响能否调用

Tower 可以治疗同一房间内的 Creep 或 Power Creep。治疗范围覆盖整个房间，距离只会线性影响实际治疗量：官方数据是距离不超过 5 格时 400 hits，距离达到 20 格及以上时 100 hits，中间距离线性衰减。因此，远处目标不会因为距离返回 `ERR_NOT_IN_RANGE`。

本文的候选集使用 `FIND_MY_CREEPS`，只包含己方普通 Creep；目标策略是“距离 Tower 最近的受伤目标”，不混入攻击和维修分支。

## Tower 能执行治疗的条件

- Tower 属于自己，并且当前 Controller 等级允许该结构工作。
- Tower 至少有一次动作所需的 Energy。
- 目标是仍然存在的有效 Creep，并且 `hits < hitsMax`。
- Power Creep 虽然也是 `heal()` 的有效目标，但不在 `FIND_MY_CREEPS` 的结果里。

## 选择最近受伤目标的 main 示例

运行前请替换房间名。示例只取第一座己方 Tower，并选择离它最近的受伤 Creep。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const tower = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER
  })[0];
  if (!tower || tower.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return;
  }

  const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: creep => creep.hits < creep.hitsMax
  });
  if (!injured) {
    return;
  }

  const result = tower.heal(injured);
  if (result !== OK) {
    console.log('tower heal result:', result);
  }
};
```

## `heal()` 返回值怎么解释

| 返回值 | 需要检查的条件 |
| --- | --- |
| `OK` | 治疗动作已经安排在当前 tick 执行。 |
| `ERR_NOT_OWNER` | Tower 不是自己的结构。 |
| `ERR_NOT_ENOUGH_ENERGY` | Tower 的 Energy 不足以执行一次治疗。 |
| `ERR_INVALID_TARGET` | 目标不是有效的 Creep 或已经失效。 |
| `ERR_RCL_NOT_ENOUGH` | 房间 Controller 等级不足，Tower 当前不可用。 |

距离不在这张错误表里。看到治疗量偏低时，应比较 Tower 与目标的距离；看到非 `OK` 返回值时，则按所有权、Energy、目标类型和 RCL 排查。

## 目标策略的限制

示例使用“最近受伤目标”策略，不比较角色优先级、缺失 hits 数量或战斗价值，也不处理 Power Creep。防守代码若需要先救治疗者或关键运输单位，应另行定义明确的优先级，而不是把它混进这个距离示例。

## 相关站内内容

- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)

## 官方资料

- [StructureTower.heal API](https://docs.screeps.com/api/#StructureTower.heal)
- [StructureTower API](https://docs.screeps.com/api/#StructureTower)
