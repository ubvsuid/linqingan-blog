const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-tick-game-loop";
const title = "Screeps Tick: How module.exports.loop Runs Every Tick";
const description = "Learn how Screeps ticks work, why module.exports.loop runs every tick, how Game.time changes, what persists, and why action results appear on later ticks.";
const headline = "What Is a Screeps Tick and Why Does module.exports.loop Keep Running?";
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
    "At this stage, treat <code>module.exports.loop</code> as the main function Screeps runs for each tick.",
    '"dateModified":"2026-09-11"',
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
  console.error(`\nTick/Game Loop CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("Tick/Game Loop CTR production smoke passed: current title/description and 2026-09-11 freshness are active while the reviewed H1 and tick-model body remain unchanged.");
