const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-err-not-in-range";
const title = "Screeps ERR_NOT_IN_RANGE (-9): Action Range Fix";
const description = "Fix Screeps ERR_NOT_IN_RANGE (-9): check the action's required range, keep moveTo() results separate, and retry the original action on a later tick.";
const headline = "How to Fix ERR_NOT_IN_RANGE in Screeps Without Hiding the Real Failure";
const failures = [];

const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
const body = await response.text();
if (response.status !== 200) {
  failures.push(`${path}: expected 200, received ${response.status}`);
} else {
  for (const expected of [
    title,
    description,
    headline,
    "ERR_NOT_IN_RANGE",
    "harvestResult === ERR_NOT_IN_RANGE",
    "range: 1",
    "range: 3",
    "moveResult",
    "getRangeTo",
    "Choose another guide when",
    "later tick",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-err-not-in-range"`,
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
  console.error(`\nERR_NOT_IN_RANGE CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("ERR_NOT_IN_RANGE CTR production smoke passed: current title/description, preserved action-range and move-then-retry boundaries, canonical/hreflang, page dateModified/Updated, and 2026-09-13 Sitemap freshness are active.");
