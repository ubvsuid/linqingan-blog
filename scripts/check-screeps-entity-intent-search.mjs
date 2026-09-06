import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required Phase 5 file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const entityIntent = read("src/lib/screeps-entity-intent.ts");
const knowledgeGraphSearchPolicy = read("src/lib/knowledge-graph-search-policy.ts");
const knowledgeGraphSearch = read("src/lib/knowledge-graph-search.ts");
const chineseSearch = read("src/lib/search-v2.ts");
const englishClientSearch = read("src/components/english-site-search.tsx");
const englishServerSearch = read("src/lib/english-search.ts");
const englishSearchIndexRoute = read("src/app/(en)/en/search-index.json/route.ts");
const packageJson = read("package.json");

for (const registry of [
  "screepsDiagnosticSymptoms",
  "screepsErrorDiagnostics",
  "screepsErrorCodes",
  "screepsApiReference",
  "screepsApiHubs",
  "verificationCoveragePlans",
]) {
  if (!entityIntent.includes(registry)) failures.push(`Entity graph must derive from ${registry}.`);
}

for (const kind of ["symptom", "error", "api", "hub", "guide", "tool", "verification"]) {
  if (!entityIntent.includes(`| "${kind}"`)) failures.push(`Missing entity kind: ${kind}`);
}

for (const relation of [
  "symptom-error",
  "symptom-api",
  "symptom-hub",
  "symptom-guide",
  "symptom-tool",
  "symptom-verification",
  "error-api",
  "api-hub",
]) {
  if (!entityIntent.includes(`"${relation}"`)) failures.push(`Missing lightweight entity relation: ${relation}`);
}

for (const fixture of [
  'query: "creep 为什么不动", expectedSymptomId: "creep-not-moving"',
  'query: "spawn 返回 -6", expectedSymptomId: "spawn-not-spawning"',
  'query: "controller 快掉级", expectedSymptomId: "controller-downgrade"',
  'query: "creep not moving", expectedSymptomId: "creep-not-moving"',
  'query: "spawn returns -6", expectedSymptomId: "spawn-not-spawning"',
  'query: "controller about to downgrade", expectedSymptomId: "controller-downgrade"',
]) {
  if (!entityIntent.includes(fixture)) failures.push(`Missing intent acceptance fixture: ${fixture}`);
}

if (!entityIntent.includes("matchedKinds.size >= 2")) {
  failures.push("Symptom propagation must require multi-entity evidence when there is no direct symptom match.");
}
if (!entityIntent.includes("const contextBonus = Math.round(direct * (direct >= 45 ? 1.5 : 2))")) {
  failures.push("Multi-signal symptom propagation must use the same related-signal base for strong and weak direct context, then apply a direct symptom context bonus to break generic ties.");
}
if (!entityIntent.includes("best + Math.round(second * 0.65) + matchedKinds.size * 20 + contextBonus")) {
  failures.push("Multi-signal propagation must consistently combine its two strongest related signals before applying direct symptom context.");
}
if (!entityIntent.includes('node.kind === "symptom" ? 24')) {
  failures.push("Symptom-first intent results must receive an explicit promotion bonus.");
}
if (!entityIntent.includes("String(code.value)")) {
  failures.push("Error-code numeric aliases such as -6 must participate in intent matching.");
}
if (!entityIntent.includes("/verification/coverage#coverage-${symptom.id}")) {
  failures.push("Verification Coverage must remain connected as an entity relation.");
}

if (!knowledgeGraphSearch.includes('import knowledgeGraphPayload from "@/generated/knowledge-graph-v1.json"')) {
  failures.push("Search Graph enrichment must consume the canonical generated Knowledge Graph artifact.");
}
if (!knowledgeGraphSearchPolicy.includes("GRAPH_SEARCH_ANCHOR_MIN_SCORE = 120")) {
  failures.push("Search Graph enrichment must require the frozen high-confidence anchor threshold.");
}
if (!knowledgeGraphSearchPolicy.includes('kind === "symptom" || kind === "api" || kind === "error"')) {
  failures.push("Search Graph enrichment anchors must remain limited to Symptom/API/ReturnCode intent kinds.");
}
if (!knowledgeGraphSearch.includes('return `error:${node.id.slice("return-code:".length)}`')) {
  failures.push("Search Graph enrichment must map durable ReturnCode graph identities back to intent error identities.");
}
for (const relation of ["solvedBy", "involvesApi", "relatedTo", "returns", "testedBy", "explains", "usesApi"]) {
  if (!knowledgeGraphSearch.includes(`"${relation}"`)) {
    failures.push(`Search Graph enrichment is missing allowed relation: ${relation}`);
  }
}
if (knowledgeGraphSearch.includes("prerequisiteOf") || knowledgeGraphSearchPolicy.includes("prerequisiteOf")) {
  failures.push("Search Graph enrichment must not use registry-order prerequisiteOf as a search-intent signal.");
}
for (const forbidden of ["drizzle-orm", "getPlatformDatabase", "pgvector", "neo4j", "OpenAI", "verificationEvidence"]) {
  if (knowledgeGraphSearch.includes(forbidden) || knowledgeGraphSearchPolicy.includes(forbidden)) {
    failures.push(`Search Graph enrichment must remain read-only and deterministic; forbidden dependency: ${forbidden}.`);
  }
}
if (!knowledgeGraphSearch.includes("if (!graphIsUsable) return null")) {
  failures.push("Search Graph enrichment must fail open to unchanged Search behavior when the static Graph is unusable.");
}
if (!knowledgeGraphSearch.includes("getKnowledgeGraphSearchRouteSignals")) {
  failures.push("Search Graph enrichment must expose a compact route-signal projection for corpus-bounded consumers.");
}
if (!knowledgeGraphSearch.includes("routeSignalCache")) {
  failures.push("Search Graph route signals must be derived once per locale rather than recomputing the full graph in client-facing search loops.");
}

if (!chineseSearch.includes('getScreepsIntentPromotions(query, "zh", 8)')) {
  failures.push("Chinese Search V2 must use the shared Chinese intent resolver.");
}
if (!chineseSearch.includes("applyScreepsIntentRanking(")) {
  failures.push("Chinese Search V2 must preserve the existing entity-intent ranking layer.");
}
if (!chineseSearch.includes("SEARCH_V2_MAX_LIMIT,")) {
  failures.push("Chinese Search V2 must preserve a broad candidate pool before Graph reranking.");
}
if (!chineseSearch.includes("applyKnowledgeGraphRanking(normalizedQuery, results, type, limit)")) {
  failures.push("Chinese Search V2 must apply the Knowledge Graph enrichment layer after entity intent ranking.");
}
if (!chineseSearch.includes('getKnowledgeGraphSearchContext(query, "zh", 8)')) {
  failures.push("Chinese Search V2 must request deterministic Chinese Graph search context.");
}
if (!chineseSearch.includes("getSearchDocuments({ includeArticleText: false })")) {
  failures.push("Graph enrichment must only promote documents that already exist in the Search corpus.");
}
if (!chineseSearch.includes("searchDatabase(normalizedQuery, type, SEARCH_V2_MAX_LIMIT)")) {
  failures.push("Chinese database search must preserve a broad candidate pool before intent and Graph reranking.");
}
if (!chineseSearch.includes("intent:${promotion.entityId}")) {
  failures.push("Chinese search must be able to inject non-persisted intent results without adding search_documents rows.");
}

if (!englishClientSearch.includes('getScreepsIntentPromotions(query, "en", 8)')) {
  failures.push("English client search must use the shared English intent resolver.");
}
if (!englishClientSearch.includes('fetch("/en/search-index.json"')) {
  failures.push("English search must preserve lazy full-index loading.");
}
if (!englishClientSearch.includes("Array.isArray(payload)")) {
  failures.push("English lazy search must preserve the existing array search-index protocol.");
}
if (!englishClientSearch.includes("promotionScoreByHref")) {
  failures.push("English client search must combine lexical score with entity-intent promotion score.");
}
if (!englishClientSearch.includes("intent:${promotion.entityId}")) {
  failures.push("English client search must inject intent results without expanding the persisted index.");
}
if (!englishClientSearch.includes("getKnowledgeGraphSearchAnchorEntityId(")) {
  failures.push("English client search must resolve the same high-confidence Graph anchor from compact document signals.");
}
if (!englishClientSearch.includes("getKnowledgeGraphSearchSignalScore(")) {
  failures.push("English client search must use compact corpus-bounded Graph signals after entity-intent ranking.");
}
if (englishClientSearch.includes("knowledge-graph-v1.json") || englishClientSearch.includes("getKnowledgeGraphSearchRouteSignals")) {
  failures.push("English client search must not bundle or directly traverse the canonical Knowledge Graph artifact.");
}

if (!englishServerSearch.includes('getScreepsIntentPromotions(query, "en", 8)')) {
  failures.push("English SSR search must use the same shared intent resolver as the client.");
}
if (!englishServerSearch.includes("promotionScoreByHref")) {
  failures.push("English SSR search must combine lexical and entity-intent scores before first paint.");
}
if (!englishServerSearch.includes("intent:${promotion.entityId}")) {
  failures.push("English SSR search must support the same virtual intent results without changing the persisted index.");
}
if (!englishServerSearch.includes('getKnowledgeGraphSearchRouteSignals("en")')) {
  failures.push("English SSR/search-index construction must derive compact signals server-side from the canonical Graph.");
}
if (!englishServerSearch.includes("graphSearch?: KnowledgeGraphSearchSignal[]")) {
  failures.push("English Search documents must carry only compact Graph route signals, not the full Graph artifact.");
}
if (!englishServerSearch.includes("getKnowledgeGraphSearchAnchorEntityId(") ||
    !englishServerSearch.includes("getKnowledgeGraphSearchSignalScore(")) {
  failures.push("English SSR ranking must use the same compact Graph anchor/signal policy as the lazy client.");
}
if (!englishSearchIndexRoute.includes("Response.json(englishSearchDocuments")) {
  failures.push("English search-index must keep returning the existing document array; compact Graph signals ride inside corpus documents.");
}

for (const forbidden of ["drizzle-orm", "getPlatformDatabase", "pgvector", "neo4j", "OpenAI", "verificationEvidence"]) {
  if (entityIntent.includes(forbidden)) failures.push(`Lightweight entity-intent layer must not depend on ${forbidden}.`);
}

if (!packageJson.includes('"entityintentcheck": "node scripts/check-screeps-entity-intent-search.mjs"')) {
  failures.push("package.json must expose the Phase 5 entity intent governance check.");
}
if (!packageJson.includes("npm run entityintentcheck")) {
  failures.push("Phase 5 entity intent governance check must be part of prebuild.");
}

if (failures.length > 0) {
  console.error(`Screeps entity intent search check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("Screeps entity intent search check passed: bilingual entity-intent ranking remains intact; Chinese Search V2 and English SSR/lazy Search use high-confidence, one-hop, corpus-bounded Knowledge Graph enrichment without persistence, prerequisite-order promotion, full-Graph client bundling, or AI dependencies.");
