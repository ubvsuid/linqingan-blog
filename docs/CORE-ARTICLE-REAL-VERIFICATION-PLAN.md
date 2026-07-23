# 核心文章真实 Screeps 验证计划

更新日期：2026-07-23

## 目的

这份清单只管理无法由 Node.js 语法检查或离线模拟替代的验证。完成前，不得把 `consoleTested` 或 `liveTested` 改为 `true`。

每次验证必须记录：

- Screeps 环境（World、Season、Arena 或官方模拟器）；
- shard、房间名和测试日期；
- 相关 Creep、Structure 或市场对象的前置状态；
- Console 返回值；
- 至少 3 个连续 tick 的状态变化；
- 失败路径或边界条件；
- 不包含 token、私聊和无关玩家信息的截图；
- 验证后需要修改的正文、代码或限制说明。

## P0：资源、安全与不可逆操作

| 顺序 | 文章 | 必须验证的内容 |
|---:|---|---|
| 1 | `screeps-market-create-order` | 订单参数、手续费、错误返回、取消或价格调整前的安全边界 |
| 2 | `screeps-market-deal` | 交易数量、Credits、Terminal Energy 成本和真实返回值 |
| 3 | `screeps-terminal-send-resources` | 资源数量、冷却、交易能量成本、目标房间和失败返回 |
| 4 | `screeps-controller-activate-safe-mode` | 可用次数、冷却、调用返回值及页面中明确的不可逆边界 |
| 5 | `screeps-tower-auto-attack-hostiles` | 敌人筛选、Tower Energy、攻击优先级和连续 tick 行为 |

## P1：跨 tick、寻路与视野

| 顺序 | 文章 | 必须验证的内容 |
|---:|---|---|
| 6 | `screeps-observer-observe-room` | observeRoom() 返回值、下一 tick 视野出现和目标房间限制 |
| 7 | `screeps-pathfinder-costmatrix` | CostMatrix 回调、道路/障碍成本和真实路线变化 |
| 8 | `screeps-moveto-not-moving` | fatigue、堵塞、无路径、路径缓存和下一 tick 位置变化 |
| 9 | `screeps-err-no-path` | 至少三种真实 ERR_NO_PATH 场景及对应修复结果 |
| 10 | `screeps-err-not-in-range` | 范围 1、范围 3、moveTo() 返回值和下一 tick 重试 |

## P1：房间恢复与状态工程

| 顺序 | 文章 | 必须验证的内容 |
|---:|---|---|
| 11 | `screeps-spawn-emergency-recovery` | 低 Energy、无采集者、补员顺序和多 tick 恢复过程 |
| 12 | `screeps-dynamic-creep-body-energy` | 当前 Energy、Capacity、50 部件限制和实际 spawnCreep() 返回值 |
| 13 | `screeps-clean-dead-creep-memory` | 死亡 Creep Memory 清理、不误删存活单位和重复执行安全性 |
| 14 | `screeps-memory-basics` | Memory 跨 tick 保存、对象 ID 重新读取和死亡后残留现象 |
| 15 | `screeps-first-room-code` | 采集、运输、升级、建造和维修在同一主循环中的连续运行 |

## 完成标准

单篇文章只有同时满足以下条件，才可标记真实验证完成：

1. 官方文档重新核对；
2. 文中代码与实际运行代码一致；
3. Console 返回值已记录；
4. 至少 3 个连续 tick 的关键状态已记录；
5. 正常路径与至少一个失败路径已验证；
6. 截图符合 `docs/REAL-SCREEPS-SCREENSHOT-STANDARD.md`；
7. front matter 中的环境、日期和结果已经更新；
8. 修改后重新通过完整生产质量门禁。

## 禁止事项

- 不得把 Node.js 语法通过写成 Screeps Console 已通过；
- 不得把单次返回 `OK` 写成长期主循环稳定；
- 不得使用生成图冒充真实房间或 Console 截图；
- 不得为了完成验证在主账号执行未设预算上限的市场操作；
- 不得在截图中暴露账号 token、私聊或其他玩家隐私。
