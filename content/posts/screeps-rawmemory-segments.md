---
title: "RawMemory segments 怎么跨 tick 读取"
description: "激活一个 RawMemory segment，在下一 tick 检查可用性，安全解析 JSON 并把更新结果写回字符串。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
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
  checkedAt: "2026-07-19"
featured: false
---


本文激活一个 segment，在下一 tick 检查可用性，安全解析 JSON 并写回字符串。

## 先给结论

Segment 在本 tick 激活后，要到下一 tick 才能从 `RawMemory.segments` 读取。示例明确区分激活、等待、解析和写回四个步骤。

## 官方规则

- setActiveSegments 请求的 segment 在下一 tick 可用。
- RawMemory.segments 的值是字符串。
- segment ID 范围、同时激活数量与单 segment 大小受官方限制。

## 最小完整示例

### `main` 模块

```js
module.exports.loop = function () {
  RawMemory.setActiveSegments([0]);

  const raw = RawMemory.segments[0];
  if (raw === undefined) {
    return;
  }

  let data;
  try {
    data = raw.length > 0 ? JSON.parse(raw) : {};
  } catch (error) {
    console.log('segment JSON 无法解析:', error.message);
    return;
  }

  data.lastSeen = Game.time;
  RawMemory.segments[0] = JSON.stringify(data);
};
```

## 检查顺序

1. 每 tick 请求 active segment。
2. undefined 时等待下一 tick。
3. JSON.parse 失败时不覆盖原 segment。
4. 关键对象可能为 `undefined` 或 `null` 时提前返回。
5. 不把一次 Console 输出写成长期性能、通知送达或游戏行为结论。

## 适用范围

示例没有实现完整调度、长期统计或多 shard 架构。JavaScript 语法检查通过，待 Screeps 环境验证。

## 相关站内内容

- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [知识库查询与工具](https://www.linqingan.com/knowledge#reference-tools)

## 官方资料

- [RawMemory API](https://docs.screeps.com/api/#RawMemory)
- [Global Objects](https://docs.screeps.com/global-objects.html)
