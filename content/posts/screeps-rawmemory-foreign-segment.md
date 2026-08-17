---
title: "Screeps RawMemory Foreign Segment 怎么用：公开 Segment、下一 Tick 读取与轮询调度"
description: "使用 RawMemory.setPublicSegments、setDefaultPublicSegment 和 setActiveForeignSegment 安全发布与读取其他玩家的公开 Segment：处理下一 tick 时序、一次一个 Foreign Segment、覆盖式配置、版本校验、轮询调度和不可信 JSON。"
publishedAt: "2026-08-17"
updatedAt: "2026-08-17"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "RawMemory"
  - "Foreign Segment"
  - "Memory"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-17"
  testedAt: "2026-08-17"
  testEnvironment: "Node.js 22 离线模拟与确定性状态检查，不是 Screeps 官方服务器"
  testResult: "覆盖公开列表覆盖语义、默认 Segment 约束、0–99 ID、下一 tick 请求状态、显式与默认 ID 匹配、轮询调度、UTF-8 容量、损坏 JSON、版本回退、发布者重启和本地停滞观察。"
---

`RawMemory.foreignSegment` 适合读取**其他玩家主动公开**的数据，例如联盟状态目录、公共房间情报摘要、开放协议版本或工具索引。

它不是跨 shard 数据交换，也不是读取任意玩家 Memory 的入口：

| API | 数据所有者 | 可写方 | 读取范围 |
|---|---|---|---|
| `RawMemory.segments` | 自己 | 自己 | 当前 shard 的自己 |
| `InterShardMemory` | 每个 shard 各自一份 | 当前 shard 只写自己 | 自己在其他 shard 的数据 |
| `RawMemory.foreignSegment` | 其他玩家 | Segment 所有者 | 当前 shard 中被公开的数据 |

官方 API 当前定义了四个关键边界：

1. Segment ID 只能是 `0–99`；
2. 读取请求由 `setActiveForeignSegment()` 提交，数据在**下一 tick**出现在 `RawMemory.foreignSegment`；
3. 同一时间只能访问**一个** Foreign Segment；
4. `setPublicSegments()` 和 `setActiveSegments()` 一样具有覆盖语义，后一次调用会替换前一次配置。

## 快速答案

一个可靠的公开 Segment 协议至少应做到：

- 发布者先激活自己的本地 Segment，再写入完整字符串；
- 发布者用一个协调器统一设置公开列表与默认公开 Segment；
- 读取者保存上一 tick 的请求身份；
- 下一 tick 只接受与请求用户名、显式 ID 一致的返回对象；
- 请求默认 Segment 时，把实际返回的 ID 记录为流身份；
- 每 tick 只安排一个下一次请求，多个订阅使用轮询；
- 把远端字符串当作不可信输入；
- 校验 JSON、Schema、发布者、Segment ID、Epoch 和 Revision；
- 使用本地观察时间判断数据多久没有推进；
- 不在公开 Segment 中放 Token、密码或私有战略数据。

## 发布者：先让本地 Segment 可写

`setPublicSegments()` 只决定谁可以请求 Segment，不会让该 Segment 自动出现在当前 tick 的 `RawMemory.segments` 中。发布者仍需遵守本地 Segment 的下一 tick 激活时序。

```js
function requestPublisherSegment(segmentId) {
  if (
    !Number.isInteger(segmentId)
    || segmentId < 0
    || segmentId > 99
  ) {
    return {
      status: 'invalid-segment-id'
    };
  }

  RawMemory.setActiveSegments([segmentId]);

  return {
    status: 'activation-requested',
    segmentId,
    requestedAt: Game.time
  };
}
```

在 tick N 请求激活，在 tick N+1 检查 `RawMemory.segments[segmentId]` 是否存在，然后再写入。

## 定义公开数据 Envelope

```js
function createPublicEnvelope({
  publisher,
  segmentId,
  publisherEpoch,
  revision,
  updatedAt,
  payload
}) {
  return {
    schemaVersion: 1,
    publisher,
    segmentId,
    publisherEpoch,
    revision,
    updatedAt,
    payload
  };
}
```

建议字段：

| 字段 | 作用 |
|---|---|
| `schemaVersion` | 结构迁移边界 |
| `publisher` | 防止把错误用户名的数据当成目标来源 |
| `segmentId` | 防止默认 Segment 切换后继续沿用旧身份 |
| `publisherEpoch` | 区分发布者重新初始化与 Revision 回退 |
| `revision` | 识别内容是否推进 |
| `updatedAt` | 发布者诊断字段 |
| `payload` | 真正公开的数据 |

## 用 UTF-8 字节数控制容量

每个 Segment 的最大尺寸是 100 KB。`string.length` 不等于 UTF-8 字节数。

```js
function utf8ByteLength(value) {
  const text = String(value);
  let bytes = 0;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (
      code >= 0xD800
      && code <= 0xDBFF
      && index + 1 < text.length
      && text.charCodeAt(index + 1) >= 0xDC00
      && text.charCodeAt(index + 1) <= 0xDFFF
    ) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}
```

官方文档规定每个 Segment 最大 100 KB，但本文查到的 RawMemory API 文档没有定义服务端精确的容量计量算法。下面按 UTF-8 字节数执行 `96 * 1024` 的项目侧保守预算，为字段增长和计量差异留出余量；96 KiB 不是额外的 Screeps 官方限制。

## 写入公开 Segment

```js
const PUBLIC_SEGMENT_SAFE_LIMIT = 96 * 1024;

function writePublicSegment(
  segmentId,
  envelope
) {
  if (!Object.prototype.hasOwnProperty.call(
    RawMemory.segments,
    segmentId
  )) {
    return {
      status: 'segment-not-active',
      segmentId
    };
  }

  const serialized = JSON.stringify(envelope);
  const byteLength = utf8ByteLength(serialized);

  if (byteLength > PUBLIC_SEGMENT_SAFE_LIMIT) {
    return {
      status: 'payload-too-large',
      segmentId,
      byteLength
    };
  }

  RawMemory.segments[segmentId] = serialized;

  return {
    status: 'local-segment-write-staged',
    segmentId,
    byteLength,
    revision: envelope.revision
  };
}
```

`local-segment-write-staged` 只表示本 tick 已给本地 Segment 赋值，不表示其他玩家已经读取到该 Revision。

## 统一管理公开列表

后一次 `setPublicSegments()` 会覆盖前一次列表，所以不要让多个模块分别调用。官方文档要求 ID 位于 0–99，但没有把重复 ID 列为单独错误；本文的协调器先验证所有 ID，再去重、排序后统一提交。

```js
function normalizePublicSegmentIds(ids) {
  if (!Array.isArray(ids)) {
    return null;
  }

  if (!ids.every(id =>
    Number.isInteger(id)
    && id >= 0
    && id <= 99
  )) {
    return null;
  }

  return [...new Set(ids)]
    .sort((left, right) => left - right);
}
```

```js
function applyPublicSegmentPolicy({
  publicIds,
  defaultId
}) {
  const normalized =
    normalizePublicSegmentIds(publicIds);

  if (!normalized) {
    return {
      status: 'invalid-public-list'
    };
  }

  if (
    defaultId !== null
    && (
      !Number.isInteger(defaultId)
      || !normalized.includes(defaultId)
    )
  ) {
    return {
      status: 'default-not-public'
    };
  }

  RawMemory.setPublicSegments(normalized);
  RawMemory.setDefaultPublicSegment(defaultId);

  return {
    status: 'public-policy-submitted',
    publicIds: normalized,
    defaultId
  };
}
```

本文额外采用一个**项目策略**：如果设置非空 `defaultId`，要求它也出现在本次公开列表里。官方文档分别定义 `setPublicSegments()` 与 `setDefaultPublicSegment()`，这里的成员关系校验是为了避免配置出“默认 ID 已设置但不在本项目公开集合中”的不可消费状态，不把它描述成额外 API 返回规则。

清空公开列表使用 `setPublicSegments([])`；移除默认公开 Segment 使用 `setDefaultPublicSegment(null)`。

## 读取者：规范化请求

省略 ID 表示请求对方的默认公开 Segment。不要把第二个参数传成 `null`，因为清除请求是把**用户名**设为 `null`。

```js
function normalizeForeignRequest(input) {
  if (
    !input
    || typeof input.username !== 'string'
    || input.username.trim() === ''
  ) {
    return {
      status: 'invalid-username'
    };
  }

  if (
    input.id !== undefined
    && (
      !Number.isInteger(input.id)
      || input.id < 0
      || input.id > 99
    )
  ) {
    return {
      status: 'invalid-segment-id'
    };
  }

  return {
    status: 'valid',
    request: {
      username: input.username.trim(),
      id: input.id,
      mode: input.id === undefined
        ? 'default'
        : 'explicit'
    }
  };
}
```

## 提交下一 tick 请求

```js
function submitForeignRequest(request) {
  if (request.mode === 'default') {
    RawMemory.setActiveForeignSegment(
      request.username
    );
  } else {
    RawMemory.setActiveForeignSegment(
      request.username,
      request.id
    );
  }

  return {
    status: 'foreign-request-submitted',
    username: request.username,
    requestedId: request.id ?? null,
    mode: request.mode,
    requestedAt: Game.time
  };
}
```

清除下一 tick 的 Foreign Segment 请求：

```js
function clearForeignRequest() {
  RawMemory.setActiveForeignSegment(null);

  return {
    status: 'foreign-request-cleared',
    clearedAt: Game.time
  };
}
```

## 匹配上一 tick 的返回对象

`RawMemory.foreignSegment` 包含 `username`、`id` 和 `data`。显式请求必须匹配用户名和 ID；默认请求必须匹配用户名，并记录实际返回 ID。

```js
function matchForeignSegment(
  pending,
  foreignSegment
) {
  if (!pending) {
    return {
      status: 'no-pending-request'
    };
  }

  if (
    !foreignSegment
    || typeof foreignSegment !== 'object'
  ) {
    return {
      status: 'foreign-segment-unavailable'
    };
  }

  if (
    foreignSegment.username
      !== pending.username
  ) {
    return {
      status: 'username-mismatch'
    };
  }

  if (
    pending.mode === 'explicit'
    && foreignSegment.id !== pending.id
  ) {
    return {
      status: 'segment-id-mismatch'
    };
  }

  return {
    status: 'foreign-segment-matched',
    username: foreignSegment.username,
    segmentId: foreignSegment.id,
    data: foreignSegment.data,
    mode: pending.mode
  };
}
```

请求提交成功不等于下一 tick 必然得到数据。对方可能没有公开该 ID、没有默认公开 Segment，或者请求配置已改变。

## 把远端字符串当作不可信输入

```js
function parsePublicEnvelope(
  raw,
  expectedPublisher,
  expectedSegmentId
) {
  if (typeof raw !== 'string') {
    return {
      status: 'invalid-data-type',
      envelope: null
    };
  }

  let value;

  try {
    value = JSON.parse(raw);
  } catch {
    return {
      status: 'invalid-json',
      envelope: null
    };
  }

  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
  ) {
    return {
      status: 'invalid-envelope',
      envelope: null
    };
  }

  if (value.schemaVersion !== 1) {
    return {
      status: 'unsupported-schema',
      envelope: null
    };
  }

  if (value.publisher !== expectedPublisher) {
    return {
      status: 'publisher-mismatch',
      envelope: null
    };
  }

  if (value.segmentId !== expectedSegmentId) {
    return {
      status: 'envelope-segment-mismatch',
      envelope: null
    };
  }

  if (
    typeof value.publisherEpoch !== 'string'
    || value.publisherEpoch === ''
    || !Number.isInteger(value.revision)
    || value.revision < 0
  ) {
    return {
      status: 'invalid-version-fields',
      envelope: null
    };
  }

  return {
    status: 'valid',
    envelope: value
  };
}
```

不要执行远端字符串，不要把它传给 `eval()`、`Function()` 或动态模块加载。

## 用本地观察窗口判断停滞

```js
function observePublicStream({
  previous,
  envelope,
  observedSegmentId,
  now,
  maxSilentTicks = 100
}) {
  const streamChanged =
    !previous
    || previous.publisherEpoch
      !== envelope.publisherEpoch
    || previous.segmentId
      !== observedSegmentId;

  if (
    !streamChanged
    && envelope.revision
      < previous.revision
  ) {
    return {
      status: 'revision-regressed',
      state: previous
    };
  }

  const advanced =
    streamChanged
    || envelope.revision
      > previous.revision;
  const next = {
    publisherEpoch: envelope.publisherEpoch,
    segmentId: observedSegmentId,
    revision: envelope.revision,
    lastCheckedAt: now,
    lastAdvancedAt: advanced
      ? now
      : previous.lastAdvancedAt
  };

  if (
    !advanced
    && now - next.lastAdvancedAt
      > maxSilentTicks
  ) {
    return {
      status: 'public-stream-stale',
      state: next,
      silentTicks:
        now - next.lastAdvancedAt
    };
  }

  return {
    status: streamChanged
      ? 'public-stream-started'
      : advanced
        ? 'public-stream-advanced'
        : 'public-stream-unchanged',
    state: next,
    silentTicks:
      now - next.lastAdvancedAt
  };
}
```

默认公开 Segment 的实际 ID 发生变化时，应视为新流，而不是在旧 ID 上继续比较 Revision。

## 轮询多个订阅

因为同时只能访问一个 Foreign Segment，多个订阅必须排队。

```js
function rotateSubscriptionQueue(
  subscriptions,
  cursor
) {
  if (
    !Array.isArray(subscriptions)
    || subscriptions.length === 0
  ) {
    return {
      status: 'no-subscriptions',
      nextCursor: 0,
      subscription: null
    };
  }

  const safeCursor =
    Number.isInteger(cursor)
      ? Math.max(0, cursor)
      : 0;
  const index =
    safeCursor % subscriptions.length;

  return {
    status: 'subscription-selected',
    nextCursor:
      (index + 1) % subscriptions.length,
    subscription: subscriptions[index]
  };
}
```

## 一个请求协调器

```js
function finalizeForeignSegmentTick(
  subscriptions
) {
  Memory.foreignSegmentReader ??= {
    cursor: 0,
    pending: null,
    observations: {}
  };

  const state = Memory.foreignSegmentReader;
  const previousMatch = matchForeignSegment(
    state.pending,
    RawMemory.foreignSegment
  );
  const selected = rotateSubscriptionQueue(
    subscriptions,
    state.cursor
  );

  if (!selected.subscription) {
    clearForeignRequest();
    state.pending = null;

    return {
      previousMatch,
      nextRequest: {
        status: 'no-subscriptions'
      }
    };
  }

  const normalized = normalizeForeignRequest(
    selected.subscription
  );

  if (normalized.status !== 'valid') {
    clearForeignRequest();
    state.pending = null;
    state.cursor = selected.nextCursor;

    return {
      previousMatch,
      nextRequest: normalized
    };
  }

  const submitted = submitForeignRequest(
    normalized.request
  );

  state.cursor = selected.nextCursor;
  state.pending = {
    ...normalized.request,
    requestedAt: Game.time
  };

  return {
    previousMatch,
    nextRequest: submitted
  };
}
```

调用顺序应是：先消费上一 tick 的 `foreignSegment`，再为下一 tick 提交一个请求。

## 常见错误

- 同一个 tick 连续请求多个玩家，以为全部都会返回；
- 调用 `setActiveForeignSegment()` 后立即读取；
- 多个模块分别调用 `setPublicSegments()`；
- 把 `setPublicSegments([1])` 当成“追加 1”；
- 在本文项目策略下，非空默认 ID 未包含在同一份公开列表中；
- 请求默认 Segment 时错误传入第二个 `null`；
- 不检查返回对象的用户名与 ID；
- 默认 Segment ID 切换后继续沿用旧 Revision；
- 直接解析并信任远端 Payload；
- 使用 `eval()` 执行公开字符串；
- 把 Token、密码、私有房间规划写入公开 Segment；
- 无限增长公共历史记录直至接近 100 KB。

## 验证状态与适用边界

仓库离线模拟覆盖公开列表规范化、覆盖式配置、本文项目策略下的默认 ID 成员关系、下一 tick 请求身份、显式与默认 ID 匹配、无效订阅后的游标推进、轮询、UTF-8 容量、Envelope 解析、Revision 回退、发布者重启和本地停滞观察。

这些检查不能证明官方服务器上的真实公开传播延迟、其他玩家实时修改默认 Segment 的具体时序、私人服务器差异、公开数据的真实性或长期 CPU 成本。因此 `consoleTested` 和 `liveTested` 保持为 `false`。

## 相关站内内容

- [RawMemory segments 怎么跨 tick 安全读取和写回](/blog/screeps-rawmemory-segments)
- [InterShardMemory 跨 Shard 状态同步](/blog/screeps-intershardmemory-sync)
- [Screeps Memory 入门](/blog/screeps-memory-basics)
- [Screeps global 缓存怎么安全重建](/blog/screeps-global-cache)
- [房间异常隔离](/blog/screeps-room-error-isolation)

## 官方资料

- [RawMemory.foreignSegment](https://docs.screeps.com/api/#RawMemory.foreignSegment)
- [RawMemory.setActiveForeignSegment](https://docs.screeps.com/api/#RawMemory.setActiveForeignSegment)
- [RawMemory.setPublicSegments](https://docs.screeps.com/api/#RawMemory.setPublicSegments)
- [RawMemory.setDefaultPublicSegment](https://docs.screeps.com/api/#RawMemory.setDefaultPublicSegment)
- [RawMemory.segments](https://docs.screeps.com/api/#RawMemory.segments)
