const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const articles = [
  {
    path: "/en/blog/screeps-memory-basics",
    chinesePath: "/blog/screeps-memory-basics",
    headline: "How Screeps Memory Persists State Across Ticks",
    listingTitle: "Screeps Memory: Persistent State, Heap Cache, and Creep Data",
    tocId: "use-this-guide",
    tocHeading: "Use this guide when",
    faqExpected: false,
    signals: [
      "The three places state can live",
      "Module or <code>global</code> heap data",
      "Save IDs and recover the current object",
      "Live multi-tick verification",
    ],
    verification: ["Chinese source article", "Reviewed in full", "Screeps Console test", "Pending"],
  },
  {
    path: "/en/blog/screeps-withdraw-container-energy",
    chinesePath: "/blog/screeps-creep-withdraw-container-energy",
    headline: "How to Make a Screeps Creep Withdraw Energy from a Container",
    listingTitle: "How to Make a Screeps Creep Withdraw Energy from a Container",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    signals: [],
    verification: ["Chinese source article", "Reviewed in full", "JavaScript syntax", "Passed", "Screeps Console test", "Pending"],
  },
  {
    path: "/en/blog/screeps-pickup-dropped-energy",
    chinesePath: "/blog/screeps-creep-pickup-dropped-energy",
    headline: "How to Make a Screeps Creep Pick Up Dropped Energy",
    listingTitle: "How to Make a Screeps Creep Pick Up Dropped Energy",
    tocId: "quick-answer",
    tocHeading: "Quick answer",
    faqExpected: true,
    signals: [],
    verification: ["Chinese source article", "Reviewed in full", "JavaScript syntax", "Passed", "Live decay and competition test", "Pending"],
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
  const hasFaq = body.includes(`"@type":"FAQPage"`);
  if (hasFaq !== article.faqExpected) failures.push(`${article.path}: FAQPage expectation mismatch`);
}
const blogResponse = await fetch(`${baseUrl}/en/blog-index.json`, { redirect: "manual" });
const blogBody = await blogResponse.text();
if (blogResponse.status !== 200) failures.push(`/en/blog-index.json: expected 200, received ${blogResponse.status}`);
else for (const article of articles) if (!blogBody.includes(article.listingTitle)) failures.push(`/en/blog-index.json: missing “${article.listingTitle}”`);
const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, { redirect: "manual" });
const sitemapBody = await sitemapResponse.text();
if (sitemapResponse.status !== 200) failures.push(`/sitemap.xml: expected 200, received ${sitemapResponse.status}`);
else for (const article of articles) if (!sitemapBody.includes(`https://www.linqingan.com${article.path}`)) failures.push(`/sitemap.xml: missing ${article.path}`);
if (failures.length) { failures.forEach((failure) => console.error(`ERROR: ${failure}`)); process.exit(1); }
console.log(`English foundation production smoke passed: ${articles.length} pages, editorial structure, Verification, Canonical, hreflang, structured data, directory, and Sitemap.`);
