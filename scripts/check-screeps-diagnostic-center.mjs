import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required Diagnostic Center file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const expectedSymptoms = [
  "creep-not-moving",
  "creep-not-harvesting",
  "spawn-not-spawning",
  "controller-downgrade",
  "link-not-transferring",
  "market-action-failed",
  "cpu-too-high",
  "resources-not-moving",
  "builder-not-building",
  "tower-not-acting",
];

const registry = read("src/lib/screeps-diagnostic-symptoms.ts");
const component = read("src/components/screeps-diagnostic-center.tsx");
const chineseRoute = read("src/app/(zh)/diagnostics/page.tsx");
const englishRoute = read("src/app/(en)/en/diagnostics/page.tsx");
const diagnostics = read("src/lib/screeps-error-diagnostics.ts");
const errors = read("src/lib/screeps-errors.ts");
const apiReference = read("src/lib/screeps-api-reference.ts");
const evidenceRelations = read("src/lib/verification-evidence-relations.ts");
const hubs = read("src/lib/screeps-api-hubs.ts");
const chineseSearch = read("src/lib/search.ts");
const englishSearch = read("src/lib/english-search.ts");
const i18n = read("src/lib/i18n.ts");
const site = read("src/lib/site.ts");
const sitemap = read("src/lib/sitemaps.ts");
const revisions = JSON.parse(read("src/data/static-page-revisions.json") || "{}");
const resolverRegistry = read("src/lib/problem-resolver.ts");
const resolverComponent = read("src/components/problem-resolver.tsx");
const chineseResolverRoute = read("src/app/(zh)/resolver/page.tsx");
const englishResolverRoute = read("src/app/(en)/en/resolver/page.tsx");

const configuredSymptoms = [...registry.matchAll(/^\s{4}id: "([a-z0-9-]+)",$/gm)].map((match) => match[1]);
if (configuredSymptoms.length !== expectedSymptoms.length) {
  failures.push(`Expected exactly ${expectedSymptoms.length} symptom configs, found ${configuredSymptoms.length}.`);
}
for (const id of expectedSymptoms) {
  if (!configuredSymptoms.includes(id)) failures.push(`Missing symptom config: ${id}`);
}

const diagnosticNames = new Set([...diagnostics.matchAll(/name: "(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
const referenceErrorNames = new Set([...errors.matchAll(/name: "(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
const registryErrorNames = new Set([...registry.matchAll(/"(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
for (const name of registryErrorNames) {
  if (!diagnosticNames.has(name) && !referenceErrorNames.has(name)) {
    failures.push(`Symptom registry references an error without a diagnostic or general error-reference path: ${name}`);
  }
}
if (!component.includes("diagnostic ? `diagnostic-${name.toLowerCase()}` : name.toLowerCase()")) {
  failures.push("Diagnostic Center must fall back to the general error anchor when a full diagnostic path is not registered.");
}

const apiIds = new Set([...apiReference.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]));
const directApiBlocks = [...registry.matchAll(/directApiEntryIds:\s*\[([^\]]*)\]/g)];
for (const block of directApiBlocks) {
  for (const match of block[1].matchAll(/"([a-z0-9-]+)"/g)) {
    if (!apiIds.has(match[1])) failures.push(`Symptom registry references missing API entry: ${match[1]}`);
  }
}

const hubSlugs = new Set([...hubs.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map((match) => match[1]));
const directHubBlocks = [...registry.matchAll(/directHubSlugs:\s*\[([^\]]*)\]/g)];
for (const block of directHubBlocks) {
  for (const match of block[1].matchAll(/"([a-z0-9-]+)"/g)) {
    if (!hubSlugs.has(match[1])) failures.push(`Symptom registry references missing Object Hub: ${match[1]}`);
  }
}

for (const [label, source, locale] of [
  ["Chinese Diagnostic Center route", chineseRoute, "zh"],
  ["English Diagnostic Center route", englishRoute, "en"],
]) {
  if (!source.includes("revalidate = 300")) failures.push(`${label} must use 5-minute ISR for verification freshness.`);
  if (!source.includes("ScreepsDiagnosticCenter")) failures.push(`${label} must render the shared Diagnostic Center.`);
  if (!source.includes(`locale=\"${locale}\"`)) failures.push(`${label} must render the correct locale.`);
}

if (!component.includes("getVerifiedContentWithEvidence(locale)")) {
  failures.push("Diagnostic Center must reuse the accepted localized verification content layer.");
}
if (component.includes("getPublicVerificationEvidence(")) {
  failures.push("Diagnostic Center must not bypass the Markdown acceptance boundary with direct public evidence reads.");
}
if (!component.includes("getEvidenceApiReferenceId") || !component.includes("record.evidence.some")) {
  failures.push("Diagnostic Center must bridge accepted structured Runtime Evidence to symptoms through direct API identity, not guide href alone.");
}
if (!evidenceRelations.includes('"structurespawn.spawncreep": "spawn-spawn-creep"')) {
  failures.push("Runtime Evidence API identity must preserve the StructureSpawn.spawnCreep alias used by Diagnostics coverage.");
}
if (!component.includes("getScreepsErrorDiagnostic")) {
  failures.push("Diagnostic Center must reuse the Phase 4A-2 error diagnostic network.");
}

if (!i18n.includes('"/diagnostics": "/en/diagnostics"')) failures.push("Missing bilingual route pair for Diagnostic Center.");
if (!site.includes('{ label: "解决问题", href: "/diagnostics" }')) failures.push("Chinese primary navigation must expose the task-first Diagnostic Center entry.");
if (!i18n.includes('{ label: "Diagnostics", href: "/en/diagnostics" }')) failures.push("English primary navigation must expose the Diagnostic Center.");
if (!revisions["/diagnostics"] || !revisions["/en/diagnostics"]) failures.push("Diagnostic Center routes must be registered in static page revisions.");
if (!sitemap.includes('staticPageEntry("/diagnostics")') || !sitemap.includes('staticPageEntry("/en/diagnostics")')) failures.push("Both Diagnostic Center routes must be present in sitemaps.");
if (!chineseSearch.includes('id: "reference:screeps-diagnostics"') || !chineseSearch.includes("screepsDiagnosticSymptoms")) failures.push("Chinese search must index the symptom-first Diagnostic Center as one document.");
if (!englishSearch.includes('id: "english-diagnostics"') || !englishSearch.includes("screepsDiagnosticSymptoms")) failures.push("English search must index the symptom-first Diagnostic Center as one document.");

const expectedResolverFlows = [
  ["spawn-not-working", "spawn-not-spawning"],
  ["creep-not-moving", "creep-not-moving"],
  ["creep-not-harvesting", "creep-not-harvesting"],
  ["creep-not-upgrading", "controller-downgrade"],
  ["cpu-bucket-abnormal", "cpu-too-high"],
];
for (const [flowId, symptomId] of expectedResolverFlows) {
  if (!resolverRegistry.includes(`flowId: "${flowId}"`)) failures.push(`Problem Resolver missing flow: ${flowId}`);
  if (!resolverRegistry.includes(`symptomId: "${symptomId}"`)) failures.push(`Problem Resolver flow ${flowId} must reuse Diagnostic symptom ${symptomId}.`);
  if (!expectedSymptoms.includes(symptomId)) failures.push(`Problem Resolver references unknown Diagnostic symptom: ${symptomId}`);
}
const resolverStepIds = new Set([...resolverRegistry.matchAll(/stepId: "([a-z0-9-]+)"/g)].map((match) => match[1]));
for (const match of resolverRegistry.matchAll(/nextStepId: "([a-z0-9-]+)"/g)) {
  if (!resolverStepIds.has(match[1])) failures.push(`Problem Resolver has dangling nextStepId: ${match[1]}`);
}
for (const match of resolverRegistry.matchAll(/startStepId: "([a-z0-9-]+)"/g)) {
  if (!resolverStepIds.has(match[1])) failures.push(`Problem Resolver has missing startStepId: ${match[1]}`);
}
const resolverReturnCodes = new Set([...resolverRegistry.matchAll(/returnCodeName: "(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
for (const name of resolverReturnCodes) {
  if (!referenceErrorNames.has(name)) failures.push(`Problem Resolver references unknown return code: ${name}`);
}
if (resolverRegistry.includes("getVerifiedContentWithEvidence") || resolverRegistry.includes("getPublicVerificationEvidence")) failures.push("Problem Resolver registry must not own Runtime Evidence relations.");
if (resolverComponent.includes("getVerifiedContentWithEvidence") || resolverComponent.includes("getPublicVerificationEvidence")) failures.push("Problem Resolver component must hand off Evidence relations to Diagnostics instead of reading Evidence stores.");
if (!resolverComponent.includes('"/en/diagnostics" : "/diagnostics"')) failures.push("Problem Resolver outcomes must hand off to the existing Diagnostic Center.");
if (!chineseRoute.includes('href="/resolver"') || !englishRoute.includes('href="/en/resolver"')) failures.push("Both Diagnostic Center routes must expose the Problem Resolver entry.");
if (!chineseResolverRoute.includes('locale="zh"') || !englishResolverRoute.includes('locale="en"')) failures.push("Problem Resolver routes must render the correct locale.");
if (!i18n.includes('"/resolver": "/en/resolver"')) failures.push("Missing bilingual route pair for Problem Resolver.");
if (!revisions["/resolver"] || !revisions["/en/resolver"]) failures.push("Problem Resolver routes must be registered in static page revisions.");
if (!sitemap.includes('staticPageEntry("/resolver")') || !sitemap.includes('staticPageEntry("/en/resolver")')) failures.push("Both Problem Resolver routes must be present in sitemaps.");

const publicWriteCandidates = [
  path.join(root, "src", "app", "api", "diagnostics", "route.ts"),
  path.join(root, "src", "app", "api", "screeps-diagnostics", "route.ts"),
  path.join(root, "src", "app", "api", "resolver", "route.ts"),
  path.join(root, "src", "app", "api", "problem-resolver", "route.ts"),
];
if (publicWriteCandidates.some((candidate) => fs.existsSync(candidate))) failures.push("Diagnostics / Problem Resolver must not add a public write API.");

if (failures.length > 0) {
  console.error(`Screeps Diagnostic Center check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`Screeps Diagnostic Center check passed: ${expectedSymptoms.length} bilingual symptom paths plus ${expectedResolverFlows.length} deterministic Problem Resolver flows reuse existing Error/API/Hub/Search/Evidence boundaries.`);
