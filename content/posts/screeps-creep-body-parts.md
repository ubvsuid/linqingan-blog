---
title: "为什么有的 Creep 能采集，有的却不能？认识 WORK、CARRY 和 MOVE"
description: "写给 Screeps 新手的 Creep 身体部件入门：用简单方式认识 WORK、CARRY 和 MOVE。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "WORK"
  - "CARRY"
  - "MOVE"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 6 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇只需要记住一句话**
> Creep 能做什么，取决于它拥有哪些身体部件。

## 一、什么是 Creep 的身体部件

可以把身体部件理解成 Creep 使用的工具。不同部件提供不同能力：

### `WORK`

负责采集、建造、维修和升级等工作。

### `CARRY`

提供存放和运输资源的空间。

### `MOVE`

让 Creep 能够主动移动。

Screeps 中还有战斗、治疗和占领房间等其他身体部件，但新手现在不需要全部学习。

## 二、WORK：提供工作能力

`WORK` 可以理解成 Creep 的工作工具。它会参与下面这些操作：

- 从 Source 采集能量；
- 建造建筑；
- 维修建筑；
- 升级 Controller。

> `creep.harvest(source)` 需要可用的 `WORK`

如果 Creep 已经到达 Source 旁边，却仍然不能正常采集，可以先检查它是否拥有可用的 `WORK`。

> **建造、维修和升级还需要 Energy**
> `WORK` 提供执行这些工作的能力，但 Creep 还需要通过 `CARRY` 携带 Energy，才能真正进行建造、维修和升级。

## 三、CARRY：提供携带空间

`CARRY` 可以理解成 Creep 身上的背包。它为 Creep 提供存放资源的空间。

前一篇文章中，Creep 从 Source 采集 Energy，再把 Energy 送回 Spawn，这个运输过程就需要 `CARRY`。

> 采集到 Energy → 放进 Creep 的 Store → 送到 Spawn

更多 `CARRY` 通常意味着一次能够携带更多资源。这一篇不计算具体容量和最优数量。

> **没有空余携带空间时会怎样？**
> Creep 仍可能继续执行采集命令，但无法放进自身 Store 的资源可能会掉落在地面上。

## 四、MOVE：提供移动能力

`MOVE` 让 Creep 能够主动移动。

前面的教程中，我们使用了：

```javascript
creep.moveTo(source);
creep.moveTo(spawn);
```

这些移动都需要 Creep 拥有可用的 `MOVE`。如果没有可用的 `MOVE`，Creep 就不能依靠自己正常前往目标。

当身体部件很多，而 `MOVE` 较少时，Creep 可能无法在每个 tick 都移动。携带资源和经过的地形也会影响移动表现。

具体疲劳计算、道路与沼泽的区别，以及怎样搭配最高效率，会放到后面的进阶文章中。

## 五、最基础的工作 Creep

前几篇中用于移动、采集和运输的基础 Creep，可以由下面三个部件组成：

```javascript
[WORK, CARRY, MOVE]
```

| 身体部件 | 最简单的作用 | 对应行为 |
| --- | --- | --- |
| `WORK` | 提供工作能力 | 从 Source 采集 Energy |
| `CARRY` | 提供携带空间 | 把 Energy 装进 Store 并带回去 |
| `MOVE` | 提供移动能力 | 在 Source 和 Spawn 之间移动 |

> `WORK` 把 Energy 采出来 → `CARRY` 把 Energy 装起来 → `MOVE` 带着 Creep 返回 Spawn

方括号中的内容是一张身体部件清单。下一篇学习创建 Creep 时，就会真正用到它。

## 六、观察自己的 Creep

现在可以回到游戏中，点击正在工作的 Creep，完成下面的检查：

1. 找到它的 `WORK`；
2. 找到它的 `CARRY`；
3. 找到它的 `MOVE`；
4. 把每个部件和 Creep 当前的行为对应起来。

**为什么到达 Source 后不能采集？**

先检查 Creep 是否拥有可用的 `WORK`。

**为什么不能把 Energy 带回去？**

检查 Creep 是否拥有 `CARRY`，以及 Store 是否还有空余空间。

**为什么 Creep 移动得比较慢？**

`MOVE` 较少时，Creep 可能无法每个 tick 都移动。携带资源和地形也会影响移动表现。

## 总结

Creep 并不是天生拥有所有能力。它能够做什么，取决于身体中有哪些部件。

| 部件 | 新手只需要记住 |
| --- | --- |
| `WORK` | 负责工作和采集 |
| `CARRY` | 负责携带资源 |
| `MOVE` | 负责移动 |

当你能够看着一只 Creep，说出它为什么能采集、为什么能携带、为什么能移动时，这篇文章的目标就已经完成了。

下一篇将正式学习：怎样让 Spawn 创建一只拥有 `WORK`、`CARRY` 和 `MOVE` 的新 Creep。

## 官方参考资料

1. [Screeps Documentation：Creeps 与身体部件](https://docs.screeps.com/creeps.html)
2. [Screeps API Reference：Creep.harvest](https://docs.screeps.com/api/#Creep.harvest)
3. [Screeps API Reference：Creep.build](https://docs.screeps.com/api/#Creep.build)
4. [Screeps API Reference：Creep.repair](https://docs.screeps.com/api/#Creep.repair)
5. [Screeps API Reference：Creep.upgradeController](https://docs.screeps.com/api/#Creep.upgradeController)

> 本文是 Screeps 新手入门系列的第六篇，只介绍 `WORK`、`CARRY` 和 `MOVE` 三个基础部件。部件价格、疲劳公式、最优比例、排列顺序与战斗身体会放到进阶分类中。
