---
title: "怎样让 Spawn 创建新的 Creep？认识 spawnCreep()"
description: "写给 Screeps 新手的第一只 Creep 创建教程：找到 Spawn，准备 WORK、CARRY、MOVE 身体，设置名称并调用 spawnCreep()。"
publishedAt: "2026-07-16"
updatedAt: "2026-07-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Spawn"
  - "Creep"
  - "spawnCreep"
  - "JavaScript"
draft: false
featured: false
---

> **Screeps 新手入门 · 第 7 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇会用到上一篇的身体部件**
> `[WORK, CARRY, MOVE]` 是新 Creep 的身体清单，
> `spawnCreep()` 会让 Spawn 按照这张清单开始创建。

## 一、创建前需要准备什么

开始前，请确认：

- 房间中已经有一个属于自己的 Spawn；
- 你知道 Spawn 的真实名称；
- 房间当前可用于生成 Creep 的 Energy 足够；
- 游戏中还没有名为 `Worker1` 的 Creep。

在新手当前阶段，可用于生成的 Energy 通常主要来自 Spawn。
后面建造 Extension 后，房间还可以使用 Extension 中的 Energy。

本文示例使用：

```text
Spawn 名称：Spawn1
新 Creep 名称：Worker1
```

## 二、创建 Creep 需要哪三项内容

### 1. 找到自己的 Spawn

```javascript
const spawn = Game.spawns['Spawn1'];
```

这行代码表示：找到名为 `Spawn1` 的 Spawn，
并把它临时称为 `spawn`。

### 2. 准备身体部件

```javascript
[WORK, CARRY, MOVE]
```

| 部件 | 作用 | 需要的 Energy |
| --- | --- | --- |
| `WORK` | 提供工作和采集能力 | 100 |
| `CARRY` | 提供携带空间 | 50 |
| `MOVE` | 提供移动能力 | 50 |

这只基础 Creep 一共需要 **200 Energy**。

### 3. 设置一个唯一名称

```javascript
'Worker1'
```

Creep 的名称需要放在引号中，并且不能和现有 Creep 重复。
创建完成后，可以通过
`Game.creeps['Worker1']` 找到它。

## 三、第一次调用 spawnCreep()

准备好 Spawn、身体部件和名称后，可以写：

```javascript
spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1'
);
```

这段代码可以理解成：

> 让这个 Spawn 使用 WORK、CARRY 和 MOVE，
> 开始创建一只名为 Worker1 的 Creep。

`spawnCreep()` 返回 `OK` 时，
表示创建任务已经成功开始，不代表 Creep 已经立刻完成。

## 四、完整的新手代码

Screeps 会在每个 tick 中重新运行主循环。
为了避免每个 tick 都重复尝试创建同一只 Creep，
可以先检查它是否已经存在，以及 Spawn 是否正在工作。

```javascript
module.exports.loop = function () {
  const spawn = Game.spawns['Spawn1'];

  if (!Game.creeps['Worker1'] && !spawn.spawning) {
    const result = spawn.spawnCreep(
      [WORK, CARRY, MOVE],
      'Worker1'
    );

    console.log(result);
  }
};
```

> **保存前先修改 Spawn 名称**
> 把 `'Spawn1'` 换成自己游戏中真实显示的 Spawn 名称。
> `'Worker1'` 也可以换成其他没有被使用的名称。

> **判断代码怎么理解？**
> `!` 可以暂时理解成“没有”，
> `&&` 可以理解成“并且”。
> 整段判断表示：没有 Worker1，并且 Spawn 当前没有在创建其他 Creep。

## 五、怎样查看创建结果

`spawnCreep()` 会返回一个结果。
代码中的：

```javascript
console.log(result);
```

会把这个结果显示在 Console 中。

| 返回结果 | 最简单的理解 |
| --- | --- |
| `OK`（数值为 `0`） | 已经成功开始创建 |
| `ERR_NOT_ENOUGH_ENERGY` | 房间当前可用于生成的 Energy 不足 |
| `ERR_NAME_EXISTS` | 已经存在同名 Creep |

第一次练习时，先认识这三个结果就足够了。

## 六、保存代码后观察什么

1. Console 是否出现 `0`，也就是 `OK`；
2. Spawn 是否显示正在创建 Creep；
3. 等待创建过程完成；
4. 房间中是否出现名为 `Worker1` 的新 Creep；
5. 点击它后，是否能看到 `WORK`、`CARRY` 和 `MOVE`。

Spawn 创建每个身体部件需要一定时间。
这只 Creep 有三个身体部件，所以不会在调用代码后立刻出现。

## 七、三个常见问题

**1. Console 显示 ERR_NOT_ENOUGH_ENERGY**

这表示房间当前可用于生成的 Energy 不足。
本文中的 `[WORK, CARRY, MOVE]` 需要 200 Energy。

**2. Console 显示 ERR_NAME_EXISTS**

这表示已经存在名为 `Worker1` 的 Creep。
可以换成 `Worker2`，但代码中的名称检查也要一起修改。

**3. Spawn 没有反应**

依次检查：

- Spawn 名称和大小写是否正确；
- Creep 名称是否写在引号中；
- 身体部件是否写在方括号中；
- Console 中是否出现错误结果。

> **补充：如果出现 ERR_BUSY**
> 表示 Spawn 正在创建另一只 Creep。
> 等当前创建结束后，它才能开始下一次创建。

## 总结

这一篇，我们第一次让 Spawn 创建了一只新的 Creep。

> 找到 Spawn → 提供身体部件 → 设置唯一名称
> → 调用 `spawnCreep()` → 等待创建完成

当你看到 Spawn 开始生产，并最终在房间中出现
`Worker1` 时，这篇文章的目标就已经完成了。

下一篇将继续介绍：房间中有多只 Creep 后，
为什么需要给它们分配不同的工作。

## 官方参考资料

1. [Screeps API Reference：Game.spawns](https://docs.screeps.com/api/#Game.spawns)
2. [Screeps API Reference：StructureSpawn.spawnCreep](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
3. [Screeps API Reference：BODYPART_COST](https://docs.screeps.com/api/#BODYPART_COST)
4. [Screeps Documentation：Creeps 与身体部件](https://docs.screeps.com/creeps.html)

> 本文是 Screeps 新手入门系列的第七篇，只介绍第一次使用 `spawnCreep()` 创建 Creep。
> 动态命名、Memory、角色字段、自动补员和生产队列会放到后续文章中。
