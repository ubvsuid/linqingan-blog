import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-first-room";
const UPDATED_AT = "2026-09-14";

export function applyEnglishFirstRoomCtr20260914(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps First Room: Editor, Console, and Room Objects",
    description:
      "Find your first Screeps Room, code editor, and Console, then identify your Spawn, Sources, Controller, and Creeps with read-only checks.",
  };
}

export function getEnglishFirstRoomCtrUpdatedAt20260914(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
