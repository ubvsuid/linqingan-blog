import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const notify = read("src/lib/english-editorial-notify-evidence-20260805.ts");
const notifyFinal = read("src/lib/english-editorial-notify-evidence-final-20260805.ts");
const eventWindow = read("src/lib/english-editorial-event-window-20260805.ts");
const eventFinal = read("src/lib/english-editorial-event-window-final-20260805.ts");
const roomVisual = read("src/lib/english-editorial-roomvisual-evidence-20260805.ts");
const visualFinal = read("src/lib/english-editorial-roomvisual-evidence-final-20260805.ts");
const index = read("src/lib/english-editorial-observability-evidence-20260805.ts");
const published = read("src/lib/english-editorial-published-20260731.ts");
const registry = read("src/lib/english-observability-registry-9.ts");
const audit = read("docs/english-editorial-observability-evidence-20260805.md");
const articleSources = [notify, eventWindow, roomVisual];
const combinedArticles = articleSources.join("\n");

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

for (const [source, slug, exportName, title, publishedAt, signals] of [
  [
    notify,
    "screeps-game-notify",
    "englishEditorialNotifyEvidenceArticle20260805",
    "Screeps Game.notify(): Bind Alert Payload Identity Before Submission",
    "2026-07-25",
    [
      "hashNotificationPayload",
      "buildNotificationPayloadDigest",
      "supersedeNotificationRequest",
      "createNotificationDispatcher",
      "Memory.notificationSubmissions",
      "local-call-site-only",
    ],
  ],
  [
    eventWindow,
    "screeps-room-event-log",
    "englishEditorialEventWindowArticle20260805",
    "Screeps Room.getEventLog(): Bind Exact Previous-Tick Windows",
    "2026-07-25",
    [
      "EVENT_WINDOW_SCHEMA",
      "non-replayable-gap-observed",
      "capturedAt: Game.time",
      "exact-snapshot-unavailable",
      "room.getEventLog(false)",
      "window-schema-conflict",
    ],
  ],
  [
    roomVisual,
    "screeps-roomvisual-debug",
    "englishEditorialRoomVisualEvidenceArticle20260805",
    "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
    "2026-07-25",
    [
      "createRoomVisualDispatcher",
      "cross-room-or-stale-mark-rejected",
      "preexisting-visual-writer-detected",
      "soft-byte-budget-reached",
      "room-visual-rendered-locally",
    ],
  ],
]) {
  requireText(source, exportName, `${slug} export`);
  requireText(source, `publishedAt: "${publishedAt}"`, `${slug} publication date`);
  requireText(source, 'updatedAt: "2026-08-05"', `${slug} modified date`);
  requireText(source, `title: "${title}"`, `${slug} title`);
  requireText(source, "finalScore: 98", `${slug} score`);
  for (const signal of signals) requireText(source, signal, `${slug} signal`);
}

for (const text of [
  "englishEditorialNotifyEvidenceFinalArticle20260805",
  "result = Game.notify",
  "request.lastResult = result",
  "if (result !== OK)",
  "notification-rejected-review-required",
  "ERR_FULL",
]) {
  requireText(notifyFinal, text, "final notification correction");
}

for (const text of [
  "englishEditorialEventWindowFinalArticle20260805",
  "snapshot?.roomName === roomName",
  "missingFrom",
  "missingTo",
  "missingCount",
  "sampleTicks",
  "sampleTruncated",
  "missingTickSampleTruncated",
]) {
  requireText(eventFinal, text, "final event-window correction");
}

for (const text of [
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  "JSON.parse(JSON.stringify(layer))",
]) {
  requireText(visualFinal, text, "final RoomVisual correction");
}

for (const text of [
  "englishEditorialNotifyEvidenceFinalArticle20260805",
  "englishEditorialEventWindowFinalArticle20260805",
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  "englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  requireText(index, text, "final override mapping");
}

for (const text of [
  "englishEditorialObservabilityEvidenceOverrides20260805",
  "...englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  requireText(published, text, "published override wiring");
}

for (const [href, title] of [
  [
    'href: "/en/blog/screeps-game-notify"',
    "Screeps Game.notify(): Bind Alert Payload Identity Before Submission",
  ],
  [
    'href: "/en/blog/screeps-room-event-log"',
    "Screeps Room.getEventLog(): Bind Exact Previous-Tick Windows",
  ],
  [
    'href: "/en/blog/screeps-roomvisual-debug"',
    "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
  ],
]) {
  const hrefIndex = registry.indexOf(href);
  const recordStart = registry.lastIndexOf("  {", hrefIndex);
  const nextRecord = registry.indexOf("\n  {", hrefIndex + href.length);
  const record = recordStart >= 0
    ? registry.slice(recordStart, nextRecord >= 0 ? nextRecord : registry.length)
    : "";
  requireText(record, title, `${href} registry title`);
  requireText(record, 'updatedAt: "2026-08-05"', `${href} modified date`);
  requireText(record, "finalScore: 98", `${href} score`);
}

for (const text of [
  "/en/blog/screeps-game-notify",
  "/en/blog/screeps-room-event-log",
  "/en/blog/screeps-roomvisual-debug",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "ERR_FULL",
  "capturedAt === eventTick",
  "exact inclusive missing range",
  "Cross-room numeric coordinates",
  "**98/100**",
  "Pending",
]) {
  requireText(audit, text, "editorial audit evidence");
}

for (const source of articleSources) {
  const tocPairs = [
    ...source.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
  ].map((match) => ({ id: match[1], label: match[2] }));

  if (tocPairs.length !== 10) {
    failures.push(`Article TOC count ${tocPairs.length}; expected 10.`);
  }
  if (new Set(tocPairs.map(({ id }) => id)).size !== tocPairs.length) {
    failures.push("Article TOC contains duplicate source-owned anchors.");
  }

  for (const { id, label } of tocPairs) {
    if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
      failures.push(`TOC anchor missing: ${label} (${id})`);
    }
  }
}

const codeBlocks = [
  ...combinedArticles.matchAll(/<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g),
].map((match) =>
  match[1]
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&"),
);

if (codeBlocks.length < 18) {
  failures.push(`JavaScript block count ${codeBlocks.length}; expected at least 18.`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "observability-evidence-"));
try {
  codeBlocks.forEach((code, indexValue) => {
    const filePath = path.join(tempDir, `block-${indexValue + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${indexValue + 1} failed: ${result.stderr.trim()}`);
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function evaluateNotification(input) {
  if (!input.enabled) return "request-disabled";
  if (!input.valid) return "request-invalid";
  if (!input.confirmationMatches) return "payload-confirmation-mismatch";
  if (input.currentTick > input.expiresAt) return "request-expired";
  return "notification-ready";
}

function reserveNotification(input) {
  if (input.callsUsed >= input.callLimit) return "call-limit-reached";
  if (input.incidentReserved) return "incident-already-reserved";
  if (input.revisionReserved) return "revision-already-reserved";
  return "notification-slot-reserved";
}

function classifyNotificationCall(input) {
  if (input.threw) return "notification-call-threw-review-required";
  if (input.result !== "OK") return "notification-rejected-review-required";
  return "submitted-locally";
}

function detectGap(input) {
  if (input.latest === null) return "first-observed-window";
  if (input.currentEventTick === input.latest + 1) return "continuous-window";
  return "non-replayable-gap-observed";
}

function gapShape(latest, currentEventTick) {
  const missingFrom = latest + 1;
  const missingTo = currentEventTick - 1;
  const missingCount = Math.max(0, missingTo - missingFrom + 1);
  const sampleCount = Math.min(20, missingCount);
  return {
    missingFrom,
    missingTo,
    missingCount,
    sampleLength: sampleCount,
    sampleTruncated: missingCount > sampleCount,
  };
}

function classifyOwnership(input) {
  if (!input.snapshotAvailable) return "exact-snapshot-unavailable";
  if (input.snapshotRoom !== input.roomName) return "exact-snapshot-unavailable";
  if (input.snapshotTick !== input.eventTick) return "exact-snapshot-unavailable";
  return input.owned ? "owned-at-event-tick" : "not-owned-at-event-tick";
}

function classifyWindow(input) {
  if (!input.roomVisible) return "room-not-visible";
  if (input.existing && !input.schemaMatches) return "window-schema-conflict";
  if (input.existing) return "exact-window-already-committed";
  if (!input.parsedArray) return "parsed-event-log-not-array";
  return "exact-window-committed";
}

function evaluateLayer(input) {
  if (!input.validLayer) return "layer-identity-invalid";
  if (input.duplicateLayer) return "layer-id-already-reserved";
  if (!input.sameRoom || !input.sameTick) return "cross-room-or-stale-mark-rejected";
  return "layer-registered";
}

function renderVisual(input) {
  if (input.existingBytes !== 0) return "preexisting-visual-writer-detected";
  if (input.currentBytes >= input.maximumBytes) return "soft-byte-budget-reached";
  if (input.afterBytes > input.maximumBytes) return "soft-budget-crossed-by-final-mark";
  return "room-visual-rendered-locally";
}

const groups = [
  [
    "notification",
    evaluateNotification,
    [
      [{ enabled: false, valid: true, confirmationMatches: true, currentTick: 100, expiresAt: 110 }, "request-disabled"],
      [{ enabled: true, valid: false, confirmationMatches: true, currentTick: 100, expiresAt: 110 }, "request-invalid"],
      [{ enabled: true, valid: true, confirmationMatches: false, currentTick: 100, expiresAt: 110 }, "payload-confirmation-mismatch"],
      [{ enabled: true, valid: true, confirmationMatches: true, currentTick: 111, expiresAt: 110 }, "request-expired"],
      [{ enabled: true, valid: true, confirmationMatches: true, currentTick: 100, expiresAt: 110 }, "notification-ready"],
    ],
  ],
  [
    "notification reservation",
    reserveNotification,
    [
      [{ callsUsed: 20, callLimit: 20, incidentReserved: false, revisionReserved: false }, "call-limit-reached"],
      [{ callsUsed: 0, callLimit: 20, incidentReserved: true, revisionReserved: false }, "incident-already-reserved"],
      [{ callsUsed: 0, callLimit: 20, incidentReserved: false, revisionReserved: true }, "revision-already-reserved"],
      [{ callsUsed: 0, callLimit: 20, incidentReserved: false, revisionReserved: false }, "notification-slot-reserved"],
    ],
  ],
  [
    "notification call",
    classifyNotificationCall,
    [
      [{ threw: true, result: null }, "notification-call-threw-review-required"],
      [{ threw: false, result: "ERR_FULL" }, "notification-rejected-review-required"],
      [{ threw: false, result: "OK" }, "submitted-locally"],
    ],
  ],
  [
    "event gap",
    detectGap,
    [
      [{ latest: null, currentEventTick: 100 }, "first-observed-window"],
      [{ latest: 99, currentEventTick: 100 }, "continuous-window"],
      [{ latest: 97, currentEventTick: 100 }, "non-replayable-gap-observed"],
    ],
  ],
  [
    "ownership snapshot",
    classifyOwnership,
    [
      [{ snapshotAvailable: false, snapshotRoom: "W1N1", roomName: "W1N1", snapshotTick: 100, eventTick: 100, owned: true }, "exact-snapshot-unavailable"],
      [{ snapshotAvailable: true, snapshotRoom: "W1N2", roomName: "W1N1", snapshotTick: 100, eventTick: 100, owned: true }, "exact-snapshot-unavailable"],
      [{ snapshotAvailable: true, snapshotRoom: "W1N1", roomName: "W1N1", snapshotTick: 99, eventTick: 100, owned: true }, "exact-snapshot-unavailable"],
      [{ snapshotAvailable: true, snapshotRoom: "W1N1", roomName: "W1N1", snapshotTick: 100, eventTick: 100, owned: false }, "not-owned-at-event-tick"],
      [{ snapshotAvailable: true, snapshotRoom: "W1N1", roomName: "W1N1", snapshotTick: 100, eventTick: 100, owned: true }, "owned-at-event-tick"],
    ],
  ],
  [
    "event window",
    classifyWindow,
    [
      [{ roomVisible: false, existing: false, schemaMatches: true, parsedArray: true }, "room-not-visible"],
      [{ roomVisible: true, existing: true, schemaMatches: false, parsedArray: true }, "window-schema-conflict"],
      [{ roomVisible: true, existing: true, schemaMatches: true, parsedArray: true }, "exact-window-already-committed"],
      [{ roomVisible: true, existing: false, schemaMatches: true, parsedArray: false }, "parsed-event-log-not-array"],
      [{ roomVisible: true, existing: false, schemaMatches: true, parsedArray: true }, "exact-window-committed"],
    ],
  ],
  [
    "visual layer",
    evaluateLayer,
    [
      [{ validLayer: false, duplicateLayer: false, sameRoom: true, sameTick: true }, "layer-identity-invalid"],
      [{ validLayer: true, duplicateLayer: true, sameRoom: true, sameTick: true }, "layer-id-already-reserved"],
      [{ validLayer: true, duplicateLayer: false, sameRoom: false, sameTick: true }, "cross-room-or-stale-mark-rejected"],
      [{ validLayer: true, duplicateLayer: false, sameRoom: true, sameTick: false }, "cross-room-or-stale-mark-rejected"],
      [{ validLayer: true, duplicateLayer: false, sameRoom: true, sameTick: true }, "layer-registered"],
    ],
  ],
  [
    "visual render",
    renderVisual,
    [
      [{ existingBytes: 1, currentBytes: 100, maximumBytes: 460000, afterBytes: 200 }, "preexisting-visual-writer-detected"],
      [{ existingBytes: 0, currentBytes: 460000, maximumBytes: 460000, afterBytes: 460000 }, "soft-byte-budget-reached"],
      [{ existingBytes: 0, currentBytes: 100, maximumBytes: 460000, afterBytes: 460001 }, "soft-budget-crossed-by-final-mark"],
      [{ existingBytes: 0, currentBytes: 100, maximumBytes: 460000, afterBytes: 200 }, "room-visual-rendered-locally"],
    ],
  ],
];

let simulationCount = 0;
for (const [label, evaluate, cases] of groups) {
  for (const [input, expected] of cases) {
    simulationCount += 1;
    const actual = evaluate(input);
    if (actual !== expected) {
      failures.push(`${label}: expected ${expected}, received ${actual}`);
    }
  }
}

for (const [latest, currentEventTick, expected] of [
  [97, 100, { missingFrom: 98, missingTo: 99, missingCount: 2, sampleLength: 2, sampleTruncated: false }],
  [0, 1001, { missingFrom: 1, missingTo: 1000, missingCount: 1000, sampleLength: 20, sampleTruncated: true }],
]) {
  simulationCount += 1;
  const actual = gapShape(latest, currentEventTick);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`bounded gap shape mismatch: ${JSON.stringify(actual)}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nObservability evidence simulation failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Observability evidence simulation passed: "
    + `3 existing routes, 30 source-owned anchors, ${codeBlocks.length} JavaScript blocks, `
    + `${simulationCount} offline cases, explicit final article wrappers, registry metadata, and audit evidence.`,
);
