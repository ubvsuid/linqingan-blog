---
title: "Screeps MOVE 部件怎么配：fatigue、地形与负载"
description: "解释道路、平地和沼泽产生的fatigue，计算有效MOVE部件的恢复能力，并比较空CARRY、满载运输和受伤后的移动频率。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "MOVE"
  - "fatigue"
  - "Creep Body"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（有效MOVE、负载部件、道路、平地、沼泽和移动间隔估算，不是Screeps官方服务器）"
  testResult: "无MOVE、1:1平地、道路低成本、沼泽高成本、空CARRY减负、满载CARRY计入和MOVE受伤场景通过。"
featured: false
---

Creep能否每tick移动，取决于有效MOVE部件能消除多少 `fatigue`，以及本次移动在当前地形上产生多少fatigue。

基础规则：

- 道路移动成本为1；
- 平地移动成本为2；
- 沼泽移动成本为10；
- 每个有效MOVE部件每tick减少2点fatigue；
- 没有携带资源的CARRY部件不产生移动fatigue；
- 受伤到0 hits的MOVE不再提供恢复能力。

本文只做未强化身体的基础估算。Boost会改变MOVE恢复能力，需要另外计算。

## 为什么1个MOVE配1个非MOVE适合平地

假设身体：

```js
[WORK, CARRY, MOVE]
```

满载时需要搬动两个非MOVE部件：WORK和CARRY。

平地每个负载部件产生2点fatigue：

```text
2个负载部件 × 2 = 4 fatigue
```

1个MOVE每tick减少2点，因此这只Creep通常需要额外tick消除fatigue，不能保持平地每tick移动。

如果身体是：

```js
[WORK, CARRY, MOVE, MOVE]
```

2个MOVE每tick减少4点，能够覆盖该满载身体在平地的一步fatigue。

## 道路、平地与沼泽的差异

设：

- `loadParts`：本次会产生fatigue的部件数量；
- `activeMoveParts`：有效MOVE数量；
- `terrainCost`：道路1、平地2、沼泽10；
- 每个MOVE基础恢复2。

本地估算：

```text
fatigueGenerated = loadParts × terrainCost
fatigueRecoveredPerTick = activeMoveParts × 2
```

达到每tick移动的基础条件：

```text
fatigueRecoveredPerTick >= fatigueGenerated
```

因此同一身体在道路上可能每tick移动，在沼泽上却需要等待多个tick。

## 空CARRY为什么不产生fatigue

官方移动规则说明，没有装资源的CARRY部件不会增加fatigue。

例如：

```js
[CARRY, CARRY, MOVE]
```

空载时两个CARRY不计入负载，移动很快；装满后两个CARRY都计入，移动频率下降。

## 计算有效负载部件

```js
function countLoadedCarryParts(body, usedCapacity) {
  if (!Array.isArray(body) || usedCapacity <= 0) {
    return 0;
  }

  const activeCarryParts = body.filter(part =>
    part.type === CARRY
    && part.hits > 0
  ).length;

  return Math.min(
    activeCarryParts,
    Math.ceil(usedCapacity / CARRY_CAPACITY)
  );
}

function countFatigueGeneratingParts(body, usedCapacity) {
  const loadedCarryParts = countLoadedCarryParts(
    body,
    usedCapacity
  );
  let nonMoveNonCarryParts = 0;

  for (const part of body) {
    if (part.hits <= 0 || part.type === MOVE) {
      continue;
    }

    if (part.type !== CARRY) {
      nonMoveNonCarryParts += 1;
    }
  }

  return nonMoveNonCarryParts + loadedCarryParts;
}
```

## 估算移动间隔

```js
const TERRAIN_MOVE_COST = {
  road: 1,
  plain: 2,
  swamp: 10
};

function estimateMovement(input) {
  const {
    activeMoveParts,
    loadParts,
    terrain
  } = input;

  const terrainCost = TERRAIN_MOVE_COST[terrain];

  if (
    !Number.isInteger(activeMoveParts)
    || activeMoveParts <= 0
    || !Number.isInteger(loadParts)
    || loadParts < 0
    || !Number.isInteger(terrainCost)
  ) {
    return {
      movable: false,
      reason: 'invalid-input'
    };
  }

  const fatigueGenerated = loadParts * terrainCost;
  const fatigueRecoveredPerTick = activeMoveParts * 2;
  const ticksPerStep = Math.max(
    1,
    Math.ceil(
      fatigueGenerated / fatigueRecoveredPerTick
    )
  );

  return {
    movable: true,
    reason: 'ready',
    fatigueGenerated,
    fatigueRecoveredPerTick,
    ticksPerStep,
    movesEveryTick:
      fatigueRecoveredPerTick >= fatigueGenerated
  };
}
```

`ticksPerStep`是静态估算，不包含旧fatigue、其他Creep阻挡、pull、MOVE Boost、路径变化或服务器并发结算。

## 完整诊断示例

```js
const TERRAIN_MOVE_COST = {
  road: 1,
  plain: 2,
  swamp: 10
};

function getTerrainName(room, position) {
  const terrain = room.getTerrain().get(
    position.x,
    position.y
  );
  const hasRoad = room.lookForAt(
    LOOK_STRUCTURES,
    position.x,
    position.y
  ).some(structure =>
    structure.structureType === STRUCTURE_ROAD
  );

  if (hasRoad) {
    return 'road';
  }

  if (terrain === TERRAIN_MASK_SWAMP) {
    return 'swamp';
  }

  return 'plain';
}

function countLoadedCarryParts(creep) {
  const usedCapacity = creep.store.getUsedCapacity();
  const activeCarryParts = creep.body.filter(part =>
    part.type === CARRY
    && part.hits > 0
  ).length;

  if (usedCapacity <= 0) {
    return 0;
  }

  return Math.min(
    activeCarryParts,
    Math.ceil(usedCapacity / CARRY_CAPACITY)
  );
}

function countLoadParts(creep) {
  const loadedCarryParts = countLoadedCarryParts(creep);
  const otherParts = creep.body.filter(part =>
    part.hits > 0
    && part.type !== MOVE
    && part.type !== CARRY
  ).length;

  return loadedCarryParts + otherParts;
}

function diagnoseMovement(creep) {
  const activeMoveParts = creep.getActiveBodyparts(MOVE);
  const loadParts = countLoadParts(creep);
  const terrain = getTerrainName(
    creep.room,
    creep.pos
  );
  const terrainCost = TERRAIN_MOVE_COST[terrain];

  if (activeMoveParts <= 0) {
    return {
      status: 'no-active-move-part',
      activeMoveParts,
      loadParts,
      terrain,
      fatigue: creep.fatigue
    };
  }

  const fatigueGenerated = loadParts * terrainCost;
  const fatigueRecoveredPerTick = activeMoveParts * 2;

  return {
    status: 'movement-estimated',
    activeMoveParts,
    loadParts,
    terrain,
    fatigue: creep.fatigue,
    fatigueGenerated,
    fatigueRecoveredPerTick,
    estimatedTicksPerStep: Math.max(
      1,
      Math.ceil(
        fatigueGenerated / fatigueRecoveredPerTick
      )
    )
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Hauler1;

  if (!creep) {
    return;
  }

  if (Game.time % 25 === 0) {
    console.log({
      type: 'movement-body-diagnostic',
      creepName: creep.name,
      ...diagnoseMovement(creep)
    });
  }
};
```

日志频率25tick只是示例，不是官方推荐值。

## 常见身体比例

### 主要走道路的运输者

道路成本低，基础目标通常是：

```text
1 MOVE : 2个满载负载部件
```

例如：

```js
[CARRY, CARRY, MOVE]
```

### 主要走平地

基础目标通常是：

```text
1 MOVE : 1个满载负载部件
```

两个CARRY满载时，通常需要两个MOVE覆盖平地fatigue。

### 经常穿越沼泽

未强化身体要保持沼泽每tick移动，需要大量MOVE。常见选择是修道路、调整路线、接受较慢速度、使用合适Boost或减少负载。

## 受伤后为什么突然变慢

`getActiveBodyparts(MOVE)`只统计hits大于0的MOVE。MOVE损坏后：

- fatigue恢复速度下降；
- 原本每tick移动的身体开始等待；
- `moveTo()`可能返回 `ERR_TIRED`；
- 身体总部件数没有变化，但有效能力已经变化。

## 常见错误

### 只按身体数组统计MOVE

使用 `getActiveBodyparts(MOVE)`。

### 把所有CARRY都算作负载

空CARRY不增加fatigue，应结合Store占用估算。

### 只看平地比例

道路、平地和沼泽成本分别为1、2、10。

### 看到Creep不动就只增加MOVE

目标、路径、交通、fatigue和命令覆盖都可能造成不动。

### 把静态公式写成真实速度证明

真实路线需要连续多tick记录位置、地形、Store和fatigue。

### 忽略Boost

强化MOVE会改变恢复能力，本文公式只处理未强化MOVE。

## 离线模拟结果

构建检查覆盖：

1. 没有有效MOVE；
2. 道路、平地、沼泽成本；
3. 1 MOVE与1个负载部件的平地情况；
4. 道路上1 MOVE带2个负载部件；
5. 沼泽高fatigue；
6. 空CARRY不计负载；
7. 满载CARRY计入负载；
8. MOVE受伤后恢复能力下降；
9. 输入异常。

离线测试不能模拟实际地形路径、交通、Boost、pull和服务器fatigue结算。

## 适用边界

本文不覆盖MOVE Boost精确倍率、pull链、多Creep交通、战斗身体顺序、路线铺设、跨房间平均速度和Spawn吞吐优化。

JavaScript语法和离线fatigue估算已检查，真实移动频率仍待Screeps环境验证。

## 相关站内内容

- [Creep身体计算器](/tools/creep-body-calculator)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [moveTo()返回OK但不移动](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [RoomPosition距离方法有什么区别](/blog/screeps-roomposition-distance)
- [进入移动、寻路与视野专题](/knowledge/movement-vision)

## 官方资料

- [Creeps：Movement](https://docs.screeps.com/creeps.html#Movement)
- [Creep.fatigue API](https://docs.screeps.com/api/#Creep-fatigue)
- [Creep.getActiveBodyparts API](https://docs.screeps.com/api/#Creep.getActiveBodyparts)
- [Constants：Terrain与CARRY_CAPACITY](https://docs.screeps.com/api/#Constants)

资料核对日期：2026-07-22。离线fatigue估算已通过；真实移动频率仍待环境验证。
