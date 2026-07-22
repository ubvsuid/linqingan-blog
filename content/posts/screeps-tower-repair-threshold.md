---
title: "Screeps Tower 如何按耐久比例和Energy保留线维修建筑"
description: "只在房间没有敌人、没有受伤己方Creep且Tower Energy高于保留线时，按耐久比例选择非Wall和Rampart结构并处理repair()全部返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Tower"
  - "维修"
  - "防御"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（敌对目标、受伤Creep、Energy保留线、耐久比例与距离排序，不是Screeps官方服务器）"
  testResult: "敌人存在、己方受伤、Energy不足、只有墙体、超过阈值、比例排序和同分距离排序场景通过。"
featured: false
---

Tower若无条件维修，可能在敌人进入房间前消耗大量Energy。维修逻辑必须排在攻击与治疗之后，并使用明确的Energy保留线和耐久阈值。

本文只解决一个问题：怎样让可用Tower在房间没有需要攻击或治疗的目标时，选择低于耐久比例阈值的普通建筑进行维修。

## 为什么使用比例而不是固定hits

固定阈值：

```js
structure.hits < 5000
```

对不同建筑含义不同：

- Road可能接近满耐久；
- Extension可能已经严重受损；
- Storage可能仍然只损失很小比例。

本文使用：

```js
structure.hits / structure.hitsMax
```

筛选低于80%的结构。`0.8`是本站示例策略，不是官方推荐值。

Wall和Rampart的耐久目标通常远高于普通建筑，应该使用独立上限，不能混在这个筛选中。

## Tower维修距离影响效果

Tower可以维修同一房间内的结构，不会因为距离返回 `ERR_NOT_IN_RANGE`。距离会影响实际维修量：近距离更高，远距离更低。

本文先按耐久比例排序，比例相同再选择离最近Tower更近的结构。它不计算精确维修量，也不预测多少tick能够修满。

## 可离线测试的目标选择

```js
function selectRepairTarget(
  towers,
  structures,
  ratioLimit
) {
  const candidates = structures.filter(structure =>
    Number.isFinite(structure.hits)
    && Number.isFinite(structure.hitsMax)
    && structure.hitsMax > 0
    && structure.hits < structure.hitsMax
    && structure.hits / structure.hitsMax < ratioLimit
    && structure.structureType !== STRUCTURE_WALL
    && structure.structureType !== STRUCTURE_RAMPART
  );

  if (towers.length === 0 || candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const leftRatio = left.hits / left.hitsMax;
    const rightRatio = right.hits / right.hitsMax;

    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.id.localeCompare(right.id);
  })[0];
}
```

## 完整示例

示例顺序是：敌对Creep、受伤己方Creep、Tower资源、维修目标。

```js
const TOWER_REPAIR_RATIO_LIMIT = 0.8;
const TOWER_REPAIR_ENERGY_RESERVE = 500;

function selectRepairTarget(
  towers,
  structures,
  ratioLimit
) {
  const candidates = structures.filter(structure =>
    Number.isFinite(structure.hits)
    && Number.isFinite(structure.hitsMax)
    && structure.hitsMax > 0
    && structure.hits < structure.hitsMax
    && structure.hits / structure.hitsMax < ratioLimit
    && structure.structureType !== STRUCTURE_WALL
    && structure.structureType !== STRUCTURE_RAMPART
  );

  if (towers.length === 0 || candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const leftRatio = left.hits / left.hitsMax;
    const rightRatio = right.hits / right.hitsMax;

    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.id.localeCompare(right.id);
  })[0];
}

function runTowerRepair(room) {
  const hostile = room.find(FIND_HOSTILE_CREEPS)[0];
  if (hostile) {
    return;
  }

  const injuredCreep = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.hits > 0
      && creep.hits < creep.hitsMax
  })[0];

  if (injuredCreep) {
    return;
  }

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive()
      && structure.store.getUsedCapacity(RESOURCE_ENERGY)
        >= TOWER_REPAIR_ENERGY_RESERVE
        + TOWER_ENERGY_COST
  });

  if (towers.length === 0) {
    return;
  }

  const structures = room.find(FIND_STRUCTURES);
  const target = selectRepairTarget(
    towers,
    structures,
    TOWER_REPAIR_RATIO_LIMIT
  );

  if (!target) {
    return;
  }

  for (const tower of towers) {
    const result = tower.repair(target);

    if (result !== OK) {
      console.log({
        type: 'tower-repair-failed',
        roomName: room.name,
        towerId: tower.id,
        targetId: target.id,
        targetType: target.structureType,
        targetHits: target.hits,
        targetHitsMax: target.hitsMax,
        result
      });
    }
  }
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  runTowerRepair(room);
};
```

## 为什么保留线要加一次动作成本

筛选条件使用：

```js
energy >= reserve + TOWER_ENERGY_COST
```

如果只检查：

```js
energy >= reserve
```

执行一次维修后，Tower会跌到保留线以下。

保留线是业务策略。防御压力高的房间可能需要更高数值，安全后方房间可能允许更低数值。

## 为什么治疗排在维修前

同一座Tower每tick只能提交一个主要动作。若维修函数先运行，再由另一个模块调用治疗，后一个命令可能覆盖前一个计划，或让代码行为难以解释。

统一调度应明确：

```text
攻击
→ 治疗
→ 普通建筑维修
→ Wall和Rampart独立维护
```

本文在发现任何受伤己方Creep时直接退出，把治疗机会留给专门模块。

## 多座Tower会不会过量维修

示例让所有可用Tower维修同一个目标。可能出现目标只缺少少量hits，但多座Tower都提交动作。

更完整的分配器需要根据：

- 每座Tower到目标的距离；
- 预计维修量；
- 目标缺失hits；
- 已经分配的Tower；
- 当前Energy预算；
- 结构优先级；
- 同tick攻击和治疗计划。

本文不声称集体维修最节省Energy，只提供一个确定性基础方案。

## `repair()` 返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 维修已安排 | 下一tick查看结构hits |
| `ERR_NOT_OWNER` | Tower不是自己的 | `FIND_MY_STRUCTURES`与所有权 |
| `ERR_NOT_ENOUGH_ENERGY` | Tower Energy不足 | 保留线、动作成本和其他Tower逻辑 |
| `ERR_INVALID_TARGET` | 目标不是有效结构或已经失效 | 当前tick重新选择目标 |
| `ERR_RCL_NOT_ENOUGH` | Tower当前不可用 | Controller等级与 `isActive()` |

Tower维修覆盖同一房间，不返回 `ERR_NOT_IN_RANGE`。

## 怎样为结构增加业务优先级

耐久比例相同不代表价值相同。生产系统可以加入结构权重，例如：

```js
const STRUCTURE_REPAIR_PRIORITY = {
  [STRUCTURE_SPAWN]: 100,
  [STRUCTURE_TOWER]: 90,
  [STRUCTURE_STORAGE]: 80,
  [STRUCTURE_TERMINAL]: 70,
  [STRUCTURE_EXTENSION]: 50,
  [STRUCTURE_ROAD]: 10
};
```

但这会引入房间策略、交通与资源价值判断。本文不把自定义权重写成官方规则，基础版本只比较耐久比例和距离。

## 离线模拟结果

构建检查覆盖：

1. 房间有敌对Creep时不维修；
2. 己方存在受伤Creep时不维修；
3. Tower Energy不足时不进入列表；
4. Wall和Rampart被排除；
5. 耐久比例高于阈值的结构被排除；
6. 比例更低的结构优先；
7. 比例相同选择距离更近者；
8. 条件完全相同时使用ID稳定排序。

离线模拟没有调用真实 `tower.repair()`，也没有模拟距离变化后的维修量。

## 常见误区

### 只在文字中写“没有敌人时维修”

代码必须实际检查 `FIND_HOSTILE_CREEPS`。

### 使用固定hits比较所有结构

不同结构的 `hitsMax` 差异很大。

### 把Wall和Rampart混进普通维修

它们通常需要独立目标耐久和预算。

### 保留线没有加动作成本

维修后可能跌破预期底线。

### 多个模块分别控制同一座Tower

必须统一动作优先级，否则行为难以解释。

### 一次 `OK` 就写成结构已经修好

应在下一tick查看真实hits变化。

## 适用边界

本文没有实现：

- 精确维修量预测；
- 多Tower分配；
- 结构业务价值权重；
- Wall与Rampart维护；
- Power效果；
- Tower补能；
- 多房间统一防御；
- 长期Energy统计。

JavaScript语法和目标选择离线模拟已经通过。真实Tower维修、Energy变化和多tick结果仍待Screeps环境验证。

## 相关站内内容

- [Tower怎么自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Tower如何自动治疗己方Creep](/blog/screeps-tower-heal-creeps)
- [Wall和Rampart如何设置维修上限](/blog/screeps-wall-rampart-repair-limit)
- [怎样让Creep自动建造和维修](/blog/screeps-build-and-repair)
- [Game.notify()怎么发送提醒](/blog/screeps-game-notify)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [StructureTower.repair API](https://docs.screeps.com/api/#StructureTower.repair)
- [StructureTower API](https://docs.screeps.com/api/#StructureTower)
- [Defending your room](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-22。离线目标选择已通过；真实维修结果仍待Screeps环境验证。
