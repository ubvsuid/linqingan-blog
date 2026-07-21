---
title: "Room.createConstructionSite() 怎么用：用代码放置 Road 工地"
description: "用 Room.createConstructionSite() 在指定坐标创建 Road 工地，检查房间可见性、坐标、RCL 与返回值，避免主循环每个 tick 重复创建。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-21"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Construction Site"
  - "Room API"
  - "Road"
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

手动放一个 Road 工地不难。麻烦通常出现在另一种情况：坐标已经写进配置，代码知道该在哪里修路，但你还要每次打开建造菜单点一下。

`Room.createConstructionSite()` 就是用来处理这一步的。它在指定坐标创建 Construction Site，不会直接生成完整建筑，也不会替 Builder 完成施工。

先检查房间是否在 `Game.rooms` 中。房间当前不可见时，没有可调用该方法的 Room 对象。

## 先用 Console 验证一个坐标

下面这段适合在 Console 中执行一次：

```js
const room = Game.rooms['W1N1'];

if (!room) {
  console.log('房间当前不可见');
} else {
  const result = room.createConstructionSite(
    20,
    20,
    STRUCTURE_ROAD
  );

  console.log('createConstructionSite:', result);
}
```

需要替换三处内容：

- `W1N1`：自己的房间名；
- 第一个 `20`：X 坐标；
- 第二个 `20`：Y 坐标。

`STRUCTURE_ROAD` 是官方结构常量。创建 Road 时不需要提供名称；`createConstructionSite()` 的可选名称参数目前主要用于 Spawn 这类支持名称的结构。

返回 `OK` 只表示请求已经安排。根据 Screeps 的 tick 执行方式，新对象和属性变化应在后续 tick 重新读取，不要在同一段代码后立即假定工地已经出现在搜索结果中。

## 为什么不建议直接写进主循环

下面的写法会在每个 tick 重复调用：

```js
module.exports.loop = function () {
  Game.rooms['W1N1'].createConstructionSite(
    20,
    20,
    STRUCTURE_ROAD
  );
};
```

它还有一个更直接的问题：房间不可见时会因为读取 `undefined` 的方法而报错。

创建固定工地通常是一次性操作。把请求暂存在 Memory，由主循环消费一次，更容易控制，也不会让 Console 每个 tick 重复输出相同错误。

## 使用一次性请求创建 Road 工地

把下面代码放入 `main` 模块。它不会主动创建任何东西，只有检测到 `Memory.roadSiteRequest` 时才执行一次。

```js
function handleRoadSiteRequest() {
  const request = Memory.roadSiteRequest;

  if (!request) {
    return;
  }

  delete Memory.roadSiteRequest;

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
    console.log('[road-site] 请求参数不正确');
    return;
  }

  const room = Game.rooms[roomName];

  if (!room) {
    console.log(`[road-site] 房间当前不可见：${roomName}`);
    return;
  }

  const result = room.createConstructionSite(
    x,
    y,
    STRUCTURE_ROAD
  );

  console.log(
    `[road-site] ${roomName} (${x}, ${y}) 返回值：${result}`
  );
}

module.exports.loop = function () {
  handleRoadSiteRequest();
};
```

然后在 Console 写入请求：

```js
Memory.roadSiteRequest = {
  roomName: 'W1N1',
  x: 20,
  y: 20
};
```

主循环读取请求后会先删除它，再检查参数、房间可见性和 API 返回值。这样无论创建成功还是失败，都不会在后续 tick 自动重复尝试。

如果房间当时不可见，重新取得视野后再提交一次请求即可。

## 返回值该怎么判断

`Room.createConstructionSite()` 当前可能返回以下结果：

| 返回值 | 这里通常表示什么 | 下一步 |
|---|---|---|
| `OK` | 创建请求已安排 | 下一 tick 查看该坐标 |
| `ERR_NOT_OWNER` | 房间被敌对玩家占领或预定 | 核对房间控制权 |
| `ERR_INVALID_TARGET` | 该格不能放置 Road 工地 | 检查地形、已有结构和已有工地 |
| `ERR_FULL` | 账号的 Construction Site 已达到上限 | 清理不再需要的工地 |
| `ERR_INVALID_ARGS` | 坐标或参数不正确 | 检查 X、Y 是否为 0～49 的整数 |
| `ERR_RCL_NOT_ENOUGH` | 当前 RCL 或建筑数量限制不允许 | 检查 Controller 等级和建筑上限 |

官方 API 当前说明，每个玩家最多可以拥有 100 个 Construction Site。这里的 `ERR_FULL` 不是 Road 容量已满，而是工地数量达到账号限制。

`ERR_INVALID_TARGET` 的范围比较宽。看到它时，先在游戏界面查看该格，再按需要使用 `room.lookAt(x, y)` 检查地形、结构和已有工地。不要只根据错误码猜原因。

## 工地创建后，Builder 仍要施工

创建结果是 Construction Site。要让它变成 Road，仍需要带有 `WORK` 部件和 Energy 的 Creep 调用 `build()`。

站内的[怎样让 Creep 自动建造和维修](/blog/screeps-build-and-repair)已经解释 Builder 如何查找工地并施工，这里不再重复角色状态切换和建造逻辑。

第一次接触工地时，可以先阅读[怎样建造第一个 Extension](/blog/screeps-first-extension)，区分“放置工地”和“完成建筑”这两个阶段。

## 常见的三个误判

### Memory 中有房间名，就认为房间可用

`Memory.rooms` 可以保留历史数据，但 `Game.rooms` 只提供当前 tick 可见的 Room 对象。具体可见性问题可参考[Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)。

### 坐标合法，就认为一定能建

X、Y 在 0～49 之间只能说明参数形式基本正确。墙体地形、已有建筑、其他工地和房间控制条件仍可能阻止放置。

### 忽略返回值，只看地图有没有变化

先保存并输出返回值。Screeps 的很多操作通过数字常量报告结果，站内的[Screeps 错误码查询](/screeps-errors)可以帮助确认常量含义。

## 本文没有处理什么

这份代码只创建一个明确坐标的 Road 工地，没有涉及：

- 沿路径批量铺设 Road；
- 自动选择房间布局；
- 根据 RCL 生成完整建筑计划；
- 用 Flag 或 RoomVisual 维护蓝图；
- 多房间建设调度。

这些需求需要单独设计规划和防重复逻辑，不适合塞进一个 API 入门示例。

## 官方资料

- [Screeps API Reference：Room.createConstructionSite](https://docs.screeps.com/api/#Room.createConstructionSite)
- [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-21。

代码已完成 JavaScript 语法检查；房间名、坐标、RCL、实际格子内容与 Screeps 运行结果均为**待环境验证**。
