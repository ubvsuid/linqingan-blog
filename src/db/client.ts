import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { assertDatabaseEnvironment } from "@/db/environment-isolation";

type PlatformDatabase = NeonHttpDatabase<typeof schema>;

let cachedDatabase: PlatformDatabase | null = null;

export function hasPlatformDatabase(): boolean {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return false;

  assertDatabaseEnvironment(databaseUrl);
  return true;
}

export function getPlatformDatabase(): PlatformDatabase | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  assertDatabaseEnvironment(databaseUrl);

  if (!cachedDatabase) {
    const client = neon(databaseUrl);
    cachedDatabase = drizzle({ client, schema });
  }

  return cachedDatabase;
}
