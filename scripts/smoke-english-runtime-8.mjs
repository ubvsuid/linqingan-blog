const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const articles = [
  {
    path: "/en/blog/screeps-cpu-getused-bucket", chinesePath: "/blog/screeps-cpu-getused-bucket",
    headline: "How to Measure Screeps CPU Without Misreading getUsed()", listingTitle: "Screeps CPU Profiling: Measure Code with Game.cpu.getUsed()",
    query: "Game.cpu.getUsed", tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    signals: ["The Simulation always reports <code>0</code>", "end - start", "global.cpuProbe", "minimumBucket = 2000", "Live multi-tick verification", "Pending"],
  },
  {
    path: "/en/blog/screeps-global-cache", chinesePath: "/blog/screeps-global-cache",
    headline: "How to Build a Safe Global Cache in Screeps", listingTitle: "How to Build a Safe Global Cache in Screeps",
    query: "global cache", tocId: "quick-answer", tocHeading: "Quick answer", faqExpected: true,
    signals: ["Global cache is disposable acceleration", "Do not cache live game objects", "Game.getObjectById(id)", "Live global reset, CPU and multi-tick invalidation test", "Pending"],
  },
  {
    path: "/en/blog/screeps-rawmemory-segments", chinesePath: "/blog/screeps-rawmemory-segments",
    headline: "How to Use RawMemory Segments Safely in Screeps", listingTitle: "How to Use RawMemory Segments Safely in Screeps",
    query: "RawMemory Segments", tocId: "quick-answer", tocHeading: "Quick answer", faqExpected: true,
    signals: ["setActiveSegments() schedules availability for the next tick", "raw === undefined", "RawMemory.setActiveSegments(active)", "100 * 1024", "Live segment activation, persistence and multi-module test", "Pending"],
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
  const searchResponse = await fetch(`${baseUrl}/en/search?q=${encodeURIComponent(article.query)}`, { redirect: "manual" });
  const searchBody = await searchResponse.text();
  if (searchResponse.status !== 200) failures.push(`/en/search?q=${article.query}: received ${searchResponse.status}`);
  else if (!searchBody.includes(article.listingTitle)) failures.push(`/en/search?q=${article.query}: missing “${article.listingTitle}”`);
}
const cpuBody = await (await fetch(`${baseUrl}/en/blog/screeps-cpu-getused-bucket`)).text();
if (!cpuBody.includes("runDefense()") || !cpuBody.includes("remaining > reserveCpu")) failures.push("CPU page is missing essential-work and hard-limit guard boundaries");
const cacheBody = await (await fetch(`${baseUrl}/en/blog/screeps-global-cache`)).text();
if (!cacheBody.includes("cloneJsonValue(entry.value)") || !cacheBody.includes("global.runtimeCache ??= new Map()")) failures.push("Global cache page is missing clone isolation or rebuild entry");
const segmentBody = await (await fetch(`${baseUrl}/en/blog/screeps-rawmemory-segments`)).text();
if (!segmentBody.includes("manager.requested.clear()") || !segmentBody.includes("slice(0, 10)")) failures.push("Segments page is missing consolidated manager or 10-segment limit");
const blogBody = await (await fetch(`${baseUrl}/en/blog-index.json`)).text();
for (const article of articles) if (!blogBody.includes(article.listingTitle)) failures.push(`/en/blog-index.json: missing “${article.listingTitle}”`);
const sitemapBody = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
for (const article of articles) if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) failures.push(`/sitemap.xml: missing ${article.path}`);
if (failures.length) { failures.forEach((failure) => console.error(`ERROR: ${failure}`)); process.exit(1); }
console.log(`Runtime batch production smoke passed: ${articles.length} pages, revised CPU measurement workflow, Verification, Canonical, hreflang, structured data, search, and Sitemap.`);
