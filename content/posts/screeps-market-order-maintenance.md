---
title: "Screeps 市场订单怎么维护：changeOrderPrice()、extendOrder()、cancelOrder() 与费用验证"
description: "安全维护 Screeps 自己的市场订单：核对订单指纹，预估改价与扩量的 5% 费用，保护 Credits 保留线，执行一次性请求，并在下一 tick 验证价格、总量或取消结果。"
publishedAt: "2026-08-04"
updatedAt: "2026-08-04"
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
  checkedAt: "2026-08-04"
  testedAt: "2026-08-04"
  testEnvironment: "Node.js 离线模拟（费用、订单指纹、Credits 保留线与下一 tick 验证分类；不是 Screeps 官方服务器）"
  testResult: "12 个边界场景通过；完整示例通过 JavaScript 语法检查。真实市场成交竞争、官方 shard 结算和 Console 操作仍待验证。"
featured: false
---

订单创建成功之后，并不代表它会一直保持合适的价格、数量或状态。

常见问题包括：

- 为了改价而重复调用 `createOrder()`，结果产生多个同类订单；
- 提高价格时没有计算追加的 5% 费用；
- 扩大订单数量时只看 Credits 是否大于 0，没有保护保留线；
- 取消订单时没有再次核对订单 ID；
- 主循环每 tick 重复提交同一个维护动作；
- `OK` 后立即读取旧对象并误判操作没有生效；
- 扩量后只检查 `remainingAmount`，却忽略它可能同时被真实成交改变。

本文只解决一个问题：**怎样针对 `Game.market.orders` 中一笔明确的己方订单，安全执行改价、扩量或取消，并记录费用、返回值与下一 tick 的有限验证结果。**

## 这不是创建订单或直接成交文章

市场常见操作分别是：

| 目标 | API |
|---|---|
| 创建自己的订单 | `Game.market.createOrder()` |
| 对其他订单直接成交 | `Game.market.deal()` |
| 修改自己订单的价格 | `Game.market.changeOrderPrice()` |
| 增加自己订单的总容量 | `Game.market.extendOrder()` |
| 取消自己已有的订单 | `Game.market.cancelOrder()` |

已有文章分别处理了[创建市场订单](/blog/screeps-market-create-order)与[直接成交](/blog/screeps-market-deal)。本文只处理创建之后的维护生命周期，不重新解释完整创建流程或交易距离成本。

## 先看清 `Game.market.orders`

`Game.market.orders` 包含自己的活跃和非活跃买单、卖单。订单对象常见字段包括：

```js
const order = Game.market.orders[orderId];

console.log({
  id: order.id,
  active: order.active,
  type: order.type,
  resourceType: order.resourceType,
  roomName: order.roomName,
  amount: order.amount,
  remainingAmount: order.remainingAmount,
  totalAmount: order.totalAmount,
  price: order.price
});
```

这些字段不要混为一谈：

| 字段 | 本文用途 |
|---|---|
| `active` | 当前订单是否处于可成交状态 |
| `amount` | 当前可成交数量，可能受资源或 Credits 状态影响 |
| `remainingAmount` | 订单尚未成交的总剩余容量 |
| `totalAmount` | 订单建立并扩量后的总容量 |
| `price` | 当前单价 |

维护前必须从 `Game.market.orders[orderId]` 重新读取订单，不要把几天前复制到 Memory 的完整订单对象继续当成实时状态。

## 三种操作的费用差异

### 提高价格

官方规则是：

```text
(newPrice - oldPrice) × remainingAmount × 0.05
```

只在新价格高于旧价格时产生追加费用。

例如：

```text
旧价格：1
新价格：1.5
remainingAmount：8000

费用：
(1.5 - 1) × 8000 × 0.05 = 200 Credits
```

### 降低价格

降低价格不会产生上述追加费用：

```js
const fee = Math.max(
  0,
  newPrice - order.price
) * order.remainingAmount * 0.05;
```

这不表示原先创建订单时支付的费用会退回。

### 扩大订单容量

`extendOrder()` 的费用是：

```text
当前价格 × addAmount × 0.05
```

例如：

```text
当前价格：1
新增数量：5000

费用：
1 × 5000 × 0.05 = 250 Credits
```

### 取消订单

取消不会退回原先支付的 5% 创建费用。

因此不要把“取消旧订单再重新创建”当成无成本的普通改价方法。

## 为什么需要订单指纹

只保存 `orderId` 仍然可能误操作。

例如：

- Console 中复制了错误 ID；
- 一段旧 Memory 指向已经被取消的订单；
- 另一套代码替换了订单；
- 你原本想维护 Utrium 卖单，却粘贴了 Energy 买单 ID；
- 订单价格或总量已被其他代码修改，当前请求已经过时。

本文要求请求同时保存订单指纹：

```js
expected: {
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  roomName: 'W1N1',
  price: 1,
  totalAmount: 10000
}
```

执行前会重新比较：

- 类型；
- 资源；
- 房间；
- 可选的当前价格；
- 可选的当前总量。

任何一项不匹配，请求都会停止，而不是“尽量执行”。

## 为什么需要 Credits 保留线

只检查：

```js
Game.market.credits >= estimatedFee
```

只能证明当前 Credits 足以支付费用，不能证明支付后仍符合你的经济安全要求。

更稳妥的判断是：

```js
Game.market.credits - estimatedFee
  >= request.reserveCredits
```

例如你要求至少保留 500,000 Credits，那么请求必须把：

```js
reserveCredits: 500000
```

写进同一份操作请求。

这只是本文章采用的安全策略，不是 Screeps 官方强制规则。

## 三种一次性请求示例

先准备 Memory：

```js
Memory.market ??= {};
Memory.market.orderMaintenance ??= {
  request: null,
  pending: null,
  history: []
};
```

### 改价请求

```js
Memory.market.orderMaintenance.request = {
  enabled: true,
  requestId: 'U-sell-reprice-20260804',
  action: 'change-price',
  orderId: 'YOUR_ORDER_ID',
  expected: {
    type: ORDER_SELL,
    resourceType: RESOURCE_UTRIUM,
    roomName: 'W1N1',
    price: 1,
    totalAmount: 10000
  },
  newPrice: 0.95,
  reserveCredits: 500000
};
```

### 扩量请求

```js
Memory.market.orderMaintenance.request = {
  enabled: true,
  requestId: 'U-sell-extend-20260804',
  action: 'extend-order',
  orderId: 'YOUR_ORDER_ID',
  expected: {
    type: ORDER_SELL,
    resourceType: RESOURCE_UTRIUM,
    roomName: 'W1N1',
    price: 0.95,
    totalAmount: 10000
  },
  addAmount: 5000,
  reserveCredits: 500000
};
```

### 取消请求

取消是不可逆的维护动作，因此额外要求：

```js
confirmCancel: true
```

完整请求：

```js
Memory.market.orderMaintenance.request = {
  enabled: true,
  requestId: 'U-sell-cancel-20260804',
  action: 'cancel-order',
  orderId: 'YOUR_ORDER_ID',
  expected: {
    type: ORDER_SELL,
    resourceType: RESOURCE_UTRIUM,
    roomName: 'W1N1',
    price: 0.95,
    totalAmount: 15000
  },
  confirmCancel: true,
  reserveCredits: 500000
};
```

如果缺少明确确认，代码会返回：

```text
cancel-not-confirmed
```

## 完整示例

```js
const MARKET_ACTIONS = new Set([
  'change-price',
  'extend-order',
  'cancel-order'
]);

const NUMBER_EPSILON = 1e-9;

function sameNumber(left, right) {
  return (
    Number.isFinite(left)
    && Number.isFinite(right)
    && Math.abs(left - right) <= NUMBER_EPSILON
  );
}

function getMarketMaintenanceMemory() {
  Memory.market ??= {};
  Memory.market.orderMaintenance ??= {
    request: null,
    pending: null,
    history: []
  };

  return Memory.market.orderMaintenance;
}

function copyOrderSnapshot(order) {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    active: order.active,
    type: order.type,
    resourceType: order.resourceType,
    roomName: order.roomName ?? null,
    amount: order.amount,
    remainingAmount: order.remainingAmount,
    totalAmount: order.totalAmount,
    price: order.price
  };
}

function calculatePriceChangeFee(order, newPrice) {
  const priceIncrease = Math.max(
    0,
    newPrice - order.price
  );

  return (
    priceIncrease
    * order.remainingAmount
    * 0.05
  );
}

function calculateExtendOrderFee(order, addAmount) {
  return order.price * addAmount * 0.05;
}

function validateRequest(request) {
  if (!request || request.enabled !== true) {
    return {
      ok: false,
      reason: 'request-disabled'
    };
  }

  if (
    typeof request.requestId !== 'string'
    || request.requestId.length === 0
  ) {
    return {
      ok: false,
      reason: 'invalid-request-id'
    };
  }

  if (!MARKET_ACTIONS.has(request.action)) {
    return {
      ok: false,
      reason: 'invalid-action'
    };
  }

  if (
    typeof request.orderId !== 'string'
    || request.orderId.length === 0
  ) {
    return {
      ok: false,
      reason: 'invalid-order-id'
    };
  }

  if (
    !request.expected
    || typeof request.expected !== 'object'
    || typeof request.expected.type !== 'string'
    || typeof request.expected.resourceType !== 'string'
    || typeof request.expected.roomName !== 'string'
  ) {
    return {
      ok: false,
      reason: 'invalid-order-fingerprint'
    };
  }

  if (
    !Number.isFinite(request.reserveCredits)
    || request.reserveCredits < 0
  ) {
    return {
      ok: false,
      reason: 'invalid-credit-reserve'
    };
  }

  if (request.action === 'change-price') {
    if (
      !Number.isFinite(request.newPrice)
      || request.newPrice <= 0
    ) {
      return {
        ok: false,
        reason: 'invalid-new-price'
      };
    }
  }

  if (request.action === 'extend-order') {
    if (
      !Number.isInteger(request.addAmount)
      || request.addAmount <= 0
    ) {
      return {
        ok: false,
        reason: 'invalid-add-amount'
      };
    }
  }

  if (
    request.action === 'cancel-order'
    && request.confirmCancel !== true
  ) {
    return {
      ok: false,
      reason: 'cancel-not-confirmed'
    };
  }

  return {
    ok: true,
    reason: null
  };
}

function matchesExpectedOrder(order, expected) {
  if (
    order.type !== expected.type
    || order.resourceType !== expected.resourceType
    || (order.roomName ?? null) !== expected.roomName
  ) {
    return false;
  }

  if (
    Number.isFinite(expected.price)
    && !sameNumber(order.price, expected.price)
  ) {
    return false;
  }

  if (
    Number.isInteger(expected.totalAmount)
    && order.totalAmount !== expected.totalAmount
  ) {
    return false;
  }

  return true;
}

function finishRequest(request, status, detail = {}) {
  request.enabled = false;
  request.status = status;
  request.finishedAt = Game.time;
  Object.assign(request, detail);
}

function verifyPendingMarketMaintenance() {
  const memory = getMarketMaintenanceMemory();
  const pending = memory.pending;

  if (!pending || pending.tick >= Game.time) {
    return null;
  }

  const order =
    Game.market.orders[pending.orderId] || null;
  const after = copyOrderSnapshot(order);

  let status = 'change-not-observed';

  if (pending.action === 'change-price') {
    if (
      order
      && sameNumber(
        order.price,
        pending.newPrice
      )
    ) {
      status = 'price-observed';
    } else if (!order) {
      status = 'order-unavailable';
    }
  }

  if (pending.action === 'extend-order') {
    const expectedTotalAmount =
      pending.before.totalAmount
      + pending.addAmount;

    if (
      order
      && order.totalAmount >= expectedTotalAmount
    ) {
      status = 'total-amount-increase-observed';
    } else if (!order) {
      status = 'order-unavailable';
    }
  }

  if (pending.action === 'cancel-order') {
    status = order
      ? 'cancel-not-observed'
      : 'order-absent-observed';
  }

  if (
    status === 'change-not-observed'
    && Game.time > pending.tick + 1
  ) {
    status = 'late-observation';
  }

  const record = {
    verifiedAt: Game.time,
    ...pending,
    after,
    status,
    priceDelta: after
      ? after.price - pending.before.price
      : null,
    remainingAmountDelta: after
      ? after.remainingAmount
        - pending.before.remainingAmount
      : null,
    totalAmountDelta: after
      ? after.totalAmount
        - pending.before.totalAmount
      : null
  };

  memory.history.push(record);
  memory.history = memory.history.slice(-20);
  memory.pending = null;

  return record;
}

function processMarketOrderMaintenance() {
  const memory = getMarketMaintenanceMemory();
  const verification =
    verifyPendingMarketMaintenance();
  const request = memory.request;

  if (!request || request.enabled !== true) {
    return {
      status: 'no-enabled-request',
      verification
    };
  }

  const validation = validateRequest(request);

  request.attemptedAt = Game.time;

  if (!validation.ok) {
    finishRequest(
      request,
      validation.reason
    );

    return {
      status: validation.reason,
      verification
    };
  }

  const order =
    Game.market.orders[request.orderId];

  if (!order) {
    finishRequest(
      request,
      'owned-order-not-found'
    );

    return {
      status: 'owned-order-not-found',
      verification
    };
  }

  if (
    !matchesExpectedOrder(
      order,
      request.expected
    )
  ) {
    finishRequest(
      request,
      'order-fingerprint-mismatch',
      {
        observedOrder:
          copyOrderSnapshot(order)
      }
    );

    return {
      status: 'order-fingerprint-mismatch',
      verification
    };
  }

  let estimatedFee = 0;

  if (request.action === 'change-price') {
    if (sameNumber(order.price, request.newPrice)) {
      finishRequest(
        request,
        'price-already-matches',
        {
          observedOrder:
            copyOrderSnapshot(order)
        }
      );

      return {
        status: 'price-already-matches',
        verification
      };
    }

    estimatedFee =
      calculatePriceChangeFee(
        order,
        request.newPrice
      );
  }

  if (request.action === 'extend-order') {
    estimatedFee =
      calculateExtendOrderFee(
        order,
        request.addAmount
      );
  }

  if (
    Game.market.credits - estimatedFee
      < request.reserveCredits
  ) {
    finishRequest(
      request,
      'credit-reserve-would-be-crossed',
      {
        estimatedFee,
        creditsAtAttempt:
          Game.market.credits
      }
    );

    return {
      status:
        'credit-reserve-would-be-crossed',
      estimatedFee,
      verification
    };
  }

  const before = copyOrderSnapshot(order);

  request.enabled = false;
  request.estimatedFee = estimatedFee;
  request.creditsAtAttempt =
    Game.market.credits;
  request.before = before;

  let result = ERR_INVALID_ARGS;

  if (request.action === 'change-price') {
    result = Game.market.changeOrderPrice(
      request.orderId,
      request.newPrice
    );
  }

  if (request.action === 'extend-order') {
    result = Game.market.extendOrder(
      request.orderId,
      request.addAmount
    );
  }

  if (request.action === 'cancel-order') {
    result = Game.market.cancelOrder(
      request.orderId
    );
  }

  request.result = result;
  request.finishedAt = Game.time;
  request.status = result === OK
    ? 'request-accepted'
    : 'api-rejected';

  if (result === OK) {
    memory.pending = {
      tick: Game.time,
      requestId: request.requestId,
      action: request.action,
      orderId: request.orderId,
      before,
      estimatedFee,
      newPrice:
        request.action === 'change-price'
          ? request.newPrice
          : null,
      addAmount:
        request.action === 'extend-order'
          ? request.addAmount
          : null
    };
  }

  return {
    status: request.status,
    action: request.action,
    orderId: request.orderId,
    result,
    estimatedFee,
    before,
    verification
  };
}

module.exports.loop = function () {
  const outcome =
    processMarketOrderMaintenance();

  if (
    outcome.status !== 'no-enabled-request'
    || outcome.verification
  ) {
    console.log(JSON.stringify({
      type: 'market-order-maintenance',
      tick: Game.time,
      ...outcome
    }));
  }
};
```

这份示例有几个刻意设计的限制：

1. 同一时间只维护一笔订单；
2. 请求必须人工或其他策略明确开启；
3. API 调用前先把 `enabled` 关闭；
4. 必须匹配订单指纹；
5. 涨价或扩量不能突破 Credits 保留线；
6. 取消必须显式确认；
7. `OK` 后保存前值，下一 tick 再观察；
8. 历史记录只保留最近 20 条。

## 为什么调用前先关闭请求

示例在真正调用 API 前执行：

```js
request.enabled = false;
```

这样即使后续日志、序列化或其他代码抛出异常，下一 tick 也不会自动再次提交同一操作。

API 返回错误时，请检查：

- `request.result`；
- `request.status`；
- `request.before`；
- `request.estimatedFee`；
- `request.creditsAtAttempt`；
- 当前 `Game.market.orders`；
- 官方返回值说明。

确认原因后，再创建新的 `requestId` 和请求，不要简单把旧请求无限重开。

## 下一 tick 怎样验证

### 改价

下一 tick 重新读取：

```js
Game.market.orders[orderId].price
```

如果等于请求的新价格，记录：

```text
price-observed
```

### 扩量

`extendOrder()` 会影响 `remainingAmount` 和 `totalAmount`。

但是在多人市场中，订单也可能在两个 tick 之间发生真实成交，导致 `remainingAmount` 同时下降。因此示例优先检查：

```js
order.totalAmount
  >= before.totalAmount + addAmount
```

而不是要求：

```js
remainingAmountDelta === addAmount
```

记录中仍保存 `remainingAmountDelta`，但它不是唯一成功条件。

### 取消

下一 tick 如果：

```js
Game.market.orders[orderId] === undefined
```

则记录：

```text
order-absent-observed
```

订单消失与取消结果一致，但在复杂系统中仍应结合自己的请求 ID 和同期日志解释，不要把单一观察夸大为绝对因果证明。

## 返回值怎么处理

### `changeOrderPrice()`

| 返回值 | 排查方向 |
|---|---|
| `OK` | 请求已安排，下一 tick 检查价格 |
| `ERR_NOT_OWNER` | 检查订单房间、Terminal 或所有权条件 |
| `ERR_NOT_ENOUGH_RESOURCES` | Credits 不足以支付涨价费用 |
| `ERR_INVALID_ARGS` | 检查订单 ID 与新价格 |

### `extendOrder()`

| 返回值 | 排查方向 |
|---|---|
| `OK` | 请求已安排，下一 tick 检查 `totalAmount` |
| `ERR_NOT_ENOUGH_RESOURCES` | Credits 不足以支付新增容量费用 |
| `ERR_INVALID_ARGS` | 检查订单 ID 和 `addAmount` |

### `cancelOrder()`

| 返回值 | 排查方向 |
|---|---|
| `OK` | 请求已安排，下一 tick 检查订单是否消失 |
| `ERR_INVALID_ARGS` | 订单 ID 无效或订单已不存在 |

这些市场方法不需要 Creep 距离，因此不会返回 `ERR_NOT_IN_RANGE`。

## 常见错误

### 为了改价而重复创建订单

修改现有订单应使用：

```js
Game.market.changeOrderPrice()
```

不要为同一个策略重复创建多个订单，除非你的市场策略明确需要价格分层。

### 涨价费用错误地使用 `totalAmount`

官方涨价费用基于当前 `remainingAmount`，不是最初的 `totalAmount`。

已经成交的部分不应再次进入涨价费用估算。

### 扩量时使用目标新价格计算费用

同一个 tick 中不要假设“先改价，再扩量”可以在本地按预想顺序组合。

本文一次只执行一个维护动作。先观察改价后的真实订单，再创建下一笔扩量请求。

### 取消没有二次确认

订单 ID 是不可读的长字符串，很容易粘贴错误。取消操作应同时核对订单指纹并要求 `confirmCancel: true`。

### 把 `active: false` 当成订单不存在

非活跃订单仍然可能存在于 `Game.market.orders`。

它可能因为资源、Credits 或 Terminal 条件暂时无法成交。维护逻辑应区分：

```text
订单存在但 inactive
订单已经不存在
```

### `OK` 后立即读取旧对象

市场命令和其他 Screeps 指令一样，是在当前 tick 提交并由游戏稍后处理。不要把同一执行段中读取到的旧状态当成最终结算。

### 扩量只验证 `remainingAmount`

真实成交可能同时改变 `remainingAmount`。`totalAmount` 更适合观察扩量是否进入订单定义，但仍要保存完整前后快照。

### 多套市场代码同时维护同一订单

本文只能阻止这一份 Memory 请求重复执行，无法阻止仓库中另一套脚本同时调用市场 API。

生产代码应给每个市场订单建立唯一的维护责任人或协调器。

## 离线验证覆盖

本文章的纯逻辑测试覆盖：

1. 降价追加费用为 0；
2. 相同价格不产生费用；
3. 涨价费用使用 `remainingAmount`；
4. 扩量费用使用当前价格与新增量；
5. 完整订单指纹匹配；
6. 错误订单类型被拒绝；
7. 下一 tick 观察到价格变化；
8. 下一 tick 观察到总量增加；
9. 即使 `remainingAmount` 被成交影响，仍可通过 `totalAmount` 识别扩量；
10. 取消后订单消失；
11. 取消未生效时保持未观察状态；
12. 延迟运行时标记为 `late-observation`。

完整示例已通过 JavaScript 语法检查。

离线测试不能证明：

- 真实官方 shard 的市场结算；
- 两个玩家成交与扩量在相邻 tick 的所有组合；
- 多套脚本同时维护订单时的最终结果；
- 市场价格是否合理；
- 订单一定会成交；
- 该策略具有最高利润或最低风险；
- Console 中粘贴的真实订单 ID 一定正确。

这些项目在没有真实 Console 与 shard 记录前保持待验证。

## 适用边界

本文不覆盖：

- 怎样选择市场价格；
- 自动做市；
- 历史价格预测；
- 直接成交的距离与 Energy 成本；
- 创建新订单；
- 账号绑定资源订单的特殊规则；
- 多订单组合策略；
- 跨 shard 市场策略。

## 相关站内内容

- [Game.market.createOrder() 怎么安全创建并避免重复订单](/blog/screeps-market-create-order)
- [Game.market.deal() 怎么安全成交并计算 Energy 成本](/blog/screeps-market-deal)
- [StructureTerminal.send() 怎么发送资源并检查冷却](/blog/screeps-terminal-send-resources)
- [Screeps Storage 的 Energy 应该怎么分配](/blog/screeps-storage-energy-usage)
- [Game.notify() 怎么避免重复通知](/blog/screeps-game-notify)
- [进入市场与高级资源专题](/knowledge/market-advanced-resources)

## 官方资料

- [Game.market API：orders、changeOrderPrice、extendOrder、cancelOrder](https://docs.screeps.com/api/#Game.market)
- [Screeps Market System](https://docs.screeps.com/market.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-08-04。官方文档、完整示例语法和 12 个离线场景已核对；真实 Console 与官方 shard 行为仍待验证。
