---
title: "怎样让 Creep 自动升级 Controller？"
description: "先创建 Upgrader1，再让它在 Source 与 Controller 之间往返，认识 upgradeController() 和最基础的状态切换。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Controller"
  - "Upgrader"
  - "upgradeController"
  - "Memory"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 9 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇只完成一个目标**
> 让 Upgrader1 装满 Energy 后前往 Controller，Energy 用完后再回 Source。

## 一、先创建一只 Upgrader1

如果房间中还没有 Upgrader1，可以在游戏 Console 中执行一次下面的命令：

```javascript
Game.spawns['Spawn1'].spawnCreep(
  [WORK, CARRY, MOVE],
  'Upgrader1'
);
```

把 `Spawn1` 换成自己的 Spawn 名称。返回 `0` 表示已经开始创建。

这只 Creep 使用 `[WORK, CARRY, MOVE]`，共需要 200 Energy。

> **这条命令只需要执行一次**
> Upgrader1 已经存在后，不要继续重复执行同名创建命令。

## 二、为什么要升级 Controller

Controller 等级决定房间能够使用哪些建筑。升级进度增加并达到要求后，房间会进入更高的 RCL。

> 采集 Energy → 使用 upgradeController() → 增加 Controller 进度

房间中的 Controller 可以通过下面的代码找到：

```javascript
const controller = creep.room.controller;
```

执行升级时使用：

```javascript
creep.upgradeController(controller);
```

升级会消耗 Creep 携带的 Energy，并需要可用的 `WORK`。

## 三、让 Creep 记住当前状态

升级会逐渐消耗 Energy。为了避免 Creep 每使用一点 Energy 就立刻返回 Source，可以让它记住自己正在“采集”还是“升级”。

```javascript
creep.memory.upgrading
```

| 值 | 当前状态 |
| --- | --- |
| `false` 或尚未设置 | 前往 Source 采集 |
| `true` | 前往 Controller 升级 |

> **Memory 可以理解成小记事本**
> 它让 Creep 在不同 tick 之间保留一个简单状态。本篇不展开 Memory 的完整用法。

## 四、完整代码

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Upgrader1'];

  if (!creep) {
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];
  const controller = creep.room.controller;

  if (creep.memory.upgrading &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.upgrading = false;
  }

  if (!creep.memory.upgrading &&
      creep.store.getFreeCapacity() === 0) {
    creep.memory.upgrading = true;
  }

  if (creep.memory.upgrading) {
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller);
    }
  } else {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
  }
};
```

状态切换规则是：

> Energy 用完 → 切换为采集；Store 装满 → 切换为升级

> **这是本篇单独测试代码**
> 它只控制 Upgrader1。其他角色的代码会在第 12 篇统一整理。

## 五、保存代码后观察什么

1. Upgrader1 是否前往 Source；
2. 装满后是否转向 Controller；
3. 到达 Controller 附近后，Energy 是否逐渐减少；
4. Controller 进度是否增加；
5. Energy 用完后是否再次返回 Source。

**为什么 Upgrader1 到了 Controller 附近却没有升级？**

检查它是否携带 Energy，并确认身体中有可用的 WORK。

**为什么它第一次运行会先去采集？**

`creep.memory.upgrading` 尚未设置时会被当作 false，所以会先进入采集状态。

## 总结

> 没有 Energy → 采集；装满 Energy → 升级 Controller

下一篇会先创建 Builder1，然后在 RCL 2 房间中建造第一个 Extension。

## 官方参考资料

1. [Screeps Documentation：Room Controller Level](https://docs.screeps.com/control.html)
2. [Screeps API Reference：Creep.upgradeController](https://docs.screeps.com/api/#Creep.upgradeController)
3. [Screeps API Reference：Creep.memory](https://docs.screeps.com/api/#Creep.memory)
