---
title: "Game.cpu.getUsed() 和 bucket 怎么监控 CPU"
description: "区分 Game.cpu.limit、tickLimit 与 bucket，用前后差值测量代码段CPU，并通过固定样本窗口观察平均值、峰值和可选任务执行条件。"
publishedAt: "2026-07-18"
updatedAt: "2026-07-22"
category: "Screeps 基础工程"
tags:
  - "Screeps"
  - "基础工程"
  - "CPU"
  - "运行诊断"
  - "Game API"
draft: false
verification:
  docsChecked: true
  syntaxChecked: true
  consoleTested: false
  liveTested: false
  checkedAt: "2026-07-22"
  testedAt: "2026-07-22"
  testEnvironment: "Node.js 24 离线模拟（样本窗口与统计函数，不是 Screeps 官方服务器）"
  testResult: "固定窗口淘汰旧样本、空样本、平均值和最大值场景通过。"
featured: false
---

`Game.cpu.getUsed()` 可以告诉你当前tick从脚本开始到调用位置已经使用了多少CPU。把它放在一段代码前后做差，就能得到这段代码在当前tick里的近似消耗。

但一次差值不能直接证明“这段代码稳定消耗多少CPU”。全局重置、首次访问Memory、对象数量、路径搜索输入和同一tick中的其他工作都会影响结果。

本文只解决一个问题：怎样正确读取`limit`、`tickLimit`和`bucket`，并用固定样本窗口观察一段代码的CPU变化。

## 先区分四个值

| 属性或方法 | 表示什么 | 常见误解 |
|---|---|---|
| `Game.cpu.getUsed()` | 当前tick截至调用位置已经使用的CPU | 不是剩余CPU |
| `Game.cpu.limit` | 当前shard分配给账号的基础CPU额度 | 不是当前tick一定能用到的上限 |
| `Game.cpu.tickLimit` | 当前tick实际可使用的CPU上限 | 会受到bucket积累影响 |
| `Game.cpu.bucket` | 之前未使用额度积累的CPU储备 | 不是当前tick已经消耗的CPU |

在官方在线环境中，bucket最多积累到10,000；有储备时，脚本可以在某些tick超过基础`limit`。官方文档说明`tickLimit`不会低于`limit`，bucket充满时`tickLimit`可达到500。

社区服务器可以调整相关设置，因此不要把官方服务器的具体数字当成所有环境都相同的常量。

## `getUsed()`测量的是差值

最小写法如下：

```js
const start = Game.cpu.getUsed();

const myCreeps = Object.values(Game.creeps).filter(
  creep => creep.my
);

const used = Game.cpu.getUsed() - start;
console.log('measured CPU:', used);
```

这里的`used`包含：

- `Object.values(Game.creeps)`；
- `filter()`遍历；
- 回调判断；
- 两次`getUsed()`之间的其他同步操作。

它不代表整个主循环CPU，也不代表每只Creep的平均消耗。

## 写一个可复用的测量函数

```js
function measureCpu(label, callback) {
  const start = Game.cpu.getUsed();
  const value = callback();
  const used = Game.cpu.getUsed() - start;

  return {
    label,
    value,
    used
  };
}
```

使用方式：

```js
const measurement = measureCpu(
  'owned-creep-count',
  function () {
    return Object.values(Game.creeps).filter(
      creep => creep.my
    ).length;
  }
);
```

`value`保留原计算结果，`used`保存测量差值。这样测量函数不会迫使业务代码为了统计而重复执行一遍。

如果回调抛出异常，本文不自动吞掉错误。隐藏异常会让CPU日志看似正常，但主循环实际已经中断。错误边界应由更上层的模块运行器处理。

## 用固定窗口观察多次样本

单次样本容易受运行时状态影响。下面用模块顶层数组保存最近100次结果：

```js
const CPU_SAMPLE_LIMIT = 100;
const cpuSamples = [];

function appendCpuSample(value) {
  cpuSamples.push(value);

  while (cpuSamples.length > CPU_SAMPLE_LIMIT) {
    cpuSamples.shift();
  }
}

function summarizeCpuSamples(samples) {
  if (samples.length === 0) {
    return {
      count: 0,
      average: 0,
      maximum: 0
    };
  }

  const total = samples.reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    count: samples.length,
    average: total / samples.length,
    maximum: Math.max(...samples)
  };
}
```

这里使用模块全局缓存，所以运行时重置后样本会消失。这是刻意的：这些样本只是短期诊断数据，不应被误认为长期统计。

## 可放进`main`的完整示例

```js
const CPU_SAMPLE_LIMIT = 100;
const cpuSamples = [];

function measureCpu(label, callback) {
  const start = Game.cpu.getUsed();
  const value = callback();
  const used = Game.cpu.getUsed() - start;

  return {
    label,
    value,
    used
  };
}

function appendCpuSample(value) {
  cpuSamples.push(value);

  while (cpuSamples.length > CPU_SAMPLE_LIMIT) {
    cpuSamples.shift();
  }
}

function summarizeCpuSamples(samples) {
  if (samples.length === 0) {
    return {
      count: 0,
      average: 0,
      maximum: 0
    };
  }

  const total = samples.reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    count: samples.length,
    average: total / samples.length,
    maximum: Math.max(...samples)
  };
}

module.exports.loop = function () {
  const measurement = measureCpu(
    'owned-creep-count',
    function () {
      return Object.values(Game.creeps).filter(
        creep => creep.my
      ).length;
    }
  );

  appendCpuSample(measurement.used);

  if (Game.time % 100 !== 0) {
    return;
  }

  const summary = summarizeCpuSamples(cpuSamples);

  console.log({
    section: measurement.label,
    current: measurement.used,
    samples: summary.count,
    average: summary.average,
    maximum: summary.maximum,
    creepCount: measurement.value,
    limit: Game.cpu.limit,
    tickLimit: Game.cpu.tickLimit,
    bucket: Game.cpu.bucket,
    totalUsedNow: Game.cpu.getUsed()
  });
};
```

这份日志能回答：

- 当前样本用了多少CPU；
- 最近窗口平均值是多少；
- 窗口峰值是多少；
- 当前Creep数量是多少；
- 基础额度和本tick额度分别是多少；
- bucket当前处于什么水平；
- 输出日志前整个脚本已经使用多少CPU。

## 为什么日志只每100 tick输出一次

`console.log()`本身也会增加工作量，并让Console被重复信息占满。每个tick都打印CPU值通常会带来三个问题：

1. 重要错误被大量样本淹没；
2. 你开始观察日志成本，而不是原业务成本；
3. 很难从连续数字中看出趋势。

示例仍然每tick采样，只是每100tick汇总输出。`100`是本文的实现选择，不是官方规则。

## `limit`、`tickLimit`和bucket怎样一起看

假设当前看到：

```js
{
  limit: 20,
  tickLimit: 500,
  bucket: 10000
}
```

它表示：

- 基础额度是20；
- 当前tick因为储备充足，最多可使用到更高的`tickLimit`；
- bucket处于高位。

它不表示“每个tick都应该使用500CPU”。长期平均消耗持续高于基础`limit`时，bucket仍会下降。

相反：

```js
{
  limit: 20,
  tickLimit: 20,
  bucket: 0
}
```

表示当前没有额外储备，本tick不能依赖超出基础额度的突发计算。

## 可选任务怎样参考bucket

路径预计算、统计汇总或非关键可视化可以只在资源充足时运行。示例：

```js
function canRunOptionalWork() {
  const hasBucketReserve = Game.cpu.bucket >= 9000;
  const usedRatio = Game.cpu.getUsed()
    / Game.cpu.tickLimit;

  return hasBucketReserve && usedRatio < 0.5;
}
```

然后：

```js
if (canRunOptionalWork()) {
  runOptionalAnalysis();
}
```

这里的`9000`和`0.5`都是本地策略，不是官方推荐值。实际阈值应根据：

- 基础CPU额度；
- 房间数量；
- 系统恢复能力；
- 可选任务成本；
- bucket长期趋势；
- 是否处于战争或扩张阶段。

不能把采集、Spawn恢复、防御等关键逻辑都放到高bucket条件下，否则系统在资源不足时反而停止自救。

## 为什么同一段代码每次测量不同

常见原因包括：

### 输入规模变化

Creep、工地、敌人或市场订单数量变化，遍历成本自然不同。

### 第一次访问Memory

官方文档说明，Memory在当前tick第一次访问时会进行解析，解析成本会计入脚本CPU。把测量起点放在首次访问前后，会得到不同结果。

### 全局重置

模块重新加载、缓存重建和首次执行的路径可能让某些tick明显更高。

### 路径搜索输入变化

目标位置、房间数量、CostMatrix和`maxOps`都会影响寻路成本。

### 测量范围不一致

一个样本测到循环本身，另一个样本还包含了日志、对象恢复或数据解析，两者不能直接比较。

## 怎样做更可信的对比

比较“修改前”和“修改后”时，至少保持：

- 同一shard或相同服务器设置；
- 相近的Creep和房间数量；
- 相同测量边界；
- 相同日志频率；
- 足够多的样本；
- 记录是否发生全局重置；
- 不只看平均值，也看峰值和bucket趋势。

更严格的测试还可以记录中位数和高分位值，但本文不把短期窗口扩展成完整性能分析平台。

## Simulation模式的限制

官方API说明，Simulation模式中的`Game.cpu.getUsed()`始终返回0。此时：

```js
const used = Game.cpu.getUsed() - start;
```

也会得到0，不能据此评价在线服务器CPU。

离线Node.js运行同样不能模拟Screeps CPU单位。本文的离线测试只检查样本窗口和统计函数。

## 离线模拟结果

构建检查对固定长度窗口执行了：

```text
依次加入1、2、3、4
窗口上限为3
最终保留2、3、4
```

统计结果为：

| 项目 | 结果 |
|---|---:|
| 样本数 | 3 |
| 平均值 | 3 |
| 最大值 | 4 |

同时检查了空样本，确保不会除以0。

这些结果不代表任何真实Screeps CPU消耗，只证明统计函数按预期工作。

## 常见误区

### 用`limit - getUsed()`计算本tick剩余量

当前tick可用上限应参考`tickLimit`，不是只看`limit`。

### bucket高就长期超额运行

bucket是累计储备，不是永久增加的基础额度。长期平均超出`limit`会消耗储备。

### 一次样本就宣布优化成功

单次差值只能用于发现明显问题，不能证明长期收益。

### 把Simulation的0当成代码免费

Simulation模式中的`getUsed()`返回0是环境限制，不代表代码没有成本。

### 把诊断日志本身排除在系统成本之外

日志、统计、数组维护和Memory写入都会占用资源。诊断系统也需要控制频率和数据量。

## 适用边界

本文只建立单段代码的短期CPU采样，不覆盖：

- 多shard额度分配；
- 像素生成条件；
- 堆内存统计；
- V8优化与垃圾回收分析；
- 长期数据外部存储；
- 自动任务调度器；
- 私服CPU参数差异；
- 真实房间性能结论。

JavaScript语法和离线统计函数已经检查，真实CPU样本、bucket趋势和在线主循环仍待环境验证。

## 相关站内内容

- [tick 与主循环](/blog/screeps-tick-and-game-loop)
- [Screeps 全局缓存为什么会失效](/blog/screeps-global-cache)
- [RawMemory segments 怎么跨 tick 安全读取和写回](/blog/screeps-rawmemory-segments)
- [RoomVisual 怎么画文字辅助调试](/blog/screeps-roomvisual-debug)
- [工程配置与运行诊断模块](/knowledge/operations-debugging)

## 官方资料

- [How does CPU limit work](https://docs.screeps.com/cpu-limit.html)
- [Game.cpu API](https://docs.screeps.com/api/#Game.cpu)
- [Global Objects](https://docs.screeps.com/global-objects.html)
- [Understanding game loop, time and ticks](https://docs.screeps.com/game-loop.html)

资料核对日期：2026-07-22。离线样本统计模拟已通过；真实CPU数据仍待Screeps在线环境验证。
