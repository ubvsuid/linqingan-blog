const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const articles = [
  {
    path: "/en/blog/screeps-spawncreep-return-codes", chinesePath: "/blog/screeps-spawncreep-return-codes",
    headline: "How to Diagnose spawnCreep() Return Codes", listingTitle: "Screeps spawnCreep() Errors: Diagnose Every Return Code",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    reviewedInFullExpected: false, modifiedAt: "2026-08-12",
    verification: ["Chinese source article", "Screeps Console test", "Pending", "Live multi-tick verification pending"],
    signals: [
      "dryRunResult",
      "spawnResult",
      "ERR_RCL_NOT_ENOUGH",
      "The current Room Controller level is insufficient to use this Spawn",
      "spawn.isActive()",
      "optional <code>memory</code> field is documented as <code>any</code>",
      "explicit <code>energyStructures</code>",
    ],
  },
  {
    path: "/en/blog/screeps-dynamic-creep-body", chinesePath: "/blog/screeps-dynamic-creep-body-energy",
    headline: "Build a Dynamic Creep Body Without Spending Energy Blindly", listingTitle: "Screeps Dynamic Creep Body: Minimum, Target, and Emergency Plans",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    reviewedInFullExpected: true,
    verification: ["Chinese source article", "Reviewed in full", "Technical correction", "Minimum capability, target budget, emergency scaling, and Spawn submission are separate decisions", "Live multi-tick verification", "Pending"],
    signals: ["'wait-or-scale'", "maximumParts > 50", "unusedEnergy: budget - bodyCost", "spawn-failed-after-dry-run"],
  },
  {
    path: "/en/blog/screeps-emergency-harvester-recovery", chinesePath: "/blog/screeps-spawn-emergency-recovery",
    headline: "Recover a Room with No Harvesters Without Spawning Duplicates", listingTitle: "Screeps Emergency Harvester Recovery: Track the Exact Spawn Request",
    tocId: "use-this-guide", tocHeading: "Use this guide when", faqExpected: false,
    reviewedInFullExpected: false,
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
    ...(article.modifiedAt ? [`"dateModified":"${article.modifiedAt}"`] : []),
  ]) if (!body.includes(expected)) failures.push(`${article.path}: missing “${expected}”`);
  if (body.includes("Reviewed in full") !== article.reviewedInFullExpected) failures.push(`${article.path}: Reviewed in full evidence-boundary expectation mismatch`);
  if (body.includes(`"@type":"FAQPage"`) !== article.faqExpected) failures.push(`${article.path}: FAQPage expectation mismatch`);
}

const returnCodeBody = await (await fetch(`${baseUrl}/en/blog/screeps-spawncreep-return-codes`)).text();
if (returnCodeBody.includes("another Spawn operation under the relevant structure limit")) {
  failures.push("spawnCreep return-code page still misstates ERR_RCL_NOT_ENOUGH as a Spawn-count/structure-limit error");
}
for (const expected of [
  "memory</code> field is documented as <code>any</code>",
  "roomEnergyAvailable: spawn.room.energyAvailable",
  "explicitEnergyStructureCount",
  "dryRunResult",
  "spawnResult",
]) {
  if (!returnCodeBody.includes(expected)) failures.push(`spawnCreep return-code page is missing “${expected}”`);
}

const beginnerSpawnBody = await (await fetch(`${baseUrl}/en/blog/screeps-spawn-creep`)).text();
if (beginnerSpawnBody.includes("another Spawn operation under the relevant structure limit")) {
  failures.push("beginner spawn page still contains the old ERR_RCL_NOT_ENOUGH structure-limit wording");
}
if (!beginnerSpawnBody.includes("The current Room Controller level is insufficient to use this Spawn.")) {
  failures.push("beginner spawn page is missing the corrected ERR_RCL_NOT_ENOUGH meaning");
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
console.log(`Spawn batch production smoke passed: ${articles.length} pages, precise RCL semantics, memory:any, explicit Energy-source context, dynamic body policy, exact emergency request identity, Verification, Canonical, hreflang, structured data, search, and Sitemap.`);
