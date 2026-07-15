export const beginnerSeriesSlugs = [
  "screeps-introduction",
  "screeps-first-room",
  "screeps-tick-and-game-loop",
  "screeps-first-creep-harvest",
  "screeps-creep-deliver-energy",
] as const;

export function getBeginnerSeriesIndex(slug: string): number {
  return beginnerSeriesSlugs.findIndex((item) => item === slug);
}

export function isBeginnerSeriesPost(slug: string): boolean {
  return getBeginnerSeriesIndex(slug) !== -1;
}
