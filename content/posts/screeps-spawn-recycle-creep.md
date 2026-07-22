---
title: "Screeps recycleCreep() 怎么安全回收不再需要的 Creep"
description: "用一次性确认任务让指定Creep移动到己方Spawn旁边，检查名称、所有权、相邻距离和recycleCreep返回值，并说明资源返还边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Spawn"
  - "Creep 生命周期"
  - "Creep API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（一次性确认、名称、所有权、相邻距离、目标状态和任务关闭，不是Screeps官方服务器）"
  testResult: "请求缺失、确认缺失、Spawn或Creep缺失、目标仍在生成、所有权不符、需要移动、可回收和成功后关闭场景通过。"
featured: false
---

`StructureSpawn.recycleCreep()` 会结束目标Creep的生命周期，并根据剩余寿命返还最多100%的生成与Boost资源。目标必须与Spawn相邻，返还的Energy还受到每个身体部件最多125单位的限制。

回收具有不可逆结果，因此不应只根据角色名称自动执行。本文使用一次性Memory请求，并要求同时满足：

- 明确的Creep名称；
- 明确的Spawn名称；
- `enabled: true`；
- `confirmed: true`；
- 当前对象仍然属于自己；
- Creep已经完成生成；
- 任务成功提交后立即关闭。

## `recycleCreep()` 与 `suicide()` 的区别

```js
spawn.recycleCreep(creep)
```

由Spawn执行，要求Creep在相邻格，并按剩余寿命返还部分生成与Boost资源。

```js
creep.suicide()
```

由Creep自己执行，不需要靠近Spawn，也不属于本文的资源回收流程。

选择原则：

```text
能够安全回到己方Spawn，且希望回收部分投入
→ recycleCreep()

无法回到Spawn，或必须立即结束该Creep
→ 另行评估 suicide()
```

本文不自动调用 `suicide()` 作为回收失败后的替代动作。

## 返还资源的边界

官方API说明，回收会根据剩余寿命返还最多100%的生成与Boost资源，并且Energy返还最多为每个身体部件125单位。

这意味着：

- TTL越低，返还比例通常越低；
- 高成本部件也受每部件Energy上限约束；
- Boost资源可能参与返还；
- 实际掉落由游戏API结算；
- 不能用“原始身体成本”等同于实际返还量。

文章不会在主循环中重新实现服务器返还公式，也不会在没有真实结果时声称返还了具体数量。

## 一次性回收请求

在Console中明确写入：

```js
Memory.recycleRequests ??= {};
Memory.recycleRequests.OldWorker1 = {
  enabled: true,
  confirmed: true,
  spawnName: 'Spawn1',
  creepName: 'OldWorker1',
  reason: 'role-replaced',
  requestedAt: Game.time
};
```

`confirmed`是本站增加的安全字段，不是官方API参数。

任务成功提交后，代码会先关闭 `enabled`，避免后续tick重复执行同一请求。

## 用纯函数先判断下一步

```js
function evaluateRecycleRequest(input) {
  const {
    requestExists,
    enabled,
    confirmed,
    spawnExists,
    creepExists,
    creepSpawning,
    spawnOwned,
    creepOwned,
    isNearSpawn
  } = input;

  if (!requestExists || enabled !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'request-disabled'
    };
  }

  if (confirmed !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'confirmation-required'
    };
  }

  if (!spawnExists) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-missing'
    };
  }

  if (!creepExists) {
    return {
      ready: false,
      action: 'close',
      reason: 'creep-missing'
    };
  }

  if (creepSpawning) {
    return {
      ready: false,
      action: 'wait',
      reason: 'creep-spawning'
    };
  }

  if (!spawnOwned || !creepOwned) {
    return {
      ready: false,
      action: 'close',
      reason: 'ownership-invalid'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  return {
    ready: true,
    action: 'recycle',
    reason: 'ready'
  };
}
```

## 完整示例

```js
function evaluateRecycleRequest(input) {
  const {
    requestExists,
    enabled,
    confirmed,
    spawnExists,
    creepExists,
    creepSpawning,
    spawnOwned,
    creepOwned,
    isNearSpawn
  } = input;

  if (!requestExists || enabled !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'request-disabled'
    };
  }

  if (confirmed !== true) {
    return {
      ready: false,
      action: 'wait',
      reason: 'confirmation-required'
    };
  }

  if (!spawnExists) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-missing'
    };
  }

  if (!creepExists) {
    return {
      ready: false,
      action: 'close',
      reason: 'creep-missing'
    };
  }

  if (creepSpawning) {
    return {
      ready: false,
      action: 'wait',
      reason: 'creep-spawning'
    };
  }

  if (!spawnOwned || !creepOwned) {
    return {
      ready: false,
      action: 'close',
      reason: 'ownership-invalid'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  return {
    ready: true,
    action: 'recycle',
    reason: 'ready'
  };
}

function runRecycleRequest(creepName) {
  const request = Memory.recycleRequests?.[creepName];

  if (!request || request.enabled !== true) {
    return {
      status: 'request-disabled'
    };
  }

  const spawn = typeof request.spawnName === 'string'
    ? Game.spawns[request.spawnName]
    : null;
  const creep = typeof request.creepName === 'string'
    ? Game.creeps[request.creepName]
    : null;

  const decision = evaluateRecycleRequest({
    requestExists: true,
    enabled: request.enabled,
    confirmed: request.confirmed,
    spawnExists: Boolean(spawn),
    creepExists: Boolean(creep),
    creepSpawning: creep?.spawning === true,
    spawnOwned: spawn?.my === true,
    creepOwned: creep?.my === true,
    isNearSpawn: Boolean(
      spawn
      && creep
      && creep.pos.isNearTo(spawn)
    )
  });

  request.lastStatus = decision.reason;
  request.lastCheckedAt = Game.time;

  if (decision.action === 'close') {
    request.enabled = false;
    request.closedAt = Game.time;
    return {
      status: decision.reason
    };
  }

  if (decision.action === 'move' && creep && spawn) {
    const moveResult = creep.moveTo(spawn, {
      range: 1,
      reusePath: 10
    });

    request.lastMoveResult = moveResult;
    request.lastMoveAt = Game.time;

    return {
      status: 'moving-to-spawn',
      moveResult
    };
  }

  if (!decision.ready || !spawn || !creep) {
    return {
      status: decision.reason
    };
  }

  request.enabled = false;
  request.submittedAt = Game.time;

  const result = spawn.recycleCreep(creep);

  request.lastResult = result;
  request.lastResultAt = Game.time;

  if (result !== OK) {
    request.enabled = true;

    console.log({
      type: 'recycle-creep-failed',
      spawnName: spawn.name,
      creepName: creep.name,
      result
    });
  }

  return {
    status: result === OK
      ? 'recycle-submitted'
      : 'recycle-failed',
    result
  };
}

module.exports.loop = function () {
  runRecycleRequest('OldWorker1');
};
```

代码在调用前关闭请求，失败时再恢复。这样即使后续代码抛出异常，也不会在没有重新判断对象状态的情况下持续提交。

## 为什么不检查 `spawn.spawning`

当前官方 `recycleCreep()` 返回值表没有列出 `ERR_BUSY`，方法说明也没有要求Spawn必须空闲。

因此本文不把：

```js
spawn.spawning
```

作为回收前置条件。不要把 `renewCreep()` 的忙碌限制直接套用到 `recycleCreep()`。

实际服务器行为仍应通过正式返回值核对。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 回收命令已安排 | 下一tick确认Creep已消失并观察掉落资源 |
| `ERR_NOT_OWNER` | Spawn或Creep不属于自己 | 检查对象来源 |
| `ERR_INVALID_TARGET` | 传入对象不是Creep | 检查固定名称与对象类型 |
| `ERR_NOT_IN_RANGE` | Creep不在Spawn相邻格 | 保存 `moveTo()` 结果并继续靠近 |
| `ERR_RCL_NOT_ENOUGH` | Spawn当前不可用 | 检查Controller等级与结构状态 |

`OK`不表示当前脚本执行过程中 `Game.creeps[name]` 已经立即消失。游戏状态在下一tick重新创建。

## 何时不应该自动回收

不要自动回收：

- 仍承担唯一采集、运输或防御职责的Creep；
- 带有必须保留任务资源的Creep；
- 无替代单位且房间可能断代；
- 远程Creep回城成本高于剩余寿命；
- 名称或角色匹配不明确；
- 只因为TTL较低但仍需完成交接。

回收应由任务状态或人工确认触发，不应只由年龄触发。

## 常见错误

### 角色过剩就立即回收

当前统计可能忽略正在生成或即将死亡的替代单位。先确认交接完成。

### 距离不足时直接忽略结果

`moveTo()`也可能返回无路径、fatigue或身体问题，需要保存结果。

### 回收失败后自动调用 `suicide()`

这会把可恢复的距离或RCL问题升级为不可逆操作。本文不会这样做。

### 假设返还等于原身体成本

返还取决于剩余寿命，并受每个部件Energy上限约束。

### 成功后继续执行任务

提交成功后关闭请求，并在下一tick清理已经不存在Creep的Memory与任务索引。

### 不检查对象所有权

名称来自Memory或Console，仍要检查当前对象是否属于自己。

## 离线模拟结果

构建检查覆盖：

1. 请求缺失或关闭；
2. 没有人工确认；
3. Spawn缺失；
4. Creep缺失时关闭任务；
5. Creep仍在生成；
6. Spawn或Creep所有权不符；
7. 距离不足时移动；
8. 相邻时提交回收；
9. 成功后关闭；
10. 失败后恢复请求。

离线测试不能模拟真实资源掉落、TTL返还比例、Boost返还或Creep在下一tick消失。

## 适用边界

本文只处理一只明确指定的普通Creep，不覆盖：

- 自动判断角色过剩；
- 多Creep回收队列；
- Spawn周围交通；
- Power Creep；
- 自动选择最近Spawn；
- 跨房间回收路线；
- 实际返还资源统计；
- `suicide()`自动策略。

JavaScript语法和离线请求决策已检查，真实回收与资源掉落仍待Screeps环境验证。

## 相关站内内容

- [renewCreep()怎么续命](/blog/screeps-spawn-renew-creep)
- [如何清理死亡Creep的Memory](/blog/screeps-clean-dead-creep-memory)
- [spawnCreep()失败怎么查](/blog/screeps-spawncreep-return-codes)
- [Creep角色应该怎样分工](/blog/screeps-creep-roles)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [进入Spawn与Creep生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.recycleCreep API](https://docs.screeps.com/api/#StructureSpawn.recycleCreep)
- [Creep.suicide API](https://docs.screeps.com/api/#Creep.suicide)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线回收任务模拟已通过；真实回收结果仍待Screeps环境验证。
