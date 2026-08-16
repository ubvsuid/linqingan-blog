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
  testResult: "Spawn/名称/body 校验、memory 不做对象类型伪限制、默认房间 Energy、显式 energyStructures 子集预算、去重、非法结构、directions 与可提交场景通过。"
featured: false
---

`StructureSpawn.spawnCreep()` 返回错误时，第一步不是反复调用，而是保存**真实返回值**，再判断失败属于哪一层。

这篇把问题拆成六类：

1. Spawn 是否存在、属于自己并且空闲；
2. 名称是否合法且没有重复；
3. body 是否由 1—50 个合法身体部件组成；
4. 本次生成真正允许使用的 Energy 是否足够；
5. `memory`、`energyStructures`、`directions` 等选项到底是官方 API 规则，还是你自己额外规定的项目策略；
6. `dryRun` 与正式提交为什么必须使用同一组关键选项，并分别保存结果。

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

返回：

```text
OK
```

表示生成命令已经被接受，不表示 Creep 在当前 tick 已经完成生成。

生成中的状态可以从：

```javascript
spawn.spawning
```

观察。真正完成以后，再在后续 tick 重新读取 `Game.creeps[name]`。

## 二、先区分“官方 API 无效”和“本站不推荐”

这是这篇最重要的修正。

有些条件会让 `spawnCreep()` 返回官方错误码，例如：

- body 为空；
- 名称无效；
- Spawn 忙碌；
- Energy 不足；
- 当前 Controller RCL 不足以使用这个 Spawn。

但你也可以在项目里制定更严格的规则，例如：

- `memory` 必须使用 `{ role, memoryVersion }` 这种对象；
- `energyStructures` 只能来自当前房间自己的 Spawn / Extension；
- 一个 tick 只允许一个生成调度器提交；
- 名称必须包含角色和序号。

这些**可以是很好的工程规则**，但不能写成“官方 API 本身只接受这种值”。

特别是 `opts.memory`：当前官方 API 文档把它标记为：

```text
any
```

因此不能因为它不是普通对象，就在通用 `spawnCreep()` 校验器里直接判成 `ERR_INVALID_ARGS` 的等价错误。

## 三、body 为什么必须先校验

官方 API 要求 body 包含 1—50 个合法身体部件。

常见部件包括：

```javascript
WORK
MOVE
CARRY
ATTACK
RANGED_ATTACK
HEAL
TOUGH
CLAIM
```

可以写成纯函数：

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

## 四、怎样计算身体成本

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

成本是：

```text
100 + 50 + 50 = 200 Energy
```

如果没有显式指定 `energyStructures`，当前可用于默认生成的 Energy 通常读取：

```javascript
spawn.room.energyAvailable
```

它表示房间 Spawn / Extension 当前可用于生成的 Energy，不是 Storage、Container 或 Terminal 的库存。

## 五、显式 `energyStructures` 时，不能继续只看 `room.energyAvailable`

这是第二个重要边界。

如果你这样调用：

```javascript
spawn.spawnCreep(
  body,
  name,
  {
    energyStructures: [spawn, extensionA]
  }
);
```

那么你已经把本次生成的取能范围限制在这一组选中的结构中。

当前官方 engine 在这个分支中，不再使用整个：

```javascript
spawn.room.energyAvailable
```

作为生成 Energy 预算，而是汇总传入 `energyStructures` 对应的可用 Energy。

因此下面这种本地判断可能给出假阳性：

```javascript
if (spawn.room.energyAvailable >= bodyCost) {
  // 不能据此断言显式 energyStructures 一定够用
}
```

例如：

```text
整个房间：800 Energy
显式选中的两个结构：150 Energy
body 成本：200 Energy
```

虽然：

```text
room.energyAvailable >= 200
```

但这次显式选择的结构仍然不够支付 200 Energy。

## 六、为显式 Energy 结构做一个本地安全检查

下面是**本站安全提交器的额外策略**，不是在声称官方 engine 会逐项用完全相同的方式报错。

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

- 必须是数组；
- 不能为空；
- 只使用自己的 Spawn / Extension；
- 只使用当前 Spawn 房间中的结构；
- 按结构 ID 去重。

这样做的目的不是复制 engine 的每一个内部细节，而是让你自己的生成请求更容易审查。

## 七、`memory` 的官方类型是 `any`，但仍推荐稳定对象结构

旧版示例曾写过：

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

这个判断不能代表当前官方 `spawnCreep()` 的参数规则，因为官方文档把：

```text
opts.memory
```

标成 `any`。

所以通用提交器不应该仅仅因为下面这些值“不是普通对象”就声称 API 参数非法：

```javascript
[]
'worker'
123
true
```

但**能传不等于推荐这样设计**。

本站仍建议使用：

```javascript
memory: {
  role: 'worker',
  memoryVersion: 1
}
```

原因不是“否则 API 会报错”，而是后续代码通常会继续使用：

```javascript
creep.memory.role
creep.memory.working
creep.memory.taskId
```

稳定的对象结构更适合长期维护。

### 一个 engine 级细节：`any` 不等于所有 falsy 值都会原样保存

在本文核对的官方 engine 版本中，生成时 Memory 写入使用了类似：

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

这类 falsy 值不能简单理解成“一定会原样成为新 Creep 的 Memory”。

所以更准确的结论是：

> **不要把非对象 memory 预判成官方无效参数；同时，生产代码仍推荐使用明确的对象结构。**

## 八、名称校验

官方 API 文档要求显式提供名称，长度上限为 100 个字符。

本站示例保持字符串策略：

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

正式结果仍然必须处理 `ERR_NAME_EXISTS`，因为同一 tick 的其他生成提交可能与本次请求竞争。

## 九、`directions` 也应该在本地先检查

`directions` 用来限制生成完成后 Creep 可以从 Spawn 的哪些方向离开。

本站提交器使用：

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
  ) {
    return {
      valid: false,
      reason: 'directions-invalid'
    };
  }

  if (
    directions.some(direction =>
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

这不会保证出口格一定空闲，只是把明显非法的方向配置挡在提交前。

## 十、`dryRun` 能检查什么

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

`dryRun: true` 只检查当前调用条件，不开始生成。

它适合发现：

- Spawn 忙碌；
- 名称重复；
- Energy 不足；
- body 或名称参数不合法；
- RCL 不足；
- 所有权问题；
- 当前调用选项导致的其他 API 拒绝。

但：

```text
dryRun === OK
```

不保证紧接着的正式调用一定返回 `OK`。

同一 tick 中，其他模块可能先一步：

- 占用同一个 Spawn；
- 创建同名 Creep；
- 提交其他互相冲突的生成逻辑。

因此正式调用的返回值必须单独保存。

## 十一、完整安全提交函数

下面把前面的边界合并起来。

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

## 十二、为什么 `dryRun` 与正式调用必须传同一组关键选项

如果预检时使用：

```javascript
{
  memory,
  energyStructures,
  directions,
  dryRun: true
}
```

正式调用却变成：

```javascript
{
  memory
}
```

那么你验证的根本不是同一个请求条件。

本文的：

```javascript
buildSpawnOptions(input, dryRun)
```

保证两次调用共享：

- `memory`；
- `energyStructures`；
- `directions`。

只让 `dryRun` 从 `true` 变为 `false`。

这仍不能消除同 tick 竞争，但至少不会因为你自己漏传选项而让预检和正式请求失去可比性。

## 十三、返回值排查表

| 返回值 | 常见原因 | 优先检查 |
| --- | --- | --- |
| `OK` | 生成命令已安排 | 后续 tick 读取 `spawn.spawning` 与 Creep 状态 |
| `ERR_NOT_OWNER` | Spawn 不属于自己 | Spawn 来源与所有权 |
| `ERR_NAME_EXISTS` | 已有同名 Creep | 命名与并发请求 |
| `ERR_BUSY` | Spawn 已在生成 | 顶层调用顺序与 `spawn.spawning` |
| `ERR_NOT_ENOUGH_ENERGY` | 本次允许使用的 Spawn / Extension Energy 不足 | body 成本；默认模式看房间可用 Energy；显式模式看所选 `energyStructures` |
| `ERR_INVALID_ARGS` | body、名称或部分选项不合法 | 1—50 部件、名称、directions 等 |
| `ERR_RCL_NOT_ENOUGH` | 当前 Controller RCL 不足以使用这个 Spawn | 房间控制状态与该 Spawn 当前可用性 |

`spawnCreep()` **不会返回** `ERR_NOT_IN_RANGE`。它不是 Creep 对相邻目标执行的动作。

同时不要把本站的：

```text
energy-structure-not-allowed
```

或：

```text
directions-invalid
```

误认为 Screeps 官方错误码；它们只是本文本地校验器的诊断状态。

## 十四、为什么不能只看 `room.energyCapacityAvailable`

```javascript
room.energyCapacityAvailable
```

表示房间当前 Spawn / Extension 能容纳的最大生成 Energy，不表示此刻已经装入这么多 Energy。

默认取能模式下，实际是否能立刻生成更应该看：

```javascript
room.energyAvailable
```

但如果请求显式传入：

```javascript
energyStructures
```

还要进一步看**这组结构本身**当前拥有多少可用 Energy，不能继续把整个房间的 `energyAvailable` 当成这次请求的真实预算。

## 十五、常见错误

### 把 `memory` 不是对象当成官方非法参数

当前官方文档把 `opts.memory` 定义为 `any`。你可以在项目里要求对象，但要明确这是自己的数据规范。

### 显式传了 `energyStructures`，仍然只检查 `room.energyAvailable`

这样可能在房间总 Energy 足够、选中子集不足时得到错误的“可以生成”结论。

### `dryRun === OK` 后忽略正式返回值

预检与正式提交之间仍可能发生同 tick 竞争。

### dryRun 和正式调用使用不同选项

尤其是漏掉 `energyStructures` 或 `directions`，会让预检失去意义。

### 名称只使用 `Game.time`

多个 Spawn 在同一 tick 使用相同模板时仍可能冲突。名称应加入 Spawn、角色或递增序号。

### body 为空时仍提交

动态组装返回空数组后必须停止。

### 把 Storage Energy 算作可生成 Energy

`spawnCreep()` 的生成预算来自 Spawn / Extension，不是 Storage 库存。

### 多个模块同时控制同一 Spawn

多个模块可能分别 `dryRun === OK`，但正式提交仍会竞争。生产系统应该由单一生成调度器提交。

### 正常等待每 tick 打印

Energy 不足或 Spawn 忙碌可能持续很多 tick。应记录状态变化或降低日志频率。

## 十六、离线模拟覆盖什么

这篇对应的仓库模拟现在覆盖：

1. Spawn 缺失、非己方和忙碌；
2. 名称类型、长度与重复；
3. body 不是数组、为空、超过 50 个部件或包含未知部件；
4. `memory` 为对象、数组、字符串、数字、布尔值时都不会被通用校验器伪造为官方参数错误；
5. 默认模式按 `room.energyAvailable` 判断；
6. 显式 `energyStructures` 只按选中的结构计算 Energy；
7. 重复结构 ID 去重；
8. 空数组、跨房间、非己方或非 Spawn / Extension 的本地拒绝策略；
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