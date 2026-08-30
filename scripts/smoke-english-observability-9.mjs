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
    headline: "Send Screeps Notifications Without Spamming Every Tick",
    listingTitle: "Screeps Game.notify(): Send Rate-Limited Alerts Safely",
    query: "Game.notify",
    tocId: "result-boundary",
    tocHeading: "Scheduled is not externally delivered",
    modifiedDate: "2026-08-30",
    faqExpected: false,
    verificationSignals: [
      "Chinese source article",
      "Reviewed in full",
      "Screeps Console test",
      "External inbox delivery observation",
      "Pending",
    ],
    signals: [
      "function sendNotification(message, groupInterval = 0)",
      "Notify once per incident instead of once per tick",
      "20 calls per tick",
      "ERR_FULL",
      "Optional shared call budget",
      "Scheduled is not externally delivered",
    ],
  },
  {
    path: "/en/blog/screeps-room-event-log",
    chinesePath: "/blog/screeps-room-event-log",
    headline: "How to Read Room.getEventLog() Without Mixing Up Ticks",
    listingTitle: "Screeps Room.getEventLog(): Read Previous-Tick Events",
    query: "Room.getEventLog",
    tocId: "action-result",
    tocHeading: "Keep current action results and previous-tick events separate",
    modifiedDate: "2026-08-30",
    faqExpected: true,
    verificationSignals: [
      "Official API",
      "Timing boundary",
      "Screeps Console test",
      "Live multi-tick event verification",
      "Pending",
    ],
    signals: [
      "eventTick: Game.time - 1",
      "room.getEventLog()",
      "EVENT_REPAIR",
      "event.data?.targetId === targetId",
      "room.getEventLog(true)",
      "A missed event window cannot be replayed later",
    ],
  },
  {
    path: "/en/blog/screeps-roomvisual-debug",
    chinesePath: "/blog/screeps-roomvisual-debug",
    headline: "How to Debug Creeps and Targets with RoomVisual",
    listingTitle: "Screeps RoomVisual: Draw Debug Labels and Paths",
    query: "RoomVisual",
    tocId: "evidence-boundary",
    tocHeading: "Visuals are not action evidence",
    modifiedDate: "2026-08-30",
    faqExpected: true,
    verificationSignals: [
      "Official API",
      "Size boundary",
      "Evidence boundary",
      "Screeps Console test",
      "Live browser rendering test",
      "Pending",
    ],
    signals: [
      "target-in-another-room",
      "visual.getSize()",
      "512,000 bytes",
      "soft-visual-limit-reached",
      "currentRoom.visual.import",
      "Visuals are not action evidence",
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
    modifiedDate: "2026-08-06",
    faqExpected: true,
    verificationSignals: [
      "Chinese source article",
      "Reviewed in full",
      "Screeps Console test",
      "Pending",
    ],
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
    ...article.verificationSignals,
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`,
    `<h2 id="${article.tocId}">${article.tocHeading}</h2>`,
    `"@type":"BlogPosting"`,
    `"dateModified":"${article.modifiedDate}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }

  const hasFaqSchema = body.includes(`"@type":"FAQPage"`);
  if (hasFaqSchema !== article.faqExpected) {
    failures.push(`${article.path}: FAQPage expectation mismatch`);
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
  "result === OK",
  "notification-scheduled",
  "notification-not-scheduled",
  "Memory.notificationIncidents",
  "Scheduled is not externally delivered",
]) {
  if (!notifyBody.includes(expected)) {
    failures.push(`Game.notify page missing current boundary “${expected}”`);
  }
}
for (const forbidden of [
  "buildNotificationPayloadDigest",
  "payload-confirmation-mismatch",
  "revision: 3",
  "notification-rejected-review-required",
  "delivery succeeded",
  "email delivered",
]) {
  if (notifyBody.includes(forbidden)) {
    failures.push(`Game.notify page contains superseded or false boundary “${forbidden}”`);
  }
}

const eventBody = bodies.get("/en/blog/screeps-room-event-log") || "";
for (const expected of [
  "eventTick: Game.time - 1",
  "event.data?.targetId === targetId",
  "room.getEventLog(true)",
  "Memory.roomEventStats",
  "A missed event window cannot be replayed later",
]) {
  if (!eventBody.includes(expected)) {
    failures.push(`Event-log page missing current boundary “${expected}”`);
  }
}
for (const forbidden of [
  "EVENT_WINDOW_SCHEMA = 2",
  "exact-window-committed",
  "window-schema-conflict",
  "snapshot?.capturedAt === eventTick",
  "snapshot?.roomName === snapshot?.roomName",
]) {
  if (eventBody.includes(forbidden)) {
    failures.push(`Event-log page contains superseded model “${forbidden}”`);
  }
}

const visualBody = bodies.get("/en/blog/screeps-roomvisual-debug") || "";
for (const expected of [
  "target.pos.roomName !== creep.pos.roomName",
  "soft-visual-limit-reached",
  "currentRoom.visual.import",
  "512,000 bytes",
  "Visuals are not action evidence",
]) {
  if (!visualBody.includes(expected)) {
    failures.push(`RoomVisual page missing current boundary “${expected}”`);
  }
}
for (const forbidden of [
  "createRoomVisualDispatcher",
  "preexisting-visual-writer-detected",
  "JSON.parse(JSON.stringify(layer))",
  "replay-artifact-reviewed",
  "structuredClone(layer)",
  "Memory.visualDebug[room.name].lastSummary",
]) {
  if (visualBody.includes(forbidden)) {
    failures.push(`RoomVisual page contains superseded model “${forbidden}”`);
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
  "notification delivery verified",
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
  "English observability production smoke passed: 4 articles, reviewed notification incident/rate boundaries, previous-tick event timing, focused RoomVisual debugging, room-level exception isolation, Canonical, hreflang, JSON-LD, search, index, and sitemap.",
);
