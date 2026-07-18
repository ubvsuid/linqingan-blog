
---
title: "Game.getObjectById() 怎么配合 Memory 保存目标"
description: "把对象 ID 存入 Memory，并在每个 tick 重新取得当前游戏对象；同时处理首次选择、目标失效与不可见房间。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Game API"
  - "目标缓存"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Screeps 的游戏对象不能直接跨 tick 保存在 Memory 中。需要长期记住 Source、Structure 或其他对象时，保存它的 `id`，下一 tick 再用 `Game.getObjectById()` 取回当前对象。

## 保存 ID，而不是保存对象

Memory 适合保存字符串、数字、布尔值、数组和普通对象。Source 这样的游戏对象由当前 tick 提供，应该这样处理：

1. 首次选择目标并保存 `target.id`。
2. 后续 tick 读取 ID。
3. 调用 `Game.getObjectById(id)` 取得当前对象。
4. 返回 `null` 时删除旧 ID，并重新选择目标。

官方 API 还说明：只有当前可见房间中的对象能够通过 ID 取得。因此返回 `null` 不一定表示对象已经被摧毁，也可能是对应房间当前没有视野。

## 可放进 main 的最小示例

```js
function getSourceForCreep(creep) {
  let source = null;

  if (creep.memory.sourceId) {
    source = Game.getObjectById(creep.memory.sourceId);
  }

  if (!source) {
    delete creep.memory.sourceId;

    source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (!source) {
      return null;
    }

    creep.memory.sourceId = source.id;
  }

  return source;
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;
  if (!creep) {
    return;
  }

  const source = getSourceForCreep(creep);
  if (!source) {
    console.log('Harvester1 没有找到可达的 Source');
    return;
  }

  const result = creep.harvest(source);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
  } else if (result !== OK) {
    console.log('harvest result:', result);
  }
};
```

## 为什么每个 tick 都要重新取对象

Memory 中的 `sourceId` 只是字符串。`Game.getObjectById()` 返回的对象才属于当前 tick，可以安全读取位置、能量和其他属性。不要把取得的 Source 对象再次写回 Memory。

示例在取回失败时删除旧 ID，再从当前房间选择 Source。对跨房间目标，应先恢复视野，再判断目标是否真的失效，避免因为暂时不可见而频繁改写任务。

## 常见错误

1. 把完整 Source 或 Structure 写进 Memory。序列化后的数据不是下一 tick 的实时游戏对象。
2. 不处理 `null`。目标消失或房间不可见时，后续读取属性会报错。
3. 每个 tick 都重新寻路选择目标。已有有效 ID 时应直接复用，减少无意义的重复选择。
4. 把 `getObjectById()` 的 `null` 当成动作错误码。它返回对象或 `null`，不是 `OK`、`ERR_NOT_IN_RANGE` 这类常量。
5. 使用旧 ID 后不清理。重新选择前先删除失效字段，避免其他逻辑继续读取。

## 适用边界

这个模式适合保存 Source、Structure、ConstructionSite 等具有稳定 ID 的对象。Flag 使用名称访问，Room 使用房间名访问；不同对象应选择与官方 API 一致的标识方式。

## 继续学习

- [Memory 基础用法](/blog/screeps-memory-basics)
- [Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)
- [第一次移动与采集](/blog/screeps-first-creep-harvest)

## 官方资料

- [Game.getObjectById API](https://docs.screeps.com/api/#Game.getObjectById)
- [Memory API](https://docs.screeps.com/api/#Memory)

