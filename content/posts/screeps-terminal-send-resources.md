---
title: "StructureTerminal.send() 怎么跨房间发送资源"
description: "计算交易 Energy 成本，并在资源、Energy 与 cooldown 都满足时向另一房间发送资源，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Terminal send"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：计算交易 Energy 成本，并在资源、Energy 与 cooldown 都满足时向另一房间发送资源。

## 先给检查顺序

本文只讲 Terminal.send 直接发送，不筛选市场订单，也不创建订单。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- Terminal.send 可以向其他房间 Terminal 发送资源。
- 发送会消耗按距离计算的 Energy，可用 Game.market.calcTransactionCost 估算。
- Terminal 有 cooldown，资源和交易 Energy 都必须足够。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
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

  const result = terminal.send(
    resourceType,
    amount,
    destination,
    'manual transfer'
  );
  console.log('terminal send result:', result);
};
```

## 为什么这样写

1. Room 和 room.terminal 均检查。
2. 先计算交易 Energy 成本。
3. 发送资源与 Energy 储量分别检查。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [认识 Room](/blog/screeps-first-room)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [Screeps 资料页](https://www.linqingan.com/resources)

## 官方资料

- [StructureTerminal API](https://docs.screeps.com/api/#StructureTerminal)
- [Market System](https://docs.screeps.com/market.html)

