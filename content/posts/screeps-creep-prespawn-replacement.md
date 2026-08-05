---
title: "Screeps Creep 提前补员：用 ticksToLive、Spawn 时间和路程避免断代"
description: "根据 ticksToLive、Spawn 剩余占用、身体生成时间、到岗路程和安全余量计算 Screeps Creep 提前补员时机，并用房间级单入口、重复覆盖保护和下一 tick 验证减少岗位空窗。"
publishedAt: "2026-08-03"
updatedAt: "2026-08-05"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "补员"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-05"
  testedAt: "2026-08-05"
  testEnvironment: "Node.js 离线模拟（TTL、目标数量、正在生成数量、Spawn 等待、生成时间、通勤、安全余量、临时重叠和输入边界；不是 Screeps 官方服务器）"
  testResult: "20 个离线替换决策场景通过；完整房间级示例通过 JavaScript 语法检查。真实 Console、Spawn 竞争、到岗交接和官方 shard 行为仍待验证。"
featured: false
---

Harvester、Hauler 或 Upgrader 死亡后才调用 `spawnCreep()`，通常已经来不及。

新 Creep 需要等待可用 Spawn、完成身体生成，再走到 Source、Controller 或运输岗位。旧 Creep 的 `ticksToLive` 在这段时间里持续减少，因此“当前角色数量正常”并不代表换代时不会出现空窗。

本文解决一个明确问题：**在旧 Creep 死亡前计算替换截止时间，由一个房间级 Spawn 入口提交请求，并阻止同一岗位被重复补员。**

站内工具中心的“Spawn 队列与替换规划器”适合先估算平均 Spawn 利用率和 prespawn TTL；本文负责把估算转成可诊断的运行代码。工具的平均容量结论不等于真实队列已经安全。

## 快速结论

第一版可以使用以下保守公式：

```text
提前量 = 最早可用 Spawn 的剩余占用
       + 新 Creep 的生成时间
       + 新 Creep 的到岗路程
       + 安全余量
```

当某只现役 Creep 满足：

```text
ticksToLive <= 提前量
```

并且没有正在生成或已经完成的临时替代者覆盖它时，才提交一次替换请求。

生成时间的基础值为：

```text
body.length × CREEP_SPAWN_TIME
```

官方常量 `CREEP_SPAWN_TIME` 当前为每个身体部件 3 tick。代码使用基础时间作为保守值，不假设 `PWR_OPERATE_SPAWN` 一定持续存在。

## 与已有文章的明确区别

站内现有 Spawn 内容分别解决：

- [`spawnCreep()` 返回值排查](/blog/screeps-spawncreep-return-codes)：一次生成为什么失败；
- [按房间 Energy 动态生成身体](/blog/screeps-dynamic-creep-body-energy)：当前 Energy 能生成什么身体；
- [`renewCreep()` 安全续命](/blog/screeps-spawn-renew-creep)：是否让旧 Creep 返回 Spawn 续命；
- [`recycleCreep()` 安全回收](/blog/screeps-spawn-recycle-creep)：退役单位如何回收；
- [房间断代后的第一只采集者恢复](/blog/screeps-spawn-emergency-recovery)：岗位已经归零后的应急分支。

本文不处理“已经断代”，而是处理“**在断代发生前完成新旧交接**”。因此应恢复原有 `screeps-creep-prespawn-replacement` Slug，而不是再创建一个“Spawn 队列”相似 URL。

## 为什么只看当前数量会晚

常见代码是：

```js
if (harvesters.length < 2) {
  spawn.spawnCreep(body, name, options);
}
```

假设旧 Harvester 还剩 30 tick，替代者需要：

| 阶段 | 需要时间 |
|---|---:|
| 等待当前 Spawn | 12 tick |
| 6 个身体部件生成 | 18 tick |
| 走到 Source | 25 tick |
| 安全余量 | 10 tick |
| **合计** | **65 tick** |

等数量从 2 变成 1 才生成，岗位至少会空缺 35 tick。

`creep.ticksToLive` 是对象当前剩余寿命。普通 Creep 的基础寿命为 1500 tick；带 `CLAIM` 部件的 Creep 基础寿命为 600 tick。调度器应读取真实 TTL，而不是只按角色名写死生命周期。

## Spawn 等待时间怎么计算

正在生成时，`spawn.spawning.remainingTime` 表示当前任务还剩多少时间。多个 Spawn 中应取最早可用者：

```js
function getEarliestSpawnWait(spawns) {
  if (spawns.length === 0) return Number.POSITIVE_INFINITY;

  return Math.min(
    ...spawns.map(spawn =>
      spawn.spawning?.remainingTime ?? 0
    )
  );
}
```

这个值必须每 tick 重算。它不是永久预订，也不保证其他模块不会先占用 Spawn。因此所有正式 `spawnCreep()` 调用仍应收敛到同一个房间级入口。

## 到岗路程不能直接等于直线距离

`travelTicks` 会受到以下因素影响：

- Road、plain 与 swamp；
- MOVE 与疲劳部件比例；
- 空载和满载差异；
- Creep 交通阻塞；
- 跨房间出口；
- 路径缓存失效；
- 工作点是否被其他单位占用。

第一版可使用保守配置。真实运行后至少记录“完成生成 tick”和“第一次到岗 tick”，再用实际差值替换估算。移动明显偏慢时，继续查看 [MOVE、fatigue、地形与负载](/blog/screeps-move-fatigue-body-ratio) 和 [`moveTo()` 返回 OK 但不移动](/blog/screeps-moveto-not-moving)。

## 为什么最低 TTL 会造成重复补员

目标数量为 2 时，旧 Creep A 进入阈值，替代者 C 开始生成。C 完成后，A 可能仍然存活，角色总数暂时变成 3。

若代码仍只看到 A 的低 TTL，就会错误生成 D。正确判断需要区分：

- 目标数量；
- 当前有效 Creep 数量；
- 正在生成数量；
- 超出目标数量的临时重叠；
- 已进入提前阈值的旧 Creep 数量。

```text
未覆盖的到期数量
= 已进入阈值的现役数量
- 超出目标数量的临时余量
```

只有结果大于 0 时，才继续提交替代者。

## 可离线验证的决策函数

为了让公式可以脱离 Screeps 环境测试，决策函数直接接收已经计算好的 `spawnTicks`：

```js
function evaluateRoleReplacement(input) {
  const {
    targetCount,
    activeTtls,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  } = input;

  const integers = [
    targetCount,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  ];

  if (
    !integers.every(Number.isInteger)
    || targetCount < 1
    || spawningCount < 0
    || spawnTicks < 1
    || spawnWaitTicks < 0
    || travelTicks < 0
    || safetyBuffer < 0
    || !Array.isArray(activeTtls)
    || !activeTtls.every(ttl =>
      Number.isInteger(ttl) && ttl >= 0
    )
  ) {
    return {
      valid: false,
      shouldSpawn: false,
      reason: 'invalid-input'
    };
  }

  const leadTicks =
    spawnWaitTicks
    + spawnTicks
    + travelTicks
    + safetyBuffer;
  const totalCount = activeTtls.length + spawningCount;
  const missingCount = Math.max(
    0,
    targetCount - totalCount
  );
  const surplusCount = Math.max(
    0,
    totalCount - targetCount
  );
  const dueCount = activeTtls.filter(
    ttl => ttl <= leadTicks
  ).length;
  const uncoveredDueCount = Math.max(
    0,
    dueCount - surplusCount
  );
  const minimumSlack = activeTtls.length > 0
    ? Math.min(
        ...activeTtls.map(ttl => ttl - leadTicks)
      )
    : Number.NEGATIVE_INFINITY;

  if (missingCount > 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'count-below-target',
      leadTicks,
      missingCount,
      dueCount,
      surplusCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  if (uncoveredDueCount > 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'prespawn-due',
      leadTicks,
      missingCount,
      dueCount,
      surplusCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  return {
    valid: true,
    shouldSpawn: false,
    reason: 'covered',
    leadTicks,
    missingCount,
    dueCount,
    surplusCount,
    uncoveredDueCount,
    minimumSlack
  };
}
```

`minimumSlack` 的含义：

- 正数：距离理想提交时间还有余量；
- 0：刚好达到阈值；
- 负数：已经晚于理想提交时间。

它是本地队列排序指标，不是 Screeps API 返回码。

## 完整房间级提前补员示例

下面的完整示例增加了历史版本缺少的三个生产边界：

1. 每个房间每 tick 只运行一次；
2. 所有角色请求通过一个入口排序；
3. `spawnCreep() === OK` 后，下一 tick 检查名称是否出现在 `Game.creeps` 或 `spawn.spawning.name` 中。

```js
const HISTORY_LIMIT = 20;

const ROLE_CONFIG = {
  harvester: {
    priority: 10,
    targetCount: 2,
    body: [WORK, WORK, CARRY, MOVE],
    travelTicks: 25,
    safetyBuffer: 15
  },
  hauler: {
    priority: 20,
    targetCount: 2,
    body: [CARRY, CARRY, MOVE],
    travelTicks: 18,
    safetyBuffer: 15
  },
  upgrader: {
    priority: 30,
    targetCount: 1,
    body: [WORK, WORK, CARRY, CARRY, MOVE, MOVE],
    travelTicks: 12,
    safetyBuffer: 15
  }
};

function getBaseSpawnTicks(body) {
  if (!Array.isArray(body) || body.length < 1 || body.length > 50) {
    return null;
  }
  return body.length * CREEP_SPAWN_TIME;
}

function evaluateRoleReplacement(input) {
  const {
    targetCount,
    activeTtls,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  } = input;

  const integers = [
    targetCount,
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  ];

  if (
    !integers.every(Number.isInteger)
    || targetCount < 1
    || spawningCount < 0
    || spawnTicks < 1
    || spawnWaitTicks < 0
    || travelTicks < 0
    || safetyBuffer < 0
    || !Array.isArray(activeTtls)
    || !activeTtls.every(ttl => Number.isInteger(ttl) && ttl >= 0)
  ) {
    return { valid: false, shouldSpawn: false, reason: 'invalid-input' };
  }

  const leadTicks = spawnWaitTicks + spawnTicks + travelTicks + safetyBuffer;
  const totalCount = activeTtls.length + spawningCount;
  const missingCount = Math.max(0, targetCount - totalCount);
  const surplusCount = Math.max(0, totalCount - targetCount);
  const dueCount = activeTtls.filter(ttl => ttl <= leadTicks).length;
  const uncoveredDueCount = Math.max(0, dueCount - surplusCount);
  const minimumSlack = activeTtls.length > 0
    ? Math.min(...activeTtls.map(ttl => ttl - leadTicks))
    : Number.NEGATIVE_INFINITY;

  if (missingCount > 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'count-below-target',
      leadTicks,
      missingCount,
      dueCount,
      surplusCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  if (uncoveredDueCount > 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'prespawn-due',
      leadTicks,
      missingCount,
      dueCount,
      surplusCount,
      uncoveredDueCount,
      minimumSlack
    };
  }

  return {
    valid: true,
    shouldSpawn: false,
    reason: 'covered',
    leadTicks,
    missingCount,
    dueCount,
    surplusCount,
    uncoveredDueCount,
    minimumSlack
  };
}

function getRoomState(roomName) {
  Memory.prespawnReplacement ??= {};
  Memory.prespawnReplacement[roomName] ??= {
    lastRunTick: null,
    pending: null,
    history: []
  };
  return Memory.prespawnReplacement[roomName];
}

function verifyPendingReplacement(state) {
  const pending = state.pending;
  if (!pending || pending.tick >= Game.time) return null;

  const creep = Game.creeps[pending.name] ?? null;
  const spawn = Game.spawns[pending.spawnName] ?? null;
  const observedInSpawn = spawn?.spawning?.name === pending.name;
  const observedAsCreep = Boolean(creep);
  const status = observedInSpawn || observedAsCreep
    ? 'replacement-observed'
    : 'replacement-not-observed';

  const record = {
    ...pending,
    verifiedAt: Game.time,
    observedInSpawn,
    observedAsCreep,
    creepSpawning: creep?.spawning ?? null,
    status
  };

  state.history ??= [];
  state.history.push(record);
  state.history = state.history.slice(-HISTORY_LIMIT);
  state.lastVerification = record;
  state.pending = null;
  return record;
}

function getUsableSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn => spawn.my === true && spawn.isActive())
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getEarliestSpawnWait(spawns) {
  if (spawns.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...spawns.map(spawn => spawn.spawning?.remainingTime ?? 0));
}

function belongsToRoom(creep, roomName) {
  const homeRoom = creep.memory?.homeRoom ?? creep.memory?.home;
  return typeof homeRoom === 'string'
    ? homeRoom === roomName
    : creep.room.name === roomName;
}

function getRoleCreeps(room, role) {
  return Object.values(Game.creeps)
    .filter(creep => creep.memory?.role === role && belongsToRoom(creep, room.name));
}

function createRoleRequest(room, role, config, spawnWaitTicks) {
  const creeps = getRoleCreeps(room, role);
  const activeCreeps = creeps
    .filter(creep => !creep.spawning && Number.isInteger(creep.ticksToLive))
    .sort((left, right) => left.ticksToLive - right.ticksToLive || left.name.localeCompare(right.name));
  const spawningCount = creeps.filter(creep => creep.spawning).length;
  const spawnTicks = getBaseSpawnTicks(config.body);

  const decision = evaluateRoleReplacement({
    targetCount: config.targetCount,
    activeTtls: activeCreeps.map(creep => creep.ticksToLive),
    spawningCount,
    spawnTicks,
    spawnWaitTicks,
    travelTicks: config.travelTicks,
    safetyBuffer: config.safetyBuffer
  });

  if (!decision.valid || !decision.shouldSpawn) return null;

  return {
    role,
    config,
    replacementFor: activeCreeps[0]?.name ?? null,
    activeCount: activeCreeps.length,
    spawningCount,
    ...decision
  };
}

function compareRequests(left, right) {
  const leftTier = left.reason === 'count-below-target' ? 0 : 1;
  const rightTier = right.reason === 'count-below-target' ? 0 : 1;

  if (leftTier !== rightTier) return leftTier - rightTier;
  if (leftTier === 0) {
    return right.missingCount - left.missingCount
      || left.config.priority - right.config.priority
      || left.role.localeCompare(right.role);
  }
  return left.minimumSlack - right.minimumSlack
    || left.config.priority - right.config.priority
    || left.role.localeCompare(right.role);
}

function createCreepName(request, room, spawn) {
  return [request.role, room.name, spawn.name, Game.time].join('-');
}

function runRoomPrespawnManager(room) {
  const state = getRoomState(room.name);
  const verification = verifyPendingReplacement(state);

  if (state.lastRunTick === Game.time) {
    return { status: 'already-ran-this-tick', verification };
  }
  state.lastRunTick = Game.time;

  if (room.controller?.my !== true) {
    return { status: 'owned-room-unavailable', verification };
  }

  const spawns = getUsableSpawns(room);
  if (spawns.length === 0) {
    return { status: 'no-usable-spawn', verification };
  }

  const spawnWaitTicks = getEarliestSpawnWait(spawns);
  const requests = Object.entries(ROLE_CONFIG)
    .map(([role, config]) => createRoleRequest(room, role, config, spawnWaitTicks))
    .filter(Boolean)
    .sort(compareRequests);

  if (requests.length === 0) {
    return { status: 'no-request', verification };
  }

  const request = requests[0];
  const spawn = spawns.find(item => !item.spawning);
  if (!spawn) {
    return { status: 'all-spawns-busy', request, verification };
  }

  const name = createCreepName(request, room, spawn);
  const memory = {
    role: request.role,
    homeRoom: room.name,
    bornAt: Game.time,
    replacementReason: request.reason,
    replacementFor: request.replacementFor
  };

  const dryRunResult = spawn.spawnCreep(request.config.body, name, {
    memory,
    dryRun: true
  });

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      dryRunResult,
      spawnName: spawn.name,
      name,
      request,
      verification
    };
  }

  const result = spawn.spawnCreep(request.config.body, name, { memory });
  if (result === OK) {
    state.pending = {
      tick: Game.time,
      name,
      spawnName: spawn.name,
      role: request.role,
      reason: request.reason,
      replacementFor: request.replacementFor,
      leadTicks: request.leadTicks,
      minimumSlack: request.minimumSlack
    };
  }

  return {
    status: result === OK ? 'spawn-submitted' : 'spawn-failed',
    result,
    dryRunResult,
    spawnName: spawn.name,
    name,
    request,
    verification
  };
}

module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    if (room.controller?.my !== true) continue;
    const outcome = runRoomPrespawnManager(room);
    if (outcome.status !== 'no-request' || outcome.verification) {
      console.log(JSON.stringify({
        type: 'prespawn-replacement',
        tick: Game.time,
        roomName: room.name,
        ...outcome
      }));
    }
  }

  for (const creep of Object.values(Game.creeps)) {
    if (creep.spawning) continue;
    // Continue the existing role dispatcher here.
  }
};

```

把 `ROLE_CONFIG`、房间归属字段、身体和路程换成自己的数据。示例中的优先级数字越小越高。

## 请求排序为什么先处理真实缺员

代码把请求分成两层：

1. `count-below-target`：岗位数量已经不足；
2. `prespawn-due`：数量仍足够，但某只 Creep 已进入替换阈值。

真实缺员先按缺少数量排序，再按角色优先级；正常替换先按 `minimumSlack` 排序。这样不会让一个还有 20 tick 余量的 Upgrader 替换请求抢走已经缺少 Harvester 的 Spawn。

该顺序仍是示例策略。战斗、防御、远程预订和房间撤退应使用独立优先级。

## `spawnCreep()` 返回值怎么处理

| 返回值 | 调度含义 | 建议处理 |
|---|---|---|
| `OK` | 生成请求已安排 | 保存名称、Spawn、角色、原因和 tick，并在下一 tick 观察 |
| `ERR_BUSY` | 队列看到的 Spawn 与正式提交时不一致 | 查找绕过统一入口的模块 |
| `ERR_NOT_ENOUGH_ENERGY` | 时机正确但当前身体无法负担 | 使用动态身体或等待；关键角色进入应急策略 |
| `ERR_NAME_EXISTS` | 名称或多入口冲突 | 检查命名与同 tick 重复调用 |
| `ERR_INVALID_ARGS` | body、名称或选项错误 | 停止盲目重试并修复配置 |
| `ERR_NOT_OWNER` | Spawn 不属于自己 | 核对房间和对象来源 |
| `ERR_RCL_NOT_ENOUGH` | Spawn 当前不可使用 | 检查 RCL 与 `isActive()` |

`dryRun` 通过后仍必须保存正式调用结果。两次调用之间，其他代码仍可能改变 Spawn 占用、Energy 或名称状态。

## 下一 tick 观察能证明什么

示例中的：

```text
replacement-observed
```

只证明已提交名称在下一 tick 被观察到，不能证明它已经到岗，也不能证明岗位没有空窗。

完整交接至少要记录：

1. 旧 Creep 第一次进入阈值；
2. `spawnCreep()` 正式返回 `OK`；
3. 新 Creep 出现在 Spawn 或 `Game.creeps`；
4. 新 Creep 完成生成；
5. 新 Creep 第一次到达工作点；
6. 旧 Creep 死亡或离岗。

只有第 5 项早于第 6 项，才能证明本次换代没有岗位空窗。由于工作点定义依赖具体角色，通用 Spawn 管理器不能替每个角色伪造“已到岗”。

## 与 `renewCreep()` 和应急恢复的边界

普通经济角色通常适合提前生成替代者：旧单位继续工作，新单位同时生成和通勤。

`renewCreep()` 会占用 Spawn，并要求旧 Creep 返回附近，更适合少量特殊单位而不是默认经济循环。房间已经没有采集者时，提前替换流程也已经失效，应立即转入 [断代后的第一只采集者恢复](/blog/screeps-spawn-emergency-recovery)。

推荐决策顺序：

```text
先清理死亡 Memory
→ 运行断代应急恢复
→ 若未占用 Spawn，再运行提前补员
→ 若仍有空闲能力，再处理普通扩编请求
```

## 站内工具如何配合

Spawn 队列与替换规划器可以快速估算：

- 身体部件对应的基础生成时间；
- 普通 Creep 与带 CLAIM Creep 的寿命差异；
- 多角色平均 Spawn 利用率；
- 通勤和安全余量对应的 prespawn TTL；
- `PWR_OPERATE_SPAWN` 对规划值的影响。

但它明确不模拟多个角色同时到期、房间 Energy 未补满、出生方向阻塞、`DISRUPT_SPAWN`、其他模块抢占或正式 `spawnCreep()` 失败。文章代码负责真实 tick 中的请求生成、排序、提交和观察，两者不可互相替代。

## 离线验证记录

本次重新验证了 20 个场景：

1. TTL 远高于阈值时不生成；
2. TTL 等于阈值时生成；
3. TTL 低于阈值时生成；
4. 数量低于目标时优先补缺；
5. 当前没有任何现役单位；
6. 正在生成者刚好补足缺口；
7. 正在生成者覆盖一只即将到期单位；
8. 已完成替代者形成临时余量；
9. 两只单位到期但只有一只被覆盖；
10. 同时存在缺员和即将到期；
11. Spawn 剩余占用计入提前量；
12. 路程与安全余量为 0 的边界；
13. 生命周期由真实 TTL 表达；
14. 目标数量无效；
15. 生成时间无效；
16. TTL 为负数；
17. TTL 为小数；
18. Spawn 等待时间为负数；
19. TTL 输入不是数组；
20. 大数值配置仍保持有限结果。

完整示例通过 `node --check`。离线验证不等于 Screeps Console 或官方 shard 验证。

## 适用边界

这份代码是房间级起点，不覆盖：

- 在同一 tick 填满多座空闲 Spawn；
- 精确的帝国级跨房间 Spawn 预订；
- 实时路径测量；
- 出生方向阻塞；
- 长期 Energy 饥饿；
- `PWR_OPERATE_SPAWN` 中途消失；
- 敌方 `DISRUPT_SPAWN`；
- 编队必须同步出生的战斗队列；
- 每个角色的真实到岗定义。

扩展到多房间后，可在请求中继续增加 `deadline`、`reservedSpawn`、`expiresAt`、`replacementFor` 和目标房间，并继续保证只有一个协调器拥有最终 Spawn 提交权。

## 总结

稳定补员不是等死亡后把数量补回来，而是计算完整交接时间：

```text
Spawn 等待 + 身体生成 + 到岗路程 + 安全余量
```

再用目标数量、正在生成数量和临时重叠，判断还有多少即将死亡的单位没有替代者覆盖。最终判断标准也不是 `spawnCreep() === OK`，而是新 Creep 是否在旧 Creep 离岗前真正到达工作点。

## 官方参考资料

1. [Screeps API Reference：Creep.ticksToLive](https://docs.screeps.com/api/#Creep.ticksToLive)
2. [Screeps API Reference：StructureSpawn.spawnCreep()](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
3. [Screeps API Reference：StructureSpawn.Spawning](https://docs.screeps.com/api/#StructureSpawn-Spawning)
4. [Screeps API Reference：Constants](https://docs.screeps.com/api/#Constants)
5. [Screeps Documentation：Creeps 生命周期](https://docs.screeps.com/creeps.html)
6. [Screeps Documentation：Game loop](https://docs.screeps.com/game-loop.html)
