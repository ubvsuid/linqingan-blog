const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const articles = [
  {
    path: "/en/blog/screeps-spawncreep-return-codes", chinesePath: "/blog/screeps-spawncreep-return-codes",
    headline: "How to Diagnose spawnCreep() Return Codes", listingTitle: "Screeps spawnCreep() Errors: Diagnose Every Return Code",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    verification: ["Chinese source article", "Reviewed in full", "Screeps Console test", "Pending", "Live multi-tick verification"],
    signals: ["dryRunResult", "spawnResult", "ERR_RCL_NOT_ENOUGH", "optional <code>memory</code> field is documented as <code>any</code>"],
  },
  {
    path: "/en/blog/screeps-dynamic-creep-body", chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    headline: "Build a Dynamic Creep Body Without Spending Energy Blindly", listingTitle: "Screeps Dynamic Creep Body: Minimum, Target, and Emergency Plans",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    verification: ["Chinese source article", "Reviewed in full", "Technical correction", "Minimum capability, target budget, emergency scaling, and Spawn submission are separate decisions", "Live multi-tick verification", "Pending"],
    signals: ["'wait-or-scale'", "maximumParts > 50", "unusedEnergy: budget - bodyCost", "spawn-failed-after-dry-run"],
  },
  {
    path: "/en/blog/screeps-emergency-harvester-recovery", chinesePath: "/blog/screeps-spawn-emergency-recovery",
    headline: "Recover a Room with No Harvesters Without Spawning Duplicates", listingTitle: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    verification: ["Existing English route", "Preserved", "Screeps Console test", "Pending", "Live multi-tick verification"],
    signals: ["isCapableGeneralHarvester", "room.memory.emergencyRecovery", "spawn?.spawning?.name === pending.creepName", "recovery-creep-ready", "recovery-overdue", "spawn-rejected-after-dry-run"],
  },
];
const failures = [];
for (const article of articles) {
  const response = await fetch(`${baseUrl}${article.path}`, { redirect: "manual" });
  const body = await response.text();
  if (response.status !== 200) { failures.push(`${article.path}: expected 200, received ${response.status}`); continue; }
  const canonical = `https://www.linqingan.com${article.path}`;
  const chinese = `https://www.linqingan.com${article.chinesePath}`;
  for (const expected of [article.headline, ...article.verification, ...article.signals,
    `rel="canonical" href="${canonical}"`, `rel="alternate" hrefLang="en" href="${canonical}"`,
    `rel="alternate" hrefLang="zh-CN" href="${chinese}"`, `rel="alternate" hrefLang="x-default" href="${canonical}"`,
    `href="#${article.tocId}"`, `<h2 id="${article.tocId}">${article.tocHeading}</h2>`, `"@type":"BlogPosting"`,
  ]) if (!body.includes(expected)) failures.push(`${article.path}: missing “${expected}”`);
  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) failures.push(`${article.path}: FAQPage expectation mismatch`);
}
const dynamicBody = await (await fetch(`${baseUrl}/en/blog/screeps-dynamic-creep-body`)).text();
if (!dynamicBody.includes("minimumBody: [WORK, CARRY, MOVE]")) failures.push("Dynamic body page is missing the explicit minimum-body example");
if (!dynamicBody.includes("maximumEnergy: 1200")) failures.push("Dynamic body page is missing the role Energy cap");
if (!dynamicBody.includes("spawnTime: body.length * CREEP_SPAWN_TIME")) failures.push("Dynamic body page is missing Spawn-time reporting");
const emergencyBody = await (await fetch(`${baseUrl}/en/blog/screeps-emergency-harvester-recovery`)).text();
if (
  !emergencyBody.includes("pending.spawnId")
  || !emergencyBody.includes("pending.creepName")
  || !emergencyBody.includes("Game.creeps[pending.creepName]")
  || !emergencyBody.includes("spawn.spawning.remainingTime")
  || !emergencyBody.includes("bodyLength * CREEP_SPAWN_TIME")
) failures.push("Emergency recovery page is missing exact Spawn/name, later-Creep, or overdue verification boundaries");
const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) failures.push(`/en/blog-index.json: expected 200, received ${blogResponse.status}`);
else for (const article of articles) if (!blogBody.includes(article.listingTitle)) failures.push(`/en/blog-index.json: missing “${article.listingTitle}”`);
const searchResponse = await fetch(`${baseUrl}/en/search?q=spawn`, { redirect: "manual" });
const searchBody = await searchResponse.text();
if (searchResponse.status !== 200) failures.push(`/en/search: expected 200, received ${searchResponse.status}`);
else for (const article of articles) if (!searchBody.includes(article.listingTitle)) failures.push(`/en/search: missing “${article.listingTitle}”`);
const sitemapBody = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
for (const article of articles) if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) failures.push(`/sitemap.xml: missing ${article.path}`);
if (failures.length) { failures.forEach((failure) => console.error(`ERROR: ${failure}`)); process.exit(1); }
console.log(`Spawn batch production smoke passed: ${articles.length} pages, dynamic body policy, exact emergency request identity, Verification, Canonical, hreflang, structured data, search, and Sitemap.`);
