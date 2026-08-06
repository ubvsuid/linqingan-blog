---
title: "Screeps Spawn 出口被堵怎么办：directions、出生阻塞与自动疏通"
description: "当 Creep 的孵化时间已经结束但 Spawn 仍保持 spawning 状态时，检查八个相邻格的地形、建筑、工地和交通占用，正确使用 directions 与 setDirections，并建立不会误取消孵化的自动疏通与限频日志。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "Spawn"
  - "错误排查"
  - "运行诊断"
  - "自动化"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
---

Spawn 已经把身体部件全部孵化完，但新 Creep 迟迟没有离开，`spawn.spawning` 也一直不是 `null`。这通常不是 Energy 不足，也不是 `spawnCreep()` 再次返回了错误，而是 **允许的出生方向里没有可用相邻格**。

处理顺序应当是：

1. 确认孵化计时是否真的已经结束；
2. 读取当前 `spawn.spawning.directions`；
3. 检查 Spawn 周围八格的地形、建筑、工地和 Creep；
4. 区分“当前看起来被占用”和“长期不可通行”；
5. 有空位时调整当前孵化对象的方向；
6. 没有空位时疏散己方阻塞者，而不是取消孵化；
7. 在下一 tick 验证 Creep 是否真正完成出生。

## 快速判断是不是出口阻塞

```js
function getSpawnStatus(spawn) {
  if (!spawn) {
    return {
      status: 'spawn-missing'
    };
  }

  if (!spawn.spawning) {
    return {
      status: 'idle'
    };
  }

  return {
    status: spawn.spawning.remainingTime <= 0
      ? 'egress-pending'
      : 'spawning',
    creepName: spawn.spawning.name,
    needTime: spawn.spawning.needTime,
    remainingTime: spawn.spawning.remainingTime,
    directions: [...spawn.spawning.directions]
  };
}
```

当结果是：

```text
status = egress-pending
remainingTime = 0
spawn.spawning 仍然存在
```

就应优先检查出生出口，而不是继续检查身体价格或房间 Energy。

## 先区分四种相似现象

### `spawnCreep()` 请求没有成功

如果调用直接返回：

```text
ERR_BUSY
ERR_NOT_ENOUGH_ENERGY
ERR_NAME_EXISTS
ERR_INVALID_ARGS
```

这是创建请求阶段的问题，应先处理返回码。参见 [Screeps spawnCreep() 返回码怎么排查](/blog/screeps-spawncreep-return-codes)。

### Spawn 正在正常孵化

当：

```js
spawn.spawning.remainingTime > 0
```

说明孵化计时还没有结束。身体每个部件需要时间，不能把正常的等待误判成出口阻塞。

### 孵化计时结束，但 Creep 还没有离开

当：

```js
spawn.spawning.remainingTime <= 0
```

而 `spawn.spawning` 仍存在时，才进入本文的出口诊断流程。

### Creep 已经出生，但角色代码没有移动它

如果：

```js
spawn.spawning === null
Game.creeps[name]
Game.creeps[name].spawning === false
```

说明出生已经完成。此时 Creep 停在 Spawn 旁边属于角色调度或移动问题，应继续排查 [moveTo() 返回 OK 但 Creep 不移动](/blog/screeps-moveto-not-moving)。

## `spawn.spawning` 中哪些字段有用

`StructureSpawn.spawning` 在 Spawn 正在处理新 Creep 时是一个对象，否则为 `null`。关键字段包括：

| 字段 | 用途 |
|---|---|
| `name` | 正在孵化的 Creep 名称 |
| `needTime` | 本次孵化总时间 |
| `remainingTime` | 剩余孵化时间 |
| `directions` | 当前允许和优先尝试的出生方向 |
| `spawn` | 对应 Spawn 对象 |

正在孵化的 Creep 也已经可以通过名称访问，但它的：

```js
creep.spawning === true
```

在这个阶段对其执行多数动作会得到 `ERR_BUSY`。不要试图让仍在孵化的 Creep 自己 `move()` 离开 Spawn。

## 为什么出口被堵会让 `spawning` 延长

官方 API 说明 `directions` 用于设置 Creep 生成时移动到的方向。当前公开的 Screeps 引擎实现会在孵化完成时按方向数组检查相邻格：

- 地形是否可通行；
- 是否存在不可通行建筑；
- 是否存在会阻挡的工地；
- 该格是否被当前移动结算占用。

如果找不到可用格，引擎不会把 Spawn 立即设为空闲，而是把完成时间继续向后推，在后续 tick 再尝试。因此你可能连续看到：

```text
remainingTime = 0
spawn.spawning.name 没有变化
Spawn 仍然不能接受下一次孵化
```

这是出口尚未完成，而不是新的 `spawnCreep()` 请求正在反复失败。

## 检查 Spawn 周围八个方向

先建立方向与坐标偏移表：

```js
const DIRECTION_OFFSETS = Object.freeze({
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [RIGHT]: [1, 0],
  [BOTTOM_RIGHT]: [1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_LEFT]: [-1, 1],
  [LEFT]: [-1, 0],
  [TOP_LEFT]: [-1, -1]
});

const ALL_DIRECTIONS = Object.freeze([
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT
]);
```

下面的扫描器只读取当前 tick 能观察到的对象，不提交任何游戏动作：

```js
function getPositionFromDirection(spawn, direction) {
  const offset = DIRECTION_OFFSETS[direction];

  if (!offset) {
    return null;
  }

  const [dx, dy] = offset;
  const x = spawn.pos.x + dx;
  const y = spawn.pos.y + dy;

  if (x < 0 || x > 49 || y < 0 || y > 49) {
    return null;
  }

  return new RoomPosition(
    x,
    y,
    spawn.room.name
  );
}

function structureBlocksMovement(structure) {
  if (
    structure.structureType === STRUCTURE_ROAD
    || structure.structureType === STRUCTURE_CONTAINER
  ) {
    return false;
  }

  if (structure.structureType === STRUCTURE_RAMPART) {
    return !structure.my && !structure.isPublic;
  }

  return OBSTACLE_OBJECT_TYPES.includes(
    structure.structureType
  );
}

function constructionSiteBlocksMovement(site) {
  return OBSTACLE_OBJECT_TYPES.includes(
    site.structureType
  );
}

function inspectSpawnDirection(spawn, direction) {
  const pos = getPositionFromDirection(
    spawn,
    direction
  );

  if (!pos) {
    return {
      direction,
      status: 'outside-room'
    };
  }

  const terrain = spawn.room
    .getTerrain()
    .get(pos.x, pos.y);
  const structures = spawn.room.lookForAt(
    LOOK_STRUCTURES,
    pos.x,
    pos.y
  );
  const sites = spawn.room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    pos.x,
    pos.y
  );
  const creeps = spawn.room.lookForAt(
    LOOK_CREEPS,
    pos.x,
    pos.y
  );
  const powerCreeps = spawn.room.lookForAt(
    LOOK_POWER_CREEPS,
    pos.x,
    pos.y
  );

  const blockers = [];

  if (terrain === TERRAIN_MASK_WALL) {
    blockers.push('terrain-wall');
  }

  for (const structure of structures) {
    if (structureBlocksMovement(structure)) {
      blockers.push(
        'structure:' + structure.structureType
      );
    }
  }

  for (const site of sites) {
    if (constructionSiteBlocksMovement(site)) {
      blockers.push(
        'site:' + site.structureType
      );
    }
  }

  for (const creep of creeps) {
    blockers.push(
      'creep:' + creep.name
    );
  }

  for (const powerCreep of powerCreeps) {
    blockers.push(
      'power-creep:' + powerCreep.name
    );
  }

  return {
    direction,
    x: pos.x,
    y: pos.y,
    status: blockers.length === 0
      ? 'open-in-current-snapshot'
      : 'blocked-in-current-snapshot',
    blockers
  };
}

function inspectSpawnExits(spawn) {
  return ALL_DIRECTIONS.map(direction =>
    inspectSpawnDirection(spawn, direction)
  );
}
```

调用：

```js
const report = inspectSpawnExits(
  Game.spawns.Spawn1
);

console.log(JSON.stringify(report));
```

## “当前快照可用”不等于出生一定成功

公开 API 可以看到当前格上的对象，但不会完整暴露本 tick 所有移动意图的最终冲突结果。

例如：

```text
当前查看时右侧为空
→ 另一只 Creep 同 tick 也准备移动到右侧
→ 移动结算后该格被占用
→ Spawn 本轮仍无法完成出口
```

因此扫描结果应命名为：

```text
open-in-current-snapshot
```

而不是：

```text
guaranteed-free
```

可靠验证必须观察下一 tick：

```js
spawn.spawning === null
Game.creeps[name]?.spawning === false
```

## `directions` 是什么

创建时可以指定出生方向：

```js
const result = spawn.spawnCreep(
  [WORK, CARRY, MOVE],
  'Worker1',
  {
    memory: {
      role: 'worker'
    },
    directions: [
      RIGHT,
      TOP_RIGHT,
      BOTTOM_RIGHT
    ]
  }
);
```

这个数组同时表达：

- 希望优先尝试的顺序；
- 当前孵化允许使用的方向集合。

在当前公开引擎实现中，正常出生搜索会按该数组逐项检查。若你只提供：

```js
[RIGHT]
```

即使左侧为空，右侧长期被堵时也可能继续等待。不要把 `directions` 当成仅用于显示的建议字段。

## 孵化过程中调整方向

当前 Spawn 正在孵化时，可以使用：

```js
spawn.spawning.setDirections([
  RIGHT,
  TOP_RIGHT,
  BOTTOM_RIGHT
]);
```

返回值应单独保存：

```js
const result = spawn.spawning.setDirections(
  directions
);

return {
  status: result === OK
    ? 'directions-submitted'
    : 'directions-rejected',
  result,
  directions
};
```

`OK` 只表示方向修改已经被接受。是否真正从该方向出生，仍要在后续 tick 验证。

## 自动选择当前可用方向

```js
function chooseOpenSpawnDirections(spawn) {
  const allowed = spawn.spawning
    ? [...spawn.spawning.directions]
    : [...ALL_DIRECTIONS];
  const report = allowed.map(direction =>
    inspectSpawnDirection(spawn, direction)
  );
  const openDirections = report
    .filter(item =>
      item.status === 'open-in-current-snapshot'
    )
    .map(item => item.direction);

  return {
    allowed,
    openDirections,
    report
  };
}
```

如果当前允许方向全部被堵，但其他方向存在可用格，可以扩大当前孵化对象的方向集合：

```js
function redirectBlockedSpawn(spawn) {
  if (!spawn.spawning) {
    return {
      status: 'spawn-idle'
    };
  }

  if (spawn.spawning.remainingTime > 0) {
    return {
      status: 'still-spawning',
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  const report = inspectSpawnExits(spawn);
  const openDirections = report
    .filter(item =>
      item.status === 'open-in-current-snapshot'
    )
    .map(item => item.direction);

  if (openDirections.length === 0) {
    return {
      status: 'no-open-direction',
      creepName: spawn.spawning.name,
      report
    };
  }

  const result = spawn.spawning.setDirections(
    openDirections
  );

  return {
    status: result === OK
      ? 'redirect-submitted'
      : 'redirect-failed',
    result,
    creepName: spawn.spawning.name,
    openDirections,
    report
  };
}
```

这个函数不会移动阻塞者，也不会保证同 tick 完成出生。它只把当前快照中可用的方向提交给 Spawn。

## 没有空位时如何疏通己方 Creep

不要让出口管理器随意推动所有相邻 Creep。Spawn 周围可能存在：

- 正在给 Spawn 或 Extension 运能的运输者；
- 准备 `renewCreep()` 的旧 Creep；
- 准备 `recycleCreep()` 的退役 Creep；
- 防御站位；
- 临时经过的交通流。

更安全的策略是给每个阻塞者分配明确的离场位置：

```js
function requestSpawnClearance(
  spawn,
  stagingPositions
) {
  const adjacent = spawn.pos.findInRange(
    FIND_MY_CREEPS,
    1
  );
  const outcomes = [];

  for (const creep of adjacent) {
    if (creep.spawning) {
      continue;
    }

    const target = stagingPositions.find(pos =>
      pos.roomName === creep.room.name
      && !pos.isEqualTo(spawn.pos)
      && pos.getRangeTo(spawn.pos) >= 2
    );

    if (!target) {
      outcomes.push({
        creepName: creep.name,
        status: 'no-staging-position'
      });
      continue;
    }

    const result = creep.moveTo(target, {
      range: 0,
      reusePath: 0,
      maxRooms: 1
    });

    outcomes.push({
      creepName: creep.name,
      status: result === OK
        ? 'clearance-move-submitted'
        : 'clearance-move-failed',
      result,
      target: {
        x: target.x,
        y: target.y,
        roomName: target.roomName
      }
    });
  }

  return outcomes;
}
```

此处的 `OK` 仍然只是移动请求被接受。下一 tick 应再次扫描出口，并确认阻塞者是否真的离开。

## 不要用 `cancel()` 清理出口阻塞

下面的操作会立即取消孵化：

```js
spawn.spawning.cancel();
```

官方 API 明确说明：取消后已经消耗的孵化 Energy 不会返还。

出口暂时被堵时，优先顺序应是：

```text
调整 directions
→ 疏通己方 Creep
→ 移除错误工地或重新设计固定建筑
→ 等待后续 tick 重试
```

而不是：

```text
发现 remainingTime = 0
→ 立即 cancel()
→ 重新花 Energy 孵化
```

只有在 Creep 请求本身已经确定错误，并且你明确接受 Energy 损失时，才考虑取消。

## 限频记录持续阻塞

```js
function logBlockedSpawn(spawn, outcome) {
  Memory.spawnEgress ??= {};
  const state = Memory.spawnEgress[spawn.name]
    ?? {
      firstBlockedAt: null,
      lastLogAt: null,
      blockedTicks: 0
    };

  if (outcome.status !== 'no-open-direction') {
    state.firstBlockedAt = null;
    state.blockedTicks = 0;
    Memory.spawnEgress[spawn.name] = state;

    return {
      status: 'not-blocked'
    };
  }

  state.firstBlockedAt ??= Game.time;
  state.blockedTicks += 1;

  const logDue =
    !Number.isInteger(state.lastLogAt)
    || Game.time - state.lastLogAt >= 20;

  if (logDue) {
    console.log(JSON.stringify({
      type: 'spawn-egress-blocked',
      tick: Game.time,
      spawnName: spawn.name,
      creepName: outcome.creepName,
      firstBlockedAt: state.firstBlockedAt,
      blockedTicks: state.blockedTicks,
      report: outcome.report
    }));

    state.lastLogAt = Game.time;
  }

  Memory.spawnEgress[spawn.name] = state;

  return {
    status: logDue
      ? 'blocked-logged'
      : 'blocked-log-throttled',
    blockedTicks: state.blockedTicks
  };
}
```

只在持续阻塞时输出完整报告，避免每 tick 刷出八个方向的重复日志。

## 完整的出口保护流程

```js
function runSpawnEgressGuard(
  spawn,
  stagingPositions
) {
  if (!spawn?.spawning) {
    return {
      status: 'spawn-idle'
    };
  }

  if (spawn.spawning.remainingTime > 0) {
    return {
      status: 'spawning',
      creepName: spawn.spawning.name,
      remainingTime:
        spawn.spawning.remainingTime
    };
  }

  const redirect = redirectBlockedSpawn(spawn);

  if (redirect.status === 'redirect-submitted') {
    return redirect;
  }

  if (redirect.status !== 'no-open-direction') {
    return redirect;
  }

  const clearance = requestSpawnClearance(
    spawn,
    stagingPositions
  );
  const logResult = logBlockedSpawn(
    spawn,
    redirect
  );

  return {
    status: 'clearance-requested',
    creepName: redirect.creepName,
    clearance,
    logResult,
    report: redirect.report
  };
}
```

调用示例：

```js
module.exports.loop = function () {
  const spawn = Game.spawns.Spawn1;

  if (!spawn) {
    return;
  }

  const stagingPositions = [
    new RoomPosition(
      spawn.pos.x + 2,
      spawn.pos.y,
      spawn.room.name
    ),
    new RoomPosition(
      spawn.pos.x,
      spawn.pos.y + 2,
      spawn.room.name
    )
  ];

  const outcome = runSpawnEgressGuard(
    spawn,
    stagingPositions
  );

  if (
    outcome.status !== 'spawn-idle'
    && outcome.status !== 'spawning'
  ) {
    console.log(JSON.stringify({
      type: 'spawn-egress-guard',
      tick: Game.time,
      spawnName: spawn.name,
      ...outcome
    }));
  }
};
```

真实项目中，离场位置应来自房间布局配置，而不是简单使用 `x + 2` 或 `y + 2`。示例坐标可能落在墙、建筑或房间边界，应先验证。

## 布局层面的长期修复

### 至少保留一个永久出口

不要让八个相邻格全部变成固定不可通行建筑。即使当前通过 `directions` 只使用一条出生通道，也应准备备用方向。

### 固定站位不要占用全部允许方向

Miner、Upgrader、运输者或维修者的固定位置应与 Spawn 出口规划分开。

### 运能路径不要以 Spawn 相邻格作为等待区

运输者可以经过出口，但不应在出口等待下一次任务。等待位应放在范围 2 或更远的位置。

### `renewCreep()` 与孵化必须共享调度

续命要求 Creep 与 Spawn 相邻，而 Spawn 正在孵化时 `renewCreep()` 会受忙碌状态影响。续命站位和出生出口应由同一个 Spawn 调度器协调。

### 多 Spawn 房间分别维护出口策略

不要把整个房间只配置一个方向数组。每个 Spawn 的周边地形、固定建筑和交通方向不同，应按 Spawn ID 或名称保存配置。

## 常见误判

### 看到 `remainingTime = 0` 就认为 Creep 已经出生

还应检查：

```js
spawn.spawning === null
creep.spawning === false
```

### 对仍在孵化的 Creep 调用 `moveTo()`

它的动作通常会返回 `ERR_BUSY`。出生方向由 Spawn 的 `directions` 控制。

### 只检查墙，不检查工地

不可通行建筑的 Construction Site 也可能阻挡出生。

### 只检查当前 Creep，不考虑移动冲突

当前快照中没有 Creep，不代表移动结算时该格一定空闲。

### 为了疏通而取消孵化

`cancel()` 不返还已消耗的孵化 Energy。

### 每 tick 无条件重写方向

方向没有变化时不必重复提交。生产代码可以保存方向签名，只在阻塞状态或可用出口发生变化时更新。

### 把出口阻塞当作房间 Energy 不足

Energy 问题发生在提交孵化请求前；出口阻塞发生在孵化完成阶段。两者的证据不同。

## 建议的排查清单

1. 保存 Spawn 名称、`Game.time` 和正在孵化的 Creep 名称。
2. 确认 `remainingTime <= 0`。
3. 记录 `spawn.spawning.directions`。
4. 扫描八格地形、结构、工地、Creep 和 Power Creep。
5. 判断允许方向是否过窄。
6. 使用 `setDirections()` 提交当前可用方向。
7. 对己方阻塞者提交明确的离场动作。
8. 不要自动调用 `cancel()`。
9. 下一 tick 检查 `spawn.spawning === null`。
10. 记录阻塞持续时间，而不是每 tick 重复打印全部对象。

## 验证状态与适用边界

仓库会对本文 JavaScript 代码块执行 Node.js 语法检查，并通过离线用例检查方向排序、阻塞分类、重定向决策和限频状态。该检查不能模拟 Screeps 服务器的真实移动结算、敌对单位出生覆盖、Power 效果、多个 Spawn 的同 tick 竞争或真实 CPU 成本。

本文适用于：

- 孵化计时结束后 `spawn.spawning` 持续存在；
- 固定布局导致出生方向不足；
- 运输者或续命 Creep 占用 Spawn 周围格；
- `directions` 设置过窄；
- 需要对出生阻塞做限频诊断；
- 多 Spawn 房间的出口协调。

本文不替代：

- `spawnCreep()` 返回码处理；
- 房间 Energy 供能诊断；
- 普通 Creep 移动与疲劳诊断；
- Spawn 队列优先级；
- 真实服务器上的多 tick 验证。

## 相关站内内容

- [Screeps spawnCreep() 返回码怎么排查](/blog/screeps-spawncreep-return-codes)
- [Screeps 房间 EnergyAvailable 一直上不去怎么办](/blog/screeps-room-energyavailable-stuck)
- [Screeps 如何提前生成替代 Creep](/blog/screeps-creep-prespawn-replacement)
- [房间断代后如何生成应急 Harvester](/blog/screeps-spawn-emergency-recovery)
- [Screeps renewCreep() 怎么续命](/blog/screeps-spawn-renew-creep)
- [Screeps recycleCreep() 怎么回收](/blog/screeps-spawn-recycle-creep)
- [moveTo() 返回 OK 但 Creep 不移动怎么办](/blog/screeps-moveto-not-moving)

## 官方与源码资料

- [StructureSpawn.spawnCreep() API](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [StructureSpawn.Spawning API](https://docs.screeps.com/api/#StructureSpawn.Spawning)
- [Creep.spawning API](https://docs.screeps.com/api/#Creep.spawning)
- [Screeps Debugging](https://docs.screeps.com/debugging.html)
- [Screeps Engine: Spawn exit resolution](https://github.com/screeps/engine/blob/master/src/processor/intents/spawns/_born-creep.js)
- [Screeps Engine: Spawn tick processing](https://github.com/screeps/engine/blob/master/src/processor/intents/spawns/tick.js)
