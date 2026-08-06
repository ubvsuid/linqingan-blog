import {
  publishedEnglishArticles,
  type EnglishArticleRecord,
} from "./english-articles-complete";
import { englishKnowledgeModules } from "./i18n";

const articleModuleOverrides: Record<string, number> = {
  "/en/blog/screeps-tick-game-loop": 1,
  "/en/blog/screeps-memory-basics": 1,
  "/en/blog/screeps-working-state": 1,
  "/en/blog/screeps-get-object-by-id": 1,
  "/en/blog/screeps-clean-dead-creep-memory": 1,
  "/en/blog/screeps-global-cache": 1,
  "/en/blog/screeps-rawmemory-segments": 1,
  "/en/blog/screeps-flags-configuration": 1,
  "/en/blog/screeps-require-modules": 1,
  "/en/blog/screeps-introduction": 1,

  "/en/blog/screeps-creep-body-parts": 2,
  "/en/blog/screeps-spawn-creep": 2,
  "/en/blog/screeps-creep-roles": 2,
  "/en/blog/screeps-spawncreep-return-codes": 2,
  "/en/blog/screeps-dynamic-creep-body": 2,
  "/en/blog/screeps-room-energyavailable-stuck": 2,
  "/en/blog/screeps-creep-prespawn-replacement": 2,
  "/en/blog/screeps-emergency-harvester-recovery": 2,
  "/en/blog/screeps-renew-creep": 2,
  "/en/blog/screeps-recycle-creep": 2,

  "/en/blog/screeps-creep-harvest-energy": 3,
  "/en/blog/screeps-transfer-energy-to-spawn": 3,
  "/en/blog/screeps-withdraw-container-energy": 3,
  "/en/blog/screeps-pickup-dropped-energy": 3,
  "/en/blog/screeps-tombstone-ruin-recovery": 3,
  "/en/blog/screeps-storage-energy-usage": 3,
  "/en/blog/screeps-link-transfer-energy": 3,
  "/en/blog/screeps-select-source-by-path": 3,

  "/en/blog/screeps-err-not-in-range": 4,
  "/en/blog/screeps-moveto-not-moving": 4,
  "/en/blog/screeps-err-no-path": 4,
  "/en/blog/screeps-move-fatigue-body-ratio": 4,
  "/en/blog/screeps-roomposition-distance": 4,
  "/en/blog/screeps-map-find-route": 4,
  "/en/blog/screeps-room-visibility": 4,
  "/en/blog/screeps-observer-observe-room": 4,
  "/en/blog/screeps-pathfinder-costmatrix": 4,
  "/en/blog/screeps-first-room": 4,

  "/en/blog/screeps-upgrade-controller": 5,
  "/en/blog/screeps-upgrader-controller-link-not-upgrading": 5,
  "/en/blog/screeps-controller-activate-safe-mode": 5,
  "/en/blog/screeps-controller-downgrade": 5,
  "/en/blog/screeps-reserve-vs-claim-controller": 5,

  "/en/blog/screeps-first-extension": 6,
  "/en/blog/screeps-build-repair": 6,
  "/en/blog/screeps-remove-construction-site": 6,
  "/en/blog/screeps-tower-auto-attack-hostiles": 6,
  "/en/blog/screeps-tower-heal-creeps": 6,
  "/en/blog/screeps-tower-repair-threshold": 6,
  "/en/blog/screeps-room-create-construction-site": 6,
  "/en/blog/screeps-construction-site-progress": 6,
  "/en/blog/screeps-structure-destroy": 6,
  "/en/blog/screeps-nuker-launch": 6,
  "/en/blog/screeps-rampart-set-public": 6,
  "/en/blog/screeps-wall-rampart-repair-limit": 6,

  "/en/blog/screeps-market-create-order": 7,
  "/en/blog/screeps-market-order-maintenance": 7,
  "/en/blog/screeps-market-deal": 7,
  "/en/blog/screeps-terminal-send-resources": 7,
  "/en/blog/screeps-lab-run-reaction": 7,
  "/en/blog/screeps-lab-boost-creep": 7,
  "/en/blog/screeps-factory-produce": 7,
  "/en/blog/screeps-mineral-extractor-harvest": 7,
  "/en/blog/screeps-power-spawn-process-power": 7,

  "/en/blog/screeps-first-room-code": 8,
  "/en/blog/screeps-cpu-getused-bucket": 8,
  "/en/blog/screeps-cpu-bucket-degradation": 8,
  "/en/blog/screeps-game-notify": 8,
  "/en/blog/screeps-room-event-log": 8,
  "/en/blog/screeps-roomvisual-debug": 8,
  "/en/blog/screeps-room-error-isolation": 8,
};

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
  const override = articleModuleOverrides[article.href];
  if (override) return override;

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
