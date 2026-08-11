import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required Error Diagnostic Network file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

async function loadTypeScriptModule(relativePath) {
  const source = read(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: relativePath,
  }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
  return import(url);
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    failures.push(`${label} must be a non-empty string.`);
  }
}

function collectRegisteredEnglishArticles() {
  const libDirectory = path.join(root, "src", "lib");
  const registryFiles = fs.readdirSync(libDirectory)
    .filter((name) =>
      name === "english-articles.ts"
      || /^english-[a-z0-9-]+-registry-\d+\.ts$/.test(name),
    );
  const routes = new Set();

  for (const fileName of registryFiles) {
    const source = fs.readFileSync(path.join(libDirectory, fileName), "utf8");
    for (const match of source.matchAll(
      /["']?href["']?\s*:\s*["'](\/en\/blog\/[a-z0-9-]+)["']/g,
    )) {
      routes.add(match[1]);
    }
  }

  return routes;
}

function routeFileExists(href) {
  const parts = href.split("/").filter(Boolean);
  const routeRoot = parts[0] === "en"
    ? path.join(root, "src", "app", "(en)")
    : path.join(root, "src", "app", "(zh)");
  return fs.existsSync(path.join(routeRoot, ...parts, "page.tsx"));
}

const [diagnosticModule, apiModule, hubModule, errorModule] = await Promise.all([
  loadTypeScriptModule("src/lib/screeps-error-diagnostics.ts"),
  loadTypeScriptModule("src/lib/screeps-api-reference.ts"),
  loadTypeScriptModule("src/lib/screeps-api-hubs.ts"),
  loadTypeScriptModule("src/lib/screeps-errors.ts"),
]);

const diagnostics = diagnosticModule.screepsErrorDiagnostics ?? [];
const apiEntries = apiModule.screepsApiReference ?? [];
const hubs = hubModule.screepsApiHubs ?? [];
const errorCodes = errorModule.screepsErrorCodes ?? [];
const requiredNames = new Set([
  "ERR_NOT_IN_RANGE",
  "ERR_NO_PATH",
  "ERR_NOT_ENOUGH_RESOURCES",
  "ERR_BUSY",
  "ERR_INVALID_TARGET",
  "ERR_FULL",
  "ERR_TIRED",
]);

if (diagnostics.length !== 10) {
  failures.push(`Expected 10 priority diagnostics, found ${diagnostics.length}.`);
}

const diagnosticNames = diagnostics.map((diagnostic) => diagnostic.name);
for (const name of requiredNames) {
  if (!diagnosticNames.includes(name)) failures.push(`Missing required priority diagnostic: ${name}`);
}
for (const duplicate of duplicates(diagnosticNames)) {
  failures.push(`Duplicate priority diagnostic: ${duplicate}`);
}

const apiIds = new Set(apiEntries.map((entry) => entry.id));
const errorNames = new Set(errorCodes.map((error) => error.name));
const hubsBySlug = new Map(hubs.map((hub) => [hub.slug, hub]));
const registeredEnglishArticles = collectRegisteredEnglishArticles();
let apiEdgeCount = 0;
let hubEdgeCount = 0;
let guideEdgeCount = 0;
let toolEdgeCount = 0;

for (const diagnostic of diagnostics) {
  assertNonEmptyString(diagnostic.name, "Diagnostic name");
  assertNonEmptyString(diagnostic.zhSummary, `${diagnostic.name}.zhSummary`);
  assertNonEmptyString(diagnostic.enSummary, `${diagnostic.name}.enSummary`);

  if (!errorNames.has(diagnostic.name)) {
    failures.push(`${diagnostic.name} is missing from the shared Screeps error source.`);
  }

  for (const locale of ["zh", "en"]) {
    const checks = diagnostic[`${locale}Checks`] ?? [];
    const searchTerms = diagnostic[`${locale}SearchTerms`] ?? [];
    if (checks.length < 3) failures.push(`${diagnostic.name}.${locale}Checks needs at least 3 steps.`);
    if (searchTerms.length < 3) failures.push(`${diagnostic.name}.${locale}SearchTerms needs at least 3 aliases.`);
    for (const duplicate of duplicates(checks)) {
      failures.push(`${diagnostic.name}.${locale}Checks contains duplicate: ${duplicate}`);
    }
    for (const value of [...checks, ...searchTerms]) {
      assertNonEmptyString(value, `${diagnostic.name}.${locale} diagnostic text`);
    }
  }
  if (diagnostic.zhChecks.length !== diagnostic.enChecks.length) {
    failures.push(`${diagnostic.name} must keep Chinese and English check counts aligned.`);
  }

  if (diagnostic.apiEntryIds.length === 0) failures.push(`${diagnostic.name} needs at least one API relation.`);
  if (diagnostic.hubSlugs.length === 0) failures.push(`${diagnostic.name} needs at least one Object Hub relation.`);
  if (diagnostic.guides.length === 0) failures.push(`${diagnostic.name} needs at least one guide relation.`);
  if (diagnostic.tools.length === 0) failures.push(`${diagnostic.name} needs at least one tool relation.`);

  for (const apiId of diagnostic.apiEntryIds) {
    apiEdgeCount += 1;
    if (!apiIds.has(apiId)) failures.push(`${diagnostic.name} references unknown API entry: ${apiId}`);
  }

  for (const hubSlug of diagnostic.hubSlugs) {
    hubEdgeCount += 1;
    const hub = hubsBySlug.get(hubSlug);
    if (!hub) {
      failures.push(`${diagnostic.name} references unknown Object Hub: ${hubSlug}`);
    } else if (!hub.errorNames.includes(diagnostic.name)) {
      failures.push(`${diagnostic.name} -> ${hubSlug} is missing the reciprocal Hub -> Error edge.`);
    }
  }

  for (const guide of diagnostic.guides) {
    guideEdgeCount += 1;
    for (const field of ["zhLabel", "enLabel", "zhHref", "enHref"]) {
      assertNonEmptyString(guide[field], `${diagnostic.name}.guides.${field}`);
    }
    const chineseSlug = guide.zhHref.match(/^\/blog\/([a-z0-9-]+)$/)?.[1];
    if (!chineseSlug || !fs.existsSync(path.join(root, "content", "posts", `${chineseSlug}.md`))) {
      failures.push(`${diagnostic.name} references missing Chinese guide: ${guide.zhHref}`);
    }
    if (!registeredEnglishArticles.has(guide.enHref)) {
      failures.push(`${diagnostic.name} references unregistered English guide: ${guide.enHref}`);
    }
  }

  for (const tool of diagnostic.tools) {
    toolEdgeCount += 1;
    for (const field of ["zhLabel", "enLabel", "zhHref", "enHref"]) {
      assertNonEmptyString(tool[field], `${diagnostic.name}.tools.${field}`);
    }
    if (!routeFileExists(tool.zhHref)) failures.push(`${diagnostic.name} references missing Chinese tool: ${tool.zhHref}`);
    if (!routeFileExists(tool.enHref)) failures.push(`${diagnostic.name} references missing English tool: ${tool.enHref}`);
  }
}

for (const hub of hubs) {
  for (const name of hub.errorNames.filter((errorName) => diagnosticNames.includes(errorName))) {
    const diagnostic = diagnostics.find((item) => item.name === name);
    if (!diagnostic.hubSlugs.includes(hub.slug)) {
      failures.push(`${hub.slug} -> ${name} is missing the reciprocal Error -> Hub edge.`);
    }
  }
}

const busy = diagnostics.find((diagnostic) => diagnostic.name === "ERR_BUSY");
if (busy?.apiEntryIds.includes("spawn-recycle-creep")) {
  failures.push("ERR_BUSY must not claim spawn.recycleCreep() as a returning API surface.");
}

const networkComponent = read("src/components/screeps-error-diagnostic-network.tsx");
const apiExplorer = read("src/components/screeps-api-explorer.tsx");
const hubPage = read("src/components/screeps-api-hub-page.tsx");
const relatedComponent = read("src/components/related-error-diagnostics.tsx");
const chineseArticle = read("src/app/(zh)/blog/[slug]/page.tsx");
const englishArticle = read("src/components/english-article-page.tsx");
const chineseVerified = read("src/app/(zh)/verified/page.tsx");
const englishVerified = read("src/app/(en)/en/verified/page.tsx");
const chineseToolsLayout = read("src/app/(zh)/tools/layout.tsx");
const englishToolsLayout = read("src/app/(en)/en/tools/layout.tsx");
const chineseSearch = read("src/lib/search.ts");
const englishSearch = read("src/lib/english-search.ts");
const i18n = read("src/lib/i18n.ts");
const sitemap = read("src/lib/sitemaps.ts");
const verifiedContent = read("src/lib/verified-content.ts");
const evidenceSource = read("src/lib/verification-evidence.ts");
const revisions = JSON.parse(read("src/data/static-page-revisions.json") || "{}");

if (!networkComponent.includes("getVerifiedContentWithEvidence(locale)")) {
  failures.push("Diagnostic cards must use the accepted localized Verification content layer.");
}
if (networkComponent.includes("getPublicVerificationEvidence(")) {
  failures.push("Diagnostic cards must not bypass the Markdown acceptance boundary.");
}
if (!verifiedContent.includes("post.verification.consoleTested || post.verification.liveTested")) {
  failures.push("Verified content must retain the Markdown Console/live acceptance boundary.");
}
if (!evidenceSource.includes('eq(verificationEvidence.status, "accepted")')) {
  failures.push("Structured Runtime Evidence must retain the accepted-status boundary.");
}

for (const [label, source, requiredText] of [
  ["API Explorer", apiExplorer, "getScreepsErrorDiagnosticsForApiEntry"],
  ["Object Hub", hubPage, "getScreepsErrorDiagnosticHref"],
  ["Chinese guide renderer", chineseArticle, "RelatedErrorDiagnostics"],
  ["English guide renderer", englishArticle, "RelatedErrorDiagnostics"],
  ["Chinese tools", chineseToolsLayout, "CurrentToolErrorDiagnostics"],
  ["English tools", englishToolsLayout, "CurrentToolErrorDiagnostics"],
  ["Chinese Verification", chineseVerified, "RelatedErrorDiagnostics"],
  ["English Verification", englishVerified, "RelatedErrorDiagnostics"],
]) {
  if (!source.includes(requiredText)) failures.push(`${label} is missing its reverse diagnostic link.`);
}
if (!relatedComponent.includes("getScreepsErrorDiagnosticsForHref")) {
  failures.push("Guide, Tool, and Verification back-links must derive from the shared diagnostic source.");
}

for (const requiredText of [
  "getScreepsErrorDiagnosticHref",
  "diagnostic?.zhSearchTerms",
  "diagnostic?.zhChecks",
]) {
  if (!chineseSearch.includes(requiredText)) failures.push(`Chinese Search wiring is missing: ${requiredText}`);
}
for (const requiredText of [
  "errorDiagnosticDocuments",
  "diagnostic.enSearchTerms",
  "getScreepsErrorDiagnosticHref",
]) {
  if (!englishSearch.includes(requiredText)) failures.push(`English Search wiring is missing: ${requiredText}`);
}

if (!i18n.includes('"/screeps-errors": "/en/screeps-errors"')) {
  failures.push("Missing bilingual language route pair for the error center.");
}
if (!sitemap.includes('staticPageEntry("/screeps-errors")')
  || !sitemap.includes('staticPageEntry("/en/screeps-errors")')) {
  failures.push("Both localized error centers must remain in Sitemap.");
}
for (const pathname of ["/screeps-errors", "/en/screeps-errors"]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(revisions[pathname] ?? "")
    || revisions[pathname] < "2026-08-11") {
    failures.push(`${pathname} must publish a revision date on or after Phase 4A-2 (2026-08-11).`);
  }
}

const prohibitedWriteRoute = path.join(root, "src", "app", "api", "error-diagnostics", "route.ts");
if (fs.existsSync(prohibitedWriteRoute)) {
  failures.push("Phase 4A-2 must not add a public Error Diagnostic write API.");
}

if (failures.length > 0) {
  console.error(`Screeps Error Diagnostic Network check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Screeps Error Diagnostic Network check passed: ${diagnostics.length} bilingual diagnostics, ${apiEdgeCount} API edges, ${hubEdgeCount} reciprocal Hub edges, ${guideEdgeCount} guide pairs, ${toolEdgeCount} tool pairs, Search/Sitemap/i18n wiring, and the dual Verification acceptance boundary are intact.`,
);
