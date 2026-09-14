const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-spawn-creep";
const title = "Screeps spawnCreep(): Spawn Your First Creep Safely";
const failures = [];

const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
const body = await response.text();
if (response.status !== 200) {
  failures.push(`${path}: expected 200, received ${response.status}`);
} else {
  if (!body.includes(`<title>${title} | Linqingan</title>`)) {
    failures.push(`${path}: existing title regressed`);
  }

  const boundaryCount = (body.match(/id="game-mode-boundary"/g) || []).length;
  if (boundaryCount !== 1) {
    failures.push(`${path}: expected one game-mode boundary, received ${boundaryCount}`);
  }

  for (const expected of [
    "How to Make a Screeps Spawn Create a New Creep",
    "What you will build",
    "Before you start",
    "Game mode boundary",
    "This guide covers Screeps World/MMO",
    "StructureSpawn.spawnCreep(body, name, opts)",
    "Screeps Arena uses a different",
    "spawnCreep(body)",
    'href="/en/blog/screeps-arena-spawn-creep"',
    "Screeps Arena spawnCreep guide",
    "dryRun",
    "ERR_NOT_ENOUGH_ENERGY",
    "CREEP_SPAWN_TIME",
    "Live spawn cycle",
    "Pending",
    '"dateModified":"2026-09-14"',
    '<time dateTime="2026-09-14">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
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
  console.error(`\nspawnCreep game-mode boundary production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("spawnCreep game-mode boundary production smoke passed: the World/MMO contract now routes Arena readers to the dedicated Arena guide while the existing title, H1, tutorial, return-code, Runtime Evidence, canonical, and 2026-09-14 freshness contracts remain intact.");
