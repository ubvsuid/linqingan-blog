import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  checkJavaScriptBlocks,
  scoreEditorialArticle,
} from "./editorial-content-score.mjs";
import { readNamedLiteralObject } from "./read-typescript-literal.mjs";

const root = process.cwd();
const failures = [];

const articleSources = {
  emergency: [
    "src/lib/editorial/english-editorial-recovery-emergency-20260803.ts",
    "englishEditorialRecoveryEmergencyOverride20260803",
  ],
  storage: [
    "src/lib/editorial/english-editorial-recovery-storage-20260803.ts",
    "englishEditorialRecoveryStorageOverride20260803",
  ],
  construction: [
    "src/lib/editorial/english-editorial-recovery-construction-20260803.ts",
    "englishEditorialRecoveryConstructionOverride20260803",
  ],
};

const articlesData = Object.fromEntries(
  Object.entries(articleSources).map(([key, [relativePath, variableName]]) => {
    const filePath = path.join(root, relativePath);
    return [
      key,
      readNamedLiteralObject(
        fs.readFileSync(filePath, "utf8"),
        variableName,
        filePath,
      ),
    ];
  }),
);

const articles = {
  emergency: {
    route: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
    registry: "src/lib/english-spawn-registry-3.ts",
    publishedAt: "2026-07-25",
    title: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
    headline: "Recover a Room with No Harvesters Without Spawning Duplicates",
    primaryKeyword: "Screeps emergency harvester recovery",
    minCodeBlocks: 4,
    signals: [
      "isCapableGeneralHarvester",
      "room.memory.emergencyRecovery",
      "spawn?.spawning?.name === pending.creepName",
      "Game.creeps[pending.creepName]",
      "recovery-overdue",
      "bodyLength * CREEP_SPAWN_TIME",
      "spawn-rejected-after-dry-run",
    ],
    identitySignals: [
      "spawnId: spawn.id",
      "creepName",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "isCapableGeneralHarvester",
      "verifyEmergencyRecovery",
      "submitEmergencyRecovery",
    ],
    stateSignals: [
      "recovery-overdue",
      "accepted-request-not-observed",
      "energy-below-minimum",
    ],
    policyBoundarySignals: [
      "This contract is project policy",
    ],
    intentHandoffSignals: [
      "/en/blog/screeps-dynamic-creep-body",
      "/en/blog/screeps-spawncreep-return-codes",
    ],
  },
  storage: {
    route: "/en/blog/screeps-storage-energy-usage",
    chinesePath: "/blog/screeps-storage-energy-usage",
    registry: "src/lib/english-mineral-storage-power-registry-12.ts",
    publishedAt: "2026-07-26",
    title: "Screeps Storage Energy: Reserve Budgets and Verify Transfers",
    headline: "Use Storage Energy Without Crossing the Reserve or Misreading Transfers",
    primaryKeyword: "Screeps Storage Energy reserve",
    minCodeBlocks: 7,
    signals: [
      "createStorageEnergyCoordinator",
      "withdrawalRemaining",
      "targetReservations",
      "releaseWithdrawal",
      "releaseTargetCapacity",
      "event.objectId === pending.sourceId",
      "event.data?.targetId === pending.targetId",
      "event.data?.resourceType === RESOURCE_ENERGY",
      "sourceId: storage.id",
      "targetId: creep.id",
      "sourceId: creep.id",
      "targetId: target.id",
      "verification-window-missed",
    ],
    identitySignals: [
      "sourceId: storage.id",
      "targetId: creep.id",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "createStorageEnergyCoordinator",
      "runStorageEnergyHauler",
      "verifyStorageEnergyAction",
    ],
    stateSignals: [
      "storage-reserve-protected",
      "matching-event-not-found",
      "matching-event-ambiguous",
      "verification-window-missed",
    ],
    policyBoundarySignals: [
      "The reserve value is a room policy",
    ],
    intentHandoffSignals: [
      "/en/blog/screeps-link-transfer-energy",
      "Controller downgrade guide",
    ],
  },
  construction: {
    route: "/en/blog/screeps-construction-site-progress",
    chinesePath: "/blog/screeps-construction-site-progress",
    registry: "src/lib/english-construction-safety-registry-15.ts",
    publishedAt: "2026-07-26",
    title: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
    headline: "Measure Construction Progress and Verify the Exact Builder Event",
    primaryKeyword: "Screeps ConstructionSite progress",
    minCodeBlocks: 6,
    signals: [
      "summarizeConstructionProgress",
      "inspectTrackedBuildRequest",
      "submitTrackedBuild",
      "creep.pos.inRangeTo(site, 3)",
      "event.event === EVENT_BUILD",
      "event.objectId === pending.builderId",
      "event.data?.targetId === pending.siteId",
      "findCompletedStructure(room, pending)",
      "structure-observed-without-matching-event",
      "build-event-verified-site-completed",
      "verification-window-missed",
    ],
    identitySignals: [
      "builderId: creep.id",
      "siteId: site.id",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "summarizeConstructionProgress",
      "submitTrackedBuild",
      "verifyTrackedBuild",
    ],
    stateSignals: [
      "structure-observed-without-matching-event",
      "matching-build-event-ambiguous",
      "verification-window-missed",
    ],
    policyBoundarySignals: [
      "It is not a room-wide Builder scheduler",
    ],
    intentHandoffSignals: [
      "/en/blog/screeps-room-create-construction-site",
    ],
  },
};

function addFailure(message) {
  failures.push(message);
}

function decideEmergencyState(input) {
  if (input.capableCount > 0) return "capable-harvester-exists";
  if (input.pendingReady) return "recovery-creep-ready";
  if (input.pendingSpawning) return "recovery-spawning";
  if (input.pendingAccepted) return "accepted-request-not-observed";
  if (!input.spawnAvailable) return "spawn-unavailable";
  if (input.energyAvailable < input.minimumCost) {
    return "energy-below-minimum";
  }
  return "recovery-needed";
}

function reserveWithdrawal(remaining, requested) {
  const amount = Math.min(
    Math.max(0, requested),
    Math.max(0, remaining),
  );
  return { amount, remaining: remaining - amount };
}

function summarize(progress, total) {
  return {
    remaining: Math.max(0, total - progress),
    percent: total > 0
      ? Math.min(100, Math.max(0, Math.floor((progress / total) * 100)))
      : 0,
  };
}

const offlinePassed = {
  emergency: [
    [
      {
        capableCount: 1,
        pendingReady: false,
        pendingSpawning: false,
        pendingAccepted: false,
        spawnAvailable: true,
        energyAvailable: 300,
        minimumCost: 200,
      },
      "capable-harvester-exists",
    ],
    [
      {
        capableCount: 0,
        pendingReady: false,
        pendingSpawning: true,
        pendingAccepted: true,
        spawnAvailable: true,
        energyAvailable: 300,
        minimumCost: 200,
      },
      "recovery-spawning",
    ],
    [
      {
        capableCount: 0,
        pendingReady: false,
        pendingSpawning: false,
        pendingAccepted: false,
        spawnAvailable: false,
        energyAvailable: 300,
        minimumCost: 200,
      },
      "spawn-unavailable",
    ],
    [
      {
        capableCount: 0,
        pendingReady: false,
        pendingSpawning: false,
        pendingAccepted: false,
        spawnAvailable: true,
        energyAvailable: 199,
        minimumCost: 200,
      },
      "energy-below-minimum",
    ],
    [
      {
        capableCount: 0,
        pendingReady: false,
        pendingSpawning: false,
        pendingAccepted: false,
        spawnAvailable: true,
        energyAvailable: 200,
        minimumCost: 200,
      },
      "recovery-needed",
    ],
  ].every(([input, expected]) => decideEmergencyState(input) === expected),
  storage: [
    [5000, 1000, 1000, 4000],
    [500, 1000, 500, 0],
    [0, 1000, 0, 0],
    [500, -1, 0, 500],
  ].every(([remaining, requested, amount, next]) => {
    const result = reserveWithdrawal(remaining, requested);
    return result.amount === amount && result.remaining === next;
  }),
  construction: [
    [0, 100, 100, 0],
    [25, 100, 75, 25],
    [110, 100, 0, 100],
    [0, 0, 0, 0],
  ].every(([progress, total, remaining, percent]) => {
    const result = summarize(progress, total);
    return result.remaining === remaining && result.percent === percent;
  }),
};

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "english-editorial-recovery-"),
);
let codeBlockCount = 0;
const computedScores = {};

try {
  for (const [articleKey, expected] of Object.entries(articles)) {
    const article = articlesData[articleKey];

    if (!article) {
      addFailure(`${articleKey}: missing article override`);
      continue;
    }

    const { codeBlocks, codeSyntaxPassed } = checkJavaScriptBlocks({
      articleKey,
      html: article.articleHtml,
      tempDirectory,
      addFailure,
    });
    codeBlockCount += codeBlocks.length;

    const registry = fs.readFileSync(
      path.join(root, expected.registry),
      "utf8",
    );
    const registrySignals = [
      expected.route,
      expected.chinesePath,
      expected.title,
      `publishedAt: "${expected.publishedAt}"`,
      'updatedAt: "2026-08-03"',
      "finalScore: 98",
    ];
    const registrySynchronized = registrySignals.every(
      (signal) => registry.includes(signal),
    );

    for (const signal of registrySignals) {
      if (!registry.includes(signal)) {
        addFailure(`${articleKey}: registry missing “${signal}”`);
      }
    }

    const score = scoreEditorialArticle({
      articleKey,
      article,
      expected,
      codeBlocks,
      codeSyntaxPassed,
      registrySynchronized,
      offlinePassed: offlinePassed[articleKey],
      addFailure,
    });
    computedScores[articleKey] = score;

    if (article.finalScore !== score.total) {
      addFailure(
        `${articleKey}: finalScore ${article.finalScore} does not match computed ${score.total}`,
      );
    }

    if (
      score.total < 96
      || score.technical < 22
      || score.intent < 17
      || score.original < 13
      || score.english < 11
      || score.evidence < 7
    ) {
      addFailure(
        `${articleKey}: computed score threshold failed (${JSON.stringify(score)})`,
      );
    }
  }
} finally {
  fs.rmSync(tempDirectory, {
    recursive: true,
    force: true,
  });
}

const aggregator = fs.readFileSync(
  path.join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
for (const signal of [
  "englishEditorialRecoveryStorageBuildOverrides20260803",
  "...englishEditorialRecoveryStorageBuildOverrides20260803",
]) {
  if (!aggregator.includes(signal)) {
    addFailure(`publication aggregator missing “${signal}”`);
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
if (
  packageJson.scripts?.englisheditorialrecoverystoragebuild20260803check
  !== "node scripts/check-english-editorial-recovery-storage-build-20260803.mjs"
) {
  addFailure("package.json is missing the recovery editorial check");
}
if (
  !packageJson.scripts?.prebuild?.includes(
    "englisheditorialrecoverystoragebuild20260803check",
  )
) {
  addFailure("prebuild does not run the recovery editorial check");
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  console.error(
    `\nRecovery, Storage, and construction editorial gate failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  `Recovery, Storage, and construction editorial gate passed: 3 existing routes, ${codeBlockCount} JavaScript blocks, content-derived scorecards ${JSON.stringify(computedScores)}, exact operation identity, offline boundary cases, Pending live evidence, and protected temp cleanup.`,
);
