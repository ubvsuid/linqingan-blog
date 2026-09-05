---
title: "Screeps Creep.attack() 近战攻击：距离、返回码与 tick 判定"
description: "正确使用 Creep.attack() 发起 Range 1 近战攻击，理解 ATTACK 部件、6 个官方返回码、Rampart 与自动反击规则，并区分 OK 和后续 tick 的真实战斗状态。"
publishedAt: "2026-09-05"
category: "Screeps 战斗"
tags:
  - "Screeps"
  - "Creep"
  - "战斗"
  - "ATTACK"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-09-05"
featured: false
knowledge:
  module: "construction-defense"
  stage: "creep-combat"
  order: 75
  difficulty: "intermediate"
seo:
  primaryKeyword: "Screeps Creep.attack"
  searchIntent: "正确使用 Creep.attack() 发起近战攻击，理解 Range 1、ATTACK 部件、返回码、Rampart 与 tick 结算边界"
  keywordRole: "owner"
---

`Creep.attack(target)` 是 Screeps 最基础的近战攻击 API。真正写进战斗逻辑时，先记住三个边界：

- 目标必须在 **Range 1**；
- Creep 必须有可用的 `ATTACK` 部件；
- 返回 `OK` 表示这次攻击操作已经成功提交，不等于当前这行 JavaScript 已经读到了 tick 结算后的最终伤害。

如果目标还没贴身，一个最小而清楚的近战循环就是：**不相邻时移动，相邻后再攻击。**

## 一、最小写法：不够近就移动，相邻后攻击

下面只处理一个敌对 Creep，不加入目标优先级、组队或治疗逻辑：

```javascript
const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

if (target) {
  if (creep.pos.isNearTo(target)) {
    const attackResult = creep.attack(target);

    if (attackResult !== OK) {
      console.log(`[${creep.name}] attack failed: ${attackResult}`);
    }
  } else {
    creep.moveTo(target, { range: 1 });
  }
}
```

`attack()` 不会自动追敌，`moveTo()` 也不会在抵达后自动补一次攻击。两者是不同的 Action，需要你的代码在每个 tick 根据当前位置重新决定下一步。

如果你更喜欢先尝试攻击，也可以读取返回值后再移动：

```javascript
const attackResult = creep.attack(target);

if (attackResult === ERR_NOT_IN_RANGE) {
  creep.moveTo(target, { range: 1 });
}
```

这里失败的 `attack()` 不会因为同一 tick 后面又提交了移动就自动重试。下一 tick 代码重新运行时，再根据新的实际位置调用 `attack()`。

## 二、近战距离固定是 Range 1

`Creep.attack()` 要求目标位于相邻格，也就是：

```javascript
creep.pos.isNearTo(target)
```

为 `true`。

需要排错时，可以直接看实际 range：

```javascript
const range = creep.pos.getRangeTo(target);
console.log(`[${creep.name}] attack range: ${range}`);
```

如果 `range > 1`，`attack()` 会返回 `ERR_NOT_IN_RANGE`。

这一点不要只靠房间画面判断。调试时把 **实际距离 + API 返回码** 放在一起，比“看起来已经站在旁边”可靠得多。

如果你正在处理的不只是 `attack()`，而是各种 Action 的距离错误，可以继续看 [`ERR_NOT_IN_RANGE` 专项排错](/blog/screeps-err-not-in-range)。

## 三、`attack()` 的 6 个官方返回码

`attack()` 的目标参数可以是 Creep、Power Creep 或 Structure，但目标是否真的可攻击仍要看调用结果。

| 返回码 | 先这样理解 |
| --- | --- |
| `OK` | 攻击操作已经成功提交 |
| `ERR_NOT_OWNER` | 执行动作的 Creep 不属于你 |
| `ERR_BUSY` | Creep 仍在 spawning |
| `ERR_INVALID_TARGET` | 目标不是有效的可攻击对象 |
| `ERR_NOT_IN_RANGE` | 目标距离超过 Range 1 |
| `ERR_NO_BODYPART` | Creep 当前没有能用于这次近战攻击的 `ATTACK` 部件 |

开发阶段不要把返回值丢掉。它通常就是最短的诊断入口：

```javascript
const result = creep.attack(target);

if (result !== OK) {
  console.log(`[${creep.name}] attack result: ${result}`);
}
```

例如持续得到 `ERR_NOT_IN_RANGE`，先检查 range；得到 `ERR_NO_BODYPART`，再检查当前可用的 `ATTACK` 部件，而不是先改寻路。

## 四、`OK` 只说明攻击已提交，不是最终掉血结果

官方对 `OK` 的语义是：这次操作已经成功 scheduled。

因此：

```javascript
creep.attack(target) === OK
```

首先能证明的是：

> 这次攻击调用通过了当前检查，并成功提交了攻击操作。

不要在同一段逻辑里把它直接推导成：

- 目标已经确定损失了多少生命值；
- 目标已经死亡；
- 这一 tick 的双方战斗结果已经可以从当前对象状态完整读出。

同样，如果这一 tick 先调用 `attack()` 得到 `ERR_NOT_IN_RANGE`，随后再 `moveTo()` 到相邻位置，前面那次失败的攻击也不会重新结算。

更稳的思维方式是：

```text
Tick N 运行代码
  ↓
检查当前目标、距离和身体状态
  ↓
提交 attack() 或 moveTo()
  ↓
游戏结算这一 tick
  ↓
Tick N+1 再读取新的 Game state
```

如果后续决策依赖“到底是谁受到多少伤害”，应在后续 tick 根据新的真实状态重新判断。需要精确追踪上一 tick 的房间事件时，再使用 [`Room.getEventLog()`](/blog/screeps-room-event-log)；不要把单个 `OK` 当成完整战斗 Evidence。

## 五、`ATTACK` 部件决定当前近战能力

调用 `attack()` 需要 `ATTACK` body part。

一个未强化、仍然有效的 `ATTACK` 部件提供 **30 点基础近战攻击能力**。因此在不考虑 boost 等额外因素时，可以先理解成：

```text
1 × ATTACK → 30
2 × ATTACK → 60
3 × ATTACK → 90
```

但不要只看出生时的 body 配置。Creep 受到伤害后，已经失效的身体部件不会继续提供能力。

可以直接检查当前仍然有效的攻击部件：

```javascript
const activeAttackParts = creep.getActiveBodyparts(ATTACK);

if (activeAttackParts === 0) {
  console.log(`[${creep.name}] no active ATTACK parts`);
}
```

所以调试近战单位时至少区分：

```text
出生时配置里有 ATTACK
≠
当前仍有可工作的 ATTACK
```

如果这部分还不熟，可以先看 [Creep 身体部件与 `getActiveBodyparts()`](/blog/screeps-creep-body-parts)。

## 六、Rampart 和自动反击是两个容易漏掉的特殊规则

`Creep.attack()` 不只是“贴身以后扣血”。

**第一，目标位于 Rampart 内时，实际被攻击的是 Rampart。**

所以即使：

```javascript
creep.attack(target) === OK
```

也不要只盯着目标 Creep 的 hits 判断“为什么没打到”。如果目标受 Rampart 保护，攻击会落到 Rampart 上。

**第二，被攻击的 Creep 可能自动反击。**

如果目标本身带有 `ATTACK` 部件，并且没有位于 Rampart 内，它会自动 hit back 攻击者。

这意味着一次合法的近战攻击不一定是单向伤害。设计 melee Creep 时，身体配置、当前 hits、目标是否受 Rampart 保护都会影响实际结果。

这两个规则也是 `Creep.attack()` 和普通“调用一个 Action API”最不一样的地方之一。

## 七、一个完整的基础 melee loop

把前面的边界组合起来，可以得到一个适合继续扩展的基础版本：

```javascript
function runMeleeAttacker(creep) {
  if (creep.spawning || creep.getActiveBodyparts(ATTACK) === 0) {
    return;
  }

  const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

  if (!target) {
    return;
  }

  if (!creep.pos.isNearTo(target)) {
    const moveResult = creep.moveTo(target, { range: 1 });

    if (moveResult !== OK) {
      console.log(`[${creep.name}] move failed: ${moveResult}`);
    }

    return;
  }

  const attackResult = creep.attack(target);

  if (attackResult !== OK) {
    console.log(`[${creep.name}] attack failed: ${attackResult}`);
  }
}
```

它只负责五件事：

1. 确认 Creep 已经出生并且还有可用 `ATTACK`；
2. 找到一个敌对 Creep；
3. 不在 Range 1 时接近目标；
4. 相邻后提交 `attack()`；
5. 保留失败返回码用于排错。

等这个版本稳定后，再把目标优先级、Ranged Attack、Heal、组队移动、Rampart 战术或战斗状态机拆成各自独立的问题。对于当前这篇，最重要的是能稳定判断：

```text
目标有效？
→ Range 1？
→ ATTACK 还可用？
→ attack() 返回什么？
→ 后续 tick 的真实状态是什么？
```

把这条链跑通，才是 `Creep.attack()` 近战逻辑的基础。
