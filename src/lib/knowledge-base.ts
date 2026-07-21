export interface KnowledgeBaseSection {
  id: string;
  number: number;
  title: string;
  description: string;
  slugs: readonly string[];
}

export const knowledgeBaseSections: readonly KnowledgeBaseSection[] = [
  {
    id: "memory-engineering",
    number: 1,
    title: "Memory 与代码工程",
    description: "保存跨 tick 状态、恢复对象引用、清理过期数据，并逐步理解模块拆分、segments 与全局缓存。",
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
    description: "覆盖掉落资源、Container、Storage、Link、Terminal 与 Mineral，让资源采集、储存和运输形成清楚的链路。",
    slugs: [
      "screeps-creep-withdraw-container-energy",
      "screeps-creep-pickup-dropped-energy",
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

export function getKnowledgeBaseSectionId(slug: string): string | null {
  return knowledgeBaseSections.find((section) => section.slugs.includes(slug))?.id ?? null;
}
