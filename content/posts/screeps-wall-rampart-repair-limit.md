
---
title: "Wall 和 Rampart 如何设置维修上限"
description: "给 Wall 与 Rampart 设置阶段性 hits 上限，只选择低于上限的最弱目标，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Wall"
  - "Rampart"
  - "维修"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Wall 和 Rampart 的 `hitsMax` 很高，按 `hits < hitsMax` 维修会长期占用资源。更可控的做法是设置阶段性上限，并优先修复低于上限的最弱目标。

## 先确认边界

代码只搜索 Wall 与 Rampart，并把玩家设定的 `repairLimit` 用作当前阶段目标，不把 `hitsMax` 当成必须达到的数值。

## 规则依据

- Wall 与 Rampart 的 hitsMax 很高。
- repair 目标可以使用自定义 hitsLimit 过滤。
- 维修上限是玩家策略，不能写成官方固定安全值。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Repairer1;
  if (!creep || creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return;
  }

  const hitsLimit = 100000;
  const targets = creep.room.find(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_WALL
        || structure.structureType === STRUCTURE_RAMPART)
      && structure.hits < hitsLimit
  });
  targets.sort((a, b) => a.hits - b.hits);

  const target = targets[0];
  if (!target) {
    return;
  }

  const result = creep.repair(target);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  } else if (result !== OK) {
    console.log('repair result:', result);
  }
};
```

## 按这个顺序检查

1. hitsLimit 明确为自定义值。
2. 只选择 Wall 和 Rampart。
3. 先修当前 hits 最低的目标。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

`repairLimit` 是策略参数。示例不判断敌情、Tower Energy 保底或不同位置的防御权重。

## 相关站内内容

- [Creep 自动建造和维修](/blog/screeps-build-and-repair)
- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [Creep.repair API](https://docs.screeps.com/api/#Creep.repair)
- [StructureWall 与 StructureRampart API](https://docs.screeps.com/api/)

