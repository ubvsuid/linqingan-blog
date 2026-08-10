import { and, desc, eq, or, sql } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { searchClicks, searchDocuments, searchQueries } from "@/db/schema";
import {
  getSearchDocuments,
  type SearchDocument,
  type SearchDocumentType,
} from "@/lib/search";

export const SEARCH_V2_DEFAULT_LIMIT = 20;
export const SEARCH_V2_MAX_LIMIT = 40;

export type SearchV2Source = "database" | "static";

export interface SearchV2Response {
  query: string;
  normalizedQuery: string;
  results: SearchDocument[];
  total: number;
  source: SearchV2Source;
  queryId: number | null;
}

export interface SearchIdentity {
  anonymousId?: string | null;
  sessionId?: string | null;
  sourcePath?: string | null;
}

const synonymGroups = [
  ["采集", "harvest", "source"],
  ["运输", "搬运", "transfer", "withdraw", "hauling"],
  ["升级", "upgrade", "upgradecontroller", "controller", "upgrader"],
  ["工地", "建造", "construction", "constructionsite", "build"],
  ["维修", "repair"],
  ["没能量", "能量不足", "energy", "err_not_enough_energy"],
  ["距离不足", "够不到", "err_not_in_range"],
  ["身体", "body", "部件", "bodypart", "bodypart_cost"],
  ["移动速度", "走得慢", "fatigue", "move", "moveto"],
  ["出生", "生成", "孵化", "spawn", "spawncreep"],
  ["内存", "记忆", "memory"],
  ["市场", "market", "terminal"],
  ["控制器", "controller", "rcl", "gcl"],
  ["塔", "炮塔", "tower"],
  ["实验室", "lab", "boost", "reaction"],
] as const;

const validTypes = new Set<SearchDocumentType>([
  "文章",
  "术语",
  "错误码",
  "工具",
  "项目",
]);

export function normalizeSearchQuery(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("zh-CN")
    .slice(0, 120);
}

function expandSearchTerms(query: string): string[] {
  const normalized = normalizeSearchQuery(query);
  const terms = new Set(normalized.split(/\s+/).filter(Boolean));

  for (const group of synonymGroups) {
    if (group.some((term) => normalized.includes(term))) {
      for (const term of group) terms.add(term);
    }
  }

  return [...terms].slice(0, 32);
}

function parseType(value?: string | null): SearchDocumentType | null {
  if (!value || value === "全部") return null;
  return validTypes.has(value as SearchDocumentType)
    ? (value as SearchDocumentType)
    : null;
}

function staticScore(document: SearchDocument, terms: string[]): number {
  const title = normalizeSearchQuery(document.title);
  const description = normalizeSearchQuery(document.description);
  const meta = normalizeSearchQuery(document.meta);
  const keywords = normalizeSearchQuery(document.keywords.join(" "));
  const text = normalizeSearchQuery(document.text);
  let score = 0;

  for (const term of terms) {
    if (title === term) score += 100;
    else if (title.startsWith(term)) score += 80;
    else if (title.includes(term)) score += 60;

    if (keywords.includes(term)) score += 35;
    if (description.includes(term)) score += 20;
    if (meta.includes(term)) score += 12;
    if (text.includes(term)) score += 5;
  }

  return score;
}

function rankStaticDocuments(
  query: string,
  type: SearchDocumentType | null,
  limit: number,
): SearchDocument[] {
  const terms = expandSearchTerms(query);
  if (terms.length === 0) return [];

  return getSearchDocuments({ includeArticleText: true })
    .filter((document) => !type || document.type === type)
    .map((document) => ({ document, score: staticScore(document, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.document.title.localeCompare(right.document.title, "zh-CN"))
    .slice(0, limit)
    .map((entry) => entry.document);
}

async function searchDatabase(
  query: string,
  type: SearchDocumentType | null,
  limit: number,
): Promise<SearchDocument[] | null> {
  const db = getPlatformDatabase();
  if (!db) return null;

  const normalized = normalizeSearchQuery(query);
  const expanded = expandSearchTerms(query).join(" ");
  const contains = `%${normalized}%`;
  const prefix = `${normalized}%`;
  const ftsVector = sql`to_tsvector('simple', coalesce(${searchDocuments.title}, '') || ' ' || coalesce(${searchDocuments.description}, '') || ' ' || coalesce(${searchDocuments.searchText}, ''))`;
  const ftsQuery = sql`websearch_to_tsquery('simple', ${expanded})`;
  const score = sql<number>`(
    CASE
      WHEN lower(${searchDocuments.title}) = ${normalized} THEN 100
      WHEN lower(${searchDocuments.title}) LIKE ${prefix} THEN 80
      WHEN lower(${searchDocuments.title}) LIKE ${contains} THEN 60
      ELSE 0
    END
    + CASE WHEN lower(${searchDocuments.keywords}::text) LIKE ${contains} THEN 35 ELSE 0 END
    + CASE WHEN lower(${searchDocuments.description}) LIKE ${contains} THEN 20 ELSE 0 END
    + CASE WHEN lower(coalesce(${searchDocuments.module}, '')) LIKE ${contains} THEN 12 ELSE 0 END
    + CASE WHEN lower(${searchDocuments.searchText}) LIKE ${contains} THEN 5 ELSE 0 END
    + similarity(lower(${searchDocuments.title}), ${normalized}) * 30
    + ts_rank(${ftsVector}, ${ftsQuery}) * 25
  )`.mapWith(Number);

  const matchCondition = or(
    sql`lower(${searchDocuments.title}) LIKE ${contains}`,
    sql`lower(${searchDocuments.description}) LIKE ${contains}`,
    sql`lower(${searchDocuments.keywords}::text) LIKE ${contains}`,
    sql`lower(${searchDocuments.searchText}) LIKE ${contains}`,
    sql`${ftsVector} @@ ${ftsQuery}`,
    sql`similarity(lower(${searchDocuments.title}), ${normalized}) >= 0.18`,
  );

  const filters = [eq(searchDocuments.language, "zh-CN"), matchCondition];
  if (type) filters.push(eq(searchDocuments.type, type));

  const rows = await db
    .select({
      id: searchDocuments.id,
      type: searchDocuments.type,
      title: searchDocuments.title,
      description: searchDocuments.description,
      href: searchDocuments.href,
      module: searchDocuments.module,
      keywords: searchDocuments.keywords,
      score,
    })
    .from(searchDocuments)
    .where(and(...filters))
    .orderBy(desc(score), searchDocuments.title)
    .limit(limit);

  return rows
    .filter((row) => validTypes.has(row.type as SearchDocumentType))
    .map((row) => ({
      id: row.id,
      type: row.type as SearchDocumentType,
      title: row.title,
      description: row.description,
      href: row.href,
      meta: row.module || row.type,
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      text: "",
    }));
}

async function recordSearchQuery(
  query: string,
  normalizedQuery: string,
  resultCount: number,
  identity: SearchIdentity,
): Promise<number | null> {
  const db = getPlatformDatabase();
  if (!db) return null;

  try {
    const [row] = await db
      .insert(searchQueries)
      .values({
        anonymousId: identity.anonymousId?.slice(0, 80) || null,
        sessionId: identity.sessionId?.slice(0, 80) || null,
        language: "zh-CN",
        query: query.slice(0, 120),
        normalizedQuery,
        resultCount,
        sourcePath: identity.sourcePath?.slice(0, 240) || null,
      })
      .returning({ id: searchQueries.id });
    return row?.id ?? null;
  } catch (error) {
    console.warn("Search V2 analytics write failed", error);
    return null;
  }
}

export async function searchV2(
  query: string,
  options: {
    type?: string | null;
    limit?: number;
    identity?: SearchIdentity;
  } = {},
): Promise<SearchV2Response> {
  const normalizedQuery = normalizeSearchQuery(query);
  const type = parseType(options.type);
  const limit = Math.max(
    1,
    Math.min(options.limit ?? SEARCH_V2_DEFAULT_LIMIT, SEARCH_V2_MAX_LIMIT),
  );

  if (!normalizedQuery) {
    return {
      query: "",
      normalizedQuery: "",
      results: [],
      total: 0,
      source: getPlatformDatabase() ? "database" : "static",
      queryId: null,
    };
  }

  let results: SearchDocument[];
  let source: SearchV2Source = "static";

  try {
    const databaseResults = await searchDatabase(normalizedQuery, type, limit);
    if (databaseResults && databaseResults.length > 0) {
      results = databaseResults;
      source = "database";
    } else {
      results = rankStaticDocuments(normalizedQuery, type, limit);
    }
  } catch (error) {
    console.warn("Search V2 database query failed; using static fallback", error);
    results = rankStaticDocuments(normalizedQuery, type, limit);
  }

  const queryId = await recordSearchQuery(
    query.trim(),
    normalizedQuery,
    results.length,
    options.identity ?? {},
  );

  return {
    query: query.trim(),
    normalizedQuery,
    results,
    total: results.length,
    source,
    queryId,
  };
}

export async function recordSearchResultClick(input: {
  queryId?: number | null;
  query: string;
  result: SearchDocument;
  position?: number | null;
  identity?: SearchIdentity;
}): Promise<void> {
  const db = getPlatformDatabase();
  if (!db) return;

  try {
    await db.insert(searchClicks).values({
      searchQueryId: input.queryId ?? null,
      anonymousId: input.identity?.anonymousId?.slice(0, 80) || null,
      sessionId: input.identity?.sessionId?.slice(0, 80) || null,
      query: input.query.trim().slice(0, 120),
      resultId: input.result.id.slice(0, 160),
      resultType: input.result.type.slice(0, 40),
      resultHref: input.result.href.slice(0, 320),
      position: input.position ?? null,
    });
  } catch (error) {
    console.warn("Search V2 click analytics write failed", error);
  }
}
