---
title: "Screeps MOVE 部件怎么配：fatigue、地形与负载"
description: "解释 Screeps 道路、平地、沼泽产生的 fatigue，正确区分 active MOVE 恢复、普通 body 重量和实际装载 CARRY，并排查受伤后移动变慢。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-16"
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
  checkedAt: "2026-08-16"
  testedAt: "2026-08-16"
  testEnvironment: "Node.js 22 离线模拟（active MOVE、普通 body entry 重量、实际装载 CARRY、道路/平地/沼泽与受伤场景，不是 Screeps 官方服务器）"
  testResult: "损坏普通非MOVE/CARRY仍计重、损坏MOVE不恢复、损坏CARRY不提供装载重量、空/满载CARRY、三类地形和移动间隔估算通过。"
featured: false
---

Creep 能不能每 tick 移动，不能只看“有几个 `MOVE`”。至少要把三件事分开：

1. **这一步会产生多少 fatigue**；
2. **当前还有多少有效 `MOVE` 能恢复 fatigue**；
3. **CARRY 当前到底装了多少资源**。

这篇只处理**未强化 MOVE / CARRY** 的基础模型。Boost、pull 链和多 Creep 交通会改变结果，放到对应专题中处理。

## 一、先记住基础数字

普通移动的基础地形成本：

| 目标格 | fatigue 系数 |
| --- | ---: |
| Road | `1` |
| Plain | `2` |
| Swamp | `10` |

每个仍然有效的普通 `MOVE` 部件，每 tick 基础恢复：

```text
2 fatigue
```

因此一个静态估算可以写成：

```text
fatigueGenerated = weightParts × terrainCost
fatigueRecoveredPerTick = activeMoveParts × 2
```

但真正容易写错的是 `weightParts` 到底怎样数。

## 二、移动重量不是“所有 hits > 0 的非 MOVE 部件”

旧版文章曾经把普通部件写成类似：

```javascript
if (part.hits <= 0 || part.type === MOVE) {
  continue;
}
```

这会产生一个错误结论：

> WORK、ATTACK、TOUGH 等普通部件一旦损坏到 0 hits，就不再产生移动重量。

当前官方 engine 的移动结算不是这样。

对于普通 Creep，基础移动重量可以拆成：

```text
普通非 MOVE / 非 CARRY body entry
+
当前实际承载资源所需要的有效 CARRY 部件数量
```

其中最关键的一条是：

> **普通非 `MOVE` / 非 `CARRY` 部件：无论当前 hits 是否为 0，仍按 body entry 计入移动重量。**

也就是说，一个已经损坏到 0 hits 的 `WORK` 不再提供工作能力，但它仍然留在 body 数组中，并继续参与这部分移动重量计算。

## 三、MOVE 恢复能力却要看 active body part

重量和恢复能力的规则不是同一套。

`MOVE` 是否还能恢复 fatigue，要看它是否仍然有效：

```javascript
const activeMoveParts =
  creep.getActiveBodyparts(MOVE);
```

损坏到 0 hits 的 `MOVE`：

- 仍然存在于 `creep.body`；
- 但不再提供 fatigue 恢复能力。

因此受伤以后，可能同时发生：

```text
普通负重部件数量几乎没变
+
有效 MOVE 数量下降
=
移动明显变慢
```

这也是为什么“把所有 hits=0 部件都从重量里删掉”会低估受伤 Creep 的真实移动压力。

## 四、CARRY 是特殊情况：空 CARRY 不产生资源重量

`CARRY` 不能和 `WORK`、`ATTACK`、`TOUGH` 一样直接按 body entry 全部计重。

当前移动模型会根据 Creep Store 中实际携带的资源，计算需要多少仍有效的 `CARRY` 容量来承载这些资源。

基础未强化 CARRY 的容量是：

```text
50
```

因此：

```text
0 资源
→ 0 个 loaded CARRY 计重

1—50 资源
→ 1 个 loaded CARRY 计重

51—100 资源
→ 2 个 loaded CARRY 计重
```

上限不能超过当前仍有效的 `CARRY` 数量。

损坏到 0 hits 的 `CARRY` 不再提供有效承载容量，因此也不应被当成“loaded CARRY capacity”来计算。

## 五、正确拆开三种 body 角色

可以把 body 对移动的影响分成三组：

| body 类型 | hits=0 后怎样处理 | 对本文模型的作用 |
| --- | --- | --- |
| `MOVE` | 不再算 active MOVE | 决定 fatigue 恢复能力 |
| `CARRY` | 不再提供有效承载容量 | 只按实际装载所占用的有效 CARRY 计重 |
| 其他部件 | **仍然计入普通重量** | 每个 body entry 产生基础移动重量 |

这是这篇最重要的技术边界。

## 六、计算 loaded CARRY

本文只处理未强化 CARRY，所以可以使用下面的基础函数：

```javascript
function countLoadedCarryParts(
  body,
  usedCapacity
) {
  if (
    !Array.isArray(body)
    || !Number.isFinite(usedCapacity)
    || usedCapacity <= 0
  ) {
    return 0;
  }

  const activeCarryParts = body.filter(part =>
    part.type === CARRY
    && part.hits > 0
  ).length;

  return Math.min(
    activeCarryParts,
    Math.ceil(
      usedCapacity / CARRY_CAPACITY
    )
  );
}
```

这里要注意两个点：

- `usedCapacity` 应该是整个 Store 当前实际携带的资源总量，而不只是 Energy；
- CARRY Boost 会改变容量，本文公式不覆盖 Boost。

实际 Creep 可以读取：

```javascript
const usedCapacity =
  creep.store.getUsedCapacity();
```

## 七、正确计算基础 weight parts

普通非 MOVE / 非 CARRY 部分**不要检查 hits**：

```javascript
function countOrdinaryWeightParts(body) {
  if (!Array.isArray(body)) {
    return 0;
  }

  return body.filter(part =>
    part.type !== MOVE
    && part.type !== CARRY
  ).length;
}
```

然后加上 loaded CARRY：

```javascript
function countFatigueGeneratingParts(
  body,
  usedCapacity
) {
  return (
    countOrdinaryWeightParts(body)
    + countLoadedCarryParts(
      body,
      usedCapacity
    )
  );
}
```

这才符合当前官方 engine 的基础分层：

```text
所有普通非 MOVE / 非 CARRY body entry
+
实际承载资源所占用的有效 CARRY
```

## 八、一个受伤例子最容易看出差异

假设：

```javascript
[
  { type: WORK, hits: 0 },
  { type: CARRY, hits: 100 },
  { type: MOVE, hits: 100 }
]
```

并且 Store 中有：

```text
50 资源
```

那么基础重量不是 `1`，而是：

```text
损坏 WORK body entry：1
loaded CARRY：1
总 weightParts：2
```

有效 MOVE：

```text
1
```

如果移动到 plain：

```text
fatigueGenerated = 2 × 2 = 4
fatigueRecoveredPerTick = 1 × 2 = 2
```

因此它不能按“1 个有效负载 + 1 MOVE”的模型去估算。

## 九、道路、平地与沼泽的差异

基础地形系数：

```javascript
const TERRAIN_MOVE_COST = {
  road: 1,
  plain: 2,
  swamp: 10
};
```

估算函数：

```javascript
function estimateMovement(input) {
  const {
    activeMoveParts,
    loadParts,
    terrain
  } = input;

  const terrainCost =
    TERRAIN_MOVE_COST[terrain];

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

  const fatigueGenerated =
    loadParts * terrainCost;

  const fatigueRecoveredPerTick =
    activeMoveParts * 2;

  return {
    movable: true,
    reason: 'ready',
    fatigueGenerated,
    fatigueRecoveredPerTick,
    estimatedTicksPerStep: Math.max(
      1,
      Math.ceil(
        fatigueGenerated
        / fatigueRecoveredPerTick
      )
    ),
    movesEveryTick:
      fatigueRecoveredPerTick
        >= fatigueGenerated
  };
}
```

这里的 `estimatedTicksPerStep` 只是**静态基础估算**，不是实际路线速度证明。

它没有包含：

- 已经积累的旧 fatigue；
- MOVE / CARRY Boost；
- pull；
- 多 Creep 竞争；
- 目标格变化；
- 路径阻挡；
- 房间边界特殊结算。

## 十、完整只读诊断示例

```javascript
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
    structure.structureType
      === STRUCTURE_ROAD
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
  const usedCapacity =
    creep.store.getUsedCapacity();

  if (usedCapacity <= 0) {
    return 0;
  }

  const activeCarryParts =
    creep.body.filter(part =>
      part.type === CARRY
      && part.hits > 0
    ).length;

  return Math.min(
    activeCarryParts,
    Math.ceil(
      usedCapacity / CARRY_CAPACITY
    )
  );
}

function countOrdinaryWeightParts(creep) {
  return creep.body.filter(part =>
    part.type !== MOVE
    && part.type !== CARRY
  ).length;
}

function countLoadParts(creep) {
  return (
    countOrdinaryWeightParts(creep)
    + countLoadedCarryParts(creep)
  );
}

function diagnoseMovement(creep) {
  const activeMoveParts =
    creep.getActiveBodyparts(MOVE);

  const loadParts =
    countLoadParts(creep);

  const terrain = getTerrainName(
    creep.room,
    creep.pos
  );

  const terrainCost =
    TERRAIN_MOVE_COST[terrain];

  if (activeMoveParts <= 0) {
    return {
      status: 'no-active-move-part',
      activeMoveParts,
      loadParts,
      terrain,
      fatigue: creep.fatigue
    };
  }

  const fatigueGenerated =
    loadParts * terrainCost;

  const fatigueRecoveredPerTick =
    activeMoveParts * 2;

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
        fatigueGenerated
        / fatigueRecoveredPerTick
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

这个函数只读 body、Store、地形和 fatigue，不会修改 Creep 行为。

## 十一、为什么示例看“当前格”仍只是近似诊断

真正生成这一步 fatigue 的地形与移动结算有关。本文的诊断函数读取 Creep 当前所在位置，是为了方便你做周期性快照，不代表它可以单独复现 engine 对每一步目标格的完整结算。

如果要验证真实移动速度，应连续记录：

- `Game.time`；
- `creep.pos`；
- `creep.fatigue`；
- Store 使用量；
- active MOVE；
- 实际经过的 road/plain/swamp；
- `move()` / `moveTo()` 返回值。

## 十二、常见身体比例怎样理解

### 主要走道路的运输者

未强化、满载基础模型下，常见目标是：

```text
1 MOVE : 2 个 weight parts
```

例如：

```javascript
[CARRY, CARRY, MOVE]
```

满载时两个 CARRY 都计重，road 上产生：

```text
2 × 1 = 2 fatigue
```

一个 MOVE 基础恢复 2。

### 主要走平地

常见基础目标是：

```text
1 MOVE : 1 个 weight part
```

因为 plain 系数为 2，而一个普通 MOVE 基础恢复 2。

### 经常经过 swamp

未强化身体想在 swamp 保持高移动频率需要大量 MOVE。通常更应该同时考虑：

- 修 road；
- 改路线；
- 减少重量；
- 接受更慢速度；
- 使用合适 Boost。

## 十三、受伤后为什么可能突然慢很多

假设一个工作 Creep 的普通部件没有消失，只是部分 `WORK`、`MOVE` 损坏。

当前模型里：

- 损坏普通 `WORK` 仍继续计入普通重量；
- 损坏 `MOVE` 不再提供恢复；
- 损坏 `CARRY` 不再提供有效承载容量；
- Store 当前实际装载又决定多少 active CARRY 参与重量。

因此受伤可能造成一种不对称变化：

```text
重量下降很少
但恢复能力明显下降
```

这比“所有损坏部件都自动减重”更接近当前 engine 行为。

## 十四、常见错误

### 所有 hits=0 部件都从重量里删除

错误。普通非 MOVE / 非 CARRY body entry 仍参与基础重量。

### 只按 body 数组统计 MOVE

恢复能力应看：

```javascript
creep.getActiveBodyparts(MOVE)
```

### 把所有 CARRY 都固定算作重量

空 CARRY 不产生资源重量；需要结合 Store 实际使用量与有效 CARRY 容量。

### 把损坏 CARRY 当成可用承载容量

loaded CARRY 只应该从仍有效的 CARRY 中计算。

### 把 PathFinder 默认权重当成移动 fatigue 数字

PathFinder 的默认 plain/swamp 搜索权重与 Creep 实际移动 fatigue 是两个不同层级。本文的 `road=1 / plain=2 / swamp=10` 指移动 fatigue 基础系数。

### 看到不动就只增加 MOVE

目标、路径、交通、fatigue、命令覆盖和 `ERR_NO_PATH` 都可能造成不动。

### 把静态公式当成真实速度证明

真实移动应使用多 tick 位置与 fatigue 记录验证。

## 十五、离线模拟覆盖什么

仓库专用模拟覆盖：

1. 普通非 MOVE / 非 CARRY 部件正常计重；
2. 这些普通部件即使 `hits === 0` 仍计重；
3. `MOVE` 只有 hits > 0 才提供基础恢复；
4. 空 CARRY 不计 loaded weight；
5. 实际装载 1—50 / 51—100 资源分别需要 1 / 2 个未强化 active CARRY；
6. 损坏 CARRY 不提供 loaded capacity；
7. road / plain / swamp 的基础 fatigue 系数；
8. 受伤 WORK + loaded CARRY + active MOVE 的组合案例；
9. 输入异常。

离线测试不是官方 engine 模拟器，不能证明真实多 tick 路径、Boost、pull、交通竞争或服务器结算结果。

## 适用边界

本文不覆盖：

- MOVE Boost 精确倍率；
- CARRY Boost 容量；
- pull 链；
- 多 Creep 交通；
- 战斗 body 排列；
- 跨房间平均速度；
- Spawn 吞吐优化。

JavaScript 语法和基础重量模型由仓库门禁检查；真实移动频率仍待 Screeps 环境验证。

## 相关站内内容

- [Creep 身体计算器](/tools/creep-body-calculator)
- [Creep 身体部件怎么看](/blog/screeps-creep-body-parts)
- [`moveTo()` 返回 OK 但不移动](/blog/screeps-moveto-not-moving)
- [`ERR_NO_PATH` 怎么排查](/blog/screeps-err-no-path)
- [PathFinder CostMatrix 怎么设置](/blog/screeps-pathfinder-costmatrix)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [进入移动、寻路与视野专题](/knowledge/movement-vision)

## 官方资料

- [Creeps：Movement](https://docs.screeps.com/creeps.html#Movement)
- [Creep.fatigue API](https://docs.screeps.com/api/#Creep-fatigue)
- [Creep.getActiveBodyparts API](https://docs.screeps.com/api/#Creep.getActiveBodyparts)
- [Constants：Terrain 与 CARRY_CAPACITY](https://docs.screeps.com/api/#Constants)
- [官方 engine：movement intent processing](https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/processor/intents/movement.js)

资料核对日期：2026-08-16。本文核对到的官方 engine commit 为 `80977824199a596d174d392fd0cf8c458c21fcbd`；真实移动频率仍待 Screeps 环境验证。