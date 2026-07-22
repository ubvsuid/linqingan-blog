---
title: "Screeps Mineral 怎么开采：Extractor、cooldown 与返回值"
description: "确认RCL6、Mineral储量、同格Extractor、结构状态和Creep容量后调用harvest(mineral)，并处理ERR_NOT_FOUND、ERR_TIRED与再生周期。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Mineral"
  - "Extractor"
  - "资源采集"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Mineral储量、Extractor位置与状态、cooldown、WORK部件和Store容量，不是Screeps官方服务器）"
  testResult: "Mineral缺失、矿量耗尽、Extractor缺失或错位、结构不可用、cooldown、无WORK、容量不足和可采集场景通过。"
featured: false
---

Mineral不能像Source一样在游戏前期直接开采。己方房间达到RCL6后，先在Mineral所在坐标建成Extractor，再让有有效 `WORK` 部件的Creep与Mineral相邻并调用：

```js
creep.harvest(mineral)
```

本文只处理基础矿物开采，不包含运输、Lab反应、Boost或市场处理。

## 官方前置条件

开采Mineral至少需要：

1. 当前能取得Mineral对象；
2. Mineral的 `mineralAmount` 大于0；
3. Mineral坐标上存在Extractor；
4. Extractor属于自己并且 `isActive()` 为真；
5. Extractor的 `cooldown` 为0；
6. Creep有有效 `WORK` 部件；
7. Creep的Store还能接收该矿物；
8. Creep与Mineral相邻。

Extractor在RCL6解锁。每次对Mineral成功安排一次 `harvest()` 后，Extractor会进入5tick的 `cooldown`。

## Mineral对象中的关键字段

```js
const mineral = room.find(FIND_MINERALS)[0];
```

需要关注：

```js
mineral.mineralType
mineral.mineralAmount
mineral.ticksToRegeneration
mineral.pos
```

含义：

- `mineralType`：当前房间的基础矿物类型；
- `mineralAmount`：当前剩余可采数量；
- `ticksToRegeneration`：矿物耗尽后的剩余再生tick；未处于再生阶段时可能为 `undefined`；
- `pos`：Extractor必须建在这个坐标。

Mineral耗尽后不会立即永久消失。官方常量规定基础再生周期为50000tick。代码应读取 `ticksToRegeneration`，而不是自己从某个旧tick倒计时。

## 怎样确认Extractor真的建在Mineral位置

房间内有Extractor不代表它对应当前Mineral。使用坐标查找更明确：

```js
function findExtractorForMineral(room, mineral) {
  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    mineral.pos.x,
    mineral.pos.y
  );

  return structures.find(structure =>
    structure.structureType === STRUCTURE_EXTRACTOR
  ) ?? null;
}
```

这样不会把房间搜索结果中的任意Extractor误认为目标结构。

## 用纯函数判断是否进入采集分支

```js
function evaluateMineralHarvest(input) {
  const {
    mineralExists,
    mineralAmount,
    extractorExists,
    extractorOnMineral,
    extractorOwned,
    extractorActive,
    extractorCooldown,
    activeWorkParts,
    freeCapacity,
    isNearMineral
  } = input;

  if (!mineralExists) {
    return { ready: false, reason: 'mineral-missing' };
  }

  if (!Number.isFinite(mineralAmount) || mineralAmount <= 0) {
    return { ready: false, reason: 'mineral-depleted' };
  }

  if (!extractorExists || !extractorOnMineral) {
    return { ready: false, reason: 'extractor-missing' };
  }

  if (!extractorOwned || !extractorActive) {
    return { ready: false, reason: 'extractor-inactive' };
  }

  if (!Number.isInteger(extractorCooldown) || extractorCooldown > 0) {
    return { ready: false, reason: 'extractor-not-ready' };
  }

  if (!Number.isInteger(activeWorkParts) || activeWorkParts <= 0) {
    return { ready: false, reason: 'no-active-work-part' };
  }

  if (!Number.isFinite(freeCapacity) || freeCapacity <= 0) {
    return { ready: false, reason: 'creep-full' };
  }

  if (!isNearMineral) {
    return { ready: false, reason: 'move-to-mineral' };
  }

  return { ready: true, reason: 'ready' };
}
```

这个函数只检查普通数据，不证明服务器动作会返回 `OK`。

## 完整示例

```js
function findExtractorForMineral(room, mineral) {
  const structures = room.lookForAt(
    LOOK_STRUCTURES,
    mineral.pos.x,
    mineral.pos.y
  );

  return structures.find(structure =>
    structure.structureType === STRUCTURE_EXTRACTOR
  ) ?? null;
}

function runMineralHarvester(creep) {
  if (creep.spawning === true) {
    return { status: 'creep-spawning' };
  }

  if (creep.getActiveBodyparts(WORK) <= 0) {
    return { status: 'no-active-work-part' };
  }

  const mineral = creep.room.find(FIND_MINERALS)[0];

  if (!mineral) {
    return { status: 'mineral-missing' };
  }

  if (mineral.mineralAmount <= 0) {
    return {
      status: 'mineral-depleted',
      ticksToRegeneration:
        mineral.ticksToRegeneration ?? null
    };
  }

  const free = creep.store.getFreeCapacity(
    mineral.mineralType
  );

  if (!Number.isFinite(free) || free <= 0) {
    return {
      status: 'creep-full',
      mineralType: mineral.mineralType
    };
  }

  const extractor = findExtractorForMineral(
    creep.room,
    mineral
  );

  if (!extractor) {
    return { status: 'extractor-missing' };
  }

  if (extractor.my !== true || !extractor.isActive()) {
    return {
      status: 'extractor-inactive',
      extractorId: extractor.id
    };
  }

  if (extractor.cooldown > 0) {
    return {
      status: 'extractor-not-ready',
      extractorId: extractor.id,
      cooldown: extractor.cooldown
    };
  }

  const result = creep.harvest(mineral);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(mineral, {
      range: 1,
      reusePath: 10
    });

    return {
      status: 'moving-to-mineral',
      mineralId: mineral.id,
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'mineral-harvest-submitted'
      : 'mineral-harvest-failed',
    mineralId: mineral.id,
    mineralType: mineral.mineralType,
    extractorId: extractor.id,
    result
  };
}

module.exports.loop = function () {
  const creep = Game.creeps.Miner1;

  if (!creep) {
    return;
  }

  const outcome = runMineralHarvester(creep);

  if (outcome.status === 'mineral-harvest-failed') {
    console.log({
      type: 'mineral-harvest-failed',
      creepName: creep.name,
      roomName: creep.room.name,
      ...outcome
    });
  }
};
```

把 `Miner1` 换成真实Creep名称。

## `harvest(mineral)` 的返回值

| 返回值 | 在Mineral场景中的常见原因 | 处理方向 |
|---|---|---|
| `OK` | 采集命令已安排 | 下一tick读取Mineral、Store与Extractor |
| `ERR_NOT_OWNER` | Creep不属于自己，或房间控制状态不允许 | 检查对象与房间 |
| `ERR_BUSY` | Creep仍在生成 | 等生成完成 |
| `ERR_NOT_FOUND` | Mineral位置没有Extractor | 检查同格结构 |
| `ERR_NOT_ENOUGH_RESOURCES` | Mineral已经耗尽 | 读取 `mineralAmount` 与再生状态 |
| `ERR_INVALID_TARGET` | 目标不是Source、Mineral或Deposit | 检查对象类型 |
| `ERR_NOT_IN_RANGE` | Creep不相邻 | 移动到范围1 |
| `ERR_TIRED` | Extractor的 `cooldown` 尚未归零 | 等待后重试 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 检查身体受伤状态 |

Mineral采集时，`ERR_NOT_FOUND` 专门提示Extractor缺失；不要把它解释成“没有找到Mineral对象”。

## 采出的矿物放在哪里

官方 `harvest()` 规则与Energy采集一致：

- Creep有空的CARRY容量时，资源进入Store；
- 没有可用容量时，采出的资源可能掉到地面。

本文在调用前检查目标矿物类型的剩余容量，避免主动制造地面掉落物。

## 多个WORK部件与Extractor的关系

有效WORK越多，单次采集能力越高；但Extractor每次采集后仍会进入 `cooldown`。

这意味着大型Miner可能：

- 单次采出更多；
- 更快装满；
- 仍然需要等待Extractor；
- 需要配套运输，避免Store满后停工。

身体设计需要结合矿量、道路、运输距离和Mineral用途，不能只追求WORK数量。

## 常见错误

### 房间达到RCL6就直接采Mineral

还必须在Mineral坐标建成Extractor。

### 只检查房间里存在Extractor

应确认Extractor与Mineral位于同一个坐标。

### 忽略 `isActive()`

Controller等级变化后，结构可能存在但当前不可用。

### 把Mineral耗尽当成Extractor缺失

分别处理 `ERR_NOT_ENOUGH_RESOURCES` 和 `ERR_NOT_FOUND`。

### `cooldown` 大于0时持续调用

会重复得到 `ERR_TIRED`。等待归零后再提交。

### Creep容量已满仍继续采集

先检查目标矿物类型的Store空位，并安排运输。

### 把再生周期写成自己的倒计时

优先读取 `ticksToRegeneration`，避免Memory与真实对象状态偏离。

## 离线模拟结果

构建检查覆盖：

1. Mineral缺失；
2. `mineralAmount` 为0；
3. Extractor缺失或不在Mineral坐标；
4. Extractor不属于自己或不可用；
5. `cooldown` 大于0；
6. 没有有效WORK部件；
7. Creep没有剩余容量；
8. 距离不足；
9. 满足全部条件。

离线测试不能模拟官方Mineral再生、Extractor `cooldown` 变化、实际采矿量或Store结算。

## 适用边界

本文不覆盖：

- Extractor工地创建；
- Mineral运输与Container布局；
- Lab反应链；
- Boost生产；
- Terminal调度；
- Deposit资源；
- 多房间矿物供应；
- 采矿效率比较。

JavaScript语法和离线前置条件已检查，真实Mineral采集与再生仍待Screeps环境验证。

## 相关站内内容

- [如何从Container取Energy](/blog/screeps-creep-withdraw-container-energy)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [Lab怎么运行Reaction](/blog/screeps-lab-reaction-basics)
- [Terminal怎么发送资源](/blog/screeps-terminal-send-resource)
- [Creep身体部件怎么看](/blog/screeps-creep-body-parts)
- [进入资源采集与房间经济专题](/knowledge/room-economy)

## 官方资料

- [Resources：Minerals](https://docs.screeps.com/resources.html#Minerals)
- [StructureExtractor API](https://docs.screeps.com/api/#StructureExtractor)
- [Mineral API](https://docs.screeps.com/api/#Mineral)
- [Creep.harvest API](https://docs.screeps.com/api/#Creep.harvest)
- [Control：RCL structures](https://docs.screeps.com/control.html)

资料核对日期：2026-07-22。离线条件判断已通过；真实矿物采集仍待环境验证。
