---
title: "Screeps Tower 如何按耐久阈值维修建筑"
description: "让 Tower 在没有敌人且 Energy 高于保底值时，维修低于耐久阈值的非墙体建筑。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "维修"
  - "防御"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（简化 Tower、敌人和 Structure 对象）"
  testResult: "敌人存在、Energy 不足和只有墙体时不维修；空闲时选择最近受损普通建筑。"
featured: false
---

Tower 若无条件维修，可能在敌人出现前耗尽 Energy。下面只在房间没有敌对 Creep、Tower Energy 高于保底值时维修受损的非墙体建筑。

## 为什么要保留 Tower Energy

维修前依次检查敌对目标、Tower Energy 保底和结构耐久；任何条件不满足都不调用 `repair()`。

防御优先级属于策略，不是 API 自动完成的行为。代码必须显式检查敌人，不能只在文字中写“没有敌人时维修”。

## 规则依据

- `StructureTower.repair()` 消耗 Tower 中的 Energy。
- Tower 可以维修结构并返回动作结果。
- Wall 和 Rampart 的高 `hitsMax` 容易长期占用维修，应单独设策略。
- 是否先攻击、治疗还是维修，需要由自己的主循环决定。

## 只在空闲时维修的 main 示例

运行前请替换房间名和策略阈值。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const hostile = room.find(FIND_HOSTILE_CREEPS)[0];
  if (hostile) {
    return;
  }

  const tower = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER
  })[0];
  if (!tower || tower.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
    return;
  }

  const target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      structure.hits < structure.hitsMax
      && structure.structureType !== STRUCTURE_WALL
      && structure.structureType !== STRUCTURE_RAMPART
  });
  if (!target) {
    return;
  }

  const result = tower.repair(target);
  if (result !== OK) {
    console.log('tower repair result:', result);
  }
};
```

这份代码只负责空闲维修。房间存在敌人时直接返回，攻击逻辑应由[ Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)或统一 Tower 调度函数处理。

## 为什么要先检查敌人

原始的维修筛选本身不会知道房间是否需要防御。若省略 `FIND_HOSTILE_CREEPS` 检查，Tower 可能在敌人已经进入房间时继续维修。

更完整的系统通常会按以下顺序处理：

1. 攻击敌对 Creep；
2. 治疗己方受伤 Creep；
3. 在 Energy 充足时维修普通建筑；
4. Wall 与 Rampart 使用独立阈值。

本文只展开第 3 步，不把所有 Tower 行为塞进一个示例。

## 离线模拟结果

构建检查用简化对象覆盖四种情况：

| 场景 | 结果 |
|---|---|
| 房间存在敌人 | 不选择维修目标 |
| Tower Energy 为 499 | 不选择维修目标 |
| 只有受损 Wall | 不选择维修目标 |
| Road、Extension 和 Wall 同时受损 | 排除 Wall，选择距离更近的 Extension |

模拟确认敌人优先检查、Energy 保底、墙体排除和最近目标选择分支能够按预期工作。

这属于 **Node.js 离线策略模拟**。真实 `Room.find()`、`findClosestByRange()`、Tower Energy 变化、距离衰减和 `repair()` 返回值仍需要在 Screeps Console 与主循环中验证。

## Tower 没有维修时检查

1. 房间是否可见。
2. 是否已经发现敌对 Creep并提前返回。
3. 是否只查找己方 Tower。
4. Energy 是否达到自定义保底值。
5. 是否存在受损且未被排除的普通建筑。
6. `tower.repair(target)` 是否返回 `OK`。

## 限制

示例排除 Wall 和 Rampart，并使用自定的 500 Energy 保底值；这些数值需要按房间防御需求调整。示例也没有处理多个 Tower 的分工，多个 Tower 可能同时选择同一目标。

## 相关站内内容

- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Tower 自动治疗己方 Creep](/blog/screeps-tower-heal-creeps)
- [Wall 和 Rampart 维修上限](/blog/screeps-wall-rampart-repair-limit)
- [Creep 自动建造和维修](/blog/screeps-build-and-repair)

## 官方资料

- [StructureTower.repair API](https://docs.screeps.com/api/#StructureTower.repair)
- [Defense](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-22。代码语法与离线策略模拟已通过；真实 Tower 行为、Energy 消耗和返回值仍待环境验证。
