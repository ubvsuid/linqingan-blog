const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";

const failures = [];

for (const pathname of ["/search?q=creep", "/en/search?q=creep%20not%20moving"]) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const body = await response.text();
  if (response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${response.status}`);
    continue;
  }
  if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(body)) {
    failures.push(`${pathname}: missing intentional noindex metadata`);
  }
}

const sitemapResponses = await Promise.all([
  fetch(`${baseUrl}/sitemap-zh.xml`).then((response) => response.text()),
  fetch(`${baseUrl}/sitemap-en.xml`).then((response) => response.text()),
]);

if (sitemapResponses[0].includes("https://www.linqingan.com/search")) {
  failures.push("/search: intentionally noindexed search page must not appear in the Chinese Sitemap");
}
if (sitemapResponses[1].includes("https://www.linqingan.com/en/search")) {
  failures.push("/en/search: intentionally noindexed search page must not appear in the English Sitemap");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`Search indexing smoke test failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Search indexing smoke test passed: Chinese and English search pages remain noindex and outside Sitemaps.");
