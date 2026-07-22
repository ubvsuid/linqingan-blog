---
title: "Screeps 如何安全清理死亡 Creep 的 Memory"
description: "比较Game.creeps与Memory.creeps，删除已不存在Creep的残留数据，并同步清理受控任务索引、限制日志频率和避免误删其他模块状态。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Creep"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（普通对象模拟Game.creeps、Memory.creeps与受控任务索引，不是Screeps官方服务器）"
  testResult: "保留存活名称、删除死亡名称、Memory.creeps缺失、自定义索引同步、未知结构保留和日志摘要场景通过。"
featured: false
---

Creep死亡后，它会从当前tick的 `Game.creeps` 中消失，但以名称保存在 `Memory.creeps` 中的数据可能继续存在。

安全清理的核心判断是：

```text
Memory.creeps 中存在名称
并且
Game.creeps 中不存在同名Creep
→ 可以删除这个名称对应的Creep Memory
```

本文只解决一个问题：怎样删除确定已经失效的Creep专属Memory，并同步处理自己明确管理的任务索引，而不是把整个Memory区域清空。

## 为什么必须从 `Memory.creeps` 开始遍历

`Game.creeps` 只包含当前属于自己的存活Creep：

```js
Game.creeps
```

死亡Creep已经不在这里，因此下面的遍历找不到死亡名称：

```js
for (const name in Game.creeps) {
  // 这里只能看到存活Creep
}
```

正确方向是遍历持久数据：

```js
for (const name in Memory.creeps) {
  if (!Game.creeps[name]) {
    delete Memory.creeps[name];
  }
}
```

## 最小安全函数

```js
function cleanDeadCreepMemory() {
  if (
    !Memory.creeps
    || typeof Memory.creeps !== 'object'
  ) {
    return [];
  }

  const removedNames = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (Game.creeps[name]) {
      continue;
    }

    delete Memory.creeps[name];
    removedNames.push(name);
  }

  return removedNames;
}
```

返回删除名称数组比只返回数量更容易在需要时做摘要日志或同步清理。

## 为什么不应该每删除一个就长期打印

下面的日志在房间规模扩大后容易刷屏：

```js
console.log(`removed dead creep: ${name}`);
```

更适合的是一次汇总：

```js
const removedNames = cleanDeadCreepMemory();

if (removedNames.length > 0) {
  console.log({
    type: 'dead-creep-memory-cleanup',
    tick: Game.time,
    count: removedNames.length,
    names: removedNames
  });
}
```

删除事件只发生在Creep生命周期结束时，不会每tick持续输出同一名称。

## 自定义任务表不会自动同步

项目还可能保存：

```js
Memory.creepTasks = {
  Worker1: {
    targetId: 'abc'
  }
};
```

删除：

```js
delete Memory.creeps.Worker1;
```

不会自动删除：

```js
Memory.creepTasks.Worker1
```

应为自己明确管理的结构增加同步规则：

```js
function removeCreepFromManagedIndexes(name) {
  if (
    Memory.creepTasks
    && typeof Memory.creepTasks === 'object'
  ) {
    delete Memory.creepTasks[name];
  }

  if (
    Memory.creepAssignments
    && typeof Memory.creepAssignments === 'object'
  ) {
    delete Memory.creepAssignments[name];
  }
}
```

不要扫描并删除Memory中所有同名键。其他模块可能碰巧使用相同字符串，但语义完全不同。

## 完整示例

```js
function removeCreepFromManagedIndexes(name) {
  if (
    Memory.creepTasks
    && typeof Memory.creepTasks === 'object'
  ) {
    delete Memory.creepTasks[name];
  }

  if (
    Memory.creepAssignments
    && typeof Memory.creepAssignments === 'object'
  ) {
    delete Memory.creepAssignments[name];
  }
}

function cleanDeadCreepMemory() {
  if (
    !Memory.creeps
    || typeof Memory.creeps !== 'object'
  ) {
    return [];
  }

  const removedNames = [];

  for (const name of Object.keys(Memory.creeps)) {
    if (Game.creeps[name]) {
      continue;
    }

    delete Memory.creeps[name];
    removeCreepFromManagedIndexes(name);
    removedNames.push(name);
  }

  return removedNames;
}

module.exports.loop = function () {
  const removedNames = cleanDeadCreepMemory();

  if (removedNames.length > 0) {
    console.log({
      type: 'dead-creep-memory-cleanup',
      tick: Game.time,
      count: removedNames.length,
      names: removedNames.slice(0, 20),
      truncated: removedNames.length > 20
    });
  }

  // 后续再执行角色统计、补员和任务分配。
};
```

把清理放在角色统计和补员前，可以避免后续逻辑把死亡名称算进现有数量。

## 每tick清理还是定期清理

每tick遍历 `Memory.creeps` 的优点：

- 数据很快保持一致；
- 补员前不会读取旧名称；
- 逻辑最简单。

当Creep数量非常多时，也可以降低频率：

```js
if (Game.time % 10 === 0) {
  cleanDeadCreepMemory();
}
```

`10`是本站示例值，不是官方推荐值。降低频率意味着残留数据可能继续存在最多若干tick，角色统计必须能接受这个延迟。

## 为什么不能只根据TTL清理

Creep的 `ticksToLive` 接近0，不代表当前tick已经死亡。它仍然存在于 `Game.creeps` 时，Memory仍然属于有效对象。

不要根据上一tick保存的寿命预测直接删除：

```js
if (creep.memory.lastTicksToLive === 1) {
  delete Memory.creeps[creep.name];
}
```

当前 `Game.creeps[name]` 是否存在，才是本文使用的清理依据。

## 名称重用时需要注意什么

Creep名称是 `Game.creeps` 和 `Memory.creeps` 的键。若项目计划重复使用旧名称，应在创建前保证：

- 旧Creep已经不存在；
- 旧Memory已清理或明确迁移；
- `spawnCreep()`提供的新Memory符合当前版本；
- 旧任务索引不会被新Creep误继承。

本文清理函数可以降低旧状态遗留风险，但不能替代完整的命名和生成策略。

## 用纯函数离线验证删除集合

```js
function findDeadCreepNames(memoryCreeps, gameCreeps) {
  if (
    !memoryCreeps
    || typeof memoryCreeps !== 'object'
  ) {
    return [];
  }

  const live = gameCreeps
    && typeof gameCreeps === 'object'
    ? gameCreeps
    : {};

  return Object.keys(memoryCreeps)
    .filter(name => !live[name])
    .sort();
}
```

这个函数只计算应删除的名称，不修改输入，适合覆盖边界测试。

## 常见错误

### 遍历 `Game.creeps` 找死亡单位

死亡对象已经不在该集合中。应遍历 `Memory.creeps`。

### 直接删除整个 `Memory.creeps`

```js
delete Memory.creeps;
```

这会同时删除所有存活Creep的专属Memory。

### 清理发生在角色统计之后

前面的统计已经读取旧数据，可能导致少生成一只替代Creep。

### 删除所有Memory中的同名键

只有明确属于Creep名称索引的结构才能同步删除。

### 把清理日志当成死亡原因

日志只能说明当前tick看不到该名称，不能告诉你Creep是寿命结束、战斗死亡、回收还是其他原因。

### 认为清理函数能修复全部引用

按ID保存的任务、房间队列和跨Creep协作数据需要各自的失效规则。

## 离线模拟结果

构建检查覆盖：

1. 保留存活Creep的Memory；
2. 删除多个死亡名称；
3. `Memory.creeps`缺失；
4. `Game.creeps`缺失或为空；
5. 同步删除受控任务索引；
6. 不删除未知Memory结构；
7. 删除名称稳定排序；
8. 日志名称截断策略。

离线测试只使用普通对象，不能模拟真实Creep死亡、Memory序列化、名称重新创建或多tick补员。

## 适用边界

本文只处理按Creep名称索引的数据，不覆盖：

- 战斗死亡原因分析；
- Creep替代生产；
- 提前续接角色；
- 任务自动转移；
- 按对象ID保存的其他缓存；
- Power Creep状态；
- 多Shard任务同步。

JavaScript语法和离线删除集合已检查，真实死亡与补员周期仍待Screeps环境验证。

## 相关站内内容

- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [Creep如何切换工作状态](/blog/screeps-creep-working-state)
- [房间断代后怎样恢复采集者](/blog/screeps-spawn-emergency-recovery)
- [spawnCreep()返回值怎么排查](/blog/screeps-spawncreep-return-codes)
- [Game.getObjectById()怎么恢复目标](/blog/screeps-game-get-object-by-id)
- [进入Memory与代码工程专题](/knowledge/memory-engineering)

## 官方资料

- [Global Objects：Game与Memory](https://docs.screeps.com/global-objects.html)
- [Game.creeps API](https://docs.screeps.com/api/#Game-creeps)
- [Creep API](https://docs.screeps.com/api/#Creep)

资料核对日期：2026-07-22。离线清理模拟已通过；真实Creep生命周期仍待环境验证。
