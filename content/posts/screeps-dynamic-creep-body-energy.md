---
title: "Screeps 如何按房间能量动态生成 Creep 身体"
description: "根据 room.energyAvailable 计算 WORK、CARRY、MOVE 组合，让 Spawn 生成不超过 50 个部件的 Worker。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
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
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（简化常量与纯函数，不是 Screeps 官方服务器）"
  testResult: "0、199、200、550、3200 和 10000 Energy 场景通过；最大 16 组、48 个部件。"
featured: false
---

固定身体在房间能量变化后可能无法生成，或者浪费已经可用的容量。下面按 `room.energyAvailable` 重复加入 `WORK`、`CARRY`、`MOVE`，同时守住 50 个部件的上限。

## 先算一组身体的成本

身体部件入门解释作用；本文只解决动态组装、成本和部件上限。先用 `BODYPART_COST` 计算一组 body 的成本，再用房间当前可用能量决定组数。

## 需要知道的规则

- `Room.energyAvailable` 是当前 Spawn 与 Extension 可用能量总量。
- `BODYPART_COST` 可读取部件成本。
- Creep body 最多 50 个部件，顺序会影响受伤时能力损失。
- 下面每组包含 3 个部件，因此最多使用 16 组，也就是 48 个部件。

## 按当前 Energy 组装身体

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

示例最多生成 16 组、共 48 个部件，既保留完整的 `WORK/CARRY/MOVE` 配比，也不会超过 50 个部件上限。

## Spawn 拒绝这个身体时

1. 使用 `BODYPART_COST` 计算成本。
2. 最多 16 组共 48 个部件。
3. 零组时不调用 `spawnCreep()`。
4. 保存 `spawnCreep()` 返回值；它不会返回 `ERR_NOT_IN_RANGE`。
5. 失败时重点对照 `ERR_BUSY`、`ERR_NAME_EXISTS`、`ERR_NOT_ENOUGH_ENERGY` 和 `ERR_INVALID_ARGS`。

## 离线模拟结果

构建检查使用与文章相同的组装规则，覆盖以下输入：

| 可用 Energy | 生成结果 | 计算成本 |
|---:|---:|---:|
| 0 | 0 个部件 | 0 |
| 199 | 0 个部件 | 0 |
| 200 | 3 个部件 | 200 |
| 550 | 6 个部件 | 400 |
| 3200 | 48 个部件 | 3200 |
| 10000 | 48 个部件 | 3200 |

测试确认低于一组成本时返回空数组，能量足够时只生成完整组合，并在高能量输入下停在 48 个部件。

这属于 **Node.js 离线纯函数模拟**，只验证组数、成本和上限分支；没有证明 `Spawn1` 存在，也没有证明 `spawnCreep()` 已在官方服务器返回 `OK`。Console 与真实主循环仍然待环境验证。

需要快速比较其他身体方案时，可以使用站内的 [Creep 身体计算器](https://www.linqingan.com/tools/creep-body-calculator)。

## 适用范围

本文只生成重复的 `WORK/CARRY/MOVE` 基础组合，不比较道路负载、角色需求、Boost 或不同部件排列。

## 继续学习

- [Creep 身体计算器](https://www.linqingan.com/tools/creep-body-calculator)
- [身体部件基础](/blog/screeps-creep-body-parts)
- [MOVE 与 fatigue 配比](/blog/screeps-move-fatigue-body-ratio)
- [第一个 Extension](/blog/screeps-first-extension)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)

资料核对日期：2026-07-22。离线模拟已通过；真实 Screeps Console 与主循环仍待环境验证。
