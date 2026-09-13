import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-introduction";
const UPDATED_AT = "2026-09-13";

export function applyEnglishIntroductionCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "What Is Screeps? JavaScript MMO Strategy Game",
    description:
      "Learn what Screeps is, how JavaScript controls a persistent MMO world each tick, and how Rooms, Creeps, Spawns, Sources, Controllers, Game, and Memory connect.",
  };
}

export function getEnglishIntroductionCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
