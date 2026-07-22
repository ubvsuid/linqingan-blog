---
title: "Wall 和 Rampart 如何设置阶段性维修上限"
description: "为每个房间配置Wall和Rampart阶段性hits上限，优先选择耐久最低且距离更近的防御结构，并处理Creep.repair()资源、范围与部件返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Wall"
  - "Rampart"
  - "维修"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（配置上限、结构过滤、最弱目标与距离排序，不是Screeps官方服务器）"
  testResult: "配置无效、超过上限、非防御结构、最弱目标、同hits距离排序、Energy不足和无WORK部件场景通过。"
featured: false
---

Wall 与 Rampart 的 `hitsMax` 很高。若代码一直使用：

```js
structure.hits < structure.hitsMax
```

维修者可能长期只处理防御结构，消耗大量Energy，并挤压建造、升级和普通建筑维护。

本文只解决一个问题：怎样为一个房间设置阶段性防御耐久上限，并让维修Creep优先修复低于上限的最弱Wall或Rampart。

## 维修上限是房间策略

示例配置：

```js
Memory.defenseRepair ??= {};
Memory.defenseRepair.W1N1 = {
  enabled: true,
  hitsLimit: 100000
};
```

`100000`只是演示值，不是官方安全标准。

合理上限会受到以下因素影响：

- 当前RCL；
- 房间Energy收入；
- Tower与维修Creep数量；
- Rampart覆盖的建筑价值；
- 敌对活动；
- Storage储备；
- GCL与房间阶段；
- 维修与升级的优先级。

同一个固定数字不应直接复制到所有房间。

## 为什么优先修当前hits最低的目标

按最低 `hits` 排序可以提高最薄弱位置的绝对耐久，减少某一段防线明显低于其他位置的情况。

本文排序：

1. 当前hits更低者优先；
2. hits相同，距离维修Creep更近者优先；
3. 仍然相同，使用ID保持稳定顺序。

这不是完整的防线价值模型。覆盖Spawn的Rampart和边缘Wall可能价值不同，但需要额外布局数据。

## 可离线测试的目标选择

```js
function selectDefenseRepairTarget(
  creep,
  structures,
  hitsLimit
) {
  if (!Number.isFinite(hitsLimit) || hitsLimit <= 0) {
    return null;
  }

  const candidates = structures.filter(structure =>
    (
      structure.structureType === STRUCTURE_WALL
      || structure.structureType === STRUCTURE_RAMPART
    )
    && Number.isFinite(structure.hits)
    && structure.hits < structure.hitsMax
    && structure.hits < hitsLimit
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    if (left.hits !== right.hits) {
      return left.hits - right.hits;
    }

    const rangeDifference =
      creep.pos.getRangeTo(left)
      - creep.pos.getRangeTo(right);

    if (rangeDifference !== 0) {
      return rangeDifference;
    }

    return left.id.localeCompare(right.id);
  })[0];
}
```

## 完整示例

代码放入现有 `main` 模块。把房间名和Creep名换成自己的对象。

```js
function selectDefenseRepairTarget(
  creep,
  structures,
  hitsLimit
) {
  if (!Number.isFinite(hitsLimit) || hitsLimit <= 0) {
    return null;
  }

  const candidates = structures.filter(structure =>
    (
      structure.structureType === STRUCTURE_WALL
      || structure.structureType === STRUCTURE_RAMPART
    )
    && Number.isFinite(structure.hits)
    && structure.hits < structure.hitsMax
    && structure.hits < hitsLimit
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    if (left.hits !== right.hits) {
      return left.hits - right.hits;
    }

    const rangeDifference =
      creep.pos.getRangeTo(left)
      - creep.pos.getRangeTo(right);

    if (rangeDifference !== 0) {
      return rangeDifference;
    }

    return left.id.localeCompare(right.id);
  })[0];
}

function runDefenseRepair(room, creep) {
  const config = Memory.defenseRepair?.[room.name];

  if (
    !config
    || config.enabled !== true
    || !Number.isFinite(config.hitsLimit)
    || config.hitsLimit <= 0
  ) {
    return;
  }

  if (
    creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0
    || creep.getActiveBodyparts(WORK) === 0
  ) {
    return;
  }

  const structures = room.find(FIND_STRUCTURES);
  const target = selectDefenseRepairTarget(
    creep,
    structures,
    config.hitsLimit
  );

  if (!target) {
    return;
  }

  const result = creep.repair(target);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(target, {
      reusePath: 5,
      range: 3
    });

    if (moveResult !== OK && Game.time % 20 === 0) {
      console.log({
        type: 'defense-repair-move-failed',
        creep: creep.name,
        targetId: target.id,
        result: moveResult
      });
    }
    return;
  }

  if (result !== OK) {
    console.log({
      type: 'defense-repair-failed',
      roomName: room.name,
      creep: creep.name,
      targetId: target.id,
      targetType: target.structureType,
      targetHits: target.hits,
      hitsLimit: config.hitsLimit,
      result
    });
  }
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  const creep = Game.creeps.Repairer1;

  if (!room || !creep || creep.room.name !== room.name) {
    return;
  }

  runDefenseRepair(room, creep);
};
```

## 为什么移动范围使用3

`Creep.repair()`的有效范围是3格。示例使用：

```js
range: 3
```

避免 `moveTo()`把维修者强制移动到目标相邻格。

道路、其他Creep和房间布局仍可能让路径失败，所以移动返回值也需要保存。

## 为什么检查有效WORK部件

Creep身体中存在 `WORK` 不代表当前仍有可用部件。受伤后部件可能失效。

```js
creep.getActiveBodyparts(WORK)
```

比只检查身体数组中是否出现 `WORK` 更准确。

基础维修能力由官方常量 `REPAIR_POWER`定义。Boost可能提高每次动作效果，本文不做精确维修量预测。

## 达到上限后为什么停止

筛选条件同时检查：

```js
structure.hits < hitsLimit
structure.hits < structure.hitsMax
```

即使玩家把 `hitsLimit`设置得高于当前 `hitsMax`，代码也不会继续对已经满耐久的结构调用维修。

若房间RCL变化导致结构 `hitsMax`改变，下一tick会使用当前对象的新值重新筛选。

## `repair()`返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 维修命令已提交 | 下一tick重新读取hits |
| `ERR_NOT_OWNER` | Creep不是自己的 | Creep所有权 |
| `ERR_BUSY` | Creep仍在生成 | `creep.spawning` |
| `ERR_NOT_ENOUGH_RESOURCES` | 没有Energy | Store状态 |
| `ERR_INVALID_TARGET` | 目标不是可维修结构或已经失效 | 当前tick重新选择 |
| `ERR_NOT_IN_RANGE` | 超过3格 | 移动到范围3 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 身体与受伤状态 |

不同于Tower维修，Creep维修确实有范围要求。

## 为什么不在本文判断敌情

维修防线是否应该继续，需要结合：

- 当前敌对Creep；
- Tower攻击计划；
- Safe Mode；
- 房间Energy；
- 关键Rampart位置；
- 维修者生存风险。

本文只提供防御结构目标选择器。实际房间应把它放在更高层任务优先级之后，例如：

```text
逃生或战斗
→ 紧急建筑维修
→ 防御结构阶段性维修
→ 其他任务
```

## 怎样分阶段提高上限

不要每tick自动把上限提高。更稳妥的条件可能是：

- 所有防御结构都达到当前上限；
- Storage Energy高于明确储备；
- 房间升级任务不紧急；
- 当前没有战斗；
- 玩家或独立策略模块确认进入下一阶段。

阶段值可以保存为配置版本，而不是由单篇API文章自动决定。

## 离线模拟结果

构建检查覆盖：

1. `hitsLimit`缺失、非数值或小于等于0；
2. 非Wall和Rampart被排除；
3. 已达到上限的结构被排除；
4. 已达到 `hitsMax` 的结构被排除；
5. 当前hits最低者优先；
6. hits相同选择距离更近者；
7. Energy为空时不调用；
8. 没有有效WORK部件时不调用。

离线模拟没有调用真实 `repair()`，也没有验证Boost、路径和多tickEnergy消耗。

## 常见误区

### 直接修到 `hitsMax`

会让高耐久防御结构长期占用资源。

### 把示例上限当成官方推荐

上限是房间策略。

### 用耐久比例选Wall和Rampart

两者通常更适合阶段性绝对hits目标，否则高 `hitsMax` 会让比例长期极低。

### 维修距离不足时移动到相邻格

维修范围是3，没必要总走到1格。

### 不检查有效WORK部件

受伤Creep可能仍包含WORK记录，但已经无法执行维修。

### 目标选择器里混入完整战斗决策

应由更高层调度决定当前是否执行防御维修。

## 适用边界

本文没有实现：

- Rampart位置价值；
- 自动提高维修阶段；
- 多维修者分配；
- Boost精确效果；
- 战斗中的紧急补墙；
- Tower与Creep协同；
- 路径缓存；
- 多房间Energy预算。

JavaScript语法和目标选择离线模拟已经通过。真实维修、路径与长期资源消耗仍待Screeps环境验证。

## 相关站内内容

- [Creep自动建造和维修](/blog/screeps-build-and-repair)
- [Tower如何按阈值维修建筑](/blog/screeps-tower-repair-threshold)
- [Rampart怎么切换公开状态](/blog/screeps-rampart-set-public)
- [Safe Mode怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Creep为什么有fatigue](/blog/screeps-move-fatigue-body-ratio)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [Creep.repair API](https://docs.screeps.com/api/#Creep.repair)
- [StructureWall API](https://docs.screeps.com/api/#StructureWall)
- [StructureRampart API](https://docs.screeps.com/api/#StructureRampart)

资料核对日期：2026-07-22。离线目标选择已通过；真实防御维修仍待Screeps环境验证。
