import { NextRequest, NextResponse } from "next/server";

import {
  persistToolEvent,
  toolEventActions,
  toolIds,
  type ToolEventAction,
  type ToolId,
} from "@/lib/platform-events";

export const dynamic = "force-dynamic";

interface ToolEventBody {
  toolId?: string;
  action?: string;
  sourcePath?: string | null;
}

export async function POST(request: NextRequest) {
  let body: ToolEventBody;
  try {
    body = (await request.json()) as ToolEventBody;
  } catch {
    return NextResponse.json({ stored: false, error: "invalid_json" }, { status: 400 });
  }

  const toolId = body.toolId;
  const action = body.action;
  const sourcePath = body.sourcePath?.trim() || null;

  if (
    !toolId ||
    !toolIds.includes(toolId as ToolId) ||
    !action ||
    !toolEventActions.includes(action as ToolEventAction) ||
    (sourcePath !== null && sourcePath.length > 240)
  ) {
    return NextResponse.json(
      { stored: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  const stored = await persistToolEvent({
    toolId: toolId as ToolId,
    action: action as ToolEventAction,
    sourcePath,
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
