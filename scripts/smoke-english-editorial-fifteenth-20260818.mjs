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
    "quick-diagnosis",
    "likely-causes",
    "minimal-diagnostic",
    "fix-retest",
    "room-aggregate",
    "stable-target",
    "next-tick-verification",
    "return-codes",
    "boundaries",
    "diagnoseRoomEnergy",
    "EVENT_TRANSFER",
    "ERR_NOT_OWNER",
    `rel="canonical" href="${canonical}"`,
    `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`,
    `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `"@type":"BlogPosting"`,
    `"dateModified":"2026-08-29"`,
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

const { response: sitemapResponse, body: sitemapBody } = await fetchText("/sitemap-en.xml");
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, got ${sitemapResponse.status}`);
} else {
  const expected = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-08-29T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(expected)) {
    failures.push(`${path}: Sitemap lastmod is not aligned with the 2026-08-29 substantive revision`);
  }

  const preservedFreshness = new Map([
    ["/en/blog/screeps-tombstone-ruin-recovery", "2026-08-18"],
    ["/en/blog/screeps-introduction", "2026-08-18"],
    ["/en/blog/screeps-first-room", "2026-08-28"],
    ["/en/blog/screeps-tick-game-loop", "2026-08-18"],
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
  console.error(`\nFifteenth English editorial smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Fifteenth English editorial smoke passed: the August 29 room-energy debugging guide keeps its symptom-to-diagnosis-to-fix flow, stable fill-target handling, next-tick processed evidence, canonical/hreflang, structured data, and scoped discovery freshness.",
);
