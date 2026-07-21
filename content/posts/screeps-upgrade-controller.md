---
title: "怎样让 Creep 自动升级 Controller？"
description: "安全创建并控制 Upgrader1，让它在 Source 与 Controller 之间往返，认识 upgradeController()、Memory 状态切换和返回结果。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Controller"
  - "Upgrader"
  - "Memory"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 9 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇只完成一个目标**
> 让 Upgrader1 装满 Energy 后前往 Controller，Energy 用完后再回 Source。

上一篇已经解释了[Harvester、Upgrader 和 Builder 的分工](/blog/screeps-creep-roles)。现在只实现 Upgrader1，不同时加入建造和维修。

## 一、先创建一只 Upgrader1

如果房间中还没有 Upgrader1，可以在游戏 Console 中执行一次下面的命令：

```javascript
const spawn = Game.spawns['Spawn1'];

spawn
  ? spawn.spawnCreep([WORK, CARRY, MOVE], 'Upgrader1')
  : '找不到 Spawn1，请检查名称和大小写';
```

把 `Spawn1` 换成自己的 Spawn 名称。
返回 `0`，也就是 `OK`，表示已经开始创建；它不会在同一个 tick 中立刻完成。

这只 Creep 使用 `[WORK, CARRY, MOVE]`，共需要 200 Energy。

> **这条命令只需要执行一次**
> Upgrader1 已经存在后，不要继续重复执行同名创建命令。

## 二、为什么要升级 Controller

Controller 等级决定房间能够使用哪些建筑。
升级进度增加并达到要求后，房间会进入更高的 RCL。

> 采集 Energy → 使用 `upgradeController()` → 增加 Controller 进度

房间中的 Controller 可以通过下面的代码找到：

```javascript
const controller = creep.room.controller;
```

执行升级时使用：

```javascript
const result = creep.upgradeController(controller);
```

升级会消耗 Creep 携带的 Energy，并需要可用的 `WORK`。
如果距离太远，返回结果是 `ERR_NOT_IN_RANGE`，这时再调用 `moveTo(controller)`。

## 三、让 Creep 记住当前状态

升级会逐渐消耗 Energy。
为了避免 Creep 每使用一点 Energy 就立刻返回 Source，可以让它记住自己正在“采集”还是“升级”。

```javascript
creep.memory.upgrading
```

| 值 | 当前状态 |
| --- | --- |
| `false` 或尚未设置 | 前往 Source 采集 |
| `true` | 前往 Controller 升级 |

> **Memory 可以理解成小记事本**
> 它让 Creep 在不同 tick 之间保留一个简单状态。本篇只使用一个布尔值，不展开 Memory 的完整结构。

状态切换规则是：

```text
Energy 用完 → upgrading = false
Store 装满 → upgrading = true
```

想单独理解 Memory 的保存方式，可以在完成本篇后查看[Memory 基础](/blog/screeps-memory-basics)。

## 四、先检查 Creep、Source 和 Controller

固定名称可能写错，房间对象也可能不符合预期，因此在执行动作前先检查：

```javascript
const creep = Game.creeps['Upgrader1'];

if (!creep) {
  console.log('找不到 Upgrader1，请先创建或检查名称');
  return;
}

const source = creep.room.find(FIND_SOURCES)[0];
const controller = creep.room.controller;

if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}

if (!controller) {
  console.log('当前房间中没有找到 Controller');
  return;
}
```

这些检查不会让 Creep 更聪明，但能避免代码继续访问不存在的目标。

## 五、完整代码

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Upgrader1'];

  if (!creep) {
    console.log('找不到 Upgrader1，请先创建或检查名称');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];
  const controller = creep.room.controller;

  if (!source) {
    console.log('当前房间中没有找到可见的 Source');
    return;
  }

  if (!controller) {
    console.log('当前房间中没有找到 Controller');
    return;
  }

  if (creep.memory.upgrading &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.upgrading = false;
  }

  if (!creep.memory.upgrading &&
      creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.upgrading = true;
  }

  if (creep.memory.upgrading) {
    const upgradeResult = creep.upgradeController(controller);

    if (upgradeResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    } else if (upgradeResult !== OK) {
      console.log(`Upgrader1 升级返回：${upgradeResult}`);
    }
  } else {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`Upgrader1 采集返回：${harvestResult}`);
    }
  }
};
```

> **保存前修改名称**
> 把 `'Upgrader1'` 换成你实际使用的 Creep 名称。Console 创建命令与主循环中的名称必须保持一致。

> **这是本篇单独测试代码**
> 它只控制 Upgrader1。其他角色的代码会在第 12 篇统一整理。

## 六、保存代码后观察什么

1. Console 中是否没有持续出现对象不存在的提示；
2. Upgrader1 是否前往 Source；
3. 装满后是否转向 Controller；
4. 到达 Controller 附近后，Energy 是否逐渐减少；
5. Controller 进度是否增加；
6. Energy 用完后是否再次返回 Source；
7. 点击 Creep 时，`memory.upgrading` 是否在 `true` 与 `false` 之间切换。

当 Upgrader1 完成一次“采集 → 升级 → 再次采集”的往返时，本篇目标就已经完成。

## 七、常见问题

**为什么 Upgrader1 到了 Controller 附近却没有升级？**

检查它是否携带 Energy、身体中是否有可用的 `WORK`，并查看 `upgradeResult` 的返回值。
遇到距离问题时，可以打开[`ERR_NOT_IN_RANGE` 排查说明](/screeps-errors#err_not_in_range)。

**为什么它第一次运行会先去采集？**

`creep.memory.upgrading` 尚未设置时会被当作 false，所以会先进入采集状态。

**为什么 Console 一直提示找不到 Upgrader1？**

先确认创建已经完成，再检查 Console 创建命令和主循环使用的名称是否完全相同。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `creep.room.controller` | 找到当前房间的 Controller |
| `creep.memory.upgrading` | 记住当前是采集还是升级 |
| `creep.upgradeController(controller)` | 消耗 Energy 升级 Controller |
| `if (!controller) return` | 没有目标时停止后续动作 |
| `ERR_NOT_IN_RANGE` | 距离目标太远 |

## 总结

> 没有 Energy → 采集；Store 装满 → 升级 Controller

本篇代码在执行动作以前会检查 Creep、Source 和 Controller，并记录 `harvest()` 与 `upgradeController()` 的异常返回结果。

[下一篇](/blog/screeps-first-extension)会先创建 Builder1，然后在 RCL 2 房间中建造第一个 Extension。

## 官方参考资料

1. [Screeps Documentation：Room Controller Level](https://docs.screeps.com/control.html)
2. [Screeps API Reference：Creep.upgradeController](https://docs.screeps.com/api/#Creep.upgradeController)
3. [Screeps API Reference：Creep.memory](https://docs.screeps.com/api/#Creep.memory)

> 本文只实现一个基础 Upgrader。固定 Source、单个状态字段和固定名称都是新手阶段的简化选择。