import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing performance configuration: ${relativePath}`);
    return {};
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

const lighthouseConfig = readJson("lighthouserc.json");
const pullRequestConfig = readJson("lighthouserc.pr.json");
const productionConfig = readJson("lighthouserc.production.json");
const matrix = lighthouseConfig?.ci?.assert?.assertMatrix;
const pullRequestMatrix = pullRequestConfig?.ci?.assert?.assertMatrix;
const productionMatrix = productionConfig?.ci?.assert?.assertMatrix;
const globalAssertions = Array.isArray(matrix)
  ? matrix.find((entry) => entry.matchingUrlPattern === ".*")?.assertions
  : undefined;
const pullRequestGlobalAssertions = Array.isArray(pullRequestMatrix)
  ? pullRequestMatrix.find((entry) => entry.matchingUrlPattern === ".*")?.assertions
  : undefined;
const productionGlobalAssertions = Array.isArray(productionMatrix)
  ? productionMatrix.find((entry) => entry.matchingUrlPattern === ".*")?.assertions
  : undefined;
const strictRoutePattern =
  "^http://localhost:3000/(?:tools/room-diagnostics|en/evidence)(?:\\?|$)";
const longArticlePattern =
  "^http://localhost:3000/blog/screeps-memory-basics(?:\\?|$)";
const generalRoutePattern =
  "^http://localhost:3000/(?!tools/room-diagnostics(?:\\?|$)|en/evidence(?:\\?|$)|blog/screeps-memory-basics(?:\\?|$)).*";

function requireAssertion(assertions, name, level, option, expected, label = "Lighthouse") {
  const assertion = assertions?.[name];
  if (
    !Array.isArray(assertion)
    || assertion[0] !== level
    || assertion[1]?.[option] !== expected
  ) {
    failures.push(
      `${label}: ${name} must be ${level} with ${option}=${expected}.`,
    );
  }
}

function getAssertions(sourceMatrix, pattern) {
  return Array.isArray(sourceMatrix)
    ? sourceMatrix.find((entry) => entry.matchingUrlPattern === pattern)?.assertions
    : undefined;
}

if (lighthouseConfig?.ci?.collect?.numberOfRuns !== 3) {
  failures.push("Full local Lighthouse must collect three runs per route.");
}
if (
  lighthouseConfig?.ci?.upload?.target !== "filesystem"
  || lighthouseConfig?.ci?.upload?.outputDir !== "./lhci-results"
) {
  failures.push(
    "Full local Lighthouse reports must stay in ./lhci-results for workflow artifact retention.",
  );
}

requireAssertion(globalAssertions, "categories:performance", "error", "minScore", 0.85, "Full local Lighthouse");
requireAssertion(globalAssertions, "categories:accessibility", "error", "minScore", 0.95, "Full local Lighthouse");
requireAssertion(globalAssertions, "total-blocking-time", "error", "maxNumericValue", 300, "Full local Lighthouse");
requireAssertion(getAssertions(matrix, strictRoutePattern), "largest-contentful-paint", "error", "maxNumericValue", 2500, "Full local Lighthouse");
requireAssertion(getAssertions(matrix, generalRoutePattern), "largest-contentful-paint", "error", "maxNumericValue", 2750, "Full local Lighthouse");
requireAssertion(getAssertions(matrix, longArticlePattern), "largest-contentful-paint", "error", "maxNumericValue", 3000, "Full local Lighthouse");

const pullRequestUrls = pullRequestConfig?.ci?.collect?.url;
if (!Array.isArray(pullRequestUrls) || pullRequestUrls.length < 10) {
  failures.push("Pull request Lighthouse must audit at least ten representative routes.");
} else {
  for (const requiredRoute of [
    "http://localhost:3000/",
    "http://localhost:3000/knowledge",
    "http://localhost:3000/blog/screeps-memory-basics",
    "http://localhost:3000/tools/room-diagnostics",
    "http://localhost:3000/en",
    "http://localhost:3000/en/tools/room-diagnostics",
  ]) {
    if (!pullRequestUrls.includes(requiredRoute)) {
      failures.push(`Pull request Lighthouse is missing representative route ${requiredRoute}.`);
    }
  }
}
if (pullRequestConfig?.ci?.collect?.numberOfRuns !== 2) {
  failures.push("Pull request Lighthouse must collect two runs per representative route.");
}
if (
  pullRequestConfig?.ci?.upload?.target !== "filesystem"
  || pullRequestConfig?.ci?.upload?.outputDir !== "./lhci-pr-results"
) {
  failures.push(
    "Pull request Lighthouse reports must stay in ./lhci-pr-results for workflow artifact retention.",
  );
}
requireAssertion(pullRequestGlobalAssertions, "categories:performance", "error", "minScore", 0.85, "Pull request Lighthouse");
requireAssertion(pullRequestGlobalAssertions, "categories:accessibility", "error", "minScore", 0.95, "Pull request Lighthouse");
requireAssertion(pullRequestGlobalAssertions, "categories:best-practices", "error", "minScore", 0.9, "Pull request Lighthouse");
requireAssertion(pullRequestGlobalAssertions, "cumulative-layout-shift", "error", "maxNumericValue", 0.1, "Pull request Lighthouse");
requireAssertion(pullRequestGlobalAssertions, "total-blocking-time", "error", "maxNumericValue", 300, "Pull request Lighthouse");
requireAssertion(pullRequestGlobalAssertions, "largest-contentful-paint", "error", "maxNumericValue", 3000, "Pull request Lighthouse");

const productionUrls = productionConfig?.ci?.collect?.url;
if (!Array.isArray(productionUrls) || productionUrls.length < 8) {
  failures.push("Production Lighthouse must audit at least eight representative deployed routes.");
} else {
  if (productionUrls.some((url) => !url.startsWith("https://www.linqingan.com/"))) {
    failures.push("Production Lighthouse URLs must use the canonical HTTPS www host.");
  }
  for (const requiredRoute of [
    "https://www.linqingan.com/",
    "https://www.linqingan.com/blog",
    "https://www.linqingan.com/tools/room-diagnostics",
    "https://www.linqingan.com/en",
    "https://www.linqingan.com/en/tools/room-diagnostics",
  ]) {
    if (!productionUrls.includes(requiredRoute)) {
      failures.push(`Production Lighthouse is missing representative route ${requiredRoute}.`);
    }
  }
}

if (productionConfig?.ci?.collect?.numberOfRuns !== 2) {
  failures.push("Production Lighthouse must collect two runs per deployed route.");
}
if (
  productionConfig?.ci?.upload?.target !== "filesystem"
  || productionConfig?.ci?.upload?.outputDir !== "./lhci-production-results"
) {
  failures.push(
    "Production Lighthouse reports must stay in ./lhci-production-results for workflow artifact retention.",
  );
}

requireAssertion(productionGlobalAssertions, "categories:performance", "error", "minScore", 0.8, "Production Lighthouse");
requireAssertion(productionGlobalAssertions, "categories:accessibility", "error", "minScore", 0.95, "Production Lighthouse");
requireAssertion(productionGlobalAssertions, "categories:best-practices", "error", "minScore", 0.9, "Production Lighthouse");
requireAssertion(productionGlobalAssertions, "cumulative-layout-shift", "error", "maxNumericValue", 0.1, "Production Lighthouse");
requireAssertion(productionGlobalAssertions, "total-blocking-time", "error", "maxNumericValue", 400, "Production Lighthouse");
requireAssertion(productionGlobalAssertions, "largest-contentful-paint", "error", "maxNumericValue", 4000, "Production Lighthouse");

const lighthouseWorkflowPath = path.join(root, ".github", "workflows", "lighthouse.yml");
const lighthouseWorkflow = fs.existsSync(lighthouseWorkflowPath)
  ? fs.readFileSync(lighthouseWorkflowPath, "utf8")
  : "";
for (const requiredText of [
  "content/**",
  "schedule:",
  "pull-request-audit:",
  "full-build-audit:",
  "production-audit:",
  "lighthouserc.pr.json",
  "lighthouserc.production.json",
  "actions/upload-artifact@v4",
  "lhci-pr-results",
  "lhci-results",
  "lhci-production-results",
]) {
  if (!lighthouseWorkflow.includes(requiredText)) {
    failures.push(`Lighthouse workflow is missing ${requiredText}.`);
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
  "Performance budget check passed: pull requests use a two-run representative gate, weekly full builds use three-run route budgets, deployed canonical routes use a separate two-run baseline, and all reports are retained as artifacts.",
);
