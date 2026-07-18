---
title: "Creep 为什么走得慢：fatigue 与 MOVE 配比"
description: "读取 fatigue 和有效身体部件，判断负载、地形与 MOVE 数量是否让移动变慢，按返回值和位置条件给出最小排查代码。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Creep Body"
  - "移动"
  - "疲劳"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Creep 有 `MOVE` 部件却走得很慢时，先读取 `fatigue`。负载、地形和有效 `MOVE` 数量共同决定疲劳积累与恢复速度。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。身体部件页解释 MOVE 的基本作用；本文只解释移动疲劳的观察与配比判断。

## 官方规则中的关键点

- Creep.fatigue 大于 0 时不能执行有效移动。
- MOVE 部件会在每 tick 减少 fatigue。
- 平地、沼泽和负载会影响移动产生的疲劳。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;
  const spawn = Game.spawns.Spawn1;
  if (!creep || !spawn) {
    return;
  }

  const activeMove = creep.getActiveBodyparts(MOVE);
  const carried = creep.store.getUsedCapacity();

  console.log({
    fatigue: creep.fatigue,
    activeMove,
    carried,
    bodyLength: creep.body.length
  });

  if (creep.fatigue === 0 && activeMove > 0) {
    const result = creep.moveTo(spawn);
    console.log('moveTo result:', result);
  }
};
```

## 排查顺序

1. 读取 fatigue 而不是猜测停顿原因。
2. 只统计 active MOVE。
3. 记录携带量和 body 长度作为环境信息。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文只读取 `fatigue`、负载和有效 `MOVE` 部件解释移动变慢，不给出适用于所有地形的固定身体比例。

## 相关站内内容

- [Creep 身体部件基础](/blog/screeps-creep-body-parts)
- [第一次移动与采集](/blog/screeps-first-creep-harvest)
- [Creep 角色分工](/blog/screeps-creep-roles)

## 官方资料

- [Creeps：Movement](https://docs.screeps.com/creeps.html)
- [Creep.fatigue API](https://docs.screeps.com/api/#Creep-fatigue)

