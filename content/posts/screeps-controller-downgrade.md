---
title: "Controller 快降级了怎么办：监控、应急升级与恢复条件"
description: "监控己方Controller.ticksToDowngrade和等级上限，从当前房间选择有Energy与有效WORK部件的Upgrader，并处理upgradeController()范围和全部返回值。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Controller"
  - "升级"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（风险阈值、Controller状态、Upgrader筛选与恢复状态，不是Screeps官方服务器）"
  testResult: "非己方Controller、阈值以上、无可用升级者、Energy不足、无WORK部件、范围不足和风险恢复场景通过。"
featured: false
---

己方Controller的 `ticksToDowngrade` 表示距离下一次降级还有多少 tick。它持续下降到0时，Controller等级会降低；若低等级房间继续失去控制，可能最终失去房间。

本文只解决一个问题：怎样在 `ticksToDowngrade` 低于自定义阈值时，临时提高升级优先级，并在风险解除后退出应急状态。

## 先区分三个数值

| 数值 | 含义 |
|---|---|
| `controller.level` | 当前RCL |
| `controller.ticksToDowngrade` | 当前距离降级的剩余tick |
| `CONTROLLER_DOWNGRADE[level]` | 当前等级允许的最大降级计时 |

`CONTROLLER_DOWNGRADE`是全局常量表，不是当前状态。

可以计算当前剩余比例：

```js
function getDowngradeRatio(controller) {
  const maximum = CONTROLLER_DOWNGRADE[
    controller.level
  ];

  if (!Number.isFinite(maximum) || maximum <= 0) {
    return null;
  }

  return controller.ticksToDowngrade / maximum;
}
```

绝对阈值和比例阈值各有用途。本文使用绝对tick阈值，便于直接判断还剩多少时间。

## 阈值不是官方推荐值

示例配置：

```js
Memory.controllerSafety ??= {};
Memory.controllerSafety.W1N1 = {
  enabled: true,
  emergencyThreshold: 5000,
  recoveryThreshold: 10000
};
```

- 低于 `emergencyThreshold`：进入应急升级；
- 达到 `recoveryThreshold`：退出应急状态。

恢复阈值高于进入阈值，可以避免状态在边界附近反复切换。这种差值称为滞回，但读者不需要额外框架就能使用。

两个数值都是本站策略，不是官方安全线。

## 怎样选择可用升级者

候选Creep至少需要：

- 属于当前房间；
- `memory.role === 'upgrader'`；
- Store中有Energy；
- 至少一个有效WORK部件；
- 当前不是生成中的Creep。

```js
function selectEmergencyUpgrader(room, controller) {
  const candidates = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.memory?.role === 'upgrader'
      && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
      && creep.getActiveBodyparts(WORK) > 0
      && creep.spawning !== true
  });

  return candidates.sort((left, right) => {
    const energyDifference =
      right.store.getUsedCapacity(RESOURCE_ENERGY)
      - left.store.getUsedCapacity(RESOURCE_ENERGY);

    if (energyDifference !== 0) {
      return energyDifference;
    }

    return left.pos.getRangeTo(controller)
      - right.pos.getRangeTo(controller);
  })[0] || null;
}
```

角色名来自项目Memory，不是官方字段。使用其他命名时需要替换。

## 可离线测试的风险状态

```js
function evaluateDowngradeRisk(input) {
  const {
    owned,
    ticksToDowngrade,
    emergencyThreshold,
    recoveryThreshold,
    emergencyActive
  } = input;

  if (!owned || !Number.isFinite(ticksToDowngrade)) {
    return {
      active: false,
      reason: 'controller-unavailable'
    };
  }

  if (
    !Number.isFinite(emergencyThreshold)
    || !Number.isFinite(recoveryThreshold)
    || emergencyThreshold <= 0
    || recoveryThreshold <= emergencyThreshold
  ) {
    return {
      active: false,
      reason: 'invalid-thresholds'
    };
  }

  if (emergencyActive) {
    return ticksToDowngrade >= recoveryThreshold
      ? { active: false, reason: 'recovered' }
      : { active: true, reason: 'risk-continues' };
  }

  return ticksToDowngrade < emergencyThreshold
    ? { active: true, reason: 'risk-entered' }
    : { active: false, reason: 'normal' };
}
```

## 完整示例

代码放入现有 `main` 模块。

```js
function evaluateDowngradeRisk(input) {
  const {
    owned,
    ticksToDowngrade,
    emergencyThreshold,
    recoveryThreshold,
    emergencyActive
  } = input;

  if (!owned || !Number.isFinite(ticksToDowngrade)) {
    return {
      active: false,
      reason: 'controller-unavailable'
    };
  }

  if (
    !Number.isFinite(emergencyThreshold)
    || !Number.isFinite(recoveryThreshold)
    || emergencyThreshold <= 0
    || recoveryThreshold <= emergencyThreshold
  ) {
    return {
      active: false,
      reason: 'invalid-thresholds'
    };
  }

  if (emergencyActive) {
    return ticksToDowngrade >= recoveryThreshold
      ? { active: false, reason: 'recovered' }
      : { active: true, reason: 'risk-continues' };
  }

  return ticksToDowngrade < emergencyThreshold
    ? { active: true, reason: 'risk-entered' }
    : { active: false, reason: 'normal' };
}

function selectEmergencyUpgrader(room, controller) {
  const candidates = room.find(FIND_MY_CREEPS, {
    filter: creep =>
      creep.memory?.role === 'upgrader'
      && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
      && creep.getActiveBodyparts(WORK) > 0
      && creep.spawning !== true
  });

  return candidates.sort((left, right) => {
    const energyDifference =
      right.store.getUsedCapacity(RESOURCE_ENERGY)
      - left.store.getUsedCapacity(RESOURCE_ENERGY);

    if (energyDifference !== 0) {
      return energyDifference;
    }

    return left.pos.getRangeTo(controller)
      - right.pos.getRangeTo(controller);
  })[0] || null;
}

function runControllerSafety(room) {
  const controller = room.controller;
  const config = Memory.controllerSafety?.[room.name];

  if (
    !controller
    || controller.my !== true
    || !config
    || config.enabled !== true
  ) {
    return;
  }

  config.emergencyActive ??= false;

  const decision = evaluateDowngradeRisk({
    owned: controller.my,
    ticksToDowngrade: controller.ticksToDowngrade,
    emergencyThreshold: config.emergencyThreshold,
    recoveryThreshold: config.recoveryThreshold,
    emergencyActive: config.emergencyActive
  });

  config.emergencyActive = decision.active;
  config.lastReason = decision.reason;
  config.lastCheckedAt = Game.time;
  config.lastTicksToDowngrade =
    controller.ticksToDowngrade;

  if (!decision.active) {
    return;
  }

  const upgrader = selectEmergencyUpgrader(
    room,
    controller
  );

  if (!upgrader) {
    config.lastAction = 'no-ready-upgrader';
    return;
  }

  const result = upgrader.upgradeController(controller);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = upgrader.moveTo(controller, {
      range: 3,
      reusePath: 5
    });

    config.lastAction = 'moving';
    config.lastMoveResult = moveResult;
    return;
  }

  config.lastAction = result === OK
    ? 'upgrade-accepted'
    : 'upgrade-failed';
  config.lastResult = result;
  config.lastResultAt = Game.time;

  if (result !== OK) {
    console.log({
      type: 'controller-safety-upgrade-failed',
      roomName: room.name,
      creep: upgrader.name,
      ticksToDowngrade: controller.ticksToDowngrade,
      result
    });
  }
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;

  if (!room) {
    return;
  }

  runControllerSafety(room);
};
```

## 为什么恢复阈值要更高

只有一个阈值时，状态可能这样变化：

```text
4999 → 进入应急
5001 → 退出应急
4998 → 再次进入
```

使用5000进入、10000恢复后，系统会持续升级到更安全的位置再退出。

实际恢复阈值应结合：

- Creep升级能力；
- Controller最大计时；
- Energy供应；
- 房间收入；
- 其他紧急任务。

## `upgradeController()`怎样恢复计时

每次成功升级除了增加Controller进度，也会增加 `ticksToDowngrade`，直到当前等级允许的最大值。

恢复量与官方常量有关，不应根据一次画面变化猜测。应在下一tick重新读取：

```js
controller.ticksToDowngrade
```

不要在当前tick调用后直接写入自己预测的剩余值。

## 返回值

| 返回值 | 常见原因 | 处理方向 |
|---|---|---|
| `OK` | 升级命令已提交 | 下一tick查看进度与降级计时 |
| `ERR_NOT_OWNER` | Creep不是自己的 | Creep所有权 |
| `ERR_BUSY` | Creep仍在生成 | `creep.spawning` |
| `ERR_NOT_ENOUGH_RESOURCES` | Creep没有Energy | Store与补给 |
| `ERR_INVALID_TARGET` | Controller不是有效目标 | 当前房间Controller状态 |
| `ERR_NOT_IN_RANGE` | 超过3格 | 移动到范围3 |
| `ERR_NO_BODYPART` | 没有有效WORK部件 | 身体与受伤状态 |

应急升级不能只处理距离。Energy链断裂和升级者死亡通常才是风险持续的根因。

## 没有可用Upgrader时怎么办

本文只记录：

```text
no-ready-upgrader
```

它不会自动孵化新Creep。完整恢复系统还需要判断：

- Spawn是否存在且可用；
- 当前Energy能否生成最小升级者；
- 是否已经没有采集者；
- 升级者是否在运输途中；
- Controller附近是否有Container或Link；
- 房间是否处于断代恢复阶段。

这些内容应与Spawn应急恢复文章组合，而不是塞进一个Controller监控函数。

## 离线模拟结果

构建检查覆盖：

1. Controller不属于自己；
2. 阈值配置无效；
3. 正常状态高于进入阈值；
4. 首次低于阈值进入应急；
5. 应急状态未达到恢复线；
6. 达到恢复线后退出；
7. 没有Energy的Creep被排除；
8. 没有有效WORK部件的Creep被排除；
9. Energy更多者优先，同能量时距离更近者优先。

离线模拟没有调用真实 `upgradeController()`，也没有验证Controller长期计时变化。

## 常见误区

### 阈值写成官方推荐值

本文数值只是房间策略。

### 只在风险tick临时找一只固定名称Creep

固定Creep可能已经死亡、没有Energy或没有有效WORK部件。

### 达到进入阈值就立刻退出

会在边界附近反复切换，应设置更高恢复线。

### 只调用升级，不检查Energy供应

根因可能是采集、运输或Spawn断代。

### 移动到相邻格

升级范围是3，不需要强制移动到1格。

### 一次 `OK` 就认为风险解除

需要持续观察到恢复阈值。

## 适用边界

本文没有实现：

- 自动孵化升级者；
- Link与Container补给；
- 多升级者分配；
- 升级Boost；
- 房间断代完整恢复；
- 多房间优先级；
- Safe Mode与战斗联动；
- 长期Controller监控图表。

JavaScript语法和风险状态离线模拟已经通过。真实升级、降级计时与多tick恢复仍待Screeps环境验证。

## 相关站内内容

- [怎样自动升级Controller](/blog/screeps-upgrade-controller)
- [房间断代后怎么恢复第一只采集者](/blog/screeps-spawn-emergency-recovery)
- [Game.notify()怎么发送提醒](/blog/screeps-game-notify)
- [Screeps Memory是什么](/blog/screeps-memory-basics)
- [Creep为什么有fatigue](/blog/screeps-move-fatigue-body-ratio)
- [进入Controller与房间控制模块](/knowledge/controller-control)

## 官方资料

- [Control](https://docs.screeps.com/control.html)
- [StructureController API](https://docs.screeps.com/api/#StructureController)
- [Creep.upgradeController API](https://docs.screeps.com/api/#Creep.upgradeController)

资料核对日期：2026-07-22。离线风险状态模拟已通过；真实Controller恢复仍待Screeps环境验证。
