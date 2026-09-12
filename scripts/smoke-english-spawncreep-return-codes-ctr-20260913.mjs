const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-spawncreep-return-codes";
const titlePrefix = "Screeps spawnCreep() Return Codes";
const titleSuffix = "Error Fixes";
const description = "Debug Screeps spawnCreep() failures with the documented return codes, dryRun boundaries, Energy checks, name conflicts, invalid arguments, and RCL limits.";
const headline = "How to Diagnose spawnCreep() Return Codes";
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
    "ERR_RCL_NOT_ENOUGH",
    "ERR_NOT_ENOUGH_ENERGY",
    "ERR_INVALID_ARGS",
    "memory</code> field is documented as <code>any</code>",
    "selectedEnergyAvailable",
    "dryRunResult",
    "spawnResult",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-spawncreep-return-codes"`,
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
  console.error(`\nspawnCreep return-codes CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("spawnCreep return-codes CTR production smoke passed: shortened current title/description, preserved H1 and return-code boundaries, canonical/hreflang, page dateModified/Updated, and 2026-09-13 Sitemap freshness are active.");
