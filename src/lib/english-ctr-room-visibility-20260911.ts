import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-room-visibility";

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
