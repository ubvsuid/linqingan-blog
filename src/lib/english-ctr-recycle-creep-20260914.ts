import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import {
  applyEnglishFirstRoomCtr20260914,
  getEnglishFirstRoomCtrUpdatedAt20260914,
} from "@/lib/english-ctr-first-room-20260914";

const TARGET_SLUG = "screeps-recycle-creep";
const UPDATED_AT = "2026-09-14";

function applyRecycleCreepCtr20260914(
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

export function applyEnglishRecycleCreepCtr20260914(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  return applyEnglishFirstRoomCtr20260914(
    applyRecycleCreepCtr20260914(article),
  );
}

export function getEnglishRecycleCreepCtrUpdatedAt20260914(
  slug: string,
): string | undefined {
  return getEnglishFirstRoomCtrUpdatedAt20260914(slug)
    ?? (slug === TARGET_SLUG ? UPDATED_AT : undefined);
}
