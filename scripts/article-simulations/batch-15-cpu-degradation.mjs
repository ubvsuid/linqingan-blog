import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const articlePath = path.join(
  root,
  "src",
  "app",
  "(en)",
  "en",
  "blog",
  "screeps-cpu-bucket-degradation",
  "page.tsx",
);
const source = fs.readFileSync(articlePath, "utf8");
const htmlMatch = source.match(
  /const articleHtml = String\.raw`([\s\S]*?)`;\s*\n\s*export default/,
);

assert.ok(htmlMatch, "English CPU articleHtml must be extractable");

const decodeHtml = (value) => value
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");

const jsBlocks = [
  ...htmlMatch[1].matchAll(
    /<pre><code class="language-js">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => decodeHtml(match[1]));

assert.equal(
  jsBlocks.length,
  3,
  "English CPU guide must expose state machine, scheduler, and loop integration blocks",
);

const temporaryDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "linqingan-cpu-en-"),
);

try {
  jsBlocks.forEach((block, index) => {
    const temporaryPath = path.join(
      temporaryDirectory,
      `english-cpu-${index + 1}.js`,
    );
    fs.writeFileSync(temporaryPath, block, "utf8");
    const result = spawnSync(process.execPath, ["--check", temporaryPath], {
      encoding: "utf8",
    });
    assert.equal(
      result.status,
      0,
      `English CPU JavaScript block ${index + 1} syntax failed:\n${result.stderr || result.stdout}`,
    );
  });
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

let usedCpu = 10;
const context = {
  module: { exports: {} },
  exports: {},
  Memory: {},
  Game: {
    time: 100,
    cpu: {
      bucket: 9000,
      tickLimit: 100,
      getUsed: () => usedCpu,
    },
  },
  console,
  Error,
};
vm.runInNewContext(
  `${jsBlocks[0]}\n${jsBlocks[1]}`,
  context,
  { filename: "english-cpu-visible-implementation.js" },
);

const {
  CPU_MODE,
  CPU_POLICY,
  TASK_TIER,
  runCpuScheduler,
  selectDesiredCpuMode,
  updateCpuMode,
  taskIntervalFor,
  taskOffsetFor,
  isCadenceTick,
  hasNonCriticalHeadroom,
  partitionTasks,
} = context.module.exports;

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
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: 9000, usedRatio: 0.3 },
    ).mode,
    CPU_MODE.NORMAL,
  );
});

check("low-bucket-conserve-candidate", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: 6500, usedRatio: 0.3 },
    ).mode,
    CPU_MODE.CONSERVE,
  );
});

check("high-used-ratio-conserve-candidate", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: 9000, usedRatio: 0.75 },
    ).mode,
    CPU_MODE.CONSERVE,
  );
});

check("emergency-threshold-candidate", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.CONSERVE),
      { bucket: 1500, usedRatio: 0.3 },
    ).mode,
    CPU_MODE.EMERGENCY,
  );
});

check("hard-bucket-immediate", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: 500, usedRatio: 0.2 },
    ).immediate,
    true,
  );
});

check("hard-ratio-emergency", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: 9000, usedRatio: 0.95 },
    ).mode,
    CPU_MODE.EMERGENCY,
  );
});

check("invalid-metrics-fail-safe", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.NORMAL),
      { bucket: Number.NaN, usedRatio: 0.2 },
    ).reason,
    "invalid-cpu-metrics",
  );
});

check("first-degrade-sample", () => {
  const next = updateCpuMode(
    state(CPU_MODE.NORMAL, 0),
    { bucket: 6500, usedRatio: 0.2 },
    100,
  );
  assert.equal(next.mode, CPU_MODE.NORMAL);
  assert.equal(next.candidateTicks, 1);
});

check("second-degrade-sample", () => {
  const next = updateCpuMode(
    state(CPU_MODE.NORMAL, 0, CPU_MODE.CONSERVE, 1),
    { bucket: 6500, usedRatio: 0.2 },
    101,
  );
  assert.equal(next.changed, false);
  assert.equal(next.candidateTicks, 2);
});

check("third-degrade-commits", () => {
  const next = updateCpuMode(
    state(CPU_MODE.NORMAL, 0, CPU_MODE.CONSERVE, 2),
    { bucket: 6500, usedRatio: 0.2 },
    102,
  );
  assert.equal(next.mode, CPU_MODE.CONSERVE);
  assert.equal(next.changed, true);
});

check("candidate-reset", () => {
  const next = updateCpuMode(
    state(CPU_MODE.NORMAL, 0, CPU_MODE.CONSERVE, 2),
    { bucket: 9000, usedRatio: 0.2 },
    102,
  );
  assert.equal(next.mode, CPU_MODE.NORMAL);
  assert.equal(next.candidateMode, null);
  assert.equal(next.candidateTicks, 0);
});

check("hard-emergency-bypasses-confirmation", () => {
  const next = updateCpuMode(
    state(CPU_MODE.NORMAL, 0),
    { bucket: 400, usedRatio: 0.2 },
    100,
  );
  assert.equal(next.mode, CPU_MODE.EMERGENCY);
  assert.equal(next.changed, true);
});

check("emergency-starts-recovery-candidate", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.EMERGENCY),
      { bucket: 5000, usedRatio: 0.4 },
    ).mode,
    CPU_MODE.RECOVERY,
  );
});

check("nineteen-recovery-samples-do-not-commit", () => {
  const next = updateCpuMode(
    state(CPU_MODE.EMERGENCY, 80, CPU_MODE.RECOVERY, 18),
    { bucket: 5000, usedRatio: 0.4 },
    120,
  );
  assert.equal(next.mode, CPU_MODE.EMERGENCY);
  assert.equal(next.candidateTicks, 19);
});

check("twentieth-recovery-sample-commits", () => {
  const next = updateCpuMode(
    state(CPU_MODE.EMERGENCY, 80, CPU_MODE.RECOVERY, 19),
    { bucket: 5000, usedRatio: 0.4 },
    120,
  );
  assert.equal(next.mode, CPU_MODE.RECOVERY);
  assert.equal(next.changed, true);
});

check("minimum-hold-blocks-recovery", () => {
  const next = updateCpuMode(
    state(CPU_MODE.CONSERVE, 100, CPU_MODE.NORMAL, 19),
    { bucket: 9000, usedRatio: 0.3 },
    110,
  );
  assert.equal(next.mode, CPU_MODE.CONSERVE);
  assert.equal(next.candidateTicks, 20);
});

check("recovery-regression-targets-conserve", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.RECOVERY),
      { bucket: 6500, usedRatio: 0.3 },
    ).mode,
    CPU_MODE.CONSERVE,
  );
});

check("recovery-complete-targets-normal", () => {
  assert.equal(
    selectDesiredCpuMode(
      state(CPU_MODE.RECOVERY),
      { bucket: 9000, usedRatio: 0.3 },
    ).mode,
    CPU_MODE.NORMAL,
  );
});

check("invalid-state-normalizes-safely", () => {
  assert.equal(
    updateCpuMode(
      { mode: "BAD" },
      { bucket: 9000, usedRatio: 0.2 },
      10,
    ).mode,
    CPU_MODE.NORMAL,
  );
});

check("critical-normal-preserves-interval", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.NORMAL, TASK_TIER.CRITICAL, 1, 0),
    1,
  );
});

check("critical-emergency-preserves-interval", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.EMERGENCY, TASK_TIER.CRITICAL, 1, 0),
    1,
  );
});

check("important-conserve-throttles", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.CONSERVE, TASK_TIER.IMPORTANT, 1, 0),
    2,
  );
});

check("important-emergency-throttles-further", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.EMERGENCY, TASK_TIER.IMPORTANT, 1, 0),
    10,
  );
});

check("optional-conserve-throttles", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.CONSERVE, TASK_TIER.OPTIONAL, 1, 0),
    20,
  );
});

check("optional-emergency-disabled", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.EMERGENCY, TASK_TIER.OPTIONAL, 1, 0),
    null,
  );
});

check("optional-recovery-warmup-disabled", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.RECOVERY, TASK_TIER.OPTIONAL, 1, 49),
    null,
  );
});

check("optional-recovery-after-warmup-throttled", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.RECOVERY, TASK_TIER.OPTIONAL, 1, 50),
    10,
  );
});

check("normal-mode-preserves-base-interval", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.NORMAL, TASK_TIER.OPTIONAL, 5, 0),
    5,
  );
});

check("unknown-tier-rejected", () => {
  assert.equal(
    taskIntervalFor(CPU_MODE.NORMAL, "unknown", 1, 0),
    null,
  );
});

check("stable-task-offset", () => {
  assert.equal(
    taskOffsetFor("market-scan", 100),
    taskOffsetFor("market-scan", 100),
  );
});

check("cadence-uses-stable-offset", () => {
  const offset = taskOffsetFor("path-planner", 100);
  assert.equal(isCadenceTick("path-planner", 100, offset), true);
  assert.equal(
    isCadenceTick("path-planner", 100, (offset + 1) % 100),
    false,
  );
});

check("null-task-isolated-before-sort", () => {
  const output = partitionTasks([
    null,
    { name: "spawn", tier: TASK_TIER.CRITICAL, run() {} },
  ]);
  assert.deepEqual(
    Array.from(output.results, (item) => item.status),
    ["invalid-task"],
  );
  assert.deepEqual(
    Array.from(output.validTasks, (task) => task.name),
    ["spawn"],
  );
});

check("missing-fields-and-unknown-tier-isolated", () => {
  const output = partitionTasks([
    { name: "missing-run", tier: TASK_TIER.CRITICAL },
    { name: "unknown-tier", tier: "background", run() {} },
    { tier: TASK_TIER.CRITICAL, run() {} },
  ]);
  assert.deepEqual(
    Array.from(output.results, (item) => item.status),
    ["invalid-task", "invalid-task", "invalid-task"],
  );
  assert.equal(output.validTasks.length, 0);
});

check("critical-first-ordering", () => {
  const output = partitionTasks([
    { name: "visual", tier: TASK_TIER.OPTIONAL, run() {} },
    { name: "economy", tier: TASK_TIER.IMPORTANT, run() {} },
    { name: "spawn", tier: TASK_TIER.CRITICAL, run() {} },
    { name: "defense", tier: TASK_TIER.CRITICAL, run() {} },
  ]);
  assert.deepEqual(
    Array.from(output.validTasks, (task) => task.name),
    ["defense", "spawn", "economy", "visual"],
  );
});

check("headroom-cutoff-below-threshold", () => {
  usedCpu = 86;
  context.Game.cpu.tickLimit = 100;
  assert.equal(hasNonCriticalHeadroom(CPU_POLICY), false);
});

check("headroom-allows-work-above-threshold", () => {
  usedCpu = 84;
  context.Game.cpu.tickLimit = 100;
  assert.equal(hasNonCriticalHeadroom(CPU_POLICY), true);
});

check("critical-runs-while-noncritical-stops-on-headroom", () => {
  const execution = [];
  context.Memory.cpuScheduler = {
    mode: CPU_MODE.NORMAL,
    modeSince: 0,
    candidateMode: null,
    candidateTicks: 0,
    transitions: [],
    failures: [],
  };
  context.Game.time = 200;
  context.Game.cpu.bucket = 9000;
  context.Game.cpu.tickLimit = 100;
  usedCpu = 86;

  const summary = runCpuScheduler([
    {
      name: "important-work",
      tier: TASK_TIER.IMPORTANT,
      interval: 1,
      run() {
        execution.push("important");
      },
    },
    {
      name: "critical-work",
      tier: TASK_TIER.CRITICAL,
      interval: 1,
      run() {
        execution.push("critical");
      },
    },
  ]);

  assert.deepEqual(execution, ["critical"]);
  assert.equal(
    summary.results.find((item) => item.name === "important-work").status,
    "insufficient-headroom",
  );
});

check("task-exception-isolated", () => {
  context.Memory.cpuScheduler = {
    mode: CPU_MODE.NORMAL,
    modeSince: 0,
    candidateMode: null,
    candidateTicks: 0,
    transitions: [],
    failures: [],
  };
  context.Game.time = 201;
  context.Game.cpu.bucket = 9000;
  context.Game.cpu.tickLimit = 100;
  usedCpu = 10;

  const summary = runCpuScheduler([
    {
      name: "a-critical-fails",
      tier: TASK_TIER.CRITICAL,
      interval: 1,
      run() {
        throw new Error("expected test failure");
      },
    },
    {
      name: "b-critical-runs",
      tier: TASK_TIER.CRITICAL,
      interval: 1,
      run() {
        return "ok";
      },
    },
  ]);

  assert.equal(summary.results[0].status, "failed");
  assert.equal(summary.results[1].status, "ran");
  assert.equal(context.Memory.cpuScheduler.failures.length, 1);
});

assert.equal(
  results.length,
  38,
  `Expected 38 deterministic English scheduler cases, got ${results.length}`,
);

console.log(
  `批次模拟通过：screeps-cpu-bucket-degradation — 英文可见实现 ${results.length} 个 deterministic cases PASS；3 个英文 JavaScript blocks syntax PASS。`,
);
console.log(
  "覆盖连续降载/恢复确认、minimum hold、candidate reset、四模式转换、任务 interval、稳定 offset、损坏任务隔离、critical-first、headroom cutoff 与任务异常隔离。Console/Live 仍为 Pending。",
);
