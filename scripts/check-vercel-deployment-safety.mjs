import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const failures = [];
const vercelConfigPath = path.join(root, "vercel.json");
const ignoreScriptPath = path.join(root, "scripts/vercel-ignore-build.mjs");

const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));
const deploymentEnabled = config.git?.deploymentEnabled;

if (deploymentEnabled?.["*"] !== false) {
  failures.push('vercel.json must keep git.deploymentEnabled["*"] = false.');
}
if (deploymentEnabled?.["clean-blog-v1"] !== true) {
  failures.push('vercel.json must keep git.deploymentEnabled["clean-blog-v1"] = true.');
}
if (config.ignoreCommand !== "node scripts/vercel-ignore-build.mjs") {
  failures.push("vercel.json must run the repository-owned Vercel ignored-build guard.");
}
if (!fs.existsSync(ignoreScriptPath)) {
  failures.push("Missing scripts/vercel-ignore-build.mjs.");
}

const cases = [
  { label: "Production branch", branch: "clean-blog-v1", expectedStatus: 1 },
  { label: "fixed dev branch", branch: "gpt-work", expectedStatus: 0 },
  { label: "historical release branch", branch: "release/tick-lab-v1", expectedStatus: 0 },
  { label: "generic feature branch", branch: "feature/example", expectedStatus: 0 },
  { label: "missing branch metadata", branch: null, expectedStatus: 1 },
];

for (const testCase of cases) {
  const env = { ...process.env };
  if (testCase.branch === null) delete env.VERCEL_GIT_COMMIT_REF;
  else env.VERCEL_GIT_COMMIT_REF = testCase.branch;

  const result = spawnSync(process.execPath, [ignoreScriptPath], {
    cwd: root,
    env,
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== testCase.expectedStatus) {
    failures.push(`${testCase.label}: expected exit ${testCase.expectedStatus}, got ${result.status}.`);
  }
}

if (failures.length > 0) {
  console.error("Vercel deployment safety check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Vercel deployment safety check passed: Production and unknown-ref builds fail open, while known non-production Git branches are ignored before the build step.");
