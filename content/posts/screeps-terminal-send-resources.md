---
title: "StructureTerminal.send() 怎么跨房间发送资源"
description: "用一次性开关调用 StructureTerminal.send()，发送前计算交易 Energy 成本，并检查资源库存、cooldown 与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Terminal"
  - "物流"
  - "跨房间"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`StructureTerminal.send()` 会把资源真实发送到另一房间。主循环必须有明确的一次性入口，并在发送前核对目标房间、资源库存、交易 Energy 和 `cooldown`。

## 先给检查顺序

本文不经过市场订单：代码只在 `Memory.terminal.sendUtrium === true` 时，使用房间自己的 Terminal 直接发送 Utrium。

## 官方规则

- Terminal.send 可以向其他房间 Terminal 发送资源。
- 发送会消耗按距离计算的 Energy，可用 Game.market.calcTransactionCost 估算。
- Terminal 有 cooldown，资源和交易 Energy 都必须足够。

## 可放进 main 的最小示例

示例中的源房间 `W1N1`、目标房间 `W2N2`、资源类型和数量都必须在执行前人工确认。

```js
module.exports.loop = function () {
  if (!Memory.terminal || Memory.terminal.sendUtrium !== true) {
    return;
  }

  const room = Game.rooms.W1N1;
  if (!room || !room.terminal) {
    return;
  }

  const terminal = room.terminal;
  const destination = 'W2N2';
  const resourceType = RESOURCE_UTRIUM;
  const amount = 1000;

  if (terminal.cooldown > 0) {
    return;
  }

  const energyCost = Game.market.calcTransactionCost(
    amount,
    room.name,
    destination
  );
  if (
    terminal.store.getUsedCapacity(resourceType) < amount
    || terminal.store.getUsedCapacity(RESOURCE_ENERGY) < energyCost
  ) {
    return;
  }

  Memory.terminal.sendUtrium = false;
  const result = terminal.send(
    resourceType,
    amount,
    destination,
    'manual transfer'
  );
  console.log('terminal send result:', result);

  if (result === OK) {
    console.log('一次性发送请求已接受');
  }
};
```

## 为什么这样写

1. Room 和 room.terminal 均检查。
2. 先计算交易 Energy 成本。
3. 发送资源与 Energy 储量分别检查。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 调用前关闭发送开关，避免失败后在下一 tick 自动重发。失败后必须人工检查目标房间、资源、Energy、cooldown 和返回值，再明确重新开启请求。

## 适用限制

本文只演示一次跨房间资源发送，不处理接收房间分配、自动补货或多房间物流队列。

## 相关站内内容

- [认识 Room](/blog/screeps-first-room)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)

## 官方资料

- [StructureTerminal API](https://docs.screeps.com/api/#StructureTerminal)
- [Market System](https://docs.screeps.com/market.html)
