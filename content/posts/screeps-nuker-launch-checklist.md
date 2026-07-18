---
title: "StructureNuker.launchNuke() 前要检查什么"
description: "在显式一次性请求下检查目标坐标、距离、cooldown、Energy 和 Ghodium 后再调用 launchNuke，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps launchNuke"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

如果只复制一行 API 调用，很难知道失败发生在哪个前提。本文的范围是：在显式一次性请求下检查目标坐标、距离、cooldown、Energy 和 Ghodium 后再调用 launchNuke。

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

  const result = nuker.launchNuke(target);
  console.log('launchNuke result:', result);

  if (result === OK) {
    Memory.nuker.launchRequested = false;
  }
};
```

## 排查顺序

1. 必须有显式 launchRequested。
2. 目标 RoomPosition 和线性距离检查。
3. 只有 OK 才清除请求，避免误判。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文不包含自动化大系统、收益或战斗效果承诺。JavaScript 语法检查通过，游戏行为待 Screeps 环境验证。

## 站内学习路径

- [Safe Mode 排查](/blog/screeps-controller-activate-safe-mode)
- [认识 Room](/blog/screeps-first-room)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [StructureNuker.launchNuke API](https://docs.screeps.com/api/#StructureNuker.launchNuke)
- [Defense](https://docs.screeps.com/defense.html)

