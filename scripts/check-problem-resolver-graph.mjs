import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing Problem Resolver Graph file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const resolverRegistry = read("src/lib/problem-resolver.ts");
const graphConsumer = read("src/lib/problem-resolver-graph.ts");
const resolverComponent = read("src/components/problem-resolver.tsx");
const chineseRoute = read("src/app/(zh)/resolver/page.tsx");
const englishRoute = read("src/app/(en)/en/resolver/page.tsx");
const integrity = read("scripts/check-integrity.mjs");

if (resolverRegistry.includes("knowledge-graph")) {
  failures.push("Problem Resolver decision registry must not import or inspect the Knowledge Graph.");
}
if (!graphConsumer.includes("`symptom:${step.diagnosticSymptomId}`")) {
  failures.push("Resolver Graph consumer must anchor related paths to the finalized diagnosticSymptomId.");
}
if (!graphConsumer.includes("`return-code:${step.returnCodeName}`")) {
  failures.push("Resolver Graph consumer must use the finalized returnCodeName as an optional exact anchor.");
}
for (const relation of ["solvedBy", "involvesApi", "returns"]) {
  if (!graphConsumer.includes(`edge.relation === \"${relation}\"`)) {
    failures.push(`Resolver Graph consumer is missing allowed relation ${relation}.`);
  }
}
for (const forbiddenRelation of ["prerequisiteOf", "relatedTo", "evidencedBy"]) {
  if (graphConsumer.includes(`\"${forbiddenRelation}\"`)) {
    failures.push(`Resolver Graph consumer must not use ${forbiddenRelation} in V1.`);
  }
}
if (!graphConsumer.includes("Math.max(1, Math.min(limit, 6))")) {
  failures.push("Resolver Graph related paths must remain explicitly bounded.");
}
if (!graphConsumer.includes("node.locale !== locale")) {
  failures.push("Resolver Graph article paths must remain same-locale.");
}
if (!graphConsumer.includes("graph.unmapped.length > 0")) {
  failures.push("Resolver Graph consumer must fail closed when the canonical graph has unmapped items.");
}
for (const source of [resolverRegistry, graphConsumer, resolverComponent]) {
  if (source.includes("getPublicVerificationEvidence") || source.includes("getVerifiedContentWithEvidence")) {
    failures.push("Problem Resolver Graph reuse must not read Runtime Evidence stores or bypass Diagnostics ownership.");
  }
}
if (resolverComponent.includes("buildKnowledgeGraphV1") || resolverComponent.includes("knowledge-graph-v1.json")) {
  failures.push("Problem Resolver client component must not import or traverse the full Knowledge Graph.");
}
if (!resolverComponent.includes("relatedPathsByStep") || !resolverComponent.includes("These links are derived only after this deterministic outcome is known")) {
  failures.push("Problem Resolver UI must label Graph paths as post-outcome supplemental navigation.");
}
if (!chineseRoute.includes('buildProblemResolverGraphPaths("zh", graph)') || !chineseRoute.includes("relatedPathsByStep={relatedPathsByStep}")) {
  failures.push("Chinese Resolver route must project server-side Graph paths into the client component.");
}
if (!englishRoute.includes('buildProblemResolverGraphPaths("en", graph)') || !englishRoute.includes("relatedPathsByStep={relatedPathsByStep}")) {
  failures.push("English Resolver route must project server-side Graph paths into the client component.");
}
if (!integrity.includes('["Problem Resolver Graph reuse", "scripts/check-problem-resolver-graph.mjs"]')) {
  failures.push("Problem Resolver Graph governance check must be part of the fail-closed integrity path.");
}

if (failures.length > 0) {
  console.error(`Problem Resolver Graph check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("Problem Resolver Graph check passed: deterministic outcomes remain authoritative while bounded same-locale API/guide/tool paths reuse explicit solvedBy/involvesApi/returns relations after resolution.");
