import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-tick-game-loop";
const UPDATED_AT = "2026-09-11";

export function applyEnglishTickGameLoopCtr20260911(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps Tick: How module.exports.loop Runs Every Tick",
    description:
      "Learn how Screeps ticks work, why module.exports.loop runs every tick, how Game.time changes, what persists, and why action results appear on later ticks.",
  };
}

export function getEnglishTickGameLoopCtrUpdatedAt20260911(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
