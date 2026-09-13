const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-err-no-path";
const title = "Screeps ERR_NO_PATH (-2): Causes, Checks & Fixes";
const description = "Debug Screeps ERR_NO_PATH (-2) with reproducible checks for blocked goals, callback restrictions, dynamic occupancy, and cross-room route failures.";
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
    "ERR_NO_PATH (-2)",
    "ERR_NOT_FOUND",
    "PathFinder.search",
    "incomplete",
    "CostMatrix",
    "PathFinder defaults are plain 1 / swamp 5",
    "Actual Creep movement fatigue rate",
    "structure.my === true",
    "structure.isPublic === true",
    "return undefined",
    "Use this guide when",
    "Live multi-tick verification",
    "Pending",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-err-no-path"`,
  ]) {
    if (!body.includes(expected)) failures.push(`${path}: missing current signal “${expected}”`);
  }

  if (body.includes("standalone PathFinder defaults are plain 2")) {
    failures.push(`${path}: stale standalone PathFinder default-cost claim returned`);
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
  console.error(`\nERR_NO_PATH CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("ERR_NO_PATH CTR production smoke passed: current title/description and 2026-09-13 freshness are active while the existing ERR_NO_PATH, ERR_NOT_FOUND, PathFinder incomplete, CostMatrix, Rampart, fatigue, canonical/hreflang, and Pending-evidence contracts remain intact.");
