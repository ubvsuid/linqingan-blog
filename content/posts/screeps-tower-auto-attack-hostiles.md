---
title: "Screeps Tower 怎么自动攻击敌人：目标过滤、威胁排序与返回值"
description: "使用FIND_HOSTILE_CREEPS、玩家通行名单、活跃战斗部件和距离选择Tower攻击目标，检查Energy、结构状态与attack()全部返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Tower"
  - "防御"
  - "FIND_HOSTILE_CREEPS"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（玩家过滤、战斗部件计分、距离排序与Tower可用性，不是 Screeps 官方服务器）"
  testResult: "通行玩家排除、战斗单位优先、同分距离排序、Energy不足、结构不可用和无目标场景通过。"
featured: false
---

Tower不会自动开火。主循环需要在每个 tick 重新读取当前房间、筛选目标并调用 `tower.attack(target)`。

本文只解决一个问题：怎样让己方Tower攻击经过通行名单过滤后的非己方Creep，并用活跃战斗部件和距离建立可解释的目标顺序。

## `FIND_HOSTILE_CREEPS` 不等于“应该攻击”

官方 `FIND_HOSTILE_CREEPS` 返回房间内所有非己方 Creep。它不会理解：

- 盟友；
- 临时访客；
- 自己允许通行的玩家；
- 侦察单位和实际进攻单位的差别；
- 玩家之间的外交协议。

因此自动攻击前必须使用自己的名单过滤。

```js
Memory.defense ??= {};
Memory.defense.allowedUsers ??= [];
```

名单只是本站示例。错误用户名或过期关系仍可能导致错误目标，真实防御系统需要独立维护外交数据。

## 怎样定义一个简单威胁分数

本文使用活跃身体部件计分：

```js
function getThreatScore(creep) {
  return (
    creep.getActiveBodyparts(ATTACK) * 5
    + creep.getActiveBodyparts(RANGED_ATTACK) * 5
    + creep.getActiveBodyparts(HEAL) * 4
    + creep.getActiveBodyparts(WORK) * 2
    + creep.getActiveBodyparts(CLAIM) * 3
  );
}
```

`WORK`可能用于拆除，`CLAIM`可能影响Controller，所以不应只看 `ATTACK`。

这些权重不是官方规则，只是一个可解释的本站策略。没有战斗部件的Creep仍然是非己方对象，但会排在更低位置。

## 多个Tower怎样选择同一目标

先为每个目标计算：

- 威胁分数；
- 距离最近Tower的范围；
- 名称作为稳定排序兜底。

```js
function selectTowerTarget(towers, hostiles) {
  if (towers.length === 0 || hostiles.length === 0) {
    return null;
  }

  return [...hostiles].sort((left, right) => {
    const threatDifference =
      getThreatScore(right) - getThreatScore(left);

    if (threatDifference !== 0) {
      return threatDifference;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.name.localeCompare(right.name);
  })[0];
}
```

这会让所有可用Tower集火同一个目标。分火、预计伤害和过量攻击属于更复杂的战斗模型，本文不展开。

## 完整示例

把房间名换成自己的房间。代码合并进现有 `module.exports.loop`。

```js
function getThreatScore(creep) {
  return (
    creep.getActiveBodyparts(ATTACK) * 5
    + creep.getActiveBodyparts(RANGED_ATTACK) * 5
    + creep.getActiveBodyparts(HEAL) * 4
    + creep.getActiveBodyparts(WORK) * 2
    + creep.getActiveBodyparts(CLAIM) * 3
  );
}

function getAttackableHostiles(room) {
  const allowedUsers = new Set(
    Array.isArray(Memory.defense?.allowedUsers)
      ? Memory.defense.allowedUsers
      : []
  );

  return room.find(FIND_HOSTILE_CREEPS, {
    filter: creep =>
      creep.owner
      && !allowedUsers.has(creep.owner.username)
  });
}

function selectTowerTarget(towers, hostiles) {
  if (towers.length === 0 || hostiles.length === 0) {
    return null;
  }

  return [...hostiles].sort((left, right) => {
    const threatDifference =
      getThreatScore(right) - getThreatScore(left);

    if (threatDifference !== 0) {
      return threatDifference;
    }

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );

    if (leftRange !== rightRange) {
      return leftRange - rightRange;
    }

    return left.name.localeCompare(right.name);
  })[0];
}

function runTowerAttack(room) {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive()
      && structure.store.getUsedCapacity(RESOURCE_ENERGY)
        >= TOWER_ENERGY_COST
  });

  if (towers.length === 0) {
    return;
  }

  const hostiles = getAttackableHostiles(room);
  const target = selectTowerTarget(towers, hostiles);

  if (!target) {
    return;
  }

  for (const tower of towers) {
    const result = tower.attack(target);

    if (result !== OK) {
      console.log({
        type: 'tower-attack-failed',
        roomName: room.name,
        towerId: tower.id,
        targetId: target.id,
        targetOwner: target.owner?.username || null,
        threatScore: getThreatScore(target),
        result
      });
    }
  }
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  runTowerAttack(room);
};
```

## 为什么每 tick 重新查找目标

Creep可能在上一 tick：

- 死亡；
- 离开房间；
- 进入Rampart；
- 失去战斗部件；
- 被强化或解除强化；
- 改变位置；
- 被加入或移出通行名单。

不要把完整目标对象长期写入Memory。需要跨tick保存时，只保存ID和业务状态，并在当前tick重新恢复、判空和重新评分。

## 为什么检查 `TOWER_ENERGY_COST`

Tower每次攻击、治疗或维修都需要一次动作的Energy。本文使用官方常量：

```js
TOWER_ENERGY_COST
```

在调用前排除资源不足的Tower，仍然要保存 `attack()` 返回值，因为同一tick的其他代码可能已经对Tower提交了动作或改变策略。

## 距离怎样影响攻击

Tower可以攻击同一房间内的有效目标，不会因为距离返回 `ERR_NOT_IN_RANGE`。距离影响实际伤害：近距离更高，远距离更低。

本文只用距离作为同威胁分数下的排序条件，不预测击杀tick，也不声称一轮集火必定消灭目标。

## `attack()` 返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 攻击已安排 | 下一tick观察目标状态 |
| `ERR_NOT_OWNER` | Tower不是自己的 | `FIND_MY_STRUCTURES`与所有权 |
| `ERR_NOT_ENOUGH_ENERGY` | Tower Energy不足 | Store与其他Tower动作 |
| `ERR_INVALID_TARGET` | 目标已经无效或不可攻击 | 当前tick重新查找对象 |
| `ERR_RCL_NOT_ENOUGH` | Tower当前不可用 | Controller等级与 `isActive()` |

Tower攻击没有 `ERR_NOT_IN_RANGE`。不要把Creep近战攻击的返回码复制到本文。

## 通行名单的风险

公开允许玩家通过意味着该玩家的所有非己方Creep都会被过滤，包括可能携带战斗部件的单位。

生产系统至少还应考虑：

- 名单过期时间；
- 房间级与全局级名单；
- 特定任务许可；
- 主动攻击己方对象后的强制移除；
- `Room.getEventLog()` 中的真实行为；
- 玩家名称大小写和输入校验。

本文只展示静态名单，不承担完整外交安全。

## 离线模拟结果

构建检查覆盖：

1. 通行名单中的玩家被排除；
2. 拥有更多活跃战斗部件的目标优先；
3. 分数相同时选择距离更近者；
4. 无目标时返回 `null`；
5. Tower Energy不足或结构不可用时不进入攻击列表；
6. 稳定名称排序避免完全相同条件下结果跳动。

离线模拟没有调用真实 `Room.find()`、`tower.attack()` 或伤害结算。

## 常见误区

### 把所有非己方Creep都当成必须攻击

`FIND_HOSTILE_CREEPS`不理解外交关系。

### 只看 `ATTACK` 部件

远程、治疗、拆除和CLAIM单位同样可能具有威胁。

### 使用身体数组长度代替活跃部件

已损坏到0 hits的部件不再发挥作用，应使用 `getActiveBodyparts()`。

### 不检查Tower Energy

攻击分支会持续返回资源不足。

### 一次选择后长期缓存目标对象

下一tick对象状态可能已经变化。

### 把一次 `OK` 写成防御成功

需要观察后续伤害、治疗、敌人移动和多tick结果。

## 适用边界

本文没有实现：

- 精确伤害预测；
- 多Tower分火；
- 强化部件效果；
- Rampart内外目标模型；
- Power Creep威胁评分；
- 自动Safe Mode；
- 防御Creep调度；
- 事件驱动外交撤销。

JavaScript语法和目标排序离线模拟已经通过。真实Tower攻击、伤害与多tick防御仍待Screeps环境验证。

## 相关站内内容

- [Tower如何治疗己方Creep](/blog/screeps-tower-heal-creeps)
- [Tower如何按阈值维修建筑](/blog/screeps-tower-repair-threshold)
- [Safe Mode怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Room.getEventLog()怎么读取事件](/blog/screeps-room-event-log)
- [Game.notify()怎么发送提醒](/blog/screeps-game-notify)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [StructureTower.attack API](https://docs.screeps.com/api/#StructureTower.attack)
- [Room.find API](https://docs.screeps.com/api/#Room.find)
- [Defending your room](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-22。离线目标排序已通过；真实攻击结果仍待Screeps环境验证。
