export const cpuBudgetConstants = {
  baselineLimit: 100,
  maxTickLimit: 500,
  bucketCapacity: 10_000,
} as const;

export type CpuBudgetDecision = "RUN" | "SKIP";
export type CpuBucketDirection = "replenish" | "steady" | "spend";
export type CpuBudgetStepStatus = "pass" | "fail" | "skipped";
export type CpuBudgetStepKey =
  | "read-cpu"
  | "derive-tick-limit"
  | "measure-used"
  | "check-headroom"
  | "decide-task"
  | "model-total-used"
  | "model-bucket";

export interface CpuBudgetScenario {
  bucket: number;
  used: number;
  plannedTaskCost: number;
}

export interface CpuBudgetTickStep {
  key: CpuBudgetStepKey;
  status: CpuBudgetStepStatus;
}

export interface CpuBudgetEvaluation {
  limit: number;
  tickLimit: number;
  bucket: number;
  used: number;
  plannedTaskCost: number;
  headroomBeforeTask: number;
  decision: CpuBudgetDecision;
  taskRuns: boolean;
  modeledTotalUsed: number;
  bucketDelta: number;
  nextBucket: number;
  bucketDirection: CpuBucketDirection;
  wouldExceedTickLimitIfForced: boolean;
  steps: CpuBudgetTickStep[];
}

function assertIntegerInRange(name: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer between ${min} and ${max}`);
  }
}

export function getModeledCpuTickLimit(bucket: number) {
  assertIntegerInRange("bucket", bucket, 0, cpuBudgetConstants.bucketCapacity);
  return Math.min(
    cpuBudgetConstants.maxTickLimit,
    cpuBudgetConstants.baselineLimit + bucket,
  );
}

/**
 * Deterministic educational model for a deliberately constrained Game.cpu snapshot.
 * The account baseline Game.cpu.limit is fixed at 100 CPU so the lab can focus on
 * bucket reserve, the derived current-tick ceiling, measured CPU already used, and
 * one hypothetical optional task estimate.
 *
 * The model follows the documented bucket rules: unused baseline CPU replenishes the
 * bucket up to 10,000; CPU used above the baseline spends bucket reserve; tickLimit is
 * never below limit and is capped at 500. The local RUN/SKIP decision is teaching code,
 * not a Screeps API return code or intent. Actual task cost must still be measured on a
 * real shard and can differ from the estimate used here.
 */
export function evaluateCpuBudget(scenario: CpuBudgetScenario): CpuBudgetEvaluation {
  assertIntegerInRange("bucket", scenario.bucket, 0, cpuBudgetConstants.bucketCapacity);
  assertIntegerInRange("used", scenario.used, 0, cpuBudgetConstants.maxTickLimit);
  assertIntegerInRange("plannedTaskCost", scenario.plannedTaskCost, 0, cpuBudgetConstants.maxTickLimit);

  const tickLimit = getModeledCpuTickLimit(scenario.bucket);
  if (scenario.used > tickLimit) {
    throw new RangeError("used cannot exceed the modeled current-tick tickLimit");
  }

  const headroomBeforeTask = tickLimit - scenario.used;
  const wouldExceedTickLimitIfForced = scenario.used + scenario.plannedTaskCost > tickLimit;
  const taskRuns = !wouldExceedTickLimitIfForced;
  const modeledTotalUsed = taskRuns
    ? scenario.used + scenario.plannedTaskCost
    : scenario.used;
  const rawBucketDelta = cpuBudgetConstants.baselineLimit - modeledTotalUsed;
  const nextBucket = Math.max(
    0,
    Math.min(cpuBudgetConstants.bucketCapacity, scenario.bucket + rawBucketDelta),
  );
  const bucketDelta = nextBucket - scenario.bucket;
  const bucketDirection: CpuBucketDirection =
    bucketDelta > 0 ? "replenish" : bucketDelta < 0 ? "spend" : "steady";

  return {
    limit: cpuBudgetConstants.baselineLimit,
    tickLimit,
    bucket: scenario.bucket,
    used: scenario.used,
    plannedTaskCost: scenario.plannedTaskCost,
    headroomBeforeTask,
    decision: taskRuns ? "RUN" : "SKIP",
    taskRuns,
    modeledTotalUsed,
    bucketDelta,
    nextBucket,
    bucketDirection,
    wouldExceedTickLimitIfForced,
    steps: [
      { key: "read-cpu", status: "pass" },
      { key: "derive-tick-limit", status: "pass" },
      { key: "measure-used", status: "pass" },
      { key: "check-headroom", status: taskRuns ? "pass" : "fail" },
      { key: "decide-task", status: "pass" },
      { key: "model-total-used", status: "pass" },
      { key: "model-bucket", status: "pass" },
    ],
  };
}
