import fs from "node:fs";
import path from "node:path";

import {
  buildResolverDemandRanking,
  mapResolverDemandText,
  resolverDemandCandidates,
} from "./lib/resolver-demand-ranking.mjs";
import {
  buildResolverExpansionRanking,
  resolverExpansionSelectionWeights,
} from "./lib/resolver-demand-expansion-ranking.mjs";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    failures.push(`Missing Resolver observability file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
}

function requireSignal(source, signal, message) {
  if (!source.includes(signal)) failures.push(message);
}

const schema = read("src/db/schema.ts");
const migration = read("drizzle/0005_resolver_observability.sql");
const contract = read("src/lib/problem-resolver-telemetry-contract.ts");
const platformEvents = read("src/lib/platform-events.ts");
const route = read("src/app/(zh)/api/resolver/event/route.ts");
const component = read("src/components/problem-resolver.tsx");
const resolverRegistry = read("src/lib/problem-resolver.ts");
const rankingCli = read("scripts/resolver-demand-ranking.mjs");
const rankingLib = read("scripts/lib/resolver-demand-ranking.mjs");
const expansionLib = read("scripts/lib/resolver-demand-expansion-ranking.mjs");
const gscSource = read("scripts/lib/resolver-demand-gsc-source.mjs");
const integrity = read("scripts/check-integrity.mjs");

const eventNames = [
  "flow_started",
  "step_answered",
  "outcome_reached",
  "diagnostics_clicked",
  "guide_clicked",
  "tool_clicked",
  "ticklab_clicked",
];

for (const eventName of eventNames) {
  requireSignal(
    contract,
    `"${eventName}"`,
    `Resolver telemetry contract missing event: ${eventName}`,
  );
  requireSignal(
    migration,
    `'${eventName}'`,
    `Resolver telemetry migration missing event constraint: ${eventName}`,
  );
  requireSignal(
    component,
    `"${eventName}"`,
    `Resolver client instrumentation missing event: ${eventName}`,
  );
}

for (const field of [
  "eventName",
  "flowId",
  "language",
  "stepId",
  "optionId",
  "outcomeId",
  "targetId",
  "targetKind",
]) {
  requireSignal(
    contract,
    `"${field}"`,
    `Resolver telemetry contract missing structured field: ${field}`,
  );
}

for (const forbiddenField of [
  "query",
  "freeText",
  "message",
  "title",
  "label",
  "metadata",
  "sourcePath",
]) {
  if (new RegExp(`\\b${forbiddenField}\\??\\s*:`).test(contract)) {
    failures.push(`Resolver telemetry contract must not expose free-text field: ${forbiddenField}`);
  }
}

requireSignal(schema, 'export const resolverEvents = pgTable(', "Drizzle schema must define resolverEvents.");
requireSignal(schema, '"resolver_events"', "Drizzle schema must target resolver_events.");
for (const column of [
  '"event_name"',
  '"flow_id"',
  '"step_id"',
  '"option_id"',
  '"outcome_id"',
  '"target_id"',
  '"target_kind"',
]) {
  requireSignal(schema, column, `resolver_events schema missing ${column}.`);
}
if (migration.includes("verification_evidence") || migration.includes("runtime_evidence")) {
  failures.push("Resolver observability migration must not modify Runtime Evidence tables.");
}
for (const freeTextColumn of [
  "query text",
  "message text",
  "label text",
  "metadata json",
  "source_path text",
  "referer text",
  "user_agent text",
  "ip_address text",
]) {
  if (migration.toLowerCase().includes(freeTextColumn)) {
    failures.push(`resolver_events migration must not store free-text/network field: ${freeTextColumn}`);
  }
}

requireSignal(
  platformEvents,
  "db.insert(resolverEvents).values",
  "Platform events layer must own resolver_events persistence.",
);
if (
  platformEvents.includes("persistResolverEvent") &&
  /persistResolverEvent[\s\S]*metadata\s*:/.test(platformEvents)
) {
  failures.push("Resolver telemetry persistence must not add arbitrary metadata.");
}

for (const forbiddenNetworkSignal of [
  "referer",
  "user-agent",
  "x-forwarded",
  "request.ip",
  "geo",
]) {
  if (route.toLowerCase().includes(forbiddenNetworkSignal)) {
    failures.push(`Resolver telemetry API must not collect ${forbiddenNetworkSignal}.`);
  }
}
requireSignal(route, 'request.headers.get("x-anonymous-id")', "Resolver telemetry API must reuse anonymous identity header.");
requireSignal(route, 'request.headers.get("x-session-id")', "Resolver telemetry API must reuse session identity header.");
requireSignal(route, "parseResolverTelemetryEvent", "Resolver telemetry API must enforce the structured contract.");
requireSignal(route, "matchesResolverRegistry", "Resolver telemetry API must validate flow/step IDs against the deterministic registry.");
if (
  route.includes("verificationEvidence") ||
  route.includes("getPublicVerificationEvidence") ||
  route.includes("getVerifiedContentWithEvidence")
) {
  failures.push("Resolver telemetry API must not read or mutate Runtime Evidence.");
}

requireSignal(
  component,
  'referrerPolicy: "no-referrer"',
  "Resolver telemetry fetch must suppress the browser Referer header.",
);
requireSignal(
  component,
  "buildIdentityHeaders()",
  "Resolver telemetry client must reuse the first-party anonymous/session identity.",
);
requireSignal(
  component,
  "const activeRunRef = useRef",
  "Resolver telemetry must deduplicate flow starts within one active run.",
);
requireSignal(
  component,
  "startFlowIfNeeded(flow.flowId);",
  "The default Resolver flow must start only on explicit user interaction.",
);
if (component.includes("useEffect(")) {
  failures.push("flow_started must not fire from a mount effect because the default Spawn tab would bias demand.");
}
if (
  component.includes("getVerifiedContentWithEvidence") ||
  component.includes("getPublicVerificationEvidence")
) {
  failures.push("Resolver telemetry instrumentation must not cross the Runtime Evidence boundary.");
}

const expectedFlowIds = [
  "spawn-not-working",
  "creep-not-moving",
  "creep-not-harvesting",
  "creep-not-upgrading",
  "lab-boost-failed",
  "cpu-bucket-abnormal",
];
const actualFlowIds = [...resolverRegistry.matchAll(/^\s{4}flowId: "([a-z0-9-]+)",$/gm)]
  .map((match) => match[1]);
if (actualFlowIds.length !== expectedFlowIds.length) {
  failures.push(`Resolver deterministic flow count changed: expected ${expectedFlowIds.length}, found ${actualFlowIds.length}.`);
}
for (const flowId of expectedFlowIds) {
  if (!actualFlowIds.includes(flowId)) {
    failures.push(`Resolver deterministic flow missing after observability work: ${flowId}`);
  }
}

const candidateIds = new Set(resolverDemandCandidates.map((candidate) => candidate.candidateId));
const expectedUncovered = [
  "builder-not-building",
  "tower-not-acting",
  "resources-not-moving",
  "link-not-transferring",
  "market-action-failed",
];
for (const candidateId of expectedUncovered) {
  if (!candidateIds.has(candidateId)) failures.push(`Demand ranking missing uncovered candidate: ${candidateId}`);
}
if (mapResolverDemandText("source") !== null) {
  failures.push('Broad keyword "source" must not map to a Resolver demand candidate.');
}
if (mapResolverDemandText("controller") !== null) {
  failures.push('Broad keyword "controller" must not map to a Resolver demand candidate.');
}
if (mapResolverDemandText("tower not repairing")?.candidateId !== "tower-not-acting") {
  failures.push("High-specificity Tower query must map to tower-not-acting.");
}
if (mapResolverDemandText("link transferEnergy failed")?.candidateId !== "link-not-transferring") {
  failures.push("High-specificity Link query must map to link-not-transferring.");
}

const baseReady = buildResolverDemandRanking({
  resolverRows: [{ flowId: "spawn-not-working", starts: 25 }],
  searchRows: [{ query: "tower not repairing", searches: 20 }],
  gscRows: [{ query: "tower not attacking", impressions: 100, clicks: 3 }],
});
if (
  baseReady.weights.resolver !== 0.45 ||
  baseReady.weights.search !== 0.30 ||
  baseReady.weights.gsc !== 0.25
) {
  failures.push("Covered-flow benchmark weights must remain Resolver 45% / Search 30% / GSC 25%.");
}

const insufficient = buildResolverExpansionRanking();
if (insufficient.status !== "INSUFFICIENT_DATA" || insufficient.recommendation.candidateId !== null) {
  failures.push("Expansion ranking must fail closed when Resolver/Search/GSC sources are unavailable.");
}
if (insufficient.schemaVersion !== 2 || insufficient.selectionMode !== "uncovered-expansion-v2") {
  failures.push("Expansion ranking must publish schemaVersion 2 and uncovered-expansion-v2 semantics.");
}
if (insufficient.sourceRoles.resolver !== "readiness_gate_and_covered_flow_benchmark") {
  failures.push("Resolver telemetry must be explicitly modeled as readiness gate / covered-flow benchmark, not direct uncovered-candidate score.");
}

const ready = buildResolverExpansionRanking({
  resolverRows: [{ flowId: "spawn-not-working", starts: 25, outcomes: 20, downstreamClicks: 10 }],
  searchRows: [
    { query: "tower not repairing", searches: 20 },
    { query: "builder not building", searches: 5 },
  ],
  gscRows: [
    { query: "tower not attacking", impressions: 100, clicks: 3 },
    { query: "builder not building", impressions: 10, clicks: 0 },
  ],
});
if (ready.status !== "READY" || ready.recommendation.candidateId !== "tower-not-acting") {
  failures.push("Expansion ranking synthetic fixture must select the clear uncovered Tower winner.");
}
if (ready.resolverContext.outcomeRate !== 80 || ready.resolverContext.downstreamClickRate !== 50) {
  failures.push("Resolver outcomes/downstream clicks must remain visible as adoption context without becoming fake uncovered-candidate demand.");
}
const readyJson = JSON.stringify(ready);
if (readyJson.includes("tower not repairing") || readyJson.includes("tower not attacking")) {
  failures.push("Demand ranking output must not emit raw Search/GSC query text.");
}
if (
  ready.benchmarkWeights.resolver !== 0.45 ||
  ready.benchmarkWeights.search !== 0.30 ||
  ready.benchmarkWeights.gsc !== 0.25
) {
  failures.push("Expansion report must preserve the explicit 45/30/25 benchmark weights for covered flows.");
}
const selectionWeightSum = resolverExpansionSelectionWeights.search + resolverExpansionSelectionWeights.gsc;
if (Math.abs(selectionWeightSum - 1) > 0.00001) {
  failures.push("Uncovered expansion Search/GSC selection weights must normalize to 1.");
}
if (resolverExpansionSelectionWeights.search <= resolverExpansionSelectionWeights.gsc) {
  failures.push("Uncovered expansion must preserve Search's 30:25 relative weight over GSC.");
}

const coveredDominance = buildResolverExpansionRanking({
  resolverRows: [{ flowId: "spawn-not-working", starts: 25 }],
  searchRows: [
    { query: "spawn not working", searches: 1000 },
    { query: "tower not repairing", searches: 10 },
  ],
  gscRows: [
    { query: "spawn not spawning", impressions: 10000, clicks: 100 },
    { query: "tower not attacking", impressions: 50, clicks: 1 },
  ],
});
if (
  coveredDominance.status !== "READY" ||
  coveredDominance.recommendation.candidateId !== "tower-not-acting" ||
  coveredDominance.recommendation.score !== 100
) {
  failures.push("Covered-topic dominance must not compress or distort normalization among uncovered expansion candidates.");
}

const coveredOnlySignal = buildResolverExpansionRanking({
  resolverRows: [{ flowId: "spawn-not-working", starts: 25 }],
  searchRows: [
    { query: "spawn not working", searches: 100 },
    { query: "tower not repairing", searches: 1 },
  ],
  gscRows: [
    { query: "spawn not spawning", impressions: 1000, clicks: 10 },
    { query: "tower not attacking", impressions: 1, clicks: 0 },
  ],
});
if (coveredOnlySignal.status !== "INSUFFICIENT_DATA") {
  failures.push("Covered-flow demand must not satisfy the minimum sample requirement for an uncovered expansion recommendation.");
}
if (!coveredOnlySignal.reasons.includes("uncovered_matched_searches_below_10")) {
  failures.push("Expansion ranking must require enough Search demand specifically among uncovered candidates.");
}
if (!coveredOnlySignal.reasons.includes("uncovered_matched_gsc_impressions_below_50")) {
  failures.push("Expansion ranking must require enough GSC demand specifically among uncovered candidates.");
}

for (const broadPattern of ['"source"', '"controller"']) {
  if (rankingLib.includes(broadPattern)) {
    failures.push(`Demand ranking registry must not use broad standalone pattern ${broadPattern}.`);
  }
}
requireSignal(
  expansionLib,
  'selectionMode: "uncovered-expansion-v2"',
  "Expansion ranking must encode its selection semantics in the report.",
);
requireSignal(
  expansionLib,
  "uncoveredMatchedSearches",
  "Expansion ranking must compute Search sufficiency only from uncovered candidate demand.",
);
requireSignal(
  expansionLib,
  "uncoveredMatchedGscImpressions",
  "Expansion ranking must compute GSC sufficiency only from uncovered candidate demand.",
);
requireSignal(
  rankingCli,
  "buildResolverExpansionRanking",
  "Demand ranking CLI must use the uncovered expansion semantics, not the legacy mixed score directly.",
);
requireSignal(
  rankingCli,
  "resolver-demand-ranking-v2.json",
  "Demand ranking CLI must default to a V2 report name after the semantic contract change.",
);
requireSignal(
  rankingCli,
  "readResolverDemandGscRows",
  "Demand ranking CLI must use the shared settled GSC source adapter.",
);
requireSignal(
  gscSource,
  "site_intelligence_gsc_observations",
  "Demand ranking must reuse the existing Site Intelligence GSC serving layer by default.",
);
requireSignal(
  gscSource,
  "ORDER BY max(period_end) DESC, max(captured_at) DESC, source_import_id DESC",
  "Demand ranking must deterministically select the latest settled Site Intelligence import.",
);
requireSignal(
  gscSource,
  "WHERE source_import_id = ${latest.source_import_id}",
  "Demand ranking must aggregate only one selected GSC import and never sum multiple replay imports together.",
);
requireSignal(
  gscSource,
  "payload.records.map",
  "Demand ranking must retain a reproducible settled-file override path.",
);
requireSignal(
  gscSource,
  "path.basename(filePath)",
  "GSC file provenance must expose only the basename, not an operator filesystem path.",
);
if (rankingCli.includes("No settled GSC report supplied")) {
  failures.push("Demand ranking must not require a manual GSC file when Site Intelligence serving data is available.");
}
requireSignal(
  rankingCli,
  "raw Search/GSC query text is not emitted",
  "Demand ranking report must state its aggregate-only privacy boundary.",
);
requireSignal(
  integrity,
  '["Resolver observability and demand ranking", "scripts/check-resolver-observability.mjs"]',
  "Resolver observability checker must be part of the permanent integrity/prebuild gate.",
);

if (failures.length > 0) {
  console.error(`Resolver observability check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Resolver observability check passed: ${eventNames.length} structured events, ${expectedFlowIds.length} unchanged deterministic flows, ${resolverDemandCandidates.length} demand candidates, canonical Site Intelligence GSC source with settled-file override, explicit Resolver readiness semantics, uncovered-only Search/GSC expansion ranking, aggregate-only reporting, and fail-closed insufficient-data behavior.`,
);
