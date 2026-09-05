---
title: "Screeps PathFinder.search()：range、返回值与完整路径判断"
description: "正确使用 PathFinder.search() 设置 goal range，读懂 path、cost、ops、incomplete，并判断搜索是否真正完成，而不是只看 path 有没有内容。"
publishedAt: "2026-09-05"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "PathFinder"
  - "寻路"
  - "RoomPosition"
  - "移动"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-09-05"
featured: false
knowledge:
  module: "movement-vision"
  stage: "path-costs"
  order: 35
  difficulty: "intermediate"
seo:
  primaryKeyword: "Screeps PathFinder.search"
  searchIntent: "正确调用 PathFinder.search()，理解 goal range、path、cost、ops、incomplete，并判断搜索是否真正到达目标"
  keywordRole: "owner"
---

`PathFinder.search(origin, goal, opts)` 负责**搜索路径**，不负责让 Creep 移动。它最容易被误用的地方有两个：一是忽略 goal 的 `range`，二是只看 `path.length` 就判断搜索成功。

更可靠的判断顺序是：

```text
定义 origin 和 goal range
→ 执行 PathFinder.search()
→ 检查 incomplete
→ 检查路径终点是否进入 goal range
→ 再决定是否把 path 交给移动逻辑
```

## 最小写法：把目标写成 `pos + range`

例如 Worker 要走到 Source 旁边：

```javascript
const creep = Game.creeps.Worker1;
const source = creep.pos.findClosestByRange(FIND_SOURCES);

if (!source) return;

const goal = {
  pos: source.pos,
  range: 1
};

const result = PathFinder.search(creep.pos, goal);
```

这里 `range: 1` 很重要。Source 所在格不能站立，真正需要到达的是 Source 的相邻格。

如果直接传入 `source.pos`：

```javascript
PathFinder.search(creep.pos, source.pos);
```

这个 `RoomPosition` goal 等价于要求到达目标位置本身，也就是 `range: 0`。对于不可站立的目标，这会把搜索目标设错。

`range` 应该根据后续动作的有效范围决定，而不是固定写成 0 或 1。如果你需要区分 `RoomPosition` 的 range、相邻和路径距离，可以看 [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)。

## `path`、`cost`、`ops`、`incomplete` 分别表示什么

`PathFinder.search()` 最常用的四个返回字段是：

- `path`：搜索得到的 `RoomPosition` 数组；
- `cost`：按地形成本和 CostMatrix 计算出的总路径成本；
- `ops`：本次搜索执行的操作数量；
- `incomplete`：是否没有找到完整路径。

其中最重要的是 `incomplete`。

当 `result.incomplete === true` 时，`result.path` **仍然可能有内容**。这时的 path 可以只是搜索预算内找到的部分路径，所以不能写成：

```javascript
if (result.path.length > 0) {
  // 不能据此认定已经搜索到目标
}
```

更稳的诊断是同时检查 `incomplete` 与终点：

```javascript
const goal = { pos: source.pos, range: 1 };
const result = PathFinder.search(creep.pos, goal);

const end = result.path.length > 0
  ? result.path[result.path.length - 1]
  : creep.pos;

const endInsideGoalRange =
  end.roomName === goal.pos.roomName
  && end.getRangeTo(goal.pos) <= goal.range;

const completed =
  result.incomplete === false
  && endInsideGoalRange;

console.log({
  completed,
  incomplete: result.incomplete,
  pathLength: result.path.length,
  cost: result.cost,
  ops: result.ops
});
```

这样可以把“搜索器是否找到完整路径”和“终点是否真的满足业务目标”分开验证。

## `path` 为空也不一定是失败

如果 Creep 一开始就已经位于 goal range 内，它不需要再走一步。因此 `path.length === 0` 不能单独翻译成“没有路”。

可以先做范围短路：

```javascript
if (creep.pos.inRangeTo(source.pos, 1)) {
  return;
}

const result = PathFinder.search(
  creep.pos,
  { pos: source.pos, range: 1 }
);
```

排错时至少一起看这三个信号：

```text
path.length
incomplete
当前位置或路径终点是否满足 goal range
```

如果已经出现 `ERR_NO_PATH`，可以继续看 [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)。

## `cost` 不等于路径长度

`result.cost` 是路径成本，不是步数。它会受到 `plainCost`、`swampCost` 以及 `roomCallback` 返回的 `CostMatrix` 影响。

因此：

```text
cost ≠ path.length
```

两条路径都可能是 10 步，但经过的地形和自定义成本不同，总 `cost` 就不同。需要自定义道路、障碍或危险格成本时，可以看 [PathFinder CostMatrix 怎么设置](/blog/screeps-pathfinder-costmatrix)。

`cost` 也不等于 Creep 实际移动所需 tick。真实移动还会受到 `MOVE` 比例、fatigue、地形和拥堵影响；相关问题可以看 [Creep fatigue 与 MOVE 比例](/blog/screeps-move-fatigue-body-ratio)。

## `ops` 是搜索工作量，不是 CPU 或步数

`result.ops` 表示 PathFinder 为本次结果执行了多少搜索操作。它不是路径长度，也不是固定换算关系下的 CPU 数值。

官方提供 `maxOps` 限制搜索操作数。限制过低时，搜索可能提前结束并返回 `incomplete: true`。

因此看到较高 `ops` 时，先检查：

- goal 和 `range` 是否合理；
- 是否把不可站立目标写成了 `range: 0`；
- `roomCallback` 是否禁止了必经房间；
- `maxRooms` 或 `maxOps` 是否过低；
- 搜索范围是否本来就很大。

不要把“无限调高 `maxOps`”当成通用修复。

## `incomplete: true` 时按什么顺序排查

建议按下面的顺序：

1. **goal / range**：目标是否真的允许在这个范围内到达；
2. **path 终点**：搜索实际上推进到了哪里；
3. **ops / maxOps**：是否碰到操作预算；
4. **maxRooms**：跨房间搜索范围是否被限制得太小；
5. **maxCost**：是否设置了过紧的总成本上限；
6. **roomCallback**：是否返回 `false` 禁止了必经房间；
7. **CostMatrix**：是否把出口或唯一通道写成 `255`。

特别注意：`roomCallback` 返回 `false` 的意思是**不要搜索这个房间**，不是“这个房间当前没有视野”。

如果没有视野，不应仅因为 `Game.rooms[roomName]` 不存在就自动返回 `false`。主动禁止房间和缺少视野是两种不同情况。

## 多个 goal 也可以一起搜索

`goal` 可以是数组。例如在多个 Source 中寻找当前成本最低的可达位置：

```javascript
const goals = creep.room.find(FIND_SOURCES).map(source => ({
  pos: source.pos,
  range: 1
}));

const result = PathFinder.search(creep.pos, goals);
```

PathFinder 会按当前成本模型选择结果，但“最低路径成本”不等于“最适合业务”。如果目标选择还需要考虑占用、容量、危险度或长期分配，应在寻路之外增加业务筛选。可以继续看 [按路径选择 Source](/blog/screeps-select-source-by-path)。

## 搜索完成，不等于 Creep 已经移动

下面这行代码只计算路径：

```javascript
const result = PathFinder.search(
  creep.pos,
  { pos: target.pos, range: 1 }
);
```

如果要执行第一步，还要另外提交移动 intent：

```javascript
if (!result.incomplete && result.path.length > 0) {
  const nextPos = result.path[0];
  const direction = creep.pos.getDirectionTo(nextPos);
  const moveResult = creep.move(direction);

  if (moveResult !== OK) {
    console.log(`[${creep.name}] move failed: ${moveResult}`);
  }
}
```

要区分两个阶段：

```text
当前 tick：search 计算路径 → move 提交移动 intent
本 tick 结算：游戏处理移动
下一 tick：再读取新的 creep.pos
```

所以 `PathFinder.search()` 返回完整路径，不代表 Creep 已经到达终点；`creep.move()` 返回 `OK` 也只代表移动 intent 被接受。

## `maxOps`、`maxRooms`、`maxCost` 解决不同问题

```javascript
const result = PathFinder.search(
  creep.pos,
  { pos: target.pos, range: 1 },
  {
    maxOps: 4000,
    maxRooms: 8,
    maxCost: 500
  }
);
```

- `maxOps`：限制搜索操作数量；
- `maxRooms`：限制最多搜索多少个房间；
- `maxCost`：限制可接受路径的总成本。

这些限制都可能导致搜索提前结束，所以修改后仍要检查 `incomplete`。如果你首先要决定“经过哪些房间”，而不是逐格寻路，可以看 [Game.map.findRoute() 跨房间路线](/blog/screeps-map-find-route)。

## 一个适合保留的诊断函数

```javascript
function inspectPathSearch(origin, goal, opts = {}) {
  const result = PathFinder.search(origin, goal, opts);
  const end = result.path.length > 0
    ? result.path[result.path.length - 1]
    : origin;

  const insideRange =
    end.roomName === goal.pos.roomName
    && end.getRangeTo(goal.pos) <= goal.range;

  return {
    ...result,
    diagnostic: {
      completed: !result.incomplete && insideRange,
      pathLength: result.path.length,
      end: `${end.roomName}:${end.x},${end.y}`,
      range: goal.range
    }
  };
}
```

这个函数不自动移动，只把最关键的诊断信号放在一起：搜索是否完整、路径多长、终点在哪里、是否进入目标范围。

## 最后记住这四条

1. `PathFinder.search()` **只负责找路，不负责移动**；
2. goal 的关键是 **`pos + 合理的 range`**；
3. `path` 有内容也可能只是部分路径，必须检查 **`incomplete`**；
4. `cost`、`ops`、`path.length` 是三个不同指标，不要互相替代。

如果只保留一组排错输出，建议记录：

```javascript
console.log({
  incomplete: result.incomplete,
  pathLength: result.path.length,
  cost: result.cost,
  ops: result.ops
});
```

再结合起点、终点和 goal `range`，通常就能快速判断问题出在目标定义、搜索预算、房间限制还是成本矩阵。

## 相关站内内容

- [PathFinder CostMatrix 怎么设置](/blog/screeps-pathfinder-costmatrix)
- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [Game.map.findRoute() 怎么规划跨房间路线](/blog/screeps-map-find-route)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [按路径选择 Source](/blog/screeps-select-source-by-path)
- [Creep fatigue 与 MOVE 比例](/blog/screeps-move-fatigue-body-ratio)

## 官方资料

- [PathFinder API](https://docs.screeps.com/api/#PathFinder)
- [RoomPosition API](https://docs.screeps.com/api/#RoomPosition)
