---
title: "Screeps 如何按房间能量动态生成 Creep 身体"
description: "根据 room.energyAvailable 生成不超过 50 个部件的 WORK/CARRY/MOVE 组合，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Spawn"
  - "Creep Body"
  - "Energy"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


固定身体在房间能量变化后可能无法生成，或者浪费已经可用的容量。下面按 `room.energyAvailable` 重复加入 `WORK`、`CARRY`、`MOVE`，同时守住 50 个部件的上限。

## 先给判断

身体部件入门解释作用；本文只解决动态组装、成本和部件上限。先用 `BODYPART_COST` 计算一组 body 的成本，再用房间当前可用能量决定组数。

## 需要知道的规则

- Room.energyAvailable 是当前 Spawn 与 Extension 可用能量总量。
- BODYPART_COST 可读取部件成本。
- Creep body 最多 50 个部件，顺序会影响受伤时能力损失。

## 可放进 main 的最小示例

示例读取 `Spawn1` 所在房间的当前可用 Energy；Spawn 名称需要按实际房间修改。

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

示例最多生成 16 组、共 48 个部件，既保留完整的 WORK/CARRY/MOVE 配比，也不会超过 50 个部件上限。

## 按顺序排查

1. 使用 BODYPART_COST 计算成本。
2. 最多 16 组共 48 个部件。
3. 零组时不调用 spawnCreep。
4. 保存 `spawnCreep` 返回值；它不会返回 `ERR_NOT_IN_RANGE`。
5. 失败时重点对照 `ERR_BUSY`、`ERR_NAME_EXISTS`、`ERR_NOT_ENOUGH_ENERGY` 和 `ERR_INVALID_ARGS`。

## 适用范围

本文只生成重复的 `WORK/CARRY/MOVE` 基础组合，不比较道路负载、角色需求或不同部件排列。

## 继续学习

- [身体部件基础](/blog/screeps-creep-body-parts)
- [第一个 Extension](/blog/screeps-first-extension)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)
