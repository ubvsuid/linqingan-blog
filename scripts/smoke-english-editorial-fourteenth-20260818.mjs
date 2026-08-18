const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = 15_000;
const failures = [];

async function fetchText(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  return { response, body: await response.text() };
}

const path = "/en/blog/screeps-tombstone-ruin-recovery";
const chinesePath = "/blog/screeps-tombstone-ruin-recovery";
const { response, body } = await fetchText(path);

if (response.status !== 200) {
  failures.push(`${path}: expected 200, got ${response.status}`);
} else {
  const canonical = `https://www.linqingan.com${path}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;
  const signals = [
    "Screeps Tombstone and Ruin Recovery: Reach the Loot Before It Decays",
    "why-decay-ranking-fails",
    "reachability-policy",
    "isClosedHostileRampart",
    "structure.structureType === STRUCTURE_RAMPART",
    "structure.isPublic === true",
    "search.incomplete ? null",
    "minimumSafeLifetime",
    "event.objectId === pending.targetId",
    "event.data?.targetId === pending.creepId",
    "requestedAmount",
    "processedAmount",
    "ERR_NOT_OWNER",
    "Live multi-tick verification pending",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-18"`,
  ];

  for (const expected of signals) {
    if (!body.includes(expected)) {
      failures.push(`${path}: missing “${expected}”`);
    }
  }

  if (body.includes("OBSTACLE_OBJECT_TYPES includes hostile non-public Ramparts")) {
    failures.push(`${path}: still claims OBSTACLE_OBJECT_TYPES alone covers hostile non-public Ramparts`);
  }
  if (body.includes("path.length is the exact travel time")) {
    failures.push(`${path}: still presents path length as an exact ETA`);
  }
  if (body.includes("withdraw() returning OK proves the resources moved")) {
    failures.push(`${path}: still treats accepted withdraw intent as processed-result evidence`);
  }
}

const { body: negativeBody } = await fetchText("/en/blog/screeps-pathfinder-costmatrix");
for (const signal of ["isClosedHostileRampart", "exact-transfer-event-observed"]) {
  if (negativeBody.includes(signal)) {
    failures.push(`/en/blog/screeps-pathfinder-costmatrix: received fourteenth-batch signal “${signal}”`);
  }
}

const { response: sitemapResponse, body: sitemapBody } = await fetchText("/sitemap-en.xml");
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  const expected = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(expected)) {
    failures.push(`${path}: Sitemap lastmod is not aligned with the 2026-08-18 substantive revision`);
  }

  for (const preservedPath of [
    "/en/blog/screeps-introduction",
    "/en/blog/screeps-first-room",
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-clean-dead-creep-memory",
  ]) {
    const preserved = `<loc>https://www.linqingan.com${preservedPath}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(preserved)) {
      failures.push(`${preservedPath}: prior editorial freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nFourteenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Fourteenth English editorial smoke passed: hostile-Rampart reachability, complete-path decay lower bound, processed withdraw event evidence, canonical/hreflang, structured data, scoped freshness, and Pending live evidence.",
);
