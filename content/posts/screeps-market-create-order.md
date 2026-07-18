
---
title: "Game.market.createOrder() 怎么创建和维护订单"
description: "通过一次性 Memory 开关调用 Game.market.createOrder()，并在创建前检查现有订单、参数和 Credits，避免每 tick 重复下单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "市场"
  - "订单"
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


`createOrder()` 是一次性市场操作。如果把它无条件放进主循环，代码会在后续 tick 继续尝试创建订单。下面同时使用 Memory 开关和现有订单检查来阻止重复执行。

## 先给检查顺序

先确认一次性开关已开启，再从 `Game.market.orders` 排除同房间、同资源、同类型订单，最后保存 `createOrder()` 返回值。价格和数量必须由玩家在执行前自行确认。

## 官方规则

- createOrder 接收订单类型、资源、价格、总量和 roomName。
- 创建订单会产生官方规定的 Credits 费用。
- 自己的订单可从 Game.market.orders 读取，并可调价、延长或取消。

## 可放进 main 的最小示例

示例中的房间、资源、数量和价格只是演示参数，发布前必须按自己的环境修改。

```js
module.exports.loop = function () {
  if (!Memory.market || Memory.market.createUtriumOrder !== true) {
    return;
  }

  const existing = Object.values(Game.market.orders).find(
    order =>
      order.type === ORDER_SELL
      && order.resourceType === RESOURCE_UTRIUM
      && order.roomName === 'W1N1'
  );
  if (existing) {
    Memory.market.createUtriumOrder = false;
    return;
  }

  const result = Game.market.createOrder({
    type: ORDER_SELL,
    resourceType: RESOURCE_UTRIUM,
    price: 1,
    totalAmount: 10000,
    roomName: 'W1N1'
  });
  console.log('createOrder result:', result);

  if (result === OK) {
    Memory.market.createUtriumOrder = false;
  }
};
```

## 为什么这样写

1. 只在显式 Memory 请求下创建。
2. 先检查同类型同资源同房间订单。
3. 只有返回 OK 才清除请求。
4. 非 `OK` 返回值应回到对应 API 页面逐项对照。
5. 创建失败时保留开关，修正参数后才能再次尝试；实际使用时应避免每 tick 刷屏。

## 适用限制

本文只演示创建一个卖单并避免重复创建，不覆盖改价、追加数量、取消订单或交易策略。

## 相关站内内容

- [Screeps 资料页](https://www.linqingan.com/resources)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Market System](https://docs.screeps.com/market.html)
- [Game.market.createOrder API](https://docs.screeps.com/api/#Game-market.createOrder)

