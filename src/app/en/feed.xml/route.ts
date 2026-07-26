import { englishDiscoveryArticles } from "@/lib/english-discovery";
import { siteConfig } from "@/lib/site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = englishDiscoveryArticles
    .map((article) => {
      const url = `${siteConfig.url}${article.href}`;
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <description>${escapeXml(article.description)}</description>
          <category>${escapeXml(article.moduleTitle)}</category>
          <pubDate>${new Date(`${article.updatedAt}T00:00:00Z`).toUTCString()}</pubDate>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>Linqingan English Screeps Guides</title>
        <link>${siteConfig.url}/en</link>
        <description>Verified English Screeps tutorials, debugging guides, references, and tools.</description>
        <language>en-US</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
