---
title: "reserveController() 和 claimController() 怎么选：预订、占领与 GCL 边界"
description: "比较 reserveController() 与 claimController() 的目标、持续方式、GCL限制和返回值，并提供带确认条件的远程Controller任务示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Controller"
  - "CLAIM"
  - "远程房间"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（任务配置、所有权、预订归属、GCL余量与CLAIM部件，不是Screeps官方服务器）"
  testResult: "无效任务、无CLAIM部件、已有所有者、敌对预订、GCL不足、自有预订、预订与占领可执行场景通过。"
featured: false
---

`reserveController()` 和 `claimController()` 都作用于远程房间的 Controller，也都需要有效的 `CLAIM` 身体部件，但它们解决的是两类完全不同的问题：

- `reserveController()`：临时预订中立房间，持续增加预订剩余时间；
- `claimController()`：把中立房间正式纳入自己的已控制房间。

本文只解决一个问题：怎样根据任务目的、Controller状态和GCL余量，安全决定应该预订还是占领，而不是看到中立Controller就直接调用其中一个方法。

## 先看结论

| 对比项 | `reserveController()` | `claimController()` |
|---|---|---|
| 主要目标 | 临时使用远程房间 | 永久扩张一个已控制房间 |
| Controller所有权 | 仍然是中立状态 | 成为己方Controller |
| 是否占用GCL房间名额 | 不占用 | 占用 |
| 是否需要持续执行 | 通常需要定期续期 | 成功后不应继续调用 |
| 每个有效CLAIM部件的作用 | 每tick增加1tick预订时间 | 参与一次占领动作 |
| 最大持续时间 | 最多维持5000tick预订 | 不适用 |
| 常见用途 | 远程采集、未来扩张准备 | 建立新房间、建造Spawn |

选择规则可以简化为：

```text
只想远程采集或暂时保留房间
→ reserveController()

准备正式建设新房间，并且GCL允许
→ claimController()
```

## 两种动作共同的前置条件

两种方法都要求：

1. Creep属于自己；
2. Creep已经完成生成；
3. 至少有一个有效的 `CLAIM` 部件；
4. 目标是有效的中立Controller；
5. Creep与Controller相邻；
6. 当前Shard允许执行该动作。

`CLAIM`部件存在不等于有效。受伤到0 hits的身体部件不能提供能力，因此应使用：

```js
const activeClaimParts = creep.getActiveBodyparts(CLAIM);
```

而不是只检查身体数组中是否曾经配置过 `CLAIM`。

## `reserveController()` 的关键规则

官方API说明：每次成功执行时，每个有效 `CLAIM` 部件会为预订增加1tick，最大预订时间为5000tick。

例如一只拥有2个有效 `CLAIM` 部件的Creep，在一个tick内成功执行一次，会增加2tick预订时间。

预订还有两个重要效果：

- 暂时阻止其他玩家占领该Controller；
- 让该中立房间的Source恢复完整容量。

预订不是永久状态。Creep停止续期后，`controller.reservation.ticksToEnd` 会逐步减少，最终回到没有预订的中立状态。

可以读取：

```js
const reservation = controller.reservation;

if (reservation) {
  console.log({
    username: reservation.username,
    ticksToEnd: reservation.ticksToEnd
  });
}
```

`controller.reservation`不存在时，不要直接读取 `username` 或 `ticksToEnd`。

## `claimController()` 的关键规则

`claimController()` 会尝试把中立Controller变成自己的Controller。成功后，该房间计入GCL允许控制的房间数量。

GCL等级决定可以同时控制多少个房间。例如GCL为3时，通常最多控制3个房间。

可以计算当前是否还有名额：

```js
function getClaimCapacity() {
  const ownedRooms = Object.values(Game.rooms)
    .filter(room => room.controller?.my === true)
    .length;

  return {
    ownedRooms,
    gclLevel: Game.gcl.level,
    available: Math.max(0, Game.gcl.level - ownedRooms)
  };
}
```

己方房间始终可见，因此用 `Game.rooms` 统计己方Controller是可行的。这里计算的是当前脚本观察到的基础名额，不处理特殊区域额外限制。

占领成功后不要在后续tick继续调用 `claimController()`。Controller已经属于自己时，它不再是有效的中立目标。

## 敌对预订为什么要单独检查

Controller没有 `owner`，不代表它一定可以直接预订或占领。它可能已经被其他玩家预订：

```js
controller.reservation
```

当预订用户名不是当前Creep的所有者时，本文把它视为敌对预订，不自动继续任务。

```js
function hasHostileReservation(controller, username) {
  const reservation = controller.reservation;
  return Boolean(
    reservation
    && reservation.username !== username
  );
}
```

处理敌对预订通常需要另外设计 `attackController()`、战斗、等待或放弃任务。本文不会把这些高影响动作自动混入预订与占领流程。

## 用纯函数先判断任务能否执行

下面的函数不调用游戏API，只根据当前状态给出决定，因此适合离线测试。

```js
function evaluateControllerMission(input) {
  const {
    action,
    activeClaimParts,
    controllerOwned,
    reservationUsername,
    creepUsername,
    ownedRoomCount,
    gclLevel,
    claimConfirmed
  } = input;

  if (!['reserve', 'claim'].includes(action)) {
    return { ready: false, reason: 'invalid-action' };
  }

  if (!Number.isInteger(activeClaimParts) || activeClaimParts <= 0) {
    return { ready: false, reason: 'no-active-claim-part' };
  }

  if (controllerOwned) {
    return { ready: false, reason: 'controller-owned' };
  }

  if (
    reservationUsername
    && reservationUsername !== creepUsername
  ) {
    return { ready: false, reason: 'hostile-reservation' };
  }

  if (action === 'claim') {
    if (claimConfirmed !== true) {
      return { ready: false, reason: 'claim-not-confirmed' };
    }

    if (
      !Number.isInteger(ownedRoomCount)
      || !Number.isInteger(gclLevel)
      || ownedRoomCount >= gclLevel
    ) {
      return { ready: false, reason: 'gcl-not-enough' };
    }
  }

  return { ready: true, reason: 'ready' };
}
```

`claimConfirmed`是本站加入的人工确认条件，不是官方API字段。它用于避免把原本只想预订的任务误改成正式占领。

## 完整示例：一个Creep执行明确的Controller任务

先写入任务配置：

```js
Memory.controllerMissions ??= {};
Memory.controllerMissions.Claimer1 = {
  enabled: true,
  action: 'reserve',
  claimConfirmed: false
};
```

正式占领时必须显式改为：

```js
Memory.controllerMissions.Claimer1 = {
  enabled: true,
  action: 'claim',
  claimConfirmed: true
};
```

完整主循环：

```js
function evaluateControllerMission(input) {
  const {
    action,
    activeClaimParts,
    controllerOwned,
    reservationUsername,
    creepUsername,
    ownedRoomCount,
    gclLevel,
    claimConfirmed
  } = input;

  if (!['reserve', 'claim'].includes(action)) {
    return { ready: false, reason: 'invalid-action' };
  }

  if (!Number.isInteger(activeClaimParts) || activeClaimParts <= 0) {
    return { ready: false, reason: 'no-active-claim-part' };
  }

  if (controllerOwned) {
    return { ready: false, reason: 'controller-owned' };
  }

  if (
    reservationUsername
    && reservationUsername !== creepUsername
  ) {
    return { ready: false, reason: 'hostile-reservation' };
  }

  if (action === 'claim') {
    if (claimConfirmed !== true) {
      return { ready: false, reason: 'claim-not-confirmed' };
    }

    if (
      !Number.isInteger(ownedRoomCount)
      || !Number.isInteger(gclLevel)
      || ownedRoomCount >= gclLevel
    ) {
      return { ready: false, reason: 'gcl-not-enough' };
    }
  }

  return { ready: true, reason: 'ready' };
}

function getOwnedRoomCount() {
  return Object.values(Game.rooms)
    .filter(room => room.controller?.my === true)
    .length;
}

function runControllerMission(creep) {
  const mission = Memory.controllerMissions?.[creep.name];

  if (!mission || mission.enabled !== true) {
    return;
  }

  const controller = creep.room.controller;

  if (!controller) {
    mission.lastStatus = 'controller-missing';
    mission.lastCheckedAt = Game.time;
    return;
  }

  const decision = evaluateControllerMission({
    action: mission.action,
    activeClaimParts: creep.getActiveBodyparts(CLAIM),
    controllerOwned: Boolean(controller.owner),
    reservationUsername: controller.reservation?.username ?? null,
    creepUsername: creep.owner.username,
    ownedRoomCount: getOwnedRoomCount(),
    gclLevel: Game.gcl.level,
    claimConfirmed: mission.claimConfirmed
  });

  mission.lastStatus = decision.reason;
  mission.lastCheckedAt = Game.time;

  if (!decision.ready) {
    return;
  }

  let result;

  if (mission.action === 'reserve') {
    result = creep.reserveController(controller);
  } else {
    result = creep.claimController(controller);
  }

  mission.lastResult = result;
  mission.lastResultAt = Game.time;

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 1,
      reusePath: 10
    });

    mission.lastMoveResult = moveResult;
    return;
  }

  if (result === OK && mission.action === 'claim') {
    mission.enabled = false;
    mission.completedAt = Game.time;
  }

  if (result !== OK) {
    console.log({
      type: 'controller-mission-failed',
      creepName: creep.name,
      roomName: creep.room.name,
      action: mission.action,
      result
    });
  }
}

module.exports.loop = function () {
  const creep = Game.creeps.Claimer1;

  if (!creep || creep.spawning === true) {
    return;
  }

  runControllerMission(creep);
};
```

把 `Claimer1` 换成真实Creep名称。

## 为什么预订任务不能像占领一样自动关闭

占领成功是一次性结果，Controller成为己方对象后任务应结束。

预订不同。一次成功只增加有限时间，通常需要：

- Creep持续执行；
- 下一只预订Creep接替；
- 根据 `ticksToEnd` 提前生成替补；
- 远程房间失去视野时保留任务状态。

因此示例只在 `claim` 成功后关闭任务，不在 `reserve` 返回 `OK` 后关闭。

## 返回值差异

### `reserveController()`

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 预订命令已提交 | 下一tick读取预订状态 |
| `ERR_NOT_OWNER` | Creep不是自己的 | 检查对象来源 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_INVALID_TARGET` | 目标不是有效中立Controller | 检查所有权与预订状态 |
| `ERR_NOT_IN_RANGE` | 不相邻 | 移动到范围1 |
| `ERR_NO_BODYPART` | 没有有效CLAIM部件 | 检查身体与受伤状态 |
| `ERR_ACCESS_DENIED` | 当前Shard无访问权限 | 检查Shard权限 |

### `claimController()`

除了共同返回值，还可能出现：

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `ERR_GCL_NOT_ENOUGH` | GCL无法再控制新房间 | 改为预订或提升GCL |
| `ERR_FULL` | 特殊新手区域的占领数量达到限制 | 检查区域规则 |

返回 `OK` 只表示命令已安排，不应在同一tick手动修改Controller所有权状态。下一tick重新读取 `controller.my`、`controller.owner` 和房间状态。

## 常见错误

### 把预订当成永久占领

预订会过期，也不能让房间变成己方已控制房间。

### 为远程采集直接使用 `claimController()`

这会占用GCL名额，并改变房间建设与管理责任。只需要Source完整容量时，预订通常更符合目标。

### 每tick重复调用 `claimController()`

占领是一次性动作。成功后继续调用只会面对无效目标，并制造无意义日志。

### 只检查 `controller.my`

中立Controller的 `my` 为假，但它仍可能有其他玩家的预订。还要检查 `controller.owner` 与 `controller.reservation`。

### 忽略CLAIM部件价格和寿命

`CLAIM`部件昂贵，并且预订任务通常涉及远距离移动。任务规划还需要考虑生成时间、路线长度和接替时机。

### 把 `OK` 写成已经占领成功

命令在脚本执行后统一处理。当前tick的 `OK` 不能替代下一tick状态确认。

## 离线模拟结果

构建检查覆盖：

1. 无效任务类型；
2. 没有有效CLAIM部件；
3. Controller已有所有者；
4. Controller被其他玩家预订；
5. 占领没有人工确认；
6. GCL名额不足；
7. 自己已经预订的房间继续预订；
8. GCL允许时执行占领。

这些测试只验证决策分支，不模拟官方Controller状态变化、房间视野、跨房间移动或实际GCL结算。

## 适用边界

本文不覆盖：

- `attackController()`；
- 战斗清理敌对预订；
- 自动选择扩张房间；
- 跨房间寻路与路线避险；
- Claimer自动生成与接替；
- 多Shard扩张；
- 新手区域全部特殊规则；
- 占领后的Spawn建设流程。

JavaScript语法和离线任务决策已检查，真实Controller预订、占领和跨tick状态仍待Screeps环境验证。

## 相关站内内容

- [Controller快降级了怎么办](/blog/screeps-controller-downgrade)
- [Safe Mode怎么安全启用](/blog/screeps-controller-activate-safe-mode)
- [Game.rooms为什么没有某个房间](/blog/screeps-room-visibility)
- [跨房间路线怎么规划](/blog/screeps-map-find-route)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [进入Controller与房间控制专题](/knowledge/controller-control)

## 官方资料

- [Control](https://docs.screeps.com/control.html)
- [Creep.claimController API](https://docs.screeps.com/api/#Creep.claimController)
- [Creep.reserveController API](https://docs.screeps.com/api/#Creep.reserveController)
- [StructureController API](https://docs.screeps.com/api/#StructureController)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线任务决策模拟已通过；真实Controller动作仍待环境验证。
