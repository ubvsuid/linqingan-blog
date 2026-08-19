import { getBeginnerRoadmapRegistry } from "@/lib/beginner-roadmap-registry";

const beginnerStageDefinitions = [
  {
    id: "understand-screeps",
    number: 1,
    title: "认识 Screeps",
    description: "先理解这是怎样的游戏、界面由什么组成，以及代码为什么会持续运行。",
    outcomes: [
      "能在界面中找到自己的房间、Spawn、Controller 与 Creep",
      "能解释 tick 与主循环为什么会重复执行",
      "知道 Console、代码与房间状态分别用来观察什么",
    ],
  },
  {
    id: "control-first-creep",
    number: 2,
    title: "控制第一只 Creep",
    description: "让 Creep 完成移动、采集和运输，并认识最基础的身体部件。",
    outcomes: [
      "能让 Creep 移动到目标附近并保存动作返回值",
      "能完成 Source → Creep → Spawn/Extension 的基础 Energy 流",
      "能根据 WORK、CARRY、MOVE 判断一只基础 Creep 能做什么",
    ],
  },
  {
    id: "build-room-team",
    number: 3,
    title: "建立房间分工",
    description: "创建新的 Creep，认识基础角色分工，并让 Upgrader 持续升级 Controller。",
    outcomes: [
      "能使用 spawnCreep() 创建指定身体和名称的 Creep",
      "能区分 Harvester、Hauler、Upgrader 等基础职责",
      "能让 Upgrader 获得 Energy 并调用 upgradeController()",
    ],
  },
  {
    id: "complete-room-loop",
    number: 4,
    title: "完成基础房间循环",
    description: "建造第一个 Extension，让 Builder 处理建造和维修，并整理第一份房间基础代码。",
    outcomes: [
      "能创建并完成第一个 Extension Construction Site",
      "能让 Builder 在 build() 与 repair() 场景中工作",
      "能把采集、运输、升级和建造整理成第一份可持续房间循环",
    ],
  },
] as const;

const beginnerRoadmapRegistry = getBeginnerRoadmapRegistry();

export const beginnerStages = beginnerStageDefinitions.map((stage) => ({
  ...stage,
  slugs: beginnerRoadmapRegistry
    .filter((record) => record.roadmap.stage === stage.id)
    .map((record) => record.slug),
}));

export const beginnerSeriesSlugs: readonly string[] = beginnerRoadmapRegistry.map(
  (record) => record.slug,
);

export function getBeginnerSeriesIndex(slug: string): number {
  return beginnerSeriesSlugs.findIndex((item) => item === slug);
}

export function getBeginnerStageForSlug(slug: string) {
  return beginnerStages.find((stage) =>
    stage.slugs.some((item) => item === slug),
  );
}

export function isBeginnerSeriesPost(slug: string): boolean {
  return getBeginnerSeriesIndex(slug) !== -1;
}
