import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-room-visibility";
const UPDATED_AT = "2026-09-11";

export function applyEnglishRoomVisibilityCtr20260911(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps: Why Game.rooms[roomName] Is Undefined",
    description:
      "Learn why Game.rooms[roomName] is undefined without current room vision, how to guard live Room reads, and why Memory.rooms does not prove visibility.",
  };
}

export function getEnglishRoomVisibilityCtrUpdatedAt20260911(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
