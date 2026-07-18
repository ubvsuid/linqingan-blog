export interface KnowledgeBaseSection {
  id: string;
  number: number;
  title: string;
  description: string;
  slugs: readonly string[];
}

export const knowledgeBaseSections: readonly KnowledgeBaseSection[] = [
  {
    id: "start",
    number: 1,
    title: "从零开始",
    description: "认识 Screeps、tick、Creep 与基础房间循环，按顺序完成第一套可持续运行的代码。",
    slugs: [
      "screeps-introduction",
      "screeps-first-room",
      "screeps-tick-and-game-loop",
      "screeps-first-creep-harvest",
      "screeps-creep-deliver-energy",
      "screeps-creep-body-parts",
      "screeps-spawn-create-creep",
      "screeps-creep-roles",
      "screeps-upgrade-controller",
      "screeps-first-extension",
      "screeps-build-and-repair",
      "screeps-first-room-code",
    ],
  },
  {
    id: "memory-state",
    number: 2,
    title: "Memory 与状态",
    description: "保存跨 tick 状态、恢复对象引用、清理过期数据，并理解常规 Memory、segments 与全局缓存的边界。",
    slugs: [
      "screeps-memory-basics",
      "screeps-clean-dead-creep-memory",
      "screeps-creep-working-state",
      "screeps-game-get-object-by-id",
      "screeps-rawmemory-segments",
      "screeps-global-cache",
      "screeps-modules-require",
    ],
  },
  {
    id: "spawn-lifecycle",
    number: 3,
    title: "Spawn 与单位生命周期",
    description: "从返回值、动态身体、续命、回收到断代恢复，处理 Creep 从创建到退出的完整生命周期。",
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
    number: 4,
    title: "资源采集与房间经济",
    description: "覆盖掉落资源、Container、Storage、Link、Terminal 与 Mineral，让资源流动的每一步都有明确边界。",
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
    number: 5,
    title: "移动、寻路与视野",
    description: "逐一解决距离、疲劳、无路径、跨房间路线、CostMatrix、视野与远程观察问题。",
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
    id: "control-defense",
    number: 6,
    title: "Controller、建设与防御",
    description: "处理降级、预定与占领、Tower 三类动作、Rampart 通行、墙体维修和高等级防御建筑。",
    slugs: [
      "screeps-controller-activate-safe-mode",
      "screeps-controller-downgrade",
      "screeps-reserve-vs-claim-controller",
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
    description: "从市场成交和订单维护继续进入 Lab、Factory 与 Power Spawn，每篇只解决一个 API 任务。",
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
    description: "使用 Flag、CPU 指标、通知与事件日志观察系统，而不把调试工具混进具体业务动作。",
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

