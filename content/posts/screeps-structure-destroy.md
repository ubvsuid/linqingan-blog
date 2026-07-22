---
title: "Structure.destroy() 怎么安全拆除建错的 Extension"
description: "使用结构ID、预期房间、坐标、类型和确认词锁定己方Extension，检查敌对Creep与全部返回码后提交一次性destroy()请求，并在下一tick重新核对。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-22"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "Structure"
  - "Room API"
  - "常见问题"
  - "运行安全"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（结构ID、所有权、房间、坐标、类型、确认词与敌对单位，不是 Screeps 官方服务器）"
  testResult: "对象缺失、非己方结构、类型或位置不一致、确认失败、房间有敌对Creep和可提交场景通过。"
featured: false
---

`Structure.destroy()` 会拆除已经完工的 Structure。它不是工地删除方法，也不适合写成每 tick 运行的自动清理逻辑。

本文只处理一个明确场景：拆除自己房间里、已经人工确认位置错误的 Extension。示例不允许 Spawn、Storage、Terminal、Nuker 或其他关键结构。

## 先分清对象阶段

| 目标 | 方法 |
|---|---|
| 尚未完成的 Construction Site | `site.remove()` |
| 已经完成的 Extension | `structure.destroy()` |

执行前先用只读查询确认：

```js
const room = Game.rooms.W1N1;

if (room) {
  console.log(
    room.lookForAt(LOOK_STRUCTURES, 20, 20).map(
      structure => ({
        id: structure.id,
        my: structure.my,
        structureType: structure.structureType,
        roomName: structure.pos.roomName,
        x: structure.pos.x,
        y: structure.pos.y,
        hits: structure.hits,
        hitsMax: structure.hitsMax
      })
    )
  );
}
```

只读结果确认后，再把结构ID和预期信息写进请求。

## 为什么同时使用ID和坐标

ID用于恢复精确对象，房间、坐标和类型用于交叉验证。

请求：

```js
Memory.destroyStructureRequest = {
  enabled: true,
  structureId: '替换为Extension ID',
  roomName: 'W1N1',
  x: 20,
  y: 20,
  expectedType: STRUCTURE_EXTENSION,
  confirmation: 'DESTROY_EXTENSION'
};
```

如果结构被重建、ID改变或请求被错误复制，交叉检查会拒绝执行。

## 为什么示例只允许 Extension

拆除是破坏性操作。允许任意 `STRUCTURE_*` 会放大配置错误。

本文允许列表只有：

```js
const ALLOWED_DESTROY_TYPES = new Set([
  STRUCTURE_EXTENSION
]);
```

要支持其他结构，应为对应资源迁移、房间依赖和确认流程单独设计规则。

## 可离线测试的计划函数

```js
function evaluateDestroyRequest(input) {
  const {
    request,
    structure,
    owned,
    hostileCount
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.structureId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.expectedType !== STRUCTURE_EXTENSION
    || request.confirmation !== 'DESTROY_EXTENSION'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!structure) {
    return { ready: false, reason: 'structure-missing' };
  }

  if (!owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (structure.structureType !== request.expectedType) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (structure.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    structure.pos.x !== request.x
    || structure.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (hostileCount > 0) {
    return { ready: false, reason: 'hostiles-present' };
  }

  return { ready: true, reason: 'ready' };
}
```

## 完整示例

```js
function evaluateDestroyRequest(input) {
  const {
    request,
    structure,
    owned,
    hostileCount
  } = input;

  if (!request || request.enabled !== true) {
    return { ready: false, reason: 'disabled' };
  }

  if (
    typeof request.structureId !== 'string'
    || typeof request.roomName !== 'string'
    || !Number.isInteger(request.x)
    || !Number.isInteger(request.y)
    || request.x < 0
    || request.x > 49
    || request.y < 0
    || request.y > 49
    || request.expectedType !== STRUCTURE_EXTENSION
    || request.confirmation !== 'DESTROY_EXTENSION'
  ) {
    return { ready: false, reason: 'invalid-request' };
  }

  if (!structure) {
    return { ready: false, reason: 'structure-missing' };
  }

  if (!owned) {
    return { ready: false, reason: 'not-owner' };
  }

  if (structure.structureType !== request.expectedType) {
    return { ready: false, reason: 'type-mismatch' };
  }

  if (structure.pos.roomName !== request.roomName) {
    return { ready: false, reason: 'room-mismatch' };
  }

  if (
    structure.pos.x !== request.x
    || structure.pos.y !== request.y
  ) {
    return { ready: false, reason: 'position-mismatch' };
  }

  if (hostileCount > 0) {
    return { ready: false, reason: 'hostiles-present' };
  }

  return { ready: true, reason: 'ready' };
}

function handleDestroyStructureRequest() {
  const request = Memory.destroyStructureRequest;

  if (!request || request.enabled !== true) {
    return;
  }

  const structure = typeof request.structureId === 'string'
    ? Game.getObjectById(request.structureId)
    : null;
  const owned = Boolean(
    structure
    && Game.structures[structure.id]
  );
  const hostileCount = structure?.room
    ? structure.room.find(FIND_HOSTILE_CREEPS).length
    : 0;

  const plan = evaluateDestroyRequest({
    request,
    structure,
    owned,
    hostileCount
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
    structureId: structure.id,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    structureType: structure.structureType,
    hostileCount
  };

  const result = structure.destroy();

  request.result = result;
  request.resultAt = Game.time;
  request.status = result === OK
    ? 'accepted'
    : 'failed-review-required';

  console.log({
    type: 'destroy-structure-result',
    structureId: structure.id,
    roomName: structure.pos.roomName,
    x: structure.pos.x,
    y: structure.pos.y,
    structureType: structure.structureType,
    result
  });
}

module.exports.loop = function () {
  handleDestroyStructureRequest();
};
```

## 为什么使用 `Game.structures`

`Game.structures` 只包含自己的 Structure。示例已经通过ID恢复对象，再检查：

```js
Boolean(Game.structures[structure.id])
```

作为所有权的第二层证据。

仅仅看到 `structure.my` 或结构类型，不足以替代完整请求验证。

## 为什么有敌对 Creep 时提前停止

官方 `destroy()` 会在房间有敌对 Creep 时返回 `ERR_BUSY`。

预检查能让状态更清楚，但不能替代API返回值，因为房间状态可能在脚本检查与命令结算之间变化。

所有预检查失败都会关闭请求。失败后需要重新查看房间状态，再明确提交新请求。

## 官方返回值

| 返回值 | 官方含义 | 优先检查 |
|---|---|---|
| `OK` | 拆除已安排 | 下一 tick 重新查询结构 |
| `ERR_NOT_OWNER` | 不是结构所有者 | ID、`Game.structures`与所有权 |
| `ERR_BUSY` | 房间中存在敌对 Creep | 当前房间敌对对象 |

官方描述使用“立即销毁”，返回值仍说明操作已安排。主循环中应保存结果，并在下一 tick 重新取得对象。

## 下一 tick 怎样确认

```js
const structure = Game.getObjectById(
  Memory.destroyStructureRequest.structureId
);

console.log(structure);
```

还应在房间可见时按原坐标检查：

```js
const room = Game.rooms.W1N1;

if (room) {
  console.log(
    room.lookForAt(LOOK_STRUCTURES, 20, 20)
  );
}
```

对象不再出现，才说明后续状态中结构已被拆除。

## 拆除前需要处理结构依赖

Extension通常不保存长期资源，但它仍参与房间孵化容量。拆除后可能影响：

- `room.energyCapacityAvailable`；
- 大型Creep身体能否孵化；
- Extension布局和物流路线；
- RCL结构数量规划；
- Rampart覆盖；
- Spawn周边交通。

本文不承诺资源返还，也不自动重建新位置。

## 离线模拟结果

构建检查覆盖：

1. 请求未启用或确认词错误；
2. 结构ID无法恢复；
3. 对象不属于 `Game.structures`；
4. 结构类型不是Extension；
5. 房间名不一致；
6. 坐标不一致；
7. 房间存在敌对 Creep；
8. 全部字段一致时允许提交。

离线模拟没有调用真实 `destroy()`，也没有模拟房间孵化容量变化。

## 常见误区

### 只按坐标取第一个结构

Rampart等结构可能与其他对象共格，应使用ID和预期类型。

### 使用通用结构允许列表

会让坐标错误影响关键建筑。

### 把Construction Site当成Structure

未完工工地应使用 `remove()`。

### 失败请求保持开启

敌对单位离开或结构变化后，旧请求可能突然执行。

### `OK`后继续使用旧引用

下一tick重新取得对象。

### 忽略Extension对房间容量的影响

拆除前应核对 `energyCapacityAvailable` 与孵化需求。

## 适用边界

本文没有实现：

- 自动布局迁移；
- 其他结构类型拆除；
- 资源搬空；
- 自动重建；
- 多结构批量清理；
- 建筑依赖图；
- 房间交通重算。

JavaScript语法和请求匹配离线模拟已经通过。真实拆除、敌对状态与房间容量变化仍待Screeps环境验证。

## 相关站内内容

- [Room.createConstructionSite() 怎么创建工地](/blog/screeps-room-create-construction-site)
- [ConstructionSite.remove() 怎么删除工地](/blog/screeps-construction-site-remove)
- [怎样建造第一个Extension](/blog/screeps-first-extension)
- [Game.getObjectById() 为什么返回 null](/blog/screeps-game-get-object-by-id)
- [查询 Screeps 错误码](/screeps-errors)
- [进入建设与防御模块](/knowledge/construction-defense)

## 官方资料

- [Structure.destroy API](https://docs.screeps.com/api/#Structure.destroy)
- [Game.structures API](https://docs.screeps.com/api/#Game-structures)
- [Room.lookForAt API](https://docs.screeps.com/api/#Room.lookForAt)

资料核对日期：2026-07-22。离线请求匹配已通过；真实拆除仍待环境验证。
