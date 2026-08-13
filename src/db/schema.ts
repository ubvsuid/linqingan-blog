import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  pgView,
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
  (table) => [
    index("search_queries_created_at_idx").on(table.createdAt),
    check("search_queries_result_count_nonnegative", sql`${table.resultCount} >= 0`),
  ],
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
    check("search_clicks_position_nonnegative", sql`${table.position} >= 0`),
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
    evidenceKey: text("evidence_key").notNull(),
    articleSlug: text("article_slug").notNull(),
    language: text("language").notNull().default("zh-CN"),
    verificationType: text("verification_type").notNull(),
    status: text("status").notNull().default("captured"),
    gameTime: bigint("game_time", { mode: "number" }),
    shard: text("shard"),
    roomName: text("room_name"),
    apiName: text("api_name").notNull(),
    returnCode: text("return_code"),
    beforeState: jsonb("before_state").$type<Record<string, unknown> | null>(),
    afterState: jsonb("after_state").$type<Record<string, unknown> | null>(),
    tickStart: bigint("tick_start", { mode: "number" }),
    tickEnd: bigint("tick_end", { mode: "number" }),
    evidenceNote: text("evidence_note").notNull(),
    sourceRef: text("source_ref").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedReason: text("revoked_reason"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("verification_evidence_key_uidx").on(table.evidenceKey),
    index("verification_evidence_article_idx").on(table.articleSlug, table.verifiedAt),
    index("verification_evidence_type_idx").on(table.verificationType, table.verifiedAt),
    index("verification_evidence_status_idx").on(table.status, table.verifiedAt),
  ],
);

export const publicVerificationEvidence = pgView(
  "verification_evidence_public",
  {
    id: bigint("id", { mode: "number" }).notNull(),
    evidenceKey: text("evidence_key").notNull(),
    articleSlug: text("article_slug").notNull(),
    language: text("language").notNull(),
    verificationType: text("verification_type").notNull(),
    gameTime: bigint("game_time", { mode: "number" }),
    shard: text("shard"),
    roomName: text("room_name"),
    apiName: text("api_name").notNull(),
    returnCode: text("return_code"),
    tickStart: bigint("tick_start", { mode: "number" }),
    tickEnd: bigint("tick_end", { mode: "number" }),
    evidenceNote: text("evidence_note").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  },
).existing();
