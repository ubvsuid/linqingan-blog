---
title: "Screeps moveTo() 不移动怎么排查"
description: "按目标、MOVE 部件、fatigue、返回值和路径条件，定位 Creep 调用 moveTo() 后仍不移动的原因。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "移动"
  - "错误排查"
  - "Creep API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`moveTo()` 被调用后 Creep 仍停在原地，应先保存返回值，再检查目标、有效 `MOVE` 部件、`fatigue` 和路径条件。

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

本文按目标、有效 `MOVE` 部件、`fatigue`、返回值和路径条件排查单只 Creep，不处理多人交通协调。

## 相关站内内容

- [Creep 身体部件](/blog/screeps-creep-body-parts)
- [第一次移动与采集](/blog/screeps-first-creep-harvest)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [Creeps：Movement](https://docs.screeps.com/creeps.html)
