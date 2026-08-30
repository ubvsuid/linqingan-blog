import {
  publishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles-complete";
import { getEnglishKnowledgeModuleNumber } from "./english-knowledge";
import { englishKnowledgeModules } from "./i18n";

export type EnglishDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type EnglishContentType = "Lesson" | "Guide" | "Debugging" | "Safety" | "Reference";

export interface EnglishDiscoveryArticle extends EnglishArticleRecord {
  moduleNumber: number;
  moduleTitle: string;
  moduleHref: string;
  difficulty: EnglishDifficulty;
  contentType: EnglishContentType;
  tags: string[];
  tagSlugs: string[];
  updatedAt: string;
  suppressToolRecommendation: boolean;
}

interface TagRule {
  label: string;
  slug: string;
  terms: string[];
}

const tagRules: TagRule[] = [
  { label: "Memory", slug: "memory", terms: ["memory", "rawmemory"] },
  { label: "Spawn", slug: "spawn", terms: ["spawn", "spawncreep"] },
  { label: "Creeps", slug: "creeps", terms: ["creep", "body part", "ticks to live", "renew", "recycle"] },
  { label: "Energy", slug: "energy", terms: ["energy", "harvest", "source", "delivery", "transfer"] },
  { label: "Rooms", slug: "rooms", terms: ["game.rooms", "room visibility", "room view", "visible room"] },
  { label: "Console", slug: "console", terms: ["console", "console.log"] },
  { label: "Movement", slug: "movement", terms: ["movement", "moveto", "move", "fatigue", "roomposition"] },
  { label: "Pathfinding", slug: "pathfinding", terms: ["pathfinder", "pathfinding", "findroute", "route"] },
  { label: "Controllers", slug: "controllers", terms: ["controller", "upgrade", "reserve", "claim", "downgrade"] },
  { label: "Construction", slug: "construction", terms: ["construction", "build", "repair", "extension", "wall", "rampart"] },
  { label: "Defense", slug: "defense", terms: ["defense", "defence", "tower", "attack", "heal", "safe mode"] },
  { label: "Market", slug: "market", terms: ["market", "order", "deal", "terminal"] },
  { label: "Resources", slug: "resources", terms: ["mineral", "lab", "boost", "factory", "commodity", "power", "resource"] },
  { label: "CPU", slug: "cpu", terms: ["cpu", "bucket", "limit"] },
  { label: "Debugging", slug: "debugging", terms: ["debug", "diagnostic", "return code", "error", "event log", "notification"] },
  { label: "JavaScript", slug: "javascript", terms: ["javascript", "module", "constant", "configuration", "global cache"] },
];

const gettingStartedArticleHrefs = new Set([
  "/en/blog/screeps-introduction",
  "/en/blog/screeps-first-room",
  "/en/blog/screeps-tick-game-loop",
  "/en/blog/screeps-creep-harvest-energy",
  "/en/blog/screeps-transfer-energy-to-spawn",
  "/en/blog/screeps-creep-body-parts",
  "/en/blog/screeps-spawn-creep",
  "/en/blog/screeps-creep-roles",
  "/en/blog/screeps-upgrade-controller",
]);

const articleTagSlugOverrides: Record<string, string[]> = {
  "/en/blog/screeps-tick-game-loop": ["javascript", "console"],
  "/en/blog/screeps-memory-basics": ["memory", "javascript"],
  "/en/blog/screeps-working-state": ["memory", "creeps", "energy", "javascript"],
  "/en/blog/screeps-get-object-by-id": ["javascript", "memory", "rooms"],
  "/en/blog/screeps-clean-dead-creep-memory": ["memory", "creeps", "javascript"],
  "/en/blog/screeps-global-cache": ["javascript", "cpu", "debugging"],
  "/en/blog/screeps-rawmemory-segments": ["memory", "javascript", "cpu"],
  "/en/blog/screeps-flags-configuration": ["javascript", "rooms"],
  "/en/blog/screeps-require-modules": ["javascript", "debugging"],
  "/en/blog/screeps-introduction": ["creeps", "energy", "javascript"],

  "/en/blog/screeps-creep-body-parts": ["creeps", "movement", "debugging"],
  "/en/blog/screeps-spawn-creep": ["spawn", "creeps", "javascript"],
  "/en/blog/screeps-creep-roles": ["creeps", "javascript"],
  "/en/blog/screeps-spawncreep-return-codes": ["spawn", "debugging"],
  "/en/blog/screeps-dynamic-creep-body": ["spawn", "creeps", "energy"],
  "/en/blog/screeps-room-energyavailable-stuck": ["spawn", "energy", "debugging"],
  "/en/blog/screeps-creep-prespawn-replacement": ["spawn", "creeps", "debugging"],
  "/en/blog/screeps-emergency-harvester-recovery": ["spawn", "creeps", "energy"],
  "/en/blog/screeps-renew-creep": ["spawn", "creeps"],
  "/en/blog/screeps-recycle-creep": ["spawn", "creeps"],

  "/en/blog/screeps-creep-harvest-energy": ["creeps", "energy", "movement"],
  "/en/blog/screeps-transfer-energy-to-spawn": ["creeps", "energy", "spawn"],
  "/en/blog/screeps-withdraw-container-energy": ["creeps", "energy", "resources"],
  "/en/blog/screeps-pickup-dropped-energy": ["creeps", "energy", "resources"],
  "/en/blog/screeps-storage-energy-usage": ["energy", "resources"],
  "/en/blog/screeps-link-transfer-energy": ["energy", "resources"],
  "/en/blog/screeps-select-source-by-path": ["energy", "pathfinding", "movement"],
  "/en/blog/screeps-tombstone-ruin-recovery": ["creeps", "resources", "energy"],
  "/en/blog/screeps-container-decay-repair-deadline": ["resources", "construction", "debugging"],

  "/en/blog/screeps-err-not-in-range": ["movement", "debugging"],
  "/en/blog/screeps-moveto-not-moving": ["movement", "debugging", "pathfinding"],
  "/en/blog/screeps-err-no-path": ["movement", "pathfinding", "debugging"],
  "/en/blog/screeps-move-fatigue-body-ratio": ["movement", "creeps"],
  "/en/blog/screeps-creep-pull": ["movement", "creeps", "debugging"],
  "/en/blog/screeps-roomposition-distance": ["movement", "pathfinding"],
  "/en/blog/screeps-map-find-route": ["movement", "pathfinding", "rooms"],
  "/en/blog/screeps-room-visibility": ["rooms", "debugging"],
  "/en/blog/screeps-observer-observe-room": ["rooms", "debugging"],
  "/en/blog/screeps-pathfinder-costmatrix": ["pathfinding", "movement"],
  "/en/blog/screeps-first-room": ["rooms", "console", "javascript"],

  "/en/blog/screeps-upgrade-controller": ["controllers", "creeps", "energy"],
  "/en/blog/screeps-upgrader-controller-link-not-upgrading": ["controllers", "energy", "debugging"],
  "/en/blog/screeps-controller-activate-safe-mode": ["controllers", "defense"],
  "/en/blog/screeps-controller-downgrade": ["controllers", "debugging"],
  "/en/blog/screeps-reserve-vs-claim-controller": ["controllers", "rooms"],

  "/en/blog/screeps-first-extension": ["construction", "energy"],
  "/en/blog/screeps-build-repair": ["construction", "creeps", "energy"],
  "/en/blog/screeps-remove-construction-site": ["construction", "rooms"],
  "/en/blog/screeps-tower-auto-attack-hostiles": ["defense", "debugging"],
  "/en/blog/screeps-tower-heal-creeps": ["defense", "creeps"],
  "/en/blog/screeps-tower-repair-threshold": ["defense", "construction"],
  "/en/blog/screeps-room-create-construction-site": ["construction", "rooms"],
  "/en/blog/screeps-construction-site-progress": ["construction", "debugging"],
  "/en/blog/screeps-structure-destroy": ["construction", "defense"],
  "/en/blog/screeps-nuker-launch": ["defense", "resources"],
  "/en/blog/screeps-rampart-set-public": ["defense", "construction"],
  "/en/blog/screeps-wall-rampart-repair-limit": ["defense", "construction"],

  "/en/blog/screeps-market-create-order": ["market", "resources"],
  "/en/blog/screeps-market-order-maintenance": ["market", "resources"],
  "/en/blog/screeps-market-deal": ["market", "resources"],
  "/en/blog/screeps-terminal-send-resources": ["market", "resources"],
  "/en/blog/screeps-lab-run-reaction": ["resources", "market"],
  "/en/blog/screeps-lab-boost-creep": ["resources", "creeps"],
  "/en/blog/screeps-factory-produce": ["resources", "market"],
  "/en/blog/screeps-mineral-extractor-harvest": ["resources", "energy"],
  "/en/blog/screeps-power-spawn-process-power": ["resources", "energy"],

  "/en/blog/screeps-first-room-code": ["javascript", "debugging", "rooms"],
  "/en/blog/screeps-cpu-getused-bucket": ["cpu", "debugging"],
  "/en/blog/screeps-cpu-bucket-degradation": ["cpu", "debugging", "javascript"],
  "/en/blog/screeps-game-notify": ["debugging", "javascript"],
  "/en/blog/screeps-room-event-log": ["debugging", "rooms"],
  "/en/blog/screeps-roomvisual-debug": ["debugging", "rooms", "javascript"],
};

const moduleDefaultTagSlugs: Record<number, string[]> = {
  1: ["javascript", "memory"],
  2: ["spawn", "creeps"],
  3: ["energy", "resources"],
  4: ["movement", "pathfinding"],
  5: ["controllers", "rooms"],
  6: ["construction", "defense"],
  7: ["market", "resources"],
  8: ["debugging", "javascript"],
};

const curatedRelatedArticleHrefs: Record<string, string[]> = {
  "/en/blog/screeps-introduction": [
    "/en/blog/screeps-first-room",
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-creep-harvest-energy",
    "/en/blog/screeps-creep-body-parts",
  ],
  "/en/blog/screeps-first-room": [
    "/en/blog/screeps-introduction",
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-room-visibility",
    "/en/blog/screeps-creep-harvest-energy",
  ],
  "/en/blog/screeps-tick-game-loop": [
    "/en/blog/screeps-first-room",
    "/en/blog/screeps-creep-harvest-energy",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-first-room-code",
  ],
  "/en/blog/screeps-creep-harvest-energy": [
    "/en/blog/screeps-tick-game-loop",
    "/en/blog/screeps-transfer-energy-to-spawn",
    "/en/blog/screeps-creep-body-parts",
    "/en/blog/screeps-err-not-in-range",
  ],
  "/en/blog/screeps-transfer-energy-to-spawn": [
    "/en/blog/screeps-creep-harvest-energy",
    "/en/blog/screeps-creep-body-parts",
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-memory-basics",
  ],
  "/en/blog/screeps-creep-body-parts": [
    "/en/blog/screeps-transfer-energy-to-spawn",
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-creep-harvest-energy",
    "/en/blog/screeps-moveto-not-moving",
  ],
  "/en/blog/screeps-spawn-creep": [
    "/en/blog/screeps-creep-body-parts",
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-spawncreep-return-codes",
    "/en/blog/screeps-dynamic-creep-body",
  ],
  "/en/blog/screeps-creep-roles": [
    "/en/blog/screeps-spawn-creep",
    "/en/blog/screeps-upgrade-controller",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-require-modules",
  ],
  "/en/blog/screeps-upgrade-controller": [
    "/en/blog/screeps-creep-roles",
    "/en/blog/screeps-first-extension",
    "/en/blog/screeps-memory-basics",
    "/en/blog/screeps-err-not-in-range",
  ],
};

const editorialMetadataOverrides: Record<string, Partial<EnglishArticleRecord>> = {
  "/en/blog/screeps-first-room": {
    description:
      "Open a Screeps Room, switch to the code editor and player Console, then use read-only checks to match exact Room, Spawn, Creep, Source, and Controller data.",
    readingTime: "7 min read",
    searchIntent:
      "Beginner interface orientation that opens the Room view, code editor, and player Console before using read-only current-tick checks for real account object names and visibility",
    updatedAt: "2026-08-28",
  },
  "/en/blog/screeps-spawn-exit-blocked-directions": {
    description:
      "Confirm a blocked Screeps Spawn exit from current spawning state and all eight adjacent tiles, then fix direction policy without confusing accepted intents with observed birth.",
    readingTime: "14 min read",
    updatedAt: "2026-08-28",
  },
  "/en/blog/screeps-creep-harvest-energy": {
    category: "GETTING STARTED · HARVESTING",
    title: "Screeps Harvest Energy: Build Your First Creep.harvest() Loop",
    description:
      "Use Creep.harvest() to find an active Source, move into range, keep harvesting until your Creep is ready to deliver, and read Source-specific return codes without treating ERR_FULL as a harvest result.",
    readingTime: "10 min read",
    primaryKeyword: "Screeps harvest energy",
    searchIntent:
      "Learn the simplest reliable Source-harvesting loop for a first Creep, then understand the return-code and Store-capacity boundaries needed before delivery",
    finalScore: 98,
    updatedAt: "2026-08-29",
    keywords: [
      "Screeps harvest energy",
      "Creep.harvest",
      "Screeps active Source",
      "Creep.harvest return codes",
      "Screeps ERR_NOT_IN_RANGE",
    ],
  },
  "/en/blog/screeps-cpu-bucket-degradation": {
    description:
      "Build a four-mode Screeps CPU degradation scheduler with hysteresis, consecutive-tick confirmation, critical-first task tiers, stable staggering, CPU headroom guards, and gradual recovery.",
    readingTime: "22 min read",
    updatedAt: "2026-08-29",
  },
};

const editorialDifficultyOverrides: Partial<Record<string, EnglishDifficulty>> = {
  "/en/blog/screeps-cpu-bucket-degradation": "Advanced",
};

const editorialContentTypeOverrides: Partial<Record<string, EnglishContentType>> = {
  "/en/blog/screeps-spawn-exit-blocked-directions": "Debugging",
};

function articleText(article: EnglishArticleRecord): string {
  return [
    article.category,
    article.title,
    article.description,
    article.primaryKeyword,
    article.searchIntent,
    ...article.keywords,
  ].join(" ").toLowerCase();
}

function matchesTerm(text: string, term: string): boolean {
  const escaped = term
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
}

function getDifficulty(article: EnglishArticleRecord): EnglishDifficulty {
  const text = articleText(article);
  if (article.category.includes("BEGINNER")) return "Beginner";
  if (["market", "terminal", "lab", "boost", "factory", "power", "observer", "safe mode"].some((term) => matchesTerm(text, term))) {
    return "Advanced";
  }
  return "Intermediate";
}

function getContentType(article: EnglishArticleRecord): EnglishContentType {
  const category = article.category.toUpperCase();
  const text = articleText(article);
  if (category.includes("BEGINNER")) return "Lesson";
  if (category.includes("API SAFETY") || category.includes("SAFETY")) return "Safety";
  if (category.includes("DEBUG") || ["diagnostic", "error", "return code"].some((term) => matchesTerm(text, term))) return "Debugging";
  if (category.includes("REFERENCE")) return "Reference";
  return "Guide";
}

function getTags(article: EnglishArticleRecord): TagRule[] {
  const moduleNumber = getEnglishKnowledgeModuleNumber(article);
  const slugs = articleTagSlugOverrides[article.href]
    ?? moduleDefaultTagSlugs[moduleNumber]
    ?? ["debugging"];

  return slugs
    .map((slug) => tagRules.find((rule) => rule.slug === slug))
    .filter((rule): rule is TagRule => Boolean(rule));
}

export const englishDiscoveryArticles: EnglishDiscoveryArticle[] = publishedEnglishArticles.map((article) => {
  const editorialArticle: EnglishArticleRecord = {
    ...article,
    ...(editorialMetadataOverrides[article.href] ?? {}),
  };
  const moduleNumber = getEnglishKnowledgeModuleNumber(editorialArticle);
  const knowledgeModuleTitle = englishKnowledgeModules.find((module) => module.number === moduleNumber)?.title ?? "Operations and Debugging";
  const isGettingStartedArticle = gettingStartedArticleHrefs.has(editorialArticle.href);
  const moduleTitle = isGettingStartedArticle ? "Getting Started" : knowledgeModuleTitle;
  const moduleHref = isGettingStartedArticle
    ? "/en/beginner"
    : `/en/blog?module=${encodeURIComponent(moduleTitle)}`;
  const tags = getTags(editorialArticle);
  const updatedAt = editorialArticle.updatedAt ?? editorialArticle.publishedAt;

  return {
    ...editorialArticle,
    moduleNumber,
    moduleTitle,
    moduleHref,
    difficulty: editorialDifficultyOverrides[editorialArticle.href] ?? getDifficulty(editorialArticle),
    contentType: editorialContentTypeOverrides[editorialArticle.href] ?? getContentType(editorialArticle),
    tags: tags.map((tag) => tag.label),
    tagSlugs: tags.map((tag) => tag.slug),
    updatedAt,
    suppressToolRecommendation: isGettingStartedArticle,
  };
});

export const englishTags = tagRules
  .map((rule) => ({
    ...rule,
    count: englishDiscoveryArticles.filter((article) => article.tagSlugs.includes(rule.slug)).length,
  }))
  .filter((tag) => tag.count > 0);

export function getEnglishTag(slug: string) {
  return englishTags.find((tag) => tag.slug === slug);
}

export function getEnglishArticlesByTag(slug: string): EnglishDiscoveryArticle[] {
  return englishDiscoveryArticles.filter((article) => article.tagSlugs.includes(slug));
}

export function getEnglishDiscoveryArticle(href: string): EnglishDiscoveryArticle | undefined {
  return englishDiscoveryArticles.find((article) => article.href === href);
}

export function getRelatedEnglishArticles(href: string, limit = 4): EnglishDiscoveryArticle[] {
  const current = getEnglishDiscoveryArticle(href);
  if (!current) return [];

  const curatedHrefs = curatedRelatedArticleHrefs[href];
  if (curatedHrefs) {
    return curatedHrefs
      .map((relatedHref) => getEnglishDiscoveryArticle(relatedHref))
      .filter((article): article is EnglishDiscoveryArticle => Boolean(article))
      .slice(0, limit);
  }

  return englishDiscoveryArticles
    .filter((article) => article.href !== href)
    .map((article) => {
      const sharedTags = article.tagSlugs.filter((tag) => current.tagSlugs.includes(tag)).length;
      const sameModule = article.moduleNumber === current.moduleNumber ? 4 : 0;
      const sameDifficulty = article.difficulty === current.difficulty ? 1 : 0;
      const sameType = article.contentType === current.contentType ? 1 : 0;
      return { article, score: sharedTags * 3 + sameModule + sameDifficulty + sameType };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.article.publishedAt.localeCompare(left.article.publishedAt))
    .slice(0, limit)
    .map((item) => item.article);
}
