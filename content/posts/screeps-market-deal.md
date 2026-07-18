---
title: "Game.market.deal() 怎么成交现有订单"
description: "筛选一个现有卖单，限制成交量，检查 Credits、Terminal 和交易 Energy 后执行 deal，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Game.market.deal"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：筛选一个现有卖单，限制成交量，检查 Credits、Terminal 和交易 Energy 后执行 deal。

## 先给检查顺序

Terminal.send 是房间间直接发送；createOrder 是发布自己的订单。本文只成交别人已有的订单。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

## 官方规则

- Game.market.getAllOrders 可按订单类型和资源筛选。
- deal 需要订单 id、数量，并在需要时提供自己的 roomName。
- 执行成交的一方承担 Terminal 的交易 Energy 成本和 cooldown。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room || !room.terminal || room.terminal.cooldown > 0) {
    return;
  }

  const orders = Game.market.getAllOrders({
    type: ORDER_SELL,
    resourceType: RESOURCE_HYDROGEN
  }).filter(order => order.remainingAmount > 0 && order.roomName);

  orders.sort((a, b) => a.price - b.price);
  const order = orders[0];
  if (!order) {
    return;
  }

  const amount = Math.min(1000, order.remainingAmount);
  const creditCost = amount * order.price;
  const energyCost = Game.market.calcTransactionCost(
    amount,
    room.name,
    order.roomName
  );
  if (
    Game.market.credits < creditCost
    || room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) < energyCost
  ) {
    return;
  }

  const result = Game.market.deal(order.id, amount, room.name);
  console.log('market deal result:', result);
};
```

## 为什么这样写

1. 订单过滤 remainingAmount 和 roomName。
2. 成交量不超过订单余量。
3. Credits 与交易 Energy 分开检查。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [Screeps 资料页](https://www.linqingan.com/resources)
- [认识 Room](/blog/screeps-first-room)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Market System](https://docs.screeps.com/market.html)
- [Game.market.deal API](https://docs.screeps.com/api/#Game-market.deal)

