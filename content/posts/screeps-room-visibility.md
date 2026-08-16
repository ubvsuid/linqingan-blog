---
title: "Game.rooms[roomName] 为什么是 undefined：Screeps 房间视野与 Observer 排查"
description: "解释 Game.rooms[roomName] 为什么会是 undefined，区分当前视野与 Memory 历史状态，并用 Game.getObjectById()、lastSeenAt 和 Observer 的下一 tick 时序安全恢复远程房间任务。"
publishedAt: "2026-07-18"
updatedAt: "2026-08-15"
category: "Screeps 常见问题"
tags:
  - "Screeps"
  - "常见问题"
  - "视野"
  - "Game API"
  - "Room"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-15"
featured: false
---

`Game.rooms[roomName]` 是 `undefined` 时，最重要的结论不是“这个房间不存在”，而是：**你的脚本在当前 tick 没有拿到这个房间的 live `Room` 对象。**

官方 API 把 `Game.rooms` 定义为当前对你可用的房间集合。自己的 Creep、自己的结构以及 Observer 等视野来源都可能让房间进入当前可见集合；当视野消失后，之前写进 `Memory` 的房间数据仍可能存在，但它不能替代当前 `Room` 对象。

因此，远程采集、侦察、预订、跨房移动和目标缓存代码都应该先回答两个问题：

1. **这个房间当前是否可见？**
2. **如果不可见，我应该等待视野、请求 Observer，还是只保留历史状态？**

本文只处理这条“可见性边界”。如果问题是 `moveTo()` 找不到路线，应继续看 [ERR_NO_PATH 排查](/blog/screeps-err-no-path)；如果已经有 Observer，需要完整的请求与下一 tick 状态机，可继续看 [Observer 远程视野指南](/blog/screeps-observer-observe-room)。

## 快速结论

可靠的处理顺序可以压缩成下面这条链：

```text
读取 Game.rooms[roomName]
→ 有 Room：读取当前 live 对象
→ 没有 Room：停止依赖 Room 的逻辑
→ 保留自己写入 Memory 的历史状态
→ 如有必要，提交 Observer 请求
→ 下一 tick 再检查 Game.rooms[roomName]
→ 视野恢复后重新取得对象，不复用旧快照
```

最小安全判空只需要这样：

```js
function getVisibleRoom(roomName) {
  const room = Game.rooms[roomName];

  if (!room) {
    return null;
  }

  return room;
}
```

不要把 `undefined` 直接解释成：

- 房间被删除；
- Controller 消失；
- Source 消失；
- 保存的对象 ID 一定失效；
- 远程任务应该立即清空。

这些结论都需要更多证据。

## `Game.rooms` 到底代表什么

`Game` 会在每个 tick 重新创建并填入当前游戏状态。`Game.rooms` 不是一份永久房间数据库，而是当前 tick 可以直接访问的 `Room` 对象集合。

```js
const room = Game.rooms['W2N2'];
```

这里可能得到：

```text
Room 对象
```

也可能得到：

```text
undefined
```

`undefined` 只说明当前索引里没有这个 `Room` 对象。

这也是为什么下面的写法存在风险：

```js
const controller = Game.rooms['W2N2'].controller;
```

一旦房间当前不可见，代码会在访问 `.controller` 之前就因为 `Game.rooms['W2N2']` 是 `undefined` 而抛出异常。

应该先建立可见性边界：

```js
const roomName = 'W2N2';
const room = Game.rooms[roomName];

if (!room) {
  console.log(roomName, '当前不可见');
  return;
}

const controller = room.controller;
```

## “房间不可见”和“房间里没有 Controller”不是一回事

即使 `Game.rooms[roomName]` 存在，也不能继续假设 `room.controller` 一定存在。

更可靠的状态分类是：

```js
function describeRoomState(roomName) {
  const room = Game.rooms[roomName];

  if (!room) {
    return {
      roomName,
      visible: false,
      state: 'NOT_VISIBLE'
    };
  }

  const controller = room.controller;

  if (!controller) {
    return {
      roomName,
      visible: true,
      state: 'VISIBLE_NO_CONTROLLER'
    };
  }

  if (controller.my) {
    return {
      roomName,
      visible: true,
      state: 'VISIBLE_OWNED'
    };
  }

  if (controller.owner) {
    return {
      roomName,
      visible: true,
      state: 'VISIBLE_OTHER_OWNER',
      username: controller.owner.username
    };
  }

  if (controller.reservation) {
    return {
      roomName,
      visible: true,
      state: 'VISIBLE_RESERVED',
      username: controller.reservation.username
    };
  }

  return {
    roomName,
    visible: true,
    state: 'VISIBLE_NEUTRAL'
  };
}
```

这段分类的价值不是给所有房间贴标签，而是避免把不同问题混成一句“房间不存在”。

例如：

```text
NOT_VISIBLE
```

表示当前没有 live `Room`。

而：

```text
VISIBLE_NO_CONTROLLER
```

表示房间已经可见，只是当前房间本身没有 Controller。此时继续等待 Observer 并不能“生成”一个 Controller。

## `Memory.rooms` 不是当前视野证明

`Memory` 会跨 tick 保存玩家脚本写入的数据。`Game` 则会在每个 tick 根据当前状态重新创建。

因此下面两个结果可以同时成立：

```js
Boolean(Memory.rooms?.W2N2) === true;
Boolean(Game.rooms.W2N2) === false;
```

这并不矛盾。

`Memory.rooms.W2N2` 可能只是你之前通过 `room.memory` 或自己的代码保存过的数据。它可以帮助恢复任务上下文，但不能证明当前还能读取房间里的 Source、Creep、Structure 或 Controller。

不要写成：

```js
const room = Game.rooms[roomName]
  || Memory.rooms[roomName];

room.find(FIND_SOURCES);
```

`Memory.rooms[roomName]` 是普通持久化数据，不是 `Room` 实例，也没有 `room.find()` 这样的 live API。

更安全的职责划分是：

```js
const room = Game.rooms[roomName];
const remembered = Memory.rooms
  ? Memory.rooms[roomName]
  : undefined;

if (!room) {
  return {
    visible: false,
    remembered: Boolean(remembered)
  };
}

return {
  visible: true,
  room
};
```

## 给历史数据加一个 `lastSeenAt`

如果远程任务需要知道“最后一次看到这个房间是什么时候”，不要从 `Memory.rooms` 是否存在来猜。

可以自己保存一个明确时间：

```js
function recordRoomVisibility(roomName) {
  if (!Memory.roomVisibility) {
    Memory.roomVisibility = {};
  }

  const room = Game.rooms[roomName];

  if (!room) {
    return false;
  }

  Memory.roomVisibility[roomName] = {
    lastSeenAt: Game.time
  };

  return true;
}
```

读取时：

```js
function getVisibilityAge(roomName) {
  const record = Memory.roomVisibility
    ? Memory.roomVisibility[roomName]
    : undefined;

  if (!record || !Number.isInteger(record.lastSeenAt)) {
    return null;
  }

  return Game.time - record.lastSeenAt;
}
```

这样可以明确区分：

```text
当前可见
最后 3 tick 前看见
最后 500 tick 前看见
从未记录过视野
```

`lastSeenAt` 是本站示例字段，不是 Screeps 内置属性。

## 保存对象 ID 时，还要保存房间名

远程任务经常先保存一个 Source、Structure 或其他对象的 ID：

```js
Memory.remoteTarget = {
  roomName: 'W2N2',
  id: '0123456789abcdef01234567'
};
```

下一 tick 再恢复：

```js
const saved = Memory.remoteTarget;
const target = saved
  ? Game.getObjectById(saved.id)
  : null;
```

这里有一个很重要的边界：官方文档说明 `Game.getObjectById()` 只能访问当前对你可见房间里的对象。

因此：

```js
target === null
```

不能单独证明目标已经被摧毁或消失。

先检查目标房间有没有视野：

```js
function loadRemoteTarget(saved) {
  if (!saved || !saved.id || !saved.roomName) {
    return {
      state: 'NO_SAVED_TARGET',
      target: null
    };
  }

  const room = Game.rooms[saved.roomName];

  if (!room) {
    return {
      state: 'ROOM_NOT_VISIBLE',
      target: null
    };
  }

  const target = Game.getObjectById(saved.id);

  if (!target) {
    return {
      state: 'TARGET_NOT_FOUND_WHILE_VISIBLE',
      target: null
    };
  }

  return {
    state: 'TARGET_VISIBLE',
    target
  };
}
```

只有在房间已经可见时仍然无法恢复对象，才获得了更强的“这个旧 ID 当前已经找不到”的证据。

这类目标缓存的完整设计可继续看 [Game.getObjectById() 与 Memory 目标恢复](/blog/screeps-game-get-object-by-id)。

## 需要主动视野时，用 Observer，但不要在同一 tick 验证结果

`StructureObserver.observeRoom(roomName)` 会安排一次远程观察。官方 API 明确说明：**目标 Room 对象会在下一 tick 可用。**

因此下面的逻辑是错误的验证方式：

```js
const result = observer.observeRoom('W2N2');
const room = Game.rooms.W2N2;

if (result === OK && room) {
  console.log('Observer 已经在当前 tick 提供视野');
}
```

`OK` 只表示观察操作已经被安排。不要把同一 tick 的 `Game.rooms` 状态当成这次请求的结果。

如果你已经通过配置保存 Observer ID，可以把请求和后续读取分开：

```js
function requestObservation(observerId, roomName) {
  const observer = Game.getObjectById(observerId);

  if (!observer
      || observer.structureType !== STRUCTURE_OBSERVER
      || !observer.my
      || !observer.isActive()) {
    return {
      state: 'OBSERVER_UNAVAILABLE',
      code: null
    };
  }

  const code = observer.observeRoom(roomName);

  if (code === OK) {
    if (!Memory.observationRequests) {
      Memory.observationRequests = {};
    }

    Memory.observationRequests[roomName] = {
      requestedAt: Game.time,
      observerId: observer.id
    };
  }

  return {
    state: code === OK
      ? 'OBSERVATION_SCHEDULED'
      : 'OBSERVATION_FAILED',
    code
  };
}
```

后续 tick 再检查：

```js
function readObservedRoom(roomName) {
  const request = Memory.observationRequests
    ? Memory.observationRequests[roomName]
    : undefined;

  if (!request) {
    return {
      state: 'NO_REQUEST',
      room: null
    };
  }

  if (Game.time <= request.requestedAt) {
    return {
      state: 'WAIT_NEXT_TICK',
      room: null
    };
  }

  const room = Game.rooms[roomName];

  return room
    ? { state: 'VISIBLE_AFTER_REQUEST', room }
    : { state: 'NOT_VISIBLE_AFTER_REQUEST', room: null };
}
```

这仍然不是“Observer 一定成功”的真实服务器证据。要验证实际运行结果，需要在自己的 Screeps 环境中记录请求 tick、返回码和后续 tick 的 `Game.rooms[roomName]` 状态。

完整的 Observer 范围、返回码和调度边界请看 [StructureObserver.observeRoom() 指南](/blog/screeps-observer-observe-room)。

## 把“需要 live Room”写进函数契约

一个常见架构问题是：业务函数内部到处重复猜“房间可能看不见”。

更简单的方式是让调用方先过可见性门槛：

```js
function runVisibleRoomJob(room) {
  const sources = room.find(FIND_SOURCES);
  const controller = room.controller;

  return {
    roomName: room.name,
    sourceCount: sources.length,
    hasController: Boolean(controller)
  };
}

function runRemoteRoomJob(roomName) {
  const room = Game.rooms[roomName];

  if (!room) {
    return {
      state: 'WAITING_FOR_VISION'
    };
  }

  return {
    state: 'ROOM_VISIBLE',
    result: runVisibleRoomJob(room)
  };
}
```

这样 `runVisibleRoomJob()` 的输入契约很明确：它只接收当前 tick 已经存在的 live `Room`。

对远程房间来说，“等待视野”是一个正常状态，而不是异常。

## 视野恢复后，要重新读取当前对象

假设 1000 tick 时你看见远程房间并保存了：

```js
{
  roomName: 'W2N2',
  sourceId: '0123456789abcdef01234567'
}
```

随后房间失去视野。

当视野再次恢复时，不应该继续使用以前缓存的完整对象快照。应重新从当前 `Game` 状态取得对象：

```js
const room = Game.rooms[remote.roomName];

if (!room) {
  return;
}

const source = Game.getObjectById(remote.sourceId);

if (!source) {
  console.log(
    remote.roomName,
    '房间已可见，但旧 sourceId 当前无法恢复'
  );
  return;
}

console.log({
  roomName: room.name,
  sourceId: source.id,
  energy: source.energy,
  ticksToRegeneration: source.ticksToRegeneration
});
```

原因很简单：`Game` 是当前 tick 的 live 状态入口；跨 tick 要保存的是可以重新恢复对象的简单数据，而不是假设旧对象引用永久有效。

## 一个有限、可读的诊断探针

如果只想快速判断问题在哪一层，可以使用这个只读探针：

```js
function probeRoomVisibility(roomName) {
  const room = Game.rooms[roomName];
  const visibilityRecord = Memory.roomVisibility
    ? Memory.roomVisibility[roomName]
    : undefined;

  if (!room) {
    return {
      roomName,
      visible: false,
      lastSeenAt:
        visibilityRecord?.lastSeenAt ?? null,
      age:
        Number.isInteger(visibilityRecord?.lastSeenAt)
          ? Game.time - visibilityRecord.lastSeenAt
          : null
    };
  }

  const controller = room.controller;

  return {
    roomName,
    visible: true,
    hasController: Boolean(controller),
    controllerMy: controller
      ? Boolean(controller.my)
      : null,
    owner: controller?.owner?.username ?? null,
    reservation:
      controller?.reservation?.username ?? null
  };
}
```

Console 中只读查看：

```js
console.log(
  JSON.stringify(
    probeRoomVisibility('W2N2'),
    null,
    2
  )
);
```

本文没有在真实 Screeps shard 中替你执行这段探针，因此不能声称某个具体房间已经通过运行验证。

## 常见误区

### `Memory.rooms[roomName]` 有数据，为什么 `Game.rooms[roomName]` 还是 undefined？

因为两者生命周期不同。`Memory` 保存你跨 tick 写入的数据；`Game.rooms` 只提供当前 tick 可访问的 live `Room`。Memory 中有历史状态并不会自动提供视野。

### `Game.getObjectById(id)` 返回 null，目标是不是已经没了？

不一定。先检查目标所在房间是否当前可见。官方文档明确限制 `Game.getObjectById()` 只能取得可见房间中的对象。房间不可见时，不应仅因为返回 `null` 就删除远程目标记录。

### `observeRoom()` 返回 OK，为什么当前 tick 还是看不到目标房间？

这是正常时序。`OK` 表示观察已经安排，目标 `Room` 对象应在下一 tick 检查。

### 房间可见，但 `room.controller` 是 undefined，还是视野问题吗？

不一定。此时 `Room` 已经存在，说明“当前不可见”这个问题已经排除。接下来应判断该房间本身是否有 Controller，而不是继续等待视野。

## 建议的生产排查顺序

遇到远程房间任务突然失效时，按下面顺序排查：

1. 直接读取 `Game.rooms[roomName]`，先确认当前是否有 live `Room`。
2. 房间不可见时，停止所有依赖 `Room`、`room.find()`、Controller 或当前结构状态的逻辑。
3. 读取自己保存的 `lastSeenAt`，区分刚失去视野和长期未观察。
4. 如果任务保存了对象 ID，同时保留 `roomName`；不可见期间不要仅凭 `Game.getObjectById()` 的 `null` 清空目标。
5. 确实需要主动视野时，提交一次 Observer 请求并保存请求 tick 与返回码。
6. 下一 tick 再读取 `Game.rooms[roomName]`。
7. 视野恢复后重新取得 Source、Structure、Controller 等当前对象，再继续业务逻辑。
8. 如果房间已经可见但业务仍失败，再进入对应的移动、资源、Controller 或目标类型排查，而不是继续把问题归因于视野。

## 本文的验证边界

本文在 2026-08-15 重新核对了 Screeps 官方 API 与 Global Objects 文档，确认了以下文档级事实：

- `Game.rooms` 是当前可访问房间的集合；
- `Game` 每个 tick 重新创建；
- `Memory` 用于跨 tick 保存 JSON 数据；
- `Game.getObjectById()` 只能访问当前可见房间中的对象；
- `StructureObserver.observeRoom()` 成功安排后，目标 `Room` 在下一 tick 才可用。

本文代码只做静态语法与边界审阅，没有在真实 Screeps Console 或官方 shard 中执行，因此：

```text
Docs checked: yes
Syntax checked: yes
Console tested: no
Live multi-tick tested: no
```

这一区分很重要：官方文档可以证明 API 契约，但不能替代你自己的房间、Observer 范围、对象 ID 和实际跨 tick 运行结果。

## 站内继续阅读

- [StructureObserver.observeRoom() 怎么安全获取远方房间视野](/blog/screeps-observer-observe-room)
- [Game.getObjectById() 怎么配合 Memory 安全恢复目标](/blog/screeps-game-get-object-by-id)
- [Game.map.findRoute() 怎么规划并执行跨房间路线](/blog/screeps-map-find-route)
- [ERR_NO_PATH 怎么排查](/blog/screeps-err-no-path)
- [RoomVisual 怎么画状态、目标和路径来辅助调试](/blog/screeps-roomvisual-debug)
- [Screeps Memory 是什么](/blog/screeps-memory-basics)

## 官方资料

- [Game API：Game.rooms 与 Game.getObjectById()](https://docs.screeps.com/api/#Game)
- [StructureObserver.observeRoom()](https://docs.screeps.com/api/#StructureObserver-observeRoom)
- [Global Objects：Game 与 Memory 的生命周期](https://docs.screeps.com/global-objects.html)
