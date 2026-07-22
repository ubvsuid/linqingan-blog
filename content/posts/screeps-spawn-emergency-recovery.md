---
title: "Screeps 房间断代后如何安全恢复第一只采集者"
description: "当房间没有采集者时，统一选择一座可用Spawn，计算最小身体、检查当前Energy和dryRun结果，并避免多Spawn重复生成。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Spawn"
  - "补员"
  - "常见问题"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（房间、Spawn、角色数量、当前Energy、最低身体、名称和dryRun分支，不是Screeps官方服务器）"
  testResult: "房间或Spawn缺失、全部Spawn忙碌、已有采集者、Energy不足、名称冲突、dryRun失败、单Spawn提交和多Spawn只选一座场景通过。"
featured: false
---

房间里最后一只采集者死亡后，常规补员可能因为等待大型body、错误的角色统计或多个Spawn同时判断而无法恢复。

应急恢复的目标很窄：

> 当己方房间没有任何存活采集者时，只选择一座可用Spawn，尝试生成能够采集并携带Energy的最小Creep。

本文使用：

```js
[WORK, CARRY, MOVE]
```

它需要200 Energy。低于这个值时，普通己方房间的脚本不能凭空创造可用Energy。

## 应急分支必须先于普通补员

普通补员可能等待：

- 更大的Harvester；
- Builder；
- Upgrader；
- 运输者；
- 满 `energyCapacityAvailable`。

断代时，这些目标都应让位于最低采集能力。

执行顺序建议：

```text
清理死亡Creep Memory
→ 统计当前存活角色
→ 运行应急恢复
→ 如果应急没有占用Spawn，再运行普通补员
```

## 统计的是当前存活Creep

```js
function countLiveCreepsByRole(role) {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === role
    )
    .length;
}
```

不要只统计 `Memory.creeps`，其中可能有死亡Creep残留。

正在生成的Creep通常已经能通过名称和Spawn状态观察。完整系统还应把正在生成的目标角色算进“即将存在”数量，避免下一座Spawn重复提交。

## 最小身体成本

```js
const EMERGENCY_BODY = [WORK, CARRY, MOVE];

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

不把200散落在多个判断里，可以避免以后修改身体却忘记同步阈值。

## 多Spawn房间只选择一座

错误结构：

```js
for (const spawn of Object.values(Game.spawns)) {
  if (harvesterCount === 0) {
    spawn.spawnCreep(...);
  }
}
```

多座Spawn可能在同一tick同时看到采集者数量为0，并尝试生成重复单位。

应先筛选当前房间的可用Spawn，再稳定选择一座：

```js
function selectEmergencySpawn(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )[0] ?? null;
}
```

名称排序只用于让选择稳定，不代表业务优先级。

## 唯一名称不能只依赖角色名

固定名称：

```js
EmergencyHarvester
```

若同名Creep仍存在或刚进入生成流程，会得到 `ERR_NAME_EXISTS`。

可以组合房间、Spawn和tick：

```js
function createEmergencyName(room, spawn) {
  return [
    'EmergencyHarvester',
    room.name,
    spawn.name,
    Game.time
  ].join('-');
}
```

多个模块仍不应同时提交同类请求。名称唯一不能替代统一Spawn调度。

## 用纯函数判断能否进入提交分支

```js
function evaluateEmergencyRecovery(input) {
  const {
    roomExists,
    availableSpawnCount,
    harvesterCount,
    energyAvailable,
    minimumCost,
    nameExists,
    dryRunResult
  } = input;

  if (!roomExists) {
    return {
      ready: false,
      reason: 'room-missing'
    };
  }

  if (harvesterCount > 0) {
    return {
      ready: false,
      reason: 'harvester-exists'
    };
  }

  if (availableSpawnCount < 1) {
    return {
      ready: false,
      reason: 'spawn-unavailable'
    };
  }

  if (
    !Number.isFinite(energyAvailable)
    || !Number.isFinite(minimumCost)
    || energyAvailable < minimumCost
  ) {
    return {
      ready: false,
      reason: 'energy-not-enough'
    };
  }

  if (nameExists) {
    return {
      ready: false,
      reason: 'name-exists'
    };
  }

  if (dryRunResult !== undefined && dryRunResult !== OK) {
    return {
      ready: false,
      reason: 'dry-run-failed',
      dryRunResult
    };
  }

  return {
    ready: true,
    reason: 'ready'
  };
}
```

## 完整主循环示例

```js
const EMERGENCY_BODY = [WORK, CARRY, MOVE];

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

function countLiveCreepsByRole(role, roomName) {
  return Object.values(Game.creeps)
    .filter(creep =>
      creep.memory?.role === role
      && (
        creep.memory?.homeRoom === roomName
        || creep.room.name === roomName
      )
    )
    .length;
}

function selectEmergencySpawn(room) {
  return room.find(FIND_MY_SPAWNS)
    .filter(spawn =>
      spawn.my === true
      && spawn.isActive()
      && !spawn.spawning
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    )[0] ?? null;
}

function createEmergencyName(room, spawn) {
  return [
    'EmergencyHarvester',
    room.name,
    spawn.name,
    Game.time
  ].join('-');
}

function runEmergencyRecovery(room) {
  if (!room?.controller?.my) {
    return {
      status: 'owned-room-unavailable'
    };
  }

  const harvesterCount = countLiveCreepsByRole(
    'harvester',
    room.name
  );

  if (harvesterCount > 0) {
    return {
      status: 'harvester-exists',
      harvesterCount
    };
  }

  const spawn = selectEmergencySpawn(room);

  if (!spawn) {
    return {
      status: 'spawn-unavailable'
    };
  }

  const minimumCost = getBodyCost(EMERGENCY_BODY);

  if (room.energyAvailable < minimumCost) {
    return {
      status: 'energy-not-enough',
      energyAvailable: room.energyAvailable,
      minimumCost
    };
  }

  const name = createEmergencyName(room, spawn);

  if (Game.creeps[name]) {
    return {
      status: 'name-exists',
      name
    };
  }

  const memory = {
    role: 'harvester',
    homeRoom: room.name,
    emergency: true,
    memoryVersion: 1
  };

  const dryRunResult = spawn.spawnCreep(
    EMERGENCY_BODY,
    name,
    {
      memory,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-failed',
      spawnName: spawn.name,
      name,
      dryRunResult
    };
  }

  const result = spawn.spawnCreep(
    EMERGENCY_BODY,
    name,
    {
      memory
    }
  );

  return {
    status: result === OK
      ? 'emergency-spawn-submitted'
      : 'emergency-spawn-failed',
    spawnName: spawn.name,
    name,
    minimumCost,
    dryRunResult,
    result
  };
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  const outcome = runEmergencyRecovery(room);

  if (
    outcome.status === 'dry-run-failed'
    || outcome.status === 'emergency-spawn-failed'
  ) {
    console.log({
      type: 'emergency-recovery-failed',
      roomName: room.name,
      ...outcome
    });
  }

  if (outcome.status === 'emergency-spawn-submitted') {
    return;
  }

  // 只有应急分支没有占用Spawn时，才继续普通补员。
};
```

把 `W1N1` 换成真实房间名。

## 为什么 `dryRun` 之后仍要保存正式结果

`dryRun`不开始生成。预检通过后，同一tick中的其他模块仍可能：

- 先使用这座Spawn；
- 使用相同名称；
- 改变可用Energy；
- 提交其他生成任务。

因此正式 `spawnCreep()` 的返回值仍是最终判断依据。

## 低于200 Energy时会怎样

普通房间中，当所有采集者都死亡且Spawn与Extension总可用Energy低于最低body成本时，代码无法凭空恢复。

可能需要：

- 其他房间运输支援；
- 仍存活的运输者填充Spawn；
- 人工调整现有Creep任务；
- 最终评估重生。

官方初始Spawn具有特殊缓慢补能机制：初始Spawn会获得300 Energy，并在符合条件时每tick补充少量Energy，直到房间生成结构达到300 Energy。这个机制属于初始Spawn安全设计，不能泛化到所有已有房间和所有Spawn。

## 为什么最小采集者仍可能无法恢复经济

即使生成成功，还可能遇到：

- Source不可达；
- 没有有效采集位置；
- Creep行为代码错误；
- Spawn周围拥堵；
- 敌人持续攻击；
- 角色名称与主循环不一致；
- 采集到Energy后没有正确送回Spawn。

应急生成只恢复一只单位，不证明整个房间已经稳定恢复。

## 返回值排查

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 生成命令已安排 | 后续tick读取 `spawn.spawning` 与新Creep |
| `ERR_NAME_EXISTS` | 名称冲突 | 检查多模块与命名函数 |
| `ERR_BUSY` | Spawn已被占用 | 检查应急分支顺序 |
| `ERR_NOT_ENOUGH_ENERGY` | 正式调用时Energy不足 | 检查同tick其他生成请求 |
| `ERR_INVALID_ARGS` | body、名称或Memory选项不合法 | 检查最小方案 |
| `ERR_NOT_OWNER` | Spawn不属于自己 | 检查房间与对象 |
| `ERR_RCL_NOT_ENOUGH` | Spawn当前不可用 | 检查Controller等级 |

`spawnCreep()`不会返回 `ERR_NOT_IN_RANGE`。

## 离线模拟结果

构建检查覆盖：

1. 房间缺失或不属于自己；
2. 没有可用Spawn；
3. 多个Spawn只稳定选择一座；
4. 已有采集者；
5. 199 Energy等待；
6. 200 Energy进入生成分支；
7. 名称冲突；
8. `dryRun`失败；
9. 正式提交成功或失败；
10. 最小body成本计算。

离线测试不能模拟真实初始Spawn补能、多个模块竞争、Extension取能、新Creep生成或采集行为。

## 适用边界

本文只恢复第一只最低采集者，不覆盖：

- 完整角色队列；
- 多房间支援调度；
- 运输者应急改职；
- 敌对环境恢复；
- 自动重生；
- 大型Harvester替换；
- 采集位置分配；
- 长期经济稳定性。

JavaScript语法和离线恢复决策已检查，真实生成与多tick经济恢复仍待Screeps环境验证。

## 相关站内内容

- [spawnCreep()失败怎么查](/blog/screeps-spawncreep-return-codes)
- [如何按Energy动态生成身体](/blog/screeps-dynamic-creep-body-energy)
- [如何清理死亡Creep的Memory](/blog/screeps-clean-dead-creep-memory)
- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Creep角色应该怎样分工](/blog/screeps-creep-roles)
- [进入Spawn与Creep生命周期专题](/knowledge/spawn-lifecycle)

## 官方资料

- [StructureSpawn.spawnCreep API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [Creeps](https://docs.screeps.com/creeps.html)
- [Respawning：Initial Spawn](https://docs.screeps.com/respawn.html)
- [Room.energyAvailable API](https://docs.screeps.com/api/#Room-energyAvailable)

资料核对日期：2026-07-22。离线应急决策已通过；真实恢复流程仍待Screeps环境验证。
