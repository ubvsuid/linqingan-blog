---
title: "Screeps Creep.pull()：两只 Creep 同 tick 协同移动"
description: "正确使用 Creep.pull() 协调两只相邻 Creep 的同 tick 移动，理解 pull 与 move 的三段配合、返回码、fatigue 转移和失败边界。"
publishedAt: "2026-09-06"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "Creep"
  - "pull"
  - "移动"
  - "fatigue"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-09-06"
featured: false
knowledge:
  module: "movement-vision"
  stage: "path-costs"
  order: 75
  difficulty: "intermediate"
seo:
  primaryKeyword: "Screeps Creep.pull"
  searchIntent: "正确使用 Creep.pull() 协调两只相邻 Creep 的同 tick 移动，理解 pull、双方 move、fatigue 与失败边界"
  keywordRole: "owner"
---

`Creep.pull(target)` 不是“调用一次后，target 自动跟着走”。一次有效的拉动通常要在**同一个 tick** 协调三件事：

```text
puller 移向下一格
+ puller.pull(target)
+ target.move(puller)
→ tick 结算时尝试形成一次协同移动
```

官方最小模式就是这三个 intent。`pull()` 返回 `OK` 只表示拉动操作已成功安排，并不代表两只 Creep 已经完成位移；最终位置要在 tick 结算后再看。

## 最小可用写法：三个 intent 缺一不可

假设 `puller` 要向上移动，同时把相邻的 `target` 带上：

```javascript
const puller = Game.creeps.Puller;
const target = Game.creeps.Target;

if (!puller || !target) {
  return;
}

puller.move(TOP);
const pullResult = puller.pull(target);
target.move(puller);

console.log({ pullResult });
```

这三行分别承担不同职责：

1. `puller.move(TOP)`：puller 申明自己下一步要去哪里；
2. `puller.pull(target)`：建立本 tick 的拉动关系；
3. `target.move(puller)`：target 申明自己要朝 puller 当前所在格移动。

只写：

```javascript
puller.pull(target);
```

不会自动补上另外两次 `move()`。

如果你的问题是普通 `moveTo()` 返回 `OK` 但 Creep 没有位移，应先看 [moveTo() 不移动怎么排查](/blog/screeps-moveto-not-moving)；`pull()` 解决的是两只 Creep 的协同移动，不是通用寻路替代品。

## 调用前先检查三个条件

### 1. target 必须与 puller 相邻

`pull()` 要求目标位于相邻格。可以先检查：

```javascript
if (!puller.pos.isNearTo(target.pos)) {
  console.log("target is not adjacent");
  return;
}
```

不相邻时，`puller.pull(target)` 返回 `ERR_NOT_IN_RANGE`。

如果你经常混淆“同格、相邻、range N”，可以先看 [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)。

### 2. puller 需要可用的 MOVE 能力

官方文档要求执行 `pull()` 的 Creep 具有 `MOVE` body part。更重要的是，puller 不只是“发出 pull”，它还必须真的移动到别处。

因此排查时不要只看 target。puller 自己的：

- `fatigue`；
- 有效 `MOVE`；
- 身体重量和携带资源；
- 下一格是否可进入；

都会影响最终位移。

关于 `MOVE`、地形和负载如何产生或恢复 fatigue，可以继续看 [MOVE 部件、fatigue 与负载](/blog/screeps-move-fatigue-body-ratio)。

### 3. target 也要提交 `move(puller)`

这是 `pull()` 最容易漏掉的一步：

```javascript
target.move(puller);
```

这里 `move()` 的参数不是方向常量，而是相邻的 puller Creep。

官方 `Creep.move()` 文档专门支持这种写法。target 被相邻 Creep 拉动时，`move(puller)` 会走拉动专用的移动判定；官方文档明确说明，这种调用会绕过 target 自身的 `ERR_TIRED` 与 `ERR_NO_BODYPART` 检查。

这也是为什么 `pull()` 可以用来移动没有有效 `MOVE` 的己方 Creep。

## fatigue 到底算在谁身上

`pull()` 的核心价值不是“免费移动”，而是改变这次移动产生的 fatigue 归属。

官方定义是：target 这次移动产生的 fatigue 会加到 puller，而不是 target。

所以拉一个很重的 target 时，真正需要关注的是 puller 是否有足够的移动能力承担额外 fatigue。

这意味着下面的判断是错误的：

```text
target 没有 MOVE
→ target 一定不能被拉
```

更准确的是：

```text
target 可以通过 move(puller) 参与被拉移动
→ target 的移动 fatigue 转移给 puller
→ puller 需要承担这次协同移动的移动成本
```

## `pull()` 的返回码只有这几类

当前官方 `Creep.pull()` 返回表包含：

| 返回码 | 含义 | 先检查什么 |
| --- | --- | --- |
| `OK` | pull intent 已成功安排 | 继续检查双方 move，并在下一 tick 验证位置 |
| `ERR_NOT_OWNER` | 你不是 puller 的所有者 | 是否对自己的 Creep 调用 |
| `ERR_BUSY` | puller 仍在 spawning | 等生成完成 |
| `ERR_INVALID_TARGET` | target 不是有效目标 | 是否真的传入 Creep |
| `ERR_NOT_IN_RANGE` | target 距离太远 | 是否相邻 |

要特别注意：`pull()` 的官方返回表**没有**列出 `ERR_TIRED` 或 `ERR_NO_BODYPART`。

这不等于 fatigue 和 MOVE 不重要，而是说明你不应该把其他移动 API 的返回码机械套到 `pull()` 上。puller 自己的移动是否能执行，要结合 `puller.move(...)` 的返回值和后续 tick 的实际位置判断。

一个更有用的诊断写法是把三次调用分别记录：

```javascript
const pullerMove = puller.move(TOP);
const pullResult = puller.pull(target);
const targetMove = target.move(puller);

console.log({
  pullerMove,
  pullResult,
  targetMove,
  pullerFatigue: puller.fatigue,
  targetFatigue: target.fatigue
});
```

这样你能区分到底是哪一个 intent 没有被成功安排。

## `OK` 不等于两只 Creep 已经完成位移

Screeps 的动作按 tick 结算。当前 tick 调用：

```javascript
puller.move(TOP);
puller.pull(target);
target.move(puller);
```

得到的是三次 intent 的返回值。

正确的验证顺序是：

```text
当前 tick
→ 记录两只 Creep 的位置和 fatigue
→ 提交 puller.move / pull / target.move

tick 结算
→ 游戏统一处理移动、碰撞与 fatigue

下一 tick
→ 再读取两只 Creep 的新位置和 fatigue
```

因此即使三次调用都返回 `OK`，最终位移仍可能受到目标格阻挡、其他 Creep 竞争移动等结算条件影响。

不要把：

```javascript
pullResult === OK
```

写成：

```text
target 已经被成功移动到下一格
```

前者是当前 tick 的请求结果，后者是结算后的世界状态。

## 为什么三次调用都 `OK`，位置还是没变

按下面顺序排查最有效。

### 1. 先看 puller 自己能不能移动

记录：

```javascript
console.log({
  pos: `${puller.pos.roomName}:${puller.pos.x},${puller.pos.y}`,
  fatigue: puller.fatigue,
  activeMove: puller.getActiveBodyparts(MOVE)
});
```

如果 puller 自己因为 fatigue、身体受损或目标格不可进入而没有完成移动，整组 pull 也不会按你的预期推进。

### 2. 确认 target 确实朝 puller 移动

正确的是：

```javascript
target.move(puller);
```

不是让 target 随便朝另一个方向移动，也不是只调用 `pull()` 后什么都不做。

### 3. 检查 puller 的下一格

puller 必须“move elsewhere”。如果它的目标格是墙、不可通过建筑、关闭的敌对 Rampart，或者本 tick 的移动竞争失败，最终位置可能不变。

### 4. 检查是否有多只 Creep 同时争抢格子

协同移动仍然进入 Screeps 的统一移动结算。多个 Creep 同 tick 争抢同一格时，不能只根据单个 `move()` 或 `pull()` 的 `OK` 推断最终结果。

因此生产代码最好把“intent 返回值”和“下一 tick 的实际位置变化”分开记录。

## 一个更稳的单步 helper

下面这个 helper 只负责提交一次 pull 协同，不假装保证最终位移：

```javascript
function schedulePullStep(puller, target, direction) {
  if (!puller || !target) {
    return { ok: false, reason: "missing-creep" };
  }

  if (!puller.pos.isNearTo(target.pos)) {
    return { ok: false, reason: "not-adjacent" };
  }

  const pullerMove = puller.move(direction);
  const pullResult = puller.pull(target);
  const targetMove = target.move(puller);

  return {
    ok:
      pullerMove === OK
      && pullResult === OK
      && targetMove === OK,
    pullerMove,
    pullResult,
    targetMove
  };
}
```

调用：

```javascript
const result = schedulePullStep(
  Game.creeps.Puller,
  Game.creeps.Target,
  TOP
);

console.log(result);
```

这里的 `ok` 只表示**三次 intent 都成功安排**。如果你要确认本 tick 的实际拉动是否完成，下一 tick 还要比较两只 Creep 的位置。

如果下一步方向来自寻路，可以先用 [PathFinder.search() 判断完整路径](/blog/screeps-pathfinder-search)，再把当前第一步方向交给这个 helper。不要把整条 PathFinder 路径直接当成 pull 协调本身。

## 什么时候适合使用 `Creep.pull()`

它适合解决的是“两只 Creep 必须作为一组移动”的问题，例如：

- 把缺少有效 `MOVE` 的己方 Creep 带到目标附近；
- 让专门的 mover 帮另一个高重量 Creep 移动；
- 在你明确控制双方 intent 的系统里做成对移动。

它不适合替代：

- 普通单 Creep 的 `moveTo()`；
- `PathFinder.search()`；
- 房间级路线规划；
- 拥堵系统本身。

如果只是一个 Creep 移动异常，优先诊断正常移动链；只有当任务本身确实需要两只 Creep 同 tick 协作时，再引入 pull。

## 最后记住四件事

1. `Creep.pull()` 是**协同移动关系**，不是自动跟随命令；
2. 一次典型 pull 需要 `puller.move(...)`、`puller.pull(target)`、`target.move(puller)` 三个 intent；
3. target 移动产生的 fatigue 转移给 puller，puller 承担这次协同移动的主要移动压力；
4. `OK` 只代表 intent 被成功安排，最终位置要到下一 tick 再验证。

## 官方资料

- [Creep.pull() API](https://docs.screeps.com/api/#Creep.pull)
- [Creep.move() API](https://docs.screeps.com/api/#Creep.move)
