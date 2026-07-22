---
title: "Game.market.deal() 怎么成交现有订单"
description: "在一次性开关下筛选现有卖单，限制成交量，核对 Credits、Terminal cooldown 与交易 Energy 后调用 Game.market.deal()。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "市场"
  - "Game API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`Game.market.deal()` 会真实消耗 Credits 或资源，不能在每个 tick 无条件执行。下面只有在 `Memory.market.buyHydrogen === true` 时才筛选卖单并尝试一次成交。

## 先给检查顺序

成交前需要确认房间 Terminal 可用、订单仍有余量、成交金额不超过 Credits，并为交易 Energy 预留库存。代码还会把一次性开关在 `OK` 后关闭。

## 官方规则

- Game.market.getAllOrders 可按订单类型和资源筛选。
- deal 需要订单 id、数量，并在需要时提供自己的 roomName。
- 执行成交的一方承担 Terminal 的交易 Energy 成本和 cooldown。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  if (!Memory.market || Memory.market.buyHydrogen !== true) {
    return;
  }

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

  Memory.market.buyHydrogen = false;
  const result = Game.market.deal(order.id, amount, room.name);
  console.log('market deal result:', result);

  if (result === OK) {
    console.log('一次性成交请求已接受');
  }
};
```

## 为什么这样写

1. 订单过滤 remainingAmount 和 roomName。
2. 成交量不超过订单余量。
3. Credits 与交易 Energy 分开检查。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 调用前就清除一次性开关，避免非 `OK` 结果在下一 tick 自动重试。失败后必须人工核对订单、库存和参数，再明确重新开启请求。

## 适用限制

本文只演示一次买入既有卖单的安全入口，不构成价格判断，也不覆盖自动选价、拆单或长期交易策略。

## 相关站内内容

- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)
- [认识 Room](/blog/screeps-first-room)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Market System](https://docs.screeps.com/market.html)
- [Game.market.deal API](https://docs.screeps.com/api/#Game-market.deal)
