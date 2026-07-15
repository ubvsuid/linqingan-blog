---
title: "Screeps 中的 tick 是什么？为什么代码会不断运行"
description: "写给 Screeps 新手的 tick 入门文章：用简单方式解释 tick、Game.time 和 module.exports.loop，以及代码为什么会不断执行。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-15"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "tick"
  - "Game.time"
  - "游戏循环"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 3 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇只需要弄明白三件事**
> tick 是游戏世界向前推进的一次循环；`Game.time` 是当前 tick 的编号；
> `module.exports.loop` 是 Screeps 会不断执行的主要函数。

## 这篇文章会讲什么

1. tick 是什么
2. 为什么代码会不断运行
3. Creep 为什么需要多个 tick
4. 做一个简单的观察实验

## 一、tick 是什么

可以先把 tick 理解成：**游戏世界的一次心跳。**

每经过一个 tick，Screeps 的世界就会向前推进一次。
游戏会读取当前情况，运行玩家的代码，再处理 Creep 和建筑收到的行动命令。

当前 tick 的编号保存在 `Game.time` 中。
这个数字会随着游戏运行不断增加。[1]

```text
100
101
102
103
```

这些数字不断变化，表示游戏正在进入新的 tick。
对新手来说，现在不需要关心一个 tick 具体有多长。

> 一个 tick 结束 → 游戏进入下一个 tick → 玩家代码再次运行

## 二、为什么代码会不断运行

很多一次性脚本完成任务后就会结束，但 Screeps 是一个持续运行的游戏世界。
Creep 的位置、能量和目标会不断变化，所以程序也需要不断查看新的情况。

新手打开代码编辑器后，通常会看到类似下面的结构：

```javascript
module.exports.loop = function () {
  // 游戏代码写在这里
};
```

现在不需要研究 `module.exports` 的完整原理。
只需要把它理解成：

> **`module.exports.loop` 是 Screeps 的主要游戏循环。**
> 写在花括号中的代码，会在新的 tick 中再次执行。

例如：

```javascript
module.exports.loop = function () {
  console.log('当前 tick：' + Game.time);
};
```

保存后，Console 中会不断出现新的 tick 编号。
观察几次后，请删除这行 `console.log`，避免 Console 一直重复输出。

## 三、Creep 为什么需要多个 tick

假设一只 Creep 距离 Source 还有一段距离。
它通常不能在一个 tick 内立刻到达并完成采集。

下面只是一段示意，实际需要多少 tick 会受到距离、地形和移动情况影响：

1. 第一个 tick：程序发现 Creep 距离 Source 太远，于是让它开始移动。
2. 后面的 tick：程序再次查看位置，让 Creep 继续接近 Source。
3. 到达 Source 附近后：程序改为让 Creep 开始采集。
4. 能量装满后：程序再决定它应该把能量送到哪里。

Screeps 中的长期行为，就是由许多个这样的小步骤组成的。

> 查看当前情况 → 安排这一小步 → 进入下一个 tick → 再次判断

## 四、做一个简单的 tick 实验

除了在主循环中输出 `Game.time`，还可以直接在 Console 中观察它。
这种方式更简单，也不会让代码一直输出内容。

1. 打开 Screeps 的 Console。
2. 输入 `Game.time`，记住显示的数字。
3. 稍等一会儿，再次输入 `Game.time`。
4. 如果第二次数字更大，说明游戏已经经过了新的 tick。

例如，第一次可能看到：

```text
15320
```

过一会儿再次查看，可能变成：

```text
15327
```

具体数字并不重要。只要它在增加，就说明游戏世界正在持续推进。

> **不要自己写无限循环**
> 不要使用 `while (true)` 让代码一直运行。
> Screeps 本身已经会在每个 tick 中调用主循环。
> 无限循环会让当前这一次执行无法正常结束。

## 这一篇需要记住什么

| 内容 | 最简单的理解 |
| --- | --- |
| tick | 游戏世界向前推进一次 |
| `Game.time` | 当前 tick 的编号 |
| `module.exports.loop` | Screeps 会不断执行的主要函数 |
| Creep 的行动 | 通常需要经过多个 tick 才能完成 |

最重要的一句话是：

> **Screeps 的代码不是运行一次就结束。**
> 它会随着游戏世界不断进入新的 tick，并再次执行。

## 总结

tick 是 Screeps 世界运行的基本节奏。
每经过一个 tick，程序会读取当前状态、执行主循环，并为 Creep 和建筑安排下一步。

理解 tick 以后，后面的移动和采集代码就更容易理解了：
程序不需要在一次执行中完成所有事情，而是让 Creep 在许多个 tick 中一步一步完成任务。

下一篇，我们将正式控制第一只 Creep，让它找到 Source、移动过去并开始采集能量。

## 官方参考资料

1. [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
2. [Screeps API Reference：Game.time](https://docs.screeps.com/api/Game.html)
3. [Screeps Documentation：Scripting Basics](https://docs.screeps.com/scripting-basics.html)

> 本文是 Screeps 新手入门系列的第三篇，只介绍 tick 和基础游戏循环。
> CPU、Memory、缓存与代码架构等内容会放到后续进阶分类中。
