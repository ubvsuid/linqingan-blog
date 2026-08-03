---
title: "Screeps Creep 提前补员：用 TTL、生成时间和路程避免断代"
description: "用 ticksToLive、身体生成时间、Spawn 剩余占用、通勤路程和安全余量计算 Screeps Creep 提前补员时机，并用可运行的房间级队列减少岗位断代。"
publishedAt: "2026-08-03"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep 生命周期"
  - "提前补员"
  - "ticksToLive"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-03"
  testedAt: "2026-08-03"
  testEnvironment: "Node.js 22 离线模拟（纯函数边界测试：TTL、目标数量、正在生成数量、Spawn 等待时间、生成时间、路程和安全余量；不是 Screeps 官方服务器）"
  testResult: "8 个决策边界场景通过；完整运行示例通过 JavaScript 语法检查。尚未在 Screeps Console 或真实主循环验证。"
featured: false
---

当 Harvester、Hauler 或 Upgrader 死亡后才调用 `spawnCreep()`，补员通常已经晚了。

新 Creep 可能先等待当前 Spawn 完成任务，再按身体部件数量消耗生成时间，最后还要从 Spawn 走到工作位置。旧 Creep 在这段时间里继续减少 `ticksToLive`，于是角色数量平时看起来正常，岗位却会在换代时突然空缺。

本文解决的是死亡前替换：计算新单位必须开始生成的时间，并避免同一角色被重复补员。身体成本和退化方案可先阅读[按房间 Energy 动态生成 Creep 身体](/blog/screeps-dynamic-creep-body-energy)，调用失败则参考[`spawnCreep()` 返回值排查](/blog/screeps-spawncreep-return-codes)。

## 为什么数量不足后再生成会产生空窗

常见代码只比较当前数量：

```js
if (harvesters.length < 2) {
  spawn.spawnCreep(body, name, options);
}
```

假设一只 Harvester 还剩 30 tick，而替代者需要：

- 等待 Spawn：12 tick；
- 生成身体：18 tick；
- 走到 Source：25 tick；
- 预留误差：10 tick。

完整换代需要 65 tick。等旧 Harvester 死亡后才提交，采集岗位必然出现空窗。

`creep.ticksToLive` 表示 Creep 距离死亡还剩多少 tick，`creep.spawning` 表示它是否仍在生成。普通 Creep 与带 CLAIM 部件的 Creep 生命周期不同，所以补员判断应读取对象当前 TTL，不要把固定生命周期写死进角色管理器。

## 提前量公式

第一版可以使用一条保守公式：

```text
提前量 = 最早可用 Spawn 的等待时间
       + 新 Creep 的生成时间
       + 新 Creep 的到岗路程
       + 安全余量
```

基础生成时间为：

```text
生成时间 = body.length × CREEP_SPAWN_TIME
```

正在执行任务的 Spawn 会公开 `spawning.remainingTime`。把最早可用 Spawn 的剩余时间加入公式，可以避免角色已经进入 TTL 阈值，却因为 Spawn 仍被占用而来不及替换。

`travelTicks` 不应直接等同于直线距离。道路、沼泽、MOVE 与负载比例、fatigue、交通阻挡和跨房间出口都会改变到岗时间。第一版可为每个角色配置保守值，上线后再记录真实到岗 tick。移动明显慢于估算时，应检查[MOVE、fatigue、地形与负载](/blog/screeps-move-fatigue-body-ratio)和[`moveTo()` 返回 OK 但不移动](/blog/screeps-moveto-not-moving)。

## 为什么只看最低 TTL 仍会重复生成

目标数量为 2 时，旧 Creep A 接近死亡，系统生成替代者 C。C 完成生成后，A 可能仍然存活，当前数量会暂时变成 3。

如果代码仍然只看 A 的低 TTL，就可能再次生成 D。正确判断必须区分：

- 目标数量；
- 当前存活数量；
- 正在生成数量；
- 换代期间超出目标数量的临时余量；
- 已进入阈值但还没有替代者覆盖的旧 Creep 数量。

核心关系是：

```text
未覆盖的到期数量
= 已进入提前阈值的存活 Creep 数量
- 超出目标数量的临时余量
```

结果大于 0 时，才需要继续提交替代者。

## 可离线测试的决策函数

先把判断写成不依赖 `Game` 的纯函数：

```js
function evaluateRoleReplacement(input) {
  const {
    targetCount,
    activeTtls,
    spawningCount,
    bodyLength,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  } = input;

  const integers = [
    targetCount,
    spawningCount,
    bodyLength,
    spawnWaitTicks,
    travelTicks,
    safetyBuffer
  ];

  if (
    !integers.every(Number.isInteger)
    || targetCount < 1
    || spawningCount < 0
    || bodyLength < 1
    || bodyLength > 50
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
    + bodyLength * CREEP_SPAWN_TIME
    + travelTicks
    + safetyBuffer;
  const activeCount = activeTtls.length;
  const totalCount = activeCount + spawningCount;
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
      missingCount,
      uncoveredDueCount,
      leadTicks,
      minimumSlack
    };
  }

  if (uncoveredDueCount > 0) {
    return {
      valid: true,
      shouldSpawn: true,
      reason: 'prespawn-due',
      missingCount,
      uncoveredDueCount,
      leadTicks,
      minimumSlack
    };
  }

  return {
    valid: true,
    shouldSpawn: false,
    reason: 'covered',
    missingCount,
    uncoveredDueCount,
    leadTicks,
    minimumSlack
  };
}
```

`minimumSlack` 表示最紧急 Creep 距离阈值还差多少 tick：正数表示仍有余量，0 表示刚到阈值，负数表示已经晚于理想提交时间。它适合用于多个角色请求之间的排序，但不是 Spawn API 返回码。

## 房间级提前补员队列

下面的示例把角色判断集中到一个房间入口，并具备这些边界：

- 按 `memory.role` 和 `memory.home` 统计角色；
- 把正在生成的 Creep 算入数量；
- 使用最早可用 Spawn 的等待时间；
- 真实缺员优先于提前替换；
- 临时余量阻止重复补员；
- 先 `dryRun`，再保存正式返回值；
- 每个房间每 tick 最多提交一个请求。

```js
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

function getUsableSpawns(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    );
}

function getEarliestSpawnWait(spawns) {
  if (spawns.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...spawns.map(spawn =>
      spawn.spawning?.remainingTime ?? 0
    )
  );
}

function belongsToRoom(creep, roomName) {
  if (creep.memory?.home) {
    return creep.memory.home === roomName;
  }

  return creep.room.name === roomName;
}

function getRoleCreeps(room, role) {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === role
      && belongsToRoom(creep, room.name)
    );
}

function createRoleRequest(
  room,
  role,
  config,
  spawnWaitTicks
) {
  const creeps = getRoleCreeps(room, role);
  const activeTtls = creeps
    .filter(creep => !creep.spawning)
    .map(creep => creep.ticksToLive)
    .filter(Number.isInteger);
  const spawningCount = creeps
    .filter(creep => creep.spawning)
    .length;
  const decision = evaluateRoleReplacement({
    targetCount: config.targetCount,
    activeTtls,
    spawningCount,
    bodyLength: config.body.length,
    spawnWaitTicks,
    travelTicks: config.travelTicks,
    safetyBuffer: config.safetyBuffer
  });

  if (!decision.valid || !decision.shouldSpawn) {
    return null;
  }

  return {
    role,
    config,
    ...decision
  };
}

function compareRequests(left, right) {
  const leftTier = left.reason === 'count-below-target'
    ? 0
    : 1;
  const rightTier = right.reason === 'count-below-target'
    ? 0
    : 1;

  if (leftTier !== rightTier) {
    return leftTier - rightTier;
  }

  if (leftTier === 0) {
    return (
      right.missingCount - left.missingCount
      || left.config.priority - right.config.priority
    );
  }

  return (
    left.minimumSlack - right.minimumSlack
    || left.config.priority - right.config.priority
  );
}

function runRoomSpawnManager(room) {
  const spawns = getUsableSpawns(room);

  if (spawns.length === 0) {
    return {
      submitted: false,
      reason: 'no-usable-spawn'
    };
  }

  const spawnWaitTicks = getEarliestSpawnWait(spawns);
  const requests = Object.entries(ROLE_CONFIG)
    .map(([role, config]) =>
      createRoleRequest(
        room,
        role,
        config,
        spawnWaitTicks
      )
    )
    .filter(Boolean)
    .sort(compareRequests);

  if (requests.length === 0) {
    return {
      submitted: false,
      reason: 'no-request'
    };
  }

  const request = requests[0];
  const spawn = spawns.find(item => !item.spawning);

  if (!spawn) {
    return {
      submitted: false,
      reason: 'all-spawns-busy',
      request
    };
  }

  const name = [
    request.role,
    room.name,
    spawn.name,
    Game.time
  ].join('-');
  const memory = {
    role: request.role,
    home: room.name,
    bornAt: Game.time,
    replacementReason: request.reason
  };
  const dryRunResult = spawn.spawnCreep(
    request.config.body,
    name,
    {
      memory,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      submitted: false,
      reason: 'dry-run-failed',
      result: dryRunResult,
      request
    };
  }

  const result = spawn.spawnCreep(
    request.config.body,
    name,
    { memory }
  );

  return {
    submitted: result === OK,
    reason: result === OK
      ? 'submitted'
      : 'spawn-failed',
    result,
    name,
    spawnName: spawn.name,
    request
  };
}

module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    if (room.controller?.my !== true) {
      continue;
    }

    runRoomSpawnManager(room);
  }

  for (const creep of Object.values(Game.creeps)) {
    if (creep.spawning) {
      continue;
    }

    // 在这里继续运行现有 role 分派逻辑。
  }
};
```

示例优先级数值越小越高。真实缺员先比较缺少数量，提前替换再比较 `minimumSlack`。这些数字属于房间策略，不是 Screeps 官方常量。

## 返回值如何进入补员状态

`spawnCreep()` 返回 `OK` 只表示生成已经安排，不表示 Creep 在当前 tick 完成。正式结果至少应区分：

| 返回值 | 对补员系统的意义 | 建议处理 |
|---|---|---|
| `OK` | 请求已安排 | 保存名称、角色、原因与 tick |
| `ERR_BUSY` | 队列与实际 Spawn 状态不一致 | 检查是否有其他模块直接调用 Spawn |
| `ERR_NOT_ENOUGH_ENERGY` | 时机到了但身体无法负担 | 使用退化身体或应急恢复策略 |
| `ERR_NAME_EXISTS` | 名称或多入口提交冲突 | 检查名称生成与统一入口 |
| `ERR_INVALID_ARGS` | body、名称或选项无效 | 停止重试并修复配置 |
| `ERR_RCL_NOT_ENOUGH` | Spawn 当前不可用 | 检查 RCL、结构状态与 `isActive()` |

Energy 不足时，提前量计算仍然可以是正确的，但执行条件不成立。关键角色允许使用较小 body 时，可接入动态身体；房间已经失去采集能力时，应转入[断代后的最小采集者恢复](/blog/screeps-spawn-emergency-recovery)，而不是让 Builder 或 Upgrader 抢占最后的恢复 Energy。

## 提前替换与 renewCreep() 的边界

`renewCreep()` 会占用 Spawn，还要求 Creep 返回 Spawn 附近。普通经济角色通常更适合生成替代者：旧 Creep 可以继续工作，新 Creep 同时生成并通勤，新单位到岗后旧 Creep 再自然死亡或回收。

需要保留少数昂贵单位时，再单独评估续命。具体前提可阅读[`renewCreep()` 的 TTL、Energy、Boost 与 Spawn 占用](/blog/screeps-spawn-renew-creep)。

## 发布前验证顺序

离线测试至少覆盖：

- TTL 高于阈值时不生成；
- TTL 等于或低于阈值时生成；
- 当前数量低于目标时优先补缺；
- 替代者正在生成时不重复覆盖；
- 替代者完成但旧 Creep 仍存活时，临时余量阻止重复生成；
- 两只同龄 Creep 接近死亡时逐个生成足够替代者；
- Spawn 忙碌时间计入提前量；
- body 为空、超过 50 部件或配置为负数时拒绝执行。

Console 中可先运行只读统计：

```js
Object.values(Game.creeps).map(creep => ({
  name: creep.name,
  role: creep.memory.role,
  home: creep.memory.home,
  spawning: creep.spawning,
  ticksToLive: creep.ticksToLive
}));
```

真实运行时至少记录五个时间点：旧 Creep 进入阈值、`spawnCreep()` 返回 `OK`、新 Creep 完成生成、新 Creep 第一次到岗、旧 Creep 死亡。只有新 Creep 到岗早于旧 Creep 离岗，才算真正避免岗位空窗。

## 适用边界

这份代码是房间级起点，不承诺覆盖所有帝国规模场景：

- 每个房间每 tick 最多提交一个生成请求；
- 多 Spawn 会统一判断，但不会在同一 tick 填满所有空闲 Spawn；
- `travelTicks` 需要配置或实测；
- 其他模块直接调用 `spawnCreep()` 会绕过队列；
- Spawn 被摧毁、长期 Energy 饥饿和敌对封路可能破坏替换计划；
- 远程矿工、Claimer 和战斗编队应使用独立参数。

当房间进入多 Spawn 或多房间阶段，可以在当前请求模型上继续增加 `deadline`、`reservedSpawn`、`replacementFor` 与过期时间。

## 总结

稳定补员的关键不是 Creep 死亡后再生成一只，而是计算完整换代时间：

```text
Spawn 等待 + body 生成 + 到岗路程 + 安全余量
```

再用目标数量、正在生成数量和临时交接余量，判断还有多少即将死亡的 Creep 没有替代者覆盖。完成后，关键角色会在死亡前启动替换，新旧 Creep 可以短暂重叠，但不会无限重复生成。

## 官方参考资料

1. [Screeps API Reference：Creep](https://docs.screeps.com/api/#Creep)
2. [Screeps API Reference：StructureSpawn.spawnCreep()](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
3. [Screeps API Reference：StructureSpawn.Spawning](https://docs.screeps.com/api/#StructureSpawn-Spawning)
4. [Screeps API Reference：Constants](https://docs.screeps.com/api/#Constants)
5. [Screeps Documentation：Creeps 生命周期](https://docs.screeps.com/creeps.html)
