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
export type TransferStepStatus = "pass" | "fail" | "skipped";

export interface TransferScenario {
  range: number;
  creepEnergy: number;
  targetFreeCapacity: number;
}

export interface TransferTickStep {
  key: TransferStepKey;
  status: TransferStepStatus;
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

const stepOrder: TransferStepKey[] = [
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

function buildSteps(failedStep: TransferStepKey | null): TransferTickStep[] {
  if (!failedStep) {
    return stepOrder.map((key) => ({ key, status: "pass" }));
  }

  const failedIndex = stepOrder.indexOf(failedStep);
  return stepOrder.map((key, index) => ({
    key,
    status: index < failedIndex ? "pass" : index === failedIndex ? "fail" : "skipped",
  }));
}

function failedEvaluation(
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
    steps: buildSteps(failedStep),
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
    return failedEvaluation(
      scenario,
      "ERR_NOT_IN_RANGE",
      "range",
      "check-range",
    );
  }

  if (scenario.creepEnergy === 0) {
    return failedEvaluation(
      scenario,
      "ERR_NOT_ENOUGH_RESOURCES",
      "resources",
      "check-resource",
    );
  }

  if (scenario.targetFreeCapacity === 0) {
    return failedEvaluation(scenario, "ERR_FULL", "capacity", "check-capacity");
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
    steps: buildSteps(null),
  };
}
