---
title: "StructurePowerSpawn.processPower() 怎么安全处理 Power"
description: "解释每个基础Power需要50 Energy、GPL进度、PWR_OPERATE_POWER效果、房间Energy保留线与主要返回码，并提供带启用状态和下一tick核对的Power Spawn示例。"
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
  testEnvironment: "Node.js 24 离线模拟（基础资源预算、启用状态、保留线与前后差值，不是 Screeps 官方服务器）"
  testResult: "未启用、计划量无效、Power不足、Energy不足、房间保留线、基础计划、Power效果计划与快照差值场景通过。"
featured: false
---

`StructurePowerSpawn.processPower()` 会消耗 Power Spawn 中的 `RESOURCE_POWER` 和 `RESOURCE_ENERGY`，增加账号的 `Game.gpl.progress`。

本文只解决一个问题：怎样持续但可控地执行 Power 处理，并在每次调用前核对结构、资源计划、房间 Energy 保留线和返回值。

## 基础处理比例

没有额外 Power 效果时，每次基础处理需要：

```text
1 Power
+ POWER_SPAWN_ENERGY_RATIO Energy
→ 增加 GPL 进度
```

当前 `POWER_SPAWN_ENERGY_RATIO` 为 50。代码应使用常量：

```js
const energyRequired =
  plannedPower * POWER_SPAWN_ENERGY_RATIO;
```

不要把 50 分散写在多个业务模块里。

## `PWR_OPERATE_POWER` 会提高处理速度

Operator 的 `PWR_OPERATE_POWER` 可以提高 Power Spawn 每 tick 的处理量。当前计划量可从结构的 `effects` 与 `POWER_INFO` 中读取。

```js
function getOperatePowerEffect(powerSpawn) {
  const effects = Array.isArray(powerSpawn.effects)
    ? powerSpawn.effects
    : [];

  return effects.find(
    effect => effect.effect === PWR_OPERATE_POWER
  ) || null;
}

function getPlannedPowerAmount(powerSpawn) {
  const effect = getOperatePowerEffect(powerSpawn);

  if (!effect || !Number.isInteger(effect.level)) {
    return 1;
  }

  const values = POWER_INFO[PWR_OPERATE_POWER]?.effect;
  const extra = Array.isArray(values)
    ? values[effect.level - 1]
    : null;

  return Number.isFinite(extra)
    ? 1 + extra
    : 1;
}
```

基础处理量是 1，Power 效果提供额外处理量。若官方常量结构与预期不符，函数退回基础值，最终仍以 `processPower()` 的返回值和后续 tick 的真实变化为准。

## 为什么使用长期启用状态

Power 处理通常是持续生产行为，可以使用显式开关：

```js
Memory.powerProcessing = {
  enabled: true,
  powerSpawnId: '替换为 Power Spawn ID',
  energyReserve: 100000
};
```

Power 处理属于持续资源行为，不需要每 tick 人工确认同一轮调用；但仍应保留：

- 可关闭的 `enabled`；
- Power Spawn ID；
- 房间 Energy 保留线；
- 当前资源检查；
- 返回值和前置快照；
- 资源不足时正常等待。

## 房间 Energy 统计不要依赖自定义属性

`room.powerSpawn` 不是标准 `Room` API 属性。除非项目自己扩展了原型，否则不要直接读取它。

本文把已经恢复的 Power Spawn 显式传入：

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

这样代码不依赖未声明的 `room.powerSpawn`。

## 可离线测试的计划函数

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

保留线是本站业务策略，不是官方限制。

## 完整示例

代码放在 `main` 模块。

```js
function getOperatePowerEffect(powerSpawn) {
  const effects = Array.isArray(powerSpawn.effects)
    ? powerSpawn.effects
    : [];

  return effects.find(
    effect => effect.effect === PWR_OPERATE_POWER
  ) || null;
}

function getPlannedPowerAmount(powerSpawn) {
  const effect = getOperatePowerEffect(powerSpawn);

  if (!effect || !Number.isInteger(effect.level)) {
    return 1;
  }

  const values = POWER_INFO[PWR_OPERATE_POWER]?.effect;
  const extra = Array.isArray(values)
    ? values[effect.level - 1]
    : null;

  return Number.isFinite(extra)
    ? 1 + extra
    : 1;
}

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
    || !powerSpawn.isActive()
  ) {
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
    powerSpawn.room,
    powerSpawn
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

  config.lastBefore = {
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
  config.lastStatus = result === OK
    ? 'accepted'
    : 'failed';

  if (result !== OK || Game.time % 100 === 0) {
    console.log({
      type: 'process-power-result',
      powerSpawn: powerSpawn.id,
      plannedPower: plan.plannedPower,
      plannedEnergy: plan.energyRequired,
      result
    });
  }
};
```

## 为什么保留房间 Energy 底线

持续处理会长期消耗 Energy。只检查 Power Spawn 本地库存，无法判断这批消耗是否会影响：

- Spawn 孵化；
- Controller 升级；
- Tower 防御；
- Terminal 物流；
- Factory 或 Lab 任务。

示例把 Storage、Terminal 和 Power Spawn 的 Energy 合并为一个简单预算，再检查本次计划后是否低于配置线。

这不是完整房间经济模型，但能阻止最直接的过度消耗。

## 主要返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 命令已安排 | 下一 tick 查看 GPL 与 Store 变化 |
| `ERR_NOT_OWNER` | Power Spawn 不是自己的 | ID 与所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | Power 或 Energy 不足 | 两种资源与计划处理量 |
| `ERR_RCL_NOT_ENOUGH` | 房间等级不足 | RCL 与 `isActive()` |

不要把其他结构的返回码复制进本文。

## 下一 tick 怎样核对

提交前已经保存：

- `Game.gpl.progress`；
- Power 数量；
- Energy 数量；
- 计划处理量；
- 当前 tick。

下一 tick 可比较：

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

真实房间中，物流 Creep 可能同时补充资源，所以 Store 差值不一定完全来自本次处理。需要结合物流日志判断。

## 离线模拟结果

构建检查覆盖：

1. 未启用时不执行；
2. 计划量无效；
3. Power 不足；
4. Power Spawn 本地 Energy 不足；
5. 房间 Energy 会跌破保留线；
6. 基础计划为 1 Power 和 50 Energy；
7. Power 效果计划会同步提高资源需求；
8. 前后快照差值计算。

离线模拟没有调用真实 `processPower()`，也没有模拟 `PWR_OPERATE_POWER` 的服务器结算。

## 常见误区

### 使用非官方 `room.powerSpawn`

除非项目自己扩展了 Room 原型，否则应显式传入结构对象。

### 只检查 1 Power 和 50 Energy

存在 Power 效果时，当前计划量可能更高。

### 不设置房间 Energy 保留线

长期处理可能影响孵化、防御和升级。

### `OK` 后同 tick 读取 GPL 差值

命令结算在脚本执行之后，应在下一 tick 核对。

### 把 Store 差值全部归因于处理

物流 Creep 可能同时补充 Power 或 Energy。

### 一次 `OK` 就写成长期稳定

仍需观察持续补给、Power 效果变化和房间预算。

## 适用边界

本文没有实现：

- Power Bank 采集；
- Power 跨房间物流；
- Power Creep 创建与技能；
- Operator 调度；
- 多 Power Spawn 预算；
- 长期 GPL 统计；
- 自动采购 Power；
- 完整房间经济优先级。

JavaScript 语法和资源计划离线模拟已经通过。真实 Power 处理、Power 效果和连续运行仍待 Screeps 环境验证。

## 相关站内内容

- [StructureFactory.produce() 怎么生产商品](/blog/screeps-factory-produce)
- [Terminal.send() 怎么发送资源](/blog/screeps-terminal-send-resources)
- [Game.cpu.getUsed() 和 bucket 怎么监控](/blog/screeps-cpu-getused-bucket)
- [Screeps Storage 中的 Energy 怎么使用](/blog/screeps-storage-energy-usage)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [进入市场与高级资源模块](/knowledge/market-advanced-resources)

## 官方资料

- [StructurePowerSpawn.processPower API](https://docs.screeps.com/api/#StructurePowerSpawn.processPower)
- [Power 系统](https://docs.screeps.com/power.html)
- [全局常量：Power Spawn](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线资源计划模拟已通过；真实 Power 处理仍待环境验证。
