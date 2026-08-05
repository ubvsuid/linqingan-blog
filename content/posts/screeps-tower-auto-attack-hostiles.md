---
title: "Screeps Tower attack() 返回 OK 但伤害不足：距离衰减、集火与事件验证"
description: "当 Tower.attack() 返回 OK 但目标掉血很少时，计算 Range 5—20 距离衰减、OPERATE_TOWER 与 DISRUPT_TOWER、集火名义伤害，并用上一 tick Room.getEventLog() 核对精确 Tower 和实际事件目标。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-05"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Tower"
  - "防御"
  - "FIND_HOSTILE_CREEPS"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-05"
  testedAt: "2026-08-05"
  testEnvironment: "Node.js 22 离线模拟（Tower Range 5—20 衰减、POWER_INFO 直接乘数、集火总量、Rampart 事件目标、精确上一 tick 攻击与治疗事件；不是 Screeps 官方服务器）"
  testResult: "25 个距离、Power、集火、Rampart、事件窗口、部分匹配和输入边界场景通过；完整房间级 Tower 调度器通过 JavaScript 语法检查。真实 Tower 结算、TOUGH 身体顺序、敌方治疗和官方 shard 防御仍待验证。"
featured: false
---

`tower.attack(target)` 返回 `OK`，只表示这座 Tower 的攻击意图已被 API 接受。它不表示目标一定损失 600 hits，也不表示这一轮集火足以击杀目标。

这篇更新保留了旧文章“Tower 怎么自动攻击敌人”的目标筛选入口，并继续解决自动攻击进入生产环境后最常见的伤害诊断问题。

Tower 的原始攻击能力会受距离影响；Power 效果会继续修改输出；目标格上的 Rampart 可能接管实际伤害；TOUGH、Boost、敌方治疗和其他同 tick 事件还会改变最终 `hits`。如果攻击、治疗与维修模块在同一 tick 争用同一座 Tower，仅查看某一次调用的返回值也不能证明最终业务意图。

本文解决一个明确问题：

> Tower 已经找到敌人，`attack()` 也返回 `OK`，但目标实际掉血为什么低于预期，以及怎样把“API 接受”“名义伤害估算”和“上一 tick 真实事件”分开记录。

## 快速结论

标准 Tower 攻击能力可以先按距离估算：

```text
Range 0—5：600
Range 6—19：从 600 线性下降
Range 20 及更远：150
```

稳定的诊断流程至少保存：

1. 每座 Tower 与目标的 Range；
2. 距离对应的基础伤害；
3. `POWER_INFO` 中当前 `PWR_OPERATE_TOWER` 与 `PWR_DISRUPT_TOWER` 的直接乘数；
4. `tower.attack()` 的正式返回值；
5. 只有返回 `OK` 的 Tower ID；
6. 用户代码指定的目标 ID；
7. Rampart 接管伤害时的实际事件目标 ID；
8. 下一 tick 中精确 Tower—事件目标组合的 `EVENT_ATTACK`；
9. 原目标收到的治疗事件；
10. 目标后续 `hits` 只作为净状态参考。

不要使用：

```js
const damage = towers.length * 600;
```

它只在所有 Tower 都位于 Range 5 以内、没有 Power 修改、没有 Rampart 接管、所有意图均被接受且暂时忽略目标减伤与治疗时才接近名义输出。

## 为什么更新旧文章而不是新建页面

本页原本只回答“怎样筛选敌人、按威胁排序并调用 `attack()`”。站内已经另有：

- [Tower 治疗己方 Creep](/blog/screeps-tower-heal-creeps)；
- [Tower 按阈值维修建筑](/blog/screeps-tower-repair-threshold)；
- Tower 伤害、治疗与维修计算器；
- [Room.getEventLog() 事件诊断](/blog/screeps-room-event-log)。

再创建一个“Tower 伤害不足”URL，会让两个页面同时覆盖 Tower 攻击、距离、返回值和事件验证。更合理的处理是保留原 Slug：

```text
/blog/screeps-tower-auto-attack-hostiles
```

并把旧页升级为完整攻击诊断流程。这样目标筛选搜索意图仍由本页承担，同时补齐中文文章、英文深度页和站内计算工具之间的内容断层。

## `OK` 到底证明了什么

`StructureTower.attack(target)` 的目标必须是同房间内可攻击的 Creep、Power Creep 或结构。调用返回 `OK` 时，可以记录：

```text
这座 Tower 在当前 tick 提交了一个被 API 接受的攻击请求
```

不能直接记录：

```text
目标已经受到预计伤害
目标一定会在下一 tick 死亡
本轮所有 Tower 都完成了集火
```

世界状态在脚本阶段之后结算。真正的攻击事件应在下一 tick 读取上一 tick 的 `Room.getEventLog()`。

## 精确距离衰减公式

标准常量为：

```text
TOWER_POWER_ATTACK = 600
TOWER_OPTIMAL_RANGE = 5
TOWER_FALLOFF_RANGE = 20
TOWER_FALLOFF = 0.75
TOWER_ENERGY_COST = 10
```

Range 使用 `RoomPosition.getRangeTo()` 的房间内距离。基础攻击量可写成：

```js
function towerAttackAtRange(range) {
  if (!Number.isInteger(range) || range < 0) return null;

  if (range <= TOWER_OPTIMAL_RANGE) {
    return TOWER_POWER_ATTACK;
  }

  if (range >= TOWER_FALLOFF_RANGE) {
    return Math.floor(
      TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF)
    );
  }

  const progress =
    (range - TOWER_OPTIMAL_RANGE)
    / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);

  return Math.floor(
    TOWER_POWER_ATTACK
    * (1 - TOWER_FALLOFF * progress)
  );
}
```

常见距离结果：

| Range | 单座 Tower 基础攻击 |
|---:|---:|
| 5 | 600 |
| 6 | 570 |
| 10 | 450 |
| 15 | 300 |
| 20 | 150 |
| 25 | 150 |

Tower 可以攻击同房间远处目标，因此不会因为距离超过 20 直接返回 `ERR_NOT_IN_RANGE`。距离改变的是效果，不是同房间攻击资格。

## `POWER_INFO` 存放的是直接乘数

`PWR_OPERATE_TOWER` 增强 Tower，`PWR_DISRUPT_TOWER` 降低 Tower 效率。需要特别注意：

```text
POWER_INFO[PWR_OPERATE_TOWER].effect[level - 1]
POWER_INFO[PWR_DISRUPT_TOWER].effect[level - 1]
```

返回的是直接乘数，例如一级效果分别是 `1.1` 与 `0.9`。不能再次写成 `1 + 1.1` 或 `1 - 0.9`。

```js
function getActiveTowerPowerMultiplier(tower, power) {
  const effect = tower.effects?.find(item =>
    item.effect === power
    && item.ticksRemaining > 0
  );

  if (!effect) return 1;

  const effectTable = POWER_INFO[power]?.effect;
  const multiplier = Array.isArray(effectTable)
    ? effectTable[effect.level - 1]
    : null;

  return Number.isFinite(multiplier)
    ? multiplier
    : 1;
}
```

正确估算顺序为：

```text
距离基础量
× OPERATE_TOWER 直接乘数
× DISRUPT_TOWER 直接乘数
→ 最后向下取整
```

例如 Range 5 的 600 伤害同时受到一级增强与一级干扰：

```text
floor(600 × 1.1 × 0.9) = 594
```

该结果仍是 Tower 名义输出，不是原目标最终失去的 hits。

## Rampart 会改变实际攻击事件目标

Screeps 引擎处理 Tower 攻击时，会检查目标坐标是否存在 Rampart。若存在，伤害会转向该 Rampart。

因此需要区分：

```text
targetId
用户代码传给 tower.attack() 的业务目标
用于观察原 Creep 的治疗和后续 hits

eventTargetId
引擎实际承受伤害的对象
目标格有 Rampart 时为 Rampart ID，否则等于 targetId
```

```js
function getTowerEventTargetId(target) {
  const rampart = target.pos.lookFor(LOOK_STRUCTURES)
    .find(structure =>
      structure.structureType === STRUCTURE_RAMPART
    );

  return rampart?.id ?? target.id;
}
```

若仍用原 Creep ID 匹配 `EVENT_ATTACK.data.targetId`，有效攻击会被误判为 `missing`，记录的事件伤害也会变成 0。

## 为什么目标掉血少于名义伤害

### Tower 距离比预想更远

三座 Tower 分别处于 Range 5、10、20 时，名义总量是：

```text
600 + 450 + 150 = 1200
```

不是 `3 × 600 = 1800`。

### 目标格存在 Rampart

此时 Tower 的伤害可能落到 Rampart，而不是原 Creep。原 Creep `hits` 不下降并不表示 Tower 没有产生攻击事件。

### 目标拥有有效 TOUGH 部件

TOUGH Boost 会减少进入身体的伤害。具体结算依赖活跃 TOUGH 数量、Boost 等级、身体顺序、当前部件 hits 和其他伤害来源。本文不只凭身体数组伪造最终 hits。

### 敌方同 tick 接受治疗

敌方 HEAL Creep、Power Creep 或其他治疗来源可能抵消部分伤害。最终：

```text
targetHitsBefore - targetHitsAfter
```

是整 tick 净变化，不等于 Tower 单独造成的事件伤害。

### 并非所有 Tower 都真正返回 `OK`

Energy 不足、结构未激活、目标失效或其他 Tower 分支竞争都可能让部分调用失败。集火估算只能统计本次正式调用返回 `OK` 的 Tower。

### 错过上一 tick 事件窗口

`Room.getEventLog()` 返回上一 tick 事件。若在 `submittedAt + 2` 才检查，就不能把当前日志当作那次攻击的证据。

## 目标选择仍然要过滤外交关系

`FIND_HOSTILE_CREEPS` 表示非己方 Creep，不理解盟友、临时访客或房间级许可。保留自己的通行名单：

```js
function getAttackableHostiles(room) {
  const allowedUsers = new Set(
    Array.isArray(Memory.defense?.allowedUsers)
      ? Memory.defense.allowedUsers
      : []
  );

  return room.find(FIND_HOSTILE_CREEPS, {
    filter: creep =>
      creep.owner
      && !allowedUsers.has(creep.owner.username)
  });
}
```

本文继续使用活跃部件建立可解释的威胁分数，但权重属于本地策略：

```js
function getThreatScore(creep) {
  return (
    creep.getActiveBodyparts(ATTACK) * 5
    + creep.getActiveBodyparts(RANGED_ATTACK) * 5
    + creep.getActiveBodyparts(HEAL) * 4
    + creep.getActiveBodyparts(WORK) * 2
    + creep.getActiveBodyparts(CLAIM) * 3
  );
}
```

## 集火需要一个最终 Tower 调度入口

攻击、治疗和维修模块若各自遍历 Tower，会造成同一座 Tower 在同一 tick 被多段业务代码安排动作。更稳定的顺序是：

```text
先检测敌人
→ 有敌人时分配攻击
→ 没有敌人时评估治疗
→ 最后评估维修
→ 每座 Tower 每 tick 只由一个调度器提交最终动作
```

本文完整示例只实现攻击分支。治疗和维修应接入同一个最终调度器，而不是在示例之后再次独立遍历 Tower。

## 完整房间级示例

下面的代码会：

- 验证上一 tick 的待观察集火；
- 防止同一房间同 tick 重复运行；
- 过滤有足够 Energy 且已激活的己方 Tower；
- 选择一个稳定目标；
- 计算距离和正确的 Power 直接乘数；
- 保存业务目标 ID 与实际事件目标 ID；
- 只把正式返回 `OK` 的 Tower 放入待验证记录；
- 下一 tick 按精确 Tower ID、`eventTargetId` 和攻击类型匹配事件；
- 单独统计原目标收到的治疗事件；
- 将历史限制为最近 20 条。

```js
const HISTORY_LIMIT = 20;

function towerAttackAtRange(range) {
  if (!Number.isInteger(range) || range < 0) return null;

  if (range <= TOWER_OPTIMAL_RANGE) {
    return TOWER_POWER_ATTACK;
  }

  if (range >= TOWER_FALLOFF_RANGE) {
    return Math.floor(
      TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF)
    );
  }

  const progress =
    (range - TOWER_OPTIMAL_RANGE)
    / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);

  return Math.floor(
    TOWER_POWER_ATTACK
    * (1 - TOWER_FALLOFF * progress)
  );
}

function getActiveTowerPowerMultiplier(tower, power) {
  const effect = tower.effects?.find(item =>
    item.effect === power
    && item.ticksRemaining > 0
  );

  if (!effect) return 1;

  const effectTable = POWER_INFO[power]?.effect;
  const multiplier = Array.isArray(effectTable)
    ? effectTable[effect.level - 1]
    : null;

  return Number.isFinite(multiplier)
    ? multiplier
    : 1;
}

function estimateTowerAttack(tower, target) {
  if (
    !tower
    || !target
    || tower.room.name !== target.room.name
  ) {
    return null;
  }

  const range = tower.pos.getRangeTo(target);
  const baseDamage = towerAttackAtRange(range);
  if (baseDamage === null) return null;

  const operateMultiplier = getActiveTowerPowerMultiplier(
    tower,
    PWR_OPERATE_TOWER
  );
  const disruptMultiplier = getActiveTowerPowerMultiplier(
    tower,
    PWR_DISRUPT_TOWER
  );
  const estimatedDamage = Math.floor(
    baseDamage
    * operateMultiplier
    * disruptMultiplier
  );

  return {
    towerId: tower.id,
    range,
    baseDamage,
    operateMultiplier,
    disruptMultiplier,
    estimatedDamage
  };
}

function getThreatScore(creep) {
  return (
    creep.getActiveBodyparts(ATTACK) * 5
    + creep.getActiveBodyparts(RANGED_ATTACK) * 5
    + creep.getActiveBodyparts(HEAL) * 4
    + creep.getActiveBodyparts(WORK) * 2
    + creep.getActiveBodyparts(CLAIM) * 3
  );
}

function getAttackableHostiles(room) {
  const allowedUsers = new Set(
    Array.isArray(Memory.defense?.allowedUsers)
      ? Memory.defense.allowedUsers
      : []
  );

  return room.find(FIND_HOSTILE_CREEPS, {
    filter: creep =>
      creep.owner
      && !allowedUsers.has(creep.owner.username)
  });
}

function selectTowerTarget(towers, hostiles) {
  if (towers.length === 0 || hostiles.length === 0) {
    return null;
  }

  return [...hostiles].sort((left, right) => {
    const threatDifference =
      getThreatScore(right) - getThreatScore(left);
    if (threatDifference !== 0) return threatDifference;

    const leftRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(left))
    );
    const rightRange = Math.min(
      ...towers.map(tower => tower.pos.getRangeTo(right))
    );
    if (leftRange !== rightRange) return leftRange - rightRange;

    return left.id.localeCompare(right.id);
  })[0];
}

function getTowerEventTargetId(target) {
  const rampart = target.pos.lookFor(LOOK_STRUCTURES)
    .find(structure =>
      structure.structureType === STRUCTURE_RAMPART
    );

  return rampart?.id ?? target.id;
}

function getTowerAttackState(roomName) {
  Memory.towerAttackDiagnostics ??= {};
  Memory.towerAttackDiagnostics[roomName] ??= {
    lastRunTick: null,
    pending: null,
    history: []
  };

  return Memory.towerAttackDiagnostics[roomName];
}

function verifyPendingTowerVolley(room, state) {
  const pending = state.pending;
  if (!pending || pending.submittedAt >= Game.time) {
    return null;
  }

  if (Game.time !== pending.submittedAt + 1) {
    const missed = {
      ...pending,
      verifiedAt: Game.time,
      status: 'missed-event-window'
    };
    state.history.push(missed);
    state.history = state.history.slice(-HISTORY_LIMIT);
    state.pending = null;
    return missed;
  }

  const events = room.getEventLog();
  const expectedTowerIds = new Set(pending.towerIds);
  const attackEvents = events.filter(event =>
    event.event === EVENT_ATTACK
    && expectedTowerIds.has(event.objectId)
    && event.data?.targetId === pending.eventTargetId
    && event.data?.attackType === EVENT_ATTACK_TYPE_RANGED
  );
  const matchedTowerIds = new Set(
    attackEvents.map(event => event.objectId)
  );
  const eventDamage = attackEvents.reduce(
    (sum, event) =>
      sum + (
        Number.isFinite(event.data?.damage)
          ? event.data.damage
          : 0
      ),
    0
  );
  const healingEvents = events.filter(event =>
    event.event === EVENT_HEAL
    && event.data?.targetId === pending.targetId
  );
  const observedHealing = healingEvents.reduce(
    (sum, event) =>
      sum + (
        Number.isFinite(event.data?.amount)
          ? event.data.amount
          : 0
      ),
    0
  );
  const target = Game.getObjectById(pending.targetId);
  const eventTarget = Game.getObjectById(
    pending.eventTargetId
  );
  const record = {
    ...pending,
    verifiedAt: Game.time,
    status:
      matchedTowerIds.size === expectedTowerIds.size
        ? 'verified'
        : matchedTowerIds.size > 0
          ? 'partial'
          : 'missing',
    matchedTowerCount: matchedTowerIds.size,
    eventDamage,
    observedHealing,
    targetHitsAfter: target?.hits ?? null,
    eventTargetHitsAfter: eventTarget?.hits ?? null
  };

  state.history.push(record);
  state.history = state.history.slice(-HISTORY_LIMIT);
  state.pending = null;
  return record;
}

function runTowerAttackDiagnostics(room) {
  const state = getTowerAttackState(room.name);
  const verification = verifyPendingTowerVolley(room, state);

  if (state.lastRunTick === Game.time) {
    return {
      status: 'already-ran-this-tick',
      verification
    };
  }
  state.lastRunTick = Game.time;

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER
      && structure.isActive()
      && structure.store.getUsedCapacity(RESOURCE_ENERGY)
        >= TOWER_ENERGY_COST
  });

  if (towers.length === 0) {
    return { status: 'no-usable-tower', verification };
  }

  const target = selectTowerTarget(
    towers,
    getAttackableHostiles(room)
  );
  if (!target) {
    return { status: 'no-target', verification };
  }

  const accepted = [];
  const results = [];

  for (const tower of towers) {
    const estimate = estimateTowerAttack(tower, target);
    const result = tower.attack(target);
    results.push({
      towerId: tower.id,
      result,
      estimate
    });

    if (result === OK && estimate) {
      accepted.push(estimate);
    }
  }

  if (accepted.length > 0) {
    state.pending = {
      submittedAt: Game.time,
      roomName: room.name,
      targetId: target.id,
      eventTargetId: getTowerEventTargetId(target),
      targetOwner: target.owner?.username ?? null,
      targetHitsBefore: target.hits,
      towerIds: accepted.map(item => item.towerId),
      estimatedGrossDamage: accepted.reduce(
        (sum, item) => sum + item.estimatedDamage,
        0
      ),
      estimates: accepted
    };
  }

  return {
    status:
      accepted.length > 0
        ? 'attack-submitted'
        : 'attack-not-submitted',
    targetId: target.id,
    threatScore: getThreatScore(target),
    results,
    verification
  };
}

module.exports.loop = function () {
  for (const room of Object.values(Game.rooms)) {
    if (room.controller?.my !== true) continue;

    const outcome = runTowerAttackDiagnostics(room);
    if (
      outcome.status === 'attack-submitted'
      || outcome.status === 'attack-not-submitted'
      || outcome.verification
    ) {
      console.log(JSON.stringify({
        type: 'tower-attack-diagnostics',
        tick: Game.time,
        roomName: room.name,
        ...outcome
      }));
    }
  }
};
```

## 怎样解释验证结果

| 状态 | 含义 |
|---|---|
| `verified` | 所有返回 `OK` 的 Tower 都匹配到同一实际事件目标的上一 tick 攻击事件 |
| `partial` | 只匹配到部分 Tower，检查动作竞争、事件目标或提交记录 |
| `missing` | 没找到对应事件，不能把估算写成真实伤害 |
| `missed-event-window` | 检查时间晚于 `submittedAt + 1`，证据窗口已错过 |

`estimatedGrossDamage` 是距离与 Power 直接乘数计算出的名义总量；`eventDamage` 是精确 Tower—实际事件目标攻击事件记录的总量；`observedHealing` 是原业务目标收到的治疗事件总量。

`targetHitsBefore - targetHitsAfter` 只是原目标的整 tick 净变化。若 Rampart 接管攻击，原目标可能完全不掉血，因此代码同时记录 `eventTargetHitsAfter`。

## `attack()` 返回值排查

| 返回值 | 含义 | 优先检查 |
|---|---|---|
| `OK` | 攻击意图已接受 | 保存 Tower、业务目标与事件目标 ID，下一 tick 读取事件 |
| `ERR_NOT_OWNER` | Tower 不属于自己 | 使用 `FIND_MY_STRUCTURES` 并核对对象来源 |
| `ERR_NOT_ENOUGH_ENERGY` | 当前 Energy 不足一次动作 | Store、其他 Tower 分支和 `TOWER_ENERGY_COST` |
| `ERR_INVALID_TARGET` | 目标当前无效 | 每 tick 重新恢复目标并判空 |
| `ERR_RCL_NOT_ENOUGH` | Tower 当前不可使用 | Controller 等级和 `isActive()` |

Tower 攻击没有 `ERR_NOT_IN_RANGE`。不要把 Creep 近战动作的返回码复制到 Tower 诊断中。

## 怎样使用站内 Tower 计算器

Tower 伤害、治疗与维修计算器适合在改代码前快速测试：

- 单塔不同 Range 的原始能力；
- 多塔齐射总量；
- Energy 可以支持多少轮动作；
- `OPERATE_TOWER` 增益；
- 敌方治疗后的净推进速度。

工具给出规划估算，不连接 Screeps 账号，也不知道真实 Tower ID、Rampart 接管、同 tick 动作竞争或上一 tick 事件。文章代码负责保存身份与证据，两者不能互相替代。

## 离线验证记录

本次更新通过 25 个离线场景：

1. Range 0；
2. Range 5 满效果；
3. Range 6 首个衰减值；
4. Range 10；
5. Range 15；
6. Range 20 最低标准效果；
7. Range 50 保持最低效果；
8. 负 Range 拒绝；
9. 小数 Range 拒绝；
10. 无 Power 效果时使用乘数 1；
11. 一级 `OPERATE_TOWER` 直接乘数 1.1；
12. 一级 `DISRUPT_TOWER` 直接乘数 0.9；
13. 两种效果同时存在得到 594；
14. 无效 Power 乘数拒绝；
15. 三座不同距离 Tower 集火；
16. 距离与 Power 组合；
17. 集火条目无效；
18. 同 tick 仍为待观察；
19. 错过事件窗口；
20. 所有 Tower 精确事件匹配；
21. 部分 Tower 匹配；
22. 没有匹配事件；
23. 同一原目标治疗事件统计；
24. 其他目标事件不会误匹配；
25. Rampart ID 作为实际攻击事件目标时正确匹配。

完整房间级示例通过 JavaScript 语法检查。离线测试没有连接官方服务器，也没有制造真实战斗结算。

## 适用边界

本文没有证明：

- 任意身体排列下 TOUGH 的最终减伤；
- Boosted HEAL 编队的多 tick 生存模型；
- Power Creep 和普通 Creep 全部战斗效果组合；
- Rampart 所有权与公开状态下的完整战术含义；
- 多目标分火的最优算法；
- 预测目标下一 tick 移动位置；
- 官方 shard 中每轮集火都能完整命中；
- 真实玩家外交名单绝对安全。

真实 Console、上一 tick 事件、Boost、Power 效果、Rampart 和多 Tower 战斗仍应在自己的房间验证。没有这些证据时，只能称为公式核查与离线模拟。

## 总结

Tower 伤害诊断应分成三层：

```text
第一层：attack() 返回值
证明攻击请求是否被 API 接受

第二层：距离、Power 与 Rampart 估算
解释名义输出和实际承伤对象

第三层：上一 tick 精确事件
核对哪些 Tower 实际对哪个事件目标产生攻击事件
```

最终目标 `hits` 是净状态，不是单次 Tower 动作身份证明。把返回值、估算、业务目标、事件目标和上一 tick 事件分开记录，才能准确回答“为什么 Tower 已经返回 OK，但目标仍然掉血很少”。

## 相关站内内容

- Tower 伤害、治疗与维修计算器
- [Tower 如何治疗己方 Creep](/blog/screeps-tower-heal-creeps)
- [Tower 如何按阈值维修建筑](/blog/screeps-tower-repair-threshold)
- [Room.getEventLog() 如何读取上一 tick 事件](/blog/screeps-room-event-log)
- [Safe Mode 怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Game.notify() 怎么发送防御提醒](/blog/screeps-game-notify)
- [进入建设与防御知识模块](/knowledge/construction-defense)

## 官方资料

- [StructureTower.attack API](https://docs.screeps.com/api/#StructureTower.attack)
- [Room.getEventLog API](https://docs.screeps.com/api/#Room.getEventLog)
- [Screeps Constants](https://docs.screeps.com/api/#Constants)
- [Defending your room](https://docs.screeps.com/defense.html)
- [Power Creeps and Power effects](https://docs.screeps.com/power.html)
- [Creep Boosts and resources](https://docs.screeps.com/resources.html)
- [Screeps engine Tower attack implementation](https://github.com/screeps/engine/blob/master/src/processor/intents/towers/attack.js)

资料核对日期：2026-08-05。距离公式、`POWER_INFO` 乘数、Rampart 目标替换、事件匹配与 25 个离线场景已经验证；真实官方 shard 防御结果仍待验证。
