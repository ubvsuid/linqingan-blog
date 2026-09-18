import { NextRequest, NextResponse } from "next/server";

import { persistSearchV3Event } from "@/lib/platform-events";
import {
  parseSearchV3TelemetryEvent,
  SEARCH_V3_TELEMETRY_MAX_BODY_CHARS,
} from "@/lib/search-v3-telemetry-contract";

export const dynamic = "force-dynamic";

function isSmokeRequest(request: NextRequest): boolean {
  return request.headers.get("x-platform-smoke-test") === "1";
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { stored: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  if (rawBody.length > SEARCH_V3_TELEMETRY_MAX_BODY_CHARS) {
    return NextResponse.json(
      { stored: false, error: "payload_too_large" },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json(
      { stored: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const event = parseSearchV3TelemetryEvent(body);
  if (!event) {
    return NextResponse.json(
      { stored: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  if (isSmokeRequest(request)) {
    return NextResponse.json(
      { stored: false, smoke: true },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  const stored = await persistSearchV3Event(event);
  return NextResponse.json(
    { stored },
    {
      status: stored ? 200 : 202,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
