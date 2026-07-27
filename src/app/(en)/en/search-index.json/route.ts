import { englishSearchDocuments } from "@/lib/english-search";

export const dynamic = "force-static";

export function GET() {
  return Response.json(englishSearchDocuments, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Language": "en",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
