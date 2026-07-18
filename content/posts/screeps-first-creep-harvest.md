
---
title: "Screeps 新手入门：让第一只 Creep 移动并采集能量"
description: "写给 Screeps 新手的第一段 Creep 控制教程：找到自己的 Creep 和 Source，让 Creep 自动靠近并开始采集能量。"
publishedAt: "2026-07-15"
updatedAt: "2026-07-15"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Creep"
  - "采集能量"
  - "JavaScript"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---

> **Screeps 新手入门 · 第 4 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这还不是完整的自动采集系统**
> 本篇只让 Creep 前往 Source 并采集。它暂时不会把能量送回 Spawn，
> 运输能量会放到下一篇单独介绍。

## 这篇文章会讲什么

1. 开始前的准备
2. 找到自己的 Creep
3. 找到房间中的 Source
4. 让 Creep 采集并靠近 Source
5. 保存代码后观察什么
6. 常见问题

## 一、开始前需要准备什么

本文默认你的房间中已经有一只 Creep。
为了让它能够移动、采集并把能量装进身体里，通常需要下面三个基础身体部件：

- **`MOVE`**：让 Creep 移动
- **`WORK`**：让 Creep 采集
- **`CARRY`**：让 Creep 携带能量

这一篇不讲身体部件的计算方法。
可以先使用游戏教程中的基础工作 Creep，后面会有单独文章介绍身体部件。

## 二、第一步：找到自己的 Creep

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

代码中的名称必须换成你自己的真实名称，而且大小写必须完全一致。

## 三、第二步：找到房间中的 Source

找到 Creep 后，接下来让程序寻找它所在房间中的 Source：

```javascript
const sources = creep.room.find(FIND_SOURCES);
```

这行代码可以简单理解为：

> 在这只 Creep 当前所在的房间中，寻找所有 Source。

一个房间中可能有不止一个 Source，所以这里得到的是一组结果。
为了让第一段代码保持简单，我们暂时取出搜索结果中的第一个 Source：

```javascript
const source = sources[0];
```

`[0]` 表示取出第一个结果。
这里选到的不一定是最近的 Source，但已经足够完成本篇练习。

## 四、第三步：尝试采集，距离太远就靠近

找到 Source 后，可以让 Creep 先尝试采集：

```javascript
const result = creep.harvest(source);
```

如果 Creep 已经站在 Source 旁边，并且拥有可用的 `WORK` 部件，
它通常就可以开始采集。

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
  const sources = creep.room.find(FIND_SOURCES);
  const source = sources[0];

  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  }
};
```

> **保存前先修改名称**
> 把代码中的 `'Harvester1'` 换成你游戏中真实显示的 Creep 名称。

## 五、保存代码后观察什么

保存代码后，回到房间画面，依次观察：

1. Creep 是否开始尝试向 Source 靠近。
2. Creep 是否最终停在 Source 相邻的位置。
3. Creep 是否开始执行采集动作。
4. 点击 Creep 后，携带的 Energy 是否逐渐增加。

### 装满能量后会发生什么

当前代码没有告诉 Creep 把能量送到哪里，所以它装满后不会自动返回 Spawn。

它仍会停在 Source 附近，并继续执行这段采集代码。
当 Creep 已经没有空余携带空间时，多余的能量可能会掉落在地面上。

这不代表移动和采集代码失败，只说明我们还没有加入运输逻辑。
下一篇会让它在装满后返回并交付能量。

## 六、三个常见问题

**1. Creep 完全没有移动**

先检查代码里的 Creep 名称和大小写。
如果 Console 中出现与 `undefined` 或 `room` 有关的错误，
通常也是因为程序没有找到这只 Creep。

**2. Creep 到达 Source 后仍然没有采集**

确认它拥有可用的 `WORK` 部件。
Source 暂时没有能量时，也需要等待它重新恢复。

**3. Creep 装满后为什么不回 Spawn**

因为当前代码只有移动和采集，没有运输命令。
这是本篇刻意保留的问题，会在下一篇继续解决。

## 这一篇需要记住什么

| 代码 | 最简单的理解 |
| --- | --- |
| `Game.creeps['Harvester1']` | 找到指定名称的 Creep |
| `creep.room.find(FIND_SOURCES)` | 找到房间中的 Source |
| `creep.harvest(source)` | 尝试采集 Source |
| `ERR_NOT_IN_RANGE` | 目标距离太远 |
| `creep.moveTo(source)` | 尝试向 Source 靠近 |

> **最重要的流程**
> 找到 Creep → 找到 Source → 尝试采集 → 距离太远就靠近

## 总结

这一篇，我们第一次真正通过代码控制了 Creep。

程序完成了四件事：

1. 找到指定名称的 Creep；
2. 找到房间搜索结果中的第一个 Source；
3. 尝试采集能量；
4. 距离太远时尝试向 Source 靠近。

当你看到 Creep 自动靠近 Source，并开始采集能量时，
这篇文章的目标就已经完成了。

下一篇将继续解决：Creep 装满能量以后，
怎样让它返回 Spawn，并把能量交出去？

## 官方参考资料

1. [Screeps API Reference：Game.creeps](https://docs.screeps.com/api/#Game.creeps)
2. [Screeps API Reference：Room.find 与 FIND_SOURCES](https://docs.screeps.com/api/#Room.find)
3. [Screeps API Reference：Creep.harvest](https://docs.screeps.com/api/#Creep.harvest)
4. [Screeps API Reference：Creep.moveTo](https://docs.screeps.com/api/#Creep.moveTo)
5. [Screeps Documentation：Creep 身体部件与移动](https://docs.screeps.com/creeps.html)

> 本文是 Screeps 新手入门系列的第四篇，只介绍最基础的 Creep 移动和采集。
> 最近 Source 的选择、自动运输、角色分工、Memory 与性能优化会放到后续文章中。

