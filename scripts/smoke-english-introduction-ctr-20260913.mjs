const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-introduction";
const title = "What Is Screeps? JavaScript MMO Strategy Game";
const description = "Learn what Screeps is, how JavaScript controls a persistent MMO world each tick, and how Rooms, Creeps, Spawns, Sources, Controllers, Game, and Memory connect.";
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
    "What Is Screeps? How the Programming Strategy Game Works",
    "Screeps: World is a persistent multiplayer real-time strategy game controlled primarily through JavaScript.",
    "Persistent world does not make",
    "Current <code>Game</code> snapshot",
    "Persistent JSON state",
    "Rebuildable runtime cache",
    "Live multi-tick verification pending",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-introduction"`,
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
  console.error(`\nIntroduction CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("Introduction CTR production smoke passed: current title/description and 2026-09-13 freshness are active while the existing beginner H1, persistent-world, Game/Memory/runtime-state, canonical/hreflang, and Pending-evidence contracts remain intact.");
