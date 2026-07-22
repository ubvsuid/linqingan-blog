---
title: "RoomPosition 距离方法怎么选：range、相邻、同格与路径"
description: "比较getRangeTo、inRangeTo、isNearTo、isEqualTo、findClosestByRange和findClosestByPath，区分线性距离与真实可达路径。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "RoomPosition"
  - "距离"
  - "寻路"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（同房间坐标、线性range、同格、相邻、范围判断和候选排序，不是Screeps官方服务器）"
  testResult: "横向、纵向、对角线、同格、范围1与3、跨房间拒绝、范围最近和路径字段独立场景通过。"
featured: false
---

RoomPosition中的“距离”至少有两种含义：

- 线性range：只比较坐标关系；
- 路径距离：考虑地形、建筑、出口和寻路配置。

选择错误会出现两类问题：

- 目标range很近，但实际被自然墙体或建筑隔开；
- 只想判断动作范围，却每tick运行完整寻路。

## 五个最常用的位置判断

### `getRangeTo()`：返回线性格数

```js
const range = creep.pos.getRangeTo(target);
```

它返回同房间两个位置的线性range，不计算地形或障碍物。

在Screeps网格中，对角方向也可以一步移动，因此：

```text
(10, 10) → (11, 11)
range = 1

(10, 10) → (13, 12)
range = 3
```

同房间的等价计算是：

```js
Math.max(
  Math.abs(from.x - to.x),
  Math.abs(from.y - to.y)
)
```

### `inRangeTo()`：是否在指定范围内

```js
if (creep.pos.inRangeTo(controller, 3)) {
  // 已在Controller升级范围内
}
```

它等价于判断：

```js
creep.pos.getRangeTo(controller) <= 3
```

但表达业务意图更直接。

### `isNearTo()`：是否相邻

```js
creep.pos.isNearTo(container)
```

官方文档说明，它等同于：

```js
creep.pos.inRangeTo(container, 1)
```

注意同格位置也属于range 1以内。对于普通Creep与Structure，同格通常不会发生；对纯坐标判断时应理解这个布尔语义。

### `isEqualTo()`：是否完全同格

```js
creep.pos.isEqualTo(flag)
```

只有房间名、x和y对应同一位置时才为真。

适合：

- 站到指定空地；
- 检查固定工作位；
- 比较两个RoomPosition；
- 判断是否到达精确Flag坐标。

### `findClosestByRange()`：从候选中选线性最近

```js
const target = creep.pos.findClosestByRange(
  FIND_HOSTILE_CREEPS
);
```

它不保证存在可达路径。候选被障碍物隔开时，线性最近可能不是行动最方便的目标。

## 路径最近使用 `findClosestByPath()`

```js
const target = creep.pos.findClosestByPath(
  FIND_SOURCES_ACTIVE
);
```

它会运行寻路并返回最短路径候选；没有候选或没有可用路线时返回 `null`。

比较：

| 方法 | 考虑障碍与地形 | 常见用途 |
|---|---|---|
| `findClosestByRange()` | 否 | Tower目标、范围筛选、快速粗选 |
| `findClosestByPath()` | 是 | Creep需要真正走到目标 |
| `getRangeTo()` | 否 | 判断动作是否已在范围 |
| `findPathTo()` | 是 | 取得具体路径步骤 |

Tower覆盖整个房间，目标选择常可使用range；Creep需要移动时通常还要验证路径。

## 不要直接比较不同房间的位置

`inRangeTo()` 文档明确要求坐标位于同一房间。跨房间关系应先判断：

```js
if (from.roomName !== to.roomName) {
  // 使用 Game.map.findRoute、PathFinder 或 moveTo
}
```

不同房间不能用本地x/y差值表达世界路线。例如两个房间的 `(25, 25)` 并不是同一个位置。

## 用纯函数计算同房间range

```js
function getSameRoomRange(from, to) {
  if (
    !from
    || !to
    || from.roomName !== to.roomName
    || !Number.isInteger(from.x)
    || !Number.isInteger(from.y)
    || !Number.isInteger(to.x)
    || !Number.isInteger(to.y)
  ) {
    return null;
  }

  return Math.max(
    Math.abs(from.x - to.x),
    Math.abs(from.y - to.y)
  );
}

function describePositionRelation(from, to, range) {
  const currentRange = getSameRoomRange(from, to);

  if (currentRange === null) {
    return {
      comparable: false,
      samePosition: false,
      near: false,
      inRange: false,
      range: null
    };
  }

  return {
    comparable: true,
    samePosition: currentRange === 0,
    near: currentRange <= 1,
    inRange: currentRange <= range,
    range: currentRange
  };
}
```

纯函数适合验证坐标逻辑，但不会证明路径可达。

## 完整示例：根据动作要求判断是否移动

```js
const ACTION_RANGES = {
  harvest: 1,
  withdraw: 1,
  transfer: 1,
  pickup: 1,
  build: 3,
  repair: 3,
  upgrade: 3
};

function getRequiredRange(action) {
  const range = ACTION_RANGES[action];

  return Number.isInteger(range)
    ? range
    : null;
}

function runPositionCheck(creep, target, action) {
  if (!creep || !target?.pos) {
    return {
      status: 'object-invalid'
    };
  }

  const requiredRange = getRequiredRange(action);

  if (requiredRange === null) {
    return {
      status: 'action-range-unknown',
      action
    };
  }

  if (creep.pos.roomName !== target.pos.roomName) {
    const moveResult = creep.moveTo(target, {
      range: requiredRange,
      reusePath: 10
    });

    return {
      status: 'cross-room-move-submitted',
      action,
      requiredRange,
      moveResult
    };
  }

  const range = creep.pos.getRangeTo(target);

  if (range <= requiredRange) {
    return {
      status: 'action-range-ready',
      action,
      requiredRange,
      range
    };
  }

  const moveResult = creep.moveTo(target, {
    range: requiredRange,
    reusePath: 10
  });

  return {
    status: moveResult === OK
      ? 'move-submitted'
      : 'move-failed',
    action,
    requiredRange,
    range,
    moveResult
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.WorkTarget;

  if (!creep || !target) {
    return;
  }

  const outcome = runPositionCheck(
    creep,
    target,
    'repair'
  );

  if (outcome.status === 'move-failed') {
    console.log({
      type: 'position-check-move-failed',
      creepName: creep.name,
      ...outcome
    });
  }
};
```

动作范围表属于本文明确列出的基础动作。加入其他API前应单独核对官方距离要求。

## 为什么range不能判断可达性

以下两个位置可能只有range 2：

```text
Creep  □  Target
```

但中间可能存在：

- 自然墙体；
- 不可通行Structure；
- 关闭的敌对Rampart；
- 房间边缘与出口限制；
- CostMatrix禁止格；
- 临时Creep交通。

`getRangeTo()`仍会返回2。需要移动时，应使用 `moveTo()`、`findPathTo()` 或 `PathFinder.search()`。

## 范围3不等于路径长度3

Creep与Controller的range为3时可以升级，即使绕路走到这个位置需要很多tick。

动作范围回答“现在能否执行”，路径长度回答“怎样到达”。两者不能互相替代。

## `findInRange()` 适合批量筛选

```js
const hostiles = tower.pos.findInRange(
  FIND_HOSTILE_CREEPS,
  10
);
```

它返回指定线性range内的全部候选，不进行路径判断。

适合：

- 范围内敌人；
- 周围受伤Creep；
- 邻近建筑；
- 候选集预过滤。

筛选后仍可按生命值、角色或其他业务规则排序。

## 常见错误

### 用range判断目标可达

range忽略地形和建筑。

### 用路径搜索判断动作范围

已经在范围3时不需要继续寻路到相邻格。

### 跨房间只比较x和y

先比较 `roomName`，再使用地图或跨房间寻路。

### 把 `isNearTo()` 当成严格不同格

它等价于range不超过1。需要严格相邻且不同格时，还要排除 `isEqualTo()`。

### `findClosestByRange()` 后不判空

候选为空时返回 `null`。

### 所有动作都写范围1

建造、维修和升级Controller可在范围3执行。

### 当前tick移动后重新计算新位置

位置更新在后续tick观察。

## 离线模拟结果

构建检查覆盖：

1. 同格range 0；
2. 横向与纵向距离；
3. 对角线一步range 1；
4. `(10,10)` 到 `(13,12)` range 3；
5. `isNearTo` 等价范围1；
6. 范围3判断；
7. 不同房间返回不可比较；
8. 候选按range稳定排序；
9. range与路径字段独立。

离线测试不能模拟真实PathFinder、地形、出口或动作范围的服务器结算。

## 适用边界

本文不覆盖：

- 世界地图距离换算；
- Highway和Sector坐标；
- 完整CostMatrix；
- 多Creep交通；
- 战斗风筝距离；
- CPU性能比较；
- Portal路线。

JavaScript语法和同房间range计算已检查，真实路径与动作执行仍待Screeps环境验证。

## 相关站内内容

- [ERR_NOT_IN_RANGE怎么处理](/blog/screeps-err-not-in-range)
- [moveTo()返回OK但不移动](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [PathFinder.search怎么自定义成本](/blog/screeps-pathfinder-costmatrix)
- [跨房间路线怎么规划](/blog/screeps-map-find-route)
- [进入移动、寻路与视野专题](/knowledge/movement-vision)

## 官方资料

- [RoomPosition API](https://docs.screeps.com/api/#RoomPosition)
- [RoomPosition.getRangeTo API](https://docs.screeps.com/api/#RoomPosition.getRangeTo)
- [RoomPosition.inRangeTo API](https://docs.screeps.com/api/#RoomPosition.inRangeTo)
- [RoomPosition.isNearTo API](https://docs.screeps.com/api/#RoomPosition.isNearTo)
- [RoomPosition.findClosestByPath API](https://docs.screeps.com/api/#RoomPosition.findClosestByPath)

资料核对日期：2026-07-22。离线同房间range已检查；真实路径与动作仍待Screeps环境验证。
