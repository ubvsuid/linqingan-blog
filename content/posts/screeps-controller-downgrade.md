---
title: "Controller 快降级了怎么办"
description: "监控 Controller.ticksToDowngrade，并在低于房间策略阈值时优先安排有 Energy 的 Upgrader。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Controller"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Controller 的 `ticksToDowngrade` 低于房间策略阈值时，可以临时提高升级优先级，避免日常任务把降级风险继续拖延。

## 先确认边界

自动升级文章讲日常 `working` 流程；这里改为监控 `ticksToDowngrade`，只有低于自定阈值时才提高升级优先级。

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

阈值是玩家策略，不是官方推荐值。示例只负责让一名有 Energy 的 Upgrader 应对当前房间的降级风险。

## 相关站内内容

- [自动升级 Controller](/blog/screeps-upgrade-controller)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [Control](https://docs.screeps.com/control.html)
- [StructureController API](https://docs.screeps.com/api/#StructureController)
