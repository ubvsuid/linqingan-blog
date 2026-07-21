---
title: "Structure.destroy() 怎么用：安全拆除建错的 Extension"
description: "用 Structure.destroy() 拆除已经完工且确认无误的 Extension，加入坐标、结构类型和确认词检查，并处理 ERR_NOT_OWNER 与 ERR_BUSY。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-21"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "Structure"
  - "Room API"
  - "常见问题"
  - "基础工程"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

工地放错时可以调用 `ConstructionSite.remove()`。一旦 Builder 把工地完成，目标已经变成 Structure，删除方法也随之改变。

本文只处理一种明确场景：**拆除自己房间中、已经完工且位置放错的 Extension**。示例故意不开放 Spawn、Storage、Terminal、Road 或其他结构，避免一段通用代码误删关键建筑。

## 先分清工地和完整建筑

| 当前目标 | 使用的方法 |
|---|---|
| 尚未完成的 Construction Site | `site.remove()` |
| 已经完成的 Structure | `structure.destroy()` |

不知道目标处于哪个阶段时，先看游戏界面，或者在该坐标分别查询 `LOOK_CONSTRUCTION_SITES` 与 `LOOK_STRUCTURES`。

未完成工地的处理已经在[ConstructionSite.remove() 怎么用](/blog/screeps-construction-site-remove)中说明，这里不再重复。

## 不要从 Console 直接猜 ID 并销毁

下面这种调用缺少对象、类型和所有权检查：

```js
Game.getObjectById('某个ID').destroy();
```

ID 错误或对象不可见时，`Game.getObjectById()` 会返回 `null`。即使取得了对象，也不代表它就是准备拆除的 Extension。

先执行只读检查更稳妥：

```js
const room = Game.rooms['W1N1'];

if (!room) {
  console.log('房间当前不可见');
} else {
  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    20,
    20
  );

  console.log(structures);
}
```

确认房间、X、Y 和结构类型后，再提交拆除请求。

## 使用坐标、类型和确认词三重检查

下面的完整示例只允许 `STRUCTURE_EXTENSION`。请求必须同时提供：

- 房间名；
- 0～49 的整数坐标；
- 预期结构类型；
- 完全一致的确认词 `DESTROY`。

```js
const ALLOWED_DESTROY_TYPES = new Set([
  STRUCTURE_EXTENSION
]);

function handleDestroyStructureRequest() {
  const request = Memory.destroyStructureRequest;

  if (!request) {
    return;
  }

  delete Memory.destroyStructureRequest;

  const roomName = request.roomName;
  const x = request.x;
  const y = request.y;
  const expectedType = request.expectedType;
  const confirmation = request.confirmation;

  if (
    typeof roomName !== 'string' ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    x > 49 ||
    y < 0 ||
    y > 49 ||
    typeof expectedType !== 'string'
  ) {
    console.log('[destroy] 请求参数不正确');
    return;
  }

  if (confirmation !== 'DESTROY') {
    console.log('[destroy] 确认词不正确，已取消');
    return;
  }

  if (!ALLOWED_DESTROY_TYPES.has(expectedType)) {
    console.log(`[destroy] 示例不允许拆除：${expectedType}`);
    return;
  }

  const room = Game.rooms[roomName];

  if (!room) {
    console.log(`[destroy] 房间当前不可见：${roomName}`);
    return;
  }

  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    x,
    y
  );

  const target = structures.find(function (structure) {
    return (
      structure.structureType === expectedType &&
      Boolean(Game.structures[structure.id])
    );
  });

  if (!target) {
    console.log(
      `[destroy] ${roomName} (${x}, ${y}) ` +
      `没有符合条件的己方 ${expectedType}`
    );
    return;
  }

  const result = target.destroy();

  console.log(
    `[destroy] ${target.structureType} ` +
    `(${x}, ${y}) 返回值：${result}`
  );
}

module.exports.loop = function () {
  handleDestroyStructureRequest();
};
```

代码还通过 `Game.structures[target.id]` 再确认一次对象属于自己的 Structure 集合。单看坐标或 `structureType` 不足以证明目标可由当前玩家销毁。

在 Console 中提交一次请求：

```js
Memory.destroyStructureRequest = {
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_EXTENSION,
  confirmation: 'DESTROY'
};
```

主循环会先消费请求，再做检查。参数不正确、房间不可见或目标不符合时，后续 tick 不会持续尝试。

需要再次执行时，必须重新提交请求。这个限制是有意的：拆除不应该成为每 tick 自动运行的普通任务。

## 为什么示例只允许 Extension

`Structure.destroy()` 是破坏性操作。把所有 `STRUCTURE_*` 类型都加入允许列表，会让坐标写错的后果更严重。

本文选择 Extension，是因为它与站内[怎样建造第一个 Extension](/blog/screeps-first-extension)形成明确的前后关系。准备支持其他结构时，应单独核对：

- 该对象是否属于 `Game.structures`；
- 该结构是否承载关键资源或房间功能；
- 坐标和预期类型是否来自可靠配置；
- 是否需要额外的人工确认。

不要为了“通用”删掉 `expectedType` 和确认词检查。

## destroy() 的返回值

官方 API 当前列出三个结果：

| 返回值 | 含义 | 排查方向 |
|---|---|---|
| `OK` | 操作已成功安排 | 下一 tick 重新查询该坐标 |
| `ERR_NOT_OWNER` | 不是该 Structure 的所有者 | 核对对象是否属于 `Game.structures` |
| `ERR_BUSY` | 房间中有敌对 Creep | 先处理房间内的敌对单位 |

`ERR_BUSY` 说的是房间中的敌对 Creep，不是 Structure 正在生产、冷却或被其他代码占用。

官方对 `destroy()` 的描述使用“立即销毁”，返回值说明则写明 `OK` 表示操作已安排。编写主循环时，稳妥做法仍是保存返回值，并在下一 tick 重新查询，而不是继续使用当前 tick 中的旧对象引用。

## 下一 tick 怎样确认

可以再次执行只读查询：

```js
const room = Game.rooms['W1N1'];

if (room) {
  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    20,
    20
  );

  console.log(structures);
}
```

目标不再出现，才说明后续状态中该 Structure 已经消失。

站内的[Game.getObjectById() 怎么配合 Memory 保存目标](/blog/screeps-game-get-object-by-id)解释了为什么跨 tick 应重新取得对象，而不是长期保存运行时对象。

## 本文没有讨论资源返还

本文不承诺拆除后返还 Energy、掉落资源或保留建筑内容，因为这不是完成当前搜索意图所必需的结论，也没有在文章中提供真实环境材料。

执行拆除前，应自行处理目标 Structure 中的资源和房间依赖。本文代码只确认目标并调用 API，不承担迁移资源或重新规划布局。

## 常见错误

### 房间不在 Game.rooms 中

房间名存在于 Memory，不代表当前可见。先阅读[Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)。

### 坐标上同时有多个对象

Rampart 等结构可能与其他对象共享位置。代码通过 `expectedType` 精确选择 Extension，不取数组中的第一个对象。

### 把 Construction Site 当作 Structure

未完成工地不会通过本文的 Extension Structure 条件。需要删除工地时使用 `ConstructionSite.remove()`。

### 收到 OK 后继续调用旧对象

命令产生的对象变化在后续 tick 体现。下一 tick 重新查询，不要基于旧引用继续执行业务逻辑。

## 相关内容

- [创建一个明确坐标的 Construction Site](/blog/screeps-room-create-construction-site)
- [删除尚未完成的 Construction Site](/blog/screeps-construction-site-remove)
- [怎样建造第一个 Extension](/blog/screeps-first-extension)
- [查询 Screeps 错误码](/screeps-errors)

## 官方资料

- [Screeps API Reference：Structure.destroy](https://docs.screeps.com/api/#Structure.destroy)
- [Screeps API Reference：Room.lookForAt](https://docs.screeps.com/api/#Room.lookForAt)
- [Screeps API Reference：Game.structures](https://docs.screeps.com/api/#Game.structures)
- [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-21。

代码已完成 JavaScript 语法检查；房间名、坐标、Extension 所有权、敌对单位状态和真实拆除结果均为**待环境验证**。
