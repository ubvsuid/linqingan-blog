import { NextRequest, NextResponse } from "next/server";

import type { SearchDocument } from "@/lib/search";
import { recordSearchResultClick } from "@/lib/search-v2";

export const dynamic = "force-dynamic";

interface SearchClickBody {
  queryId?: number | null;
  query?: string;
  result?: SearchDocument;
  position?: number | null;
}

export async function POST(request: NextRequest) {
  let body: SearchClickBody;
  try {
    body = (await request.json()) as SearchClickBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.query || !body.result?.id || !body.result.href || !body.result.type) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  await recordSearchResultClick({
    queryId: typeof body.queryId === "number" ? body.queryId : null,
    query: body.query,
    result: body.result,
    position: typeof body.position === "number" ? body.position : null,
    identity: {
      anonymousId: request.headers.get("x-anonymous-id"),
      sessionId: request.headers.get("x-session-id"),
      sourcePath: "/search",
    },
  });

  return new NextResponse(null, { status: 204 });
}
