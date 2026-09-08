import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-pathfinder-costmatrix";

export function applyEnglishPathfinderCtrBatch01A20260908(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps CostMatrix 255: Why It Means Unwalkable",
    headline: "What CostMatrix 255 Means in Screeps PathFinder",
    description:
      "In Screeps PathFinder, a CostMatrix cost of 255 is unwalkable. See what 0, 1–254, and 255 mean, plus practical road, obstacle, and roomCallback rules.",
  };
}
