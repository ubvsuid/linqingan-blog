---
title: "StructureTerminal.send() 怎么安全跨房间发送资源"
description: "使用一次性Memory请求核对源Terminal、目标房间、最小发送量、100字符说明、资源库存、Energy交易成本和保留线，并处理send()全部返回码。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
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
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（发送参数、资源库存、Energy成本、保留线和一次性状态，不是 Screeps 官方服务器）"
  testResult: "数量不足、目标无效、说明过长、普通资源、发送Energy、库存不足、Energy保留线和可提交场景通过。"
featured: false
---

`StructureTerminal.send(resourceType, amount, destination, description)` 会把资源真实发送到另一个房间的Terminal，并由发送方支付交易Energy。

本文只解决一个问题：怎样通过一次性请求安全发送一笔资源，并在调用前核对目标房间、发送量、说明长度、资源库存、交易Energy和Terminal保留线。

## 官方基础规则

- 目标房间不需要当前视野；
- 目标房间必须存在可接收的Terminal；
- 每次发送都需要额外Energy；
- `description`对接收方可见，最多100字符；
- 当前最小发送量由 `TERMINAL_MIN_SEND`定义；
- Terminal处于 `cooldown`时不能再次发送或执行普通资源市场成交；
- 交易Energy可用 `Game.market.calcTransactionCost()`估算。

当前官方常量中：

```js
TERMINAL_MIN_SEND
```

值为100。代码应读取常量，不要只把数字写在文章里。

## 发送普通资源和发送Energy的库存检查不同

发送Utrium时，Terminal需要：

```text
Utrium数量 >= amount
Energy数量 >= transactionEnergy
```

发送Energy时，同一种Energy既是发送资源，也是交易费用：

```text
Energy数量 >= amount + transactionEnergy
```

错误写法：

```js
terminal.store.getUsedCapacity(RESOURCE_ENERGY)
  >= transactionEnergy
```

它在发送Energy时漏掉了要真正转出的 `amount`。

## 一次性请求结构

```js
Memory.terminal ??= {};
Memory.terminal.sendRequest = {
  enabled: true,
  terminalId: '替换为源Terminal ID',
  resourceType: RESOURCE_UTRIUM,
  amount: 1000,
  destination: 'W2N2',
  description: 'manual transfer',
  energyReserve: 20000
};
```

源结构、资源、数量、目标房间和保留线必须在执行前人工确认。

## 可测试的发送计划

```js
function evaluateTerminalSend(input) {
  const {
    request,
    resourceAvailable,
    energyAvailable,
    transactionEnergy
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.resourceType !== 'string'
    || typeof request.destination !== 'string'
    || request.destination.length === 0
  ) {
    return { ready: false, reason: 'invalid-arguments' };
  }

  if (
    !Number.isInteger(request.amount)
    || request.amount < TERMINAL_MIN_SEND
  ) {
    return { ready: false, reason: 'amount-too-small' };
  }

  const description = request.description === undefined
    ? undefined
    : String(request.description);

  if (description && description.length > 100) {
    return { ready: false, reason: 'description-too-long' };
  }

  if (resourceAvailable < request.amount) {
    return { ready: false, reason: 'resource-shortage' };
  }

  const requiredEnergy = transactionEnergy
    + (request.resourceType === RESOURCE_ENERGY
      ? request.amount
      : 0);
  const energyReserve = Number.isFinite(request.energyReserve)
    ? request.energyReserve
    : 0;

  if (energyAvailable - requiredEnergy < energyReserve) {
    return {
      ready: false,
      reason: 'energy-reserve',
      requiredEnergy,
      transactionEnergy
    };
  }

  return {
    ready: true,
    reason: 'ready',
    description,
    requiredEnergy,
    transactionEnergy
  };
}
```

## 完整示例

代码放在 `main` 模块。

```js
function evaluateTerminalSend(input) {
  const {
    request,
    resourceAvailable,
    energyAvailable,
    transactionEnergy
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.resourceType !== 'string'
    || typeof request.destination !== 'string'
    || request.destination.length === 0
  ) {
    return { ready: false, reason: 'invalid-arguments' };
  }

  if (
    !Number.isInteger(request.amount)
    || request.amount < TERMINAL_MIN_SEND
  ) {
    return { ready: false, reason: 'amount-too-small' };
  }

  const description = request.description === undefined
    ? undefined
    : String(request.description);

  if (description && description.length > 100) {
    return { ready: false, reason: 'description-too-long' };
  }

  if (resourceAvailable < request.amount) {
    return { ready: false, reason: 'resource-shortage' };
  }

  const requiredEnergy = transactionEnergy
    + (request.resourceType === RESOURCE_ENERGY
      ? request.amount
      : 0);
  const energyReserve = Number.isFinite(request.energyReserve)
    ? request.energyReserve
    : 0;

  if (energyAvailable - requiredEnergy < energyReserve) {
    return {
      ready: false,
      reason: 'energy-reserve',
      requiredEnergy,
      transactionEnergy
    };
  }

  return {
    ready: true,
    reason: 'ready',
    description,
    requiredEnergy,
    transactionEnergy
  };
}

module.exports.loop = function () {
  const request = Memory.terminal?.sendRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const terminal = typeof request.terminalId === 'string'
    ? Game.getObjectById(request.terminalId)
    : null;

  if (
    !terminal
    || terminal.structureType !== STRUCTURE_TERMINAL
    || terminal.my !== true
    || !terminal.isActive()
    || terminal.cooldown > 0
  ) {
    return;
  }

  if (terminal.room.name === request.destination) {
    request.lastStatus = 'same-room-destination';
    request.lastCheckedAt = Game.time;
    return;
  }

  const transactionEnergy = Game.market.calcTransactionCost(
    request.amount,
    terminal.room.name,
    request.destination
  );

  if (!Number.isFinite(transactionEnergy)) {
    return;
  }

  const resourceAvailable = terminal.store.getUsedCapacity(
    request.resourceType
  );
  const energyAvailable = terminal.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  const plan = evaluateTerminalSend({
    request,
    resourceAvailable,
    energyAvailable,
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
    terminalId: terminal.id,
    sourceRoom: terminal.room.name,
    destination: request.destination,
    resourceType: request.resourceType,
    amount: request.amount,
    description: plan.description || null,
    transactionEnergy: plan.transactionEnergy,
    requiredEnergy: plan.requiredEnergy,
    resourceBefore: resourceAvailable,
    energyBefore: energyAvailable
  };

  const result = terminal.send(
    request.resourceType,
    request.amount,
    request.destination,
    plan.description
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'terminal-send-result',
    terminalId: terminal.id,
    sourceRoom: terminal.room.name,
    destination: request.destination,
    resourceType: request.resourceType,
    amount: request.amount,
    transactionEnergy: plan.transactionEnergy,
    result
  });
};
```

## 为什么调用前关闭请求

`send()`会真实发送资源。若目标房间、数量或资源配置错误，重复执行会造成多笔转移。

示例在调用前执行：

```js
request.enabled = false;
```

无论返回 `OK`还是错误，都不会在下一 tick 自动重发。失败后必须人工检查：

- 源Terminal ID；
- 目标房间；
- 资源类型；
- 数量；
- 说明文字；
- Energy成本；
- 当前Store；
- `cooldown`；
- API返回值。

确认后再明确重新开启请求。

## 交易Energy估算与Power效果

`Game.market.calcTransactionCost()`只接收数量和两个房间名，用于估算普通Terminal发送和市场成交的基础Energy成本。

`PWR_OPERATE_TERMINAL`能够降低实际传输Energy成本并缩短Terminal等待时间。因为估算方法没有接收具体Terminal参数，本文把计算结果当作保守预算；真实消耗仍应通过下一 tick的Store和交易记录核对。

这是基于两个官方接口能力做出的实现判断，不能替代服务器实测。

## 为什么不需要目标房间视野

官方API明确说明，目标房间不需要获得视野。

因此不要用：

```js
if (!Game.rooms[destination]) {
  return;
}
```

作为发送前提。目标房间不可见不等于不能发送。

但目标房间必须有可接收的Terminal，否则API会返回错误。

## `description` 对接收方可见

说明文字最多100字符，并会出现在对方可见的交易信息中。

不应写入：

- 私密账号信息；
- 内部调试堆栈；
- 过长JSON；
- 不应对外展示的房间策略；
- 无法解释的自动生成内容。

示例超过100字符时直接拒绝，而不是静默截断，避免实际说明与人工输入不一致。

## 主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 发送命令已安排 | 下一 tick 查看交易记录和Store |
| `ERR_NOT_OWNER` | Terminal不是自己的 | ID与所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | 发送资源或Energy不足 | 普通资源与发送Energy的不同公式 |
| `ERR_INVALID_ARGS` | 参数不正确 | 资源、数量、房间名、说明和目标Terminal |
| `ERR_TIRED` | Terminal仍在等待 | `terminal.cooldown` |

当前API未为 `send()`列出 `ERR_FULL`。不要把其他Store动作的返回码复制到本文。

## 下一 tick 怎样核对

发送命令返回 `OK`后，可以查看：

```js
Game.market.outgoingTransactions
```

并对照：

- 请求记录中的源房间和目标房间；
- 资源类型与数量；
- Terminal Store变化；
- Energy变化；
- 交易说明；
- 交易时间。

不要只打印“真实发送成功”。在没有交易记录和后续状态前，只能写“发送命令已安排”。

## 接收房间需要做什么

目标Terminal收到资源后，不会自动：

- 搬到Storage；
- 分配给Lab或Factory；
- 更新任务队列；
- 发送确认；
- 维持目标库存；
- 退回多余资源。

跨房间物流通常需要接收方独立处理入库和任务状态。本文只负责一次发送。

## 离线模拟结果

构建检查对发送计划覆盖：

1. 请求未启用；
2. 资源或目标房间参数缺失；
3. 数量低于 `TERMINAL_MIN_SEND`；
4. 说明超过100字符；
5. 发送资源库存不足；
6. 普通资源只额外支付交易Energy；
7. 发送Energy需要 `amount + transactionEnergy`；
8. 发送后Energy低于保留线；
9. 条件满足时返回完整预算。

离线模拟没有调用真实 `send()`，也没有验证目标Terminal、Power效果和交易记录。

## 常见误区

### 要求目标房间必须在 `Game.rooms`

发送不需要目标房间视野。

### 发送Energy时只检查交易费用

还必须保留真正要发送的Energy数量。

### 数量小于最小发送量

应使用 `TERMINAL_MIN_SEND`提前检查。

### 说明超过100字符

接收方可见说明有官方长度限制。

### 失败后自动重发

可能在配置错误时连续转出资源。

### 把估算成本写成Power效果后的真实消耗

需要下一 tick查看真实Store和交易记录。

### `OK`后立即写“资源已到账”

命令已安排不等于已经完成后续接收与分配。

## 适用边界

本文没有实现：

- 多房间补货队列；
- 接收方自动入库；
- 目标库存控制；
- 多Terminal选择；
- Power效果精确成本预测；
- 自动失败重试；
- 交易确认协议；
- 跨 shard 资源；
- 市场订单。

JavaScript语法和发送计划离线模拟已经通过。真实Terminal返回值、资源转移和交易记录仍待Screeps环境验证。

## 相关站内内容

- [Game.market.deal() 怎么成交指定订单](/blog/screeps-market-deal)
- [StructureFactory.produce() 怎么生产商品](/blog/screeps-factory-produce)
- [StructureLab.runReaction() 怎么执行矿物反应](/blog/screeps-lab-run-reaction)
- [Screeps Storage中的Energy怎么使用](/blog/screeps-storage-energy-usage)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [进入房间采集与资源经济模块](/knowledge/room-economy)

## 官方资料

- [StructureTerminal.send API](https://docs.screeps.com/api/#StructureTerminal.send)
- [Game.market.calcTransactionCost API](https://docs.screeps.com/api/#Game-market.calcTransactionCost)
- [Market System](https://docs.screeps.com/market.html)
- [Power：PWR_OPERATE_TERMINAL](https://docs.screeps.com/power.html)

资料核对日期：2026-07-22。离线发送计划模拟已通过；真实资源发送仍待环境验证。
