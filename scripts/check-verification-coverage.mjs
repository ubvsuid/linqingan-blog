import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required Verification Coverage file: ${relativePath}`);
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

const registry = read("src/lib/verification-coverage.ts");
const symptoms = read("src/lib/screeps-diagnostic-symptoms.ts");
const diagnostics = read("src/lib/screeps-error-diagnostics.ts");
const apiReference = read("src/lib/screeps-api-reference.ts");
const component = read("src/components/verification-coverage.tsx");
const diagnosticCenter = read("src/components/screeps-diagnostic-center.tsx");
const chineseRoute = read("src/app/(zh)/verification/coverage/page.tsx");
const englishRoute = read("src/app/(en)/en/verification/coverage/page.tsx");
const chineseVerification = read("src/app/(zh)/verification/page.tsx");
const englishVerification = read("src/app/(en)/en/verification/page.tsx");
const chineseSearch = read("src/lib/search.ts");
const englishSearch = read("src/lib/english-search.ts");
const i18n = read("src/lib/i18n.ts");
const sitemap = read("src/lib/sitemaps.ts");
const packageJson = read("package.json");
const revisions = JSON.parse(read("src/data/static-page-revisions.json") || "{}");

const configuredPlans = [...registry.matchAll(/^\s{4}symptomId: "([a-z0-9-]+)",$/gm)].map((match) => match[1]);
if (configuredPlans.length !== expectedSymptoms.length) {
  failures.push(`Expected exactly ${expectedSymptoms.length} coverage plans, found ${configuredPlans.length}.`);
}
for (const id of expectedSymptoms) {
  if (!configuredPlans.includes(id)) failures.push(`Missing Verification Coverage plan: ${id}`);
}
if (new Set(configuredPlans).size !== configuredPlans.length) {
  failures.push("Verification Coverage plan IDs must be unique.");
}

const symptomIds = new Set([...symptoms.matchAll(/^\s{4}id: "([a-z0-9-]+)",$/gm)].map((match) => match[1]));
for (const id of configuredPlans) {
  if (!symptomIds.has(id)) failures.push(`Coverage plan references missing diagnostic symptom: ${id}`);
}

const priorities = [...registry.matchAll(/^\s{4}priority: "([A-Z0-9]+)",$/gm)].map((match) => match[1]);
if (priorities.length !== expectedSymptoms.length || priorities.some((value) => !["P0", "P1"].includes(value))) {
  failures.push("Every Verification Coverage plan must use P0 or P1 priority.");
}
const targetLevels = [...registry.matchAll(/^\s{4}targetLevel: "([a-z-]+)",$/gm)].map((match) => match[1]);
if (targetLevels.length !== expectedSymptoms.length || targetLevels.some((value) => !["console", "live-multitick"].includes(value))) {
  failures.push("Every Verification Coverage plan must target console or live-multitick evidence.");
}

const diagnosticNames = new Set([...diagnostics.matchAll(/name: "(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
const coverageErrorNames = new Set([...registry.matchAll(/"(ERR_[A-Z_]+)"/g)].map((match) => match[1]));
for (const name of coverageErrorNames) {
  if (!diagnosticNames.has(name)) failures.push(`Coverage plan references an error without a Phase 4A-2 diagnostic path: ${name}`);
}

const apiIds = new Set([...apiReference.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]));
const apiBlocks = [...registry.matchAll(/primaryApiEntryIds:\s*\[([^\]]*)\]/g)];
for (const block of apiBlocks) {
  for (const match of block[1].matchAll(/"([a-z0-9-]+)"/g)) {
    if (!apiIds.has(match[1])) failures.push(`Coverage plan references missing API entry: ${match[1]}`);
  }
}

for (const [label, source, locale] of [
  ["Chinese Verification Coverage route", chineseRoute, "zh"],
  ["English Verification Coverage route", englishRoute, "en"],
]) {
  if (!source.includes("revalidate = 300")) failures.push(`${label} must use 5-minute ISR for evidence freshness.`);
  if (!source.includes("VerificationCoverage")) failures.push(`${label} must render the shared Verification Coverage component.`);
  if (!source.includes(`locale=\"${locale}\"`)) failures.push(`${label} must render the correct locale.`);
}

if (!component.includes("getVerifiedContentWithEvidence(locale)")) {
  failures.push("Verification Coverage must reuse the accepted localized verification content layer.");
}
if (component.includes("getPublicVerificationEvidence(") || component.includes("verification-evidence")) {
  failures.push("Verification Coverage must not bypass the Markdown + accepted Evidence boundary with direct evidence reads.");
}
if (!component.includes("records.length === 0") || !component.includes('"partial" as const') || !component.includes('"covered" as const')) {
  failures.push("Verification Coverage must distinguish unverified, partial, and target-covered completeness from evidence strength.");
}
if (!component.includes('hasLive ? "live-multitick"') || !component.includes('hasConsole ? "console"')) {
  failures.push("Verification Coverage must derive Console/live-multitick evidence strength from accepted records.");
}

if (!i18n.includes('"/verification/coverage": "/en/verification/coverage"')) {
  failures.push("Missing bilingual route pair for Verification Coverage.");
}
if (!revisions["/verification/coverage"] || !revisions["/en/verification/coverage"]) {
  failures.push("Verification Coverage routes must be registered in static page revisions.");
}
if (!sitemap.includes('staticPageEntry("/verification/coverage")') || !sitemap.includes('staticPageEntry("/en/verification/coverage")')) {
  failures.push("Both Verification Coverage routes must be present in sitemaps.");
}
if (!chineseSearch.includes('id: "reference:verification-coverage"') || !chineseSearch.includes("verificationCoveragePlans")) {
  failures.push("Chinese search must index Verification Coverage as one document.");
}
if (!englishSearch.includes('id: "english-verification-coverage"') || !englishSearch.includes("verificationCoveragePlans")) {
  failures.push("English search must index Verification Coverage as one document.");
}
if (!chineseVerification.includes('href="/verification/coverage"')) {
  failures.push("Chinese Verification method page must link to Coverage.");
}
if (!englishVerification.includes('href="/en/verification/coverage"')) {
  failures.push("English Verification method page must link to Coverage.");
}
if (!diagnosticCenter.includes("coverageHref") || !diagnosticCenter.includes("#coverage-${symptom.id}")) {
  failures.push("Diagnostic Center must link each symptom to its Verification Coverage row.");
}
if (!packageJson.includes('"coveragecheck": "node scripts/check-verification-coverage.mjs"')) {
  failures.push("package.json must expose the Verification Coverage governance check.");
}
if (!packageJson.includes("npm run coveragecheck")) {
  failures.push("Verification Coverage governance check must be part of prebuild.");
}

const publicWriteCandidates = [
  path.join(root, "src", "app", "api", "verification", "coverage", "route.ts"),
  path.join(root, "src", "app", "api", "verification-coverage", "route.ts"),
];
if (publicWriteCandidates.some((candidate) => fs.existsSync(candidate))) {
  failures.push("Phase 4C must not add a public Verification Coverage write API.");
}

if (failures.length > 0) {
  console.error(`Verification Coverage check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`Verification Coverage check passed: ${expectedSymptoms.length} symptom paths have bilingual priorities, evidence targets, Search/Sitemap discovery, Diagnostic links, and accepted Verification boundaries.`);
