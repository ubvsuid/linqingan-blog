export const dynamic = "force-static";

const robots = `User-Agent: *
Allow: /

Host: https://www.linqingan.com
Sitemap: https://www.linqingan.com/sitemap.xml
`;

export function GET() {
  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
