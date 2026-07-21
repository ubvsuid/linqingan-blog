---
title: "房间中有多只 Creep 后，为什么需要分工？"
description: "认识 Harvester1、Upgrader1 和 Builder1，区分角色与身体部件，并理解固定名称只是新手阶段组织任务的方法。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "角色分工"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 8 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **从这一篇开始统一名称**
> [上一篇](/blog/screeps-spawn-create-creep)的 `Worker1` 是临时示例名。从本篇开始，系列统一使用 `Harvester1`、`Upgrader1` 和 `Builder1`。如果你暂时仍使用 `Worker1`，可以先把代码中的 `Harvester1` 换成 `Worker1`。

## 一、为什么多只 Creep 需要分工

只有一只 Creep 时，让它采集、运输、升级和建造都可以。但当房间中的 Creep 变多，如果每一只都判断所有任务，代码会越来越难看懂。

> Creep 数量增加 → 工作开始重复 → 需要明确每只 Creep 的主要任务

分工的目的不是让代码看起来更专业，而是让你能够快速回答：

> 这只 Creep 现在主要负责什么？

新手阶段先把每只 Creep 的主要任务固定下来，可以减少同时学习的概念数量。

## 二、新手阶段使用哪三个角色

### Harvester1

从 Source 获取 Energy，并把 Energy 送到 Spawn 或 Extension。
新手阶段把采集和运输放在同一只 Creep 身上。

已经完成的基础流程是：

> Source → Harvester1 → Spawn

### Upgrader1

自己采集 Energy，然后把它投入 Controller，推动房间等级提升。

下一篇会让它完成：

> Source → Upgrader1 → Controller

### Builder1

自己采集 Energy，负责建造 Construction Site；没有工地时可以维修或升级。

后面的建造流程是：

> Source → Builder1 → Construction Site

> **为什么没有单独的 Transporter？**
> 专职采集者与运输者的拆分需要更多 Creep、更多目标选择和更复杂的代码。新手阶段先让 Harvester1 同时完成采集和运输，更容易理解。

## 三、角色和身体部件不是一回事

| 概念 | 最简单的理解 | 示例 |
| --- | --- | --- |
| 身体部件 | 决定 Creep 能不能移动、采集、携带或工作 | `WORK`、`CARRY`、`MOVE` |
| 角色 | 决定你希望这只 Creep 主要做哪一类任务 | Harvester、Upgrader、Builder |

例如，Upgrader1 和 Builder1 都可以使用 `[WORK, CARRY, MOVE]`，但代码会让它们前往不同目标。

如果这两个概念仍然容易混淆，可以回到[第 6 篇：认识身体部件](/blog/screeps-creep-body-parts)。

## 四、为什么先用固定名称区分工作

长期代码通常会使用 Memory 和角色字段管理大量 Creep，但这不是新手当前必须学习的内容。

本系列先使用固定名称：

```text
Harvester1 → 采集并运输
Upgrader1  → 升级 Controller
Builder1   → 建造和维修
```

这样你看到名称，就能知道代码准备让它做什么。

固定名称也有明显限制：

- 每种工作暂时只有一只 Creep；
- Creep 死亡后需要重新创建同名对象；
- 不适合管理多个相同角色；
- 角色信息没有直接保存在 `creep.memory` 中。

这些限制不是代码错误，而是为了让新手先理解“分工”本身。
完成12篇路线后，可以从[Memory 基础](/blog/screeps-memory-basics)继续学习角色字段。

## 五、怎样观察分工是否有效

1. Harvester1 是否持续向 Spawn 或 Extension 送 Energy；
2. Upgrader1 是否持续增加 Controller 进度；
3. 出现 Construction Site 后，Builder1 是否负责建造；
4. 三只 Creep 是否长期挤在同一个目标旁边；
5. 某只 Creep 停止工作时，你能否根据名称快速找到对应代码。

## 六、三个常见误解

**角色是 Screeps 官方固定功能吗？**

不是。Harvester、Upgrader 和 Builder 是玩家为了组织代码而使用的工作名称。

**一个角色只能有一只 Creep 吗？**

不是。一个角色可以有多只 Creep，但本系列暂时每种角色只使用一个固定名称。

**名称叫 Harvester1，就会自动采集吗？**

不会。名称本身不会赋予行为。只有主循环真正调用 `harvest()`、`transfer()` 等方法时，它才会执行对应任务。

## 这一篇需要记住什么

| 名称 | 主要任务 |
| --- | --- |
| `Harvester1` | 采集并运输 Energy |
| `Upgrader1` | 升级 Controller |
| `Builder1` | 建造、维修，空闲时升级 |

> 身体部件决定“能不能做”，角色分工决定“主要做什么”，代码决定“这个 tick 实际做什么”。

当你能看着三只 Creep 的名称，准确说出它们各自应该去哪里、做什么时，这篇文章的目标就已经完成了。

## 总结

> Harvester1 负责能量运输 → Upgrader1 负责升级 → Builder1 负责建造和维修

[下一篇](/blog/screeps-upgrade-controller)将先创建 Upgrader1，再让它自动采集并升级 Controller。

## 官方参考资料

1. [Screeps API Reference：Game.creeps](https://docs.screeps.com/api/#Game.creeps)
2. [Screeps Documentation：Creeps](https://docs.screeps.com/creeps.html)

> 本文只解释新手阶段为什么需要角色分工。动态角色数量、自动补员、角色优先级与多房间管理会放到后续专题中。