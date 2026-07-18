---
title: "Screeps Memory 是什么？新手为什么需要使用 Memory"
description: "从 tick、Game 对象和固定 Creep 名称出发，解释 Screeps Memory 如何跨 tick 保存 role、working 等简单状态，以及哪些内容不应该放进 Memory。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
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
  checkedAt: "2026-07-19"
featured: true
---

> **Screeps 基础工程 · 第 1 篇**
> 本文承接现有的新手路线，开始解释如何让代码在多个 tick 之间记住角色和工作状态。

> **测试说明**
> 本文最后测试于 2026 年 7 月，基于 Screeps: World 当前官方文档。

## 这篇文章解决什么问题

完成新手路线后，你可能已经能够：

- 找到固定名称的 Creep；
- 让它采集和运输 Energy；
- 让不同 Creep 分别升级、建造或维修；
- 把多个行为放进 `module.exports.loop`。

但固定名称代码很快会遇到问题：

```javascript
const harvester = Game.creeps.Harvester1;
const upgrader = Game.creeps.Upgrader1;
const builder = Game.creeps.Builder1;
```

当 Creep 死亡、名称变化或数量增加时，这种写法会越来越难维护。

Memory 的第一个用途，就是把“这只 Creep 负责什么”和“它现在处于什么状态”保存下来。

## 一、为什么普通变量不能跨 tick 保存状态

Screeps 会在每个 tick 重新执行你的主循环。

下面这个变量只属于当前一次代码执行：

```javascript
let working = false;
```

进入下一个 tick 后，脚本会重新运行，这个变量也会重新变成 `false`。

这就是为什么下面的代码不能长期记住状态：

```javascript
module.exports.loop = function () {
  let working = false;

  if (working) {
    console.log('正在工作');
  }
};
```

如果还不熟悉 tick，可以先阅读[《Screeps 中的 tick 是什么？》](/blog/screeps-tick-and-game-loop)。

## 二、Memory 是什么

Screeps 提供了一个全局对象：

```javascript
Memory
```

可以先把它理解成：

> **Memory 是可以在不同 tick 之间保存简单数据的地方。**

例如：

```javascript
Memory.testValue = 1;
```

在后面的 tick 中再次读取：

```javascript
console.log(Memory.testValue);
```

仍然可以得到：

```text
1
```

官方文档说明，`Game` 对象会在每个 tick 中重新创建，而 Memory 中写入的 JSON 数据会被保存到后续 tick。

## 三、Creep 的 memory 属性是什么

每只 Creep 都有一个方便使用的属性：

```javascript
creep.memory
```

例如：

```javascript
const creep = Game.creeps.Harvester1;
creep.memory.role = 'harvester';
```

这段代码会为这只 Creep 保存一个 `role` 字段。

之后可以读取：

```javascript
console.log(creep.memory.role);
```

输出：

```text
harvester
```

`creep.memory` 实际上对应：

```javascript
Memory.creeps[creep.name]
```

所以下面两种读取方式指向的是同一份 Creep Memory：

```javascript
creep.memory.role
Memory.creeps[creep.name].role
```

## 四、为什么要给 Creep 保存 role

在前面的[角色分工文章](/blog/screeps-creep-roles)中，Harvester、Upgrader 和 Builder 只是玩家为工作职责起的名字。

使用 Memory 后，可以把角色直接保存到 Creep 身上：

```javascript
creep.memory.role = 'harvester';
```

然后遍历所有 Creep，根据 role 决定它们应该执行什么行为：

```javascript
for (const name in Game.creeps) {
  const creep = Game.creeps[name];

  if (creep.memory.role === 'harvester') {
    console.log(creep.name + ' 负责采集');
  }

  if (creep.memory.role === 'upgrader') {
    console.log(creep.name + ' 负责升级');
  }
}
```

这比只依赖 `Harvester1`、`Harvester2` 等固定名称更容易扩展。

## 五、创建 Creep 时直接写入 Memory

`spawnCreep()` 的第三个参数可以接收选项对象，其中可以包含 `memory`。

例如：

```javascript
Game.spawns.Spawn1.spawnCreep(
  [WORK, CARRY, MOVE],
  'Harvester1',
  {
    memory: {
      role: 'harvester'
    }
  }
);
```

创建完成后，这只 Creep 可以直接读取：

```javascript
creep.memory.role
```

这样就不需要在 Creep 出生以后再单独设置一次角色。

开始使用这段代码前，应先熟悉[《如何使用 spawnCreep() 创建 Creep》](/blog/screeps-spawn-create-creep)。

## 六、creep.memory.working 是做什么的

`working` 不是 Screeps 强制规定的字段，而是玩家自己保存的状态。

它通常用于区分两种阶段：

```text
false：采集或获取 Energy
true：消耗 Energy 工作
```

例如：

```javascript
if (creep.store.getFreeCapacity() === 0) {
  creep.memory.working = true;
}

if (creep.store[RESOURCE_ENERGY] === 0) {
  creep.memory.working = false;
}
```

然后根据状态选择行为：

```javascript
if (creep.memory.working) {
  console.log('开始工作');
} else {
  console.log('开始获取能量');
}
```

完整逻辑可以理解为：

> 没有 Energy → 获取 Energy → 装满后切换为 working → 消耗完后重新获取 Energy

这个字段名也可以改成 `delivering`、`building` 或其他名称。重要的是代码中的含义保持一致。

## 七、Memory 中适合保存什么

新手阶段适合保存简单、能够转成 JSON 的数据。

### 适合保存

```javascript
creep.memory.role = 'builder';
creep.memory.working = true;
creep.memory.targetId = '5bbcac...';
creep.memory.homeRoom = 'E51S44';
```

常见类型包括：

- 字符串；
- 数字；
- 布尔值；
- 数组；
- 只包含简单数据的对象；
- 游戏对象的 ID。

### 不适合直接保存

不要把完整的 Creep、Source 或 Structure 对象直接放进 Memory：

```javascript
// 不推荐
creep.memory.source = source;
```

游戏对象属于当前 tick。即使写进 Memory，后续也不能把它当成新的有效游戏对象继续使用。

更合适的方法是保存 ID：

```javascript
creep.memory.sourceId = source.id;
```

需要使用时，再从当前 tick 的 `Game` 对象中取回：

```javascript
const source = Game.getObjectById(creep.memory.sourceId);
```

## 八、Creep 死亡后，Memory 为什么可能还在

Creep 和 Memory 是两套不同的数据。

Creep 死亡后：

```javascript
Game.creeps[name]
```

会消失，但对应的：

```javascript
Memory.creeps[name]
```

不一定自动删除。

所以代码运行一段时间后，Memory 中可能留下已经死亡 Creep 的旧数据。

新手现在只需要知道这个现象。后续会单独介绍如何安全清理死亡 Creep 的 Memory，并避免误删仍然有效的数据。

## 九、最小可运行示例

下面的代码只做三件事：

1. 找到一只固定名称的 Creep；
2. 第一次运行时写入 role；
3. 在 Console 输出保存的角色。

```javascript
module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;

  if (!creep) {
    console.log('没有找到 Harvester1');
    return;
  }

  if (!creep.memory.role) {
    creep.memory.role = 'harvester';
  }

  console.log(creep.name + ' 的角色是 ' + creep.memory.role);
};
```

保存代码后，可以观察：

```text
Harvester1 的角色是 harvester
```

之后即使进入新的 tick，`role` 仍然会保存在这只 Creep 的 Memory 中。

## 十、常见错误

### 1. creep 是 undefined

```javascript
const creep = Game.creeps.Harvester1;
creep.memory.role = 'harvester';
```

如果游戏中不存在 `Harvester1`，第二行就会报错。

应先检查：

```javascript
if (!creep) {
  return;
}
```

### 2. role 拼写不一致

下面两个值不会被视为同一个角色：

```text
harvester
Harvester
```

建议统一使用小写字符串。

### 3. 把完整游戏对象保存进 Memory

应保存对象 ID，而不是对象本身。

### 4. 保存了状态，却没有使用状态

仅仅写入：

```javascript
creep.memory.working = true;
```

不会自动让 Creep 开始工作。程序还需要读取该字段，并据此调用 `harvest()`、`transfer()`、`build()` 或其他方法。

## 当前方案的限制

本文仍然使用固定名称 `Harvester1` 来帮助理解 Memory。

它还没有解决：

- 自动统计角色数量；
- Creep 死亡后自动补员；
- 提前生产替代 Creep；
- 清理死亡 Creep 的旧 Memory；
- 把不同角色拆成独立模块。

这些内容属于下一阶段的基础工程，而不是一次全部塞进第一篇文章。

## 总结

Memory 的核心用途不是让代码变复杂，而是让程序能够记住跨 tick 的简单状态。

本篇最需要记住的是：

```text
Game：当前 tick 的游戏对象
Memory：跨 tick 保存的简单数据
creep.memory：当前 Creep 对应的 Memory 数据
```

最常见的第一步是：

```javascript
creep.memory.role = 'harvester';
```

当你能够为 Creep 保存和读取 role 后，就可以继续学习角色数量统计、自动补员和模块拆分。

## 官方参考资料

1. [Screeps Documentation：Global Objects 与 Memory](https://docs.screeps.com/global-objects.html)
2. [Screeps API Reference：Creep.memory](https://docs.screeps.com/api/#Creep.memory)
3. [Screeps API Reference：StructureSpawn.spawnCreep](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
4. [Screeps API Reference：Game.getObjectById](https://docs.screeps.com/api/#Game.getObjectById)

> 本文只介绍 Memory 的基础用途。RawMemory、Memory 解析成本、缓存和性能优化会放到更后面的专业内容中。

