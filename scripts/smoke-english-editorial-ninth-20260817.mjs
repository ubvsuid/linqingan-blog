const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const HISTORICAL_UPDATED_AT = "2026-08-17";

const articles = [
  {
    path: "/en/blog/screeps-cpu-getused-bucket",
    chinesePath: "/blog/screeps-cpu-getused-bucket",
    signals: [
      "Turn a CPU delta into a comparable measurement",
      "describeCpuSample",
      "roomsVisible",
      "Choose another guide when",
      "CPU bucket degradation guide",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-memory-basics",
    chinesePath: "/blog/screeps-memory-basics",
    currentUpdatedAt: "2026-09-11",
    currentSignals: [
      "Screeps Memory: Persistent State vs Heap Cache",
      "Learn how Screeps Memory persists state across ticks, when to use heap cache, how creep.memory maps to Memory.creeps, and how to recover saved object IDs.",
    ],
    signals: [
      "source-room-not-visible",
      "source-missing-in-visible-room",
      "Game.rooms[sourceRoom]",
      "does not, by itself, prove",
      "without deleting a remote assignment until visibility makes that conclusion safe",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-spawncreep-return-codes",
    chinesePath: "/blog/screeps-spawncreep-return-codes",
    signals: [
      "describeSpawnEnergy",
      "selectedEnergyAvailable",
      "selectedStructureIds",
      "not evidence that the Creep has finished spawning",
      "Reuse the existing assignment when appropriate",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
  {
    path: "/en/blog/screeps-moveto-not-moving",
    chinesePath: "/blog/screeps-moveto-not-moving",
    signals: [
      "previous.tick === Game.time - 1",
      "previous.moveResult === OK",
      "consecutiveAcceptedStalls",
      "getTargetPosition",
      "target instanceof RoomPosition",
      "target?.pos instanceof RoomPosition",
      "'debugMoveTo'",
      "previousAcceptedWithoutProgress",
      "Checks in order before changing path policy",
      "One unchanged tick is diagnostic evidence, not a root-cause label",
      "The wrapper accepts either a real <code>RoomPosition</code> or a game object",
      "new RoomPosition(x, y, roomName)",
      "Official-documentation review and static code review only",
      "Console test pending",
      "Live multi-tick verification pending",
    ],
  },
];

const failures = [];

for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();

  if (response.status !== 200) {
    failures.push(`${article.path}: expected 200, got ${response.status}`);
    continue;
  }

  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  const currentUpdatedAt = article.currentUpdatedAt ?? HISTORICAL_UPDATED_AT;

  // Keep the 2026-08-17 editorial body/evidence signals locked while allowing
  // later current-layer metadata supersessions to own their own freshness date.
  for (const expected of [
    ...article.signals,
    ...(article.currentSignals ?? []),
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"${currentUpdatedAt}"`,
  ]) {
    if (!body.includes(expected)) {
      failures.push(`${article.path}: missing “${expected}”`);
    }
  }
}

const memoryBody = await (await fetch(`${baseUrl}/en/blog/screeps-memory-basics`)).text();
if (memoryBody.includes("delete creep.memory.sourceId;")) {
  failures.push("Memory page still deletes a remembered Source ID immediately after an ambiguous null lookup");
}

const movementBody = await (await fetch(`${baseUrl}/en/blog/screeps-moveto-not-moving`)).text();
if (movementBody.includes("function recordMovementObservation(creep, moveResult)")) {
  failures.push("Movement page still uses the old unscoped cross-tick observation helper");
}
if (movementBody.includes("recordMovementObservation(\n    creep,\n    result")) {
  failures.push("debugMoveTo still calls the movement observation helper with the obsolete two-argument signature");
}
if (movementBody.includes("previousPosition: observation.previousKey")) {
  failures.push("debugMoveTo still reads the obsolete previousKey field");
}
if (movementBody.includes("const pos = target.pos ?? target")) {
  failures.push("Movement target validation still accepts structurally similar plain objects as live RoomPosition values");
}

const negativeControls = [
  "/en/blog/screeps-err-no-path",
  "/en/blog/screeps-rawmemory-segments",
];
for (const path of negativeControls) {
  const body = await (await fetch(`${baseUrl}${path}`)).text();
  if (body.includes("Turn a CPU delta into a comparable measurement")
      || body.includes("consecutiveAcceptedStalls")
      || body.includes("source-room-not-visible")
      || body.includes("describeSpawnEnergy")) {
    failures.push(`${path}: received content from the ninth editorial batch`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  for (const article of articles) {
    const currentUpdatedAt = article.currentUpdatedAt ?? HISTORICAL_UPDATED_AT;
    const expectedEntry = `<loc>https://www.linqingan.com${article.path}</loc>\n    <lastmod>${currentUpdatedAt}T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${article.path}: Sitemap lastmod is not aligned with the current substantive revision`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nNinth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Ninth English editorial smoke passed: historical 2026-08-17 body/evidence contracts remain locked; Memory current-layer metadata and 2026-09-11 freshness supersession are verified separately; CPU comparison boundaries, visibility-aware Memory ID recovery, request-specific spawn Energy diagnostics, live-RoomPosition-aware consecutive accepted-movement evidence, canonical/hreflang, structured data, and Pending live evidence remain valid.",
);
