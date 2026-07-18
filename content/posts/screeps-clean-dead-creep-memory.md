---
title: "Screeps 如何清理死亡 Creep 的 Memory"
description: "删除 Memory.creeps 中已经没有对应 Game.creeps 对象的残留键，给出最小代码、返回值检查和适用边界。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Screeps 清理死亡 Creep Memory"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。本文示例只经过 JavaScript 语法与静态 API 检查；对象名称、房间、资源和策略参数需要按实际环境修改，运行行为待 Screeps 环境验证。

遇到这个问题时，先不要继续增加角色系统或调度框架。本文只检查一件事：删除 Memory.creeps 中已经没有对应 Game.creeps 对象的残留键。

## 先给判断

现有 Memory 入门只说明残留现象，本文只处理安全清理条件和放置位置。第一项检查是确认代码拿到的对象确实存在，再保存关键 API 的返回值。没有返回值，画面上的“没反应”很难区分是距离、资源、所有权还是目标问题。

## 需要知道的规则

- Game.creeps 只包含当前存在且属于玩家的 Creep。
- Memory.creeps 可以保留已经死亡 Creep 的数据。
- 删除前必须用名称确认 Game.creeps[name] 不存在。

## 可放进 main 的最小示例

运行前提：示例中的对象名称和房间条件需要按自己的环境修改。

```js
module.exports.loop = function () {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }

  // 其他房间逻辑放在清理之后。
};
```

这段代码的重点不是架构，而是让每个可能为空的对象都有检查，并把关键调用结果保留下来。

## 按顺序排查

1. 确认只遍历 Memory.creeps。
2. 确认不存在同名 Game.creeps 后才删除。
3. 清理逻辑每 tick 可重复执行。
4. 返回 `ERR_NOT_IN_RANGE` 时只安排移动，下一 tick 再调用动作。
5. 返回其他错误常量时，回到官方 API 对照当前对象、资源、容量、所有权和冷却条件。

## 适用范围

本文不处理多房间调度、全局任务队列、性能排名或自动布局。示例来自官方 API 规则整理，未在用户的 Screeps 账号中运行。

## 继续学习

- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间基础代码](/blog/screeps-first-room-code)

## 官方资料

- [Screeps API：Game 与 Memory](https://docs.screeps.com/api/)
- [Global Objects](https://docs.screeps.com/global-objects.html)

