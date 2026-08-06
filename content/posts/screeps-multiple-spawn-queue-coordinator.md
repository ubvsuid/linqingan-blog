---
title: "Screeps 多个 Spawn 如何共享生成队列：优先级、Energy 预算与同 tick 防冲突"
description: "为同一房间的多个 Spawn 建立一个确定性的生成队列：冻结请求身份、校验身体与名称、按优先级分配空闲 Spawn、预留共享 room.energyAvailable，并跨 tick 验证真实生成状态。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "队列"
  - "调试"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
  testedAt: "2026-08-06"
  testEnvironment: "Node.js 22 离线模拟（身体成本、名称与 requestKey 冲突、稳定优先级、共享 Energy 预算、每个 Spawn 单次分配、同 tick 幂等与跨 tick 观察；不是 Screeps 官方服务器）"
  testResult: "文章 JavaScript 代码块通过语法检查；48 个离线队列规划与观察断言通过。真实多 Spawn 房间、同 tick 外部提交、官方 shard Energy 扣除顺序和出生完成仍待验证。"
featured: false
---

当一个房间只有一个 Spawn 时，把 `spawnCreep()` 写在角色数量判断后面通常还能工作。房间出现两个或更多 Spawn 后，如果多个角色模块各自寻找空闲 Spawn 并直接提交请求，就会出现另一类问题：

- 两个模块生成了相同的 Creep 名称；
- 多个请求同时把同一份 `room.energyAvailable` 当作可用预算；
- 同一个 Spawn 在一个 tick 内被不同模块重复选择；
- `dryRun` 都返回 `OK`，正式提交时后面的请求却失败；
- 高优先级防断代请求被普通 Builder 抢先消耗 Energy；
- 请求成功后立刻从队列消失，却没有留下 Spawn ID、名称和后续观察窗口。

本文只解决一个问题：**如何让一个房间内的多个 Spawn 通过一个房间级协调器共享队列，并且让优先级、名称、Spawn 与 Energy 预算都能被明确审计。**

它与其他文章的边界是：

- [spawnCreep() 返回码排查](/blog/screeps-spawncreep-return-codes) 处理单个请求为什么被拒绝；
- [Creep 提前补员](/blog/screeps-creep-prespawn-replacement) 计算某个角色什么时候应该进入队列；
- [Spawn 出口阻塞](/blog/screeps-spawn-exit-blocked-directions) 处理已经安排的 Creep 为什么无法完成出生；
- 本文处理多个已准备请求怎样在同一房间、同一 tick 中被确定性地分配和提交。

## 快速结论

可靠的多个 Spawn 队列需要六个边界：

```text
角色或业务模块只负责 enqueue
→ requestKey 保证重复调用幂等
→ 房间协调器统一读取空闲 Spawn
→ 按优先级、创建 tick、序号稳定排序
→ 用 room.energyAvailable 建立本地共享预算
→ 每个 Spawn 最多提交一个正式请求
→ 保存最终返回值并跨 tick 观察
```

不要让 Harvester、Builder、Upgrader 和防御模块分别调用 `spawnCreep()`。它们应提交“我需要什么”，房间协调器负责决定“本 tick 由哪个 Spawn 执行”。

## 官方 API 能证明什么

`StructureSpawn.spawnCreep(body, name, opts)` 的官方边界包括：

- body 必须包含 1 到 50 个有效身体部件；
- name 必须提供、最长 100 个字符，并且不能与 `Game.creeps` 中的名称重复；
- `dryRun: true` 只检查当前调用是否可执行；
- 正式返回 `OK` 代表操作已经成功安排；
- `ERR_BUSY` 表示该 Spawn 正在生成其他 Creep；
- `ERR_NOT_ENOUGH_ENERGY` 表示房间 Spawn 与 Extension 中的 Energy 不足；
- `room.energyAvailable` 是该房间所有 Spawn 与 Extension 当前可用于生成的 Energy 总和。

这些 API 不会替玩家建立跨 Spawn 队列，也不会为多个独立模块预留名称、Spawn 或 Energy。队列、优先级和同 tick 本地预算都是玩家代码策略。

## 第一步：冻结并校验请求

先把身体成本、名称和 Memory 变成一个可保存的请求。不要把函数、游戏对象或可变引用直接放入队列。

```js
function getCreepBodyCost(body) {
  if (
    !Array.isArray(body)
    || body.length < 1
    || body.length > 50
  ) {
    return null;
  }

  let total = 0;

  for (const part of body) {
    const cost = BODYPART_COST[part];

    if (!Number.isFinite(cost)) {
      return null;
    }

    total += cost;
  }

  return total;
}

function cloneSpawnMemory(memory) {
  try {
    const serialized = JSON.stringify(memory ?? {});
    return serialized === undefined
      ? null
      : JSON.parse(serialized);
  } catch {
    return null;
  }
}

function normalizeSpawnRequest(input) {
  const body = Array.isArray(input?.body)
    ? [...input.body]
    : null;
  const bodyCost = getCreepBodyCost(body);
  const memory = cloneSpawnMemory(input?.memory);
  const name = typeof input?.name === 'string'
    ? input.name.trim()
    : '';
  const requestKey =
    typeof input?.requestKey === 'string'
      ? input.requestKey.trim()
      : '';
  const priority = Number.isInteger(input?.priority)
    ? input.priority
    : 100;

  if (bodyCost === null) {
    return { status: 'body-invalid' };
  }

  if (name.length < 1 || name.length > 100) {
    return { status: 'name-invalid' };
  }

  if (requestKey.length < 1) {
    return { status: 'request-key-required' };
  }

  if (memory === null) {
    return { status: 'memory-not-json-compatible' };
  }

  return {
    status: 'request-valid',
    request: {
      requestKey,
      name,
      body,
      bodyCost,
      memory,
      priority
    }
  };
}
```

`requestKey` 表示业务请求身份，例如：

```js
`harvester:${roomName}:${sourceId}:replacement`
```

它不是 Creep 名称，也不是随机日志 ID。重复运行同一个角色判断时，应得到相同的 `requestKey`，这样队列才能识别“同一需求再次提交”。

## 第二步：建立房间级队列状态

```js
function getSpawnCoordinatorMemory() {
  Memory.spawnCoordinator ??= {
    rooms: {}
  };

  return Memory.spawnCoordinator;
}

function getRoomSpawnQueue(roomName) {
  const coordinator = getSpawnCoordinatorMemory();

  coordinator.rooms[roomName] ??= {
    nextSequence: 1,
    finalizedTick: null,
    jobs: [],
    submissions: [],
    history: []
  };

  return coordinator.rooms[roomName];
}

function sameSpawnRequest(left, right) {
  return (
    left.requestKey === right.requestKey
    && left.name === right.name
    && left.priority === right.priority
    && JSON.stringify(left.body)
      === JSON.stringify(right.body)
    && JSON.stringify(left.memory)
      === JSON.stringify(right.memory)
  );
}

function isNameReserved(name) {
  if (Game.creeps[name]) {
    return true;
  }

  const coordinator = getSpawnCoordinatorMemory();

  return Object.values(coordinator.rooms).some(roomState =>
    roomState.jobs.some(job =>
      job.name === name
      && job.status === 'queued'
    )
    || roomState.submissions.some(submission =>
      submission.name === name
      && submission.status !== 'born'
      && submission.status !== 'failed'
    )
  );
}
```

名称必须按全局范围保护，因为 Creep 名称不是房间内唯一，而是 `Game.creeps` 的全局键。

## 第三步：让业务模块只负责入队

```js
function enqueueSpawnRequest(roomName, input) {
  const room = Game.rooms[roomName];

  if (!room) {
    return {
      status: 'room-not-visible',
      jobId: null
    };
  }

  const normalized = normalizeSpawnRequest(input);

  if (normalized.status !== 'request-valid') {
    return {
      status: normalized.status,
      jobId: null
    };
  }

  const request = normalized.request;
  const roomState = getRoomSpawnQueue(roomName);
  const existing = roomState.jobs.find(job =>
    job.requestKey === request.requestKey
    && job.status === 'queued'
  );

  if (existing) {
    return sameSpawnRequest(existing, request)
      ? {
          status: 'already-queued',
          jobId: existing.id
        }
      : {
          status: 'request-key-conflict',
          jobId: existing.id
        };
  }

  if (
    request.bodyCost
    > room.energyCapacityAvailable
  ) {
    return {
      status: 'body-exceeds-room-capacity',
      jobId: null
    };
  }

  if (isNameReserved(request.name)) {
    return {
      status: 'creep-name-reserved',
      jobId: null
    };
  }

  const sequence = roomState.nextSequence++;
  const job = {
    id: `${roomName}:${Game.time}:${sequence}`,
    roomName,
    sequence,
    createdAt: Game.time,
    status: 'queued',
    ...request
  };

  roomState.jobs.push(job);

  return {
    status: 'queued',
    jobId: job.id
  };
}
```

如果业务请求内容改变，就应该使用新的 `requestKey`，或者显式取消旧请求后再入队。不要悄悄用相同键覆盖不同身体、名称或优先级。

## 第四步：稳定排序空闲 Spawn 与队列

```js
function getIdleOwnedSpawns(room) {
  return room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_SPAWN
      && structure.my
      && structure.isActive()
      && structure.spawning === null
  }).sort((left, right) =>
    left.name.localeCompare(right.name)
    || left.id.localeCompare(right.id)
  );
}

function compareSpawnJobs(left, right) {
  return (
    right.priority - left.priority
    || left.createdAt - right.createdAt
    || left.sequence - right.sequence
    || left.id.localeCompare(right.id)
  );
}
```

本文约定：数值更大的 `priority` 更优先。完全同优先级时，先入队的请求优先；仍然相同时使用序号和 ID 保证排序结果稳定。

## 第五步：用共享 Energy 建立一次性计划

多个 Spawn 使用同一个房间的 Spawn/Extension Energy 网络。计划阶段必须只读取一次 `room.energyAvailable`，并在本地逐个扣除已分配请求的成本。

```js
function buildRoomSpawnPlan(roomName) {
  const room = Game.rooms[roomName];

  if (!room) {
    return {
      status: 'room-not-visible',
      assignments: []
    };
  }

  const roomState = getRoomSpawnQueue(roomName);
  const spawns = getIdleOwnedSpawns(room);
  const jobs = roomState.jobs
    .filter(job => job.status === 'queued')
    .sort(compareSpawnJobs);

  const assignments = [];
  const blocked = [];
  let remainingEnergy = room.energyAvailable;

  for (const spawn of spawns) {
    const job = jobs[assignments.length];

    if (!job) {
      break;
    }

    if (Game.creeps[job.name]) {
      blocked.push({
        jobId: job.id,
        status: 'name-now-exists'
      });
      break;
    }

    if (job.bodyCost > remainingEnergy) {
      blocked.push({
        jobId: job.id,
        status: 'waiting-for-room-energy',
        required: job.bodyCost,
        available: remainingEnergy
      });
      break;
    }

    assignments.push({
      spawnId: spawn.id,
      spawnName: spawn.name,
      jobId: job.id,
      name: job.name,
      bodyCost: job.bodyCost
    });

    remainingEnergy -= job.bodyCost;
  }

  return {
    status: assignments.length > 0
      ? 'plan-ready'
      : blocked.length > 0
        ? blocked[0].status
        : spawns.length === 0
          ? 'no-idle-spawn'
          : 'queue-empty',
    observedEnergy: room.energyAvailable,
    remainingPlannedEnergy: remainingEnergy,
    assignments,
    blocked
  };
}
```

这是严格优先级策略：如果队首高优先级请求暂时没有足够 Energy，不让更便宜的低优先级请求绕过。这样可以避免普通任务长期挤掉紧急 Harvester。代价是某些 tick 可能有空闲 Spawn 未使用。

如果你的房间需要“允许低优先级绕过”，应把它做成显式策略并记录被跳过的请求，而不是在排序循环中隐式发生。

## 第六步：一个协调器完成 dryRun 与正式提交

```js
function finalizeRoomSpawnQueue(roomName) {
  const roomState = getRoomSpawnQueue(roomName);

  if (roomState.finalizedTick === Game.time) {
    return {
      status: 'already-finalized-this-tick',
      attempts: []
    };
  }

  roomState.finalizedTick = Game.time;

  const plan = buildRoomSpawnPlan(roomName);
  const attempts = [];

  for (const assignment of plan.assignments) {
    const spawn = Game.getObjectById(
      assignment.spawnId
    );
    const job = roomState.jobs.find(
      candidate =>
        candidate.id === assignment.jobId
        && candidate.status === 'queued'
    );

    if (!spawn || !job) {
      attempts.push({
        ...assignment,
        status: 'assignment-stale'
      });
      break;
    }

    if (spawn.spawning !== null) {
      attempts.push({
        ...assignment,
        status: 'spawn-became-busy'
      });
      break;
    }

    const options = {
      memory: job.memory
    };
    const dryRunResult = spawn.spawnCreep(
      job.body,
      job.name,
      {
        ...options,
        dryRun: true
      }
    );

    if (dryRunResult !== OK) {
      attempts.push({
        ...assignment,
        status: 'dry-run-rejected',
        dryRunResult
      });
      break;
    }

    const result = spawn.spawnCreep(
      job.body,
      job.name,
      options
    );

    attempts.push({
      ...assignment,
      status: result === OK
        ? 'spawn-scheduled'
        : 'spawn-submit-rejected',
      dryRunResult,
      result
    });

    if (result !== OK) {
      break;
    }

    job.status = 'submitted';

    roomState.submissions.push({
      jobId: job.id,
      requestKey: job.requestKey,
      spawnId: spawn.id,
      spawnName: spawn.name,
      name: job.name,
      bodyCost: job.bodyCost,
      submittedAt: Game.time,
      needTime:
        spawn.spawning?.name === job.name
          ? spawn.spawning.needTime
          : null,
      status: 'submitted',
      result
    });

    roomState.jobs = roomState.jobs.filter(
      candidate => candidate.id !== job.id
    );
  }

  roomState.lastPlan = {
    tick: Game.time,
    ...plan,
    attempts
  };

  return {
    status: attempts.some(
      attempt =>
        attempt.status === 'spawn-scheduled'
    )
      ? 'batch-submitted'
      : plan.status,
    plan,
    attempts
  };
}
```

`dryRun` 不会锁住 Spawn、名称或 Energy。它与正式调用之间仍可能被其他模块干扰。因此本地队列的真正安全边界不是“每个模块先 dryRun”，而是“只有一个房间协调器允许正式提交”。在本文的严格优先级策略中，任何已计划请求在最终提交阶段变成 stale、busy 或 rejected 时，协调器都会停止本 tick 的后续提交，避免低优先级请求绕过失败的队首请求。

## 第七步：跨 tick 验证同一名称与 Spawn

```js
function observeRoomSpawnSubmissions(roomName) {
  const roomState = getRoomSpawnQueue(roomName);
  const observations = [];

  for (const submission of roomState.submissions) {
    const spawn = Game.getObjectById(
      submission.spawnId
    );
    const creep = Game.creeps[submission.name];

    if (
      creep?.spawning === true
      && spawn?.spawning?.name
        === submission.name
    ) {
      submission.status = 'confirmed-spawning';
    } else if (
      creep
      && creep.spawning === false
    ) {
      submission.status = 'born';
    } else if (
      spawn?.spawning?.name
        === submission.name
    ) {
      submission.status =
        'spawn-reports-requested-name';
    } else if (
      Number.isInteger(submission.needTime)
      && Game.time
        > submission.submittedAt
          + submission.needTime
          + 2
    ) {
      submission.status =
        'completion-unverified';
    } else {
      submission.status = 'pending-observation';
    }

    observations.push({
      jobId: submission.jobId,
      name: submission.name,
      spawnId: submission.spawnId,
      status: submission.status
    });
  }

  const terminal = new Set([
    'born',
    'completion-unverified'
  ]);
  const finished = roomState.submissions.filter(
    submission =>
      terminal.has(submission.status)
  );

  roomState.history.push(...finished);
  roomState.history =
    roomState.history.slice(-30);
  roomState.submissions =
    roomState.submissions.filter(
      submission =>
        !terminal.has(submission.status)
    );

  return observations;
}
```

`spawnCreep() === OK` 是提交证据；`spawn.spawning.name` 和 `creep.spawning` 是后续生成状态；`creep.spawning === false` 才支持“已经完成出生”。不要把三种状态合并成一个“成功”。

## 第八步：明确取消与过期，而不是静默删除

```js
function cancelQueuedSpawnJob(
  roomName,
  requestKey,
  reason = 'cancelled-by-policy'
) {
  const roomState = getRoomSpawnQueue(roomName);
  const job = roomState.jobs.find(candidate =>
    candidate.requestKey === requestKey
    && candidate.status === 'queued'
  );

  if (!job) {
    return {
      status: 'queued-job-not-found'
    };
  }

  roomState.jobs = roomState.jobs.filter(
    candidate => candidate.id !== job.id
  );
  roomState.history.push({
    ...job,
    status: 'cancelled',
    reason,
    finishedAt: Game.time
  });
  roomState.history =
    roomState.history.slice(-30);

  return {
    status: 'queued-job-cancelled',
    jobId: job.id
  };
}
```

当角色需求消失、目标房间丢失或策略版本改变时，应使用显式取消状态。静默删除会让你无法区分“业务不再需要”和“队列意外丢数据”。

## 主循环接入顺序

```js
module.exports.loop = function () {
  for (const roomName of Object.keys(
    getSpawnCoordinatorMemory().rooms
  )) {
    observeRoomSpawnSubmissions(roomName);
  }

  runRoomBusinessLogic();

  for (const roomName of Object.keys(
    getSpawnCoordinatorMemory().rooms
  ).sort()) {
    finalizeRoomSpawnQueue(roomName);
  }
};
```

顺序应保持一致：

1. 先观察上一 tick 的提交；
2. 角色和房间逻辑只入队；
3. 所有业务模块结束后，每个房间只最终提交一次。

## 常见错误

### 每个角色模块寻找自己的空闲 Spawn

两个模块可能在同一 tick 都读取到 `spawn.spawning === null`。只有统一协调器才能让“选择”与“正式提交”处于同一个本地控制边界。

### 把 dryRun 当作预留

`dryRun: true` 只检查当前调用是否可能执行，不会为后续正式调用锁住名称、Spawn 或 Energy。

### 每个 Spawn 单独读取 room.energyAvailable

`room.energyAvailable` 是房间共享总量。多个 Spawn 各自按完整总量规划，会重复承诺同一份 Energy。

### 低优先级请求隐式绕过

如果普通 Builder 总是比昂贵的紧急 Harvester 更容易满足，它可能持续消耗新补入的 Energy。是否允许绕过必须成为可见策略。

### 请求成功后不保存身份

只记录 `OK` 而不保存 `jobId`、`requestKey`、`spawnId` 和 `name`，后续就无法证明观察到的是同一次请求。

## 验证边界

本次文章完成了：

- 官方 `spawnCreep()`、`dryRun`、`StructureSpawn.spawning` 与房间 Energy 属性核对；
- 中文与英文代码块语法检查；
- 48 个离线队列规划和观察断言；
- 确定性优先级、名称保留、共享 Energy 预算、每个 Spawn 单次分配和同 tick 幂等检查；
- Canonical、双语映射、知识模块、主题发现、搜索与 Sitemap 的仓库门禁。

仍然待验证：

- 真实 Screeps Console 输出；
- 官方 shard 中两个或更多 Spawn 的连续运行；
- 其他旧模块绕过协调器直接调用 `spawnCreep()`；
- 正式调用后的真实 Energy 扣除顺序；
- 同 tick 多房间、敌对影响和长时间饥饿策略；
- 真实截图与长期生产数据。

## 官方文档

- [StructureSpawn.spawnCreep()](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [StructureSpawn.spawning](https://docs.screeps.com/api/#StructureSpawn.spawning)
- [StructureSpawn.Spawning](https://docs.screeps.com/api/#StructureSpawn.Spawning)
- [Room.energyAvailable](https://docs.screeps.com/api/#Room.energyAvailable)
- [Room.energyCapacityAvailable](https://docs.screeps.com/api/#Room.energyCapacityAvailable)
