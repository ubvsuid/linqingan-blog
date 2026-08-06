---
title: "Screeps Creep 生成完成却出不来：Spawn 出口方向、占位与 directions 排查"
description: "排查 Creep 生成进度结束后仍停在 Spawn 内的问题：检查八个相邻格的地形、阻挡建筑、Construction Site、Creep 占位与方向顺序，并用 spawnCreep directions、setDirections() 和跨 tick 观察验证真实出生位置。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "Spawn"
  - "Creep"
  - "移动"
  - "错误排查"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
  testedAt: "2026-08-06"
  testEnvironment: "Node.js 22 离线模拟（方向归一化、稳定阻挡、临时占位、优先级、完成重试与出生观察状态；不是 Screeps 官方服务器）"
  testResult: "文章 JavaScript 代码块通过语法检查；53 个离线方向规划与观察断言通过。真实 Spawn、移动竞争、敌对单位 spawnstomp 与官方 shard 出生结算仍待验证。"
featured: false
---

`spawnCreep()` 已经返回 `OK`，`spawn.spawning.remainingTime` 也接近结束，但新 Creep 迟迟没有正常离开 Spawn，通常不是身体、名称或 Energy 参数问题，而是**出生出口格在结算时不可用**。

本文解决的搜索意图与 [spawnCreep() 返回码排查](/blog/screeps-spawncreep-return-codes) 不同：

- 返回码文章处理“为什么生成请求没有被接受”；
- 本文处理“生成请求已经接受，为什么完成阶段仍在等待出口”。

也不要把它与 [moveTo() 返回 OK 但不移动](/blog/screeps-moveto-not-moving) 混在一起。Creep 还处于 `spawning` 状态时，问题发生在出生结算；Creep 已经出生并开始运行角色代码后，才进入普通移动诊断。

## 快速结论

可靠的排查顺序是：

```text
确认 spawnCreep() 的正式返回值为 OK
→ 保存 Creep 名称、Spawn ID 和本次 directions
→ 检查 Spawn 周围八个方向
→ 区分永久阻挡与临时占位
→ 生成前按优先级传入 directions
→ 临近完成时可用 setDirections() 刷新顺序
→ 连续多个 tick 观察 spawn.spawning
→ Creep 出生后验证真实相邻方向
```

关键点有三个：

1. `directions` 是**允许尝试的有序方向列表**，不是清除障碍物的命令；
2. 地形墙和阻挡建筑属于稳定问题，Creep 或 Power Creep 占位通常属于临时问题；
3. `OK` 只证明当前调用被接受，不能证明 Creep 已经成功出现在某个出口格。

## Spawn 周围的八个方向

Screeps 方向常量按顺时针排列：

```js
const ALL_SPAWN_DIRECTIONS = [
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT
];

const SPAWN_DIRECTION_OFFSETS = {
  [TOP]: [0, -1],
  [TOP_RIGHT]: [1, -1],
  [RIGHT]: [1, 0],
  [BOTTOM_RIGHT]: [1, 1],
  [BOTTOM]: [0, 1],
  [BOTTOM_LEFT]: [-1, 1],
  [LEFT]: [-1, 0],
  [TOP_LEFT]: [-1, -1]
};
```

如果没有传入 `directions`，引擎会按默认方向集合寻找可用格。如果传入了数组，引擎会按该数组顺序检查。空数组、越界数字、小数或其他非法方向不应进入生产请求。

先把玩家配置归一化，并把未指定方向作为后备方向追加到末尾：

```js
function normalizeSpawnDirections(input) {
  const preferred = Array.isArray(input)
    ? input
    : [];

  const valid = [];
  const seen = new Set();

  for (const direction of preferred) {
    if (
      Number.isInteger(direction)
      && direction >= TOP
      && direction <= TOP_LEFT
      && !seen.has(direction)
    ) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  for (const direction of ALL_SPAWN_DIRECTIONS) {
    if (!seen.has(direction)) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  return valid;
}
```

这样可以保留道路或物流布局的优先出口，同时避免因为配置只写了一个方向而永久忽略其他可用格。

## 永久阻挡与临时占位必须分开

Spawn 出生结算不仅看地形。固定建筑、部分 Construction Site、Creep 占位以及同 tick 移动竞争都可能影响出口。

对玩家代码而言，可以先做一个保守诊断快照：

```js
function structureBlocksSpawnExit(structure) {
  if (structure.structureType === STRUCTURE_RAMPART) {
    return !structure.my && !structure.isPublic;
  }

  return OBSTACLE_OBJECT_TYPES.includes(
    structure.structureType
  );
}

function constructionSiteBlocksSpawnExit(site) {
  return OBSTACLE_OBJECT_TYPES.includes(
    site.structureType
  );
}

function inspectSpawnExitTile(spawn, direction) {
  const offset = SPAWN_DIRECTION_OFFSETS[direction];

  if (!offset) {
    return {
      direction,
      status: 'direction-invalid',
      stablePassable: false,
      currentlyOpen: false
    };
  }

  const x = spawn.pos.x + offset[0];
  const y = spawn.pos.y + offset[1];

  if (x < 0 || x > 49 || y < 0 || y > 49) {
    return {
      direction,
      x,
      y,
      status: 'outside-room',
      stablePassable: false,
      currentlyOpen: false
    };
  }

  const structures = spawn.room.lookForAt(
    LOOK_STRUCTURES,
    x,
    y
  );
  const sites = spawn.room.lookForAt(
    LOOK_CONSTRUCTION_SITES,
    x,
    y
  );
  const creeps = spawn.room.lookForAt(
    LOOK_CREEPS,
    x,
    y
  );
  const powerCreeps = spawn.room.lookForAt(
    LOOK_POWER_CREEPS,
    x,
    y
  );

  const hasRoad = structures.some(
    structure =>
      structure.structureType === STRUCTURE_ROAD
  );
  const terrain = spawn.room
    .getTerrain()
    .get(x, y);
  const terrainBlocked =
    (terrain & TERRAIN_MASK_WALL) !== 0
    && !hasRoad;
  const structureBlocked = structures.some(
    structureBlocksSpawnExit
  );
  const siteBlocked = sites.some(
    constructionSiteBlocksSpawnExit
  );
  const occupied =
    creeps.length > 0
    || powerCreeps.length > 0;

  const stablePassable =
    !terrainBlocked
    && !structureBlocked
    && !siteBlocked;

  return {
    direction,
    x,
    y,
    status: !stablePassable
      ? 'stable-obstacle'
      : occupied
        ? 'temporarily-occupied'
        : 'open-now',
    stablePassable,
    currentlyOpen: stablePassable && !occupied,
    occupantNames: [
      ...creeps.map(creep => creep.name),
      ...powerCreeps.map(creep => creep.name)
    ]
  };
}
```

这只是脚本可见快照，不是引擎内部移动预约表。某个格当前看起来为空，也可能在该 tick 的移动结算中被其他单位争用；反过来，当前被占用的格也可能在 Creep 完成生成前腾空。

因此，不能把“当前有 Creep”与“永久不可出生”画等号。

## 生成一个不会丢失后备方向的出口计划

稳定阻挡方向应排除；当前空闲方向应排在临时占位方向前面；同一组内保持玩家配置顺序：

```js
function planSpawnExitDirections(
  spawn,
  preferredDirections
) {
  const ordered = normalizeSpawnDirections(
    preferredDirections
  );
  const snapshots = ordered.map(direction =>
    inspectSpawnExitTile(spawn, direction)
  );

  const stable = snapshots.filter(
    item => item.stablePassable
  );
  const open = stable.filter(
    item => item.currentlyOpen
  );
  const occupied = stable.filter(
    item => !item.currentlyOpen
  );

  return {
    status: stable.length === 0
      ? 'no-stable-exit'
      : open.length === 0
        ? 'temporary-occupancy-only'
        : 'exit-plan-ready',
    directions: [
      ...open,
      ...occupied
    ].map(item => item.direction),
    snapshots
  };
}
```

为什么仍然把“临时占位但稳定可走”的方向放在数组尾部？

因为 `directions` 会在真正出生结算时使用，而不是只在规划函数运行时使用。一个 Hauler 现在站在出口格，不代表它在几十个生成 tick 后仍然在那里。直接删除所有当前占位方向，可能把一个本来会及时腾空的出口永久排除在本次生成之外。

## 把同一个计划用于 dryRun 和正式提交

`dryRun` 与正式提交必须使用同一份 body、名称、Memory 和方向数组。不要预检一套参数，正式调用时又重新计算另一套方向。

```js
function submitSpawnWithExitPlan({
  spawn,
  body,
  name,
  memory,
  preferredDirections
}) {
  if (!spawn?.my) {
    return {
      status: 'owned-spawn-required',
      result: null
    };
  }

  const plan = planSpawnExitDirections(
    spawn,
    preferredDirections
  );

  if (plan.directions.length === 0) {
    return {
      status: plan.status,
      result: null,
      plan
    };
  }

  const options = {
    memory,
    directions: plan.directions
  };
  const dryRunResult = spawn.spawnCreep(
    body,
    name,
    {
      ...options,
      dryRun: true
    }
  );

  if (dryRunResult !== OK) {
    return {
      status: 'dry-run-rejected',
      result: dryRunResult,
      plan
    };
  }

  const result = spawn.spawnCreep(
    body,
    name,
    options
  );

  Memory.spawnExitChecks ??= {};
  Memory.spawnExitChecks[name] = {
    spawnId: spawn.id,
    name,
    submittedAt: Game.time,
    directions: [...plan.directions],
    result,
    lastObservedAt: Game.time,
    nearCompleteTicks: 0
  };

  return {
    status: result === OK
      ? 'spawn-scheduled'
      : 'spawn-submit-rejected',
    result,
    plan
  };
}
```

正式结果仍可能与 `dryRun` 不同，因为同一 tick 中其他模块可能先使用了 Spawn、名称或 Energy。必须保存正式返回值。

## 临近完成时用 setDirections() 刷新顺序

如果生成时间很长，提交时“当前空闲”的出口在完成时可能已经被占用。`StructureSpawn.Spawning.setDirections()` 可以更新仍在进行中的生成过程所使用的方向顺序。

```js
function refreshSpawnExitDirections(
  spawn,
  preferredDirections,
  refreshAtRemainingTime = 3
) {
  if (!spawn?.spawning) {
    return {
      status: 'no-active-spawn',
      result: null
    };
  }

  if (
    !Number.isInteger(refreshAtRemainingTime)
    || refreshAtRemainingTime < 0
  ) {
    return {
      status: 'refresh-threshold-invalid',
      result: null
    };
  }

  if (
    spawn.spawning.remainingTime
    > refreshAtRemainingTime
  ) {
    return {
      status: 'refresh-not-due',
      result: null
    };
  }

  const plan = planSpawnExitDirections(
    spawn,
    preferredDirections
  );

  if (plan.directions.length === 0) {
    return {
      status: plan.status,
      result: null,
      plan
    };
  }

  const result = spawn.spawning.setDirections(
    plan.directions
  );

  return {
    status: result === OK
      ? 'directions-refresh-accepted'
      : 'directions-refresh-rejected',
    result,
    plan
  };
}
```

这个方法只改变方向列表。它不会移动堵路 Creep、删除建筑，也不会保证下一次结算一定成功。

把刷新调用集中到一个 Spawn 调度器中。多个模块同 tick 反复修改方向，会让最终顺序取决于模块执行次序，诊断记录也会失去意义。

## 怎样确认“完成阶段正在重试”

官方引擎的公开源码会在完成阶段尝试把 Creep 放到允许方向中的第一个可用格。如果没有成功放出，会保留生成状态并把完成检查推迟到后续 tick。

玩家代码不应只观察一次 `remainingTime`。保存连续观察：

```js
function observeSpawnExit(name) {
  Memory.spawnExitChecks ??= {};
  const record = Memory.spawnExitChecks[name];

  if (!record) {
    return {
      status: 'spawn-exit-record-missing'
    };
  }

  const spawn = Game.getObjectById(
    record.spawnId
  );
  const creep = Game.creeps[name];

  if (
    spawn?.spawning
    && spawn.spawning.name === name
  ) {
    const nearComplete =
      spawn.spawning.remainingTime <= 1;

    record.nearCompleteTicks = nearComplete
      ? (record.nearCompleteTicks ?? 0) + 1
      : 0;
    record.lastObservedAt = Game.time;
    record.lastRemainingTime =
      spawn.spawning.remainingTime;

    return {
      status: record.nearCompleteTicks >= 2
        ? 'completion-retry-observed'
        : 'still-spawning',
      remainingTime:
        spawn.spawning.remainingTime,
      nearCompleteTicks:
        record.nearCompleteTicks
    };
  }

  if (creep?.spawning) {
    return {
      status: 'creep-still-inside-spawn'
    };
  }

  if (creep && spawn) {
    const dx = creep.pos.x - spawn.pos.x;
    const dy = creep.pos.y - spawn.pos.y;
    const direction = Object.entries(
      SPAWN_DIRECTION_OFFSETS
    ).find(([, offset]) =>
      offset[0] === dx
      && offset[1] === dy
    )?.[0];

    return {
      status: direction
        ? 'born-on-observable-adjacent-tile'
        : 'born-but-exit-direction-missed',
      direction: direction
        ? Number(direction)
        : null,
      wasPlanned: direction
        ? record.directions.includes(
            Number(direction)
          )
        : null
    };
  }

  if (creep && !spawn) {
    return {
      status: 'born-but-spawn-missing',
      direction: null,
      wasPlanned: null
    };
  }

  return {
    status: 'completion-unverified',
    lastObservedAt: record.lastObservedAt
  };
}
```

`completion-retry-observed` 是基于连续近完成状态的诊断标签，不是官方 API 返回码。它说明你确实观察到生成过程没有立即结束，但不能单凭它断言是哪一个具体格、哪一个移动意图或哪一个单位造成阻塞。

## 为什么出生后不一定还能看到出口方向

Creep 成功出生后，你的主循环可能立刻给它下达移动命令。等你下一次查看时，它可能已经不在 Spawn 相邻格。

因此，证据窗口应尽量靠近出生 tick：

- 保存 Spawn ID 与 Creep 名称；
- 连续观察 `spawn.spawning.name`；
- Creep 首次出现且 `spawning === false` 时立即记录位置；
- 如果已经离开 Range 1，只能记录“已出生，但出生方向错过观察”；
- 不要根据更晚的位置反推出最初出生方向。

## 常见错误

### 只允许一个方向

```js
directions: [RIGHT]
```

如果 RIGHT 是物流道路还好；如果该格临时被占用，本次出生只能等待。除非布局确实要求单出口，否则应追加安全后备方向。

### 把所有当前占位格永久删除

生成可能持续几十甚至上百 tick。当前占位不等于完成时仍占位。应把临时占位方向排到后面，而不是与地形墙一起永久排除。

### 每个角色模块都调用 setDirections()

最后一次调用会决定当前生成过程的方向列表。应由一个 Spawn 协调器集中处理。

### 把 OK 写成“出生成功”

`spawnCreep() === OK` 表示生成请求已安排；`setDirections() === OK` 表示方向更新请求已接受。真实出生位置仍要在后续 tick 观察。

### Creep 已出生仍继续排查 Spawn 出口

如果 `creep.spawning === false`，且角色代码已经开始运行，应转到 [moveTo() 不移动排查](/blog/screeps-moveto-not-moving) 或 [ERR_NO_PATH 排查](/blog/screeps-err-no-path)。

## 生产接入建议

第一版只需要四个边界：

1. 一个函数检查八个出口快照；
2. 一个函数生成稳定、确定的方向顺序；
3. 一个 Spawn 调度器负责正式生成和临近完成刷新；
4. 一个短期记录负责跨 tick 验证。

不要一开始就自动拆除建筑、强制移动所有相邻 Creep，或为每个角色维护不同方向算法。先把“稳定阻挡”“临时占位”“方向请求”“实际出生证据”分开记录，才能知道真正需要修改的是布局、交通还是 Spawn 调度。

## 验证边界

本次文章完成了：

- 官方 API 与公开引擎源码核对；
- JavaScript 语法检查；
- 53 个离线方向规划和观察断言；
- Canonical、双语映射、搜索发现与结构化数据的仓库门禁设计。

仍然待验证：

- 真实 Screeps Console 输出；
- 官方 shard 上连续完成重试；
- 同 tick 多 Creep 移动竞争；
- Power Creep 与敌对单位占位；
- 敌对单位 spawnstomp；
- 真实截图和长时间生产运行数据。

## 官方文档

- [StructureSpawn.spawnCreep()](https://docs.screeps.com/api/#StructureSpawn.spawnCreep)
- [StructureSpawn.Spawning](https://docs.screeps.com/api/#StructureSpawn.Spawning)
- [StructureSpawn.Spawning.setDirections()](https://docs.screeps.com/api/#StructureSpawn.Spawning.setDirections)
- [Screeps game loop](https://docs.screeps.com/scripting-basics.html)
