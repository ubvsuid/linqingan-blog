import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-spawncreep-return-codes";
const UPDATED_AT = "2026-09-13";

export function applyEnglishSpawnCreepReturnCodesCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps spawnCreep() Return Codes & Error Fixes",
    description:
      "Debug Screeps spawnCreep() failures with the documented return codes, dryRun boundaries, Energy checks, name conflicts, invalid arguments, and RCL limits.",
  };
}

export function getEnglishSpawnCreepReturnCodesCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
