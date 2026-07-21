---
title: "Screeps 是什么？一个用 JavaScript 控制单位的编程游戏"
description: "用一篇新手入门文章认识 Screeps: World：它与普通策略游戏有什么不同、玩家需要做什么，以及 Room、Creep、Spawn、Source 和 Controller 如何组成基础循环。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "JavaScript"
  - "编程游戏"
  - "基础概念"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: true
---

> **Screeps 新手入门 · 第 1 / 12 篇**
> 当前阶段：认识 Screeps

## 这一篇只解决一个问题

**Screeps 到底是一款什么游戏？**

读完以后，你应该能够用自己的话说明：

- Screeps 为什么是一款编程游戏；
- 玩家在游戏中主要做什么；
- Room、Source、Creep、Spawn 和 Controller 为什么会形成一条基础循环。

这一篇不要求你写代码，也不要求你记住 API。

## Screeps 是什么

Screeps: World 是一款持续运行的多人在线即时战略游戏。玩家建立自己的殖民地、采集资源、生产单位、建设房间，并与共享世界中的其他玩家共同发展或竞争。

它与普通策略游戏最大的区别不是画面，而是**控制方式**：

> 普通策略游戏主要依靠玩家不断点击和下达命令；Screeps 主要依靠玩家提前编写 JavaScript，让单位根据当前情况自动行动。

例如，你可以逐步为一只单位写出这样的规则：

1. 没有 Energy 时，前往 Source；
2. 到达 Source 附近后开始采集；
3. 装满后，把 Energy 送回 Spawn；
4. 房间有足够 Energy 后，再创建新的单位；
5. 让其他单位升级 Controller 或建造建筑。

程序会在游戏持续运行的过程中反复检查状态，并安排下一步。

官方文档说明，游戏脚本会在每个 tick 执行；在 Screeps: World 中，即使玩家离开网页，已经部署的脚本仍可继续运行。Simulation Room 是例外，不应把模拟环境和持续世界混为一谈。

## 它不只是 JavaScript 练习题

Screeps 的代码很重要，但游戏目标并不是单纯输出一段正确语法。

你还需要处理：

- Energy 从哪里来、送到哪里；
- 应该创建多少只 Creep；
- 不同 Creep 分别承担什么工作；
- 房间升级后先建什么；
- 单位死亡、目标消失或道路拥堵时怎样恢复；
- 多个房间之间怎样调度资源和任务。

因此，Screeps 同时包含编程、资源管理、自动化和策略规划。

新手阶段不需要马上设计复杂系统。先完成一个能够持续采集、运输和升级的房间循环，就已经建立了后续学习的基础。

## 先认识五个核心对象

Screeps 中有很多对象。第一篇只需要认识下面五个：

| 对象 | 最简单的理解 | 新手阶段的作用 |
| --- | --- | --- |
| Room | 一张 50×50 的房间地图 | 容纳地形、单位、资源和建筑 |
| Source | 基础 Energy 来源 | 供带有 WORK 部件的 Creep 采集 |
| Creep | 玩家控制的单位 | 执行采集、运输、升级和建造 |
| Spawn | 创建 Creep 的建筑 | 消耗房间可用 Energy 生产新单位 |
| Controller | 房间控制与等级核心 | 通过升级逐步解锁建筑能力 |

### Room：所有事情发生的空间

Screeps 世界由相互连接的 Room 组成。官方文档将一个 Room 定义为 50×50 个格子的区域。

新手开始时，不需要研究整个世界地图。先让一个房间稳定运行更重要。

### Source：房间经济的起点

Source 提供基础 Energy。Creep 采集 Energy 后，可以把它用于生产单位、升级 Controller、建设或维修。

Source 不会主动把 Energy 送到建筑中。运输过程需要由你的代码安排。

### Creep：真正执行命令的单位

Creep 是玩家用代码控制的单位。它能做什么，取决于身体部件和脚本。

Harvester、Upgrader、Builder 等名称通常是玩家自行设计的角色，而不是游戏强制规定的职业。

### Spawn：创建新的 Creep

Spawn 使用房间可用 Energy 创建新的 Creep。

当现有单位即将死亡、房间需要增加运输能力，或准备建立新的角色时，程序通常会向 Spawn 发出创建请求。

### Controller：推动房间发展

玩家控制房间后，可以让 Creep 消耗 Energy 升级 Controller。Room Controller Level 提高后，房间会逐步获得更多建筑额度和能力。

这一篇不需要背诵各等级数据，只需要记住：

> 升级 Controller，是推动房间继续发展的主要方式之一。

## 五个对象怎样形成基础循环

可以先记住这条关系：

> Source 提供 Energy → Creep 采集和运输 → Spawn 创建更多 Creep → Creep 升级 Controller 或建设房间

Room 是这套循环发生的空间。

当这条循环能够自动重复时，你就拥有了一个最基础的 Screeps 房间系统。

## 玩家开始游戏后要做什么

新手前期可以按照下面的顺序理解目标：

1. **认识房间和界面**：找到 Spawn、Source、Controller、Creep、代码编辑器和 Console；
2. **控制第一只 Creep**：让它移动并采集 Energy；
3. **完成运输**：把 Energy 送回 Spawn；
4. **创建更多单位**：为房间增加不同角色；
5. **升级和建造**：提升 Controller，并建立 Extension 等基础建筑；
6. **整理主循环**：让房间在多个 tick 中持续工作。

本站的12篇新手路线会按照这个顺序推进，不会在第一篇提前要求你理解复杂架构。

## 新手容易误解的三件事

### “会一点 JavaScript 才能玩吗？”

了解变量、条件判断和函数会让学习更顺利，但不需要先掌握完整前端或后端技术。可以在游戏过程中逐步学习。

### “关闭网页后，游戏就停止了吗？”

Screeps: World 的持续世界不会因为你关闭网页而暂停。已经部署的脚本仍会继续执行；代码是否能长期工作，则取决于它有没有处理单位死亡、目标变化和资源不足等情况。

### “第一天就要写完整 AI 吗？”

不需要。新手路线会把一个基础房间拆成多个小问题，每篇只增加一项能力。

## 完成检查

读完后，确认自己能够回答：

- Screeps 与普通策略游戏最主要的不同是什么？
- Source、Creep、Spawn 和 Controller 分别负责什么？
- 为什么玩家离开网页后，房间仍可能继续工作？
- 新手前期最基础的资源循环是什么？

四个问题都能回答，就可以进入下一篇。

## 下一篇

下一篇将打开实际游戏界面，找到房间视图、代码编辑器和 Console，并确认自己房间中的 Spawn、Source、Controller 与 Creep：

[认识 Screeps 游戏界面与第一个房间](/blog/screeps-first-room)

## 官方参考资料

- [Screeps Documentation：Introduction](https://docs.screeps.com/introduction.html)
- [Screeps Documentation：Scripting Basics](https://docs.screeps.com/scripting-basics.html)
- [Screeps Documentation：Control](https://docs.screeps.com/control.html)

资料核对日期：2026-07-21。

本文不包含需要运行的 JavaScript；页面界面和账号初始状态可能随客户端或游戏环境变化。