import { createEnglishArticleIndex } from "@/lib/english-article-browser";
import { englishDiscoveryArticles } from "@/lib/english-discovery";

export const dynamic = "force-static";

export function GET() {
  return Response.json(createEnglishArticleIndex(englishDiscoveryArticles), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Language": "en",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
