---
title: "Screeps moveTo() 返回 OK 但不移动怎么排查"
description: "Screeps moveTo() 返回 OK 但 Creep 不移动、走不动或卡住？按有效 MOVE、fatigue、返回码、reusePath 缓存、交通阻挡和同 tick 命令覆盖逐层排查。"
publishedAt: "2026-07-18"
updatedAt: "2026-09-10"
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
  checkedAt: "2026-09-10"
  testedAt: "2026-09-10"
  testEnvironment: "Node.js 24 离线模拟（文章返回码边界、目标、生成状态、MOVE部件、fatigue、已到范围、路径缓存提示和连续tick位置诊断，不是Screeps官方服务器）"
  testResult: "moveTo官方返回码、无有效MOVE前置检查、目标缺失、仍在生成、fatigue、已到范围、无路径、无缓存路径、命令已安排和连续位置未变化边界通过。"
featured: false
---

`creep.moveTo(target)` 返回 `OK` 的含义是**“本 tick 的移动意图已成功安排”**，不是“Creep 在当前 JavaScript 执行过程中已经改变位置”。实际位置是否变化，要到下一 tick 重新读取 `creep.pos` 才能判断。

如果你搜的是 **“Screeps moveTo 不动”**、**“Creep 不移动”**、**“moveTo 返回 OK 但位置没变”** 或 **“Creep 卡住”**，先按下面顺序查：

1. 目标是否存在且有有效 `pos`；
2. Creep 是否还在 spawning；
3. 是否至少有 1 个有效 `MOVE` 部件；
4. `creep.fatigue` 是否大于 0；
5. `moveTo()` 本次到底返回什么；
6. 如果返回 `OK`，下一 tick 的 `roomName:x:y` 是否真的变化；
7. 连续不变时，再查临时交通阻挡、路径缓存、房间边缘和同 tick 的其他移动调用。

这套顺序的关键，是把**“调用失败”**和**“调用成功但后续没有产生位移”**分开。前者看返回码，后者要看连续 tick 的位置、fatigue 和交通/移动决策。

## 官方返回值：先看 `moveTo()` 到底返回什么

当前官方 `Creep.moveTo()` 文档列出的返回值是：

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK (0)` | 移动命令已安排 | 下一 tick 的位置、fatigue、交通阻挡、是否有其他移动调用 |
| `ERR_NOT_OWNER (-1)` | Creep 不属于自己 | 调用对象是否是自己的 Creep |
| `ERR_NO_PATH (-2)` | 没找到目标路径 | `range`、出口、回调、障碍、`maxOps` |
| `ERR_BUSY (-4)` | Creep 仍在生成 | `creep.spawning` |
| `ERR_NOT_FOUND (-5)` | `noPathFinding: true`，但没有可复用路径 | 先允许一次正常寻路，或不要禁用寻路 |
| `ERR_INVALID_TARGET (-7)` | 目标无效 | `target` / `target.pos` / 坐标 |
| `ERR_TIRED (-11)` | `fatigue` 大于 0 | `creep.fatigue`、MOVE 比例、地形与负载 |

`moveTo()` **不返回 `ERR_NOT_IN_RANGE`**。它本身就是用于接近目标的方法。

另外，当前官方 `moveTo()` 返回值列表**没有列 `ERR_NO_BODYPART (-12)`**；这个返回码出现在 `Creep.move()` 的文档里。对 `moveTo()` 排障时仍然应该主动检查 `creep.getActiveBodyparts(MOVE)`，但不要把“没有有效 MOVE 部件”误写成 `moveTo()` 的官方 `ERR_NO_BODYPART` 返回值。

如果你在排查其他 Screeps 返回码，可以直接查[错误码索引](/screeps-errors)。

## 第一层：目标是否有效

```js
const target = Game.flags.WorkTarget;

if (!target) {
  return;
}
```

常见目标问题：

- Flag 被删除或改名；
- `Game.getObjectById()` 返回 `null`；
- Memory 中的 ID 已经失效；
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

## 第二层：Creep 能否移动

### 是否仍在生成

```js
if (creep.spawning === true) {
  return;
}
```

### 是否有有效 MOVE 部件

```js
const activeMoveParts = creep.getActiveBodyparts(MOVE);

if (activeMoveParts <= 0) {
  return;
}
```

身体数组中有 `MOVE`，不代表它仍然有效。受伤到 0 hits 的部件不再提供对应能力。

这里建议把“无有效 MOVE”作为**调用前置检查**，而不是等待一个并不属于当前 `moveTo()` 官方返回值列表的 `ERR_NO_BODYPART`。

### fatigue 是否大于 0

```js
if (creep.fatigue > 0) {
  return;
}
```

fatigue 大于 0 时，`moveTo()` 可返回 `ERR_TIRED (-11)`。等待有效 `MOVE` 部件在后续 tick 降低 fatigue，再观察位置是否恢复变化。

如果你想进一步判断为什么身体配置会让移动频率变慢，可以继续看 [MOVE 与 fatigue 怎样配比](/blog/screeps-move-fatigue-body-ratio)。

## 第三层：是否已经达到目标范围

如果业务只要求到目标 3 格内：

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

对于 Source 或 Container 通常使用范围 1；对于 Controller 升级、建造和维修通常使用范围 3。目标本身不可站立时，不要误用 `range: 0`。如果不确定距离 API 的差异，可以参考 [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)。

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

这个函数的价值不是替代 `moveTo()`，而是把最常见的“根本不该进入移动阶段”的状态提前分流。

## 完整诊断示例：记录连续 tick 的位置变化

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

这里把 `roomName` 一起写进位置键，是为了避免跨房间时只比较 `x/y` 造成误判。需要把路径直接画在房间里时，可以继续用 [RoomVisual 辅助调试](/blog/screeps-roomvisual-debug)。

`reusePath: 0` 只在连续位置未变化时临时用于诊断，不适合默认对所有 Creep 长期启用。官方 `moveTo()` 的 `reusePath` 默认值是 5；更高的复用值通常更省 CPU，但路径对动态变化的反应也会更慢。

## `moveTo()` 返回 `OK`，为什么下一 tick 还是没移动？

如果返回值已经是 `OK`，就不要继续把重点放在“API 调用有没有成功”，而要看**移动意图最后有没有落成实际位移**。

### 1. 同 tick 还有其他移动调用

同一 Creep 在一个 tick 中由多个模块安排移动时，最终执行的移动意图可能不是你最早看到的那一次调用。

最实用的排查方法是：

- 给所有 `move()` / `moveTo()` / 交通模块统一加调用来源日志；
- 一个 tick 只让一个统一的移动决策出口真正提交移动；
- 日志至少记录 Creep、目标、返回值、调用模块和 `Game.time`。

如果角色逻辑、避让逻辑和战斗逻辑都能直接调用移动，单看某一次 `moveTo() === OK` 很难证明最终方向。

### 2. 其他 Creep 或 Power Creep 临时阻挡

寻路结果可以是有效的，但下一格在结算时仍可能被临时交通占用。此时 `OK` 只说明移动命令已安排，不保证目标格最终可进入。

快速确认时，不需要先写完整交通管理器：只要连续记录当前位置、fatigue、`moveTo()` 返回值，并观察下一步附近是否反复被 Creep / Power Creep 占用即可。如果连续多 tick 都在同一点，而 fatigue 为 0、`moveTo()` 又返回 `OK`，交通冲突就应该进入高优先级排查。

### 3. 缓存路径已经不适合

`reusePath` 会复用已有路径。建筑、Creep、目标或局部交通变化后，旧路径可能短时间内不再理想。

诊断时可以短暂：

```js
creep.moveTo(target, {
  reusePath: 0
});
```

如果这样立刻恢复，再回头检查路径复用策略，而不是永久关闭缓存。

### 4. 房间边缘状态

跨房间时，Creep 可能在出口坐标附近连续尝试进入相邻房间。记录 `roomName:x:y`，不要只记录 `x` 和 `y`，否则跨房间后可能误判位置没有变化。

### 5. 身体负载导致移动频率变慢

fatigue 已经归零时才可移动。`MOVE` 比例不足、地形较重或 `CARRY` 装载变化都会影响移动节奏。不要把“不是每 tick 都走一格”直接判断为 `moveTo()` 失效。

### 6. `noPathFinding` 没有缓存路径

```js
creep.moveTo(target, {
  noPathFinding: true
});
```

如果没有已经记忆的路径可复用，官方行为是返回 `ERR_NOT_FOUND (-5)`。因此它不适合作为第一次寻路调用。

## `ERR_NO_PATH (-2)` 与“被临时堵住”不是一回事

`ERR_NO_PATH (-2)` 表示本次寻路没有找到路线。`moveTo()` 返回 `OK` 后被临时 Creep 阻挡，属于移动结算/交通问题，不是同一种错误。

排查 `ERR_NO_PATH` 时查看：

- 目标是否不可站立却要求范围 0；
- 房间出口是否可达；
- `roomCallback` 或 `costCallback` 是否禁止了可行道路；
- `maxOps` 是否过低；
- 目标是否在无法进入的封闭区域；
- 跨房间路线是否被回调拒绝。

如果你的问题明确是 `ERR_NO_PATH`，可以继续看 [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)。

## 常见错误

### 只看 Creep 画面，不记录返回值

无法区分无路径、fatigue、目标无效以及“已经提交但没产生位移”。

### 返回 `OK` 就断言已经移动

位置变化要在下一 tick 读取。

### 只检查身体数组中有 MOVE

使用 `getActiveBodyparts(MOVE)` 检查仍然有效的部件。

### 把 `ERR_NO_BODYPART` 当成 `moveTo()` 官方返回码

无有效 `MOVE` 仍然必须处理，但当前官方 `moveTo()` 返回值列表不包含 `ERR_NO_BODYPART (-12)`。不要把 `Creep.move()` 的返回码表直接套给 `moveTo()`。

### 每 tick 都关闭路径复用

可能显著增加 CPU。只在诊断或频繁变化场景短暂使用 `reusePath: 0`。

### 一个 tick 多个模块调用移动

建立单一移动决策出口，并记录最终是谁提交了移动。

### 只保存 x 和 y

跨房间诊断必须同时保存 `roomName`。

## FAQ：Screeps `moveTo()` 不动的高频问题

### `moveTo()` 返回 `OK`，为什么 Creep 还是不移动？

`OK` 只表示本 tick 的移动命令已安排。下一 tick 位置没变时，继续检查 `fatigue`、临时交通阻挡、路径缓存、房间边缘，以及同一 tick 是否还有其他移动逻辑影响最终移动意图。

### `ERR_TIRED (-11)` 应该怎么处理？

先看 `creep.fatigue`。只要 fatigue 大于 0，就不要把问题当成寻路失败。再检查有效 `MOVE` 数量、负载和地形，确认 fatigue 是否能按预期下降。

### 没有有效 `MOVE` 部件时，`moveTo()` 会返回 `ERR_NO_BODYPART (-12)` 吗？

不要这样写。当前官方 `Creep.moveTo()` 返回值列表没有 `ERR_NO_BODYPART (-12)`；该错误码见于 `Creep.move()` 文档。对 `moveTo()` 最稳妥的做法，是在调用前用 `creep.getActiveBodyparts(MOVE)` 做前置检查。

### `reusePath` 会让 Creep 看起来卡住吗？

可能让路径对动态变化反应较慢，但不能把所有卡住都归因于缓存。官方默认 `reusePath` 为 5。诊断时可以短暂设为 0 做 A/B 判断；如果恢复移动，再检查缓存策略和局部交通。

### `noPathFinding: true` 为什么返回 `ERR_NOT_FOUND (-5)`？

因为当前没有可复用的已记忆路径。第一次去新目标时应该允许正常寻路，之后才适合在明确知道已有缓存路径的场景使用 `noPathFinding`。

### 怎么快速判断是不是交通堵塞？

同时满足“`moveTo()` 返回 `OK`、fatigue 为 0、有效 `MOVE` 存在、连续多个 tick 的 `roomName:x:y` 不变”时，优先检查下一格附近的 Creep/Power Creep，以及是否存在多个模块争夺移动决策。

## 离线模拟结果

构建检查覆盖：

1. Creep 或目标缺失；
2. 目标没有 Position；
3. Creep 仍在生成；
4. 没有有效 MOVE；
5. fatigue 大于 0；
6. 已经进入目标范围；
7. `ERR_NO_PATH (-2)` 与 `ERR_NOT_FOUND (-5)`；
8. `OK (0)` 只代表命令已安排；
9. 连续位置未变化计数；
10. 跨房间位置键；
11. `moveTo()` 官方返回值边界，防止再次把 `ERR_NO_BODYPART (-12)` 混入返回码表；
12. FAQ、搜索意图描述与关键站内链接回归。

离线测试不能模拟真实 PathFinder、交通结算、房间出口或 fatigue 的真实多 tick 变化。

## 适用边界

本文不覆盖：

- 完整交通管理器；
- pull 链；
- 战斗走位；
- PathFinder CostMatrix 设计；
- 跨 Shard 移动；
- 多房间路线偏好；
- CPU 性能结论。

JavaScript 语法、文档返回码边界和离线诊断分支已检查，真实移动与多 tick 位置变化仍待 Screeps 环境验证。

## 相关站内内容

- [ERR_NOT_IN_RANGE 怎么处理](/blog/screeps-err-not-in-range)
- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [MOVE 与 fatigue 怎样配比](/blog/screeps-move-fatigue-body-ratio)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [RoomVisual 怎么辅助调试](/blog/screeps-roomvisual-debug)
- [错误码索引](/screeps-errors)

## 官方资料

- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [Creep.move API](https://docs.screeps.com/api/#Creep.move)
- [Creeps：Movement](https://docs.screeps.com/creeps.html#Movement)
- [Simultaneous execution of creep actions](https://docs.screeps.com/simultaneous-actions.html)
- [Debugging](https://docs.screeps.com/debugging.html)

资料核对日期：2026-09-10。离线诊断与文章 regression 已通过；真实移动行为仍待 Screeps 环境验证。
