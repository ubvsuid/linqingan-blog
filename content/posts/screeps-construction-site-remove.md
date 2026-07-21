---
title: "ConstructionSite.remove() 怎么用：删除放错的 Screeps 工地"
description: "介绍 ConstructionSite.remove() 的安全用法：按坐标查找自己的工地、保存返回值，并避免误删其他工地或把完整建筑当成 Construction Site。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-21"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "Construction Site"
  - "remove"
  - "Room API"
  - "常见问题"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

工地坐标放错，最省事的处理不是让 Builder 建完再拆，而是在它仍是 Construction Site 时直接删除。

`ConstructionSite.remove()` 只针对工地对象。地图上已经完工的 Road、Extension 或其他 Structure，不再是 Construction Site，不能用本文的方法处理。

## 已知工地 ID 时，直接取得对象

每个 Construction Site 都有 `id`。已经从 Console 或代码中拿到 ID 时，可以这样执行：

```js
const site = Game.getObjectById('替换为工地ID');

if (!site) {
  console.log('没有取得对应工地，可能已经删除或房间不可见');
} else if (!site.my) {
  console.log('目标不是自己的工地');
} else {
  const result = site.remove();
  console.log('remove:', result);
}
```

这里先检查对象是否存在，再检查 `my`。不要直接写：

```js
Game.getObjectById('工地ID').remove();
```

当 `Game.getObjectById()` 返回 `null` 时，这种写法会因为读取 `null` 的方法而报错。

站内的[Game.getObjectById() 怎么配合 Memory 保存目标](/blog/screeps-game-get-object-by-id)详细解释了为什么对象需要在当前 tick 重新取得。

## 不知道 ID 时，按坐标找自己的工地

实际操作中，玩家往往更容易确定“哪个房间的哪一格放错了”。`Room.lookForAt()` 可以按类型读取指定坐标上的对象。

```js
const room = Game.rooms['W1N1'];

if (!room) {
  console.log('房间当前不可见');
} else {
  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    20,
    20
  );

  const site = sites.find(function (item) {
    return item.my;
  });

  if (!site) {
    console.log('该坐标没有自己的 Construction Site');
  } else {
    const result = site.remove();
    console.log('remove:', result);
  }
}
```

`LOOK_CONSTRUCTION_SITES` 会让 `lookForAt()` 只返回工地对象。代码再通过 `item.my` 限制为自己的工地，避免把“找到一个对象”误当成“可以删除的目标”。

## 放进主循环时使用一次性请求

删除工地不是每个 tick 都要执行的长期行为。直接把 `site.remove()` 固定写进主循环，目标消失后，代码仍会继续查找和输出。

下面的完整示例只在 `Memory.removeSiteRequest` 存在时执行一次：

```js
function handleRemoveSiteRequest() {
  const request = Memory.removeSiteRequest;

  if (!request) {
    return;
  }

  delete Memory.removeSiteRequest;

  const roomName = request.roomName;
  const x = request.x;
  const y = request.y;

  if (
    typeof roomName !== 'string' ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    x > 49 ||
    y < 0 ||
    y > 49
  ) {
    console.log('[remove-site] 请求参数不正确');
    return;
  }

  const room = Game.rooms[roomName];

  if (!room) {
    console.log(`[remove-site] 房间当前不可见：${roomName}`);
    return;
  }

  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    x,
    y
  );

  const site = sites.find(function (item) {
    return item.my;
  });

  if (!site) {
    console.log(
      `[remove-site] ${roomName} (${x}, ${y}) 没有自己的工地`
    );
    return;
  }

  const result = site.remove();

  console.log(
    `[remove-site] ${site.structureType} 工地返回值：${result}`
  );
}

module.exports.loop = function () {
  handleRemoveSiteRequest();
};
```

需要删除时，在 Console 写入一次：

```js
Memory.removeSiteRequest = {
  roomName: 'W1N1',
  x: 20,
  y: 20
};
```

主循环会消费并删除这条请求。即使参数错误、房间不可见或目标不存在，也不会在后续 tick 无限重试。

这种处理方式适合人工确认后的单次操作。它不是自动清理系统，也不会扫描整个账号的 Construction Site。

## remove() 有哪些返回值

官方 API 当前为 `ConstructionSite.remove()` 列出两个结果：

| 返回值 | 含义 | 处理 |
|---|---|---|
| `OK` | 删除操作已安排 | 下一 tick 重新检查该坐标 |
| `ERR_NOT_OWNER` | 既不是自己的工地，也不在自己的房间中 | 核对工地所有权和房间控制权 |

示例代码主动筛选 `item.my`，正常情况下不会把其他玩家的工地传给 `remove()`。保留返回值检查仍然有必要，因为实际目标和房间状态可能在不同 tick 发生变化。

与其他 Screeps 操作相同，返回 `OK` 不等于同一段代码中的对象数组已经刷新。下一 tick 再用 `lookForAt()` 或 `Game.getObjectById()` 确认目标是否消失。

## 为什么“没有找到工地”不一定是代码坏了

按下面顺序检查：

1. **房间是否可见**  
   `Game.rooms[roomName]` 为 `undefined` 时，先处理视野问题。

2. **坐标是否正确**  
   游戏房间坐标为 0～49。X、Y 写反也是常见原因。

3. **目标是否已经建成**  
   Builder 完成施工后，目标变成 Structure，`LOOK_CONSTRUCTION_SITES` 不会再找到它。

4. **目标是否已经被删除**  
   一次删除成功后，后续查询自然返回空数组。

5. **是否筛选了自己的工地**  
   示例只处理 `my === true` 的对象。

具体房间可见性可以参考[Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)。

## 删除工地不会拆除完整建筑

Construction Site 与 Structure 是两个阶段：

- 刚放置、尚未完成：Construction Site；
- 进度完成后：对应的 Structure。

本文只处理第一种。已经建成的建筑涉及 `Structure.destroy()` 等不同 API、权限和资源后果，不应把两种操作混在同一篇入门文章里。

如果还不熟悉工地从放置到完成的过程，先阅读[怎样建造第一个 Extension](/blog/screeps-first-extension)。Builder 的施工逻辑则由[怎样让 Creep 自动建造和维修](/blog/screeps-build-and-repair)负责。

## 关于其他玩家的工地

本文故意只删除自己的工地。官方 ConstructionSite 文档另外说明，敌方 Construction Site 可以通过让 Creep 移动到其格子上来清除。这属于房间冲突与敌对目标处理，不在本篇的一次性维护范围内。

## 官方资料

- [Screeps API Reference：ConstructionSite.remove](https://docs.screeps.com/api/#ConstructionSite.remove)
- [Screeps API Reference：Room.lookForAt](https://docs.screeps.com/api/#Room.lookForAt)
- [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-21。

代码已完成 JavaScript 语法检查；工地 ID、房间名、坐标、所有权和真实删除结果均为**待环境验证**。
