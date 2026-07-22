---
title: "StructureNuker.launchNuke() 前必须检查什么"
description: "使用目标绑定确认词和一次性Memory请求，核对RoomPosition、10房间范围、Energy、Ghodium、Nuker等待状态与全部返回码，再决定是否提交不可逆发射。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Nuker"
  - "防御"
  - "高风险 API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（请求确认、坐标、距离、结构资源和等待状态，不是 Screeps 官方服务器）"
  testResult: "目标无效、确认词不一致、距离超限、Energy不足、Ghodium不足、结构等待、RCL不可用和可提交场景通过。"
featured: false
---

`StructureNuker.launchNuke(pos)` 会提交一次不可逆的核弹发射。目标坐标、目标房间或确认流程出错，都可能造成无法撤回的游戏后果。

本文只解决一个问题：怎样建立一个必须人工确认、只执行一次并保存完整结果的发射入口。本文不提供攻击目标建议、伤害承诺或虚构战报。

## 官方前提

Nuker 在 RCL 8 才可使用。发射前至少需要核对：

- 结构属于自己；
- `nuker.isActive()` 为真；
- 目标是合法 `RoomPosition`；
- 目标房间在线性距离10以内；
- Nuker当前没有等待时间；
- Energy已装满；
- `RESOURCE_GHODIUM`已装满；
- 目标不属于官方禁止核弹的区域或位置。

官方常量：

```js
NUKER_RANGE
NUKER_ENERGY_CAPACITY
NUKER_GHODIUM_CAPACITY
```

应优先读取这些常量，不要把10、300000和5000散落在业务代码里。

## 目标绑定确认词

仅使用固定确认词：

```js
confirmation: 'LAUNCH'
```

无法证明玩家确认的是当前目标。更稳妥的做法是让确认词包含目标：

```js
function buildNukeConfirmation(roomName, x, y) {
  return `LAUNCH_NUKE_${roomName}_${x}_${y}`;
}
```

请求中的房间或坐标发生任何变化，旧确认词都会失效。

## 一次性请求结构

```js
Memory.nuker ??= {};
Memory.nuker.launchRequest = {
  enabled: true,
  nukerId: '替换为自己的Nuker ID',
  targetRoom: 'W2N2',
  x: 25,
  y: 25,
  confirmation: 'LAUNCH_NUKE_W2N2_25_25'
};
```

执行前必须人工检查整个对象，而不是只把 `enabled` 改为 `true`。

## 可离线测试的计划函数

```js
function buildNukeConfirmation(roomName, x, y) {
  return `LAUNCH_NUKE_${roomName}_${x}_${y}`;
}

function evaluateNukeRequest(input) {
  const {
    request,
    active,
    waitingTicks,
    distance,
    energyAvailable,
    ghodiumAvailable
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.targetRoom !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
  ) {
    return { ready: false, reason: 'invalid-target' };
  }

  const expected = buildNukeConfirmation(
    request.targetRoom,
    request.x,
    request.y
  );

  if (request.confirmation !== expected) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (!active) {
    return { ready: false, reason: 'structure-inactive' };
  }

  if (waitingTicks > 0) {
    return { ready: false, reason: 'nuker-waiting' };
  }

  if (!Number.isFinite(distance) || distance > NUKER_RANGE) {
    return { ready: false, reason: 'target-out-of-range' };
  }

  if (energyAvailable < NUKER_ENERGY_CAPACITY) {
    return { ready: false, reason: 'energy-shortage' };
  }

  if (ghodiumAvailable < NUKER_GHODIUM_CAPACITY) {
    return { ready: false, reason: 'ghodium-shortage' };
  }

  return { ready: true, reason: 'ready' };
}
```

## 完整示例

代码放入现有 `main` 模块。

```js
function buildNukeConfirmation(roomName, x, y) {
  return `LAUNCH_NUKE_${roomName}_${x}_${y}`;
}

function evaluateNukeRequest(input) {
  const {
    request,
    active,
    waitingTicks,
    distance,
    energyAvailable,
    ghodiumAvailable
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.targetRoom !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
  ) {
    return { ready: false, reason: 'invalid-target' };
  }

  const expected = buildNukeConfirmation(
    request.targetRoom,
    request.x,
    request.y
  );

  if (request.confirmation !== expected) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (!active) {
    return { ready: false, reason: 'structure-inactive' };
  }

  if (waitingTicks > 0) {
    return { ready: false, reason: 'nuker-waiting' };
  }

  if (!Number.isFinite(distance) || distance > NUKER_RANGE) {
    return { ready: false, reason: 'target-out-of-range' };
  }

  if (energyAvailable < NUKER_ENERGY_CAPACITY) {
    return { ready: false, reason: 'energy-shortage' };
  }

  if (ghodiumAvailable < NUKER_GHODIUM_CAPACITY) {
    return { ready: false, reason: 'ghodium-shortage' };
  }

  return { ready: true, reason: 'ready' };
}

function handleNukeRequest() {
  const request = Memory.nuker?.launchRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const nuker = typeof request.nukerId === 'string'
    ? Game.getObjectById(request.nukerId)
    : null;

  if (
    !nuker
    || nuker.structureType !== STRUCTURE_NUKER
    || nuker.my !== true
  ) {
    request.enabled = false;
    request.status = 'nuker-missing';
    return;
  }

  const distance = Game.map.getRoomLinearDistance(
    nuker.room.name,
    request.targetRoom
  );
  const energyAvailable = nuker.store.getUsedCapacity(
    RESOURCE_ENERGY
  );
  const ghodiumAvailable = nuker.store.getUsedCapacity(
    RESOURCE_GHODIUM
  );

  const plan = evaluateNukeRequest({
    request,
    active: nuker.isActive(),
    waitingTicks: nuker.cooldown,
    distance,
    energyAvailable,
    ghodiumAvailable
  });

  if (!plan.ready) {
    request.enabled = false;
    request.status = `precheck-${plan.reason}`;
    request.checkedAt = Game.time;
    return;
  }

  const target = new RoomPosition(
    request.x,
    request.y,
    request.targetRoom
  );

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    nukerId: nuker.id,
    sourceRoom: nuker.room.name,
    targetRoom: request.targetRoom,
    x: request.x,
    y: request.y,
    distance,
    energyAvailable,
    ghodiumAvailable
  };

  const result = nuker.launchNuke(target);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'launch-nuke-result',
    sourceRoom: nuker.room.name,
    targetRoom: target.roomName,
    x: target.x,
    y: target.y,
    result
  });
}

module.exports.loop = function () {
  handleNukeRequest();
};
```

## 为什么预检查失败也关闭请求

目标错误、资源不足或距离超限时，保留开启状态会让主循环持续尝试。更危险的是，条件以后突然满足时，旧请求可能在无人确认的情况下发射。

因此任何失败都会把 `enabled` 设为 `false`。失败后必须人工核对目标、确认词、资源、结构状态与返回值，再重新写入明确请求。

## 为什么调用前关闭请求

API调用本身是不可逆的高影响动作。示例在调用前先关闭请求，防止脚本后续异常或日志遗漏导致下一 tick 再次尝试。

调用结果会保存到 `Memory.nuker.launchRequest`，不会因为关闭开关而丢失证据。

## 全部返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 发射已安排 | 下一 tick 查看Nuker状态和目标房间Nuke对象 |
| `ERR_NOT_OWNER` | Nuker不是自己的 | ID与所有权 |
| `ERR_NOT_ENOUGH_RESOURCES` | Energy或Ghodium不足 | 两种Store容量 |
| `ERR_INVALID_TARGET` | 指定位置不能发射 | 受保护区域和目标规则 |
| `ERR_NOT_IN_RANGE` | 目标房间超过范围 | `NUKER_RANGE`与线性距离 |
| `ERR_INVALID_ARGS` | 目标不是合法RoomPosition | 房间名和0—49坐标 |
| `ERR_TIRED` | Nuker仍在等待 | `nuker.cooldown` |
| `ERR_RCL_NOT_ENOUGH` | Controller等级不足 | RCL与 `nuker.isActive()` |

预检查不能提前识别所有 `ERR_INVALID_TARGET` 情况，最终必须保存API返回值。

## 下一 tick 怎样核对

返回 `OK` 后，可以在有目标房间视野时查找：

```js
const room = Game.rooms.W2N2;

if (room) {
  const nukes = room.find(FIND_NUKES);
  console.log(nukes);
}
```

没有目标视野时，不能用 `Game.rooms[targetRoom]` 为空证明发射失败。仍应检查Nuker自身状态，并等待获得目标视野或其他可信记录。

## 离线模拟结果

构建检查覆盖：

1. 请求未启用；
2. 坐标越界或房间名缺失；
3. 确认词与目标不一致；
4. 结构当前不可用；
5. Nuker仍在等待；
6. 线性距离超过 `NUKER_RANGE`；
7. Energy不足；
8. Ghodium不足；
9. 所有基础条件满足时允许提交。

离线模拟没有构造真实 Nuker，也没有发射核弹。

## 常见误区

### 确认词不绑定目标

请求内容改变后，旧确认仍然可能通过。

### 使用 `getFreeCapacity() === 0` 代替资源数量

Store满不一定证明对应资源达到官方容量，应按资源类型读取已用数量。

### 失败请求一直保持开启

条件以后变化时可能意外执行。

### 只检查距离，不检查保护区规则

目标在10房间内仍可能返回 `ERR_INVALID_TARGET`。

### 把 `OK` 写成目标已受到伤害

`OK`只表示发射已安排，落地和伤害发生在后续流程。

### 自动选择目标

本文故意不提供目标推荐和自动攻击策略。

## 适用边界

本文没有实现：

- 自动选取敌方建筑；
- 伤害与Rampart计算；
- 多Nuker协同；
- 到达时间同步；
- 目标房间侦察；
- 外交规则；
- 自动补充Ghodium；
- 发射后的作战计划。

JavaScript语法和请求计划离线模拟已经通过。真实发射、目标规则和Nuke落地仍待 Screeps 环境验证。

## 相关站内内容

- [Safe Mode 怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Observer 怎么获取远方房间视野](/blog/screeps-observer-observe-room)
- [Terminal.send() 怎么发送资源](/blog/screeps-terminal-send-resources)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [查询 Screeps 错误码](/screeps-errors)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [StructureNuker.launchNuke API](https://docs.screeps.com/api/#StructureNuker.launchNuke)
- [Defending your room](https://docs.screeps.com/defense.html)
- [Start Areas](https://docs.screeps.com/start-areas.html)

资料核对日期：2026-07-22。离线请求计划已通过；真实发射仍待环境验证。
