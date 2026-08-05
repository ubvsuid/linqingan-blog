import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const notify = read("src/lib/english-editorial-notify-evidence-20260805.ts");
const eventWindow = read("src/lib/english-editorial-event-window-20260805.ts");
const roomVisual = read("src/lib/english-editorial-roomvisual-evidence-20260805.ts");
const index = read("src/lib/english-editorial-observability-evidence-20260805.ts");
const published = read("src/lib/english-editorial-published-20260731.ts");
const registry = read("src/lib/english-observability-registry-9.ts");
const audit = read("docs/english-editorial-observability-evidence-20260805.md");
const combined = [notify, eventWindow, roomVisual].join("\n");

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
};
const forbidText = (source, text, label) => {
  if (source.includes(text)) failures.push(`Forbidden ${label}: ${text}`);
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
      "payload-confirmation-mismatch",
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
      "exact-window-committed",
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
      "replay-artifact-invalid-or-expired",
    ],
  ],
]) {
  requireText(index, exportName, `${slug} published import`);
  requireText(source, `publishedAt: "${publishedAt}"`, `${slug} publication date`);
  requireText(source, 'updatedAt: "2026-08-05"', `${slug} modified date`);
  requireText(source, `title: "${title}"`, `${slug} title`);
  requireText(source, "finalScore: 98", `${slug} score`);
  for (const signal of signals) requireText(source, signal, `${slug} signal`);
}

for (const text of [
  "correctedNotifyArticle",
  "result = Game.notify",
  "if (result !== OK)",
  "notification-rejected-review-required",
  "correctedEventWindowArticle",
  "snapshot?.roomName === roomName",
  "correctedRoomVisualArticle",
  "JSON.parse(JSON.stringify(layer))",
  "englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  requireText(index, text, "final correction wiring");
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
  "Cross-room numeric coordinates",
  "**98/100**",
  "Pending",
]) {
  requireText(audit, text, "editorial audit evidence");
}

for (const source of [notify, eventWindow, roomVisual]) {
  const tocPairs = [
    ...source.matchAll(/\["([a-z0-9]+(?:-[a-z0-9]+)*)", "([^"]+)"\],/g),
  ].map((match) => ({ id: match[1], label: match[2] }));

  if (tocPairs.length !== 10) {
    failures.push(`Article TOC count ${tocPairs.length}; expected 10.`);
  }

  for (const { id, label } of tocPairs) {
    if (!source.includes(`<h2 id="${id}">`) && !source.includes(`<h3 id="${id}">`)) {
      failures.push(`TOC anchor missing: ${label} (${id})`);
    }
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

if (codeBlocks.length < 18) {
  failures.push(`JavaScript block count ${codeBlocks.length}; expected at least 18.`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "observability-evidence-"));
try {
  codeBlocks.forEach((code, index) => {
    const filePath = path.join(tempDir, `block-${index + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(`JavaScript block ${index + 1} failed: ${result.stderr.trim()}`);
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
const notificationBase = {
  enabled: true,
  valid: true,
  confirmationMatches: true,
  currentTick: 100,
  expiresAt: 110,
};
const notificationCases = [
  [{ ...notificationBase, enabled: false }, "request-disabled"],
  [{ ...notificationBase, valid: false }, "request-invalid"],
  [{ ...notificationBase, confirmationMatches: false }, "payload-confirmation-mismatch"],
  [{ ...notificationBase, currentTick: 111 }, "request-expired"],
  [notificationBase, "notification-ready"],
];

function reserveNotification(input) {
  if (input.callsUsed >= input.callLimit) return "call-limit-reached";
  if (input.incidentReserved) return "incident-already-reserved";
  if (input.revisionReserved) return "revision-already-reserved";
  return "notification-slot-reserved";
}
const reserveBase = {
  callsUsed: 0,
  callLimit: 20,
  incidentReserved: false,
  revisionReserved: false,
};
const reserveCases = [
  [{ ...reserveBase, callsUsed: 20 }, "call-limit-reached"],
  [{ ...reserveBase, incidentReserved: true }, "incident-already-reserved"],
  [{ ...reserveBase, revisionReserved: true }, "revision-already-reserved"],
  [reserveBase, "notification-slot-reserved"],
];

function classifyNotificationCall(input) {
  if (input.threw) return "notification-call-threw-review-required";
  if (input.result !== "OK") return "notification-rejected-review-required";
  return "submitted-locally";
}
const notifyCallCases = [
  [{ threw: true, result: null }, "notification-call-threw-review-required"],
  [{ threw: false, result: "ERR_FULL" }, "notification-rejected-review-required"],
  [{ threw: false, result: "OK" }, "submitted-locally"],
];

function detectGap(input) {
  if (input.latest === null) return "first-observed-window";
  if (input.currentEventTick === input.latest + 1) return "continuous-window";
  return "non-replayable-gap-observed";
}
const gapCases = [
  [{ latest: null, currentEventTick: 100 }, "first-observed-window"],
  [{ latest: 99, currentEventTick: 100 }, "continuous-window"],
  [{ latest: 97, currentEventTick: 100 }, "non-replayable-gap-observed"],
];

function classifyOwnership(input) {
  if (!input.snapshotAvailable) return "exact-snapshot-unavailable";
  if (input.snapshotRoom !== input.roomName) return "exact-snapshot-unavailable";
  if (input.snapshotTick !== input.eventTick) return "exact-snapshot-unavailable";
  return input.owned ? "owned-at-event-tick" : "not-owned-at-event-tick";
}
const ownershipBase = {
  snapshotAvailable: true,
  snapshotRoom: "W1N1",
  roomName: "W1N1",
  snapshotTick: 100,
  eventTick: 100,
  owned: true,
};
const ownershipCases = [
  [{ ...ownershipBase, snapshotAvailable: false }, "exact-snapshot-unavailable"],
  [{ ...ownershipBase, snapshotRoom: "W1N2" }, "exact-snapshot-unavailable"],
  [{ ...ownershipBase, snapshotTick: 99 }, "exact-snapshot-unavailable"],
  [{ ...ownershipBase, owned: false }, "not-owned-at-event-tick"],
  [ownershipBase, "owned-at-event-tick"],
];

function classifyWindow(input) {
  if (!input.roomVisible) return "room-not-visible";
  if (input.existing && !input.schemaMatches) return "window-schema-conflict";
  if (input.existing) return "exact-window-already-committed";
  if (!input.parsedArray) return "parsed-event-log-not-array";
  return "exact-window-committed";
}
const windowBase = {
  roomVisible: true,
  existing: false,
  schemaMatches: true,
  parsedArray: true,
};
const windowCases = [
  [{ ...windowBase, roomVisible: false }, "room-not-visible"],
  [{ ...windowBase, existing: true, schemaMatches: false }, "window-schema-conflict"],
  [{ ...windowBase, existing: true }, "exact-window-already-committed"],
  [{ ...windowBase, parsedArray: false }, "parsed-event-log-not-array"],
  [windowBase, "exact-window-committed"],
];

function evaluateLayer(input) {
  if (!input.validLayer) return "layer-identity-invalid";
  if (input.duplicateLayer) return "layer-id-already-reserved";
  if (!input.sameRoom || !input.sameTick) return "cross-room-or-stale-mark-rejected";
  return "layer-registered";
}
const layerBase = {
  validLayer: true,
  duplicateLayer: false,
  sameRoom: true,
  sameTick: true,
};
const layerCases = [
  [{ ...layerBase, validLayer: false }, "layer-identity-invalid"],
  [{ ...layerBase, duplicateLayer: true }, "layer-id-already-reserved"],
  [{ ...layerBase, sameRoom: false }, "cross-room-or-stale-mark-rejected"],
  [{ ...layerBase, sameTick: false }, "cross-room-or-stale-mark-rejected"],
  [layerBase, "layer-registered"],
];

function renderVisual(input) {
  if (input.existingBytes !== 0) return "preexisting-visual-writer-detected";
  if (input.currentBytes >= input.maximumBytes) return "soft-byte-budget-reached";
  if (input.afterBytes > input.maximumBytes) return "soft-budget-crossed-by-final-mark";
  return "room-visual-rendered-locally";
}
const renderBase = {
  existingBytes: 0,
  currentBytes: 100,
  maximumBytes: 460000,
  afterBytes: 200,
};
const renderCases = [
  [{ ...renderBase, existingBytes: 1 }, "preexisting-visual-writer-detected"],
  [{ ...renderBase, currentBytes: 460000 }, "soft-byte-budget-reached"],
  [{ ...renderBase, afterBytes: 460001 }, "soft-budget-crossed-by-final-mark"],
  [renderBase, "room-visual-rendered-locally"],
];

const groups = [
  ["notification", notificationCases, evaluateNotification],
  ["notification reservation", reserveCases, reserveNotification],
  ["notification call", notifyCallCases, classifyNotificationCall],
  ["event gap", gapCases, detectGap],
  ["ownership snapshot", ownershipCases, classifyOwnership],
  ["event window", windowCases, classifyWindow],
  ["visual layer", layerCases, evaluateLayer],
  ["visual render", renderCases, renderVisual],
];

let simulationCount = 0;
for (const [label, cases, evaluate] of groups) {
  for (const [input, expected] of cases) {
    simulationCount += 1;
    const actual = evaluate(input);
    if (actual !== expected) {
      failures.push(`${label}: expected ${expected}, received ${actual}`);
    }
  }
}

forbidText(index, "snapshot?.roomName === snapshot?.roomName", "published room self-comparison");
forbidText(index, "structuredClone(layer)", "published unsupported clone call");

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nObservability evidence simulation failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "Observability evidence simulation passed: "
    + `3 existing routes, 30 source-owned anchors, ${codeBlocks.length} JavaScript blocks, `
    + `${simulationCount} offline cases, registry metadata, final corrections, and audit evidence.`,
);
