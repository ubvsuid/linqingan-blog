export const transferReturnCodes = {
  OK: 0,
  ERR_NOT_ENOUGH_RESOURCES: -6,
  ERR_FULL: -8,
  ERR_NOT_IN_RANGE: -9,
} as const;

export type TransferReturnName = keyof typeof transferReturnCodes;
export type TransferFailureKey = "range" | "resources" | "capacity" | null;
export type TransferStepKey =
  | "resolve-creep"
  | "resolve-target"
  | "check-range"
  | "check-resource"
  | "check-capacity"
  | "submit-intent"
  | "resolve-tick";
export type TickLabStepStatus = "pass" | "fail" | "skipped";

export interface TransferScenario {
  range: number;
  creepEnergy: number;
  targetFreeCapacity: number;
}

export interface TransferTickStep {
  key: TransferStepKey;
  status: TickLabStepStatus;
}

export interface TransferEvaluation {
  returnCode: number;
  returnName: TransferReturnName;
  failure: TransferFailureKey;
  intentSubmitted: boolean;
  transferred: number;
  nextCreepEnergy: number;
  nextTargetFreeCapacity: number;
  steps: TransferTickStep[];
}

const transferStepOrder: TransferStepKey[] = [
  "resolve-creep",
  "resolve-target",
  "check-range",
  "check-resource",
  "check-capacity",
  "submit-intent",
  "resolve-tick",
];

function assertIntegerInRange(name: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
}

function buildSteps<TKey extends string>(
  order: readonly TKey[],
  failedStep: TKey | null,
): { key: TKey; status: TickLabStepStatus }[] {
  if (!failedStep) {
    return order.map((key) => ({ key, status: "pass" }));
  }

  const failedIndex = order.indexOf(failedStep);
  return order.map((key, index) => ({
    key,
    status: index < failedIndex ? "pass" : index === failedIndex ? "fail" : "skipped",
  }));
}

function failedTransferEvaluation(
  scenario: TransferScenario,
  returnName: Exclude<TransferReturnName, "OK">,
  failure: Exclude<TransferFailureKey, null>,
  failedStep: TransferStepKey,
): TransferEvaluation {
  return {
    returnCode: transferReturnCodes[returnName],
    returnName,
    failure,
    intentSubmitted: false,
    transferred: 0,
    nextCreepEnergy: scenario.creepEnergy,
    nextTargetFreeCapacity: scenario.targetFreeCapacity,
    steps: buildSteps(transferStepOrder, failedStep),
  };
}

/**
 * Deterministic educational model for a deliberately constrained Creep.transfer()
 * scenario: owned, spawned creep; valid Spawn target; RESOURCE_ENERGY; amount omitted.
 *
 * For these controlled inputs the check order follows the public Screeps engine path:
 * adjacency -> carried resource -> target fullness. When amount is omitted, the engine
 * chooses the smaller of the carried amount and the target's remaining capacity.
 * This is not a complete Screeps engine simulation and does not model competing intents.
 */
export function evaluateTransfer(scenario: TransferScenario): TransferEvaluation {
  assertIntegerInRange("range", scenario.range, 1, 3);
  assertIntegerInRange("creepEnergy", scenario.creepEnergy, 0, 50);
  assertIntegerInRange("targetFreeCapacity", scenario.targetFreeCapacity, 0, 300);

  if (scenario.range > 1) {
    return failedTransferEvaluation(
      scenario,
      "ERR_NOT_IN_RANGE",
      "range",
      "check-range",
    );
  }

  if (scenario.creepEnergy === 0) {
    return failedTransferEvaluation(
      scenario,
      "ERR_NOT_ENOUGH_RESOURCES",
      "resources",
      "check-resource",
    );
  }

  if (scenario.targetFreeCapacity === 0) {
    return failedTransferEvaluation(
      scenario,
      "ERR_FULL",
      "capacity",
      "check-capacity",
    );
  }

  const transferred = Math.min(
    scenario.creepEnergy,
    scenario.targetFreeCapacity,
  );

  return {
    returnCode: transferReturnCodes.OK,
    returnName: "OK",
    failure: null,
    intentSubmitted: true,
    transferred,
    nextCreepEnergy: scenario.creepEnergy - transferred,
    nextTargetFreeCapacity: scenario.targetFreeCapacity - transferred,
    steps: buildSteps(transferStepOrder, null),
  };
}

export const spawnCreepReturnCodes = {
  OK: 0,
  ERR_NAME_EXISTS: -3,
  ERR_BUSY: -4,
  ERR_NOT_ENOUGH_ENERGY: -6,
} as const;

export type SpawnCreepReturnName = keyof typeof spawnCreepReturnCodes;
export type SpawnCreepFailureKey = "name" | "busy" | "energy" | null;
export type SpawnCreepStepKey =
  | "read-spawn"
  | "validate-call"
  | "check-name"
  | "check-owner"
  | "check-busy"
  | "check-rcl-body"
  | "check-energy"
  | "submit-intent"
  | "model-spawning";
export type SpawnBodyPart = "WORK" | "CARRY" | "MOVE";

const spawnBodyPartCosts: Record<SpawnBodyPart, number> = {
  WORK: 100,
  CARRY: 50,
  MOVE: 50,
};

export const spawnBodyPresets = {
  worker: {
    parts: ["WORK", "CARRY", "MOVE"] as const,
  },
  builder: {
    parts: ["WORK", "WORK", "CARRY", "MOVE"] as const,
  },
  hauler: {
    parts: ["CARRY", "CARRY", "CARRY", "MOVE", "MOVE"] as const,
  },
} as const;

export type SpawnBodyPresetKey = keyof typeof spawnBodyPresets;

export interface SpawnCreepScenario {
  bodyPreset: SpawnBodyPresetKey;
  energyAvailable: number;
  spawnBusy: boolean;
  nameExists: boolean;
}

export interface SpawnCreepTickStep {
  key: SpawnCreepStepKey;
  status: TickLabStepStatus;
}

export interface SpawnCreepEvaluation {
  returnCode: number;
  returnName: SpawnCreepReturnName;
  failure: SpawnCreepFailureKey;
  intentSubmitted: boolean;
  bodyParts: readonly SpawnBodyPart[];
  bodyCost: number;
  spawnTime: number;
  nextEnergyAvailable: number;
  nextSpawnBusy: boolean;
  spawningName: "Worker1" | null;
  steps: SpawnCreepTickStep[];
}

const spawnCreepStepOrder: SpawnCreepStepKey[] = [
  "read-spawn",
  "validate-call",
  "check-name",
  "check-owner",
  "check-busy",
  "check-rcl-body",
  "check-energy",
  "submit-intent",
  "model-spawning",
];

export function getSpawnBodyCost(bodyPreset: SpawnBodyPresetKey) {
  return spawnBodyPresets[bodyPreset].parts.reduce(
    (total, part) => total + spawnBodyPartCosts[part],
    0,
  );
}

export function getSpawnTime(bodyPreset: SpawnBodyPresetKey) {
  return spawnBodyPresets[bodyPreset].parts.length * 3;
}

function failedSpawnCreepEvaluation(
  scenario: SpawnCreepScenario,
  returnName: Exclude<SpawnCreepReturnName, "OK">,
  failure: Exclude<SpawnCreepFailureKey, null>,
  failedStep: SpawnCreepStepKey,
): SpawnCreepEvaluation {
  const bodyParts = spawnBodyPresets[scenario.bodyPreset].parts;
  return {
    returnCode: spawnCreepReturnCodes[returnName],
    returnName,
    failure,
    intentSubmitted: false,
    bodyParts,
    bodyCost: getSpawnBodyCost(scenario.bodyPreset),
    spawnTime: getSpawnTime(scenario.bodyPreset),
    nextEnergyAvailable: scenario.energyAvailable,
    nextSpawnBusy: scenario.spawnBusy,
    spawningName: null,
    steps: buildSteps(spawnCreepStepOrder, failedStep),
  };
}

/**
 * Deterministic educational model for one constrained StructureSpawn.spawnCreep()
 * call. The controlled world fixes ownership, usable RCL, valid body parts, an empty
 * options object, default room energy sourcing, and the name "Worker1". The user only
 * varies a curated body preset, room energyAvailable, whether Spawn1 is already busy,
 * and whether Worker1 already exists (or has already been reserved by an earlier
 * spawnCreep call in the same tick).
 *
 * For those inputs the public engine path checks name uniqueness before Spawn busy,
 * and Spawn busy before available energy. OK means the spawn intent was scheduled;
 * the modeled post-Tick spawning state below is educational, not live shard evidence.
 */
export function evaluateSpawnCreep(
  scenario: SpawnCreepScenario,
): SpawnCreepEvaluation {
  if (!(scenario.bodyPreset in spawnBodyPresets)) {
    throw new RangeError("bodyPreset must be a supported Tick Lab body preset");
  }
  assertIntegerInRange("energyAvailable", scenario.energyAvailable, 0, 300);
  if (typeof scenario.spawnBusy !== "boolean" || typeof scenario.nameExists !== "boolean") {
    throw new TypeError("spawnBusy and nameExists must be booleans");
  }

  if (scenario.nameExists) {
    return failedSpawnCreepEvaluation(
      scenario,
      "ERR_NAME_EXISTS",
      "name",
      "check-name",
    );
  }

  if (scenario.spawnBusy) {
    return failedSpawnCreepEvaluation(
      scenario,
      "ERR_BUSY",
      "busy",
      "check-busy",
    );
  }

  const bodyCost = getSpawnBodyCost(scenario.bodyPreset);
  if (scenario.energyAvailable < bodyCost) {
    return failedSpawnCreepEvaluation(
      scenario,
      "ERR_NOT_ENOUGH_ENERGY",
      "energy",
      "check-energy",
    );
  }

  const bodyParts = spawnBodyPresets[scenario.bodyPreset].parts;
  return {
    returnCode: spawnCreepReturnCodes.OK,
    returnName: "OK",
    failure: null,
    intentSubmitted: true,
    bodyParts,
    bodyCost,
    spawnTime: getSpawnTime(scenario.bodyPreset),
    nextEnergyAvailable: scenario.energyAvailable - bodyCost,
    nextSpawnBusy: true,
    spawningName: "Worker1",
    steps: buildSteps(spawnCreepStepOrder, null),
  };
}
