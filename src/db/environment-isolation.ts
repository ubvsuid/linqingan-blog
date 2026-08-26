import environmentPolicy from "../../database/environment-policy.json";

type DatabaseRuntime = "production" | "non-production";

type RuntimeEnvironment = Pick<NodeJS.ProcessEnv, "VERCEL_ENV">;

function isApprovedNeonHost(hostname: string, endpointId: string): boolean {
  const normalizedHostname = hostname.toLowerCase();
  const normalizedEndpointId = endpointId.toLowerCase();

  if (!normalizedHostname.endsWith(".neon.tech")) return false;

  return (
    normalizedHostname.startsWith(`${normalizedEndpointId}.`) ||
    normalizedHostname.startsWith(`${normalizedEndpointId}-pooler.`)
  );
}

export function getDatabaseRuntime(
  environment: RuntimeEnvironment = process.env,
): DatabaseRuntime {
  const vercelEnvironment = environment.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnvironment === "production") return "production";
  if (vercelEnvironment === "preview" || vercelEnvironment === "development") {
    return "non-production";
  }

  // Local builds, tests, and any unknown runtime default to the safer target.
  return "non-production";
}

export function assertDatabaseEnvironment(
  databaseUrl: string,
  environment: RuntimeEnvironment = process.env,
): void {
  const runtime = getDatabaseRuntime(environment);
  const target =
    runtime === "production"
      ? environmentPolicy.production
      : environmentPolicy.nonProduction;

  let parsedUrl: URL;
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
}
