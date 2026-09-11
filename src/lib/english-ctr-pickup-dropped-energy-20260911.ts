import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-pickup-dropped-energy";
const UPDATED_AT = "2026-09-11";

export function applyEnglishPickupDroppedEnergyCtr20260911(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps Creep.pickup(): Pick Up Dropped Energy",
    description:
      "Use Creep.pickup() to collect dropped Energy safely: filter RESOURCE_ENERGY, check free Store capacity, handle ERR_NOT_IN_RANGE, and revalidate changing piles.",
  };
}

export function getEnglishPickupDroppedEnergyCtrUpdatedAt20260911(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
