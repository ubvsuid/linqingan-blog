---
title: "Game.market.createOrder() 怎么创建和维护订单"
description: "在明确的一次性请求下创建订单，并用 Game.market.orders 防止每 tick 重复创建，用最小示例检查对象、资源、冷却与返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps createOrder"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

这类代码最容易出错的地方不是调用名称，而是前提没有满足。本文只解决：在明确的一次性请求下创建订单，并用 Game.market.orders 防止每 tick 重复创建。

## 先给检查顺序

deal 页面处理成交现有订单；本文只处理自己的订单生命周期入口，不提供价格预测。先确认结构存在，再检查资源、容量、冷却和所有权，最后调用 API 并保存返回值。

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
5. 不在每个 tick 无条件执行一次性市场或发送操作。

## 适用限制

本文不预测价格，不承诺收益，不提供完整多房间物流。代码只经过语法和静态规则检查，待 Screeps 环境验证。

## 相关站内内容

- [Screeps 资料页](https://www.linqingan.com/resources)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Market System](https://docs.screeps.com/market.html)
- [Game.market.createOrder API](https://docs.screeps.com/api/#Game-market.createOrder)

