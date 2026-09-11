import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-memory-basics";
const UPDATED_AT = "2026-09-11";

export function applyEnglishMemoryBasicsCtr20260911(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps Memory: Persistent State vs Heap Cache",
    description:
      "Learn how Screeps Memory persists state across ticks, when to use heap cache, how creep.memory maps to Memory.creeps, and how to recover saved object IDs.",
  };
}

export function getEnglishMemoryBasicsCtrUpdatedAt20260911(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
