---
title: "RoomVisual 怎么画文字、圆和连线辅助调试"
description: "用 room.visual.text、circle 和 line 标出 Creep 状态、目标与移动关系，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "RoomVisual"
  - "调试"
  - "可视化"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


RoomVisual 可以把调试信息直接画在房间视图上。下面分别用 `text()`、`circle()` 和 `line()` 标出 Creep 状态、目标位置与两者关系。

## 先核对这些前提

本文只做可视化调试，不改变 Creep 行为，也不声称 RoomVisual 会持久保存。

- Room.visual 是当前 Room 的 RoomVisual 对象。
- 视觉内容只保留一个 tick，需要每 tick 重新绘制。
- 绘制调用用于浏览器显示调试信息，不替代 API 返回值检查。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  if (!creep) {
    return;
  }

  const controller = creep.room.controller;

  creep.room.visual.text(
    `${creep.name}: ${creep.store.getUsedCapacity(RESOURCE_ENERGY)}E`,
    creep.pos.x,
    creep.pos.y - 0.8,
    { color: '#ffffff', font: 0.5 }
  );

  creep.room.visual.circle(creep.pos, {
    radius: 0.45,
    stroke: '#00ff88',
    fill: 'transparent'
  });

  if (controller) {
    creep.room.visual.line(creep.pos, controller.pos, {
      color: '#ffaa00',
      lineStyle: 'dashed'
    });
  }
};
```

## 排查顺序

1. Creep 与 Controller 分别检查。
2. 所有绘图都在当前 tick 执行。
3. 可视化不替代动作返回值。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文只用文字、圆和连线显示当前调试信息，不实现持久化日志或自动性能分析。

## 站内学习路径

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [RoomVisual API](https://docs.screeps.com/api/#RoomVisual)
- [Room.visual API](https://docs.screeps.com/api/#Room-visual)

