await import("./smoke-test.mjs");
await import("./smoke-audit-priority.mjs");
await import("./smoke-search-indexing.mjs");
await import("./smoke-search-v2.mjs");
await import("./smoke-platform-data-phase2.mjs");
await import("./smoke-planning-tools.mjs");

const originalFetch = globalThis.fetch;

// The main smoke test above validates the root Sitemap index and both child
// documents. Legacy English topic smoke modules still request /sitemap.xml
// when checking article inclusion, so route those assertions to the English
// child Sitemap without changing production behavior.
globalThis.fetch = function sitemapAwareFetch(input, init) {
  const value = input instanceof Request ? input.url : String(input);
  const url = new URL(value);

  if (url.pathname === "/sitemap.xml") {
    url.pathname = "/sitemap-en.xml";
    if (input instanceof Request) {
      return originalFetch(new Request(url, input), init);
    }
    return originalFetch(url, init);
  }

  return originalFetch(input, init);
};

try {
  await import("./smoke-english-foundation.mjs");
  await import("./smoke-english-foundation-2.mjs");
  await import("./smoke-english-spawn-3.mjs");
  await import("./smoke-english-lifecycle-4.mjs");
  await import("./smoke-english-movement-5.mjs");
  await import("./smoke-english-movement-6.mjs");
  await import("./smoke-english-vision-7.mjs");
  await import("./smoke-english-runtime-8.mjs");
  await import("./smoke-english-observability-9.mjs");
  await import("./smoke-english-market-10.mjs");
  await import("./smoke-english-lab-factory-11.mjs");
  await import("./smoke-english-resources-12.mjs");
  await import("./smoke-english-tower-13.mjs");
  await import("./smoke-english-controller-14.mjs");
  await import("./smoke-english-construction-15.mjs");
  await import("./smoke-english-config-16.mjs");
  await import("./smoke-english-defense-17.mjs");
  await import("./smoke-english-link-source-18.mjs");
  await import("./smoke-english-multi-spawn-queue-19.mjs");
  await import("./smoke-english-store-capacity-20.mjs");
} finally {
  globalThis.fetch = originalFetch;
}
