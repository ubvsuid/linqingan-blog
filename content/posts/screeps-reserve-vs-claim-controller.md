---
title: "reserveController() 和 claimController() 有什么区别"
description: "比较 reserveController() 与 claimController() 的用途，并根据临时预定或永久占领选择动作。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Controller"
  - "CLAIM"
  - "远程房间"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


远端中立 Controller 有两种不同目标：临时保留使用 `reserveController()`，永久占领使用 `claimController()`。两者都需要有效的 `CLAIM` 部件。

## 先确认边界

`reserveController()` 用于临时预定中立房间，`claimController()` 用于占领房间。选择动作前先确认目标 Controller 为中立，并检查 Creep 的有效 `CLAIM` 部件。

## 规则依据

- 两个方法都需要 CLAIM 身体部件且目标需相邻。
- claimController 会尝试把中立房间纳入控制，受 GCL 限制。
- reserveController 增加预定时间，不把房间变为己方已占领房间。

## 可放进 main 的示例

运行前请替换房间名、Creep 名称和策略阈值。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Claimer1;
  if (!creep || creep.getActiveBodyparts(CLAIM) === 0) {
    return;
  }

  const controller = creep.room.controller;
  if (!controller || controller.my) {
    return;
  }

  const mission = creep.memory.controllerMission;
  let result;

  if (mission === 'claim') {
    result = creep.claimController(controller);
  } else if (mission === 'reserve') {
    result = creep.reserveController(controller);
  } else {
    return;
  }

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  } else if (result !== OK) {
    console.log('controller action result:', result);
  }
};
```

## 按这个顺序检查

1. 检查有效 CLAIM 部件。
2. 任务值只允许 claim 或 reserve。
3. 保存两种动作共同的返回值。
4. 检查对象所有权、资源和距离。
5. 对照官方 API 处理非 `OK` 返回值，不用画面现象代替诊断。

## 限制

示例只比较两种 Controller 动作，不负责把 Creep 移动到远端房间，也不处理 GCL 规划或预定续期。

## 相关站内内容

- [Controller 升级基础](/blog/screeps-upgrade-controller)
- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [认识第一个房间](/blog/screeps-first-room)

## 官方资料

- [Control](https://docs.screeps.com/control.html)
- [Creep.claimController API](https://docs.screeps.com/api/#Creep.claimController)
- [Creep.reserveController API](https://docs.screeps.com/api/#Creep.reserveController)
