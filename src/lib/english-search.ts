import { englishDiscoveryArticles, englishTags } from "@/lib/english-discovery";
import { getKnowledgeGraphSearchRouteSignals } from "@/lib/knowledge-graph-search";
import {
  getKnowledgeGraphSearchAnchorEntityId,
  getKnowledgeGraphSearchSignalScore,
  type KnowledgeGraphSearchSignal,
} from "@/lib/knowledge-graph-search-policy";
import { getScreepsApiHubHref, screepsApiHubs } from "@/lib/screeps-api-hubs";
import { screepsDiagnosticSymptoms } from "@/lib/screeps-diagnostic-symptoms";
import { screepsErrorDiagnostics } from "@/lib/screeps-error-diagnostics";
import { getScreepsIntentPromotions, type ScreepsEntityKind } from "@/lib/screeps-entity-intent";
import { getToolHref, toolCatalog } from "@/lib/tool-catalog";
import { verificationCoveragePlans } from "@/lib/verification-coverage";

export interface EnglishSearchDocument {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "Page" | "Reference" | "Tool" | "Article";
  keywords: string[];
  graphSearch?: KnowledgeGraphSearchSignal[];
}

const knowledgeModuleSearchTerms: Record<number, string[]> = {
  1: ["memory", "code", "module", "state", "configuration", "javascript", "cache"],
  2: ["spawn", "creep", "body", "lifecycle", "renew", "recycle", "replacement"],
  3: ["energy", "economy", "source", "container", "storage", "link", "hauling", "delivery"],
  4: ["move", "movement", "path", "pathfinding", "route", "vision", "roomposition", "observer"],
  5: ["controller", "upgrade", "reserve", "claim", "expansion", "downgrade", "safe mode"],
  6: ["construction", "build", "repair", "defense", "defence", "tower", "wall", "rampart"],
  7: ["market", "resource", "terminal", "lab", "boost", "factory", "mineral", "power"],
  8: ["operation", "debug", "debugging", "diagnostic", "cpu", "bucket", "event", "notify", "visual"],
};

function compactKeywords(values: string[], limit = 24): string[] {
  const seen = new Set<string>();
  const compact: string[] = [];

  for (const value of values) {
    const normalized = value.normalize("NFKC").trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("en");
    if (seen.has(key)) continue;
    seen.add(key);
    compact.push(normalized.slice(0, 120));
    if (compact.length >= limit) break;
  }

  return compact;
}

const foundationDocuments: EnglishSearchDocument[] = [
  { id: "english-home", title: "Screeps Tutorials, Debugging Guides and Tools", description: "The English home for practical Screeps learning, debugging, references, and tools.", href: "/en", type: "Page", keywords: ["screeps", "tutorial", "debugging", "javascript", "automation"] },
  { id: "english-beginner", title: "Screeps Beginner Roadmap", description: "A learning sequence from ticks and the first Creep to roles, upgrading, construction, and a room loop.", href: "/en/beginner", type: "Page", keywords: ["beginner", "first creep", "spawn", "harvest", "upgrade controller"] },
  { id: "english-knowledge", title: "Screeps Knowledge Base", description: "A structured map for Memory, spawning, economy, movement, Controllers, defense, market systems, and debugging.", href: "/en/knowledge", type: "Page", keywords: ["memory", "spawn", "economy", "pathfinding", "controller", "market", "cpu"] },
  {
    id: "english-diagnostics",
    title: "Screeps Diagnostic Center",
    description: "Start from visible symptoms such as a Creep not moving, Spawn failures, Controller downgrade pressure, Link transfer problems, Market failures, high CPU, or stalled logistics, then continue into return codes, APIs, object hubs, guides, tools, and runtime verification.",
    href: "/en/diagnostics",
    type: "Reference",
    keywords: compactKeywords([
      "screeps diagnostics",
      "symptom troubleshooting",
      ...screepsDiagnosticSymptoms.map((symptom) => symptom.enTitle),
      ...screepsDiagnosticSymptoms.flatMap((symptom) => symptom.enSearchTerms),
    ], 24),
  },
  {
    id: "english-verification-coverage",
    title: "Screeps Verification Coverage and Evidence Priorities",
    description: "See which high-frequency diagnostic paths have accepted Console or live multi-tick verification, what evidence is missing, and which runtime checks should come next.",
    href: "/en/verification/coverage",
    type: "Reference",
    keywords: compactKeywords([
      "verification coverage",
      "evidence priority",
      "console verification",
      "live multi-tick",
      "evidence gap",
      ...verificationCoveragePlans.map((plan) => plan.symptomId),
      ...verificationCoveragePlans.flatMap((plan) => plan.primaryErrorNames),
    ], 24),
  },
  { id: "english-api-reference", title: "Screeps API Quick Reference", description: "Search common Game, Creep, Room, Structure, Market, and PathFinder APIs and continue to matching guides or official documentation.", href: "/en/screeps-api", type: "Reference", keywords: ["screeps api", "game api", "creep api", "room api", "structure api", "pathfinder", "market"] },
  { id: "english-topics", title: "English Screeps Topics", description: "Topic archives for Memory, spawning, Creeps, Energy, movement, pathfinding, Controllers, construction, defense, market systems, resources, CPU, debugging, and JavaScript.", href: "/en/tags", type: "Page", keywords: ["topics", "tags", "memory", "movement", "defense", "market", "debugging"] },
  {
    id: "english-errors",
    title: "Screeps Error Codes and Return Values",
    description: "High-frequency Screeps error codes with diagnostic paths into APIs, object hubs, guides, tools, and runtime verification.",
    href: "/en/screeps-errors",
    type: "Reference",
    keywords: compactKeywords([
      "return code",
      "screeps error",
      "diagnostic path",
      ...screepsErrorDiagnostics.map((diagnostic) => diagnostic.name),
      ...screepsErrorDiagnostics.flatMap((diagnostic) => diagnostic.enSearchTerms),
    ], 24),
  },
  { id: "english-glossary", title: "Screeps Glossary", description: "Definitions for Creep, Spawn, tick, Memory, Controller, RCL, GCL, CPU, bucket, store, and fatigue.", href: "/en/glossary", type: "Reference", keywords: ["glossary", "creep", "spawn", "tick", "rcl", "gcl", "bucket", "fatigue"] },
  { id: "english-verification", title: "How Screeps Guides Are Verified", description: "Documentation checks, syntax checks, offline simulation, Console testing, and live multi-tick verification.", href: "/en/verification", type: "Reference", keywords: ["verification", "tested", "console", "simulation", "live room"] },
  { id: "english-recently-verified", title: "Recently Verified Screeps Guides", description: "English guides mapped to source records with explicit Console testing or live multi-tick verification evidence.", href: "/en/verified", type: "Reference", keywords: ["recently verified", "console tested", "live tested", "runtime evidence", "multi-tick"] },
  { id: "english-tools", title: "Free Screeps Tools and Calculators", description: "Browser-based body, room, Market, Controller, Lab, Spawn, hauling, and Tower tools that do not request a Screeps token or connect to an account.", href: "/en/tools", type: "Page", keywords: ["tools", "calculator", "diagnostics", "market", "controller", "lab", "spawn", "hauling", "tower", "free"] },
  { id: "english-about", title: "About Linqingan and the Screeps Knowledge Project", description: "Project purpose, verification approach, evidence boundaries, public development history, repository, and contact information.", href: "/en/about", type: "Page", keywords: ["linqingan", "about", "github", "project", "evidence", "public history"] },
  { id: "english-changelog", title: "English Site Changelog", description: "Meaningful changes to the English interface, navigation, search, tools, accessibility, and technical SEO.", href: "/en/changelog", type: "Page", keywords: ["changelog", "updates", "release notes", "site changes"] },
  { id: "english-roadmap", title: "English Site Roadmap", description: "Completed work, next improvements, evidence-dependent tasks, tool development, accessibility, and performance checks.", href: "/en/roadmap", type: "Page", keywords: ["roadmap", "next", "planned", "evidence", "performance"] },
  { id: "english-license", title: "Content and Code Use", description: "Current boundaries for reusing site content, code examples, third-party names, and commercial material.", href: "/en/license", type: "Reference", keywords: ["license", "copyright", "reuse", "permission", "code examples"] },
];

const apiHubDocuments: EnglishSearchDocument[] = screepsApiHubs.map((hub) => ({
  id: `english-api-hub-${hub.slug}`,
  title: `Screeps ${hub.enTitle}`,
  description: hub.enDescription,
  href: getScreepsApiHubHref(hub.slug, "en"),
  type: "Reference",
  keywords: ["screeps api hub", "object hub", hub.objectName, ...hub.keywords],
}));

const toolDocuments: EnglishSearchDocument[] = toolCatalog.map((tool) => ({
  id: `english-${tool.slug}`,
  title: `Screeps ${tool.enTitle}`,
  description: tool.enDescription,
  href: getToolHref(tool.slug, "en"),
  type: "Tool",
  keywords: [...tool.enKeywords],
}));

const topicDocuments: EnglishSearchDocument[] = englishTags.map((tag) => ({
  id: `english-topic-${tag.slug}`,
  title: `${tag.label} Screeps Guides`,
  description: `Browse ${tag.count} published English guides related to ${tag.label}.`,
  href: `/en/tags/${tag.slug}`,
  type: "Page",
  keywords: [tag.label, ...tag.terms],
}));

const articleDocuments: EnglishSearchDocument[] = englishDiscoveryArticles.map((article) => ({
  id: article.href.replace(/^\//, "").replaceAll("/", "-"),
  title: article.title,
  description: article.description,
  href: article.href,
  type: "Article",
  keywords: compactKeywords([
    article.primaryKeyword,
    article.moduleTitle,
    ...knowledgeModuleSearchTerms[article.moduleNumber],
    ...article.tags,
    ...article.keywords,
  ]),
}));

const englishGraphSearchSignals = getKnowledgeGraphSearchRouteSignals("en");

export const englishSearchDocuments: EnglishSearchDocument[] = [
  ...articleDocuments,
  ...topicDocuments,
  ...toolDocuments,
  ...apiHubDocuments,
  ...foundationDocuments,
].map((document) => {
  const graphSearch = englishGraphSearchSignals.get(document.href);
  return graphSearch?.length ? { ...document, graphSearch: [...graphSearch] } : document;
});

const availableEnglishGraphSearchAnchorIds = new Set(
  englishSearchDocuments.flatMap((document) =>
    document.graphSearch?.map((signal) => signal.anchorEntityId) ?? [],
  ),
);

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function tokenizeSearchQuery(value: string): string[] {
  return normalizeSearchValue(value).split(/[^a-z0-9_-]+/).filter(Boolean);
}

function intentDocumentType(kind: ScreepsEntityKind): EnglishSearchDocument["type"] {
  if (kind === "guide") return "Article";
  if (kind === "tool") return "Tool";
  return "Reference";
}

export function getEnglishInitialSearchDocuments(query: string, limit = 80): EnglishSearchDocument[] {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return [];

  const promotions = getScreepsIntentPromotions(query, "en", 8);
  const graphAnchorEntityId = getKnowledgeGraphSearchAnchorEntityId(
    promotions,
    availableEnglishGraphSearchAnchorIds,
  );
  const promotionScoreByHref = new Map(promotions.map((promotion) => [promotion.href, promotion.score]));
  const intentOrderByHref = new Map(
    promotions.map((promotion, index) => [promotion.href, index] as const),
  );
  const mergedByHref = new Map(englishSearchDocuments.map((document) => [document.href, document]));

  for (const promotion of promotions) {
    if (mergedByHref.has(promotion.href)) continue;
    mergedByHref.set(promotion.href, {
      id: `intent:${promotion.entityId}`,
      title: promotion.title,
      description: promotion.description,
      href: promotion.href,
      type: intentDocumentType(promotion.kind),
      keywords: [...promotion.aliases],
    });
  }

  return [...mergedByHref.values()]
    .map((document) => {
      const title = normalizeSearchValue(document.title);
      const description = normalizeSearchValue(document.description);
      const keywords = normalizeSearchValue(document.keywords.join(" "));
      let score = promotionScoreByHref.get(document.href) ?? 0;

      for (const token of tokens) {
        if (title === token) score += 25;
        else if (title.includes(token)) score += 10;
        if (keywords.includes(token)) score += 6;
        if (description.includes(token)) score += 3;
      }

      const graphScore = getKnowledgeGraphSearchSignalScore(
        document.graphSearch,
        graphAnchorEntityId,
      );

      return { document, score, graphScore };
    })
    .filter((item) => item.score > 0 || item.graphScore > 0)
    .sort((left, right) => {
      if (graphAnchorEntityId) {
        const leftIntentOrder = intentOrderByHref.get(left.document.href);
        const rightIntentOrder = intentOrderByHref.get(right.document.href);
        if (leftIntentOrder !== undefined || rightIntentOrder !== undefined) {
          if (leftIntentOrder === undefined) return 1;
          if (rightIntentOrder === undefined) return -1;
          if (leftIntentOrder !== rightIntentOrder) return leftIntentOrder - rightIntentOrder;
        }

        if (left.graphScore !== right.graphScore) return right.graphScore - left.graphScore;
      }

      return right.score - left.score;
    })
    .slice(0, limit)
    .map((item) => item.document);
}
