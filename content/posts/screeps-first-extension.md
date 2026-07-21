---
title: "怎样建造第一个 Extension？"
description: "在 RCL 2 房间中放置 Extension Construction Site，安全控制 Builder1 采集和建造，并检查工地与动作返回结果。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Extension"
  - "建造"
  - "RCL"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 10 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇的目标**
> 在 RCL 2 房间中放置一个 Extension Construction Site，并让 Builder1 把它建造完成。

上一篇已经让[Upgrader1 自动升级 Controller](/blog/screeps-upgrade-controller)。当房间达到 RCL 2 后，就可以开始本篇练习。

## 一、先创建一只 Builder1

如果房间中还没有 Builder1，可以在 Console 中执行一次：

```javascript
const spawn = Game.spawns['Spawn1'];

spawn
  ? spawn.spawnCreep([WORK, CARRY, MOVE], 'Builder1')
  : '找不到 Spawn1，请检查名称和大小写';
```

把 `Spawn1` 换成自己的 Spawn 名称。
返回 `0` 表示已经开始创建。Builder1 创建完成后，再运行本篇建造代码。

## 二、Extension 有什么用

Controller 达到 **RCL 2** 后，房间可以建造最多 5 个 Extension。
RCL 2 的每个 Extension 可以保存 50 Energy。

创建 Creep 时，同房间的 Spawn 可以使用 Spawn 和 Extension 中的可用 Energy。

> **建造完成不等于已经有 Energy**
> 新 Extension 一开始是空的，还需要 Creep 把 Energy 送进去。

## 三、放置第一个 Construction Site

打开游戏中的建造菜单，选择 Extension，然后在房间空地上放置。
界面按钮的位置可能随客户端版本变化，因此以当前游戏界面显示为准。

地图上先出现的是 Construction Site，而不是完整 Extension。
一个 Extension 需要累计投入 **3000 点建造进度**才能完成，所以 Builder1 往返多次是正常现象。

> **第一次不必追求最佳布局**
> 选择 Spawn 附近、不堵住主要通道的普通空地即可。专业布局以后单独学习。

本篇使用界面放置工地。完成新手路线后，可以继续阅读[用 `createConstructionSite()` 创建工地](/blog/screeps-room-create-construction-site)。

## 四、先安全找到 Builder1、Source 和工地

固定名称或目标不存在时，不要继续调用动作方法：

```javascript
const creep = Game.creeps['Builder1'];

if (!creep) {
  console.log('找不到 Builder1，请先创建或检查名称');
  return;
}

const source = creep.room.find(FIND_SOURCES)[0];
const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}
```

`site` 暂时不存在并不一定是错误：可能还没有放置工地，也可能工地已经建造完成。
因此，只在 Builder1 进入建造状态时检查 `site`。

## 五、让 Builder1 自动建造

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Builder1'];

  if (!creep) {
    console.log('找不到 Builder1，请先创建或检查名称');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];
  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (!source) {
    console.log('当前房间中没有找到可见的 Source');
    return;
  }

  if (creep.memory.building &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.building = false;
  }

  if (!creep.memory.building &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.building = true;
  }

  if (creep.memory.building) {
    if (!site) {
      creep.say('没有工地');
      return;
    }

    const buildResult = creep.build(site);

    if (buildResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    } else if (buildResult !== OK) {
      console.log(`Builder1 建造返回：${buildResult}`);
    }
  } else {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`Builder1 采集返回：${harvestResult}`);
    }
  }
};
```

`FIND_MY_CONSTRUCTION_SITES` 会寻找属于自己的施工地点；`build()` 会消耗 Builder1 携带的 Energy 增加工地进度。

> 没有 Energy → 采集；Store 装满 → 寻找工地并建造

> **这是本篇单独测试代码**
> 它只控制 Builder1。完整的多角色代码会在第 12 篇整理。

## 六、保存代码后观察什么

1. Console 中是否没有持续出现对象不存在的提示；
2. Builder1 是否先去 Source；
3. 装满后是否前往 Extension 工地；
4. 工地的 `progress` 是否增加；
5. Energy 用完后是否返回 Source；
6. 最终是否变成真正的 Extension。

想进一步理解进度数值，可以查看[Construction Site 的 `progress` 与 `progressTotal`](/blog/screeps-construction-site-progress)。

当一个 Extension 工地从 Construction Site 变成完整建筑时，本篇目标就已经完成了。

## 七、常见问题

**为什么 Builder1 说“没有工地”？**

房间中没有自己的 Construction Site，或者工地已经完成。
确认地图上存在未完成的 Extension 工地，并检查它是否在 Builder1 当前所在房间。

**为什么 Builder1 到工地旁边仍然不建造？**

确认它携带 Energy、拥有可用的 `WORK`，并查看 `buildResult` 的返回值。
遇到距离问题时，可以查询[`ERR_NOT_IN_RANGE`](/screeps-errors#err_not_in_range)。

**为什么 Extension 建好以后仍是 0 Energy？**

建造和填充是两件事。之后需要 Harvester1 把 Energy 送入 Extension。

**为什么它只选择某一个工地？**

当前代码使用 `[0]`，只选择搜索结果中的第一个工地。最近目标、优先级与多 Builder 分配不属于本篇目标。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `FIND_MY_CONSTRUCTION_SITES` | 查找自己的工地 |
| `creep.memory.building` | 记住当前是采集还是建造 |
| `creep.build(site)` | 消耗 Energy 增加工地进度 |
| `if (!site) return` | 没有工地时不继续调用 `build()` |
| `buildResult` | 保存并检查本次建造返回值 |

## 总结

> RCL 2 解锁 Extension → 放置工地 → Builder1 携带 Energy 建造 → 检查进度 → 完成 Extension

[下一篇](/blog/screeps-build-and-repair)会让 Builder1 在没有工地时寻找受损建筑，并在空闲时帮助升级 Controller。

## 官方参考资料

1. [Screeps Documentation：RCL 与建筑数量](https://docs.screeps.com/control.html)
2. [Screeps API Reference：StructureExtension](https://docs.screeps.com/api/#StructureExtension)
3. [Screeps API Reference：Creep.build](https://docs.screeps.com/api/#Creep.build)
4. [Screeps API Reference：CONSTRUCTION_COST](https://docs.screeps.com/api/#CONSTRUCTION_COST)

> 本文只介绍第一个 Extension 的放置与建造。自动布局、多工地排序、Builder 数量控制和房间规划会放到后续专题中。