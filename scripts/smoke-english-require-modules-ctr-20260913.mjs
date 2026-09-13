const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const path = "/en/blog/screeps-require-modules";
const title = "Screeps Modules: require(), module.exports, and Fresh Tick Data";
const description = "Learn how to split Screeps code with require() and module.exports, keep one main loop, avoid stale tick objects, and design small module contracts that survive global resets.";
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
    "Split Screeps Code into Modules Without Hiding Tick Boundaries",
    "module.exports.loop",
    "run(creep, context)",
    "getCurrentCreepNames",
    "global.roleCountCache",
    "invalid-role-result",
    "Live multi-tick verification pending",
    "Pending",
    '"dateModified":"2026-09-13"',
    '<time dateTime="2026-09-13">Updated ',
    `rel="canonical" href="https://www.linqingan.com${path}"`,
    `rel="alternate" hrefLang="zh-CN" href="https://www.linqingan.com/blog/screeps-modules-require"`,
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
  console.error(`\nRequire-modules CTR production smoke failed: ${failures.length} item(s).`);
  process.exit(1);
}

console.log("Require-modules CTR production smoke passed: current require()/module.exports snippet and 2026-09-13 freshness are active while the existing H1, one-loop, tick-boundary, global-cache, bilingual, canonical, and Pending-evidence contracts remain intact.");
