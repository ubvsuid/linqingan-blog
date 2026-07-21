---
title: "怎样让 Creep 自动建造和维修？"
description: "让 Builder1 按照建造、维修、升级的顺序选择工作，安全检查 Source、Controller 与动作返回值，并暂时排除 Wall 和 Rampart。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Builder"
  - "建造"
  - "维修"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 11 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇是在 Builder1 建造代码上的扩展**
> 有工地时先建造；没有工地时维修自己的建筑、道路或 Container；没有这些任务时升级 Controller。

上一篇已经完成了[第一个 Extension 的建造](/blog/screeps-first-extension)。现在不改变 Builder1 的采集状态，只给工作阶段增加一个简单任务优先级。

## 一、为什么需要一个简单优先级

Extension 建造完成后，Builder1 可能暂时没有 Construction Site。
如果它只会建造，就会一直等待。

本篇使用下面的顺序：

1. 有 Construction Site：先建造；
2. 没有工地，但有合适的受损建筑：进行维修；
3. 两者都没有：帮助升级 Controller。

> 建造 → 维修 → 空闲时升级

优先级的作用是让同一个 tick 只选择一个主要任务，而不是同时向多个目标发出动作。

## 二、怎样判断建筑受损

建筑通常有当前生命值 `hits` 和最大生命值 `hitsMax`。

```javascript
structure.hits < structure.hitsMax
```

成立时，说明建筑还没有达到最大生命值。

本篇只维修：

- 属于自己的建筑；
- 道路；
- Container。

同时暂时排除 Wall 和 Rampart，避免 Builder1 长时间只维修高耐久防御建筑。

> **排除不代表永远不维修**
> Wall 和 Rampart 需要单独设置目标耐久和优先级。本篇只解决基础 Builder 的空闲任务选择。

## 三、先检查 Builder1 和 Source

Builder1 在采集阶段必须拥有有效的 Creep 与 Source：

```javascript
const creep = Game.creeps['Builder1'];

if (!creep) {
  console.log('找不到 Builder1，请先创建或检查名称');
  return;
}

const source = creep.room.find(FIND_SOURCES)[0];

if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}
```

Controller 只在“没有工地，也没有维修目标”时使用，因此可以等到最后再检查。

## 四、完整代码

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Builder1'];

  if (!creep) {
    console.log('找不到 Builder1，请先创建或检查名称');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];

  if (!source) {
    console.log('当前房间中没有找到可见的 Source');
    return;
  }

  if (creep.memory.working &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = false;
  }

  if (!creep.memory.working &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = true;
  }

  if (!creep.memory.working) {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`Builder1 采集返回：${harvestResult}`);
    }
    return;
  }

  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (site) {
    const buildResult = creep.build(site);

    if (buildResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    } else if (buildResult !== OK) {
      console.log(`Builder1 建造返回：${buildResult}`);
    }
    return;
  }

  const damaged = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      const repairable =
        structure.my === true ||
        structure.structureType === STRUCTURE_ROAD ||
        structure.structureType === STRUCTURE_CONTAINER;

      const excluded =
        structure.structureType === STRUCTURE_WALL ||
        structure.structureType === STRUCTURE_RAMPART;

      return repairable &&
        !excluded &&
        structure.hits < structure.hitsMax;
    }
  })[0];

  if (damaged) {
    const repairResult = creep.repair(damaged);

    if (repairResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(damaged);
    } else if (repairResult !== OK) {
      console.log(`Builder1 维修返回：${repairResult}`);
    }
    return;
  }

  const controller = creep.room.controller;

  if (!controller) {
    console.log('当前房间中没有找到 Controller');
    return;
  }

  const upgradeResult = creep.upgradeController(controller);

  if (upgradeResult === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  } else if (upgradeResult !== OK) {
    console.log(`Builder1 升级返回：${upgradeResult}`);
  }
};
```

### 为什么有多个 `return`？

`return` 可以理解为：“本 tick 的任务已经选好，不再继续检查后面的任务。”

| 找到的目标 | Builder1 做什么 | 是否继续检查后面任务 |
| --- | --- | --- |
| Construction Site | 建造 | 否 |
| 合适的受损建筑 | 维修 | 否 |
| 都没有 | 升级 Controller | 已经到最后 |

### 为什么保存每个动作的返回结果？

`build()`、`repair()` 和 `upgradeController()` 都可能因为距离、Energy 或目标状态返回不同结果。
本篇至少明确处理 `ERR_NOT_IN_RANGE`，并把其他意外结果输出到 Console，避免只看到 Creep 停住却不知道原因。

## 五、保存代码后观察什么

1. Console 中是否没有持续出现对象不存在的提示；
2. 有工地时是否优先建造；
3. 没有工地时是否寻找受损目标；
4. 没有维修目标时是否前往 Controller；
5. Energy 用完后是否返回 Source；
6. 同一个 tick 是否只执行优先级最高的一个任务。

当 Builder1 能在“有工地”和“没有工地”两种情况下选择不同工作时，本篇目标就已经完成了。

## 六、常见问题

**为什么它不维修 Wall 和 Rampart？**

本篇代码主动排除它们，把防御建筑耐久管理留给专题文章。

**为什么它没有选择最近的目标？**

当前只选择搜索结果中的第一个对象。最近目标与任务排序以后再讲。

**为什么 Builder1 停在目标附近？**

查看 Console 中的 `buildResult`、`repairResult` 或 `upgradeResult`。
距离不足时，可以继续查询[`ERR_NOT_IN_RANGE`](/screeps-errors#err_not_in_range)。

**为什么没有工地时直接升级 Controller？**

因为代码只有三层优先级。没有工地且没有符合条件的维修目标时，升级就是本篇设置的最后备用任务。

## 七、这还不是完整维护系统

当前代码没有处理：

- 道路和 Container 的不同维修阈值；
- 多个 Builder 的任务分配；
- 自动规划新的工地；
- Wall 和 Rampart 的目标耐久；
- 选择最近或最重要的维修目标；
- 任务缓存和 CPU 优化。

这些限制应当明确保留，而不是把一篇新手文章扩展成完整房间维护框架。

## 这一篇需要记住什么

| 顺序 | 条件 | 动作 |
| --- | --- | --- |
| 1 | 找到自己的 Construction Site | `build()` |
| 2 | 没有工地，但找到合适受损建筑 | `repair()` |
| 3 | 两者都没有 | `upgradeController()` |

> 采集 Energy → 优先建造 → 然后维修 → 空闲时升级

## 总结

本篇在 Builder1 原有的采集与建造状态上增加了简单任务优先级，并为 Source、Controller 和动作返回值补上了检查。

[下一篇](/blog/screeps-first-room-code)会把 Harvester1、Upgrader1、Builder1 和创建代码放进同一份新手房间代码。

## 官方参考资料

1. [Screeps API Reference：Creep.build](https://docs.screeps.com/api/#Creep.build)
2. [Screeps API Reference：Creep.repair](https://docs.screeps.com/api/#Creep.repair)
3. [Screeps API Reference：Creep.upgradeController](https://docs.screeps.com/api/#Creep.upgradeController)
4. [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)

> 本文只介绍一个 Builder 的基础任务优先级，不覆盖完整维修策略和防御耐久管理。