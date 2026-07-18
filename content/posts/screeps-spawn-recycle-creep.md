---
title: "Screeps recycleCreep() 怎么回收不再需要的 Creep"
description: "让指定 Creep 靠近己方 Spawn，并保存 recycleCreep() 返回值，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Screeps recycleCreep"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：让指定 Creep 靠近己方 Spawn，并保存 recycleCreep() 返回值。

## 先给判断

renewCreep 延长寿命，spawnCreep 创建单位；本文只处理主动回收。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需要知道的规则

- recycleCreep 由 StructureSpawn 调用，目标是己方 Creep。
- 目标需在相邻位置。
- 回收与 suicide 的结果和适用目的不同。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

```js
module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const creep = Game.creeps.OldWorker;
  if (!spawn || !creep) {
    return;
  }

  const result = spawn.recycleCreep(creep);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
  } else if (result !== OK) {
    console.log('recycle result:', result);
  }
};
```

这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。

## 按顺序排查

1. Spawn 与 Creep 均检查 undefined。
2. 保存 recycleCreep 返回值。
3. 只在 ERR_NOT_IN_RANGE 时移动。
4. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用动作。
5. 返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [renewCreep 续命](/blog/screeps-spawn-renew-creep)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [StructureSpawn.recycleCreep API](https://docs.screeps.com/api/#StructureSpawn.recycleCreep)
- [Creep.suicide API](https://docs.screeps.com/api/#Creep.suicide)

