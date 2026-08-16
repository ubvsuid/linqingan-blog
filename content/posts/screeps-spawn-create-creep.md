---
title: "怎样让 Spawn 创建新的 Creep？认识 spawnCreep()"
description: "写给 Screeps 新手的第一只 Creep 创建教程：找到 Spawn，准备 WORK、CARRY、MOVE，检查 spawnCreep() 返回值，并正确理解 Game.creeps 与 spawning 状态。"
publishedAt: "2026-07-16"
updatedAt: "2026-08-16"
category: "Screeps 入门"
tags:
  - "Screeps"
  - "新手入门"
  - "Spawn"
  - "Creep"
  - "Creep Body"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: true
  liveTested: false
  checkedAt: "2026-08-16"
  testedAt: "2026-08-11"
  testEnvironment: "shard3 / W39N53"
  testResult: "Accepted Console evidence: EV-1132EEA6DB475F4BDE4C verified a unique [WORK,CARRY,MOVE] StructureSpawn.spawnCreep() request returned OK (0) and the exact Creep later existed with the expected body; EV-5F64D77F6CEDD1637FA3 verified dryRun duplicate-name ERR_NAME_EXISTS (-3); EV-1EB26EDDC7D65006ADB2 verified dryRun ERR_NOT_ENOUGH_ENERGY (-6) when a 2400-Energy body exceeded the room's 2300 available Energy. The intermediate spawning window was not directly observed in that Console evidence; the same-tick Game.creeps[name].spawning boundary described in this revision is source-derived from the current official engine."
featured: false
---

> **Screeps 新手入门 · 第 7 篇**
> 建议按照系列顺序阅读；每篇只解决一个新手当前会遇到的问题。

> **这一篇会用到上一篇的身体部件**
> `[WORK, CARRY, MOVE]` 是新 Creep 的身体清单，`spawnCreep()` 会让 Spawn 按照这张清单开始创建。

还不熟悉三个基础部件时，可以先回到[第 6 篇：认识 WORK、CARRY 和 MOVE](/blog/screeps-creep-body-parts)。

## 一、创建前需要准备什么

本文假设房间中已经有一个属于自己的 Spawn。

开始前，请确认：

- 你知道 Spawn 的真实名称；
- 房间当前可用于生成 Creep 的 Energy 足够；
- 游戏中还没有名为 `Worker1` 的 Creep。

本文示例使用：

```text
Spawn 名称：Spawn1
新 Creep 名称：Worker1
```

在最早期房间中，生成 Energy 主要来自 Spawn；建造 Extension 后，也可以使用房间中可用的 Extension Energy。

## 二、创建 Creep 需要哪三项内容

### 1. 找到自己的 Spawn

```javascript
const spawn = Game.spawns['Spawn1'];
```

名称写错时，`spawn` 会是 `undefined`。在访问 `spawn.spawning` 或调用 `spawn.spawnCreep()` 前，先检查：

```javascript
if (!spawn) {
  console.log('找不到 Spawn1，请检查名称和大小写');
  return;
}
```

### 2. 准备身体部件

```javascript
[WORK, CARRY, MOVE]
```

| 部件 | 作用 | Energy 成本 |
| --- | --- | ---: |
| `WORK` | 提供工作和采集能力 | 100 |
| `CARRY` | 提供携带空间 | 50 |
| `MOVE` | 提供移动能力 | 50 |

这只基础 Creep 一共需要：

```text
200 Energy
```

### 3. 设置唯一名称

```javascript
'Worker1'
```

名称不能和已有 Creep 重复。

创建请求一旦被正式接受，名称会立刻进入这次生成流程，因此不要在后面的 tick 继续无条件使用同一个名称提交。

## 三、第一次调用 `spawnCreep()`

```javascript
const result = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1'
);
```

这段代码可以理解成：

> 让这个 Spawn 使用 WORK、CARRY 和 MOVE，开始创建一只名为 Worker1 的 Creep，并把 API 返回值保存到 `result`。

如果返回：

```text
OK
```

表示生成请求已经被接受。

但这里要区分三个状态：

```text
请求被接受
≠
Creep 已经生成完成
≠
Creep 已经可以执行普通工作动作
```

## 四、最容易误解的时序：`Game.creeps[name]` 不等于“生成完成”

旧版文章把 `Game.creeps['Worker1']` 讲得太晚了，容易让人误以为：

> 必须等整个生成过程结束以后，`Worker1` 才会出现在 `Game.creeps`。

当前官方 engine 不是这样处理的。

在本文核对的当前 engine 中，正式 `spawnCreep()` 请求通过校验后，会在**同一次 JavaScript 执行中**创建：

```javascript
Game.creeps['Worker1']
```

并让这个临时生成中的 Creep 满足：

```javascript
Game.creeps['Worker1'].spawning === true
```

然后才返回：

```text
OK
```

因此：

```javascript
Boolean(Game.creeps['Worker1'])
```

只能证明这个名称当前已经有一个 Creep 对象，**不能证明生成已经完成**。

真正判断“是否还在 Spawn 中”，应该看：

```javascript
const creep = Game.creeps['Worker1'];

if (creep?.spawning === true) {
  // 已经进入 Game.creeps，但仍在生成
}
```

等到后续 tick：

```javascript
creep.spawning === false
```

才表示它已经离开生成阶段，可以进入正常角色逻辑。

> **证据边界**
> 2026-08-11 已接受的 Console 证据确认了真实 `spawnCreep()` 返回 `OK`，并确认该 Creep 后续确实存在且身体正确；当时没有直接捕获中间 `spawning === true` 窗口。上面这一段“同 tick 进入 `Game.creeps`”来自当前官方 engine 源码核对，不冒充新的 Console 实测。

## 五、`dryRun` 又是另一条边界

如果使用：

```javascript
const result = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    dryRun: true
  }
);
```

`dryRun: true` 只检查当前请求条件，不正式开始生成。

当前 engine 会在创建 `Game.creeps[name]` 之前直接返回 dryRun 结果。

所以：

```text
dryRun === OK
```

不意味着：

```javascript
Game.creeps['Worker1']
```

已经被创建。

这也是为什么“dryRun 通过”和“正式请求已经开始生成”不能混成一个状态。

## 六、完整的新手代码

Screeps 会在每个 tick 重新运行主循环。

为了避免重复提交同名 Creep，可以同时检查：

- `Game.creeps['Worker1']` 是否已经存在；
- Spawn 是否已经在生成其他 Creep。

```javascript
module.exports.loop = function () {
  const spawn = Game.spawns['Spawn1'];

  if (!spawn) {
    console.log('找不到 Spawn1，请检查名称和大小写');
    return;
  }

  const creep = Game.creeps['Worker1'];

  if (creep) {
    if (creep.spawning === true) {
      // Worker1 已进入生成流程，但还不能执行普通工作
      return;
    }

    // Worker1 已经生成完成
    return;
  }

  if (spawn.spawning) {
    return;
  }

  const result = spawn.spawnCreep(
    [WORK, CARRY, MOVE],
    'Worker1'
  );

  if (result === OK) {
    const created = Game.creeps['Worker1'];

    console.log({
      action: 'spawn-worker1',
      result,
      existsAfterAcceptedCall: Boolean(created),
      spawningAfterAcceptedCall:
        created?.spawning ?? null
    });
  } else if (
    result !== ERR_NOT_ENOUGH_ENERGY
    && result !== ERR_NAME_EXISTS
    && result !== ERR_BUSY
  ) {
    console.log(`创建 Worker1 返回：${result}`);
  }
};
```

> **保存前先修改 Spawn 名称**
> 把 `'Spawn1'` 换成游戏中的真实 Spawn 名称。`'Worker1'` 也可以修改，但存在检查和创建命令必须使用同一个名称。

这份代码把“对象存在”和“生成完成”分成了两个判断：

```text
!Game.creeps.Worker1
→ 尚未进入这次生成流程

Game.creeps.Worker1?.spawning === true
→ 已进入生成流程，但仍在生成

Game.creeps.Worker1?.spawning === false
→ 已经生成完成
```

## 七、怎样查看创建结果

第一次练习时，先认识四个常见返回值：

| 返回结果 | 最简单的理解 | 当前代码怎样处理 |
| --- | --- | --- |
| `OK` | 正式生成请求已接受 | 记录结果，再观察生成状态 |
| `ERR_NOT_ENOUGH_ENERGY` | 当前可用于生成的 Energy 不足 | 等待 Energy 增加 |
| `ERR_NAME_EXISTS` | 名称已经被占用 | 检查名称与重复提交 |
| `ERR_BUSY` | Spawn 当前已经在生成 | 等待当前生成流程 |

更完整的返回码可以看：[spawnCreep() 失败怎么查](/blog/screeps-spawncreep-return-codes)。

## 八、保存代码后应该观察什么

按顺序观察：

1. Console 是否持续出现“找不到 Spawn1”；
2. Energy 足够时，正式调用是否返回 `OK`；
3. `Game.creeps['Worker1']` 是否已经存在；
4. 生成阶段的 `Game.creeps['Worker1'].spawning` 是否为 `true`；
5. 等待后续 tick，直到 `spawning` 变为 `false`；
6. 再让角色逻辑开始控制这只 Creep。

### 为什么房间画面里还没看到可工作的 Creep？

因为“对象已经进入 `Game.creeps`”和“生成完成”是两件事。

一个仍然：

```javascript
creep.spawning === true
```

的 Creep 还在 Spawn 中，不能按普通 Worker 去执行采集、移动等正常角色逻辑。

## 九、现有 Console 证据证明了什么

本文保留原有已接受证据，不把源码结论伪装成新的实测。

### EV-1132EEA6DB475F4BDE4C

真实环境中，一个唯一的：

```javascript
[WORK, CARRY, MOVE]
```

`spawnCreep()` 请求返回：

```text
OK (0)
```

后续又确认了对应 Creep 存在并具有预期身体。

这证明了：

- 该正式请求在真实环境中被接受；
- 后续观察到精确对应的 Creep；
- body 符合预期。

它**没有直接捕获**同一次执行中的 `Game.creeps[name].spawning === true` 中间状态。

### EV-5F64D77F6CEDD1637FA3

真实 dryRun 验证了重复名称：

```text
ERR_NAME_EXISTS (-3)
```

### EV-1EB26EDDC7D65006ADB2

真实 dryRun 验证了 Energy 不足：2400 Energy 的 body 超过房间当时 2300 可用 Energy，返回：

```text
ERR_NOT_ENOUGH_ENERGY (-6)
```

因此本文目前的证据层级是：

```text
正式 OK + 后续 Creep/body：Console 已验证
dryRun 名称重复：Console 已验证
dryRun Energy 不足：Console 已验证
同 tick Game.creeps[name].spawning：官方 engine 源码确认，未新增 Console 证据
```

## 十、三个常见问题

### 1. `Game.creeps['Worker1']` 已经存在，为什么它还不能工作？

先检查：

```javascript
Game.creeps['Worker1'].spawning
```

如果是 `true`，它仍在生成阶段。

### 2. Energy 一直不足

本文中的：

```javascript
[WORK, CARRY, MOVE]
```

需要 200 Energy。

如果要系统排查 Energy、body、dryRun 和其他返回值，继续看：[spawnCreep() 失败怎么查](/blog/screeps-spawncreep-return-codes)。

### 3. Spawn 名称写错

完整代码会先：

```javascript
if (!spawn) return;
```

所以不会继续访问 `undefined.spawning`。

## 十一、这一篇真正要记住什么

| 代码 / 状态 | 最简单的理解 |
| --- | --- |
| `Game.spawns['Spawn1']` | 找到指定 Spawn |
| `[WORK, CARRY, MOVE]` | 新 Creep 的身体清单 |
| `spawn.spawnCreep(body, name)` | 正式请求 Spawn 开始生成 |
| `result === OK` | 正式生成请求已经被接受 |
| `Game.creeps[name]` | 该名称当前已经存在 Creep 对象；不代表生成完成 |
| `Game.creeps[name].spawning === true` | 仍在生成 |
| `Game.creeps[name].spawning === false` | 已离开生成阶段 |
| `dryRun: true` | 只检查，不正式创建 Creep 对象 |

## 总结

这一篇，我们第一次让 Spawn 安全地创建一只新的 Creep，并把最容易混淆的时序拆开：

```text
正式 spawnCreep() 返回 OK
→ 同一次执行中 Game.creeps[name] 已存在且 spawning === true
→ 后续 tick 持续生成
→ spawning === false
→ 才进入正常角色逻辑
```

所以不要把：

```javascript
Boolean(Game.creeps[name])
```

当成“已经生成完成”的判断。

[下一篇](/blog/screeps-creep-roles)将继续介绍：房间中有多只 Creep 后，为什么需要给它们分配不同的工作。

## 官方参考资料

1. [Screeps API Reference：Game.creeps](https://docs.screeps.com/api/#Game.creeps)
2. [Screeps API Reference：StructureSpawn.spawnCreep](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
3. [Screeps API Reference：Creep.spawning](https://docs.screeps.com/api/#Creep-spawning)
4. [Screeps API Reference：BODYPART_COST](https://docs.screeps.com/api/#BODYPART_COST)
5. [官方 engine：StructureSpawn.spawnCreep](https://github.com/screeps/engine/blob/80977824199a596d174d392fd0cf8c458c21fcbd/src/game/structures.js)
6. [Screeps Documentation：Creeps 与身体部件](https://docs.screeps.com/creeps.html)

资料核对日期：2026-08-16。当前官方 engine `master` 为 `80977824199a596d174d392fd0cf8c458c21fcbd`（4.3.2）。现有 Console 证据继续保留；同 tick `Game.creeps[name].spawning` 时序来自官方 engine 源码核对，未冒充新的真实服务器观测。