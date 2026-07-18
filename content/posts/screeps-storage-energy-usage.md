---
title: "Room.storage 怎么判断存在并读写 Energy"
description: "安全检查 room.storage，并让运输者在 Storage 与缺能 Spawn/Extension 之间搬运 Energy，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Room.storage"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；对象、房间、资源和策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：安全检查 room.storage，并让运输者在 Storage 与缺能 Spawn/Extension 之间搬运 Energy。

## 先给检查顺序

Container withdraw 文章只从 Container 取能；本文只接入唯一的 Room.storage 属性和 Storage 容量。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- Room.storage 在房间没有 Storage 或不可见时可能为 undefined。
- StructureStorage 使用 Store 保存资源。
- Creep.withdraw 与 transfer 都需要相邻并返回错误常量。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;
  if (!creep) {
    return;
  }

  const storage = creep.room.storage;
  if (!storage) {
    return;
  }

  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    const result = creep.withdraw(storage, RESOURCE_ENERGY);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage);
    }
    return;
  }

  const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_SPAWN
        || structure.structureType === STRUCTURE_EXTENSION)
      && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (!target) {
    return;
  }

  const result = creep.transfer(target, RESOURCE_ENERGY);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
  }
};
```

## 为什么这样写

1. room.storage 使用前检查。
2. 取能与送能分支互斥。
3. 目标只选有剩余容量的己方 Spawn/Extension。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [Room.storage API](https://docs.screeps.com/api/#Room-storage)
- [StructureStorage API](https://docs.screeps.com/api/#StructureStorage)

