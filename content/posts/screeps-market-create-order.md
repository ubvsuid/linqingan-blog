---
title: "Game.market.createOrder() 怎么安全创建并避免重复订单"
description: "用一次性Memory请求创建市场订单，先校验Terminal、参数、5%挂单费用和重复订单，再保存createOrder返回值并处理官方订单上限说明不一致的问题。"
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
  testEnvironment: "Node.js 24 离线模拟（参数、费用与重复订单判断，不是 Screeps 官方服务器）"
  testResult: "无效参数、500 Credits费用、Credits不足、重复订单和可提交场景通过。"
featured: false
---

`Game.market.createOrder()` 是一次性市场操作。它不是“每tick维持订单”的方法，也不会替你决定价格是否合理。

如果把它无条件放进`module.exports.loop`，主循环会在后续tick继续尝试创建新订单。更安全的方式是：由Memory保存一个明确的一次性请求，主循环只处理一次，并记录返回值和失败原因。

本文只解决一个问题：怎样安全创建一个Terminal资源卖单，同时避免参数错误、Credits不足和重复订单。

## 创建订单和直接成交不是一回事

| 操作 | 方法 | 作用 |
|---|---|---|
| 创建自己的买单或卖单 | `Game.market.createOrder()` | 把订单挂到市场等待成交 |
| 对现有订单成交 | `Game.market.deal()` | 立即尝试执行一笔交易 |
| 修改自己的订单价格 | `Game.market.changeOrderPrice()` | 调整已有订单价格 |
| 增加订单剩余总量 | `Game.market.extendOrder()` | 扩大已有订单容量 |
| 取消自己的订单 | `Game.market.cancelOrder()` | 删除已有订单 |

创建订单会产生 **Credits 费用**；实际成交时还会涉及Terminal和传输Energy。本文不处理`deal()`的交易距离和传输成本。

## 官方参数

`createOrder()`接收一个对象：

```js
{
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  price: 1,
  totalAmount: 10000,
  roomName: 'W1N1'
}
```

字段含义：

| 字段 | 含义 | 本文检查 |
|---|---|---|
| `type` | `ORDER_BUY`或`ORDER_SELL` | 必须是允许的订单类型 |
| `resourceType` | 资源常量或支持的账号资源 | 必须是非空字符串 |
| `price` | 每单位资源的Credits价格 | 必须是大于0的有限数值 |
| `totalAmount` | 总交易数量 | 必须是大于0的整数 |
| `roomName` | 订单所属Terminal房间 | 本文要求是己方可见Terminal房间 |

账号绑定资源的`roomName`规则不同。本文专门处理普通Terminal资源，不把两类订单混在一份示例里。

## 先计算5%挂单费用

官方API给出的创建费用是：

```text
price × totalAmount × 0.05
```

示例参数：

```js
price: 1,
totalAmount: 10000
```

需要的Credits费用为：

```text
1 × 10000 × 0.05 = 500 Credits
```

这个费用不是资源成交金额，而是创建订单时支付的费用。取消订单时，已支付的5%费用不会退回。

可以先写成纯函数：

```js
function calculateOrderFee(price, totalAmount) {
  return price * totalAmount * 0.05;
}
```

不要只检查：

```js
Game.market.credits >= price * totalAmount
```

创建卖单并不要求先持有整笔成交金额；创建时需要检查的是挂单费用。订单能否处于活跃状态，还会受到资源、Credits和Terminal状态影响。

## 为什么要使用一次性Memory请求

先在Console中明确写入请求：

```js
Memory.market ??= {};
Memory.market.createOrderRequest = {
  enabled: true,
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  price: 1,
  totalAmount: 10000,
  roomName: 'W1N1'
};
```

只有`enabled === true`时，主循环才会处理。

执行后代码会把请求关闭，并记录：

- 尝试tick；
- 计算费用；
- API返回值；
- 本地检查状态。

这样不会因为主循环继续运行而每tick重复下单。

## 完整示例

```js
const ALLOWED_ORDER_TYPES = new Set([
  ORDER_BUY,
  ORDER_SELL
]);

function calculateOrderFee(price, totalAmount) {
  return price * totalAmount * 0.05;
}

function validateOrderRequest(request) {
  if (!request || request.enabled !== true) {
    return {
      ok: false,
      reason: 'request-disabled'
    };
  }

  if (!ALLOWED_ORDER_TYPES.has(request.type)) {
    return {
      ok: false,
      reason: 'invalid-order-type'
    };
  }

  if (
    typeof request.resourceType !== 'string'
    || request.resourceType.length === 0
  ) {
    return {
      ok: false,
      reason: 'invalid-resource-type'
    };
  }

  if (
    !Number.isFinite(request.price)
    || request.price <= 0
  ) {
    return {
      ok: false,
      reason: 'invalid-price'
    };
  }

  if (
    !Number.isInteger(request.totalAmount)
    || request.totalAmount <= 0
  ) {
    return {
      ok: false,
      reason: 'invalid-total-amount'
    };
  }

  if (
    typeof request.roomName !== 'string'
    || request.roomName.length === 0
  ) {
    return {
      ok: false,
      reason: 'invalid-room-name'
    };
  }

  return {
    ok: true,
    reason: null
  };
}

function findDuplicateOrder(request) {
  return Object.values(Game.market.orders).find(
    order =>
      order.type === request.type
      && order.resourceType === request.resourceType
      && order.roomName === request.roomName
  ) || null;
}

function finishRequest(request, status, detail = {}) {
  request.enabled = false;
  request.status = status;
  request.finishedAt = Game.time;
  Object.assign(request, detail);
}

function processCreateOrderRequest() {
  const request = Memory.market
    && Memory.market.createOrderRequest;

  const validation = validateOrderRequest(request);

  if (!request || request.enabled !== true) {
    return;
  }

  request.attemptedAt = Game.time;

  if (!validation.ok) {
    finishRequest(request, validation.reason);
    return;
  }

  const room = Game.rooms[request.roomName];

  if (!room) {
    finishRequest(request, 'room-not-visible');
    return;
  }

  if (!room.terminal || room.terminal.my !== true) {
    finishRequest(request, 'owned-terminal-not-found');
    return;
  }

  const duplicate = findDuplicateOrder(request);

  if (duplicate) {
    finishRequest(request, 'duplicate-order', {
      duplicateOrderId: duplicate.id
    });
    return;
  }

  const fee = calculateOrderFee(
    request.price,
    request.totalAmount
  );

  if (Game.market.credits < fee) {
    finishRequest(request, 'insufficient-credits', {
      estimatedFee: fee,
      creditsAtAttempt: Game.market.credits
    });
    return;
  }

  request.enabled = false;
  request.estimatedFee = fee;
  request.creditsAtAttempt = Game.market.credits;

  const result = Game.market.createOrder({
    type: request.type,
    resourceType: request.resourceType,
    price: request.price,
    totalAmount: request.totalAmount,
    roomName: request.roomName
  });

  request.result = result;
  request.finishedAt = Game.time;
  request.status = result === OK
    ? 'request-accepted'
    : 'api-rejected';

  console.log({
    action: 'create-market-order',
    result,
    roomName: request.roomName,
    resourceType: request.resourceType,
    type: request.type,
    price: request.price,
    totalAmount: request.totalAmount,
    estimatedFee: fee
  });
}

module.exports.loop = function () {
  processCreateOrderRequest();
};
```

这份代码不会自动开启请求。只有你在Console中把`enabled`明确设为`true`，它才会尝试一次。

## 为什么调用前先把`enabled`设为false

如果代码在调用API之后才关闭请求，而运行过程在中间抛出异常，请求可能在下一tick再次执行。

示例在真正调用前执行：

```js
request.enabled = false;
```

然后保存返回值。即使API返回错误，代码也不会自动重复尝试。

失败后必须人工检查：

- `request.result`；
- `request.status`；
- Credits；
- Terminal；
- 参数；
- 当前已有订单；
- 官方返回值说明。

确认后再手工把`enabled`重新设为`true`。

## 重复订单判断是本文策略

示例把以下条件相同视为重复：

```text
订单类型相同
资源相同
房间相同
```

它没有比较价格，因为本文目标是阻止同一房间为同一资源重复创建多个同方向订单。

实际交易策略可能确实需要多个价格层级。那时应把：

- 价格；
- 策略名称；
- 订单用途；
- 目标数量；
- 允许订单数量

加入自己的唯一性规则，而不是直接删除重复检查。

## `OK`表示什么

`createOrder()`返回`OK`表示操作请求已被成功安排。它不等于：

- 订单已经成交；
- 资源已经发送；
- 市场价格合理；
- Terminal中一定有足够资源；
- 订单会一直保持活跃；
- 交易一定有利润。

调用后可以在后续tick从：

```js
Game.market.orders
```

确认自己的订单对象和当前活跃状态。

## 需要处理的返回值

官方API列出：

| 返回值 | 含义 | 排查方向 |
|---|---|---|
| `OK` | 请求已安排 | 后续检查`Game.market.orders` |
| `ERR_NOT_OWNER` | Terminal所有权或房间条件不满足 | 检查`roomName`和己方Terminal |
| `ERR_NOT_ENOUGH_RESOURCES` | Credits不足以支付费用 | 重新计算5%费用 |
| `ERR_FULL` | 无法继续创建更多订单 | 检查当前订单数量，不要自动重试 |
| `ERR_INVALID_ARGS` | 参数无效 | 检查类型、资源、价格、数量和房间 |

`createOrder()`不返回`ERR_NOT_IN_RANGE`，因此不需要为它编写距离处理。

## 官方订单上限文字存在不一致

截至2026-07-22，官方API同一页面出现了两种表述：

- 方法说明文字写“每位玩家最多300个订单”；
- `ERR_FULL`说明仍写“不能创建超过50个订单”。

这两处文字彼此不一致，因此本文不把50或300硬编码成业务判断。

更稳妥的做法是：

```js
const currentOrderCount = Object.keys(
  Game.market.orders
).length;
```

将数量写入诊断日志，并始终处理官方返回的`ERR_FULL`。上线前也应重新核对最新官方API或实际服务器行为。

## 订单创建后为什么可能不活跃

官方文档说明，订单会根据资源或Credits可用情况自动激活或停用。常见情况包括：

- 卖单对应资源不足；
- 买单可用Credits不足；
- Terminal条件不满足；
- 订单剩余量或当前可交易量为0。

`createOrder()`成功只表示订单建立请求已接受，不保证它当前可被其他玩家成交。

## 价格应该怎样决定

本文示例中的：

```js
price: 1
```

只是演示参数，不是Utrium推荐价格。

设置价格前至少需要自己检查：

- 当前市场订单；
- 历史价格；
- 订单方向；
- 房间与目标交易方距离；
- Terminal可用Energy；
- 资源库存；
- 预期成交速度；
- 可接受风险。

创建卖单和创建买单的资金、库存和后续维护逻辑也不同。本文不会给出固定价格或自动交易策略。

## 修改、扩量和取消也会影响费用

创建后不要通过重复`createOrder()`来“维护”同一个订单。

应使用对应API：

- `changeOrderPrice()`修改价格；
- `extendOrder()`增加总量；
- `cancelOrder()`取消订单。

官方文档说明：

- 提高订单价格时，需要为差价部分支付5%费用；
- 扩大订单总量时，需要为新增部分支付5%费用；
- 取消订单不会退回原先支付的5%费用。

因此，频繁取消并重建订单可能产生不必要的Credits损失。

## 离线模拟结果

构建检查把请求判断拆成纯函数，覆盖：

| 场景 | 结果 |
|---|---|
| `price`为0 | 参数无效 |
| 价格1、数量10000、Credits 499 | 费用500，Credits不足 |
| 已有同类型、同资源、同房间订单 | 判定重复 |
| 参数合法、Credits 1000、无重复 | 可以进入API调用阶段 |

离线模拟没有调用真实`Game.market.createOrder()`，也没有证明Terminal、资源、订单数量或市场环境符合要求。

## 常见误区

### 每tick调用一次创建订单

这是一次性操作，必须由明确请求或状态机触发。

### 把价格乘数量当成卖单创建成本

创建时支付的是5%挂单费用，不是把整笔资源价值预先支付出去。

### 返回`OK`就认为已经成交

订单只是被创建，成交由后续市场行为决定。

### 取消后重新创建不会有损失

原5%费用不会退回。

### 硬编码官方订单数量上限

当前官方API文字存在不一致，应处理`ERR_FULL`并重新核对当前环境。

### 自动重试所有错误

参数错误、订单已满或Terminal不满足时，每tick重试只会重复失败并污染日志。

## 适用边界

本文只演示创建一个普通Terminal资源订单，不覆盖：

- 自动定价；
- 盈利计算；
- `Game.market.deal()`；
- 传输Energy成本；
- 账号绑定资源；
- 多shard市场策略；
- 订单自动调价；
- 库存预测；
- 实际成交验证。

JavaScript语法、参数检查、费用和重复订单分支已经离线验证；真实创建结果和市场行为仍待Screeps环境验证。

## 相关站内内容

- [Game.market.deal()怎么成交现有订单](/blog/screeps-market-deal)
- [StructureTerminal.send()怎么跨房间发送资源](/blog/screeps-terminal-send-resources)
- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [Game.cpu.getUsed()和bucket怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [进入 Screeps 知识库](/knowledge)

## 官方资料

- [Market System](https://docs.screeps.com/market.html)
- [Game.market.createOrder API](https://docs.screeps.com/api/#Game.market.createOrder)
- [Game.market.orders API](https://docs.screeps.com/api/#Game.market.orders)
- [Game.market.cancelOrder API](https://docs.screeps.com/api/#Game.market.cancelOrder)

资料核对日期：2026-07-22。官方订单上限文字存在不一致，本文未硬编码上限；真实市场创建仍待环境验证。
