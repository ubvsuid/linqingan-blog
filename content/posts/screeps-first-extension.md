---
title: "怎样建造第一个 Extension？"
description: "先创建 Builder1，在 RCL 2 放置 Extension Construction Site，并让它自动采集和建造。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Extension"
  - "Builder"
  - "Construction Site"
  - "RCL"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 10 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇的目标**
> 在 RCL 2 房间中放置一个 Extension Construction Site，并让 Builder1 把它建造完成。

## 一、先创建一只 Builder1

如果房间中还没有 Builder1，可以在 Console 中执行一次：

```javascript
Game.spawns['Spawn1'].spawnCreep(
  [WORK, CARRY, MOVE],
  'Builder1'
);
```

把 `Spawn1` 换成自己的 Spawn 名称。Builder1 创建完成后，再运行本篇建造代码。

## 二、Extension 有什么用

Controller 达到 **RCL 2** 后，房间可以建造最多 5 个 Extension。RCL 2 的每个 Extension 可以保存 50 Energy。

创建 Creep 时，同房间的 Spawn 可以使用 Spawn 和 Extension 中的可用 Energy。

> **建造完成不等于已经有 Energy**
> 新 Extension 一开始是空的，还需要 Creep 把 Energy 送进去。

## 三、放置第一个 Construction Site

打开游戏中的建造菜单，选择 Extension，然后在房间空地上放置。界面按钮的位置可能随客户端版本变化，因此以当前游戏界面显示为准。

地图上先出现的是 Construction Site，而不是完整 Extension。

一个 Extension 需要累计投入 **3000 Energy 的建造工作量**才能完成，所以 Builder1 往返多次是正常现象。

> **第一次不必追求最佳布局**
> 选择 Spawn 附近、不堵住主要通道的普通空地即可。专业布局以后单独学习。

## 四、让 Builder1 自动建造

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Builder1'];

  if (!creep) {
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];
  const site = creep.room.find(FIND_MY_CONSTRUCTION_SITES)[0];

  if (creep.memory.building &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.building = false;
  }

  if (!creep.memory.building &&
      creep.store.getFreeCapacity() === 0) {
    creep.memory.building = true;
  }

  if (creep.memory.building) {
    if (!site) {
      creep.say('没有工地');
      return;
    }

    if (creep.build(site) === ERR_NOT_IN_RANGE) {
      creep.moveTo(site);
    }
  } else {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
  }
};
```

`FIND_MY_CONSTRUCTION_SITES` 会寻找属于自己的施工地点；`build()` 会消耗 Builder1 携带的 Energy 增加进度。

> 没有 Energy → 采集；Store 装满 → 寻找工地并建造

> **这是本篇单独测试代码**
> 它只控制 Builder1。完整的多角色代码会在第 12 篇整理。

## 五、保存代码后观察什么

1. Builder1 是否先去 Source；
2. 装满后是否前往 Extension 工地；
3. 工地进度是否增加；
4. Energy 用完后是否返回 Source；
5. 最终是否变成真正的 Extension。

**为什么 Builder1 说“没有工地”？**

房间中没有自己的 Construction Site，或者工地已经完成。

**为什么 Extension 建好以后仍是 0 Energy？**

建造和填充是两件事。之后需要 Harvester1 把 Energy 送入 Extension。

## 总结

> RCL 2 解锁 Extension → 放置工地 → Builder1 携带 Energy 建造

下一篇会让 Builder1 在没有工地时寻找受损建筑，并在空闲时帮助升级 Controller。

## 官方参考资料

1. [Screeps Documentation：RCL 与建筑数量](https://docs.screeps.com/control.html)
2. [Screeps API Reference：StructureExtension](https://docs.screeps.com/api/#StructureExtension)
3. [Screeps API Reference：Creep.build](https://docs.screeps.com/api/#Creep.build)
4. [Screeps API Reference：CONSTRUCTION_COST](https://docs.screeps.com/api/#CONSTRUCTION_COST)
