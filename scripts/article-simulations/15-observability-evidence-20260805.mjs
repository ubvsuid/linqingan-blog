import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const historicalNotify = read(
  "src/lib/english-editorial-notify-evidence-20260805.ts",
);
const historicalEvent = read(
  "src/lib/english-editorial-event-window-20260805.ts",
);
const historicalVisual = read(
  "src/lib/english-editorial-roomvisual-evidence-20260805.ts",
);
const currentNotify = read(
  "src/lib/english-editorial-runtime-notify-20260806.ts",
);
const currentEvent = read(
  "src/lib/english-editorial-event-window-final-20260805.ts",
);
const currentVisual = read(
  "src/lib/english-editorial-roomvisual-evidence-final-20260805.ts",
);
const index = read(
  "src/lib/english-editorial-observability-evidence-20260805.ts",
);
const published = read("src/lib/english-editorial-published-20260731.ts");
const registry = read("src/lib/english-observability-registry-9.ts");
const historicalAudit = read(
  "docs/english-editorial-observability-evidence-20260805.md",
);

const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

// Preserve the reviewed 2026-08-05 historical source layer. These files remain
// evidence of the earlier editorial state even when a later wrapper supersedes
// what the public article currently renders.
for (const [source, label, signals] of [
  [
    historicalNotify,
    "historical notification source",
    [
      "englishEditorialNotifyEvidenceArticle20260805",
      'updatedAt: "2026-08-05"',
      "hashNotificationPayload",
      "buildNotificationPayloadDigest",
      "createNotificationDispatcher",
      "Memory.notificationSubmissions",
    ],
  ],
  [
    historicalEvent,
    "historical event source",
    [
      "englishEditorialEventWindowArticle20260805",
      'updatedAt: "2026-08-05"',
      "EVENT_WINDOW_SCHEMA",
      "non-replayable-gap-observed",
      "exact-snapshot-unavailable",
      "room.getEventLog(false)",
    ],
  ],
  [
    historicalVisual,
    "historical RoomVisual source",
    [
      "englishEditorialRoomVisualEvidenceArticle20260805",
      'updatedAt: "2026-08-05"',
      "createRoomVisualDispatcher",
      "cross-room-or-stale-mark-rejected",
      "soft-byte-budget-reached",
      "room-visual-rendered-locally",
    ],
  ],
]) {
  for (const signal of signals) requireText(source, signal, label);
}

// The public current state is the reviewed 2026-08-30 supersession. Assert its
// task-focused contract instead of requiring the older implementation shape.
for (const signal of [
  'title: "Screeps Game.notify(): Send Rate-Limited Alerts Safely"',
  "Game.notify",
  "groupInterval",
  "valid.slice(0, 20)",
  "lastSubmittedTick",
  "External delivery",
]) {
  requireText(currentNotify, signal, "current notification supersession");
}

for (const signal of [
  "englishEditorialEventWindowFinalArticle20260805",
  'title: "Screeps Room.getEventLog(): Read Previous-Tick Events"',
  "Game.time - 1",
  "room.getEventLog(true)",
  "event.data?.targetId",
  "A missed event window cannot be replayed later",
]) {
  requireText(currentEvent, signal, "current event supersession");
}

for (const signal of [
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  'title: "Screeps RoomVisual: Draw Debug Labels and Paths"',
  "target.pos.roomName !== creep.pos.roomName",
  "visual.getSize()",
  "480000",
  "512000",
]) {
  requireText(currentVisual, signal, "current RoomVisual supersession");
}

for (const signal of [
  "englishEditorialNotifyEvidenceFinalArticle20260805",
  "englishEditorialEventWindowFinalArticle20260805",
  "englishEditorialRoomVisualEvidenceFinalArticle20260805",
  "englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  requireText(index, signal, "observability override mapping");
}
for (const signal of [
  "englishEditorialObservabilityEvidenceOverrides20260805",
  "...englishEditorialObservabilityEvidenceOverrides20260805",
]) {
  requireText(published, signal, "published observability wiring");
}

const currentRegistryExpectations = [
  [
    "/en/blog/screeps-game-notify",
    "Screeps Game.notify(): Send Rate-Limited Alerts Safely",
  ],
  [
    "/en/blog/screeps-room-event-log",
    "Screeps Room.getEventLog(): Read Previous-Tick Events",
  ],
  [
    "/en/blog/screeps-roomvisual-debug",
    "Screeps RoomVisual: Draw Debug Labels and Paths",
  ],
];
for (const [href, title] of currentRegistryExpectations) {
  const start = registry.indexOf(`href: "${href}"`);
  const next = registry.indexOf("\n  {", start + href.length);
  const record = start < 0
    ? ""
    : registry.slice(start, next < 0 ? registry.length : next);
  for (const signal of [
    title,
    'updatedAt: "2026-08-30"',
    "finalScore: 98",
  ]) {
    requireText(record, signal, `${href} current registry`);
  }
}

// Keep the original audit immutable as historical evidence rather than forcing
// its 2026-08-05 current-state labels onto later reviewed supersessions.
for (const signal of [
  "/en/blog/screeps-game-notify",
  "/en/blog/screeps-room-event-log",
  "/en/blog/screeps-roomvisual-debug",
  "80977824199a596d174d392fd0cf8c458c21fcbd",
  "**98/100**",
  "Pending",
]) {
  requireText(historicalAudit, signal, "historical observability audit");
}

const decodeHtml = (value) => value
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&amp;", "&");
const currentCombined = [currentNotify, currentEvent, currentVisual].join("\n");
const codeBlocks = [
  ...currentCombined.matchAll(
    /<pre><code class="language-javascript">([\s\S]*?)<\/code><\/pre>/g,
  ),
].map((match) => decodeHtml(match[1]));

if (codeBlocks.length < 8) {
  failures.push(
    `Current observability JavaScript block count ${codeBlocks.length}; expected at least 8.`,
  );
}

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "observability-supersession-"),
);
try {
  codeBlocks.forEach((code, indexValue) => {
    const filePath = path.join(tempDir, `block-${indexValue + 1}.js`);
    fs.writeFileSync(filePath, code, "utf8");
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures.push(
        `Current observability JavaScript block ${indexValue + 1} failed: ${result.stderr.trim()}`,
      );
    }
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function notificationBatchBoundary(count) {
  if (!Number.isInteger(count) || count < 0) return "invalid-count";
  return count < 20 ? "slot-available" : "per-tick-limit-reached";
}

function eventWindowBoundary(currentTick, eventTick) {
  if (!Number.isInteger(currentTick) || !Number.isInteger(eventTick)) {
    return "invalid-tick";
  }
  return eventTick === currentTick - 1
    ? "previous-tick-window"
    : "not-current-event-window";
}

function roomVisualBoundary({ sameRoom, bytes }) {
  if (!sameRoom) return "cross-room-rejected";
  if (!Number.isFinite(bytes) || bytes < 0) return "invalid-size";
  if (bytes >= 512000) return "hard-limit-reached";
  if (bytes >= 480000) return "soft-limit-reached";
  return "visual-budget-available";
}

const cases = [
  [notificationBatchBoundary(0), "slot-available"],
  [notificationBatchBoundary(19), "slot-available"],
  [notificationBatchBoundary(20), "per-tick-limit-reached"],
  [eventWindowBoundary(101, 100), "previous-tick-window"],
  [eventWindowBoundary(101, 99), "not-current-event-window"],
  [roomVisualBoundary({ sameRoom: false, bytes: 0 }), "cross-room-rejected"],
  [roomVisualBoundary({ sameRoom: true, bytes: 479999 }), "visual-budget-available"],
  [roomVisualBoundary({ sameRoom: true, bytes: 480000 }), "soft-limit-reached"],
  [roomVisualBoundary({ sameRoom: true, bytes: 512000 }), "hard-limit-reached"],
];
for (const [actual, expected] of cases) {
  if (actual !== expected) {
    failures.push(`Observability boundary case mismatch: ${actual} !== ${expected}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(
    `Observability supersession simulation failed: ${failures.length} finding(s).`,
  );
  process.exit(1);
}

console.log(
  "Observability supersession simulation passed: the 2026-08-05 historical "
    + "sources remain intact, the reviewed 2026-08-30 notify/event/RoomVisual "
    + "current contracts match discovery metadata, current JavaScript blocks "
    + "parse, and focused notification/event/visual boundaries pass.",
);
