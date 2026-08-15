---
title: "Game.market.createOrder() 怎么安全创建并确认新订单 ID"
description: "用一次性 Memory 请求创建 Screeps 市场订单：检查普通资源订单的 Terminal 所有权和 5% 费用，提交前保存旧订单 ID，并在下一 tick 精确确认唯一的新订单，避免重复创建和误归因。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-15"
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
  checkedAt: "2026-08-15"
  testedAt: "2026-08-15"
  testEnvironment: "Node.js 离线模拟（创建前置、费用、订单 ID 归因与失败状态，不是 Screeps 官方服务器）"
  testResult: "普通资源 Terminal 所有权、5% 费用、无 active/cooldown/库存创建前置、旧 ID 差集、下一 tick 唯一/缺失/歧义订单归因场景通过。"
featured: false
---

`Game.market.createOrder()` 是一次性账号级市场操作。它会把一个创建请求安排给游戏结算，但返回 `OK` 时**不会直接返回新订单 ID**。

这会产生一个比“参数有没有写对”更重要的问题：

> 下一 tick 在 `Game.market.orders` 里看到一笔相似订单时，怎样证明它就是刚才这一次请求创建的，而不是旧订单、另一个模块或 Console 命令创建的？

本文只处理这条创建链：

```text
冻结一次请求
→ 检查普通资源订单的 Terminal 所有权
→ 计算并保留 5% 创建费用
→ 保存提交前订单 ID 集合
→ createOrder() 只调用一次
→ OK 后进入待验证状态
→ 下一 tick 查找唯一精确的新订单
→ 保存真实 orderId
```

本文不会给出 Utrium、Energy 或其他资源的推荐价格，也不会把离线模拟写成真实 Screeps 市场成交结果。

## 快速结论

先记住六个边界：

1. 普通资源订单需要绑定一个存在己方 Terminal 的 `roomName`。
2. 当前官方 engine 的 `createOrder()` 创建前置检查**不要求**该 Terminal `cooldown === 0`，也不检查当前库存是否足以让订单成交。
3. 创建订单收取 `price × totalAmount × 0.05` Credits 费用。
4. `OK` 只表示创建操作已经被安排，不等于已经拿到新订单 ID。
5. 订单创建和订单 `active` 是两件事；官方文档明确允许先创建，再根据资源或 Credits 可用量自动激活/停用。
6. `OK` 后不要自动再次调用；下一 tick 先用旧 ID 差集和订单身份确认唯一的新订单。

## 创建订单、激活订单和成交是三层状态

最容易写错的是把三个阶段混在一起：

| 阶段 | 主要对象/API | 能证明什么 |
|---|---|---|
| 创建请求 | `Game.market.createOrder()` | 这次创建调用是否被 API 接受 |
| 订单状态 | `Game.market.orders[orderId]` | 订单对象是否存在、是否 active、当前 amount 等 |
| 实际成交 | Market transaction / `deal()` 结果 | 真实资源与 Credits 是否发生交易 |

因此：

```js
const result = Game.market.createOrder(params);
```

即使：

```js
result === OK
```

也不能推出：

```text
新订单 ID 已知
订单当前 active
订单已经成交
资源已经离开 Terminal
这笔订单一定有利润
```

## 官方参数：本文只处理普通 Terminal 资源

基础调用形式：

```js
Game.market.createOrder({
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  price: 1,
  totalAmount: 10000,
  roomName: 'W1N1'
});
```

本文检查：

| 字段 | 含义 | 本文约束 |
|---|---|---|
| `type` | `ORDER_BUY` / `ORDER_SELL` | 只允许这两类 |
| `resourceType` | 资源类型 | 必须是非空字符串，最终仍由 API 校验官方资源常量 |
| `price` | 每单位 Credits 价格 | 大于 0 的有限数值 |
| `totalAmount` | 订单总量 | 大于 0 的整数 |
| `roomName` | 普通资源订单绑定的 Terminal 房间 | 必须指向己方 Terminal |

Screeps 还有账号绑定的 intershard resources，它们的 `roomName` 规则不同。本文故意不把两类订单塞进同一个示例。

## Terminal 所有权是前置，但 cooldown 和库存不是创建前置

当前官方 Screeps engine 的 `createOrder()` 实现对普通资源会检查：

```text
roomName 是否存在
该房间是否有玩家自己的 Terminal
```

不满足时返回 `ERR_NOT_OWNER`。

但同一段创建 API 实现**没有**在接受创建请求前检查：

```text
terminal.cooldown
terminal.isActive()
Terminal 当前资源库存
本次未来成交所需的传输 Energy
```

这些条件不能机械地从 `Terminal.send()` 或 `Game.market.deal()` 搬到 `createOrder()`。

例如，下面这种前置会把“当前不能成交”和“不能创建订单”混为一谈：

```js
if (terminal.cooldown > 0) {
  return 'cannot-create-order';
}
```

对于 `createOrder()`，这不是当前 engine 的创建拒绝条件。

同样，不应该因为卖单当前库存为 0 就直接拒绝创建：官方 Market 文档说明订单可以先创建，并根据资源或 Credits 可用情况自动激活或停用。

### `Game.rooms` 判定只是本地预检查

为了在调用前给出更清楚的错误，可以检查：

```js
function inspectOwnedTerminal(roomName) {
  const room = Game.rooms[roomName];
  const terminal = room?.terminal ?? null;

  if (!terminal || terminal.my !== true) {
    return {
      ready: false,
      status: 'owned-terminal-not-observed'
    };
  }

  return {
    ready: true,
    status: 'owned-terminal-observed',
    terminalId: terminal.id
  };
}
```

这只是本站的诊断层。真正决定 API 返回值的仍是 Screeps 当前运行环境，而不是这段本地函数。

## 先计算 5% 创建费用，并给 Credits 留保留线

官方公式：

```text
price × totalAmount × 0.05
```

例如：

```text
price = 1
totalAmount = 10000
fee = 500 Credits
```

基础函数：

```js
function calculateCreateOrderFee(price, totalAmount) {
  return price * totalAmount * 0.05;
}
```

当前官方 engine 内部以千分之一 Credit 精度保存金额，并在处理创建 intent 时向上取整费用。若要让本地预算更贴近当前 engine，可以保守计算：

```js
function calculateCreateOrderFeeCeiling(
  price,
  totalAmount
) {
  const raw = price * totalAmount * 0.05;
  return Math.ceil(raw * 1000) / 1000;
}
```

这是基于当前 engine 实现的工程保护，不是官方 API 页面单独承诺的长期舍入接口。未来 engine 改动后应重新核对。

不要只判断：

```js
Game.market.credits >= fee
```

生产代码通常还应该给其他市场操作保留 Credits：

```js
function hasCreateFeeBudget(fee, creditReserve) {
  return Game.market.credits - fee >= creditReserve;
}
```

`creditReserve` 是玩家策略，不是官方固定值。

## 冻结一次明确请求

不要让多个模块直接散落调用：

```js
// 不要在多个模块里直接散落 createOrder() 调用。
```

先建立一笔可审阅请求：

```js
Memory.market ??= {};
Memory.market.createOrderRequest = {
  requestId: 'sell-U-001',
  revision: 1,
  enabled: true,
  type: ORDER_SELL,
  resourceType: RESOURCE_UTRIUM,
  price: 1,
  totalAmount: 10000,
  roomName: 'W1N1',
  creditReserve: 1000000
};
```

示例数字只是演示，不是市场建议。

`requestId + revision` 的作用是区分“同一个业务请求的第几版”。如果人工修改了价格、数量、房间或资源，应增加 `revision`，不要继续把旧确认状态套在新参数上。

## 先阻止已有同类订单重复创建

本文的基础唯一性策略是：

```text
type 相同
resourceType 相同
roomName 相同
```

```js
function findDuplicateOrder(request) {
  return Object.values(Game.market.orders).find(
    order =>
      order.type === request.type
      && order.resourceType === request.resourceType
      && order.roomName === request.roomName
  ) || null;
}
```

这是一种本站安全策略，不是 Screeps 强制规则。

如果你的交易策略确实需要同房间、同资源、同方向的多档价格，应该增加：

```text
strategyId
price tier
purpose
requestId
```

来定义自己的唯一性，而不是简单删掉去重。

## 为什么提交前必须保存旧订单 ID

`createOrder()` 不返回新订单 ID，所以最可靠的归因入口是：**提交前先保存 `Game.market.orders` 的 ID 集合。**

```js
const orderIdsBefore = Object.keys(
  Game.market.orders
);
```

然后再调用一次：

```js
const result = Game.market.createOrder({
  type: request.type,
  resourceType: request.resourceType,
  roomName: request.roomName,
  price: request.price,
  totalAmount: request.totalAmount
});
```

如果先调用再保存旧集合，就失去了“哪些 ID 是调用前已经存在”的证据。

## 提交一次，并把身份快照写入 pending

下面的提交函数把三个关键动作放在一起：

```text
先关闭 enabled
保存旧订单 IDs
保存本次不可变身份
只调用一次 createOrder
```

```js
function submitCreateOrder(request) {
  if (!request || request.enabled !== true) {
    return {
      status: 'request-disabled',
      result: null
    };
  }

  const duplicate = findDuplicateOrder(request);

  if (duplicate) {
    request.enabled = false;
    request.status = 'duplicate-order';
    request.duplicateOrderId = duplicate.id;

    return {
      status: request.status,
      result: null
    };
  }

  const fee = calculateCreateOrderFeeCeiling(
    request.price,
    request.totalAmount
  );

  if (
    Game.market.credits - fee
      < request.creditReserve
  ) {
    request.enabled = false;
    request.status = 'credit-reserve';
    request.estimatedFee = fee;

    return {
      status: request.status,
      result: null
    };
  }

  const orderIdsBefore = Object.keys(
    Game.market.orders
  );

  request.enabled = false;
  request.lastAttemptAt = Game.time;
  request.estimatedFee = fee;

  const pending = {
    requestId: request.requestId,
    revision: request.revision,
    submittedAt: Game.time,
    type: request.type,
    resourceType: request.resourceType,
    roomName: request.roomName,
    price: request.price,
    totalAmount: request.totalAmount,
    orderIdsBefore
  };

  const result = Game.market.createOrder({
    type: pending.type,
    resourceType: pending.resourceType,
    roomName: pending.roomName,
    price: pending.price,
    totalAmount: pending.totalAmount
  });

  request.lastResult = result;
  request.status = result === OK
    ? 'accepted-pending-order-id'
    : 'creation-rejected';

  if (result === OK) {
    Memory.market.pendingCreateOrder = pending;
  }

  return {
    status: request.status,
    result
  };
}
```

这里故意在 API 调用前执行：

```js
request.enabled = false;
```

即使代码后面报错或 API 返回错误，下一 tick 也不会无条件再次下单。**失败后必须人工**检查本次参数、Credits、Terminal、已有订单和返回值，再决定是否创建新的请求 revision。

## `OK` 后为什么还必须等下一 tick

官方 API 对 `OK` 的描述是：操作已经成功安排。

Screeps 的游戏命令并不是在当前 JavaScript 语句执行时立刻完成最终状态结算。当前官方 engine 也是先把 `createOrder` 放进 global intent，然后在 tick 处理阶段扣费并插入订单。

因此本 tick：

```js
result === OK
```

只应该写成：

```text
accepted-pending-order-id
```

而不是：

```text
order-created-and-verified
```

## 下一 tick 精确确认唯一新订单

当前官方 engine 为普通市场订单保存 `created` tick。下一 tick 可以同时使用：

- 提交前不存在的 ID；
- `type`；
- `resourceType`；
- `roomName`；
- `price`；
- `totalAmount`；
- `created === submittedAt`。

```js
function verifyCreatedOrder(pending) {
  if (!pending) {
    return {
      status: 'no-pending-creation'
    };
  }

  if (Game.time < pending.submittedAt + 1) {
    return {
      status: 'waiting-for-next-tick'
    };
  }

  if (Game.time > pending.submittedAt + 1) {
    return {
      status: 'verification-window-missed'
    };
  }

  const before = new Set(
    pending.orderIdsBefore
  );

  const candidates = Object.values(
    Game.market.orders
  ).filter(order =>
    !before.has(order.id)
    && order.type === pending.type
    && order.resourceType === pending.resourceType
    && order.roomName === pending.roomName
    && Math.abs(order.price - pending.price) < 0.0005
    && order.totalAmount === pending.totalAmount
    && order.created === pending.submittedAt
  );

  if (candidates.length === 0) {
    return {
      status: 'accepted-order-not-observed'
    };
  }

  if (candidates.length > 1) {
    return {
      status: 'new-order-identity-ambiguous',
      candidateIds: candidates.map(
        order => order.id
      )
    };
  }

  const order = candidates[0];

  return {
    status: 'created-order-observed',
    orderId: order.id,
    active: order.active,
    amount: order.amount,
    remainingAmount: order.remainingAmount
  };
}
```

这里的价格容差用于适配公开订单价格的千分之一 Credit 表示，不应该被扩大成“价格差不多就算同一订单”。

## 为什么验证窗口只取下一 tick

如果允许在 10、50、100 tick 后继续用“同类型、同资源、同房间”匹配，新的相似订单可能来自：

- 另一个模块；
- 人工 Console；
- 另一次已经确认的请求；
- 后续自动化策略。

时间越长，归因越弱。

因此本文采用有界状态：

| 状态 | 含义 | 自动处理 |
|---|---|---|
| `accepted-pending-order-id` | API 返回 OK，尚未证明新 ID | 等下一 tick |
| `created-order-observed` | 唯一精确新订单已确认 | 保存 ID |
| `accepted-order-not-observed` | 下一 tick 没找到精确新订单 | 人工复核，不自动重提 |
| `new-order-identity-ambiguous` | 出现多个精确候选 | 人工复核，不随便挑一个 |
| `verification-window-missed` | 错过下一 tick 归因窗口 | 保留未知状态，不猜 |

“没有观察到”不等于“可以安全再创建一次”。

## 同一 tick 为什么最好只允许一个可归因创建请求

当前 engine 可以在订单上限允许时接受同 tick 的多次创建调用。

但如果你的多个模块同时创建：

```text
sell-U-001
sell-U-002
sell-U-003
```

它们可能共享同一组 `orderIdsBefore`。下一 tick 若出现多个相似新订单，归因会变得困难。

因此生产代码可以使用一个账号级协调器，本站建议**每 tick 只给一个需要精确归因的 createOrder 请求创建槽位**。

这是可观测性策略，不是 Screeps API 的官方“每 tick 只能创建一单”限制。

最小实现：

```js
function createMarketOrderCoordinator() {
  let reserved = false;

  return {
    reserve() {
      if (reserved) {
        return false;
      }

      reserved = true;
      return true;
    }
  };
}
```

如果还有 `changeOrderPrice()`、`extendOrder()` 等会消耗 Credits 的市场操作，实际系统还应把费用预算放进同一个账号级保留账本。

## 创建成功不等于订单已经 active

官方 Market 文档说明，订单可以在任何时候以任意数量创建，并根据资源或 Credits 可用情况自动激活或停用。

当前官方 engine 的 global intent 处理也会先插入：

```text
active: false
amount: 0
remainingAmount: totalAmount
```

之后再由市场状态决定可执行数量和激活状态。

所以新订单 ID 已经确认后，仍应单独查看：

```js
const order = Game.market.orders[orderId];

console.log({
  id: order?.id ?? null,
  active: order?.active ?? null,
  amount: order?.amount ?? null,
  remainingAmount:
    order?.remainingAmount ?? null
});
```

尤其不要把下面这些写成 `createOrder()` 的前置拒绝条件：

```text
卖单当前库存不足
买单当前 Credits 不足以覆盖未来全部成交
Terminal 当前 cooldown 大于 0
```

创建费用不足会直接影响创建；而订单后续能否 active / 被成交是另一层状态。

## 返回值应该怎样处理

当前官方 API 列出：

| 返回值 | 含义 | 本文处理 |
|---|---|---|
| `OK` | 创建操作已安排 | 保存 pending，下一 tick 验证 ID |
| `ERR_NOT_OWNER` | 不是该房间 Terminal 所有者或没有 Terminal | 检查普通资源订单 `roomName` |
| `ERR_NOT_ENOUGH_RESOURCES` | Credits 不足以支付费用 | 重算创建费用和保留线 |
| `ERR_FULL` | 订单数量达到限制 | 停止自动重试，检查当前规则 |
| `ERR_INVALID_ARGS` | 参数无效 | 检查 type/resource/price/amount/room |

创建市场订单不是 Creep 距离动作，也不是 Terminal 的冷却动作，因此不要把 `deal()` / `send()` 的距离或冷却分支复制过来。

## 官方订单上限说明当前仍然不一致

截至 **2026-08-15**，Screeps 官方 API 同一个 `createOrder()` 条目仍同时出现：

- 方法说明：每位玩家最多 **300** 个订单；
- `ERR_FULL` 说明：不能创建超过 **50** 个订单。

因此本文不把 50 或 300 写进业务判断。

当前 engine 使用自己的 `MARKET_MAX_ORDERS` 常量，并在创建时检查当前订单数和本 tick 已安排创建数。业务代码更稳妥的做法仍然是：

```js
const currentOrderCount = Object.keys(
  Game.market.orders
).length;
```

记录当前数量，同时始终处理真实 API 返回的 `ERR_FULL`。

## 不要用重复 `createOrder()` 维护已有订单

订单已经存在后，应使用对应 API：

- `changeOrderPrice()`：修改价格；
- `extendOrder()`：增加总量；
- `cancelOrder()`：取消订单。

官方文档说明，提高价格和扩量会产生对应的 5% 费用；取消订单不会退回原创建费用。

因此：

```text
取消旧单
→ 重新 createOrder
```

不应该成为普通调价方案。

## 一个安全的主循环边界

生产代码可以把“提交”和“验证”分开：

```js
module.exports.loop = function () {
  Memory.market ??= {};

  const pending =
    Memory.market.pendingCreateOrder;

  if (pending) {
    const verification =
      verifyCreatedOrder(pending);

    if (
      verification.status
        !== 'waiting-for-next-tick'
    ) {
      Memory.market.lastCreateVerification =
        verification;

      delete Memory.market.pendingCreateOrder;
    }
  }

  const request =
    Memory.market.createOrderRequest;

  if (request?.enabled === true) {
    const terminal = inspectOwnedTerminal(
      request.roomName
    );

    if (!terminal.ready) {
      request.enabled = false;
      request.status = terminal.status;
      return;
    }

    submitCreateOrder(request);
  }
};
```

如果已有 `pendingCreateOrder`，更严格的系统可以直接拒绝新的创建请求，直到上一笔已经进入确定或人工复核状态。

## 离线模拟覆盖什么

本次文章更新对应的 Node.js 离线模拟覆盖：

| 场景 | 预期结果 |
|---|---|
| 普通资源订单没有己方 Terminal | 拒绝进入创建阶段 |
| Terminal 有 cooldown、未 active、当前库存为 0，但所有权存在 | 不把这些状态当作 `createOrder()` 创建前置 |
| `price=1`、`totalAmount=10000` | 5% 费用为 500 Credits |
| 提交前已有相似旧订单 ID | 下一 tick 不会把旧 ID 当成新订单 |
| 下一 tick 出现 1 个精确新候选 | 保存唯一 `orderId` |
| 下一 tick没有精确候选 | `accepted-order-not-observed` |
| 下一 tick出现多个精确候选 | `new-order-identity-ambiguous` |
| 错过下一 tick | `verification-window-missed` |
| 后续出现相似但 `created` tick 不同的订单 | 不归因给旧请求 |

这些是纯函数/快照模拟，不是 Screeps 官方服务器执行结果。

## 常见误区

### `createOrder()` 前必须等 Terminal cooldown 归零

不是当前 `createOrder()` engine 前置。Terminal cooldown 是直接交易和发送资源等操作的重要边界，不应机械复制到创建订单。

### 卖单库存不足就不能创建

官方 Market 文档允许先创建，再根据资源可用量激活/停用。库存不足会影响订单可执行状态，不应与 5% 创建费用混为一谈。

### 返回 `OK` 后立刻再次搜索一个相似订单就行

不够。至少要保存旧 ID 集合，并在下一 tick 使用 `created`、类型、资源、房间、价格和总量做有界归因。

### 下一 tick 没看到订单，所以立刻再创建一次

危险。先保留 `accepted-order-not-observed`，检查 Credits、Terminal、其他同 tick 市场操作和实际订单快照。不要用重提掩盖未知状态。

### 出现两个候选时随便取第一个

这会制造错误的订单身份。应记录全部候选 ID，进入人工复核。

### `active === false` 说明创建失败

不一定。订单对象存在已经证明创建；active 是后续可执行状态，官方文档允许订单因资源或 Credits 不满足而保持 inactive。

### 把 50 或 300 硬编码成订单上限

当前官方 API 文本自身仍不一致。处理 `ERR_FULL`，并在依赖具体上限前重新核对当前 engine / 官方环境。

## 验证边界

本次更新在 2026-08-15 重新核对：

- Screeps 官方 `Game.market.createOrder()` API；
- Screeps 官方 Market System 文档；
- 官方 `screeps/engine` `80977824199a596d174d392fd0cf8c458c21fcbd` 的 `src/game/market.js`；
- 同一 engine 的 `src/processor/global-intents/market.js`。

文档和 engine 可以支持本文的 API / intent / 订单身份边界，但不能证明你的真实账号已经成功创建某笔订单。

当前证据状态：

```text
Docs checked: yes
Official engine checked: yes
JavaScript syntax checked: yes
Offline boundary simulation: yes
Screeps Console tested: no
Live market multi-tick tested: no
```

因此本文不会提供虚构的新订单 ID、真实市场截图、真实 Credits 扣费结果或实际成交记录。

## 相关站内内容

- [Game.market.deal() 怎么安全成交指定市场订单](/blog/screeps-market-deal)
- [Screeps 市场订单怎么维护：changeOrderPrice()、extendOrder()、cancelOrder()](/blog/screeps-market-order-maintenance)
- [StructureTerminal.send() 怎么安全跨房间发送资源](/blog/screeps-terminal-send-resources)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [进入 Screeps 知识库](/knowledge)

## 官方资料

- [Game.market.createOrder() API](https://docs.screeps.com/api/#Game.market.createOrder)
- [Game.market.orders API](https://docs.screeps.com/api/#Game.market.orders)
- [Market System](https://docs.screeps.com/market.html)
- [Official engine: runtime market API](https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/market.js)
- [Official engine: market intent processing](https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/global-intents/market.js)

资料核对日期：**2026-08-15**。真实 Screeps Console 与 live market multi-tick 结果仍待环境验证。