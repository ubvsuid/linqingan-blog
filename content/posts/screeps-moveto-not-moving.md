---
title: "Screeps moveTo() 返回 OK 但不移动怎么排查"
description: "从目标、spawning、MOVE部件、fatigue、路径缓存、交通阻挡和返回值逐步排查，并记录连续tick位置变化。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "moveTo"
  - "寻路"
  - "移动"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（目标、生成状态、MOVE部件、fatigue、已到范围、返回值和位置历史，不是Screeps官方服务器）"
  testResult: "目标缺失、仍在生成、无MOVE、fatigue、已到范围、无路径、无缓存路径、命令已安排和连续位置未变化场景通过。"
featured: false
---

`creep.moveTo(target)` 返回 `OK` 的含义是“移动命令已安排”，不是“Creep在当前JavaScript执行过程中已经改变位置”。实际位置要在下一tick重新读取。

当Creep看起来不动时，先区分两类情况：

1. `moveTo()` 本身返回错误；
2. 返回 `OK`，但后续tick位置没有变化。

第二类可能来自fatigue、交通阻挡、路径过期、边缘移动或同tick后续移动命令覆盖。

## 官方返回值

`moveTo()`可能返回：

| 返回值 | 含义 |
|---|---|
| `OK` | 移动命令已安排 |
| `ERR_NOT_OWNER` | Creep不属于自己 |
| `ERR_NO_PATH` | 没找到目标路径 |
| `ERR_BUSY` | Creep仍在生成 |
| `ERR_NOT_FOUND` | 开启 `noPathFinding`，但没有可复用路径 |
| `ERR_INVALID_TARGET` | 目标无效 |
| `ERR_TIRED` | `fatigue` 大于0 |
| `ERR_NO_BODYPART` | 没有有效MOVE部件 |

`moveTo()` 不返回 `ERR_NOT_IN_RANGE`。它本身就是用于接近目标的方法。

## 第一层：目标是否有效

```js
const target = Game.flags.WorkTarget;

if (!target) {
  return;
}
```

常见目标问题：

- Flag被删除或改名；
- `Game.getObjectById()` 返回 `null`；
- Memory中的ID已经失效；
- 传入的对象没有有效 `pos`；
- 坐标格式错误。

可以统一检查：

```js
function hasValidPosition(target) {
  return Boolean(
    target
    && target.pos
    && Number.isInteger(target.pos.x)
    && Number.isInteger(target.pos.y)
    && typeof target.pos.roomName === 'string'
  );
}
```

## 第二层：Creep能否移动

### 是否仍在生成

```js
if (creep.spawning === true) {
  return;
}
```

### 是否有有效MOVE部件

```js
const activeMoveParts = creep.getActiveBodyparts(MOVE);

if (activeMoveParts <= 0) {
  return;
}
```

身体数组中有MOVE，不代表它仍然有效。受伤到0 hits的部件不提供能力。

### fatigue是否大于0

```js
if (creep.fatigue > 0) {
  return;
}
```

fatigue大于0时，普通移动返回 `ERR_TIRED`。等待MOVE部件在后续tick减少fatigue。

## 第三层：是否已经达到目标范围

如果业务只要求到目标3格内：

```js
if (creep.pos.inRangeTo(target, 3)) {
  return;
}
```

继续调用：

```js
creep.moveTo(target, { range: 3 });
```

没有意义。

对于Source或Container通常使用范围1；对于Controller升级、建造和维修通常使用范围3。目标本身不可站立时，不要误用 `range: 0`。

## 用纯函数整理移动前置条件

```js
function evaluateMoveRequest(input) {
  const {
    creepExists,
    targetExists,
    targetHasPosition,
    creepSpawning,
    activeMoveParts,
    fatigue,
    currentRange,
    desiredRange,
    moveResult
  } = input;

  if (!creepExists) {
    return { ready: false, reason: 'creep-missing' };
  }

  if (!targetExists || !targetHasPosition) {
    return { ready: false, reason: 'target-invalid' };
  }

  if (creepSpawning) {
    return { ready: false, reason: 'creep-spawning' };
  }

  if (!Number.isInteger(activeMoveParts) || activeMoveParts <= 0) {
    return { ready: false, reason: 'no-active-move-part' };
  }

  if (!Number.isFinite(fatigue) || fatigue > 0) {
    return { ready: false, reason: 'creep-tired' };
  }

  if (!Number.isInteger(desiredRange) || desiredRange < 0) {
    return { ready: false, reason: 'range-invalid' };
  }

  if (currentRange <= desiredRange) {
    return { ready: false, reason: 'already-in-range' };
  }

  if (moveResult !== undefined && moveResult !== OK) {
    return { ready: false, reason: 'move-call-failed' };
  }

  return { ready: true, reason: 'move-needed' };
}
```

## 完整诊断示例

```js
function getPositionKey(pos) {
  return `${pos.roomName}:${pos.x}:${pos.y}`;
}

function runMoveDiagnostic(creep, target, desiredRange) {
  if (!creep) {
    return { status: 'creep-missing' };
  }

  if (!target?.pos) {
    return { status: 'target-invalid' };
  }

  if (creep.spawning === true) {
    return { status: 'creep-spawning' };
  }

  const activeMoveParts = creep.getActiveBodyparts(MOVE);

  if (activeMoveParts <= 0) {
    return { status: 'no-active-move-part' };
  }

  const range = creep.pos.roomName === target.pos.roomName
    ? creep.pos.getRangeTo(target)
    : null;

  if (
    range !== null
    && range <= desiredRange
  ) {
    return {
      status: 'already-in-range',
      range
    };
  }

  const positionBefore = getPositionKey(creep.pos);
  const last = creep.memory.moveDiagnostic;
  const unchangedTicks = last?.position === positionBefore
    ? (last.unchangedTicks || 0) + 1
    : 0;

  const result = creep.moveTo(target, {
    range: desiredRange,
    reusePath: unchangedTicks >= 2 ? 0 : 5,
    visualizePathStyle: {
      stroke: '#ffcc00',
      opacity: 0.55
    }
  });

  creep.memory.moveDiagnostic = {
    targetRoom: target.pos.roomName,
    targetX: target.pos.x,
    targetY: target.pos.y,
    desiredRange,
    position: positionBefore,
    unchangedTicks,
    fatigue: creep.fatigue,
    activeMoveParts,
    result,
    checkedAt: Game.time
  };

  return {
    status: result === OK
      ? 'move-submitted'
      : 'move-failed',
    result,
    positionBefore,
    unchangedTicks,
    fatigue: creep.fatigue,
    activeMoveParts
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.WorkTarget;

  const outcome = runMoveDiagnostic(
    creep,
    target,
    1
  );

  if (
    outcome.status === 'move-failed'
    || outcome.unchangedTicks >= 3
  ) {
    console.log({
      type: 'move-diagnostic',
      creepName: creep?.name ?? null,
      ...outcome
    });
  }
};
```

`reusePath: 0` 只在连续位置未变化时临时用于诊断，不适合默认对所有Creep长期启用。

## 返回OK却连续不动的原因

### 同tick后续移动命令覆盖

同一Creep在一个tick中多次调用移动方法时，后面的移动命令可能覆盖前面的命令。

应保证一个统一模块最终决定移动，而不是角色、避让和战斗模块各自调用。

### 其他Creep或Power Creep阻挡

寻路时可能没有把临时交通视为永久障碍。返回OK只代表命令已安排，不保证目标格在结算时可进入。

### 缓存路径已经不适合

`reusePath` 默认会复用路径。建筑、Creep和目标变化后，旧路径可能反应较慢。诊断时短暂设为0，确认是否为缓存问题。

### 房间边缘状态

跨房间时，Creep可能在出口坐标附近连续尝试进入相邻房间。记录 `roomName:x:y`，不要只记录x和y，否则跨房间后可能误判位置没有变化。

### 身体负载导致移动变慢

fatigue已经归零时才可移动。MOVE比例不足、地形较重或CARRY装载变化都会影响移动频率。

### `noPathFinding` 没有缓存路径

```js
creep.moveTo(target, {
  noPathFinding: true
});
```

没有可复用路径时返回 `ERR_NOT_FOUND`。该选项不能作为第一次寻路调用。

## `ERR_NO_PATH` 与“被临时堵住”不同

`ERR_NO_PATH` 表示本次寻路没有找到路线。返回OK后被临时Creep阻挡属于结算或交通问题，不是同一种错误。

排查 `ERR_NO_PATH` 时查看：

- 目标是否不可站立却要求范围0；
- 房间出口是否可达；
- `roomCallback` 或 `costCallback` 是否禁止了道路；
- `maxOps` 是否过低；
- 目标是否在封闭Rampart内部；
- 跨房间路线是否被回调拒绝。

## 常见错误

### 只看Creep画面，不记录返回值

无法区分无路径、fatigue、无MOVE和目标无效。

### 返回OK就断言已经移动

位置变化要在下一tick读取。

### 只检查身体数组中有MOVE

使用 `getActiveBodyparts(MOVE)`。

### 每tick都关闭路径复用

可能显著增加CPU。只在诊断或频繁变化场景使用。

### 一个tick多个模块调用移动

建立单一移动决策出口。

### 只保存x和y

跨房间诊断必须同时保存 `roomName`。

## 离线模拟结果

构建检查覆盖：

1. Creep或目标缺失；
2. 目标没有Position；
3. Creep仍在生成；
4. 没有有效MOVE；
5. fatigue大于0；
6. 已经进入目标范围；
7. `ERR_NO_PATH` 与 `ERR_NOT_FOUND`；
8. `OK`命令已安排；
9. 连续位置未变化计数；
10. 跨房间位置键。

离线测试不能模拟真实PathFinder、交通结算、房间出口或fatigue变化。

## 适用边界

本文不覆盖：

- 完整交通管理器；
- pull链；
- 战斗走位；
- PathFinder CostMatrix设计；
- 跨Shard移动；
- 多房间路线偏好；
- CPU性能结论。

JavaScript语法和离线诊断分支已检查，真实移动与多tick位置变化仍待Screeps环境验证。

## 相关站内内容

- [ERR_NOT_IN_RANGE怎么处理](/blog/screeps-err-not-in-range)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [MOVE与fatigue怎样配比](/blog/screeps-move-fatigue-body-ratio)
- [RoomPosition距离方法有什么区别](/blog/screeps-roomposition-distance)
- [RoomVisual怎么辅助调试](/blog/screeps-roomvisual-debug)
- [错误码索引](/screeps-errors)

## 官方资料

- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [Creep.move API](https://docs.screeps.com/api/#Creep.move)
- [Creeps：Movement](https://docs.screeps.com/creeps.html#Movement)
- [Simultaneous execution of creep actions](https://docs.screeps.com/simultaneous-actions.html)
- [Debugging](https://docs.screeps.com/debugging.html)

资料核对日期：2026-07-22。离线诊断分支已通过；真实移动行为仍待环境验证。
