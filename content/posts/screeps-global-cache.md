---
title: "Screeps 全局缓存为什么会失效"
description: "把可重建数据放入模块全局变量，并在全局重置或房间变化后安全重建，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps global cache"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文不搭建大型框架，只把一个容易误解的工程问题说清楚：把可重建数据放入模块全局变量，并在全局重置或房间变化后安全重建。

## 先给结论

Memory 保存必须跨重置的数据；RawMemory segments 保存额外字符串。本文只处理可丢失的 heap 缓存。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

## 官方规则

- 模块顶层变量可在同一运行时的多个 tick 间复用。
- 全局运行时可能重置，代码不能假设缓存永远存在。
- Game 对象每 tick 重建，不应把 live RoomObject 长期缓存后跨 tick 直接使用。

## 最小完整示例

### `main` 模块

```js
let sourceIdCache;

function getSourceIds(room) {
  if (
    !sourceIdCache
    || sourceIdCache.roomName !== room.name
  ) {
    sourceIdCache = {
      roomName: room.name,
      ids: room.find(FIND_SOURCES).map(source => source.id)
    };
  }

  return sourceIdCache.ids;
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const sourceIds = getSourceIds(room);
  const sources = sourceIds
    .map(id => Game.getObjectById(id))
    .filter(source => source !== null);

  console.log('visible sources:', sources.length);
};
```

## 检查顺序

1. 缓存不存在时重建。
2. 只缓存 ID 而不是 live Source 对象。
3. 每 tick 用 Game.getObjectById 恢复对象并过滤 null。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间代码](/blog/screeps-first-room-code)

## 官方资料

- [Global Objects](https://docs.screeps.com/global-objects.html)
- [Understanding game loop](https://docs.screeps.com/game-loop.html)

