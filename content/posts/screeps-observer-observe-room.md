---
title: "StructureObserver.observeRoom() 怎么安全获取远方房间视野"
description: "解释 Observer 的10房间范围、请求与下一tick读取时序、返回码和Memory状态，并提供不会把当前视野误判为观察结果的完整示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Observer"
  - "视野"
  - "跨房间"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（观察请求状态与下一tick读取判断，不是 Screeps 官方服务器）"
  testResult: "无请求、同tick、下一tick可见、下一tick不可见、过期请求和新请求记录场景通过。"
featured: false
---

`StructureObserver.observeRoom(roomName)` 会安排一次远方房间观察。目标 `Room` 对象不是在当前 tick 立刻出现，而是在**下一 tick**才可能从 `Game.rooms[roomName]`读取。

本文只解决一个问题：怎样记录观察请求、在下一 tick 读取结果，并正确区分“请求被接受”“目标房间当前可见”和“视野确实来自这次观察”这几个不同概念。

## Observer 的官方前提

Observer 的基础规则包括：

- RCL 8 房间最多拥有一座 Observer；
- 普通观察范围是10个房间；
- `observeRoom()`成功时返回 `OK`；
- 目标房间对象在下一 tick 可用；
- 房间名无效时返回 `ERR_INVALID_ARGS`；
- 超出范围时返回 `ERR_NOT_IN_RANGE`；
- 结构不属于自己时返回 `ERR_NOT_OWNER`；
- Controller等级不足、结构不可用时返回 `ERR_RCL_NOT_ENOUGH`。

`OK`表示观察命令已经安排，不表示当前 tick 已经获得目标房间视野。

## 先画清楚请求时间线

假设当前是 tick 200：

```text
tick 200
调用 observer.observeRoom("W2N2")
返回 OK
Game.rooms.W2N2 不能用来证明这次观察已完成

下一 tick
读取 Game.rooms.W2N2
处理观察到的房间对象
再安排下一次观察
```

如果目标房间本来就因为己方 Creep、建筑或其他视野来源而可见，那么当前 tick 的 `Game.rooms[targetRoom]`可能已经存在。它仍然不能证明本次 `observeRoom()`即时生效。

## 为什么要把请求写进 Memory

`Game`对象每 tick 都会重新创建。需要在下一 tick 知道“上一 tick 请求了哪个房间”，就要保存：

- 目标房间名；
- 请求 tick；
- 使用的 Observer ID；
- 可选的任务标识；
- 是否已经处理。

示例使用：

```js
Memory.observerState = {
  observerId: '结构ID',
  requestedRoom: 'W2N2',
  requestedAt: 200
};
```

不要把整个 Observer 或 Room 对象写入 Memory，只保存可序列化的ID和字符串。

## 完整示例

代码放在 `main` 模块。首次使用前，在 Memory 中配置 Observer ID 和目标房间：

```js
Memory.observerConfig = {
  observerId: '替换为自己的Observer ID',
  targetRoom: 'W2N2'
};
```

主循环代码：

```js
function getObservationResult(state) {
  if (!state || typeof state.requestedRoom !== 'string') {
    return {
      status: 'none',
      room: null
    };
  }

  if (state.requestedAt === Game.time) {
    return {
      status: 'waiting',
      room: null
    };
  }

  if (state.requestedAt !== Game.time - 1) {
    return {
      status: 'expired',
      room: null
    };
  }

  const room = Game.rooms[state.requestedRoom];

  return {
    status: room ? 'visible' : 'missing',
    room: room || null
  };
}

function summarizeObservedRoom(room) {
  const controller = room.controller;
  const hostileCreeps = room.find(FIND_HOSTILE_CREEPS);
  const sources = room.find(FIND_SOURCES);
  const mineral = room.find(FIND_MINERALS)[0] || null;

  return {
    roomName: room.name,
    observedAt: Game.time,
    controller: controller
      ? {
          owner: controller.owner
            ? controller.owner.username
            : null,
          reservation: controller.reservation
            ? controller.reservation.username
            : null,
          level: controller.level
        }
      : null,
    sourceCount: sources.length,
    mineralType: mineral ? mineral.mineralType : null,
    hostileCount: hostileCreeps.length
  };
}

function saveIntel(summary) {
  Memory.roomIntel ??= {};
  Memory.roomIntel[summary.roomName] = summary;
}

module.exports.loop = function () {
  const config = Memory.observerConfig;

  if (
    !config
    || typeof config.observerId !== 'string'
    || typeof config.targetRoom !== 'string'
  ) {
    return;
  }

  const previousResult = getObservationResult(
    Memory.observerState
  );

  if (previousResult.status === 'visible') {
    const summary = summarizeObservedRoom(
      previousResult.room
    );
    saveIntel(summary);
  } else if (
    previousResult.status === 'missing'
    && Game.time % 100 === 0
  ) {
    console.log({
      type: 'observer-result-missing',
      requestedRoom: Memory.observerState.requestedRoom,
      requestedAt: Memory.observerState.requestedAt
    });
  }

  const observer = Game.getObjectById(config.observerId);

  if (
    !observer
    || observer.structureType !== STRUCTURE_OBSERVER
    || observer.my !== true
  ) {
    return;
  }

  const result = observer.observeRoom(config.targetRoom);

  if (result === OK) {
    Memory.observerState = {
      observerId: observer.id,
      requestedRoom: config.targetRoom,
      requestedAt: Game.time
    };
    return;
  }

  if (Game.time % 100 === 0) {
    console.log({
      type: 'observer-request-failed',
      observerId: observer.id,
      observerRoom: observer.room.name,
      targetRoom: config.targetRoom,
      result
    });
  }
};
```

## 为什么先读取上一 tick，再提交新请求

主循环顺序是：

```text
处理上一 tick 的观察结果
→ 保存 Intel 摘要
→ 恢复 Observer
→ 提交本 tick 的新请求
→ 记录本 tick 请求
```

若先覆盖 `Memory.observerState`，上一 tick 的目标房间名会丢失，后面就不知道应该读取哪个 `Game.rooms`键。

## `Game.rooms`存在不等于视野来自 Observer

目标房间可能因为这些原因已经可见：

- 己方 Creep 正在房间里；
- 己方建筑提供视野；
- 其他游戏机制提供了当前视野；
- Observer 在上一 tick 请求了该房间。

所以代码只能确认：

> 上一 tick 确实安排了该房间，并且当前 tick 该房间可见。

没有额外证据时，不应断言视野唯一来自 Observer。

## 为什么保存摘要而不是整个 Room

`Room`是当前 tick 的游戏对象，不能作为稳定对象跨 tick 使用。示例只保存：

- Controller所有者；
- Reservation玩家；
- RCL；
- Source数量；
- Mineral类型；
- 敌对 Creep 数量；
- 观察 tick。

下一次需要更详细数据时重新观察。

Intel 结构还应带时间戳，因为房间状态会变化。很久以前记录的“没有敌人”不能当作当前安全结论。

## 普通范围是10个房间

官方常量：

```js
OBSERVER_RANGE
```

当前值为10。可以用线性距离做提前提示：

```js
const distance = Game.map.getRoomLinearDistance(
  observer.room.name,
  config.targetRoom
);
```

但最终仍应以 `observeRoom()`返回值为准。Power效果可能改变 Observer能力，硬编码本地判断可能与当前结构效果不一致。

## 返回值怎样排查

| 返回值 | 含义 | 处理方式 |
|---|---|---|
| `OK` | 请求已安排 | 保存目标与当前tick，下一tick读取 |
| `ERR_NOT_OWNER` | Observer不是自己的 | 检查ID和所有权 |
| `ERR_NOT_IN_RANGE` | 目标房间超出当前观察范围 | 检查房间名和距离 |
| `ERR_INVALID_ARGS` | 房间名无效 | 检查字符串格式 |
| `ERR_RCL_NOT_ENOUGH` | 结构当前不可用 | 检查RCL和 `isActive()` |

`observeRoom()`没有“当前已经可见所以无需观察”的专用返回码。业务代码可以自行跳过已通过其他来源可见的房间，但这属于调度策略。

## 怎样处理多个目标房间

单个 Observer 每 tick 的调度应只有一个明确目标。多个房间可以使用循环队列：

```js
function getNextRoom(queue, index) {
  if (!Array.isArray(queue) || queue.length === 0) {
    return null;
  }

  const safeIndex = Number.isInteger(index)
    ? Math.abs(index) % queue.length
    : 0;

  return queue[safeIndex];
}
```

然后每 tick：

1. 读取上一结果；
2. 根据索引选择一个目标；
3. 只提交一次观察请求；
4. `OK`后推进索引。

完整 Intel 调度还需要失败重试、任务优先级、数据过期时间和范围分组，本文不展开。

## 请求失败时不要覆盖上一份成功状态

示例只有在返回 `OK`时才写入：

```js
Memory.observerState = {
  requestedRoom: config.targetRoom,
  requestedAt: Game.time
};
```

若返回错误却仍然记录“已请求”，下一 tick 会把不存在的观察结果误当成一次有效任务。

## 离线模拟结果

构建检查把请求状态判断拆成纯函数，覆盖：

1. 没有历史请求时返回 `none`；
2. 请求 tick 等于当前 tick 时返回 `waiting`；
3. 上一 tick 请求且当前可见时返回 `visible`；
4. 上一 tick 请求但当前不可见时返回 `missing`；
5. 请求早于上一 tick 时返回 `expired`；
6. 只有返回 `OK`时才生成新的请求状态。

离线模拟没有创建真实 Observer，也没有证明下一 tick 一定出现目标 `Room`对象。

## 常见误区

### 当前 tick 调用后立即读取

当前 tick 的 `Game.rooms[targetRoom]`不能用于验证这次请求。

### 只保存目标房间，不保存 tick

无法区分上一 tick 请求、同 tick 请求和很久以前的旧状态。

### 把 Room 对象写入 Memory

Memory只适合JSON数据，不应保存live游戏对象。

### 返回错误时仍然记录成功请求

下一 tick 会产生虚假的“结果缺失”记录。

### 把旧 Intel 当作当前事实

所有摘要都需要 `observedAt`，并由业务代码定义过期时间。

### 没有目标视野就认定 Observer 失效

还要检查请求 tick、返回码、Observer ID、所有权、RCL和目标房间名。

## 排查顺序

1. 检查 `observerId`和 `targetRoom`配置；
2. 用 `Game.getObjectById()`恢复结构并检查类型；
3. 检查 `observer.my`和 `observer.isActive()`；
4. 保存 `observeRoom()`返回值；
5. 只有 `OK`时记录请求；
6. 下一 tick 再读取目标 `Game.rooms`；
7. 检查历史请求是否恰好来自上一 tick；
8. 给 Intel 保存观察时间；
9. 最后再实现多房间队列和重试策略。

## 适用边界

本文没有实现：

- 多 Observer 分片调度；
- Power效果调度；
- Portal和跨 shard 侦察；
- 房间威胁评分；
- 敌对玩家历史；
- 自动路线规划；
- Intel 数据压缩；
- 长期外部数据库。

JavaScript语法和请求状态离线模拟已经通过。真实 Observer返回值、下一tick视野和多tick Intel更新仍待Screeps环境验证。

## 相关站内内容

- [Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)
- [Game.map.findRoute() 怎么规划跨房间路线](/blog/screeps-map-find-route)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [RoomVisual 怎么画调试标记](/blog/screeps-roomvisual-debug)
- [进入移动、寻路与视野模块](/knowledge/movement-vision)

## 官方资料

- [StructureObserver.observeRoom API](https://docs.screeps.com/api/#StructureObserver.observeRoom)
- [StructureObserver API](https://docs.screeps.com/api/#StructureObserver)
- [Game.rooms API](https://docs.screeps.com/api/#Game-rooms)
- [Game.map.getRoomLinearDistance API](https://docs.screeps.com/api/#Game-map.getRoomLinearDistance)

资料核对日期：2026-07-22。离线请求状态模拟已通过；真实观察行为仍待环境验证。
