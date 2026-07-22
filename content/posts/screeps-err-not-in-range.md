---
title: "Screeps ERR_NOT_IN_RANGE 怎么处理：动作距离与下一 tick 重试"
description: "解释ERR_NOT_IN_RANGE为什么出现，区分相邻、范围3和全房间动作，并用保存返回值、移动、下一tick重试的模式排查。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "错误码"
  - "Creep API"
  - "距离"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（动作所需范围、当前位置、目标存在性和移动分支，不是Screeps官方服务器）"
  testResult: "目标缺失、范围无效、已经在范围、距离不足、移动失败、动作成功和其他动作错误场景通过。"
featured: false
---

`ERR_NOT_IN_RANGE` 的值是 `-9`，表示目标存在，但执行者没有进入当前API要求的距离。

正确处理模式通常是：

```text
本tick调用动作
→ 得到 ERR_NOT_IN_RANGE
→ 本tick安排移动
→ 下一tick重新取得对象
→ 再次调用动作
```

移动和动作是两个不同命令。`moveTo()` 返回 `OK` 不表示Creep已经在当前脚本执行过程中到达目标。

## 不同动作需要的范围不同

不能把所有动作都写成“必须相邻”。常见例子：

| 动作 | 基础距离要求 |
|---|---:|
| `harvest()` | 相邻，范围1 |
| `withdraw()` | 相邻，范围1 |
| `transfer()` | 相邻，范围1 |
| `pickup()` | 同格或相邻 |
| `attack()` | 相邻，范围1 |
| `heal()` | 相邻，范围1 |
| `build()` | 范围3 |
| `repair()` | 范围3 |
| `upgradeController()` | 范围3 |
| `rangedAttack()` | 范围3 |
| `rangedHeal()` | 范围3 |

一些API不会返回这个错误：

- `StructureTower.heal()` 覆盖整个房间，距离影响治疗量，**不会返回** `ERR_NOT_IN_RANGE`；
- `StructureSpawn.spawnCreep()` 不是Creep接近目标的动作，**不会返回** `ERR_NOT_IN_RANGE`；
- `Game.getObjectById()` 返回对象或 `null`，**不返回**动作错误码。

排错前先核对具体API，而不是看到目标很远就假定一定会出现 `-9`。

## 先用RoomPosition判断当前距离

```js
const range = creep.pos.getRangeTo(target);
const isNear = creep.pos.isNearTo(target);
const canUpgrade = creep.pos.inRangeTo(target, 3);
```

这些方法只判断位置关系，不执行寻路，也不提交动作。

## 用纯函数规划“动作还是移动”

```js
function planRangeAction(input) {
  const {
    targetExists,
    currentRange,
    requiredRange,
    actionResult,
    moveResult
  } = input;

  if (!targetExists) {
    return {
      status: 'target-missing',
      shouldMove: false,
      shouldRetryNextTick: false
    };
  }

  if (
    !Number.isInteger(requiredRange)
    || requiredRange < 0
  ) {
    return {
      status: 'required-range-invalid',
      shouldMove: false,
      shouldRetryNextTick: false
    };
  }

  if (
    Number.isFinite(currentRange)
    && currentRange <= requiredRange
  ) {
    return {
      status: actionResult === OK
        ? 'action-submitted'
        : 'action-failed-in-range',
      shouldMove: false,
      shouldRetryNextTick: false
    };
  }

  if (actionResult !== ERR_NOT_IN_RANGE) {
    return {
      status: 'different-action-error',
      shouldMove: false,
      shouldRetryNextTick: false
    };
  }

  return {
    status: moveResult === OK
      ? 'move-submitted'
      : 'move-failed',
    shouldMove: true,
    shouldRetryNextTick: moveResult === OK
  };
}
```

这个函数只整理返回值关系，不调用真实动作。

## 完整示例：采集Source

```js
function runHarvestWithRange(creep, source) {
  if (!creep || creep.spawning === true) {
    return {
      status: 'creep-unavailable'
    };
  }

  if (!source) {
    return {
      status: 'source-missing'
    };
  }

  const rangeBefore = creep.pos.getRangeTo(source);
  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 10,
      visualizePathStyle: {
        stroke: '#ffaa00',
        opacity: 0.55
      }
    });

    return {
      status: moveResult === OK
        ? 'moving-to-source'
        : 'move-failed',
      rangeBefore,
      actionResult: result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'harvest-submitted'
      : 'harvest-failed',
    rangeBefore,
    actionResult: result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep) {
    return;
  }

  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );
  const outcome = runHarvestWithRange(
    creep,
    source
  );

  if (
    outcome.status === 'harvest-failed'
    || outcome.status === 'move-failed'
  ) {
    console.log({
      type: 'harvest-range-diagnostic',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

下一tick主循环会再次运行，并重新调用 `harvest()`。不要在当前tick用循环连续调用动作，等待位置变化。

## 为什么目标不可站立也能执行动作

Source、Controller、ConstructionSite和多数Structure占据目标坐标，Creep不需要站到目标同一格。

应把 `moveTo()` 的 `range` 设为动作要求：

```js
creep.moveTo(source, { range: 1 });
creep.moveTo(controller, { range: 3 });
```

错误地要求：

```js
range: 0
```

可能让寻路尝试到达不可站立位置，增加 `ERR_NO_PATH` 风险。

## 同一tick能不能同时调用动作和移动

可以先调用动作，得到 `ERR_NOT_IN_RANGE` 后再调用移动。移动属于独立动作管线。

但位置不会在当前JavaScript执行过程中立刻改变，因此：

```js
creep.moveTo(source);
creep.harvest(source);
```

第二行仍然使用移动前的位置进行距离判断。

更清晰的模式是先尝试动作，距离不足时只安排移动，下一tick再次尝试。

## `moveTo()` 本身也可能失败

处理 `ERR_NOT_IN_RANGE` 后，不能只写：

```js
creep.moveTo(target);
```

还应保存移动结果。常见情况：

- `ERR_NO_PATH`：当前没有找到路线；
- `ERR_BUSY`：Creep仍在生成；
- `ERR_TIRED`：`fatigue` 大于0；
- `ERR_NO_BODYPART`：没有有效MOVE；
- `ERR_INVALID_TARGET`：目标无效；
- `ERR_NOT_FOUND`：启用 `noPathFinding` 但没有可复用路径。

动作距离问题解决后，可能进入另一个移动问题，不能把两者混成同一个错误。

## 动作已经在范围内仍失败

若：

```js
creep.pos.inRangeTo(target, requiredRange)
```

为真，但动作没有返回 `OK`，就不应继续移动。应检查该API的其他返回值，例如：

- 资源不足；
- 容量已满；
- 所有权不符；
- 身体部件失效；
- 目标类型错误；
- 结构当前不可用。

`ERR_NOT_IN_RANGE` 只回答距离，不回答动作的全部前置条件。

## 常见错误

### 所有动作统一使用范围1

`build()`、`repair()` 和 `upgradeController()` 可以在范围3执行。

### 当前tick移动后立即期待动作成功

位置变化需要后续tick观察。

### 目标为 `null` 时仍调用动作

先判空，否则得到其他错误或JavaScript异常。

### 只记录动作结果，不记录移动结果

无法区分距离问题与寻路问题。

### 目标不可站立却使用 `range: 0`

使用具体动作要求的有效范围。

### 其他错误也继续移动

已经在范围内时，移动不能修复资源、所有权或身体问题。

## 离线模拟结果

构建检查覆盖：

1. 目标缺失；
2. requiredRange无效；
3. 已经在范围且动作成功；
4. 已经在范围但动作返回其他错误；
5. 距离不足且移动成功；
6. 距离不足但移动失败；
7. 动作不是 `ERR_NOT_IN_RANGE` 时不移动；
8. 下一tick重试标记。

离线测试不能模拟真实位置变化、路径、交通、动作结算或多个动作管线的服务器行为。

## 适用边界

本文不覆盖：

- PathFinder路径设计；
- 多Creep交通；
- 跨房间路线；
- 推拉移动；
- 每个Creep API的全部返回值；
- 战斗站位；
- 目标缓存。

JavaScript语法和离线距离分支已检查，真实移动与下一tick动作仍待Screeps环境验证。

## 相关站内内容

- [moveTo()不移动怎么排查](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [RoomPosition距离方法有什么区别](/blog/screeps-roomposition-distance)
- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [如何自动升级Controller](/blog/screeps-upgrade-controller)
- [错误码索引](/screeps-errors)

## 官方资料

- [Error Codes](https://docs.screeps.com/api/#Constants-Error-Codes)
- [Creep API](https://docs.screeps.com/api/#Creep)
- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [RoomPosition API](https://docs.screeps.com/api/#RoomPosition)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线距离分支已通过；真实动作与移动仍待Screeps环境验证。
