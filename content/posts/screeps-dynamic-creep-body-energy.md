---
title: "Screeps 如何按房间能量动态生成 Creep 身体"
description: "根据 room.energyAvailable 生成不超过 50 个部件的 WORK/CARRY/MOVE 组合，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps 动态 Creep body"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：根据 room.energyAvailable 生成不超过 50 个部件的 WORK/CARRY/MOVE 组合。

## 先给判断

身体部件入门解释作用；本文只解决动态组装、成本和部件上限。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需要知道的规则

- Room.energyAvailable 是当前 Spawn 与 Extension 可用能量总量。
- BODYPART_COST 可读取部件成本。
- Creep body 最多 50 个部件，顺序会影响受伤时能力损失。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

```js
function buildWorkerBody(energy) {
  const unitCost = BODYPART_COST[WORK]
    + BODYPART_COST[CARRY]
    + BODYPART_COST[MOVE];
  const units = Math.min(16, Math.floor(energy / unitCost));
  const body = [];

  for (let index = 0; index < units; index += 1) {
    body.push(WORK, CARRY, MOVE);
  }

  return body;
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  if (!spawn || spawn.spawning) {
    return;
  }

  const body = buildWorkerBody(spawn.room.energyAvailable);
  if (body.length === 0) {
    return;
  }

  const name = `Worker-${Game.time}`;
  const result = spawn.spawnCreep(body, name, {
    memory: { role: 'worker' }
  });
  console.log('spawn result:', result);
};
```

这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。

## 按顺序排查

1. 使用 BODYPART_COST 计算成本。
2. 最多 16 组共 48 个部件。
3. 零组时不调用 spawnCreep。
4. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用动作。
5. 返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [身体部件基础](/blog/screeps-creep-body-parts)
- [第一个 Extension](/blog/screeps-first-extension)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)

