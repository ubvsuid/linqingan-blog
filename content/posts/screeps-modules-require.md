---
title: "Screeps 如何用 require 和 module.exports 拆分代码"
description: "把角色行为导出为独立模块，并在 main 中 require 后遍历 Creep 调用，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps require module.exports"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文不搭建大型框架，只把一个容易误解的工程问题说清楚：把角色行为导出为独立模块，并在 main 中 require 后遍历 Creep 调用。

## 先给结论

第一份房间代码把逻辑写在一个 main；本文只解决模块边界、导出和入口，不重写角色行为。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

## 官方规则

- Screeps 支持 Node.js 风格的 require 与 module.exports。
- main 模块必须导出 module.exports.loop。
- 自定义模块应导出调用方实际使用的属性或函数。

## 最小完整示例

### `role.worker` 模块

```js
module.exports.run = function (creep) {
  if (!creep) {
    return;
  }

  console.log(creep.name + ' 正在执行 worker 模块');
};
```

### `main` 模块

```js
const roleWorker = require('role.worker');

module.exports.loop = function () {
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];

    if (creep.memory.role === 'worker') {
      roleWorker.run(creep);
    }
  }
};
```

## 检查顺序

1. 导出的 run 与调用属性一致。
2. main 顶层 require 模块。
3. main 明确导出 module.exports.loop。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Creep 角色分工](/blog/screeps-creep-roles)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Organizing scripts using modules](https://docs.screeps.com/modules.html)
- [Scripting Basics](https://docs.screeps.com/scripting-basics.html)

