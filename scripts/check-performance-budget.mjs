import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lighthouseConfig = JSON.parse(
  fs.readFileSync(path.join(root, "lighthouserc-hardening.json"), "utf8"),
);
const failures = [];
const matrix = lighthouseConfig?.ci?.assert?.assertMatrix;
const globalAssertions = Array.isArray(matrix)
  ? matrix.find((entry) => entry.matchingUrlPattern === ".*")?.assertions
  : undefined;

function requireAssertion(assertions, name, level, option, expected) {
  const assertion = assertions?.[name];
  if (
    !Array.isArray(assertion)
    || assertion[0] !== level
    || assertion[1]?.[option] !== expected
  ) {
    failures.push(
      `${name} must be ${level} with ${option}=${expected}.`,
    );
  }
}

if (lighthouseConfig?.ci?.collect?.numberOfRuns !== 3) {
  failures.push("Lighthouse must collect three runs per route.");
}

const auditUrls = lighthouseConfig?.ci?.collect?.url;
if (!Array.isArray(auditUrls) || !auditUrls.includes("http://localhost:3000/en/blog?page=2")) {
  failures.push("Lighthouse must audit the crawlable second English article-library page.");
}

if (
  lighthouseConfig?.ci?.upload?.target !== "filesystem"
  || lighthouseConfig?.ci?.upload?.outputDir !== "./lhci-results"
) {
  failures.push(
    "Lighthouse reports must stay in the local filesystem instead of relying on a public upload service.",
  );
}

requireAssertion(globalAssertions, "categories:performance", "error", "minScore", 0.9);
requireAssertion(globalAssertions, "largest-contentful-paint", "error", "maxNumericValue", 2500);
requireAssertion(globalAssertions, "total-blocking-time", "error", "maxNumericValue", 300);
requireAssertion(globalAssertions, "cumulative-layout-shift", "error", "maxNumericValue", 0.1);

if (Array.isArray(matrix) && matrix.some((entry) =>
  entry.matchingUrlPattern !== ".*"
  && entry.assertions?.["largest-contentful-paint"]
)) {
  failures.push("Route-specific LCP exceptions are not allowed; every audited route must meet 2500 ms.");
}

const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
if (nextConfig.includes("inlineCss")) {
  failures.push("Global experimental CSS inlining must remain disabled after it increased main-thread work on measured routes.");
}

for (const [pagePath, expectedComponent, forbiddenComponent] of [
  ["src/app/(zh)/search/page.tsx", "ServerSiteSearch", "SiteSearch"],
  ["src/app/(en)/en/search/page.tsx", "ServerEnglishSearch", "EnglishSiteSearch"],
]) {
  const source = fs.readFileSync(path.join(root, pagePath), "utf8");
  if (!source.includes(expectedComponent)) {
    failures.push(`${pagePath} does not render its search results on the server.`);
  }
  if (source.includes(`<${forbiddenComponent}`) || source.includes(`import { ${forbiddenComponent} }`)) {
    failures.push(`${pagePath} still hydrates the full client search application.`);
  }
}

for (const componentPath of [
  "src/components/server-site-search.tsx",
  "src/components/server-english-search.tsx",
]) {
  const source = fs.readFileSync(path.join(root, componentPath), "utf8");
  if (source.includes('"use client"')) {
    failures.push(`${componentPath} must remain a server component.`);
  }
  if (source.includes("@vercel/analytics") || source.includes("fetch(")) {
    failures.push(`${componentPath} performs client-oriented analytics or index fetching.`);
  }
  if (!source.includes('method="get"')) {
    failures.push(`${componentPath} is missing a shareable GET search form.`);
  }
}

const observabilityPath = path.join(root, "src", "components", "deferred-observability.tsx");
if (!fs.existsSync(observabilityPath)) {
  failures.push("Missing the deferred observability client boundary.");
} else {
  const observability = fs.readFileSync(observabilityPath, "utf8");
  for (const expected of [
    'import("@vercel/analytics/next")',
    'import("@vercel/speed-insights/next")',
    "requestIdleCallback",
    "FALLBACK_DELAY_MS = 2_500",
  ]) {
    if (!observability.includes(expected)) {
      failures.push(`Deferred observability is missing ${expected}.`);
    }
  }
}

for (const relativePath of ["src/app/(zh)/layout.tsx", "src/app/(en)/layout.tsx"]) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (!source.includes("<DeferredObservability />")) {
    failures.push(`${relativePath} does not defer observability bundles.`);
  }
  if (
    source.includes('@vercel/analytics/next')
    || source.includes('@vercel/speed-insights/next')
  ) {
    failures.push(`${relativePath} still imports observability on the critical route bundle.`);
  }
}

const workflowDirectory = path.join(root, ".github", "workflows");
const retiredOneTimeWorkflows = new Set([
  "ensure-article-maintenance-complete.yml",
  "finalize-article-maintenance.yml",
  "maintain-beginner-series.yml",
  "publish-article-maintenance-completion.yml",
]);
for (const fileName of fs.readdirSync(workflowDirectory)) {
  if (!/\.ya?ml$/.test(fileName)) continue;
  if (retiredOneTimeWorkflows.has(fileName)) continue;
  const source = fs.readFileSync(
    path.join(workflowDirectory, fileName),
    "utf8",
  );
  const versions = [...source.matchAll(/node-version:\s*["']?(\d+)/g)];
  for (const match of versions) {
    if (match[1] !== "22") {
      failures.push(
        `${fileName} uses Node ${match[1]} instead of the repository Node 22 engine.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  "Performance budget check passed: Performance 90, LCP 2500 ms, TBT 300 ms, CLS 0.1, server-rendered search, idle-loaded observability, and three-run coverage are enforced on Node 22.",
);
