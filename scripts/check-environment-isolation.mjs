import fs from "node:fs";
import path from "node:path";

import {
  assertDatabaseEnvironment,
  classifyDatabaseRuntime,
} from "./lib/database-environment-isolation.mjs";

const root = process.cwd();
const failures = [];

const PROD_ENDPOINT = "ep-steep-hall-a6btsowh";
const DEV_ENDPOINT = "ep-misty-cloud-a6ldmtis";

function databaseUrl(endpointId, pooled = false) {
  const suffix = pooled ? "-pooler" : "";
  return `postgresql://user:secret@${endpointId}${suffix}.us-west-2.aws.neon.tech/neondb?sslmode=require`;
}

function expectPass(label, fn) {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: expected pass, got ${error instanceof Error ? error.message : String(error)}`);
  }
}

function expectFail(label, fn) {
  try {
    fn();
    failures.push(`${label}: expected rejection, but it passed`);
  } catch {
    // Expected.
  }
}

expectPass("production -> production endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(PROD_ENDPOINT), { DATABASE_RUNTIME: "production" }),
);
expectPass("production -> production pooled endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(PROD_ENDPOINT, true), { DATABASE_RUNTIME: "production" }),
);
expectPass("preview -> dev endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(DEV_ENDPOINT), { VERCEL_ENV: "preview" }),
);
expectPass("development -> dev pooled endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(DEV_ENDPOINT, true), { VERCEL_ENV: "development" }),
);
expectPass("local default -> dev endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(DEV_ENDPOINT), {}),
);
expectFail("production -> dev endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(DEV_ENDPOINT), { DATABASE_RUNTIME: "production" }),
);
expectFail("preview -> production endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(PROD_ENDPOINT), { VERCEL_ENV: "preview" }),
);
expectFail("local default -> production endpoint", () =>
  assertDatabaseEnvironment(databaseUrl(PROD_ENDPOINT), {}),
);
expectFail("unknown Neon endpoint", () =>
  assertDatabaseEnvironment(databaseUrl("ep-unknown-endpoint"), { DATABASE_RUNTIME: "production" }),
);
expectFail("non-Neon host", () =>
  assertDatabaseEnvironment("postgresql://user:secret@example.com/neondb", { DATABASE_RUNTIME: "production" }),
);
expectFail("malformed URL", () =>
  assertDatabaseEnvironment("not-a-url", { DATABASE_RUNTIME: "production" }),
);
expectFail("invalid explicit runtime", () =>
  classifyDatabaseRuntime({ DATABASE_RUNTIME: "prod" }),
);

const approvedDirectNeonFiles = new Set([
  "src/db/client.ts",
  "scripts/lib/database-environment-isolation.mjs",
]);
const checkerPath = "scripts/check-environment-isolation.mjs";
const codeExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);

function walk(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];

  const files = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const relativePath = path.posix.join(relativeDirectory.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) files.push(...walk(relativePath));
    else files.push(relativePath);
  }
  return files;
}

for (const relativePath of [...walk("src"), ...walk("scripts")]) {
  if (relativePath === checkerPath || !codeExtensions.has(path.extname(relativePath))) continue;
  const content = fs.readFileSync(path.join(root, relativePath), "utf8");
  const hasDirectNeonImport = content.includes("@neondatabase/serverless");
  const hasRawNeonConstruction = /\bneon\s*\(/.test(content);

  if ((hasDirectNeonImport || hasRawNeonConstruction) && !approvedDirectNeonFiles.has(relativePath)) {
    failures.push(
      `${relativePath}: direct Neon access bypasses the environment-isolation boundary`,
    );
  }
}

const workflowsDirectory = path.join(root, ".github", "workflows");
if (fs.existsSync(workflowsDirectory)) {
  for (const entry of fs.readdirSync(workflowsDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;
    const workflowPath = path.join(workflowsDirectory, entry.name);
    const content = fs.readFileSync(workflowPath, "utf8");
    if (content.includes("DATABASE_URL") && !content.includes("DATABASE_RUNTIME")) {
      failures.push(
        `.github/workflows/${entry.name}: DATABASE_URL is present without an explicit DATABASE_RUNTIME boundary`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Environment isolation check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Environment isolation check passed.");
console.log("- Runtime/endpoint mismatch matrix is fail-closed.");
console.log("- Direct Neon access is confined to approved boundary files.");
console.log("- DB-enabled GitHub workflows declare DATABASE_RUNTIME explicitly.");
