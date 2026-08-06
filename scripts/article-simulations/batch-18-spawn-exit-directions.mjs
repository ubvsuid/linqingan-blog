import { execFileSync } from "node:child_process";
import {
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const chinesePath = join(
  root,
  "content/posts/screeps-spawn-exit-blocked-directions.md",
);
const englishPath = join(
  root,
  "src/app/(en)/en/blog/screeps-spawn-exit-blocked-directions/page.tsx",
);
const chinese = readFileSync(chinesePath, "utf8");
const english = readFileSync(englishPath, "utf8");

const failures = [];
let assertions = 0;

function assert(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

for (const required of [
  "spawnCreep()",
  "directions",
  "setDirections()",
  "stable-obstacle",
  "temporarily-occupied",
  "completion-retry-observed",
  "completion-unverified",
  "Screeps Console",
]) {
  assert(
    chinese.includes(required),
    `Chinese article is missing required boundary: ${required}`,
  );
  assert(
    english.includes(required),
    `English article is missing required boundary: ${required}`,
  );
}

for (const forbidden of [
  "Console test passed",
  "official-shard verification passed",
  "出生成功</code>",
]) {
  assert(
    !chinese.includes(forbidden),
    `Chinese article contains fabricated evidence: ${forbidden}`,
  );
  assert(
    !english.includes(forbidden),
    `English article contains fabricated evidence: ${forbidden}`,
  );
}

function decodeHtml(code) {
  return code
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

const chineseBlocks = [
  ...chinese.matchAll(/```js\n([\s\S]*?)```/g),
].map((match) => match[1]);
const englishBlocks = [
  ...english.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => decodeHtml(match[1]));
const codeBlocks = [...chineseBlocks, ...englishBlocks];

assert(
  chineseBlocks.length >= 6,
  `Expected at least 6 Chinese JavaScript blocks, received ${chineseBlocks.length}`,
);
assert(
  englishBlocks.length >= 6,
  `Expected at least 6 English JavaScript blocks, received ${englishBlocks.length}`,
);

for (const [index, code] of codeBlocks.entries()) {
  const temporaryPath = join(
    tmpdir(),
    `spawn-exit-directions-${index + 1}.js`,
  );
  writeFileSync(temporaryPath, code);
  try {
    execFileSync(process.execPath, ["--check", temporaryPath], {
      stdio: "pipe",
    });
  } catch (error) {
    failures.push(
      `JavaScript block ${index + 1} failed node --check: ${error.message}`,
    );
  } finally {
    unlinkSync(temporaryPath);
  }
}

const modelSource = `
const TOP = 1;
const TOP_RIGHT = 2;
const RIGHT = 3;
const BOTTOM_RIGHT = 4;
const BOTTOM = 5;
const BOTTOM_LEFT = 6;
const LEFT = 7;
const TOP_LEFT = 8;
const ALL_SPAWN_DIRECTIONS = [
  TOP,
  TOP_RIGHT,
  RIGHT,
  BOTTOM_RIGHT,
  BOTTOM,
  BOTTOM_LEFT,
  LEFT,
  TOP_LEFT
];

function normalizeSpawnDirections(input) {
  const preferred = Array.isArray(input) ? input : [];
  const valid = [];
  const seen = new Set();

  for (const direction of preferred) {
    if (
      Number.isInteger(direction)
      && direction >= TOP
      && direction <= TOP_LEFT
      && !seen.has(direction)
    ) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  for (const direction of ALL_SPAWN_DIRECTIONS) {
    if (!seen.has(direction)) {
      seen.add(direction);
      valid.push(direction);
    }
  }

  return valid;
}

function planFromSnapshots(
  snapshots,
  preferredDirections
) {
  const byDirection = new Map(
    snapshots.map(item => [item.direction, item])
  );
  const ordered = normalizeSpawnDirections(
    preferredDirections
  ).map(direction =>
    byDirection.get(direction) ?? {
      direction,
      stablePassable: false,
      currentlyOpen: false,
      status: 'not-observed'
    }
  );

  const stable = ordered.filter(
    item => item.stablePassable
  );
  const open = stable.filter(
    item => item.currentlyOpen
  );
  const occupied = stable.filter(
    item => !item.currentlyOpen
  );

  return {
    status: stable.length === 0
      ? 'no-stable-exit'
      : open.length === 0
        ? 'temporary-occupancy-only'
        : 'exit-plan-ready',
    directions: [
      ...open,
      ...occupied
    ].map(item => item.direction)
  };
}

function observeModel({
  record,
  spawn,
  creep
}) {
  if (!record) {
    return {
      status: 'spawn-exit-record-missing'
    };
  }

  if (
    spawn?.spawning
    && spawn.spawning.name === record.name
  ) {
    const nearComplete =
      spawn.spawning.remainingTime <= 1;
    const nearCompleteTicks = nearComplete
      ? (record.nearCompleteTicks ?? 0) + 1
      : 0;

    return {
      status: nearCompleteTicks >= 2
        ? 'completion-retry-observed'
        : 'still-spawning',
      nearCompleteTicks
    };
  }

  if (creep?.spawning) {
    return {
      status: 'creep-still-inside-spawn'
    };
  }

  if (creep && spawn) {
    const dx = creep.x - spawn.x;
    const dy = creep.y - spawn.y;
    const offsets = new Map([
      ['0,-1', TOP],
      ['1,-1', TOP_RIGHT],
      ['1,0', RIGHT],
      ['1,1', BOTTOM_RIGHT],
      ['0,1', BOTTOM],
      ['-1,1', BOTTOM_LEFT],
      ['-1,0', LEFT],
      ['-1,-1', TOP_LEFT]
    ]);
    const direction = offsets.get(
      [dx, dy].join(',')
    );

    return {
      status: direction
        ? 'born-on-observable-adjacent-tile'
        : 'born-but-exit-direction-missed',
      direction: direction ?? null,
      wasPlanned: direction
        ? record.directions.includes(direction)
        : null
    };
  }

  if (creep && !spawn) {
    return {
      status: 'born-but-spawn-missing',
      direction: null,
      wasPlanned: null
    };
  }

  return {
    status: 'completion-unverified'
  };
}
`;

const context = vm.createContext({ Map, Set, Number });
vm.runInContext(modelSource, context);

function run(expression) {
  return vm.runInContext(expression, context);
}

const normalized = run(
  "normalizeSpawnDirections([3, 3, 9, 2.5, 1])",
);
assert(
  JSON.stringify(normalized) ===
    JSON.stringify([3, 1, 2, 4, 5, 6, 7, 8]),
  "Direction normalization did not deduplicate, reject invalid values, or append fallbacks",
);

const defaultOrder = run(
  "normalizeSpawnDirections(null)",
);
assert(
  JSON.stringify(defaultOrder) ===
    JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]),
  "Missing direction input did not use the default order",
);

context.snapshots = [
  {
    direction: 1,
    stablePassable: false,
    currentlyOpen: false,
    status: "stable-obstacle",
  },
  {
    direction: 2,
    stablePassable: true,
    currentlyOpen: false,
    status: "temporarily-occupied",
  },
  {
    direction: 3,
    stablePassable: true,
    currentlyOpen: true,
    status: "open-now",
  },
  {
    direction: 4,
    stablePassable: true,
    currentlyOpen: true,
    status: "open-now",
  },
];

const readyPlan = run(
  "planFromSnapshots(snapshots, [2, 4, 3, 1])",
);
assert(
  readyPlan.status === "exit-plan-ready",
  "Open stable directions did not produce an exit plan",
);
assert(
  JSON.stringify(readyPlan.directions) ===
    JSON.stringify([4, 3, 2]),
  "Open directions were not ordered before temporary occupancy while preserving preference",
);
assert(
  !readyPlan.directions.includes(1),
  "A stable obstacle direction was retained",
);

context.snapshots = [
  {
    direction: 7,
    stablePassable: true,
    currentlyOpen: false,
  },
  {
    direction: 8,
    stablePassable: true,
    currentlyOpen: false,
  },
];

const occupiedPlan = run(
  "planFromSnapshots(snapshots, [8, 7])",
);
assert(
  occupiedPlan.status === "temporary-occupancy-only",
  "Temporary-only exits did not remain distinguishable",
);
assert(
  JSON.stringify(occupiedPlan.directions) ===
    JSON.stringify([8, 7]),
  "Temporary-only directions did not preserve preference order",
);

context.snapshots = [
  {
    direction: 1,
    stablePassable: false,
    currentlyOpen: false,
  },
];

const blockedPlan = run(
  "planFromSnapshots(snapshots, [1])",
);
assert(
  blockedPlan.status === "no-stable-exit",
  "Stable blockage did not produce the no-exit state",
);
assert(
  blockedPlan.directions.length === 0,
  "No-stable-exit state retained a direction",
);

context.record = {
  name: "Worker42",
  directions: [3, 5],
  nearCompleteTicks: 0,
};
context.spawn = {
  x: 10,
  y: 10,
  spawning: {
    name: "Worker42",
    remainingTime: 5,
  },
};
context.creep = null;

const spawning = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  spawning.status === "still-spawning",
  "Ordinary spawning state was misclassified",
);
assert(
  spawning.nearCompleteTicks === 0,
  "Ordinary spawning state retained a near-complete streak",
);

context.spawn.spawning.remainingTime = 1;
context.record.nearCompleteTicks = 0;
const firstNearComplete = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  firstNearComplete.status === "still-spawning",
  "One near-complete observation was overclaimed as a retry",
);
assert(
  firstNearComplete.nearCompleteTicks === 1,
  "First near-complete observation did not increment the streak",
);

context.record.nearCompleteTicks = 1;
const retry = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  retry.status === "completion-retry-observed",
  "Two near-complete observations did not expose the retry state",
);
assert(
  retry.nearCompleteTicks === 2,
  "Retry state did not preserve the near-complete count",
);

context.spawn.spawning = null;
context.creep = {
  spawning: true,
  x: 10,
  y: 10,
};
const inside = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  inside.status === "creep-still-inside-spawn",
  "Creep spawning state was not preserved",
);

context.creep = {
  spawning: false,
  x: 11,
  y: 10,
};
const bornRight = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  bornRight.status ===
    "born-on-observable-adjacent-tile",
  "Adjacent birth was not recognized",
);
assert(
  bornRight.direction === 3,
  "RIGHT birth direction was not derived",
);
assert(
  bornRight.wasPlanned === true,
  "Planned birth direction was not matched",
);

context.creep = {
  spawning: false,
  x: 10,
  y: 9,
};
const bornUnplanned = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  bornUnplanned.direction === 1,
  "TOP birth direction was not derived",
);
assert(
  bornUnplanned.wasPlanned === false,
  "Unplanned observable direction was not exposed",
);

context.creep = {
  spawning: false,
  x: 14,
  y: 10,
};
const missed = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  missed.status ===
    "born-but-exit-direction-missed",
  "A later non-adjacent position was treated as a birth direction",
);
assert(
  missed.direction === null,
  "Missed birth direction returned an invented direction",
);

context.spawn = null;
const missingSpawn = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  missingSpawn.status === "born-but-spawn-missing",
  "A born Creep with a missing Spawn was not preserved safely",
);

context.creep = null;
const unverified = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  unverified.status === "completion-unverified",
  "Missing spawn process and Creep did not remain unverified",
);

context.record = null;
const missingRecord = run(
  "observeModel({ record, spawn, creep })",
);
assert(
  missingRecord.status ===
    "spawn-exit-record-missing",
  "Missing observation record was not exposed",
);

assert(
  english.includes("canonical: path"),
  "English page is missing the canonical declaration",
);
assert(
  english.includes('"zh-CN": chinesePath'),
  "English page is missing the Chinese hreflang mapping",
);
assert(
  english.includes("dateModified: modifiedTime"),
  "English page is missing dateModified",
);
assert(
  english.includes('value: "Pending"'),
  "English page does not keep live evidence Pending",
);

if (failures.length > 0) {
  console.error(
    `Spawn exit direction simulation failed with ${failures.length} issue(s):`,
  );
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Spawn exit direction simulations passed: ${assertions} assertions, ${codeBlocks.length} JavaScript blocks.`,
);
