import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clusterPath = path.join(root, "content", "knowledge-clusters-v1.json");
const modulePath = path.join(root, "src", "lib", "knowledge-module-registry.ts");
const articlePath = path.join(root, "src", "generated", "knowledge-article-registry.json");
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

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`\nKnowledge Cluster V1 check failed: ${errors.length} issue(s).`);
  process.exit(1);
}
console.log(`Knowledge Cluster V1 check passed: 8 clusters, ${articles.length} primary Knowledge articles, 1 Spawn demonstrator, 0 unmapped article modules.`);
