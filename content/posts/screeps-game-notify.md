---
title: "Game.notify() 怎么发送限频提醒"
description: "在 Controller 降级风险首次触发时调用 Game.notify()，并用 Memory 与 groupInterval 控制重复提醒。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Game API"
  - "通知"
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


本文在 Controller 降级风险首次触发时发送通知，并用 Memory 和 `groupInterval` 控制重复提醒。

## 先给结论

Console 适合当前调试；`Game.notify()` 用于把重要事件发送到账号通知渠道。示例只在 Controller 首次进入降级风险时触发，并用 Memory 防止重复提醒。

## 官方规则

- Game.notify 会把消息加入通知队列。
- 可选 groupInterval 用于合并一定时间内相同消息。
- 高频条件必须有状态或间隔控制，避免每 tick 重复通知。

## 最小完整示例

### `main` 模块

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  const controller = room ? room.controller : undefined;
  if (!controller || !controller.my) {
    return;
  }

  if (!Memory.alerts) {
    Memory.alerts = {};
  }

  const threshold = 5000;
  const lastTick = Memory.alerts.controllerDowngradeTick || 0;
  const shouldNotify =
    controller.ticksToDowngrade < threshold
    && Game.time - lastTick >= 5000;

  if (shouldNotify) {
    Game.notify(
      `${room.name} Controller ticksToDowngrade: ${controller.ticksToDowngrade}`,
      60
    );
    Memory.alerts.controllerDowngradeTick = Game.time;
  }
};
```

## 检查顺序

1. Room 与己方 Controller 检查。
2. 阈值与 tick 间隔标记为自定义。
3. 使用 Memory 与 groupInterval 双重限频。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [Controller 降级前置知识](/blog/screeps-upgrade-controller)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Game.notify API](https://docs.screeps.com/api/#Game.notify)
- [StructureController API](https://docs.screeps.com/api/#StructureController)

