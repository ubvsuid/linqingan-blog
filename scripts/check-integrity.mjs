import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const checks = [
  ["Knowledge generated registry freshness", "scripts/generate-knowledge-article-registry.mjs", "--check"],
  ["Beginner generated registry freshness", "scripts/generate-beginner-roadmap-registry.mjs", "--check"],
  ["Content Metadata Schema V1 contract", "scripts/check-content-metadata-schema-contract.mjs"],
  ["Content Metadata Schema V1", "scripts/check-content-metadata-schema.mjs"],
  ["Knowledge registry", "scripts/check-knowledge-registry.mjs"],
  ["Beginner roadmap", "scripts/check-beginner-roadmap.mjs"],
  ["Internal links", "scripts/check-internal-links.mjs"],
  ["Verification coverage", "scripts/check-verification-coverage.mjs"],
  ["Evidence Capture Kit", "scripts/check-evidence-capture-kit.mjs"],
];

for (const [label, script, ...args] of checks) {
  console.log(`\n[integrity] ${label}`);
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`\n[integrity] FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[integrity] PASS: ${checks.length} deterministic repository checks passed.`);
