---
title: "Screeps 如何清理死亡 Creep 的 Memory"
description: "介绍如何检测已经死亡的 Creep，并删除 Memory.creeps 中的残留数据，包含最小代码、放置位置和常见错误。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-19"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "Memory"
  - "Creep"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


Creep 死亡后，`Game.creeps` 中已经没有它，但 `Memory.creeps` 里以名称保存的数据可能仍然存在。清理的判断条件因此很简单：Memory 中有这个名称，而当前 tick 的 `Game.creeps` 中没有。

## 为什么要比较两个对象

- `Game.creeps` 保存当前属于你的 Creep，并以名称为键。
- `Memory.creeps` 保存你写入的 Creep Memory；对应 Creep 消失后，旧键仍可能留下。
- 删除目标应是单个 `Memory.creeps[name]`，不能把整个 `Memory.creeps` 清空。

这项清理只处理已经不存在的 Creep，不判断角色、能量、位置或 API 返回值。

## 可直接放进 main 的最小代码

```js
function cleanDeadCreepMemory() {
  if (!Memory.creeps) {
    return 0;
  }

  let removed = 0;

  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      removed += 1;
      console.log(`[memory] removed dead creep: ${name}`);
    }
  }

  return removed;
}

module.exports.loop = function () {
  cleanDeadCreepMemory();

  // 其他 Creep、Spawn 与房间逻辑放在这里。
};
```

## 这段代码应该放在哪里

把清理函数放在 `main` 模块或独立的 Memory 工具模块中，并在 `module.exports.loop` 开头调用。这样同一 tick 后面的角色统计、补员和任务分配读到的就是已经清理过的 Memory。

函数必须从主循环调用。只在模块顶层执行一次，会让它仅在全局重置后运行，不能保证每个 tick 都检查残留数据。

## 为什么示例保留临时日志

删除时输出名称，便于确认清理条件确实命中。观察几个死亡与补员周期后，应删除这行日志或改成受控的调试开关，避免控制台长期重复输出。

## 常见错误

1. 遍历 `Game.creeps` 查找死亡单位。死亡 Creep 已经不在这个对象中，应该遍历 `Memory.creeps`。
2. 使用 `if (!Memory.creeps[name])` 判断。循环中的键本来就存在，应该检查 `Game.creeps[name]`。
3. 直接执行 `delete Memory.creeps`。这会同时删除所有存活 Creep 的 Memory。
4. 把清理代码放在角色循环之后。前面的统计仍可能读到过期条目。
5. 长期保留每次删除的日志。日志只用于验证清理逻辑，不应当成运行成功证明。

## 适用边界

示例只清理 `Memory.creeps`。如果你的系统还保存了按 Creep 名称索引的任务表、队列或缓存，需要为那些自定义结构另写清理规则，不能假设删除 `Memory.creeps[name]` 会自动同步其他数据。

## 继续学习

- [Memory 基础用法](/blog/screeps-memory-basics)
- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [第一份房间基础代码](/blog/screeps-first-room-code)

## 官方资料

- [Game.creeps 与 Memory](https://docs.screeps.com/api/)
- [Global Objects](https://docs.screeps.com/global-objects.html)
