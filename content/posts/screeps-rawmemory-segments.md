---
title: "RawMemory segments 怎么跨 tick 安全读取和写回"
description: "解释 RawMemory.setActiveSegments 的下一 tick 时序、0–99 ID 与同时激活上限，并提供空内容、损坏 JSON、版本字段和安全写回的完整示例。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "RawMemory"
  - "Memory"
  - "Segments"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（字符串解析与状态分支，不是 Screeps 官方服务器）"
  testResult: "未加载、空字符串、合法对象 JSON、损坏 JSON 和非对象 JSON 场景通过。"
featured: false
---

`RawMemory segments` 适合保存体积较大、不是每个 tick 都必须读取的数据，例如序列化后的路径、统计快照或大型配置。它最容易出错的地方不是 `JSON.parse()`，而是**激活请求和真正可读之间隔了一个 tick**。

本文只解决一个问题：怎样把一个 segment 从“请求激活”推进到“安全读取、解析和写回”，同时避免损坏 JSON 被自动覆盖。

## 先记住完整时序

假设使用 segment `0`：

| tick | 代码做什么 | `RawMemory.segments[0]` |
|---|---|---|
| N | 调用 `RawMemory.setActiveSegments([0])` | 不保证可用 |
| N+1 | 再次执行主循环 | 可以读取 segment `0` |
| N+1 结束前 | 给 `RawMemory.segments[0]` 赋字符串 | 系统在 tick 结束时保存 |
| N+2 | 继续请求并读取 | 可以读取上一 tick 写入的字符串 |

如果希望它连续可用，最简单的做法是每个 tick 都请求同一组 ID。当前 tick 的调用是在安排**下一 tick**可用的 segments，并不是立即把数据加载进来。

## 官方规则中最重要的限制

- segment ID 必须是 `0` 到 `99` 的数字；
- 同一时间最多请求 10 个 segments；
- 同一 tick 多次调用 `setActiveSegments()` 时，后一次会覆盖前一次请求；
- `RawMemory.segments[id]` 的内容是字符串；
- 单个 segment 最大为 100 KB；
- segment 写入会在 tick 结束时自动保存；
- 当前未加载的 segment 不是空字符串，而是通常表现为 `undefined`。

最后一条很重要：

```js
raw === undefined
```

表示当前 tick 还没有拿到该 segment；而：

```js
raw === ''
```

可以表示 segment 已经可用，只是里面还没有内容。两种状态不能混为一谈。

## 一个安全的解析函数

segment 可以保存任意字符串，但本文约定它应当保存 JSON 对象。解析函数区分三种结果：

- `unavailable`：当前 tick 没有加载；
- `ok`：空内容或合法对象 JSON；
- `invalid`：损坏 JSON，或解析结果不是对象。

```js
function parseSegment(raw) {
  if (raw === undefined) {
    return {
      status: 'unavailable',
      value: null
    };
  }

  if (raw === '') {
    return {
      status: 'ok',
      value: {}
    };
  }

  try {
    const value = JSON.parse(raw);

    if (
      !value
      || Array.isArray(value)
      || typeof value !== 'object'
    ) {
      return {
        status: 'invalid',
        value: null
      };
    }

    return {
      status: 'ok',
      value
    };
  } catch (error) {
    return {
      status: 'invalid',
      value: null,
      message: error.message
    };
  }
}
```

这里不是说 segment 不能保存数组，而是本文的数据格式明确要求顶层为对象。给格式增加约束后，后续才能稳定加入 `version`、`updatedAt` 和其他字段。

## 可放进 `main` 的完整示例

下面的代码会持续请求 segment `0`，读取成功后增加计数，并写回字符串。损坏 JSON 时只记录错误，不覆盖原内容。

```js
const ACTIVE_SEGMENTS = [0];
const SEGMENT_ID = 0;
const DATA_VERSION = 1;

function parseSegment(raw) {
  if (raw === undefined) {
    return {
      status: 'unavailable',
      value: null
    };
  }

  if (raw === '') {
    return {
      status: 'ok',
      value: {}
    };
  }

  try {
    const value = JSON.parse(raw);

    if (
      !value
      || Array.isArray(value)
      || typeof value !== 'object'
    ) {
      return {
        status: 'invalid',
        value: null
      };
    }

    return {
      status: 'ok',
      value
    };
  } catch (error) {
    return {
      status: 'invalid',
      value: null,
      message: error.message
    };
  }
}

module.exports.loop = function () {
  RawMemory.setActiveSegments(ACTIVE_SEGMENTS);

  const raw = RawMemory.segments[SEGMENT_ID];
  const parsed = parseSegment(raw);

  if (parsed.status === 'unavailable') {
    return;
  }

  if (parsed.status === 'invalid') {
    console.log(
      `[segment ${SEGMENT_ID}] JSON 无法安全读取`,
      parsed.message || '顶层数据不是对象'
    );
    return;
  }

  const data = parsed.value;

  if (data.version !== DATA_VERSION) {
    data.version = DATA_VERSION;
    data.counter = 0;
  }

  data.counter = Number.isFinite(data.counter)
    ? data.counter + 1
    : 1;
  data.updatedAt = Game.time;

  RawMemory.segments[SEGMENT_ID] = JSON.stringify(data);
};
```

需要观察的是：

1. 第一次部署后，当前 tick 可能直接返回；
2. 下一 tick segment 可用后，空内容会初始化为对象；
3. 每个后续 tick 会增加 `counter`；
4. JSON 损坏时不会自动写回新的空对象；
5. `version` 不一致时，示例会按本文规则重新初始化。

## 为什么损坏 JSON 时不能直接覆盖

下面这种写法看起来方便：

```js
let data;

try {
  data = JSON.parse(raw);
} catch {
  data = {};
}

RawMemory.segments[0] = JSON.stringify(data);
```

问题是，一次格式错误会让原字符串在同一 tick 被替换成 `{}`。如果错误来自不兼容的新版本、只写入了一半的数据结构，或手工修改失误，旧内容就失去了进一步检查的机会。

更安全的顺序是：

```text
读取
→ 解析
→ 验证数据结构
→ 确认可以迁移或修改
→ 最后写回
```

解析失败时先停止写入，并保存日志中的 segment ID 和错误信息。

## 为什么要保存 `version`

Segment不像普通代码变量那样会随着部署自动更新。代码已经升级，不代表旧数据结构也自动升级。

例如旧版本保存：

```json
{
  "counter": 12
}
```

新版本可能需要：

```json
{
  "version": 2,
  "stats": {
    "counter": 12
  }
}
```

没有版本字段时，代码很难判断当前数据是否可以直接使用。实际项目可以选择：

- 版本不一致时清空可重建缓存；
- 编写明确的数据迁移函数；
- 保留旧segment，迁移成功后写入另一个ID；
- 在Memory中记录当前激活计划和迁移状态。

本文使用最简单的“版本不一致就重新初始化”，只适合本来就可以重建的数据。

## 多个segments不要分散调用

下面两次调用不会合并：

```js
RawMemory.setActiveSegments([0]);
RawMemory.setActiveSegments([1]);
```

最终请求会以后一次为准。需要同时读取时，应合并成一次：

```js
RawMemory.setActiveSegments([0, 1]);
```

实际系统可以先由各模块提交需求，再由主循环末尾统一去重和截取最多10个ID：

```js
function buildActiveSegmentList(requests) {
  return [...new Set(requests)]
    .filter(id => Number.isInteger(id) && id >= 0 && id <= 99)
    .slice(0, 10);
}
```

当请求超过10个时，不能直接假设所有模块下一 tick 都能读到数据，需要设计轮换顺序、优先级或分批读取。

## 离线模拟结果

构建检查对解析函数执行了以下场景：

| 输入 | 期望结果 |
|---|---|
| `undefined` | `unavailable` |
| 空字符串 | 合法空对象 |
| `{"count":2}` | 合法对象 |
| 损坏的 `{` | `invalid` |
| `[]` | 因本文要求顶层对象而判定无效 |

这些测试只验证字符串解析和状态分支，不会模拟Screeps在下一 tick 加载数据、100 KB限制或tick结束时的真实保存过程。

## 常见问题

### 已经调用激活，为什么还是 `undefined`

先确认是否在同一个tick立即读取。请求在下一tick生效。还要检查是否有其他模块在后面再次调用`setActiveSegments()`，覆盖了前面的ID列表。

### 为什么不把整个对象放进普通Memory

普通Memory更适合每个tick都需要访问的状态。Segments适合更大、访问频率更低的数据，但会增加异步读取调度和字符串解析复杂度。数据量不大时，不要为了“高级”而强行使用segments。

### 可以把游戏对象直接写进去吗

不可以依赖JSON保存 live RoomObject。应该保存ID、坐标、字符串或可序列化字段，并在需要时通过`Game.getObjectById()`恢复当前tick对象。

### 为什么本文每tick都写回

只是为了让最小示例容易观察。大型数据不应该在没有变化时反复序列化。实际代码应先判断内容是否变化，或把写入安排到明确的保存时机。

## 适用边界

本文只演示单shard内的本地segments，不包括：

- 其他玩家公开segment；
- `InterShardMemory`；
- 多shard并发写入；
- 数据压缩；
- 超过10个segments的完整调度器；
- 大型数据迁移回滚；
- 真实CPU成本对比。

JavaScript语法和离线解析分支已经检查，真实Screeps Console、跨tick读取和主循环写回仍待环境验证。

## 相关站内内容

- [Screeps Memory 是什么](/blog/screeps-memory-basics)
- [Game.getObjectById() 怎么配合 Memory 保存目标](/blog/screeps-game-get-object-by-id)
- [Screeps 全局缓存为什么会失效](/blog/screeps-global-cache)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [工程配置与运行诊断模块](/knowledge/operations-debugging)

## 官方资料

- [RawMemory API](https://docs.screeps.com/api/#RawMemory)
- [Global Objects](https://docs.screeps.com/global-objects.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线字符串解析模拟已通过；真实segments加载和写回仍待环境验证。
