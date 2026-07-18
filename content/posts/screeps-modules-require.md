
---
title: "Screeps 如何用 require 和 module.exports 拆分代码"
description: "把角色行为通过 module.exports 导出为独立模块，并在 main 中 require 后遍历 Creep 调用。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "JavaScript"
  - "模块化"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


本文把角色行为导出为独立模块，并在 `main` 中 `require` 后遍历 Creep 调用。

## 先给结论

第一份房间代码把逻辑写在 `main`；这里把角色行为导出到独立模块，再由 `main` 使用 `require()` 引入并逐只调用。

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

