---
title: "Screeps ERR_NO_PATH 怎么排查：目标范围、回调与跨房间路线"
description: "区分moveTo的ERR_NO_PATH、noPathFinding的ERR_NOT_FOUND和PathFinder incomplete，从目标范围、地形、回调、maxOps与出口逐步排查。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "ERR_NO_PATH"
  - "寻路"
  - "PathFinder"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（目标Position、范围、已到达、PathFinder incomplete、回调拒绝和返回值分类，不是Screeps官方服务器）"
  testResult: "目标无效、范围错误、已经到达、moveTo无路径、无缓存路径、PathFinder不完整、回调阻断和可用路线场景通过。"
featured: false
---

`ERR_NO_PATH` 的值是 `-2`。对 `creep.moveTo()` 来说，它表示本次寻路没有找到到达目标范围的路线。

排查时要先区分三个看起来相似但含义不同的结果：

```text
moveTo() 返回 ERR_NO_PATH
→ 本次没有找到路线

moveTo({ noPathFinding: true }) 返回 ERR_NOT_FOUND
→ 没有已缓存路径可复用

PathFinder.search() 返回 incomplete: true
→ 搜索结束时没有完整抵达目标范围
```

它们不能用同一条“重新寻路”日志笼统处理。

## 第一项检查：目标与范围是否正确

Source、Controller和大多数Structure所在格不能让Creep站入。若写成：

```js
creep.moveTo(source, { range: 0 });
```

寻路目标可能不可达。

应根据动作距离设置：

```js
creep.moveTo(source, { range: 1 });
creep.moveTo(container, { range: 1 });
creep.moveTo(controller, { range: 3 });
creep.moveTo(constructionSite, { range: 3 });
```

先确认目标有Position：

```js
if (!target?.pos) {
  return;
}
```

## 空路径不一定代表错误

`findPathTo()`返回空数组时可能有两种原因：

1. 已经位于要求范围内，不需要移动；
2. 没找到路线。

因此必须同时检查范围：

```js
const alreadyInRange = creep.pos.inRangeTo(
  target,
  desiredRange
);
const path = creep.pos.findPathTo(target, {
  range: desiredRange
});

if (path.length === 0 && !alreadyInRange) {
  // 才能按无路线继续诊断
}
```

## PathFinder怎样表达不完整路线

```js
const result = PathFinder.search(
  creep.pos,
  {
    pos: target.pos,
    range: desiredRange
  }
);
```

需要读取：

```js
result.path
result.ops
result.cost
result.incomplete
```

`incomplete: true` 表示搜索没有完成到目标范围。返回的 `path` 可能仍包含一段部分路线，不能因为数组非空就断言目标可达。

## 用纯函数分类寻路结果

```js
function classifyPathResult(input) {
  const {
    targetExists,
    targetHasPosition,
    desiredRange,
    alreadyInRange,
    moveResult,
    pathLength,
    pathIncomplete,
    callbackRejectedRoom
  } = input;

  if (!targetExists || !targetHasPosition) {
    return {
      usable: false,
      reason: 'target-invalid'
    };
  }

  if (!Number.isInteger(desiredRange) || desiredRange < 0) {
    return {
      usable: false,
      reason: 'range-invalid'
    };
  }

  if (alreadyInRange) {
    return {
      usable: true,
      reason: 'already-in-range'
    };
  }

  if (callbackRejectedRoom) {
    return {
      usable: false,
      reason: 'callback-rejected-room'
    };
  }

  if (moveResult === ERR_NOT_FOUND) {
    return {
      usable: false,
      reason: 'cached-path-missing'
    };
  }

  if (moveResult === ERR_NO_PATH) {
    return {
      usable: false,
      reason: 'move-no-path'
    };
  }

  if (pathIncomplete === true) {
    return {
      usable: false,
      reason: 'pathfinder-incomplete'
    };
  }

  if (!Number.isInteger(pathLength) || pathLength <= 0) {
    return {
      usable: false,
      reason: 'path-empty-out-of-range'
    };
  }

  return {
    usable: true,
    reason: 'path-available'
  };
}
```

## 同房间诊断示例

```js
function diagnosePath(creep, target, desiredRange) {
  if (!creep || !target?.pos) {
    return {
      status: 'object-invalid'
    };
  }

  if (
    creep.pos.roomName === target.pos.roomName
    && creep.pos.inRangeTo(target, desiredRange)
  ) {
    return {
      status: 'already-in-range'
    };
  }

  const search = PathFinder.search(
    creep.pos,
    {
      pos: target.pos,
      range: desiredRange
    },
    {
      maxOps: 4000,
      maxRooms: 1,
      plainCost: 2,
      swampCost: 10,
      roomCallback(roomName) {
        const room = Game.rooms[roomName];

        if (!room) {
          return undefined;
        }

        const costs = new PathFinder.CostMatrix();

        for (const structure of room.find(FIND_STRUCTURES)) {
          if (
            structure.structureType === STRUCTURE_ROAD
          ) {
            costs.set(
              structure.pos.x,
              structure.pos.y,
              1
            );
            continue;
          }

          if (
            structure.structureType !== STRUCTURE_CONTAINER
            && (
              structure.structureType !== STRUCTURE_RAMPART
              || !structure.my
              || !structure.isPublic
            )
          ) {
            costs.set(
              structure.pos.x,
              structure.pos.y,
              255
            );
          }
        }

        return costs;
      }
    }
  );

  const moveResult = creep.moveTo(target, {
    range: desiredRange,
    reusePath: 0,
    maxOps: 4000,
    visualizePathStyle: {
      stroke: search.incomplete
        ? '#ff4444'
        : '#00ff88',
      opacity: 0.65
    }
  });

  return {
    status: search.incomplete
      ? 'pathfinder-incomplete'
      : moveResult === OK
        ? 'move-submitted'
        : 'move-failed',
    moveResult,
    pathLength: search.path.length,
    incomplete: search.incomplete,
    ops: search.ops,
    cost: search.cost
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.WorkTarget;

  if (!creep || !target) {
    return;
  }

  const outcome = diagnosePath(creep, target, 1);

  if (outcome.status !== 'move-submitted') {
    console.log({
      type: 'path-diagnostic',
      creepName: creep.name,
      from: {
        roomName: creep.pos.roomName,
        x: creep.pos.x,
        y: creep.pos.y
      },
      to: {
        roomName: target.pos.roomName,
        x: target.pos.x,
        y: target.pos.y
      },
      ...outcome
    });
  }
};
```

`reusePath: 0` 和较详细的Visual适合临时诊断，不应默认在所有Creep上长期启用。

## CostMatrix最容易写错的地方

CostMatrix中：

- 低值表示更愿意经过；
- `255` 表示不可通行；
- 没有设置的格使用搜索默认地形成本。

常见错误：

### 把道路也设为255

回调中结构类型判断顺序错误，会把本应低成本的道路封死。

### 把己方或公开Rampart全部封死

应根据任务决定哪些Rampart可通行。

### 回调返回 `false`

在PathFinder `roomCallback` 中，返回 `false` 表示该房间不能进入。跨房间目标的必经房间被拒绝后，搜索会变成不完整。

### 只处理可见房间

不可见房间回调通常返回 `undefined`，让搜索使用默认地形矩阵。若直接返回 `false`，等于禁止进入所有无视野房间。

## `maxOps` 与 `maxRooms`

搜索限制过低时，即使理论上存在路线，也可能得到 `incomplete: true`。

诊断步骤：

1. 记录 `ops` 与 `incomplete`；
2. 临时提高 `maxOps`；
3. 检查 `maxRooms` 是否允许到达目标房间；
4. 检查回调是否拒绝必经房间；
5. 不要永久把限制无限提高，先找出复杂度来源。

## 跨房间还要检查地图路线

可以先检查房间级路线：

```js
const route = Game.map.findRoute(
  creep.pos.roomName,
  target.pos.roomName
);

if (route === ERR_NO_PATH) {
  console.log('room route not found');
}
```

`Game.map.findRoute()` 找不到房间级路线时，Creep级寻路也无法正常穿越。

`routeCallback` 返回 `Infinity` 会拒绝房间。错误配置可能把目标房间或唯一通道排除。

## `noPathFinding` 与缓存路径

```js
creep.moveTo(target, {
  noPathFinding: true
});
```

没有可复用路径时返回 `ERR_NOT_FOUND`，不是 `ERR_NO_PATH`。

正确用途通常是：

1. 先正常调用建立缓存；
2. CPU紧张时尝试只复用；
3. 得到 `ERR_NOT_FOUND` 后，在允许条件下重新寻路。

第一次移动就开启该选项，很可能没有路径可用。

## 临时Creep阻挡通常不是ERR_NO_PATH

`moveTo()` 可能找到路线并返回 `OK`，但结算时下一格被其他Creep占用，导致位置没有变化。

这属于交通协调问题。可以检查：

- 连续位置未变化；
- 下一格是否被占用；
- 是否需要交换、让路或pull；
- 是否多个模块重复提交移动。

不要把所有“不动”都归为无路径。

## 常见错误

### 目标结构使用范围0

改成动作允许的范围1或范围3。

### 空路径直接判定无路线

先检查是否已经在目标范围。

### 忽略 `incomplete`

PathFinder返回部分路径不等于抵达目标。

### `roomCallback` 对无视野房间返回false

这会禁止进入该房间。

### `maxOps` 太低却认为地形封闭

记录搜索统计，再调整限制验证。

### 永久关闭路径缓存

可能显著增加CPU，诊断结束后恢复合理配置。

### 把临时交通当成寻路失败

返回OK后连续不动要检查Creep占位和命令覆盖。

## 离线模拟结果

构建检查覆盖：

1. 目标或Position无效；
2. desiredRange无效；
3. 已经在范围；
4. `moveTo()` 返回 `ERR_NO_PATH`；
5. `noPathFinding` 返回 `ERR_NOT_FOUND`；
6. `PathFinder.search()` 为 `incomplete`；
7. 回调拒绝房间；
8. 范围外空路径；
9. 完整可用路径。

离线测试不能模拟真实地形、CostMatrix、跨房间出口、交通与CPU消耗。

## 适用边界

本文不覆盖：

- 完整多Creep交通系统；
- 战斗寻路；
- 动态危险矩阵；
- Highway和Portal规划；
- 多Shard路线；
- 路径长期缓存格式；
- 性能结论。

JavaScript语法和离线路径分类已检查，真实地图与PathFinder结果仍待Screeps环境验证。

## 相关站内内容

- [moveTo()返回OK但不移动](/blog/screeps-moveto-not-moving)
- [ERR_NOT_IN_RANGE怎么处理](/blog/screeps-err-not-in-range)
- [PathFinder.search怎么自定义成本](/blog/screeps-pathfinder-costmatrix)
- [跨房间路线怎么规划](/blog/screeps-map-find-route)
- [RoomPosition距离方法有什么区别](/blog/screeps-roomposition-distance)
- [错误码索引](/screeps-errors)

## 官方资料

- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [PathFinder API](https://docs.screeps.com/api/#PathFinder)
- [PathFinder.search API](https://docs.screeps.com/api/#PathFinder.search)
- [Game.map.findRoute API](https://docs.screeps.com/api/#Game-map-findRoute)
- [RoomPosition.findPathTo API](https://docs.screeps.com/api/#RoomPosition.findPathTo)

资料核对日期：2026-07-22。离线路径分类已通过；真实寻路仍待Screeps环境验证。
