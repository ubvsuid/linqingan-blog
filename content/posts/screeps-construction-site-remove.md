---
title: "ConstructionSite.remove() 怎么安全删除放错的工地"
description: "先按坐标只读查找自己的Construction Site，再用工地ID、预期房间、坐标、结构类型和确认词提交一次性remove()请求，并在下一tick重新核对。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "Construction Site"
  - "Room API"
  - "常见问题"
  - "运行安全"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（工地ID、所有权、房间、坐标、结构类型与确认词，不是 Screeps 官方服务器）"
  testResult: "对象缺失、非己方工地、房间不一致、坐标不一致、类型不一致、确认失败和可提交场景通过。"
featured: false
---

`ConstructionSite.remove()` 只删除尚未完工的 Construction Site。Builder完成施工后，目标已经变成 Structure，需要使用不同API。

本文只解决一个问题：怎样删除一个已经由玩家确认、位置放错的己方工地，同时避免“坐标上刚好有另一个工地”或“旧ID已经指向空对象”造成误操作。

## 先分清工地和完整建筑

| 目标阶段 | 对象 | 方法 |
|---|---|---|
| 尚未完工 | `ConstructionSite` | `site.remove()` |
| 已经完工 | `Structure` | `structure.destroy()` |

不要把两个操作放在同一段通用删除代码中。

## 先做只读查询

不知道ID时，先按坐标查看：

```js
const room = Game.rooms.W1N1;

if (room) {
  const sites = room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    20,
    20
  );

  console.log(sites.map(site => ({
    id: site.id,
    my: site.my,
    structureType: site.structureType,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    progress: site.progress,
    progressTotal: site.progressTotal
  })));
}
```

这段代码不会删除任何对象。确认ID、房间、坐标和结构类型后，再提交请求。

## 为什么操作阶段使用ID

只按坐标查找时，代码可能选择数组中的第一个对象。虽然同一格通常不会有多个工地，但高影响维护操作不应依赖隐含顺序。

请求结构：

```js
Memory.removeSiteRequest = {
  enabled: true,
  siteId: '替换为工地ID',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_ROAD,
  confirmation: 'REMOVE_CONSTRUCTION_SITE'
};
```

ID负责定位，其他字段负责交叉验证。

## 可离线测试的计划函数

```js
function evaluateRemoveSiteRequest(input) {
  const { request, site } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.siteId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || typeof request.expectedType !== 'string'
    || request.confirmation !== 'REMOVE_CONSTRUCTION_SITE'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!site) {
    return { ready: false, reason: 'site-missing' };
  }

  if (site.my !== true) {
    return { ready: false, reason: 'not-owner' };
  }

  if (site.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (site.pos.x !== request.x || site.pos.y !== request.y) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (site.structureType !== request.expectedType) {
    return { ready: false, reason: 'type-mismatch' };
  }

  return { ready: true, reason: 'ready' };
}
```

## 完整示例

```js
function evaluateRemoveSiteRequest(input) {
  const { request, site } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.siteId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || typeof request.expectedType !== 'string'
    || request.confirmation !== 'REMOVE_CONSTRUCTION_SITE'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!site) {
    return { ready: false, reason: 'site-missing' };
  }

  if (site.my !== true) {
    return { ready: false, reason: 'not-owner' };
  }

  if (site.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (site.pos.x !== request.x || site.pos.y !== request.y) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (site.structureType !== request.expectedType) {
    return { ready: false, reason: 'type-mismatch' };
  }

  return { ready: true, reason: 'ready' };
}

function handleRemoveSiteRequest() {
  const request = Memory.removeSiteRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const site = typeof request.siteId === 'string'
    ? Game.getObjectById(request.siteId)
    : null;
  const plan = evaluateRemoveSiteRequest({
    request,
    site
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
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    progress: site.progress,
    progressTotal: site.progressTotal
  };

  const result = site.remove();

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'remove-site-result',
    siteId: site.id,
    roomName: site.pos.roomName,
    x: site.pos.x,
    y: site.pos.y,
    structureType: site.structureType,
    result
  });
}

module.exports.loop = function () {
  handleRemoveSiteRequest();
};
```

## 为什么失败后不自动重试

工地可能在检查前后被Builder完成、被其他逻辑删除，或请求字段已经过期。失败请求持续开启，可能在以后同一坐标出现新工地时误删新对象。

因此所有失败都关闭开关。处理原因后，需要重新做只读查询，并生成新的明确请求。

## 官方返回值

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 删除已安排 | 下一 tick 重新通过ID或坐标查询 |
| `ERR_NOT_OWNER` | 既不是自己的工地，也不在自己的房间中 | 所有权与房间控制权 |

本文主动限制 `site.my === true`，不处理己方房间里的其他玩家工地。

## 下一 tick 怎样确认

```js
const site = Game.getObjectById(
  Memory.removeSiteRequest.siteId
);

console.log(site);
```

返回 `null` 只能说明当前无法通过ID取得对象。结合房间视野和原坐标查询，才能判断工地是否已经消失或变成完整建筑。

```js
const room = Game.rooms.W1N1;

if (room) {
  console.log(
    room.lookForAt(LOOK_CONSTRUCTION_SITES, 20, 20)
  );
}
```

## 删除工地会丢失施工进度

`progress` 与 `progressTotal` 是当前工地状态。删除后，已经投入的施工进度不会被本文代码迁移到新工地。

在高进度工地上执行前，应把进度快照作为人工确认信息，而不是只看坐标。

## 离线模拟结果

构建检查覆盖：

1. 请求未启用或确认词错误；
2. 工地ID无法恢复；
3. 工地不属于自己；
4. 房间名不一致；
5. 坐标不一致；
6. 结构类型不一致；
7. 所有字段一致时允许提交。

离线模拟没有调用真实 `remove()`，也没有模拟Builder同tick完成工地。

## 常见误区

### 直接调用 `Game.getObjectById(id).remove()`

ID无效时会读取 `null` 的方法。

### 只按坐标删除

没有验证ID、类型和进度，操作证据不足。

### 把完整建筑当成工地

完工后应使用 `Structure.destroy()`，不是 `ConstructionSite.remove()`。

### 请求失败后一直保持开启

以后出现新对象时可能产生误操作。

### `OK`后同tick继续使用旧对象

应下一tick重新查询。

## 适用边界

本文没有实现：

- 批量清理工地；
- 自动判断布局是否过期；
- 删除其他玩家工地；
- 施工进度迁移；
- 自动重建新坐标；
- 建筑蓝图版本管理。

JavaScript语法和请求匹配离线模拟已经通过。真实工地删除和跨tick对象变化仍待Screeps环境验证。

## 相关站内内容

- [Room.createConstructionSite() 怎么创建工地](/blog/screeps-room-create-construction-site)
- [Structure.destroy() 怎么拆除完整建筑](/blog/screeps-structure-destroy)
- [工地进度怎么看](/blog/screeps-construction-site-progress)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [ConstructionSite.remove API](https://docs.screeps.com/api/#ConstructionSite.remove)
- [Room.lookForAt API](https://docs.screeps.com/api/#Room.lookForAt)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线请求匹配已通过；真实工地删除仍待环境验证。
