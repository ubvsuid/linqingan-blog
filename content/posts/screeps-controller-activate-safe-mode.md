---
title: "Screeps Safe Mode 怎么开启：activateSafeMode() 返回值排查"
description: "用一次性请求代码开启 Screeps Safe Mode，并按 ERR_NOT_OWNER、ERR_BUSY、ERR_NOT_ENOUGH_RESOURCES 和 ERR_TIRED 排查失败原因。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Safe Mode"
  - "Controller"
  - "防御"
  - "activateSafeMode"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---

需要开启 Safe Mode 时，代码必须先找到自己的 Controller，调用 `activateSafeMode()`，再检查返回值。可用激活次数、其他房间的状态、冷却和 `upgradeBlocked` 都可能让请求失败。

本文只解决一次激活请求：怎样读取状态、怎样调用 API，以及失败后按什么顺序排查。自动威胁评分、Tower 集火、Rampart 和防御 Creep 不在本文范围内。

## Safe Mode 不会替 Tower 主动攻击

Safe Mode 会限制敌对单位在房间内执行官方效果表列出的动作，但不会替你选择目标或消灭敌人。日常主动防御仍需要 Tower、Rampart 或防御 Creep。

如果当前问题是 Tower 建好后没有开火，先看[怎样让 Tower 自动攻击非己方 Creep](/blog/screeps-tower-auto-attack-hostiles)。那篇处理 `tower.attack()`；本文处理 Controller 的 `activateSafeMode()`，两者不是同一个动作。

官方 Defense 文档把 Safe Mode 视为其他防御失效后的最后手段。同一 shard 同时只能有一个房间处于 Safe Mode，因此不要把“出现任意非己方 Creep”直接写成无条件激活规则。

## 调用前先读取 Controller 状态

把 `W1N1` 换成自己的房间名。下面代码可以在 Console 中执行，只读取状态，不会开启 Safe Mode：

```javascript
const room = Game.rooms['W1N1'];

if (!room || !room.controller) {
  console.log('没有找到可见房间或 Controller');
} else {
  const controller = room.controller;

  console.log('是否属于自己：' + controller.my);
  console.log('剩余激活次数：' + controller.safeModeAvailable);
  console.log('当前 Safe Mode：' + controller.safeMode);
  console.log('冷却剩余：' + controller.safeModeCooldown);
  console.log('升级阻塞：' + controller.upgradeBlocked);
}
```

`safeMode` 表示当前 Safe Mode 剩余 tick；未开启时可以是 `undefined`。`safeModeCooldown` 在没有冷却时也可以是 `undefined`。这些值要从自己的游戏环境读取。

如果还不熟悉 Controller，可以先阅读[怎样让 Creep 持续升级 Controller](/blog/screeps-upgrade-controller)。升级 Controller 和激活 Safe Mode 使用不同 API。

## 最小激活调用

确认房间名与 Controller 后，可以在 Console 中执行一次：

```javascript
const room = Game.rooms['W1N1'];

if (room && room.controller) {
  const result = room.controller.activateSafeMode();
  console.log('activateSafeMode 返回值：' + result);
}
```

`OK` 只表示激活操作已成功安排。仍应查看目标房间的 `controller.safeMode`，确认当前状态。

## 四类失败返回值分别查什么

### ERR_NOT_OWNER

Controller 不属于自己。检查房间名，并确认 `controller.my` 为真。

### ERR_BUSY

另一个房间已经处于 Safe Mode。这里的“忙碌”不是 JavaScript 正在执行，而是同一时间已有房间占用了 Safe Mode。

### ERR_NOT_ENOUGH_RESOURCES

Controller 没有可用激活次数。检查 `controller.safeModeAvailable`。不要在主循环中忽略这个返回值并持续重试。

### ERR_TIRED

当前官方 API 给出三类原因：

- 上一次 Safe Mode 仍在冷却；
- Controller 存在 `upgradeBlocked`；
- Controller 的降级状态达到 API 描述的限制条件。

先读取 `safeModeCooldown`、`upgradeBlocked` 和 Controller 当前状态，再决定是否重试。通用常量也可以在站内的[Screeps 错误码查询页](/screeps-errors)核对。

## 在主循环中处理一次性请求

如果不想直接在 Console 调用 API，可以先写入一个自定义 Memory 字段：

```javascript
Memory.safeModeRequest = 'W1N1';
```

`safeModeRequest` 不是 Screeps 内置字段，只是这段示例使用的一次性请求。把下面逻辑合并进已有 `main` 模块，不要重复定义第二个 `module.exports.loop`。

```javascript
module.exports.loop = function () {
  const roomName = Memory.safeModeRequest;

  if (!roomName) {
    return;
  }

  const room = Game.rooms[roomName];

  if (!room || !room.controller) {
    console.log('Safe Mode 请求失败：房间不可见或没有 Controller');
    delete Memory.safeModeRequest;
    return;
  }

  const controller = room.controller;

  if (!controller.my) {
    console.log('Safe Mode 请求失败：Controller 不属于自己');
    delete Memory.safeModeRequest;
    return;
  }

  if (controller.safeMode) {
    console.log('目标房间已经处于 Safe Mode');
    delete Memory.safeModeRequest;
    return;
  }

  const result = controller.activateSafeMode();
  console.log('activateSafeMode 返回值：' + result);

  delete Memory.safeModeRequest;
};
```

无论调用成功还是失败，请求都会被删除，因此不会每个 tick 重复执行。删除请求不等于解决了失败原因：如果返回错误，应先检查状态，再由玩家明确写入新的请求。

已有房间逻辑时，可以参考[第一份房间基础代码](/blog/screeps-first-room-code)的主循环结构，把这段请求处理接入现有代码，而不是覆盖角色行为。

## 按真实调试顺序检查

1. `Game.rooms[roomName]` 是否存在，目标房间当前是否可见。
2. `room.controller` 是否存在。
3. `controller.my` 是否为真。
4. `controller.safeMode` 是否已经生效。
5. `safeModeAvailable`、`safeModeCooldown` 和 `upgradeBlocked` 当前是什么。
6. `activateSafeMode()` 的真实返回值是什么。
7. 是否有另一个房间已经处于 Safe Mode。

## 适用范围

这段代码没有分析敌人身体部件、入侵方向、Rampart 状态、Tower Energy 或关键建筑风险，也没有自动消费激活次数。接入自动防御前，需要单独设计触发条件，并在自己的房间环境验证。

## 官方参考资料

- [Screeps API Reference：StructureController.activateSafeMode](https://docs.screeps.com/api/#StructureController.activateSafeMode)
- [Screeps Documentation：Defending your room](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-18。代码仍需在 Screeps 环境验证。
