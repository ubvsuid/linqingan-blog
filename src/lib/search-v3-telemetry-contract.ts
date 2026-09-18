import { problemResolverFlows } from "@/lib/problem-resolver";
import { SCREEPS_DOCTOR_LAUNCHES } from "@/lib/screeps-doctor-launcher";
import { screepsEntityGraph } from "@/lib/screeps-entity-intent";

export const SEARCH_V3_TELEMETRY_MAX_BODY_CHARS = 2048;

export const searchV3TelemetryEventNames = [
  "search_v3_route_shown",
  "search_v3_action_clicked",
  "search_v3_related_path_clicked",
  "search_v3_cluster_clicked",
] as const;

export const searchV3TelemetryLocales = ["zh", "en"] as const;
export const searchV3TelemetryIntentKinds = ["symptom", "api", "error"] as const;
export const searchV3TelemetryActionKinds = [
  "doctor",
  "resolver",
  "diagnostics",
  "api",
  "error",
] as const;
export const searchV3TelemetryRelatedKinds = [
  "api",
  "error",
  "hub",
  "guide",
  "tool",
  "verification",
] as const;
export const searchV3TelemetryClusterIds = [
  "memory-engineering",
  "spawn-lifecycle",
  "room-economy",
  "movement-vision",
  "controller-control",
  "construction-defense",
  "market-advanced-resources",
  "operations-debugging",
] as const;

export type SearchV3TelemetryLocale =
  (typeof searchV3TelemetryLocales)[number];
export type SearchV3TelemetryIntentKind =
  (typeof searchV3TelemetryIntentKinds)[number];
export type SearchV3TelemetryActionKind =
  (typeof searchV3TelemetryActionKinds)[number];
export type SearchV3TelemetryRelatedKind =
  (typeof searchV3TelemetryRelatedKinds)[number];
export type SearchV3TelemetryClusterId =
  (typeof searchV3TelemetryClusterIds)[number];

type CommonTelemetryFields = {
  routeVersion: 1;
  locale: SearchV3TelemetryLocale;
  intentKind: SearchV3TelemetryIntentKind;
  intentId: string;
  source: "route_card";
};

type RouteShownEvent = CommonTelemetryFields & {
  eventName: "search_v3_route_shown";
};

type ActionClickedEvent = CommonTelemetryFields & {
  eventName: "search_v3_action_clicked";
  actionKind: SearchV3TelemetryActionKind;
  targetId: string;
};

type RelatedPathClickedEvent = CommonTelemetryFields & {
  eventName: "search_v3_related_path_clicked";
  relatedKind: SearchV3TelemetryRelatedKind;
  targetId: string;
};

type ClusterClickedEvent = CommonTelemetryFields & {
  eventName: "search_v3_cluster_clicked";
  clusterId: SearchV3TelemetryClusterId;
};

export type SearchV3TelemetryEvent =
  | RouteShownEvent
  | ActionClickedEvent
  | RelatedPathClickedEvent
  | ClusterClickedEvent;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

const routeIntentKindById = new Map<string, SearchV3TelemetryIntentKind>(
  screepsEntityGraph.nodes
    .filter(
      (node) =>
        node.kind === "symptom" ||
        node.kind === "api" ||
        node.kind === "error",
    )
    .map((node) => [node.id, node.kind as SearchV3TelemetryIntentKind]),
);
routeIntentKindById.set("guide:/en/blog/screeps-arena-spawn-creep", "api");

const relatedKindById = new Map<string, SearchV3TelemetryRelatedKind>(
  screepsEntityGraph.nodes
    .filter((node) =>
      (searchV3TelemetryRelatedKinds as readonly string[]).includes(node.kind),
    )
    .map((node) => [node.id, node.kind as SearchV3TelemetryRelatedKind]),
);

const doctorTargetIds = new Set(
  SCREEPS_DOCTOR_LAUNCHES.map((entry) => entry.doctorSymptom),
);
const resolverTargetIds = new Set(problemResolverFlows.map((flow) => flow.flowId));
const diagnosticTargetIds = new Set(
  screepsEntityGraph.nodes
    .filter((node) => node.kind === "symptom")
    .map((node) => node.id.slice("symptom:".length)),
);
const apiTargetIds = new Set([
  ...screepsEntityGraph.nodes
    .filter((node) => node.kind === "api")
    .map((node) => node.id),
  "/en/blog/screeps-arena-spawn-creep",
]);
const errorTargetIds = new Set(
  screepsEntityGraph.nodes
    .filter((node) => node.kind === "error")
    .map((node) => node.id),
);
const clusterIds = new Set<string>(searchV3TelemetryClusterIds);

function isLocale(value: unknown): value is SearchV3TelemetryLocale {
  return value === "zh" || value === "en";
}

function isIntentKind(value: unknown): value is SearchV3TelemetryIntentKind {
  return (
    typeof value === "string" &&
    (searchV3TelemetryIntentKinds as readonly string[]).includes(value)
  );
}

function hasValidIntent(
  intentId: unknown,
  intentKind: SearchV3TelemetryIntentKind,
): intentId is string {
  return (
    typeof intentId === "string" &&
    routeIntentKindById.get(intentId) === intentKind
  );
}

function isActionKind(value: unknown): value is SearchV3TelemetryActionKind {
  return (
    typeof value === "string" &&
    (searchV3TelemetryActionKinds as readonly string[]).includes(value)
  );
}

function hasValidActionTarget(
  actionKind: SearchV3TelemetryActionKind,
  targetId: unknown,
): targetId is string {
  if (typeof targetId !== "string") return false;
  if (actionKind === "doctor") return doctorTargetIds.has(targetId);
  if (actionKind === "resolver") return resolverTargetIds.has(targetId);
  if (actionKind === "diagnostics") return diagnosticTargetIds.has(targetId);
  if (actionKind === "api") return apiTargetIds.has(targetId);
  return errorTargetIds.has(targetId);
}

function isRelatedKind(value: unknown): value is SearchV3TelemetryRelatedKind {
  return (
    typeof value === "string" &&
    (searchV3TelemetryRelatedKinds as readonly string[]).includes(value)
  );
}

function hasValidRelatedTarget(
  relatedKind: SearchV3TelemetryRelatedKind,
  targetId: unknown,
): targetId is string {
  return (
    typeof targetId === "string" &&
    relatedKindById.get(targetId) === relatedKind
  );
}

function hasValidCommonFields(
  value: Record<string, unknown>,
): value is Record<string, unknown> & CommonTelemetryFields {
  return (
    value.routeVersion === 1 &&
    isLocale(value.locale) &&
    isIntentKind(value.intentKind) &&
    hasValidIntent(value.intentId, value.intentKind) &&
    value.source === "route_card"
  );
}

export function parseSearchV3TelemetryEvent(
  value: unknown,
): SearchV3TelemetryEvent | null {
  if (!isRecord(value) || !hasValidCommonFields(value)) return null;

  if (value.eventName === "search_v3_route_shown") {
    if (
      !hasExactKeys(value, [
        "eventName",
        "routeVersion",
        "locale",
        "intentKind",
        "intentId",
        "source",
      ])
    ) return null;
    return value as RouteShownEvent;
  }

  if (value.eventName === "search_v3_action_clicked") {
    if (
      !hasExactKeys(value, [
        "eventName",
        "routeVersion",
        "locale",
        "intentKind",
        "intentId",
        "source",
        "actionKind",
        "targetId",
      ]) ||
      !isActionKind(value.actionKind) ||
      !hasValidActionTarget(value.actionKind, value.targetId)
    ) return null;
    return value as ActionClickedEvent;
  }

  if (value.eventName === "search_v3_related_path_clicked") {
    if (
      !hasExactKeys(value, [
        "eventName",
        "routeVersion",
        "locale",
        "intentKind",
        "intentId",
        "source",
        "relatedKind",
        "targetId",
      ]) ||
      !isRelatedKind(value.relatedKind) ||
      !hasValidRelatedTarget(value.relatedKind, value.targetId)
    ) return null;
    return value as RelatedPathClickedEvent;
  }

  if (value.eventName === "search_v3_cluster_clicked") {
    if (
      !hasExactKeys(value, [
        "eventName",
        "routeVersion",
        "locale",
        "intentKind",
        "intentId",
        "source",
        "clusterId",
      ]) ||
      typeof value.clusterId !== "string" ||
      !clusterIds.has(value.clusterId)
    ) return null;
    return value as ClusterClickedEvent;
  }

  return null;
}
