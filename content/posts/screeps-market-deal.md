---
title: "Game.market.deal() 怎么安全成交指定市场订单"
description: "使用人工指定订单ID和一次性Memory请求，核对订单类型、当前amount、价格上限、Credits保留线、Terminal与交易Energy后安全调用deal()。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "市场"
  - "Game API"
  - "运行安全"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（订单快照、成交量、Credits、Terminal Energy和一次性状态，不是 Screeps 官方服务器）"
  testResult: "订单缺失、类型错误、资源错误、价格超限、当前amount不足、Credits保留线、Energy不足和可提交场景通过。"
featured: false
---

`Game.market.deal(orderId, amount, yourRoomName)` 会按其他玩家的现有订单执行真实交易。买入卖单会真实消耗 Credits，卖给买单会真实转出资源；普通资源交易还会使用己方 Terminal并消耗交易 Energy。

本文只解决一个问题：怎样在人工确认订单ID后安全买入一笔普通资源，并避免自动选价、订单变化和主循环重复执行造成意外成交。

## 为什么不在本文自动选择“最便宜订单”

只按 `order.price`排序忽略了：

- 不同房间的交易Energy；
- 当前订单可成交量；
- 订单在执行前被其他玩家抢先成交；
- 房间Energy预算；
- Credits保留线；
- 价格异常和错误资源；
- 同 tick 最多10笔成交限制。

因此本文要求先在 Console或市场页面选定订单，再把订单ID写入一次性请求。

这不是长期自动交易策略，而是一个有明确人工确认点的安全执行入口。

## `amount` 和 `remainingAmount` 不一样

`Game.market.getOrderById()`或 `getAllOrders()`返回的订单中：

| 字段 | 含义 |
|---|---|
| `amount` | 当前实际可成交数量 |
| `remainingAmount` | 订单总计划中尚未完成的数量 |

成交量必须不超过当前 `amount`。只检查 `remainingAmount`可能在订单暂时缺少资源或Credits时仍然选出无法执行的数量。

## 一次性请求结构

```js
Memory.market ??= {};
Memory.market.dealRequest = {
  enabled: true,
  mode: 'buy',
  orderId: '替换为人工确认的订单ID',
  roomName: 'W1N1',
  resourceType: RESOURCE_HYDROGEN,
  amount: 1000,
  maxUnitPrice: 0.2,
  creditReserve: 1000000,
  terminalEnergyReserve: 20000
};
```

所有数字都只是演示。执行前必须人工核对订单、房间、资源、数量、价格上限和两个保留线。

## 为什么要保存价格上限

人工复制订单ID后，订单价格仍可能被修改。调用前应重新读取当前订单，并检查：

```js
order.price <= request.maxUnitPrice
```

价格上限不是市场预测，也不是收益承诺。它只是阻止请求在当前价格已经超过人工确认范围时继续执行。

## 可离线测试的成交计划

```js
function evaluateBuyDeal(input) {
  const {
    request,
    order,
    credits,
    terminalEnergy,
    transactionEnergy
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (!order) {
    return { ready: false, reason: 'order-missing' };
  }

  if (order.type !== ORDER_SELL) {
    return { ready: false, reason: 'order-type-mismatch' };
  }

  if (order.resourceType !== request.resourceType) {
    return { ready: false, reason: 'resource-mismatch' };
  }

  if (
    !Number.isFinite(request.maxUnitPrice)
    || order.price > request.maxUnitPrice
  ) {
    return { ready: false, reason: 'price-limit' };
  }

  if (
    !Number.isInteger(request.amount)
    || request.amount <= 0
    || request.amount > order.amount
  ) {
    return { ready: false, reason: 'amount-unavailable' };
  }

  const creditCost = request.amount * order.price;
  const creditReserve = Number.isFinite(request.creditReserve)
    ? request.creditReserve
    : 0;

  if (credits - creditCost < creditReserve) {
    return {
      ready: false,
      reason: 'credit-reserve',
      creditCost
    };
  }

  const energyReserve = Number.isFinite(
    request.terminalEnergyReserve
  )
    ? request.terminalEnergyReserve
    : 0;

  if (terminalEnergy - transactionEnergy < energyReserve) {
    return {
      ready: false,
      reason: 'terminal-energy-reserve',
      transactionEnergy
    };
  }

  return {
    ready: true,
    reason: 'ready',
    creditCost,
    transactionEnergy
  };
}
```

## 完整示例

代码放在 `main` 模块。

```js
function evaluateBuyDeal(input) {
  const {
    request,
    order,
    credits,
    terminalEnergy,
    transactionEnergy
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (!order) {
    return { ready: false, reason: 'order-missing' };
  }

  if (order.type !== ORDER_SELL) {
    return { ready: false, reason: 'order-type-mismatch' };
  }

  if (order.resourceType !== request.resourceType) {
    return { ready: false, reason: 'resource-mismatch' };
  }

  if (
    !Number.isFinite(request.maxUnitPrice)
    || order.price > request.maxUnitPrice
  ) {
    return { ready: false, reason: 'price-limit' };
  }

  if (
    !Number.isInteger(request.amount)
    || request.amount <= 0
    || request.amount > order.amount
  ) {
    return { ready: false, reason: 'amount-unavailable' };
  }

  const creditCost = request.amount * order.price;
  const creditReserve = Number.isFinite(request.creditReserve)
    ? request.creditReserve
    : 0;

  if (credits - creditCost < creditReserve) {
    return {
      ready: false,
      reason: 'credit-reserve',
      creditCost
    };
  }

  const energyReserve = Number.isFinite(
    request.terminalEnergyReserve
  )
    ? request.terminalEnergyReserve
    : 0;

  if (terminalEnergy - transactionEnergy < energyReserve) {
    return {
      ready: false,
      reason: 'terminal-energy-reserve',
      transactionEnergy
    };
  }

  return {
    ready: true,
    reason: 'ready',
    creditCost,
    transactionEnergy
  };
}

module.exports.loop = function () {
  const request = Memory.market?.dealRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  if (
    request.mode !== 'buy'
    || typeof request.orderId !== 'string'
    || typeof request.roomName !== 'string'
    || typeof request.resourceType !== 'string'
  ) {
    return;
  }

  const room = Game.rooms[request.roomName];
  const terminal = room ? room.terminal : null;

  if (
    !room
    || !terminal
    || terminal.my !== true
    || !terminal.isActive()
    || terminal.cooldown > 0
  ) {
    return;
  }

  const order = Game.market.getOrderById(
    request.orderId
  );

  const transactionEnergy = order?.roomName
    ? Game.market.calcTransactionCost(
        request.amount,
        room.name,
        order.roomName
      )
    : Number.NaN;

  if (!Number.isFinite(transactionEnergy)) {
    return;
  }

  const plan = evaluateBuyDeal({
    request,
    order,
    credits: Game.market.credits,
    terminalEnergy: terminal.store.getUsedCapacity(
      RESOURCE_ENERGY
    ),
    transactionEnergy
  });

  if (!plan.ready) {
    request.lastStatus = plan.reason;
    request.lastCheckedAt = Game.time;
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    orderId: order.id,
    orderRoom: order.roomName,
    resourceType: order.resourceType,
    orderType: order.type,
    unitPrice: order.price,
    amount: request.amount,
    creditCost: plan.creditCost,
    transactionEnergy: plan.transactionEnergy,
    creditsBefore: Game.market.credits,
    terminalEnergyBefore: terminal.store.getUsedCapacity(
      RESOURCE_ENERGY
    )
  };

  const result = Game.market.deal(
    order.id,
    request.amount,
    room.name
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'market-deal-result',
    orderId: order.id,
    roomName: room.name,
    resourceType: order.resourceType,
    amount: request.amount,
    unitPrice: order.price,
    creditCost: plan.creditCost,
    transactionEnergy: plan.transactionEnergy,
    result
  });
};
```

## 为什么调用前就关闭请求

`Game.market.deal()`会真实消耗 Credits 或资源。订单可能在检查与结算之间发生变化，API也可能返回错误。

示例在调用前执行：

```js
request.enabled = false;
```

防止失败后下一 tick 自动再次尝试。失败后必须人工核对：

- 订单是否仍存在；
- `order.amount`是否变化；
- 当前价格；
- Credits；
- Terminal Energy；
- Terminal状态；
- 返回码；
- 是否已经有其他成交模块在同一 tick 工作。

只有再次确认后才重新开启。

## Credits与交易Energy是两种成本

买入卖单时：

```js
creditCost = amount * order.price
```

这是会真实消耗 Credits 的金额。

普通资源还需要己方Terminal支付交易Energy：

```js
Game.market.calcTransactionCost(
  amount,
  yourRoomName,
  order.roomName
)
```

两者不能混在一起比较，也不能只检查其中一个。

## 为什么保留 Credits 和 Energy 底线

仅仅“余额够支付”不代表应该执行。

```js
Game.market.credits - creditCost >= creditReserve
```

用于避免一笔交易突破账号Credits底线。

```js
terminalEnergy - transactionEnergy
  >= terminalEnergyReserve
```

用于避免交易后Terminal失去后续物流和市场操作所需的Energy。

保留线是本站业务策略，不是官方限制。

## 当前订单可能在执行前改变

官方说明，多名玩家同时尝试同一订单时，距离更短者优先。并且每名玩家每 tick 最多执行10笔成交。

因此即使预检查通过，也可能收到：

- 订单已经没有当前可成交量；
- 价格或订单状态变化；
- 本 tick 其他模块已占用成交次数；
- Terminal状态变化。

API返回值仍是最终判断。

## 主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 成交命令已安排 | 下一 tick 查看交易记录、Credits与Store |
| `ERR_NOT_OWNER` | 指定房间没有己方Terminal | `roomName`、Terminal和所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | Credits或资源不足 | 买入Credits、卖出库存和交易Energy |
| `ERR_FULL` | 本 tick 已达到10笔成交 | 检查全局交易调度 |
| `ERR_INVALID_ARGS` | 订单ID、数量或房间参数无效 | 当前订单快照与输入 |
| `ERR_TIRED` | Terminal仍在等待 | `terminal.cooldown` |

对普通资源交易，`yourRoomName`必须对应可用的己方Terminal。账号绑定资源属于另一类交易，本文不覆盖。

## 下一 tick 怎样核对结果

可以查看：

```js
Game.market.incomingTransactions
Game.market.outgoingTransactions
```

以及：

- `Game.market.credits`变化；
- Terminal Store变化；
- 请求记录中的订单ID、数量和tick；
- 是否出现对应交易记录。

不要只根据 `OK`打印“已买到”。`OK`表示命令已安排，真实交易记录应在后续状态中核对。

## 为什么不用价格历史自动决定成交

`Game.market.getHistory()`提供历史数据，但从历史均价推导自动买入规则属于另一篇策略文章，需要处理：

- 交易量；
- 标准差；
- 资源紧迫程度；
- Energy折算；
- 异常订单；
- 多日窗口；
- 账户预算；
- 回测偏差。

本文只执行人工确认的订单，不提供价格预测或收益承诺。

## 离线模拟结果

构建检查对成交计划覆盖：

1. 请求未启用；
2. 订单不存在；
3. 订单不是卖单；
4. 资源类型不一致；
5. 当前价格超过上限；
6. 数量超过 `order.amount`；
7. 交易后Credits低于保留线；
8. 交易后Terminal Energy低于保留线；
9. 条件满足时返回Credit与Energy预算。

离线模拟没有访问真实市场，不会预测订单是否仍存在，也不会执行真实成交。

## 常见误区

### 使用 `remainingAmount`代替 `amount`

前者是订单总计划剩余量，后者才是当前可成交量。

### 自动选择最低单价

忽略距离、Energy成本、订单可用量和预算。

### 没有价格上限

人工复制ID后，执行时价格可能已经变化。

### 只检查 Credits

普通资源成交还需要Terminal交易Energy。

### 失败后自动重试

订单环境在变化，必须重新人工确认。

### 同一 tick 多模块各自成交

可能超过10笔全局限制，应由统一市场调度器控制。

### 把 `OK`写成资源已经到账

应在下一 tick 核对交易记录和Store。

## 适用边界

本文没有实现：

- 自动选价；
- 市场做市；
- 拆单；
- 多Terminal最优路由；
- 卖给买单；
- 账号绑定资源；
- 历史价格模型；
- 交易Energy折算价格；
- 多shard市场策略；
- 自动失败重试。

JavaScript语法和成交计划离线模拟已经通过。真实订单、Credits、Terminal结算与交易记录仍待Screeps环境验证。

## 相关站内内容

- [Game.market.createOrder() 怎么创建订单](/blog/screeps-market-create-order)
- [Terminal.send() 怎么跨房间发送资源](/blog/screeps-terminal-send-resources)
- [StructureFactory.produce() 怎么生产商品](/blog/screeps-factory-produce)
- [Screeps Storage中的Energy怎么使用](/blog/screeps-storage-energy-usage)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [Game.market.deal API](https://docs.screeps.com/api/#Game-market.deal)
- [Game.market.calcTransactionCost API](https://docs.screeps.com/api/#Game-market.calcTransactionCost)
- [Market System](https://docs.screeps.com/market.html)

资料核对日期：2026-07-22。离线成交计划模拟已通过；真实市场成交仍待环境验证。
