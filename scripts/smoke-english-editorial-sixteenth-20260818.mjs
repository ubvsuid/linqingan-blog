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

const path = "/en/blog/screeps-market-order-maintenance";
const chinesePath = "/blog/screeps-market-order-maintenance";
const { response, body } = await fetchText(path);

if (response.status !== 200) {
  failures.push(`${path}: expected 200, got ${response.status}`);
} else {
  const canonical = `https://www.linqingan.com${path}`;
  const chinese = `https://www.linqingan.com${chinesePath}`;
  const signals = [
    "Do not require <code>roomName</code> for every order",
    "INTERSHARD_RESOURCES",
    "resourceType: 'pixel'",
    "nullable-room",
    "fee-boundary",
    "single-writer",
    "next-tick-proof",
    "expected.roomName === null",
    "ceilToMilliCredit",
    "duplicate-request-id",
    "attemptedRequestIds",
    "awaiting-next-tick-verification",
    "request-scheduled",
    "creditsDelta",
    "Source discrepancy",
    "Current docs list ERR_NOT_OWNER",
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

  for (const forbidden of [
    "typeof request.expected.roomName !== 'string'",
    "OK proves the market mutation settled",
    "creditsDelta is the exact maintenance fee",
    "all market orders require a roomName",
    "request-accepted",
  ]) {
    if (body.includes(forbidden)) {
      failures.push(`${path}: contains forbidden regression “${forbidden}”`);
    }
  }
}

for (const negativePath of [
  "/en/blog/screeps-market-create-order",
  "/en/blog/screeps-market-deal",
]) {
  const { body: negativeBody } = await fetchText(negativePath);
  for (const signal of ["attemptedRequestIds", "duplicate-request-id"]) {
    if (negativeBody.includes(signal)) {
      failures.push(`${negativePath}: received sixteenth-batch signal “${signal}”`);
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

  const preservedFreshness = new Map([
    ["/en/blog/screeps-room-energyavailable-stuck", "2026-08-18"],
    ["/en/blog/screeps-tombstone-ruin-recovery", "2026-08-18"],
    ["/en/blog/screeps-introduction", "2026-08-18"],
    ["/en/blog/screeps-first-room", "2026-08-28"],
  ]);

  for (const [preservedPath, modifiedAt] of preservedFreshness) {
    const preserved = `<loc>https://www.linqingan.com${preservedPath}</loc>\n    <lastmod>${modifiedAt}T00:00:00.000Z</lastmod>`;
    if (!sitemapBody.includes(preserved)) {
      failures.push(`${preservedPath}: prior editorial freshness regressed`);
    }
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nSixteenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Sixteenth English editorial smoke passed: nullable account-bound order identity, conservative fee reserve, idempotent one-writer control, pending-request serialization, next-tick state evidence, source discrepancy disclosure, canonical/hreflang, structured data, scoped freshness with the First Room August 28 supersession, and Pending live evidence.",
);
