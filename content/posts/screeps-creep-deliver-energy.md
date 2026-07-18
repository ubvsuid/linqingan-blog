---
title: "Creep 采满后为什么不回去？让它把能量送回 Spawn"
description: "写给 Screeps 新手的运输入门教程：判断 Creep 是否装满，让它返回 Spawn、交付能量，再重新前往 Source。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-15"
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
  checkedAt: "2026-07-19"
featured: false
---

> **Screeps 新手入门 · 第 5 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **为什么它不会自己回来？**
> 游戏只会执行代码中写明的命令。上一篇只让 Creep 移动和采集，
> 还没有告诉它装满以后应该去哪里。

## 这篇文章会讲什么

1. 开始前的准备
2. 判断 Creep 是否装满
3. 找到自己的 Spawn
4. 把能量交给 Spawn
5. 组合成完整代码
6. 保存后观察什么
7. 常见问题

## 一、开始前需要准备什么

本文会继续使用上一篇文章中的基础代码。开始前，请确认：

- 房间中已经有一只可以移动、采集和携带能量的 Creep；
- 房间中已经有一个属于自己的 Spawn；
- 你知道 Creep 和 Spawn 的真实名称。

本文示例使用：

```text
Creep 名称：Harvester1
Spawn 名称：Spawn1
```

实际使用时，需要把这两个名称换成自己游戏中显示的名称，
并且保持大小写完全一致。

## 二、怎样判断 Creep 是否装满

Creep 采集到的能量会保存在它的 `store` 中。
可以使用下面这行代码查看还剩多少携带空间：

```javascript
creep.store.getFreeCapacity()
```

例如：

- 返回 `50`：还有 50 点空间；
- 返回 `20`：还有 20 点空间；
- 返回 `0`：已经没有空余空间。

因此，可以写成：

```javascript
if (creep.store.getFreeCapacity() > 0) {
  // 还有空间，继续采集
} else {
  // 没有空间，把能量送回 Spawn
}
```

> **`if` 和 `else` 是什么意思？**
> `if` 可以理解成“如果”，`else` 可以理解成“否则”。
> 这段代码表示：如果还有空间就采集，否则就回去交付。

## 三、找到自己的 Spawn

假设你的 Spawn 名为 `Spawn1`，可以写：

```javascript
const spawn = Game.spawns['Spawn1'];
```

这行代码可以简单理解成：

> 找到名为 Spawn1 的 Spawn，并把它临时称为 spawn。

如果你的 Spawn 使用其他名称，只需要替换引号中的内容。

## 四、让 Creep 把能量交给 Spawn

Creep 可以使用 `transfer()` 把携带的资源交给另一个对象。

```javascript
creep.transfer(spawn, RESOURCE_ENERGY);
```

这里可以这样理解：

- `creep`：正在工作的 Creep；
- `spawn`：接收能量的 Spawn；
- `RESOURCE_ENERGY`：要交付的是 Energy。

如果 Creep 距离 Spawn 太远，`transfer()` 会返回
`ERR_NOT_IN_RANGE`。

```javascript
const result = creep.transfer(spawn, RESOURCE_ENERGY);

if (result === ERR_NOT_IN_RANGE) {
  creep.moveTo(spawn);
}
```

它的意思是：

> 先尝试交付 → 距离太远就向 Spawn 靠近

## 五、把采集和运输组合起来

现在有两种情况：

- Creep 还有空间：前往 Source 并继续采集；
- Creep 已经装满：前往 Spawn 并交付能量。

完整代码如下：

```javascript
module.exports.loop = function () {
  const creep = Game.creeps['Harvester1'];
  const source = creep.room.find(FIND_SOURCES)[0];
  const spawn = Game.spawns['Spawn1'];

  if (creep.store.getFreeCapacity() > 0) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
    }
  } else {
    if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
  }
};
```

> **保存前先修改两个名称**
> 把 `'Harvester1'` 和 `'Spawn1'`
> 换成自己游戏中真实显示的 Creep 与 Spawn 名称。

这段代码最简单的判断过程是：

> 还有空间 → 继续采集  
> 已经装满 → 返回 Spawn 交付

在 Source 有能量、Spawn 还有空余容量的情况下，
Creep 就可以在两者之间往返。

## 六、保存代码后观察什么

1. Creep 还有空间时，是否尝试向 Source 靠近。
2. 到达 Source 后，携带的 Energy 是否逐渐增加。
3. 装满以后，是否离开 Source 并返回 Spawn。
4. 到达 Spawn 旁边后，Creep 携带的 Energy 是否减少。
5. 交付成功后，是否再次前往 Source。

## 七、四个常见问题

**1. Creep 装满后没有前往 Spawn**

先检查 Spawn 名称和大小写。
如果 Console 中出现与 `undefined` 有关的错误，
通常也是因为程序没有找到对应的 Spawn。

**2. Creep 到达 Spawn 后没有交付能量**

检查 Creep 是否真的携带了 Energy，
以及它是否已经站在 Spawn 相邻的位置。

**3. Creep 停在 Spawn 旁边不动**

一种常见原因是 Spawn 已经装满，暂时无法继续接收能量。
这时 `transfer()` 可能返回 `ERR_FULL`。

本篇只把 Spawn 当作第一个能量接收目标。
后面的文章会再介绍 Extension 和其他接收能量的建筑。

**4. Creep 停在 Source 旁边等待**

Source 暂时没有能量，而 Creep 又还没有装满时，
它可能会留在 Source 附近等待恢复。
这不是本篇代码出错，而是这套最简单判断的正常表现。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `creep.store.getFreeCapacity()` | 查看 Creep 还有多少携带空间 |
| `Game.spawns['Spawn1']` | 找到指定名称的 Spawn |
| `creep.transfer(spawn, RESOURCE_ENERGY)` | 把 Energy 交给 Spawn |
| `ERR_NOT_IN_RANGE` | 目标距离太远 |
| `ERR_FULL` | 目标暂时无法继续接收资源 |

## 总结

这一篇，我们在移动和采集的基础上，
为 Creep 加入了最简单的运输能力。

现在它可以：

1. 前往 Source；
2. 采集能量；
3. 装满后返回 Spawn；
4. 把能量交给 Spawn；
5. 在条件允许时再次前往 Source。

当你看到 Creep 从 Source 返回 Spawn，并成功交付一次能量时，
这篇文章的目标就已经完成了。

下一篇将介绍 Creep 的身体部件：
`WORK`、`CARRY` 和 `MOVE`
分别有什么作用。

## 官方参考资料

1. [Screeps API Reference：Store.getFreeCapacity](https://docs.screeps.com/api/#Store.getFreeCapacity)
2. [Screeps API Reference：Game.spawns](https://docs.screeps.com/api/#Game.spawns)
3. [Screeps API Reference：Creep.transfer](https://docs.screeps.com/api/#Creep.transfer)
4. [Screeps API Reference：StructureSpawn](https://docs.screeps.com/api/#StructureSpawn)

> 本文是 Screeps 新手入门系列的第五篇，只介绍最基础的采集与交付循环。
> 自动选择 Extension、角色系统、Memory 与资源调度会放到后续文章中。
