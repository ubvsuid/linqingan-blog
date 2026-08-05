import { englishSearchDocuments } from "@/lib/english-search";
import { toolCount } from "@/lib/tool-catalog";

export const dynamic = "force-static";

export function GET() {
  const articleCount = englishSearchDocuments.filter((document) => document.type === "Article").length;
  const indexedToolCount = englishSearchDocuments.filter((document) => document.type === "Tool").length;

  return Response.json(englishSearchDocuments, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Language": "en",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Search-Index-Total": String(englishSearchDocuments.length),
      "X-Search-Index-Articles": String(articleCount),
      "X-Search-Index-Public-Tools": String(toolCount),
      "X-Search-Index-Tool-Documents": String(indexedToolCount),
    },
  });
}
