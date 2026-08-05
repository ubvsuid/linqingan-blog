---
title: "Screeps CPU Bucket 一直下降怎么办：任务分级、降载与自动恢复"
description: "当 Game.cpu.bucket 持续下降时，用带迟滞的 NORMAL、CONSERVE、EMERGENCY 与 RECOVERY 状态机保护 Spawn、采集、Controller 和防御，逐级暂停高成本任务，并在恢复后分阶段重新启用。"
publishedAt: "2026-08-05"
updatedAt: "2026-08-05"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "CPU"
  - "运行诊断"
  - "自动化"
  - "架构"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-05"
  testedAt: "2026-08-05"
  testEnvironment: "Node.js 22 离线模拟（CPU模式转换、迟滞、连续tick确认、任务等级与执行间隔；不是Screeps官方服务器）"
  testResult: "27个离线状态转换与任务许可场景通过；完整调度器通过JavaScript语法检查。真实CPU单位、bucket趋势和官方shard主循环仍待验证。"
featured: false
---

`Game.cpu.bucket` 偶尔下降并不一定是故障。路径搜索、全局重置、首次读取 `Memory`、战斗或房间对象数量变化，都可能让某些 tick 比平时更贵。

真正危险的是：**bucket 长期单向下降，而主循环仍然每 tick 执行市场扫描、路径预计算、统计、RoomVisual 和其他非关键任务。** 等到 bucket 接近耗尽时，采集、Spawn 恢复或防御也可能因为脚本过早停止而得不到执行。

本文解决一个明确问题：

> 当 CPU 储备持续恶化时，怎样优先保住房间生存逻辑，逐级降低非关键任务频率，并在 bucket 恢复后避免所有高成本任务同一 tick 一起重启。

## 快速结论

不要只写一个这样的条件：

```js
if (Game.cpu.bucket > 5000) {
  runEverything();
}
```

单阈值会在 `4999` 和 `5001` 附近反复开关，也没有区分“必须运行”和“可以暂停”的任务。

更稳定的方案应同时包含：

1. **任务分级**：关键、重要、可选；
2. **四种运行模式**：`NORMAL`、`CONSERVE`、`EMERGENCY`、`RECOVERY`；
3. **进入与退出使用不同阈值**；
4. **连续多个 tick 满足条件后才切换**；
5. **关键任务始终优先执行**；
6. **恢复时分阶段放开任务，而不是一次全部恢复**；
7. **只在模式变化时记录或提醒**。

## 与已有 CPU 文章的明确区别

站内现有的 [Game.cpu.getUsed() 和 bucket 怎么监控 CPU](/blog/screeps-cpu-getused-bucket) 负责回答：

- `limit`、`tickLimit` 和 `bucket` 分别表示什么；
- 怎样用 `getUsed()` 测量一段代码；
- 怎样记录平均值和峰值；
- 为什么一次样本不能证明长期性能。

本文不重复这些基础测量。本文的搜索意图是下一步：

```text
已经知道 bucket 在下降
→ 怎样自动减少工作
→ 哪些逻辑绝对不能停
→ 什么时候可以恢复
```

因此本页应使用独立 Slug，而不是把现有 CPU 监控页改成一篇同时覆盖“测量、诊断、调度、恢复”的宽泛文章。

## 先明确官方事实和本地策略

在 Screeps 官方在线环境中，未使用的基础 CPU 会进入 bucket，bucket 上限为 10,000；有储备时，当前 tick 可以使用高于基础 `Game.cpu.limit` 的额度，具体上限通过 `Game.cpu.tickLimit` 读取。

如果脚本在当前 tick 超过可用 CPU，执行会停止。命令和世界状态的结算又发生在脚本阶段之后，所以把关键逻辑放在主循环末尾是一种真实风险。

本文后面出现的这些数字：

```text
7000、2000、4500、8500
0.70、0.90、0.55、0.45
3 tick、20 tick、25 tick、50 tick
```

全部是**可修改的本地示例**，不是 Screeps 官方推荐阈值。实际值应根据账号基础额度、房间数量、战争状态、路径搜索规模和恢复能力调整。

## 为什么只看 bucket 当前值还不够

假设两个账号当前 bucket 都是 `6000`：

- 账号 A 的平均消耗低于基础 `limit`，bucket 正在恢复；
- 账号 B 的平均消耗高于基础 `limit`，bucket 正在持续下降。

它们不应执行完全相同的策略。

第一版调度器至少同时观察：

```js
const used = Game.cpu.getUsed();
const tickLimit = Game.cpu.tickLimit;
const usedRatio = used / tickLimit;
const bucket = Game.cpu.bucket;
```

这里的 `usedRatio` 只表示**调度器运行到当前位置时**已经使用的比例，不代表本 tick 最终总消耗。它适合做“是否还应该启动下一项非关键任务”的保护条件，不适合伪装成完整 CPU 结论。

## 为什么单阈值会反复抖动

下面的代码会产生模式抖动：

```js
const lowCpu = Game.cpu.bucket < 5000;
```

当 bucket 在阈值附近来回变化时，市场扫描、路径缓存和可视化会不断关闭、重开。重新启用本身可能立即制造新高峰，又把 bucket 压回阈值下方。

稳定状态机需要“迟滞”：

```text
进入降载：bucket < 7000
退出降载：bucket >= 8500
```

进入和退出阈值之间保留缓冲区。再配合连续 tick 确认和最短模式保持时间，就能减少一次异常样本导致的频繁切换。

## 四种 CPU 运行模式

| 模式 | 目标 | 任务策略 |
|---|---|---|
| `NORMAL` | 正常运行 | 按原计划执行全部任务 |
| `CONSERVE` | 阻止 bucket 继续快速下降 | 关键任务照常，重要任务降频，可选任务大幅降频 |
| `EMERGENCY` | 保护房间生存能力 | 关键任务照常，重要任务低频，可选任务停止 |
| `RECOVERY` | 验证恢复是否稳定 | 关键任务照常，重要任务逐步恢复，可选任务延迟重启 |

`RECOVERY` 很重要。没有它时，bucket 刚离开紧急区，所有路径预计算、市场查询和视觉日志就可能一起恢复，造成第二次下跌。

## 哪些任务必须被视为关键任务

典型关键任务包括：

- 房间已经断代时的 [第一只采集者恢复](/blog/screeps-spawn-emergency-recovery)；
- Spawn 队列和 [Creep 提前补员](/blog/screeps-creep-prespawn-replacement)；
- 基础采集与运输；
- 敌人检测和 Tower 防御；
- Controller 即将降级时的 [应急处理](/blog/screeps-controller-downgrade)；
- 保护关键结构或 Safe Mode 决策所需的最小逻辑。

关键任务不能写成：

```js
if (Game.cpu.bucket > 8000) {
  runDefense();
}
```

CPU 越紧张，系统越需要保留自救能力。降载的目标是停止不紧急的计算，而不是停止房间生存逻辑。

## 重要任务和可选任务怎么区分

### 重要任务

重要任务可以延迟，但长期完全停止会影响经济或维护：

- 普通 Builder 调度；
- Link、Lab、Factory、Terminal 的周期协调；
- 非紧急维修；
- 远程房间状态刷新；
- 常规统计汇总。

### 可选任务

可选任务可以在紧急模式中完全暂停：

- 全图市场扫描；
- 大范围路径预计算；
- 非必要 RoomVisual；
- 排行榜或报表生成；
- 低优先级 Observer 扫描；
- 不影响当前 tick 决策的历史统计。

任务等级是业务决策，不是 API 属性。战争状态下，原本“重要”的远程情报可能需要临时升为“关键”。

## 可离线验证的模式决策函数

下面的函数不依赖 Screeps 对象，可以直接用 Node.js 测试。

```js
const CPU_MODE = Object.freeze({
  NORMAL: 'NORMAL',
  CONSERVE: 'CONSERVE',
  EMERGENCY: 'EMERGENCY',
  RECOVERY: 'RECOVERY'
});

const CPU_POLICY = Object.freeze({
  hardEmergencyBucket: 500,
  conserveBelow: 7000,
  emergencyBelow: 2000,
  recoveryAbove: 4500,
  normalAbove: 8500,
  conserveUsedRatio: 0.70,
  hardUsedRatio: 0.90,
  recoveryUsedRatio: 0.55,
  normalUsedRatio: 0.45,
  degradeConfirmTicks: 3,
  recoverConfirmTicks: 20,
  minimumModeTicks: 25,
  recoveryWarmupTicks: 50,
  nonCriticalHeadroom: 0.15
});

const MODE_SEVERITY = Object.freeze({
  [CPU_MODE.NORMAL]: 0,
  [CPU_MODE.RECOVERY]: 1,
  [CPU_MODE.CONSERVE]: 2,
  [CPU_MODE.EMERGENCY]: 3
});

function validMode(mode) {
  return Object.prototype.hasOwnProperty.call(
    MODE_SEVERITY,
    mode
  );
}

function normalizeCpuState(value, gameTime) {
  const mode = validMode(value?.mode)
    ? value.mode
    : CPU_MODE.NORMAL;

  return {
    mode,
    modeSince: Number.isInteger(value?.modeSince)
      ? value.modeSince
      : gameTime,
    candidateMode: validMode(value?.candidateMode)
      ? value.candidateMode
      : null,
    candidateTicks:
      Number.isInteger(value?.candidateTicks)
      && value.candidateTicks >= 0
        ? value.candidateTicks
        : 0
  };
}

function selectDesiredCpuMode(
  state,
  metrics,
  policy = CPU_POLICY
) {
  const { bucket, usedRatio } = metrics;

  if (
    !Number.isFinite(bucket)
    || !Number.isFinite(usedRatio)
    || usedRatio < 0
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'invalid-cpu-metrics',
      immediate: true
    };
  }

  if (
    bucket <= policy.hardEmergencyBucket
    || usedRatio >= policy.hardUsedRatio
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'hard-cpu-risk',
      immediate: true
    };
  }

  if (bucket <= policy.emergencyBelow) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'bucket-emergency',
      immediate: false
    };
  }

  switch (state.mode) {
    case CPU_MODE.NORMAL:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: 'conserve-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.NORMAL,
        reason: 'healthy',
        immediate: false
      };

    case CPU_MODE.CONSERVE:
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: 'normal-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.CONSERVE,
        reason: 'conserve-hold',
        immediate: false
      };

    case CPU_MODE.EMERGENCY:
      if (
        bucket >= policy.recoveryAbove
        && usedRatio <= policy.recoveryUsedRatio
      ) {
        return {
          mode: CPU_MODE.RECOVERY,
          reason: 'recovery-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: 'emergency-hold',
        immediate: false
      };

    case CPU_MODE.RECOVERY:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: 'recovery-regressed',
          immediate: false
        };
      }
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: 'recovery-complete',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.RECOVERY,
        reason: 'recovery-hold',
        immediate: false
      };

    default:
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: 'invalid-state-mode',
        immediate: true
      };
  }
}

function updateCpuMode(
  previous,
  metrics,
  gameTime,
  policy = CPU_POLICY
) {
  const state = normalizeCpuState(previous, gameTime);
  const desired = selectDesiredCpuMode(
    state,
    metrics,
    policy
  );

  if (desired.mode === state.mode) {
    return {
      ...state,
      candidateMode: null,
      candidateTicks: 0,
      changed: false,
      reason: desired.reason
    };
  }

  if (desired.immediate) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  const candidateTicks =
    state.candidateMode === desired.mode
      ? state.candidateTicks + 1
      : 1;
  const degrading =
    MODE_SEVERITY[desired.mode]
    > MODE_SEVERITY[state.mode];
  const requiredTicks = degrading
    ? policy.degradeConfirmTicks
    : policy.recoverConfirmTicks;
  const heldLongEnough = degrading
    || gameTime - state.modeSince
      >= policy.minimumModeTicks;

  if (
    candidateTicks >= requiredTicks
    && heldLongEnough
  ) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  return {
    ...state,
    candidateMode: desired.mode,
    candidateTicks,
    changed: false,
    reason: `confirm-${desired.reason}`
  };
}
```

### 这段决策代码解决了什么

- 极低 bucket 或极高已用比例可以立即进入紧急模式；
- 普通降载需要连续 3 tick 确认；
- 恢复需要更长的 20 tick 确认；
- 恢复方向受到最短模式保持时间限制；
- 异常或损坏的 CPU 指标按紧急模式处理，而不是误判为正常。

“进入快、退出慢”是一种保守策略。它减少风险，但也可能让非关键任务暂停更久。

## 完整 CPU 降载调度器

下面的模块负责：

- 保存当前模式；
- 记录有界的模式转换历史；
- 按等级和模式计算任务间隔；
- 用任务名生成稳定错峰；
- 在启动非关键任务前检查剩余 CPU 比例；
- 隔离并记录任务异常；
- 输出本 tick 实际执行、跳过和失败结果。

业务函数由现有模块提供，调度器不伪造采集、Spawn 或防御逻辑。

```js
const CPU_MODE = Object.freeze({
  NORMAL: 'NORMAL',
  CONSERVE: 'CONSERVE',
  EMERGENCY: 'EMERGENCY',
  RECOVERY: 'RECOVERY'
});

const TASK_TIER = Object.freeze({
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  OPTIONAL: 'optional'
});

const CPU_POLICY = Object.freeze({
  hardEmergencyBucket: 500,
  conserveBelow: 7000,
  emergencyBelow: 2000,
  recoveryAbove: 4500,
  normalAbove: 8500,
  conserveUsedRatio: 0.70,
  hardUsedRatio: 0.90,
  recoveryUsedRatio: 0.55,
  normalUsedRatio: 0.45,
  degradeConfirmTicks: 3,
  recoverConfirmTicks: 20,
  minimumModeTicks: 25,
  recoveryWarmupTicks: 50,
  nonCriticalHeadroom: 0.15,
  historyLimit: 20,
  failureLimit: 20
});

const MODE_SEVERITY = Object.freeze({
  [CPU_MODE.NORMAL]: 0,
  [CPU_MODE.RECOVERY]: 1,
  [CPU_MODE.CONSERVE]: 2,
  [CPU_MODE.EMERGENCY]: 3
});

const TIER_ORDER = Object.freeze({
  [TASK_TIER.CRITICAL]: 0,
  [TASK_TIER.IMPORTANT]: 1,
  [TASK_TIER.OPTIONAL]: 2
});

function validMode(mode) {
  return Object.prototype.hasOwnProperty.call(
    MODE_SEVERITY,
    mode
  );
}

function normalizeCpuState(value, gameTime) {
  const mode = validMode(value?.mode)
    ? value.mode
    : CPU_MODE.NORMAL;

  return {
    mode,
    modeSince: Number.isInteger(value?.modeSince)
      ? value.modeSince
      : gameTime,
    candidateMode: validMode(value?.candidateMode)
      ? value.candidateMode
      : null,
    candidateTicks:
      Number.isInteger(value?.candidateTicks)
      && value.candidateTicks >= 0
        ? value.candidateTicks
        : 0
  };
}

function selectDesiredCpuMode(
  state,
  metrics,
  policy = CPU_POLICY
) {
  const { bucket, usedRatio } = metrics;

  if (
    !Number.isFinite(bucket)
    || !Number.isFinite(usedRatio)
    || usedRatio < 0
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'invalid-cpu-metrics',
      immediate: true
    };
  }

  if (
    bucket <= policy.hardEmergencyBucket
    || usedRatio >= policy.hardUsedRatio
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'hard-cpu-risk',
      immediate: true
    };
  }

  if (bucket <= policy.emergencyBelow) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: 'bucket-emergency',
      immediate: false
    };
  }

  switch (state.mode) {
    case CPU_MODE.NORMAL:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: 'conserve-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.NORMAL,
        reason: 'healthy',
        immediate: false
      };

    case CPU_MODE.CONSERVE:
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: 'normal-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.CONSERVE,
        reason: 'conserve-hold',
        immediate: false
      };

    case CPU_MODE.EMERGENCY:
      if (
        bucket >= policy.recoveryAbove
        && usedRatio <= policy.recoveryUsedRatio
      ) {
        return {
          mode: CPU_MODE.RECOVERY,
          reason: 'recovery-threshold',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: 'emergency-hold',
        immediate: false
      };

    case CPU_MODE.RECOVERY:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: 'recovery-regressed',
          immediate: false
        };
      }
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: 'recovery-complete',
          immediate: false
        };
      }
      return {
        mode: CPU_MODE.RECOVERY,
        reason: 'recovery-hold',
        immediate: false
      };

    default:
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: 'invalid-state-mode',
        immediate: true
      };
  }
}

function updateCpuMode(
  previous,
  metrics,
  gameTime,
  policy = CPU_POLICY
) {
  const state = normalizeCpuState(previous, gameTime);
  const desired = selectDesiredCpuMode(
    state,
    metrics,
    policy
  );

  if (desired.mode === state.mode) {
    return {
      ...state,
      candidateMode: null,
      candidateTicks: 0,
      changed: false,
      reason: desired.reason
    };
  }

  if (desired.immediate) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  const candidateTicks =
    state.candidateMode === desired.mode
      ? state.candidateTicks + 1
      : 1;
  const degrading =
    MODE_SEVERITY[desired.mode]
    > MODE_SEVERITY[state.mode];
  const requiredTicks = degrading
    ? policy.degradeConfirmTicks
    : policy.recoverConfirmTicks;
  const heldLongEnough = degrading
    || gameTime - state.modeSince
      >= policy.minimumModeTicks;

  if (
    candidateTicks >= requiredTicks
    && heldLongEnough
  ) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason
    };
  }

  return {
    ...state,
    candidateMode: desired.mode,
    candidateTicks,
    changed: false,
    reason: `confirm-${desired.reason}`
  };
}

function readCpuMetrics() {
  const used = Game.cpu.getUsed();
  const tickLimit = Game.cpu.tickLimit;

  return {
    bucket: Game.cpu.bucket,
    used,
    tickLimit,
    usedRatio:
      Number.isFinite(tickLimit)
      && tickLimit > 0
        ? used / tickLimit
        : Number.POSITIVE_INFINITY
  };
}

function pushBounded(list, value, limit) {
  list.push(value);
  while (list.length > limit) list.shift();
}

function getSchedulerState() {
  Memory.cpuScheduler ??= {
    mode: CPU_MODE.NORMAL,
    modeSince: Game.time,
    candidateMode: null,
    candidateTicks: 0,
    transitions: [],
    failures: []
  };

  const state = Memory.cpuScheduler;
  state.transitions ??= [];
  state.failures ??= [];
  return state;
}

function taskIntervalFor(
  mode,
  tier,
  baseInterval,
  recoveryAge,
  policy = CPU_POLICY
) {
  if (
    !Number.isInteger(baseInterval)
    || baseInterval < 1
  ) {
    return null;
  }

  if (tier === TASK_TIER.CRITICAL) {
    return baseInterval;
  }

  if (tier === TASK_TIER.IMPORTANT) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) {
      return Math.max(baseInterval, 2);
    }
    if (mode === CPU_MODE.EMERGENCY) {
      return Math.max(baseInterval, 10);
    }
    return Math.max(baseInterval, 2);
  }

  if (tier === TASK_TIER.OPTIONAL) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) {
      return Math.max(baseInterval, 20);
    }
    if (mode === CPU_MODE.EMERGENCY) return null;
    if (recoveryAge < policy.recoveryWarmupTicks) {
      return null;
    }
    return Math.max(baseInterval, 10);
  }

  return null;
}

function hashTaskName(name) {
  let value = 0;
  for (let index = 0; index < name.length; index += 1) {
    value = (value * 31 + name.charCodeAt(index)) >>> 0;
  }
  return value;
}

function isCadenceTick(name, interval) {
  if (interval === 1) return true;
  const offset = hashTaskName(name) % interval;
  return Game.time % interval === offset;
}

function remainingCpuRatio() {
  if (
    !Number.isFinite(Game.cpu.tickLimit)
    || Game.cpu.tickLimit <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    (Game.cpu.tickLimit - Game.cpu.getUsed())
      / Game.cpu.tickLimit
  );
}

function runOneTask(task, context, state) {
  const start = Game.cpu.getUsed();

  try {
    const value = task.run(context);
    return {
      name: task.name,
      tier: task.tier,
      status: 'ran',
      used: Game.cpu.getUsed() - start,
      value
    };
  } catch (error) {
    const failure = {
      tick: Game.time,
      name: task.name,
      tier: task.tier,
      message:
        error instanceof Error
          ? error.message.slice(0, 300)
          : String(error).slice(0, 300)
    };

    pushBounded(
      state.failures,
      failure,
      CPU_POLICY.failureLimit
    );

    return {
      name: task.name,
      tier: task.tier,
      status: 'failed',
      used: Game.cpu.getUsed() - start,
      failure
    };
  }
}

function runCpuScheduler(tasks) {
  const state = getSchedulerState();
  const previousMode = state.mode;
  const metrics = readCpuMetrics();
  const next = updateCpuMode(
    state,
    metrics,
    Game.time
  );

  state.mode = next.mode;
  state.modeSince = next.modeSince;
  state.candidateMode = next.candidateMode;
  state.candidateTicks = next.candidateTicks;

  if (next.changed) {
    const transition = {
      tick: Game.time,
      from: previousMode,
      to: next.mode,
      reason: next.reason,
      bucket: metrics.bucket,
      usedRatio: metrics.usedRatio
    };

    pushBounded(
      state.transitions,
      transition,
      CPU_POLICY.historyLimit
    );
    state.lastTransition = transition;
    state.pendingNotification = transition;
  }

  const recoveryAge = state.mode === CPU_MODE.RECOVERY
    ? Game.time - state.modeSince
    : 0;
  const orderedTasks = [...tasks].sort(
    (left, right) =>
      TIER_ORDER[left.tier] - TIER_ORDER[right.tier]
      || left.name.localeCompare(right.name)
  );
  const results = [];

  for (const task of orderedTasks) {
    if (
      typeof task.name !== 'string'
      || typeof task.run !== 'function'
      || !Object.prototype.hasOwnProperty.call(
        TIER_ORDER,
        task.tier
      )
    ) {
      results.push({
        name: task?.name ?? null,
        status: 'invalid-task'
      });
      continue;
    }

    const interval = taskIntervalFor(
      state.mode,
      task.tier,
      task.interval ?? 1,
      recoveryAge
    );

    if (interval === null) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'disabled-by-mode'
      });
      continue;
    }

    if (!isCadenceTick(task.name, interval)) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'waiting-for-cadence',
        interval
      });
      continue;
    }

    if (
      task.tier !== TASK_TIER.CRITICAL
      && remainingCpuRatio()
        < CPU_POLICY.nonCriticalHeadroom
    ) {
      results.push({
        name: task.name,
        tier: task.tier,
        status: 'insufficient-headroom'
      });
      continue;
    }

    results.push(
      runOneTask(
        task,
        {
          mode: state.mode,
          metrics,
          recoveryAge
        },
        state
      )
    );
  }

  state.lastTick = {
    tick: Game.time,
    mode: state.mode,
    bucketBefore: metrics.bucket,
    usedBefore: metrics.used,
    usedAfter: Game.cpu.getUsed(),
    resultCount: results.length
  };

  return {
    mode: state.mode,
    changed: next.changed,
    reason: next.reason,
    metrics,
    results
  };
}

module.exports = {
  CPU_MODE,
  TASK_TIER,
  runCpuScheduler,
  selectDesiredCpuMode,
  updateCpuMode,
  taskIntervalFor
};
```

## 在主循环中怎样接入

把现有业务模块作为回调交给调度器。下面的模块名只是接口示例，需要替换成自己的文件名和导出函数。

```js
const cpuScheduler = require('cpu.scheduler');
const spawnEmergency = require('spawn.emergency');
const spawnManager = require('spawn.manager');
const defenseManager = require('defense.manager');
const creepManager = require('creep.manager');
const roomEconomy = require('room.economy');
const marketScanner = require('market.scanner');
const pathPlanner = require('path.planner');
const roomVisuals = require('room.visuals');

module.exports.loop = function () {
  const summary = cpuScheduler.runCpuScheduler([
    {
      name: 'spawn-emergency',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () => spawnEmergency.run()
    },
    {
      name: 'spawn-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () => spawnManager.run()
    },
    {
      name: 'defense-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () => defenseManager.run()
    },
    {
      name: 'creep-manager',
      tier: cpuScheduler.TASK_TIER.CRITICAL,
      interval: 1,
      run: () => creepManager.run()
    },
    {
      name: 'room-economy',
      tier: cpuScheduler.TASK_TIER.IMPORTANT,
      interval: 1,
      run: () => roomEconomy.run()
    },
    {
      name: 'market-scan',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 50,
      run: () => marketScanner.run()
    },
    {
      name: 'path-planner',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 100,
      run: () => pathPlanner.run()
    },
    {
      name: 'room-visuals',
      tier: cpuScheduler.TASK_TIER.OPTIONAL,
      interval: 1,
      run: () => roomVisuals.run()
    }
  ]);

  if (summary.changed || Game.time % 100 === 0) {
    console.log(JSON.stringify({
      type: 'cpu-scheduler',
      tick: Game.time,
      mode: summary.mode,
      reason: summary.reason,
      bucket: summary.metrics.bucket,
      usedRatio: summary.metrics.usedRatio,
      results: summary.results
    }));
  }
};
```

## 为什么关键任务仍然要排在前面

即使关键任务不受模式禁用，它们仍应在任务列表排序后优先执行。原因是：

- 当前 tick 的 CPU 可能已经很紧张；
- 某个关键任务仍可能比预期更贵；
- 非关键任务的保护检查只对“下一项是否启动”有效；
- 调度器无法把已经消耗的 CPU 退回 bucket。

关键任务内部也应有自己的成本边界。例如防御模块不应在每个 Tower 上重复进行全房间大排序；Spawn 管理器也不应被多个房间模块重复调用。

## 异常隔离不等于异常已经解决

示例会捕获单个任务异常，并把任务名称、等级、tick 和错误消息写入有界历史。这样一个可选任务报错时，不会直接阻止后面的 Spawn 或防御任务。

但 `status: 'failed'` 不代表问题已经安全处理。关键任务失败时仍应：

- 保留完整错误上下文；
- 观察失败是否连续出现；
- 在状态变化或重复失败达到阈值时使用 [Game.notify() 限频提醒](/blog/screeps-game-notify)；
- 修复根因，而不是长期依赖 `try...catch` 隐藏错误。

## 为什么任务要错峰，而不是只设置 interval

假设三个高成本任务都设置为每 100 tick 执行：

```js
if (Game.time % 100 === 0) {
  runMarketScan();
  rebuildPaths();
  writeStatistics();
}
```

它们仍会在同一个 tick 形成高峰。

示例用任务名称生成稳定 offset：

```text
market-scan 可能在余数 17 执行
path-planner 可能在余数 63 执行
statistics 可能在余数 84 执行
```

这不是随机值。同一个任务名称会保持相同 offset，便于复现和诊断。

## 模式变化怎样记录和提醒

只在模式真正变化时保存：

```js
{
  tick,
  from,
  to,
  reason,
  bucket,
  usedRatio
}
```

不要每 tick 发送“bucket 仍然很低”。推荐状态变化：

```text
NORMAL → CONSERVE
CONSERVE → EMERGENCY
EMERGENCY → RECOVERY
RECOVERY → NORMAL
RECOVERY → CONSERVE
```

调度器示例只保存 `pendingNotification`，没有自动调用 `Game.notify()`。这样可以把提醒频率、合并策略和收件行为交给专门的通知模块，而不是让性能模块自己刷屏。

## 怎样判断降载是否真的有效

至少持续观察：

- bucket 是否停止单向下降；
- 每 100 或 500 tick 的平均 `Game.cpu.getUsed()`；
- CPU 峰值是否减少；
- 关键任务失败数是否增加；
- Spawn、采集、Controller 和防御是否仍正常；
- 模式切换是否过于频繁；
- `RECOVERY` 是否反复退回 `CONSERVE`。

“进入紧急模式后 bucket 上升”仍不能证明每个房间行为正确。CPU 恢复与房间功能验证是两组证据。

## 离线验证记录

本次执行了 27 个离线场景：

1. 正常 bucket 和低已用比例保持 `NORMAL`；
2. bucket 低于保守阈值进入候选 `CONSERVE`；
3. 已用比例过高进入候选 `CONSERVE`；
4. bucket 低于紧急阈值进入候选 `EMERGENCY`；
5. 硬性极低 bucket 立即进入 `EMERGENCY`；
6. 硬性高已用比例立即进入 `EMERGENCY`；
7. 无效 CPU 指标按紧急状态处理；
8. 第一个降载样本只累计候选；
9. 第二个样本仍不切换；
10. 第三个连续样本完成降载；
11. 指标恢复后清除未完成候选；
12. 硬性风险绕过连续确认；
13. 紧急模式满足恢复条件后产生 `RECOVERY` 候选；
14. 恢复确认和最短保持条件同时满足后切换；
15. 恢复失败退回 `CONSERVE`；
16. 恢复稳定后进入 `NORMAL`；
17. 最短模式保持时间阻止过早恢复；
18. 损坏模式状态可安全归一化；
19. 关键任务在正常模式保持原频率；
20. 关键任务在紧急模式仍保持原频率；
21. 重要任务在保守模式降频；
22. 重要任务在紧急模式进一步降频；
23. 可选任务在紧急模式停止；
24. 可选任务在恢复预热期停止；
25. 恢复预热完成后可选任务低频重启；
26. 正常模式保留任务原始 interval；
27. 未知任务等级被拒绝。

完整调度器还通过了 JavaScript 语法检查。离线 Node.js 无法生成真实 Screeps CPU 单位，也不能证明官方 shard 中 bucket 会按预期恢复。

## 常见错误

### 把所有任务都放进 bucket 条件

这会让 CPU 紧张时停止采集、Spawn 恢复和防御，系统失去自救能力。

### 只设置一个进入和退出阈值

阈值附近会频繁切换模式，产生额外高峰和日志噪声。

### bucket 一恢复就一次性打开所有任务

市场扫描、路径预计算和可视化可能在同一 tick 重新制造高峰。应使用 `RECOVERY` 和错峰。

### 只看 bucket，不看代码段成本

降载只能延缓问题。仍需用 [CPU 测量文章](/blog/screeps-cpu-getused-bucket) 找出真正高成本模块。

### 把 try...catch 当成修复

异常被记录后仍需要处理。静默忽略关键任务失败只会让系统表现得“没有报错但也不工作”。

### 每 tick 写大量 Memory 和日志

调度器本身也有成本。历史数组必须有上限，详细结果应按固定间隔输出，模式没有变化时不要重复通知。

## 适用边界

本文提供的是单 shard、账号级 CPU 降载起点，不覆盖：

- 多 shard CPU 分配策略；
- 精确预测下一 tick 的 CPU；
- 官方 shard 和私服参数差异；
- V8 垃圾回收和堆内存分析；
- 每个业务模块内部的性能优化；
- 战斗状态下动态提升任务等级；
- 外部长期监控数据库；
- 真实主循环中的 bucket 恢复证明。

如果 `EMERGENCY` 持续很久，应继续定位高成本模块，而不是不断降低更多关键功能。

## 总结

CPU 降载的核心不是“bucket 低就少运行一点”，而是建立清晰的生存顺序：

```text
关键任务始终运行
→ 重要任务逐级降频
→ 可选任务停止
→ 指标稳定后进入恢复期
→ 高成本任务错峰重启
```

现有 CPU 监控页负责告诉你系统正在消耗多少；本文的状态机负责在指标恶化时决定下一项任务是否应该启动。两者结合，才能把 CPU 观察变成可验证的运行策略。

## 官方参考资料

- [How does CPU limit work](https://docs.screeps.com/cpu-limit.html)
- [Game.cpu API](https://docs.screeps.com/api/#Game.cpu)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Global Objects and Memory parsing](https://docs.screeps.com/global-objects.html)
- [Scripting basics](https://docs.screeps.com/scripting-basics.html)
