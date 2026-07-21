---
title: "Creep 采满后为什么不回去？让它把能量送回 Spawn"
description: "写给 Screeps 新手的运输入门教程：安全判断 Creep 是否装满，让它返回 Spawn、交付能量，再重新前往 Source。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-21"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "运输能量"
  - "Spawn"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-21"
featured: false
---

> **Screeps 新手入门 · 第 5 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **为什么它不会自己回来？**
> 游戏只会执行代码中写明的命令。[上一篇](/blog/screeps-first-creep-harvest)只让 Creep 移动和采集，
> 还没有告诉它装满以后应该去哪里。

## 这篇文章会讲什么

1. 开始前的准备
2. 判断 Creep 是否装满
3. 安全找到自己的 Spawn 和 Source
4. 把 Energy 交给 Spawn
5. 组合成完整代码
6. 保存后观察什么
7. 常见返回结果

## 一、开始前需要准备什么

本文会继续使用上一篇文章中的基础代码。开始前，请确认：

- 房间中已经有一只可以移动、采集和携带 Energy 的 Creep；
- 房间中已经有一个属于自己的 Spawn；
- 你知道 Creep 和 Spawn 的真实名称。

本文示例使用：

```text
Creep 名称：Harvester1
Spawn 名称：Spawn1
```

实际使用时，需要把这两个名称换成自己游戏中显示的名称，并且保持大小写完全一致。

## 二、怎样判断 Creep 是否装满

Creep 采集到的 Energy 会保存在它的 `store` 中。
可以使用下面这行代码查看还剩多少携带空间：

```javascript
creep.store.getFreeCapacity(RESOURCE_ENERGY)
```

例如：

- 返回 `50`：还有 50 点 Energy 空间；
- 返回 `20`：还有 20 点 Energy 空间；
- 返回 `0`：已经没有空余 Energy 空间。

因此，可以写成：

```javascript
if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
  // 还有空间，继续采集
} else {
  // 没有空间，把 Energy 送回 Spawn
}
```

> **`if` 和 `else` 是什么意思？**
> `if` 可以理解成“如果”，`else` 可以理解成“否则”。
> 这段代码表示：如果还有空间就采集，否则就回去交付。

这是一条适合第一次理解运输循环的简单判断。它还不是完整的工作状态系统；更稳定的状态切换会在[第 9 篇](/blog/screeps-upgrade-controller)中第一次使用 `creep.memory`。

## 三、安全找到 Creep、Source 和 Spawn

先找到 Creep：

```javascript
const creep = Game.creeps['Harvester1'];
```

名称错误时，`creep` 会是 `undefined`，因此要先检查：

```javascript
if (!creep) {
  console.log('找不到 Harvester1，请检查名称和大小写');
  return;
}
```

然后寻找 Source 和 Spawn：

```javascript
const source = creep.room.find(FIND_SOURCES)[0];
const spawn = Game.spawns['Spawn1'];
```

继续执行动作前，再分别检查它们是否存在：

```javascript
if (!source) {
  console.log('当前房间中没有找到可见的 Source');
  return;
}

if (!spawn) {
  console.log('找不到 Spawn1，请检查名称和大小写');
  return;
}
```

这样即使名称写错，代码也不会继续调用 `undefined.store`、`undefined.room` 或把不存在的对象交给 `transfer()`。

## 四、让 Creep 把 Energy 交给 Spawn

Creep 可以使用 `transfer()` 把携带的资源交给另一个对象。

```javascript
const result = creep.transfer(spawn, RESOURCE_ENERGY);
```

这里可以这样理解：

- `creep`：正在工作的 Creep；
- `spawn`：接收 Energy 的 Spawn；
- `RESOURCE_ENERGY`：要交付的资源类型。

如果 Creep 距离 Spawn 太远，`transfer()` 会返回 `ERR_NOT_IN_RANGE`：

```javascript
if (result === ERR_NOT_IN_RANGE) {
  creep.moveTo(spawn);
}
```

它的意思是：

> 先尝试交付 → 距离太远就向 Spawn 靠近

遇到这个返回结果时，也可以查看站内的[`ERR_NOT_IN_RANGE` 排查说明](/screeps-errors#err_not_in_range)。

## 五、把采集和运输组合起来

现在有两种情况：

- Creep 还有空间：前往 Source 并继续采集；
- Creep 已经装满：前往 Spawn 并交付 Energy。

完整代码如下：

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Harvester1'];

  if (!creep) {
    console.log('找不到 Harvester1，请检查名称和大小写');
    return;
  }

  const source = creep.room.find(FIND_SOURCES)[0];
  const spawn = Game.spawns['Spawn1'];

  if (!source) {
    console.log('当前房间中没有找到可见的 Source');
    return;
  }

  if (!spawn) {
    console.log('找不到 Spawn1，请检查名称和大小写');
    return;
  }

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    const harvestResult = creep.harvest(source);

    if (harvestResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    } else if (harvestResult !== OK &&
               harvestResult !== ERR_NOT_ENOUGH_RESOURCES) {
      console.log(`Harvester1 采集返回：${harvestResult}`);
    }
  } else {
    const transferResult = creep.transfer(spawn, RESOURCE_ENERGY);

    if (transferResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    } else if (transferResult !== OK &&
               transferResult !== ERR_FULL) {
      console.log(`Harvester1 交付返回：${transferResult}`);
    }
  }
};
```

> **保存前先修改两个名称**
> 把 `'Harvester1'` 和 `'Spawn1'` 换成自己游戏中真实显示的 Creep 与 Spawn 名称。

这段代码最简单的判断过程是：

> 还有空间 → 继续采集  
> 已经装满 → 返回 Spawn 交付

在 Source 有 Energy、Spawn 还有空余容量的情况下，Creep 就可以在两者之间往返。

## 六、保存代码后观察什么

1. Console 中是否没有持续出现名称或目标提示；
2. Creep 还有空间时，是否尝试向 Source 靠近；
3. 到达 Source 后，携带的 Energy 是否逐渐增加；
4. 装满以后，是否离开 Source 并返回 Spawn；
5. 到达 Spawn 旁边后，Creep 携带的 Energy 是否减少；
6. 交付成功后，是否再次前往 Source。

当你看到 Creep 从 Source 返回 Spawn，并成功交付至少一次 Energy 时，本篇目标就已经完成。

## 七、常见返回结果

| 返回结果 | 出现位置 | 最简单的理解 |
| --- | --- | --- |
| `OK` | `harvest()` 或 `transfer()` | 本次动作可以执行 |
| `ERR_NOT_IN_RANGE` | 两种动作都可能出现 | 距离目标太远 |
| `ERR_NOT_ENOUGH_RESOURCES` | `harvest()` | Source 当前没有可采集的 Energy |
| `ERR_FULL` | `transfer()` | Spawn 当前无法继续接收 Energy |

**Creep 装满后没有前往 Spawn**

先检查 Spawn 名称和大小写。现在的完整代码会在没有找到 Spawn 时直接输出提示，不会继续访问不存在的对象。

**Creep 到达 Spawn 后没有交付 Energy**

检查 Creep 是否真的携带了 Energy，并查看 `transferResult` 是否为 `ERR_FULL` 或其他返回值。

**Creep 停在 Spawn 旁边不动**

一种常见原因是 Spawn 已经装满，暂时无法继续接收 Energy。
本篇只把 Spawn 当作第一个接收目标；[第 10 篇](/blog/screeps-first-extension)会继续介绍 Extension。

**Creep 停在 Source 旁边等待**

Source 当前没有 Energy，而 Creep 又还没有装满时，它可能会留在 Source 附近等待恢复。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `creep.store.getFreeCapacity(RESOURCE_ENERGY)` | 查看 Creep 还有多少 Energy 空间 |
| `Game.spawns['Spawn1']` | 找到指定名称的 Spawn |
| `if (!spawn) return` | 找不到 Spawn 时停止后续代码 |
| `creep.transfer(spawn, RESOURCE_ENERGY)` | 把 Energy 交给 Spawn |
| `ERR_NOT_IN_RANGE` | 目标距离太远 |
| `ERR_FULL` | 目标暂时无法继续接收资源 |

## 总结

这一篇，我们在移动和采集的基础上，为 Creep 加入了最简单的运输能力。

现在它可以：

1. 安全找到 Creep、Source 和 Spawn；
2. 前往 Source；
3. 采集 Energy；
4. 装满后返回 Spawn；
5. 把 Energy 交给 Spawn；
6. 在条件允许时再次前往 Source。

下一篇将介绍 Creep 的身体部件：`WORK`、`CARRY` 和 `MOVE` 分别有什么作用。

## 官方参考资料

1. [Screeps API Reference：Store.getFreeCapacity](https://docs.screeps.com/api/#Store.getFreeCapacity)
2. [Screeps API Reference：Game.spawns](https://docs.screeps.com/api/#Game.spawns)
3. [Screeps API Reference：Creep.transfer](https://docs.screeps.com/api/#Creep.transfer)
4. [Screeps API Reference：StructureSpawn](https://docs.screeps.com/api/#StructureSpawn)

> 本文是 Screeps 新手入门系列的第五篇，只介绍最基础的采集与交付循环。
> 自动选择 Extension、角色系统、Memory 与资源调度会放到后续文章中。