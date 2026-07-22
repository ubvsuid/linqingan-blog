---
title: "Game.cpu.getUsed() 和 bucket 怎么监控 CPU"
description: "用 Game.cpu.getUsed() 测量一段代码在当前 tick 的 CPU 差值，并同时读取 limit、tickLimit 与 bucket。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "CPU"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


本文用一段最小代码测量当前 tick 的 CPU 差值，并同时记录 `limit`、`tickLimit` 与 `bucket`。

## 怎样测量一段代码

本文只建立测量方法：在目标代码前后分别读取 `Game.cpu.getUsed()`，并同时输出当前 `limit`、`tickLimit` 和 `bucket`。

## 官方规则

- Game.cpu.getUsed 返回当前 tick 已使用的 CPU 时间。
- Game.cpu.limit、tickLimit 与 bucket 表示不同的预算状态。
- Simulation 模式下 getUsed 按官方说明可能始终返回 0。

## 每 100 tick 记录一次 CPU

### `main` 模块

```js
module.exports.loop = function () {
  const start = Game.cpu.getUsed();

  const myCreeps = Object.values(Game.creeps).filter(
    creep => creep.my
  );

  const used = Game.cpu.getUsed() - start;

  if (Game.time % 100 === 0) {
    console.log({
      measuredSection: used,
      creepCount: myCreeps.length,
      limit: Game.cpu.limit,
      tickLimit: Game.cpu.tickLimit,
      bucket: Game.cpu.bucket
    });
  }
};
```

## CPU 数值异常时

1. 同一 tick 内用两次 getUsed 做差。
2. 同时记录 limit、tickLimit、bucket。
3. 降低日志频率且不把一次测量写成性能结论。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间代码](/blog/screeps-first-room-code)
- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)

## 官方资料

- [How does CPU limit work](https://docs.screeps.com/cpu-limit.html)
- [Game.cpu API](https://docs.screeps.com/api/#Game-cpu)
