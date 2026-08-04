import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Could not find function ${name}`);

  const braceStart = source.indexOf("{", start);
  assert(braceStart >= 0, `Could not find body for function ${name}`);

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = braceStart; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;

    if (depth === 0) {
      return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not extract complete function ${name}`);
}

const recoveryGateSource = read(
  "scripts/check-english-editorial-recovery-storage-build-20260803.mjs",
);
const decideEmergencyStateSource = extractNamedFunction(
  recoveryGateSource,
  "decideEmergencyState",
);
const decideEmergencyState = vm.runInNewContext(
  `(${decideEmergencyStateSource})`,
  Object.create(null),
);

const missingEmergencyCases = [
  [
    {
      capableCount: 0,
      pendingReady: true,
      pendingSpawning: false,
      pendingAccepted: true,
      spawnAvailable: true,
      energyAvailable: 300,
      minimumCost: 200,
    },
    "recovery-creep-ready",
  ],
  [
    {
      capableCount: 0,
      pendingReady: false,
      pendingSpawning: false,
      pendingAccepted: true,
      spawnAvailable: true,
      energyAvailable: 300,
      minimumCost: 200,
    },
    "accepted-request-not-observed",
  ],
];

for (const [input, expected] of missingEmergencyCases) {
  assert(
    decideEmergencyState(input) === expected,
    `Emergency follow-up case failed: ${expected}`,
  );
}

const constructionPatchSource = read(
  "src/lib/editorial/english-editorial-recovery-construction-followup-20260804.ts",
);
const constructionRegistrySource = read(
  "src/lib/english-editorial-recovery-storage-build-20260803.ts",
);

assert(
  (constructionPatchSource.match(/delete room\.memory\.trackedBuild;/g) ?? []).length >= 3,
  "Construction follow-up must release the pending slot for every unverified terminal outcome",
);
assert(
  constructionPatchSource.includes(
    "if (verification.status === 'accepted-this-tick')",
  ),
  "Construction sampling loop must only pause for the same-tick accepted state",
);
assert(
  constructionPatchSource.includes(
    "release the pending slot so a later diagnostic sample can run",
  ),
  "Construction article must explain why terminal diagnostics release the pending slot",
);
assert(
  constructionRegistrySource.includes(
    "englishEditorialRecoveryConstructionOverride20260804",
  ),
  "Published recovery registry must use the reviewed Construction follow-up override",
);

const storageSource = read(
  "src/lib/editorial/english-editorial-recovery-storage-20260803.ts",
);

assert(
  storageSource.includes("sourceId: storage.id")
    && storageSource.includes("targetId: creep.id"),
  "Withdraw records must preserve the engine's physical Storage-to-Creep event direction",
);
assert(
  storageSource.includes("event.objectId === pending.sourceId")
    && storageSource.includes("event.data?.targetId === pending.targetId"),
  "Storage event matching must use exact physical source and target IDs",
);

console.log(
  "Recovery follow-up gate passed: pending-ready and accepted-unobserved states, terminal Construction slot release, registry wiring, and Storage-to-Creep withdraw event identity are verified.",
);
