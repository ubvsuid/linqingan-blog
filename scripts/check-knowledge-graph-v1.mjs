import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const graphPath = path.join(root, "src/generated/knowledge-graph-v1.json");
const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));

assert.equal(graph.schemaVersion, "knowledge-graph/v1", "Knowledge Graph schemaVersion");
assert.equal(typeof graph.fingerprint, "string", "Knowledge Graph fingerprint");
assert.ok(graph.fingerprint.length > 0, "Knowledge Graph fingerprint must not be empty");
assert.ok(Array.isArray(graph.nodes), "Knowledge Graph nodes must be an array");
assert.ok(Array.isArray(graph.edges), "Knowledge Graph edges must be an array");
assert.ok(Array.isArray(graph.unmapped), "Knowledge Graph unmapped must be an array");
assert.equal(graph.unmapped.length, 0, "Knowledge Graph must not contain unmapped inputs");

const nodeTypes = new Set([
  "Article",
  "BeginnerLesson",
  "API",
  "ReturnCode",
  "Symptom",
  "Tool",
  "TickLabExperiment",
  "RuntimeEvidence",
]);
const relations = new Set([
  "explains",
  "usesApi",
  "returns",
  "involvesApi",
  "solvedBy",
  "testedBy",
  "evidencedBy",
  "prerequisiteOf",
  "relatedTo",
]);

const nodeIds = new Set();
const counts = new Map();
for (const node of graph.nodes) {
  assert.equal(typeof node.id, "string", "node.id must be a string");
  assert.ok(node.id.length > 0, "node.id must not be empty");
  assert.ok(nodeTypes.has(node.type), `unknown node type ${node.type}`);
  assert.equal(typeof node.title, "string", `${node.id} title must be a string`);
  assert.ok(node.title.length > 0, `${node.id} title must not be empty`);
  assert.ok(
    node.locale === "zh" || node.locale === "en" || node.locale === "neutral",
    `${node.id} locale must be zh/en/neutral`,
  );
  assert.equal(typeof node.source, "string", `${node.id} source must be a string`);
  assert.equal(nodeIds.has(node.id), false, `duplicate node id ${node.id}`);
  nodeIds.add(node.id);
  counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
}

assert.equal(counts.get("BeginnerLesson"), 12, "Beginner durable graph coverage");
assert.equal(counts.get("Article"), 149, "68 Chinese Knowledge + 81 English Article graph coverage");
assert.equal(counts.get("Tool"), 8, "Tool graph coverage");
assert.equal(counts.get("TickLabExperiment"), 3, "Tick Lab graph coverage");
assert.equal(counts.get("RuntimeEvidence") ?? 0, 0, "Static graph must not persist Runtime Evidence");
assert.ok((counts.get("API") ?? 0) >= 20, "API graph coverage is unexpectedly low");
assert.ok((counts.get("ReturnCode") ?? 0) >= 10, "ReturnCode graph coverage is unexpectedly low");
assert.ok((counts.get("Symptom") ?? 0) >= 8, "Symptom graph coverage is unexpectedly low");

const edgeIds = new Set();
const relationCounts = new Map();
for (const edge of graph.edges) {
  assert.ok(relations.has(edge.relation), `unknown relation ${edge.relation}`);
  assert.ok(nodeIds.has(edge.from), `edge source is missing: ${edge.from}`);
  assert.ok(nodeIds.has(edge.to), `edge target is missing: ${edge.to}`);
  assert.equal(typeof edge.provenance, "string", `${edge.id} provenance must be a string`);
  assert.ok(edge.provenance.length > 0, `${edge.id} provenance must not be empty`);
  assert.equal(edgeIds.has(edge.id), false, `duplicate edge id ${edge.id}`);
  edgeIds.add(edge.id);
  relationCounts.set(edge.relation, (relationCounts.get(edge.relation) ?? 0) + 1);
}

for (const relation of ["explains", "usesApi", "returns", "involvesApi", "solvedBy", "testedBy", "prerequisiteOf", "relatedTo"]) {
  assert.ok((relationCounts.get(relation) ?? 0) > 0, `expected relation coverage for ${relation}`);
}

console.log(
  `[knowledge-graph-check] PASS: ${graph.nodes.length} nodes / ${graph.edges.length} edges / ${graph.unmapped.length} unmapped, fingerprint=${graph.fingerprint}.`,
);
