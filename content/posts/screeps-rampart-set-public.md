---
title: "StructureRampart.setPublic() 怎么安全切换通行状态"
description: "明确公开Rampart会允许其他玩家Creep通过，并使用Rampart ID、预期房间、坐标、目标状态和绑定确认词提交一次性setPublic()请求。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "Rampart"
  - "防御"
  - "运行安全"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Rampart ID、所有权、房间、坐标、目标状态与确认词，不是 Screeps 官方服务器）"
  testResult: "对象缺失、非己方Rampart、位置不一致、类型错误、确认词错误、状态已一致和可提交场景通过。"
featured: false
---

`StructureRampart.setPublic(isPublic)` 会改变己方 Rampart 是否允许其他玩家的 Creep 通过。

本文只解决一个问题：怎样对一座已经人工确认的 Rampart 切换公开状态，同时避免把“公开”误解成盟友白名单。

## 最重要的安全边界

```js
rampart.setPublic(true)
```

不是“只允许朋友通过”。公开状态会让**其他玩家的Creep**能够通过，包括你没有加入盟友列表的玩家。

`setPublic(false)`会恢复私有通行状态。

公开状态不会：

- 转移Rampart所有权；
- 自动修改其他Rampart；
- 开启Safe Mode；
- 建立按玩家区分的白名单；
- 判断进入者是否有攻击意图；
- 替代Tower和防御Creep。

因此不能把玩家名单直接传给 `setPublic()`，API只接受一个布尔值。

## 先做只读查询

```js
const room = Game.rooms.W1N1;

if (room) {
  const ramparts = room.find(FIND_MY_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_RAMPART
  });

  console.log(ramparts.map(rampart => ({
    id: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    isPublic: rampart.isPublic,
    hits: rampart.hits,
    hitsMax: rampart.hitsMax
  })));
}
```

先确认ID、位置和当前状态，再写入操作请求。

## 目标绑定确认词

请求结构：

```js
Memory.rampartPublicRequest = {
  enabled: true,
  rampartId: '替换为Rampart ID',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  public: true,
  confirmation: 'SET_RAMPART_PUBLIC_W1N1_20_20'
};
```

确认词应与目标状态绑定：

```js
function buildRampartConfirmation(
  roomName,
  x,
  y,
  shouldBePublic
) {
  const state = shouldBePublic
    ? 'PUBLIC'
    : 'PRIVATE';

  return `SET_RAMPART_${state}_${roomName}_${x}_${y}`;
}
```

请求从公开改成私有、坐标改变或房间改变后，旧确认词都会失效。

## 可离线测试的计划函数

```js
function evaluateRampartRequest(input) {
  const { request, rampart, owned } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.rampartId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || typeof request.public !== 'boolean'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  const expectedConfirmation = buildRampartConfirmation(
    request.roomName,
    request.x,
    request.y,
    request.public
  );

  if (request.confirmation !== expectedConfirmation) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (!rampart) {
    return { ready: false, reason: 'rampart-missing' };
  }

  if (!owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (rampart.structureType !== STRUCTURE_RAMPART) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (rampart.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    rampart.pos.x !== request.x
    || rampart.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (rampart.isPublic === request.public) {
    return { ready: false, reason: 'state-already-matches' };
  }

  return { ready: true, reason: 'ready' };
}
```

## 完整示例

代码放入现有 `main` 模块。

```js
function buildRampartConfirmation(
  roomName,
  x,
  y,
  shouldBePublic
) {
  const state = shouldBePublic
    ? 'PUBLIC'
    : 'PRIVATE';

  return `SET_RAMPART_${state}_${roomName}_${x}_${y}`;
}

function evaluateRampartRequest(input) {
  const { request, rampart, owned } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.rampartId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || typeof request.public !== 'boolean'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  const expectedConfirmation = buildRampartConfirmation(
    request.roomName,
    request.x,
    request.y,
    request.public
  );

  if (request.confirmation !== expectedConfirmation) {
    return { ready: false, reason: 'confirmation-mismatch' };
  }

  if (!rampart) {
    return { ready: false, reason: 'rampart-missing' };
  }

  if (!owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (rampart.structureType !== STRUCTURE_RAMPART) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (rampart.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    rampart.pos.x !== request.x
    || rampart.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (rampart.isPublic === request.public) {
    return { ready: false, reason: 'state-already-matches' };
  }

  return { ready: true, reason: 'ready' };
}

function handleRampartPublicRequest() {
  const request = Memory.rampartPublicRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const rampart = typeof request.rampartId === 'string'
    ? Game.getObjectById(request.rampartId)
    : null;
  const owned = Boolean(
    rampart
    && Game.structures[rampart.id]
  );
  const plan = evaluateRampartRequest({
    request,
    rampart,
    owned
  });

  if (!plan.ready) {
    request.enabled = false;
    request.status = `precheck-${plan.reason}`;
    request.checkedAt = Game.time;
    return;
  }

  request.enabled = false;
  request.status = 'submitted';
  request.submittedAt = Game.time;
  request.snapshot = {
    rampartId: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    beforePublic: rampart.isPublic,
    requestedPublic: request.public
  };

  const result = rampart.setPublic(request.public);

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'rampart-public-result',
    rampartId: rampart.id,
    roomName: rampart.pos.roomName,
    x: rampart.pos.x,
    y: rampart.pos.y,
    requestedPublic: request.public,
    result
  });
}

module.exports.loop = function () {
  handleRampartPublicRequest();
};
```

## 为什么状态已经一致时也关闭请求

如果Rampart已经处于目标状态，再次调用没有业务价值。

请求可能来自旧配置，也可能已经被其他模块处理。示例记录：

```text
precheck-state-already-matches
```

并停止继续执行，避免每tick重复检查。

## 为什么调用前关闭请求

公开Rampart可能让陌生玩家Creep进入原本受阻的区域。请求必须只消费一次。

示例在调用前将 `enabled` 设为 `false`，无论返回成功还是失败，下一tick都不会自动重复。失败后必须人工检查Rampart、目标状态和返回值，再明确提交新请求。

## 官方返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 状态切换已安排 | 下一tick重新读取 `isPublic` |
| `ERR_NOT_OWNER` | Rampart不是自己的 | ID、`Game.structures`与所有权 |

`setPublic()`不消耗Energy，也没有距离要求。不要把Creep动作的资源或范围返回码复制到本文。

## 下一tick怎样核对

```js
const rampart = Game.getObjectById(
  Memory.rampartPublicRequest.rampartId
);

console.log({
  rampartId: rampart?.id,
  isPublic: rampart?.isPublic
});
```

需要重新取得当前对象。不要继续使用上一tick保存的Rampart引用。

## 公开Rampart不等于安全访客通道

单个布尔状态无法表达：

- 只允许某个玩家；
- 只允许某个房间；
- 只允许没有战斗部件的单位；
- 只开放指定时间；
- 发现攻击行为后自动关闭；
- 与Safe Mode状态联动。

这些需求需要额外调度逻辑。最基础的安全做法是默认私有，仅在明确用途下临时公开，并把恢复私有作为单独任务。

## 与Rampart保护能力的关系

公开状态主要影响其他玩家Creep能否通过。它不会让Rampart变成其他玩家的建筑，也不会自动删除覆盖在同一格的己方结构保护关系。

但一旦允许通行，敌对单位可能进入原本无法到达的位置。是否公开属于防御策略，而不是纯UI设置。

## 离线模拟结果

构建检查覆盖：

1. 请求未启用；
2. 参数或确认词错误；
3. Rampart ID无法恢复；
4. 对象不属于 `Game.structures`；
5. 结构类型不是Rampart；
6. 房间名不一致；
7. 坐标不一致；
8. 当前状态已经等于目标状态；
9. 全部字段一致时允许提交。

离线模拟没有调用真实 `setPublic()`，也没有模拟其他玩家单位通行。

## 常见误区

### 把公开状态当成盟友名单

`setPublic(true)`不区分玩家。

### 只按房间找第一座Rampart

房间通常有很多Rampart，必须使用明确ID和位置。

### 每tick根据一个布尔配置重复调用

只在状态变化且请求经过确认时执行。

### 复制无关的Energy和距离检查

此方法只有所有权相关错误。

### 返回 `OK` 后同tick读取旧状态

应在下一tick重新取得对象。

### 公开后忘记恢复私有

临时通道应有独立关闭流程，不能依赖记忆。

## 适用边界

本文没有实现：

- 玩家级白名单；
- 访客时间窗口；
- 自动外交规则；
- 行为检测后关闭；
- 多Rampart通道编组；
- Safe Mode联动；
- 路径级访问控制；
- 公开状态历史审计。

JavaScript语法和请求匹配离线模拟已经通过。真实状态切换和其他玩家通行仍待Screeps环境验证。

## 相关站内内容

- [Safe Mode怎么安全开启](/blog/screeps-controller-activate-safe-mode)
- [Tower怎么自动攻击敌人](/blog/screeps-tower-auto-attack-hostiles)
- [Wall和Rampart如何设置维修上限](/blog/screeps-wall-rampart-repair-limit)
- [Game.getObjectById()为什么返回null](/blog/screeps-game-get-object-by-id)
- [查询Screeps错误码](/screeps-errors)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [StructureRampart.setPublic API](https://docs.screeps.com/api/#StructureRampart.setPublic)
- [StructureRampart API](https://docs.screeps.com/api/#StructureRampart)
- [Defending your room](https://docs.screeps.com/defense.html)

资料核对日期：2026-07-22。离线请求匹配已通过；真实公开状态切换仍待Screeps环境验证。
