export interface KnowledgeBaseStage {
  title: string;
  description: string;
  from: number;
  to: number;
}

export interface KnowledgeBaseSection {
  id: string;
  number: number;
  title: string;
  description: string;
  audience: string;
  learningGoal: string;
  stages: readonly KnowledgeBaseStage[];
  slugs: readonly string[];
}

export const knowledgeBaseSections: readonly KnowledgeBaseSection[] = [
  {
    id: "memory-engineering",
    number: 1,
    title: "Memory 与代码工程",
    description: "保存跨 tick 状态、恢复对象引用、清理过期数据，并逐步理解模块拆分、segments 与全局缓存。",
    audience: "已经完成新手路线，准备从固定名称代码进入可维护结构的玩家。",
    learningGoal: "理解哪些数据应该跨 tick 保存、怎样安全恢复对象，以及如何把不断增长的主循环拆成清楚的代码模块。",
    stages: [
      { title: "状态基础", description: "先理解 Memory、死亡数据清理和工作状态切换。", from: 0, to: 3 },
      { title: "对象与模块", description: "学习通过 ID 恢复对象，并用 require 拆分代码。", from: 3, to: 5 },
      { title: "高级存储与缓存", description: "继续了解 segments 和全局缓存的使用边界。", from: 5, to: 7 },
    ],
    slugs: [
      "screeps-memory-basics",
      "screeps-clean-dead-creep-memory",
      "screeps-creep-working-state",
      "screeps-game-get-object-by-id",
      "screeps-modules-require",
      "screeps-rawmemory-segments",
      "screeps-global-cache",
    ],
  },
  {
    id: "spawn-lifecycle",
    number: 2,
    title: "Spawn 与 Creep 生命周期",
    description: "从创建、身体配置和返回值排查，到续命、回收与房间断代恢复，管理 Creep 的完整生命周期。",
    audience: "已经会创建基础 Creep，希望减少重名、Energy 不足和房间断代问题的玩家。",
    learningGoal: "把单次 spawnCreep() 调用扩展为可诊断、可恢复的 Creep 创建与生命周期管理流程。",
    stages: [
      { title: "创建与身体", description: "先读懂创建返回码，再根据可用 Energy 生成身体。", from: 0, to: 2 },
      { title: "续命与回收", description: "理解 renewCreep() 和 recycleCreep() 的适用边界。", from: 2, to: 4 },
      { title: "断代恢复", description: "最后处理房间没有工作 Creep 时的紧急恢复。", from: 4, to: 5 },
    ],
    slugs: [
      "screeps-spawncreep-return-codes",
      "screeps-dynamic-creep-body-energy",
      "screeps-spawn-renew-creep",
      "screeps-spawn-recycle-creep",
      "screeps-spawn-emergency-recovery",
    ],
  },
  {
    id: "room-economy",
    number: 3,
    title: "资源采集与房间经济",
    description: "覆盖掉落资源、Tombstone、Ruin、Container、Storage、Link、Terminal 与 Mineral，让资源采集、回收、储存和运输形成清楚的链路。",
    audience: "基础采集循环已经运行，希望减少空跑、抢救遗留资源并建立房间资源链路的玩家。",
    learningGoal: "理解资源从 Source、掉落物、Tombstone 或 Ruin 进入 Creep，再流向 Container、Storage、Link 和 Terminal 的全过程。",
    stages: [
      { title: "获取与回收资源", description: "从 Container、掉落 Energy、Tombstone、Ruin 和多 Source 选择开始。", from: 0, to: 4 },
      { title: "房间内储运", description: "理解 Storage 和 Link 在房间经济中的位置。", from: 4, to: 6 },
      { title: "跨房间与矿物", description: "继续学习 Terminal 发送和 Mineral 采集。", from: 6, to: 8 },
    ],
    slugs: [
      "screeps-creep-withdraw-container-energy",
      "screeps-creep-pickup-dropped-energy",
      "screeps-tombstone-ruin-recovery",
      "screeps-select-source-by-path",
      "screeps-storage-energy-usage",
      "screeps-link-transfer-energy",
      "screeps-terminal-send-resources",
      "screeps-mineral-extractor-harvest",
    ],
  },
  {
    id: "movement-vision",
    number: 4,
    title: "移动、寻路与视野",
    description: "逐一解决距离、疲劳、无路径、跨房间路线、CostMatrix、房间可见性与远程观察问题。",
    audience: "遇到 Creep 不移动、找不到路径、跨房间失败或目标房间没有视野的玩家。",
    learningGoal: "从动作距离错误开始，逐步掌握路径成本、跨房间路线、疲劳和远程视野诊断。",
    stages: [
      { title: "先解决常见错误", description: "先排查距离不足、moveTo 不移动和 ERR_NO_PATH。", from: 0, to: 3 },
      { title: "理解路径与移动成本", description: "继续学习 CostMatrix、跨房间路线、距离 API 和 fatigue。", from: 3, to: 7 },
      { title: "视野与可视化", description: "最后处理房间可见性、Observer 和 RoomVisual 调试。", from: 7, to: 10 },
    ],
    slugs: [
      "screeps-err-not-in-range",
      "screeps-moveto-not-moving",
      "screeps-err-no-path",
      "screeps-pathfinder-costmatrix",
      "screeps-map-find-route",
      "screeps-roomposition-distance",
      "screeps-move-fatigue-body-ratio",
      "screeps-room-visibility",
      "screeps-observer-observe-room",
      "screeps-roomvisual-debug",
    ],
  },
  {
    id: "controller-control",
    number: 5,
    title: "Controller 与房间控制",
    description: "处理 Safe Mode、Controller 降级、预订与占领边界，集中管理房间控制权相关问题。",
    audience: "开始管理 Controller 安全、降级风险、远程预订或新房间占领的玩家。",
    learningGoal: "理解 Controller 不只是升级目标，还承担房间安全、所有权、预订和扩张边界。",
    stages: [
      { title: "安全与生命周期", description: "先理解 Safe Mode 和 Controller 降级。", from: 0, to: 2 },
      { title: "预订与占领", description: "再区分 reserveController() 与 claimController()。", from: 2, to: 3 },
    ],
    slugs: [
      "screeps-controller-activate-safe-mode",
      "screeps-controller-downgrade",
      "screeps-reserve-vs-claim-controller",
    ],
  },
  {
    id: "construction-defense",
    number: 6,
    title: "建设与防御",
    description: "管理 Construction Site、建筑拆除、Tower 动作、Rampart 通行、墙体维修和高等级防御建筑。",
    audience: "已经能建造基础建筑，准备管理工地生命周期、Tower 和防御建筑的玩家。",
    learningGoal: "把放置工地、跟踪进度、清理错误建筑和防御动作整理成可检查的房间建设流程。",
    stages: [
      { title: "工地与建筑管理", description: "先学习创建、查看、删除工地和拆除完整建筑。", from: 0, to: 4 },
      { title: "Tower 动作", description: "继续处理 Tower 的攻击、维修和治疗。", from: 4, to: 7 },
      { title: "防御建筑", description: "最后管理 Rampart、Wall 和 Nuker。", from: 7, to: 10 },
    ],
    slugs: [
      "screeps-room-create-construction-site",
      "screeps-construction-site-progress",
      "screeps-construction-site-remove",
      "screeps-structure-destroy",
      "screeps-tower-auto-attack-hostiles",
      "screeps-tower-repair-threshold",
      "screeps-tower-heal-creeps",
      "screeps-rampart-set-public",
      "screeps-wall-rampart-repair-limit",
      "screeps-nuker-launch-checklist",
    ],
  },
  {
    id: "market-advanced-resources",
    number: 7,
    title: "市场与高级资源",
    description: "从市场成交和订单维护继续进入 Lab、Factory 与 Power Spawn，每篇聚焦一个清晰的高级资源任务。",
    audience: "房间经济已经稳定，开始使用市场、Boost、Commodity 或 Power 的玩家。",
    learningGoal: "掌握高级资源系统中的前置条件、返回结果和执行顺序，避免只复制一条 API 调用。",
    stages: [
      { title: "市场操作", description: "先学习即时成交和创建订单。", from: 0, to: 2 },
      { title: "Lab 与 Boost", description: "继续理解反应与强化 Creep 的基本流程。", from: 2, to: 4 },
      { title: "生产与 Power", description: "最后进入 Factory 和 Power Spawn。", from: 4, to: 6 },
    ],
    slugs: [
      "screeps-market-deal",
      "screeps-market-create-order",
      "screeps-lab-run-reaction",
      "screeps-lab-boost-creep",
      "screeps-factory-produce",
      "screeps-power-spawn-process-power",
    ],
  },
  {
    id: "operations-debugging",
    number: 8,
    title: "工程配置与运行诊断",
    description: "使用 Flag、CPU 指标、通知与事件日志观察系统，把配置、监控和调试从具体业务动作中分离出来。",
    audience: "代码已经开始变长，希望知道系统为什么变慢、报错或停止工作的玩家。",
    learningGoal: "建立最基础的配置、性能、通知和事件观察能力，为后续日志与监控系统打基础。",
    stages: [
      { title: "配置与性能", description: "先使用 Flag 配置，再观察 CPU 和 bucket。", from: 0, to: 2 },
      { title: "通知与事件", description: "继续使用 Game.notify() 和 Room Event Log。", from: 2, to: 4 },
    ],
    slugs: [
      "screeps-flags-config",
      "screeps-cpu-getused-bucket",
      "screeps-game-notify",
      "screeps-room-event-log",
    ],
  },
];

export const knowledgeBaseSlugs = knowledgeBaseSections.flatMap((section) => [
  ...section.slugs,
]);

export function getKnowledgeBaseSection(id: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.id === id) ?? null;
}

export function getKnowledgeBaseSectionBySlug(slug: string): KnowledgeBaseSection | null {
  return knowledgeBaseSections.find((section) => section.slugs.includes(slug)) ?? null;
}

export function getKnowledgeBaseSectionId(slug: string): string | null {
  return getKnowledgeBaseSectionBySlug(slug)?.id ?? null;
}

export function getKnowledgeBasePostPosition(slug: string): {
  section: KnowledgeBaseSection;
  index: number;
  previousSlug: string | null;
  nextSlug: string | null;
} | null {
  const section = getKnowledgeBaseSectionBySlug(slug);
  if (!section) return null;

  const index = section.slugs.indexOf(slug);
  return {
    section,
    index,
    previousSlug: index > 0 ? section.slugs[index - 1] : null,
    nextSlug: index < section.slugs.length - 1 ? section.slugs[index + 1] : null,
  };
}
