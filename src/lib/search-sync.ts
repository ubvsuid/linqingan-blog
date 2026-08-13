import { notInArray, sql } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { searchDocuments } from "@/db/schema";
import { parseDateOnlyUtc } from "@/lib/posts";
import { getSearchDocuments } from "@/lib/search";

const SEARCH_SYNC_CHECK_INTERVAL_MS = 5 * 60 * 1000;

let lastSuccessfulSyncAt = 0;
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
    sourceUpdatedAt: document.sourceUpdatedAt
      ? parseDateOnlyUtc(document.sourceUpdatedAt)
      : null,
    updatedAt: new Date(),
  };
}

async function synchronizeDocuments(): Promise<void> {
  const db = getPlatformDatabase();
  if (!db) return;

  const sourceDocuments = getSearchDocuments({
    includeArticleText: true,
    includeSourceMetadata: true,
  });
  const now = Date.now();

  if (now - lastSuccessfulSyncAt < SEARCH_SYNC_CHECK_INTERVAL_MS) {
    return;
  }

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
        setWhere: sql`
          ${searchDocuments.type} IS DISTINCT FROM excluded.type OR
          ${searchDocuments.language} IS DISTINCT FROM excluded.language OR
          ${searchDocuments.title} IS DISTINCT FROM excluded.title OR
          ${searchDocuments.description} IS DISTINCT FROM excluded.description OR
          ${searchDocuments.href} IS DISTINCT FROM excluded.href OR
          ${searchDocuments.module} IS DISTINCT FROM excluded.module OR
          ${searchDocuments.keywords} IS DISTINCT FROM excluded.keywords OR
          ${searchDocuments.headings} IS DISTINCT FROM excluded.headings OR
          ${searchDocuments.searchText} IS DISTINCT FROM excluded.search_text OR
          ${searchDocuments.sourceUpdatedAt} IS DISTINCT FROM excluded.source_updated_at
        `,
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

  lastSuccessfulSyncAt = Date.now();
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
