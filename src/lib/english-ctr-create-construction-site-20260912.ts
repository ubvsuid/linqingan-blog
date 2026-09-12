import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-room-create-construction-site";
const UPDATED_AT = "2026-09-12";

export function applyEnglishCreateConstructionSiteCtr20260912(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps Room.createConstructionSite(): Return Codes, Limits & Placement Rules",
    description:
      "Use Room.createConstructionSite() safely in Screeps: understand return codes, controller/RCL limits, placement checks, ERR_FULL causes, and retry-safe planning.",
  };
}

export function getEnglishCreateConstructionSiteCtrUpdatedAt20260912(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
