---
title: "Game.getObjectById() 怎么配合 Memory 保存目标"
description: "把对象 ID 存入 Memory，并在每个 tick 重新取得当前游戏对象，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Game.getObjectById"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：把对象 ID 存入 Memory，并在每个 tick 重新取得当前游戏对象。

## 先给判断

Memory 入门只提醒不要保存完整对象；本文专门处理首次选择、ID 失效和重新选择。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需…1346 tokens truncated…码。  
**Slug：** `screeps-moveto-not-moving`  
**分类：** 错误排查  
**主关键词：** Screeps moveTo 不移动

画面上“单位没走”只是结果，不能直接说明原因。本文把范围限制在：按目标、MOVE 部件、fatigue、返回值和路径条件排查 Creep 原地不动。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。新手采集页只演示距离太远时调用 moveTo；本文只解决 moveTo 已调用但单位不动。

## 官方规则中的关键点

- Creep.fatigue 大于 0 时不能移动。
- 没有有效 MOVE 部件会影响移动能力。
- moveTo 返回错误常量时必须先处理返回值，而不是只看画面。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Scout1;
  const target = Game.flags.MoveTarget;

  if (!creep || !target) {
    return;
  }

  if (creep.getActiveBodyparts(MOVE) === 0) {
    console.log('Scout1 没有可用的 MOVE 部件');
    return;
  }

  if (creep.fatigue > 0) {
    console.log('Scout1 fatigue:', creep.fatigue);
    return;
  }

  const result = creep.moveTo(target, {
    reusePath: 5,
    visualizePathStyle: { stroke: '#ffffff' }
  });
  console.log('moveTo result:', result);
};
```

## 排查顺序

1. 目标 Flag 与 Creep 都检查。
2. 检查可用 MOVE 部件与 fatigue。
3. 保存 moveTo 返回值并画出计划路径。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文不提供完整交通系统、自动布局或 CPU 优化结论。没有真实环境材料，路径与移动效果待 Screeps 环境验证。

## 相关站内内容

- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [第一次移动与采集](/blog/screeps-first-creep-harvest)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [Creeps：Movement](https://docs.screeps.com/creeps.html)

