---
title: "怎样让 Creep 自动建造和维修？"
description: "让 Builder1 按照建造、维修、升级的顺序选择工作，并避免维修不属于当前新手目标的建筑。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Builder"
  - "build"
  - "repair"
  - "Construction Site"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 11 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇是在 Builder1 建造代码上的扩展**
> 有工地时先建造；没有工地时维修自己的建筑、道路或 Container；没有这些任务时升级 Controller。

## 一、为什么需要一个简单优先级

Extension 建造完成后，Builder1 可能暂时没有 Construction Site。如果它只会建造，就会一直等待。

1. 有 Construction Site：先建造；
2. 没有工地，但有合适的受损建筑：进行维修；
3. 两者都没有：帮助升级 Controller。

> 建造 → 维修 → 空闲时升级

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

## 三、完整代码

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Builder1'];

  if (!creep) {
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];

  if (creep.memory.working &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.working = false;
  }

  if (!creep.memory.working &&
      creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
  }

  if (!creep.memory.working) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
    return;
  }

  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (site) {
    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    }
    return;
  }

  const damaged = creep.room.find(FIND_STRUCTURES, {
    filter: function (structure) {
      const repairable =
        structure.my ||
        structure.structureType === STRUCTURE_ROAD ||
        structure.structureType === STRUCTURE_CONTAINER;

      return repairable &&
        structure.hits < structure.hitsMax &&
        structure.structureType !== STRUCTURE_WALL &&
        structure.structureType !== STRUCTURE_RAMPART;
    }
  })[0];

  if (damaged) {
    if (creep.repair(damaged) === ERR_NOT_IN_RANGE) {
      creep.moveTo(damaged);
    }
    return;
  }

  const controller = creep.room.controller;

  if (controller &&
      creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    creep.moveTo(controller);
  }
};
```

### 为什么有多个 return？

`return` 可以理解为：“本 tick 的任务已经选好，不再继续检查后面的任务。”

| 找到的目标 | Builder1 做什么 |
| --- | --- |
| Construction Site | 建造 |
| 合适的受损建筑 | 维修 |
| 都没有 | 升级 Controller |

## 四、保存代码后观察什么

1. 有工地时是否优先建造；
2. 没有工地时是否寻找受损目标；
3. 没有维修目标时是否前往 Controller；
4. Energy 用完后是否返回 Source。

**为什么它不维修 Wall 和 Rampart？**

本篇代码主动排除它们，把防御建筑耐久管理留给专业文章。

**为什么它没有选择最近的目标？**

当前只选择搜索结果中的第一个对象。最近目标与任务排序以后再讲。

## 五、这还不是完整维护系统

当前代码没有处理：

- 道路和 Container 的不同维修阈值；
- 多个 Builder 的任务分配；
- 自动规划新的工地；
- Wall 和 Rampart 的目标耐久；
- 选择最近或最重要的维修目标。

## 总结

> 采集 Energy → 优先建造 → 然后维修 → 空闲时升级

下一篇会把 Harvester1、Upgrader1、Builder1 和创建代码放进同一份新手房间代码。

## 官方参考资料

1. [Screeps API Reference：Creep.build](https://docs.screeps.com/api/#Creep.build)
2. [Screeps API Reference：Creep.repair](https://docs.screeps.com/api/#Creep.repair)
3. [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)
