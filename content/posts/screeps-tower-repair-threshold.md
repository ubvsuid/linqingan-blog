
---
title: "Screeps Tower 如何按耐久阈值维修建筑"
description: "在没有敌人时，让 Tower 只维修低于阈值的非墙体建筑，并保留最低 Energy，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "维修"
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


Tower 若无条件维修，可能在敌人出现前耗尽 Energy。下面只在房间没有敌对 Creep、Tower Energy 高于保底值时维修低于阈值的非墙体建筑。

## 先确认边界

维修前依次检查敌对目标、Tower Energy 保底和结构耐久；任何条件不满足都不调用 `repair()`。

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

示例排除 Wall 和 Rampart，并使用自定的耐久与 Energy 阈值；这些数值需要按房间防御需求调整。

## 相关站内内容

- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Creep 自动建造和维修](/blog/screeps-build-and-repair)
- [Creep 运输 Energy](/blog/screeps-creep-deliver-energy)

## 官方资料

- [StructureTower.repair API](https://docs.screeps.com/api/#StructureTower.repair)
- [Defense](https://docs.screeps.com/defense.html)

