---
title: "Screeps Tower 如何按耐久阈值维修建筑"
description: "在没有敌人时，让 Tower 只维修低于阈值的非墙体建筑，并保留最低 Energy，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Tower 维修"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

本文处理的不是完整房间 AI，而是一个能明确验证的问题：在没有敌人时，让 Tower 只维修低于阈值的非墙体建筑，并保留最低 Energy。

## 先确认边界

Tower 攻击文章明确不写维修；通用建造维修文章由 Creep 执行，不处理 Tower 能量保底。第一步始终是确认目标属于正确房间、对象存在，并保存关键动作返回值。

## 规则依据

- StructureTower.repair 消耗 Tower 中的 Energy。
- Tower 可以维修结构并返回动作结果。
- 墙和 Rampart 的高 hitsMax 容易长期占用维修，应单独设策略。

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
  if (!tower || tower.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
    return;
  }

  const target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      structure.hits < structure.hitsMax
      && structure.structureType !== STRUCTURE_WALL
      && structure.structureType !== STRUCTURE_RAMPART
  });
  if (!target) {
    return;
  }

  const result = tower.repair(target);
  if (result !== OK) {
    console.log('tower repair result:', result);
  }
};
```

## 按这个顺序检查

1. 只查找己方 Tower。
2. Energy 保底值标记为自定义。
3. 墙和 Rampart 从普通维修目标排除。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

示例只建立最小决策，不包含跨房间调度、战斗策略或性能数据。资料已核对，运行效果待 Screeps 环境验证。

## 相关站内内容

- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Creep 自动建造和维修](/blog/screeps-build-and-repair)
- [Creep 运输 Energy](/blog/screeps-creep-deliver-energy)

## 官方资料

- [StructureTower.repair API](https://docs.screeps.com/api/#StructureTower.repair)
- [Defense](https://docs.screeps.com/defense.html)

