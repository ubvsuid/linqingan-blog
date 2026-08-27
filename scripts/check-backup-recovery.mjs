import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const recovery = readJson("database/recovery-policy.json");
const environment = readJson("database/environment-policy.json");
const runbook = readText("database/BACKUP_RECOVERY.md");
const workflow = readText(".github/workflows/backup-recovery.yml");

expect(recovery.version === 1, "recovery-policy.json: version must be 1");
expect(
  recovery.neonProject?.projectId === "rough-smoke-93579849",
  "recovery-policy.json: unexpected Neon project ID",
);
expect(
  recovery.neonProject?.historyRetentionSeconds === 21600,
  "recovery-policy.json: verified history retention must be 21600 seconds",
);
expect(
  recovery.recovery?.maximumPitrLookbackSeconds === recovery.neonProject?.historyRetentionSeconds,
  "recovery-policy.json: PITR lookback must match the verified history-retention value",
);
expect(
  recovery.branches?.production?.name === environment.production?.neonBranch,
  "recovery policy production branch must match environment isolation",
);
expect(
  recovery.branches?.production?.endpointId === environment.production?.endpointId,
  "recovery policy production endpoint must match environment isolation",
);
expect(
  recovery.branches?.development?.name === environment.nonProduction?.neonBranch,
  "recovery policy development branch must match environment isolation",
);
expect(
  recovery.branches?.development?.endpointId === environment.nonProduction?.endpointId,
  "recovery policy development endpoint must match environment isolation",
);
expect(
  recovery.branches?.production?.branchId === "br-orange-wildflower-a619tssr",
  "recovery-policy.json: unexpected production branch ID",
);
expect(
  recovery.branches?.development?.branchId === "br-bold-sunset-a6tkdlek",
  "recovery-policy.json: unexpected development branch ID",
);
expect(
  recovery.guardrails?.automaticProductionRestore === false,
  "recovery-policy.json: automatic production restore must stay disabled",
);
expect(
  recovery.guardrails?.allowProductionWritesDuringDrill === false,
  "recovery-policy.json: recovery drills must not write production",
);
expect(
  recovery.guardrails?.allowVercelPreviewForRecoveryDrill === false,
  "recovery-policy.json: recovery drills must not use Vercel Preview",
);
expect(
  recovery.guardrails?.deleteDrillBranchAfterValidation === true,
  "recovery-policy.json: drill branches must be deleted after validation",
);
expect(
  recovery.guardrails?.requireCheckpointBeforeRiskyProductionDataOperation === true,
  "recovery-policy.json: risky production data operations require a checkpoint",
);
expect(
  recovery.guardrails?.requireOperatorConfirmationBeforeProductionRestore === true,
  "recovery-policy.json: production restore must require operator confirmation",
);

const requiredRunbookMarkers = [
  "21,600 seconds (6 hours)",
  "recovery-checkpoint-YYYYMMDD-HHmm",
  "Incident path A",
  "Incident path B",
  "Incident path C",
  "Never perform a production PITR merely as a routine test.",
  "`gpt-work-dev` is a development database, not a backup of production.",
  "It did **not** destructively exercise production PITR",
];

for (const marker of requiredRunbookMarkers) {
  expect(runbook.includes(marker), `BACKUP_RECOVERY.md: missing required marker: ${marker}`);
}

expect(
  workflow.includes("node scripts/check-backup-recovery.mjs"),
  "backup-recovery workflow must run the deterministic checker",
);
expect(
  !workflow.includes("DATABASE_URL"),
  "backup-recovery workflow must not receive DATABASE_URL",
);
expect(
  !workflow.includes("NEON_API_KEY"),
  "backup-recovery workflow must not receive NEON_API_KEY",
);
expect(
  !workflow.includes("vercel"),
  "backup-recovery workflow must not invoke Vercel",
);

if (failures.length > 0) {
  console.error("Backup / Recovery check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Backup / Recovery check passed.");
console.log("- Recovery policy matches Environment Isolation.");
console.log("- Six-hour Free-plan PITR boundary is explicit.");
console.log("- Production restore remains operator-controlled.");
console.log("- Recovery CI is static and receives no database or Neon credentials.");
