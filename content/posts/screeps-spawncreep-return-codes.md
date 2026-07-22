---
title: "spawnCreep() 失败怎么查：dryRun、参数校验与返回值"
description: "保存StructureSpawn.spawnCreep()的dryRun和正式返回值，检查Spawn状态、名称、身体、Energy、Memory与可选能量结构。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "Spawn"
  - "错误码"
  - "Creep Body"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（名称、身体、成本、Spawn状态、Energy和选项对象，不是Screeps官方服务器）"
  testResult: "Spawn缺失、忙碌、名称无效或重复、身体为空或超限、未知部件、Energy不足、非法Memory和合法请求场景通过。"
featured: false
---

`StructureSpawn.spawnCreep()` 返回错误时，第一步不是反复调用，而是保存返回值，并把问题分成五类：

1. Spawn是否存在、属于自己并且空闲；
2. 名称是否合法且没有重复；
3. body是否由1—50个官方身体部件组成；
4. 当前可用Energy是否足够；
5. `memory`、`energyStructures`、`directions` 等选项是否符合预期。

本文使用 `dryRun` 做预检，再执行一次正式提交。两次结果都要保存，因为同一tick中的其他代码仍可能改变Spawn状态或占用同名Creep。

## `spawnCreep()` 的基本形式

```js
const result = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    memory: {
      role: 'worker'
    }
  }
);
```

返回 `OK` 表示生成命令已经安排，不表示Creep在当前tick已经完成生成。生成状态会出现在：

```js
spawn.spawning
```

新Creep完成所需时间与身体部件数量有关。实际完成状态要在后续tick重新读取。

## body为什么必须先校验

官方API要求body包含1—50个合法身体部件：

```js
WORK
MOVE
CARRY
ATTACK
RANGED_ATTACK
HEAL
TOUGH
CLAIM
```

可以先写纯函数：

```js
const BODY_PARTS = new Set([
  WORK,
  MOVE,
  CARRY,
  ATTACK,
  RANGED_ATTACK,
  HEAL,
  TOUGH,
  CLAIM
]);

function validateBody(body) {
  if (!Array.isArray(body)) {
    return {
      valid: false,
      reason: 'body-not-array'
    };
  }

  if (body.length < 1 || body.length > 50) {
    return {
      valid: false,
      reason: 'body-length-invalid'
    };
  }

  for (const part of body) {
    if (!BODY_PARTS.has(part)) {
      return {
        valid: false,
        reason: 'unknown-body-part'
      };
    }
  }

  return {
    valid: true,
    reason: 'ready'
  };
}
```

## 怎样计算身体成本

```js
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

房间当前可用于生成的总Energy通常读取：

```js
spawn.room.energyAvailable
```

它反映当前Spawn和Extension中的可用Energy，不是房间Storage或Container的库存。

## 名称校验

`spawnCreep()`要求显式提供唯一名称，长度上限为100个字符。

```js
function validateCreepName(name) {
  if (typeof name !== 'string') {
    return {
      valid: false,
      reason: 'name-not-string'
    };
  }

  if (name.length < 1 || name.length > 100) {
    return {
      valid: false,
      reason: 'name-length-invalid'
    };
  }

  if (Game.creeps[name]) {
    return {
      valid: false,
      reason: 'name-exists'
    };
  }

  return {
    valid: true,
    reason: 'ready'
  };
}
```

同名Creep仍在生成时，也可能已经出现在 `Game.creeps` 中。正式结果仍要处理 `ERR_NAME_EXISTS`，不能只依赖前置检查。

## `dryRun` 能检查什么

```js
const check = spawn.spawnCreep(
  body,
  name,
  {
    memory,
    dryRun: true
  }
);
```

`dryRun: true` 只检查当前条件，不开始生成，也不会把正式动作排入队列。

它适合发现：

- Spawn忙碌；
- 名称重复；
- Energy不足；
- body或名称参数不合法；
- RCL不足；
- 所有权问题。

但 `dryRun === OK` 不保证紧接着的正式调用一定返回 `OK`。同一tick其他模块可能先一步调用同一Spawn，或使用了同一个名称。

## 完整的安全提交函数

```js
const BODY_PARTS = new Set([
  WORK,
  MOVE,
  CARRY,
  ATTACK,
  RANGED_ATTACK,
  HEAL,
  TOUGH,
  CLAIM
]);

function validateBody(body) {
  if (!Array.isArray(body)) {
    return {
      valid: false,
      reason: 'body-not-array'
    };
  }

  if (body.length < 1 || body.length > 50) {
    return {
      valid: false,
      reason: 'body-length-invalid'
    };
  }

  for (const part of body) {
    if (!BODY_PARTS.has(part)) {
      return {
        valid: false,
        reason: 'unknown-body-part'
      };
    }
  }

  return {
    valid: true,
    reason: 'ready'
  };
}

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

function validateSpawnRequest(input) {
  const {
    spawn,
    body,
    name,
    memory
  } = input;

  if (!spawn) {
    return {
      valid: false,
      reason: 'spawn-missing'
    };
  }

  if (spawn.spawning) {
    return {
      valid: false,
      reason: 'spawn-busy'
    };
  }

  if (typeof name !== 'string') {
    return {
      valid: false,
      reason: 'name-not-string'
    };
  }

  if (name.length < 1 || name.length > 100) {
    return {
      valid: false,
      reason: 'name-length-invalid'
    };
  }

  if (Game.creeps[name]) {
    return {
      valid: false,
      reason: 'name-exists'
    };
  }

  const bodyCheck = validateBody(body);

  if (!bodyCheck.valid) {
    return bodyCheck;
  }

  if (
    memory !== undefined
    && (
      !memory
      || typeof memory !== 'object'
      || Array.isArray(memory)
    )
  ) {
    return {
      valid: false,
      reason: 'memory-invalid'
    };
  }

  const bodyCost = getBodyCost(body);

  if (spawn.room.energyAvailable < bodyCost) {
    return {
      valid: false,
      reason: 'energy-not-enough',
      bodyCost,
      energyAvailable: spawn.room.energyAvailable
    };
  }

  return {
    valid: true,
    reason: 'ready',
    bodyCost,
    energyAvailable: spawn.room.energyAvailable
  };
}

function submitSpawnRequest(input) {
  const {
    spawn,
    body,
    name,
    memory,
    directions
  } = input;

  const validation = validateSpawnRequest(input);

  if (!validation.valid) {
    return {
      status: 'local-validation-failed',
      ...validation
    };
  }

  const options = {
    memory,
    dryRun: true
  };

  if (Array.isArray(directions)) {
    options.directions = directions;
  }

  const dryRunResult = spawn.spawnCreep(
    body,
    name,
    options
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      dryRunResult,
      ...validation
    };
  }

  const actualOptions = {
    memory
  };

  if (Array.isArray(directions)) {
    actualOptions.directions = directions;
  }

  const result = spawn.spawnCreep(
    body,
    name,
    actualOptions
  );

  return {
    status: result === OK
      ? 'spawn-submitted'
      : 'spawn-failed-after-dry-run',
    dryRunResult,
    result,
    ...validation
  };
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;

  if (!spawn) {
    return;
  }

  const desiredName = 'Worker1';

  if (Game.creeps[desiredName]) {
    return;
  }

  const outcome = submitSpawnRequest({
    spawn,
    body: [WORK, CARRY, MOVE],
    name: desiredName,
    memory: {
      role: 'worker',
      memoryVersion: 1
    },
    directions: [TOP, RIGHT, BOTTOM, LEFT]
  });

  if (outcome.status !== 'spawn-submitted') {
    console.log({
      type: 'spawn-request-failed',
      spawnName: spawn.name,
      creepName: desiredName,
      ...outcome
    });
  }
};
```

这段示例只适合固定名称的单个请求。实际补员系统还需要配额和唯一命名策略。

## `energyStructures` 什么时候使用

默认情况下，Spawn会从同房间的Spawn和Extension取Energy。

可以显式指定顺序：

```js
const energyStructures = [
  spawn,
  ...spawn.room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_EXTENSION
  })
];

const result = spawn.spawnCreep(
  body,
  name,
  {
    memory,
    energyStructures
  }
);
```

官方API会按数组顺序使用这些结构。数组中应只放有效的Spawn和Extension，并确认它们属于正确房间与所有者。

不需要控制取能顺序时，保持默认逻辑更简单。

## `directions` 的作用

```js
directions: [TOP, RIGHT]
```

它限制Creep生成后离开Spawn时允许使用的方向，不会让生成瞬间完成，也不会保证指定格一直空闲。

传入非法方向数组可能导致 `ERR_INVALID_ARGS`。

## 返回值排查表

| 返回值 | 常见原因 | 优先检查 |
|---|---|---|
| `OK` | 生成命令已安排 | 后续tick读取 `spawn.spawning` 与Creep状态 |
| `ERR_NOT_OWNER` | Spawn不属于自己 | Spawn来源与所有权 |
| `ERR_NAME_EXISTS` | 已有同名Creep | 命名与并发请求 |
| `ERR_BUSY` | Spawn已在生成 | 顶层调用顺序与 `spawn.spawning` |
| `ERR_NOT_ENOUGH_ENERGY` | Spawn和Extension可用Energy不足 | body成本与房间当前Energy |
| `ERR_INVALID_ARGS` | body、名称或选项不合法 | 1—50部件、名称、directions等 |
| `ERR_RCL_NOT_ENOUGH` | Controller等级不足以使用该Spawn | 房间控制状态与结构可用性 |

`spawnCreep()` **不会返回** `ERR_NOT_IN_RANGE`。它不是Creep对相邻目标执行的动作。

## 为什么不能只看 `room.energyCapacityAvailable`

```js
room.energyCapacityAvailable
```

表示房间当前结构能够容纳的最大生成Energy，不表示此刻已经装入这么多Energy。

实际是否能立刻生成应看：

```js
room.energyAvailable
```

动态身体策略可能根据二者选择：

- 应急单位：按当前 `energyAvailable`；
- 常规单位：等待达到目标容量；
- 高优先级防御：使用当前可负担的退化身体。

## 常见错误

### `dryRun === OK` 后忽略正式返回值

预检和正式调用之间可能发生同tick竞争。

### 名称只使用 `Game.time`

多个Spawn在同一tick使用相同模板时仍可能冲突。名称应加入Spawn、角色或递增序号。

### body为空时仍提交

动态组装返回空数组后必须停止。

### 把Storage Energy算作可生成Energy

`spawnCreep()`使用Spawn和Extension中的可用Energy，Storage库存不能直接支付本次生成。

### 多个模块同时控制同一Spawn

每个模块都可能预检通过，但只有一个正式请求能占用Spawn。应由单一生成调度器提交动作。

### 正常等待每tick打印

Energy不足或Spawn忙碌可能持续很多tick。应记录状态变化或降低日志频率。

## 离线模拟结果

构建检查覆盖：

1. Spawn缺失；
2. Spawn忙碌；
3. 名称非字符串、为空、超过100字符；
4. 名称重复；
5. body不是数组、为空或超过50个部件；
6. body包含未知部件；
7. 当前Energy不足；
8. 非对象Memory和合法请求。

离线测试不能调用真实Spawn，也不能模拟两个模块在同一tick竞争、Extension取能顺序或Creep生成完成。

## 适用边界

本文不实现：

- 完整Spawn队列；
- 多Spawn锁；
- 角色配额；
- 动态身体优化；
- 替代Creep提前生产；
- 生成方向交通管理；
- Power操作对生成时间的影响；
- 跨房间补员。

JavaScript语法和离线请求校验已检查，真实 `spawnCreep()` 返回值与多tick生成仍待Screeps环境验证。

## 相关站内内容

- [如何第一次创建Creep](/blog/screeps-spawn-create-creep)
- [如何按Energy动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [Creep身体计算器](/tools/creep-body-calculator)
- [进入Spawn与Creep生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [StructureSpawn.Spawning API](https://docs.screeps.com/api/#StructureSpawn-Spawning)
- [Creeps](https://docs.screeps.com/creeps.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线请求校验已通过；真实Spawn流程仍待环境验证。
