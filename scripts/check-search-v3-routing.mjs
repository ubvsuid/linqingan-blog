import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function resolveTypeScript(basePath) {
  for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = `${basePath}${suffix}`;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return resolveTypeScript(path.join(root, "src", specifier.slice(2)))
        ?? nextResolve(specifier, context);
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../"))
      && context.parentURL?.startsWith("file:")
    ) {
      return resolveTypeScript(
        path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier),
      ) ?? nextResolve(specifier, context);
    }
    return nextResolve(specifier, context);
  },
});

const {
  SEARCH_ROUTE_V1_ACCEPTANCE_CASES,
  buildSearchRouteV1,
} = await import("../src/lib/search-route-v1.ts");
const {
  getProblemResolverDeepLink,
  parseProblemResolverFlowId,
  problemResolverFlows,
} = await import("../src/lib/problem-resolver.ts");
const {
  SCREEPS_DOCTOR_LAUNCHES,
  getScreepsDoctorDeepLink,
  parseScreepsDoctorLaunchSymptom,
} = await import("../src/lib/screeps-doctor-launcher.ts");
const {
  getScreepsIntentPromotions,
  screepsIntentAcceptanceCases,
} = await import("../src/lib/screeps-entity-intent.ts");
const { GRAPH_SEARCH_ANCHOR_MIN_SCORE } = await import(
  "../src/lib/knowledge-graph-search-policy.ts"
);
const {
  parseSearchV3TelemetryEvent,
} = await import("../src/lib/search-v3-telemetry-contract.ts");

for (const fixture of SEARCH_ROUTE_V1_ACCEPTANCE_CASES) {
  const route = buildSearchRouteV1(fixture.query, fixture.locale);
  const actualIntent = route?.intent.kind ?? null;
  const actualPrimary = route?.primaryAction.kind ?? null;
  if (actualIntent !== fixture.intent || actualPrimary !== fixture.primary) {
    fail(
      `${fixture.locale}:${fixture.query} expected ${fixture.intent}/${fixture.primary}, received ${actualIntent}/${actualPrimary}.`,
    );
  }
  if (route && route.intent.score < GRAPH_SEARCH_ANCHOR_MIN_SCORE) {
    fail(`${fixture.locale}:${fixture.query} routed below the frozen confidence threshold.`);
  }
  if (route && route.relatedPaths.length > 6) {
    fail(`${fixture.locale}:${fixture.query} exceeded the six-item related-path bound.`);
  }
}

for (const fixture of screepsIntentAcceptanceCases) {
  const symptom = getScreepsIntentPromotions(fixture.query, fixture.locale, 8)
    .find((promotion) => promotion.kind === "symptom");
  if (symptom?.entityId !== `symptom:${fixture.expectedSymptomId}`) {
    fail(`Existing intent fixture regressed: ${fixture.locale}:${fixture.query}.`);
  }
}

const doctorCases = [
  ["creep not moving", "creep-not-moving", "creep-not-moving"],
  ["spawn not working", "spawn-not-spawning", "spawn-not-working"],
  ["creep not harvesting", "creep-not-harvesting", "creep-not-harvesting"],
];
for (const [query, symptomId, doctorSymptom] of doctorCases) {
  const route = buildSearchRouteV1(query, "en");
  if (route?.intent.entityId !== `symptom:${symptomId}`) {
    fail(`${query} did not preserve its canonical diagnostic symptom.`);
  }
  if (
    route?.primaryAction.href
    !== `/en/resolver?doctor=${doctorSymptom}#screeps-doctor`
  ) {
    fail(`${query} did not produce the strict Doctor deep link.`);
  }
  if (!route?.secondaryActions.some((action) => action.kind === "resolver")) {
    fail(`${query} must expose Resolver as a secondary action.`);
  }
}

const resolverCases = [
  ["controller about to downgrade", "creep-not-upgrading"],
  ["CPU too high", "cpu-bucket-abnormal"],
  ["lab boost failed", "lab-boost-failed"],
];
for (const [query, flowId] of resolverCases) {
  const route = buildSearchRouteV1(query, "en");
  if (
    route?.primaryAction.kind !== "resolver"
    || route.primaryAction.href !== `/en/resolver?flow=${flowId}#problem-resolver-en`
  ) {
    fail(`${query} did not route to Resolver flow ${flowId}.`);
  }
}

const diagnosticsOnly = buildSearchRouteV1("link not transferring energy", "en");
if (diagnosticsOnly?.primaryAction.kind !== "diagnostics") {
  fail("A high-confidence symptom without Doctor or Resolver must open Diagnostics.");
}

const errorOnly = buildSearchRouteV1("ERR_NOT_IN_RANGE", "en");
if (
  errorOnly?.intent.entityId !== "error:ERR_NOT_IN_RANGE"
  || errorOnly.primaryAction.kind !== "error"
  || errorOnly.secondaryActions.length !== 0
) {
  fail("A standalone return code must open its definition without choosing Doctor.");
}

const compound = buildSearchRouteV1("spawn returns -6", "en");
if (
  compound?.intent.entityId !== "symptom:spawn-not-spawning"
  || compound.primaryAction.kind !== "doctor"
) {
  fail("The existing multi-signal compound query must resolve to the Spawn symptom.");
}

const arena = buildSearchRouteV1("Screeps Arena spawnCreep", "en");
if (
  arena?.primaryAction.href !== "/en/blog/screeps-arena-spawn-creep"
  || !arena.answer.includes("spawnCreep(body)")
) {
  fail("The Arena query did not keep the Arena signature boundary.");
}

const world = buildSearchRouteV1("Screeps World spawnCreep", "en");
if (
  world?.intent.entityId !== "api:spawn-spawn-creep"
  || !world.answer.includes("spawnCreep(body, name, opts)")
) {
  fail("The World/MMO query did not keep the World signature boundary.");
}

for (const query of ["spawnCreep", "Spawn.spawnCreep", "unknown/random query"]) {
  if (buildSearchRouteV1(query, "en") !== null) {
    fail(`${query} must fail open to Search V2 instead of guessing a route.`);
  }
}

for (const launch of SCREEPS_DOCTOR_LAUNCHES) {
  if (parseScreepsDoctorLaunchSymptom(launch.doctorSymptom) !== launch.doctorSymptom) {
    fail(`Doctor whitelist rejected ${launch.doctorSymptom}.`);
  }
  if (
    getScreepsDoctorDeepLink(launch.doctorSymptom, "zh")
    !== `/resolver?doctor=${launch.doctorSymptom}#screeps-doctor`
  ) {
    fail(`Chinese Doctor deep link is invalid for ${launch.doctorSymptom}.`);
  }
  if (
    getScreepsDoctorDeepLink(launch.doctorSymptom, "en")
    !== `/en/resolver?doctor=${launch.doctorSymptom}#screeps-doctor`
  ) {
    fail(`English Doctor deep link is invalid for ${launch.doctorSymptom}.`);
  }
}

for (const flow of problemResolverFlows) {
  if (parseProblemResolverFlowId(flow.flowId) !== flow.flowId) {
    fail(`Resolver whitelist rejected ${flow.flowId}.`);
  }
  if (
    getProblemResolverDeepLink(flow.flowId, "zh")
    !== `/resolver?flow=${flow.flowId}#problem-resolver-zh`
  ) {
    fail(`Chinese Resolver deep link is invalid for ${flow.flowId}.`);
  }
  if (
    getProblemResolverDeepLink(flow.flowId, "en")
    !== `/en/resolver?flow=${flow.flowId}#problem-resolver-en`
  ) {
    fail(`English Resolver deep link is invalid for ${flow.flowId}.`);
  }
}

for (const invalid of [null, "", "unknown", "spawn-not-working%00", " creep-not-moving"] ) {
  if (parseScreepsDoctorLaunchSymptom(invalid) !== null) {
    fail(`Doctor accepted an invalid deep-link parameter: ${String(invalid)}.`);
  }
  if (parseProblemResolverFlowId(invalid) !== null) {
    fail(`Resolver accepted an invalid deep-link parameter: ${String(invalid)}.`);
  }
}

const telemetryMovementRoute = buildSearchRouteV1("creep not moving", "en");
if (!telemetryMovementRoute) {
  fail("Search V3 telemetry fixture could not resolve the movement route.");
} else {
  const telemetryBase = {
    routeVersion: 1,
    locale: "en",
    intentKind: telemetryMovementRoute.intent.kind,
    intentId: telemetryMovementRoute.intent.entityId,
    source: "route_card",
  };
  const validEvents = [
    {
      eventName: "search_v3_route_shown",
      ...telemetryBase,
    },
    {
      eventName: "search_v3_action_clicked",
      ...telemetryBase,
      actionKind: telemetryMovementRoute.primaryAction.kind,
      targetId: telemetryMovementRoute.primaryAction.targetId,
    },
    ...(telemetryMovementRoute.relatedPaths[0]
      ? [{
          eventName: "search_v3_related_path_clicked",
          ...telemetryBase,
          relatedKind: telemetryMovementRoute.relatedPaths[0].kind,
          targetId: telemetryMovementRoute.relatedPaths[0].targetId,
        }]
      : []),
    {
      eventName: "search_v3_cluster_clicked",
      ...telemetryBase,
      clusterId: "movement-vision",
    },
  ];

  for (const event of validEvents) {
    if (!parseSearchV3TelemetryEvent(event)) {
      fail(`Search V3 telemetry rejected valid event ${event.eventName}.`);
    }
  }

  const invalidTelemetry = [
    { ...validEvents[0], query: "creep not moving" },
    { ...validEvents[0], snapshot: "{}" },
    { ...validEvents[0], anonymousId: "should-not-exist" },
    {
      ...telemetryBase,
      eventName: "search_v3_action_clicked",
      actionKind: "doctor",
      targetId: "unknown-doctor-target",
    },
    {
      ...telemetryBase,
      eventName: "search_v3_cluster_clicked",
      clusterId: "unknown-cluster",
    },
  ];
  for (const event of invalidTelemetry) {
    if (parseSearchV3TelemetryEvent(event) !== null) {
      fail(`Search V3 telemetry accepted forbidden/invalid payload for ${event.eventName}.`);
    }
  }
}

const telemetryClientSource = fs.readFileSync(
  path.join(root, "src/lib/search-v3-telemetry-client.ts"),
  "utf8",
);
if (!telemetryClientSource.includes('fetch("/api/search-v3/event"')) {
  fail("Search V3 telemetry client does not use the bounded product-analytics endpoint.");
}

const telemetryApiSource = fs.readFileSync(
  path.join(root, "src/app/(zh)/api/search-v3/event/route.ts"),
  "utf8",
);
for (const forbiddenHeader of [
  "x-anonymous-id",
  "x-session-id",
  "user-agent",
  "referer",
]) {
  if (telemetryApiSource.toLocaleLowerCase("en").includes(forbiddenHeader)) {
    fail(`Search V3 telemetry API reads forbidden identity/request field: ${forbiddenHeader}.`);
  }
}

const routeSource = fs.readFileSync(
  path.join(root, "src/lib/search-route-v1.ts"),
  "utf8",
);
for (const forbidden of [
  "knowledge-graph-v1.json",
  "prerequisiteOf",
  "OpenAI",
  "pgvector",
  "neo4j",
  "drizzle-orm",
  "getPlatformDatabase",
]) {
  if (routeSource.includes(forbidden)) {
    fail(`Search V3 route contract contains forbidden dependency: ${forbidden}.`);
  }
}

const cardSource = fs.readFileSync(
  path.join(root, "src/components/search-route-v1-card.tsx"),
  "utf8",
);
for (const forbiddenTelemetryField of [
  "query:",
  "snapshot:",
  "objectId:",
  "memory:",
  "code:",
  "diagnosticState:",
]) {
  if (cardSource.toLocaleLowerCase("en").includes(forbiddenTelemetryField.toLocaleLowerCase("en"))) {
    fail(`Search V3 telemetry contains forbidden field: ${forbiddenTelemetryField}`);
  }
}

for (const relativePath of [
  "src/components/site-search-v2.tsx",
  "src/components/english-site-search.tsx",
]) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (!source.includes("buildSearchRouteV1(")) {
    fail(`${relativePath} does not use the shared Search V3 route contract.`);
  }
  if (!source.includes("<SearchRouteV1Card")) {
    fail(`${relativePath} does not render the bounded Search V3 route card.`);
  }
  if (source.includes("knowledge-graph-v1.json")) {
    fail(`${relativePath} must not bundle the full Knowledge Graph artifact.`);
  }
}

if (failures.length > 0) {
  console.error(`Search V3 routing check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  "Search V3 routing check passed: bilingual high-confidence routing, strict Doctor/Resolver deep links, World/Arena separation, bounded privacy-preserving product telemetry, and Search V2 fail-open behavior are intact.",
);
