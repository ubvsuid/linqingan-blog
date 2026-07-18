
---
title: "Screeps 全局缓存为什么会失效"
description: "把可重建数据放入模块全局变量，并在全局重置或房间变化后识别失效并安全重建。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "全局缓存"
  - "性能"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


本文把可重建数据放入模块全局变量，并在全局重置或房间变化后安全重建。

## 先给结论

模块全局变量只适合保存可以重建的缓存。全局重置后它会消失，因此示例会在缓存为空或房间条件变化时重新生成。

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

