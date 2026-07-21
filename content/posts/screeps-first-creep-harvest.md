---
title: "Screeps 新手入门：让第一只 Creep 移动并采集能量"
description: "写给 Screeps 新手的第一段 Creep 控制教程：安全找到自己的 Creep 和 Source，让它自动靠近并开始采集能量。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-21"
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
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 4 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这还不是完整的自动采集系统**
> 本篇只让 Creep 前往 Source 并采集。它暂时不会把能量送回 Spawn，
> 运输能量会放到下一篇单独介绍。

如果你还不理解代码为什么会重复执行，可以先阅读[第 3 篇：tick 与主循环](/blog/screeps-tick-and-game-loop)。

## 这篇文章会讲什么

1. 开始前的准备
2. 安全找到自己的 Creep
3. 安全找到房间中的 Source
4. 让 Creep 采集并靠近 Source
5. 保存代码后观察什么
6. 常见返回结果

## 一、开始前需要准备什么

本文默认你的房间中已经有一只 Creep。
为了让它能够移动、采集并把能量装进身体里，通常需要下面三个基础身体部件：

- **`MOVE`**：让 Creep 移动
- **`WORK`**：让 Creep 采集
- **`CARRY`**：让 Creep 携带能量

这一篇不计算身体部件的价格和比例。
你可以先使用游戏教程中的基础工作 Creep，并在[第 6 篇：认识 WORK、CARRY 和 MOVE](/blog/screeps-creep-body-parts)中继续了解这些部件。

## 二、第一步：安全找到自己的 Creep

每只 Creep 都有一个名字。假设你的 Creep 名为：

```text
Harvester1
```

可以使用下面这行代码找到它：

```javascript
const creep = Game.creeps['Harvester1'];
```

现在只需要这样理解：

- `Game.creeps`：玩家当前拥有的 Creep；
- `'Harvester1'`：要寻找的 Creep 名称；
- `const creep`：给找到的 Creep 起一个方便使用的临时名字。

名称必须换成你自己的真实名称，而且大小写必须完全一致。
如果名称写错，`creep` 会是 `undefined`。因此，在继续读取 `creep.room` 以前先进行检查：

```javascript
if (!creep) {
  console.log('找不到 Harvester1，请检查名称和大小写');
  return;
}
```

这里的 `return` 表示：本 tick 先停止执行后面的采集代码，避免继续访问一个不存在的 Creep。

## 三、第二步：安全找到房间中的 Source

找到 Creep 后，接下来让程序寻找它所在房间中的 Source：

```javascript
const sources = creep.room.find(FIND_SOURCES);
const source = sources[0];
```

这段代码可以简单理解为：

> 在这只 Creep 当前所在的房间中寻找所有 Source，然后暂时使用搜索结果中的第一个。

`[0]` 表示取出第一个结果。这里选到的不一定是最近的 Source，但已经足够完成本篇练习。

为了避免没有找到目标时继续调用 `harvest()`，再补一个检查：

```javascript
if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}
```

正常的玩家房间通常可以找到 Source；这段检查主要用于避免名称、视野或房间环境不符合预期时直接报错。

## 四、第三步：尝试采集，距离太远就靠近

找到 Source 后，可以让 Creep 先尝试采集：

```javascript
const result = creep.harvest(source);
```

如果 Creep 已经站在 Source 旁边，并且拥有可用的 `WORK` 部件，它通常会返回 `OK` 并开始采集。

如果距离太远，`harvest()` 会返回：

```text
ERR_NOT_IN_RANGE
```

这时让 Creep 尝试向 Source 靠近：

```javascript
if (result === ERR_NOT_IN_RANGE) {
  creep.moveTo(source);
}
```

整段逻辑可以理解成：

> 先尝试采集 → 距离太远就靠近 → 下一个 tick 再次尝试

### 完整代码

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

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  } else if (result !== OK &&
             result !== ERR_FULL &&
             result !== ERR_NOT_ENOUGH_RESOURCES) {
    console.log(`Harvester1 采集返回：${result}`);
  }
};
```

> **保存前先修改名称**
> 把代码中的 `'Harvester1'` 换成你游戏中真实显示的 Creep 名称。

这份代码明确处理了三个常见情况：

- Creep 名称错误：停止并提示检查名称；
- 没有找到 Source：停止并提示检查房间与视野；
- 距离太远：调用 `moveTo()` 靠近目标。

## 五、保存代码后观察什么

保存代码后，回到房间画面，依次观察：

1. Console 中是否没有持续出现“找不到 Harvester1”；
2. Creep 是否开始尝试向 Source 靠近；
3. Creep 是否最终停在 Source 相邻的位置；
4. Creep 是否开始执行采集动作；
5. 点击 Creep 后，携带的 Energy 是否逐渐增加。

### 装满能量后会发生什么

当前代码没有告诉 Creep 把能量送到哪里，所以它装满后不会自动返回 Spawn。

对于拥有 `CARRY` 的这只基础 Creep，Store 没有空余空间时，`harvest()` 会返回 `ERR_FULL`，携带的 Energy 不会继续增加。
这不代表移动和采集代码失败，只说明我们还没有加入运输逻辑。

[下一篇](/blog/screeps-creep-deliver-energy)会让它在装满后返回 Spawn，并把 Energy 交出去。

## 六、常见返回结果

| 返回结果 | 最简单的理解 | 当前处理方式 |
| --- | --- | --- |
| `OK` | 本次采集命令可以执行 | 继续等待下一个 tick |
| `ERR_NOT_IN_RANGE` | 距离 Source 太远 | 调用 `moveTo(source)` |
| `ERR_FULL` | Creep 的 Store 已经没有空余空间 | 下一篇加入运输逻辑 |
| `ERR_NOT_ENOUGH_RESOURCES` | Source 当前没有可采集的 Energy | 留在附近等待恢复 |

**Creep 完全没有移动**

先检查代码里的 Creep 名称和大小写。
现在的完整代码会在 Console 中直接提示“找不到 Harvester1”，不会继续访问 `undefined.room`。

**Creep 到达 Source 后仍然没有采集**

确认它拥有可用的 `WORK` 部件，并查看 `harvest()` 是否返回了其他结果。
Source 当前没有 Energy 时，需要等待它恢复。

**Creep 装满后为什么不回 Spawn**

因为当前代码只有移动和采集，没有运输命令。
这是本篇刻意保留的问题，会在下一篇继续解决。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `Game.creeps['Harvester1']` | 找到指定名称的 Creep |
| `if (!creep) return` | 找不到 Creep 时停止后续代码 |
| `creep.room.find(FIND_SOURCES)` | 找到房间中的 Source |
| `creep.harvest(source)` | 尝试采集 Source |
| `ERR_NOT_IN_RANGE` | 目标距离太远 |
| `creep.moveTo(source)` | 尝试向 Source 靠近 |

> **最重要的流程**
> 找到 Creep → 检查它是否存在 → 找到 Source → 检查目标 → 尝试采集 → 距离太远就靠近

## 总结

这一篇，我们第一次通过代码安全地控制了 Creep。

程序完成了五件事：

1. 找到指定名称的 Creep；
2. 名称错误时停止后续代码；
3. 找到房间搜索结果中的第一个 Source；
4. 尝试采集 Energy；
5. 距离太远时尝试向 Source 靠近。

当你看到 Creep 自动靠近 Source，并开始采集 Energy 时，这篇文章的目标就已经完成了。

下一篇将继续解决：Creep 装满 Energy 以后，怎样让它返回 Spawn，并把 Energy 交出去？

## 官方参考资料

1. [Screeps API Reference：Game.creeps](https://docs.screeps.com/api/#Game.creeps)
2. [Screeps API Reference：Room.find 与 FIND_SOURCES](https://docs.screeps.com/api/#Room.find)
3. [Screeps API Reference：Creep.harvest](https://docs.screeps.com/api/#Creep.harvest)
4. [Screeps API Reference：Creep.moveTo](https://docs.screeps.com/api/#Creep.moveTo)
5. [Screeps Documentation：Creep 身体部件与移动](https://docs.screeps.com/creeps.html)

> 本文是 Screeps 新手入门系列的第四篇，只介绍最基础的 Creep 移动和采集。
> 最近 Source 的选择、自动运输、角色分工、Memory 与性能优化会放到后续文章中。