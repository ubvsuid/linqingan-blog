---
title: "StructureNuker.launchNuke() 前要检查什么"
description: "在一次性请求下核对目标距离、Nuker cooldown、Energy 和 Ghodium，再决定是否调用 launchNuke()。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Nuker"
  - "防御"
  - "高风险 API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`launchNuke()` 会产生不可逆的游戏动作。代码必须由一次性请求触发，并在执行前核对目标坐标、距离、`cooldown`、Energy 与 Ghodium。

## 先核对这些前提

本文只做 API 前置检查，不提供攻击策略、伤害承诺或虚构战报。

- launchNuke 的目标是 RoomPosition。
- Nuker 有距离、资源和 cooldown 限制。
- 调用是高影响一次性动作，示例必须加显式请求开关并保存返回值。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  if (!Memory.nuker || Memory.nuker.launchRequested !== true) {
    return;
  }

  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const nuker = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_NUKER
  })[0];
  const target = new RoomPosition(25, 25, 'W2N2');

  if (!nuker || nuker.cooldown > 0) {
    return;
  }

  const distance = Game.map.getRoomLinearDistance(
    room.name,
    target.roomName
  );
  if (distance > 10) {
    return;
  }

  if (
    nuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    || nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0
  ) {
    return;
  }

  Memory.nuker.launchRequested = false;
  const result = nuker.launchNuke(target);
  console.log('launchNuke result:', result);

  if (result === OK) {
    console.log('一次性发射请求已接受');
  }
};
```

## 排查顺序

1. 必须有显式 launchRequested。
2. 目标 RoomPosition 和线性距离检查。
3. 调用前清除一次性请求，避免非 `OK` 结果在下一 tick 自动重试。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

`launchNuke()` 是不可随意重复的高风险动作。示例只提供显式一次性入口和前置检查，不替玩家决定目标。失败后必须人工检查返回值、目标和资源，再明确重新开启请求；代码不会自动重试。

## 站内学习路径

- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [认识 Room](/blog/screeps-first-room)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [StructureNuker.launchNuke API](https://docs.screeps.com/api/#StructureNuker.launchNuke)
- [Defense](https://docs.screeps.com/defense.html)
