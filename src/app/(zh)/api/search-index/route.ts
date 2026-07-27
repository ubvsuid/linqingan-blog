import { NextResponse } from "next/server";

import { getSearchDocuments } from "@/lib/search";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(getSearchDocuments(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Language": "zh-CN",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
