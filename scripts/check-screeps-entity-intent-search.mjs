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
const chineseSearch = read("src/lib/search-v2.ts");
const englishClientSearch = read("src/components/english-site-search.tsx");
const englishServerSearch = read("src/lib/english-search.ts");
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
if (!entityIntent.includes('node.kind === "symptom" ? 24')) {
  failures.push("Symptom-first intent results must receive an explicit promotion bonus.");
}
if (!entityIntent.includes("String(code.value)")) {
  failures.push("Error-code numeric aliases such as -6 must participate in intent matching.");
}
if (!entityIntent.includes("/verification/coverage#coverage-${symptom.id}")) {
  failures.push("Verification Coverage must remain connected as an entity relation.");
}

if (!chineseSearch.includes('getScreepsIntentPromotions(query, "zh", 8)')) {
  failures.push("Chinese Search V2 must use the shared Chinese intent resolver.");
}
if (!chineseSearch.includes("applyScreepsIntentRanking(normalizedQuery, results, type, limit)")) {
  failures.push("Chinese Search V2 must rerank both database and static results through the intent layer.");
}
if (!chineseSearch.includes("searchDatabase(normalizedQuery, type, SEARCH_V2_MAX_LIMIT)")) {
  failures.push("Chinese database search must preserve a broad candidate pool before intent reranking.");
}
if (!chineseSearch.includes("intent:${promotion.entityId}")) {
  failures.push("Chinese search must be able to inject non-persisted intent results without adding search_documents rows.");
}

if (!englishClientSearch.includes('getScreepsIntentPromotions(query, "en", 8)')) {
  failures.push("English client search must use the shared English intent resolver.");
}
if (!englishClientSearch.includes('fetch("/en/search-index.json"')) {
  failures.push("English search must preserve lazy full-index loading after Phase 5.");
}
if (!englishClientSearch.includes("promotionScoreByHref")) {
  failures.push("English client search must combine lexical score with entity-intent promotion score.");
}
if (!englishClientSearch.includes("intent:${promotion.entityId}")) {
  failures.push("English client search must inject intent results without expanding the persisted index.");
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

console.log("Screeps entity intent search check passed: shared bilingual entity relations and symptom-first intent ranking are wired across Chinese database/static search plus English SSR/client search without new persistence or AI dependencies.");
