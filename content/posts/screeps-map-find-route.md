---
title: "Game.map.findRoute() 怎么规划跨房间路线"
description: "用 Game.map.findRoute() 取得跨房间出口序列，并让 Creep 前往当前房间对应的第一个出口。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Game API"
  - "跨房间"
  - "寻路"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`Game.map.findRoute()` 返回跨房间路线中的出口序列，不会直接移动 Creep。代码需要读取第一段出口方向，再让 Creep 前往对应出口。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。CostMatrix 处理格子成本；本文只处理房间级路线和 ERR_NO_PATH。

## 官方规则中的关键点

- Game.map.findRoute 返回路线数组或 ERR_NO_PATH。
- 路线元素包含 exit 和下一房间名称。
- routeCallback 可以返回进入房间的成本或 Infinity。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
module.exports.loop = function () {
  const creep = Game.creeps.Scout1;
  const targetRoom = 'W8N3';
  if (!creep || creep.room.name === targetRoom) {
    return;
  }

  const route = Game.map.findRoute(creep.room.name, targetRoom, {
    routeCallback(roomName) {
      return roomName === 'W7N3' ? 5 : 1;
    }
  });

  if (route === ERR_NO_PATH || route.length === 0) {
    console.log('没有可用的跨房间路线');
    return;
  }

  const exits = creep.room.find(route[0].exit);
  const exit = creep.pos.findClosestByRange(exits);
  if (!exit) {
    return;
  }

  const result = creep.moveTo(exit);
  console.log('moveTo exit result:', result);
};
```

## 排查顺序

1. findRoute 返回值先区分错误常量和数组。
2. 只使用 route[0] 的当前出口。
3. 出口列表和最近位置均检查。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文只取得跨房间出口序列并前往当前房间的第一个出口，不负责危险房间评分或完整跨房寻路缓存。

## 相关站内内容

- [认识 Room](/blog/screeps-first-room)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [错误码索引](https://www.linqingan.com/screeps-errors)

## 官方资料

- [Game.map.findRoute API](https://docs.screeps.com/api/#Game-map.findRoute)
- [Game.map API](https://docs.screeps.com/api/#Game-map)
