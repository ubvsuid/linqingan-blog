---
title: "StructureController.activateSafeMode() 怎么安全开启 Safe Mode"
description: "解释可用激活次数、同一shard单房间限制、safeModeCooldown、upgradeBlocked与全部返回码，并用一次性Memory请求避免自动消耗Safe Mode。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Safe Mode"
  - "Controller"
  - "防御"
  - "运行安全"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Controller状态与一次性请求判断，不是 Screeps 官方服务器）"
  testResult: "房间不可见、非己方Controller、已开启、激活次数不足、等待状态、upgradeBlocked、降级限制和可提交场景通过。"
featured: false
---

`StructureController.activateSafeMode()` 会消耗一次可用激活次数，为己方房间安排 Safe Mode。它是高影响防御操作，不应该因为“发现一个非己方 Creep”就在主循环中自动调用。

本文只解决一个问题：怎样通过一次性请求开启指定房间的 Safe Mode，并在调用前核对 Controller 状态、激活次数和返回值。

## Safe Mode 能做什么，不能做什么

Safe Mode 会限制其他玩家在房间内执行会影响你 Creep 或对象的多种动作，但它不会：

- 自动让 Tower 选择目标；
- 自动修复 Rampart；
- 清除房间里的敌对单位；
- 替代防御 Creep；
- 修复错误的房间布局；
- 保证所有跨房间威胁已经解除。

官方防御文档把它作为重要的最后保护手段。一次激活会真实消耗 `safeModeAvailable`，所以触发条件必须由玩家或独立防御系统明确决定。

## 调用前先做只读检查

下面代码适合在 Console 中执行，不会开启 Safe Mode：

```js
const room = Game.rooms.W1N1;
const controller = room ? room.controller : null;

if (!controller) {
  console.log('房间不可见或没有 Controller');
} else {
  console.log({
    roomName: room.name,
    my: controller.my,
    safeMode: controller.safeMode,
    safeModeAvailable: controller.safeModeAvailable,
    safeModeCooldown: controller.safeModeCooldown,
    upgradeBlocked: controller.upgradeBlocked,
    ticksToDowngrade: controller.ticksToDowngrade
  });
}
```

需要重点区分：

| 属性 | 含义 |
|---|---|
| `safeMode` | 当前 Safe Mode 剩余 tick，未开启时为 `undefined` |
| `safeModeAvailable` | 可用激活次数 |
| `safeModeCooldown` | 新激活仍被阻止的 tick 数，未生效时为 `undefined` |
| `upgradeBlocked` | Controller 因攻击暂时无法升级，Safe Mode 同样不可用 |
| `ticksToDowngrade` | Controller 距离降级的剩余 tick |

只读检查不能替代真正的返回码，但可以避免明显无效的调用。

## 一次性请求结构

在 Console 中明确写入：

```js
Memory.safeModeRequest = {
  enabled: true,
  roomName: 'W1N1',
  confirmation: 'ACTIVATE_SAFE_MODE'
};
```

`Memory.safeModeRequest` 是本文自定义字段，不是官方API。

确认词只证明这次请求经过显式操作，不证明目标房间真的应该开启。执行前仍应查看当前敌情和关键建筑风险。

## 可离线测试的状态判断

```js
function evaluateSafeModeState(input) {
  const {
    roomVisible,
    hasController,
    owned,
    safeMode,
    safeModeAvailable,
    safeModeCooldown,
    upgradeBlocked,
    ticksToDowngrade,
    downgradeLimit
  } = input;

  if (!roomVisible || !hasController) {
    return { ready: false, reason: 'controller-missing' };
  }

  if (!owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (Number.isFinite(safeMode) && safeMode > 0) {
    return { ready: false, reason: 'already-active' };
  }

  if (!Number.isInteger(safeModeAvailable) || safeModeAvailable <= 0) {
    return { ready: false, reason: 'no-activation' };
  }

  if (Number.isFinite(safeModeCooldown) && safeModeCooldown > 0) {
    return { ready: false, reason: 'activation-waiting' };
  }

  if (Number.isFinite(upgradeBlocked) && upgradeBlocked > 0) {
    return { ready: false, reason: 'upgrade-blocked' };
  }

  if (
    Number.isFinite(ticksToDowngrade)
    && Number.isFinite(downgradeLimit)
    && ticksToDowngrade <= downgradeLimit
  ) {
    return { ready: false, reason: 'downgrade-limit' };
  }

  return { ready: true, reason: 'ready' };
}
```

官方 `ERR_TIRED` 还包含 Controller 已降级达到其限制条件的情况。不同RCL的完整阈值应以官方API返回值为最终判断，本文不在业务代码中复制一份容易失效的等级表。

## 完整示例

代码放入现有 `main` 模块，不要覆盖其他主循环逻辑。

```js
function handleSafeModeRequest() {
  const request = Memory.safeModeRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  if (
    typeof request.roomName !== 'string'
    || request.confirmation !== 'ACTIVATE_SAFE_MODE'
  ) {
    delete Memory.safeModeRequest;
    return;
  }

  const room = Game.rooms[request.roomName];
  const controller = room ? room.controller : null;

  if (!controller || controller.my !== true) {
    delete Memory.safeModeRequest;
    return;
  }

  const state = {
    safeMode: controller.safeMode,
    safeModeAvailable: controller.safeModeAvailable,
    safeModeCooldown: controller.safeModeCooldown,
    upgradeBlocked: controller.upgradeBlocked,
    ticksToDowngrade: controller.ticksToDowngrade
  };

  if (
    (Number.isFinite(controller.safeMode)
      && controller.safeMode > 0)
    || !Number.isInteger(controller.safeModeAvailable)
    || controller.safeModeAvailable <= 0
    || (Number.isFinite(controller.safeModeCooldown)
      && controller.safeModeCooldown > 0)
    || (Number.isFinite(controller.upgradeBlocked)
      && controller.upgradeBlocked > 0)
  ) {
    request.enabled = false;
    request.status = 'precheck-failed';
    request.checkedAt = Game.time;
    request.controllerState = state;
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.controllerState = state;

  const result = controller.activateSafeMode();

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'safe-mode-result',
    roomName: room.name,
    safeModeAvailableBefore: state.safeModeAvailable,
    result
  });
}

module.exports.loop = function () {
  handleSafeModeRequest();
};
```

## 为什么调用前关闭请求

Safe Mode 会真实消耗激活次数。示例在调用前执行：

```js
request.enabled = false;
```

即使API返回错误，下一 tick 也不会自动重试。失败后需要检查 Controller 状态和返回值，再由玩家明确重新开启请求。

这比在调用后直接 `delete Memory.safeModeRequest` 更便于保存失败证据。请求对象会保留：

- 提交房间；
- 提交 tick；
- 调用前状态；
- 返回值；
- 最终状态。

确认不再需要后再由维护逻辑清理。

## 全部返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 操作已安排 | 下一 tick 查看 `controller.safeMode` |
| `ERR_NOT_OWNER` | Controller 不属于自己 | 房间名和 `controller.my` |
| `ERR_BUSY` | 同一 shard 已有其他房间处于 Safe Mode | 检查全部己方房间 |
| `ERR_NOT_ENOUGH_RESOURCES` | 没有可用激活次数 | `safeModeAvailable` |
| `ERR_TIRED` | 等待状态、`upgradeBlocked` 或降级限制阻止激活 | 三类状态逐项排查 |

`OK` 不代表当前代码后面的读取已经反映新状态。应在下一 tick 重新取得 Controller。

## 怎样检查是否有其他房间已经开启

```js
function getActiveSafeModeRooms() {
  return Object.values(Game.rooms)
    .filter(room =>
      room.controller
      && room.controller.my
      && Number.isFinite(room.controller.safeMode)
      && room.controller.safeMode > 0
    )
    .map(room => room.name);
}
```

这只能检查当前可见的己方房间。正常情况下己方结构会提供视野，但仍应以 `ERR_BUSY` 为最终依据。

## 下一 tick 怎样核对

```js
const room = Game.rooms.W1N1;
const controller = room ? room.controller : null;

console.log({
  safeMode: controller?.safeMode,
  safeModeAvailable: controller?.safeModeAvailable
});
```

预期可以观察到 Safe Mode 剩余 tick，并看到可用激活次数变化。没有真实账号结果时，不能把一次离线判断写成官方服务器实测。

## 离线模拟结果

构建检查覆盖：

1. 房间不可见或没有 Controller；
2. Controller 不属于自己；
3. 已经处于 Safe Mode；
4. 激活次数为0；
5. `safeModeCooldown` 仍有剩余；
6. `upgradeBlocked` 仍有剩余；
7. 模拟降级限制；
8. 基础状态满足时允许提交。

离线模拟没有调用真实 `activateSafeMode()`，也没有验证同一 shard 的其他房间状态。

## 常见误区

### 看见敌对单位就自动开启

侦察者、路过单位和真正攻击关键建筑的威胁等级不同，应由独立防御系统判断。

### 把 `ERR_BUSY` 理解为 Controller 正在工作

它表示另一个房间已经处于 Safe Mode。

### 失败后每 tick 重试

可能在等待状态结束后意外消耗一次激活次数。

### 只看 `safeModeAvailable`

仍可能被同 shard 单房间限制、`safeModeCooldown`、`upgradeBlocked` 或降级状态阻止。

### 返回 `OK` 后同 tick 宣布已生效

应在下一 tick 重新读取 Controller。

## 适用边界

本文没有实现：

- 自动威胁评分；
- Tower 与防御 Creep 调度；
- Rampart 风险计算；
- 关键建筑价值模型；
- 多房间 Safe Mode 选择；
- 自动生成激活次数；
- Safe Mode 到期后的恢复计划。

JavaScript语法和状态判断离线模拟已经通过。真实激活、跨房间限制和连续防御行为仍待 Screeps 环境验证。

## 相关站内内容

- [Controller 为什么会降级](/blog/screeps-controller-downgrade)
- [Tower 怎么自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Rampart 怎么设置公开状态](/blog/screeps-rampart-set-public)
- [Game.notify() 怎么发送提醒](/blog/screeps-game-notify)
- [查询 Screeps 错误码](/screeps-errors)
- [进入 Controller 与房间控制模块](/knowledge/controller-control)

## 官方资料

- [StructureController.activateSafeMode API](https://docs.screeps.com/api/#StructureController.activateSafeMode)
- [Defending your room](https://docs.screeps.com/defense.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线状态判断已通过；真实 Safe Mode 激活仍待环境验证。
