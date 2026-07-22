---
title: "Screeps 如何按房间 Energy 动态生成 Creep 身体"
description: "根据room.energyAvailable、角色最低身体和50部件上限组装Worker，计算成本、生成时间、退化方案与spawnCreep返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Spawn"
  - "Creep Body"
  - "Energy"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（官方部件成本、50部件上限、最低身体、当前Energy与生成时间，不是Screeps官方服务器）"
  testResult: "0、199、200、550、3200和10000 Energy、最低身体不足、48部件上限、成本和生成时间场景通过。"
featured: false
---

动态身体不是“把当前Energy全部花完”，而是根据角色最低能力、房间当前可用Energy和50部件上限，生成一套仍然能完成任务的body。

本文以重复的 `[WORK, CARRY, MOVE]` Worker为例，处理：

- 最低200 Energy身体；
- 当前可用Energy；
- 50部件上限；
- 部件成本；
- 生成时间；
- Spawn忙碌、名称冲突和正式返回值。

## `energyAvailable` 与 `energyCapacityAvailable`

```js
room.energyAvailable
```

表示当前房间所有Spawn和Extension中已经装入、可用于生成的Energy。

```js
room.energyCapacityAvailable
```

表示这些结构的总容量，不代表当前已经有这么多Energy。

两种常见策略：

```text
按 energyAvailable
→ 现在能负担多少就生成多少
→ 适合应急恢复

按 energyCapacityAvailable 等待
→ 等房间装满后生成完整身体
→ 适合普通补员
```

本文使用当前 `energyAvailable`，因此身体可能在房间能量未装满时退化。

## 一组Worker的成本

```js
const WORKER_UNIT = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        `unknown body part: ${String(part)}`
      );
    }

    return total + cost;
  }, 0);
}
```

使用官方常量时，一组成本为200 Energy，但代码不把这个数字散落到多个判断里。

## 为什么最多16组

每组3个部件，Creep最多50个部件：

```text
16组 × 3 = 48个部件
17组 × 3 = 51个部件
```

因此最多16组。

## 纯函数组装身体

```js
function buildRepeatedBody(input) {
  const {
    energyAvailable,
    unit,
    maximumParts = 50,
    maximumUnits = Infinity
  } = input;

  if (
    !Number.isFinite(energyAvailable)
    || energyAvailable < 0
    || !Array.isArray(unit)
    || unit.length === 0
    || !Number.isInteger(maximumParts)
    || maximumParts < 1
  ) {
    return {
      valid: false,
      reason: 'invalid-input',
      body: []
    };
  }

  const unitCost = getBodyCost(unit);
  const unitsByEnergy = Math.floor(
    energyAvailable / unitCost
  );
  const unitsByParts = Math.floor(
    maximumParts / unit.length
  );
  const units = Math.max(
    0,
    Math.min(
      unitsByEnergy,
      unitsByParts,
      maximumUnits
    )
  );
  const body = [];

  for (let index = 0; index < units; index += 1) {
    body.push(...unit);
  }

  return {
    valid: true,
    reason: body.length > 0
      ? 'ready'
      : 'energy-below-minimum',
    body,
    units,
    unitCost,
    bodyCost: units * unitCost,
    spawnTime: body.length * CREEP_SPAWN_TIME
  };
}
```

`CREEP_SPAWN_TIME`是每个身体部件所需的基础生成tick数。48部件会比3部件占用Spawn更久，因此动态扩大身体也会影响补员提前量。

## 部件顺序不只是外观

Creep受伤时，身体数组前面的部件先承受伤害。

重复：

```js
[WORK, CARRY, MOVE, WORK, CARRY, MOVE]
```

与分组：

```js
[WORK, WORK, CARRY, CARRY, MOVE, MOVE]
```

成本相同，但受伤后的能力损失顺序不同。

本文使用重复单元，目的是保持每组比例，不声称它适合所有角色。战斗单位、固定升级者和运输者应分别设计顺序。

## 完整生成示例

```js
const WORKER_UNIT = [WORK, CARRY, MOVE];

function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        `unknown body part: ${String(part)}`
      );
    }

    return total + cost;
  }, 0);
}

function buildRepeatedBody(input) {
  const {
    energyAvailable,
    unit,
    maximumParts = 50,
    maximumUnits = Infinity
  } = input;

  if (
    !Number.isFinite(energyAvailable)
    || energyAvailable < 0
    || !Array.isArray(unit)
    || unit.length === 0
    || !Number.isInteger(maximumParts)
    || maximumParts < 1
  ) {
    return {
      valid: false,
      reason: 'invalid-input',
      body: []
    };
  }

  const unitCost = getBodyCost(unit);
  const unitsByEnergy = Math.floor(
    energyAvailable / unitCost
  );
  const unitsByParts = Math.floor(
    maximumParts / unit.length
  );
  const units = Math.max(
    0,
    Math.min(
      unitsByEnergy,
      unitsByParts,
      maximumUnits
    )
  );
  const body = [];

  for (let index = 0; index < units; index += 1) {
    body.push(...unit);
  }

  return {
    valid: true,
    reason: body.length > 0
      ? 'ready'
      : 'energy-below-minimum',
    body,
    units,
    unitCost,
    bodyCost: units * unitCost,
    spawnTime: body.length * CREEP_SPAWN_TIME
  };
}

function createUniqueName(spawn, role) {
  return `${role}-${spawn.name}-${Game.time}`;
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;

  if (!spawn || spawn.spawning) {
    return;
  }

  const existingWorkers = Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === 'worker'
    );

  if (existingWorkers.length > 0) {
    return;
  }

  const plan = buildRepeatedBody({
    energyAvailable: spawn.room.energyAvailable,
    unit: WORKER_UNIT,
    maximumParts: 50,
    maximumUnits: 16
  });

  if (!plan.valid || plan.body.length === 0) {
    return;
  }

  const name = createUniqueName(spawn, 'Worker');
  const dryRunResult = spawn.spawnCreep(
    plan.body,
    name,
    {
      memory: {
        role: 'worker',
        bodyUnits: plan.units,
        memoryVersion: 1
      },
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    console.log({
      type: 'dynamic-body-dry-run-failed',
      spawnName: spawn.name,
      name,
      dryRunResult,
      plan
    });
    return;
  }

  const result = spawn.spawnCreep(
    plan.body,
    name,
    {
      memory: {
        role: 'worker',
        bodyUnits: plan.units,
        memoryVersion: 1
      }
    }
  );

  if (result !== OK) {
    console.log({
      type: 'dynamic-body-spawn-failed',
      spawnName: spawn.name,
      name,
      result,
      plan
    });
  }
};
```

## 为什么设置角色最大组数

即使房间拥有高Energy容量，也不代表普通Worker应该自动扩大到48部件。

可以为角色设置上限：

```js
maximumUnits: 5
```

理由可能包括：

- 单只Creep任务吞吐已经足够；
- 生成时间过长；
- 需要把Energy留给其他角色；
- 过大身体移动太慢；
- 房间需要多只并行单位而不是一只大型单位。

角色上限属于项目配置，不是官方数值。

## 动态身体的最低能力

不同角色最低body不同：

```text
采集并携带
→ 至少 WORK + CARRY + MOVE

固定采集到Container
→ 可能不需要CARRY，但仍要根据位置和补员设计MOVE

侦察
→ MOVE

占领
→ CLAIM + MOVE
```

不能用同一个重复单元生成所有角色。

## 什么时候应该等待更高Energy

当前房间有350 Energy时，示例会生成一组200 Energy的Worker，剩余150 Energy不参与身体。

是否立即生成取决于角色优先级：

- 采集者为0：立即生成最低可用身体；
- 普通Builder不足：可能等待更大身体；
- 防御紧急：根据当前Energy生成退化方案；
- 现有角色寿命充足：可以等待目标容量。

动态身体函数只负责组装，不负责决定何时生成。

## 返回值排查

`spawnCreep()`失败时重点检查：

- `ERR_BUSY`：同一Spawn已被其他流程使用；
- `ERR_NAME_EXISTS`：命名冲突；
- `ERR_NOT_ENOUGH_ENERGY`：计算后到正式调用前状态变化，或能量结构配置不同；
- `ERR_INVALID_ARGS`：body为空、超过50部件、未知部件、名称或选项不合法；
- `ERR_NOT_OWNER`、`ERR_RCL_NOT_ENOUGH`：Spawn所有权或结构可用性。

`spawnCreep()`不会返回 `ERR_NOT_IN_RANGE`。

## 离线模拟结果

现有构建模拟覆盖：

| 可用Energy | body长度 | 成本 |
|---:|---:|---:|
| 0 | 0 | 0 |
| 199 | 0 | 0 |
| 200 | 3 | 200 |
| 550 | 6 | 400 |
| 3200 | 48 | 3200 |
| 10000 | 48 | 3200 |

本次维护还要求验证：

- 空单元与非法Energy；
- 50部件上限；
- 角色最大组数；
- `bodyCost`；
- `spawnTime`；
- body始终只包含完整单元。

离线模拟不证明Spawn存在，也不证明正式调用返回 `OK`。

## 适用边界

本文只展示重复Worker单元，不覆盖：

- 多角色身体模板；
- 地形负载精确计算；
- 空CARRY对fatigue的影响；
- Boost；
- 受伤部件能力；
- 多Spawn队列；
- 提前替代时间；
- 房间吞吐优化。

JavaScript语法、成本和上限已离线检查，真实生成与角色效率仍待Screeps环境验证。

## 相关站内内容

- [Creep身体计算器](/tools/creep-body-calculator)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [MOVE与fatigue怎样配比](/blog/screeps-move-fatigue-body-ratio)
- [spawnCreep()失败怎么查](/blog/screeps-spawncreep-return-codes)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [进入Spawn与Creep生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)
- [Room.energyAvailable API](https://docs.screeps.com/api/#Room-energyAvailable)
- [Constants：BODYPART_COST与CREEP_SPAWN_TIME](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线身体组装模拟已通过；真实Spawn结果仍待环境验证。
