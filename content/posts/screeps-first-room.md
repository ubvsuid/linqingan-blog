---
title: "Screeps 新手入门：认识游戏界面与第一个房间"
description: "第一次进入 Screeps 时，先找到房间视图、代码编辑器和 Console，再用安全的只读命令确认 Room、Spawn、Source、Controller 与 Creep。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "游戏界面"
  - "Room"
  - "Console"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 2 / 12 篇**
> 当前阶段：认识 Screeps

## 开始之前

上一篇已经解释了 Screeps 是什么，以及 Room、Source、Creep、Spawn 和 Controller 如何组成基础循环。

这一篇不写控制代码，只完成一个实际目标：

> **在当前客户端中找到房间视图、代码编辑器和 Console，并确认自己房间里的基础对象。**

游戏界面的按钮位置可能随客户端更新而变化，所以本文重点讲“每个区域用来做什么”，而不是依赖某一个固定布局。

## 三个必须先找到的界面区域

### 房间视图

房间视图用来观察当前 Room 中的地形、单位、资源和建筑。

Creep 是否在移动、Spawn 是否正在生产、Controller 位于哪里，都可以先从房间画面确认。不过，房间视图主要负责展示，真正决定单位行为的是脚本。

### 代码编辑器

代码编辑器是编写和保存 JavaScript 的地方。

Screeps 的游戏脚本会在每个 tick 执行。后续文章中的 `module.exports.loop`、采集、运输和升级代码，都会从这里进入游戏。

这一篇先不要改动已有代码。只要确认你能够打开编辑器，并找到当前使用的代码分支或模块即可。

### Console

Console 用来执行临时命令、查看 `console.log()` 输出和读取报错。

以后遇到“Creep 为什么不动”“Spawn 为什么创建失败”等问题时，Console 通常是第一处检查入口。

> 房间视图告诉你“画面发生了什么”；Console 帮助你判断“程序为什么这样运行”。

## 在第一个房间里找什么

进入自己的房间后，先寻找四类对象。

### Spawn

Spawn 是创建新 Creep 的建筑。点击 Spawn 后，先记住它的名称。

很多新手示例会使用 `Game.spawns.Spawn1`，但你的 Spawn 不一定叫 `Spawn1`。实际代码必须使用真实名称。

### Source

Source 是基础 Energy 来源。它通常很容易在房间画面中辨认，但 Source 不会自动把 Energy 送进 Spawn。

后续需要由带有 WORK 部件的 Creep 采集，再由 Creep 把 Energy 运送到目标建筑。

### Controller

Controller 决定房间控制权和 Room Controller Level。点击它可以查看当前等级和相关状态。

这一篇不需要记住每一级能建什么，只要能够在房间中找到它。

### Creep

Creep 是玩家通过代码控制的单位。点击一只 Creep，可以查看名称、身体部件、剩余生命和携带资源等信息。

如果当前没有 Creep，不要凭空假设名称。先确认房间和 Spawn 状态，后面的文章会讲创建和自动补员。

## 用只读 Console 命令确认对象

下面这些命令不会让 Creep 移动，也不会修改 Memory。它们只读取当前可见对象的名称。

### 查看当前可见房间

```javascript
Object.keys(Game.rooms)
```

返回的数组中，每一项都是当前 tick 可见的房间名。

### 查看自己的 Spawn

```javascript
Object.keys(Game.spawns)
```

把实际 Spawn 名称记下来。后续代码不应直接假设它一定叫 `Spawn1`。

### 查看自己的 Creep

```javascript
Object.keys(Game.creeps)
```

如果返回空数组，说明当前 tick 没有自己的 Creep；如果有内容，数组中的字符串就是 Creep 名称。

### 查看一个房间中的 Source 数量

先从 `Game.rooms` 取得一个真实房间名，再执行：

```javascript
const room = Game.rooms['W1N1'];

if (!room) {
  console.log('房间当前不可见');
} else {
  const sources = room.find(FIND_SOURCES);
  console.log('Source 数量：', sources.length);
}
```

把 `W1N1` 替换成刚才看到的实际房间名。

这段代码只读取数据，不会改变游戏状态。完整 JavaScript 已按语法检查，但房间名、Source 数量和 Console 输出仍需要在你的账号环境中验证。

## 第一次界面检查清单

打开 Screeps 后，依次完成下面的检查：

1. 确认当前正在查看一个 Room；
2. 找到 Spawn，并记住它的名称；
3. 找到至少一个 Source；
4. 找到 Controller，并查看当前等级；
5. 查看是否存在自己的 Creep；
6. 打开代码编辑器；
7. 打开 Console；
8. 执行 `Object.keys(Game.rooms)` 和 `Object.keys(Game.spawns)`。

完成以后，你应该能够把“画面中的对象”和“代码中的对象名称”对应起来。

## 常见情况

### `Game.rooms` 中没有刚才看过的房间

`Game.rooms` 只包含当前 tick 可见的房间。以后遇到类似问题，可以阅读：

[Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)

### `Object.keys(Game.creeps)` 返回空数组

这不是 JavaScript 报错，只表示当前没有自己的 Creep。不要继续运行依赖某个固定 Creep 名称的代码。

### Console 命令显示 `undefined`

某些表达式本身没有返回值时，Console 显示 `undefined` 并不一定代表失败。排查时应同时查看是否有错误信息，以及命令是否产生了预期的读取结果。

## 完成检查

读完并操作后，确认自己能够回答：

- 房间视图、代码编辑器和 Console 分别负责什么？
- 自己的 Spawn 和 Creep 实际叫什么？
- 如何用 `Game.rooms` 查看当前可见房间？
- 为什么示例中的 `W1N1` 或 `Spawn1` 不能直接照抄？

## 下一篇

下一篇将解释 tick、`Game.time` 和 `module.exports.loop`，帮助你理解为什么同一段代码会持续执行：

[理解 Screeps 中的 tick 与游戏循环](/blog/screeps-tick-and-game-loop)

## 官方参考资料

- [Screeps Documentation：Introduction](https://docs.screeps.com/introduction.html)
- [Screeps Documentation：Scripting Basics](https://docs.screeps.com/scripting-basics.html)
- [Screeps API Reference：Game](https://docs.screeps.com/api/Game.html)
- [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)

资料核对日期：2026-07-21。

代码已完成 JavaScript 语法检查；客户端布局、房间名、对象名称和 Console 结果均为**待环境验证**。