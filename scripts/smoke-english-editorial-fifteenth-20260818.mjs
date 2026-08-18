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

const path = "/en/blog/screeps-room-energyavailable-stuck";
const chinesePath = "/blog/screeps-room-energyavailable-stuck";
const { response, body } = await fetchText(path);

if (response.status !== 200) {
  failures.push(`${path}: expected 200, got ${response.status}`);
} else {
  const canonical = `https://www.linqingan.com${path}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;
  const signals = [
    "Why room.energyAvailable Stays Below Capacity in Screeps",
    "room-aggregate",
    "demand-vs-delivery",
    "stable-target",
    "exact-transfer-event-observed",
    "energyFillTargetId",
    "findClosestByPath",
    "event.objectId === pending.creepId",
    "event.data?.targetId === pending.targetId",
    "processedAmount",
    "room aggregate is operational context",
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

  if (body.includes("room.energyAvailable > previousValue as proof")) {
    failures.push(`${path}: still presents a room aggregate increase as required transfer proof`);
  }
  if (body.includes("select the nearest Extension again every tick")) {
    failures.push(`${path}: still encourages target churn instead of stable target identity`);
  }
  if (body.includes("OK proves the Energy was transferred")) {
    failures.push(`${path}: still treats transfer submission as processed-result evidence`);
  }
}

for (const negativePath of [
  "/en/blog/screeps-tombstone-ruin-recovery",
  "/en/blog/screeps-room-event-log",
]) {
  const { body: negativeBody } = await fetchText(negativePath);
  if (negativeBody.includes("energyFillTargetId")) {
    failures.push(`${negativePath}: received fifteenth-batch filler target state`);
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
    "/en/blog/screeps-tombstone-ruin-recovery",
    "/en/blog/screeps-introduction",
    "/en/blog/screeps-first-room",
    "/en/blog/screeps-tick-game-loop",
  ]) {
    const preserved = `<loc>https://www.linqingan.com${preservedPath}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(preserved)) {
      failures.push(`${preservedPath}: prior editorial freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nFifteenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Fifteenth English editorial smoke passed: active Spawn/Extension reconciliation, stable reachable fill target, exact processed transfer evidence, aggregate-demand boundary, canonical/hreflang, structured data, scoped freshness, and Pending live evidence.",
);
