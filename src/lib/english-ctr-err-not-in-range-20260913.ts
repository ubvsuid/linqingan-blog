import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-err-not-in-range";
const UPDATED_AT = "2026-09-13";

export function applyEnglishErrNotInRangeCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps ERR_NOT_IN_RANGE (-9): Action Range Fix",
    description:
      "Fix Screeps ERR_NOT_IN_RANGE (-9): check the action's required range, keep moveTo() results separate, and retry the original action on a later tick.",
  };
}

export function getEnglishErrNotInRangeCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
