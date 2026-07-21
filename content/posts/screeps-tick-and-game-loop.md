---
title: "Screeps 中的 tick 是什么？为什么代码会不断运行"
description: "用新手能理解的方式解释 Screeps 的 tick、Game.time、module.exports.loop，以及为什么脚本执行和 Creep 行动不会在同一步完成。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "tick"
  - "Game.time"
  - "游戏循环"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 3 / 12 篇**
> 当前阶段：认识 Screeps

## 这一篇只需要弄明白三件事

- tick 是游戏世界向前推进的一次循环；
- `Game.time` 是当前 tick 的编号；
- `module.exports.loop` 是 Screeps 每个 tick 都会调用的主函数。

理解这三件事以后，下一篇的移动和采集代码才不会看起来像“一段永远停不下来的程序”。

## tick 是什么

可以先把 tick 理解成游戏世界的一次心跳。

在每个 tick 中，Screeps 会给脚本提供当前世界状态，执行玩家代码，并收集玩家发出的行动命令。所有玩家脚本执行完成后，游戏再处理这些命令并进入后续状态。

因此，下面两件事不是同一步：

1. 代码在当前 tick 中调用 `creep.moveTo()`、`creep.harvest()` 等方法；
2. 游戏处理命令后，新的位置、资源或对象状态在后续 tick 中可见。

这也是为什么不应该在同一个 tick 中发出命令后，立刻假设所有对象已经变成最终状态。

## `Game.time` 是当前 tick 编号

当前 tick 的编号保存在 `Game.time` 中。

可以直接在 Console 输入：

```javascript
Game.time
```

稍后再次执行同一条命令。只要数字变大，就说明游戏已经进入了新的 tick。

具体数字不重要，也不需要与教程中的任何房间或账号一致。

## 为什么代码会不断运行

Screeps 的持续世界一直在变化：

- Creep 会移动；
- Energy 会增加或减少；
- 目标可能消失；
- Creep 会死亡；
- Spawn 可能正在生产；
- Controller 会继续升级或逐渐降级。

所以程序不能只运行一次。它需要在每个 tick 重新读取当前情况，再决定这一小步该做什么。

Screeps 主模块通常会包含：

```javascript
module.exports.loop = function () {
  // 每个 tick 都会执行这里的代码
};
```

现在不需要学习 `module.exports` 的完整模块原理，只要把它理解成：

> `module.exports.loop` 是 Screeps 主循环的入口。

后面的课程会逐步把采集、运输、生成 Creep 和升级 Controller 放进这个函数。

## 完成第一次主循环观察

把下面代码放入当前主模块：

```javascript
module.exports.loop = function () {
  if (Game.time % 20 === 0) {
    console.log(`[beginner] 当前 tick：${Game.time}`);
  }
};
```

它不会控制 Creep，只会每20个 tick 输出一次当前编号。

这里使用 `% 20` 是为了减少重复日志。20不是 Screeps 的特殊规则，只是本文选择的观察频率。

保存后，打开 Console 观察一段时间。确认输出中的 tick 编号会继续增加后，可以删除这段日志，避免长期占用 Console。

## 为什么不建议每个 tick 都输出

下面的代码语法没有问题：

```javascript
module.exports.loop = function () {
  console.log(Game.time);
};
```

但它会在每个 tick 产生一条日志。随着课程继续增加代码，Console 很容易被重复信息占满，真正的错误反而更难找到。

新手阶段就应该养成一个习惯：

> 需要观察时输出，确认完成后删除；持续监控时设置明确频率。

## Creep 为什么需要多个 tick 才完成任务

假设一只 Creep 与 Source 相隔多个格子。

程序通常会经历这样的过程：

1. 当前 tick 读取 Creep 和 Source 的位置；
2. 发现距离太远，发出移动命令；
3. 后续 tick 重新读取位置；
4. 到达 Source 附近后，改为发出采集命令；
5. Energy 增加后，再决定是否继续采集或开始运输。

实际需要多少 tick，取决于距离、地形、fatigue、道路和其他单位阻挡等情况。

程序不是在一次函数调用中完成整段旅程，而是在许多个 tick 中不断重复：

> 读取当前状态 → 判断 → 发出本 tick 命令 → 下一 tick 再检查

## 不要自己写无限循环

不要使用：

```javascript
while (true) {
  // 不要这样做
}
```

Screeps 已经会在每个 tick 调用主循环。无限循环会让当前脚本执行无法正常结束，并可能耗尽本 tick 可用CPU。

需要持续执行的行为，应依靠多个 tick 和 `module.exports.loop`，而不是依靠 JavaScript 无限循环。

## 当前 tick 的对象不能跨 tick 直接保存

这一篇先记住结论即可：

- `Game` 中的对象代表当前 tick；
- 下一 tick 应重新从 `Game.creeps`、`Game.rooms` 或对象ID取得状态；
- 需要跨 tick 保存的数据，应保存到 Memory，而不是把整个运行时对象写进 Memory。

Memory 会在后续知识模块中单独讲解。现在只需要知道：每个 tick 都要重新读取当前世界。

## 常见问题

### tick 有固定秒数吗？

官方文档说明，tick持续时间会受到服务器当前负载影响。编写基础逻辑时，应按tick和游戏状态判断，不要假设每个tick严格等于固定秒数。

### Console 命令也受 tick 规则影响吗？

是。官方游戏循环文档说明，Console命令也会在一个tick中执行，规则类似于被添加到主模块末尾。

### 调用行动方法返回 `OK`，是不是对象已经立刻改变？

`OK`通常表示命令已被成功接受或安排。稳妥的代码应在后续tick重新读取对象状态，而不是继续使用当前tick的旧状态做最终判断。

## 完成检查

进入下一篇前，确认自己能够回答：

- `Game.time` 表示什么？
- `module.exports.loop` 为什么会不断运行？
- 为什么 Creep 从远处移动到 Source 需要多个 tick？
- 为什么不能用 `while (true)` 代替游戏循环？
- 为什么发出命令后要在下一 tick 重新检查？

## 下一篇

下一篇将正式控制第一只 Creep：先确认真实 Creep 名称，再寻找 Source、处理距离并开始采集。

[让第一只 Creep 移动到 Source 并采集 Energy](/blog/screeps-first-creep-harvest)

## 官方参考资料

- [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Screeps Documentation：Scripting Basics](https://docs.screeps.com/scripting-basics.html)
- [Screeps API Reference：Game.time](https://docs.screeps.com/api/Game.html)

资料核对日期：2026-07-21。

完整 JavaScript 已完成语法检查；Console输出频率、实际tick间隔和运行结果均为**待环境验证**。