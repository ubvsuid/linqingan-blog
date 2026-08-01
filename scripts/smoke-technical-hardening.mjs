const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const failures = [];

function extractCanonical(body) {
  return body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1]
    ?? body.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i)?.[1]
    ?? "";
}

function hasNoindex(body) {
  return /<meta[^>]+name="robots"[^>]+content="[^"]*noindex[^"]*"/i.test(body)
    || /<meta[^>]+content="[^"]*noindex[^"]*"[^>]+name="robots"/i.test(body);
}

async function fetchHtml(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  return { response, body: await response.text() };
}

const pageTwo = await fetchHtml("/en/blog?page=2");
if (pageTwo.response.status !== 200) {
  failures.push(`/en/blog?page=2: expected 200, received ${pageTwo.response.status}`);
}
if (extractCanonical(pageTwo.body) !== "https://www.linqingan.com/en/blog?page=2") {
  failures.push(`/en/blog?page=2: expected a self-referencing Canonical.`);
}
if (hasNoindex(pageTwo.body)) {
  failures.push(`/en/blog?page=2: crawlable pagination must remain indexable.`);
}
if (!pageTwo.body.includes("Screeps Articles and Debugging Guides — Page 2")) {
  failures.push(`/en/blog?page=2: page-specific metadata title is missing.`);
}

for (const [pathname, expectedCanonical] of [
  ["/en/blog?q=memory", "https://www.linqingan.com/en/blog?q=memory"],
  ["/en/blog?sort=newest", "https://www.linqingan.com/en/blog"],
  ["/en/blog?unexpected=1", "https://www.linqingan.com/en/blog"],
]) {
  const result = await fetchHtml(pathname);
  if (result.response.status !== 200) {
    failures.push(`${pathname}: expected 200, received ${result.response.status}`);
    continue;
  }
  if (!hasNoindex(result.body)) {
    failures.push(`${pathname}: filtered or noncanonical parameter state must be noindex,follow.`);
  }
  if (extractCanonical(result.body) !== expectedCanonical) {
    failures.push(`${pathname}: unexpected Canonical ${extractCanonical(result.body) || "missing"}.`);
  }
}

const outOfRange = await fetch(`${baseUrl}/en/blog?page=999`, { redirect: "manual" });
if (outOfRange.status !== 404) {
  failures.push(`/en/blog?page=999: expected 404, received ${outOfRange.status}`);
}

const rootResponse = await fetch(baseUrl);
if (rootResponse.headers.get("content-security-policy-report-only")) {
  failures.push("Global routes must not receive the strict Report-Only CSP candidate.");
}

for (const pathname of ["/verification", "/en/verification"]) {
  const response = await fetch(`${baseUrl}${pathname}`);
  const policy = response.headers.get("content-security-policy-report-only") ?? "";
  if (
    !policy.includes("default-src 'self'")
    || !policy.includes("style-src-attr 'none'")
    || policy.includes("script-src 'self' 'unsafe-inline'")
  ) {
    failures.push(`${pathname}: missing the strict Report-Only CSP canary.`);
  }
}

const unsupportedReport = await fetch(`${baseUrl}/api/csp-report`, {
  method: "POST",
  headers: { "content-type": "text/plain" },
  body: "{}",
});
if (unsupportedReport.status !== 415) {
  failures.push(`/api/csp-report: unsupported content type expected 415, received ${unsupportedReport.status}`);
}
if (!unsupportedReport.headers.get("x-robots-tag")?.includes("noindex")) {
  failures.push(`/api/csp-report: response is missing X-Robots-Tag noindex.`);
}

const oversizedReport = await fetch(`${baseUrl}/api/csp-report`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "x".repeat(16_385),
});
if (oversizedReport.status !== 413) {
  failures.push(`/api/csp-report: oversized payload expected 413, received ${oversizedReport.status}`);
}

const rateLimitResponses = await Promise.all(
  Array.from({ length: 61 }, () => fetch(`${baseUrl}/api/csp-report`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.88",
    },
    body: "",
  })),
);
const limitedCount = rateLimitResponses.filter((response) => response.status === 429).length;
if (limitedCount !== 1 || rateLimitResponses.at(-1)?.status !== 429) {
  failures.push(`/api/csp-report: expected the 61st request to be the only 429 response.`);
}
if (!rateLimitResponses.at(-1)?.headers.get("retry-after")) {
  failures.push(`/api/csp-report: rate-limited response is missing Retry-After.`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  console.error(`\nTechnical hardening smoke failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(
  "Technical hardening smoke passed: pagination Canonicals, filtered noindex states, out-of-range 404s, bilingual CSP canaries, and CSP report ingestion limits are correct.",
);
