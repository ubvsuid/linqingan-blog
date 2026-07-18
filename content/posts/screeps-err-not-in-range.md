---
title: "Screeps ERR_NOT_IN_RANGE 怎么处理"
description: "解释 ERR_NOT_IN_RANGE 表示的距离条件，并用“先移动、下一 tick 再重试”处理需要接近目标的 Creep 动作。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-18"
category: "Screeps 错误排查"
tags:
  - "Screeps"
  - "错误排查"
  - "错误码"
  - "Creep API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-19"
featured: false
---


`ERR_NOT_IN_RANGE` 表示动作目标存在，但执行者还没进入该 API 要求的距离。常见处理是本 tick 移动，下一 tick 再尝试动作。

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

本文只说明动作距离不足时的“先移动、下一 tick 再调用”模式，不替代具体 API 的其他返回值排查。

## 相关站内内容

- [第一次采集 Energy](/blog/screeps-first-creep-harvest)
- [从 Container 取 Energy](/blog/screeps-creep-withdraw-container-energy)
- [错误码索引](https://www.linqingan.com/screeps-errors)

## 官方资料

- [Screeps API 错误常量](https://docs.screeps.com/api/#Constants-Error-Codes)
- [Creep API](https://docs.screeps.com/api/#Creep)
