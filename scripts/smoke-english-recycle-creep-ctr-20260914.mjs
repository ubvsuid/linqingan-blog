const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-recycle-creep";
const title = "Screeps recycleCreep(): How to Recycle Creeps Safely";
const description = "Learn how StructureSpawn.recycleCreep() works: move an owned Creep adjacent, submit once, preserve the result, and verify the exact retirement next tick.";
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
    "Recycle One Creep Without Retrying an Irreversible Request",
    "buildRecycleConfirmation",
    "spawn.recycleCreep(creep)",
    "EVENT_OBJECT_DESTROYED",
    "STRUCTURE_CONTAINER",
    "recycle-event-and-tombstone-observed",
    "Screeps Console test",
    "Pending",
    '"dateModified":"2026-09-14"',
    '<time dateTime="2026-09-14">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-spawn-recycle-creep"`,
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
  console.error(`\nRecycle-creep CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("Recycle-creep CTR production smoke passed: current recycleCreep API snippet and 2026-09-14 freshness are active while the existing H1, exact-ID, no-auto-retry, destruction-event, Tombstone/Container, bilingual, canonical, and Pending-evidence contracts remain intact.");
