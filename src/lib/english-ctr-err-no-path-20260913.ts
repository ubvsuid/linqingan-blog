import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-err-no-path";
const UPDATED_AT = "2026-09-13";

export function applyEnglishErrNoPathCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps ERR_NO_PATH (-2): Causes, Checks & Fixes",
    description:
      "Debug Screeps ERR_NO_PATH (-2) with reproducible checks for blocked goals, callback restrictions, dynamic occupancy, and cross-room route failures.",
  };
}

export function getEnglishErrNoPathCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
