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
]);
const articleTagSlugOverrides: Record<string, string[]> = {
  "/en/blog/screeps-introduction": ["creeps", "energy", "javascript"],
  "/en/blog/screeps-first-room": ["rooms", "console", "javascript"],
  "/en/blog/screeps-tick-game-loop": ["javascript", "console"],
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
  const overrideSlugs = articleTagSlugOverrides[article.href];
  if (overrideSlugs) {
    return overrideSlugs
      .map((slug) => tagRules.find((rule) => rule.slug === slug))
      .filter((rule): rule is TagRule => Boolean(rule));
  }

  const text = articleText(article);
  const matches = tagRules.filter((rule) => rule.terms.some((term) => matchesTerm(text, term)));
  if (matches.length > 0) return matches.slice(0, 5);
  return [tagRules.find((rule) => rule.slug === "debugging")!];
}

export const englishDiscoveryArticles: EnglishDiscoveryArticle[] = publishedEnglishArticles.map((article) => {
  const moduleNumber = getEnglishKnowledgeModuleNumber(article);
  const knowledgeModuleTitle = englishKnowledgeModules.find((module) => module.number === moduleNumber)?.title ?? "Operations and Debugging";
  const isGettingStartedArticle = gettingStartedArticleHrefs.has(article.href);
  const moduleTitle = isGettingStartedArticle ? "Getting Started" : knowledgeModuleTitle;
  const moduleHref = isGettingStartedArticle
    ? "/en/beginner"
    : `/en/blog?module=${encodeURIComponent(moduleTitle)}`;
  const tags = getTags(article);
  const updatedAt = (article as EnglishArticleRecord & { updatedAt?: string }).updatedAt ?? article.publishedAt;

  return {
    ...article,
    moduleNumber,
    moduleTitle,
    moduleHref,
    difficulty: getDifficulty(article),
    contentType: getContentType(article),
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
