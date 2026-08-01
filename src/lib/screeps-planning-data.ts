export const BASE_REACTION_AMOUNT = 5;
export const BOOST_MINERAL_PER_PART = 30;
export const BOOST_ENERGY_PER_PART = 20;
export const OPERATE_LAB_BONUS = [0, 2, 4, 6, 8, 10] as const;
export const OPERATE_CONTROLLER_BONUS = [0, 10, 20, 30, 40, 50] as const;

export interface LabRecipe {
  reagents: readonly [string, string];
  cooldown: number;
}

export const LAB_RECIPES = {
  OH: { reagents: ["H", "O"], cooldown: 20 },
  ZK: { reagents: ["Z", "K"], cooldown: 5 },
  UL: { reagents: ["U", "L"], cooldown: 5 },
  G: { reagents: ["ZK", "UL"], cooldown: 5 },

  UH: { reagents: ["U", "H"], cooldown: 10 },
  UO: { reagents: ["U", "O"], cooldown: 10 },
  KH: { reagents: ["K", "H"], cooldown: 10 },
  KO: { reagents: ["K", "O"], cooldown: 10 },
  LH: { reagents: ["L", "H"], cooldown: 15 },
  LO: { reagents: ["L", "O"], cooldown: 10 },
  ZH: { reagents: ["Z", "H"], cooldown: 20 },
  ZO: { reagents: ["Z", "O"], cooldown: 10 },
  GH: { reagents: ["G", "H"], cooldown: 10 },
  GO: { reagents: ["G", "O"], cooldown: 10 },

  UH2O: { reagents: ["UH", "OH"], cooldown: 5 },
  UHO2: { reagents: ["UO", "OH"], cooldown: 5 },
  KH2O: { reagents: ["KH", "OH"], cooldown: 5 },
  KHO2: { reagents: ["KO", "OH"], cooldown: 5 },
  LH2O: { reagents: ["LH", "OH"], cooldown: 10 },
  LHO2: { reagents: ["LO", "OH"], cooldown: 5 },
  ZH2O: { reagents: ["ZH", "OH"], cooldown: 40 },
  ZHO2: { reagents: ["ZO", "OH"], cooldown: 5 },
  GH2O: { reagents: ["GH", "OH"], cooldown: 15 },
  GHO2: { reagents: ["GO", "OH"], cooldown: 30 },

  XUH2O: { reagents: ["UH2O", "X"], cooldown: 60 },
  XUHO2: { reagents: ["UHO2", "X"], cooldown: 60 },
  XKH2O: { reagents: ["KH2O", "X"], cooldown: 60 },
  XKHO2: { reagents: ["KHO2", "X"], cooldown: 60 },
  XLH2O: { reagents: ["LH2O", "X"], cooldown: 65 },
  XLHO2: { reagents: ["LHO2", "X"], cooldown: 60 },
  XZH2O: { reagents: ["ZH2O", "X"], cooldown: 160 },
  XZHO2: { reagents: ["ZHO2", "X"], cooldown: 60 },
  XGH2O: { reagents: ["GH2O", "X"], cooldown: 80 },
  XGHO2: { reagents: ["GHO2", "X"], cooldown: 150 },
} as const satisfies Record<string, LabRecipe>;

export type LabCompound = keyof typeof LAB_RECIPES;

export interface BoostOption {
  compound: LabCompound;
  part: "ATTACK" | "WORK" | "CARRY" | "RANGED_ATTACK" | "HEAL" | "MOVE" | "TOUGH";
  action: string;
  multiplier: number;
  effect: string;
  effectZh: string;
}

export const BOOST_OPTIONS: readonly BoostOption[] = [
  { compound: "UH", part: "ATTACK", action: "attack", multiplier: 2, effect: "2× melee attack", effectZh: "近战攻击 2 倍" },
  { compound: "UH2O", part: "ATTACK", action: "attack", multiplier: 3, effect: "3× melee attack", effectZh: "近战攻击 3 倍" },
  { compound: "XUH2O", part: "ATTACK", action: "attack", multiplier: 4, effect: "4× melee attack", effectZh: "近战攻击 4 倍" },

  { compound: "UO", part: "WORK", action: "harvest", multiplier: 3, effect: "3× harvest power", effectZh: "采集效率 3 倍" },
  { compound: "UHO2", part: "WORK", action: "harvest", multiplier: 5, effect: "5× harvest power", effectZh: "采集效率 5 倍" },
  { compound: "XUHO2", part: "WORK", action: "harvest", multiplier: 7, effect: "7× harvest power", effectZh: "采集效率 7 倍" },

  { compound: "KH", part: "CARRY", action: "capacity", multiplier: 2, effect: "2× CARRY capacity", effectZh: "CARRY 容量 2 倍" },
  { compound: "KH2O", part: "CARRY", action: "capacity", multiplier: 3, effect: "3× CARRY capacity", effectZh: "CARRY 容量 3 倍" },
  { compound: "XKH2O", part: "CARRY", action: "capacity", multiplier: 4, effect: "4× CARRY capacity", effectZh: "CARRY 容量 4 倍" },

  { compound: "KO", part: "RANGED_ATTACK", action: "rangedAttack", multiplier: 2, effect: "2× ranged attack", effectZh: "远程攻击 2 倍" },
  { compound: "KHO2", part: "RANGED_ATTACK", action: "rangedAttack", multiplier: 3, effect: "3× ranged attack", effectZh: "远程攻击 3 倍" },
  { compound: "XKHO2", part: "RANGED_ATTACK", action: "rangedAttack", multiplier: 4, effect: "4× ranged attack", effectZh: "远程攻击 4 倍" },

  { compound: "LH", part: "WORK", action: "buildRepair", multiplier: 1.5, effect: "1.5× build and repair", effectZh: "建造与维修 1.5 倍" },
  { compound: "LH2O", part: "WORK", action: "buildRepair", multiplier: 1.8, effect: "1.8× build and repair", effectZh: "建造与维修 1.8 倍" },
  { compound: "XLH2O", part: "WORK", action: "buildRepair", multiplier: 2, effect: "2× build and repair", effectZh: "建造与维修 2 倍" },

  { compound: "LO", part: "HEAL", action: "heal", multiplier: 2, effect: "2× heal power", effectZh: "治疗能力 2 倍" },
  { compound: "LHO2", part: "HEAL", action: "heal", multiplier: 3, effect: "3× heal power", effectZh: "治疗能力 3 倍" },
  { compound: "XLHO2", part: "HEAL", action: "heal", multiplier: 4, effect: "4× heal power", effectZh: "治疗能力 4 倍" },

  { compound: "ZH", part: "WORK", action: "dismantle", multiplier: 2, effect: "2× dismantle power", effectZh: "拆除能力 2 倍" },
  { compound: "ZH2O", part: "WORK", action: "dismantle", multiplier: 3, effect: "3× dismantle power", effectZh: "拆除能力 3 倍" },
  { compound: "XZH2O", part: "WORK", action: "dismantle", multiplier: 4, effect: "4× dismantle power", effectZh: "拆除能力 4 倍" },

  { compound: "ZO", part: "MOVE", action: "fatigue", multiplier: 2, effect: "2× fatigue reduction", effectZh: "疲劳消除速度 2 倍" },
  { compound: "ZHO2", part: "MOVE", action: "fatigue", multiplier: 3, effect: "3× fatigue reduction", effectZh: "疲劳消除速度 3 倍" },
  { compound: "XZHO2", part: "MOVE", action: "fatigue", multiplier: 4, effect: "4× fatigue reduction", effectZh: "疲劳消除速度 4 倍" },

  { compound: "GH", part: "WORK", action: "upgradeController", multiplier: 1.5, effect: "1.5× Controller upgrade progress", effectZh: "Controller 升级进度 1.5 倍" },
  { compound: "GH2O", part: "WORK", action: "upgradeController", multiplier: 1.8, effect: "1.8× Controller upgrade progress", effectZh: "Controller 升级进度 1.8 倍" },
  { compound: "XGH2O", part: "WORK", action: "upgradeController", multiplier: 2, effect: "2× Controller upgrade progress", effectZh: "Controller 升级进度 2 倍" },

  { compound: "GO", part: "TOUGH", action: "damage", multiplier: 0.7, effect: "30% less damage", effectZh: "承受伤害减少 30%" },
  { compound: "GHO2", part: "TOUGH", action: "damage", multiplier: 0.5, effect: "50% less damage", effectZh: "承受伤害减少 50%" },
  { compound: "XGHO2", part: "TOUGH", action: "damage", multiplier: 0.3, effect: "70% less damage", effectZh: "承受伤害减少 70%" },
] as const;

export interface ReactionStage {
  compound: LabCompound;
  amount: number;
  cooldown: number;
  depth: number;
}

export interface ReactionPlan {
  baseResources: Record<string, number>;
  stages: ReactionStage[];
}

export function buildReactionPlan(target: LabCompound, amount: number): ReactionPlan {
  const normalizedAmount = Math.max(0, Math.ceil(amount));
  const baseResources: Record<string, number> = {};
  const stageMap = new Map<LabCompound, ReactionStage>();

  function visit(resource: string, required: number, depth: number) {
    const recipe = LAB_RECIPES[resource as LabCompound];
    if (!recipe) {
      baseResources[resource] = (baseResources[resource] ?? 0) + required;
      return;
    }

    const compound = resource as LabCompound;
    const current = stageMap.get(compound);
    stageMap.set(compound, {
      compound,
      amount: (current?.amount ?? 0) + required,
      cooldown: recipe.cooldown,
      depth: Math.max(current?.depth ?? 0, depth),
    });

    visit(recipe.reagents[0], required, depth + 1);
    visit(recipe.reagents[1], required, depth + 1);
  }

  visit(target, normalizedAmount, 0);

  return {
    baseResources,
    stages: [...stageMap.values()].sort((left, right) => right.depth - left.depth || left.compound.localeCompare(right.compound)),
  };
}
