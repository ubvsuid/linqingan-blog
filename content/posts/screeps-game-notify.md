---
title: "Game.notify() 怎么发送可靠的限频提醒"
description: "解释 Game.notify() 的1000字符、每tick 20条和 groupInterval 分钟规则，并用状态变化、Memory与重复间隔避免 Controller 风险提醒刷屏。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Game API"
  - "通知"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（提醒状态机与消息截断，不是 Screeps 官方服务器）"
  testResult: "首次进入风险、持续风险、恢复、再次进入、重复间隔和1000字符限制场景通过。"
featured: false
---

`Game.notify(message, groupInterval)` 用于把重要事件加入账号通知队列。它适合处理需要离开 Console 后仍能看到的异常，例如 Controller接近降级、关键房间断代、Terminal长期停摆或敌对玩家进入重要房间。

本文只解决一个问题：怎样让 Controller风险提醒在**首次进入风险、持续过久和恢复后再次触发**时发送，而不是每 tick 重复调用 `Game.notify()`。

## 先核对官方限制

| 项目 | 官方规则 |
|---|---|
| 单条消息长度 | 最多1000字符 |
| 单 tick 可安排数量 | 最多20条 |
| `groupInterval`单位 | 分钟 |
| 默认 `groupInterval` | `0`，立即安排 |
| Simulation Room | 不可用 |

`groupInterval`不是游戏tick数。例如：

```js
Game.notify('important alert', 60);
```

这里的 `60`表示60分钟，不是60 tick。

API参考没有为 `Game.notify()`列出一组可用于判断送达成功的返回码。因此不能通过：

```js
const result = Game.notify('message');
```

来证明邮件或通知已经到达。真正能离线验证的是“代码在什么条件下调用通知”，不是外部渠道送达。

## 为什么只依赖 `groupInterval` 不够

`groupInterval`控制通知队列的合并时间，但业务条件仍可能每 tick 调用一次。

如果100个房间在同一 tick 都调用通知，还可能碰到每 tick 20条上限。更稳妥的设计需要三层限制：

```text
状态变化
只在从正常进入风险时立即提醒

重复间隔
风险持续很久时允许再次提醒

groupInterval
让通知系统在指定分钟窗口内合并发送
```

## 先把提醒判断写成纯函数

```js
function evaluateControllerAlert(input) {
  const {
    ticksToDowngrade,
    threshold,
    currentTick,
    previousState,
    repeatAfterTicks
  } = input;

  const previous = previousState || {
    active: false,
    lastSentTick: null
  };

  const isRisk = Number.isFinite(ticksToDowngrade)
    && ticksToDowngrade < threshold;

  if (!isRisk) {
    return {
      shouldNotify: false,
      reason: previous.active ? 'recovered' : 'normal',
      nextState: {
        active: false,
        lastSentTick: previous.lastSentTick
      }
    };
  }

  const firstEntry = previous.active !== true;
  const lastSentTick = Number.isInteger(previous.lastSentTick)
    ? previous.lastSentTick
    : null;
  const repeatDue =
    lastSentTick !== null
    && currentTick - lastSentTick >= repeatAfterTicks;

  const shouldNotify = firstEntry || repeatDue;

  return {
    shouldNotify,
    reason: firstEntry
      ? 'entered-risk'
      : repeatDue
        ? 'repeat-due'
        : 'risk-active',
    nextState: {
      active: true,
      lastSentTick: shouldNotify
        ? currentTick
        : lastSentTick
    }
  };
}
```

这个函数不读取 `Game`或 `Memory`，因此可以离线测试。

## 消息必须主动限制长度

```js
function normalizeNotificationMessage(message) {
  const text = String(message);

  if (text.length <= 1000) {
    return text;
  }

  return `${text.slice(0, 997)}...`;
}
```

不要假设房间状态、错误堆栈和序列化对象拼接后一定小于1000字符。

## 完整示例：Controller风险提醒

代码放在 `main` 模块。示例阈值和重复间隔是本站演示值，不是官方推荐值。

```js
const CONTROLLER_ALERT_THRESHOLD = 5000;
const CONTROLLER_ALERT_REPEAT_TICKS = 5000;
const NOTIFICATION_GROUP_MINUTES = 60;

function evaluateControllerAlert(input) {
  const {
    ticksToDowngrade,
    threshold,
    currentTick,
    previousState,
    repeatAfterTicks
  } = input;

  const previous = previousState || {
    active: false,
    lastSentTick: null
  };

  const isRisk = Number.isFinite(ticksToDowngrade)
    && ticksToDowngrade < threshold;

  if (!isRisk) {
    return {
      shouldNotify: false,
      reason: previous.active ? 'recovered' : 'normal',
      nextState: {
        active: false,
        lastSentTick: previous.lastSentTick
      }
    };
  }

  const firstEntry = previous.active !== true;
  const lastSentTick = Number.isInteger(previous.lastSentTick)
    ? previous.lastSentTick
    : null;
  const repeatDue =
    lastSentTick !== null
    && currentTick - lastSentTick >= repeatAfterTicks;

  const shouldNotify = firstEntry || repeatDue;

  return {
    shouldNotify,
    reason: firstEntry
      ? 'entered-risk'
      : repeatDue
        ? 'repeat-due'
        : 'risk-active',
    nextState: {
      active: true,
      lastSentTick: shouldNotify
        ? currentTick
        : lastSentTick
    }
  };
}

function normalizeNotificationMessage(message) {
  const text = String(message);

  if (text.length <= 1000) {
    return text;
  }

  return `${text.slice(0, 997)}...`;
}

function checkControllerAlert(room) {
  const controller = room.controller;

  if (
    !controller
    || controller.my !== true
    || !Number.isFinite(controller.ticksToDowngrade)
  ) {
    return;
  }

  Memory.alerts ??= {};
  Memory.alerts.controller ??= {};

  const previousState =
    Memory.alerts.controller[room.name] || null;

  const decision = evaluateControllerAlert({
    ticksToDowngrade: controller.ticksToDowngrade,
    threshold: CONTROLLER_ALERT_THRESHOLD,
    currentTick: Game.time,
    previousState,
    repeatAfterTicks: CONTROLLER_ALERT_REPEAT_TICKS
  });

  Memory.alerts.controller[room.name] = decision.nextState;

  if (!decision.shouldNotify) {
    return;
  }

  const message = normalizeNotificationMessage(
    [
      '[controller-risk]',
      `room=${room.name}`,
      `ticksToDowngrade=${controller.ticksToDowngrade}`,
      `threshold=${CONTROLLER_ALERT_THRESHOLD}`,
      `reason=${decision.reason}`,
      `gameTick=${Game.time}`
    ].join(' ')
  );

  Game.notify(
    message,
    NOTIFICATION_GROUP_MINUTES
  );
}

module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    checkControllerAlert(room);
  }
};
```

## 这段代码什么时候会提醒

假设阈值是5000，重复间隔也是5000 tick：

| 状态变化 | 是否提醒 | 原因 |
|---|---|---|
| 6000 → 4900 | 是 | 首次进入风险 |
| 4900 → 4800 | 否 | 风险仍在，重复间隔未到 |
| 风险持续5000 tick | 是 | 允许重复提醒 |
| 4900 → 6000 | 否 | 记录恢复状态 |
| 6000 → 4900 | 是 | 恢复后再次进入风险 |

这比“每5000 tick固定提醒一次”更准确，因为正常状态不会产生无意义提醒。

## 为什么按房间保存状态

错误写法：

```js
Memory.alerts.lastControllerTick = Game.time;
```

多个房间共用一个时间，会产生相互抑制：A房间刚提醒后，B房间可能被错误跳过。

示例使用：

```js
Memory.alerts.controller[room.name]
```

为每个房间独立保存 `active`和 `lastSentTick`。

## 为什么状态先写入再调用通知

`Game.notify()`没有可用于确认送达的错误码。若脚本在后续代码中抛出异常，Memory在本 tick 的写入通常仍会由运行环境处理，但业务代码不应依赖“发送后一定继续执行”。

示例先确定并保存下一状态，再调用通知，目的是降低同一条件在下一 tick 再次被视为“首次进入”的概率。

这仍不证明外部邮件渠道已经送达，只能证明通知调用条件已经触发。

## 每 tick 20条上限怎样处理

房间较少时，上面的循环通常足够。房间、任务和报警类型很多时，应增加统一队列：

```js
function enqueueAlert(queue, alert) {
  if (!Array.isArray(queue)) {
    return [alert];
  }

  queue.push(alert);
  return queue;
}
```

随后按优先级排序，每 tick 最多提交20条，其余保留到下一 tick。

队列项至少应保存：

- 唯一键；
- 产生 tick；
- 优先级；
- 消息；
- 分组分钟数；
- 过期 tick；
- 是否已经提交。

本文不实现完整通知调度器，但不能在大型系统中假设所有模块各自调用都不会超过上限。

## `groupInterval` 与 Memory 间隔的职责不同

```text
Memory中的repeatAfterTicks
决定业务代码多久允许再次调用

groupInterval
决定通知系统怎样按分钟组织发送
```

一个使用游戏tick，一个使用现实分钟。不能用同一个数字表达同一含义。

## 哪些事件适合通知

适合：

- Controller接近降级；
- 关键房间没有可工作的 Creep；
- Spawn长时间无法恢复；
- 重要防御事件首次出现；
- Terminal或市场任务持续失败；
- CPU bucket长期进入危险区间。

不适合：

- 每次 `harvest()`返回 `OK`；
- 每个 Creep 的普通状态切换；
- 每 tick 的CPU样本；
- 能通过 Console临时排查的高频信息；
- 没有状态变化的重复数字。

## 没有收到通知时怎样排查

1. 确认代码分支确实执行；
2. 输出 `decision.reason`与 `shouldNotify`；
3. 检查 Memory里该房间的状态；
4. 检查消息是否超过1000字符；
5. 检查当前 tick 是否已有大量其他通知；
6. 确认不是在 Simulation Room；
7. 检查账号通知和邮箱设置；
8. 等待 `groupInterval`对应的组织时间；
9. 不要把 Console输出成功当作外部通知送达证明。

## 离线模拟结果

构建检查对纯函数覆盖：

1. 正常状态不提醒；
2. 首次进入风险立即提醒；
3. 持续风险且间隔未到不提醒；
4. 持续风险达到间隔后再次提醒；
5. 恢复后把 `active`重置；
6. 再次进入风险重新提醒；
7. 1000字符以内保持原文；
8. 超过1000字符时截断为1000字符。

离线模拟没有调用真实 `Game.notify()`，不能验证通知队列、邮箱或其他外部渠道。

## 常见误区

### 把 `groupInterval` 当成 tick

它的单位是分钟。

### 每 tick 都调用，再依赖通知系统处理

仍可能浪费调用额度，并碰到每 tick 20条限制。

### 多房间共用一个 `lastSentTick`

会让不同房间的提醒互相干扰。

### 没有恢复状态

风险解除后再次出现，代码可能因为旧 `active`一直为真而不再提醒。

### 把调用结果写成“通知已送达”

调用只安排通知，外部送达需要真实账号环境验证。

### 把完整错误对象直接拼进消息

可能超过1000字符，也可能包含大量重复信息。

## 适用边界

本文没有实现：

- 全站统一报警队列；
- 邮件送达确认；
- Webhook；
- 跨 shard 报警合并；
- 20条额度的全局抢占；
- 告警升级与自动恢复动作；
- 长期报警统计；
- 用户级通知偏好。

JavaScript语法和提醒状态机离线模拟已经通过。真实 `Game.notify()`调用、通知排队与外部送达仍待Screeps环境验证。

## 相关站内内容

- [Controller 为什么会降级](/blog/screeps-controller-downgrade)
- [Game.cpu.getUsed() 和 bucket 怎么监控](/blog/screeps-cpu-getused-bucket)
- [Room.getEventLog() 怎么读取上一tick事件](/blog/screeps-room-event-log)
- [房间断代后怎么恢复第一只采集者](/blog/screeps-spawn-emergency-recovery)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [进入工程配置与运行诊断模块](/knowledge/operations-debugging)

## 官方资料

- [Game.notify API](https://docs.screeps.com/api/#Game.notify)
- [StructureController API](https://docs.screeps.com/api/#StructureController)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线提醒状态模拟已通过；真实通知送达仍待环境验证。
