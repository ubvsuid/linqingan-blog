import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { assertDatabaseEnvironment } from "@/db/environment-isolation";

type PlatformDatabase = NeonHttpDatabase<typeof schema>;
type PlatformSql = ReturnType<typeof neon>;

let cachedDatabase: PlatformDatabase | null = null;
let cachedSql: PlatformSql | null = null;

export function hasPlatformDatabase(): boolean {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return false;

  assertDatabaseEnvironment(databaseUrl);
  return true;
}

export function getPlatformSql(): PlatformSql | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  assertDatabaseEnvironment(databaseUrl);

  if (!cachedSql) {
    cachedSql = neon(databaseUrl);
  }

  return cachedSql;
}

export function getPlatformDatabase(): PlatformDatabase | null {
  const client = getPlatformSql();
  if (!client) return null;

  if (!cachedDatabase) {
    cachedDatabase = drizzle({ client, schema });
  }

  return cachedDatabase;
}
