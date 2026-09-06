import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clusterPath = path.join(root, "content", "knowledge-clusters-v1.json");
const modulePath = path.join(root, "src", "lib", "knowledge-module-registry.ts");
const articlePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const coveragePath = path.join(root, "reports", "knowledge-cluster-coverage-v1.json");
const surfacePath = path.join(root, "src", "lib", "knowledge-cluster-experience.ts");
const handoffPath = path.join(root, "src", "lib", "knowledge-cluster-handoff.ts");
const experiencePath = path.join(root, "src", "components", "knowledge-cluster-experience.tsx");
const systemMapPath = path.join(root, "src", "components", "knowledge-system-map.tsx");
const chineseSearchPath = path.join(root, "src", "lib", "search-v2.ts");
const chineseSearchUiPath = path.join(root, "src", "components", "site-search-v2.tsx");
const englishSearchPagePath = path.join(root, "src", "app", "(en)", "en", "search", "page.tsx");
const englishSearchUiPath = path.join(root, "src", "components", "english-site-search.tsx");
const diagnosticsPath = path.join(root, "src", "components", "screeps-diagnostic-center.tsx");
const resolverPath = path.join(root, "src", "components", "problem-resolver.tsx");
const zhResolverPagePath = path.join(root, "src", "app", "(zh)", "resolver", "page.tsx");
const enResolverPagePath = path.join(root, "src", "app", "(en)", "en", "resolver", "page.tsx");
const expectedFacets = ["learn", "build", "solve", "verify", "explore"];
const errors = [];

function fail(message) { errors.push(message); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function readSource(file) { return fs.readFileSync(file, "utf8"); }

const clusters = readJson(clusterPath);
const articles = readJson(articlePath);
const moduleSource = readSource(modulePath);
const moduleMatches = [...moduleSource.matchAll(/\{\n    id: "([a-z0-9-]+)",\n    number: (\d+),/g)];
const modules = new Map(moduleMatches.map((match) => [match[1], Number(match[2])]));

if (clusters.schemaVersion !== 1) fail("Knowledge Cluster schemaVersion must be 1");
if (clusters.primaryMembership !== "knowledge-module") fail("primaryMembership must stay knowledge-module");
if (clusters.graphExpansion !== "explicit-relations-only") fail("graphExpansion must stay explicit-relations-only");
if (!Array.isArray(clusters.clusters) || clusters.clusters.length !== 8) fail("Knowledge Cluster V1 must contain exactly 8 clusters");
if (modules.size !== 8) fail(`Expected 8 source Knowledge modules, found ${modules.size}`);

const seen = new Set();
let demonstrators = 0;
for (const cluster of clusters.clusters ?? []) {
  if (seen.has(cluster.clusterId)) fail(`Duplicate clusterId: ${cluster.clusterId}`);
  seen.add(cluster.clusterId);
  if (cluster.clusterId !== cluster.sourceModuleId) fail(`${cluster.clusterId}: sourceModuleId must equal clusterId in V1`);
  if (!modules.has(cluster.clusterId)) fail(`${cluster.clusterId}: source Knowledge module missing`);
  if (modules.get(cluster.clusterId) !== cluster.number) fail(`${cluster.clusterId}: module number drift`);
  if (JSON.stringify(cluster.facets) !== JSON.stringify(expectedFacets)) fail(`${cluster.clusterId}: facet contract drift`);
  if (typeof cluster.enTitle !== "string" || !cluster.enTitle.trim()) fail(`${cluster.clusterId}: enTitle missing`);
  if (typeof cluster.enDescription !== "string" || !cluster.enDescription.trim()) fail(`${cluster.clusterId}: enDescription missing`);
  if (cluster.demonstrator) {
    demonstrators += 1;
    if (cluster.clusterId !== "spawn-lifecycle") fail("Only spawn-lifecycle may be the V1 demonstrator");
  }
}
if (demonstrators !== 1) fail(`Expected exactly one demonstrator, found ${demonstrators}`);
for (const moduleId of modules.keys()) if (!seen.has(moduleId)) fail(`Source module not mapped to cluster: ${moduleId}`);

const articleIds = new Set();
for (const record of articles) {
  const moduleId = record?.knowledge?.module;
  if (!seen.has(moduleId)) fail(`${record?.slug ?? "unknown"}: article module has no cluster: ${String(moduleId)}`);
  if (!record?.contentId) fail(`${record?.slug ?? "unknown"}: contentId missing`);
  else if (articleIds.has(record.contentId)) fail(`Duplicate article contentId: ${record.contentId}`);
  else articleIds.add(record.contentId);
}

for (const requiredPath of [
  coveragePath,
  surfacePath,
  handoffPath,
  experiencePath,
  systemMapPath,
  chineseSearchPath,
  chineseSearchUiPath,
  englishSearchPagePath,
  englishSearchUiPath,
  diagnosticsPath,
  resolverPath,
  zhResolverPagePath,
  enResolverPagePath,
]) {
  if (!fs.existsSync(requiredPath)) fail(`Knowledge Cluster demonstrator file missing: ${path.relative(root, requiredPath)}`);
}

if (fs.existsSync(coveragePath)) {
  const coverage = readJson(coveragePath);
  if (coverage.schemaVersion !== 1) fail("Knowledge Cluster coverage schemaVersion must be 1");
  if (coverage.graphUnmappedCount !== 0) fail("Knowledge Cluster user-facing demonstrator requires graphUnmappedCount=0");
  if (coverage.demonstrator?.clusterId !== "spawn-lifecycle") fail("Knowledge Cluster coverage demonstrator must stay spawn-lifecycle");
  const surface = coverage.demonstrator?.graphSurface;
  if (!surface?.apiIds?.length) fail("Spawn demonstrator requires Graph-derived API surface");
  if (!surface?.symptomIds?.length) fail("Spawn demonstrator requires Graph-derived Symptom surface");
  if (!surface?.toolIds?.length) fail("Spawn demonstrator requires Graph-derived Tool surface");
  if (!surface?.tickLabExperimentIds?.length) fail("Spawn demonstrator requires Graph-derived Tick Lab surface");
  if (!surface?.returnCodeIds?.length) fail("Spawn demonstrator requires Graph-derived ReturnCode surface");
}

if (fs.existsSync(surfacePath)) {
  const source = readSource(surfacePath);
  if (!source.includes("knowledge-cluster-coverage-v1.json")) fail("Cluster experience must consume deterministic coverage artifact");
  if (!source.includes("knowledge-graph-v1.json")) fail("Cluster experience must consume canonical Knowledge Graph artifact");
  if (!source.includes("knowledge-article-registry.json")) fail("Cluster Learn facet must preserve Knowledge article ownership");
  if (/tool_[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(source)) fail("Cluster experience must not hard-code Tool durable IDs");
  if (/symptom:[a-z0-9-]+/.test(source)) fail("Cluster experience must not hard-code Symptom durable IDs");
}

if (fs.existsSync(handoffPath)) {
  const source = readSource(handoffPath);
  if (!source.includes("knowledge-cluster-coverage-v1.json")) fail("Cluster handoff must consume deterministic coverage artifact");
  if (!source.includes("knowledge-graph-v1.json")) fail("Cluster handoff must fail-closed against canonical Graph health");
  if (!source.includes("getKnowledgeCluster")) fail("Cluster handoff must resolve canonical Cluster identity through the registry");
  if (!source.includes("englishKnowledgeModules")) fail("Cluster handoff must derive the English module route from the existing module registry");
  if (!source.includes("anchorEntityIds") || !source.includes("anchorGraphNodeIds")) fail("Cluster handoff must expose compact canonical anchor signals");
  if (!/const anchorGraphNodeIds = \[\s*\.\.\.surface\.apiIds,\s*\.\.\.surface\.symptomIds,\s*\]/m.test(source)) fail("Cluster handoff V1 anchors must stay limited to high-specificity API + Symptom identities");
  if (source.includes("/knowledge/spawn-lifecycle") || source.includes("/en/knowledge/spawn-creep-lifecycle")) fail("Cluster handoff must not hard-code Spawn module routes");
}

if (fs.existsSync(experiencePath)) {
  const source = readSource(experiencePath);
  for (const facet of ["LEARN", "BUILD", "SOLVE", "VERIFY", "EXPLORE"]) {
    if (!source.includes(`label: "${facet}"`)) fail(`Cluster experience missing ${facet} facet`);
  }
  if (!source.includes("getKnowledgeClusterExperienceByModuleNumber")) fail("Cluster experience UI must use the shared demonstrator surface helper");
}

if (fs.existsSync(systemMapPath)) {
  const source = readSource(systemMapPath);
  if (!source.includes("KnowledgeClusterExperience")) fail("Knowledge module system map must mount the Cluster demonstrator enhancement");
  if (!source.includes("moduleNumber={moduleNumber} locale={locale}")) fail("Cluster demonstrator integration must preserve shared bilingual module context");
}

if (fs.existsSync(chineseSearchPath)) {
  const source = readSource(chineseSearchPath);
  if (!source.includes("getKnowledgeClusterHandoffForGraphNodeId")) fail("Chinese Search must derive Cluster handoff from the high-confidence Graph anchor");
  if (!source.includes("clusterHandoff")) fail("Chinese Search response must expose an optional compact Cluster handoff");
}

if (fs.existsSync(chineseSearchUiPath)) {
  const source = readSource(chineseSearchUiPath);
  if (!source.includes("payload.clusterHandoff")) fail("Chinese Search UI must update Cluster handoff with live query responses");
  if (!source.includes("不参与 Search 排名")) fail("Chinese Search UI must state that Cluster handoff does not change ranking");
}

if (fs.existsSync(englishSearchPagePath) && fs.existsSync(englishSearchUiPath)) {
  const pageSource = readSource(englishSearchPagePath);
  const uiSource = readSource(englishSearchUiPath);
  if (!pageSource.includes("getKnowledgeClusterHandoffSignals")) fail("English Search must derive compact Cluster signals server-side");
  if (!pageSource.includes("clusterHandoffs={clusterHandoffs}")) fail("English Search page must pass compact Cluster signals to the client");
  if (!uiSource.includes("getKnowledgeGraphSearchAnchorEntityId")) fail("English Search Cluster handoff must reuse the existing high-confidence Graph anchor policy");
  if (!uiSource.includes("does not change search ranking")) fail("English Search UI must state that Cluster handoff does not change ranking");
}

if (fs.existsSync(diagnosticsPath)) {
  const source = readSource(diagnosticsPath);
  if (!source.includes("getKnowledgeClusterHandoffForGraphNodeId")) fail("Diagnostics must derive Cluster handoff from canonical Symptom identity");
  if (!source.includes("`symptom:${symptom.id}`")) fail("Diagnostics Cluster handoff must use durable symptom identity, not titles");
}

if (fs.existsSync(resolverPath) && fs.existsSync(zhResolverPagePath) && fs.existsSync(enResolverPagePath)) {
  const resolverSource = readSource(resolverPath);
  const zhPageSource = readSource(zhResolverPagePath);
  const enPageSource = readSource(enResolverPagePath);
  if (!resolverSource.includes("clusterHandoffs")) fail("Resolver outcome UI must consume compact Cluster handoffs");
  if (!resolverSource.includes("`symptom:${flow.symptomId}`")) fail("Resolver Cluster handoff must anchor on the flow's durable symptom ID");
  if (!zhPageSource.includes("getKnowledgeClusterHandoffSignals(\"zh\")")) fail("Chinese Resolver page must derive Cluster signals server-side");
  if (!enPageSource.includes("getKnowledgeClusterHandoffSignals(\"en\")")) fail("English Resolver page must derive Cluster signals server-side");
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge Cluster V1 check failed: ${errors.length} issue(s).`);
  process.exit(1);
}
console.log(`Knowledge Cluster V1 check passed: 8 clusters, ${articles.length} primary Knowledge articles, 1 Spawn demonstrator, bilingual Learn/Build/Solve/Verify/Explore experience, and fail-closed Search/Diagnostics/Resolver Cluster handoffs.`);