---
title: "StructureFactory.produce() 怎么安全生产指定商品"
description: "解释 COMMODITIES 配方的 components、amount、cooldown 与 level，区分任意等级和高等级商品，并提供带一次性请求、容量检查和全部返回码的 Factory 示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Factory"
  - "商品生产"
  - "高级资源"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（配方、组件、商品容量、Factory等级和等待状态，不是 Screeps 官方服务器）"
  testResult: "配方缺失、组件不足、输出容量不足、等级不匹配、未获得Power效果、等待状态和可执行场景通过。"
featured: false
---

`StructureFactory.produce(resourceType)` 会根据 `COMMODITIES[resourceType]` 中的配方，消耗 Factory Store里的组件并安排一次商品生产。

本文只解决一个问题：怎样通过一次性请求生产指定商品，并在调用前核对配方、全部组件、输出容量、Factory等级、Power效果和 `cooldown`。

## `COMMODITIES` 提供哪些信息

```js
const recipe = COMMODITIES[product];
```

常见字段包括：

| 字段 | 含义 |
|---|---|
| `components` | 本次生产需要的全部资源与数量 |
| `amount` | 本次生成的商品数量 |
| `cooldown` | 成功安排后 Factory需要等待的tick数 |
| `level` | 高等级商品要求的Factory等级；任意等级商品可能没有该字段 |

例如 Battery属于任意等级商品，新建且没有等级的 Factory也可以生产；高等级商品需要 Factory等级与配方等级匹配，并且当前获得 `PWR_OPERATE_FACTORY`效果。

不要把资源文档中的配方表手工抄进业务代码，优先读取 `COMMODITIES`。

## Factory等级不是RCL

这三个概念不同：

```text
房间RCL
决定Factory能否建造和使用

factory.level
由PWR_OPERATE_FACTORY首次设置，设置后不能改变

PWR_OPERATE_FACTORY效果
高等级Factory当前能否生产对应等级商品
```

官方说明：Factory等级一旦设置不能改变；要改变等级只能重建。Power效果结束后，等级仍然保留，但高等级生产会停止，任意等级商品仍可生产。

## 为什么需要一次性请求

`produce()`会真实消耗 Store中的组件。生产队列本身可以连续执行，但单篇文章不应该在没有任务状态的情况下每 tick 尝试任意商品。

示例请求：

```js
Memory.factoryRequest = {
  enabled: true,
  factoryId: '替换为Factory ID',
  product: RESOURCE_BATTERY
};
```

请求只负责一次生产。长期批次应由单独队列管理。

## 怎样确认高等级Factory当前获得Power效果

可以检查结构效果：

```js
function getOperateFactoryEffect(factory) {
  return factory.effects.find(
    effect => effect.effect === PWR_OPERATE_FACTORY
  ) || null;
}
```

对于有 `recipe.level`的商品，需要：

- `factory.level === recipe.level`；
- 当前存在 `PWR_OPERATE_FACTORY`效果；
- 效果等级与 Factory等级一致。

任意等级商品不要求这项Power效果。

## 可离线测试的计划检查器

```js
function evaluateFactoryPlan(input) {
  const {
    recipe,
    factoryLevel,
    operateLevel,
    waitingTicks,
    store,
    freeCapacity
  } = input;

  if (!recipe || !recipe.components) {
    return { ready: false, reason: 'recipe-missing' };
  }

  if (waitingTicks > 0) {
    return { ready: false, reason: 'factory-waiting' };
  }

  for (const [resourceType, amount] of Object.entries(recipe.components)) {
    if ((store[resourceType] || 0) < amount) {
      return {
        ready: false,
        reason: 'component-shortage',
        resourceType,
        required: amount,
        available: store[resourceType] || 0
      };
    }
  }

  if (freeCapacity < recipe.amount) {
    return {
      ready: false,
      reason: 'output-full',
      required: recipe.amount,
      available: freeCapacity
    };
  }

  if (recipe.level !== undefined) {
    if (factoryLevel !== recipe.level) {
      return {
        ready: false,
        reason: 'factory-level-mismatch'
      };
    }

    if (operateLevel !== recipe.level) {
      return {
        ready: false,
        reason: 'operate-factory-missing'
      };
    }
  }

  return {
    ready: true,
    reason: 'ready'
  };
}
```

## 完整示例

代码放在 `main` 模块。

```js
function getOperateFactoryEffect(factory) {
  return factory.effects.find(
    effect => effect.effect === PWR_OPERATE_FACTORY
  ) || null;
}

function buildFactoryStoreSnapshot(factory, recipe) {
  const snapshot = {};

  for (const resourceType of Object.keys(recipe.components)) {
    snapshot[resourceType] = factory.store.getUsedCapacity(
      resourceType
    );
  }

  return snapshot;
}

function evaluateFactoryPlan(input) {
  const {
    recipe,
    factoryLevel,
    operateLevel,
    waitingTicks,
    store,
    freeCapacity
  } = input;

  if (!recipe || !recipe.components) {
    return { ready: false, reason: 'recipe-missing' };
  }

  if (waitingTicks > 0) {
    return { ready: false, reason: 'factory-waiting' };
  }

  for (const [resourceType, amount] of Object.entries(recipe.components)) {
    if ((store[resourceType] || 0) < amount) {
      return {
        ready: false,
        reason: 'component-shortage',
        resourceType,
        required: amount,
        available: store[resourceType] || 0
      };
    }
  }

  if (freeCapacity < recipe.amount) {
    return {
      ready: false,
      reason: 'output-full',
      required: recipe.amount,
      available: freeCapacity
    };
  }

  if (recipe.level !== undefined) {
    if (factoryLevel !== recipe.level) {
      return {
        ready: false,
        reason: 'factory-level-mismatch'
      };
    }

    if (operateLevel !== recipe.level) {
      return {
        ready: false,
        reason: 'operate-factory-missing'
      };
    }
  }

  return {
    ready: true,
    reason: 'ready'
  };
}

module.exports.loop = function () {
  const request = Memory.factoryRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const factory = typeof request.factoryId === 'string'
    ? Game.getObjectById(request.factoryId)
    : null;
  const product = request.product;
  const recipe = typeof product === 'string'
    ? COMMODITIES[product]
    : null;

  if (
    !factory
    || factory.structureType !== STRUCTURE_FACTORY
    || factory.my !== true
    || !recipe
  ) {
    return;
  }

  if (!factory.isActive()) {
    return;
  }

  const operateEffect = getOperateFactoryEffect(factory);
  const storeSnapshot = buildFactoryStoreSnapshot(
    factory,
    recipe
  );
  const freeCapacity = factory.store.getFreeCapacity();

  const plan = evaluateFactoryPlan({
    recipe,
    factoryLevel: factory.level,
    operateLevel: operateEffect
      ? operateEffect.level
      : null,
    waitingTicks: factory.cooldown,
    store: storeSnapshot,
    freeCapacity
  });

  if (!plan.ready) {
    if (Game.time % 100 === 0) {
      console.log({
        type: 'factory-not-ready',
        factory: factory.id,
        product,
        reason: plan.reason,
        resourceType: plan.resourceType || null,
        required: plan.required || null,
        available: plan.available ?? null
      });
    }
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.recipe = {
    amount: recipe.amount,
    level: recipe.level ?? null,
    components: recipe.components
  };

  const result = factory.produce(product);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'factory-produce-result',
    factory: factory.id,
    product,
    amount: recipe.amount,
    result
  });
};
```

## 为什么检查总空闲容量

Factory Store可以存放多种资源，商品生成后仍占用同一个 Store。

```js
factory.store.getFreeCapacity()
```

用于确认至少能容纳 `recipe.amount`单位产品。

仅检查产品当前数量是不够的，因为其他组件可能已经占满总容量。

## 为什么高等级商品需要同时检查level和Power效果

只看：

```js
factory.level === recipe.level
```

不能证明当前能生产。官方API对未获得 `PWR_OPERATE_FACTORY`效果的高等级Factory可能返回 `ERR_BUSY`。

反过来，存在Power效果也不能绕过永久等级限制。Factory只能生产与自身等级完全匹配的高等级商品，或任意等级商品。

## 为什么调用前关闭开关

生产会真实消耗组件。示例在调用前关闭：

```js
request.enabled = false;
```

无论返回 `OK`还是错误，都不会在下一 tick 自动重试。失败后必须人工核对产品常量、组件、容量、Factory等级、Power效果与返回值，再明确重新开启请求。

长期生产队列可以自动推进，但必须有批次数量、资源预算、失败状态和重试上限，不能只把开关永久设为 `true`。

## 全部主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 生产命令已安排 | 下一 tick 检查组件、产品和 `cooldown` |
| `ERR_NOT_OWNER` | Factory不是自己的 | Factory ID与所有权 |
| `ERR_BUSY` | 高等级Factory没有当前Power效果 | `PWR_OPERATE_FACTORY`效果 |
| `ERR_NOT_ENOUGH_RESOURCES` | 缺少一个或多个组件 | `recipe.components`全部项目 |
| `ERR_INVALID_TARGET` | Factory不能生产该等级商品 | `recipe.level`与 `factory.level` |
| `ERR_FULL` | Store无法容纳产品 | 总空闲容量与 `recipe.amount` |
| `ERR_INVALID_ARGS` | 商品参数不正确 | `COMMODITIES[product]`是否存在 |
| `ERR_TIRED` | Factory仍在等待 | `factory.cooldown` |
| `ERR_RCL_NOT_ENOUGH` | 房间等级不足 | RCL与 `factory.isActive()` |

`OK`只表示命令已安排。组件消耗、商品增加和等待状态应在后续 tick 读取。

## 怎样验证下一 tick 的变化

提交前可以保存：

```js
request.before = {
  productAmount: factory.store.getUsedCapacity(product),
  components: storeSnapshot
};
```

下一 tick 再比较：

- 产品是否增加 `recipe.amount`；
- 各组件是否按配方减少；
- `factory.cooldown`是否进入等待状态；
- 是否有其他物流在同一时间改变 Store。

不能仅凭总量差值断言全部变化都来自本次生产，真实房间可能还有 Creep物流和其他模块。

## 任意等级商品与高等级商品

任意等级商品：

- `recipe.level`通常不存在；
- 未设置等级的Factory也可以生产；
- 设置了等级的Factory同样可以生产。

高等级商品：

- `recipe.level`存在；
- Factory永久等级必须完全一致；
- 当前需要同等级 `PWR_OPERATE_FACTORY`效果。

不要使用：

```js
factory.level >= recipe.level
```

官方规则是对应等级，而不是等级越高自动兼容全部低级商品。

## 离线模拟结果

构建检查对计划函数覆盖：

1. `COMMODITIES`中没有配方；
2. Factory仍在等待；
3. 任意一个组件不足；
4. 产品总容量不足；
5. 高等级商品与Factory等级不一致；
6. 高等级商品没有对应Power效果；
7. 任意等级商品不要求Power效果；
8. 条件完整时返回可执行。

离线模拟没有调用真实 `produce()`，也没有模拟Power Creep使用Power、Store结算或连续生产链。

## 常见误区

### 只检查一种主要组件

配方可能包含多种基础资源与中间商品，必须遍历 `components`。

### 把 `cooldown` 当成配方字段的实时状态

`recipe.cooldown`是成功后的配方等待时长；当前是否能生产要检查 `factory.cooldown`。

### 用RCL代替Factory等级

RCL、永久Factory等级和当前Power效果是三个不同条件。

### 认为高等级Factory能生产所有低等级商品

高等级商品要求精确等级匹配；只有任意等级商品不受这一限制。

### 不检查输出容量

组件齐全仍可能因为Store已满返回 `ERR_FULL`。

### `OK`后立即安排依赖产品的下一步

命令跨 tick 结算，应在下一 tick 读取Store。

### 失败后自动重复生产

可能在错误商品、错误等级或错误资源预算下持续尝试。

## 适用边界

本文没有实现：

- 多级商品生产链；
- 组件物流；
- Power Creep调度；
- 批次数量和资源预算；
- 多Factory协同；
- 成本核算；
- 商品销售；
- 生产优先级；
- 失败自动恢复。

JavaScript语法和生产计划离线模拟已经通过。真实Factory返回值、Power效果与连续生产仍待Screeps环境验证。

## 相关站内内容

- [StructurePowerSpawn.processPower() 怎么处理Power](/blog/screeps-power-spawn-process-power)
- [Terminal.send() 怎么发送资源](/blog/screeps-terminal-send-resources)
- [StructureLab.runReaction() 怎么执行矿物反应](/blog/screeps-lab-run-reaction)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [StructureFactory.produce API](https://docs.screeps.com/api/#StructureFactory.produce)
- [Resources：Commodities](https://docs.screeps.com/resources.html#Commodities)
- [Power：PWR_OPERATE_FACTORY](https://docs.screeps.com/power.html)

资料核对日期：2026-07-22。离线生产计划模拟已通过；真实商品生产仍待环境验证。
