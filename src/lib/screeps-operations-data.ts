export const CREEP_SPAWN_TIME = 3;
export const CREEP_LIFE_TIME = 1500;
export const CREEP_CLAIM_LIFE_TIME = 600;
export const CARRY_CAPACITY = 50;
export const MOVE_POWER = 2;

export const OPERATE_SPAWN_REDUCTION = [0, 0.1, 0.3, 0.5, 0.65, 0.8] as const;
export const OPERATE_TOWER_BONUS = [0, 0.1, 0.2, 0.3, 0.4, 0.5] as const;

export const TERRAIN_FATIGUE = {
  road: 1,
  plain: 2,
  swamp: 10,
} as const;

export type TerrainKind = keyof typeof TERRAIN_FATIGUE;

export const TOWER_ENERGY_COST = 10;
export const TOWER_OPTIMAL_RANGE = 5;
export const TOWER_FALLOFF_RANGE = 20;
export const TOWER_FALLOFF = 0.75;

export const TOWER_POWER = {
  attack: 600,
  heal: 400,
  repair: 800,
} as const;

export type TowerAction = keyof typeof TOWER_POWER;

export const CARRY_BOOST_MULTIPLIER = {
  none: 1,
  KH: 2,
  KH2O: 3,
  XKH2O: 4,
} as const;

export type CarryBoost = keyof typeof CARRY_BOOST_MULTIPLIER;

export function getTowerRangeFactor(range: number) {
  if (range <= TOWER_OPTIMAL_RANGE) return 1;
  if (range >= TOWER_FALLOFF_RANGE) return 1 - TOWER_FALLOFF;
  const falloffPosition = (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
  return 1 - TOWER_FALLOFF * falloffPosition;
}
