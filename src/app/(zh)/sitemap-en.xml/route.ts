import {
  getEnglishSitemapEntries,
  renderSitemapXml,
} from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return new Response(renderSitemapXml(getEnglishSitemapEntries()), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
