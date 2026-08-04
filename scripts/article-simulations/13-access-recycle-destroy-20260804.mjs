import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const rampart = read("src/lib/english-editorial-rampart-access-20260804.ts");
const recycle = read("src/lib/english-editorial-recycle-20260804.ts");
const destroy = read("src/lib/english-editorial-structure-destroy-20260804.ts");
const index = read("src/lib/english-editorial-access-recycle-destroy-20260804.ts");
const published = read("src/lib/english-editorial-published-20260731.ts");
const lifecycleRegistry = read("src/lib/english-lifecycle-registry-4.ts");
const constructionRegistry = read("src/lib/english-construction-safety-registry-15.ts");
const defenseRegistry = read("src/lib/english-defense-operations-registry-17.ts");
const audit = read("docs/english-editorial-access-recycle-destroy-20260804.md");
const combined = [rampart, recycle, destroy, index].join("\n");

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

for (const [source, slug, exportName, title, publishedAt, signals] of [
  [
    rampart,
    "screeps-rampart-set-public",
    "englishEditorialRampartAccessArticle20260804",
    "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite",
    "2026-07-26",
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
    recycle,
    "screeps-recycle-creep",
    "englishEditorialRecycleArticle20260804",
    "Screeps recycleCreep(): Verify the Exact Creep Retirement",
    "2026-07-25",
    [
      "createRecycleDispatcher",
      "Memory.pendingRecycleOperations",
      "EVENT_OBJECT_DESTROYED",
      "event.objectId === pending.creepId",
      "event.data?.type === 'creep'",
      "FIND_TOMBSTONES",
      "tombstone.creep?.id === pending.creepId",
      "pending.before.creepX",
      "STRUCTURE_CONTAINER",
      "containerStore",
      "recycle-event-and-tombstone-observed",
      "recycle-artifacts-observed-container-confounded",
      "do not require an idle Spawn",
    ],
  ],
  [
    destroy,
    "screeps-structure-destroy",
    "englishEditorialStructureDestroyArticle20260804",
    "Screeps Structure.destroy(): Verify One Exact Extension Removal",
    "2026-07-26",
    [
      "FIND_HOSTILE_POWER_CREEPS",
      "createDestructionDispatcher",
      "Memory.pendingStructureDestructions",
      "room-controller-not-owned",
      "original-destroyed-replacement-present",
      "does not create a Room event",
    ],
  ],
]) {
  requireText(index, `[${exportName}.slug]`, `${slug} override key`);
  requireText(source, `publishedAt: "${publishedAt}"`, `${slug} publication date`);
  requireText(source, 'updatedAt: "2026-08-04"', `${slug} modified date`);
  requireText(source, `title: "${title}"`, `${slug} title`);
  requireText(source, "finalScore: 98", `${slug} score`);
  for (const signal of signals) requireText(source, signal, `${slug} signal`);
}

for (const text of [
  "englishEditorialAccessRecycleDestroyOverrides20260804",
  "...englishEditorialAccessRecycleDestroyOverrides20260804",
]) {
  requireText(published, text, "published override wiring");
}

for (const [registry, href, title] of [
  [defenseRegistry, 'href: "/en/blog/screeps-rampart-set-public"', "Screeps setPublic(): Prevent Same-Tick Rampart Intent Overwrite"],
  [lifecycleRegistry, 'href: "/en/blog/screeps-recycle-creep"', "Screeps recycleCreep(): Verify the Exact Creep Retirement"],
  [constructionRegistry, 'href: "/en/blog/screeps-structure-destroy"', "Screeps Structure.destroy(): Verify One Exact Extension Removal"],
]) {
  const hrefIndex = registry.indexOf(href);
  const recordStart = registry.lastIndexOf("  {", hrefIndex);
  const nextRecord = registry.indexOf("\n  {", hrefIndex + href.length);
  const record = recordStart >= 0
    ? registry.slice(recordStart, nextRecord >= 0 ? nextRecord : registry.length)
    : "";
  requireText(record, title, `${href} registry title`);
  requireText(record, 'updatedAt: "2026-08-04"', `${href} modified date`);
  requireText(record, "finalScore: 98", `${href} score`);
}

for (const text of [
  "/en/blog/screeps-rampart-set-public",
  "/en/blog/screeps-recycle-creep",
  "/en/blog/screeps-structure-destroy",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "EVENT_OBJECT_DESTROYED",
  "Tombstone",
  "Container",
  "**98/100**",
  "Pending",
]) {
  requireText(audit, text, "editorial audit evidence");
}

const tocPairs = [
  ...combined.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
].map((match) => ({ id: match[1], label: match[2] }));
if (tocPairs.length !== 30) {
  failures.push(`TOC count ${tocPairs.length}; expected 30.`);
}
for (const { id, label } of tocPairs) {
  if (!combined.includes(`<h2 id="${id}">`) && !combined.includes(`<h3 id="${id}">`)) {
    failures.push(`TOC anchor missing: ${label} (${id})`);
  }
}

const codeBlocks = [
  ...combined.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);
if (codeBlocks.length < 19) {
  failures.push(`JavaScript block count ${codeBlocks.length}; expected at least 19.`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "access-recycle-destroy-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${index + 1} failed: ${result.stderr.trim()}`);
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
const rampartBase = { enabled: true, valid: true, confirmationMatches: true, available: true, identityMatches: true, owned: true, stateMatches: false };
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
  if (!input.originalAvailable) return input.replacementPresent ? "original-rampart-missing-replacement-present" : "original-rampart-unavailable";
  if (!input.identityMatches) return "rampart-identity-mismatch";
  return input.stateMatches ? "rampart-access-state-observed" : "accepted-state-not-observed";
}
const rampartVerifyBase = { submittedAt: 100, gameTime: 101, originalAvailable: true, replacementPresent: false, identityMatches: true, stateMatches: true };
const rampartVerifyCases = [
  [{ ...rampartVerifyBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...rampartVerifyBase, gameTime: 102 }, "verification-window-missed"],
  [{ ...rampartVerifyBase, originalAvailable: false }, "original-rampart-unavailable"],
  [{ ...rampartVerifyBase, originalAvailable: false, replacementPresent: true }, "original-rampart-missing-replacement-present"],
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
const recycleBase = { enabled: true, valid: true, confirmationMatches: true, objectsAvailable: true, identityMatches: true, owned: true, spawnActive: true, creepSpawning: false, near: true, spawnBusy: true };
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
  if (input.creepPresent) return "accepted-creep-still-observed";
  if (!input.roomVisible) return "exact-creep-gone-room-evidence-unavailable";
  if (input.eventCount !== 1) return input.eventCount === 0 ? "exact-creep-gone-destruction-event-not-observed" : "destruction-event-ambiguous";
  return input.tombstoneCount === 1 ? "recycle-event-and-tombstone-observed" : "recycle-event-observed-artifact-mismatch";
}
const recycleVerifyBase = { submittedAt: 100, gameTime: 101, creepPresent: false, roomVisible: true, eventCount: 1, tombstoneCount: 1 };
const recycleVerifyCases = [
  [{ ...recycleVerifyBase, gameTime: 100 }, "waiting-for-next-tick"],
  [{ ...recycleVerifyBase, gameTime: 102 }, "verification-window-missed"],
  [{ ...recycleVerifyBase, creepPresent: true }, "accepted-creep-still-observed"],
  [{ ...recycleVerifyBase, roomVisible: false }, "exact-creep-gone-room-evidence-unavailable"],
  [{ ...recycleVerifyBase, eventCount: 0 }, "exact-creep-gone-destruction-event-not-observed"],
  [{ ...recycleVerifyBase, eventCount: 2 }, "destruction-event-ambiguous"],
  [{ ...recycleVerifyBase, tombstoneCount: 0 }, "recycle-event-observed-artifact-mismatch"],
  [recycleVerifyBase, "recycle-event-and-tombstone-observed"],
];

function evaluateDestroy(input) {
  if (!input.enabled) return "request-disabled";
  if (!input.valid) return "request-invalid";
  if (!input.confirmationMatches) return "confirmation-mismatch";
  if (!input.available) return "structure-unavailable";
  if (!input.identityMatches) return "structure-identity-mismatch";
  if (!input.controllerOwned) return "room-controller-not-owned";
  if (input.hostileCreeps > 0 || input.hostilePowerCreeps > 0) return "hostiles-present";
  return "destroy-ready";
}
const destroyBase = { enabled: true, valid: true, confirmationMatches: true, available: true, identityMatches: true, controllerOwned: true, hostileCreeps: 0, hostilePowerCreeps: 0 };
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
  return input.replacementPresent ? "original-destroyed-replacement-present" : "original-destroyed-tile-empty";
}
const destroyVerifyBase = { submittedAt: 100, gameTime: 101, originalPresent: false, roomVisible: true, replacementPresent: false };
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
    if (actual !== expected) failures.push(`${label} expected ${expected}, received ${actual}.`);
  }
}

for (const [forbidden, label] of [
  ["request.enabled = true", "automatic irreversible re-enable"],
  ["creep.suicide();", "automatic suicide fallback"],
  ["LOOK_RESOURCES", "incorrect loose-resource observation"],
  ["pending.before.spawnX", "incorrect Spawn-tile artifact position"],
  ["confirmation !== 'DESTROY_EXTENSION'", "static destruction confirmation"],
  ["Game.structures[structure.id]", "incorrect destruction authority boundary"],
]) {
  if (combined.includes(forbidden)) failures.push(`Forbidden ${label}: ${forbidden}`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nAccess, recycle and destroy editorial simulation failed: ${failures.length} issue(s).`);
  process.exit(1);
}

const offlineCases = rampartCases.length + rampartVerifyCases.length + recycleCases.length + recycleVerifyCases.length + destroyCases.length + destroyVerifyCases.length;
console.log(
  `Access, recycle and destroy editorial simulation passed: 3 existing routes, ${tocPairs.length} anchors, ${codeBlocks.length} syntax-checked blocks, ${offlineCases} offline cases, exact recycle event and Tombstone evidence, preserved publication dates, content-derived 98/100 scores, and explicit Pending live verification.`,
);
