import { englishDiscoveryArticles, englishTags } from "@/lib/english-discovery";

export interface EnglishSearchDocument {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "Page" | "Reference" | "Tool" | "Article";
  keywords: string[];
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

const foundationDocuments: EnglishSearchDocument[] = [
  { id: "english-home", title: "Screeps Tutorials, Debugging Guides and Tools", description: "The English home for practical Screeps learning, debugging, references, and tools.", href: "/en", type: "Page", keywords: ["screeps", "tutorial", "debugging", "javascript", "automation"] },
  { id: "english-beginner", title: "Screeps Beginner Roadmap", description: "A learning sequence from ticks and the first Creep to roles, upgrading, construction, and a room loop.", href: "/en/beginner", type: "Page", keywords: ["beginner", "first creep", "spawn", "harvest", "upgrade controller"] },
  { id: "english-knowledge", title: "Screeps Knowledge Base", description: "A structured map for Memory, spawning, economy, movement, Controllers, defense, market systems, and debugging.", href: "/en/knowledge", type: "Page", keywords: ["memory", "spawn", "economy", "pathfinding", "controller", "market", "cpu"] },
  { id: "english-topics", title: "English Screeps Topics", description: "Topic archives for Memory, spawning, Creeps, Energy, movement, pathfinding, Controllers, construction, defense, market systems, resources, CPU, debugging, and JavaScript.", href: "/en/tags", type: "Page", keywords: ["topics", "tags", "memory", "movement", "defense", "market", "debugging"] },
  { id: "english-errors", title: "Screeps Error Codes and Return Values", description: "Common constants such as ERR_NOT_IN_RANGE, ERR_NO_PATH, ERR_BUSY, ERR_FULL, and ERR_NOT_ENOUGH_ENERGY.", href: "/en/screeps-errors", type: "Reference", keywords: ["return code", "err_not_in_range", "err_no_path", "err_busy", "err_full", "error"] },
  { id: "english-glossary", title: "Screeps Glossary", description: "Definitions for Creep, Spawn, tick, Memory, Controller, RCL, GCL, CPU, bucket, store, and fatigue.", href: "/en/glossary", type: "Reference", keywords: ["glossary", "creep", "spawn", "tick", "rcl", "gcl", "bucket", "fatigue"] },
  { id: "english-verification", title: "How Screeps Guides Are Verified", description: "Documentation checks, syntax checks, offline simulation, Console testing, and live multi-tick verification.", href: "/en/verification", type: "Reference", keywords: ["verification", "tested", "console", "simulation", "live room"] },
  { id: "english-tools", title: "Free Screeps Tools and Calculators", description: "Browser-based body, room, Market, Controller, Lab, Spawn, hauling, and Tower tools that do not request a Screeps token or connect to an account.", href: "/en/tools", type: "Page", keywords: ["tools", "calculator", "diagnostics", "market", "controller", "lab", "spawn", "hauling", "tower", "free"] },
  { id: "english-body-calculator", title: "Screeps Creep Body Calculator", description: "Calculate Energy cost, spawn time, hits, carry capacity, and loaded movement speed.", href: "/en/tools/creep-body-calculator", type: "Tool", keywords: ["body calculator", "creep cost", "move ratio", "spawn time", "carry capacity"] },
  { id: "english-room-diagnostics", title: "Screeps Room Snapshot Diagnostic", description: "Check Spawn, workforce, Energy, Controller, construction, CPU, and bucket risks from a static snapshot.", href: "/en/tools/room-diagnostics", type: "Tool", keywords: ["room diagnostics", "spawn count", "harvester", "controller downgrade", "cpu bucket"] },
  { id: "english-market-terminal-calculator", title: "Screeps Market and Terminal Cost Calculator", description: "Calculate Terminal transaction Energy, effective Market deal prices, maximum Energy payload, and order creation fees.", href: "/en/tools/market-terminal-cost-calculator", type: "Tool", keywords: ["market calculator", "terminal cost", "calcTransactionCost", "deal price", "order fee", "credits"] },
  { id: "english-controller-planner", title: "Screeps Controller Downgrade and Upgrader Planner", description: "Estimate Controller downgrade margin, Upgrader Energy use, Boosted progress, RCL8 caps, and time to a target.", href: "/en/tools/controller-downgrade-planner", type: "Tool", keywords: ["controller downgrade", "ticksToDowngrade", "upgrader", "work parts", "xgh2o", "operate controller"] },
  { id: "english-lab-boost-planner", title: "Screeps Lab Reaction and Boost Planner", description: "Plan compound reaction chains, base minerals, Lab runs, production ticks, and Boost batches.", href: "/en/tools/lab-reaction-boost-planner", type: "Tool", keywords: ["lab planner", "reaction chain", "boost calculator", "xgh2o", "operate lab", "mineral"] },
  { id: "english-spawn-queue-planner", title: "Screeps Spawn Queue and Replacement Planner", description: "Estimate Spawn utilization, role replacement timing, prespawn TTL thresholds, and OPERATE_SPAWN capacity.", href: "/en/tools/spawn-queue-replacement-planner", type: "Tool", keywords: ["spawn queue", "replacement", "prespawn", "ticksToLive", "operate spawn", "spawn utilization"] },
  { id: "english-hauling-throughput-planner", title: "Screeps Hauling Throughput Planner", description: "Calculate CARRY payload, MOVE fatigue, route cycle time, Creeps required, lifetime delivery, and replacement timing.", href: "/en/tools/hauling-throughput-planner", type: "Tool", keywords: ["hauling", "throughput", "carry", "move", "fatigue", "logistics", "remote mining"] },
  { id: "english-tower-power-calculator", title: "Screeps Tower Damage, Heal, and Repair Calculator", description: "Calculate Tower range falloff, combined attack, heal or repair power, Energy use, and OPERATE_TOWER output.", href: "/en/tools/tower-damage-heal-repair-calculator", type: "Tool", keywords: ["tower damage", "tower heal", "tower repair", "range falloff", "operate tower", "defense"] },
  { id: "english-about", title: "About Linqingan and the Screeps Knowledge Project", description: "Project purpose, verification approach, evidence boundaries, public development history, repository, and contact information.", href: "/en/about", type: "Page", keywords: ["linqingan", "about", "github", "project", "evidence", "public history"] },
  { id: "english-changelog", title: "English Site Changelog", description: "Meaningful changes to the English interface, navigation, search, tools, accessibility, and technical SEO.", href: "/en/changelog", type: "Page", keywords: ["changelog", "updates", "release notes", "site changes"] },
  { id: "english-roadmap", title: "English Site Roadmap", description: "Completed work, next improvements, evidence-dependent tasks, tool development, accessibility, and performance checks.", href: "/en/roadmap", type: "Page", keywords: ["roadmap", "next", "planned", "evidence", "performance"] },
  { id: "english-license", title: "Content and Code Use", description: "Current boundaries for reusing site content, code examples, third-party names, and commercial material.", href: "/en/license", type: "Reference", keywords: ["license", "copyright", "reuse", "permission", "code examples"] },
];

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

export const englishSearchDocuments: EnglishSearchDocument[] = [
  ...articleDocuments,
  ...topicDocuments,
  ...foundationDocuments,
];

function normalizeSearchValue(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en");
}

function tokenizeSearchQuery(value: string): string[] {
  return normalizeSearchValue(value).split(/[^a-z0-9_]+/).filter(Boolean);
}

export function getEnglishInitialSearchDocuments(query: string, limit = 80): EnglishSearchDocument[] {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return [];

  return englishSearchDocuments
    .map((document) => {
      const title = normalizeSearchValue(document.title);
      const description = normalizeSearchValue(document.description);
      const keywords = normalizeSearchValue(document.keywords.join(" "));
      let score = 0;

      for (const token of tokens) {
        if (title === token) score += 25;
        else if (title.includes(token)) score += 10;
        if (keywords.includes(token)) score += 6;
        if (description.includes(token)) score += 3;
      }

      return { document, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.document);
}
