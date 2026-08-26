import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const environmentPolicy = JSON.parse(
  readFileSync(new URL("../../database/environment-policy.json", import.meta.url), "utf8"),
);

function isApprovedNeonHost(hostname, endpointId) {
  const normalizedHostname = String(hostname || "").toLowerCase();
  const normalizedEndpointId = String(endpointId || "").toLowerCase();

  if (!normalizedHostname.endsWith(".neon.tech")) return false;

  return (
    normalizedHostname.startsWith(`${normalizedEndpointId}.`) ||
    normalizedHostname.startsWith(`${normalizedEndpointId}-pooler.`)
  );
}

export function classifyDatabaseRuntime(environment = process.env) {
  const explicitRuntime = environment.DATABASE_RUNTIME?.trim().toLowerCase();
  if (explicitRuntime === "production" || explicitRuntime === "non-production") {
    return explicitRuntime;
  }
  if (explicitRuntime) {
    throw new Error(
      "Database environment isolation rejected DATABASE_RUNTIME; use production or non-production.",
    );
  }

  const vercelEnvironment = environment.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnvironment === "production") return "production";
  if (vercelEnvironment === "preview" || vercelEnvironment === "development") {
    return "non-production";
  }

  return "non-production";
}

export function assertDatabaseEnvironment(databaseUrl, environment = process.env) {
  if (!databaseUrl?.trim()) {
    throw new Error("DATABASE_URL is required.");
  }

  const runtime = classifyDatabaseRuntime(environment);
  const target =
    runtime === "production"
      ? environmentPolicy.production
      : environmentPolicy.nonProduction;

  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("Database environment isolation rejected an invalid DATABASE_URL.");
  }

  if (!isApprovedNeonHost(parsedUrl.hostname, target.endpointId)) {
    throw new Error(
      `Database environment isolation blocked ${runtime} from using a Neon endpoint outside the approved ${target.neonBranch} branch.`,
    );
  }

  return {
    runtime,
    neonBranch: target.neonBranch,
    endpointId: target.endpointId,
  };
}

export function createIsolatedNeon(databaseUrl, environment = process.env) {
  assertDatabaseEnvironment(databaseUrl, environment);
  return neon(databaseUrl);
}
