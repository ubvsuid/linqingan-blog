---
title: "Screeps InterShardMemory 怎么用：跨 Shard 状态同步、版本校验与过期数据"
description: "使用 InterShardMemory 在多个 Screeps shard 之间交换版本化状态：安全解析本地和远端字符串、控制 UTF-8 容量、识别 writerEpoch 重启与 revision 回退，并用接收方自己的观察窗口判断远端 channel 是否停滞。"
publishedAt: "2026-08-06"
updatedAt: "2026-08-06"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "InterShardMemory"
  - "Memory"
  - "自动化"
draft: false
featured: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-08-06"
  testedAt: "2026-08-06"
  testEnvironment: "Node.js 22 离线模拟与确定性状态检查，不是 Screeps 官方服务器"
  testResult: "覆盖 UTF-8 字节计数、空数据与损坏 JSON、schema/source 校验、revision 推进与回退、writerEpoch 重启、容量拒绝、本地观察过期状态和 offer/ack 身份约束。"
---

`Memory`、`RawMemory.segments` 和 `InterShardMemory` 解决的是三个不同的问题：

| 数据容器 | 写入范围 | 主要用途 |
|---|---|---|
| `Memory` | 当前 shard | 每 tick 常用的持久状态 |
| `RawMemory.segments` | 当前 shard | 大型、按需激活的数据块 |
| `InterShardMemory` | 当前 shard 只能写自己的字符串；其他 shard 只读 | 跨 shard 状态交换 |

官方 API 当前说明：每个 shard 有一份独立的 100 KB 字符串；本 shard 只能通过 `setLocal()` 替换自己的整份字符串，其他 shard 的数据只能通过 `getRemote()` 读取。因此，它不是“所有 shard 共同修改的共享对象”，而是多个 shard 各自发布、彼此订阅的状态总线。

## 快速答案

一个可维护的同步层至少要做到：

1. 为整份数据保存 `schemaVersion`、`sourceShard`、`writerEpoch` 和 `revision`；
2. 为每个业务 channel 保存独立 revision；
3. 本地字符串损坏时停止自动覆盖；
4. `setLocal()` 前按 UTF-8 字节数检查容量，并保留安全余量；
5. 不直接用远端 `Game.time` 与本地 `Game.time` 相减判断过期；
6. 用接收方本地观察窗口记录 revision 多久没有推进；
7. writer epoch 改变时把它当作新数据流；
8. 跨 shard 交接使用 offer/ack，而不是尝试写远端数据；
9. 限制消息历史，避免整份字符串无限增长。

## writerEpoch：区分回退与重新初始化

单独使用 revision 不够。数据被清空或迁移后，revision 可能从 0 重新开始；如果没有 epoch，接收方会把合法重启误判为永久回退。

```js
function createWriterEpoch(shardName, now) {
  if (
    typeof shardName !== 'string'
    || shardName.trim() === ''
    || !Number.isInteger(now)
  ) {
    return null;
  }

  return shardName + ':' + now;
}
```

本地 envelope 有效时继续沿用已有 epoch；只有开始一条新本地数据流时才创建新 epoch。

## 精确计算 UTF-8 字节数

JavaScript 的 `text.length` 统计 UTF-16 code unit，不等于实际 UTF-8 字节数。中文和 emoji 会占用多个字节。

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

生产代码可使用 `96 * 1024` 作为保守上限，为后续字段和编码差异留出空间，而不是把发布推到 100 KB 边缘。

## 定义版本化 envelope

```js
function createEmptyEnvelope(
  shardName,
  writerEpoch,
  now
) {
  return {
    schemaVersion: 1,
    sourceShard: shardName,
    writerEpoch,
    revision: 0,
    writtenAtTick: now,
    channels: {}
  };
}
```

`writtenAtTick` 只作为来源 shard 的诊断字段。官方文档说明各 shard 的脚本和 Memory 分离执行，但没有保证你可以把两个 shard 的 tick 计数当成统一业务时钟。过期判断应使用接收方自己的观察 tick。

## 安全解析字符串

```js
function parseInterShardEnvelope(
  raw,
  expectedShard
) {
  if (raw === '') {
    return { status: 'empty', envelope: null };
  }

  if (typeof raw !== 'string') {
    return {
      status: 'invalid-raw-type',
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

  if (value.sourceShard !== expectedShard) {
    return {
      status: 'source-shard-mismatch',
      envelope: null
    };
  }

  if (
    typeof value.writerEpoch !== 'string'
    || value.writerEpoch === ''
    || !Number.isInteger(value.revision)
    || value.revision < 0
    || !value.channels
    || typeof value.channels !== 'object'
    || Array.isArray(value.channels)
  ) {
    return {
      status: 'invalid-envelope-fields',
      envelope: null
    };
  }

  return {
    status: 'valid',
    envelope: value
  };
}
```

不要把损坏 JSON 自动转换为空对象后覆盖。应保留 `invalid-json`、`unsupported-schema`、`source-shard-mismatch` 等独立证据。

## 加载本地 envelope

```js
function loadLocalEnvelope() {
  const shardName = Game.shard.name;
  const raw = InterShardMemory.getLocal();
  const parsed = parseInterShardEnvelope(
    raw,
    shardName
  );

  if (parsed.status === 'valid') {
    Memory.interShard ??= {};
    Memory.interShard.writerEpoch =
      parsed.envelope.writerEpoch;

    return {
      status: 'loaded',
      envelope: parsed.envelope
    };
  }

  if (parsed.status !== 'empty') {
    return {
      status: 'local-data-invalid',
      reason: parsed.status,
      envelope: null
    };
  }

  Memory.interShard ??= {};
  const writerEpoch = createWriterEpoch(
    shardName,
    Game.time
  );
  Memory.interShard.writerEpoch = writerEpoch;

  return {
    status: 'created-empty',
    envelope: createEmptyEnvelope(
      shardName,
      writerEpoch,
      Game.time
    )
  };
}
```

本地数据损坏时返回 `local-data-invalid`，不要继续调用 `setLocal()`。

## 发布本地 channel

```js
const INTERSHARD_SAFE_BYTE_LIMIT = 96 * 1024;

function publishLocalChannel(
  channelName,
  nextValue
) {
  if (
    typeof channelName !== 'string'
    || channelName.trim() === ''
  ) {
    return { status: 'invalid-channel-name' };
  }

  const loaded = loadLocalEnvelope();

  if (!loaded.envelope) {
    return loaded;
  }

  const previous =
    loaded.envelope.channels[channelName];
  const channelRevision =
    Number.isInteger(previous?.revision)
      ? previous.revision + 1
      : 1;
  const nextEnvelope = {
    ...loaded.envelope,
    revision: loaded.envelope.revision + 1,
    writtenAtTick: Game.time,
    channels: {
      ...loaded.envelope.channels,
      [channelName]: {
        revision: channelRevision,
        updatedAtTick: Game.time,
        value: nextValue
      }
    }
  };
  const serialized = JSON.stringify(nextEnvelope);
  const byteLength = utf8ByteLength(serialized);

  if (byteLength > INTERSHARD_SAFE_BYTE_LIMIT) {
    return {
      status: 'payload-too-large',
      byteLength
    };
  }

  InterShardMemory.setLocal(serialized);

  return {
    status: 'local-write-called',
    byteLength,
    envelopeRevision: nextEnvelope.revision,
    channelRevision
  };
}
```

`setLocal()` 替换整份本地字符串，所以必须先读取、合并，再完整写回。API 没有文档化 `OK` 返回码，因此本文只记录 `local-write-called`：它表示本地函数已调用，不表示远端 shard 已观察到新 revision。

## 读取远端 channel

```js
function readRemoteChannel(
  remoteShard,
  channelName
) {
  if (
    typeof remoteShard !== 'string'
    || remoteShard === ''
    || remoteShard === Game.shard.name
  ) {
    return { status: 'invalid-remote-shard' };
  }

  const raw = InterShardMemory.getRemote(
    remoteShard
  );
  const parsed = parseInterShardEnvelope(
    raw,
    remoteShard
  );

  if (parsed.status !== 'valid') {
    return {
      status: parsed.status,
      remoteShard
    };
  }

  const channel =
    parsed.envelope.channels[channelName];

  if (
    !channel
    || !Number.isInteger(channel.revision)
    || channel.revision < 0
  ) {
    return {
      status: 'channel-missing',
      remoteShard,
      writerEpoch: parsed.envelope.writerEpoch
    };
  }

  return {
    status: 'channel-read',
    remoteShard,
    writerEpoch: parsed.envelope.writerEpoch,
    envelopeRevision: parsed.envelope.revision,
    channelRevision: channel.revision,
    value: channel.value
  };
}
```

远端数据只读。回应、确认和 acknowledgement 必须写在接收方自己的本地 channel 中。

## 用接收方本地窗口判断停滞

```js
function observeRemoteChannel(
  remoteShard,
  channelName,
  maxSilentTicks = 100
) {
  const result = readRemoteChannel(
    remoteShard,
    channelName
  );

  if (result.status !== 'channel-read') {
    return result;
  }

  Memory.interShardObservers ??= {};
  const key = remoteShard + ':' + channelName;
  const previous =
    Memory.interShardObservers[key];
  const streamChanged =
    !previous
    || previous.writerEpoch !== result.writerEpoch;

  if (
    !streamChanged
    && result.channelRevision
      < previous.channelRevision
  ) {
    return {
      status: 'revision-regressed',
      remoteShard,
      channelName,
      previousRevision: previous.channelRevision,
      observedRevision: result.channelRevision
    };
  }

  const advanced =
    streamChanged
    || result.channelRevision
      > previous.channelRevision;
  const next = {
    writerEpoch: result.writerEpoch,
    channelRevision: result.channelRevision,
    lastCheckedAt: Game.time,
    lastAdvancedAt: advanced
      ? Game.time
      : previous.lastAdvancedAt
  };

  Memory.interShardObservers[key] = next;

  if (
    !advanced
    && Game.time - next.lastAdvancedAt
      > maxSilentTicks
  ) {
    return {
      ...result,
      status: 'channel-stale',
      silentTicks:
        Game.time - next.lastAdvancedAt
    };
  }

  return {
    ...result,
    status: streamChanged
      ? 'stream-started'
      : advanced
        ? 'channel-advanced'
        : 'channel-unchanged',
    silentTicks:
      Game.time - next.lastAdvancedAt
  };
}
```

同一 writer epoch 下 revision 下降是 `revision-regressed`；writer epoch 改变则是新流。`channel-stale` 只说明接收方在自己的观察窗口内没有看到推进，不能证明远端 shard 已停止运行。

## 跨 shard 交接：offer/ack

来源 shard 发布 offer：

```js
function buildOutboundHandoff(
  creep,
  targetShard
) {
  if (
    !creep
    || typeof targetShard !== 'string'
    || targetShard === ''
  ) {
    return null;
  }

  return {
    handoffId:
      Game.shard.name
      + ':'
      + creep.name
      + ':'
      + Game.time,
    creepName: creep.name,
    sourceShard: Game.shard.name,
    targetShard,
    state: 'offered',
    offeredAtTick: Game.time,
    memory: {
      role: creep.memory.role ?? null,
      missionId: creep.memory.missionId ?? null
    }
  };
}
```

目标 shard 真正看到指定 Creep 后，在自己的字符串中发布确认：

```js
function acknowledgeRemoteHandoff(
  offer,
  observedCreep
) {
  if (
    !offer
    || offer.targetShard !== Game.shard.name
    || !observedCreep
    || observedCreep.name !== offer.creepName
  ) {
    return { status: 'handoff-not-confirmed' };
  }

  const acknowledgement = {
    handoffId: offer.handoffId,
    sourceShard: offer.sourceShard,
    targetShard: Game.shard.name,
    creepName: observedCreep.name,
    state: 'observed-on-target',
    observedAtTick: Game.time
  };

  return publishLocalChannel(
    'handoffAcknowledgements',
    {
      [offer.handoffId]: acknowledgement
    }
  );
}
```

双方都只写自己的数据：source 写 offer，target 写 acknowledgement，source 再读取 target 的远端确认。

## 限制历史记录

```js
function pruneRecordMap(
  records,
  maxRecords = 32
) {
  if (
    !records
    || typeof records !== 'object'
    || Array.isArray(records)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(records)
      .sort((left, right) => {
        const leftTick =
          left[1]?.updatedAtTick ?? 0;
        const rightTick =
          right[1]?.updatedAtTick ?? 0;

        return rightTick - leftTick
          || left[0].localeCompare(right[0]);
      })
      .slice(0, maxRecords)
  );
}
```

只保留当前快照、未确认消息和少量最近完成记录。不要序列化完整 Room、Creep 或结构对象，也不要写入外部服务密钥。

## 完整同步循环

```js
function runInterShardSync(
  remoteShards
) {
  const localStatus = {
    shard: Game.shard.name,
    tick: Game.time,
    ownedRooms: Object.values(Game.rooms)
      .filter(room => room.controller?.my)
      .map(room => room.name)
      .sort()
  };
  const publication = publishLocalChannel(
    'empireStatus',
    localStatus
  );
  const observations = [];

  for (const remoteShard of remoteShards) {
    observations.push(
      observeRemoteChannel(
        remoteShard,
        'empireStatus',
        100
      )
    );
  }

  return {
    publication,
    observations
  };
}
```

这个循环没有声称远端更新会在固定 tick 内可见，因为官方 API 没有给出传播延迟保证。

## 常见错误

- 把 InterShardMemory 当成所有 shard 共同可写的对象；
- 直接 `JSON.parse(getRemote())`，不区分空、损坏和旧 schema；
- 每次只写一个字段，导致其他 channel 被整份替换；
- 用 `text.length` 当作 UTF-8 字节数；
- 用本地 `Game.time` 减远端 `writtenAtTick`；
- 只使用 revision，不使用 writerEpoch；
- writerEpoch 变化时仍要求 revision 单调增加；
- 把 `setLocal()` 调用描述成“远端同步完成”；
- 无限追加消息历史。

## 排查清单

1. 打印当前 `Game.shard.name`；
2. 区分本地空字符串与损坏 JSON；
3. 检查 `schemaVersion`、`sourceShard` 和 writer epoch；
4. 检查 envelope revision 与 channel revision；
5. 用 UTF-8 字节数检查真实体积；
6. 确认所有写入经过同一个本地协调器；
7. 检查接收方保存的 `lastAdvancedAt`；
8. 分开记录 stale、regressed、missing 和 invalid；
9. 检查 offer 与 acknowledgement 是否由各自拥有的 shard 发布；
10. 清理已完成消息并限制历史数量。

## 验证状态与适用边界

仓库离线模拟覆盖：UTF-8 字节计数、空数据、损坏 JSON、schema/source 校验、revision 推进与回退、writerEpoch 重启、本地观察停滞、容量拒绝和 handoff 身份约束。

这些测试不能证明官方 shard 间的实际传播延迟、不同 shard tick 的现实关系、Creep 穿过 inter-shard portal 的时序、官方服务器 CPU 成本或 restricted shard access 的具体影响。因此 `consoleTested` 和 `liveTested` 保持为 `false`。

## 相关站内内容

- [RawMemory segments 怎么跨 tick 安全读取和写回](/blog/screeps-rawmemory-segments)
- [Screeps Memory 入门](/blog/screeps-memory-basics)
- [Screeps global 缓存怎么安全重建](/blog/screeps-global-cache)
- [Game.getObjectById 怎么恢复对象](/blog/screeps-game-get-object-by-id)
- [房间异常隔离](/blog/screeps-room-error-isolation)

## 官方资料

- [InterShardMemory API](https://docs.screeps.com/api/#InterShardMemory)
- [Game.shard API](https://docs.screeps.com/api/#Game.shard)
- [Global Objects 与 Memory](https://docs.screeps.com/global-objects.html)
- [Screeps Game Loop](https://docs.screeps.com/game-loop.html)
