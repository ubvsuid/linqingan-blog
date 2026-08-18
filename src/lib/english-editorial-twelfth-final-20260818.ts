import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

function upsertVerification(
  verification: Array<[string, string]>,
  row: [string, string],
): Array<[string, string]> {
  return [
    ...verification.filter(([term]) => term !== row[0]),
    row,
  ];
}

export function applyEnglishEditorialTwelfthFinal20260818(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return article;

  if (article.slug === "screeps-introduction") {
    return {
      ...article,
      verification: upsertVerification(
        article.verification,
        ["Publication status", "Ready"],
      ),
    };
  }

  if (article.slug === "screeps-tick-game-loop") {
    return {
      ...article,
      verification: upsertVerification(
        article.verification,
        ["Game-loop model", "Checked"],
      ),
    };
  }

  return article;
}
