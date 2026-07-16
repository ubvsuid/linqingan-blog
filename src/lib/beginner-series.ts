export const beginnerStages = [
  {
    id: "understand-screeps",
    number: 1,
    title: "认识 Screeps",
    description: "先理解这是怎样的游戏、界面由什么组成，以及代码为什么会持续运行。",
    slugs: [
      "screeps-introduction",
      "screeps-first-room",
      "screeps-tick-and-game-loop",
    ],
  },
  {
    id: "control-first-creep",
    number: 2,
    title: "控制第一只 Creep",
    description: "让 Creep 完成移动、采集和运输，并认识最基础的身体部件。",
    slugs: [
      "screeps-first-creep-harvest",
      "screeps-creep-deliver-energy",
      "screeps-creep-body-parts",
    ],
  },
  {
    id: "build-room-team",
    number: 3,
    title: "建立房间分工",
    description: "创建新的 Creep，认识基础角色分工，并让 Upgrader 持续升级 Controller。",
    slugs: [
      "screeps-spawn-create-creep",
      "screeps-creep-roles",
      "screeps-upgrade-controller",
    ],
  },
  {
    id: "complete-room-loop",
    number: 4,
    title: "完成基础房间循环",
    description: "建造第一个 Extension，让 Builder 处理建造和维修，并整理第一份房间基础代码。",
    slugs: [
      "screeps-first-extension",
      "screeps-build-and-repair",
      "screeps-first-room-code",
    ],
  },
] as const;

export const beginnerSeriesSlugs: readonly string[] = beginnerStages.flatMap(
  (stage) => [...stage.slugs],
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
