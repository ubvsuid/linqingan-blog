---
title: "Screeps ERR_NOT_IN_RANGE（-9）怎么处理：Creep 动作距离与 moveTo 排查"
description: "Screeps 中 Creep 动作返回 ERR_NOT_IN_RANGE（-9）时，先确认目标与动作距离，再检查 moveTo() 返回值，并在下一 tick 重试。包含范围 1、范围 3 和 ERR_NO_PATH 排查示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-23"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "错误码"
  - "Creep API"
  - "moveTo"
  - "距离"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-23"
  testedAt: "2026-07-23"
  testEnvironment: "Node.js 22.16 离线语法检查（不是 Screeps Console 或官方服务器）"
  testResult: "文中 JavaScript 示例通过语法检查；真实路径、移动结算和下一 tick 动作仍待 Screeps 环境验证。"
featured: false
---

`ERR_NOT_IN_RANGE` 的值是 `-9`。对 Creep 动作来说，它表示目标存在，但 Creep 还没有进入该方法要求的距离。

最常用的处理方式不是反复调用动作，而是：

```text
本 tick 调用动作
→ 返回 ERR_NOT_IN_RANGE
→ 调用 moveTo() 安排移动
→ 下一 tick 重新读取对象
→ 再次调用原动作
```

同时要检查 `moveTo()` 自己的返回值。动作返回 `-9` 只说明距离不足，不代表路径一定存在，也不代表 Creep 当前能够移动。

## 先确认：这个 `-9` 来自哪个方法

不要只看 Console 中的 `-9`。先把具体方法的返回值保存下来：

```js
const harvestResult = creep.harvest(source);
console.log('harvest result:', harvestResult);
```

同一个常量可能由不同 API 返回，但处理方式不完全相同。

本文主要处理 **Creep 动作**，例如：

- `harvest()`
- `withdraw()`
- `transfer()`
- `build()`
- `repair()`
- `upgradeController()`
- `attack()`
- `heal()`

如果 `ERR_NOT_IN_RANGE` 来自 Link、Observer、Nuker 等建筑方法，建筑本身不能调用 `moveTo()`。这类情况应回到对应 API，检查同房间限制、房间距离或最大作用范围。

## 常见 Creep 动作需要多远

不同动作的有效范围不同。不能把所有动作都写成“必须与目标相邻”。

| 动作 | 可执行距离 | `moveTo()` 建议 |
|---|---:|---|
| `harvest()` | 范围 1 | `{ range: 1 }` |
| `withdraw()` | 范围 1 | `{ range: 1 }` |
| `transfer()` | 范围 1 | `{ range: 1 }` |
| `pickup()` | 同格或范围 1 | `{ range: 1 }` |
| `attack()` | 范围 1 | `{ range: 1 }` |
| `heal()` | 范围 1 | `{ range: 1 }` |
| `build()` | 范围 3 | `{ range: 3 }` |
| `repair()` | 范围 3 | `{ range: 3 }` |
| `upgradeController()` | 范围 3 | `{ range: 3 }` |
| `rangedAttack()` | 范围 3 | `{ range: 3 }` |
| `rangedHeal()` | 范围 3 | `{ range: 3 }` |

`moveTo()` 的 `range` 表示寻路可以在距离目标多少格时结束。它不会改变原动作的规则。

例如，`upgradeController()` 在范围 3 内就能执行。把寻路范围写成 1 通常仍能工作，但会让 Upgrader 比实际需要更靠近 Controller，也可能增加周围交通压力。

## 完整示例：采集时处理 `ERR_NOT_IN_RANGE`

下面的代码可以放进 `main` 模块。运行前请确认：

- 游戏中存在名为 `Harvester1` 的 Creep；
- Creep 有可用的 `WORK` 和 `MOVE`；
- Creep 所在房间存在可采集的 Source。

```js
function runHarvester(creep) {
  if (!creep || creep.spawning) {
    return;
  }

  const source = creep.pos.findClosestByPath(
    FIND_SOURCES_ACTIVE
  );

  if (!source) {
    return;
  }

  const harvestResult = creep.harvest(source);

  if (harvestResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source, {
      range: 1,
      reusePath: 10
    });

    if (
      moveResult !== OK
      && moveResult !== ERR_TIRED
    ) {
      console.log(
        `${creep.name} moveTo Source 失败：${moveResult}`
      );
    }

    return;
  }

  if (harvestResult !== OK) {
    console.log(
      `${creep.name} harvest 失败：${harvestResult}`
    );
  }
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;
  runHarvester(creep);
};
```

这段代码把两个问题分开记录：

1. `harvestResult`：采集动作为什么没有成功；
2. `moveResult`：Creep 为什么没有正常靠近 Source。

如果只记录其中一个返回值，很容易把距离问题和寻路问题混在一起。

## 为什么要等到下一 tick 再重试

Screeps 主循环读取的是当前 tick 开始时的游戏状态。调用 `moveTo()` 后，Creep 的位置不会在当前 JavaScript 执行过程中立刻改变。

下面这种写法不会让第二行使用“移动后的新位置”：

```js
creep.moveTo(source);
creep.harvest(source);
```

`harvest()` 仍然根据本 tick 开始时的位置判断距离。更清楚的写法是先尝试动作，距离不足时只安排移动，然后让下一 tick 的主循环再次调用动作。

## 范围 3 动作应该怎样写

以升级 Controller 为例：

```js
function runUpgrader(creep) {
  const controller = creep.room.controller;

  if (!controller || !controller.my) {
    return;
  }

  const upgradeResult =
    creep.upgradeController(controller);

  if (upgradeResult === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 3,
      reusePath: 10
    });

    if (
      moveResult !== OK
      && moveResult !== ERR_TIRED
    ) {
      console.log(
        `${creep.name} 前往 Controller 失败：${moveResult}`
      );
    }

    return;
  }

  if (upgradeResult !== OK) {
    console.log(
      `${creep.name} upgradeController 失败：${upgradeResult}`
    );
  }
}
```

同样的范围设置也适用于 `build()` 和 `repair()`。

## `moveTo()` 返回值怎样继续排查

当原动作返回 `ERR_NOT_IN_RANGE` 后，再看 `moveTo()` 的结果：

| `moveTo()` 返回值 | 当前含义 | 下一步 |
|---|---|---|
| `OK` | 移动命令已被接受 | 下一 tick 再调用原动作 |
| `ERR_TIRED` | Creep 当前有 fatigue | 等待恢复，并检查 MOVE 配比 |
| `ERR_NO_PATH` | 没有找到可用路径 | 检查目标、障碍、出口和寻路选项 |
| `ERR_NO_BODYPART` | 没有可用的 MOVE | 检查身体部件是否缺失或已损坏 |
| `ERR_INVALID_TARGET` | 传给 `moveTo()` 的目标无效 | 检查目标是否为 `null` 或错误对象 |
| `ERR_NOT_FOUND` | 开启 `noPathFinding`，但没有可复用路径 | 允许重新寻路或调整缓存逻辑 |

`moveTo()` 返回 `OK` 只表示命令被接受，不表示 Creep 已经到达目标。实际位置和动作结果需要在后续 tick 重新读取。

## 已经在范围内，动作为什么仍然失败

可以先检查当前位置：

```js
const range = creep.pos.getRangeTo(target);
const isAdjacent = creep.pos.isNearTo(target);
const canWorkAtRange3 =
  creep.pos.inRangeTo(target, 3);
```

如果 Creep 已经满足距离要求，但动作没有返回 `OK`，继续移动通常没有意义。应检查该 API 的其他前置条件，例如：

- Creep 没有需要的有效身体部件；
- Creep 没有携带 Energy；
- 目标资源已经为空；
- 目标 Store 已满；
- 目标类型不适用于当前动作；
- 对象不属于自己；
- Creep 仍处于生成状态。

`ERR_NOT_IN_RANGE` 只回答“距离是否足够”，不能代替完整的返回值排查。

## 常见错误

### 目标不存在时直接调用动作

查找方法可能返回 `null`，数组也可能为空。调用动作前先判断目标是否存在。

### 把所有动作都设置成 `range: 1`

这不会让范围 3 动作失效，但会让 Creep 走得过近。`build()`、`repair()` 和 `upgradeController()` 通常应使用 `range: 3`。

### 对不可站立目标使用 `range: 0`

Source、Controller、Construction Site 和多数 Structure 占据自己的坐标。Creep 不需要站到目标同一格，应使用该动作允许的距离。

### 只检查动作结果，不检查移动结果

原动作的 `-9` 解决后，Creep 仍可能因为 `ERR_NO_PATH`、fatigue 或缺少 `MOVE` 而无法接近目标。

### 其他错误也继续调用 `moveTo()`

当动作返回资源不足、目标无效或身体部件不足时，继续移动不能修复问题。只在确实得到 `ERR_NOT_IN_RANGE` 时进入移动分支。

### 每个 tick 输出成功日志

长期输出 `OK` 或正常移动状态会快速淹没 Console。只记录异常结果，或为诊断日志增加限频。

## 适用边界与验证状态

本文适用于 Creep 调用动作时返回 `ERR_NOT_IN_RANGE` 的排查，不覆盖：

- PathFinder 路网和 CostMatrix 设计；
- 多 Creep 交通协调；
- 跨房间路线缓存；
- Link、Observer、Nuker 等建筑方法的完整范围规则；
- Power Creep 的全部技能范围；
- 每个动作的所有错误码。

文中 API 名称、基础距离和 tick 规则已按官方文档核对。JavaScript 示例已完成 Node.js 离线语法检查，但尚未在 Screeps Console 或真实主循环中验证。实际路径和移动结果会受到房间地形、障碍、fatigue 与其他 Creep 的影响。

## 相关站内内容

- [Screeps 错误码查询](/screeps-errors)
- [moveTo() 不移动怎么排查](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [第一次让 Creep 移动并采集](/blog/screeps-first-creep-harvest)
- [如何自动升级 Controller](/blog/screeps-upgrade-controller)

## 官方资料

- [Error Codes](https://docs.screeps.com/api/#Constants-Error-Codes)
- [Creep API](https://docs.screeps.com/api/#Creep)
- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [RoomPosition API](https://docs.screeps.com/api/#RoomPosition)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Simultaneous execution of creep actions](https://docs.screeps.com/simultaneous-actions.html)

资料核对日期：2026-07-23。真实动作与移动仍待 Screeps 环境验证。
