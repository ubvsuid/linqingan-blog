---
title: "Room.createConstructionSite() 怎么安全放置 Road 工地"
description: "使用一次性Memory请求检查房间视野、0—49坐标、已有Road、已有工地与账号100个工地上限，并说明Road可以建在自然墙体地形上。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-22"
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
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（请求参数、坐标、占用对象与工地数量，不是 Screeps 官方服务器）"
  testResult: "房间不可见、坐标越界、已有Road、已有工地、账号工地上限、自然墙体Road与可提交场景通过。"
featured: false
---

`Room.createConstructionSite()` 会在指定位置安排一个 Construction Site。它不会直接生成 Road，也不会替 Builder 完成施工。

本文只解决一个问题：怎样通过一次性请求在明确坐标放置 Road 工地，并避免每 tick 重复调用、坐标错误和目标格已经有同类对象。

## 调用前需要确认什么

创建 Road 工地前至少检查：

1. 房间当前存在于 `Game.rooms`；
2. X、Y 是0—49之间的整数；
3. 目标格没有已有 Road；
4. 目标格没有已有 Construction Site；
5. 账号工地数量尚未达到100；
6. 返回值被保存；
7. 下一 tick 再检查工地是否出现。

这些预检查只负责提前发现明显问题。最终能否放置仍以 `createConstructionSite()` 返回值为准。

## Road 可以建在自然墙体地形上

Road 是特殊结构。官方 Road 文档明确允许它建在自然墙体地形上，不过建造成本、耐久与损耗规则会与普通地面不同。

因此不能把：

```js
terrain === TERRAIN_MASK_WALL
```

直接写成 Road 工地的拒绝条件。

自然墙体上能否放置其他结构是另一套规则。本文只处理 `STRUCTURE_ROAD`，不会把这个结论推广到 Extension、Spawn 或其他建筑。

需要观察地形时，可以只记录，不把它当成阻止条件：

```js
const terrain = room.getTerrain().get(x, y);
const onNaturalWall = terrain === TERRAIN_MASK_WALL;
```

## 为什么使用一次性请求

错误写法：

```js
module.exports.loop = function () {
  Game.rooms.W1N1.createConstructionSite(
    20,
    20,
    STRUCTURE_ROAD
  );
};
```

它会在每个 tick 重复调用，房间不可见时还会读取 `undefined` 的方法。

一次性请求：

```js
Memory.constructionSiteRequest = {
  enabled: true,
  roomName: 'W1N1',
  x: 20,
  y: 20,
  structureType: STRUCTURE_ROAD
};
```

本文只允许 `STRUCTURE_ROAD`，避免把单坐标示例变成可放置任意建筑的蓝图系统。

## 可离线测试的参数判断

```js
function evaluateRoadSiteRequest(input) {
  const {
    request,
    roomVisible,
    hasRoad,
    hasSite,
    siteCount
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.structureType !== STRUCTURE_ROAD
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!roomVisible) {
    return { ready: false, reason: 'room-not-visible' };
  }

  if (hasRoad) {
    return { ready: false, reason: 'road-exists' };
  }

  if (hasSite) {
    return { ready: false, reason: 'site-exists' };
  }

  if (siteCount >= 100) {
    return { ready: false, reason: 'site-limit' };
  }

  return { ready: true, reason: 'ready' };
}
```

`100`来自当前官方 `ERR_FULL`说明。若规则以后调整，最终仍以API返回值为准。

## 完整示例

代码放入现有 `main` 模块。

```js
function evaluateRoadSiteRequest(input) {
  const {
    request,
    roomVisible,
    hasRoad,
    hasSite,
    siteCount
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.structureType !== STRUCTURE_ROAD
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!roomVisible) {
    return { ready: false, reason: 'room-not-visible' };
  }

  if (hasRoad) {
    return { ready: false, reason: 'road-exists' };
  }

  if (hasSite) {
    return { ready: false, reason: 'site-exists' };
  }

  if (siteCount >= 100) {
    return { ready: false, reason: 'site-limit' };
  }

  return { ready: true, reason: 'ready' };
}

function handleConstructionSiteRequest() {
  const request = Memory.constructionSiteRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const room = typeof request.roomName === 'string'
    ? Game.rooms[request.roomName]
    : null;
  const coordinatesValid =
    Number.isInteger(request.x)
    && Number.isInteger(request.y)
    && request.x >= 0
    && request.x <= 49
    && request.y >= 0
    && request.y <= 49;

  let hasRoad = false;
  let hasSite = false;
  let onNaturalWall = null;

  if (room && coordinatesValid) {
    const terrain = room.getTerrain().get(
      request.x,
      request.y
    );
    onNaturalWall = terrain === TERRAIN_MASK_WALL;

    hasRoad = room.lookForAt(
      LOOK_STRUCTURES,
      request.x,
      request.y
    ).some(structure =>
      structure.structureType === STRUCTURE_ROAD
    );

    hasSite = room.lookForAt(
      LOOK_CONSTRUCTION_SITES,
      request.x,
      request.y
    ).length > 0;
  }

  const plan = evaluateRoadSiteRequest({
    request,
    roomVisible: Boolean(room),
    hasRoad,
    hasSite,
    siteCount: Object.keys(Game.constructionSites).length
  });

  if (!plan.ready) {
    request.enabled = false;
    request.status = `precheck-${plan.reason}`;
    request.checkedAt = Game.time;
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    roomName: room.name,
    x: request.x,
    y: request.y,
    structureType: STRUCTURE_ROAD,
    onNaturalWall,
    siteCountBefore: Object.keys(Game.constructionSites).length
  };

  const result = room.createConstructionSite(
    request.x,
    request.y,
    STRUCTURE_ROAD
  );

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'construction-site-result',
    roomName: room.name,
    x: request.x,
    y: request.y,
    structureType: STRUCTURE_ROAD,
    onNaturalWall,
    result
  });
}

module.exports.loop = function () {
  handleConstructionSiteRequest();
};
```

## 为什么预检查失败也关闭请求

房间暂时不可见、目标格已有对象或账号工地已满时，持续保留开启状态会让旧请求在条件变化后突然执行。

示例会记录：

```text
precheck-room-not-visible
precheck-road-exists
precheck-site-exists
precheck-site-limit
```

玩家处理原因后，再重新确认和开启请求。

## 返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 创建已安排 | 下一 tick 查询该坐标 |
| `ERR_NOT_OWNER` | 房间被敌对玩家占领或预订 | Controller状态 |
| `ERR_INVALID_TARGET` | 该位置不能放置结构 | 现有对象与特殊格规则 |
| `ERR_FULL` | 账号工地达到100个 | `Game.constructionSites` |
| `ERR_INVALID_ARGS` | 坐标或参数错误 | 0—49整数和结构常量 |
| `ERR_RCL_NOT_ENOUGH` | RCL或建筑数量限制不允许 | Controller等级与结构上限 |

预检查不会复制全部布局规则，所以仍必须保存返回值。

## 下一 tick 怎样确认

```js
const room = Game.rooms.W1N1;
const sites = room
  ? room.lookForAt(LOOK_CONSTRUCTION_SITES, 20, 20)
  : [];

console.log(sites);
```

找到 `STRUCTURE_ROAD` 工地，才说明后续状态中对象已经出现。Builder仍需要携带Energy并调用 `build()`。

## 为什么不自动扫描整条路径

沿路径批量放置 Road 还需要处理：

- 路径缓存是否过期；
- 自然墙体上的不同建造成本；
- 已有Road与Rampart；
- 账号工地上限；
- 每个房间的控制权；
- 每tick限量；
- 蓝图版本；
- 旧布局清理。

这些内容不应塞进单坐标API文章。

## 离线模拟结果

构建检查覆盖：

1. 请求未启用；
2. 房间名或坐标无效；
3. 结构类型不是Road；
4. 房间不可见；
5. 已有Road；
6. 已有工地；
7. 账号工地达到100；
8. 普通地面允许提交；
9. 自然墙体上的Road同样不会被预检查拒绝。

离线模拟没有调用真实 `createConstructionSite()`，也没有复制全部RCL与特殊格规则。

## 常见误区

### 把自然墙体一律判为不能建Road

Road是例外，官方允许建在自然墙体地形上。

### Memory中有房间名就认为房间可用

只有当前 `Game.rooms[roomName]` 存在时才能调用Room方法。

### 坐标合法就认为一定能建

已有对象、房间控制与RCL仍可能阻止放置。

### 每tick重复调用

固定坐标创建应使用一次性请求。

### 返回 `OK` 后同tick查不到就判失败

命令结算发生在脚本执行之后，应下一tick检查。

### 把Construction Site当成完整Road

仍需要Builder完成施工。

## 适用边界

本文没有实现：

- 批量Road蓝图；
- 自动建筑规划；
- Spawn命名；
- 多房间建设调度；
- 工地优先级；
- 自动清理旧工地；
- Builder角色逻辑。

JavaScript语法和请求计划离线模拟已经通过。真实创建结果、RCL与格子规则仍待Screeps环境验证。

## 相关站内内容

- [工地进度怎么看](/blog/screeps-construction-site-progress)
- [ConstructionSite.remove() 怎么删除工地](/blog/screeps-construction-site-remove)
- [Structure.destroy() 怎么拆除完整建筑](/blog/screeps-structure-destroy)
- [怎样让Creep自动建造和维修](/blog/screeps-build-and-repair)
- [Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [Room.createConstructionSite API](https://docs.screeps.com/api/#Room.createConstructionSite)
- [StructureRoad API](https://docs.screeps.com/api/#StructureRoad)
- [Room.lookForAt API](https://docs.screeps.com/api/#Room.lookForAt)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线请求计划已通过；真实工地创建仍待环境验证。
