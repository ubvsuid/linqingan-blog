import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-recycle-creep";
const UPDATED_AT = "2026-09-14";

export function applyEnglishRecycleCreepCtr20260914(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps recycleCreep(): How to Recycle Creeps Safely",
    description:
      "Learn how StructureSpawn.recycleCreep() works: move an owned Creep adjacent, submit once, preserve the result, and verify the exact retirement next tick.",
  };
}

export function getEnglishRecycleCreepCtrUpdatedAt20260914(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
