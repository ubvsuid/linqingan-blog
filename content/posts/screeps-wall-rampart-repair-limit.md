---
title: "Wall 和 Rampart 如何设置维修上限"
description: "给 Wall 与 Rampart 设置阶段性 hits 上限，只选择低于上限的最弱目标，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Wall Rampart 维修上限"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

本文处理的不是完整房间 AI，而是一个能明确验证的问题：给 Wall 与 Rampart 设置阶段性 hits 上限，只选择低于上限的最弱目标。

## 先确认边界

通用建造维修页按 hits < hitsMax 选损坏结构；本文只解决防御墙体不应无限维修的问题。第一步始终是确认目标属于正确房间、对象存在，并保存关键动作返回值。

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

示例只建立最小决策，不包含跨房间调度、战斗策略或性能数据。资料已核对，运行效果待 Screeps 环境验证。

## 相关站内内容

- [Creep 自动建造和维修](/blog/screeps-build-and-repair)
- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [Creep.repair API](https://docs.screeps.com/api/#Creep.repair)
- [StructureWall 与 StructureRampart API](https://docs.screeps.com/api/)

