---
title: "为什么有的 Creep 能采集，有的却不能？认识 WORK、CARRY 和 MOVE"
description: "写给 Screeps 新手的 Creep 身体部件入门：认识 WORK、CARRY、MOVE、getActiveBodyparts() 与 Store 容量，并正确区分 harvest() 和 ERR_FULL。"
publishedAt: "2026-07-16"
updatedAt: "2026-08-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "Creep Body"
  - "JavaScript"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-16"
  testedAt: "2026-08-16"
  testEnvironment: "Node.js 22 离线模拟（active body part、Store 阶段判断与 harvest 返回码边界，不是 Screeps 官方服务器）"
  testResult: "WORK/CARRY/MOVE 可用部件判断、满 Store 阶段切换、harvest 不使用 ERR_FULL 作为容量信号等边界通过。"
featured: false
---

> **Screeps 新手入门 · 第 6 篇**
> 建议按照系列顺序阅读；这一篇只解决一个问题：**为什么一只 Creep 能做某个动作，另一只却不能。**

> **先记住一句话**
> Creep 当前能做什么，取决于它还剩多少**可用身体部件**，而不是只看出生时的 body 配置。

前面的教程已经让 Creep 完成了[采集 Energy](/blog/screeps-first-creep-harvest)和[向 Spawn 运输 Energy](/blog/screeps-creep-deliver-energy)。这一篇不增加新的自动化任务，只把这两件事背后的三个基础部件解释清楚：`WORK`、`CARRY` 和 `MOVE`。

## 一、身体部件就是 Creep 的能力模块

一只 Creep 由多个 body part 组成。不同部件负责不同能力。

| 部件 | 新手先记住的作用 | 常见相关动作 |
| --- | --- | --- |
| `WORK` | 提供“工作”能力 | `harvest()`、`build()`、`repair()`、`upgradeController()` |
| `CARRY` | 提供资源 Store 容量 | 携带 Energy，再用于 `transfer()`、建造、维修、升级等 |
| `MOVE` | 提供主动移动能力 | `move()`、`moveTo()` 最终都需要可用的 `MOVE` |

Screeps 还有 `ATTACK`、`RANGED_ATTACK`、`HEAL`、`CLAIM`、`TOUGH` 等部件，但第一次理解工作 Creep 时不需要全部一起学。

## 二、不要只看 `creep.body`，要看“仍然可用”的部件

身体部件会受到伤害。一个已经完全损坏的部件仍然会出现在 `creep.body` 数组里，但它提供的能力已经失效。

官方 API 提供了专门的方法：

```javascript
creep.getActiveBodyparts(WORK);
creep.getActiveBodyparts(CARRY);
creep.getActiveBodyparts(MOVE);
```

它返回当前仍然存活、仍可工作的对应部件数量。

例如：

```javascript
const activeWork = creep.getActiveBodyparts(WORK);
const activeCarry = creep.getActiveBodyparts(CARRY);
const activeMove = creep.getActiveBodyparts(MOVE);

console.log({
  creep: creep.name,
  activeWork,
  activeCarry,
  activeMove
});
```

如果一只 Creep 出生时有 2 个 `WORK`，但其中 1 个已经完全损坏，那么：

```javascript
creep.getActiveBodyparts(WORK)
```

会返回 `1`，而不是 `2`。

所以排查“为什么不能采集”“为什么不能移动”时，**active body parts 比出生时的 body 模板更有用**。

## 三、WORK：决定它有没有工作能力

`WORK` 是最基础的工作部件。

它参与的常见操作包括：

- 从 Source 采集 Energy；
- 建造 Construction Site；
- 维修 Structure；
- 升级 Controller。

例如，采集前可以先检查：

```javascript
if (creep.getActiveBodyparts(WORK) === 0) {
  console.log(`${creep.name}: no active WORK`);
  return;
}
```

如果 `harvest()` 返回：

```text
ERR_NO_BODYPART
```

就应该检查是否已经没有可用的 `WORK`。

但要注意：**拥有 WORK 不等于所有工作都能执行。**

例如：

- `harvest()` 还需要目标合法、Source 有 Energy、距离足够近；
- `build()`、`repair()`、`upgradeController()` 还需要 Creep 的 Store 中有 Energy；
- 距离不够时通常还要配合移动逻辑。

所以 body part 只是动作的一个前置条件，不是完整的成功条件。

## 四、CARRY：给 Creep 一个资源 Store

`CARRY` 可以理解成资源背包。

对于最常见的工作 Creep，采集到的 Energy 会进入：

```javascript
creep.store
```

比起自己计算“有几个 CARRY，所以应该有多少容量”，新手更推荐直接读 Store API：

```javascript
const energy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
const free = creep.store.getFreeCapacity(RESOURCE_ENERGY);
const capacity = creep.store.getCapacity(RESOURCE_ENERGY);

console.log({ energy, free, capacity });
```

这样读到的是当前对象实际暴露出来的 Store 状态，也更容易和后面的运输逻辑连接起来。

### Store 满了以后，不要等待 `harvest()` 返回 `ERR_FULL`

这里很容易写错。

当前官方 `Creep.harvest()` 返回码中**没有 `ERR_FULL`**。对 Source 采集来说，只要其他前置条件通过，`harvest()` 可以返回 `OK`；如果采集到的资源没有可用 Store 空间，不能装进去的资源会按官方规则掉落到地面，而不是用 `ERR_FULL` 告诉你“背包满了”。

因此，新手工作循环应该在**调用 `harvest()` 之前**用 Store 状态决定是否继续采集：

```javascript
if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  }
} else {
  // Store 已经没有 Energy 空间，切换到运输或消耗阶段
}
```

不要写成：

```javascript
const result = creep.harvest(source);

if (result === ERR_FULL) {
  // 切换运输
}
```

这个判断不符合当前 `harvest()` API 边界。

### 那 `ERR_FULL` 会在哪里看到？

`ERR_FULL` 并没有消失，只是它属于别的容量边界。

例如：

- `creep.pickup(resource)`：Creep 已不能再接收资源；
- `creep.withdraw(target, resourceType)`：Creep Store 已满；
- `creep.transfer(target, resourceType)`：目标对象不能再接收更多资源。

所以看到 `ERR_FULL` 时，先确认**到底是哪一个 API 返回的**，不要把所有容量问题都归到 `harvest()`。

## 五、没有空 CARRY，并不等于没有 WORK

这是理解 body part 时很重要的一点。

`harvest()` 的能力来源是 `WORK`。`CARRY` 负责把资源装进 Creep 的 Store，但它不是 Source `harvest()` 返回 `OK` 的同一个能力判断。

可以把它拆成两层：

```text
WORK：我有没有采集能力？
Store：我现在还要不要继续把资源带在身上？
```

对最普通的“采集 → 运输”工作 Creep 来说，我们通常在 Store 满之前采集，在 Store 满后切换到运输。

这样设计不是因为 `harvest()` 会返回 `ERR_FULL`，而是因为**你的工作状态机不应该继续制造无法装进 Store 的资源**。

如果你还没有写工作状态机，可以继续看：[Creep working 状态怎么切换](/blog/screeps-creep-working-state)。

## 六、MOVE：决定它能不能主动移动

`MOVE` 提供主动移动能力。

前面的教程使用过：

```javascript
creep.moveTo(source);
creep.moveTo(spawn);
```

如果 Creep 已经没有可用的 `MOVE`，它就不能依靠自己的移动动作正常前往目标。

排查时可以先看：

```javascript
const activeMove = creep.getActiveBodyparts(MOVE);

if (activeMove === 0) {
  console.log(`${creep.name}: no active MOVE`);
}
```

有 `MOVE` 也不等于一定每 tick 都能走一格。移动速度还会受到：

- 非 `MOVE` 部件数量；
- `CARRY` 当前是否装载资源；
- road / plain / swamp 地形；
- fatigue；
- 路径是否存在；
- 其他 Creep 或结构阻挡；
- `moveTo()` 返回值

等因素影响。

这些属于下一层问题。遇到“有 MOVE 但还是不走”，继续看：

- [`moveTo()` 调用了但 Creep 不移动](/blog/screeps-moveto-not-moving)
- [MOVE、fatigue 和身体比例怎么理解](/blog/screeps-move-fatigue-body-ratio)

## 七、最基础的工作 Creep 为什么常写成 `[WORK, CARRY, MOVE]`

前几篇教程中的基础工作 Creep 可以写成：

```javascript
[WORK, CARRY, MOVE]
```

它刚好把三个最基础的需求放在一起：

```text
WORK  → 具备采集和工作能力
CARRY → 有地方保存和运输资源
MOVE  → 可以主动前往 Source 和 Spawn
```

所以可以先把它理解成：

> `WORK` 负责做事，`CARRY` 负责装资源，`MOVE` 负责移动。

下一篇学习 [`spawnCreep()` 创建 Creep](/blog/screeps-spawn-create-creep) 时，就会真正把 body 数组交给 Spawn。

## 八、一个很实用的只读诊断函数

刚开始写自动化时，不需要一上来就做复杂 body 分析。先做一个只读检查就够了：

```javascript
function inspectWorkerBody(creep) {
  return {
    name: creep.name,
    work: creep.getActiveBodyparts(WORK),
    carry: creep.getActiveBodyparts(CARRY),
    move: creep.getActiveBodyparts(MOVE),
    energy: creep.store.getUsedCapacity(RESOURCE_ENERGY),
    freeEnergyCapacity:
      creep.store.getFreeCapacity(RESOURCE_ENERGY),
    fatigue: creep.fatigue
  };
}

console.log(inspectWorkerBody(creep));
```

这个函数只读当前状态，不会修改 Creep 行为。

当 Creep 出现问题时，可以先回答四个问题：

1. 还有 active `WORK` 吗？
2. Store 里现在有多少 Energy、还剩多少空间？
3. 还有 active `MOVE` 吗？
4. 真正调用的 API 返回了什么？

很多新手问题到这里已经可以缩小范围。

## 九、三个最常见的问题

### 为什么 Creep 到了 Source 旁边还是不能采集？

先看：

```javascript
creep.getActiveBodyparts(WORK)
```

再看 `harvest()` 的真实返回值。常见方向包括没有 active `WORK`、Source 暂时没有可采集 Energy、距离不对或目标不对。

### 为什么 Store 满了，`harvest()` 没有返回 `ERR_FULL`？

因为当前 `harvest()` API 本来就不使用 `ERR_FULL` 表示 Creep Store 已满。工作循环应该用：

```javascript
creep.store.getFreeCapacity(RESOURCE_ENERGY)
```

来决定是否继续采集。

### 为什么有 MOVE 还是走得很慢？

`MOVE` 数量只是一部分。身体重量、装载状态、地形和 fatigue 都会影响实际移动频率。这个问题应该进入专门的移动诊断，而不是继续增加 `moveTo()` 调用次数。

## 十、这一篇真正要记住什么

| 问题 | 正确的第一检查点 |
| --- | --- |
| 能不能采集 | `creep.getActiveBodyparts(WORK)` + `harvest()` 返回值 |
| 还能不能装 Energy | `creep.store.getFreeCapacity(RESOURCE_ENERGY)` |
| 能不能主动移动 | `creep.getActiveBodyparts(MOVE)` + 移动返回值 / fatigue |
| body 受伤后能力是否还在 | `getActiveBodyparts()`，不要只看出生时 body 数组 |
| Store 满时怎样停止采集 | 用 Store 状态切换工作阶段，不等待 `harvest() === ERR_FULL` |

## 总结

`WORK`、`CARRY` 和 `MOVE` 不是三个孤立的名词，而是工作 Creep 的三层基础能力：

- `WORK` 决定有没有工作能力；
- `CARRY` 和 `creep.store` 决定能保存、携带多少资源；
- `MOVE` 决定有没有主动移动能力。

真正排查运行问题时，要看**当前仍然 active 的 body part、当前 Store 状态和真实 API 返回值**。

最需要避免的误区是：**不要用 `harvest() === ERR_FULL` 判断采集阶段结束。** 当前官方 `harvest()` 没有这个返回码；Store 是否满应该直接由 Store API 判断。

## 相关站内内容

- [第一只 Creep 怎么采集 Energy](/blog/screeps-first-creep-harvest)
- [Creep 怎么把 Energy 送到 Spawn](/blog/screeps-creep-deliver-energy)
- [Creep working 状态怎么切换](/blog/screeps-creep-working-state)
- [`moveTo()` 不移动怎么排查](/blog/screeps-moveto-not-moving)
- [MOVE、fatigue 和身体比例](/blog/screeps-move-fatigue-body-ratio)
- [`spawnCreep()` 怎么创建 Creep](/blog/screeps-spawn-create-creep)

## 官方参考资料

1. [Screeps Documentation：Creeps 与身体部件](https://docs.screeps.com/creeps.html)
2. [Screeps API Reference：Creep.getActiveBodyparts](https://docs.screeps.com/api/#Creep.getActiveBodyparts)
3. [Screeps API Reference：Creep.harvest](https://docs.screeps.com/api/#Creep.harvest)
4. [Screeps API Reference：Creep Store](https://docs.screeps.com/api/#Creep.store)
5. [Screeps API Reference：Creep.move](https://docs.screeps.com/api/#Creep.move)

资料核对日期：2026-08-16。本文保持新手范围，只解释 `WORK`、`CARRY`、`MOVE`、active body part 与 Store 阶段判断；高级 fatigue 计算、最优身体比例、部件排列和战斗 body 会放在对应专题中。