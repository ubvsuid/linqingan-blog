const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-first-room";
const title = "Screeps First Room: Editor, Console, and Room Objects";
const description = "Find your first Screeps Room, code editor, and Console, then identify your Spawn, Sources, Controller, and Creeps with read-only checks.";
const failures = [];

const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
const body = await response.text();
if (response.status !== 200) {
  failures.push(`${path}: expected 200, received ${response.status}`);
} else {
  if (!body.includes(`<title>${title} | Linqingan</title>`)) {
    failures.push(`${path}: current title regressed`);
  }
  if (!body.includes(`<meta name="description" content="${description}"/>`)) {
    failures.push(`${path}: current description regressed`);
  }

  for (const expected of [
    "How to Find Your First Screeps Room, Editor, and Console",
    "Run one read-only account inventory",
    "Game.rooms",
    "Game.spawns",
    "Game.creeps",
    "FIND_SOURCES",
    "room.controller",
    "Current client layout",
    "Pending",
    '"dateModified":"2026-09-14"',
    '<time dateTime="2026-09-14">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-first-room"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${path}: missing current signal “${expected}”`);
  }
}

const sitemapResponse = await fetch(`${baseUrl}/sitemap-en.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) {
  failures.push(`/sitemap-en.xml: expected 200, received ${sitemapResponse.status}`);
} else {
  const entry = `<loc>https://www.linqingan.com${path}</loc>\n    <lastmod>2026-09-14T00:00:00.000Z</lastmod>`;
  if (!sitemapBody.includes(entry)) {
    failures.push(`${path}: current Sitemap freshness regressed`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`\nFirst-room CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("First-room CTR production smoke passed: current first-room snippet and 2026-09-14 freshness are active while the existing H1, read-only inventory, room-object, bilingual, canonical, and Pending client-layout contracts remain intact.");
