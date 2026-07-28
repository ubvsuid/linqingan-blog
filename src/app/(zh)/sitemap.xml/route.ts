import {
  getChineseSitemapEntries,
  getEnglishSitemapEntries,
  getLatestSitemapDate,
  renderSitemapIndexXml,
} from "@/lib/sitemaps";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const chineseEntries = getChineseSitemapEntries();
  const englishEntries = getEnglishSitemapEntries();
  const body = renderSitemapIndexXml([
    {
      url: `${siteConfig.url}/sitemap-zh.xml`,
      lastModified: getLatestSitemapDate(chineseEntries),
    },
    {
      url: `${siteConfig.url}/sitemap-en.xml`,
      lastModified: getLatestSitemapDate(englishEntries),
    },
  ]);

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
