---
title: "RoomVisual 怎么画文字、圆和连线辅助调试"
description: "用 RoomVisual 在房间中显示 Creep 状态、目标位置和移动关系，帮助定位任务选择与寻路问题。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "RoomVisual"
  - "运行诊断"
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


RoomVisual 可以把 Creep 当前状态、任务目标和移动关系直接画在房间视图上。看到“选错目标”“目标位置异常”或“移动方向不符合预期”时，`text()`、`circle()` 和 `line()` 能把代码里的对象关系变成一张每 tick 更新的调试图。

## 三种图形分别回答什么问题

- `text()` 显示名称、角色、Energy 或当前任务。
- `circle()` 圈出正在观察的 Creep 或目标位置。
- `line()` 连接 Creep 与目标，检查任务选择和移动关系。

绘图只负责显示，不会移动 Creep、修改目标或把数据永久保存。官方文档说明每次绘制只保留一个 tick，因此持续观察时必须在 `module.exports.loop` 中每 tick 重画。

## 在 main 中画出状态、目标和连线

示例读取 `Worker1`，用文字显示名称与 Energy，用圆圈标记当前位置，并把它与当前房间的 Controller 连起来。Creep 名称需要替换成自己的配置。

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

## 房间里没有出现图形时

1. 确认当前账号能看到目标房间；不可见房间也能用 `new RoomVisual(roomName)` 绘制，但必须写对房间名。
2. 检查坐标是否落在房间范围内。整数坐标位于格子中心，传入 `RoomPosition` 时要确认它属于预期房间。
3. 确认绘图代码每个 tick 都会执行；RoomVisual 数据不会跨 tick 保留。
4. 把 `text()`、`circle()`、`line()` 分开启用，定位是对象缺失、目标缺失还是样式颜色不明显。
5. RoomVisual 只显示调试信息，不会改变 Creep 的任务选择或寻路结果。
6. 若 CPU 或视觉数据量异常，减少每 tick 的文字数量和连线数量，并用 `RoomVisual.getSize()` 检查序列化数据大小。官方说明绘图没有额外 API CPU 费用，但序列化等代码执行仍有自然开销，且每个房间的视觉数据有大小限制。

## 这段调试图不会替你判断什么

示例只显示当前 tick 的对象关系，不保存历史轨迹，也不判断目标是否最优。要比较多个 tick 的变化，需要自行把必要字段写入 Memory 或外部日志；不要把 RoomVisual 当成持久化记录。

## 站内学习路径

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [RoomVisual API](https://docs.screeps.com/api/#RoomVisual)
- [Room.visual API](https://docs.screeps.com/api/#Room-visual)
