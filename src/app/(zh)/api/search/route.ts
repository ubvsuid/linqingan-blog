import { NextRequest, NextResponse } from "next/server";

import { searchV2 } from "@/lib/search-v2";

export const dynamic = "force-dynamic";

function getIdentity(request: NextRequest) {
  return {
    anonymousId: request.headers.get("x-anonymous-id"),
    sessionId: request.headers.get("x-session-id"),
    sourcePath: request.headers.get("referer")?.replace(/^https?:\/\/[^/]+/i, "") ?? "/search",
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type");
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 20;

  const payload = await searchV2(query, {
    type,
    limit,
    identity: getIdentity(request),
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "X-Search-Version": "2",
      "X-Search-Source": payload.source,
    },
  });
}
