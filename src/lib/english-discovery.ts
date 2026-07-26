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
  difficulty: EnglishDifficulty;
  contentType: EnglishContentType;
  tags: string[];
  tagSlugs: string[];
  updatedAt: string;
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
  const text = articleText(article);
  const matches = tagRules.filter((rule) => rule.terms.some((term) => matchesTerm(text, term)));
  if (matches.length > 0) return matches.slice(0, 5);
  return [tagRules.find((rule) => rule.slug === "debugging")!];
}

export const englishDiscoveryArticles: EnglishDiscoveryArticle[] = publishedEnglishArticles.map((article) => {
  const moduleNumber = getEnglishKnowledgeModuleNumber(article);
  const moduleTitle = englishKnowledgeModules.find((module) => module.number === moduleNumber)?.title ?? "Operations and Debugging";
  const tags = getTags(article);
  const updatedAt = (article as EnglishArticleRecord & { updatedAt?: string }).updatedAt ?? article.publishedAt;

  return {
    ...article,
    moduleNumber,
    moduleTitle,
    difficulty: getDifficulty(article),
    contentType: getContentType(article),
    tags: tags.map((tag) => tag.label),
    tagSlugs: tags.map((tag) => tag.slug),
    updatedAt,
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
