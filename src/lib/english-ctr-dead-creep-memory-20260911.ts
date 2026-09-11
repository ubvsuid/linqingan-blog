import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-clean-dead-creep-memory";

export function applyEnglishDeadCreepMemoryCtr20260911(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps: Clean Dead Creep Memory Safely",
    description:
      "Clean stale Memory.creeps entries by comparing them with Game.creeps. Delete only confirmed dead names and keep custom task indexes in sync.",
  };
}
