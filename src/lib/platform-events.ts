import { and, eq } from "drizzle-orm";

import { getPlatformDatabase } from "@/db/client";
import { articleFeedback, toolEvents } from "@/db/schema";

export const articleFeedbackValues = [
  "helpful",
  "partly",
  "not-solved",
  "outdated",
  "suggestion",
] as const;

export type ArticleFeedbackValue = (typeof articleFeedbackValues)[number];

export const toolEventActions = ["view", "use", "share", "reset", "report"] as const;
export type ToolEventAction = (typeof toolEventActions)[number];

export const toolIds = [
  "creep-body-calculator",
  "room-diagnostics",
  "market-terminal-cost-calculator",
  "controller-downgrade-planner",
  "lab-reaction-boost-planner",
  "spawn-queue-replacement-planner",
  "hauling-throughput-planner",
  "tower-damage-heal-repair-calculator",
] as const;
export type ToolId = (typeof toolIds)[number];

interface AnonymousIdentity {
  anonymousId?: string | null;
  sessionId?: string | null;
}

function cleanIdentity(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 80) : null;
}

export async function persistArticleFeedback(input: {
  slug: string;
  language: "zh-CN" | "en";
  value: ArticleFeedbackValue;
  identity?: AnonymousIdentity;
}): Promise<boolean> {
  const db = getPlatformDatabase();
  if (!db) return false;

  const anonymousId = cleanIdentity(input.identity?.anonymousId);
  const sessionId = cleanIdentity(input.identity?.sessionId);
  const values = {
    articleSlug: input.slug.slice(0, 160),
    language: input.language,
    helpful: input.value === "helpful",
    reason: input.value === "helpful" ? null : input.value,
    anonymousId,
    sessionId,
  };

  try {
    if (anonymousId) {
      const existing = await db
        .select({ id: articleFeedback.id })
        .from(articleFeedback)
        .where(
          and(
            eq(articleFeedback.articleSlug, values.articleSlug),
            eq(articleFeedback.language, values.language),
            eq(articleFeedback.anonymousId, anonymousId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(articleFeedback)
          .set({
            helpful: values.helpful,
            reason: values.reason,
            sessionId,
            createdAt: new Date(),
          })
          .where(eq(articleFeedback.id, existing[0].id));
        return true;
      }
    }

    await db.insert(articleFeedback).values(values);
    return true;
  } catch (error) {
    console.warn("Article feedback database write failed", error);
    return false;
  }
}

export async function persistToolEvent(input: {
  toolId: ToolId;
  action: ToolEventAction;
  sourcePath?: string | null;
  identity?: AnonymousIdentity;
}): Promise<boolean> {
  const db = getPlatformDatabase();
  if (!db) return false;

  try {
    await db.insert(toolEvents).values({
      toolId: input.toolId,
      action: input.action,
      sourcePath: input.sourcePath?.slice(0, 240) || null,
      anonymousId: cleanIdentity(input.identity?.anonymousId),
      sessionId: cleanIdentity(input.identity?.sessionId),
      metadata: {},
    });
    return true;
  } catch (error) {
    console.warn("Tool event database write failed", error);
    return false;
  }
}
