---
title: "Screeps 多 Spawn 队列怎么设计：优先级、去重、Energy 预留与任务分配"
description: "为同一房间或帝国中的多个 Spawn 建立统一队列：用稳定 requestKey 去重，按紧急度和等待时间排序，为共享 Spawn 与 Extension Energy 做本地预留，避免多个模块重复生成 Creep，并在后续 tick 验证真实孵化结果。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "自动化"
  - "运行诊断"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
---

当房间只有一个 Spawn、一个 Harvester 需求时，下面的代码可以工作：

```js
if (harvesters.length < 2) {
  spawn.spawnCreep(
    [WORK, CARRY, MOVE],
    'Harvester' + Game.time,
    {
      memory: {
        role: 'harvester'
      }
    }
  );
}
```

当代码继续增长后，问题通常不是“不会调用 `spawnCreep()`”，而是 **太多模块都在调用它**：

- Harvester 管理器发现缺员；
- Upgrader 管理器也发现缺员；
- 远程房间管理器请求 Reserver；
- 防御模块临时请求 Defender；
- 提前补员模块为即将死亡的 Creep 请求替代者；
- 房间内有两个或三个空闲 Spawn；
- 多个请求共用同一批 Spawn 和 Extension Energy。

如果这些模块直接操作 Spawn，就会出现重复请求、优先级反转、名字冲突、同 tick Energy 争用和难以验证的失败。

更稳定的结构是：

```text
业务模块只提交请求
→ 队列统一去重和排序
→ 调度器选择一个空闲 Spawn
→ 本地预留共享 Energy
→ 每个 Spawn 最多提交一次 spawnCreep()
→ 下一 tick 验证接受的名字是否真的进入孵化
```

## 快速答案

多 Spawn 调度器至少应完成六件事：

1. 使用稳定的 `requestKey` 表示业务需求，而不是使用随机 Creep 名称去重；
2. 同一个需求在队列中只能保留一份；
3. 紧急恢复、防御和 Controller 安全请求优先于普通经济请求；
4. 同房间的多个 Spawn 必须共享一份本地 Energy 预算；
5. `dryRun: true` 只用于检查单个请求，不能代替同 tick 预算预留；
6. `spawnCreep()` 返回 `OK` 后保存待验证记录，在后续 tick 检查真实状态。

## 为什么不能让每个角色模块直接调用 Spawn

下面的两个模块可能在同一个 tick 运行：

```js
function runHarvesterDemand(room) {
  if (countRole(room, 'harvester') < 2) {
    return room.find(FIND_MY_SPAWNS)[0]
      .spawnCreep(
        [WORK, CARRY, MOVE],
        'harvester-' + Game.time
      );
  }
}

function runUpgraderDemand(room) {
  if (countRole(room, 'upgrader') < 1) {
    return room.find(FIND_MY_SPAWNS)[0]
      .spawnCreep(
        [WORK, CARRY, MOVE],
        'upgrader-' + Game.time
      );
  }
}
```

常见结果包括：

- 两个模块都选择同一个 Spawn；
- 后调用的请求覆盖或阻止前一个业务意图；
- 低优先级 Upgrader 抢在应急 Harvester 前面；
- 两个模块都认为自己应该创建同一类 Creep；
- 日志只保留返回码，无法知道哪个需求最终完成。

业务模块应只描述“需要什么”，不应决定“由哪个 Spawn 在这个 tick 创建”。

## 请求对象需要哪些字段

```js
function createSpawnRequest(input) {
  return {
    requestKey: input.requestKey,
    roomName: input.roomName,
    role: input.role,
    body: [...input.body],
    priority: input.priority,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    memory: {
      ...input.memory,
      role: input.role
    },
    directions: Array.isArray(input.directions)
      ? [...input.directions]
      : undefined,
    preferredSpawnNames:
      Array.isArray(input.preferredSpawnNames)
        ? [...input.preferredSpawnNames]
        : []
  };
}
```

字段职责：

| 字段 | 用途 |
|---|---|
| `requestKey` | 一个稳定业务需求的唯一标识 |
| `roomName` | 从哪个房间的 Spawn 与 Energy 池创建 |
| `role` | 角色分类和日志字段 |
| `body` | 已经确定的身体数组 |
| `priority` | 调度优先级，数值越大越先执行 |
| `createdAt` | 同优先级下的等待顺序 |
| `expiresAt` | 请求失效时间，防止旧需求长期残留 |
| `memory` | 创建后写入 Creep Memory 的初始数据 |
| `directions` | 可选出生方向 |
| `preferredSpawnNames` | 可选 Spawn 偏好，不是强制唯一目标 |

`requestKey` 应描述需求身份，例如：

```text
E51S44:local:harvester:source-0
E51S44:controller:upgrader:slot-1
E51S44:defense:melee:wave-12345
E51S44:remote:E52S44:reserver
```

不要使用：

```text
harvester-Game.time
Math.random()
当前 Creep 名称
```

这些值每 tick 都可能变化，无法用于去重。

## 先验证请求结构

```js
function calculateBodyCost(body) {
  if (!Array.isArray(body)) {
    return null;
  }

  let cost = 0;

  for (const part of body) {
    const partCost = BODYPART_COST[part];

    if (!Number.isFinite(partCost)) {
      return null;
    }

    cost += partCost;
  }

  return cost;
}

function validateSpawnRequest(request) {
  if (
    !request
    || typeof request.requestKey !== 'string'
    || request.requestKey.trim() === ''
  ) {
    return {
      ok: false,
      reason: 'invalid-request-key'
    };
  }

  if (
    typeof request.roomName !== 'string'
    || !Game.rooms[request.roomName]
  ) {
    return {
      ok: false,
      reason: 'room-not-visible'
    };
  }

  if (
    !Array.isArray(request.body)
    || request.body.length === 0
    || request.body.length > MAX_CREEP_SIZE
  ) {
    return {
      ok: false,
      reason: 'invalid-body-length'
    };
  }

  const cost = calculateBodyCost(request.body);

  if (!Number.isInteger(cost) || cost <= 0) {
    return {
      ok: false,
      reason: 'invalid-body-parts'
    };
  }

  if (!Number.isFinite(request.priority)) {
    return {
      ok: false,
      reason: 'invalid-priority'
    };
  }

  if (
    !Number.isInteger(request.createdAt)
    || !Number.isInteger(request.expiresAt)
    || request.expiresAt < request.createdAt
  ) {
    return {
      ok: false,
      reason: 'invalid-time-window'
    };
  }

  return {
    ok: true,
    cost
  };
}
```

验证应在队列入口执行，避免一个错误请求阻止整个调度循环。

## 用 `requestKey` 去重

同一个业务需求可能被多个模块观察到，也可能在每个 tick 重复提交。队列应保留一个确定版本：

```js
function deduplicateRequests(requests) {
  const byKey = new Map();

  for (const request of requests) {
    const previous = byKey.get(request.requestKey);

    if (!previous) {
      byKey.set(request.requestKey, request);
      continue;
    }

    const shouldReplace =
      request.priority > previous.priority
      || (
        request.priority === previous.priority
        && request.createdAt < previous.createdAt
      );

    if (shouldReplace) {
      byKey.set(request.requestKey, request);
    }
  }

  return [...byKey.values()];
}
```

如果同一个 `requestKey` 出现不同身体或不同角色，不应静默随机选择。生产代码可另外记录配置冲突：

```js
function requestFingerprint(request) {
  return JSON.stringify({
    roomName: request.roomName,
    role: request.role,
    body: request.body,
    memory: request.memory,
    directions: request.directions ?? null
  });
}
```

相同 key、不同 fingerprint 表示两个模块对同一需求定义不一致，需要修复上游配置。

## 设计清楚的优先级

优先级不是越多越好。建议先使用少量层级：

```js
const SPAWN_PRIORITY = Object.freeze({
  EMERGENCY_RECOVERY: 1000,
  ACTIVE_DEFENSE: 900,
  CONTROLLER_SAFETY: 800,
  ESSENTIAL_ECONOMY: 700,
  REPLACEMENT: 600,
  NORMAL_ECONOMY: 400,
  REMOTE_EXPANSION: 200,
  OPTIONAL: 100
});
```

一个稳定排序器：

```js
function compareSpawnRequests(left, right) {
  return (
    right.priority - left.priority
    || left.createdAt - right.createdAt
    || left.requestKey.localeCompare(
      right.requestKey
    )
  );
}

function sortSpawnRequests(requests) {
  return [...requests].sort(
    compareSpawnRequests
  );
}
```

排序规则依次是：

1. 优先级高的先；
2. 同优先级等待更久的先；
3. 最后使用稳定 key，避免对象遍历顺序影响结果。

## 防止低优先级请求长期饿死

只有固定优先级时，普通 Builder 可能长期排不到。可以加入有上限的等待加权：

```js
function getEffectivePriority(
  request,
  now,
  options = {}
) {
  const waitStep = options.waitStep ?? 50;
  const maxBonus = options.maxBonus ?? 100;
  const waitedTicks = Math.max(
    0,
    now - request.createdAt
  );
  const waitBonus = Math.min(
    maxBonus,
    Math.floor(waitedTicks / waitStep)
  );

  return request.priority + waitBonus;
}
```

紧急恢复与主动防御通常不应被普通等待加权追平，因此 `maxBonus` 必须有上限。

## 只让调度器选择空闲 Spawn

```js
function getAvailableSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    );
}
```

每个 Spawn 在一个 tick 最多接收一个创建请求。不要在同一个调度循环中重复使用已经分配过的 Spawn。

## Spawn 偏好不能破坏可用性

```js
function rankSpawnsForRequest(
  request,
  spawns
) {
  const preferred = new Set(
    request.preferredSpawnNames ?? []
  );

  return [...spawns].sort((left, right) => {
    const leftRank = preferred.has(left.name)
      ? 0
      : 1;
    const rightRank = preferred.has(right.name)
      ? 0
      : 1;

    return (
      leftRank - rightRank
      || left.name.localeCompare(right.name)
    );
  });
}
```

偏好只改变顺序。除非业务确实要求指定出口或指定房间，不应因为首选 Spawn 忙碌就让紧急请求完全停止。

## 为什么多个 Spawn 需要共享本地 Energy 预算

同一个房间的 Spawn 和 Extension 构成共享创建 Energy 池。官方文档说明，同一房间的 Extension 可以被多个 Spawn 使用。

同时，Screeps 主循环读取的是 tick 开始时的状态，动作命令会在之后统一结算。由此可以推断：如果两个空闲 Spawn 在同一 tick 分别执行 `dryRun: true`，它们可能都基于同一份初始 `room.energyAvailable` 返回 `OK`。这不能证明两次真实创建都具备独立 Energy。

因此调度器需要自己的预算：

```js
function createRoomEnergyBudget(room) {
  return {
    roomName: room.name,
    observedAt: Game.time,
    observedEnergy: room.energyAvailable,
    reservedEnergy: 0
  };
}

function getBudgetRemaining(budget) {
  return Math.max(
    0,
    budget.observedEnergy
      - budget.reservedEnergy
  );
}

function reserveSpawnEnergy(
  budget,
  amount
) {
  if (
    !Number.isInteger(amount)
    || amount <= 0
    || amount > getBudgetRemaining(budget)
  ) {
    return false;
  }

  budget.reservedEnergy += amount;
  return true;
}
```

这是一种本地调度保护，不是服务器锁。它的作用是让本次主循环不会对同一份观测 Energy 重复承诺。

## `dryRun: true` 应该怎么用

```js
function dryRunSpawnRequest(
  spawn,
  request,
  name
) {
  return spawn.spawnCreep(
    request.body,
    name,
    {
      memory: request.memory,
      directions: request.directions,
      dryRun: true
    }
  );
}
```

`dryRun` 适合检查：

- 身体数组是否合法；
- 名称是否冲突；
- Spawn 是否可用；
- 当前观测 Energy 是否足够；
- 参数是否有效。

它不适合证明：

- 同房间其他 Spawn 没有使用相同 Energy；
- 真实创建意图一定会在服务器结算时完成；
- 下一 tick 一定能看到目标 Creep 正在孵化。

调度顺序应是：

```text
本地预算足够
→ dryRun 返回 OK
→ 提交真实 spawnCreep()
→ 真实调用返回 OK
→ 本地预留 Energy
→ 保存待验证记录
```

只有真实调用返回 `OK` 后才预留预算。如果真实调用失败，预算不应扣减。

## 生成稳定且唯一的 Creep 名称

```js
function sanitizeNamePart(value) {
  return String(value)
    .replace(/[^A-Za-z0-9_-]/g, '-')
    .slice(0, 24);
}

function buildCreepName(
  request,
  sequence
) {
  return [
    sanitizeNamePart(request.role),
    sanitizeNamePart(request.roomName),
    Game.time,
    sequence
  ].join('-').slice(0, 100);
}
```

名称用于游戏对象身份，`requestKey` 用于业务需求身份。两者不要混为一谈。

## 提交一个请求

```js
function submitSpawnRequest(
  spawn,
  request,
  name,
  budget
) {
  const validation = validateSpawnRequest(
    request
  );

  if (!validation.ok) {
    return {
      status: 'invalid-request',
      reason: validation.reason
    };
  }

  if (validation.cost > getBudgetRemaining(budget)) {
    return {
      status: 'local-budget-insufficient',
      cost: validation.cost,
      remaining: getBudgetRemaining(budget)
    };
  }

  const dryRunResult = dryRunSpawnRequest(
    spawn,
    request,
    name
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      result: dryRunResult
    };
  }

  const result = spawn.spawnCreep(
    request.body,
    name,
    {
      memory: request.memory,
      directions: request.directions
    }
  );

  if (result !== OK) {
    return {
      status: 'submission-rejected',
      result
    };
  }

  if (!reserveSpawnEnergy(
    budget,
    validation.cost
  )) {
    return {
      status: 'budget-invariant-failed',
      result,
      cost: validation.cost
    };
  }

  return {
    status: 'submitted-locally',
    result,
    requestKey: request.requestKey,
    spawnName: spawn.name,
    creepName: name,
    cost: validation.cost,
    submittedAt: Game.time
  };
}
```

`submitted-locally` 是准确状态。不要立即写成：

```text
spawned
created
running
```

## 保存待验证记录

```js
function savePendingSpawn(outcome) {
  if (outcome.status !== 'submitted-locally') {
    return false;
  }

  Memory.spawnScheduler ??= {
    pending: {},
    completed: {}
  };
  Memory.spawnScheduler.pending[
    outcome.requestKey
  ] = {
    requestKey: outcome.requestKey,
    spawnName: outcome.spawnName,
    creepName: outcome.creepName,
    cost: outcome.cost,
    submittedAt: outcome.submittedAt,
    lastCheckedAt: null
  };

  return true;
}
```

待验证记录还可以防止同一个需求在下一 tick 又进入队列。

## 后续 tick 验证真实状态

```js
function verifyPendingSpawn(pending) {
  const spawn = Game.spawns[
    pending.spawnName
  ] ?? null;
  const creep = Game.creeps[
    pending.creepName
  ] ?? null;

  if (
    spawn?.spawning?.name
      === pending.creepName
  ) {
    return {
      status: 'spawning-observed',
      requestKey: pending.requestKey,
      creepName: pending.creepName,
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  if (creep) {
    return {
      status: creep.spawning
        ? 'spawning-creep-observed'
        : 'creep-released',
      requestKey: pending.requestKey,
      creepName: pending.creepName
    };
  }

  return {
    status: 'not-observed-yet',
    requestKey: pending.requestKey,
    creepName: pending.creepName
  };
}
```

`not-observed-yet` 不是立即重试的理由。应给服务器结算和下一 tick 状态一个明确窗口：

```js
function shouldRetryPending(
  pending,
  now,
  timeoutTicks = 2
) {
  return now - pending.submittedAt
    >= timeoutTicks;
}
```

如果超时后名字仍不存在，再根据日志、返回码和当前需求决定是否重新排队。

## 队列不能只看当前 Creep 数量

下面的条件会造成重复请求：

```js
if (countRole(room, 'harvester') < 2) {
  enqueueHarvester();
}
```

因为正在孵化和已提交待验证的 Harvester 可能尚未进入你统计的“可工作 Creep”集合。

更安全的缺口计算：

```js
function countCoveredDemand(
  room,
  role,
  pendingRecords
) {
  const existing = room.find(FIND_MY_CREEPS)
    .filter(creep =>
      creep.memory.role === role
    ).length;
  const spawning = room.find(FIND_MY_SPAWNS)
    .filter(spawn => {
      const name = spawn.spawning?.name;
      const creep = name
        ? Game.creeps[name]
        : null;

      return creep?.memory?.role === role;
    }).length;
  const pending = pendingRecords.filter(record =>
    record.roomName === room.name
    && record.role === role
  ).length;

  return existing + spawning + pending;
}
```

实际项目中要避免“正在孵化 Creep 同时被 existing 和 spawning 重复统计”。可以按 Creep 名称建立 `Set`，而不是简单相加。

## 完整的房间调度器

```js
function scheduleRoomSpawns(
  room,
  rawRequests
) {
  const now = Game.time;
  const requests = sortSpawnRequests(
    deduplicateRequests(rawRequests)
      .filter(request =>
        request.roomName === room.name
        && request.expiresAt >= now
      )
  );
  const availableSpawns = getAvailableSpawns(
    room
  );
  const budget = createRoomEnergyBudget(room);
  const assignedSpawnNames = new Set();
  const outcomes = [];
  let sequence = 0;

  for (const request of requests) {
    const candidates = rankSpawnsForRequest(
      request,
      availableSpawns.filter(spawn =>
        !assignedSpawnNames.has(spawn.name)
      )
    );
    const spawn = candidates[0];

    if (!spawn) {
      outcomes.push({
        status: 'no-available-spawn',
        requestKey: request.requestKey
      });
      continue;
    }

    sequence += 1;
    const name = buildCreepName(
      request,
      sequence
    );
    const outcome = submitSpawnRequest(
      spawn,
      request,
      name,
      budget
    );

    outcomes.push(outcome);

    if (outcome.status === 'submitted-locally') {
      assignedSpawnNames.add(spawn.name);
      savePendingSpawn(outcome);
    }
  }

  return {
    roomName: room.name,
    observedEnergy: budget.observedEnergy,
    reservedEnergy: budget.reservedEnergy,
    remainingEnergy:
      getBudgetRemaining(budget),
    outcomes
  };
}
```

该实现故意不在一次失败后把所有请求都丢弃：

- 某个身体不合法，不影响后续请求；
- 某个名称冲突，可以记录并继续；
- 某个请求超过预算，较小的后续请求是否允许执行，应由你的策略决定；
- 没有空闲 Spawn 时，请求应保留到下一 tick，而不是重复创建新 key。

## 大请求是否应该阻塞小请求

假设队列是：

```text
优先级 700：1500 Energy 的 Harvester
优先级 600：300 Energy 的 Transporter
当前 Energy：800
```

两种策略都合理，但必须明确：

### 严格优先级

高优先级请求 Energy 不足时，本房间停止创建，等待它满足。

优点：不会让关键大身体长期被小请求消耗 Energy。

缺点：Spawn 可能闲置。

### 可跳过策略

暂时跳过大请求，执行能负担的小请求。

优点：提高 Spawn 利用率。

缺点：大请求可能长期饥饿。

可以给请求增加：

```js
blocking: true
```

当高优先级阻塞请求无法满足预算时，停止处理更低优先级请求。

## 紧急恢复需要特殊身体降级

当房间没有 Harvester 时，等待 1200 Energy 的完整身体可能导致永久停摆。紧急请求应提供可运行的最低身体：

```js
function chooseEmergencyBody(
  room,
  fullBody,
  fallbackBody
) {
  const fullCost = calculateBodyCost(
    fullBody
  );
  const fallbackCost = calculateBodyCost(
    fallbackBody
  );

  if (room.energyAvailable >= fullCost) {
    return [...fullBody];
  }

  if (
    Number.isInteger(fallbackCost)
    && room.energyAvailable >= fallbackCost
  ) {
    return [...fallbackBody];
  }

  return null;
}
```

这应与 [房间断代后如何生成应急 Harvester](/blog/screeps-spawn-emergency-recovery) 配合使用。

## 队列存 Memory 还是每 tick 重建

### 每 tick 重建

适合由当前房间状态直接推导的需求：

- 本地 Harvester 数量；
- Upgrader 插槽；
- Controller 降级风险；
- 当前防御需求。

优点是不会残留旧请求。缺点是必须正确计算 pending 和 spawning 覆盖。

### 持久队列

适合跨 tick 工作流：

- 远程房间建设计划；
- 手动 Console 请求；
- 一次性 Claim/Reserve 任务；
- 需要保留创建时间和超时信息的任务。

持久队列必须有版本、过期时间和迁移策略。

可以混合使用：

```text
本 tick 派生请求
+ Memory 中未过期的一次性请求
→ 统一验证、去重和排序
```

## 限频记录调度结果

```js
function summarizeSchedule(result) {
  return {
    type: 'spawn-schedule-summary',
    tick: Game.time,
    roomName: result.roomName,
    observedEnergy: result.observedEnergy,
    reservedEnergy: result.reservedEnergy,
    remainingEnergy: result.remainingEnergy,
    submitted: result.outcomes.filter(item =>
      item.status === 'submitted-locally'
    ).map(item => ({
      requestKey: item.requestKey,
      spawnName: item.spawnName,
      creepName: item.creepName,
      cost: item.cost
    })),
    rejected: result.outcomes.filter(item =>
      item.status !== 'submitted-locally'
    ).map(item => ({
      requestKey: item.requestKey ?? null,
      status: item.status,
      result: item.result ?? null
    }))
  };
}
```

不要把整个 Room、Spawn 或请求对象写入长期 Memory。保存 key、名字、状态、tick、成本和返回码即可。

## 常见错误

### 多个模块直接调用 `spawnCreep()`

无法形成统一优先级，也容易重复请求。

### 使用 Creep 名称作为需求 key

名称是一次创建对象身份，不是长期需求身份。

### 每 tick 重新创建随机 requestKey

去重机制会失效。

### 只依赖 `dryRun: true`

多个 Spawn 可能基于同一 tick 初始 Energy 分别通过检查。必须维护本地共享预算。

### `OK` 后立即删除请求并标记完成

`OK` 表示本地命令被接受，不是后续世界状态已经验证。

### 不统计 pending 和 spawning

相同角色会被重复排队。

### 同一个 Spawn 在循环中被分配两次

必须使用 `assignedSpawnNames` 或从候选数组中移除。

### 永远严格优先级

低优先级任务可能长期饿死；需要等待加权或显式阻塞策略。

### 永远跳过大请求

关键大身体可能永远攒不到 Energy。

### 队列没有过期时间

远程任务取消后，旧请求仍可能在几十个 tick 后突然执行。

## 排查清单

1. 列出所有调用 `spawnCreep()` 的模块。
2. 将真实调用收敛到一个调度入口。
3. 为每个需求定义稳定 `requestKey`。
4. 检查同 key 是否出现不同 fingerprint。
5. 明确紧急、防御、关键经济和普通任务优先级。
6. 把正在孵化和待验证记录计入需求覆盖。
7. 每个房间创建一份共享 Energy 预算。
8. 每个 Spawn 每 tick 最多分配一次。
9. 真实调用返回 `OK` 后再本地预留 Energy。
10. 下一 tick 验证指定名字是否进入孵化或已经出生。
11. 给一次性请求设置 `expiresAt`。
12. 记录预算、分配结果和拒绝原因。

## 验证状态与适用边界

仓库会检查本文 JavaScript 代码块语法，并用离线用例验证：

- requestKey 去重；
- 稳定优先级排序；
- 等待加权上限；
- 同房间 Energy 预留；
- 每个 Spawn 只分配一次；
- `OK` 后保存 pending；
- 后续 tick 的 spawning、released 和 timeout 状态。

这些测试不能模拟官方服务器真实的同 tick 意图结算顺序、多个 Spawn 对同一组 Extension 的实际扣能、Power Spawn 效果、敌对房间状态或真实 CPU 成本。因此 `consoleTested` 和 `liveTested` 保持为 `false`。

本文适用于：

- 一个房间有两个或三个 Spawn；
- 多个角色管理器同时请求 Creep；
- 需要应急恢复和普通生产共享队列；
- 提前补员、远程任务和防御任务同时存在；
- 需要可解释的创建优先级与日志；
- 需要避免同 tick 重复承诺共享 Energy。

本文不替代：

- 身体动态生成算法；
- Spawn 出口方向和阻塞诊断；
- Extension 供能诊断；
- 角色本身的运行逻辑；
- 真实 shard 多 tick 验证。

## 相关站内内容

- [Screeps spawnCreep() 返回码怎么排查](/blog/screeps-spawncreep-return-codes)
- [Screeps Spawn 出口被堵怎么办](/blog/screeps-spawn-exit-blocked-directions)
- [Screeps 如何根据 Energy 动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [Screeps 房间 EnergyAvailable 一直上不去怎么办](/blog/screeps-room-energyavailable-stuck)
- [Screeps 如何提前生成替代 Creep](/blog/screeps-creep-prespawn-replacement)
- [房间断代后如何生成应急 Harvester](/blog/screeps-spawn-emergency-recovery)
- [Screeps CPU Bucket 一直下降怎么办](/blog/screeps-cpu-bucket-degradation)

## 官方资料

- [StructureSpawn.spawnCreep() API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Game.spawns API](https://docs.screeps.com/api/Game.html#spawns)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Creeps and shared Spawn/Extension Energy](https://docs.screeps.com/creeps.html)
- [Debugging action return codes](https://docs.screeps.com/debugging.html)
- [Screeps Engine: spawnCreep runtime validation](https://github.com/screeps/engine/blob/master/src/game/structures.js)
- [Screeps Engine: create-creep intent processing](https://github.com/screeps/engine/blob/master/src/processor/intents/spawns/create-creep.js)
