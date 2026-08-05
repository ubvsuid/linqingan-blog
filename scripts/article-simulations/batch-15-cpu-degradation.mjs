import assert from "node:assert/strict";

const CPU_MODE = Object.freeze({
  NORMAL: "NORMAL",
  CONSERVE: "CONSERVE",
  EMERGENCY: "EMERGENCY",
  RECOVERY: "RECOVERY",
});

const CPU_POLICY = Object.freeze({
  hardEmergencyBucket: 500,
  conserveBelow: 7000,
  emergencyBelow: 2000,
  recoveryAbove: 4500,
  normalAbove: 8500,
  conserveUsedRatio: 0.7,
  hardUsedRatio: 0.9,
  recoveryUsedRatio: 0.55,
  normalUsedRatio: 0.45,
  degradeConfirmTicks: 3,
  recoverConfirmTicks: 20,
  minimumModeTicks: 25,
});

const MODE_SEVERITY = Object.freeze({
  [CPU_MODE.NORMAL]: 0,
  [CPU_MODE.RECOVERY]: 1,
  [CPU_MODE.CONSERVE]: 2,
  [CPU_MODE.EMERGENCY]: 3,
});

function validMode(mode) {
  return Object.prototype.hasOwnProperty.call(MODE_SEVERITY, mode);
}

function normalizeCpuState(value, gameTime) {
  const mode = validMode(value?.mode) ? value.mode : CPU_MODE.NORMAL;
  return {
    mode,
    modeSince: Number.isInteger(value?.modeSince) ? value.modeSince : gameTime,
    candidateMode: validMode(value?.candidateMode) ? value.candidateMode : null,
    candidateTicks:
      Number.isInteger(value?.candidateTicks) && value.candidateTicks >= 0
        ? value.candidateTicks
        : 0,
  };
}

function selectDesiredCpuMode(state, metrics, policy = CPU_POLICY) {
  const { bucket, usedRatio } = metrics;

  if (!Number.isFinite(bucket) || !Number.isFinite(usedRatio) || usedRatio < 0) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: "invalid-cpu-metrics",
      immediate: true,
    };
  }

  if (
    bucket <= policy.hardEmergencyBucket
    || usedRatio >= policy.hardUsedRatio
  ) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: "hard-cpu-risk",
      immediate: true,
    };
  }

  if (bucket <= policy.emergencyBelow) {
    return {
      mode: CPU_MODE.EMERGENCY,
      reason: "bucket-emergency",
      immediate: false,
    };
  }

  switch (state.mode) {
    case CPU_MODE.NORMAL:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: "conserve-threshold",
          immediate: false,
        };
      }
      return { mode: CPU_MODE.NORMAL, reason: "healthy", immediate: false };

    case CPU_MODE.CONSERVE:
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: "normal-threshold",
          immediate: false,
        };
      }
      return {
        mode: CPU_MODE.CONSERVE,
        reason: "conserve-hold",
        immediate: false,
      };

    case CPU_MODE.EMERGENCY:
      if (
        bucket >= policy.recoveryAbove
        && usedRatio <= policy.recoveryUsedRatio
      ) {
        return {
          mode: CPU_MODE.RECOVERY,
          reason: "recovery-threshold",
          immediate: false,
        };
      }
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: "emergency-hold",
        immediate: false,
      };

    case CPU_MODE.RECOVERY:
      if (
        bucket < policy.conserveBelow
        || usedRatio >= policy.conserveUsedRatio
      ) {
        return {
          mode: CPU_MODE.CONSERVE,
          reason: "recovery-regressed",
          immediate: false,
        };
      }
      if (
        bucket >= policy.normalAbove
        && usedRatio <= policy.normalUsedRatio
      ) {
        return {
          mode: CPU_MODE.NORMAL,
          reason: "recovery-complete",
          immediate: false,
        };
      }
      return {
        mode: CPU_MODE.RECOVERY,
        reason: "recovery-hold",
        immediate: false,
      };

    default:
      return {
        mode: CPU_MODE.EMERGENCY,
        reason: "invalid-state-mode",
        immediate: true,
      };
  }
}

function updateCpuMode(previous, metrics, gameTime, policy = CPU_POLICY) {
  const state = normalizeCpuState(previous, gameTime);
  const desired = selectDesiredCpuMode(state, metrics, policy);

  if (desired.mode === state.mode) {
    return {
      ...state,
      candidateMode: null,
      candidateTicks: 0,
      changed: false,
      reason: desired.reason,
    };
  }

  if (desired.immediate) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason,
    };
  }

  const candidateTicks = state.candidateMode === desired.mode
    ? state.candidateTicks + 1
    : 1;
  const degrading = MODE_SEVERITY[desired.mode] > MODE_SEVERITY[state.mode];
  const requiredTicks = degrading
    ? policy.degradeConfirmTicks
    : policy.recoverConfirmTicks;
  const heldLongEnough = degrading
    || gameTime - state.modeSince >= policy.minimumModeTicks;

  if (candidateTicks >= requiredTicks && heldLongEnough) {
    return {
      mode: desired.mode,
      modeSince: gameTime,
      candidateMode: null,
      candidateTicks: 0,
      changed: true,
      reason: desired.reason,
    };
  }

  return {
    ...state,
    candidateMode: desired.mode,
    candidateTicks,
    changed: false,
    reason: `confirm-${desired.reason}`,
  };
}

const TASK_TIER = Object.freeze({
  CRITICAL: "critical",
  IMPORTANT: "important",
  OPTIONAL: "optional",
});

function taskIntervalFor(
  mode,
  tier,
  baseInterval,
  recoveryAge,
  recoveryWarmupTicks = 50,
) {
  if (!Number.isInteger(baseInterval) || baseInterval < 1) return null;
  if (tier === TASK_TIER.CRITICAL) return baseInterval;

  if (tier === TASK_TIER.IMPORTANT) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) return Math.max(baseInterval, 2);
    if (mode === CPU_MODE.EMERGENCY) return Math.max(baseInterval, 10);
    return Math.max(baseInterval, 2);
  }

  if (tier === TASK_TIER.OPTIONAL) {
    if (mode === CPU_MODE.NORMAL) return baseInterval;
    if (mode === CPU_MODE.CONSERVE) return Math.max(baseInterval, 20);
    if (mode === CPU_MODE.EMERGENCY) return null;
    if (recoveryAge < recoveryWarmupTicks) return null;
    return Math.max(baseInterval, 10);
  }

  return null;
}

const results = [];
function check(name, callback) {
  callback();
  results.push(name);
}

const state = (
  mode,
  modeSince = 0,
  candidateMode = null,
  candidateTicks = 0,
) => ({ mode, modeSince, candidateMode, candidateTicks });

check("healthy-normal", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 9000, usedRatio: 0.3 }).mode,
    "NORMAL",
  );
});
check("low-bucket-conserve", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 6500, usedRatio: 0.3 }).mode,
    "CONSERVE",
  );
});
check("high-used-ratio-conserve", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 9000, usedRatio: 0.75 }).mode,
    "CONSERVE",
  );
});
check("emergency-threshold", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 1500, usedRatio: 0.3 }).mode,
    "EMERGENCY",
  );
});
check("hard-bucket-immediate", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 500, usedRatio: 0.2 }).immediate,
    true,
  );
});
check("hard-ratio-emergency", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: 9000, usedRatio: 0.95 }).mode,
    "EMERGENCY",
  );
});
check("invalid-metrics-fail-safe", () => {
  assert.equal(
    selectDesiredCpuMode(state("NORMAL"), { bucket: Number.NaN, usedRatio: 0.2 }).reason,
    "invalid-cpu-metrics",
  );
});
check("first-degrade-sample", () => {
  assert.equal(
    updateCpuMode(state("NORMAL", 0), { bucket: 6500, usedRatio: 0.2 }, 100).candidateTicks,
    1,
  );
});
check("second-degrade-sample", () => {
  assert.equal(
    updateCpuMode(
      state("NORMAL", 0, "CONSERVE", 1),
      { bucket: 6500, usedRatio: 0.2 },
      101,
    ).changed,
    false,
  );
});
check("third-degrade-commits", () => {
  assert.equal(
    updateCpuMode(
      state("NORMAL", 0, "CONSERVE", 2),
      { bucket: 6500, usedRatio: 0.2 },
      102,
    ).mode,
    "CONSERVE",
  );
});
check("candidate-reset", () => {
  assert.equal(
    updateCpuMode(
      state("NORMAL", 0, "CONSERVE", 2),
      { bucket: 9000, usedRatio: 0.2 },
      102,
    ).candidateTicks,
    0,
  );
});
check("hard-emergency-bypasses-confirmation", () => {
  assert.equal(
    updateCpuMode(state("NORMAL", 0), { bucket: 400, usedRatio: 0.2 }, 100).mode,
    "EMERGENCY",
  );
});
check("emergency-can-recover", () => {
  assert.equal(
    selectDesiredCpuMode(state("EMERGENCY"), { bucket: 5000, usedRatio: 0.4 }).mode,
    "RECOVERY",
  );
});
check("recovery-commits", () => {
  assert.equal(
    updateCpuMode(
      state("EMERGENCY", 90, "RECOVERY", 19),
      { bucket: 5000, usedRatio: 0.4 },
      120,
    ).mode,
    "RECOVERY",
  );
});
check("recovery-regresses", () => {
  assert.equal(
    selectDesiredCpuMode(state("RECOVERY"), { bucket: 6500, usedRatio: 0.3 }).mode,
    "CONSERVE",
  );
});
check("recovery-completes", () => {
  assert.equal(
    selectDesiredCpuMode(state("RECOVERY"), { bucket: 9000, usedRatio: 0.3 }).mode,
    "NORMAL",
  );
});
check("minimum-hold-blocks-recovery", () => {
  assert.equal(
    updateCpuMode(
      state("CONSERVE", 100, "NORMAL", 19),
      { bucket: 9000, usedRatio: 0.3 },
      110,
    ).mode,
    "CONSERVE",
  );
});
check("invalid-state-normalizes", () => {
  assert.equal(
    updateCpuMode({ mode: "BAD" }, { bucket: 9000, usedRatio: 0.2 }, 10).mode,
    "NORMAL",
  );
});
check("critical-normal-cadence", () => {
  assert.equal(taskIntervalFor("NORMAL", "critical", 1, 0), 1);
});
check("critical-emergency-cadence", () => {
  assert.equal(taskIntervalFor("EMERGENCY", "critical", 1, 0), 1);
});
check("important-conserve-throttle", () => {
  assert.equal(taskIntervalFor("CONSERVE", "important", 1, 0), 2);
});
check("important-emergency-throttle", () => {
  assert.equal(taskIntervalFor("EMERGENCY", "important", 1, 0), 10);
});
check("optional-emergency-disabled", () => {
  assert.equal(taskIntervalFor("EMERGENCY", "optional", 1, 0), null);
});
check("optional-recovery-warmup-disabled", () => {
  assert.equal(taskIntervalFor("RECOVERY", "optional", 1, 49), null);
});
check("optional-recovery-staggered", () => {
  assert.equal(taskIntervalFor("RECOVERY", "optional", 1, 50), 10);
});
check("optional-normal-preserves-base", () => {
  assert.equal(taskIntervalFor("NORMAL", "optional", 5, 0), 5);
});
check("unknown-tier-rejected", () => {
  assert.equal(taskIntervalFor("NORMAL", "unknown", 1, 0), null);
});

console.log(
  `批次模拟通过：screeps-cpu-bucket-degradation — ${results.length}个模式转换、迟滞、确认周期与任务许可场景通过。`,
);
console.log(
  "CPU降载文章离线模拟通过。真实Screeps CPU单位、bucket趋势与官方shard主循环仍待环境验证。",
);
