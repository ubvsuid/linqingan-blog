---
title: "PathFinder CostMatrix 怎么设置道路、障碍和高成本格子"
description: "解释 CostMatrix 中 0、普通成本和 255 的含义，在 roomCallback 中处理道路、建筑、Creep 与自定义避让格，并检查 PathFinder.search 的完整结果。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "PathFinder"
  - "寻路"
  - "CostMatrix"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（格子成本分类与覆盖顺序，不是 Screeps 官方服务器）"
  testResult: "道路、可穿越结构、不可穿越结构、自定义高成本格和坐标边界场景通过。"
featured: false
---

`PathFinder.CostMatrix` 不会移动 Creep，也不会替你决定业务目标。它只告诉 `PathFinder.search()`：某个房间里的哪些格子应使用地形成本，哪些格子更便宜、更昂贵或完全不可走。

本文只解决一个问题：怎样在 `roomCallback` 中构造可检查的 CostMatrix，并正确处理道路、建筑、其他 Creep、自定义避让格和没有视野的房间。

## 先理解 CostMatrix 的三个层级

| 写入值 | PathFinder 怎样处理 | 常见用途 |
|---:|---|---|
| `0` | 使用该格子的默认地形成本 | 不做额外覆盖 |
| `1`—`254` | 使用写入的自定义成本 | 道路、拥堵区、危险区 |
| `255` | 视为不可走 | 墙体、不可穿越建筑、临时封锁 |

`0` 不是“零成本”。它表示“不要覆盖地形成本”。

官方文档还提醒，应避免无意义地把所有数值整体放大。例如 `plainCost: 1, swampCost: 5` 与 `plainCost: 2, swampCost: 10` 可能得到相同路线，但较小数值通常更合适。

## CostMatrix 不会自动包含建筑和 Creep

`PathFinder` 默认只认识地形。道路、Spawn、Extension、Rampart、Container 和 Creep 是否可走，需要由你写入矩阵。

常见规则是：

- 道路成本设为 `1`，让它低于示例中的普通地面成本 `2`；
- Container 可以站立，不标记为障碍；
- 己方 Rampart 可以站立；
- 其他不可穿越建筑写入 `255`；
- 其他 Creep 可以临时写入 `255`，但这会让矩阵每 tick 变化；
- 想尽量绕开的格子写入中等成本，而不是直接封死。

这些是本文的实现策略，不是所有房间都必须照搬的固定规则。

## `roomCallback` 的返回值不能混淆

`roomCallback(roomName)` 在一次搜索中，每个房间最多调用一次。

它可以返回：

| 返回值 | 含义 |
|---|---|
| `CostMatrix` | 使用自定义成本搜索这个房间 |
| `undefined` | 没有自定义矩阵，继续按地形搜索 |
| `false` | 完全禁止搜索这个房间 |

没有房间视野时直接返回 `false`，会把所有不可见房间都当成禁区。跨房间搜索通常应区分：

```js
if (blockedRooms.has(roomName)) {
  return false;
}

const room = Game.rooms[roomName];
if (!room) {
  return undefined;
}
```

只有明确禁止进入的房间才返回 `false`。

## 完整示例

代码放在 `main` 模块。把 Creep 名称、Flag 名称和 `Memory.blockedRooms` 改成自己的配置。

```js
function isValidRoomCoordinate(value) {
  return Number.isInteger(value) && value >= 0 && value <= 49;
}

function getStructureCost(structure) {
  if (structure.structureType === STRUCTURE_ROAD) {
    return 1;
  }

  if (structure.structureType === STRUCTURE_CONTAINER) {
    return 0;
  }

  if (
    structure.structureType === STRUCTURE_RAMPART
    && structure.my === true
  ) {
    return 0;
  }

  return 255;
}

function buildCostMatrix(room, movingCreepId) {
  const costs = new PathFinder.CostMatrix();
  const structures = room.find(FIND_STRUCTURES);

  for (const structure of structures) {
    const cost = getStructureCost(structure);
    if (cost > 0) {
      costs.set(structure.pos.x, structure.pos.y, cost);
    }
  }

  const creeps = room.find(FIND_CREEPS);
  for (const other of creeps) {
    if (other.id !== movingCreepId) {
      costs.set(other.pos.x, other.pos.y, 255);
    }
  }

  const customAvoid = Array.isArray(room.memory.trafficAvoid)
    ? room.memory.trafficAvoid
    : [];

  for (const item of customAvoid) {
    if (
      !item
      || !isValidRoomCoordinate(item.x)
      || !isValidRoomCoordinate(item.y)
    ) {
      continue;
    }

    const current = costs.get(item.x, item.y);
    if (current < 255) {
      costs.set(item.x, item.y, Math.max(current, 20));
    }
  }

  return costs;
}

module.exports.loop = function () {
  const creep = Game.creeps.Worker1;
  const target = Game.flags.PathTarget;

  if (!creep || !target) {
    return;
  }

  const blockedRooms = new Set(
    Array.isArray(Memory.blockedRooms)
      ? Memory.blockedRooms
      : []
  );

  const search = PathFinder.search(
    creep.pos,
    { pos: target.pos, range: 1 },
    {
      plainCost: 2,
      swampCost: 10,
      maxOps: 4000,
      maxRooms: 8,
      roomCallback(roomName) {
        if (blockedRooms.has(roomName)) {
          return false;
        }

        const room = Game.rooms[roomName];
        if (!room) {
          return undefined;
        }

        return buildCostMatrix(room, creep.id);
      }
    }
  );

  if (search.incomplete || search.path.length === 0) {
    if (Game.time % 100 === 0) {
      console.log({
        type: 'path-search-incomplete',
        creep: creep.name,
        targetRoom: target.pos.roomName,
        pathLength: search.path.length,
        operations: search.ops,
        cost: search.cost
      });
    }
    return;
  }

  const result = creep.moveByPath(search.path);

  if (result !== OK && Game.time % 20 === 0) {
    console.log({
      type: 'move-by-path-failed',
      creep: creep.name,
      result
    });
  }
};
```

## 为什么目标使用 `range: 1`

Flag 所在格通常可以站立，但本文仍使用 `range: 1`，目的是演示“到达目标附近”而不是强制站到目标格。

对于 Source、Mineral、Controller 和大多数建筑，目标格本身不能站立。若仍使用默认 `range: 0`，PathFinder 会尝试寻找一个无法完成的目标，增加搜索操作并可能返回 `incomplete: true`。

目标是否可站立，应在设置 `range` 时明确决定。

## 为什么不把所有己方 Creep 永久写进缓存

建筑变化较慢，适合缓存一份“静态矩阵”；Creep 位置每 tick 都可能变化。

把动态 Creep 直接写进长期缓存会产生陈旧障碍：

1. 某个 Creep 离开后，旧格子仍然被标记为不可走；
2. 新 Creep 进入的格子没有被标记；
3. 多个 Creep 可能因为相同陈旧矩阵绕远；
4. 缓存失效条件变得难以判断。

更稳妥的设计是：

```text
静态层
地形策略 + 建筑 + 固定危险格

动态层
当前 Creep + 临时封锁 + 当 tick 交通状态
```

先恢复或构造静态矩阵，再 `clone()` 一份用于叠加动态成本。本文为了保持示例完整，选择每次直接构造，没有实现跨 tick 缓存。

## `search.path` 有内容也不代表搜索完整

`PathFinder.search()` 返回：

- `path`：路径位置数组；
- `ops`：搜索操作数量；
- `cost`：路径总成本；
- `incomplete`：是否未找到完整路径。

当 `incomplete` 为 `true` 时，`path` 仍可能包含一段“目前能找到的最近路径”。因此不能只检查：

```js
search.path.length > 0
```

需要同时判断 `search.incomplete`。

`maxOps`、`maxRooms`或`maxCost`过低，都可能让搜索提前结束。调大限制可能增加CPU消耗，所以应先检查房间封锁、目标范围和矩阵内容，而不是立即无限放大参数。

## `moveByPath()` 仍可能失败

搜索成功和移动命令成功是两个阶段。

`moveByPath()`可能返回：

| 返回值 | 常见原因 |
|---|---|
| `OK` | 移动命令已提交 |
| `ERR_NOT_FOUND` | 路径与当前Creep位置不匹配 |
| `ERR_INVALID_ARGS` | 路径格式不正确 |
| `ERR_TIRED` | Creep当前有fatigue |
| `ERR_NO_BODYPART` | 没有可用的MOVE部件 |
| `ERR_BUSY` | Creep仍在生成 |

`OK`只表示当前命令被接受，不证明整条路径以后每一步都能走通。

## 自定义高成本格不要覆盖不可走格

示例先读取当前成本：

```js
const current = costs.get(item.x, item.y);
```

只有当前值小于 `255`，才写入自定义成本。这样不会把原本不可穿越的建筑从 `255`降成 `20`。

坐标也必须限制在 `0`—`49`。来自 Memory 或外部配置的数据不能假设永远合法。

## 怎样缓存 CostMatrix

官方提供：

```js
const serialized = costs.serialize();
const restored = PathFinder.CostMatrix.deserialize(serialized);
```

适合缓存的通常是建筑和固定策略形成的静态矩阵。缓存时还应保存：

- 房间名；
- 数据版本；
- 构造 tick；
- 建筑布局版本或失效标记；
- 是否包含动态对象；
- 使用的策略参数。

没有失效机制的缓存，可能比每次重建更难排查。

## 离线模拟结果

构建检查没有模拟官方 PathFinder，而是把成本分类函数拆出来，覆盖：

1. Road返回成本 `1`；
2. Container返回 `0`；
3. 己方 Rampart返回 `0`；
4. 其他建筑返回 `255`；
5. 自定义避让成本不会覆盖 `255`；
6. 坐标小于 `0`、大于 `49`或不是整数时被拒绝。

这些结果只能证明本文的成本分类和输入保护符合预期，不能证明真实房间一定生成理想路径。

## 常见误区

### 把 `0` 当作免费通行

`0`表示继续使用地形成本，不是零成本。

### 没有视野就返回 `false`

这会把不可见房间完全禁止，而不是使用地形继续搜索。

### 用 `255` 表示“尽量绕开”

`255`是不可走。只想降低优先级时应使用小于255的成本。

### 自定义成本覆盖建筑障碍

后写入的中等成本可能把不可走建筑改成可走。写入前应检查当前值。

### 只看路径长度

部分路径也可能有长度。必须检查 `incomplete`。

### 每个 Creep 都重复构造相同静态矩阵

建筑很多、搜索频繁时，应测量构造成本，再考虑按房间缓存静态矩阵。

## 排查顺序

1. 确认起点、目标和 `range` 是否合理；
2. 检查明确封锁的房间列表；
3. 区分无视野的 `undefined` 与禁用房间的 `false`；
4. 检查建筑成本分类；
5. 检查动态 Creep 是否把关键出口封死；
6. 检查自定义坐标和成本范围；
7. 输出 `incomplete`、`ops`、`cost`和路径长度；
8. 最后再调整 `maxOps`、`maxRooms`或缓存策略。

## 适用边界

本文没有实现：

- 多 Creep 协同交通；
- 长期路径缓存；
- 敌对玩家房间评分；
- Portal路线；
- 跨 shard 路线；
- 战斗单位的伤害场；
- 自动识别所有临时危险区域。

JavaScript语法和成本分类离线模拟已经通过。真实 PathFinder 结果、CPU消耗和多tick交通表现仍待Screeps环境验证。

## 相关站内内容

- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [Game.map.findRoute() 怎么规划跨房间路线](/blog/screeps-map-find-route)
- [RoomPosition 距离方法有什么区别](/blog/screeps-roomposition-distance)
- [Creep 为什么有 fatigue](/blog/screeps-move-fatigue-body-ratio)
- [Screeps 全局缓存为什么会失效](/blog/screeps-global-cache)
- [进入移动、寻路与视野模块](/knowledge/movement-vision)

## 官方资料

- [PathFinder API](https://docs.screeps.com/api/#PathFinder)
- [PathFinder.CostMatrix API](https://docs.screeps.com/api/#PathFinder-CostMatrix)
- [Creep.moveByPath API](https://docs.screeps.com/api/#Creep.moveByPath)

资料核对日期：2026-07-22。离线成本分类已通过；真实路径搜索和移动仍待环境验证。
