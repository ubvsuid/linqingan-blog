await import("./check-english-editorial-runtime-notify-20260806.mjs");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const articles = [
  {
    path: "/en/blog/screeps-cpu-getused-bucket", chinesePath: "/blog/screeps-cpu-getused-bucket",
    headline: "Measure Screeps CPU Without Treating Zero as an Environment Test", listingTitle: "Screeps CPU Profiling: Measure Code with Game.cpu.getUsed()",
    query: "Game.cpu.getUsed", tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false, modifiedDate: "2026-08-06",
    signals: ["two zero readings do not prove", "zero-sample-inconclusive", "global.cpuProbe", "minimumBucket = 2000", "Live multi-tick verification", "Pending"],
  },
  {
    path: "/en/blog/screeps-global-cache", chinesePath: "/blog/screeps-global-cache",
    headline: "Build a Global Cache That Can Disappear Safely", listingTitle: "Screeps Global Cache: Rebuildable Data Across Runtime Ticks",
    query: "global cache", tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false, modifiedDate: "2026-07-31",
    signals: ["global.roomIndexCache ??= new Map()", "sourceIds: [...entry.sourceIds]", "Game.getObjectById(id)", "Live multi-tick verification", "Pending"],
  },
  {
    path: "/en/blog/screeps-rawmemory-segments", chinesePath: "/blog/screeps-rawmemory-segments",
    headline: "Use RawMemory Segments Without Same-Tick Assumptions", listingTitle: "Screeps RawMemory Segments: Request, Read, and Write Across Ticks",
    query: "RawMemory Segments", tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false, modifiedDate: "2026-08-06",
    signals: ["request-now, read-later lifecycle", "RawMemory.setActiveSegments(activeNextTick)", "segment-unavailable", "100 * 1024", "activation-already-finalized", "Live multi-tick verification", "Pending"],
  },
];
const failures = [];
for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) { failures.push(`${article.path}: expected 200, received ${response.status}`); continue; }
  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [article.headline, "Verification status", "Chinese source article", "Reviewed in full", "Screeps Console test", ...article.signals,
    `rel="canonical" href="${canonical}"`, `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`, `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`, `<h2 id="${article.tocId}">${article.tocHeading}</h2>`, `"@type":"BlogPosting"`,
  ]) if (!body.includes(expected)) failures.push(`${article.path}: missing “${expected}”`);
  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) failures.push(`${article.path}: FAQPage expectation mismatch`);
  if (!body.includes(`"dateModified":"${article.modifiedDate}"`)) failures.push(`${article.path}: missing ${article.modifiedDate} dateModified`);
  const searchResponse = await fetch(`${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`, { redirect: "manual" });
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) failures.push(`/en/search?q=${article.query}: received ${searchResponse.status}`);
  else if (!searchBody.includes(article.listingTitle)) failures.push(`/en/search?q=${article.query}: missing “${article.listingTitle}”`);
}
const cpuBody = await (await fetch(`${baseUrl}/en/blog/screeps-cpu-getused-bucket`)).text();
if (!cpuBody.includes("runDefense()") || !cpuBody.includes("remaining > reserveCpu") || !cpuBody.includes("screeps-cpu-bucket-degradation")) failures.push("CPU page is missing essential-work, hard-limit, or intent-separation boundaries");
const cacheBody = await (await fetch(`${baseUrl}/en/blog/screeps-global-cache`)).text();
if (!cacheBody.includes("global.roomIndexCache ??= new Map()") || !cacheBody.includes("sourceIds: [...entry.sourceIds]")) failures.push("Global cache page is missing rebuildable entry or mutation isolation");
const segmentBody = await (await fetch(`${baseUrl}/en/blog/screeps-rawmemory-segments`)).text();
if (!segmentBody.includes("coordinator.requested.clear()") || !segmentBody.includes("slice(0, 10)") || !segmentBody.includes("segment-unavailable") || !segmentBody.includes("activation-already-finalized")) failures.push("Segments page is missing consolidated activation, unavailable-state, or repeated-finalize handling");
const blogBody = await (await fetch(`${baseUrl}/en/blog-index.json`)).text();
for (const article of articles) if (!blogBody.includes(article.listingTitle)) failures.push(`/en/blog-index.json: missing “${article.listingTitle}”`);
const sitemapBody = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
for (const article of articles) if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) failures.push(`/sitemap.xml: missing ${article.path}`);
if (failures.length) { failures.forEach((failure) => console.error(`ERROR: ${failure}`)); process.exit(1); }
console.log(`Runtime batch production smoke passed: ${articles.length} pages, CPU measurement, rebuildable cache, next-tick Segments, Verification, Canonical, hreflang, structured data, search, and Sitemap.`);
