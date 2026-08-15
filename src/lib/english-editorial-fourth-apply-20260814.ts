import type { EnglishBeginnerArticle } from "./english-beginner-content";
import { englishEditorialFourthArticleOverrides20260814 } from "./english-editorial-fourth-20260814";

export function applyEnglishEditorialFourth20260814(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article) return undefined;

  const override = englishEditorialFourthArticleOverrides20260814[article.slug];
  if (!override) return article;

  return {
    ...article,
    ...override,
  };
}
