export const resolverTelemetryEventNames = [
  "flow_started",
  "step_answered",
  "outcome_reached",
  "diagnostics_clicked",
  "guide_clicked",
  "tool_clicked",
  "ticklab_clicked",
] as const;

export type ResolverTelemetryEventName =
  (typeof resolverTelemetryEventNames)[number];

export const resolverTelemetryTargetKinds = [
  "diagnostics",
  "guide",
  "api",
  "tool",
  "ticklab",
] as const;

export type ResolverTelemetryTargetKind =
  (typeof resolverTelemetryTargetKinds)[number];

export interface ResolverTelemetryEvent {
  eventName: ResolverTelemetryEventName;
  flowId: string;
  language: "zh" | "en";
  stepId?: string;
  optionId?: string;
  outcomeId?: string;
  targetId?: string;
  targetKind?: ResolverTelemetryTargetKind;
}

const allowedKeys = new Set([
  "eventName",
  "flowId",
  "language",
  "stepId",
  "optionId",
  "outcomeId",
  "targetId",
  "targetKind",
]);

const optionalIdentifierKeys = [
  "stepId",
  "optionId",
  "outcomeId",
  "targetId",
] as const;

const stableIdentifierPattern = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,159}$/;

function isStableIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    stableIdentifierPattern.test(value)
  );
}

function isEventName(value: unknown): value is ResolverTelemetryEventName {
  return (
    typeof value === "string" &&
    resolverTelemetryEventNames.includes(value as ResolverTelemetryEventName)
  );
}

function isTargetKind(value: unknown): value is ResolverTelemetryTargetKind {
  return (
    typeof value === "string" &&
    resolverTelemetryTargetKinds.includes(value as ResolverTelemetryTargetKind)
  );
}

function eventFieldShape(
  eventName: ResolverTelemetryEventName,
): {
  required: readonly (typeof optionalIdentifierKeys)[number][];
  allowsTargetKind: boolean;
} {
  if (eventName === "step_answered") {
    return { required: ["stepId", "optionId"], allowsTargetKind: false };
  }
  if (eventName === "outcome_reached") {
    return { required: ["outcomeId"], allowsTargetKind: false };
  }
  if (
    eventName === "diagnostics_clicked" ||
    eventName === "guide_clicked" ||
    eventName === "tool_clicked" ||
    eventName === "ticklab_clicked"
  ) {
    return {
      required: ["outcomeId", "targetId"],
      allowsTargetKind: true,
    };
  }
  return { required: [], allowsTargetKind: false };
}

export function parseResolverTelemetryEvent(
  input: unknown,
): ResolverTelemetryEvent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some((key) => !allowedKeys.has(key))) return null;
  if (!isEventName(raw.eventName)) return null;
  if (!isStableIdentifier(raw.flowId)) return null;
  if (raw.language !== "zh" && raw.language !== "en") return null;

  for (const key of optionalIdentifierKeys) {
    if (raw[key] !== undefined && !isStableIdentifier(raw[key])) return null;
  }

  const shape = eventFieldShape(raw.eventName);
  for (const key of optionalIdentifierKeys) {
    const allowed = shape.required.includes(key);
    if (allowed && !isStableIdentifier(raw[key])) return null;
    if (!allowed && raw[key] !== undefined) return null;
  }

  if (shape.allowsTargetKind) {
    if (!isTargetKind(raw.targetKind)) return null;
  } else if (raw.targetKind !== undefined) {
    return null;
  }

  if (
    raw.eventName === "diagnostics_clicked" &&
    raw.targetKind !== "diagnostics"
  ) {
    return null;
  }
  if (
    raw.eventName === "guide_clicked" &&
    raw.targetKind !== "guide" &&
    raw.targetKind !== "api"
  ) {
    return null;
  }
  if (raw.eventName === "tool_clicked" && raw.targetKind !== "tool") {
    return null;
  }
  if (raw.eventName === "ticklab_clicked" && raw.targetKind !== "ticklab") {
    return null;
  }

  return {
    eventName: raw.eventName,
    flowId: raw.flowId,
    language: raw.language,
    ...(typeof raw.stepId === "string" ? { stepId: raw.stepId } : {}),
    ...(typeof raw.optionId === "string" ? { optionId: raw.optionId } : {}),
    ...(typeof raw.outcomeId === "string" ? { outcomeId: raw.outcomeId } : {}),
    ...(typeof raw.targetId === "string" ? { targetId: raw.targetId } : {}),
    ...(isTargetKind(raw.targetKind) ? { targetKind: raw.targetKind } : {}),
  };
}
