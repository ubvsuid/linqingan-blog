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
  controller: [
    "src/lib/editorial/english-editorial-energy-controller-20260803.ts",
    "englishEditorialEnergyControllerOverride20260803",
  ],
  link: [
    "src/lib/editorial/english-editorial-energy-link-20260803.ts",
    "englishEditorialEnergyLinkOverride20260803",
  ],
  source: [
    "src/lib/editorial/english-editorial-energy-source-20260803.ts",
    "englishEditorialEnergySourceOverride20260803",
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
  controller: {
    route: "/en/blog/screeps-controller-downgrade",
    chinesePath: "/blog/screeps-controller-downgrade",
    title: "Screeps Controller Downgrade Recovery: Verify Emergency Upgrades",
    headline:
      "Recover a Downgrading Controller Without Hiding Failed Upgrade Ticks",
    primaryKeyword: "Screeps Controller downgrade recovery",
    minCodeBlocks: 5,
    signals: [
      "upgradeBlocked",
      "EVENT_UPGRADE_CONTROLLER",
      "event.objectId === pending.creepId",
      "pending.controllerId",
      "verification-window-missed",
      "upgrade-event-verified",
    ],
    identitySignals: [
      "creepId: creep.id",
      "controllerId: controller.id",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "decideControllerRecovery",
      "submitRecoveryUpgrade",
      "verifyRecoveryUpgrade",
    ],
    stateSignals: [
      "accepted-event-not-found",
      "ambiguous-upgrade-events",
      "verification-window-missed",
    ],
  },
  link: {
    route: "/en/blog/screeps-link-transfer-energy",
    chinesePath: "/blog/screeps-link-transfer-energy",
    title:
      "Screeps Link transferEnergy(): Coordinate Capacity and Verify Events",
    headline:
      "Coordinate Link Transfers and Verify the Exact Source-Target Event",
    primaryKeyword: "Screeps Link transferEnergy",
    minCodeBlocks: 6,
    signals: [
      "planLinkTransfers",
      "targetReserve",
      "source.transferEnergy(",
      "event.objectId === pending.sourceId",
      "event.data?.targetId === pending.targetId",
      "verification-window-missed",
    ],
    identitySignals: [
      "sourceId: source.id",
      "targetId: target.id",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "planLinkTransfers",
      "submitLinkPlans",
      "verifyLinkTransfers",
    ],
    stateSignals: [
      "link-disappeared",
      "target-unavailable",
      "verification-window-missed",
    ],
  },
  source: {
    route: "/en/blog/screeps-select-source-by-path",
    chinesePath: "/blog/screeps-select-source-by-path",
    title: "Screeps Source Selection: Complete Paths and Stable Assignments",
    headline:
      "Select a Reachable Source Without Treating a Partial Path as Success",
    primaryKeyword: "Screeps Source selection",
    minCodeBlocks: 8,
    signals: [
      "PathFinder.search(",
      "result.incomplete !== true",
      "event.objectId === pending.creepId",
      "event.data?.targetId === pending.sourceId",
      "verification-window-missed",
      "stored-source-vision-unavailable",
    ],
    identitySignals: [
      "creepId: creep.id",
      "sourceId: source.id",
      "submittedAt: Game.time",
    ],
    originalSignals: [
      "buildCompleteSourceCandidates",
      "selectSourceCandidate",
      "verifySelectedHarvest",
    ],
    stateSignals: [
      "complete-active-source-not-found",
      "stored-source-vision-unavailable",
      "verification-window-missed",
    ],
  },
};

function addFailure(message) {
  failures.push(message);
}

function decideRecoveryMode({ active, ticksToDowngrade, enterAt, recoverAt }) {
  if (!Number.isFinite(ticksToDowngrade)) return false;
  if (active) return ticksToDowngrade < recoverAt;
  return ticksToDowngrade <= enterAt;
}

function reserveLinkCapacity(remaining, requested) {
  const amount = Math.min(
    Math.max(0, requested),
    Math.max(0, remaining),
  );
  return { amount, remaining: remaining - amount };
}

function rankSourceCandidates(candidates) {
  return candidates
    .filter((candidate) => candidate.complete)
    .sort((left, right) =>
      left.pathLength - right.pathLength
      || left.assignments - right.assignments
      || left.pathCost - right.pathCost
      || left.id.localeCompare(right.id)
    );
}

const offlinePassed = {
  controller: [
    decideRecoveryMode({
      active: false,
      ticksToDowngrade: 4999,
      enterAt: 5000,
      recoverAt: 10000,
    }) === true,
    decideRecoveryMode({
      active: true,
      ticksToDowngrade: 10000,
      enterAt: 5000,
      recoverAt: 10000,
    }) === false,
  ].every(Boolean),
  link: [
    reserveLinkCapacity(800, 500),
    reserveLinkCapacity(300, 500),
  ].every((result, index) =>
    index === 0
      ? result.amount === 500 && result.remaining === 300
      : result.amount === 300 && result.remaining === 0
  ),
  source: (() => {
    const ranked = rankSourceCandidates([
      { id: "B", complete: true, pathLength: 6, assignments: 1, pathCost: 12 },
      { id: "A", complete: false, pathLength: 1, assignments: 0, pathCost: 1 },
      { id: "C", complete: true, pathLength: 6, assignments: 0, pathCost: 15 },
    ]);
    return ranked.length === 2
      && ranked[0].id === "C"
      && ranked[1].id === "B";
  })(),
};

const registry = fs.readFileSync(
  path.join(root, "src/lib/english-articles-complete.ts"),
  "utf8",
);
const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "english-editorial-energy-control-"),
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

    const registrySignals = [
      expected.route,
      expected.chinesePath,
      expected.title,
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
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

const aggregator = fs.readFileSync(
  path.join(root, "src/lib/english-editorial-published-20260731.ts"),
  "utf8",
);
for (const signal of [
  "englishEditorialEnergyControlOverrides20260803",
  "...englishEditorialEnergyControlOverrides20260803",
]) {
  if (!aggregator.includes(signal)) {
    addFailure(`publication aggregator missing “${signal}”`);
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
if (
  packageJson.scripts?.englisheditorialenergycontrol20260803check
  !== "node scripts/check-english-editorial-energy-control-20260803.mjs"
) {
  addFailure("package.json is missing the energy-control editorial check");
}
if (
  !packageJson.scripts?.prebuild?.includes(
    "englisheditorialenergycontrol20260803check",
  )
) {
  addFailure("prebuild does not run the energy-control editorial check");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(
    `\nEnergy-control editorial gate failed: ${failures.length} issue(s).`,
  );
  process.exit(1);
}

console.log(
  `Energy-control editorial gate passed: 3 existing routes, ${codeBlockCount} JavaScript blocks, content-derived scorecards ${JSON.stringify(computedScores)}, exact Controller/Link/Source identity, offline boundary cases, and explicit Pending live evidence.`,
);
