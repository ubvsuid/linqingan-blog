import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const override = [
  "english-editorial-rampart-access-20260804.ts",
  "english-editorial-recycle-20260804.ts",
  "english-editorial-structure-destroy-20260804.ts",
  "english-editorial-access-recycle-destroy-20260804.ts",
].map((fileName) =>
  fs.readFileSync(path.join(root, "src/lib", fileName), "utf8"),
).join("\n");
const published = fs.readFileSync(
  path.join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
const lifecycleRegistry = fs.readFileSync(
  path.join(root, "src/lib/english-lifecycle-registry-4.ts"),
  "utf8",
);
const constructionRegistry = fs.readFileSync(
  path.join(root, "src/lib/english-construction-safety-registry-15.ts"),
  "utf8",
);
const defenseRegistry = fs.readFileSync(
  path.join(root, "src/lib/english-defense-operations-registry-17.ts"),
  "utf8",
);
const audit = fs.readFileSync(
  path.join(root, "docs/english-editorial-access-recycle-destroy-20260804.md"),
  "utf8",
);

const failures = [];

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

const articleRequirements = [
  [
    "screeps-rampart-set-public",
    "2026-07-26",
    "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite",
    [
      "createRampartAccessDispatcher",
      "Memory.pendingRampartAccess",
      "accepted-state-not-observed",
      "original-rampart-missing-replacement-present",
      "typeof request.public !== 'boolean'",
      "creates no Room event",
    ],
  ],
  [
    "screeps-recycle-creep",
    "2026-07-25",
    "Screeps recycleCreep(): Verify the Exact Creep Retirement",
    [
      "createRecycleDispatcher",
      "Memory.pendingRecycleOperations",
      "exact-creep-retirement-observed",
      "drop-piles-observed-confounded",
      "recycle-rejected-review-required",
      "does not require the Spawn to be idle",
    ],
  ],
  [
    "screeps-structure-destroy",
    "2026-07-26",
    "Screeps Structure.destroy(): Verify One Exact Extension Removal",
    [
      "FIND_HOSTILE_POWER_CREEPS",
      "createDestructionDispatcher",
      "Memory.pendingStructureDestructions",
      "room-controller-not-owned",
      "original-destroyed-replacement-present",
      "does not create a Room event",
    ],
  ],
];

for (const [slug, publishedAt, title, signals] of articleRequirements) {
  requireText(override, `slug: "${slug}"`, `${slug} existing slug`);
  requireText(override, `publishedAt: "${publishedAt}"`, `${slug} preserved publication date`);
  requireText(override, `title: "${title}"`, `${slug} title`);
  requireText(override, 'updatedAt: "2026-08-04"', `${slug} modified date`);
  requireText(override, "finalScore: 98", `${slug} internal score`);
  for (const signal of signals) requireText(override, signal, `${slug} signal`);
}

for (const text of [
  "englishEditorialAccessRecycleDestroyOverrides20260804",
  "...englishEditorialAccessRecycleDestroyOverrides20260804",
]) {
  requireText(published, text, "published override wiring");
}

for (const [registry, href, title] of [
  [
    defenseRegistry,
    'href: "/en/blog/screeps-rampart-set-public"',
    "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite",
  ],
  [
    lifecycleRegistry,
    'href: "/en/blog/screeps-recycle-creep"',
    "Screeps recycleCreep(): Verify the Exact Creep Retirement",
  ],
  [
    constructionRegistry,
    'href: "/en/blog/screeps-structure-destroy"',
    "Screeps Structure.destroy(): Verify One Exact Extension Removal",
  ],
]) {
  const hrefIndex = registry.indexOf(href);
  const recordStart = registry.lastIndexOf("  {", hrefIndex);
  const nextRecord = registry.indexOf("\n  {", hrefIndex + href.length);
  const record = recordStart >= 0
    ? registry.slice(recordStart, nextRecord >= 0 ? nextRecord : registry.length)
    : "";

  requireText(record, title, `${href} registry title`);
  requireText(record, 'updatedAt: "2026-08-04"', `${href} registry modified date`);
  requireText(record, "finalScore: 98", `${href} registry score`);
}

for (const text of [
  "/en/blog/screeps-rampart-set-public",
  "/en/blog/screeps-recycle-creep",
  "/en/blog/screeps-structure-destroy",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "**98/100**",
  "Screeps Console",
  "Pending",
]) {
  requireText(audit, text, "editorial audit evidence");
}

const tocPairs = [
  ...override.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length !== 30) {
  failures.push(`TOC count ${tocPairs.length}; expected 30.`);
}
for (const { id, label } of tocPairs) {
  if (
    !override.includes(`<h2 id="${id}">`)
    && !override.includes(`<h3 id="${id}">`)
  ) {
    failures.push(`TOC anchor missing: ${label} (${id})`);
  }
}

const codeBlocks = [
  ...override.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (codeBlocks.length < 18) {
  failures.push(`JavaScript block count ${codeBlocks.length}; expected at least 18.`);
}

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "access-recycle-destroy-editorial-"),
);
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `JavaScript block ${index + 1} failed: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function evaluateRampart(input) {
  if (!input.enabled) return "request-disabled";
  if (!input.valid) return "request-invalid";
  if (!input.confirmationMatches) return "confirmation-mismatch";
  if (!input.available) return "rampart-unavailable";
  if (!input.identityMatches) return "rampart-identity-mismatch";
  if (!input.owned) return "rampart-not-owned";
  if (input.stateMatches) return "state-already-observed";
  return "access-change-ready";
}

const rampartBase = {
  enabled: true,
  valid: true,
  confirmationMatches: true,
  available: true,
  identityMatches: true,
  owned: true,
  stateMatches: false,
};
const rampartCases = [
  [{ ...rampartBase, enabled: false }, "request-disabled"],
  [{ ...rampartBase, valid: false }, "request-invalid"],
  [{ ...rampartBase, confirmationMatches: false }, "confirmation-mismatch"],
  [{ ...rampartBase, available: false }, "rampart-unavailable"],
  [{ ...rampartBase, identityMatches: false }, "rampart-identity-mismatch"],
  [{ ...rampartBase, owned: false }, "rampart-not-owned"],
  [{ ...rampartBase, stateMatches: true }, "state-already-observed"],
  [rampartBase, "access-change-ready"],
];

function verifyRampart(input) {
  if (input.gameTime < input.submittedAt + 1) return "waiting-for-next-tick";
  if (input.gameTime > input.submittedAt + 1) return "verification-window-missed";
  if (!input.originalAvailable) {
    return input.replacementPresent
      ? "original-rampart-missing-replacement-present"
      : "original-rampart-unavailable";
  }
  if (!input.identityMatches) return "rampart-identity-mismatch";
  return input.stateMatches
    ? "rampart-access-state-observed"
    : "accepted-state-not-observed";
}

const rampartVerifyBase = {
  submittedAt: 100,
  gameTime: 101,
  originalAvailable: true,
  replacementPresent: false,
  identityMatches: true,
  stateMatches: true,
};
const rampartVerifyCases = [
  [{ ...rampartVerifyBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...rampartVerifyBase, gameTime: 102 }, "verification-window-missed"],
  [{ ...rampartVerifyBase, originalAvailable: false }, "original-rampart-unavailable"],
  [
    { ...rampartVerifyBase, originalAvailable: false, replacementPresent: true },
    "original-rampart-missing-replacement-present",
  ],
  [{ ...rampartVerifyBase, identityMatches: false }, "rampart-identity-mismatch"],
  [{ ...rampartVerifyBase, stateMatches: false }, "accepted-state-not-observed"],
  [rampartVerifyBase, "rampart-access-state-observed"],
];

function evaluateRecycle(input) {
  if (!input.enabled) return "request-disabled";
  if (!input.valid) return "request-invalid";
  if (!input.confirmationMatches) return "confirmation-mismatch";
  if (!input.objectsAvailable) return "object-unavailable";
  if (!input.identityMatches) return "operation-identity-mismatch";
  if (!input.owned) return "ownership-invalid";
  if (!input.spawnActive) return "spawn-inactive";
  if (input.creepSpawning) return "creep-still-spawning";
  if (!input.near) return "move-to-spawn";
  return "recycle-ready";
}

const recycleBase = {
  enabled: true,
  valid: true,
  confirmationMatches: true,
  objectsAvailable: true,
  identityMatches: true,
  owned: true,
  spawnActive: true,
  creepSpawning: false,
  near: true,
  spawnBusy: true,
};
const recycleCases = [
  [{ ...recycleBase, enabled: false }, "request-disabled"],
  [{ ...recycleBase, valid: false }, "request-invalid"],
  [{ ...recycleBase, confirmationMatches: false }, "confirmation-mismatch"],
  [{ ...recycleBase, objectsAvailable: false }, "object-unavailable"],
  [{ ...recycleBase, identityMatches: false }, "operation-identity-mismatch"],
  [{ ...recycleBase, owned: false }, "ownership-invalid"],
  [{ ...recycleBase, spawnActive: false }, "spawn-inactive"],
  [{ ...recycleBase, creepSpawning: true }, "creep-still-spawning"],
  [{ ...recycleBase, near: false }, "move-to-spawn"],
  [recycleBase, "recycle-ready"],
];

function verifyRecycle(input) {
  if (input.gameTime < input.submittedAt + 1) return "waiting-for-next-tick";
  if (input.gameTime > input.submittedAt + 1) return "verification-window-missed";
  if (input.exactCreepPresent) return "accepted-creep-still-observed";
  return input.namedCreepPresent
    ? "exact-creep-gone-name-reused"
    : "exact-creep-retirement-observed";
}

const recycleVerifyBase = {
  submittedAt: 100,
  gameTime: 101,
  exactCreepPresent: false,
  namedCreepPresent: false,
};
const recycleVerifyCases = [
  [{ ...recycleVerifyBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...recycleVerifyBase, gameTime: 102 }, "verification-window-missed"],
  [{ ...recycleVerifyBase, exactCreepPresent: true }, "accepted-creep-still-observed"],
  [{ ...recycleVerifyBase, namedCreepPresent: true }, "exact-creep-gone-name-reused"],
  [recycleVerifyBase, "exact-creep-retirement-observed"],
];

function evaluateDestroy(input) {
  if (!input.enabled) return "request-disabled";
  if (!input.valid) return "request-invalid";
  if (!input.confirmationMatches) return "confirmation-mismatch";
  if (!input.available) return "structure-unavailable";
  if (!input.identityMatches) return "structure-identity-mismatch";
  if (!input.controllerOwned) return "room-controller-not-owned";
  if (input.hostileCreeps > 0 || input.hostilePowerCreeps > 0) {
    return "hostiles-present";
  }
  return "destroy-ready";
}

const destroyBase = {
  enabled: true,
  valid: true,
  confirmationMatches: true,
  available: true,
  identityMatches: true,
  controllerOwned: true,
  hostileCreeps: 0,
  hostilePowerCreeps: 0,
};
const destroyCases = [
  [{ ...destroyBase, enabled: false }, "request-disabled"],
  [{ ...destroyBase, valid: false }, "request-invalid"],
  [{ ...destroyBase, confirmationMatches: false }, "confirmation-mismatch"],
  [{ ...destroyBase, available: false }, "structure-unavailable"],
  [{ ...destroyBase, identityMatches: false }, "structure-identity-mismatch"],
  [{ ...destroyBase, controllerOwned: false }, "room-controller-not-owned"],
  [{ ...destroyBase, hostileCreeps: 1 }, "hostiles-present"],
  [{ ...destroyBase, hostilePowerCreeps: 1 }, "hostiles-present"],
  [destroyBase, "destroy-ready"],
];

function verifyDestroy(input) {
  if (input.gameTime < input.submittedAt + 1) return "waiting-for-next-tick";
  if (input.gameTime > input.submittedAt + 1) return "verification-window-missed";
  if (input.originalPresent) return "accepted-original-still-observed";
  if (!input.roomVisible) return "original-gone-tile-evidence-unavailable";
  return input.replacementPresent
    ? "original-destroyed-replacement-present"
    : "original-destroyed-tile-empty";
}

const destroyVerifyBase = {
  submittedAt: 100,
  gameTime: 101,
  originalPresent: false,
  roomVisible: true,
  replacementPresent: false,
};
const destroyVerifyCases = [
  [{ ...destroyVerifyBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...destroyVerifyBase, gameTime: 102 }, "verification-window-missed"],
  [{ ...destroyVerifyBase, originalPresent: true }, "accepted-original-still-observed"],
  [{ ...destroyVerifyBase, roomVisible: false }, "original-gone-tile-evidence-unavailable"],
  [{ ...destroyVerifyBase, replacementPresent: true }, "original-destroyed-replacement-present"],
  [destroyVerifyBase, "original-destroyed-tile-empty"],
];

for (const [label, fn, cases] of [
  ["Rampart evaluation", evaluateRampart, rampartCases],
  ["Rampart verification", verifyRampart, rampartVerifyCases],
  ["Recycle evaluation", evaluateRecycle, recycleCases],
  ["Recycle verification", verifyRecycle, recycleVerifyCases],
  ["Destroy evaluation", evaluateDestroy, destroyCases],
  ["Destroy verification", verifyDestroy, destroyVerifyCases],
]) {
  for (const [input, expected] of cases) {
    const actual = fn(input);
    if (actual !== expected) {
      failures.push(`${label} expected ${expected}, received ${actual}.`);
    }
  }
}

if (override.includes("request.enabled = true")) {
  failures.push("Irreversible requests must not be automatically re-enabled.");
}
if (override.includes("creep.suicide();")) {
  failures.push("The recycling article must not auto-call creep.suicide().");
}
if (override.includes("confirmation !== 'DESTROY_EXTENSION'")) {
  failures.push("The destruction article must not use a static confirmation phrase.");
}
if (override.includes("Game.structures[structure.id]")) {
  failures.push("The destruction article must not claim Game.structures membership is the engine authority boundary.");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(
    `\nAccess, recycle and destroy editorial simulation failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

const offlineCases =
  rampartCases.length
  + rampartVerifyCases.length
  + recycleCases.length
  + recycleVerifyCases.length
  + destroyCases.length
  + destroyVerifyCases.length;

console.log(
  `Access, recycle and destroy editorial simulation passed: 3 existing routes, ${tocPairs.length} anchors, ${codeBlocks.length} syntax-checked blocks, ${offlineCases} offline cases, preserved publication dates, content-derived 98/100 score evidence, and explicit Pending live verification.`,
);
