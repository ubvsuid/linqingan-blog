---
title: "Screeps Flag 怎么作为房间配置入口"
description: "从 Game.flags 读取 Flag，并用 Flag.memory 保存一个明确任务和 Creep 名称，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps Game.flags"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文不搭建大型框架，只把一个容易误解的工程问题说清楚：从 Game.flags 读取 Flag，并用 Flag.memory 保存一个明确任务和 Creep 名称。

## 先给结论

本文只把 Flag 当作可视配置入口，不构建全局任务系统，也不替代 Memory 入门。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

## 官方规则

- Game.flags 只包含当前存在的 Flag。
- Flag.memory 是对应 Memory.flags[name] 的快捷入口。
- Flag 有位置但不一定拥有当前可见的 Room 对象。

## 最小完整示例

### `main` 模块

```js
module.exports.loop = function () {
  const flag = Game.flags.WorkTarget;
  if (!flag || flag.memory.enabled !== true) {
    return;
  }

  const creepName = flag.memory.creepName;
  const creep = creepName ? Game.creeps[creepName] : undefined;
  if (!creep) {
    return;
  }

  const result = creep.moveTo(flag, {
    visualizePathStyle: { stroke: '#00ff88' }
  });
  console.log('flag move result:', result);
};
```

## 检查顺序

1. Flag 和 enabled 配置检查。
2. creepName 缺失时不索引 Game.creeps。
3. Flag 可跨房间存在，因此不强制读取 flag.room。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [Memory 基础用法](/blog/screeps-memory-basics)
- [认识第一个房间](/blog/screeps-first-room)
- [第一份房间代码](/blog/screeps-first-room-code)

## 官方资料

- [Flag API](https://docs.screeps.com/api/#Flag)
- [Game.flags API](https://docs.screeps.com/api/#Game-flags)

