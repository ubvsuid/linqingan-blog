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
    id: "start-production-loop",
    number: 3,
    title: "开始建立生产循环",
    description: "从创建新的 Creep 开始，逐步让房间具备持续运行的能力。",
    slugs: ["screeps-spawn-create-creep"],
  },
] as const;

export const beginnerSeriesSlugs = beginnerStages.flatMap((stage) => [
  ...stage.slugs,
]);

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
