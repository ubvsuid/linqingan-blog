---
title: "getRangeTo、inRangeTo、isNearTo 有什么区别"
description: "按需要精确距离、范围布尔值或相邻判断选择 RoomPosition 方法，按返回值和位置条件给出最小排查代码。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Screeps getRangeTo inRangeTo isNearTo"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

画面上“单位没走”只是结果，不能直接说明原因。本文把范围限制在：按需要精确距离、范围布尔值或相邻判断选择 RoomPosition 方法。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。本文只判断位置关系，不调用寻路算法，也不替代 ERR_NOT_IN_RANGE 排错。

## 官方规则中的关键点

- getRangeTo 返回 Chebyshev 距离数值。
- inRangeTo 判断距离是否不超过给定范围。
- isNearTo 只判断是否相邻，等价于范围 1 的常见判断。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  if (!creep) {
    return;
  }

  const controller = creep.room.controller;
  if (!controller) {
    return;
  }

  const range = creep.pos.getRangeTo(controller);
  const canUpgradeByRange = creep.pos.inRangeTo(controller, 3);
  const isAdjacent = creep.pos.isNearTo(controller);

  console.log({
    range,
    canUpgradeByRange,
    isAdjacent
  });
};
```

## 排查顺序

1. 两个位置对象都存在。
2. 需要数值时使用 getRangeTo。
3. 升级范围判断与相邻判断不混用。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文不提供完整交通系统、自动布局或 CPU 优化结论。没有真实环境材料，路径与移动效果待 Screeps 环境验证。

## 相关站内内容

- [第一次移动与采集](/blog/screeps-first-creep-harvest)
- [自动升级 Controller](/blog/screeps-upgrade-controller)
- [Screeps 术语表](https://www.linqingan.com/glossary)

## 官方资料

- [RoomPosition API](https://docs.screeps.com/api/#RoomPosition)
- [RoomPosition.getRangeTo API](https://docs.screeps.com/api/#RoomPosition.getRangeTo)

