---
title: "Screeps 一个房间报错导致其他房间停摆怎么办：异常隔离、限频日志与自动恢复"
description: "当某个Screeps房间或模块抛出JavaScript异常时，用房间级错误边界、限频日志、连续错误暂停和冷却重试，让其他房间继续执行，并区分异常、API返回码与CPU截止。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "JavaScript"
  - "运行诊断"
  - "自动化"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
---

某个房间出现下面这样的错误后，其他房间突然不工作：

```text
TypeError: Cannot read properties of undefined (reading 'x')
```

这通常不是其他房间同时坏了，而是当前 tick 的 JavaScript 执行在第一个未处理异常处提前结束，后面的房间代码没有机会运行。

稳定的处理方式不是隐藏错误，而是限制错误的影响范围：

1. 以房间或独立子系统作为错误边界；
2. 一个边界失败后继续执行下一个房间；
3. 保存房间名、模块名、tick、错误类型和有限长度的堆栈；
4. 对重复错误进行日志限频；
5. 可选任务连续失败时暂时停用；
6. 冷却结束后自动重试；
7. 关键生存逻辑与可选任务使用不同策略。

## 快速修复

最小版本可以这样写：

```js
for (const room of Object.values(Game.rooms)) {
  if (room.controller?.my !== true) {
    continue;
  }

  try {
    runRoom(room);
  } catch (error) {
    console.log(JSON.stringify({
      type: 'room-runtime-error',
      tick: Game.time,
      roomName: room.name,
      message: error instanceof Error
        ? error.message
        : String(error)
    }));
  }
}
```

控制流会变成：

```text
W1N1 抛出异常
→ 记录 W1N1 错误
→ 继续执行 W2N2
→ 继续执行 W3N3
```

这个版本能恢复其他房间的执行，但还没有解决重复刷屏、故障模块持续消耗 CPU 和自动恢复。后文会在此基础上增加完整状态。

## 为什么一个房间报错会影响后面的房间

常见的多房间循环是：

```js
module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    if (room.controller?.my !== true) {
      continue;
    }

    runRoom(room);
  }
};
```

假设当前顺序是 `W1N1`、`W2N2`、`W3N3`，而 `runRoom(Game.rooms.W1N1)` 内执行了：

```js
const anchor = room.memory.layout.controllerAnchor;
console.log(anchor.x);
```

当 `controllerAnchor` 不存在时，读取 `anchor.x` 会产生 `TypeError`。如果当前调用链没有对应的 `catch`，程序不会自动跳到下一次 `for` 循环。

结果是：

```text
W1N1：执行到一半并抛出异常
W2N2：本 tick 未执行
W3N3：本 tick 未执行
```

Screeps 会在下一 tick 再次调用主循环。如果输入状态没有变化，同一个错误通常还会重复出现。

## 先区分三种不同的失败

### JavaScript 异常

下面的代码在中间对象不存在时会抛出异常：

```js
const x = room.memory.layout.controllerAnchor.x;
```

常见类型包括：

- `TypeError`；
- `ReferenceError`；
- `RangeError`；
- 代码主动执行的 `throw`。

这种失败可以由 `try...catch` 捕获。

### Screeps API 返回码

动作方法通常返回 `OK` 或 `ERR_*`：

```js
const result = creep.transfer(
  target,
  RESOURCE_ENERGY
);
```

`ERR_NOT_IN_RANGE`、`ERR_FULL` 和 `ERR_INVALID_TARGET` 是普通返回值，不会因为外层存在 `try...catch` 就自动进入 `catch`。

正确方式仍然是保存并处理返回码：

```js
const result = creep.transfer(
  target,
  RESOURCE_ENERGY
);

if (result === ERR_NOT_IN_RANGE) {
  const moveResult = creep.moveTo(target);

  return {
    status: 'moving-to-target',
    result,
    moveResult
  };
}

return {
  status: result === OK
    ? 'transfer-submitted'
    : 'transfer-failed',
  result
};
```

异常保护不能代替动作返回值分支。

### CPU 执行截止

脚本超过当前 tick 可使用的 CPU 时，执行可能在后续任务开始前停止。不要依赖下面的设计恢复 CPU 截止：

```js
try {
  runExpensiveTask();
} catch (error) {
  console.log(error);
}
```

CPU 问题应通过关键任务前置、代码段测量、Bucket 趋势、任务分级和自动降载单独处理。异常隔离与 CPU 保护属于两个系统。

## 为什么不能只包住整个主循环

下面的写法仍然会跳过错误之后的所有房间：

```js
module.exports.loop = function () {
  try {
    runGlobalCleanup();
    runRoom(Game.rooms.W1N1);
    runRoom(Game.rooms.W2N2);
    runRoom(Game.rooms.W3N3);
  } catch (error) {
    console.log(error);
  }
};
```

如果 `W1N1` 抛错，控制流会直接进入 `catch`，然后离开主循环。`W2N2` 和 `W3N3` 仍然没有执行。

错误边界应包住希望独立存活的最小业务单元：

```js
for (const room of ownedRooms) {
  try {
    runRoom(room);
  } catch (error) {
    logRoomError(room.name, error);
  }
}
```

房间级边界适合多房间管理；角色级边界适合阻止单只 Creep 中断整个 Creep 循环；独立市场、统计或远程规划模块也可以拥有自己的边界。

## 生产版保护需要哪些状态

只在每 tick 加 `try...catch` 还会留下三个问题。

### 重复错误持续刷屏

同一个错误连续发生 500 tick 时，500 条相同日志很难阅读，也会掩盖其他故障。状态中至少需要保存：

```text
lastLogAt
```

只有距离上次输出达到指定 tick 数时才再次打印。

### 坏模块每 tick 重复消耗 CPU

RoomVisual、统计、市场扫描或远程路径计算持续报错时，即使异常已经捕获，它们仍会在每个 tick 重复执行到失败位置。

可选任务可以保存：

```text
errorTicks
disabledUntil
```

当指定窗口内的失败次数达到阈值时，暂时不再执行。

### 暂停后必须允许恢复

永久禁用会让一次临时对象缺失变成长期功能缺失。冷却结束后应自动尝试一次：

```text
当前 tick 到达 disabledUntil
→ 清理本轮错误窗口
→ 再执行任务
→ 成功则记录 recovered
→ 失败则重新进入错误统计
```

## 完整 `runtime.guard` 模块

创建 `runtime.guard` 模块：

```js
'use strict';

const DEFAULTS = Object.freeze({
  windowTicks: 100,
  maxErrors: 3,
  cooldownTicks: 50,
  logIntervalTicks: 20,
  breakerEnabled: true,
  notify: false,
  notifyGroupMinutes: 30
});

function getState(key) {
  Memory.runtimeGuard ??= {
    units: {}
  };

  Memory.runtimeGuard.units ??= {};

  Memory.runtimeGuard.units[key] ??= {
    errorTicks: [],
    consecutiveErrors: 0,
    totalErrors: 0,
    disabledUntil: null,
    lastLogAt: null,
    lastSuccessAt: null,
    lastError: null
  };

  return Memory.runtimeGuard.units[key];
}

function normalizeThrown(thrown) {
  if (thrown instanceof Error) {
    return {
      name: thrown.name || 'Error',
      message: thrown.message || String(thrown),
      stack: typeof thrown.stack === 'string'
        ? thrown.stack
            .split('\n')
            .slice(0, 6)
            .join('\n')
        : null
    };
  }

  let message;

  try {
    message = typeof thrown === 'string'
      ? thrown
      : JSON.stringify(thrown);
  } catch {
    message = String(thrown);
  }

  return {
    name: 'NonErrorThrow',
    message: message ?? String(thrown),
    stack: null
  };
}

function pruneErrors(state, windowTicks) {
  const firstTick = Game.time - windowTicks + 1;

  state.errorTicks = state.errorTicks.filter(
    tick => tick >= firstTick
  );
}

function canLog(state, intervalTicks) {
  return (
    !Number.isInteger(state.lastLogAt)
    || Game.time - state.lastLogAt >= intervalTicks
  );
}

function runGuarded(key, task, options = {}) {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new TypeError('key must be a non-empty string');
  }

  if (typeof task !== 'function') {
    throw new TypeError('task must be a function');
  }

  const config = {
    ...DEFAULTS,
    ...options
  };
  const state = getState(key);

  pruneErrors(state, config.windowTicks);

  if (
    config.breakerEnabled
    && Number.isInteger(state.disabledUntil)
    && Game.time < state.disabledUntil
  ) {
    return {
      ok: false,
      status: 'cooldown',
      key,
      retryAt: state.disabledUntil
    };
  }

  let retryingAfterCooldown = false;

  if (
    config.breakerEnabled
    && Number.isInteger(state.disabledUntil)
    && Game.time >= state.disabledUntil
  ) {
    state.disabledUntil = null;
    state.errorTicks = [];
    state.consecutiveErrors = 0;
    retryingAfterCooldown = true;
  }

  try {
    const value = task();
    const recovered =
      retryingAfterCooldown
      || state.consecutiveErrors > 0;

    state.consecutiveErrors = 0;
    state.lastSuccessAt = Game.time;
    state.lastError = null;

    if (
      recovered
      && canLog(state, config.logIntervalTicks)
    ) {
      console.log(JSON.stringify({
        type: 'runtime-guard-recovered',
        tick: Game.time,
        key
      }));
      state.lastLogAt = Game.time;
    }

    return {
      ok: true,
      status: recovered ? 'recovered' : 'ok',
      key,
      value
    };
  } catch (thrown) {
    const error = normalizeThrown(thrown);

    state.errorTicks.push(Game.time);
    pruneErrors(state, config.windowTicks);
    state.consecutiveErrors += 1;
    state.totalErrors += 1;
    state.lastError = {
      tick: Game.time,
      ...error
    };

    const breakerTripped =
      config.breakerEnabled
      && state.errorTicks.length >= config.maxErrors;

    if (breakerTripped) {
      state.disabledUntil =
        Game.time + config.cooldownTicks;
    }

    if (canLog(state, config.logIntervalTicks)) {
      console.log(JSON.stringify({
        type: 'runtime-guard-error',
        tick: Game.time,
        key,
        breakerTripped,
        retryAt: state.disabledUntil,
        errorCountInWindow: state.errorTicks.length,
        consecutiveErrors: state.consecutiveErrors,
        totalErrors: state.totalErrors,
        error
      }));
      state.lastLogAt = Game.time;
    }

    if (
      breakerTripped
      && config.notify
      && typeof Game.notify === 'function'
    ) {
      Game.notify(
        [
          '[runtime-guard]',
          key,
          'paused until',
          state.disabledUntil + ':',
          error.name + ':',
          error.message
        ].join(' '),
        config.notifyGroupMinutes
      );
    }

    return {
      ok: false,
      status: breakerTripped ? 'disabled' : 'error',
      key,
      retryAt: state.disabledUntil,
      error
    };
  }
}

module.exports = {
  runGuarded
};
```

示例中的 `100`、`3`、`50`、`20` 都是本地策略值，不是官方推荐阈值。应根据房间数量、故障频率和任务风险调整。

## 在 `main` 中区分关键任务与可选任务

关键任务通常包括：

- Tower 防御；
- Spawn 紧急恢复；
- 基础采集和运输；
- Controller 降级保护；
- 核心 Creep 角色调度。

可选任务通常包括：

- RoomVisual；
- 长期统计；
- 市场扫描；
- 远程路径预计算；
- 低优先级建设规划；
- 非紧急 Observer 扫描。

示例入口：

```js
const {
  runGuarded
} = require('runtime.guard');
const roomManager = require('room.manager');

function getOwnedRooms() {
  return Object.values(Game.rooms)
    .filter(room => room.controller?.my === true)
    .sort((left, right) =>
      left.name.localeCompare(right.name)
    );
}

module.exports.loop = function () {
  for (const room of getOwnedRooms()) {
    const criticalOutcome = runGuarded(
      `critical:${room.name}`,
      () => roomManager.runCritical(room),
      {
        breakerEnabled: false,
        logIntervalTicks: 20,
        notify: false
      }
    );

    if (!criticalOutcome.ok) {
      continue;
    }

    runGuarded(
      `optional:${room.name}`,
      () => roomManager.runOptional(room),
      {
        windowTicks: 100,
        maxErrors: 3,
        cooldownTicks: 50,
        logIntervalTicks: 20,
        breakerEnabled: true,
        notify: true,
        notifyGroupMinutes: 30
      }
    );
  }
};
```

关键任务使用：

```js
breakerEnabled: false
```

它表示关键层本 tick 失败后仍会被记录，当前房间的可选任务会被跳过，其他房间继续执行，下一 tick 再尝试关键层。不要把 Spawn、采集或防御整体暂停几十 tick。

可选任务在连续失败后进入冷却，可以避免坏模块每 tick 重复消耗 CPU。

## `room.manager` 的职责划分

下面的结构只展示边界，不代表固定的角色或建筑配置：

```js
function runCritical(room) {
  runTowerDefense(room);
  runEmergencySpawn(room);
  runEssentialCreeps(room);
  runControllerProtection(room);

  return {
    roomName: room.name,
    status: 'critical-complete'
  };
}

function runOptional(room) {
  runRoomVisual(room);
  runRoomStatistics(room);
  runRemotePlanning(room);

  return {
    roomName: room.name,
    status: 'optional-complete'
  };
}

module.exports = {
  runCritical,
  runOptional
};
```

划分时可以问：

> 这个任务停 50 tick，房间是否可能失去采集、生成、防御或 Controller 安全？

答案为“可能”时，它不应进入可选任务熔断区。

## 如何阅读结构化错误日志

一次错误记录可能是：

```json
{
  "type": "runtime-guard-error",
  "tick": 12345678,
  "key": "optional:W1N1",
  "breakerTripped": true,
  "retryAt": 12345728,
  "errorCountInWindow": 3,
  "consecutiveErrors": 3,
  "totalErrors": 9,
  "error": {
    "name": "TypeError",
    "message": "Cannot read properties of undefined (reading 'x')",
    "stack": "TypeError: ..."
  }
}
```

重点字段：

| 字段 | 含义 |
|---|---|
| `key` | 哪个房间和任务层失败 |
| `tick` | 本次失败发生时间 |
| `breakerTripped` | 是否在本次触发暂停 |
| `retryAt` | 最早重新尝试的 tick |
| `errorCountInWindow` | 当前窗口内的失败数量 |
| `consecutiveErrors` | 连续失败次数 |
| `totalErrors` | 当前状态记录中的累计失败次数 |
| `error.name` | JavaScript 异常类型 |
| `error.message` | 错误信息 |
| `error.stack` | 截断后的调用位置 |

不要把整个 Room、Creep 或大型 Memory 对象写入错误状态。只保存定位问题必需的字段。

## 为什么只保留有限长度的堆栈

完整堆栈可能很长，而且同一个错误可能不断重复。示例只保留前六行：

```js
const shortStack = typeof error.stack === 'string'
  ? error.stack
      .split('\n')
      .slice(0, 6)
      .join('\n')
  : null;
```

这些行通常足以看到报错函数和上层调用，又能避免错误记录持续膨胀。

## 为什么要处理非 `Error` 类型的 throw

JavaScript 允许抛出普通字符串或对象：

```js
throw {
  reason: 'missing-anchor',
  roomName: room.name
};
```

项目代码更适合使用：

```js
throw new Error('missing controller anchor');
```

保护层仍应处理其他值，避免在记录原异常时再次报错。`normalizeThrown()` 会把它们转换成 `NonErrorThrow`，并使用可序列化的消息。

## 捕获异常不等于修复异常

下面的写法会隐藏根因：

```js
try {
  runRoom(room);
} catch {
  // 没有错误记录
}
```

异常隔离的目的只是阻止影响扩散。仍然需要保留：

- 出错房间；
- 出错 tick；
- 错误类型与消息；
- 有限堆栈；
- 失败次数；
- 暂停和恢复状态。

同时，原始代码中的空值检查也必须修复。不能因为外层有保护器，就继续假设所有 Memory 字段和对象永久存在。

## 不要在每个动作外面套 `try...catch`

下面的粒度通常太细：

```js
try {
  creep.harvest(source);
} catch {}

try {
  creep.moveTo(source);
} catch {}
```

Screeps 动作的常规失败主要通过返回码表达。优先处理 `OK` 和 `ERR_*`，再在房间、角色调度器或独立高风险模块外建立异常边界。

## 冷却后如何自动恢复

假设：

```text
optional:W1N1
disabledUntil = 1050
```

当 `Game.time < 1050` 时，`runGuarded()` 返回：

```js
({
  ok: false,
  status: 'cooldown',
  key: 'optional:W1N1',
  retryAt: 1050
})
```

任务函数不会执行。

到达 `1050` 时，保护器会清理当前错误窗口并尝试一次。成功时输出：

```json
{
  "type": "runtime-guard-recovered",
  "tick": 1050,
  "key": "optional:W1N1"
}
```

再次失败时则重新记录错误并进入新的统计周期。

## 建议的排查顺序

### 找到第一条异常

不要只看最后一条重复日志。记录错误类型、消息、第一个项目代码位置、房间名和 `Game.time`。

### 检查错误边界

确认代码是否仍然直接遍历：

```js
for (const room of rooms) {
  runRoom(room);
}
```

没有房间级保护时，第一个异常会阻止后续循环体执行。

### 检查对象为什么不存在

常见来源包括：

- `room.memory.layout` 尚未初始化；
- Controller anchor 被删除或迁移；
- 目标 ID 已经失效；
- 房间当前没有视野；
- Creep Memory 仍是旧结构；
- 建筑被摧毁；
- global reset 后缓存尚未重建。

### 区分返回码和异常

如果日志里只有 `ERR_NOT_IN_RANGE`、`ERR_INVALID_TARGET` 或 `ERR_NOT_ENOUGH_ENERGY`，应修复动作分支，而不是修改异常保护器。

### 单独检查 CPU

没有 JavaScript 堆栈，但主循环仍经常只执行一部分时，检查：

```js
const snapshot = {
  used: Game.cpu.getUsed(),
  limit: Game.cpu.limit,
  tickLimit: Game.cpu.tickLimit,
  bucket: Game.cpu.bucket
};
```

### 观察恢复状态

修复输入或代码后，确认出现 `runtime-guard-recovered`，并观察后续多个 tick 是否持续正常。

## 常见错误

### 整个主循环只有一个错误边界

错误之后的所有任务仍然会被跳过。

### `catch` 中什么都不记录

其他房间可能恢复，但根因和发生时间会丢失。

### 用异常捕获代替 API 返回值处理

`ERR_*` 不会自动进入 `catch`。

### 关键 Spawn 或防御任务被长期暂停

熔断更适合可选任务。关键任务应保持最小、可诊断，并在下一 tick 继续尝试。

### 日志序列化整个游戏对象

只输出名称、ID、状态和必要字段，避免复杂对象和超长日志。

### 把示例阈值当作官方规则

窗口、次数、冷却和日志间隔都需要根据真实运行调整。

### 保护器在 `catch` 中再次读取损坏字段

错误记录应尽量只依赖 `Game.time`、字符串 key、`Memory.runtimeGuard` 和捕获到的值。

## 验证状态与适用边界

仓库会对本文 JavaScript 代码块执行 Node.js 语法检查。该检查可以发现语法错误，但不能模拟 Screeps 服务器、真实 `Game` 对象、CPU 终止、通知送达或多 tick 世界结算。

本文适合：

- 多房间代码；
- 按房间运行的管理器；
- 多个独立子系统；
- 可选统计和可视化模块；
- 临时数据不完整造成的异常；
- 发布新代码后的局部兼容问题。

本文不覆盖：

- `ERR_*` 返回码本身；
- CPU 超限恢复；
- 无限循环；
- SyntaxError 导致代码无法加载；
- 顶层 `require()` 阶段失败；
- 完整 Memory 版本迁移；
- 跨 shard 故障恢复；
- 官方服务器或 shard 故障。

如果模块在主循环开始前的加载阶段就失败，房间级 `runGuarded()` 尚未获得执行机会。高风险初始化应延迟到可保护的函数调用中，并在发布前完成语法和构建检查。

## 相关站内内容

- [Screeps 中的 tick 是什么？为什么代码会不断运行](/blog/screeps-tick-and-game-loop)
- [Screeps 如何用 require 和 module.exports 安全拆分代码](/blog/screeps-modules-require)
- [Game.cpu.getUsed() 和 bucket 怎么监控 CPU](/blog/screeps-cpu-getused-bucket)
- [Screeps CPU Bucket 一直下降怎么办：任务分级、降载与自动恢复](/blog/screeps-cpu-bucket-degradation)
- [Screeps Game.notify() 怎么发送限频提醒](/blog/screeps-game-notify)
- [Screeps Room Event Log 怎么查看房间事件](/blog/screeps-room-event-log)

## 官方资料

- [Scripting Basics](https://docs.screeps.com/scripting-basics.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [How does CPU limit work](https://docs.screeps.com/cpu-limit.html)
- [Game.notify() API](https://docs.screeps.com/api/Game.html#notify)
- [ECMAScript try Statement](https://tc39.es/ecma262/2026/multipage/ecmascript-language-statements-and-declarations.html#sec-try-statement)
