---
title: "Screeps Container 快消失怎么处理：ticksToDecay、维修截止时间与 Builder 调度"
description: "解释 StructureContainer.ticksToDecay 为什么只表示下一次腐化，计算 Container 距离损毁的保守时间，并用路径、WORK、Energy、repair() 返回码和下一 tick 事件证据安排维修。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "Container"
  - "维修"
  - "资源采集"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
  testedAt: "2026-08-06"
  testEnvironment: "Node.js 22 离线模拟（Container 腐化间隔、损毁估算、维修截止时间、目标排序、证据窗口与异常输入；不是 Screeps 官方服务器）"
  testResult: "28 个离线场景通过；完整维修决策代码与文章 JavaScript 代码块通过语法检查。真实 Console、官方 shard 腐化与维修同 tick 结算、交通阻塞和 Boost WORK 仍待验证。"
featured: false
---

`StructureContainer.ticksToDecay` 很容易被误读成“这个 Container 还剩多少 tick 就会消失”。

它实际表示的是：**距离下一次腐化扣血还有多少 tick**。下一次腐化后，只要 `hits` 仍大于 0，Container 会继续存在，并重新开始下一轮腐化倒计时。

因此，下面的判断并不能证明 Container 即将消失：

```js
if (container.ticksToDecay < 50) {
  console.log('Container 快没了');
}
```

一个满血 Container 即使只剩 1 tick 触发下一次腐化，也不会因此直接消失。真正需要同时检查的是：

- 当前 `hits`；
- 每次腐化扣除的 `CONTAINER_DECAY`；
- 当前房间使用哪一种腐化间隔；
- 维修 Creep 到达 Range 3 需要多少 tick；
- Creep 是否有有效 `WORK` 和 Energy；
- `repair()` 的真实返回值；
- 下一 tick 是否出现对应维修事件。

本文解决的不是“怎样从 Container 取 Energy”。站内已有 [Container withdraw() 指南](/blog/screeps-creep-withdraw-container-energy)。本页只处理一个独立问题：

> Container 正在腐化时，怎样判断它是否真的接近损毁，并在来得及的情况下安排一次可验证的维修动作。

## 快速结论

第一版可靠方案可以按这条链路执行：

```text
读取 hits 与 ticksToDecay
→ 估算还可承受多少次腐化
→ 计算维修者到达 Range 3 的时间
→ 判断下一次腐化是否致命
→ 选择最紧急的 Container
→ moveTo() 或 repair()
→ 保存返回码与对象 ID
→ 下一 tick 匹配 EVENT_REPAIR
```

当前官方常量中：

```js
CONTAINER_HITS = 250000;
CONTAINER_DECAY = 5000;
CONTAINER_DECAY_TIME = 100;
CONTAINER_DECAY_TIME_OWNED = 500;
REPAIR_POWER = 100;
REPAIR_COST = 0.01;
```

这些值属于官方服务器常量。私服可以修改常量，因此生产代码应读取全局常量，而不是把数字散落在各个角色模块中。

## `ticksToDecay` 不是消失倒计时

假设一个中立或保留房间中的 Container 当前状态为：

```text
hits = 5,001
ticksToDecay = 20
```

下一次腐化发生在约 20 tick 后，扣除 5,000 hits，剩余 1 hit。它不会在该 tick 消失，但再经历下一轮腐化就会损毁。

可承受腐化次数为：

```js
const decayEventsUntilLoss = Math.ceil(
  container.hits / CONTAINER_DECAY
);
```

保守损毁时间估算为：

```js
const interval = room.controller?.level > 0
  ? CONTAINER_DECAY_TIME_OWNED
  : CONTAINER_DECAY_TIME;

const estimatedTicksUntilLoss =
  container.ticksToDecay
  + (decayEventsUntilLoss - 1) * interval;
```

如果 `hits` 正好等于 `CONTAINER_DECAY`，下一次腐化就会使它归零：

```js
const nextDecayFatal =
  container.hits <= CONTAINER_DECAY;
```

这个判断比只看 `ticksToDecay` 更重要。

## 为什么受控房间和远程房间的风险不同

Screeps 引擎在 Container 腐化时，会根据房间 Controller 是否存在有效等级选择间隔：

```text
Controller level > 0
→ CONTAINER_DECAY_TIME_OWNED

没有有效 Controller 等级
→ CONTAINER_DECAY_TIME
```

按当前常量：

- 有等级 Controller 的房间，每 500 tick 扣 5,000 hits；
- 中立、保留或没有有效 Controller 等级的房间，每 100 tick 扣 5,000 hits。

这意味着远程采集 Container 的平均维护压力通常更高。

但不要把该间隔写成永久事实。房间控制权变化、私服常量或特殊运行环境都可能让旧估算失效。每个可见 tick 都应重新读取当前房间状态。

## 先确定维修目标，不要每次都修到满血

“只要不是满血就维修”会浪费 Builder 的移动与 Energy，还可能抢占更重要的建设、Controller 或防御任务。

本文使用两个本地策略值：

```js
const REPAIR_POLICY = Object.freeze({
  minimumHitsRatio: 0.8,
  bufferDecayEvents: 2,
  safetyTicks: 5,
  historyLimit: 20
});
```

它们不是官方推荐值。

目标 hits 取以下两者的较大值：

```text
hitsMax × minimumHitsRatio

或

足以承受 bufferDecayEvents + 1 次腐化的 hits
```

对应代码：

```js
const targetHits = Math.min(
  container.hitsMax,
  Math.max(
    Math.ceil(
      container.hitsMax
      * policy.minimumHitsRatio
    ),
    CONTAINER_DECAY
      * (policy.bufferDecayEvents + 1)
  )
);
```

这样既不会让低血量 Container 只修一点就离开，也不会强制所有远程 Container 每次都修满。

## 维修截止时间要扣掉到达时间

Creep 可以在 Range 3 内执行 `repair()`。如果维修者尚未到达，真正可用时间不是完整的 `ticksToDecay`，而是：

```text
截止余量
= ticksToDecay
- 到达 Range 3 的预计路径长度
- 安全余量
```

```js
const deadlineSlack =
  container.ticksToDecay
  - travelTicks
  - policy.safetyTicks;
```

当 `deadlineSlack <= 0` 时，不代表 Container 一定会损毁，但说明按当前静态路径估算，维修者可能无法在下一次腐化前进入有效范围。

路径长度仍然不是到达时间的完整证明。以下因素会让实际移动更慢：

- Creep 的 MOVE 比例和 fatigue；
- 沼泽或没有道路的地形；
- 其他 Creep 堵路；
- 动态 Rampart 通行状态；
- hostile Creep；
- 路径缓存失效；
- 房间边界和视野变化。

因此该结果只能叫“调度估算”，不能叫“已经来得及”。

## 可离线验证的损毁估算函数

下面的函数不依赖真实 Screeps 对象，可直接放进 Node.js 测试。

```js
function estimateContainerLoss(
  container,
  roomHasControllerLevel,
  constants
) {
  const hits = Number.isFinite(container?.hits)
    ? Math.max(0, container.hits)
    : 0;
  const hitsMax = Number.isFinite(container?.hitsMax)
    ? Math.max(0, container.hitsMax)
    : 0;
  const ticksToDecay =
    Number.isFinite(container?.ticksToDecay)
      ? Math.max(0, container.ticksToDecay)
      : 0;

  const decayAmount = constants.CONTAINER_DECAY;
  const interval = roomHasControllerLevel
    ? constants.CONTAINER_DECAY_TIME_OWNED
    : constants.CONTAINER_DECAY_TIME;

  if (
    hits <= 0
    || hitsMax <= 0
    || !Number.isFinite(decayAmount)
    || decayAmount <= 0
    || !Number.isFinite(interval)
    || interval <= 0
  ) {
    return {
      valid: false,
      reason: 'invalid-container-decay-input'
    };
  }

  const decayEventsUntilLoss =
    Math.ceil(hits / decayAmount);

  return {
    valid: true,
    hits,
    hitsMax,
    ticksToDecay,
    decayAmount,
    interval,
    decayEventsUntilLoss,
    estimatedTicksUntilLoss:
      ticksToDecay
      + (decayEventsUntilLoss - 1) * interval,
    nextDecayFatal: hits <= decayAmount,
    nextDecayHits: Math.max(
      0,
      hits - decayAmount
    )
  };
}
```

## 怎样选择最紧急的 Container

一个房间最多可能有多个 Source Container、Controller Container 或临时物流 Container。排序时不要只看最低 `hits`。

本文依次比较：

1. 下一次腐化是否会直接损毁；
2. 扣除路径与安全余量后的 `deadlineSlack`；
3. 估算损毁时间；
4. 当前 hits；
5. 路径长度；
6. Container ID 作为稳定兜底。

```js
function rankContainerRepairPlans(plans) {
  return plans
    .filter(plan =>
      plan
      && plan.containerId
      && (
        plan.action === 'repair'
        || plan.action === 'move'
      )
    )
    .sort((left, right) => {
      if (left.urgent !== right.urgent) {
        return left.urgent ? -1 : 1;
      }

      if (
        left.deadlineSlack
        !== right.deadlineSlack
      ) {
        return (
          left.deadlineSlack
          - right.deadlineSlack
        );
      }

      if (
        left.estimatedTicksUntilLoss
        !== right.estimatedTicksUntilLoss
      ) {
        return (
          left.estimatedTicksUntilLoss
          - right.estimatedTicksUntilLoss
        );
      }

      if (left.hits !== right.hits) {
        return left.hits - right.hits;
      }

      if (
        left.travelTicks
        !== right.travelTicks
      ) {
        return (
          left.travelTicks
          - right.travelTicks
        );
      }

      return left.containerId.localeCompare(
        right.containerId
      );
    });
}
```

稳定 ID 兜底可以防止条件完全相同时，目标顺序每 tick 跳动。

## 完整房间级维修示例

下面的代码只管理 Container 维修目标和动作提交。

它不会替代完整 Builder 角色，也不会自动决定去哪里补充 Energy。如果维修者没有 Energy，函数会返回 `repairer-needs-energy`。可复用站内的 [工作状态切换](/blog/screeps-creep-working-state) 与 [Container withdraw()](/blog/screeps-creep-withdraw-container-energy) 逻辑补齐取能阶段。

把房间名和维修者名称替换成自己的。

```js
const CONTAINER_REPAIR_POLICY =
  Object.freeze({
    minimumHitsRatio: 0.8,
    bufferDecayEvents: 2,
    safetyTicks: 5,
    historyLimit: 20
  });

function pushBoundedHistory(
  history,
  entry,
  limit
) {
  const values = Array.isArray(history)
    ? history
    : [];

  return [...values, entry].slice(
    -Math.max(1, limit)
  );
}

function getContainerDecayInterval(room) {
  return room.controller?.level > 0
    ? CONTAINER_DECAY_TIME_OWNED
    : CONTAINER_DECAY_TIME;
}

function getContainerPathLength(
  repairer,
  container
) {
  if (repairer.pos.inRangeTo(container, 3)) {
    return 0;
  }

  const path = repairer.pos.findPathTo(
    container,
    {
      range: 3,
      ignoreCreeps: true,
      maxOps: 2000
    }
  );

  return path.length > 0
    ? path.length
    : null;
}

function createContainerRepairPlan(
  room,
  repairer,
  container,
  policy
) {
  const interval =
    getContainerDecayInterval(room);

  const decayEventsUntilLoss = Math.ceil(
    container.hits / CONTAINER_DECAY
  );

  const estimatedTicksUntilLoss =
    container.ticksToDecay
    + (decayEventsUntilLoss - 1)
      * interval;

  const targetHits = Math.min(
    container.hitsMax,
    Math.max(
      Math.ceil(
        container.hitsMax
        * policy.minimumHitsRatio
      ),
      CONTAINER_DECAY
        * (policy.bufferDecayEvents + 1)
    )
  );

  if (container.hits >= targetHits) {
    return null;
  }

  const travelTicks =
    getContainerPathLength(
      repairer,
      container
    );

  if (travelTicks === null) {
    return null;
  }

  const deadlineSlack =
    container.ticksToDecay
    - travelTicks
    - policy.safetyTicks;

  return {
    containerId: container.id,
    hits: container.hits,
    hitsMax: container.hitsMax,
    targetHits,
    travelTicks,
    deadlineSlack,
    estimatedTicksUntilLoss,
    nextDecayFatal:
      container.hits <= CONTAINER_DECAY,
    urgent:
      container.hits <= CONTAINER_DECAY
      || deadlineSlack <= 0,
    action:
      repairer.pos.inRangeTo(container, 3)
        ? 'repair'
        : 'move'
  };
}

function selectContainerRepairPlan(
  room,
  repairer,
  policy
) {
  const containers = room.find(
    FIND_STRUCTURES,
    {
      filter: structure =>
        structure.structureType
          === STRUCTURE_CONTAINER
        && structure.hits
          < structure.hitsMax
    }
  );

  const plans = containers
    .map(container =>
      createContainerRepairPlan(
        room,
        repairer,
        container,
        policy
      )
    )
    .filter(Boolean);

  return rankContainerRepairPlans(plans)[0]
    ?? null;
}

function rankContainerRepairPlans(plans) {
  return [...plans].sort((left, right) => {
    if (left.urgent !== right.urgent) {
      return left.urgent ? -1 : 1;
    }

    if (
      left.deadlineSlack
      !== right.deadlineSlack
    ) {
      return (
        left.deadlineSlack
        - right.deadlineSlack
      );
    }

    if (
      left.estimatedTicksUntilLoss
      !== right.estimatedTicksUntilLoss
    ) {
      return (
        left.estimatedTicksUntilLoss
        - right.estimatedTicksUntilLoss
      );
    }

    if (left.hits !== right.hits) {
      return left.hits - right.hits;
    }

    if (
      left.travelTicks
      !== right.travelTicks
    ) {
      return (
        left.travelTicks
        - right.travelTicks
      );
    }

    return left.containerId.localeCompare(
      right.containerId
    );
  });
}

function verifyPreviousContainerRepair(
  room,
  memory
) {
  const pending = memory.pending;

  if (!pending) {
    return;
  }

  const expectedTick = pending.submittedAt + 1;

  if (Game.time < expectedTick) {
    return;
  }

  if (Game.time > expectedTick) {
    memory.history = pushBoundedHistory(
      memory.history,
      {
        tick: Game.time,
        state: 'missed-observation-window',
        expectedTick,
        containerId: pending.containerId
      },
      CONTAINER_REPAIR_POLICY.historyLimit
    );
    delete memory.pending;
    return;
  }

  const container = Game.getObjectById(
    pending.containerId
  );

  const events = room.getEventLog();
  const repairEvent = events.find(event =>
    event.event === EVENT_REPAIR
    && event.objectId === pending.repairerId
    && event.data?.targetId
      === pending.containerId
  );

  const hitsAfter =
    container
    && Number.isFinite(container.hits)
      ? container.hits
      : null;

  const hitsDelta =
    Number.isFinite(hitsAfter)
      ? hitsAfter - pending.hitsBefore
      : null;

  let state = 'repair-event-not-found';

  if (repairEvent && !container) {
    state = 'repair-event-target-missing';
  } else if (
    repairEvent
    && Number.isFinite(hitsDelta)
    && hitsDelta > 0
  ) {
    state =
      'repair-event-and-hits-increased';
  } else if (repairEvent) {
    state =
      'repair-event-with-net-offset';
  } else if (!container) {
    state = 'container-missing';
  } else if (!Number.isFinite(hitsDelta)) {
    state = 'repair-evidence-unavailable';
  } else if (hitsDelta > 0) {
    state =
      'hits-increased-without-matched-event';
  } else if (hitsDelta === 0) {
    state = 'no-net-hits-change';
  } else {
    state = 'hits-decreased';
  }

  memory.history = pushBoundedHistory(
    memory.history,
    {
      tick: Game.time,
      state,
      containerId: pending.containerId,
      repairerId: pending.repairerId,
      result: pending.result,
      hitsBefore: pending.hitsBefore,
      hitsAfter,
      hitsDelta,
      eventMatched: Boolean(repairEvent),
      energySpent:
        Number.isFinite(
          repairEvent?.data?.energySpent
        )
          ? repairEvent.data.energySpent
          : null
    },
    CONTAINER_REPAIR_POLICY.historyLimit
  );

  delete memory.pending;
}

function runContainerDecayRepair(
  roomName,
  repairerName
) {
  Memory.containerDecayRepair ??= {};
  const memory =
    Memory.containerDecayRepair;

  const room = Game.rooms[roomName];

  if (!room) {
    return {
      state: 'room-not-visible'
    };
  }

  verifyPreviousContainerRepair(
    room,
    memory
  );

  const repairer =
    Game.creeps[repairerName];

  if (!repairer || !repairer.my) {
    return {
      state: 'repairer-missing'
    };
  }

  if (repairer.spawning) {
    return {
      state: 'repairer-spawning'
    };
  }

  if (
    repairer.getActiveBodyparts(WORK)
    <= 0
  ) {
    return {
      state: 'repairer-no-active-work'
    };
  }

  if (
    repairer.store.getUsedCapacity(
      RESOURCE_ENERGY
    ) <= 0
  ) {
    return {
      state: 'repairer-needs-energy'
    };
  }

  const plan = selectContainerRepairPlan(
    room,
    repairer,
    CONTAINER_REPAIR_POLICY
  );

  if (!plan) {
    return {
      state: 'no-container-needs-repair'
    };
  }

  const container = Game.getObjectById(
    plan.containerId
  );

  if (!container) {
    return {
      state: 'container-missing'
    };
  }

  if (plan.action === 'move') {
    const result = repairer.moveTo(
      container,
      {
        range: 3,
        reusePath: 5,
        visualizePathStyle: {
          stroke: '#ffffff'
        }
      }
    );

    return {
      state: 'move-submitted',
      result,
      plan
    };
  }

  const hitsBefore = container.hits;
  const result = repairer.repair(container);

  if (result === OK) {
    memory.pending = {
      submittedAt: Game.time,
      containerId: container.id,
      repairerId: repairer.id,
      hitsBefore,
      result
    };
  }

  return {
    state:
      result === OK
        ? 'repair-submitted'
        : 'repair-rejected',
    result,
    plan
  };
}

module.exports.loop = function () {
  const result = runContainerDecayRepair(
    'W1N1',
    'Builder1'
  );

  if (
    result.state === 'repair-rejected'
    || (
      result.state === 'move-submitted'
      && result.result !== OK
      && result.result !== ERR_TIRED
    )
  ) {
    console.log({
      type: 'container-decay-repair',
      tick: Game.time,
      ...result
    });
  }
};
```

## `repair()` 返回码怎样处理

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 当前 tick 接受了维修意图 | 保存 Creep ID、Container ID、hits 与 tick，下一 tick 验证 |
| `ERR_NOT_OWNER` | 执行动作的 Creep 不是自己的 | `repairer.my` 与对象恢复逻辑 |
| `ERR_BUSY` | Creep 仍在出生 | `repairer.spawning` |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep 没有足够 Energy | `store.getUsedCapacity(RESOURCE_ENERGY)` |
| `ERR_INVALID_TARGET` | 目标不存在、不是可维修结构或已经满血 | 重新恢复 ID、检查结构类型与 hits |
| `ERR_NOT_IN_RANGE` | 距离超过 Range 3 | `moveTo(..., { range: 3 })` |
| `ERR_NO_BODYPART` | 没有有效 WORK | `getActiveBodyparts(WORK)` |

不要把 `OK` 写成“Container 已经恢复”。它只证明命令被接受。

## 为什么下一 tick 优先看维修事件

只比较两次 `hits` 可能产生错误结论。

例如同一个结算窗口内：

- Creep 提交维修；
- Container 触发腐化；
- hostile Creep 或其他单位造成额外影响；
- 另一个维修者也对同一目标工作。

最终 `hits` 可能增加、保持不变，甚至下降。

因此证据应分层：

```text
第一层：repair() 返回值
第二层：下一 tick 的 EVENT_REPAIR
第三层：Container 净 hits 变化
第四层：多 tick 是否持续保持在策略目标以上
```

精确事件匹配需要同时核对：

```js
event.event === EVENT_REPAIR
&& event.objectId === repairer.id
&& event.data?.targetId === container.id
```

只有目标 ID 一致仍不够，因为另一个 Creep 也可能维修同一 Container。

站内的 [Room.getEventLog() 事件指南](/blog/screeps-room-event-log) 进一步解释了一 tick 观察窗口和对象身份。

## 维修 Energy 怎样估算

未强化的一个有效 `WORK` 每次维修基础值为：

```js
REPAIR_POWER
```

Energy 成本由：

```js
repairHits * REPAIR_COST
```

决定。

按当前常量，一个普通 WORK 每次基础维修 100 hits，消耗 1 Energy。

可以估算：

```js
const repairPower =
  activeWorkParts * REPAIR_POWER;

const actionsNeeded = Math.ceil(
  missingHits / repairPower
);

const energyNeeded = Math.ceil(
  actionsNeeded
  * repairPower
  * REPAIR_COST
);
```

该公式没有覆盖 WORK Boost。强化会改变维修能力和实际 Energy 使用，生产系统应读取活跃身体部件及 Boost 系数，而不是继续套用未强化基线。

## 为什么不建议让 Tower 维护所有 Container

Tower 可以维修结构，但距离会影响维修效果，并且每次动作固定消耗 Tower Energy。

在没有敌情时，Tower 可以承担临时维护；但长期让 Tower 自动把所有 Container 修满可能：

- 消耗防御储备；
- 与紧急治疗或攻击争用动作；
- 掩盖 Builder 调度缺口；
- 在远距离目标上获得较低效果；
- 让维修阈值和防御阈值互相冲突。

站内 [Tower 维修阈值指南](/blog/screeps-tower-repair-threshold) 适合处理 Tower 侧策略。本文的核心是 Creep `repair()` 与 Container 腐化截止时间。

## 常见误区

### 把 `ticksToDecay` 当成死亡倒计时

它只表示下一次腐化，不是剩余生命周期。

### 只看最低 hits

低 hits 但下一次腐化还很远的目标，未必比即将触发致命腐化的目标更紧急。

### 在远程房间使用受控房间间隔

中立或保留房间通常使用更短的腐化间隔，维修压力更高。

### 忽略到达 Range 3 的时间

调度器在 Container 只剩 5 tick 时才派出 20 格外的 Builder，通常已经太晚。

### 维修者没有 Energy 仍不断调用 `repair()`

应先切换取能状态，不要每 tick 重复产生资源不足返回码。

### 每 tick 更换维修目标

没有稳定排序与目标保持会导致 Creep 来回移动，真正紧急的 Container 反而得不到维修。

### 把 hits 增加当成某个 Creep 的唯一贡献

其他维修者、Tower 和腐化结算都会影响净值。应匹配 actor 与 target 的事件身份。

### 把离线公式当成真实到达证明

路径、交通、fatigue、敌人和视野都可能改变真实结果。

## 与现有文章的边界

| 页面 | 独立搜索意图 |
|---|---|
| [Container withdraw()](/blog/screeps-creep-withdraw-container-energy) | 怎样从 Container 取 Energy |
| [Builder 自动建造和维修](/blog/screeps-build-and-repair) | 怎样在建设与普通维修之间切换 |
| [Tower 维修阈值](/blog/screeps-tower-repair-threshold) | Tower 什么时候维修结构 |
| 本文 | Container 何时会因腐化进入真实损毁风险，怎样安排可验证维修 |

因此本文适合新建独立 URL，不应并入 withdraw 页面。

## 离线验证结果

本次验证覆盖 28 个场景：

1. 5,000 hits 时下一次腐化致命；
2. 5,001 hits 需要两次腐化才损毁；
3. 有等级 Controller 房间使用较长间隔；
4. 中立或保留房间使用较短间隔；
5. 无效 hits 输入失败关闭；
6. Container 已达到策略目标时等待；
7. 维修者不存在；
8. 维修者仍在出生；
9. 没有有效 WORK；
10. 没有 Energy；
11. 已在 Range 3 内选择维修；
12. 超出 Range 3 选择移动；
13. 无路径时不提交动作；
14. 下一次腐化致命时标记紧急；
15. 路程耗尽截止余量时标记紧急；
16. 多个目标优先选择紧急 Container；
17. 同优先级按截止余量排序；
18. 完全同分时使用稳定 ID；
19. 没有待验证动作；
20. 错过下一 tick 观察窗口；
21. Container 已消失；
22. 事件存在但目标已消失；
23. hits 证据缺失；
24. 精确维修事件与 hits 增加同时出现；
25. 事件存在但净 hits 被抵消；
26. hits 增加但没有匹配事件；
27. bounded history 保持固定长度；
28. 非法策略值回退到安全默认值。

全部 JavaScript 代码块通过语法检查。

这些测试没有调用真实 `Room.find()`、`findPathTo()`、`Creep.repair()` 或官方 shard 结算。

## 适用边界

本文没有实现：

- 多房间 Builder 全局调度；
- Source Keeper 房间战斗保护；
- hostile Creep 撤退逻辑；
- Boost WORK 的完整成本模型；
- Tower 与 Creep 维修动作仲裁；
- 多维修者任务锁；
- 动态道路和拥堵预测；
- 房间失去视野后的远程状态缓存；
- Container 重建；
- 真实服务器的腐化与维修同 tick 顺序证明。

真实 Console、官方 shard、多 tick 维修稳定性和 Container 最终保活仍标记为待验证。

## 相关站内内容

- [怎样从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [Builder 怎样自动建造和维修](/blog/screeps-build-and-repair)
- [Tower 怎样按阈值维修](/blog/screeps-tower-repair-threshold)
- [怎样按路径选择 Source](/blog/screeps-select-source-by-path)
- [moveTo() 返回 OK 但不移动怎么排查](/blog/screeps-moveto-not-moving)
- [怎样读取 Room Event Log](/blog/screeps-room-event-log)
- [进入资源采集与房间经济模块](/knowledge/room-economy)

## 官方资料

- [StructureContainer API](https://docs.screeps.com/api/#StructureContainer)
- [Creep.repair() API](https://docs.screeps.com/api/#Creep.repair)
- [Screeps Constants](https://docs.screeps.com/api/#Constants)
- [Screeps Game Loop](https://docs.screeps.com/game-loop.html)

资料与官方开源引擎核对日期：2026-08-06。语法检查和 28 个离线场景已通过；真实 Screeps 环境仍待验证。
