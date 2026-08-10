import { NextRequest, NextResponse } from "next/server";

import { recordSearchQuery } from "@/lib/search-v2";

export const dynamic = "force-dynamic";

interface SearchEventBody {
  query?: string;
  resultCount?: number;
}

export async function POST(request: NextRequest) {
  let body: SearchEventBody;
  try {
    body = (await request.json()) as SearchEventBody;
  } catch {
    return NextResponse.json({ queryId: null, error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.query !== "string" ||
    !body.query.trim() ||
    body.query.length > 120 ||
    typeof body.resultCount !== "number" ||
    !Number.isFinite(body.resultCount)
  ) {
    return NextResponse.json(
      { queryId: null, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const queryId = await recordSearchQuery({
    query: body.query,
    resultCount: body.resultCount,
    identity: {
      anonymousId: request.headers.get("x-anonymous-id"),
      sessionId: request.headers.get("x-session-id"),
      sourcePath:
        request.headers.get("referer")?.replace(/^https?:\/\/[^/]+/i, "") ??
        "/search",
    },
  });

  return NextResponse.json(
    { queryId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
