---
title: "Room.getEventLog() 怎么读取本 tick 事件"
description: "读取房间当前 tick 的事件数组，并按 EVENT_ATTACK 过滤和安全访问 event.data，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps Room.getEventLog"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文不搭建大型框架，只把一个容易误解的工程问题说清楚：读取房间当前 tick 的事件数组，并按 EVENT_ATTACK 过滤和安全访问 event.data。

## 先给结论

本文只处理当前 tick 的原始事件，不声称它会自动形成长期统计或战斗回放。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

## 官方规则

- Room.getEventLog 返回当前 tick 房间事件数组。
- 事件对象包含 event、objectId 和 data 等字段。
- 长期保存或汇总事件需要玩家另行设计 Memory 或外部存储。

## 最小完整示例

### `main` 模块

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const events = room.getEventLog();
  const attacks = events.filter(
    event => event.event === EVENT_ATTACK
  );

  for (const event of attacks) {
    const data = event.data || {};
    console.log({
      attackerId: event.objectId || null,
      targetId: data.targetId || null,
      attackType: data.attackType || null,
      damage: data.damage || 0
    });
  }
};
```

## 检查顺序

1. Room 存在后调用 getEventLog。
2. 按 EVENT_ATTACK 常量过滤。
3. event.data 和字段使用前给默认值。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [Tower 自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Memory 基础用法](/blog/screeps-memory-basics)

## 官方资料

- [Room.getEventLog API](https://docs.screeps.com/api/#Room.getEventLog)
- [Event constants](https://docs.screeps.com/api/#Constants-Event-Types)

