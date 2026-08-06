const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const timeoutMs = 15000;

async function fetchText(pathname) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return {
      response,
      body: await response.text(),
      error: null,
    };
  } catch (error) {
    return {
      response: null,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const articles = [
  {
    path: "/en/blog/screeps-game-notify",
    chinesePath: "/blog/screeps-game-notify",
    headline: "Submit One Immutable Alert Revision Without Claiming Email Delivery",
    listingTitle: "Screeps Game.notify(): Bind Alert Payload Identity Before Submission",
    query: "Game.notify payload identity",
    tocId: "evidence-contract",
    tocHeading: "Separate scheduling from delivery",
    modifiedAt: "2026-08-05",
    signals: [
      "buildNotificationPayloadDigest",
      "result = Game.notify",
      "if (result !== OK)",
      "notification-rejected-review-required",
      "local-call-site-only",
      "ERR_FULL",
    ],
  },
  {
    path: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    headline: "Process One Event Window Without Reusing a Stale Ownership Snapshot",
    listingTitle: "Screeps Room.getEventLog(): Bind Exact Previous-Tick Windows",
    query: "Room.getEventLog previous tick",
    tocId: "evidence-contract",
    tocHeading: "Bind the previous-tick window",
    modifiedAt: "2026-08-05",
    signals: [
      "non-replayable-gap-observed",
      "snapshot.capturedAt === eventTick",
      "snapshot?.roomName === roomName",
      "room.getEventLog(false)",
      "window-schema-conflict",
      "exact-window-committed",
    ],
  },
  {
    path: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    headline: "Draw Only Same-Room, Same-Tick Snapshots Through One Final Dispatcher",
    listingTitle: "Screeps RoomVisual: Coordinate One Room-Bound Debug Layer",
    query: "RoomVisual room identity",
    tocId: "evidence-contract",
    tocHeading: "Treat drawings as browser output",
    modifiedAt: "2026-08-05",
    signals: [
      "createRoomVisualDispatcher",
      "mark.roomName !== roomName",
      "preexisting-visual-writer-detected",
      "JSON.parse(JSON.stringify(layer))",
      "soft-byte-budget-reached",
      "room-visual-rendered-locally",
    ],
  },
  {
    path: "/en/blog/screeps-room-error-isolation",
    chinesePath: "/blog/screeps-room-error-isolation",
    headline: "How to Isolate One Room Error Without Stopping Every Other Room",
    listingTitle: "Screeps Room Error Isolation: Keep Other Rooms Running",
    query: "room error isolation",
    tocId: "runtime-guard",
    tocHeading: "Build a reusable runtime guard",
    modifiedAt: "2026-08-06",
    signals: [
      "runGuarded",
      "runtime-guard-error",
      "breakerEnabled: false",
      "NonErrorThrow",
      "status: 'cooldown'",
      "ERR_NOT_IN_RANGE",
    ],
  },
];

const failures = [];
const bodies = new Map();

for (const article of articles) {
  const result = await fetchText(article.path);
  if (result.error) {
    failures.push(`${article.path}: request failed: ${result.error}`);
    continue;
  }
  if (result.response.status !== 200) {
    failures.push(`${article.path}: expected 200, received ${result.response.status}`);
    continue;
  }

  const body = result.body;
  bodies.set(article.path, body);
  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;

  for (const expected of [
    article.headline,
    article.listingTitle,
    "Verification status",
    "Chinese source article",
    "Reviewed in full",
    "Screeps Console test",
    "Pending",
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"${article.modifiedAt}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }

  if (body.includes(`"@type":"FAQPage"`)) {
    failures.push(`${article.path}: unexpected FAQPage schema`);
  }

  const search = await fetchText(
    `/en/search?q=${encodeURIComponent(article.query)}`,
  );
  if (search.error) {
    failures.push(`/en/search?q=${article.query}: request failed: ${search.error}`);
  } else if (search.response.status !== 200) {
    failures.push(`/en/search?q=${article.query}: received ${search.response.status}`);
  } else if (!search.body.includes(article.listingTitle)) {
    failures.push(`/en/search?q=${article.query}: missing “${article.listingTitle}”`);
  }
}

const notifyBody = bodies.get("/en/blog/screeps-game-notify") || "";
for (const expected of [
  "revision: 3",
  "payload-confirmation-mismatch",
  "call-limit-reached",
  "request.lastResult = result",
  "result !== OK",
  "submitted-locally",
]) {
  if (!notifyBody.includes(expected)) {
    failures.push(`Game.notify page missing “${expected}”`);
  }
}
for (const forbidden of [
  "delivery succeeded",
  "email delivered",
]) {
  if (notifyBody.includes(forbidden)) {
    failures.push(`Game.notify page contains false delivery claim “${forbidden}”`);
  }
}

const eventBody = bodies.get("/en/blog/screeps-room-event-log") || "";
for (const expected of [
  "EVENT_WINDOW_SCHEMA = 2",
  "snapshot?.roomName === roomName",
  "snapshot?.capturedAt === eventTick",
  "exact-snapshot-unavailable",
  "unsupported-event-preserved",
  "first-observed-window",
]) {
  if (!eventBody.includes(expected)) {
    failures.push(`Event-log page missing “${expected}”`);
  }
}
for (const forbidden of [
  "snapshot?.roomName === snapshot?.roomName",
  "room.getEventLog(true)",
]) {
  if (eventBody.includes(forbidden)) {
    failures.push(`Event-log page contains forbidden model “${forbidden}”`);
  }
}

const visualBody = bodies.get("/en/blog/screeps-roomvisual-debug") || "";
for (const expected of [
  "layer.roomName !== roomName",
  "mark.roomName !== roomName",
  "existingBytes !== 0",
  "Math.min(480000",
  "JSON.parse(JSON.stringify(layer))",
  "replay-artifact-reviewed",
]) {
  if (!visualBody.includes(expected)) {
    failures.push(`RoomVisual page missing “${expected}”`);
  }
}
for (const forbidden of [
  "structuredClone(layer)",
  "Memory.visualDebug[room.name].lastSummary",
]) {
  if (visualBody.includes(forbidden)) {
    failures.push(`RoomVisual page contains forbidden model “${forbidden}”`);
  }
}

const isolationBody = bodies.get("/en/blog/screeps-room-error-isolation") || "";
for (const expected of [
  "JavaScript exception",
  "Screeps API return code",
  "CPU execution boundary",
  "'critical:' + room.name",
  "'optional:' + room.name",
  "runtime-guard-recovered",
  "Live multi-room, CPU cost, global reset, and notification delivery test",
]) {
  if (!isolationBody.includes(expected)) {
    failures.push(`Room error-isolation page missing “${expected}”`);
  }
}
for (const forbidden of [
  "CPU termination is caught",
  "external notification arrived",
  "live multi-room test passed",
]) {
  if (isolationBody.includes(forbidden)) {
    failures.push(`Room error-isolation page contains unsupported claim “${forbidden}”`);
  }
}

const blogIndex = await fetchText("/en/blog-index.json");
if (blogIndex.error) {
  failures.push(`/en/blog-index.json: request failed: ${blogIndex.error}`);
} else if (blogIndex.response.status !== 200) {
  failures.push(`/en/blog-index.json: received ${blogIndex.response.status}`);
} else {
  for (const article of articles) {
    if (!blogIndex.body.includes(article.listingTitle)) {
      failures.push(`/en/blog-index.json: missing “${article.listingTitle}”`);
    }
  }
}

const sitemap = await fetchText("/sitemap.xml");
if (sitemap.error) {
  failures.push(`/sitemap.xml: request failed: ${sitemap.error}`);
} else if (sitemap.response.status !== 200) {
  failures.push(`/sitemap.xml: received ${sitemap.response.status}`);
} else {
  for (const article of articles) {
    const expected = `https://www.linqingan.com${article.path}`;
    if (!sitemap.body.includes(expected)) {
      failures.push(`/sitemap.xml: missing ${expected}`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nEnglish observability production smoke failed: ${failures.length} finding(s).`);
  process.exit(1);
}

console.log(
  "English observability production smoke passed: 4 articles, notification return-code identity, exact previous-tick windows, room-bound visuals, room-level exception isolation, Canonical, hreflang, JSON-LD, search, index, and sitemap.",
);
