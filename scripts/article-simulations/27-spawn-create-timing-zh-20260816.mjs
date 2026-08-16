import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function simulateSpawnCreepCall({
  dryRun,
  requestValid,
  gameCreeps,
  name,
}) {
  if (!requestValid) {
    return {
      result: "ERR_INVALID_ARGS",
      gameCreeps,
    };
  }

  if (dryRun) {
    return {
      result: "OK",
      gameCreeps,
    };
  }

  gameCreeps[name] = {
    name,
    spawning: true,
  };

  return {
    result: "OK",
    gameCreeps,
  };
}

function readSpawnLifecycle(creep) {
  if (!creep) return "not-created";
  return creep.spawning === true
    ? "spawning"
    : "ready";
}

const dryRunGameCreeps = {};
const dryRun = simulateSpawnCreepCall({
  dryRun: true,
  requestValid: true,
  gameCreeps: dryRunGameCreeps,
  name: "Worker1",
});
assert.equal(dryRun.result, "OK");
assert.equal(dryRunGameCreeps.Worker1, undefined);
assert.equal(readSpawnLifecycle(dryRunGameCreeps.Worker1), "not-created");

const formalGameCreeps = {};
const formal = simulateSpawnCreepCall({
  dryRun: false,
  requestValid: true,
  gameCreeps: formalGameCreeps,
  name: "Worker1",
});
assert.equal(formal.result, "OK");
assert.equal(Boolean(formalGameCreeps.Worker1), true);
assert.equal(formalGameCreeps.Worker1.spawning, true);
assert.equal(readSpawnLifecycle(formalGameCreeps.Worker1), "spawning");

formalGameCreeps.Worker1.spawning = false;
assert.equal(readSpawnLifecycle(formalGameCreeps.Worker1), "ready");

const article = fs.readFileSync(
  path.join(
    process.cwd(),
    "content",
    "posts",
    "screeps-spawn-create-creep.md",
  ),
  "utf8",
);

for (const requiredText of [
  "Game.creeps['Worker1'].spawning === true",
  "Game.creeps[name]` 不等于“生成完成”",
  "dryRun: true",
  "同一次 JavaScript 执行中",
  "EV-1132EEA6DB475F4BDE4C",
  "EV-5F64D77F6CEDD1637FA3",
  "EV-1EB26EDDC7D65006ADB2",
  "consoleTested: true",
  "liveTested: false",
  'testedAt: "2026-08-11"',
  'checkedAt: "2026-08-16"',
  "来自当前官方 engine 源码核对，不冒充新的 Console 实测",
]) {
  assert.ok(
    article.includes(requiredText),
    `spawn-create timing article missing required boundary/evidence: ${requiredText}`,
  );
}

for (const staleText of [
  "创建完成后，可以通过 `Game.creeps['Worker1']` 找到它",
  "真正完成以后，再在后续 tick 重新读取 `Game.creeps[name]`",
]) {
  assert.ok(
    !article.includes(staleText),
    `spawn-create timing article reintroduced stale completion timing: ${staleText}`,
  );
}

// The stale model is allowed only as an explicitly introduced misconception
// that the article immediately corrects.
assert.ok(
  article.includes(
    "必须等整个生成过程结束以后，`Worker1` 才会出现在 `Game.creeps`。",
  ),
  "article should preserve the stale model only as an explicit correction example",
);
assert.ok(
  article.indexOf(
    "必须等整个生成过程结束以后，`Worker1` 才会出现在 `Game.creeps`。",
  ) < article.indexOf("当前官方 engine 不是这样处理的"),
  "stale timing model must appear before its explicit correction",
);

console.log(
  "中文 spawnCreep 创建时序模拟通过：dryRun 不创建对象、正式 OK 后同执行上下文对象进入 Game.creeps 且 spawning=true、完成后 spawning=false，并保留原有 Console 证据边界。",
);
