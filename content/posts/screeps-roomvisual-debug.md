---
title: "RoomVisual 怎么画文字、圆和连线辅助调试"
description: "用 room.visual.text、circle 和 line 标出 Creep 状态、目标与移动关系，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps RoomVisual"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

如果只复制一行 API 调用，很难知道失败发生在哪个前提。本文的范围是：用 room.visual.text、circle 和 line 标出 Creep 状态、目标与移动关系。

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

本文不包含自动化大系统、收益或战斗效果承诺。JavaScript 语法检查通过，游戏行为待 Screeps 环境验证。

## 站内学习路径

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [RoomVisual API](https://docs.screeps.com/api/#RoomVisual)
- [Room.visual API](https://docs.screeps.com/api/#Room-visual)

