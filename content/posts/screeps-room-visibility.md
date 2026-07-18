---
title: "Game.rooms 为什么没有某个房间"
description: "判断房间是否当前可见，并在 Game.rooms[roomName] 为 undefined 时安全退出，给出前提检查、完整示例和失败边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "视野"
  - "Game API"
  - "Room"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`Game.rooms` 只包含当前可见的房间。用房间名读取结果可能是 `undefined`，因此访问 Controller、结构或 Source 前必须先判空。

## 先核对这些前提

第一个房间页面帮助识别己方可见房间；Observer 页面负责主动观察。本文只解释可见性与 undefined。

- Game.rooms 只包含当前 tick 可见的 Room 对象。
- 己方 Creep、己方结构或其他视野来源可提供房间可见性。
- Memory.rooms 中有历史数据不代表当前存在 live Room 对象。

## 完整示例

代码放进 `main` 模块。房间、结构、资源和目标坐标必须改成自己的配置。

```js
module.exports.loop = function () {
  const roomName = 'W2N2';
  const room = Game.rooms[roomName];

  if (!room) {
    const remembered = Memory.rooms
      ? Memory.rooms[roomName]
      : undefined;

    console.log(
      roomName,
      '当前不可见，是否有历史 Memory：',
      Boolean(remembered)
    );
    return;
  }

  const controller = room.controller;
  console.log({
    roomName: room.name,
    hasController: Boolean(controller),
    controllerOwner: controller && controller.owner
      ? controller.owner.username
      : null
  });
};
```

## 排查顺序

1. Game.rooms 索引结果检查。
2. 历史 Memory 与当前 Room 对象分开。
3. controller 与 owner 逐层检查。
4. 保存动作返回值，并对照官方 API 的错误常量。
5. 一次性高影响动作必须保留显式请求开关。

## 边界和验证

本文只解释 `Game.rooms[roomName]` 为 `undefined` 时如何安全退出，不负责主动获取或长期保存房间视野。

## 站内学习路径

- [认识第一个房间](/blog/screeps-first-room)
- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Game.rooms API](https://docs.screeps.com/api/#Game-rooms)
- [Global Objects](https://docs.screeps.com/global-objects.html)

