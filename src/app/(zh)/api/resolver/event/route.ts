import { NextRequest, NextResponse } from "next/server";

import {
  getProblemResolverStep,
  problemResolverFlows,
} from "@/lib/problem-resolver";
import {
  parseResolverTelemetryEvent,
  type ResolverTelemetryEvent,
} from "@/lib/problem-resolver-telemetry-contract";
import { persistResolverEvent } from "@/lib/platform-events";

export const dynamic = "force-dynamic";

function isSmokeRequest(request: NextRequest): boolean {
  return request.headers.get("x-platform-smoke-test") === "1";
}

function matchesResolverRegistry(event: ResolverTelemetryEvent): boolean {
  const flow = problemResolverFlows.find((item) => item.flowId === event.flowId);
  if (!flow) return false;

  if (event.eventName === "flow_started") return true;

  if (event.eventName === "step_answered") {
    const step = event.stepId
      ? getProblemResolverStep(flow, event.stepId)
      : null;
    return Boolean(
      step &&
        step.kind === "question" &&
        event.optionId &&
        step.options.some((option) => option.id === event.optionId),
    );
  }

  const outcome = event.outcomeId
    ? getProblemResolverStep(flow, event.outcomeId)
    : null;
  if (!outcome || outcome.kind !== "outcome") return false;

  if (event.eventName === "outcome_reached") return true;
  if (event.eventName === "diagnostics_clicked") {
    return event.targetId === flow.symptomId;
  }
  if (event.eventName === "ticklab_clicked") {
    return outcome.tickLab === true && event.targetId === "tick-lab";
  }
  if (event.eventName === "tool_clicked") {
    return event.targetKind === "tool";
  }
  if (event.eventName === "guide_clicked") {
    return event.targetKind === "guide" || event.targetKind === "api";
  }
  return false;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { stored: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const event = parseResolverTelemetryEvent(body);
  if (!event || !matchesResolverRegistry(event)) {
    return NextResponse.json(
      { stored: false, error: "invalid_payload" },
      { status: 400 },
    );
  }

  if (isSmokeRequest(request)) {
    return NextResponse.json(
      { stored: false, smoke: true },
      {
        status: 202,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const stored = await persistResolverEvent({
    ...event,
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
