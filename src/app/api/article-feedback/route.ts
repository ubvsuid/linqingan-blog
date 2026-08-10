import { NextRequest, NextResponse } from "next/server";

import {
  articleFeedbackValues,
  persistArticleFeedback,
  type ArticleFeedbackValue,
} from "@/lib/platform-events";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ stored: false, error: "invalid_json" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const language = body.language;
  const value = body.value;

  if (
    !slug ||
    slug.length > 160 ||
    (language !== "zh-CN" && language !== "en") ||
    !value ||
    !articleFeedbackValues.includes(value as ArticleFeedbackValue)
  ) {
    return NextResponse.json(
      { stored: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const stored = await persistArticleFeedback({
    slug,
    language,
    value: value as ArticleFeedbackValue,
    identity: {
      anonymousId: request.headers.get("x-anonymous-id"),
      sessionId: request.headers.get("x-session-id"),
    },
  });

  return NextResponse.json(
    { stored },
    {
      status: stored ? 200 : 202,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
