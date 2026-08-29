import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const articlePath = path.join(
  process.cwd(),
  "src",
  "app",
  "(en)",
  "en",
  "blog",
  "screeps-cpu-bucket-degradation",
  "page.tsx",
);
const source = fs.readFileSync(articlePath, "utf8");

const forbiddenOldClaims = [
  "The full Chinese implementation adds",
  "Complete Chinese scheduler checked offline",
];

for (const claim of forbiddenOldClaims) {
  assert.equal(
    source.includes(claim),
    false,
    `English CPU article still delegates implementation/evidence to another artifact: ${claim}`,
  );
}

const requiredVisibleMechanisms = [
  "function updateCpuMode(",
  "function partitionTasks(",
  "function taskOffsetFor(",
  "function hasNonCriticalHeadroom(",
  "function runCpuScheduler(",
  'value: "38 deterministic English scheduler cases passed"',
  'value: "English-visible JavaScript blocks checked offline"',
];

for (const mechanism of requiredVisibleMechanisms) {
  assert.ok(
    source.includes(mechanism),
    `English CPU article is missing visible/evidence-aligned mechanism: ${mechanism}`,
  );
}

console.log(
  "CPU English evidence-scope guard PASS：实现、syntax 声明与 deterministic evidence 均绑定当前英文可见 artifact。",
);
