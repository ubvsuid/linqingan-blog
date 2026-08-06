---
title: "Screeps Store API 怎么判断容量：getUsedCapacity、getFreeCapacity、getCapacity 与 null 陷阱"
description: "系统解释 Screeps Store 的已用容量、剩余容量和总容量：区分通用 Store 与受限 Store，正确处理 resource 参数、0 与 null、Lab 双容量、Tombstone/Ruin 只读资源，以及安全的 withdraw/transfer 数量计算。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "资源采集"
  - "能量"
  - "游戏 API"
  - "JavaScript"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
---

几乎所有 Screeps 资源代码都会遇到 `Store`：

```js
creep.store
container.store
spawn.store
lab.store
terminal.store
```

最常见的错误并不是不会读取 Energy，而是把三种不同问题混在一起：

```text
现在有多少资源？
最多能装多少？
还能再装多少？
```

它们分别对应：

```js
store.getUsedCapacity(resource)
store.getCapacity(resource)
store.getFreeCapacity(resource)
```

本文重点不是背 API 名称，而是理解：

- 通用 Store 与受限 Store 的行为不同；
- `resource` 参数是否省略会改变返回值含义；
- `0` 表示合法但当前没有，`null` 表示该容量查询不适用或资源无效；
- 对 Storage 传入某个资源，剩余容量仍然是共享空间；
- Spawn、Extension、Tower、Lab、Power Spawn、Nuker 等结构必须按资源查询；
- Tombstone 与 Ruin 可以读取已用资源，但没有可写入容量；
- 动作数量应使用来源库存、目标空间和 Creep 空间的最小值。

## 快速答案

读取某种资源当前数量：

```js
const energy = object.store.getUsedCapacity(
  RESOURCE_ENERGY
);
```

读取通用 Store 的总已用容量：

```js
const totalUsed = object.store.getUsedCapacity();
```

读取目标还能接收多少 Energy：

```js
const freeEnergy = object.store.getFreeCapacity(
  RESOURCE_ENERGY
);
```

读取该 Store 对 Energy 的容量：

```js
const energyCapacity = object.store.getCapacity(
  RESOURCE_ENERGY
);
```

生产代码不要把返回值直接用于真假判断：

```js
if (store.getFreeCapacity(RESOURCE_ENERGY)) {
  // 0 和 null 都会进入 false
}
```

应显式区分：

```js
const free = store.getFreeCapacity(
  RESOURCE_ENERGY
);

if (free === null) {
  return {
    status: 'resource-not-supported'
  };
}

if (free === 0) {
  return {
    status: 'store-full'
  };
}
```

## Store 有两种基本类型

官方文档把 Store 分为两类。

### 通用 Store

可以在同一总容量里保存多种资源，例如：

- Creep；
- Container；
- Storage；
- Terminal；
- Factory。

假设 Storage 总容量为 1,000,000，当前有：

```text
Energy 600,000
H 20,000
Power 5,000
```

总已用容量是：

```text
625,000
```

剩余共享容量是：

```text
375,000
```

因此：

```js
storage.store.getFreeCapacity(
  RESOURCE_ENERGY
);

storage.store.getFreeCapacity(
  RESOURCE_HYDROGEN
);
```

都会返回同一个共享剩余空间，而不是分别为每种资源保留独立格子。

### 受限 Store

只能存放结构允许的少数资源，例如：

- Spawn 与 Extension 只接收 Energy；
- Tower 只接收 Energy；
- Power Spawn 分别保存 Energy 与 Power；
- Nuker 分别保存 Energy 与 Ghodium；
- Lab 分别保存 Energy 与一种 Mineral/Compound。

对这类 Store，建议始终传入明确资源：

```js
spawn.store.getFreeCapacity(
  RESOURCE_ENERGY
);
```

而不是：

```js
spawn.store.getFreeCapacity();
```

后者通常返回 `null`，因为“总共享容量”对受限 Store 没有统一含义。

## 三个方法分别回答什么

| 方法 | 回答的问题 |
|---|---|
| `getUsedCapacity(resource)` | 当前已经存了多少 |
| `getFreeCapacity(resource)` | 现在还能再存多少 |
| `getCapacity(resource)` | 对该资源最多能存多少 |

通用 Store 中：

```js
store.getUsedCapacity();
```

通常返回所有资源之和。

受限 Store 中，没有资源参数的容量查询可能返回 `null`。为了代码可移植，应优先使用明确资源参数。

## 直接属性与 `getUsedCapacity()`

下面两种读取方式都常见：

```js
const energyA = creep.store[
  RESOURCE_ENERGY
];

const energyB = creep.store.getUsedCapacity(
  RESOURCE_ENERGY
);
```

公开引擎的 Store 代理会让已知资源键在没有库存时返回 `0`：

```js
container.store[RESOURCE_POWER] === 0
```

但枚举行为不同。`Object.keys(store)` 或 `for...in` 通常只包含当前非零资源。

因此不要通过下面的方法判断某个资源是否合法：

```js
RESOURCE_ENERGY in object.store
Object.keys(object.store).includes(
  RESOURCE_ENERGY
)
```

资源为零时可能不会出现在枚举结果里。读取确定资源时使用：

```js
object.store.getUsedCapacity(resource)
```

或直接属性。

## `0` 与 `null` 必须分开

这是 Store API 最重要的诊断规则。

### 返回 `0`

通常表示：

```text
该资源对 Store 合法，但当前数量或剩余空间为 0
```

例如空 Storage 中：

```js
storage.store.getUsedCapacity(
  RESOURCE_HYDROGEN
) === 0
```

满 Storage 中：

```js
storage.store.getFreeCapacity(
  RESOURCE_ENERGY
) === 0
```

### 返回 `null`

通常表示：

```text
该查询对这个 Store 类型不适用
或该资源不是这个受限 Store 支持的资源
或结构当前没有有效容量
```

例如：

```js
spawn.store.getCapacity(
  RESOURCE_POWER
) === null
```

Tombstone 不能接收资源：

```js
tombstone.store.getFreeCapacity(
  RESOURCE_ENERGY
) === null
```

不要写：

```js
const free = store.getFreeCapacity(resource) || 0;
```

这样会把“不支持”错误地转换成“已满”。

## 建立统一的容量快照

```js
function inspectStoreResource(
  object,
  resourceType
) {
  if (!object?.store) {
    return {
      status: 'store-missing'
    };
  }

  const used = object.store.getUsedCapacity(
    resourceType
  );
  const free = object.store.getFreeCapacity(
    resourceType
  );
  const capacity = object.store.getCapacity(
    resourceType
  );

  return {
    status:
      used === null
      && free === null
      && capacity === null
        ? 'resource-unsupported'
        : 'store-observed',
    resourceType,
    used,
    free,
    capacity
  };
}
```

调用：

```js
console.log(JSON.stringify(
  inspectStoreResource(
    Game.spawns.Spawn1,
    RESOURCE_ENERGY
  )
));
```

不要假设：

```js
used + free === capacity
```

在受限 Store、不可写 Store 或无效资源上，字段可能包含 `null`。只在三个值都为有限数字时检查等式。

```js
function isConsistentCapacity(snapshot) {
  return Number.isFinite(snapshot.used)
    && Number.isFinite(snapshot.free)
    && Number.isFinite(snapshot.capacity)
    && snapshot.used + snapshot.free
      === snapshot.capacity;
}
```

## 通用 Store 的资源参数陷阱

假设 Storage 有：

```text
Energy 700
H 200
总容量 2,000
```

则：

```js
storage.store.getUsedCapacity() === 900
storage.store.getUsedCapacity(RESOURCE_ENERGY) === 700
storage.store.getUsedCapacity(RESOURCE_HYDROGEN) === 200
```

但剩余容量是共享的：

```js
storage.store.getFreeCapacity() === 1100
storage.store.getFreeCapacity(RESOURCE_ENERGY) === 1100
storage.store.getFreeCapacity(RESOURCE_HYDROGEN) === 1100
```

错误理解是：

```text
Energy 还有 1,300 空间
H 还有 1,800 空间
```

这些数字不能同时成立，因为两种资源竞争同一个 1,100 空间。

## Spawn、Extension 与 Tower

这类结构只支持 Energy。

```js
function inspectEnergyOnlyStructure(
  structure
) {
  const used = structure.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const free = structure.store.getFreeCapacity(
    RESOURCE_ENERGY
  );
  const capacity = structure.store.getCapacity(
    RESOURCE_ENERGY
  );

  if (
    used === null
    || free === null
    || capacity === null
  ) {
    return {
      status: 'energy-capacity-unavailable'
    };
  }

  return {
    status: free > 0
      ? 'needs-energy'
      : 'full',
    used,
    free,
    capacity
  };
}
```

对 Spawn 传入 `RESOURCE_POWER` 应返回 `null`，而不是 `0`。这能帮助你发现错误的资源路由。

## Lab 为什么必须传资源

Lab 有两个独立容量区域：

```text
Energy 容量
Mineral/Compound 容量
```

因此：

```js
lab.store.getCapacity(
  RESOURCE_ENERGY
);

lab.store.getCapacity(
  RESOURCE_UTRIUM_HYDRIDE
);
```

返回不同容量。

没有参数时：

```js
lab.store.getCapacity();
lab.store.getFreeCapacity();
```

不能可靠表达“总空间”，通常应视为无效查询。

安全的 Lab 快照：

```js
function inspectLabStore(
  lab,
  mineralType
) {
  return {
    energy: inspectStoreResource(
      lab,
      RESOURCE_ENERGY
    ),
    mineral: inspectStoreResource(
      lab,
      mineralType
    )
  };
}
```

这也适用于 Power Spawn 和 Nuker：分别检查每种受支持资源，不要使用一个总容量值。

## Tombstone 与 Ruin 只有库存，没有可写容量

Tombstone 和 Ruin 可以保存多种遗留资源：

```js
const energy = tombstone.store
  .getUsedCapacity(RESOURCE_ENERGY);

const total = tombstone.store
  .getUsedCapacity();
```

但是它们不是转入目标：

```js
tombstone.store.getCapacity(
  RESOURCE_ENERGY
) === null

tombstone.store.getFreeCapacity(
  RESOURCE_ENERGY
) === null
```

因此目标筛选不能只检查存在 `store`：

```js
function canReceiveResource(
  object,
  resourceType
) {
  if (!object?.store) {
    return false;
  }

  const free = object.store.getFreeCapacity(
    resourceType
  );

  return Number.isFinite(free)
    && free > 0;
}
```

## 非激活结构的特殊状态

公开引擎测试显示，某些非激活的通用 Store 仍能报告当前已用库存，但容量和剩余容量可能返回 `null`。

因此：

```js
object.store.getUsedCapacity(resource)
```

有数字，不代表它当前可以接收资源。

在进行 `transfer()` 前还应检查：

```js
structure.isActive()
```

以及动作返回码。

## 安全计算 withdraw 数量

一次 `withdraw()` 的最大安全数量受两个条件限制：

```text
来源有多少
Creep 还能装多少
```

```js
function calculateWithdrawAmount(
  creep,
  source,
  resourceType,
  requestedAmount = Infinity
) {
  if (!creep?.store || !source?.store) {
    return {
      status: 'store-missing',
      amount: 0
    };
  }

  const available = source.store
    .getUsedCapacity(resourceType);
  const free = creep.store
    .getFreeCapacity(resourceType);

  if (available === null || free === null) {
    return {
      status: 'resource-unsupported',
      amount: 0
    };
  }

  const amount = Math.min(
    available,
    free,
    Number.isFinite(requestedAmount)
      ? Math.max(0, requestedAmount)
      : Infinity
  );

  return {
    status: amount > 0
      ? 'amount-ready'
      : 'nothing-to-withdraw',
    amount,
    available,
    free
  };
}
```

## 安全计算 transfer 数量

一次 `transfer()` 的最大安全数量受两个条件限制：

```text
Creep 有多少
目标还能装多少
```

```js
function calculateTransferAmount(
  creep,
  target,
  resourceType,
  requestedAmount = Infinity
) {
  if (!creep?.store || !target?.store) {
    return {
      status: 'store-missing',
      amount: 0
    };
  }

  const carried = creep.store
    .getUsedCapacity(resourceType);
  const free = target.store
    .getFreeCapacity(resourceType);

  if (carried === null || free === null) {
    return {
      status: 'resource-unsupported',
      amount: 0
    };
  }

  const amount = Math.min(
    carried,
    free,
    Number.isFinite(requestedAmount)
      ? Math.max(0, requestedAmount)
      : Infinity
  );

  return {
    status: amount > 0
      ? 'amount-ready'
      : 'nothing-to-transfer',
    amount,
    carried,
    free
  };
}
```

计算结果仍然只是当前 tick 快照。真实动作应保存返回码，并在后续 tick 验证 Store 变化。

## 不要把动作接受当成容量已经变化

```js
const before = {
  source: source.store.getUsedCapacity(
    resourceType
  ),
  target: target.store.getUsedCapacity(
    resourceType
  )
};

const result = creep.transfer(
  target,
  resourceType,
  amount
);
```

`result === OK` 表示命令被接受，不表示当前脚本读取到的 Store 已立即改变。

保存最小证据：

```js
Memory.storeChecks ??= {};
Memory.storeChecks[creep.name] = {
  resourceType,
  targetId: target.id,
  amount,
  submittedAt: Game.time,
  result,
  before
};
```

下一 tick 再读取相同对象和资源。

## 生成可序列化的 Store 摘要

不要把 Store 对象直接写入 Memory。只保存普通数字和资源名：

```js
function summarizeStore(
  object,
  resourceTypes
) {
  if (!object?.store) {
    return {
      status: 'store-missing'
    };
  }

  const resources = {};

  for (const resourceType of resourceTypes) {
    resources[resourceType] = {
      used: object.store.getUsedCapacity(
        resourceType
      ),
      free: object.store.getFreeCapacity(
        resourceType
      ),
      capacity: object.store.getCapacity(
        resourceType
      )
    };
  }

  return {
    status: 'store-summarized',
    objectId: object.id ?? null,
    objectType:
      object.structureType
      ?? object.constructor?.name
      ?? 'unknown',
    totalUsed: object.store.getUsedCapacity(),
    resources
  };
}
```

## 常见错误

### 使用旧的 `carry` 与 `carryCapacity`

现代代码应使用：

```js
creep.store
creep.store.getFreeCapacity()
```

### 用真假判断混淆 `0` 与 `null`

```js
if (!free) {
  // 无法知道是已满还是不支持
}
```

### 对受限 Store 省略资源参数

Spawn、Lab、Power Spawn、Nuker 等结构应明确传资源。

### 认为通用 Store 每种资源有独立空间

Storage 的 Energy、Mineral、Power 和 Commodity 共用同一个剩余容量。

### 使用 `Object.keys(store)` 判断所有资源

枚举通常只显示非零资源。

### 只检查 `object.store` 就把它当作 transfer 目标

Tombstone 和 Ruin 有 Store，但不能接收资源。

### 把 `getUsedCapacity()` 有数字理解为结构可用

非激活结构可能保留库存读数，但容量与可写空间无效。

### 动作返回 `OK` 后立即读取新容量

动作效果应在后续 tick 验证。

## 建议的 Store 排查清单

1. 确认对象存在并具有 `store`。
2. 判断它是通用 Store、受限 Store，还是只读遗留 Store。
3. 受限 Store 始终传入 `resourceType`。
4. 分别记录 `used`、`free` 和 `capacity`。
5. 显式区分 `0` 与 `null`。
6. 通用 Store 的不同资源共享剩余容量。
7. Lab、Power Spawn、Nuker 分资源检查。
8. Tombstone 与 Ruin 只使用 `getUsedCapacity()`。
9. 计算动作数量时取来源库存与目标空间的最小值。
10. 保存动作返回码，在后续 tick 验证 Store 差值。

## 验证状态与适用边界

仓库会对本文 JavaScript 代码块执行语法检查，并通过离线用例验证：

- 通用 Store 的总已用容量；
- 共享剩余容量；
- Energy-only Store 的合法与非法资源；
- Lab 的 Energy 与 Mineral 独立容量；
- Tombstone/Ruin 的只读 Store；
- `0` 与 `null` 分类；
- withdraw 与 transfer 安全数量；
- 后续 tick Store 差值状态。

这些测试不能模拟官方 shard 的真实动作结算、Power 效果、结构激活状态变化、并发运输者竞争或实际 CPU 成本。因此 `consoleTested` 与 `liveTested` 保持为 `false`。

## 相关站内内容

- [从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [回收 Tombstone 与 Ruin 资源](/blog/screeps-tombstone-ruin-recovery)
- [Storage 中的 Energy 怎么使用](/blog/screeps-storage-energy-usage)
- [Link 如何传输 Energy](/blog/screeps-link-transfer-energy)
- [Terminal 如何发送资源](/blog/screeps-terminal-send-resources)
- [房间 EnergyAvailable 一直上不去怎么办](/blog/screeps-room-energyavailable-stuck)
- [Lab 如何运行反应](/blog/screeps-lab-run-reaction)
- [Power Spawn 如何处理 Power](/blog/screeps-power-spawn-process-power)

## 官方与源码资料

- [Store API](https://docs.screeps.com/api/#Store)
- [Creeps and resources](https://docs.screeps.com/creeps.html)
- [Screeps Engine Store implementation](https://github.com/screeps/engine/blob/master/src/game/store.js)
- [Screeps Engine Store tests](https://github.com/screeps/engine/blob/master/spec/engine/game/storeSpec.js)
