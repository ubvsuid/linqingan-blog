const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-first-room-code";
const title = "Screeps First Room Code: Harvester, Upgrader & Builder";
const description = "Build a Screeps first-room loop with Harvester, Upgrader, and Builder roles, one validated Spawn request, stable Energy phases, and visible failures.";
const headline = "Combine Your First Screeps Room Loop Without Hiding Failure States";
const failures = [];

const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
const body = await response.text();
if (response.status !== 200) {
  failures.push(`${path}: expected 200, received ${response.status}`);
} else {
  const encodedTitle = title.replaceAll("&", "&amp;");
  if (!body.includes(`<title>${encodedTitle} | Linqingan</title>`)) {
    failures.push(`${path}: current title regressed`);
  }
  if (!body.includes(`<meta name="description" content="${description}"/>`)) {
    failures.push(`${path}: current description regressed`);
  }

  for (const expected of [
    headline,
    'id="orchestration-contract"',
    "BEGINNER_ROLES",
    "Harvester1",
    "Upgrader1",
    "Builder1",
    "dryRun",
    "spawn-preflight-rejected",
    "spawn-request-accepted",
    "later ticks",
    "Pending — no real-shard Console transcript was collected for this revision",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-first-room-code"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${path}: missing current signal “${expected}”`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  const entry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-09-13T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(entry)) {
    failures.push(`${path}: current Sitemap freshness regressed`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nFirst Room Code CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("First Room Code CTR production smoke passed: current title/description, preserved three-role orchestration and later-tick verification boundaries, canonical/hreflang, page dateModified/Updated, and 2026-09-13 Sitemap freshness are active.");
