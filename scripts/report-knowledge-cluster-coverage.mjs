import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outPath = path.join(root, "reports", "knowledge-cluster-coverage-v1.json");
const clusters = JSON.parse(fs.readFileSync(path.join(root, "content", "knowledge-clusters-v1.json"), "utf8"));
const articles = JSON.parse(fs.readFileSync(path.join(root, "src", "generated", "knowledge-article-registry.json"), "utf8"));
const graph = JSON.parse(fs.readFileSync(path.join(root, "src", "generated", "knowledge-graph-v1.json"), "utf8"));
const args = new Set(process.argv.slice(2));

const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
const byCluster = new Map(clusters.clusters.map((cluster) => [cluster.clusterId, []]));
for (const article of articles) byCluster.get(article.knowledge.module)?.push(article.contentId);
for (const values of byCluster.values()) values.sort();

function idsOfType(ids, type) {
  return [...new Set(ids.filter((id) => nodeById.get(id)?.type === type))].sort();
}

function graphSurface(seedIds) {
  const seeds = new Set(seedIds);
  const relatedArticles = new Set(seedIds);
  for (const edge of graph.edges) {
    if (edge.relation !== "relatedTo") continue;
    if (seeds.has(edge.from) && nodeById.get(edge.to)?.type === "Article") relatedArticles.add(edge.to);
    if (seeds.has(edge.to) && nodeById.get(edge.from)?.type === "Article") relatedArticles.add(edge.from);
  }

  const apis = new Set();
  for (const edge of graph.edges) {
    if (!["explains", "usesApi"].includes(edge.relation)) continue;
    if (relatedArticles.has(edge.from) && nodeById.get(edge.to)?.type === "API") apis.add(edge.to);
  }

  const symptoms = new Set();
  for (const edge of graph.edges) {
    if (edge.relation === "solvedBy" && relatedArticles.has(edge.to) && nodeById.get(edge.from)?.type === "Symptom") {
      symptoms.add(edge.from);
    }
  }

  const involvedApisBySymptom = new Map();
  for (const edge of graph.edges) {
    if (edge.relation !== "involvesApi") continue;
    if (nodeById.get(edge.from)?.type !== "Symptom" || nodeById.get(edge.to)?.type !== "API") continue;
    if (!involvedApisBySymptom.has(edge.from)) involvedApisBySymptom.set(edge.from, new Set());
    involvedApisBySymptom.get(edge.from).add(edge.to);
  }

  for (const [symptomId, involvedApiIds] of involvedApisBySymptom) {
    const involved = [...involvedApiIds];
    const overlapCount = involved.filter((apiId) => apis.has(apiId)).length;
    const fullyContained = involved.length > 0 && overlapCount === involved.length;
    if (fullyContained || overlapCount >= 2) symptoms.add(symptomId);
  }

  const returnCodes = new Set();
  const tools = new Set();
  const experimentApis = new Set(apis);
  for (const symptomId of symptoms) {
    for (const apiId of involvedApisBySymptom.get(symptomId) ?? []) experimentApis.add(apiId);
  }

  const experiments = new Set();
  for (const edge of graph.edges) {
    if (edge.relation === "returns" && apis.has(edge.from) && nodeById.get(edge.to)?.type === "ReturnCode") returnCodes.add(edge.to);
    if (edge.relation === "relatedTo" && symptoms.has(edge.from) && nodeById.get(edge.to)?.type === "ReturnCode") returnCodes.add(edge.to);
    if (edge.relation === "solvedBy" && symptoms.has(edge.from) && nodeById.get(edge.to)?.type === "Tool") tools.add(edge.to);
    if (edge.relation === "testedBy") {
      if (experimentApis.has(edge.from) && nodeById.get(edge.to)?.type === "TickLabExperiment") experiments.add(edge.to);
      if (experimentApis.has(edge.to) && nodeById.get(edge.from)?.type === "TickLabExperiment") experiments.add(edge.from);
    }
  }

  return {
    articleIds: idsOfType([...relatedArticles], "Article"),
    apiIds: [...apis].sort(),
    returnCodeIds: [...returnCodes].sort(),
    symptomIds: [...symptoms].sort(),
    toolIds: [...tools].sort(),
    tickLabExperimentIds: [...experiments].sort(),
  };
}

const clusterRows = clusters.clusters.map((cluster) => ({
  clusterId: cluster.clusterId,
  number: cluster.number,
  primaryKnowledgeArticleCount: byCluster.get(cluster.clusterId)?.length ?? 0,
  primaryKnowledgeArticleIds: byCluster.get(cluster.clusterId) ?? [],
  demonstrator: cluster.demonstrator,
}));
const demonstrators = clusters.clusters
  .filter((cluster) => cluster.demonstrator)
  .map((cluster) => ({
    clusterId: cluster.clusterId,
    expansionPolicy: "explicit-relations-only; non-article entities are related surface, not primary membership; Verify may bridge selected Symptom involvesApi relations to testedBy experiments",
    graphSurface: graphSurface(byCluster.get(cluster.clusterId) ?? []),
    runtimeEvidenceMode: graph.runtimeEvidenceMode,
  }));
const report = {
  schemaVersion: 1,
  source: "knowledge-module + explicit Knowledge Graph relations",
  clusterCount: clusterRows.length,
  primaryKnowledgeArticleCount: articles.length,
  unmappedPrimaryKnowledgeArticles: articles.filter((a) => !byCluster.has(a.knowledge.module)).map((a) => a.contentId).sort(),
  graphUnmappedCount: graph.unmapped.length,
  clusters: clusterRows,
  demonstrators,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (args.has("--write")) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, serialized, "utf8");
  console.log(`Wrote ${path.relative(root, outPath)}`);
} else if (args.has("--check")) {
  if (!fs.existsSync(outPath) || fs.readFileSync(outPath, "utf8") !== serialized) {
    console.error("Knowledge Cluster coverage artifact is missing or stale. Run with --write.");
    process.exit(1);
  }
  console.log("Knowledge Cluster coverage artifact is fresh.");
} else {
  process.stdout.write(serialized);
}
