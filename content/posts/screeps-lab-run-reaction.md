---
title: "StructureLab.runReaction() 怎么安全执行矿物反应"
description: "解释三座Lab的输入输出职责、范围2、每次基础反应5单位、REACTIONS配方、输出矿物兼容性和全部返回码，并提供ID配置与离线验证示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Lab"
  - "矿物反应"
  - "高级资源"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（配方、库存、距离、输出兼容和等待状态，不是 Screeps 官方服务器）"
  testResult: "三座Lab缺失、配方无效、输入不足、输出不兼容、输出容量不足、距离超限、等待时间与可执行场景通过。"
featured: false
---

`StructureLab.runReaction(inputA, inputB)` 由**输出 Lab**调用，参数是两座输入 Lab。成功后，两种输入资源被消耗，输出 Lab获得对应化合物。

本文只解决一个问题：怎样在调用前检查三座 Lab、配方、输入库存、输出矿物兼容性、容量、距离和 `cooldown`，并根据返回值继续排查。

## 三座 Lab 的职责不能写反

正确调用：

```js
const result = outputLab.runReaction(
  inputLabA,
  inputLabB
);
```

角色分别是：

| Lab | 职责 |
|---|---|
| `inputLabA` | 提供第一种反应物 |
| `inputLabB` | 提供第二种反应物 |
| `outputLab` | 接收生成的化合物并承担等待时间 |

同一对输入 Lab可以服务多座输出 Lab，但每座输出 Lab仍要满足距离、容量和自身状态要求。

## 官方基础规则

- RCL 6可建3座 Lab，RCL 7可建6座，RCL 8可建10座；
- 输出 Lab到两座输入 Lab的距离都不能超过2格；
- 每次基础反应生成5单位化合物；
- 每座 Lab同一时间只能容纳一种矿物类型；
- 反应后的等待时间取决于生成的化合物；
- `runReaction()`不使用 Lab里的 Energy，Energy用于强化 Creep 等其他操作；
- Power效果可能改变反应产量，最终结果仍以API返回值和真实 Store变化为准。

基础反应量应使用官方常量：

```js
LAB_REACTION_AMOUNT
```

不要在多个模块中散落硬编码数字 `5`。

## 怎样通过 `REACTIONS`确认配方

输入资源：

```js
const mineralA = inputLabA.mineralType;
const mineralB = inputLabB.mineralType;
```

配方：

```js
const product = mineralA && mineralB
  ? REACTIONS[mineralA]?.[mineralB]
  : undefined;
```

例如氢与氧可以生成 `OH`。不存在的组合会得到 `undefined`，不应继续调用。

`REACTIONS`用于确认“这两个输入能生成什么”，不是库存检查。仍要单独确认两座输入 Lab里有足够资源。

## 不要通过数组顺序猜三座 Lab

错误写法：

```js
const inputA = labs[0];
const inputB = labs[1];
const output = labs[2];
```

`room.find()`返回顺序不应被当作稳定业务配置。建筑重建、代码调整或房间布局变化后，角色可能互换。

更稳妥的方式是把三座 Lab的ID写入配置：

```js
Memory.labReactionConfig = {
  inputAId: '第一座输入Lab ID',
  inputBId: '第二座输入Lab ID',
  outputId: '输出Lab ID'
};
```

## 先写一个可测试的计划检查器

```js
function evaluateReactionPlan(input) {
  const {
    inputA,
    inputB,
    output,
    reactionAmount
  } = input;

  if (!inputA || !inputB || !output) {
    return { ready: false, reason: 'lab-missing' };
  }

  if (output.cooldown > 0) {
    return { ready: false, reason: 'output-waiting' };
  }

  const mineralA = inputA.mineralType;
  const mineralB = inputB.mineralType;
  const product = mineralA && mineralB
    ? REACTIONS[mineralA]?.[mineralB]
    : undefined;

  if (!product) {
    return { ready: false, reason: 'invalid-recipe' };
  }

  const amountA = inputA.store.getUsedCapacity(mineralA);
  const amountB = inputB.store.getUsedCapacity(mineralB);

  if (amountA < reactionAmount || amountB < reactionAmount) {
    return {
      ready: false,
      reason: 'reagent-shortage',
      product
    };
  }

  if (
    output.mineralType
    && output.mineralType !== product
  ) {
    return {
      ready: false,
      reason: 'output-mineral-conflict',
      product
    };
  }

  const freeCapacity = output.store.getFreeCapacity(product);
  if (
    !Number.isFinite(freeCapacity)
    || freeCapacity < reactionAmount
  ) {
    return {
      ready: false,
      reason: 'output-full',
      product
    };
  }

  if (
    !output.pos.inRangeTo(inputA.pos, 2)
    || !output.pos.inRangeTo(inputB.pos, 2)
  ) {
    return {
      ready: false,
      reason: 'input-out-of-range',
      product
    };
  }

  return {
    ready: true,
    reason: 'ready',
    product
  };
}
```

这段函数只判断基础反应条件。Power效果、同 tick 其他命令和服务器最终结算仍要依赖真实API返回值。

## 完整示例

代码放在 `main` 模块。先把三座 Lab的ID写入 `Memory.labReactionConfig`。

```js
function isOwnedLab(structure) {
  return Boolean(
    structure
    && structure.structureType === STRUCTURE_LAB
    && structure.my === true
  );
}

function evaluateReactionPlan(input) {
  const {
    inputA,
    inputB,
    output,
    reactionAmount
  } = input;

  if (!inputA || !inputB || !output) {
    return { ready: false, reason: 'lab-missing' };
  }

  if (output.cooldown > 0) {
    return { ready: false, reason: 'output-waiting' };
  }

  const mineralA = inputA.mineralType;
  const mineralB = inputB.mineralType;
  const product = mineralA && mineralB
    ? REACTIONS[mineralA]?.[mineralB]
    : undefined;

  if (!product) {
    return { ready: false, reason: 'invalid-recipe' };
  }

  const amountA = inputA.store.getUsedCapacity(mineralA);
  const amountB = inputB.store.getUsedCapacity(mineralB);

  if (amountA < reactionAmount || amountB < reactionAmount) {
    return {
      ready: false,
      reason: 'reagent-shortage',
      product
    };
  }

  if (
    output.mineralType
    && output.mineralType !== product
  ) {
    return {
      ready: false,
      reason: 'output-mineral-conflict',
      product
    };
  }

  const freeCapacity = output.store.getFreeCapacity(product);
  if (
    !Number.isFinite(freeCapacity)
    || freeCapacity < reactionAmount
  ) {
    return {
      ready: false,
      reason: 'output-full',
      product
    };
  }

  if (
    !output.pos.inRangeTo(inputA.pos, 2)
    || !output.pos.inRangeTo(inputB.pos, 2)
  ) {
    return {
      ready: false,
      reason: 'input-out-of-range',
      product
    };
  }

  return {
    ready: true,
    reason: 'ready',
    product
  };
}

module.exports.loop = function () {
  const config = Memory.labReactionConfig;

  if (
    !config
    || typeof config.inputAId !== 'string'
    || typeof config.inputBId !== 'string'
    || typeof config.outputId !== 'string'
  ) {
    return;
  }

  const inputA = Game.getObjectById(config.inputAId);
  const inputB = Game.getObjectById(config.inputBId);
  const output = Game.getObjectById(config.outputId);

  if (
    !isOwnedLab(inputA)
    || !isOwnedLab(inputB)
    || !isOwnedLab(output)
  ) {
    return;
  }

  if (
    inputA.id === inputB.id
    || inputA.id === output.id
    || inputB.id === output.id
  ) {
    return;
  }

  if (!output.isActive()) {
    return;
  }

  const plan = evaluateReactionPlan({
    inputA,
    inputB,
    output,
    reactionAmount: LAB_REACTION_AMOUNT
  });

  if (!plan.ready) {
    if (Game.time % 100 === 0) {
      console.log({
        type: 'lab-reaction-not-ready',
        reason: plan.reason,
        product: plan.product || null,
        inputA: inputA.id,
        inputB: inputB.id,
        output: output.id
      });
    }
    return;
  }

  const result = output.runReaction(inputA, inputB);

  if (result !== OK || Game.time % 100 === 0) {
    console.log({
      type: 'lab-reaction-result',
      product: plan.product,
      output: output.id,
      result
    });
  }
};
```

## 为什么要检查三个ID互不相同

`runReaction()`需要一座输出 Lab和两座输入 Lab。配置复制错误时，可能把同一ID写到多个字段。

示例在调用前检查：

```js
inputA.id === inputB.id
inputA.id === output.id
inputB.id === output.id
```

避免把明显无效的配置交给API后才排查。

## 输出 Lab已有矿物时怎样处理

Lab同一时间只能容纳一种矿物。

若输出 Lab为空：

```js
output.mineralType === undefined
```

可以接收新产品。

若已有相同产品，也可以继续接收，前提是容量足够。

若已有不同矿物：

```js
output.mineralType !== product
```

必须先由物流清空，不能只看总空闲容量。

## 为什么检查5单位只是基础保护

官方基础反应量是：

```js
LAB_REACTION_AMOUNT
```

当前值为5。普通情况下，两座输入 Lab都至少需要这部分反应物，输出 Lab也至少需要对应容量。

Power效果可能改变实际反应产量。本文的基础预检查不能替代 `runReaction()`返回值。若房间使用了相关Power，应根据 `output.effects`和当前官方 `POWER_INFO`进一步计算任务需求，或把API返回的资源不足、容量不足作为最终判断。

## 等待时间怎样判断

输出 Lab的：

```js
output.cooldown
```

表示还要等待多少 tick 才能进行下一次反应或解除强化操作。

不同产品的反应时间由：

```js
REACTION_TIME[product]
```

定义。例如不同等级化合物可能有不同等待 tick 数。

不要自己维护一份容易过期的产品时间表，优先读取官方常量。

## 全部返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 命令已安排 | 下一tick观察 Store和 `cooldown` |
| `ERR_NOT_OWNER` | 输出 Lab不是自己的 | ID和所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | 输入反应物不足 | 两座输入库存和Power效果 |
| `ERR_INVALID_TARGET` | 参数不是有效 Lab | 三个ID、对象类型、对象是否存在 |
| `ERR_FULL` | 输出 Lab无法继续接收 | 产品兼容性和空闲容量 |
| `ERR_NOT_IN_RANGE` | 输入 Lab距离输出 Lab过远 | 两个距离都要小于等于2 |
| `ERR_INVALID_ARGS` | 这组资源不能反应 | `REACTIONS`配方 |
| `ERR_TIRED` | 输出 Lab仍在等待 | `output.cooldown` |
| `ERR_RCL_NOT_ENOUGH` | 结构当前不可用 | RCL和 `output.isActive()` |

`OK`只表示命令已安排，不应在同一段代码里把5单位产品当作已经完成并立即安排依赖该产品的下一步。

## 反应和物流必须分开

`runReaction()`不会自动：

- 把矿物送进输入 Lab；
- 清理输出 Lab里的旧矿物；
- 把产品搬到 Terminal或Storage；
- 选择下一种配方；
- 补充 Boost所需 Energy；
- 判断市场库存；
- 安排多级化合物生产链。

实际系统通常拆成状态：

```text
清空错误矿物
→ 装载输入
→ 等待输入达标
→ 执行反应
→ 等待输出达到批次数量
→ 搬走产品
→ 切换下一任务
```

本文只负责“执行反应”这一阶段。

## 多座输出 Lab怎样共享输入

官方允许同一对输入 Lab被多座输出 Lab使用。调用前仍要逐座检查：

- 输出 Lab是否在两座输入 Lab的2格范围内；
- 输出矿物是否兼容；
- 输出容量；
- 当前 `cooldown`；
- 该次调用时输入库存是否仍足够。

同一 tick 多座输出 Lab依次提交命令时，前面的预检查看到的是当前 tick 开始时的 Store。最终资源结算可能使后续命令失败，因此每次返回值都必须保存，不能只在循环开始前检查一次总库存。

## 离线模拟结果

构建检查使用普通对象模拟：

1. 任意一座 Lab缺失；
2. 输出 Lab处于等待状态；
3. 输入矿物无法组成配方；
4. 任一输入少于基础反应量；
5. 输出 Lab已有不同矿物；
6. 输出容量不足；
7. 任一输入 Lab距离超过2格；
8. 所有基础条件满足时返回 `ready`。

离线模拟没有调用官方 `runReaction()`，也没有模拟 Power效果、同tick多命令结算或真实 Store变化。

## 常见误区

### 用 `labs[0]`、`labs[1]`、`labs[2]`固定角色

查找顺序不是可靠配置。应使用ID或显式布局配置。

### 只检查输入矿物，不检查输出矿物

输出已有不同产品时不能继续接收。

### 只检查输出总空闲容量

Lab有资源类型限制，应按产品类型检查并核对 `mineralType`。

### 只检查一座输入 Lab的距离

输出 Lab必须同时靠近两座输入 Lab。

### 把 Lab里的 Energy当作反应消耗

矿物反应使用输入矿物；Energy主要用于强化 Creep等操作。

### `OK`后立即读取新产品并安排下一级

命令结算跨 tick。下一阶段应在后续 tick读取真实Store。

### 预检查通过就忽略API返回值

Power效果、同tick竞争和真实游戏状态仍可能让API返回错误。

## 排查顺序

1. 检查配置是否包含三个不同ID；
2. 用 `Game.getObjectById()`恢复并核对类型、所有权；
3. 检查输出 Lab是否可用；
4. 读取两座输入 Lab的 `mineralType`；
5. 通过 `REACTIONS`取得产品；
6. 检查两边输入库存；
7. 检查输出矿物兼容和产品容量；
8. 检查两段范围；
9. 检查 `output.cooldown`；
10. 保存 `runReaction()`返回值；
11. 下一 tick观察输入、输出和等待状态变化。

## 适用边界

本文没有实现：

- 多级化合物生产计划；
- Lab自动角色分配；
- Creep物流；
- Boost任务；
- `reverseReaction()`；
- Power效果精确产量计算；
- 多房间资源协调；
- 市场采购；
- 批次成本核算。

JavaScript语法和基础反应计划离线模拟已经通过。真实 `runReaction()`返回值、Store结算和连续批次运行仍待Screeps环境验证。

## 相关站内内容

- [StructureLab.boostCreep() 怎么强化Creep](/blog/screeps-lab-boost-creep)
- [Mineral 和 Extractor 怎么采集](/blog/screeps-mineral-extractor-harvest)
- [Terminal.send() 怎么发送资源](/blog/screeps-terminal-send-resources)
- [Game.market.deal() 怎么直接成交](/blog/screeps-market-deal)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [StructureLab API](https://docs.screeps.com/api/#StructureLab)
- [StructureLab.runReaction API](https://docs.screeps.com/api/#StructureLab.runReaction)
- [Resources：Mineral compounds](https://docs.screeps.com/resources.html#Mineral-compounds)
- [REACTIONS 与 REACTION_TIME 常量](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线反应计划模拟已通过；真实Lab反应仍待环境验证。
