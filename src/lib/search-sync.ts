import { eq, notInArray, sql } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { searchDocuments } from "@/db/schema";
import { getSearchDocuments } from "@/lib/search";

const SEARCH_SYNC_CHECK_INTERVAL_MS = 5 * 60 * 1000;

let lastCountCheckAt = 0;
let lastKnownSourceCount = -1;
let syncPromise: Promise<void> | null = null;

function toDatabaseDocument(document: ReturnType<typeof getSearchDocuments>[number]) {
  return {
    id: document.id,
    type: document.type,
    language: "zh-CN",
    title: document.title,
    description: document.description,
    href: document.href,
    module: document.meta,
    keywords: document.keywords,
    headings: [] as string[],
    searchText: document.text,
    sourceUpdatedAt: null,
    updatedAt: new Date(),
  };
}

async function synchronizeDocuments(): Promise<void> {
  const db = getPlatformDatabase();
  if (!db) return;

  const sourceDocuments = getSearchDocuments({ includeArticleText: true });
  const sourceCount = sourceDocuments.length;
  const now = Date.now();

  if (
    lastKnownSourceCount === sourceCount &&
    now - lastCountCheckAt < SEARCH_SYNC_CHECK_INTERVAL_MS
  ) {
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(searchDocuments)
    .where(eq(searchDocuments.language, "zh-CN"));
  const databaseCount = Number(countRow?.count ?? 0);

  lastCountCheckAt = now;
  lastKnownSourceCount = sourceCount;

  if (databaseCount === sourceCount && sourceCount > 0) return;

  const rows = sourceDocuments.map(toDatabaseDocument);
  if (rows.length === 0) return;

  for (let index = 0; index < rows.length; index += 50) {
    const batch = rows.slice(index, index + 50);
    await db
      .insert(searchDocuments)
      .values(batch)
      .onConflictDoUpdate({
        target: searchDocuments.id,
        set: {
          type: sql`excluded.type`,
          language: sql`excluded.language`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          href: sql`excluded.href`,
          module: sql`excluded.module`,
          keywords: sql`excluded.keywords`,
          headings: sql`excluded.headings`,
          searchText: sql`excluded.search_text`,
          sourceUpdatedAt: sql`excluded.source_updated_at`,
          updatedAt: sql`now()`,
        },
      });
  }

  const sourceIds = sourceDocuments.map((document) => document.id);
  await db
    .delete(searchDocuments)
    .where(
      sql`${searchDocuments.language} = 'zh-CN' AND ${notInArray(
        searchDocuments.id,
        sourceIds,
      )}`,
    );
}

export async function ensureSearchDocumentsReady(): Promise<void> {
  if (!getPlatformDatabase()) return;

  if (!syncPromise) {
    syncPromise = synchronizeDocuments().finally(() => {
      syncPromise = null;
    });
  }

  await syncPromise;
}
