---
title: "Room.getEventLog() 怎么读取上一 tick 的房间事件"
description: "解释 Room.getEventLog() 返回上一 tick 事件的时序、raw 参数和不同 event.data 结构，并提供己方目标受击筛选、事件汇总与长期记录边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Room API"
  - "事件日志"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（普通事件对象与目标所有权，不是 Screeps 官方服务器）"
  testResult: "攻击事件过滤、缺失 targetId、非己方目标和其他事件类型场景通过。"
featured: false
---

`Room.getEventLog()` 用来读取一个房间**上一 tick 已经发生的事件**。它不是当前代码刚刚提交的命令列表，也不会自动保存长期历史。

本文只解决一个问题：怎样筛选上一 tick 中针对己方Creep或建筑的攻击事件，并正确处理`event.data`、目标已经消失和房间视野等边界。

## 先修正最容易混淆的时序

假设当前是tick 100：

1. tick 99 中Creep或建筑执行攻击、建造、维修等动作；
2. tick 100 开始时，游戏对象状态已经更新；
3. tick 100 中调用`room.getEventLog()`，读取的是tick 99发生的事件；
4. tick 100刚提交的动作，要到后续tick才能在事件日志中观察。

因此，下面的写法不能证明当前tick刚调用的`attack()`已经产生事件：

```js
creep.attack(target);
const events = creep.room.getEventLog();
```

`events`对应的是上一tick，而不是这行`attack()`的即时结果。

## 返回值的基本结构

默认调用：

```js
const events = room.getEventLog();
```

返回已经解析的事件数组。每个事件至少围绕这些字段组织：

```js
{
  event: EVENT_ATTACK,
  objectId: '执行动作的对象ID',
  data: {
    targetId: '目标对象ID',
    damage: 30,
    attackType: EVENT_ATTACK_TYPE_MELEE
  }
}
```

不同事件类型的`data`结构不同。例如：

| 事件类型 | `data`中常见字段 |
|---|---|
| `EVENT_ATTACK` | `targetId`、`damage`、`attackType` |
| `EVENT_BUILD` | `targetId`、`amount`、`structureType`、`x`、`y`、`incomplete` |
| `EVENT_HARVEST` | `targetId`、`amount` |
| `EVENT_HEAL` | `targetId`、`amount`、`healType` |
| `EVENT_REPAIR` | `targetId`、`amount`、`energySpent` |
| `EVENT_UPGRADE_CONTROLLER` | `amount`、`energySpent` |
| `EVENT_TRANSFER` | `targetId`、`resourceType`、`amount` |
| `EVENT_EXIT` | `room`、`x`、`y` |

不能为所有事件统一读取`data.targetId`。`EVENT_EXIT`就没有同样的目标字段。

## `raw`参数有什么区别

默认：

```js
room.getEventLog()
```

返回解析后的数组。官方API说明，首次解析会产生一定CPU成本，同一tick后续调用会复用缓存结果。

传入真值：

```js
const raw = room.getEventLog(true);
```

返回原始JSON字符串。只有在你确实需要自己控制解析、转发原始内容或避免不必要解析时，才考虑`raw`模式。

不要这样混用：

```js
const events = room.getEventLog(true);
events.filter(() => true);
```

`raw`模式返回的是字符串，没有数组的`filter()`方法。

## 最小检查：输出上一 tick 的攻击事件

```js
module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const events = room.getEventLog();

  for (const event of events) {
    if (event.event !== EVENT_ATTACK) {
      continue;
    }

    const data = event.data && typeof event.data === 'object'
      ? event.data
      : {};

    console.log({
      attackerId: event.objectId || null,
      targetId: typeof data.targetId === 'string'
        ? data.targetId
        : null,
      damage: Number.isFinite(data.damage)
        ? data.damage
        : 0,
      attackType: data.attackType ?? null
    });
  }
};
```

这段代码只检查字段，不判断目标是否属于自己。

## 完整示例：只记录针对己方目标的攻击

```js
function normalizeAttackEvent(event) {
  if (!event || event.event !== EVENT_ATTACK) {
    return null;
  }

  const data = event.data && typeof event.data === 'object'
    ? event.data
    : {};

  if (typeof data.targetId !== 'string') {
    return null;
  }

  return {
    attackerId: typeof event.objectId === 'string'
      ? event.objectId
      : null,
    targetId: data.targetId,
    damage: Number.isFinite(data.damage)
      ? data.damage
      : 0,
    attackType: data.attackType ?? null
  };
}

function getOwnedTargetAttacks(room) {
  const events = room.getEventLog();
  const results = [];

  for (const event of events) {
    const attack = normalizeAttackEvent(event);
    if (!attack) {
      continue;
    }

    const target = Game.getObjectById(attack.targetId);

    if (!target || target.my !== true) {
      continue;
    }

    results.push(attack);
  }

  return results;
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const attacks = getOwnedTargetAttacks(room);

  if (attacks.length === 0) {
    return;
  }

  for (const attack of attacks) {
    console.log({
      roomName: room.name,
      previousTick: Game.time - 1,
      ...attack
    });
  }
};
```

把`W1N1`换成实际可见房间名。

## 为什么目标可能已经找不到

事件来自上一tick，而当前tick对象状态已经变化。`Game.getObjectById(targetId)`可能返回`null`，例如：

- Creep在上一tick受到致命伤害；
- 建筑已经被摧毁；
- 对象离开当前可见范围；
- 当前已经没有对象所在房间的视野；
- ID字段本身缺失或损坏。

因此：

```js
if (!target) {
  continue;
}
```

并不表示事件无效，只表示当前无法通过ID恢复目标对象。

如果你的目标是记录“己方对象已经被摧毁”，不能只依赖当前对象的`my`属性，应结合`EVENT_OBJECT_DESTROYED`、上一tick保存的己方ID集合或其他状态记录。

## 攻击者也可能已经消失

`event.objectId`表示执行动作的对象ID，但攻击者可能在同一轮交互中死亡、离开房间或当前不可见。

下面的恢复结果也需要判空：

```js
const attacker = event.objectId
  ? Game.getObjectById(event.objectId)
  : null;
```

事件日志本身已经提供了ID。即使当前无法恢复对象，仍然可以把ID保留在诊断记录中，而不是把整个事件丢掉。

## 怎样区分攻击类型

`EVENT_ATTACK`中的`attackType`可能表示：

- 近战攻击；
- 远程攻击或Tower攻击；
- 范围远程攻击；
- 拆除；
- 反击伤害；
- Nuke落地。

不要只根据`EVENT_ATTACK`就断言“敌方Creep近战攻击了目标”。还需要检查`attackType`，并接受当前无法恢复攻击者对象的情况。

可以写一个显示函数：

```js
function getAttackTypeName(attackType) {
  switch (attackType) {
    case EVENT_ATTACK_TYPE_MELEE:
      return 'melee';
    case EVENT_ATTACK_TYPE_RANGED:
      return 'ranged-or-tower';
    case EVENT_ATTACK_TYPE_RANGED_MASS:
      return 'ranged-mass';
    case EVENT_ATTACK_TYPE_DISMANTLE:
      return 'dismantle';
    case EVENT_ATTACK_TYPE_HIT_BACK:
      return 'hit-back';
    case EVENT_ATTACK_TYPE_NUKE:
      return 'nuke';
    default:
      return 'unknown';
  }
}
```

返回`unknown`比把未识别的新值错误归类更安全。

## 按事件类型做当前tick汇总

如果只想了解上一tick发生了哪些类型的动作，可以汇总数量，而不是逐条输出：

```js
function summarizeEvents(events) {
  const counts = {};

  for (const event of events) {
    const key = String(event.event);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}
```

使用：

```js
if (Game.time % 100 === 0) {
  console.log(
    room.name,
    summarizeEvents(room.getEventLog())
  );
}
```

这里的键是事件常量对应的数字字符串。实际项目可以维护常量到名称的映射，但要考虑未来出现未识别类型。

## 怎样保存长期历史

`getEventLog()`不会返回几天前的事件，也不会为你维护历史。需要长期观察时，建议保存**聚合结果**，不要把每个原始事件永久塞进Memory。

例如每100tick保存：

```js
Memory.eventStats ??= {};
Memory.eventStats[room.name] ??= {
  attacksOnMine: 0,
  lastAttackTick: null
};

Memory.eventStats[room.name].attacksOnMine += attacks.length;

if (attacks.length > 0) {
  Memory.eventStats[room.name].lastAttackTick = Game.time - 1;
}
```

还应设计：

- 数据保留周期；
- 房间丢失后的清理；
- 计数溢出或重置策略；
- 全局与房间级统计关系；
- 是否只记录敌对行为；
- 是否需要外部可视化。

事件很多时，保存完整数组会增加Memory体积和解析成本。

## 事件日志不能替代动作返回值

例如Tower调用：

```js
const result = tower.attack(target);
```

当前tick仍然应该保存`result`，因为它能立刻告诉你命令是否被接受。

下一tick的事件日志可以用于观察已经发生的行为。两者职责不同：

```text
动作返回值
用于当前tick判断命令提交结果

事件日志
用于下一tick观察房间里已经发生的动作
```

不能因为有`getEventLog()`就省略`attack()`、`repair()`或其他动作方法的返回值处理。

## 离线模拟结果

构建检查使用普通对象模拟了四类输入：

1. 敌方对象攻击己方目标；
2. 己方对象攻击非己方目标；
3. 攻击事件缺少合法`targetId`；
4. 非攻击事件。

最终只保留第一类：

```js
{
  attackerId: 'enemy',
  targetId: 'mine',
  damage: 30
}
```

离线测试只验证事件过滤、默认值和目标所有权分支。它没有模拟官方事件生成、上一tick时序、房间视野或对象死亡。

## 常见误区

### 把事件说成“本tick发生”

官方API返回上一tick事件。文章原标题曾使用“本tick”，本次维护已纠正。

### 假设所有`data`都有相同字段

每种事件类型的数据结构不同，必须先按`event.event`分类。

### 目标找不到就认定事件错误

目标可能已经死亡、被摧毁或当前不可见。

### 每tick输出所有事件

活跃房间可能产生大量日志。应先过滤、汇总或降低输出频率。

### 把事件日志当成永久审计记录

它只提供上一tick数据。长期历史需要自己保存。

### 使用raw模式后直接调用数组方法

`room.getEventLog(true)`返回JSON字符串，需要自行解析。

## 适用边界

本文只处理当前可见房间的上一tick事件，不覆盖：

- 全量战斗分析系统；
- 事件跨shard汇总；
- 房间失去视野后的连续历史；
- 外部数据库；
- 自动报警策略；
- 攻击归因到玩家级别；
- 所有事件类型的完整字段转换。

JavaScript语法和离线事件筛选已经检查，真实事件生成、上一tick读取和对象恢复仍待Screeps环境验证。

## 相关站内内容

- [Tower怎么自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Tower如何自动治疗己方Creep](/blog/screeps-tower-heal-creeps)
- [Game.notify()怎么发送限频提醒](/blog/screeps-game-notify)
- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [进入 Screeps 知识库](/knowledge)

## 官方资料

- [Room.getEventLog API](https://docs.screeps.com/api/#Room.getEventLog)
- [Event Types](https://docs.screeps.com/api/#Constants-Event-Types)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线事件筛选模拟已通过；真实上一tick事件日志仍待环境验证。
