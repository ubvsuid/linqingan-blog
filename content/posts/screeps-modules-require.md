---
title: "Screeps 如何用 require 和 module.exports 安全拆分代码"
description: "把角色行为、Memory维护和房间逻辑拆成Node.js风格模块，统一导出契约、错误隔离、角色分派和global reset后的可重建状态。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "JavaScript"
  - "模块化"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（模块导出契约、角色分派、未知角色、异常隔离和统计结果，不是Screeps官方服务器）"
  testResult: "合法模块、缺失run、未知角色、Creep缺失、角色执行异常、成功与失败计数场景通过。"
featured: false
---

Screeps支持Node.js风格的 `require()` 和 `module.exports`。模块化的目的不是让文件数量越多越好，而是让每个文件有明确职责，并让 `main` 只负责当前tick的入口、调用顺序和错误边界。

本文聚焦一个基础结构：把角色行为拆成独立模块，在 `main` 中根据 `creep.memory.role` 分派，同时检查模块契约、未知角色和单个角色异常。

## `main` 必须保留什么职责

`main` 模块至少需要导出：

```js
module.exports.loop = function () {
  // 每tick入口
};
```

适合放在 `main` 的内容：

- 本tick顶层执行顺序；
- 全局维护任务；
- 房间遍历；
- Creep遍历；
- 模块调用；
- 顶层错误隔离；
- 低频摘要日志。

不适合长期全部堆在 `main`：

- 每种角色的完整行为；
- 市场、Lab、Tower等互不相关业务；
- 大量目标选择函数；
- 多套配置解析；
- 重复的返回值处理。

## 自定义模块应该导出明确契约

角色模块可以统一导出：

```js
module.exports = {
  role: 'worker',
  run(creep) {
    // 角色行为
  }
};
```

调用方就可以验证：

```js
typeof module.run === 'function'
```

比起有的模块导出函数、有的导出对象、有的使用 `execute`，统一契约更容易维护。

## 第一个角色模块

创建模块：

```text
role.worker
```

内容：

```js
function run(creep) {
  if (!creep || creep.spawning === true) {
    return {
      status: 'creep-unavailable'
    };
  }

  const controller = creep.room.controller;

  if (!controller || controller.my !== true) {
    return {
      status: 'owned-controller-not-found'
    };
  }

  if (
    creep.store.getUsedCapacity(
      RESOURCE_ENERGY
    ) === 0
  ) {
    return {
      status: 'energy-empty'
    };
  }

  const result = creep.upgradeController(controller);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(controller, {
      range: 3,
      reusePath: 10
    });

    return {
      status: 'moving-to-controller',
      result,
      moveResult
    };
  }

  return {
    status: result === OK
      ? 'upgrade-submitted'
      : 'upgrade-failed',
    result
  };
}

module.exports = {
  role: 'worker',
  run
};
```

模块返回普通结果对象，让 `main` 决定是否记录日志，而不是每个角色模块都无条件刷屏。

## 在 `main` 中引入模块

```js
const roleWorker = require('role.worker');
```

模块名必须与Screeps代码分支中的模块名称一致。不要写本地文件系统绝对路径。

先验证导出契约：

```js
function assertRoleModule(name, roleModule) {
  if (
    !roleModule
    || typeof roleModule !== 'object'
    || typeof roleModule.run !== 'function'
  ) {
    throw new TypeError(
      `${name} must export a run(creep) function`
    );
  }

  return roleModule;
}
```

在模块加载阶段尽早失败，比运行到某只Creep时才出现：

```text
roleModule.run is not a function
```

更容易定位。

## 用角色表代替连续 `if`

角色少时可以写：

```js
if (creep.memory.role === 'worker') {
  roleWorker.run(creep);
}
```

角色增加后，可以集中映射：

```js
const roleModules = {
  worker: roleWorker
};
```

分派函数：

```js
function dispatchCreep(creep, modules) {
  if (!creep) {
    return {
      status: 'creep-missing'
    };
  }

  const role = creep.memory?.role;

  if (typeof role !== 'string' || role.length === 0) {
    return {
      status: 'role-missing',
      creepName: creep.name
    };
  }

  const roleModule = modules[role];

  if (!roleModule) {
    return {
      status: 'role-module-missing',
      creepName: creep.name,
      role
    };
  }

  if (typeof roleModule.run !== 'function') {
    return {
      status: 'invalid-module-contract',
      creepName: creep.name,
      role
    };
  }

  try {
    const result = roleModule.run(creep);

    return {
      status: 'role-finished',
      creepName: creep.name,
      role,
      result: result ?? null
    };
  } catch (error) {
    return {
      status: 'role-threw',
      creepName: creep.name,
      role,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}
```

## 完整 `main` 示例

```js
const roleWorker = require('role.worker');

function assertRoleModule(name, roleModule) {
  if (
    !roleModule
    || typeof roleModule !== 'object'
    || typeof roleModule.run !== 'function'
  ) {
    throw new TypeError(
      `${name} must export a run(creep) function`
    );
  }

  return roleModule;
}

const roleModules = {
  worker: assertRoleModule(
    'role.worker',
    roleWorker
  )
};

function dispatchCreep(creep, modules) {
  if (!creep) {
    return {
      status: 'creep-missing'
    };
  }

  const role = creep.memory?.role;

  if (typeof role !== 'string' || role.length === 0) {
    return {
      status: 'role-missing',
      creepName: creep.name
    };
  }

  const roleModule = modules[role];

  if (!roleModule) {
    return {
      status: 'role-module-missing',
      creepName: creep.name,
      role
    };
  }

  if (typeof roleModule.run !== 'function') {
    return {
      status: 'invalid-module-contract',
      creepName: creep.name,
      role
    };
  }

  try {
    const result = roleModule.run(creep);

    return {
      status: 'role-finished',
      creepName: creep.name,
      role,
      result: result ?? null
    };
  } catch (error) {
    return {
      status: 'role-threw',
      creepName: creep.name,
      role,
      error: error instanceof Error
        ? error.message
        : String(error)
    };
  }
}

function summarizeDispatch(outcomes) {
  const summary = {};

  for (const outcome of outcomes) {
    summary[outcome.status] =
      (summary[outcome.status] || 0) + 1;
  }

  return summary;
}

module.exports.loop = function () {
  const outcomes = [];

  for (const creep of Object.values(Game.creeps)) {
    outcomes.push(
      dispatchCreep(creep, roleModules)
    );
  }

  const failures = outcomes.filter(outcome =>
    outcome.status !== 'role-finished'
  );

  for (const failure of failures) {
    console.log({
      type: 'creep-role-dispatch-failed',
      tick: Game.time,
      ...failure
    });
  }

  if (Game.time % 100 === 0) {
    console.log({
      type: 'creep-role-dispatch-summary',
      tick: Game.time,
      total: outcomes.length,
      statuses: summarizeDispatch(outcomes)
    });
  }
};
```

一个角色报错时，`try...catch`会保留其他Creep继续执行。但这不代表应该忽略异常；失败信息仍要被记录和修复。

## `require()` 应该放在哪里

通常把固定模块放在 `main` 顶层：

```js
const roleWorker = require('role.worker');
```

优点：

- 依赖在文件开头清楚可见；
- 模块契约可以提前检查；
- 不需要在角色循环中重复表达同一依赖；
- 更容易发现循环依赖和名称错误。

动态拼接模块名：

```js
require(`role.${creep.memory.role}`)
```

虽然看起来短，但会让未知角色、拼写错误和依赖范围更难审计。本文使用显式映射。

## 模块顶层代码与global reset

模块顶层代码不是永久初始化系统：

```js
const cache = new Map();
```

它可能在同一个global生命周期中被多个tick复用，但global reset后会重新创建。

因此模块顶层可以保存可重建缓存，不能保存唯一任务状态。需要持久的数据仍放进Memory，并在模块加载后从Memory恢复。

## 避免循环依赖

例如：

```text
main → role.worker → room.manager → role.worker
```

循环依赖会让导出对象在初始化过程中处于不完整状态，增加调试难度。

更清晰的依赖方向：

```text
main
├─ memory.manager
├─ room.manager
└─ role.worker
   └─ target.selector
```

底层工具不反向 `require('main')`，角色模块也不应互相调用形成环。

## 怎样拆分才不过度

建议在出现以下信号时拆分：

- 一个文件同时处理多个独立领域；
- 相同函数被多处复制；
- 单个角色逻辑已经难以单独测试；
- 配置解析和业务动作混在一起；
- 修改Tower逻辑却容易影响市场逻辑。

不需要为每个三行函数建立一个文件。模块边界应围绕职责，而不是追求文件数量。

## 常见错误

### 导出名称与调用不一致

模块导出 `execute`，main却调用 `run`。统一契约并在加载阶段检查。

### 忘记导出 `module.exports.loop`

Screeps无法获得主循环入口。

### 模块名拼写不一致

`require('role.worker')`必须对应实际模块名称。

### 动态require未知角色

Memory拼写错误会直接变成模块加载错误。使用显式映射并处理未知角色。

### 单个角色异常中止整个循环

按Creep建立错误边界，并记录失败对象和角色。

### 模块自己无限打印日志

让模块返回状态，由顶层统一控制日志频率。

### 把顶层缓存当成持久状态

global reset后会丢失。缓存必须可以重建。

### 把所有功能塞进一个“utils”模块

无关函数聚集后依赖关系仍然混乱。按领域命名更清楚。

## 离线模拟结果

构建检查覆盖：

1. 合法 `run(creep)` 模块；
2. 模块缺少 `run`；
3. Creep缺失；
4. 角色字段缺失；
5. 未知角色；
6. 角色模块抛出异常；
7. 成功结果返回；
8. 分派状态汇总。

离线测试使用普通对象和函数，不能模拟Screeps模块加载、global生命周期、真实Creep动作或CPU差异。

## 适用边界

本文只建立基础角色分派，不覆盖：

- TypeScript构建流程；
- npm依赖打包；
- WebAssembly二进制模块；
- 自动依赖注入；
- 完整任务队列；
- 多房间进程系统；
- 热更新兼容；
- 性能收益证明。

JavaScript语法和离线模块契约已检查，真实Screeps模块加载和多tick行为仍待环境验证。

## 相关站内内容

- [第一份房间基础代码](/blog/screeps-first-room-code)
- [Creep角色应该怎样分工](/blog/screeps-creep-roles)
- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [全局缓存为什么会失效](/blog/screeps-global-cache)
- [Game.cpu.getUsed()怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [进入Memory与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Organizing scripts using modules](https://docs.screeps.com/modules.html)
- [Scripting Basics](https://docs.screeps.com/scripting-basics.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Global Objects](https://docs.screeps.com/global-objects.html)

资料核对日期：2026-07-22。离线模块分派模拟已通过；真实模块加载仍待环境验证。
