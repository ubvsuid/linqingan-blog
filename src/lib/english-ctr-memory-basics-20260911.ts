import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";
import { getEnglishCreepRolesCurrentUpdatedAt20260917 } from "@/lib/english-ctr-creep-roles-20260917";
import { getEnglishCreateConstructionSiteCtrUpdatedAt20260912 } from "@/lib/english-ctr-create-construction-site-20260912";
import { getEnglishDeadCreepMemoryCtrUpdatedAt20260911 } from "@/lib/english-ctr-dead-creep-memory-20260911";
import { getEnglishErrNoPathCtrUpdatedAt20260913 } from "@/lib/english-ctr-err-no-path-20260913";
import { getEnglishErrNotInRangeCtrUpdatedAt20260913 } from "@/lib/english-ctr-err-not-in-range-20260913";
import { getEnglishFirstRoomCodeCtrUpdatedAt20260913 } from "@/lib/english-ctr-first-room-code-20260913";
import { getEnglishIntroductionCtrUpdatedAt20260913 } from "@/lib/english-ctr-introduction-20260913";
import { getEnglishPickupDroppedEnergyCtrUpdatedAt20260911 } from "@/lib/english-ctr-pickup-dropped-energy-20260911";
import { getEnglishRoomVisibilityCtrUpdatedAt20260911 } from "@/lib/english-ctr-room-visibility-20260911";
import { getEnglishSpawnCreepReturnCodesCtrUpdatedAt20260913 } from "@/lib/english-ctr-spawncreep-return-codes-20260913";
import { getEnglishTickGameLoopCtrUpdatedAt20260911 } from "@/lib/english-ctr-tick-game-loop-20260911";

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
  return getEnglishCreepRolesCurrentUpdatedAt20260917(slug)
    ?? getEnglishIntroductionCtrUpdatedAt20260913(slug)
    ?? getEnglishErrNoPathCtrUpdatedAt20260913(slug)
    ?? getEnglishFirstRoomCodeCtrUpdatedAt20260913(slug)
    ?? getEnglishErrNotInRangeCtrUpdatedAt20260913(slug)
    ?? getEnglishSpawnCreepReturnCodesCtrUpdatedAt20260913(slug)
    ?? getEnglishCreateConstructionSiteCtrUpdatedAt20260912(slug)
    ?? getEnglishDeadCreepMemoryCtrUpdatedAt20260911(slug)
    ?? getEnglishTickGameLoopCtrUpdatedAt20260911(slug)
    ?? getEnglishPickupDroppedEnergyCtrUpdatedAt20260911(slug)
    ?? getEnglishRoomVisibilityCtrUpdatedAt20260911(slug)
    ?? (slug === TARGET_SLUG ? UPDATED_AT : undefined);
}
