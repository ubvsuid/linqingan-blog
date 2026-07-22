---
title: "Screeps 工地进度怎么看：progress、progressTotal 与剩余量"
description: "读取 ConstructionSite.progress 与 progressTotal，计算完成率和剩余进度，并用 FIND_MY_CONSTRUCTION_SITES 定期输出房间工地状态。"
publishedAt: "2026-07-21"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "Construction Site"
  - "Room API"
  - "运行诊断"
  - "基础工程"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（普通对象模拟 ConstructionSite 数值）"
  testResult: "正常进度、超过总量保护、总量为 0 和按剩余量排序场景通过。"
featured: false
---

工地已经放下，Builder 也在工作，但“还差多少”不能靠观察单位是否移动来判断。

Construction Site 自带两个数值：

- `progress`：当前已经积累的建造进度；
- `progressTotal`：完成这个结构需要的总建造进度。

剩余量是 `progressTotal - progress`。完成率则需要自己计算，它不是 Construction Site 的官方字段。

## 先在 Console 看一个房间

```js
const room = Game.rooms['W1N1'];

if (!room) {
  console.log('房间当前不可见');
} else {
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES);

  for (const site of sites) {
    console.log(
      site.structureType,
      site.progress,
      site.progressTotal
    );
  }
}
```

`FIND_MY_CONSTRUCTION_SITES` 只返回自己的工地。把 `W1N1` 换成实际房间名。

如果数组为空，先不要认定 Builder 代码坏了。可能是房间没有己方工地、工地已经完成、工地已被删除，或者当前没有该房间视野。

## 计算剩余量和完成率

```js
const remaining = Math.max(
  0,
  site.progressTotal - site.progress
);

const percent = site.progressTotal > 0
  ? Math.min(
      100,
      Math.floor(
        (site.progress / site.progressTotal) * 100
      )
    )
  : 0;
```

这里做了三层保护：

1. `Math.max(0, ...)` 不让剩余量出现负数；
2. 总进度大于 0 才做除法；
3. `Math.min(100, ...)` 把显示值限制在 100% 以内。

`Math.floor()` 只是把显示结果变成整数百分比。它不是 Screeps 的进度规则，也不会改变游戏对象。

## 每 50 tick 输出一次完整报告

下面的代码读取一个当前可见房间，按“剩余进度从少到多”排序，然后输出结构类型、坐标、当前值、完成率和剩余量。

```js
function getConstructionSiteReport(room) {
  const sites = room.find(FIND_MY_CONSTRUCTION_SITES);

  return sites.map(function (site) {
    const progress = site.progress;
    const total = site.progressTotal;
    const remaining = Math.max(0, total - progress);
    const percent = total > 0
      ? Math.min(100, Math.floor((progress / total) * 100))
      : 0;

    return {
      id: site.id,
      type: site.structureType,
      x: site.pos.x,
      y: site.pos.y,
      progress,
      total,
      remaining,
      percent
    };
  });
}

function logConstructionSiteReport(roomName) {
  const room = Game.rooms[roomName];

  if (!room) {
    console.log(`[site-progress] 房间当前不可见：${roomName}`);
    return;
  }

  const report = getConstructionSiteReport(room);

  if (report.length === 0) {
    console.log(`[site-progress] ${roomName} 没有自己的工地`);
    return;
  }

  report.sort(function (left, right) {
    return left.remaining - right.remaining;
  });

  for (const item of report) {
    console.log(
      `[site-progress] ${roomName} ${item.type} ` +
      `(${item.x}, ${item.y}) ` +
      `${item.progress}/${item.total} ` +
      `${item.percent}% 剩余 ${item.remaining}`
    );
  }
}

module.exports.loop = function () {
  if (Game.time % 50 !== 0) {
    return;
  }

  logConstructionSiteReport('W1N1');
};
```

需要修改的是最后一行中的房间名：

```js
logConstructionSiteReport('W1N1');
```

`Game.time % 50` 是这份示例选择的输出频率，不是官方规定。改成 `10` 会更频繁，改成 `100` 会更安静。若每个 tick 都输出，Console 很快会被重复信息占满。

## 离线模拟结果

构建检查使用三个简化工地对象：

| 对象 | progress | progressTotal | 结果 |
|---|---:|---:|---|
| A | 40 | 100 | 40%，剩余 60 |
| B | 120 | 100 | 100%，剩余 0 |
| C | 0 | 0 | 0%，剩余 0 |

模拟确认：

- `progress` 超过 `progressTotal` 时，显示值不会超过 100%；
- `progressTotal` 为 0 时不会除以 0；
- 剩余量不会小于 0；
- 报告按剩余量从少到多排序。

这属于 **Node.js 离线数值模拟**。它没有模拟 `Room.find()`、房间视野、Construction Site 完成后的对象替换，也没有证明 Console 输出已经出现在官方服务器。真实环境仍待验证。

## 为什么当前 tick 的数字可能没有变化

Screeps 在 tick 开始时提供当前对象状态，随后执行玩家脚本并收集命令。Builder 在本 tick 调用 `build()` 后，不应假设同一段代码再次读取 `site.progress` 就一定得到更新值。

观察施工变化时，在后续 tick 重新取得 Construction Site。这个行为与站内[怎样让 Creep 自动建造和维修](/blog/screeps-build-and-repair)中的 Builder 主循环相邻，但本文不重复采能、工作状态和 `build()` 返回值。

## 工地列表为空时按这个顺序查

### 房间是否可见

`Game.rooms[roomName]` 为 `undefined` 时，先处理视野。站内的[Game.rooms 为什么没有某个房间](/blog/screeps-room-visibility)解释了可见房间与历史 Memory 的区别。

### 是否只查自己的工地

`FIND_MY_CONSTRUCTION_SITES` 不会返回其他玩家的 Construction Site。需要观察所有可见工地时是另一种搜索意图，不应在监控己方建设的代码中混用。

### 工地是否已经完成

完成后对象会从 Construction Site 变成对应 Structure。此时 `progress` 和 `progressTotal` 不再是可查询的工地字段。

### 工地是否已经删除

尚未完成的工地可以通过[ConstructionSite.remove() 删除](/blog/screeps-construction-site-remove)。删除成功后，下一 tick 的工地列表中自然不再包含它。

## 用 Game.constructionSites 查看账号内的己方工地

需要查看当前 shard 中自己的全部 Construction Site 时，可以从 `Game.constructionSites` 取得以 ID 为键的集合：

```js
const allMySites = Object.values(Game.constructionSites);
console.log(`己方工地数量：${allMySites.length}`);
```

这里不要直接假设每个工地的 `room` 都存在。官方 API 说明 Construction Site 位于不可见房间时，其 `room` 属性可能是 `undefined`。按房间输出坐标时，优先使用 `site.pos.roomName`，或者先确认房间可见。

## 这份报告不等于完成时间预测

剩余进度可以计算，完成所需 tick 却取决于实际 Builder 数量、可用 `WORK` 部件、Energy、移动距离和任务中断。没有这些运行条件时，不应把剩余量直接换算成“还要多少分钟”。

本文只报告当前状态，不预测完工时间，也不修改 Builder 的目标选择。

## 相关内容

- [用 Room.createConstructionSite() 创建 Road 工地](/blog/screeps-room-create-construction-site)
- [让 Builder 自动建造和维修](/blog/screeps-build-and-repair)
- [删除放错的未完成工地](/blog/screeps-construction-site-remove)

## 官方资料

- [Screeps API Reference：ConstructionSite](https://docs.screeps.com/api/#ConstructionSite)
- [Screeps API Reference：Room.find](https://docs.screeps.com/api/#Room.find)
- [Screeps Documentation：Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。代码语法与离线数值模拟已通过；房间名、工地数量、实际进度变化和 Console 输出仍为待环境验证。
