import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const checks = [
  ["Environment isolation", "scripts/check-environment-isolation.mjs"],
  ["Vercel deployment safety", "scripts/check-vercel-deployment-safety.mjs"],
  ["Backup / Recovery", "scripts/check-backup-recovery.mjs"],
  ["Evidence Model", "scripts/check-evidence-model.mjs"],
  ["Knowledge generated registry freshness", "scripts/generate-knowledge-article-registry.mjs", "--check"],
  ["Beginner generated registry freshness", "scripts/generate-beginner-roadmap-registry.mjs", "--check"],
  ["Content Metadata Schema V1 contract", "scripts/check-content-metadata-schema-contract.mjs"],
  ["Content Metadata Schema V1", "scripts/check-content-metadata-schema.mjs"],
  ["Knowledge Graph V1 durable identity readiness", "scripts/check-knowledge-graph-readiness.mjs"],
  ["Knowledge Graph V1 generated freshness", "scripts/generate-knowledge-graph-v1.mjs", "--check"],
  ["Knowledge Graph V1 contract and coverage", "scripts/check-knowledge-graph-v1.mjs"],
  ["Knowledge registry", "scripts/check-knowledge-registry.mjs"],
  ["Beginner roadmap", "scripts/check-beginner-roadmap.mjs"],
  ["Site Asset Master V2", "scripts/check-site-asset-master.mjs"],
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

console.log(
  `\n[integrity] PASS: ${checks.length} deterministic repository checks passed.`,
);
