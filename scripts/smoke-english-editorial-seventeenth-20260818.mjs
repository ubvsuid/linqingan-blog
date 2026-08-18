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

const path = "/en/blog/screeps-container-decay-repair-deadline";
const chinesePath = "/blog/screeps-container-decay-repair-deadline";
const { response, body } = await fetchText(path);

if (response.status !== 200) {
  failures.push(`${path}: expected 200, got ${response.status}`);
} else {
  const canonical = `https://www.linqingan.com${path}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;
  const signals = [
    "same-tick-ordering",
    "Current-engine same-tick ordering",
    "repairSubmissionTicks = 1",
    "repairSubmissionSlack",
    "repair-window-misses-deadline",
    "ticksToDecay = 1",
    "one-step path is already too late",
    "starting position snapshot",
    "not-owned-creep",
    "not-container",
    "STRUCTURE_CONTAINER",
    "EVENT_REPAIR",
    "processedHits",
    "energySpent",
    "event-window-missed",
    "repair-event-observed",
    "finalPartialHits",
    "estimateUnboostedRepairEnergy",
    "incomplete-path",
    "implementation observation",
    "Live same-tick verification",
    "Pending — no official-shard fatal-pulse repair trace",
    "80977824199a596d174d392fd0cf8c458c21fcbd",
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

  for (const forbidden of [
    "Boosted WORK changes output and Energy consumption.",
    "actionsNeeded\n    * repairPower\n    * REPAIR_COST",
    "same-tick repair is guaranteed before decay",
    "Thirty-one offline cases passed",
    "container.ticksToDecay\n    - travelLowerBound\n    - safetyTicks",
    "lower-bound-fits",
  ]) {
    if (body.includes(forbidden)) {
      failures.push(`${path}: contains forbidden regression “${forbidden}”`);
    }
  }
}

for (const negativePath of [
  "/en/blog/screeps-store-capacity-api",
  "/en/blog/screeps-room-energyavailable-stuck",
]) {
  const { body: negativeBody } = await fetchText(negativePath);
  for (const signal of [
    "event-window-missed",
    "estimateUnboostedRepairEnergy",
    "repair-window-misses-deadline",
    "not-owned-creep",
  ]) {
    if (negativeBody.includes(signal)) {
      failures.push(`${negativePath}: received seventeenth-batch signal “${signal}”`);
    }
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
    "/en/blog/screeps-market-order-maintenance",
    "/en/blog/screeps-room-energyavailable-stuck",
    "/en/blog/screeps-tombstone-ruin-recovery",
    "/en/blog/screeps-introduction",
  ]) {
    const preserved = `<loc>https://www.linqingan.com${preservedPath}</loc>\n    <lastmod>2026-08-18T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(preserved)) {
      failures.push(`${preservedPath}: prior editorial freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nSeventeenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Seventeenth English editorial smoke passed: Container decay runway, explicit repair-submission tick, fatal-pulse off-by-one guard, fail-closed actor/target identity, incomplete-path deadline boundary, current-engine repair-before-decay disclosure, partial-action Energy planning, exact EVENT_REPAIR amount/energySpent evidence, event-window handling, canonical/hreflang, structured data, scoped freshness, and Pending live evidence.",
);
