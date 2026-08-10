import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const searchDocuments = pgTable(
  "search_documents",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    language: text("language").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    href: text("href").notNull(),
    module: text("module"),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    headings: jsonb("headings").$type<string[]>().notNull().default([]),
    searchText: text("search_text").notNull().default(""),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("search_documents_language_href_uidx").on(table.language, table.href),
    index("search_documents_type_language_idx").on(table.type, table.language),
  ],
);

export const searchQueries = pgTable(
  "search_queries",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    anonymousId: text("anonymous_id"),
    sessionId: text("session_id"),
    language: text("language").notNull(),
    query: text("query").notNull(),
    normalizedQuery: text("normalized_query").notNull(),
    resultCount: integer("result_count").notNull().default(0),
    sourcePath: text("source_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("search_queries_created_at_idx").on(table.createdAt)],
);

export const searchClicks = pgTable(
  "search_clicks",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    searchQueryId: bigint("search_query_id", { mode: "number" }).references(
      () => searchQueries.id,
      { onDelete: "set null" },
    ),
    anonymousId: text("anonymous_id"),
    sessionId: text("session_id"),
    query: text("query").notNull(),
    resultId: text("result_id"),
    resultType: text("result_type"),
    resultHref: text("result_href").notNull(),
    position: integer("position"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("search_clicks_created_at_idx").on(table.createdAt),
    index("search_clicks_result_href_idx").on(table.resultHref),
  ],
);

export const articleFeedback = pgTable(
  "article_feedback",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    articleSlug: text("article_slug").notNull(),
    language: text("language").notNull(),
    helpful: boolean("helpful").notNull(),
    reason: text("reason"),
    anonymousId: text("anonymous_id"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("article_feedback_article_idx").on(table.articleSlug, table.language, table.createdAt)],
);

export const toolEvents = pgTable(
  "tool_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    toolId: text("tool_id").notNull(),
    action: text("action").notNull(),
    sourcePath: text("source_path"),
    anonymousId: text("anonymous_id"),
    sessionId: text("session_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("tool_events_tool_created_idx").on(table.toolId, table.createdAt)],
);

export const verificationEvidence = pgTable(
  "verification_evidence",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
    articleSlug: text("article_slug").notNull(),
    language: text("language").notNull().default("zh-CN"),
    verificationType: text("verification_type").notNull(),
    gameTime: bigint("game_time", { mode: "number" }),
    shard: text("shard"),
    roomName: text("room_name"),
    apiName: text("api_name"),
    returnCode: text("return_code"),
    beforeState: jsonb("before_state").$type<Record<string, unknown> | null>(),
    afterState: jsonb("after_state").$type<Record<string, unknown> | null>(),
    tickStart: bigint("tick_start", { mode: "number" }),
    tickEnd: bigint("tick_end", { mode: "number" }),
    evidenceNote: text("evidence_note"),
    sourceRef: text("source_ref"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("verification_evidence_article_idx").on(table.articleSlug, table.verifiedAt),
    index("verification_evidence_type_idx").on(table.verificationType, table.verifiedAt),
  ],
);
