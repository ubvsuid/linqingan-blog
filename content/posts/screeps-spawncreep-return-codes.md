---
title: "spawnCreep() 失败怎么查：按返回值定位问题"
description: "保存 spawnCreep() 返回值，并根据名称、能量、身体和 Spawn 状态定位失败原因，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "Screeps spawnCreep 返回值"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：保存 spawnCreep() 返回值，并根据名称、能量、身体和 Spawn 状态定位失败原因。

## 先给判断

现有 spawnCreep 入门负责第一次创建；本文不重复参数教学，只给诊断顺序。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需要知道的规则

- spawnCreep 返回 OK 或错误常量。
- dryRun 可以检查创建条件而不实际开始生成。
- 名称重复、能量不足、body 非法和 Spawn 忙碌需要分别处理。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

```js
module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const name = 'Worker1';
  const body = [WORK, CARRY, MOVE];

  if (!spawn || spawn.spawning || Game.creeps[name]) {
    return;
  }

  const check = spawn.spawnCreep(body, name, { dryRun: true });
  console.log('spawn dryRun:', check);

  if (check === OK) {
    const result = spawn.spawnCreep(body, name, {
      memory: { role: 'worker' }
    });
    console.log('spawn result:', result);
  }
};
```

这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。

## 按顺序排查

1. 先检查 Spawn、spawning 和重名。
2. 先用 dryRun 保存返回值。
3. 实际创建也保存返回值。
4. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用动作。
5. 返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [错误码索引](https://www.linqingan.com/screeps-errors)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)

