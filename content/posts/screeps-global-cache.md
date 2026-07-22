---
title: "Screeps 全局缓存为什么会失效：重建、过期与对象恢复"
description: "解释模块顶层缓存与 Memory 的区别，使用按房间 Map、版本号和过期时间缓存 Source ID，并在全局重置、缓存过期或对象失效后安全重建。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "全局缓存"
  - "Memory"
  - "运行诊断"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（Map、过期时间与加载次数，不是 Screeps 官方服务器）"
  testResult: "同房间命中、到期重建、不同房间隔离和空缓存重建场景通过。"
featured: false
---

Screeps中的模块顶层变量可以在同一个运行时里跨多个tick复用，因此很适合保存可重建缓存。但它不是持久存储：代码重新加载、运行时重置或主动清空堆内存后，缓存会消失。

本文只解决一个问题：怎样缓存每个房间的Source ID，并在缓存不存在、过期或对象无法恢复时安全重建。

## 先区分三种数据位置

| 位置 | 能否跨多个tick | 运行时重置后 | 适合保存什么 |
|---|---|---|---|
| 当前函数局部变量 | 否 | 消失 | 当前tick的临时计算 |
| 模块顶层或`global` | 通常可以在当前运行时复用 | 消失 | 可重建缓存、短期统计、已解析数据 |
| `Memory` | 可以持久保存 | 保留 | 任务状态、角色、目标ID、必须恢复的数据 |

最重要的判断不是“哪个更快”，而是：

> 这份数据消失后，代码能不能仅凭当前游戏状态重新算出来？

能够重建的数据可以进入全局缓存；不能丢失的任务状态应进入Memory或其他持久存储。

## 为什么不能长期缓存 live 游戏对象

`Game`会在每个tick重新创建，`Room`、`Creep`、`Source`和其他RoomObject都是当前tick提供的对象视图。

下面的写法不可靠：

```js
let cachedSource;

module.exports.loop = function () {
  if (!cachedSource) {
    const room = Game.rooms.W1N1;
    cachedSource = room.find(FIND_SOURCES)[0];
  }

  console.log(cachedSource.energy);
};
```

即使变量仍然存在，也不应该把旧tick取得的live对象当作当前状态继续使用。更稳妥的方式是缓存可序列化信息，例如：

- 对象ID；
- 房间名；
- 坐标；
- 已序列化的CostMatrix；
- 由输入决定、可以重新计算的纯数据。

使用时再通过：

```js
Game.getObjectById(id)
```

取得当前tick对象，并处理可能返回`null`的情况。

## 只用一个变量会串房间

下面的缓存只有一个槽位：

```js
let sourceIds;
```

当主循环先处理`W1N1`，再处理`W2N2`时，第二个房间可能错误复用第一个房间的结果。

多房间代码应至少按房间名分组：

```js
const sourceCache = new Map();
```

每个房间保存自己的缓存项。

## 完整示例：按房间缓存Source ID

这份示例包含四种重建条件：

1. 当前房间没有缓存；
2. 缓存版本与代码版本不同；
3. 缓存已经到期；
4. ID无法恢复成当前对象。

```js
const SOURCE_CACHE_VERSION = 1;
const SOURCE_CACHE_TTL = 1000;
const sourceCache = new Map();

function createSourceCacheEntry(room) {
  const ids = room.find(FIND_SOURCES).map(
    source => source.id
  );

  return {
    version: SOURCE_CACHE_VERSION,
    roomName: room.name,
    ids,
    createdAt: Game.time,
    expiresAt: Game.time + SOURCE_CACHE_TTL
  };
}

function getSourceCacheEntry(room) {
  const cached = sourceCache.get(room.name);

  if (
    !cached
    || cached.version !== SOURCE_CACHE_VERSION
    || cached.expiresAt <= Game.time
  ) {
    const next = createSourceCacheEntry(room);
    sourceCache.set(room.name, next);
    return next;
  }

  return cached;
}

function getSources(room) {
  let cached = getSourceCacheEntry(room);
  let sources = cached.ids
    .map(id => Game.getObjectById(id))
    .filter(source => source !== null);

  if (sources.length !== cached.ids.length) {
    sourceCache.delete(room.name);
    cached = getSourceCacheEntry(room);
    sources = cached.ids
      .map(id => Game.getObjectById(id))
      .filter(source => source !== null);
  }

  return sources;
}

module.exports.loop = function () {
  const room = Game.rooms.W1N1;
  if (!room) {
    return;
  }

  const sources = getSources(room);

  if (Game.time % 100 === 0) {
    console.log({
      roomName: room.name,
      sourceCount: sources.length
    });
  }
};
```

把`W1N1`换成实际可见房间名。

## 这份代码怎样处理全局重置

运行时重置后：

```js
const sourceCache = new Map();
```

会重新执行，Map从空状态开始。下一次调用`getSourceCacheEntry()`时，`cached`不存在，代码自然调用`room.find(FIND_SOURCES)`重建。

因此不需要额外写“全局是否重置”的判断。正确的缓存函数本身就应该把“缓存不存在”当作正常状态。

需要警惕的是这种写法：

```js
const ids = sourceCache.get(room.name).ids;
```

它假设缓存一定已经初始化。全局重置后的第一个tick就可能报错。

## TTL不是官方规则

示例中的：

```js
const SOURCE_CACHE_TTL = 1000;
```

只是本文选择的过期时间，不是Screeps规定。

TTL的作用是限制缓存变旧的时间，但不同数据适合不同策略：

| 数据 | 可能的失效方式 | 更合适的策略 |
|---|---|---|
| Source ID | 对象无法恢复、房间状态变化 | 长TTL并验证ID |
| 建筑列表 | 新建、完成、拆除 | 较短TTL或按事件失效 |
| 敌人列表 | 每tick变化 | 通常不跨tick缓存 |
| PathFinder CostMatrix | 建筑或道路变化 | 版本、TTL或事件失效 |
| 配置解析结果 | 配置内容变化 | 配置版本失效 |

不要把TTL当作唯一方案。能够明确知道“什么时候变了”时，主动失效通常比等待时间到期更准确。

## 为什么要加版本号

代码升级后，缓存结构可能变化。

旧结构：

```js
{
  ids: ['id-a', 'id-b']
}
```

新结构：

```js
{
  version: 2,
  ids: ['id-a', 'id-b'],
  expiresAt: 123456
}
```

如果不保存版本号，旧缓存可能缺少新代码依赖的字段。示例通过：

```js
cached.version !== SOURCE_CACHE_VERSION
```

让代码部署新版本后自动重建旧缓存。

版本号特别适合：

- CostMatrix格式调整；
- 路径数据结构调整；
- 目标排序规则改变；
- 缓存项增加新字段；
- 模块拆分后键名改变。

## 对象恢复失败意味着什么

`Game.getObjectById(id)`返回`null`时，可能是：

- ID写错；
- 对象已经不存在；
- 当前没有该对象所在房间的视野；
- 缓存来自另一个环境；
- 缓存内容损坏。

本文示例的房间对象已经可见，并且缓存的是该房间Source，因此恢复数量不一致时直接删除并重新查找。

其他对象不能照搬这个结论。例如远程房间失去视野后，ID恢复为`null`不一定表示建筑已经消失。此时应保留缓存并等待重新获得视野，而不是立即判定数据错误。

## 全局缓存和Memory怎样配合

一个常见模式是：

```text
Memory保存必须恢复的原始状态
→ 全局缓存保存解析或计算结果
→ 全局重置后根据Memory重建缓存
```

例如Memory保存序列化CostMatrix字符串，全局缓存保存反序列化后的`PathFinder.CostMatrix`对象。这样不必每个tick重复反序列化，同时运行时重置后仍能从Memory恢复。

不要把完全相同的大对象同时无条件存进Memory和全局缓存。应明确：

- 哪一份是持久来源；
- 哪一份是可丢失副本；
- 什么时候失效；
- 怎样重建。

## 怎样判断缓存有没有实际价值

缓存本身也有成本：

- 维护键和值；
- 检查版本和TTL；
- 处理失效；
- 占用堆内存；
- 增加调试复杂度。

在加入缓存前先测量：

1. 原计算每tick消耗多少CPU；
2. 调用频率有多高；
3. 数据变化有多频繁；
4. 缓存命中率是否足够；
5. 全局重置后重建是否可接受。

简单的`room.find(FIND_SOURCES)`未必是整个系统最需要优化的地方。本文选择它是为了演示缓存生命周期，不代表所有房间都必须缓存Source列表。

## 离线模拟结果

构建检查使用普通`Map`模拟了以下场景：

| 场景 | 结果 |
|---|---|
| 第一次读取房间A | 调用加载函数 |
| TTL内再次读取房间A | 命中缓存，不重复加载 |
| 到达过期tick | 重新加载 |
| 读取房间B | 使用独立缓存项 |
| 使用新的空Map | 模拟全局重置后重新加载 |

离线测试只证明键隔离、过期判断和加载次数符合预期。它没有模拟真实全局重置频率、`room.find()`CPU、堆内存或`Game.getObjectById()`在官方服务器中的行为。

## 常见误区

### 把全局缓存当成永久存储

只要数据丢失后无法恢复，就不应该只放在模块顶层或`global`。

### 每个tick主动清空全部缓存

这样不会获得跨tick复用收益。应该在明确失效、版本变化或内存压力需要处理时清理。

### 缓存整个Room或Creep对象

应缓存ID或可序列化字段，并在当前tick恢复对象。

### 只用一个缓存变量处理所有房间

多房间系统必须把房间名、shard名或其他作用域加入键中。

### 没有测量就认定缓存更快

缓存可能只是把简单计算变成复杂状态管理。应配合`Game.cpu.getUsed()`观察多次样本，而不是凭一次输出下结论。

## 适用边界

本文只展示当前shard、当前运行时中的模块缓存，不覆盖：

- 多shard数据共享；
- 堆内存统计与垃圾回收分析；
- Require缓存内部机制；
- 大型CostMatrix压缩；
- 远程失去视野后的完整失效策略；
- 多进程或私服差异；
- 真实CPU收益结论。

JavaScript语法和离线Map分支已经检查，真实全局重置、对象恢复和CPU收益仍待Screeps环境验证。

## 相关站内内容

- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [Game.getObjectById() 怎么配合 Memory 保存目标](/blog/screeps-game-get-object-by-id)
- [RawMemory segments 怎么跨 tick 安全读取和写回](/blog/screeps-rawmemory-segments)
- [Game.cpu.getUsed() 和 bucket 怎么监控CPU](/blog/screeps-cpu-getused-bucket)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)

## 官方资料

- [Global Objects](https://docs.screeps.com/global-objects.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)
- [Caching Overview](https://docs.screeps.com/contributed/caching-overview.html)
- [Game.getObjectById API](https://docs.screeps.com/api/#Game.getObjectById)

资料核对日期：2026-07-22。离线缓存生命周期模拟已通过；真实运行时重置和性能收益仍待环境验证。
