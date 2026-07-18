---
title: "Screeps ERR_NOT_IN_RANGE 怎么处理"
description: "确认动作要求的有效距离，并在返回 ERR_NOT_IN_RANGE 时先移动、下一 tick 再重试，按返回值和位置条件给出最小排查代码。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "Screeps ERR_NOT_IN_RANGE"
draft: false
featured: false
---

> 资料核对日期：2026-07-18。JavaScript 语法检查通过；对象、房间、资源和策略参数需要按实际环境替换，运行行为待 Screeps 环境验证。

画面上“单位没走”只是结果，不能直接说明原因。本文把范围限制在：确认动作要求的有效距离，并在返回 ERR_NOT_IN_RANGE 时先移动、下一 tick 再重试。

## 第一项检查

先确认目标对象存在，再把相关方法的返回值写进变量。现有采集、运输和 withdraw 页面分别展示过距离处理；本文把错误常量作为跨 API 的诊断目标，不重写各动作教程。

## 官方规则中的关键点

- ERR_NOT_IN_RANGE 的常量值为 -9。
- 不同动作的有效距离不同，不能统一假设为相邻。
- moveTo 只安排移动，动作通常要在后续 tick 再次调用。

## 最小完整示例

代码放在 `main` 模块；名称和目标需要按自己的房间修改。

```js
function runHarvest(creep, source) {
  const result = creep.harvest(source);

  if (result === ERR_NOT_IN_RANGE) {
    const moveResult = creep.moveTo(source);
    console.log('moveTo result:', moveResult);
  } else if (result !== OK) {
    console.log('harvest result:', result);
  }

  return result;
}

module.exports.loop = function () {
  const creep = Game.creeps.Harvester1;
  if (!creep) {
    return;
  }

  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (!source) {
    return;
  }

  runHarvest(creep, source);
};
```

## 排查顺序

1. 先保存动作返回值再判断。
2. 只有 ERR_NOT_IN_RANGE 才转为移动。
3. 动作和 moveTo 的返回值分开记录。
4. 确认目标位置是否可站立，动作目标不可站立时使用正确的距离范围。
5. 临时输出返回值和关键状态，确认问题后再删减日志。

## 文章边界

本文不提供完整交通系统、自动布局或 CPU 优化结论。没有真实环境材料，路径与移动效果待 Screeps 环境验证。

## 相关站内内容

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [错误码索引](https://www.linqingan.com/screeps-errors)

## 官方资料

- [Screeps API 错误常量](https://docs.screeps.com/api/#Constants-Error-Codes)
- [Creep API](https://docs.screeps.com/api/#Creep)

