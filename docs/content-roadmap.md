# Screeps 网站内容与工具建设路线

更新日期：2026-07-18

## 当前基础

- 12 篇 Screeps 新手学习路线
- 站内搜索
- Screeps 术语表
- Screeps 错误码查询
- 标签归档
- 项目页面
- RSS 与 Sitemap
- Vercel Analytics 与 Speed Insights

## 建设原则

1. 新手、常见问题、基础工程和专业架构保持内容边界。
2. 每篇文章只解决一个主要问题。
3. 每个工具必须有配套文章、术语和错误码入口。
4. 优先扩展已有模块，不重复开发相同功能。
5. 工具第一版只完成核心任务，再根据使用情况增加高级功能。

## P0：内容连接

- [x] 为 12 篇新手文章建立前置、后续、术语和错误码学习链接
- [x] 发布《Screeps Memory 是什么？新手为什么需要使用 Memory》
- [x] 扩充 `ERR_NOT_IN_RANGE` 的触发场景、排查顺序和代码对比
- [x] 将 Memory 术语连接到完整文章
- [x] 更新 GitHub README 的正式网站入口
- [ ] 为 2～3 篇核心文章补充实际游戏截图
- [ ] 根据 Search Console 数据检查首批展示词

## P1：第一批问题型内容

1. [x] Screeps Memory 是什么？新手为什么需要使用 Memory
2. [ ] Screeps ERR_NOT_IN_RANGE 是什么意思？完整调试文章
3. [ ] 为什么 Creep 会站着不动？
4. [ ] Screeps creep.moveTo() 常见问题
5. [ ] Spawn 能量不够时应该怎么办？

## P1：基础工程承接内容

1. [ ] 如何给 Creep 添加 role 字段
2. [ ] 如何统计不同角色的 Creep 数量
3. [ ] Creep 死亡后如何自动补员
4. [ ] 如何清理已经死亡 Creep 的 Memory
5. [ ] 如何把 Harvester、Upgrader 和 Builder 拆成模块

推荐依赖顺序：

```text
Memory
→ role
→ 角色数量统计
→ 自动补员
→ 清理 Memory
→ 模块拆分
```

## P1：Creep Body 计算器产品定义

计划 URL：

```text
/tools/creep-body-calculator
```

### 第一版输入

- WORK
- CARRY
- MOVE
- ATTACK
- RANGED_ATTACK
- HEAL
- CLAIM
- TOUGH
- 当前可用 Energy
- 房间 Energy Capacity

### 第一版输出

- Body Part 总数
- Energy 总成本
- Spawn 生成时间
- 是否超过 50 个部件
- 当前 Energy 是否足够
- Energy Capacity 是否支持

### 第一版不做

- 沼泽移动效率
- 空载与满载速度模拟
- 每 tick 工作能力
- 战斗伤害与治疗模拟
- Boost 计算
- 自动推荐 Body
- 实时读取游戏房间数据

### 开发前必须确认

- [ ] 所有输入为 0 时的表现
- [ ] 小数、负数和非数字处理
- [ ] 超过 50 个部件的提示
- [ ] 当前 Energy 与 Capacity 不足的提示区别
- [ ] CLAIM 等高成本部件的计算
- [ ] Spawn 时间公式
- [ ] 移动端输入体验
- [ ] 清空、示例和复制 Body 数组功能

## P2：后续工具

- [ ] Controller 升级计算器
- [ ] 市场交易能量计算器
- [ ] 常用 API 快速查询
- [ ] 错误码页面逐项增强

## 暂缓功能

- 登录注册
- 云端学习进度
- 评论系统
- 积分与排行榜
- 付费会员
- AI 问答
- 多语言
- 复杂 CMS
- 手机 App
- 大量动态动画

## 每周检查

每周固定记录一次：

```text
日期
页面
目标关键词
展示次数
点击次数
平均排名
索引状态
本周修改
下次复查日期
```

数据不足时不频繁修改标题、不重复提交 Sitemap、不反复请求同一网址编入索引。
