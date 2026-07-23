export interface ArticleRevision {
  date: string;
  reason: string;
  details: string[];
}

const articleRevisions: Record<string, ArticleRevision> = {
  "screeps-tower-repair-threshold": {
    date: "2026-07-23",
    reason: "修正防御优先级与代码承诺不一致的问题。",
    details: [
      "维修前先检查敌对 Creep。",
      "保留 Tower Energy 底线与普通建筑维修范围。",
      "补充离线模拟和安全顺序检查。",
    ],
  },
  "screeps-rawmemory-segments": {
    date: "2026-07-23",
    reason: "补齐跨 tick 读取时序和空内容边界。",
    details: [
      "区分 undefined、空字符串与损坏 JSON。",
      "明确 setActiveSegments() 的结果要到后续 tick 读取。",
    ],
  },
  "screeps-pathfinder-costmatrix": {
    date: "2026-07-23",
    reason: "补充 CostMatrix 数值语义和 roomCallback 边界。",
    details: [
      "明确 255 为不可通行。",
      "区分 return false 与 return undefined。",
    ],
  },
  "screeps-observer-observe-room": {
    date: "2026-07-23",
    reason: "将 Observer 示例改为明确的两 tick 状态流程。",
    details: [
      "先读取上一 tick 请求结果，再提交下一次观察。",
      "记录 requestedRoom 与 requestedAt，避免同 tick 误读。",
    ],
  },
  "screeps-structure-destroy": {
    date: "2026-07-23",
    reason: "加强不可逆拆除操作的保护。",
    details: [
      "加入结构类型白名单、确认词和一次性开关。",
      "执行前关闭请求，失败后保留结果供人工处理。",
    ],
  },
  "screeps-nuker-launch-checklist": {
    date: "2026-07-23",
    reason: "补齐 Nuker 的资源、距离和双重确认条件。",
    details: [
      "检查 Energy、Ghodium、cooldown 与 NUKER_RANGE。",
      "发射前关闭请求，避免重复提交不可逆操作。",
    ],
  },
  "screeps-link-transfer-energy": {
    date: "2026-07-23",
    reason: "完善 Link 网络的身份、损耗和同房间边界。",
    details: [
      "使用固定 ID 区分源 Link 与目标 Link。",
      "补充 cooldown、容量和 3% 损耗说明。",
    ],
  },
  "screeps-power-spawn-process-power": {
    date: "2026-07-23",
    reason: "明确持续处理与房间 Energy 保留线。",
    details: [
      "加入启用开关、资源预算和下一 tick 核对。",
      "删除容易造成跨主题误解的市场对比措辞。",
    ],
  },
  "screeps-spawn-recycle-creep": {
    date: "2026-07-23",
    reason: "加强一次性回收请求与失败恢复。",
    details: [
      "要求明确 Creep、Spawn、确认状态和所有权。",
      "失败时恢复请求，成功后在下一 tick 核对对象消失。",
    ],
  },
};

export function getArticleRevision(slug: string): ArticleRevision | null {
  return articleRevisions[slug] ?? null;
}

export function getRecentArticleRevisions(limit = 4) {
  return Object.entries(articleRevisions)
    .map(([slug, revision]) => ({ slug, ...revision }))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, Math.max(0, limit));
}
