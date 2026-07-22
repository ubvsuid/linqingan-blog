---
title: "Screeps Flag 怎么作为可验证的房间配置入口"
description: "从Game.flags和Flag.memory读取带版本的任务配置，校验Creep名称、任务类型和目标范围，并处理跨房间视野、moveTo返回值与过期Memory。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Flag"
  - "自动化"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Flag任务配置、版本、名称、范围和过期Memory清理，不是Screeps官方服务器）"
  testResult: "Flag缺失、配置关闭、版本不符、任务无效、Creep名称无效、范围越界、合法配置和过期Memory键场景通过。"
featured: false
---

Flag适合充当一种**可以在房间画面中直接移动和观察的配置入口**。它不会替你完成调度，但可以把“目标在哪里”“哪个任务启用”“由哪只Creep执行”集中到一个明确对象上。

本文只解决一个问题：怎样从 `Game.flags` 和 `Flag.memory` 安全读取一个任务配置，并避免因为Flag缺失、房间不可见、配置格式错误或Creep不存在而让主循环报错。

## Flag最适合保存什么

Flag适合保存与一个明确位置相关、并且需要人工调整的少量配置，例如：

- 远程房间入口；
- 建造或维修目标位置；
- 临时集合点；
- 侦察目标；
- 指定Creep的工作位置；
- 某项任务是否启用。

Flag不适合承担完整队列、长期统计、大型路径数据或复杂状态机。那些内容更适合放在独立Memory结构或模块中。

## 三个需要先理解的对象

### `Game.flags`

`Game.flags` 是当前存在的Flag哈希表，键是Flag名称：

```js
const flag = Game.flags.WorkTarget;
```

Flag不存在时会得到 `undefined`，因此不能直接继续读取 `flag.memory` 或 `flag.pos`。

### `Flag.memory`

`Flag.memory` 是 `Memory.flags[flag.name]` 的快捷入口。

```js
flag.memory.enabled = true;
```

它适合保存这个Flag专属的少量配置，但仍然属于Memory数据，需要自行控制字段、版本和清理策略。

### `flag.room`

Flag即使位于当前不可见房间，`flag.pos` 仍然存在；但 `flag.room` 可能是 `undefined`。

因此跨房间任务可以使用：

```js
flag.pos.roomName
```

却不能假设：

```js
flag.room.controller
```

一定安全。

## 建议使用带版本的配置

先在Console中写入：

```js
const flag = Game.flags.WorkTarget;

if (flag) {
  flag.memory.config = {
    version: 1,
    enabled: true,
    task: 'move',
    creepName: 'Worker1',
    range: 0
  };
}
```

字段含义：

| 字段 | 含义 |
|---|---|
| `version` | 当前配置结构版本 |
| `enabled` | 是否启用 |
| `task` | 本文允许的任务类型 |
| `creepName` | 指定Creep名称 |
| `range` | 到Flag多少格时视为到达 |

`version`不是官方要求，而是本站增加的维护字段。以后调整结构时，可以拒绝旧格式而不是静默读取错误字段。

## 用纯函数校验配置

```js
function normalizeFlagTaskConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, reason: 'config-missing' };
  }

  if (raw.version !== 1) {
    return { valid: false, reason: 'version-mismatch' };
  }

  if (raw.enabled !== true) {
    return { valid: false, reason: 'disabled' };
  }

  if (raw.task !== 'move') {
    return { valid: false, reason: 'invalid-task' };
  }

  if (
    typeof raw.creepName !== 'string'
    || raw.creepName.trim().length === 0
  ) {
    return { valid: false, reason: 'invalid-creep-name' };
  }

  const range = raw.range ?? 0;

  if (!Number.isInteger(range) || range < 0 || range > 49) {
    return { valid: false, reason: 'invalid-range' };
  }

  return {
    valid: true,
    reason: 'ready',
    value: {
      task: 'move',
      creepName: raw.creepName.trim(),
      range
    }
  };
}
```

这个函数只验证普通对象，不访问Screeps环境，因此可以离线覆盖所有输入分支。

## 完整示例：让指定Creep移动到Flag

```js
function normalizeFlagTaskConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, reason: 'config-missing' };
  }

  if (raw.version !== 1) {
    return { valid: false, reason: 'version-mismatch' };
  }

  if (raw.enabled !== true) {
    return { valid: false, reason: 'disabled' };
  }

  if (raw.task !== 'move') {
    return { valid: false, reason: 'invalid-task' };
  }

  if (
    typeof raw.creepName !== 'string'
    || raw.creepName.trim().length === 0
  ) {
    return { valid: false, reason: 'invalid-creep-name' };
  }

  const range = raw.range ?? 0;

  if (!Number.isInteger(range) || range < 0 || range > 49) {
    return { valid: false, reason: 'invalid-range' };
  }

  return {
    valid: true,
    reason: 'ready',
    value: {
      task: 'move',
      creepName: raw.creepName.trim(),
      range
    }
  };
}

function runFlagTask(flagName) {
  const flag = Game.flags[flagName];

  if (!flag) {
    return {
      status: 'flag-missing',
      flagName
    };
  }

  const normalized = normalizeFlagTaskConfig(
    flag.memory.config
  );

  flag.memory.lastCheckedAt = Game.time;
  flag.memory.lastStatus = normalized.reason;

  if (!normalized.valid) {
    return {
      status: normalized.reason,
      flagName
    };
  }

  const { creepName, range } = normalized.value;
  const creep = Game.creeps[creepName];

  if (!creep) {
    flag.memory.lastStatus = 'creep-missing';
    return {
      status: 'creep-missing',
      flagName,
      creepName
    };
  }

  if (creep.spawning === true) {
    flag.memory.lastStatus = 'creep-spawning';
    return {
      status: 'creep-spawning',
      flagName,
      creepName
    };
  }

  if (creep.pos.inRangeTo(flag.pos, range)) {
    flag.memory.lastStatus = 'arrived';
    flag.memory.lastArrivedAt = Game.time;
    return {
      status: 'arrived',
      flagName,
      creepName
    };
  }

  const result = creep.moveTo(flag, {
    range,
    reusePath: 10,
    visualizePathStyle: {
      stroke: '#00ff88',
      opacity: 0.55
    }
  });

  flag.memory.lastMoveResult = result;
  flag.memory.lastMoveAt = Game.time;
  flag.memory.lastStatus = result === OK
    ? 'move-accepted'
    : 'move-failed';

  if (
    result !== OK
    && result !== ERR_TIRED
  ) {
    console.log({
      type: 'flag-task-move-failed',
      flagName,
      creepName,
      targetRoom: flag.pos.roomName,
      result
    });
  }

  return {
    status: flag.memory.lastStatus,
    flagName,
    creepName,
    result
  };
}

module.exports.loop = function () {
  runFlagTask('WorkTarget');
};
```

这段代码不读取 `flag.room`，因此Flag位于不可见房间时不会因为房间对象缺失而直接报错。

## `moveTo()`返回值怎样处理

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 移动命令已提交 | 下一tick重新读取位置 |
| `ERR_NOT_OWNER` | Creep不是自己的 | 检查名称和对象来源 |
| `ERR_NO_PATH` | 当前找不到路径 | 检查地形、房间出口和路径配置 |
| `ERR_BUSY` | Creep仍在生成 | 等生成结束 |
| `ERR_NOT_FOUND` | 启用只复用路径但没有缓存路径 | 检查 `noPathFinding` 选项 |
| `ERR_INVALID_TARGET` | Flag或目标对象无效 | 检查Flag是否仍存在 |
| `ERR_TIRED` | Creep当前fatigue不为0 | 等待fatigue恢复 |
| `ERR_NO_BODYPART` | 没有有效MOVE部件 | 检查身体和受伤状态 |

`OK`只表示当前tick安排了移动，不表示Creep已经到达Flag。

## 为什么使用Flag名称而不是扫描全部Flag

下面的写法会让所有Flag都参与任务：

```js
for (const flag of Object.values(Game.flags)) {
  runFlagTask(flag.name);
}
```

当Flag数量增加后，调试Flag、临时标记和任务Flag会混在一起。

更安全的方式是：

- 使用明确名称；
- 或使用固定前缀；
- 或使用颜色和Memory双重分类；
- 每类Flag由独立模块处理。

例如只处理前缀：

```js
const taskFlagNames = Object.keys(Game.flags)
  .filter(name => name.startsWith('TASK_'));
```

前缀属于项目约定，不是官方机制。

## 颜色适合做可见分类，但不能替代校验

Flag有主颜色和次颜色：

```js
flag.color
flag.secondaryColor
```

颜色很适合让人快速分辨：

- 绿色：启用；
- 红色：危险；
- 黄色：等待；
- 蓝色：侦察。

但颜色只是数字常量。代码仍应检查任务类型、配置版本和名称，避免某人手动改色后让完全不同的任务被误执行。

## 移动Flag与修改颜色属于状态操作

`flag.setPosition()` 和 `flag.setColor()` 会安排状态修改，应保存返回值。

```js
const result = flag.setPosition(
  new RoomPosition(20, 20, 'W2N2')
);

console.log('setPosition result:', result);
```

`setPosition()`可能返回：

- `OK`；
- `ERR_INVALID_TARGET`。

`setColor()`可能返回：

- `OK`；
- `ERR_INVALID_ARGS`。

不要在每个tick无条件移动Flag或反复改色。需要自动修改时，应使用一次性请求或先判断当前状态是否已经一致。

## 删除Flag后的Memory清理

本文不依赖游戏是否自动处理旧Memory，而是提供一个明确清理函数，只删除当前项目自己管理的前缀。

```js
function cleanMissingTaskFlagMemory(prefix) {
  const memoryFlags = Memory.flags;

  if (!memoryFlags || typeof memoryFlags !== 'object') {
    return 0;
  }

  let removed = 0;

  for (const name of Object.keys(memoryFlags)) {
    if (!name.startsWith(prefix)) {
      continue;
    }

    if (Game.flags[name]) {
      continue;
    }

    delete memoryFlags[name];
    removed += 1;
  }

  return removed;
}
```

只清理自己的前缀，避免误删其他模块或手工Flag的Memory。

## 常见错误

### Flag不存在时直接读取Memory

错误：

```js
Game.flags.WorkTarget.memory.enabled
```

Flag被删除或改名后会报错。先保存对象并判空。

### 用 `flag.room` 判断目标房间名

不可见房间中的Flag可能没有 `room`，但 `flag.pos.roomName` 仍可用。

### 把Flag当成房间视野来源

Flag可以放在远程房间，但它不会让 `Game.rooms[roomName]` 自动出现。

### 把所有配置都塞进 `Flag.memory`

大型数组、完整路径和长期日志会让配置难以维护。Flag只保留少量入口信息，详细状态放到独立Memory结构。

### 没有配置版本

字段变化后，旧Flag可能被新代码错误解释。版本不一致时应停止执行并重新配置。

### 每tick打印正常状态

正常任务每tick打印会淹没真正错误。示例只对非 `OK` 且非 `ERR_TIRED` 的结果输出日志。

## 离线模拟结果

构建检查覆盖：

1. Flag配置缺失；
2. 配置关闭；
3. 版本不一致；
4. 任务类型无效；
5. Creep名称为空；
6. 范围小于0或大于49；
7. 合法配置标准化；
8. 仅清理指定前缀中已经不存在的Flag Memory。

离线测试不能证明跨房间移动、Flag画面位置、`moveTo()`真实返回值或Memory跨tick写入已经在官方服务器运行。

## 适用边界

本文不覆盖：

- 完整任务队列；
- 多Flag优先级；
- 自动创建Flag；
- 战斗指令系统；
- 多Shard Flag同步；
- 路线避险；
- UI自动化；
- 外部配置服务。

JavaScript语法和离线配置校验已检查，真实Flag状态、移动结果和跨tick行为仍待Screeps环境验证。

## 相关站内内容

- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [Game.rooms为什么没有某个房间](/blog/screeps-room-visibility)
- [moveTo()为什么不移动](/blog/screeps-moveto-not-moving)
- [ERR_NO_PATH怎么排查](/blog/screeps-err-no-path)
- [RoomVisual怎么辅助调试](/blog/screeps-roomvisual-debug)
- [进入工程配置与运行诊断专题](/knowledge/operations-debugging)

## 官方资料

- [Flag API](https://docs.screeps.com/api/#Flag)
- [Game.flags API](https://docs.screeps.com/api/#Game-flags)
- [Creep.moveTo API](https://docs.screeps.com/api/#Creep.moveTo)
- [RoomObject API](https://docs.screeps.com/api/#RoomObject)
- [Memory](https://docs.screeps.com/global-objects.html#Memory-object)

资料核对日期：2026-07-22。离线配置校验模拟已通过；真实Flag任务仍待环境验证。
