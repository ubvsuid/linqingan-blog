
---
title: "Screeps Tower 如何自动治疗己方 Creep"
description: "找到 hits 低于 hitsMax 的己方 Creep，并调用 Tower.heal() 保存返回值，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "治疗"
  - "防御"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


己方 Creep 受伤后，Tower 不会自动治疗。代码需要筛选 `hits < hitsMax` 的己方目标，再由有 Energy 的 Tower 调用 `heal()`。

## 先确认边界

攻击目标来自 `FIND_HOSTILE_CREEPS`，治疗目标则来自 `FIND_MY_CREEPS`。本文只保存 `heal()` 的执行结果，不混入维修分支。

## 规则依据

- StructureTower.heal 的目标是 Creep 或 PowerCreep。
- FIND_MY_CREEPS 可限制目标为己方普通 Creep。
- Tower 没有 Energy 时治疗会失败。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const tower = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER
  })[0];
  if (!tower || tower.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return;
  }

  const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: creep => creep.hits < creep.hitsMax
  });
  if (!injured) {
    return;
  }

  const result = tower.heal(injured);
  if (result !== OK) {
    console.log('tower heal result:', result);
  }
};
```

## 按这个顺序检查

1. Tower、Energy 与受伤目标均检查。
2. 目标使用 FIND_MY_CREEPS。
3. 保存 Tower.heal 返回值。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

示例选择房间里找到的第一名受伤 Creep，不包含按伤势、距离或角色排序，也不处理 Power Creep。

## 相关站内内容

- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)

## 官方资料

- [StructureTower.heal API](https://docs.screeps.com/api/#StructureTower.heal)
- [StructureTower API](https://docs.screeps.com/api/#StructureTower)

