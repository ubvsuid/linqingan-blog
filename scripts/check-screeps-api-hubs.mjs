import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required API hub file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

const expectedSlugs = [
  "creep",
  "room",
  "structure-spawn",
  "controller",
  "market",
  "structure-link",
  "structure-tower",
  "structure-terminal",
  "structure-lab",
  "path-finder",
  "store",
];
const hubConfig = read("src/lib/screeps-api-hubs.ts");
const apiReference = read("src/lib/screeps-api-reference.ts");
const chineseRoute = read("src/app/(zh)/screeps-api/[hub]/page.tsx");
const englishRoute = read("src/app/(en)/en/screeps-api/[hub]/page.tsx");
const hubPage = read("src/components/screeps-api-hub-page.tsx");
const directory = read("src/components/screeps-api-hub-directory.tsx");
const chineseParent = read("src/app/(zh)/screeps-api/page.tsx");
const englishParent = read("src/app/(en)/en/screeps-api/page.tsx");
const i18n = read("src/lib/i18n.ts");
const sitemap = read("src/lib/sitemaps.ts");
const revisions = JSON.parse(read("src/data/static-page-revisions.json") || "{}");
const chineseSearch = read("src/lib/search.ts");
const englishSearch = read("src/lib/english-search.ts");
const englishErrors = read("src/app/(en)/en/screeps-errors/page.tsx");

const configuredSlugs = [...hubConfig.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map(
  (match) => match[1],
);
if (configuredSlugs.length !== expectedSlugs.length) {
  failures.push(`Expected exactly ${expectedSlugs.length} API hub configs, found ${configuredSlugs.length}.`);
}
for (const slug of expectedSlugs) {
  if (!configuredSlugs.includes(slug)) failures.push(`Missing API hub config: ${slug}`);
}

const configuredEntryIds = [
  ...hubConfig.matchAll(/entryIds:\s*\[([\s\S]*?)\],\n\s*errorNames:/g),
].flatMap((match) => [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((entry) => entry[1]));
const referenceIds = new Set(
  [...apiReference.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]),
);
for (const id of configuredEntryIds) {
  if (!referenceIds.has(id)) failures.push(`API hub references missing quick-reference entry: ${id}`);
}

for (const [label, source] of [
  ["Chinese hub route", chineseRoute],
  ["English hub route", englishRoute],
]) {
  if (!source.includes("generateStaticParams")) failures.push(`${label} must statically enumerate the configured hubs.`);
  if (!source.includes("revalidate = 300")) failures.push(`${label} must use 5-minute ISR for verification freshness.`);
  if (!source.includes("ScreepsApiHubPage")) failures.push(`${label} must render the shared hub page.`);
}

for (const [label, source, locale] of [
  ["Chinese API parent", chineseParent, "zh"],
  ["English API parent", englishParent, "en"],
]) {
  if (!source.includes("ScreepsApiHubDirectory")) failures.push(`${label} must expose the object-hub directory.`);
  if (!source.includes(`locale=\"${locale}\"`)) failures.push(`${label} must render the correct localized hub directory.`);
  if (!source.includes("ScreepsApiExplorer")) failures.push(`${label} must retain the original searchable API reference.`);
}

if (!directory.includes("screepsApiHubs.map")) {
  failures.push("API hub directory must be generated from the shared hub configuration.");
}

for (const slug of expectedSlugs) {
  const chinesePath = `/screeps-api/${slug}`;
  const englishPath = `/en/screeps-api/${slug}`;
  if (!i18n.includes(`"${chinesePath}": "${englishPath}"`)) {
    failures.push(`Missing language route pair for ${slug}.`);
  }
  if (!revisions[chinesePath] || !revisions[englishPath]) {
    failures.push(`Missing static revision registration for ${slug} hub pair.`);
  }
}

if (!sitemap.includes("screepsApiHubSlugs")) {
  failures.push("Sitemap must derive API hub routes from screepsApiHubSlugs.");
}
if (!chineseSearch.includes("apiHubDocuments") || !chineseSearch.includes("screepsApiHubs.map")) {
  failures.push("Chinese Search V2 source must index API object hubs.");
}
if (!englishSearch.includes("apiHubDocuments") || !englishSearch.includes("screepsApiHubs.map")) {
  failures.push("English search must index API object hubs.");
}

if (!hubPage.includes("getVerifiedContentWithEvidence")) {
  failures.push("API hubs must consume the existing accepted verification content layer.");
}
if (hubPage.includes("getPublicVerificationEvidence(")) {
  failures.push("API hubs must not bypass the Markdown acceptance boundary by reading public evidence directly.");
}
if (!hubPage.includes("getVerifiedContentWithEvidence(locale)")) {
  failures.push("API hubs must request localized accepted verification records.");
}

if (!englishErrors.includes('id={name.toLowerCase()}')) {
  failures.push("English error reference must expose stable anchors for hub return-code links.");
}
if (!englishErrors.includes('"ERR_NOT_ENOUGH_RESOURCES"')) {
  failures.push("English error reference must expose ERR_NOT_ENOUGH_RESOURCES used by API hubs.");
}

const exactPublicWriteRoute = path.join(root, "src", "app", "api", "screeps-api-hubs", "route.ts");
if (fs.existsSync(exactPublicWriteRoute)) {
  failures.push("API hub phase must not add a public hub write API.");
}

if (failures.length > 0) {
  console.error(`Screeps API object hub check failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Screeps API object hub check passed: ${expectedSlugs.length} bilingual hubs reuse the shared API reference, Search, Sitemap, language mapping, and accepted Verification boundary.`,
);
