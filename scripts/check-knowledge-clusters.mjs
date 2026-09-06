import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clusterPath = path.join(root, "content", "knowledge-clusters-v1.json");
const modulePath = path.join(root, "src", "lib", "knowledge-module-registry.ts");
const articlePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
const coveragePath = path.join(root, "reports", "knowledge-cluster-coverage-v1.json");
const surfacePath = path.join(root, "src", "lib", "knowledge-cluster-experience.ts");
const experiencePath = path.join(root, "src", "components", "knowledge-cluster-experience.tsx");
const systemMapPath = path.join(root, "src", "components", "knowledge-system-map.tsx");
const expectedFacets = ["learn", "build", "solve", "verify", "explore"];
const errors = [];

function fail(message) { errors.push(message); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }

const clusters = readJson(clusterPath);
const articles = readJson(articlePath);
const moduleSource = fs.readFileSync(modulePath, "utf8");
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

for (const requiredPath of [coveragePath, surfacePath, experiencePath, systemMapPath]) {
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
  const source = fs.readFileSync(surfacePath, "utf8");
  if (!source.includes("knowledge-cluster-coverage-v1.json")) fail("Cluster experience must consume deterministic coverage artifact");
  if (!source.includes("knowledge-graph-v1.json")) fail("Cluster experience must consume canonical Knowledge Graph artifact");
  if (!source.includes("knowledge-article-registry.json")) fail("Cluster Learn facet must preserve Knowledge article ownership");
  if (/tool_[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(source)) fail("Cluster experience must not hard-code Tool durable IDs");
  if (/symptom:[a-z0-9-]+/.test(source)) fail("Cluster experience must not hard-code Symptom durable IDs");
}

if (fs.existsSync(experiencePath)) {
  const source = fs.readFileSync(experiencePath, "utf8");
  for (const facet of ["LEARN", "BUILD", "SOLVE", "VERIFY", "EXPLORE"]) {
    if (!source.includes(`label: "${facet}"`)) fail(`Cluster experience missing ${facet} facet`);
  }
  if (!source.includes("getKnowledgeClusterExperienceByModuleNumber")) fail("Cluster experience UI must use the shared demonstrator surface helper");
}

if (fs.existsSync(systemMapPath)) {
  const source = fs.readFileSync(systemMapPath, "utf8");
  if (!source.includes("KnowledgeClusterExperience")) fail("Knowledge module system map must mount the Cluster demonstrator enhancement");
  if (!source.includes("moduleNumber={moduleNumber} locale={locale}")) fail("Cluster demonstrator integration must preserve shared bilingual module context");
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge Cluster V1 check failed: ${errors.length} issue(s).`);
  process.exit(1);
}
console.log(`Knowledge Cluster V1 check passed: 8 clusters, ${articles.length} primary Knowledge articles, 1 Spawn demonstrator, bilingual Learn/Build/Solve/Verify/Explore experience, 0 unmapped article modules.`);
