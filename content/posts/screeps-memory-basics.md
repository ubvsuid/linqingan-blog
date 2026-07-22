---
title: "Screeps Memory 是什么：跨 tick 状态、JSON 边界与使用成本"
description: "解释Game对象、模块全局变量和Memory的生命周期差异，演示Creep角色状态、版本迁移、对象ID保存和Memory体积控制。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Memory"
  - "基础工程"
  - "Creep"
  - "JavaScript"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（JSON兼容值、默认结构、版本迁移与对象ID字段，不是Screeps官方服务器）"
  testResult: "缺失Memory、旧版本迁移、非法角色、布尔状态、JSON可序列化值和不应保存的对象形态场景通过。"
featured: true
---

Screeps中的 `Memory` 是官方提供的跨tick持久数据入口。它适合保存角色、任务状态、对象ID、房间配置和少量统计，但不适合直接保存当前tick的完整游戏对象、函数或无限增长的日志。

本文只解决一个问题：哪些数据应该放进Memory，怎样初始化、读取和迁移，哪些状态应该在当前tick重新从 `Game` 对象取得。

## 先区分三种生命周期

### `Game`：每个tick重新创建

官方文档说明，`Game` 对象会在每个tick从头创建并填入当前可见的游戏状态。

```js
Game.creeps
Game.rooms
Game.structures
Game.time
```

不能通过直接修改普通属性来改变游戏状态：

```js
Game.customValue = 10;
```

这个值不是持久数据，也不会替代游戏API命令。

### 模块全局变量：可能跨多个tick复用，但不可靠持久

模块顶层变量可能在同一个global生命周期中继续存在：

```js
let cachedValue = null;
```

但global会在代码更新、运行环境重建或其他情况下重置。变量会回到初始值。

因此它适合做可以随时重建的缓存，不适合保存不能丢失的任务状态。

### `Memory`：官方持久JSON数据

```js
Memory.roomPlans ??= {};
Memory.roomPlans.W1N1 = {
  enabled: true,
  stage: 2
};
```

Memory会经过JSON序列化并传到后续tick。官方文档给出的总容量限制为2MB。

## Memory不是数据库对象，而是JSON数据

Memory适合保存：

- 字符串；
- 有限数字；
- 布尔值；
- `null`；
- 数组；
- 只包含JSON值的普通对象。

例如：

```js
Memory.settings = {
  homeRoom: 'W1N1',
  enabled: true,
  targetCount: 3,
  roles: ['harvester', 'upgrader']
};
```

不应直接保存：

- 函数；
- `Map`、`Set`等需要特殊恢复的实例；
- `undefined`字段；
- `Infinity`、`NaN`等不能稳定表达的数字；
- 完整Creep、Source、Structure等实时对象；
- 不断追加且没有保留上限的日志。

## 为什么不能保存完整游戏对象

下面的写法不安全：

```js
const source = creep.pos.findClosestByRange(
  FIND_SOURCES
);

creep.memory.source = source;
```

Source对象属于当前tick。经过JSON序列化后，它不再是下一tick的实时Source，也没有原型方法和最新状态。

正确方式是保存ID：

```js
creep.memory.sourceId = source.id;
```

后续tick重新取得对象：

```js
const source = Game.getObjectById(
  creep.memory.sourceId
);
```

`Game.getObjectById()`可能返回 `null`，因此仍需检查对象是否存在和房间是否可见。

## `creep.memory` 与 `Memory.creeps`

Creep提供了便捷属性：

```js
creep.memory
```

它对应：

```js
Memory.creeps[creep.name]
```

例如：

```js
creep.memory.role = 'harvester';
```

与：

```js
Memory.creeps[creep.name].role = 'harvester';
```

指向同一份Creep专属Memory。

Creep死亡后，游戏对象会从 `Game.creeps` 消失，但名称对应的Memory可能继续存在，因此需要单独清理。

## 创建Creep时直接写入Memory

`spawnCreep()`可以在选项中设置初始Memory：

```js
const result = Game.spawns.Spawn1.spawnCreep(
  [WORK, CARRY, MOVE],
  'Harvester1',
  {
    memory: {
      role: 'harvester',
      homeRoom: 'W1N1',
      working: false,
      memoryVersion: 1
    }
  }
);

console.log('spawn result:', result);
```

仍然要保存并处理 `spawnCreep()` 的返回值。写入选项不代表Creep一定成功创建。

## 自定义字段没有官方含义

这些字段都来自玩家代码：

```js
creep.memory.role
creep.memory.working
creep.memory.task
creep.memory.homeRoom
```

Screeps不会因为：

```js
creep.memory.role = 'builder';
```

就自动让Creep建造。主循环必须读取字段并调用对应动作。

建议为自定义字段建立明确约定：

| 字段 | 类型 | 含义 |
|---|---|---|
| `role` | string | 长期职责 |
| `working` | boolean | 当前在获取资源还是消耗资源 |
| `targetId` | string/null | 需要重新恢复的游戏对象ID |
| `homeRoom` | string | 所属房间名 |
| `memoryVersion` | integer | 数据结构版本 |

## 安全初始化一个Creep的Memory

```js
const ALLOWED_ROLES = new Set([
  'harvester',
  'upgrader',
  'builder'
]);

function normalizeCreepMemory(creep) {
  const memory = creep.memory;

  if (!Number.isInteger(memory.memoryVersion)) {
    memory.memoryVersion = 1;
  }

  if (!ALLOWED_ROLES.has(memory.role)) {
    memory.role = 'harvester';
  }

  if (typeof memory.working !== 'boolean') {
    memory.working = false;
  }

  if (
    memory.targetId !== undefined
    && memory.targetId !== null
    && typeof memory.targetId !== 'string'
  ) {
    delete memory.targetId;
  }

  if (
    typeof memory.homeRoom !== 'string'
    || memory.homeRoom.length === 0
  ) {
    memory.homeRoom = creep.room.name;
  }

  return memory;
}
```

默认角色只是示例策略。真实项目可以选择停止该Creep并记录配置错误，而不是自动改成采集者。

## 用版本号迁移旧Memory

代码结构变化后，旧Creep可能仍保留旧字段。例如以前使用：

```js
creep.memory.job = 'harvest';
```

后来改成：

```js
creep.memory.role = 'harvester';
```

可以显式迁移：

```js
function migrateCreepMemory(memory) {
  const version = Number.isInteger(memory.memoryVersion)
    ? memory.memoryVersion
    : 0;

  if (version < 1) {
    if (memory.job === 'harvest') {
      memory.role = 'harvester';
    }

    delete memory.job;
    memory.memoryVersion = 1;
  }

  return memory;
}
```

迁移应满足：

- 相同版本重复运行不会继续破坏数据；
- 旧字段只在新字段已经确定后删除；
- 未识别值不应静默转换成错误角色；
- 大规模迁移前保留可恢复方案。

## 完整主循环示例

```js
const ALLOWED_ROLES = new Set([
  'harvester',
  'upgrader',
  'builder'
]);

function migrateCreepMemory(memory) {
  const version = Number.isInteger(memory.memoryVersion)
    ? memory.memoryVersion
    : 0;

  if (version < 1) {
    if (memory.job === 'harvest') {
      memory.role = 'harvester';
    }

    delete memory.job;
    memory.memoryVersion = 1;
  }

  return memory;
}

function normalizeCreepMemory(creep) {
  const memory = migrateCreepMemory(creep.memory);

  if (!ALLOWED_ROLES.has(memory.role)) {
    memory.role = 'harvester';
  }

  if (typeof memory.working !== 'boolean') {
    memory.working = false;
  }

  if (
    memory.targetId !== undefined
    && memory.targetId !== null
    && typeof memory.targetId !== 'string'
  ) {
    delete memory.targetId;
  }

  if (
    typeof memory.homeRoom !== 'string'
    || memory.homeRoom.length === 0
  ) {
    memory.homeRoom = creep.room.name;
  }

  return memory;
}

module.exports.loop = function () {
  for (const creep of Object.values(Game.creeps)) {
    const memory = normalizeCreepMemory(creep);

    if (Game.time % 100 === 0) {
      console.log({
        type: 'creep-memory-status',
        creepName: creep.name,
        role: memory.role,
        working: memory.working,
        homeRoom: memory.homeRoom,
        memoryVersion: memory.memoryVersion
      });
    }
  }
};
```

日志降低为每100tick一次，避免正常状态长期刷屏。`100`是本站示例值，不是官方要求。

## Memory的首次访问成本

官方文档说明，Memory以字符串形式保存，脚本在一个tick中首次访问 `Memory` 时会进行JSON解析，CPU成本计入脚本消耗。

这意味着：

- Memory越大，解析与序列化成本通常越值得关注；
- 无限制保存历史日志会同时增加空间和CPU压力；
- 不要为了减少一次 `Game.getObjectById()` 而把完整对象快照塞入Memory；
- 性能结论必须用真实环境的 `Game.cpu.getUsed()` 多次测量，不能只靠文章推断。

## 控制Memory增长

保存历史时应设置上限：

```js
function appendLimitedHistory(list, entry, limit) {
  list.push(entry);

  while (list.length > limit) {
    list.shift();
  }
}

Memory.cpuHistory ??= [];
appendLimitedHistory(
  Memory.cpuHistory,
  {
    tick: Game.time,
    value: Game.cpu.getUsed()
  },
  100
);
```

更适合长期保存的是聚合数据，例如计数、平均值、最后发生tick，而不是每个tick的完整对象快照。

## JSON兼容性怎样离线检查

```js
function isJsonCompatible(value) {
  try {
    const serialized = JSON.stringify(value);
    return serialized !== undefined;
  } catch {
    return false;
  }
}
```

这个检查只能判断是否能序列化，不能证明数据结构适合长期保存，也不能发现所有语义问题。

例如：

```js
JSON.stringify({ value: undefined })
```

虽然不会抛错，但字段会消失。因此重要字段仍应检查具体类型。

## 常见错误

### 把模块全局变量当成永久存储

它可能跨多个tick存在，但global reset后会丢失。只能保存可重建缓存。

### 把完整对象写入Memory

后续取到的不是当前tick实时对象。保存ID并重新恢复。

### 不限制数组长度

历史数组持续增长会消耗2MB容量并增加解析负担。

### 直接相信Memory中的类型

Memory可以被旧代码、Console或迁移过程修改。关键字段应验证字符串、数字、布尔值和版本。

### Creep死亡后不清理旧键

`Memory.creeps[name]`可能在对象消失后继续存在，影响统计和补员逻辑。

### 把状态字段当成动作

`working = true`只记录决定，不会自动调用建造、运输或升级API。

### 每tick打印全部Memory

大对象日志难以阅读，也不能证明长期运行稳定。只输出必要字段并控制频率。

## 离线模拟结果

构建检查覆盖：

1. 缺失版本字段；
2. 旧 `job` 字段迁移；
3. 非法角色回退；
4. `working` 类型修正；
5. 非字符串目标ID清理；
6. JSON兼容普通对象；
7. 函数和循环引用等不适合Memory的输入；
8. 有上限的历史数组。

离线测试不能模拟官方Memory首次解析成本、2MB限制触发、global reset或真实多tick序列化。

## 适用边界

本文不覆盖：

- RawMemory自定义序列化；
- Memory segments；
- InterShardMemory；
- 大型数据库同步；
- 完整任务系统；
- 自动角色补员；
- 性能优化结论；
- Schema验证库。

JavaScript语法和离线数据规范化已检查，真实Memory持久化、CPU消耗和global生命周期仍待Screeps环境验证。

## 相关站内内容

- [如何清理死亡Creep的Memory](/blog/screeps-clean-dead-creep-memory)
- [Creep如何切换工作状态](/blog/screeps-creep-working-state)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [RawMemory segments怎么使用](/blog/screeps-rawmemory-segments)
- [全局缓存为什么会失效](/blog/screeps-global-cache)
- [进入Memory与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Global Objects：Game与Memory](https://docs.screeps.com/global-objects.html)
- [Game API](https://docs.screeps.com/api/#Game)
- [Game.getObjectById API](https://docs.screeps.com/api/#Game.getObjectById)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线数据规范化模拟已通过；真实Memory环境仍待验证。
