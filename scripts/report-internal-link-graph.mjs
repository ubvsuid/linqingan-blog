import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const scanRoots = ["content", "src"]
  .map((directory) => path.join(root, directory))
  .filter((directory) => fs.existsSync(directory));
const sourceExtensions = new Set([".md", ".mdx", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".html"]);
const articleRoutePattern = /^\/(?:en\/)?blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const internalRoutePattern = /^\/(?!\/)[^\s"'`<>)]*$/;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    return sourceExtensions.has(path.extname(entry.name)) ? [absolutePath] : [];
  });
}

function normalizeRoute(value) {
  if (!value || !internalRoutePattern.test(value)) return null;
  const [withoutHash] = value.split("#", 1);
  const [withoutQuery] = withoutHash.split("?", 1);
  if (!withoutQuery || withoutQuery.startsWith("/_next") || /\.[a-z0-9]{2,5}$/i.test(withoutQuery)) {
    return null;
  }
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/$/, "") : withoutQuery;
}

function inferRouteFromFile(filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join("/");
  const postMatch = relative.match(/^content\/posts\/([a-z0-9-]+)\.mdx?$/);
  if (postMatch) return `/blog/${postMatch[1]}`;

  const pageMatch = relative.match(/^src\/app\/(?:\([^/]+\)\/)?(.+?)\/page\.(?:t|j)sx?$/);
  if (!pageMatch) return null;
  const routeParts = pageMatch[1]
    .split("/")
    .filter((part) => !part.startsWith("(") && !part.startsWith("@"));
  if (routeParts.some((part) => part.startsWith("[") && part.endsWith("]"))) return null;
  return normalizeRoute(`/${routeParts.join("/")}`);
}

function extractEnglishRegistryArticleRoutes(source, filePath) {
  const relative = path.relative(root, filePath).split(path.sep).join("/");
  const isEnglishArticleRegistry =
    /^src\/lib\/english-.*(?:registry|articles).*\.ts$/.test(relative);
  if (!isEnglishArticleRegistry) return [];

  const routes = [];
  const pattern = /\bhref\s*:\s*["'`](\/en\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*)["'`]/g;
  for (const match of source.matchAll(pattern)) {
    const route = normalizeRoute(match[1]);
    if (route) routes.push(route);
  }
  return routes;
}

function extractLiteralInternalLinks(source) {
  const patterns = [
    /\]\((\/[a-zA-Z0-9_./?#=-]+)(?:\s+["'][^"']*["'])?\)/g,
    /\bhref\s*=\s*["'`](\/[a-zA-Z0-9_./?#=-]+)["'`]/g,
    /\bhref\s*:\s*["'`](\/[a-zA-Z0-9_./?#=-]+)["'`]/g,
    /\b(?:zhHref|enHref|guideHref|moduleHref|articleHref|chinesePath)\s*:\s*["'`](\/[a-zA-Z0-9_./?#=-]+)["'`]/g,
  ];
  const routes = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const route = normalizeRoute(match[1]);
      if (route) routes.push(route);
    }
  }
  return routes;
}

function loadClusterMap(fileName, marker) {
  const filePath = path.join(root, "src", "lib", fileName);
  if (!fs.existsSync(filePath)) return {};
  const source = fs.readFileSync(filePath, "utf8");
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return {};
  const equalsIndex = source.indexOf("=", markerIndex);
  const start = source.indexOf("{", equalsIndex);
  const end = source.lastIndexOf("};");
  if (start < 0 || end < start) throw new Error(`Could not parse ${marker}`);
  return JSON.parse(source.slice(start, end + 1));
}

function loadCuratedClusters() {
  const maps = [
    loadClusterMap("internal-link-clusters.ts", "export const curatedInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-movement.ts", "export const movementInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-debugging.ts", "export const debuggingInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-controller.ts", "export const controllerInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-construction.ts", "export const constructionInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-defense.ts", "export const defenseInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-industry.ts", "export const industryInternalLinkClusters"),
  ];
  const merged = {};

  for (const map of maps) {
    for (const [source, relation] of Object.entries(map)) {
      if (merged[source]) {
        throw new Error(`Duplicate curated source route: ${source}`);
      }
      merged[source] = relation;
    }
  }

  return merged;
}

const files = scanRoots.flatMap(walk);
const routeInventory = new Set(["/", "/en"]);
const knownRoutes = new Set(["/", "/en"]);
const knownArticleRoutes = new Set();
const edges = [];

for (const filePath of files) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceRoute = inferRouteFromFile(filePath);
  if (sourceRoute) {
    routeInventory.add(sourceRoute);
    knownRoutes.add(sourceRoute);
  }
  if (sourceRoute && articleRoutePattern.test(sourceRoute)) knownArticleRoutes.add(sourceRoute);

  for (const route of extractEnglishRegistryArticleRoutes(source, filePath)) {
    routeInventory.add(route);
    knownRoutes.add(route);
    knownArticleRoutes.add(route);
  }

  for (const route of extractLiteralInternalLinks(source)) {
    knownRoutes.add(route);
    if (articleRoutePattern.test(route)) knownArticleRoutes.add(route);
    if (sourceRoute && sourceRoute !== route) {
      edges.push({ source: sourceRoute, target: route, kind: "literal" });
    }
  }
}

const curatedClusters = loadCuratedClusters();
let curatedEdgeCount = 0;
for (const [source, relation] of Object.entries(curatedClusters)) {
  knownRoutes.add(source);
  if (articleRoutePattern.test(source)) knownArticleRoutes.add(source);
  for (const link of relation.links ?? []) {
    const target = normalizeRoute(link.href);
    if (!target || target === source) continue;
    knownRoutes.add(target);
    if (articleRoutePattern.test(target)) knownArticleRoutes.add(target);
    edges.push({ source, target, kind: "curated" });
    curatedEdgeCount += 1;
  }
}

const dedupedEdges = [...new Map(edges.map((edge) => [`${edge.source}\u0000${edge.target}\u0000${edge.kind}`, edge])).values()];
const inbound = new Map();
const outbound = new Map();
for (const edge of dedupedEdges) {
  inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1);
  outbound.set(edge.source, (outbound.get(edge.source) ?? 0) + 1);
}

const missingCuratedSources = [];
const missingCuratedTargets = [];
for (const [source, relation] of Object.entries(curatedClusters)) {
  if (!routeInventory.has(source)) missingCuratedSources.push(source);
  for (const link of relation.links ?? []) {
    const target = normalizeRoute(link.href);
    if (target && !routeInventory.has(target)) missingCuratedTargets.push({ source, target });
  }
}

function rank(map, limit = 15) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit);
}

const zeroInboundArticles = [...knownArticleRoutes]
  .filter((route) => (inbound.get(route) ?? 0) === 0)
  .sort();
const weakInboundArticles = [...knownArticleRoutes]
  .filter((route) => {
    const count = inbound.get(route) ?? 0;
    return count > 0 && count <= 1;
  })
  .sort();

console.log("Internal Link Graph Report");
console.log("==========================");
console.log(`Files scanned: ${files.length}`);
console.log(`Route inventory: ${routeInventory.size}`);
console.log(`Known routes: ${knownRoutes.size}`);
console.log(`Known article routes: ${knownArticleRoutes.size}`);
console.log(`Edges: ${dedupedEdges.length} (${curatedEdgeCount} curated declarations)`);
console.log("");

console.log("Top inbound routes");
for (const [route, count] of rank(inbound)) console.log(`${String(count).padStart(3)}  ${route}`);
console.log("");

console.log("Top outbound routes");
for (const [route, count] of rank(outbound)) console.log(`${String(count).padStart(3)}  ${route}`);
console.log("");

console.log(`Static-literal zero-inbound article routes: ${zeroInboundArticles.length}`);
for (const route of zeroInboundArticles.slice(0, 40)) console.log(`  ${route}`);
if (zeroInboundArticles.length > 40) console.log(`  ... ${zeroInboundArticles.length - 40} more`);
console.log("");

console.log(`Static-literal weak-inbound article routes (1 inbound): ${weakInboundArticles.length}`);
for (const route of weakInboundArticles.slice(0, 40)) console.log(`  ${route}`);
if (weakInboundArticles.length > 40) console.log(`  ... ${weakInboundArticles.length - 40} more`);
console.log("");

if (missingCuratedSources.length > 0 || missingCuratedTargets.length > 0) {
  if (missingCuratedSources.length > 0) {
    console.log("Curated source routes missing from the page/registry inventory:");
    for (const source of missingCuratedSources) console.log(`  ${source}`);
  }
  if (missingCuratedTargets.length > 0) {
    console.log("Curated targets missing from the page/registry inventory:");
    for (const item of missingCuratedTargets) console.log(`  ${item.source} -> ${item.target}`);
  }
  process.exitCode = 1;
} else {
  console.log("Curated source/target inventory check: OK");
}

console.log("");
console.log("Note: route existence uses page files plus published English registry declarations. Zero/weak inbound counts still cover statically discoverable literal links; dynamic recommendations can add additional inbound paths.");
