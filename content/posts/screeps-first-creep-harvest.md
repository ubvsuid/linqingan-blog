---
title: "Screeps 新手入门：让第一只 Creep 移动并采集能量"
description: "写给 Screeps 新手的第一段 Creep 控制教程：安全找到 Creep 和 Source，用 Store 状态判断是否继续采集，并正确处理 harvest() 返回值。"
publishedAt: "2026-07-15"
updatedAt: "2026-08-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "资源采集"
  - "JavaScript"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-16"
  testedAt: "2026-08-16"
  testEnvironment: "Node.js 22 离线模拟（Creep/Source 判空、Store 阶段、Source harvest 返回码与移动分支，不是 Screeps 官方服务器）"
  testResult: "缺失 Creep、缺失 Source、空余 Store、满 Store、OK、ERR_NOT_IN_RANGE、ERR_NOT_ENOUGH_RESOURCES 与异常返回值分支通过。"
featured: false
---

> **Screeps 新手入门 · 第 4 篇**
> 建议按照系列顺序阅读；这一篇只完成第一次“找到 Creep → 找到 Source → 靠近 → 采集”。

> **这还不是完整的自动采集系统**
> 本篇只让 Creep 前往 Source 并采集。Store 装满后先停止继续采集，下一篇再加入返回 Spawn 和运输 Energy 的逻辑。

如果你还不理解代码为什么会重复执行，可以先阅读[第 3 篇：tick 与主循环](/blog/screeps-tick-and-game-loop)。

## 这篇文章会讲什么

1. 开始前需要什么；
2. 怎样安全找到自己的 Creep；
3. 怎样找到当前房间中的 Source；
4. 怎样用 Store 状态决定是否继续采集；
5. `harvest()` 距离不够时怎样靠近；
6. 应该观察哪些真实返回值。

## 一、开始前需要准备什么

本文默认你的房间中已经有一只基础工作 Creep。

为了让它能够移动、采集并把 Energy 装进 Store，通常会使用下面三个基础身体部件：

- **`MOVE`**：让 Creep 主动移动；
- **`WORK`**：提供采集能力；
- **`CARRY`**：提供资源 Store 容量。

这一篇不计算身体部件价格、数量比例或 fatigue。

如果还不理解这三个部件，可以继续看[第 6 篇：认识 WORK、CARRY 和 MOVE](/blog/screeps-creep-body-parts)。

> 本文按“有 `CARRY` 的基础采集 Creep”来教学。无 `CARRY` 的固定采集与掉落式物流属于后面的进阶策略，不在这一篇展开。

## 二、第一步：安全找到自己的 Creep

假设你的 Creep 名为：

```text
Harvester1
```

可以这样读取它：

```javascript
const creep = Game.creeps['Harvester1'];
```

现在只需要理解：

- `Game.creeps` 保存你当前拥有的 Creep；
- `'Harvester1'` 是要查找的名称；
- `creep` 是后面代码使用的对象引用。

名称必须换成你游戏里的真实名称，而且大小写要一致。

如果名称写错：

```javascript
Game.creeps['Harvester1']
```

会得到 `undefined`。因此继续读取 `creep.room` 以前先做判空：

```javascript
if (!creep) {
  console.log('找不到 Harvester1，请检查名称和大小写');
  return;
}
```

这里的 `return` 表示本 tick 不再执行后面的采集代码，避免继续访问一个不存在的对象。

## 三、第二步：找到当前房间中的 Source

拿到 Creep 后，可以从它当前所在房间读取 Source：

```javascript
const sources = creep.room.find(FIND_SOURCES);
const source = sources[0];
```

可以先把它理解成：

> 在 Creep 当前所在房间中找到所有可见 Source，然后暂时使用第一个。

这里的 `[0]` 只是为了让第一段代码足够简单，它不保证选到最近或最优的 Source。

继续调用 `harvest()` 以前也要检查目标：

```javascript
if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}
```

这样即使当前环境不符合预期，也不会拿 `undefined` 去调用采集动作。

## 四、第三步：先看 Store 是否还需要继续采集

对于本文这种有 `CARRY` 的基础工作 Creep，最简单的采集阶段判断是：

```javascript
const freeEnergyCapacity =
  creep.store.getFreeCapacity(RESOURCE_ENERGY);
```

如果结果大于 `0`，说明 Store 还可以继续接收 Energy：

```javascript
if (freeEnergyCapacity > 0) {
  // 继续尝试 harvest
}
```

如果结果等于 `0`，说明这一只基础 Creep 已经到达“该去运输或消耗 Energy”的阶段：

```javascript
if (freeEnergyCapacity === 0) {
  return;
}
```

这一篇先 `return`，下一篇再把这里替换成返回 Spawn 的运输逻辑。

### 为什么不等 `harvest()` 返回 `ERR_FULL`？

因为当前官方 `Creep.harvest()` 的返回码里**没有 `ERR_FULL`**。

对 Source 采集来说，Store 是否已满不应该靠：

```javascript
if (creep.harvest(source) === ERR_FULL) {
  // ...
}
```

来判断。

更清晰的写法是：**先读 Store，再决定当前是否还处于采集阶段。**

如果在 Store 没有空间时仍让 `harvest()` 通过其他前置条件并提交，不能进入 Creep Store 的采集资源会按当前官方规则掉落，而不是用 `ERR_FULL` 告诉你“背包满了”。

## 五、第四步：尝试采集，距离太远就靠近

确认 Store 还有空间后，再调用：

```javascript
const result = creep.harvest(source);
```

如果 Creep 在 Source 相邻位置、拥有可用 `WORK`，Source 也有可采集 Energy，并且其他条件满足，调用可以返回：

```text
OK
```

如果距离不够，会返回：

```text
ERR_NOT_IN_RANGE
```

这时再让 Creep 靠近：

```javascript
if (result === ERR_NOT_IN_RANGE) {
  creep.moveTo(source);
}
```

因此当前流程是：

```text
找到 Creep
→ 找到 Source
→ Store 还有空间吗？
→ 有：尝试 harvest
→ 太远：moveTo(source)
→ 满：本篇先停止，下一篇进入运输
```

## 六、完整代码

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Harvester1'];

  if (!creep) {
    console.log('找不到 Harvester1，请检查名称和大小写');
    return;
  }

  const sources = creep.room.find(FIND_SOURCES);
  const source = sources[0];

  if (!source) {
    console.log('当前房间中没有找到可见的 Source');
    return;
  }

  const freeEnergyCapacity =
    creep.store.getFreeCapacity(RESOURCE_ENERGY);

  if (freeEnergyCapacity === 0) {
    // 下一篇会把这里改成返回 Spawn 并运输 Energy
    return;
  }

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source);

    if (moveResult !== OK && moveResult !== ERR_TIRED) {
      console.log(`Harvester1 移动返回：${moveResult}`);
    }
  } else if (
    result !== OK
    && result !== ERR_NOT_ENOUGH_RESOURCES
  ) {
    console.log(`Harvester1 采集返回：${result}`);
  }
};
```

> **保存前先修改名称**
> 把 `'Harvester1'` 换成你游戏里真实的 Creep 名称。

这份代码做了五个很重要的保护：

- Creep 不存在时停止；
- Source 不存在时停止；
- Store 已满时不再继续提交采集动作；
- `harvest()` 距离不够时才调用 `moveTo()`；
- 其他异常采集返回值会写入 Console，方便继续排查。

## 七、为什么满 Store 时直接 `return`

因为这一篇只学习“移动并采集”，还没有引入运输状态。

当：

```javascript
creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0
```

时，当前代码知道“采集阶段已经结束”，但还不知道 Energy 应该送给谁。

所以本篇选择停在这里，而不是继续重复采集。

下一篇[把 Energy 送回 Spawn](/blog/screeps-creep-deliver-energy)会把逻辑扩展成两个阶段：

```text
Store 未满 → 采集
Store 已满 → 运输
```

再后面的[working 状态文章](/blog/screeps-creep-working-state)会解释怎样把这种阶段切换写成稳定的状态机。

## 八、保存代码后观察什么

保存后回到房间，按顺序观察：

1. Console 是否持续出现“找不到 Harvester1”；
2. Creep 是否向 Source 靠近；
3. Creep 是否最终到达 Source 相邻位置；
4. Energy 是否开始进入 Creep Store；
5. Store 满后，当前这篇的 Creep 是否停止继续执行采集阶段；
6. Console 是否出现没有预期到的真实返回值。

### Source 暂时没有 Energy 会怎样？

`harvest()` 可能返回：

```text
ERR_NOT_ENOUGH_RESOURCES
```

当前示例不会把它当成程序崩溃，而是让主循环在下一个 tick 重新判断。

### Store 满了会怎样？

本篇代码在调用 `harvest()` 之前已经通过：

```javascript
creep.store.getFreeCapacity(RESOURCE_ENERGY)
```

判断阶段。

因此 Store 满时会直接结束本 tick 的这段采集逻辑，而不是等待 `harvest()` 给出一个不存在的 `ERR_FULL` 容量信号。

## 九、常见 `harvest()` 返回结果

对本文的 Source 采集场景，新手最先需要认识这些：

| 返回结果 | 最简单的理解 | 当前处理方式 |
| --- | --- | --- |
| `OK` | 采集请求已被接受 | 下一个 tick 继续判断 |
| `ERR_NOT_IN_RANGE` | 距离 Source 太远 | 调用 `moveTo(source)` |
| `ERR_NOT_ENOUGH_RESOURCES` | Source 当前没有可采集 Energy | 等后续 tick 再判断 |
| `ERR_NO_BODYPART` | 没有可用 `WORK` | 检查 Creep 当前身体状态 |
| `ERR_BUSY` | Creep 还在 spawning | 等生成完成 |
| `ERR_INVALID_TARGET` | 目标不符合该动作要求 | 检查目标对象 |

> **不要把 `ERR_FULL` 放进这张 `harvest()` 返回码表。**
> Store 容量在本文中由 Store API 单独判断。

## 十、三个常见问题

### Creep 完全没有移动

先检查代码里的 Creep 名称和大小写。

如果名称正确，再看 `moveTo()` 的真实返回值，而不是不断重复增加调用。

### Creep 到达 Source 后仍然没有采集

先检查：

```javascript
creep.getActiveBodyparts(WORK)
```

是否大于 `0`，再检查 `harvest()` 的真实返回值。Source 暂时没有 Energy 时也需要等待恢复。

### Creep 装满后为什么不回 Spawn？

因为当前代码只完成采集阶段。

Store 满时本篇会停止继续采集；[下一篇](/blog/screeps-creep-deliver-energy)才加入运输目标和 `transfer()`。

## 十一、这一篇真正要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `Game.creeps['Harvester1']` | 找到指定名称的 Creep |
| `if (!creep) return` | 找不到 Creep 时停止后续代码 |
| `creep.room.find(FIND_SOURCES)` | 找到当前房间里的 Source |
| `creep.store.getFreeCapacity(RESOURCE_ENERGY)` | 判断基础 Creep 是否还处于采集阶段 |
| `creep.harvest(source)` | 尝试采集 Source |
| `ERR_NOT_IN_RANGE` | 当前距离不够 |
| `creep.moveTo(source)` | 尝试靠近 Source |

最重要的流程是：

```text
找到 Creep
→ 判空
→ 找到 Source
→ 判空
→ 检查 Store
→ 尝试 harvest
→ 太远才移动
```

## 总结

这一篇，我们第一次通过主循环安全地控制 Creep 采集 Energy。

程序现在会：

1. 找到指定 Creep；
2. Creep 不存在时停止；
3. 找到当前房间中的 Source；
4. Source 不存在时停止；
5. 用 Store API 判断是否还需要继续采集；
6. 调用 `harvest()`；
7. 距离不够时调用 `moveTo()`；
8. 保留真实异常返回值用于排查。

这次最重要的技术修正是：**Store 满不等于 `harvest()` 返回 `ERR_FULL`。** 对本文的基础采集循环，Store 是否还有空间应该直接通过 Store API 判断。

下一篇将继续解决：Store 满以后，怎样让 Creep 返回 Spawn 并把 Energy 交出去。

## 相关站内内容

- [认识 WORK、CARRY 和 MOVE](/blog/screeps-creep-body-parts)
- [Creep 怎么把 Energy 送到 Spawn](/blog/screeps-creep-deliver-energy)
- [Creep working 状态怎么切换](/blog/screeps-creep-working-state)
- [`moveTo()` 不移动怎么排查](/blog/screeps-moveto-not-moving)

## 官方参考资料

1. [Screeps API Reference：Game.creeps](https://docs.screeps.com/api/#Game.creeps)
2. [Screeps API Reference：Room.find 与 FIND_SOURCES](https://docs.screeps.com/api/#Room.find)
3. [Screeps API Reference：Creep.harvest](https://docs.screeps.com/api/#Creep.harvest)
4. [Screeps API Reference：Creep.store](https://docs.screeps.com/api/#Creep.store)
5. [Screeps API Reference：Creep.moveTo](https://docs.screeps.com/api/#Creep.moveTo)
6. [Screeps Documentation：Creep 身体部件与移动](https://docs.screeps.com/creeps.html)

资料核对日期：2026-08-16。本文只覆盖有 `CARRY` 的基础采集 Creep；无 `CARRY` 的固定采集、掉落式物流、最近 Source 选择、角色分工和完整状态机会放在后续专题中。