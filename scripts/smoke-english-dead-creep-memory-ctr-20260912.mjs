const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-clean-dead-creep-memory";
const title = "Screeps: Clean Dead Creep Memory Safely";
const description = "Clean stale Memory.creeps entries by comparing them with Game.creeps. Delete only confirmed dead names and keep custom task indexes in sync.";
const headline = "Clean Dead Creep Memory Without Deleting Unrelated State";
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
    '"dateModified":"2026-09-11"',
    '<time dateTime="2026-09-11">Updated ',
  ]) {
    if (!body.includes(expected)) failures.push(`${path}: missing current signal “${expected}”`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  const entry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-09-11T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(entry)) {
    failures.push(`${path}: current Sitemap freshness regressed`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nDead Creep Memory CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("Dead Creep Memory CTR production smoke passed: current title/description, reviewed H1, page dateModified/Updated, and 2026-09-11 Sitemap freshness are active.");
