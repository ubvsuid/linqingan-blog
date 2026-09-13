import type { EnglishBeginnerArticle } from "@/lib/english-beginner-content";

const TARGET_SLUG = "screeps-require-modules";
const UPDATED_AT = "2026-09-13";

export function applyEnglishRequireModulesCtr20260913(
  article: EnglishBeginnerArticle | undefined,
): EnglishBeginnerArticle | undefined {
  if (!article || article.slug !== TARGET_SLUG) return article;

  return {
    ...article,
    title: "Screeps Modules: require(), module.exports, and Fresh Tick Data",
    description:
      "Learn how to split Screeps code with require() and module.exports, keep one main loop, avoid stale tick objects, and design small module contracts that survive global resets.",
  };
}

export function getEnglishRequireModulesCtrUpdatedAt20260913(
  slug: string,
): string | undefined {
  return slug === TARGET_SLUG ? UPDATED_AT : undefined;
}
