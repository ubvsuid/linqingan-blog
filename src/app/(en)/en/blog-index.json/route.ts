import { createEnglishArticleIndex } from "@/lib/english-article-browser";
import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { englishEditorialFourthArticleOverrides20260814 } from "@/lib/english-editorial-fourth-20260814";

export const dynamic = "force-static";

function applyFourthEditorialIndexMetadata() {
  return englishDiscoveryArticles.map((article) => {
    const slug = article.href.split("/").pop() ?? "";
    const override = englishEditorialFourthArticleOverrides20260814[slug];

    if (!override || slug === "screeps-creep-harvest-energy") return article;

    return {
      ...article,
      ...(override.title ? { title: override.title } : {}),
      ...(override.description ? { description: override.description } : {}),
      ...(override.category ? { category: override.category } : {}),
      ...(override.readingTime ? { readingTime: override.readingTime } : {}),
      ...(override.keywords ? { keywords: override.keywords } : {}),
      ...(override.primaryKeyword ? { primaryKeyword: override.primaryKeyword } : {}),
      ...(override.searchIntent ? { searchIntent: override.searchIntent } : {}),
      ...(typeof override.finalScore === "number" ? { finalScore: override.finalScore } : {}),
      updatedAt: "2026-08-14",
    };
  });
}

export function GET() {
  return Response.json(
    createEnglishArticleIndex(applyFourthEditorialIndexMetadata()),
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Language": "en",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
