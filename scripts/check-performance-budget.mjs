import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lighthouseConfig = JSON.parse(
  fs.readFileSync(path.join(root, "lighthouserc.json"), "utf8"),
);
const failures = [];
const matrix = lighthouseConfig?.ci?.assert?.assertMatrix;
const globalAssertions = Array.isArray(matrix)
  ? matrix.find((entry) => entry.matchingUrlPattern === ".*")?.assertions
  : undefined;
const strictRoutePattern =
  "^http://localhost:3000/(?:tools/room-diagnostics|en/evidence)(?:\\?|$)";
const longArticlePattern =
  "^http://localhost:3000/blog/screeps-memory-basics(?:\\?|$)";
const generalRoutePattern =
  "^http://localhost:3000/(?!tools/room-diagnostics(?:\\?|$)|en/evidence(?:\\?|$)|blog/screeps-memory-basics(?:\\?|$)).*";

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

if (
  lighthouseConfig?.ci?.upload?.target !== "filesystem"
  || lighthouseConfig?.ci?.upload?.outputDir !== "./lhci-results"
) {
  failures.push(
    "Lighthouse reports must stay in the local filesystem instead of relying on a public upload service.",
  );
}

function getAssertions(pattern) {
  return Array.isArray(matrix)
    ? matrix.find((entry) => entry.matchingUrlPattern === pattern)?.assertions
    : undefined;
}

requireAssertion(
  globalAssertions,
  "categories:performance",
  "error",
  "minScore",
  0.85,
);
requireAssertion(
  globalAssertions,
  "total-blocking-time",
  "error",
  "maxNumericValue",
  300,
);
requireAssertion(
  getAssertions(strictRoutePattern),
  "largest-contentful-paint",
  "error",
  "maxNumericValue",
  2500,
);
requireAssertion(
  getAssertions(generalRoutePattern),
  "largest-contentful-paint",
  "error",
  "maxNumericValue",
  2750,
);
requireAssertion(
  getAssertions(longArticlePattern),
  "largest-contentful-paint",
  "error",
  "maxNumericValue",
  3000,
);

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
  "Performance budget check passed: Performance 85, TBT 300 ms, and staged hard LCP budgets of 2500/2750/3000 ms across three runs on Node 22.",
);
