import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const SELECTED_SLUGS = new Set([
  "screeps-first-room-code",
  "screeps-room-visibility",
  "screeps-global-cache",
]);

export function applyEnglishEditorialEleventhCleanup20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || !SELECTED_SLUGS.has(article.slug)) return article;

  const chineseRows = article.verification.filter(
    ([term]) => term === "Chinese source article",
  );
  const currentChineseRow = chineseRows[chineseRows.length - 1];

  const verification = article.verification.filter(([term]) => {
    if (term === "Chinese source article") return false;
    if (
      term.startsWith("Live ")
      && term !== "Live multi-tick verification pending"
    ) {
      return false;
    }
    return true;
  });

  return {
    ...article,
    verification: currentChineseRow
      ? [currentChineseRow, ...verification]
      : verification,
  };
}
