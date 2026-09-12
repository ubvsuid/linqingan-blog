const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-room-create-construction-site";
const titlePrefix = "Screeps Room.createConstructionSite(): Return Codes, Limits";
const titleSuffix = "Placement Rules";
const description = "Use Room.createConstructionSite() safely in Screeps: understand return codes, controller/RCL limits, placement checks, ERR_FULL causes, and retry-safe planning.";
const headline = "How to Create One Road Construction Site Safely";
const failures = [];

const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
const body = await response.text();
if (response.status !== 200) {
  failures.push(`${path}: expected 200, received ${response.status}`);
} else {
  for (const expected of [
    titlePrefix,
    titleSuffix,
    description,
    headline,
    "MAX_CONSTRUCTION_SITES",
    "room.createConstructionSite",
    "ERR_FULL",
    '"dateModified":"2026-09-12"',
    '<time dateTime="2026-09-12">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-room-create-construction-site"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${path}: missing current signal “${expected}”`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  const entry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-09-12T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(entry)) {
    failures.push(`${path}: current Sitemap freshness regressed`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\ncreateConstructionSite CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("createConstructionSite CTR production smoke passed: current title/description, preserved technical signals and H1, canonical/hreflang, page dateModified/Updated, and 2026-09-12 Sitemap freshness are active.");
