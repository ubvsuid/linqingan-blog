---
title: "Game.map.findRoute() 怎么规划并执行跨房间路线"
description: "解释 findRoute() 返回的房间级出口序列、routeCallback 成本和 ERR_NO_PATH，并提供带房间偏好、路线缓存与逐房间移动的完整示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
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
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（房间成本与路线步骤选择，不是 Screeps 官方服务器）"
  testResult: "明确禁用房间、己方房间、高速公路、普通房间、空路线和当前步骤选择场景通过。"
featured: false
---

`Game.map.findRoute()` 解决的是“应该依次经过哪些房间”，不是“Creep在每个房间里具体走哪些格子”。

它返回一组房间级步骤，每一步包含：

- 从当前房间使用哪个出口；
- 进入哪个下一个房间。

本文只解决一个问题：怎样生成一条可解释的跨房间路线，并让 Creep 按当前房间对应的出口逐段前进。

## 先区分房间级路线和格子级路径

| 工具 | 处理层级 | 典型结果 |
|---|---|---|
| `Game.map.findRoute()` | 房间与房间 | 出口方向和下一房间 |
| `Game.map.findExit()` | 当前房间到目标房间 | 当前应使用的出口方向 |
| `PathFinder.search()` | 具体格子 | `RoomPosition[]` |
| `creep.moveTo()` | 寻路并提交移动 | 返回错误常量 |

`findRoute()`不会移动 Creep，也不会返回完整的跨房间格子路径。

## 返回值必须先区分数组和错误码

成功时返回类似：

```js
const routeExample = [
  { exit: FIND_EXIT_RIGHT, room: 'W7N3' },
  { exit: FIND_EXIT_BOTTOM, room: 'W7N2' }
];
```

失败时可能返回：

```js
ERR_NO_PATH
```

所以不能直接写：

```js
Game.map.findRoute(fromRoom, targetRoom)[0].exit
```

路线失败时，数字错误码没有第一个步骤。

当起点房间已经等于目标房间时，不需要再找路线；业务代码应提前返回，而不是把空数组当作错误。

## `routeCallback` 表示“进入房间的成本”

回调签名是：

```js
routeCallback(roomName, fromRoomName)
```

返回值越小，路线越偏好进入该房间；返回 `Infinity` 会完全禁止进入。

常见策略可以是：

| 房间类型 | 示例成本 | 含义 |
|---|---:|---|
| 明确禁止的房间 | `Infinity` | 不进入 |
| 己方房间 | `1` | 优先 |
| 高速公路房间 | `1` | 优先 |
| 普通房间 | `2.5` | 可以进入但优先级较低 |

这些数字只是相对权重，不是官方推荐值。

## 怎样识别高速公路房间

世界房间名中的横向或纵向坐标能被10整除时，该房间位于高速公路带。例如：

```js
function isHighwayRoom(roomName) {
  const match = /^[WE](\d+)[NS](\d+)$/.exec(roomName);
  if (!match) {
    return false;
  }

  const horizontal = Number(match[1]);
  const vertical = Number(match[2]);

  return horizontal % 10 === 0 || vertical % 10 === 0;
}
```

这个函数只负责名称分类，不代表高速公路一定安全。

## 完整示例

代码放在 `main` 模块。把 Creep 名称、目标房间和 `Memory.routeAvoid` 改成自己的配置。

```js
function isHighwayRoom(roomName) {
  const match = /^[WE](\d+)[NS](\d+)$/.exec(roomName);
  if (!match) {
    return false;
  }

  const horizontal = Number(match[1]);
  const vertical = Number(match[2]);

  return horizontal % 10 === 0 || vertical % 10 === 0;
}

function getRouteRoomCost(roomName, avoidedRooms) {
  if (avoidedRooms.has(roomName)) {
    return Infinity;
  }

  const room = Game.rooms[roomName];
  const isOwnedRoom = Boolean(
    room
    && room.controller
    && room.controller.my
  );

  if (isOwnedRoom || isHighwayRoom(roomName)) {
    return 1;
  }

  return 2.5;
}

function calculateRoute(fromRoom, targetRoom) {
  const avoidedRooms = new Set(
    Array.isArray(Memory.routeAvoid)
      ? Memory.routeAvoid
      : []
  );

  const route = Game.map.findRoute(fromRoom, targetRoom, {
    routeCallback(roomName) {
      return getRouteRoomCost(roomName, avoidedRooms);
    }
  });

  if (!Array.isArray(route)) {
    return {
      ok: false,
      code: route,
      steps: []
    };
  }

  return {
    ok: true,
    code: OK,
    steps: route.map(step => ({
      exit: step.exit,
      room: step.room
    }))
  };
}

function getCurrentRouteStep(creep, targetRoom) {
  creep.memory.routePlan ??= {};

  const plan = creep.memory.routePlan;
  const needsRebuild =
    plan.targetRoom !== targetRoom
    || plan.fromRoom !== creep.room.name
    || !Array.isArray(plan.steps)
    || plan.steps.length === 0;

  if (needsRebuild) {
    const routeResult = calculateRoute(
      creep.room.name,
      targetRoom
    );

    if (!routeResult.ok) {
      return routeResult;
    }

    creep.memory.routePlan = {
      targetRoom,
      fromRoom: creep.room.name,
      steps: routeResult.steps,
      builtAt: Game.time
    };
  }

  const currentPlan = creep.memory.routePlan;
  const currentStep = currentPlan.steps.find(
    step => Game.map.describeExits(creep.room.name)?.[step.exit]
      === step.room
  );

  if (!currentStep) {
    delete creep.memory.routePlan;
    return {
      ok: false,
      code: ERR_NO_PATH,
      steps: []
    };
  }

  return {
    ok: true,
    code: OK,
    step: currentStep
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Scout1;
  const targetRoom = 'W8N3';

  if (!creep) {
    return;
  }

  if (creep.room.name === targetRoom) {
    delete creep.memory.routePlan;
    return;
  }

  const routeResult = getCurrentRouteStep(creep, targetRoom);

  if (!routeResult.ok || !routeResult.step) {
    if (Game.time % 100 === 0) {
      console.log({
        type: 'route-not-found',
        creep: creep.name,
        room: creep.room.name,
        targetRoom,
        code: routeResult.code
      });
    }
    return;
  }

  const exit = creep.pos.findClosestByRange(
    routeResult.step.exit
  );

  if (!exit) {
    delete creep.memory.routePlan;
    return;
  }

  const moveResult = creep.moveTo(exit, {
    reusePath: 10,
    maxRooms: 1
  });

  if (moveResult !== OK && Game.time % 20 === 0) {
    console.log({
      type: 'route-move-failed',
      creep: creep.name,
      room: creep.room.name,
      nextRoom: routeResult.step.room,
      result: moveResult
    });
  }
};
```

## 为什么缓存只保留“当前房间开始的路线”

示例在这些情况下重新计算：

- 目标房间改变；
- Creep进入新的房间；
- 缓存不存在；
- 路线步骤为空。

这样每次跨过出口后，都会以新房间为起点重新建立计划。

更复杂的系统可以保存整条路线并移动索引，但需要处理：

- Creep被传送或推到计划外房间；
- 房间避让列表改变；
- 房间所有权改变；
- 路线缓存过期；
- Portal改变实际位置；
- 多个 Creep 共用计划时的版本同步。

本文选择更容易恢复的“逐房间重算”。

## 为什么还要核对 `describeExits()`

缓存中的步骤可能来自旧路线。示例用：

```js
Game.map.describeExits(creep.room.name)?.[step.exit]
```

确认该出口方向当前对应的房间确实等于步骤中的 `room`。

若找不到匹配步骤，代码删除缓存并在下一 tick 重建，而不是继续使用不一致的数据。

## 房间成本不能代替安全情报

`routeCallback`只收到房间名和来源房间名。没有视野时，`Game.rooms[roomName]`通常不存在，因此不能直接读取：

- 敌对 Creep；
- Tower；
- Controller所有者；
- Invader Core；
- Nuke；
- 临时战斗状态。

要根据这些信息避险，需要先把侦察结果保存为自己的 Intel 数据，再由 `routeCallback`读取稳定摘要。

不要把“当前没有视野”误写成“房间安全”。

## `Infinity` 要谨慎使用

`Infinity`表示完全禁止进入。若避让列表把所有候选路线都封住，`findRoute()`会返回 `ERR_NO_PATH`。

可以根据任务级别区分：

```text
民用运输
完全避开已知敌对房间

紧急支援
允许进入高风险房间，但提高成本

侦察单位
只避开明确不可达房间
```

同一套成本策略不一定适合所有角色。

## 进入出口不等于到达目标房间中心

本文只让 Creep前往当前出口。跨过边界后，下一 tick 会在相邻房间边缘出现，再计算下一段。

到达最终房间后，业务代码还需要决定具体目标位置，例如：

```js
const destination = new RoomPosition(25, 25, targetRoom);
```

或使用目标建筑、Flag、Controller等对象。

## `moveTo()` 的返回值仍需处理

常见返回值包括：

| 返回值 | 常见原因 |
|---|---|
| `OK` | 移动命令已提交 |
| `ERR_NO_PATH` | 当前房间内无法到达出口 |
| `ERR_TIRED` | Creep有fatigue |
| `ERR_NO_BODYPART` | 没有可用MOVE部件 |
| `ERR_BUSY` | Creep仍在生成 |
| `ERR_INVALID_TARGET` | 出口目标无效 |

`findRoute()`成功只证明房间级计划存在，不证明每个房间里的格子路径都畅通。

## 离线模拟结果

构建检查把房间成本和步骤选择拆成纯函数，覆盖：

1. 明确禁用房间返回 `Infinity`；
2. 己方房间返回低成本；
3. 高速公路返回低成本；
4. 普通房间返回较高成本；
5. 房间名格式无效时不误判为高速公路；
6. 空路线和当前步骤缺失时返回失败；
7. 与当前房间出口匹配时选出正确下一步。

离线测试没有调用官方 `Game.map.findRoute()`，也没有模拟世界地图或真实房间边界移动。

## 常见误区

### 把路线数组当作格子路径

`route[0].room`是下一房间名，不是 `RoomPosition`。

### 每 tick 都计算整条路线

目标不变时会重复消耗CPU。可以按房间、目标和策略版本缓存。

### 只根据当前视野判断所有房间

不可见房间没有 `Game.rooms[roomName]`，需要自己的 Intel 数据。

### 认为低成本房间一定安全

高速公路只是地图类型，不代表没有敌人或危险对象。

### 不区分空路线与错误码

已经到达目标房间时不需要路线；`ERR_NO_PATH`才表示无法找到方案。

### 房间路线成功后忽略房间内障碍

出口可能被 Creep、建筑布局或自定义矩阵影响，仍要处理移动返回值。

## 排查顺序

1. 确认 Creep 和目标房间名；
2. 若已经到达目标房间，结束路线逻辑；
3. 区分数组和 `ERR_NO_PATH`；
4. 输出每个路线步骤的 `room`与 `exit`；
5. 检查 `routeCallback`是否误用 `Infinity`；
6. 检查缓存的起点、目标和策略是否过期；
7. 用 `describeExits()`核对步骤；
8. 检查当前房间内到出口的 `moveTo()`返回值；
9. 最后再考虑更复杂的路径缓存或 Intel 系统。

## 适用边界

本文没有实现：

- Portal路线；
- 跨 shard 移动；
- 敌对玩家实时威胁评分；
- SK房间时间窗口；
- 多角色共享路线版本；
- 全路径格子缓存；
- 自动绕开临时封锁出口。

JavaScript语法和房间成本离线模拟已经通过。真实地图路线、CPU消耗和跨房间多tick移动仍待Screeps环境验证。

## 相关站内内容

- [PathFinder CostMatrix 怎么设置成本](/blog/screeps-pathfinder-costmatrix)
- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)
- [Observer 怎么获取远方房间视野](/blog/screeps-observer-observe-room)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [进入移动、寻路与视野模块](/knowledge/movement-vision)

## 官方资料

- [Game.map.findRoute API](https://docs.screeps.com/api/#Game-map.findRoute)
- [Game.map.describeExits API](https://docs.screeps.com/api/#Game-map.describeExits)
- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)

资料核对日期：2026-07-22。离线路线策略模拟已通过；真实跨房间移动仍待环境验证。
