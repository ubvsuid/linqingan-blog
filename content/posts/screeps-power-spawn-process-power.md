---
title: "StructurePowerSpawn.processPower() 怎么安全处理 Power"
description: "解释每个基础Power需要50 Energy、GPL进度、PWR_OPERATE_POWER效果、资源预算与全部返回码，并提供带启用状态和下一tick核对的Power Spawn示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Power Spawn"
  - "Power"
  - "高级资源"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（基础资源预算、启用状态和下一tick差值，不是 Screeps 官方服务器）"
  testResult: "结构缺失、未启用、资源不足、基础处理量、Power效果处理量与结果核对场景通过。"
featured: false
---

`StructurePowerSpawn.processPower()` 会把 Power Spawn中的 Power资源注册到账号，用于增加 `Game.gpl.progress`并发展Power Creep。

本文只解决一个问题：怎样持续但可控地执行Power处理，并核对基础资源比例、结构状态、Power效果与下一 tick 的真实变化。

## 基础处理比例

官方Power文档说明，基础处理会把：

```text
1 Power
+ 50 Energy
→ 1点 GPL进度
```

Energy比例应使用：

```js
POWER_SPAWN_ENERGY_RATIO
```

当前值为50。

基础资源检查：

```js
const powerAvailable = powerSpawn.store.getUsedCapacity(
  RESOURCE_POWER
);
const energyAvailable = powerSpawn.store.getUsedCapacity(
  RESOURCE_ENERGY
);

const canProcessBase =
  powerAvailable >= 1
  && energyAvailable >= POWER_SPAWN_ENERGY_RATIO;
```

## `PWR_OPERATE_POWER` 会改变每 tick 处理量

Operator的 `PWR_OPERATE_POWER`效果可以提高Power Spawn每 tick 的处理速度。

因此只检查1 Power和50 Energy，可能不足以覆盖当前效果希望处理的全部数量。可以读取结构效果：

```js
function getOperatePowerEffect(powerSpawn) {
  return powerSpawn.effects.find(
    effect => effect.effect === PWR_OPERATE_POWER
  ) || null;
}
```

官方Power资料给出的提升值按Power等级增加。实际计划应从：

```js
POWER_INFO[PWR_OPERATE_POWER]
```

读取，而不是在文章代码里复制一份固定表。

## 怎样计算计划处理量

```js
function getPlannedPowerAmount(powerSpawn) {
  const effect = getOperatePowerEffect(powerSpawn);

  if (!effect || !Number.isInteger(effect.level)) {
    return 1;
  }

  const effectValues = POWER_INFO[PWR_OPERATE_POWER]?.effect;
  const extra = Array.isArray(effectValues)
    ? effectValues[effect.level - 1]
    : null;

  return Number.isFinite(extra)
    ? 1 + extra
    : 1;
}
```

基础处理量是1，Power效果提供额外处理速度。

如果当前官方常量结构或服务器实现与预期不同，函数会退回基础值1，最终仍以 `processPower()`返回值和下一 tick Store变化为准。

## 持续处理与一次性高影响操作不同

Power处理通常是持续型生产行为，不像市场成交那样每次都需要人工选择对手订单。

因此可以使用长期启用状态：

```js
Memory.powerProcessing = {
  enabled: true,
  powerSpawnId: '替换为Power Spawn ID',
  energyReserve: 100000
};
```

但仍应保留：

- 显式启用开关；
- Storage或Terminal的Energy保留线；
- 当前结构资源检查；
- 返回值记录；
- 低频日志；
- 资源耗尽后的正常等待。

## 可测试的计划函数

```js
function evaluatePowerPlan(input) {
  const {
    enabled,
    plannedPower,
    powerAvailable,
    energyAvailable,
    energyReserve,
    roomEnergyStock
  } = input;

  if (!enabled) {
    return { ready: false, reason: 'disabled' };
  }

  if (!Number.isInteger(plannedPower) || plannedPower <= 0) {
    return { ready: false, reason: 'invalid-plan' };
  }

  const energyRequired =
    plannedPower * POWER_SPAWN_ENERGY_RATIO;

  if (powerAvailable < plannedPower) {
    return {
      ready: false,
      reason: 'power-shortage',
      powerRequired: plannedPower,
      powerAvailable
    };
  }

  if (energyAvailable < energyRequired) {
    return {
      ready: false,
      reason: 'power-spawn-energy-shortage',
      energyRequired,
      energyAvailable
    };
  }

  if (
    Number.isFinite(energyReserve)
    && Number.isFinite(roomEnergyStock)
    && roomEnergyStock - energyRequired < energyReserve
  ) {
    return {
      ready: false,
      reason: 'room-energy-reserve',
      energyRequired,
      roomEnergyStock,
      energyReserve
    };
  }

  return {
    ready: true,
    reason: 'ready',
    plannedPower,
    energyRequired
  };
}
```

## 完整示例

代码放在 `main` 模块。

```js
function getOperatePowerEffect(powerSpawn) {
  return powerSpawn.effects.find(
    effect => effect.effect === PWR_OPERATE_POWER
  ) || null;
}

function getPlannedPowerAmount(powerSpawn) {
  const effect = getOperatePowerEffect(powerSpawn);

  if (!effect || !Number.isInteger(effect.level)) {
    return 1;
  }

  const effectValues = POWER_INFO[PWR_OPERATE_POWER]?.effect;
  const extra = Array.isArray(effectValues)
    ? effectValues[effect.level - 1]
    : null;

  return Number.isFinite(extra)
    ? 1 + extra
    : 1;
}

function getRoomEnergyStock(room) {
  const storageEnergy = room.storage
    ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;
  const terminalEnergy = room.terminal
    ? room.terminal.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;
  const powerSpawnEnergy = room.powerSpawn
    ? room.powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;

  return storageEnergy + terminalEnergy + powerSpawnEnergy;
}

function evaluatePowerPlan(input) {
  const {
    enabled,
    plannedPower,
    powerAvailable,
    energyAvailable,
    energyReserve,
    roomEnergyStock
  } = input;

  if (!enabled) {
    return { ready: false, reason: 'disabled' };
  }

  if (!Number.isInteger(plannedPower) || plannedPower <= 0) {
    return { ready: false, reason: 'invalid-plan' };
  }

  const energyRequired =
    plannedPower * POWER_SPAWN_ENERGY_RATIO;

  if (powerAvailable < plannedPower) {
    return {
      ready: false,
      reason: 'power-shortage',
      powerRequired: plannedPower,
      powerAvailable
    };
  }

  if (energyAvailable < energyRequired) {
    return {
      ready: false,
      reason: 'power-spawn-energy-shortage',
      energyRequired,
      energyAvailable
    };
  }

  if (
    Number.isFinite(energyReserve)
    && Number.isFinite(roomEnergyStock)
    && roomEnergyStock - energyRequired < energyReserve
  ) {
    return {
      ready: false,
      reason: 'room-energy-reserve',
      energyRequired,
      roomEnergyStock,
      energyReserve
    };
  }

  return {
    ready: true,
    reason: 'ready',
    plannedPower,
    energyRequired
  };
}

module.exports.loop = function () {
  const config = Memory.powerProcessing;

  if (
    !config
    || config.enabled !== true
    || typeof config.powerSpawnId !== 'string'
  ) {
    return;
  }

  const powerSpawn = Game.getObjectById(
    config.powerSpawnId
  );

  if (
    !powerSpawn
    || powerSpawn.structureType !== STRUCTURE_POWER_SPAWN
    || powerSpawn.my !== true
  ) {
    return;
  }

  if (!powerSpawn.isActive()) {
    return;
  }

  const plannedPower = getPlannedPowerAmount(powerSpawn);
  const powerAvailable = powerSpawn.store.getUsedCapacity(
    RESOURCE_POWER
  );
  const energyAvailable = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const roomEnergyStock = getRoomEnergyStock(
    powerSpawn.room
  );

  const plan = evaluatePowerPlan({
    enabled: config.enabled,
    plannedPower,
    powerAvailable,
    energyAvailable,
    energyReserve: config.energyReserve,
    roomEnergyStock
  });

  if (!plan.ready) {
    config.lastStatus = plan.reason;
    config.lastCheckedAt = Game.time;
    return;
  }

  const before = {
    gameTick: Game.time,
    gplProgress: Game.gpl.progress,
    power: powerAvailable,
    energy: energyAvailable,
    plannedPower: plan.plannedPower,
    plannedEnergy: plan.energyRequired
  };

  const result = powerSpawn.processPower();

  config.lastResult = result;
  config.lastResultAt = Game.time;
  config.lastBefore = before;
  config.lastStatus = result === OK
    ? 'accepted'
    : 'failed';

  if (result !== OK || Game.time % 100 === 0) {
    console.log({
      type: 'process-power-result',
      powerSpawn: powerSpawn.id,
      result,
      plannedPower: plan.plannedPower,
      plannedEnergy: plan.energyRequired,
      gplProgress: Game.gpl.progress
    });
  }
};
```

## `room.powerSpawn` 是否一定存在

`Room` API通常可以通过查找结构获得Power Spawn，但业务代码不应假设自定义属性永远存在。

上面的 `getRoomEnergyStock()`为了展示汇总使用了 `room.powerSpawn`；若当前项目没有给 Room原型添加该属性，应改为直接使用已经恢复的 `powerSpawn`参数：

```js
function getRoomEnergyStock(room, powerSpawn) {
  // 使用显式参数，不依赖自定义原型属性
}
```

在本站完整示例中，更稳妥的实际调用应将 `powerSpawn`显式传入。若直接复制代码，请采用这一版本：

```js
function getRoomEnergyStock(room, powerSpawn) {
  const storageEnergy = room.storage
    ? room.storage.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;
  const terminalEnergy = room.terminal
    ? room.terminal.store.getUsedCapacity(RESOURCE_ENERGY)
    : 0;
  const localEnergy = powerSpawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  return storageEnergy + terminalEnergy + localEnergy;
}
```

并把调用改为：

```js
const roomEnergyStock = getRoomEnergyStock(
  powerSpawn.room,
  powerSpawn
);
```

这段修正是为了避免把非官方 `room.powerSpawn`属性当成标准API。

## 为什么保留Energy储备线

每处理1 Power至少消耗50 Energy。持续启用时，Power Spawn可能长期消耗房间资源。

示例通过：

```js
roomEnergyStock - energyRequired < energyReserve
```

避免本次计划让汇总Energy跌破配置线。

这只是本站策略，不是官方限制。保留线需要根据房间升级、防御、孵化和物流需求自行设定。

## 怎样核对下一 tick

提交前记录：

- `Game.gpl.progress`；
- Power Spawn中的Power；
- Power Spawn中的Energy；
- 计划处理量；
- 当前tick。

下一 tick 可以比较：

```js
function inspectPreviousProcessing(powerSpawn, before) {
  return {
    gplDelta: Game.gpl.progress - before.gplProgress,
    powerDelta:
      before.power
      - powerSpawn.store.getUsedCapacity(RESOURCE_POWER),
    energyDelta:
      before.energy
      - powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY)
  };
}
```

但真实房间中物流Creep可能同时补充资源，因此Store差值不一定等于纯处理消耗。需要结合事件时序和物流日志判断。

## 主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 命令已安排 | 下一 tick 查看GPL与Store变化 |
| `ERR_NOT_OWNER` | Power Spawn不是自己的 | ID与所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | Energy或Power不足 | 两种资源与Power效果计划量 |
| `ERR_RCL_NOT_ENOUGH` | 房间等级不足 | RCL与 `isActive()` |

API没有为 `processPower()`列出 `ERR_TIRED`。不要把其他结构的返回码复制到本文。

## `OK`不等于长期处理稳定

一次返回 `OK`只能说明当前 tick 命令被安排。长期系统还要观察：

- Power物流是否持续；
- Energy补给是否影响其他房间任务；
- Power效果开始和结束时计划量是否变化；
- GPL进度是否符合预期；
- CPU与日志成本；
- 房间RCL或所有权变化；
- 多个Power Spawn的资源预算关系。

## 离线模拟结果

构建检查对计划函数覆盖：

1. 未启用时不执行；
2. 计划量无效；
3. Power不足；
4. Power Spawn内Energy不足；
5. 房间Energy会跌破保留线；
6. 基础计划为1 Power和50 Energy；
7. Power效果计划量会同步提高资源需求；
8. 下一 tick差值计算使用前后快照。

离线模拟没有调用真实 `processPower()`，也没有模拟 `PWR_OPERATE_POWER`的服务器结算。

## 常见误区

### 只检查1 Power和50 Energy

存在Power效果时，当前处理速度可能更高，应按计划量准备资源，并保留API失败处理。

### 把Power处理写成一次性市场式开关

持续处理可以长期启用，但仍需要资源预算和关闭入口。

### 不设置房间Energy保留线

长期消耗可能影响孵化、升级或防御。

### 使用不存在的 `room.powerSpawn`

除非项目自己扩展了 Room原型，否则应显式传入结构对象。

### `OK`后同 tick读取GPL差值

命令结算在脚本执行之后，应该下一 tick核对。

### 把Store差值完全归因于处理

物流Creep可能同时补充Power或Energy。

## 适用边界

本文没有实现：

- Power Bank采集；
- Power跨房间物流；
- Power Creep创建与技能；
- Operator调度；
- 多Power Spawn预算；
- 长期GPL统计；
- 自动采购Power；
- 房间经济优先级；
- 外部监控。

JavaScript语法和资源计划离线模拟已经通过。真实Power处理、Power效果与连续运行仍待Screeps环境验证。

## 相关站内内容

- [StructureFactory.produce() 怎么生产商品](/blog/screeps-factory-produce)
- [Terminal.send() 怎么发送资源](/blog/screeps-terminal-send-resources)
- [Game.cpu.getUsed() 和 bucket 怎么监控](/blog/screeps-cpu-getused-bucket)
- [Screeps Storage中的Energy怎么使用](/blog/screeps-storage-energy-usage)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [StructurePowerSpawn.processPower API](https://docs.screeps.com/api/#StructurePowerSpawn.processPower)
- [Power系统](https://docs.screeps.com/power.html)
- [全局常量：Power Spawn](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线资源计划模拟已通过；真实Power处理仍待环境验证。
