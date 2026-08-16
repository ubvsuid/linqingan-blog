---
title: "spawnCreep() 失败怎么查：dryRun、参数校验与返回值"
description: "系统排查 StructureSpawn.spawnCreep()：区分官方 API 与本地策略，正确处理 body、名称、任意 memory、显式 energyStructures、dryRun 和正式返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-16"
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
  checkedAt: "2026-08-16"
  testedAt: "2026-08-16"
  testEnvironment: "Node.js 22 离线模拟（名称、身体、默认/显式 Energy 预算、memory 边界、directions 与提交选项一致性，不是 Screeps 官方服务器）"
  testResult: "Spawn/名称/body 校验、memory 不做对象类型伪限制、默认房间 Energy、显式 energyStructures 子集预算、去重、inactive/非法结构、directions 与可提交场景通过。"
featured: false
---

`StructureSpawn.spawnCreep()` 返回错误时，第一步不是反复调用，而是保存**真实返回值**，再判断失败属于哪一层。

这篇把问题拆成六类：

1. Spawn 是否存在、属于自己并且空闲；
2. 名称是否合法且没有重复；
3. body 是否由 1—50 个合法身体部件组成；
4. 本次请求真正允许使用的 Energy 是否足够；
5. `memory`、`energyStructures`、`directions` 中，哪些是官方 API 边界，哪些只是自己的工程策略；
6. `dryRun` 与正式提交为什么要使用同一组关键选项，并分别保存结果。

本文仍使用 `dryRun` 做预检，再执行一次正式提交。两次结果都要保存，因为同一 tick 中其他代码仍可能改变 Spawn 状态、占用同名 Creep，或抢先提交生成意图。

## 一、`spawnCreep()` 的基本形式

```javascript
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

返回 `OK` 表示生成命令已经被接受，不表示 Creep 在当前 tick 已经完成生成。

可以观察：

```javascript
spawn.spawning
```

真正完成以后，再在后续 tick 重新读取：

```javascript
Game.creeps.Worker1
```

## 二、先区分“官方参数无效”和“本站不推荐”

有些条件会直接对应官方返回值，例如：

- body 为空；
- 名称无效；
- Spawn 忙碌；
- Energy 不足；
- 当前 Controller RCL 不足以使用这个 Spawn。

但项目也可以自己制定更严格的规则，例如：

- `memory` 推荐使用 `{ role, memoryVersion }`；
- `energyStructures` 只允许当前房间自己的 Spawn / Extension；
- 名称必须包含角色和序号；
- 一个 Spawn 只允许一个统一调度器提交。

这些工程规则可以很有价值，但不能写成“官方 API 本身只接受这种形状”。

特别是 `opts.memory`。当前官方 API 文档把它标记为：

```text
any
```

所以不能仅仅因为它不是普通对象，就在通用 API 校验器中声称它属于 `ERR_INVALID_ARGS`。

## 三、body 为什么必须先校验

官方 API 要求 body 包含 1—50 个合法身体部件。

```javascript
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

身体成本可以用官方常量计算：

```javascript
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

例如：

```javascript
[WORK, CARRY, MOVE]
```

成本为 200 Energy。

## 四、默认模式看 `room.energyAvailable`

没有显式指定 `energyStructures` 时，当前生成可用 Energy 通常读取：

```javascript
spawn.room.energyAvailable
```

它表示房间 Spawn / Extension 当前可用于生成的 Energy，不是 Storage、Container 或 Terminal 的库存。

因此默认模式下可以做一个快速本地预检：

```javascript
const bodyCost = getBodyCost(body);

if (spawn.room.energyAvailable < bodyCost) {
  // 当前默认生成 Energy 不足
}
```

但这个判断只适用于**默认取能模式**。

## 五、显式 `energyStructures` 后，真实预算已经变了

如果调用：

```javascript
spawn.spawnCreep(
  body,
  name,
  {
    energyStructures: [spawn, extensionA]
  }
);
```

你已经把本次请求的取能来源限定到这一组选中结构。

当前官方 engine 在 `energyStructures` 存在时，会按选中结构计算可用 Energy；不会继续把整个：

```javascript
spawn.room.energyAvailable
```

当成本次请求的 Energy 预算。

例如：

```text
整个房间当前有：800 Energy
选中的结构只有：150 Energy
body 成本：200 Energy
```

此时整个房间虽然够 200，但这次显式请求仍然不够。

因此：

```javascript
spawn.room.energyAvailable >= bodyCost
```

不能证明显式 `energyStructures` 一定能支付这次生成。

## 六、显式 Energy 结构的本站安全检查

下面是**本站安全提交器的额外策略**，不是在声称官方 engine 会逐项使用完全相同的自定义诊断状态。

```javascript
function isAllowedEnergyStructure(
  spawn,
  structure
) {
  if (!structure || structure.my !== true) {
    return false;
  }

  if (structure.room?.name !== spawn.room.name) {
    return false;
  }

  if (
    typeof structure.isActive === 'function'
    && structure.isActive() !== true
  ) {
    return false;
  }

  return (
    structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION
  );
}

function getEnergyBudget(
  spawn,
  energyStructures
) {
  if (energyStructures === undefined) {
    return {
      valid: true,
      reason: 'room-default-energy',
      energyAvailable: spawn.room.energyAvailable,
      energyStructures: undefined
    };
  }

  if (
    !Array.isArray(energyStructures)
    || energyStructures.length === 0
  ) {
    return {
      valid: false,
      reason: 'energy-structures-invalid'
    };
  }

  const unique = [];
  const seen = new Set();

  for (const structure of energyStructures) {
    if (!isAllowedEnergyStructure(spawn, structure)) {
      return {
        valid: false,
        reason: 'energy-structure-not-allowed'
      };
    }

    if (!seen.has(structure.id)) {
      seen.add(structure.id);
      unique.push(structure);
    }
  }

  const energyAvailable = unique.reduce(
    (total, structure) =>
      total + structure.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
    0
  );

  return {
    valid: true,
    reason: 'explicit-energy-structures',
    energyAvailable,
    energyStructures: unique
  };
}
```

这个本地规则主动要求：

- 参数必须是非空数组；
- 只接受自己的 Spawn / Extension；
- 只接受当前 Spawn 所在房间中的结构；
- 当前 RCL 下结构必须是 active；
- 相同结构 ID 只统计一次。

这里检查 `structure.isActive()` 的原因是：本文核对的官方 engine 在显式 Energy 汇总时会排除处于 `off` 状态的结构。这样本地预算就不会把当前不可用结构中的 Energy 错算进去。

## 七、`memory` 是 `any`，但仍推荐对象结构

旧版文章曾把下面这种校验当成通用 API 规则：

```javascript
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
```

这会把数组、字符串、数字和布尔值都提前挡掉，但当前官方文档并没有给 `opts.memory` 这样的对象类型限制。

因此通用校验器不应该仅因为下面这些值“不是普通对象”就声称 API 参数非法：

```javascript
[]
'worker'
123
true
```

不过，**能传不等于推荐这样设计**。

本站仍建议生产代码使用：

```javascript
memory: {
  role: 'worker',
  memoryVersion: 1
}
```

因为后续代码通常会继续读写：

```javascript
creep.memory.role
creep.memory.working
creep.memory.taskId
```

稳定的对象结构更容易维护。

### `any` 也不等于所有 falsy 值都会原样持久化

在本文核对的官方 engine 版本中，创建时的 Memory 写入存在类似：

```javascript
options.memory || existingMemory || {}
```

的回退逻辑。

因此：

```javascript
false
0
''
null
```

这类 falsy 值不能简单理解为“一定会原样成为新 Creep 的 Memory”。

更准确的结论是：

> 不要把非对象 `memory` 预判成官方无效参数；生产代码仍推荐使用明确的对象结构。

## 八、名称和 `directions` 的本地检查

本站示例继续要求名称使用字符串：

```javascript
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

`directions` 用来限制生成完成后 Creep 可以从 Spawn 的哪些方向离开。

```javascript
function validateDirections(directions) {
  if (directions === undefined) {
    return {
      valid: true,
      reason: 'directions-default'
    };
  }

  if (
    !Array.isArray(directions)
    || directions.length === 0
    || directions.some(direction =>
      !Number.isInteger(direction)
      || direction < 1
      || direction > 8
    )
  ) {
    return {
      valid: false,
      reason: 'directions-invalid'
    };
  }

  return {
    valid: true,
    reason: 'directions-ready'
  };
}
```

这只是本地预检，不会保证出口格在生成完成时仍然空闲。

## 九、`dryRun` 能检查什么

```javascript
const check = spawn.spawnCreep(
  body,
  name,
  {
    memory,
    dryRun: true
  }
);
```

`dryRun: true` 会检查当前调用条件，但不开始生成。

它适合发现：

- Spawn 忙碌；
- 名称重复；
- Energy 不足；
- body 或名称参数不合法；
- RCL 不足；
- 所有权问题；
- 当前选项导致的其他 API 拒绝。

但：

```text
dryRun === OK
```

不保证紧接着的正式调用也一定返回 `OK`。

同一 tick 中其他模块可能先一步占用 Spawn 或创建同名 Creep，所以正式调用仍必须单独保存返回值。

## 十、完整安全提交函数

```javascript
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

function isAllowedEnergyStructure(
  spawn,
  structure
) {
  if (!structure || structure.my !== true) {
    return false;
  }

  if (structure.room?.name !== spawn.room.name) {
    return false;
  }

  if (
    typeof structure.isActive === 'function'
    && structure.isActive() !== true
  ) {
    return false;
  }

  return (
    structure.structureType === STRUCTURE_SPAWN
    || structure.structureType === STRUCTURE_EXTENSION
  );
}

function getEnergyBudget(
  spawn,
  energyStructures
) {
  if (energyStructures === undefined) {
    return {
      valid: true,
      reason: 'room-default-energy',
      energyAvailable: spawn.room.energyAvailable,
      energyStructures: undefined
    };
  }

  if (
    !Array.isArray(energyStructures)
    || energyStructures.length === 0
  ) {
    return {
      valid: false,
      reason: 'energy-structures-invalid'
    };
  }

  const unique = [];
  const seen = new Set();

  for (const structure of energyStructures) {
    if (!isAllowedEnergyStructure(spawn, structure)) {
      return {
        valid: false,
        reason: 'energy-structure-not-allowed'
      };
    }

    if (!seen.has(structure.id)) {
      seen.add(structure.id);
      unique.push(structure);
    }
  }

  const energyAvailable = unique.reduce(
    (total, structure) =>
      total + structure.store.getUsedCapacity(
        RESOURCE_ENERGY
      ),
    0
  );

  return {
    valid: true,
    reason: 'explicit-energy-structures',
    energyAvailable,
    energyStructures: unique
  };
}

function validateDirections(directions) {
  if (directions === undefined) {
    return {
      valid: true,
      reason: 'directions-default'
    };
  }

  if (
    !Array.isArray(directions)
    || directions.length === 0
    || directions.some(direction =>
      !Number.isInteger(direction)
      || direction < 1
      || direction > 8
    )
  ) {
    return {
      valid: false,
      reason: 'directions-invalid'
    };
  }

  return {
    valid: true,
    reason: 'directions-ready'
  };
}

function validateSpawnRequest(input) {
  const {
    spawn,
    body,
    name,
    energyStructures,
    directions
  } = input;

  if (!spawn) {
    return {
      valid: false,
      reason: 'spawn-missing'
    };
  }

  if (spawn.my !== true) {
    return {
      valid: false,
      reason: 'spawn-not-owned'
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

  const directionCheck =
    validateDirections(directions);

  if (!directionCheck.valid) {
    return directionCheck;
  }

  const energyCheck = getEnergyBudget(
    spawn,
    energyStructures
  );

  if (!energyCheck.valid) {
    return energyCheck;
  }

  const bodyCost = getBodyCost(body);

  if (energyCheck.energyAvailable < bodyCost) {
    return {
      valid: false,
      reason: 'energy-not-enough',
      bodyCost,
      energyAvailable:
        energyCheck.energyAvailable,
      energyMode: energyCheck.reason
    };
  }

  return {
    valid: true,
    reason: 'ready',
    bodyCost,
    energyAvailable:
      energyCheck.energyAvailable,
    energyMode: energyCheck.reason,
    energyStructures:
      energyCheck.energyStructures
  };
}

function buildSpawnOptions(input, dryRun) {
  const options = {
    dryRun
  };

  if (input.memory !== undefined) {
    options.memory = input.memory;
  }

  if (input.energyStructures !== undefined) {
    options.energyStructures =
      input.energyStructures;
  }

  if (input.directions !== undefined) {
    options.directions = input.directions;
  }

  return options;
}

function submitSpawnRequest(input) {
  const validation = validateSpawnRequest(input);

  if (!validation.valid) {
    return {
      status: 'local-validation-failed',
      ...validation
    };
  }

  const dryRunOptions = buildSpawnOptions(
    input,
    true
  );

  const dryRunResult = input.spawn.spawnCreep(
    input.body,
    input.name,
    dryRunOptions
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      dryRunResult,
      ...validation
    };
  }

  const actualOptions = buildSpawnOptions(
    input,
    false
  );

  const result = input.spawn.spawnCreep(
    input.body,
    input.name,
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

  const energyStructures = [
    spawn,
    ...spawn.room.find(FIND_MY_STRUCTURES, {
      filter: structure =>
        structure.structureType
          === STRUCTURE_EXTENSION
        && structure.isActive()
    })
  ];

  const outcome = submitSpawnRequest({
    spawn,
    body: [WORK, CARRY, MOVE],
    name: desiredName,
    memory: {
      role: 'worker',
      memoryVersion: 1
    },
    energyStructures,
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

这段示例仍然只适合固定名称的单个请求。真正的补员系统还需要配额、唯一命名和单一 Spawn 调度器。

## 十一、为什么 `dryRun` 与正式调用必须使用同一组选项

如果预检时使用：

```javascript
{
  memory,
  energyStructures,
  directions,
  dryRun: true
}
```

正式调用却只传：

```javascript
{
  memory
}
```

那么你验证的已经不是同一个请求条件。

本文通过：

```javascript
buildSpawnOptions(input, dryRun)
```

让两次调用共享：

- `memory`；
- `energyStructures`；
- `directions`。

只让 `dryRun` 从 `true` 变成 `false`。

这仍不能消除同 tick 竞争，但可以避免因为自己漏传选项而制造错误结论。

## 十二、返回值排查表

| 返回值 | 常见原因 | 优先检查 |
| --- | --- | --- |
| `OK` | 生成命令已安排 | 后续 tick 读取 `spawn.spawning` 与 Creep 状态 |
| `ERR_NOT_OWNER` | Spawn 不属于自己 | Spawn 来源与所有权 |
| `ERR_NAME_EXISTS` | 已有同名 Creep | 命名与并发请求 |
| `ERR_BUSY` | Spawn 已在生成 | 顶层调用顺序与 `spawn.spawning` |
| `ERR_NOT_ENOUGH_ENERGY` | 本次允许使用的 Spawn / Extension Energy 不足 | 默认模式看房间 Energy；显式模式看所选 `energyStructures` |
| `ERR_INVALID_ARGS` | body、名称或部分选项不合法 | 1—50 部件、名称、directions 等 |
| `ERR_RCL_NOT_ENOUGH` | 当前 Controller RCL 不足以使用这个 Spawn | 房间控制状态与该 Spawn 当前可用性 |

`spawnCreep()` **不会返回** `ERR_NOT_IN_RANGE`。

还要区分官方错误码与本文本地状态，例如：

```text
energy-structure-not-allowed
energy-structures-invalid
directions-invalid
```

这些只是本站安全提交器的诊断字符串，不是 Screeps 官方返回码。

## 十三、为什么不能只看 `room.energyCapacityAvailable`

```javascript
room.energyCapacityAvailable
```

表示房间 Spawn / Extension 能容纳的最大生成 Energy，不表示此刻已经装入这么多。

默认模式下，当前预算更接近：

```javascript
room.energyAvailable
```

但如果请求显式传入 `energyStructures`，还要进一步检查**这组选中结构**当前实际可用的 Energy。

## 十四、常见错误

### 把 `memory` 不是对象当成官方非法参数

当前官方文档把 `opts.memory` 定义为 `any`。项目可以要求对象，但要明确那是自己的数据规范。

### 显式传了 `energyStructures`，仍然只检查 `room.energyAvailable`

这会在房间总 Energy 足够、选中子集不足时得到错误的“可以生成”结论。

### 把 inactive 的 Extension Energy 算进显式预算

本文核对的 engine 会在显式结构汇总时排除当前 `off` 的结构。本地安全预算也应避免把它们算进去。

### `dryRun === OK` 后忽略正式返回值

预检与正式提交之间仍可能发生同 tick 竞争。

### dryRun 和正式调用使用不同选项

尤其是漏掉 `energyStructures` 或 `directions`，会让预检失去可比性。

### 名称只使用 `Game.time`

多个 Spawn 在同一 tick 使用相同模板时仍可能冲突。名称应加入 Spawn、角色或递增序号。

### body 为空时仍提交

动态组装返回空数组后必须停止。

### 把 Storage Energy 算作生成 Energy

`spawnCreep()` 的生成预算来自 Spawn / Extension，不是 Storage 库存。

### 多个模块同时控制同一 Spawn

多个模块可能分别 `dryRun === OK`，但正式提交仍会竞争。生产系统应由单一生成调度器提交。

## 十五、离线模拟覆盖什么

这篇对应的仓库模拟现在覆盖：

1. Spawn 缺失、非己方和忙碌；
2. 名称类型、长度与重复；
3. body 不是数组、为空、超过 50 个部件或包含未知部件；
4. `memory` 为对象、数组、字符串、数字、布尔值时都不会被通用校验器伪造成官方参数错误；
5. 默认模式按 `room.energyAvailable` 判断；
6. 显式 `energyStructures` 只按选中的结构计算 Energy；
7. 重复结构 ID 去重；
8. 空数组、跨房间、非己方、inactive 或非 Spawn / Extension 的本地拒绝策略；
9. `directions` 合法与非法边界；
10. dryRun 与正式提交选项保持一致。

离线测试不能调用真实 Spawn，也不能证明真实服务器上的同 tick 竞争、RCL、Creep 生成完成或每一种 `memory` 值的最终持久化表现。

## 适用边界

本文不实现：

- 完整 Spawn 队列；
- 多 Spawn 锁；
- 角色配额；
- 动态身体优化；
- 替代 Creep 提前生产；
- 复杂出口交通管理；
- Power 操作对生成时间的影响；
- 跨房间补员。

JavaScript 语法和离线请求校验由仓库门禁检查；真实 `spawnCreep()` 返回值与多 tick 生成仍待 Screeps 环境验证。

## 相关站内内容

- [如何第一次创建 Creep](/blog/screeps-spawn-create-creep)
- [如何按 Energy 动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [Creep 身体部件怎么看](/blog/screeps-creep-body-parts)
- [Creep 身体计算器](/tools/creep-body-calculator)
- [进入 Spawn 与 Creep 生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [StructureSpawn.Spawning API](https://docs.screeps.com/api/#StructureSpawn-Spawning)
- [官方 engine：StructureSpawn.spawnCreep](https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/structures.js)
- [Creeps](https://docs.screeps.com/creeps.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-08-16。本文核对到的官方 engine commit 为 `80977824199a596d174d392fd0cf8c458c21fcbd`；真实 Spawn 流程仍待 Screeps 环境验证。