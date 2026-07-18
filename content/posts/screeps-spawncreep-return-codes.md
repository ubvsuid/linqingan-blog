---
title: "spawnCreep() 失败怎么查：按返回值定位问题"
description: "保存 spawnCreep() 返回值，并根据名称、Energy、身体数组和 Spawn 状态定位生成失败原因。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "Spawn"
  - "错误码"
  - "Creep Body"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`spawnCreep()` 返回错误时，不要只观察 Spawn 动画。先保存返回值，再按 Creep 名称、房间可用能量、身体数组和 Spawn 是否忙碌逐项定位。

## 先给判断

现有 spawnCreep 入门负责第一次创建；本文不重复参数教学，只按 Spawn 状态、名称、能量、body 与返回值给出诊断顺序。

## 需要知道的规则

- spawnCreep 返回 OK 或错误常量。
- dryRun 可以检查创建条件而不实际开始生成。
- 名称重复、能量不足、body 非法和 Spawn 忙碌需要分别处理。

## 可放进 main 的最小示例

示例使用 `Spawn1` 并尝试创建固定名称；请按实际 Spawn 名称和命名规则修改。

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

`dryRun` 只检查能否生成，不会开始生产。检查通过后仍应保存实际 `spawnCreep` 的返回值，因为同一 tick 的其他逻辑可能已经改变了 Spawn 状态。

## 按顺序排查

1. 先检查 Spawn、spawning 和重名。
2. 先用 dryRun 保存返回值。
3. 实际创建也保存返回值。
4. `ERR_NAME_EXISTS` 检查名称；`ERR_BUSY` 检查 `spawn.spawning`。
5. `ERR_NOT_ENOUGH_ENERGY` 检查房间可用能量；`ERR_INVALID_ARGS` 检查 body、名称和 options。`spawnCreep` 不会返回 `ERR_NOT_IN_RANGE`。

## 适用范围

本文只按一次 `spawnCreep()` 的返回值定位失败原因，不实现角色配额、动态身体或补员优先级。

## 继续学习

- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [错误码索引](https://www.linqingan.com/screeps-errors)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)
