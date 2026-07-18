
---
title: "StructureLink.transferEnergy() 怎么用"
description: "在同一房间的两个 Link 之间发送 Energy，检查源 Link 储量、目标 Link 容量、cooldown 与 transferEnergy() 返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Link"
  - "Energy"
  - "物流"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Link 传输不需要 Creep 搬运，但源 Link 必须有 Energy、目标 Link 必须有空余容量，并且源 Link 的 `cooldown` 已归零。

## 先给检查顺序

先取得同一房间内两个自己的 Link，再分别读取源储量、目标容量和源 Link 的 `cooldown`，最后保存 `transferEnergy()` 的返回值。

## 官方规则

- Link 只能向同房间另一个 Link 传送 Energy。
- StructureLink 有 cooldown 和 Energy 损耗。
- transferEnergy 返回 OK 或错误常量，amount 参数可选。

## 可放进 main 的最小示例

示例使用 `W1N1` 中查找结果的前两个 Link。实际代码应按位置或保存的 ID 明确区分源 Link 与目标 Link。

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
5. 两个 Link 的顺序必须与房间布局一致，不能长期依赖数组顺序。

## 适用限制

本文只演示同房间两个 Link 的单次传输条件，不处理 Link 网络角色分配、优先级或跨房间物流。

## 相关站内内容

- [向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)
- [升级 Controller](/blog/screeps-upgrade-controller)
- [第一份房间代码](/blog/screeps-first-room-code)

## 官方资料

- [StructureLink API](https://docs.screeps.com/api/#StructureLink)
- [StructureLink.transferEnergy API](https://docs.screeps.com/api/#StructureLink.transferEnergy)

