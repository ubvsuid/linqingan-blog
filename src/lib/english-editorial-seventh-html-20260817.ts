import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const SELECTED_SLUGS = new Set([
  "screeps-creep-harvest-energy",
  "screeps-upgrade-controller",
  "screeps-first-extension",
]);

export function normalizeEnglishEditorialSeventhHtml20260817(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  return {
    ...article,
    articleHtml: article.articleHtml
      .replaceAll("energyCapacity <= 0", "energyCapacity &lt;= 0")
      .replaceAll("freeEnergy < harvestBatch", "freeEnergy &lt; harvestBatch"),
  };
}
