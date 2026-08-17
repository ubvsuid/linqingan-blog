const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

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
      "Checks in order before changing path policy",
      "One unchanged tick is diagnostic evidence, not a root-cause label",
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

  for (const expected of [
    ...article.signals,
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-17"`,
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
    const expectedEntry = `<loc>https://www.linqingan.com${article.path}</loc>\n    <lastmod>2026-08-17T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(expectedEntry)) {
      failures.push(`${article.path}: Sitemap lastmod is not aligned with the 2026-08-17 substantive revision`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nNinth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Ninth English editorial smoke passed: CPU comparison boundaries, visibility-aware Memory ID recovery, request-specific spawn Energy diagnostics, consecutive accepted-movement evidence, scoped page/Sitemap freshness, canonical/hreflang, structured data, and Pending live evidence.",
);
