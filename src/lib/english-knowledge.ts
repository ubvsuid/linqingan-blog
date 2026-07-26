import {
  publishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles-complete";
import { englishKnowledgeModules } from "./i18n";

const categoryRules: Array<{ moduleNumber: number; terms: string[] }> = [
  {
    moduleNumber: 7,
    terms: [
      "market",
      "terminal",
      "lab",
      "boost",
      "factory",
      "power",
      "mineral",
      "commodity",
      "advanced resource",
    ],
  },
  {
    moduleNumber: 6,
    terms: [
      "construction",
      "build",
      "repair",
      "tower",
      "wall",
      "rampart",
      "defense",
      "defence",
      "combat",
      "attack",
      "heal",
    ],
  },
  {
    moduleNumber: 5,
    terms: [
      "controller",
      "upgrade",
      "reserve",
      "claim",
      "expansion",
      "downgrade",
      "safe mode",
    ],
  },
  {
    moduleNumber: 4,
    terms: [
      "movement",
      "move",
      "pathfinder",
      "pathfinding",
      "roomposition",
      "route",
      "observer",
      "vision",
      "visibility",
      "fatigue",
      "exit",
    ],
  },
  {
    moduleNumber: 1,
    terms: [
      "memory",
      "rawmemory",
      "code structure",
      "module",
      "global cache",
      "game loop",
      "tick",
      "configuration",
      "config",
      "constant",
      "flag",
      "state",
      "getobjectbyid",
    ],
  },
  {
    moduleNumber: 2,
    terms: [
      "spawn",
      "creep body",
      "body part",
      "lifecycle",
      "renew",
      "recycle",
      "ticks to live",
      "creep role",
    ],
  },
  {
    moduleNumber: 3,
    terms: [
      "room economy",
      "harvest",
      "energy",
      "source",
      "container",
      "storage",
      "link",
      "hauling",
      "delivery",
      "resource flow",
    ],
  },
];

function articleSearchText(article: EnglishArticleRecord): string {
  return [
    article.category,
    article.title,
    article.description,
    article.primaryKeyword,
    article.searchIntent,
    ...article.keywords,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesTerm(text: string, term: string): boolean {
  const escaped = term
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const expression = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);

  return expression.test(text);
}

export function getEnglishKnowledgeModuleNumber(
  article: EnglishArticleRecord,
): number {
  const text = articleSearchText(article);

  for (const rule of categoryRules) {
    if (rule.terms.some((term) => matchesTerm(text, term))) {
      return rule.moduleNumber;
    }
  }

  return 8;
}

export const englishKnowledgeSections = englishKnowledgeModules.map((module) => ({
  ...module,
  articles: publishedEnglishArticles.filter(
    (article) => getEnglishKnowledgeModuleNumber(article) === module.number,
  ),
}));

export const englishKnowledgeArticleCount = publishedEnglishArticles.length;
