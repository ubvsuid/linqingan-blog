import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-first-room-code";
const UPDATED_AT = "2026-09-13";

export function applyEnglishFirstRoomCodeCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps First Room Code: Harvester, Upgrader & Builder",
    description:
      "Build a Screeps first-room loop with Harvester, Upgrader, and Builder roles, one validated Spawn request, stable Energy phases, and visible failures.",
  };
}

export function getEnglishFirstRoomCodeCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
