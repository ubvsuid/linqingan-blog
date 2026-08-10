import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

type PlatformDatabase = NeonHttpDatabase<typeof schema>;

let cachedDatabase: PlatformDatabase | null = null;

export function hasPlatformDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPlatformDatabase(): PlatformDatabase | null {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return null;

  if (!cachedDatabase) {
    const client = neon(databaseUrl);
    cachedDatabase = drizzle({ client, schema });
  }

  return cachedDatabase;
}
