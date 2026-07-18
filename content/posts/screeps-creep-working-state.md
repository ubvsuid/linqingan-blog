---
title: "Creep 如何在取能和工作之间切换状态"
description: "只在 Energy 为空或容量已满时切换 working，避免每 tick 来回抖动，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Creep"
  - "状态管理"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`working` 状态应该只在两个边界切换：Energy 用完时回到取能状态，容量装满时进入工作状态。若每 tick 都按当前数量直接取反，Creep 会在两个任务之间反复抖动。

## 先给判断

Memory 入门解释 working 是自定义字段；本文给出完整状态切换和动作分支。先检查 Energy 是否为空或已满，再分别确认 Source、Controller 和动作返回值。

## 需要知道的规则

- creep.memory.working 是玩家自定义字段。
- Store.getFreeCapacity 与 getUsedCapacity 可判断边界。
- 状态应在空与满两个边界切换，而不是每 tick 取反。

## 可放进 main 的最小示例

示例使用 `Harvester1`、当前房间第一个 Source 和房间 Controller；这些目标应按实际角色逻辑替换。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  if (!creep) {
    return;
  }

  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = false;
  } else if (creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
  }

  if (!creep.memory.working) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (!source) {
      return;
    }
    const result = creep.harvest(source);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
    return;
  }

  const controller = creep.room.controller;
  if (!controller || !controller.my) {
    return;
  }
  const result = creep.upgradeController(controller);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
};
```

状态只在“空”和“满”两个边界切换；Energy 处于中间值时保持原状态。采集与升级分别处理距离，避免同一 tick 同时安排两类动作。

## 按顺序排查

1. 空时切到取能、满时切到工作。
2. source 和 controller 都检查 undefined。
3. 保存 harvest 与 upgradeController 返回值。
4. `harvest` 或 `upgradeController` 返回 `ERR_NOT_IN_RANGE` 时只安排移动。
5. 其他返回值分别对照对应 API，重点检查 Source 状态、Creep 的 WORK 部件、Energy 和 Controller 所有权。

## 适用范围

本文只解释 `working` 的边界切换，不负责选择最优 Source、分配多个 Upgrader 或持久化任务队列。

## 继续学习

- [Memory 基础用法](/blog/screeps-memory-basics)
- [从 Container 获取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [自动升级 Controller](/blog/screeps-upgrade-controller)

## 官方资料

- [Creep.store 与 Store API](https://docs.screeps.com/api/#Store)
- [Memory API](https://docs.screeps.com/api/#Memory)
