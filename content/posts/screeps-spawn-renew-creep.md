---
title: "Screeps renewCreep() 怎么用：TTL、Energy、Boost 与 Spawn 占用"
description: "在TTL阈值下校验普通Creep、CLAIM部件、Boost、Spawn状态和相邻距离，计算单次续命tick与Energy，并处理renewCreep返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "renewCreep"
  - "ticksToLive"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（身体成本、单次TTL、单次Energy、CLAIM、Boost、阈值和Spawn状态，不是Screeps官方服务器）"
  testResult: "目标缺失、仍在生成、TTL充足、CLAIM、Boost未确认、Spawn忙碌、Energy不足、距离不足和可续命场景通过。"
featured: false
---

`StructureSpawn.renewCreep()` 可以增加普通Creep的剩余寿命，但它会占用Spawn、消耗Spawn自身Energy，并移除目标Creep的全部Boost。

因此续命不能只写成“TTL低于300就调用”。调用前至少需要确认：

- 目标是自己的普通Creep；
- 不含 `CLAIM` 部件；
- Boost是否允许被移除；
- Spawn当前没有生成其他Creep；
- Creep与Spawn相邻；
- Spawn自身Energy足够；
- 续命没有阻塞更重要的补员。

## 官方单次续命公式

单次增加的TTL：

```text
floor(600 / body_size)
```

单次消耗的Energy：

```text
ceil(creep_cost / 2.5 / body_size)
```

其中：

- `body_size` 是身体部件总数；
- `creep_cost` 是全部身体部件的生成成本。

可以用纯函数计算：

```js
function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part.type];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        `unknown body part: ${String(part.type)}`
      );
    }

    return total + cost;
  }, 0);
}

function getRenewStep(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return {
      valid: false,
      reason: 'body-invalid'
    };
  }

  const bodyCost = getBodyCost(body);

  return {
    valid: true,
    reason: 'ready',
    bodySize: body.length,
    bodyCost,
    addedTicks: Math.floor(600 / body.length),
    energyCost: Math.ceil(
      bodyCost / 2.5 / body.length
    )
  };
}
```

身体越大，单次增加的TTL越少。不同部件成本也会影响单次Energy。

## Boost为什么必须单独确认

官方API明确说明：续命会移除目标Creep的全部Boost。

检查：

```js
function getBoostedParts(creep) {
  return creep.body.filter(part =>
    typeof part.boost === 'string'
  );
}
```

对强化战斗单位、强化采集者或强化升级者，自动续命可能直接破坏原任务配置。

本文要求：

```js
allowBoostRemoval === true
```

才允许对带Boost的Creep继续执行。这是人工安全条件，不是官方API参数。

## CLAIM部件为什么直接拒绝

`renewCreep()`不能用于带有 `CLAIM` 身体部件的Creep。

```js
function hasClaimPart(creep) {
  return creep.body.some(part =>
    part.type === CLAIM
  );
}
```

这里检查身体中是否存在CLAIM，而不是只检查有效部件数量。Claimer应通过替代生产管理寿命。

## 续命阈值不是越高越好

阈值过高会让Creep很早回到Spawn并持续占用它；阈值过低则可能在走回Spawn前死亡。

阈值需要考虑：

- Creep到Spawn的路程；
- 身体生成时间；
- Spawn当前生成队列；
- 任务是否能离开工作位置；
- 续命后计划保留到什么TTL；
- 是否有替代Creep接班。

`300`只能作为示例，不是官方推荐值。

## 用纯函数决定当前动作

```js
function evaluateRenewRequest(input) {
  const {
    creepExists,
    creepSpawning,
    ticksToLive,
    renewThreshold,
    hasClaimPart,
    boostedPartCount,
    allowBoostRemoval,
    spawnBusy,
    spawnEnergy,
    energyCost,
    isNearSpawn
  } = input;

  if (!creepExists) {
    return {
      ready: false,
      action: 'wait',
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

  if (
    !Number.isFinite(ticksToLive)
    || !Number.isFinite(renewThreshold)
    || renewThreshold < 0
  ) {
    return {
      ready: false,
      action: 'wait',
      reason: 'ttl-invalid'
    };
  }

  if (ticksToLive > renewThreshold) {
    return {
      ready: false,
      action: 'work',
      reason: 'ttl-sufficient'
    };
  }

  if (hasClaimPart) {
    return {
      ready: false,
      action: 'replace',
      reason: 'claim-part-present'
    };
  }

  if (
    boostedPartCount > 0
    && allowBoostRemoval !== true
  ) {
    return {
      ready: false,
      action: 'replace',
      reason: 'boost-removal-not-confirmed'
    };
  }

  if (!isNearSpawn) {
    return {
      ready: false,
      action: 'move',
      reason: 'move-to-spawn'
    };
  }

  if (spawnBusy) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-busy'
    };
  }

  if (
    !Number.isFinite(spawnEnergy)
    || !Number.isFinite(energyCost)
    || spawnEnergy < energyCost
  ) {
    return {
      ready: false,
      action: 'wait',
      reason: 'spawn-energy-not-enough'
    };
  }

  return {
    ready: true,
    action: 'renew',
    reason: 'ready'
  };
}
```

## 完整示例

```js
function getBodyCost(body) {
  return body.reduce((total, part) => {
    const cost = BODYPART_COST[part.type];

    if (!Number.isFinite(cost)) {
      throw new TypeError(
        `unknown body part: ${String(part.type)}`
      );
    }

    return total + cost;
  }, 0);
}

function getRenewStep(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return null;
  }

  const bodyCost = getBodyCost(body);

  return {
    bodySize: body.length,
    bodyCost,
    addedTicks: Math.floor(600 / body.length),
    energyCost: Math.ceil(
      bodyCost / 2.5 / body.length
    )
  };
}

function runRenewMission(input) {
  const {
    spawn,
    creep,
    renewThreshold,
    targetTtl,
    allowBoostRemoval
  } = input;

  if (!spawn || !creep || creep.spawning) {
    return {
      status: 'object-unavailable'
    };
  }

  const step = getRenewStep(creep.body);

  if (!step) {
    return {
      status: 'body-invalid'
    };
  }

  const hasClaimPart = creep.body.some(part =>
    part.type === CLAIM
  );
  const boostedPartCount = creep.body.filter(part =>
    typeof part.boost === 'string'
  ).length;

  if (hasClaimPart) {
    return {
      status: 'claim-creep-must-be-replaced'
    };
  }

  if (
    boostedPartCount > 0
    && allowBoostRemoval !== true
  ) {
    return {
      status: 'boost-removal-not-confirmed',
      boostedPartCount
    };
  }

  if (creep.ticksToLive > renewThreshold) {
    return {
      status: 'ttl-sufficient',
      ticksToLive: creep.ticksToLive
    };
  }

  if (creep.ticksToLive >= targetTtl) {
    return {
      status: 'target-ttl-reached',
      ticksToLive: creep.ticksToLive
    };
  }

  if (!creep.pos.isNearTo(spawn)) {
    const moveResult = creep.moveTo(spawn, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-spawn',
      moveResult,
      step
    };
  }

  if (spawn.spawning) {
    return {
      status: 'spawn-busy',
      step
    };
  }

  const spawnEnergy = spawn.store.getUsedCapacity(
    RESOURCE_ENERGY
  );

  if (spawnEnergy < step.energyCost) {
    return {
      status: 'spawn-energy-not-enough',
      spawnEnergy,
      step
    };
  }

  const result = spawn.renewCreep(creep);

  return {
    status: result === OK
      ? 'renew-submitted'
      : 'renew-failed',
    result,
    step,
    ticksToLiveBefore: creep.ticksToLive
  };
}

module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;
  const creep = Game.creeps.Worker1;

  const outcome = runRenewMission({
    spawn,
    creep,
    renewThreshold: 300,
    targetTtl: 1200,
    allowBoostRemoval: false
  });

  if (outcome.status === 'renew-failed') {
    console.log({
      type: 'renew-creep-failed',
      spawnName: spawn?.name ?? null,
      creepName: creep?.name ?? null,
      ...outcome
    });
  }
};
```

`targetTtl`用于防止低于阈值后无限续命到 `ERR_FULL`。具体目标仍需根据任务与Spawn队列调整。

## 为什么Spawn忙碌时不能续命

官方API要求Spawn没有正在生成另一只Creep。续命与生成共享Spawn时间。

如果生产队列已经需要紧急补员，应该先决定优先级：

```text
续命现有Creep
或
生产替代Creep
```

不能让两个独立模块在同一tick各自控制同一Spawn。

## 续命与提前替代怎样选择

续命更适合：

- Creep长期靠近Spawn工作；
- 身体配置仍符合当前需求；
- Spawn空闲时间充足；
- 没有需要保留的Boost；
- 回到Spawn不会中断关键任务。

提前替代更适合：

- Creep长期在远程房间；
- 带CLAIM或重要Boost；
- Spawn需要集中管理队列；
- 新身体需要升级；
- 任务要求平滑交接。

文章不把续命描述为默认最佳方案。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 续命命令已安排 | 下一tick读取TTL与Spawn Energy |
| `ERR_NOT_OWNER` | Spawn或Creep不属于自己 | 检查对象来源 |
| `ERR_BUSY` | Spawn正在生成另一只Creep | 检查统一队列 |
| `ERR_NOT_ENOUGH_ENERGY` | Spawn自身Energy不足 | 读取Spawn Store |
| `ERR_INVALID_TARGET` | 目标不是普通Creep或带CLAIM | 检查对象与身体 |
| `ERR_FULL` | 当前TTL无法继续增加 | 降低目标TTL或停止 |
| `ERR_NOT_IN_RANGE` | Creep不在相邻格 | 移动到范围1 |
| `ERR_RCL_NOT_ENOUGH` | Spawn当前不可用 | 检查Controller等级 |

`OK`不代表当前tick的 `ticksToLive` 已经变化，下一tick重新读取。

## 离线模拟结果

构建检查覆盖：

1. 目标缺失；
2. Creep仍在生成；
3. TTL高于阈值；
4. body含CLAIM；
5. Boost移除未确认；
6. 需要移动到Spawn；
7. Spawn忙碌；
8. Spawn Energy不足；
9. 合法续命；
10. 身体成本、单次增加tick和单次Energy公式。

离线测试不能调用真实 `renewCreep()`，也不能模拟Boost移除、Spawn队列或TTL跨tick变化。

## 适用边界

本文不实现：

- 多Creep续命排队；
- 自动比较全部替代方案；
- Spawn交通预约；
- Boost重新补充；
- 远程回城路线；
- Power Creep续命；
- 多Spawn分配；
- 长期资源效率结论。

JavaScript语法和离线决策已检查，真实续命、Boost变化和多tick寿命仍待Screeps环境验证。

## 相关站内内容

- [如何回收Creep](/blog/screeps-spawn-recycle-creep)
- [spawnCreep()失败怎么查](/blog/screeps-spawncreep-return-codes)
- [如何按Energy动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [进入Spawn与Creep生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.renewCreep API](https://docs.screeps.com/api/#StructureSpawn.renewCreep)
- [Creep API](https://docs.screeps.com/api/#Creep)
- [Creeps](https://docs.screeps.com/creeps.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线续命决策已通过；真实续命结果仍待环境验证。
