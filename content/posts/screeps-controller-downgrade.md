---
title: "Controller 快降级了怎么办"
description: "读取 ticksToDowngrade，在低于自定阈值时让有 Energy 的 Upgrader 优先补充升级，附完整检查顺序、最小代码和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Screeps Controller 降级"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；房间、对象、资源、阈值和一次性请求需要按实际环境确认，运行行为待 Screeps 环境验证。

本文处理的不是完整房间 AI，而是一个能明确验证的问题：读取 ticksToDowngrade，在低于自定阈值时让有 Energy 的 Upgrader 优先补充升级。

## 先确认边界

自动升级文章讲日常 working 流程；本文只处理降级风险监控和紧急优先级。第一步始终是确认目标属于正确房间、对象存在，并保存关键动作返回值。

## 规则依据

- 己方 Controller 的 ticksToDowngrade 表示距离降级的 tick 数。
- upgradeController 会增加降级计时并提供控制点。
- 阈值是玩家策略，不是官方固定推荐值。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  const upgrader = Game.creeps.Upgrader1;
  if (!room || !upgrader) {
    return;
  }

  const controller = room.controller;
  if (!controller || !controller.my) {
    return;
  }

  const emergencyThreshold = 5000;
  if (
    controller.ticksToDowngrade >= emergencyThreshold
    || upgrader.store.getUsedCapacity(RESOURCE_ENERGY) === 0
  ) {
    return;
  }

  const result = upgrader.upgradeController(controller);
  if (result === ERR_NOT_IN_RANGE) {
    upgrader.moveTo(controller);
  } else if (result !== OK) {
    console.log('upgrade result:', result);
  }
};
```

## 按这个顺序检查

1. 房间、Creep 和己方 Controller 均检查。
2. 阈值明确标记为自定义策略。
3. 升级者无 Energy 时不调用动作。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

示例只建立最小决策，不包含跨房间调度、战斗策略或性能数据。资料已核对，运行效果待 Screeps 环境验证。

## 相关站内内容

- [自动升级 Controller](/blog/screeps-upgrade-controller)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [Control](https://docs.screeps.com/control.html)
- [StructureController API](https://docs.screeps.com/api/#StructureController)

