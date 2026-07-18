---
title: "Creep 如何在取能和工作之间切换状态"
description: "只在 Energy 为空或容量已满时切换 working，避免每 tick 来回抖动，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps working 状态"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：只在 Energy 为空或容量已满时切换 working，避免每 tick 来回抖动。

## 先给判断

Memory 入门解释 working 是自定义字段；本文给出完整状态切换和动作分支。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需要知道的规则

- creep.memory.working 是玩家自定义字段。
- Store.getFreeCapacity 与 getUsedCapacity 可判断边界。
- 状态应在空与满两个边界切换，而不是每 tick 取反。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

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

这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。

## 按顺序排查

1. 空时切到取能、满时切到工作。
2. source 和 controller 都检查 undefined。
3. 保存 harvest 与 upgradeController 返回值。
4. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用动作。
5. 返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [Memory 基础用法](/blog/screeps-memory-basics)
- [从 Container 获取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [自动升级 Controller](/blog/screeps-upgrade-controller)

## 官方资料

- [Creep.store 与 Store API](https://docs.screeps.com/api/#Store)
- [Memory API](https://docs.screeps.com/api/#Memory)

