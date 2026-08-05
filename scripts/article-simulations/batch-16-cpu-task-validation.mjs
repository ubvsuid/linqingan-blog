import assert from "node:assert/strict";

const TIER_ORDER = Object.freeze({
  critical: 0,
  important: 1,
  optional: 2,
});

function isValidTask(task) {
  return Boolean(task)
    && typeof task.name === "string"
    && task.name.length > 0
    && typeof task.run === "function"
    && Object.prototype.hasOwnProperty.call(TIER_ORDER, task.tier);
}

function partitionAndSortTasks(tasks) {
  const results = [];
  const validTasks = [];
  const rawTasks = Array.isArray(tasks) ? tasks : [];

  if (!Array.isArray(tasks)) {
    results.push({ name: null, status: "invalid-task-list" });
  }

  for (const task of rawTasks) {
    if (!isValidTask(task)) {
      results.push({
        name: task && typeof task.name === "string" ? task.name : null,
        status: "invalid-task",
      });
      continue;
    }
    validTasks.push(task);
  }

  validTasks.sort(
    (left, right) =>
      TIER_ORDER[left.tier] - TIER_ORDER[right.tier]
      || left.name.localeCompare(right.name),
  );

  return { results, validTasks };
}

{
  const output = partitionAndSortTasks([
    null,
    { name: "spawn", tier: "critical", run() {} },
  ]);
  assert.deepEqual(output.results, [{ name: null, status: "invalid-task" }]);
  assert.deepEqual(output.validTasks.map((task) => task.name), ["spawn"]);
}

{
  const output = partitionAndSortTasks([
    { name: "missing-run", tier: "critical" },
    { name: "unknown-tier", tier: "background", run() {} },
    { tier: "critical", run() {} },
  ]);
  assert.deepEqual(
    output.results.map((result) => result.status),
    ["invalid-task", "invalid-task", "invalid-task"],
  );
  assert.equal(output.validTasks.length, 0);
}

{
  const output = partitionAndSortTasks([
    { name: "visual", tier: "optional", run() {} },
    { name: "economy", tier: "important", run() {} },
    { name: "spawn", tier: "critical", run() {} },
    { name: "defense", tier: "critical", run() {} },
  ]);
  assert.deepEqual(
    output.validTasks.map((task) => task.name),
    ["defense", "spawn", "economy", "visual"],
  );
}

console.log(
  "批次模拟通过：screeps-cpu-task-validation — null、损坏配置与有效任务排序共3个场景通过。",
);
console.log(
  "CPU任务验证模拟通过。损坏任务会在排序前隔离，关键任务仍按稳定顺序运行。",
);
