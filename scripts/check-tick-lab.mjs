import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { evaluateTransfer } from "../src/lib/tick-lab.ts";

const root = process.cwd();

const cases = [
  {
    name: "full transfer",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 50 },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, transferred: 50, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
  {
    name: "partial transfer when target has less free capacity",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 20 },
    expected: { returnName: "OK", returnCode: 0, intentSubmitted: true, transferred: 20, nextCreepEnergy: 30, nextTargetFreeCapacity: 0 },
  },
  {
    name: "range failure",
    input: { range: 2, creepEnergy: 50, targetFreeCapacity: 50 },
    expected: { returnName: "ERR_NOT_IN_RANGE", returnCode: -9, intentSubmitted: false, transferred: 0, nextCreepEnergy: 50, nextTargetFreeCapacity: 50 },
  },
  {
    name: "resource failure",
    input: { range: 1, creepEnergy: 0, targetFreeCapacity: 50 },
    expected: { returnName: "ERR_NOT_ENOUGH_RESOURCES", returnCode: -6, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 50 },
  },
  {
    name: "capacity failure",
    input: { range: 1, creepEnergy: 50, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_FULL", returnCode: -8, intentSubmitted: false, transferred: 0, nextCreepEnergy: 50, nextTargetFreeCapacity: 0 },
  },
  {
    name: "range is checked before resources in the constrained model",
    input: { range: 3, creepEnergy: 0, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_NOT_IN_RANGE", returnCode: -9, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
  {
    name: "resources are checked before target fullness in the constrained model",
    input: { range: 1, creepEnergy: 0, targetFreeCapacity: 0 },
    expected: { returnName: "ERR_NOT_ENOUGH_RESOURCES", returnCode: -6, intentSubmitted: false, transferred: 0, nextCreepEnergy: 0, nextTargetFreeCapacity: 0 },
  },
];

for (const testCase of cases) {
  const result = evaluateTransfer(testCase.input);
  for (const [key, value] of Object.entries(testCase.expected)) {
    assert.equal(result[key], value, `${testCase.name}: ${key}`);
  }
}

const requiredFiles = [
  "src/app/(zh)/tick-lab/page.tsx",
  "src/app/(en)/en/tick-lab/page.tsx",
  "src/components/tick-lab/tick-lab.tsx",
  "src/components/tick-lab/tick-lab.module.css",
];
for (const relativePath of requiredFiles) {
  assert.equal(fs.existsSync(path.join(root, relativePath)), true, `missing ${relativePath}`);
}

const componentSource = fs.readFileSync(
  path.join(root, "src/components/tick-lab/tick-lab.tsx"),
  "utf8",
);
assert.match(componentSource, /Deterministic educational model/);
assert.match(componentSource, /intentSubmitted/);
assert.match(componentSource, /presetGrid/);
assert.match(componentSource, /\/verified/);
assert.match(componentSource, /\/en\/verified/);
assert.doesNotMatch(componentSource, /eval\s*\(/);
assert.doesNotMatch(componentSource, /new\s+Function\s*\(/);

const i18nSource = fs.readFileSync(path.join(root, "src/lib/i18n.ts"), "utf8");
assert.match(i18nSource, /"\/tick-lab": "\/en\/tick-lab"/);

const sitemapSource = fs.readFileSync(path.join(root, "src/lib/sitemaps.ts"), "utf8");
assert.match(sitemapSource, /staticPageEntry\("\/tick-lab"\)/);
assert.match(sitemapSource, /staticPageEntry\("\/en\/tick-lab"\)/);

console.log(`Tick Lab check passed: ${cases.length} deterministic transfer cases + route/discovery/interaction contracts.`);
