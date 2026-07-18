---
title: "RawMemory segments 怎么跨 tick 读取"
description: "激活一个 segment，在下一 tick 检查可用性，安全解析 JSON 并写回字符串，提供变量完整的最小示例、边界和验证清单。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 进阶开发"
tags:
  - "Screeps"
  - "进阶开发"
  - "Screeps RawMemory segments"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；示例中的房间、名称、Memory 配置、资源与策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

本文激活一个 segment，在下一 tick 检查可用性，安全解析 JSON 并写回字符串。

## 先给结论

Memory 入门处理常规 JSON 数据；本文只讲异步 segment 的激活时序和原始字符串。先检查对象和配置是否存在，再执行最小调用；可丢失状态与必须持久化的数据要分开。

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
- [Screeps 资料页](https://www.linqingan.com/resources)

## 官方资料

- [RawMemory API](https://docs.screeps.com/api/#RawMemory)
- [Global Objects](https://docs.screeps.com/global-objects.html)

