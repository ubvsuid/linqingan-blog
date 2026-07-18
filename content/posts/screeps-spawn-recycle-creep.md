---
title: "Screeps recycleCreep() 怎么回收不再需要的 Creep"
description: "让指定 Creep 靠近己方 Spawn，并保存 recycleCreep() 返回值，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Spawn"
  - "Creep 生命周期"
  - "Creep API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`recycleCreep()` 由 Spawn 对相邻的己方 Creep 调用。目标还没走到 Spawn 旁边时，先让 Creep 移动；到达后再保存并检查回收返回值。

## 先给判断

`renewCreep` 延长寿命，`spawnCreep` 创建单位；本文只处理主动回收。先确认 Spawn 与目标 Creep 都存在，再根据 `recycleCreep` 的返回值决定是否移动。

## 需要知道的规则

- recycleCreep 由 StructureSpawn 调用，目标是己方 Creep。
- 目标需在相邻位置。
- 回收与 suicide 的结果和适用目的不同。

## 可放进 main 的最小示例

示例使用 `Spawn1` 和 `OldWorker1`；两个名称都必须改成实际对象名称。

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

回收动作由 Spawn 调用，目标必须是己方 Creep 且位于相邻格；距离不足时才由 Creep 向 Spawn 移动。

## 按顺序排查

1. Spawn 与 Creep 均检查 undefined。
2. 保存 recycleCreep 返回值。
3. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用回收。
4. 返回 `ERR_NOT_OWNER` 时检查 Spawn 与 Creep 所有权；返回 `ERR_INVALID_TARGET` 时确认传入的是 Creep。

## 适用范围

本文只回收一只明确指定的己方 Creep，不负责自动判断角色是否过剩或选择回收时机。

## 继续学习

- [renewCreep 续命](/blog/screeps-spawn-renew-creep)
- [spawnCreep 入门](/blog/screeps-spawn-create-creep)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [StructureSpawn.recycleCreep API](https://docs.screeps.com/api/#StructureSpawn.recycleCreep)
- [Creep.suicide API](https://docs.screeps.com/api/#Creep.suicide)

