import {
  LAB_RECIPES,
  type LabCompound,
  type ReactionPlan,
  type ReactionStage,
} from "@/lib/screeps-planning-data";

export function buildBatchedReactionPlan(
  target: LabCompound,
  requestedAmount: number,
  batchSize: number,
): ReactionPlan {
  const normalizedAmount = Math.max(0, Math.ceil(requestedAmount));
  const normalizedBatchSize = Math.max(1, Math.floor(batchSize));
  const baseResources: Record<string, number> = {};
  const stageMap = new Map<LabCompound, ReactionStage>();

  function visit(resource: string, required: number, depth: number) {
    const recipe = LAB_RECIPES[resource as LabCompound];
    if (!recipe) {
      baseResources[resource] = (baseResources[resource] ?? 0) + required;
      return;
    }

    const compound = resource as LabCompound;
    const producedAmount = required === 0
      ? 0
      : Math.ceil(required / normalizedBatchSize) * normalizedBatchSize;
    const current = stageMap.get(compound);

    stageMap.set(compound, {
      compound,
      amount: (current?.amount ?? 0) + producedAmount,
      cooldown: recipe.cooldown,
      depth: Math.max(current?.depth ?? 0, depth),
    });

    visit(recipe.reagents[0], producedAmount, depth + 1);
    visit(recipe.reagents[1], producedAmount, depth + 1);
  }

  visit(target, normalizedAmount, 0);

  return {
    baseResources,
    stages: [...stageMap.values()].sort(
      (left, right) => right.depth - left.depth || left.compound.localeCompare(right.compound),
    ),
  };
}
