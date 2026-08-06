import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const chinesePath = path.join(
  root,
  "content/posts/screeps-store-capacity-api.md",
);
const englishPath = path.join(
  root,
  "src/app/(en)/en/blog/screeps-store-capacity-api/page.tsx",
);
const registryPath = path.join(
  root,
  "src/lib/english-link-source-registry-18.ts",
);
const knowledgePath = path.join(
  root,
  "src/lib/knowledge-base.ts",
);
const discoveryPath = path.join(
  root,
  "src/lib/english-discovery-topic-overrides-20260806.ts",
);

const chinese = fs.readFileSync(chinesePath, "utf8");
const english = fs.readFileSync(englishPath, "utf8");
const registry = fs.readFileSync(registryPath, "utf8");
const knowledge = fs.readFileSync(knowledgePath, "utf8");
const discovery = fs.readFileSync(discoveryPath, "utf8");
const failures = [];

for (const expected of [
  "Screeps Store API 怎么判断容量",
  "getUsedCapacity",
  "getFreeCapacity",
  "getCapacity",
  "0 与 null",
  "calculateWithdrawAmount",
  "calculateTransferAmount",
  "consoleTested: false",
  "liveTested: false",
]) {
  if (!chinese.includes(expected)) {
    failures.push(`Chinese article lacks ${expected}`);
  }
}

for (const expected of [
  "Screeps Store API: getUsedCapacity, getFreeCapacity, and null",
  "Separate general, limited, and read-only Stores",
  "Treat zero and null as different states",
  "calculateWithdrawAmount",
  "calculateTransferAmount",
  "Screeps Console test",
  "Official-shard action test",
  "Pending",
  "EnglishArticlePage",
  "BlogPosting",
]) {
  if (!english.includes(expected)) {
    failures.push(`English page lacks ${expected}`);
  }
}

for (const expected of [
  'href: "/en/blog/screeps-store-capacity-api"',
  'chinesePath: "/blog/screeps-store-capacity-api"',
  "finalScore: 98",
]) {
  if (!registry.includes(expected)) {
    failures.push(`English registry lacks ${expected}`);
  }
}

if (!knowledge.includes('"screeps-store-capacity-api"')) {
  failures.push("Chinese Room Economy module lacks the Store API slug");
}
if (!discovery.includes('"/en/blog/screeps-store-capacity-api"')) {
  failures.push("English discovery lacks the Store API path");
}
for (const tag of ["resources", "energy", "javascript", "debugging"]) {
  if (!discovery.includes(`"${tag}"`)) {
    failures.push(`English discovery lacks the ${tag} topic`);
  }
}

const chineseBlocks = [...chinese.matchAll(/```js\n([\s\S]*?)```/g)]
  .map((match) => match[1]);
const englishBlocks = [...english.matchAll(
  /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
)].map((match) => match[1]
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&"));
const blocks = [...chineseBlocks, ...englishBlocks];

if (chineseBlocks.length < 14) {
  failures.push(`Chinese JavaScript block count is only ${chineseBlocks.length}`);
}
if (englishBlocks.length < 10) {
  failures.push(`English JavaScript block count is only ${englishBlocks.length}`);
}

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "store-capacity-20-"),
);
try {
  blocks.forEach((code, index) => {
    const filePath = path.join(
      tempDirectory,
      `block-${index + 1}.js`,
    );
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(
      process.execPath,
      ["--check", filePath],
      { encoding: "utf8" },
    );

    if (result.status !== 0) {
      failures.push(
        `JavaScript block ${index + 1} failed syntax: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDirectory, {
    recursive: true,
    force: true,
  });
}

function generalStore(capacity, contents) {
  const totalUsed = Object.values(contents)
    .reduce((sum, value) => sum + value, 0);

  return {
    getUsedCapacity(resource) {
      return resource === undefined
        ? totalUsed
        : contents[resource] ?? 0;
    },
    getCapacity() {
      return capacity;
    },
    getFreeCapacity() {
      return capacity - totalUsed;
    },
  };
}

const storage = generalStore(2000, {
  energy: 700,
  H: 200,
});
if (storage.getUsedCapacity() !== 900) {
  failures.push("General Store total used capacity failed");
}
if (
  storage.getFreeCapacity("energy") !== 1100
  || storage.getFreeCapacity("H") !== 1100
) {
  failures.push("General Store shared free capacity failed");
}

function limitedStore(capacities, contents) {
  return {
    getCapacity(resource) {
      return Object.hasOwn(capacities, resource)
        ? capacities[resource]
        : null;
    },
    getUsedCapacity(resource) {
      if (!Object.hasOwn(capacities, resource)) return null;
      return contents[resource] ?? 0;
    },
    getFreeCapacity(resource) {
      if (!Object.hasOwn(capacities, resource)) return null;
      return capacities[resource] - (contents[resource] ?? 0);
    },
  };
}

const spawnStore = limitedStore(
  { energy: 300 },
  { energy: 100 },
);
if (
  spawnStore.getUsedCapacity("energy") !== 100
  || spawnStore.getFreeCapacity("energy") !== 200
  || spawnStore.getCapacity("energy") !== 300
) {
  failures.push("Energy-only limited Store case failed");
}
if (
  spawnStore.getUsedCapacity("power") !== null
  || spawnStore.getFreeCapacity("power") !== null
  || spawnStore.getCapacity("power") !== null
) {
  failures.push("Unsupported limited Store resource did not return null");
}

const labStore = limitedStore(
  { energy: 2000, UO: 3000 },
  { energy: 800, UO: 1200 },
);
if (
  labStore.getFreeCapacity("energy") !== 1200
  || labStore.getFreeCapacity("UO") !== 1800
) {
  failures.push("Lab independent resource capacities failed");
}

function readOnlyStore(contents) {
  return {
    getUsedCapacity(resource) {
      if (resource === undefined) {
        return Object.values(contents)
          .reduce((sum, value) => sum + value, 0);
      }
      return contents[resource] ?? 0;
    },
    getCapacity() {
      return null;
    },
    getFreeCapacity() {
      return null;
    },
  };
}

const tombstone = readOnlyStore({
  energy: 1000,
  H: 200,
});
if (
  tombstone.getUsedCapacity() !== 1200
  || tombstone.getUsedCapacity("energy") !== 1000
  || tombstone.getCapacity("energy") !== null
  || tombstone.getFreeCapacity("energy") !== null
) {
  failures.push("Read-only Tombstone Store case failed");
}

function classifyFreeCapacity(value) {
  if (value === null) return "capacity-not-applicable";
  if (value === 0) return "store-full";
  if (Number.isFinite(value) && value > 0) return "space-available";
  return "unexpected-capacity-value";
}
for (const [input, expected] of [
  [null, "capacity-not-applicable"],
  [0, "store-full"],
  [200, "space-available"],
]) {
  if (classifyFreeCapacity(input) !== expected) {
    failures.push(`Free-capacity classification failed for ${expected}`);
  }
}

function safeWithdraw(available, free, requested = Infinity) {
  if (available === null || free === null) return 0;
  return Math.min(
    available,
    free,
    Number.isFinite(requested)
      ? Math.max(0, requested)
      : Infinity,
  );
}
if (
  safeWithdraw(1000, 50) !== 50
  || safeWithdraw(20, 50) !== 20
  || safeWithdraw(100, 100, 30) !== 30
  || safeWithdraw(null, 100) !== 0
) {
  failures.push("Safe withdraw amount cases failed");
}

function safeTransfer(carried, free, requested = Infinity) {
  if (carried === null || free === null) return 0;
  return Math.min(
    carried,
    free,
    Number.isFinite(requested)
      ? Math.max(0, requested)
      : Infinity,
  );
}
if (
  safeTransfer(100, 20) !== 20
  || safeTransfer(20, 100) !== 20
  || safeTransfer(100, 100, 35) !== 35
  || safeTransfer(100, null) !== 0
) {
  failures.push("Safe transfer amount cases failed");
}

function verifyTransfer(before, after, amount) {
  const sourceDelta = before.source - after.source;
  const targetDelta = after.target - before.target;

  if (sourceDelta === amount && targetDelta === amount) {
    return "transfer-observed";
  }
  if (sourceDelta === 0 && targetDelta === 0) {
    return "no-store-change-observed";
  }
  return "partial-or-competing-change";
}
for (const [before, after, amount, expected] of [
  [{ source: 100, target: 20 }, { source: 70, target: 50 }, 30, "transfer-observed"],
  [{ source: 100, target: 20 }, { source: 100, target: 20 }, 30, "no-store-change-observed"],
  [{ source: 100, target: 20 }, { source: 80, target: 60 }, 30, "partial-or-competing-change"],
]) {
  if (verifyTransfer(before, after, amount) !== expected) {
    failures.push(`Later Store delta case failed for ${expected}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nStore capacity simulation failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  `Store capacity simulation passed: ${chineseBlocks.length} Chinese and ${englishBlocks.length} English JavaScript blocks, registry and knowledge integration, general shared capacity, limited resource compatibility, Lab channels, read-only Stores, null versus zero, safe action amounts, and later Store-delta states.`,
);
