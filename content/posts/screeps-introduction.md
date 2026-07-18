---
title: "Screeps 是什么？一个用 JavaScript 控制单位的编程游戏"
description: "Screeps 是什么？本文用简单易懂的方式介绍 Screeps: World 的游戏特点、Room、Source、Creep、Spawn、Controller，以及玩家在游戏中主要要做什么。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-19"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "JavaScript"
  - "Room"
  - "Creep"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: true
---

> **Screeps 新手入门 · 第 1 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **先用一句话说明 Screeps**
> Screeps: World 是一款通过 JavaScript 控制单位的多人在线策略游戏。
> 玩家编写程序，让自己的单位自动采集、运输、建造和升级；即使玩家离开游戏，
> 这个世界也会继续运行。

## 这篇文章会讲什么

1. Screeps 到底是一个什么游戏
2. Screeps 世界由什么组成
3. 玩家在游戏里要做什么

## 一、Screeps 到底是一个什么游戏

### 1. 它首先是一款策略游戏

在 Screeps: World 中，玩家拥有自己的房间和单位，需要采集资源、生产新的单位、
建造建筑，并让自己的领地逐渐发展起来。

游戏中的世界由许多玩家共同组成。等房间发展稳定以后，玩家还可以探索其他区域、
建立新的房间，或者与其他玩家发生合作和竞争。

所以 Screeps 不只是一个练习 JavaScript 的工具。它本身也有资源管理、基地建设、
领地扩张和多人竞争等策略游戏内容。[1]

### 2. 它与普通策略游戏有什么不同

普通策略游戏通常需要玩家选择一个单位，然后点击资源点、建筑或敌人，告诉单位下一步做什么。

Screeps 的不同之处在于：**玩家不是一直用鼠标指挥单位，而是提前写好它们的行动规则。**

| 普通策略游戏 | Screeps |
| --- | --- |
| 玩家不断点击并下达命令 | 玩家编写代码，让单位自动行动 |
| 主要依靠即时操作 | 主要依靠程序、判断和资源安排 |
| 玩家离开后通常不再操作 | 玩家离开后，程序仍然可以继续执行 |

例如，你可以给一只单位写下这样的规则：

- 身上没有能量时，前往能量源采集；
- 身上装满能量后，把能量送回基地；
- 基地不缺能量时，再去升级房间。

程序会不断检查游戏当前的情况，再决定单位接下来应该做什么。

### 3. 一小段代码是什么样的

下面这段代码只做一件事：让一只名为 `Harvester1` 的单位寻找能量源并开始采集。

```javascript
module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep) {
    console.log('没有找到 Harvester1');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];

  if (!source) {
    console.log('当前房间没有找到 Source');
    return;
  }

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  } else if (result !== OK) {
    console.log('harvest result:', result);
  }
};
```

现在不需要看懂每一个单词。你只需要知道：在 Screeps 中，
“寻找目标、判断距离、移动过去、开始采集”都可以由 JavaScript 控制。

这段示例假设游戏中有一只名为 `Harvester1` 的 Creep。名称区分大小写，需要按照实际名称修改。

这里直接使用搜索结果中的第一个 Source，只是为了展示最小代码。它不一定距离最近，也不适合作为长期目标选择方案。

> **新手最容易遇到的情况**
> 只写采集代码时，单位装满能量后可能会停下来。这不是游戏坏了，
> 而是代码还没有告诉它“采满以后应该把能量送到哪里”。
> 后面的教程会一步一步补上这些行为。

### 4. 玩家离开后，游戏仍会继续

Screeps: World 是一个持续运行的在线世界。玩家关闭网页以后，
已经部署的程序仍然可以继续控制单位。[1]

这并不代表玩家需要一开始就写出一套非常复杂的系统。
刚进入游戏时，只要先让一只单位学会移动、采集和运输，就已经迈出了第一步。
后面的功能可以随着房间发展慢慢增加。

## 二、Screeps 世界由什么组成

Screeps 中有很多建筑和资源，但第一篇文章不需要把它们全部记住。
对新手来说，先认识下面五个对象就足够了。

| 对象 | 简单理解 | 主要作用 |
| --- | --- | --- |
| Room | 游戏房间 | 容纳单位、建筑和资源 |
| Source | 能量源 | 提供 Energy |
| Creep | 玩家单位 | 执行采集、运输和升级 |
| Spawn | 生产建筑 | 创建新的 Creep |
| Controller | 房间控制器 | 决定归属和等级 |

### 1. Room：游戏发生的地方

Screeps 的世界由许多相互连接的 Room 组成。每个 Room 都是一个 50×50 的区域，
房间之间可以通过出口互相连接。[2]

你可以先把 Room 理解成自己的基地地图。能量源、控制器、单位和建筑都位于房间里。
新手开始时通常只需要先经营好一个房间。

### 2. Source：提供能量的资源点

Source 是房间里的基础能量来源。Creep 可以前往 Source 采集 Energy，
再把能量送到其他地方。

在游戏前期，生产单位、建造建筑和升级房间都需要能量，
所以 Source 可以看作整个房间经济的起点。

### 3. Creep：真正执行工作的单位

Creep 是玩家通过代码控制的单位。它们可以采集能量、运输资源、建造建筑、
升级 Controller，也可以在以后承担维修和战斗等工作。

你可能会在其他教程中看到 Harvester、Builder 或 Upgrader 这些名称。
它们通常是玩家自己给不同工作角色起的名字，并不是游戏强制规定的职业。

### 4. Spawn：创建新单位的建筑

Spawn 是新手房间里最重要的基础建筑之一。它会消耗能量，创建新的 Creep。

如果把房间看成一家公司，Spawn 就像负责招人的部门，而 Creep 就是负责工作的员工。
没有新的 Creep，采集、运输和建设就很难继续。

### 5. Controller：房间的发展等级

Controller 决定房间是否被玩家控制，以及房间能够发展到什么程度。
Creep 可以消耗能量升级 Controller。

Controller 等级提高后，房间会逐渐解锁更多建筑。
第一篇文章不需要记住每一级具体能建什么，只需要理解：
**升级 Controller，就是让房间逐步发展。** [3]

### 它们之间是什么关系

> Source 提供能量 → Creep 采集并运输 → Spawn 生产更多 Creep → Controller 推动房间升级

Room 是这些事情发生的空间。理解这条简单关系后，
你就已经看懂了 Screeps 前期最重要的基础循环。

## 三、玩家在游戏里要做什么

玩家进入 Screeps 后，最开始要做的事情并不复杂。
可以把前期目标理解成下面五步。

1. **采集能量：**
   让 Creep 找到 Source，并从中获取 Energy。
2. **运送能量：**
   把采集到的能量送回 Spawn，或者送到需要能量的位置。
3. **生产更多单位：**
   使用 Spawn 创建新的 Creep，让不同单位一起工作。
4. **升级和建造：**
   升级 Controller，解锁更多建筑，并逐步完善自己的房间。
5. **继续发展：**
   当第一个房间稳定后，再去探索、扩张、防御或与其他玩家交易。

> **Screeps 最基础的玩法循环**
> 采集能量 → 运送能量 → 生产 Creep → 升级房间 → 建造和发展

这就是 Screeps 的核心：玩家不需要一直盯着每一只单位，
而是通过代码，让这套流程逐渐自动运行。

第一篇文章的目标不是让你马上写出一个完整的游戏 AI，
而是帮助你看懂这款游戏最基本的组成和玩法。
只要你已经理解 Room、Source、Creep、Spawn 和 Controller，
就可以继续学习下一步了。

## 新手常见问题

**完全不会 JavaScript，可以开始玩 Screeps 吗？**

可以先体验游戏教程，但如果了解变量、条件判断和函数，学习会更轻松。
不需要一开始就掌握复杂代码，可以边玩边学。

**退出游戏后，单位会继续工作吗？**

已经部署的程序可以继续运行。不过单位能不能正确工作，
仍然取决于代码是否处理了能量装满、目标消失等情况。

**下一篇应该学习什么？**

下一步可以认识游戏界面，找到自己的 Spawn、Source、Controller 和 Creep，
再了解代码应该写在哪里。

## 官方参考资料

1. [Screeps: World 官方产品页](https://store.screeps.com/world)
2. [Screeps Documentation：Introduction](https://docs.screeps.com/introduction.html)
3. [Screeps Documentation：Control](https://docs.screeps.com/control.html)

> 本文是 Screeps 新手入门系列的第一篇，主要解决“它是什么”。
> 游戏机制可能更新，精确规则请以 Screeps 官方文档为准。

