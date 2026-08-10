import { NextRequest, NextResponse } from "next/server";

import { getPlatformDatabase } from "@/db/client";
import { articleFeedback } from "@/db/schema";

export const dynamic = "force-dynamic";

const validValues = new Set([
  "helpful",
  "partly",
  "not-solved",
  "outdated",
  "suggestion",
]);

interface FeedbackBody {
  slug?: string;
  language?: "zh-CN" | "en";
  value?: string;
}

export async function POST(request: NextRequest) {
  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const language = body.language;
  const value = body.value;

  if (
    !slug ||
    slug.length > 160 ||
    (language !== "zh-CN" && language !== "en") ||
    !value ||
    !validValues.has(value)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const db = getPlatformDatabase();
  if (!db) {
    return NextResponse.json({ ok: true, stored: false }, { status: 202 });
  }

  try {
    await db.insert(articleFeedback).values({
      articleSlug: slug,
      language,
      helpful: value === "helpful",
      reason: value === "helpful" ? null : value,
      anonymousId: request.headers.get("x-anonymous-id")?.slice(0, 80) || null,
      sessionId: request.headers.get("x-session-id")?.slice(0, 80) || null,
    });
  } catch (error) {
    console.warn("Article feedback database write failed", error);
    return NextResponse.json({ ok: true, stored: false }, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
