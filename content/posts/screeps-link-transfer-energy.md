---
title: "StructureLink.transferEnergy() 怎么用"
description: "在同一房间的两个 Link 之间发送 Energy，并检查 cooldown、源储量和目标容量，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Link transferEnergy"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；对象、房间、资源和策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：在同一房间的两个 Link 之间发送 Energy，并检查 cooldown、源储量和目标容量。

## 先给检查顺序

Creep transfer 页面处理单位送能；本文只讲 StructureLink 的远程同房间传输。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- Link 只能向同房间另一个 Link 传送 Energy。
- StructureLink 有 cooldown 和 Energy 损耗。
- transferEnergy 返回 OK 或错误常量，amount 参数可选。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const links = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_LINK
  });
  const sourceLink = links[0];
  const targetLink = links[1];

  if (!sourceLink || !targetLink || sourceLink.cooldown > 0) {
    return;
  }

  const available = sourceLink.store.getUsedCapacity(RESOURCE_ENERGY);
  const free = targetLink.store.getFreeCapacity(RESOURCE_ENERGY);
  const amount = Math.min(available, free);
  if (amount <= 0) {
    return;
  }

  const result = sourceLink.transferEnergy(targetLink, amount);
  console.log('link transfer result:', result);
};
```

## 为什么这样写

1. 两个 Link 都检查 undefined。
2. cooldown 为 0 才调用。
3. amount 不超过源储量和目标空闲容量。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)
- [升级 Controller](/blog/screeps-upgrade-controller)
- [第一份房间代码](/blog/screeps-first-room-code)

## 官方资料

- [StructureLink API](https://docs.screeps.com/api/#StructureLink)
- [StructureLink.transferEnergy API](https://docs.screeps.com/api/#StructureLink.transferEnergy)

