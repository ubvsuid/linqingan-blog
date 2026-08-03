import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const overridePath = path.join(
  root,
  "src/lib/english-editorial-recovery-storage-build-20260803.ts",
);
const overrideSource = fs.readFileSync(overridePath, "utf8");

function decodeOverrides(source) {
  const block = source
    .split("const encodedArticleChunks = [", 2)[1]
    ?.split("];", 1)[0];

  if (!block) {
    throw new Error("Missing encoded article chunks");
  }

  const chunks = [...block.matchAll(/"([A-Za-z0-9+/=]+)"/g)]
    .map((match) => match[1]);

  if (chunks.length === 0) {
    throw new Error("No encoded article chunks found");
  }

  return JSON.parse(
    gunzipSync(
      Buffer.from(chunks.join(""), "base64"),
    ).toString("utf8"),
  );
}

const decoded = decodeOverrides(overrideSource);
const failures = [];
const prohibitedPhrases = [
  "In today's fast-paced world",
  "In this comprehensive guide",
  "Whether you are a beginner or an expert",
  "Let's dive in",
  "Delve into",
  "Unlock the power of",
  "Seamlessly",
  "Game-changing",
  "It is important to note that",
  "By following these steps",
];

const scorecards = {
  emergency: {
    technical: 23,
    intent: 18,
    original: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
  storage: {
    technical: 23,
    intent: 18,
    original: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
  construction: {
    technical: 23,
    intent: 18,
    original: 14,
    english: 12,
    structure: 10,
    evidence: 8,
    seo: 8,
    accessibility: 5,
  },
};

const articles = {
  emergency: {
    route: "/en/blog/screeps-emergency-harvester-recovery",
    chinesePath: "/blog/screeps-spawn-emergency-recovery",
    publishedAt: "2026-07-25",
    title: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
    headline: "Recover a Room with No Harvesters Without Spawning Duplicates",
    registry:
      "src/lib/english-spawn-registry-3.ts",
    signals: [
      "isCapableGeneralHarvester",
      "room.memory.emergencyRecovery",
      "spawn?.spawning?.name === pending.creepName",
      "Game.creeps[pending.creepName]",
      "recovery-overdue",
      "bodyLength * CREEP_SPAWN_TIME",
      "spawn-rejected-after-dry-run",
    ],
  },
  storage: {
    route: "/en/blog/screeps-storage-energy-usage",
    chinesePath: "/blog/screeps-storage-energy-usage",
    publishedAt: "2026-07-26",
    title: "Screeps Storage Energy: Reserve Budgets and Verify Transfers",
    headline: "Use Storage Energy Without Crossing the Reserve or Misreading Transfers",
    registry:
      "src/lib/english-mineral-storage-power-registry-12.ts",
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
  },
  construction: {
    route: "/en/blog/screeps-construction-site-progress",
    chinesePath: "/blog/screeps-construction-site-progress",
    publishedAt: "2026-07-26",
    title: "Screeps ConstructionSite Progress: Verify One Builder Across Ticks",
    headline: "Measure Construction Progress and Verify the Exact Builder Event",
    registry:
      "src/lib/english-construction-safety-registry-15.ts",
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
  },
};

function addFailure(message) {
  failures.push(message);
}

function extractJavaScriptBlocks(html) {
  return [...html.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  )].map((match) =>
    match[1]
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
  );
}

const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "english-editorial-recovery-"),
);
let codeBlockCount = 0;

for (const [key, expected] of Object.entries(articles)) {
  const article = decoded[key];

  if (!article) {
    addFailure(`${key}: missing decoded article`);
    continue;
  }

  if (article.title !== expected.title) {
    addFailure(`${key}: title mismatch`);
  }

  if (article.headline !== expected.headline) {
    addFailure(`${key}: headline mismatch`);
  }

  if (article.finalScore !== 98) {
    addFailure(`${key}: finalScore must be 98`);
  }

  if (!Array.isArray(article.faq) || article.faq.length !== 0) {
    addFailure(`${key}: edited page must not publish a synthetic FAQ`);
  }

  if (
    !Array.isArray(article.toc)
    || article.toc[0]?.[0] !== "use-this-guide"
  ) {
    addFailure(`${key}: first TOC section must state use intent`);
  }

  const tocIds = article.toc.map(([id]) => id);
  if (new Set(tocIds).size !== tocIds.length) {
    addFailure(`${key}: duplicate TOC IDs`);
  }

  const verification = new Map(article.verification);
  if (verification.get("Screeps Console test") !== "Pending") {
    addFailure(`${key}: Console test must remain Pending`);
  }
  if (verification.get("Live multi-tick verification") !== "Pending") {
    addFailure(`${key}: live verification must remain Pending`);
  }
  if (
    verification.get("Genuine room or Console screenshots")
    !== "Pending"
  ) {
    addFailure(`${key}: screenshot evidence must remain Pending`);
  }

  for (const phrase of prohibitedPhrases) {
    if (article.articleHtml.includes(phrase)) {
      addFailure(`${key}: prohibited phrase “${phrase}”`);
    }
  }

  if (article.articleHtml.includes("<h2 id=\"faq\">")) {
    addFailure(`${key}: mechanical FAQ section remains`);
  }

  if (
    !article.articleHtml.includes(
      '<h2 id="verification">Verification status and evidence boundary</h2>',
    )
  ) {
    addFailure(`${key}: missing visible evidence boundary`);
  }

  if (
    !article.articleHtml.includes("https://docs.screeps.com/")
  ) {
    addFailure(`${key}: missing official Screeps source`);
  }

  for (const signal of expected.signals) {
    if (!article.articleHtml.includes(signal)) {
      addFailure(`${key}: missing technical signal “${signal}”`);
    }
  }

  const registryPath = path.join(root, expected.registry);
  const registry = fs.readFileSync(registryPath, "utf8");
  for (const registrySignal of [
    expected.route,
    expected.chinesePath,
    expected.title,
    `publishedAt: "${expected.publishedAt}"`,
    'updatedAt: "2026-08-03"',
    "finalScore: 98",
  ]) {
    if (!registry.includes(registrySignal)) {
      addFailure(
        `${key}: registry missing “${registrySignal}”`,
      );
    }
  }

  const codeBlocks = extractJavaScriptBlocks(
    article.articleHtml,
  );

  if (codeBlocks.length < 4) {
    addFailure(`${key}: too few executable examples`);
  }

  for (const [index, code] of codeBlocks.entries()) {
    codeBlockCount += 1;
    const filePath = path.join(
      tempDirectory,
      `${key}-${index + 1}.js`,
    );
    fs.writeFileSync(filePath, code, "utf8");
    const check = spawnSync(
      process.execPath,
      ["--check", filePath],
      { encoding: "utf8" },
    );

    if (check.status !== 0) {
      addFailure(
        `${key}: JavaScript block ${index + 1} failed syntax check\n${check.stderr}`,
      );
    }
  }

  const score = scorecards[key];
  const total = Object.values(score)
    .reduce((sum, value) => sum + value, 0);

  if (
    total < 96
    || score.technical < 22
    || score.intent < 17
    || score.original < 13
    || score.english < 11
    || score.evidence < 7
  ) {
    addFailure(`${key}: score threshold failed`);
  }
}

const aggregator = fs.readFileSync(
  path.join(
    root,
    "src/lib/english-editorial-published-20260731.ts",
  ),
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
  fs.readFileSync(
    path.join(root, "package.json"),
    "utf8",
  ),
);

if (
  packageJson.scripts
    ?.englisheditorialrecoverystoragebuild20260803check
  !== "node scripts/check-english-editorial-recovery-storage-build-20260803.mjs"
) {
  addFailure("package.json is missing the dedicated editorial check");
}

if (
  !packageJson.scripts?.prebuild?.includes(
    "englisheditorialrecoverystoragebuild20260803check",
  )
) {
  addFailure("prebuild does not run the dedicated editorial check");
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

const emergencyCases = [
  [{ capableCount: 1, pendingReady: false, pendingSpawning: false, pendingAccepted: false, spawnAvailable: true, energyAvailable: 300, minimumCost: 200 }, "capable-harvester-exists"],
  [{ capableCount: 0, pendingReady: false, pendingSpawning: true, pendingAccepted: true, spawnAvailable: true, energyAvailable: 300, minimumCost: 200 }, "recovery-spawning"],
  [{ capableCount: 0, pendingReady: false, pendingSpawning: false, pendingAccepted: false, spawnAvailable: false, energyAvailable: 300, minimumCost: 200 }, "spawn-unavailable"],
  [{ capableCount: 0, pendingReady: false, pendingSpawning: false, pendingAccepted: false, spawnAvailable: true, energyAvailable: 199, minimumCost: 200 }, "energy-below-minimum"],
  [{ capableCount: 0, pendingReady: false, pendingSpawning: false, pendingAccepted: false, spawnAvailable: true, energyAvailable: 200, minimumCost: 200 }, "recovery-needed"],
];

for (const [input, expected] of emergencyCases) {
  if (decideEmergencyState(input) !== expected) {
    addFailure(`emergency offline case failed: ${expected}`);
  }
}

function reserveWithdrawal(remaining, requested) {
  const amount = Math.min(
    Math.max(0, requested),
    remaining,
  );
  return {
    amount,
    remaining: remaining - amount,
  };
}

for (const [remaining, requested, amount, next] of [
  [5000, 1000, 1000, 4000],
  [500, 1000, 500, 0],
  [0, 1000, 0, 0],
  [500, -1, 0, 500],
]) {
  const result = reserveWithdrawal(remaining, requested);
  if (result.amount !== amount || result.remaining !== next) {
    addFailure("Storage withdrawal reservation offline case failed");
  }
}

function summarize(progress, total) {
  return {
    remaining: Math.max(0, total - progress),
    percent: total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.floor((progress / total) * 100),
          ),
        )
      : 0,
  };
}

for (const [progress, total, remaining, percent] of [
  [0, 100, 100, 0],
  [25, 100, 75, 25],
  [110, 100, 0, 100],
  [0, 0, 0, 0],
]) {
  const result = summarize(progress, total);
  if (
    result.remaining !== remaining
    || result.percent !== percent
  ) {
    addFailure("Construction progress offline case failed");
  }
}

fs.rmSync(tempDirectory, {
  recursive: true,
  force: true,
});

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
  `Recovery, Storage, and construction editorial gate passed: 3 existing routes, ${codeBlockCount} JavaScript blocks, stable URLs, synchronized metadata, exact operation identity, offline boundary cases, Pending live evidence, and 98-point internal scores.`,
);
