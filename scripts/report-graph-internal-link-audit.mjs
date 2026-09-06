import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const reportPath = path.join(root, "reports", "graph-internal-link-audit-v1.json");
const graphPath = path.join(root, "src", "generated", "knowledge-graph-v1.json");
const pageNodeTypes = new Set(["Article", "BeginnerLesson"]);
const pageRoutePattern = /^\/(?:en\/)?blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const args = new Set(process.argv.slice(2));

function normalizeRoute(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean || clean.startsWith("/_next") || /\.[a-z0-9]{2,5}$/i.test(clean)) return null;
  return clean.length > 1 ? clean.replace(/\/$/, "") : clean;
}

function loadClusterMap(fileName, marker) {
  const filePath = path.join(root, "src", "lib", fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Missing curated link map: ${fileName}`);
  const source = fs.readFileSync(filePath, "utf8");
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing curated map marker ${marker} in ${fileName}`);
  const equalsIndex = source.indexOf("=", markerIndex);
  const start = source.indexOf("{", equalsIndex);
  const end = source.lastIndexOf("};");
  if (start < 0 || end < start) throw new Error(`Could not parse ${marker}`);
  return JSON.parse(source.slice(start, end + 1));
}

function loadCuratedLinks() {
  const maps = [
    loadClusterMap("internal-link-clusters.ts", "export const curatedInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-movement.ts", "export const movementInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-debugging.ts", "export const debuggingInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-controller.ts", "export const controllerInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-construction.ts", "export const constructionInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-defense.ts", "export const defenseInternalLinkClusters"),
    loadClusterMap("internal-link-clusters-industry.ts", "export const industryInternalLinkClusters"),
  ];
  const sourceOwners = new Set();
  const links = [];

  for (const map of maps) {
    for (const [sourceValue, relation] of Object.entries(map)) {
      const source = normalizeRoute(sourceValue);
      if (!source) throw new Error(`Invalid curated source route: ${sourceValue}`);
      if (sourceOwners.has(source)) throw new Error(`Duplicate curated source route: ${source}`);
      sourceOwners.add(source);
      for (const item of relation.links ?? []) {
        const target = normalizeRoute(item.href);
        if (!target || source === target) continue;
        links.push({ source, target });
      }
    }
  }

  const deduped = [...new Map(links.map((link) => [`${link.source}\u0000${link.target}`, link])).values()]
    .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
  return { sourceOwners, links: deduped };
}

function loadChineseMarkdownEditorialLinks() {
  const postsDir = path.join(root, "content", "posts");
  if (!fs.existsSync(postsDir)) return { links: [] };
  const links = [];
  const pattern = /\]\((\/[a-zA-Z0-9_./?#=-]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const fileName of fs.readdirSync(postsDir).sort()) {
    const match = fileName.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx?$/);
    if (!match) continue;
    const source = `/blog/${match[1]}`;
    const text = fs.readFileSync(path.join(postsDir, fileName), "utf8");
    for (const linkMatch of text.matchAll(pattern)) {
      const target = normalizeRoute(linkMatch[1]);
      if (!target || source === target) continue;
      links.push({ source, target });
    }
  }

  return {
    links: [...new Map(links.map((link) => [`${link.source}\u0000${link.target}`, link])).values()]
      .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target)),
  };
}

function pageDescriptor(node, inbound) {
  return {
    id: node.id,
    href: node.href,
    locale: node.locale,
    type: node.type,
    title: node.title,
    curatedInbound: inbound.get(node.href) ?? 0,
  };
}

function candidateSort(a, b) {
  const priorityOrder = { P0: 0, P1: 1 };
  return (
    priorityOrder[a.priority] - priorityOrder[b.priority]
    || (a.target.curatedInbound ?? 0) - (b.target.curatedInbound ?? 0)
    || a.source.href.localeCompare(b.source.href)
    || a.target.href.localeCompare(b.target.href)
  );
}

export function buildGraphInternalLinkAudit(graph, curated, markdownEditorial = { links: [] }) {
  const errors = [];
  if (graph?.schemaVersion !== 1) errors.push(`Unsupported Knowledge Graph schemaVersion: ${graph?.schemaVersion}`);
  if (!Array.isArray(graph?.nodes) || !Array.isArray(graph?.edges) || !Array.isArray(graph?.unmapped)) {
    errors.push("Knowledge Graph artifact is missing nodes/edges/unmapped arrays");
  }
  if ((graph?.unmapped?.length ?? 0) > 0) {
    errors.push(`Knowledge Graph has ${graph.unmapped.length} unmapped records; audit requires fail-closed Graph input`);
  }

  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const pageNodes = nodes
    .filter((node) => pageNodeTypes.has(node.type) && pageRoutePattern.test(node.href ?? ""))
    .sort((a, b) => a.href.localeCompare(b.href));
  const pageById = new Map(pageNodes.map((node) => [node.id, node]));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const pageByHref = new Map();
  for (const node of pageNodes) {
    if (pageByHref.has(node.href)) errors.push(`Duplicate Graph page href: ${node.href}`);
    pageByHref.set(node.href, node);
  }

  const curatedLinks = Array.isArray(curated?.links) ? curated.links : [];
  const curatedSourceOwners = curated?.sourceOwners instanceof Set
    ? curated.sourceOwners
    : new Set(curated?.sourceOwners ?? []);
  const curatedLinkSet = new Set(curatedLinks.map((link) => `${link.source}\u0000${link.target}`));
  const markdownLinks = Array.isArray(markdownEditorial?.links) ? markdownEditorial.links : [];
  const markdownLinkSet = new Set(markdownLinks.map((link) => `${link.source}\u0000${link.target}`));
  const inbound = new Map();
  for (const link of curatedLinks) inbound.set(link.target, (inbound.get(link.target) ?? 0) + 1);

  const hasEditorialPath = (source, target) =>
    curatedLinkSet.has(`${source}\u0000${target}`) || markdownLinkSet.has(`${source}\u0000${target}`);

  const zeroCuratedInbound = pageNodes
    .filter((node) => (inbound.get(node.href) ?? 0) === 0)
    .map((node) => pageDescriptor(node, inbound));
  const weakCuratedInbound = pageNodes
    .filter((node) => (inbound.get(node.href) ?? 0) === 1)
    .map((node) => pageDescriptor(node, inbound));

  let markdownCoveredPrerequisitePaths = 0;
  const directPrerequisiteGaps = [];
  for (const edge of edges.filter((item) => item.relation === "prerequisiteOf")) {
    const source = pageById.get(edge.from);
    const target = pageById.get(edge.to);
    if (!source || !target || source.locale !== target.locale) continue;
    const key = `${source.href}\u0000${target.href}`;
    if (curatedLinkSet.has(key)) continue;
    if (markdownLinkSet.has(key)) {
      markdownCoveredPrerequisitePaths += 1;
      continue;
    }
    directPrerequisiteGaps.push({
      priority: (inbound.get(target.href) ?? 0) === 0 ? "P0" : "P1",
      kind: "direct-prerequisite",
      source: pageDescriptor(source, inbound),
      target: pageDescriptor(target, inbound),
      evidence: [`${edge.relation}:${edge.provenance}`],
    });
  }
  directPrerequisiteGaps.sort(candidateSort);

  const semanticCandidates = new Map();
  function addSemanticCandidate(source, target, evidence) {
    if (!source || !target || source.id === target.id || source.locale !== target.locale) return;
    if ((inbound.get(target.href) ?? 0) > 1) return;
    if (hasEditorialPath(source.href, target.href)) return;
    const key = `${source.id}\u0000${target.id}`;
    const existing = semanticCandidates.get(key);
    if (existing) {
      existing.evidence.push(evidence);
      existing.evidence = [...new Set(existing.evidence)].sort();
      return;
    }
    semanticCandidates.set(key, {
      priority: "P1",
      kind: "semantic-page-gap",
      source: pageDescriptor(source, inbound),
      target: pageDescriptor(target, inbound),
      evidence: [evidence],
    });
  }

  const apiPages = new Map();
  for (const edge of edges) {
    if (edge.relation !== "explains" && edge.relation !== "usesApi") continue;
    const page = pageById.get(edge.from);
    const api = nodeById.get(edge.to);
    if (!page || api?.type !== "API") continue;
    const current = apiPages.get(api.id) ?? [];
    current.push(page);
    apiPages.set(api.id, current);
  }
  for (const [apiId, pages] of apiPages) {
    const uniquePages = [...new Map(pages.map((page) => [page.id, page])).values()];
    for (const source of uniquePages) {
      for (const target of uniquePages) addSemanticCandidate(source, target, `shared-api:${apiId}`);
    }
  }

  const symptomPages = new Map();
  const symptomTools = new Map();
  for (const edge of edges.filter((item) => item.relation === "solvedBy")) {
    const symptom = nodeById.get(edge.from);
    const target = nodeById.get(edge.to);
    if (symptom?.type !== "Symptom" || !target) continue;
    if (pageNodeTypes.has(target.type)) {
      const current = symptomPages.get(symptom.id) ?? [];
      current.push(target);
      symptomPages.set(symptom.id, current);
    } else if (target.type === "Tool") {
      const current = symptomTools.get(symptom.id) ?? [];
      current.push(target);
      symptomTools.set(symptom.id, current);
    }
  }
  for (const [symptomId, pages] of symptomPages) {
    const uniquePages = [...new Map(pages.map((page) => [page.id, page])).values()];
    for (const source of uniquePages) {
      for (const target of uniquePages) addSemanticCandidate(source, target, `shared-symptom:${symptomId}`);
    }
  }
  const semanticPageGaps = [...semanticCandidates.values()].sort(candidateSort);

  const utilityCandidates = new Map();
  for (const [symptomId, pages] of symptomPages) {
    for (const page of pages) {
      if (page.locale !== "zh") continue;
      for (const tool of symptomTools.get(symptomId) ?? []) {
        if (!tool.href || hasEditorialPath(page.href, tool.href)) continue;
        const key = `${page.id}\u0000${tool.id}`;
        const existing = utilityCandidates.get(key);
        if (existing) {
          existing.evidence.push(`shared-symptom:${symptomId}`);
          existing.evidence = [...new Set(existing.evidence)].sort();
          continue;
        }
        utilityCandidates.set(key, {
          priority: "P1",
          kind: "article-tool-bridge",
          source: pageDescriptor(page, inbound),
          target: {
            id: tool.id,
            href: tool.href,
            locale: tool.locale,
            type: tool.type,
            title: tool.title,
          },
          evidence: [`shared-symptom:${symptomId}`],
        });
      }
    }
  }
  const articleToolGaps = [...utilityCandidates.values()].sort(
    (a, b) => a.source.href.localeCompare(b.source.href) || a.target.href.localeCompare(b.target.href),
  );

  const bilingualPairs = new Map();
  for (const zh of pageNodes.filter((node) => node.locale === "zh")) {
    const english = pageById.get(`en_${zh.id}`);
    if (english?.locale === "en") {
      bilingualPairs.set(`${zh.id}\u0000${english.id}`, { zh, en: english, evidence: "derived-bilingual-id" });
    }
  }
  for (const edge of edges.filter((item) => item.relation === "relatedTo")) {
    const left = pageById.get(edge.from);
    const right = pageById.get(edge.to);
    if (!left || !right || left.locale === right.locale) continue;
    const zh = left.locale === "zh" ? left : right;
    const en = left.locale === "en" ? left : right;
    bilingualPairs.set(`${zh.id}\u0000${en.id}`, {
      zh,
      en,
      evidence: `explicit-relatedTo:${edge.provenance}`,
    });
  }

  const bilingualAsymmetry = [];
  for (const pair of bilingualPairs.values()) {
    const zhInbound = inbound.get(pair.zh.href) ?? 0;
    const enInbound = inbound.get(pair.en.href) ?? 0;
    const zhSource = curatedSourceOwners.has(pair.zh.href);
    const enSource = curatedSourceOwners.has(pair.en.href);
    const materiallyUneven =
      (zhInbound === 0) !== (enInbound === 0)
      || Math.abs(zhInbound - enInbound) >= 2
      || zhSource !== enSource;
    if (!materiallyUneven) continue;
    bilingualAsymmetry.push({
      priority: "P1",
      zh: pageDescriptor(pair.zh, inbound),
      en: pageDescriptor(pair.en, inbound),
      zhCuratedSource: zhSource,
      enCuratedSource: enSource,
      evidence: pair.evidence,
    });
  }
  bilingualAsymmetry.sort(
    (a, b) =>
      Math.max(b.zh.curatedInbound, b.en.curatedInbound) - Math.max(a.zh.curatedInbound, a.en.curatedInbound)
      || a.zh.href.localeCompare(b.zh.href),
  );

  return {
    schemaVersion: 1,
    audit: "graph-powered-internal-link-audit/v1",
    scope: "read-only-curated-plus-chinese-markdown-gap-audit",
    graphFingerprint: graph?.sourceFingerprint ?? null,
    counts: {
      graphNodes: nodes.length,
      graphEdges: edges.length,
      graphUnmapped: graph?.unmapped?.length ?? 0,
      pageNodes: pageNodes.length,
      curatedSources: curatedSourceOwners.size,
      curatedEdges: curatedLinks.length,
      chineseMarkdownEditorialEdges: markdownLinks.length,
      markdownCoveredPrerequisitePaths,
      zeroCuratedInbound: zeroCuratedInbound.length,
      weakCuratedInbound: weakCuratedInbound.length,
      directPrerequisiteGaps: directPrerequisiteGaps.length,
      semanticPageGaps: semanticPageGaps.length,
      articleToolGaps: articleToolGaps.length,
      bilingualPairs: bilingualPairs.size,
      bilingualAsymmetry: bilingualAsymmetry.length,
    },
    priorities: {
      P0: {
        zeroCuratedInbound,
        directPrerequisiteGaps: directPrerequisiteGaps.filter((item) => item.priority === "P0"),
      },
      P1: {
        weakCuratedInbound,
        directPrerequisiteGaps: directPrerequisiteGaps.filter((item) => item.priority === "P1"),
        semanticPageGaps,
        articleToolGaps,
        bilingualAsymmetry,
      },
    },
    notes: [
      "Zero/weak inbound still means zero/one curated editorial inbound edge; it does not mean the page is unreachable or lacks Markdown body links.",
      "Actionable prerequisite, semantic-page, and Chinese article-to-tool candidates are suppressed when the exact Chinese Markdown source→target path already exists.",
      "English article-body links are not parsed in V1.1; English candidate lists remain curated-map signals and still require manual editorial review.",
      "Candidates are deterministic audit suggestions only. They do not mutate articles and must still pass the article-link usefulness rule before any editorial change.",
      "Bilingual asymmetry remains a curated-map coverage signal, not a recommendation to add cross-language body links.",
    ],
    errors: errors.sort(),
  };
}

function runSyntheticSelfTest() {
  const graph = {
    schemaVersion: 1,
    sourceFingerprint: "fixture",
    unmapped: [],
    nodes: [
      { id: "article:a", type: "Article", title: "A", href: "/blog/a", locale: "zh", source: "fixture" },
      { id: "article:b", type: "Article", title: "B", href: "/blog/b", locale: "zh", source: "fixture" },
      { id: "en_article:a", type: "Article", title: "A EN", href: "/en/blog/a", locale: "en", source: "fixture" },
      { id: "en_article:b", type: "Article", title: "B EN", href: "/en/blog/b", locale: "en", source: "fixture" },
      { id: "api:test", type: "API", title: "API", locale: "neutral", source: "fixture" },
      { id: "symptom:test", type: "Symptom", title: "Symptom", locale: "zh", source: "fixture" },
      { id: "tool:test", type: "Tool", title: "Tool", href: "/tools/test", locale: "zh", source: "fixture" },
    ],
    edges: [
      { from: "article:a", to: "article:b", relation: "prerequisiteOf", provenance: "fixture" },
      { from: "article:a", to: "api:test", relation: "explains", provenance: "fixture" },
      { from: "article:b", to: "api:test", relation: "explains", provenance: "fixture" },
      { from: "symptom:test", to: "article:a", relation: "solvedBy", provenance: "fixture" },
      { from: "symptom:test", to: "tool:test", relation: "solvedBy", provenance: "fixture" },
    ],
  };
  const curated = {
    sourceOwners: new Set(["/blog/a", "/en/blog/a"]),
    links: [{ source: "/en/blog/a", target: "/en/blog/b" }],
  };
  const report = buildGraphInternalLinkAudit(graph, curated);
  if (report.errors.length !== 0) throw new Error(`Self-test errors: ${report.errors.join(", ")}`);
  if (report.counts.zeroCuratedInbound !== 3) throw new Error("Self-test zero curated inbound mismatch");
  if (report.counts.directPrerequisiteGaps !== 1) throw new Error("Self-test prerequisite gap mismatch");
  if (!report.priorities.P1.semanticPageGaps.some((item) => item.source.href === "/blog/b" && item.target.href === "/blog/a")) {
    throw new Error("Self-test shared API semantic candidate missing");
  }
  if (!report.priorities.P1.articleToolGaps.some((item) => item.source.href === "/blog/a" && item.target.href === "/tools/test")) {
    throw new Error("Self-test article-to-tool bridge missing");
  }
  if (!report.priorities.P1.bilingualAsymmetry.some((item) => item.zh.href === "/blog/b")) {
    throw new Error("Self-test bilingual asymmetry missing");
  }

  const markdownAware = buildGraphInternalLinkAudit(graph, curated, {
    links: [
      { source: "/blog/a", target: "/blog/b" },
      { source: "/blog/a", target: "/tools/test" },
    ],
  });
  if (markdownAware.counts.directPrerequisiteGaps !== 0) {
    throw new Error("Self-test Markdown prerequisite suppression failed");
  }
  if (markdownAware.counts.markdownCoveredPrerequisitePaths !== 1) {
    throw new Error("Self-test Markdown prerequisite coverage mismatch");
  }
  if (markdownAware.priorities.P1.articleToolGaps.some((item) => item.source.href === "/blog/a" && item.target.href === "/tools/test")) {
    throw new Error("Self-test Markdown tool suppression failed");
  }
}

function buildCurrentReport() {
  const baseline = spawnSync(process.execPath, [path.join(root, "scripts", "report-internal-link-graph.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  if (baseline.status !== 0) {
    process.stderr.write(baseline.stdout ?? "");
    process.stderr.write(baseline.stderr ?? "");
    throw new Error("Existing internal-link route inventory report failed; refusing semantic audit");
  }
  if (!fs.existsSync(graphPath)) throw new Error(`Missing Knowledge Graph artifact: ${path.relative(root, graphPath)}`);
  const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
  return buildGraphInternalLinkAudit(graph, loadCuratedLinks(), loadChineseMarkdownEditorialLinks());
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function printSummary(report) {
  console.log("Graph-powered Internal Link Audit V1");
  console.log("====================================");
  console.log(`Graph: ${report.counts.graphNodes} nodes / ${report.counts.graphEdges} edges / ${report.counts.graphUnmapped} unmapped`);
  console.log(`Graph page nodes: ${report.counts.pageNodes}`);
  console.log(`Curated links: ${report.counts.curatedSources} sources / ${report.counts.curatedEdges} edges`);
  console.log(`Chinese Markdown editorial links: ${report.counts.chineseMarkdownEditorialEdges}`);
  console.log(`Prerequisite paths already covered by Chinese Markdown: ${report.counts.markdownCoveredPrerequisitePaths}`);
  console.log(`P0 zero curated inbound: ${report.counts.zeroCuratedInbound}`);
  console.log(`P0/P1 actionable direct prerequisite gaps: ${report.counts.directPrerequisiteGaps}`);
  console.log(`P1 weak curated inbound: ${report.counts.weakCuratedInbound}`);
  console.log(`P1 semantic page gaps: ${report.counts.semanticPageGaps}`);
  console.log(`P1 article -> tool gaps: ${report.counts.articleToolGaps}`);
  console.log(`Bilingual pairs / asymmetry: ${report.counts.bilingualPairs} / ${report.counts.bilingualAsymmetry}`);
  console.log("");

  const p0Targets = report.priorities.P0.zeroCuratedInbound.slice(0, 20);
  console.log("P0 diagnostic: zero curated inbound page nodes (first 20)");
  for (const item of p0Targets) console.log(`  ${item.locale} ${item.href} — ${item.title}`);
  if (report.priorities.P0.zeroCuratedInbound.length > 20) {
    console.log(`  ... ${report.priorities.P0.zeroCuratedInbound.length - 20} more in the JSON report`);
  }
  console.log("");

  const topCandidates = [
    ...report.priorities.P0.directPrerequisiteGaps,
    ...report.priorities.P1.directPrerequisiteGaps,
    ...report.priorities.P1.semanticPageGaps,
    ...report.priorities.P1.articleToolGaps,
  ].sort(candidateSort).slice(0, 20);
  console.log("Top actionable semantic gap candidates (first 20)");
  for (const item of topCandidates) {
    console.log(`  ${item.priority} ${item.source.href} -> ${item.target.href} [${item.evidence.join(", ")}]`);
  }
  if (topCandidates.length === 0) console.log("  none");
  console.log("");
  console.log("Read-only boundary: gaps are findings, not build failures and not automatic link edits.");
}

try {
  runSyntheticSelfTest();
  if (args.has("--self-test")) {
    console.log("Graph-powered Internal Link Audit V1 synthetic self-test: PASS");
    process.exit(0);
  }

  const report = buildCurrentReport();
  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(`ERROR: ${error}`);
    process.exit(1);
  }
  const expected = stableJson(report);

  if (args.has("--write")) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, expected, "utf8");
    console.log(`Wrote ${path.relative(root, reportPath)}`);
  }

  if (args.has("--check")) {
    if (!fs.existsSync(reportPath)) {
      console.error(`ERROR: Missing deterministic audit artifact ${path.relative(root, reportPath)}`);
      process.exit(1);
    }
    const actual = fs.readFileSync(reportPath, "utf8");
    if (actual !== expected) {
      console.error(`ERROR: ${path.relative(root, reportPath)} is stale. Run node scripts/report-graph-internal-link-audit.mjs --write.`);
      process.exit(1);
    }
    console.log("Graph-powered Internal Link Audit V1 freshness/integrity check: PASS");
  }

  if (args.has("--json") && !args.has("--write") && !args.has("--check")) {
    process.stdout.write(expected);
  } else {
    printSummary(report);
  }
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
